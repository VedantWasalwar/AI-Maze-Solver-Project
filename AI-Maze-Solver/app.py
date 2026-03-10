from flask import Flask, render_template, request
import maze_solver as algo

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/solve", methods=["POST"])
def solve():

    maze_input = request.form["maze"]

    rows = maze_input.strip().split("\n")

    maze = [list(map(int, row.split())) for row in rows]

    start = (0, 0)
    goal = (len(maze) - 1, len(maze[0]) - 1)

    bfs = algo.bfs(maze, start, goal)
    dfs = algo.dfs(maze, start, goal)
    astar = algo.astar(maze, start, goal)
    greedy = algo.greedy(maze, start, goal)

    # Round execution time for better display
    if bfs:
        bfs["time"] = round(bfs["time"], 6)

    if dfs:
        dfs["time"] = round(dfs["time"], 6)

    if astar:
        astar["time"] = round(astar["time"], 6)

    if greedy:
        greedy["time"] = round(greedy["time"], 6)

    return render_template(
        "index.html",
        maze=maze,
        bfs=bfs,
        dfs=dfs,
        astar=astar,
        greedy=greedy
    )


if __name__ == "__main__":
    app.run(debug=True)