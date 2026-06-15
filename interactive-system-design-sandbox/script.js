document.addEventListener('DOMContentLoaded', () => {

    // --- State ---
    let deployedNodes = []; // Array to track nodes on canvas
    let nodeIdCounter = 0;

    // --- DOM Elements ---
    const toolboxNodes = document.querySelectorAll('.tool-node');
    const dropCanvas = document.getElementById('drop-canvas');
    const placeholder = document.getElementById('canvas-placeholder');
    const btnClear = document.getElementById('btn-clear');
    
    const inputRps = document.getElementById('input-rps');
    const btnSimulate = document.getElementById('btn-simulate');
    
    const resStatus = document.getElementById('res-status');
    const resCost = document.getElementById('res-cost');
    const alertsContainer = document.getElementById('alerts-container');

    // --- Drag and Drop Logic ---
    let draggedSource = null;
    let draggedNodeId = null;

    // 1. Drag Start from Toolbox
    toolboxNodes.forEach(node => {
        node.addEventListener('dragstart', (e) => {
            draggedSource = 'toolbox';
            e.dataTransfer.setData('type', node.getAttribute('data-type'));
            e.dataTransfer.setData('cap', node.getAttribute('data-cap'));
            e.dataTransfer.setData('cost', node.getAttribute('data-cost'));
            e.dataTransfer.setData('icon', node.querySelector('i').className);
            e.dataTransfer.setData('label', node.querySelector('span').textContent);
            // Calculate offset to grab from center
            const rect = node.getBoundingClientRect();
            e.dataTransfer.setDragImage(node, rect.width / 2, rect.height / 2);
        });
    });

    // 2. Drag Over Canvas
    dropCanvas.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
    });

    // 3. Drop on Canvas
    dropCanvas.addEventListener('drop', (e) => {
        e.preventDefault();

        // Get coordinates relative to canvas
        const canvasRect = dropCanvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.left;
        let y = e.clientY - canvasRect.top;

        if (draggedSource === 'toolbox') {
            // Create a new deployed node
            const id = 'node_' + (nodeIdCounter++);
            const type = e.dataTransfer.getData('type');
            const cap = parseInt(e.dataTransfer.getData('cap'));
            const cost = parseFloat(e.dataTransfer.getData('cost'));
            const iconClass = e.dataTransfer.getData('icon');
            const label = e.dataTransfer.getData('label');

            const nodeObj = { id, type, cap, cost, label, x, y };
            deployedNodes.push(nodeObj);
            
            renderNodeOnCanvas(nodeObj, iconClass);
            updateCanvasPlaceholder();
        } else if (draggedSource === 'canvas' && draggedNodeId) {
            // Update existing node position
            const nodeElement = document.getElementById(draggedNodeId);
            // Adjust offset to center the element on cursor
            nodeElement.style.left = (x - nodeElement.offsetWidth / 2) + 'px';
            nodeElement.style.top = (y - nodeElement.offsetHeight / 2) + 'px';
            
            // Update state
            const nodeData = deployedNodes.find(n => n.id === draggedNodeId);
            if (nodeData) {
                nodeData.x = x;
                nodeData.y = y;
            }
        }
        
        // Auto-run simulation when dropping new elements
        runSimulation();
    });

    // Render node physically on the DOM
    function renderNodeOnCanvas(nodeData, iconClass) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'canvas-node';
        nodeEl.id = nodeData.id;
        // Center placement
        nodeEl.style.left = (nodeData.x - 50) + 'px'; // assume 100px width
        nodeEl.style.top = (nodeData.y - 35) + 'px'; // assume 70px height
        nodeEl.draggable = true;

        nodeEl.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${nodeData.label}</span>
            <button class="delete-btn"><i class="fas fa-times"></i></button>
        `;

        // Canvas Node Dragging
        nodeEl.addEventListener('dragstart', (e) => {
            draggedSource = 'canvas';
            draggedNodeId = nodeData.id;
            // Transparent drag image offset
            const rect = nodeEl.getBoundingClientRect();
            e.dataTransfer.setDragImage(nodeEl, rect.width / 2, rect.height / 2);
        });

        // Delete Node
        const delBtn = nodeEl.querySelector('.delete-btn');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nodeEl.remove();
            deployedNodes = deployedNodes.filter(n => n.id !== nodeData.id);
            updateCanvasPlaceholder();
            runSimulation();
        });

        dropCanvas.appendChild(nodeEl);
    }

    function updateCanvasPlaceholder() {
        if (deployedNodes.length > 0) {
            placeholder.style.display = 'none';
        } else {
            placeholder.style.display = 'block';
        }
    }

    // --- Clear Canvas ---
    btnClear.addEventListener('click', () => {
        const nodes = dropCanvas.querySelectorAll('.canvas-node');
        nodes.forEach(n => n.remove());
        deployedNodes = [];
        updateCanvasPlaceholder();
        resStatus.textContent = "Pending...";
        resStatus.className = "result-value";
        resCost.textContent = "$0 / mo";
        alertsContainer.innerHTML = '';
    });

    // --- Simulation Logic ---
    btnSimulate.addEventListener('click', runSimulation);

    function runSimulation() {
        if (deployedNodes.length === 0) {
            resStatus.textContent = "No Architecture";
            resStatus.className = "result-value fail";
            alertsContainer.innerHTML = '';
            resCost.textContent = "$0 / mo";
            return;
        }

        const targetRPS = parseInt(inputRps.value) || 0;
        let totalCost = 0;
        
        // Group capacities by layer type
        const layers = {
            lb: 0,
            web: 0,
            db: 0,
            cache: 0,
            storage: 0
        };

        const counts = { lb:0, web:0, db:0, cache:0, storage:0, client:0 };

        deployedNodes.forEach(node => {
            totalCost += node.cost;
            if (layers[node.type] !== undefined) {
                layers[node.type] += node.cap;
                counts[node.type]++;
            }
            if(node.type === 'client') counts.client++;
        });

        // Calculate Cost
        resCost.textContent = '$' + totalCost.toLocaleString() + ' / mo';

        alertsContainer.innerHTML = ''; // Clear old alerts
        let hasBottleneck = false;
        let isFunctional = true;

        // Basic sanity checks
        if (counts.web === 0 && counts.db === 0 && counts.storage === 0) {
            addAlert('error', 'Architecture must contain at least one Web Server, Database, or Storage node.');
            isFunctional = false;
        }

        if (counts.web > 1 && counts.lb === 0) {
            addAlert('warn', 'You have multiple Web Servers but no Load Balancer! Traffic might not distribute evenly.');
        }

        // Bottleneck analysis based on Target RPS
        // 1. Load Balancer Layer
        if (counts.lb > 0 && layers.lb < targetRPS) {
            addAlert('error', `Load Balancer bottleneck! Capacity: ${layers.lb} RPS | Target: ${targetRPS} RPS`);
            hasBottleneck = true;
        }

        // 2. Web Server Layer
        if (counts.web > 0 && layers.web < targetRPS) {
            addAlert('error', `Web Server bottleneck! Total Capacity: ${layers.web} RPS | Target: ${targetRPS} RPS. Add more servers to scale horizontally.`);
            hasBottleneck = true;
        }

        // 3. Database Layer
        // If there's a cache, it absorbs 80% of read traffic (simplified model)
        const cacheHitRate = counts.cache > 0 ? 0.8 : 0;
        const dbTraffic = counts.web > 0 ? targetRPS * (1 - cacheHitRate) : 0;

        if (counts.db > 0 && layers.db < dbTraffic) {
            addAlert('error', `Database bottleneck! Projected load is ${dbTraffic} RPS, but DB capacity is ${layers.db} RPS.`);
            hasBottleneck = true;
        } else if (counts.db > 0 && counts.cache > 0) {
            addAlert('info', `Redis Cache is absorbing ~80% of database reads. DB load reduced to ${dbTraffic} RPS.`);
        }

        // Output Final Status
        if (!isFunctional) {
            resStatus.textContent = "Invalid Setup";
            resStatus.className = "result-value fail";
        } else if (hasBottleneck) {
            resStatus.textContent = "Bottleneck Detected";
            resStatus.className = "result-value warn";
        } else {
            resStatus.textContent = "System Stable";
            resStatus.className = "result-value ok";
            if (totalCost > 0) {
                addAlert('success', `Architecture can handle ${targetRPS} RPS successfully!`);
            }
        }
    }

    function addAlert(type, message) {
        const div = document.createElement('div');
        div.className = `alert ${type}`;
        
        let icon = 'info-circle';
        if (type === 'error') icon = 'times-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'warn') icon = 'exclamation-triangle';

        div.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
        alertsContainer.appendChild(div);
    }
});
