/**
 * ==========================================================================
 * AURASTUDY - INTERACTIVE STREAK & ANALYTICS CLIENT CORE
 * ==========================================================================
 */

// Subject categories configuration
const SUBJECTS = {
    Coding: { color: '#a855f7', icon: 'bx-code-alt' },
    Math: { color: '#3b82f6', icon: 'bx-calculator' },
    Science: { color: '#10b981', icon: 'bx-atom' },
    Languages: { color: '#f97316', icon: 'bx-globe' },
    Writing: { color: '#ec4899', icon: 'bx-edit-alt' },
    Others: { color: '#64748b', icon: 'bx-grid-alt' }
};

// Gamified Achievement Badges Config
const BADGES_DB = [
    { id: 'first_step', title: 'First Step', desc: 'Log your first study session', icon: 'bx-rocket' },
    { id: 'consistency_3', title: 'Consistency Builder', desc: 'Maintain a 3-day study streak', icon: 'bx-calendar-star' },
    { id: 'consistency_7', title: 'Streak Master', desc: 'Maintain a 7-day study streak', icon: 'bx-trophy' },
    { id: 'consistency_14', title: 'Habit Hero', desc: 'Maintain a 14-day study streak', icon: 'bx-medal' },
    { id: 'total_time_10h', title: 'Elite Scholar', desc: 'Study for over 10 hours (600 mins) total', icon: 'bx-book-reader' },
    { id: 'polymath', title: 'Polymath', desc: 'Log study sessions in 4 or more subjects', icon: 'bx-palette' }
];

// Global State object
const state = {
    users: JSON.parse(localStorage.getItem('aura_study_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('aura_study_current_user')) || null,
    logs: JSON.parse(localStorage.getItem('aura_study_logs')) || [],
    goals: JSON.parse(localStorage.getItem('aura_study_goals')) || [] // {email, dailyTarget, weeklyTarget}
};

const GUEST_EMAIL = "guest@aurastudy.com";

// Chart instances
let weeklyTrendChartInstance = null;
let subjectBreakdownChartInstance = null;

// Routing State
let activeTab = 'dashboard';

/**
 * ==========================================================================
 * STATE STORAGE & MOCK DATA SEEDER
 * ==========================================================================
 */
function saveState() {
    localStorage.setItem('aura_study_users', JSON.stringify(state.users));
    localStorage.setItem('aura_study_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('aura_study_logs', JSON.stringify(state.logs));
    localStorage.setItem('aura_study_goals', JSON.stringify(state.goals));
}

// Seeds realistic logs to build a gorgeous contribution heatmap and charts instantly for the Guest
function seedMockLogs(email) {
    const today = new Date();
    const mockLogs = [];
    
    const subs = ['Coding', 'Math', 'Science', 'Languages', 'Writing', 'Others'];
    const notes = [
        'Solved Leetcode medium dynamic programming problems',
        'Calculus chain rule assignments homework',
        'Organic chemistry laboratory session',
        'Spanish irregular verbs practice',
        'Drafted essay on industrial revolution',
        'Productivity research paper summary'
    ];

    // Seed continuous chain of last 6 days including today to build a live active streak!
    for (let i = 0; i <= 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        mockLogs.push({
            id: 'm_' + i + '_' + Date.now(),
            email,
            subject: subs[i % subs.length],
            duration: 45 + (i * 15), 
            date: dateStr,
            note: notes[i % notes.length]
        });
    }

    // Seed additional scattered study dates over the past 30 days
    const scatteredOffsets = [8, 9, 11, 12, 13, 15, 17, 18, 20, 22, 25, 26, 28];
    scatteredOffsets.forEach((offset, idx) => {
        const d = new Date(today);
        d.setDate(today.getDate() - offset);
        const dateStr = d.toISOString().split('T')[0];

        mockLogs.push({
            id: 'm_sc_' + idx + '_' + Date.now(),
            email,
            subject: subs[idx % subs.length],
            duration: 30 + ((idx * 20) % 100),
            date: dateStr,
            note: notes[idx % notes.length]
        });
    });

    // Default goals
    const defaultGoal = { email, dailyTarget: 60, weeklyTarget: 300 };

    // Check if email has logs already
    const hasLogs = state.logs.some(l => l.email === email);
    if (!hasLogs) {
        state.logs.push(...mockLogs);
    }
    
    const hasGoal = state.goals.some(g => g.email === email);
    if (!hasGoal) {
        state.goals.push(defaultGoal);
    }
    
    saveState();
}

/**
 * ==========================================================================
 * TOAST NOTIFICATION ENGINE
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
        dashboard: 'Study Habit Dashboard',
        ledger: 'Study Ledger Records',
        badges: 'Gamified Achievements Shelf'
    };
    document.getElementById('view-title').textContent = titles[tabName] || 'Dashboard';
    
    // Trigger view-specific render updates
    if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'ledger') {
        renderLogsTable();
    } else if (tabName === 'badges') {
        renderBadgesShelf();
    }
}

/**
 * ==========================================================================
 * MULTI-USER AUTHENTICATION & GUEST EXPLORE MODE INTERCEPTORS
 * ==========================================================================
 */
function initAuth() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Tab toggling inside Auth Modal overlay
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
        seedMockLogs(email);

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

// Opens the login modal overlay with contextual message alerts
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
        // Logged-in session layout
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
        // Guest mode layout
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

        // Wire sidebar prompt
        document.getElementById('sidebar-signin-btn').addEventListener('click', () => {
            promptAuthentication("Join AuraStudy", "Create a profile to save personal study sessions, customize habit goals, and claim badges!");
        });
    }

    switchTab('dashboard');
}

/**
 * ==========================================================================
 * DATA AGGREGATION & STREAK MATH ENGINE
 * ==========================================================================
 */
function getUserLogs() {
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    return state.logs.filter(l => l.email === email);
}

function getUserGoals() {
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    const goal = state.goals.find(g => g.email === email);
    return goal || { dailyTarget: 60, weeklyTarget: 300 };
}

// Streak walk-back logic
function calculateStreak() {
    const logs = getUserLogs();
    if (logs.length === 0) return { current: 0, longest: 0 };

    const uniqueDates = [...new Set(logs.map(l => l.date))];
    uniqueDates.sort((a, b) => new Date(a) - new Date(b));

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;
    
    let checkDate = null;
    if (uniqueDates.includes(todayStr)) {
        checkDate = today;
    } else if (uniqueDates.includes(yesterdayStr)) {
        checkDate = yesterday;
    }

    if (checkDate) {
        currentStreak = 1;
        let walkDate = new Date(checkDate);
        
        while (true) {
            walkDate.setDate(walkDate.getDate() - 1);
            const walkDateStr = walkDate.toISOString().split('T')[0];
            
            if (uniqueDates.includes(walkDateStr)) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Longest streak calculation
    let longestStreak = 0;
    if (uniqueDates.length > 0) {
        let currentChain = 1;
        longestStreak = 1;
        
        for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1]);
            const curr = new Date(uniqueDates[i]);
            
            const diffTime = Math.abs(curr - prev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                currentChain++;
            } else if (diffDays > 1) {
                currentChain = 1;
            }
            if (currentChain > longestStreak) {
                longestStreak = currentChain;
            }
        }
    }

    return {
        current: currentStreak,
        longest: longestStreak
    };
}

function formatMinutes(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

/**
 * ==========================================================================
 * DASHBOARD RENDER CONTROLLER
 * ==========================================================================
 */
function renderDashboard() {
    const logs = getUserLogs();
    const streaks = calculateStreak();
    const goals = getUserGoals();

    // 1. Render Stats
    document.getElementById('current-streak').textContent = `${streaks.current} ${streaks.current === 1 ? 'Day' : 'Days'}`;
    document.getElementById('longest-streak').textContent = `${streaks.longest} ${streaks.longest === 1 ? 'Day' : 'Days'}`;

    const totalMinutes = logs.reduce((sum, l) => sum + parseFloat(l.duration), 0);
    document.getElementById('total-hours').textContent = formatMinutes(totalMinutes);

    // 2. Goal progress calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === todayStr);
    const todayMinutes = todayLogs.reduce((sum, l) => sum + parseFloat(l.duration), 0);
    const goalPercent = Math.min(Math.round((todayMinutes / goals.dailyTarget) * 100), 100);

    const goalStatus = document.getElementById('daily-goal-status');
    goalStatus.textContent = `${goalPercent}% Done`;
    if (goalPercent >= 100) {
        goalStatus.className = 'budget-alert-badge safe';
    } else if (goalPercent >= 50) {
        goalStatus.className = 'budget-alert-badge warning';
    } else {
        goalStatus.className = 'budget-alert-badge danger';
    }

    // 3. Contribution Heatmap grid generation
    renderHeatmap(logs);

    // 4. Progress Charts
    renderAnalyticsCharts(logs);

    // 5. Silent badge awards checker
    checkBadgeUnlocks();
}

/**
 * ==========================================================================
 * GITHUB-STYLE HEATMAP GENERATOR ALGORITHM
 * ==========================================================================
 */
function renderHeatmap(logs) {
    const grid = document.getElementById('study-heatmap-grid');
    grid.innerHTML = '';

    const today = new Date();
    const datesMap = {};
    
    logs.forEach(l => {
        datesMap[l.date] = (datesMap[l.date] || 0) + parseFloat(l.duration);
    });

    const daysRange = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83); 

    const dayOfWeek = startDate.getDay(); 
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
    startDate.setDate(startDate.getDate() - offset);

    const totalGridDays = 84; 
    
    for (let i = 0; i < totalGridDays; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        daysRange.push(d);
    }

    grid.innerHTML = daysRange.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const minutes = datesMap[dateStr] || 0;
        
        let level = 0;
        if (minutes > 0 && minutes <= 30) level = 1;
        else if (minutes > 30 && minutes <= 60) level = 2;
        else if (minutes > 60 && minutes <= 120) level = 3;
        else if (minutes > 120) level = 4;

        const prettyDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const tooltipText = `${prettyDate}: ${minutes} mins focused`;

        return `
            <div class="heatmap-cell level-${level}" data-tooltip="${tooltipText}"></div>
        `;
    }).join('');
}

/**
 * ==========================================================================
 * ANALYTICS DASHBOARDS (CHART.JS)
 * ==========================================================================
 */
function renderAnalyticsCharts(logs) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    // 1. Weekly Study trends bar chart (Past 7 days)
    const trendCtx = document.getElementById('weeklyTrendChart').getContext('2d');
    if (weeklyTrendChartInstance) weeklyTrendChartInstance.destroy();

    const daysName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    const currentDay = today.getDay(); 
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const weeklyMins = Array(7).fill(0);
    const dateLabels = Array(7).fill('');

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        dateLabels[i] = `${daysName[i]} (${d.getDate()})`;
        
        const dayLogs = logs.filter(l => l.date === dateStr);
        weeklyMins[i] = dayLogs.reduce((sum, l) => sum + parseFloat(l.duration), 0);
    }

    weeklyTrendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
            labels: dateLabels,
            datasets: [{
                label: 'Minutes Focused',
                data: weeklyMins,
                backgroundColor: 'rgba(168, 85, 247, 0.45)',
                borderColor: '#a855f7',
                borderWidth: 2,
                borderRadius: 4
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
                            return ` Focused: ${formatMinutes(context.raw)}`;
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
                            return value + 'm';
                        }
                    }
                }
            }
        }
    });

    // 2. Subject Breakdown Doughnut Chart
    const subjectCtx = document.getElementById('subjectBreakdownChart').getContext('2d');
    if (subjectBreakdownChartInstance) subjectBreakdownChartInstance.destroy();

    const subjectTotals = {};
    logs.forEach(l => {
        subjectTotals[l.subject] = (subjectTotals[l.subject] || 0) + parseFloat(l.duration);
    });

    const labels = Object.keys(subjectTotals);
    const data = Object.values(subjectTotals);
    const colors = labels.map(sub => (SUBJECTS[sub] || { color: '#64748b' }).color);

    if (data.length === 0) {
        subjectBreakdownChartInstance = new Chart(subjectCtx, {
            type: 'doughnut',
            data: {
                labels: ['No Activity Logged'],
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
        subjectBreakdownChartInstance = new Chart(subjectCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#0d1222' : '#ffffff'
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
                                return ` Focused: ${formatMinutes(context.raw)}`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

/**
 * ==========================================================================
 * STUDY LOGS CRUD LEDGER
 * ==========================================================================
 */
function renderLogsTable() {
    const listBody = document.getElementById('logs-list-body');
    const emptyState = document.getElementById('table-empty-state');
    const tableEl = document.getElementById('logs-table');

    const searchVal = document.getElementById('search-logs').value.trim().toLowerCase();
    const subjectVal = document.getElementById('filter-subject').value;
    const sortVal = document.getElementById('sort-logs').value;

    let logs = getUserLogs();

    // 1. Search notes/descriptions
    if (searchVal) {
        logs = logs.filter(l => 
            l.subject.toLowerCase().includes(searchVal) || 
            (l.note && l.note.toLowerCase().includes(searchVal))
        );
    }

    // 2. Filter Subject
    if (subjectVal !== 'all') {
        logs = logs.filter(l => l.subject === subjectVal);
    }

    // 3. Sort Order
    if (sortVal === 'date-desc') {
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortVal === 'date-asc') {
        logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortVal === 'duration-desc') {
        logs.sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration));
    } else if (sortVal === 'duration-asc') {
        logs.sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration));
    }

    if (logs.length === 0) {
        listBody.innerHTML = '';
        tableEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        tableEl.classList.remove('hidden');

        listBody.innerHTML = logs.map(l => {
            const subInfo = SUBJECTS[l.subject] || { icon: 'bx-grid-alt', color: '#64748b' };
            const prettyDate = new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return `
                <tr>
                    <td>${prettyDate}</td>
                    <td>
                        <span style="display: inline-flex; align-items: center; gap: 8px;">
                            <i class='bx ${subInfo.icon}' style="color: ${subInfo.color}; font-size: 18px;"></i>
                            ${l.subject}
                        </span>
                    </td>
                    <td class="amount">${formatMinutes(l.duration)}</td>
                    <td>
                        <div style="font-weight: 500;">${l.note || '—'}</div>
                    </td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button class="btn-icon btn-delete btn-delete-log" data-id="${l.id}" title="Delete Record">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire delete buttons
        document.querySelectorAll('.btn-delete-log').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteLog(id);
            });
        });
    }
}

function initFilters() {
    const searchInput = document.getElementById('search-logs');
    const filterSubject = document.getElementById('filter-subject');
    const sortLogs = document.getElementById('sort-logs');

    const updateTrigger = () => renderLogsTable();

    searchInput.addEventListener('input', updateTrigger);
    filterSubject.addEventListener('change', updateTrigger);
    sortLogs.addEventListener('change', updateTrigger);
}

function deleteLog(logId) {
    // Guest Action Interceptor
    if (!state.currentUser) {
        promptAuthentication("Unlock Logs Management", "Authenticating allows you to edit or delete logged sessions securely.");
        return;
    }

    if (confirm('Delete this study session record? This could affect your streak calculations.')) {
        state.logs = state.logs.filter(l => l.id !== logId);
        saveState();
        showToast('Study session deleted.', 'success');
        
        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'ledger') renderLogsTable();
    }
}

function initLogsForm() {
    const form = document.getElementById('log-form');
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('l-date').value = today;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Guest Action Interceptor
        if (!state.currentUser) {
            closeModal('log-modal');
            promptAuthentication("Save Study Session", "Sign up to log customized study sessions and build your habit streaks!");
            return;
        }

        const subject = document.getElementById('l-subject').value;
        const duration = parseFloat(document.getElementById('l-duration').value);
        const date = document.getElementById('l-date').value;
        const note = document.getElementById('l-note').value.trim();
        const email = state.currentUser.email;

        const newLog = {
            id: 'log_' + Date.now(),
            email,
            subject,
            duration,
            date,
            note
        };

        state.logs.push(newLog);
        saveState();
        
        showToast(`Logged ${duration} minutes in ${subject}!`, 'success');
        
        form.reset();
        document.getElementById('l-date').value = today;
        closeModal('log-modal');

        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'ledger') renderLogsTable();
    });
}

/**
 * ==========================================================================
 * GAMIFIED ACHIEVEMENTS BADGE AWARDS LISTENER
 * ==========================================================================
 */
function checkBadgeUnlocks() {
    const logs = getUserLogs();
    const streaks = calculateStreak();
    
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    const unlockedList = JSON.parse(localStorage.getItem(`aura_unlocked_badges_${email}`)) || [];
    let updated = false;

    BADGES_DB.forEach(badge => {
        if (unlockedList.includes(badge.id)) return;

        let pass = false;
        
        if (badge.id === 'first_step') {
            pass = logs.length >= 1;
        } else if (badge.id === 'consistency_3') {
            pass = streaks.current >= 3;
        } else if (badge.id === 'consistency_7') {
            pass = streaks.current >= 7;
        } else if (badge.id === 'consistency_14') {
            pass = streaks.current >= 14;
        } else if (badge.id === 'total_time_10h') {
            const sum = logs.reduce((acc, l) => acc + parseFloat(l.duration), 0);
            pass = sum >= 600; 
        } else if (badge.id === 'polymath') {
            const count = new Set(logs.map(l => l.subject)).size;
            pass = count >= 4;
        }

        if (pass) {
            unlockedList.push(badge.id);
            // Only trigger toast for registered users
            if (state.currentUser) {
                showToast(`🏆 ACHIEVEMENT UNLOCKED: "${badge.title}"!`, 'success');
            }
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem(`aura_unlocked_badges_${email}`, JSON.stringify(unlockedList));
    }
}

function renderBadgesShelf() {
    const container = document.getElementById('badges-shelf-container');
    const email = state.currentUser ? state.currentUser.email : GUEST_EMAIL;
    const unlockedList = JSON.parse(localStorage.getItem(`aura_unlocked_badges_${email}`)) || [];

    container.innerHTML = BADGES_DB.map(badge => {
        const isUnlocked = unlockedList.includes(badge.id);
        const cardClass = isUnlocked ? 'badge-card glass unlocked' : 'badge-card glass locked';

        return `
            <div class="${cardClass}">
                <div class="badge-icon-box">
                    <i class='bx ${badge.icon}'></i>
                </div>
                <h4>${badge.title}</h4>
                <p class="badge-desc">${badge.desc}</p>
            </div>
        `;
    }).join('');
}

/**
 * ==========================================================================
 * GOALS CONFIGURATION
 * ==========================================================================
 */
function initGoalsForm() {
    const form = document.getElementById('goal-form');

    document.getElementById('configure-goals-btn').addEventListener('click', () => {
        // Guest Action Interceptor
        if (!state.currentUser) {
            promptAuthentication("Customize Habits Targets", "Create a profile to customize focus goals and track your targets completion rates!");
            return;
        }

        const goals = getUserGoals();
        document.getElementById('g-daily').value = goals.dailyTarget;
        document.getElementById('g-weekly').value = goals.weeklyTarget;
        document.getElementById('goal-modal').classList.add('active');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const dailyTarget = parseInt(document.getElementById('g-daily').value);
        const weeklyTarget = parseInt(document.getElementById('g-weekly').value);
        const email = state.currentUser.email;

        const idx = state.goals.findIndex(g => g.email === email);
        if (idx !== -1) {
            state.goals[idx] = { email, dailyTarget, weeklyTarget };
        } else {
            state.goals.push({ email, dailyTarget, weeklyTarget });
        }

        saveState();
        showToast('Study goals targets applied.', 'success');
        closeModal('goal-modal');
        if (activeTab === 'dashboard') renderDashboard();
    });
}

/**
 * ==========================================================================
 * GENERAL CONTROLS AND INTERFACE RIGS
 * ==========================================================================
 */
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('aura_study_theme', newTheme);

    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) themeSwitch.checked = (newTheme === 'dark');

    const compactIcon = document.querySelector('.theme-toggle-compact i');
    if (compactIcon) {
        compactIcon.className = newTheme === 'dark' ? 'bx bx-moon theme-icon' : 'bx bx-sun theme-icon';
    }

    renderAnalyticsCharts(getUserLogs());
}

function initTheme() {
    const savedTheme = localStorage.getItem('aura_study_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = (savedTheme === 'dark');
        themeSwitch.addEventListener('change', toggleTheme);
    }
}

function initModals() {
    document.getElementById('quick-log-btn').addEventListener('click', () => {
        // Guest Interceptor on logging sessions
        if (!state.currentUser) {
            promptAuthentication("Log Study Session", "Sign up to log focused study hours and build your daily streaks!");
            return;
        }
        document.getElementById('log-modal').classList.add('active');
    });

    document.getElementById('close-log-modal').addEventListener('click', () => closeModal('log-modal'));
    document.getElementById('cancel-log-modal').addEventListener('click', () => closeModal('log-modal'));
    
    document.getElementById('close-goal-modal').addEventListener('click', () => closeModal('goal-modal'));
    document.getElementById('cancel-goal-modal').addEventListener('click', () => closeModal('goal-modal'));
    
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
    // Seed Guest Mock Logs to make the explore dashboard gorgeous immediately!
    seedMockLogs(GUEST_EMAIL);

    initTheme();
    initRouter();
    initAuth();
    initLogsForm();
    initGoalsForm();
    initFilters();
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
        promptAuthentication("Join AuraStudy", "Create a profile to save personal study sessions, customize habit goals, and claim badges!");
    });

    // Check sessions
    checkAuthSession();
});
