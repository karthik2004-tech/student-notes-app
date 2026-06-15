const colors = ["red", "blue", "green", "yellow"];
let sequence = [];
let playerSequence = [];
let score = 0;
let highScore = localStorage.getItem("simonHighScore") || 0;

const statusDiv = document.getElementById("status");
const scoreDiv = document.getElementById("score");

document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("click", () => handlePlayerInput(btn.id));
});

function startGame() {
  sequence = [];
  playerSequence = [];
  score = 0;
  statusDiv.textContent = "Game Started!";
  nextRound();
}

function nextRound() {
  playerSequence = [];
  const nextColor = colors[Math.floor(Math.random() * colors.length)];
  sequence.push(nextColor);
  playSequence();
}

function playSequence() {
  let i = 0;
  const interval = setInterval(() => {
    flashButton(sequence[i]);
    playSound(sequence[i]);
    i++;
    if (i >= sequence.length) {
      clearInterval(interval);
    }
  }, 800);
}

function flashButton(color) {
  const btn = document.getElementById(color);
  btn.classList.add("flash");
  setTimeout(() => btn.classList.remove("flash"), 400);
}

function playSound(color) {
  const audio = new Audio(`https://actions.google.com/sounds/v1/cartoon/${color}_pop.ogg`);
  audio.play();
}

function handlePlayerInput(color) {
  playerSequence.push(color);
  flashButton(color);
  playSound(color);

  const index = playerSequence.length - 1;
  if (playerSequence[index] !== sequence[index]) {
    gameOver();
    return;
  }

  if (playerSequence.length === sequence.length) {
    score++;
    updateScore();
    setTimeout(nextRound, 1000);
  }
}

function updateScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("simonHighScore", highScore);
  }
  scoreDiv.textContent = `Score: ${score} | High Score: ${highScore}`;
}

function gameOver() {
  statusDiv.textContent = "Game Over! Press Start to Play Again.";
  flashAll();
}

function flashAll() {
  colors.forEach(color => {
    const btn = document.getElementById(color);
    btn.classList.add("flash");
    setTimeout(() => btn.classList.remove("flash"), 500);
  });
}
