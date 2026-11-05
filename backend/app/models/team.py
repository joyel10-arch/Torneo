from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    short_code = Column(String, nullable=True)
    sport = Column(String, default="Football", nullable=False)
    college = Column(String, nullable=True)
    coach = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tournament_teams = relationship("TournamentTeam", back_populates="team")
    home_matches = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    away_matches = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")
    won_matches = relationship("Match", foreign_keys="Match.winner_id", back_populates="winner")


class TournamentTeam(Base):
    """Junction table: team participation in a tournament, with tournament-specific stats."""
    __tablename__ = "tournament_teams"

    id = Column(String, primary_key=True, index=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"), nullable=False, index=True)
    team_id = Column(String, ForeignKey("teams.id"), nullable=False, index=True)
    seed = Column(Integer, nullable=True)
    # League stats (recalculated from matches)
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    draws = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    goals_scored = Column(Integer, default=0)
    goals_conceded = Column(Integer, default=0)
    points = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    tournament = relationship("Tournament", back_populates="teams")
    team = relationship("Team", back_populates="tournament_teams")
