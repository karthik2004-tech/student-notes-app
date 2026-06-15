(function () {
  "use strict";

  /* ─── DOM ─────────────────────────────────────── */
  var canvas        = document.getElementById("gitCanvas");
  var ctx           = canvas.getContext("2d");
  var termInput     = document.getElementById("termInput");
  var termOutput    = document.getElementById("termOutput");
  var headVal       = document.getElementById("headVal");
  var branchVal     = document.getElementById("branchVal");
  var commitVal     = document.getElementById("commitVal");
  var stageVal      = document.getElementById("stageVal");
  var conflictOver  = document.getElementById("conflictOverlay");
  var conflictMsg   = document.getElementById("conflictMsg");
  var conflictCur   = document.getElementById("conflictCurrent");
  var conflictInc   = document.getElementById("conflictIncoming");
  var termCol       = document.getElementById("termCol");

  /* ─── Canvas sizing ────────────────────────────── */
  var W, H;
  function resize() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = Math.floor(r.width);
    H = Math.floor(r.height);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
  }
  window.addEventListener("resize", resize);

  /* ─── Data structures ──────────────────────────── */
  var commits = [];
  var branches = {};
  var HEAD = "main";
  var shaCounter = 0;
  var nextX = 80;
  var laneMap = {};
  var nextLane = 1;
  var stagingClean = true;

  var branchColors = { main:"#00f0ff", feature:"#ff2a5f" };

  /* ─── Initialize ───────────────────────────────── */
  function initRepo() {
    commits = [];
    branches = {};
    HEAD = "main";
    shaCounter = 0;
    nextX = 80;
    laneMap = {};
    nextLane = 1;
    stagingClean = true;

    var rootSha = makeSha();
    commits.push({
      sha: rootSha,
      parents: [],
      message: "initial commit",
      branch: "main",
      x: 60, y: H / 2,
      lane: 0,
    });
    branches["main"] = rootSha;
    laneMap["main"] = 0;
    termOutput.innerHTML = "";
    updateTelemetry();
    renderGraph();
  }

  function makeSha() {
    shaCounter++;
    return shaCounter.toString(16).padStart(7, "0");
  }

  function currentCommit() {
    var sha = branches[HEAD];
    if (!sha) return null;
    for (var i = 0; i < commits.length; i++) {
      if (commits[i].sha === sha) return commits[i];
    }
    return null;
  }

  function findCommit(sha) {
    for (var i = 0; i < commits.length; i++) if (commits[i].sha === sha) return commits[i];
    return null;
  }

  function getLane(branch) {
    if (laneMap[branch] === undefined) {
      laneMap[branch] = nextLane++;
    }
    return laneMap[branch];
  }

  /* ─── Commands ────────────────────────────────── */
  function parseGit(cmd) {
    var parts = cmd.trim().split(/\s+/);
    if (parts[0] !== "git") { return { err: "fatal: not a git command" }; }
    var sub = parts[1];

    if (sub === "commit") {
      var msg = "work";
      var idx = cmd.indexOf('-m');
      if (idx !== -1) {
        var m = cmd.slice(idx + 2).trim();
        if (m[0] === '"') { m = m.slice(1); var ei = m.indexOf('"'); if (ei !== -1) m = m.slice(0, ei); }
        msg = m.trim();
      }
      return gitCommit(msg);
    }

    if (sub === "branch") {
      var name = parts[2];
      if (!name) return { err: "fatal: branch name required" };
      return gitBranch(name);
    }

    if (sub === "checkout") {
      var target = parts[2];
      if (!target) {
        /* toggle between branches */
        var brs = Object.keys(branches);
        if (brs.length <= 1) return { err: "fatal: only one branch" };
        var ci = brs.indexOf(HEAD);
        target = brs[(ci + 1) % brs.length];
      }
      return gitCheckout(target);
    }

    if (sub === "merge") {
      var src = parts[2];
      if (!src) {
        var brs = Object.keys(branches).filter(function (b) { return b !== HEAD; });
        if (brs.length === 0) return { err: "fatal: nothing to merge" };
        src = brs[0];
      }
      return gitMerge(src);
    }

    if (sub === "rebase") {
      var onto = parts[2];
      if (!onto) {
        var brs = Object.keys(branches).filter(function (b) { return b !== HEAD; });
        if (brs.length === 0) return { err: "fatal: nothing to rebase onto" };
        onto = brs[0];
      }
      return gitRebase(onto);
    }

    return { err: "git: '" + sub + "' is not a git command" };
  }

  /* ─── git commit ──────────────────────────────── */
  function gitCommit(msg) {
    var cur = currentCommit();
    if (!cur) return { err: "fatal: no current branch" };

    /* simulate staging */
    stagingClean = false;
    stageVal.textContent = "staged";
    stageVal.style.color = "#ffd700";

    var sha = makeSha();
    var lane = getLane(HEAD);
    var y = H / 2 + (lane - 0.5) * 28;

    commits.push({
      sha: sha,
      parents: [cur.sha],
      message: msg,
      branch: HEAD,
      x: nextX, y: y,
      lane: lane,
    });
    nextX += 70;
    branches[HEAD] = sha;

    stagingClean = true;
    stageVal.textContent = "clean";
    stageVal.style.color = "#475569";

    updateTelemetry();
    renderGraph();
    return { ok: "[" + sha + "] " + msg };
  }

  /* ─── git branch ──────────────────────────────── */
  function gitBranch(name) {
    if (branches[name]) return { err: "fatal: a branch named '" + name + "' already exists" };
    var cur = currentCommit();
    if (!cur) return { err: "fatal: not on any branch" };
    branches[name] = cur.sha;
    branchColors[name] = "#ffd700";
    updateTelemetry();
    renderGraph();
    return { ok: "Created branch '" + name + "' at " + cur.sha };
  }

  /* ─── git checkout ────────────────────────────── */
  function gitCheckout(target) {
    if (!branches[target]) return { err: "error: pathspec '" + target + "' did not match any file(s) known to git" };
    HEAD = target;
    headVal.textContent = target;
    updateTelemetry();
    renderGraph();
    return { ok: "Switched to branch '" + target + "'" };
  }

  /* ─── Find LCA ────────────────────────────────── */
  function findLCA(shaA, shaB) {
    /* get all ancestors of A */
    var ancestors = {};
    function walk(sha, visited) {
      if (visited[sha]) return;
      visited[sha] = true;
      var c = findCommit(sha);
      if (!c) return;
      c.parents.forEach(function (p) { walk(p, visited); });
    }
    walk(shaA, ancestors);
    /* BFS from B to find first ancestor in A's set */
    var queue = [shaB];
    var seen = {};
    while (queue.length > 0) {
      var s = queue.shift();
      if (ancestors[s]) return s;
      if (seen[s]) continue;
      seen[s] = true;
      var c = findCommit(s);
      if (c) c.parents.forEach(function (p) { queue.push(p); });
    }
    return null;
  }

  /* ─── git merge ───────────────────────────────── */
  function gitMerge(source) {
    if (!branches[source]) return { err: "merge: '" + source + "' — not found" };
    if (source === HEAD) return { err: "merge: cannot merge a branch into itself" };

    var curSha = branches[HEAD];
    var srcSha = branches[source];

    /* fast-forward if possible */
    function isAncestor(anc, desc) {
      var visited = {};
      var queue = [desc];
      while (queue.length > 0) {
        var s = queue.shift();
        if (s === anc) return true;
        if (visited[s]) continue;
        visited[s] = true;
        var c = findCommit(s);
        if (c) c.parents.forEach(function (p) { queue.push(p); });
      }
      return false;
    }

    if (isAncestor(srcSha, curSha)) {
      return { ok: "Already up to date." };
    }

    if (isAncestor(curSha, srcSha)) {
      /* fast-forward: move HEAD to source tip */
      branches[HEAD] = srcSha;
      /* adjust commit positions? we need to copy commits from source that aren't on HEAD */
      var cur = currentCommit();
      if (cur) cur.x = nextX;
      nextX += 70;
      updateTelemetry();
      renderGraph();
      return { ok: "Fast-forward merge. HEAD now at " + srcSha };
    }

    /* divergent branches → conflict simulation */
    var lcaSha = findLCA(curSha, srcSha);
    if (!lcaSha) return { err: "merge: no common ancestor" };

    /* show conflict overlay */
    return showConflict(source, lcaSha);
  }

  /* ─── Conflict overlay ────────────────────────── */
  var conflictResolve = null;

  function showConflict(source, lcaSha) {
    conflictMsg.textContent = "MERGE CONFLICT: " + HEAD + " vs " + source;

    return new Promise(function (resolve) {
      conflictOver.classList.add("show");
      conflictResolve = { resolve:resolve, source:source, lcaSha:lcaSha };

      conflictCur.onclick = function () {
        conflictOver.classList.remove("show");
        resolve({ choice:"current", source:source, lcaSha:lcaSha });
      };
      conflictInc.onclick = function () {
        conflictOver.classList.remove("show");
        resolve({ choice:"incoming", source:source, lcaSha:lcaSha });
      };
    }).then(function (result) {
      return completeMerge(result);
    });
  }

  function completeMerge(result) {
    var curSha = branches[HEAD];
    var srcSha = branches[result.source];

    var sha = makeSha();
    var lane = getLane(HEAD);
    var y = H / 2 + (lane - 0.5) * 28;

    var msg = "Merge branch '" + result.source + "' into " + HEAD;
    if (result.choice === "incoming") msg = "Merge (incoming): " + result.source + " -> " + HEAD;

    commits.push({
      sha: sha,
      parents: [curSha, srcSha],
      message: msg,
      branch: HEAD,
      x: nextX, y: y,
      lane: lane,
    });
    nextX += 70;
    branches[HEAD] = sha;

    updateTelemetry();
    renderGraph();
    return { ok: "Merge successful: [" + sha + "] " + msg };
  }

  /* ─── git rebase ──────────────────────────────── */
  function gitRebase(onto) {
    if (!branches[onto]) return { err: "rebase: '" + onto + "' — not found" };
    if (onto === HEAD) return { ok: "Already on " + onto };

    var curSha = branches[HEAD];
    var ontoSha = branches[onto];
    var lcaSha = findLCA(curSha, ontoSha);
    if (!lcaSha) return { err: "rebase: no common ancestor" };

    /* collect commits from HEAD back to LCA (excluding LCA) */
    var rebaseCommits = [];
    var s = curSha;
    while (s && s !== lcaSha) {
      var c = findCommit(s);
      if (!c) break;
      rebaseCommits.unshift(c);
      /* only follow first parent */
      s = c.parents[0];
      if (!s) break;
    }

    /* attach these commits onto ontoSha */
    var parent = ontoSha;
    var lane = getLane(onto);
    rebaseCommits.forEach(function (old) {
      var sha = makeSha();
      var y = H / 2 + (lane - 0.5) * 28;
      commits.push({
        sha: sha,
        parents: [parent],
        message: old.message,
        branch: onto,
        x: nextX, y: y,
        lane: lane,
      });
      nextX += 70;
      parent = sha;
    });

    /* update HEAD to point to the last rebased commit */
    if (rebaseCommits.length > 0) {
      branches[HEAD] = parent;
    }

    updateTelemetry();
    renderGraph();
    return { ok: "Successfully rebased " + HEAD + " onto " + onto + " (" + rebaseCommits.length + " commits reapplied)" };
  }

  /* ─── Graph renderer ──────────────────────────── */
  function renderGraph() {
    ctx.fillStyle = "#04050a";
    ctx.fillRect(0, 0, W, H);

    if (commits.length === 0) return;

    /* draw edges first */
    commits.forEach(function (c) {
      c.parents.forEach(function (p) {
        var pc = findCommit(p);
        if (!pc) return;
        var color = branchColors[c.branch] || "#475569";
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pc.x, pc.y);
        /* curved line */
        var cx = (pc.x + c.x) / 2;
        ctx.quadraticCurveTo(cx, (pc.y + c.y) / 2, c.x, c.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    /* draw nodes */
    commits.forEach(function (c) {
      var color = branchColors[c.branch] || "#475569";
      var isHead = branches[HEAD] === c.sha;

      /* glow for HEAD */
      if (isHead) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
      }

      /* circle */
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, isHead ? 7 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      /* sha label */
      ctx.fillStyle = "#334155";
      ctx.font = "clamp(4px,0.4vmin,6px) Consolas,monospace";
      ctx.textAlign = "center";
      ctx.fillText(c.sha.slice(0, 6), c.x, c.y + 14);

      /* message label */
      ctx.fillStyle = "#1e2a3a";
      ctx.font = "clamp(4px,0.4vmin,6px) Consolas,monospace";
      ctx.fillText(trunc(c.message, 12), c.x, c.y - 12);
    });

    /* branch labels */
    Object.keys(branches).forEach(function (b) {
      var sha = branches[b];
      var c = findCommit(sha);
      if (!c) return;
      var color = branchColors[b] || "#475569";
      ctx.fillStyle = color;
      ctx.font = "clamp(5px,0.55vmin,8px) Consolas,monospace";
      ctx.textAlign = "left";
      var label = b;
      if (b === HEAD) label = b + " (HEAD)";
      ctx.fillText(label, c.x + 10, c.y + 3);
    });
  }

  function trunc(s, n) { return s.length > n ? s.slice(0, n) + "…" : s; }

  /* ─── Telemetry ──────────────────────────────── */
  function updateTelemetry() {
    headVal.textContent = HEAD;
    branchVal.textContent = Object.keys(branches).length;
    commitVal.textContent = commits.length;
  }

  /* ─── Terminal ────────────────────────────────── */
  function termPrint(text, cls) {
    var d = document.createElement("span");
    d.className = "termLine " + (cls || "info");
    d.textContent = text;
    termOutput.appendChild(d);
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  function termCmd(text) {
    termPrint("$ git " + text, "cmd");
  }

  /* ─── Execute command ─────────────────────────── */
  function executeCmd(cmdText) {
    if (!cmdText.startsWith("git ")) cmdText = "git " + cmdText;
    termCmd(cmdText.slice(4));
    var result = parseGit(cmdText);
    if (result && result.then) {
      /* promise (conflict) */
      result.then(function (res) {
        if (res.ok) termPrint(res.ok, "ok");
        else if (res.err) termPrint(res.err, "err");
      });
      return;
    }
    if (result) {
      if (result.err) {
        termPrint(result.err, "err");
        termCol.classList.remove("shake");
        void termCol.offsetWidth;
        termCol.classList.add("shake");
      } else if (result.ok) {
        termPrint(result.ok, "ok");
      }
    }
  }

  /* ─── Events ──────────────────────────────────── */
  termInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var cmd = termInput.value.trim();
      if (!cmd) return;
      termInput.value = "";
      executeCmd(cmd);
    }
  });

  /* quick buttons */
  document.querySelectorAll(".gitBtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cmd = btn.getAttribute("data-cmd");
      if (cmd === "reset") { initRepo(); return; }
      if (cmd === "checkout") {
        var brs = Object.keys(branches);
        if (brs.length <= 1) { termPrint("fatal: only one branch", "err"); return; }
        var ci = brs.indexOf(HEAD);
        cmd = "checkout " + brs[(ci + 1) % brs.length];
      }
      executeCmd(cmd);
    });
  });

  /* ─── Init ────────────────────────────────────── */
  function init() {
    resize();
    initRepo();
  }

  init();
})();
