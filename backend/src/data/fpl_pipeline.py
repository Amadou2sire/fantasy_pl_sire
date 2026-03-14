import requests
import pandas as pd
import logging
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('StatFantasy_Data_Pipeline')

class FPLPipeline:
    """
    Data Specialist Module:
    Responsible for fetching and transforming data from the official FPL API
    to fit the DB Schema defined by the Architect (teams, players, gameweeks, fixtures).
    """

    BASE_URL = "https://fantasy.premierleague.com/api"

    def __init__(self):
        self.session = requests.Session()
        # Custom User-Agent to prevent FPL from blocking the requests
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json"
        })

    def fetch_bootstrap_static(self) -> Dict[str, Any]:
        """Fetches the core static data: teams, players, and gameweeks."""
        url = f"{self.BASE_URL}/bootstrap-static/"
        logger.info(f"Fetching {url}")
        res = self.session.get(url)
        res.raise_for_status()
        return res.json()

    def fetch_fixtures(self) -> List[Dict[str, Any]]:
        """Fetches all fixtures for the season (played and upcoming)."""
        url = f"{self.BASE_URL}/fixtures/"
        logger.info(f"Fetching {url}")
        res = self.session.get(url)
        res.raise_for_status()
        return res.json()

    def fetch_player_summary(self, player_id: int) -> Dict[str, Any]:
        """Fetches historic and upcoming gameweek data for a specific player."""
        url = f"{self.BASE_URL}/element-summary/{player_id}/"
        logger.debug(f"Fetching summary for player ID: {player_id}")
        res = self.session.get(url)
        res.raise_for_status()
        return res.json()

    def process_teams(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Transforms 'teams' array into a pandas DataFrame matching the schema."""
        teams = data.get("teams", [])
        df = pd.DataFrame(teams)
        # Select and rename columns based on db_schema.md
        df_clean = df[['id', 'name', 'short_name', 'strength', 
                       'strength_attack_home', 'strength_attack_away', 
                       'strength_defence_home', 'strength_defence_away']]
        logger.info(f"Processed {len(df_clean)} teams.")
        return df_clean

    def process_players(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Transforms 'elements' (players) array into a pandas DataFrame."""
        players = data.get("elements", [])
        df = pd.DataFrame(players)
        # Map element_type: 1=GK, 2=DEF, 3=MID, 4=FWD
        df_clean = pd.DataFrame({
            'id': df['id'],
            'first_name': df['first_name'],
            'second_name': df['second_name'],
            'web_name': df['web_name'],
            'team_id': df['team'],
            'element_type': df['element_type'],
            'status': df['status'],
            'is_active': (df['status'] != 'u') # simplistic logic
        })
        logger.info(f"Processed {len(df_clean)} players.")
        return df_clean

    def process_gameweeks(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Transforms 'events' (gameweeks) array into a pandas DataFrame."""
        events = data.get("events", [])
        df = pd.DataFrame(events)
        df_clean = df[['id', 'name', 'deadline_time', 'is_current', 'is_next', 'finished']]
        logger.info(f"Processed {len(df_clean)} gameweeks.")
        return df_clean

    def run_full_extraction(self):
        """Orchestrates a full data pull from FPL."""
        logger.info("Starting Full Data Extraction...")
        
        # 1. Fetch main dataset
        static_data = self.fetch_bootstrap_static()
        
        # 2. Extract DataFrames
        df_teams = self.process_teams(static_data)
        df_players = self.process_players(static_data)
        df_gws = self.process_gameweeks(static_data)
        
        # 3. Fetch fixtures
        raw_fixtures = self.fetch_fixtures()
        df_fixtures = pd.DataFrame(raw_fixtures)
        df_fixtures_clean = df_fixtures[['id', 'event', 'team_h', 'team_a', 
                                         'team_h_difficulty', 'team_a_difficulty', 
                                         'kickoff_time', 'started', 'finished']]
        logger.info(f"Processed {len(df_fixtures_clean)} fixtures.")

        # At this stage in the pipeline we would save to PostgreSQL using SQLAlchemy or raw psycopg2.
        # e.g., df_teams.to_sql('teams', con=engine, if_exists='replace', index=False)
        
        logger.info("Full Data Extraction pipeline completed successfully!")
        
        return {
            "teams": df_teams,
            "players": df_players,
            "gameweeks": df_gws,
            "fixtures": df_fixtures_clean
        }

if __name__ == "__main__":
    pipeline = FPLPipeline()
    try:
        data_bundle = pipeline.run_full_extraction()
        print("\n--- Pipeline Summary ---")
        for key, df in data_bundle.items():
            print(f"[{key}] : {len(df)} records loaded in memory.")
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
