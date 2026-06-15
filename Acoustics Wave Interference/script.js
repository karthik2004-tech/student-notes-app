(function () {
  "use strict";

  var canvas    = document.getElementById("waveCanvas");
  var ctx       = canvas.getContext("2d");
  var ampVal    = document.getElementById("ampVal");
  var conVal    = document.getElementById("conVal");
  var phaseVal  = document.getElementById("phaseVal");
  var pauseBtn  = document.getElementById("pauseBtn");
  var resetBtn  = document.getElementById("resetBtn");
  var hint      = document.getElementById("hint");

  var freqSlider  = document.getElementById("freqSlider");
  var kSlider     = document.getElementById("kSlider");
  var sepSlider   = document.getElementById("sepSlider");
  var resSlider   = document.getElementById("resSlider");

  /* ─── State ──────────────────────────────────── */
  var W, H, cx, cy;
  var omega = 6, k = 0.06, separation = 120, resScale = 3;
  var t = 0, paused = false;
  var reqId;
  var src1x, src1y, src2x, src2y;

  /* Source that follows cursor on click */
  var activeSource = 1; /* which source to move on click */

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    syncCanvas();
  }

  function syncCanvas() {
    var step = resScale;
    var iw = Math.max(1, Math.floor(W / step));
    var ih = Math.max(1, Math.floor(H / step));
    canvas.width  = iw;
    canvas.height = ih;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    cx = iw / 2; cy = ih / 2;
    updateSources();
  }

  function updateSources() {
    var step = resScale;
    var sep = separation / step;
    src1x = cx - sep / 2; src1y = cy;
    src2x = cx + sep / 2; src2y = cy;
  }

  window.addEventListener("resize", resize);

  /* ─── Pixel buffer render ────────────────────── */
  function render() {
    var step = resScale;
    var iw = canvas.width, ih = canvas.height;
    var imageData = ctx.createImageData(iw, ih);
    var data = imageData.data;

    var w = omega;

    /* Background RGB */
    var br = 3, bg = 5, bb = 9;

    /* Sample counters for telemetry */
    var sampleCount = 0;
    var peakSum = 0;
    var constructiveCount = 0;
    var totalSamples = 0;

    for (var py = 0; py < ih; py++) {
      for (var px = 0; px < iw; px++) {
        var idx = (py * iw + px) * 4;

        /* Distances to sources */
        var dx1 = px - src1x, dy1 = py - src1y;
        var dx2 = px - src2x, dy2 = py - src2y;
        var r1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        var r2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        /* Wave superposition */
        var y1 = Math.sin(k * r1 - w * t);
        var y2 = Math.sin(k * r2 - w * t);
        var Y = y1 + y2; /* ∈ [-2, 2] */

        /* Color mapping */
        var r, g, b;
        if (Y > 0) {
          var tFactor = Y / 2;
          r = br + (0 - br) * tFactor;
          g = bg + (240 - bg) * tFactor;
          b = bb + (255 - bb) * tFactor;
        } else {
          var tFactor = -Y / 2;
          r = br + (255 - br) * tFactor;
          g = bg + (42 - bg) * tFactor;
          b = bb + (95 - bb) * tFactor;
        }

        data[idx]     = Math.round(Math.max(0, Math.min(255, r)));
        data[idx + 1] = Math.round(Math.max(0, Math.min(255, g)));
        data[idx + 2] = Math.round(Math.max(0, Math.min(255, b)));
        data[idx + 3] = 255;

        /* Telemetry sampling (~1% of pixels) */
        if (totalSamples % 100 === 0) {
          var absY = Math.abs(Y);
          peakSum += absY;
          sampleCount++;
          if (absY > 1) constructiveCount++;
        }
        totalSamples++;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    /* Compute telemetry */
    if (sampleCount > 0) {
      ampVal.textContent   = (peakSum / sampleCount).toFixed(2);
      conVal.textContent   = ((constructiveCount / sampleCount) * 100).toFixed(0) + "%";
    }
    phaseVal.textContent = (w / (k || 0.001)).toFixed(1);
  }

  /* ─── Loop ────────────────────────────────────── */
  function loop() {
    if (!paused) t += 0.05;
    render();
    reqId = requestAnimationFrame(loop);
  }

  /* ─── Source repositioning ───────────────────── */
  function repositionSource(mx, my) {
    var step = resScale;
    var iw = canvas.width, ih = canvas.height;
    /* Map click to internal canvas coords */
    var rect = canvas.getBoundingClientRect();
    var sx = (mx / rect.width) * iw;
    var sy = (my / rect.height) * ih;

    if (activeSource === 1) {
      src1x = Math.max(0, Math.min(iw, sx));
      src1y = Math.max(0, Math.min(ih, sy));
      activeSource = 2;
    } else {
      src2x = Math.max(0, Math.min(iw, sx));
      src2y = Math.max(0, Math.min(ih, sy));
      activeSource = 1;
    }
  }

  /* ─── Pause / Reset ──────────────────────────── */
  function togglePause() {
    paused = !paused;
    pauseBtn.textContent = paused ? "RESUME" : "FREEZE";
  }

  function resetVectors() {
    t = 0;
    paused = false;
    pauseBtn.textContent = "FREEZE";
    updateSources();
  }

  /* ─── Input ───────────────────────────────────── */
  function bindEvents() {
    canvas.addEventListener("click", function (e) {
      var rect = canvas.getBoundingClientRect();
      repositionSource(e.clientX - rect.left, e.clientY - rect.top);
    });

    pauseBtn.addEventListener("click", togglePause);
    resetBtn.addEventListener("click", resetVectors);

    freqSlider.addEventListener("input", function () {
      omega = parseFloat(freqSlider.value);
      document.getElementById("freqVal").textContent = omega.toFixed(1);
    });
    kSlider.addEventListener("input", function () {
      k = parseFloat(kSlider.value);
      document.getElementById("kVal").textContent = k.toFixed(3);
    });
    sepSlider.addEventListener("input", function () {
      separation = parseInt(sepSlider.value, 10);
      document.getElementById("sepVal").textContent = separation;
      updateSources();
    });
    resSlider.addEventListener("input", function () {
      resScale = parseInt(resSlider.value, 10);
      document.getElementById("resVal").textContent = resScale;
      syncCanvas();
    });
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    bindEvents();
    resize();
    loop();
  }

  init();
})();
