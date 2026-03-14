from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import sys
import os
import uvicorn
import logging

# Ensures we can import sibling folders (data, engine) if run from the api folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.fpl_pipeline import FPLPipeline
from data.stats_calculator import StatsCalculator
from engine.scorer import PredictionEngine

logger = logging.getLogger('StatFantasy_API')
logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="StatFantasy API",
    description="Backend API for the FPL Analytics and Prediction Dashboard",
    version="1.0.0"
)

# Enable CORS for the local React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory cache for fast dev turnaround (Mocking the PostgreSQL DB)
memory_db = {
    "teams": None,
    "players": None,
    "gameweeks": None,
    "fixtures": None,
    "predictions": None,
    "enriched_players": None
}

@app.on_event("startup")
async def startup_event():
    """Initializes the data layer on startup. (Simulates DB population)"""
    logger.info("Initializing Data Pipeline to warm up cache...")
    try:
        pipeline = FPLPipeline()
        data = pipeline.run_full_extraction()
        
        memory_db["teams"] = data["teams"]
        memory_db["players"] = data["players"]
        memory_db["gameweeks"] = data["gameweeks"]
        memory_db["fixtures"] = data["fixtures"]
        
        # Calculate Advanced Stats
        calc = StatsCalculator(players_df=data["players"], fixtures_df=data["fixtures"])
        memory_db["enriched_players"] = calc.compute_composite_score()
        
        # Determine next Gameweek
        next_gw = 1
        gws = data["gameweeks"]
        next_gw_row = gws[gws["is_next"] == True]
        if not next_gw_row.empty:
            next_gw = int(next_gw_row.iloc[0]["id"])
            
        # Run predictions
        engine = PredictionEngine(
            enriched_players_df=memory_db["enriched_players"], 
            fixtures_df=data["fixtures"]
        )
        memory_db["predictions"] = engine.generate_predictions(next_gw=next_gw)
        
        logger.info(f"API Backend Ready. Next Gameweek is GW{next_gw}")
        
    except Exception as e:
        logger.error(f"Failed to initialize backend data: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the StatFantasy REST API"}

@app.get("/api/teams")
def get_teams():
    if memory_db["teams"] is None:
        raise HTTPException(status_code=503, detail="Database not ready")
    return memory_db["teams"].to_dict(orient="records")

@app.get("/api/players")
def get_players():
    """Returns the enriched player list including xG, xA, and custom form."""
    if memory_db["enriched_players"] is None:
         raise HTTPException(status_code=503, detail="Database not ready")
    
    # We replace NaN with None for valid JSON serialization
    df_clean = memory_db["enriched_players"].replace({float('nan'): None})
    return df_clean.to_dict(orient="records")

@app.get("/api/fixtures")
def get_fixtures():
    if memory_db["fixtures"] is None:
        raise HTTPException(status_code=503, detail="Database not ready")
    return memory_db["fixtures"].to_dict(orient="records")

@app.get("/api/predictions")
def get_predictions():
    """Returns the predicted points for all players for the upcoming Gameweek."""
    if memory_db["predictions"] is None:
         raise HTTPException(status_code=503, detail="Predictions not ready")
    
    df_clean = memory_db["predictions"].replace({float('nan'): None})
    # Optional formatting date to string
    if 'prediction_date' in df_clean.columns:
         df_clean['prediction_date'] = df_clean['prediction_date'].astype(str)
         
    return df_clean.to_dict(orient="records")

@app.get("/api/gameweeks")
def get_gameweeks():
    if memory_db["gameweeks"] is None:
        raise HTTPException(status_code=503, detail="Database not ready")
    df_clean = memory_db["gameweeks"].replace({float('nan'): None})
    return df_clean.to_dict(orient="records")

if __name__ == "__main__":
    logger.info("Starting local Uvicorn Server on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
