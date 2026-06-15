const questions = [
  { text: "The Earth is flat.", answer: false },
  { text: "Water boils at 100°C.", answer: true },
  { text: "The Great Wall of China is visible from space.", answer: false },
  { text: "Lightning is hotter than the sun.", answer: true }
];

let currentQuestion = 0;
let score = 0;
let timer;
let timeLeft = 10;

const questionEl = document.getElementById("question");
const trueBtn = document.getElementById("true-btn");
const falseBtn = document.getElementById("false-btn");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const resultScreen = document.getElementById("result-screen");
const finalScoreEl = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

function startQuiz() {
  currentQuestion = 0;
  score = 0;
  resultScreen.classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");
  loadQuestion();
}

function loadQuestion() {
  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }
  questionEl.textContent = questions[currentQuestion].text;
  resetTimer();
}

function checkAnswer(userAnswer) {
  if (userAnswer === questions[currentQuestion].answer) {
    score++;
    scoreEl.textContent = "Score: " + score;
  }
  currentQuestion++;
  loadQuestion();
}

function resetTimer() {
  clearInterval(timer);
  timeLeft = 10;
  timerEl.textContent = `⏳ ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏳ ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      currentQuestion++;
      loadQuestion();
    }
  }, 1000);
}

function endQuiz() {
  clearInterval(timer);
  document.getElementById("quiz-screen").classList.add("hidden");
  resultScreen.classList.remove("hidden");
  finalScoreEl.textContent = `Your final score is ${score}/${questions.length}`;
}

trueBtn.addEventListener("click", () => checkAnswer(true));
falseBtn.addEventListener("click", () => checkAnswer(false));
restartBtn.addEventListener("click", startQuiz);

startQuiz();
