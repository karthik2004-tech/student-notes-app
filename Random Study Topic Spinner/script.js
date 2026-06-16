let topics = [];
let spinning = false;
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const resultDiv = document.getElementById("result");
const topicListDiv = document.getElementById("topicList");
const spinSound = document.getElementById("spinSound");

function addTopic() {
  const topic = document.getElementById("topicInput").value.trim();
  if (!topic) return;
  topics.push(topic);
  document.getElementById("topicInput").value = "";
  saveData();
  renderTopics();
  drawWheel();
}

function clearTopics() {
  topics = [];
  saveData();
  renderTopics();
  drawWheel();
}

function renderTopics() {
  topicListDiv.innerHTML = "";
  topics.forEach((t, i) => {
    const div = document.createElement("div");
    div.className = "topic-item";
    div.innerHTML = `${t} <button onclick="removeTopic(${i})">Remove</button>`;
    topicListDiv.appendChild(div);
  });
}

function removeTopic(index) {
  topics.splice(index, 1);
  saveData();
  renderTopics();
  drawWheel();
}

function drawWheel() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if (topics.length === 0) {
    ctx.fillText("No topics", 150, 200);
    return;
  }
  const arc = 2 * Math.PI / topics.length;
  topics.forEach((t, i) => {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = randomColor();
    ctx.moveTo(200,200);
    ctx.arc(200,200,200,angle,angle+arc);
    ctx.fill();
    ctx.save();
    ctx.translate(200,200);
    ctx.rotate(angle+arc/2);
    ctx.fillStyle = "#000";
    ctx.fillText(t, 100, 0);
    ctx.restore();
  });
}

function spinWheel() {
  if (spinning || topics.length === 0) return;
  spinning = true;
  spinSound.play();
  let spinAngle = Math.random() * 360 + 720; // at least 2 rotations
  let currentAngle = 0;
  const interval = setInterval(() => {
    currentAngle += 10;
    if (currentAngle >= spinAngle) {
      clearInterval(interval);
      spinning = false;
      const selectedIndex = Math.floor(((currentAngle % 360) / 360) * topics.length);
      const topic = topics[selectedIndex];
      resultDiv.textContent = `Result: ${topic}`;
    }
    ctx.save();
    ctx.translate(200,200);
    ctx.rotate(currentAngle * Math.PI/180);
    ctx.restore();
  }, 20);
}

function randomColor() {
  const colors = ["#ff6384","#36a2eb","#ffce56","#4bc0c0","#9966ff"];
  return colors[Math.floor(Math.random()*colors.length)];
}

function saveData() {
  localStorage.setItem("studyTopics", JSON.stringify(topics));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("studyTopics"));
  if (data) {
    topics = data;
    renderTopics();
    drawWheel();
  }
}

loadData();
