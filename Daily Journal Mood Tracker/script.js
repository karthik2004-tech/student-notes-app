const moods = document.querySelectorAll(".mood");
const entryInput = document.getElementById("entry-input");
const saveBtn = document.getElementById("save-btn");
const entriesList = document.getElementById("entries-list");

let selectedMood = null;
let entries = JSON.parse(localStorage.getItem("journalEntries")) || [];

moods.forEach(mood => {
  mood.addEventListener("click", () => {
    moods.forEach(m => m.classList.remove("selected"));
    mood.classList.add("selected");
    selectedMood = mood.dataset.mood;
  });
});

function saveEntry() {
  const text = entryInput.value.trim();
  if (!selectedMood || text === "") {
    alert("⚠️ Please select a mood and write an entry.");
    return;
  }

  const entry = {
    date: new Date().toLocaleDateString(),
    mood: selectedMood,
    text: text
  };

  entries.push(entry);
  localStorage.setItem("journalEntries", JSON.stringify(entries));
  renderEntries();
  entryInput.value = "";
  moods.forEach(m => m.classList.remove("selected"));
  selectedMood = null;
}

function renderEntries() {
  entriesList.innerHTML = "";
  entries.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="entry-date">${entry.date}</span>
      <span class="entry-mood">${entry.mood}</span>
      <p>${entry.text}</p>
    `;
    entriesList.appendChild(li);
  });
}

saveBtn.addEventListener("click", saveEntry);
renderEntries();
