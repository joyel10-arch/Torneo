"""
Rankings, venues, analytics and notifications API.
"""
import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.models.venue import Venue
from app.models.match import Match, MatchStatus
from app.models.tournament import Tournament
from app.models.notification import Notification, AuditLog
from app.models.team import TournamentTeam
from app.api.auth import get_current_user, require_organizer
from app.models.user import User

rankings_router = APIRouter(tags=["rankings"])
venues_router = APIRouter(prefix="/venues", tags=["venues"])
analytics_router = APIRouter(tags=["analytics"])
notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])


# --- Rankings ---
@rankings_router.get("/tournaments/{tournament_id}/standings")
def get_standings(tournament_id: str, db: Session = Depends(get_db)):
    from app.services.ranking_service import recalculate_standings
    standings = recalculate_standings(db, tournament_id)
    db.commit()
    return standings


@rankings_router.post("/tournaments/{tournament_id}/rankings/sort")
def sort_rankings(
    tournament_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.ranking_service import recalculate_standings
    from app.algorithms.bubble_sort import bubble_sort_teams
    from app.models.match import MatchStatus

    tt_list = db.query(TournamentTeam).filter(TournamentTeam.tournament_id == tournament_id).all()
    team_list = [
        {
            "team_id": tt.team_id,
            "team_name": tt.team.name if tt.team else tt.team_id,
            "points": tt.points,
            "goals_scored": tt.goals_scored,
            "goals_conceded": tt.goals_conceded,
            "wins": tt.wins,
            "draws": tt.draws,
            "losses": tt.losses,
            "matches_played": tt.matches_played,
        }
        for tt in tt_list
    ]
    result = bubble_sort_teams(team_list)
    db.commit()
    return result


@rankings_router.get("/tournaments/{tournament_id}/rankings/analysis")
def rankings_analysis(tournament_id: str, db: Session = Depends(get_db)):
    from app.algorithms.bubble_sort import bubble_sort_teams
    tt_list = db.query(TournamentTeam).filter(TournamentTeam.tournament_id == tournament_id).all()
    team_list = [
        {
            "team_id": tt.team_id,
            "team_name": tt.team.name if tt.team else tt.team_id,
            "points": tt.points,
            "goals_scored": tt.goals_scored,
            "goals_conceded": tt.goals_conceded,
            "wins": tt.wins,
            "draws": tt.draws,
            "losses": tt.losses,
            "matches_played": tt.matches_played,
        }
        for tt in tt_list
    ]
    return bubble_sort_teams(team_list)


@rankings_router.post("/tournaments/{tournament_id}/rankings/search")
def binary_search_rankings(
    tournament_id: str,
    team_name: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Binary search for a team in sorted standings. Input must first be sorted by points/GD."""
    from app.algorithms.bubble_sort import bubble_sort_teams
    from app.algorithms.binary_search import binary_search_teams
    tt_list = db.query(TournamentTeam).filter(TournamentTeam.tournament_id == tournament_id).all()
    if not tt_list:
        raise HTTPException(status_code=404, detail="No teams in this tournament")
    team_list = [
        {
            "team_id": tt.team_id,
            "team_name": tt.team.name if tt.team else tt.team_id,
            "points": tt.points,
            "goals_scored": tt.goals_scored,
            "goals_conceded": tt.goals_conceded,
            "wins": tt.wins, "draws": tt.draws, "losses": tt.losses,
            "matches_played": tt.matches_played,
        }
        for tt in tt_list
    ]
    # Sort first using bubble sort, then binary search on name alphabetically
    sorted_result = bubble_sort_teams(team_list)
    sorted_teams = sorted_result["sorted_teams"]
    # Build name-sorted list for binary search
    name_sorted = sorted(sorted_teams, key=lambda t: t["team_name"].lower())
    result = binary_search_teams(name_sorted, team_name, "team_name")
    return result


export_router = APIRouter(tags=["export"])

# --- Venues ---
class VenueCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    location: Optional[str] = None
    capacity: Optional[int] = None
    notes: Optional[str] = None


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    is_available: Optional[bool] = None
    notes: Optional[str] = None


def _venue_dict(v: Venue, db: Session) -> dict:
    match_count = db.query(Match).filter(Match.venue_id == v.id).count()
    return {
        "id": v.id,
        "name": v.name,
        "location": v.location,
        "capacity": v.capacity,
        "is_available": v.is_available,
        "notes": v.notes,
        "match_count": match_count,
        "created_at": v.created_at.isoformat() if v.created_at else None,
    }


@venues_router.get("")
def list_venues(db: Session = Depends(get_db)):
    return [_venue_dict(v, db) for v in db.query(Venue).all()]


@venues_router.post("", status_code=status.HTTP_201_CREATED)
def create_venue(payload: VenueCreate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    v = Venue(id=str(uuid.uuid4()), name=payload.name, location=payload.location, capacity=payload.capacity, notes=payload.notes)
    db.add(v)
    db.commit()
    db.refresh(v)
    return _venue_dict(v, db)


@venues_router.get("/{venue_id}")
def get_venue(venue_id: str, db: Session = Depends(get_db)):
    v = db.query(Venue).filter(Venue.id == venue_id).first()
    if not v:
        raise HTTPException(404, "Venue not found")
    return _venue_dict(v, db)


@venues_router.patch("/{venue_id}")
def update_venue(venue_id: str, payload: VenueUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    v = db.query(Venue).filter(Venue.id == venue_id).first()
    if not v:
        raise HTTPException(404, "Venue not found")
    for k, val in payload.model_dump(exclude_none=True).items():
        setattr(v, k, val)
    v.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(v)
    return _venue_dict(v, db)


@venues_router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(venue_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_organizer)):
    v = db.query(Venue).filter(Venue.id == venue_id).first()
    if not v:
        raise HTTPException(404, "Venue not found")
    if v.matches:
        raise HTTPException(400, "Cannot delete venue with scheduled matches")
    db.delete(v)
    db.commit()


# --- Analytics ---
@analytics_router.get("/tournaments/{tournament_id}/analytics")
def get_analytics(tournament_id: str, db: Session = Depends(get_db)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")

    total = db.query(Match).filter(Match.tournament_id == tournament_id).count()
    completed = db.query(Match).filter(Match.tournament_id == tournament_id, Match.status == MatchStatus.completed).count()
    upcoming = db.query(Match).filter(Match.tournament_id == tournament_id, Match.status == MatchStatus.scheduled).count()

    goals = db.query(Match).filter(Match.tournament_id == tournament_id, Match.status == MatchStatus.completed, Match.is_bye == False).all()
    total_goals = sum((m.home_score or 0) + (m.away_score or 0) for m in goals)
    avg_goals = total_goals / completed if completed > 0 else 0

    team_count = db.query(TournamentTeam).filter(TournamentTeam.tournament_id == tournament_id).count()

    # Round distribution
    from sqlalchemy import func
    round_dist = db.query(Match.round_name, func.count(Match.id)).filter(Match.tournament_id == tournament_id).group_by(Match.round_name).all()

    return {
        "tournament_id": tournament_id,
        "tournament_name": t.name,
        "status": t.status.value,
        "team_count": team_count,
        "total_matches": total,
        "completed_matches": completed,
        "upcoming_matches": upcoming,
        "completion_pct": round(completed / total * 100, 1) if total > 0 else 0,
        "total_goals": total_goals,
        "avg_goals_per_match": round(avg_goals, 2),
        "round_distribution": [{"round": r, "count": c} for r, c in round_dist],
    }


# --- Export routes ---
export_router = APIRouter(tags=["exports"])


@export_router.get("/tournaments/{tournament_id}/export/standings")
def export_standings(tournament_id: str, db: Session = Depends(get_db)):
    from app.services.export_service import export_standings_csv
    csv_data = export_standings_csv(db, tournament_id)
    db.commit()
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=standings_{tournament_id}.csv"},
    )


@export_router.get("/tournaments/{tournament_id}/export/fixtures")
def export_fixtures(tournament_id: str, db: Session = Depends(get_db)):
    from app.services.export_service import export_fixtures_csv
    csv_data = export_fixtures_csv(db, tournament_id)
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=fixtures_{tournament_id}.csv"},
    )


@export_router.get("/tournaments/{tournament_id}/export/report")
def export_report(tournament_id: str, db: Session = Depends(get_db)):
    from app.services.export_service import export_report_csv
    csv_data = export_report_csv(db, tournament_id)
    db.commit()
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{tournament_id}.csv"},
    )


# --- Notifications ---
@notifications_router.get("")
def list_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    )
    if unread_only:
        q = q.filter(Notification.is_read == False)
    notifs = q.order_by(Notification.created_at.desc()).limit(50).all()
    return [
        {
            "id": n.id,
            "type": n.type.value,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "tournament_id": n.tournament_id,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@notifications_router.patch("/{notif_id}/read")
def mark_read(notif_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(404, "Notification not found")
    n.is_read = True
    db.commit()
    return {"id": n.id, "is_read": True}


@notifications_router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id == None)
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
