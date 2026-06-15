(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var arena        = document.getElementById("arena");
  var photoLoader  = document.getElementById("photoLoader");
  var uploadBtn    = document.getElementById("uploadBtn");
  var captionInput = document.getElementById("captionInput");
  var countLabel   = document.getElementById("countLabel");
  var scrambleBtn  = document.getElementById("scrambleBtn");
  var purgeBtn     = document.getElementById("purgeBtn");

  /* ─── State ───────────────────────────────────── */
  var maxZIndex = 10;
  var cardCount = 0;
  var dragData = null; /* { el, offsetX, offsetY } */

  /* ─── Create polaroid card ───────────────────── */
  function createCard(src, caption) {
    var card = document.createElement("div");
    card.className = "polaroid";

    /* random initial position */
    var arenaW = arena.clientWidth;
    var arenaH = arena.clientHeight;
    var cw = parseFloat(getComputedStyle(document.body).getPropertyValue('--polaroid-w')) || 180;
    var left = Math.random() * (arenaW - cw);
    var top  = Math.random() * (arenaH - cw * 1.3);

    var angle = (Math.random() * 30) - 15;

    card.style.left = left + "px";
    card.style.top  = top + "px";
    card.style.transform = "rotate(" + angle + "deg)";
    card.style.zIndex = ++maxZIndex;

    /* photo frame */
    var frame = document.createElement("div");
    frame.className = "photoFrame";

    if (src) {
      var img = document.createElement("img");
      img.src = src;
      img.draggable = false;
      frame.appendChild(img);
    } else {
      /* placeholder gradient */
      frame.style.background = "linear-gradient(135deg, #1a2a3a, #0a0c14)";
      var ph = document.createElement("div");
      ph.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#334155;font-size:clamp(16px,2vmin,28px)";
      ph.textContent = "\uD83D\uDCF7";
      frame.appendChild(ph);
    }

    card.appendChild(frame);

    /* caption */
    var cap = document.createElement("div");
    cap.className = "caption";
    cap.textContent = caption || "polaroid \u2661";
    card.appendChild(cap);

    /* drag bind */
    bindDrag(card);

    arena.appendChild(card);
    cardCount++;
    updateCount();
    return card;
  }

  /* ─── Drag engine ─────────────────────────────── */
  function getPos(e) {
    if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function bindDrag(el) {
    function onStart(e) {
      e.preventDefault();
      var pos = getPos(e);
      var rect = el.getBoundingClientRect();
      var arenaRect = arena.getBoundingClientRect();

      dragData = {
        el: el,
        offsetX: pos.x - rect.left,
        offsetY: pos.y - rect.top,
      };

      /* bring to front */
      el.style.zIndex = ++maxZIndex;
    }

    el.addEventListener("mousedown", onStart);
    el.addEventListener("touchstart", onStart, { passive: false });
  }

  /* global move / end */
  document.addEventListener("mousemove", function (e) {
    if (!dragData) return;
    moveCard(e);
  });

  document.addEventListener("touchmove", function (e) {
    if (!dragData) return;
    moveCard(e);
  }, { passive: false });

  function moveCard(e) {
    if (!dragData) return;
    e.preventDefault();
    var pos = getPos(e);
    var arenaRect = arena.getBoundingClientRect();
    var el = dragData.el;
    var elW = el.offsetWidth;
    var elH = el.offsetHeight;

    var newLeft = pos.x - arenaRect.left - dragData.offsetX;
    var newTop  = pos.y - arenaRect.top  - dragData.offsetY;

    /* clamp to arena bounds */
    newLeft = Math.max(0, Math.min(newLeft, arenaRect.width  - elW));
    newTop  = Math.max(0, Math.min(newTop,  arenaRect.height - elH));

    el.style.left = newLeft + "px";
    el.style.top  = newTop  + "px";
  }

  document.addEventListener("mouseup", function () {
    dragData = null;
  });

  document.addEventListener("touchend", function () {
    dragData = null;
  });

  /* ─── Upload handler ──────────────────────────── */
  uploadBtn.addEventListener("click", function () {
    photoLoader.click();
  });

  photoLoader.addEventListener("change", function () {
    var files = Array.from(photoLoader.files);
    files.forEach(function (file) {
      if (!file.type.startsWith("image/")) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        var caption = captionInput.value.trim() || file.name.replace(/\.[^.]+$/, "");
        createCard(e.target.result, caption);
      };
      reader.readAsDataURL(file);
    });
    photoLoader.value = "";
  });

  /* ─── Scramble ─────────────────────────────────── */
  scrambleBtn.addEventListener("click", function () {
    var cards = arena.querySelectorAll(".polaroid");
    cards.forEach(function (card) {
      var angle = (Math.random() * 30) - 15;
      card.style.transform = "rotate(" + angle + "deg)";
    });
  });

  /* ─── Purge ───────────────────────────────────── */
  purgeBtn.addEventListener("click", function () {
    var cards = arena.querySelectorAll(".polaroid");
    cards.forEach(function (card) {
      card.classList.add("purging");
    });
    setTimeout(function () {
      arena.innerHTML = "";
      cardCount = 0;
      maxZIndex = 10;
      updateCount();
      /* re-seed 2 placeholders */
      seedCards();
    }, 450);
  });

  /* ─── Seed placeholder cards ─────────────────── */
  function seedCards() {
    var arenaW = arena.clientWidth;
    var arenaH = arena.clientHeight;
    createCard(null, "hello \u2661");
    createCard(null, "world \u2661");
    /* adjust positions after creation */
    var cards = arena.querySelectorAll(".polaroid");
    if (cards.length >= 2) {
      cards[0].style.left = (arenaW * 0.25 - 90) + "px";
      cards[0].style.top  = (arenaH * 0.3) + "px";
      cards[1].style.left = (arenaW * 0.55 - 90) + "px";
      cards[1].style.top  = (arenaH * 0.4) + "px";
    }
  }

  /* ─── Count ───────────────────────────────────── */
  function updateCount() {
    countLabel.textContent = cardCount + " card" + (cardCount !== 1 ? "s" : "");
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    seedCards();
  }

  init();
})();
