/* ==========================================================================
   PromptFlow Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const btnAddPrompt = document.getElementById('btn-add-prompt');
  const promptSearch = document.getElementById('prompt-search');
  const promptSort = document.getElementById('prompt-sort');
  const promptsGrid = document.getElementById('prompts-grid');
  const vaultEmpty = document.getElementById('vault-empty');

  // Sidebar platforms
  const platformButtons = document.querySelectorAll('.platform-btn');

  // Categories tabs
  const categoryTabs = document.querySelectorAll('.filter-tab');

  // Hero Stats counters
  const statTotal = document.getElementById('stat-total');
  const statCopies = document.getElementById('stat-copies');
  const statStarred = document.getElementById('stat-starred');

  // Sandbox Compiler UI
  const sandboxEmpty = document.getElementById('sandbox-empty');
  const sandboxCompiler = document.getElementById('sandbox-compiler');
  const sandboxPromptTitle = document.getElementById('sandbox-prompt-title');
  const sandboxVariablesInputs = document.getElementById('sandbox-variables-inputs');
  const sandboxCompiledText = document.getElementById('sandbox-compiled-text');
  const btnCopySandbox = document.getElementById('btn-copy-sandbox');

  // Modals
  const modalPrompt = document.getElementById('modal-prompt');
  const modalTitle = document.getElementById('modal-title');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalSave = document.getElementById('btn-modal-save');
  
  // Modals Inputs
  const prTitle = document.getElementById('pr-title');
  const prPlatform = document.getElementById('pr-platform');
  const prCategory = document.getElementById('pr-category');
  const prTags = document.getElementById('pr-tags');
  const prDesc = document.getElementById('pr-desc');
  const prTemplate = document.getElementById('pr-template');

  // Backups
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const importFile = document.getElementById('import-file');

  // App State Variables
  let prompts = [];
  let currentPlatform = 'all';
  let currentCategory = 'all';
  let searchQuery = '';
  let sortBy = 'newest';
  
  // Sandbox Compiler State
  let activeSelectedPromptId = null;
  let activeVariablesState = {}; // holds inputs values for sandbox variables

  // Modal edit tracker
  let activeEditId = null; // null for add mode

  // Default Mock Prompts
  const MOCK_PROMPTS = [
    {
      id: 'pr-1',
      title: 'React Code Refactoring Expert',
      platform: 'claude',
      category: 'coding',
      tags: ['react', 'refactor', 'clean-code'],
      desc: 'Refactor code segments into hooks, optimize dependencies, and explain fixes.',
      template: 'Act as an expert React Developer. Please review this [language] code snippet: [snippet]. Refactor it to utilize React [feature] hooks. List the improvements and explain what performance issue this resolves.',
      copies: 8,
      starred: true,
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3
    },
    {
      id: 'pr-2',
      title: 'Distraction-Free Summarizer',
      platform: 'chatgpt',
      category: 'writing',
      tags: ['summarize', 'study', 'education'],
      desc: 'Condense long articles or documentations into structured bullet summaries.',
      template: 'Read this article: [text]. Condense its details into [count] key bullet points, highlighting the core definitions. Target audience is [audience].',
      copies: 4,
      starred: false,
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2
    },
    {
      id: 'pr-3',
      title: 'Sleek UI Design Prompt Generator',
      platform: 'midjourney',
      category: 'creative',
      tags: ['design', 'ui', 'dashboard'],
      desc: 'Creates Midjourney commands for dashboard mocks.',
      template: 'A high quality UI screenshot design for a [app_type] application. Visual aesthetics: [theme_colors] gradients theme, clean cards containers layout. Modern, premium, 8k resolution, flat vector --ar [aspect_ratio]',
      copies: 12,
      starred: true,
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1
    }
  ];

  // Initialize
  init();

  function init() {
    loadTheme();
    loadPrompts();
    setupEventListeners();
    refreshUI();
  }

  // Toast notice messages
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

  // Theme Preference loader
  function loadTheme() {
    const cachedTheme = localStorage.getItem('pf_theme') || 'dark';
    body.className = `theme-${cachedTheme}`;
    updateThemeIcon(cachedTheme);
  }

  function toggleTheme() {
    const activeTheme = body.classList.contains('theme-dark') ? 'dark' : 'light';
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    body.className = `theme-${nextTheme}`;
    localStorage.setItem('pf_theme', nextTheme);
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

  // Load/Save prompt list data
  function loadPrompts() {
    const cached = localStorage.getItem('pf_prompts_v1');
    if (cached) {
      try {
        prompts = JSON.parse(cached);
      } catch (e) {
        prompts = MOCK_PROMPTS;
      }
    } else {
      prompts = MOCK_PROMPTS;
      savePrompts();
    }
  }

  function savePrompts() {
    localStorage.setItem('pf_prompts_v1', JSON.stringify(prompts));
  }

  // Setup Event Listeners
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Search and Sort inputs
    promptSearch.addEventListener('input', () => {
      searchQuery = promptSearch.value.trim().toLowerCase();
      renderVaultGrid();
    });
    promptSort.addEventListener('change', () => {
      sortBy = promptSort.value;
      renderVaultGrid();
    });

    // Sidebar platform filter triggers
    platformButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        platformButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlatform = btn.getAttribute('data-platform');
        renderVaultGrid();
      });
    });

    // Category tabs filter triggers
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.getAttribute('data-category');
        renderVaultGrid();
      });
    });

    // Add Prompt Modal triggers
    btnAddPrompt.addEventListener('click', () => {
      activeEditId = null;
      modalTitle.textContent = 'Add Prompt Template';
      btnModalSave.textContent = 'Add Template';
      clearModalInputs();
      modalPrompt.classList.add('active');
    });

    btnModalClose.addEventListener('click', closeModal);
    btnModalCancel.addEventListener('click', closeModal);
    btnModalSave.addEventListener('click', saveModalData);

    // Sandbox compiled copy action
    btnCopySandbox.addEventListener('click', copySandboxCompiledPrompt);

    // Backup actions
    btnExportBackup.addEventListener('click', exportJSONBackup);
    btnImportTrigger.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importJSONBackup);
  }

  function closeModal() {
    modalPrompt.classList.remove('active');
  }

  function clearModalInputs() {
    prTitle.value = '';
    prTemplate.value = '';
    prDesc.value = '';
    prTags.value = '';
    prPlatform.selectedIndex = 0;
    prCategory.selectedIndex = 0;
  }

  // Save Modal parameters
  function saveModalData() {
    const title = prTitle.value.trim();
    const template = prTemplate.value.trim();
    const desc = prDesc.value.trim();
    const platform = prPlatform.value;
    const category = prCategory.value;
    const tagsString = prTags.value.trim();
    const tags = tagsString 
      ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
      : [];

    if (!title || !template) {
      alert('Please specify a title and the prompt template string.');
      return;
    }

    if (activeEditId) {
      // Edit
      const index = prompts.findIndex(p => p.id === activeEditId);
      if (index !== -1) {
        prompts[index] = Object.assign({}, prompts[index], {
          title, template, desc, platform, category, tags
        });
        showToast('Template updated successfully!', 'save');
        
        // Reload sandbox if we are editing the currently open prompt
        if (activeSelectedPromptId === activeEditId) {
          loadPromptIntoSandbox(activeEditId);
        }
      }
    } else {
      // Add
      prompts.push({
        id: 'pr-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        title, template, desc, platform, category, tags,
        copies: 0,
        starred: false,
        timestamp: Date.now()
      });
      showToast('Template added successfully!', 'plus-circle');
    }

    savePrompts();
    closeModal();
    refreshUI();
  }

  // Refresh UI metrics & view grids
  function refreshUI() {
    updateAnalyticsDashboard();
    updateSidebarPlatformCounts();
    renderVaultGrid();
  }

  // Aggregate statistics metrics counters
  function updateAnalyticsDashboard() {
    const totalCount = prompts.length;
    const copiesCount = prompts.reduce((sum, p) => sum + (p.copies || 0), 0);
    const starredCount = prompts.filter(p => p.starred).length;

    statTotal.textContent = totalCount;
    statCopies.textContent = copiesCount;
    statStarred.textContent = starredCount;
  }

  // Update counts in sidebar platform navigation buttons
  function updateSidebarPlatformCounts() {
    platformButtons.forEach(btn => {
      const platform = btn.getAttribute('data-platform');
      const badge = btn.querySelector('.count-badge');
      if (platform === 'all') {
        badge.textContent = prompts.length;
      } else {
        badge.textContent = prompts.filter(p => p.platform === platform).length;
      }
    });
  }

  // Render Prompt Cards vault grid
  function renderVaultGrid() {
    promptsGrid.innerHTML = '';

    // Apply filters
    let filtered = prompts.filter(p => {
      // Platform filter
      const matchesPlatform = currentPlatform === 'all' || p.platform === currentPlatform;

      // Category tab filter
      const matchesCategory = currentCategory === 'all' || p.category === currentCategory;

      // Search matches titles, tags, descriptions, or templates text
      const matchesSearch = !searchQuery || 
        p.title.toLowerCase().includes(searchQuery) ||
        p.desc.toLowerCase().includes(searchQuery) ||
        p.template.toLowerCase().includes(searchQuery) ||
        p.tags.some(t => t.includes(searchQuery));

      return matchesPlatform && matchesCategory && matchesSearch;
    });

    // Apply Sorting rules
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.timestamp - a.timestamp;
      } else if (sortBy === 'copies') {
        return b.copies - a.copies;
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    // Toggle Empty state view
    if (filtered.length === 0) {
      vaultEmpty.style.display = 'flex';
      return;
    } else {
      vaultEmpty.style.display = 'none';
    }

    filtered.forEach(prompt => {
      const card = createPromptCardDOM(prompt);
      promptsGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, promptsGrid);
    }
  }

  // Create Prompt Card DOM elements
  function createPromptCardDOM(p) {
    const card = document.createElement('div');
    card.className = `prompt-card ${activeSelectedPromptId === p.id ? 'active-selected' : ''}`;
    
    // Quick copy counts stats label
    const copyStatLabel = p.copies > 0 ? `${p.copies} copies` : 'unused';

    card.innerHTML = `
      <div class="card-top">
        <div class="card-badge-row">
          <span class="badge badge-black">${escapeHtml(p.platform)}</span>
          <span class="badge badge-purple">${escapeHtml(p.category)}</span>
        </div>
        <div class="card-actions">
          <button class="card-btn card-btn-edit" title="Edit Template">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="card-btn card-btn-delete" title="Delete Template">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>

      <h4>${escapeHtml(p.title)}</h4>
      <p class="prompt-desc">${escapeHtml(p.desc || 'No description provided.')}</p>

      <div class="prompt-card-footer">
        <button class="btn-star-fav ${p.starred ? 'starred' : ''}" title="Star Favorite">
          <i data-lucide="star"></i>
        </button>
        <span>${copyStatLabel}</span>
      </div>
    `;

    // Hook action click handlers
    card.querySelector('.card-btn-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      editPrompt(p.id);
    });
    card.querySelector('.card-btn-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      deletePrompt(p.id);
    });
    card.querySelector('.btn-star-fav').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStarFavorite(p.id);
    });

    // Selecting card loads it into variables sandbox compiler
    card.addEventListener('click', () => {
      loadPromptIntoSandbox(p.id);
    });

    return card;
  }

  // Edit action
  function editPrompt(id) {
    const p = prompts.find(pr => pr.id === id);
    if (!p) return;

    activeEditId = id;
    modalTitle.textContent = 'Edit Prompt Template';
    btnModalSave.textContent = 'Save Changes';

    // Populate modal inputs
    prTitle.value = p.title;
    prPlatform.value = p.platform;
    prCategory.value = p.category;
    prDesc.value = p.desc || '';
    prTemplate.value = p.template;
    prTags.value = p.tags.join(', ');

    modalPrompt.classList.add('active');
  }

  // Delete action
  function deletePrompt(id) {
    if (confirm('Delete this prompt template from your library?')) {
      prompts = prompts.filter(p => p.id !== id);
      savePrompts();
      showToast('Template deleted', 'trash');
      
      // Close sandbox if we deleted the active prompt
      if (activeSelectedPromptId === id) {
        activeSelectedPromptId = null;
        sandboxCompiler.style.display = 'none';
        sandboxEmpty.style.display = 'flex';
      }

      refreshUI();
    }
  }

  // Favorite toggle star
  function toggleStarFavorite(id) {
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index].starred = !prompts[index].starred;
      savePrompts();
      showToast(prompts[index].starred ? 'Added to favorites!' : 'Removed from favorites.', 'star');
      refreshUI();
    }
  }

  // Parse prompt template placeholders [variables] and load into Sandbox panel
  function loadPromptIntoSandbox(id) {
    activeSelectedPromptId = id;
    
    // Add visual outline select ring to card list
    document.querySelectorAll('.prompt-card').forEach(card => card.classList.remove('active-selected'));
    const selectedDOM = document.getElementById(`prompt-card-${id}`); // just in case or re-renders
    
    const p = prompts.find(pr => pr.id === id);
    if (!p) return;

    sandboxEmpty.style.display = 'none';
    sandboxCompiler.style.display = 'block';

    sandboxPromptTitle.textContent = p.title;
    sandboxVariablesInputs.innerHTML = '';
    activeVariablesState = {};

    // Match variables wrapped in square brackets e.g. [placeholder_variable]
    // Regex matches contents inside brackets
    const regex = /\[(.*?)\]/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(p.template)) !== null) {
      const varName = match[1].trim();
      if (!matches.includes(varName)) {
        matches.push(varName);
      }
    }

    if (matches.length === 0) {
      sandboxVariablesInputs.innerHTML = '<p class="text-muted" style="font-size:0.78rem;">This prompt template does not contain any dynamic variables. Click "Copy" below to copy the static prompt text.</p>';
    } else {
      matches.forEach(varName => {
        activeVariablesState[varName] = '';
        
        const row = document.createElement('div');
        row.className = 'variable-input-row';
        row.innerHTML = `
          <label for="var-${varName}">${escapeHtml(varName)}</label>
          <input type="text" id="var-${varName}" placeholder="Enter variable value...">
        `;

        row.querySelector('input').addEventListener('input', (e) => {
          activeVariablesState[varName] = e.target.value;
          compilePromptLive(p.template);
        });

        sandboxVariablesInputs.appendChild(row);
      });
    }

    // Initial compile
    compilePromptLive(p.template);
    
    // Refresh visual active borders in prompt cards list
    renderVaultGrid();
  }

  // Compile variable values into final prompt output preview
  function compilePromptLive(template) {
    let outputText = template;

    // Loop through keys and replace [variable] with input values
    Object.keys(activeVariablesState).forEach(varKey => {
      const val = activeVariablesState[varKey].trim();
      // Safe regex replace of [varKey] globally
      const escapedKey = varKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\[${escapedKey}\\]`, 'g');
      
      if (val) {
        outputText = outputText.replace(regex, val);
      } else {
        // Leave placeholder tag highlighted if user has not typed anything
        outputText = outputText.replace(regex, `[${varKey}]`);
      }
    });

    sandboxCompiledText.textContent = outputText;
  }

  // Copy compiled output text to clipboard
  function copySandboxCompiledPrompt() {
    if (!activeSelectedPromptId) return;

    const compiledText = sandboxCompiledText.textContent;
    if (!compiledText) return;

    navigator.clipboard.writeText(compiledText).then(() => {
      // Increase usage/copies count in state
      const index = prompts.findIndex(p => p.id === activeSelectedPromptId);
      if (index !== -1) {
        prompts[index].copies = (prompts[index].copies || 0) + 1;
        savePrompts();
        refreshUI();
      }
      showToast('Prompt copied to clipboard!', 'clipboard');
    }).catch(err => {
      alert('Clipboard write failed.');
    });
  }

  // Backup: JSON Export
  function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `promptflow_backup_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Database backup downloaded!', 'download-cloud');
  }

  // Backup: JSON Import
  function importJSONBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          if (imported.length === 0 || imported.every(p => p.id && p.title && p.template && p.platform)) {
            prompts = imported;
            savePrompts();
            showToast('Prompts imported successfully!', 'upload-cloud');
            
            // Close active sandbox
            activeSelectedPromptId = null;
            sandboxCompiler.style.display = 'none';
            sandboxEmpty.style.display = 'flex';

            refreshUI();
          } else {
            alert('JSON validation failed. Template records must contain id, title, template, and platform fields.');
          }
        } else {
          alert('Invalid file format. Backup must be a JSON array.');
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
