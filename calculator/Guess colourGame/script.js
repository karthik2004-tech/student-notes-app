(function () {
  "use strict";

  var swatchGrid = document.getElementById("swatchGrid");
  var targetCode = document.getElementById("targetCode");
  var targetPanel = document.getElementById("targetPanel");
  var streakVal  = document.getElementById("streakVal");
  var bestVal    = document.getElementById("bestVal");
  var statusHint = document.getElementById("statusHint");
  var resetBtn   = document.getElementById("resetBtn");
  var nextBtn    = document.getElementById("nextBtn");
  var fmtBtns    = document.querySelectorAll(".fmtBtn");
  var diffBtns   = document.querySelectorAll(".diffBtn");

  var SWATCH_COUNT = { easy: 3, hard: 6 };
  var HARD_OFFSET  = 20;

  var format = "rgb";
  var difficulty = "easy";
  var swatchCount = 3;
  var target = { r: 0, g: 0, b: 0 };
  var streak = 0;
  var best   = 0;
  var locked = false;

  /* ─── localStorage ────────────────────────────── */
  function loadBest() {
    var v = localStorage.getItem("gcBest");
    best = v ? parseInt(v, 10) : 0;
    bestVal.textContent = best;
  }
  function saveBest() {
    if (streak > best) {
      best = streak;
      localStorage.setItem("gcBest", best);
      bestVal.textContent = best;
    }
  }

  /* ─── Color helpers ───────────────────────────── */
  function rand255() { return Math.floor(Math.random() * 256); }
  function clamp(v) { return Math.max(0, Math.min(255, v)); }

  function toRGB(c) { return "rgb(" + c.r + ", " + c.g + ", " + c.b + ")"; }
  function toHex(c) {
    var hr = c.r.toString(16).padStart(2, "0");
    var hg = c.g.toString(16).padStart(2, "0");
    var hb = c.b.toString(16).padStart(2, "0");
    return "#" + hr + hg + hb;
  }

  function formatColor(c) {
    return format === "rgb" ? toRGB(c) : toHex(c);
  }

  /* ─── Decoy generation ────────────────────────── */
  function generateDecoys() {
    var colors = [];
    colors.push({ r: target.r, g: target.g, b: target.b });

    var count = swatchCount - 1;
    for (var i = 0; i < count; i++) {
      if (difficulty === "easy") {
        colors.push({ r: rand255(), g: rand255(), b: rand255() });
      } else {
        /* Hard: proximity offsets */
        var offset = function () { return Math.floor((Math.random() - 0.5) * 2 * HARD_OFFSET); };
        colors.push({
          r: clamp(target.r + offset()),
          g: clamp(target.g + offset()),
          b: clamp(target.b + offset()),
        });
      }
    }

    /* Fisher-Yates shuffle */
    for (var j = colors.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = colors[j]; colors[j] = colors[k]; colors[k] = tmp;
    }

    return colors;
  }

  /* ─── Render swatches ─────────────────────────── */
  function renderSwatches(colors) {
    swatchGrid.innerHTML = "";

    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      var el = document.createElement("div");
      el.className = "swatch";
      el.style.background = toRGB(c);

      (function (clr) {
        el.addEventListener("click", function () { evaluate(clr, el); });
      })(c);

      swatchGrid.appendChild(el);
    }
  }

  /* ─── New round ───────────────────────────────── */
  function newRound() {
    locked = false;
    nextBtn.classList.add("hidden");
    targetPanel.classList.remove("pulse");
    targetCode.classList.remove("reveal");
    statusHint.textContent = "Pick a colour";
    statusHint.className = "hint";

    target = { r: rand255(), g: rand255(), b: rand255() };
    targetCode.textContent = formatColor(target);

    var colors = generateDecoys();
    renderSwatches(colors);
  }

  /* ─── Evaluate ────────────────────────────────── */
  function evaluate(clicked, el) {
    if (locked) return;

    var isCorrect = clicked.r === target.r && clicked.g === target.g && clicked.b === target.b;

    if (isCorrect) {
      locked = true;
      streak++;
      streakVal.textContent = streak;
      saveBest();

      statusHint.textContent = "CORRECT!";
      statusHint.className = "hint correct";

      /* Reveal all swatches to target colour */
      var all = swatchGrid.querySelectorAll(".swatch");
      for (var i = 0; i < all.length; i++) {
        all[i].style.background = format === "rgb" ? toRGB(target) : formatColor(target);
        all[i].classList.add("revealAll", "locked");
      }

      targetCode.classList.add("reveal");
      targetPanel.classList.remove("pulse");
      void targetPanel.offsetWidth;
      targetPanel.classList.add("pulse");

      nextBtn.classList.remove("hidden");
    } else {
      el.classList.add("fade");
      statusHint.textContent = "Wrong!";
      statusHint.className = "hint wrong";

      streak = 0;
      streakVal.textContent = "0";
    }
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetGame() {
    streak = 0;
    streakVal.textContent = "0";
    saveBest();
    newRound();
  }

  /* ─── Events ──────────────────────────────────── */
  function bindEvents() {
    resetBtn.addEventListener("click", resetGame);
    nextBtn.addEventListener("click", newRound);

    fmtBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        fmtBtns.forEach(function (x) { x.classList.remove("active"); });
        this.classList.add("active");
        format = this.getAttribute("data-fmt");
        if (!locked) newRound(); else {
          targetCode.textContent = formatColor(target);
          /* Also update swatch display colors for format switch */
          var all = swatchGrid.querySelectorAll(".swatch");
          if (all.length > 0 && all[0].classList.contains("locked")) {
            for (var i = 0; i < all.length; i++) {
              all[i].style.background = format === "rgb" ? toRGB(target) : formatColor(target);
            }
          }
        }
      });
    });

    diffBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        diffBtns.forEach(function (x) { x.classList.remove("active"); });
        this.classList.add("active");
        difficulty = this.getAttribute("data-diff");
        swatchCount = SWATCH_COUNT[difficulty];
        swatchGrid.className = difficulty;
        newRound();
      });
    });
  }

  /* ─── Boot ────────────────────────────────────── */
  loadBest();
  swatchGrid.className = "easy";
  bindEvents();
  newRound();
})();
