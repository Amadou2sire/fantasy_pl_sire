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

async def get_players_with_history(search: Optional[str] = None, position: Optional[str] = None) -> list[dict]:
    # 1. Get base player data
    data = await get_bootstrap()
    current_gw = 1
    for gw in data["events"]:
        if gw["is_current"]:
            current_gw = gw["id"]
            break
    
    teams   = {t["id"]: t["name"] for t in data["teams"]}
    pos_map = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
    
    # 2. Fetch last 5 GW live data efficiently
    # We'll take the 5 most recent finished or current gameweeks
    recent_gws = [g["id"] for g in data["events"] if g["id"] <= current_gw and g["id"] > 0][-5:]
    
    history_map = {} # player_id -> [points1, points2, ...]
    
    async with httpx.AsyncClient(timeout=15) as client:
        for gw_id in reversed(recent_gws):
            try:
                rl = await client.get(f"{FPL_BASE}/event/{gw_id}/live/")
                if rl.status_code == 200:
                    live_data = rl.json()
                    for el in live_data.get("elements", []):
                        p_id = el["id"]
                        pts = el["stats"]["total_points"]
                        if p_id not in history_map:
                            history_map[p_id] = []
                        # Store both GW and Points
                        history_map[p_id].append({"gw": gw_id, "pts": pts})
            except:
                continue

    players = []
    for p in data["elements"]:
        p_id = p["id"]
        pos_label = pos_map.get(p["element_type"], "?")
        
        # Get history or empty
        p_history = history_map.get(p_id, [])
        # If we have less than 5, we could pad, but usually FPL has history for all.
        # Ensure we take the most recent 5
        p_history = p_history[:5]
        
        players.append({
            "id":           p_id,
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
            "points_per_game": float(p.get("points_per_game") or 0),
            "ppm": float(p.get("points_per_game") or 0), # Alias for safety
            "recent_points": p_history
        })

    if search:
        q = search.lower()
        players = [p for p in players if q in p["name"].lower() or q in p["web_name"].lower()]
    if position and position.upper() != "ALL":
        players = [p for p in players if p["position"] == position.upper()]

    players.sort(key=lambda x: x["total_points"], reverse=True)
    return players

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
            "points_per_game": float(p.get("points_per_game") or 0),
            "ppm": float(p.get("points_per_game") or 0),
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

async def get_latest_dream_team_live() -> dict:
    """
    Fetches the dream team and updates points with live data if the GW is current.
    """
    current_gw = await get_current_gameweek()
    gw_id = current_gw.get("id", 1)
    
    # Check if we should use live data
    is_live = current_gw.get("is_current") and not current_gw.get("finished")
    
    async with httpx.AsyncClient(timeout=15) as client:
        # Get official dream team for the GW
        r = await client.get(f"{FPL_BASE}/dream-team/{gw_id}/")
        data = r.json() if r.status_code == 200 else {"team": []}
        
        # Fallback to previous GW if current has no data yet
        if not data.get("team") and gw_id > 1:
            gw_id -= 1
            is_live = False
            r2 = await client.get(f"{FPL_BASE}/dream-team/{gw_id}/")
            data = r2.json() if r2.status_code == 200 else {"team": []}

        # If live, fetch live points
        live_points = {}
        if is_live:
            rl = await client.get(f"{FPL_BASE}/event/{gw_id}/live/")
            if rl.status_code == 200:
                live_data = rl.json()
                for el in live_data.get("elements", []):
                    live_points[el["id"]] = el["stats"]["total_points"]

    all_players = await get_all_players()
    player_dict = {p["id"]: p for p in all_players}
    
    enriched_team = []
    for pick in data.get("team", []):
        p_id = pick["element"]
        p_info = player_dict.get(p_id, {})
        
        # Use live points if available, otherwise official dream team points
        pts = live_points.get(p_id, pick["points"])
        
        enriched_team.append({
            "id": p_id,
            "name": p_info.get("web_name", "Unknown"),
            "web_name": p_info.get("web_name", "Unknown"),
            "position": p_info.get("position", "Unknown"),
            "points": pts,
            "team": p_info.get("team", "Unknown"),
            "pos_number": pick["position"]
        })
        
    total_points = sum(p["points"] for p in enriched_team)
        
    return {
        "gameweek": gw_id,
        "is_live": is_live,
        "team": enriched_team,
        "total_points": total_points
    }

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

async def get_user_team(team_id: int, gameweek: Optional[int] = None) -> dict:
    """
    Fetches picks for a specific user ID and gameweek.
    """
    if not gameweek:
        current_gw = await get_current_gameweek()
        gameweek = current_gw.get("id", 1)

    async with httpx.AsyncClient(timeout=15) as client:
        # Get team picks
        r = await client.get(f"{FPL_BASE}/entry/{team_id}/event/{gameweek}/picks/")
        if r.status_code != 200:
            return {"error": f"Impossible de trouver l'équipe {team_id} pour le GW {gameweek}", "team": []}
        
        data = r.json()
        
        # Always fetch points for the GW to avoid showing zeros
        current_gw = await get_current_gameweek()
        is_live = current_gw.get("id") == gameweek and not current_gw.get("finished")
        
        live_points = {}
        rl = await client.get(f"{FPL_BASE}/event/{gameweek}/live/")
        if rl.status_code == 200:
            live_data = rl.json()
            for el in live_data.get("elements", []):
                live_points[el["id"]] = el["stats"]["total_points"]

        # Get entry details for name
        re = await client.get(f"{FPL_BASE}/entry/{team_id}/")
        entry_data = re.json() if re.status_code == 200 else {}
        team_name = entry_data.get("name", f"Team {team_id}")

    all_players = await get_all_players()
    player_dict = {p["id"]: p for p in all_players}
    
    # In FPL, picks contain 15 players. Usually the first 11 are starters.
    enriched_team = []
    total_live_points = 0
    
    for pick in data.get("picks", []):
        p_id = pick["element"]
        p_info = player_dict.get(p_id, {})
        
        mult = pick.get("multiplier", 1)
        raw_pts = live_points.get(p_id, 0)
        
        p_data = {
            "id": p_id,
            "web_name": p_info.get("web_name", "Unknown"),
            "position": p_info.get("position", "Unknown"),
            "points": raw_pts * mult,
            "team": p_info.get("team", "Unknown"),
            "is_captain": pick.get("is_captain", False),
            "is_vice_captain": pick.get("is_vice_captain", False),
            "multiplier": mult,
            "starter": pick.get("position", 12) <= 11
        }
        enriched_team.append(p_data)
        if p_data["starter"]:
            total_live_points += p_data["points"]

    return {
        "gameweek": gameweek,
        "is_live": is_live,
        "team_name": team_name,
        "total_points": total_live_points,
        "team": [p for p in enriched_team if p["starter"]]
    }

async def get_league_standings(league_id: int) -> dict:
    """
    Fetches classic league standings for a given league ID.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{FPL_BASE}/leagues-classic/{league_id}/standings/")
        if r.status_code != 200:
            return {"error": f"Ligue {league_id} introuvable", "standings": {"results": []}}
        return r.json()

async def get_user_history(team_id: int) -> dict:
    """
    Fetches history of gameweeks for a specific entry ID.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"{FPL_BASE}/entry/{team_id}/history/")
        if r.status_code != 200:
            return {"error": f"Historique de l'équipe {team_id} introuvable", "current": [], "past": []}
        return r.json()
