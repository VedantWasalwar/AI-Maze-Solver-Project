# AI Maze Solver Pro 🧩

A full-stack AI pathfinding dashboard built with Flask + D3.js + Chart.js.

## Features

| Feature | Details |
|---|---|
| **Interactive Maze** | Click to toggle walls, drag to draw, click to set Start/End |
| **4 Algorithms** | BFS, DFS, A* (real, with Manhattan heuristic), Greedy Best-First |
| **Animated Exploration** | Step-by-step cell-by-cell animation with adjustable speed |
| **D3.js Graph View** | Force-directed graph of maze nodes and edges (synced with maze) |
| **Search Tree** | D3.js hierarchical tree showing parent-child exploration |
| **Queue/Stack Vis** | Live display of the algorithm's frontier during solving |
| **4 Comparison Charts** | Nodes explored, time, path length, memory usage |
| **Memory Tracking** | Python `tracemalloc` measures peak memory per algorithm |
| **Dark/Light Theme** | Full CSS variable-based theme toggle |
| **Presets + Random** | Load classic mazes or generate random ones instantly |
| **Modular Backend** | Each algorithm in its own file under `algorithms/` |

---

## Project Structure

```
maze_pro/
│
├── app.py                  ← Flask app + API endpoints
├── requirements.txt
├── README.md
│
├── algorithms/
│   ├── __init__.py
│   ├── bfs.py              ← Breadth-First Search
│   ├── dfs.py              ← Depth-First Search
│   ├── astar.py            ← A* with Manhattan heuristic
│   └── greedy.py           ← Greedy Best-First Search
│
├── templates/
│   └── index.html          ← Full dashboard UI
│
└── static/
    ├── css/
    │   └── style.css       ← Dark/light theme stylesheet
    └── js/
        ├── maze.js         ← Interactive canvas (draw, animate)
        ├── graph.js        ← D3.js graph + tree visualisation
        ├── charts.js       ← Chart.js comparison charts
        └── main.js         ← App orchestration + API calls
```

---

## Setup & Run

### 1. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2. Start the Flask server
```bash
python app.py
```

### 3. Open in your browser
```
http://127.0.0.1:5000
```

---

## API Endpoints

### `POST /solve`
Runs selected algorithms and returns results.

**Request body:**
```json
{
  "maze": "0 0 1 0\n1 0 0 0\n0 0 0 0\n0 0 0 0",
  "algorithms": ["bfs", "dfs", "astar", "greedy"]
}
```

**Response:**
```json
{
  "bfs": {
    "path": [[0,0],[0,1],[1,1],[2,1],[3,3]],
    "explored": [...],
    "nodes": 14,
    "tree": [...],
    "time_ms": 0.42,
    "memory_kb": 1.8
  },
  ...
}
```

### `POST /graph`
Returns graph nodes and edges for D3 rendering.

**Response:**
```json
{
  "nodes": [{"id":0,"row":0,"col":0,"wall":false}, ...],
  "edges": [{"source":0,"target":1}, ...],
  "rows": 4,
  "cols": 4
}
```

---

## How to Use

1. **Draw your maze** — use Wall / Erase / Set Start / Set End tools, or pick a preset
2. **Choose algorithms** — toggle one or more in the left panel
3. **Set animation speed** — drag the speed slider (1 = slow, 10 = fast)
4. **Press "Solve All"** — watch the animated exploration, then view:
   - Graph view (right panel) synced with maze
   - Search tree showing exploration order
   - Queue/Stack state
   - 4 comparison charts below the maze
5. **Click algo tabs** in the results panel to switch between results
6. **Click graph nodes** to highlight the corresponding maze cell

---

## Algorithm Complexity

| Algorithm | Time | Space | Optimal? |
|-----------|------|-------|----------|
| BFS       | O(V+E) | O(V) | ✅ Yes |
| DFS       | O(V+E) | O(V) | ❌ No  |
| A*        | O(E log V) | O(V) | ✅ Yes (admissible h) |
| Greedy    | O(E log V) | O(V) | ❌ No  |

---

## Deploy to Production

Add `gunicorn` for production use:
```bash
pip install gunicorn
gunicorn app:app -w 2 -b 0.0.0.0:8000
```

For platforms like Render / Railway, add a `Procfile`:
```
web: gunicorn app:app
```
