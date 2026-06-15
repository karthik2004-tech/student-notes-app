/**
 * LogicGate Studio: Core Circuit Simulator & Propagation Engine
 */

// LocalStorage Utility Standard
const StorageUtil = { 
    set(key, value) { 
        try { 
            localStorage.setItem(key, JSON.stringify(value)); 
            return true; 
        } catch (error) { 
            console.error('LocalStorage quota exceeded or unavailable:', error); 
            return false; 
        } 
    }, 
    get(key, defaultValue = null) { 
        try { 
            const item = localStorage.getItem(key); 
            return item ? JSON.parse(item) : defaultValue; 
        } catch (error) { 
            console.error('Error reading from LocalStorage:', error); 
            return defaultValue; 
        } 
    } 
};

// State objects
let nodes = [];
let wires = [];
let selectedPort = null; // Stores { nodeId, portType: 'output' } or { nodeId, portType: 'input', portName }

// DOM selectors
const canvasNodes = document.getElementById("canvasNodes");
const connectionsSvg = document.getElementById("connectionsSvg");
const truthTableContainer = document.getElementById("truthTableContainer");

// Init
document.addEventListener("DOMContentLoaded", () => {
    // Attempt loading saved circuit layout
    const savedNodes = StorageUtil.get("logic_nodes", null);
    const savedWires = StorageUtil.get("logic_wires", null);
    
    if (savedNodes) {
        nodes = savedNodes;
        wires = savedWires || [];
        renderCircuit();
    } else {
        loadDemoCircuit();
    }
});

function saveCircuitState() {
    StorageUtil.set("logic_nodes", nodes);
    StorageUtil.set("logic_wires", wires);
}

function clearCanvas() {
    if (confirm("Clear active circuit canvas?")) {
        nodes = [];
        wires = [];
        selectedPort = null;
        renderCircuit();
        saveCircuitState();
    }
}

// Loads a preset half-adder logic circuit demo
function loadDemoCircuit() {
    nodes = [
        { id: "node_sw_a", type: "switch", name: "Switch A", x: 60, y: 80, value: 1, outputValue: 1 },
        { id: "node_sw_b", type: "switch", name: "Switch B", x: 60, y: 220, value: 0, outputValue: 0 },
        { id: "node_gate_xor", type: "xor", name: "XOR 1", x: 260, y: 70, outputValue: 0 },
        { id: "node_gate_and", type: "and", name: "AND 1", x: 260, y: 230, outputValue: 0 },
        { id: "node_bulb_sum", type: "bulb", name: "Sum Bulb", x: 480, y: 85, outputValue: 0 },
        { id: "node_bulb_carry", type: "bulb", name: "Carry Bulb", x: 480, y: 245, outputValue: 0 }
    ];

    wires = [
        { id: "wire_1", fromNodeId: "node_sw_a", toNodeId: "node_gate_xor", toInputPort: "a" },
        { id: "wire_2", fromNodeId: "node_sw_b", toNodeId: "node_gate_xor", toInputPort: "b" },
        { id: "wire_3", fromNodeId: "node_sw_a", toNodeId: "node_gate_and", toInputPort: "a" },
        { id: "wire_4", fromNodeId: "node_sw_b", toNodeId: "node_gate_and", toInputPort: "b" },
        { id: "wire_5", fromNodeId: "node_gate_xor", toNodeId: "node_bulb_sum", toInputPort: "single" },
        { id: "wire_6", fromNodeId: "node_gate_and", toNodeId: "node_bulb_carry", toInputPort: "single" }
    ];

    selectedPort = null;
    evaluateCircuit();
    renderCircuit();
    saveCircuitState();
}

// Add a selected component to canvas
function addNode(type) {
    const id = `node_${type}_${Date.now()}`;
    let name = type.toUpperCase();
    if (type === "switch") name = "Switch";
    if (type === "bulb") name = "Bulb";
    
    nodes.push({
        id,
        type,
        name,
        x: 100 + (nodes.length * 20) % 200,
        y: 100 + (nodes.length * 20) % 200,
        value: 0,
        outputValue: 0
    });
    
    renderCircuit();
    evaluateCircuit();
    saveCircuitState();
}

// Deletes a specific component
function deleteNode(nodeId) {
    nodes = nodes.filter(n => n.id !== nodeId);
    // Remove wires connected to this deleted node
    wires = wires.filter(w => w.fromNodeId !== nodeId && w.toNodeId !== nodeId);
    
    evaluateCircuit();
    renderCircuit();
    saveCircuitState();
}

// Renders visual circuit components to screen
function renderCircuit() {
    canvasNodes.innerHTML = "";
    
    nodes.forEach(node => {
        const card = document.createElement("div");
        card.className = "gate-card";
        card.id = node.id;
        card.style.left = `${node.x}px`;
        card.style.top = `${node.y}px`;
        
        // Header
        const header = document.createElement("div");
        card.appendChild(header);
        header.className = "gate-card-header";
        header.innerHTML = `
            <span>${node.name}</span>
            <button class="btn-delete-node" onclick="deleteNode('${node.id}')"><i class="fas fa-times"></i></button>
        `;
        
        // Body
        const body = document.createElement("div");
        body.className = "gate-card-body";
        card.appendChild(body);
        
        if (node.type === "switch") {
            const toggle = document.createElement("div");
            toggle.className = node.value ? "switch-state-box high" : "switch-state-box";
            toggle.textContent = node.value ? "1" : "0";
            toggle.onclick = () => toggleSwitch(node.id);
            body.appendChild(toggle);
        } else if (node.type === "bulb") {
            const bulb = document.createElement("i");
            bulb.className = node.outputValue ? "fas fa-lightbulb bulb-icon active" : "fas fa-lightbulb bulb-icon";
            body.appendChild(bulb);
        } else {
            const label = document.createElement("div");
            label.className = "gate-title";
            label.textContent = node.type.toUpperCase();
            body.appendChild(label);
        }
        
        // Output port dot
        if (node.type !== "bulb") {
            const outDot = document.createElement("div");
            outDot.className = "port-dot port-output";
            outDot.id = `port-out-${node.id}`;
            outDot.title = "Output port - Click to wire";
            outDot.onclick = (e) => handlePortClick(node.id, "output", null, e);
            card.appendChild(outDot);
        }
        
        // Input port dots
        if (node.type === "not" || node.type === "bulb") {
            const inDot = document.createElement("div");
            inDot.className = "port-dot port-input-single";
            inDot.id = `port-in-${node.id}-single`;
            inDot.title = "Input port";
            inDot.onclick = (e) => handlePortClick(node.id, "input", "single", e);
            card.appendChild(inDot);
        } else if (node.type !== "switch" && node.type !== "bulb") {
            const inDotA = document.createElement("div");
            inDotA.className = "port-dot port-input-a";
            inDotA.id = `port-in-${node.id}-a`;
            inDotA.title = "Input A";
            inDotA.onclick = (e) => handlePortClick(node.id, "input", "a", e);
            card.appendChild(inDotA);

            const inDotB = document.createElement("div");
            inDotB.className = "port-dot port-input-b";
            inDotB.id = `port-in-${node.id}-b`;
            inDotB.title = "Input B";
            inDotB.onclick = (e) => handlePortClick(node.id, "input", "b", e);
            card.appendChild(inDotA);
            card.appendChild(inDotB);
        }
        
        canvasNodes.appendChild(card);
        makeDraggable(card, header, node);
    });
    
    // Trigger SVG wire pathways mapping redraw
    setTimeout(() => {
        drawWires();
        generateTruthTable();
    }, 50);
}

// Binds visual drag and drops
function makeDraggable(element, handle, nodeObj) {
    let startX = 0, startY = 0;
    
    handle.onmousedown = (e) => {
        if (e.button !== 0) return; // Left click only
        
        e.preventDefault();
        startX = e.clientX - element.offsetLeft;
        startY = e.clientY - element.offsetTop;
        
        document.onmousemove = (moveEvent) => {
            moveEvent.preventDefault();
            let newX = Math.max(10, Math.min(2200, moveEvent.clientX - startX));
            let newY = Math.max(10, Math.min(2200, moveEvent.clientY - startY));
            
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            
            nodeObj.x = newX;
            nodeObj.y = newY;
            
            drawWires();
        };
        
        document.onmouseup = () => {
            document.onmousemove = null;
            document.onmouseup = null;
            saveCircuitState();
        };
    };
}

// Interactive port connector logic
function handlePortClick(nodeId, portType, portName, event) {
    event.stopPropagation();
    
    if (!selectedPort) {
        // Step 1: Select Output port
        if (portType !== "output") {
            alert("Please select an Output Port first, then link to an Input Port.");
            return;
        }
        
        selectedPort = { nodeId, portType };
        // Visually highlight port dot
        document.querySelectorAll(".port-dot").forEach(d => d.classList.remove("selected"));
        document.getElementById(`port-out-${nodeId}`).classList.add("selected");
    } else {
        // Step 2: Select Input port
        if (portType !== "input") {
            // Re-select output instead
            selectedPort = { nodeId, portType };
            document.querySelectorAll(".port-dot").forEach(d => d.classList.remove("selected"));
            document.getElementById(`port-out-${nodeId}`).classList.add("selected");
            return;
        }
        
        // Prevent feedback loops
        if (selectedPort.nodeId === nodeId) {
            alert("Cannot connect a gate to itself.");
            selectedPort = null;
            document.querySelectorAll(".port-dot").forEach(d => d.classList.remove("selected"));
            return;
        }
        
        // Clean existing wires linked to this specific target input port
        wires = wires.filter(w => !(w.toNodeId === nodeId && w.toInputPort === portName));
        
        // Append new wire
        wires.push({
            id: `wire_${Date.now()}`,
            fromNodeId: selectedPort.nodeId,
            toNodeId: nodeId,
            toInputPort: portName
        });
        
        selectedPort = null;
        document.querySelectorAll(".port-dot").forEach(d => d.classList.remove("selected"));
        
        evaluateCircuit();
        renderCircuit();
        saveCircuitState();
    }
}

// Toggle switch outputs (0 -> 1 -> 0)
function toggleSwitch(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.type === "switch") {
        node.value = node.value ? 0 : 1;
        node.outputValue = node.value;
        
        evaluateCircuit();
        renderCircuit();
        saveCircuitState();
    }
}

// Core Boolean Evaluators
function evaluateCircuit() {
    // We run evaluation propagating values.
    // Use visited set to prevent infinite circular loop crashes.
    const visited = new Set();
    
    // Evaluate bulbs and gates recursively
    nodes.forEach(node => {
        if (node.type === "bulb" || node.type !== "switch") {
            evaluateNode(node.id, visited);
        }
    });
}

function evaluateNode(nodeId, visited) {
    if (visited.has(nodeId)) {
        const node = nodes.find(n => n.id === nodeId);
        return node ? node.outputValue : 0;
    }
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    
    visited.add(nodeId);
    
    if (node.type === "switch") {
        node.outputValue = node.value;
        return node.outputValue;
    }
    
    // Find connected inputs
    let valA = 0;
    let valB = 0;
    
    const wireA = wires.find(w => w.toNodeId === nodeId && (w.toInputPort === "a" || w.toInputPort === "single"));
    const wireB = wires.find(w => w.toNodeId === nodeId && w.toInputPort === "b");
    
    if (wireA) valA = evaluateNode(wireA.fromNodeId, visited);
    if (wireB) valB = evaluateNode(wireB.fromNodeId, visited);
    
    let result = 0;
    
    switch (node.type) {
        case "and":
            result = valA && valB ? 1 : 0;
            break;
        case "or":
            result = valA || valB ? 1 : 0;
            break;
        case "not":
            result = valA ? 0 : 1;
            break;
        case "nand":
            result = valA && valB ? 0 : 1;
            break;
        case "nor":
            result = valA || valB ? 0 : 1;
            break;
        case "xor":
            result = (valA && !valB) || (!valA && valB) ? 1 : 0;
            break;
        case "bulb":
            result = valA;
            break;
    }
    
    node.outputValue = result;
    return result;
}

// Maps coordinate ports and draws visually glowing connection lines
function drawWires() {
    connectionsSvg.innerHTML = "";
    
    wires.forEach(wire => {
        const fromPort = document.getElementById(`port-out-${wire.fromNodeId}`);
        const toPort = document.getElementById(`port-in-${wire.toNodeId}-${wire.toInputPort}`);
        
        if (fromPort && toPort) {
            const canvasRect = document.getElementById("canvasViewport").getBoundingClientRect();
            const fRect = fromPort.getBoundingClientRect();
            const tRect = toPort.getBoundingClientRect();
            
            const scrollLeft = document.getElementById("canvasViewport").scrollLeft;
            const scrollTop = document.getElementById("canvasViewport").scrollTop;
            
            const x1 = fRect.left - canvasRect.left + scrollLeft + (fRect.width / 2);
            const y1 = fRect.top - canvasRect.top + scrollTop + (fRect.height / 2);
            
            const x2 = tRect.left - canvasRect.left + scrollLeft + (tRect.width / 2);
            const y2 = tRect.top - canvasRect.top + scrollTop + (tRect.height / 2);
            
            // Draw clean path curve
            const controlOffset = Math.abs(x2 - x1) * 0.4;
            const d = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", d);
            
            // Get source node output to light up wire color
            const sourceNode = nodes.find(n => n.id === wire.fromNodeId);
            const isHigh = sourceNode && sourceNode.outputValue === 1;
            
            path.setAttribute("class", isHigh ? "wire-path high" : "wire-path");
            
            // Clicking wire removes it
            path.onclick = (e) => {
                e.stopPropagation();
                if (confirm("Disconnect this wire connection?")) {
                    wires = wires.filter(w => w.id !== wire.id);
                    evaluateCircuit();
                    renderCircuit();
                    saveCircuitState();
                }
            };
            
            connectionsSvg.appendChild(path);
        }
    });
}

// ----------------- TRUTH TABLE GENERATOR -----------------
function generateTruthTable() {
    const switches = nodes.filter(n => n.type === "switch");
    const bulbs = nodes.filter(n => n.type === "bulb");
    
    if (switches.length === 0 || bulbs.length === 0) {
        truthTableContainer.innerHTML = `
            <div class="table-placeholder">
                <i class="fas fa-calculator placeholder-icon"></i>
                <p>Place Input Switches and Output Bulbs to automatically calculate truth tables.</p>
            </div>
        `;
        return;
    }
    
    // Cap table generations to prevent huge exponent lags (limit: max 5 switches = 32 combinations)
    if (switches.length > 5) {
        truthTableContainer.innerHTML = `
            <div class="table-placeholder" style="color:var(--error-color);">
                <i class="fas fa-exclamation-triangle placeholder-icon"></i>
                <p>Too many switches (Max 5 switches supported for performance safety).</p>
            </div>
        `;
        return;
    }
    
    // Sort items to keep alphabetical consistency
    switches.sort((a,b) => a.name.localeCompare(b.name));
    bulbs.sort((a,b) => a.name.localeCompare(b.name));
    
    // Re-evaluate entire combinatorics matrix
    // Save original switch values to restore later
    const originalVals = {};
    switches.forEach(sw => {
        originalVals[sw.id] = sw.value;
    });
    
    let html = `<table class="truth-table"><thead><tr>`;
    // Headers switches
    switches.forEach(sw => {
        html += `<th>${sw.name}</th>`;
    });
    // Headers bulbs
    bulbs.forEach(b => {
        html += `<th>${b.name}</th>`;
    });
    html += `</tr></thead><tbody>`;
    
    const totalComb = Math.pow(2, switches.length);
    for (let c = 0; c < totalComb; c++) {
        html += `<tr>`;
        
        // Write combinatorics bits to switches
        switches.forEach((sw, index) => {
            const shift = switches.length - 1 - index;
            const bit = (c >> shift) & 1;
            sw.value = bit;
            sw.outputValue = bit;
            
            html += `<td class="${bit ? 'val-high' : 'val-low'}">${bit}</td>`;
        });
        
        // Evaluate output values
        evaluateCircuit();
        
        // Write output bulbs states
        bulbs.forEach(b => {
            const val = b.outputValue;
            html += `<td class="${val ? 'val-high' : 'val-low'}">${val}</td>`;
        });
        
        html += `</tr>`;
    }
    
    html += `</tbody></table>`;
    truthTableContainer.innerHTML = html;
    
    // Restore initial values
    switches.forEach(sw => {
        sw.value = originalVals[sw.id];
        sw.outputValue = originalVals[sw.id];
    });
    evaluateCircuit();
}
