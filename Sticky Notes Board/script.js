/* ═══════════════════════════════════════════════════════
   Sticky Notes Board — Client-Side Engine
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ───
  const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
  const STORAGE_KEY = 'stickyNotesBoard';
  const THEME_KEY = 'stickyNotesTheme';
  const MAX_CHARS = 200;
  const COLORS = [
    { name: 'yellow', value: '#fef08a' },
    { name: 'mint',   value: '#bbf7d0' },
    { name: 'pink',   value: '#fbcfe8' },
    { name: 'blue',   value: '#bfdbfe' },
    { name: 'lavender', value: '#e0d4fc' },
    { name: 'peach',  value: '#fed7aa' },
  ];

  const ROTATIONS = [0, 1, 2, 3, 4];

  // ─── State ───
  let notes = [];
  let rotationIdx = 0;

  // ─── DOM ───
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const dom = {};

  function cacheDom() {
    dom.html = document.documentElement;
    dom.themeToggle = $('#theme-toggle');
    dom.searchInput = $('#search-input');
    dom.btnAdd = $('#btn-add');
    dom.corkboard = $('#corkboard');
  }

  // ─── Theme ───
  function loadTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      dom.html.setAttribute('data-theme', saved);
    }
  }

  function toggleTheme() {
    const cur = dom.html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    dom.html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  // ─── Storage ───
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) notes = parsed;
      }
    } catch { notes = []; }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch { /* ignore */ }
  }

  // ─── Helpers ───
  function getNextRotation() {
    const r = ROTATIONS[rotationIdx % ROTATIONS.length];
    rotationIdx++;
    return r;
  }

  function formatTimestamp(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getCharState(len) {
    if (len >= MAX_CHARS) return 'danger';
    if (len >= MAX_CHARS * 0.8) return 'warn';
    return '';
  }

  function getDefaultColor() {
    return COLORS[0].value;
  }

  // ─── CRUD ───
  function addNote() {
    const now = new Date().toISOString();
    const note = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: '',
      color: getDefaultColor(),
      createdAt: now,
      updatedAt: now,
      rotation: getNextRotation(),
    };
    notes.unshift(note);
    saveState();
    render();
    // focus the new note
    requestAnimationFrame(() => {
      const el = dom.corkboard.querySelector(`[data-id="${note.id}"] .note-body`);
      if (el) el.focus();
    });
  }

  function deleteNote(id) {
    notes = notes.filter((n) => n.id !== id);
    saveState();
    render();
  }

  function updateNoteText(id, text) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS);
    }
    note.text = text;
    note.updatedAt = new Date().toISOString();
    saveState();
    // update char count and footer in place without full re-render
    const card = dom.corkboard.querySelector(`[data-id="${id}"]`);
    if (card) {
      const cc = card.querySelector('.char-count');
      if (cc) {
        const len = text.length;
        cc.textContent = `${len}/${MAX_CHARS}`;
        cc.className = 'char-count' + (getCharState(len) ? ' ' + getCharState(len) : '');
      }
      const footer = card.querySelector('.note-footer');
      if (footer) footer.textContent = formatTimestamp(note.updatedAt);
    }
  }

  function updateNoteColor(id, color) {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    note.color = color;
    saveState();
    const card = dom.corkboard.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.style.background = color;
      card.querySelectorAll('.color-swatch').forEach((sw) => {
        sw.classList.toggle('active', sw.dataset.color === color);
      });
    }
  }

  // ─── Render ───
  function render() {
    const query = dom.searchInput.value.toLowerCase().trim();

    if (notes.length === 0) {
      dom.corkboard.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📌</div>
          <p>No notes yet.<br />Click <strong>+ Add Note</strong> to get started.</p>
        </div>`;
      return;
    }

    dom.corkboard.innerHTML = notes
      .map((note) => {
        const len = note.text.length;
        const charState = getCharState(len);
        const visible = !query || note.text.toLowerCase().includes(query);
        const swatches = COLORS
          .map((c) =>
            `<span class="color-swatch${c.value === note.color ? ' active' : ''}"
                   data-color="${c.value}"
                   style="background:${c.value}"
                   title="${c.name}"></span>`
          )
          .join('');

        return `<div class="note${visible ? ' matched' : ' hidden'}"
                     data-id="${note.id}"
                     data-rotate="${note.rotation}"
                     style="background:${note.color}">
          <div class="note-header">
            <div class="note-tools">
              <div class="color-swatches">${swatches}</div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="char-count${charState ? ' ' + charState : ''}">${len}/${MAX_CHARS}</span>
              <button class="btn-delete" data-action="delete" data-id="${note.id}" title="Delete note">🗑</button>
            </div>
          </div>
          <div class="note-body"
               contenteditable="true"
               data-placeholder="Write something..."
               data-id="${note.id}">${escapeHTML(note.text)}</div>
          <div class="note-footer">${formatTimestamp(note.updatedAt)}</div>
        </div>`;
      })
      .join('');

    // trim overlong text in contenteditable (from paste etc)
    dom.corkboard.querySelectorAll('.note-body').forEach((el) => {
      if (el.textContent.length > MAX_CHARS) {
        el.textContent = el.textContent.slice(0, MAX_CHARS);
      }
    });
  }

  // ─── Search / Filter ───
  function applyFilter() {
    const query = dom.searchInput.value.toLowerCase().trim();
    const cards = dom.corkboard.querySelectorAll('.note');
    cards.forEach((card) => {
      const id = card.dataset.id;
      const note = notes.find((n) => n.id === id);
      const match = !query || (note && note.text.toLowerCase().includes(query));
      card.classList.toggle('matched', match);
      card.classList.toggle('hidden', !match);
    });
  }

  // ─── Events ───
  function setupEvents() {
    dom.themeToggle.addEventListener('click', toggleTheme);

    dom.btnAdd.addEventListener('click', addNote);

    // Global keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        addNote();
      }
    });

    // Search with real-time filter
    dom.searchInput.addEventListener('input', applyFilter);

    // Corkboard delegation
    dom.corkboard.addEventListener('click', (e) => {
      // Delete button
      const del = e.target.closest('[data-action="delete"]');
      if (del) {
        e.stopPropagation();
        deleteNote(del.dataset.id);
        return;
      }

      // Color swatch
      const swatch = e.target.closest('.color-swatch');
      if (swatch) {
        e.stopPropagation();
        const id = swatch.closest('.note').dataset.id;
        updateNoteColor(id, swatch.dataset.color);
      }
    });

    // Contenteditable input (auto-save on keystroke)
    dom.corkboard.addEventListener('input', (e) => {
      const body = e.target.closest('.note-body');
      if (!body) return;
      const id = body.dataset.id;
      let text = body.textContent;

      // enforce max chars on input
      if (text.length > MAX_CHARS) {
        text = text.slice(0, MAX_CHARS);
        body.textContent = text;
        // place cursor at end
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(body);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      updateNoteText(id, text);
      // re-apply filter in case text now matches
      applyFilter();
    });

    // Prevent paste from exceeding limit
    dom.corkboard.addEventListener('paste', (e) => {
      const body = e.target.closest('.note-body');
      if (!body) return;
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      const current = body.textContent;
      const combined = current + text;
      if (combined.length > MAX_CHARS) {
        body.textContent = combined.slice(0, MAX_CHARS);
      } else {
        body.textContent = combined;
      }
      const id = body.dataset.id;
      updateNoteText(id, body.textContent);
      applyFilter();
    });

    // Prevent dropping non-text content
    dom.corkboard.addEventListener('drop', (e) => {
      const body = e.target.closest('.note-body');
      if (body) e.preventDefault();
    });
  }

  // ─── Init ───
  function init() {
    cacheDom();
    loadTheme();
    loadState();
    render();
    setupEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
