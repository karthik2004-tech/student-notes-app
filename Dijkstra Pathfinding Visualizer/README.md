# PATH-SPROUT // Graph Search Visualizer

An interactive browser-based educational platform for modeling discrete spatial graph traversals, heuristic coordinate estimations, and state-space tree expansions over time. Built with a premium light botanical UI theme, this tool transforms abstract pathfinding algorithms into real-time interactive grid matrices with smooth animated cell state transitions.

---

## Mathematical Graph Theory and Metric Grid Spacings

Pathfinding on a grid treats each cell as a node in a graph, with orthogonal adjacency (North, South, East, West) defining edges of uniform weight (or cost 1 per step). The objective is to find the optimal path from a start node to a target node given a set of barrier cells (walls) that block traversal.

### Core Algorithmic Relaxation

Each pathfinding algorithm iteratively explores the search space by relaxing edges — updating the known shortest distance to each neighbor:

$$\textbf{Dijkstra Relaxation: } \text{if } d(u) + w(u, v) < d(v) \implies d(v) = d(u) + w(u, v)$$

Where $d(v)$ is the accumulated cost from the start to node $v$, and $w(u, v)$ is the edge weight between adjacent nodes (cost 1 in a uniform grid).

### A* Heuristic Evaluation

A* accelerates convergence by incorporating a heuristic estimate of the remaining distance:

$$f(n) = g(n) + h(n)$$

Where $g(n)$ is the exact cost from the start to node $n$, and $h(n)$ is the estimated cost from $n$ to the target:

$$\textbf{Manhattan Distance: } h(n) = |x_n - x_{\text{target}}| + |y_n - y_{\text{target}}|$$

This heuristic is **admissible** (never overestimates) for grid-based movement with cardinal directions only, guaranteeing that A* finds the shortest path.

---

## Comparative Analysis of Traversal Complexity

| Algorithm | Data Structure | Optimality | Complete | Space Complexity | Time Complexity |
|-----------|---------------|------------|----------|-----------------|-----------------|
| Dijkstra | Priority Queue (min-heap) | Yes | Yes | O(V) | O(E + V log V) |
| A* | Priority Queue (f-cost) | Yes | Yes | O(V) | O(E + V log V) |
| BFS | FIFO Queue | Yes* | Yes | O(V) | O(V + E) |
| DFS | LIFO Stack | No | No** | O(V) | O(V + E) |

*\*BFS is optimal only when all edge weights are equal.*  
*\*\*DFS is not complete on infinite graphs; on finite graphs it will explore fully but may not find the shortest path.*

### Algorithm Behavior on a Grid

- **Dijkstra:** Explores uniformly outward from the start in all directions, guaranteeing the shortest path by examining nodes in order of increasing distance.

- **A\*:** Focuses exploration toward the target using the Manhattan heuristic, significantly reducing the number of visited cells compared to Dijkstra while still guaranteeing optimality.

- **BFS:** Explores in concentric layers, guaranteeing the shortest path in terms of number of steps (unweighted). Expands like a wavefront.

- **DFS:** Explores deeply along each branch before backtracking. Does not guarantee the shortest path but is useful for maze solving and connectivity checks.

---

## State Matrix Optimization Schematics

The visualization maintains a **single-source-of-truth 2D grid matrix** tracking every coordinate block $(x, y)$ with the following cell-level state properties:

- **isStart** / **isTarget** — Fixed position markers
- **isWall** — Impassable obstacle
- **isVisited (Closed Set)** — Cell has been fully evaluated
- **isOpen (Frontier)** — Cell is in the active search queue
- **isPath** — Cell is part of the final reconstructed route
- **parentPointer** — Reference to the predecessor cell for path reconstruction
- **gCost** — Accumulated cost from start node
- **hCost** — Heuristic estimate to target (Manhattan distance)
- **fCost** — Total evaluation score ($g + h$) for A* sorting

### Path Reconstruction

Once the target cell is discovered, the algorithm traces parent pointers backwards from target to start, flagging each cell in the resulting optimal spatial trajectory as part of the **shortest path array**.

---

## Interface Operation Manual

1. **Select Algorithm** — Choose Dijkstra, A*, BFS, or DFS via the tabbed selector.
2. **Choose Tool Mode** — Select an interaction mode:
   - **Draw Walls:** Click and drag to place obstacles on the grid.
   - **Erase:** Click and drag to remove obstacles.
   - **Drag Start:** Move the start node to any empty cell.
   - **Drag Target:** Move the target node to any empty cell.
3. **Adjust Speed** — Set animation delay from 1ms to 250ms per step.
4. **Load Presets** — Quick-load maze configurations:
   - *Sub-Division Hedge:* Recursive wall subdivision maze.
   - *Dense Forest:* Random obstacle field with 35% density.
   - *No Path Trap:* A wall barrier separating start from target.
5. **Execute** — Use action buttons:
   - **START PATHFINDING** — Begin the selected algorithm.
   - **PAUSE / RESUME** — Toggle execution mid-search.
   - **CLEAR FRONTIER** — Reset visited/path states (keeps walls).
   - **RESET GRID** — Clear all walls, start, and target to default positions.
   - **EXPORT CSV** — Download full grid state and heuristic logs.
6. **Analyze Results** — Observe:
   - *Diagnostic Header:* Engine mode, step counter, footprint count, path cost.
   - *Grid Matrix:* Animated cell color transitions as the algorithm explores.
   - *Telemetry Cards:* Visited cell volume %, efficiency delta, convergence velocity.
   - *Exploration Chart:* Rolling visited cell count curve.
   - *Execution Log:* Tabular step-by-step coordinate inspections.

---

## Local Browser Deployment Guide

This application runs entirely client-side with no server dependencies, build steps, or compilation tools.

### Requirements

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection for first load (Chart.js fetched from CDN)

### Setup

1. Clone or download the repository containing the six project files.
2. Open `index.html` in any modern web browser.
3. No installation or build step required.

### File Structure

```
dijkstra-pathfinding-visualizer/
  index.html       — Main application structure
  style.css        — Botanical theme stylesheet
  script.js        — Simulation engine and UI controllers
  thumbnail.svg    — Vector preview graphic
  project.json     — Project metadata
  README.md        — This documentation
```

---

## License

MIT — Free for educational and personal use.
