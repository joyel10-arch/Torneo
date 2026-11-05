from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    organizer = "organizer"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.viewer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
