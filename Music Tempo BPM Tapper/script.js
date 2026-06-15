let tapTimes = [];
let timeout;

const tapButton = document.getElementById("tapButton");
const bpmDisplay = document.getElementById("bpm");
const tempoLabel = document.getElementById("tempoLabel");
const pulse = document.getElementById("pulse");

tapButton.addEventListener("click", registerTap);
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    registerTap();
  }
});

function registerTap() {
  const now = Date.now();
  tapTimes.push(now);

  if (tapTimes.length > 1) {
    const intervals = [];
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i - 1]);
    }
    const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);
    bpmDisplay.textContent = `BPM: ${bpm}`;
    tempoLabel.textContent = `Tempo: ${getTempoLabel(bpm)}`;
  }

  pulse.classList.add("active");
  setTimeout(() => pulse.classList.remove("active"), 200);

  clearTimeout(timeout);
  timeout = setTimeout(resetTapper, 3000);
}

function getTempoLabel(bpm) {
  if (bpm < 60) return "Slow";
  if (bpm < 90) return "Moderate";
  if (bpm < 120) return "Fast";
  return "Very Fast";
}

function resetTapper() {
  tapTimes = [];
  bpmDisplay.textContent = "BPM: —";
  tempoLabel.textContent = "Tempo: —";
}
