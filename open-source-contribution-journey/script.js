// ==========================================================================
// Pre-populated Open Source Contributions Mock Data
// ==========================================================================
const mockContributions = [
  {
    id: "contrib-1",
    title: "Implement drag and drop sidebar layouts",
    repo: "karthik2004-tech/student-notes-app",
    type: "PR Merged",
    program: "NSOC",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Yesterday
    link: "https://github.com/karthik2004-tech/student-notes-app/pull/1067",
    notes: "Completed standard boards resizing logic, fixed bugs under mobile screens."
  },
  {
    id: "contrib-2",
    title: "Refactor charts component for high-fidelity animations",
    repo: "facebook/react",
    type: "PR Submitted",
    program: "Other",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 days ago
    link: "https://github.com/facebook/react/pull/4009",
    notes: "Toggled requestAnimationFrame handlers to optimize timeline calculations."
  },
  {
    id: "contrib-3",
    title: "Memory leaks during tab switching focus modes",
    repo: "karthik2004-tech/student-notes-app",
    type: "Issue Created",
    program: "NSOC",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 4 days ago
    link: "https://github.com/karthik2004-tech/student-notes-app/issues/1066",
    notes: "Timer intervals lag behind when background tabs sleep. Recommended web workers."
  },
  {
    id: "contrib-4",
    title: "Fix responsive navbar alignment",
    repo: "gssoc/playground",
    type: "PR Merged",
    program: "GSSoC",
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 6 days ago
    link: "https://github.com/gssoc/playground/pull/88",
    notes: "Fixed layout shifts for mobile views by applying flex wrapper wrap options."
  }
];

const defaultProfile = {
  name: "Vishwa Mistry",
  bio: "Open Source Explorer",
  github: "https://github.com/MistryVishwa",
  avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=journey"
};

const defaultPrograms = [
  { name: "NSOC", joined: true },
  { name: "GSSoC", joined: true },
  { name: "Hacktoberfest", joined: true },
  { name: "LFX Mentorship", joined: false },
  { name: "Outreachy", joined: false }
];

let appState = {
  profile: { ...defaultProfile },
  programs: [...defaultPrograms],
  logs: [...mockContributions],
  streak: 3,
  lastContributionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // yesterday
};

// Global Chart References
let activeChartType = "types"; // types, repos, timeline
let chartInstance = null;

// Points weights mappings
const typePoints = {
  "PR Merged": 10,
  "PR Submitted": 5,
  "Issue Created": 3,
  "Review Given": 5
};

// ==========================================================================
// Initialization & Startup Controls
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadAppData();
  bindEventHandlers();

  // Initial renders
  renderProfile();
  renderProgramsList();
  renderSummaryStats();
  renderContributionLogs();
  initAnalyticsChart();

  lucide.createIcons();
});

function loadAppData() {
  const saved = localStorage.getItem("journey_state_v1");
  if (saved) {
    try {
      appState = JSON.parse(saved);
    } catch (e) {
      console.error("Error loading JourneyBoard app state.", e);
    }
  }
}

function saveAppData() {
  localStorage.setItem("journey_state_v1", JSON.stringify(appState));
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

  // Form modal triggers
  document.getElementById("add-contribution-btn").addEventListener("click", () => openContributionModal());
  document.getElementById("modal-close-btn").addEventListener("click", closeContributionModal);
  document.getElementById("modal-cancel-btn").addEventListener("click", closeContributionModal);
  document.getElementById("contribution-form").addEventListener("submit", handleContributionSubmit);

  // Search & Filter event binds
  document.getElementById("log-search").addEventListener("input", renderContributionLogs);
  document.getElementById("filter-type").addEventListener("change", renderContributionLogs);
  document.getElementById("filter-program").addEventListener("change", renderContributionLogs);
  document.getElementById("filter-sorting").addEventListener("change", renderContributionLogs);

  // Chart view switches
  document.getElementById("btn-chart-types").addEventListener("click", () => switchChart("types"));
  document.getElementById("btn-chart-repos").addEventListener("click", () => switchChart("repos"));
  document.getElementById("btn-chart-timeline").addEventListener("click", () => switchChart("timeline"));

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
// Profile and Program checklists
// ==========================================================================
function renderProfile() {
  document.getElementById("profile-name").textContent = appState.profile.name || "Contributor";
  document.getElementById("profile-bio").textContent = appState.profile.bio || "Open source developer...";
  document.getElementById("profile-github").href = appState.profile.github || "https://github.com";
  document.getElementById("profile-avatar").src = appState.profile.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=journey";
}

function openProfileModal() {
  document.getElementById("form-profile-name").value = appState.profile.name || "";
  document.getElementById("form-profile-bio").value = appState.profile.bio || "";
  document.getElementById("form-profile-github").value = appState.profile.github || "";
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
  appState.profile.github = document.getElementById("form-profile-github").value.trim();
  appState.profile.avatar = document.getElementById("form-profile-avatar").value.trim();

  saveAppData();
  renderProfile();
  closeProfileModal();
}

function renderProgramsList() {
  const container = document.getElementById("programs-container");
  container.innerHTML = "";

  appState.programs.forEach(prog => {
    const item = document.createElement("div");
    item.className = "program-item";
    item.innerHTML = `
      <span>${prog.name}</span>
      <input type="checkbox" ${prog.joined ? 'checked' : ''} onclick="toggleProgramStatus('${prog.name}')">
    `;
    container.appendChild(item);
  });

  // Re-populate logs dropdown filters
  populateProgramFilters();
}

function toggleProgramStatus(name) {
  const prog = appState.programs.find(p => p.name === name);
  if (prog) {
    prog.joined = !prog.joined;
    saveAppData();
    renderProgramsList();
    renderContributionLogs();
  }
}

function populateProgramFilters() {
  const select = document.getElementById("filter-program");
  const selected = select.value;
  select.innerHTML = `<option value="all">All Programs</option>`;
  
  appState.programs.forEach(prog => {
    if (prog.joined) {
      select.innerHTML += `<option value="${prog.name}">${prog.name}</option>`;
    }
  });
  select.value = selected;
}

// ==========================================================================
// Dashboard statistics calculators
// ==========================================================================
function renderSummaryStats() {
  const total = appState.logs.length;
  
  // Calculate points
  const points = appState.logs.reduce((sum, log) => sum + (typePoints[log.type] || 0), 0);
  
  const prsMerged = appState.logs.filter(l => l.type === "PR Merged").length;
  const repos = [...new Set(appState.logs.map(l => l.repo).filter(r => r))];

  // Projects / Repository share metrics
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-sub-pr").textContent = `${prsMerged} Pull Requests Merged`;

  document.getElementById("stat-points").textContent = points;

  // Level classification triggers
  let level = "Level 1: Novice Contributor";
  if (points >= 150) {
    level = "Level 4: Project Maintainer 👑";
  } else if (points >= 75) {
    level = "Level 3: Open Source Elite ⭐";
  } else if (points >= 25) {
    level = "Level 2: Rising Star 🚀";
  }
  document.getElementById("stat-sub-level").textContent = level;

  document.getElementById("stat-streak").textContent = `${appState.streak} Day${appState.streak === 1 ? '' : 's'}`;
  document.getElementById("stat-sub-last").textContent = appState.lastContributionDate ? `Last active: ${appState.lastContributionDate}` : "Last active: Never";

  document.getElementById("stat-projects").textContent = repos.length;
  const avg = total === 0 ? 0 : (total / Math.max(1, repos.length)).toFixed(1);
  document.getElementById("stat-sub-avg").textContent = `${avg} contributions per repo`;

  // achievements milestone loaders
  renderAchievements(points, prsMerged, repos.length);
}

const milestones = [
  { id: "mil-first", title: "Hello World", desc: "Log your first contribution.", icon: "code", check: (pts, prs, reps) => pts > 0 },
  { id: "mil-merger", title: "Git Merge Master", desc: "Get 3+ Pull Requests merged.", icon: "git-merge", check: (pts, prs, reps) => prs >= 3 },
  { id: "mil-poly", title: "Project Explorer", desc: "Contribute to 3 different repositories.", icon: "git-branch", check: (pts, prs, reps) => reps >= 3 },
  { id: "mil-elite", title: "Elite Scholar", desc: "Secure 50+ journey points.", icon: "award", check: (pts, prs, reps) => pts >= 50 }
];

function renderAchievements(pts, prs, reps) {
  const container = document.getElementById("badges-grid-container");
  container.innerHTML = "";

  milestones.forEach(badge => {
    const isUnlocked = badge.check(pts, prs, reps);
    const card = document.createElement("div");
    card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;

    card.innerHTML = `
      <div class="badge-icon">
        <i data-lucide="${badge.icon}"></i>
      </div>
      <h4>${badge.title}</h4>
      <p>${badge.desc}</p>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

// ==========================================================================
// Log Management Form Submissions
// ==========================================================================
function openContributionModal(id = null) {
  const form = document.getElementById("contribution-form");
  const modalTitle = document.getElementById("modal-title");
  form.reset();

  // Date solved as today
  document.getElementById("form-date").value = new Date().toISOString().split("T")[0];

  if (id) {
    const log = appState.logs.find(l => l.id === id);
    if (log) {
      modalTitle.textContent = "Edit Journey Log";
      document.getElementById("edit-contribution-id").value = log.id;
      document.getElementById("form-title").value = log.title;
      document.getElementById("form-repo").value = log.repo;
      document.getElementById("form-type").value = log.type;
      document.getElementById("form-program").value = log.program;
      document.getElementById("form-date").value = log.date;
      document.getElementById("form-link").value = log.link;
      document.getElementById("form-notes").value = log.notes || "";
    }
  } else {
    modalTitle.textContent = "Log Contribution";
    document.getElementById("edit-contribution-id").value = "";
  }

  document.getElementById("contribution-modal").style.display = "flex";
}

function closeContributionModal() {
  document.getElementById("contribution-modal").style.display = "none";
}

function handleContributionSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById("edit-contribution-id").value;
  const title = document.getElementById("form-title").value.trim();
  const repo = document.getElementById("form-repo").value.trim();
  const type = document.getElementById("form-type").value;
  const program = document.getElementById("form-program").value;
  const date = document.getElementById("form-date").value;
  const link = document.getElementById("form-link").value.trim();
  const notes = document.getElementById("form-notes").value.trim();

  if (editId) {
    const log = appState.logs.find(l => l.id === editId);
    if (log) {
      log.title = title;
      log.repo = repo;
      log.type = type;
      log.program = program;
      log.date = date;
      log.link = link;
      log.notes = notes;
    }
  } else {
    const newLog = {
      id: "contrib-" + Date.now(),
      title, repo, type, program, date, link, notes
    };
    appState.logs.unshift(newLog);

    // Streaks tracking updates
    calculateOSStreak(date);
  }

  saveAppData();
  closeContributionModal();
  renderContributionLogs();
  renderSummaryStats();
  updateCharts();
}

function calculateOSStreak(contribDate) {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (contribDate === todayStr) {
    if (appState.lastContributionDate === yesterdayStr) {
      appState.streak++;
    } else if (appState.lastContributionDate !== todayStr) {
      appState.streak = 1;
    }
    appState.lastContributionDate = todayStr;
  }
}

function deleteContribution(id) {
  if (confirm("Are you sure you want to delete this contribution log?")) {
    appState.logs = appState.logs.filter(l => l.id !== id);
    saveAppData();
    renderContributionLogs();
    renderSummaryStats();
    updateCharts();
  }
}

// ==========================================================================
// Log lists render matching filters
// ==========================================================================
function renderContributionLogs() {
  const container = document.getElementById("logs-list-container");
  container.innerHTML = "";

  const searchQuery = document.getElementById("log-search").value.toLowerCase();
  const typeFilter = document.getElementById("filter-type").value;
  const programFilter = document.getElementById("filter-program").value;
  const sortFilter = document.getElementById("filter-sorting").value;

  // Filter processes
  const filtered = appState.logs.filter(log => {
    const matchesSearch = log.title.toLowerCase().includes(searchQuery) ||
                          log.repo.toLowerCase().includes(searchQuery) ||
                          (log.notes && log.notes.toLowerCase().includes(searchQuery));
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    
    // Program filter matches joined target programs
    const matchesProgram = programFilter === "all" || log.program === programFilter;

    return matchesSearch && matchesType && matchesProgram;
  });

  // Sortings
  if (sortFilter === "points") {
    filtered.sort((a, b) => (typePoints[b.type] || 0) - (typePoints[a.type] || 0));
  } else {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state-p">No contributions logged matching criteria. Click 'Log Contribution' to start!</div>`;
    return;
  }

  filtered.forEach(log => {
    const card = document.createElement("div");
    card.className = `log-item-card type-${log.type.replace(" ", "")}`;

    let typeIcon = "git-commit";
    if (log.type === "PR Merged") typeIcon = "git-merge";
    else if (log.type === "PR Submitted") typeIcon = "git-pull-request";
    else if (log.type === "Issue Created") typeIcon = "alert-circle";
    else if (log.type === "Review Given") typeIcon = "eye";

    const descBlock = log.notes ? `<p class="log-desc">${log.notes}</p>` : "";
    const points = typePoints[log.type] || 0;

    card.innerHTML = `
      <div class="log-icon-box">
        <i data-lucide="${typeIcon}"></i>
      </div>
      <div class="log-content-box">
        <div class="log-title-row">
          <h4><a href="${log.link}" target="_blank">${log.title} <i data-lucide="external-link" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i></a></h4>
          <span class="log-points">+${points} pts</span>
        </div>
        ${descBlock}
        <div class="log-meta-row">
          <span class="log-meta-tag badge-program">${log.program}</span>
          <span class="log-meta-tag"><i data-lucide="folder"></i> ${log.repo}</span>
          <span class="log-meta-tag"><i data-lucide="calendar"></i> ${log.date}</span>
        </div>
      </div>
      <div class="log-actions-box">
        <button class="btn btn-secondary btn-action-log" onclick="openContributionModal('${log.id}')" title="Edit Log"><i data-lucide="edit-3" style="width:12px;height:12px;"></i></button>
        <button class="btn btn-secondary btn-action-log" onclick="deleteContribution('${log.id}')" title="Delete Log"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();
}

// ==========================================================================
// Chart.js Visualizations Controls
// ==========================================================================
function initAnalyticsChart() {
  drawCharts();
}

function switchChart(type) {
  activeChartType = type;
  document.getElementById("btn-chart-types").classList.remove("active");
  document.getElementById("btn-chart-repos").classList.remove("active");
  document.getElementById("btn-chart-timeline").classList.remove("active");

  document.getElementById(`btn-chart-${type}`).classList.add("active");
  drawCharts();
}

function updateCharts() {
  drawCharts();
}

function drawCharts() {
  const canvas = document.getElementById("journeyChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  // Check global theme attribute of document element
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const labelColor = isDark ? "#f0f0f0" : "#333333";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";

  if (activeChartType === "types") {
    // Type distribution doughnut chart
    const typesCount = { "PR Merged": 0, "PR Submitted": 0, "Issue Created": 0, "Review Given": 0 };
    appState.logs.forEach(l => {
      if (typesCount[l.type] !== undefined) typesCount[l.type]++;
    });

    chartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(typesCount),
        datasets: [{
          data: Object.values(typesCount),
          backgroundColor: ["#2ea44f", "#a371f7", "#d29922", "#388bfd"],
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
  } else if (activeChartType === "repos") {
    // Contributions by repo bar chart
    const repoShares = {};
    appState.logs.forEach(l => {
      repoShares[l.repo] = (repoShares[l.repo] || 0) + 1;
    });

    const sortedRepos = Object.keys(repoShares).sort((a,b) => repoShares[b] - repoShares[a]).slice(0, 5);
    const sortedCounts = sortedRepos.map(r => repoShares[r]);

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedRepos.map(r => r.split("/")[1] || r), // project basename
        datasets: [{
          data: sortedCounts,
          backgroundColor: "#3b82f6",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: labelColor }, grid: { display: false } },
          y: { ticks: { color: labelColor, stepSize: 1 }, grid: { color: gridColor } }
        }
      }
    });
  } else {
    // Cumulative points growth line chart
    const sorted = [...appState.logs].reverse();
    let sum = 0;
    
    const dates = [];
    const pointsTimeline = [];

    sorted.forEach(l => {
      sum += (typePoints[l.type] || 0);
      dates.push(l.date);
      pointsTimeline.push(sum);
    });

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: dates.map(d => {
          const parts = d.split("-");
          return `${parts[1]}/${parts[2]}`; // MM/DD
        }),
        datasets: [{
          data: pointsTimeline,
          borderColor: "#2ea44f",
          backgroundColor: "rgba(46, 164, 79, 0.1)",
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: labelColor }, grid: { display: false } },
          y: { ticks: { color: labelColor }, grid: { color: gridColor } }
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
  const exportFileDefaultName = 'journey_board_backup.json';
  
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
      if (parsed.profile && parsed.logs && Array.isArray(parsed.logs)) {
        appState = parsed;
        saveAppData();
        renderProfile();
        renderProgramsList();
        renderSummaryStats();
        renderContributionLogs();
        drawCharts();
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
  if (confirm("Restore default contribution journey mock data?")) {
    appState = {
      profile: { ...defaultProfile },
      programs: [...defaultPrograms],
      logs: [...mockContributions],
      streak: 3,
      lastContributionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    };
    saveAppData();
    renderProfile();
    renderProgramsList();
    renderSummaryStats();
    renderContributionLogs();
    drawCharts();
    alert("Database successfully reset.");
  }
}
