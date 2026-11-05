# models/__init__.py - import all models so SQLAlchemy discovers them
from app.models.user import User, UserRole
from app.models.tournament import Tournament, TournamentStatus, TournamentFormat
from app.models.team import Team, TournamentTeam
from app.models.match import Match, MatchStatus
from app.models.venue import Venue
from app.models.notification import Notification, AuditLog, NotificationType

__all__ = [
    "User", "UserRole",
    "Tournament", "TournamentStatus", "TournamentFormat",
    "Team", "TournamentTeam",
    "Match", "MatchStatus",
    "Venue",
    "Notification", "AuditLog", "NotificationType",
]
