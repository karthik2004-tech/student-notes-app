const shortcutsData = {
  vscode: [
    { category: "Editing", keys: "Ctrl + D", desc: "Select next occurrence of word" },
    { category: "Navigation", keys: "Ctrl + P", desc: "Quick open files" },
    { category: "General", keys: "Ctrl + Shift + P", desc: "Open command palette" },
    { category: "Debugging", keys: "F5", desc: "Start debugging" },
    { category: "Editing", keys: "Alt + Up/Down", desc: "Move line up/down" }
  ],
  linux: [
    { category: "Navigation", keys: "cd", desc: "Change directory" },
    { category: "File Ops", keys: "ls -la", desc: "List all files with details" },
    { category: "Process", keys: "ps aux", desc: "Show running processes" },
    { category: "General", keys: "Ctrl + C", desc: "Terminate process" },
    { category: "General", keys: "Ctrl + Z", desc: "Suspend process" }
  ],
  chrome: [
    { category: "Tabs", keys: "Ctrl + T", desc: "Open new tab" },
    { category: "Tabs", keys: "Ctrl + W", desc: "Close current tab" },
    { category: "Navigation", keys: "Ctrl + H", desc: "Open history" },
    { category: "Navigation", keys: "Ctrl + Shift + N", desc: "Open incognito window" },
    { category: "General", keys: "Ctrl + Shift + T", desc: "Reopen last closed tab" }
  ],
  windows: [
    { category: "General", keys: "Win + D", desc: "Show desktop" },
    { category: "General", keys: "Win + E", desc: "Open File Explorer" },
    { category: "Navigation", keys: "Alt + Tab", desc: "Switch between apps" },
    { category: "Navigation", keys: "Win + L", desc: "Lock computer" },
    { category: "General", keys: "Win + R", desc: "Open Run dialog" }
  ]
};

const toolSelect = document.getElementById("toolSelect");
const searchInput = document.getElementById("searchInput");
const shortcutsGrid = document.getElementById("shortcutsGrid");

// Render shortcuts
function renderShortcuts(tool, query = "") {
  shortcutsGrid.innerHTML = "";
  const shortcuts = shortcutsData[tool];

  const filtered = shortcuts.filter(s =>
    s.keys.toLowerCase().includes(query.toLowerCase()) ||
    s.desc.toLowerCase().includes(query.toLowerCase()) ||
    s.category.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) {
    shortcutsGrid.innerHTML = "<p>No shortcuts found.</p>";
    return;
  }

  filtered.forEach(s => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${s.category}</h3>
      <p><strong>${s.keys}</strong></p>
      <p>${s.desc}</p>
    `;
    shortcutsGrid.appendChild(card);
  });
}

// Event listeners
toolSelect.addEventListener("change", () => {
  renderShortcuts(toolSelect.value, searchInput.value);
});

searchInput.addEventListener("input", () => {
  renderShortcuts(toolSelect.value, searchInput.value);
});

// Initial render
renderShortcuts(toolSelect.value);

// Extra: keyboard shortcut to focus search
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "/") {
    event.preventDefault();
    searchInput.focus();
  }
});

// Extra: highlight search matches
function highlightMatches(query) {
  const cards = shortcutsGrid.querySelectorAll(".card");
  cards.forEach(card => {
    card.innerHTML = card.innerHTML.replace(/<mark>|<\/mark>/g, "");
    if (query) {
      const regex = new RegExp(query, "gi");
      card.innerHTML = card.innerHTML.replace(regex, match => `<mark>${match}</mark>`);
    }
  });
}

searchInput.addEventListener("input", () => {
  highlightMatches(searchInput.value);
});

// Extra: category filter buttons
const categories = ["Editing", "Navigation", "General", "Debugging", "Tabs", "File Ops", "Process"];
const categoryBar = document.createElement("div");
categoryBar.style.margin = "20px 0";
categories.forEach(cat => {
  const btn = document.createElement("button");
  btn.textContent = cat;
  btn.style.margin = "5px";
  btn.style.padding = "8px 12px";
  btn.style.border = "none";
  btn.style.borderRadius = "6px";
  btn.style.cursor = "pointer";
  btn.style.background = "#667eea";
  btn.style.color = "white";
  btn.addEventListener("click", () => {
    searchInput.value = cat;
    renderShortcuts(toolSelect.value, cat);
  });
  categoryBar.appendChild(btn);
});
document.querySelector(".app-container").insertBefore(categoryBar, shortcutsGrid);
