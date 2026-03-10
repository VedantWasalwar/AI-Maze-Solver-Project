from collections import deque
import heapq
import time

def get_neighbors(node, maze):
    x,y = node
    directions = [(0,1),(1,0),(0,-1),(-1,0)]
    neighbors=[]

    for dx,dy in directions:
        nx,ny = x+dx,y+dy

        if 0<=nx<len(maze) and 0<=ny<len(maze[0]) and maze[nx][ny]==0:
            neighbors.append((nx,ny))

    return neighbors


def bfs(maze,start,goal):

    start_time=time.time()

    queue=deque([(start,[start])])
    visited=set()
    nodes=0

    while queue:

        (x,y),path=queue.popleft()
        nodes+=1

        if (x,y)==goal:
            return {
            "path":path,
            "nodes":nodes,
            "time":time.time()-start_time
            }

        for n in get_neighbors((x,y),maze):

            if n not in visited:
                visited.add(n)
                queue.append((n,path+[n]))

    return None


def dfs(maze,start,goal):

    start_time=time.time()

    stack=[(start,[start])]
    visited=set()
    nodes=0

    while stack:

        (x,y),path=stack.pop()
        nodes+=1

        if (x,y)==goal:
            return {
            "path":path,
            "nodes":nodes,
            "time":time.time()-start_time
            }

        for n in get_neighbors((x,y),maze):

            if n not in visited:
                visited.add(n)
                stack.append((n,path+[n]))

    return None


def heuristic(a,b):

    return abs(a[0]-b[0])+abs(a[1]-b[1])


def astar(maze,start,goal):

    start_time=time.time()

    pq=[]
    heapq.heappush(pq,(0,start,[start]))

    visited=set()
    nodes=0

    while pq:

        cost,node,path=heapq.heappop(pq)
        nodes+=1

        if node==goal:
            return {
            "path":path,
            "nodes":nodes,
            "time":time.time()-start_time
            }

        for n in get_neighbors(node,maze):

            if n not in visited:

                visited.add(n)

                new_cost=len(path)+heuristic(n,goal)

                heapq.heappush(pq,(new_cost,n,path+[n]))

    return None


def greedy(maze,start,goal):

    start_time=time.time()

    pq=[]
    heapq.heappush(pq,(heuristic(start,goal),start,[start]))

    visited=set()
    nodes=0

    while pq:

        h,node,path=heapq.heappop(pq)
        nodes+=1

        if node==goal:
            return {
            "path":path,
            "nodes":nodes,
            "time":time.time()-start_time
            }

        for n in get_neighbors(node,maze):

            if n not in visited:

                visited.add(n)

                heapq.heappush(pq,(heuristic(n,goal),n,path+[n]))

    return None