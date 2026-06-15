(function () {
  "use strict";

  /* ─── Config ───────────────────────────────────────── */
  var SVG_NS = "http://www.w3.org/2000/svg";

  var THEMES = [
    ["#00f0ff", "#ff2a5f"],
    ["#00ff88", "#ffd700"],
    ["#6a5acd", "#ff69b4"],
    ["#64748b", "#e2e8f0"],
  ];

  /* ─── DOM refs ─────────────────────────────────────── */
  var svg         = document.getElementById("mandalaSVG");
  var drawLayer   = document.getElementById("drawLayer");
  var splash      = document.getElementById("splash");
  var appEl       = document.getElementById("app");
  var micBtn      = document.getElementById("micBtn");
  var skipBtn     = document.getElementById("skipBtn");
  var micStatus   = document.getElementById("micStatus");
  var symSlider   = document.getElementById("symSlider");
  var symVal      = document.getElementById("symVal");
  var strokeSlider= document.getElementById("strokeSlider");
  var strokeVal   = document.getElementById("strokeVal");
  var themeSelect = document.getElementById("themeSelect");
  var mirrorToggle= document.getElementById("mirrorToggle");
  var clearBtn    = document.getElementById("clearBtn");
  var exportBtn   = document.getElementById("exportBtn");
  var stFreq      = document.getElementById("stFreq");
  var stDrive     = document.getElementById("stDrive");
  var stPaths     = document.getElementById("stPaths");
  var stMode      = document.getElementById("stMode");

  /* ─── State ────────────────────────────────────────── */
  var cx = 0, cy = 0;                /* viewport center */
  var drawing = false;
  var lastX = 0, lastY = 0;
  var symmetry   = 8;
  var strokeW    = 1.5;
  var mirrored   = false;
  var themeIdx   = 0;
  var pathCount  = 0;

  /* Audio state */
  var audioCtx   = null;
  var analyser   = null;
  var audioData  = null;
  var audioReady = false;
  var audioMode  = "silent";         /* silent | mic | fallback */
  var fallbackTime = 0;

  /* ─── Center sync ─────────────────────────────────── */
  function syncCenter() {
    var r = svg.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + r.width + " " + r.height);
    cx = r.width / 2;
    cy = r.height / 2;
  }

  /* ─── Drawing ──────────────────────────────────────── */
  function getSVGPoint(e) {
    var r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function addPath(x1, y1, x2, y2) {
    var dx = x1 - cx, dy = y1 - cy;
    var dx2 = x2 - cx, dy2 = y2 - cy;
    var N = symmetry;
    var mirror = mirrored;
    var theme = THEMES[themeIdx];
    var stroke = strokeW;

    /* Audio modulation */
    if (audioData) {
      var bass = 0, mid = 0, high = 0;
      for (var i = 0; i < 6; i++) bass   += audioData[i];
      for (var i = 6; i < 20; i++) mid    += audioData[i];
      for (var i = 20; i < 40; i++) high  += audioData[i];
      bass   = bass   / (6 * 255);
      mid    = mid    / (14 * 255);
      high   = high   / (20 * 255);
      stroke = strokeW + mid * 3;
      var hueMix = (bass + high) / 2;
      var t = Math.min(1, hueMix * 1.5);
      theme = [
        lerpColor(THEMES[themeIdx][0], THEMES[themeIdx][1], t),
        THEMES[themeIdx][1],
      ];
      /* Scale via bass */
      var scale = 1 + bass * 0.3;
      stroke *= scale;
    }

    for (var i = 0; i < N; i++) {
      var theta = i * (2 * Math.PI / N);
      var cosT = Math.cos(theta), sinT = Math.sin(theta);

      /* Rotate (x1,y1) */
      var rx1 = dx * cosT - dy * sinT + cx;
      var ry1 = dx * sinT + dy * cosT + cy;
      /* Rotate (x2,y2) */
      var rx2 = dx2 * cosT - dy2 * sinT + cx;
      var ry2 = dx2 * sinT + dy2 * cosT + cy;

      drawLine(rx1, ry1, rx2, ry2, stroke, theme[0]);

      if (mirror) {
        /* Reflect across sector: negate the angle */
        var mx1 = dx * cosT + dy * sinT + cx;
        var my1 = dx * sinT - dy * cosT + cy;
        var mx2 = dx2 * cosT + dy2 * sinT + cx;
        var my2 = dx2 * sinT - dy2 * cosT + cy;
        drawLine(mx1, my1, mx2, my2, stroke, theme[1]);
      }
    }

    pathCount += mirror ? N * 2 : N;
    stPaths.textContent = pathCount;
  }

  function drawLine(x1, y1, x2, y2, w, color) {
    var line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", w);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("opacity", "0.7");
    drawLayer.appendChild(line);
  }

  function lerpColor(c1, c2, t) {
    var r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
    var r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
    var r = Math.round(r1 + (r2 - r1) * t);
    var g = Math.round(g1 + (g2 - g1) * t);
    var b = Math.round(b1 + (b2 - b1) * t);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /* ─── Mouse events ─────────────────────────────────── */
  function onDown(e) {
    drawing = true;
    var p = getSVGPoint(e);
    lastX = p.x; lastY = p.y;
  }

  function onMove(e) {
    if (!drawing) return;
    var p = getSVGPoint(e);
    addPath(lastX, lastY, p.x, p.y);
    lastX = p.x; lastY = p.y;
  }

  function onUp() { drawing = false; }

  /* ─── Clear ────────────────────────────────────────── */
  function clearCanvas() {
    drawLayer.innerHTML = "";
    pathCount = 0;
    stPaths.textContent = "0";
  }

  /* ─── Export ───────────────────────────────────────── */
  function exportSVG() {
    var r = svg.getBoundingClientRect();
    var clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", SVG_NS);
    clone.removeAttribute("id");
    clone.setAttribute("width", r.width);
    clone.setAttribute("height", r.height);
    clone.setAttribute("viewBox", "0 0 " + r.width + " " + r.height);
    clone.querySelector("#crosshair") && clone.querySelector("#crosshair").remove();
    /* Remove any non-SVG or unwanted elements */
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(clone);
    source = '<?xml version="1.0" encoding="UTF-8"?>\n' + source;

    var blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "mandala-" + Date.now() + ".svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ─── Audio init ──────────────────────────────────── */
  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      audioData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      return false;
    }
    return true;
  }

  function startMic() {
    if (!initAudio()) {
      micStatus.textContent = "ERROR: AudioContext not supported";
      micStatus.style.color = "#ef4444";
      return;
    }
    micStatus.textContent = "REQUESTING MIC…";
    micStatus.style.color = "#f59e0b";

    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
      var src = audioCtx.createMediaStreamSource(stream);
      src.connect(analyser);
      audioReady = true;
      audioMode = "mic";
      stMode.textContent = "MIC";
      stMode.style.color = "#00ff88";
      splash.classList.add("hidden");
      appEl.classList.remove("hidden");
      syncCenter();
    })
    .catch(function (err) {
      micStatus.textContent = "DENIED: " + err.message;
      micStatus.style.color = "#ef4444";
      startFallbackAudio();
    });
  }

  function startFallbackAudio() {
    if (!initAudio()) return;
    audioReady = true;
    audioMode = "fallback";
    stMode.textContent = "FALLBACK";
    stMode.style.color = "#f59e0b";

    /* Synthetic data generator */
    function genFallback() {
      if (!audioData) return;
      for (var i = 0; i < audioData.length; i++) {
        var t = performance.now() / 1000;
        var val = Math.abs(Math.sin(t * (2 + i * 0.3)) * 128 + Math.sin(t * (5 + i * 0.1)) * 64 + Math.random() * 20);
        audioData[i] = Math.min(255, Math.max(0, val | 0));
      }
      if (audioReady) requestAnimationFrame(genFallback);
    }
    genFallback();

    splash.classList.add("hidden");
    appEl.classList.remove("hidden");
    syncCenter();
  }

  function skipAudio() {
    audioMode = "silent";
    stMode.textContent = "SILENT";
    stMode.style.color = "#64748b";
    splash.classList.add("hidden");
    appEl.classList.remove("hidden");
    syncCenter();
  }

  /* ─── Audio-driven reactive loop ──────────────────── */
  var audioLoopFrame = null;

  function audioLoop() {
    if (!audioReady || !analyser || !audioData) {
      audioLoopFrame = requestAnimationFrame(audioLoop);
      return;
    }
    analyser.getByteFrequencyData(audioData);

    var bass = 0, total = 0;
    for (var i = 0; i < 10; i++) bass += audioData[i];
    for (var i = 0; i < audioData.length; i++) total += audioData[i];
    bass = bass / (10 * 255);
    var avg = total / (audioData.length * 255);

    /* Status updates */
    stDrive.textContent = Math.round(avg * 100) + "%";

    /* Find dominant frequency bin */
    var maxIdx = 0;
    for (var i = 1; i < audioData.length; i++) {
      if (audioData[i] > audioData[maxIdx]) maxIdx = i;
    }
    var freq = maxIdx * (audioCtx ? audioCtx.sampleRate / 2 / analyser.frequencyBinCount : 0);
    stFreq.textContent = freq.toFixed(0) + " Hz";

    /* Reactive fallback drawing */
    if (audioMode === "fallback" && !drawing) {
      fallbackTime += 0.02;
      var r1 = Math.min(cx, cy) * 0.4;
      var angleStep = (2 * Math.PI) / symmetry;
      var rad = r1 * (0.3 + avg * 0.7);
      for (var i = 0; i < symmetry; i++) {
        var a1 = fallbackTime + i * angleStep + avg * 0.5;
        var a2 = fallbackTime + (i + 0.3) * angleStep + avg * 1.2;
        var x1 = cx + Math.cos(a1) * rad * (0.5 + bass * 0.5);
        var y1 = cy + Math.sin(a1) * rad * (0.5 + bass * 0.5);
        var x2 = cx + Math.cos(a2) * rad * (0.6 + avg * 0.4);
        var y2 = cy + Math.sin(a2) * rad * (0.6 + avg * 0.4);
        var t = Math.min(1, avg * 2);
        var color = lerpColor(THEMES[themeIdx][0], THEMES[themeIdx][1], t);
        drawLine(x1, y1, x2, y2, strokeW + avg * 2, color);
        pathCount++;
      }
      stPaths.textContent = pathCount;

      /* Prune if too many paths (keep last 2000) */
      while (drawLayer.childNodes.length > 2000 && drawLayer.firstChild) {
        drawLayer.removeChild(drawLayer.firstChild);
        pathCount--;
      }
      stPaths.textContent = pathCount;
    }

    audioLoopFrame = requestAnimationFrame(audioLoop);
  }

  /* ─── Events ───────────────────────────────────────── */
  function bindEvents() {
    micBtn.addEventListener("click", startMic);
    skipBtn.addEventListener("click", skipAudio);

    /* SVG drawing */
    svg.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);

    /* Touch */
    svg.addEventListener("touchstart", function (e) {
      e.preventDefault();
      var t = e.touches[0];
      onDown(t);
    });
    document.addEventListener("touchmove", function (e) {
      if (!drawing) return;
      e.preventDefault();
      var t = e.touches[0];
      onMove(t);
    });
    document.addEventListener("touchend", onUp);

    /* Controls */
    symSlider.addEventListener("input", function () {
      symmetry = parseInt(this.value, 10);
      symVal.textContent = symmetry;
    });
    strokeSlider.addEventListener("input", function () {
      strokeW = parseFloat(this.value);
      strokeVal.textContent = strokeW.toFixed(1);
    });
    themeSelect.addEventListener("change", function () {
      themeIdx = parseInt(this.value, 10);
    });
    mirrorToggle.addEventListener("change", function () {
      mirrored = this.checked;
    });
    clearBtn.addEventListener("click", clearCanvas);
    exportBtn.addEventListener("click", exportSVG);

    window.addEventListener("resize", syncCenter);
  }

  /* ─── Init ─────────────────────────────────────────── */
  function init() {
    bindEvents();
    /* Hidden canvas for initial center */
    syncCenter();
    /* Start background audio loop */
    audioLoop();
  }

  init();
})();
