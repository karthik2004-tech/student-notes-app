(function () {
  "use strict";

  /* ─── Constants ─────────────────────────────── */
  var COLS = 30, ROWS = 20;
  var EMPTY = 0, WALL = 1, START = 2, END = 3;

  /* ─── DOM ─────────────────────────────────────── */
  var gridEl  = document.getElementById("grid");
  var algoSel = document.getElementById("algoSel");
  var spdSlider = document.getElementById("spdSlider");
  var expVal  = document.getElementById("expVal");
  var visVal  = document.getElementById("visVal");
  var pathVal = document.getElementById("pathVal");
  var timeVal = document.getElementById("timeVal");
  var searchBtn = document.getElementById("searchBtn");
  var mazeBtn  = document.getElementById("mazeBtn");
  var clearBtn = document.getElementById("clearBtn");
  var resetBtn = document.getElementById("resetBtn");

  /* ─── Grid state ─────────────────────────────── */
  var grid = [];
  var start = { r: 2, c: 4 };
  var end   = { r: 17, c: 25 };
  var running = false;

  /* ─── Telemetry state ────────────────────────── */
  var expanded = 0, visitedCount = 0;

  /* ─── Slider display ─────────────────────────── */
  spdSlider.addEventListener("input", function () {
    document.getElementById("spdVal").textContent = spdSlider.value;
  });

  /* ─── Grid init ───────────────────────────────── */
  function initGrid() {
    grid = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      for (var c = 0; c < COLS; c++) {
        grid[r][c] = EMPTY;
      }
    }
    grid[start.r][start.c] = START;
    grid[end.r][end.c] = END;
  }

  /* ─── Render ─────────────────────────────────── */
  function render() {
    gridEl.innerHTML = "";
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        var val = grid[r][c];
        if (val === WALL) cell.classList.add("wall");
        else if (val === START) cell.classList.add("start");
        else if (val === END) cell.classList.add("end");
        else if (val === "visited") cell.classList.add("visited");
        else if (val === "frontier") cell.classList.add("frontier");
        else if (val === "path") cell.classList.add("path");
        else if (val === "current") cell.classList.add("current");
        gridEl.appendChild(cell);
      }
    }
  }

  /* ─── Cell helpers ──────────────────────────── */
  function getCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return grid[r][c];
  }

  function isBlocked(r, c) {
    var v = getCell(r, c);
    return v === null || v === WALL;
  }

  function setCell(r, c, val) {
    grid[r][c] = val;
  }

  /* ─── Get neighbors ──────────────────────────── */
  function getNeighbors(r, c) {
    var dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    var out = [];
    for (var i = 0; i < dirs.length; i++) {
      var nr = r + dirs[i][0], nc = c + dirs[i][1];
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        out.push({ r: nr, c: nc });
      }
    }
    return out;
  }

  /* ─── Delay ──────────────────────────────────── */
  function delay() {
    var spd = parseInt(spdSlider.value, 10);
    var ms = Math.max(10, 60 - spd * 2);
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* ─── Draw helpers ──────────────────────────── */
  function setVisited(r, c) {
    if (grid[r][c] === EMPTY) grid[r][c] = "visited";
  }

  function setFrontier(r, c) {
    if (grid[r][c] === EMPTY) grid[r][c] = "frontier";
  }

  /* ─── Reconstruct path ───────────────────────── */
  async function reconstructPath(parent, current) {
    var steps = [];
    while (current) {
      var key = current.r + "," + current.c;
      if (grid[current.r][current.c] !== START && grid[current.r][current.c] !== END) {
        grid[current.r][current.c] = "path";
      }
      steps.push(current);
      current = parent[key];
    }
    pathVal.textContent = steps.length - 1;
    render();
  }

  /* ─── BFS ────────────────────────────────────── */
  async function bfs() {
    var queue = [{ r: start.r, c: start.c }];
    var parent = {};
    parent[start.r + "," + start.c] = null;

    while (queue.length > 0) {
      if (!running) return;
      var cur = queue.shift();
      if (cur.r === end.r && cur.c === end.c) {
        await reconstructPath(parent, cur);
        return;
      }
      if (grid[cur.r][cur.c] !== START) setVisited(cur.r, cur.c);
      expanded++;
      expVal.textContent = expanded;
      render();
      await delay();

      var neighbors = getNeighbors(cur.r, cur.c);
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        var key = n.r + "," + n.c;
        if (parent[key] !== undefined) continue;
        if (isBlocked(n.r, n.c)) continue;
        parent[key] = cur;
        if (n.r === end.r && n.c === end.c) {
          await reconstructPath(parent, n);
          return;
        }
        setFrontier(n.r, n.c);
        queue.push(n);
        visitedCount++;
        visVal.textContent = visitedCount;
      }
    }
    pathVal.textContent = "—";
    render();
  }

  /* ─── DFS ────────────────────────────────────── */
  async function dfs() {
    var stack = [{ r: start.r, c: start.c }];
    var parent = {};
    parent[start.r + "," + start.c] = null;

    while (stack.length > 0) {
      if (!running) return;
      var cur = stack.pop();
      if (cur.r === end.r && cur.c === end.c) {
        await reconstructPath(parent, cur);
        return;
      }
      if (grid[cur.r][cur.c] !== START) setVisited(cur.r, cur.c);
      expanded++;
      expVal.textContent = expanded;
      render();
      await delay();

      var neighbors = getNeighbors(cur.r, cur.c);
      for (var i = neighbors.length - 1; i >= 0; i--) {
        var n = neighbors[i];
        var key = n.r + "," + n.c;
        if (parent[key] !== undefined) continue;
        if (isBlocked(n.r, n.c)) continue;
        parent[key] = cur;
        if (n.r === end.r && n.c === end.c) {
          await reconstructPath(parent, n);
          return;
        }
        setFrontier(n.r, n.c);
        stack.push(n);
        visitedCount++;
        visVal.textContent = visitedCount;
      }
    }
    pathVal.textContent = "—";
    render();
  }

  /* ─── Heuristic (Manhattan) ──────────────────── */
  function heuristic(r, c) {
    return Math.abs(r - end.r) + Math.abs(c - end.c);
  }

  /* ─── A* ────────────────────────────────────── */
  async function astar() {
    var open = [{ r: start.r, c: start.c, g: 0, f: heuristic(start.r, start.c) }];
    var parent = {};
    var gScore = {};
    var startKey = start.r + "," + start.c;
    parent[startKey] = null;
    gScore[startKey] = 0;

    while (open.length > 0) {
      if (!running) return;
      /* find min f */
      var minIdx = 0;
      for (var i = 1; i < open.length; i++) {
        if (open[i].f < open[minIdx].f) minIdx = i;
      }
      var cur = open.splice(minIdx, 1)[0];
      var curKey = cur.r + "," + cur.c;

      if (cur.r === end.r && cur.c === end.c) {
        await reconstructPath(parent, cur);
        return;
      }

      if (grid[cur.r][cur.c] !== START) setVisited(cur.r, cur.c);
      expanded++;
      expVal.textContent = expanded;
      render();
      await delay();

      var neighbors = getNeighbors(cur.r, cur.c);
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (isBlocked(n.r, n.c)) continue;
        var nKey = n.r + "," + n.c;
        var tentativeG = gScore[curKey] + 1;
        if (gScore[nKey] === undefined || tentativeG < gScore[nKey]) {
          parent[nKey] = cur;
          gScore[nKey] = tentativeG;
          var f = tentativeG + heuristic(n.r, n.c);
          var found = false;
          for (var j = 0; j < open.length; j++) {
            if (open[j].r === n.r && open[j].c === n.c) { found = true; break; }
          }
          if (!found) {
            open.push({ r: n.r, c: n.c, g: tentativeG, f: f });
            setFrontier(n.r, n.c);
            visitedCount++;
            visVal.textContent = visitedCount;
          }
        }
      }
    }
    pathVal.textContent = "—";
    render();
  }

  /* ─── Greedy Best-First ──────────────────────── */
  async function greedy() {
    var open = [{ r: start.r, c: start.c, f: heuristic(start.r, start.c) }];
    var parent = {};
    parent[start.r + "," + start.c] = null;

    while (open.length > 0) {
      if (!running) return;
      var minIdx = 0;
      for (var i = 1; i < open.length; i++) {
        if (open[i].f < open[minIdx].f) minIdx = i;
      }
      var cur = open.splice(minIdx, 1)[0];
      var curKey = cur.r + "," + cur.c;

      if (cur.r === end.r && cur.c === end.c) {
        await reconstructPath(parent, cur);
        return;
      }

      if (grid[cur.r][cur.c] !== START) setVisited(cur.r, cur.c);
      expanded++;
      expVal.textContent = expanded;
      render();
      await delay();

      var neighbors = getNeighbors(cur.r, cur.c);
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        if (isBlocked(n.r, n.c)) continue;
        var nKey = n.r + "," + n.c;
        if (parent[nKey] !== undefined) continue;
        parent[nKey] = cur;
        if (n.r === end.r && n.c === end.c) {
          await reconstructPath(parent, n);
          return;
        }
        setFrontier(n.r, n.c);
        open.push({ r: n.r, c: n.c, f: heuristic(n.r, n.c) });
        visitedCount++;
        visVal.textContent = visitedCount;
      }
    }
    pathVal.textContent = "—";
    render();
  }

  /* ─── Search orchestrator ────────────────────── */
  async function findPath() {
    if (running) return;
    running = true;
    searchBtn.disabled = true;
    mazeBtn.disabled = true;

    /* clear visuals */
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === "visited" || grid[r][c] === "frontier" || grid[r][c] === "path" || grid[r][c] === "current") {
          grid[r][c] = EMPTY;
        }
      }
    }
    expanded = 0; visitedCount = 0;
    expVal.textContent = "0";
    visVal.textContent = "0";
    pathVal.textContent = "—";
    var t0 = performance.now();
    render();

    var algos = { bfs: bfs, dfs: dfs, astar: astar, greedy: greedy };
    await algos[algoSel.value]();

    var t1 = performance.now();
    timeVal.textContent = (t1 - t0).toFixed(1) + "ms";

    running = false;
    searchBtn.disabled = false;
    mazeBtn.disabled = false;
  }

  /* ─── Maze generation ────────────────────────── */
  function generateMaze() {
    if (running) return;
    initGrid();
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === START || grid[r][c] === END) continue;
        if (Math.random() < 0.3) grid[r][c] = WALL;
      }
    }
    render();
    pathVal.textContent = "—";
    timeVal.textContent = "—";
  }

  /* ─── Clear trail ────────────────────────────── */
  function clearTrail() {
    if (running) return;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (grid[r][c] === "visited" || grid[r][c] === "frontier" || grid[r][c] === "path" || grid[r][c] === "current") {
          grid[r][c] = EMPTY;
        }
      }
    }
    expanded = 0; visitedCount = 0;
    expVal.textContent = "0";
    visVal.textContent = "0";
    pathVal.textContent = "—";
    render();
  }

  /* ─── Reset ──────────────────────────────────── */
  function hardReset() {
    if (running) return;
    running = false;
    initGrid();
    render();
    expVal.textContent = "0";
    visVal.textContent = "0";
    pathVal.textContent = "—";
    timeVal.textContent = "—";
  }

  /* ─── Mouse handling ────────────────────────── */
  var drawMode = null; /* 'wall' or 'start' or 'end' */
  var mouseDown = false;

  gridEl.addEventListener("mousedown", function (e) {
    var cell = e.target.closest(".cell");
    if (!cell) return;
    var r = parseInt(cell.dataset.r, 10);
    var c = parseInt(cell.dataset.c, 10);
    if (grid[r][c] === START) { drawMode = "start"; mouseDown = true; return; }
    if (grid[r][c] === END) { drawMode = "end"; mouseDown = true; return; }
    drawMode = "wall";
    mouseDown = true;
    toggleWall(r, c);
  });

  gridEl.addEventListener("mousemove", function (e) {
    if (!mouseDown) return;
    var cell = e.target.closest(".cell");
    if (!cell) return;
    var r = parseInt(cell.dataset.r, 10);
    var c = parseInt(cell.dataset.c, 10);
    if (drawMode === "wall") toggleWall(r, c);
    else if (drawMode === "start") moveStart(r, c);
    else if (drawMode === "end") moveEnd(r, c);
  });

  document.addEventListener("mouseup", function () {
    mouseDown = false;
    drawMode = null;
  });

  function toggleWall(r, c) {
    if (grid[r][c] === START || grid[r][c] === END) return;
    if (grid[r][c] === WALL) grid[r][c] = EMPTY;
    else grid[r][c] = WALL;
    render();
  }

  function moveStart(r, c) {
    if (grid[r][c] === END || grid[r][c] === WALL) return;
    grid[start.r][start.c] = EMPTY;
    start = { r: r, c: c };
    grid[r][c] = START;
    render();
  }

  function moveEnd(r, c) {
    if (grid[r][c] === START || grid[r][c] === WALL) return;
    grid[end.r][end.c] = EMPTY;
    end = { r: r, c: c };
    grid[r][c] = END;
    render();
  }

  /* ─── Events ──────────────────────────────────── */
  searchBtn.addEventListener("click", findPath);
  mazeBtn.addEventListener("click", generateMaze);
  clearBtn.addEventListener("click", clearTrail);
  resetBtn.addEventListener("click", hardReset);

  /* ─── Init ────────────────────────────────────── */
  function init() {
    initGrid();
    render();
  }

  init();
})();
