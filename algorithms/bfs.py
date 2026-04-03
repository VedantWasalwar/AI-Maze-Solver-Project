"""
Breadth-First Search (BFS)
- Explores level by level using a FIFO queue
- Guarantees shortest path in unweighted graphs
- Time: O(V+E)  Space: O(V)
"""

from collections import deque


DIRS = [(0, 1, "R"), (1, 0, "D"), (0, -1, "L"), (-1, 0, "U")]


def get_neighbors(pos, maze):
    r, c = pos
    rows, cols = len(maze), len(maze[0])
    result = []
    for dr, dc, _ in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] == 0:
            result.append((nr, nc))
    return result


def bfs(maze, start, end):
    """
    Returns:
        path     : list of (row, col) tuples from start to end
        explored : list of (row, col) in exploration order
        nodes    : total nodes visited
        tree     : list of {node, parent} for search-tree visualisation
    """
    queue    = deque([(start, [start])])
    visited  = {start}
    explored = []
    parent   = {start: None}      # for tree visualisation

    while queue:
        pos, path = queue.popleft()
        explored.append(list(pos))

        if pos == end:
            tree = [{"node": list(k), "parent": list(v) if v else None}
                    for k, v in parent.items()]
            return {
                "path":     [list(p) for p in path],
                "explored": explored,
                "nodes":    len(explored),
                "tree":     tree,
            }

        for nb in get_neighbors(pos, maze):
            if nb not in visited:
                visited.add(nb)
                parent[nb] = pos
                queue.append((nb, path + [nb]))

    return {"path": [], "explored": explored, "nodes": len(explored), "tree": []}
