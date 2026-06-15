/* ==========================================================================
   Skill Gap Analyzer Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const btnResetProfile = document.getElementById('btn-reset-profile');
  const targetRoleDropdown = document.getElementById('target-role-dropdown');
  const targetRoleTitle = document.getElementById('target-role-title');
  const targetRoleDesc = document.getElementById('target-role-desc');
  const matchScoreValue = document.getElementById('match-score-value');
  
  // Sidebar items
  const btnAddSkillModal = document.getElementById('btn-add-skill-modal');
  const userSkillsList = document.getElementById('user-skills-list');
  const sidebarSkillsEmpty = document.getElementById('sidebar-skills-empty');
  
  // Dashboard indicators
  const countMatchedSkills = document.getElementById('count-matched-skills');
  const countGapSkills = document.getElementById('count-gap-skills');
  const countLearningSkills = document.getElementById('count-learning-skills');
  
  // Comparisons & Recommendations
  const comparisonBarsGrid = document.getElementById('comparison-bars-grid');
  const recommendationsContainer = document.getElementById('recommendations-container');
  
  // Modals
  const modalSkill = document.getElementById('modal-skill');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalSave = document.getElementById('btn-modal-save');
  const skillNameInput = document.getElementById('skill-name-input');
  const skillDomainInput = document.getElementById('skill-domain-input');
  const skillLevelInput = document.getElementById('skill-level-input');
  const sliderLevelDisplay = document.getElementById('slider-level-display');

  // Backups
  const btnExportProfile = document.getElementById('btn-export-profile');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const importFile = document.getElementById('import-file');

  // App State
  let userSkills = [];
  let currentRoleId = 'frontend_dev';
  let activeLearningSkills = new Set(); // holds skill names currently on learning list

  // CAREER BENCHMARK ROLES LIBRARY
  const CAREER_ROLES = {
    frontend_dev: {
      title: 'Frontend Developer',
      description: 'Responsible for building client-side user interfaces, layouts, animations, and state architectures.',
      skills: {
        'JavaScript': 8,
        'React': 8,
        'CSS & Flexbox': 7,
        'Git': 6,
        'TypeScript': 6,
        'Testing (Jest)': 5
      }
    },
    backend_dev: {
      title: 'Backend Engineer',
      description: 'Designs and builds server architectures, database structures, business layers, and API endpoints.',
      skills: {
        'Node.js': 8,
        'SQL Databases': 8,
        'REST APIs': 8,
        'Git': 7,
        'Docker': 6,
        'System Design': 5
      }
    },
    devops_spec: {
      title: 'DevOps & Cloud Specialist',
      description: 'Orchestrates CI/CD pipelines, container orchestration, cloud hosting architectures, and server security.',
      skills: {
        'Docker': 8,
        'Linux Admin': 7,
        'CI/CD Pipelines': 8,
        'AWS Cloud': 7,
        'Kubernetes': 6,
        'Git': 6
      }
    },
    data_scientist: {
      title: 'Data Scientist',
      description: 'Builds analytical architectures, statistical modeling data engines, and data visualizations workflows.',
      skills: {
        'Python': 8,
        'SQL Databases': 7,
        'Statistics': 8,
        'Data Visualization': 7,
        'Pandas': 7,
        'Machine Learning': 6
      }
    },
    ai_ml_eng: {
      title: 'AI & ML Engineer',
      description: 'Integrates artificial intelligence APIs, builds transformer architectures, and maintains neural network training pipelines.',
      skills: {
        'Python': 9,
        'PyTorch': 8,
        'OpenAI API Integration': 8,
        'Mathematics': 7,
        'MLOps': 6,
        'Git': 6
      }
    }
  };

  // DETAILED SKILLS STUDY PATHWAYS RECOMMENDATIONS
  const SKILLS_RECOMMENDATIONS = {
    'JavaScript': {
      title: 'JavaScript Deep Dive Course',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      desc: 'Master ES6 modules, asynchronous promises, scoping, closures, and object-oriented features.'
    },
    'React': {
      title: 'Official React Documentation Guides',
      url: 'https://react.dev',
      desc: 'Study hooks architectures, side-effects management, context state providers, and performance optimizations.'
    },
    'CSS & Flexbox': {
      title: 'CSS Grid & Flexbox Masterclass',
      url: 'https://css-tricks.com',
      desc: 'Understand flexible layouts, fluid grid spacing, media queries responsive tokens, and visual transitions.'
    },
    'Git': {
      title: 'Git Version Control Handbook',
      url: 'https://git-scm.com/doc',
      desc: 'Learn branching strategies, commit messaging formats, stash operations, and conflict resolutions.'
    },
    'TypeScript': {
      title: 'TypeScript Handbooks & Types Guide',
      url: 'https://www.typescriptlang.org/docs',
      desc: 'Bridge types definition, generics, union operations, and compilation settings.'
    },
    'Testing (Jest)': {
      title: 'Unit Testing with Jest & RTL',
      url: 'https://jestjs.io',
      desc: 'Practice writing assertions, mocking server handlers, and testing components renders.'
    },
    'Node.js': {
      title: 'Complete Express & Node.js tutorials',
      url: 'https://nodejs.org/en/docs',
      desc: 'Master server event cycles, filesystem routers, middleware configurations, and environment setups.'
    },
    'SQL Databases': {
      title: 'Intro to PostgreSQL & Query Tuning',
      url: 'https://www.postgresql.org/docs',
      desc: 'Build table schemas, manage indexes, handle joins operations, and practice query benchmarking.'
    },
    'REST APIs': {
      title: 'Designing Secure REST API Systems',
      url: 'https://swagger.io/docs',
      desc: 'Structure routes, JSON payload envelopes, status code returns, and JWT authentications.'
    },
    'Docker': {
      title: 'Docker Containers Complete Walkthrough',
      url: 'https://docs.docker.com',
      desc: 'Write Dockerfiles, build layer caches, setup compose networks, and manage database volumes.'
    },
    'System Design': {
      title: 'System Design Interview Fundamentals',
      url: 'https://github.com/donnemartin/system-design-primer',
      desc: 'Study caching, load balancers, database scaling, queue structures, and distributed networks.'
    },
    'Linux Admin': {
      title: 'Linux Command Line Bible',
      url: 'https://linuxjourney.com',
      desc: 'Practice bash scripting, file permissions management, SSH, process monitoring, and networking commands.'
    },
    'CI/CD Pipelines': {
      title: 'GitHub Actions Continuous Integration',
      url: 'https://docs.github.com/en/actions',
      desc: 'Automate build workflows, execute unit tests scripts, and structure deployment routines.'
    },
    'AWS Cloud': {
      title: 'AWS Associate Developer guides',
      url: 'https://aws.amazon.com/developer/language/javascript',
      desc: 'Deploy instances (EC2), manage database buckets (S3), configure gateway lambdas, and setup VPC networks.'
    },
    'Kubernetes': {
      title: 'Kubernetes Pod Orchestration Fundamentals',
      url: 'https://kubernetes.io/docs',
      desc: 'Understand pods clustering, ingress configurations, deployment replicas, and configMap mappings.'
    },
    'Python': {
      title: 'Automate the Boring Stuff with Python',
      url: 'https://docs.python.org/3',
      desc: 'Learn pythonic syntax, file automation, script scrapers, data structures, and script debugging.'
    },
    'Statistics': {
      title: 'Applied Statistics & Probability theory',
      url: 'https://www.khanacademy.org/math/statistics-probability',
      desc: 'Master normal distribution matrices, p-value variables, variance, and hypothesis tests.'
    },
    'Data Visualization': {
      title: 'Interactive Plots with D3 & Seaborn',
      url: 'https://seaborn.pydata.org',
      desc: 'Learn layout plots, heatmaps visualizations, multi-axis charting, and customization schemes.'
    },
    'Pandas': {
      title: 'Pandas Data Analysis Cheat Sheets',
      url: 'https://pandas.pydata.org/docs',
      desc: 'Manipulate DataFrame tables, execute grouping aggregations, resolve null fields, and join datasets.'
    },
    'Machine Learning': {
      title: 'Scikit-Learn ML Models Training',
      url: 'https://scikit-learn.org',
      desc: 'Build linear regressions, cluster classification models, split test data, and plot confusion matrices.'
    },
    'PyTorch': {
      title: 'PyTorch Deep Learning Guides',
      url: 'https://pytorch.org/docs',
      desc: 'Construct neural layers, write forward backpropagation, tune weights learning, and configure CUDA.'
    },
    'OpenAI API Integration': {
      title: 'Prompt Engineering & OpenAI API SDKs',
      url: 'https://platform.openai.com/docs',
      desc: 'Manage API tokens keys, configure prompt contexts templates, parse JSON outputs, and calculate tokens.'
    },
    'Mathematics': {
      title: 'Linear Algebra & Calculus for ML',
      url: 'https://www.3blue1brown.com/topics/neural-networks',
      desc: 'Master matrix transformations, vector spaces dot-products, gradient descent, and partial derivatives.'
    },
    'MLOps': {
      title: 'MLflow Model Deployment Pipelines',
      url: 'https://mlflow.org/docs',
      desc: 'Version model weights datasets, monitor training metrics charts, and wrap APIs as containers.'
    }
  };

  // DEFAULT BASELINE PROFILE SKILLS
  const DEFAULT_SKILLS = [
    { name: 'JavaScript', level: 5, domain: 'frontend' },
    { name: 'React', level: 4, domain: 'frontend' },
    { name: 'Git', level: 5, domain: 'tools' }
  ];

  // Initialize App
  init();

  function init() {
    loadTheme();
    loadProfileData();
    setupTargetRolesDropdown();
    setupEventListeners();
    refreshUI();
  }

  // Toast notices
  function showToast(message, iconName = 'check-circle') {
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, toast);
    }
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s';
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // Load/Save Theme Preferences
  function loadTheme() {
    const cachedTheme = localStorage.getItem('skill_sync_theme') || 'dark';
    body.className = `theme-${cachedTheme}`;
    updateThemeIcon(cachedTheme);
  }

  function toggleTheme() {
    const activeTheme = body.classList.contains('theme-dark') ? 'dark' : 'light';
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    body.className = `theme-${nextTheme}`;
    localStorage.setItem('skill_sync_theme', nextTheme);
    updateThemeIcon(nextTheme);
  }

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
      themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    if (window.lucide) {
      window.lucide.createIcons(null, themeToggleBtn);
    }
  }

  // Load/Save Profile data
  function loadProfileData() {
    const cachedSkills = localStorage.getItem('skill_sync_user_skills');
    const cachedRole = localStorage.getItem('skill_sync_target_role');
    const cachedLearning = localStorage.getItem('skill_sync_active_learning');

    if (cachedSkills) {
      try {
        userSkills = JSON.parse(cachedSkills);
      } catch(e) {
        userSkills = DEFAULT_SKILLS;
      }
    } else {
      userSkills = DEFAULT_SKILLS;
      saveProfileData();
    }

    if (cachedRole && CAREER_ROLES[cachedRole]) {
      currentRoleId = cachedRole;
    }

    if (cachedLearning) {
      try {
        activeLearningSkills = new Set(JSON.parse(cachedLearning));
      } catch(e) {
        activeLearningSkills = new Set();
      }
    }
  }

  function saveProfileData() {
    localStorage.setItem('skill_sync_user_skills', JSON.stringify(userSkills));
    localStorage.setItem('skill_sync_target_role', currentRoleId);
    localStorage.setItem('skill_sync_active_learning', JSON.stringify([...activeLearningSkills]));
  }

  // Target Roles Dropdown list setups
  function setupTargetRolesDropdown() {
    targetRoleDropdown.innerHTML = '';
    Object.keys(CAREER_ROLES).forEach(roleKey => {
      const option = document.createElement('option');
      option.value = roleKey;
      option.textContent = CAREER_ROLES[roleKey].title;
      if (roleKey === currentRoleId) option.selected = true;
      targetRoleDropdown.appendChild(option);
    });
  }

  // Setup Event Listeners
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);
    btnResetProfile.addEventListener('click', resetProfile);

    // Target Role selector change
    targetRoleDropdown.addEventListener('change', () => {
      currentRoleId = targetRoleDropdown.value;
      saveProfileData();
      refreshUI();
    });

    // Custom slider triggers modal updates
    skillLevelInput.addEventListener('input', () => {
      sliderLevelDisplay.textContent = skillLevelInput.value;
    });

    // Modal Skills actions
    btnAddSkillModal.addEventListener('click', () => {
      skillNameInput.value = '';
      skillLevelInput.value = '5';
      sliderLevelDisplay.textContent = '5';
      skillDomainInput.selectedIndex = 0;
      modalSkill.classList.add('active');
    });

    btnModalClose.addEventListener('click', closeModal);
    btnModalCancel.addEventListener('click', closeModal);
    btnModalSave.addEventListener('click', addSkillFromModal);

    // Backups
    btnExportProfile.addEventListener('click', exportJSONBackup);
    btnImportTrigger.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importJSONBackup);
  }

  function closeModal() {
    modalSkill.classList.remove('active');
  }

  // Reset/Reset profile default skills
  function resetProfile() {
    if (confirm('Reset your profile skills data back to starting defaults? All custom skills will be deleted.')) {
      userSkills = [
        { name: 'JavaScript', level: 5, domain: 'frontend' },
        { name: 'React', level: 4, domain: 'frontend' },
        { name: 'Git', level: 5, domain: 'tools' }
      ];
      activeLearningSkills = new Set();
      currentRoleId = 'frontend_dev';
      targetRoleDropdown.value = 'frontend_dev';
      saveProfileData();
      showToast('Profile reset complete!', 'rotate-ccw');
      refreshUI();
    }
  }

  // Add skill inputs save
  function addSkillFromModal() {
    const name = skillNameInput.value.trim();
    const domain = skillDomainInput.value;
    const level = parseInt(skillLevelInput.value);

    if (!name) {
      alert('Please specify a skill name.');
      return;
    }

    // Check if skill already exists, update level if so
    const existing = userSkills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.level = level;
      existing.domain = domain;
      showToast(`Updated level for "${existing.name}" to ${level}.`);
    } else {
      userSkills.push({ name, level, domain });
      showToast(`Added skill "${name}" to profile!`, 'plus-circle');
    }

    saveProfileData();
    closeModal();
    refreshUI();
  }

  // Main UI refresh aggregator
  function refreshUI() {
    renderSidebarSkills();
    calculateAndRenderSuitabilityAnalysis();
  }

  // Render Sidebar Skills Profile
  function renderSidebarSkills() {
    userSkillsList.innerHTML = '';
    
    if (userSkills.length === 0) {
      sidebarSkillsEmpty.style.display = 'block';
      return;
    } else {
      sidebarSkillsEmpty.style.display = 'none';
    }

    // Sort user skills alphabetically
    userSkills.sort((a, b) => a.name.localeCompare(b.name));

    userSkills.forEach(skill => {
      const row = document.createElement('div');
      row.className = 'user-skill-row';
      row.innerHTML = `
        <div class="skill-row-top">
          <span class="skill-name-label">${escapeHtml(skill.name)}</span>
          <div class="skill-actions">
            <button class="skill-row-btn btn-del" title="Remove Skill">
              <i data-lucide="x"></i>
            </button>
          </div>
        </div>
        <div class="skill-row-slider-wrap">
          <input type="range" class="skill-slider" min="1" max="10" value="${skill.level}">
          <span class="skill-row-val">${skill.level}</span>
        </div>
      `;

      // Slider changes trigger update
      const slider = row.querySelector('.skill-slider');
      const display = row.querySelector('.skill-row-val');
      
      slider.addEventListener('input', () => {
        const val = parseInt(slider.value);
        display.textContent = val;
        skill.level = val;
        saveProfileData();
        calculateAndRenderSuitabilityAnalysis(); // Real-time calculation on slider drag!
      });

      // Delete action button
      row.querySelector('.btn-del').addEventListener('click', () => {
        userSkills = userSkills.filter(s => s.name !== skill.name);
        saveProfileData();
        showToast(`Skill "${skill.name}" removed from profile.`, 'trash');
        refreshUI();
      });

      userSkillsList.appendChild(row);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, userSkillsList);
    }
  }

  // Calculate and Render match statistics, charts comparison, and study pathways
  function calculateAndRenderSuitabilityAnalysis() {
    const role = CAREER_ROLES[currentRoleId];
    if (!role) return;

    // 1. Headers Text
    targetRoleTitle.textContent = `${role.title} Suitability`;
    targetRoleDesc.textContent = role.description;

    const requiredSkills = role.skills;
    const requiredSkillNames = Object.keys(requiredSkills);
    
    let totalMatchedCount = 0;
    let gapsCount = 0;
    let suitabilitySum = 0;

    const comparisonData = [];
    const gapsList = [];

    requiredSkillNames.forEach(skillName => {
      // Find user proficiency
      const userSkill = userSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      const userLevel = userSkill ? userSkill.level : 0;
      const targetLevel = requiredSkills[skillName];

      if (userLevel > 0) totalMatchedCount++;
      if (userLevel < targetLevel) gapsCount++;

      // Compute suitability score for this single skill (capped at 1.0)
      const suitability = Math.min(1.0, userLevel / targetLevel);
      suitabilitySum += suitability;

      comparisonData.push({
        name: skillName,
        userLevel,
        targetLevel
      });

      if (userLevel < targetLevel) {
        gapsList.push({
          name: skillName,
          gap: targetLevel - userLevel
        });
      }
    });

    // Match Score = average suitability across required skills
    const overallMatchScore = requiredSkillNames.length > 0 
      ? Math.round((suitabilitySum / requiredSkillNames.length) * 100)
      : 0;

    // 2. Render Dashboards Suitability metrics
    matchScoreValue.textContent = `${overallMatchScore}%`;
    countMatchedSkills.textContent = `${totalMatchedCount} / ${requiredSkillNames.length}`;
    countGapSkills.textContent = gapsCount;
    countLearningSkills.textContent = activeLearningSkills.size;

    // 3. Render Comparison Chart Bars
    comparisonBarsGrid.innerHTML = '';
    comparisonData.forEach(item => {
      const row = document.createElement('div');
      row.className = 'comparison-bar-row';
      
      const userPct = item.userLevel * 10;
      const targetPct = item.targetLevel * 10;

      row.innerHTML = `
        <div class="comparison-bar-info">
          <span class="comparison-bar-title">${escapeHtml(item.name)}</span>
          <div class="comparison-bar-values">
            Level <span class="user-score">${item.userLevel}</span> / 
            Benchmark Target <span class="target-score">${item.targetLevel}</span>
          </div>
        </div>
        <div class="comparison-bar-track">
          <div class="comparison-bar-fill-user" style="width: ${userPct}%;"></div>
          <div class="comparison-bar-marker-target" style="left: calc(${targetPct}% - 2px);"></div>
        </div>
      `;
      comparisonBarsGrid.appendChild(row);
    });

    // 4. Render Learning Recommendations
    recommendationsContainer.innerHTML = '';

    if (gapsList.length === 0) {
      recommendationsContainer.innerHTML = `
        <div class="empty-state-card">
          <i data-lucide="check-circle"></i>
          <h4>All Benchmarks Satisfied!</h4>
          <p>Your skill levels fully satisfy the target benchmark requirements for this target role. Excellent job!</p>
        </div>
      `;
    } else {
      gapsList.forEach(gapItem => {
        const reco = SKILLS_RECOMMENDATIONS[gapItem.name];
        const isLearning = activeLearningSkills.has(gapItem.name);

        const card = document.createElement('div');
        card.className = 'recommend-item-card';
        
        card.innerHTML = `
          <div class="recommend-card-top">
            <span class="recommend-skill-badge">${escapeHtml(gapItem.name)}</span>
            <span class="gap-amount-badge">Gap Level: -${gapItem.gap}</span>
          </div>
          <h4>${escapeHtml(reco ? reco.title : `${gapItem.name} Learning Path`)}</h4>
          <p class="text-muted" style="font-size: 0.78rem; line-height: 1.4;">${escapeHtml(reco ? reco.desc : `Bridge the level gaps of this skill. Check official documentation portals.`)}</p>
          
          ${reco ? `
            <a href="${escapeHtml(reco.url)}" class="recommend-link-box" target="_blank">
              <i data-lucide="external-link"></i>
              <span>View Learning Resource</span>
            </a>
          ` : ''}

          <div class="recommend-actions">
            <button class="btn btn-sm ${isLearning ? 'btn-success' : 'btn-secondary'} btn-learning-toggle">
              <i data-lucide="${isLearning ? 'check' : 'bookmark'}"></i>
              <span>${isLearning ? 'Learning Active' : 'Mark to Learn'}</span>
            </button>
          </div>
        `;

        // Action learning checklist triggers
        card.querySelector('.btn-learning-toggle').addEventListener('click', () => {
          if (activeLearningSkills.has(gapItem.name)) {
            activeLearningSkills.delete(gapItem.name);
            showToast(`Removed "${gapItem.name}" learning goal.`);
          } else {
            activeLearningSkills.add(gapItem.name);
            showToast(`Added "${gapItem.name}" to study goals checklist!`, 'bookmark');
          }
          saveProfileData();
          calculateAndRenderSuitabilityAnalysis(); // reload stats counters
        });

        recommendationsContainer.appendChild(card);
      });
    }

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, recommendationsContainer);
    }
  }

  // Backup: JSON Export
  function exportJSONBackup() {
    const backupObj = {
      app: 'SkillSync Backup',
      skills: userSkills,
      role: currentRoleId,
      learning: [...activeLearningSkills]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `skillsync_profile_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Profile configuration downloaded!', 'download-cloud');
  }

  // Backup: JSON Import
  function importJSONBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported && Array.isArray(imported.skills)) {
          userSkills = imported.skills;
          if (imported.role && CAREER_ROLES[imported.role]) {
            currentRoleId = imported.role;
            targetRoleDropdown.value = imported.role;
          }
          if (Array.isArray(imported.learning)) {
            activeLearningSkills = new Set(imported.learning);
          }
          saveProfileData();
          showToast('Profile configuration restored!', 'upload-cloud');
          refreshUI();
        } else {
          alert('JSON validation failed. Backup must contain a valid skills list array.');
        }
      } catch (err) {
        alert('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
    importFile.value = ''; // clear input
  }

  // HTML escaping utility helper
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
