let notes = [];

function addNote() {
  const text = document.getElementById("noteInput").value.trim();
  const tag = document.getElementById("colorTag").value;
  if (!text) {
    alert("Please enter a note.");
    return;
  }
  notes.push({ text, tag, pinned: false });
  document.getElementById("noteInput").value = "";
  saveData();
  renderNotes();
}

function renderNotes() {
  const container = document.getElementById("notesContainer");
  container.innerHTML = "";

  const search = document.getElementById("searchInput").value.toLowerCase();
  const filterTag = document.getElementById("filterTag").value;

  let filtered = notes;
  if (search) filtered = filtered.filter(n => n.text.toLowerCase().includes(search));
  if (filterTag) filtered = filtered.filter(n => n.tag === filterTag);

  const sorted = [...filtered].sort((a,b) => b.pinned - a.pinned);

  sorted.forEach((note, index) => {
    const card = document.createElement("div");
    card.className = `note-card ${note.tag} ${note.pinned ? "pinned" : ""}`;
    card.innerHTML = `
      <p>${note.text}</p>
      <div class="note-actions">
        <button onclick="togglePin(${index})">${note.pinned ? "Unpin" : "Pin"}</button>
        <button onclick="editNote(${index})">Edit</button>
        <button onclick="deleteNote(${index})">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function togglePin(index) {
  notes[index].pinned = !notes[index].pinned;
  saveData();
  renderNotes();
}

function editNote(index) {
  const newText = prompt("Edit note:", notes[index].text);
  if (newText !== null) {
    notes[index].text = newText.trim();
    saveData();
    renderNotes();
  }
}

function deleteNote(index) {
  notes.splice(index, 1);
  saveData();
  renderNotes();
}

function clearAll() {
  notes = [];
  saveData();
  renderNotes();
}

function saveData() {
  localStorage.setItem("quickNotes", JSON.stringify(notes));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem("quickNotes"));
  if (data) {
    notes = data;
    renderNotes();
  }
}

loadData();
