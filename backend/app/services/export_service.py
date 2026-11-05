"""
Export service: CSV export for standings, fixtures, reports.
"""
import io
import csv
from sqlalchemy.orm import Session
from app.models.match import Match, MatchStatus
from app.models.team import TournamentTeam
from app.models.tournament import Tournament
from app.services.ranking_service import recalculate_standings


def export_standings_csv(db: Session, tournament_id: str) -> str:
    standings = recalculate_standings(db, tournament_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Team", "MP", "W", "D", "L", "GS", "GC", "GD", "Pts"])
    for s in standings:
        gd = s["goals_scored"] - s["goals_conceded"]
        writer.writerow([
            s["rank"], s["team_name"],
            s["matches_played"], s["wins"], s["draws"], s["losses"],
            s["goals_scored"], s["goals_conceded"], gd, s["points"],
        ])
    return output.getvalue()


def export_fixtures_csv(db: Session, tournament_id: str) -> str:
    matches = (
        db.query(Match)
        .filter(Match.tournament_id == tournament_id)
        .order_by(Match.round_number, Match.match_number)
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Match ID", "Round", "Home Team", "Away Team", "Home Score", "Away Score", "Status", "Scheduled At", "Venue"])
    for m in matches:
        writer.writerow([
            m.id, m.round_name or f"Round {m.round_number}",
            m.home_team.name if m.home_team else "TBD",
            m.away_team.name if m.away_team else "TBD",
            m.home_score if m.home_score is not None else "",
            m.away_score if m.away_score is not None else "",
            m.status.value,
            m.scheduled_at.isoformat() if m.scheduled_at else "",
            m.venue.name if m.venue else "",
        ])
    return output.getvalue()


def export_report_csv(db: Session, tournament_id: str) -> str:
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        return "Tournament not found"

    completed_matches = db.query(Match).filter(
        Match.tournament_id == tournament_id,
        Match.status == MatchStatus.completed,
    ).count()
    total_matches = db.query(Match).filter(Match.tournament_id == tournament_id).count()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Torneo Tournament Report"])
    writer.writerow(["Tournament", tournament.name])
    writer.writerow(["Sport", tournament.sport])
    writer.writerow(["Season", tournament.season or ""])
    writer.writerow(["Status", tournament.status.value])
    writer.writerow(["Total Matches", total_matches])
    writer.writerow(["Completed Matches", completed_matches])
    writer.writerow([])
    writer.writerow(["--- Standings ---"])

    standings = recalculate_standings(db, tournament_id)
    writer.writerow(["Rank", "Team", "MP", "W", "D", "L", "GS", "GC", "GD", "Pts"])
    for s in standings:
        gd = s["goals_scored"] - s["goals_conceded"]
        writer.writerow([
            s["rank"], s["team_name"],
            s["matches_played"], s["wins"], s["draws"], s["losses"],
            s["goals_scored"], s["goals_conceded"], gd, s["points"],
        ])
    return output.getvalue()
