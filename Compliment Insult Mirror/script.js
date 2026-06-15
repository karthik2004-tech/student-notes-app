(function () {
  "use strict";

  /* ─── Config ───────────────────────────────────────── */
  var GRID_W = 80;
  var GRID_H = 60;
  var CHAR_RAMP = " .':-=+*#%@";
  var MODE_KIND = "kind";
  var MODE_SARCASTIC = "sarcastic";

  var KIND_STATEMENTS = [
    "You look absolutely radiant today.",
    "That smile is pure magic.",
    "You have a very kind presence.",
    "Your energy lights up the room.",
    "You're glowing with confidence.",
    "Looking sharp and brilliant!",
    "Your expression is captivating.",
    "You exude warmth and grace.",
    "There's a genuine kindness in your eyes.",
    "You make the ordinary feel extraordinary.",
    "Your poise is remarkable.",
    "You carry yourself with quiet strength.",
    "That glow is entirely natural.",
    "You're a masterpiece in motion.",
    "The world is brighter with you in it.",
    "You have an effortlessly magnetic presence.",
  ];

  var SARCASTIC_STATEMENTS = [
    "Did you just roll out of bed?",
    "That's... certainly a choice.",
    "Your left side is your good side. Maybe.",
    "You look like you're solving a math problem.",
    "Is that a smile or a glitch in the matrix?",
    "Bold strategy with that expression.",
    "You look moderately passable today.",
    "The camera adds 10 pounds. I added 20.",
    "You're really owning that asymmetrical look.",
    "Your face is doing a lot right now.",
    "That's the face of someone who just saw their browser history.",
    "You look like a Renaissance painting left in the rain.",
    "I've seen more expression on a mannequin.",
    "You're giving 'final boss of a 1995 DOS game.'",
    "That expression says a thousand words. None of them good.",
    "You look like you're contemplating your life choices.",
  ];

  /* ─── DOM refs ─────────────────────────────────────── */
  var splash     = document.getElementById("splash");
  var appEl      = document.getElementById("app");
  var authBtn    = document.getElementById("authBtn");
  var authStatus = document.getElementById("authStatus");
  var canvas     = document.getElementById("mainCanvas");
  var ctx        = canvas.getContext("2d");
  var video      = document.getElementById("videoSrc");
  var mirrorText = document.getElementById("mirrorText");
  var modeBtn    = document.getElementById("modeBtn");
  var freezeBtn  = document.getElementById("freezeBtn");
  var diagLog    = document.getElementById("diagLog");
  var tmCam      = document.getElementById("tmCam");
  var tmMesh     = document.getElementById("tmMesh");
  var tmMood     = document.getElementById("tmMood");
  var tmLumen    = document.getElementById("tmLumen");
  var tmFps      = document.getElementById("tmFps");

  /* ─── State ────────────────────────────────────────── */
  var mode   = MODE_KIND;
  var frozen = false;
  var hasCamera = false;
  var stream    = null;
  var animId    = null;
  var logBuffer = [];
  var maxLog    = 30;

  /* Mood heuristics */
  var moodState = {
    avgLum: 0.5,
    contrast: 0.3,
    centerAvg: 0.5,
    motion: 0,
  };

  /* We'll track frame timing for adaptive statement cycling */
  var lastStatementChange = 0;
  var statementInterval = 3500; /* ms */
  var currentStatement = "";

  var lastFrameLum = null; /* for motion detection */
  var frameCount   = 0;
  var fpsTime      = 0;
  var fps          = 0;

  /* Fallback oscillator */
  var fbTime = 0;

  /* Canvas resize observer */
  var needsResize = true;

  /* Reusable offscreen canvas for grid sampling */
  var offCanvas = document.createElement("canvas");
  var offCtx    = offCanvas.getContext("2d");
  offCanvas.width  = GRID_W;
  offCanvas.height = GRID_H;

  /* ─── Logging ──────────────────────────────────────── */
  function diag(msg) {
    logBuffer.push(msg);
    if (logBuffer.length > maxLog) logBuffer.shift();
    diagLog.innerHTML = logBuffer.map(function (l) {
      return '<div class="diag-line">&gt; ' + l + "</div>";
    }).join("");
    diagLog.scrollTop = diagLog.scrollHeight;
  }

  /* ─── Canvas resize ────────────────────────────────── */
  function resizeCanvas() {
    var rect = document.getElementById("viewport").getBoundingClientRect();
    var w = Math.floor(rect.width);
    var h = Math.floor(rect.height);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
      needsResize = false;
    }
  }

  /* ─── Camera init ──────────────────────────────────── */
  function startFallback() {
    hasCamera = false;
    diag("CAMERA: unavailable  —  entering fallback mode");
    diag("FALLBACK: generating synthetic mesh data");
    tmCam.textContent = "FALLBACK";
    tmCam.className = "tm-v";
    tmCam.style.color = "#f59e0b";
    splash.classList.add("hidden");
    appEl.classList.remove("hidden");
    diag("MESH: initialized synthetic grid " + GRID_W + "x" + GRID_H);
    tmMesh.textContent = GRID_W + "x" + GRID_H;
    resizeCanvas();
    needsResize = true;
    if (!animId) animId = requestAnimationFrame(loop);
  }

  function initCamera() {
    authBtn.disabled = true;
    authStatus.textContent = "REQUESTING PERMISSION…";
    authStatus.style.color = "#f59e0b";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      authStatus.textContent = "ERROR: getUserMedia not supported";
      authStatus.style.color = "#ef4444";
      setTimeout(startFallback, 800);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 30 } } })
    .then(function (s) {
      stream = s;
      hasCamera = true;
      video.srcObject = s;
      diag("CAMERA: stream acquired (" + (s.getVideoTracks()[0] ? s.getVideoTracks()[0].label : "unknown") + ")");
      tmCam.textContent = "ONLINE";
      tmCam.className = "tm-v tm-on";
      splash.classList.add("hidden");
      appEl.classList.remove("hidden");
      diag("MESH: grid allocated " + GRID_W + "x" + GRID_H);
      tmMesh.textContent = GRID_W + "x" + GRID_H;
      resizeCanvas();
      needsResize = true;
      if (!animId) animId = requestAnimationFrame(loop);
    })
    .catch(function (err) {
      authStatus.textContent = "DENIED: " + err.message;
      authStatus.style.color = "#ef4444";
      diag("CAMERA: permission denied — " + err.message);
      setTimeout(startFallback, 1200);
    });
  }

  /* ─── Luminosity ───────────────────────────────────── */
  function calcLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  /* ─── Grid sampling ────────────────────────────────── */
  function sampleGrid() {
    if (hasCamera && video.readyState >= 2) {
      offCtx.drawImage(video, 0, 0, GRID_W, GRID_H);
    } else {
      /* Fallback: draw synthetic gradient + moving shape */
      fbTime += 0.03;
      var cx = GRID_W / 2 + Math.sin(fbTime * 0.7) * 12;
      var cy = GRID_H / 2 + Math.cos(fbTime * 0.5) * 8;
      var grad = offCtx.createRadialGradient(cx, cy, 1, cx, cy, 18);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.4, "#8899aa");
      grad.addColorStop(1, "#04050a");
      offCtx.fillStyle = "#04050a";
      offCtx.fillRect(0, 0, GRID_W, GRID_H);
      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(cx, cy, 18, 0, Math.PI * 2);
      offCtx.fill();
      /* add some noise dots */
      for (var n = 0; n < 60; n++) {
        var nx = Math.random() * GRID_W;
        var ny = Math.random() * GRID_H;
        var nb = Math.random() * 80 + 40;
        offCtx.fillStyle = "rgb(" + nb + "," + nb + "," + nb + ")";
        offCtx.fillRect(nx, ny, 1, 1);
      }
    }

    var imgData = offCtx.getImageData(0, 0, GRID_W, GRID_H);
    var data = imgData.data;
    var grid = new Array(GRID_H);
    var total = 0;

    for (var y = 0; y < GRID_H; y++) {
      grid[y] = new Array(GRID_W);
      for (var x = 0; x < GRID_W; x++) {
        var idx = (y * GRID_W + x) * 4;
        var lum = calcLuminance(data[idx], data[idx + 1], data[idx + 2]) / 255;
        grid[y][x] = lum;
        total += lum;
      }
    }

    /* Mood analysis */
    var avgLum = total / (GRID_W * GRID_H);
    var varSum = 0;
    var centerSum = 0, centerCount = 0;
    var cx1 = Math.floor(GRID_W * 0.3), cx2 = Math.floor(GRID_W * 0.7);
    var cy1 = Math.floor(GRID_H * 0.2), cy2 = Math.floor(GRID_H * 0.6);

    for (var y = 0; y < GRID_H; y++) {
      for (var x = 0; x < GRID_W; x++) {
        var d = grid[y][x] - avgLum;
        varSum += d * d;
        if (x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2) {
          centerSum += grid[y][x];
          centerCount++;
        }
      }
    }

    var contrast = Math.sqrt(varSum / (GRID_W * GRID_H));
    var centerAvg = centerCount > 0 ? centerSum / centerCount : avgLum;

    /* Motion: compare to last frame */
    var motion = 0;
    if (lastFrameLum) {
      var mCount = 0;
      for (var y = 0; y < GRID_H; y += 4) {
        for (var x = 0; x < GRID_W; x += 4) {
          motion += Math.abs(grid[y][x] - lastFrameLum[y][x]);
          mCount++;
        }
      }
      motion = mCount > 0 ? motion / mCount : 0;
    }
    lastFrameLum = grid;

    moodState.avgLum    = avgLum;
    moodState.contrast  = contrast;
    moodState.centerAvg = centerAvg;
    moodState.motion    = motion;

    return grid;
  }

  /* ─── Statement generation ─────────────────────────── */
  function pickStatement() {
    var pool = mode === MODE_KIND ? KIND_STATEMENTS : SARCASTIC_STATEMENTS;
    var energy = moodState.avgLum * 0.4 + moodState.contrast * 0.35 + moodState.motion * 10 * 0.25;
    energy = Math.max(0, Math.min(1, energy));
    var idx = Math.floor(energy * pool.length * 0.85) % pool.length;
    currentStatement = pool[idx];
    mirrorText.textContent = currentStatement;
    mirrorText.style.color = mode === MODE_KIND ? "#00f0ff" : "#ff2a5f";
    diag("STATEMENT: \"" + currentStatement + "\"  (energy: " + energy.toFixed(2) + ")");
  }

  function updateMoodDisplay() {
    var avg = moodState.avgLum;
    var ctr = moodState.contrast;
    var energy = avg * 0.4 + ctr * 0.35 + moodState.motion * 10 * 0.25;

    tmLumen.textContent = (avg * 100).toFixed(0) + "%";

    var moodLabel = "NEUTRAL";
    var moodColor = "#64748b";
    if (energy > 0.70) { moodLabel = "RADIANT"; moodColor = "#00ff88"; }
    else if (energy > 0.55) { moodLabel = "BRIGHT"; moodColor = "#00f0ff"; }
    else if (energy > 0.40) { moodLabel = "CALM"; moodColor = "#94a3b8"; }
    else if (energy > 0.25) { moodLabel = "SUBDUED"; moodColor = "#f59e0b"; }
    else { moodLabel = "DIM"; moodColor = "#ef4444"; }
    tmMood.textContent = moodLabel;
    tmMood.style.color = moodColor;
  }

  /* ─── ASCII + Mesh render ──────────────────────────── */
  function renderFrame(grid) {
    var cw = canvas.width, ch = canvas.height;
    var cellW = cw / GRID_W, cellH = ch / GRID_H;
    var fontSize = Math.min(cellW * 0.85, cellH * 1.1);
    var charMode = mode === MODE_KIND;

    ctx.fillStyle = "#030508";
    ctx.fillRect(0, 0, cw, ch);

    /* -- ASCII layer -- */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = fontSize + "px Consolas, 'Courier New', monospace";

    var rampLen = CHAR_RAMP.length;

    for (var y = 0; y < GRID_H; y++) {
      for (var x = 0; x < GRID_W; x++) {
        var lum = grid[y][x];
        var ci = Math.floor(lum * (rampLen - 1));
        ci = Math.max(0, Math.min(rampLen - 1, ci));
        var char = CHAR_RAMP[ci];

        /* Color: from base to hot depending on luminance + mode */
        var intensity = 0.3 + lum * 0.7;
        var r, g, b;
        if (charMode) {
          /* Kind: cyan-teal palette */
          r = Math.floor(0 * intensity);
          g = Math.floor(200 * intensity + 40 * (1 - intensity));
          b = Math.floor(255 * intensity);
        } else {
          /* Sarcastic: hot pink / magenta palette */
          r = Math.floor(255 * intensity);
          g = Math.floor(30 * intensity + 80 * (1 - intensity));
          b = Math.floor(160 * intensity + 180 * (1 - intensity));
        }

        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.fillText(char, x * cellW + cellW / 2, y * cellH + cellH / 2);
      }
    }

    /* -- Mesh overlay (coarser grid) -- */
    var meshStep = 6;
    var meshColor = charMode ? "rgba(0,240,255," : "rgba(255,42,95,";
    var offX = cellW / 2, offY = cellH / 2;

    for (var y = 0; y < GRID_H - meshStep; y += meshStep) {
      for (var x = 0; x < GRID_W - meshStep; x += meshStep) {
        /* Determine mesh visibility from local brightness variation */
        var localAvg = 0, localCount = 0;
        for (var dy = 0; dy < meshStep; dy++) {
          for (var dx = 0; dx < meshStep; dx++) {
            localAvg += grid[y + dy][x + dx];
            localCount++;
          }
        }
        localAvg = localAvg / localCount;
        var alpha = Math.max(0.04, localAvg * 0.28);
        var color = meshColor + alpha.toFixed(3) + ")";

        var x1 = x * cellW + offX, y1 = y * cellH + offY;
        var x2 = (x + meshStep) * cellW + offX;
        var y2 = (y + meshStep) * cellH + offY;

        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x1, y2);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        /* Diagonal cross-lines for mesh tessellation */
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
        ctx.stroke();
      }
    }
  }

  /* ─── Game loop ─────────────────────────────────────── */
  function loop(ts) {
    if (!ts) ts = performance.now();

    if (frozen) {
      animId = requestAnimationFrame(loop);
      return;
    }

    if (needsResize) resizeCanvas();
    if (canvas.width === 0 || canvas.height === 0) {
      animId = requestAnimationFrame(loop);
      return;
    }

    /* FPS tracking */
    frameCount++;
    if (ts - fpsTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      fpsTime = ts;
      tmFps.textContent = fps;
    }

    /* Sample grid */
    var grid = sampleGrid();

    /* Render */
    renderFrame(grid);

    /* Mood & statement */
    updateMoodDisplay();

    if (ts - lastStatementChange > statementInterval) {
      lastStatementChange = ts;
      pickStatement();
    }

    /* Initial statement if not set */
    if (!currentStatement) {
      currentStatement = mode === MODE_KIND ? KIND_STATEMENTS[0] : SARCASTIC_STATEMENTS[0];
      mirrorText.textContent = currentStatement;
      mirrorText.style.color = mode === MODE_KIND ? "#00f0ff" : "#ff2a5f";
    }

    animId = requestAnimationFrame(loop);
  }

  /* ─── Events ────────────────────────────────────────── */
  function bindEvents() {
    authBtn.addEventListener("click", initCamera);

    modeBtn.addEventListener("click", function () {
      mode = (mode === MODE_KIND) ? MODE_SARCASTIC : MODE_KIND;
      var label = mode === MODE_KIND ? "MODE: KIND" : "MODE: SARCASTIC";
      modeBtn.textContent = label;
      modeBtn.setAttribute("data-mode", mode);
      diag("MODE: switched to " + mode.toUpperCase());
      /* Force new statement immediately */
      lastStatementChange = 0;
      currentStatement = "";
      mirrorText.style.color = mode === MODE_KIND ? "#00f0ff" : "#ff2a5f";
    });

    freezeBtn.addEventListener("click", function () {
      frozen = !frozen;
      freezeBtn.textContent = frozen ? "UNFREEZE" : "FREEZE";
      freezeBtn.style.borderColor = frozen ? "rgba(255,213,79,0.2)" : "rgba(255,255,255,0.04)";
      freezeBtn.style.color = frozen ? "#ffd54f" : "#475569";
      diag(frozen ? "ANALYSIS: frozen" : "ANALYSIS: resumed");
    });

    window.addEventListener("resize", function () {
      needsResize = true;
    });
  }

  /* ─── Init ──────────────────────────────────────────── */
  function init() {
    bindEvents();
    diag("SYSTEM: Camera Mirror v2.4 initialized");
    diag("GRID: " + GRID_W + "x" + GRID_H + " (" + CHAR_RAMP.length + "-char ramp)");
    diag("MODE: " + mode.toUpperCase());
    diag("AWAITING: camera authorization");
  }

  init();
})();
