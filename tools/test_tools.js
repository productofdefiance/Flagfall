#!/usr/bin/env node
/* Brief 031's tools, tried on plain facts with no network: the version check, waits-on, which changes get a release
 * run, the assembled changelog, "same games as", and the release run's test list.
 * Run: node tools/test_tools.js */
"use strict";
const path = require("path");
const CR = require("./check-release.js"), WO = require("./waits-on.js"), CL = require("./changelog.js");
const RF = require("../sims/lab/release_files.js"), RT = require("../sims/lab/release_tests.js"), SAME = require("../sims/lab/same.js");
let fails = 0;
const ok = (c, m, extra) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) { fails++; if (extra) console.log("      " + extra); } };

// ---------- the version check ----------
const NULLV = "const VERSION = { game: null, build: null, date: null, preview: null };";
const BRIEF = (size, waits) => `# Brief 040 — x\n\n| | |\n|---|---|\n| Game version | ${size} |\n| Waits on | ${waits || "none"} |\n`;
const rel = (o) => JSON.stringify(Object.assign({ brief: "040", bump: "YY", rules: null, brain: null, ui: null }, o));
const facts = (o) => Object.assign({
  push: false, headRef: "claude/x", title: "040 UI · Thing (YY)",
  changes: [{ status: "M", file: "board/app.js" }, { status: "A", file: "releases/040.json" }, { status: "A", file: "changelog/040.md" }],
  briefText: () => BRIEF("YY"), releaseText: () => rel({}), versionSrc: NULLV, baseMissing: false,
  changelogAdded: (n) => n === "040"
}, o);
const judge = (o) => CR.judge(facts(o));
ok(judge({}).ok, "a board change with releases/040.json (YY, matching the brief) and changelog/040.md passes", judge({}).lines.join(" | "));
ok(!judge({ changes: [{ status: "M", file: "board/app.js" }] }).ok, "board/ changed without a releases file: fails");
ok(!judge({ releaseText: () => rel({ bump: "none" }), briefText: () => BRIEF("none") }).ok, "board/ changed with bump none: fails (a board change is at least ZZ)");
ok(!judge({ changes: facts({}).changes.concat([{ status: "A", file: "releases/041.json" }]) }).ok, "two releases files: fails");
ok(!judge({ changes: facts({}).changes.concat([{ status: "M", file: "releases/031.json" }]) }).ok, "an edited releases file: fails (append-only)");
ok(!judge({ changes: facts({}).changes.concat([{ status: "D", file: "releases/031.json" }]) }).ok, "a deleted releases file: fails");
ok(!judge({ title: "041 UI · Thing (YY)" }).ok, "releases/040.json on a pull request titled for brief 041: fails");
ok(!judge({ releaseText: () => rel({ bump: "ZZ" }) }).ok, "bump ZZ when the brief says YY: fails");
ok(!judge({ versionSrc: 'const VERSION = { game: "v3.21.00", build: 26, date: null, preview: null };' }).ok, "a number in board/version.js: fails");
ok(!judge({ changelogAdded: () => false }).ok, "no changelog/040.md: fails");
ok(!judge({ releaseText: () => rel({ brief: "041" }) }).ok, "a releases file whose brief field disagrees with its name: fails");
ok(!judge({ changes: [{ status: "A", file: "tools/x.js" }], title: "042 Lab · Tool (none)" }).ok, "a brief pull request with no releases file (tooling): fails, it must mark itself merged");
ok(judge({ changes: [{ status: "A", file: "tools/x.js" }, { status: "A", file: "releases/040.json" }, { status: "A", file: "changelog/040.md" }], releaseText: () => rel({ bump: "none" }), briefText: () => BRIEF("none"), title: "040 Lab · Tool (none)" }).ok, "a tooling brief with bump none and no board change passes");
ok(judge({ changes: [{ status: "M", file: "briefs/040-x.md" }, { status: "A", file: "flags/040.md" }], title: "Docs · Flags tidy" }).ok, "a docs pull request passes");
ok(judge({ headRef: "lab/20261127-x", changes: [{ status: "A", file: "results/v3.20.00/x/run.json" }], title: "Lab results" }).ok, "a results pull request (lab/**) passes");
ok(!judge({ headRef: "lab/x", changes: [{ status: "M", file: "releases/031.json" }] }).ok, "a results pull request still can't edit a releases file");
ok(judge({ changes: facts({}).changes.concat([{ status: "A", file: "releases/BASE.json" }]), baseMissing: true }).ok, "Brief 031's own pull request may add releases/BASE.json (main has none)");
ok(!judge({ changes: facts({}).changes.concat([{ status: "A", file: "releases/BASE.json" }]), baseMissing: false }).ok, "nobody else may add releases/BASE.json");
ok(judge({ push: true, changes: [{ status: "A", file: "releases/040.json" }] }).ok && !judge({ push: true, versionSrc: 'game: "v1.00.00", build: 1, date: null' }).ok, "a push to main checks only append-only and the null version.js");
ok(CR.briefFromTitle("031 Lab · Version at merge (ZZ)") === "031" && CR.briefFromTitle("v3.20.00 · 029 UI · Rematch") === "029" && CR.briefFromTitle("Docs · tidy") === null, "the brief number is read from the title, old and new shapes");
ok(CR.sizeFromBrief(BRIEF("ZZ (screen text)")) === "ZZ" && CR.sizeFromBrief(BRIEF("none")) === "none" && CR.sizeFromBrief(BRIEF("**YY**")) === "YY", "the size is read from the brief header");

// ---------- waits-on ----------
const merged = (list) => (n) => list.includes(n);
const wv = (o) => WO.verdict(Object.assign({ title: "040 UI · Thing (YY)", headRef: "claude/x", briefText: BRIEF("YY", "028"), merged: merged(["027"]) }, o));
ok(wv({}).state === "failure" && wv({}).description === "Waits on 028: not merged yet", `waiting on an unmerged brief fails with its reason: "${wv({}).description}"`);
ok(wv({ merged: merged(["027", "028"]) }).state === "success", "the same pull request turns green once 028 has merged (nothing on the pull request changes)");
ok(wv({ briefText: BRIEF("YY").replace(/\| Waits on.*\n/, "") }).description === "Waits on not stated in the brief", "a missing Waits on row fails");
ok(wv({ briefText: BRIEF("YY", "none") }).state === "success", "Waits on none passes");
ok(wv({ briefText: BRIEF("YY", "027, 028, 030") }).description === "Waits on 028, 030: not merged yet", "several briefs, only the unmerged ones named");
ok(wv({ title: "Docs · flags" }).state === "success" && wv({ headRef: "lab/x", title: "Lab results" }).state === "success", "docs and results pull requests pass");
ok(wv({ briefText: null }).state === "failure", "a brief pull request whose brief file can't be found fails");
ok(JSON.stringify(WO.parseWaitsOn("| Waits on | 029 |")) === '["029"]' && JSON.stringify(WO.parseWaitsOn("| Waits on | **none** |")) === "[]", "Waits on is read in the template's exact format");

// ---------- which changes get a release run ----------
const cls = RF.classify(["board/app.js", "board/ui.js", "board/version.js", "board/tests/test_x.js", "README.md"]);
ok(cls.game.length === 0 && cls.screen.length === 2 && cls.other.length === 0, "screen files only (version.js and tests ignored): no game change");
ok(RF.classify(["board/watch.js"]).game.length === 1 && RF.classify(["board/data.js", "board/app.js"]).game.length === 1, "watch.js and data.js are game files");
ok(RF.classify(["board/new.js"]).other.length === 1, "an unknown board file is decided by the replay hashes");
ok(RF.docsOnly(["briefs/040-x.md", "flags/040.md", "FLAGS.md", "CLAUDE.md"]) && !RF.docsOnly(["README.md", "sims/lab/x.md"]) && !RF.docsOnly(["board/x.md"]) && !RF.docsOnly([]), "docs only: briefs/, flags/ and .md outside board/ and sims/");

// ---------- the assembled changelog ----------
const OLD = "# Changelog\n\nintro\n\n## Game versions\n\n| Game version | Rule set (newest) | Default brain | UI | Build |\n|---|---|---|---|---|\n| v3.20.00 | v3.10 | Brain 8 | v7 | 25 |\n| v3.19.00 | v3.10 | Brain 8 | v6 | 24 |\n\n## v3.20.00 · Build 25 — Brief 029, Rematch (26 Nov 2026)\n\nold entry\n";
const hist = [{ game: "v3.20.01", build: 26, brief: "031", bump: "ZZ", rules: null, brain: null, ui: null, date: "2026-11-28" },
  { game: "v3.21.00", build: 27, brief: "040", bump: "YY", rules: "v3.11", brain: "Brain 9", ui: null, date: "2026-11-29" },
  { game: "v3.21.00", build: 27, brief: "042", bump: "none", rules: null, brain: null, ui: null, date: "2026-11-29" }];
const md = CL.assemble(hist, OLD, (n) => `## Brief ${n} · Thing ${n}\n\nWhat a player notices.\n`);
ok(md.indexOf("| v3.21.00 | v3.11 | Brain 9 | v7 | 27 |") > 0 && md.indexOf("| v3.20.01 | v3.10 | Brain 8 | v7 | 26 |") > md.indexOf("| v3.21.00 |") && md.indexOf("| v3.20.00 | v3.10 |") > md.indexOf("| v3.20.01 |"), "version table: new rows on top, carrying the rule set, brain and UI forward", md.split("\n").slice(4, 12).join(" / "));
ok(md.indexOf("## v3.21.00 · Build 27 — Brief 040 · Thing 040 (2026-11-29)") > 0 && md.indexOf("## v3.20.01 · Build 26 — Brief 031") > md.indexOf("## v3.21.00 · Build 27"), "entries numbered at publish, newest first");
ok(md.indexOf("## No game version · Build 27 — Brief 042") > 0, "a bump none entry says No game version");
ok(md.indexOf("## v3.20.00 · Build 25 — Brief 029, Rematch (26 Nov 2026)\n\nold entry") > md.indexOf("Brief 031"), "old entries stay exactly as they are, below the new ones");
ok(/<table>/.test(CL.toHtml(md)) && !/<script/.test(CL.toHtml("## <script>x</script>")), "the HTML page is escaped");

// ---------- same games as ----------
const rows = [{ kind: "release", version: "v3.18.00", path: "v3.18.00/r" }, { kind: "release", version: "v3.20.00", path: "v3.20.00/r" }, { kind: "study", version: "v3.20.00" }, { kind: "release", version: "v3.21.00+040" }];
ok(SAME.lastRelease(rows, "v3.20.01").version === "v3.20.00" && SAME.lastRelease(rows, "v3.19.00").version === "v3.18.00", "same games as: the newest older version with a release run (by number; previews' labels never count)");

// ---------- the release run's test list ----------
ok(RT.missing().length === 0, `every board/tests/test_*.js is in the release run or the skip list (missing: ${RT.missing().join(", ") || "none"})`);
const q = RT.quick().map((x) => x.name);
ok(["test_phone.js", "test_route.js", "test_v310.js", "test_version.js", "test_stamina.js"].every((f) => q.includes(f)) && q.includes("test_kitd.js (30)"), "the thirteen files the old list missed now run; old names kept");
ok(!q.some((n) => /test_v32|test_invariants|test_brain[6-9]/.test(n)), "files with their own release job aren't run twice");

console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll tool checks passed.");
process.exit(fails ? 1 : 0);
