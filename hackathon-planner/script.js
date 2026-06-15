/* ==========================================================================
   HackFlow Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation & Tabs
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  // Countdown Clocks
  const daysDigit = document.getElementById('days');
  const hoursDigit = document.getElementById('hours');
  const minutesDigit = document.getElementById('minutes');
  const secondsDigit = document.getElementById('seconds');

  // Dashboard Tab elements
  const btnResetWorkspace = document.getElementById('btn-reset-workspace');
  const projectTitleDisplay = document.getElementById('project-title-display');
  const projectDescDisplay = document.getElementById('project-desc-display');
  const gaugeValue = document.getElementById('gauge-value');
  const statIdeas = document.getElementById('stat-ideas');
  const statTasks = document.getElementById('stat-tasks');
  const statMilestones = document.getElementById('stat-milestones');
  const milestonesContainer = document.getElementById('milestones-container');

  // Brainstorm Tab elements
  const btnAddIdea = document.getElementById('btn-add-idea');
  const ideasGrid = document.getElementById('ideas-grid');
  const ideasEmpty = document.getElementById('ideas-empty');

  // Tasks Tab elements
  const btnAddTask = document.getElementById('btn-add-task');
  const tasksTodo = document.getElementById('tasks-todo');
  const tasksProgress = document.getElementById('tasks-progress');
  const tasksReview = document.getElementById('tasks-review');
  const tasksDone = document.getElementById('tasks-done');

  // Team & Chat Tab elements
  const teamRosterContainer = document.getElementById('team-roster-container');
  const btnLaunchCall = document.getElementById('btn-launch-call');
  const chatMessages = document.getElementById('chat-messages');
  const btnChatFile = document.getElementById('btn-chat-file');
  const chatFileInput = document.getElementById('chat-file-input');
  const chatTextInput = document.getElementById('chat-text-input');
  const btnChatSend = document.getElementById('btn-chat-send');

  // Submission Tab elements
  const submissionChecklist = document.getElementById('submission-checklist');
  const btnSubmitProject = document.getElementById('btn-submit-project');

  // Theme Switches
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const body = document.body;

  // Modals (Propose Idea)
  const modalIdea = document.getElementById('modal-idea');
  const btnModalCancelIdea = document.getElementById('btn-modal-cancel-idea');
  const btnModalSaveIdea = document.getElementById('btn-modal-save-idea');
  const ideaTitleInput = document.getElementById('idea-title-input');
  const ideaDescInput = document.getElementById('idea-desc-input');
  const btnModalCloseIdea = document.getElementById('btn-modal-close-idea');

  // Modals (Create Task)
  const modalTask = document.getElementById('modal-task');
  const btnModalCancelTask = document.getElementById('btn-modal-cancel-task');
  const btnModalSaveTask = document.getElementById('btn-modal-save-task');
  const taskTitleInput = document.getElementById('task-title-input');
  const taskAssignee = document.getElementById('task-assignee');
  const taskPriority = document.getElementById('task-priority');
  const taskStatus = document.getElementById('task-status');
  const taskDeadline = document.getElementById('task-deadline');
  const btnModalCloseTask = document.getElementById('btn-modal-close-task');

  // Modals (Video Call)
  const modalVideoCall = document.getElementById('modal-video-call');
  const btnVideoCancel = document.getElementById('btn-video-cancel');
  const btnVideoJoin = document.getElementById('btn-video-join');
  const btnModalCloseVideo = document.getElementById('btn-modal-close-video');

  // Backups
  const btnExportBackup = document.getElementById('btn-export-backup');
  const btnImportTrigger = document.getElementById('btn-import-trigger');
  const importFile = document.getElementById('import-file');

  // Application State Variables
  let ideas = [];
  let tasks = [];
  let milestones = [];
  let submissionItems = [];
  let messages = [];
  let countdownTargetTime = null;

  // Config defaults
  const DEFAULT_MILESTONES = [
    { id: 'ms-1', title: 'Brainstorm & Concept Lock', desc: 'Settle on core project goals and target users.', completed: true },
    { id: 'ms-2', title: 'UX Wireframing & Design Sheets', desc: 'Design color palettes, user paths, and layouts.', completed: false },
    { id: 'ms-3', title: 'Prototype Development Sprint', desc: 'Build frontend pages and deploy mock database layers.', completed: false },
    { id: 'ms-4', title: 'Readme & Final Submission Test', desc: 'Draft video pitch links, resolve bugs, submit.', completed: false }
  ];

  const DEFAULT_SUBMISSION_ITEMS = [
    { id: 'sub-1', label: 'Complete project demo video (2-minute pitch)', checked: false },
    { id: 'sub-2', label: 'GitHub repository URL with clear README outline', checked: false },
    { id: 'sub-3', label: 'Verify all project environment setup steps', checked: false },
    { id: 'sub-4', label: 'Submit fully filled Devpost submission fields', checked: false }
  ];

  const DEFAULT_TEAM_MEMBERS = [
    { id: 'team-1', name: 'Vishwa (You)', role: 'Front-end & Lead', initials: 'VM' },
    { id: 'team-2', name: 'Saitej', role: 'Backend Dev', initials: 'SK' },
    { id: 'team-3', name: 'Karthik', role: 'UI/UX Designer', initials: 'KT' },
    { id: 'team-4', name: 'Priyanshi', role: 'DevOps & QA', initials: 'PS' }
  ];

  const INITIAL_MESSAGES = [
    { sender: 'Karthik', text: 'Hey team! Let\'s draft some ideas. Check out the Brainstorming tab!', time: '10:15 AM' },
    { sender: 'Saitej', text: 'I am ready to build the server architecture. Let me know when the concept is locked.', time: '10:18 AM' }
  ];

  const SIMULATED_REPLIES = [
    "Awesome! I'll update my task statuses.",
    "Let's review this in the design mockups.",
    "Sounds like a plan, let's join the call to align.",
    "Awesome work! I am finishing up my database branch now.",
    "Do you think we should add this to the submission checklist?",
    "GitHub repo is up, check it out!"
  ];

  // Initialize
  init();

  function init() {
    loadTheme();
    loadWorkspaceState();
    setupTabNavigation();
    setupCountdownClock();
    setupEventListeners();
    refreshUI();

    // Lucide Icon Renders
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Toast Alerts
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

  // Theme Loader
  function loadTheme() {
    const cachedTheme = localStorage.getItem('hf_theme') || 'dark';
    body.className = `theme-${cachedTheme}`;
    updateThemeIcon(cachedTheme);
  }

  function toggleTheme() {
    const activeTheme = body.classList.contains('theme-dark') ? 'dark' : 'light';
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    body.className = `theme-${nextTheme}`;
    localStorage.setItem('hf_theme', nextTheme);
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

  // Load/Save Workspace State
  function loadWorkspaceState() {
    const cachedState = localStorage.getItem('hf_workspace_state_v1');
    if (cachedState) {
      try {
        const parsed = JSON.parse(cachedState);
        ideas = parsed.ideas || [];
        tasks = parsed.tasks || [];
        milestones = parsed.milestones || DEFAULT_MILESTONES;
        submissionItems = parsed.submissionItems || DEFAULT_SUBMISSION_ITEMS;
        messages = parsed.messages || INITIAL_MESSAGES;
        countdownTargetTime = parsed.countdownTargetTime || (Date.now() + 1000 * 60 * 60 * 36); // default 36 hours
      } catch (e) {
        loadDefaultState();
      }
    } else {
      loadDefaultState();
    }
  }

  function loadDefaultState() {
    ideas = [
      { id: 'id-1', title: 'DevVault Knowledge Hub', desc: 'A developer resource base dashboard with category navigation and study planners.', votes: 4, voterSet: [] },
      { id: 'id-2', title: 'VaultKeeper Database tool', desc: 'Inspects and backups browser caches database keys.', votes: 2, voterSet: [] }
    ];
    tasks = [
      { id: 'ts-1', title: 'Set up repository branches structures', assignee: 'vishwa', priority: 'high', status: 'done', deadline: '2026-06-09' },
      { id: 'ts-2', title: 'Design Orange/Purple/Green/Black CSS tokens', assignee: 'karthik', priority: 'medium', status: 'progress', deadline: '2026-06-09' },
      { id: 'ts-3', title: 'Write backup JSON export modules', assignee: 'saitej', priority: 'high', status: 'todo', deadline: '2026-06-10' }
    ];
    milestones = DEFAULT_MILESTONES;
    submissionItems = DEFAULT_SUBMISSION_ITEMS;
    messages = INITIAL_MESSAGES;
    countdownTargetTime = Date.now() + 1000 * 60 * 60 * 36; // 36 hours
    saveWorkspaceState();
  }

  function saveWorkspaceState() {
    const stateObj = { ideas, tasks, milestones, submissionItems, messages, countdownTargetTime };
    localStorage.setItem('hf_workspace_state_v1', JSON.stringify(stateObj));
  }

  // Setup Tabs switching
  function setupTabNavigation() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
      });
    });
  }

  // Setup live countdown ticks
  function setupCountdownClock() {
    function updateDigits() {
      const diff = countdownTargetTime - Date.now();
      if (diff <= 0) {
        daysDigit.textContent = '00';
        hoursDigit.textContent = '00';
        minutesDigit.textContent = '00';
        secondsDigit.textContent = '00';
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      daysDigit.textContent = d.toString().padStart(2, '0');
      hoursDigit.textContent = h.toString().padStart(2, '0');
      minutesDigit.textContent = m.toString().padStart(2, '0');
      secondsDigit.textContent = s.toString().padStart(2, '0');
    }

    updateDigits();
    setInterval(updateDigits, 1000);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    themeToggleBtn.addEventListener('click', toggleTheme);
    btnResetWorkspace.addEventListener('click', resetWorkspace);

    // Ideas Propose trigger Modals
    btnAddIdea.addEventListener('click', () => {
      ideaTitleInput.value = '';
      ideaDescInput.value = '';
      modalIdea.classList.add('active');
    });

    btnModalCloseIdea.addEventListener('click', () => modalIdea.classList.remove('active'));
    btnModalCancelIdea.addEventListener('click', () => modalIdea.classList.remove('active'));
    btnModalSaveIdea.addEventListener('click', addIdeaConcept);

    // Kanban Tasks create trigger Modals
    btnAddTask.addEventListener('click', () => {
      taskTitleInput.value = '';
      taskDeadline.value = new Date().toISOString().split('T')[0];
      taskAssignee.selectedIndex = 0;
      taskPriority.selectedIndex = 1;
      taskStatus.selectedIndex = 0;
      modalTask.classList.add('active');
    });

    btnModalCloseTask.addEventListener('click', () => modalTask.classList.remove('active'));
    btnModalCancelTask.addEventListener('click', () => modalTask.classList.remove('active'));
    btnModalSaveTask.addEventListener('click', addKanbanTask);

    // Call simulated conferences triggers
    btnLaunchCall.addEventListener('click', () => modalVideoCall.classList.add('active'));
    btnModalCloseVideo.addEventListener('click', () => modalVideoCall.classList.remove('active'));
    btnVideoCancel.addEventListener('click', () => modalVideoCall.classList.remove('active'));
    btnVideoJoin.addEventListener('click', simulateMeetingJoin);

    // Simulated chats actions
    btnChatSend.addEventListener('click', sendChatMessage);
    chatTextInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });

    btnChatFile.addEventListener('click', () => chatFileInput.click());
    chatFileInput.addEventListener('change', simulateFileAttachment);

    // Submit actions
    btnSubmitProject.addEventListener('click', validateAndSubmitProject);

    // Backups
    btnExportBackup.addEventListener('click', exportJSONBackup);
    btnImportTrigger.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importJSONBackup);
  }

  // Clear workspace
  function resetWorkspace() {
    if (confirm('Are you sure you want to reset the current hackathon planner state? Your cards, chats, and ideas will be reset.')) {
      loadDefaultState();
      showToast('Workspace reset complete!', 'rotate-ccw');
      refreshUI();
    }
  }

  // Propose Brainstorming Concept
  function addIdeaConcept() {
    const title = ideaTitleInput.value.trim();
    const desc = ideaDescInput.value.trim();

    if (!title || !desc) {
      alert('Please fill in both the title and the pitch details.');
      return;
    }

    ideas.push({
      id: 'id-' + Date.now(),
      title,
      desc,
      votes: 1,
      voterSet: []
    });

    saveWorkspaceState();
    modalIdea.classList.remove('active');
    showToast('Concept proposed to sandbox!', 'lightbulb');
    refreshUI();
  }

  // Add Kanban Task
  function addKanbanTask() {
    const title = taskTitleInput.value.trim();
    const assignee = taskAssignee.value;
    const priority = taskPriority.value;
    const status = taskStatus.value;
    const deadline = taskDeadline.value;

    if (!title) {
      alert('Please specify a task title.');
      return;
    }

    tasks.push({
      id: 'ts-' + Date.now(),
      title,
      assignee,
      priority,
      status,
      deadline
    });

    saveWorkspaceState();
    modalTask.classList.remove('active');
    showToast('Task added to Kanban Board!');
    refreshUI();
  }

  // Collaborative simulated chat message send
  function sendChatMessage() {
    const text = chatTextInput.value.trim();
    if (!text) return;

    messages.push({
      sender: 'Vishwa (You)',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    chatTextInput.value = '';
    saveWorkspaceState();
    renderChatMessages();
    
    // Scroll chat to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate collaborative Auto-Reply from a teammate
    setTimeout(() => {
      const teammates = ['Saitej', 'Karthik', 'Priyanshi'];
      const randomSender = teammates[Math.floor(Math.random() * teammates.length)];
      const randomReply = SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)];
      
      messages.push({
        sender: randomSender,
        text: randomReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      
      saveWorkspaceState();
      renderChatMessages();
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1200);
  }

  // Simulate file sharing uploader
  function simulateFileAttachment(e) {
    const file = e.target.files[0];
    if (!file) return;

    messages.push({
      sender: 'Vishwa (You)',
      text: `Uploaded attachment: ${file.name}`,
      file: file.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    saveWorkspaceState();
    renderChatMessages();
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatFileInput.value = ''; // clear input
    showToast(`Shared file: ${file.name}`, 'paperclip');
  }

  // Join meeting simulator
  function simulateMeetingJoin() {
    modalVideoCall.classList.remove('active');
    showToast('Video call conference workspace active!', 'video');

    messages.push({
      sender: 'System Notice',
      text: 'Vishwa initiated and joined the conference video room call.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setTimeout(() => {
      messages.push({
        sender: 'Saitej',
        text: 'Joining the video sync room now!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      saveWorkspaceState();
      renderChatMessages();
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1500);
  }

  // Submit checklist requirements logic
  function validateAndSubmitProject() {
    const unchecked = submissionItems.some(i => !i.checked);
    if (unchecked) {
      showToast('Validation failed! Check all submission requirements first.', 'alert-triangle');
      return;
    }

    // Launch success submits mock
    btnSubmitProject.innerHTML = '<i data-lucide="loader" class="animate-spin"></i> <span>Deploying build to Hackathon Portal...</span>';
    if (window.lucide) window.lucide.createIcons(null, btnSubmitProject);

    setTimeout(() => {
      btnSubmitProject.innerHTML = '<i data-lucide="check-circle"></i> <span>Submitted Successfully!</span>';
      btnSubmitProject.className = 'btn btn-success btn-lg w-full';
      if (window.lucide) window.lucide.createIcons(null, btnSubmitProject);

      // System notification
      messages.push({
        sender: 'System Notice',
        text: '🏆 HACKATHON PROJECT PLANNED BUILD DEPLOYED AND SUBMITTED SUCCESSFULLY! Congratulations team!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      saveWorkspaceState();
      showToast('Devpost submission complete! 🏆', 'award');
    }, 2500);
  }

  // Master UI refresh trigger
  function refreshUI() {
    calculateOverallProgress();
    renderMilestones();
    renderBrainstormingIdeas();
    renderKanbanTasks();
    renderTeamRoster();
    renderChatMessages();
    renderSubmissionChecklist();
  }

  // Calculate overall milestone completion score %
  function calculateOverallProgress() {
    const metMilestones = milestones.filter(m => m.completed).length;
    const checkedSubmissions = submissionItems.filter(s => s.checked).length;
    const totalItems = milestones.length + submissionItems.length;

    const rate = totalItems > 0 ? Math.round(((metMilestones + checkedSubmissions) / totalItems) * 100) : 0;
    
    gaugeValue.textContent = `${rate}%`;
    statMilestones.textContent = `${metMilestones} / ${milestones.length}`;
  }

  // Render Milestones Checklist Dashboard
  function renderMilestones() {
    milestonesContainer.innerHTML = '';
    milestones.forEach(item => {
      const row = document.createElement('div');
      row.className = `milestone-item-row ${item.completed ? 'completed' : ''}`;
      
      row.innerHTML = `
        <button class="milestone-checkbox">
          <i data-lucide="check" style="display: ${item.completed ? 'inline' : 'none'};"></i>
        </button>
        <div class="milestone-info">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.desc)}</p>
        </div>
      `;

      // Click checkbox toggles completion
      row.querySelector('.milestone-checkbox').addEventListener('click', () => {
        item.completed = !item.completed;
        saveWorkspaceState();
        refreshUI();
      });

      milestonesContainer.appendChild(row);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, milestonesContainer);
    }
  }

  // Render Brainstorm concepts
  function renderBrainstormingIdeas() {
    ideasGrid.innerHTML = '';
    
    if (ideas.length === 0) {
      ideasEmpty.style.display = 'flex';
      return;
    } else {
      ideasEmpty.style.display = 'none';
    }

    // Sort concepts based on votes (descending)
    ideas.sort((a, b) => b.votes - a.votes);

    ideas.forEach(idea => {
      const card = document.createElement('div');
      card.className = 'idea-card';
      
      card.innerHTML = `
        <div class="idea-card-header">
          <h4>${escapeHtml(idea.title)}</h4>
          <button class="btn-idea-delete" title="Delete Concept">&times;</button>
        </div>
        <p class="idea-desc">${escapeHtml(idea.desc)}</p>
        <div class="idea-card-footer">
          <button class="idea-vote-btn" title="Vote Concept">
            <i data-lucide="thumbs-up"></i>
            <span>Votes: ${idea.votes}</span>
          </button>
        </div>
      `;

      // Upvote Idea Concept
      card.querySelector('.idea-vote-btn').addEventListener('click', () => {
        idea.votes += 1;
        saveWorkspaceState();
        refreshUI();
      });

      // Delete Idea Concept
      card.querySelector('.btn-idea-delete').addEventListener('click', () => {
        if (confirm(`Delete concept "${idea.title}"?`)) {
          ideas = ideas.filter(i => i.id !== idea.id);
          saveWorkspaceState();
          showToast('Concept deleted.');
          refreshUI();
        }
      });

      ideasGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, ideasGrid);
    }

    statIdeas.textContent = ideas.length;
  }

  // Render Kanban Sprint tasks
  function renderKanbanTasks() {
    tasksTodo.innerHTML = '';
    tasksProgress.innerHTML = '';
    tasksReview.innerHTML = '';
    tasksDone.innerHTML = '';

    const todoList = tasks.filter(t => t.status === 'todo');
    const progressList = tasks.filter(t => t.status === 'progress');
    const reviewList = tasks.filter(t => t.status === 'review');
    const doneList = tasks.filter(t => t.status === 'done');

    // Update column counters
    document.getElementById('count-todo').textContent = todoList.length;
    document.getElementById('count-progress').textContent = progressList.length;
    document.getElementById('count-review').textContent = reviewList.length;
    document.getElementById('count-done').textContent = doneList.length;

    // Aggregate statistics
    statTasks.textContent = `${doneList.length} / ${tasks.length}`;

    // Helper builder for task cards inside lists
    const buildTaskCardHTML = (task) => {
      const el = document.createElement('div');
      el.className = 'task-card';
      
      const member = DEFAULT_TEAM_MEMBERS.find(m => m.id.includes(task.assignee) || m.id === `team-${task.assignee}` || m.name.toLowerCase().includes(task.assignee));
      const initials = member ? member.initials : 'VM';

      el.innerHTML = `
        <div class="task-card-header">
          <span class="task-card-assignee" title="Assigned to ${member ? member.name : task.assignee}">${initials}</span>
          <button class="btn-task-delete" title="Delete Task">
            <i data-lucide="x"></i>
          </button>
        </div>
        <h4>${escapeHtml(task.title)}</h4>
        <div class="task-card-footer">
          <span class="badge badge-${task.priority}">${escapeHtml(task.priority)}</span>
          <div class="task-deadline-badge">
            <i data-lucide="calendar"></i>
            <span>${task.deadline}</span>
          </div>
        </div>
        
        <!-- Status change inline shifter -->
        <select class="task-status-shift mt-2" style="font-size:0.7rem; padding:2px; border-radius:4px; border-color:var(--border-color); background:var(--bg-color); color:var(--text-color);">
          <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
          <option value="progress" ${task.status === 'progress' ? 'selected' : ''}>In Progress</option>
          <option value="review" ${task.status === 'review' ? 'selected' : ''}>In Review</option>
          <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
        </select>
      `;

      // Status selector shifter
      el.querySelector('.task-status-shift').addEventListener('change', (e) => {
        task.status = e.target.value;
        saveWorkspaceState();
        refreshUI();
      });

      // Delete Task
      el.querySelector('.btn-task-delete').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveWorkspaceState();
        showToast('Task deleted');
        refreshUI();
      });

      return el;
    };

    todoList.forEach(t => tasksTodo.appendChild(buildTaskCardHTML(t)));
    progressList.forEach(t => tasksProgress.appendChild(buildTaskCardHTML(t)));
    reviewList.forEach(t => tasksReview.appendChild(buildTaskCardHTML(t)));
    doneList.forEach(t => tasksDone.appendChild(buildTaskCardHTML(t)));

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, document.getElementById('tab-tasks'));
    }
  }

  // Render Team members listing
  function renderTeamRoster() {
    teamRosterContainer.innerHTML = '';
    DEFAULT_TEAM_MEMBERS.forEach(member => {
      const activeTasksCount = tasks.filter(t => (t.assignee === member.id || t.assignee === member.name.toLowerCase().split(' ')[0] || member.id.includes(t.assignee)) && t.status !== 'done').length;

      const card = document.createElement('div');
      card.className = 'team-user-row';
      card.innerHTML = `
        <div class="user-avatar">${member.initials}</div>
        <div class="user-details">
          <h4>${escapeHtml(member.name)}</h4>
          <p>${escapeHtml(member.role)} &nbsp;·&nbsp; <strong class="text-orange">${activeTasksCount} active tasks</strong></p>
        </div>
      `;
      teamRosterContainer.appendChild(card);
    });
  }

  // Render Simulated Chat thread
  function renderChatMessages() {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
      const bubble = document.createElement('div');
      const isSelf = msg.sender === 'Vishwa (You)';
      const isSystem = msg.sender === 'System Notice';

      if (isSystem) {
        bubble.className = 'chat-bubble left';
        bubble.style.backgroundColor = 'var(--clr-purple-light)';
        bubble.style.border = '1px solid var(--clr-purple)';
        bubble.style.color = 'var(--text-color)';
        bubble.style.maxWidth = '95%';
        bubble.innerHTML = `
          <strong class="chat-bubble-sender text-purple">📢 SYSTEM NOTICE</strong>
          <span style="font-weight:600;">${escapeHtml(msg.text)}</span>
          <span class="chat-bubble-time">${msg.time}</span>
        `;
      } else {
        bubble.className = `chat-bubble ${isSelf ? 'right' : 'left'}`;
        
        let attachmentHTML = '';
        if (msg.file) {
          attachmentHTML = `
            <a href="#" class="chat-file-attachment-link" onclick="event.preventDefault(); alert('Simulated File Open: ${escapeHtml(msg.file)}');">
              <i data-lucide="file-text"></i>
              <span>${escapeHtml(msg.file)}</span>
            </a>
          `;
        }

        bubble.innerHTML = `
          <span class="chat-bubble-sender">${escapeHtml(msg.sender)}</span>
          <span>${escapeHtml(msg.text)}</span>
          ${attachmentHTML}
          <span class="chat-bubble-time">${msg.time}</span>
        `;
      }

      chatMessages.appendChild(bubble);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, chatMessages);
    }
  }

  // Render Submission checklists
  function renderSubmissionChecklist() {
    submissionChecklist.innerHTML = '';
    submissionItems.forEach(item => {
      const row = document.createElement('div');
      row.className = `checklist-row ${item.checked ? 'checked' : ''}`;
      
      row.innerHTML = `
        <div class="checklist-box">
          <i data-lucide="check" style="display: ${item.checked ? 'inline' : 'none'};"></i>
        </div>
        <h4>${escapeHtml(item.label)}</h4>
      `;

      // Toggle checklists check mark click
      row.addEventListener('click', () => {
        item.checked = !item.checked;
        saveWorkspaceState();
        refreshUI();
      });

      submissionChecklist.appendChild(row);
    });

    if (window.lucide) {
      window.lucide.createIcons({ attrs: { class: 'lucide-icon' } }, submissionChecklist);
    }
  }

  // Backup: JSON Export
  function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      ideas, tasks, milestones, submissionItems, messages, countdownTargetTime
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `hackflow_backup_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Workspace backup downloaded!', 'download-cloud');
  }

  // Backup: JSON Import
  function importJSONBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported && Array.isArray(imported.tasks) && Array.isArray(imported.ideas)) {
          ideas = imported.ideas;
          tasks = imported.tasks;
          milestones = imported.milestones || DEFAULT_MILESTONES;
          submissionItems = imported.submissionItems || DEFAULT_SUBMISSION_ITEMS;
          messages = imported.messages || INITIAL_MESSAGES;
          countdownTargetTime = imported.countdownTargetTime || Date.now() + 1000 * 60 * 60 * 36;
          
          saveWorkspaceState();
          showToast('Workspace backup restored!', 'upload-cloud');
          refreshUI();
        } else {
          alert('JSON validation failed. Backup must contain ideas and tasks list fields.');
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
