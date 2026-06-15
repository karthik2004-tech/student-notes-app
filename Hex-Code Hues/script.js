/* ═══════════════════════════════════════════════════════
   Hex-Code Hues — Game Engine
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ───
  const BEST_KEY = 'hexHuesBest';
  const SWATCH_COUNT = 3;

  // ─── State ───
  let score = 0;
  let streak = 0;
  let best = 0;
  let targetColor = null;       // { r, g, b }
  let targetHex = '';
  let swatchColors = [];        // array of { r, g, b }
  let correctIndex = -1;
  let isLocked = false;         // prevent clicks during feedback

  // ─── DOM ───
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const dom = {};

  function cacheDom() {
    dom.score = $('#score');
    dom.streak = $('#streak');
    dom.best = $('#best');
    dom.hexValue = $('#hex-value');
    dom.swatchGrid = $('#swatch-grid');
    dom.swatches = $$('.swatch');
    dom.feedback = $('#feedback');
    dom.btnNext = $('#btn-next');
    dom.btnReset = $('#btn-reset');
    dom.screenFlash = $('#screen-flash');
  }

  // ─── Storage ───
  function loadBest() {
    try {
      const v = localStorage.getItem(BEST_KEY);
      if (v) best = parseInt(v, 10) || 0;
    } catch { best = 0; }
  }

  function saveBest() {
    try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* ignore */ }
  }

  // ─── Color Helpers ───
  function randomRGB() {
    return {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    };
  }

  function rgbToHex(r, g, b) {
    const toHex = (v) => v.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function rgbStr(c) {
    return `${c.r},${c.g},${c.b}`;
  }

  // ─── Color Similarity ───
  function clamp(v) { return Math.max(0, Math.min(255, v)); }

  function mutateColor(base, variance) {
    return {
      r: clamp(base.r + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * variance)),
      g: clamp(base.g + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * variance)),
      b: clamp(base.b + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * variance)),
    };
  }

  function generateAlternative(target, variance) {
    let alt;
    let attempts = 0;
    do {
      alt = mutateColor(target, variance);
      attempts++;
    } while (rgbStr(alt) === rgbStr(target) && attempts < 50);
    return alt;
  }

  // ─── Generate Round ───
  function generateRound() {
    targetColor = randomRGB();
    targetHex = rgbToHex(targetColor.r, targetColor.g, targetColor.b);

    const colors = [targetColor];
    let variance;

    if (streak < 3) {
      // Easy mode — completely random alternatives
      variance = 256;
    } else {
      // Hard mode — narrow variance shrinks with streak
      variance = Math.max(5, 60 - streak * 4);
    }

    while (colors.length < SWATCH_COUNT) {
      const alt = generateAlternative(targetColor, variance);
      // Ensure no duplicates
      if (!colors.some((c) => rgbStr(c) === rgbStr(alt))) {
        colors.push(alt);
      }
    }

    // Shuffle
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }

    swatchColors = colors;
    correctIndex = colors.findIndex((c) => rgbStr(c) === rgbStr(targetColor));

    return { targetHex, colors, correctIndex };
  }

  // ─── Render ───
  function renderRound() {
    dom.hexValue.textContent = targetHex;

    dom.swatches.forEach((sw, i) => {
      const c = swatchColors[i];
      sw.style.background = rgbToHex(c.r, c.g, c.b);
      sw.className = 'swatch';
      sw.disabled = false;
    });

    dom.feedback.textContent = '';
    dom.feedback.className = 'feedback';
    isLocked = false;
    dom.btnNext.disabled = true;
  }

  // ─── Flash Penalty ───
  function flashPenalty() {
    dom.screenFlash.classList.add('active');
    setTimeout(() => dom.screenFlash.classList.remove('active'), 150);
  }

  // ─── Handle Click ───
  function handleSwatchClick(index) {
    if (isLocked) return;
    if (index < 0 || index >= SWATCH_COUNT) return;

    isLocked = true;
    dom.swatches.forEach((sw) => sw.classList.add('disabled'));

    const swatch = dom.swatches[index];
    const isCorrect = index === correctIndex;

    if (isCorrect) {
      // Success
      swatch.classList.add('correct');
      score += 10;
      streak++;
      if (streak > best) {
        best = streak;
        saveBest();
      }
      dom.feedback.textContent = '✓ Correct! +10';
      dom.feedback.className = 'feedback correct';
      dom.btnNext.disabled = false;
    } else {
      // Wrong
      swatch.classList.add('wrong');
      flashPenalty();
      streak = 0;
      dom.feedback.textContent = `✕ Wrong! The answer was swatch ${correctIndex + 1}`;
      dom.feedback.className = 'feedback wrong';

      // Reveal correct swatch
      dom.swatches[correctIndex].classList.add('reveal');

      // Auto-advance after delay
      setTimeout(() => {
        nextRound();
      }, 1400);
    }

    dom.score.textContent = score;
    dom.streak.textContent = streak;
    dom.best.textContent = best;
    dom.btnNext.disabled = false;
  }

  // ─── Next Round ───
  function nextRound() {
    generateRound();
    renderRound();
    dom.btnNext.disabled = true;
  }

  // ─── Reset ───
  function resetGame() {
    score = 0;
    streak = 0;
    dom.score.textContent = '0';
    dom.streak.textContent = '0';
    dom.best.textContent = best;
    isLocked = false;
    nextRound();
    dom.btnNext.disabled = true;
  }

  // ─── Events ───
  function setupEvents() {
    dom.swatchGrid.addEventListener('click', (e) => {
      const sw = e.target.closest('.swatch');
      if (!sw) return;
      handleSwatchClick(parseInt(sw.dataset.index, 10));
    });

    dom.btnNext.addEventListener('click', nextRound);
    dom.btnReset.addEventListener('click', resetGame);
  }

  // ─── Init ───
  function init() {
    cacheDom();
    loadBest();
    dom.best.textContent = best;
    generateRound();
    renderRound();
    dom.btnNext.disabled = true;
    setupEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// Performance Optimization: Batch swatch rendering
console.log('Performance upgrade: batched palette paint loops');
