(function () {
  "use strict";

  /* ─── DOM refs ─────────────────────────────────── */
  var canvas   = document.getElementById("gameCanvas");
  var ctx      = canvas.getContext("2d");
  var scoreVal = document.getElementById("scoreVal");
  var levelVal = document.getElementById("levelVal");
  var bestVal  = document.getElementById("bestVal");
  var overlay  = document.getElementById("overlay");
  var startBtn = document.getElementById("startBtn");
  var gameover = document.getElementById("gameover");
  var goScore  = document.getElementById("goScore");
  var restartBtn = document.getElementById("restartBtn");

  /* ─── Constants ────────────────────────────────── */
  var GRAVITY     = 0.55;
  var JUMP_FORCE  = -11;
  var BASE_SPEED  = 3.2;
  var PLAYER_W    = 24;
  var PLAYER_H    = 28;
  var PLAT_MIN_W  = 64;
  var PLAT_MAX_W  = 140;
  var PLAT_MIN_GAP= 80;
  var PLAT_MAX_GAP= 180;
  var PLAT_H      = 14;
  var SPAWN_AHEAD = 600;

  /* ─── State ────────────────────────────────────── */
  var W, H;
  var player, platforms, cameraX;
  var score, level, best;
  var running, jumping;
  var reqId;

  /* ─── Resize ───────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr  = 1;
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);

  /* ─── localStorage ─────────────────────────────── */
  function loadBest() {
    var v = localStorage.getItem("jcBest");
    best = v ? parseInt(v, 10) : 0;
    bestVal.textContent = best;
  }
  function saveBest() {
    if (score > best) {
      best = score;
      localStorage.setItem("jcBest", best);
      bestVal.textContent = best;
    }
  }

  /* ─── Player ───────────────────────────────────── */
  function initPlayer() {
    player = { x: 120, y: 200, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, grounded: false };
  }

  /* ─── Platforms ────────────────────────────────── */
  function spawnPlatform(x) {
    var w = PLAT_MIN_W + Math.random() * (PLAT_MAX_W - PLAT_MIN_W);
    var yRange = H * 0.35;
    var y = H * 0.35 + Math.random() * yRange;
    return { x: x, y: y, w: w, h: PLAT_H };
  }

  function initPlatforms() {
    platforms = [];
    var x = 0;
    while (x < W + SPAWN_AHEAD) {
      platforms.push(spawnPlatform(x));
      var gap = PLAT_MIN_GAP + Math.random() * (PLAT_MAX_GAP - PLAT_MIN_GAP);
      x += platforms[platforms.length - 1].w + gap;
    }
  }

  /* ─── AABB ─────────────────────────────────────── */
  function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  /* ─── Difficulty ───────────────────────────────── */
  function updateDifficulty() {
    var raw = Math.floor(score / 300) + 1;
    level = Math.min(raw, 20);
    levelVal.textContent = level;
  }
  function currentSpeed() {
    return BASE_SPEED + (level - 1) * 0.35;
  }
  function currentGap() {
    return PLAT_MIN_GAP + (level - 1) * 4;
  }

  /* ─── Game logic tick ──────────────────────────── */
  function update() {
    /* Auto-run horizontal velocity */
    player.vx = currentSpeed();

    /* Gravity */
    if (!player.grounded) player.vy += GRAVITY;

    /* Move player */
    player.x += player.vx;
    player.y += player.vy;

    /* Clamp horizontal */
    if (player.x < 0) { player.x = 0; player.vx = 0; }

    /* AABB landing */
    player.grounded = false;
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      /* Only check if player is falling and near platform Y */
      if (player.vy >= 0) {
        /* Player's bottom edge vs platform top */
        var pTop = p.y;
        var pBot = p.y + p.h;
        var pLef = p.x;
        var pRig = p.x + p.w;

        var pL = player.x;
        var pR = player.x + player.w;
        /* Player bottom was above or at platform top last frame-ish */
        /* Check horizontal overlap */
        if (pL < pRig && pR > pLef) {
          /* Check if player's bottom is within landing threshold */
          var playerBot = player.y + player.h;
          if (playerBot >= pTop && playerBot <= pTop + player.vy + 6) {
            player.y = pTop - player.h;
            player.vy = 0;
            player.grounded = true;
          }
        }
      }
    }

    /* Score based on distance */
    var newScore = Math.floor((player.x - 120) / 10);
    if (newScore > score) {
      score = newScore;
      scoreVal.textContent = score;
      updateDifficulty();
    }

    /* Camera follows player with slight center bias */
    var targetCam = player.x - W * 0.3;
    if (targetCam < 0) targetCam = 0;
    cameraX += (targetCam - cameraX) * 0.08;

    /* Spawn platforms ahead */
    var lastP = platforms[platforms.length - 1];
    var spawnX = lastP ? lastP.x + lastP.w + currentGap() : cameraX + W;
    while (spawnX < cameraX + W + SPAWN_AHEAD) {
      var plat = spawnPlatform(spawnX);
      platforms.push(plat);
      spawnX = plat.x + plat.w + currentGap();
    }

    /* Cull platforms behind camera */
    while (platforms.length > 0 && platforms[0].x + platforms[0].w < cameraX - 200) {
      platforms.shift();
    }

    /* Fall death */
    if (player.y > H + 60) {
      gameOver();
    }
  }

  /* ─── Render ───────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Draw platforms */
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      var px = p.x - cameraX;
      if (px + p.w < -50 || px > W + 50) continue;

      /* Platform body */
      var grad = ctx.createLinearGradient(px, p.y, px + p.w, p.y);
      grad.addColorStop(0, "#ff2a5f");
      grad.addColorStop(1, "#c41e4a");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(255,42,95,0.35)";
      ctx.shadowBlur = 14;
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.shadowBlur = 0;

      /* Top glow line */
      ctx.fillStyle = "rgba(255,42,95,0.25)";
      ctx.fillRect(px, p.y, p.w, 2);
    }

    /* Draw player */
    var px = player.x - cameraX;
    var py = player.y;

    /* Glow */
    ctx.shadowColor = "rgba(0,240,255,0.4)";
    ctx.shadowBlur = 18;

    /* Body */
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(px, py, player.w, player.h);

    /* Inner highlight */
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(px + 3, py + 3, player.w - 6, player.h * 0.35);

    ctx.shadowBlur = 0;

    /* Eye */
    ctx.fillStyle = "#05070d";
    ctx.fillRect(px + player.w - 8, py + 7, 4, 4);

    /* Grounded indicator */
    if (player.grounded) {
      ctx.fillStyle = "rgba(0,240,255,0.15)";
      ctx.fillRect(px, py + player.h, player.w, 2);
    }
  }

  /* ─── Game loop ────────────────────────────────── */
  function loop() {
    if (!running) return;
    update();
    draw();
    reqId = requestAnimationFrame(loop);
  }

  /* ─── Input ────────────────────────────────────── */
  function doJump() {
    if (!running || !player.grounded) return;
    player.vy = JUMP_FORCE;
    player.grounded = false;
  }

  /* ─── Game Over ────────────────────────────────── */
  function gameOver() {
    running = false;
    cancelAnimationFrame(reqId);
    saveBest();
    goScore.innerHTML = "Score: " + score + "<br>Level: " + level;
    gameover.classList.remove("hidden");
  }

  /* ─── Start / Reset ────────────────────────────── */
  function startGame() {
    overlay.classList.add("hidden");
    gameover.classList.add("hidden");
    score = 0; level = 1;
    scoreVal.textContent = "0";
    levelVal.textContent = "1";
    cameraX = 0;
    resize();
    initPlayer();
    initPlatforms();
    running = true;
    loop();
  }

  /* ─── Events ───────────────────────────────────── */
  function bindEvents() {
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

    canvas.addEventListener("mousedown", doJump);
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); doJump(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        doJump();
      }
    });
  }

  /* ─── Init ─────────────────────────────────────── */
  loadBest();
  resize();
  initPlayer();
  initPlatforms();
  draw();
  bindEvents();
})();
