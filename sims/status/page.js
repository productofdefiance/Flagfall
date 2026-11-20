/* Status page (Brief 023): draws the board for the Editor from board.json, and runs the Refresh button.
   One file, used twice:
   - by board.js in Node, to draw the page once when the board is built (so it reads even before any script runs);
   - inlined into index.html, where the same code redraws the page when a newer board arrives.
   No libraries, no build step. Every piece of text from the repository is escaped before it is drawn.
   The Refresh key (a GitHub token the Editor makes) lives only in this browser's local storage: never in the
   repository, this source, board.json or a log. */
(function (root) {
  "use strict";

  var REPO = "productofdefiance/Flagfall";
  var API = "https://api.github.com/repos/" + REPO;
  var PLAY = "https://productofdefiance.github.io/Flagfall/";
  var KEY_NAME = "flagfall-status-refresh-key";
  var POLL_MS = 10000, POLL_FOR_MS = 180000, AUTO_MS = 300000;

  // ---------- drawing ----------

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var ICONS = {
    play: '<path d="M7 5l12 7-12 7z"/>',
    refresh: '<path d="M19 12a7 7 0 1 1-2.2-5.1"/><path d="M19 4.5V8h-3.5"/>',
    review: '<rect x="6" y="5" width="12" height="15" rx="2"/><path d="M9.5 5V3.5h5V5"/><path d="M9 11h6"/><path d="M9 15h4"/>',
    tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    ask: '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.8a2.3 2.3 0 1 1 3.4 2c-.8.5-1.2 1-1.2 1.8"/><path d="M12 16.6v.2"/>',
    running: '<path d="M7 4h10"/><path d="M7 20h10"/><path d="M8 4c0 4.5 8 3.5 8 8s-8 3.5-8 8"/><path d="M16 4c0 4.5-8 3.5-8 8s8 3.5 8 8"/>',
    sync: '<path d="M19 11a7 7 0 0 0-12.3-4"/><path d="M6.5 3.5V7H10"/><path d="M5 13a7 7 0 0 0 12.3 4"/><path d="M17.5 20.5V17H14"/>',
    heads: '<path d="M12 4 21 19H3z"/><path d="M12 10v4"/><path d="M12 17v.2"/>',
    broken: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/>',
    merged: '<circle cx="7" cy="6" r="2.2"/><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="12" r="2.2"/><path d="M7 8.2v7.6"/><path d="M7 10c0 2 4 2 7.8 2"/>'
  };
  // Each mark: its pill class and icon. Never colour alone: every pill has an icon and a word.
  var MARKS = {
    review: { cls: "p-review", icon: "review", stroke: "#f8f9f5" },
    merge: { cls: "p-pass", icon: "tick" },
    pass: { cls: "p-pass", icon: "tick" },
    sync: { cls: "p-sync", icon: "sync" },
    hold: { cls: "p-heads", icon: "heads" },
    heads: { cls: "p-heads", icon: "heads" },
    broken: { cls: "p-broken", icon: "broken", stroke: "#a3201a" },
    running: { cls: "p-running", icon: "running" },
    ask: { cls: "p-ask", icon: "ask" },
    merged: { cls: "p-merged", icon: "merged" }
  };
  function svg(name, stroke, size) {
    return '<svg aria-hidden="true" viewBox="0 0 24 24" class="i' + (size || 14) + '" fill="none" stroke="' + (stroke || "currentColor") +
      '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
  }
  function pill(mark, word) {
    var m = MARKS[mark] || MARKS.running;
    return '<span class="pill ' + m.cls + '">' + svg(m.icon, m.stroke || "#1f2421") + esc(word) + "</span>";
  }
  var BUILD_PILL = { broken: "Broken", sync: "Needs sync", hold: "On hold", merge: "Ready to merge", review: "Review" };
  var BUILD_MOVE = {
    sync: 'Your move: type "sync" in its Code chat',
    merge: "Your move: do the hands-on check, then merge",
    review: 'Your move: type "review" in a design chat'
  };
  var STATE_ORDER = ["broken", "sync", "hold", "merge", "review", "running"];
  var COUNT_WORD = { broken: "broken", sync: "need sync", hold: "on hold", merge: "ready to merge", review: "to review", running: "running" };
  function countWord(state, n) { return n + " " + (state === "sync" && n === 1 ? "needs sync" : COUNT_WORD[state]); }
  function buildPillWord(b) { return b.state === "running" ? (b.draft ? "Building" : b.checks === "running" ? "Checks running" : "Waiting for checks") : BUILD_PILL[b.state]; }
  function pct(x) { return (Math.round(x * 1000) / 10).toFixed(1) + "%"; }

  function row(left, right) {
    return '<div class="row"><div class="rl">' + left + '</div><div class="rr">' + (right || "") + "</div></div>";
  }
  function sub(text) { return '<div class="sub">' + text + "</div>"; }
  function h3(title, count) { return '<h3 class="grp">' + esc(title) + ' <span class="cnt">· ' + esc(count) + "</span></h3>"; }
  function none() { return '<div class="row"><div class="rl"><div class="none">None</div></div></div>'; }
  function section(title, note, body, extra) {
    return '<section class="card"' + (extra || "") + '><div class="shead"><h2>' + esc(title) + '</h2><div class="note">' + esc(note) + "</div></div>" + body + "</section>";
  }
  function tile(label, big, small, pills) {
    return '<div class="tile"><div class="tl">' + esc(label) + '</div><div class="tb">' + esc(big) + '</div><div class="ts">' + esc(small) + "</div>" +
      (pills && pills.length ? '<div class="tp">' + pills.join(" ") + "</div>" : "") + "</div>";
  }

  function stateCounts(building) {
    var c = {};
    building.forEach(function (b) { c[b.state] = (c[b.state] || 0) + 1; });
    return STATE_ORDER.filter(function (s) { return c[s]; }).map(function (s) { return { state: s, n: c[s] }; });
  }

  function renderTiles(d) {
    var m = d.main || {}, out = [];
    out.push(tile("On main", m.game || "?", [m.build ? "Build " + m.build : null, m.rules ? "Rules " + m.rules : null, m.brain || null].filter(Boolean).join(" · ")));
    var bl = (d.builds && d.builds.building) || [];
    var names = bl.map(function (b) { return b.brief + " " + b.name + (b.version ? " · will be " + b.version : ""); }).join(", ");
    out.push(tile("Building", String(bl.length), bl.length ? names : "Nothing building", stateCounts(bl).map(function (s) {
      return pill(s.state === "merge" ? "merge" : s.state, countWord(s.state, s.n));
    })));
    var n = d.nightly || {};
    var big = { pass: "Pass", fail: "Fail", running: "Running" }[n.state] || (n.state ? n.state : "None");
    var np = n.state === "pass" ? [pill("pass", "All checks pass")] : n.state === "fail" ? [pill("broken", "Checks failed")] : n.state === "running" ? [pill("running", "Running")] : [];
    out.push(tile("Nightly checks", big, n.timeText || "No run found", np));
    var f = d.tiles || {};
    var asks = f.flagsAsk || 0;
    out.push(tile("Flags", String(asks), asks ? "Open and unanswered" + (f.flagsNewest ? " · newest " + f.flagsNewest : "") : "None waiting on an answer",
      asks ? [pill("ask", asks + (asks === 1 ? " needs an answer" : " need an answer"))] : []));
    return '<div class="tiles">' + out.join("") + "</div>";
  }

  function renderBuilds(d) {
    var B = d.builds || {}, bl = B.building || [], wl = B.waiting || [], ml = B.merged || [];
    var note = stateCounts(bl).map(function (s) { return countWord(s.state, s.n); });
    var nReady = wl.filter(function (w) { return w.ready; }).length, nWait = wl.length - nReady;
    if (nReady) note.push(nReady + " ready to start");
    if (nWait) note.push(nWait + " waiting");
    var h = h3("Building", String(bl.length));
    if (!bl.length) h += none();
    bl.forEach(function (b) {
      var line = ["PR #" + b.pr, b.version ? "will be " + b.version : b.size === "none" ? "no version" : b.size ? b.size + " bump" : null,
        b.sync === "conflict" ? "conflicts with main" : b.sync === "behind" ? "behind main" : null,
        b.checks === "pass" ? "checks pass" : b.checks === "fail" ? "checks failed" : b.checks === "running" ? "checks running" : "no checks yet",
        b.review === "hold" ? "review: hold" : null].filter(Boolean).join(" · ");
      var left = '<div class="nm">' + esc(b.brief + " " + b.name) + "</div>" + sub(esc(line)) +
        (BUILD_MOVE[b.state] ? sub(esc(BUILD_MOVE[b.state])) : "") +
        sub('<a href="' + esc(PLAY + "pr/" + Number(b.pr) + "/") + '" class="b">Play this build</a>');
      h += row(left, pill(b.state, buildPillWord(b)));
    });
    var rl = wl.filter(function (w) { return w.ready; }), ww = wl.filter(function (w) { return !w.ready; });
    h += h3("Ready to start", String(rl.length));
    if (!rl.length) h += none();
    rl.forEach(function (w) {
      h += row('<div class="nm">' + esc(w.brief + " " + w.name) + "</div>", '<span class="wait">' + svg("play", "#5f6762") + "Ready to start</span>");
    });
    h += h3("Waiting", String(ww.length));
    if (!ww.length) h += none();
    ww.forEach(function (w) {
      h += row('<div class="nm">' + esc(w.brief + " " + w.name) + "</div>",
        '<span class="wait">' + svg("running", "#5f6762") + esc(w.waitsOn ? "After " + w.waitsOn.join(", ") : "Waits on not stated") + "</span>");
    });
    h += h3("Merged", "last " + (B.mergedLimit || 3));
    if (!ml.length) h += none();
    ml.forEach(function (p) {
      h += row('<div class="nm">' + esc(p.brief + " " + p.name) + "</div>" + (p.date ? sub(esc(p.date)) : ""), '<span class="ver">' + esc(p.version || "No version") + "</span>");
    });
    h += '<div style="height:8px"></div>';
    return section("Builds", note.join(" · ") || "Nothing building", h, ' style="flex:1 1 480px"');
  }

  function renderResults(d) {
    var n = d.nightly || {};
    var np = n.state === "pass" ? pill("pass", "Nightly checks pass") : n.state === "fail" ? pill("broken", "Nightly checks failed")
      : n.state === "running" ? pill("running", "Nightly checks running") : pill("running", "No nightly run found");
    var h = '<div class="nrow">' + np + (n.timeText ? '<span class="muted">' + esc(n.timeText) + "</span>" : "") + "</div>";
    var rs = d.results || [];
    if (!rs.length) h += '<div class="empty">No runs in the last 24 hours.</div>';
    else {
      h += '<div class="tw"><table><thead><tr><th scope="col">Run</th><th scope="col" class="num w64">5v5</th><th scope="col" class="num w64">7v7</th><th scope="col" class="num w64">Date</th></tr></thead><tbody>';
      rs.forEach(function (r) {
        var has = r.share5 != null || r.share7 != null;
        h += '<tr><td><div class="b">' + esc(r.version || "?") + "</div>" + sub(esc(r.kind || "")) + "</td>" +
          (has ? '<td class="num big">' + (r.share5 != null ? pct(r.share5) : "–") + '</td><td class="num big">' + (r.share7 != null ? pct(r.share7) : "–") + "</td>"
            : '<td colspan="2" class="fb">' + esc(r.line || "") + "</td>") +
          '<td class="num dt">' + esc(r.dateText || "") + "</td></tr>";
      });
      h += "</tbody></table></div>";
    }
    var more = d.resultsMore ? d.resultsMore + " more ran in the last 24 hours. " : "";
    h += '<div class="foot">5v5 and 7v7 show the share of bot games that ended on the turn limit. ' + esc(more) + "Older runs are in results/INDEX.md.</div>";
    return section("Results", "Last 24 hours", h);
  }

  var FLAG_MARK = { ASK: ["ask", "Needs an answer"], DECIDE: ["ask", "Needs a decision"], OPEN: ["heads", "Heads up"], TEST: ["running", "Being tested"] };
  function renderFlags(d, ui) {
    ui = ui || {};
    var fs = d.flags || [], t = d.tiles || {}, asks = t.flagsAsk || 0;
    var h = "";
    if (!fs.length) h += '<div class="empty">No open flags.</div>';
    else {
      // One row per flag, on every width: name and date, the status pill, then the issue on its own full-width line as
      // a two-line preview. The row is a details/summary, so a tap, a click or the keyboard opens it to the whole issue
      // and its "Resolved in / next step" text, and closes it again.
      var open = ui.openFlags || {};
      fs.forEach(function (f) {
        var m = FLAG_MARK[f.status] || ["heads", "Heads up"];
        var full = f.issueFull || f.issue || "";
        h += '<details class="flag" data-flag="' + esc(f.name) + '"' + (open[f.name] ? " open" : "") + '><summary>' +
          '<div class="fhead"><div class="fname"><span class="b">' + esc(f.name) + '</span> <span class="sub0">' + esc(f.date) + "</span></div>" +
          '<div class="fpill">' + pill(m[0], m[1]) + '<span class="sub0 st">' + esc(f.status) + "</span></div>" +
          '<svg aria-hidden="true" viewBox="0 0 24 24" class="i14 chev" fill="none" stroke="#5f6762" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></div>' +
          '<div class="clamp">' + esc(f.issue) + "</div></summary>" +
          '<div class="fbody"><div class="ftext">' + esc(full) + "</div>" +
          (f.next ? '<div class="fnext"><span class="tl">Resolved in / next step</span><div>' + esc(f.next) + "</div></div>" : "") + "</div></details>";
      });
    }
    var moreAsk = t.flagsMoreAsk || 0, moreOpen = t.flagsMoreOpen || 0, parts = [];
    if (moreAsk) parts.push(moreAsk + " more " + (moreAsk === 1 ? "needs" : "need") + " an answer");
    if (moreOpen) parts.push(moreOpen + " older " + (moreOpen === 1 ? "one is" : "ones are") + " open");
    if (parts.length) h += '<div class="foot">' + esc(parts.join(" and ")) + " in FLAGS.md.</div>";
    else h += '<div style="height:8px"></div>';
    return section("Flags", (asks ? asks + (asks === 1 ? " needs" : " need") + " an answer · " : "") + "newest first", h);
  }

  function renderChats(d) {
    var c = d.chats || {}, op = c.open || [], cl = c.closed || [];
    var h = "";
    if (!op.length && !cl.length) {
      h = '<div class="empty">No design chats logged yet.' + sub("A new design chat adds itself here when it opens, and marks itself closed at handoff or end.") + "</div>";
    } else {
      h += h3("Open", String(op.length));
      if (!op.length) h += none();
      op.forEach(function (x) {
        h += row('<div class="nm">' + esc(x.name) + "</div>" + (x.subject ? sub(esc(x.subject)) : ""),
          (x.stale ? pill("heads", "stale?") + '<div class="sub">' : '<div class="dtr">') + esc(x.opened ? "Opened " + x.opened : "") + "</div>");
      });
      h += h3("Closed", "last " + (c.closedLimit || 5));
      if (!cl.length) h += none();
      cl.forEach(function (x) {
        h += row('<div class="nm">' + esc(x.name) + "</div>" + (x.outcome ? sub(esc(x.outcome)) : ""), '<div class="dtr">' + esc(x.closed ? "Closed " + x.closed : "Closed") + "</div>");
      });
      h += '<div style="height:8px"></div>';
    }
    return section("Chats", "Design chats", h);
  }

  var KEY = [
    ["review", "Review", "A build is finished. Your move: ask a design chat for a review."],
    ["merge", "Ready to merge", "A review said merge. Your move: do the hands-on check, then merge."],
    ["ask", "Needs an answer", "A flag is waiting on you or a design chat."],
    ["running", "Running", "In progress, or waiting its turn. Nothing for you to do."],
    ["sync", "Needs sync", "A build has fallen behind main or conflicts with it. Your move: type sync in its Code chat."],
    ["heads", "Heads up", "A medium issue, such as a review that says hold."],
    ["broken", "Broken", "Something failed: checks on a build, or the nightly run."],
    ["pass", "Passing", "Checks pass."],
    ["merged", "Merged", "Done and on main."]
  ];
  function renderKey() {
    return section("Key", "What each mark means", '<div class="key">' + KEY.map(function (k) {
      return '<div class="kitem">' + pill(k[0], k[1]) + '<div class="sub0">' + esc(k[2]) + "</div></div>";
    }).join("") + "</div>");
  }

  function renderSetup(ui) {
    var has = !!ui.hasKey;
    return '<section class="card" id="setup"><div class="shead"><h2>One-tap rebuild</h2><div class="note">' + (has ? "A key is saved on this device" : "Not set up on this device") + "</div></div>" +
      '<ol class="steps">' +
      '<li>On GitHub, open <a class="b" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">a new fine-grained token</a> (Settings → Developer settings → Fine-grained tokens → Generate new token).</li>' +
      "<li>Under Repository access pick <b>Only select repositories</b> and choose <b>Flagfall</b>. Under Permissions, set <b>Actions</b> to <b>Read and write</b>. Set Expiration to <b>90 days</b>. Leave everything else as it is, then tap Generate token.</li>" +
      "<li>Copy the token, paste it in the box below and tap Save.</li></ol>" +
      '<input id="keybox" type="password" autocomplete="off" spellcheck="false" placeholder="Paste the token here" aria-label="GitHub token">' +
      '<div class="srow"><button type="button" class="sbtn" data-act="save">Save</button><button type="button" class="sbtn ghost" data-act="remove">Remove</button><button type="button" class="sbtn ghost" data-act="close">Close</button></div>' +
      (ui.setupNote ? '<div class="sub0" role="status">' + esc(ui.setupNote) + "</div>" : "") +
      '<div class="foot">The key stays on this device, in this browser only. It expires after 90 days (the expiry you set on GitHub); then make a new one the same way. It can only work the jobs that already exist in the repository (start, stop or re-run them); it can\'t change the game, the flags or any setting.</div></section>';
  }

  /** The whole page body for a board (the board.json object). ui: { button, note, setupOpen, hasKey, setupNote }. */
  function renderApp(d, ui) {
    ui = ui || {};
    var head = '<header class="top"><div class="hin"><div><h1>Flagfall status</h1><div class="upd">Updated ' + esc(d.updatedText || "") + "</div></div>" +
      '<div class="hr"><div class="btns"><a class="btn light" href="' + PLAY + '">' + svg("play", null, 16) + "Play latest build</a>" +
      '<button type="button" class="btn dark" data-act="refresh"' + (ui.button ? " disabled" : "") + ">" + svg("refresh", null, 16) + esc(ui.button || "Refresh") + "</button></div>" +
      '<div class="hlinks">' + (ui.note ? '<span role="status">' + esc(ui.note) + "</span> " : "") +
      '<a href="#setup" data-act="setup">' + (ui.hasKey ? "Refresh settings" : "Set up one-tap rebuild") + "</a></div></div></div></header>";
    return head + '<main class="mn">' + (ui.setupOpen ? renderSetup(ui) : "") + renderTiles(d) +
      '<div class="cols">' + renderBuilds(d) + '<div class="side">' + renderResults(d) + renderChats(d) + "</div></div>" +
      renderFlags(d, ui) + renderKey() + "</main>";
  }

  var CSS = [
    "body{margin:0;background:#e9ece6}a{color:#1f2421}a:hover{color:#5f6762}",
    "#app{background:#e9ece6;color:#1f2421;font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;min-height:100vh}",
    ".i14{width:14px;height:14px;flex:none}.i16{width:16px;height:16px;flex:none}",
    ".top{background:#1f2421;color:#f8f9f5;padding:16px}.hin{max-width:1080px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 16px}",
    "h1{margin:0;font-family:'Barlow Condensed',system-ui,sans-serif;font-weight:700;font-size:30px;line-height:1.1;letter-spacing:.06em;text-transform:uppercase}",
    ".upd{font-size:13px;color:#d5d9d2;margin-top:2px}.btns{display:flex;flex-wrap:wrap;gap:10px}",
    ".btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;box-sizing:border-box;padding:0 16px;border-radius:10px;font-family:inherit;font-weight:600;font-size:14px;text-decoration:none}",
    ".btn.light{background:#f8f9f5;color:#1f2421}.btn.dark{background:transparent;color:#f8f9f5;border:1.5px solid #f8f9f5;cursor:pointer}.btn.dark[disabled]{opacity:.8;cursor:progress}",
    ".hlinks{font-size:12px;color:#d5d9d2;margin-top:6px}.hlinks a{color:#d5d9d2}.hlinks a:hover{color:#f8f9f5}",
    ".mn{max-width:1080px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:16px}",
    ".tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}",
    ".tile{background:#f8f9f5;border:1px solid #b8beb6;border-radius:10px;padding:12px 14px;min-width:0}",
    ".tl,.grp,th{font-family:'Barlow Condensed',system-ui,sans-serif;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#5f6762}",
    ".tb{font-family:'Barlow Condensed',system-ui,sans-serif;font-weight:700;font-size:30px;line-height:1.1;margin-top:4px}.ts{font-size:12px;color:#5f6762;margin-top:2px}.tp{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}",
    ".pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 7px;border-radius:999px;color:#1f2421;font-size:12px;font-weight:600;white-space:nowrap;border:1px solid}",
    ".p-review{background:#1f2421;border-color:#1f2421;color:#f8f9f5}.p-pass{background:#cfe8da;border-color:#cfe8da}.p-sync{background:#e4dbf3;border-color:#e4dbf3}",
    ".p-heads{background:#f3dfa2;border-color:#f3dfa2}.p-broken{background:#f6cfc6;border-color:#f6cfc6}.p-running{background:#e3e6df;border-color:#e3e6df}",
    ".p-ask{background:#d6e3f2;border-color:#d6e3f2}.p-merged{background:#f8f9f5;border-color:#b8beb6}",
    ".cols{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}.side{flex:1 1 360px;min-width:0;display:flex;flex-direction:column;gap:16px}",
    ".card{background:#f8f9f5;border:1px solid #b8beb6;border-radius:10px;padding:16px 16px 8px;min-width:0}",
    ".shead{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 12px;margin-bottom:12px}",
    "h2{margin:0;font-family:'Barlow Condensed',system-ui,sans-serif;font-weight:700;font-size:22px;letter-spacing:.04em;text-transform:uppercase}.note,.muted{font-size:12px;color:#5f6762}",
    ".grp{margin:0;padding:14px 0 6px;border-bottom:1px solid #b8beb6}.cnt{font-weight:600}",
    ".row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #dfe3dc}.rl{min-width:0;flex:1 1 auto}.rr{flex:none;text-align:right}",
    ".nm{font-weight:600;font-size:15px}.sub{font-size:12px;color:#5f6762;margin-top:2px}.sub.st{margin-top:4px}.sub0{font-size:12px;color:#5f6762}.none{font-size:14px;color:#5f6762}",
    ".b{font-weight:600}.wait{display:inline-flex;align-items:center;gap:5px;font-size:13px;white-space:nowrap}.ver{font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}.dtr{font-size:13px;white-space:nowrap}",
    ".nrow{display:flex;align-items:center;gap:8px;margin-bottom:12px;font-size:13px}.nrow .muted{font-size:13px}",
    ".tw{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.35}",
    "th{text-align:left;padding:0 10px 8px 0;border-bottom:1px solid #b8beb6}td{text-align:left;vertical-align:top;padding:11px 10px 11px 0;border-bottom:1px solid #dfe3dc}",
    ".num{text-align:right}.w64{width:64px}.w150{width:150px}.big{font-variant-numeric:tabular-nums;font-weight:600}.dt{color:#5f6762;font-size:13px;white-space:nowrap}.fb{font-size:13px}.nw{white-space:nowrap}",
    ".flag{border-bottom:1px solid #dfe3dc}.flag summary{list-style:none;cursor:pointer;padding:11px 0;display:block}.flag summary::-webkit-details-marker{display:none}",
    ".flag summary:focus-visible{outline:2px solid #1f2421;outline-offset:2px;border-radius:4px}",
    ".fhead{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}.fname{min-width:64px}.fpill{display:inline-flex;align-items:center;gap:8px;flex:1 1 auto}.chev{margin-left:auto;transition:transform .15s}",
    ".flag[open] .chev{transform:rotate(180deg)}.flag summary .clamp{margin-top:6px}.flag[open] summary .clamp{display:none}",
    ".fbody{padding:0 0 12px;font-size:13px;line-height:1.45}.ftext{overflow-wrap:anywhere}.fnext{margin-top:8px;overflow-wrap:anywhere}.fnext .tl{display:block;margin-bottom:2px}",
    ".clamp{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:1.4}",
    ".foot{font-size:12px;color:#5f6762;padding:10px 0}.empty{padding:4px 0 14px;font-size:14px}",
    ".key{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px 20px;padding-bottom:12px}.kitem{display:flex;flex-direction:column;align-items:flex-start;gap:4px}",
    ".steps{margin:0 0 12px;padding-left:20px;line-height:1.5}.steps li{margin-bottom:6px}",
    "#keybox{width:100%;box-sizing:border-box;min-height:44px;padding:0 12px;border:1px solid #b8beb6;border-radius:10px;font:inherit;background:#fff}",
    ".srow{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}.sbtn{min-height:44px;padding:0 16px;border-radius:10px;border:1.5px solid #1f2421;background:#1f2421;color:#f8f9f5;font:inherit;font-weight:600;cursor:pointer}.sbtn.ghost{background:transparent;color:#1f2421}"
  ].join("\n");

  // ---------- reading and rebuilding (no screen code here: the browser part passes callbacks) ----------

  function getKey(storage) { try { return (storage && storage.getItem(KEY_NAME)) || ""; } catch (e) { return ""; } }
  function setKey(storage, v) { try { if (v) storage.setItem(KEY_NAME, v); else storage.removeItem(KEY_NAME); return true; } catch (e) { return false; } }

  /** The newest board: the status branch through GitHub's API first (fresh), then the published copy. null if neither. */
  function readBoard(fetchFn, key, now) {
    var h = { Accept: "application/vnd.github.raw+json" };
    if (key) h.Authorization = "Bearer " + key;
    var t = (now ? now() : Date.now());
    function json(r) { if (!r || !r.ok) throw new Error("bad"); return r.json(); }
    function pages() {
      return fetchFn("board.json?t=" + t, { cache: "no-store" }).then(json).catch(function () { return null; });
    }
    return fetchFn(API + "/contents/board.json?ref=status&t=" + t, { headers: h, cache: "no-store" }).then(json)
      .then(function (j) { return j && j.updated ? j : pages(); })
      .catch(pages);
  }
  /** Start the status board workflow on main. Resolves { ok, status }. */
  function dispatch(fetchFn, key) {
    return fetchFn(API + "/actions/workflows/status-board.yml/dispatches", {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "main" })
    }).then(function (r) { return { ok: r.status === 204 || r.ok, status: r.status }; }, function () { return { ok: false, status: 0 }; });
  }
  function newer(j, shown) { return !!(j && j.updated && (!shown || String(j.updated) > String(shown))); }

  /** One tap on Refresh. env: { fetch, storage, shown() → the board's updated time on screen, onBoard(j), onButton(text|null),
      onNote(text), wait(ms) → Promise, now() → ms }. Resolves "read" | "rebuilt" | "timeout" | "badkey". */
  function refresh(env) {
    var key = getKey(env.storage);
    var wait = env.wait || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var now = env.now || Date.now;
    function reread() {
      return readBoard(env.fetch, key, now).then(function (j) { if (newer(j, env.shown())) env.onBoard(j); });
    }
    if (!key) {
      env.onButton("Refreshing…"); env.onNote("");
      return reread().then(function () { env.onButton(null); return "read"; });
    }
    env.onButton("Rebuilding…"); env.onNote("");
    var before = env.shown();
    return dispatch(env.fetch, key).then(function (r) {
      if (!r.ok) {
        var bad = r.status === 401 || r.status === 403 || r.status === 404;
        key = "";  // fall back to re-reading without the key
        return reread().then(function () {
          env.onButton(null);
          env.onNote(bad ? "That key didn't work (wrong or expired). Showing the latest published board." : "Couldn't start a rebuild. Showing the latest published board.");
          return "badkey";
        });
      }
      var start = now();
      function poll() {
        return wait(POLL_MS).then(function () { return readBoard(env.fetch, key, now); }).then(function (j) {
          if (newer(j, before) && newer(j, env.shown())) { env.onBoard(j); env.onButton(null); return "rebuilt"; }
          if (now() - start >= POLL_FOR_MS) { env.onButton(null); env.onNote("Still building. Try again in a minute."); return "timeout"; }
          return poll();
        });
      }
      return poll();
    });
  }

  // ---------- the browser part ----------

  function boot() {
    var app = document.getElementById("app");
    var dataEl = document.getElementById("board-data");
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var storage = null;
    try { storage = window.localStorage; } catch (e) { storage = null; }
    var ui = { button: null, note: "", setupOpen: false, setupNote: "", hasKey: !!getKey(storage), openFlags: {} };
    // Remember which flag rows are open, so a redraw (a newer board, every 5 minutes) doesn't close them.
    document.addEventListener("toggle", function (ev) {
      var el = ev.target;
      if (el && el.getAttribute && el.getAttribute("data-flag")) ui.openFlags[el.getAttribute("data-flag")] = el.open;
    }, true);
    var lastRead = Date.now(), busy = false;
    function draw() {
      var box = document.getElementById("keybox"), typed = box ? box.value : "";
      app.innerHTML = renderApp(data, ui);
      var nb = document.getElementById("keybox");
      if (nb && typed) nb.value = typed;
    }
    function show(j) { data = j; draw(); }
    function shown() { return data.updated; }
    document.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-act]") : null;
      if (!t) return;
      var act = t.getAttribute("data-act");
      if (act === "refresh") {
        if (busy) return;
        busy = true;
        refresh({ fetch: window.fetch.bind(window), storage: storage, shown: shown, onBoard: show,
          onButton: function (b) { ui.button = b; draw(); }, onNote: function (n) { ui.note = n; draw(); } })
          .then(function () { busy = false; lastRead = Date.now(); }, function () { busy = false; ui.button = null; draw(); });
      } else if (act === "setup") {
        ev.preventDefault(); ui.setupOpen = !ui.setupOpen; ui.setupNote = ""; draw();
        if (ui.setupOpen) window.scrollTo(0, 0);
      } else if (act === "close") { ui.setupOpen = false; draw(); }
      else if (act === "save") {
        var v = (document.getElementById("keybox").value || "").trim();
        if (!v) { ui.setupNote = "Paste the token first."; draw(); return; }
        ui.setupNote = setKey(storage, v) ? "Saved. Refresh now rebuilds the board." : "This browser won't keep it (private mode?).";
        document.getElementById("keybox").value = "";
        ui.hasKey = !!getKey(storage); draw();
      } else if (act === "remove") {
        setKey(storage, ""); ui.hasKey = false; ui.setupNote = "Removed from this device."; draw();
      }
    });
    function auto() {
      if (busy || document.visibilityState !== "visible") return;
      lastRead = Date.now();
      readBoard(window.fetch.bind(window), getKey(storage)).then(function (j) { if (newer(j, shown())) show(j); });
    }
    setInterval(auto, AUTO_MS);
    document.addEventListener("visibilitychange", function () { if (Date.now() - lastRead >= AUTO_MS) auto(); });
    draw();
  }

  var api = { renderApp: renderApp, refresh: refresh, readBoard: readBoard, dispatch: dispatch, newer: newer, getKey: getKey, setKey: setKey,
    esc: esc, CSS: CSS, KEY_NAME: KEY_NAME, API: API, STATE_ORDER: STATE_ORDER, POLL_MS: POLL_MS, POLL_FOR_MS: POLL_FOR_MS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else {
    root.FlagfallStatus = api;
    if (typeof document !== "undefined" && document.getElementById) boot();
  }
})(this);
