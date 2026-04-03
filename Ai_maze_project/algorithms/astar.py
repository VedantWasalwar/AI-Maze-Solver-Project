"""
A* Search
- Uses f(n) = g(n) + h(n) where h is Manhattan distance
- Optimal and complete for admissible heuristics
- Time: O(E log V)  Space: O(V)
"""

import heapq

DIRS = [(0, 1), (1, 0), (0, -1), (-1, 0)]


def heuristic(a, b):
    """Manhattan distance heuristic — admissible for 4-directional grids."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def get_neighbors(pos, maze):
    r, c = pos
    rows, cols = len(maze), len(maze[0])
    result = []
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] == 0:
            result.append((nr, nc))
    return result


def astar(maze, start, end):
    """
    Returns:
        path     : list of (row, col) tuples from start to end
        explored : list of (row, col) in exploration order
        nodes    : total nodes visited
        tree     : list of {node, parent} for search-tree visualisation
    """
    counter  = 0
    heap     = [(heuristic(start, end), counter, 0, start, [start])]
    visited  = set()
    explored = []
    parent   = {start: None}

    while heap:
        f, _, g, pos, path = heapq.heappop(heap)

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
                ng = g + 1
                counter += 1
                parent[nb] = pos
                heapq.heappush(heap, (ng + heuristic(nb, end), counter, ng, nb, path + [nb]))

    return {"path": [], "explored": explored, "nodes": len(explored), "tree": []}
