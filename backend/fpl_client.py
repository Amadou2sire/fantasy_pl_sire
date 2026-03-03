"""
FPL API client — wraps https://fantasy.premierleague.com/api/
"""
import httpx
from typing import Optional

FPL_BASE = "https://fantasy.premierleague.com/api"

async def get_bootstrap() -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{FPL_BASE}/bootstrap-static/")
        r.raise_for_status()
        return r.json()

async def get_all_players(search: Optional[str] = None, position: Optional[str] = None) -> list[dict]:
    data = await get_bootstrap()
    teams   = {t["id"]: t["name"] for t in data["teams"]}
    pos_map = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}

    players = []
    for p in data["elements"]:
        pos_label = pos_map.get(p["element_type"], "?")
        players.append({
            "id":           p["id"],
            "name":         f"{p['first_name']} {p['second_name']}",
            "web_name":     p["web_name"],
            "team":         teams.get(p["team"], "?"),
            "position":     pos_label,
            "price":        p["now_cost"] / 10,
            "total_points": p["total_points"],
            "form":         float(p["form"] or 0),
            "selected_by":  float(p["selected_by_percent"] or 0),
            "goals":        p["goals_scored"],
            "assists":      p["assists"],
            "minutes":      p["minutes"],
            "xg":           float(p.get("expected_goals") or 0),
            "xa":           float(p.get("expected_assists") or 0),
            "clean_sheets": p["clean_sheets"],
            "bps":          p["bps"],
            "photo":        p["photo"].replace(".jpg", ".png"),
        })

    if search:
        q = search.lower()
        players = [p for p in players if q in p["name"].lower() or q in p["web_name"].lower()]
    if position and position.upper() != "ALL":
        players = [p for p in players if p["position"] == position.upper()]

    players.sort(key=lambda x: x["total_points"], reverse=True)
    return players

async def get_player_detail(player_id: int) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{FPL_BASE}/element-summary/{player_id}/")
        r.raise_for_status()
        return r.json()

async def get_fixtures(gameweek: Optional[int] = None) -> list[dict]:
    url = f"{FPL_BASE}/fixtures/"
    if gameweek:
        url += f"?event={gameweek}"
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()

async def get_fixtures_with_teams(gameweek: Optional[int] = None) -> list[dict]:
    data     = await get_bootstrap()
    teams    = {t["id"]: t for t in data["teams"]}
    fixtures = await get_fixtures(gameweek)

    result = []
    for f in fixtures:
        if f.get("finished") and not gameweek:
            continue
        home = teams.get(f["team_h"], {})
        away = teams.get(f["team_a"], {})
        result.append({
            "id":              f["id"],
            "gameweek":        f.get("event"),
            "kickoff":         f.get("kickoff_time"),
            "finished":        f.get("finished"),
            "home_team":       home.get("name", "?"),
            "away_team":       away.get("name", "?"),
            "home_score":      f.get("team_h_score"),
            "away_score":      f.get("team_a_score"),
            "home_difficulty": f.get("team_h_difficulty", 3),
            "away_difficulty": f.get("team_a_difficulty", 3),
        })
    return result

async def get_current_gameweek() -> dict:
    data = await get_bootstrap()
    for gw in data["events"]:
        if gw["is_current"]:
            return gw
    for gw in data["events"]:
        if gw["is_next"]:
            return gw
    return data["events"][-1]

async def get_all_gameweeks() -> list[dict]:
    data = await get_bootstrap()
    return data["events"]

async def get_top_players(limit: int = 20, position: Optional[str] = None) -> list[dict]:
    players = await get_all_players(position=position)
    return players[:limit]

async def get_latest_dream_team() -> dict:
    current_gw = await get_current_gameweek()
    gw_id = current_gw.get("id", 1)
    
    data = {"team": []}
    async with httpx.AsyncClient(timeout=15) as client:
        # Try current GW
        r = await client.get(f"{FPL_BASE}/dream-team/{gw_id}/")
        if r.status_code == 200:
            data = r.json()
            
        # If current GW has no dream team yet (e.g. not finished or 404), try previous
        if r.status_code != 200 or not data.get("team"):
            if gw_id > 1:
                gw_id -= 1
                r2 = await client.get(f"{FPL_BASE}/dream-team/{gw_id}/")
                if r2.status_code == 200:
                    data = r2.json()

    all_players = await get_all_players()
    player_dict = {p["id"]: p for p in all_players}
    
    enriched_team = []
    for pick in data.get("team", []):
        p_id = pick["element"]
        p_info = player_dict.get(p_id, {})
        enriched_team.append({
            "id": p_id,
            "name": p_info.get("web_name", "Unknown"),
            "position": p_info.get("position", "Unknown"),
            "points": pick["points"],
            "team": p_info.get("team", "Unknown"),
            "pos_number": pick["position"]
        })
        
    return {
        "gameweek": gw_id,
        "team": enriched_team
    }
