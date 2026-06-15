((w) => {
  const MAX_DEPTH = 8;
  const ICONS = [
    { name: 'System Drive', cls: 'drive' },
    { name: 'Recursive Network', cls: 'network' },
    { name: 'Trash Console', cls: 'trash' }
  ];

  const $ = (id) => document.getElementById(id);
  const rootChildren = $('rootChildren');
  const rootClock = $('rootClock');
  const el = { depth: $('tDepth'), count: $('tCount'), peak: $('tPeak') };

  const state = { windows: [], nextZ: 100, maxDepth: 0, wId: 0 };

  /* ─── Clock ─────────────────────────────────────────────── */
  function tickClocks() {
    const now = new Date();
    const ts = String(now.getHours()).padStart(2, '0') + ':' +
               String(now.getMinutes()).padStart(2, '0') + ':' +
               String(now.getSeconds()).padStart(2, '0');
    rootClock.textContent = ts;
    document.querySelectorAll('.clock').forEach(el2 => { if (el2 !== rootClock) el2.textContent = ts; });
  }

  /* ─── Telemetry ─────────────────────────────────────────── */
  function updateTelemetry() {
    const cnt = state.windows.length;
    el.count.textContent = cnt;
    el.peak.textContent = 'Layer ' + state.maxDepth;
  }

  /* ─── Create icon set ───────────────────────────────────── */
  function buildIcons(container, depth, openFn) {
    ICONS.forEach(ic => {
      const item = document.createElement('div');
      item.className = 'icon-item';
      item.dataset.name = ic.name;
      const shape = document.createElement('div');
      shape.className = 'icon-shape ' + ic.cls;
      const label = document.createElement('span');
      label.className = 'icon-label';
      label.textContent = ic.name;
      item.appendChild(shape);
      item.appendChild(label);
      item.addEventListener('dblclick', () => openFn(container, depth));
      container.appendChild(item);
    });
  }

  /* ─── Build a window ────────────────────────────────────── */
  function openFolder(parentChildren, parentDepth) {
    const depth = parentDepth + 1;
    if (depth > MAX_DEPTH) return;
    if (depth > state.maxDepth) state.maxDepth = depth;

    const wrap = document.createElement('div');
    wrap.className = 'window';
    wrap.dataset.depth = depth;

    const pRect = parentChildren.getBoundingClientRect();
    const winW = pRect.width * 0.75;
    const winH = pRect.height * 0.68;
    const offX = (state.windows.length % 6) * 12;
    const offY = (state.windows.length % 6) * 8;
    const lx = (pRect.width - winW) / 2 + offX;
    const ty = (pRect.height - winH) / 3 + offY;

    wrap.style.cssText = `left:${lx}px;top:${ty}px;width:${winW}px;height:${winH}px;z-index:${state.nextZ}`;
    const myZ = state.nextZ++;

    /* ── Title bar ── */
    const title = document.createElement('div');
    title.className = 'win-titlebar';

    const dots = document.createElement('div');
    dots.className = 'win-dots';

    const closeBtn = document.createElement('div');
    closeBtn.className = 'dot close';
    const minBtn = document.createElement('div');
    minBtn.className = 'dot minimize';
    const maxBtn = document.createElement('div');
    maxBtn.className = 'dot maximize';

    dots.appendChild(closeBtn);
    dots.appendChild(minBtn);
    dots.appendChild(maxBtn);

    const titleText = document.createElement('span');
    titleText.className = 'win-title-text';
    titleText.textContent = ICONS[state.wId % ICONS.length].name + ' -- Depth ' + depth;

    title.appendChild(dots);
    title.appendChild(titleText);
    wrap.appendChild(title);

    /* ── Body ── */
    const body = document.createElement('div');
    body.className = 'win-body';

    const iconsArea = document.createElement('div');
    iconsArea.className = 'desk-icons';
    const childArea = document.createElement('div');
    childArea.className = 'win-children';
    const taskbar = document.createElement('div');
    taskbar.className = 'desk-taskbar';
    const tbL = document.createElement('span');
    tbL.className = 'tb-left';
    tbL.textContent = 'DEPTH ' + depth;
    const tbR = document.createElement('span');
    tbR.className = 'tb-right clock';
    tbR.textContent = '00:00:00';
    taskbar.appendChild(tbL);
    taskbar.appendChild(tbR);
    body.appendChild(iconsArea);
    body.appendChild(childArea);
    body.appendChild(taskbar);
    wrap.appendChild(body);

    parentChildren.appendChild(wrap);

    /* ── Recursive icons ── */
    buildIcons(iconsArea, depth, () => openFolder(childArea, depth));

    /* ── Focus (bring to front) ── */
    const focus = () => {
      wrap.classList.add('focused');
      wrap.style.zIndex = state.nextZ++;
      document.querySelectorAll('.window').forEach(wi => { if (wi !== wrap) wi.classList.remove('focused'); });
    };
    wrap.addEventListener('mousedown', focus);
    wrap.addEventListener('touchstart', focus, { passive: true });

    /* ── Drag ── */
    let drag = null;
    const onDown = (e) => {
      if (e.target.classList.contains('dot')) return;
      const r = wrap.getBoundingClientRect();
      const pr = parentChildren.getBoundingClientRect();
      drag = { ox: e.clientX - r.left, oy: e.clientY - r.top, pl: pr.left, pt: pr.top, pw: pr.width, ph: pr.height };
      focus();
      e.preventDefault();
    };
    title.addEventListener('mousedown', onDown);

    w.addEventListener('mousemove', (e) => {
      if (!drag) return;
      let x = e.clientX - drag.ox - drag.pl;
      let y = e.clientY - drag.oy - drag.pt;
      x = Math.max(0, Math.min(x, drag.pw - wrap.offsetWidth));
      y = Math.max(0, Math.min(y, drag.ph - wrap.offsetHeight));
      wrap.style.left = x + 'px';
      wrap.style.top = y + 'px';
    });
    w.addEventListener('mouseup', () => { drag = null; });

    /* ── Touch drag ── */
    let tDrag = null;
    title.addEventListener('touchstart', (e) => {
      if (e.target.classList.contains('dot')) return;
      const t = e.touches[0];
      const r = wrap.getBoundingClientRect();
      const pr = parentChildren.getBoundingClientRect();
      tDrag = { ox: t.clientX - r.left, oy: t.clientY - r.top, pl: pr.left, pt: pr.top, pw: pr.width, ph: pr.height };
      focus();
    }, { passive: true });

    w.addEventListener('touchmove', (e) => {
      if (!tDrag) return;
      const t = e.touches[0];
      let x = t.clientX - tDrag.ox - tDrag.pl;
      let y = t.clientY - tDrag.oy - tDrag.pt;
      x = Math.max(0, Math.min(x, tDrag.pw - wrap.offsetWidth));
      y = Math.max(0, Math.min(y, tDrag.ph - wrap.offsetHeight));
      wrap.style.left = x + 'px';
      wrap.style.top = y + 'px';
    }, { passive: true });
    w.addEventListener('touchend', () => { tDrag = null; }, { passive: true });

    /* ── Controls ── */
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.remove();
      state.windows = state.windows.filter(wi => wi.id !== wid);
      updateTelemetry();
    });

    let maxed = false;
    let prevRect = null;
    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!maxed) {
        prevRect = { l: wrap.style.left, t: wrap.style.top, w: wrap.style.width, h: wrap.style.height };
        wrap.classList.add('maximized');
        maxed = true;
      } else {
        wrap.classList.remove('maximized');
        if (prevRect) {
          wrap.style.left = prevRect.l;
          wrap.style.top = prevRect.t;
          wrap.style.width = prevRect.w;
          wrap.style.height = prevRect.h;
        }
        maxed = false;
      }
    });

    let minned = false;
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!minned) {
        wrap.classList.add('hidden-win');
        minned = true;
      } else {
        wrap.classList.remove('hidden-win');
        minned = false;
      }
    });

    /* ── Register ── */
    const wid = state.wId++;
    state.windows.push({ id: wid, el: wrap, depth });
    updateTelemetry();
  }

  /* ─── Init root icons ──────────────────────────────────── */
  function initRootIcons() {
    const iconsArea = $('desktopIcons');
    iconsArea.querySelectorAll('.icon-item').forEach(item => {
      item.addEventListener('dblclick', () => openFolder(rootChildren, 0));
    });
  }

  /* ─── Init ─────────────────────────────────────────────── */
  function init() {
    initRootIcons();
    tickClocks();
    setInterval(tickClocks, 1000);
    updateTelemetry();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
