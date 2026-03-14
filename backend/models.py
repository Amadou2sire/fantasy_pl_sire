from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from database import Base
import datetime

class TemplateTeam(Base):
    __tablename__ = "template_teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    players = Column(JSON)  # Store list of player IDs and names
    total_predicted_points = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
