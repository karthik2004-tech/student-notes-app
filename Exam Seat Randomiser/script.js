const seatGrid = document.getElementById("seatGrid");
const statusDiv = document.getElementById("status");

function randomiseSeats() {
  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);
  const studentText = document.getElementById("students").value.trim();
  const students = studentText.split("\n").map(s => s.trim()).filter(s => s);

  if (students.length === 0) {
    statusDiv.textContent = "Please enter student names.";
    return;
  }

  const totalSeats = rows * cols;
  if (students.length > totalSeats) {
    statusDiv.textContent = "Too many students for available seats.";
    return;
  }

  const shuffled = shuffleArray(students);
  seatGrid.style.gridTemplateColumns = `repeat(${cols}, 120px)`;
  seatGrid.innerHTML = "";

  let index = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seat = document.createElement("div");
      seat.className = "seat";
      seat.textContent = shuffled[index] || "";
      seatGrid.appendChild(seat);
      index++;
    }
  }

  statusDiv.textContent = "Seating plan generated!";
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function exportPlan() {
  const seats = document.querySelectorAll(".seat");
  if (seats.length === 0) {
    alert("No seating plan to export.");
    return;
  }

  let content = "Exam Seating Plan\n\n";
  seats.forEach((seat, i) => {
    content += `Seat ${i+1}: ${seat.textContent}\n`;
  });

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "seating_plan.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function printPlan() {
  const printContents = seatGrid.innerHTML;
  const newWin = window.open("", "", "width=800,height=600");
  newWin.document.write("<h1>Exam Seating Plan</h1>");
  newWin.document.write("<div style='display:grid;grid-template-columns:repeat(auto-fill,120px);gap:10px;'>");
  newWin.document.write(printContents);
  newWin.document.write("</div>");
  newWin.document.close();
  newWin.print();
}
