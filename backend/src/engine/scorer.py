import pandas as pd
import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger('StatFantasy_Scorer')
logging.basicConfig(level=logging.INFO)

class PredictionEngine:
    """
    Backend Specialist Module:
    Prediction engine that computes expected points per gameweek for each player.
    It combines form, xG/xA (from the calculator), and FDR (Fixture Difficulty Rating).
    """

    def __init__(self, enriched_players_df: pd.DataFrame, fixtures_df: pd.DataFrame):
        self.players_df = enriched_players_df
        # Ensure we have active fixtures for FDR calculation
        self.fixtures_df = fixtures_df

    def calculate_fixture_multiplier(self, team_id: int, next_gw_fixtures: pd.DataFrame) -> float:
        """
        Calculates a multiplier based on the difficulty of the next fixture.
        FPL FDR goes from 1 (very easy) to 5 (very hard).
        Multiplier > 1.0 means easier fixture, < 1.0 means harder.
        """
        # Find the team's fixture
        team_fixture = next_gw_fixtures[
            (next_gw_fixtures['team_h'] == team_id) | (next_gw_fixtures['team_a'] == team_id)
        ]
        
        if team_fixture.empty:
            # Blank gameweek (no fixture) -> 0 points expected
            return 0.0
            
        # Get FDR: If home team, look at team_h_difficulty, else team_a_difficulty
        # Actually for FPL, if you are team A, you look at team_h as your opponent.
        # But FDR provided by FPL usually means 'difficulty of this match for this team'.
        # We'll use a simplified mock logic assuming FDR is in a column 'fdr'
        
        # Simplified for mock: 
        # (5 - FDR) / 2 : FDR 2 => 1.5 multiplier. FDR 4 => 0.5 multiplier. FDR 3 => 1.0 multiplier.
        fdr = 3 # default average difficulty
        
        # We mock fetching the FDR
        try:
            is_home = (team_fixture['team_h'].values[0] == team_id)
            if is_home:
                fdr = team_fixture['team_a_difficulty'].values[0]
            else:
                fdr = team_fixture['team_h_difficulty'].values[0]
        except Exception:
            pass

        # Limit FDR between 1 and 5
        fdr = max(1, min(5, fdr))
        
        # Convert FDR to a multiplier (centered around 3 = 1.0x)
        # FDR 1 -> 1.5x | FDR 2 -> 1.25x | FDR 3 -> 1.0x | FDR 4 -> 0.75x | FDR 5 -> 0.5x
        multiplier = 1.0 + ((3 - fdr) * 0.25)
        return multiplier

    def generate_predictions(self, next_gw: int) -> pd.DataFrame:
        """
        Generates point predictions for the specified Gameweek.
        """
        logger.info(f"Generating predictions for Gameweek {next_gw}...")
        
        # Copy to avoid SettingWithCopyWarning
        predictions = self.players_df.copy()
        
        # Filter fixtures for the next gameweek
        # Mocking next_gw_fixtures if 'event' column exists
        next_gw_fixtures = pd.DataFrame()
        if 'event' in self.fixtures_df.columns:
            next_gw_fixtures = self.fixtures_df[self.fixtures_df['event'] == next_gw]
        
        predicted_points = []
        
        for idx, player in predictions.iterrows():
            # 1. Base Score = custom_form_momentum (calculated by Data Specialist)
            # We assume custom_form_momentum is roughly a point scale (e.g. 2.0 to 10.0)
            base_score = float(player.get('custom_form_momentum', 2.0))
            
            # 2. Add baseline points for playing 60+ minutes (assumed average 2 points)
            is_active = player.get('is_active', True)
            if not is_active:
                predicted_points.append(0.0)
                continue
                
            base_score += 2.0 
            
            # 3. Apply Fixture Difficulty Multiplier
            team_id = player.get('team_id', 0)
            fdr_multiplier = self.calculate_fixture_multiplier(team_id, next_gw_fixtures)
            
            # 4. Final calculation
            final_pred = base_score * fdr_multiplier
            
            # Format and cap
            final_pred = round(max(0.0, final_pred), 1)
            predicted_points.append(final_pred)

        predictions['predicted_points'] = predicted_points
        predictions['gameweek'] = next_gw
        predictions['prediction_date'] = datetime.now()
        
        # Select final columns to match DB schema (table: predictions)
        final_df = predictions[['id', 'gameweek', 'predicted_points', 'prediction_date']]
        final_df = final_df.rename(columns={'id': 'player_id'})
        
        logger.info(f"Predictions generated for {len(final_df)} players.")
        return final_df

if __name__ == "__main__":
    # Test Runner
    dummy_players = pd.DataFrame({
        'id': [1, 2, 3],
        'web_name': ['Haaland', 'Salah', 'Saliba'],
        'team_id': [10, 11, 1],
        'custom_form_momentum': [7.5, 6.2, 3.8],
        'is_active': [True, True, True]
    })
    
    dummy_fixtures = pd.DataFrame({
        'event': [5, 5, 5],
        'team_h': [10, 1, 12],
        'team_a': [5, 11, 15],
        'team_h_difficulty': [2, 3, 2],
        'team_a_difficulty': [4, 4, 3] # Apparement team A (5) a une diff 4
    })
    
    engine = PredictionEngine(enriched_players_df=dummy_players, fixtures_df=dummy_fixtures)
    predictions_df = engine.generate_predictions(next_gw=5)
    
    print("\n--- Predictions pour GW 5 ---")
    
    # Merge back names for the print
    display_df = predictions_df.merge(dummy_players[['id', 'web_name']], left_on='player_id', right_on='id')
    print(display_df[['web_name', 'predicted_points']])
