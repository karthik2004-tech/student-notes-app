(function () {
  "use strict";

  var canvas    = document.getElementById("sortCanvas");
  var ctx       = canvas.getContext("2d");
  var compVal   = document.getElementById("compVal");
  var swapVal   = document.getElementById("swapVal");
  var timeVal   = document.getElementById("timeVal");
  var genBtn    = document.getElementById("genBtn");
  var sortBtn   = document.getElementById("sortBtn");
  var stopBtn   = document.getElementById("stopBtn");
  var algoSel   = document.getElementById("algoSel");
  var sizeSlider= document.getElementById("sizeSlider");
  var spdSlider = document.getElementById("spdSlider");
  var waveSel   = document.getElementById("waveSel");

  /* ─── State ──────────────────────────────────── */
  var W, H;
  var arr = [];
  var comparisons = 0, swaps = 0;
  var startTime = 0;
  var abort = false;
  var sorting = false;

  /* Audio */
  var audioCtx = null;

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    draw();
  }
  window.addEventListener("resize", resize);

  /* ─── Audio ───────────────────────────────────── */
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playTone(value, maxVal) {
    try {
      initAudio();
      var freq = 200 + (value / maxVal) * 800;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = waveSel.value;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) { /* silently fail */ }
  }

  /* ─── Array ───────────────────────────────────── */
  function generateArray() {
    var n = parseInt(sizeSlider.value, 10);
    document.getElementById("sizeVal").textContent = n;
    arr = [];
    for (var i = 0; i < n; i++) {
      arr.push({ val: Math.floor(Math.random() * (H - 20)) + 5, state: "default" });
    }
    comparisons = 0; swaps = 0;
    compVal.textContent = "0";
    swapVal.textContent = "0";
    timeVal.textContent = "0.00s";
    startTime = 0;
    draw();
  }

  /* ─── Delay ───────────────────────────────────── */
  function delay() {
    var spd = parseInt(spdSlider.value, 10);
    var ms = Math.max(1, 100 - spd);
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);

    if (arr.length === 0) return;
    var barW = W / arr.length;
    var maxVal = H - 20;

    for (var i = 0; i < arr.length; i++) {
      var a = arr[i];
      var x = i * barW;
      var h = (a.val / maxVal) * (H - 20);

      switch (a.state) {
        case "scan":   ctx.fillStyle = "#ff2a5f"; break;
        case "compare":ctx.fillStyle = "#00f0ff"; break;
        case "sorted": ctx.fillStyle = "#00ff66"; break;
        default:       ctx.fillStyle = "#6a5acd"; break;
      }

      ctx.fillRect(x + 1, H - 10 - h, barW - 2, h);

      /* Reset state after drawing */
      if (a.state !== "sorted") a.state = "default";
    }
  }

  /* ─── Sorting algorithms ──────────────────────── */

  async function bubbleSort() {
    var n = arr.length;
    for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < n - i - 1; j++) {
        if (abort) return;
        comparisons++;
        compVal.textContent = comparisons;
        arr[j].state = "compare";
        arr[j + 1].state = "scan";
        playTone(arr[j].val, H - 20);
        draw();
        await delay();

        if (arr[j].val > arr[j + 1].val) {
          var tmp = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = tmp;
          swaps++;
          swapVal.textContent = swaps;
        }
      }
      arr[n - i - 1].state = "sorted";
      draw();
    }
    arr[0].state = "sorted";
    draw();
  }

  async function insertionSort() {
    var n = arr.length;
    for (var i = 1; i < n; i++) {
      var key = arr[i];
      var j = i - 1;
      arr[i].state = "scan";
      draw();

      while (j >= 0) {
        if (abort) return;
        comparisons++;
        compVal.textContent = comparisons;
        arr[j].state = "compare";
        playTone(arr[j].val, H - 20);
        draw();
        await delay();

        if (arr[j].val > key.val) {
          arr[j + 1] = arr[j];
          swaps++;
          swapVal.textContent = swaps;
          j--;
        } else break;
      }
      arr[j + 1] = key;
    }
    for (var k = 0; k < n; k++) arr[k].state = "sorted";
    draw();
  }

  async function quickSort() {
    await qsRec(0, arr.length - 1);
    for (var i = 0; i < arr.length; i++) arr[i].state = "sorted";
    draw();
  }

  async function qsRec(lo, hi) {
    if (lo >= hi || abort) return;
    var p = await partition(lo, hi);
    await qsRec(lo, p - 1);
    await qsRec(p + 1, hi);
  }

  async function partition(lo, hi) {
    var pivot = arr[hi];
    var i = lo - 1;
    for (var j = lo; j < hi; j++) {
      if (abort) return i + 1;
      comparisons++;
      compVal.textContent = comparisons;
      arr[j].state = "compare";
      arr[hi].state = "scan";
      playTone(arr[j].val, H - 20);
      draw();
      await delay();

      if (arr[j].val < pivot.val) {
        i++;
        var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        swaps++;
        swapVal.textContent = swaps;
      }
    }
    var tmp2 = arr[i + 1]; arr[i + 1] = arr[hi]; arr[hi] = tmp2;
    swaps++;
    swapVal.textContent = swaps;
    arr[i + 1].state = "sorted";
    return i + 1;
  }

  async function selectionSort() {
    var n = arr.length;
    for (var i = 0; i < n - 1; i++) {
      var minIdx = i;
      for (var j = i + 1; j < n; j++) {
        if (abort) return;
        comparisons++;
        compVal.textContent = comparisons;
        arr[j].state = "compare";
        arr[minIdx].state = "scan";
        playTone(arr[j].val, H - 20);
        draw();
        await delay();

        if (arr[j].val < arr[minIdx].val) {
          minIdx = j;
        }
      }
      if (minIdx !== i) {
        var tmp = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = tmp;
        swaps++;
        swapVal.textContent = swaps;
      }
      arr[i].state = "sorted";
      draw();
    }
    arr[n - 1].state = "sorted";
    draw();
  }

  /* ─── Sort orchestrator ──────────────────────── */
  async function orchestrate() {
    if (sorting) return;
    sorting = true; abort = false;
    sortBtn.disabled = true; genBtn.disabled = true;

    /* Reset state */
    for (var i = 0; i < arr.length; i++) arr[i].state = "default";
    comparisons = 0; swaps = 0;
    compVal.textContent = "0";
    swapVal.textContent = "0";
    startTime = Date.now();

    /* Complexity label */
    var algo = algoSel.value;
    var labels = { bubble: "O(n\u00B2)", insertion: "O(n\u00B2)", quick: "O(n log n)", selection: "O(n\u00B2)" };
    document.getElementById("compLabel").textContent = labels[algo] || "O(n log n)";

    var algos = {
      bubble: bubbleSort,
      insertion: insertionSort,
      quick: quickSort,
      selection: selectionSort,
    };
    await algos[algo]();

    /* Timer */
    if (!abort) {
      var elapsed = (Date.now() - startTime) / 1000;
      timeVal.textContent = elapsed.toFixed(2) + "s";
    }

    sorting = false;
    sortBtn.disabled = false; genBtn.disabled = false;
  }

  /* ─── Stop / Reset ───────────────────────────── */
  function stopReset() {
    abort = true;
    sorting = false;
    sortBtn.disabled = false; genBtn.disabled = false;
    generateArray();
  }

  /* ─── Events ──────────────────────────────────── */
  function bindEvents() {
    genBtn.addEventListener("click", function () {
      if (sorting) { abort = true; sorting = false; }
      generateArray();
    });
    sortBtn.addEventListener("click", orchestrate);
    stopBtn.addEventListener("click", stopReset);

    sizeSlider.addEventListener("input", function () {
      document.getElementById("sizeVal").textContent = sizeSlider.value;
      if (!sorting) generateArray();
    });
    spdSlider.addEventListener("input", function () {
      document.getElementById("spdVal").textContent = spdSlider.value;
    });

    /* Complexity label on algo change */
    algoSel.addEventListener("change", function () {
      var labels = { bubble: "O(n\u00B2)", insertion: "O(n\u00B2)", quick: "O(n log n)", selection: "O(n\u00B2)" };
      document.getElementById("compLabel").textContent = labels[algoSel.value] || "O(n log n)";
    });
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    bindEvents();
    resize();
    generateArray();
  }

  init();
})();
