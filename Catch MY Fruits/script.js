(function () {
  "use strict";

  var canvas    = document.getElementById("gameCanvas");
  var ctx       = canvas.getContext("2d");
  var scoreVal  = document.getElementById("scoreVal");
  var livesVal  = document.getElementById("livesVal");
  var speedVal  = document.getElementById("speedVal");
  var bestVal   = document.getElementById("bestVal");
  var overlay   = document.getElementById("overlay");
  var startBtn  = document.getElementById("startBtn");
  var gameover  = document.getElementById("gameover");
  var goStats   = document.getElementById("goStats");
  var restartBtn= document.getElementById("restartBtn");
  var canvasWrap= document.getElementById("canvasWrap");

  var W, H;

  /* ─── Basket ──────────────────────────────────── */
  var basket = { w: 80, h: 18 };

  /* ─── Item pools ──────────────────────────────── */
  var FRUITS = [
    { label: "A", color: "#ff3b5c", glow: "rgba(0,255,120,0.4)", points: 30, r: 14 },
    { label: "B", color: "#ffd700", glow: "rgba(0,255,120,0.4)", points: 20, r: 14 },
    { label: "O", color: "#ff8c00", glow: "rgba(0,255,120,0.4)", points: 25, r: 14 },
  ];
  var HAZARDS = [
    { label: "T", color: "#7d3c98", glow: "rgba(255,20,50,0.5)", points: 0,  r: 14 },
  ];

  var items, particles;
  var score, lives, multiplier, best;
  var running, reqId;
  var baseSpeed = 1.6;
  var keys = {};
  var spawnTimer = 0;

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

  /* ─── localStorage ────────────────────────────── */
  function loadBest() {
    var v = localStorage.getItem("cmfBest");
    best = v ? parseInt(v, 10) : 0;
    bestVal.textContent = best;
  }
  function saveBest() {
    if (score > best) {
      best = score;
      localStorage.setItem("cmfBest", best);
      bestVal.textContent = best;
    }
  }

  /* ─── Lives render ────────────────────────────── */
  function renderLives() {
    livesVal.textContent = "\u2665".repeat(Math.max(0, lives));
  }

  /* ─── Basket ──────────────────────────────────── */
  function resetBasket() {
    basket.x = (W - basket.w) / 2;
    basket.y = H - 24;
    basket.h = basket.h;
  }

  /* ─── Spawn ───────────────────────────────────── */
  function spawnItem() {
    var isFruit = Math.random() < 0.65;
    var pool = isFruit ? FRUITS : HAZARDS;
    var tmpl = pool[Math.floor(Math.random() * pool.length)];
    var r = tmpl.r;
    items.push({
      x: r + Math.random() * (W - r * 2),
      y: -r * 2,
      r: r,
      vy: baseSpeed * multiplier,
      type: isFruit ? "fruit" : "hazard",
      label: tmpl.label,
      color: tmpl.color,
      glow: tmpl.glow,
      points: tmpl.points,
    });
  }

  /* ─── Particles ───────────────────────────────── */
  function emitParticles(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var spd = 1 + Math.random() * 3;
      particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1, decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: color,
      });
    }
  }

  /* ─── Init ────────────────────────────────────── */
  function initGame() {
    items = [];
    particles = [];
    score = 0; lives = 3; multiplier = 1;
    scoreVal.textContent = "0";
    speedVal.textContent = "1.0" + "\u00D7";
    renderLives();
    resetBasket();
    spawnTimer = 0;
  }

  /* ─── Update ──────────────────────────────────── */
  function update() {
    /* Basket movement */
    if (keys.Left || keys.a) basket.x -= 5;
    if (keys.Right || keys.d) basket.x += 5;
    basket.x = Math.max(0, Math.min(W - basket.w, basket.x));

    /* Spawn timer */
    spawnTimer++;
    var spawnRate = Math.max(8, 30 - Math.floor(multiplier * 1.5));
    if (spawnTimer >= spawnRate) {
      spawnTimer = 0;
      spawnItem();
    }

    /* Difficulty */
    multiplier = 1 + Math.floor(score / 150) * 0.25;
    speedVal.textContent = multiplier.toFixed(1) + "\u00D7";

    /* Move items */
    var shake = false;
    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.y += it.vy;

      /* AABB collision vs basket */
      var bx = basket.x, by = basket.y, bw = basket.w, bh = basket.h;
      if (it.y + it.r > by && it.y - it.r < by + bh && it.x + it.r > bx && it.x - it.r < bx + bw) {
        /* Catch */
        if (it.type === "fruit") {
          score += it.points;
          scoreVal.textContent = score;
          emitParticles(it.x, it.y, "#00ff88", 12);
        } else {
          lives--;
          renderLives();
          emitParticles(it.x, it.y, "#ff2a5f", 16);
          shake = true;
        }
        items.splice(i, 1);
        continue;
      }

      /* Missed (hit floor) */
      if (it.y - it.r > H) {
        if (it.type === "fruit") {
          lives--;
          renderLives();
          emitParticles(it.x, H, "#ff2a5f", 10);
          shake = true;
        }
        items.splice(i, 1);
      }
    }

    /* Screen shake */
    if (shake) {
      canvasWrap.classList.remove("shake");
      void canvasWrap.offsetWidth;
      canvasWrap.classList.add("shake");
      setTimeout(function () { canvasWrap.classList.remove("shake"); }, 300);
    }

    /* Particles */
    for (var j = particles.length - 1; j >= 0; j--) {
      var p = particles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
      if (p.life <= 0) particles.splice(j, 1);
    }

    /* Game over */
    if (lives <= 0) gameOver();
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Items */
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      ctx.shadowColor = it.glow;
      ctx.shadowBlur = 20;
      ctx.fillStyle = it.color;
      ctx.beginPath();
      if (it.type === "fruit") {
        /* Apple-like shape */
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        /* Stem */
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#2d5016";
        ctx.fillRect(it.x - 1, it.y - it.r - 4, 2, 5);
        ctx.shadowBlur = 20;
      } else {
        /* Hazard shape - toxic drip */
        ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.arc(it.x - 3, it.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 20;
      }
      /* Label */
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "bold " + (it.r * 0.85) + "px Consolas,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, it.x, it.y + 0.5);
    }

    /* Particles */
    for (var j = 0; j < particles.length; j++) {
      var p = particles[j];
      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 0;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    /* Basket */
    ctx.shadowColor = "rgba(0,240,255,0.3)";
    ctx.shadowBlur = 16;

    /* Basket body */
    var grad = ctx.createLinearGradient(basket.x, basket.y, basket.x, basket.y + basket.h);
    grad.addColorStop(0, "rgba(0,240,255,0.18)");
    grad.addColorStop(1, "rgba(0,240,255,0.04)");
    ctx.fillStyle = grad;
    ctx.fillRect(basket.x, basket.y, basket.w, basket.h);

    /* Basket rim */
    ctx.fillStyle = "rgba(0,240,255,0.35)";
    ctx.fillRect(basket.x, basket.y, basket.w, 3);

    /* Basket center glow */
    ctx.fillStyle = "rgba(0,240,255,0.06)";
    ctx.fillRect(basket.x + 8, basket.y + 4, basket.w - 16, basket.h - 6);

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
    goStats.innerHTML = "Score: " + score + "<br>Multiplier: " + multiplier.toFixed(1) + "\u00D7";
    gameover.classList.remove("hidden");
  }

  /* ─── Start / Reset ───────────────────────────── */
  function startGame() {
    overlay.classList.add("hidden");
    gameover.classList.add("hidden");
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
      basket.x = mx - basket.w / 2;
      basket.x = Math.max(0, Math.min(W - basket.w, basket.x));
    });

    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault();
      if (!running) return;
      var rect = canvas.getBoundingClientRect();
      var mx = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      basket.x = mx - basket.w / 2;
      basket.x = Math.max(0, Math.min(W - basket.w, basket.x));
    }, { passive: false });

    document.addEventListener("keydown", function (e) {
      switch (e.key) {
        case "ArrowLeft":  case "a": case "A": keys.Left = true; e.preventDefault(); break;
        case "ArrowRight": case "d": case "D": keys.Right = true; e.preventDefault(); break;
      }
    });
    document.addEventListener("keyup", function (e) {
      switch (e.key) {
        case "ArrowLeft":  case "a": case "A": keys.Left = false; break;
        case "ArrowRight": case "d": case "D": keys.Right = false; break;
      }
    });
  }

  /* ─── Boot ────────────────────────────────────── */
  loadBest();
  resize();
  initGame();
  draw();
  bindEvents();
})();
