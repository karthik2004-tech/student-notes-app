/**
 * Developer Career Growth Dashboard - Core Script Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial State Data Structure
  let state = {
    role: localStorage.getItem("dev_role") || "Frontend Engineer",
    xp: parseInt(localStorage.getItem("dev_xp")) || 0,
    level: parseInt(localStorage.getItem("dev_level")) || 1,
    activities: JSON.parse(localStorage.getItem("dev_activities")) || [
      { id: 1, text: "🚀 Registered in Career Growth Platform!" }
    ],
    skills: JSON.parse(localStorage.getItem("dev_skills")) || {
      frontend: [
        { name: "HTML/CSS Layouts", tier: "novice" },
        { name: "React Components", tier: "novice" }
      ],
      backend: [
        { name: "Node.js REST APIs", tier: "novice" },
        { name: "Database Schema Design", tier: "novice" }
      ],
      devops: [
        { name: "Docker Containers", tier: "novice" },
        { name: "CI/CD Pipelines", tier: "novice" }
      ],
      dsa: [
        { name: "Time Complexities", tier: "novice" },
        { name: "Graph Algorithms", tier: "novice" }
      ]
    },
    contributions: JSON.parse(localStorage.getItem("dev_contributions")) || [
      { id: 1, project: "student-notes-app", type: "pr", desc: "Fixed responsive grid breakpoint", url: "https://github.com/example/pull/1", status: "merged" }
    ],
    bookmarks: JSON.parse(localStorage.getItem("dev_bookmarks")) || [
      { id: 1, title: "MDN Web Docs", url: "https://developer.mozilla.org" }
    ],
    roadmapChecks: JSON.parse(localStorage.getItem("dev_roadmap_checks")) || {},
    resumeChecks: JSON.parse(localStorage.getItem("dev_resume_checks")) || {
      "res-git": false,
      "res-projects": false,
      "res-summary": false,
      "res-skills": false,
      "res-certs": false,
      "res-slider-val": 5
    },
    dsaList: JSON.parse(localStorage.getItem("dev_dsa_list")) || [
      { id: 1, title: "Two Sum", platform: "LeetCode", diff: "easy", notes: "HashMap lookup" }
    ]
  };

  // Pre-populated roadmap static data
  const roadmapsData = {
    "system-design": [
      { id: "sd1", title: "Horizontal vs Vertical Scaling", url: "https://github.com/donnemartin/system-design-primer" },
      { id: "sd2", title: "Load Balancing Algorithms", url: "https://github.com/donnemartin/system-design-primer" },
      { id: "sd3", title: "Database Sharding & Replication", url: "https://github.com/donnemartin/system-design-primer" }
    ],
    "frontend-master": [
      { id: "fe1", title: "Advanced Javascript (Scope & Closures)", url: "https://javascript.info" },
      { id: "fe2", title: "CSS Grid & Flexbox layouts", url: "https://css-tricks.com" },
      { id: "fe3", title: "React Hooks Custom creation", url: "https://react.dev" }
    ],
    "backend-master": [
      { id: "be1", title: "Caching strategies with Redis", url: "https://redis.io/docs" },
      { id: "be2", title: "JWT authentication pipelines", url: "https://jwt.io" },
      { id: "be3", title: "ORM Queries optimization", url: "https://sequelize.org" }
    ]
  };

  // Element selections
  const navButtons = document.querySelectorAll(".nav-item");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const levelDisplay = document.getElementById("level-display");
  const xpBar = document.getElementById("xp-bar");
  const xpText = document.getElementById("xp-text");
  const dateString = document.getElementById("date-string");
  const profileRole = document.getElementById("profile-role");
  const profileRank = document.getElementById("profile-rank");
  const dailyLogBtn = document.getElementById("daily-log-btn");
  const welcomeMessage = document.getElementById("welcome-message");

  // Format Date string
  const updateDateString = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateString.textContent = new Date().toLocaleDateString('en-US', options);
  };
  updateDateString();

  // Sidebar Tabs Navigation
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      document.getElementById(`tab-${targetTab}`).classList.add("active");

      // Trigger redraws if navigating to specific pages
      if (targetTab === "resume") {
        updateResumeScoreUI();
      }
    });
  });

  // Profile modal logic
  const editRoleBtn = document.getElementById("edit-role-btn");
  const roleModal = document.getElementById("role-modal");
  const closeRoleModal = document.getElementById("close-role-modal");
  const roleForm = document.getElementById("role-form");
  const targetRoleInput = document.getElementById("target-role-input");

  editRoleBtn.addEventListener("click", () => {
    targetRoleInput.value = state.role;
    roleModal.classList.add("active");
  });
  closeRoleModal.addEventListener("click", () => roleModal.classList.remove("active"));

  roleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.role = targetRoleInput.value;
    localStorage.setItem("dev_role", state.role);
    profileRole.textContent = state.role;
    welcomeMessage.textContent = `Welcome, ${state.role}`;
    logActivity(`💼 Changed target role to: ${state.role}`);
    roleModal.classList.remove("active");
  });

  // XP progression system
  const saveGameState = () => {
    localStorage.setItem("dev_xp", state.xp);
    localStorage.setItem("dev_level", state.level);
  };

  const logActivity = (text) => {
    const act = { id: Date.now(), text: `⚡ ${text}` };
    state.activities.unshift(act);
    if (state.activities.length > 20) state.activities.pop(); // keep last 20
    localStorage.setItem("dev_activities", JSON.stringify(state.activities));
    renderActivityLog();
  };

  const renderActivityLog = () => {
    const logList = document.getElementById("activity-log-list");
    logList.innerHTML = "";
    state.activities.forEach(act => {
      const li = document.createElement("li");
      li.className = "activity-item";
      // Pick type styling border class
      if (act.text.includes("Skill")) li.classList.add("skills-item");
      else if (act.text.includes("Contribution")) li.classList.add("contribs-item");
      else if (act.text.includes("DSA")) li.classList.add("dsa-item");
      else li.classList.add("system-item");

      li.textContent = act.text;
      logList.appendChild(li);
    });
  };

  const updateProfileUI = () => {
    levelDisplay.textContent = state.level;
    const reqXP = state.level * 100;
    const pct = Math.min((state.xp / reqXP) * 100, 100);
    xpBar.style.width = `${pct}%`;
    xpText.textContent = `${state.xp} / ${reqXP} XP`;
    profileRole.textContent = state.role;
    welcomeMessage.textContent = `Welcome, ${state.role}`;

    // Rank titles
    let rank = "Novice Coder";
    if (state.level >= 6) rank = "Systems Architect";
    else if (state.level >= 4) rank = "Principal Engineer";
    else if (state.level >= 2) rank = "Full Stack Coder";
    profileRank.textContent = rank;

    // Counts info
    // skills leveled: count nodes that are not 'novice'
    let countLeveled = 0;
    let totalSkills = 0;
    Object.values(state.skills).forEach(arr => {
      totalSkills += arr.length;
      countLeveled += arr.filter(s => s.tier !== 'novice').length;
    });
    document.getElementById("profile-skills-count").textContent = `${countLeveled}/${totalSkills}`;
    document.getElementById("profile-contribs-count").textContent = state.contributions.length;
    document.getElementById("profile-dsa-count").textContent = state.dsaList.length;
  };

  const addXP = (amount) => {
    state.xp += amount;
    const reqXP = state.level * 100;
    if (state.xp >= reqXP) {
      state.xp -= reqXP;
      state.level += 1;
      alert(`🎉 Milestone reached! Leveled up to Level ${state.level}!`);
    }
    saveGameState();
    updateProfileUI();
  };

  dailyLogBtn.addEventListener("click", () => {
    addXP(15);
    logActivity("Logged 1 hour focused coding session!");
  });

  // Clear Activities logger
  document.getElementById("clear-activities-btn").addEventListener("click", () => {
    state.activities = [{ id: Date.now(), text: "🚀 Activity log cleared!" }];
    localStorage.setItem("dev_activities", JSON.stringify(state.activities));
    renderActivityLog();
  });

  // 2. Interactive Skills Progression Matrix
  const saveSkills = () => {
    localStorage.setItem("dev_skills", JSON.stringify(state.skills));
  };

  const renderSkillsTree = () => {
    const branches = ["frontend", "backend", "devops", "dsa"];
    
    branches.forEach(branch => {
      const container = document.getElementById(`nodes-${branch}`);
      container.innerHTML = "";
      
      state.skills[branch].forEach((skill, idx) => {
        const div = document.createElement("div");
        div.className = "skill-node";
        div.innerHTML = `
          <span class="skill-name">${skill.name}</span>
          <span class="skill-tier-badge tier-${skill.tier}">${skill.tier}</span>
        `;
        
        div.addEventListener("click", () => {
          // Cycle skill level
          const tiers = ["novice", "intermediate", "expert"];
          let curIdx = tiers.indexOf(skill.tier);
          let newIdx = (curIdx + 1) % 3;
          skill.tier = tiers[newIdx];
          
          saveSkills();
          renderSkillsTree();
          updateProfileUI();
          
          addXP(10);
          logActivity(`Skill "${skill.name}" leveled up to ${skill.tier.toUpperCase()}`);
        });

        container.appendChild(div);
      });
    });
  };

  // 3. Contribution CRUD Manager
  const saveContributions = () => {
    localStorage.setItem("dev_contributions", JSON.stringify(state.contributions));
  };

  const renderContributions = () => {
    const tbody = document.getElementById("contributions-tbody");
    tbody.innerHTML = "";

    const counts = { pr: 0, issue: 0, review: 0 };

    state.contributions.forEach(c => {
      counts[c.type]++;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${c.project}</strong></td>
        <td><span class="contrib-badge-type c-${c.type}">${c.type}</span></td>
        <td>${c.desc}</td>
        <td><a href="${c.url || '#'}" target="_blank" class="text-cyan">${c.url ? 'Reference link' : 'None'}</a></td>
        <td><span class="contrib-status status-${c.status}">${c.status}</span></td>
        <td>
          <button class="action-icon-btn delete-contrib-btn" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Update totals counters
    document.getElementById("count-prs").textContent = counts.pr;
    document.getElementById("count-issues").textContent = counts.issue;
    document.getElementById("count-reviews").textContent = counts.review;

    // Delete contribution handlers
    document.querySelectorAll(".delete-contrib-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        state.contributions = state.contributions.filter(c => c.id !== id);
        saveContributions();
        renderContributions();
        updateProfileUI();
      });
    });
  };

  const openContribBtn = document.getElementById("open-contrib-modal");
  const contribModal = document.getElementById("contrib-modal");
  const closeContribModal = document.getElementById("close-contrib-modal");
  const contribForm = document.getElementById("contrib-form");

  openContribBtn.addEventListener("click", () => contribModal.classList.add("active"));
  closeContribModal.addEventListener("click", () => contribModal.classList.remove("active"));

  contribForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newContrib = {
      id: Date.now(),
      project: document.getElementById("c-project").value,
      type: document.getElementById("c-type").value,
      desc: document.getElementById("c-desc").value,
      url: document.getElementById("c-url").value,
      status: document.getElementById("c-status").value
    };

    state.contributions.push(newContrib);
    saveContributions();
    renderContributions();
    updateProfileUI();
    
    addXP(15);
    logActivity(`Contribution Logged: ${newContrib.type.toUpperCase()} to ${newContrib.project}`);
    
    contribForm.reset();
    contribModal.classList.remove("active");
  });

  // 4. Learning Roadmaps Hub
  const renderRoadmaps = (type) => {
    const listWrapper = document.getElementById("roadmap-items-wrapper");
    listWrapper.innerHTML = "";

    const items = roadmapsData[type] || [];
    items.forEach(item => {
      const isChecked = !!state.roadmapChecks[item.id];
      const div = document.createElement("div");
      div.className = `roadmap-item-row ${isChecked ? 'completed-text' : ''}`;
      div.innerHTML = `
        <input type="checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
        <div class="roadmap-info-area">
          <strong>${item.title}</strong>
          <a href="${item.url}" target="_blank"><i class="fa-solid fa-up-right-from-square"></i> Documentation Reference</a>
        </div>
      `;

      listWrapper.appendChild(div);
    });

    // Checkbox events
    listWrapper.querySelectorAll("input[type='checkbox']").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = chk.getAttribute("data-id");
        state.roadmapChecks[id] = chk.checked;
        localStorage.setItem("dev_roadmap_checks", JSON.stringify(state.roadmapChecks));
        
        if (chk.checked) addXP(5);
        renderRoadmaps(type);
      });
    });
  };

  // Roadmaps Tab switching
  document.querySelectorAll(".roadmap-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".roadmap-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const rKey = btn.getAttribute("data-roadmap");
      renderRoadmaps(rKey);
    });
  });

  // Bookmarks Links CRUD
  const saveBookmarks = () => {
    localStorage.setItem("dev_bookmarks", JSON.stringify(state.bookmarks));
  };

  const renderBookmarks = () => {
    const container = document.getElementById("bookmarks-container");
    container.innerHTML = "";

    state.bookmarks.forEach(bm => {
      const li = document.createElement("li");
      li.className = "bookmark-item";
      li.innerHTML = `
        <a href="${bm.url}" target="_blank"><i class="fa-solid fa-bookmark"></i> ${bm.title}</a>
        <button class="action-icon-btn delete-bm" data-id="${bm.id}"><i class="fa-solid fa-trash"></i></button>
      `;
      container.appendChild(li);
    });

    // Delete bookmarks
    document.querySelectorAll(".delete-bm").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        state.bookmarks = state.bookmarks.filter(bm => bm.id !== id);
        saveBookmarks();
        renderBookmarks();
      });
    });
  };

  const bmForm = document.getElementById("bookmark-form");
  bmForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("bm-title").value;
    const url = document.getElementById("bm-url").value;

    state.bookmarks.push({ id: Date.now(), title, url });
    saveBookmarks();
    renderBookmarks();
    bmForm.reset();
  });

  // 5. Resume Score Estimator
  const saveResumeChecks = () => {
    localStorage.setItem("dev_resume_checks", JSON.stringify(state.resumeChecks));
  };

  const updateResumeScoreUI = () => {
    let score = 0;
    // Calculate checklist sum
    document.querySelectorAll(".resume-chk").forEach(chk => {
      const id = chk.id;
      const weight = parseInt(chk.getAttribute("data-weight"));
      chk.checked = state.resumeChecks[id] || false;
      if (chk.checked) score += weight;
    });

    // Experience modifier
    const slider = document.getElementById("res-slider");
    slider.value = state.resumeChecks["res-slider-val"] || 5;
    document.getElementById("slider-val").textContent = `${slider.value}%`;
    score += parseInt(slider.value);

    // Render Gauges and texts
    document.getElementById("resume-score-display").textContent = `${score}%`;
    document.getElementById("dashboard-resume-score").textContent = `${score}%`;

    // Circumference is 251.2 (2 * pi * r=40)
    const ringOffset = 251.2 * (1 - (score / 100));
    document.getElementById("resume-score-ring").style.strokeDashoffset = ringOffset;
    document.getElementById("dashboard-resume-ring").style.strokeDashoffset = ringOffset;

    // Verdict message
    let verdict = "Poor";
    let message = "Your resume needs more content. Try adding links to open-source contributions.";
    if (score >= 80) {
      verdict = "Excellent";
      message = "Awesome! Your resume strength is high. Ready for job applications.";
    } else if (score >= 50) {
      verdict = "Average";
      message = "Good start! Add details about your projects and build a skills section.";
    }

    const verdictLabel = document.getElementById("resume-verdict-display");
    verdictLabel.textContent = verdict;
    
    // Pick color
    if (verdict === "Excellent") verdictLabel.style.color = "var(--green-solid)";
    else if (verdict === "Average") verdictLabel.style.color = "var(--orange-solid)";
    else verdictLabel.style.color = "var(--cyan-solid)";

    document.getElementById("verdict-banner-msg").textContent = message;
  };

  // Bind Resume triggers
  document.querySelectorAll(".resume-chk").forEach(chk => {
    chk.addEventListener("change", () => {
      state.resumeChecks[chk.id] = chk.checked;
      saveResumeChecks();
      updateResumeScoreUI();
    });
  });

  const sliderNode = document.getElementById("res-slider");
  sliderNode.addEventListener("input", (e) => {
    state.resumeChecks["res-slider-val"] = parseInt(e.target.value);
    saveResumeChecks();
    updateResumeScoreUI();
  });

  // 6. DSA Problems Tracker
  const saveDSAList = () => {
    localStorage.setItem("dev_dsa_list", JSON.stringify(state.dsaList));
  };

  const renderDSATracker = () => {
    const list = document.getElementById("dsa-problems-list");
    list.innerHTML = "";

    if (state.dsaList.length === 0) {
      list.innerHTML = `<p class="text-muted">No solved challenges logged yet.</p>`;
      return;
    }

    state.dsaList.forEach(prob => {
      const card = document.createElement("div");
      card.className = "dsa-card";
      card.innerHTML = `
        <div class="dsa-card-header">
          <h4>${prob.title}</h4>
          <span class="dsa-diff-badge diff-${prob.diff}">${prob.diff}</span>
        </div>
        <div class="dsa-meta">
          <span>Platform: <strong>${prob.platform}</strong></span>
        </div>
        ${prob.notes ? `<p class="dsa-notes-txt">${prob.notes}</p>` : ''}
        <button class="dsa-delete-btn" data-id="${prob.id}"><i class="fa-solid fa-trash"></i> Delete</button>
      `;

      list.appendChild(card);
    });

    // Delete DSA
    document.querySelectorAll(".dsa-delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        state.dsaList = state.dsaList.filter(p => p.id !== id);
        saveDSAList();
        renderDSATracker();
        updateProfileUI();
      });
    });
  };

  const dsaForm = document.getElementById("dsa-form");
  dsaForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newProb = {
      id: Date.now(),
      title: document.getElementById("dsa-title").value,
      platform: document.getElementById("dsa-platform").value,
      diff: document.getElementById("dsa-difficulty").value,
      notes: document.getElementById("dsa-notes").value
    };

    state.dsaList.push(newProb);
    saveDSAList();
    renderDSATracker();
    updateProfileUI();
    
    addXP(10);
    logActivity(`DSA Solved: "${newProb.title}" on ${newProb.platform} [${newProb.diff.toUpperCase()}]`);

    dsaForm.reset();
  });

  // Initial Load Actions
  updateProfileUI();
  renderActivityLog();
  renderSkillsTree();
  renderContributions();
  renderBookmarks();
  renderRoadmaps("system-design");
  updateResumeScoreUI();
  renderDSATracker();
});
