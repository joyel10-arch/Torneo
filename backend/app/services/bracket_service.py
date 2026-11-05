"""
Bracket generation and tournament tree service.
Handles single-elimination knockout bracket creation with seeding and byes.
"""
import math
import uuid
import random
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.match import Match, MatchStatus
from app.models.tournament import Tournament, TournamentStatus, TournamentFormat
from app.models.team import TournamentTeam


def _next_power_of_two(n: int) -> int:
    if n <= 1:
        return 1
    p = 1
    while p < n:
        p <<= 1
    return p


def generate_round_robin_schedule(
    db: Session,
    tournament: Tournament,
) -> list[Match]:
    """
    Generate a round-robin league schedule where every team plays every other team once.
    Organized into rounds/matchdays.
    """
    tt_list = (
        db.query(TournamentTeam)
        .filter(TournamentTeam.tournament_id == tournament.id)
        .all()
    )
    if len(tt_list) < 2:
        raise ValueError("Need at least 2 teams to generate a round-robin schedule.")

    teams = [tt.team for tt in tt_list]
    team_list = list(teams)
    if len(team_list) % 2 != 0:
        team_list.append(None)

    num_slots = len(team_list)
    rounds_count = num_slots - 1
    half = num_slots // 2

    created_matches: list[Match] = []

    for round_idx in range(rounds_count):
        round_num = round_idx + 1
        match_num = 1
        for i in range(half):
            t1 = team_list[i]
            t2 = team_list[num_slots - 1 - i]

            # Alternate home and away to make scheduling fair
            if round_idx % 2 == 1:
                t1, t2 = t2, t1

            if t1 is not None and t2 is not None:
                m = Match(
                    id=str(uuid.uuid4()),
                    tournament_id=tournament.id,
                    round_number=round_num,
                    round_name=f"Round {round_num}",
                    match_number=match_num,
                    home_team_id=t1.id,
                    away_team_id=t2.id,
                    status=MatchStatus.scheduled,
                    parent_match_id=None,
                    home_feeder_match_id=None,
                    away_feeder_match_id=None,
                )
                db.add(m)
                created_matches.append(m)
                match_num += 1

        # Circle algorithm: keep team_list[0] fixed, rotate the rest
        team_list = [team_list[0]] + [team_list[-1]] + team_list[1:-1]

    db.flush()
    return created_matches


def generate_bracket(
    db: Session,
    tournament: Tournament,
    seeded: bool = True,
    random_seed: Optional[int] = None,
) -> list[Match]:
    """
    Generate either a single-elimination knockout bracket or round-robin league schedule.
    Existing matches are deleted first (requires confirmation at API level).
    """
    if tournament.format == TournamentFormat.round_robin:
        return generate_round_robin_schedule(db, tournament)

    # Get registered teams with optional seed ordering
    tt_list = (
        db.query(TournamentTeam)
        .filter(TournamentTeam.tournament_id == tournament.id)
        .all()
    )
    if len(tt_list) < 2:
        raise ValueError("Need at least 2 teams to generate a bracket.")

    if seeded:
        # Sort by seed (lower = better), then by rank if seed missing
        tt_list.sort(key=lambda tt: (tt.seed or 999, tt.registered_at))
    else:
        if random_seed is not None:
            random.seed(random_seed)
        random.shuffle(tt_list)

    teams = [tt.team for tt in tt_list]
    n_teams = len(teams)
    bracket_size = _next_power_of_two(n_teams)
    n_byes = bracket_size - n_teams
    n_rounds = int(math.log2(bracket_size))

    # Round names
    round_names = {1: "Final"}
    if n_rounds >= 2:
        round_names[2] = "Semi-Finals"
    if n_rounds >= 3:
        round_names[3] = "Quarter-Finals"
    for r in range(4, n_rounds + 1):
        round_names[r] = f"Round of {2 ** r}"

    # Create match slots from round 1 (final) to round n_rounds (first round)
    # We store rounds in ascending order: round 1 = first round played, n_rounds = final
    # Invert for storage: round_number = 1 means first round of play
    # Let's use round_number = 1 for the opening round, max for the final.

    created_matches: dict[str, Match] = {}

    def make_match(round_num: int, match_num: int) -> Match:
        round_label = round_names.get(n_rounds - round_num + 1, f"Round {round_num}")
        m = Match(
            id=str(uuid.uuid4()),
            tournament_id=tournament.id,
            round_number=round_num,
            round_name=round_label,
            match_number=match_num,
            status=MatchStatus.scheduled,
        )
        return m

    # Build tree structure: leaf matches are round 1, final is round n_rounds
    # Use a list indexed by position to wire up parent-child

    # Round 1 matches
    round1_slots = bracket_size // 2  # number of first-round matches
    round1_matches = [make_match(1, i + 1) for i in range(round1_slots)]

    # Assign teams (with byes) using standard seeding order
    # Top seeds get byes first
    team_slots = teams + [None] * n_byes
    # Standard bracket pairing: 1 vs last, 2 vs second-last...
    pairing = []
    lo, hi = 0, len(team_slots) - 1
    while lo < hi:
        pairing.append((team_slots[lo], team_slots[hi]))
        lo += 1
        hi -= 1

    for idx, (home_team, away_team) in enumerate(pairing):
        m = round1_matches[idx]
        if home_team:
            m.home_team_id = home_team.id
        if away_team:
            m.away_team_id = away_team.id

        if away_team is None:
            # Bye — home team advances automatically
            m.is_bye = True
            m.status = MatchStatus.bye
            m.winner_id = home_team.id if home_team else None
        elif home_team is None:
            m.is_bye = True
            m.status = MatchStatus.bye
            m.winner_id = away_team.id

    db.add_all(round1_matches)

    # Build subsequent rounds
    prev_round_matches = round1_matches
    for r in range(2, n_rounds + 1):
        current_round_matches = []
        for i in range(0, len(prev_round_matches), 2):
            match_num = i // 2 + 1
            parent = make_match(r, match_num)
            home_feeder = prev_round_matches[i]
            away_feeder = prev_round_matches[i + 1] if i + 1 < len(prev_round_matches) else None

            parent.home_feeder_match_id = home_feeder.id
            if away_feeder:
                parent.away_feeder_match_id = away_feeder.id

            home_feeder.parent_match_id = parent.id
            if away_feeder:
                away_feeder.parent_match_id = parent.id

            # If both feeders are byes, auto-populate the parent
            if home_feeder.winner_id and away_feeder and away_feeder.winner_id:
                parent.home_team_id = home_feeder.winner_id
                parent.away_team_id = away_feeder.winner_id
            elif home_feeder.winner_id and (away_feeder is None or away_feeder.winner_id is None):
                parent.home_team_id = home_feeder.winner_id
            elif away_feeder and away_feeder.winner_id:
                parent.away_team_id = away_feeder.winner_id

            db.add(parent)
            current_round_matches.append(parent)

        prev_round_matches = current_round_matches

    db.flush()
    return list(db.query(Match).filter(Match.tournament_id == tournament.id).all())


def advance_winner(db: Session, match: Match) -> Optional[Match]:
    """
    After a match result is finalized, advance the winner to the parent match.
    Returns the parent match if one exists, else None.
    """
    if not match.winner_id or not match.parent_match_id:
        return None

    parent = db.query(Match).filter(Match.id == match.parent_match_id).first()
    if not parent:
        return None

    # Determine if this match feeds as home or away into the parent
    if parent.home_feeder_match_id == match.id:
        parent.home_team_id = match.winner_id
    elif parent.away_feeder_match_id == match.id:
        parent.away_team_id = match.winner_id

    db.add(parent)
    db.flush()
    return parent
