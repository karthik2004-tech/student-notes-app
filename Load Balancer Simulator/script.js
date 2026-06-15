(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var canvas    = document.getElementById("lbCanvas");
  var ctx       = canvas.getContext("2d");
  var algoSel   = document.getElementById("algoSel");
  var rateSlider= document.getElementById("rateSlider");
  var inVal     = document.getElementById("inVal");
  var dropVal   = document.getElementById("dropVal");
  var peakVal   = document.getElementById("peakVal");
  var effVal    = document.getElementById("effVal");
  var spikeBtn  = document.getElementById("spikeBtn");
  var healAllBtn= document.getElementById("healAllBtn");
  var flushBtn  = document.getElementById("flushBtn");

  /* ─── Canvas sizing ────────────────────────────── */
  var W, H;
  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(r.width);
    H = Math.floor(r.height);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── Servers ──────────────────────────────────── */
  var servers = [
    { id:0, name:"SERVER A", weight:3, activeConn:0, health:"HEALTHY", delay:0, baseDelay:0, busyUntil:0 },
    { id:1, name:"SERVER B", weight:2, activeConn:0, health:"HEALTHY", delay:0, baseDelay:0, busyUntil:0 },
    { id:2, name:"SERVER C", weight:4, activeConn:0, health:"HEALTHY", delay:0, baseDelay:0, busyUntil:0 },
    { id:3, name:"SERVER D", weight:1, activeConn:0, health:"HEALTHY", delay:0, baseDelay:0, busyUntil:0 },
  ];

  /* ─── Routing state ──────────────────────────── */
  var rrIndex = 0;
  var totalRequests = 0;
  var totalDrops = 0;
  var peakLoad = 0;
  var packets = [];
  var tickAccum = 0;

  /* ─── Node positions ─────────────────────────── */
  var genX, lbX, svX;

  function getNodePos() {
    genX = W * 0.1;
    lbX  = W * 0.45;
    svX  = W * 0.78;
  }

  function svY(idx) {
    var spacing = H / (servers.length + 1);
    return spacing * (idx + 1);
  }

  /* ─── Routing algorithms ─────────────────────── */
  function pickServer(algo) {
    var healthy = servers.filter(function (s) { return s.health !== "CRASHED"; });
    if (healthy.length === 0) return null;

    if (algo === "roundrobin") {
      var hIdx = rrIndex % healthy.length;
      rrIndex++;
      return healthy[hIdx];
    }

    if (algo === "leastconn") {
      var min = healthy[0];
      for (var i = 1; i < healthy.length; i++) {
        if (healthy[i].activeConn < min.activeConn) min = healthy[i];
      }
      return min;
    }

    if (algo === "weighted") {
      var pool = [];
      for (var i = 0; i < healthy.length; i++) {
        for (var w = 0; w < healthy[i].weight; w++) {
          pool.push(healthy[i]);
        }
      }
      return pool[Math.floor(Math.random() * pool.length)];
    }

    return healthy[0];
  }

  /* ─── Spawn request packet ───────────────────── */
  function spawnRequest() {
    var algo = algoSel.value;
    var server = pickServer(algo);
    totalRequests++;

    if (!server) {
      /* all crashed — drop */
      totalDrops++;
      packets.push({
        x: genX, y: H / 2, tx: lbX, ty: H / 2,
        phase: 0, progress: 0, server: null,
        color: "#ff2a5f", size: 3, active: true, dropped: true,
        speed: 0.025,
      });
      return;
    }

    var sidx = server.id;
    var sy = svY(sidx);
    server.activeConn++;
    updateTelemetry();
    var now = performance.now();

    /* determine processing delay */
    var delay = 500 + Math.random() * 500;
    if (server.health === "DEGRADED") delay += 800;
    delay += server.baseDelay;

    packets.push({
      x: genX, y: H / 2,
      tx: lbX, ty: H / 2,
      phase: 0, progress: 0,
      server: server,
      svX: svX, svY: sy,
      sidx: sidx,
      color: "#00f0ff", size: 3, active: true, dropped: false,
      speed: 0.03,
      startTime: now,
      delay: delay,
      connDone: false,
    });
  }

  /* ─── Update packets ─────────────────────────── */
  function updatePackets() {
    var now = performance.now();
    packets.forEach(function (pkt) {
      if (!pkt.active) return;

      if (pkt.phase === 0) {
        /* generator → LB */
        pkt.progress += pkt.speed;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
          pkt.phase = 1;
          pkt.x = pkt.tx;
          pkt.y = pkt.ty;
          if (pkt.dropped) {
            /* fly off screen */
            pkt.tx = W + 30;
            pkt.ty = Math.random() * H;
            pkt.speed = 0.04;
          } else {
            pkt.tx = pkt.svX;
            pkt.ty = pkt.svY;
            pkt.color = "#00ff66";
          }
        } else {
          pkt.x = genX + (pkt.tx - genX) * pkt.progress;
          pkt.y = H/2 + (pkt.ty - H/2) * pkt.progress;
        }
      } else if (pkt.phase === 1) {
        if (pkt.dropped) {
          pkt.progress += pkt.speed;
          pkt.x = lbX + (pkt.tx - lbX) * pkt.progress;
          pkt.y = H/2 + (pkt.ty - H/2) * pkt.progress;
          if (pkt.progress >= 1) pkt.active = false;
          return;
        }
        if (!pkt.connDone) {
          if (pkt.server) pkt.server.activeConn++;
          pkt.connDone = true;
          pkt.startTime = now;
        }
        /* wait for processing delay */
        if (now - pkt.startTime >= pkt.delay) {
          pkt.phase = 2;
          pkt.tx = genX;
          pkt.ty = H / 2;
          pkt.progress = 0;
          pkt.color = "#00f0ff";
          if (pkt.server) pkt.server.activeConn--;
        } else {
          /* pulse at server */
          pkt.x = pkt.svX;
          pkt.y = pkt.svY;
        }
      } else if (pkt.phase === 2) {
        /* server → generator */
        pkt.progress += 0.025;
        pkt.x = pkt.svX + (pkt.tx - pkt.svX) * pkt.progress;
        pkt.y = pkt.svY + (pkt.ty - pkt.svY) * pkt.progress;
        if (pkt.progress >= 1) pkt.active = false;
      }
    });

    /* remove dead packets */
    packets = packets.filter(function (p) { return p.active; });
  }

  /* ─── Render canvas ──────────────────────────── */
  function render() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);
    getNodePos();

    /* connection lines */
    ctx.strokeStyle = "rgba(0,240,255,0.03)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(genX, H/2);
    ctx.lineTo(lbX, H/2);
    for (var i = 0; i < servers.length; i++) {
      var sy = svY(i);
      ctx.moveTo(lbX, H/2);
      ctx.lineTo(svX, sy);
    }
    ctx.stroke();

    /* nodes */
    function drawNode(x, y, label, color, glow) {
      ctx.shadowBlur = glow ? 12 : 0;
      ctx.shadowColor = color || "#00f0ff";
      ctx.fillStyle = "rgba(0,240,255,0.04)";
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#475569";
      ctx.font = "clamp(5px,0.55vmin,8px) Consolas,monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 24);
    }

    drawNode(genX, H/2, "TRAFFIC", "#00f0ff", false);
    drawNode(lbX, H/2, "LOAD BALANCER", "#ffd700", true);

    /* server nodes */
    servers.forEach(function (s) {
      var sy = svY(s.id);
      var color = s.health === "CRASHED" ? "#ff2a5f" : s.health === "DEGRADED" ? "#ffd700" : "#00ff66";
      ctx.shadowBlur = 0;
      ctx.fillStyle = s.health === "CRASHED" ? "rgba(255,42,95,0.04)" : s.health === "DEGRADED" ? "rgba(255,215,0,0.04)" : "rgba(0,255,102,0.04)";
      ctx.beginPath();
      ctx.arc(svX, sy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = "clamp(5px,0.5vmin,7px) Consolas,monospace";
      ctx.textAlign = "center";
      ctx.fillText(s.name, svX, sy + 22);
      ctx.font = "clamp(4px,0.45vmin,6px) Consolas,monospace";
      ctx.fillText(s.activeConn + " conn", svX, sy - 20);
    });

    /* packets */
    packets.forEach(function (pkt) {
      if (!pkt.active) return;
      ctx.shadowColor = pkt.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = pkt.color;
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, pkt.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.12;
      ctx.fillStyle = pkt.color;
      ctx.beginPath();
      ctx.arc(pkt.x, pkt.y, pkt.size * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  }

  /* ─── Telemetry ──────────────────────────────── */
  function updateTelemetry() {
    inVal.textContent = totalRequests;
    var dropPct = totalRequests > 0 ? ((totalDrops / totalRequests) * 100).toFixed(1) : "0.0";
    dropVal.textContent = dropPct + "%";

    var maxConn = 0;
    for (var i = 0; i < servers.length; i++) {
      if (servers[i].activeConn > maxConn) maxConn = servers[i].activeConn;
    }
    peakLoad = Math.max(peakLoad, maxConn);
    peakVal.textContent = peakLoad;

    var healthyCount = servers.filter(function (s) { return s.health !== "CRASHED"; }).length;
    var eff = servers.length > 0 ? ((healthyCount / servers.length) * 100).toFixed(0) : "0";
    effVal.textContent = eff + "%";
  }

  /* ─── Traffic generator ──────────────────────── */
  var lastTick = performance.now();

  function tick() {
    var now = performance.now();
    var dt = now - lastTick;
    lastTick = now;

    var rate = parseInt(rateSlider.value, 10);
    var interval = 1000 / rate;

    tickAccum += dt;
    while (tickAccum >= interval) {
      tickAccum -= interval;
      spawnRequest();
    }

    updatePackets();
    render();
    updateTelemetry();
    syncServerUI();
    requestAnimationFrame(tick);
  }

  /* ─── Server UI sync ─────────────────────────── */
  function syncServerUI() {
    var cards = document.querySelectorAll(".svCard");
    cards.forEach(function (card, idx) {
      var s = servers[idx];
      if (!s) return;
      card.querySelector(".svConn").textContent = s.activeConn;
      var stateEl = card.querySelector(".svState");
      stateEl.textContent = s.health;
      stateEl.className = "svState " + s.health.toLowerCase();
      card.querySelector(".wgtSlider").value = s.weight;
      card.querySelector(".wgtVal").textContent = s.weight;
    });
  }

  /* ─── Server control bindings ────────────────── */
  function bindServerControls() {
    var cards = document.querySelectorAll(".svCard");
    cards.forEach(function (card, idx) {
      card.querySelector(".wgtSlider").addEventListener("input", function () {
        servers[idx].weight = parseInt(this.value, 10);
        card.querySelector(".wgtVal").textContent = this.value;
      });

      card.querySelector(".crashBtn").addEventListener("click", function () {
        servers[idx].health = "CRASHED";
        servers[idx].activeConn = 0;
      });
      card.querySelector(".throttleBtn").addEventListener("click", function () {
        servers[idx].health = servers[idx].health === "DEGRADED" ? "HEALTHY" : "DEGRADED";
      });
      card.querySelector(".healBtn").addEventListener("click", function () {
        servers[idx].health = "HEALTHY";
        servers[idx].activeConn = 0;
      });
    });
  }

  /* ─── Buttons ────────────────────────────────── */
  spikeBtn.addEventListener("click", function () {
    for (var i = 0; i < 20; i++) spawnRequest();
  });

  healAllBtn.addEventListener("click", function () {
    servers.forEach(function (s) {
      s.health = "HEALTHY";
      s.activeConn = 0;
    });
  });

  flushBtn.addEventListener("click", function () {
    totalRequests = 0;
    totalDrops = 0;
    peakLoad = 0;
    packets = [];
    tickAccum = 0;
    servers.forEach(function (s) { s.activeConn = 0; s.busyUntil = 0; });
  });

  /* ─── Slider display ─────────────────────────── */
  rateSlider.addEventListener("input", function () {
    document.getElementById("rateVal").textContent = rateSlider.value;
  });

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resize();
    bindServerControls();
    syncServerUI();
    requestAnimationFrame(tick);
  }

  init();
})();
