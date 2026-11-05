"""
Matches, bracket, tree and graph API routes.
"""
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from app.db.session import get_db
from app.models.match import Match, MatchStatus
from app.models.tournament import Tournament, TournamentStatus
from app.models.team import TournamentTeam
from app.api.auth import get_current_user, require_organizer
from app.models.user import User
from app.services.audit_service import log_event, create_notification
from app.models.notification import NotificationType

router = APIRouter(tags=["matches"])


def _match_dict(m: Match) -> dict:
    return {
        "id": m.id,
        "tournament_id": m.tournament_id,
        "round_number": m.round_number,
        "round_name": m.round_name,
        "match_number": m.match_number,
        "home_team_id": m.home_team_id,
        "away_team_id": m.away_team_id,
        "home_team_name": m.home_team.name if m.home_team else None,
        "away_team_name": m.away_team.name if m.away_team else None,
        "home_team_logo": m.home_team.logo_url if m.home_team else None,
        "away_team_logo": m.away_team.logo_url if m.away_team else None,
        "home_score": m.home_score,
        "away_score": m.away_score,
        "home_penalties": m.home_penalties,
        "away_penalties": m.away_penalties,
        "winner_id": m.winner_id,
        "winner_name": m.winner.name if m.winner else None,
        "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
        "venue_id": m.venue_id,
        "venue_name": m.venue.name if m.venue else None,
        "status": m.status.value,
        "notes": m.notes,
        "is_bye": m.is_bye,
        "parent_match_id": m.parent_match_id,
        "home_feeder_match_id": m.home_feeder_match_id,
        "away_feeder_match_id": m.away_feeder_match_id,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "updated_at": m.updated_at.isoformat() if m.updated_at else None,
    }


# --- Tournament matches ---
@router.get("/tournaments/{tournament_id}/matches")
def list_matches(
    tournament_id: str,
    round_number: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    team_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Match).filter(Match.tournament_id == tournament_id)
    if round_number:
        q = q.filter(Match.round_number == round_number)
    if status_filter:
        q = q.filter(Match.status == status_filter)
    if team_id:
        q = q.filter((Match.home_team_id == team_id) | (Match.away_team_id == team_id))
    matches = q.order_by(Match.round_number, Match.match_number).all()
    return [_match_dict(m) for m in matches]


@router.get("/matches/{match_id}")
def get_match(match_id: str, db: Session = Depends(get_db)):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(404, "Match not found")
    return _match_dict(m)


class MatchUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    venue_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[MatchStatus] = None


@router.patch("/matches/{match_id}")
def update_match(
    match_id: str,
    payload: MatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(404, "Match not found")
    if m.status == MatchStatus.completed:
        raise HTTPException(400, "Cannot update a completed match. Use the result correction workflow.")

    # Venue conflict check
    if payload.venue_id and payload.scheduled_at:
        conflict = db.query(Match).filter(
            Match.venue_id == payload.venue_id,
            Match.scheduled_at == payload.scheduled_at,
            Match.id != match_id,
        ).first()
        if conflict:
            raise HTTPException(400, f"Venue conflict: another match ({conflict.id}) is scheduled at the same time and venue.")

    updates = payload.model_dump(exclude_none=True)
    for k, v in updates.items():
        setattr(m, k, v)
    m.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(m)
    return _match_dict(m)


class ResultPayload(BaseModel):
    home_score: int = Field(ge=0)
    away_score: int = Field(ge=0)
    home_penalties: Optional[int] = Field(None, ge=0)
    away_penalties: Optional[int] = Field(None, ge=0)


@router.post("/matches/{match_id}/result")
def submit_result(
    match_id: str,
    payload: ResultPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(404, "Match not found")
    if m.is_bye:
        raise HTTPException(400, "Cannot enter result for a bye match")
    if not m.home_team_id or not m.away_team_id:
        raise HTTPException(400, "Both teams must be set before entering a result")

    tournament = db.query(Tournament).filter(Tournament.id == m.tournament_id).first()
    is_knockout = tournament.format.value == "single_elimination"

    # Knockout draws require penalty shootout; round-robin allows draws
    if (is_knockout and
            payload.home_score == payload.away_score and
            payload.home_penalties is None):
        raise HTTPException(400, "Knockout draw requires penalty scores. Provide home_penalties and away_penalties.")

    m.home_score = payload.home_score
    m.away_score = payload.away_score
    m.home_penalties = payload.home_penalties
    m.away_penalties = payload.away_penalties

    # Determine winner
    if payload.home_score > payload.away_score:
        m.winner_id = m.home_team_id
    elif payload.away_score > payload.home_score:
        m.winner_id = m.away_team_id
    else:
        if is_knockout:
            # Knockout: penalty tie-breaker
            if payload.home_penalties is not None and payload.away_penalties is not None:
                if payload.home_penalties > payload.away_penalties:
                    m.winner_id = m.home_team_id
                elif payload.away_penalties > payload.home_penalties:
                    m.winner_id = m.away_team_id
                else:
                    raise HTTPException(400, "Penalty scores cannot be equal")
            else:
                raise HTTPException(400, "Could not determine winner")
        else:
            # Round-robin: draw is valid — no winner, each team gets 1 point
            m.winner_id = None

    m.status = MatchStatus.completed
    m.updated_at = datetime.utcnow()

    # Advance winner
    from app.services.bracket_service import advance_winner
    advance_winner(db, m)

    # Recalculate standings
    from app.services.ranking_service import recalculate_standings
    recalculate_standings(db, m.tournament_id)

    log_event(db, "result_finalized", f"Result: {m.home_team.name if m.home_team else '?'} {m.home_score}-{m.away_score} {m.away_team.name if m.away_team else '?'}", tournament_id=m.tournament_id, user_id=current_user.id, entity_type="match", entity_id=m.id)
    create_notification(db, "Match Result Finalized", f"Result recorded: {m.home_score}-{m.away_score}", NotificationType.result_finalized, tournament_id=m.tournament_id)

    db.commit()
    db.refresh(m)
    return _match_dict(m)


# --- Bracket generation ---
bracket_router = APIRouter(tags=["bracket"])


@bracket_router.post("/tournaments/{tournament_id}/bracket/generate")
def generate_bracket(
    tournament_id: str,
    seeded: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer),
):
    from app.services.bracket_service import generate_bracket as gen
    t = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not t:
        raise HTTPException(404, "Tournament not found")

    # Check for existing results
    from app.models.match import MatchStatus
    has_results = db.query(Match).filter(
        Match.tournament_id == tournament_id,
        Match.status == MatchStatus.completed,
    ).count() > 0
    if has_results:
        raise HTTPException(400, "Cannot regenerate bracket when completed results exist. Reset the tournament first.")

    # Delete existing matches
    db.query(Match).filter(Match.tournament_id == tournament_id).delete(synchronize_session=False)

    try:
        matches = gen(db, t, seeded=seeded)
    except ValueError as e:
        raise HTTPException(400, str(e))

    t.status = TournamentStatus.in_progress
    t.updated_at = datetime.utcnow()

    log_event(db, "bracket_generated", f"Bracket generated for '{t.name}'", tournament_id=t.id, user_id=current_user.id)
    create_notification(db, f"Bracket Generated: {t.name}", "Tournament bracket has been generated.", NotificationType.fixtures_generated, tournament_id=t.id)

    db.commit()
    return {"message": "Bracket generated successfully", "match_count": len(matches)}


@bracket_router.get("/tournaments/{tournament_id}/bracket")
def get_bracket(tournament_id: str, db: Session = Depends(get_db)):
    matches = (
        db.query(Match)
        .filter(Match.tournament_id == tournament_id)
        .order_by(Match.round_number, Match.match_number)
        .all()
    )
    # Group by round
    rounds: dict[int, list] = {}
    for m in matches:
        r = m.round_number
        if r not in rounds:
            rounds[r] = []
        rounds[r].append(_match_dict(m))

    return {
        "tournament_id": tournament_id,
        "rounds": [
            {"round_number": r, "round_name": rounds[r][0]["round_name"], "matches": rounds[r]}
            for r in sorted(rounds.keys())
        ],
        "total_matches": len(matches),
    }


# --- Tree API ---
tree_router = APIRouter(tags=["tree"])


@tree_router.get("/tournaments/{tournament_id}/tree")
def get_tree(tournament_id: str, db: Session = Depends(get_db)):
    from app.algorithms.tournament_tree import TournamentTree
    matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
    match_dicts = [_match_dict(m) for m in matches]
    tree = TournamentTree()
    tree.build_from_matches(match_dicts)
    return tree.to_dict()


@tree_router.get("/tournaments/{tournament_id}/tree/traversal")
def get_traversal(
    tournament_id: str,
    order: str = Query(default="preorder", pattern="^(preorder|inorder|postorder|level_order)$"),
    db: Session = Depends(get_db),
):
    from app.algorithms.tournament_tree import TournamentTree
    matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
    match_dicts = [_match_dict(m) for m in matches]
    tree = TournamentTree()
    tree.build_from_matches(match_dicts)

    if order == "preorder":
        result = tree.preorder()
    elif order == "inorder":
        result = tree.inorder()
    elif order == "postorder":
        result = tree.postorder()
    else:
        result = tree.level_order()

    return {"order": order, "traversal": result, "count": len(result) if isinstance(result, list) else sum(len(l) for l in result)}


# --- Graph API ---
graph_router = APIRouter(tags=["graph"])


@graph_router.get("/tournaments/{tournament_id}/graph")
def get_graph(tournament_id: str, db: Session = Depends(get_db)):
    from app.algorithms.graph_algorithms import TournamentGraph
    matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
    match_dicts = [_match_dict(m) for m in matches]
    graph = TournamentGraph()
    graph.build_from_matches(match_dicts)
    return graph.get_adjacency_list()


@graph_router.get("/tournaments/{tournament_id}/graph/adjacency-list")
def get_adj_list(tournament_id: str, db: Session = Depends(get_db)):
    from app.algorithms.graph_algorithms import TournamentGraph
    matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
    match_dicts = [_match_dict(m) for m in matches]
    graph = TournamentGraph()
    graph.build_from_matches(match_dicts)
    return graph.get_adjacency_list()


@graph_router.post("/tournaments/{tournament_id}/graph/bfs")
def run_bfs(
    tournament_id: str,
    start_match_id: str = Query(...),
    db: Session = Depends(get_db),
):
    from app.algorithms.graph_algorithms import TournamentGraph
    matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
    match_dicts = [_match_dict(m) for m in matches]
    graph = TournamentGraph()
    graph.build_from_matches(match_dicts)
    return graph.bfs(start_match_id)


@graph_router.post("/tournaments/{tournament_id}/graph/dfs")
def run_dfs(
    tournament_id: str,
    start_match_id: str = Query(...),
    db: Session = Depends(get_db),
):
    from app.algorithms.graph_algorithms import TournamentGraph
    matches = db.query(Match).filter(Match.tournament_id == tournament_id).all()
    match_dicts = [_match_dict(m) for m in matches]
    graph = TournamentGraph()
    graph.build_from_matches(match_dicts)
    return graph.dfs(start_match_id)
