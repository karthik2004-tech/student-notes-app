(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var canvas     = document.getElementById("netCanvas");
  var ctx        = canvas.getContext("2d");
  var urlInput   = document.getElementById("urlInput");
  var statusSel  = document.getElementById("statusSel");
  var dnsVal     = document.getElementById("dnsVal");
  var srvVal     = document.getElementById("srvVal");
  var dbVal      = document.getElementById("dbVal");
  var rttVal     = document.getElementById("rttVal");
  var wfDns      = document.getElementById("wfDns");
  var wfSrv      = document.getElementById("wfSrv");
  var wfDb       = document.getElementById("wfDb");
  var historyLog = document.getElementById("historyLog");
  var fireBtn    = document.getElementById("fireBtn");
  var resetBtn   = document.getElementById("resetBtn");

  /* ─── Canvas sizing ────────────────────────────── */
  var W, H;

  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(r.width);
    H = Math.floor(r.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── Node positions (fractions of W/H) ────────── */
  var nodes = {};

  function getNodes() {
    nodes = {
      browser:  { x: W * 0.08, y: H * 0.5,    label:"BROWSER" },
      dns:      { x: W * 0.3,  y: H * 0.15,   label:"DNS" },
      server:   { x: W * 0.55, y: H * 0.5,    label:"SERVER" },
      database: { x: W * 0.8,  y: H * 0.8,    label:"DATABASE" },
    };
  }

  /* ─── Path definitions ────────────────────────── */
  var paths = {
    browser_to_dns:    ["browser","dns"],
    dns_to_server:     ["dns","server"],
    server_to_db:      ["server","database"],
    db_to_server:      ["database","server"],
    server_to_browser: ["server","browser"],
    error_return:      ["server","browser"],
  };

  /* ─── Packet state ────────────────────────────── */
  var packets = [];
  var nodeGlows = []; /* { node, time } */
  var running = false;

  var statusLabels = { 200:"OK", 404:"NOT FOUND", 500:"SERVER ERROR", 504:"GATEWAY TIMEOUT" };

  /* ─── Staggered timing storage ───────────────── */
  var timing = { dns:0, server:0, db:0 };

  /* ─── History from localStorage ───────────────── */
  var history = [];

  function loadHistory() {
    try {
      var d = localStorage.getItem("irls_history");
      if (d) history = JSON.parse(d);
    } catch(e) { history = []; }
  }

  function saveHistory() {
    try { localStorage.setItem("irls_history", JSON.stringify(history.slice(-20))); } catch(e) {}
  }

  /* ─── rAF packet animator ───────────────────── */
  function spawnPacket(pathKey, color, size, speed) {
    var p = paths[pathKey];
    var a = nodes[p[0]];
    var b = nodes[p[1]];
    packets.push({
      ax: a.x, ay: a.y,
      bx: b.x, by: b.y,
      progress: 0,
      color: color || "#00f0ff",
      size: size || 4,
      speed: speed || 0.012,
      glow: 0,
      active: true,
      pathKey: pathKey,
    });
  }

  function triggerNodeGlow(nodeName) {
    nodeGlows.push({ node:nodeName, time:performance.now() });
  }

  function renderCanvas() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);
    getNodes();

    /* draw connections */
    ctx.strokeStyle = "rgba(0,240,255,0.03)";
    ctx.lineWidth = 1;
    var allPaths = Object.keys(paths);
    allPaths.forEach(function (pk) {
      var p = paths[pk];
      var a = nodes[p[0]], b = nodes[p[1]];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    /* draw nodes */
    Object.keys(nodes).forEach(function (nk) {
      var n = nodes[nk];
      var glow = false;
      nodeGlows.forEach(function (g) {
        if (g.node === nk && performance.now() - g.time < 600) glow = true;
      });
      if (glow) {
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 18;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = "rgba(0,240,255,0.04)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#475569";
      ctx.font = "clamp(5px,0.55vmin,8px) Consolas,monospace";
      ctx.textAlign = "center";
      ctx.fillText(n.label, n.x, n.y + 30);
    });

    /* draw packets */
    packets.forEach(function (pkt) {
      if (!pkt.active) return;
      var x = pkt.ax + (pkt.bx - pkt.ax) * pkt.progress;
      var y = pkt.ay + (pkt.by - pkt.ay) * pkt.progress;

      ctx.shadowColor = pkt.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = pkt.color;
      ctx.beginPath();
      ctx.arc(x, y, pkt.size, 0, Math.PI * 2);
      ctx.fill();

      /* trail */
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = pkt.color;
      ctx.beginPath();
      ctx.arc(x, y, pkt.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });
  }

  function animatePackets() {
    packets.forEach(function (pkt) {
      if (!pkt.active) return;
      pkt.progress += pkt.speed;
      if (pkt.progress >= 1) {
        pkt.active = false;
        var p = paths[pkt.pathKey];
        triggerNodeGlow(p[1]);
      }
    });
  }

  /* ─── Cleanup helpers ────────────────────────── */
  function clearPackets() {
    packets = [];
    nodeGlows = [];
  }

  /* ─── Random delay (ms) ──────────────────────── */
  function randDelay(base) {
    return base + (Math.random() * 80 - 40);
  }

  function delay(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  /* ─── wait for packet to reach destination ──── */
  function waitForPacket() {
    return new Promise(function (res) {
      function check() {
        var active = packets.some(function (p) { return p.active; });
        if (!active) res();
        else requestAnimationFrame(check);
      }
      check();
    });
  }

  /* ─── Pipeline ────────────────────────────────── */
  async function fireRequest() {
    if (running) return;
    running = true;
    fireBtn.disabled = true;

    var url = urlInput.value.trim() || "https://example.com";
    var statusCode = parseInt(statusSel.value, 10);
    var ip = fakeIP();
    var tStart = performance.now();

    /* Clear previous state */
    clearPackets();
    timing = { dns:0, server:0, db:0 };
    wfDns.style.width = "0%";
    wfSrv.style.width = "0%";
    wfDb.style.width = "0%";

    var errMsg = null;

    try {
      /* Stage 1: Client Init */
      spawnPacket("browser_to_dns", "#00f0ff", 4, 0.015);
      await delay(randDelay(200));
      await waitForPacket();
      var tDns = performance.now() - tStart;

      /* Stage 2: DNS */
      dnsVal.textContent = ip;
      timing.dns = 60 + Math.random() * 40;
      wfDns.style.width = "100%";
      spawnPacket("dns_to_server", "#00ff66", 4, 0.018);
      await delay(randDelay(300));
      await waitForPacket();
      var tSrv = performance.now() - tStart;

      /* Stage 3: Server */
      srvVal.textContent = "processing";
      timing.server = 50 + Math.random() * 50;

      if (statusCode === 404) {
        /* quick error return */
        spawnPacket("error_return", "#ff2a5f", 5, 0.025);
        await delay(200);
        await waitForPacket();
        errMsg = "404 NOT FOUND";
        timing.server = 30;
        wfSrv.style.width = "60%";
        wfDb.style.width = "0%";
      } else if (statusCode === 500) {
        spawnPacket("error_return", "#ff2a5f", 5, 0.02);
        await delay(200);
        await waitForPacket();
        errMsg = "500 SERVER ERROR";
        timing.server = 40;
        wfSrv.style.width = "80%";
        wfDb.style.width = "0%";
      } else {
        /* normal: go to DB */
        spawnPacket("server_to_db", "#ffd700", 4, 0.014);
        wfSrv.style.width = "100%";
        await delay(randDelay(250));
        await waitForPacket();
        var tDb = performance.now() - tStart;

        /* Stage 4: Database */
        dbVal.textContent = "querying";
        timing.db = 70 + Math.random() * 60;

        if (statusCode === 504) {
          /* simulate timeout - packet freezes halfway */
          var freezePacket = { ax:nodes.server.x, ay:nodes.server.y, bx:nodes.database.x, by:nodes.database.y, progress:0.5, color:"#ffd700", size:4, active:true, speed:0 };
          clearPackets();
          packets.push(freezePacket);
          await delay(800);
          freezePacket.color = "#ff2a5f";
          freezePacket.size = 6;
          errMsg = "504 GATEWAY TIMEOUT";
          timing.db = 120;
          wfDb.style.width = "50%";
          spawnPacket("error_return", "#ff2a5f", 5, 0.02);
          await delay(300);
          await waitForPacket();
        } else {
          /* 200: normal flow */
          wfDb.style.width = "100%";
          spawnPacket("db_to_server", "#00ff66", 4, 0.016);
          await delay(randDelay(250));
          await waitForPacket();

          spawnPacket("server_to_browser", "#00ff66", 4, 0.02);
          await delay(randDelay(200));
          await waitForPacket();
        }
      }
    } catch (e) {
      errMsg = "NETWORK ERROR";
    }

    var tEnd = performance.now();
    var rtt = (tEnd - tStart).toFixed(1);

    /* Update telemetry */
    rttVal.textContent = rtt + "ms";
    if (!errMsg) {
      srvVal.textContent = "200 OK";
      srvVal.style.color = "#00ff66";
      dbVal.textContent = "complete";
      dnsVal.style.color = "#00f0ff";
    } else {
      srvVal.textContent = errMsg;
      srvVal.style.color = "#ff2a5f";
      dbVal.textContent = "—";
    }

    /* History */
    var entry = url + " " + (errMsg || "200 OK") + " " + rtt + "ms";
    history.push({ url:url, status:(errMsg || "200 OK"), rtt:rtt, time:Date.now() });
    saveHistory();
    var hDiv = document.createElement("div");
    hDiv.className = "histEntry";
    var sc = errMsg ? errMsg.split(" ")[0] : "200";
    hDiv.innerHTML = url + ' <span class="statusBadge s' + sc + '">' + (errMsg || "200 OK") + "</span> " + rtt + "ms";
    historyLog.appendChild(hDiv);
    historyLog.scrollLeft = historyLog.scrollWidth;

    running = false;
    fireBtn.disabled = false;
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetCircuit() {
    running = false;
    fireBtn.disabled = false;
    clearPackets();
    dnsVal.textContent = "—";
    srvVal.textContent = "—";
    dbVal.textContent = "—";
    rttVal.textContent = "—";
    dnsVal.style.color = "#00f0ff";
    srvVal.style.color = "#ffd700";
    wfDns.style.width = "0%";
    wfSrv.style.width = "0%";
    wfDb.style.width = "0%";
    timing = { dns:0, server:0, db:0 };
  }

  /* ─── Utility ─────────────────────────────────── */
  function fakeIP() {
    var parts = [];
    for (var i = 0; i < 4; i++) parts.push(Math.floor(Math.random() * 200) + 10);
    return parts.join(".") + ":443";
  }

  /* ─── Main loop ──────────────────────────────── */
  function loop() {
    animatePackets();
    renderCanvas();
    requestAnimationFrame(loop);
  }

  /* ─── Events ──────────────────────────────────── */
  fireBtn.addEventListener("click", fireRequest);
  resetBtn.addEventListener("click", resetCircuit);

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resize();
    loadHistory();
    /* render history badges */
    history.forEach(function (h) {
      var hDiv = document.createElement("div");
      hDiv.className = "histEntry";
      var sc = h.status.split(" ")[0];
      hDiv.innerHTML = h.url + ' <span class="statusBadge s' + sc + '">' + h.status + "</span> " + h.rtt + "ms";
      historyLog.appendChild(hDiv);
    });
    historyLog.scrollLeft = historyLog.scrollWidth;
    requestAnimationFrame(loop);
  }

  init();
})();
