const noteInput = document.getElementById("note-input");
const notePreview = document.getElementById("note-preview");
const saveBtn = document.getElementById("save-btn");
const notesList = document.getElementById("notes-list");

let notes = JSON.parse(localStorage.getItem("markdownNotes")) || [];

function renderPreview() {
  const markdownText = noteInput.value;
  notePreview.innerHTML = marked.parse(markdownText);
}

function saveNote() {
  const markdownText = noteInput.value;
  if (markdownText.trim() !== "") {
    notes.push(markdownText);
    localStorage.setItem("markdownNotes", JSON.stringify(notes));
    renderNotes();
    noteInput.value = "";
    notePreview.innerHTML = "";
  }
}

function renderNotes() {
  notesList.innerHTML = "";
  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.innerHTML = marked.parse(note);
    notesList.appendChild(li);
  });
}

noteInput.addEventListener("input", renderPreview);
saveBtn.addEventListener("click", saveNote);

renderNotes();
