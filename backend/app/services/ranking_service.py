"""
Ranking service: computes standings from match results and sorts with Bubble Sort.
"""
from sqlalchemy.orm import Session
from app.models.match import Match, MatchStatus
from app.models.team import TournamentTeam
from app.algorithms.bubble_sort import bubble_sort_teams


def recalculate_standings(db: Session, tournament_id: str) -> list[dict]:
    """
    Recalculate standings for a tournament from match results.
    Returns sorted standings using Bubble Sort.
    """
    tt_list = (
        db.query(TournamentTeam)
        .filter(TournamentTeam.tournament_id == tournament_id)
        .all()
    )
    if not tt_list:
        return []

    # Reset stats
    stats: dict[str, dict] = {}
    for tt in tt_list:
        stats[tt.team_id] = {
            "team_id": tt.team_id,
            "team_name": tt.team.name if tt.team else tt.team_id,
            "short_code": tt.team.short_code if tt.team else "",
            "logo_url": tt.team.logo_url if tt.team else None,
            "matches_played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "goals_scored": 0,
            "goals_conceded": 0,
            "points": 0,
        }

    # Aggregate from completed matches
    completed = (
        db.query(Match)
        .filter(
            Match.tournament_id == tournament_id,
            Match.status == MatchStatus.completed,
            Match.is_bye == False,
        )
        .all()
    )

    for m in completed:
        if m.home_score is None or m.away_score is None:
            continue
        home_id = m.home_team_id
        away_id = m.away_team_id
        if home_id not in stats or away_id not in stats:
            continue

        stats[home_id]["matches_played"] += 1
        stats[away_id]["matches_played"] += 1
        stats[home_id]["goals_scored"] += m.home_score
        stats[home_id]["goals_conceded"] += m.away_score
        stats[away_id]["goals_scored"] += m.away_score
        stats[away_id]["goals_conceded"] += m.home_score

        if m.home_score > m.away_score:
            stats[home_id]["wins"] += 1
            stats[home_id]["points"] += 3
            stats[away_id]["losses"] += 1
        elif m.away_score > m.home_score:
            stats[away_id]["wins"] += 1
            stats[away_id]["points"] += 3
            stats[home_id]["losses"] += 1
        else:
            stats[home_id]["draws"] += 1
            stats[away_id]["draws"] += 1
            stats[home_id]["points"] += 1
            stats[away_id]["points"] += 1

    team_list = list(stats.values())
    result = bubble_sort_teams(team_list)
    sorted_teams = result["sorted_teams"]

    # Persist ranks back to TournamentTeam
    tt_map = {tt.team_id: tt for tt in tt_list}
    for s in sorted_teams:
        tt = tt_map.get(s["team_id"])
        if tt:
            tt.rank = s["rank"]
            tt.matches_played = s["matches_played"]
            tt.wins = s["wins"]
            tt.draws = s["draws"]
            tt.losses = s["losses"]
            tt.goals_scored = s["goals_scored"]
            tt.goals_conceded = s["goals_conceded"]
            tt.points = s["points"]
            db.add(tt)
    db.flush()

    return sorted_teams
