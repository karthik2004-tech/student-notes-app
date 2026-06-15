(function () {
  "use strict";

  /* ─── Data ────────────────────────────────────── */
  var tables = {};

  tables.users = [
    { id: 1,  name: "Alice Chen",     email: "alice@acmecorp.com",     role: "admin",    country: "USA"    },
    { id: 2,  name: "Bob Martinez",   email: "bob@widgets.io",         role: "editor",   country: "USA"    },
    { id: 3,  name: "Clara Obi",      email: "clara@startup.ng",       role: "viewer",   country: "Nigeria" },
    { id: 4,  name: "Dmitri Volkov",  email: "dmitri@data.ru",         role: "admin",    country: "Russia"  },
    { id: 5,  name: "Elena Torres",   email: "elena@mail.es",          role: "editor",   country: "Spain"   },
    { id: 6,  name: "Frank Adeyemi",  email: "frank@tech.gh",          role: "viewer",   country: "Ghana"   },
    { id: 7,  name: "Grace Kim",      email: "grace@dev.kr",           role: "admin",    country: "Korea"   },
    { id: 8,  name: "Henry Dubois",   email: "henry@fashion.fr",       role: "editor",   country: "France"  },
  ];

  tables.orders = [
    { id: 101, user_id: 1, product: "Laptop Pro 16",    amount: 2499.99, status: "shipped"   },
    { id: 102, user_id: 2, product: "Wireless Mouse",    amount: 49.99,   status: "delivered" },
    { id: 103, user_id: 1, product: "USB-C Hub",         amount: 79.99,   status: "shipped"   },
    { id: 104, user_id: 3, product: "Mechanical Keypad", amount: 159.99,  status: "pending"   },
    { id: 105, user_id: 5, product: "Monitor 27\"",      amount: 449.99,  status: "shipped"   },
    { id: 106, user_id: 2, product: "Webcam HD",         amount: 129.99,  status: "pending"   },
    { id: 107, user_id: 7, product: "Desk Lamp",         amount: 89.99,   status: "delivered" },
    { id: 108, user_id: 4, product: "Server Rack",       amount: 3899.99, status: "shipped"   },
    { id: 109, user_id: 6, product: "Tablet Stand",      amount: 34.99,   status: "pending"   },
    { id: 110, user_id: 8, product: "Noise Cancelling Headphones", amount: 349.99, status: "delivered" },
    { id: 111, user_id: 3, product: "GPU Accelerator",   amount: 1299.99, status: "shipped"   },
    { id: 112, user_id: 5, product: "Ergonomic Chair",   amount: 899.99,  status: "pending"   },
  ];

  /* ─── DOM ─────────────────────────────────────── */
  var sqlEditor  = document.getElementById("sqlEditor");
  var presetSel  = document.getElementById("presetSel");
  var outputDiv  = document.getElementById("outputTable");
  var latVal     = document.getElementById("latVal");
  var recVal     = document.getElementById("recVal");
  var phaseVal   = document.getElementById("phaseVal");
  var statusVal  = document.getElementById("statusVal");
  var execBtn    = document.getElementById("execBtn");
  var flushBtn   = document.getElementById("flushBtn");

  /* ─── Lexer / Parser ──────────────────────────── */
  var reserved = { select:1, from:1, where:1, inner:1, join:1, on:1, and:1, or:1, like:1, as:1, order:1, by:1, asc:1, desc:1 };

  function tokenize(sql) {
    var tokens = [];
    var i = 0;
    while (i < sql.length) {
      var ch = sql[i];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") { i++; continue; }
      if (ch === ",") { tokens.push({ type:"comma" }); i++; continue; }
      if (ch === "*") { tokens.push({ type:"star" }); i++; continue; }
      if (ch === "=") { tokens.push({ type:"op", val:"=" }); i++; continue; }
      if (ch === ">") { tokens.push({ type:"op", val:">" }); i++; continue; }
      if (ch === "<") { tokens.push({ type:"op", val:"<" }); i++; continue; }
      if (ch === "(") { tokens.push({ type:"lparen" }); i++; continue; }
      if (ch === ")") { tokens.push({ type:"rparen" }); i++; continue; }
      if (ch === ".") { tokens.push({ type:"dot" }); i++; continue; }
      if (ch === "'" || ch === "\"") {
        var quote = ch; i++;
        var str = "";
        while (i < sql.length && sql[i] !== quote) { str += sql[i]; i++; }
        if (i < sql.length) i++;
        tokens.push({ type:"string", val:str });
        continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        var ident = "";
        while (i < sql.length && /[a-zA-Z0-9_]/.test(sql[i])) { ident += sql[i]; i++; }
        var lower = ident.toLowerCase();
        if (reserved[lower]) tokens.push({ type:"keyword", val:lower });
        else tokens.push({ type:"ident", val:ident });
        continue;
      }
      if (/[0-9]/.test(ch)) {
        var num = "";
        while (i < sql.length && /[0-9.]/.test(sql[i])) { num += sql[i]; i++; }
        tokens.push({ type:"number", val:parseFloat(num) });
        continue;
      }
      i++;
    }
    return tokens;
  }

  function expect(tokens, pos, type, val) {
    if (pos >= tokens.length) return false;
    var t = tokens[pos];
    if (t.type !== type) return false;
    if (val !== undefined && t.val !== val) return false;
    return true;
  }

  function parse(sql) {
    var tokens = tokenize(sql);
    var pos = 0;

    /* SELECT */
    if (!expect(tokens, pos, "keyword", "select")) return { err: "Expected SELECT at start" };
    pos++;

    /* columns */
    var columns = { type:"star" };
    if (expect(tokens, pos, "star")) {
      pos++;
    } else {
      var cols = [];
      while (pos < tokens.length && tokens[pos].type !== "keyword") {
        if (tokens[pos].type === "comma") { pos++; continue; }
        var col = {};
        if (expect(tokens, pos, "ident")) {
          col.col = tokens[pos].val; pos++;
          if (expect(tokens, pos, "dot")) {
            pos++;
            if (!expect(tokens, pos, "ident")) return { err: "Expected column after dot" };
            col.table = col.col;
            col.col = tokens[pos].val; pos++;
          }
        } else break;
        cols.push(col);
      }
      if (cols.length === 0) return { err: "No columns specified in SELECT" };
      columns = { type:"list", cols: cols };
    }

    /* FROM */
    if (!expect(tokens, pos, "keyword", "from")) return { err: "Expected FROM after SELECT" };
    pos++;

    var sources = [];
    var joins = [];

    while (pos < tokens.length) {
      if (expect(tokens, pos, "ident")) {
        var tableName = tokens[pos].val.toLowerCase();
        if (!tables[tableName]) return { err: "Unknown table '" + tableName + "'" };
        sources.push(tableName);
        pos++;
      } else break;

      /* check for INNER JOIN / JOIN */
      if (expect(tokens, pos, "keyword", "inner") || expect(tokens, pos, "keyword", "join")) {
        if (expect(tokens, pos, "keyword", "inner")) pos++;
        if (!expect(tokens, pos, "keyword", "join")) return { err: "Expected JOIN" };
        pos++;

        if (!expect(tokens, pos, "ident")) return { err: "Expected table name after JOIN" };
        var joinTable = tokens[pos].val.toLowerCase();
        if (!tables[joinTable]) return { err: "Unknown table '" + joinTable + "' in JOIN" };
        var joinSource = joinTable;
        pos++;

        if (!expect(tokens, pos, "keyword", "on")) return { err: "Expected ON after JOIN table" };
        pos++;

        /* Parse ON condition: left.col = right.col */
        if (!expect(tokens, pos, "ident")) return { err: "Expected column in ON clause" };
        var leftT = tokens[pos].val; pos++;
        if (!expect(tokens, pos, "dot")) return { err: "Expected table.col syntax in ON" };
        pos++;
        if (!expect(tokens, pos, "ident")) return { err: "Expected column after dot in ON" };
        var leftC = tokens[pos].val; pos++;

        if (!expect(tokens, pos, "op", "=")) return { err: "Expected = in ON clause" };
        pos++;

        if (!expect(tokens, pos, "ident")) return { err: "Expected column in ON clause" };
        var rightT = tokens[pos].val; pos++;
        if (!expect(tokens, pos, "dot")) return { err: "Expected table.col syntax in ON" };
        pos++;
        if (!expect(tokens, pos, "ident")) return { err: "Expected column after dot in ON" };
        var rightC = tokens[pos].val; pos++;

        joins.push({
          table: joinSource,
          leftTable: leftT,
          leftCol: leftC,
          rightTable: rightT,
          rightCol: rightC,
        });
        continue;
      }
      break;
    }

    if (sources.length === 0) return { err: "No valid source table specified" };

    /* WHERE */
    var whereClauses = [];
    if (expect(tokens, pos, "keyword", "where")) {
      pos++;
      while (pos < tokens.length) {
        if (expect(tokens, pos, "ident")) {
          var wc = { table: null, col: tokens[pos].val };
          pos++;
          if (expect(tokens, pos, "dot")) {
            pos++;
            if (!expect(tokens, pos, "ident")) return { err: "Expected column after dot in WHERE" };
            wc.table = wc.col;
            wc.col = tokens[pos].val;
            pos++;
          }
          if (expect(tokens, pos, "op")) {
            wc.op = tokens[pos].val; pos++;
          } else if (expect(tokens, pos, "keyword", "like")) {
            wc.op = "like"; pos++;
          } else return { err: "Expected operator in WHERE clause" };

          if (expect(tokens, pos, "string")) {
            wc.value = tokens[pos].val; pos++;
          } else if (expect(tokens, pos, "number")) {
            wc.value = tokens[pos].val; pos++;
          } else return { err: "Expected value in WHERE clause" };

          whereClauses.push(wc);

          if (expect(tokens, pos, "keyword", "and")) { pos++; continue; }
          break;
        } else break;
      }
    }

    return {
      columns: columns,
      sources: sources,
      joins: joins,
      where: whereClauses,
    };
  }

  /* ─── Executor ────────────────────────────────── */
  function execute(ast) {
    /* start from first source */
    var rows = tables[ast.sources[0]].slice();
    var usedTables = [ast.sources[0]];

    /* apply joins */
    for (var j = 0; j < ast.joins.length; j++) {
      var join = ast.joins[j];
      var rightRows = tables[join.table];
      var product = [];
      for (var r = 0; r < rows.length; r++) {
        for (var l = 0; l < rightRows.length; l++) {
          /* evaluate ON */
          var leftVal = rows[r][join.leftCol];
          var rightVal = rightRows[l][join.rightCol];
          if (String(leftVal) === String(rightVal)) {
            product.push(Object.assign({}, rows[r], rightRows[l]));
          }
        }
      }
      rows = product;
      usedTables.push(join.table);
    }

    /* resolve column ambiguities for WHERE */
    function resolveCol(tableHint, colName, row) {
      if (tableHint) {
        var tbl = tables[tableHint];
        if (!tbl) return undefined;
        if (row[colName] !== undefined) return row[colName];
        return undefined;
      }
      /* check this row directly */
      if (row[colName] !== undefined) return row[colName];
      return undefined;
    }

    /* WHERE filter */
    for (var w = 0; w < ast.where.length; w++) {
      var wc = ast.where[w];
      var filtered = [];
      for (var r = 0; r < rows.length; r++) {
        var val = resolveCol(wc.table, wc.col, rows[r]);
        if (val === undefined) return { err: "Unknown column '" + (wc.table ? wc.table + "." : "") + wc.col + "' in WHERE clause" };
        var match = false;
        switch (wc.op) {
          case "=":  match = String(val) === String(wc.value); break;
          case ">":  match = Number(val) > Number(wc.value); break;
          case "<":  match = Number(val) < Number(wc.value); break;
          case "like":
            var pat = wc.value.replace(/%/g, ".*");
            match = new RegExp("^" + pat + "$", "i").test(String(val));
            break;
        }
        if (match) filtered.push(rows[r]);
      }
      rows = filtered;
    }

    /* PROJECT columns */
    if (ast.columns.type === "star") {
      return { rows: rows };
    }

    /* list projection */
    var projected = [];
    for (var r = 0; r < rows.length; r++) {
      var proj = {};
      for (var c = 0; c < ast.columns.cols.length; c++) {
        var colDef = ast.columns.cols[c];
        var v = resolveCol(colDef.table, colDef.col, rows[r]);
        if (v === undefined) return { err: "Unknown column '" + (colDef.table ? colDef.table + "." : "") + colDef.col + "' in SELECT" };
        var key = colDef.col;
        if (colDef.table) key = colDef.table + "." + key;
        proj[key] = v;
      }
      projected.push(proj);
    }

    return { rows: projected };
  }

  /* ─── Render output ──────────────────────────── */
  function renderOutput(result) {
    if (result.err) {
      outputDiv.innerHTML = "<div class='errMsg'>" + result.err + "</div>";
      statusVal.textContent = "syntax err";
      statusVal.className = "tv err";
      return;
    }

    if (result.rows.length === 0) {
      outputDiv.innerHTML = "<div class='errMsg' style='color:#64748b;'>0 records returned</div>";
      return;
    }

    var cols = Object.keys(result.rows[0]);
    var html = "<div class='otHead'>";
    for (var c = 0; c < cols.length; c++) {
      html += "<span>" + cols[c] + "</span>";
    }
    html += "</div>";

    for (var r = 0; r < result.rows.length; r++) {
      html += "<div class='otRow'>";
      for (var c = 0; c < cols.length; c++) {
        var v = result.rows[r][cols[c]];
        if (v === null || v === undefined) v = "NULL";
        html += "<span>" + String(v) + "</span>";
      }
      html += "</div>";
    }

    outputDiv.innerHTML = html;
    statusVal.textContent = "success";
    statusVal.className = "tv ok";
  }

  /* ─── Run query ──────────────────────────────── */
  function runQuery() {
    phaseVal.textContent = "parsing";
    var t0 = performance.now();

    var sql = sqlEditor.value.trim();
    if (!sql) {
      phaseVal.textContent = "idle";
      return;
    }

    var result = parse(sql);
    if (result.err) {
      var t1 = performance.now();
      latVal.textContent = (t1 - t0).toFixed(2) + "ms";
      recVal.textContent = "0";
      phaseVal.textContent = "error";
      renderOutput(result);
      return;
    }

    phaseVal.textContent = "executing";
    var execResult = execute(result);
    var t1 = performance.now();
    latVal.textContent = (t1 - t0).toFixed(2) + "ms";

    if (execResult.err) {
      recVal.textContent = "0";
      phaseVal.textContent = "error";
      renderOutput(execResult);
      return;
    }

    recVal.textContent = execResult.rows.length;
    phaseVal.textContent = "complete";
    renderOutput(execResult);
  }

  /* ─── Events ──────────────────────────────────── */
  execBtn.addEventListener("click", runQuery);

  document.getElementById("presetBtn").addEventListener("click", function () {
    if (presetSel.value) {
      sqlEditor.value = presetSel.value;
      runQuery();
    }
  });

  presetSel.addEventListener("change", function () {
    if (presetSel.value) {
      sqlEditor.value = presetSel.value;
    }
  });

  flushBtn.addEventListener("click", function () {
    outputDiv.innerHTML = "";
    latVal.textContent = "—";
    recVal.textContent = "—";
    phaseVal.textContent = "idle";
    statusVal.textContent = "ready";
    statusVal.className = "tv";
  });

  /* Ctrl+Enter to run */
  sqlEditor.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); runQuery(); }
  });

  /* ─── Init ────────────────────────────────────── */
  function init() {
    /* run default */
    setTimeout(runQuery, 50);
  }

  init();
})();
