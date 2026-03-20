"""FastAPI backend — FPL Dashboard"""
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import fpl_client as fpl
import ai_advisor as ai
from datetime import datetime
from sqlalchemy.orm import Session
from database import engine, get_db, SessionLocal
import models
from fastapi import Depends

# Create tables
models.Base.metadata.create_all(bind=engine)

dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

app = FastAPI(title="FPL Dashboard API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/gameweek/current")
async def current_gameweek():
    return await fpl.get_current_gameweek()

@app.get("/api/gameweeks")
async def all_gameweeks():
    return await fpl.get_all_gameweeks()

@app.get("/api/players")
async def players(
    search:   Optional[str] = Query(None),
    position: Optional[str] = Query(None),
    limit:    int           = Query(50, ge=1, le=200),
):
    result = await fpl.get_players_with_history(search=search, position=position)
    return result[:limit]

@app.get("/api/players/{player_id}")
async def player_detail(player_id: int):
    try:
        return await fpl.get_player_detail(player_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/fixtures")
async def fixtures(gameweek: Optional[int] = Query(None)):
    return await fpl.get_fixtures_with_teams(gameweek=gameweek)

@app.get("/api/dream-team")
async def dream_team():
    """
    Tâche 3: Affiche les joueurs avec les points en realtime si possible.
    """
    return await fpl.get_latest_dream_team_live()

def calculate_player_prediction(p, team_fdr, dream_team_ids, pos_map):
    """
    Advanced prediction formula for FPL points.
    Corrected to use per-match stats instead of season totals.
    """
    status = p.get("status")
    if status not in ("a", "d"):
        return 0.0

    chance = p.get("chance_of_playing_next_round")
    if chance is None: chance = 100
    chance_mult = chance / 100.0

    # Fields such as xg, xa, ict in elements are SEASON TOTALS.
    # We must use per_90 or calculate per match versions to avoid huge numbers.
    form   = float(p.get("form") or 0)
    ppg    = float(p.get("points_per_game") or 0)
    xg_p90 = float(p.get("expected_goals_per_90") or 0)
    xa_p90 = float(p.get("expected_assists_per_90") or 0)
    ict_p90 = float(p.get("ict_index_per_90") or 0)
    
    team_id = p["team"]
    pos_id  = p["element_type"]
    pos_label = pos_map.get(pos_id, "MID")

    # 1. Base potential: combination of season average and short-term form
    # Both PPG and Form are per-match metrics.
    base_potential = (form * 0.4) + (ppg * 0.3) + 1.0

    # 2. Offensive threat using per 90 stats (scaled by 0.75 to reflect average playtime)
    # xG is worth 4 (FWD/MID) to 6 (DEF), xA is 3.
    goal_weight = 5.0 if pos_label == "MID" else 6.0 if pos_label == "DEF" else 4.0
    returns_potential = (xg_p90 * goal_weight + xa_p90 * 3.0) * 0.75

    # 3. ICT influence (per 90)
    ict_influence = ict_p90 * 0.1

    # Raw score for one match
    score = base_potential + returns_potential + ict_influence

    # Momentum bonus
    if p["id"] in dream_team_ids:
        score *= 1.05

    # Fixture influence
    fixture = team_fdr.get(team_id)
    if not fixture: return 0.0
    
    difficulty = fixture["difficulty"]
    is_home    = fixture["is_home"]

    if pos_label in ("GKP", "DEF"):
        # Very sensitive to FDR for clean sheets
        fdr_mult = 1.0 + (3 - difficulty) * 0.25
    else:
        fdr_mult = 1.0 + (3 - difficulty) * 0.15

    home_mult = 1.10 if is_home else 0.95

    return round(max(0.0, score * fdr_mult * home_mult * chance_mult), 1)

@app.get("/api/dream-team/next")
async def predicted_dream_team():
    """
    Returns the predicted best 11 for the next gameweek.
    Uses the improved prediction engine.
    """
    data = await fpl.get_bootstrap()
    raw_fixtures = await fpl.get_fixtures()
    
    # Get current dream team IDs for the "momentum bonus"
    current_dt = await fpl.get_latest_dream_team_live()
    dream_team_ids = {p["id"] for p in current_dt.get("team", [])}

    pos_map = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
    teams   = {t["id"]: t["short_name"] for t in data["teams"]}

    next_gw_event = next((e["id"] for e in data["events"] if e.get("is_next")), None)
    if not next_gw_event:
        next_gw_event = next((e["id"] for e in data["events"] if e.get("is_current")), 1)

    # Map team_id → {difficulty, is_home} for next GW
    team_fdr: dict = {}
    for f in raw_fixtures:
        if f.get("event") == next_gw_event:
            team_fdr[f["team_h"]] = {"difficulty": f.get("team_h_difficulty", 3), "is_home": True}
            team_fdr[f["team_a"]] = {"difficulty": f.get("team_a_difficulty", 3), "is_home": False}

    scored = []
    for p in data["elements"]:
        pts = calculate_player_prediction(p, team_fdr, dream_team_ids, pos_map)
        if pts <= 0: continue

        scored.append({
            "id":               p["id"],
            "web_name":         p["web_name"],
            "team":             teams.get(p["team"], "?"),
            "position":         pos_map.get(p["element_type"], "?"),
            "predicted_points": pts,
        })

    # Pick best by position: 1 GKP, 4 DEF, 4 MID, 2 FWD
    quota = {"GKP": 1, "DEF": 4, "MID": 4, "FWD": 2}
    by_pos = {pos: sorted([p for p in scored if p["position"] == pos],
                          key=lambda x: x["predicted_points"], reverse=True)
              for pos in quota}

    team = []
    for pos, count in quota.items():
        for p in by_pos[pos][:count]:
            team.append({**p, "pos_slot": pos})

    return {"gameweek": next_gw_event, "team": team}

@app.get("/api/teams")
async def teams():
    """Returns all Premier League teams from the FPL bootstrap."""
    data = await fpl.get_bootstrap()
    return data.get("teams", [])

@app.get("/api/predictions")
async def predictions():
    """
    Calculates predicted points for each player for the upcoming gameweek using the advanced engine.
    """
    data = await fpl.get_bootstrap()
    raw_fixtures = await fpl.get_fixtures()
    
    current_dt = await fpl.get_latest_dream_team_live()
    dream_team_ids = {p["id"] for p in current_dt.get("team", [])}
    pos_map = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}

    # Build team FDR map for the next gameweek
    next_gw_event = next((e["id"] for e in data["events"] if e.get("is_next")), None)
    if not next_gw_event:
        next_gw_event = next((e["id"] for e in data["events"] if e.get("is_current")), 1)

    team_fdr: dict = {}
    for f in raw_fixtures:
        if f.get("event") == next_gw_event:
            team_fdr[f["team_h"]] = {"difficulty": f.get("team_h_difficulty", 3), "is_home": True}
            team_fdr[f["team_a"]] = {"difficulty": f.get("team_a_difficulty", 3), "is_home": False}

    results = []
    for p in data["elements"]:
        pts = calculate_player_prediction(p, team_fdr, dream_team_ids, pos_map)
        
        results.append({
            "player_id":        p["id"],
            "gameweek":         next_gw_event,
            "predicted_points": pts,
            "prediction_date":  datetime.utcnow().isoformat(),
        })

    results.sort(key=lambda x: x["predicted_points"], reverse=True)
    return results

@app.get("/api/user-team/{team_id}")
async def user_team(team_id: int, gameweek: Optional[int] = Query(None)):
    """Fetches a specific user's team picks and enriches with predictions."""
    result = await fpl.get_user_team(team_id, gameweek)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Enrich with predicted points for next GW
    # 1. Get predictions using the same engine
    all_preds = await predictions()
    pred_map = {p["player_id"]: p["predicted_points"] for p in all_preds}
    
    # 2. Map to team
    for player in result.get("team", []):
        player["predicted_points"] = pred_map.get(player["id"], 0.0)
        
    return result

class AdviceRequest(BaseModel):
    question: str
    team_id: Optional[int] = None
    league_id: Optional[int] = None



class CompareRequest(BaseModel):
    players: list[str]

class TemplateTeamCreate(BaseModel):
    name: str
    players: list[dict]
    total_predicted_points: float

@app.post("/api/templates")
async def save_template(template: TemplateTeamCreate, db: Session = Depends(get_db)):
    db_template = models.TemplateTeam(
        name=template.name,
        players=template.players,
        total_predicted_points=template.total_predicted_points
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.get("/api/templates")
async def get_templates(db: Session = Depends(get_db)):
    return db.query(models.TemplateTeam).order_by(models.TemplateTeam.created_at.desc()).all()

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: int, db: Session = Depends(get_db)):
    db_template = db.query(models.TemplateTeam).filter(models.TemplateTeam.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template non trouvé")
    db.delete(db_template)
    db.commit()
    return {"message": "Template supprimé"}

@app.post("/api/ai/advice")
async def ai_advice(body: AdviceRequest, db: Session = Depends(get_db)):
    try:
        return {"answer": await ai.get_ai_advice(body.question, team_id=body.team_id, league_id=body.league_id, db=db)}
    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/compare")
async def ai_compare(body: CompareRequest):
    try:
        return {"answer": await ai.compare_players_ai(body.players)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/league/{league_id}")
async def league_standings(league_id: int):
    """Returns the standings for a classic league."""
    result = await fpl.get_league_standings(league_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/league/{league_id}/compare/{user_id}")
async def compare_league_top(league_id: int, user_id: int):
    """Compares the user team with the top 5 of a league."""
    standings = await fpl.get_league_standings(league_id)
    if "error" in standings:
        raise HTTPException(status_code=404, detail=standings["error"])
    
    top_entries = standings.get("standings", {}).get("results", [])[:5]
    
    user_team_data = await fpl.get_user_team(user_id)
    
    comparison = []
    for entry in top_entries:
        e_id = entry["entry"]
        # Basic comparison - we could fetch full teams but that might be slow
        # For now, let's just get the points metadata
        comparison.append({
            "rank": entry["rank"],
            "player_name": entry["player_name"],
            "entry_name": entry["entry_name"],
            "total_points": entry["total"],
            "event_total": entry["event_total"], # Points in last event
            "entry_id": e_id
        })
    
    return {
        "user": {
            "name": user_team_data.get("team_name"),
            "total_points": next((r["total"] for r in standings.get("standings", {}).get("results", []) if r["entry"] == user_id), 0),
            "gw_points": user_team_data.get("total_points", 0)
        },
        "top_5": comparison
    }

@app.get("/api/user-history/{team_id}")
async def user_history(team_id: int):
    """Returns the history of gameweeks for a user."""
    return await fpl.get_user_history(team_id)
