let headsCount = 0;
let tailsCount = 0;
let historyLog = document.getElementById("historyLog");

const coinEl = document.getElementById("coin");
const coinResultEl = document.getElementById("coinResult");

const ctx = document.getElementById("coinChart").getContext("2d");
const coinChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Heads", "Tails"],
    datasets: [{
      label: "Frequency",
      data: [0, 0],
      backgroundColor: ["#FFD700", "#C0C0C0"]
    }]
  },
  options: { responsive: true }
});

function flipCoin() {
  coinEl.style.animation = "flip 1s ease";
  setTimeout(() => {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    coinEl.textContent = result === "Heads" ? "H" : "T";
    coinResultEl.textContent = `Result: ${result}`;

    if (result === "Heads") headsCount++;
    else tailsCount++;

    coinChart.data.datasets[0].data = [headsCount, tailsCount];
    coinChart.update();

    addHistory(`Coin Flip: ${result}`);
  }, 1000);
}

function rollDice() {
  const diceCount = parseInt(document.getElementById("diceCount").value);
  const diceResultsEl = document.getElementById("diceResults");
  diceResultsEl.innerHTML = "";

  let results = [];
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    results.push(roll);
    const span = document.createElement("span");
    span.textContent = `🎲 ${roll} `;
    diceResultsEl.appendChild(span);
  }

  addHistory(`Dice Roll (${diceCount}): ${results.join(", ")}`);
}

function addHistory(entry) {
  const li = document.createElement("li");
  li.textContent = entry;
  historyLog.appendChild(li);
}
