(function () {
  "use strict";

  var canvas    = document.getElementById("gameCanvas");
  var ctx       = canvas.getContext("2d");
  var scoreVal  = document.getElementById("scoreVal");
  var hullVal   = document.getElementById("hullVal");
  var waveVal   = document.getElementById("waveVal");
  var bestVal   = document.getElementById("bestVal");
  var overlay   = document.getElementById("overlay");
  var startBtn  = document.getElementById("startBtn");
  var gameover  = document.getElementById("gameover");
  var goStats   = document.getElementById("goStats");
  var restartBtn= document.getElementById("restartBtn");
  var canvasWrap= document.getElementById("canvasWrap");

  var W, H;
  var PLAYER_W = 28, PLAYER_H = 30;
  var MAX_HULL = 5;

  var player, lasers, enemies, particles, stars;
  var score, hull, wave, best, frameCount;
  var running, reqId, spawnTimer, shootCooldown;
  var keys = {};

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvasWrap.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── Stars ───────────────────────────────────── */
  function initStars() {
    stars = [];
    for (var i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.3 + Math.random() * 0.8,
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
  }

  /* ─── localStorage ────────────────────────────── */
  function loadBest() {
    var v = localStorage.getItem("ssBest");
    best = v ? parseInt(v, 10) : 0;
    bestVal.textContent = best;
  }
  function saveBest() {
    if (score > best) {
      best = score;
      localStorage.setItem("ssBest", best);
      bestVal.textContent = best;
    }
  }

  /* ─── Hull display ───────────────────────────── */
  function renderHull() {
    hullVal.textContent = "\u2588".repeat(Math.max(0, hull));
  }

  /* ─── Player ──────────────────────────────────── */
  function initPlayer() {
    player = {
      x: (W - PLAYER_W) / 2, y: H - 50,
      w: PLAYER_W, h: PLAYER_H,
    };
  }

  /* ─── Spawn helpers ───────────────────────────── */
  function spawnEnemy() {
    var w = 22 + Math.random() * 12;
    var h = 20 + Math.random() * 10;
    enemies.push({
      x: Math.random() * (W - w), y: -h,
      w: w, h: h,
      speed: 0.8 + wave * 0.15 + Math.random() * 0.4,
      hp: 1,
    });
  }

  function shootLaser() {
    if (shootCooldown > 0) return;
    lasers.push({
      x: player.x + player.w / 2 - 2, y: player.y - 8,
      w: 4, h: 14,
      speed: 7,
    });
    shootCooldown = 8;
  }

  function spawnExplosion(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 1 + Math.random() * 3;
      particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1, decay: 0.02 + Math.random() * 0.025,
        size: 2 + Math.random() * 4,
        color: color,
      });
    }
  }

  /* ─── AABB ────────────────────────────────────── */
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /* ─── Init game ───────────────────────────────── */
  function initGame() {
    lasers = []; enemies = []; particles = [];
    score = 0; hull = MAX_HULL; wave = 1; frameCount = 0;
    spawnTimer = 0; shootCooldown = 0;
    scoreVal.textContent = "0";
    waveVal.textContent  = "1";
    renderHull();
    initStars();
    initPlayer();
  }

  /* ─── Update ──────────────────────────────────── */
  function update() {
    frameCount++;

    /* Stars */
    for (var si = 0; si < stars.length; si++) {
      var s = stars[si];
      s.y += s.speed;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    /* Player movement */
    var speed = 4;
    if (keys.Left || keys.a) player.x -= speed;
    if (keys.Right || keys.d) player.x += speed;
    if (keys.Up || keys.w) player.y -= speed;
    if (keys.Down || keys.s) player.y += speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));
    player.y = Math.max(0, Math.min(H - player.h, player.y));

    /* Cooldown */
    if (shootCooldown > 0) shootCooldown--;

    /* Lasers */
    for (var li = lasers.length - 1; li >= 0; li--) {
      lasers[li].y -= lasers[li].speed;
      if (lasers[li].y + lasers[li].h < 0) { lasers.splice(li, 1); }
    }

    /* Wave scaling */
    wave = Math.floor(score / 200) + 1;
    waveVal.textContent = wave;

    /* Spawn enemies */
    spawnTimer++;
    var spawnRate = Math.max(18, 50 - wave * 2);
    if (spawnTimer >= spawnRate) {
      spawnTimer = 0;
      if (Math.random() < 0.55) spawnEnemy();
    }

    /* Move enemies & collisions */
    for (var ei = enemies.length - 1; ei >= 0; ei--) {
      var e = enemies[ei];
      e.y += e.speed;

      if (e.y > H + 20) { enemies.splice(ei, 1); continue; }

      /* Laser vs enemy */
      var hit = false;
      for (var lj = lasers.length - 1; lj >= 0; lj--) {
        if (aabb(lasers[lj], e)) {
          spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, "#ffd700", 10);
          spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, "#ff2a5f", 6);
          score += 10 + wave * 2;
          scoreVal.textContent = score;
          lasers.splice(lj, 1);
          enemies.splice(ei, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      /* Enemy vs player */
      if (aabb(e, player)) {
        hull--;
        renderHull();
        spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, "#ff2a5f", 14);
        enemies.splice(ei, 1);

        canvasWrap.classList.remove("shake");
        void canvasWrap.offsetWidth;
        canvasWrap.classList.add("shake");
        setTimeout(function () { canvasWrap.classList.remove("shake"); }, 300);

        if (hull <= 0) { gameOver(); return; }
      }
    }

    /* Particles */
    for (var pj = particles.length - 1; pj >= 0; pj--) {
      var p = particles[pj];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.04;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(pj, 1);
    }
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Stars */
    for (var si = 0; si < stars.length; si++) {
      var s = stars[si];
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = "#fff";
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    /* Lasers */
    for (var li = 0; li < lasers.length; li++) {
      var l = lasers[li];
      ctx.shadowColor = "rgba(0,255,136,0.5)";
      ctx.shadowBlur = 12;
      var lg = ctx.createLinearGradient(l.x, l.y, l.x, l.y + l.h);
      lg.addColorStop(0, "rgba(0,255,136,0.2)");
      lg.addColorStop(0.5, "#00ff88");
      lg.addColorStop(1, "rgba(0,255,136,0.2)");
      ctx.fillStyle = lg;
      ctx.fillRect(l.x, l.y, l.w, l.h);
      ctx.shadowBlur = 0;
    }

    /* Enemies */
    for (var ei = 0; ei < enemies.length; ei++) {
      var e = enemies[ei];
      ctx.shadowColor = "rgba(255,42,95,0.4)";
      ctx.shadowBlur = 16;

      /* Body */
      var eg = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
      eg.addColorStop(0, "#ff2a5f");
      eg.addColorStop(1, "#a8183e");
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2, e.y);
      ctx.lineTo(e.x + e.w, e.y + e.h * 0.6);
      ctx.lineTo(e.x + e.w * 0.8, e.y + e.h);
      ctx.lineTo(e.x + e.w * 0.2, e.y + e.h);
      ctx.lineTo(e.x, e.y + e.h * 0.6);
      ctx.closePath();
      ctx.fill();

      /* Eye */
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(e.x + e.w / 2 - 3, e.y + e.h * 0.3, 6, 3);
    }

    /* Player */
    ctx.shadowColor = "rgba(0,240,255,0.35)";
    ctx.shadowBlur = 18;

    /* Ship body */
    var pg = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    pg.addColorStop(0, "#00f0ff");
    pg.addColorStop(0.5, "#0098a8");
    pg.addColorStop(1, "#005f6b");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h * 0.7);
    ctx.lineTo(player.x + player.w * 0.7, player.y + player.h);
    ctx.lineTo(player.x + player.w * 0.3, player.y + player.h);
    ctx.lineTo(player.x, player.y + player.h * 0.7);
    ctx.closePath();
    ctx.fill();

    /* Cockpit glow */
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(player.x + player.w / 2 - 3, player.y + player.h * 0.25, 6, 8);

    ctx.shadowBlur = 0;

    /* Particles */
    for (var pj = 0; pj < particles.length; pj++) {
      var p = particles[pj];
      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  /* ─── Loop ────────────────────────────────────── */
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
    goStats.innerHTML = "Score: " + score + "<br>Wave: " + wave;
    gameover.classList.remove("hidden");
  }

  /* ─── Shoot trigger ───────────────────────────── */
  function doShoot() {
    if (!running) return;
    shootLaser();
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

    canvas.addEventListener("mousemove", function (e) {
      if (!running) return;
      var rect = canvas.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      var my = (e.clientY - rect.top) * (canvas.height / rect.height);
      player.x = mx - player.w / 2;
      player.y = my - player.h / 2;
      player.x = Math.max(0, Math.min(W - player.w, player.x));
      player.y = Math.max(0, Math.min(H - player.h, player.y));
    });

    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault();
      if (!running) return;
      var rect = canvas.getBoundingClientRect();
      var mx = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      var my = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
      player.x = mx - player.w / 2;
      player.y = my - player.h / 2;
      player.x = Math.max(0, Math.min(W - player.w, player.x));
      player.y = Math.max(0, Math.min(H - player.h, player.y));
    }, { passive: false });

    canvas.addEventListener("click", doShoot);
    canvas.addEventListener("touchstart", function (e) {
      e.preventDefault();
      doShoot();
    }, { passive: false });

    document.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowLeft":  case "a": case "A": keys.Left = true; e.preventDefault(); break;
        case "ArrowRight": case "d": case "D": keys.Right = true; e.preventDefault(); break;
        case "ArrowUp":    case "w": case "W": keys.Up = true; e.preventDefault(); break;
        case "ArrowDown":  case "s": case "S": keys.Down = true; e.preventDefault(); break;
        case " ": doShoot(); e.preventDefault(); break;
      }
    });
    document.addEventListener("keyup", function (e) {
      switch (e.key) {
        case "ArrowLeft":  case "a": case "A": keys.Left = false; break;
        case "ArrowRight": case "d": case "D": keys.Right = false; break;
        case "ArrowUp":    case "w": case "W": keys.Up = false; break;
        case "ArrowDown":  case "s": case "S": keys.Down = false; break;
      }
    });
  }

  /* ─── Boot ────────────────────────────────────── */
  loadBest();
  resize();
  initStars();
  initPlayer();
  draw();
  bindEvents();
})();
