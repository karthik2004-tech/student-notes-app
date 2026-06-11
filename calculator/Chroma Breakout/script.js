// ============================================================
//  CHROMA BREAKOUT — Core Game Engine
//  Physics, color-state collision, particle system
// ============================================================

// ─── CONSTANTS ──────────────────────────────────────────────

const COLORS = ['#ef4444', '#10b981', '#3b82f6'];
const COLOR_NAMES = ['RED', 'GREEN', 'BLUE'];
const CANVAS_W = 640;
const CANVAS_H = 480;
const PADDLE_W = 100;
const PADDLE_H = 12;
const BALL_R = 7;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_W = CANVAS_W / BRICK_COLS;
const BRICK_H = 18;
const BRICK_PAD = 2;
const BRICK_TOP = 50;
const BALL_SPEED_BASE = 4;
const COLOR_CYCLE_MS = 3000;
const MAX_LIVES = 3;

// ─── STATE ──────────────────────────────────────────────────

const state = {
  ball: { x: CANVAS_W / 2, y: CANVAS_H - 40, dx: 0, dy: 0, r: BALL_R },
  paddle: { x: CANVAS_W / 2 - PADDLE_W / 2, y: CANVAS_H - 24, w: PADDLE_W, h: PADDLE_H },
  bricks: [],
  particles: [],
  score: 0,
  highScore: 0,
  lives: MAX_LIVES,
  colorIndex: 1,
  colorTimer: 0,
  isPlaying: false,
  isPaused: false,
  isLaunched: false,
  difficulty: 1,
  timeElapsed: 0,
  lastTime: 0,
  animId: null,
};

// ─── DOM REFS ───────────────────────────────────────────────

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const telemScore = document.getElementById('telem-score');
const telemHighScore = document.getElementById('telem-highscore');
const telemBall = document.getElementById('telem-ball');
const telemLives = document.getElementById('telem-lives');
const telemTime = document.getElementById('telem-time');
const velocityDisplay = document.getElementById('velocity-display');
const diagStatus = document.getElementById('diag-status');
const btnLaunch = document.getElementById('btn-launch');
const diffBtns = document.querySelectorAll('.diff-btn');
const canvasStage = document.getElementById('canvas-stage');

// ─── CANVAS SETUP ──────────────────────────────────────────

function initCanvas() {
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
}

// ─── BRICK GENERATION ──────────────────────────────────────

function generateBricks() {
  state.bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      const colorIdx = row % 3;
      state.bricks.push({
        x: col * BRICK_W + BRICK_PAD,
        y: BRICK_TOP + row * (BRICK_H + BRICK_PAD),
        w: BRICK_W - BRICK_PAD * 2,
        h: BRICK_H - BRICK_PAD,
        colorIdx,
        alive: true,
      });
    }
  }
}

// ─── PARTICLES ─────────────────────────────────────────────

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    state.particles.push({
      x, y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function updateParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.05;
    p.life -= p.decay;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── BALL COLOR ────────────────────────────────────────────

function getBallColor() {
  return COLORS[state.colorIndex];
}

function getBallColorName() {
  return COLOR_NAMES[state.colorIndex];
}

function updateBallColorDisplay() {
  const name = getBallColorName();
  const cls = 'ball-' + name.toLowerCase();
  telemBall.textContent = name;
  telemBall.className = 'telem-value ' + cls;
  canvasStage.style.setProperty('--current-ball-glow', `rgba(${state.colorIndex === 0 ? '239,68,68' : state.colorIndex === 1 ? '16,185,129' : '59,130,246'},0.12)`);
}

// ─── GAME UPDATE ───────────────────────────────────────────

function resetBall() {
  state.ball.x = CANVAS_W / 2;
  state.ball.y = CANVAS_H - 40;
  state.ball.dx = 0;
  state.ball.dy = 0;
  state.isLaunched = false;
  state.paddle.x = CANVAS_W / 2 - PADDLE_W / 2;
}

function launchBall() {
  if (state.isLaunched) return;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
  const speed = BALL_SPEED_BASE * (1 + (state.difficulty - 1) * 0.3);
  state.ball.dx = Math.cos(angle) * speed;
  state.ball.dy = Math.sin(angle) * speed;
  state.isLaunched = true;
  state.isPlaying = true;
}

function loseLife() {
  state.lives--;
  telemLives.textContent = state.lives;
  if (state.lives <= 0) {
    gameOver();
    return;
  }
  resetBall();
}

function gameOver() {
  state.isPlaying = false;
  state.isLaunched = false;
  if (state.animId) cancelAnimationFrame(state.animId);
  state.animId = null;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    telemHighScore.textContent = state.highScore;
  }
  setDiagnostic('GAME OVER — ENGINE REBOOT', 'gameover');
  btnLaunch.textContent = 'LAUNCH SIMULATION INSTANCE';
  btnLaunch.classList.remove('paused');
  drawGameOver();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#ef4444';
  ctx.font = '32px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 10);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px ui-monospace, Consolas, monospace';
  ctx.fillText('Score: ' + state.score, CANVAS_W / 2, CANVAS_H / 2 + 30);
}

function checkWin() {
  const remaining = state.bricks.filter(b => b.alive).length;
  if (remaining === 0) {
    state.isPlaying = false;
    if (state.animId) cancelAnimationFrame(state.animId);
    state.animId = null;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      telemHighScore.textContent = state.highScore;
    }
    setDiagnostic('VICTORY — ALL BRICKS DESTROYED', 'active');
    btnLaunch.textContent = 'LAUNCH SIMULATION INSTANCE';
    btnLaunch.classList.remove('paused');

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#10b981';
    ctx.font = '28px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px ui-monospace, Consolas, monospace';
    ctx.fillText('Score: ' + state.score, CANVAS_W / 2, CANVAS_H / 2 + 30);
    return true;
  }
  return false;
}

// ─── COLLISION DETECTION ───────────────────────────────────

function ballBrickCollision(ball, brick) {
  const bx = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
  const by = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
  const dx = ball.x - bx;
  const dy = ball.y - by;
  return (dx * dx + dy * dy) < (ball.r * ball.r);
}

function handleCollisions() {
  const b = state.ball;

  // Walls
  if (b.x - b.r < 0) { b.x = b.r; b.dx = Math.abs(b.dx); }
  if (b.x + b.r > CANVAS_W) { b.x = CANVAS_W - b.r; b.dx = -Math.abs(b.dx); }
  if (b.y - b.r < 0) { b.y = b.r; b.dy = Math.abs(b.dy); }

  // Bottom = lose life
  if (b.y + b.r > CANVAS_H) {
    loseLife();
    return;
  }

  // Paddle
  const p = state.paddle;
  if (b.dy > 0 &&
      b.x > p.x && b.x < p.x + p.w &&
      b.y + b.r > p.y && b.y + b.r < p.y + p.h + 10) {
    const hit = (b.x - (p.x + p.w / 2)) / (p.w / 2);
    const angle = hit * Math.PI / 3;
    const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
    b.dx = Math.sin(angle) * speed;
    b.dy = -Math.cos(angle) * speed;
    b.y = p.y - b.r;
  }

  // Bricks
  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    if (!ballBrickCollision(b, brick)) continue;

    // Color match check
    if (state.colorIndex === brick.colorIdx) {
      // Match — destroy brick
      brick.alive = false;
      state.score += 10 * state.difficulty;
      telemScore.textContent = state.score;
      spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, COLORS[brick.colorIdx], 12);
      setDiagnostic('CHROMATIC ENGINE ACTIVE', 'active');
    } else {
      // Mismatch — bounce, no destroy, penalty flash
      setDiagnostic('BRICK MISMATCH REFLECTION', 'mismatch');
      canvasStage.style.boxShadow = 'inset 0 0 60px rgba(239,68,68,0.25)';
      setTimeout(() => {
        canvasStage.style.boxShadow = 'inset 0 0 60px var(--current-ball-glow)';
      }, 200);
    }

    // Always bounce off brick
    const overlapX = (b.x - brick.x - brick.w / 2) / (brick.w / 2);
    const overlapY = (b.y - brick.y - brick.h / 2) / (brick.h / 2);
    if (Math.abs(overlapX) > Math.abs(overlapY)) {
      b.dx = -b.dx;
    } else {
      b.dy = -b.dy;
    }
    break;
  }
}

// ─── UPDATE ─────────────────────────────────────────────────

function update(dt) {
  if (!state.isPlaying || state.isPaused) return;

  state.timeElapsed += dt;
  const mins = Math.floor(state.timeElapsed / 60);
  const secs = Math.floor(state.timeElapsed % 60);
  telemTime.textContent = mins + ':' + String(secs).padStart(2, '0');

  // Color cycle
  state.colorTimer += dt;
  if (state.colorTimer >= COLOR_CYCLE_MS / 1000) {
    state.colorTimer = 0;
    state.colorIndex = (state.colorIndex + 1) % 3;
    updateBallColorDisplay();
  }

  if (!state.isLaunched) {
    state.ball.x = state.paddle.x + state.paddle.w / 2;
    state.ball.y = CANVAS_H - 40;
    return;
  }

  // Move ball
  state.ball.x += state.ball.dx;
  state.ball.y += state.ball.dy;

  handleCollisions();
  updateParticles();

  velocityDisplay.textContent = 'v: (' + state.ball.dx.toFixed(1) + ', ' + state.ball.dy.toFixed(1) + ')';

  if (checkWin()) return;
}

// ─── DRAW ───────────────────────────────────────────────────

function draw() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Bricks
  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = COLORS[brick.colorIdx];
    ctx.shadowColor = COLORS[brick.colorIdx];
    ctx.shadowBlur = 6;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.shadowBlur = 0;
  }

  // Paddle
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = '#f8fafc';
  ctx.shadowBlur = 8;
  const p = state.paddle;
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, p.h, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ball
  const ballColor = getBallColor();
  ctx.fillStyle = ballColor;
  ctx.shadowColor = ballColor;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ball color timer ring
  const progress = state.colorTimer / (COLOR_CYCLE_MS / 1000);
  ctx.strokeStyle = ballColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Particles
  drawParticles();
}

// Polyfill roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
  };
}

// ─── GAME LOOP ─────────────────────────────────────────────

let lastTimestamp = 0;

function gameLoop(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  update(Math.min(dt, 0.05));
  draw();

  if (state.isPlaying || !state.isLaunched) {
    state.animId = requestAnimationFrame(gameLoop);
  }
}

// ─── PADDLE CONTROL ────────────────────────────────────────

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const scale = CANVAS_W / rect.width;
  state.paddle.x = mx * scale - state.paddle.w / 2;
  if (state.paddle.x < 0) state.paddle.x = 0;
  if (state.paddle.x + state.paddle.w > CANVAS_W) state.paddle.x = CANVAS_W - state.paddle.w;
});

canvas.addEventListener('click', () => {
  if (state.isPlaying && !state.isLaunched) {
    launchBall();
  }
});

// Touch
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const mx = touch.clientX - rect.left;
  const scale = CANVAS_W / rect.width;
  state.paddle.x = mx * scale - state.paddle.w / 2;
  if (state.paddle.x < 0) state.paddle.x = 0;
  if (state.paddle.x + state.paddle.w > CANVAS_W) state.paddle.x = CANVAS_W - state.paddle.w;
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state.isPlaying && !state.isLaunched) {
    launchBall();
  }
}, { passive: false });

// Keyboard
document.addEventListener('keydown', (e) => {
  const speed = 20;
  if (e.key === 'ArrowLeft') {
    state.paddle.x -= speed;
    if (state.paddle.x < 0) state.paddle.x = 0;
    if (!state.isLaunched) {
      state.ball.x = state.paddle.x + state.paddle.w / 2;
    }
  }
  if (e.key === 'ArrowRight') {
    state.paddle.x += speed;
    if (state.paddle.x + state.paddle.w > CANVAS_W) state.paddle.x = CANVAS_W - state.paddle.w;
    if (!state.isLaunched) {
      state.ball.x = state.paddle.x + state.paddle.w / 2;
    }
  }
  if (e.key === ' ' || e.key === 'Enter') {
    if (state.isPlaying && !state.isLaunched) {
      launchBall();
    }
  }
});

// ─── BUTTON EVENTS ─────────────────────────────────────────

btnLaunch.addEventListener('click', () => {
  if (!state.isPlaying && state.lives <= 0) {
    // Full restart
    state.lives = MAX_LIVES;
    state.score = 0;
    telemLives.textContent = state.lives;
    telemScore.textContent = state.score;
    state.timeElapsed = 0;
    state.colorTimer = 0;
    state.colorIndex = 1;
    updateBallColorDisplay();
    generateBricks();
    resetBall();
    btnLaunch.textContent = 'PAUSE GAMEPLAY';
    btnLaunch.classList.add('paused');
    state.isPaused = false;
    state.isPlaying = true;
    lastTimestamp = 0;
    setDiagnostic('CHROMATIC ENGINE ACTIVE', 'active');
    if (state.animId) cancelAnimationFrame(state.animId);
    state.animId = requestAnimationFrame(gameLoop);
    return;
  }

  if (state.isPlaying && !state.isLaunched) {
    launchBall();
  }

  // Toggle pause
  state.isPaused = !state.isPaused;
  btnLaunch.textContent = state.isPaused ? 'RESUME GAMEPLAY' : 'PAUSE GAMEPLAY';
  btnLaunch.classList.toggle('paused', !state.isPaused);
  setDiagnostic(state.isPaused ? 'GAME PAUSED' : 'CHROMATIC ENGINE ACTIVE', state.isPaused ? 'idle' : 'active');
  if (!state.isPaused) {
    lastTimestamp = 0;
    state.animId = requestAnimationFrame(gameLoop);
  }
});

// Difficulty
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = parseInt(btn.dataset.diff);
  });
});

// ─── SET DIAGNOSTIC ────────────────────────────────────────

function setDiagnostic(msg, cls) {
  diagStatus.textContent = msg;
  diagStatus.className = 'diag-status ' + cls;
}

// ─── INIT ───────────────────────────────────────────────────

function init() {
  initCanvas();
  generateBricks();
  resetBall();
  updateBallColorDisplay();
  telemLives.textContent = state.lives;
  setDiagnostic('AWAITING INITIALIZATION FLIGHT', 'idle');
}

init();
