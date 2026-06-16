/* ── Canvas Setup ── */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 500;
const H = 700;

/* ── Color Pool ── */

const COLORS = [
  { hex: '#ff2d95', glow: 'rgba(255,45,149,0.3)', name: 'PINK' },
  { hex: '#00e5ff', glow: 'rgba(0,229,255,0.3)',  name: 'CYAN' },
  { hex: '#39ff14', glow: 'rgba(57,255,20,0.3)',  name: 'GREEN' },
  { hex: '#ffe600', glow: 'rgba(255,230,0,0.3)',  name: 'YELLOW' },
];

/* ── Game Config ── */

const INITIAL_SPEED = 2;
const SPEED_STEP = 0.35;
const SPEED_INTERVAL = 5;
const SPAWN_INTERVAL = 1300;
const GEM_SIZE = 24;
const PADDLE_W = 76;
const PADDLE_H = 14;
const PADDLE_Y = H - 36;
const MAX_LIVES = 3;

/* ── DOM Refs ── */

const scoreDisplay = document.getElementById('scoreDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const bestDisplay = document.getElementById('bestDisplay');
const ciSwatch = document.getElementById('ciSwatch');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScore = document.getElementById('finalScore');
const finalBest = document.getElementById('finalBest');

/* ── State ── */

let state = 'menu'; // menu | playing | gameOver
let score = 0;
let highScore = 0;
let lives = MAX_LIVES;
let baseSpeed = INITIAL_SPEED;
let paddleColor = 0;
let items = [];
let lastSpawn = 0;
let animId = null;
let paddleX = W / 2 - PADDLE_W / 2;

/* ── Item Spawn ── */

function spawnItem() {
  const ci = Math.floor(Math.random() * COLORS.length);
  const margin = 10;
  const x = margin + Math.random() * (W - 2 * margin - GEM_SIZE);
  items.push({
    x, y: -GEM_SIZE, w: GEM_SIZE, h: GEM_SIZE,
    colorIndex: ci,
    speed: baseSpeed + Math.random() * 0.5,
  });
}

/* ── Game Loop ── */

function loop(ts) {
  if (state === 'playing') {
    update(ts);
    draw();
  }
  animId = requestAnimationFrame(loop);
}

function update(ts) {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.y += item.speed;

    if (collides(item)) {
      if (item.colorIndex === paddleColor) {
        onCatch(i);
      } else {
        onWrong(i);
      }
      if (state !== 'playing') return;
      continue;
    }

    if (item.y > H) {
      if (item.colorIndex === paddleColor) {
        onMiss(i);
        if (state !== 'playing') return;
      } else {
        items.splice(i, 1);
      }
    }
  }

  if (ts - lastSpawn > SPAWN_INTERVAL) {
    spawnItem();
    lastSpawn = ts;
  }
}

function collides(item) {
  return item.x < paddleX + PADDLE_W &&
         item.x + item.w > paddleX &&
         item.y < PADDLE_Y + PADDLE_H &&
         item.y + item.h > PADDLE_Y;
}

/* ── Catch / Wrong / Miss ── */

function onCatch(index) {
  items.splice(index, 1);
  score += 10;

  canvas.classList.remove('match-flash');
  void canvas.offsetWidth;
  canvas.classList.add('match-flash');

  if (score % SPEED_INTERVAL === 0) {
    baseSpeed += SPEED_STEP;
  }

  updateHUD();
}

function onWrong(index) {
  items.splice(index, 1);
  lives--;
  triggerShake();
  updateHUD();
  if (lives <= 0) endGame();
}

function onMiss(index) {
  items.splice(index, 1);
  lives--;
  triggerShake();
  updateHUD();
  if (lives <= 0) endGame();
}

function triggerShake() {
  canvas.classList.remove('shake');
  void canvas.offsetWidth;
  canvas.classList.add('shake');
}

/* ── Draw ── */

function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const item of items) {
    const c = COLORS[item.colorIndex];
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    const r = item.w / 2;

    ctx.shadowColor = c.hex;
    ctx.shadowBlur = 12;
    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const pc = COLORS[paddleColor];
  ctx.shadowColor = pc.hex;
  ctx.shadowBlur = 18;
  ctx.fillStyle = pc.hex;
  ctx.beginPath();
  roundRect(ctx, paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 5);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  roundRect(ctx, paddleX + 6, PADDLE_Y + 3, PADDLE_W - 12, 4, 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Color Shift ── */

function shiftColor() {
  paddleColor = (paddleColor + 1) % COLORS.length;
  ciSwatch.style.background = COLORS[paddleColor].hex;
  ciSwatch.classList.remove('pulse');
  void ciSwatch.offsetWidth;
  ciSwatch.classList.add('pulse');
}

/* ── HUD ── */

function updateHUD() {
  scoreDisplay.textContent = String(score);
  const speedLevel = Math.floor((baseSpeed - INITIAL_SPEED) / SPEED_STEP) + 1;
  speedDisplay.textContent = String(speedLevel);
  livesDisplay.textContent = String(lives);
  bestDisplay.textContent = String(highScore);
}

/* ── Session ── */

function startGame() {
  score = 0;
  lives = MAX_LIVES;
  baseSpeed = INITIAL_SPEED;
  paddleColor = 0;
  items = [];
  lastSpawn = 0;
  paddleX = W / 2 - PADDLE_W / 2;

  ciSwatch.style.background = COLORS[0].hex;

  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');

  updateHUD();
  state = 'playing';
  lastSpawn = performance.now();
}

function endGame() {
  state = 'gameOver';

  if (score > highScore) {
    highScore = score;
    saveBest();
  }

  finalScore.textContent = String(score);
  finalBest.textContent = String(highScore);
  bestDisplay.textContent = String(highScore);

  gameOverOverlay.classList.remove('hidden');
}

/* ── High Score ── */

function loadBest() {
  try {
    const v = localStorage.getItem('colorCatcherBest');
    if (v !== null) highScore = parseInt(v, 10) || 0;
  } catch (_) {}
  bestDisplay.textContent = String(highScore);
}

function saveBest() {
  try { localStorage.setItem('colorCatcherBest', String(highScore)); } catch (_) {}
}

/* ── Keyboard ── */

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (state === 'playing') shiftColor();
    return;
  }

  if (e.code === 'ArrowLeft' && state === 'playing') {
    paddleX = Math.max(0, paddleX - 14);
  }
  if (e.code === 'ArrowRight' && state === 'playing') {
    paddleX = Math.min(W - PADDLE_W, paddleX + 14);
  }
});

/* ── Mouse ── */

canvas.addEventListener('mousemove', (e) => {
  if (state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width;
  const mx = (e.clientX - rect.left) * sx;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2));
});

canvas.addEventListener('click', () => {
  if (state === 'playing') shiftColor();
});

/* ── Touch ── */

canvas.addEventListener('touchmove', (e) => {
  if (state !== 'playing') return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width;
  const mx = (e.touches[0].clientX - rect.left) * sx;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2));
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
  if (state === 'playing') {
    e.preventDefault();
    shiftColor();
  }
}, { passive: false });

/* ── Event Wiring ── */

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

/* ── Boot ── */

loadBest();
updateHUD();
ciSwatch.style.background = COLORS[0].hex;
loop(performance.now());
