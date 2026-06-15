const speedValue = document.getElementById("speedValue");
const pingEl = document.getElementById("ping");
const downloadEl = document.getElementById("download");
const ratingEl = document.getElementById("rating");
const historyList = document.getElementById("historyList");
const needle = document.getElementById("needle");

let history = [];

function runTest() {
  const startPing = Date.now();
  fetch("https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png")
    .then(() => {
      const ping = Date.now() - startPing;
      pingEl.textContent = `Ping: ${ping} ms`;

      measureDownload(ping);
    })
    .catch(() => {
      pingEl.textContent = "Ping: Error";
    });
}

function measureDownload(ping) {
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg";
  const startTime = Date.now();
  fetch(imageUrl)
    .then(res => res.blob())
    .then(blob => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const sizeMB = blob.size / (1024*1024);
      const speed = (sizeMB / duration * 8).toFixed(2); // Mbps

      downloadEl.textContent = `Download: ${speed} Mbps`;
      speedValue.textContent = `${speed} Mbps`;
      updateGauge(speed);

      const rating = getRating(speed);
      ratingEl.textContent = `Rating: ${rating}`;

      saveHistory(ping, speed, rating);
    })
    .catch(() => {
      downloadEl.textContent = "Download: Error";
    });
}

function updateGauge(speed) {
  const angle = Math.min(180, speed * 3); // scale speed to angle
  needle.setAttribute("transform", `rotate(${angle} 100 90)`);
}

function getRating(speed) {
  if (speed < 5) return "Slow";
  if (speed < 20) return "Fair";
  if (speed < 50) return "Good";
  return "Excellent";
}

function saveHistory(ping, speed, rating) {
  const entry = `Ping: ${ping} ms | Download: ${speed} Mbps | Rating: ${rating}`;
  history.push(entry);
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}
