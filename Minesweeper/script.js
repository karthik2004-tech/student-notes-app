(function () {
  "use strict";

  var gridEl   = document.getElementById("gridContainer");
  var minesVal = document.getElementById("minesVal");
  var timeVal  = document.getElementById("timeVal");
  var faceBtn  = document.getElementById("faceBtn");
  var diffSel  = document.getElementById("diffSel");
  var bestVal  = document.getElementById("bestVal");
  var modal    = document.getElementById("modal");
  var modalTitle = document.getElementById("modalTitle");
  var modalStats = document.getElementById("modalStats");
  var playAgainBtn = document.getElementById("playAgainBtn");

  var DIFFS = [
    { rows: 9,  cols: 9,  mines: 10 },
    { rows: 16, cols: 16, mines: 40 },
    { rows: 16, cols: 30, mines: 99 },
  ];

  var diffIdx = 0;
  var rows, cols, totalMines;
  var grid = [];
  var flagsPlaced = 0;
  var revealedCount = 0;
  var firstClick = true;
  var gameOver = false;
  var seconds = 0;
  var timerId = null;

  /* ─── localStorage ────────────────────────────── */
  function bestKey() { return "msBest-" + diffIdx; }

  function loadBest() {
    var v = localStorage.getItem(bestKey());
    bestVal.textContent = v ? v + "s" : "--";
  }

  function saveBest() {
    var key = bestKey();
    var prev = localStorage.getItem(key);
    if (!prev || seconds < parseInt(prev, 10)) {
      localStorage.setItem(key, seconds);
      loadBest();
    }
  }

  /* ─── Board ops ───────────────────────────────── */
  function initBoard(dimIdx) {
    if (timerId) { clearInterval(timerId); timerId = null; }
    diffIdx = dimIdx;
    var d = DIFFS[diffIdx];
    rows = d.rows; cols = d.cols; totalMines = d.mines;
    gameOver = false; firstClick = true;
    seconds = 0; flagsPlaced = 0; revealedCount = 0;
    minesVal.textContent = totalMines;
    timeVal.textContent = "000";
    faceBtn.innerHTML = "\uD83D\uDE42";
    modal.classList.add("hidden");
    loadBest();

    grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) {
        grid[r][c] = { mine: false, revealed: false, flagged: false, neighborCount: 0 };
      }
    }

    renderGrid();
  }

  /* ─── Mine planting (post first-click) ────────── */
  function plantMines(safeR, safeC) {
    var safeSet = {};
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var sr = safeR + dr, sc = safeC + dc;
        if (sr >= 0 && sr < rows && sc >= 0 && sc < cols) {
          safeSet[sr + "," + sc] = true;
        }
      }
    }

    var placed = 0;
    while (placed < totalMines) {
      var r = Math.floor(Math.random() * rows);
      var c = Math.floor(Math.random() * cols);
      if (grid[r][c].mine || safeSet[r + "," + c]) continue;
      grid[r][c].mine = true;
      placed++;
    }

    /* Count neighbors */
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        if (grid[r2][c2].mine) continue;
        var count = 0;
        for (var dr2 = -1; dr2 <= 1; dr2++) {
          for (var dc2 = -1; dc2 <= 1; dc2++) {
            var nr = r2 + dr2, nc = c2 + dc2;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) count++;
          }
        }
        grid[r2][c2].neighborCount = count;
      }
    }
  }

  /* ─── Flood fill ──────────────────────────────── */
  function floodFill(r, c) {
    var cell = grid[r][c];
    if (cell.revealed || cell.flagged || cell.mine) return;

    cell.revealed = true;
    revealedCount++;

    if (cell.neighborCount === 0) {
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          var nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            floodFill(nr, nc);
          }
        }
      }
    }
  }

  /* ─── Reveal cell ─────────────────────────────── */
  function revealCell(r, c) {
    if (gameOver) return;
    var cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    /* First click safety */
    if (firstClick) {
      firstClick = false;
      plantMines(r, c);
      startTimer();
    }

    if (cell.mine) {
      cell.revealed = true;
      gameLost(r, c);
      return;
    }

    floodFill(r, c);
    renderGrid();
    checkWin();
  }

  /* ─── Flag toggle ─────────────────────────────── */
  function toggleFlag(r, c) {
    if (gameOver) return;
    var cell = grid[r][c];
    if (cell.revealed) return;

    if (firstClick) {
      firstClick = false;
      plantMines(r, c);
      startTimer();
    }

    cell.flagged = !cell.flagged;
    flagsPlaced += cell.flagged ? 1 : -1;
    minesVal.textContent = totalMines - flagsPlaced;
    renderGrid();
  }

  /* ─── Game lost ───────────────────────────────── */
  function gameLost(trippedR, trippedC) {
    gameOver = true;
    if (timerId) { clearInterval(timerId); timerId = null; }
    faceBtn.innerHTML = "\uD83D\uDE35";

    /* Reveal all */
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = grid[r][c];
        if (cell.mine) cell.revealed = true;
      }
    }

    renderGrid(trippedR, trippedC);
    modalTitle.textContent = "\uD83D\uDCA5";
    modalStats.innerHTML = "BOOM! You hit a mine.";
    modal.classList.remove("hidden");
  }

  /* ─── Check win ───────────────────────────────── */
  function checkWin() {
    var totalSafe = rows * cols - totalMines;
    if (revealedCount === totalSafe) {
      gameOver = true;
      if (timerId) { clearInterval(timerId); timerId = null; }
      faceBtn.innerHTML = "\uD83D\uDE0E";
      saveBest();
      modalTitle.textContent = "\uD83C\uDF89";
      modalStats.innerHTML = "All mines cleared!<br>Time: " + seconds + "s";
      modal.classList.remove("hidden");
    }
  }

  /* ─── Render ──────────────────────────────────── */
  function renderGrid(trippedR, trippedC) {
    gridEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    gridEl.innerHTML = "";

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = grid[r][c];
        var el = document.createElement("div");
        el.className = "cell";
        el.dataset.r = r;
        el.dataset.c = c;

        if (cell.revealed) {
          el.classList.add("revealed");
          if (cell.mine) {
            el.classList.add("mine");
            if (r === trippedR && c === trippedC) {
              el.classList.add("mineTripped");
            }
            el.textContent = "\uD83D\uDCA3";
          } else if (cell.neighborCount > 0) {
            el.classList.add("n" + cell.neighborCount);
            el.textContent = cell.neighborCount;
          }
          /* Wrong flag marker */
          if (cell.flagged && !cell.mine && gameOver) {
            el.classList.add("wrongFlag");
            el.textContent = "\u2718";
          }
        } else if (cell.flagged) {
          el.classList.add("flagged");
          el.textContent = "\u2691";
        }

        /* Click */
        el.addEventListener("click", (function (rr, cc) {
          return function () { revealCell(rr, cc); };
        })(r, c));

        /* Right-click */
        el.addEventListener("contextmenu", (function (rr, cc) {
          return function (e) { e.preventDefault(); toggleFlag(rr, cc); };
        })(r, c));

        gridEl.appendChild(el);
      }
    }
  }

  /* ─── Timer ───────────────────────────────────── */
  function startTimer() {
    seconds = 0;
    timeVal.textContent = "000";
    if (timerId) clearInterval(timerId);
    timerId = setInterval(function () {
      seconds++;
      if (seconds > 999) seconds = 999;
      timeVal.textContent = String(seconds).padStart(3, "0");
    }, 1000);
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetGame() {
    initBoard(diffIdx);
    renderGrid();
  }

  /* ─── Events ──────────────────────────────────── */
  function bindEvents() {
    faceBtn.addEventListener("click", resetGame);
    playAgainBtn.addEventListener("click", resetGame);

    diffSel.addEventListener("change", function () {
      diffIdx = parseInt(this.value, 10);
      resetGame();
    });
  }

  /* ─── Boot ────────────────────────────────────── */
  bindEvents();
  initBoard(0);
})();
