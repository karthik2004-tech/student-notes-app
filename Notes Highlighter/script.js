const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const notesList = document.getElementById("notes-list");

let notes = JSON.parse(localStorage.getItem("notes")) || [];

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes() {
  notesList.innerHTML = "";
  notes.forEach((note, index) => {
    const noteDiv = document.createElement("div");
    noteDiv.className = "note";
    noteDiv.style.background = note.color;

    noteDiv.innerHTML = `
      <p>${note.text}</p>
      <div class="color-toggle">
        <button class="color-btn color-yellow"></button>
        <button class="color-btn color-pink"></button>
        <button class="color-btn color-green"></button>
        <button class="color-btn color-blue"></button>
      </div>
    `;

    const colorBtns = noteDiv.querySelectorAll(".color-btn");
    colorBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("color-yellow")) note.color = "#fff176";
        if (btn.classList.contains("color-pink")) note.color = "#f48fb1";
        if (btn.classList.contains("color-green")) note.color = "#81c784";
        if (btn.classList.contains("color-blue")) note.color = "#64b5f6";
        saveNotes();
        renderNotes();
      });
    });

    notesList.appendChild(noteDiv);
  });
}

noteForm.addEventListener("submit", e => {
  e.preventDefault();
  const newNote = {
    text: noteInput.value,
    color: "#fff176" // default yellow
  };
  notes.push(newNote);
  noteInput.value = "";
  saveNotes();
  renderNotes();
});

renderNotes();
