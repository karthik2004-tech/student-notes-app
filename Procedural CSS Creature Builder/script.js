(function () {
  "use strict";

  /* ─── DOM refs ─────────────────────────────────────── */
  var root   = document.documentElement;
  var viewport = document.getElementById("viewport");
  var torso    = document.getElementById("torso");
  var eyesEl   = document.getElementById("eyes");
  var legsEl   = document.getElementById("legs");
  var dnaDisp  = document.getElementById("dnaDisplay");

  /* Sliders */
  var sliders = {
    bodyScale:  { el: document.getElementById("bodyScale"),  val: document.getElementById("bodyScaleVal"),  css: "--body-scale",  map: function (v) { return v / 100; },    fmt: function (v) { return v + "%"; } },
    hue:        { el: document.getElementById("hue"),        val: document.getElementById("hueVal"),        css: "--creature-hue", map: function (v) { return v; },          fmt: function (v) { return v + "\u00B0"; } },
    eyeCount:   { el: document.getElementById("eyeCount"),   val: document.getElementById("eyeCountVal"),   css: null,            map: function (v) { return v; },          fmt: function (v) { return v; } },
    eyeSize:    { el: document.getElementById("eyeSize"),    val: document.getElementById("eyeSizeVal"),    css: "--eye-scale",   map: function (v) { return v / 100; },    fmt: function (v) { return v + "%"; } },
    limbCount:  { el: document.getElementById("limbCount"),  val: document.getElementById("limbCountVal"),  css: null,            map: function (v) { return v; },          fmt: function (v) { return v; } },
    animSpeed:  { el: document.getElementById("animSpeed"),  val: document.getElementById("animSpeedVal"),  css: "--anim-speed",  map: function (v) { return v / 100; },    fmt: function (v) { return (v / 100).toFixed(1) + "x"; } },
  };

  /* Telemetry */
  var tmBody  = document.getElementById("tmBody");
  var tmHue   = document.getElementById("tmHue");
  var tmEyes  = document.getElementById("tmEyes");
  var tmLimbs = document.getElementById("tmLimbs");

  /* Buttons */
  var randomBtn = document.getElementById("randomizeBtn");
  var copyBtn   = document.getElementById("copyBtn");

  /* ─── Value cache ──────────────────────────────────── */
  var vals = {};

  /* ─── Eye builder ──────────────────────────────────── */
  function buildEyes(count) {
    eyesEl.innerHTML = "";
    if (count < 1) return;

    var padding = 18;
    var avail   = 100 - padding * 2;
    var spacing = count > 1 ? avail / (count - 1) : 0;

    for (var i = 0; i < count; i++) {
      var el = document.createElement("div");
      el.className = "eye";
      var left = count > 1 ? padding + i * spacing : 50;
      el.style.left = left + "%";
      el.style.top  = "35%";
      eyesEl.appendChild(el);
    }
  }

  /* ─── Limb builder ─────────────────────────────────── */
  function buildLimbs(count) {
    legsEl.innerHTML = "";
    if (count < 1) return;

    var cycle = 0.9;
    for (var i = 0; i < count; i++) {
      var el = document.createElement("div");
      el.className = "leg";
      el.style.animationDelay = (i * (cycle / count)) + "s";
      legsEl.appendChild(el);
    }
  }

  /* ─── Update from slider values ────────────────────── */
  function updateCreature() {
    var bodyScaleRaw  = parseInt(sliders.bodyScale.el.value,  10);
    var hueRaw        = parseInt(sliders.hue.el.value,        10);
    var eyeCountRaw   = parseInt(sliders.eyeCount.el.value,   10);
    var eyeSizeRaw    = parseInt(sliders.eyeSize.el.value,    10);
    var limbCountRaw  = parseInt(sliders.limbCount.el.value,  10);
    var animSpeedRaw  = parseInt(sliders.animSpeed.el.value,  10);

    /* Cache */
    vals.bodyScale  = bodyScaleRaw;
    vals.hue        = hueRaw;
    vals.eyeCount   = eyeCountRaw;
    vals.eyeSize    = eyeSizeRaw;
    vals.limbCount  = limbCountRaw;
    vals.animSpeed  = animSpeedRaw;

    /* Display values */
    sliders.bodyScale.val.textContent = sliders.bodyScale.fmt(bodyScaleRaw);
    sliders.hue.val.textContent       = sliders.hue.fmt(hueRaw);
    sliders.eyeCount.val.textContent  = sliders.eyeCount.fmt(eyeCountRaw);
    sliders.eyeSize.val.textContent   = sliders.eyeSize.fmt(eyeSizeRaw);
    sliders.limbCount.val.textContent = sliders.limbCount.fmt(limbCountRaw);
    sliders.animSpeed.val.textContent = sliders.animSpeed.fmt(animSpeedRaw);

    /* CSS custom properties */
    root.style.setProperty("--body-scale",  sliders.bodyScale.map(bodyScaleRaw));
    root.style.setProperty("--creature-hue", sliders.hue.map(hueRaw));
    root.style.setProperty("--eye-scale",   sliders.eyeSize.map(eyeSizeRaw));
    root.style.setProperty("--anim-speed",  sliders.animSpeed.map(animSpeedRaw));

    /* Accent color follows hue */
    var accent = "hsl(" + hueRaw + ", 70%, 55%)";
    root.style.setProperty("--accent", accent);

    /* Rebuild variable-count parts */
    buildEyes(eyeCountRaw);
    buildLimbs(limbCountRaw);

    /* DNA string */
    var dna = serializeDNA();
    dnaDisp.textContent = dna;

    /* Telemetry */
    tmBody.textContent  = bodyScaleRaw + "%";
    tmHue.textContent   = hueRaw + "\u00B0";
    tmEyes.textContent  = eyeCountRaw;
    tmLimbs.textContent = limbCountRaw;
  }

  /* ─── DNA serializer ───────────────────────────────── */
  function serializeDNA() {
    return "B" + vals.bodyScale +
           "-H" + vals.hue +
           "-E" + vals.eyeCount +
           "-S" + vals.eyeSize +
           "-L" + vals.limbCount +
           "-A" + vals.animSpeed;
  }

  /* ─── Random mutation ──────────────────────────────── */
  function randomInt(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function randomize() {
    setSlider("bodyScale", randomInt(30, 180));
    setSlider("hue",       randomInt(0, 360));
    setSlider("eyeCount",  randomInt(1, 10));
    setSlider("eyeSize",   randomInt(30, 200));
    setSlider("limbCount", randomInt(2, 12));
    setSlider("animSpeed", randomInt(20, 250));
  }

  function setSlider(name, value) {
    var s = sliders[name];
    if (!s) return;
    s.el.value = value;
    /* Dispatch input event to trigger handler */
    var evt = new Event("input", { bubbles: true });
    s.el.dispatchEvent(evt);
  }

  /* ─── Events ───────────────────────────────────────── */
  function bindEvents() {
    /* All sliders */
    var keys = Object.keys(sliders);
    for (var i = 0; i < keys.length; i++) {
      (function (key) {
        sliders[key].el.addEventListener("input", updateCreature);
      })(keys[i]);
    }

    /* Randomize */
    randomBtn.addEventListener("click", randomize);

    /* Copy DNA */
    copyBtn.addEventListener("click", function () {
      var text = dnaDisp.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          dnaDisp.style.color = "#00ff88";
          setTimeout(function () { dnaDisp.style.color = ""; }, 600);
        });
      } else {
        /* Fallback */
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        dnaDisp.style.color = "#00ff88";
        setTimeout(function () { dnaDisp.style.color = ""; }, 600);
      }
    });

    /* Window resize – keep creature centered */
    window.addEventListener("resize", function () { /* no-op; CSS handles it */ });
  }

  /* ─── Init ─────────────────────────────────────────── */
  function init() {
    bindEvents();
    /* Initial build */
    updateCreature();
  }

  init();
})();
