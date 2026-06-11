/* ── Canvas Setup ── */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 500;

/* ── Constants ── */

const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_R = 7;
const PADDLE_SPEED = 6;
const AI_SPEED = 5;
const BALL_BASE_SPEED = 5.5;
const MAX_BALL_SPEED = 12;
const BALL_ACCEL = 0.4;
const VOLLEYS_PER_ACCEL = 3;
const WIN_SCORE = 7;

/* ── DOM Refs ── */

const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const resultTitle = document.getElementById('resultTitle');
const finalScore = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const rematchBtn = document.getElementById('rematchBtn');

/* ── Game State ── */

let state = 'menu'; // menu | playing | paused | gameOver
let playerPaddle, aiPaddle, ball;
let playerScore, aiScore;
let ballSpeed, volleyCount;
let keys = {};
let mouseY = null;

/* ── Paddles ── */

function resetPaddles() {
  playerPaddle = { x: 30, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H };
  aiPaddle = { x: W - 30 - PADDLE_W, y: H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H };
}

/* ── Ball ── */

function resetBall(direction) {
  ballSpeed = BALL_BASE_SPEED;
  volleyCount = 0;
  ball = {
    x: W / 2,
    y: H / 2,
    r: BALL_R,
    vx: 0,
    vy: 0,
  };
  const angle = (Math.random() - 0.5) * (Math.PI / 2.6);
  ball.vx = direction * ballSpeed * Math.cos(angle);
  ball.vy = ballSpeed * Math.sin(angle);
}

/* ── Scoring ── */

function updateScoreboard() {
  playerScoreEl.textContent = String(playerScore);
  aiScoreEl.textContent = String(aiScore);
}

function scorePoint(scorer) {
  if (scorer === 'player') playerScore++;
  else aiScore++;

  updateScoreboard();

  if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
    const won = playerScore >= WIN_SCORE;
    resultTitle.textContent = won ? 'YOU WIN!' : 'YOU LOSE';
    resultTitle.style.color = won ? '#22d3ee' : '#fb7185';
    resultTitle.style.textShadow = won
      ? '0 0 30px rgba(34,211,238,0.15)'
      : '0 0 30px rgba(251,113,133,0.15)';
    finalScore.textContent = `${playerScore} - ${aiScore}`;
    state = 'gameOver';
    gameOverOverlay.classList.remove('hidden');
    return;
  }

  const direction = scorer === 'player' ? 1 : -1;
  resetBall(direction);
}

/* ── Game Loop ── */

function loop() {
  if (state === 'playing') {
    update();
    draw();
  } else {
    draw();
  }
  requestAnimationFrame(loop);
}

function update() {
  updatePlayer();
  updateAI();
  updateBall();
}

/* ── Player Input ── */

function updatePlayer() {
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    playerPaddle.y -= PADDLE_SPEED;
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    playerPaddle.y += PADDLE_SPEED;
  }
  if (mouseY !== null) {
    const target = mouseY - playerPaddle.h / 2;
    const diff = target - playerPaddle.y;
    if (Math.abs(diff) > PADDLE_SPEED) {
      playerPaddle.y += Math.sign(diff) * PADDLE_SPEED;
    } else {
      playerPaddle.y = target;
    }
  }
  playerPaddle.y = Math.max(0, Math.min(H - playerPaddle.h, playerPaddle.y));
}

/* ── AI ── */

let aiReactionTimer = 0;

function updateAI() {
  aiReactionTimer++;
  if (aiReactionTimer < 6) return;
  aiReactionTimer = 0;

  const targetY = ball.y - aiPaddle.h / 2;
  let diff = targetY - aiPaddle.y;
  const noise = (Math.random() - 0.5) * 1.4;
  const move = Math.min(Math.abs(diff), AI_SPEED + noise);
  aiPaddle.y += Math.sign(diff) * move;
  aiPaddle.y = Math.max(0, Math.min(H - aiPaddle.h, aiPaddle.y));
}

/* ── Ball Physics ── */

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  }
  if (ball.y + ball.r > H) {
    ball.y = H - ball.r;
    ball.vy = -ball.vy;
  }

  if (ball.x - ball.r < 0) {
    scorePoint('ai');
    return;
  }
  if (ball.x + ball.r > W) {
    scorePoint('player');
    return;
  }

  if (checkPaddleCollision(playerPaddle, 1) || checkPaddleCollision(aiPaddle, -1)) {
    volleyCount++;
    if (volleyCount % VOLLEYS_PER_ACCEL === 0 && ballSpeed < MAX_BALL_SPEED) {
      ballSpeed = Math.min(ballSpeed + BALL_ACCEL, MAX_BALL_SPEED);
      const current = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const ratio = ballSpeed / current;
      ball.vx *= ratio;
      ball.vy *= ratio;
    }
  }
}

function checkPaddleCollision(paddle, dir) {
  if (
    ball.x - ball.r < paddle.x + paddle.w &&
    ball.x + ball.r > paddle.x &&
    ball.y + ball.r > paddle.y &&
    ball.y - ball.r < paddle.y + paddle.h
  ) {
    const paddleCenter = paddle.y + paddle.h / 2;
    const hitPos = (ball.y - paddleCenter) / (paddle.h / 2);
    const maxAngle = (65 * Math.PI) / 180;
    const angle = hitPos * maxAngle;
    const speed = ballSpeed;
    ball.vx = dir * speed * Math.cos(angle);
    ball.vy = speed * Math.sin(angle);
    ball.x = dir > 0 ? paddle.x + paddle.w + ball.r : paddle.x - ball.r;
    return true;
  }
  return false;
}

/* ── Drawing ── */

function drawBackground() {
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, W, H);
}

function drawCenterLine() {
  ctx.strokeStyle = '#1a1a2a';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(paddle, color, glowColor) {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  const r = 3;
  ctx.beginPath();
  ctx.moveTo(paddle.x + r, paddle.y);
  ctx.lineTo(paddle.x + paddle.w - r, paddle.y);
  ctx.quadraticCurveTo(paddle.x + paddle.w, paddle.y, paddle.x + paddle.w, paddle.y + r);
  ctx.lineTo(paddle.x + paddle.w, paddle.y + paddle.h - r);
  ctx.quadraticCurveTo(paddle.x + paddle.w, paddle.y + paddle.h, paddle.x + paddle.w - r, paddle.y + paddle.h);
  ctx.lineTo(paddle.x + r, paddle.y + paddle.h);
  ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.h, paddle.x, paddle.y + paddle.h - r);
  ctx.lineTo(paddle.x, paddle.y + r);
  ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + r, paddle.y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBall() {
  ctx.save();
  ctx.shadowColor = '#e2e8f0';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(ball.x - 1.5, ball.y - 1.5, ball.r * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  drawBackground();
  drawCenterLine();
  drawPaddle(playerPaddle, '#22d3ee', '#22d3ee');
  drawPaddle(aiPaddle, '#fb7185', '#fb7185');
  drawBall();
}

/* ── Session ── */

function startGame() {
  playerScore = 0;
  aiScore = 0;
  resetPaddles();
  resetBall(Math.random() < 0.5 ? -1 : 1);
  updateScoreboard();

  startOverlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');

  state = 'playing';
}

/* ── Input ── */

document.addEventListener('keydown', (e) => {
  keys[e.key] = true;

  if (e.code === 'KeyP') {
    if (state === 'playing') {
      state = 'paused';
      pauseOverlay.classList.remove('hidden');
    } else if (state === 'paused') {
      state = 'playing';
      pauseOverlay.classList.add('hidden');
    }
  }

  if (e.code === 'Enter') {
    if (state === 'menu') startGame();
    else if (state === 'gameOver') startGame();
  }

  if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleY = H / rect.height;
  mouseY = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('mouseleave', () => {
  mouseY = null;
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
  if (state !== 'playing' && state !== 'paused') return;
  const rect = canvas.getBoundingClientRect();
  const scaleY = H / rect.height;
  const touch = e.touches[0];
  mouseY = (touch.clientY - rect.top) * scaleY;
}, { passive: false });

/* ── Events ── */

startBtn.addEventListener('click', startGame);
rematchBtn.addEventListener('click', startGame);

/* ── Boot ── */

resetPaddles();
resetBall(-1);
updateScoreboard();
loop();
