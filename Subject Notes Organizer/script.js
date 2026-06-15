const noteForm = document.getElementById("note-form");
const noteInput = document.getElementById("note-input");
const subjectSelect = document.getElementById("subject-select");
const notesList = document.getElementById("notes-list");
const filterSubject = document.getElementById("filter-subject");
const searchInput = document.getElementById("search-input");

let notes = JSON.parse(localStorage.getItem("subjectNotes")) || [];

function saveNotes() {
  localStorage.setItem("subjectNotes", JSON.stringify(notes));
}

function renderNotes() {
  notesList.innerHTML = "";
  let filteredNotes = notes.filter(note => {
    const subjectMatch = filterSubject.value === "All" || note.subject === filterSubject.value;
    const searchMatch = note.text.toLowerCase().includes(searchInput.value.toLowerCase());
    return subjectMatch && searchMatch;
  });

  filteredNotes.forEach((note, index) => {
    const noteDiv = document.createElement("div");
    noteDiv.className = "note";
    noteDiv.innerHTML = `
      <div class="note-header">${note.subject}</div>
      <p>${note.text}</p>
    `;
    notesList.appendChild(noteDiv);
  });
}

noteForm.addEventListener("submit", e => {
  e.preventDefault();
  const newNote = {
    text: noteInput.value,
    subject: subjectSelect.value
  };
  notes.push(newNote);
  noteInput.value = "";
  saveNotes();
  renderNotes();
});

filterSubject.addEventListener("change", renderNotes);
searchInput.addEventListener("input", renderNotes);

renderNotes();
