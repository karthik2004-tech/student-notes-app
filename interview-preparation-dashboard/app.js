/**
 * ==========================================================================
 * AURAPREP - INTERACTIVE INTERVIEW DASHBOARD CLIENT ENGINE
 * ==========================================================================
 */

// DSA topics list configurations
const DSA_TOPICS = [
    "Arrays",
    "Strings",
    "Linked Lists",
    "Stacks & Queues",
    "Trees",
    "Graphs",
    "Dynamic Programming",
    "Others"
];

// Checklist items configurations
const CHECKLISTS_DB = {
    resume: [
        { key: 'ats_keywords', label: 'ATS keywords aligned to job description' },
        { key: 'project_star', label: 'Projects framed using STAR results format' },
        { key: 'experience_detail', label: 'Detailed experience highlights & tech metrics' },
        { key: 'formatting', label: 'Clean single page formatting and fonts' },
        { key: 'links_valid', label: 'Valid GitHub, Portfolio, & LinkedIn links' },
        { key: 'skills_section', label: 'Clearly demarcated core skills tagging' }
    ],
    technical: [
        { key: 'os_basics', label: 'Operating Systems (Processes, Semaphores, Threading)' },
        { key: 'dbms_joins', label: 'DBMS (SQL query structure, normalizations, indices)' },
        { key: 'cn_layers', label: 'Computer Networks (TCP/IP stacks, DNS routing, HTTP)' },
        { key: 'oops_poly', label: 'OOPs concepts (Polymorphism, abstractions, classes)' },
        { key: 'sys_design', label: 'System Design fundamentals (Caching, scaling, load balancers)' },
        { key: 'sdlc_agile', label: 'Software Development Life Cycles (Agile, Git branching)' }
    ],
    behavioral: [
        { key: 'tell_me', label: '"Tell me about yourself" pitch refined' },
        { key: 'star_failures', label: 'STAR scenario: Overcoming a technical failure' },
        { key: 'star_conflict', label: 'STAR scenario: Resolving team conflicts' },
        { key: 'strengths_weak', label: 'Refined Strengths and weaknesses discussion parameters' },
        { key: 'why_company', label: '"Why should we hire you?" company research' },
        { key: 'questions_ask', label: 'Prepared smart questions to ask the interviewer' }
    ]
};

// Global State
const state = {
    users: JSON.parse(localStorage.getItem('aura_prep_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('aura_prep_current_user')) || null,
    dsa: JSON.parse(localStorage.getItem('aura_prep_dsa')) || [],
    aptitude: JSON.parse(localStorage.getItem('aura_prep_aptitude')) || [],
    checklists: JSON.parse(localStorage.getItem('aura_prep_checklists')) || [] // {email, type, key, completed}
};

const GUEST_EMAIL = "guest@auraprep.com";

// Chart instances
let dsaChartInstance = null;
let aptitudeChartInstance = null;

// SPA Active Routing
let activeTab = 'dashboard';

/**
 * ==========================================================================
 * STATE SYNC & SEED DATA ENGINE
 * ==========================================================================
 */
function saveState() {
    localStorage.setItem('aura_prep_users', JSON.stringify(state.users));
    localStorage.setItem('aura_prep_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('aura_prep_dsa', JSON.stringify(state.dsa));
    localStorage.setItem('aura_prep_aptitude', JSON.stringify(state.aptitude));
    localStorage.setItem('aura_prep_checklists', JSON.stringify(state.checklists));
}

// Seeds mock preparation profiles instantly to showcase gauges, doughnuts, and line curves beautifully
function seedMockData(email) {
    const today = new Date();

    const mockDSA = [
        { id: 'd1', email, name: 'Reverse Linked List', topic: 'Linked Lists', difficulty: 'Easy', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] },
        { id: 'd2', email, name: 'Two Sum', topic: 'Arrays', difficulty: 'Easy', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] },
        { id: 'd3', email, name: 'Container With Most Water', topic: 'Arrays', difficulty: 'Medium', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] },
        { id: 'd4', email, name: 'Longest Substring Without Repeating Characters', topic: 'Strings', difficulty: 'Medium', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] },
        { id: 'd5', email, name: 'Validate Binary Search Tree', topic: 'Trees', difficulty: 'Medium', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] },
        { id: 'd6', email, name: 'Course Schedule', topic: 'Graphs', difficulty: 'Medium', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] },
        { id: 'd7', email, name: 'Edit Distance', topic: 'Dynamic Programming', difficulty: 'Hard', platform: 'LeetCode', link: 'https://leetcode.com', date: today.toISOString().split('T')[0] }
    ];

    const mockAptitude = [
        { id: 'a1', email, name: 'Mock Test 1 (Quant)', subject: 'Quantitative', score: 65, date: '2026-05-15' },
        { id: 'a2', email, name: 'Mock Test 2 (Logical)', subject: 'Logical', score: 80, date: '2026-05-20' },
        { id: 'a3', email, name: 'Mock Test 3 (Verbal)', subject: 'Verbal', score: 72, date: '2026-05-25' },
        { id: 'a4', email, name: 'AMCAT Quantitative Assessment 1', subject: 'Quantitative', score: 88, date: today.toISOString().split('T')[0] }
    ];

    const mockChecklists = [
        { email, type: 'resume', key: 'ats_keywords', completed: true },
        { email, type: 'resume', key: 'skills_section', completed: true },
        { email, type: 'resume', key: 'formatting', completed: true },
        { email, type: 'technical', key: 'os_basics', completed: true },
        { email, type: 'technical', key: 'oops_poly', completed: true },
        { email, type: 'behavioral', key: 'tell_me', completed: true },
        { email, type: 'behavioral', key: 'questions_ask', completed: true }
    ];

    // Seed if empty
    if (!state.dsa.some(d => d.email === email)) {
        state.dsa.push(...mockDSA);
    }
    if (!state.aptitude.some(a => a.email === email)) {
        state.aptitude.push(...mockAptitude);
    }
    if (!state.checklists.some(c => c.email === email)) {
        state.checklists.push(...mockChecklists);
    }

    saveState();
}

/**
 * ==========================================================================
 * TOAST NOTIFICATIONS ENGINE
 * ==========================================================================
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'bx-info-circle';
    if (type === 'success') icon = 'bx-check-circle';
    if (type === 'error') icon = 'bx-error-circle';
    
    toast.innerHTML = `
        <i class='bx ${icon}'></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

/**
 * ==========================================================================
 * SPA ROUTER
 * ==========================================================================
 */
function initRouter() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            switchTab(targetTab);
            document.getElementById('app-sidebar').classList.remove('active');
        });
    });
}

function switchTab(tabName) {
    activeTab = tabName;
    
    // Toggle Active Views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${tabName}-view`);
    if (targetSection) targetSection.classList.add('active');
    
    // Toggle active link CSS class
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-tab') === tabName) {
            link.classList.add('active');
        }
    });

    // Update Header View Title
    const titles = {
        dashboard: 'Preparation Dashboard',
        dsa: 'DSA Syllabus Tracker',
        aptitude: 'Aptitude Assessment Monitor',
        checklist: 'CS Core & Resume Checkpoints'
    };
    document.getElementById('view-title').textContent = titles[tabName] || 'Dashboard';
    
    // Trigger view-specific render updates
    if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'dsa') {
        renderDSATable();
    } else if (tabName === 'aptitude') {
        renderAptitudeTable();
    } else if (tabName === 'checklist') {
        renderChecklistsStack();
    }
}

/**
 * ==========================================================================
 * AUTHENTICATION & GUEST EXPLORE INTECEPTORS
 * ==========================================================================
 */
function initAuth() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Tab switches
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const tabLoginBack = document.getElementById('auth-tab-login-back');
    const tabSignupActive = document.getElementById('auth-tab-signup-active');

    const showLogin = () => {
        document.getElementById('signup-form-wrapper').classList.remove('active');
        document.getElementById('login-form-wrapper').classList.add('active');
    };

    const showSignup = () => {
        document.getElementById('login-form-wrapper').classList.remove('active');
        document.getElementById('signup-form-wrapper').classList.add('active');
    };

    tabLogin.addEventListener('click', showLogin);
    tabSignup.addEventListener('click', showSignup);
    tabLoginBack.addEventListener('click', showLogin);
    tabSignupActive.addEventListener('click', showSignup);

    // Signup submission
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirmPass = document.getElementById('signup-confirm-password').value;

        if (password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }
        if (password !== confirmPass) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        const userExists = state.users.some(u => u.email === email);
        if (userExists) {
            showToast('Email address already registered.', 'error');
            return;
        }

        const newUser = { name, email, password };
        state.users.push(newUser);
        saveState();

        // Seed unique data for the newly registered student
        seedMockData(email);

        showToast('Registration successful! Please log in.', 'success');
        signupForm.reset();
        showLogin();
    });

    // Login submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const user = state.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            showToast('Invalid email or password.', 'error');
            return;
        }

        state.currentUser = { name: user.name, email: user.email };
        saveState();

        showToast(`Welcome back, ${user.name}!`, 'success');
        loginForm.reset();
        closeModal('auth-modal');
        checkAuthSession();
    });

    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentUser = null;
        saveState();
        showToast('Logged out successfully.', 'info');
        checkAuthSession();
    });
}

function promptAuthentication(actionText, detailText) {
    document.getElementById('auth-modal-prompt').textContent = actionText;
    document.getElementById('auth-modal-subprompt').textContent = detailText;
    document.getElementById('auth-modal').classList.add('active');
}

function checkAuthSession() {
    const profileArea = document.getElementById('sidebar-profile-area');
    const guestBanner = document.getElementById('guest-explore-banner');
    const logoutBtn = document.getElementById('logout-btn');

    if (state.currentUser) {
        guestBanner.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        
        const initials = state.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        profileArea.innerHTML = `
            <div class="avatar" id="user-avatar-initials">${initials}</div>
            <div class="profile-info">
                <h4 id="user-profile-name">${state.currentUser.name}</h4>
                <span id="user-profile-email">${state.currentUser.email}</span>
            </div>
        `;
    } else {
        guestBanner.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        
        profileArea.innerHTML = `
            <div class="sidebar-profile-cta">
                <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
                    <div class="avatar" style="background: var(--bg-tertiary); color: var(--text-muted);">
                        <i class='bx bx-user' style="font-size: 20px;"></i>
                    </div>
                    <div class="profile-info">
                        <h4>Guest Scholar</h4>
                        <span>Explore Mode</span>
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm full-width" id="sidebar-signin-btn" style="margin-top: 8px;">
                    <i class='bx bx-log-in'></i> Sign In / Sign Up
                </button>
            </div>
        `;

        document.getElementById('sidebar-signin-btn').addEventListener('click', () => {
            promptAuthentication("Join AuraPrep", "Create a profile to save personal DSA problems logs, mock test scorecard trends, and resume checks progress!");
        });
    }

    switchTab('dashboard');
}

/**
 * ==========================================================================
 * DATA AGGREGATION & INTERVIEW READINESS MATHEMATICS
 * ==========================================================================
 */
function getUserDSA() {
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    return state.dsa.filter(d => d.email === email);
}

function getUserAptitude() {
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    return state.aptitude.filter(a => a.email === email);
}

function getUserChecklists() {
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    return state.checklists.filter(c => c.email === email && c.completed);
}

// readiness calculation engine
function calculateReadiness() {
    const dsa = getUserDSA();
    const aptitude = getUserAptitude();
    const checklists = getUserChecklists();

    // 1. DSA Solved Score (Max 45%, based on solving 30 questions)
    const dsaSolvedCount = dsa.length;
    const dsaWeightScore = Math.min(45, dsaSolvedCount * 1.5); 

    // 2. Aptitude Score (Max 25%, based on average assessment score percentage)
    let aptitudeAvg = 0;
    if (aptitude.length > 0) {
        const sum = aptitude.reduce((acc, a) => acc + parseFloat(a.score), 0);
        aptitudeAvg = sum / aptitude.length;
    }
    const aptitudeWeightScore = (aptitudeAvg / 100) * 25;

    // 3. Checklist Score (Max 30%, based on 18 total checkboxes checked off)
    const checklistCount = checklists.length;
    const checklistWeightScore = Math.min(30, checklistCount * 1.66); 

    const totalReadiness = Math.round(dsaWeightScore + aptitudeWeightScore + checklistWeightScore);
    
    return {
        total: Math.min(100, totalReadiness),
        dsaCount: dsaSolvedCount,
        aptCount: aptitude.length,
        checkCount: checklistCount
    };
}

/**
 * ==========================================================================
 * DASHBOARD RENDER CONTROLLER
 * ==========================================================================
 */
function renderDashboard() {
    const readiness = calculateReadiness();
    const dsa = getUserDSA();

    // Stats Cards
    document.getElementById('readiness-score').textContent = `${readiness.total}%`;
    document.getElementById('dsa-solved-count').textContent = `${readiness.dsaCount} ${readiness.dsaCount === 1 ? 'Question' : 'Questions'}`;
    document.getElementById('aptitude-count').textContent = `${readiness.aptCount} ${readiness.aptCount === 1 ? 'Assessment' : 'Assessments'}`;
    
    const checklistPct = Math.round((readiness.checkCount / 18) * 100);
    document.getElementById('checklist-progress-status').textContent = `${checklistPct}% Done`;

    // DSA Topic completion rows
    const progressContainer = document.getElementById('dashboard-dsa-progress-container');
    progressContainer.innerHTML = '';

    DSA_TOPICS.slice(0, 4).forEach(topic => {
        const topicLogs = dsa.filter(d => d.topic === topic);
        const solved = topicLogs.length;
        const pct = Math.min(100, Math.round((solved / 5) * 100)); // Cap at 5 questions per topic for progress bars
        
        progressContainer.innerHTML += `
            <div class="subject-progress-card">
                <div class="progress-details mb-2">
                    <span class="sub-name">${topic}</span>
                    <span class="sub-percent">${solved} Solved</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill safe" style="width: ${pct}%;"></div>
                </div>
            </div>
        `;
    });

    renderCharts(dsa, getUserAptitude());
}

/**
 * ==========================================================================
 * DYNAMIC CHARTS (CHART.JS)
 * ==========================================================================
 */
function renderCharts(dsa, aptitude) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    // 1. DSA DIFFICULTY DOUGHNUT CHART
    const dsaCtx = document.getElementById('dsaDifficultyChart').getContext('2d');
    if (dsaChartInstance) dsaChartInstance.destroy();

    const diffCounts = { Easy: 0, Medium: 0, Hard: 0 };
    dsa.forEach(d => {
        if (diffCounts[d.difficulty] !== undefined) {
            diffCounts[d.difficulty]++;
        }
    });

    const dsaLabels = Object.keys(diffCounts);
    const dsaData = Object.values(diffCounts);
    const dsaColors = ['#10b981', '#f59e0b', '#ef4444']; // Green, Orange, Red

    if (dsa.length === 0) {
        dsaChartInstance = new Chart(dsaCtx, {
            type: 'doughnut',
            data: {
                labels: ['No Solved Problems Logged'],
                datasets: [{
                    data: [1],
                    backgroundColor: [isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
            }
        });
    } else {
        dsaChartInstance = new Chart(dsaCtx, {
            type: 'doughnut',
            data: {
                labels: dsaLabels,
                datasets: [{
                    data: dsaData,
                    backgroundColor: dsaColors,
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#0c101b' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter' } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Solved: ${context.raw} Problems`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // 2. APTITUDE TEST SCORES TREND
    const aptCtx = document.getElementById('aptitudeTrendChart').getContext('2d');
    if (aptitudeChartInstance) aptitudeChartInstance.destroy();

    // Sort by date ascending
    const sortedApt = [...aptitude].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sortedApt.map(a => `${a.name} (${new Date(a.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})`);
    const data = sortedApt.map(a => a.score);

    aptitudeChartInstance = new Chart(aptCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Score Obtained (%)',
                data: data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#6366f1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Score: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: textColor } },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

/**
 * ==========================================================================
 * DSA PROGRESS TRACKER & PROBLEMS LEDGER CRUD
 * ==========================================================================
 */
function renderDSATable() {
    const listBody = document.getElementById('dsa-list-body');
    const emptyState = document.getElementById('dsa-empty-state');
    const tableEl = document.getElementById('dsa-table');

    const searchVal = document.getElementById('search-dsa').value.trim().toLowerCase();
    const diffVal = document.getElementById('filter-dsa-diff').value;

    let dsa = getUserDSA();

    // Search
    if (searchVal) {
        dsa = dsa.filter(d => 
            d.name.toLowerCase().includes(searchVal) || 
            d.topic.toLowerCase().includes(searchVal) || 
            d.platform.toLowerCase().includes(searchVal)
        );
    }

    // Filter
    if (diffVal !== 'all') {
        dsa = dsa.filter(d => d.difficulty === diffVal);
    }

    // Sort descending by date
    dsa.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Left topic cards render
    const topicsList = document.getElementById('dsa-topics-list');
    topicsList.innerHTML = DSA_TOPICS.map(topic => {
        const solved = dsa.filter(d => d.topic === topic).length;
        const pct = Math.min(100, Math.round((solved / 5) * 100)); // standard topic goal is 5 solved
        
        return `
            <div class="dsa-topic-card">
                <div class="progress-details mb-2">
                    <span class="sub-name">${topic}</span>
                    <span class="sub-percent">${solved} Solved</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill safe" style="width: ${pct}%;"></div>
                </div>
            </div>
        `;
    }).join('');

    if (dsa.length === 0) {
        listBody.innerHTML = '';
        tableEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        tableEl.classList.remove('hidden');

        listBody.innerHTML = dsa.map(d => {
            const diffClass = d.difficulty.toLowerCase();
            return `
                <tr>
                    <td style="font-weight: 600;">${d.name}</td>
                    <td>
                        <span class="dsa-diff-tag ${diffClass}">${d.difficulty}</span>
                    </td>
                    <td>${d.platform}</td>
                    <td>
                        <a href="${d.link || '#'}" target="_blank" class="btn-icon" title="Problem Link">
                            <i class='bx bx-link-external'></i>
                        </a>
                    </td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button class="btn-icon btn-delete btn-delete-dsa" data-id="${d.id}" title="Delete Record">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire delete buttons
        document.querySelectorAll('.btn-delete-dsa').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteDSA(id);
            });
        });
    }
}

function deleteDSA(id) {
    if (!state.currentUser) {
        promptAuthentication("Unlock Problem Deletions", "Log in to delete solved DSA problem logs from your private profile.");
        return;
    }

    if (confirm('Delete this solved DSA problem record?')) {
        state.dsa = state.dsa.filter(d => d.id !== id);
        saveState();
        showToast('DSA problem record deleted.', 'success');
        
        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'dsa') renderDSATable();
    }
}

function initDSAFilters() {
    const searchInput = document.getElementById('search-dsa');
    const filterDiff = document.getElementById('filter-dsa-diff');

    searchInput.addEventListener('input', () => renderDSATable());
    filterDiff.addEventListener('change', () => renderDSATable());
}

function initDSAForm() {
    const form = document.getElementById('dsa-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!state.currentUser) {
            closeModal('dsa-modal');
            promptAuthentication("Log DSA Solved Question", "Register a profile to log your private problems database and calculate interview scores!");
            return;
        }

        const name = document.getElementById('d-name').value.trim();
        const topic = document.getElementById('d-topic').value;
        const difficulty = document.getElementById('d-diff').value;
        const platform = document.getElementById('d-platform').value.trim();
        const link = document.getElementById('d-link').value.trim();
        const email = state.currentUser.email;

        const newProblem = {
            id: 'dsa_' + Date.now(),
            email,
            name,
            topic,
            difficulty,
            platform,
            link,
            date: new Date().toISOString().split('T')[0]
        };

        state.dsa.push(newProblem);
        saveState();
        showToast(`Problem "${name}" logged successfully!`, 'success');
        
        form.reset();
        closeModal('dsa-modal');

        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'dsa') renderDSATable();
    });
}

/**
 * ==========================================================================
 * APTITUDE PROGRESS MONITOR RENDER & CRUD
 * ==========================================================================
 */
function renderAptitudeTable() {
    const listBody = document.getElementById('apt-list-body');
    const emptyState = document.getElementById('apt-empty-state');
    const tableEl = document.getElementById('apt-table');

    const aptitude = getUserAptitude();

    // Group progress bars by Quantitative, Logical, Verbal averages
    const averages = { Quantitative: 0, Logical: 0, Verbal: 0 };
    const counts = { Quantitative: 0, Logical: 0, Verbal: 0 };

    aptitude.forEach(a => {
        if (averages[a.subject] !== undefined) {
            averages[a.subject] += parseFloat(a.score);
            counts[a.subject]++;
        }
    });

    // Render left aptitude bars
    const quantPct = counts.Quantitative > 0 ? Math.round(averages.Quantitative / counts.Quantitative) : 0;
    document.getElementById('quant-percentage').textContent = `${quantPct}% Avg`;
    document.getElementById('quant-fill').style.width = `${quantPct}%`;

    const logicalPct = counts.Logical > 0 ? Math.round(averages.Logical / counts.Logical) : 0;
    document.getElementById('logical-percentage').textContent = `${logicalPct}% Avg`;
    document.getElementById('logical-fill').style.width = `${logicalPct}%`;

    const verbalPct = counts.Verbal > 0 ? Math.round(averages.Verbal / counts.Verbal) : 0;
    document.getElementById('verbal-percentage').textContent = `${verbalPct}% Avg`;
    document.getElementById('verbal-fill').style.width = `${verbalPct}%`;

    if (aptitude.length === 0) {
        listBody.innerHTML = '';
        tableEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        tableEl.classList.remove('hidden');

        // Sort by date desc
        aptitude.sort((a, b) => new Date(b.date) - new Date(a.date));

        listBody.innerHTML = aptitude.map(a => {
            const prettyDate = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            let color = 'safe';
            if (a.score < 50) color = 'danger';
            else if (a.score < 75) color = 'warning';

            return `
                <tr>
                    <td style="font-weight: 600;">${a.name}</td>
                    <td>${a.subject} Aptitude</td>
                    <td>${prettyDate}</td>
                    <td class="text-right"><span class="budget-alert-badge ${color}">${a.score}%</span></td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button class="btn-icon btn-delete btn-delete-apt" data-id="${a.id}" title="Delete Record">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire delete buttons
        document.querySelectorAll('.btn-delete-apt').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteAptitude(id);
            });
        });
    }
}

function deleteAptitude(id) {
    if (!state.currentUser) {
        promptAuthentication("Unlock Scorecard Deletions", "Log in to delete mock assessment scores from your private scorecard.");
        return;
    }

    if (confirm('Delete this assessment record?')) {
        state.aptitude = state.aptitude.filter(a => a.id !== id);
        saveState();
        showToast('Assessment scorecard record deleted.', 'success');
        
        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'aptitude') renderAptitudeTable();
    }
}

function initAptitudeForm() {
    const form = document.getElementById('apt-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!state.currentUser) {
            closeModal('apt-modal');
            promptAuthentication("Log Assessment Score", "Register a profile to log Quantitative and Verbal scorecard data and track preparation indices!");
            return;
        }

        const name = document.getElementById('a-name').value.trim();
        const subject = document.getElementById('a-subject').value;
        const score = parseFloat(document.getElementById('a-score').value);
        const email = state.currentUser.email;

        const newScore = {
            id: 'apt_' + Date.now(),
            email,
            name,
            subject,
            score,
            date: new Date().toISOString().split('T')[0]
        };

        state.aptitude.push(newScore);
        saveState();
        showToast(`Scorecard "${name}" added.`, 'success');
        
        form.reset();
        closeModal('apt-modal');

        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'aptitude') renderAptitudeTable();
    });
}

/**
 * ==========================================================================
 * PREPARATION CHECKLISTS & RESUME BOARDS
 * ==========================================================================
 */
function renderChecklistsStack() {
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    const completedList = state.checklists.filter(c => c.email === email && c.completed).map(c => c.key);

    const renderStack = (type, containerId) => {
        const container = document.getElementById(containerId);
        container.innerHTML = CHECKLISTS_DB[type].map(item => {
            const isChecked = completedList.includes(item.key) ? 'checked' : '';
            return `
                <label class="check-item-row">
                    <input type="checkbox" class="checklist-trigger" data-type="${type}" data-key="${item.key}" ${isChecked}>
                    <span class="check-label-text">${item.label}</span>
                </label>
            `;
        }).join('');
    };

    renderStack('resume', 'resume-checklist-stack');
    renderStack('technical', 'technical-checklist-stack');
    renderStack('behavioral', 'behavioral-checklist-stack');

    // Wire up checklist events triggers
    document.querySelectorAll('.checklist-trigger').forEach(box => {
        box.addEventListener('change', (e) => {
            const type = box.getAttribute('data-type');
            const key = box.getAttribute('data-key');
            
            // Guest Interceptor on checklists
            if (!state.currentUser) {
                e.preventDefault();
                box.checked = !box.checked; // Reset checkbox state visually
                promptAuthentication("Save Checklist Progress", "Join AuraPrep to save resume ATS checks, behavioral preparation parameters, and CS corefundamentals checklists!");
                return;
            }

            const email = state.currentUser.email;
            
            if (box.checked) {
                // Add completion
                const exists = state.checklists.some(c => c.email === email && c.type === type && c.key === key);
                if (!exists) {
                    state.checklists.push({ email, type, key, completed: true });
                }
            } else {
                // Remove completion
                state.checklists = state.checklists.filter(c => !(c.email === email && c.type === type && c.key === key));
            }

            saveState();
            showToast('Checklist state saved.', 'success');
        });
    });
}

/**
 * ==========================================================================
 * CONTROLS & INTERFACE THEME RIGS
 * ==========================================================================
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('aura_prep_theme', newTheme);

    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) themeSwitch.checked = (newTheme === 'dark');

    const compactIcon = document.querySelector('.theme-toggle-compact i');
    if (compactIcon) {
        compactIcon.className = newTheme === 'dark' ? 'bx bx-moon theme-icon' : 'bx bx-sun theme-icon';
    }

    renderCharts(getUserDSA(), getUserAptitude());
}

function initTheme() {
    const savedTheme = localStorage.getItem('aura_prep_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = (savedTheme === 'dark');
        themeSwitch.addEventListener('change', toggleTheme);
    }
}

function initModals() {
    document.getElementById('quick-dsa-btn').addEventListener('click', () => {
        if (!state.currentUser) {
            promptAuthentication("Log DSA Solved Question", "Register a profile to log your private problems database and calculate interview scores!");
            return;
        }
        document.getElementById('dsa-modal').classList.add('active');
    });

    document.getElementById('quick-apt-btn').addEventListener('click', () => {
        if (!state.currentUser) {
            promptAuthentication("Log Assessment Score", "Register a profile to log Quantitative and Verbal scorecard data and track preparation indices!");
            return;
        }
        document.getElementById('apt-modal').classList.add('active');
    });

    document.getElementById('close-dsa-modal').addEventListener('click', () => closeModal('dsa-modal'));
    document.getElementById('cancel-dsa-modal').addEventListener('click', () => closeModal('dsa-modal'));
    
    document.getElementById('close-apt-modal').addEventListener('click', () => closeModal('apt-modal'));
    document.getElementById('cancel-apt-modal').addEventListener('click', () => closeModal('apt-modal'));

    document.getElementById('close-auth-modal').addEventListener('click', () => closeModal('auth-modal'));

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target.id);
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function initMobileMenu() {
    const trigger = document.getElementById('mobile-menu-trigger');
    const closeBtn = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('app-sidebar');

    trigger.addEventListener('click', () => {
        sidebar.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });
}

/**
 * ==========================================================================
 * INITIALIZATION ENTRY POINT
 * ==========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // Seed Guest Mock Data instantly
    seedMockData(GUEST_EMAIL);

    initTheme();
    initRouter();
    initAuth();
    initDSAForm();
    initAptitudeForm();
    initDSAFilters();
    initModals();
    initMobileMenu();

    // Setup Dynamic Date String
    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    document.getElementById('header-date').textContent = dateStr;

    // Join CTA on Explore Banner
    document.getElementById('guest-join-btn').addEventListener('click', () => {
        promptAuthentication("Join AuraPrep", "Create a profile to save personal DSA problems logs, mock test scorecard trends, and resume checks progress!");
    });

    // Check sessions
    checkAuthSession();
});
