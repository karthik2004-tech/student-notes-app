(function () {
  "use strict";

  var playerVal= document.getElementById("playerVal");
  var cpuVal   = document.getElementById("cpuVal");
  var tiesVal  = document.getElementById("tiesVal");
  var bestVal  = document.getElementById("bestVal");
  var playerIcon= document.getElementById("playerIcon");
  var cpuIcon  = document.getElementById("cpuIcon");
  var playerSlot= document.getElementById("playerSlot");
  var cpuSlot  = document.getElementById("cpuSlot");
  var arena    = document.getElementById("arena");
  var resultBar= document.getElementById("resultBar");
  var choices  = document.querySelectorAll(".choice");
  var resetBtn = document.getElementById("resetBtn");

  var MOVES     = ["rock", "paper", "scissors"];
  var ICONS     = { rock: "\uD83D\uDC4A", paper: "\u270B", scissors: "\u270C" };

  var playerScore = 0, cpuScore = 0, ties = 0, best = 0;
  var locked = false;

  /* ─── localStorage ────────────────────────────── */
  function loadBest() {
    var v = localStorage.getItem("rpsBest");
    best = v ? parseInt(v, 10) : 0;
    bestVal.textContent = best;
  }
  function saveBest() {
    if (playerScore > best) {
      best = playerScore;
      localStorage.setItem("rpsBest", best);
      bestVal.textContent = best;
    }
  }

  /* ─── Win matrix ──────────────────────────────── */
  function judge(player, cpu) {
    if (player === cpu) return "tie";
    if (
      (player === "rock"     && cpu === "scissors") ||
      (player === "paper"    && cpu === "rock")     ||
      (player === "scissors" && cpu === "paper")
    ) return "win";
    return "lose";
  }

  /* ─── Battle sequence ─────────────────────────── */
  function battle(playerMove) {
    if (locked) return;
    locked = true;

    /* Disable buttons */
    choices.forEach(function (b) { b.disabled = true; });

    /* Shake phase */
    playerIcon.textContent = "\uD83D\uDC4A";
    cpuIcon.textContent   = "\uD83D\uDC4A";
    playerSlot.className  = "slot";
    cpuSlot.className     = "slot";
    resultBar.className   = "result";
    resultBar.textContent = "...";
    arena.classList.remove("shake");
    void arena.offsetWidth;
    arena.classList.add("shake");

    setTimeout(function () {
      arena.classList.remove("shake");

      /* CPU pick */
      var cpuMove = MOVES[Math.floor(Math.random() * 3)];
      var outcome = judge(playerMove, cpuMove);

      /* Update icons */
      playerIcon.textContent = ICONS[playerMove];
      cpuIcon.textContent   = ICONS[cpuMove];
      playerIcon.className  = "slot-icon reveal";
      cpuIcon.className     = "slot-icon reveal";

      /* Score & visuals */
      if (outcome === "win") {
        playerScore++;
        playerVal.textContent = playerScore;
        playerSlot.className  = "slot win";
        cpuSlot.className     = "slot lose";
        resultBar.textContent = "YOU WIN!";
        resultBar.className   = "result win";
        if (playerScore > best) saveBest();
      } else if (outcome === "lose") {
        cpuScore++;
        cpuVal.textContent = cpuScore;
        playerSlot.className  = "slot lose";
        cpuSlot.className     = "slot win";
        resultBar.textContent = "CPU WINS!";
        resultBar.className   = "result lose";
      } else {
        ties++;
        tiesVal.textContent = ties;
        playerSlot.className  = "slot tie";
        cpuSlot.className     = "slot tie";
        resultBar.textContent = "TIE!";
        resultBar.className   = "result tie";
      }

      /* Re-enable */
      choices.forEach(function (b) { b.disabled = false; });
      locked = false;
    }, 600);
  }

  /* ─── Reset ───────────────────────────────────── */
  function resetScores() {
    if (locked) return;
    playerScore = 0; cpuScore = 0; ties = 0;
    playerVal.textContent = "0";
    cpuVal.textContent    = "0";
    tiesVal.textContent   = "0";
    playerIcon.textContent = "?";
    cpuIcon.textContent   = "?";
    playerIcon.className  = "slot-icon";
    cpuIcon.className     = "slot-icon";
    playerSlot.className  = "slot";
    cpuSlot.className     = "slot";
    resultBar.textContent = "Scores reset";
    resultBar.className   = "result";
    saveBest();
  }

  /* ─── Events ──────────────────────────────────── */
  function bindEvents() {
    choices.forEach(function (btn) {
      btn.addEventListener("click", function () {
        battle(this.getAttribute("data-move"));
      });
    });
    resetBtn.addEventListener("click", resetScores);
  }

  /* ─── Boot ────────────────────────────────────── */
  loadBest();
  bindEvents();
})();
