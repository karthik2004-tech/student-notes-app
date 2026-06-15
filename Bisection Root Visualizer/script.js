(function () {
  "use strict";

  var eqnSel  = document.getElementById("eqnSel");
  var inputA  = document.getElementById("inputA");
  var inputB  = document.getElementById("inputB");
  var tolSlider = document.getElementById("tolSlider");
  var tolVal  = document.getElementById("tolVal");
  var ivtWarn = document.getElementById("ivtWarn");
  var panel   = document.getElementById("panel");

  var markA   = document.getElementById("markA");
  var markM   = document.getElementById("markM");
  var markB   = document.getElementById("markB");
  var valA    = document.getElementById("valA");
  var valM    = document.getElementById("valM");
  var valB    = document.getElementById("valB");
  var rootDisplay = document.getElementById("currentRoot");
  var rootVal = document.getElementById("rootVal");
  var vizBar  = document.getElementById("vizBar");

  var logBody = document.getElementById("logBody");

  var stepBtn  = document.getElementById("stepBtn");
  var runBtn   = document.getElementById("runBtn");
  var clearBtn = document.getElementById("clearBtn");

  /* ─── State ──────────────────────────────────── */
  var a, b, c, tolerance;
  var iter = 0;
  var running = false;
  var converged = false;

  /* ─── Safe evaluator ─────────────────────────── */
  function safeEval(expr, x) {
    try {
      var fn = new Function("x", "return " + expr + ";");
      var result = fn(x);
      if (typeof result !== "number" || !isFinite(result)) throw new Error("Invalid result");
      return result;
    } catch (e) {
      return NaN;
    }
  }

  /* ─── Current equation ───────────────────────── */
  function getExpr() { return eqnSel.value; }

  /* ─── Read inputs ────────────────────────────── */
  function readInputs() {
    a = parseFloat(inputA.value);
    b = parseFloat(inputB.value);
    tolerance = parseFloat(tolSlider.value);
    tolVal.textContent = tolerance.toFixed(4);
    if (isNaN(a) || isNaN(b)) return false;
    if (a >= b) return false;
    return true;
  }

  /* ─── IVT check ──────────────────────────────── */
  function checkIVT() {
    if (!readInputs()) {
      ivtWarn.classList.remove("hidden");
      ivtWarn.textContent = "Invalid bounds: ensure a < b";
      return false;
    }
    var expr = getExpr();
    var fa = safeEval(expr, a);
    var fb = safeEval(expr, b);
    if (isNaN(fa) || isNaN(fb)) {
      ivtWarn.classList.remove("hidden");
      ivtWarn.textContent = "Error evaluating function at bounds";
      return false;
    }
    if (fa * fb > 0) {
      ivtWarn.classList.remove("hidden");
      stepBtn.disabled = true; runBtn.disabled = true;
      panel.classList.remove("shake"); void panel.offsetWidth; panel.classList.add("shake");
      setTimeout(function () { panel.classList.remove("shake"); }, 350);
      return false;
    }
    ivtWarn.classList.add("hidden");
    stepBtn.disabled = false; runBtn.disabled = false;
    return true;
  }

  /* ─── Update viz bar ─────────────────────────── */
  function updateViz() {
    var totalSpan = parseFloat(valB.textContent) - parseFloat(valA.textContent);
    if (totalSpan <= 0) return;

    var pA = ((a - parseFloat(valA.textContent)) / totalSpan) * 100;
    var pB = ((b - parseFloat(valA.textContent)) / totalSpan) * 100;
    var pM = c !== undefined ? ((c - parseFloat(valA.textContent)) / totalSpan) * 100 : 50;

    markA.style.left = Math.max(0, Math.min(100, pA)) + "%";
    markB.style.left = Math.max(0, Math.min(100, pB)) + "%";

    if (c !== undefined) {
      markM.classList.remove("hidden");
      markM.style.left = Math.max(0, Math.min(100, pM)) + "%";
      valM.classList.remove("hidden");
      valM.textContent = c.toFixed(4);
    }

    valA.textContent = a.toFixed(4);
    valB.textContent = b.toFixed(4);
  }

  /* ─── Compute step ───────────────────────────── */
  function computeStep() {
    if (converged || !readInputs()) return false;
    if (!checkIVT()) return false;

    iter++;
    c = (a + b) / 2;
    var expr = getExpr();
    var fc = safeEval(expr, c);
    var fa = safeEval(expr, a);
    var width = Math.abs(b - a);

    /* Narrow interval */
    if (fa * fc < 0) { b = c; } else { a = c; }

    /* Log entry */
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + iter + "</td>" +
      "<td>" + a.toFixed(4) + "</td>" +
      "<td>" + b.toFixed(4) + "</td>" +
      "<td>" + c.toFixed(4) + "</td>" +
      "<td>" + (isNaN(fc) ? "NaN" : fc.toFixed(4)) + "</td>" +
      "<td>" + width.toFixed(4) + "</td>";
    logBody.appendChild(row);
    logBody.parentElement.scrollTop = logBody.parentElement.scrollHeight;

    /* Update display */
    inputA.value = a.toFixed(4);
    inputB.value = b.toFixed(4);
    updateViz();

    /* Convergence check */
    if (width < tolerance) {
      converged = true;
      stepBtn.disabled = true; runBtn.disabled = true;
      rootDisplay.classList.remove("hidden");
      rootVal.textContent = c.toFixed(6);
      return true;
    }

    checkIVT();
    return true;
  }

  /* ─── Run to convergence ─────────────────────── */
  function runToConvergence() {
    if (converged || running) return;
    running = true;
    stepBtn.disabled = true; runBtn.disabled = true;

    function step() {
      var ok = computeStep();
      if (!ok || converged) {
        running = false;
        stepBtn.disabled = converged ? true : false;
        runBtn.disabled = converged ? true : false;
        return;
      }
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  /* ─── Clear / Reset ──────────────────────────── */
  function clearAll() {
    iter = 0; converged = false; running = false; c = undefined;
    stepBtn.disabled = false; runBtn.disabled = false;
    rootDisplay.classList.add("hidden");
    markM.classList.add("hidden");
    valM.classList.add("hidden");
    ivtWarn.classList.add("hidden");
    logBody.innerHTML = "";

    /* Reset a, b to preset defaults */
    var expr = getExpr();
    /* Preset default bounds based on equation */
    var defaults = {
      "x*x-4":              { a: 0,  b: 4 },
      "x*x*x-x-2":          { a: 1,  b: 2 },
      "Math.cos(x)-x":      { a: 0,  b: 1.5 },
    };
    var d = defaults[expr] || { a: 0, b: 4 };
    inputA.value = d.a;
    inputB.value = d.b;

    readInputs();
    updateViz();
    checkIVT();
  }

  /* ─── Events ─────────────────────────────────── */
  function bindEvents() {
    stepBtn.addEventListener("click", function () {
      if (converged || running) return;
      if (iter === 0) {
        if (!readInputs()) return;
        if (!checkIVT()) return;
        /* Store initial bounds for viz reference */
        valA.textContent = a.toFixed(4);
        valB.textContent = b.toFixed(4);
      }
      computeStep();
    });

    runBtn.addEventListener("click", runToConvergence);
    clearBtn.addEventListener("click", clearAll);

    eqnSel.addEventListener("change", clearAll);
    inputA.addEventListener("change", function () { if (iter === 0) { clearAll(); } else { checkIVT(); } });
    inputB.addEventListener("change", function () { if (iter === 0) { clearAll(); } else { checkIVT(); } });
    tolSlider.addEventListener("input", function () {
      tolerance = parseFloat(tolSlider.value);
      tolVal.textContent = tolerance.toFixed(4);
    });
  }

  /* ─── Init ───────────────────────────────────── */
  function init() {
    bindEvents();
    clearAll();
  }

  init();
})();
