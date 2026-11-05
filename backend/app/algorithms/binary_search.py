"""
Binary Search implementation for team lookup (CO3).
Input MUST be sorted by the search key before calling.
Does NOT use Python's bisect module for the core search logic.
"""
from typing import Any, Optional


def binary_search_teams(
    sorted_teams: list[dict],
    search_key: str,
    key_field: str = "team_name",
) -> dict:
    """
    Binary search on a sorted list of team dicts.

    Args:
        sorted_teams: List sorted ascending by key_field.
        search_key: Value to find.
        key_field: Dict key to search on (default: 'team_name').

    Returns:
        dict with: found, index, comparisons, steps, result.
    """
    if not sorted_teams:
        return {
            "found": False,
            "index": -1,
            "comparisons": 0,
            "steps": [{"low": 0, "high": -1, "mid": -1, "message": "Empty list — nothing to search."}],
            "result": None,
        }

    low = 0
    high = len(sorted_teams) - 1
    comparisons = 0
    steps = []

    # Validate that the list is actually sorted on key_field
    for i in range(len(sorted_teams) - 1):
        if sorted_teams[i][key_field] > sorted_teams[i + 1][key_field]:
            return {
                "found": False,
                "index": -1,
                "comparisons": 0,
                "steps": [{
                    "low": 0,
                    "high": len(sorted_teams) - 1,
                    "mid": -1,
                    "message": (
                        f"ERROR: Input is not sorted on '{key_field}'. "
                        "Binary Search requires sorted input."
                    ),
                }],
                "result": None,
                "error": "Input list is not sorted on the specified key field.",
            }

    while low <= high:
        mid = (low + high) // 2
        comparisons += 1
        mid_value = sorted_teams[mid][key_field]

        step = {
            "low": low,
            "high": high,
            "mid": mid,
            "mid_value": mid_value,
            "search_key": search_key,
            "message": f"low={low}, high={high}, mid={mid} → checking '{mid_value}' vs '{search_key}'",
        }

        if mid_value == search_key:
            step["message"] += " → FOUND!"
            steps.append(step)
            return {
                "found": True,
                "index": mid,
                "comparisons": comparisons,
                "steps": steps,
                "result": sorted_teams[mid],
            }
        elif mid_value < search_key:
            step["message"] += f" → '{mid_value}' < '{search_key}', search right half"
            low = mid + 1
        else:
            step["message"] += f" → '{mid_value}' > '{search_key}', search left half"
            high = mid - 1

        steps.append(step)

    steps.append({
        "low": low,
        "high": high,
        "mid": -1,
        "message": f"low ({low}) > high ({high}) — '{search_key}' NOT FOUND.",
    })

    return {
        "found": False,
        "index": -1,
        "comparisons": comparisons,
        "steps": steps,
        "result": None,
    }
