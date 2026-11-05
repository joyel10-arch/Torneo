from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class NotificationType(str, enum.Enum):
    tournament_created = "tournament_created"
    registration_opened = "registration_opened"
    registration_closed = "registration_closed"
    fixtures_generated = "fixtures_generated"
    match_reminder = "match_reminder"
    result_finalized = "result_finalized"
    tournament_completed = "tournament_completed"
    conflict_detected = "conflict_detected"
    general = "general"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"), nullable=True)
    type = Column(SAEnum(NotificationType), default=NotificationType.general)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    tournament = relationship("Tournament", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    tournament_id = Column(String, ForeignKey("tournaments.id"), nullable=True)
    event_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=True)
    entity_id = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
    tournament = relationship("Tournament", back_populates="audit_logs")
