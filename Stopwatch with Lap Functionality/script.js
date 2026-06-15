let startTime = 0;
let elapsed = 0;
let timerInterval;
let running = false;
let laps = [];

const display = document.getElementById("display");
const lapList = document.getElementById("lapList");

function startStop() {
  if (!running) {
    startTime = Date.now() - elapsed;
    timerInterval = setInterval(updateDisplay, 10);
    running = true;
  } else {
    clearInterval(timerInterval);
    running = false;
  }
}

function reset() {
  clearInterval(timerInterval);
  running = false;
  elapsed = 0;
  display.textContent = "00:00.00";
  laps = [];
  lapList.innerHTML = "";
}

function updateDisplay() {
  elapsed = Date.now() - startTime;
  const minutes = Math.floor(elapsed / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, "0");
  const centiseconds = Math.floor((elapsed % 1000) / 10).toString().padStart(2, "0");
  display.textContent = `${minutes}:${seconds}.${centiseconds}`;
}

function lap() {
  if (!running) return;
  const lapTime = elapsed;
  const lapDiff = laps.length > 0 ? lapTime - laps[laps.length - 1].time : lapTime;
  laps.push({ time: lapTime, diff: lapDiff });
  renderLaps();
}

function renderLaps() {
  lapList.innerHTML = "";
  if (laps.length === 0) return;

  let best = laps[0].diff;
  let worst = laps[0].diff;
  laps.forEach(l => {
    if (l.diff < best) best = l.diff;
    if (l.diff > worst) worst = l.diff;
  });

  laps.forEach((lap, index) => {
    const li = document.createElement("li");
    li.textContent = `Lap ${index + 1}: ${formatTime(lap.time)} (+${formatTime(lap.diff)})`;
    if (lap.diff === best) li.classList.add("best");
    if (lap.diff === worst) li.classList.add("worst");
    lapList.appendChild(li);
  });
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
  const centiseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
  return `${minutes}:${seconds}.${centiseconds}`;
}

function exportLaps() {
  if (laps.length === 0) {
    alert("No laps to export!");
    return;
  }
  let content = "Stopwatch Lap History\n\n";
  laps.forEach((lap, index) => {
    content += `Lap ${index + 1}: ${formatTime(lap.time)} (+${formatTime(lap.diff)})\n`;
  });

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lap_history.txt";
  a.click();
  URL.revokeObjectURL(url);
}
