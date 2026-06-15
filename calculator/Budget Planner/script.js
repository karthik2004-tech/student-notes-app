let monthlyBudget = 0;
let remainingBalance = 0;

function setBudget() {
  monthlyBudget = parseFloat(document.getElementById("monthlyBudget").value) || 0;
  remainingBalance = monthlyBudget;
  updateBalance();
}

function addCategory() {
  const name = document.getElementById("categoryName").value;
  const planned = parseFloat(document.getElementById("plannedAmount").value) || 0;
  const actual = parseFloat(document.getElementById("actualAmount").value) || 0;

  const difference = planned - actual;
  remainingBalance -= actual;

  const tableBody = document.querySelector("#budgetTable tbody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${name}</td>
    <td>₹${planned}</td>
    <td>₹${actual}</td>
    <td>${difference >= 0 ? "Under by ₹" + difference : "Over by ₹" + Math.abs(difference)}</td>
  `;

  tableBody.appendChild(row);
  updateBalance();
}

function updateBalance() {
  const balanceDisplay = document.getElementById("balanceDisplay");
  balanceDisplay.textContent = `Remaining Balance: ₹${remainingBalance}`;

  if (remainingBalance > monthlyBudget * 0.5) {
    balanceDisplay.style.color = "green";
  } else if (remainingBalance > monthlyBudget * 0.2) {
    balanceDisplay.style.color = "orange";
  } else {
    balanceDisplay.style.color = "red";
  }
}
