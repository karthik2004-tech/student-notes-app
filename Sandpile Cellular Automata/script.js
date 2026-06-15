(function () {
  "use strict";

  /* ─── Config ───────────────────────────────────────── */
  var COLORS = [
    [5,   6,   11  ],  /* 0: #05060b */
    [0,   191, 255 ],  /* 1: #00bfff */
    [106, 90,  205 ],  /* 2: #6a5acd */
    [255, 215, 0   ],  /* 3: #ffd700 */
    [255, 0,   127 ],  /* 4: #ff007f */
  ];

  var MAX_TOPPLES_PER_FRAME = 80000;

  /* ─── DOM refs ─────────────────────────────────────── */
  var canvas    = document.getElementById("sandCanvas");
  var ctx       = canvas.getContext("2d");
  var playBtn   = document.getElementById("playBtn");
  var stepBtn   = document.getElementById("stepBtn");
  var clearBtn  = document.getElementById("clearBtn");
  var presetSel = document.getElementById("presetSelect");
  var rateSlider= document.getElementById("rateSlider");
  var rateVal   = document.getElementById("rateVal");
  var resSlider = document.getElementById("resSlider");
  var resVal    = document.getElementById("resVal");
  var tmGrains  = document.getElementById("tmGrains");
  var tmTopples = document.getElementById("tmTopples");
  var tmGen     = document.getElementById("tmGen");
  var tmCrit    = document.getElementById("tmCrit");

  /* ─── State ────────────────────────────────────────── */
  var grid      = null;
  var width     = 150;
  var height    = 150;
  var running   = false;
  var dropRate  = 5;
  var generation= 0;
  var lastTopple= 0;
  var animId    = null;
  var needsRender = true;

  /* ─── Grid ops ─────────────────────────────────────── */
  function allocGrid(w, h) {
    width  = w;
    height = h;
    grid = new Uint16Array(width * height);
    canvas.width  = width;
    canvas.height = height;
    generation = 0;
    lastTopple = 0;
  }

  function addGrains(cx, cy, amount) {
    var i = cy * width + cx;
    if (i < 0 || i >= grid.length) return;
    grid[i] += amount;
    if (grid[i] > 65535) grid[i] = 65535;
    needsRender = true;
  }

  function getTotalGrains() {
    var sum = 0;
    for (var i = 0; i < grid.length; i++) sum += grid[i];
    return sum;
  }

  /* ─── Topple engine (queue-based) ─────────────────── */
  function topple() {
    var toppled = 0;

    /* Bootstrap queue with all currently unstable cells */
    var queue = [];
    for (var i = 0; i < grid.length; i++) {
      if (grid[i] >= 4) queue.push(i);
    }

    var head = 0;
    while (head < queue.length && toppled < MAX_TOPPLES_PER_FRAME) {
      var idx = queue[head++];
      if (grid[idx] < 4) continue;

      grid[idx] -= 4;
      toppled++;

      var x = idx % width;
      var y = (idx / width) | 0;

      if (x > 0)          { grid[idx - 1]++; if (grid[idx - 1] >= 4) queue.push(idx - 1); }
      if (x < width - 1)  { grid[idx + 1]++; if (grid[idx + 1] >= 4) queue.push(idx + 1); }
      if (y > 0)          { grid[idx - width]++; if (grid[idx - width] >= 4) queue.push(idx - width); }
      if (y < height - 1) { grid[idx + width]++; if (grid[idx + width] >= 4) queue.push(idx + width); }
    }

    if (toppled > 0) generation++;
    lastTopple = toppled;

    if (toppled >= MAX_TOPPLES_PER_FRAME) {
      /* More topples remain — needs render, will continue next frame */
      needsRender = true;
    }

    return toppled;
  }

  /* ─── Criticality ─────────────────────────────────── */
  function getCriticality() {
    var count = 0;
    var len = grid.length;
    for (var i = 0; i < len; i++) {
      if (grid[i] === 3) count++;
    }
    var pct = (count / len) * 100;
    if (pct < 5)   return { pct: pct, label: "STABLE" };
    if (pct < 15)  return { pct: pct, label: "WARMING" };
    if (pct < 25)  return { pct: pct, label: "ELEVATED" };
    if (pct < 35)  return { pct: pct, label: "CRITICAL" };
    return { pct: pct, label: "SUPER-CRITICAL" };
  }

  /* ─── Rendering (Direct pixel buffer) ──────────────── */
  function render() {
    if (!grid || canvas.width === 0 || canvas.height === 0) return;

    var imageData = ctx.createImageData(width, height);
    var buf = imageData.data;

    for (var i = 0; i < grid.length; i++) {
      var raw = grid[i];
      var ci  = raw >= 4 ? 4 : raw;
      var pix = i << 2;  /* i * 4 */
      buf[pix]     = COLORS[ci][0];
      buf[pix + 1] = COLORS[ci][1];
      buf[pix + 2] = COLORS[ci][2];
      buf[pix + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    needsRender = false;
  }

  /* ─── Telemetry ────────────────────────────────────── */
  function updateTelemetry() {
    tmGrains.textContent  = getTotalGrains();
    tmTopples.textContent = lastTopple;
    tmGen.textContent     = generation;
    var c = getCriticality();
    tmCrit.textContent    = c.label;
    tmCrit.style.color    = c.pct < 15 ? "#00bfff" : c.pct < 25 ? "#ffd700" : "#ff007f";
  }

  /* ─── Presets ──────────────────────────────────────── */
  function applyPreset(name) {
    allocGrid(width, height);

    switch (name) {
      case "central": {
        var cx = (width / 2) | 0;
        var cy = (height / 2) | 0;
        addGrains(cx, cy, 10000);
        break;
      }
      case "cross": {
        var cx = (width / 2) | 0;
        var cy = (height / 2) | 0;
        /* horizontal */
        for (var x = Math.max(0, cx - 20); x <= Math.min(width - 1, cx + 20); x++) {
          var amount = 800 + Math.sin((x - (cx - 20)) * 0.25) * 200;
          addGrains(x, cy, amount | 0);
        }
        /* vertical */
        for (var y = Math.max(0, cy - 20); y <= Math.min(height - 1, cy + 20); y++) {
          if (y === cy) continue;
          var amount2 = 800 + Math.sin((y - (cy - 20)) * 0.25) * 200;
          addGrains(cx, y, amount2 | 0);
        }
        break;
      }
      case "random": {
        for (var i = 0; i < 400; i++) {
          var rx = (Math.random() * width) | 0;
          var ry = (Math.random() * height) | 0;
          addGrains(rx, ry, (Math.random() * 2000 + 100) | 0);
        }
        break;
      }
      case "corner": {
        var tgtX = Math.max(0, (width * 0.1) | 0);
        var tgtY = Math.max(0, (height * 0.1) | 0);
        addGrains(tgtX, tgtY, 20000);
        break;
      }
    }

    /* Let the avalanche run */
    topple();
    render();
    updateTelemetry();
  }

  /* ─── Single step ──────────────────────────────────── */
  function step() {
    if (dropRate > 0) {
      var cx = (width / 2) | 0;
      var cy = (height / 2) | 0;
      addGrains(cx, cy, dropRate);
    }
    topple();
    render();
    updateTelemetry();
  }

  /* ─── Clear ────────────────────────────────────────── */
  function resetGrid() {
    allocGrid(width, height);
    render();
    updateTelemetry();
  }

  /* ─── Game loop ─────────────────────────────────────── */
  function loop() {
    if (running) {
      if (dropRate > 0) {
        var cx = (width / 2) | 0;
        var cy = (height / 2) | 0;
        addGrains(cx, cy, dropRate);
      }
      topple();
      if (needsRender) render();
      updateTelemetry();
    }
    animId = requestAnimationFrame(loop);
  }

  /* ─── Canvas click ─────────────────────────────────── */
  function handleCanvasClick(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = canvas.width  / rect.width;
    var sy = canvas.height / rect.height;
    var gx = Math.floor((e.clientX - rect.left) * sx);
    var gy = Math.floor((e.clientY - rect.top) * sy);
    if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
      addGrains(gx, gy, 3000);
      topple();
      render();
      updateTelemetry();
    }
  }

  /* ─── Events ───────────────────────────────────────── */
  function bindEvents() {
    /* Play / Pause */
    playBtn.addEventListener("click", function () {
      running = !running;
      playBtn.textContent = running ? "\u25A0 STOP" : "\u25B6 START";
      playBtn.classList.toggle("running", running);
    });

    stepBtn.addEventListener("click", step);

    clearBtn.addEventListener("click", resetGrid);

    presetSel.addEventListener("change", function () {
      applyPreset(this.value);
    });

    rateSlider.addEventListener("input", function () {
      dropRate = parseInt(this.value, 10);
      rateVal.textContent = dropRate;
    });

    resSlider.addEventListener("input", function () {
      var oldW = width;
      var v = parseInt(this.value, 10);
      resVal.textContent = v;
      if (v !== width) {
        allocGrid(v, v);
        render();
        updateTelemetry();
      }
    });

    canvas.addEventListener("click", handleCanvasClick);

    window.addEventListener("resize", function () {
      /* Canvas CSS auto-scales; internal pixel buffer unchanged */
      if (!running) { render(); }
    });
  }

  /* ─── Init ─────────────────────────────────────────── */
  function init() {
    bindEvents();
    allocGrid(width, height);
    applyPreset("central");
    /* Let the initial mount settle */
    updateTelemetry();
    animId = requestAnimationFrame(loop);
  }

  init();
})();
