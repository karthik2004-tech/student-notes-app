let exams = [];

function addExam() {
  const subject = document.getElementById("subject").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const venue = document.getElementById("venue").value;

  if (!subject || !date || !time) {
    alert("Please fill in subject, date, and time.");
    return;
  }

  exams.push({ subject, date, time, venue });
  saveData();
  renderTimetable();
  updateCountdown();
}

function renderTimetable() {
  const timetableDiv = document.getElementById("timetable");
  timetableDiv.innerHTML = "";

  exams.forEach((exam, index) => {
    const card = document.createElement("div");
    card.className = "exam-card";
    card.style.borderLeft = `8px solid ${randomColor()}`;
    card.innerHTML = `
      <h3>${exam.subject}</h3>
      <p>Date: ${exam.date}</p>
      <p>Time: ${exam.time}</p>
      <p>Venue: ${exam.venue || "N/A"}</p>
      <button onclick="deleteExam(${index})">Delete</button>
    `;
    timetableDiv.appendChild(card);
  });
}

function deleteExam(index) {
  exams.splice(index, 1);
  saveData();
  renderTimetable();
  updateCountdown();
}

function updateCountdown() {
  if (exams.length === 0) {
    document.getElementById("countdown").textContent = "Next Exam Countdown: --";
    return;
  }

  const now = new Date();
  const upcoming = exams.map(e => new Date(`${e.date}T${e.time}`)).filter(d => d > now);
  if (upcoming.length === 0) {
    document.getElementById("countdown").textContent = "No upcoming exams.";
    return;
  }

  const nextExam = upcoming.sort((a,b) => a - b)[0];
  const diff = nextExam - now;
  const days = Math.floor(diff / (1000*60*60*24));
  const hours = Math.floor((diff / (1000*60*60)) % 24);
  const minutes = Math.floor((diff / (1000*60)) % 60);

  document.getElementById("countdown").textContent = 
    `Next Exam Countdown: ${days}d ${hours}h ${minutes}m`;
}

function clearAll() {
  exams = [];
  saveData();
  renderTimetable();
  updateCountdown();
}

function printTimetable() {
  const newWin = window.open("", "", "width=800,height=600");
  newWin.document.write("<h1>Exam Timetable</h1>");
  exams.forEach(e => {
    newWin.document.write(`<p>${e.subject} - ${e.date} ${e.time} @ ${e.venue}</p>`);
  });
  newWin.document.close();
  newWin.print();
}

function saveData() {
  localStorage.setItem("examTimetable", JSON.stringify(exams));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("examTimetable"));
  if (data) {
    exams = data;
    renderTimetable();
    updateCountdown();
  }
}

function randomColor() {
  const colors = ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff"];
  return colors[Math.floor(Math.random() * colors.length)];
}

loadData();
