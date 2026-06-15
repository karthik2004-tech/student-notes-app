(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var canvas     = document.getElementById("graphCanvas");
  var ctx        = canvas.getContext("2d");
  var addrInput  = document.getElementById("addrInput");
  var cacheGrid  = document.getElementById("cacheGrid");
  var algoSel    = document.getElementById("algoSel");
  var slotSlider = document.getElementById("slotSlider");
  var spdSlider  = document.getElementById("spdSlider");
  var lookVal    = document.getElementById("lookVal");
  var hitVal     = document.getElementById("hitVal");
  var missVal    = document.getElementById("missVal");
  var ratioVal   = document.getElementById("ratioVal");
  var evictVal   = document.getElementById("evictVal");
  var stepBtn    = document.getElementById("stepBtn");
  var runBtn     = document.getElementById("runBtn");
  var resetBtn   = document.getElementById("resetBtn");

  /* ─── Canvas sizing ────────────────────────────── */
  var W, H;
  function resizeGraph() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(r.width);
    H = Math.floor(r.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resizeGraph);

  /* ─── Cache state ─────────────────────────────── */
  var cache = [];
  var capacity = 6;
  var lookups = 0, hits = 0, misses = 0;
  var tick = 0;
  var lastEvicted = "--";

  /* ─── Graph history ──────────────────────────── */
  var ratioHistory = [];
  var MAX_POINTS = 80;

  /* ─── Address queue ──────────────────────────── */
  var addressQueue = [];
  var addrIdx = 0;
  var running = false;

  /* ─── Slider display ─────────────────────────── */
  slotSlider.addEventListener("input", function () {
    document.getElementById("slotVal").textContent = slotSlider.value;
    capacity = parseInt(slotSlider.value, 10);
    resetAll();
  });
  spdSlider.addEventListener("input", function () {
    document.getElementById("spdVal").textContent = spdSlider.value;
  });

  /* ─── Eviction algorithms ────────────────────── */
  function findEvictLRU() {
    var minT = Infinity, idx = -1;
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].lastAccess < minT) { minT = cache[i].lastAccess; idx = i; }
    }
    return idx;
  }

  function findEvictLFU() {
    var minF = Infinity, idx = -1, minT = Infinity;
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].freq < minF || (cache[i].freq === minF && cache[i].lastAccess < minT)) {
        minF = cache[i].freq;
        minT = cache[i].lastAccess;
        idx = i;
      }
    }
    return idx;
  }

  function findEvictFIFO() {
    var minO = Infinity, idx = -1;
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].insertOrder < minO) { minO = cache[i].insertOrder; idx = i; }
    }
    return idx;
  }

  /* ─── Process one address ─────────────────────── */
  function processAddress(addr) {
    if (addr === undefined || addr === null) return false;

    var algo = algoSel.value;
    var block = parseInt(addr, 10);
    if (isNaN(block)) return false;

    lookups++;
    lookVal.textContent = lookups;

    /* check hit */
    var hitIdx = -1;
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].blockAddr === block) { hitIdx = i; break; }
    }

    var slotEls = cacheGrid.querySelectorAll(".cacheSlot");
    /* clear any flash */
    slotEls.forEach(function (el) { el.className = "cacheSlot"; });

    if (hitIdx !== -1) {
      /* HIT */
      hits++;
      hitVal.textContent = hits;
      cache[hitIdx].freq++;
      cache[hitIdx].lastAccess = ++tick;

      if (slotEls[hitIdx]) {
        slotEls[hitIdx].className = "cacheSlot occupied hit";
      }
      lastEvicted = "--";
    } else {
      /* MISS */
      misses++;
      missVal.textContent = misses;

      var evictIdx = -1;

      if (cache.length >= capacity) {
        /* evict */
        switch (algo) {
          case "lru":  evictIdx = findEvictLRU(); break;
          case "lfu":  evictIdx = findEvictLFU(); break;
          case "fifo": evictIdx = findEvictFIFO(); break;
        }

        if (evictIdx !== -1) {
          lastEvicted = cache[evictIdx].blockAddr;
          evictVal.textContent = lastEvicted;

          /* flash evict */
          if (slotEls[evictIdx]) {
            slotEls[evictIdx].className = "cacheSlot occupied evict";
          }

          cache.splice(evictIdx, 1);
        }
      } else {
        lastEvicted = "--";
      }

      /* insert new block */
      cache.push({
        blockAddr: block,
        freq: 1,
        lastAccess: ++tick,
        insertOrder: tick,
      });
    }

    updateRatio();
    renderCache();
    renderGraph();
    return true;
  }

  /* ─── Update ratio telemetry ─────────────────── */
  function updateRatio() {
    var ratio = lookups > 0 ? ((hits / lookups) * 100).toFixed(1) : "0.0";
    ratioVal.textContent = ratio + "%";

    ratioHistory.push(parseFloat(ratio));
    if (ratioHistory.length > MAX_POINTS) ratioHistory.shift();
  }

  /* ─── Render cache grid ──────────────────────── */
  function renderCache() {
    var html = "";
    for (var i = 0; i < capacity; i++) {
      var slot = i < cache.length ? cache[i] : null;
      var cls = "cacheSlot";
      if (slot) {
        cls += " occupied";
        html += "<div class='" + cls + "' data-idx='" + i + "'>";
        html += "<span class='csAddr'>" + slot.blockAddr + "</span>";
        html += "<span class='csMeta'>f" + slot.freq + " t" + slot.lastAccess + "</span>";
      } else {
        cls += " empty";
        html += "<div class='" + cls + "'>";
        html += "<span class='csAddr'>_</span>";
        html += "<span class='csMeta'>empty</span>";
      }
      html += "</div>";
    }
    cacheGrid.innerHTML = html;
  }

  /* ─── Render graph ───────────────────────────── */
  function renderGraph() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);

    /* grid lines */
    ctx.strokeStyle = "rgba(0,240,255,0.03)";
    ctx.lineWidth = 0.5;
    for (var i = 0; i < 5; i++) {
      var y = (H / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    if (ratioHistory.length < 2) return;

    var len = ratioHistory.length;
    var maxVal = 100;

    /* fill area */
    ctx.fillStyle = "rgba(0,255,102,0.04)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (var i = 0; i < len; i++) {
      var x = (i / MAX_POINTS) * W;
      var y = H - (ratioHistory[i] / maxVal) * H;
      ctx.lineTo(x, y);
    }
    ctx.lineTo((len / MAX_POINTS) * W, H);
    ctx.closePath();
    ctx.fill();

    /* line */
    ctx.strokeStyle = "#00ff66";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var i = 0; i < len; i++) {
      var x = (i / MAX_POINTS) * W;
      var y = H - (ratioHistory[i] / maxVal) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /* ─── Parse address input ─────────────────────── */
  function parseAddresses() {
    var raw = addrInput.value;
    return raw.split(",").map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n); });
  }

  /* ─── Step one ────────────────────────────────── */
  function stepOne() {
    if (running) return;
    var addrs = parseAddresses();
    if (addrIdx >= addrs.length) { addrIdx = 0; return; }
    processAddress(addrs[addrIdx]);
    addrIdx++;
  }

  /* ─── Run all ─────────────────────────────────── */
  async function runAll() {
    if (running) return;
    running = true;
    runBtn.disabled = true; stepBtn.disabled = true;

    var addrs = parseAddresses();
    addrIdx = 0;

    while (addrIdx < addrs.length) {
      stepOne();
      var ms = Math.max(50, 300 - parseInt(spdSlider.value, 10) * 12);
      await new Promise(function (r) { setTimeout(r, ms); });
    }

    running = false;
    runBtn.disabled = false; stepBtn.disabled = false;
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetAll() {
    cache = [];
    lookups = 0; hits = 0; misses = 0; tick = 0;
    addrIdx = 0; lastEvicted = "--";
    ratioHistory = [];
    lookVal.textContent = "0";
    hitVal.textContent = "0";
    missVal.textContent = "0";
    ratioVal.textContent = "0%";
    evictVal.textContent = "—";
    renderCache();
    renderGraph();
    running = false;
    runBtn.disabled = false; stepBtn.disabled = false;
  }

  /* ─── Events ──────────────────────────────────── */
  stepBtn.addEventListener("click", stepOne);
  runBtn.addEventListener("click", runAll);
  resetBtn.addEventListener("click", resetAll);

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resizeGraph();
    capacity = parseInt(slotSlider.value, 10);
    renderCache();
    renderGraph();
  }

  init();
})();
