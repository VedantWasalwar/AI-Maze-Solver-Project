"""
AI Maze Solver — Flask Backend
Serves API endpoints for all four search algorithms.
"""

from flask import Flask, render_template, request, jsonify
from algorithms.bfs import bfs
from algorithms.dfs import dfs
from algorithms.astar import astar
from algorithms.greedy import greedy
import tracemalloc
import time

app = Flask(__name__)

ALGORITHM_MAP = {
    "bfs": bfs,
    "dfs": dfs,
    "astar": astar,
    "greedy": greedy,
}


def parse_maze(maze_text: str) -> list[list[int]]:
    """Convert newline/space delimited string into 2D integer grid."""
    rows = []
    for line in maze_text.strip().split("\n"):
        line = line.strip()
        if line:
            rows.append([int(v) for v in line.split()])
    return rows


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/solve", methods=["POST"])
def solve():
    """
    POST /solve
    Body (JSON):
      maze       : string  — grid rows separated by \\n
      algorithms : list    — subset of ['bfs','dfs','astar','greedy']
    Returns (JSON):
      dict keyed by algorithm name with path, explored, nodes, time_ms, memory_kb
    """
    data = request.get_json(force=True)
    maze_text = data.get("maze", "")
    selected  = data.get("algorithms", list(ALGORITHM_MAP.keys()))

    try:
        maze = parse_maze(maze_text)
    except Exception:
        return jsonify({"error": "Invalid maze format. Use 0/1 separated by spaces."}), 400

    if not maze or not maze[0]:
        return jsonify({"error": "Maze is empty."}), 400

    start = (0, 0)
    end   = (len(maze) - 1, len(maze[0]) - 1)

    # Validate start/end are open cells
    if maze[start[0]][start[1]] == 1 or maze[end[0]][end[1]] == 1:
        return jsonify({"error": "Start or end cell is a wall."}), 400

    results = {}
    for algo_name in selected:
        fn = ALGORITHM_MAP.get(algo_name)
        if not fn:
            continue

        tracemalloc.start()
        t0 = time.perf_counter()
        result = fn(maze, start, end)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        result["time_ms"]    = round(elapsed_ms, 4)
        result["memory_kb"]  = round(peak / 1024, 2)
        results[algo_name]   = result

    return jsonify(results)


@app.route("/graph", methods=["POST"])
def graph():
    """
    POST /graph
    Returns graph nodes and edges built from the maze grid.
    Nodes: {id, row, col, wall}
    Edges: {source, target}
    """
    data = request.get_json(force=True)
    try:
        maze = parse_maze(data.get("maze", ""))
    except Exception:
        return jsonify({"error": "Invalid maze"}), 400

    rows, cols = len(maze), len(maze[0])
    nodes, edges = [], []

    for r in range(rows):
        for c in range(cols):
            node_id = r * cols + c
            nodes.append({"id": node_id, "row": r, "col": c, "wall": maze[r][c] == 1})

    dirs = [(0, 1), (1, 0)]   # right and down only (undirected graph)
    for r in range(rows):
        for c in range(cols):
            if maze[r][c] == 1:
                continue
            for dr, dc in dirs:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and maze[nr][nc] == 0:
                    edges.append({
                        "source": r * cols + c,
                        "target": nr * cols + nc
                    })

    return jsonify({"nodes": nodes, "edges": edges, "rows": rows, "cols": cols})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
