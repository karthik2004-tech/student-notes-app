const numberInput = document.getElementById("numberInput");
const tableContainer = document.getElementById("tableContainer");
let fullTable = false;

function generateTable() {
  const num = parseInt(numberInput.value);
  if (!num || num < 1 || num > 20) {
    alert("Please enter a number between 1 and 20!");
    return;
  }

  tableContainer.innerHTML = "";

  if (!fullTable) {
    for (let i = 1; i <= 12; i++) {
      const result = num * i;
      const card = document.createElement("div");
      card.className = "card";
      if (isSquare(result)) card.classList.add("square");
      card.textContent = `${num} × ${i} = ${result}`;
      tableContainer.appendChild(card);
    }
  } else {
    for (let i = 1; i <= num; i++) {
      for (let j = 1; j <= num; j++) {
        const result = i * j;
        const card = document.createElement("div");
        card.className = "card";
        if (isSquare(result)) card.classList.add("square");
        card.textContent = `${i} × ${j} = ${result}`;
        tableContainer.appendChild(card);
      }
    }
  }
}

function toggleFullTable() {
  fullTable = !fullTable;
  generateTable();
}

function isSquare(n) {
  return Number.isInteger(Math.sqrt(n));
}

generateTable();
