let deck = [];
let currentIndex = 0;
let rightCount = 0;
let wrongCount = 0;

function addCard() {
  const question = document.getElementById("question").value;
  const answer = document.getElementById("answer").value;
  if (!question || !answer) {
    alert("Please enter both question and answer.");
    return;
  }
  deck.push({ question, answer });
  document.getElementById("question").value = "";
  document.getElementById("answer").value = "";
  renderCard();
}

function renderCard() {
  if (deck.length === 0) {
    document.getElementById("cardFront").textContent = "No cards";
    document.getElementById("cardBack").textContent = "";
    return;
  }
  const card = deck[currentIndex];
  document.getElementById("cardFront").textContent = card.question;
  document.getElementById("cardBack").textContent = card.answer;
}

function flipCard() {
  document.getElementById("flashcard").classList.toggle("flipped");
}

function prevCard() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCard();
  }
}

function nextCard() {
  if (currentIndex < deck.length - 1) {
    currentIndex++;
    renderCard();
  }
}

function markRight() {
  rightCount++;
  updateScore();
}

function markWrong() {
  wrongCount++;
  updateScore();
}

function updateScore() {
  document.getElementById("score").textContent = `Score: ${rightCount} right / ${wrongCount} wrong`;
}

function saveDeck() {
  const name = document.getElementById("deckName").value;
  if (!name) {
    alert("Please enter a deck name.");
    return;
  }
  localStorage.setItem(name, JSON.stringify(deck));
  loadDeckList();
}

function loadDeck() {
  const name = document.getElementById("deckName").value;
  const data = localStorage.getItem(name);
  if (!data) {
    alert("No deck found with that name.");
    return;
  }
  deck = JSON.parse(data);
  currentIndex = 0;
  rightCount = 0;
  wrongCount = 0;
  renderCard();
  updateScore();
}

function loadDeckList() {
  const deckListDiv = document.getElementById("deckList");
  deckListDiv.innerHTML = "<h3>Saved Decks:</h3>";
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const btn = document.createElement("button");
    btn.textContent = key;
    btn.onclick = () => {
      document.getElementById("deckName").value = key;
      loadDeck();
    };
    deckListDiv.appendChild(btn);
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  currentIndex = 0;
  renderCard();
}

loadDeckList();
