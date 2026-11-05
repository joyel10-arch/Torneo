"""
Binary Tournament Tree implementation (CO4).
Represents the knockout bracket as an explicit binary tree.
Each match is a node; children are feeder matches, parent is next match.
"""
from dataclasses import dataclass, field
from typing import Optional, List
from collections import deque


@dataclass
class MatchNode:
    match_id: str
    round_number: int
    round_name: str
    home_team_name: Optional[str]
    away_team_name: Optional[str]
    home_score: Optional[int]
    away_score: Optional[int]
    winner_name: Optional[str]
    status: str
    is_bye: bool = False
    left: Optional["MatchNode"] = field(default=None, repr=False)   # home feeder
    right: Optional["MatchNode"] = field(default=None, repr=False)  # away feeder
    parent: Optional["MatchNode"] = field(default=None, repr=False)


class TournamentTree:
    """Binary tree of MatchNodes rooted at the Final."""

    def __init__(self):
        self.root: Optional[MatchNode] = None
        self._node_map: dict[str, MatchNode] = {}

    def build_from_matches(self, matches: list[dict]) -> None:
        """
        Build tree from a list of match dicts (from DB).
        Each dict must contain: id, round_number, round_name,
        home_team_name, away_team_name, home_score, away_score,
        winner_name, status, is_bye, home_feeder_match_id, away_feeder_match_id.
        """
        self._node_map = {}
        for m in matches:
            node = MatchNode(
                match_id=m["id"],
                round_number=m["round_number"],
                round_name=m.get("round_name", f"Round {m['round_number']}"),
                home_team_name=m.get("home_team_name"),
                away_team_name=m.get("away_team_name"),
                home_score=m.get("home_score"),
                away_score=m.get("away_score"),
                winner_name=m.get("winner_name"),
                status=m.get("status", "scheduled"),
                is_bye=m.get("is_bye", False),
            )
            self._node_map[node.match_id] = node

        # Wire up parent-child relationships
        for m in matches:
            node = self._node_map[m["id"]]
            home_feeder = m.get("home_feeder_match_id")
            away_feeder = m.get("away_feeder_match_id")
            if home_feeder and home_feeder in self._node_map:
                node.left = self._node_map[home_feeder]
                self._node_map[home_feeder].parent = node
            if away_feeder and away_feeder in self._node_map:
                node.right = self._node_map[away_feeder]
                self._node_map[away_feeder].parent = node

        # Root is the node with no parent (the Final)
        roots = [n for n in self._node_map.values() if n.parent is None]
        if roots:
            # If multiple roots (shouldn't happen with valid data), pick highest round
            self.root = max(roots, key=lambda n: n.round_number)

    def _node_to_dict(self, node: MatchNode) -> dict:
        return {
            "match_id": node.match_id,
            "round_number": node.round_number,
            "round_name": node.round_name,
            "home_team": node.home_team_name,
            "away_team": node.away_team_name,
            "home_score": node.home_score,
            "away_score": node.away_score,
            "winner": node.winner_name,
            "status": node.status,
            "is_bye": node.is_bye,
            "left_child_id": node.left.match_id if node.left else None,
            "right_child_id": node.right.match_id if node.right else None,
            "parent_id": node.parent.match_id if node.parent else None,
        }

    def preorder(self) -> list[dict]:
        """Root → Left → Right"""
        result = []
        def _pre(node):
            if not node:
                return
            result.append(self._node_to_dict(node))
            _pre(node.left)
            _pre(node.right)
        _pre(self.root)
        return result

    def inorder(self) -> list[dict]:
        """Left → Root → Right"""
        result = []
        def _in(node):
            if not node:
                return
            _in(node.left)
            result.append(self._node_to_dict(node))
            _in(node.right)
        _in(self.root)
        return result

    def postorder(self) -> list[dict]:
        """Left → Right → Root (leaves first → Final last)"""
        result = []
        def _post(node):
            if not node:
                return
            _post(node.left)
            _post(node.right)
            result.append(self._node_to_dict(node))
        _post(self.root)
        return result

    def level_order(self) -> list[list[dict]]:
        """Breadth-first by level — returns list of levels."""
        if not self.root:
            return []
        levels = []
        queue = deque([(self.root, 0)])
        while queue:
            node, level = queue.popleft()
            if level == len(levels):
                levels.append([])
            levels[level].append(self._node_to_dict(node))
            if node.left:
                queue.append((node.left, level + 1))
            if node.right:
                queue.append((node.right, level + 1))
        return levels

    def height(self) -> int:
        def _h(node):
            if not node:
                return 0
            return 1 + max(_h(node.left), _h(node.right))
        return _h(self.root)

    def node_count(self) -> int:
        count = [0]
        def _count(node):
            if not node:
                return
            count[0] += 1
            _count(node.left)
            _count(node.right)
        _count(self.root)
        return count[0]

    def get_champion(self) -> Optional[dict]:
        if self.root and self.root.winner_name:
            return {
                "winner": self.root.winner_name,
                "final_match_id": self.root.match_id,
                "final_score": f"{self.root.home_score}-{self.root.away_score}"
                if self.root.home_score is not None else "TBD",
            }
        return None

    def get_feeder_matches(self, match_id: str) -> dict:
        node = self._node_map.get(match_id)
        if not node:
            return {"error": f"Match {match_id} not found in tree."}
        return {
            "match_id": match_id,
            "home_feeder": self._node_to_dict(node.left) if node.left else None,
            "away_feeder": self._node_to_dict(node.right) if node.right else None,
            "parent": self._node_to_dict(node.parent) if node.parent else None,
        }

    def trace_team_path(self, team_name: str) -> list[dict]:
        """Trace a team's actual match progression through the bracket."""
        path = []
        for node in self._node_map.values():
            if node.home_team_name == team_name or node.away_team_name == team_name:
                path.append(self._node_to_dict(node))
        path.sort(key=lambda x: x["round_number"])
        return path

    def to_dict(self) -> dict:
        return {
            "root": self._node_to_dict(self.root) if self.root else None,
            "height": self.height(),
            "node_count": self.node_count(),
            "champion": self.get_champion(),
            "preorder": self.preorder(),
            "inorder": self.inorder(),
            "postorder": self.postorder(),
            "level_order": self.level_order(),
        }
