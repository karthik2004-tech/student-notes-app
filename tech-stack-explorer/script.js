/**
 * Tech Stack Explorer - Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Stacks Databases
  const stacksData = {
    mern: {
      name: "MERN Stack",
      desc: "MongoDB, Express, React, and Node.js. The absolute standard for modern single-page applications (SPAs) with full-stack JavaScript.",
      components: [
        { name: "React", role: "Frontend UI Library", use: "Interactive SPAs & UI views", difficulty: "medium", url: "https://react.dev" },
        { name: "Node.js", role: "Runtime Environment", use: "Server-side JavaScript execution", difficulty: "medium", url: "https://nodejs.org" },
        { name: "Express", role: "Backend Framework", use: "REST API route handling & middleware", difficulty: "easy", url: "https://expressjs.com" },
        { name: "MongoDB", role: "Document Database", use: "Flexible, schemaless JSON data storage", difficulty: "easy", url: "https://www.mongodb.com" }
      ],
      steps: [
        { id: "m1", title: "HTML, CSS & Modern JS Basics", desc: "Learn JS scopes, ES6 features, DOM manipulation." },
        { id: "m2", title: "React Component Architecture", desc: "Master hooks, state management, props, and react-router." },
        { id: "m3", title: "Express Server Setup", desc: "Build backend REST endpoints and connect cors/middlewares." },
        { id: "m4", title: "MongoDB Schemas & Mongoose", desc: "Model your data, build CRUD utilities, and write queries." },
        { id: "m5", title: "Full Stack Integration", desc: "Link frontend fetch calls to backend APIs with JWT authentication." }
      ]
    },
    mean: {
      name: "MEAN Stack",
      desc: "MongoDB, Express, Angular, and Node.js. A robust, structured stack suitable for enterprise applications.",
      components: [
        { name: "Angular", role: "Frontend Framework", use: "TypeScript-based opinionated single-page apps", difficulty: "hard", url: "https://angular.dev" },
        { name: "Node.js", role: "Runtime Environment", use: "Server execution environment", difficulty: "medium", url: "https://nodejs.org" },
        { name: "Express", role: "Backend Web Framework", use: "Server routing and middlewares", difficulty: "easy", url: "https://expressjs.com" },
        { name: "MongoDB", role: "NoSQL Database", use: "JSON structured data caching", difficulty: "easy", url: "https://www.mongodb.com" }
      ],
      steps: [
        { id: "me1", title: "TypeScript Core Concepts", desc: "Understand interfaces, decorators, classes, and types." },
        { id: "me2", title: "Angular Component Modules", desc: "Learn directives, services, Dependency Injection, RxJS observables." },
        { id: "me3", title: "Express REST Endpoints", desc: "Set up controllers, models, and JSON token authorizations." },
        { id: "me4", title: "MongoDB Database Connection", desc: "Set up mongoose schemas and database indexes." },
        { id: "me5", title: "Deployment Integration", desc: "Serve Angular client build from Express node server." }
      ]
    },
    lamp: {
      name: "LAMP Stack",
      desc: "Linux, Apache, MySQL, and PHP. The classic, battle-tested web development stack powering much of the traditional web.",
      components: [
        { name: "PHP", role: "Backend Scripting Language", use: "Server side HTML templating & processes", difficulty: "medium", url: "https://www.php.net" },
        { name: "MySQL", role: "Relational SQL Database", use: "Structured, tabular data querying", difficulty: "medium", url: "https://www.mysql.com" },
        { name: "Apache", role: "HTTP Web Server", use: "Virtual hosts config & static file delivery", difficulty: "hard", url: "https://httpd.apache.org" },
        { name: "Linux", role: "Server Operating System", use: "Host environment & server infrastructure", difficulty: "hard", url: "https://www.linux.org" }
      ],
      steps: [
        { id: "la1", title: "Linux Basics & Bash Command Line", desc: "Learn navigation, permissions, package installation." },
        { id: "la2", title: "Apache Web Server Config", desc: "Set up .htaccess files, server virtual directories." },
        { id: "la3", title: "PHP Programming Core", desc: "Master PHP syntax, forms, loops, cookie/session handles." },
        { id: "la4", title: "SQL Database Queries", desc: "Build database tables, relationships, and write SELECT joins." },
        { id: "la5", title: "CRUD Integration", desc: "Connect PHP scripts to MySQL using PDO libraries." }
      ]
    },
    jamstack: {
      name: "Jamstack",
      desc: "JavaScript, APIs, and Markup. Focuses on speed, security, and developer experience by serving pre-rendered static files.",
      components: [
        { name: "Markup (SSGs)", role: "Static Site Generator", use: "Pre-rendering HTML templates (e.g. Next.js, Astro)", difficulty: "medium", url: "https://jamstack.org" },
        { name: "APIs", role: "Serverless Functions / SaaS", use: "Dynamic features (e.g. Stripe, Auth0, Supabase)", difficulty: "medium", url: "https://jamstack.org" },
        { name: "JavaScript", role: "Dynamic client execution", use: "Enhancing static HTML pages interactively", difficulty: "easy", url: "https://developer.mozilla.org" }
      ],
      steps: [
        { id: "j1", title: "Static Site Generators (SSGs)", desc: "Build pages with SSGs like Astro, Hugo, or Next.js." },
        { id: "j2", title: "Headless CMS Connection", desc: "Fetch blog content from Sanity, Contentful, or Strapi." },
        { id: "j3", title: "APIs & Serverless Functions", desc: "Write backend functions using Netlify/Vercel serverless nodes." },
        { id: "j4", title: "CDN Deployment", desc: "Deploy final static directories directly to Cloudflare Pages or Netlify." }
      ]
    }
  };

  // Technologies Comparison Database
  const techCompareData = {
    react: {
      name: "React",
      ratings: { performance: 80, scalability: 85, community: 95, learningCurve: 70 },
      pros: ["Huge ecosystem & libraries", "Component reusability", "Virtual DOM updates"],
      cons: ["Needs multiple setup tools (routing, state)", "Frequent API update changes", "JSX mixing CSS/JS style"]
    },
    vue: {
      name: "Vue",
      ratings: { performance: 80, scalability: 75, community: 80, learningCurve: 85 },
      pros: ["Very clean documentation", "Gentle learning curve", "Compact file sizes"],
      cons: ["Less enterprise-level jobs than React", "Can feel overly flexible", "Plugin support varies"]
    },
    angular: {
      name: "Angular",
      ratings: { performance: 70, scalability: 90, community: 80, learningCurve: 50 },
      pros: ["Complete batteries-included framework", "TypeScript strict typing", "Highly structured templates"],
      cons: ["Very steep learning curve", "Verbose template boilerplates", "Frequent version upgrade steps"]
    },
    nodejs: {
      name: "Node.js",
      ratings: { performance: 75, scalability: 80, community: 90, learningCurve: 75 },
      pros: ["Javascript throughout the stack", "Fast non-blocking I/O event loops", "Massive NPM directory"],
      cons: ["Callback nesting complexity (without async/await)", "Not ideal for CPU intensive tasks", "Packages quality varies"]
    },
    python: {
      name: "Python",
      ratings: { performance: 60, scalability: 75, community: 95, learningCurve: 90 },
      pros: ["Extremely clean syntax", "Standard for AI/ML and scripting", "Large libraries selection"],
      cons: ["Slower execution benchmarks than Go", "Strict whitespace indentation dependency", "Concurrency structures vary"]
    },
    go: {
      name: "Go Lang",
      ratings: { performance: 95, scalability: 95, community: 75, learningCurve: 65 },
      pros: ["Extremely fast compiled binaries", "Built-in lightweight concurrency (goroutines)", "Simple code standard"],
      cons: ["Verbose error handling patterns", "Lack of complex generics support", "Smaller library directory than Python"]
    },
    mongodb: {
      name: "MongoDB",
      ratings: { performance: 80, scalability: 85, community: 85, learningCurve: 85 },
      pros: ["Schemaless JSON objects support", "Fast write/read metrics", "Easy scaling horizontal clustering"],
      cons: ["No rigid transactional constraints (ACID constraints vary)", "Higher RAM storage requirements", "No native tables relational joining"]
    },
    postgresql: {
      name: "PostgreSQL",
      ratings: { performance: 85, scalability: 80, community: 90, learningCurve: 70 },
      pros: ["Strict ACID transactional compliance", "Extremely powerful joins", "Excellent support for JSON query types"],
      cons: ["Requires strict schema change updates", "Harder to scale horizontally", "Performance tuning complexity"]
    }
  };

  // State Management
  let state = {
    selectedStack: localStorage.getItem("selected_stack") || "mern",
    roadmapProgress: JSON.parse(localStorage.getItem("roadmap_progress")) || {},
    plannerGoals: JSON.parse(localStorage.getItem("planner_goals")) || [
      { id: 1, tech: "Docker", category: "devops", date: "2026-06-20", completed: false },
      { id: 2, tech: "NextJS", category: "frontend", date: "2026-06-25", completed: true }
    ]
  };

  // DOM Selections
  const navButtons = document.querySelectorAll(".nav-item");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const dateString = document.getElementById("date-string");

  // Format Date label
  const updateDateString = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateString.textContent = new Date().toLocaleDateString('en-US', options);
  };
  updateDateString();

  // Navigation Panel toggle logic
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetTab = btn.getAttribute("data-tab");
      document.getElementById(`tab-${targetTab}`).classList.add("active");
    });
  });

  // 1. Stack Explorer View Logic
  const stackSelect = document.getElementById("stack-select");
  const stackNameTitle = document.getElementById("stack-name-title");
  const stackDescriptionTxt = document.getElementById("stack-description-txt");
  const stackComponentsWrapper = document.getElementById("stack-components-wrapper");

  const renderStackExplorer = () => {
    const sKey = state.selectedStack;
    const data = stacksData[sKey];

    if (!data) return;

    stackNameTitle.textContent = data.name;
    stackDescriptionTxt.textContent = data.desc;
    stackComponentsWrapper.innerHTML = "";

    data.components.forEach(comp => {
      const card = document.createElement("div");
      card.className = "glass-card component-card glow-cyan";
      card.innerHTML = `
        <div class="comp-header">
          <h4>${comp.name}</h4>
          <span class="difficulty-badge diff-${comp.difficulty}">${comp.difficulty}</span>
        </div>
        <div class="text-muted" style="font-size: 0.85rem;">Role: <strong>${comp.role}</strong></div>
        <p class="comp-use-cases">${comp.use}</p>
        <a href="${comp.url}" target="_blank" class="resource-link"><i class="fa-solid fa-graduation-cap"></i> Read Official Docs</a>
      `;
      stackComponentsWrapper.appendChild(card);
    });
  };

  stackSelect.value = state.selectedStack;
  stackSelect.addEventListener("change", (e) => {
    state.selectedStack = e.target.value;
    localStorage.setItem("selected_stack", state.selectedStack);
    renderStackExplorer();
    renderRoadmapPaths();
  });

  // 2. Learning Paths Progression Timeline
  const pathPercentage = document.getElementById("path-percentage");
  const pathProgressbar = document.getElementById("path-progressbar");
  const timelineStepsContainer = document.getElementById("timeline-steps-container");

  const renderRoadmapPaths = () => {
    const sKey = state.selectedStack;
    const data = stacksData[sKey];

    if (!data) return;

    timelineStepsContainer.innerHTML = "";

    // Count step progress
    const steps = data.steps;
    let completedCount = 0;

    steps.forEach(step => {
      const isChecked = !!state.roadmapProgress[step.id];
      if (isChecked) completedCount++;

      const stepNode = document.createElement("div");
      stepNode.className = `timeline-step ${isChecked ? 'completed-node' : ''}`;
      stepNode.innerHTML = `
        <input type="checkbox" data-id="${step.id}" ${isChecked ? 'checked' : ''}>
        <div class="step-details-card">
          <h4>${step.title}</h4>
          <p class="text-muted">${step.desc}</p>
        </div>
      `;

      timelineStepsContainer.appendChild(stepNode);
    });

    // Calculate progression metrics
    const pct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
    pathPercentage.textContent = `${pct}%`;
    pathProgressbar.style.width = `${pct}%`;

    // Listen to roadmap checkpoint change
    timelineStepsContainer.querySelectorAll("input[type='checkbox']").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = chk.getAttribute("data-id");
        state.roadmapProgress[id] = chk.checked;
        localStorage.setItem("roadmap_progress", JSON.stringify(state.roadmapProgress));
        renderRoadmapPaths();
      });
    });
  };

  // 3. Side-by-side Technology Comparison Logic
  const techASelect = document.getElementById("tech-a-select");
  const techBSelect = document.getElementById("tech-b-select");
  const proconsTitleA = document.getElementById("procons-title-a");
  const proconsTitleB = document.getElementById("procons-title-b");
  const listProsA = document.getElementById("list-pros-a");
  const listConsA = document.getElementById("list-cons-a");
  const listProsB = document.getElementById("list-pros-b");
  const listConsB = document.getElementById("list-cons-b");

  const updateComparisonScorecard = () => {
    const keyA = techASelect.value;
    const keyB = techBSelect.value;

    const dataA = techCompareData[keyA];
    const dataB = techCompareData[keyB];

    if (!dataA || !dataB) return;

    // Redraw pros/cons titles
    proconsTitleA.textContent = dataA.name;
    proconsTitleB.textContent = dataB.name;

    // Fill ratings bars
    const ratingKeys = ["perf", "scale", "community", "learning"];
    const ratingKeysMap = ["performance", "scalability", "community", "learningCurve"];

    ratingKeys.forEach((key, idx) => {
      const scoreKey = ratingKeysMap[idx];
      const valA = dataA.ratings[scoreKey];
      const valB = dataB.ratings[scoreKey];

      const barA = document.getElementById(`score-${key}-a`);
      const barB = document.getElementById(`score-${key}-b`);

      // Draw widths
      barA.style.width = `${valA}%`;
      barB.style.width = `${valB}%`;
      
      barA.textContent = `${dataA.name}: ${valA / 10} / 10`;
      barB.textContent = `${dataB.name}: ${valB / 10} / 10`;
    });

    // Pros/cons lists
    listProsA.innerHTML = dataA.pros.map(p => `<li>${p}</li>`).join("");
    listConsA.innerHTML = dataA.cons.map(c => `<li>${c}</li>`).join("");
    listProsB.innerHTML = dataB.pros.map(p => `<li>${p}</li>`).join("");
    listConsB.innerHTML = dataB.cons.map(c => `<li>${c}</li>`).join("");
  };

  techASelect.addEventListener("change", updateComparisonScorecard);
  techBSelect.addEventListener("change", updateComparisonScorecard);

  // 4. Custom Stack Planner Goals CRUD
  const saveGoals = () => {
    localStorage.setItem("planner_goals", JSON.stringify(state.plannerGoals));
  };

  const renderPlannerGoals = () => {
    const goalsList = document.getElementById("planner-goals-list");
    goalsList.innerHTML = "";

    if (state.plannerGoals.length === 0) {
      goalsList.innerHTML = `<p class="text-muted">No custom learning targets added yet.</p>`;
      return;
    }

    state.plannerGoals.forEach(goal => {
      const card = document.createElement("div");
      card.className = `goal-item-card ${goal.completed ? 'completed-goal' : ''}`;
      card.innerHTML = `
        <span class="goal-cat-badge">${goal.category.toUpperCase()}</span>
        <h4>${goal.tech}</h4>
        <div class="goal-footer">
          <span class="target-date-badge"><i class="fa-regular fa-clock"></i> Target: ${goal.date}</span>
          <div class="goal-actions">
            <input type="checkbox" class="goal-chk" data-id="${goal.id}" ${goal.completed ? 'checked' : ''}>
            <button class="goal-delete-btn" data-id="${goal.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;

      goalsList.appendChild(card);
    });

    // Checkbox togglers
    goalsList.querySelectorAll(".goal-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = parseInt(chk.getAttribute("data-id"));
        const goal = state.plannerGoals.find(g => g.id === id);
        if (goal) {
          goal.completed = chk.checked;
          saveGoals();
          renderPlannerGoals();
        }
      });
    });

    // Delete triggers
    goalsList.querySelectorAll(".goal-delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"));
        state.plannerGoals = state.plannerGoals.filter(g => g.id !== id);
        saveGoals();
        renderPlannerGoals();
      });
    });
  };

  const goalForm = document.getElementById("goal-form");
  goalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const tech = document.getElementById("goal-tech-name").value;
    const category = document.getElementById("goal-category").value;
    const date = document.getElementById("goal-target-date").value;

    const newGoal = {
      id: Date.now(),
      tech,
      category,
      date,
      completed: false
    };

    state.plannerGoals.push(newGoal);
    saveGoals();
    renderPlannerGoals();
    
    goalForm.reset();
  });

  // Initial runs
  renderStackExplorer();
  renderRoadmapPaths();
  updateComparisonScorecard();
  renderPlannerGoals();
});
