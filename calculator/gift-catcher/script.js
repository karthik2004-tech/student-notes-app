/* ── Canvas Setup ── */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 500;
const H = 700;

/* ── Constants ── */

const BASKET_W = 110;
const BASKET_H = 44;
const BASKET_Y = H - 65;
const BASKET_SPEED = 5;
const ITEM_SIZE = 34;
const MAX_LIVES = 3;
const BASE_SPEED_INIT = 1.6;
const MAX_SPEED = 5.5;
const DIFFICULTY_INTERVAL = 14000;
const SCORE_BOOST_INTERVAL = 500;
const SPAWN_INTERVAL_INIT = 950;
const SPAWN_INTERVAL_MIN = 320;
const GIFT_CHANCE = 0.72;

const GIFT_TYPES = [
  { body: '#ff4444', ribbon: '#ffd700', points: 15 },
  { body: '#4488ff', ribbon: '#c0c0c0', points: 20 },
  { body: '#44cc44', ribbon: '#ffd700', points: 10 },
  { body: '#ffd700', ribbon: '#ff4444', points: 25 },
  { body: '#cc44ff', ribbon: '#ffffff', points: 15 },
];

const BAD_TYPES = [
  { fill: '#1f1f1f', accent: '#3a3a3a', label: 'coal' },
  { fill: '#3a2a1a', accent: '#5a4a3a', label: 'trash' },
  { fill: '#2a1a0a', accent: '#4a3a2a', label: 'boot' },
];

/* ── DOM Refs ── */

const scoreEl = document.getElementById('scoreValue');
const livesEl = document.getElementById('livesValue');
const bestEl = document.getElementById('bestValue');
const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

/* ── State ── */

let state = 'menu'; // menu | playing | paused | gameOver
let score, lives, highScore;
let basket, items, particles, snowflakes;
let baseSpeed, spawnInterval, spawnTimer;
let difficultyTimer, scoreBoostFloor;
let lastTime;
let keys = {};

/* ─── Snowflakes ─── */

function initSnowflakes() {
  snowflakes = [];
  for (let i = 0; i < 35; i++) {
    snowflakes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2,
      speed: 0.2 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 0.25,
    });
  }
}

function updateSnowflakes() {
  for (const s of snowflakes) {
    s.y += s.speed;
    s.x += s.drift;
    if (s.y > H) { s.y = -4; s.x = Math.random() * W; }
    if (s.x < -4) s.x = W + 4;
    if (s.x > W + 4) s.x = -4;
  }
}

function drawSnowflakes() {
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (const s of snowflakes) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── Basket ─── */

function resetBasket() {
  basket = { x: W / 2 - BASKET_W / 2, y: BASKET_Y, w: BASKET_W, h: BASKET_H };
}

function drawBasket() {
  const { x, y, w, h } = basket;

  ctx.save();
  ctx.shadowColor = 'rgba(139, 69, 19, 0.2)';
  ctx.shadowBlur = 10;

  ctx.fillStyle = '#8B6914';
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h);
  ctx.quadraticCurveTo(x - 6, y + h * 0.5, x + 3, y + 2);
  ctx.lineTo(x + w - 3, y + 2);
  ctx.quadraticCurveTo(x + w + 6, y + h * 0.5, x + w - 8, y + h);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#6B4E10';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h);
  ctx.quadraticCurveTo(x - 6, y + h * 0.5, x + 3, y + 2);
  ctx.lineTo(x + w - 3, y + 2);
  ctx.quadraticCurveTo(x + w + 6, y + h * 0.5, x + w - 8, y + h);
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = '#7A5A14';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 4; i++) {
    const t = (i + 1) / 5;
    const lx = x + 3 + (x + w - 8 - x - 3) * t;
    const ly = y + 2 + (y + h - y - 2) * t;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + (i % 2 === 0 ? 6 : -6), ly + 6);
    ctx.stroke();
  }

  ctx.fillStyle = '#5a3e0a';
  const rimY = y + 2;
  ctx.fillRect(x + 3, rimY - 3, w - 6, 5);

  ctx.restore();
}

/* ─── Items ─── */

function spawnItem() {
  const isGift = Math.random() < GIFT_CHANCE;
  const typeIdx = Math.floor(Math.random() * (isGift ? GIFT_TYPES.length : BAD_TYPES.length));
  const pad = ITEM_SIZE / 2;
  const x = pad + Math.random() * (W - ITEM_SIZE);

  items.push({
    x,
    y: -pad,
    size: ITEM_SIZE,
    isGift,
    typeIdx,
    speed: baseSpeed + (Math.random() - 0.5) * 0.3,
  });
}

function drawItem(item) {
  const s = item.size;
  const h = s / 2;
  const x = item.x;
  const y = item.y;

  if (item.isGift) {
    const t = GIFT_TYPES[item.typeIdx];
    ctx.save();
    ctx.shadowColor = t.body;
    ctx.shadowBlur = 6;

    ctx.fillStyle = t.body;
    ctx.shadowBlur = 0;
    ctx.fillRect(x - h, y - h, s, s);

    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - h, y - h, s, s);

    ctx.strokeStyle = t.ribbon;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x, y + h);
    ctx.moveTo(x - h, y);
    ctx.lineTo(x + h, y);
    ctx.stroke();

    ctx.fillStyle = t.ribbon;
    ctx.beginPath();
    ctx.ellipse(x - h * 0.28, y - h * 0.02, h * 0.2, h * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + h * 0.28, y - h * 0.02, h * 0.2, h * 0.12, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 1.5, y - 3, 3, 6);

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - h + 3, y - h + 3);
    ctx.lineTo(x - h + 10, y - h + 3);
    ctx.stroke();

    ctx.restore();
  } else {
    ctx.save();
    const t = BAD_TYPES[item.typeIdx];

    if (t.label === 'coal') {
      ctx.fillStyle = t.fill;
      ctx.beginPath();
      ctx.arc(x - h * 0.15, y - h * 0.1, h * 0.32, 0, Math.PI * 2);
      ctx.arc(x + h * 0.12, y + h * 0.05, h * 0.27, 0, Math.PI * 2);
      ctx.arc(x + h * 0.05, y - h * 0.18, h * 0.22, 0, Math.PI * 2);
      ctx.arc(x - h * 0.2, y + h * 0.2, h * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.arc(x - h * 0.1, y - h * 0.18, h * 0.09, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,80,80,0.4)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✗', x, y + 1);
    } else if (t.label === 'trash') {
      ctx.fillStyle = t.fill;
      ctx.beginPath();
      ctx.moveTo(x - h * 0.35, y - h * 0.2);
      ctx.lineTo(x + h * 0.35, y - h * 0.2);
      ctx.lineTo(x + h * 0.25, y + h * 0.4);
      ctx.lineTo(x - h * 0.25, y + h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.fillRect(x - h * 0.25, y - h * 0.35, h * 0.5, h * 0.18);
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - h * 0.25, y - h * 0.35, h * 0.5, h * 0.18);
    } else {
      ctx.fillStyle = t.fill;
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.15, h * 0.35, h * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - h * 0.08, y - h * 0.35, h * 0.16, h * 0.5);
      ctx.beginPath();
      ctx.arc(x, y - h * 0.2, h * 0.15, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.arc(x, y - h * 0.2, h * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/* ─── Particles ─── */

function burstParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 3.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      color,
      size: 1.5 + Math.random() * 3,
    });
  }
}

function updateParticles(dt) {
  const steps = Math.ceil(dt / 16);
  const fStep = dt / steps / 16;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    for (let s = 0; s < steps; s++) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life -= 0.016 * fStep;
    }
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
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

/* ─── Collision ─── */

function checkCollisions() {
  const bx = basket.x;
  const by = basket.y;
  const bw = basket.w;
  const bh = basket.h;
  const s = ITEM_SIZE;
  const h = s / 2;

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const ix = item.x;
    const iy = item.y;

    if (
      ix + h > bx && ix - h < bx + bw &&
      iy + h > by && iy - h < by + bh
    ) {
      if (item.isGift) {
        const t = GIFT_TYPES[item.typeIdx];
        score += t.points;
        if (score > highScore) highScore = score;
        updateHUD();
        burstParticles(ix, iy, t.body, 12);
        burstParticles(ix, iy, t.ribbon, 6);
        canvas.classList.remove('gift-flash');
        void canvas.offsetWidth;
        canvas.classList.add('gift-flash');
        checkScoreBoost();
      } else {
        lives--;
        updateHUD();
        burstParticles(ix, iy, '#ff4444', 14);
        burstParticles(ix, iy, '#ffaa00', 8);
        canvas.classList.remove('hit-flash');
        void canvas.offsetWidth;
        canvas.classList.add('hit-flash');
        if (lives <= 0) {
          endGame();
          return;
        }
      }
      items.splice(i, 1);
    }
  }
}

function checkMisses() {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i].y - items[i].size / 2 > H) {
      if (items[i].isGift) {
        score -= 3;
        if (score < 0) score = 0;
        updateHUD();
      }
      items.splice(i, 1);
    }
  }
}

/* ─── Difficulty ─── */

function checkScoreBoost() {
  if (score >= scoreBoostFloor + SCORE_BOOST_INTERVAL) {
    scoreBoostFloor = Math.floor(score / SCORE_BOOST_INTERVAL) * SCORE_BOOST_INTERVAL;
    baseSpeed = Math.min(baseSpeed + 0.2, MAX_SPEED);
    spawnInterval = Math.max(SPAWN_INTERVAL_MIN, spawnInterval - 40);
  }
}

/* ─── HUD ─── */

function updateHUD() {
  scoreEl.textContent = String(score);
  bestEl.textContent = String(highScore);
  let hearts = '';
  for (let i = 0; i < lives; i++) hearts += '\u2665';
  if (hearts === '') hearts = '\u2014';
  livesEl.textContent = hearts;
}

/* ─── Game Loop ─── */

function loop(time) {
  const dt = lastTime ? Math.min(time - lastTime, 50) : 16;
  lastTime = time;

  if (state === 'playing') {
    difficultyTimer += dt;
    if (difficultyTimer >= DIFFICULTY_INTERVAL) {
      difficultyTimer -= DIFFICULTY_INTERVAL;
      baseSpeed = Math.min(baseSpeed + 0.25, MAX_SPEED);
      spawnInterval = Math.max(SPAWN_INTERVAL_MIN, spawnInterval - 30);
    }

    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      spawnTimer -= spawnInterval;
      spawnItem();
    }

    for (const item of items) {
      item.y += item.speed * (dt / 16);
    }

    checkMisses();
    checkCollisions();
    updateParticles(dt);
    updateSnowflakes();

    if (keys['ArrowLeft']) {
      basket.x = Math.max(0, basket.x - BASKET_SPEED * (dt / 16));
    }
    if (keys['ArrowRight']) {
      basket.x = Math.min(W - BASKET_W, basket.x + BASKET_SPEED * (dt / 16));
    }
  }

  draw();
  requestAnimationFrame(loop);
}

/* ─── Drawing ─── */

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0c1425');
  grad.addColorStop(0.5, '#081020');
  grad.addColorStop(1, '#060c18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawGround() {
  const gy = BASKET_Y + BASKET_H + 4;
  ctx.fillStyle = '#0f1a2a';
  ctx.fillRect(0, gy, W, H - gy);

  ctx.fillStyle = '#1a2a40';
  ctx.fillRect(0, gy, W, 2);
}

function draw() {
  drawBackground();
  drawSnowflakes();
  for (const item of items) drawItem(item);
  drawGround();
  drawBasket();
  drawParticles();

  if (state === 'playing') {
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`speed ${baseSpeed.toFixed(1)}`, W - 6, H - 4);
  }
}

/* ─── Session ─── */

function startGame() {
  score = 0;
  lives = MAX_LIVES;
  baseSpeed = BASE_SPEED_INIT;
  spawnInterval = SPAWN_INTERVAL_INIT;
  spawnTimer = 0;
  difficultyTimer = 0;
  scoreBoostFloor = 0;
  items = [];
  particles = [];
  lastTime = 0;

  resetBasket();
  updateHUD();

  startOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');

  state = 'playing';
}

function endGame() {
  state = 'gameOver';
  if (score > highScore) {
    highScore = score;
    saveBest();
  }
  finalScoreEl.textContent = String(score);
  finalBestEl.textContent = String(highScore);
  bestEl.textContent = String(highScore);
  setTimeout(() => {
    gameOverOverlay.classList.remove('hidden');
  }, 350);
}

/* ─── High Score ─── */

function loadBest() {
  try {
    const v = localStorage.getItem('giftCatcherBest');
    if (v !== null) highScore = parseInt(v, 10) || 0;
  } catch (_) { highScore = 0; }
  bestEl.textContent = String(highScore);
}

function saveBest() {
  try { localStorage.setItem('giftCatcherBest', String(highScore)); } catch (_) {}
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

  if (['ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  if (state !== 'playing' && state !== 'paused') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const mx = (e.clientX - rect.left) * scaleX;
  basket.x = Math.max(0, Math.min(W - BASKET_W, mx - BASKET_W / 2));
});

canvas.addEventListener('click', () => {
  if (state === 'menu') startGame();
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state === 'menu') startGame();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (state !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const touch = e.touches[0];
  const mx = (touch.clientX - rect.left) * scaleX;
  basket.x = Math.max(0, Math.min(W - BASKET_W, mx - BASKET_W / 2));
}, { passive: false });

/* ─── Events ─── */

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

/* ─── Boot ─── */

highScore = 0;
loadBest();
resetBasket();
items = [];
particles = [];
initSnowflakes();
updateHUD();
requestAnimationFrame(loop);
