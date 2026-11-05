"""
Teams API routes.
"""
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.models.team import Team, TournamentTeam
from app.models.tournament import Tournament, TournamentStatus
from app.api.auth import get_current_user, require_organizer
from app.models.user import User
from app.services.audit_service import log_event

router = APIRouter(tags=["teams"])


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    short_code: Optional[str] = None
    sport: str = "Football"
    college: Optional[str] = None
    coach: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short_code: Optional[str] = None
    sport: Optional[str] = None
    college: Optional[str] = None
    coach: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None


def _team_dict(t: Team) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "short_code": t.short_code,
        "sport": t.sport,
        "college": t.college,
        "coach": t.coach,
        "contact_email": t.contact_email,
        "logo_url": t.logo_url,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


# --- Global team routes ---
teams_router = APIRouter(prefix="/teams", tags=["teams"])


@teams_router.get("")
def list_teams(
    sport: Optional[str] = Query(None),
    college: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    sort_by: str = Query("name"),
    db: Session = Depends(get_db),
):
    query = db.query(Team)
    if sport:
        query = query.filter(Team.sport == sport)
    if college:
        query = query.filter(Team.college.ilike(f"%{college}%"))
    if q:
        query = query.filter(Team.name.ilike(f"%{q}%"))
    teams = query.all()
    return [_team_dict(t) for t in teams]


@teams_router.get("/search")
def search_teams(
    q: str = Query(min_length=1),
    sort_key: str = Query(default="name"),
    db: Session = Depends(get_db),
):
    """Binary search on alphabetically sorted teams by name."""
    from app.algorithms.binary_search import binary_search_teams
    all_teams = db.query(Team).order_by(Team.name).all()
    team_dicts = [{"team_id": t.id, "team_name": t.name, "college": t.college} for t in all_teams]
    result = binary_search_teams(team_dicts, q, "team_name")
    return result


@teams_router.post("", status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    existing = db.query(Team).filter(Team.name == payload.name).first()
    if existing:
        raise HTTPException(400, f"Team with name '{payload.name}' already exists")
    t = Team(
        id=str(uuid.uuid4()),
        name=payload.name,
        short_code=payload.short_code,
        sport=payload.sport,
        college=payload.college,
        coach=payload.coach,
        contact_email=payload.contact_email,
        logo_url=payload.logo_url,
    )
    db.add(t)
    log_event(db, "team_created", f"Team '{t.name}' created", user_id=current_user.id, entity_type="team", entity_id=t.id)
    db.commit()
    db.refresh(t)
    return _team_dict(t)


@teams_router.get("/{team_id}")
def get_team(team_id: str, db: Session = Depends(get_db)):
    t = db.query(Team).filter(Team.id == team_id).first()
    if not t:
        raise HTTPException(404, "Team not found")
    return _team_dict(t)


@teams_router.patch("/{team_id}")
def update_team(
    team_id: str,
    payload: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    t = db.query(Team).filter(Team.id == team_id).first()
    if not t:
        raise HTTPException(404, "Team not found")
    updates = payload.model_dump(exclude_none=True)
    if "name" in updates:
        dup = db.query(Team).filter(Team.name == updates["name"], Team.id != team_id).first()
        if dup:
            raise HTTPException(400, f"Team name '{updates['name']}' is already taken")
    for k, v in updates.items():
        setattr(t, k, v)
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return _team_dict(t)


@teams_router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    t = db.query(Team).filter(Team.id == team_id).first()
    if not t:
        raise HTTPException(404, "Team not found")
    if t.tournament_teams:
        raise HTTPException(400, "Cannot delete team that is registered in tournaments. Remove from tournaments first.")
    db.delete(t)
    db.commit()


# --- Tournament-scoped team routes ---
tournament_teams_router = APIRouter(tags=["tournament-teams"])


class RegisterTeamPayload(BaseModel):
    team_id: str
    seed: Optional[int] = None


@tournament_teams_router.get("/tournaments/{tournament_id}/teams")
def list_tournament_teams(tournament_id: str, db: Session = Depends(get_db)):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    tt_list = db.query(TournamentTeam).filter(TournamentTeam.tournament_id == tournament_id).all()
    return [
        {
            "id": tt.id,
            "tournament_id": tt.tournament_id,
            "team_id": tt.team_id,
            "team_name": tt.team.name if tt.team else None,
            "short_code": tt.team.short_code if tt.team else None,
            "logo_url": tt.team.logo_url if tt.team else None,
            "college": tt.team.college if tt.team else None,
            "seed": tt.seed,
            "rank": tt.rank,
            "matches_played": tt.matches_played,
            "wins": tt.wins,
            "draws": tt.draws,
            "losses": tt.losses,
            "goals_scored": tt.goals_scored,
            "goals_conceded": tt.goals_conceded,
            "points": tt.points,
            "registered_at": tt.registered_at.isoformat() if tt.registered_at else None,
        }
        for tt in tt_list
    ]


@tournament_teams_router.post("/tournaments/{tournament_id}/teams", status_code=status.HTTP_201_CREATED)
def register_team(
    tournament_id: str,
    payload: RegisterTeamPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    if t.status not in (TournamentStatus.draft, TournamentStatus.registration_open):
        raise HTTPException(400, f"Cannot register teams when tournament is '{t.status.value}'")
    if len(t.teams) >= t.max_teams:
        raise HTTPException(400, f"Tournament is full (max {t.max_teams} teams)")

    team = db.query(Team).filter(Team.id == payload.team_id).first()
    if not team:
        raise HTTPException(404, "Team not found")

    existing = db.query(TournamentTeam).filter(
        TournamentTeam.tournament_id == tournament_id,
        TournamentTeam.team_id == payload.team_id,
    ).first()
    if existing:
        raise HTTPException(400, "Team already registered in this tournament")

    tt = TournamentTeam(
        id=str(uuid.uuid4()),
        tournament_id=tournament_id,
        team_id=payload.team_id,
        seed=payload.seed,
    )
    db.add(tt)
    log_event(db, "team_registered", f"Team '{team.name}' registered in '{t.name}'", tournament_id=tournament_id, entity_type="team", entity_id=payload.team_id)
    db.commit()
    db.refresh(tt)
    return {"id": tt.id, "team_id": tt.team_id, "tournament_id": tt.tournament_id, "seed": tt.seed}


@tournament_teams_router.delete("/tournaments/{tournament_id}/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_from_tournament(
    tournament_id: str,
    team_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")
    if t.status == TournamentStatus.in_progress:
        raise HTTPException(400, "Cannot remove teams while tournament is in progress")
    tt = db.query(TournamentTeam).filter(
        TournamentTeam.tournament_id == tournament_id,
        TournamentTeam.team_id == team_id,
    ).first()
    if not tt:
        raise HTTPException(404, "Team not registered in this tournament")
    db.delete(tt)
    db.commit()
