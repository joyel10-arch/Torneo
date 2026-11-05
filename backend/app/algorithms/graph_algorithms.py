"""
Tournament Graph representation and traversal (CO5).
Vertices = match IDs. Edges = directed progression (feeder → next round).
Representation: adjacency list (default) + adjacency matrix (optional).
"""
from collections import deque
from typing import Optional


class TournamentGraph:
    """
    Directed graph where:
    - Vertices are match IDs
    - Edges go from a feeder match to the match it feeds into (next round)
    """

    def __init__(self):
        self.vertices: list[str] = []
        self.adj_list: dict[str, list[str]] = {}   # match_id → [next_match_id]
        self.vertex_data: dict[str, dict] = {}     # match_id → match info
        self._vertex_index: dict[str, int] = {}

    def build_from_matches(self, matches: list[dict]) -> None:
        """
        Build graph from match list.
        Edge: feeder_match → parent_match (progression direction).
        """
        self.vertices = [m["id"] for m in matches]
        self._vertex_index = {vid: idx for idx, vid in enumerate(self.vertices)}
        self.adj_list = {m["id"]: [] for m in matches}
        self.vertex_data = {m["id"]: m for m in matches}

        for m in matches:
            parent_id = m.get("parent_match_id")
            if parent_id and parent_id in self.adj_list:
                # This match feeds into parent_id
                self.adj_list[m["id"]].append(parent_id)

    def get_adjacency_list(self) -> dict:
        return {
            "vertices": self.vertices,
            "edges": {v: neighbors for v, neighbors in self.adj_list.items()},
            "vertex_count": len(self.vertices),
            "edge_count": sum(len(n) for n in self.adj_list.values()),
            "vertex_data": self.vertex_data,
        }

    def get_adjacency_matrix(self) -> dict:
        n = len(self.vertices)
        matrix = [[0] * n for _ in range(n)]
        for v, neighbors in self.adj_list.items():
            i = self._vertex_index[v]
            for nb in neighbors:
                j = self._vertex_index[nb]
                matrix[i][j] = 1
        return {
            "vertices": self.vertices,
            "matrix": matrix,
            "size": n,
        }

    def bfs(self, start_id: str) -> dict:
        """Breadth-First Search from start_id using an explicit queue."""
        if start_id not in self.adj_list:
            return {"error": f"Vertex '{start_id}' not in graph.", "traversal": [], "steps": []}

        visited: dict[str, bool] = {v: False for v in self.vertices}
        queue = deque()
        traversal_order = []
        steps = []

        queue.append(start_id)
        visited[start_id] = True

        steps.append({
            "action": "enqueue",
            "vertex": start_id,
            "queue": list(queue),
            "visited": [v for v, vis in visited.items() if vis],
            "message": f"Start BFS from '{start_id}'. Enqueue start vertex.",
        })

        while queue:
            current = queue.popleft()
            traversal_order.append(current)

            steps.append({
                "action": "visit",
                "vertex": current,
                "queue": list(queue),
                "visited": [v for v, vis in visited.items() if vis],
                "message": f"Dequeue and visit '{current}'.",
            })

            for neighbor in self.adj_list[current]:
                if not visited[neighbor]:
                    visited[neighbor] = True
                    queue.append(neighbor)
                    steps.append({
                        "action": "enqueue",
                        "vertex": neighbor,
                        "queue": list(queue),
                        "visited": [v for v, vis in visited.items() if vis],
                        "message": f"Neighbor '{neighbor}' not visited — enqueue.",
                    })

        return {
            "traversal": traversal_order,
            "steps": steps,
            "start": start_id,
            "visited_count": len(traversal_order),
        }

    def dfs(self, start_id: str) -> dict:
        """Depth-First Search from start_id using an explicit stack."""
        if start_id not in self.adj_list:
            return {"error": f"Vertex '{start_id}' not in graph.", "traversal": [], "steps": []}

        visited: dict[str, bool] = {v: False for v in self.vertices}
        stack = [start_id]
        traversal_order = []
        steps = []

        steps.append({
            "action": "push",
            "vertex": start_id,
            "stack": list(stack),
            "visited": [],
            "message": f"Start DFS from '{start_id}'. Push to stack.",
        })

        while stack:
            current = stack.pop()
            if visited[current]:
                continue
            visited[current] = True
            traversal_order.append(current)

            steps.append({
                "action": "visit",
                "vertex": current,
                "stack": list(stack),
                "visited": [v for v, vis in visited.items() if vis],
                "message": f"Pop and visit '{current}'.",
            })

            # Push neighbors in reverse order so leftmost is processed first
            for neighbor in reversed(self.adj_list[current]):
                if not visited[neighbor]:
                    stack.append(neighbor)
                    steps.append({
                        "action": "push",
                        "vertex": neighbor,
                        "stack": list(stack),
                        "visited": [v for v, vis in visited.items() if vis],
                        "message": f"Push unvisited neighbor '{neighbor}'.",
                    })

        return {
            "traversal": traversal_order,
            "steps": steps,
            "start": start_id,
            "visited_count": len(traversal_order),
        }

    def get_team_path(self, team_name: str) -> list[str]:
        """Return ordered match IDs where team_name participated."""
        path = []
        for vid, data in self.vertex_data.items():
            if data.get("home_team_name") == team_name or data.get("away_team_name") == team_name:
                path.append(vid)
        path.sort(key=lambda vid: self.vertex_data[vid].get("round_number", 0))
        return path

    def highlight_progression(self, match_id: str) -> dict:
        """Return the match and all its ancestors (matches it feeds into)."""
        if match_id not in self.adj_list:
            return {"error": f"Match '{match_id}' not in graph."}
        chain = [match_id]
        current = match_id
        while self.adj_list.get(current):
            current = self.adj_list[current][0]
            chain.append(current)
        return {"progression_chain": chain, "match_data": [self.vertex_data.get(m) for m in chain]}
