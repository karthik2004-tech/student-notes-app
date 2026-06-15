(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var srcEditor  = document.getElementById("srcEditor");
  var outputView = document.getElementById("outputView");
  var compileBtn = document.getElementById("compileBtn");
  var presetBtn  = document.getElementById("presetBtn");
  var flushBtn   = document.getElementById("flushBtn");
  var tabs       = document.querySelectorAll(".tab");
  var tokVal     = document.getElementById("tokVal");
  var depthVal   = document.getElementById("depthVal");
  var cycleVal   = document.getElementById("cycleVal");
  var statusVal  = document.getElementById("statusVal");
  var editorWrap = document.getElementById("editorWrap");

  var ppLex   = document.getElementById("ppLex");
  var ppParse = document.getElementById("ppParse");
  var ppAst   = document.getElementById("ppAst");
  var ppCode  = document.getElementById("ppCode");

  var activeMode = "tokens";

  /* compiled state */
  var tokens = [];
  var ast    = null;
  var asm    = [];
  var hadErr = false;

  /* ─── ─────────────────────────────────────────────
     LEXER
     ─────────────────────────────────────────────── */

  var tokenDefs = [
    { type:"assignment", re:/^=/ },
    { type:"operator",   re:/^[+\-*\/]/ },
    { type:"lparen",     re:/^\(/ },
    { type:"rparen",     re:/^\)/ },
    { type:"semicolon",  re:/^;/ },
    { type:"number",     re:/^\d+(\.\d+)?/ },
    { type:"identifier", re:/^[a-zA-Z_]\w*/ },
    { type:"whitespace", re:/^\s+/, skip:true },
    { type:"comment",    re:/^\/\/.*/, skip:true },
    { type:"comment",    re:/^\/\*[\s\S]*?\*\//, skip:true },
  ];

  function lex(source) {
    var out = [];
    var pos = 0;
    while (pos < source.length) {
      var rest = source.slice(pos);
      var matched = false;
      for (var i = 0; i < tokenDefs.length; i++) {
        var td = tokenDefs[i];
        var m = rest.match(td.re);
        if (m) {
          if (!td.skip) {
            out.push({ type:td.type, value:m[0] });
          }
          pos += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        out.push({ type:"unknown", value:rest[0] });
        pos++;
      }
    }
    return out;
  }

  /* ─── ─────────────────────────────────────────────
     PARSER  (recursive descent, precedence climbing)
     ─────────────────────────────────────────────── */

  var pos = 0;
  var toks = [];

  function peek() { return pos < toks.length ? toks[pos] : null; }

  function consume(type) {
    var t = peek();
    if (t && t.type === type) { pos++; return t; }
    return null;
  }

  function expect(type, msg) {
    var t = peek();
    if (!t || t.type !== type) {
      throw new Error(msg || ("Expected " + type + " but got " + (t ? t.type + "(" + t.value + ")" : "EOF")));
    }
    return consume(type);
  }

  /* Grammar:
     program   → statement+
     statement → assignment
     assignment → identifier "=" expression
     expression → term (("+" | "-") term)*
     term       → factor (("*" | "/") factor)*
     factor     → number | identifier | "(" expression ")"
   */

  function parseProgram() {
    var stmts = [];
    while (peek() && peek().type !== "EOF") {
      stmts.push(parseStatement());
    }
    return { type:"Program", body:stmts };
  }

  function parseStatement() {
    if (peek() && peek().type === "identifier") {
      var idTok = consume("identifier");
      if (peek() && peek().type === "assignment") {
        consume("assignment");
        var expr = parseExpression();
        consume("semicolon"); /* optional */
        return { type:"Assignment", name:idTok.value, value:expr };
      }
      /* just an expression statement */
      return { type:"ExpressionStatement", expression:{ type:"Identifier", name:idTok.value } };
    }
    throw new Error("Unexpected token: " + (peek() ? peek().value : "EOF"));
  }

  function parseExpression() {
    return parseTerm();
  }

  function parseTerm() {
    var left = parseFactor();
    while (peek() && peek().type === "operator" && (peek().value === "+" || peek().value === "-")) {
      var op = consume("operator").value;
      var right = parseFactor();
      left = { type:"BinaryOp", op:op, left:left, right:right };
    }
    return left;
  }

  function parseFactor() {
    var left = parsePrimary();
    while (peek() && peek().type === "operator" && (peek().value === "*" || peek().value === "/")) {
      var op = consume("operator").value;
      var right = parsePrimary();
      left = { type:"BinaryOp", op:op, left:left, right:right };
    }
    return left;
  }

  function parsePrimary() {
    var t = peek();
    if (!t) throw new Error("Unexpected end of expression");

    if (t.type === "number") {
      consume("number");
      return { type:"Number", value:parseFloat(t.value) };
    }
    if (t.type === "identifier") {
      consume("identifier");
      return { type:"Identifier", name:t.value };
    }
    if (t.type === "lparen") {
      consume("lparen");
      var expr = parseExpression();
      var r = peek();
      if (!r || r.type !== "rparen") {
        throw new Error("Missing closing parenthesis `)`");
      }
      consume("rparen");
      return expr;
    }
    throw new Error("Unexpected token: " + t.value + " (" + t.type + ")");
  }

  function parse(tokensInput) {
    toks = tokensInput.filter(function (t) { return t.type !== "whitespace" && t.type !== "comment"; });
    pos = 0;
    return parseProgram();
  }

  /* ─── ─────────────────────────────────────────────
     AST Depth
     ─────────────────────────────────────────────── */

  function astDepth(node) {
    if (!node || typeof node !== "object") return 0;
    var maxD = 0;
    Object.keys(node).forEach(function (k) {
      if (k === "type" || k === "name" || k === "op" || k === "value") return;
      var child = node[k];
      if (Array.isArray(child)) {
        child.forEach(function (c) { maxD = Math.max(maxD, astDepth(c)); });
      } else if (child && typeof child === "object") {
        maxD = Math.max(maxD, astDepth(child));
      }
    });
    return maxD + 1;
  }

  /* ─── ─────────────────────────────────────────────
     Code Generator  (pseudo-assembly)
     ─────────────────────────────────────────────── */

  var regCounter = 0;

  function resetRegs() { regCounter = 0; }

  function nextReg() { return "R" + (++regCounter); }

  function genCode(node) {
    if (node.type === "Program") {
      var lines = [];
      lines.push("; === COMPILED OUTPUT ===");
      node.body.forEach(function (stmt) {
        lines = lines.concat(genCode(stmt));
      });
      lines.push("; === END ===");
      return lines;
    }

    if (node.type === "Assignment") {
      var exprLines = genCode(node.value);
      var lastReg = exprLines.pop(); /* last line is the result reg */
      var out = exprLines;
      out.push("STR  " + node.name + ", " + lastReg);
      return out;
    }

    if (node.type === "BinaryOp") {
      var leftLines = genCode(node.left);
      var leftReg = leftLines.pop();
      var rightLines = genCode(node.right);
      var rightReg = rightLines.pop();
      var resultReg = nextReg();
      var opMnemonic = "";
      switch (node.op) {
        case "+": opMnemonic = "ADD"; break;
        case "-": opMnemonic = "SUB"; break;
        case "*": opMnemonic = "MUL"; break;
        case "/": opMnemonic = "DIV"; break;
        default: opMnemonic = "NOP";
      }
      return leftLines.concat(rightLines).concat([resultReg, opMnemonic + "  " + resultReg + ", " + leftReg + ", " + rightReg]);
    }

    if (node.type === "Number") {
      var r = nextReg();
      return [r, "MOV  " + r + ", " + node.value];
    }

    if (node.type === "Identifier") {
      var r = nextReg();
      return [r, "LDR  " + r + ", " + node.name];
    }

    return ["; unknown node: " + node.type];
  }

  /* helper to extract final register from code gen lines */
  function extractAsmLines(genResult) {
    /* genResult alternates: regName, asmLine, regName, asmLine, ... */
    var lines = [];
    for (var i = 1; i < genResult.length; i += 2) {
      lines.push(genResult[i]);
    }
    return lines;
  }

  /* ─── ─────────────────────────────────────────────
     Compile pipeline
     ─────────────────────────────────────────────── */

  function setPipeline(stage) {
    [ppLex, ppParse, ppAst, ppCode].forEach(function (el) {
      el.classList.remove("act", "done", "err");
    });
    if (hadErr) {
      /* mark everything through the error */
      if (stage === "lex")  { ppLex.classList.add("err"); ppParse.classList.remove("act","done"); ppAst.classList.remove("act","done"); ppCode.classList.remove("act","done"); }
      if (stage === "parse"){ ppLex.classList.add("done"); ppParse.classList.add("err"); }
      if (stage === "ast")  { ppLex.classList.add("done"); ppParse.classList.add("done"); ppAst.classList.add("err"); }
      if (stage === "code") { ppLex.classList.add("done"); ppParse.classList.add("done"); ppAst.classList.add("done"); ppCode.classList.add("err"); }
      return;
    }
    var stages = { lex:0, parse:1, ast:2, code:3 };
    var idx = stages[stage] || 0;
    var all = [ppLex, ppParse, ppAst, ppCode];
    for (var i = 0; i < all.length; i++) {
      if (i < idx) all[i].classList.add("done");
      else if (i === idx) all[i].classList.add("act");
    }
  }

  function compile() {
    hadErr = false;
    statusVal.textContent = "compiling";
    statusVal.className = "tv";
    editorWrap.classList.remove("shake");

    var src = srcEditor.value.trim();
    if (!src) {
      statusVal.textContent = "empty";
      return;
    }

    /* ── Lex ── */
    setPipeline("lex");
    tokens = lex(src);
    tokVal.textContent = tokens.length;
    if (tokens.length === 0) {
      hadErr = true;
      statusVal.textContent = "lex err";
      statusVal.className = "tv err";
      renderOutput(null, "err: No tokens generated from source");
      return;
    }

    /* ── Parse ── */
    setPipeline("parse");
    try {
      ast = parse(tokens);
    } catch (e) {
      hadErr = true;
      statusVal.textContent = "parse err";
      statusVal.className = "tv err";
      editorWrap.classList.add("shake");
      renderOutput(null, "PARSE ERROR: " + e.message);
      return;
    }
    var depth = astDepth(ast);
    depthVal.textContent = depth;

    /* ── Ast done ── */
    setPipeline("ast");

    /* ── Code Gen ── */
    setPipeline("code");
    resetRegs();
    try {
      var genResult = genCode(ast);
      asm = extractAsmLines(genResult);
      cycleVal.textContent = asm.length;
    } catch (e) {
      hadErr = true;
      statusVal.textContent = "codegen err";
      statusVal.className = "tv err";
      renderOutput(null, "CODEGEN ERROR: " + e.message);
      return;
    }

    /* done */
    setPipeline("code");
    ppLex.classList.remove("act"); ppLex.classList.add("done");
    ppParse.classList.remove("act"); ppParse.classList.add("done");
    ppAst.classList.remove("act"); ppAst.classList.add("done");
    ppCode.classList.remove("act"); ppCode.classList.add("done");

    statusVal.textContent = "ok";
    statusVal.className = "tv ok";

    /* render active tab */
    renderMode(activeMode);
  }

  /* ─── ─────────────────────────────────────────────
     Renderers
     ─────────────────────────────────────────────── */

  function renderMode(mode) {
    if (mode === "tokens") renderTokens();
    else if (mode === "ast") renderAST();
    else if (mode === "code") renderAssembly();
  }

  function renderOutput(data, errMsg) {
    if (errMsg) {
      outputView.innerHTML = "<div class='errOverlay'>" + errMsg + "</div>";
      return;
    }
    renderMode(activeMode);
  }

  function renderTokens() {
    if (hadErr || tokens.length === 0) { return; }
    var html = "<div class='tkGrid'>";
    tokens.forEach(function (t) {
      var cls = t.type;
      html += "<div class='tkBadge " + cls + "'>";
      html += "<span class='tkType'>" + t.type + "</span>";
      html += "<span class='tkVal'>" + escHtml(t.value) + "</span>";
      html += "</div>";
    });
    html += "</div>";
    outputView.innerHTML = html;
  }

  function renderAST() {
    if (!ast || hadErr) return;
    outputView.innerHTML = renderASTNode(ast, "");
  }

  function renderASTNode(node, indent) {
    if (!node || typeof node !== "object") return "<span class='astLabel'>" + String(node) + "</span>";

    if (node.type === "Number") {
      return "<span class='astLabel'>Number: <span class='astNum'>" + node.value + "</span></span>";
    }
    if (node.type === "Identifier") {
      return "<span class='astLabel'>Identifier: <span class='astId'>" + node.name + "</span></span>";
    }
    if (node.type === "BinaryOp") {
      var html = "<div class='astNode'>";
      html += "<span class='astLabel'>BinaryOp: <span class='astOp'>" + node.op + "</span></span>";
      html += "<div style='margin-top:3px'>";
      html += renderASTNode(node.left, indent + "  ");
      html += "</div>";
      html += "<div style='margin-top:2px'>";
      html += renderASTNode(node.right, indent + "  ");
      html += "</div>";
      html += "</div>";
      return html;
    }
    if (node.type === "Assignment") {
      var html = "<div class='astNode'>";
      html += "<span class='astLabel'>Assignment: <span class='astId'>" + node.name + "</span></span>";
      html += "<div style='margin-top:3px'>";
      html += renderASTNode(node.value, indent + "  ");
      html += "</div>";
      html += "</div>";
      return html;
    }
    if (node.type === "Program") {
      var html = "<div><div class='astRoot'>Program</div>";
      node.body.forEach(function (stmt, i) {
        html += "<div style='margin-top:4px'>" + renderASTNode(stmt, indent + "  ") + "</div>";
      });
      html += "</div>";
      return html;
    }
    return "<span class='astLabel'>" + node.type + "</span>";
  }

  function renderAssembly() {
    if (hadErr || asm.length === 0) { return; }
    var html = "<div class='asmBlock'>";
    asm.forEach(function (line, i) {
      var addr = "0x" + (i * 4).toString(16).toUpperCase().padStart(4, "0");
      /* parse: MNEMONIC args */
      var parts = line.match(/^(\w+)\s+(.*)$/);
      html += "<div class='asmLine'>";
      html += "<span class='asmAddr'>" + addr + "</span>";
      if (parts) {
        html += "<span class='asmMnemonic'>" + parts[1] + "</span>";
        html += "<span class='asmArgs'>" + parts[2] + "</span>";
      } else {
        html += "<span class='asmArgs'>" + escHtml(line) + "</span>";
      }
      html += "</div>";
    });
    html += "</div>";
    outputView.innerHTML = html;
  }

  /* ─── ─────────────────────────────────────────────
     Presets
     ─────────────────────────────────────────────── */

  var presets = [
    "x = 5 + 3 * 2",
    "price = 100 - 20 * 3 + 10",
    "result = (4 + 2) * (8 - 3)",
    "a = 10 + 20\nb = a * 2\nc = b - 5",
    "total = (price + tax) * quantity + shipping",
    "x = (4 + 2 * x",
  ];

  var presetIndex = 0;

  function loadPreset() {
    srcEditor.value = presets[presetIndex % presets.length];
    presetIndex++;
    compile();
  }

  /* ─── ─────────────────────────────────────────────
     Tab switching
     ─────────────────────────────────────────────── */

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("act"); });
      tab.classList.add("act");
      activeMode = tab.getAttribute("data-mode");
      renderMode(activeMode);
    });
  });

  /* ─── ─────────────────────────────────────────────
     Buttons
     ─────────────────────────────────────────────── */

  compileBtn.addEventListener("click", compile);

  presetBtn.addEventListener("click", loadPreset);

  flushBtn.addEventListener("click", function () {
    tokens = [];
    ast = null;
    asm = [];
    hadErr = false;
    outputView.innerHTML = "";
    tokVal.textContent = "0";
    depthVal.textContent = "0";
    cycleVal.textContent = "0";
    statusVal.textContent = "ready";
    statusVal.className = "tv";
    editorWrap.classList.remove("shake");
    [ppLex, ppParse, ppAst, ppCode].forEach(function (el) {
      el.classList.remove("act", "done", "err");
    });
  });

  /* ─── ─────────────────────────────────────────────
     Utility
     ─────────────────────────────────────────────── */

  function escHtml(s) {
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  /* Ctrl+Enter */
  srcEditor.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); compile(); }
  });

  /* ─── Init ────────────────────────────────────── */
  function init() {
    setTimeout(compile, 50);
  }

  init();
})();
