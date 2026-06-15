(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var methodSel   = document.getElementById("methodSel");
  var endpointIn  = document.getElementById("endpointInput");
  var sendBtn     = document.getElementById("sendBtn");
  var headersGrid = document.getElementById("headersGrid");
  var bodyArea    = document.getElementById("bodyArea");
  var statusVal   = document.getElementById("statusVal");
  var latVal      = document.getElementById("latVal");
  var sizeVal     = document.getElementById("sizeVal");
  var respBody    = document.getElementById("respBody");
  var historyLog  = document.getElementById("historyLog");
  var resetBtn    = document.getElementById("resetBtn");
  var addHdrBtn   = document.getElementById("addHdrBtn");

  /* ─── Color method selector ───────────────────── */
  methodSel.addEventListener("change", function () {
    methodSel.className = methodSel.value;
  });
  methodSel.className = "GET";

  /* ─── Mock database ───────────────────────────── */
  var db = {
    products: [
      { id: 1,  title: "Wireless Mouse",       price: 49.99,  stock: 120 },
      { id: 2,  title: "Mechanical Keyboard",    price: 159.99, stock: 45  },
      { id: 3,  title: "USB-C Hub",              price: 79.99,  stock: 200 },
      { id: 4,  title: "Monitor 27\"",           price: 449.99, stock: 30  },
      { id: 5,  title: "Laptop Stand",           price: 34.99,  stock: 80  },
    ],
    nextId: 6,
  };

  var collections = ["products"];

  /* ─── Endpoint parser ─────────────────────────── */
  function parseEndpoint(path) {
    /* strip /api/v1 prefix */
    var rest = path.replace(/^\/api\/v1\/?/, "");
    var parts = rest.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    var col = parts[0];
    if (collections.indexOf(col) === -1) return { err: "Unknown collection: " + col };
    var id = parts.length > 1 ? parseInt(parts[1], 10) : null;
    if (parts.length > 1 && isNaN(id)) return { err: "Invalid ID: " + parts[1] };
    return { collection: col, id: id };
  }

  /* ─── Response builder ────────────────────────── */
  function respond(status, data, latency) {
    return { status: status, data: data, latency: latency };
  }

  /* ─── Delay simulation ────────────────────────── */
  function delay(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* ─── CRUD Handlers ──────────────────────────── */
  function handleGET(target) {
    if (target.err) return respond(404, { error: target.err }, 0);
    var data = db[target.collection];
    if (target.id !== null) {
      var item = data.filter(function (d) { return d.id === target.id; });
      if (item.length === 0) return respond(404, { error: "Resource not found" }, 0);
      return respond(200, item[0], 0);
    }
    return respond(200, data, 0);
  }

  function handlePOST(target, bodyStr) {
    if (target.err) return respond(404, { error: target.err }, 0);
    var parsed;
    try { parsed = JSON.parse(bodyStr); }
    catch (e) { return respond(400, { error: "Invalid JSON body" }, 0); }
    parsed.id = db.nextId++;
    db[target.collection].push(parsed);
    return respond(201, parsed, 0);
  }

  function handlePUT(target, bodyStr) {
    if (target.err) return respond(404, { error: target.err }, 0);
    if (target.id === null) return respond(400, { error: "ID required for PUT" });
    var parsed;
    try { parsed = JSON.parse(bodyStr); }
    catch (e) { return respond(400, { error: "Invalid JSON body" }, 0); }
    var data = db[target.collection];
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === target.id) {
        parsed.id = target.id;
        data[i] = parsed;
        return respond(200, parsed, 0);
      }
    }
    return respond(404, { error: "Resource not found" });
  }

  function handleDELETE(target) {
    if (target.err) return respond(404, { error: target.err }, 0);
    if (target.id === null) return respond(400, { error: "ID required for DELETE" });
    var data = db[target.collection];
    for (var i = 0; i < data.length; i++) {
      if (data[i].id === target.id) {
        data.splice(i, 1);
        return respond(200, { message: "Deleted resource " + target.id }, 0);
      }
    }
    return respond(404, { error: "Resource not found" });
  }

  var handlers = {
    GET:    handleGET,
    POST:   handlePOST,
    PUT:    handlePUT,
    DELETE: handleDELETE,
  };

  /* ─── JSON syntax highlighter ─────────────────── */
  function highlightJSON(obj) {
    var json = JSON.stringify(obj, null, 2);
    return json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="str">"$1"</span>')
      .replace(/: (\d+\.?\d*)/g, ': <span class="num">$1</span>')
      .replace(/: (true|false)/g, ': <span class="bool">$1</span>')
      .replace(/: null/g, ': <span class="null">null</span>')
      .replace(/([\[\]{}])/g, '<span class="bracket">$1</span>');
  }

  /* ─── Send request ────────────────────────────── */
  async function sendRequest() {
    sendBtn.disabled = true;
    var method = methodSel.value;
    var endpoint = endpointIn.value.trim();
    var target = parseEndpoint(endpoint);
    var bodyText = bodyArea.value.trim();
    var latency = Math.floor(150 + Math.random() * 450);

    statusVal.textContent = "…";
    statusVal.className = "rmVal";
    latVal.textContent = "…";
    sizeVal.textContent = "…";
    respBody.innerHTML = "";

    /* body validation for write verbs */
    if ((method === "POST" || method === "PUT") && bodyText) {
      try { JSON.parse(bodyText); }
      catch (e) {
        bodyArea.classList.remove("shake");
        void bodyArea.offsetWidth;
        bodyArea.classList.add("shake");
        statusVal.textContent = "400 Bad Request";
        statusVal.className = "rmVal err";
        latVal.textContent = "0ms";
        sizeVal.textContent = "0B";
        respBody.innerHTML = '<span class="null">{\n  "error": "Invalid JSON body"\n}</span>';
        addHistory(method, endpoint, "400 Bad Request");
        sendBtn.disabled = false;
        return;
      }
    }

    await delay(latency);

    var handler = handlers[method];
    var result = handler(target, bodyText);

    /* update telemetry */
    statusVal.textContent = result.status + " " + statusText(result.status);
    statusVal.className = "rmVal " + (result.status < 400 ? "ok" : "err");
    latVal.textContent = latency + "ms";

    var dataStr = JSON.stringify(result.data);
    sizeVal.textContent = dataStr.length + "B";

    /* render body */
    respBody.innerHTML = highlightJSON(result.data);

    addHistory(method, endpoint, result.status + " " + statusText(result.status));
    sendBtn.disabled = false;
  }

  function statusText(code) {
    var map = { 200:"OK", 201:"Created", 400:"Bad Request", 404:"Not Found", 500:"Server Error" };
    return map[code] || "";
  }

  /* ─── History ──────────────────────────────────── */
  function addHistory(method, endpoint, status) {
    var el = document.createElement("div");
    el.className = "histEntry " + method;
    el.innerHTML = '<span class="heMethod">' + method + '</span>' +
      '<span class="heEndpoint">' + endpoint + '</span>' +
      '<span class="heStatus">' + status + '</span>';
    historyLog.appendChild(el);
    historyLog.scrollTop = historyLog.scrollHeight;
  }

  /* ─── Headers grid ─────────────────────────────── */
  addHdrBtn.addEventListener("click", function () {
    var row = document.createElement("div");
    row.className = "hdrRow";
    row.innerHTML = '<input class="hdrKey" placeholder="Key"><input class="hdrVal" placeholder="Value">';
    headersGrid.appendChild(row);
  });

  /* ─── Reset ────────────────────────────────────── */
  function resetState() {
    db.products = [
      { id: 1,  title: "Wireless Mouse",       price: 49.99,  stock: 120 },
      { id: 2,  title: "Mechanical Keyboard",    price: 159.99, stock: 45  },
      { id: 3,  title: "USB-C Hub",              price: 79.99,  stock: 200 },
      { id: 4,  title: "Monitor 27\"",           price: 449.99, stock: 30  },
      { id: 5,  title: "Laptop Stand",           price: 34.99,  stock: 80  },
    ];
    db.nextId = 6;
    statusVal.textContent = "—";
    statusVal.className = "rmVal";
    latVal.textContent = "—";
    sizeVal.textContent = "—";
    respBody.innerHTML = "";
  }

  /* ─── Events ──────────────────────────────────── */
  sendBtn.addEventListener("click", sendRequest);
  resetBtn.addEventListener("click", resetState);

  /* Ctrl+Enter to send */
  bodyArea.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); sendRequest(); }
  });

  /* Enter on endpoint */
  endpointIn.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendRequest();
  });

  /* ─── Init ────────────────────────────────────── */
  function init() {
    /* pre-fill body example */
    bodyArea.value = '{\n  "title": "New Product",\n  "price": 29.99,\n  "stock": 100\n}';
  }

  init();
})();
