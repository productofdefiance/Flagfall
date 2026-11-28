#!/usr/bin/env node
// @test job=rules quick=yes release=yes night=no
/* Checks for the status board (Brief 021) and its page (Brief 023, test_page.js), on fixture data, no network. Run: node sims/status/test_board.js */
"use strict";
const B = require("./board.js");

let fails = 0;
const check = (name, ok, extra) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !extra ? "" : "\n      " + extra}`); if (!ok) fails++; };

const NOW = "2026-11-20T08:40:00Z"; // 3:40 am ET
const facts = {
  now: NOW,
  main: { game: "v3.09.01", build: 13, rules: "v3.6", brain: "Brain 5" },
  nightly: { conclusion: "pass", time: "2026-11-20T08:07:00Z" },
  results: [
    { id: "2026-11-20_study_a", date: "2026-11-20", version: "v3.09.01", kind: "study", answer: "5v5: mirror, 57.0% ended on the turn limit" },
    { id: "2026-11-19_release_r", date: "2026-11-19", version: "v3.09.01", kind: "release", answer: "5v5 57.0% on the turn limit, 7v7 43.7%" },
    { id: "2026-11-17_screen_old", date: "2026-11-17", version: "v3.05.00", kind: "screen", answer: "OLD RESULT, more than a day old" },
    { id: "2026-11-20_study_a", date: "2026-11-20", version: "v3.09.01", kind: "study", answer: "5v5: mirror, 57.0% ended on the turn limit" }
  ],
  flags: [
    { name: "F10", date: "16 Nov", status: "OPEN", issue: "5v5 stalls", fromPr: false },
    { name: "F12", date: "16 Nov", status: "TEST", issue: "First mover", fromPr: false },
    { name: "F20", date: "17 Nov", status: "CLOSED", issue: "closed one", fromPr: false },
    { name: "F39", date: "20 Nov", status: "OPEN", issue: "main's copy of F39", fromPr: false },
    { name: "F39", date: "20 Nov", status: "ASK", issue: "the pull request's copy of F39", fromPr: true, pr: 31, added: false },
    { name: "F019-2", date: "20 Nov", status: "ASK", issue: "a new-style flag from brief 019", fromPr: true, pr: 33, added: true },
    { name: "F019-1", date: "20 Nov", status: "TEST", issue: "another from brief 019", fromPr: true, pr: 33, added: true },
    { name: "F36", date: "19 Nov", status: "DECIDE", issue: "waiting on the Editor", fromPr: false }
  ],
  briefs: [
    { num: "011", slug: "011-special-attacks", waitsOn: [], size: "YY" },
    { num: "014", slug: "014-fields", waitsOn: ["011"], size: "YY" },
    { num: "016", slug: "016-stall-logging", waitsOn: [], size: "ZZ" },
    { num: "017", slug: "017-move-preview", waitsOn: ["016"], size: "YY" },
    { num: "018", slug: "018-turn-cue-zoom", waitsOn: null, size: "YY" },
    { num: "020", slug: "020-victory-values", waitsOn: ["011", "019"], size: "YY" }
  ],
  prs: [
    { number: 31, title: "011 Rules · Special attacks (YY)", state: "open", draft: true, brief: "011", checks: "pass", review: "merge", game: "v3.09.01", size: "YY" },
    { number: 33, title: "019 Bot · Brain 7 (YY)", state: "open", draft: false, brief: "019", checks: "running", review: null, size: "YY", waits: ["016", "018"] },
    { number: 28, title: "v3.09.01 · 016 Lab · Stall logging", state: "merged", mergedAt: "2026-11-19T07:22:24Z", brief: "016" }
  ],
  chats: [
    { file: "2026-11-16-1000-old.md", name: "FF Rules v3.06.00 -", subject: "old rules chat", opened: "2026-11-16 10:00 ET", status: "open", lastChange: "2026-11-16T15:00:00Z" },
    { file: "2026-11-20-0100-bot.md", name: "FF Bot v3.09.01 -", subject: "Brain 7 review", opened: "2026-11-20 01:00 ET", status: "open", lastChange: "2026-11-20T06:00:00Z" },
    { file: "2026-11-18-0900-specials.md", name: "FF Specials", finalName: "FF Specials v3.09.00", subject: "specials", status: "closed", closed: "2026-11-19 20:00 ET", outcome: "brief 011 written", lastChange: "2026-11-20T01:00:00Z" }
  ]
};

const b = B.buildBoard(facts);
const sec = (t) => b.sections.find((s) => s.title.startsWith(t)).lines.map((l) => l.text);
const builds = sec("BUILDS");
const after = (head) => { const i = builds.indexOf(head); const out = []; for (let j = i + 1; j < builds.length && !/^(Building|Ready to start|Waiting|Merged)/.test(builds[j]); j++) out.push(builds[j]); return out; };

console.log(b.text);
check("header is in US Eastern time", b.header === "STATUS · updated 20 Nov 2026, 3:40 am ET", b.header);
check("sections in order", b.sections.map((s) => s.title.split(" ")[0]).join(",") === "VERSION,RESULTS,FLAGS,BUILDS,CHATS");
check("VERSION shows main", sec("VERSION")[0] === "On main: v3.09.01 · Build 13 · Rules v3.6 · Brain 5", sec("VERSION")[0]);
// Brief 031: no number in a pull request; the board says what it would be if merged next, and what it waits on.
check("VERSION Building: the size, what it would be if merged next, and waits on", sec("VERSION")[1] === "Building: 011 → YY · would be v3.10.00 if merged next; 019 → YY · would be v3.10.00 if merged next · waits on 016, 018", sec("VERSION")[1]);
check("a brief whose Waits on are all merged is Ready to start", after("Ready to start").includes("017 Move preview"), after("Ready to start").join(" | "));
check("a brief waiting on an unmerged brief is Waiting and names it", after("Waiting").includes("014 Fields ← 011") && after("Waiting").includes("020 Victory values ← 011, 019"), after("Waiting").join(" | "));
check("a missing Waits on row reads 'not stated'", after("Waiting").includes("018 Turn cue zoom ← not stated"), after("Waiting").join(" | "));
check("a Draft pull request is Building", after("Building").some((l) => l.startsWith("011 Special attacks · PR #31 · Draft · checks pass · reviewed: merge")), after("Building").join(" | "));
check("no review label reads 'not reviewed'; a pull request failing waits-on says what it waits on", after("Building").some((l) => l === "019 Brain 7 · PR #33 · Ready · checks running · not reviewed · waits on 016, 018"), after("Building").join(" | "));
check("a building brief is not also Ready or Waiting", !after("Ready to start").concat(after("Waiting")).some((l) => l.startsWith("011")));
check("Merged shows version and date", after("Merged (last 3)")[0] === "016 Stall logging · v3.09.01 · 19 Nov", after("Merged (last 3)").join(" | "));

const flags = sec("FLAGS");
const names = flags.map((l) => l.replace(/^[! ]\s/, "").split(" · ")[0]);
check("flags sort newest first (then by name)", names.join(",") === "F39,F019-2,F019-1,F36,F12,F10", names.join(","));
check("ASK and DECIDE rows carry !", flags.filter((l) => l.startsWith("! ")).length === 3 && flags.find((l) => l.includes("F019-2")).startsWith("! ") && flags.find((l) => l.includes("F36")).startsWith("! "));
check("TEST and OPEN rows carry no !", flags.find((l) => l.includes("F019-1")).startsWith("  ") && flags.find((l) => l.includes("F10")).startsWith("  "));
check("a flag on main and in a pull request appears once, the pull request's copy", flags.filter((l) => / F39 /.test(l + " ")).length === 1 && flags.some((l) => l.includes("the pull request's copy of F39")), flags.join(" | "));
check("closed flags are left out", !flags.some((l) => l.includes("F20")));

const res = sec("RESULTS");
check("nightly checks line", res[0] === "Nightly checks: pass (20 Nov, 3:07 am ET)", res[0]);
check("results older than 24 hours are left out", !res.some((l) => l.includes("OLD RESULT")), res.join(" | "));
check("a result seen twice is listed once, newest first", res.filter((l) => l.startsWith("study")).length === 1 && res[1].startsWith("study v3.09.01") && res[2].startsWith("release v3.09.01"), res.join(" | "));

const chats = sec("CHATS");
check("an open chat file untouched for 3 days reads stale?", chats.includes("FF Rules v3.06.00 - · old rules chat · opened 16 Nov stale?"), chats.join(" | "));
check("a fresh open chat is not stale", chats.includes("FF Bot v3.09.01 - · Brain 7 review · opened 20 Nov"), chats.join(" | "));
check("open chats oldest first", chats.indexOf("FF Rules v3.06.00 - · old rules chat · opened 16 Nov stale?") < chats.indexOf("FF Bot v3.09.01 - · Brain 7 review · opened 20 Nov"));
check("closed chat shows final name, date and outcome", chats.includes("FF Specials v3.09.00 · closed 19 Nov · brief 011 written"), chats.join(" | "));

const bytes = Buffer.byteLength(b.text);
check(`BOARD.md for the fixture is under 4 KB (${bytes} bytes)`, bytes < 4096);

// A clash: an old-style number a pull request added that main has given to another flag shows both.
const clash = B.buildBoard(Object.assign({}, facts, { flags: [
  { name: "F38", date: "20 Nov", status: "ASK", issue: "main's F38", fromPr: false },
  { name: "F38", date: "20 Nov", status: "ASK", issue: "another build's F38", fromPr: true, pr: 33, added: true }
] }));
const cf = clash.sections.find((s) => s.title.startsWith("FLAGS")).lines.map((l) => l.text);
check("a clashing old-style number shows both rows, the pull request's marked", cf.length === 2 && cf.some((l) => l.includes("F38 (PR #33)")), cf.join(" | "));

// Empty sections say none.
const empty = B.buildBoard({ now: NOW, main: { game: "v3.09.01", build: 13 } });
check("empty sections say none", /Building: none/.test(empty.text) && /FLAGS \(open, newest first\)\n {2}none/.test(empty.text) && /Open\n {4}none/.test(empty.text), empty.text);

// A huge board is shortened to stay under the limit.
const many = Object.assign({}, facts, {
  flags: Array.from({ length: 30 }, (_, i) => ({ name: `F${100 + i}`, date: "20 Nov", status: "ASK", issue: "x ".repeat(200), fromPr: false })),
  results: Array.from({ length: 30 }, (_, i) => ({ id: `2026-11-20_r${i}`, date: "2026-11-20", version: "v3.09.01", kind: "screen", answer: "y ".repeat(200) }))
});
const mb = B.buildBoard(many);
check(`a full board still fits in 4 KB (${Buffer.byteLength(mb.text)} bytes)`, Buffer.byteLength(mb.text) < 4096);
check("limits: at most 12 flags and 8 results, then a count", /\+18 older in FLAGS\.md/.test(mb.text) && /\+22 more in results\/INDEX\.md/.test(mb.text));

// Parsers.
const br = B.parseBrief("# Brief 020 — X\n\n| | |\n|---|---|\n| Game version | Next free **YY** at merge |\n| Waits on | 011, 019 |\n| Order | after |\n");
check("parseBrief reads Waits on and the size", JSON.stringify(br.waitsOn) === '["011","019"]' && br.size === "YY", JSON.stringify(br));
check("parseBrief: Waits on none is an empty list", JSON.stringify(B.parseBrief("| Waits on | none |\n").waitsOn) === "[]");
check("parseBrief: no Waits on row is null (never guessed)", B.parseBrief("| Order | **After 011 merges** |\n").waitsOn === null);
check("parseBrief: X from an old-style header", B.parseBrief("| Game version | **v4.00.00** (X: a big new system) |\n").size === "X");
const pf = B.parseFlags("| # | Date |\n|---|---|\n| F019-1 | 20 Nov | Code | an issue | ASK | next |\n| F7 | 16 Nov | Red team | old | FIXED | done |\n");
check("parseFlags reads new-style and old-style names", pf.length === 2 && pf[0].name === "F019-1" && pf[0].status === "ASK" && pf[1].status === "FIXED");
check("titles: brief number found in build, Draft and old titles; not in docs titles",
  B.briefFromTitle("v3.10.00 · 011 Rules · Special attacks") === "011" && B.briefFromTitle("019 Bot · Brain 7 (YY)") === "019" &&
  B.briefFromTitle("Brief 006: Brain 5") === "006" && B.briefFromTitle("Docs · F42, 1,000 games") === null && B.briefFromTitle("Lab results, 2026-11-20 (day)") === null);
const csv = B.parseCsv('id,answer\na,"x, ""y""\nz"\nb,plain\n');
check("parseCsv handles quotes, commas and newlines", csv.length === 2 && csv[0].answer === 'x, "y"\nz' && csv[1].answer === "plain");
check("changed() ignores the updated time", !B.changed(B.boardJson(b, {}), B.boardJson(B.buildBoard(Object.assign({}, facts, { now: "2026-11-20T08:41:00Z" })), {})));

// ---------- Brief 023: needs sync, the marks, results shares, issue text ----------
check("syncState: a conflicting pull request needs sync", B.syncState(false, []) === "conflict");
check("syncState: behind main only by results/ and studies/ commits does not", B.syncState(true, ["results/INDEX.md", "results/v3.10.00/x/run.json", "studies/done/a.json"]) === null);
check("syncState (Brief 031): behind main by anything else no longer needs sync (versions don't conflict)", B.syncState(true, ["results/INDEX.md", "board/engine.js", "board/version.js", "CHANGELOG.md"]) === null);
check("syncState: mergeable unknown and nothing behind adds nothing", B.syncState(null, []) === null);
const st = (o) => B.buildState(Object.assign({ draft: false, checks: "pass", review: null, sync: null }, o));
check("mark order: Broken beats everything", st({ checks: "fail", sync: "conflict", review: "merge" }) === "broken");
check("mark order: Needs sync beats On hold, Ready to merge and Review", st({ sync: "conflict", review: "hold" }) === "sync" && st({ sync: "behind", review: "merge" }) === "sync" && st({ sync: "behind" }) === "sync");
check("mark order: On hold beats Ready to merge", st({ review: "hold" }) === "hold" && st({ review: "merge" }) === "merge");
check("mark order: Review is not Draft, checks pass, not reviewed", st({}) === "review" && st({ draft: true }) === "running" && st({ checks: "running" }) === "running");
check("mark order matches the page's order", JSON.stringify(require("./page.js").STATE_ORDER) === '["broken","sync","hold","merge","review","running"]');

const facts23 = Object.assign({}, facts, {
  prs: [
    { number: 36, title: "014 Fields · Fields (YY)", state: "open", draft: false, brief: "014", checks: "pass", review: null, sync: "conflict", game: "v3.12.00" },
    { number: 37, title: "016 Lab · Stall logging (ZZ)", state: "open", draft: false, brief: "016", checks: "fail", review: null, sync: null, game: null },
    { number: 38, title: "017 UI · Move preview (YY)", state: "open", draft: false, brief: "017", checks: "pass", review: "hold", sync: null, game: null },
    { number: 39, title: "018 UI · Turn cue zoom (YY)", state: "open", draft: true, brief: "018", checks: "running", review: null, sync: null, game: null }
  ],
  results: [
    Object.assign({ id: "2026-11-20_release_r", date: "2026-11-20", version: "v3.11.00", kind: "release", answer: "long text" },
      B.resultShares("matchup,a,b,rules,format,games,turn_limit\n5v5,brain5,brain5,v3.7,blitz5,1000,367\n7v7,brain5,brain5,v3.7,std7,1000,414\n")),
    Object.assign({ id: "2026-11-20_study_s", date: "2026-11-20", version: "v3.10.00", kind: "study", answer: "long text" },
      B.resultShares('matchup,a,b,rules,format,games,turn_limit\nx-5v5,"brain7:k=1",brain5,v3.6,blitz5,1000,400\ny-5v5,brain7:k=2,brain5,v3.6,blitz5,1000,420\nx-7v7,brain7:k=1,brain5,v3.6,std7,1000,300\ny-7v7,brain7:k=2,brain5,v3.6,std7,1000,310\n'))
  ],
  flags: [{ name: "F50", date: "20 Nov", status: "ASK", issue: "word ".repeat(120), fromPr: false }]
});
const b23 = B.buildBoard(facts23);
const v = b23.view;
const row = (n) => v.builds.building.find((x) => x.pr === n);
check("a conflicting pull request reads Needs sync", row(36).state === "sync" && row(36).sync === "conflict");
check("BOARD.md: needs sync in place of Ready", b23.text.includes("014 Fields · PR #36 · needs sync · checks pass · not reviewed"), b23.text);
check("failed checks read Broken", row(37).state === "broken");
check("a review: hold label reads On hold", row(38).state === "hold");
check("a Draft reads Running", row(39).state === "running" && row(39).draft === true);
check("a building row carries its play link and what it would be if merged next", row(36).play === "https://productofdefiance.github.io/Flagfall/pr/36/" && row(36).version === null && row(36).next === "v3.10.00", JSON.stringify(row(36)));
const r1 = v.results.find((r) => r.kind === "release"), r2 = v.results.find((r) => r.kind === "study");
check("results: the two shares from the run's own mirror matchups", Math.abs(r1.share5 - 0.367) < 1e-9 && Math.abs(r1.share7 - 0.414) < 1e-9);
check("results: several matchups and no mirror fall back to a line", r2.share5 === null && r2.share7 === null && r2.line === "4 matchups, 4,000 games", JSON.stringify(r2));
check("results: a format's only matchup counts", B.resultShares("matchup,a,b,format,games,turn_limit\nm,brain7,brain5,std7,200,77\n").share7 === 0.385);
check("results: no outcomes table gives no numbers", B.resultShares("").share5 === null && B.resultShares(null).line === null);
check("BOARD.md: results in the short form", b23.text.includes("release v3.11.00 · 5v5 36.7% · 7v7 41.4% on the turn limit · 20 Nov") && b23.text.includes("study v3.10.00 · 4 matchups, 4,000 games · 20 Nov"), b23.text);
check(`a flag's issue text is carried to about 300 characters (${v.flags[0].issue.length})`, v.flags[0].issue.length >= 250 && v.flags[0].issue.length <= 301);
check("tiles: building count and flags waiting on an answer", v.tiles.building === 4 && v.tiles.flagsAsk === 1 && v.tiles.flagsNewest === "F50");
check(`BOARD.md with Brief 023 rows is under 4 KB (${Buffer.byteLength(b23.text)} bytes)`, Buffer.byteLength(b23.text) < 4096);
const j23 = B.boardJson(b23, { prBrief: {} });
check("board.json keeps the board text and adds the structured facts", typeof j23.board === "string" && j23.sections && j23.cache && j23.builds && j23.results && j23.flags && j23.chats && j23.tiles && j23.schema === 2);

// The page.
const html = B.renderHtml(b23, j23);
check("the page shows every section and the updated time", ["Builds", "Results", "Chats", "Flags", "Key"].every((t) => html.includes(`<h2>${t}</h2>`)) && html.includes("Updated 20 Nov 2026, 3:40 am ET"));
check("the page shows each build's mark", ["Needs sync", "Broken", "On hold", "Building"].every((w) => html.includes(w)));
check("the page escapes text from the repository", (() => {
  const evil = B.buildBoard(Object.assign({}, facts, { flags: [{ name: "F99", date: "20 Nov", status: "ASK", issue: "<img src=x onerror=alert(1)></script>", fromPr: false }] }));
  const h = B.renderHtml(evil, B.boardJson(evil, {}));
  return !h.includes("<img src=x") && !/<\/script>\s*<img/.test(h) && h.split("</script>").length === 3;
})());
// Editor's follow-ups (F023-3, Ready to start group).
const longIssue = "Start of the issue. " + "middle words ".repeat(60) + "END OF ISSUE";
const bx = B.buildBoard(Object.assign({}, facts, { flags: [{ name: "F51", date: "20 Nov", status: "ASK", issue: longIssue, next: "Recommended: **do it**", fromPr: false }] }));
const fx = bx.view.flags[0];
check("board.json carries the whole issue and its next step for the flags shown", fx.issueFull.endsWith("END OF ISSUE") && fx.issue.length <= 301 && fx.next === "Recommended: do it", JSON.stringify(fx).slice(0, 200));
check("parseFlags reads the Resolved in / next step column", B.parseFlags("| F7 | 16 Nov | Code | an issue | ASK | the next step |\n")[0].next === "the next step");
const hx = B.renderHtml(bx, B.boardJson(bx, {}));
const P2 = require("./page.js");
check("each flag row is a details/summary (keyboard and tap) with the preview, the whole issue and the next step",
  /<details class="flag" data-flag="F51"><summary>[\s\S]*class="clamp">Start of the issue[\s\S]*<\/summary><div class="fbody"><div class="ftext">[^<]*END OF ISSUE<\/div><div class="fnext">[\s\S]*Recommended: do it/.test(hx));
check("an open flag row stays open when the page is redrawn", /<details class="flag" data-flag="F51" open>/.test(P2.renderApp(B.boardJson(bx, {}), { openFlags: { F51: true } })));
const hb = P2.renderApp(B.boardJson(b, {}), {});
const grpAt = (t) => hb.indexOf(`<h3 class="grp">${t} `);
check("Builds: a Ready to start group between Building and Waiting", grpAt("Building") < grpAt("Ready to start") && grpAt("Ready to start") < grpAt("Waiting") && grpAt("Waiting") < grpAt("Merged"));
const waitPart = hb.slice(grpAt("Waiting"), grpAt("Merged")), readyPart = hb.slice(grpAt("Ready to start"), grpAt("Waiting"));
check("ready briefs leave Waiting", readyPart.includes("017 Move preview") && !waitPart.includes("017 Move preview") && waitPart.includes("014 Fields") && !waitPart.includes("Ready to start</span>"));
check("the set-up panel says the key expires after 90 days", /90 days/.test(P2.renderApp(B.boardJson(b, {}), { setupOpen: true })));
// Brief 024: the Queue line.
const bq = B.buildBoard(Object.assign({}, facts, { queue: { jobsWaiting: 12, oldestWaitMin: 43, labUsing: 9, checksWaiting: 10 } }));
check("BOARD.md: the Queue line under RESULTS", bq.sections.find((s) => s.title.startsWith("RESULTS")).lines[1].text === "Queue: 12 jobs waiting, oldest 43 min · lab using 9 of 20");
check("the page: the Queue row under the tiles, with the Running mark over 15 minutes", (() => { const h = require("./page.js").renderApp(B.boardJson(bq, {}), {}); const t = h.indexOf('class="tiles"'), q = h.indexOf('class="qrow"'), c = h.indexOf('class="cols"'); return t < q && q < c && /qrow"><span class="pill p-running">[\s\S]*Waiting<\/span><span>Queue: 12 jobs waiting/.test(h); })());
const bc = B.buildBoard(Object.assign({}, facts, { queue: { jobsWaiting: 0, labUsing: 0 } }));
check("Queue: clear", bc.text.includes("  Queue: clear\n"));
check("a queue that can't be read says so", B.buildBoard(Object.assign({}, facts, { queue: null })).text.includes("Queue: unknown"));
check("a board built without queue facts (old fixtures) has no Queue line", !b.text.includes("Queue:"));
check(`BOARD.md with the Queue line is under 4 KB (${Buffer.byteLength(mb.text)} bytes, full board)`, Buffer.byteLength(B.buildBoard(Object.assign({}, many, { queue: { jobsWaiting: 99, oldestWaitMin: 999, labUsing: 20 } })).text) < 4096);
const pageChecks = require("./test_page.js").run(check, B, b23, j23);

// Brief 031: a merged build shows the number it got (counted, never typed in a title).
const b31 = B.buildBoard(Object.assign({}, facts, { prs: [{ number: 70, title: "031 Lab · Version at merge (ZZ)", state: "merged", mergedAt: "2026-11-28T07:22:24Z", brief: "031", version: "v3.20.01" }] }));
check("Merged shows the counted version", b31.sections.find((x) => x.title === "BUILDS").lines.some((l) => l.text === "031 Version at merge · v3.20.01 · 28 Nov"), b31.text);
check("size none reads no version", B.buildBoard(Object.assign({}, facts, { prs: [{ number: 71, title: "032 Lab · Tooling (none)", state: "open", brief: "032", size: "none", checks: "pass" }] })).sections[0].lines[1].text === "Building: 032 → none · no version");

// Brief 031 amendments: main broken (M6), a follow-up's title (A4), old-way briefs count as merged (B1).
const bBroken = B.buildBoard(Object.assign({}, facts, { mainBroken: { since: "040" } }));
check("main broken since <brief> shows under VERSION", bBroken.sections[0].lines.some((l) => l.text === "! main broken since 040"), bBroken.sections[0].lines.map((l) => l.text).join(" | "));
check("and on the page's On main tile", B.renderHtml(bBroken, B.boardJson(bBroken, {})).includes("main broken since 040"));
check("a follow-up's title reads NNN-2", B.briefFromTitle("025-2 UI · Strength fix (ZZ)") === "025-2" && B.nameFromTitle("025-2 UI · Strength fix (ZZ)") === "Strength fix");
const bOld = B.buildBoard(Object.assign({}, facts, { mergedBriefs: ["019"] }));
check("a brief merged the old way (BASE.json) counts as merged for Waiting", !bOld.sections.find((x) => x.title === "BUILDS").lines.some((l) => /020 Victory values ← .*019/.test(l.text)), bOld.text);

pageChecks.catch((e) => check("page checks ran", false, e && e.stack)).then(() => {
  console.log(fails ? `\n${fails} check(s) failed.` : "\nAll status board checks passed.");
  process.exit(fails ? 1 : 0);
});
