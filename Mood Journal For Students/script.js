let selectedMood = null;
let entries = {};

function selectMood(mood) {
  selectedMood = mood;
}

function saveEntry() {
  if (!selectedMood) {
    alert("Please select a mood.");
    return;
  }
  const note = document.getElementById("note").value;
  const today = new Date().toISOString().split("T")[0];
  entries[today] = { mood: selectedMood, note };
  localStorage.setItem("moodJournal", JSON.stringify(entries));
  renderCalendar();
  updateStreak();
  document.getElementById("note").value = "";
  selectedMood = null;
}

function renderCalendar() {
  const calendarDiv = document.getElementById("calendar");
  calendarDiv.innerHTML = "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  for (let i=0; i<firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day";
    calendarDiv.appendChild(empty);
  }

  for (let d=1; d<=daysInMonth; d++) {
    const date = new Date(year, month, d).toISOString().split("T")[0];
    const dayDiv = document.createElement("div");
    dayDiv.className = "day";
    dayDiv.textContent = d;

    if (entries[date]) {
      const emojiSpan = document.createElement("div");
      emojiSpan.className = "emoji";
      emojiSpan.textContent = entries[date].mood;
      dayDiv.appendChild(emojiSpan);
    }

    calendarDiv.appendChild(dayDiv);
  }
}

function updateStreak() {
  const dates = Object.keys(entries).sort();
  let streak = 0;
  let prevDate = null;

  dates.forEach(date => {
    if (!prevDate) {
      streak = 1;
    } else {
      const prev = new Date(prevDate);
      const curr = new Date(date);
      const diff = (curr - prev) / (1000*60*60*24);
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    }
    prevDate = date;
  });

  document.getElementById("streak").textContent = `Streak: ${streak} days`;
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("moodJournal"));
  if (data) {
    entries = data;
    renderCalendar();
    updateStreak();
  }
}

loadData();
