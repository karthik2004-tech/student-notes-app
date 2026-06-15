let timer;
let remainingTime = 0;
let isRunning = false;

const display = document.getElementById("display");
const alertSound = document.getElementById("alertSound");

document.getElementById("start").addEventListener("click", startTimer);
document.getElementById("pause").addEventListener("click", pauseTimer);
document.getElementById("reset").addEventListener("click", resetTimer);
document.getElementById("fullscreen").addEventListener("click", toggleFullscreen);

function startTimer() {
  if (!isRunning) {
    const h = parseInt(document.getElementById("hours").value) || 0;
    const m = parseInt(document.getElementById("minutes").value) || 0;
    const s = parseInt(document.getElementById("seconds").value) || 0;

    if (remainingTime === 0) {
      remainingTime = h * 3600 + m * 60 + s;
    }

    if (remainingTime > 0) {
      isRunning = true;
      timer = setInterval(updateDisplay, 1000);
    }
  }
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  remainingTime = 0;
  display.textContent = "00:00:00";
}

function updateDisplay() {
  if (remainingTime <= 0) {
    clearInterval(timer);
    isRunning = false;
    alertSound.play();
    return;
  }

  remainingTime--;
  const h = Math.floor(remainingTime / 3600);
  const m = Math.floor((remainingTime % 3600) / 60);
  const s = remainingTime % 60;

  display.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}
