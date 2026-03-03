"""FastAPI backend — FPL Dashboard"""
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv
import fpl_client as fpl
import ai_advisor as ai

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
    result = await fpl.get_all_players(search=search, position=position)
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
    return await fpl.get_latest_dream_team()

class AdviceRequest(BaseModel):
    question: str

class CompareRequest(BaseModel):
    players: list[str]

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
