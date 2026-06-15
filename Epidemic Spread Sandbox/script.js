(function () {
  "use strict";

  /* ─── DOM ────────────────────────────────────── */
  var simCanvas   = document.getElementById("simCanvas");
  var sCtx        = simCanvas.getContext("2d");
  var gCanvas     = document.getElementById("graphCanvas");
  var gCtx        = gCanvas.getContext("2d");
  var transSlider = document.getElementById("transSlider");
  var recSlider   = document.getElementById("recSlider");
  var quarSlider  = document.getElementById("quarSlider");
  var popSlider   = document.getElementById("popSlider");
  var susVal      = document.getElementById("susVal");
  var infVal      = document.getElementById("infVal");
  var recDisp     = document.getElementById("recDisp");
  var initBtn     = document.getElementById("initBtn");
  var clearBtn    = document.getElementById("clearBtn");

  /* ─── Canvas sizes ────────────────────────────── */
  var W, H, GW, GH;

  function resize() {
    var r = simCanvas.parentElement.getBoundingClientRect();
    W = Math.floor(r.width); H = Math.floor(r.height);
    simCanvas.width = W; simCanvas.height = H;
    simCanvas.style.width = W + "px"; simCanvas.style.height = H + "px";

    var gr = gCanvas.parentElement.getBoundingClientRect();
    GW = Math.floor(gr.width); GH = Math.floor(gr.height);
    gCanvas.width = GW; gCanvas.height = GH;
    gCanvas.style.width = GW + "px"; gCanvas.style.height = GH + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── SIR State ──────────────────────────────── */
  var S = 0, I = 1, R = 2;

  /* ─── Particle pool ──────────────────────────── */
  var particles = [];
  var running = false;
  var frameCount = 0;

  /* ─── Graph history ──────────────────────────── */
  var historyS = [];
  var historyI = [];
  var historyR = [];
  var MAX_HISTORY = 300;

  /* ─── Particle object ────────────────────────── */
  function createParticle(x, y, state) {
    var speed = 0.8 + Math.random() * 0.6;
    var angle = Math.random() * Math.PI * 2;
    return {
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 4,
      state: state,
      timer: 0,
      frozen: false,
    };
  }

  /* ─── Initialize ─────────────────────────────── */
  function initSim() {
    var pop = parseInt(popSlider.value, 10);
    particles = [];
    historyS = []; historyI = []; historyR = [];

    /* seed one infected at center */
    for (var i = 0; i < pop; i++) {
      var x = 20 + Math.random() * (W - 40);
      var y = 20 + Math.random() * (H - 40);
      var st = (i === 0) ? I : S;
      particles.push(createParticle(x, y, st));
    }

    running = true;
    frameCount = 0;
    updateTelemetry();
  }

  function clearField() {
    particles = [];
    historyS = []; historyI = []; historyR = [];
    running = false;
    susVal.textContent = "0";
    infVal.textContent = "0";
    recDisp.textContent = "0";
    sCtx.clearRect(0, 0, W, H);
    gCtx.clearRect(0, 0, GW, GH);
  }

  /* ─── Physics ────────────────────────────────── */
  function updateParticles() {
    var quarPct = parseInt(quarSlider.value, 10) / 100;
    var transPct = parseInt(transSlider.value, 10) / 100;
    var recTime = parseInt(recSlider.value, 10);

    /* decide frozen set */
    var freezeCount = Math.floor(particles.length * quarPct);
    /* shuffle indices to pick random set */
    var indices = [];
    for (var i = 0; i < particles.length; i++) indices.push(i);
    for (var i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }
    for (var i = 0; i < particles.length; i++) particles[i].frozen = false;
    for (var i = 0; i < freezeCount; i++) particles[indices[i]].frozen = true;

    /* move + bounce */
    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      if (!a.frozen) {
        a.x += a.vx;
        a.y += a.vy;
      }

      /* bounce off walls */
      if (a.x - a.r < 0) { a.x = a.r; if (!a.frozen) a.vx *= -1; }
      if (a.x + a.r > W) { a.x = W - a.r; if (!a.frozen) a.vx *= -1; }
      if (a.y - a.r < 0) { a.y = a.r; if (!a.frozen) a.vy *= -1; }
      if (a.y + a.r > H) { a.y = H - a.r; if (!a.frozen) a.vy *= -1; }

      /* recovery tick */
      if (a.state === I) {
        a.timer++;
        if (a.timer >= recTime) {
          a.state = R;
        }
      }
    }

    /* collision checks */
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i];
        var b = particles[j];

        var dx = b.x - a.x;
        var dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = a.r + b.r;

        if (dist < minDist && dist > 0.001) {
          /* normalize */
          var nx = dx / dist;
          var ny = dy / dist;

          /* separate */
          var overlap = (minDist - dist) / 2;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;

          /* swap velocities (elastic) */
          if (!a.frozen && !b.frozen) {
            var tvx = a.vx; var tvy = a.vy;
            a.vx = b.vx; a.vy = b.vy;
            b.vx = tvx; b.vy = tvy;
          } else if (!a.frozen && b.frozen) {
            a.vx = -a.vx; a.vy = -a.vy;
          } else if (a.frozen && !b.frozen) {
            b.vx = -b.vx; b.vy = -b.vy;
          }

          /* transmission: S + I */
          if ((a.state === S && b.state === I) || (a.state === I && b.state === S)) {
            var target = (a.state === S) ? a : b;
            if (Math.random() < transPct) {
              target.state = I;
              target.timer = 0;
            }
          }
        }
      }
    }
  }

  /* ─── Draw particles ─────────────────────────── */
  function drawParticles() {
    sCtx.fillStyle = "#04050a";
    sCtx.fillRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      switch (a.state) {
        case S: sCtx.fillStyle = "#00ff66"; break;
        case I: sCtx.fillStyle = "#ff2a5f"; break;
        case R: sCtx.fillStyle = "#8a2be2"; break;
      }

      if (a.frozen) {
        sCtx.globalAlpha = 0.4;
      } else {
        sCtx.globalAlpha = 0.9;
      }

      sCtx.beginPath();
      sCtx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      sCtx.fill();

      /* glow for infected */
      if (a.state === I) {
        sCtx.shadowColor = "#ff2a5f";
        sCtx.shadowBlur = 8;
        sCtx.beginPath();
        sCtx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.shadowBlur = 0;
      }
    }
    sCtx.globalAlpha = 1;
  }

  /* ─── Telemetry ──────────────────────────────── */
  function updateTelemetry() {
    var s = 0, i = 0, r = 0;
    for (var k = 0; k < particles.length; k++) {
      switch (particles[k].state) {
        case S: s++; break;
        case I: i++; break;
        case R: r++; break;
      }
    }
    susVal.textContent = s;
    infVal.textContent = i;
    recDisp.textContent = r;
    return { s: s, i: i, r: r };
  }

  /* ─── Graph ───────────────────────────────────── */
  function updateGraph(counts) {
    historyS.push(counts.s);
    historyI.push(counts.i);
    historyR.push(counts.r);

    if (historyS.length > MAX_HISTORY) {
      historyS.shift();
      historyI.shift();
      historyR.shift();
    }

    gCtx.fillStyle = "#04050a";
    gCtx.fillRect(0, 0, GW, GH);

    var len = historyS.length;
    if (len < 2) return;
    var maxPop = particles.length;

    function drawCurve(data, color) {
      gCtx.strokeStyle = color;
      gCtx.lineWidth = 1.5;
      gCtx.beginPath();
      for (var i = 0; i < len; i++) {
        var x = (i / MAX_HISTORY) * GW;
        var y = GH - (data[i] / maxPop) * GH;
        if (i === 0) gCtx.moveTo(x, y);
        else gCtx.lineTo(x, y);
      }
      gCtx.stroke();
    }

    /* filled areas */
    function fillArea(data, color) {
      gCtx.fillStyle = color;
      gCtx.globalAlpha = 0.1;
      gCtx.beginPath();
      gCtx.moveTo(0, GH);
      for (var i = 0; i < len; i++) {
        var x = (i / MAX_HISTORY) * GW;
        var y = GH - (data[i] / maxPop) * GH;
        gCtx.lineTo(x, y);
      }
      gCtx.lineTo((len / MAX_HISTORY) * GW, GH);
      gCtx.closePath();
      gCtx.fill();
      gCtx.globalAlpha = 1;
    }

    fillArea(historyR, "#8a2be2");
    fillArea(historyI, "#ff2a5f");
    fillArea(historyS, "#00ff66");

    drawCurve(historyS, "#00ff66");
    drawCurve(historyI, "#ff2a5f");
    drawCurve(historyR, "#8a2be2");

    /* horizon line */
    gCtx.strokeStyle = "rgba(0,240,255,0.05)";
    gCtx.lineWidth = 0.5;
    gCtx.setLineDash([3, 3]);
    gCtx.beginPath();
    gCtx.moveTo(0, GH - 0.5);
    gCtx.lineTo(GW, GH - 0.5);
    gCtx.stroke();
    gCtx.setLineDash([]);
  }

  /* ─── Main loop ──────────────────────────────── */
  function loop() {
    if (running) {
      updateParticles();

      /* snapshot every 8 frames */
      frameCount++;
      if (frameCount % 8 === 0) {
        var counts = updateTelemetry();
        updateGraph(counts);
      }

      drawParticles();
    }
    requestAnimationFrame(loop);
  }

  /* ─── Slider display ─────────────────────────── */
  transSlider.addEventListener("input", function () {
    document.getElementById("transVal").textContent = transSlider.value + "%";
  });
  recSlider.addEventListener("input", function () {
    document.getElementById("recVal").textContent = recSlider.value;
  });
  quarSlider.addEventListener("input", function () {
    document.getElementById("quarVal").textContent = quarSlider.value + "%";
  });
  popSlider.addEventListener("input", function () {
    document.getElementById("popVal").textContent = popSlider.value;
  });

  /* ─── Buttons ────────────────────────────────── */
  initBtn.addEventListener("click", initSim);
  clearBtn.addEventListener("click", clearField);

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resize();
    requestAnimationFrame(loop);
  }

  init();
})();
