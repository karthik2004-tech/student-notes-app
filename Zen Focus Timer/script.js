const durationSelect = document.getElementById("durationSelect");
const customInput = document.getElementById("customInput");
const timerDisplay = document.getElementById("timerDisplay");
const alertSound = document.getElementById("alertSound");
const logList = document.getElementById("logList");

let countdown;
let remainingTime = 0;

durationSelect.addEventListener("change", () => {
  if (durationSelect.value === "custom") {
    customInput.style.display = "inline-block";
  } else {
    customInput.style.display = "none";
  }
});

function startTimer() {
  clearInterval(countdown);

  let duration;
  if (durationSelect.value === "custom") {
    duration = parseInt(customInput.value) * 60;
  } else {
    duration = parseInt(durationSelect.value);
  }

  if (!duration || duration <= 0) {
    alert("Please enter a valid duration!");
    return;
  }

  remainingTime = duration;
  updateDisplay();

  countdown = setInterval(() => {
    remainingTime--;
    updateDisplay();

    if (remainingTime <= 0) {
      clearInterval(countdown);
      alertSound.play();
      saveSession(duration);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(countdown);
  remainingTime = 0;
  updateDisplay();
}

function updateDisplay() {
  const minutes = Math.floor(remainingTime / 60).toString().padStart(2, "0");
  const seconds = (remainingTime % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function saveSession(duration) {
  const now = new Date();
  const entry = `Focused ${duration/60} min at ${now.toLocaleTimeString()}`;
  let sessions = JSON.parse(localStorage.getItem("zenSessions")) || [];
  sessions.push(entry);
  localStorage.setItem("zenSessions", JSON.stringify(sessions));
  renderLog();
}

function renderLog() {
  logList.innerHTML = "";
  const sessions = JSON.parse(localStorage.getItem("zenSessions")) || [];
  sessions.forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    logList.appendChild(li);
  });
}

renderLog();
