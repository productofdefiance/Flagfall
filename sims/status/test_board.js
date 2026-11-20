#!/usr/bin/env node
/* Checks for the status board (Brief 021), on fixture data, no network. Run: node sims/status/test_board.js */
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
    { number: 33, title: "v3.10.00 · 019 Bot · Brain 7", state: "open", draft: false, brief: "019", checks: "running", review: null, game: "v3.10.00" },
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
check("VERSION Building: size until a number is taken, then the number", sec("VERSION")[1] === "Building: 011 → YY · 019 → v3.10.00", sec("VERSION")[1]);
check("a brief whose Waits on are all merged is Ready to start", after("Ready to start").includes("017 Move preview"), after("Ready to start").join(" | "));
check("a brief waiting on an unmerged brief is Waiting and names it", after("Waiting").includes("014 Fields ← 011") && after("Waiting").includes("020 Victory values ← 011, 019"), after("Waiting").join(" | "));
check("a missing Waits on row reads 'not stated'", after("Waiting").includes("018 Turn cue zoom ← not stated"), after("Waiting").join(" | "));
check("a Draft pull request is Building", after("Building").some((l) => l.startsWith("011 Special attacks · PR #31 · Draft · checks pass · reviewed: merge")), after("Building").join(" | "));
check("no review label reads 'not reviewed'", after("Building").some((l) => l === "019 Brain 7 · PR #33 · Ready · checks running · not reviewed"), after("Building").join(" | "));
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
const html = B.renderHtml(b);
check("the page has the same sections and the updated time, and no scripts", ["VERSION", "RESULTS", "FLAGS", "BUILDS", "CHATS"].every((t) => html.includes(`<h2>${t}`)) && html.includes("Updated 20 Nov 2026, 3:40 am ET") && !/<script/i.test(html));

console.log(fails ? `\n${fails} check(s) failed.` : "\nAll status board checks passed.");
process.exit(fails ? 1 : 0);
