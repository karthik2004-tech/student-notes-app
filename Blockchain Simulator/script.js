(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var diffSlider = document.getElementById("diffSlider");
  var chainTrack = document.getElementById("chainTrack");
  var inspBody   = document.getElementById("inspBody");
  var intVal     = document.getElementById("intVal");
  var blockVal   = document.getElementById("blockVal");
  var rateVal    = document.getElementById("rateVal");
  var addBtn     = document.getElementById("addBtn");
  var auditBtn   = document.getElementById("auditBtn");
  var resetBtn   = document.getElementById("resetBtn");

  /* ─── SHA-256 helper ──────────────────────────── */
  async function sha256(str) {
    var buf = new TextEncoder().encode(str);
    var ab  = await crypto.subtle.digest("SHA-256", buf);
    var hex = "";
    var bytes = new Uint8Array(ab);
    for (var i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }

  /* ─── Chain state ─────────────────────────────── */
  var chain = [];
  var mining = false;
  var hashCount = 0;
  var hashTimer = 0;

  /* ─── Genesis ─────────────────────────────────── */
  var genesis = {
    index: 0,
    timestamp: Date.now(),
    data: "Genesis Block",
    nonce: 0,
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash: "",
  };

  /* ─── Init chain ──────────────────────────────── */
  async function initChain() {
    chain = [];
    mining = false;
    hashCount = 0;
    genesis.hash = await sha256(
      genesis.index + genesis.timestamp + genesis.data + genesis.nonce + genesis.previousHash
    );
    chain.push(Object.assign({}, genesis));
    renderChain();
    updateTelemetry();
    validateChain();
  }

  /* ─── Create block ────────────────────────────── */
  function createBlock(data) {
    var prev = chain[chain.length - 1];
    return {
      index: chain.length,
      timestamp: Date.now(),
      data: data || "Block #" + chain.length,
      nonce: 0,
      previousHash: prev.hash,
      hash: "",
    };
  }

  /* ─── Mining ──────────────────────────────────── */
  async function mineBlock(block, blockEl, mineBtnEl) {
    if (mining) return;
    mining = true;
    mineBtnEl.disabled = true;
    blockEl.classList.add("mining");
    hashCount = 0;
    hashTimer = Date.now();

    var difficulty = parseInt(diffSlider.value, 10);
    var prefix = "0".repeat(difficulty);
    var hash = "";

    /* batch mining: yield every 200 hashes to stay responsive */
    while (true) {
      var batchSize = 200;
      for (var i = 0; i < batchSize; i++) {
        var str = block.index + block.timestamp + block.data + block.nonce + block.previousHash;
        hash = await sha256(str);
        hashCount++;
        if (hash.startsWith(prefix)) break;
        block.nonce++;
      }
      if (hash.startsWith(prefix)) break;
      /* yield to UI */
      await new Promise(function (r) { setTimeout(r, 0); });
    }

    block.hash = hash;
    blockEl.classList.remove("mining");
    mineBtnEl.disabled = false;
    mining = false;

    /* update block display */
    updateBlockCard(block, blockEl);
    validateChain();
    updateTelemetry();
  }

  /* ─── Add block ───────────────────────────────── */
  async function addBlock() {
    if (mining) return;
    var block = createBlock("");
    chain.push(block);
    renderChain();
    /* auto-scroll to new block */
    chainTrack.scrollLeft = chainTrack.scrollWidth;
    updateTelemetry();

    /* auto-mine */
    var cards = chainTrack.querySelectorAll(".blockCard");
    var lastCard = cards[cards.length - 1];
    var mineBtn = lastCard.querySelector(".mineBtn");
    await mineBlock(block, lastCard, mineBtn);
  }

  /* ─── Render chain ───────────────────────────── */
  function renderChain() {
    var html = "";
    chain.forEach(function (block, i) {
      var isGenesis = i === 0;
      var hashDisplay = block.hash || "—";
      html += "<div class='blockCard" + (isGenesis ? " genesis" : "") + "' data-idx='" + i + "'>";
      html += "<div class='bcIdx'>" + (isGenesis ? "GENESIS" : "BLOCK #" + i) + "</div>";
      html += "<textarea class='bcData' " + (isGenesis ? "disabled" : "") + ">" + escHtml(block.data) + "</textarea>";
      html += "<div class='bcNonce'>nonce: " + block.nonce + "</div>";
      html += "<div class='bcPrev'>prev: " + trunc(block.previousHash, 20) + "</div>";
      html += "<div class='bcHash'>hash: " + trunc(hashDisplay, 20) + "</div>";
      if (!isGenesis) {
        html += "<button class='mineBtn'>MINE</button>";
      } else {
        html += "<div style='height:clamp(18px,2.2vmin,28px)'></div>";
      }
      html += "</div>";
    });
    chainTrack.innerHTML = html;

    /* bind events */
    chainTrack.querySelectorAll(".blockCard").forEach(function (card, idx) {
      /* mine button */
      var mineBtn = card.querySelector(".mineBtn");
      if (mineBtn) {
        mineBtn.addEventListener("click", function () {
          mineBlock(chain[idx], card, mineBtn);
        });
      }

      /* data textarea change */
      var dataArea = card.querySelector(".bcData");
      if (dataArea) {
        dataArea.addEventListener("input", function () {
          if (idx === 0) return;
          chain[idx].data = dataArea.value;
          chain[idx].hash = "";
          chain[idx].nonce = 0;
          /* update nonce display */
          card.querySelector(".bcNonce").textContent = "nonce: 0";
          card.querySelector(".bcHash").textContent = "hash: —";
          validateChain();
          updateTelemetry();
        });
      }

      /* click to inspect */
      card.addEventListener("click", function (e) {
        if (e.target.tagName === "BUTTON" || e.target.tagName === "TEXTAREA") return;
        inspectBlock(idx);
      });
    });
  }

  /* ─── Update individual block card ────────────── */
  function updateBlockCard(block, el) {
    el.querySelector(".bcNonce").textContent = "nonce: " + block.nonce;
    el.querySelector(".bcHash").textContent = "hash: " + trunc(block.hash, 20);
    el.querySelector(".bcData").value = block.data;
  }

  /* ─── Chain validation ───────────────────────── */
  function validateChain() {
    var valid = true;
    for (var i = 1; i < chain.length; i++) {
      var block = chain[i];
      var prev = chain[i - 1];
      var computedHash = block.hash;
      if (!computedHash) { valid = false; }
      if (block.previousHash !== prev.hash) { valid = false; }

      /* mark cards */
      var cards = chainTrack.querySelectorAll(".blockCard");
      if (cards[i]) {
        if (!valid) cards[i].classList.add("invalid");
        else cards[i].classList.remove("invalid");
      }
    }

    intVal.textContent = valid ? "OK" : "CORRUPT";
    intVal.className = "tv " + (valid ? "ok" : "err");
    return valid;
  }

  /* ─── Audit ───────────────────────────────────── */
  async function audit() {
    /* re-validate all hashes */
    for (var i = 1; i < chain.length; i++) {
      var block = chain[i];
      var str = block.index + block.timestamp + block.data + block.nonce + block.previousHash;
      var hash = await sha256(str);
      block.hash = hash;
    }
    renderChain();
    validateChain();
  }

  /* ─── Inspect ─────────────────────────────────── */
  function inspectBlock(idx) {
    var block = chain[idx];
    if (!block) return;
    var html =
      "<span style='color:#00f0ff'>Index</span><span style='color:#64748b'>" + block.index + "</span>" +
      "<span style='color:#00f0ff'>Timestamp</span><span style='color:#64748b'>" + new Date(block.timestamp).toLocaleTimeString() + "</span>" +
      "<span style='color:#00f0ff'>Data</span><span style='color:#64748b'>" + escHtml(block.data) + "</span>" +
      "<span style='color:#00f0ff'>Nonce</span><span style='color:#ffd700'>" + block.nonce + "</span>" +
      "<span style='color:#00f0ff'>Previous Hash</span><span style='color:#475569'>" + block.previousHash + "</span>" +
      "<span style='color:#00f0ff'>Current Hash</span><span style='color:#00ff66'>" + (block.hash || "—") + "</span>";
    inspBody.innerHTML = html;
  }

  /* ─── Telemetry ──────────────────────────────── */
  function updateTelemetry() {
    blockVal.textContent = chain.length;
    var elapsed = (Date.now() - hashTimer) / 1000;
    if (hashCount > 0 && elapsed > 0) {
      rateVal.textContent = Math.round(hashCount / elapsed) + " h/s";
    }
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetChain() {
    mining = false;
    initChain();
  }

  /* ─── Utilities ──────────────────────────────── */
  function escHtml(s) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function trunc(s, n) {
    return s && s.length > n ? s.slice(0, n) + "…" : s || "—";
  }

  /* ─── Slider display ─────────────────────────── */
  diffSlider.addEventListener("input", function () {
    document.getElementById("diffVal").textContent = diffSlider.value;
  });

  /* ─── Events ──────────────────────────────────── */
  addBtn.addEventListener("click", addBlock);
  auditBtn.addEventListener("click", audit);
  resetBtn.addEventListener("click", resetChain);

  /* ─── Init ────────────────────────────────────── */
  function init() {
    initChain();
  }

  init();
})();
