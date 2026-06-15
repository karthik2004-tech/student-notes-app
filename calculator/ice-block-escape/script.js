/* ── Canvas Setup ── */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 600;
const H = 700;

/* ── Constants ── */

const CHAR_W = 30;
const CHAR_H = 38;
const CHAR_Y = H - 56;
const BLOCK_H_MIN = 28;
const BLOCK_H_MAX = 44;
const BLOCK_W_MIN = 44;
const BLOCK_W_MAX = 110;
const DAMPING = 0.88;
const ACCEL = 0.7;
const MAX_VX = 5.5;
const BASE_SPEED_INIT = 2.2;
const MAX_SPEED = 7;
const SPAWN_INTERVAL_INIT = 1100;
const SPAWN_INTERVAL_MIN = 260;
const DIFFICULTY_INTERVAL = 5000;
const MULTIPLIER_INTERVAL = 10000;
const SHAKE_DURATION = 28;

/* ── DOM Refs ── */

const scoreEl = document.getElementById('scoreValue');
const multEl = document.getElementById('multValue');
const bestEl = document.getElementById('bestValue');
const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const finalMultEl = document.getElementById('finalMult');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

/* ── State ── */

let state = 'menu';
let survivalTime = 0;
let multiplier = 1;
let highScore = 0;
let baseSpeed = BASE_SPEED_INIT;
let spawnInterval = SPAWN_INTERVAL_INIT;
let spawnTimer = 0;
let difficultyTimer = 0;
let multiplierTimer = 0;
let char, blocks, particles, fractureLines;
let shakeRemaining = 0;
let lastTime = 0;
let keys = {};
let mouseActive = false;

/* ─── Character ─── */

function resetChar() {
  char = { x: W / 2, y: CHAR_Y, w: CHAR_W, h: CHAR_H, vx: 0 };
}

function drawChar() {
  const { x, y, w, h } = char;
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x, y + h / 2 + 2, w / 2 + 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  roundRect(ctx, x - w / 2 + 3, y - h / 2, w - 6, h, 4);
  ctx.fill();

  ctx.fillStyle = '#e2e8f0';
  roundRect(ctx, x - w / 4, y - h / 2 + h * 0.12, w / 2, h * 0.72, 3);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(x, y - h / 2 + 2, w / 2 - 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(x, y - h / 2, w / 2 + 1, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, 3);

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 5, y - h / 2 - 2, 3.5, 0, Math.PI * 2);
  ctx.arc(x + 5, y - h / 2 - 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x - 4, y - h / 2 - 3, 1.8, 0, Math.PI * 2);
  ctx.arc(x + 6, y - h / 2 - 3, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x - w / 3.5, y - h / 2, w / 1.75, 4.5);

  ctx.fillStyle = '#f97316';
  roundRect(ctx, x - w / 3.2, y + h / 2 - 3, w / 3.5, 4, 2);
  ctx.fill();
  roundRect(ctx, x + 1, y + h / 2 - 3, w / 3.5, 4, 2);
  ctx.fill();

  ctx.restore();
}

/* ─── Ice Blocks ─── */

function spawnBlock() {
  const w = BLOCK_W_MIN + Math.random() * (BLOCK_W_MAX - BLOCK_W_MIN);
  const h = BLOCK_H_MIN + Math.random() * (BLOCK_H_MAX - BLOCK_H_MIN);
  const x = w / 2 + Math.random() * (W - w);
  blocks.push({
    x, y: -h, w, h,
    speed: baseSpeed + (Math.random() - 0.5) * 0.6,
    rot: (Math.random() - 0.5) * 0.05,
  });
}

function drawBlock(b) {
  const { x, y, w, h } = b;
  ctx.save();

  ctx.shadowColor = 'rgba(103, 232, 249, 0.08)';
  ctx.shadowBlur = 12;

  const grad = ctx.createLinearGradient(x - w / 2, y - h, x + w / 2, y);
  grad.addColorStop(0, 'rgba(147, 197, 253, 0.65)');
  grad.addColorStop(0.4, 'rgba(191, 219, 254, 0.50)');
  grad.addColorStop(1, 'rgba(147, 197, 253, 0.35)');
  ctx.fillStyle = grad;
  roundRect(ctx, x - w / 2, y - h, w, h, 5);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, x - w / 2 + 4, y - h + 4, w * 0.35, h * 0.35, 3);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x - w / 2 + 2, y - h + 2, w - 4, 2);

  ctx.strokeStyle = 'rgba(147, 197, 253, 0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, x - w / 2, y - h, w, h, 5);
  ctx.stroke();

  ctx.restore();
}

/* ─── Fracture ─── */

function generateFracture(cx, cy) {
  fractureLines = [];
  for (let i = 0; i < 8; i++) {
    const ex = cx + (Math.random() - 0.5) * 500;
    const ey = cy + (Math.random() - 0.5) * 500;
    const cp1x = (cx + ex) / 3 + (Math.random() - 0.5) * 100;
    const cp1y = (cy + ey) / 3 + (Math.random() - 0.5) * 100;
    fractureLines.push({ cx, cy, ex, ey, cp1x, cp1y });
  }
}

function drawFracture() {
  ctx.strokeStyle = 'rgba(191, 219, 254, 0.25)';
  ctx.lineWidth = 1.5;
  for (const f of fractureLines) {
    ctx.beginPath();
    ctx.moveTo(f.cx, f.cy);
    ctx.quadraticCurveTo(f.cp1x, f.cp1y, f.ex, f.ey);
    ctx.stroke();
  }

  for (const f of fractureLines) {
    const splitX = (f.cx + f.cp1x) / 2 + (Math.random() - 0.5) * 30;
    const splitY = (f.cy + f.cp1y) / 2 + (Math.random() - 0.5) * 30;
    ctx.strokeStyle = 'rgba(191, 219, 254, 0.12)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(splitX, splitY);
    ctx.lineTo(splitX + (Math.random() - 0.5) * 60, splitY + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
}

/* ─── Particles ─── */

function burstParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 0.5 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 1,
      life: 1,
      color,
      size: 1.5 + Math.random() * 3.5,
    });
  }
}

function updateParticles(dt) {
  const steps = Math.ceil(dt / 16);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    for (let s = 0; s < steps; s++) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.07;
      p.life -= 0.018;
    }
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ─── Helpers ─── */

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

/* ─── Collision ─── */

function checkCollision() {
  const cx = char.x;
  const cy = char.y;
  const cw = char.w;
  const ch = char.h;

  for (const b of blocks) {
    if (
      cx + cw / 2 > b.x - b.w / 2 &&
      cx - cw / 2 < b.x + b.w / 2 &&
      cy + ch / 2 > b.y - b.h &&
      cy - ch / 2 < b.y
    ) {
      return true;
    }
  }
  return false;
}

/* ─── Game Loop ─── */

function loop(time) {
  const dt = lastTime ? Math.min(time - lastTime, 50) : 16;
  lastTime = time;

  if (state === 'playing') {
    update(dt);
    draw();
  } else if (state === 'dying') {
    updateParticles(dt);
    draw();
  } else {
    draw();
  }

  requestAnimationFrame(loop);
}

function update(dt) {
  survivalTime += dt;
  difficultyTimer += dt;
  multiplierTimer += dt;

  if (difficultyTimer >= DIFFICULTY_INTERVAL) {
    difficultyTimer -= DIFFICULTY_INTERVAL;
    baseSpeed = Math.min(baseSpeed + 0.25, MAX_SPEED);
    spawnInterval = Math.max(SPAWN_INTERVAL_MIN, spawnInterval - 45);
  }

  if (multiplierTimer >= MULTIPLIER_INTERVAL) {
    multiplierTimer -= MULTIPLIER_INTERVAL;
    multiplier++;
    multEl.textContent = '\u00d7' + String(multiplier);
  }

  spawnTimer += dt;
  if (spawnTimer >= spawnInterval) {
    spawnTimer -= spawnInterval;
    spawnBlock();
  }

  for (const b of blocks) {
    b.y += b.speed * (dt / 16);
  }

  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].y - blocks[i].h > H + 20) {
      blocks.splice(i, 1);
    }
  }

  updatePlayer(dt);

  if (checkCollision()) {
    triggerDeath();
    return;
  }

  const seconds = survivalTime / 1000;
  scoreEl.textContent = seconds.toFixed(1);

  if (seconds > highScore) {
    highScore = seconds;
    bestEl.textContent = seconds.toFixed(1);
  }

  updateParticles(dt);
}

/* ─── Player ─── */

function updatePlayer(dt) {
  const f = dt / 16;

  if (!mouseActive) {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) char.vx -= ACCEL * f;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) char.vx += ACCEL * f;
    char.vx *= Math.pow(DAMPING, f);
    if (Math.abs(char.vx) < 0.05) char.vx = 0;
    char.vx = Math.max(-MAX_VX, Math.min(MAX_VX, char.vx));
    char.x += char.vx * f;
  }

  char.x = Math.max(char.w / 2, Math.min(W - char.w / 2, char.x));
}

/* ─── Death ─── */

function triggerDeath() {
  state = 'dying';
  generateFracture(char.x, char.y);
  burstParticles(char.x, char.y, '#22d3ee', 18);
  burstParticles(char.x, char.y, '#e2e8f0', 12);

  canvas.classList.remove('impact-shake');
  void canvas.offsetWidth;
  canvas.classList.add('impact-shake');

  const seconds = survivalTime / 1000;
  if (seconds > highScore) {
    highScore = seconds;
    saveBest();
  }

  setTimeout(() => {
    finalScoreEl.textContent = seconds.toFixed(1) + 's';
    finalBestEl.textContent = highScore.toFixed(1) + 's';
    finalMultEl.textContent = '\u00d7' + String(multiplier);
    bestEl.textContent = highScore.toFixed(1);
    state = 'gameOver';
    gameOverOverlay.classList.remove('hidden');
  }, 600);
}

/* ─── Drawing ─── */

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a1020');
  grad.addColorStop(0.5, '#0e1628');
  grad.addColorStop(1, '#080d1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.02)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawGround() {
  const gy = char.y + char.h / 2 + 2;
  const grad = ctx.createLinearGradient(0, gy - 6, 0, H);
  grad.addColorStop(0, '#1a2a44');
  grad.addColorStop(1, '#0e1628');
  ctx.fillStyle = grad;
  ctx.fillRect(0, gy, W, H - gy);

  ctx.fillStyle = 'rgba(191, 219, 254, 0.3)';
  ctx.fillRect(0, gy - 2, W, 3.5);

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let i = 0; i < 14; i++) {
    const sx = ((i * 43 + 7) % W);
    const sy = gy + 8 + (i % 4) * 14;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.save();

  drawBackground();
  drawGrid();
  for (const b of blocks) drawBlock(b);
  drawGround();
  drawChar();
  drawParticles();

  if (state === 'dying' || state === 'gameOver') {
    drawFracture();
  }

  ctx.restore();
}

/* ─── Session ─── */

function startGame() {
  survivalTime = 0;
  multiplier = 1;
  baseSpeed = BASE_SPEED_INIT;
  spawnInterval = SPAWN_INTERVAL_INIT;
  spawnTimer = 0;
  difficultyTimer = 0;
  multiplierTimer = 0;
  blocks = [];
  particles = [];
  fractureLines = [];
  mouseActive = false;
  lastTime = 0;

  resetChar();
  scoreEl.textContent = '0.0';
  multEl.textContent = '\u00d71';
  bestEl.textContent = highScore.toFixed(1);

  startOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');

  state = 'playing';
}

/* ─── High Score ─── */

function loadBest() {
  try {
    const v = localStorage.getItem('iceBlockBest');
    if (v !== null) highScore = parseFloat(v) || 0;
  } catch (_) { highScore = 0; }
  bestEl.textContent = highScore.toFixed(1);
}

function saveBest() {
  try { localStorage.setItem('iceBlockBest', String(highScore)); } catch (_) {}
}

/* ─── Input ─── */

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (e.code === 'KeyP') {
    if (state === 'playing') {
      state = 'paused';
      pauseOverlay.classList.remove('hidden');
    } else if (state === 'paused') {
      state = 'playing';
      pauseOverlay.classList.add('hidden');
      lastTime = 0;
    }
  }

  if (e.code === 'Enter') {
    if (state === 'menu') startGame();
    else if (state === 'gameOver') startGame();
  }

  if (e.code === 'Space' && state === 'playing') {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  if (state !== 'playing') return;
  mouseActive = true;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const mx = (e.clientX - rect.left) * scaleX;
  char.x = Math.max(char.w / 2, Math.min(W - char.w / 2, mx));
  char.vx = 0;
});

canvas.addEventListener('click', () => {
  if (state === 'menu') startGame();
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state === 'menu') startGame();
  mouseActive = true;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (state !== 'playing') return;
  mouseActive = true;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const touch = e.touches[0];
  const mx = (touch.clientX - rect.left) * scaleX;
  char.x = Math.max(char.w / 2, Math.min(W - char.w / 2, mx));
  char.vx = 0;
}, { passive: false });

/* ─── Events ─── */

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

/* ─── Boot ─── */

highScore = 0;
loadBest();
resetChar();
blocks = [];
particles = [];
fractureLines = [];
update();
requestAnimationFrame(loop);
