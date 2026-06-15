/* ═══════════════════════════════════════════════
   MINDROOT — app.js
   ═══════════════════════════════════════════════ */

/* ─── DATA: QUOTES ─── */
const DAILY_QUOTES = [
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Do not indulge in dreams of having what you have not, but count up the chief of the blessings you do possess.", author: "Epictetus" },
  { text: "The soul that sees beauty may sometimes walk alone.", author: "Goethe" },
  { text: "You are not a drop in the ocean. You are the entire ocean in a drop.", author: "Rumi" },
  { text: "Within you there is a stillness and sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Emerson" },
  { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
  { text: "Tat tvam asi — Thou art that.", author: "Chandogya Upanishad" },
  { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
];

/* ─── DATA: JOURNAL PROMPTS ─── */
const JOURNAL_PROMPTS = [
  { text: "What would you do today if you knew you could not fail?", source: "Positive Psychology" },
  { text: "Describe a moment this week where you felt fully alive. What made it so?", source: "ACT" },
  { text: "What is one thing you are resisting right now? What would happen if you let it be?", source: "Stoicism" },
  { text: "Write a letter to your future self, one year from now.", source: "CBT" },
  { text: "What are three things your body did for you today that you take for granted?", source: "Gratitude" },
  { text: "If your current struggles were a teacher, what lesson are they trying to give you?", source: "Vedanta" },
  { text: "What belief about yourself is holding you back the most? Is it actually true?", source: "CBT" },
  { text: "Recall someone who showed you kindness. How did it change you?", source: "Positive Psychology" },
  { text: "The Bhagavad Gita says: act without attachment to results. Where in your life can you practice this?", source: "Vedanta" },
  { text: "What would Stoic Marcus Aurelius say to you about your biggest worry right now?", source: "Stoicism" },
  { text: "List 5 small things that brought you joy this week, however trivial.", source: "Gratitude" },
  { text: "Where in your life are you being too hard on yourself? How would you speak to a friend in the same situation?", source: "Self-compassion" },
  { text: "What does your ideal day look like — not the productive one, the joyful one?", source: "Positive Psychology" },
  { text: "Write about a version of yourself you are slowly becoming.", source: "Growth" },
];

/* ─── DATA: AFFIRMATIONS ─── */
const AFFIRMATIONS = [
  { text: "I am enough, exactly as I am, right now in this moment.", cat: "confidence" },
  { text: "I release what I cannot control and trust the unfolding of my life.", cat: "peace" },
  { text: "Every challenge I face is an invitation to grow stronger.", cat: "growth" },
  { text: "I am the observer of my thoughts, not their prisoner.", cat: "peace" },
  { text: "My purpose is unfolding with every step I take.", cat: "purpose" },
  { text: "Aham Brahmasmi — I am the infinite consciousness.", cat: "vedic" },
  { text: "I have survived every difficult day so far. I will survive this one too.", cat: "confidence" },
  { text: "I choose progress over perfection, always.", cat: "growth" },
  { text: "The obstacle is the way. Resistance is my teacher.", cat: "stoic" },
  { text: "I am rooted like a tree — flexible in the storm, firm in my ground.", cat: "peace" },
  { text: "My presence is my power. I do not need to prove myself.", cat: "confidence" },
  { text: "Soham — I am that. I am whole, I am complete.", cat: "vedic" },
  { text: "What is within my control, I act on. What is not, I release.", cat: "stoic" },
  { text: "I am worthy of love, success, and deep inner peace.", cat: "confidence" },
  { text: "I grow a little more every single day, even when I cannot see it.", cat: "growth" },
  { text: "My life has meaning and I am contributing something real to this world.", cat: "purpose" },
  { text: "The universe is not punishing me. It is redirecting me.", cat: "peace" },
  { text: "I am the author of my story. I can rewrite any chapter.", cat: "growth" },
  { text: "Virtue is its own reward. I act rightly because it is right.", cat: "stoic" },
  { text: "Sat-Chit-Ananda — I am existence, consciousness, and bliss.", cat: "vedic" },
];

/* ─── DATA: CBT TIPS ─── */
const CBT_TIPS = {
  "all-or-nothing": "Try to find the grey area. Ask yourself: is there any evidence this is not completely true?",
  "overgeneralizing": "One event doesn't define a pattern. What would you tell a friend in this situation?",
  "catastrophizing": "Ask: what is the most realistic outcome? What is the actual probability of the worst case?",
  "mind-reading": "You cannot know what others think. Stick to observable facts rather than interpretations.",
  "should-statements": "Replace 'should' with 'could' or 'I would like to'. Be gentler with yourself.",
  "self-blame": "You are responsible for your actions, not for everything that happens. Separate yourself from outcomes.",
  "filtering": "Deliberately list three positive things alongside the negative. A full picture is more accurate.",
  "none": "Excellent self-awareness. Keep noticing your thoughts with curiosity, not judgment.",
};

/* ─── STATE ─── */
let state = {
  currentPage: "home",
  checkin: { mood: null, energy: 5, distortions: [] },
  currentPromptIndex: 0,
  currentAffirmIndex: 0,
  currentAffirmCat: "all",
  breathPattern: { in: 4, hold: 7, out: 8 },
  breathRunning: false,
  breathCycles: 0,
  breathTimer: null,
};

/* ─── STORAGE HELPERS ─── */
function save(key, val) {
  try { localStorage.setItem("mindroot_" + key, JSON.stringify(val)); } catch(e) {}
}
function load(key, fallback) {
  try {
    const v = localStorage.getItem("mindroot_" + key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch(e) { return fallback; }
}

/* ─── INIT ─── */
document.addEventListener("DOMContentLoaded", () => {
  setDate();
  setDailyQuote();
  initNav();
  initTheme();
  initHome();
  initCheckin();
  initJournal();
  initBreathwork();
  initRitual();
  initAffirmations();
  initTrends();
  initMobileMenu();
});

/* ─── DATE ─── */
function setDate() {
  const now = new Date();
  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const str = now.toLocaleDateString("en-IN", opts);
  const el = document.getElementById("todayDate");
  const ed = document.getElementById("editorDate");
  if (el) el.textContent = str;
  if (ed) ed.textContent = str;
}

/* ─── DAILY QUOTE ─── */
function setDailyQuote() {
  const idx = new Date().getDate() % DAILY_QUOTES.length;
  const q = DAILY_QUOTES[idx];
  const el = document.getElementById("dailyQuote");
  if (el) el.querySelector(".quote-text").textContent = `"${q.text}" — ${q.author}`;
}

/* ─── NAVIGATION ─── */
function initNav() {
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) navigateTo(page);
    });
  });

  // Dashboard card shortcuts
  document.getElementById("openCheckin")?.addEventListener("click", () => navigateTo("checkin"));
  document.getElementById("openJournal")?.addEventListener("click", () => navigateTo("journal"));
  document.getElementById("openBreath")?.addEventListener("click", () => navigateTo("breathwork"));
  document.getElementById("openRitual")?.addEventListener("click", () => navigateTo("ritual"));
}

function navigateTo(page) {
  state.currentPage = page;

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById("page-" + page);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  // Close mobile sidebar if open
  closeMobileSidebar();

  // Refresh home data when going home
  if (page === "home") refreshHome();
  if (page === "trends") renderTrends();
}

/* ─── THEME ─── */
function initTheme() {
  const saved = load("theme", "light");
  applyTheme(saved);

  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
  document.getElementById("themeToggleMobile")?.addEventListener("click", toggleTheme);
}

function toggleTheme() {
  const current = document.body.dataset.theme;
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  save("theme", next);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  const icon = theme === "dark" ? "☀️" : "🌙";
  const label = theme === "dark" ? "Light mode" : "Dark mode";
  document.querySelectorAll(".theme-icon").forEach(el => el.textContent = icon);
  document.querySelectorAll(".theme-label").forEach(el => el.textContent = label);
  document.querySelectorAll(".theme-toggle-mobile").forEach(el => el.textContent = icon);
}

/* ─── MOBILE MENU ─── */
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");

  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);

  hamburger?.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById("sidebar")?.classList.remove("mobile-open");
  document.querySelector(".sidebar-overlay")?.classList.remove("active");
}

/* ─── HOME ─── */
function initHome() {
  refreshHome();
  document.getElementById("refreshAffirmation")?.addEventListener("click", () => {
    const affirmations = getFilteredAffirmations("all");
    const idx = Math.floor(Math.random() * affirmations.length);
    const el = document.getElementById("homeAffirmation");
    if (el) el.textContent = `"${affirmations[idx].text}"`;
  });
}

function refreshHome() {
  // Mood
  const checkins = load("checkins", []);
  const today = todayKey();
  const todayCheckin = checkins.find(c => c.date === today);
  const moodEmoji = document.getElementById("homeMoodEmoji");
  const moodText = document.getElementById("homeMoodText");
  if (todayCheckin && moodEmoji && moodText) {
    moodEmoji.textContent = todayCheckin.moodEmoji;
    moodText.textContent = todayCheckin.moodLabel;
  }

  // Streak
  updateStreakDisplay(checkins);

  // Journal prompt preview
  const prompt = JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length];
  const preview = document.getElementById("homePromptPreview");
  if (preview) preview.textContent = `"${prompt.text}"`;

  // Affirmation
  const affirmations = getFilteredAffirmations("all");
  const affirmEl = document.getElementById("homeAffirmation");
  if (affirmEl) {
    const idx = new Date().getDate() % affirmations.length;
    affirmEl.textContent = `"${affirmations[idx].text}"`;
  }

  // Ritual progress
  const steps = load("ritualSteps", []);
  const done = steps.filter(s => s.done).length;
  const total = steps.length;
  const fill = document.getElementById("ritualProgressFill");
  const text = document.getElementById("ritualProgressText");
  if (fill) fill.style.width = total ? `${(done / total) * 100}%` : "0%";
  if (text) text.textContent = `${done} / ${total} done`;
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function updateStreakDisplay(checkins) {
  const streak = calcStreak(checkins);
  document.querySelectorAll("#streakNumber, #sidebarStreak").forEach(el => {
    if (el) el.textContent = streak;
  });
  const msg = document.getElementById("streakMsg");
  if (msg) {
    if (streak === 0) msg.textContent = "Start your streak today!";
    else if (streak === 1) msg.textContent = "Great start! Come back tomorrow.";
    else if (streak < 7) msg.textContent = `${streak} days strong. Keep going!`;
    else msg.textContent = `🔥 On fire! ${streak} days straight.`;
  }
}

function calcStreak(checkins) {
  if (!checkins.length) return 0;
  const dates = [...new Set(checkins.map(c => c.date))].sort().reverse();
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    const diff = Math.round((cursor - d) / 86400000);
    if (diff === 0 || diff === 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}

/* ─── CHECK-IN ─── */
function initCheckin() {
  let currentStep = 1;

  // Step 1: Mood
  document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.checkin.mood = parseInt(btn.dataset.mood);
      state.checkin.moodEmoji = btn.dataset.emoji;
      state.checkin.moodLabel = btn.dataset.label;
      document.getElementById("step1Next").disabled = false;
    });
  });

  document.getElementById("step1Next")?.addEventListener("click", () => goStep(2));

  // Step 2: Energy
  const slider = document.getElementById("energySlider");
  const energyVal = document.getElementById("energyValue");
  slider?.addEventListener("input", () => {
    state.checkin.energy = parseInt(slider.value);
    if (energyVal) energyVal.textContent = slider.value;
  });

  document.getElementById("step2Next")?.addEventListener("click", () => goStep(3));

  // Step 3: Distortions
  document.querySelectorAll(".distortion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const d = btn.dataset.distortion;
      if (d === "none") {
        document.querySelectorAll(".distortion-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.checkin.distortions = ["none"];
      } else {
        document.querySelector('[data-distortion="none"]')?.classList.remove("selected");
        btn.classList.toggle("selected");
        const idx = state.checkin.distortions.indexOf(d);
        if (idx > -1) state.checkin.distortions.splice(idx, 1);
        else state.checkin.distortions.push(d);
        if (!state.checkin.distortions.length) state.checkin.distortions = [];
      }
    });
  });

  document.getElementById("step3Next")?.addEventListener("click", () => {
    saveCheckin();
    goStep(4);
    showCheckinDone();
  });

  document.getElementById("checkinAgain")?.addEventListener("click", () => {
    state.checkin = { mood: null, energy: 5, distortions: [] };
    document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("selected"));
    document.querySelectorAll(".distortion-btn").forEach(b => b.classList.remove("selected"));
    document.getElementById("step1Next").disabled = true;
    if (document.getElementById("energySlider")) document.getElementById("energySlider").value = 5;
    if (document.getElementById("energyValue")) document.getElementById("energyValue").textContent = "5";
    goStep(1);
  });

  function goStep(n) {
    document.querySelectorAll(".checkin-step").forEach(s => s.classList.remove("active"));
    document.getElementById("step" + n)?.classList.add("active");
    currentStep = n;
  }
}

function saveCheckin() {
  const checkins = load("checkins", []);
  checkins.push({
    date: todayKey(),
    timestamp: Date.now(),
    mood: state.checkin.mood,
    moodEmoji: state.checkin.moodEmoji,
    moodLabel: state.checkin.moodLabel,
    energy: state.checkin.energy,
    distortions: [...state.checkin.distortions],
  });
  save("checkins", checkins);
}

function showCheckinDone() {
  const summary = document.getElementById("checkinSummary");
  const tip = document.getElementById("cbtTip");
  if (summary) {
    const labels = ["", "rough", "low", "okay", "good", "great"];
    summary.textContent = `Mood: ${state.checkin.moodEmoji} ${state.checkin.moodLabel} · Energy: ${state.checkin.energy}/10`;
  }
  if (tip && state.checkin.distortions.length) {
    const d = state.checkin.distortions[0];
    const tipText = CBT_TIPS[d];
    if (tipText) {
      tip.style.display = "block";
      tip.textContent = `💡 CBT tip: ${tipText}`;
    }
  } else if (tip) {
    tip.style.display = "none";
  }
}

/* ─── JOURNAL ─── */
function initJournal() {
  setCurrentPrompt();

  document.getElementById("newPrompt")?.addEventListener("click", () => {
    state.currentPromptIndex = (state.currentPromptIndex + 1) % JOURNAL_PROMPTS.length;
    setCurrentPrompt();
  });

  // Word count
  const textarea = document.getElementById("journalTextarea");
  const wordCount = document.getElementById("wordCount");
  textarea?.addEventListener("input", () => {
    const words = textarea.value.trim().split(/\s+/).filter(w => w).length;
    if (wordCount) wordCount.textContent = `${words} word${words !== 1 ? "s" : ""}`;
    save("journalDraft", textarea.value);
  });

  // Load draft
  const draft = load("journalDraft", "");
  if (textarea && draft) textarea.value = draft;

  // Save entry
  document.getElementById("saveEntry")?.addEventListener("click", saveJournalEntry);

  // Load past entries
  renderEntries();
}

function setCurrentPrompt() {
  const prompt = JOURNAL_PROMPTS[state.currentPromptIndex];
  const el = document.getElementById("journalPrompt");
  const src = document.getElementById("promptSource");
  if (el) el.textContent = prompt.text;
  if (src) src.textContent = prompt.source;
}

function saveJournalEntry() {
  const textarea = document.getElementById("journalTextarea");
  if (!textarea || !textarea.value.trim()) return;
  const entries = load("journalEntries", []);
  entries.unshift({
    id: Date.now(),
    date: todayKey(),
    timestamp: Date.now(),
    text: textarea.value.trim(),
    prompt: JOURNAL_PROMPTS[state.currentPromptIndex].text,
  });
  save("journalEntries", entries);
  save("journalDraft", "");
  textarea.value = "";
  const wc = document.getElementById("wordCount");
  if (wc) wc.textContent = "0 words";
  renderEntries();

  // Visual feedback
  const btn = document.getElementById("saveEntry");
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = "Saved! ✓";
    setTimeout(() => btn.textContent = orig, 1500);
  }
}

function renderEntries() {
  const entries = load("journalEntries", []);
  const list = document.getElementById("entriesList");
  if (!list) return;
  if (!entries.length) {
    list.innerHTML = '<p class="empty-state">No entries yet. Write your first one →</p>';
    return;
  }
  list.innerHTML = entries.slice(0, 10).map(e => `
    <div class="entry-item" onclick="loadEntry(${e.id})">
      <div class="entry-date">${formatDate(e.date)}</div>
      <div class="entry-preview">${e.text.substring(0, 80)}${e.text.length > 80 ? "..." : ""}</div>
    </div>
  `).join("");
}

function loadEntry(id) {
  const entries = load("journalEntries", []);
  const entry = entries.find(e => e.id === id);
  if (!entry) return;
  const textarea = document.getElementById("journalTextarea");
  if (textarea) textarea.value = entry.text;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── BREATHWORK ─── */
function initBreathwork() {
  document.querySelectorAll(".pattern-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (state.breathRunning) stopBreath();
      document.querySelectorAll(".pattern-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.breathPattern = {
        in: parseInt(btn.dataset.in),
        hold: parseInt(btn.dataset.hold),
        out: parseInt(btn.dataset.out),
      };
      updatePatternDetail();
    });
  });

  document.getElementById("breathStart")?.addEventListener("click", startBreath);
  document.getElementById("breathStop")?.addEventListener("click", stopBreath);
  updatePatternDetail();
}

function updatePatternDetail() {
  const el = document.getElementById("breathPatternDetail");
  if (!el) return;
  const { in: i, hold: h, out: o } = state.breathPattern;
  let parts = [`Breathe in ${i}s`];
  if (h) parts.push(`Hold ${h}s`);
  parts.push(`Breathe out ${o}s`);
  el.textContent = parts.join(" · ");
}

function startBreath() {
  state.breathRunning = true;
  state.breathCycles = 0;
  document.getElementById("breathStart").style.display = "none";
  document.getElementById("breathStop").style.display = "inline-flex";
  runBreathCycle();
}

function runBreathCycle() {
  if (!state.breathRunning) return;
  const orb = document.getElementById("breathOrb");
  const instruction = document.getElementById("breathInstruction");
  const countEl = document.getElementById("breathCount");
  const phaseLabel = document.getElementById("breathPhaseLabel");
  const cyclesEl = document.getElementById("breathCycles");
  const { in: inhale, hold, out: exhale } = state.breathPattern;

  // Inhale
  setBreathPhase(orb, instruction, countEl, phaseLabel, "inhale", inhale, () => {
    if (!state.breathRunning) return;
    // Hold
    if (hold > 0) {
      setBreathPhase(orb, instruction, countEl, phaseLabel, "hold", hold, () => {
        if (!state.breathRunning) return;
        doExhale();
      });
    } else {
      doExhale();
    }
  });

  function doExhale() {
    setBreathPhase(orb, instruction, countEl, phaseLabel, "exhale", exhale, () => {
      if (!state.breathRunning) return;
      state.breathCycles++;
      if (cyclesEl) cyclesEl.textContent = `Cycles: ${state.breathCycles}`;
      runBreathCycle();
    });
  }
}

function setBreathPhase(orb, instruction, countEl, phaseLabel, phase, duration, callback) {
  if (!state.breathRunning) return;

  const labels = { inhale: "Breathe In", hold: "Hold", exhale: "Breathe Out" };
  const phaseLabels = { inhale: "Inhaling...", hold: "Holding...", exhale: "Exhaling..." };

  if (instruction) instruction.textContent = labels[phase];
  if (phaseLabel) phaseLabel.textContent = phaseLabels[phase];

  // Orb animation
  if (orb) {
    orb.classList.remove("inhale", "hold", "exhale");
    orb.style.animation = "none";
    orb.offsetHeight; // reflow
    if (phase === "inhale") {
      orb.style.animation = `orbInhale ${duration}s linear forwards`;
    } else if (phase === "exhale") {
      orb.style.animation = `orbExhale ${duration}s linear forwards`;
    }
    orb.classList.add(phase);
  }

  // Countdown
  let remaining = duration;
  if (countEl) countEl.textContent = remaining;
  const interval = setInterval(() => {
    if (!state.breathRunning) { clearInterval(interval); return; }
    remaining--;
    if (countEl) countEl.textContent = remaining > 0 ? remaining : "";
    if (remaining <= 0) {
      clearInterval(interval);
      callback();
    }
  }, 1000);

  state.breathTimer = interval;
}

function stopBreath() {
  state.breathRunning = false;
  if (state.breathTimer) clearInterval(state.breathTimer);
  const orb = document.getElementById("breathOrb");
  if (orb) {
    orb.style.animation = "none";
    orb.className = "breath-orb";
  }
  const instruction = document.getElementById("breathInstruction");
  const countEl = document.getElementById("breathCount");
  const phaseLabel = document.getElementById("breathPhaseLabel");
  if (instruction) instruction.textContent = "Press Start";
  if (countEl) countEl.textContent = "";
  if (phaseLabel) phaseLabel.textContent = "Ready";
  document.getElementById("breathStart").style.display = "inline-flex";
  document.getElementById("breathStop").style.display = "none";
}

/* ─── MORNING RITUAL ─── */
function initRitual() {
  renderRitual();

  document.getElementById("addStep")?.addEventListener("click", () => {
    const nameEl = document.getElementById("stepName");
    const durEl = document.getElementById("stepDuration");
    const catEl = document.getElementById("stepCategory");
    const name = nameEl?.value.trim();
    if (!name) { nameEl?.focus(); return; }
    const steps = load("ritualSteps", []);
    const catEmojis = { mind: "🧠", body: "💪", soul: "🙏", focus: "🎯" };
    steps.push({
      id: Date.now(),
      name,
      duration: parseInt(durEl?.value || 10),
      category: catEl?.value || "mind",
      categoryEmoji: catEmojis[catEl?.value] || "🧠",
      done: false,
    });
    save("ritualSteps", steps);
    if (nameEl) nameEl.value = "";
    renderRitual();
  });

  document.getElementById("resetRitual")?.addEventListener("click", () => {
    const steps = load("ritualSteps", []);
    steps.forEach(s => s.done = false);
    save("ritualSteps", steps);
    renderRitual();
  });
}

function renderRitual() {
  const steps = load("ritualSteps", []);
  const list = document.getElementById("ritualList");
  if (!list) return;

  if (!steps.length) {
    list.innerHTML = '<p class="empty-state ritual-empty">No steps yet. Add your first one ←</p>';
    updateRitualProgress(0, 0);
    return;
  }

  list.innerHTML = steps.map(s => `
    <div class="ritual-step-item ${s.done ? "done" : ""}" data-id="${s.id}">
      <div class="step-checkbox ${s.done ? "checked" : ""}" onclick="toggleStep(${s.id})">
        ${s.done ? "✓" : ""}
      </div>
      <div class="step-info">
        <div class="step-name">${s.categoryEmoji} ${s.name}</div>
        <div class="step-meta">${s.duration} min</div>
      </div>
      <button class="step-delete" onclick="deleteStep(${s.id})">×</button>
    </div>
  `).join("");

  const done = steps.filter(s => s.done).length;
  updateRitualProgress(done, steps.length);
}

function toggleStep(id) {
  const steps = load("ritualSteps", []);
  const step = steps.find(s => s.id === id);
  if (step) step.done = !step.done;
  save("ritualSteps", steps);
  renderRitual();
}

function deleteStep(id) {
  const steps = load("ritualSteps", []).filter(s => s.id !== id);
  save("ritualSteps", steps);
  renderRitual();
}

function updateRitualProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const circumference = 326.7;
  const offset = circumference - (pct / 100) * circumference;
  const ring = document.getElementById("ritualRingFill");
  const pctEl = document.getElementById("ritualPct");
  const enc = document.getElementById("ritualEncouragement");
  if (ring) ring.style.strokeDashoffset = offset;
  if (pctEl) pctEl.textContent = pct + "%";
  if (enc) {
    if (total === 0) enc.textContent = "Add your first ritual step!";
    else if (pct === 0) enc.textContent = "Ready to begin your ritual?";
    else if (pct < 50) enc.textContent = "You've started. Keep going!";
    else if (pct < 100) enc.textContent = "More than halfway there! 💪";
    else enc.textContent = "Ritual complete! 🌿 Beautiful work.";
  }
}

/* ─── AFFIRMATIONS ─── */
function initAffirmations() {
  renderAffirmation();
  renderSaved();

  document.getElementById("affirmNext")?.addEventListener("click", () => {
    const list = getFilteredAffirmations(state.currentAffirmCat);
    state.currentAffirmIndex = (state.currentAffirmIndex + 1) % list.length;
    renderAffirmation();
  });

  document.getElementById("affirmPrev")?.addEventListener("click", () => {
    const list = getFilteredAffirmations(state.currentAffirmCat);
    state.currentAffirmIndex = (state.currentAffirmIndex - 1 + list.length) % list.length;
    renderAffirmation();
  });

  document.getElementById("saveAffirmation")?.addEventListener("click", () => {
    const list = getFilteredAffirmations(state.currentAffirmCat);
    const current = list[state.currentAffirmIndex % list.length];
    if (!current) return;
    const saved = load("savedAffirmations", []);
    if (!saved.find(s => s.text === current.text)) {
      saved.push(current);
      save("savedAffirmations", saved);
      renderSaved();
      const btn = document.getElementById("saveAffirmation");
      const orig = btn.textContent;
      btn.textContent = "♥ Saved!";
      setTimeout(() => btn.textContent = orig, 1500);
    }
  });

  document.querySelectorAll(".affirm-cat").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".affirm-cat").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentAffirmCat = btn.dataset.cat;
      state.currentAffirmIndex = 0;
      renderAffirmation();
    });
  });
}

function getFilteredAffirmations(cat) {
  return cat === "all" ? AFFIRMATIONS : AFFIRMATIONS.filter(a => a.cat === cat);
}

function renderAffirmation() {
  const list = getFilteredAffirmations(state.currentAffirmCat);
  if (!list.length) return;
  const a = list[state.currentAffirmIndex % list.length];
  const textEl = document.getElementById("affirmText");
  const srcEl = document.getElementById("affirmSource");
  const card = document.getElementById("affirmMainCard");
  if (textEl) textEl.textContent = `"${a.text}"`;
  if (srcEl) srcEl.textContent = a.cat.charAt(0).toUpperCase() + a.cat.slice(1);
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "translateY(8px)";
    setTimeout(() => {
      card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 50);
  }
}

function renderSaved() {
  const saved = load("savedAffirmations", []);
  const list = document.getElementById("savedList");
  if (!list) return;
  if (!saved.length) {
    list.innerHTML = '<p class="empty-state">None saved yet.</p>';
    return;
  }
  list.innerHTML = saved.map((a, i) => `
    <div class="saved-item">
      <span>"${a.text}"</span>
      <button class="unsave-btn" onclick="unsaveAffirmation(${i})">×</button>
    </div>
  `).join("");
}

function unsaveAffirmation(idx) {
  const saved = load("savedAffirmations", []);
  saved.splice(idx, 1);
  save("savedAffirmations", saved);
  renderSaved();
}

/* ─── TRENDS ─── */
function initTrends() {
  renderTrends();
}

function renderTrends() {
  const checkins = load("checkins", []);
  const totalEl = document.getElementById("totalCheckins");
  const avgMoodEl = document.getElementById("avgMood");
  const avgEnergyEl = document.getElementById("avgEnergy");
  const bestDayEl = document.getElementById("bestDay");
  const chartEmpty = document.getElementById("chartEmpty");

  if (totalEl) totalEl.textContent = checkins.length;

  if (!checkins.length) {
    if (chartEmpty) chartEmpty.style.display = "flex";
    renderDistortionBars([]);
    return;
  }

  if (chartEmpty) chartEmpty.style.display = "none";

  // Stats
  const avgMood = (checkins.reduce((s, c) => s + c.mood, 0) / checkins.length).toFixed(1);
  const avgEnergy = (checkins.reduce((s, c) => s + c.energy, 0) / checkins.length).toFixed(1);
  if (avgMoodEl) avgMoodEl.textContent = avgMood + "/5";
  if (avgEnergyEl) avgEnergyEl.textContent = avgEnergy + "/10";

  if (bestDayEl && checkins.length) {
    const best = checkins.reduce((a, b) => a.mood > b.mood ? a : b);
    bestDayEl.textContent = formatDate(best.date);
  }

  // Chart (last 14 days)
  drawChart(checkins);

  // Distortions
  const allDist = checkins.flatMap(c => c.distortions || []).filter(d => d !== "none");
  const distCounts = {};
  allDist.forEach(d => distCounts[d] = (distCounts[d] || 0) + 1);
  renderDistortionBars(distCounts);
}

function drawChart(checkins) {
  const canvas = document.getElementById("moodChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Get last 14 days
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }

  const isDark = document.body.dataset.theme === "dark";
  const gridColor = isDark ? "#333028" : "#E4DFD5";
  const textColor = isDark ? "#6A6560" : "#9C9890";
  const moodColor = "#3D6B4F";
  const energyColor = "#C49A3C";

  const padL = 36, padR = 16, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padT + (chartH / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.font = "10px DM Mono, monospace";
    ctx.fillText(5 - i, padL - 20, y + 4);
  }

  // X labels
  ctx.fillStyle = textColor;
  ctx.font = "10px DM Mono, monospace";
  const labelStep = 2;
  days.forEach((d, i) => {
    if (i % labelStep !== 0) return;
    const x = padL + (i / (days.length - 1)) * chartW;
    const label = new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    ctx.fillText(label, x - 14, H - padB + 14);
  });

  // Mood line
  const moodPoints = days.map((d, i) => {
    const dayCheckins = checkins.filter(c => c.date === d);
    if (!dayCheckins.length) return null;
    const avg = dayCheckins.reduce((s, c) => s + c.mood, 0) / dayCheckins.length;
    return {
      x: padL + (i / (days.length - 1)) * chartW,
      y: padT + chartH - (avg / 5) * chartH,
    };
  });

  drawLine(ctx, moodPoints, moodColor, 2.5);

  // Energy line (scaled to /5)
  const energyPoints = days.map((d, i) => {
    const dayCheckins = checkins.filter(c => c.date === d);
    if (!dayCheckins.length) return null;
    const avg = dayCheckins.reduce((s, c) => s + c.energy, 0) / dayCheckins.length;
    return {
      x: padL + (i / (days.length - 1)) * chartW,
      y: padT + chartH - (avg / 10) * chartH,
    };
  });

  drawLine(ctx, energyPoints, energyColor, 2);
}

function drawLine(ctx, points, color, width) {
  const valid = points.filter(Boolean);
  if (valid.length < 2) {
    // Draw dots for single points
    valid.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    return;
  }

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  let started = false;
  points.forEach((p, i) => {
    if (!p) return;
    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  // Dots
  valid.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = document.body.dataset.theme === "dark" ? "#1E1C19" : "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function renderDistortionBars(distCounts) {
  const container = document.getElementById("distortionBars");
  if (!container) return;
  const entries = Object.entries(distCounts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    container.innerHTML = '<p class="empty-state">Complete check-ins to see patterns.</p>';
    return;
  }
  const max = entries[0][1];
  const labels = {
    "all-or-nothing": "All-or-nothing",
    "overgeneralizing": "Overgeneralizing",
    "catastrophizing": "Catastrophizing",
    "mind-reading": "Mind reading",
    "should-statements": "Should statements",
    "self-blame": "Self-blame",
    "filtering": "Mental filtering",
  };
  container.innerHTML = entries.map(([d, count]) => `
    <div class="distortion-bar-item">
      <div class="distortion-bar-label">
        <span>${labels[d] || d}</span>
        <span>${count}x</span>
      </div>
      <div class="distortion-bar-track">
        <div class="distortion-bar-fill" style="width: ${(count / max) * 100}%"></div>
      </div>
    </div>
  `).join("");
}

/* ─── GLOBAL EXPOSE (for inline onclick handlers) ─── */
window.toggleStep = toggleStep;
window.deleteStep = deleteStep;
window.unsaveAffirmation = unsaveAffirmation;
window.loadEntry = loadEntry;