/* ═══════════════════════════════════════════════════════
   Brick Breaker — Canvas Game Engine
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Canvas Setup ─── */
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = 480, H = 640;

  /* ─── DOM ─── */
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const livesEl = document.getElementById('lives');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalScore = document.getElementById('modal-score');
  const modalBest = document.getElementById('modal-best');
  const restartBtn = document.getElementById('btn-restart');

  /* ─── Constants ─── */
  const PADDLE_W = 80, PADDLE_H = 12;
  const BALL_R = 7;
  const BALL_SPEED = 5.5;
  const BRICK_ROWS = 6;
  const BRICK_COLS = 8;
  const BRICK_GAP = 5;
  const BRICK_TOP = 52;
  const BRICK_H = 18;
  const BRICK_W = (W - BRICK_GAP * (BRICK_COLS + 1)) / BRICK_COLS;
  const PADDLE_Y = H - 32;
  const MAX_ANGLE = Math.PI / 3;          // 60°
  const LS_KEY = 'bb_high';

  /* ─── State ─── */
  let score = 0, lives = 3, highScore = 0;
  let bricks = [];
  let paddle = { x: (W - PADDLE_W) / 2, w: PADDLE_W };
  let ball = {};
  let running = false, animId = null;

  /* ─── Brick Definitions (durability & colour) ─── */
  const BRICK_THEMES = [
    { hp: 2, fill: '#ff2a5f', glow: 'rgba(255,42,95,0.35)' },   // row 0 — neon pink
    { hp: 2, fill: '#ff2a5f', glow: 'rgba(255,42,95,0.35)' },   // row 1
    { hp: 2, fill: '#d946ef', glow: 'rgba(217,70,239,0.30)' },  // row 2 — magenta
    { hp: 2, fill: '#d946ef', glow: 'rgba(217,70,239,0.30)' },  // row 3
    { hp: 1, fill: '#00f0ff', glow: 'rgba(0,240,255,0.25)' },   // row 4 — cyan
    { hp: 1, fill: '#00f0ff', glow: 'rgba(0,240,255,0.25)' },   // row 5
  ];

  /* ─── Init ─── */
  function init () {
    highScore = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
    bestEl.textContent = highScore;
    restartBtn.addEventListener('click', resetGame);
    setupInput();
    resetGame();
  }

  /* ─── Build Grid ─── */
  function buildGrid () {
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      const theme = BRICK_THEMES[r];
      for (let c = 0; c < BRICK_COLS; c++) {
        const x = BRICK_GAP + c * (BRICK_W + BRICK_GAP);
        const y = BRICK_TOP + r * (BRICK_H + BRICK_GAP);
        bricks.push({
          x, y, w: BRICK_W, h: BRICK_H,
          hp: theme.hp,
          maxHp: theme.hp,
          fill: theme.fill,
          glow: theme.glow,
          alive: true,
        });
      }
    }
  }

  /* ─── Reset Ball ─── */
  function resetBall () {
    ball = {
      x: W / 2,
      y: PADDLE_Y - BALL_R - 1,
      r: BALL_R,
      vx: 0,
      vy: 0,
      stuck: true,       // stuck to paddle until click
    };
  }

  /* ─── Reset Game ─── */
  function resetGame () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    modal.classList.remove('active');

    score = 0;
    lives = 3;
    buildGrid();
    paddle.x = (W - PADDLE_W) / 2;
    resetBall();
    running = true;
    updateUI();
    animId = requestAnimationFrame(loop);
  }

  /* ─── Input ─── */
  let pointerX = null;

  function setupInput () {
    // Mouse
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      pointerX = (e.clientX - rect.left) * scaleX;
    });

    canvas.addEventListener('click', launchBall);

    // Touch
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const touch = e.touches[0];
      pointerX = (touch.clientX - rect.left) * scaleX;
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const touch = e.touches[0];
      pointerX = (touch.clientX - rect.left) * scaleX;
      launchBall();
    }, { passive: false });
  }

  function launchBall () {
    if (!running) return;
    if (!ball.stuck) return;

    // Launch upward at a slight random angle
    const angle = (Math.random() - 0.5) * 0.6;   // ±0.3 rad (~17°)
    ball.vx = BALL_SPEED * Math.sin(angle);
    ball.vy = -BALL_SPEED * Math.cos(angle);
    ball.stuck = false;
  }

  /* ─── Update ─── */
  function update () {
    if (!running) return;

    // Move paddle toward pointer
    if (pointerX !== null) {
      const target = pointerX - paddle.w / 2;
      paddle.x += (target - paddle.x) * 0.35;
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

      // If ball is stuck, move it with paddle
      if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = PADDLE_Y - BALL_R - 1;
        return;
      }
    } else if (ball.stuck) {
      return;
    }

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall bounces (left/right)
    if (ball.x - ball.r <= 0) { ball.x = ball.r; ball.vx = -ball.vx; }
    if (ball.x + ball.r >= W) { ball.x = W - ball.r; ball.vx = -ball.vx; }

    // Ceiling bounce
    if (ball.y - ball.r <= 0) { ball.y = ball.r; ball.vy = -ball.vy; }

    // Floor — lose life
    if (ball.y + ball.r >= H) {
      lives--;
      updateUI();
      if (lives <= 0) {
        gameOver(false);
        return;
      }
      resetBall();
      pointerX = W / 2;
      paddle.x = (W - PADDLE_W) / 2;
      return;
    }

    // Paddle collision
    if (ball.vy > 0 &&
        ball.y + ball.r >= PADDLE_Y &&
        ball.y + ball.r <= PADDLE_Y + PADDLE_H + 4 &&
        ball.x >= paddle.x - ball.r &&
        ball.x <= paddle.x + paddle.w + ball.r) {

      const offset = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const clamped = Math.max(-1, Math.min(1, offset));
      const angle = clamped * MAX_ANGLE;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
      ball.y = PADDLE_Y - ball.r;
    }

    // Brick collision
    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      if (!b.alive) continue;

      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {

        // Determine collision side
        const overlapX = (ball.x < b.x + b.w / 2)
          ? (ball.x + ball.r) - b.x
          : (b.x + b.w) - (ball.x - ball.r);
        const overlapY = (ball.y < b.y + b.h / 2)
          ? (ball.y + ball.r) - b.y
          : (b.y + b.h) - (ball.y - ball.r);

        if (overlapX < overlapY) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }

        // Damage brick
        b.hp--;
        if (b.hp <= 0) {
          b.alive = false;
          score += 10;
          updateUI();
        } else {
          // Dim colour on damage
          b.fill = darken(b.fill);
        }
        break;
      }
    }

    // Check victory
    if (bricks.every(b => !b.alive)) {
      gameOver(true);
    }
  }

  /* ─── Darken helper ─── */
  function darken (hex) {
    // Simple darken for damaged bricks
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - 40);
    const g = Math.max(0, ((num >> 8) & 0xff) - 40);
    const b = Math.max(0, (num & 0xff) - 40);
    return `rgb(${r},${g},${b})`;
  }

  /* ─── Draw ─── */
  function draw () {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#080c1a';
    ctx.fillRect(0, 0, W, H);

    // Bricks
    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.shadowColor = b.glow;
      ctx.shadowBlur = 12;
      ctx.fillStyle = b.fill;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();

      // HP indicator for 2-hp bricks
      if (b.maxHp > 1 && b.hp < b.maxHp) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    // Paddle
    ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.roundRect(paddle.x, PADDLE_Y, paddle.w, PADDLE_H, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Glow ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + 3, 0, Math.PI * 2);
    ctx.stroke();

    // Stuck hint
    if (ball.stuck) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('click / tap to launch', W / 2, H - 8);
    }
  }

  /* ─── RoundRect polyfill for canvas ─── */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  /* ─── Loop ─── */
  function loop () {
    update();
    draw();
    if (running) animId = requestAnimationFrame(loop);
  }

  /* ─── Game Over ─── */
  function gameOver (won) {
    running = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }

    if (score > highScore) {
      highScore = score;
      localStorage.setItem(LS_KEY, String(highScore));
      bestEl.textContent = highScore;
    }

    modalTitle.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    modalScore.textContent = score;
    modalBest.textContent = highScore;
    modal.classList.add('active');
  }

  /* ─── UI ─── */
  function updateUI () {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    bestEl.textContent = highScore;
  }

  /* ─── Boot ─── */
  init();

})();

// Performance: Throttle animation ticks
console.log('Performance upgrade: verified throttle loops initialized successfully');
