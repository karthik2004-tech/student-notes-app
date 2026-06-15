(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var canvas        = document.getElementById("tcpCanvas");
  var ctx           = canvas.getContext("2d");
  var clientStateEl= document.getElementById("clientState");
  var serverStateEl= document.getElementById("serverState");
  var seqMapEl     = document.getElementById("seqMap");
  var lastSegEl    = document.getElementById("lastSeg");
  var ledgerBody   = document.getElementById("ledgerBody");
  var connectBtn   = document.getElementById("connectBtn");
  var dropBtn      = document.getElementById("dropBtn");
  var retransBtn   = document.getElementById("retransBtn");
  var resetBtn     = document.getElementById("resetBtn");
  var timeoutOver  = document.getElementById("timeoutOverlay");

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

  /* ─── Node positions ──────────────────────────── */
  var clientX, serverX, midY;

  function getPos() {
    clientX = W * 0.15;
    serverX = W * 0.85;
    midY = H * 0.5;
  }

  /* ─── TCP State ───────────────────────────────── */
  var client = { state:"CLOSED", seq:0, ack:0 };
  var server = { state:"LISTEN", seq:0, ack:0 };
  var x = 0, y = 0;
  var established = false;
  var lastSegment = "--";

  /* ─── Packet animation ───────────────────────── */
  var packets = [];
  var dropEnabled = false;
  var timeoutActive = false;
  var handshakePhase = 0; /* 0=idle, 1=SYN, 2=SYN-ACK, 3=ACK, 4=done */

  /* ─── ISN init ────────────────────────────────── */
  function initISN() {
    x = Math.floor(1000 + Math.random() * 8000);
    y = Math.floor(5000 + Math.random() * 5000);
    client.seq = x;
    server.seq = y;
    client.ack = 0;
    server.ack = 0;
    seqMapEl.textContent = "x=" + x + " y=" + y;
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetAll() {
    client.state = "CLOSED";
    server.state = "LISTEN";
    clientStateEl.textContent = "CLOSED";
    serverStateEl.textContent = "LISTEN";
    established = false;
    handshakePhase = 0;
    lastSegment = "--";
    lastSegEl.textContent = "--";
    packets = [];
    dropEnabled = false;
    timeoutActive = false;
    timeoutOver.classList.remove("show");
    dropBtn.textContent = "INJECT DROP FAULT";
    ledgerBody.innerHTML = "";
    connectBtn.disabled = false;
    retransBtn.disabled = true;
    initISN();
  }

  /* ─── Spawn packet ────────────────────────────── */
  function spawnPacket(from, to, flags, seq, ack, color) {
    var sx = from === "client" ? clientX : serverX;
    var ex = to === "client" ? clientX : serverX;
    packets.push({
      sx: sx, sy: midY,
      ex: ex, ey: midY,
      progress: 0,
      flags: flags,
      seq: seq,
      ack: ack,
      color: color || "#00f0ff",
      active: true,
      speed: 0.018,
      dissolved: false,
    });
  }

  function waitForPackets() {
    return new Promise(function (res) {
      function check() {
        var active = packets.some(function (p) { return p.active && !p.dissolved; });
        if (!active) res();
        else requestAnimationFrame(check);
      }
      check();
    });
  }

  /* ─── Ledger entry ────────────────────────────── */
  function addLedger(src, dst, flags, seq, ack, win, cls) {
    var row = document.createElement("div");
    row.className = "ledgerRow " + (cls || "");
    row.innerHTML = "<span>" + src + "</span><span>" + dst + "</span><span class='flags'>" + flags + "</span><span>" + seq + "</span><span>" + ack + "</span><span>" + win + "</span>";
    ledgerBody.appendChild(row);
    row.scrollIntoView();
  }

  /* ─── Handshake phases ────────────────────────── */
  async function initiateHandshake() {
    if (handshakePhase !== 0) return;
    connectBtn.disabled = true;
    retransBtn.disabled = true;
    handshakePhase = 1;
    timeoutOver.classList.remove("show");

    /* PHASE 1: Client sends SYN */
    client.state = "SYN_SENT";
    clientStateEl.textContent = "SYN_SENT";
    lastSegment = "SYN";
    lastSegEl.textContent = "SYN";
    spawnPacket("client", "server", "[SYN]", client.seq, 0, "#00f0ff");
    addLedger("CLIENT", "SERVER", "SYN", client.seq, 0, "65535", "syn");

    if (dropEnabled && handshakePhase === 1) {
      injectDrop();
      return;
    }

    await waitForPackets();
    if (handshakePhase === 0) return;

    /* PHASE 2: Server sends SYN-ACK */
    handshakePhase = 2;
    server.state = "SYN_RECEIVED";
    serverStateEl.textContent = "SYN_RECEIVED";
    server.ack = client.seq + 1;
    client.ack = server.seq + 1;
    lastSegment = "SYN-ACK";
    lastSegEl.textContent = "SYN-ACK";
    spawnPacket("server", "client", "[SYN-ACK]", server.seq, server.ack, "#ff2a5f");
    addLedger("SERVER", "CLIENT", "SYN-ACK", server.seq, server.ack, "65535", "synack");

    if (dropEnabled && handshakePhase === 2) {
      injectDrop();
      return;
    }

    await waitForPackets();
    if (handshakePhase === 0) return;

    /* PHASE 3: Client sends ACK */
    handshakePhase = 3;
    client.state = "ESTABLISHED";
    clientStateEl.textContent = "ESTABLISHED";
    client.ack = server.seq + 1;
    server.ack = client.seq + 1;
    lastSegment = "ACK";
    lastSegEl.textContent = "ACK";
    spawnPacket("client", "server", "[ACK]", client.seq, client.ack, "#00ff66");
    addLedger("CLIENT", "SERVER", "ACK", client.seq, client.ack, "65535", "ack");

    await waitForPackets();
    if (handshakePhase === 0) return;

    /* PHASE 4: Established */
    handshakePhase = 4;
    server.state = "ESTABLISHED";
    serverStateEl.textContent = "ESTABLISHED";
    established = true;
    lastSegment = "ESTABLISHED";
    lastSegEl.textContent = "ESTABLISHED";
    connectBtn.disabled = true;
    retransBtn.disabled = true;
  }

  /* ─── Drop injection ──────────────────────────── */
  function injectDrop() {
    timeoutActive = true;
    /* find active packet and dissolve it */
    packets.forEach(function (p) {
      if (p.active && p.progress < 0.8) {
        p.dissolved = true;
        p.active = false;
        p.color = "#ff2a5f";
      }
    });
    timeoutOver.classList.add("show");
    addLedger("—", "—", "DROP", "—", "—", "—", "drop");
    retransBtn.disabled = false;
  }

  /* ─── Retransmit ──────────────────────────────── */
  function retransmit() {
    if (!timeoutActive) return;
    timeoutActive = false;
    timeoutOver.classList.remove("show");
    packets = [];
    handshakePhase = 0;
    /* restart from SYN */
    if (dropEnabled) {
      /* toggle drop off so retransmit succeeds */
    }
    initiateHandshake();
  }

  /* ─── Update packets ──────────────────────────── */
  function updatePackets() {
    packets.forEach(function (p) {
      if (!p.active) return;
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.active = false;
        p.progress = 1;
      }
    });
  }

  /* ─── Render canvas ──────────────────────────── */
  function render() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);
    getPos();

    /* band */
    ctx.strokeStyle = "rgba(0,240,255,0.03)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(clientX, midY);
    ctx.lineTo(serverX, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    /* node labels */
    ctx.fillStyle = "#1a2a3a";
    ctx.font = "clamp(6px,0.65vmin,9px) Consolas,monospace";
    ctx.textAlign = "center";
    ctx.fillText("────  CLIENT  ────", clientX, midY - 50);
    ctx.fillText("────  SERVER  ────", serverX, midY - 50);

    /* node circles */
    function drawNode(x, label, state, color) {
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,240,255,0.03)";
      ctx.beginPath();
      ctx.arc(x, midY, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color || "#475569";
      ctx.font = "clamp(4px,0.45vmin,6px) Consolas,monospace";
      ctx.fillText(state, x, midY + 4);
    }

    drawNode(clientX, "CLIENT", client.state, client.state === "ESTABLISHED" ? "#00ff66" : client.state === "SYN_SENT" ? "#00f0ff" : "#475569");
    drawNode(serverX, "SERVER", server.state, server.state === "ESTABLISHED" ? "#00ff66" : server.state === "SYN_RECEIVED" ? "#ff2a5f" : "#475569");

    /* packets */
    packets.forEach(function (p) {
      if (!p.active) return;
      var x = p.sx + (p.ex - p.sx) * p.progress;
      var y = p.sy + (p.ey - p.sy) * p.progress;

      if (p.dissolved) {
        /* particle cloud */
        for (var i = 0; i < 6; i++) {
          ctx.fillStyle = "rgba(255,42,95," + (0.2 + Math.random() * 0.3) + ")";
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, 2 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }

      /* packet capsule */
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      var w = 70;
      roundRect(ctx, x - w / 2, y - 12, w, 24, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      /* flag text */
      ctx.fillStyle = "#04050a";
      ctx.font = "bold clamp(5px,0.55vmin,8px) Consolas,monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.flags, x, y + 3);
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ─── Main loop ──────────────────────────────── */
  function loop() {
    updatePackets();
    render();
    requestAnimationFrame(loop);
  }

  /* ─── Events ──────────────────────────────────── */
  connectBtn.addEventListener("click", initiateHandshake);

  dropBtn.addEventListener("click", function () {
    dropEnabled = !dropEnabled;
    dropBtn.textContent = dropEnabled ? "DROP FAULT ON" : "INJECT DROP FAULT";
    if (dropEnabled) dropBtn.style.borderColor = "#ff2a5f";
    else dropBtn.style.borderColor = "";
  });

  retransBtn.addEventListener("click", retransmit);

  resetBtn.addEventListener("click", function () {
    resetAll();
    connectBtn.disabled = false;
  });

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resize();
    initISN();
    requestAnimationFrame(loop);
  }

  init();
})();
