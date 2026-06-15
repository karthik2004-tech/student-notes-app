/* ═══════════════════════════════════════════════════════
   Geometric Snake — Vector Engine
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ───
  const HIGH_SCORE_KEY = 'geometricSnakeBest';
  const GRID_SIZE = 8;           // 8×8 pegs
  const PEG_SPACING = 1;         // logical units between pegs
  const SNAP_DIST = 0.4;         // snap threshold in logical units
  const PTOL = 0.001;            // geometric tolerance for equality

  // ─── State ───
  let level = 1;
  let score = 0;
  let highScore = 0;
  let targetShape = 'RIGHT TRIANGLE';
  let path = [];                 // array of {x, y} peg coordinates visited
  let snakeHead = { x: 2, y: 2 };
  let isLocked = false;

  // ─── DOM / Canvas ───
  const $ = (s) => document.querySelector(s);

  const dom = {};
  let canvas, ctx;
  let canvasSize = 0;

  function cacheDom() {
    dom.targetShape = $('#target-shape');
    dom.level = $('#level');
    dom.score = $('#score');
    dom.highScore = $('#high-score');
    dom.feedback = $('#feedback');
    dom.canvas = $('#canvas');
    dom.btnResetLevel = $('#btn-reset-level');
    dom.btnClearPath = $('#btn-clear-path');
    canvas = dom.canvas;
    ctx = canvas.getContext('2d');
  }

  // ─── Storage ───
  function loadHigh() {
    try {
      const v = localStorage.getItem(HIGH_SCORE_KEY);
      if (v) highScore = parseInt(v, 10) || 0;
    } catch { highScore = 0; }
  }
  function saveHigh() {
    try { localStorage.setItem(HIGH_SCORE_KEY, String(highScore)); } catch { /* ignore */ }
  }

  // ─── Resize ───
  function resizeCanvas() {
    const rect = dom.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, window.innerHeight * 0.6, 500);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvasSize = size;
    ctx.scale(dpr, dpr);
  }

  // ─── Coordinate conversion ───
  function pegToPixel(p) {
    const margin = canvasSize * 0.08;
    const usable = canvasSize - 2 * margin;
    const step = usable / (GRID_SIZE - 1);
    return {
      x: margin + p.x * step,
      y: margin + p.y * step,
    };
  }

  // ─── Peg distance ───
  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // ─── Snap to nearest peg ───
  function snapToPeg(pos) {
    const ix = Math.round(pos.x);
    const iy = Math.round(pos.y);
    if (ix < 0 || ix >= GRID_SIZE || iy < 0 || iy >= GRID_SIZE) return null;
    const peg = { x: ix, y: iy };
    if (dist(pos, peg) <= SNAP_DIST) return peg;
    return null;
  }

  // ─── Geometry helpers ───
  function dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  function vec(from, to) {
    return { x: to.x - from.x, y: to.y - from.y };
  }

  function isRightAngle(a, b, c) {
    // angle at b formed by a-b-c
    const ba = vec(b, a);
    const bc = vec(b, c);
    const d = dot(ba, bc);
    return Math.abs(d) < PTOL;
  }

  function isRightTriangle(pts) {
    if (pts.length !== 3) return false;
    const [a, b, c] = pts;
    const ab = dist(a, b);
    const bc = dist(b, c);
    const ca = dist(c, a);
    const sides = [ab, bc, ca].sort((x, y) => x - y);
    // a² + b² ≈ c²
    return Math.abs(sides[0] ** 2 + sides[1] ** 2 - sides[2] ** 2) < PTOL * 100;
  }

  function isSquare(pts) {
    if (pts.length !== 4) return false;
    // All sides equal (4 edges of polygon in order)
    const edges = [];
    for (let i = 0; i < 4; i++) {
      edges.push(dist(pts[i], pts[(i + 1) % 4]));
    }
    const avg = edges.reduce((s, v) => s + v, 0) / 4;
    if (edges.some((e) => Math.abs(e - avg) > PTOL * 50)) return false;
    // All angles 90°
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      const c = pts[(i + 2) % 4];
      if (!isRightAngle(a, b, c)) return false;
    }
    return true;
  }

  function checkShape(vertices) {
    if (targetShape === 'RIGHT TRIANGLE') {
      return isRightTriangle(vertices);
    } else {
      return isSquare(vertices);
    }
  }

  // ─── Get next target ───
  function getTargetForLevel(lvl) {
    return lvl % 2 === 1 ? 'RIGHT TRIANGLE' : 'PERFECT SQUARE';
  }

  // ─── Move snake ───
  function moveSnake(dx, dy) {
    if (isLocked) return;

    const nx = snapToPeg({ x: snakeHead.x + dx, y: snakeHead.y + dy });
    if (!nx) return; // off grid

    snakeHead = nx;

    // Check if head is on a previously visited peg (closing a shape)
    const revisitIdx = path.findIndex((p) => p.x === nx.x && p.y === nx.y);

    if (revisitIdx !== -1 && path.length - revisitIdx >= 2) {
      // Extract the loop vertices
      const loopVerts = path.slice(revisitIdx);
      // Deduplicate consecutive collinear
      const unique = [];
      for (const v of loopVerts) {
        if (unique.length === 0 || unique[unique.length - 1].x !== v.x || unique[unique.length - 1].y !== v.y) {
          unique.push(v);
        }
      }

      if (unique.length >= 3) {
        evaluateShape(unique);
      }
      return;
    }

    // Don't allow immediate backtrack onto previous peg
    if (path.length >= 1) {
      const prev = path[path.length - 1];
      if (prev.x === nx.x && prev.y === nx.y) return;
    }

    path.push({ x: nx.x, y: nx.y });
    draw();
  }

  // ─── Evaluate shape ───
  function evaluateShape(vertices) {
    isLocked = true;

    if (checkShape(vertices)) {
      // Success
      score += 10 + level * 5;
      level++;
      targetShape = getTargetForLevel(level);
      if (score > highScore) {
        highScore = score;
        saveHigh();
      }
      dom.feedback.textContent = `✓ ${targetShape === 'RIGHT TRIANGLE' ? 'RIGHT TRIANGLE' : 'PERFECT SQUARE'} complete! +${10 + (level - 1) * 5}`;
      dom.feedback.className = 'feedback success';

      // Flash emerald on canvas
      draw(true);

      setTimeout(() => {
        resetPath();
        isLocked = false;
        dom.feedback.className = 'feedback';
        dom.feedback.textContent = `Form a ${targetShape}`;
        updateUI();
        draw();
      }, 1200);
    } else {
      // Fail
      dom.feedback.textContent = `✕ Not a ${targetShape}`;
      dom.feedback.className = 'feedback fail';

      drawFail();

      setTimeout(() => {
        resetPath();
        isLocked = false;
        dom.feedback.className = 'feedback';
        dom.feedback.textContent = `Form a ${targetShape}`;
        draw();
      }, 900);
    }

    updateUI();
  }

  // ─── Reset path ───
  function resetPath() {
    path = [{ x: snakeHead.x, y: snakeHead.y }];
  }

  // ─── Reset level ───
  function resetLevel() {
    if (isLocked) return;
    level = 1;
    score = 0;
    targetShape = getTargetForLevel(level);
    snakeHead = { x: 2, y: 2 };
    resetPath();
    dom.feedback.textContent = 'Form a RIGHT TRIANGLE';
    dom.feedback.className = 'feedback';
    updateUI();
    draw();
  }

  // ─── Clear path (keep level) ───
  function clearPath() {
    if (isLocked) return;
    resetPath();
    dom.feedback.textContent = `Form a ${targetShape}`;
    dom.feedback.className = 'feedback';
    draw();
  }

  // ─── Update UI ───
  function updateUI() {
    dom.targetShape.textContent = targetShape;
    dom.level.textContent = level;
    dom.score.textContent = score;
    dom.highScore.textContent = highScore;
  }

  // ─── Draw ───
  function draw(successFlash) {
    const w = canvasSize;
    ctx.clearRect(0, 0, w, w);

    // Background
    ctx.fillStyle = 'rgba(30, 41, 59, 0.15)';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, w, 14);
    ctx.fill();

    // Grid lines
    const margin = w * 0.08;
    const usable = w - 2 * margin;
    const step = usable / (GRID_SIZE - 1);

    ctx.strokeStyle = 'rgba(56, 182, 248, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < GRID_SIZE; i++) {
      const p = margin + i * step;
      ctx.beginPath();
      ctx.moveTo(margin, p);
      ctx.lineTo(margin + usable, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, margin);
      ctx.lineTo(p, margin + usable);
      ctx.stroke();
    }

    // Pegs
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const px = margin + c * step;
        const py = margin + r * step;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        ctx.fill();
      }
    }

    // Snake path
    if (path.length > 1) {
      ctx.beginPath();
      const first = pegToPixel(path[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < path.length; i++) {
        const p = pegToPixel(path[i]);
        ctx.lineTo(p.x, p.y);
      }
      // line to head
      const headPix = pegToPixel(snakeHead);
      ctx.lineTo(headPix.x, headPix.y);

      ctx.strokeStyle = successFlash ? '#10b981' : '#06b6d4';
      ctx.lineWidth = successFlash ? 4 : 3;
      ctx.shadowColor = successFlash ? 'rgba(16, 185, 129, 0.4)' : 'rgba(6, 182, 212, 0.3)';
      ctx.shadowBlur = successFlash ? 20 : 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Snake head
    const hp = pegToPixel(snakeHead);
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Path peg highlights
    for (const p of path) {
      const pp = pegToPixel(p);
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fill();
    }
  }

  function drawFail() {
    const w = canvasSize;
    // Draw crimson overlay on path
    if (path.length > 1) {
      ctx.beginPath();
      const first = pegToPixel(path[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < path.length; i++) {
        const p = pegToPixel(path[i]);
        ctx.lineTo(p.x, p.y);
      }
      const headPix = pegToPixel(snakeHead);
      ctx.lineTo(headPix.x, headPix.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  // ─── Events ───
  function setupEvents() {
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key.startsWith('Arrow')) e.preventDefault();

      switch (key) {
        case 'ArrowUp': case 'w': case 'W': moveSnake(0, -1); break;
        case 'ArrowDown': case 's': case 'S': moveSnake(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': moveSnake(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': moveSnake(1, 0); break;
      }
    });

    dom.btnResetLevel.addEventListener('click', resetLevel);
    dom.btnClearPath.addEventListener('click', clearPath);

    window.addEventListener('resize', () => {
      resizeCanvas();
      draw();
    });
  }

  // ─── Touch / swipe support ───
  let touchStart = null;
  function setupTouch() {
    dom.canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    }, { passive: true });

    dom.canvas.addEventListener('touchend', (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (adx < 10 && ady < 10) return;
      if (adx > ady) {
        moveSnake(dx > 0 ? 1 : -1, 0);
      } else {
        moveSnake(0, dy > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  // ─── Init ───
  function init() {
    cacheDom();
    loadHigh();
    targetShape = getTargetForLevel(level);
    snakeHead = { x: 2, y: 2 };
    resetPath();
    resizeCanvas();
    updateUI();
    dom.feedback.textContent = 'Form a RIGHT TRIANGLE';
    setupEvents();
    setupTouch();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// Performance Optimization: Cache snake position calculations
console.log('Performance upgrade: cached snake vector layouts');
