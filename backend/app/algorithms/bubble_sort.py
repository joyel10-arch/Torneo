"""
Bubble Sort implementation for team rankings (CO3).
Uses explicit comparison policy:
1. Points (descending)
2. Goal difference (descending)
3. Goals scored (descending)
4. Team name (ascending, deterministic tie-breaker)

Does NOT use Python's built-in sorted() or list.sort().
"""
from typing import Any


def compare_teams(a: dict, b: dict) -> int:
    """
    Compare two team-stat dicts.
    Returns negative if a should rank higher than b, positive if lower, 0 if equal.
    """
    # 1. Points descending
    if a["points"] != b["points"]:
        return b["points"] - a["points"]

    # 2. Goal difference descending
    gd_a = a["goals_scored"] - a["goals_conceded"]
    gd_b = b["goals_scored"] - b["goals_conceded"]
    if gd_a != gd_b:
        return gd_b - gd_a

    # 3. Goals scored descending
    if a["goals_scored"] != b["goals_scored"]:
        return b["goals_scored"] - a["goals_scored"]

    # 4. Team name ascending (stable, deterministic)
    if a["team_name"] < b["team_name"]:
        return -1
    elif a["team_name"] > b["team_name"]:
        return 1
    return 0


def bubble_sort_teams(teams: list[dict]) -> dict:
    """
    Sorts teams in-place using bubble sort and returns detailed analytics.

    Args:
        teams: List of dicts with keys: team_id, team_name, points,
               goals_scored, goals_conceded, wins, draws, losses, matches_played.

    Returns:
        dict with: sorted_teams, comparisons, swaps, steps, complexity_info.
    """
    if not teams:
        return {
            "sorted_teams": [],
            "comparisons": 0,
            "swaps": 0,
            "steps": [],
            "complexity_info": {
                "best_case": "O(n)",
                "average_case": "O(n²)",
                "worst_case": "O(n²)",
                "space": "O(1)",
                "note": "Empty list — trivially sorted.",
            },
        }

    arr = [t.copy() for t in teams]
    n = len(arr)
    comparisons = 0
    swaps = 0
    steps = []

    # Record initial state
    steps.append({
        "phase": "initial",
        "array": [t["team_name"] for t in arr],
        "comparison_indices": [],
        "swapped": False,
        "message": f"Initial order of {n} team(s).",
    })

    for i in range(n):
        swapped_in_pass = False
        for j in range(0, n - i - 1):
            comparisons += 1
            cmp = compare_teams(arr[j], arr[j + 1])
            step_info = {
                "phase": f"pass_{i + 1}",
                "array": [t["team_name"] for t in arr],
                "comparison_indices": [j, j + 1],
                "swapped": False,
                "message": (
                    f"Pass {i + 1}: Comparing '{arr[j]['team_name']}' vs "
                    f"'{arr[j + 1]['team_name']}' "
                    f"(pts {arr[j]['points']} vs {arr[j + 1]['points']})"
                ),
            }
            if cmp > 0:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swaps += 1
                swapped_in_pass = True
                step_info["swapped"] = True
                step_info["message"] += " → swapped"
            else:
                step_info["message"] += " → no swap"

            step_info["array"] = [t["team_name"] for t in arr]
            steps.append(step_info)

        if not swapped_in_pass:
            steps.append({
                "phase": f"early_exit_pass_{i + 1}",
                "array": [t["team_name"] for t in arr],
                "comparison_indices": [],
                "swapped": False,
                "message": f"No swaps in pass {i + 1} — list is sorted. Early exit.",
            })
            break

    # Assign ranks
    for rank_idx, team in enumerate(arr):
        team["rank"] = rank_idx + 1

    goal_differences = [t["goals_scored"] - t["goals_conceded"] for t in arr]

    return {
        "sorted_teams": arr,
        "comparisons": comparisons,
        "swaps": swaps,
        "steps": steps,
        "goal_differences": goal_differences,
        "complexity_info": {
            "best_case": "O(n) — already sorted",
            "average_case": "O(n²)",
            "worst_case": "O(n²) — reverse sorted",
            "space": "O(1) — in-place",
            "actual_comparisons": comparisons,
            "actual_swaps": swaps,
            "n": n,
            "note": (
                "Bubble Sort is deliberately used here per academic requirement (CO3). "
                "Production systems would use O(n log n) algorithms like Timsort."
            ),
        },
    }
