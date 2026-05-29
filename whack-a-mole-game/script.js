const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeLeftEl = document.getElementById("timeLeft");
const bestScoreEl = document.getElementById("bestScore");
const difficultyLabelEl = document.getElementById("difficultyLabel");
const startBtn = document.getElementById("startBtn");
const messageEl = document.getElementById("message");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

const boardSize = 9;
const difficultyConfig = {
  easy: {
    label: "Easy",
    duration: 40,
    baseSpeed: 1350,
    minSpeed: 820,
    speedStep: 14,
  },
  medium: {
    label: "Medium",
    duration: 30,
    baseSpeed: 1100,
    minSpeed: 650,
    speedStep: 18,
  },
  hard: {
    label: "Hard",
    duration: 20,
    baseSpeed: 900,
    minSpeed: 500,
    speedStep: 24,
  },
};

let currentDifficulty = "medium";
let score = 0;
let timeLeft = difficultyConfig[currentDifficulty].duration;
let gameActive = false;
let timerId = null;
let moleTimeoutId = null;
let activeHoleIndex = -1;
let bestScore = Number(localStorage.getItem("whackAMoleBestScore")) || 0;

bestScoreEl.textContent = bestScore;

const holes = [];

function getDifficultySettings() {
  return difficultyConfig[currentDifficulty];
}

function updateDifficultyUi() {
  const settings = getDifficultySettings();
  difficultyLabelEl.textContent = settings.label;
  startBtn.textContent = gameActive ? "Restart Game" : `Start ${settings.label} Game`;

  difficultyButtons.forEach((button) => {
    const isActive = button.dataset.difficulty === currentDifficulty;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setDifficulty(nextDifficulty) {
  if (!difficultyConfig[nextDifficulty]) {
    return;
  }

  currentDifficulty = nextDifficulty;
  updateDifficultyUi();

  if (!gameActive) {
    setMessage(`${getDifficultySettings().label} mode is ready. Press start to begin.`);
  }
}

function createBoard() {
  board.innerHTML = "";
  holes.length = 0;

  for (let index = 0; index < boardSize; index += 1) {
    const hole = document.createElement("div");
    hole.className = "hole";
    hole.setAttribute("role", "gridcell");

    const mole = document.createElement("button");
    mole.className = "mole";
    mole.type = "button";
    mole.setAttribute("aria-label", "Whack mole");
    mole.addEventListener("click", () => hitMole(index));

    hole.appendChild(mole);
    board.appendChild(hole);
    holes.push(mole);
  }
}

function updateStats() {
  scoreEl.textContent = score;
  timeLeftEl.textContent = timeLeft;
  bestScoreEl.textContent = bestScore;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function hideMole() {
  if (activeHoleIndex !== -1) {
    holes[activeHoleIndex].classList.remove("up");
    holes[activeHoleIndex].classList.remove("hit");
    activeHoleIndex = -1;
  }
}

function showRandomMole() {
  if (!gameActive) {
    return;
  }

  hideMole();

  const nextIndex = Math.floor(Math.random() * holes.length);
  activeHoleIndex = nextIndex;
  holes[nextIndex].classList.add("up");

  const settings = getDifficultySettings();
  const displayDuration = Math.max(settings.minSpeed, settings.baseSpeed - score * settings.speedStep);
  moleTimeoutId = window.setTimeout(() => {
    if (activeHoleIndex === nextIndex) {
      hideMole();
      showRandomMole();
    }
  }, displayDuration);
}

function hitMole(index) {
  if (!gameActive || index !== activeHoleIndex) {
    return;
  }

  score += 1;
  holes[index].classList.add("hit");
  setMessage("Nice hit!");
  updateStats();

  window.clearTimeout(moleTimeoutId);
  window.setTimeout(() => {
    if (activeHoleIndex === index) {
      hideMole();
      showRandomMole();
    }
  }, 120);
}

function endGame() {
  gameActive = false;
  window.clearInterval(timerId);
  window.clearTimeout(moleTimeoutId);
  hideMole();

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("whackAMoleBestScore", String(bestScore));
  }

  updateStats();
  updateDifficultyUi();
  setMessage(`Game over on ${getDifficultySettings().label}. Final score: ${score}.`);
}

function startGame() {
  const settings = getDifficultySettings();

  score = 0;
  timeLeft = settings.duration;
  gameActive = true;
  updateDifficultyUi();
  setMessage(`${settings.label} mode active. Hit the moles before they vanish.`);
  updateStats();

  window.clearInterval(timerId);
  window.clearTimeout(moleTimeoutId);
  hideMole();
  showRandomMole();

  timerId = window.setInterval(() => {
    timeLeft -= 1;
    updateStats();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
});

startBtn.addEventListener("click", startGame);
createBoard();
updateStats();
updateDifficultyUi();