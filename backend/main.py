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

@app.get("/api/dream-team/next")
async def predicted_dream_team():
    """
    Returns the predicted best 11 (1 GKP, 4 DEF, 4 MID, 2 FWD)
    for the next gameweek, ranked by our prediction engine.
    """
    data = await fpl.get_bootstrap()
    raw_fixtures = await fpl.get_fixtures()

    pos_map = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
    teams   = {t["id"]: t["short_name"] for t in data["teams"]}

    next_gw_event = next((e["id"] for e in data["events"] if e.get("is_next")), None)
    if not next_gw_event:
        next_gw_event = next((e["id"] for e in data["events"] if e.get("is_current")), 1)

    team_fdr: dict = {}
    for f in raw_fixtures:
        if f.get("event") == next_gw_event:
            team_fdr[f["team_h"]] = f.get("team_h_difficulty", 3)
            team_fdr[f["team_a"]] = f.get("team_a_difficulty", 3)

    scored = []
    for p in data["elements"]:
        # Tâche 4: prend en compte la blessure, la suspension (status != 'a')
        if p.get("status") != "a":
            continue
            
        team_id = p["team"]
        # Tâche 4: pas de match (si l'équipe n'a pas de fixture dans le prochain GW)
        if team_id not in team_fdr:
            continue

        form = float(p.get("form") or 0)
        ict  = float(p.get("ict_index") or 0)
        xg   = float(p.get("expected_goals") or 0)
        xa   = float(p.get("expected_assists") or 0)
        
        # Improvement: consider chance of playing
        chance_of_playing = p.get("chance_of_playing_next_round")
        chance_mult = 1.0
        if chance_of_playing is not None:
            chance_mult = chance_of_playing / 100.0

        base = (form * 0.4) + (ict * 0.3) + ((xg + xa) * 5 * 0.3) + 2.0
        fdr  = team_fdr.get(team_id, 3)
        mult = 1.0 + ((3 - fdr) * 0.25)
        pts  = round(max(0.0, base * mult * chance_mult), 1)
        
        scored.append({
            "id":               p["id"],
            "web_name":         p["web_name"],
            "team":             teams.get(team_id, "?"),
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
    Calculates predicted points for each player for the upcoming gameweek.
    Formula: (form*0.4 + ict_index*0.3 + (xG+xA)*5*0.3) × FDR_multiplier
    """
    data = await fpl.get_bootstrap()
    raw_fixtures = await fpl.get_fixtures()

    # Build team FDR map for the next gameweek
    next_gw_event = next((e["id"] for e in data["events"] if e.get("is_next")), None)
    if not next_gw_event:
        next_gw_event = next((e["id"] for e in data["events"] if e.get("is_current")), 1)

    # Map team_id → FDR for next GW
    team_fdr: dict = {}
    for f in raw_fixtures:
        if f.get("event") == next_gw_event:
            h_id = f["team_h"]
            a_id = f["team_a"]
            team_fdr[h_id] = f.get("team_h_difficulty", 3)
            team_fdr[a_id] = f.get("team_a_difficulty", 3)

    results = []
    for p in data["elements"]:
        form       = float(p.get("form") or 0)
        ict        = float(p.get("ict_index") or 0)
        xg         = float(p.get("expected_goals") or 0)
        xa         = float(p.get("expected_assists") or 0)
        status     = p.get("status", "a")
        team_id    = p["team"]

        if status == "u":        # unavailable
            predicted = 0.0
        else:
            base = (form * 0.4) + (ict * 0.3) + ((xg + xa) * 5 * 0.3) + 2.0
            fdr  = team_fdr.get(team_id, 3)
            mult = 1.0 + ((3 - fdr) * 0.25)
            predicted = round(max(0.0, base * mult), 1)

        results.append({
            "player_id":        p["id"],
            "gameweek":         next_gw_event,
            "predicted_points": predicted,
            "prediction_date":  datetime.utcnow().isoformat(),
        })

    results.sort(key=lambda x: x["predicted_points"], reverse=True)
    return results

@app.get("/api/user-team/{team_id}")
async def user_team(team_id: int, gameweek: Optional[int] = Query(None)):
    """Fetches a specific user's team picks for comparison."""
    result = await fpl.get_user_team(team_id, gameweek)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

class AdviceRequest(BaseModel):
    question: str

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
async def ai_advice(body: AdviceRequest):
    try:
        return {"answer": await ai.get_ai_advice(body.question)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/compare")
async def ai_compare(body: CompareRequest):
    try:
        return {"answer": await ai.compare_players_ai(body.players)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
