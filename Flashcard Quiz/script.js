const deckForm = document.getElementById("deck-form");
const frontInput = document.getElementById("front-input");
const backInput = document.getElementById("back-input");
const flashcardsDiv = document.getElementById("flashcards");
const shuffleBtn = document.getElementById("shuffle-btn");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const scoreEl = document.getElementById("score");

let flashcards = JSON.parse(localStorage.getItem("flashcards")) || [];
let score = 0;

function saveFlashcards() {
  localStorage.setItem("flashcards", JSON.stringify(flashcards));
}

function renderFlashcards() {
  flashcardsDiv.innerHTML = "";
  flashcards.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "flashcard";
    cardDiv.innerHTML = `
      <div class="flashcard-inner">
        <div class="flashcard-front">${card.front}</div>
        <div class="flashcard-back">${card.back}</div>
      </div>
    `;
    cardDiv.addEventListener("click", () => {
      cardDiv.classList.toggle("flipped");
      if (cardDiv.classList.contains("flipped")) {
        score++;
        scoreEl.textContent = `Score: ${score}`;
      }
    });
    flashcardsDiv.appendChild(cardDiv);
  });
}

deckForm.addEventListener("submit", e => {
  e.preventDefault();
  const newCard = {
    front: frontInput.value,
    back: backInput.value
  };
  flashcards.push(newCard);
  frontInput.value = "";
  backInput.value = "";
  saveFlashcards();
  renderFlashcards();
});

shuffleBtn.addEventListener("click", () => {
  flashcards.sort(() => Math.random() - 0.5);
  renderFlashcards();
});

exportBtn.addEventListener("click", () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flashcards));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", "flashcards.json");
  dlAnchor.click();
});

importBtn.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = event => {
      flashcards = JSON.parse(event.target.result);
      saveFlashcards();
      renderFlashcards();
    };
    reader.readAsText(file);
  };
  input.click();
});

renderFlashcards();
