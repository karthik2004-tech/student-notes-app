let secretNumber;
let attempts;
let bestScore = localStorage.getItem("bestScore") || null;

function initGame() {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  attempts = 0;
  document.getElementById("attempts").textContent = "Attempts: 0";
  document.getElementById("feedback").textContent = "";
  document.getElementById("guessInput").value = "";
  document.getElementById("bestScore").textContent = bestScore ? `Best Score: ${bestScore}` : "Best Score: —";
}

function makeGuess() {
  const guess = parseInt(document.getElementById("guessInput").value);
  if (!guess || guess < 1 || guess > 100) {
    alert("Please enter a number between 1 and 100!");
    return;
  }

  attempts++;
  document.getElementById("attempts").textContent = `Attempts: ${attempts}`;

  if (guess === secretNumber) {
    document.getElementById("feedback").textContent = `🎉 Correct! The number was ${secretNumber}.`;
    if (!bestScore || attempts < bestScore) {
      bestScore = attempts;
      localStorage.setItem("bestScore", bestScore);
      document.getElementById("bestScore").textContent = `Best Score: ${bestScore}`;
    }
  } else if (guess > secretNumber) {
    document.getElementById("feedback").textContent = "Too high! 📈";
  } else {
    document.getElementById("feedback").textContent = "Too low! 📉";
  }
}

function restartGame() {
  const feedback = document.getElementById("feedback");
  feedback.textContent = "Restarting...";
  feedback.style.color = "#667eea";
  setTimeout(() => {
    initGame();
    feedback.style.color = "black";
  }, 1000);
}

initGame();
