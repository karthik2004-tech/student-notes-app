(function () {
  "use strict";

  var canvas    = document.getElementById("terrainCanvas");
  var ctx       = canvas.getContext("2d");
  var ratioVal  = document.getElementById("ratioVal");
  var peakVal2  = document.getElementById("peakVal2");
  var seedVal   = document.getElementById("seedVal");
  var genBtn    = document.getElementById("genBtn");
  var exportBtn = document.getElementById("exportBtn");

  var seaSlider    = document.getElementById("seaSlider");
  var peakSlider   = document.getElementById("peakSlider");
  var noiseSlider  = document.getElementById("noiseSlider");
  var octSlider    = document.getElementById("octSlider");
  var persistSlider= document.getElementById("persistSlider");
  var themeSel     = document.getElementById("themeSel");

  /* ─── State ──────────────────────────────────── */
  var W, H;
  var seed = 0;
  var heightMap = [];

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── Permutation table ──────────────────────── */
  var perm = new Uint8Array(512);

  function initPerm(s) {
    var p = [];
    for (var i = 0; i < 256; i++) p[i] = i;
    /* Seed-based shuffle */
    var rng = s;
    for (var j = 255; j > 0; j--) {
      rng = (rng * 16807 + 0) % 2147483647;
      var k = rng % (j + 1);
      var tmp = p[j]; p[j] = p[k]; p[k] = tmp;
    }
    for (var l = 0; l < 512; l++) perm[l] = p[l & 255];
  }

  /* ─── Gradient ────────────────────────────────── */
  var GRAD = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];

  function dot(g, x, y) { return g[0] * x + g[1] * y; }

  /* ─── Fade (quintic) ──────────────────────────── */
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }

  /* ─── Lerp ────────────────────────────────────── */
  function lerp(a, b, t) { return a + t * (b - a); }

  /* ─── 2D Perlin noise ────────────────────────── */
  function noise(x, y) {
    var xi = Math.floor(x) & 255;
    var yi = Math.floor(y) & 255;
    var xf = x - Math.floor(x);
    var yf = y - Math.floor(y);
    var u = fade(xf), v = fade(yf);

    var aa = perm[perm[xi] + yi];
    var ab = perm[perm[xi] + yi + 1];
    var ba = perm[perm[xi + 1] + yi];
    var bb = perm[perm[xi + 1] + yi + 1];

    var g1 = GRAD[aa % 8], g2 = GRAD[ba % 8], g3 = GRAD[ab % 8], g4 = GRAD[bb % 8];

    var x1 = lerp(dot(g1, xf, yf), dot(g2, xf - 1, yf), u);
    var x2 = lerp(dot(g3, xf, yf - 1), dot(g4, xf - 1, yf - 1), u);
    return lerp(x1, x2, v);
  }

  /* ─── fBm ────────────────────────────────────── */
  function fBm(x, y, octaves, persistence, scale) {
    var value = 0, amplitude = 1, frequency = scale;
    var maxVal = 0;
    for (var i = 0; i < octaves; i++) {
      value += amplitude * noise(x * frequency, y * frequency);
      maxVal += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return value / maxVal; /* Normalize to approx [-1, 1] */
  }

  /* ─── Generate height map ────────────────────── */
  function generate() {
    var seaLevel = parseFloat(seaSlider.value);
    var peakScale = parseFloat(peakSlider.value);
    var noiseScale = parseFloat(noiseSlider.value);
    var octaves = parseInt(octSlider.value, 10);
    var persistence = parseFloat(persistSlider.value);
    var theme = themeSel.value;

    var cx = W / 2, cy = H / 2;
    var maxDist = Math.sqrt(cx * cx + cy * cy);
    var maxHeight = 0;
    var landPixels = 0;

    heightMap = [];
    var imageData = ctx.createImageData(W, H);
    var data = imageData.data;

    var colors = getColorMap(theme);

    for (var py = 0; py < H; py++) {
      heightMap[py] = [];
      for (var px = 0; px < W; px++) {
        var nx = px / W, ny = py / H;
        var raw = fBm(nx, ny, octaves, persistence, noiseScale);
        /* Map from [-1,1] to [0,1] */
        var h = (raw + 1) / 2;
        h = Math.pow(h, peakScale);

        /* Island mask: radial distance from center */
        var dx = px - cx, dy = py - cy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var mask = 1 - (dist / maxDist);
        mask = Math.max(0, Math.min(1, mask * mask * (3 - 2 * mask))); /* smoothstep */
        h *= mask;

        heightMap[py][px] = h;
        if (h > maxHeight) maxHeight = h;
        if (h >= seaLevel) landPixels++;

        /* Color */
        var idx = (py * W + px) * 4;
        var col = sampleColor(h, seaLevel, colors);
        data[idx]     = col[0];
        data[idx + 1] = col[1];
        data[idx + 2] = col[2];
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    /* Telemetry */
    var total = W * H;
    ratioVal.textContent = (landPixels / (total - landPixels)).toFixed(2);
    peakVal2.textContent = maxHeight.toFixed(3);
    seedVal.textContent = seed;
  }

  /* ─── Color maps ──────────────────────────────── */
  function getColorMap(theme) {
    var maps = {
      cyberpunk: {
        deep:   [10, 17, 40],
        shallow:[0, 191, 255],
        sand:   [238, 220, 130],
        plains: [0, 255, 102],
        slope:  [74, 85, 104],
        peak:   [255, 255, 255],
      },
      mars: {
        deep:   [25, 10, 15],
        shallow:[80, 30, 20],
        sand:   [180, 90, 40],
        plains: [200, 100, 60],
        slope:  [160, 70, 50],
        peak:   [255, 220, 180],
      },
      alien: {
        deep:   [10, 5, 30],
        shallow:[80, 0, 100],
        sand:   [120, 80, 200],
        plains: [50, 255, 150],
        slope:  [100, 200, 255],
        peak:   [255, 255, 100],
      },
    };
    return maps[theme] || maps.cyberpunk;
  }

  function sampleColor(h, seaLevel, c) {
    if (h < seaLevel - 0.05) return c.deep;
    if (h < seaLevel) return lerpColor(c.shallow, c.deep, (h - (seaLevel - 0.05)) / 0.05);
    if (h < seaLevel + 0.03) return lerpColor(c.sand, c.shallow, (h - seaLevel) / 0.03);
    if (h < 0.65) return lerpColor(c.plains, c.sand, (h - (seaLevel + 0.03)) / (0.65 - (seaLevel + 0.03)));
    if (h < 0.82) return lerpColor(c.slope, c.plains, (h - 0.65) / 0.17);
    return lerpColor(c.peak, c.slope, (h - 0.82) / 0.18);
  }

  function lerpColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t),
    ];
  }

  /* ─── New seed ────────────────────────────────── */
  function newSeed() {
    seed = Math.floor(Math.random() * 2147483647);
    initPerm(seed);
    generate();
  }

  /* ─── Export ──────────────────────────────────── */
  function exportPNG() {
    var link = document.createElement("a");
    link.download = "terrain_" + seed + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  /* ─── Events ─────────────────────────────────── */
  function bindEvents() {
    genBtn.addEventListener("click", newSeed);
    exportBtn.addEventListener("click", exportPNG);

    var sliders = [
      { el: seaSlider, id: "seaVal", fmt: 3 },
      { el: peakSlider, id: "peakVal", fmt: 2 },
      { el: noiseSlider, id: "noiseVal", fmt: 1 },
      { el: octSlider, id: "octVal", fmt: 0 },
      { el: persistSlider, id: "persistVal", fmt: 2 },
    ];

    var debounce;
    function onSlider() {
      sliders.forEach(function (s) {
        var v = parseFloat(s.el.value);
        document.getElementById(s.id).textContent = v.toFixed(s.fmt);
      });
      clearTimeout(debounce);
      debounce = setTimeout(function () { initPerm(seed); generate(); }, 50);
    }

    sliders.forEach(function (s) { s.el.addEventListener("input", onSlider); });
    themeSel.addEventListener("change", function () { generate(); });
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    bindEvents();
    resize();
    seed = 12345;
    initPerm(seed);
    generate();
  }

  init();
})();
