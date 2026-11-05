from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    capacity = Column(Integer, nullable=True)
    is_available = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    matches = relationship("Match", back_populates="venue")
