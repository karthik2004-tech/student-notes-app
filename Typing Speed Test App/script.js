const paragraphs = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The way to get started is to quit talking and begin doing.",
  "Don’t let yesterday take up too much of today.",
  "It always seems impossible until it’s done.",
  "Push yourself, because no one else is going to do it for you."
];

let timeLeft = 60;
let timer;
let isRunning = false;
let typedChars = 0;
let correctChars = 0;
let totalChars = 0;

const paragraphEl = document.getElementById("paragraph");
const inputBox = document.getElementById("inputBox");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const timeLeftEl = document.getElementById("timeLeft");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const resultsEl = document.getElementById("results");
const finalWpmEl = document.getElementById("finalWpm");
const finalAccuracyEl = document.getElementById("finalAccuracy");

// Pick random paragraph
function loadParagraph() {
  const randomIndex = Math.floor(Math.random() * paragraphs.length);
  paragraphEl.textContent = paragraphs[randomIndex];
  totalChars = paragraphs[randomIndex].length;
}

// Start test
function startTest() {
  if (isRunning) return;
  loadParagraph();
  inputBox.value = "";
  inputBox.disabled = false;
  inputBox.focus();
  timeLeft = 60;
  typedChars = 0;
  correctChars = 0;
  isRunning = true;
  resultsEl.classList.add("hidden");
  updateStats();
  timer = setInterval(updateTimer, 1000);
}

// Reset test
function resetTest() {
  clearInterval(timer);
  isRunning = false;
  inputBox.value = "";
  inputBox.disabled = true;
  timeLeft = 60;
  typedChars = 0;
  correctChars = 0;
  wpmEl.textContent = "0";
  accuracyEl.textContent = "0%";
  timeLeftEl.textContent = "60";
  paragraphEl.textContent = "Click \"Start Test\" to begin!";
  resultsEl.classList.add("hidden");
}

// Timer countdown
function updateTimer() {
  if (timeLeft <= 0) {
    clearInterval(timer);
    endTest();
    return;
  }
  timeLeft--;
  timeLeftEl.textContent = timeLeft;
}

// Track typing
inputBox.addEventListener("input", () => {
  if (!isRunning) return;
  const typedText = inputBox.value;
  typedChars = typedText.length;

  const originalText = paragraphEl.textContent;
  correctChars = 0;
  for (let i = 0; i < typedText.length; i++) {
    if (typedText[i] === originalText[i]) {
      correctChars++;
    }
  }

  updateStats();
});

// Update stats live
function updateStats() {
  const minutes = (60 - timeLeft) / 60;
  const wordsTyped = typedChars / 5; // average word length
  const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
  const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 0;

  wpmEl.textContent = wpm;
  accuracyEl.textContent = accuracy + "%";
}

// End test
function endTest() {
  inputBox.disabled = true;
  isRunning = false;
  const minutes = 1; // fixed 60s test
  const wordsTyped = typedChars / 5;
  const wpm = Math.round(wordsTyped / minutes);
  const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 0;

  finalWpmEl.textContent = `⚡ Final WPM: ${wpm}`;
  finalAccuracyEl.textContent = `🎯 Final Accuracy: ${accuracy}%`;
  resultsEl.classList.remove("hidden");
}

// Event listeners
startBtn.addEventListener("click", startTest);
resetBtn.addEventListener("click", resetTest);
