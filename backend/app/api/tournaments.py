"""
Tournament CRUD API routes.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.models.tournament import Tournament, TournamentStatus, TournamentFormat
from app.models.match import Match
from app.api.auth import get_current_user, require_organizer
from app.models.user import User
from app.services.audit_service import log_event, create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/tournaments", tags=["tournaments"])


class TournamentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    sport: str = "Football"
    description: Optional[str] = None
    season: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: Optional[datetime] = None
    venue_group: Optional[str] = None
    max_teams: int = Field(default=8, ge=2, le=64)
    format: TournamentFormat = TournamentFormat.single_elimination


class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    sport: Optional[str] = None
    description: Optional[str] = None
    season: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    venue_group: Optional[str] = None
    max_teams: Optional[int] = None
    format: Optional[TournamentFormat] = None
    status: Optional[TournamentStatus] = None


def _tournament_dict(t: Tournament, db: Session) -> dict:
    total = db.query(Match).filter(Match.tournament_id == t.id).count()
    from app.models.match import MatchStatus
    completed = db.query(Match).filter(
        Match.tournament_id == t.id,
        Match.status == MatchStatus.completed,
    ).count()
    team_count = len(t.teams)
    return {
        "id": t.id,
        "name": t.name,
        "sport": t.sport,
        "description": t.description,
        "season": t.season,
        "start_date": t.start_date.isoformat() if t.start_date else None,
        "end_date": t.end_date.isoformat() if t.end_date else None,
        "registration_deadline": t.registration_deadline.isoformat() if t.registration_deadline else None,
        "venue_group": t.venue_group,
        "max_teams": t.max_teams,
        "format": t.format.value,
        "status": t.status.value,
        "team_count": team_count,
        "total_matches": total,
        "completed_matches": completed,
        "completion_pct": round(completed / total * 100) if total > 0 else 0,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }


@router.get("")
def list_tournaments(
    status: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Tournament)
    if status:
        q = q.filter(Tournament.status == status)
    if sport:
        q = q.filter(Tournament.sport == sport)
    tournaments = q.order_by(Tournament.created_at.desc()).all()
    return [_tournament_dict(t, db) for t in tournaments]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_tournament(
    payload: TournamentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    if payload.end_date <= payload.start_date:
        raise HTTPException(400, "end_date must be after start_date")
    t = Tournament(
        id=str(uuid.uuid4()),
        name=payload.name,
        sport=payload.sport,
        description=payload.description,
        season=payload.season,
        start_date=payload.start_date,
        end_date=payload.end_date,
        registration_deadline=payload.registration_deadline,
        venue_group=payload.venue_group,
        max_teams=payload.max_teams,
        format=payload.format,
        status=TournamentStatus.draft,
    )
    db.add(t)
    log_event(db, "tournament_created", f"Tournament '{t.name}' created", user_id=current_user.id, tournament_id=t.id)
    create_notification(db, f"Tournament Created: {t.name}", f"New tournament '{t.name}' has been created.", NotificationType.tournament_created, tournament_id=t.id)
    db.commit()
    db.refresh(t)
    return _tournament_dict(t, db)


@router.get("/{tournament_id}")
def get_tournament(tournament_id: str, db: Session = Depends(get_db)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    return _tournament_dict(t, db)


@router.patch("/{tournament_id}")
def update_tournament(
    tournament_id: str,
    payload: TournamentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    if t.status == TournamentStatus.completed:
        raise HTTPException(400, "Cannot modify a completed tournament")

    updates = payload.model_dump(exclude_none=True)
    for k, v in updates.items():
        setattr(t, k, v)
    t.updated_at = datetime.utcnow()

    if payload.status == TournamentStatus.registration_open:
        create_notification(db, f"Registration Open: {t.name}", f"Registration is now open for '{t.name}'.", NotificationType.registration_opened, tournament_id=t.id)
    elif payload.status == TournamentStatus.registration_closed:
        create_notification(db, f"Registration Closed: {t.name}", f"Registration has closed for '{t.name}'.", NotificationType.registration_closed, tournament_id=t.id)

    log_event(db, "tournament_updated", f"Tournament '{t.name}' updated", user_id=current_user.id, tournament_id=t.id)
    db.commit()
    db.refresh(t)
    return _tournament_dict(t, db)


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tournament(
    tournament_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    if t.status == TournamentStatus.in_progress:
        raise HTTPException(400, "Cannot delete a tournament that is in progress")
    log_event(db, "tournament_deleted", f"Tournament '{t.name}' deleted", user_id=current_user.id)
    db.delete(t)
    db.commit()


@router.get("/{tournament_id}/audit")
def get_audit_log(
    tournament_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.notification import AuditLog
    logs = db.query(AuditLog).filter(AuditLog.tournament_id == tournament_id).order_by(AuditLog.created_at.desc()).all()
    return [
        {
            "id": l.id,
            "event_type": l.event_type,
            "description": l.description,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "created_at": l.created_at.isoformat(),
            "user_id": l.user_id,
        }
        for l in logs
    ]
