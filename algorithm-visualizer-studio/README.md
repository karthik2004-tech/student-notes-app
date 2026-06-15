# ⚡ Algorithm Sorting & Pathfinding Visualizer Studio

A premium educational visualizer application where students can select, configure, and inspect classic Sorting and Pathfinding Algorithms step-by-step with smooth animations and dynamic performance dashboards.

---

## ✨ Features

### 1. 📊 Sorting Studio Canvas
- Renders arrays of numeric values dynamically as vertical bars.
- Supports **5 Sorting Algorithms**:
  - Bubble Sort
  - Selection Sort
  - Insertion Sort
  - Quick Sort
  - Merge Sort
- Track real-time runtime metrics: **Comparisons**, **Swaps/Writes**, and **Time Elapsed**.
- Highlighted bar colors indicate states: Default (Blue), Comparing (Yellow), Swapping (Red), and Sorted (Green sweep animation).

### 2. 🗺️ Pathfinding 2D Grid
- Built an interactive $20 \times 40$ node simulation grid.
- Move **Start Node** (Blue circle) and **End Node** (Green target) via direct click-and-drag.
- Click and drag empty cells to draw **Walls** blocking path traversal.
- Supports **4 Pathfinding solvers**:
  - **Dijkstra's Algorithm**: Guarantees shortest path search.
  - **A\* Search**: Heuristic-guided pathfinder using Manhattan distance.
  - **Breadth-First Search (BFS)**: Unweighted queue search mapping shortest paths.
  - **Depth-First Search (DFS)**: Stack traversal.
- Renders search expansions (visited ripples) and path results.
- Track metrics: **Visited Nodes**, **Path length**, and **Search Time**.

### 3. 📈 Complexity Dashboard
- Side-panel cards showing O-notation values for Time (Best, Average, Worst) and Space parameters.

### 4. 🌓 Unified Theme Synchronization
- Completely integrated with the repository's core `global-theme.css` and `global-theme.js` to support real-time dark/light mode layouts.

---

## 📂 Project Structure

```text
algorithm-visualizer-studio/
│
├── index.html   # Tabs, controllers, & dashboards HTML layouts
├── style.css    # Sorting bar transformations & grid cells keyframe styles
├── script.js    # Async sorting animations & pathfinding algorithms
└── README.md    # Documentation
```

---

## 🚀 How to Run Locally

### 1. Start Server
Run a local server in the repository root directory:
```bash
python -m http.server 8000
```

### 2. Open URL
Navigate to the project directory in your browser:
```text
http://localhost:8000/algorithm-visualizer-studio/index.html
```

---

## 🛠️ Technology Stack
- **Dashboard Structure**: HTML5 Semantic markup
- **Layout & Styles**: CSS3 grid and flexbox using the core global CSS custom variables (`global-theme.css`)
- **Engine Logic**: ES6+ Javascript, async/await delay sleep loops, queue/stack models, heuristics solvers, and mouse listeners.
