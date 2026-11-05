from sqlalchemy import Column, String, Integer, DateTime, Enum as SAEnum, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class MatchStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    postponed = "postponed"
    cancelled = "cancelled"
    bye = "bye"


class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, index=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    round_name = Column(String, nullable=True)
    match_number = Column(Integer, nullable=True)

    home_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    away_team_id = Column(String, ForeignKey("teams.id"), nullable=True)
    winner_id = Column(String, ForeignKey("teams.id"), nullable=True)

    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    home_penalties = Column(Integer, nullable=True)
    away_penalties = Column(Integer, nullable=True)

    scheduled_at = Column(DateTime, nullable=True)
    venue_id = Column(String, ForeignKey("venues.id"), nullable=True)
    status = Column(SAEnum(MatchStatus), default=MatchStatus.scheduled, nullable=False)
    notes = Column(Text, nullable=True)
    is_bye = Column(Boolean, default=False)

    # Tree / bracket relationships
    parent_match_id = Column(String, ForeignKey("matches.id"), nullable=True)
    home_feeder_match_id = Column(String, ForeignKey("matches.id"), nullable=True)
    away_feeder_match_id = Column(String, ForeignKey("matches.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tournament = relationship("Tournament", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_matches")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_matches")
    winner = relationship("Team", foreign_keys=[winner_id], back_populates="won_matches")
    venue = relationship("Venue", back_populates="matches")

    parent_match = relationship("Match", foreign_keys=[parent_match_id], remote_side="Match.id", backref="children")
    home_feeder = relationship("Match", foreign_keys=[home_feeder_match_id], remote_side="Match.id", post_update=True)
    away_feeder = relationship("Match", foreign_keys=[away_feeder_match_id], remote_side="Match.id", post_update=True)
