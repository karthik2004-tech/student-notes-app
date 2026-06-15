/**
 * ==========================================================================
 * AURAFINANCE - CORE STATE ENGINE & LOGIC
 * ==========================================================================
 */

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Category Configurations with boxicons & colors
const CATEGORIES = {
    expense: {
        Food: { icon: 'bx-restaurant', color: '#f43f5e' }, // Rose
        Transport: { icon: 'bx-car', color: '#3b82f6' }, // Blue
        Rent: { icon: 'bx-home-alt', color: '#8b5cf6' }, // Purple
        Utilities: { icon: 'bx-bolt', color: '#eab308' }, // Yellow
        Entertainment: { icon: 'bx-film', color: '#ec4899' }, // Pink
        Shopping: { icon: 'bx-shopping-bag', color: '#f472b6' }, // Light Pink
        Medical: { icon: 'bx-first-aid', color: '#10b981' }, // Emerald
        Others: { icon: 'bx-dots-horizontal-rounded', color: '#64748b' } // Slate
    },
    income: {
        Salary: { icon: 'bx-briefcase', color: '#10b981' },
        Freelance: { icon: 'bx-laptop', color: '#06b6d4' },
        Investment: { icon: 'bx-trending-up', color: '#6366f1' },
        Gifts: { icon: 'bx-gift', color: '#f472b6' },
        Others: { icon: 'bx-dots-horizontal-rounded', color: '#64748b' }
    }
};

// Global App State
const state = {
    users: JSON.parse(localStorage.getItem('aura_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('aura_current_user')) || null,
    transactions: JSON.parse(localStorage.getItem('aura_transactions')) || [],
    budgets: JSON.parse(localStorage.getItem('aura_budgets')) || []
};

// Chart instances
let trendChartInstance = null;
let categoryChartInstance = null;

// Active Navigation Tab
let activeTab = 'dashboard';

/**
 * ==========================================================================
 * LOCAL STORAGE SYNC & SEED DATA
 * ==========================================================================
 */
function saveState() {
    try {
        localStorage.setItem('aura_users', JSON.stringify(state.users));
        localStorage.setItem('aura_current_user', JSON.stringify(state.currentUser));
        localStorage.setItem('aura_transactions', JSON.stringify(state.transactions));
        localStorage.setItem('aura_budgets', JSON.stringify(state.budgets));
    } catch (e) {
        console.warn("LocalStorage is full or unavailable. Transactions will only be saved in memory for this session.");
    }
}

function saveTransaction(transaction) {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (e) {
        console.warn("LocalStorage is full or unavailable. Transactions will only be saved in memory for this session.");
    }
}

function loadTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
}

// Seed mock data for a newly created user to showcase dashboard analytics
function seedMockData(email) {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    
    // Previous month info
    let prevMonthNum = today.getMonth();
    let prevYear = curYear;
    if (prevMonthNum === 0) {
        prevMonthNum = 12;
        prevYear -= 1;
    }
    const prevMonth = String(prevMonthNum).padStart(2, '0');

    const mockTransactions = [
        // Current Month Incomes
        { id: 'm1', email, amount: 5400, type: 'income', category: 'Salary', date: `${curYear}-${curMonth}-01`, note: 'Primary Corporate Paycheck' },
        { id: 'm2', email, amount: 650, type: 'income', category: 'Freelance', date: `${curYear}-${curMonth}-15`, note: 'SaaS UI Project Design' },
        
        // Current Month Expenses
        { id: 'm3', email, amount: 1200, type: 'expense', category: 'Rent', date: `${curYear}-${curMonth}-02`, note: 'Apartment Monthly Rent' },
        { id: 'm4', email, amount: 280, type: 'expense', category: 'Food', date: `${curYear}-${curMonth}-10`, note: 'Weekly Groceries & Meal Prep' },
        { id: 'm5', email, amount: 75, type: 'expense', category: 'Transport', date: `${curYear}-${curMonth}-08`, note: 'Transit card reload' },
        { id: 'm6', email, amount: 110, type: 'expense', category: 'Utilities', date: `${curYear}-${curMonth}-05`, note: 'Electricity & High-speed Fiber' },
        { id: 'm7', email, amount: 95, type: 'expense', category: 'Entertainment', date: `${curYear}-${curMonth}-18`, note: 'Movie tickets & concerts' },
        { id: 'm8', email, amount: 140, type: 'expense', category: 'Shopping', date: `${curYear}-${curMonth}-22`, note: 'Noise-canceling headphones' },
        { id: 'm9', email, amount: 45, type: 'expense', category: 'Medical', date: `${curYear}-${curMonth}-14`, note: 'Pharmacy supplies' },

        // Previous Month Incomes
        { id: 'm10', email, amount: 5400, type: 'income', category: 'Salary', date: `${prevYear}-${prevMonth}-01`, note: 'Primary Paycheck' },
        { id: 'm11', email, amount: 400, type: 'income', category: 'Freelance', date: `${prevYear}-${prevMonth}-20`, note: 'Landing page dev' },

        // Previous Month Expenses
        { id: 'm12', email, amount: 1200, type: 'expense', category: 'Rent', date: `${prevYear}-${prevMonth}-02`, note: 'Monthly Rent' },
        { id: 'm13', email, amount: 310, type: 'expense', category: 'Food', date: `${prevYear}-${prevMonth}-12`, note: 'Supermarket and Dinners' },
        { id: 'm14', email, amount: 95, type: 'expense', category: 'Transport', date: `${prevYear}-${prevMonth}-15`, note: 'Fuel fill-up' },
        { id: 'm15', email, amount: 115, type: 'expense', category: 'Utilities', date: `${prevYear}-${prevMonth}-05`, note: 'Power & Internet bill' }
    ];

    const mockBudgets = [
        { email, category: 'Food', limit: 400 },
        { email, category: 'Shopping', limit: 250 },
        { email, category: 'Transport', limit: 150 }
    ];

    state.transactions.push(...mockTransactions);
    state.budgets.push(...mockBudgets);
    saveState();
}

/**
 * ==========================================================================
 * TOAST ALERTS SYSTEM
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
        <span>${sanitizeInput(message)}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

/**
 * ==========================================================================
 * ROUTER & VIEW SWITCHING (SPA)
 * ==========================================================================
 */
function initRouter() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            switchTab(targetTab);
            
            // Close mobile sidebar on navigation click
            document.getElementById('app-sidebar').classList.remove('active');
        });
    });

    // Special dashboard summary "view all" link
    document.getElementById('view-all-transactions').addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('transactions');
    });
}

function switchTab(tabName) {
    activeTab = tabName;
    
    // Toggle Section views
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${tabName}-view`);
    if (targetSection) targetSection.classList.add('active');
    
    // Toggle active link class
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-tab') === tabName) {
            link.classList.add('active');
        }
    });

    // Update Header View Title
    const titles = {
        dashboard: 'Dashboard Overview',
        transactions: 'Transactions Ledger',
        budgets: 'Monthly Budget Boards',
        reports: 'Financial Insights & Reports'
    };
    document.getElementById('view-title').textContent = titles[tabName] || 'Dashboard';
    
    // View-specific trigger tasks
    if (tabName === 'dashboard') {
        renderDashboard();
    } else if (tabName === 'transactions') {
        renderTransactionsTable();
    } else if (tabName === 'budgets') {
        renderBudgetsBoard();
    } else if (tabName === 'reports') {
        renderReportsTab();
    }
}

/**
 * ==========================================================================
 * MULTI-USER AUTH SYSTEM
 * ==========================================================================
 */
function initAuth() {
    const compactThemeToggle = document.getElementById('compact-theme-toggle');
    const toSignup = document.getElementById('to-signup');
    const toLogin = document.getElementById('to-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Switch to Signup Panel
    toSignup.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form-wrapper').classList.remove('active');
        document.getElementById('signup-form-wrapper').classList.add('active');
    });

    // Switch to Login Panel
    toLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form-wrapper').classList.remove('active');
        document.getElementById('login-form-wrapper').classList.add('active');
    });

    // Compact Auth Theme Switcher
    compactThemeToggle.addEventListener('click', () => {
        toggleTheme();
    });

    // Signup Form Handler
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
            showToast('Email already registered.', 'error');
            return;
        }

        const newUser = { name, email, password };
        state.users.push(newUser);
        saveState();

        // Seed nice looking mock entries for a gorgeous first look!
        seedMockData(email);

        showToast('Registration successful! Please log in.', 'success');
        signupForm.reset();
        toLogin.click();
    });

    // Login Form Handler
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
        checkAuthSession();
    });

    // Logout button handler
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentUser = null;
        saveState();
        showToast('Logged out successfully.', 'info');
        checkAuthSession();
    });
}

function checkAuthSession() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (state.currentUser) {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Update user badge profiles
        document.getElementById('user-profile-name').textContent = state.currentUser.name;
        document.getElementById('user-profile-email').textContent = state.currentUser.email;
        
        // Avatar Initials
        const initials = state.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        document.getElementById('user-avatar-initials').textContent = initials;
        
        switchTab('dashboard');
    } else {
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        document.getElementById('login-form-wrapper').classList.add('active');
        document.getElementById('signup-form-wrapper').classList.remove('active');
    }
}

/**
 * ==========================================================================
 * STATS & CALCULATIONS ENGINES
 * ==========================================================================
 */
function getUserTransactions() {
    if (!state.currentUser) return [];
    return state.transactions.filter(t => t.email === state.currentUser.email);
}

function getUserBudgets() {
    if (!state.currentUser) return [];
    return state.budgets.filter(b => b.email === state.currentUser.email);
}

function calculateBalances() {
    const tx = getUserTransactions();
    let income = 0;
    let expense = 0;

    tx.forEach(t => {
        const val = parseFloat(t.amount);
        if (t.type === 'income') {
            income += val;
        } else {
            expense += val;
        }
    });

    return {
        income,
        expense,
        balance: income - expense
    };
}

// Format Currency
function formatMoney(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * ==========================================================================
 * DASHBOARD CONTROLLER & RENDERS
 * ==========================================================================
 */
function renderDashboard() {
    const totals = calculateBalances();
    
    // Populate balance totals
    document.getElementById('total-balance').textContent = formatMoney(totals.balance);
    document.getElementById('total-income').textContent = formatMoney(totals.income);
    document.getElementById('total-expenses').textContent = formatMoney(totals.expense);
    
    // Balance color indicator
    const balEl = document.getElementById('total-balance');
    if (totals.balance >= 0) {
        balEl.className = 'amount text-emerald';
    } else {
        balEl.className = 'amount text-rose';
    }

    // Update active budget limit counter
    const userBudgets = getUserBudgets();
    document.getElementById('active-budget-count').textContent = userBudgets.length;

    // Populate Recent transaction summary list
    const tx = getUserTransactions();
    // Sort transactions latest first
    const sortedTx = [...tx].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    const recentList = document.getElementById('dashboard-transactions-list');
    
    if (sortedTx.length === 0) {
        recentList.innerHTML = `
            <div class="empty-state">
                <i class='bx bx-spreadsheet'></i>
                <p>No recent activity. Click "Add Entry" to begin tracking!</p>
            </div>
        `;
    } else {
        recentList.innerHTML = sortedTx.map(t => {
            const catInfo = CATEGORIES[t.type][t.category] || CATEGORIES[t.type]['Others'] || { icon: 'bx-question-mark', color: '#64748b' };
            const typeSign = t.type === 'income' ? '+' : '-';
            const typeColor = t.type === 'income' ? 'text-emerald' : 'text-rose';
            const displayDate = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return `
                <div class="transaction-row-badge">
                    <div class="t-badge-left">
                        <div class="t-icon-box" style="background-color: ${catInfo.color}15; color: ${catInfo.color};">
                            <i class='bx ${catInfo.icon}'></i>
                        </div>
                        <div class="t-meta">
                            <h4>${sanitizeInput(t.note || t.category)}</h4>
                            <span class="category">${sanitizeInput(t.category)}</span>
                            <span class="date">${displayDate}</span>
                        </div>
                    </div>
                    <div class="t-badge-right">
                        <span class="t-badge-amount amount ${typeColor}">${typeSign}${formatMoney(t.amount)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Trigger Charts Re-render
    renderCharts(tx);
}

/**
 * ==========================================================================
 * INTERACTIVE CHARTS ENGINE (CHART.JS)
 * ==========================================================================
 */
function renderCharts(tx) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    // 1. DOUGHNUT CHART - CATEGORY EXPENDITURES
    const expensesOnly = tx.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    // Group totals by category
    expensesOnly.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
    });

    const categoryLabels = Object.keys(categoryTotals);
    const categoryData = Object.values(categoryTotals);
    const categoryColors = categoryLabels.map(cat => (CATEGORIES.expense[cat] || { color: '#64748b' }).color);

    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    if (categoryData.length === 0) {
        // Render fallback visual when no data
        categoryChartInstance = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['No Expenses Registered'],
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
        categoryChartInstance = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: categoryColors,
                    borderWidth: isDark ? 2 : 1,
                    borderColor: isDark ? '#0f172a' : '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Spent: ${formatMoney(context.raw)}`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // 2. CASHFLOW AREA TREND LINE CHART
    // Aggregate past 6 months income vs expenses
    const monthlySummary = {};
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize past 6 months including current month
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlySummary[mKey] = { label: `${monthsName[d.getMonth()]} ${d.getFullYear()}`, income: 0, expense: 0 };
    }

    tx.forEach(t => {
        const tDate = new Date(t.date);
        const mKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlySummary[mKey]) {
            if (t.type === 'income') {
                monthlySummary[mKey].income += parseFloat(t.amount);
            } else {
                monthlySummary[mKey].expense += parseFloat(t.amount);
            }
        }
    });

    const trendLabels = Object.values(monthlySummary).map(m => m.label);
    const trendIncome = Object.values(monthlySummary).map(m => m.income);
    const trendExpense = Object.values(monthlySummary).map(m => m.expense);

    const trendCtx = document.getElementById('trendChart').getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [
                {
                    label: 'Income',
                    data: trendIncome,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981'
                },
                {
                    label: 'Expenses',
                    data: trendExpense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor, font: { family: 'Outfit', weight: '600' } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: ${formatMoney(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

/**
 * ==========================================================================
 * TRANSACTIONS FILTERING & CRUD CONTROLLERS
 * ==========================================================================
 */
function renderTransactionsTable() {
    const listBody = document.getElementById('transactions-list-body');
    const emptyState = document.getElementById('table-empty-state');
    const tableEl = document.getElementById('transactions-table');
    
    // Inputs
    const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
    const typeVal = document.getElementById('filter-type').value;
    const categoryVal = document.getElementById('filter-category').value;
    const sortVal = document.getElementById('sort-order').value;

    let tx = getUserTransactions();

    // 1. Filter Search Descriptions/Notes/Category
    if (searchVal) {
        tx = tx.filter(t => 
            t.category.toLowerCase().includes(searchVal) || 
            (t.note && t.note.toLowerCase().includes(searchVal))
        );
    }

    // 2. Filter Type
    if (typeVal !== 'all') {
        tx = tx.filter(t => t.type === typeVal);
    }

    // 3. Filter Category
    if (categoryVal !== 'all') {
        tx = tx.filter(t => t.category === categoryVal);
    }

    // 4. Sort Ordered
    if (sortVal === 'date-desc') {
        tx.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortVal === 'date-asc') {
        tx.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortVal === 'amount-desc') {
        tx.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    } else if (sortVal === 'amount-asc') {
        tx.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    }

    if (tx.length === 0) {
        listBody.innerHTML = '';
        tableEl.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        tableEl.classList.remove('hidden');

        listBody.innerHTML = tx.map(t => {
            const catInfo = CATEGORIES[t.type][t.category] || { icon: 'bx-question-mark', color: '#64748b' };
            const sign = t.type === 'income' ? '+' : '-';
            const colorClass = t.type === 'income' ? 'text-emerald' : 'text-rose';
            
            return `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                        <div style="font-weight: 500;">${sanitizeInput(t.note || 'No description')}</div>
                    </td>
                    <td>
                        <span style="display: inline-flex; align-items: center; gap: 8px;">
                            <i class='bx ${catInfo.icon}' style="color: ${catInfo.color}; font-size: 18px;"></i>
                            ${sanitizeInput(t.category)}
                        </span>
                    </td>
                    <td>
                        <span class="budget-alert-badge ${t.type === 'income' ? 'safe' : 'danger'}">${t.type}</span>
                    </td>
                    <td class="text-right amount ${colorClass}">${sign}${formatMoney(t.amount)}</td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button class="btn-icon btn-edit-tx" data-id="${t.id}" title="Edit Entry">
                                <i class='bx bx-edit-alt'></i>
                            </button>
                            <button class="btn-icon btn-delete btn-delete-tx" data-id="${t.id}" title="Delete Entry">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire Up Action Handlers
        document.querySelectorAll('.btn-edit-tx').forEach(btn => {
            btn.addEventListener('click', () => {
                const txId = btn.getAttribute('data-id');
                openTransactionModal(txId);
            });
        });

        document.querySelectorAll('.btn-delete-tx').forEach(btn => {
            btn.addEventListener('click', () => {
                const txId = btn.getAttribute('data-id');
                deleteTransaction(txId);
            });
        });
    }
}

function initFilters() {
    const searchInput = document.getElementById('search-input');
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');
    const sortOrder = document.getElementById('sort-order');

    const updateTrigger = () => renderTransactionsTable();

    searchInput.addEventListener('input', updateTrigger);
    filterType.addEventListener('change', () => {
        populateCategoryFilterOptions();
        updateTrigger();
    });
    filterCategory.addEventListener('change', updateTrigger);
    sortOrder.addEventListener('change', updateTrigger);

    populateCategoryFilterOptions();
}

function populateCategoryFilterOptions() {
    const filterType = document.getElementById('filter-type').value;
    const catSelect = document.getElementById('filter-category');
    
    let categoriesList = [];
    if (filterType === 'all') {
        categoriesList = [...Object.keys(CATEGORIES.expense), ...Object.keys(CATEGORIES.income)];
        // remove duplicates
        categoriesList = [...new Set(categoriesList)];
    } else {
        categoriesList = Object.keys(CATEGORIES[filterType]);
    }

    catSelect.innerHTML = `<option value="all">All Categories</option>` +
        categoriesList.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Transaction Addition & Modifications
function initTransactionForm() {
    const form = document.getElementById('transaction-form');
    const typeExpensesRadio = document.getElementById('type-expense');
    const typeIncomesRadio = document.getElementById('type-income');
    
    const setCategoryOptions = () => {
        const type = typeExpensesRadio.checked ? 'expense' : 'income';
        const catSelect = document.getElementById('t-category');
        catSelect.innerHTML = Object.keys(CATEGORIES[type]).map(cat => 
            `<option value="${cat}">${cat}</option>`
        ).join('');
    };

    typeExpensesRadio.addEventListener('change', setCategoryOptions);
    typeIncomesRadio.addEventListener('change', setCategoryOptions);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const amount = parseFloat(document.getElementById('t-amount').value);
        const date = document.getElementById('t-date').value;
        const category = document.getElementById('t-category').value;
        const note = document.getElementById('t-note').value.trim();
        const type = typeExpensesRadio.checked ? 'expense' : 'income';
        const email = state.currentUser.email;

        if (id) {
            // Edit modification
            const idx = state.transactions.findIndex(t => t.id === id);
            if (idx !== -1) {
                state.transactions[idx] = { id, email, amount, type, category, date, note };
                showToast('Entry updated successfully.', 'success');
            }
        } else {
            // New Entry addition
            const newTx = {
                id: 'tx_' + Date.now(),
                email,
                amount,
                type,
                category,
                date,
                note
            };
            state.transactions.push(newTx);
            saveTransaction(newTx);
            showToast('New transaction added.', 'success');
        }

        saveState();
        closeModal('transaction-modal');
        
        // Re-route dynamically or update active views
        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'transactions') renderTransactionsTable();
        
        // Check budget thresholds for expenses
        if (type === 'expense') {
            checkBudgetAlertThreshold(category);
        }
    });

    // Populate Category selectors
    setCategoryOptions();
}

function openTransactionModal(editId = null) {
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    const title = document.getElementById('modal-title');
    
    form.reset();
    document.getElementById('edit-id').value = '';
    title.textContent = 'Add Transaction';
    
    // Set default date as today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('t-date').value = today;

    // Trigger category dropdown initialization
    document.getElementById('type-expense').checked = true;
    document.getElementById('type-expense').dispatchEvent(new Event('change'));

    if (editId) {
        title.textContent = 'Edit Transaction';
        const tx = state.transactions.find(t => t.id === editId);
        if (tx) {
            document.getElementById('edit-id').value = tx.id;
            document.getElementById('t-amount').value = tx.amount;
            document.getElementById('t-date').value = tx.date;
            
            if (tx.type === 'expense') {
                document.getElementById('type-expense').checked = true;
            } else {
                document.getElementById('type-income').checked = true;
            }
            // Trigger category setup matching type
            document.getElementById(`type-${tx.type}`).dispatchEvent(new Event('change'));
            document.getElementById('t-category').value = tx.category;
            document.getElementById('t-note').value = tx.note || '';
        }
    }

    modal.classList.add('active');
}

function deleteTransaction(txId) {
    if (confirm('Are you sure you want to delete this financial record?')) {
        state.transactions = state.transactions.filter(t => t.id !== txId);
        localStorage.setItem('transactions', JSON.stringify(state.transactions));
        saveState();
        showToast('Transaction deleted successfully.', 'success');
        
        if (activeTab === 'dashboard') renderDashboard();
        if (activeTab === 'transactions') renderTransactionsTable();
    }
}

/**
 * ==========================================================================
 * BUDGET BOARDS MANAGEMENT
 * ==========================================================================
 */
function renderBudgetsBoard() {
    const container = document.getElementById('budgets-grid-container');
    const userBudgets = getUserBudgets();
    const tx = getUserTransactions();

    if (userBudgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state glass flex-1" style="grid-column: 1 / -1;">
                <i class='bx bx-wallet'></i>
                <p>No monthly budgets configured. Click "Configure Budget" to establish goals!</p>
            </div>
        `;
        return;
    }

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed

    container.innerHTML = userBudgets.map(b => {
        // Calculate amount spent in current category in current month
        const categoryTx = tx.filter(t => {
            if (t.type !== 'expense' || t.category !== b.category) return false;
            const tDate = new Date(t.date);
            return tDate.getFullYear() === curYear && tDate.getMonth() === curMonth;
        });

        const spent = categoryTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const percent = Math.min(Math.round((spent / b.limit) * 100), 100);
        
        let alertState = 'safe';
        let alertMsg = 'On Track';
        
        if (spent >= b.limit) {
            alertState = 'danger';
            alertMsg = 'Limit Exceeded';
        } else if (spent >= b.limit * 0.75) {
            alertState = 'warning';
            alertMsg = 'Approaching Limit';
        }

        const catInfo = CATEGORIES.expense[b.category] || { icon: 'bx-wallet', color: '#64748b' };

        return `
            <div class="budget-card glass">
                <div class="budget-card-header">
                    <div class="b-category-title">
                        <div class="t-icon-box" style="background-color: ${catInfo.color}15; color: ${catInfo.color};">
                            <i class='bx ${catInfo.icon}'></i>
                        </div>
                        <h4>${sanitizeInput(b.category)}</h4>
                    </div>
                    <button class="btn-delete-budget" data-cat="${b.category}" title="Remove Goal">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
                
                <div class="budget-values">
                    <div>
                        <span class="b-spent amount">${formatMoney(spent)}</span>
                        <span class="b-total">spent this month</span>
                    </div>
                    <span class="amount">${percent}%</span>
                </div>

                <div class="progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-fill ${alertState}" style="width: ${percent}%;"></div>
                    </div>
                </div>

                <span class="budget-alert-badge ${alertState}">${alertMsg} (${formatMoney(b.limit)} limit)</span>
            </div>
        `;
    }).join('');

    // Wire up budget deleting buttons
    document.querySelectorAll('.btn-delete-budget').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-cat');
            deleteBudget(cat);
        });
    });
}

function initBudgetForm() {
    const form = document.getElementById('budget-form');
    const catSelect = document.getElementById('b-category');

    // Populate category dropdown
    catSelect.innerHTML = Object.keys(CATEGORIES.expense).map(cat => 
        `<option value="${cat}">${cat}</option>`
    ).join('');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const category = catSelect.value;
        const limit = parseFloat(document.getElementById('b-limit').value);
        const email = state.currentUser.email;

        // Check if budget is already defined for category
        const idx = state.budgets.findIndex(b => b.email === email && b.category === category);
        
        if (idx !== -1) {
            state.budgets[idx].limit = limit;
            showToast(`Budget for ${category} updated.`, 'success');
        } else {
            state.budgets.push({ email, category, limit });
            showToast(`Budget set for ${category}.`, 'success');
        }

        saveState();
        closeModal('budget-modal');
        if (activeTab === 'budgets') renderBudgetsBoard();
    });
}

function deleteBudget(category) {
    if (confirm(`Remove monthly budget goals for ${category}?`)) {
        state.budgets = state.budgets.filter(b => !(b.email === state.currentUser.email && b.category === category));
        saveState();
        showToast('Budget goal deleted.', 'success');
        renderBudgetsBoard();
    }
}

// Proactive alert checker upon adding new expenses
function checkBudgetAlertThreshold(category) {
    const userBudgets = getUserBudgets();
    const targetBudget = userBudgets.find(b => b.category === category);
    if (!targetBudget) return;

    const tx = getUserTransactions();
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    const categoryTx = tx.filter(t => {
        if (t.type !== 'expense' || t.category !== category) return false;
        const tDate = new Date(t.date);
        return tDate.getFullYear() === curYear && tDate.getMonth() === curMonth;
    });

    const spent = categoryTx.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    if (spent >= targetBudget.limit) {
        showToast(`ALERT: Your monthly budget limit for ${category} has been EXCEEDED!`, 'error');
    } else if (spent >= targetBudget.limit * 0.85) {
        showToast(`WARNING: You have used over 85% of your monthly budget for ${category}.`, 'error');
    }
}

/**
 * ==========================================================================
 * STATEMENTS GENERATION & EXPORT REPORTS
 * ==========================================================================
 */
function renderReportsTab() {
    const period = document.getElementById('report-period').value;
    const body = document.getElementById('report-list-body');
    let tx = getUserTransactions();

    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    // 1. Filter Transactions by selected period
    if (period === 'current-month') {
        tx = tx.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === curYear && d.getMonth() === curMonth;
        });
    } else if (period === 'last-month') {
        let lastMonth = curMonth - 1;
        let targetYear = curYear;
        if (lastMonth < 0) {
            lastMonth = 11;
            targetYear -= 1;
        }
        tx = tx.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === targetYear && d.getMonth() === lastMonth;
        });
    } else if (period === 'this-year') {
        tx = tx.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === curYear;
        });
    }

    // Sort latest first
    tx.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate details
    let incomeSum = 0;
    let expenseSum = 0;
    tx.forEach(t => {
        const val = parseFloat(t.amount);
        if (t.type === 'income') incomeSum += val;
        else expenseSum += val;
    });

    const netSavings = incomeSum - expenseSum;
    const averageTx = tx.length > 0 ? (tx.reduce((sum, t) => sum + parseFloat(t.amount), 0) / tx.length) : 0;
    const savingsRate = incomeSum > 0 ? Math.max(0, Math.round((netSavings / incomeSum) * 100)) : 0;

    // Render Stats
    document.getElementById('report-net').textContent = formatMoney(netSavings);
    document.getElementById('report-net').className = netSavings >= 0 ? 'amount text-emerald' : 'amount text-rose';
    document.getElementById('report-avg').textContent = formatMoney(averageTx);
    document.getElementById('report-savings-rate').textContent = `${savingsRate}%`;

    // Render Table rows
    if (tx.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="text-center" style="padding: 48px; color: var(--text-secondary);">
                    No transactions registered in this period.
                </td>
            </tr>
        `;
    } else {
        body.innerHTML = tx.map(t => {
            const sign = t.type === 'income' ? '+' : '-';
            const colorClass = t.type === 'income' ? 'text-emerald' : 'text-rose';
            return `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>${sanitizeInput(t.category)}</td>
                    <td><span class="budget-alert-badge ${t.type === 'income' ? 'safe' : 'danger'}">${t.type}</span></td>
                    <td>${sanitizeInput(t.note || '—')}</td>
                    <td class="text-right amount ${colorClass}">${sign}${formatMoney(t.amount)}</td>
                </tr>
            `;
        }).join('');
    }
}

// Data export routines
function exportCSV() {
    const tx = getUserTransactions();
    if (tx.length === 0) {
        showToast('No transaction data to export.', 'error');
        return;
    }

    // CSV Headers
    let csvContent = 'ID,Date,Type,Category,Amount,Description\n';
    
    tx.forEach(t => {
        const cleanNote = t.note ? t.note.replace(/"/g, '""') : '';
        csvContent += `"${t.id}","${t.date}","${t.type}","${t.category}",${t.amount},"${cleanNote}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AuraFinance_Statement_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV statement exported successfully.', 'success');
}

function exportJSON() {
    const tx = getUserTransactions();
    if (tx.length === 0) {
        showToast('No transaction data to export.', 'error');
        return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tx, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `AuraFinance_Export_${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('JSON financial files exported successfully.', 'success');
}

/**
 * ==========================================================================
 * GENERAL THEME & OVERLAYS INTERACTION
 * ==========================================================================
 */
function toggleTheme() {
    const html = document.documentElement;
    const isDark = document.body.classList.toggle('dark');
    const newTheme = isDark ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Sync switch in footer
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) themeSwitch.checked = (newTheme === 'dark');

    // Sync compact icon
    const compactIcon = document.querySelector('.theme-toggle-compact i');
    if (compactIcon) {
        compactIcon.className = newTheme === 'dark' ? 'bx bx-moon theme-icon' : 'bx bx-sun theme-icon';
    }

    // Refresh charts to match colors
    if (state.currentUser) {
        renderCharts(getUserTransactions());
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.checked = (savedTheme === 'dark');
        themeSwitch.addEventListener('change', () => {
            toggleTheme();
        });
    }

    // Global listener for compact theme trigger
    const compactToggle = document.getElementById('compact-theme-toggle');
    if (compactToggle) {
        compactToggle.addEventListener('click', toggleTheme);
    }
}

function initModals() {
    // Quick Add Floating Trigger
    document.getElementById('quick-add-btn').addEventListener('click', () => {
        openTransactionModal();
    });

    // Configure Budgets Panel
    document.getElementById('add-budget-btn').addEventListener('click', () => {
        document.getElementById('budget-modal').classList.add('active');
    });

    // Close overlays
    document.getElementById('close-transaction-modal').addEventListener('click', () => closeModal('transaction-modal'));
    document.getElementById('cancel-transaction-modal').addEventListener('click', () => closeModal('transaction-modal'));
    
    document.getElementById('close-budget-modal').addEventListener('click', () => closeModal('budget-modal'));
    document.getElementById('cancel-budget-modal').addEventListener('click', () => closeModal('budget-modal'));

    // Close on overlay click
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
    // 1. Setup adaptive theme configurations
    initTheme();
    
    // 2. Wire Up SPA views navigation
    initRouter();
    
    // 3. Setup core user accounts engines
    initAuth();
    
    // 4. Initialize forms & popups
    initTransactionForm();
    initBudgetForm();
    initModals();
    initFilters();
    initMobileMenu();

    // 5. Connect Reports actions buttons
    document.getElementById('report-period').addEventListener('change', renderReportsTab);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-print-report').addEventListener('click', () => window.print());

    // 6. Establish current date text
    const dateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    document.getElementById('header-date').textContent = dateStr;

    // 7. Check if user is already logged in
    const savedTransactions = loadTransactions();
    if (savedTransactions.length > 0) {
        state.transactions = savedTransactions;
    }
    checkAuthSession();
});
