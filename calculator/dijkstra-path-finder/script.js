document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration ---
    const ROWS = 20;
    const COLS = 40;
    let START_NODE_ROW = 10;
    let START_NODE_COL = 10;
    let TARGET_NODE_ROW = 10;
    let TARGET_NODE_COL = 30;

    // --- State ---
    let grid = [];
    let isMousePressed = false;
    let isDrawingWall = true; // true = draw, false = erase
    let draggingNode = null; // 'start', 'target', or null
    let isAlgorithmRunning = false;

    // --- DOM Elements ---
    const gridContainer = document.getElementById('grid-container');
    const startBtn = document.getElementById('start-btn');
    const clearBoardBtn = document.getElementById('clear-board-btn');
    const clearPathBtn = document.getElementById('clear-path-btn');
    const speedSelect = document.getElementById('speed-select');

    // --- Initialization ---
    function initializeGrid() {
        gridContainer.innerHTML = '';
        const gridElement = document.createElement('div');
        gridElement.className = 'grid';
        gridElement.style.gridTemplateColumns = `repeat(${COLS}, 25px)`;
        gridElement.addEventListener('mouseleave', handleMouseUp); // Stop drawing if mouse leaves grid

        grid = [];
        for (let row = 0; row < ROWS; row++) {
            const currentRow = [];
            for (let col = 0; col < COLS; col++) {
                const node = createNode(col, row);
                currentRow.push(node);
                
                const nodeElement = document.createElement('div');
                nodeElement.id = `node-${row}-${col}`;
                nodeElement.className = 'node';
                
                if (node.isStart) nodeElement.classList.add('node-start');
                if (node.isTarget) nodeElement.classList.add('node-target');

                // Mouse Events
                nodeElement.addEventListener('mousedown', (e) => handleMouseDown(row, col, e));
                nodeElement.addEventListener('mouseenter', () => handleMouseEnter(row, col));
                nodeElement.addEventListener('mouseup', handleMouseUp);

                gridElement.appendChild(nodeElement);
            }
            grid.push(currentRow);
        }
        gridContainer.appendChild(gridElement);
    }

    function createNode(col, row) {
        return {
            col,
            row,
            isStart: row === START_NODE_ROW && col === START_NODE_COL,
            isTarget: row === TARGET_NODE_ROW && col === TARGET_NODE_COL,
            distance: Infinity,
            isVisited: false,
            isWall: false,
            previousNode: null,
        };
    }

    // --- Mouse Handlers ---
    function handleMouseDown(row, col, event) {
        if (isAlgorithmRunning) return;
        event.preventDefault(); // Prevent text selection
        
        isMousePressed = true;
        
        if (grid[row][col].isStart) {
            draggingNode = 'start';
        } else if (grid[row][col].isTarget) {
            draggingNode = 'target';
        } else {
            // Toggle Wall
            const node = grid[row][col];
            isDrawingWall = !node.isWall;
            toggleWall(row, col);
        }
    }

    function handleMouseEnter(row, col) {
        if (!isMousePressed || isAlgorithmRunning) return;

        if (draggingNode === 'start') {
            moveNode(row, col, 'start');
        } else if (draggingNode === 'target') {
            moveNode(row, col, 'target');
        } else {
            toggleWall(row, col);
        }
    }

    function handleMouseUp() {
        isMousePressed = false;
        draggingNode = null;
    }

    function toggleWall(row, col) {
        const node = grid[row][col];
        if (node.isStart || node.isTarget) return;

        node.isWall = isDrawingWall;
        const nodeElement = document.getElementById(`node-${row}-${col}`);
        if (isDrawingWall) {
            nodeElement.classList.add('node-wall');
        } else {
            nodeElement.classList.remove('node-wall');
        }
    }

    function moveNode(newRow, newCol, type) {
        const node = grid[newRow][newCol];
        if (node.isWall || (type === 'start' && node.isTarget) || (type === 'target' && node.isStart)) return;

        // Clear old position
        let oldRow = type === 'start' ? START_NODE_ROW : TARGET_NODE_ROW;
        let oldCol = type === 'start' ? START_NODE_COL : TARGET_NODE_COL;
        
        grid[oldRow][oldCol][type === 'start' ? 'isStart' : 'isTarget'] = false;
        document.getElementById(`node-${oldRow}-${oldCol}`).classList.remove(`node-${type}`);

        // Set new position
        if (type === 'start') {
            START_NODE_ROW = newRow;
            START_NODE_COL = newCol;
        } else {
            TARGET_NODE_ROW = newRow;
            TARGET_NODE_COL = newCol;
        }

        grid[newRow][newCol][type === 'start' ? 'isStart' : 'isTarget'] = true;
        document.getElementById(`node-${newRow}-${newCol}`).classList.add(`node-${type}`);
    }

    // --- Controls ---
    clearBoardBtn.addEventListener('click', () => {
        if (isAlgorithmRunning) return;
        initializeGrid();
        resetPathStyles();
    });

    clearPathBtn.addEventListener('click', () => {
        if (isAlgorithmRunning) return;
        clearPathState();
        resetPathStyles();
    });

    function clearPathState() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const node = grid[row][col];
                node.distance = Infinity;
                node.isVisited = false;
                node.previousNode = null;
            }
        }
    }

    function resetPathStyles() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const nodeElement = document.getElementById(`node-${row}-${col}`);
                nodeElement.classList.remove('node-visited', 'node-path');
            }
        }
    }

    // --- Dijkstra Algorithm ---
    startBtn.addEventListener('click', () => {
        if (isAlgorithmRunning) return;
        clearPathState();
        resetPathStyles();
        
        const startNode = grid[START_NODE_ROW][START_NODE_COL];
        const targetNode = grid[TARGET_NODE_ROW][TARGET_NODE_COL];
        
        const visitedNodesInOrder = dijkstra(grid, startNode, targetNode);
        const nodesInShortestPathOrder = getNodesInShortestPathOrder(targetNode);
        
        animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder);
    });

    function dijkstra(grid, startNode, targetNode) {
        const visitedNodesInOrder = [];
        startNode.distance = 0;
        const unvisitedNodes = getAllNodes(grid);

        while (!!unvisitedNodes.length) {
            sortNodesByDistance(unvisitedNodes);
            const closestNode = unvisitedNodes.shift();

            // If we encounter a wall, we skip it.
            if (closestNode.isWall) continue;
            
            // If the closest node is at a distance of infinity,
            // we must be trapped and should therefore stop.
            if (closestNode.distance === Infinity) return visitedNodesInOrder;
            
            closestNode.isVisited = true;
            visitedNodesInOrder.push(closestNode);
            
            if (closestNode === targetNode) return visitedNodesInOrder;
            
            updateUnvisitedNeighbors(closestNode, grid);
        }
        return visitedNodesInOrder;
    }

    function sortNodesByDistance(unvisitedNodes) {
        unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
    }

    function updateUnvisitedNeighbors(node, grid) {
        const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
        for (const neighbor of unvisitedNeighbors) {
            neighbor.distance = node.distance + 1;
            neighbor.previousNode = node;
        }
    }

    function getUnvisitedNeighbors(node, grid) {
        const neighbors = [];
        const {col, row} = node;
        if (row > 0) neighbors.push(grid[row - 1][col]);
        if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
        if (col > 0) neighbors.push(grid[row][col - 1]);
        if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
        return neighbors.filter(neighbor => !neighbor.isVisited);
    }

    function getAllNodes(grid) {
        const nodes = [];
        for (const row of grid) {
            for (const node of row) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    function getNodesInShortestPathOrder(targetNode) {
        const nodesInShortestPathOrder = [];
        let currentNode = targetNode;
        while (currentNode !== null) {
            nodesInShortestPathOrder.unshift(currentNode);
            currentNode = currentNode.previousNode;
        }
        return nodesInShortestPathOrder;
    }

    // --- Animation ---
    function animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder) {
        isAlgorithmRunning = true;
        toggleButtons(true);
        
        let speed = 10;
        if (speedSelect.value === 'fast') speed = 5;
        if (speedSelect.value === 'slow') speed = 30;

        for (let i = 0; i <= visitedNodesInOrder.length; i++) {
            if (i === visitedNodesInOrder.length) {
                setTimeout(() => {
                    animateShortestPath(nodesInShortestPathOrder);
                }, speed * i);
                return;
            }
            
            setTimeout(() => {
                const node = visitedNodesInOrder[i];
                if (!node.isStart && !node.isTarget) {
                    document.getElementById(`node-${node.row}-${node.col}`).classList.add('node-visited');
                }
            }, speed * i);
        }
    }

    function animateShortestPath(nodesInShortestPathOrder) {
        // Check if path exists (start node's previous is null, so if length is 1, no path found)
        if (nodesInShortestPathOrder.length <= 1) {
            isAlgorithmRunning = false;
            toggleButtons(false);
            return;
        }

        for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
            setTimeout(() => {
                const node = nodesInShortestPathOrder[i];
                if (!node.isStart && !node.isTarget) {
                    const el = document.getElementById(`node-${node.row}-${node.col}`);
                    el.classList.remove('node-visited');
                    el.classList.add('node-path');
                }
                
                if (i === nodesInShortestPathOrder.length - 1) {
                    isAlgorithmRunning = false;
                    toggleButtons(false);
                }
            }, 50 * i); // Fixed speed for shortest path drawing
        }
    }

    function toggleButtons(disabled) {
        startBtn.disabled = disabled;
        clearBoardBtn.disabled = disabled;
        clearPathBtn.disabled = disabled;
        speedSelect.disabled = disabled;
    }

    // Start
    initializeGrid();
});
