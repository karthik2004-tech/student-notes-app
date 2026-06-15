const DB_NAME = 'academicLedger';
const DB_VERSION = 1;
const LEDGER_STORE = 'ledgerStore';
const ACCOUNTS_STORE = 'accountsStore';
const CATEGORIES_STORE = 'categoriesStore';
const PAGE_SIZE = 8;

const DEFAULT_ACCOUNTS = [
  'Tuition Revenue',
  'Scholarship Fund',
  'Laboratory Fees',
  'Research Grants',
  'Operational Expenses',
];

const DEFAULT_CATEGORIES = [
  'Revenue',
  'Scholarship',
  'Grant',
  'Expense',
  'Payroll',
];

const SAMPLE_TRANSACTIONS = [
  { date: -6, description: 'Tuition payment', account: 'Tuition Revenue', category: 'Revenue', type: 'credit', amount: 18000.0, reference: 'INV-4091' },
  { date: -5, description: 'Laboratory equipment upgrade', account: 'Operational Expenses', category: 'Expense', type: 'debit', amount: 5400.0, reference: 'PO-2210' },
  { date: -4, description: 'Federal research grant', account: 'Research Grants', category: 'Grant', type: 'credit', amount: 120000.0, reference: 'GR-8833' },
  { date: -3, description: 'Scholarship award disbursement', account: 'Scholarship Fund', category: 'Scholarship', type: 'debit', amount: 23000.0, reference: 'SCH-1202' },
  { date: -2, description: 'Ancillary services fee', account: 'Laboratory Fees', category: 'Revenue', type: 'credit', amount: 8700.0, reference: 'INV-4038' },
  { date: -1, description: 'Campus utilities payment', account: 'Operational Expenses', category: 'Expense', type: 'debit', amount: 6400.0, reference: 'BILL-5564' },
  { date: 0, description: 'Donation from alumni', account: 'Research Grants', category: 'Revenue', type: 'credit', amount: 22500.0, reference: 'DON-9921' },
];

const state = {
  db: null,
  currentPage: 1,
  pageCount: 1,
  filters: {
    query: '',
    account: 'all',
    category: 'all',
    type: 'all',
  },
};

const elements = {
  status: document.getElementById('status'),
  form: document.getElementById('transaction-form'),
  ledgerBody: document.getElementById('ledger-body'),
  emptyState: document.getElementById('empty-state'),
  totalCredit: document.getElementById('total-credit'),
  totalDebit: document.getElementById('total-debit'),
  netBalance: document.getElementById('net-balance'),
  prevPage: document.getElementById('prev-page'),
  nextPage: document.getElementById('next-page'),
  pageLabel: document.getElementById('page-label'),
  loadDemo: document.getElementById('load-demo'),
  clearLedger: document.getElementById('clear-ledger'),
  exportLedger: document.getElementById('export-ledger'),
  importLedger: document.getElementById('import-ledger'),
  importFile: document.getElementById('import-file'),
  queryFilter: document.getElementById('query-filter'),
  accountFilter: document.getElementById('account-filter'),
  categoryFilter: document.getElementById('category-filter'),
  typeFilter: document.getElementById('type-filter'),
  accountsList: document.getElementById('accounts-list'),
  categoriesList: document.getElementById('categories-list'),
  recordCount: document.getElementById('record-count'),
  avgTransaction: document.getElementById('avg-transaction'),
  largestTransaction: document.getElementById('largest-transaction'),
  categoryChart: document.getElementById('category-chart'),
};

function setStatus(message, success = true) {
  elements.status.textContent = message;
  elements.status.style.color = success ? '#9be3ff' : '#ffb3b3';
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(LEDGER_STORE)) {
        const ledger = db.createObjectStore(LEDGER_STORE, { keyPath: 'id', autoIncrement: true });
        ledger.createIndex('date', 'date', { unique: false });
        ledger.createIndex('accountName', 'accountName', { unique: false });
        ledger.createIndex('categoryName', 'categoryName', { unique: false });
        ledger.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains(ACCOUNTS_STORE)) {
        const accounts = db.createObjectStore(ACCOUNTS_STORE, { keyPath: 'id', autoIncrement: true });
        accounts.createIndex('name', 'name', { unique: true });
      }
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        const categories = db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id', autoIncrement: true });
        categories.createIndex('name', 'name', { unique: true });
      }
    };

    request.onsuccess = event => {
      const db = event.target.result;
      db.onerror = event => {
        console.error('Database error:', event.target.error);
      };
      db.onversionchange = () => {
        db.close();
        setStatus('Database is outdated; refresh the page.', false);
      };
      resolve(db);
    };

    request.onblocked = () => {
      setStatus('Database upgrade blocked by another tab.', false);
    };

    request.onerror = event => {
      reject(new Error('Unable to open ledger database: ' + event.target.errorCode));
    };
  });
}

function validateTransaction(input) {
  const amount = Number(input.amount);
  const date = new Date(input.date);

  if (!input.description.trim()) {
    throw new Error('Description is required.');
  }
  if (!input.account.trim()) {
    throw new Error('Account is required.');
  }
  if (!input.category.trim()) {
    throw new Error('Category is required.');
  }
  if (!['credit', 'debit'].includes(input.type)) {
    throw new Error('Type must be credit or debit.');
  }
  if (!input.date || Number.isNaN(date.getTime())) {
    throw new Error('Valid transaction date is required.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number.');
  }

  return {
    ...input,
    amount: Number(amount.toFixed(2)),
    date: date.toISOString(),
    createdAt: new Date().toISOString(),
  };
}

function runTransaction(storeNames, mode, callback) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(storeNames, mode);
    const result = callback(tx);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

function getRecordByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.index(indexName).get(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function addRecord(storeName, record) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOrCreateReference(storeName, name) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Reference value is required.');
  }

  const existing = await getRecordByIndex(storeName, 'name', trimmed);
  if (existing) return existing;
  const id = await addRecord(storeName, { name: trimmed });
  return { id, name: trimmed };
}

async function addTransaction(record) {
  if (!state.db) throw new Error('Database is not available');
  const [account, category] = await Promise.all([
    getOrCreateReference(ACCOUNTS_STORE, record.account),
    getOrCreateReference(CATEGORIES_STORE, record.category),
  ]);

  const payload = {
    date: record.date,
    description: record.description.trim(),
    amount: record.amount,
    type: record.type,
    reference: record.reference.trim(),
    accountId: account.id,
    accountName: account.name,
    categoryId: category.id,
    categoryName: category.name,
    createdAt: record.createdAt,
  };

  return addRecord(LEDGER_STORE, payload);
}

async function deleteTransaction(id) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction([LEDGER_STORE], 'readwrite');
    const store = tx.objectStore(LEDGER_STORE);
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function matchesFilters(entry) {
  const { query, account, category, type } = state.filters;
  if (type !== 'all' && entry.type !== type) return false;
  if (account !== 'all' && entry.accountName !== account) return false;
  if (category !== 'all' && entry.categoryName !== category) return false;
  if (query && !entry.description.toLowerCase().includes(query.toLowerCase())) return false;
  return true;
}

async function countTransactions() {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction([LEDGER_STORE], 'readonly');
    const store = tx.objectStore(LEDGER_STORE);
    const cursor = store.openCursor();
    let total = 0;

    cursor.onerror = () => reject(cursor.error);
    cursor.onsuccess = event => {
      const current = event.target.result;
      if (!current) {
        resolve(total);
        return;
      }
      if (matchesFilters(current.value)) total += 1;
      current.continue();
    };
  });
}

async function fetchTransactions(page = 1) {
  const data = [];
  const tx = state.db.transaction([LEDGER_STORE], 'readonly');
  const store = tx.objectStore(LEDGER_STORE);
  const index = store.index('date');
  const cursorRequest = index.openCursor(null, 'prev');
  const start = (page - 1) * PAGE_SIZE;
  let skipped = 0;

  return new Promise((resolve, reject) => {
    cursorRequest.onerror = () => reject(cursorRequest.error);
    cursorRequest.onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) {
        resolve(data);
        return;
      }
      const entry = cursor.value;
      if (!matchesFilters(entry)) {
        cursor.continue();
        return;
      }
      if (skipped < start) {
        skipped += 1;
        cursor.continue();
        return;
      }
      if (data.length < PAGE_SIZE) {
        data.push(entry);
        cursor.continue();
        return;
      }
      resolve(data);
    };
  });
}

async function getAllRecords(storeName) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function fetchSummary() {
  const totals = {
    credit: 0,
    debit: 0,
    categoryTotals: {},
    totalVolume: 0,
    netBalance: 0,
    highestTransaction: 0,
    dailyTrend: [],
  };
  const dailyMap = new Map();

  return new Promise((resolve, reject) => {
    const tx = state.db.transaction([LEDGER_STORE], 'readonly');
    const store = tx.objectStore(LEDGER_STORE);
    const request = store.openCursor();

    request.onerror = () => reject(request.error);
    request.onsuccess = event => {
      const cursor = event.target.result;
      if (!cursor) {
        totals.netBalance = totals.credit - totals.debit;
        totals.dailyTrend = Array.from(dailyMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, amount]) => ({ date, amount }));
        resolve(totals);
        return;
      }
      const entry = cursor.value;
      if (!matchesFilters(entry)) {
        cursor.continue();
        return;
      }

      totals[entry.type] += entry.amount;
      totals.totalVolume += entry.amount;
      totals.highestTransaction = Math.max(totals.highestTransaction, entry.amount);
      totals.categoryTotals[entry.categoryName] = (totals.categoryTotals[entry.categoryName] || 0) + entry.amount;

      const day = entry.date.slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + (entry.type === 'credit' ? entry.amount : -entry.amount));
      cursor.continue();
    };
  });
}

function formatDate(isoValue) {
  const date = new Date(isoValue);
  return date.toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(value);
}

function formatMetric(value) {
  return value ? formatCurrency(value) : '$0.00';
}

async function renderLedger() {
  try {
    const [transactions, summary, totalCount] = await Promise.all([
      fetchTransactions(state.currentPage),
      fetchSummary(),
      countTransactions(),
    ]);

    elements.ledgerBody.innerHTML = '';
    elements.emptyState.style.display = transactions.length ? 'none' : 'block';

    transactions.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(item.date)}</td>
        <td>${item.description}</td>
        <td>${item.accountName}</td>
        <td>${item.categoryName}</td>
        <td><span class="tag ${item.type}">${item.type}</span></td>
        <td><strong>${formatCurrency(item.amount)}</strong></td>
        <td>${item.reference || '—'}</td>
        <td><button class="action-button" data-id="${item.id}">Delete</button></td>
      `;
      elements.ledgerBody.appendChild(row);
    });

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    state.pageCount = totalPages;
    elements.pageLabel.textContent = `Page ${state.currentPage} of ${totalPages}`;
    elements.prevPage.disabled = state.currentPage <= 1;
    elements.nextPage.disabled = state.currentPage >= totalPages;

    elements.totalCredit.textContent = formatMetric(summary.credit);
    elements.totalDebit.textContent = formatMetric(summary.debit);
    elements.netBalance.textContent = formatMetric(summary.netBalance);
    elements.recordCount.textContent = totalCount;
    elements.avgTransaction.textContent = formatMetric(totalCount ? summary.totalVolume / totalCount : 0);
    elements.largestTransaction.textContent = formatMetric(summary.highestTransaction);
    renderCategoryChart(summary.categoryTotals);
  } catch (error) {
    console.error(error);
    setStatus('Unable to render ledger. See console for details.', false);
  }
}

function renderCategoryChart(categoryTotals) {
  elements.categoryChart.innerHTML = '';
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    elements.categoryChart.innerHTML = '<p class="empty-state">No category analytics available yet.</p>';
    return;
  }

  const maxValue = entries[0][1] || 1;
  entries.forEach(([category, amount]) => {
    const row = document.createElement('div');
    row.className = 'chart-row';
    const label = document.createElement('span');
    label.textContent = category;
    const value = document.createElement('strong');
    value.textContent = formatCurrency(amount);
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.width = `${Math.max(8, (amount / maxValue) * 100)}%`;
    row.append(label, value, bar);
    elements.categoryChart.appendChild(row);
  });
}

function updateFilterState() {
  state.filters.query = elements.queryFilter.value.trim();
  state.filters.account = elements.accountFilter.value;
  state.filters.category = elements.categoryFilter.value;
  state.filters.type = elements.typeFilter.value;
  state.currentPage = 1;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const payload = {
    date: formData.get('date') || '',
    description: formData.get('description') || '',
    account: formData.get('account') || '',
    category: formData.get('category') || '',
    type: formData.get('type') || 'debit',
    amount: formData.get('amount') || '0',
    reference: formData.get('reference') || '',
  };

  try {
    const validated = validateTransaction(payload);
    await addTransaction(validated);
    setStatus('Transaction committed successfully.');
    elements.form.reset();
    elements.form.querySelector('#date').focus();
    await renderFilters();
    await renderLedger();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Failed to commit transaction.', false);
  }
}

async function handleTableClick(event) {
  const button = event.target.closest('button[data-id]');
  if (!button) return;

  const id = button.dataset.id;
  if (!id) return;

  try {
    await deleteTransaction(id);
    setStatus('Transaction deleted.');
    const totalCount = await countTransactions();
    const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    if (state.currentPage > pageCount) {
      state.currentPage = pageCount;
    }
    await renderLedger();
  } catch (error) {
    console.error(error);
    setStatus('Unable to delete transaction.', false);
  }
}

async function loadDemoData() {
  try {
    setStatus('Loading sample ledger data...');
    for (const record of SAMPLE_TRANSACTIONS) {
      const date = new Date();
      date.setDate(date.getDate() + record.date);
      await addTransaction({
        ...record,
        date: date.toISOString(),
        createdAt: new Date().toISOString(),
      });
    }
    await renderFilters();
    await renderLedger();
    setStatus('Demo dataset loaded successfully.');
  } catch (error) {
    console.error(error);
    setStatus('Unable to load demo data.', false);
  }
}

async function exportLedger() {
  try {
    const items = await getAllRecords(LEDGER_STORE);
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ledger-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Export ready to download.');
  } catch (error) {
    console.error(error);
    setStatus('Unable to export ledger.', false);
  }
}

function importLedger() {
  elements.importFile.click();
}

async function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    if (!Array.isArray(payload)) throw new Error('Invalid ledger file format.');

    for (const entry of payload) {
      const normalized = {
        date: entry.date,
        description: entry.description,
        account: entry.accountName || entry.account,
        category: entry.categoryName || entry.category,
        type: entry.type,
        amount: entry.amount,
        reference: entry.reference || '',
        createdAt: entry.createdAt || new Date().toISOString(),
      };
      await addTransaction(validateTransaction(normalized));
    }
    await renderFilters();
    await renderLedger();
    setStatus('Ledger imported successfully.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Import failed.', false);
  } finally {
    elements.importFile.value = '';
  }
}

async function clearLedger() {
  if (!window.confirm('Delete all ledger entries? This cannot be undone.')) return;
  try {
    await new Promise((resolve, reject) => {
      const tx = state.db.transaction([LEDGER_STORE], 'readwrite');
      const store = tx.objectStore(LEDGER_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    await renderLedger();
    setStatus('Ledger cleared.');
  } catch (error) {
    console.error(error);
    setStatus('Unable to clear ledger.', false);
  }
}

async function renderFilters() {
  const accounts = await getAllRecords(ACCOUNTS_STORE);
  const categories = await getAllRecords(CATEGORIES_STORE);
  const accountOptions = [
    { value: 'all', label: 'All accounts' },
    ...accounts.map(entry => ({ value: entry.name, label: entry.name })),
  ];
  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...categories.map(entry => ({ value: entry.name, label: entry.name })),
  ];

  elements.accountFilter.innerHTML = accountOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  elements.categoryFilter.innerHTML = categoryOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  elements.accountsList.innerHTML = accounts.map(entry => `<option value="${entry.name}">`).join('');
  elements.categoriesList.innerHTML = categories.map(entry => `<option value="${entry.name}">`).join('');
}

function attachFilterListeners() {
  const filterInputs = [
    elements.queryFilter,
    elements.accountFilter,
    elements.categoryFilter,
    elements.typeFilter,
  ];

  filterInputs.forEach(input => {
    input.addEventListener('input', async () => {
      updateFilterState();
      await renderLedger();
    });
  });
}

async function seedReferenceData() {
  const accounts = await getAllRecords(ACCOUNTS_STORE);
  const categories = await getAllRecords(CATEGORIES_STORE);
  if (!accounts.length) {
    for (const account of DEFAULT_ACCOUNTS) await addRecord(ACCOUNTS_STORE, { name: account });
  }
  if (!categories.length) {
    for (const category of DEFAULT_CATEGORIES) await addRecord(CATEGORIES_STORE, { name: category });
  }
}

function parseExportedEntry(entry) {
  return {
    date: entry.date,
    description: entry.description,
    account: entry.accountName || entry.account || 'Unknown Account',
    category: entry.categoryName || entry.category || 'Unknown Category',
    type: entry.type,
    amount: entry.amount,
    reference: entry.reference || '',
    createdAt: entry.createdAt || new Date().toISOString(),
  };
}

async function init() {
  try {
    setStatus('Opening IndexedDB...');
    state.db = await openDatabase();
    await seedReferenceData();
    await renderFilters();
    attachFilterListeners();
    bindEvents();
    await renderLedger();
    setStatus('Ledger database ready.');
  } catch (error) {
    console.error(error);
    setStatus('IndexedDB initialization failed.', false);
  }
}

function bindEvents() {
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.prevPage.addEventListener('click', async () => {
    if (state.currentPage > 1) {
      state.currentPage -= 1;
      await renderLedger();
    }
  });
  elements.nextPage.addEventListener('click', async () => {
    if (state.currentPage < state.pageCount) {
      state.currentPage += 1;
      await renderLedger();
    }
  });
  elements.ledgerBody.addEventListener('click', handleTableClick);
  elements.loadDemo.addEventListener('click', loadDemoData);
  elements.exportLedger.addEventListener('click', exportLedger);
  elements.importLedger.addEventListener('click', importLedger);
  elements.importFile.addEventListener('change', handleImportFile);
  elements.clearLedger.addEventListener('click', clearLedger);
}

window.addEventListener('DOMContentLoaded', init);
