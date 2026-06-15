(function () {
  "use strict";

  var canvas    = document.getElementById("gameCanvas");
  var ctx       = canvas.getContext("2d");
  var genVal    = document.getElementById("genVal");
  var liveVal   = document.getElementById("liveVal");
  var deltaVal  = document.getElementById("deltaVal");
  var playBtn   = document.getElementById("playBtn");
  var stepBtn   = document.getElementById("stepBtn");
  var clearBtn  = document.getElementById("clearBtn");
  var randBtn   = document.getElementById("randBtn");
  var presetSel = document.getElementById("presetSel");
  var saveBtn   = document.getElementById("saveBtn");

  var fpsSlider  = document.getElementById("fpsSlider");
  var scaleSlider= document.getElementById("scaleSlider");

  /* ─── State ──────────────────────────────────── */
  var W, H, cols, rows, cellSize;
  var grid, nextGrid;
  var generation = 0, liveCount = 0, prevLive = 0;
  var playing = false, reqId, lastDraw = 0;
  var fps = 8;
  var drawPending = false;

  /* Mouse drag */
  var dragging = false, paintValue = true;

  /* ─── Presets ────────────────────────────────── */
  var PRESETS = {
    glider: [[1,0],[2,1],[0,2],[1,2],[2,2]],
    pulsar: (function () {
      var pts = [];
      var pattern = [
        [2,0],[3,0],[4,0],[8,0],[9,0],[10,0],
        [0,2],[5,2],[7,2],[12,2],
        [0,3],[5,3],[7,3],[12,3],
        [0,4],[5,4],[7,4],[12,4],
        [2,5],[3,5],[4,5],[8,5],[9,5],[10,5],
        [2,7],[3,7],[4,7],[8,7],[9,7],[10,7],
        [0,8],[5,8],[7,8],[12,8],
        [0,9],[5,9],[7,9],[12,9],
        [0,10],[5,10],[7,10],[12,10],
        [2,12],[3,12],[4,12],[8,12],[9,12],[10,12],
      ];
      return pattern;
    })(),
    acorn: [[1,0],[3,1],[0,2],[1,2],[4,2],[5,2],[6,2]],
    gosper: (function () {
      return [
        [24,0],[22,1],[24,1],[12,2],[13,2],[20,2],[21,2],[34,2],[35,2],
        [11,3],[15,3],[20,3],[21,3],[34,3],[35,3],
        [0,4],[1,4],[10,4],[16,4],[20,4],[21,4],
        [0,5],[1,5],[10,5],[14,5],[16,5],[17,5],[22,5],[24,5],
        [10,6],[16,6],[24,6],
        [11,7],[15,7],
        [12,8],[13,8],
      ];
    })(),
  };

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    recalcGrid();
  }
  window.addEventListener("resize", resize);

  function recalcGrid() {
    cellSize = parseInt(scaleSlider.value, 10) || 8;
    cols = Math.ceil(W / cellSize);
    rows = Math.ceil(H / cellSize);
    var oldGrid = grid;
    grid = [];
    nextGrid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      nextGrid[r] = [];
      for (var c = 0; c < cols; c++) {
        grid[r][c] = oldGrid && oldGrid[r] ? !!oldGrid[r][c] : false;
        nextGrid[r][c] = false;
      }
    }
    countLive();
  }

  /* ─── Grid ops ───────────────────────────────── */
  function randomize(density) {
    density = density || 0.2;
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++)
        grid[r][c] = Math.random() < density;
    generation = 0;
    prevLive = 0;
    genVal.textContent = "0";
    countLive();
  }

  function clearGrid() {
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++)
        grid[r][c] = false;
    generation = 0;
    prevLive = 0;
    genVal.textContent = "0";
    countLive();
  }

  function countLive() {
    liveCount = 0;
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++)
        if (grid[r][c]) liveCount++;
    liveVal.textContent = liveCount;
  }

  function toroidal(x, n) {
    return ((x % n) + n) % n;
  }

  /* ─── Step ────────────────────────────────────── */
  function step() {
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var n = 0;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (grid[toroidal(r + dr, rows)][toroidal(c + dc, cols)]) n++;
          }
        }
        if (grid[r][c]) {
          nextGrid[r][c] = (n === 2 || n === 3);
        } else {
          nextGrid[r][c] = (n === 3);
        }
      }
    }

    /* Swap buffers */
    var tmp = grid; grid = nextGrid; nextGrid = tmp;
    generation++;
    genVal.textContent = generation;

    prevLive = liveCount;
    countLive();
    deltaVal.textContent = liveCount - prevLive;
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (!grid[r][c]) continue;
        var x = c * cellSize, y = r * cellSize;
        /* Determine if newborn (alive in grid but not in nextGrid from prev step) */
        var isNewborn = !nextGrid[r][c];
        ctx.fillStyle = isNewborn ? "#00f0ff" : "#6a5acd";
        ctx.shadowColor = isNewborn ? "rgba(0,240,255,0.2)" : "rgba(106,90,205,0.15)";
        ctx.shadowBlur = isNewborn ? 6 : 3;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        ctx.shadowBlur = 0;
      }
    }
  }

  /* ─── Loop ────────────────────────────────────── */
  function loop(time) {
    reqId = requestAnimationFrame(loop);

    if (!lastDraw) lastDraw = time;
    var elapsed = time - lastDraw;
    var interval = 1000 / fps;

    if (playing && elapsed >= interval) {
      step();
      draw();
      lastDraw = time;
    } else if (!playing && drawPending) {
      draw();
      drawPending = false;
    }
  }

  /* ─── Play / Pause ───────────────────────────── */
  function togglePlay() {
    playing = !playing;
    playBtn.textContent = playing ? "PAUSE" : "PLAY";
    playBtn.classList.toggle("active", playing);
    if (playing) lastDraw = 0;
  }

  /* ─── Preset loader ──────────────────────────── */
  function loadPreset(name) {
    if (!name || !PRESETS[name]) return;
    clearGrid();
    var pts = PRESETS[name];
    var maxR = 0, maxC = 0;
    for (var i = 0; i < pts.length; i++) {
      if (pts[i][1] > maxR) maxR = pts[i][1];
      if (pts[i][0] > maxC) maxC = pts[i][0];
    }
    var offsetR = Math.floor((rows - maxR - 1) / 2);
    var offsetC = Math.floor((cols - maxC - 1) / 2);
    for (var j = 0; j < pts.length; j++) {
      var r = pts[j][1] + offsetR, c = pts[j][0] + offsetC;
      if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = true;
    }
    generation = 0; prevLive = 0;
    genVal.textContent = "0";
    countLive();
    drawPending = true;
  }

  /* ─── Save / Load custom presets ──────────────── */
  function savePreset() {
    var pts = [];
    for (var r = 0; r < rows; r++)
      for (var c = 0; c < cols; c++)
        if (grid[r][c]) pts.push([c, r]);
    var data = JSON.stringify(pts);
    var key = "cgol_custom_" + Date.now();
    localStorage.setItem(key, data);
    /* Add to dropdown */
    var opt = document.createElement("option");
    opt.value = "custom_" + key;
    opt.textContent = "Custom " + new Date().toLocaleTimeString();
    presetSel.insertBefore(opt, presetSel.lastElementChild.nextSibling);
    presetSel.value = opt.value;
  }

  function loadCustomPreset(key) {
    var data = localStorage.getItem(key);
    if (!data) return;
    clearGrid();
    var pts = JSON.parse(data);
    for (var i = 0; i < pts.length; i++) {
      var c = pts[i][0], r = pts[i][1];
      if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = true;
    }
    generation = 0; prevLive = 0;
    genVal.textContent = "0";
    countLive();
    drawPending = true;
  }

  /* ─── Canvas interaction ─────────────────────── */
  function getCell(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var cx, cy;
    if (e.touches) {
      cx = (e.touches[0].clientX - rect.left) * scaleX;
      cy = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      cx = (e.clientX - rect.left) * scaleX;
      cy = (e.clientY - rect.top) * scaleY;
    }
    return { r: Math.floor(cy / cellSize), c: Math.floor(cx / cellSize) };
  }

  function toggleCell(e) {
    var p = getCell(e);
    if (p.r < 0 || p.r >= rows || p.c < 0 || p.c >= cols) return;
    grid[p.r][p.c] = !grid[p.r][p.c];
    countLive();
    drawPending = true;
  }

  /* ─── Input events ───────────────────────────── */
  function bindEvents() {
    playBtn.addEventListener("click", togglePlay);
    stepBtn.addEventListener("click", function () { if (!playing) { step(); drawPending = true; } });
    clearBtn.addEventListener("click", function () { playing = false; playBtn.textContent = "PLAY"; playBtn.classList.remove("active"); clearGrid(); drawPending = true; });
    randBtn.addEventListener("click", function () { playing = false; playBtn.textContent = "PLAY"; playBtn.classList.remove("active"); randomize(); drawPending = true; });

    presetSel.addEventListener("change", function () {
      var val = presetSel.value;
      if (!val) return;
      if (val.startsWith("custom_")) {
        loadCustomPreset(val.replace("custom_", ""));
      } else {
        loadPreset(val);
      }
      presetSel.value = "";
    });

    saveBtn.addEventListener("click", savePreset);

    fpsSlider.addEventListener("input", function () {
      fps = parseInt(fpsSlider.value, 10);
      document.getElementById("fpsVal").textContent = fps;
    });
    scaleSlider.addEventListener("input", function () {
      recalcGrid();
      drawPending = true;
    });

    /* Canvas mouse */
    canvas.addEventListener("mousedown", function (e) {
      dragging = true;
      var p = getCell(e);
      if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
        paintValue = !grid[p.r][p.c];
        grid[p.r][p.c] = paintValue;
        countLive();
        drawPending = true;
      }
    });
    canvas.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var p = getCell(e);
      if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
        if (grid[p.r][p.c] !== paintValue) {
          grid[p.r][p.c] = paintValue;
          countLive();
          drawPending = true;
        }
      }
    });
    canvas.addEventListener("mouseup", function () { dragging = false; });
    canvas.addEventListener("mouseleave", function () { dragging = false; });

    /* Touch */
    canvas.addEventListener("touchstart", function (e) {
      e.preventDefault();
      toggleCell(e);
    }, { passive: false });
    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault();
      var p = getCell(e);
      if (p.r >= 0 && p.r < rows && p.c >= 0 && p.c < cols) {
        if (!grid[p.r][p.c]) { grid[p.r][p.c] = true; countLive(); drawPending = true; }
      }
    }, { passive: false });

    /* Load saved presets */
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.startsWith("cgol_custom_")) {
        var opt = document.createElement("option");
        opt.value = "custom_" + key;
        opt.textContent = "Custom " + new Date(parseInt(key.replace("cgol_custom_", ""), 10)).toLocaleTimeString();
        presetSel.appendChild(opt);
      }
    }
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    bindEvents();
    resize();
    randomize(0.15);
    draw();
    lastDraw = 0;
    reqId = requestAnimationFrame(loop);
  }

  init();
})();
