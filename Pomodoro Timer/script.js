const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("status");
const sessionsEl = document.getElementById("sessions");
const beep = document.getElementById("beep");

let workTime = 25 * 60; // 25 minutes
let breakTime = 5 * 60; // 5 minutes
let timeLeft = workTime;
let isRunning = false;
let isWorkSession = true;
let timer;
let sessions = JSON.parse(localStorage.getItem("sessions")) || 0;

sessionsEl.textContent = `Completed Sessions: ${sessions}`;

function updateTimerDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    timer = setInterval(() => {
      timeLeft--;
      updateTimerDisplay();
      if (timeLeft <= 0) {
        clearInterval(timer);
        beep.play();
        if (isWorkSession) {
          sessions++;
          localStorage.setItem("sessions", sessions);
          sessionsEl.textContent = `Completed Sessions: ${sessions}`;
          timeLeft = breakTime;
          statusEl.textContent = "Break Time";
        } else {
          timeLeft = workTime;
          statusEl.textContent = "Work Session";
        }
        isWorkSession = !isWorkSession;
        updateTimerDisplay();
        isRunning = false;
      }
    }, 1000);
  }
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  isWorkSession = true;
  timeLeft = workTime;
  statusEl.textContent = "Work Session";
  updateTimerDisplay();
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

updateTimerDisplay();
