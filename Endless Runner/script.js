(function () {
  "use strict";

  var canvas    = document.getElementById("gameCanvas");
  var ctx       = canvas.getContext("2d");
  var distVal   = document.getElementById("distVal");
  var speedVal  = document.getElementById("speedVal");
  var bestVal   = document.getElementById("bestVal");
  var overlay   = document.getElementById("overlay");
  var startBtn  = document.getElementById("startBtn");
  var gameover  = document.getElementById("gameover");
  var goStats   = document.getElementById("goStats");
  var restartBtn= document.getElementById("restartBtn");
  var canvasWrap= document.getElementById("canvasWrap");

  var W, H;
  var GROUND_Y;
  var GRAVITY   = 0.6;
  var JUMP_FORCE= -10.5;
  var BASE_SPEED= 4;
  var PLAYER_W  = 18;
  var PLAYER_H  = 26;

  var player, obstacles, distance, speed, best;
  var running, reqId, spawnTimer;
  var frameCount = 0;

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvasWrap.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    GROUND_Y = H - 30;
  }
  window.addEventListener("resize", resize);

  /* ─── localStorage ────────────────────────────── */
  function loadBest() {
    var v = localStorage.getItem("erBest");
    best = v ? parseInt(v, 10) : 0;
    bestVal.textContent = best;
  }
  function saveBest() {
    if (distance > best) {
      best = distance;
      localStorage.setItem("erBest", best);
      bestVal.textContent = best;
    }
  }

  /* ─── Player ──────────────────────────────────── */
  function initPlayer() {
    player = {
      x: 60, y: GROUND_Y - PLAYER_H,
      w: PLAYER_W, h: PLAYER_H,
      vy: 0, grounded: true,
    };
  }

  /* ─── Obstacles ───────────────────────────────── */
  function spawnObstacle() {
    var w = 14 + Math.random() * 10;
    var h = 16 + Math.random() * 10;
    var isHigh = Math.random() < 0.3;
    var y = isHigh ? GROUND_Y - h - 28 - Math.random() * 20 : GROUND_Y - h;
    obstacles.push({
      x: W + 10, y: y, w: w, h: h,
      passed: false,
    });
  }

  /* ─── Init ────────────────────────────────────── */
  function initGame() {
    obstacles = [];
    distance = 0;
    speed = BASE_SPEED;
    spawnTimer = 0;
    frameCount = 0;
    distVal.textContent = "0";
    speedVal.textContent = "1.0" + "\u00D7";
    initPlayer();
  }

  /* ─── AABB ────────────────────────────────────── */
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* ─── Update ──────────────────────────────────── */
  function update() {
    frameCount++;

    /* Speed ramp */
    speed = BASE_SPEED + Math.floor(frameCount / 600) * 0.6;
    speedVal.textContent = speed.toFixed(1) + "\u00D7";

    /* Player gravity */
    if (!player.grounded) {
      player.vy += GRAVITY;
      player.y += player.vy;
    }

    /* Ground collision */
    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.grounded = true;
    }

    /* Spawn obstacles */
    spawnTimer++;
    var interval = Math.max(28, 60 - Math.floor(speed * 2));
    if (spawnTimer >= interval) {
      spawnTimer = 0;
      if (Math.random() < 0.6) spawnObstacle();
    }

    /* Move obstacles */
    for (var i = obstacles.length - 1; i >= 0; i--) {
      var ob = obstacles[i];
      ob.x -= speed;

      /* Distance scoring */
      if (!ob.passed && ob.x + ob.w < player.x) {
        ob.passed = true;
        distance++;
        distVal.textContent = distance;
      }

      /* Cull off-screen left */
      if (ob.x + ob.w < -20) {
        obstacles.splice(i, 1);
        continue;
      }

      /* AABB collision */
      if (aabb(player, ob)) {
        gameOver();
        return;
      }
    }
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Ground line */
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0, GROUND_Y, W, 1);

    /* Ground glow strip */
    var grad = ctx.createLinearGradient(0, GROUND_Y, 0, H);
    grad.addColorStop(0, "rgba(0,240,255,0.01)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    /* Grid lines */
    ctx.strokeStyle = "rgba(0,240,255,0.012)";
    ctx.lineWidth = 1;
    var gridSize = 40;
    for (var gx = -(frameCount * speed * 0.1) % gridSize; gx < W; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, GROUND_Y);
      ctx.stroke();
    }
    for (var gy = 0; gy < GROUND_Y; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
    }

    /* Obstacles */
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      ctx.shadowColor = "rgba(255,42,95,0.4)";
      ctx.shadowBlur = 18;

      /* Body */
      var og = ctx.createLinearGradient(ob.x, ob.y, ob.x + ob.w, ob.y);
      og.addColorStop(0, "#ff2a5f");
      og.addColorStop(1, "#b81a40");
      ctx.fillStyle = og;
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

      /* Top highlight */
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(ob.x, ob.y, ob.w, 2);

      ctx.shadowBlur = 0;
    }

    /* Player */
    ctx.shadowColor = "rgba(0,240,255,0.35)";
    ctx.shadowBlur = 16;

    /* Body */
    var pg = ctx.createLinearGradient(player.x, player.y, player.x + player.w, player.y);
    pg.addColorStop(0, "#00f0ff");
    pg.addColorStop(1, "#0098a8");
    ctx.fillStyle = pg;
    ctx.fillRect(player.x, player.y, player.w, player.h);

    /* Inner highlight */
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(player.x + 3, player.y + 3, player.w - 6, 5);

    /* Eye */
    ctx.fillStyle = "#05060c";
    ctx.fillRect(player.x + player.w - 7, player.y + 6, 4, 4);

    /* Running leg animation */
    ctx.shadowBlur = 0;
    var legPhase = frameCount * 0.2;
    ctx.fillStyle = "#00f0ff";
    if (player.grounded) {
      var legOff = Math.sin(legPhase) * 3;
      ctx.fillRect(player.x + 2, player.y + player.h, 5, 5 + legOff);
      ctx.fillRect(player.x + player.w - 7, player.y + player.h, 5, 5 - legOff);
    } else {
      ctx.fillRect(player.x + 2, player.y + player.h, 5, 5);
      ctx.fillRect(player.x + player.w - 7, player.y + player.h, 5, 5);
    }

    ctx.shadowBlur = 0;
  }

  /* ─── Game loop ───────────────────────────────── */
  function loop() {
    if (!running) return;
    update();
    draw();
    reqId = requestAnimationFrame(loop);
  }

  /* ─── Game Over ───────────────────────────────── */
  function gameOver() {
    running = false;
    cancelAnimationFrame(reqId);
    saveBest();

    canvasWrap.classList.remove("shake");
    void canvasWrap.offsetWidth;
    canvasWrap.classList.add("shake");

    goStats.innerHTML = "Distance: " + distance + "<br>Speed: " + speed.toFixed(1) + "\u00D7";
    gameover.classList.remove("hidden");
  }

  /* ─── Jump ────────────────────────────────────── */
  function doJump() {
    if (!running) return;
    if (!player.grounded) return;
    player.vy = JUMP_FORCE;
    player.grounded = false;
  }

  /* ─── Start / Reset ───────────────────────────── */
  function startGame() {
    overlay.classList.add("hidden");
    gameover.classList.add("hidden");
    canvasWrap.classList.remove("shake");
    resize();
    initGame();
    running = true;
    loop();
  }

  /* ─── Input ───────────────────────────────────── */
  function bindEvents() {
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", startGame);

    canvas.addEventListener("mousedown", doJump);
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); doJump(); });

    document.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        doJump();
      }
    });
  }

  /* ─── Boot ────────────────────────────────────── */
  loadBest();
  resize();
  initPlayer();
  draw();
  bindEvents();
})();
