(function () {
  "use strict";

  var canvas    = document.getElementById("gameCanvas");
  var ctx       = canvas.getContext("2d");
  var agtVal    = document.getElementById("agtVal");
  var velVal    = document.getElementById("velVal");
  var clsVal    = document.getElementById("clsVal");
  var addBtn    = document.getElementById("addBtn");
  var clearBtn  = document.getElementById("clearBtn");
  var predBtn   = document.getElementById("predBtn");
  var hint      = document.getElementById("hint");

  var sepW   = document.getElementById("sepW");
  var aliW   = document.getElementById("aliW");
  var cohW   = document.getElementById("cohW");
  var radSlider = document.getElementById("radSlider");
  var spdSlider = document.getElementById("spdSlider");

  /* ─── State ──────────────────────────────────── */
  var W, H;
  var boids = [];
  var reqId;

  /* ─── Resize ──────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height);
    canvas.width  = W;
    canvas.height = H;
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── Boid factory ───────────────────────────── */
  function createBoid(x, y, predator) {
    var ang = Math.random() * Math.PI * 2;
    var spd = 0.5 + Math.random() * 1.5;
    return {
      x: x !== undefined ? x : Math.random() * W,
      y: y !== undefined ? y : Math.random() * H,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      predator: predator || false,
    };
  }

  /* ─── Spawn helpers ──────────────────────────── */
  function addBoids(count, x, y) {
    for (var i = 0; i < count; i++) {
      boids.push(createBoid(x, y, false));
    }
  }

  function addPredator() {
    boids.push(createBoid(20 + Math.random() * (W - 40), 20 + Math.random() * (H - 40), true));
  }

  /* ─── Update ──────────────────────────────────── */
  function update() {
    var sepWeight = parseFloat(sepW.value);
    var aliWeight = parseFloat(aliW.value);
    var cohWeight = parseFloat(cohW.value);
    var radius = parseInt(radSlider.value, 10);
    var maxSpeed = parseFloat(spdSlider.value);
    var radiusSq = radius * radius;

    for (var i = 0; i < boids.length; i++) {
      var b = boids[i];

      var sepX = 0, sepY = 0;
      var aliX = 0, aliY = 0;
      var cohX = 0, cohY = 0;
      var neighbors = 0;

      for (var j = 0; j < boids.length; j++) {
        if (j === i) continue;
        var o = boids[j];

        /* Toroidal distance */
        var dx = o.x - b.x;
        var dy = o.y - b.y;
        if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
        if (dy > H / 2) dy -= H; else if (dy < -H / 2) dy += H;

        var distSq = dx * dx + dy * dy;
        if (distSq > radiusSq || distSq < 0.1) continue;

        /* Predator: flee or chase */
        if (o.predator && !b.predator) {
          sepX -= dx / distSq;
          sepY -= dy / distSq;
          continue;
        }
        if (b.predator && !o.predator) {
          sepX += dx / distSq;
          sepY += dy / distSq;
          aliX += o.vx; aliY += o.vy;
          cohX += dx; cohY += dy;
          neighbors++;
          continue;
        }
        if (b.predator && o.predator) continue;

        /* Standard boid-boid */
        sepX -= dx / distSq;
        sepY -= dy / distSq;
        aliX += o.vx; aliY += o.vy;
        cohX += dx; cohY += dy;
        neighbors++;
      }

      if (neighbors > 0) {
        /* Alignment: average velocity */
        aliX /= neighbors; aliY /= neighbors;
        var aliMag = Math.sqrt(aliX * aliX + aliY * aliY);
        if (aliMag > 0) { aliX /= aliMag; aliY /= aliMag; }

        /* Cohesion: average position offset */
        cohX /= neighbors; cohY /= neighbors;
        var cohMag = Math.sqrt(cohX * cohX + cohY * cohY);
        if (cohMag > 0) { cohX /= cohMag; cohY /= cohMag; }
      }

      /* Apply weighted forces */
      var ax = sepX * sepWeight + aliX * aliWeight + cohX * cohWeight;
      var ay = sepY * sepWeight + aliY * aliWeight + cohY * cohWeight;

      b.vx += ax; b.vy += ay;

      /* Limit speed */
      var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > maxSpeed) {
        b.vx = (b.vx / speed) * maxSpeed;
        b.vy = (b.vy / speed) * maxSpeed;
      }

      /* Update position */
      b.x += b.vx;
      b.y += b.vy;

      /* Toroidal wrap */
      if (b.x < 0) b.x += W; else if (b.x > W) b.x -= W;
      if (b.y < 0) b.y += H; else if (b.y > H) b.y -= H;
    }

    /* Telemetry */
    agtVal.textContent = boids.length;
    if (boids.length > 0) {
      var totalV = 0;
      for (var k = 0; k < boids.length; k++) {
        totalV += Math.sqrt(boids[k].vx * boids[k].vx + boids[k].vy * boids[k].vy);
      }
      velVal.textContent = (totalV / boids.length).toFixed(2);
    }
    /* Cluster estimate: rough — count groups within 2× radius of each other */
    var clusters = estimateClusters(radius);
    clsVal.textContent = clusters;
  }

  /* ─── Cluster estimation ─────────────────────── */
  function estimateClusters(r) {
    if (boids.length === 0) return 0;
    var visited = new Array(boids.length);
    var groups = 0;
    var rSq = r * r * 4;

    for (var i = 0; i < boids.length; i++) {
      if (visited[i]) continue;
      visited[i] = true;
      groups++;
      var stack = [i];
      while (stack.length) {
        var idx = stack.pop();
        for (var j = 0; j < boids.length; j++) {
          if (visited[j]) continue;
          var dx = boids[j].x - boids[idx].x;
          var dy = boids[j].y - boids[idx].y;
          if (dx > W / 2) dx -= W; else if (dx < -W / 2) dx += W;
          if (dy > H / 2) dy -= H; else if (dy < -H / 2) dy += H;
          if (dx * dx + dy * dy < rSq) {
            visited[j] = true;
            stack.push(j);
          }
        }
      }
    }
    return groups;
  }

  /* ─── Draw ────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Faint grid */
    ctx.strokeStyle = "rgba(0,240,255,0.004)";
    ctx.lineWidth = 1;
    var gs = 40;
    for (var gx = 0; gx < W; gx += gs) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += gs) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    for (var i = 0; i < boids.length; i++) {
      var b = boids[i];
      var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed < 0.01) continue;

      var angle = Math.atan2(b.vy, b.vx);
      var size = b.predator ? 14 : 7 + speed * 2;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      if (b.predator) {
        ctx.shadowColor = "rgba(255,20,50,0.5)";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#ff2a5f";
        /* Larger diamond shape for predator */
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(0, size * 0.5);
        ctx.lineTo(-size, 0);
        ctx.lineTo(0, -size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowColor = "rgba(0,240,255,0.2)";
        ctx.shadowBlur = 8;
        /* Triangle */
        ctx.fillStyle = "#00f0ff";
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.5, -size * 0.5);
        ctx.lineTo(-size * 0.5, size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }
  }

  /* ─── Loop ────────────────────────────────────── */
  function loop() {
    update();
    draw();
    reqId = requestAnimationFrame(loop);
  }

  /* ─── Click spawn ────────────────────────────── */
  function spawnAtMouse(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var mx, my;
    if (e.touches) {
      mx = (e.touches[0].clientX - rect.left) * scaleX;
      my = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      mx = (e.clientX - rect.left) * scaleX;
      my = (e.clientY - rect.top) * scaleY;
    }
    addBoids(10, mx, my);
    hint.classList.add("hint-fade");
  }

  /* ─── Input ───────────────────────────────────── */
  function bindEvents() {
    canvas.addEventListener("click", spawnAtMouse);
    canvas.addEventListener("touchstart", function (e) {
      e.preventDefault();
      spawnAtMouse(e);
    }, { passive: false });

    addBtn.addEventListener("click", function () { addBoids(50); });
    clearBtn.addEventListener("click", function () { boids = []; });
    predBtn.addEventListener("click", addPredator);

    /* Sliders */
    var sliders = [
      { el: sepW, id: "sepVal" },
      { el: aliW, id: "aliVal" },
      { el: cohW, id: "cohVal" },
      { el: radSlider, id: "radVal" },
      { el: spdSlider, id: "spdVal" },
    ];
    sliders.forEach(function (s) {
      s.el.addEventListener("input", function () {
        document.getElementById(s.id).textContent = parseFloat(s.el.value).toFixed(2);
      });
    });
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    bindEvents();
    resize();
    addBoids(100);
    loop();
  }

  init();
})();
