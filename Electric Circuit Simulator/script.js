// ============================================================
//  ELECTRIC CIRCUIT SIMULATOR — Core Engine
//  Modified Nodal Analysis (MNA) with real-time canvas renderer
// ============================================================

// ─── CONSTANTS ───────────────────────────────────────────────

const GRID_COLS = 9;
const GRID_ROWS = 6;
const NODE_COLS = GRID_COLS + 1;
const NODE_ROWS = GRID_ROWS + 1;
const TOTAL_NODES = NODE_COLS * NODE_ROWS;

const NODE_SPACING = 62;
const GRID_OFFSET_X = 50;
const GRID_OFFSET_Y = 35;

const COLORS = {
  bg: '#070a13',
  gridDot: '#1e293b',
  wire: '#334155',
  wireActive: '#10b981',
  short: '#ef4444',
  select: '#3b82f6',
  text: '#f8fafc',
  textDim: '#64748b',
  battery: '#f8fafc',
  resistor: '#f8fafc',
  switch: '#f8fafc',
  switchOn: '#f59e0b',
  ground: '#f8fafc',
  glow: 'rgba(16,185,129,0.15)',
  glowShort: 'rgba(239,68,68,0.2)',
};

const DEFAULT_VALUES = {
  battery: 9,
  resistor: 100,
  switch: false,
  ground: 0,
};

const MIN_RESISTANCE = 1;
const MAX_RESISTANCE = 1000;
const MIN_VOLTAGE = 0;
const MAX_VOLTAGE = 50;

// ─── STATE ──────────────────────────────────────────────────

const state = {
  components: [],
  selectedId: null,
  placeMode: null,
  nodeVoltages: new Float64Array(TOTAL_NODES),
  branchData: new Map(),
  isShortCircuit: false,
  simStatus: 'SIMULATION STATUS: STEADY STATE',
  animTime: 0,
  particles: [],
  dragComp: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  hoveredEdge: null,
  numNodes: 0,
  canvasW: 0,
  canvasH: 0,
  dpr: 1,
  simNeedsUpdate: true,
};

// ─── DOM REFS ───────────────────────────────────────────────

const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('sim-status');
const nodeCountEl = document.getElementById('node-count');
const hintText = document.getElementById('hint-text');
const hintBox = document.getElementById('placement-hint');
const inspectorEmpty = document.getElementById('inspector-empty');
const inspectorContent = document.getElementById('inspector-content');
const propType = document.getElementById('prop-type');
const propId = document.getElementById('prop-id');
const paramControls = document.getElementById('param-controls');
const teleVoltage = document.getElementById('tele-voltage');
const teleCurrent = document.getElementById('tele-current');
const telePower = document.getElementById('tele-power');
const teleResistance = document.getElementById('tele-resistance');
const btnRemove = document.getElementById('btn-remove-comp');
const btnClear = document.getElementById('btn-clear');
const btnSimulate = document.getElementById('btn-simulate');

// ─── CANVAS SETUP ──────────────────────────────────────────

function initCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  state.dpr = window.devicePixelRatio || 1;
  state.canvasW = Math.floor(rect.width - 4);
  state.canvasH = Math.floor(rect.height - 4);

  canvas.width = state.canvasW * state.dpr;
  canvas.height = state.canvasH * state.dpr;
  canvas.style.width = state.canvasW + 'px';
  canvas.style.height = state.canvasH + 'px';

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(state.dpr, state.dpr);
}

// ─── GRID UTILITIES ────────────────────────────────────────

function getNodePos(nodeIndex) {
  const col = nodeIndex % NODE_COLS;
  const row = Math.floor(nodeIndex / NODE_COLS);
  return {
    x: col * NODE_SPACING + GRID_OFFSET_X,
    y: row * NODE_SPACING + GRID_OFFSET_Y,
  };
}

function getNodeIndex(col, row) {
  return row * NODE_COLS + col;
}

function getEdgeCenter(node1, node2) {
  const p1 = getNodePos(node1);
  const p2 = getNodePos(node2);
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function findNearestEdge(mx, my) {
  let best = null;
  let bestDist = 25;
  const threshold = NODE_SPACING * 0.55;
  for (const comp of state.components) {
    const p1 = getNodePos(comp.node1);
    const p2 = getNodePos(comp.node2);
    const d = distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y);
    if (d < bestDist) {
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      if (Math.hypot(mx - cx, my - cy) < threshold) {
        bestDist = d;
        best = { component: comp, node1: comp.node1, node2: comp.node2 };
      }
    }
  }
  return best;
}

function findNearestGridEdge(mx, my) {
  let best = null;
  let bestDist = NODE_SPACING * 0.6;
  for (let row = 0; row < NODE_ROWS; row++) {
    for (let col = 0; col < NODE_COLS; col++) {
      const idx = getNodeIndex(col, row);
      // Horizontal edge (col,row) -> (col+1,row)
      if (col < GRID_COLS) {
        const idx2 = getNodeIndex(col + 1, row);
        if (!isEdgeOccupied(idx, idx2)) {
          const p1 = getNodePos(idx);
          const p2 = getNodePos(idx2);
          const d = distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y);
          const cx = (p1.x + p2.x) / 2;
          const cy = (p1.y + p2.y) / 2;
          if (d < bestDist && Math.hypot(mx - cx, my - cy) < NODE_SPACING * 0.55) {
            bestDist = d;
            best = { node1: idx, node2: idx2 };
          }
        }
      }
      // Vertical edge (col,row) -> (col,row+1)
      if (row < GRID_ROWS) {
        const idx2 = getNodeIndex(col, row + 1);
        if (!isEdgeOccupied(idx, idx2)) {
          const p1 = getNodePos(idx);
          const p2 = getNodePos(idx2);
          const d = distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y);
          const cx = (p1.x + p2.x) / 2;
          const cy = (p1.y + p2.y) / 2;
          if (d < bestDist && Math.hypot(mx - cx, my - cy) < NODE_SPACING * 0.55) {
            bestDist = d;
            best = { node1: idx, node2: idx2 };
          }
        }
      }
    }
  }
  return best;
}

function isEdgeOccupied(n1, n2) {
  return state.components.some(c =>
    (c.node1 === n1 && c.node2 === n2) || (c.node1 === n2 && c.node2 === n1)
  );
}

// ─── COMPONENT FACTORY ─────────────────────────────────────

function createComponent(type, node1, node2) {
  return {
    id: 'comp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    type,
    node1,
    node2,
    value: DEFAULT_VALUES[type] || 0,
    state: type === 'switch' ? false : true,
  };
}

// ─── MODIFIED NODAL ANALYSIS SOLVER ────────────────────────

function solveCircuit() {
  state.branchData.clear();
  state.isShortCircuit = false;

  const comps = state.components.filter(c => c.type !== 'switch' || c.state !== false);
  const switchOpen = state.components.filter(c => c.type === 'switch' && !c.state);

  if (comps.length === 0) {
    state.simStatus = 'SIMULATION STATUS: STEADY STATE';
    state.nodeVoltages.fill(0);
    state.numNodes = 0;
    updateStatusBar();
    return;
  }

  const allNodes = new Set();
  for (const c of comps) {
    allNodes.add(c.node1);
    allNodes.add(c.node2);
  }
  for (const c of switchOpen) {
    allNodes.add(c.node1);
    allNodes.add(c.node2);
  }

  if (allNodes.size < 2) {
    state.nodeVoltages.fill(0);
    state.numNodes = allNodes.size;
    state.simStatus = 'SIMULATION STATUS: STEADY STATE';
    updateStatusBar();
    return;
  }

  // Find ground nodes
  const groundNodes = new Set();
  for (const c of state.components) {
    if (c.type === 'ground') {
      groundNodes.add(c.node1);
      groundNodes.add(c.node2);
    }
  }

  let groundNode = groundNodes.size > 0 ? [...groundNodes][0] : [...allNodes][0];
  const sortedNodes = [...allNodes].sort((a, b) => a - b);
  const nonGround = sortedNodes.filter(n => n !== groundNode);
  const n = nonGround.length;

  // Map node -> matrix index
  const nodeIdx = new Map();
  nonGround.forEach((node, i) => nodeIdx.set(node, i));

  // Separate batteries and resistors (active)
  const batteries = comps.filter(c => c.type === 'battery');
  const resistors = comps.filter(c => c.type !== 'battery');
  const m = batteries.length;

  // --- Build G (n x n) ---
  const G = Array.from({ length: n }, () => new Float64Array(n));
  for (const r of resistors) {
    const ni = nodeIdx.get(r.node1);
    const nj = nodeIdx.get(r.node2);
    let cond;
    if (r.type === 'switch') {
      cond = 1e6;
    } else if (r.type === 'ground') {
      cond = 1e6;
    } else {
      cond = r.value !== 0 ? 1 / r.value : 1e6;
    }
    if (ni !== undefined && nj !== undefined) {
      G[ni][ni] += cond;
      G[nj][nj] += cond;
      G[ni][nj] -= cond;
      G[nj][ni] -= cond;
    } else if (ni !== undefined) {
      G[ni][ni] += cond;
    } else if (nj !== undefined) {
      G[nj][nj] += cond;
    }
  }

  // --- Build B (n x m), C (m x n), E (m) ---
  const B = Array.from({ length: n }, () => new Float64Array(m));
  const E = new Float64Array(m);
  for (let j = 0; j < m; j++) {
    const bat = batteries[j];
    const nPos = nodeIdx.get(bat.node1);
    const nNeg = nodeIdx.get(bat.node2);
    E[j] = bat.value || 9;
    if (nPos !== undefined) B[nPos][j] = 1;
    if (nNeg !== undefined) B[nNeg][j] = -1;
  }

  // --- Build full matrix A = [[G, B], [C, 0]] ---
  const size = n + m;
  const A = Array.from({ length: size }, () => new Float64Array(size));
  const b = new Float64Array(size);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      A[i][j] = G[i][j];
    }
    for (let j = 0; j < m; j++) {
      A[i][n + j] = B[i][j];
    }
    b[i] = 0;
  }
  for (let j = 0; j < m; j++) {
    for (let i = 0; i < n; i++) {
      A[n + j][i] = B[i][j];
    }
    A[n + j][n + j] = 0;
    b[n + j] = E[j];
  }

  // --- Gauss elimination with partial pivoting ---
  let solveOk = true;
  for (let col = 0; col < size; col++) {
    let maxVal = Math.abs(A[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < size; row++) {
      const v = Math.abs(A[row][col]);
      if (v > maxVal) { maxVal = v; maxRow = row; }
    }
    if (maxVal < 1e-12) { solveOk = false; break; }
    if (maxRow !== col) {
      [A[col], A[maxRow]] = [A[maxRow], A[col]];
      [b[col], b[maxRow]] = [b[maxRow], b[col]];
    }
    const piv = A[col][col];
    for (let row = col + 1; row < size; row++) {
      const factor = A[row][col] / piv;
      for (let k = col; k < size; k++) {
        A[row][k] -= factor * A[col][k];
      }
      b[row] -= factor * b[col];
    }
  }

  if (!solveOk) {
    state.isShortCircuit = true;
    state.simStatus = 'ALERT: SHORT CIRCUIT DETECTED';
    state.nodeVoltages.fill(0);
    state.numNodes = allNodes.size;
    updateStatusBar();
    updateStatusBarShort();
    return;
  }

  // --- Back substitution ---
  const x = new Float64Array(size);
  for (let i = size - 1; i >= 0; i--) {
    let sum = b[i];
    for (let j = i + 1; j < size; j++) {
      sum -= A[i][j] * x[j];
    }
    x[i] = sum / A[i][i];
  }

  // --- Extract results ---
  state.nodeVoltages.fill(0);
  nonGround.forEach((node, i) => {
    state.nodeVoltages[node] = x[i];
  });

  const batCurrents = new Float64Array(m);
  for (let j = 0; j < m; j++) {
    batCurrents[j] = x[n + j];
  }

  // --- Compute branch currents ---
  let maxBranchCurrent = 0;
  const batMap = new Map();
  batteries.forEach((bat, j) => batMap.set(bat.id, batCurrents[j]));

  for (const comp of state.components) {
    const v1 = state.nodeVoltages[comp.node1];
    const v2 = state.nodeVoltages[comp.node2];
    let current = 0;
    let resistance = 0;
    let isActive = comp.type !== 'switch' || comp.state;

    if (comp.type === 'battery' && comp.state) {
      current = batMap.get(comp.id) || 0;
      resistance = 0;
    } else if (comp.type === 'resistor' && comp.state) {
      resistance = comp.value;
      current = resistance > 0 ? (v1 - v2) / resistance : 0;
    } else if (comp.type === 'switch') {
      if (comp.state) {
        current = (v1 - v2) * 1e6;
        resistance = 1e-6;
      } else {
        current = 0;
        resistance = Infinity;
      }
    } else if (comp.type === 'ground') {
      current = 0;
      resistance = 0;
    }

    const mag = Math.abs(current);
    if (mag > maxBranchCurrent) maxBranchCurrent = mag;

    state.branchData.set(comp.id, {
      voltage: comp.type === 'resistor' ? Math.abs(v1 - v2) : 0,
      current,
      power: current * current * (resistance > 0 ? resistance : 0),
      resistance,
      magnitude: mag,
      direction: current >= 0 ? 1 : -1,
    });
  }

  // Check for short circuit
  if (maxBranchCurrent > 500 || !isFinite(maxBranchCurrent)) {
    state.isShortCircuit = true;
    state.simStatus = 'ALERT: SHORT CIRCUIT DETECTED';
  } else {
    state.isShortCircuit = false;
    state.simStatus = 'SIMULATION STATUS: STEADY STATE';
  }

  state.numNodes = allNodes.size;
  updateStatusBar();
  updateInspector();
}

// ─── STATUS BAR ─────────────────────────────────────────────

function updateStatusBar() {
  if (state.isShortCircuit) {
    statusEl.className = 'status-short';
  } else {
    statusEl.className = 'status-steady';
  }
  statusEl.textContent = state.simStatus;
  const branchCount = state.components.length;
  nodeCountEl.textContent = `NODES: ${state.numNodes} | BRANCHES: ${branchCount}`;
}

function updateStatusBarShort() {
  statusEl.className = 'status-short';
  statusEl.textContent = 'ALERT: SHORT CIRCUIT DETECTED';
  nodeCountEl.textContent = `NODES: ${state.numNodes} | BRANCHES: ${state.components.length}`;
}

// ─── RENDERER ───────────────────────────────────────────────

function render() {
  ctx.clearRect(0, 0, state.canvasW, state.canvasH);

  drawGrid();
  drawWires();
  drawComponents();
  drawElectronAnimation();
  drawSelectionHighlight();
  drawHoverPreview();
}

function drawGrid() {
  for (let row = 0; row < NODE_ROWS; row++) {
    for (let col = 0; col < NODE_COLS; col++) {
      const pos = getNodePos(getNodeIndex(col, row));
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.gridDot;
      ctx.fill();
    }
  }
}

function drawWires() {
  const visited = new Set();
  for (const comp of state.components) {
    const key = comp.node1 < comp.node2
      ? `${comp.node1}-${comp.node2}`
      : `${comp.node2}-${comp.node1}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const p1 = getNodePos(comp.node1);
    const p2 = getNodePos(comp.node2);

    const bd = state.branchData.get(comp.id);

    if (state.isShortCircuit) {
      ctx.strokeStyle = COLORS.short;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (bd && bd.magnitude > 0.001) {
      ctx.strokeStyle = COLORS.wireActive;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = Math.min(1, 0.3 + bd.magnitude * 0.01);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = COLORS.wire;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }
}

function drawComponents() {
  for (const comp of state.components) {
    switch (comp.type) {
      case 'battery': drawBattery(comp); break;
      case 'resistor': drawResistor(comp); break;
      case 'switch': drawSwitch(comp); break;
      case 'ground': drawGround(comp); break;
    }
  }
}

function drawBattery(comp) {
  const p1 = getNodePos(comp.node1);
  const p2 = getNodePos(comp.node2);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);

  const halfW = 5;
  const halfH = 9;
  const spacing = 3;

  // Thin plate (negative)
  ctx.fillStyle = COLORS.battery;
  ctx.fillRect(-halfW, -halfH + spacing, halfW * 2, 3);

  // Thick plate (positive)
  ctx.fillStyle = COLORS.battery;
  ctx.fillRect(-halfW, halfH - spacing - 4, halfW * 2, 4);

  // Voltage label
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '8px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(comp.value + 'V', 0, -halfH - 5);

  // Polarity
  ctx.fillStyle = '#94a3b8';
  ctx.font = '7px ui-monospace, Consolas, monospace';
  ctx.fillText('+', halfW + 6, -3);
  ctx.fillText('−', halfW + 6, 6);

  ctx.restore();
}

function drawResistor(comp) {
  const p1 = getNodePos(comp.node1);
  const p2 = getNodePos(comp.node2);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const segLen = len * 0.7;
  const segCount = 6;
  const amp = 4;

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);

  // Lead lines
  const leadLen = (len - segLen) / 2;
  ctx.strokeStyle = COLORS.resistor;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(-segLen / 2, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(segLen / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.stroke();

  // Zigzag
  ctx.strokeStyle = COLORS.resistor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const startX = -segLen / 2;
  const step = segLen / segCount;
  for (let i = 0; i <= segCount; i++) {
    const x = startX + i * step;
    const y = (i % 2 === 0) ? 0 : (i < segCount / 2 ? -amp : amp);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Value label
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '7px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  const val = comp.value >= 1000 ? (comp.value / 1000).toFixed(1) + 'k' : comp.value + 'Ω';
  ctx.fillText(val, 0, amp + 10);

  ctx.restore();
}

function drawSwitch(comp) {
  const p1 = getNodePos(comp.node1);
  const p2 = getNodePos(comp.node2);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);

  const halfLen = len / 2 - 6;

  // Left lead
  ctx.strokeStyle = COLORS.switch;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-halfLen - 2, 0);
  ctx.lineTo(-halfLen * 0.3, 0);
  ctx.stroke();

  // Right lead
  ctx.beginPath();
  ctx.moveTo(halfLen * 0.3, 0);
  ctx.lineTo(halfLen + 2, 0);
  ctx.stroke();

  // Terminal dots
  ctx.fillStyle = comp.state ? COLORS.switchOn : COLORS.switch;
  ctx.beginPath();
  ctx.arc(-halfLen * 0.3, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(halfLen * 0.3, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (comp.state) {
    // Closed: connecting line
    ctx.strokeStyle = COLORS.switchOn;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfLen * 0.3, 0);
    ctx.lineTo(halfLen * 0.3, 0);
    ctx.stroke();
  } else {
    // Open: angled line
    ctx.strokeStyle = COLORS.switch;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-halfLen * 0.3, 0);
    ctx.lineTo(halfLen * 0.5, -7);
    ctx.stroke();
  }

  ctx.restore();
}

function drawGround(comp) {
  const p1 = getNodePos(comp.node1);
  const p2 = getNodePos(comp.node2);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;

  const isVertical = Math.abs(p1.y - p2.y) > Math.abs(p1.x - p2.x);
  const cx = mx;
  const cy = my;

  ctx.save();
  ctx.translate(cx, cy);

  const w = 12;
  const gap = 3;

  // Vertical line down
  ctx.strokeStyle = COLORS.ground;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Three horizontal lines
  for (let i = 0; i < 3; i++) {
    const lineW = w - i * 3;
    ctx.strokeStyle = COLORS.ground;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-lineW / 2, i * gap);
    ctx.lineTo(lineW / 2, i * gap);
    ctx.stroke();
  }

  ctx.restore();
}

// ─── ELECTRON ANIMATION ─────────────────────────────────────

const particlePool = [];

function spawnParticles() {
  for (const comp of state.components) {
    const bd = state.branchData.get(comp.id);
    if (!bd || bd.magnitude < 0.001 || comp.type === 'ground') continue;
    if (state.isShortCircuit) continue;

    const speed = Math.min(1, bd.magnitude / 5);
    const spawnRate = Math.max(1, Math.floor(speed * 3));

    for (let i = 0; i < spawnRate; i++) {
      if (Math.random() > 0.15) continue;
      const p1 = getNodePos(comp.node1);
      const p2 = getNodePos(comp.node2);
      particlePool.push({
        x: p1.x,
        y: p1.y,
        progress: Math.random() * 0.3,
        speed: 0.008 + speed * 0.025,
        size: 2 + Math.random() * 1.5,
        alpha: 0.4 + Math.random() * 0.6,
        compId: comp.id,
        n1x: p1.x, n1y: p1.y,
        n2x: p2.x, n2y: p2.y,
        dir: 1,
      });
    }
  }

  // Limit pool
  while (particlePool.length > 300) particlePool.shift();
}

function updateParticles() {
  for (let i = particlePool.length - 1; i >= 0; i--) {
    const p = particlePool[i];
    p.progress += p.speed;
    if (p.progress >= 1) {
      particlePool.splice(i, 1);
      continue;
    }
    const comp = state.components.find(c => c.id === p.compId);
    if (!comp) { particlePool.splice(i, 1); continue; }
    const n1 = getNodePos(comp.node1);
    const n2 = getNodePos(comp.node2);
    const bd = state.branchData.get(comp.id);
    const dir = bd ? bd.direction : 1;
    const t = dir > 0 ? p.progress : 1 - p.progress;
    p.x = n1.x + (n2.x - n1.x) * t;
    p.y = n1.y + (n2.y - n1.y) * t;
  }
}

function drawElectronAnimation() {
  for (const p of particlePool) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(16, 185, 129, ${p.alpha})`;
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(16, 185, 129, ${p.alpha * 0.15})`;
    ctx.fill();
  }
}

// ─── SELECTION HIGHLIGHT ────────────────────────────────────

function drawSelectionHighlight() {
  if (!state.selectedId) return;
  const comp = state.components.find(c => c.id === state.selectedId);
  if (!comp) return;
  const p1 = getNodePos(comp.node1);
  const p2 = getNodePos(comp.node2);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(angle);
  ctx.strokeStyle = COLORS.select;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.strokeRect(-len / 2 - 6, -10, len + 12, 20);
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── HOVER PREVIEW ──────────────────────────────────────────

function drawHoverPreview() {
  if (!state.hoveredEdge || !state.placeMode) return;
  const p1 = getNodePos(state.hoveredEdge.node1);
  const p2 = getNodePos(state.hoveredEdge.node2);

  ctx.strokeStyle = `rgba(59, 130, 246, 0.4)`;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ─── ANIMATION LOOP ────────────────────────────────────────

function tick(time) {
  state.animTime = time;

  if (state.simNeedsUpdate && !state.isShortCircuit) {
    solveCircuit();
    state.simNeedsUpdate = false;
  }

  spawnParticles();
  updateParticles();
  render();
  requestAnimationFrame(tick);
}

// ─── CANVAS INPUT HANDLING ──────────────────────────────────

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
    y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top,
  };
}

canvas.addEventListener('mousedown', (e) => {
  const pos = getCanvasPos(e);

  // Check if clicking on existing component
  const hit = findNearestEdge(pos.x, pos.y);
  if (hit && hit.component) {
    state.selectedId = hit.component.id;
    state.simNeedsUpdate = true;
    updateInspector();
    return;
  }

  // If in placement mode, place component
  if (state.placeMode) {
    const edge = findNearestGridEdge(pos.x, pos.y);
    if (edge) {
      const comp = createComponent(state.placeMode, edge.node1, edge.node2);
      state.components.push(comp);
      state.selectedId = comp.id;
      state.simNeedsUpdate = true;
      updateInspector();
      // Stay in placement mode
    }
    return;
  }

  // Select nothing
  state.selectedId = null;
  updateInspector();
});

canvas.addEventListener('mousemove', (e) => {
  const pos = getCanvasPos(e);

  if (state.placeMode) {
    state.hoveredEdge = findNearestGridEdge(pos.x, pos.y);
  } else {
    const hit = findNearestEdge(pos.x, pos.y);
    canvas.style.cursor = hit ? 'pointer' : 'crosshair';
    state.hoveredEdge = null;
  }
});

canvas.addEventListener('mouseleave', () => {
  state.hoveredEdge = null;
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };

  const hit = findNearestEdge(pos.x, pos.y);
  if (hit && hit.component) {
    state.selectedId = hit.component.id;
    state.simNeedsUpdate = true;
    updateInspector();
    return;
  }

  if (state.placeMode) {
    const edge = findNearestGridEdge(pos.x, pos.y);
    if (edge) {
      const comp = createComponent(state.placeMode, edge.node1, edge.node2);
      state.components.push(comp);
      state.selectedId = comp.id;
      state.simNeedsUpdate = true;
    }
  }
}, { passive: false });

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (state.selectedId) {
      const idx = state.components.findIndex(c => c.id === state.selectedId);
      if (idx >= 0) {
        state.components.splice(idx, 1);
        state.selectedId = null;
        state.simNeedsUpdate = true;
        updateInspector();
      }
    }
  }
  if (e.key === 'Escape') {
    state.placeMode = null;
    state.selectedId = null;
    document.querySelectorAll('.comp-btn').forEach(b => b.classList.remove('active'));
    hintBox.classList.add('hidden');
  }
});

// ─── COMPONENT BUTTONS ──────────────────────────────────────

document.querySelectorAll('.comp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (state.placeMode === type) {
      // Toggle off
      state.placeMode = null;
      btn.classList.remove('active');
      hintBox.classList.add('hidden');
    } else {
      document.querySelectorAll('.comp-btn').forEach(b => b.classList.remove('active'));
      state.placeMode = type;
      btn.classList.add('active');
      hintBox.classList.remove('hidden');
      const names = { battery: 'DC Voltage Source', resistor: 'Linear Resistor', switch: 'SPST Toggle Switch', ground: 'Ground Node' };
      hintText.textContent = `Click grid to place ${names[type]}`;
    }
  });
});

// ─── INSPECTOR PANEL ────────────────────────────────────────

function updateInspector() {
  const comp = state.components.find(c => c.id === state.selectedId);

  if (!comp) {
    inspectorEmpty.classList.remove('hidden');
    inspectorContent.classList.add('hidden');
    return;
  }

  inspectorEmpty.classList.add('hidden');
  inspectorContent.classList.remove('hidden');

  const typeNames = { battery: 'DC Voltage Source', resistor: 'Linear Resistor', switch: 'SPST Toggle Switch', ground: 'Ground Node' };
  propType.textContent = typeNames[comp.type] || comp.type;
  propId.textContent = comp.id;

  // Build parameter controls
  paramControls.innerHTML = '';

  if (comp.type === 'battery') {
    const group = document.createElement('div');
    group.className = 'param-slider-group';
    group.innerHTML = `
      <div class="param-slider-header">
        <span class="param-slider-label">Voltage (V)</span>
        <span class="param-slider-value">${comp.value.toFixed(1)} V</span>
      </div>
      <input type="range" min="${MIN_VOLTAGE}" max="${MAX_VOLTAGE}" step="0.5" value="${comp.value}" class="param-slider" data-param="value">
    `;
    paramControls.appendChild(group);
  }

  if (comp.type === 'resistor') {
    const group = document.createElement('div');
    group.className = 'param-slider-group';
    group.innerHTML = `
      <div class="param-slider-header">
        <span class="param-slider-label">Resistance (Ω)</span>
        <span class="param-slider-value">${comp.value} Ω</span>
      </div>
      <input type="range" min="${MIN_RESISTANCE}" max="${MAX_RESISTANCE}" step="1" value="${comp.value}" class="param-slider" data-param="value">
    `;
    paramControls.appendChild(group);
  }

  if (comp.type === 'switch') {
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'param-slider-group';
    toggleGroup.innerHTML = `
      <div class="param-toggle">
        <span class="param-toggle-label">Switch State</span>
        <div class="switch-toggle ${comp.state ? 'active' : ''}" id="switch-toggle-btn"></div>
        <span style="font-size:10px;color:#94a3b8">${comp.state ? 'CLOSED' : 'OPEN'}</span>
      </div>
    `;
    paramControls.appendChild(toggleGroup);

    const toggleBtn = toggleGroup.querySelector('.switch-toggle');
    toggleBtn.addEventListener('click', () => {
      comp.state = !comp.state;
      toggleBtn.classList.toggle('active');
      toggleBtn.nextElementSibling.textContent = comp.state ? 'CLOSED' : 'OPEN';
      state.simNeedsUpdate = true;
      updateInspector();
    });
  }

  // Slider events
  paramControls.querySelectorAll('.param-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      comp.value = val;
      const header = slider.closest('.param-slider-group')?.querySelector('.param-slider-value');
      if (header) {
        if (comp.type === 'battery') header.textContent = val.toFixed(1) + ' V';
        else if (comp.type === 'resistor') header.textContent = val + ' Ω';
      }
      state.simNeedsUpdate = true;
      updateInspector();
    });
  });

  // Telemetry
  const bd = state.branchData.get(comp.id);
  if (bd) {
    teleVoltage.textContent = bd.voltage.toFixed(3) + ' V';
    teleCurrent.textContent = bd.current.toFixed(3) + ' A';
    telePower.textContent = bd.power.toFixed(3) + ' W';
    teleResistance.textContent = comp.type === 'resistor' ? comp.value + ' Ω' : (comp.type === 'battery' ? '—' : (comp.type === 'switch' ? (comp.state ? '~0 Ω' : '∞ Ω') : '—'));
  } else {
    teleVoltage.textContent = '0.000 V';
    teleCurrent.textContent = '0.000 A';
    telePower.textContent = '0.000 W';
    teleResistance.textContent = '—';
  }
}

// Remove button
btnRemove.addEventListener('click', () => {
  if (state.selectedId) {
    const idx = state.components.findIndex(c => c.id === state.selectedId);
    if (idx >= 0) {
      state.components.splice(idx, 1);
      state.selectedId = null;
      state.simNeedsUpdate = true;
      updateInspector();
    }
  }
});

// ─── ACTION BUTTONS ─────────────────────────────────────────

btnClear.addEventListener('click', () => {
  state.components = [];
  state.selectedId = null;
  state.placeMode = null;
  state.nodeVoltages.fill(0);
  state.branchData.clear();
  state.isShortCircuit = false;
  state.simStatus = 'SIMULATION STATUS: STEADY STATE';
  state.simNeedsUpdate = false;
  state.numNodes = 0;
  particlePool.length = 0;
  document.querySelectorAll('.comp-btn').forEach(b => b.classList.remove('active'));
  hintBox.classList.add('hidden');
  updateStatusBar();
  updateInspector();
});

btnSimulate.addEventListener('click', () => {
  state.simNeedsUpdate = true;
  solveCircuit();
});

// ─── RESIZE ─────────────────────────────────────────────────

window.addEventListener('resize', () => {
  initCanvas();
});

// ─── INIT ───────────────────────────────────────────────────

function init() {
  initCanvas();
  updateStatusBar();
  updateInspector();
  requestAnimationFrame(tick);
}

init();
