(function () {
  "use strict";

  var FAIL_MSGS = [
    "Walls are solid. You are not.",
    "That's a wall. Obviously.",
    "Ouch. Right into the wall.",
    "The wall was here first.",
    "Spatial awareness: -10.",
    "You've heard of walls, right?",
    "BONK.",
    "Skill issue detected.",
    "Try the gap, not the wall.",
    "Maybe go around this time?",
    "The wall remains undefeated.",
    "You walked into a wall. Again.",
  ];

  var WIN_MSGS = [
    "You... actually did it. Wow.",
    "The maze concedes defeat. For now.",
    "I was going to move the button again but I respect the hustle.",
    "Fine. You win. Don't let it go to your head.",
    "Victory. The UI is humiliated.",
    "You out-persisted the finish button. Nice.",
  ];

  /* ─── DOM refs ─────────────────────────────────────── */
  var mazeEl     = document.getElementById("maze");
  var startZone  = document.getElementById("startZone");
  var finishBtn  = document.getElementById("finishBtn");
  var cursorDot  = document.getElementById("cursorDot");
  var rageFill   = document.getElementById("rageFill");
  var attemptsVal= document.getElementById("attemptsVal");
  var alertText  = document.getElementById("alertText");
  var modeVal    = document.getElementById("modeVal");
  var overlay    = document.getElementById("overlay");
  var oTitle     = document.getElementById("oTitle");
  var oMsg       = document.getElementById("oMsg");
  var oStats     = document.getElementById("oStats");
  var oBtn       = document.getElementById("oBtn");
  var trapZone   = document.getElementById("trapZone");

  /* ─── State ────────────────────────────────────────── */
  var cx = 0, cy = 0;                /* custom cursor pos (relative to maze) */
  var realX = 0, realY = 0;          /* real mouse pos (relative to maze) */
  var prevRealX = 0, prevRealY = 0;
  var locked = false;                 /* lock after collision */
  var inverted = false;
  var attempts = 0;
  var rage = 0;
  var finished = false;
  var trapped = false;                /* proximity trap triggered */
  var mazeW = 0, mazeH = 0;
  var startCX = 0, startCY = 0;      /* start zone center */
  var finishX = 0, finishY = 0;      /* finish button pos */
  var wallEls = [];
  var trapToggleWall = null;          /* wall that appears when trap triggers */

  /* ─── Wall definitions (percentage) ───────────────── */
  var WALL_DEFS = [
    /* Outer border */
    { l: 0,   t: 0,   w: 100, h: 4   },
    { l: 0,   t: 96,  w: 100, h: 4   },
    { l: 0,   t: 0,   w: 3,   h: 48  },
    { l: 0,   t: 52,  w: 3,   h: 48  },
    { l: 97,  t: 0,   w: 3,   h: 100 },

    /* ── Corridor 1: start → right ── */
    { l: 3,   t: 4,   w: 22,  h: 3   }, /* ceiling */
    { l: 22,  t: 4,   w: 3,   h: 16  }, /* right wall */

    /* ── Corridor 2: down ── */
    { l: 3,   t: 20,  w: 22,  h: 3   }, /* floor */

    /* ── Corridor 3: right again ── */
    { l: 25,  t: 4,   w: 3,   h: 18  }, /* left wall */
    { l: 25,  t: 22,  w: 72,  h: 3   }, /* floor */

    /* ── Corridor 4: down section ── */
    { l: 50,  t: 4,   w: 3,   h: 22  }, /* mid wall */

    /* ── Corridor 5: right (narrow) ── */
    { l: 53,  t: 4,   w: 44,  h: 3   }, /* ceiling */
    { l: 94,  t: 7,   w: 3,   h: 18  }, /* right wall end */

    /* ── Corridor 6: zigzag down ── */
    { l: 53,  t: 25,  w: 3,   h: 18  }, /* left wall, lower */

    /* ── Corridor 7: right → finish area ── */
    { l: 3,   t: 44,  w: 55,  h: 3   }, /* mid floor */
    { l: 3,   t: 48,  w: 3,   h: 48  }, /* left wall lower */
    { l: 56,  t: 28,  w: 3,   h: 22  }, /* right wall, mid */

    /* ── Lower section obstacle ── */
    { l: 6,   t: 65,  w: 40,  h: 3   },
    { l: 46,  t: 65,  w: 3,   h: 15  },

    /* ── Final corridor ── */
    { l: 3,   t: 82,  w: 94,  h: 3   },
    { l: 49,  t: 51,  w: 3,   h: 14  },

    /* Extra obstacles */
    { l: 70,  t: 51,  w: 27,  h: 3   },
    { l: 10,  t: 51,  w: 18,  h: 3   },
  ];

  /* Trap: a wall that appears when cursor enters trap zone */
  var TRAP_WALL = { l: 40, t: 44, w: 3, h: 24 };

  /* Trap detection zone (near critical corridor) */
  var TRAP_ZONE = { l: 35, t: 35, w: 18, h: 10 };

  /* Finish starting position */
  var FINISH_INIT = { l: 85, t: 87 };

  /* ─── Build environment ────────────────────────────── */
  function build() {
    var r = mazeEl.getBoundingClientRect();
    mazeW = r.width;
    mazeH = r.height;

    /* Remove old walls */
    for (var i = 0; i < wallEls.length; i++) {
      if (wallEls[i] && wallEls[i].parentNode) wallEls[i].parentNode.removeChild(wallEls[i]);
    }
    wallEls = [];
    if (trapToggleWall && trapToggleWall.parentNode) trapToggleWall.parentNode.removeChild(trapToggleWall);
    trapToggleWall = null;

    /* Create walls */
    for (var i = 0; i < WALL_DEFS.length; i++) {
      var w = WALL_DEFS[i];
      var el = document.createElement("div");
      el.className = "wall";
      el.style.left   = pct(w.l);
      el.style.top    = pct(w.t);
      el.style.width  = pct(w.w);
      el.style.height = pct(w.h);
      el.addEventListener("mouseenter", onWallHit);
      mazeEl.appendChild(el);
      wallEls.push(el);
    }

    /* Trap toggle wall (hidden initially) */
    trapToggleWall = document.createElement("div");
    trapToggleWall.className = "wall";
    trapToggleWall.style.left   = pct(TRAP_WALL.l);
    trapToggleWall.style.top    = pct(TRAP_WALL.t);
    trapToggleWall.style.width  = pct(TRAP_WALL.w);
    trapToggleWall.style.height = pct(TRAP_WALL.h);
    trapToggleWall.addEventListener("mouseenter", onWallHit);
    trapToggleWall.style.display = "none";
    mazeEl.appendChild(trapToggleWall);

    /* Trap zone */
    trapZone.style.left   = pct(TRAP_ZONE.l);
    trapZone.style.top    = pct(TRAP_ZONE.t);
    trapZone.style.width  = pct(TRAP_ZONE.w);
    trapZone.style.height = pct(TRAP_ZONE.h);
    trapZone.classList.remove("trap-hidden");

    /* Finish button */
    finishX = FINISH_INIT.l / 100 * mazeW;
    finishY = FINISH_INIT.t / 100 * mazeH;
    updateFinishDOM();

    /* Start zone center */
    var sr = startZone.getBoundingClientRect();
    var mr = mazeEl.getBoundingClientRect();
    startCX = sr.left - mr.left + sr.width / 2;
    startCY = sr.top  - mr.top  + sr.height / 2;

    /* Initial cursor pos */
    cx = startCX;
    cy = startCY;
    updateCursorDOM();
  }

  function pct(v) { return v + "%"; }

  function updateFinishDOM() {
    finishBtn.style.left   = (finishX - finishBtn.offsetWidth / 2) + "px";
    finishBtn.style.top    = (finishY - finishBtn.offsetHeight / 2) + "px";
  }

  function updateCursorDOM() {
    cursorDot.style.left = cx + "px";
    cursorDot.style.top  = cy + "px";
  }

  /* ─── Wall collision ──────────────────────────────── */
  function onWallHit() {
    if (locked || finished) return;
    fail();
  }

  function fail() {
    locked = true;
    attempts++;
    attemptsVal.textContent = attempts;
    rage = Math.min(100, rage + 15);
    rageFill.style.width = rage + "%";

    var msg = FAIL_MSGS[Math.floor(Math.random() * FAIL_MSGS.length)];
    alertText.textContent = msg;
    alertText.style.color = "#ff007f";

    modeVal.textContent = "FAILED";
    modeVal.style.color = "#ff007f";

    /* Shake */
    mazeEl.classList.remove("shake");
    void mazeEl.offsetWidth;
    mazeEl.classList.add("shake");

    /* Glitch flash */
    var flash = document.createElement("div");
    flash.className = "glitch-flash";
    mazeEl.appendChild(flash);
    setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 550);

    /* Reset after delay */
    setTimeout(function () {
      cx = startCX;
      cy = startCY;
      updateCursorDOM();
      inverted = false;
      modeVal.textContent = "NORMAL";
      modeVal.style.color = "#64748b";
      alertText.textContent = "TRY AGAIN";
      alertText.style.color = "#475569";
      locked = false;
    }, 600);
  }

  /* ─── Evasive finish button ───────────────────────── */
  function evade() {
    if (finished || locked) return;
    var bw = finishBtn.offsetWidth;
    var bh = finishBtn.offsetHeight;
    var bx = finishX;
    var by = finishY;
    var dx = cx - bx;
    var dy = cy - by;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var evadeRadius = Math.max(80, mazeW * 0.12);

    if (dist < evadeRadius && dist > 1) {
      var angle = Math.atan2(dy, dx);
      var push = (evadeRadius - dist) * 1.8 + 8;
      var nx = bx - Math.cos(angle) * push;
      var ny = by - Math.sin(angle) * push;

      /* Boundary clamp with teleport escape */
      var margin = 20;
      if (nx < margin || nx > mazeW - margin || ny < margin || ny > mazeH - margin) {
        /* Teleport to random valid area */
        nx = margin + Math.random() * (mazeW - margin * 2);
        ny = margin + Math.random() * (mazeH - margin * 2);
        /* Add a brief indicator */
        finishBtn.style.transition = "left 0.15s ease, top 0.15s ease";
      } else {
        finishBtn.style.transition = "left 0.08s ease, top 0.08s ease";
      }

      finishX = nx;
      finishY = ny;
      updateFinishDOM();
    }
  }

  /* ─── Victory check ───────────────────────────────── */
  function checkVictory() {
    if (finished || locked) return;
    var bw = finishBtn.offsetWidth;
    var bh = finishBtn.offsetHeight;
    var halfW = bw / 2;
    var halfH = bh / 2;

    if (cx > finishX - halfW && cx < finishX + halfW &&
        cy > finishY - halfH && cy < finishY + halfH) {
      finished = true;
      var winMsg = WIN_MSGS[Math.floor(Math.random() * WIN_MSGS.length)];
      showOverlay("VICTORY", winMsg, "Attempts: " + attempts + "  |  Rage: " + rage + "%");
    }
  }

  /* ─── Overlay ──────────────────────────────────────── */
  function showOverlay(title, msg, stats) {
    overlay.classList.remove("hidden");
    oTitle.textContent = title;
    oTitle.style.color = title === "VICTORY" ? "#00ff88" : "#ff007f";
    oMsg.textContent = msg;
    oStats.textContent = stats || "";
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  /* ─── Proximity trap ───────────────────────────────── */
  function checkTrap() {
    if (finished || locked || trapped) return;
    if (cx >= TRAP_ZONE.l / 100 * mazeW &&
        cx <= (TRAP_ZONE.l + TRAP_ZONE.w) / 100 * mazeW &&
        cy >= TRAP_ZONE.t / 100 * mazeH &&
        cy <= (TRAP_ZONE.t + TRAP_ZONE.h) / 100 * mazeH) {
      trapped = true;
      trapToggleWall.style.display = "block";
      alertText.textContent = "BARRIER DEPLOYED";
      alertText.style.color = "#ffd700";
      setTimeout(function () {
        alertText.style.color = "#475569";
      }, 1200);
    }
  }

  /* ─── Mouse tracking ──────────────────────────────── */
  function onMouseMove(e) {
    if (locked || finished) return;

    var mr = mazeEl.getBoundingClientRect();
    var mx = e.clientX - mr.left;
    var my = e.clientY - mr.top;

    /* delta-based movement */
    var dx = mx - prevRealX;
    var dy = my - prevRealY;

    if (inverted) {
      cx -= dx;
      cy -= dy;
    } else {
      cx += dx;
      cy += dy;
    }

    /* Clamp to maze bounds */
    cx = Math.max(2, Math.min(mazeW - 2, cx));
    cy = Math.max(2, Math.min(mazeH - 2, cy));

    prevRealX = mx;
    prevRealY = my;
    realX = mx;
    realY = my;

    updateCursorDOM();

    /* Inversion boundary check */
    var invY = mazeH / 2;
    if (cy > invY && !inverted) {
      inverted = true;
      modeVal.textContent = "INVERTED";
      modeVal.style.color = "#ff007f";
      alertText.textContent = "CONTROLS INVERTED";
      alertText.style.color = "#ff007f";
      setTimeout(function () { alertText.style.color = "#475569"; }, 1000);
    } else if (cy <= invY && inverted) {
      inverted = false;
      modeVal.textContent = "NORMAL";
      modeVal.style.color = "#64748b";
      alertText.textContent = "CONTROLS NORMALIZED";
      alertText.style.color = "#00bfff";
      setTimeout(function () { alertText.style.color = "#475569"; }, 800);
    }

    /* Check trap */
    checkTrap();

    /* Evade */
    evade();

    /* Victory */
    checkVictory();
  }

  /* ─── Events ───────────────────────────────────────── */
  function bindEvents() {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", function () {
      /* Don't reset, just stop updating */
    });

    oBtn.addEventListener("click", function () {
      hideOverlay();
      resetGame();
    });

    window.addEventListener("resize", function () {
      build();
      resetGame();
    });
  }

  function resetGame() {
    finished = false;
    locked = false;
    trapped = false;
    inverted = false;
    attempts = 0;
    rage = 0;
    attemptsVal.textContent = "0";
    rageFill.style.width = "0%";
    alertText.textContent = "RESET";
    alertText.style.color = "#475569";
    modeVal.textContent = "NORMAL";
    modeVal.style.color = "#64748b";

    if (trapToggleWall) trapToggleWall.style.display = "none";

    finishX = FINISH_INIT.l / 100 * mazeW;
    finishY = FINISH_INIT.t / 100 * mazeH;
    updateFinishDOM();

    cx = startCX;
    cy = startCY;
    updateCursorDOM();
  }

  /* ─── Init ─────────────────────────────────────────── */
  function init() {
    bindEvents();
    build();
    alertText.textContent = "NAVIGATE TO FINISH";
  }

  init();
})();
