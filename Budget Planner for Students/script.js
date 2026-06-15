let budget = 0;
let entries = [];

const balanceDiv = document.getElementById("balance");
const entriesDiv = document.getElementById("entries");
const chartCanvas = document.getElementById("chart");
let chart;

function setBudget() {
  budget = parseFloat(document.getElementById("monthlyBudget").value) || 0;
  saveData();
  updateBalance();
}

function addEntry() {
  const name = document.getElementById("entryName").value;
  const amount = parseFloat(document.getElementById("entryAmount").value);
  const type = document.getElementById("entryType").value;
  const category = document.getElementById("entryCategory").value;

  if (!name || !amount) {
    alert("Please enter valid name and amount.");
    return;
  }

  entries.push({ name, amount, type, category });
  saveData();
  renderEntries();
  updateBalance();
  updateChart();
}

function renderEntries() {
  entriesDiv.innerHTML = "";
  entries.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <span>${entry.name} (${entry.category}) - ${entry.type === "income" ? "+" : "-"}₹${entry.amount}</span>
      <button onclick="deleteEntry(${index})">Delete</button>
    `;
    entriesDiv.appendChild(div);
  });
}

function deleteEntry(index) {
  entries.splice(index, 1);
  saveData();
  renderEntries();
  updateBalance();
  updateChart();
}

function updateBalance() {
  const income = entries.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const expense = entries.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget + income - expense;
  balanceDiv.textContent = `Remaining Balance: ₹${remaining}`;
}

function updateChart() {
  const categories = {};
  entries.forEach(e => {
    if (e.type === "expense") {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  if (chart) chart.destroy();
  chart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff"]
      }]
    }
  });
}

function clearAll() {
  budget = 0;
  entries = [];
  saveData();
  renderEntries();
  updateBalance();
  if (chart) chart.destroy();
}

function saveData() {
  localStorage.setItem("budgetPlanner", JSON.stringify({ budget, entries }));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("budgetPlanner"));
  if (data) {
    budget = data.budget;
    entries = data.entries;
    renderEntries();
    updateBalance();
    updateChart();
  }
}

loadData();
