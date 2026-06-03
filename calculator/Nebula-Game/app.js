/* ============================================================
   NEBULA — Memory Match  |  app.js
   ============================================================ */

"use strict";

// ─── Emoji Sets Per Difficulty ───────────────────────────────
const EMOJI_POOL = [
  "🌙","⭐","☄️","🪐","🌠","🔭","🛸","🌌",
  "⚡","🌊","🔥","🍀","🦋","🐉","🦊","🎭",
  "💎","🎯","🏆","🎸","🎲","🎪","🎨","🚀"
];

const DIFFICULTY = {
  easy:   { pairs: 8,  cols: 4 },
  medium: { pairs: 10, cols: 5 },
  hard:   { pairs: 18, cols: 6 },
};

// ─── State ────────────────────────────────────────────────────
let cards         = [];
let flipped       = [];
let matchedPairs  = 0;
let moves         = 0;
let totalPairs    = 8;
let isLocked      = false;
let timerInterval = null;
let seconds       = 0;
let gameStarted   = false;
let difficulty    = "easy";

// ─── DOM ──────────────────────────────────────────────────────
const board        = document.getElementById("board");
const timerEl      = document.getElementById("timer");
const moveCountEl  = document.getElementById("moveCount");
const matchCountEl = document.getElementById("matchCount");
const restartBtn   = document.getElementById("restartBtn");
const modalOverlay = document.getElementById("modalOverlay");
const playAgainBtn = document.getElementById("playAgainBtn");
const resultTime   = document.getElementById("resultTime");
const resultMoves  = document.getElementById("resultMoves");
const resultScore  = document.getElementById("resultScore");
const diffBtns     = document.querySelectorAll(".diff-btn");
const starsCanvas  = document.getElementById("starsCanvas");

// ─── Stars Canvas ─────────────────────────────────────────────
function initStars() {
  const ctx = starsCanvas.getContext("2d");
  let W, H, stars = [];

  function resize() {
    W = starsCanvas.width  = window.innerWidth;
    H = starsCanvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    const count = Math.floor((W * H) / 5000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x:       Math.random() * W,
        y:       Math.random() * H,
        r:       Math.random() * 1.4 + 0.2,
        alpha:   Math.random() * 0.8 + 0.1,
        speed:   Math.random() * 0.004 + 0.001,
        phase:   Math.random() * Math.PI * 2,
      });
    }
  }

  function drawStars(t) {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${a})`;
      ctx.fill();
    }
    requestAnimationFrame(drawStars);
  }

  window.addEventListener("resize", () => { resize(); createStars(); });
  resize();
  createStars();
  requestAnimationFrame(drawStars);
}

// ─── Timer ────────────────────────────────────────────────────
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  seconds = 0;
  timerEl.textContent = "00:00";
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ─── Build Board ──────────────────────────────────────────────
function buildBoard() {
  const cfg = DIFFICULTY[difficulty];
  totalPairs = cfg.pairs;

  // Pick unique emojis
  const chosen = shuffle([...EMOJI_POOL]).slice(0, totalPairs);
  const pairs  = shuffle([...chosen, ...chosen]);

  cards = pairs.map((emoji, i) => ({
    id:      i,
    emoji,
    flipped: false,
    matched: false,
  }));

  board.setAttribute("data-cols", cfg.cols);
  board.innerHTML = "";

  cards.forEach((card, i) => {
    const el = document.createElement("div");
    el.className = "card";
    el.dataset.index = i;
    el.style.animationDelay = (i * 0.03) + "s";

    el.innerHTML = `
      <div class="card__inner">
        <div class="card__back">
          <span class="card__back-symbol">✦</span>
        </div>
        <div class="card__front">${card.emoji}</div>
      </div>
    `;

    el.addEventListener("click", () => onCardClick(i, el));
    board.appendChild(el);
  });

  // Update match counter
  matchCountEl.textContent = `0/${totalPairs}`;
}

// ─── Card Click ───────────────────────────────────────────────
function onCardClick(index, el) {
  const card = cards[index];

  if (isLocked || card.flipped || card.matched) return;

  // Start timer on first flip
  if (!gameStarted) {
    gameStarted = true;
    startTimer();
  }

  // Flip card
  card.flipped = true;
  el.classList.add("flipped");
  flipped.push({ index, el });

  if (flipped.length === 2) {
    isLocked = true;
    moves++;
    moveCountEl.textContent = moves;
    checkMatch();
  }
}

// ─── Check Match ─────────────────────────────────────────────
function checkMatch() {
  const [a, b] = flipped;
  const cardA  = cards[a.index];
  const cardB  = cards[b.index];

  if (cardA.emoji === cardB.emoji) {
    // Match!
    setTimeout(() => {
      cardA.matched = true;
      cardB.matched = true;
      a.el.classList.add("matched");
      b.el.classList.add("matched");

      // Particle burst on each card
      burstParticles(a.el);
      burstParticles(b.el);

      matchedPairs++;
      matchCountEl.textContent = `${matchedPairs}/${totalPairs}`;

      flipped = [];
      isLocked = false;

      if (matchedPairs === totalPairs) {
        setTimeout(showWin, 500);
      }
    }, 300);
  } else {
    // No match — shake then flip back
    setTimeout(() => {
      a.el.classList.add("wrong");
      b.el.classList.add("wrong");

      setTimeout(() => {
        cardA.flipped = false;
        cardB.flipped = false;
        a.el.classList.remove("flipped", "wrong");
        b.el.classList.remove("flipped", "wrong");
        flipped  = [];
        isLocked = false;
      }, 450);
    }, 250);
  }
}

// ─── Win Screen ───────────────────────────────────────────────
function showWin() {
  stopTimer();
  const score = calcScore();

  resultTime.textContent  = formatTime(seconds);
  resultMoves.textContent = moves;
  resultScore.textContent = score;

  spawnConfetti();
  modalOverlay.classList.add("visible");
}

function calcScore() {
  const base = totalPairs * 100;
  const timeBonus  = Math.max(0, 300 - seconds) * 2;
  const moveBonus  = Math.max(0, (totalPairs * 3) - moves) * 10;
  return Math.max(0, base + timeBonus + moveBonus);
}

// ─── Reset Game ───────────────────────────────────────────────
function resetGame() {
  modalOverlay.classList.remove("visible");
  flipped      = [];
  matchedPairs = 0;
  moves        = 0;
  isLocked     = false;
  gameStarted  = false;

  moveCountEl.textContent  = "0";
  matchCountEl.textContent = `0/${totalPairs}`;

  resetTimer();
  buildBoard();
}

// ─── Particle Burst ───────────────────────────────────────────
function burstParticles(cardEl) {
  const container = document.getElementById("particleContainer");
  const rect = cardEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  const colors = ["#63b3ed","#f687b3","#f6d860","#63ffb4","#90cdf4"];

  for (let i = 0; i < 14; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 7 + 3;
    const angle = (Math.PI * 2 / 14) * i + (Math.random() - 0.5) * 0.5;
    const dist  = Math.random() * 70 + 30;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const dur = (Math.random() * 0.4 + 0.4).toFixed(2) + "s";
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      width: ${size}px; height: ${size}px;
      background: ${color};
      --tx: ${tx}px; --ty: ${ty}px;
      --dur: ${dur};
      box-shadow: 0 0 6px ${color};
    `;

    container.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

// ─── Confetti ────────────────────────────────────────────────
function spawnConfetti() {
  const container = document.getElementById("confettiContainer");
  container.innerHTML = "";
  const colors = ["#63b3ed","#f687b3","#f6d860","#63ffb4","#c084fc","#fb923c"];

  for (let i = 0; i < 40; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    const x     = Math.random() * 100 + "%";
    const drift = (Math.random() - 0.5) * 80 + "px";
    const rot   = (Math.random() * 720 - 360) + "deg";
    const dur   = (Math.random() * 1.5 + 1).toFixed(2) + "s";
    const delay = (Math.random() * 0.5).toFixed(2) + "s";

    p.style.cssText = `
      left: ${x};
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      --x: ${x}; --drift: ${drift}; --rot: ${rot};
      --dur: ${dur}; --delay: ${delay};
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
    `;
    container.appendChild(p);
  }
}

// ─── Utilities ───────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Event Bindings ──────────────────────────────────────────
restartBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

diffBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.dataset.diff === difficulty) return;
    diffBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    difficulty = btn.dataset.diff;
    resetGame();
  });
});

// Close modal on backdrop click
modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) modalOverlay.classList.remove("visible");
});

// Keyboard: R to restart
document.addEventListener("keydown", e => {
  if (e.key === "r" || e.key === "R") resetGame();
});

// ─── Boot ────────────────────────────────────────────────────
initStars();
buildBoard();
