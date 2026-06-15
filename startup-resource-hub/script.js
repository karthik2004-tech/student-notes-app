/**
 * Startup Resource Hub - Core Script Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Pre-populated Guides Database
  const guidesData = {
    ideation: [
      { id: "g_id1", title: "The Mom Test (Validation)", url: "https://www.momtestbook.com", desc: "How to talk to customers & learn if your business idea is a good one." },
      { id: "g_id2", title: "Lean Startup Methodology", url: "https://theleanstartup.com", desc: "Build-Measure-Learn feedback loops to build MVPs fast." }
    ],
    funding: [
      { id: "g_fn1", title: "Y Combinator Pitch Guide", url: "https://www.ycombinator.com/library/2u-how-to-build-a-pitch-deck", desc: "The standard YC template for raising pre-seed/seed rounds." },
      { id: "g_fn2", title: "Safes & Convertible Notes", url: "https://www.ycombinator.com/documents", desc: "Understanding early stage equity structures." }
    ],
    marketing: [
      { id: "g_mk1", title: "Zero to Click: SEO Guide", url: "https://moz.com/beginners-guide-to-seo", desc: "Rank organic keywords on Google search for free acquisition." },
      { id: "g_mk2", title: "Cold Outbound Playbooks", url: "https://www.salesforce.com/blog/cold-email-templates", desc: "Drafting effective B2B cold templates." }
    ]
  };

  // 1. Initial State
  let state = {
    checklist: JSON.parse(localStorage.getItem("startup_checklist")) || [
      { id: 1, title: "Conduct customer ideation surveys", priority: "high", completed: true },
      { id: 2, title: "Purchase business domain name", priority: "medium", completed: false },
      { id: 3, title: "Code a Minimal Viable Product (MVP)", priority: "high", completed: false }
    ],
    canvas: JSON.parse(localStorage.getItem("startup_canvas")) || {
      executive: "",
      audience: "",
      revenue: "",
      marketing: ""
    },
    pitch: JSON.parse(localStorage.getItem("startup_pitch")) || {
      problem: "",
      solution: "",
      market: "",
      monetization: "",
      ask: ""
    },
    guideChecks: JSON.parse(localStorage.getItem("startup_guide_checks")) || {}
  };

  // Element selections
  const navButtons = document.querySelectorAll(".nav-item");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const dateString = document.getElementById("date-string");

  // Format Date string
  const updateDateString = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateString.textContent = new Date().toLocaleDateString('en-US', options);
  };
  updateDateString();

  // Navigation panel toggle
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      document.getElementById(`tab-${targetTab}`).classList.add("active");
    });
  });

  // 2. Launch Checklist Logic
  const saveChecklist = () => {
    localStorage.setItem("startup_checklist", JSON.stringify(state.checklist));
  };

  const renderChecklist = () => {
    const wrapper = document.getElementById("checklist-wrapper");
    wrapper.innerHTML = "";

    let completedCount = 0;
    state.checklist.forEach(item => {
      if (item.completed) completedCount++;

      const div = document.createElement("div");
      div.className = `checklist-item-row ${item.completed ? 'completed-task' : ''}`;
      div.innerHTML = `
        <input type="checkbox" class="task-chk" data-id="${item.id}" ${item.completed ? 'checked' : ''}>
        <div class="milestone-content-area">
          <strong>${item.title}</strong>
          <span class="milestone-badge priority-${item.priority}">${item.priority}</span>
        </div>
        <button class="delete-task-btn" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
      `;

      wrapper.appendChild(div);
    });

    // Ring score
    const total = state.checklist.length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    document.getElementById("launch-progress-text").textContent = `${pct}%`;

    // 251.2 is circumference
    const ringOffset = 251.2 * (1 - (pct / 100));
    document.getElementById("launch-progress-ring").style.strokeDashoffset = ringOffset;

    // Checkbox togglers
    wrapper.querySelectorAll(".task-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = parseInt(chk.getAttribute("data-id"));
        const item = state.checklist.find(t => t.id === id);
        if (item) {
          item.completed = chk.checked;
          saveChecklist();
          renderChecklist();
        }
      });
    });

    // Delete tasks
    wrapper.querySelectorAll(".delete-task-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        state.checklist = state.checklist.filter(t => t.id !== id);
        saveChecklist();
        renderChecklist();
      });
    });
  };

  const checklistForm = document.getElementById("checklist-form");
  checklistForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("chk-title").value;
    const priority = document.getElementById("chk-priority").value;

    const newTask = {
      id: Date.now(),
      title,
      priority,
      completed: false
    };

    state.checklist.push(newTask);
    saveChecklist();
    renderChecklist();
    checklistForm.reset();
  });

  // 3. Business Canvas Draft
  const loadCanvasDraft = () => {
    document.getElementById("bp-executive").value = state.canvas.executive;
    document.getElementById("bp-audience").value = state.canvas.audience;
    document.getElementById("bp-revenue").value = state.canvas.revenue;
    document.getElementById("bp-marketing").value = state.canvas.marketing;
  };

  document.getElementById("save-plan-btn").addEventListener("click", () => {
    state.canvas.executive = document.getElementById("bp-executive").value;
    state.canvas.audience = document.getElementById("bp-audience").value;
    state.canvas.revenue = document.getElementById("bp-revenue").value;
    state.canvas.marketing = document.getElementById("bp-marketing").value;

    localStorage.setItem("startup_canvas", JSON.stringify(state.canvas));
    alert("🎉 Business plan canvas draft saved locally!");
  });

  // 4. Financial Calculations
  const finInvestment = document.getElementById("fin-investment");
  const finOverhead = document.getElementById("fin-overhead");
  const finUnitcost = document.getElementById("fin-unitcost");
  const finPrice = document.getElementById("fin-price");
  const finPredicted = document.getElementById("fin-predicted");

  const runFinancials = () => {
    const invest = parseFloat(finInvestment.value) || 0;
    const overhead = parseFloat(finOverhead.value) || 0;
    const unitCost = parseFloat(finUnitcost.value) || 0;
    const price = parseFloat(finPrice.value) || 0;
    const predicted = parseFloat(finPredicted.value) || 0;

    const grossRev = price * predicted;
    const totalCost = overhead + (unitCost * predicted);
    const netProfit = grossRev - totalCost;
    
    // Profit margin calculation
    const margin = grossRev > 0 ? Math.round((netProfit / grossRev) * 100) : 0;
    
    // Break-even units calculation
    const contributionMargin = price - unitCost;
    const breakeven = contributionMargin > 0 ? Math.ceil(overhead / contributionMargin) : 0;

    // Output bindings
    document.getElementById("calc-revenue").textContent = `$${grossRev.toLocaleString()}`;
    document.getElementById("calc-profit").textContent = `$${netProfit.toLocaleString()}`;
    document.getElementById("calc-breakeven").textContent = `${breakeven} units`;
    document.getElementById("calc-margin").textContent = `${margin}%`;

    // Verdict messages
    const verdictMsg = document.getElementById("breakeven-verdict-msg");
    if (netProfit < 0) {
      verdictMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-orange"></i> You are running at a net loss of $${Math.abs(netProfit)}. Try increasing sale prices or decreasing unit costs.`;
    } else {
      verdictMsg.innerHTML = `<i class="fa-solid fa-chart-line text-green"></i> You are operating at a net profit! Keep scaling.`;
    }
  };

  // Event bindings for keyups/change
  const finInputs = [finInvestment, finOverhead, finUnitcost, finPrice, finPredicted];
  finInputs.forEach(inp => {
    if (inp) {
      inp.addEventListener("input", runFinancials);
    }
  });

  // 5. Pitch Slides Outliner
  const loadPitchSlides = () => {
    document.getElementById("pitch-problem").value = state.pitch.problem;
    document.getElementById("pitch-solution").value = state.pitch.solution;
    document.getElementById("pitch-market").value = state.pitch.market;
    document.getElementById("pitch-monetization").value = state.pitch.monetization;
    document.getElementById("pitch-ask").value = state.pitch.ask;
  };

  const exportPitchSummary = () => {
    const prob = document.getElementById("pitch-problem").value;
    const sol = document.getElementById("pitch-solution").value;
    const mkt = document.getElementById("pitch-market").value;
    const mon = document.getElementById("pitch-monetization").value;
    const ask = document.getElementById("pitch-ask").value;

    state.pitch = { problem: prob, solution: sol, market: mkt, monetization: mon, ask };
    localStorage.setItem("startup_pitch", JSON.stringify(state.pitch));

    const outline = `🚀 STARTUP PITCH DECK OUTLINE

1. THE PROBLEM:
   - ${prob || 'Draft details...'}

2. THE SOLUTION:
   - ${sol || 'Draft details...'}

3. TARGET MARKET (TAM/SAM/SOM):
   - ${mkt || 'Draft details...'}

4. BUSINESS MODEL:
   - ${mon || 'Draft details...'}

5. PITCH ASK:
   - ${ask || 'Draft details...'}`;

    document.getElementById("pitch-pre-summary").textContent = outline;
  };

  document.getElementById("export-pitch-btn").addEventListener("click", exportPitchSummary);
  
  // Copy to clipboard
  document.getElementById("copy-pitch-btn").addEventListener("click", () => {
    const summary = document.getElementById("pitch-pre-summary").textContent;
    navigator.clipboard.writeText(summary).then(() => {
      alert("📋 Pitch deck summary copied to clipboard!");
    });
  });

  // 6. Curated Guides Tab view
  const renderGuides = (category) => {
    const container = document.getElementById("guides-container");
    container.innerHTML = "";

    const items = guidesData[category] || [];
    items.forEach(guide => {
      const isRead = !!state.guideChecks[guide.id];
      const card = document.createElement("div");
      card.className = `glass-card guide-item-card glow-green ${isRead ? 'completed-guide' : ''}`;
      card.innerHTML = `
        <div class="guide-header">
          <h3>${guide.title}</h3>
          <label class="guide-chk-label">
            <input type="checkbox" class="guide-chk" data-id="${guide.id}" ${isRead ? 'checked' : ''}>
            <span>Read</span>
          </label>
        </div>
        <span class="guide-tag">${category.toUpperCase()}</span>
        <p class="text-muted" style="font-size: 0.8rem;">${guide.desc}</p>
        <a href="${guide.url}" target="_blank" class="resource-link"><i class="fa-solid fa-up-right-from-square"></i> Open Resource</a>
      `;

      container.appendChild(card);
    });

    // Checkbox togglers
    container.querySelectorAll(".guide-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = chk.getAttribute("data-id");
        state.guideChecks[id] = chk.checked;
        localStorage.setItem("startup_guide_checks", JSON.stringify(state.guideChecks));
        renderGuides(category);
      });
    });
  };

  // Guides categories tab triggers
  document.querySelectorAll(".guide-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".guide-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-cat");
      renderGuides(cat);
    });
  });

  // Initial runs
  renderChecklist();
  loadCanvasDraft();
  runFinancials();
  loadPitchSlides();
  renderGuides("ideation");
});
