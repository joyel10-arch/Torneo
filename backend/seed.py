"""
Torneo seed script — creates demo data for the college football tournament.
Run from backend/ directory: python seed.py
Idempotent: will skip if data already exists.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal, engine
from app.db.base import Base
import app.models  # noqa

Base.metadata.create_all(bind=engine)

import uuid
from datetime import datetime, timedelta
from app.models.user import User, UserRole
from app.models.team import Team, TournamentTeam
from app.models.tournament import Tournament, TournamentStatus, TournamentFormat
from app.models.venue import Venue
from app.models.notification import Notification, NotificationType
from app.core.security import get_password_hash

db = SessionLocal()

# --- Guard: skip if already seeded ---
if db.query(User).filter(User.email == "admin@torneo.app").first():
    print("✅ Database already seeded. Skipping.")
    db.close()
    sys.exit(0)

print("🌱 Seeding Torneo database...")

# --- Users ---
admin = User(
    id=str(uuid.uuid4()),
    email="admin@torneo.app",
    full_name="Admin User",
    hashed_password=get_password_hash("Admin@123"),
    role=UserRole.admin,
    is_active=True,
)
organizer = User(
    id=str(uuid.uuid4()),
    email="organizer@torneo.app",
    full_name="Tournament Organizer",
    hashed_password=get_password_hash("Org@123"),
    role=UserRole.organizer,
    is_active=True,
)
viewer = User(
    id=str(uuid.uuid4()),
    email="viewer@torneo.app",
    full_name="Match Viewer",
    hashed_password=get_password_hash("View@123"),
    role=UserRole.viewer,
    is_active=True,
)
db.add_all([admin, organizer, viewer])
db.flush()

# --- Venues ---
venues = [
    Venue(id=str(uuid.uuid4()), name="Main Stadium", location="Central Campus", capacity=5000, is_available=True),
    Venue(id=str(uuid.uuid4()), name="East Ground", location="East Campus", capacity=2000, is_available=True),
    Venue(id=str(uuid.uuid4()), name="West Pitch", location="West Campus", capacity=1500, is_available=True),
]
db.add_all(venues)
db.flush()

# --- Teams ---
team_data = [
    ("Thunder Eagles", "THE", "Engineering College"),
    ("Storm Wolves", "STW", "Science College"),
    ("Iron Lions", "IRL", "Arts College"),
    ("Blue Hawks", "BLH", "Commerce College"),
    ("Red Dragons", "RED", "Medical College"),
    ("Silver Foxes", "SLF", "Law College"),
    ("Golden Bulls", "GOB", "Business School"),
    ("Dark Knights", "DRK", "Architecture College"),
]

teams = []
for name, code, college in team_data:
    t = Team(
        id=str(uuid.uuid4()),
        name=name,
        short_code=code,
        sport="Football",
        college=college,
        coach=f"Coach {name.split()[0]}",
        contact_email=f"{code.lower()}@college.edu",
    )
    teams.append(t)

db.add_all(teams)
db.flush()

# --- Tournament ---
now = datetime.utcnow()
tournament = Tournament(
    id=str(uuid.uuid4()),
    name="Inter-College Football Championship 2025",
    sport="Football",
    description="Annual knockout football tournament for all college teams. 8 teams compete for the championship trophy.",
    season="2025",
    start_date=now - timedelta(days=14),
    end_date=now + timedelta(days=14),
    registration_deadline=now - timedelta(days=16),
    venue_group="Campus Grounds",
    max_teams=8,
    format=TournamentFormat.single_elimination,
    status=TournamentStatus.in_progress,
)
db.add(tournament)
db.flush()

# --- Register teams with seeds ---
tournament_teams = []
for idx, team in enumerate(teams):
    tt = TournamentTeam(
        id=str(uuid.uuid4()),
        tournament_id=tournament.id,
        team_id=team.id,
        seed=idx + 1,
        wins=0, draws=0, losses=0, goals_scored=0, goals_conceded=0, points=0, matches_played=0,
    )
    tournament_teams.append(tt)
db.add_all(tournament_teams)
db.flush()

# --- Generate bracket manually for demo (QF → SF → F) ---
from app.models.match import Match, MatchStatus

venue1_id = venues[0].id
venue2_id = venues[1].id
venue3_id = venues[2].id

# Quarter-finals (round 1)
qf1 = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=1, round_name="Quarter-Finals", match_number=1,
            home_team_id=teams[0].id, away_team_id=teams[7].id,
            home_score=3, away_score=1, winner_id=teams[0].id,
            status=MatchStatus.completed, scheduled_at=now - timedelta(days=12), venue_id=venue1_id)
qf2 = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=1, round_name="Quarter-Finals", match_number=2,
            home_team_id=teams[1].id, away_team_id=teams[6].id,
            home_score=2, away_score=2, home_penalties=5, away_penalties=3, winner_id=teams[1].id,
            status=MatchStatus.completed, scheduled_at=now - timedelta(days=12), venue_id=venue2_id)
qf3 = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=1, round_name="Quarter-Finals", match_number=3,
            home_team_id=teams[2].id, away_team_id=teams[5].id,
            home_score=1, away_score=0, winner_id=teams[2].id,
            status=MatchStatus.completed, scheduled_at=now - timedelta(days=11), venue_id=venue3_id)
qf4 = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=1, round_name="Quarter-Finals", match_number=4,
            home_team_id=teams[3].id, away_team_id=teams[4].id,
            home_score=0, away_score=2, winner_id=teams[4].id,
            status=MatchStatus.completed, scheduled_at=now - timedelta(days=11), venue_id=venue1_id)

db.add_all([qf1, qf2, qf3, qf4])
db.flush()

# Semi-finals (round 2)
sf1 = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=2, round_name="Semi-Finals", match_number=1,
            home_team_id=teams[0].id, away_team_id=teams[1].id,
            home_score=2, away_score=1, winner_id=teams[0].id,
            status=MatchStatus.completed, scheduled_at=now - timedelta(days=7), venue_id=venue1_id,
            home_feeder_match_id=qf1.id, away_feeder_match_id=qf2.id)
sf2 = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=2, round_name="Semi-Finals", match_number=2,
            home_team_id=teams[2].id, away_team_id=teams[4].id,
            status=MatchStatus.scheduled, scheduled_at=now + timedelta(days=3), venue_id=venue2_id,
            home_feeder_match_id=qf3.id, away_feeder_match_id=qf4.id)

db.add_all([sf1, sf2])
db.flush()

# Set parent references on QFs
qf1.parent_match_id = sf1.id
qf2.parent_match_id = sf1.id
qf3.parent_match_id = sf2.id
qf4.parent_match_id = sf2.id

# Final (round 3)
final = Match(id=str(uuid.uuid4()), tournament_id=tournament.id, round_number=3, round_name="Final", match_number=1,
              home_team_id=teams[0].id,  # winner of SF1 known
              status=MatchStatus.scheduled, scheduled_at=now + timedelta(days=10), venue_id=venue1_id,
              home_feeder_match_id=sf1.id, away_feeder_match_id=sf2.id)
db.add(final)
db.flush()

sf1.parent_match_id = final.id
sf2.parent_match_id = final.id

# --- Update TournamentTeam stats from results ---
stats_map = {t.id: {"wins": 0, "draws": 0, "losses": 0, "gs": 0, "gc": 0, "mp": 0} for t in teams}

def update_stats(match):
    if match.status == MatchStatus.completed and match.home_score is not None and not match.is_bye:
        h, a = match.home_team_id, match.away_team_id
        hs, as_ = match.home_score, match.away_score
        stats_map[h]["mp"] += 1; stats_map[a]["mp"] += 1
        stats_map[h]["gs"] += hs; stats_map[h]["gc"] += as_
        stats_map[a]["gs"] += as_; stats_map[a]["gc"] += hs
        if hs > as_:
            stats_map[h]["wins"] += 1; stats_map[a]["losses"] += 1
        elif as_ > hs:
            stats_map[a]["wins"] += 1; stats_map[h]["losses"] += 1
        else:
            stats_map[h]["draws"] += 1; stats_map[a]["draws"] += 1

for m in [qf1, qf2, qf3, qf4, sf1]:
    update_stats(m)

for tt in tournament_teams:
    s = stats_map[tt.team_id]
    tt.wins = s["wins"]; tt.draws = s["draws"]; tt.losses = s["losses"]
    tt.goals_scored = s["gs"]; tt.goals_conceded = s["gc"]
    tt.matches_played = s["mp"]
    tt.points = s["wins"] * 3 + s["draws"]

# --- Second tournament (draft) ---
tournament2 = Tournament(
    id=str(uuid.uuid4()),
    name="Spring Cup 2025",
    sport="Football",
    description="Upcoming spring tournament. Registration is open.",
    season="2025 Spring",
    start_date=now + timedelta(days=30),
    end_date=now + timedelta(days=60),
    registration_deadline=now + timedelta(days=20),
    max_teams=8,
    format=TournamentFormat.single_elimination,
    status=TournamentStatus.registration_open,
)
db.add(tournament2)
db.flush()

# Register 4 teams in spring cup
for i in range(4):
    tt2 = TournamentTeam(
        id=str(uuid.uuid4()),
        tournament_id=tournament2.id,
        team_id=teams[i].id,
        seed=i + 1,
    )
    db.add(tt2)

# --- Notifications ---
notifs = [
    Notification(id=str(uuid.uuid4()), type=NotificationType.tournament_created, title="Welcome to Torneo!", message="Your tournament platform is ready. Start by creating a tournament.", is_read=False),
    Notification(id=str(uuid.uuid4()), type=NotificationType.fixtures_generated, title="Bracket Generated", message=f"Bracket for '{tournament.name}' has been generated.", is_read=False, tournament_id=tournament.id),
    Notification(id=str(uuid.uuid4()), type=NotificationType.result_finalized, title="QF1 Result", message="Thunder Eagles 3-1 Dark Knights", is_read=True, tournament_id=tournament.id),
    Notification(id=str(uuid.uuid4()), type=NotificationType.match_reminder, title="Upcoming: Semi-Final 2", message=f"Iron Lions vs Red Dragons on {(now + timedelta(days=3)).strftime('%b %d')}", is_read=False, tournament_id=tournament.id),
]
db.add_all(notifs)

db.commit()
print("✅ Seeding complete!")
print()
print("📋 Demo Accounts:")
print("  Admin:     admin@torneo.app     / Admin@123")
print("  Organizer: organizer@torneo.app / Org@123")
print("  Viewer:    viewer@torneo.app    / View@123")
print()
print(f"🏆 Tournament: {tournament.name}")
print(f"  Teams: {len(teams)}")
print(f"  Status: {tournament.status.value}")
db.close()
