let board = Array(9).fill(null);
let currentPlayer = "X";
let mode = null;
let scores = { X: 0, O: 0, draws: 0 };

const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");

function setMode(selectedMode) {
  mode = selectedMode;
  restartGame();
  statusDiv.textContent = mode === "pvp" ? "Player vs Player mode!" : "Player vs AI mode!";
}

function renderBoard() {
  boardDiv.innerHTML = "";
  board.forEach((cell, i) => {
    const cellDiv = document.createElement("div");
    cellDiv.className = "cell";
    cellDiv.textContent = cell || "";
    cellDiv.addEventListener("click", () => handleMove(i));
    boardDiv.appendChild(cellDiv);
  });
}

function handleMove(i) {
  if (board[i] || checkWinner(board)) return;
  board[i] = currentPlayer;
  renderBoard();

  const winner = checkWinner(board);
  if (winner) {
    endGame(winner);
    return;
  }

  if (board.every(cell => cell)) {
    scores.draws++;
    updateScores();
    statusDiv.textContent = "It's a draw!";
    return;
  }

  currentPlayer = currentPlayer === "X" ? "O" : "X";
  statusDiv.textContent = `Player ${currentPlayer}'s turn`;

  if (mode === "ai" && currentPlayer === "O") {
    const bestMove = minimax(board, "O").index;
    board[bestMove] = "O";
    renderBoard();
    const aiWinner = checkWinner(board);
    if (aiWinner) {
      endGame(aiWinner);
      return;
    }
    if (board.every(cell => cell)) {
      scores.draws++;
      updateScores();
      statusDiv.textContent = "It's a draw!";
      return;
    }
    currentPlayer = "X";
    statusDiv.textContent = "Player X's turn";
  }
}

function checkWinner(b) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (let pattern of winPatterns) {
    const [a,b1,c] = pattern;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
      highlightWin(pattern);
      return b[a];
    }
  }
  return null;
}

function highlightWin(pattern) {
  const cells = document.querySelectorAll(".cell");
  pattern.forEach(i => cells[i].classList.add("win"));
}

function endGame(winner) {
  scores[winner]++;
  updateScores();
  statusDiv.textContent = `Player ${winner} wins!`;
}

function updateScores() {
  document.getElementById("scoreX").textContent = `Player X: ${scores.X}`;
  document.getElementById("scoreO").textContent = `Player O: ${scores.O}`;
  document.getElementById("draws").textContent = `Draws: ${scores.draws}`;
}

function restartGame() {
  board = Array(9).fill(null);
  currentPlayer = "X";
  renderBoard();
  statusDiv.textContent = `Player ${currentPlayer}'s turn`;
}

function minimax(newBoard, player) {
  const availSpots = newBoard.map((c,i) => c ? null : i).filter(i => i !== null);

  const winner = checkWinner(newBoard);
  if (winner === "X") return { score: -10 };
  if (winner === "O") return { score: 10 };
  if (availSpots.length === 0) return { score: 0 };

  const moves = [];
  for (let i of availSpots) {
    const move = {};
    move.index = i;
    newBoard[i] = player;

    if (player === "O") {
      const result = minimax(newBoard, "X");
      move.score = result.score;
    } else {
      const result = minimax(newBoard, "O");
      move.score = result.score;
    }

    newBoard[i] = null;
    moves.push(move);
  }

  let bestMove;
  if (player === "O") {
    let bestScore = -Infinity;
    moves.forEach((m,i) => {
      if (m.score > bestScore) {
        bestScore = m.score;
        bestMove = i;
      }
    });
  } else {
    let bestScore = Infinity;
    moves.forEach((m,i) => {
      if (m.score < bestScore) {
        bestScore = m.score;
        bestMove = i;
      }
    });
  }
  return moves[bestMove];
}

renderBoard();
