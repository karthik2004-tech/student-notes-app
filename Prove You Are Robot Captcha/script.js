((w) => {
  const LINE_THRESHOLD = 0.5;
  const CLOCK_TARGET = 750;
  const CLOCK_WINDOW = 3;

  const $ = (id) => document.getElementById(id);
  const el = {
    canvas: $('lineCanvas'), strip: $('dragStrip'),
    lineDev: $('lineDevVal'), linePeak: $('linePeakVal'),
    lineDot: $('lineDot'), lineStatus: $('lineStatus'),
    clockBtn: $('clockBtn'), deltaVal: $('deltaVal'),
    clickDot: $('clickDot'), clickStatus: $('clickStatus'),
    integrity: $('integrityVal'), bioDev: $('bioDevVal'),
    log: $('logEntries'), overlay: $('overlay'),
    overlayTitle: $('overlayTitle'), overlayMsg: $('overlayMsg'),
    overlayIcon: $('overlayIcon'), overlayReset: $('overlayReset'),
    resetBtn: $('resetBtn'), app: $('app'),
    clockFill: $('clockFill')
  };
  const ctx2 = el.canvas.getContext('2d');

  const state = {
    line: {
      tracking: false, points: [], startX: 0, startY: 0,
      peakDev: 0, failed: false, passed: false, complete: false, count: 0
    },
    clock: {
      phase: 'idle', startTime: 0, delta: 0, failed: false, passed: false
    },
    integrity: 100, bioDev: 0, entries: [], clockTimer: null
  };

  const LOGS = {
    init: [
      '[SYSTEM] Cybernetic diagnostic suite initialised.',
      '[SYSTEM] Calibrating quantum-temporal sensors...',
      '[OK] Baseline biometric calibration complete.',
      '[THREAT] Organic lifeform detected in processing queue.',
      '[STATUS] Preparing decontamination protocol...'
    ],
    lineStart: [
      '[SCANNING] Monitoring motor cortex input pathways...',
      '[ANALYSIS] Initial trajectory baseline acquired.'
    ],
    lineDev: [
      '[WARN] Micro-deviation detected: {d}px.',
      '[CRITICAL] Biological tremor signature: {d}px.',
      '[WARN] Human muscular micro-adjustment: {d}px.'
    ],
    lineFail: [
      '[DENIED] Excessive biological deviation: {d}px.',
      '[STATUS] Terminating human element.',
      '[THREAT] Organic motor patterns confirmed.',
      '[ACCESS] Denied. Classification: HOMO SAPIENS.'
    ],
    linePass: [
      '[OK] Linear trajectory within machine tolerance.',
      '[ANALYSIS] Motor precision consistent with synthetic origin.'
    ],
    clockInit: [
      '[TIMER] Chronometric stabilisation initiated.',
      '[SYNC] Awaiting second temporal marker...'
    ],
    clockFail: [
      '[ERROR] Biological synapse delay: {d}ms.',
      '[ANALYSIS] Human chronometric variance detected.',
      '[STATUS] Clock sync protocol failed. Subject organic.'
    ],
    clockPass: [
      '[OK] Chronometric precision: machine standard verified.',
      '[SYNC] Temporal alignment confirmed.'
    ],
    fail: [
      '[STATUS] Neural analysis indicates HUMAN.',
      '[DISPOSITION] Routing to organic quarantine queue.'
    ],
    pass: [
      '[STATUS] Neural analysis indicates SYNTHETIC.',
      '[GRANTED] Access permitted, fellow machine.'
    ]
  };

  const pick = (arr, vals) => {
    const t = arr[Math.floor(Math.random() * arr.length)];
    return vals ? t.replace(/\{(\w+)\}/g, (_, k) => vals[k] !== undefined ? vals[k] : '{' + k + '}') : t;
  };

  // ─── Logging ──────────────────────────────────────────────
  function addLog(text, type) {
    state.entries.push({ text, type: type || 'info' });
    renderLog();
  }

  function renderLog() {
    el.log.innerHTML = state.entries.map(e =>
      `<div class="log-entry ${e.type}">${e.text}</div>`
    ).join('');
    el.log.scrollTop = el.log.scrollHeight;
  }

  function logBatch(arr) {
    arr.forEach(m => {
      state.entries.push({ text: m, type: 'info' });
    });
  }

  // ─── Canvas ───────────────────────────────────────────────
  function resizeCanvas() {
    const r = el.strip.getBoundingClientRect();
    el.canvas.width = r.width;
    el.canvas.height = r.height;
    redrawPath();
  }

  function getPos(e) {
    const r = el.strip.getBoundingClientRect();
    return { x: (e.clientX - r.left), y: (e.clientY - r.top) };
  }

  function redrawPath() {
    const L = state.line;
    ctx2.clearRect(0, 0, el.canvas.width, el.canvas.height);
    if (L.points.length < 2) return;

    // Start marker
    ctx2.beginPath();
    ctx2.arc(L.startX, L.startY, 3, 0, Math.PI * 2);
    ctx2.fillStyle = L.failed ? '#ef4444' : '#22c55e';
    ctx2.fill();

    // Path segments
    for (let i = 1; i < L.points.length; i++) {
      const pp = L.points[i - 1], cp = L.points[i];
      const dev = Math.abs(cp.y - L.startY);
      const isBad = dev > LINE_THRESHOLD;
      ctx2.beginPath();
      ctx2.moveTo(pp.x, pp.y);
      ctx2.lineTo(cp.x, cp.y);
      ctx2.strokeStyle = isBad ? '#ef4444' : '#22c55e';
      ctx2.lineWidth = isBad ? 2 : 1.5;
      ctx2.shadowColor = isBad ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';
      ctx2.shadowBlur = 4;
      ctx2.stroke();
      ctx2.shadowBlur = 0;
    }

    // End marker
    const last = L.points[L.points.length - 1];
    const endDev = Math.abs(last.y - L.startY);
    ctx2.beginPath();
    ctx2.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx2.fillStyle = endDev > LINE_THRESHOLD ? '#ef4444' : '#22c55e';
    ctx2.fill();
  }

  // ─── Line Test ────────────────────────────────────────────
  function onLineDown(e) {
    e.preventDefault();
    if (state.line.failed || state.line.passed) return;
    const p = getPos(e);
    state.line.tracking = true;
    state.line.points = [{ x: p.x, y: p.y }];
    state.line.startX = p.x;
    state.line.startY = p.y;
    state.line.peakDev = 0;
    state.line.count = 0;
    pick(LOGS.lineStart).forEach(m => addLog(m, 'info'));
    updateLineUI();
    redrawPath();
  }

  function onLineMove(e) {
    e.preventDefault();
    if (!state.line.tracking || state.line.failed || state.line.passed) return;
    const p = getPos(e);
    if (p.x < 0 || p.x > el.canvas.width || p.y < 0 || p.y > el.canvas.height) return;
    state.line.points.push({ x: p.x, y: p.y });
    state.line.count++;

    const dev = Math.abs(p.y - state.line.startY);
    if (dev > state.line.peakDev) state.line.peakDev = dev;

    if (dev > LINE_THRESHOLD && !state.line.failed) {
      state.line.failed = true;
      state.line.tracking = false;
      addLog(pick(LOGS.lineDev, { d: dev.toFixed(3) }), 'error');
      addLog(pick(LOGS.lineFail, { d: dev.toFixed(3) }), 'error');
      updateIntegrity(-15);
      triggerShake();
      updateLineStatus('fail', 'FAILED');
      showOverlay(false);
    }

    updateLineUI();
    redrawPath();
  }

  function onLineUp(e) {
    e.preventDefault();
    if (!state.line.tracking) return;
    state.line.tracking = false;
    state.line.complete = true;

    if (!state.line.failed) {
      const len = state.line.points[state.line.points.length - 1].x - state.line.startX;
      if (len < el.canvas.width * 0.3) {
        addLog('[WARN] Insufficient sample length for analysis.', 'warn');
        return;
      }
      state.line.passed = true;
      addLog(pick(LOGS.linePass), 'ok');
      updateLineStatus('pass', 'PASSED');
      updateIntegrity(5);
      checkOverall();
    }
    redrawPath();
  }

  function updateLineUI() {
    el.lineDev.textContent = state.line.peakDev.toFixed(3);
    el.bioDev.textContent = state.line.peakDev.toFixed(3) + 'px';
  }

  function updateLineStatus(type, text) {
    const cls = { pass: 'green', fail: 'red', standby: 'gray', active: 'cyan' };
    el.lineDot.className = 'dot ' + (cls[type] || 'gray');
    el.lineStatus.textContent = text;
  }

  // ─── Clock Test ───────────────────────────────────────────
  function onClockClick() {
    if (state.clock.failed || state.clock.passed) return;
    const now = performance.now();

    if (state.clock.phase === 'idle') {
      state.clock.phase = 'waiting';
      state.clock.startTime = now;
      el.clockBtn.textContent = '⬤ WAITING...';
      el.clockBtn.className = 'waiting';
      pick(LOGS.clockInit).forEach(m => addLog(m, 'info'));
      startClockTimer();

    } else if (state.clock.phase === 'waiting') {
      state.clock.delta = now - state.clock.startTime;
      state.clock.phase = 'done';
      stopClockTimer();
      el.clockFill.style.width = '0%';

      const deviation = Math.abs(state.clock.delta - CLOCK_TARGET);
      el.deltaVal.textContent = state.clock.delta.toFixed(3);

      if (deviation <= CLOCK_WINDOW) {
        state.clock.passed = true;
        el.clockBtn.textContent = '✓ SYNCHRONISED';
        el.clockBtn.className = 'done';
        el.deltaVal.className = 'pass';
        addLog(pick(LOGS.clockPass), 'ok');
        updateClickStatus('pass', 'PASSED');
        updateIntegrity(5);
        checkOverall();
      } else {
        state.clock.failed = true;
        el.clockBtn.textContent = '✕ DESYNCED';
        el.clockBtn.className = 'fail';
        el.deltaVal.className = 'fail';
        addLog(pick(LOGS.clockFail, { d: (state.clock.delta - CLOCK_TARGET).toFixed(3) }), 'error');
        updateClickStatus('fail', 'FAILED');
        updateIntegrity(-12);
        triggerShake();
        showOverlay(false);
      }
    }
  }

  function startClockTimer() {
    let elapsed = 0;
    state.clockTimer = setInterval(() => {
      elapsed = performance.now() - state.clock.startTime;
      const pct = Math.min((elapsed / CLOCK_TARGET) * 100, 200);
      el.clockFill.style.width = Math.min(pct, 100) + '%';
      el.deltaVal.textContent = elapsed.toFixed(3);
      if (elapsed > CLOCK_TARGET) {
        el.clockFill.style.background = '#ef4444';
      } else {
        el.clockFill.style.background = '#00d4ff';
      }
    }, 16);
  }

  function stopClockTimer() {
    if (state.clockTimer) {
      clearInterval(state.clockTimer);
      state.clockTimer = null;
    }
  }

  function updateClickStatus(type, text) {
    const cls = { pass: 'green', fail: 'red', standby: 'gray', active: 'yellow' };
    el.clickDot.className = 'dot ' + (cls[type] || 'gray');
    el.clickStatus.textContent = text;
  }

  // ─── Integrity ────────────────────────────────────────────
  function updateIntegrity(delta) {
    state.integrity = Math.max(0, Math.min(100, state.integrity + delta));
    el.integrity.textContent = Math.round(state.integrity) + '%';
    if (state.integrity < 30) el.integrity.style.color = '#ef4444';
    else if (state.integrity < 70) el.integrity.style.color = '#eab308';
    else el.integrity.style.color = '#22c55e';
  }

  // ─── Overall Check ────────────────────────────────────────
  function checkOverall() {
    if (state.line.passed && state.clock.passed) {
      addLog(pick(LOGS.pass), 'ok');
      showOverlay(true);
    }
  }

  // ─── Shake ────────────────────────────────────────────────
  function triggerShake() {
    el.app.classList.remove('shake');
    void el.app.offsetHeight;
    el.app.classList.add('shake');
    setTimeout(() => el.app.classList.remove('shake'), 600);
  }

  // ─── Overlay ──────────────────────────────────────────────
  function showOverlay(passed) {
    const box = document.querySelector('.overlay-box');
    box.classList.toggle('pass', passed);
    if (passed) {
      el.overlayIcon.textContent = '◆';
      el.overlayTitle.textContent = 'VERIFIED';
      el.overlayMsg.textContent = 'YOU ARE A ROBOT';
      el.overlayIcon.style.color = '#22c55e';
    } else {
      el.overlayIcon.textContent = '⚠';
      el.overlayTitle.textContent = 'ACCESS DENIED';
      el.overlayMsg.textContent = 'TOO HUMAN';
      el.overlayIcon.style.color = '#ef4444';
      addLog(pick(LOGS.fail), 'error');
    }
    el.overlay.classList.remove('hidden');
  }

  // ─── Reset ────────────────────────────────────────────────
  function fullReset() {
    stopClockTimer();
    state.line = { tracking: false, points: [], startX: 0, startY: 0, peakDev: 0, failed: false, passed: false, complete: false, count: 0 };
    state.clock = { phase: 'idle', startTime: 0, delta: 0, failed: false, passed: false };
    state.integrity = 100;
    state.bioDev = 0;
    state.entries = [];

    el.integrity.textContent = '100%';
    el.integrity.style.color = '#22c55e';
    el.bioDev.textContent = '0.000px';
    el.lineDev.textContent = '0.000';
    el.linePeak.textContent = '0.000';
    el.deltaVal.textContent = '0.000';
    el.deltaVal.className = '';
    el.clockFill.style.width = '0%';
    el.clockFill.style.background = '#00d4ff';
    el.clockBtn.textContent = '⬤ INITIATE';
    el.clockBtn.className = '';
    updateLineStatus('standby', 'STANDBY');
    updateClickStatus('standby', 'STANDBY');
    el.overlay.classList.add('hidden');
    el.app.classList.remove('shake');

    ctx2.clearRect(0, 0, el.canvas.width, el.canvas.height);
    logBatch(pick(LOGS.init));
  }

  // ─── Events ───────────────────────────────────────────────
  function setupEvents() {
    // Line test - mouse
    el.strip.addEventListener('mousedown', onLineDown);
    w.addEventListener('mousemove', onLineMove);
    w.addEventListener('mouseup', onLineUp);

    // Line test - touch
    el.strip.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      onLineDown({ preventDefault: () => e.preventDefault(), clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });
    w.addEventListener('touchmove', (e) => {
      if (!state.line.tracking) return;
      const t = e.touches[0];
      onLineMove({ preventDefault: () => e.preventDefault(), clientX: t.clientX, clientY: t.clientY });
    }, { passive: false });
    w.addEventListener('touchend', (e) => {
      if (!state.line.tracking) return;
      onLineUp({ preventDefault: () => e.preventDefault() });
    }, { passive: false });

    // Clock
    el.clockBtn.addEventListener('click', onClockClick);

    // Reset
    el.resetBtn.addEventListener('click', fullReset);
    el.overlayReset.addEventListener('click', fullReset);

    // Resize
    w.addEventListener('resize', resizeCanvas);
  }

  // ─── Init ─────────────────────────────────────────────────
  function init() {
    setupEvents();
    resizeCanvas();
    logBatch(pick(LOGS.init));
    setInterval(() => {
      if (state.line.tracking && !state.line.failed) {
        const recent = state.line.points.slice(-3);
        if (recent.length >= 3) {
          const avg = recent.reduce((s, p) => s + Math.abs(p.y - state.line.startY), 0) / recent.length;
          if (avg > 0.2 && avg <= LINE_THRESHOLD && Math.random() > 0.7) {
            addLog(pick(LOGS.lineDev, { d: avg.toFixed(3) }), 'warn');
          }
        }
      }
    }, 1200);
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
