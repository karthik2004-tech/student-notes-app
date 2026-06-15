const grid = document.getElementById("sudoku-grid");
const timerEl = document.getElementById("timer");
let timerInterval;
let seconds = 0;

function newGame() {
  clearInterval(timerInterval);
  seconds = 0;
  updateTimer();
  timerInterval = setInterval(() => {
    seconds++;
    updateTimer();
  }, 1000);

  generateGrid();
  fillPuzzle();
}

function updateTimer() {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  timerEl.textContent = `${mins}:${secs}`;
}

function generateGrid() {
  grid.innerHTML = "";
  for (let i = 0; i < 81; i++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.className = "sudoku-cell";
    input.addEventListener("input", validateCell);
    input.addEventListener("focus", () => highlightCell(i));
    grid.appendChild(input);
  }
}

function fillPuzzle() {
  const difficulty = document.getElementById("difficulty").value;
  // Simple demo puzzle generator (for real use, implement Sudoku generator)
  const puzzle = getSamplePuzzle(difficulty);
  const cells = document.querySelectorAll(".sudoku-cell");
  puzzle.forEach((val, i) => {
    if (val !== 0) {
      cells[i].value = val;
      cells[i].disabled = true;
    }
  });
}

function getSamplePuzzle(difficulty) {
  // Demo puzzles: 0 = empty
  if (difficulty === "easy") {
    return [
      5,3,0,0,7,0,0,0,0,
      6,0,0,1,9,5,0,0,0,
      0,9,8,0,0,0,0,6,0,
      8,0,0,0,6,0,0,0,3,
      4,0,0,8,0,3,0,0,1,
      7,0,0,0,2,0,0,0,6,
      0,6,0,0,0,0,2,8,0,
      0,0,0,4,1,9,0,0,5,
      0,0,0,0,8,0,0,7,9
    ];
  }
  // For medium/hard, just reuse easy for demo
  return Array(81).fill(0);
}

function validateCell(e) {
  const val = e.target.value;
  if (!/^[1-9]$/.test(val)) {
    e.target.value = "";
    return;
  }
  checkErrors();
}

function highlightCell(index) {
  const cells = document.querySelectorAll(".sudoku-cell");
  cells.forEach(c => c.classList.remove("highlight"));
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    if (r === row || c === col || (Math.floor(r / 3) * 3 === boxRow && Math.floor(c / 3) * 3 === boxCol)) {
      cells[i].classList.add("highlight");
    }
  }
}

function checkErrors() {
  const cells = document.querySelectorAll(".sudoku-cell");
  cells.forEach(c => c.classList.remove("error"));
  // Simple duplicate check in row
  for (let r = 0; r < 9; r++) {
    const seen = {};
    for (let c = 0; c < 9; c++) {
      const idx = r * 9 + c;
      const val = cells[idx].value;
      if (val) {
        if (seen[val]) {
          cells[idx].classList.add("error");
        }
        seen[val] = true;
      }
    }
  }
}
