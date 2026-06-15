(function () {
  "use strict";

  var gridEl    = document.getElementById("gridContainer");
  var movesVal  = document.getElementById("movesVal");
  var timeVal   = document.getElementById("timeVal");
  var bestVal   = document.getElementById("bestVal");
  var shuffleBtn= document.getElementById("shuffleBtn");
  var modal     = document.getElementById("modal");
  var mbStats   = document.getElementById("mbStats");
  var playAgainBtn = document.getElementById("playAgainBtn");
  var dimBtns   = document.querySelectorAll(".dimBtn");

  var GAP_PX    = 4;
  var N         = 3;
  var tiles     = [];
  var emptyRow  = 0, emptyCol = 0;
  var moves     = 0;
  var seconds   = 0;
  var timerId   = null;
  var started   = false;
  var solving   = false;

  function bestKey() { return "spBest-" + N; }

  function loadBest() {
    var v = localStorage.getItem(bestKey());
    if (v) { var p = JSON.parse(v); bestVal.textContent = p.moves + "/" + p.time + "s"; }
    else { bestVal.textContent = "--"; }
  }

  function tileSize() {
    var rect = gridEl.getBoundingClientRect();
    return (Math.min(rect.width, rect.height) - (N - 1) * GAP_PX) / N;
  }

  /* ─── Init ─────────────────────────────────────────── */
  function initGrid(dim) {
    if (timerId) { clearInterval(timerId); timerId = null; }
    N = dim;
    started = false; solving = false;
    moves = 0; seconds = 0;
    movesVal.textContent = "0";
    timeVal.textContent  = "00:00";
    modal.classList.add("hidden");
    loadBest();

    var total = N * N;
    tiles = [];
    for (var i = 0; i < total; i++) tiles.push(i);
    emptyRow = N - 1; emptyCol = N - 1;
    render();
  }

  /* ─── Solvability ──────────────────────────────────── */
  function countInversions(arr) {
    var inv = 0;
    for (var i = 0; i < arr.length; i++)
      for (var j = i + 1; j < arr.length; j++)
        if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
    return inv;
  }

  function isSolvable(arr, n) {
    var inv = countInversions(arr);
    if (n % 2 === 1) return inv % 2 === 0;
    return (inv + (n - emptyRow)) % 2 === 0;
  }

  /* ─── Fisher-Yates shuffle, reject unsolvable ──────── */
  function shuffle() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    started = false; solving = false;
    moves = 0; seconds = 0;
    movesVal.textContent = "0";
    timeVal.textContent  = "00:00";
    modal.classList.add("hidden");

    var total = N * N - 1;
    var flat = [];
    for (var i = 1; i <= total; i++) flat.push(i);
    flat.push(0);

    do {
      for (var i = flat.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = flat[i]; flat[i] = flat[j]; flat[j] = tmp;
      }
      var bIdx = flat.indexOf(0);
      emptyRow = Math.floor(bIdx / N);
      emptyCol = bIdx % N;
    } while (!isSolvable(flat, N));

    tiles = flat;
    render();
  }

  /* ─── Render via absolute positioning ──────────────── */
  function render() {
    var ts = tileSize();
    if (ts <= 0) { requestAnimationFrame(render); return; }

    gridEl.innerHTML = "";

    for (var i = 0; i < tiles.length; i++) {
      var val = tiles[i];
      var el = document.createElement("div");
      el.className = "tile";
      if (val === 0) { el.classList.add("empty"); }
      else {
        var num = document.createElement("span");
        num.className = "tn";
        num.textContent = val;
        var hue = (val / (N * N)) * 260 + 170;
        num.style.color = "hsl(" + hue + ", 80%, 60%)";
        el.style.borderColor = "hsla(" + hue + ", 80%, 60%, 0.08)";
        el.appendChild(num);
      }

      /* Sizing */
      el.style.width  = ts + "px";
      el.style.height = ts + "px";

      /* Positioning */
      var row = Math.floor(i / N);
      var col = i % N;
      var x = col * (ts + GAP_PX);
      var y = row * (ts + GAP_PX);
      el.style.transform = "translate(" + x + "px, " + y + "px)";

      /* Font scaling */
      var fs = Math.max(10, ts * 0.45);
      el.style.fontSize = fs + "px";

      /* Click */
      if (val !== 0) {
        el.addEventListener("click", (function (idx) {
          return function () { tryMove(idx); };
        })(i));
      }

      gridEl.appendChild(el);
    }
  }

  /* ─── Move logic ───────────────────────────────────── */
  function tryMove(idx) {
    if (solving) return;
    var blankIdx = tiles.indexOf(0);
    var bRow = Math.floor(blankIdx / N);
    var bCol = blankIdx % N;
    var tRow = Math.floor(idx / N);
    var tCol = idx % N;

    if (Math.abs(tRow - bRow) + Math.abs(tCol - bCol) !== 1) return;

    if (!started) { started = true; timerId = setInterval(tick, 1000); }

    tiles[blankIdx] = tiles[idx];
    tiles[idx] = 0;
    emptyRow = tRow; emptyCol = tCol;
    moves++;
    movesVal.textContent = moves;

    render();
    checkVictory();
  }

  /* ─── Keyboard ─────────────────────────────────────── */
  document.addEventListener("keydown", function (e) {
    var key = e.key;
    var blankIdx = tiles.indexOf(0);
    var row = Math.floor(blankIdx / N);
    var col = blankIdx % N;
    var target = -1;

    switch (key) {
      case "ArrowUp":    case "w": case "W": target = (row + 1 < N)  ? (row + 1) * N + col : -1; break;
      case "ArrowDown":  case "s": case "S": target = (row - 1 >= 0) ? (row - 1) * N + col : -1; break;
      case "ArrowLeft":  case "a": case "A": target = (col + 1 < N)  ? row * N + (col + 1) : -1; break;
      case "ArrowRight": case "d": case "D": target = (col - 1 >= 0) ? row * N + (col - 1) : -1; break;
    }
    if (target >= 0) { e.preventDefault(); tryMove(target); }
  });

  /* ─── Timer ────────────────────────────────────────── */
  function tick() {
    seconds++;
    var m = String(Math.floor(seconds / 60)).padStart(2, "0");
    var s = String(seconds % 60).padStart(2, "0");
    timeVal.textContent = m + ":" + s;
  }

  /* ─── Victory ──────────────────────────────────────── */
  function checkVictory() {
    for (var i = 0; i < tiles.length - 1; i++)
      if (tiles[i] !== i + 1) return;
    if (tiles[tiles.length - 1] !== 0) return;

    solving = true;
    if (timerId) { clearInterval(timerId); timerId = null; }

    var key = bestKey();
    var prevBest = localStorage.getItem(key);
    var isNewBest = false;
    if (!prevBest) { localStorage.setItem(key, JSON.stringify({ moves: moves, time: seconds })); isNewBest = true; }
    else {
      var pb = JSON.parse(prevBest);
      if (moves < pb.moves || (moves === pb.moves && seconds < pb.time)) {
        localStorage.setItem(key, JSON.stringify({ moves: moves, time: seconds }));
        isNewBest = true;
      }
    }
    loadBest();

    var timeStr = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    mbStats.innerHTML =
      "Grid: " + N + "\u00D7" + N + "<br>" +
      "Moves: " + moves + "<br>" +
      "Time: " + timeStr + "<br>" +
      (isNewBest ? "<br><span style='color:#00ff88'>NEW RECORD!</span>" : "");

    modal.classList.remove("hidden");
  }

  /* ─── Events ───────────────────────────────────────── */
  function bindEvents() {
    shuffleBtn.addEventListener("click", shuffle);

    dimBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        dimBtns.forEach(function (x) { x.classList.remove("active"); });
        this.classList.add("active");
        initGrid(parseInt(this.getAttribute("data-dim"), 10));
        shuffle();
      });
    });

    playAgainBtn.addEventListener("click", shuffle);

    var resizeTO;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTO);
      resizeTO = setTimeout(render, 80);
    });
  }

  /* ─── Boot ─────────────────────────────────────────── */
  initGrid(3);
  shuffle();
  bindEvents();
})();
