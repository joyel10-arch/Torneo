"""
Audit log and notification helpers.
"""
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import AuditLog, Notification, NotificationType


def log_event(
    db: Session,
    event_type: str,
    description: str,
    user_id: str | None = None,
    tournament_id: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    import json
    entry = AuditLog(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tournament_id=tournament_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        metadata_json=json.dumps(metadata) if metadata else None,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.flush()
    return entry


def create_notification(
    db: Session,
    title: str,
    message: str,
    notif_type: NotificationType = NotificationType.general,
    user_id: str | None = None,
    tournament_id: str | None = None,
) -> Notification:
    n = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tournament_id=tournament_id,
        type=notif_type,
        title=title,
        message=message,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(n)
    db.flush()
    return n
