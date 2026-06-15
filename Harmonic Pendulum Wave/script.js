(function () {
  "use strict";

  var container = document.getElementById("pendulumContainer");
  var stage     = document.getElementById("stage");

  var countSlider = document.getElementById("countSlider");
  var countVal    = document.getElementById("countVal");
  var speedSlider = document.getElementById("speedSlider");
  var speedVal    = document.getElementById("speedVal");
  var ampSlider   = document.getElementById("ampSlider");
  var ampVal      = document.getElementById("ampVal");
  var dampSlider  = document.getElementById("dampSlider");
  var dampVal     = document.getElementById("dampVal");

  var timeVal  = document.getElementById("timeVal");
  var cohVal   = document.getElementById("cohVal");
  var stateVal = document.getElementById("stateVal");

  var toggleBtn = document.getElementById("toggleBtn");
  var resetBtn  = document.getElementById("resetBtn");

  /* ─── State ──────────────────────────────────── */
  var count = 15;
  var speed = 1, amplitude = 45, damping = 0;
  var t = 0, running = false;
  var reqId = null;
  var lastTime = 0;
  var pendulums = [];
  var omegas = [];
  var baseFreq = 0.6;

  /* ─── Build / rebuild pendulums ──────────────── */
  function buildPendulums(n) {
    container.innerHTML = "";
    pendulums = [];
    omegas = [];

    var spread = 1.15;
    for (var i = 0; i < n; i++) {
      var col = document.createElement("div");
      col.className = "pcol";

      var str = document.createElement("div");
      str.className = "string";
      col.appendChild(str);

      var bob = document.createElement("div");
      bob.className = "bob";
      col.appendChild(bob);

      container.appendChild(col);
      pendulums.push({ col: col, str: str, bob: bob });

      /* ω_i increases linearly with index for wave pattern */
      var freq = baseFreq * (1 + (i / n) * spread);
      omegas.push(2 * Math.PI * freq);
    }
  }

  /* ─── Update pendulums (per frame) ───────────── */
  function updatePendulums() {
    var dampFactor = Math.exp(-damping * t);

    for (var i = 0; i < pendulums.length; i++) {
      var p = pendulums[i];
      var x = amplitude * Math.sin(omegas[i] * t) * dampFactor;
      p.bob.style.transform = "translate3d(" + x + "px, 0, 0)";
      p.str.style.transform = "translate3d(" + (x * 0.5) + "px, 0, 0)";

      /* Active glow when swinging */
      var active = Math.abs(x) > 2;
      p.bob.classList.toggle("active", active);
      p.str.classList.toggle("active", active);
    }
  }

  /* ─── Compute cohesion coefficient ───────────── */
  function computeCohesion() {
    if (pendulums.length < 2) return 1;
    var sum = 0;
    for (var i = 1; i < pendulums.length; i++) {
      var dx = Math.sin(omegas[i] * t) - Math.sin(omegas[i - 1] * t);
      sum += Math.abs(dx);
    }
    var avg = sum / (pendulums.length - 1);
    return Math.max(0, Math.min(1, 1 - avg * 0.5));
  }

  /* ─── rAF loop ───────────────────────────────── */
  function loop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    /* Clamp dt to avoid spiral of death */
    if (dt > 0.05) dt = 0.05;

    t += dt * speed;

    updatePendulums();

    /* Telemetry */
    timeVal.textContent = t.toFixed(3) + "s";
    cohVal.textContent  = computeCohesion().toFixed(3);

    reqId = requestAnimationFrame(loop);
  }

  /* ─── Toggle motion ──────────────────────────── */
  function toggleMotion() {
    if (running) {
      running = false;
      cancelAnimationFrame(reqId);
      toggleBtn.textContent = "INITIATE MOTION";
      stateVal.textContent = "PAUSED";
      stateVal.style.color = "#ffd700";
    } else {
      running = true;
      lastTime = 0;
      toggleBtn.textContent = "PAUSE MOTION";
      stateVal.textContent = "RUNNING";
      stateVal.style.color = "#00ff88";
      reqId = requestAnimationFrame(loop);
    }
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetVectors() {
    var wasRunning = running;
    if (running) {
      running = false;
      cancelAnimationFrame(reqId);
    }

    t = 0;
    lastTime = 0;

    for (var i = 0; i < pendulums.length; i++) {
      var p = pendulums[i];
      p.bob.style.transform = "translate3d(0, 0, 0)";
      p.str.style.transform = "translate3d(0, 0, 0)";
      p.bob.classList.remove("active");
      p.str.classList.remove("active");
    }

    timeVal.textContent = "0.000s";
    cohVal.textContent  = "1.000";
    stateVal.textContent = "IDLE";
    stateVal.style.color = "#64748b";

    if (wasRunning) {
      toggleBtn.textContent = "INITIATE MOTION";
    }
  }

  /* ─── Slider sync ────────────────────────────── */
  function syncSliders() {
    var newCount = parseInt(countSlider.value, 10);
    countVal.textContent = newCount;

    speed = parseFloat(speedSlider.value);
    speedVal.textContent = speed.toFixed(2);

    amplitude = parseInt(ampSlider.value, 10);
    ampVal.textContent = amplitude;

    damping = parseFloat(dampSlider.value);
    dampVal.textContent = damping.toFixed(3);

    if (newCount !== count) {
      count = newCount;
      buildPendulums(count);
      resetVectors();
    }
  }

  /* ─── Events ─────────────────────────────────── */
  function bindEvents() {
    toggleBtn.addEventListener("click", toggleMotion);
    resetBtn.addEventListener("click", resetVectors);

    countSlider.addEventListener("input", syncSliders);
    speedSlider.addEventListener("input", syncSliders);
    ampSlider.addEventListener("input", function () {
      amplitude = parseInt(ampSlider.value, 10);
      ampVal.textContent = amplitude;
    });
    dampSlider.addEventListener("input", function () {
      damping = parseFloat(dampSlider.value);
      dampVal.textContent = damping.toFixed(3);
    });
  }

  /* ─── Init ───────────────────────────────────── */
  function init() {
    bindEvents();
    buildPendulums(count);
    resetVectors();
  }

  init();
})();
