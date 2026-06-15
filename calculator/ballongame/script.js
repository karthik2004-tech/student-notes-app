(function () {
  "use strict";

  var GAME_DURATION = 45;
  var BASE_SPAWN   = 1200;
  var BASE_FLOAT   = 4000;
  var DIFF_SCORE   = 40;

  var COLORS = [
    "#ff2a5f", "#00f0ff", "#a855f7", "#ffd700", "#00ff88",
    "#f97316", "#ec4899", "#06b6d4", "#84cc16", "#f43f5e",
  ];

  var sky       = document.getElementById("sky");
  var scoreVal  = document.getElementById("scoreVal");
  var multiVal  = document.getElementById("multiVal");
  var timeVal   = document.getElementById("timeVal");
  var bestVal   = document.getElementById("bestVal");
  var startOverlay = document.getElementById("startOverlay");
  var startBtn  = document.getElementById("startBtn");
  var modal     = document.getElementById("modal");
  var mbStats   = document.getElementById("mbStats");
  var restartBtn= document.getElementById("restartBtn");

  var score     = 0;
  var popped    = 0;
  var missed    = 0;
  var multi     = 1;
  var best      = parseInt(localStorage.getItem("bpBest") || "0", 10);
  var timeLeft  = GAME_DURATION;
  var running   = false;
  var spawnTimer= null;
  var clockTimer= null;
  var balloonId = 0;

  bestVal.textContent = best;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function getDifficulty() {
    var tier = Math.floor(score / DIFF_SCORE);
    return {
      spawnMs: Math.max(200, BASE_SPAWN - tier * 50),
      floatMs: Math.max(1200, BASE_FLOAT - tier * 100),
      multi:   1 + tier * 0.15,
    };
  }

  function spawnBalloon() {
    if (!running) return;
    var diff = getDifficulty();
    var w = sky.clientWidth;
    var h = sky.clientHeight;

    var size  = rand(28, 56);
    var x     = rand(size, w - size);
    var id    = balloonId++;

    var el = document.createElement("div");
    el.className = "balloon";
    el.dataset.id = id;
    el.dataset.popped = "false";
    el.style.width  = size + "px";
    el.style.height = size + "px";
    el.style.left   = x + "px";
    el.style.bottom = -size + "px";

    var color = COLORS[id % COLORS.length];
    var body = document.createElement("div");
    body.className = "balloon-body";
    body.style.background = "radial-gradient(circle at 35% 30%, " + lighten(color, 30) + ", " + color + ")";
    body.style.boxShadow = "0 0 " + (size * 0.3) + "px " + color + "40, inset 0 -2px 4px rgba(0,0,0,0.15)";
    el.appendChild(body);

    var str = document.createElement("div");
    str.className = "balloon-string";
    str.style.background = color;
    el.appendChild(str);

    el.addEventListener("click", function (e) {
      e.stopPropagation();
      popBalloon(el, color, size);
    });

    /* Float animation */
    var floatDur = diff.floatMs;
    el.style.transition = "bottom " + floatDur + "ms linear";
    sky.appendChild(el);
    /* Trigger float after layout */
    requestAnimationFrame(function () {
      el.style.bottom = h + "px";
    });

    /* Miss detection */
    var checkId = id;
    var missTimer = setTimeout(function () {
      if (!running) return;
      var still = document.querySelector('.balloon[data-id="' + checkId + '"]');
      if (still && still.dataset.popped === "false") {
        still.remove();
        missed++;
        if (missed >= 3) {
          triggerShake();
          missed = 0;
        }
      }
    }, floatDur + 100);

    spawnTimer = setTimeout(spawnBalloon, diff.spawnMs);
  }

  function popBalloon(el, color, size) {
    if (el.dataset.popped === "true") return;
    el.dataset.popped = "true";

    var rect = el.getBoundingClientRect();
    var sr   = sky.getBoundingClientRect();
    var cx = rect.left - sr.left + rect.width / 2;
    var cy = rect.top  - sr.top  + rect.height / 2;

    /* Pop animation */
    el.classList.add("pop");

    /* Particles */
    var count = 6 + Math.floor(Math.random() * 6);
    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "particle";
      var pSize = rand(3, 7);
      var angle = rand(0, Math.PI * 2);
      var dist  = rand(20, 50);
      p.style.width  = pSize + "px";
      p.style.height = pSize + "px";
      p.style.background = color;
      p.style.left   = cx + "px";
      p.style.top    = cy + "px";
      p.style.setProperty("--px", Math.cos(angle) * dist + "px");
      p.style.setProperty("--py", Math.sin(angle) * dist + "px");
      p.style.boxShadow = "0 0 4px " + color;
      sky.appendChild(p);
      setTimeout(function (pel) { if (pel.parentNode) pel.parentNode.removeChild(pel); }, 650, p);
    }

    /* Score popup */
    var popup = document.createElement("div");
    popup.className = "score-pop";
    var diff = getDifficulty();
    var pts = Math.floor(size * diff.multi);
    score += pts;
    popped++;
    popup.textContent = "+" + pts;
    popup.style.left   = cx + "px";
    popup.style.top    = cy + "px";
    popup.style.color  = color;
    sky.appendChild(popup);
    setTimeout(function (pel) { if (pel.parentNode) pel.parentNode.removeChild(pel); }, 750, popup);

    /* Update score */
    multi = diff.multi;
    scoreVal.textContent = score;
    multiVal.textContent = multi.toFixed(1) + "x";

    /* Remove balloon after animation */
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320, el);
  }

  function triggerShake() {
    sky.classList.remove("shake");
    void sky.offsetWidth;
    sky.classList.add("shake");
  }

  function lighten(hex, pct) {
    var r = parseInt(hex.slice(1,3), 16);
    var g = parseInt(hex.slice(3,5), 16);
    var b = parseInt(hex.slice(5,7), 16);
    r = Math.min(255, r + Math.floor((255 - r) * pct / 100));
    g = Math.min(255, g + Math.floor((255 - g) * pct / 100));
    b = Math.min(255, b + Math.floor((255 - b) * pct / 100));
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /* ─── Timer ───────────────────────────────────────── */
  function startClock() {
    timeLeft = GAME_DURATION;
    timeVal.textContent = timeLeft;
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(function () {
      if (!running) return;
      timeLeft--;
      timeVal.textContent = timeLeft;
      if (timeLeft <= 0) {
        timeVal.textContent = "0";
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    running = false;
    if (spawnTimer) clearTimeout(spawnTimer);
    if (clockTimer) clearInterval(clockTimer);

    /* Save high score */
    if (score > best) {
      best = score;
      localStorage.setItem("bpBest", best.toString());
      bestVal.textContent = best;
    }

    /* Show modal */
    mbStats.innerHTML =
      "Balloons Popped: " + popped + "<br>" +
      "Final Score: " + score + "<br>" +
      "High Score: " + best;
    modal.classList.remove("hidden");
  }

  function resetGame() {
    modal.classList.add("hidden");

    /* Remove all balloons */
    var balloons = sky.querySelectorAll(".balloon");
    for (var i = 0; i < balloons.length; i++) {
      if (balloons[i].parentNode) balloons[i].parentNode.removeChild(balloons[i]);
    }

    /* Clear particles/popups */
    var debris = sky.querySelectorAll(".particle, .score-pop");
    for (var i = 0; i < debris.length; i++) {
      if (debris[i].parentNode) debris[i].parentNode.removeChild(debris[i]);
    }

    score = 0;
    popped = 0;
    missed = 0;
    multi = 1;
    balloonId = 0;
    scoreVal.textContent = "0";
    multiVal.textContent = "1.0x";
    timeVal.textContent = GAME_DURATION;

    if (spawnTimer) clearTimeout(spawnTimer);
    if (clockTimer) clearInterval(clockTimer);

    running = true;
    startClock();
    spawnBalloon();
  }

  /* ─── Events ──────────────────────────────────────── */
  function bindEvents() {
    startBtn.addEventListener("click", function () {
      startOverlay.style.display = "none";
      resetGame();
    });

    restartBtn.addEventListener("click", resetGame);

    window.addEventListener("resize", function () {});
  }

  function init() {
    bindEvents();
  }

  init();
})();
