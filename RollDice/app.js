const dice = document.getElementById("dice");
const rollBtn = document.getElementById("rollBtn");
const result = document.getElementById("result");
const historyList = document.getElementById("historyList");

function rollDice() {
  // animation
  dice.style.transform = "rotate(360deg) scale(1.2)";

  setTimeout(() => {
    const value = Math.floor(Math.random() * 6) + 1;

    dice.textContent = value;
    result.textContent = `You rolled: ${value}`;

    dice.style.transform = "rotate(0deg) scale(1)";

    const li = document.createElement("li");
    li.textContent = `Rolled: ${value}`;
    historyList.prepend(li);

  }, 300);
}

rollBtn.addEventListener("click", rollDice);