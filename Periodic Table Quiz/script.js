const elements = [
  { name: "Hydrogen", symbol: "H", number: 1, group: "Nonmetal" },
  { name: "Helium", symbol: "He", number: 2, group: "Noble Gas" },
  { name: "Lithium", symbol: "Li", number: 3, group: "Alkali Metal" },
  { name: "Beryllium", symbol: "Be", number: 4, group: "Alkaline Earth Metal" },
  { name: "Boron", symbol: "B", number: 5, group: "Metalloid" },
  { name: "Carbon", symbol: "C", number: 6, group: "Nonmetal" },
  { name: "Nitrogen", symbol: "N", number: 7, group: "Nonmetal" },
  { name: "Oxygen", symbol: "O", number: 8, group: "Nonmetal" },
  { name: "Fluorine", symbol: "F", number: 9, group: "Halogen" },
  { name: "Neon", symbol: "Ne", number: 10, group: "Noble Gas" },
  { name: "Sodium", symbol: "Na", number: 11, group: "Alkali Metal" },
  { name: "Magnesium", symbol: "Mg", number: 12, group: "Alkaline Earth Metal" },
  { name: "Aluminium", symbol: "Al", number: 13, group: "Metal" },
  { name: "Silicon", symbol: "Si", number: 14, group: "Metalloid" },
  { name: "Phosphorus", symbol: "P", number: 15, group: "Nonmetal" },
  { name: "Sulfur", symbol: "S", number: 16, group: "Nonmetal" },
  { name: "Chlorine", symbol: "Cl", number: 17, group: "Halogen" },
  { name: "Argon", symbol: "Ar", number: 18, group: "Noble Gas" },
  { name: "Potassium", symbol: "K", number: 19, group: "Alkali Metal" },
  { name: "Calcium", symbol: "Ca", number: 20, group: "Alkaline Earth Metal" },
  { name: "Gold", symbol: "Au", number: 79, group: "Transition Metal" },
  { name: "Uranium", symbol: "U", number: 92, group: "Actinide" },
  { name: "Oganesson", symbol: "Og", number: 118, group: "Noble Gas" }
];

let score = 0;
let streak = 0;
let currentQuestion = {};
let difficulty = "easy";
let questionCount = 0;

const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const scoreBoardEl = document.getElementById("scoreBoard");
const endScreen = document.getElementById("endScreen");
const finalScoreEl = document.getElementById("finalScore");
const difficultySelect = document.getElementById("difficultySelect");

document.getElementById("startBtn").addEventListener("click", startQuiz);
difficultySelect.addEventListener("change", () => {
  difficulty = difficultySelect.value;
});

function startQuiz() {
  score = 0;
  streak = 0;
  questionCount = 0;
  endScreen.classList.add("hidden");
  feedbackEl.textContent = "";
  scoreBoardEl.textContent = "Score: 0 | Streak: 0";
  generateQuestion();
}

function generateQuestion() {
  optionsEl.innerHTML = "";
  feedbackEl.textContent = "";
  questionCount++;

  let pool = difficulty === "easy" ? elements.slice(0, 20) : elements;
  currentQuestion = pool[Math.floor(Math.random() * pool.length)];

  const type = Math.floor(Math.random() * 3);
  let questionText = "";

  if (type === 0) {
    questionText = `What is the symbol for ${currentQuestion.name}?`;
    currentQuestion.answer = currentQuestion.symbol;
    generateOptions(pool.map(e => e.symbol));
  } else if (type === 1) {
    questionText = `Which element has atomic number ${currentQuestion.number}?`;
    currentQuestion.answer = currentQuestion.name;
    generateOptions(pool.map(e => e.name));
  } else {
    questionText = `Which group does ${currentQuestion.name} belong to?`;
    currentQuestion.answer = currentQuestion.group;
    generateOptions(pool.map(e => e.group));
  }

  questionEl.textContent = questionText;
}

function generateOptions(allOptions) {
  let options = [currentQuestion.answer];
  while (options.length < 4) {
    let random = allOptions[Math.floor(Math.random() * allOptions.length)];
    if (!options.includes(random)) options.push(random);
  }
  shuffle(options);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(opt);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(answer) {
  if (answer === currentQuestion.answer) {
    feedbackEl.textContent = "✅ Correct!";
    score += 10;
    streak++;
  } else {
    feedbackEl.textContent = `❌ Incorrect! Correct answer: ${currentQuestion.answer}`;
    streak = 0;
  }
  scoreBoardEl.textContent = `Score: ${score} | Streak: ${streak}`;
