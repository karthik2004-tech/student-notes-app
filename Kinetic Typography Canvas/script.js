(function () {
  "use strict";

  /* ─── DOM refs ───────────────────────────────────────── */
  const bodyEl = document.getElementById("kineticBody");
  const viewport = document.getElementById("viewport");
  const textInput = document.getElementById("textInput");
  const applyBtn = document.getElementById("applyBtn");
  const radiusSlider = document.getElementById("radiusSlider");
  const radiusVal = document.getElementById("radiusVal");
  const intensitySlider = document.getElementById("intensitySlider");
  const intensityVal = document.getElementById("intensityVal");
  const presetSelect = document.getElementById("presetSelect");
  const dChars = document.getElementById("dChars");
  const dActive = document.getElementById("dActive");
  const dPos = document.getElementById("dPos");

  /* ─── State ─────────────────────────────────────────── */
  let states = [];
  let mouseX = null;
  let mouseY = null;
  let radius = 110;
  let intensity = 1.2;
  let activeCount = 0;

  const CYAN = [0, 240, 255];
  const PINK = [255, 42, 95];

  /* ─── Tokenizer ─────────────────────────────────────── */
  function tokenize(text) {
    bodyEl.innerHTML = "";
    const chars = [...text];
    let fragment = document.createDocumentFragment();
    for (const c of chars) {
      const span = document.createElement("span");
      span.className = "char-span";
      span.textContent = c === " " ? "\u00A0" : c;
      fragment.appendChild(span);
    }
    bodyEl.appendChild(fragment);
    return bodyEl.querySelectorAll(".char-span");
  }

  /* ─── Capture home positions ────────────────────────── */
  function capturePositions(spans) {
    states = [];
    const cr = viewport.getBoundingClientRect();
    for (const el of spans) {
      const r = el.getBoundingClientRect();
      states.push({
        el,
        cx: r.left - cr.left + r.width / 2,
        cy: r.top - cr.top + r.height / 2,
        dx: 0, dy: 0, rot: 0, scale: 1, colorT: 0,
        tdx: 0, tdy: 0, trot: 0, tscale: 1, tcol: 0,
      });
    }
    dChars.textContent = states.length;
  }

  /* ─── Apply text ────────────────────────────────────── */
  function applyText(text) {
    if (!text || !text.trim()) text = "\u00A0";
    const spans = tokenize(text);
    requestAnimationFrame(function () {
      capturePositions(spans);
    });
  }

  /* ─── Color lerp ────────────────────────────────────── */
  function lerpColor(t) {
    t = Math.max(0, Math.min(1, t));
    const r = Math.round(CYAN[0] + (PINK[0] - CYAN[0]) * t);
    const g = Math.round(CYAN[1] + (PINK[1] - CYAN[1]) * t);
    const b = Math.round(CYAN[2] + (PINK[2] - CYAN[2]) * t);
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  /* ─── Animation ─────────────────────────────────────── */
  function tick() {
    const cr = viewport.getBoundingClientRect();
    const mx = mouseX !== null ? mouseX - cr.left : null;
    const my = mouseY !== null ? mouseY - cr.top : null;

    activeCount = 0;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];

      if (mx !== null && my !== null) {
        const dx = mx - s.cx;
        const dy = my - s.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius && dist > 0.001) {
          activeCount++;
          const force = (1 - dist / radius);
          const angle = Math.atan2(dy, dx);
          const mag = force * intensity * 70;
          const pushX = -Math.cos(angle) * mag;
          const pushY = -Math.sin(angle) * mag;
          const tilt = force * 18 * (i % 2 === 0 ? -1 : 1);
          const zoom = 1 + force * 0.55;

          s.tdx = pushX;
          s.tdy = pushY;
          s.trot = tilt;
          s.tscale = zoom;
          s.tcol = force;
        } else {
          s.tdx = 0; s.tdy = 0; s.trot = 0; s.tscale = 1; s.tcol = 0;
        }
      } else {
        s.tdx = 0; s.tdy = 0; s.trot = 0; s.tscale = 1; s.tcol = 0;
      }

      s.dx += (s.tdx - s.dx) * 0.12;
      s.dy += (s.tdy - s.dy) * 0.12;
      s.rot += (s.trot - s.rot) * 0.12;
      s.scale += (s.tscale - s.scale) * 0.12;
      s.colorT += (s.tcol - s.colorT) * 0.1;

      if (s.rot > 0.01 || s.rot < -0.01 || s.scale > 1.005 || s.scale < 0.995 || s.dx > 0.1 || s.dx < -0.1 || s.dy > 0.1 || s.dy < -0.1) {
        s.el.style.transform = "translate(" + s.dx.toFixed(1) + "px," + s.dy.toFixed(1) + "px) rotate(" + s.rot.toFixed(2) + "deg) scale(" + s.scale.toFixed(3) + ")";
        s.el.style.color = lerpColor(s.colorT);
      } else {
        if (s.el.style.transform !== "") {
          s.el.style.transform = "";
          s.el.style.color = "";
        }
      }
    }

    dActive.textContent = activeCount;
    requestAnimationFrame(tick);
  }

  /* ─── Event binding ─────────────────────────────────── */
  function bindEvents() {
    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener("mouseleave", function () {
      mouseX = null;
      mouseY = null;
    });

    viewport.addEventListener("touchmove", function (e) {
      const t = e.touches[0];
      mouseX = t.clientX;
      mouseY = t.clientY;
    }, { passive: true });

    viewport.addEventListener("touchend", function () {
      mouseX = null;
      mouseY = null;
    });

    viewport.addEventListener("touchcancel", function () {
      mouseX = null;
      mouseY = null;
    });

    /* Controls */
    radiusSlider.addEventListener("input", function () {
      radius = parseFloat(this.value);
      radiusVal.textContent = radius.toFixed(0) + "px";
    });

    intensitySlider.addEventListener("input", function () {
      intensity = parseFloat(this.value);
      intensityVal.textContent = intensity.toFixed(1) + "x";
    });

    applyBtn.addEventListener("click", function () {
      applyText(textInput.value);
    });

    textInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") applyText(textInput.value);
    });

    presetSelect.addEventListener("change", function () {
      textInput.value = this.value;
      applyText(this.value);
    });

    window.addEventListener("resize", function () {
      const spans = bodyEl.querySelectorAll(".char-span");
      capturePositions(spans);
    });
  }

  /* ─── Init ──────────────────────────────────────────── */
  function init() {
    bindEvents();
    radius = parseFloat(radiusSlider.value);
    radiusVal.textContent = radius.toFixed(0) + "px";
    intensity = parseFloat(intensitySlider.value);
    intensityVal.textContent = intensity.toFixed(1) + "x";
    applyText(textInput.value);
    tick();
  }

  init();
})();
