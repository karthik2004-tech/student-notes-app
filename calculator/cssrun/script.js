(function () {
  "use strict";

  /* ─── Config ───────────────────────────────────────── */
  const GRAVITY    = 0.32;
  const PEG_BOUNCE = 0.50;
  const RAMP_BOUNCE= 0.35;
  const WALL_BOUNCE= 0.40;
  const FRICTION   = 0.998;
  const PEG_RADIUS = 10;
  const RAMP_W     = 90;
  const RAMP_H     = 10;
  const MAX_MARBLES= 40;

  /* ─── DOM refs ─────────────────────────────────────── */
  const board       = document.getElementById("board");
  const mcEl        = document.getElementById("marbleCount");
  const scoreVal    = document.getElementById("scoreVal");
  const dropBtn     = document.getElementById("dropBtn");
  const resetBtn    = document.getElementById("resetBtn");
  const clearBtn    = document.getElementById("clearBtn");

  /* ─── State ────────────────────────────────────────── */
  let obstacles  = [];
  let marbles    = [];
  let score      = 0;
  let activeTool = "peg";
  let pockets    = [];
  let animId     = null;
  let boardW     = 0;
  let boardH     = 0;

  /* ─── Helpers ──────────────────────────────────────── */
  function rand(min, max) { return Math.random() * (max - min) + min; }

  /* ─── Pocket geometry (recalc on resize) ──────────── */
  function buildPockets() {
    pockets.forEach(function (p) { if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el); });
    pockets = [];
    var els = board.querySelectorAll(".pocket");
    for (var i = els.length - 1; i >= 0; i--) els[i].parentNode.removeChild(els[i]);

    var count = 5;
    var pw = boardW / count;
    var ph = Math.max(40, boardH * 0.18);
    var py = boardH - ph;
    var mults = [10, 50, 100, 50, 10];

    for (var i = 0; i < count; i++) {
      var el = document.createElement("div");
      el.className = "pocket";
      var label = document.createElement("div");
      label.className = "pocket-label";
      label.textContent = mults[i] + "x";
      var slot = document.createElement("div");
      slot.className = "pocket-slot";
      el.appendChild(label);
      el.appendChild(slot);
      el.style.left   = (i * pw) + "px";
      el.style.width  = pw + "px";
      el.style.height = ph + "px";
      board.appendChild(el);

      pockets.push({
        el:   el,
        x:    i * pw,
        y:    py,
        w:    pw,
        h:    ph,
        mult: mults[i],
        cx:   i * pw + pw / 2,
      });
    }
  }

  /* ─── Obstacle management ─────────────────────────── */
  function placeObstacle(x, y, type) {
    if (x < 0 || y < 0 || x > boardW || y > boardH) return;

    var obs = { type: type, x: x, y: y, el: null };

    if (type === "peg") {
      obs.radius = PEG_RADIUS;
      var el = document.createElement("div");
      el.className = "peg";
      el.style.left   = (x - obs.radius) + "px";
      el.style.top    = (y - obs.radius) + "px";
      el.style.width  = (obs.radius * 2) + "px";
      el.style.height = (obs.radius * 2) + "px";
      board.appendChild(el);
      obs.el = el;

    } else if (type === "ramp-l" || type === "ramp-r") {
      obs.w     = RAMP_W;
      obs.h     = RAMP_H;
      obs.angle = type === "ramp-l" ? -35 : 35;
      var el = document.createElement("div");
      el.className = "ramp";
      el.style.left   = (x - obs.w / 2) + "px";
      el.style.top    = (y - obs.h / 2) + "px";
      el.style.width  = obs.w + "px";
      el.style.height = obs.h + "px";
      el.style.transform = "rotate(" + obs.angle + "deg)";
      board.appendChild(el);
      obs.el = el;
    }

    obstacles.push(obs);
  }

  function clearObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
      if (obstacles[i].el && obstacles[i].el.parentNode)
        obstacles[i].el.parentNode.removeChild(obstacles[i].el);
    }
    obstacles = [];
  }

  /* ─── Marble management ───────────────────────────── */
  function dropMarble() {
    if (marbles.length >= MAX_MARBLES) return;
    var r = Math.max(6, boardW * 0.012);
    var x = rand(boardW * 0.1, boardW * 0.9);
    var y = r * 2;

    var el = document.createElement("div");
    el.className = "marble";
    el.style.width  = (r * 2) + "px";
    el.style.height = (r * 2) + "px";
    board.appendChild(el);

    var m = {
      el:     el,
      x:      x,
      y:      y,
      vx:     0,
      vy:     0,
      radius: r,
      active: true,
      scored: false,
    };

    updateMarbleDOM(m);
    marbles.push(m);
    updateMC();
  }

  function removeMarble(m) {
    if (!m.active) return;
    m.active = false;
    if (m.el && m.el.parentNode) m.el.parentNode.removeChild(m.el);
  }

  function resetSim() {
    for (var i = marbles.length - 1; i >= 0; i--) removeMarble(marbles[i]);
    marbles = [];
    score = 0;
    scoreVal.textContent = "0";
    updateMC();
  }

  function updateMC() {
    mcEl.textContent = "MARBLES: " + marbles.filter(function (m) { return m.active; }).length;
  }

  function updateMarbleDOM(m) {
    m.el.style.left = (m.x - m.radius) + "px";
    m.el.style.top  = (m.y - m.radius) + "px";
  }

  /* ─── Impact ring FX ──────────────────────────────── */
  function spawnRing(x, y, color) {
    var el = document.createElement("div");
    el.className = "impact-ring";
    el.style.left   = x + "px";
    el.style.top    = y + "px";
    el.style.borderColor = color || "rgba(0,240,255,0.5)";
    board.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
  }

  function spawnBurst(x, y, text, color) {
    var el = document.createElement("div");
    el.className = "score-burst";
    el.textContent = "+" + text;
    el.style.left   = x + "px";
    el.style.top    = y + "px";
    if (color) el.style.color = color;
    board.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 950);
  }

  /* ─── Collision: circle-circle (peg) ──────────────── */
  function collidePeg(m, peg) {
    var dx = m.x - peg.x;
    var dy = m.y - peg.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minDist = m.radius + peg.radius;

    if (dist >= minDist || dist < 0.001) return false;

    var nx = dx / dist;
    var ny = dy / dist;
    var overlap = minDist - dist;

    m.x += nx * overlap;
    m.y += ny * overlap;

    var dot = m.vx * nx + m.vy * ny;
    if (dot < 0) {
      m.vx -= 2 * dot * nx * PEG_BOUNCE;
      m.vy -= 2 * dot * ny * PEG_BOUNCE;
    }

    m.vx *= 0.98;
    m.vy *= 0.98;

    spawnRing((peg.x + m.x) / 2, (peg.y + m.y) / 2, "rgba(0,240,255,0.5)");
    return true;
  }

  /* ─── Collision: circle-OBB (ramp) ────────────────── */
  function closestOnRect(px, py, rx, ry, rw, rh, angleDeg) {
    var rad = angleDeg * Math.PI / 180;
    var cos = Math.cos(rad);
    var sin = Math.sin(rad);
    var dx = px - rx;
    var dy = py - ry;
    var localX =  dx * cos + dy * sin;
    var localY = -dx * sin + dy * cos;
    var hw = rw / 2;
    var hh = rh / 2;
    var clampX = Math.max(-hw, Math.min(hw, localX));
    var clampY = Math.max(-hh, Math.min(hh, localY));
    return {
      x: clampX * cos - clampY * sin + rx,
      y: clampX * sin + clampY * cos + ry
    };
  }

  function collideRamp(m, ramp) {
    var cp = closestOnRect(m.x, m.y, ramp.x, ramp.y, ramp.w, ramp.h, ramp.angle);
    var dx = m.x - cp.x;
    var dy = m.y - cp.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= m.radius || dist < 0.001) return false;

    var nx = dx / dist;
    var ny = dy / dist;
    var overlap = m.radius - dist;

    m.x += nx * overlap;
    m.y += ny * overlap;

    var dot = m.vx * nx + m.vy * ny;
    if (dot < 0) {
      m.vx -= 2 * dot * nx * RAMP_BOUNCE;
      m.vy -= 2 * dot * ny * RAMP_BOUNCE;
    }

    m.vx *= 0.96;
    m.vy *= 0.96;

    spawnRing((cp.x + m.x) / 2, (cp.y + m.y) / 2, "rgba(255,42,95,0.5)");
    return true;
  }

  /* ─── Wall collisions ─────────────────────────────── */
  function collideWalls(m) {
    var hit = false;
    if (m.x - m.radius < 0) {
      m.x = m.radius;
      m.vx = -m.vx * WALL_BOUNCE;
      hit = true;
    } else if (m.x + m.radius > boardW) {
      m.x = boardW - m.radius;
      m.vx = -m.vx * WALL_BOUNCE;
      hit = true;
    }
    if (m.y - m.radius < 0) {
      m.y = m.radius;
      m.vy = -m.vy * WALL_BOUNCE;
      hit = true;
    }
    if (hit) m.vy *= 0.95;
  }

  /* ─── Pocket scoring ──────────────────────────────── */
  function checkPockets(m) {
    if (m.scored || !m.active) return;
    for (var i = 0; i < pockets.length; i++) {
      var p = pockets[i];
      if (m.x >= p.x && m.x <= p.x + p.w &&
          m.y + m.radius >= p.y && m.y - m.radius <= p.y + p.h) {
        m.scored = true;
        var pts = 10 * p.mult;
        score += pts;
        scoreVal.textContent = score;
        p.el.classList.add("glow");
        spawnBurst(p.cx, p.y, pts + " (" + p.mult + "x)", "#ffd54f");
        spawnRing(p.cx, p.y + p.h * 0.3, "rgba(0,255,136,0.6)");
        removeMarble(m);
        setTimeout(function (pel) {
          if (pel) pel.classList.remove("glow");
        }.bind(null, p.el), 300);
        updateMC();
        return;
      }
    }
  }

  /* ─── Physics update ──────────────────────────────── */
  function update() {
    for (var i = marbles.length - 1; i >= 0; i--) {
      var m = marbles[i];
      if (!m.active) { marbles.splice(i, 1); continue; }

      m.vy += GRAVITY;
      m.vx *= FRICTION;
      m.x  += m.vx;
      m.y  += m.vy;

      collideWalls(m);

      for (var j = 0; j < obstacles.length; j++) {
        var obs = obstacles[j];
        if (obs.type === "peg") {
          collidePeg(m, obs);
        } else if (obs.type === "ramp-l" || obs.type === "ramp-r") {
          collideRamp(m, obs);
        }
      }

      checkPockets(m);
      if (!m.active) continue;

      if (m.y > boardH + 60) {
        removeMarble(m);
        updateMC();
        continue;
      }

      updateMarbleDOM(m);
    }
  }

  /* ─── Game loop ───────────────────────────────────── */
  function loop() {
    update();
    animId = requestAnimationFrame(loop);
  }

  /* ─── Dimension sync ──────────────────────────────── */
  function syncDims() {
    var r = board.getBoundingClientRect();
    boardW = r.width;
    boardH = r.height;
    buildPockets();
    for (var i = 0; i < obstacles.length; i++) {
      var obs = obstacles[i];
      if (!obs.el || !obs.el.parentNode) continue;
      if (obs.type === "peg") {
        obs.el.style.width  = (obs.radius * 2) + "px";
        obs.el.style.height = (obs.radius * 2) + "px";
      }
    }
  }

  /* ─── Events ──────────────────────────────────────── */
  function bindEvents() {
    /* Tool selection */
    var toolBtns = document.querySelectorAll("[data-tool]");
    for (var i = 0; i < toolBtns.length; i++) {
      toolBtns[i].addEventListener("click", function () {
        for (var j = 0; j < toolBtns.length; j++) toolBtns[j].classList.remove("active");
        this.classList.add("active");
        activeTool = this.getAttribute("data-tool");
        board.style.cursor = activeTool === "peg" ? "crosshair" : "crosshair";
      });
    }

    /* Board click → place obstacle */
    board.addEventListener("click", function (e) {
      var rect = board.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      placeObstacle(x, y, activeTool);
    });

    /* Action buttons */
    clearBtn.addEventListener("click", clearObstacles);
    dropBtn.addEventListener("click", dropMarble);
    resetBtn.addEventListener("click", resetSim);

    /* Window resize */
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        syncDims();
      }, 150);
    });
  }

  /* ─── Init ────────────────────────────────────────── */
  function init() {
    bindEvents();
    syncDims();
    loop();
  }

  init();
})();
