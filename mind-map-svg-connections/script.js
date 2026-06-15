/* ==========================================================================
   SVG Connected Mind Maps Logic (MapWeaver)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const viewport = document.getElementById('canvas-viewport');
  const canvasContent = document.getElementById('canvas-content');
  const connectionsSvg = document.getElementById('connections-svg');
  const nodesContainer = document.getElementById('nodes-container');

  // Controls
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnCenterMap = document.getElementById('btn-center-map');
  const btnClearCanvas = document.getElementById('btn-clear-canvas');
  
  // Backups
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');
  const exportBtn = document.getElementById('export-btn');
  const exportSvgBtn = document.getElementById('export-svg-btn');
  const btnToggleHelp = document.getElementById('btn-toggle-help');

  // App State
  let nodes = [];
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;
  let startMouseX = 0;
  let startMouseY = 0;

  // Active dragging node state
  let dragNode = null;
  let dragOffset = { x: 0, y: 0 };

  // Theme Constants (matching style.css)
  const LEVEL_COLORS = {
    0: '#2563eb', // root
    1: '#0ea5e9', // level 1
    2: '#10b981', // level 2
    3: '#f59e0b'  // level 3+
  };

  // Initial State: Centered Root Node
  const DEFAULT_ROOT = {
    id: 'root',
    text: 'Central Idea',
    x: 2500,
    y: 2500,
    level: 0,
    parentId: null
  };

  // Initialize App
  init();

  function init() {
    loadData();
    setupEventListeners();
    centerMap();
    render();
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Save to LocalStorage
  function saveData() {
    localStorage.setItem('mapweaver_nodes_v1', JSON.stringify(nodes));
  }

  // Load from LocalStorage
  function loadData() {
    const rawData = localStorage.getItem('mapweaver_nodes_v1');
    if (rawData) {
      try {
        nodes = JSON.parse(rawData);
      } catch (e) {
        console.error('Failed to parse saved nodes', e);
        nodes = [Object.assign({}, DEFAULT_ROOT)];
      }
    } else {
      nodes = [Object.assign({}, DEFAULT_ROOT)];
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Zoom & Viewport controls
    btnZoomIn.addEventListener('click', () => adjustZoom(0.1));
    btnZoomOut.addEventListener('click', () => adjustZoom(-0.1));
    btnZoomReset.addEventListener('click', () => {
      zoomScale = 1.0;
      updateCanvasTransform();
    });
    btnCenterMap.addEventListener('click', centerMap);
    btnClearCanvas.addEventListener('click', resetMap);

    // Backup interactions
    exportBtn.addEventListener('click', exportJSONBackup);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importJSONBackup);
    exportSvgBtn.addEventListener('click', exportAsSVG);

    // Help panel toggle
    btnToggleHelp.addEventListener('click', () => {
      const panel = document.querySelector('.help-panel');
      panel.style.display = 'none';
    });

    // Panning canvas via Viewport background dragging
    viewport.addEventListener('mousedown', (e) => {
      // Ignore if clicking on a node or button inside the canvas
      if (e.target.closest('.mindmap-node') || e.target.closest('.btn') || e.target.closest('.floating-panel')) {
        return;
      }
      isPanning = true;
      viewport.style.cursor = 'grabbing';
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startPanX = panX;
      startPanY = panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (isPanning) {
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        panX = startPanX + dx;
        panY = startPanY + dy;
        updateCanvasTransform();
      } else if (dragNode) {
        // Handle dragging active node
        const rect = canvasContent.getBoundingClientRect();
        // Calculate coordinate in canvas coordinates
        const mouseXCanvas = (e.clientX - rect.left) / zoomScale;
        const mouseYCanvas = (e.clientY - rect.top) / zoomScale;

        // Apply drag offset
        let newX = mouseXCanvas - dragOffset.x;
        let newY = mouseYCanvas - dragOffset.y;

        // Bound nodes to canvas sizes
        newX = Math.max(100, Math.min(4900, newX));
        newY = Math.max(100, Math.min(4900, newY));

        // Update state
        const targetNode = nodes.find(n => n.id === dragNode.id);
        if (targetNode) {
          targetNode.x = newX;
          targetNode.y = newY;
          
          // Fast DOM update for performance
          dragNode.element.style.left = `${newX}px`;
          dragNode.element.style.top = `${newY}px`;
          
          // Re-draw connection lines live
          drawConnections();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        viewport.style.cursor = 'grab';
      }
      if (dragNode) {
        dragNode = null;
        saveData();
      }
    });

    // Support mouse wheel zooming centered on cursor
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 0.05;
      const direction = e.deltaY < 0 ? 1 : -1;
      adjustZoom(direction * zoomFactor);
    }, { passive: false });
  }

  // Update canvas placement style
  function updateCanvasTransform() {
    canvasContent.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  }

  // Adjust zoom value
  function adjustZoom(delta) {
    const newZoom = Math.max(0.4, Math.min(2.0, zoomScale + delta));
    zoomScale = parseFloat(newZoom.toFixed(2));
    updateCanvasTransform();
  }

  // Center viewport on map bounding box or central root node
  function centerMap() {
    const rootNode = nodes.find(n => n.id === 'root') || DEFAULT_ROOT;
    const viewWidth = viewport.clientWidth;
    const viewHeight = viewport.clientHeight;
    
    zoomScale = 1.0;
    panX = viewWidth / 2 - rootNode.x;
    panY = viewHeight / 2 - rootNode.y;
    updateCanvasTransform();
  }

  // Reset/Clear mind map content
  function resetMap() {
    if (confirm('Are you sure you want to reset the mind map? All nodes except the root central idea will be permanently deleted.')) {
      nodes = [Object.assign({}, DEFAULT_ROOT)];
      saveData();
      centerMap();
      render();
    }
  }

  // Generate Bezier connection S-curves
  function drawConnections() {
    // Clear SVG
    connectionsSvg.innerHTML = '';

    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          // Draw connecting S-curve path
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('class', 'connection-path');
          
          const x1 = parent.x;
          const y1 = parent.y;
          const x2 = node.x;
          const y2 = node.y;

          // Horizontal bezier s-curve points
          const dx = x2 - x1;
          const cp1x = x1 + dx / 2;
          const cp1y = y1;
          const cp2x = x1 + dx / 2;
          const cp2y = y2;

          const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
          path.setAttribute('d', d);

          // Customize color according to child node level
          const levelColor = LEVEL_COLORS[Math.min(node.level, 3)];
          path.style.stroke = levelColor;
          
          connectionsSvg.appendChild(path);
        }
      }
    });
  }

  // Render nodes and drawing connections
  function render() {
    // Clear Container
    nodesContainer.innerHTML = '';

    nodes.forEach(node => {
      const nodeEl = createNodeDOM(node);
      nodesContainer.appendChild(nodeEl);
    });

    drawConnections();
  }

  // Create Node HTML Layout Component
  function createNodeDOM(node) {
    const el = document.createElement('div');
    el.className = `mindmap-node level-${node.level === 0 ? 'root' : Math.min(node.level, 3)}`;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;
    el.id = `node-${node.id}`;

    // Text content wrapper
    const textWrapper = document.createElement('div');
    textWrapper.className = 'node-title-wrapper';
    textWrapper.textContent = node.text;
    textWrapper.setAttribute('spellcheck', 'false');
    el.appendChild(textWrapper);

    // Double click to edit title
    textWrapper.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      textWrapper.setAttribute('contenteditable', 'true');
      textWrapper.focus();
      
      // Select all text automatically
      const range = document.createRange();
      range.selectNodeContents(textWrapper);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // Save on losing focus or Enter
    const saveEdit = () => {
      if (textWrapper.getAttribute('contenteditable') === 'true') {
        textWrapper.setAttribute('contenteditable', 'false');
        node.text = textWrapper.textContent.trim() || 'Node';
        saveData();
        drawConnections(); // Redraw connections in case node size affects layout
      }
    };

    textWrapper.addEventListener('blur', saveEdit);
    textWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      }
    });

    // Create Action Buttons overlay
    // Add child button (green +)
    const btnAdd = document.createElement('button');
    btnAdd.className = 'node-action-btn node-btn-add';
    btnAdd.innerHTML = '+';
    btnAdd.title = 'Add Child Node';
    btnAdd.addEventListener('click', (e) => {
      e.stopPropagation();
      addChildNode(node.id);
    });
    el.appendChild(btnAdd);

    // Delete node button (red x - except for root node)
    if (node.id !== 'root') {
      const btnDel = document.createElement('button');
      btnDel.className = 'node-action-btn node-btn-del';
      btnDel.innerHTML = '&times;';
      btnDel.title = 'Delete Node and Descendants';
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNodeHierarchy(node.id);
      });
      el.appendChild(btnDel);
    }

    // Node Drag event handlers
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.node-action-btn') || textWrapper.getAttribute('contenteditable') === 'true') {
        return; // Don't drag when interacting with actions or editing text
      }
      e.stopPropagation();
      
      // Focus clicked node visually
      document.querySelectorAll('.mindmap-node').forEach(n => n.classList.remove('selected'));
      el.classList.add('selected');

      const rect = canvasContent.getBoundingClientRect();
      const mouseXCanvas = (e.clientX - rect.left) / zoomScale;
      const mouseYCanvas = (e.clientY - rect.top) / zoomScale;

      dragNode = { id: node.id, element: el };
      dragOffset = {
        x: mouseXCanvas - node.x,
        y: mouseYCanvas - node.y
      };
    });

    return el;
  }

  // Create child node helper
  function addChildNode(parentId) {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    // Place the child node to the right
    const angle = (Math.random() - 0.5) * Math.PI / 3; // within +/- 30 degrees
    const distance = 200;
    const childX = Math.round(parent.x + Math.cos(angle) * distance);
    const childY = Math.round(parent.y + Math.sin(angle) * distance);

    const childId = 'node_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const childNode = {
      id: childId,
      text: 'New Idea',
      x: Math.max(100, Math.min(4900, childX)),
      y: Math.max(100, Math.min(4900, childY)),
      level: parent.level + 1,
      parentId: parentId
    };

    nodes.push(childNode);
    saveData();
    render();

    // Trigger edit focus on the newly added child node
    setTimeout(() => {
      const newNodeEl = document.getElementById(`node-${childId}`);
      if (newNodeEl) {
        const textWrap = newNodeEl.querySelector('.node-title-wrapper');
        if (textWrap) {
          textWrap.setAttribute('contenteditable', 'true');
          textWrap.focus();
          
          // Select all text
          const range = document.createRange();
          range.selectNodeContents(textWrap);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }, 100);
  }

  // Delete node and its full descendants hierarchy recursive helper
  function deleteNodeHierarchy(nodeId) {
    if (confirm('Delete this node and all of its connected child nodes?')) {
      // Find all descendants recursively
      const idsToRemove = new Set([nodeId]);
      let searchActive = true;

      while (searchActive) {
        const initialSize = idsToRemove.size;
        nodes.forEach(n => {
          if (n.parentId && idsToRemove.has(n.parentId)) {
            idsToRemove.add(n.id);
          }
        });
        if (idsToRemove.size === initialSize) {
          searchActive = false; // No more child descendants found
        }
      }

      nodes = nodes.filter(n => !idsToRemove.has(n.id));
      saveData();
      render();
    }
  }

  // Backup: JSON Export
  function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mapweaver_mindmap_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Backup: JSON Import
  function importJSONBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported) && imported.length > 0 && imported.some(n => n.id === 'root')) {
          nodes = imported;
          saveData();
          centerMap();
          render();
          alert('Mind map imported successfully!');
        } else {
          alert('Invalid Backup Format. File must be a JSON array containing at least a root node.');
        }
      } catch (err) {
        alert('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
    importFile.value = ''; // clear file selector
  }

  // Export fully visual Map as SVG
  function exportAsSVG() {
    // Generate a bounding box of all nodes to frame the SVG beautifully
    let minX = 5000, maxX = 0, minY = 5000, maxY = 0;
    
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - 200);
      maxX = Math.max(maxX, n.x + 200);
      minY = Math.min(minY, n.y - 100);
      maxY = Math.max(maxY, n.y + 100);
    });

    const padding = 50;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    const width = (maxX - minX) + padding * 2;
    const height = (maxY - minY) + padding * 2;

    // Create a new SVG structure for visual representation
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}" style="background-color: #f8fafc; font-family: 'Outfit', sans-serif;">`;
    
    // 1. Draw connecting S-curve lines
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          const x1 = parent.x;
          const y1 = parent.y;
          const x2 = node.x;
          const y2 = node.y;
          const dx = x2 - x1;
          const cp1x = x1 + dx / 2;
          const cp1y = y1;
          const cp2x = x1 + dx / 2;
          const cp2y = y2;

          const levelColor = LEVEL_COLORS[Math.min(node.level, 3)] || '#94a3b8';
          svgContent += `<path d="M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}" fill="none" stroke="${levelColor}" stroke-width="3" stroke-linecap="round" />`;
        }
      }
    });

    // 2. Draw styled nodes as rounded capsules
    nodes.forEach(node => {
      const isRoot = node.id === 'root';
      const levelColor = LEVEL_COLORS[Math.min(node.level, 3)];
      const nodeBg = isRoot ? levelColor : '#ffffff';
      const borderClr = isRoot ? '#1e3a8a' : levelColor;
      const textClr = isRoot ? '#ffffff' : '#1e293b';
      
      // Approximate capsule widths according to text length
      const textLength = node.text.length;
      const cardWidth = Math.max(130, Math.min(250, textLength * 9 + 40));
      const cardHeight = isRoot ? 50 : 42;
      const radius = 25;

      svgContent += `
        <g>
          <!-- Outer Shadow Capsule -->
          <rect x="${node.x - cardWidth / 2}" y="${node.y - cardHeight / 2 + 2}" width="${cardWidth}" height="${cardHeight}" rx="${radius}" fill="rgba(0,0,0,0.08)" />
          <!-- Main Card Capsule -->
          <rect x="${node.x - cardWidth / 2}" y="${node.y - cardHeight / 2}" width="${cardWidth}" height="${cardHeight}" rx="${radius}" fill="${nodeBg}" stroke="${borderClr}" stroke-width="3" />
          <!-- Label Text -->
          <text x="${node.x}" y="${node.y + 5}" fill="${textClr}" font-size="${isRoot ? '15px' : '13px'}" font-weight="bold" text-anchor="middle">${escapeXml(node.text)}</text>
        </g>
      `;
    });

    svgContent += '</svg>';

    // Download compiled SVG file
    const svgBlob = new Blob([svgContent], {type: "image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = svgUrl;
    downloadAnchor.download = `mapweaver_mindmap_${Date.now()}.svg`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // XML tag Escapes for safe text exports
  function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }
});
