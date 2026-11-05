from sqlalchemy import Column, String, Integer, DateTime, Enum as SAEnum, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class TournamentStatus(str, enum.Enum):
    draft = "draft"
    registration_open = "registration_open"
    registration_closed = "registration_closed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class TournamentFormat(str, enum.Enum):
    single_elimination = "single_elimination"
    round_robin = "round_robin"
    league_then_knockout = "league_then_knockout"


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    sport = Column(String, default="Football", nullable=False)
    description = Column(Text, nullable=True)
    season = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_deadline = Column(DateTime, nullable=True)
    venue_group = Column(String, nullable=True)
    max_teams = Column(Integer, default=8, nullable=False)
    format = Column(SAEnum(TournamentFormat), default=TournamentFormat.single_elimination, nullable=False)
    status = Column(SAEnum(TournamentStatus), default=TournamentStatus.draft, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    teams = relationship("TournamentTeam", back_populates="tournament", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="tournament", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="tournament")
    audit_logs = relationship("AuditLog", back_populates="tournament")
