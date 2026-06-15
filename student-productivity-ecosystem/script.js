/**
 * Aura Study Ecosystem - Core Script Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize States
  let state = {
    xp: parseInt(localStorage.getItem("aura_xp")) || 0,
    level: parseInt(localStorage.getItem("aura_level")) || 1,
    streak: parseInt(localStorage.getItem("aura_streak")) || 3,
    weeklyStudy: JSON.parse(localStorage.getItem("aura_weekly_study")) || [1.5, 0.8, 1.2, 0.5, 0.5, 0.0, 0.0],
    events: JSON.parse(localStorage.getItem("aura_events")) || [
      { id: 1, title: "Algorithms Lecture", day: "Monday", time: "10:00", type: "class" },
      { id: 2, title: "Study Group OS", day: "Wednesday", time: "14:30", type: "study" },
      { id: 3, title: "UI Design Quiz Prep", day: "Friday", time: "09:00", type: "exam" }
    ],
    goals: JSON.parse(localStorage.getItem("aura_goals")) || [
      {
        id: 1,
        title: "Master OS Scheduling",
        category: "Operating Systems",
        milestones: [
          { text: "Read CPU scheduling chapter", completed: true },
          { text: "Solve Round Robin exercises", completed: false }
        ]
      }
    ],
    assignments: JSON.parse(localStorage.getItem("aura_assignments")) || [
      { id: 1, title: "Lab Report 2", subject: "Operating Systems", due: "2026-06-12", status: "todo" },
      { id: 2, title: "Figma Prototype", subject: "Interactive UI Design", due: "2026-06-15", status: "progress" }
    ]
  };

  // HTML Element Selections
  const navButtons = document.querySelectorAll(".nav-item");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const levelDisplay = document.getElementById("level-display");
  const xpBar = document.getElementById("xp-bar");
  const xpText = document.getElementById("xp-text");
  const streakNum = document.getElementById("streak-num");
  const rankName = document.getElementById("rank-name");
  const quickStudyBtn = document.getElementById("quick-study-btn");
  const dateString = document.getElementById("date-string");

  // Date setup
  const updateDateString = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateString.textContent = new Date().toLocaleDateString('en-US', options);
  };
  updateDateString();

  // Tab switching logic
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      document.getElementById(`tab-${targetTab}`).classList.add("active");
    });
  });

  // Gamification Mechanics
  const saveGameState = () => {
    localStorage.setItem("aura_xp", state.xp);
    localStorage.setItem("aura_level", state.level);
    localStorage.setItem("aura_streak", state.streak);
  };

  const updateGamificationUI = () => {
    levelDisplay.textContent = state.level;
    const reqXP = state.level * 100;
    const pct = Math.min((state.xp / reqXP) * 100, 100);
    xpBar.style.width = `${pct}%`;
    xpText.textContent = `${state.xp} / ${reqXP} XP`;
    streakNum.textContent = state.streak;

    // Rank logic
    let rank = "Initiate Scholar";
    if (state.level >= 5) rank = "Grand Sage Scholar";
    else if (state.level >= 3) rank = "Master Scholar";
    rankName.textContent = rank;
  };

  const addXP = (amount) => {
    state.xp += amount;
    const reqXP = state.level * 100;
    if (state.xp >= reqXP) {
      state.xp -= reqXP;
      state.level += 1;
      state.streak += 1; // Streaks reward for level up
      alert(`🎉 Level Up! You reached Level ${state.level}!`);
    }
    saveGameState();
    updateGamificationUI();
  };

  quickStudyBtn.addEventListener("click", () => {
    addXP(15);
    // Log study time to current day of the week
    const currentDayIdx = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    // Adjust idx to Monday-first (Monday=0, Sunday=6)
    const adjustedIdx = currentDayIdx === 0 ? 6 : currentDayIdx - 1;
    state.weeklyStudy[adjustedIdx] = parseFloat((state.weeklyStudy[adjustedIdx] + 0.5).toFixed(1));
    localStorage.setItem("aura_weekly_study", JSON.stringify(state.weeklyStudy));
    renderWeeklyChart();
  });

  // Weekly study hours chart renderer
  const renderWeeklyChart = () => {
    const maxVal = Math.max(...state.weeklyStudy, 4.0); // scale chart based on max hours
    const chartHeight = 110; // SVG space for bars
    const baseLine = 130; // SVG y coordinate for bottom axis

    const rects = [
      document.querySelector(".bar-mon"),
      document.querySelector(".bar-tue"),
      document.querySelector(".bar-wed"),
      document.querySelector(".bar-thu"),
      document.querySelector(".bar-fri"),
      document.querySelector(".bar-sat"),
      document.querySelector(".bar-sun")
    ];

    rects.forEach((rect, idx) => {
      if (rect) {
        const val = state.weeklyStudy[idx];
        const barH = (val / maxVal) * chartHeight;
        rect.setAttribute("height", barH);
        rect.setAttribute("y", baseLine - barH);
      }
    });

    const totalVal = state.weeklyStudy.reduce((acc, c) => acc + c, 0).toFixed(1);
    document.getElementById("total-focus-hours").textContent = `Total: ${totalVal} hrs`;
  };

  // Modal helpers
  const setupModal = (triggerId, modalId, closeId) => {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const close = document.getElementById(closeId);

    if (trigger && modal && close) {
      trigger.addEventListener("click", () => modal.classList.add("active"));
      close.addEventListener("click", () => modal.classList.remove("active"));
    }
  };

  setupModal("open-scheduler-modal", "scheduler-modal", "close-scheduler-modal");
  setupModal("open-kanban-modal", "kanban-modal", "close-kanban-modal");

  // Scheduler Planner Logic
  const saveEvents = () => {
    localStorage.setItem("aura_events", JSON.stringify(state.events));
  };

  const renderScheduler = () => {
    // Clear current events lists
    const dayLists = document.querySelectorAll(".day-events-list");
    dayLists.forEach(list => list.innerHTML = "");

    state.events.forEach(evt => {
      const col = document.querySelector(`.day-column[data-day="${evt.day}"] .day-events-list`);
      if (col) {
        const div = document.createElement("div");
        div.className = `schedule-event ${evt.type}`;
        div.innerHTML = `
          <span class="event-time"><i class="fa-regular fa-clock"></i> ${evt.time}</span>
          <strong>${evt.title}</strong>
          <button class="delete-event-btn" data-id="${evt.id}"><i class="fa-solid fa-trash"></i></button>
        `;
        col.appendChild(div);
      }
    });

    // Hook up delete events triggers
    document.querySelectorAll(".delete-event-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(btn.getAttribute("data-id"));
        state.events = state.events.filter(evt => evt.id !== id);
        saveEvents();
        renderScheduler();
      });
    });
  };

  const schedForm = document.getElementById("scheduler-form");
  schedForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("sched-title").value;
    const day = document.getElementById("sched-day").value;
    const time = document.getElementById("sched-time").value;
    const type = document.getElementById("sched-type").value;

    const newEvent = {
      id: Date.now(),
      title,
      day,
      time,
      type
    };

    state.events.push(newEvent);
    saveEvents();
    renderScheduler();
    schedForm.reset();
    document.getElementById("scheduler-modal").classList.remove("active");
  });

  // Goals & Milestones Logic
  const saveGoals = () => {
    localStorage.setItem("aura_goals", JSON.stringify(state.goals));
  };

  const renderGoals = () => {
    const listContainer = document.getElementById("active-goals-list");
    const previewContainer = document.getElementById("top-goal-preview");
    listContainer.innerHTML = "";

    if (state.goals.length === 0) {
      listContainer.innerHTML = "<p>No active goals yet. Create one!</p>";
      previewContainer.innerHTML = "<p>No active goals. Create one in the Goals tab!</p>";
      return;
    }

    state.goals.forEach(goal => {
      const totalMilestones = goal.milestones.length;
      const completedMilestones = goal.milestones.filter(m => m.completed).length;
      const pct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
      
      // Ring circumference is 188.4 (2 * pi * r=30)
      const ringOffset = 188.4 * (1 - (pct / 100));

      const card = document.createElement("div");
      card.className = "glass-card goal-card glow-green";
      card.innerHTML = `
        <div class="goal-card-header">
          <div class="goal-donut-wrapper">
            <svg width="60" height="60" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" fill="none" stroke="var(--input-border)" stroke-width="6"/>
              <circle cx="35" cy="35" r="30" fill="none" stroke="var(--green-solid)" stroke-width="6" 
                      stroke-dasharray="188.4" stroke-dashoffset="${ringOffset}" 
                      stroke-linecap="round" transform="rotate(-90 35 35)"/>
            </svg>
            <span class="goal-donut-pct">${pct}%</span>
          </div>
          <div class="goal-title-area">
            <h3>${goal.title}</h3>
            <span class="goal-tag">${goal.category}</span>
          </div>
        </div>
        <div class="goal-milestones-list">
          ${goal.milestones.map((ms, msIdx) => `
            <label class="milestone-row ${ms.completed ? 'completed-text' : ''}">
              <input type="checkbox" data-goal-id="${goal.id}" data-ms-idx="${msIdx}" ${ms.completed ? 'checked' : ''}>
              <span>${ms.text}</span>
            </label>
          `).join('')}
        </div>
        <button class="goal-delete-btn" data-goal-id="${goal.id}"><i class="fa-solid fa-trash"></i> Delete Goal</button>
      `;

      listContainer.appendChild(card);
    });

    // Update Top Goal Preview on Dashboard
    const topGoal = state.goals[0];
    const topGoalDone = topGoal.milestones.filter(m => m.completed).length;
    const topGoalPct = topGoal.milestones.length > 0 ? Math.round((topGoalDone / topGoal.milestones.length) * 100) : 0;
    previewContainer.innerHTML = `
      <h3 style="font-size: 1.1rem; margin-bottom: 6px;">${topGoal.title}</h3>
      <span class="goal-tag" style="margin-bottom: 12px; display: inline-block;">${topGoal.category}</span>
      <div class="xp-bar-container" style="width: 100%; height: 10px;">
        <div class="xp-progress-bar" style="width: ${topGoalPct}%; background: var(--green-solid);"></div>
      </div>
      <p style="font-size: 0.8rem; margin-top: 6px;">${topGoalPct}% completed</p>
    `;

    // Event handlers for milestones checks
    document.querySelectorAll(".milestone-row input").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const goalId = parseInt(chk.getAttribute("data-goal-id"));
        const msIdx = parseInt(chk.getAttribute("data-ms-idx"));
        const goal = state.goals.find(g => g.id === goalId);
        
        if (goal) {
          goal.milestones[msIdx].completed = chk.checked;
          if (chk.checked) addXP(5); // bonus study XP for hitting milestone
          saveGoals();
          renderGoals();
        }
      });
    });

    // Delete Goal triggers
    document.querySelectorAll(".goal-delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const goalId = parseInt(btn.getAttribute("data-goal-id"));
        state.goals = state.goals.filter(g => g.id !== goalId);
        saveGoals();
        renderGoals();
      });
    });
  };

  // Add Goal Flow
  const goalForm = document.getElementById("goal-form");
  const milestoneBuilder = document.getElementById("milestone-builder-container");
  const addMilestoneFieldBtn = document.getElementById("add-milestone-field-btn");

  addMilestoneFieldBtn.addEventListener("click", () => {
    const idx = milestoneBuilder.querySelectorAll("input").length + 1;
    const div = document.createElement("div");
    div.className = "milestone-input-row";
    div.innerHTML = `<input type="text" placeholder="Milestone ${idx}" class="milestone-input-field">`;
    milestoneBuilder.appendChild(div);
  });

  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("goal-title").value;
    const category = document.getElementById("goal-category").value;
    
    const inputFields = milestoneBuilder.querySelectorAll("input");
    const milestones = [];
    inputFields.forEach(inp => {
      if (inp.value.trim() !== "") {
        milestones.push({ text: inp.value.trim(), completed: false });
      }
    });

    const newGoal = {
      id: Date.now(),
      title,
      category,
      milestones
    };

    state.goals.push(newGoal);
    saveGoals();
    renderGoals();
    goalForm.reset();
    milestoneBuilder.innerHTML = `
      <div class="milestone-input-row">
        <input type="text" placeholder="Milestone 1" class="milestone-input-field" required>
      </div>
      <div class="milestone-input-row">
        <input type="text" placeholder="Milestone 2" class="milestone-input-field">
      </div>
    `;
  });

  // Kanban Board Logic
  const saveAssignments = () => {
    localStorage.setItem("aura_assignments", JSON.stringify(state.assignments));
  };

  const renderKanban = () => {
    const wrappers = {
      todo: document.getElementById("todo-cards"),
      progress: document.getElementById("progress-cards"),
      review: document.getElementById("review-cards"),
      completed: document.getElementById("completed-cards")
    };

    // Clear columns
    Object.values(wrappers).forEach(w => w.innerHTML = "");

    const counters = { todo: 0, progress: 0, review: 0, completed: 0 };

    state.assignments.forEach(asg => {
      counters[asg.status]++;
      const card = document.createElement("div");
      card.className = "kanban-card";
      card.innerHTML = `
        <div class="kanban-card-header">
          <h4>${asg.title}</h4>
          <span class="kanban-card-subj">${asg.subject}</span>
        </div>
        <div class="kanban-card-footer">
          <span class="kb-due-badge"><i class="fa-regular fa-calendar"></i> ${asg.due}</span>
          <div class="kb-card-actions">
            ${asg.status !== 'todo' ? `<button class="btn-move-status" data-id="${asg.id}" data-dir="prev"><i class="fa-solid fa-arrow-left"></i></button>` : ''}
            ${asg.status !== 'completed' ? `<button class="btn-move-status" data-id="${asg.id}" data-dir="next"><i class="fa-solid fa-arrow-right"></i></button>` : ''}
            <button class="btn-move-status text-orange delete-kb" data-id="${asg.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
      wrappers[asg.status].appendChild(card);
    });

    // Update Counts
    document.getElementById("count-todo").textContent = counters.todo;
    document.getElementById("count-progress").textContent = counters.progress;
    document.getElementById("count-review").textContent = counters.review;
    document.getElementById("count-completed").textContent = counters.completed;

    // Update Next Assignment Dashboard preview
    const nextPreview = document.getElementById("next-assignment-preview");
    const activeAsgs = state.assignments.filter(a => a.status !== 'completed');
    if (activeAsgs.length > 0) {
      // Sort by due date
      activeAsgs.sort((a,b) => new Date(a.due) - new Date(b.due));
      const nextOne = activeAsgs[0];
      nextPreview.innerHTML = `
        <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${nextOne.title}</h3>
        <p style="font-size: 0.8rem; margin-bottom: 8px;">Subject: ${nextOne.subject}</p>
        <span class="kb-due-badge" style="font-size: 0.85rem;"><i class="fa-regular fa-clock"></i> Due: ${nextOne.due}</span>
      `;
    } else {
      nextPreview.innerHTML = `<p>All clean! No upcoming deadlines.</p>`;
    }

    // Bind Shift Status triggers
    document.querySelectorAll(".btn-move-status").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        const dir = btn.getAttribute("data-dir");
        const asg = state.assignments.find(a => a.id === id);

        if (btn.classList.contains("delete-kb")) {
          state.assignments = state.assignments.filter(a => a.id !== id);
          saveAssignments();
          renderKanban();
          return;
        }

        const statuses = ["todo", "progress", "review", "completed"];
        const curIdx = statuses.indexOf(asg.status);
        if (dir === "next" && curIdx < 3) {
          asg.status = statuses[curIdx + 1];
          if (asg.status === "completed") addXP(20); // Big bonus study XP for submitting assignment
        } else if (dir === "prev" && curIdx > 0) {
          asg.status = statuses[curIdx - 1];
        }

        saveAssignments();
        renderKanban();
      });
    });
  };

  const kbForm = document.getElementById("kanban-form");
  kbForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("kb-title").value;
    const subject = document.getElementById("kb-subject").value;
    const due = document.getElementById("kb-due").value;

    const newAsg = {
      id: Date.now(),
      title,
      subject,
      due,
      status: "todo"
    };

    state.assignments.push(newAsg);
    saveAssignments();
    renderKanban();
    kbForm.reset();
    document.getElementById("kanban-modal").classList.remove("active");
  });

  // Wellbeing Breathing Routine
  let breathInterval = null;
  let breathState = 0; // 0 = Inhale, 1 = Hold, 2 = Exhale
  const breathingToggleBtn = document.getElementById("breathing-toggle-btn");
  const breathingCircle = document.getElementById("breathing-circle");
  const breathingInstruction = document.getElementById("breathing-instruction");

  const stopBreathing = () => {
    clearInterval(breathInterval);
    breathInterval = null;
    breathingToggleBtn.textContent = "Start Breathing Routine";
    breathingInstruction.textContent = "Press Start";
    breathingCircle.className = "breath-bubble";
  };

  const startBreathing = () => {
    breathState = 0;
    breathingToggleBtn.textContent = "Stop Breathing Routine";
    
    const runCycle = () => {
      if (breathState === 0) {
        breathingInstruction.textContent = "Inhale...";
        breathingCircle.className = "breath-bubble inhale";
        breathState = 1;
      } else if (breathState === 1) {
        breathingInstruction.textContent = "Hold...";
        breathingCircle.className = "breath-bubble hold";
        breathState = 2;
      } else {
        breathingInstruction.textContent = "Exhale...";
        breathingCircle.className = "breath-bubble exhale";
        breathState = 0;
      }
    };

    runCycle();
    breathInterval = setInterval(runCycle, 4000);
  };

  breathingToggleBtn.addEventListener("click", () => {
    if (breathInterval) {
      stopBreathing();
    } else {
      startBreathing();
    }
  });

  // Ambient Focus Sounds synthesizer using Web Audio API
  let audioCtx = null;
  const soundNodes = {
    binaural: null,
    ocean: null,
    hum: null
  };

  const initAudio = () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  // Sound generator constructors
  const playBinauralNode = () => {
    initAudio();
    // Binaural frequencies: Left 200Hz, Right 210Hz
    const merger = audioCtx.createChannelMerger(2);
    
    const oscL = audioCtx.createOscillator();
    const oscR = audioCtx.createOscillator();
    const gainL = audioCtx.createGain();
    const gainR = audioCtx.createGain();

    oscL.frequency.value = 200;
    oscR.frequency.value = 210;

    oscL.connect(gainL);
    oscR.connect(gainR);
    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);

    const mainGain = audioCtx.createGain();
    const volVal = document.getElementById("vol-binaural").value / 100;
    mainGain.gain.setValueAtTime(volVal * 0.15, audioCtx.currentTime); // keep max bounds lower for ears safety

    merger.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    oscL.start();
    oscR.start();

    return {
      stop: () => {
        oscL.stop();
        oscR.stop();
      },
      gain: mainGain,
      gainScale: 0.15
    };
  };

  const playOceanNode = () => {
    initAudio();
    // Ocean noise simulation using a bandpass filtered white noise source
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, audioCtx.currentTime);

    // Periodically modulate filter frequency to simulate waves
    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.08; // slow cycles
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 200;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const mainGain = audioCtx.createGain();
    const volVal = document.getElementById("vol-ocean").value / 100;
    mainGain.gain.setValueAtTime(volVal * 0.35, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    whiteNoise.start();
    lfo.start();

    return {
      stop: () => {
        whiteNoise.stop();
        lfo.stop();
      },
      gain: mainGain,
      gainScale: 0.35
    };
  };

  const playHumNode = () => {
    initAudio();
    // Study Room Hum: Combine low hum oscillator + filtered pink/brown noise
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 60; // 60Hz hum

    const oscGain = audioCtx.createGain();
    oscGain.gain.value = 0.25;

    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    // Simple Pink noise approximation filter
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut * 0.95 + white * 0.05);
      lastOut = output[i];
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, audioCtx.currentTime);

    const mainGain = audioCtx.createGain();
    const volVal = document.getElementById("vol-hum").value / 100;
    mainGain.gain.setValueAtTime(volVal * 0.25, audioCtx.currentTime);

    osc.connect(oscGain);
    noise.connect(filter);
    
    oscGain.connect(mainGain);
    filter.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    osc.start();
    noise.start();

    return {
      stop: () => {
        osc.stop();
        noise.stop();
      },
      gain: mainGain,
      gainScale: 0.25
    };
  };

  // Sound Buttons interactions
  const handleSoundBtn = (btnId, key, playNodeFunc) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (soundNodes[key]) {
        soundNodes[key].stop();
        soundNodes[key] = null;
        btn.classList.remove("playing");
        btn.innerHTML = `<i class="fa-solid fa-play"></i>`;
      } else {
        soundNodes[key] = playNodeFunc();
        btn.classList.add("playing");
        btn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
      }
    });
  };

  handleSoundBtn("play-binaural", "binaural", playBinauralNode);
  handleSoundBtn("play-ocean", "ocean", playOceanNode);
  handleSoundBtn("play-hum", "hum", playHumNode);

  // Volume sliders adjustment
  const handleSlider = (sliderId, key) => {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    slider.addEventListener("input", (e) => {
      const val = e.target.value / 100;
      if (soundNodes[key]) {
        soundNodes[key].gain.gain.setValueAtTime(val * soundNodes[key].gainScale, audioCtx.currentTime);
      }
    });
  };

  handleSlider("vol-binaural", "binaural");
  handleSlider("vol-ocean", "ocean");
  handleSlider("vol-hum", "hum");

  // Simulated LMS sync
  const syncBtn = document.getElementById("sync-lms-btn");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      syncBtn.innerHTML = `<i class="fa-solid fa-rotate fa-spin"></i> Syncing...`;
      syncBtn.disabled = true;

      setTimeout(() => {
        // Adjust values slightly to simulate dynamic updates
        const gpaVal = (3.7 + Math.random() * 0.25).toFixed(2);
        const sylVal = Math.min(Math.round(70 + Math.random() * 20), 100);
        document.getElementById("lms-gpa").textContent = gpaVal;
        document.getElementById("lms-syllabus").textContent = `${sylVal}%`;
        
        syncBtn.innerHTML = `<i class="fa-solid fa-check"></i> Synchronized`;
        syncBtn.disabled = false;

        addXP(10); // Reward academic synchronization
        
        setTimeout(() => {
          syncBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Sync Portal Data`;
        }, 3000);
      }, 1500);
    });
  }

  // Simulated Chatbot Dialogues
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages-container");

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userText = chatInput.value.trim();
      if (userText === "") return;

      // Render user message
      const uMsg = document.createElement("div");
      uMsg.className = "message user-msg";
      uMsg.innerHTML = `<strong>You:</strong> ${userText}`;
      chatMessages.appendChild(uMsg);
      chatInput.value = "";
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Generate response
      setTimeout(() => {
        const query = userText.toLowerCase();
        let replyText = "Interesting query! Try asking me: 'Explain Recursion', 'Pomodoro Help', or 'Procrastination' to learn productivity hacks.";

        if (query.includes("recursion")) {
          replyText = "🧠 **AI Study Buddy:** Imagine recursion like looking into a mirror that holds a smaller mirror inside. In programming, a function calls itself until it hits a base case (the smallest mirror). Without a base case, you get stack overflow (infinite mirrors)!";
        } else if (query.includes("pomodoro")) {
          replyText = "⏱️ **AI Study Buddy:** The Pomodoro Technique recommends studying intensely for 25 minutes (a Pomodoro cycle), then taking a 5-minute break. After 4 cycles, reward yourself with a longer 15-30 minute break. This keeps your neural path fresh!";
        } else if (query.includes("procrastination")) {
          replyText = "⚡ **AI Study Buddy:** Beat procrastination using the **5-Minute Rule**. Tell yourself you will work on the task for just 5 minutes. Often, getting started is the hardest barrier, and once you start, momentum takes over!";
        }

        const aiMsg = document.createElement("div");
        aiMsg.className = "message ai-msg";
        aiMsg.innerHTML = `<strong>Aura Study Buddy:</strong> ${replyText}`;
        chatMessages.appendChild(aiMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 800);
    });
  }

  // Initial UI Loading
  updateGamificationUI();
  renderWeeklyChart();
  renderScheduler();
  renderGoals();
  renderKanban();
});
