const eventNameInput = document.getElementById("eventName");
const eventDateInput = document.getElementById("eventDate");
const eventList = document.getElementById("eventList");

let events = JSON.parse(localStorage.getItem("events")) || [];

function addEvent() {
  const name = eventNameInput.value.trim();
  const date = eventDateInput.value;
  if (!name || !date) {
    alert("Please enter event name and date!");
    return;
  }

  const event = { id: Date.now(), name, date };
  events.push(event);
  localStorage.setItem("events", JSON.stringify(events));
  eventNameInput.value = "";
  eventDateInput.value = "";
  renderEvents();
}

function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  localStorage.setItem("events", JSON.stringify(events));
  renderEvents();
}

function renderEvents() {
  eventList.innerHTML = "";
  events.forEach(event => {
    const card = document.createElement("div");
    card.className = "event-card";

    const title = document.createElement("h3");
    title.textContent = event.name;

    const countdown = document.createElement("p");
    countdown.className = "countdown";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteEvent(event.id);

    card.appendChild(title);
    card.appendChild(countdown);
    card.appendChild(deleteBtn);
    eventList.appendChild(card);

    updateCountdown(event, countdown, card);
  });
}

function updateCountdown(event, countdownEl, cardEl) {
  function tick() {
    const now = new Date().getTime();
    const target = new Date(event.date).getTime();
    const diff = target - now;

    if (diff <= 0) {
      countdownEl.textContent = "Event Passed!";
      cardEl.style.background = "#ffe0e0";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Color coding
    if (days > 5) {
      cardEl.style.background = "#e0ffe0"; // green
    } else if (days > 1) {
      cardEl.style.background = "#fffbe0"; // yellow
    } else {
      cardEl.style.background = "#ffe0e0"; // red
    }

    setTimeout(tick, 1000);
  }
  tick();
}

// Initial render
renderEvents();
