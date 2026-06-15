(function () {
  "use strict";

  var canvas    = document.getElementById("gameCanvas");
  var ctx       = canvas.getContext("2d");
  var satVal    = document.getElementById("satVal");
  var peakVal   = document.getElementById("peakVal");
  var coordVal  = document.getElementById("coordVal");
  var clearBtn  = document.getElementById("clearBtn");
  var resetBtn  = document.getElementById("resetBtn");
  var hint      = document.getElementById("hint");

  var gSlider   = document.getElementById("gSlider");
  var massSlider= document.getElementById("massSlider");
  var trailSlider= document.getElementById("trailSlider");
  var trailsChk = document.getElementById("trailsChk");

  /* ─── State ──────────────────────────────────── */
  var W, H, cx, cy;
  var G = 800, mass = 3000, trailLen = 60, showTrails = true;
  var star = { x: 0, y: 0, r: 14 };
  var planets = [];
  var peakV = 0;
  var reqId, running = true;

  /* Drag state */
  var drag = { active: false, sx: 0, sy: 0, mx: 0, my: 0 };

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    cx = W / 2; cy = H / 2;
    star.x = cx; star.y = cy;
    star.r = Math.max(8, Math.min(24, W * 0.025));
  }
  window.addEventListener("resize", resize);

  /* ─── Planet factory ─────────────────────────── */
  function createPlanet(x, y, vx, vy) {
    return {
      x: x, y: y,
      vx: vx, vy: vy,
      r: 2 + Math.random() * 2.5,
      trail: [],
    };
  }

  /* ─── Update physics ─────────────────────────── */
  function update() {
    var g = parseFloat(gSlider.value);
    var m = parseFloat(massSlider.value);

    for (var i = planets.length - 1; i >= 0; i--) {
      var p = planets[i];
      var dx = star.x - p.x;
      var dy = star.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      /* Collision with star */
      if (dist < star.r + p.r) {
        spawnRing(p.x, p.y);
        planets.splice(i, 1);
        continue;
      }

      /* Out of bounds */
      if (p.x < -200 || p.x > W + 200 || p.y < -200 || p.y > H + 200) {
        planets.splice(i, 1);
        continue;
      }

      /* Newton's inverse square */
      var a = (g * m) / (dist * dist * dist);
      var ax = a * dx;
      var ay = a * dy;

      p.vx += ax;
      p.vy += ay;
      p.x  += p.vx;
      p.y  += p.vy;

      /* Track peak velocity */
      var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > peakV) { peakV = speed; peakVal.textContent = peakV.toFixed(2); }

      /* Trail */
      if (showTrails) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > trailLen) p.trail.shift();
      } else {
        p.trail = [];
      }
    }

    /* Telemetry */
    satVal.textContent = planets.length;
    coordVal.textContent = Math.round(star.x - cx) + ", " + Math.round(cy - star.y);
  }

  /* ─── Rings ──────────────────────────────────── */
  var rings = [];

  function spawnRing(x, y) {
    rings.push({ x: x, y: y, r: 4, life: 1 });
  }

  function updateRings() {
    for (var i = rings.length - 1; i >= 0; i--) {
      var r = rings[i];
      r.r += 0.5;
      r.life -= 0.025;
      if (r.life <= 0) rings.splice(i, 1);
    }
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = "rgba(0,240,255,0.006)";
    ctx.lineWidth = 1;
    var gs = 50;
    for (var gx = (cx % gs); gx < W; gx += gs) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = (cy % gs); gy < H; gy += gs) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    /* Trails */
    if (showTrails) {
      for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        var tr = p.trail;
        if (tr.length < 2) continue;
        for (var j = 1; j < tr.length; j++) {
          var alpha = (j / tr.length) * 0.6;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#00ff88";
          ctx.lineWidth = 1.2;
          ctx.shadowColor = "rgba(0,255,136,0.15)";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(tr[j - 1].x, tr[j - 1].y);
          ctx.lineTo(tr[j].x, tr[j].y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }

    /* Planets */
    for (var pi = 0; pi < planets.length; pi++) {
      var pl = planets[pi];
      ctx.shadowColor = "rgba(0,240,255,0.25)";
      ctx.shadowBlur = 10;
      var pg = ctx.createRadialGradient(pl.x - pl.r * 0.3, pl.y - pl.r * 0.3, 0, pl.x, pl.y, pl.r);
      pg.addColorStop(0, "rgba(0,240,255,0.6)");
      pg.addColorStop(1, "rgba(0,240,255,0.05)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* Star */
    ctx.shadowColor = "rgba(255,183,0,0.5)";
    ctx.shadowBlur = 30;

    /* Outer glow */
    var sg = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.r * 3);
    sg.addColorStop(0, "rgba(255,183,0,0.15)");
    sg.addColorStop(0.4, "rgba(255,183,0,0.04)");
    sg.addColorStop(1, "rgba(255,183,0,0)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * 3, 0, Math.PI * 2);
    ctx.fill();

    /* Star body */
    ctx.shadowColor = "rgba(255,183,0,0.6)";
    ctx.shadowBlur = 20;
    var sg2 = ctx.createRadialGradient(star.x - star.r * 0.3, star.y - star.r * 0.3, 0, star.x, star.y, star.r);
    sg2.addColorStop(0, "#ffe066");
    sg2.addColorStop(0.6, "#ffb700");
    sg2.addColorStop(1, "#cc7a00");
    ctx.fillStyle = sg2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    /* Rings (impact effects) */
    for (var ri = 0; ri < rings.length; ri++) {
      var rn = rings[ri];
      ctx.globalAlpha = rn.life;
      ctx.strokeStyle = "rgba(255,183,0,0.6)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(255,183,0,0.3)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(rn.x, rn.y, rn.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    /* Drag vector */
    if (drag.active) {
      ctx.strokeStyle = "rgba(0,240,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(drag.sx, drag.sy);
      ctx.lineTo(drag.mx, drag.my);
      ctx.stroke();
      ctx.setLineDash([]);

      /* Launch dot */
      ctx.fillStyle = "rgba(0,240,255,0.2)";
      ctx.beginPath();
      ctx.arc(drag.sx, drag.sy, 4, 0, Math.PI * 2);
      ctx.fill();

      /* Arrow head */
      var ang = Math.atan2(drag.my - drag.sy, drag.mx - drag.sx);
      var aLen = 10;
      ctx.fillStyle = "rgba(0,240,255,0.3)";
      ctx.beginPath();
      ctx.moveTo(drag.mx, drag.my);
      ctx.lineTo(drag.mx - aLen * Math.cos(ang - 0.4), drag.my - aLen * Math.sin(ang - 0.4));
      ctx.lineTo(drag.mx - aLen * Math.cos(ang + 0.4), drag.my - aLen * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    }
  }

  /* ─── Loop ────────────────────────────────────── */
  function loop() {
    if (!running) return;
    update();
    updateRings();
    draw();
    reqId = requestAnimationFrame(loop);
  }

  /* ─── Launch ──────────────────────────────────── */
  function launchPlanet(sx, sy, mx, my) {
    var dx = mx - sx;
    var dy = my - sy;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) return;

    /* Velocity proportional to drag length, opposite direction */
    var scale = len * 0.04;
    var vx = -dx * scale / len;
    var vy = -dy * scale / len;

    var p = createPlanet(sx, sy, vx, vy);
    planets.push(p);

    hint.classList.add("fade");
  }

  /* ─── Drag handlers ──────────────────────────── */
  function startDrag(x, y) {
    drag.active = true;
    drag.sx = x; drag.sy = y;
    drag.mx = x; drag.my = y;
  }

  function moveDrag(x, y) {
    if (!drag.active) return;
    drag.mx = x; drag.my = y;
  }

  function endDrag(x, y) {
    if (!drag.active) return;
    drag.active = false;
    launchPlanet(drag.sx, drag.sy, x, y);
  }

  /* ─── Input ───────────────────────────────────── */
  function getCanvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function bindEvents() {
    canvas.addEventListener("mousedown", function (e) {
      var p = getCanvasPos(e);
      /* Don't drag from inside star */
      var dx = p.x - star.x, dy = p.y - star.y;
      if (dx * dx + dy * dy < star.r * star.r * 4) return;
      startDrag(p.x, p.y);
    });
    canvas.addEventListener("mousemove", function (e) {
      var p = getCanvasPos(e);
      moveDrag(p.x, p.y);
    });
    canvas.addEventListener("mouseup", function (e) {
      var p = getCanvasPos(e);
      endDrag(p.x, p.y);
    });
    canvas.addEventListener("mouseleave", function () {
      if (drag.active) { endDrag(drag.mx, drag.my); }
    });

    /* Touch */
    canvas.addEventListener("touchstart", function (e) {
      e.preventDefault();
      var p = getCanvasPos(e);
      var dx = p.x - star.x, dy = p.y - star.y;
      if (dx * dx + dy * dy < star.r * star.r * 4) return;
      startDrag(p.x, p.y);
    }, { passive: false });
    canvas.addEventListener("touchmove", function (e) {
      e.preventDefault();
      var p = getCanvasPos(e);
      moveDrag(p.x, p.y);
    }, { passive: false });
    canvas.addEventListener("touchend", function (e) {
      e.preventDefault();
      var p = getCanvasPos(e);
      endDrag(p.x, p.y);
    }, { passive: false });

    /* Controls */
    clearBtn.addEventListener("click", function () {
      planets = [];
      peakV = 0;
      peakVal.textContent = "0.00";
    });
    resetBtn.addEventListener("click", function () {
      planets = [];
      rings = [];
      peakV = 0;
      peakVal.textContent = "0.00";
      hint.classList.remove("fade");
    });

    /* Sliders */
    gSlider.addEventListener("input", function () {
      document.getElementById("gVal").textContent = gSlider.value;
    });
    massSlider.addEventListener("input", function () {
      document.getElementById("massVal").textContent = massSlider.value;
    });
    trailSlider.addEventListener("input", function () {
      trailLen = parseInt(trailSlider.value, 10);
      document.getElementById("trailVal").textContent = trailLen;
    });
    trailsChk.addEventListener("change", function () {
      showTrails = trailsChk.checked;
      if (!showTrails) {
        for (var i = 0; i < planets.length; i++) planets[i].trail = [];
      }
    });
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    bindEvents();
    resize();
    trailLen = parseInt(trailSlider.value, 10);
    showTrails = trailsChk.checked;
    loop();
  }

  init();
})();
