const wordDisplay = document.getElementById("wordDisplay");
const keyboardDiv = document.getElementById("keyboard");
const statusDiv = document.getElementById("status");

const categories = {
  CS: ["algorithm","compiler","database","recursion","syntax"],
  Biology: ["photosynthesis","mitosis","enzyme","genome","protein"],
  Geography: ["continent","equator","volcano","glacier","delta"]
};

let word = "";
let category = "";
let guessed = [];
let wrongGuesses = 0;
const maxGuesses = 6;

function newGame() {
  resetHangman();
  guessed = [];
  wrongGuesses = 0;
  statusDiv.textContent = "";

  const catKeys = Object.keys(categories);
  category = catKeys[Math.floor(Math.random() * catKeys.length)];
  const words = categories[category];
  word = words[Math.floor(Math.random() * words.length)];

  displayWord();
  generateKeyboard();
}

function displayWord() {
  wordDisplay.textContent = word.split("").map(letter => guessed.includes(letter) ? letter : "_").join(" ");
}

function generateKeyboard() {
  keyboardDiv.innerHTML = "";
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i).toLowerCase();
    const btn = document.createElement("button");
    btn.textContent = letter.toUpperCase();
    btn.onclick = () => guessLetter(letter);
    keyboardDiv.appendChild(btn);
  }
}

function guessLetter(letter) {
  if (guessed.includes(letter)) return;
  guessed.push(letter);

  if (word.includes(letter)) {
    displayWord();
    checkWin();
  } else {
    wrongGuesses++;
    drawHangman();
    checkLose();
  }
}

function checkWin() {
  if (word.split("").every(letter => guessed.includes(letter))) {
    statusDiv.textContent = "You Win!";
    statusDiv.className = "status win";
  }
}

function checkLose() {
  if (wrongGuesses >= maxGuesses) {
    statusDiv.textContent = `You Lose! Word was: ${word}`;
    statusDiv.className = "status lose";
  }
}

function drawHangman() {
  const parts = ["head","body","leftArm","rightArm","leftLeg","rightLeg"];
  if (wrongGuesses <= parts.length) {
    document.getElementById(parts[wrongGuesses-1]).style.display = "block";
  }
}

function resetHangman() {
  const parts = ["head","body","leftArm","rightArm","leftLeg","rightLeg"];
  parts.forEach(p => document.getElementById(p).style.display = "none");
}

function showHint() {
  statusDiv.textContent = `Hint: Category is ${category}`;
}
