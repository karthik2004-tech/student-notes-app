let score = 0;
let currentQuestion = {};
let mode = "multiple"; // can toggle between "multiple" or "typed"

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const typedAnswerEl = document.getElementById("typedAnswer");
const feedbackEl = document.getElementById("feedback");
const scoreBoardEl = document.getElementById("scoreBoard");

document.getElementById("startBtn").addEventListener("click", startQuiz);
document.getElementById("submitBtn").addEventListener("click", checkTypedAnswer);

function startQuiz() {
  score = 0;
  scoreBoardEl.textContent = "Score: 0";
  feedbackEl.textContent = "";
  generateQuestion();
}

function generateQuestion() {
  optionsEl.innerHTML = "";
  typedAnswerEl.classList.add("hidden");
  document.getElementById("submitBtn").classList.add("hidden");

  const number = Math.floor(Math.random() * 100) + 1;
  const systems = ["binary", "decimal", "hex"];
  const fromSystem = systems[Math.floor(Math.random() * systems.length)];
  const toSystem = systems[Math.floor(Math.random() * systems.length)];

  if (fromSystem === toSystem) {
    return generateQuestion(); // avoid same system
  }

  let questionText = `Convert ${convertNumber(number, fromSystem)} (${fromSystem}) to ${toSystem}`;
  questionEl.textContent = questionText;

  const correctAnswer = convertNumber(number, toSystem);
  currentQuestion = { correctAnswer };

  if (mode === "multiple") {
    let options = [correctAnswer];
    while (options.length < 4) {
      let fake = Math.floor(Math.random() * 200).toString();
      if (!options.includes(fake)) options.push(fake);
    }
    shuffle(options);
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => checkAnswer(opt);
      optionsEl.appendChild(btn);
    });
  } else {
    typedAnswerEl.classList.remove("hidden");
    document.getElementById("submitBtn").classList.remove("hidden");
  }
}

function convertNumber(num, system) {
  switch(system) {
    case "binary": return num.toString(2);
    case "decimal": return num.toString(10);
    case "hex": return num.toString(16).toUpperCase();
  }
}

function checkAnswer(answer) {
  if (answer === currentQuestion.correctAnswer) {
    feedbackEl.textContent = "✅ Correct!";
    score += 10;
  } else {
    feedbackEl.textContent = `❌ Incorrect! Correct answer: ${currentQuestion.correctAnswer}`;
  }
  scoreBoardEl.textContent = `Score: ${score}`;
  setTimeout(generateQuestion, 1500);
}

function checkTypedAnswer() {
  const answer = typedAnswerEl.value.trim().toUpperCase();
  checkAnswer(answer);
  typedAnswerEl.value = "";
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
