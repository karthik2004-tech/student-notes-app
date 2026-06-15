/* ==========================================================================
   Developer Resource Vault Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const btnAddResource = document.getElementById('btn-add-resource');
  const vaultSearch = document.getElementById('vault-search');
  const vaultSort = document.getElementById('vault-sort');
  const vaultGrid = document.getElementById('vault-grid');
  const vaultEmpty = document.getElementById('vault-empty');
  
  // Analytics Dashboard counters
  const statTotal = document.getElementById('stat-total');
  const statToread = document.getElementById('stat-toread');
  const statProgress = document.getElementById('stat-progress');
  const statCompleted = document.getElementById('stat-completed');
  const completionPercentage = document.getElementById('completion-percentage');
  const completionProgressBar = document.getElementById('completion-progress-bar');
  
  // Sidebar Topics
  const topicButtons = document.querySelectorAll('.topic-btn');
  
  // Filters Type tabs
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Modals
  const modalResource = document.getElementById('modal-resource');
  const modalTitle = document.getElementById('modal-title');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalSave = document.getElementById('btn-modal-save');
  
  // Modal Fields
  const resTitle = document.getElementById('res-title');
  const resType = document.getElementById('res-type');
  const resUrl = document.getElementById('res-url');
  const resTopic = document.getElementById('res-topic');
  const resPriority = document.getElementById('res-priority');
  const resStatus = document.getElementById('res-status');
  const resDesc = document.getElementById('res-desc');
  const resTags = document.getElementById('res-tags');

  // Backups
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const importFile = document.getElementById('import-file');

  // Application State
  let resources = [];
  let currentTopic = 'all';
  let currentType = 'all';
  let searchQuery = '';
  let sortBy = 'newest';
  let activeEditId = null; // null for add mode

  // Priority Values for Sorting
  const PRIORITY_SCORES = {
    high: 3,
    medium: 2,
    low: 1
  };

  // Default Mock Resources (loaded if storage is empty)
  const MOCK_RESOURCES = [
    {
      id: 'res-1',
      title: 'MDN Web Docs - JavaScript Guide',
      type: 'docs',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      topic: 'frontend',
      priority: 'high',
      status: 'toread',
      desc: 'The official guides and deep references for core language details, modules, and arrays.',
      tags: ['javascript', 'reference', 'mdn'],
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3
    },
    {
      id: 'res-2',
      title: 'Node.js Complete Rest API Course',
      type: 'tutorial',
      url: 'https://nodejs.org',
      topic: 'backend',
      priority: 'medium',
      status: 'progress',
      desc: 'A complete modular walkthrough on backend development, databases integration, and servers.',
      tags: ['nodejs', 'express', 'rest-api'],
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2
    },
    {
      id: 'res-3',
      title: 'Docker Containers in 10 Minutes',
      type: 'video',
      url: 'https://docker.com',
      topic: 'devops',
      priority: 'low',
      status: 'completed',
      desc: 'High quality crash course covering Dockerfiles, docker-compose orchestration, and volume maps.',
      tags: ['docker', 'devops', 'containers'],
      timestamp: Date.now() - 1000 * 60 * 60 * 24 * 1
    }
  ];

  // Initialize
  init();

  function init() {
    loadTheme();
    loadResources();
    setupEventListeners();
    refreshUI();
  }

  // Toast Notice
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
    const cachedTheme = localStorage.getItem('dev_vault_theme') || 'dark';
    body.className = `theme-${cachedTheme}`;
    updateThemeIcon(cachedTheme);
  }

  function toggleTheme() {
    const activeTheme = body.classList.contains('theme-dark') ? 'dark' : 'light';
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    body.className = `theme-${nextTheme}`;
    localStorage.setItem('dev_vault_theme', nextTheme);
    updateThemeIcon(nextTheme);
  }

  function updateThemeIcon(theme) {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
      themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    if (window.lucide) {
      window.lucide.createIcons(null, themeToggleBtn);
    }
  }

  // Load/Save resource vault state data
  function loadResources() {
    const cached = localStorage.getItem('dev_vault_resources_v1');
    if (cached) {
      try {
        resources = JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached resources data', e);
        resources = MOCK_RESOURCES;
      }
    } else {
      resources = MOCK_RESOURCES;
      saveResources();
    }
  }

  function saveResources() {
    localStorage.setItem('dev_vault_resources_v1', JSON.stringify(resources));
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Theme Switcher
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Search and Sort
    vaultSearch.addEventListener('input', () => {
      searchQuery = vaultSearch.value.trim().toLowerCase();
      renderVaultGrid();
    });
    vaultSort.addEventListener('change', () => {
      sortBy = vaultSort.value;
      renderVaultGrid();
    });

    // Topic Selection Sidebar Buttons
    topicButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        topicButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTopic = btn.getAttribute('data-topic');
        renderVaultGrid();
      });
    });

    // Type Tabs Filter Buttons
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentType = tab.getAttribute('data-type');
        renderVaultGrid();
      });
    });

    // Add Resource Modal trigger
    btnAddResource.addEventListener('click', () => {
      activeEditId = null;
      modalTitle.textContent = 'Add Learning Resource';
      btnModalSave.textContent = 'Add Resource';
      clearModalInputs();
      openModal();
    });

    btnModalClose.addEventListener('click', closeModal);
    btnModalCancel.addEventListener('click', closeModal);
    
    // Save Action Modal Button
    btnModalSave.addEventListener('click', saveModalData);

    // Backup actions
    btnExportBackup.addEventListener('click', exportJSONBackup);
    btnImportTrigger.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importJSONBackup);
  }

  // Modal open/close controllers
  function openModal() {
    modalResource.classList.add('active');
  }
  function closeModal() {
    modalResource.classList.remove('active');
  }

  function clearModalInputs() {
    resTitle.value = '';
    resUrl.value = '';
    resDesc.value = '';
    resTags.value = '';
    resType.selectedIndex = 0;
    resTopic.selectedIndex = 0;
    resPriority.selectedIndex = 1; // medium
    resStatus.selectedIndex = 0; // toread
  }

  // Save Modal inputs
  function saveModalData() {
    const title = resTitle.value.trim();
    const url = resUrl.value.trim();
    const desc = resDesc.value.trim();
    const type = resType.value;
    const topic = resTopic.value;
    const priority = resPriority.value;
    const status = resStatus.value;
    
    const tagsString = resTags.value.trim();
    const tags = tagsString 
      ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0) 
      : [];

    if (!title) {
      alert('Please specify a title.');
      return;
    }

    if (activeEditId) {
      // Edit mode
      const index = resources.findIndex(r => r.id === activeEditId);
      if (index !== -1) {
        resources[index] = Object.assign({}, resources[index], {
          title, url, type, topic, priority, status, desc, tags
        });
        showToast('Resource updated successfully!', 'save');
      }
    } else {
      // Add Mode
      const newRes = {
        id: 'res-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        title, url, type, topic, priority, status, desc, tags,
        timestamp: Date.now()
      };
      resources.push(newRes);
      showToast('Resource added successfully!', 'plus-circle');
    }

    saveResources();
    closeModal();
    refreshUI();
  }

  // Refresh stats, badges, grids
  function refreshUI() {
    updateDashboardStats();
    updateSidebarTopicCounts();
    renderVaultGrid();
  }

  // Calculate learning dashboard stats
  function updateDashboardStats() {
    const totalCount = resources.length;
    const toreadCount = resources.filter(r => r.status === 'toread').length;
    const progressCount = resources.filter(r => r.status === 'progress').length;
    const completedCount = resources.filter(r => r.status === 'completed').length;

    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    statTotal.textContent = totalCount;
    statToread.textContent = toreadCount;
    statProgress.textContent = progressCount;
    statCompleted.textContent = completedCount;

    completionPercentage.textContent = `${completionRate}%`;
    completionProgressBar.style.width = `${completionRate}%`;
  }

  // Update counts in sidebar topic buttons
  function updateSidebarTopicCounts() {
    topicButtons.forEach(btn => {
      const topic = btn.getAttribute('data-topic');
      const badge = btn.querySelector('.count-badge');
      if (topic === 'all') {
        badge.textContent = resources.length;
      } else {
        badge.textContent = resources.filter(r => r.topic === topic).length;
      }
    });
  }

  // Render Vault cards grid
  function renderVaultGrid() {
    vaultGrid.innerHTML = '';

    // Apply filters
    let filtered = resources.filter(res => {
      // Topic filter
      const matchesTopic = currentTopic === 'all' || res.topic === currentTopic;
      
      // Type tab filter
      const matchesType = currentType === 'all' || res.type === currentType;

      // Search matching titles, urls, descriptions, or tags
      const matchesSearch = !searchQuery || 
        res.title.toLowerCase().includes(searchQuery) ||
        res.desc.toLowerCase().includes(searchQuery) ||
        res.url.toLowerCase().includes(searchQuery) ||
        res.tags.some(tag => tag.includes(searchQuery));

      return matchesTopic && matchesType && matchesSearch;
    });

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.timestamp - a.timestamp;
      } else if (sortBy === 'priority') {
        const scoreDiff = PRIORITY_SCORES[b.priority] - PRIORITY_SCORES[a.priority];
        if (scoreDiff !== 0) return scoreDiff;
        return b.timestamp - a.timestamp; // fallback to newest
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

    filtered.forEach(res => {
      const card = createResourceCard(res);
      vaultGrid.appendChild(card);
    });

    // Render Lucide SVG Icons
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, vaultGrid);
    }
  }

  // Generate resource card DOM element
  function createResourceCard(res) {
    const card = document.createElement('div');
    card.className = 'vault-card';

    // Domain name formatting
    let domain = 'Link';
    try {
      if (res.url) {
        const urlObj = new URL(res.url);
        domain = urlObj.hostname.replace('www.', '');
      }
    } catch(e) {}

    // Get Favicon URL helper
    const faviconUrl = res.url 
      ? `https://www.google.com/s2/favicons?sz=32&domain=${res.url}`
      : '';

    // Render status badge title
    const statusText = res.status === 'toread' ? 'To Read' : res.status === 'progress' ? 'In Progress' : 'Completed';
    const statusColorClass = res.status === 'toread' ? 'badge-orange' : res.status === 'progress' ? 'badge-purple' : 'badge-green';

    card.innerHTML = `
      <div class="card-top">
        <div class="card-badge-row">
          <span class="badge badge-black">${escapeHtml(res.type)}</span>
          <span class="badge badge-${res.priority}">${escapeHtml(res.priority)}</span>
        </div>
        <div class="card-actions">
          <button class="card-btn card-btn-edit" title="Edit Resource">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="card-btn card-btn-delete" title="Delete Resource">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>

      <div class="card-title-wrap">
        ${faviconUrl ? `<img src="${faviconUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';" alt="icon">` : ''}
        <i data-lucide="link" style="display:none;"></i>
        <h4>${escapeHtml(res.title)}</h4>
      </div>

      ${res.url ? `<a href="${escapeHtml(res.url)}" class="card-link" target="_blank">${escapeHtml(domain)} <i data-lucide="external-link" style="width:10px; height:10px; display:inline-block; margin-left:2px; vertical-align:middle;"></i></a>` : ''}

      <p class="card-desc">${escapeHtml(res.desc || 'No description provided.')}</p>

      <div class="card-tags">
        ${res.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
      </div>

      <div class="card-footer">
        <span>Added ${new Date(res.timestamp).toLocaleDateString()}</span>
        <button class="status-trigger" title="Click to Cycle Learning Status">
          <span class="badge ${statusColorClass}" style="padding: 2px 6px;">${statusText}</span>
        </button>
      </div>
    `;

    // Hook action events
    card.querySelector('.card-btn-edit').addEventListener('click', () => editResource(res.id));
    card.querySelector('.card-btn-delete').addEventListener('click', () => deleteResource(res.id));
    card.querySelector('.status-trigger').addEventListener('click', () => cycleResourceStatus(res.id));

    return card;
  }

  // Edit resource action
  function editResource(id) {
    const res = resources.find(r => r.id === id);
    if (!res) return;

    activeEditId = id;
    modalTitle.textContent = 'Edit Learning Resource';
    btnModalSave.textContent = 'Save Changes';

    // Populate modal inputs
    resTitle.value = res.title;
    resUrl.value = res.url || '';
    resDesc.value = res.desc || '';
    resTags.value = res.tags.join(', ');
    resType.value = res.type;
    resTopic.value = res.topic;
    resPriority.value = res.priority;
    resStatus.value = res.status;

    openModal();
  }

  // Delete Resource action
  function deleteResource(id) {
    if (confirm('Delete this developer resource from your knowledge vault?')) {
      resources = resources.filter(r => r.id !== id);
      saveResources();
      showToast('Resource deleted', 'trash');
      refreshUI();
    }
  }

  // Click status badge to cycle: toread -> progress -> completed -> toread
  function cycleResourceStatus(id) {
    const index = resources.findIndex(r => r.id === id);
    if (index !== -1) {
      const current = resources[index].status;
      let next = 'toread';
      if (current === 'toread') next = 'progress';
      else if (current === 'progress') next = 'completed';
      
      resources[index].status = next;
      saveResources();
      showToast(`Status updated to ${next === 'toread' ? 'To Read' : next === 'progress' ? 'In Progress' : 'Completed'}`);
      refreshUI();
    }
  }

  // Backup: JSON Export
  function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resources, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `devvault_backup_${Date.now()}.json`);
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
          // simple validation of fields
          if (imported.length === 0 || imported.every(r => r.id && r.title && r.type && r.topic)) {
            resources = imported;
            saveResources();
            showToast('Resources imported successfully!', 'upload-cloud');
            refreshUI();
          } else {
            alert('JSON validation failed. Records must contain id, title, type, and topic fields.');
          }
        } else {
          alert('Invalid file format. Backup must be a JSON array of resources.');
        }
      } catch (err) {
        alert('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
    importFile.value = ''; // clear input value
  }

  // HTML escape helper
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
