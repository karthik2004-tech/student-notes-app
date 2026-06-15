(function () {
  "use strict";

  /* ─── DOM refs ───────────────────────────────── */
  var mapCanvas     = document.getElementById("mapCanvas");
  var viewCanvas    = document.getElementById("viewCanvas");
  var mCtx          = mapCanvas.getContext("2d");
  var vCtx          = viewCanvas.getContext("2d");
  var fovSlider     = document.getElementById("fovSlider");
  var resSlider     = document.getElementById("resSlider");
  var rangeSlider   = document.getElementById("rangeSlider");
  var headVal       = document.getElementById("headVal");
  var blockVal      = document.getElementById("blockVal");
  var rayVal        = document.getElementById("rayVal");
  var drawVal       = document.getElementById("drawVal");

  /* ─── Canvas sizes ────────────────────────────── */
  var MW, MH, VW, VH;

  function resizeCanvases() {
    var r1 = mapCanvas.parentElement.getBoundingClientRect();
    MW = Math.floor(r1.width); MH = Math.floor(r1.height);
    mapCanvas.width = MW; mapCanvas.height = MH;
    mapCanvas.style.width = MW + "px"; mapCanvas.style.height = MH + "px";

    var r2 = viewCanvas.parentElement.getBoundingClientRect();
    VW = Math.floor(r2.width); VH = Math.floor(r2.height);
    viewCanvas.width = VW; viewCanvas.height = VH;
    viewCanvas.style.width = VW + "px"; viewCanvas.style.height = VH + "px";
  }
  window.addEventListener("resize", function () { resizeCanvases(); });

  /* ─── Grid ────────────────────────────────────── */
  var GRID = 14;
  var grid = [];
  var tileSize = 0;

  function generateMaze() {
    grid = [];
    for (var r = 0; r < GRID; r++) {
      grid[r] = [];
      for (var c = 0; c < GRID; c++) {
        if (r === 0 || r === GRID - 1 || c === 0 || c === GRID - 1) {
          grid[r][c] = 1;
        } else {
          grid[r][c] = Math.random() < 0.28 ? 1 : 0;
        }
      }
    }
    /* carve spawn area */
    grid[1][1] = 0; grid[1][2] = 0; grid[2][1] = 0;
    grid[GRID - 2][GRID - 2] = 0;
    updateBlockCount();
  }

  function updateBlockCount() {
    var count = 0;
    for (var r = 0; r < GRID; r++)
      for (var c = 0; c < GRID; c++)
        if (grid[r][c] === 1) count++;
    blockVal.textContent = count;
  }

  function toggleWall(r, c) {
    if (r <= 0 || r >= GRID - 1 || c <= 0 || c >= GRID - 1) return;
    grid[r][c] = grid[r][c] === 1 ? 0 : 1;
    updateBlockCount();
  }

  /* ─── Player ──────────────────────────────────── */
  var px = 2.5, py = 2.5;
  var pa = 0; /* radians, 0 = east */
  var moveSpeed = 0.045;
  var rotSpeed  = 0.035;

  function resetCamera() {
    px = 2.5; py = 2.5; pa = 0;
  }

  /* ─── Get slider values ───────────────────────── */
  function getFOV()   { return parseFloat(fovSlider.value); }
  function getRes()   { return parseInt(resSlider.value, 10); }
  function getRange() { return parseFloat(rangeSlider.value); }

  /* ─── DDA Raycasting ──────────────────────────── */
  function castRay(angle) {
    var dirX = Math.cos(angle);
    var dirY = Math.sin(angle);

    /* which grid cell we are in */
    var mapX = Math.floor(px);
    var mapY = Math.floor(py);

    /* length of ray from one side to next */
    var deltaDistX = dirX === 0 ? 1e30 : Math.abs(1 / dirX);
    var deltaDistY = dirY === 0 ? 1e30 : Math.abs(1 / dirY);

    /* step direction + initial side distance */
    var stepX, stepY;
    var sideDistX, sideDistY;

    if (dirX < 0) { stepX = -1; sideDistX = (px - mapX) * deltaDistX; }
    else          { stepX = 1;  sideDistX = (mapX + 1.0 - px) * deltaDistX; }

    if (dirY < 0) { stepY = -1; sideDistY = (py - mapY) * deltaDistY; }
    else          { stepY = 1;  sideDistY = (mapY + 1.0 - py) * deltaDistY; }

    var hit = 0, side = 0;
    var maxDist = getRange();

    /* DDA walk */
    while (hit === 0) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }
      if (mapX < 0 || mapX >= GRID || mapY < 0 || mapY >= GRID) { hit = 1; break; }
      if (grid[mapY][mapX] === 1) hit = 1;
    }

    /* perpendicular distance (avoids fish-eye naturally, but we compute raw first) */
    var perpDist;
    if (side === 0) perpDist = (mapX - px + (1 - stepX) / 2) / dirX;
    else            perpDist = (mapY - py + (1 - stepY) / 2) / dirY;

    if (perpDist < 0.01) perpDist = 0.01;

    /* Apply explicit fish-eye correction: dist * cos(rayAngle - playerAngle) */
    var rawDist = perpDist;
    var correctedDist = rawDist * Math.cos(angle - pa);
    if (correctedDist < 0.01) correctedDist = 0.01;

    return {
      dist: correctedDist,
      side: side,
      mapX: mapX,
      mapY: mapY,
      hitX: px + dirX * rawDist,
      hitY: py + dirY * rawDist,
    };
  }

  /* ─── 3D Viewport rendering ──────────────────── */
  function render3D() {
    var fov    = getFOV() * Math.PI / 180;
    var res    = getRes();
    var maxRng = getRange();
    var numCols = Math.floor(VW / res);

    /* sky & floor */
    vCtx.fillStyle = "#0a0c14";
    vCtx.fillRect(0, 0, VW, VH / 2);
    vCtx.fillStyle = "#0d0f18";
    vCtx.fillRect(0, VH / 2, VW, VH / 2);

    var rayCount = 0;

    for (var i = 0; i < numCols; i++) {
      var rayAngle = pa - fov / 2 + (i / numCols) * fov;
      var result = castRay(rayAngle);
      rayCount++;

      var dist = result.dist;
      if (dist > maxRng) dist = maxRng;

      /* slice height */
      var sliceH = (GRID / dist) * (VW / 2);
      if (sliceH > VH * 2) sliceH = VH * 2;

      var top = (VH - sliceH) / 2;
      var x = i * res;

      /* shading: close = bright, far = dim */
      var shade = 1 - (dist / maxRng);
      if (shade < 0.05) shade = 0.05;

      var baseR = 255, baseG = 42, baseB = 95; /* #ff2a5f */
      if (result.side === 1) { /* darker for y-side hits */
        baseR = 200; baseG = 30; baseB = 70;
      }

      var r = Math.floor(baseR * shade);
      var g = Math.floor(baseG * shade);
      var b = Math.floor(baseB * shade);
      vCtx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      vCtx.fillRect(x, top, res, sliceH);
    }

    rayVal.textContent = rayCount;
  }

  /* ─── 2D Radar Map ───────────────────────────── */
  function render2D() {
    tileSize = Math.min(MW, MH) / GRID;
    var ts = tileSize;

    /* background */
    mCtx.fillStyle = "#04050a";
    mCtx.fillRect(0, 0, MW, MH);

    /* grid cells */
    for (var r = 0; r < GRID; r++) {
      for (var c = 0; c < GRID; c++) {
        if (grid[r][c] === 1) {
          mCtx.fillStyle = "#1a1a3a";
          mCtx.fillRect(c * ts, r * ts, ts, ts);
          mCtx.strokeStyle = "rgba(0,240,255,0.06)";
          mCtx.lineWidth = 0.5;
          mCtx.strokeRect(c * ts, r * ts, ts, ts);
        } else {
          mCtx.strokeStyle = "rgba(0,240,255,0.02)";
          mCtx.lineWidth = 0.5;
          mCtx.strokeRect(c * ts, r * ts, ts, ts);
        }
      }
    }

    /* cast rays on 2D */
    var fov    = getFOV() * Math.PI / 180;
    var res    = getRes();
    var numCols = Math.floor(VW / res);
    var maxRng = getRange();

    mCtx.strokeStyle = "rgba(0,240,255,0.15)";
    mCtx.lineWidth = 0.5;
    for (var i = 0; i < numCols; i += 3) {
      var rayAngle = pa - fov / 2 + (i / numCols) * fov;
      var result = castRay(rayAngle);
      var dirX = Math.cos(rayAngle);
      var dirY = Math.sin(rayAngle);
      var endDist = result.dist;
      if (endDist > maxRng) endDist = maxRng;
      var ex = px * ts + dirX * endDist * ts;
      var ey = py * ts + dirY * endDist * ts;
      mCtx.beginPath();
      mCtx.moveTo(px * ts, py * ts);
      mCtx.lineTo(ex, ey);
      mCtx.stroke();
    }

    /* player dot */
    mCtx.fillStyle = "#00f0ff";
    mCtx.shadowColor = "#00f0ff";
    mCtx.shadowBlur = 6;
    mCtx.beginPath();
    mCtx.arc(px * ts, py * ts, 3, 0, Math.PI * 2);
    mCtx.fill();

    /* direction line */
    mCtx.shadowBlur = 0;
    mCtx.strokeStyle = "#ff2a5f";
    mCtx.lineWidth = 1.5;
    mCtx.beginPath();
    mCtx.moveTo(px * ts, py * ts);
    mCtx.lineTo((px + Math.cos(pa) * 1.2) * ts, (py + Math.sin(pa) * 1.2) * ts);
    mCtx.stroke();
  }

  /* ─── Collision detection ────────────────────── */
  function canMove(x, y) {
    if (x < 0.25 || x >= GRID - 0.25 || y < 0.25 || y >= GRID - 0.25) return false;
    var r = Math.floor(y);
    var c = Math.floor(x);
    /* check surrounding cells */
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
        if (grid[nr][nc] === 1) {
          /* AABB vs point with margin */
          if (x > nc - 0.2 && x < nc + 1.2 && y > nr - 0.2 && y < nr + 1.2) return false;
        }
      }
    }
    return true;
  }

  /* ─── Keyboard ────────────────────────────────── */
  var keys = {};

  function handleKeys() {
    var dx = 0, dy = 0;
    if (keys["ArrowUp"] || keys["KeyW"])    { dx += Math.cos(pa) * moveSpeed; dy += Math.sin(pa) * moveSpeed; }
    if (keys["ArrowDown"] || keys["KeyS"])  { dx -= Math.cos(pa) * moveSpeed; dy -= Math.sin(pa) * moveSpeed; }
    if (keys["ArrowLeft"] || keys["KeyA"])  { pa -= rotSpeed; }
    if (keys["ArrowRight"] || keys["KeyD"]) { pa += rotSpeed; }

    if (dx !== 0 || dy !== 0) {
      if (canMove(px + dx, py + dy)) { px += dx; py += dy; }
      else if (canMove(px + dx, py)) { px += dx; }
      else if (canMove(px, py + dy)) { py += dy; }
    }

    if (pa < 0) pa += Math.PI * 2;
    if (pa > Math.PI * 2) pa -= Math.PI * 2;
  }

  document.addEventListener("keydown", function (e) {
    keys[e.code] = true;
    if (e.code.indexOf("Arrow") === 0 || e.code.indexOf("Key") === 0) e.preventDefault();
  });
  document.addEventListener("keyup", function (e) {
    keys[e.code] = false;
  });

  /* ─── Click to toggle walls on map ────────────── */
  mapCanvas.addEventListener("click", function (e) {
    var rect = mapCanvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var scaleX = mapCanvas.width / rect.width;
    var scaleY = mapCanvas.height / rect.height;
    mx *= scaleX; my *= scaleY;

    var ts = tileSize || (Math.min(MW, MH) / GRID);
    var r = Math.floor(my / ts);
    var c = Math.floor(mx / ts);
    toggleWall(r, c);
  });

  /* ─── Slider display sync ─────────────────────── */
  fovSlider.addEventListener("input", function () { document.getElementById("fovVal").textContent = fovSlider.value; });
  resSlider.addEventListener("input", function () { document.getElementById("resVal").textContent = resSlider.value; });
  rangeSlider.addEventListener("input", function () { document.getElementById("rangeVal").textContent = rangeSlider.value; });

  /* ─── Buttons ─────────────────────────────────── */
  document.getElementById("genBtn").addEventListener("click", function () {
    generateMaze();
    resetCamera();
  });
  document.getElementById("resetBtn").addEventListener("click", resetCamera);

  /* ─── Main loop ──────────────────────────────── */
  var lastTime = performance.now();

  function loop(now) {
    handleKeys();

    var t0 = performance.now();
    render3D();
    render2D();
    var t1 = performance.now();

    headVal.textContent = ((pa * 180 / Math.PI) % 360).toFixed(1) + "\u00B0";
    drawVal.textContent = (t1 - t0).toFixed(2);

    requestAnimationFrame(loop);
  }

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resizeCanvases();
    generateMaze();
    resetCamera();
    requestAnimationFrame(loop);
  }

  init();
})();
