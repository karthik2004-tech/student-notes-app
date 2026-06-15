((w) => {
  const C = {
    W: 640, H: 400,
    BOW_X: 70, BOW_Y: 200,
    TARGET_X: 560,
    OUTER_R: 60, INNER_R: 35, BULLSEYE_R: 15,
    GRAVITY: 0.18, MAX_ARROWS: 15, MAX_POWER: 280, MAX_SPEED: 10,
    TRAIL_LEN: 14,
    diff: {
      easy:   { speed: 0.5, wind: 0.15, label: 'EASY' },
      medium: { speed: 1.2, wind: 0.45, label: 'MED'  },
      hard:   { speed: 2.0, wind: 0.80, label: 'HARD' }
    }
  };

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');
  const el = {
    score: $('scoreDisplay'), arrows: $('arrowsDisplay'),
    acc: $('accDisplay'), best: $('bestDisplay'),
    modal: $('modal'), fScore: $('finalScore'), fAcc: $('finalAcc'),
    fHits: $('finalHits'), fBest: $('finalBest'),
    breakdown: $('breakdown'), restart: $('restartBtn'),
    info: $('infoMsg')
  };

  const s = {
    score: 0, arrows: C.MAX_ARROWS, hits: 0, shots: 0,
    best: parseInt(localStorage.getItem('archeryBest')) || 0,
    diff: 'easy', phase: 'ready',
    target: { x: C.TARGET_X, y: 200, dir: 1, t: 0 },
    aim: { active: false, angle: 0, power: 0, mx: 0, my: 0 },
    arrow: null, particles: [], floats: [], markers: [], wind: 0,
    animId: null, lastTime: 0, ringCounts: { bullseye: 0, inner: 0, outer: 0 }
  };

  const diffData = () => C.diff[s.diff];

  function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }
  function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (C.W / r.width),
      y: (e.clientY - r.top)  * (C.H / r.height)
    };
  }

  function genWind() {
    const r = diffData().wind;
    s.wind = (Math.random() - 0.5) * 2 * r;
  }

  function getRing(d) {
    if (d <= C.BULLSEYE_R) return { name: 'bullseye', pts: 100, clr: '#ffd700', cls: 'bullseye' };
    if (d <= C.INNER_R)    return { name: 'inner',   pts: 50,  clr: '#ef4444', cls: 'inner' };
    return                         { name: 'outer',   pts: 20,  clr: '#3b82f6', cls: 'outer' };
  }

  // ─── Drawing ─────────────────────────────────────────────────
  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, '#03050a');
    g.addColorStop(0.7, '#080c18');
    g.addColorStop(1, '#0a0e1a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.W, C.H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < C.W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke();
    }
    for (let y = 0; y < C.H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke();
    }

    // Ground
    ctx.fillStyle = '#080b14';
    ctx.fillRect(0, C.H - 24, C.W, 24);
    ctx.strokeStyle = 'rgba(0,255,200,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, C.H - 24); ctx.lineTo(C.W, C.H - 24); ctx.stroke();

    // Grass blades
    ctx.strokeStyle = 'rgba(0,255,200,0.05)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 60; i++) {
      const gx = (i / 60) * C.W;
      const gh = 4 + Math.random() * 10;
      ctx.beginPath(); ctx.moveTo(gx, C.H - 24); ctx.lineTo(gx + (Math.random() - 0.5) * 4, C.H - 24 - gh); ctx.stroke();
    }
  }

  function drawTarget() {
    const tx = C.TARGET_X, ty = s.target.y;
    // Glow
    const gr = ctx.createRadialGradient(tx, ty, 0, tx, ty, C.OUTER_R * 1.3);
    gr.addColorStop(0, 'rgba(0,255,200,0.04)');
    gr.addColorStop(1, 'rgba(0,255,200,0)');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(tx, ty, C.OUTER_R * 1.3, 0, Math.PI * 2); ctx.fill();

    // Mount post
    ctx.strokeStyle = 'rgba(100,116,139,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx, ty + C.OUTER_R); ctx.lineTo(tx, C.H - 24); ctx.stroke();
    ctx.strokeStyle = 'rgba(100,116,139,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx - 6, C.H - 24); ctx.lineTo(tx + 6, C.H - 24); ctx.stroke();

    // Target stand
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tx - 20, C.H - 28, 40, 4);
    ctx.fillRect(tx - 3, C.H - 28, 6, 6);

    // Shadow
    ctx.beginPath(); ctx.arc(tx + 3, ty + 3, C.OUTER_R, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();

    // Outer
    ctx.beginPath(); ctx.arc(tx, ty, C.OUTER_R, 0, Math.PI * 2);
    ctx.fillStyle = '#1e3a5f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth = 1.5; ctx.stroke();

    // Blue ring
    ctx.beginPath(); ctx.arc(tx, ty, C.OUTER_R - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1; ctx.stroke();

    // Inner ring
    ctx.beginPath(); ctx.arc(tx, ty, C.INNER_R, 0, Math.PI * 2);
    ctx.fillStyle = '#5f1e1e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(239,68,68,0.3)';
    ctx.lineWidth = 1.5; ctx.stroke();

    // Inner detail
    ctx.beginPath(); ctx.arc(tx, ty, C.INNER_R - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1; ctx.stroke();

    // Bullseye
    ctx.beginPath(); ctx.arc(tx, ty, C.BULLSEYE_R, 0, Math.PI * 2);
    ctx.fillStyle = '#8b6914';
    ctx.fill();

    ctx.beginPath(); ctx.arc(tx, ty, C.BULLSEYE_R - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();

    ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();

    // Hit markers
    ctx.globalAlpha = 0.4;
    s.markers.forEach(m => {
      ctx.beginPath();
      ctx.arc(tx + m.x, ty + m.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = m.clr;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawBow() {
    const bx = C.BOW_X, by = C.BOW_Y;

    // Bow arc
    ctx.beginPath();
    ctx.ellipse(bx - 2, by, 8, 26, 0, Math.PI * 0.55, -Math.PI * 0.55);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Outer glow
    ctx.shadowColor = 'rgba(0,255,200,0.06)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Grip
    ctx.fillStyle = '#334155';
    ctx.fillRect(bx - 5, by - 4, 4, 8);

    // String
    const topY = by - 26, botY = by + 26;
    ctx.beginPath();
    ctx.moveTo(bx - 2, topY);
    if (s.aim.active) {
      const bendX = bx - 2 + Math.cos(s.aim.angle) * 10;
      const bendY = by + Math.sin(s.aim.angle) * 4;
      ctx.quadraticCurveTo(bendX, bendY, bx - 2, botY);
    } else {
      ctx.lineTo(bx - 2, botY);
    }
    ctx.strokeStyle = 'rgba(226,232,240,0.15)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Arrow nock (if idle)
    if (s.phase === 'ready' && !s.aim.active) {
      ctx.beginPath();
      ctx.moveTo(bx + 2, by - 2); ctx.lineTo(bx + 12, by); ctx.lineTo(bx + 2, by + 2);
      ctx.strokeStyle = 'rgba(148,163,184,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawAimLine() {
    if (!s.aim.active) return;
    const bx = C.BOW_X, by = C.BOW_Y;
    const mx = s.aim.mx, my = s.aim.my;

    // Direction line
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(mx, my);
    ctx.strokeStyle = 'rgba(0,255,200,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trajectory prediction
    const power = clamp(dist(bx, by, mx, my) / C.MAX_POWER, 0, 1);
    const speed = Math.max(power, 0.05) * C.MAX_SPEED;
    const angle = Math.atan2(my - by, mx - bx);
    let px = bx, py = by;
    let pvx = Math.cos(angle) * speed;
    let pvy = Math.sin(angle) * speed;

    ctx.beginPath();
    ctx.moveTo(px, py);
    let hitTarget = false;
    for (let i = 0; i < 80; i++) {
      pvy += C.GRAVITY; pvx += s.wind;
      px += pvx; py += pvy;
      ctx.lineTo(px, py);
      if (px > C.W || py > C.H || px < 0) break;
      const d2 = (px - C.TARGET_X) ** 2 + (py - s.target.y) ** 2;
      if (d2 <= C.OUTER_R * C.OUTER_R && !hitTarget) {
        hitTarget = true;
        ctx.strokeStyle = 'rgba(255,215,0,0.15)';
        ctx.setLineDash([3, 8]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.fill();
      }
    }
    if (!hitTarget) {
      ctx.strokeStyle = 'rgba(0,255,200,0.1)';
      ctx.setLineDash([3, 8]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Power indicator
    const pwX = 20, pwY = C.H - 50;
    ctx.fillStyle = '#334155';
    ctx.fillRect(pwX, pwY, 8, -40);
    const barH = power * 40;
    ctx.fillStyle = power > 0.8 ? '#22c55e' : power > 0.4 ? '#eab308' : '#ef4444';
    ctx.fillRect(pwX, pwY, 8, -barH);
    ctx.strokeStyle = 'rgba(0,255,200,0.1)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(pwX, pwY, 8, -40);
  }

  function drawArrow(arrow) {
    if (!arrow) return;
    const len = 26, hl = 7, fh = 6;

    ctx.save();
    ctx.translate(arrow.x, arrow.y);
    ctx.rotate(arrow.angle);

    // Trail glow
    ctx.shadowColor = 'rgba(255,215,0,0.3)';
    ctx.shadowBlur = 8;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(-len/2, 0);
    ctx.lineTo(len/2 - hl, 0);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Feathers
    ctx.beginPath();
    ctx.moveTo(-len/2, 0);
    ctx.lineTo(-len/2 + fh, -4);
    ctx.moveTo(-len/2, 0);
    ctx.lineTo(-len/2 + fh, 4);
    ctx.moveTo(-len/2 + 3, 0);
    ctx.lineTo(-len/2 + fh + 3, -3);
    ctx.moveTo(-len/2 + 3, 0);
    ctx.lineTo(-len/2 + fh + 3, 3);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(len/2, 0);
    ctx.lineTo(len/2 - hl, -3);
    ctx.moveTo(len/2, 0);
    ctx.lineTo(len/2 - hl, 3);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  function drawTrail(arrow) {
    if (!arrow || arrow.trail.length < 2) return;
    ctx.save();
    for (let i = 1; i < arrow.trail.length; i++) {
      const t = i / arrow.trail.length;
      ctx.beginPath();
      ctx.arc(arrow.trail[i].x, arrow.trail[i].y, 1.5 * t, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${t * 0.3})`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    s.particles.forEach(p => {
      if (p.dead) return;
      const t = p.life / p.maxLife;
      ctx.globalAlpha = t;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fillStyle = p.clr;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawFloats() {
    s.floats.forEach(f => {
      if (f.dead) return;
      const t = f.life / f.maxLife;
      ctx.globalAlpha = t;
      ctx.fillStyle = f.clr;
      ctx.font = `bold ${14 + (1 - t) * 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - (1 - t) * 30);
    });
    ctx.globalAlpha = 1;
  }

  function drawWindIndicator() {
    const wx = C.W - 70, wy = 28;
    const len = clamp(Math.abs(s.wind) * 50, 0, 45);
    const dir = s.wind >= 0 ? 1 : -1;

    ctx.save();
    ctx.translate(wx, wy);

    ctx.fillStyle = '#475569';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('WIND', 0, -14);

    ctx.beginPath();
    const endX = dir * len;
    ctx.moveTo(0, 0); ctx.lineTo(endX, 0);
    ctx.moveTo(endX - dir * 5, -3); ctx.lineTo(endX, 0); ctx.lineTo(endX - dir * 5, 3);
    ctx.strokeStyle = s.wind === 0 ? '#334155' : '#00ffc8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = s.wind === 0 ? '#334155' : '#00ffc8';
    ctx.font = '8px monospace';
    ctx.fillText(Math.abs(s.wind).toFixed(2), 0, 14);

    ctx.restore();
  }

  function drawHUD() {
    // Compass guide line at top
    ctx.strokeStyle = 'rgba(0,255,200,0.02)';
    ctx.setLineDash([2, 6]);
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(C.BOW_X + 10, s.target.y); ctx.lineTo(C.TARGET_X - C.OUTER_R, s.target.y); ctx.stroke();
    ctx.setLineDash([]);

    // Distance markers on guide line (subtle)
    for (let x = C.BOW_X + 40; x < C.TARGET_X - C.OUTER_R; x += 60) {
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(x - 0.5, s.target.y - 1, 1, 2);
    }
  }

  // ─── Update ──────────────────────────────────────────────────
  function update(dt) {
    // Target
    const dd = diffData();
    s.target.t += dd.speed * 0.02 * dt;
    s.target.y = 200 + Math.sin(s.target.t) * 110;

    // Arrow
    if (s.arrow && s.arrow.active) {
      const a = s.arrow;
      a.vy += C.GRAVITY * dt;
      a.vx += s.wind * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.angle = Math.atan2(a.vy, a.vx);
      a.trail.push({ x: a.x, y: a.y });
      if (a.trail.length > C.TRAIL_LEN) a.trail.shift();

      if (a.x > C.W + 20 || a.x < -20 || a.y > C.H + 20 || a.y < -20) {
        a.active = false;
        handleMiss();
      } else {
        checkCollision(a);
      }
    }

    // Particles
    s.particles.forEach(p => {
      if (p.dead) return;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 0.08 * dt;
      p.life -= dt;
      if (p.life <= 0) p.dead = true;
    });

    // Floats
    s.floats.forEach(f => {
      if (f.dead) return;
      f.life -= dt;
      if (f.life <= 0) f.dead = true;
    });
  }

  function checkCollision(a) {
    const dx = a.x - C.TARGET_X;
    const dy = a.y - s.target.y;
    const dd = dx * dx + dy * dy;
    if (dd > C.OUTER_R * C.OUTER_R) return;

    a.active = false; a.hit = true;
    const d = Math.sqrt(dd);
    const ring = getRing(d);
    s.score += ring.pts;
    s.hits++;
    s.ringCounts[ring.name]++;

    // Hit effects
    spawnParticles(a.x, a.y, ring.clr, 18);
    spawnFloat(a.x, a.y - 10, `+${ring.pts}`, ring.clr);

    // Marker
    s.markers.push({ x: a.x - C.TARGET_X, y: a.y - s.target.y, clr: ring.clr });

    // Update display
    updateUI();
    showInfo(`${ring.name.toUpperCase()}! +${ring.pts}`, ring.clr);
    scheduleNext();
  }

  function handleMiss() {
    updateUI();
    scheduleNext();
  }

  function scheduleNext() {
    setTimeout(() => {
      s.arrow = null;
      if (s.arrows <= 0) {
        gameOver();
      } else {
        s.phase = 'ready';
        genWind();
      }
    }, 600);
  }

  function spawnParticles(x, y, clr, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 3;
      s.particles.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: 25 + Math.random() * 15, maxLife: 40, clr, size: 1.5 + Math.random() * 2, dead: false
      });
    }
  }

  function spawnFloat(x, y, text, clr) {
    s.floats.push({ x, y, text, clr, life: 50, maxLife: 50, dead: false });
  }

  function showInfo(text, clr) {
    el.info.textContent = text;
    el.info.style.color = clr || '#ffd700';
    el.info.classList.remove('hidden');
    el.info.style.animation = 'none';
    void el.info.offsetHeight;
    el.info.style.animation = 'fadeUp 1.2s ease forwards';
    setTimeout(() => el.info.classList.add('hidden'), 1200);
  }

  // ─── UI ──────────────────────────────────────────────────────
  function updateUI() {
    el.score.textContent = s.score;
    el.arrows.textContent = `${s.arrows}/${C.MAX_ARROWS}`;
    const acc = s.shots > 0 ? Math.round((s.hits / s.shots) * 100) : 0;
    el.acc.textContent = `${acc}%`;
    if (s.arrows === 0) el.arrows.classList.add('gold');
    else el.arrows.classList.remove('gold');

    if (s.score > s.best) {
      s.best = s.score;
      el.best.textContent = s.best;
      el.best.style.color = '#ffd700';
    }
  }

  // ─── Game Flow ───────────────────────────────────────────────
  function fireArrow() {
    if (s.phase !== 'ready' || s.arrows <= 0) return;
    const d = dist(C.BOW_X, C.BOW_Y, s.aim.mx, s.aim.my);
    const power = clamp(d / C.MAX_POWER, 0, 1);
    if (power < 0.05) { s.aim.active = false; return; }
    const angle = Math.atan2(s.aim.my - C.BOW_Y, s.aim.mx - C.BOW_X);
    const speed = power * C.MAX_SPEED;

    s.arrow = {
      x: C.BOW_X, y: C.BOW_Y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      angle, trail: [], active: true, hit: false
    };
    s.arrows--;
    s.shots++;
    s.phase = 'flying';
    s.aim.active = false;
    updateUI();
  }

  function gameOver() {
    s.phase = 'gameover';
    if (s.animId) { cancelAnimationFrame(s.animId); s.animId = null; }

    const acc = s.shots > 0 ? Math.round((s.hits / s.shots) * 100) : 0;
    const isNewBest = s.score > s.best;
    if (isNewBest) {
      s.best = s.score;
      localStorage.setItem('archeryBest', s.best);
    }

    el.fScore.textContent = s.score;
    el.fAcc.textContent = `${acc}%`;
    el.fHits.textContent = `${s.hits} / ${s.shots}`;
    el.fBest.textContent = isNewBest ? `NEW! ${s.best}` : s.best;

    el.breakdown.innerHTML = `
      <span><span class="dot bullseye"></span> ${s.ringCounts.bullseye}</span>
      <span><span class="dot inner"></span> ${s.ringCounts.inner}</span>
      <span><span class="dot outer"></span> ${s.ringCounts.outer}</span>
    `;

    el.modal.classList.remove('hidden');
  }

  function resetGame() {
    el.modal.classList.add('hidden');
    el.arrows.classList.remove('gold');
    el.best.style.color = '';

    s.score = 0; s.arrows = C.MAX_ARROWS; s.hits = 0; s.shots = 0;
    s.arrow = null; s.particles = []; s.floats = [];
    s.markers = []; s.phase = 'ready';
    s.ringCounts = { bullseye: 0, inner: 0, outer: 0 };
    s.target.y = 200; s.target.t = 0;
    el.best.textContent = s.best;
    genWind();
    updateUI();

    if (!s.animId) {
      s.lastTime = performance.now();
      s.animId = requestAnimationFrame(tick);
    }
  }

  // ─── Events ──────────────────────────────────────────────────
  function onDown(e) {
    if (s.phase !== 'ready' || s.arrows <= 0) return;
    e.preventDefault();
    const p = getPos(e);
    s.aim.active = true;
    s.aim.mx = p.x; s.aim.my = p.y;
    s.aim.angle = Math.atan2(p.y - C.BOW_Y, p.x - C.BOW_X);
    s.aim.power = clamp(dist(C.BOW_X, C.BOW_Y, p.x, p.y) / C.MAX_POWER, 0, 1);
  }

  function onMove(e) {
    if (!s.aim.active) return;
    e.preventDefault();
    const p = getPos(e);
    s.aim.mx = p.x; s.aim.my = p.y;
    s.aim.angle = Math.atan2(p.y - C.BOW_Y, p.x - C.BOW_X);
    s.aim.power = clamp(dist(C.BOW_X, C.BOW_Y, p.x, p.y) / C.MAX_POWER, 0, 1);
  }

  function onUp(e) {
    if (!s.aim.active) return;
    e.preventDefault();
    fireArrow();
  }

  function onTouchStart(e) { e.preventDefault(); const t = e.touches[0]; onDown({ preventDefault: () => {}, clientX: t.clientX, clientY: t.clientY }); }
  function onTouchMove(e) { e.preventDefault(); const t = e.touches[0]; onMove({ preventDefault: () => {}, clientX: t.clientX, clientY: t.clientY }); }
  function onTouchEnd(e) { e.preventDefault(); onUp({ preventDefault: () => {} }); }

  // ─── Main Loop ───────────────────────────────────────────────
  function tick(ts) {
    if (s.phase === 'gameover') return;
    const dt = Math.min((ts - s.lastTime) / 16.67, 3);
    s.lastTime = ts;

    update(dt);
    render();
    s.animId = requestAnimationFrame(tick);
  }

  function render() {
    ctx.clearRect(0, 0, C.W, C.H);
    drawBg();
    drawWindIndicator();
    drawHUD();
    drawTarget();
    drawBow();
    if (s.arrow && (s.arrow.active || s.arrow.hit)) {
      drawTrail(s.arrow);
      drawArrow(s.arrow);
    }
    drawAimLine();
    drawParticles();
    drawFloats();
  }

  // ─── Init ─────────────────────────────────────────────────────
  function init() {
    genWind();
    s.best = parseInt(localStorage.getItem('archeryBest')) || 0;
    el.best.textContent = s.best;
    updateUI();

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (s.phase !== 'ready' && s.phase !== 'gameover') return;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        s.diff = btn.dataset.diff;
        genWind();
      });
    });

    // Input
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', (e) => { if (s.aim.active) onUp(e); });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    el.restart.addEventListener('click', resetGame);

    s.lastTime = performance.now();
    s.animId = requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
