let events = [];

function addEvent() {
  const name = document.getElementById("eventName").value;
  const date = document.getElementById("eventDate").value;
  const time = document.getElementById("eventTime").value;
  const category = document.getElementById("eventCategory").value;

  if (!name || !date || !time) {
    alert("Please fill in event name, date, and time.");
    return;
  }

  events.push({ name, date, time, category });
  saveData();
  renderBoard();
}

function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";

  const now = new Date();
  events = events.filter(e => new Date(`${e.date}T${e.time}`) > now);

  events.forEach((event, index) => {
    const card = document.createElement("div");
    card.className = `event-card category-${event.category}`;
    card.innerHTML = `
      <h3>${event.name}</h3>
      <p>${event.date} ${event.time}</p>
      <p>Category: ${event.category}</p>
      <div id="countdown-${index}" class="countdown"></div>
      <button onclick="deleteEvent(${index})">Delete</button>
    `;
    boardDiv.appendChild(card);
    startCountdown(event, index);
  });
}

function startCountdown(event, index) {
  const target = new Date(`${event.date}T${event.time}`);
  const countdownDiv = document.getElementById(`countdown-${index}`);

  function update() {
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
      countdownDiv.textContent = "Event started!";
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const minutes = Math.floor((diff / (1000*60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    countdownDiv.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    requestAnimationFrame(update);
  }
  update();
}

function deleteEvent(index) {
  events.splice(index, 1);
  saveData();
  renderBoard();
}

function clearAll() {
  events = [];
  saveData();
  renderBoard();
}

function saveData() {
  localStorage.setItem("eventBoard", JSON.stringify(events));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("eventBoard"));
  if (data) {
    events = data;
    renderBoard();
  }
}

loadData();
