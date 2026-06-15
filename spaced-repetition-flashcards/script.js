// ==========================================================================
// Preloaded Decks & Flashcards Templates
// ==========================================================================
const mockDecks = [
  { id: "deck-1", name: "Biology 101" },
  { id: "deck-2", name: "Web Development" }
];

const mockCards = [
  // Biology Deck
  {
    id: "card-1",
    deckId: "deck-1",
    front: "What is the powerhouse of the cell?",
    back: "Mitochondria. It generates most of the chemical energy needed to power the cell's biochemical reactions.",
    tags: "Organelles, Biology",
    box: 1,
    lastReviewed: null,
    nextDue: new Date().toISOString().split("T")[0] // Due today
  },
  {
    id: "card-2",
    deckId: "deck-1",
    front: "Which organelle is responsible for photosynthesis?",
    back: "Chloroplast. They contain chlorophyll which absorbs sunlight to convert carbon dioxide and water into glucose.",
    tags: "Plants, Biology",
    box: 2,
    lastReviewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextDue: new Date().toISOString().split("T")[0] // Due today
  },
  {
    id: "card-3",
    deckId: "deck-1",
    front: "What is the primary function of Ribosomes?",
    back: "Protein synthesis. They translate messenger RNA (mRNA) into polypeptide chains.",
    tags: "Cells, Proteins",
    box: 4,
    lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextDue: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // Future
  },
  // Web Dev Deck
  {
    id: "card-4",
    deckId: "deck-2",
    front: "What is a closure in JavaScript?",
    back: "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). It allows an inner function to access outer scope variables even after the outer function has executed.",
    tags: "JavaScript, Functions",
    box: 1,
    lastReviewed: null,
    nextDue: new Date().toISOString().split("T")[0]
  },
  {
    id: "card-5",
    deckId: "deck-2",
    front: "Difference between '==' and '===' operators?",
    back: "'==' (loose equality) compares values after performing type coercion. '===' (strict equality) compares both values and their types without conversion.",
    tags: "JavaScript, Basics",
    box: 3,
    lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextDue: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  }
];

const defaultProfile = {
  name: "Vishwa Mistry",
  bio: "Active Learner & Student",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=leitner"
};

let appState = {
  profile: { ...defaultProfile },
  decks: [...mockDecks],
  cards: [...mockCards],
  activeDeckId: "deck-1",
  studiedToday: 0,
  lastStudiedDate: null
};

// Global Study Session state variables
let studySession = {
  cards: [],
  currentIndex: 0,
  correctCount: 0,
  incorrectCount: 0,
  activeCardId: null
};

// Global Chart References
let activeChartType = "boxes"; // boxes, decks
let chartInstance = null;

// Leitner intervals mapping (days to wait per box level)
const boxIntervals = {
  1: 1,  // Box 1: review daily
  2: 2,  // Box 2: review every 2 days
  3: 5,  // Box 3: review every 5 days
  4: 9,  // Box 4: review every 9 days
  5: 14  // Box 5: review every 14 days (or completed/archived)
};

// ==========================================================================
// Initialization & Startup Controls
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadAppData();
  bindEventHandlers();
  resetStudiedTodayCheck();

  // Renders
  renderProfile();
  renderDecksList();
  renderSummaryStats();
  renderLeitnerBoxes();
  renderCardsList();
  initAnalyticsChart();

  lucide.createIcons();
});

function loadAppData() {
  const saved = localStorage.getItem("leitner_state_v1");
  if (saved) {
    try {
      appState = JSON.parse(saved);
    } catch (e) {
      console.error("Error loading LeitnerCards app state.", e);
    }
  }
}

function saveAppData() {
  localStorage.setItem("leitner_state_v1", JSON.stringify(appState));
}

function resetStudiedTodayCheck() {
  const todayStr = new Date().toISOString().split("T")[0];
  if (appState.lastStudiedDate !== todayStr) {
    appState.studiedToday = 0;
    saveAppData();
  }
}

function bindEventHandlers() {
  // Mobile sidebar menu toggles
  document.getElementById("sidebar-toggle-open").addEventListener("click", () => {
    document.getElementById("app-sidebar").classList.add("active");
  });
  document.getElementById("sidebar-toggle-close").addEventListener("click", () => {
    document.getElementById("app-sidebar").classList.remove("active");
  });

  // Profile modal settings
  document.getElementById("edit-profile-btn").addEventListener("click", openProfileModal);
  document.getElementById("profile-modal-close").addEventListener("click", closeProfileModal);
  document.getElementById("profile-modal-cancel").addEventListener("click", closeProfileModal);
  document.getElementById("profile-form").addEventListener("submit", handleProfileSave);

  // Deck creator controls
  document.getElementById("add-deck-btn").addEventListener("click", () => {
    const box = document.getElementById("deck-add-box");
    box.style.display = box.style.display === "none" ? "flex" : "none";
  });
  document.getElementById("save-deck-btn").addEventListener("click", handleAddDeck);

  // Cards creator modals
  document.getElementById("add-card-btn").addEventListener("click", () => openCardModal());
  document.getElementById("card-modal-close-btn").addEventListener("click", closeCardModal);
  document.getElementById("card-modal-cancel-btn").addEventListener("click", closeCardModal);
  document.getElementById("card-form").addEventListener("submit", handleCardSubmit);

  // Interactive study mode card flip
  document.getElementById("flashcard-scene").addEventListener("click", toggleCardFlip);

  // Study feedback actions
  document.getElementById("study-correct-btn").addEventListener("click", () => handleStudyResponse(true));
  document.getElementById("study-incorrect-btn").addEventListener("click", () => handleStudyResponse(false));
  
  // Finish Study Recap finishes
  document.getElementById("btn-recap-finish").addEventListener("click", finishStudyRecap);
  document.getElementById("btn-close-study").addEventListener("click", exitStudyMode);

  // Start study buttons in managers
  document.getElementById("btn-start-study-mode").addEventListener("click", startStudySession);

  // Search & Filter event binds
  document.getElementById("log-search").addEventListener("input", renderCardsList);
  document.getElementById("filter-box").addEventListener("change", renderCardsList);

  // Chart toggles switches
  document.getElementById("btn-chart-boxes").addEventListener("click", () => switchChart("boxes"));
  document.getElementById("btn-chart-decks").addEventListener("click", () => switchChart("decks"));

  // Reset database actions
  document.getElementById("reset-btn").addEventListener("click", resetDatabase);

  // Backup configuration controls
  document.getElementById("export-btn").addEventListener("click", exportDatabaseJSON);
  const importBtn = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importDatabaseJSON);
}

// ==========================================================================
// Profile and Decks listings
// ==========================================================================
function renderProfile() {
  document.getElementById("profile-name").textContent = appState.profile.name || "Student";
  document.getElementById("profile-bio").textContent = appState.profile.bio || "Active Learner";
  document.getElementById("profile-avatar").src = appState.profile.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=leitner";
}

function openProfileModal() {
  document.getElementById("form-profile-name").value = appState.profile.name || "";
  document.getElementById("form-profile-bio").value = appState.profile.bio || "";
  document.getElementById("form-profile-avatar").value = appState.profile.avatar || "";
  document.getElementById("profile-modal").style.display = "flex";
}

function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
}

function handleProfileSave(e) {
  e.preventDefault();
  appState.profile.name = document.getElementById("form-profile-name").value.trim();
  appState.profile.bio = document.getElementById("form-profile-bio").value.trim();
  appState.profile.avatar = document.getElementById("form-profile-avatar").value.trim();

  saveAppData();
  renderProfile();
  closeProfileModal();
}

function renderDecksList() {
  const container = document.getElementById("deck-list-container");
  container.innerHTML = "";

  appState.decks.forEach(deck => {
    const cardCount = appState.cards.filter(c => c.deckId === deck.id).length;
    const item = document.createElement("li");
    item.className = `deck-item ${appState.activeDeckId === deck.id ? 'active' : ''}`;
    
    // Select deck on click
    item.addEventListener("click", (e) => {
      if (e.target.closest(".btn-deck-del")) return;
      selectActiveDeck(deck.id);
    });

    item.innerHTML = `
      <span class="deck-name" title="${deck.name}">${deck.name}</span>
      <span class="deck-badge">${cardCount} card${cardCount === 1 ? '' : 's'}</span>
      <button class="btn-deck-del" onclick="deleteDeck('${deck.id}')" title="Delete Deck">
        <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
      </button>
    `;
    container.appendChild(item);
  });

  lucide.createIcons();
}

function handleAddDeck() {
  const name = document.getElementById("new-deck-name").value.trim();
  if (!name) return;

  const newDeck = { id: "deck-" + Date.now(), name };
  appState.decks.push(newDeck);
  appState.activeDeckId = newDeck.id; // Auto select

  saveAppData();
  document.getElementById("new-deck-name").value = "";
  document.getElementById("deck-add-box").style.display = "none";
  
  renderDecksList();
  selectActiveDeck(newDeck.id);
}

function selectActiveDeck(id) {
  appState.activeDeckId = id;
  saveAppData();

  // Highlight active sidebar
  document.querySelectorAll(".deck-list .deck-item").forEach(item => {
    item.classList.remove("active");
  });
  renderDecksList();

  // Close study workspace if it was open to avoid layout mismatches
  exitStudyMode();

  // Setup managers headers
  const activeDeck = appState.decks.find(d => d.id === id);
  if (activeDeck) {
    document.getElementById("workspace-title").textContent = activeDeck.name;
    document.getElementById("cards-manager-deck-name").textContent = activeDeck.name;
    document.getElementById("cards-manager-panel").style.display = "flex";
  } else {
    document.getElementById("workspace-title").textContent = "Decks Dashboard";
    document.getElementById("cards-manager-panel").style.display = "none";
  }

  renderCardsList();
  renderSummaryStats();
  renderLeitnerBoxes();
  updateCharts();
}

function deleteDeck(id) {
  if (confirm("Are you sure you want to delete this deck and all of its cards?")) {
    appState.decks = appState.decks.filter(d => d.id !== id);
    appState.cards = appState.cards.filter(c => c.deckId !== id);
    
    // Choose another deck as active if one exists
    if (appState.activeDeckId === id) {
      appState.activeDeckId = appState.decks.length > 0 ? appState.decks[0].id : null;
    }

    saveAppData();
    renderDecksList();
    if (appState.activeDeckId) {
      selectActiveDeck(appState.activeDeckId);
    } else {
      selectActiveDeck(null);
    }
  }
}

// ==========================================================================
// Dashboard statistics calculators
// ==========================================================================
function renderSummaryStats() {
  const total = appState.cards.length;
  
  // Due count: card has nextDue <= today and is not in box 5 if it's archived, or just checks date
  const todayStr = new Date().toISOString().split("T")[0];
  const dueCount = appState.cards.filter(c => c.nextDue <= todayStr).length;

  const box4 = appState.cards.filter(c => c.box === 4).length;
  const box5 = appState.cards.filter(c => c.box === 5).length;
  const mastery = total === 0 ? 0 : Math.round(((box4 + box5) / total) * 100);

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-sub-due").textContent = `${dueCount} flashcard${dueCount === 1 ? '' : 's'} due for review`;

  document.getElementById("stat-mastery").textContent = `${mastery}%`;

  document.getElementById("stat-studied").textContent = appState.studiedToday;

  document.getElementById("stat-decks").textContent = appState.decks.length;
  const avg = appState.decks.length === 0 ? 0 : (total / appState.decks.length).toFixed(1);
  document.getElementById("stat-sub-avg").textContent = `${avg} cards per study deck`;
}

function renderLeitnerBoxes() {
  const container = document.getElementById("leitner-boxes-container");
  container.innerHTML = "";

  // Compile card counts per Box
  const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  // Filter box counts by active deck if one is selected, else all
  const targetCards = appState.activeDeckId 
    ? appState.cards.filter(c => c.deckId === appState.activeDeckId)
    : appState.cards;

  targetCards.forEach(c => {
    if (boxCounts[c.box] !== undefined) boxCounts[c.box]++;
  });

  const boxLabels = {
    1: "Daily Review",
    2: "Every 2 Days",
    3: "Every 5 Days",
    4: "Every 9 Days",
    5: "Every 14 Days"
  };

  Object.entries(boxCounts).forEach(([boxNum, count]) => {
    const card = document.createElement("div");
    card.className = `box-stack-card box-${boxNum}`;
    card.innerHTML = `
      <h4>Box ${boxNum}</h4>
      <span class="box-count">${count}</span>
      <span class="box-schedule">${boxLabels[boxNum]}</span>
    `;
    container.appendChild(card);
  });
}

// ==========================================================================
// Spaced-Repetition Interactive Study Engine
// ==========================================================================
function startStudySession() {
  const activeDeck = appState.decks.find(d => d.id === appState.activeDeckId);
  if (!activeDeck) return;

  const todayStr = new Date().toISOString().split("T")[0];
  
  // Filter due cards in current active deck
  let dueCards = appState.cards.filter(c => c.deckId === appState.activeDeckId && c.nextDue <= todayStr);

  if (dueCards.length === 0) {
    // If no cards are due, ask if they want to review all cards for practice
    if (confirm("No cards are due for review today in this deck! Review all cards anyway?")) {
      dueCards = appState.cards.filter(c => c.deckId === appState.activeDeckId);
    } else {
      return;
    }
  }

  if (dueCards.length === 0) {
    alert("Please add flashcards to this deck first!");
    return;
  }

  // Initialize Study State
  studySession = {
    cards: dueCards,
    currentIndex: 0,
    correctCount: 0,
    incorrectCount: 0,
    activeCardId: null
  };

  // Hide chart view, show study workspace
  document.getElementById("chart-area-container").style.display = "none";
  document.getElementById("study-area-container").style.display = "flex";
  document.getElementById("study-recap-container").style.display = "none";
  
  // Show controls
  document.getElementById("study-controls-actions").style.display = "flex";
  document.getElementById("flashcard-scene").style.display = "block";

  // Render first card
  loadActiveStudyCard();
}

function loadActiveStudyCard() {
  const cardElement = document.getElementById("flashcard-card-element");
  cardElement.classList.remove("flipped");

  const s = studySession;
  const currentCard = s.cards[s.currentIndex];
  s.activeCardId = currentCard.id;

  // Set visual counters
  document.getElementById("study-deck-title").textContent = `Studying: ${appState.decks.find(d => d.id === appState.activeDeckId).name}`;
  document.getElementById("study-card-indicator").textContent = `Card ${s.currentIndex + 1} of ${s.cards.length}`;
  
  const pct = Math.round((s.currentIndex / s.cards.length) * 100);
  document.getElementById("study-progress-bar").style.width = `${pct}%`;

  // Write content
  document.getElementById("study-front-text").textContent = currentCard.front;
  document.getElementById("study-back-text").textContent = currentCard.back;
}

function toggleCardFlip() {
  const cardElement = document.getElementById("flashcard-card-element");
  cardElement.classList.toggle("flipped");
}

function handleStudyResponse(isCorrect) {
  const s = studySession;
  const card = appState.cards.find(c => c.id === s.activeCardId);
  if (!card) return;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (isCorrect) {
    s.correctCount++;
    
    // Move card to next box (max Box 5)
    card.box = Math.min(5, card.box + 1);
  } else {
    s.incorrectCount++;
    
    // Reset to Box 1 immediately
    card.box = 1;
  }

  // Calculate next review due date based on box schedule
  const waitDays = boxIntervals[card.box] || 1;
  const nextDate = new Date();
  nextDate.setDate(today.getDate() + waitDays);
  
  card.lastReviewed = todayStr;
  card.nextDue = nextDate.toISOString().split("T")[0];

  // Update overall daily count studied
  appState.studiedToday++;
  appState.lastStudiedDate = todayStr;

  saveAppData();
  renderSummaryStats();
  renderLeitnerBoxes();

  // Move to next card or complete session
  s.currentIndex++;
  if (s.currentIndex < s.cards.length) {
    // Timeout to allow card to flip back before changing text
    const cardElement = document.getElementById("flashcard-card-element");
    cardElement.classList.remove("flipped");
    setTimeout(loadActiveStudyCard, 200);
  } else {
    // Render session recap
    showStudyRecap();
  }
}

function showStudyRecap() {
  document.getElementById("study-progress-bar").style.width = "100%";
  document.getElementById("study-card-indicator").textContent = "Session Complete";

  document.getElementById("flashcard-scene").style.display = "none";
  document.getElementById("study-controls-actions").style.display = "none";

  document.getElementById("recap-val-correct").textContent = studySession.correctCount;
  document.getElementById("recap-val-incorrect").textContent = studySession.incorrectCount;
  document.getElementById("study-recap-container").style.display = "flex";
}

function finishStudyRecap() {
  exitStudyMode();
}

function exitStudyMode() {
  document.getElementById("study-area-container").style.display = "none";
  document.getElementById("chart-area-container").style.display = "flex";
  renderCardsList();
  updateCharts();
}

// ==========================================================================
// Deck Cards Database Manager Form submissions
// ==========================================================================
function openCardModal(id = null) {
  const form = document.getElementById("card-form");
  const modalTitle = document.getElementById("card-modal-title");
  form.reset();

  if (id) {
    const card = appState.cards.find(c => c.id === id);
    if (card) {
      modalTitle.textContent = "Edit Flashcard";
      document.getElementById("edit-card-id").value = card.id;
      document.getElementById("form-front").value = card.front;
      document.getElementById("form-back").value = card.back;
      document.getElementById("form-tags").value = card.tags || "";
    }
  } else {
    modalTitle.textContent = "Create Flashcard";
    document.getElementById("edit-card-id").value = "";
  }

  document.getElementById("card-modal").style.display = "flex";
}

function closeCardModal() {
  document.getElementById("card-modal").style.display = "none";
}

function handleCardSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById("edit-card-id").value;
  const front = document.getElementById("form-front").value.trim();
  const back = document.getElementById("form-back").value.trim();
  const tags = document.getElementById("form-tags").value.trim();

  if (editId) {
    const card = appState.cards.find(c => c.id === editId);
    if (card) {
      card.front = front;
      card.back = back;
      card.tags = tags;
    }
  } else {
    const newCard = {
      id: "card-" + Date.now(),
      deckId: appState.activeDeckId,
      front, back, tags,
      box: 1, // Start in Box 1
      lastReviewed: null,
      nextDue: new Date().toISOString().split("T")[0] // Due immediately
    };
    appState.cards.unshift(newCard);
  }

  saveAppData();
  closeCardModal();
  renderDecksList();
  renderCardsList();
  renderSummaryStats();
  renderLeitnerBoxes();
  updateCharts();
}

function deleteCard(id) {
  if (confirm("Are you sure you want to delete this flashcard?")) {
    appState.cards = appState.cards.filter(c => c.id !== id);
    saveAppData();
    renderDecksList();
    renderCardsList();
    renderSummaryStats();
    renderLeitnerBoxes();
    updateCharts();
  }
}

// ==========================================================================
// Render log lists in tables
// ==========================================================================
function renderCardsList() {
  const container = document.getElementById("cards-list-container");
  container.innerHTML = "";

  const searchQuery = document.getElementById("log-search").value.toLowerCase();
  const boxFilter = document.getElementById("filter-box").value;

  const filtered = appState.cards.filter(c => {
    const matchesDeck = c.deckId === appState.activeDeckId;
    const matchesSearch = c.front.toLowerCase().includes(searchQuery) ||
                          c.back.toLowerCase().includes(searchQuery) ||
                          (c.tags && c.tags.toLowerCase().includes(searchQuery));
    const matchesBox = boxFilter === "all" || c.box === parseInt(boxFilter);

    return matchesDeck && matchesSearch && matchesBox;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state-p">No flashcards found matching filters. Let's create some cards!</div>`;
    return;
  }

  filtered.forEach(c => {
    const card = document.createElement("div");
    card.className = `log-item-card box-stack-${c.box}`;

    let tagsBlock = "";
    if (c.tags) {
      tagsBlock = c.tags.split(",").map(t => `<span class="log-meta-tag"><i data-lucide="tag"></i> ${t.trim()}</span>`).join("");
    }

    card.innerHTML = `
      <div class="log-status-border">
        <i data-lucide="layers"></i>
      </div>
      <div class="log-content-box">
        <div class="log-title-row">
          <h4>Q: ${c.front}</h4>
        </div>
        <p class="log-desc">A: ${c.back}</p>
        <div class="log-meta-row">
          <span class="log-meta-tag badge-box">Box ${c.box}</span>
          <span class="log-meta-tag"><i data-lucide="calendar"></i> Next Review: ${c.nextDue}</span>
          ${tagsBlock}
        </div>
      </div>
      <div class="log-actions-box">
        <button class="btn btn-secondary btn-action-log" onclick="openCardModal('${c.id}')" title="Edit Card"><i data-lucide="edit-3" style="width:12px;height:12px;"></i></button>
        <button class="btn btn-secondary btn-action-log" onclick="deleteCard('${c.id}')" title="Delete Card"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();
}

// ==========================================================================
// Chart.js Implementations
// ==========================================================================
function initAnalyticsChart() {
  drawCharts();
}

function switchChart(type) {
  activeChartType = type;
  document.getElementById("btn-chart-boxes").classList.remove("active");
  document.getElementById("btn-chart-decks").classList.remove("active");

  document.getElementById(`btn-chart-${type}`).classList.add("active");
  drawCharts();
}

function updateCharts() {
  drawCharts();
}

function drawCharts() {
  const canvas = document.getElementById("leitnerChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  // Centralized theme matching properties
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const labelColor = isDark ? "#f0f0f0" : "#333333";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

  if (activeChartType === "boxes") {
    // Doughnut chart of Leitner Box distributions
    const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    appState.cards.forEach(c => {
      if (boxCounts[c.box] !== undefined) boxCounts[c.box]++;
    });

    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Box 1 (Daily)", "Box 2 (2d)", "Box 3 (5d)", "Box 4 (9d)", "Box 5 (14d)"],
        datasets: [{
          data: Object.values(boxCounts),
          backgroundColor: ["#ef4444", "#f97316", "#eab308", "#3b82f6", "#22c55e"],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { color: labelColor, font: { family: "Outfit" } }
          }
        }
      }
    });
  } else {
    // Mastery Rate across Decks (Horizontal bar chart)
    const deckRates = [];
    const deckLabels = [];

    appState.decks.forEach(deck => {
      const deckCards = appState.cards.filter(c => c.deckId === deck.id);
      const total = deckCards.length;
      const box4 = deckCards.filter(c => c.box === 4).length;
      const box5 = deckCards.filter(c => c.box === 5).length;
      const mastery = total === 0 ? 0 : Math.round(((box4 + box5) / total) * 100);

      deckRates.push(mastery);
      deckLabels.push(deck.name);
    });

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: deckLabels,
        datasets: [{
          data: deckRates,
          backgroundColor: "#22c55e",
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { 
            ticks: { color: labelColor, max: 100 }, 
            grid: { color: gridColor } 
          },
          y: { ticks: { color: labelColor }, grid: { display: false } }
        }
      }
    });
  }
}

// ==========================================================================
// Backup Import/Export Files controls & resets
// ==========================================================================
function exportDatabaseJSON() {
  const data = JSON.stringify(appState, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(data);
  const exportFileDefaultName = 'leitner_cards_backup.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

function importDatabaseJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.profile && parsed.decks && parsed.cards && Array.isArray(parsed.cards)) {
        appState = parsed;
        saveAppData();
        renderProfile();
        renderDecksList();
        
        // Auto select first deck if exists
        if (appState.decks.length > 0) {
          selectActiveDeck(appState.decks[0].id);
        } else {
          selectActiveDeck(null);
        }
        alert("JSON Backup loaded successfully!");
      } else {
        alert("Invalid backup configuration layout.");
      }
    } catch (err) {
      alert("Error parsing backup JSON file.");
    }
  };
  reader.readAsText(file);
}

function resetDatabase() {
  if (confirm("Restore default study decks and wipe current cards?")) {
    appState = {
      profile: { ...defaultProfile },
      decks: [...mockDecks],
      cards: [...mockCards],
      activeDeckId: "deck-1",
      studiedToday: 0,
      lastStudiedDate: null
    };
    saveAppData();
    renderProfile();
    renderDecksList();
    selectActiveDeck("deck-1");
    alert("Database successfully reset.");
  }
}
