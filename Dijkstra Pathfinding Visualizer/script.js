(function () {

  var ROWS = 20;
  var COLS = 40;

  var App = {
    grid: [],
    state: {
      algorithm: 'dijkstra',
      toolMode: 'wall',
      start: { row: 10, col: 5 },
      target: { row: 10, col: 34 },
      running: false,
      paused: false,
      finished: false,
      blocked: false,
      cancelled: false,
      speed: 30,
      stepCount: 0,
      visitedCount: 0,
      pathLength: 0,
      pathCost: 0,
    },

    dom: {},
    chart: null,
    openSet: [],
    visitedSet: [],
    stepHistory: [],
    resumeResolver: null,
    isMouseDown: false,
    isDraggingStart: false,
    isDraggingTarget: false,

    algoNames: {
      dijkstra: 'Dijkstra',
      astar: 'A* Heuristic',
      bfs: 'BFS',
      dfs: 'DFS',
    },

    algoColors: {
      dijkstra: '#2e7d32',
      astar: '#009688',
      bfs: '#4caf50',
      dfs: '#795548',
    },

    init: function () {
      this.cacheDom();
      this.bindEvents();
      this.buildGrid();
      this.renderGrid();
      this.initChart();
      this.setStatus('AWAITING MATRIX SEED', 'awaiting');
    },

    cacheDom: function () {
      this.dom.algoTabs = document.getElementById('algo-tabs');
      this.dom.toolTabs = document.getElementById('tool-tabs');
      this.dom.speedSlider = document.getElementById('speed-slider');
      this.dom.speedDisplay = document.getElementById('speed-display');
      this.dom.presetBtns = document.querySelectorAll('.preset-btn');
      this.dom.btnStart = document.getElementById('btn-start');
      this.dom.btnPause = document.getElementById('btn-pause');
      this.dom.btnClearVis = document.getElementById('btn-clear-vis');
      this.dom.btnReset = document.getElementById('btn-reset');
      this.dom.btnExport = document.getElementById('btn-export');
      this.dom.gridContainer = document.getElementById('grid-container');
      this.dom.diagEngine = document.getElementById('diag-engine');
      this.dom.diagSteps = document.getElementById('diag-steps');
      this.dom.diagFootprint = document.getElementById('diag-footprint');
      this.dom.diagPathCost = document.getElementById('diag-pathcost');
      this.dom.diagStatus = document.getElementById('diag-status');
      this.dom.gridInfo = document.getElementById('grid-info');
      this.dom.logInfo = document.getElementById('log-info');
      this.dom.logBody = document.getElementById('log-body');
      this.dom.metricVolume = document.getElementById('metric-volume');
      this.dom.metricEfficiency = document.getElementById('metric-efficiency');
      this.dom.metricVelocity = document.getElementById('metric-velocity');
      this.dom.chartCanvas = document.getElementById('exploration-chart');
      this.dom.statusBanner = document.getElementById('status-banner');
    },

    bindEvents: function () {
      var self = this;

      this.dom.algoTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.algo-tab');
        if (!tab || self.state.running) return;
        self.dom.algoTabs.querySelectorAll('.algo-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        self.state.algorithm = tab.dataset.algo;
        self.updateDiagnosticHeader();
      });

      this.dom.toolTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.tool-tab');
        if (!tab) return;
        self.dom.toolTabs.querySelectorAll('.tool-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        self.state.toolMode = tab.dataset.mode;
      });

      this.dom.speedSlider.addEventListener('input', function () {
        self.state.speed = parseInt(this.value);
        self.dom.speedDisplay.textContent = this.value + ' ms';
      });

      this.dom.presetBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (self.state.running) return;
          self.loadPreset(this.dataset.preset);
        });
      });

      this.dom.btnStart.addEventListener('click', function () {
        if (self.state.running && !self.state.paused) return;
        if (self.state.paused) {
          self.resumeAlgorithm();
        } else {
          self.startAlgorithm();
        }
      });

      this.dom.btnPause.addEventListener('click', function () {
        self.togglePause();
      });

      this.dom.btnClearVis.addEventListener('click', function () {
        if (self.state.running) return;
        self.clearVisualization();
      });

      this.dom.btnReset.addEventListener('click', function () {
        if (self.state.running) {
          self.state.cancelled = true;
        }
        self.resetGrid();
      });

      this.dom.btnExport.addEventListener('click', function () {
        self.exportCSV();
      });
    },

    buildGrid: function () {
      this.grid = [];
      var fragment = document.createDocumentFragment();
      for (var r = 0; r < ROWS; r++) {
        this.grid[r] = [];
        for (var c = 0; c < COLS; c++) {
          var cell = {
            row: r,
            col: c,
            isStart: (r === this.state.start.row && c === this.state.start.col),
            isTarget: (r === this.state.target.row && c === this.state.target.col),
            isWall: false,
            isVisited: false,
            isOpen: false,
            isPath: false,
            gCost: Infinity,
            hCost: 0,
            fCost: Infinity,
            parent: null,
          };
          this.grid[r][c] = cell;

          var div = document.createElement('div');
          div.className = 'cell';
          div.dataset.row = r;
          div.dataset.col = c;
          if (cell.isStart) div.classList.add('cell-start');
          if (cell.isTarget) div.classList.add('cell-target');
          fragment.appendChild(div);
        }
      }
      this.dom.gridContainer.appendChild(fragment);

      var self = this;
      this.dom.gridContainer.addEventListener('mousedown', function (e) {
        var el = e.target;
        if (!el.classList.contains('cell')) return;
        var row = parseInt(el.dataset.row);
        var col = parseInt(el.dataset.col);
        self.isMouseDown = true;
        self.handleCellAction(row, col, e);
      });

      this.dom.gridContainer.addEventListener('mousemove', function (e) {
        if (!self.isMouseDown) return;
        var el = e.target;
        if (!el.classList.contains('cell')) return;
        var row = parseInt(el.dataset.row);
        var col = parseInt(el.dataset.col);
        self.handleCellAction(row, col, e);
      });

      document.addEventListener('mouseup', function () {
        self.isMouseDown = false;
        self.isDraggingStart = false;
        self.isDraggingTarget = false;
      });

      this.dom.gridContainer.addEventListener('dragstart', function (e) { e.preventDefault(); });
    },

    handleCellAction: function (row, col, e) {
      if (this.state.running) return;
      var cell = this.grid[row][col];

      switch (this.state.toolMode) {
        case 'wall':
          if (!cell.isStart && !cell.isTarget) {
            cell.isWall = true;
            this.syncCellDOM(row, col);
          }
          break;
        case 'erase':
          if (!cell.isStart && !cell.isTarget) {
            cell.isWall = false;
            this.syncCellDOM(row, col);
          }
          break;
        case 'start':
          if (!cell.isWall && !cell.isTarget) {
            var oldStart = this.grid[this.state.start.row][this.state.start.col];
            oldStart.isStart = false;
            this.syncCellDOM(oldStart.row, oldStart.col);
            cell.isStart = true;
            this.state.start = { row: row, col: col };
            this.syncCellDOM(row, col);
          }
          break;
        case 'target':
          if (!cell.isWall && !cell.isStart) {
            var oldTarget = this.grid[this.state.target.row][this.state.target.col];
            oldTarget.isTarget = false;
            this.syncCellDOM(oldTarget.row, oldTarget.col);
            cell.isTarget = true;
            this.state.target = { row: row, col: col };
            this.syncCellDOM(row, col);
          }
          break;
      }
    },

    syncCellDOM: function (row, col) {
      var cell = this.grid[row][col];
      var div = this.dom.gridContainer.querySelector('[data-row="' + row + '"][data-col="' + col + '"]');
      if (!div) return;

      div.className = 'cell';
      if (cell.isStart) div.classList.add('cell-start');
      if (cell.isTarget) div.classList.add('cell-target');
      if (cell.isWall) div.classList.add('cell-wall');
      if (cell.isVisited) div.classList.add('cell-visited');
      if (cell.isOpen) div.classList.add('cell-open');
      if (cell.isPath) div.classList.add('cell-path');
    },

    renderGrid: function () {
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          this.syncCellDOM(r, c);
        }
      }
    },

    clearVisualization: function () {
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var cell = this.grid[r][c];
          cell.isVisited = false;
          cell.isOpen = false;
          cell.isPath = false;
          cell.gCost = Infinity;
          cell.hCost = 0;
          cell.fCost = Infinity;
          cell.parent = null;
        }
      }
      this.state.stepCount = 0;
      this.state.visitedCount = 0;
      this.state.pathLength = 0;
      this.state.pathCost = 0;
      this.state.finished = false;
      this.state.blocked = false;
      this.openSet = [];
      this.visitedSet = [];
      this.stepHistory = [];
      this.renderGrid();
      this.renderTelemetry();
      this.renderLog();
      this.updateDiagnosticHeader();
      this.updateChart();
      this.setStatus('VISUAL FRONTIER CLEARED', 'awaiting');
    },

    resetGrid: function () {
      this.state.cancelled = true;
      this.state.running = false;
      this.state.paused = false;

      var oldStart = this.state.start;
      var oldTarget = this.state.target;

      this.grid[oldStart.row][oldStart.col].isStart = false;
      this.grid[oldTarget.row][oldTarget.col].isTarget = false;

      this.state.start = { row: 10, col: 5 };
      this.state.target = { row: 10, col: 34 };

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var cell = this.grid[r][c];
          cell.isWall = false;
          cell.isVisited = false;
          cell.isOpen = false;
          cell.isPath = false;
          cell.gCost = Infinity;
          cell.hCost = 0;
          cell.fCost = Infinity;
          cell.parent = null;
        }
      }

      this.grid[10][5].isStart = true;
      this.grid[10][34].isTarget = true;

      this.state.stepCount = 0;
      this.state.visitedCount = 0;
      this.state.pathLength = 0;
      this.state.pathCost = 0;
      this.state.finished = false;
      this.state.blocked = false;
      this.openSet = [];
      this.visitedSet = [];
      this.stepHistory = [];
      this.renderGrid();
      this.renderTelemetry();
      this.renderLog();
      this.updateDiagnosticHeader();
      this.updateChart();
      this.dom.btnStart.textContent = 'START PATHFINDING';
      this.dom.btnPause.textContent = 'PAUSE';
      this.dom.btnStart.disabled = false;
      this.setStatus('GRID RESET TO DEFAULT', 'awaiting');
    },

    getNeighbors: function (row, col) {
      var neighbors = [];
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var i = 0; i < dirs.length; i++) {
        var nr = row + dirs[i][0];
        var nc = col + dirs[i][1];
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          neighbors.push(this.grid[nr][nc]);
        }
      }
      return neighbors;
    },

    manhattan: function (a, b) {
      return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    },

    startAlgorithm: function () {
      var self = this;
      this.clearVisualization();

      var start = this.grid[this.state.start.row][this.state.start.col];
      var target = this.grid[this.state.target.row][this.state.target.col];

      if (start.isWall || target.isWall) {
        this.setStatus('ERROR: Start or target node is blocked by a wall', 'blocked');
        return;
      }

      this.state.running = true;
      this.state.paused = false;
      this.state.cancelled = false;
      this.state.finished = false;
      this.state.blocked = false;
      this.state.stepCount = 0;
      this.state.visitedCount = 0;
      this.state.pathLength = 0;
      this.state.pathCost = 0;
      this.stepHistory = [];
      this.openSet = [];
      this.visitedSet = [];

      this.dom.btnStart.textContent = 'RUNNING...';
      this.dom.btnStart.disabled = true;
      this.dom.btnPause.textContent = 'PAUSE';
      this.setStatus('ROOT SYSTEM DISCOVERING FRONTIER CORES...', 'running');
      this.updateDiagnosticHeader();

      var algo = this.state.algorithm;
      var gen;

      if (algo === 'dijkstra') gen = this.dijkstraGen(start, target);
      else if (algo === 'astar') gen = this.astarGen(start, target);
      else if (algo === 'bfs') gen = this.bfsGen(start, target);
      else if (algo === 'dfs') gen = this.dfsGen(start, target);

      this.runGenerator(gen, target);
    },

    runGenerator: function (gen, target) {
      var self = this;

      function step() {
        if (self.state.cancelled) {
          self.state.running = false;
          self.dom.btnStart.textContent = 'START PATHFINDING';
          self.dom.btnStart.disabled = false;
          return;
        }

        if (self.state.paused) {
          setTimeout(step, 50);
          return;
        }

        var result = gen.next();
        if (result.done) {
          self.state.running = false;
          self.dom.btnStart.textContent = 'START PATHFINDING';
          self.dom.btnStart.disabled = false;

          if (result.value && result.value.found) {
            self.reconstructPath(target);
            self.state.finished = true;
            self.setStatus('SHORTEST PATH RESOLVED NATIVELY: cost ' + self.state.pathCost, 'done');
          } else {
            self.state.blocked = true;
            self.setStatus('TARGET NODE BLOCKED: ALL TRACKS EXHAUSTED', 'blocked');
          }

          self.renderTelemetry();
          self.renderLog();
          self.updateDiagnosticHeader();
          self.updateChart();
          return;
        }

        self.renderGrid();
        self.renderTelemetry();
        self.renderLog();
        self.updateDiagnosticHeader();
        self.updateChart();

        self.dom.diagSteps.textContent = self.state.stepCount;

        setTimeout(step, self.state.speed);
      }

      setTimeout(step, 10);
    },

    dijkstraGen: function (start, target) {
      var self = this;
      start.gCost = 0;
      start.hCost = 0;
      start.fCost = 0;
      this.openSet = [start];
      start.isOpen = true;

      return {
        next: function () {
          if (self.openSet.length === 0) return { done: true, value: { found: false } };

          self.openSet.sort(function (a, b) { return a.gCost - b.gCost; });
          var current = self.openSet.shift();
          current.isOpen = false;
          current.isVisited = true;
          self.state.stepCount++;
          self.state.visitedCount++;

          self.visitedSet.push(current);

          self.stepHistory.push({
            step: self.state.stepCount,
            coord: '[' + current.row + ',' + current.col + ']',
            change: 'EVALUATED',
            fcost: current.gCost.toFixed(1),
            queueSize: self.openSet.length,
          });

          if (current.isTarget) return { done: true, value: { found: true } };

          var neighbors = self.getNeighbors(current.row, current.col);
          for (var i = 0; i < neighbors.length; i++) {
            var n = neighbors[i];
            if (n.isWall || n.isVisited) continue;
            var tentativeG = current.gCost + 1;
            if (tentativeG < n.gCost) {
              n.gCost = tentativeG;
              n.parent = current;
              if (!n.isOpen) {
                n.isOpen = true;
                self.openSet.push(n);
              }
            }
          }

          return { done: false };
        },
      };
    },

    astarGen: function (start, target) {
      var self = this;
      start.gCost = 0;
      start.hCost = this.manhattan(start, target);
      start.fCost = start.hCost;
      this.openSet = [start];
      start.isOpen = true;

      return {
        next: function () {
          if (self.openSet.length === 0) return { done: true, value: { found: false } };

          self.openSet.sort(function (a, b) { return a.fCost - b.fCost; });
          var current = self.openSet.shift();
          current.isOpen = false;
          current.isVisited = true;
          self.state.stepCount++;
          self.state.visitedCount++;

          self.visitedSet.push(current);

          self.stepHistory.push({
            step: self.state.stepCount,
            coord: '[' + current.row + ',' + current.col + ']',
            change: 'EVALUATED',
            fcost: current.fCost.toFixed(1),
            queueSize: self.openSet.length,
          });

          if (current.isTarget) return { done: true, value: { found: true } };

          var neighbors = self.getNeighbors(current.row, current.col);
          for (var i = 0; i < neighbors.length; i++) {
            var n = neighbors[i];
            if (n.isWall || n.isVisited) continue;
            var tentativeG = current.gCost + 1;
            if (tentativeG < n.gCost) {
              n.gCost = tentativeG;
              n.hCost = self.manhattan(n, target);
              n.fCost = n.gCost + n.hCost;
              n.parent = current;
              if (!n.isOpen) {
                n.isOpen = true;
                self.openSet.push(n);
              }
            }
          }

          return { done: false };
        },
      };
    },

    bfsGen: function (start, target) {
      var self = this;
      start.gCost = 0;
      this.openSet = [start];
      start.isOpen = true;

      return {
        next: function () {
          if (self.openSet.length === 0) return { done: true, value: { found: false } };

          var current = self.openSet.shift();
          current.isOpen = false;
          current.isVisited = true;
          self.state.stepCount++;
          self.state.visitedCount++;

          self.visitedSet.push(current);

          self.stepHistory.push({
            step: self.state.stepCount,
            coord: '[' + current.row + ',' + current.col + ']',
            change: 'EVALUATED',
            fcost: '-',
            queueSize: self.openSet.length,
          });

          if (current.isTarget) return { done: true, value: { found: true } };

          var neighbors = self.getNeighbors(current.row, current.col);
          for (var i = 0; i < neighbors.length; i++) {
            var n = neighbors[i];
            if (n.isWall || n.isVisited || n.isOpen) continue;
            n.parent = current;
            n.gCost = current.gCost + 1;
            n.isOpen = true;
            self.openSet.push(n);
          }

          return { done: false };
        },
      };
    },

    dfsGen: function (start, target) {
      var self = this;
      start.gCost = 0;
      this.openSet = [start];
      start.isOpen = true;

      return {
        next: function () {
          if (self.openSet.length === 0) return { done: true, value: { found: false } };

          var current = self.openSet.pop();
          current.isOpen = false;
          current.isVisited = true;
          self.state.stepCount++;
          self.state.visitedCount++;

          self.visitedSet.push(current);

          self.stepHistory.push({
            step: self.state.stepCount,
            coord: '[' + current.row + ',' + current.col + ']',
            change: 'EVALUATED',
            fcost: '-',
            queueSize: self.openSet.length,
          });

          if (current.isTarget) return { done: true, value: { found: true } };

          var neighbors = self.getNeighbors(current.row, current.col);
          for (var i = neighbors.length - 1; i >= 0; i--) {
            var n = neighbors[i];
            if (n.isWall || n.isVisited || n.isOpen) continue;
            n.parent = current;
            n.gCost = current.gCost + 1;
            n.isOpen = true;
            self.openSet.push(n);
          }

          return { done: false };
        },
      };
    },

    reconstructPath: function (target) {
      var path = [];
      var current = target;
      while (current) {
        path.unshift(current);
        current = current.parent;
      }

      this.state.pathLength = path.length;
      this.state.pathCost = target.gCost;

      for (var i = 0; i < path.length; i++) {
        var cell = path[i];
        if (!cell.isStart && !cell.isTarget) {
          cell.isPath = true;
          this.syncCellDOM(cell.row, cell.col);
        }
      }
    },

    togglePause: function () {
      if (!this.state.running) return;
      if (this.state.paused) {
        this.resumeAlgorithm();
      } else {
        this.state.paused = true;
        this.dom.btnPause.textContent = 'RESUME';
        this.setStatus('SEARCH ENGINE PAUSED at step ' + this.state.stepCount, 'awaiting');
      }
    },

    resumeAlgorithm: function () {
      this.state.paused = false;
      this.dom.btnPause.textContent = 'PAUSE';
      this.setStatus('ROOT SYSTEM DISCOVERING FRONTIER CORES...', 'running');
    },

    loadPreset: function (name) {
      this.resetGrid();

      switch (name) {
        case 'subdivision':
          this.generateSubdivisionMaze();
          break;
        case 'forest':
          this.generateDenseForest();
          break;
        case 'blocked':
          this.generateNoPathMaze();
          break;
      }

      this.renderGrid();
      this.setStatus('PRESET LOADED: ' + name + ' maze', 'awaiting');
    },

    generateSubdivisionMaze: function () {
      this.subdivide(0, 0, ROWS - 1, COLS - 1, true, 0);
      this.grid[this.state.start.row][this.state.start.col].isWall = false;
      this.grid[this.state.target.row][this.state.target.col].isWall = false;
    },

    subdivide: function (r1, c1, r2, c2, horiz, depth) {
      if (depth > 4) return;
      var dr = r2 - r1;
      var dc = c2 - c1;
      if (dr < 3 || dc < 3) return;

      if (horiz) {
        var splitRow = Math.floor((r1 + r2) / 2);
        var gap = Math.floor(Math.random() * (c2 - c1 + 1)) + c1;
        for (var c = c1; c <= c2; c++) {
          if (c !== gap) this.grid[splitRow][c].isWall = true;
        }
        this.subdivide(r1, c1, splitRow - 1, c2, false, depth + 1);
        this.subdivide(splitRow + 1, c1, r2, c2, false, depth + 1);
      } else {
        var splitCol = Math.floor((c1 + c2) / 2);
        var gap2 = Math.floor(Math.random() * (r2 - r1 + 1)) + r1;
        for (var r = r1; r <= r2; r++) {
          if (r !== gap2) this.grid[r][splitCol].isWall = true;
        }
        this.subdivide(r1, c1, r2, splitCol - 1, true, depth + 1);
        this.subdivide(r1, splitCol + 1, r2, c2, true, depth + 1);
      }
    },

    generateDenseForest: function () {
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var cell = this.grid[r][c];
          if (!cell.isStart && !cell.isTarget && Math.random() < 0.35) {
            cell.isWall = true;
          }
        }
      }
    },

    generateNoPathMaze: function () {
      for (var c = 0; c < COLS; c++) {
        this.grid[Math.floor(ROWS / 2)][c].isWall = true;
      }
      if (this.grid[ROWS / 2][this.state.start.col].isWall) {
        this.grid[Math.floor(ROWS / 2)][this.state.start.col].isWall = false;
      }
      this.grid[this.state.start.row][this.state.start.col].isWall = false;
      this.grid[this.state.target.row][this.state.target.col].isWall = false;
    },

    renderTelemetry: function () {
      var totalCells = ROWS * COLS;
      var wallCount = 0;
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (this.grid[r][c].isWall) wallCount++;
        }
      }
      var traversable = totalCells - wallCount;
      var volumePct = traversable > 0 ? (this.state.visitedCount / traversable * 100) : 0;
      this.dom.metricVolume.textContent = volumePct.toFixed(1) + '%';

      var efficiency = this.state.visitedCount > 0 ? (this.state.pathLength / this.state.visitedCount) : 0;
      this.dom.metricEfficiency.textContent = efficiency.toFixed(3);

      var velocity = this.state.stepCount > 0 ? (this.state.pathLength / this.state.stepCount) : 0;
      this.dom.metricVelocity.textContent = velocity.toFixed(3);
    },

    renderLog: function () {
      var tbody = this.dom.logBody;
      tbody.innerHTML = '';

      if (this.stepHistory.length === 0) {
        this.dom.logInfo.textContent = '0 entries';
        return;
      }

      var fragment = document.createDocumentFragment();
      var visible = this.stepHistory.slice(-100);

      for (var i = 0; i < visible.length; i++) {
        var h = visible[i];
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + h.step + '</td>' +
          '<td>' + h.coord + '</td>' +
          '<td>' + h.change + '</td>' +
          '<td>' + h.fcost + '</td>' +
          '<td>' + h.queueSize + '</td>';
        fragment.appendChild(tr);
      }

      tbody.appendChild(fragment);
      this.dom.logInfo.textContent = this.stepHistory.length + ' entries';

      var logContainer = tbody.closest('.log-container');
      if (logContainer) logContainer.scrollTop = logContainer.scrollHeight;
    },

    updateDiagnosticHeader: function () {
      this.dom.diagEngine.textContent = this.algoNames[this.state.algorithm] || 'Dijkstra';
      this.dom.diagEngine.style.color = this.algoColors[this.state.algorithm] || '#2e7d32';
      this.dom.diagSteps.textContent = this.state.stepCount;
      this.dom.diagFootprint.textContent = this.state.visitedCount;

      if (this.state.finished) {
        this.dom.diagPathCost.textContent = this.state.pathCost;
      } else if (this.state.blocked) {
        this.dom.diagPathCost.textContent = 'BLOCKED';
      } else {
        this.dom.diagPathCost.textContent = '-';
      }

      var statusEl = this.dom.diagStatus;
      if (this.state.finished) {
        statusEl.innerHTML = '<span class="status-dot done"></span> DONE';
      } else if (this.state.blocked) {
        statusEl.innerHTML = '<span class="status-dot blocked"></span> BLOCKED';
      } else if (this.state.running) {
        statusEl.innerHTML = '<span class="status-dot running"></span> RUNNING';
      } else {
        statusEl.innerHTML = '<span class="status-dot awaiting"></span> IDLE';
      }
    },

    setStatus: function (message, type) {
      var banner = this.dom.statusBanner;
      var dot = banner.querySelector('.status-dot');
      var text = banner.querySelector('.status-text');
      dot.className = 'status-dot ' + (type || 'awaiting');
      text.textContent = message;
    },

    initChart: function () {
      var ctx = this.dom.chartCanvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Visited Cells',
            data: [],
            borderColor: '#2e7d32',
            backgroundColor: 'rgba(46, 125, 50, 0.08)',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: '#2e7d32',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) { return 'Visited: ' + ctx.raw; },
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: 'Step', color: '#557a61', font: { size: 8, family: 'ui-monospace, monospace' } },
              ticks: { color: '#557a61', font: { size: 7, family: 'ui-monospace, monospace' }, maxTicksLimit: 10 },
              grid: { color: '#e2ebd9', drawBorder: false },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Cells', color: '#557a61', font: { size: 8, family: 'ui-monospace, monospace' } },
              ticks: { color: '#557a61', font: { size: 7, family: 'ui-monospace, monospace' } },
              grid: { color: '#e2ebd9', drawBorder: false },
            },
          },
          animation: { duration: 150 },
        },
      });
    },

    updateChart: function () {
      if (!this.chart) return;
      var labels = [];
      var data = [];

      for (var i = 0; i < this.stepHistory.length; i++) {
        labels.push(String(this.stepHistory[i].step));
        data.push(this.state.visitedCount);
      }

      this.chart.data.labels = labels;
      var visitedData = [];
      var cumulative = 0;
      for (var j = 0; j < this.stepHistory.length; j++) {
        cumulative++;
        visitedData.push(cumulative);
      }
      this.chart.data.datasets[0].data = visitedData;
      this.chart.update();
    },

    exportCSV: function () {
      var rows = [];
      rows.push('Row,Col,IsStart,IsTarget,IsWall,IsVisited,IsPath');

      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var cell = this.grid[r][c];
          rows.push(r + ',' + c + ',' + (cell.isStart ? 1 : 0) + ',' + (cell.isTarget ? 1 : 0) + ',' + (cell.isWall ? 1 : 0) + ',' + (cell.isVisited ? 1 : 0) + ',' + (cell.isPath ? 1 : 0));
        }
      }

      rows.push('');
      rows.push('Algorithm,Steps,Visited,PathLength,PathCost');
      rows.push(this.algoNames[this.state.algorithm] + ',' + this.state.stepCount + ',' + this.state.visitedCount + ',' + this.state.pathLength + ',' + this.state.pathCost);

      rows.push('');
      rows.push('Step,Coord,StateChange,FCost,QueueSize');
      for (var i = 0; i < this.stepHistory.length; i++) {
        var h = this.stepHistory[i];
        rows.push(h.step + ',' + h.coord + ',' + h.change + ',' + h.fcost + ',' + h.queueSize);
      }

      var csv = rows.join('\r\n');
      var date = new Date().toISOString().slice(0, 10);
      var filename = 'pathfinding_heuristic_logs_' + this.state.algorithm + '_' + date + '.csv';

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.setStatus('CSV EXPORTED: ' + filename, 'done');
    },
  };

  document.addEventListener('DOMContentLoaded', function () { App.init(); });

})();
