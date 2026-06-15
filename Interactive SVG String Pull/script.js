((w) => {
  const C = {
    COUNT: 6, HIT_R: 32, MAX_PULL: 140,
    K: 0.032, DAMP: 0.009,
    FREQ: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
    NOTES: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    OSC_TYPE: 'triangle', DECAY: 3.5, GAIN: 0.18
  };

  const $ = (id) => document.getElementById(id);
  const svg = $('stringSvg');
  const vp = $('viewport');
  const labels = $('noteLabels');
  const el = { tS: $('tStrings'), tT: $('tTension'), tD: $('tDamping'), tN: $('tNote') };

  /* ─── State ────────────────────────────────────────────── */
  const s = {
    strs: [],      // { x, y1, y2, cx, cy, disp, vel, freq, note, path, osc, grabbed, alive }
    active: -1,    // grabbed string index
    audio: null,   // AudioContext
    playing: false, // audio unlocked
    anim: null,
    lastNote: '',
    lastTime: 0
  };

  /* ─── SVG Point conversion ─────────────────────────────── */
  function svgPoint(ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* ─── Create strings ───────────────────────────────────── */
  function createStrings() {
    labels.innerHTML = '';
    svg.querySelectorAll('.string-path').forEach(p => p.remove());

    for (let i = 0; i < C.COUNT; i++) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'string-path');
      path.dataset.i = i;
      svg.appendChild(path);

      const label = document.createElement('div');
      label.className = 'note-label';
      label.textContent = C.NOTES[i];
      labels.appendChild(label);

      s.strs.push({
        x: 0, y1: 0, y2: 0, cx: 0, cy: 0,
        disp: 0, vel: 0, pluckY: 0,
        freq: C.FREQ[i], note: C.NOTES[i],
        path, label, grabbed: false, alive: false,
        osc: null
      });
    }
  }

  /* ─── Layout ───────────────────────────────────────────── */
  function layout() {
    const w = vp.clientWidth;
    const h = vp.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const gap = w / (C.COUNT + 1);

    s.strs.forEach((str, i) => {
      str.x = gap * (i + 1);
      str.y1 = 0;
      str.y2 = h;
      str.cx = str.x;
      str.cy = h * 0.5;
      if (!str.grabbed) str.disp = 0;
      writePath(i);
    });
  }

  /* ─── Path rendering ───────────────────────────────────── */
  function writePath(i) {
    const str = s.strs[i];
    const cx = str.x + str.disp;
    const cy = str.pluckY || str.y2 * 0.5;
    str.cx = cx;
    str.cy = cy;
    str.path.setAttribute('d', `M ${str.x} ${str.y1} Q ${cx} ${cy} ${str.x} ${str.y2}`);

    const t = Math.min(Math.abs(str.disp) / C.MAX_PULL, 1);
    if (t > 0.02) {
      const r = Math.round(255 * Math.min(t * 1.6, 1));
      const g = Math.round(240 * (1 - t * 0.85));
      const bl = Math.round(255 * (1 - t * 0.7));
      str.path.setAttribute('stroke', `rgb(${r},${g},${bl})`);
      str.path.setAttribute('stroke-width', String(1.5 + t * 2.5));
      str.path.style.filter = 'url(#glow)';
    } else {
      str.path.setAttribute('stroke', '#00f0ff');
      str.path.setAttribute('stroke-width', '1.5');
      str.path.style.filter = 'url(#glowSoft)';
    }
  }

  /* ─── Neighbour detection ──────────────────────────────── */
  function hitTest(px) {
    let best = -1, bestD = C.HIT_R;
    s.strs.forEach((str, i) => {
      const d = Math.abs(px - str.x);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  /* ─── Audio ────────────────────────────────────────────── */
  function resumeAudio() {
    if (s.audio) return;
    const AC = w.AudioContext || w.webkitAudioContext;
    s.audio = new AC();
  }

  function pluckAudio(i) {
    if (!s.audio || s.audio.state === 'suspended') return;
    const str = s.strs[i];
    const ctx = s.audio;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = C.OSC_TYPE;
    osc.frequency.setValueAtTime(str.freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(C.GAIN, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + C.DECAY);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + C.DECAY + 0.05);

    s.lastNote = str.note;
    el.tN.textContent = str.note;
    str.label.classList.add('active');
    setTimeout(() => str.label.classList.remove('active'), 400);
  }

  /* ─── Spring physics ───────────────────────────────────── */
  function stepPhysics() {
    let activeCount = 0;
    let maxT = 0;

    s.strs.forEach((str, i) => {
      if (str.grabbed) return;
      if (Math.abs(str.disp) < 0.3 && Math.abs(str.vel) < 0.08) {
        if (str.alive) {
          str.alive = false;
          str.disp = 0;
          str.vel = 0;
          writePath(i);
        }
        return;
      }

      const f = -C.K * str.disp - C.DAMP * str.vel;
      str.vel += f;
      str.disp += str.vel;
      str.alive = true;
      activeCount++;

      const t = Math.abs(str.disp);
      if (t > maxT) maxT = t;

      writePath(i);
    });

    el.tS.textContent = activeCount;
    el.tT.textContent = Math.round((maxT / C.MAX_PULL) * 100) + '%';
  }

  /* ─── Interaction ──────────────────────────────────────── */
  function grab(i, py) {
    if (i < 0 || i >= C.COUNT) return;
    const str = s.strs[i];
    if (str.grabbed) return;
    str.grabbed = true;
    str.alive = true;
    str.vel = 0;
    str.pluckY = Math.max(str.y1 + 4, Math.min(py, str.y2 - 4));
    s.active = i;
  }

  function drag(px, py) {
    if (s.active < 0) return;
    const str = s.strs[s.active];
    const dx = px - str.x;
    str.disp = Math.max(-C.MAX_PULL, Math.min(C.MAX_PULL, dx));
    str.pluckY = Math.max(str.y1 + 4, Math.min(py, str.y2 - 4));
    writePath(s.active);
  }

  function release(i) {
    if (i < 0) return;
    const str = s.strs[i];
    if (!str.grabbed) return;
    str.grabbed = false;
    s.active = -1;
    if (Math.abs(str.disp) > 0.5) {
      pluckAudio(i);
    }
  }

  /* ─── Event handlers ───────────────────────────────────── */
  function onDown(ev) {
    if (!s.playing) return;
    const p = svgPoint(ev);
    const i = hitTest(p.x);
    if (i >= 0) {
      grab(i, p.y);
      ev.preventDefault();
    }
  }

  function onMove(ev) {
    if (s.active < 0) return;
    const p = svgPoint(ev);
    drag(p.x, p.y);
    ev.preventDefault();
  }

  function onUp(ev) {
    if (s.active < 0) return;
    release(s.active);
    ev.preventDefault();
  }

  /* ─── Touch ────────────────────────────────────────────── */
  function tPos(ev) {
    const t = ev.touches[0];
    return svgPoint(t);
  }

  function onTouchStart(ev) {
    if (!s.playing) return;
    const p = tPos(ev);
    const i = hitTest(p.x);
    if (i >= 0) { grab(i, p.y); ev.preventDefault(); }
  }

  function onTouchMove(ev) {
    if (s.active < 0) return;
    const p = tPos(ev);
    drag(p.x, p.y);
    ev.preventDefault();
  }

  function onTouchEnd(ev) {
    if (s.active < 0) return;
    release(s.active);
  }

  /* ─── Loop ─────────────────────────────────────────────── */
  function tick(ts) {
    if (!s.playing) { s.anim = requestAnimationFrame(tick); return; }
    const dt = Math.min((ts - s.lastTime) / 16.67, 3);
    s.lastTime = ts;

    stepPhysics();
    s.anim = requestAnimationFrame(tick);
  }

  /* ─── Init ─────────────────────────────────────────────── */
  function init() {
    createStrings();
    layout();

    el.tD.textContent = C.DAMP.toFixed(3);

    svg.addEventListener('mousedown', onDown);
    w.addEventListener('mousemove', onMove);
    w.addEventListener('mouseup', onUp);

    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    w.addEventListener('touchmove', onTouchMove, { passive: false });
    w.addEventListener('touchend', onTouchEnd);

    w.addEventListener('resize', layout);

    $('splashBtn').addEventListener('click', () => {
      resumeAudio();
      if (s.audio) {
        s.audio.resume && s.audio.resume();
        s.playing = true;
        $('splash').classList.add('hidden');
        s.lastTime = performance.now();
        s.anim = requestAnimationFrame(tick);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
