/* ═══════════════════════════════════════════════════════
   DevFinder — Client-Side Engine
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ───
  const GITHUB_API = 'https://api.github.com';
  const HISTORY_KEY = 'devfinder_history';
  const THEME_KEY = 'devfinder_theme';
  const MAX_HISTORY = 5;
  const SKELETON_DELAY = 300;

  // ─── State ───
  let searchHistory = [];

  // ─── DOM refs ───
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const dom = {};

  function cacheDom() {
    dom.html = document.documentElement;
    dom.themeToggle = $('#theme-toggle');
    dom.searchInput = $('#search-input');
    dom.btnSearch = $('#btn-search');
    dom.btnClear = $('#btn-clear');
    dom.historyPills = $('#history-pills');
    dom.content = $('#content');
    dom.skeleton = $('#skeleton');
    dom.errorState = $('#error-state');
    dom.errorTitle = $('#error-title');
    dom.errorDesc = $('#error-desc');
    dom.welcome = $('#welcome');
    dom.profile = $('#profile');
    dom.avatar = $('#profile-avatar');
    dom.name = $('#profile-name');
    dom.login = $('#profile-login');
    dom.bio = $('#profile-bio');
    dom.company = $('#profile-company');
    dom.location = $('#profile-location');
    dom.joined = $('#profile-joined');
    dom.statRepos = $('#stat-repos');
    dom.statGists = $('#stat-gists');
    dom.statFollowers = $('#stat-followers');
    dom.statFollowing = $('#stat-following');
    dom.reposGrid = $('#repos-grid');
    dom.btnCopy = $('#btn-copy-link');
    dom.toast = $('#toast');
  }

  // ─── Theme ───
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      dom.html.setAttribute('data-theme', saved);
    } else {
      dom.html.setAttribute('data-theme', 'dark');
    }
  }

  function toggleTheme() {
    const current = dom.html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    dom.html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  // ─── History ───
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) searchHistory = parsed;
      }
    } catch {
      searchHistory = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory));
    } catch { /* ignore */ }
  }

  function addToHistory(username) {
    searchHistory = searchHistory.filter((u) => u !== username);
    searchHistory.unshift(username);
    if (searchHistory.length > MAX_HISTORY) searchHistory.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    if (searchHistory.length === 0) {
      dom.historyPills.innerHTML = '';
      return;
    }
    dom.historyPills.innerHTML = searchHistory
      .map((u) => `<button class="history-pill" data-username="${u}">${u}</button>`)
      .join('');
  }

  // ─── UI Helpers ───
  function showError(title, desc) {
    dom.errorTitle.textContent = title;
    dom.errorDesc.textContent = desc;
    dom.errorState.classList.add('visible');
    dom.profile.classList.remove('visible');
    dom.welcome.style.display = 'none';
    dom.skeleton.classList.remove('visible');
  }

  function hideAllStates() {
    dom.errorState.classList.remove('visible');
    dom.skeleton.classList.remove('visible');
    dom.welcome.style.display = 'none';
    dom.profile.classList.remove('visible');
  }

  function showSkeleton() {
    hideAllStates();
    dom.skeleton.classList.add('visible');
  }

  function showProfile() {
    dom.skeleton.classList.remove('visible');
    dom.errorState.classList.remove('visible');
    dom.welcome.style.display = 'none';
    dom.profile.classList.add('visible');
  }

  function showWelcome() {
    dom.skeleton.classList.remove('visible');
    dom.errorState.classList.remove('visible');
    dom.profile.classList.remove('visible');
    dom.welcome.style.display = 'flex';
  }

  // ─── Toast ───
  let toastTimer = null;

  function showToast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('visible');
    }, 2200);
  }

  // ─── Copy Link ───
  function copyProfileLink(username) {
    const url = `https://github.com/${username}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        dom.btnCopy.classList.add('copied');
        showToast('Link copied to clipboard!');
        setTimeout(() => dom.btnCopy.classList.remove('copied'), 2000);
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      dom.btnCopy.classList.add('copied');
      showToast('Link copied to clipboard!');
      setTimeout(() => dom.btnCopy.classList.remove('copied'), 2000);
    } catch {
      showToast('Could not copy link');
    }
    document.body.removeChild(ta);
  }

  // ─── Date Formatting ───
  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // ─── Language Colors ───
  const LANG_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Ruby: '#701516',
    PHP: '#4F5D95',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Shell: '#89e051',
    Lua: '#000080',
    Scala: '#c22d40',
  };

  function getLangColor(lang) {
    return LANG_COLORS[lang] || '#8b949e';
  }

  // ─── GitHub API ───
  async function fetchProfile(username) {
    const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`);
    if (res.status === 403 || res.status === 429) {
      throw { type: 'RATE_LIMIT', message: 'Rate limit exceeded. Please try again later.' };
    }
    if (res.status === 404) {
      throw { type: 'NOT_FOUND', message: `No GitHub profile matches "${username}".` };
    }
    if (!res.ok) {
      throw { type: 'ERROR', message: `GitHub API responded with ${res.status}. Please try again.` };
    }
    return res.json();
  }

  async function fetchRepos(username) {
    const res = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=5`
    );
    if (!res.ok) return [];
    return res.json();
  }

  async function searchUser(username) {
    const trimmed = username.trim();
    if (!trimmed) return;

    hideAllStates();
    showSkeleton();

    try {
      const [user, repos] = await Promise.all([
        fetchProfile(trimmed),
        fetchRepos(trimmed),
      ]);

      renderProfile(user, repos);
      addToHistory(trimmed);
      showProfile();
    } catch (err) {
      if (err.type === 'NOT_FOUND') {
        showError('User not found', err.message);
      } else if (err.type === 'RATE_LIMIT') {
        showError('Rate limit exceeded', 'Rate limit exceeded. Please try again later.');
      } else {
        showError('Something went wrong', err.message || 'An unexpected error occurred.');
      }
    }
  }

  // ─── Render Profile ───
  function renderProfile(user, repos) {
    dom.avatar.src = user.avatar_url;
    dom.avatar.alt = `${user.login}'s avatar`;
    dom.name.textContent = user.name || user.login;
    dom.login.textContent = `@${user.login}`;
    dom.bio.textContent = user.bio || 'No bio available.';
    dom.company.textContent = user.company ? `🏢 ${user.company}` : '';
    dom.location.textContent = user.location ? `📍 ${user.location}` : '';
    dom.joined.textContent = `📅 Joined ${formatDate(user.created_at)}`;

    dom.statRepos.textContent = user.public_repos;
    dom.statGists.textContent = user.public_gists;
    dom.statFollowers.textContent = user.followers;
    dom.statFollowing.textContent = user.following;

    dom.btnCopy.dataset.username = user.login;

    renderRepos(repos);
  }

  function renderRepos(repos) {
    if (repos.length === 0) {
      dom.reposGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No public repositories.</p>';
      return;
    }

    dom.reposGrid.innerHTML = repos
      .map((repo) => {
        const langColor = getLangColor(repo.language);

        return `<div class="repo-card">
          <div class="repo-left">
            <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-name">${repo.name}</a>
            <div class="repo-desc">${repo.description || 'No description'}</div>
            <div class="repo-meta">
              ${repo.language ? `<span><span class="lang-dot" style="background:${langColor}"></span>${repo.language}</span>` : ''}
              ${repo.stargazers_count > 0 ? `<span>★ ${repo.stargazers_count}</span>` : ''}
              ${repo.forks_count > 0 ? `<span>⑂ ${repo.forks_count}</span>` : ''}
              <span>Updated ${formatDate(repo.updated_at)}</span>
            </div>
          </div>
        </div>`;
      })
      .join('');
  }

  // ─── Event Listeners ───
  function setupEvents() {
    dom.themeToggle.addEventListener('click', toggleTheme);

    dom.btnSearch.addEventListener('click', () => {
      searchUser(dom.searchInput.value);
    });

    dom.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchUser(dom.searchInput.value);
      }
    });

    dom.searchInput.addEventListener('input', () => {
      dom.btnClear.classList.toggle('visible', dom.searchInput.value.length > 0);
    });

    dom.btnClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      dom.btnClear.classList.remove('visible');
      dom.searchInput.focus();
    });

    dom.historyPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.history-pill');
      if (pill) {
        const username = pill.dataset.username;
        dom.searchInput.value = username;
        searchUser(username);
      }
    });

    dom.btnCopy.addEventListener('click', () => {
      const username = dom.btnCopy.dataset.username;
      if (username) copyProfileLink(username);
    });
  }

  // ─── Init ───
  function init() {
    cacheDom();
    loadTheme();
    loadHistory();
    renderHistory();
    setupEvents();
    showWelcome();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
