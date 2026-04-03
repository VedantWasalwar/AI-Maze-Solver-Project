"""
Depth-First Search (DFS)
- Explores as far as possible using a LIFO stack
- Does NOT guarantee shortest path
- Time: O(V+E)  Space: O(V)
"""

DIRS = [(0, 1), (1, 0), (0, -1), (-1, 0)]


def get_neighbors(pos, maze):
    r, c = pos
    rows, cols = len(maze), len(maze[0])
    result = []
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] == 0:
            result.append((nr, nc))
    return result


def dfs(maze, start, end):
    """
    Returns:
        path     : list of (row, col) tuples from start to end
        explored : list of (row, col) in exploration order
        nodes    : total nodes visited
        tree     : list of {node, parent} for search-tree visualisation
    """
    stack    = [(start, [start])]
    visited  = set()
    explored = []
    parent   = {start: None}

    while stack:
        pos, path = stack.pop()
        if pos in visited:
            continue
        visited.add(pos)
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
                parent[nb] = pos
                stack.append((nb, path + [nb]))

    return {"path": [], "explored": explored, "nodes": len(explored), "tree": []}
