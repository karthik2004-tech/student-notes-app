/**
 * Algorithm Sorting & Pathfinding Visualizer Logic
 */

// Tab Switching
function switchTab(tabName) {
    const tabs = document.querySelectorAll(".tab-btn");
    const sections = document.querySelectorAll(".visualizer-section");
    
    tabs.forEach(tab => tab.classList.remove("active"));
    sections.forEach(sec => sec.classList.remove("active"));
    
    if (tabName === 'sorting') {
        document.querySelector(".tab-navbar button:nth-child(1)").classList.add("active");
        document.getElementById("sorting-section").classList.add("active");
        // Auto-generate array if container is empty
        if (document.getElementById("sortingContainer").children.length === 0) {
            generateSortingArray();
        }
    } else {
        document.querySelector(".tab-navbar button:nth-child(2)").classList.add("active");
        document.getElementById("pathfinding-section").classList.add("active");
        // Auto-generate grid if container is empty
        if (document.getElementById("pathfindingGrid").children.length === 0) {
            initializePathfindingGrid();
        }
    }
}

// Global Async Sleep Helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- SORTING STUDIO LOGIC ---
let sortingArray = [];
let isSortingRunning = false;
let sortingTimer = null;
let sortingStart = null;
let comparisonsCount = 0;
let writesCount = 0;

// Complexity mappings
const SORTING_COMPLEXITY = {
    bubble: { title: "Bubble Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    selection: { title: "Selection Sort", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    insertion: { title: "Insertion Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    quick: { title: "Quick Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
    merge: { title: "Merge Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" }
};

function updateSortingComplexityInfo() {
    const selected = document.getElementById("sortingAlgoSelect").value;
    const info = SORTING_COMPLEXITY[selected];
    if (info) {
        document.getElementById("sortComplexityTitle").textContent = info.title;
        document.getElementById("sortBestCase").textContent = info.best;
        document.getElementById("sortAvgCase").textContent = info.avg;
        document.getElementById("sortWorstCase").textContent = info.worst;
        document.getElementById("sortSpaceCase").textContent = info.space;
    }
}

function generateSortingArray() {
    if (isSortingRunning) return;

    const size = parseInt(document.getElementById("arraySizeSlider").value);
    const container = document.getElementById("sortingContainer");
    container.innerHTML = "";
    sortingArray = [];

    comparisonsCount = 0;
    writesCount = 0;
    updateSortingStats();
    resetSortingTimer();

    for (let i = 0; i < size; i++) {
        // Height between 10% and 95%
        const val = Math.floor(Math.random() * 85) + 10;
        sortingArray.push(val);

        const bar = document.createElement("div");
        bar.className = "array-bar";
        bar.style.height = `${val}%`;
        container.appendChild(bar);
    }
}

function updateSortingStats() {
    document.getElementById("sortComparisons").textContent = comparisonsCount;
    document.getElementById("sortWrites").textContent = writesCount;
}

function startSortingTimer() {
    sortingStart = Date.now();
    sortingTimer = setInterval(() => {
        const diff = (Date.now() - sortingStart) / 1000;
        document.getElementById("sortTime").textContent = `${diff.toFixed(1)}s`;
    }, 100);
}

function stopSortingTimer() {
    clearInterval(sortingTimer);
}

function resetSortingTimer() {
    clearInterval(sortingTimer);
    document.getElementById("sortTime").textContent = "0.0s";
}

function getSortingDelay() {
    return parseInt(document.getElementById("sortingSpeedSlider").value);
}

// Toggle control states
function toggleSortingControls(isRunning) {
    isSortingRunning = isRunning;
    document.getElementById("startSortingBtn").disabled = isRunning;
    document.getElementById("stopSortingBtn").disabled = !isRunning;
    document.getElementById("arraySizeSlider").disabled = isRunning;
    document.getElementById("sortingAlgoSelect").disabled = isRunning;
}

function stopSorting() {
    toggleSortingControls(false);
    stopSortingTimer();
    generateSortingArray();
}

async function startSorting() {
    if (isSortingRunning) return;
    
    toggleSortingControls(true);
    resetSortingTimer();
    startSortingTimer();
    
    const algo = document.getElementById("sortingAlgoSelect").value;
    const bars = document.getElementById("sortingContainer").children;

    try {
        if (algo === 'bubble') {
            await bubbleSort(bars);
        } else if (algo === 'selection') {
            await selectionSort(bars);
        } else if (algo === 'insertion') {
            await insertionSort(bars);
        } else if (algo === 'quick') {
            await quickSort(bars, 0, sortingArray.length - 1);
        } else if (algo === 'merge') {
            await mergeSort(bars, 0, sortingArray.length - 1);
        }

        if (isSortingRunning) {
            // Animate completed sweep
            for (let i = 0; i < bars.length; i++) {
                bars[i].classList.add("sorted");
                await sleep(5);
            }
        }
    } catch (err) {
        console.log("Sorting aborted:", err);
    } finally {
        toggleSortingControls(false);
        stopSortingTimer();
    }
}

// 1. Bubble Sort
async function bubbleSort(bars) {
    const n = sortingArray.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (!isSortingRunning) return;

            bars[j].classList.add("compare");
            bars[j+1].classList.add("compare");
            comparisonsCount++;
            updateSortingStats();

            await sleep(getSortingDelay());

            if (sortingArray[j] > sortingArray[j+1]) {
                bars[j].classList.add("swap");
                bars[j+1].classList.add("swap");
                
                // Swap values
                let temp = sortingArray[j];
                sortingArray[j] = sortingArray[j+1];
                sortingArray[j+1] = temp;

                bars[j].style.height = `${sortingArray[j]}%`;
                bars[j+1].style.height = `${sortingArray[j+1]}%`;
                writesCount++;
                updateSortingStats();

                await sleep(getSortingDelay());
                bars[j].classList.remove("swap");
                bars[j+1].classList.remove("swap");
            }

            bars[j].classList.remove("compare");
            bars[j+1].classList.remove("compare");
        }
        bars[n-i-1].classList.add("sorted");
    }
    bars[0].classList.add("sorted");
}

// 2. Selection Sort
async function selectionSort(bars) {
    const n = sortingArray.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        bars[i].classList.add("compare");

        for (let j = i + 1; j < n; j++) {
            if (!isSortingRunning) return;

            bars[j].classList.add("compare");
            comparisonsCount++;
            updateSortingStats();
            await sleep(getSortingDelay());

            if (sortingArray[j] < sortingArray[minIdx]) {
                if (minIdx !== i) {
                    bars[minIdx].classList.remove("swap");
                }
                minIdx = j;
                bars[minIdx].classList.add("swap");
            } else {
                bars[j].classList.remove("compare");
            }
        }

        if (minIdx !== i) {
            let temp = sortingArray[i];
            sortingArray[i] = sortingArray[minIdx];
            sortingArray[minIdx] = temp;

            bars[i].style.height = `${sortingArray[i]}%`;
            bars[minIdx].style.height = `${sortingArray[minIdx]}%`;
            writesCount++;
            updateSortingStats();
            await sleep(getSortingDelay());
            
            bars[minIdx].classList.remove("swap");
        }

        bars[minIdx].classList.remove("compare");
        bars[i].classList.remove("compare");
        bars[i].classList.add("sorted");
    }
    bars[n-1].classList.add("sorted");
}

// 3. Insertion Sort
async function insertionSort(bars) {
    const n = sortingArray.length;
    bars[0].classList.add("sorted");

    for (let i = 1; i < n; i++) {
        let key = sortingArray[i];
        let j = i - 1;

        bars[i].classList.add("compare");
        await sleep(getSortingDelay());

        while (j >= 0 && sortingArray[j] > key) {
            if (!isSortingRunning) return;

            bars[j].classList.add("compare");
            bars[j+1].classList.add("swap");
            comparisonsCount++;
            updateSortingStats();

            sortingArray[j+1] = sortingArray[j];
            bars[j+1].style.height = `${sortingArray[j+1]}%`;
            writesCount++;
            updateSortingStats();

            await sleep(getSortingDelay());

            bars[j].classList.remove("compare");
            bars[j+1].classList.remove("swap");
            j--;
        }
        sortingArray[j+1] = key;
        bars[j+1].style.height = `${key}%`;
        writesCount++;
        updateSortingStats();
        bars[i].classList.remove("compare");
        
        for(let k=0; k<=i; k++) {
            bars[k].classList.add("sorted");
        }
    }
}

// 4. Quick Sort
async function quickSort(bars, low, high) {
    if (low < high) {
        if (!isSortingRunning) return;
        let pIdx = await partition(bars, low, high);
        await quickSort(bars, low, pIdx - 1);
        await quickSort(bars, pIdx + 1, high);
    }
    if (low === 0 && high === sortingArray.length - 1) {
        for(let i=0; i<bars.length; i++) bars[i].classList.add("sorted");
    }
}

async function partition(bars, low, high) {
    let pivot = sortingArray[high];
    bars[high].classList.add("swap"); // Highlight pivot
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (!isSortingRunning) return;

        bars[j].classList.add("compare");
        comparisonsCount++;
        updateSortingStats();
        await sleep(getSortingDelay());

        if (sortingArray[j] < pivot) {
            i++;
            // swap
            let temp = sortingArray[i];
            sortingArray[i] = sortingArray[j];
            sortingArray[j] = temp;

            bars[i].style.height = `${sortingArray[i]}%`;
            bars[j].style.height = `${sortingArray[j]}%`;
            writesCount++;
            updateSortingStats();

            bars[i].classList.add("swap");
            await sleep(getSortingDelay());
            bars[i].classList.remove("swap");
        }
        bars[j].classList.remove("compare");
    }

    let temp = sortingArray[i+1];
    sortingArray[i+1] = sortingArray[high];
    sortingArray[high] = temp;

    bars[i+1].style.height = `${sortingArray[i+1]}%`;
    bars[high].style.height = `${sortingArray[high]}%`;
    writesCount++;
    updateSortingStats();

    bars[high].classList.remove("swap");
    await sleep(getSortingDelay());
    return i + 1;
}

// 5. Merge Sort
async function mergeSort(bars, l, r) {
    if (l < r) {
        if (!isSortingRunning) return;
        let m = Math.floor((l + r) / 2);
        await mergeSort(bars, l, m);
        await mergeSort(bars, m + 1, r);
        await merge(bars, l, m, r);
    }
}

async function merge(bars, l, m, r) {
    if (!isSortingRunning) return;

    let n1 = m - l + 1;
    let n2 = r - m;

    let L = [];
    let R = [];

    for (let i = 0; i < n1; i++) L.push(sortingArray[l + i]);
    for (let j = 0; j < n2; j++) R.push(sortingArray[m + 1 + j]);

    let i = 0, j = 0, k = l;

    while (i < n1 && j < n2) {
        if (!isSortingRunning) return;

        bars[k].classList.add("compare");
        comparisonsCount++;
        updateSortingStats();
        await sleep(getSortingDelay());

        if (L[i] <= R[j]) {
            sortingArray[k] = L[i];
            i++;
        } else {
            sortingArray[k] = R[j];
            j++;
        }

        bars[k].style.height = `${sortingArray[k]}%`;
        writesCount++;
        updateSortingStats();
        bars[k].classList.remove("compare");
        k++;
    }

    while (i < n1) {
        if (!isSortingRunning) return;
        sortingArray[k] = L[i];
        bars[k].style.height = `${sortingArray[k]}%`;
        writesCount++;
        updateSortingStats();
        k++;
        i++;
    }

    while (j < n2) {
        if (!isSortingRunning) return;
        sortingArray[k] = R[j];
        bars[k].style.height = `${sortingArray[k]}%`;
        writesCount++;
        updateSortingStats();
        k++;
        j++;
    }
}


// --- PATHFINDING GRID LOGIC ---
const GRID_ROWS = 20;
const GRID_COLS = 40;
let isPathfindingRunning = false;
let pathfindingTimer = null;
let pathfindingStart = null;
let grid = [];

// Node index trackers
let startRow = 9;
let startCol = 8;
let endRow = 9;
let endCol = 31;

// Mouse action states
let isMouseDown = false;
let dragNode = null; // 'start', 'end', or null

// Complexity mapping
const PATHFINDING_COMPLEXITY = {
    dijkstra: { title: "Dijkstra's Algorithm", time: "O((V + E) log V)", space: "O(V)" },
    astar: { title: "A* Search (Manhattan)", time: "O((V + E) log V) heuristic guided", space: "O(V)" },
    bfs: { title: "Breadth-First Search (BFS)", time: "O(V + E)", space: "O(V)" },
    dfs: { title: "Depth-First Search (DFS)", time: "O(V + E)", space: "O(V)" }
};

function updatePathfindingComplexityInfo() {
    const algo = document.getElementById("pathfindingAlgoSelect").value;
    const info = PATHFINDING_COMPLEXITY[algo];
    if (info) {
        document.getElementById("pathComplexityTitle").textContent = info.title;
        document.getElementById("pathTimeCase").textContent = info.time;
        document.getElementById("pathSpaceCase").textContent = info.space;
    }
}

function initializePathfindingGrid() {
    const gridContainer = document.getElementById("pathfindingGrid");
    gridContainer.innerHTML = "";
    grid = [];

    updatePathfindingStats(0, 0);
    resetPathfindingTimer();

    for (let r = 0; r < GRID_ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < GRID_COLS; c++) {
            const node = document.createElement("div");
            node.className = "grid-node";
            node.id = `node-${r}-${c}`;
            
            // Set Node type classes
            if (r === startRow && c === startCol) {
                node.classList.add("start");
            } else if (r === endRow && c === endCol) {
                node.classList.add("end");
            }

            gridContainer.appendChild(node);
            grid[r][c] = {
                row: r,
                col: c,
                isStart: r === startRow && c === startCol,
                isEnd: r === endRow && c === endCol,
                isWall: false,
                isVisited: false,
                distance: Infinity,
                gScore: Infinity,
                fScore: Infinity,
                previousNode: null
            };
        }
    }
}

// Mouse event handlers for Wall drawings and node drag-drop
function handleGridMouseDown(e) {
    e.preventDefault();
    const nodeEl = e.target;
    if (!nodeEl.classList.contains("grid-node")) return;

    isMouseDown = true;
    const [_, r, c] = nodeEl.id.split("-").map(Number);

    if (r === startRow && c === startCol) {
        dragNode = 'start';
    } else if (r === endRow && c === endCol) {
        dragNode = 'end';
    } else {
        dragNode = null;
        toggleWall(r, c);
    }
}

function handleGridMouseOver(e) {
    if (!isMouseDown) return;
    const nodeEl = e.target;
    if (!nodeEl.classList.contains("grid-node")) return;

    const [_, r, c] = nodeEl.id.split("-").map(Number);

    if (dragNode === 'start') {
        if (r === endRow && c === endCol) return; // Prevent start node overriding end node
        
        // Remove old start node
        document.getElementById(`node-${startRow}-${startCol}`).classList.remove("start");
        grid[startRow][startCol].isStart = false;

        startRow = r;
        startCol = c;

        // Set new start node
        document.getElementById(`node-${startRow}-${startCol}`).classList.add("start");
        grid[startRow][startCol].isStart = true;
        
    } else if (dragNode === 'end') {
        if (r === startRow && c === startCol) return; // Prevent end node overriding start node
        
        // Remove old end node
        document.getElementById(`node-${endRow}-${endCol}`).classList.remove("end");
        grid[endRow][endCol].isEnd = false;

        endRow = r;
        endCol = c;

        // Set new end node
        document.getElementById(`node-${endRow}-${endCol}`).classList.add("end");
        grid[endRow][endCol].isEnd = true;
        
    } else {
        // Drawing Walls
        if ((r === startRow && c === startCol) || (r === endRow && c === endCol)) return;
        toggleWall(r, c);
    }
}

function handleGridMouseUp() {
    isMouseDown = false;
    dragNode = null;
}

function toggleWall(r, c) {
    if (grid[r][c].isStart || grid[r][c].isEnd) return;
    
    const nodeEl = document.getElementById(`node-${r}-${c}`);
    grid[r][c].isWall = !grid[r][c].isWall;

    if (grid[r][c].isWall) {
        nodeEl.classList.add("wall");
    } else {
        nodeEl.classList.remove("wall");
    }
}

// Clear Actions
function clearPathfindingWalls() {
    if (isPathfindingRunning) return;
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            grid[r][c].isWall = false;
            document.getElementById(`node-${r}-${c}`).classList.remove("wall");
        }
    }
}

function clearPathfindingGrid() {
    if (isPathfindingRunning) return;
    initializePathfindingGrid();
}

function clearPath() {
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const nodeEl = document.getElementById(`node-${r}-${c}`);
            nodeEl.classList.remove("visited", "shortest-path");
            
            grid[r][c].isVisited = false;
            grid[r][c].distance = Infinity;
            grid[r][c].gScore = Infinity;
            grid[r][c].fScore = Infinity;
            grid[r][c].previousNode = null;
        }
    }
}

// Timer and Stats
function updatePathfindingStats(visited, pathLength) {
    document.getElementById("pathVisited").textContent = visited;
    document.getElementById("pathLength").textContent = pathLength;
}

function startPathfindingTimer() {
    pathfindingStart = Date.now();
    pathfindingTimer = setInterval(() => {
        const diff = (Date.now() - pathfindingStart) / 1000;
        document.getElementById("pathTime").textContent = `${diff.toFixed(1)}s`;
    }, 100);
}

function stopPathfindingTimer() {
    clearInterval(pathfindingTimer);
}

function resetPathfindingTimer() {
    clearInterval(pathfindingTimer);
    document.getElementById("pathTime").textContent = "0.0s";
}

function getPathfindingDelay() {
    return parseInt(document.getElementById("pathfindingSpeedSlider").value);
}

function togglePathfindingControls(isRunning) {
    isPathfindingRunning = isRunning;
    document.getElementById("startPathfindingBtn").disabled = isRunning;
    document.getElementById("clearGridBtn").disabled = isRunning;
    document.getElementById("clearWallsBtn").disabled = isRunning;
    document.getElementById("pathfindingAlgoSelect").disabled = isRunning;
}

// Main visual path execution
async function startPathfinding() {
    if (isPathfindingRunning) return;
    
    // Clear old visual paths before recalculating
    clearPath();
    togglePathfindingControls(true);
    resetPathfindingTimer();
    startPathfindingTimer();

    const algo = document.getElementById("pathfindingAlgoSelect").value;
    const startNode = grid[startRow][startCol];
    const endNode = grid[endRow][endCol];

    let visitedNodesInOrder = [];
    let shortestPathNodes = [];

    // Select algorithm
    if (algo === 'dijkstra') {
        visitedNodesInOrder = solveDijkstra(startNode, endNode);
    } else if (algo === 'astar') {
        visitedNodesInOrder = solveAStar(startNode, endNode);
    } else if (algo === 'bfs') {
        visitedNodesInOrder = solveBFS(startNode, endNode);
    } else if (algo === 'dfs') {
        visitedNodesInOrder = solveDFS(startNode, endNode);
    }

    shortestPathNodes = getShortestPath(endNode);

    // Animate visited nodes
    for (let i = 0; i < visitedNodesInOrder.length; i++) {
        const node = visitedNodesInOrder[i];
        if (!node.isStart && !node.isEnd) {
            document.getElementById(`node-${node.row}-${node.col}`).classList.add("visited");
        }
        updatePathfindingStats(i + 1, 0);
        await sleep(getPathfindingDelay());
    }

    stopPathfindingTimer();

    // Animate shortest path
    if (shortestPathNodes.length > 0 && shortestPathNodes[0].isStart) {
        for (let i = 0; i < shortestPathNodes.length; i++) {
            const node = shortestPathNodes[i];
            if (!node.isStart && !node.isEnd) {
                document.getElementById(`node-${node.row}-${node.col}`).classList.add("shortest-path");
            }
            updatePathfindingStats(visitedNodesInOrder.length, i + 1);
            await sleep(30);
        }
    } else {
        alert("No path found to the destination!");
    }

    togglePathfindingControls(false);
}

// Algorithms Helpers
function getNeighbors(node) {
    const neighbors = [];
    const { row, col } = node;

    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < GRID_ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < GRID_COLS - 1) neighbors.push(grid[row][col + 1]);

    return neighbors.filter(neighbor => !neighbor.isWall);
}

function getShortestPath(endNode) {
    const path = [];
    let current = endNode;
    while (current !== null) {
        path.unshift(current);
        current = current.previousNode;
    }
    return path;
}

// 1. Dijkstra Solver
function solveDijkstra(startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.distance = 0;
    const unvisitedNodes = [];
    
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            unvisitedNodes.push(grid[r][c]);
        }
    }

    while (unvisitedNodes.length > 0) {
        unvisitedNodes.sort((a, b) => a.distance - b.distance);
        const closestNode = unvisitedNodes.shift();

        if (closestNode.isWall) continue;
        if (closestNode.distance === Infinity) break;

        closestNode.isVisited = true;
        visitedNodesInOrder.push(closestNode);

        if (closestNode === endNode) break;

        const neighbors = getNeighbors(closestNode);
        for (const neighbor of neighbors) {
            const altDistance = closestNode.distance + 1;
            if (altDistance < neighbor.distance) {
                neighbor.distance = altDistance;
                neighbor.previousNode = closestNode;
            }
        }
    }
    return visitedNodesInOrder;
}

// 2. A* Solver
function solveAStar(startNode, endNode) {
    const visitedNodesInOrder = [];
    startNode.gScore = 0;
    startNode.fScore = manhattanDistance(startNode, endNode);
    
    const openSet = [startNode];

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.fScore - b.fScore);
        const current = openSet.shift();

        if (current.isWall) continue;
        current.isVisited = true;
        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            const tentativeGScore = current.gScore + 1;
            if (tentativeGScore < neighbor.gScore) {
                neighbor.previousNode = current;
                neighbor.gScore = tentativeGScore;
                neighbor.fScore = neighbor.gScore + manhattanDistance(neighbor, endNode);
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    return visitedNodesInOrder;
}

function manhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// 3. BFS Solver
function solveBFS(startNode, endNode) {
    const visitedNodesInOrder = [];
    const queue = [startNode];
    startNode.isVisited = true;

    while (queue.length > 0) {
        const current = queue.shift();
        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.isVisited = true;
                neighbor.previousNode = current;
                queue.push(neighbor);
            }
        }
    }
    return visitedNodesInOrder;
}

// 4. DFS Solver
function solveDFS(startNode, endNode) {
    const visitedNodesInOrder = [];
    const stack = [startNode];

    while (stack.length > 0) {
        const current = stack.pop();
        
        if (current.isVisited) continue;
        current.isVisited = true;
        visitedNodesInOrder.push(current);

        if (current === endNode) break;

        const neighbors = getNeighbors(current);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.previousNode = current;
                stack.push(neighbor);
            }
        }
    }
    return visitedNodesInOrder;
}

// Initial Array Generation on script load
document.addEventListener("DOMContentLoaded", () => {
    generateSortingArray();
    updateSortingComplexityInfo();
    updatePathfindingComplexityInfo();
});
