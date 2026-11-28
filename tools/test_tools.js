#!/usr/bin/env node
// @test job=rules quick=yes release=yes night=no
/* Brief 031's tools with their amendments, tried with no network: the version check, waits-on, the release-run
 * decision (on real scratch git histories), "same games as", the generated test list and its runner.
 * Run: node tools/test_tools.js */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const CR = require("./check-release.js"), WO = require("./waits-on.js"), CL = require("./changelog.js"), RT = require("./run-tests.js");
const SV = require("./stamp-version.js");
const RF = require("../sims/lab/release_files.js"), SAME = require("../sims/lab/same.js");
let fails = 0;
const ok = (c, m, extra) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) { fails++; if (extra) console.log("      " + extra); } };

// ---------- the version check ----------
const NULLV = "const VERSION = { game: null, build: null, date: null, preview: null };";
const BRIEF = (size, waits) => `# Brief 040 — x\n\n| | |\n|---|---|\n| Game version | ${size} |\n| Waits on | ${waits || "none"} |\n`;
const rel = (o) => JSON.stringify(Object.assign({ brief: "040", bump: "YY", rules: null, brain: null, ui: null }, o));
const facts = (o) => Object.assign({
  push: false, headRef: "claude/x", title: "040 UI · Thing (YY)",
  changes: [{ status: "M", file: "board/app.js" }, { status: "A", file: "releases/040.json" }, { status: "A", file: "changelog/040.md" }],
  briefText: () => BRIEF("YY"), releaseText: () => rel({}), versionSrc: NULLV, baseMissing: false, baseProblem: null,
  mergedOnMain: (n) => ["025", "029"].includes(n), changelogAdded: (n) => n === "040"
}, o);
const judge = (o) => CR.judge(facts(o));
const plus = (...c) => facts({}).changes.concat(c);
ok(judge({}).ok, "a board change with releases/040.json (YY, matching the brief and title) and changelog/040.md passes", judge({}).lines.join(" | "));
ok(!judge({ changes: [{ status: "M", file: "board/app.js" }] }).ok, "board/ changed without a releases file: fails");
ok(!judge({ releaseText: () => rel({ bump: "none" }), briefText: () => BRIEF("none") }).ok, "board/ changed with bump none: fails (a board change is at least ZZ)");
ok(!judge({ changes: plus({ status: "A", file: "releases/041.json" }) }).ok, "two releases files: fails");
ok(!judge({ changes: plus({ status: "M", file: "releases/031.json" }) }).ok && !judge({ changes: plus({ status: "D", file: "releases/031.json" }) }).ok, "an edited or deleted releases file: fails (append-only)");
ok(!judge({ title: "041 UI · Thing (YY)" }).ok, "M1: releases/040.json on a pull request titled for brief 041: fails (the releases file is the identity)");
ok(!judge({ releaseText: () => rel({ bump: "ZZ" }) }).ok, "bump ZZ when the brief says YY: fails");
ok(!judge({ versionSrc: 'const VERSION = { game: "v3.21.00", build: 26, date: null, preview: null };' }).ok, "a number in board/version.js: fails");
ok(!judge({ changelogAdded: () => false }).ok, "no changelog/040.md: fails");
ok(!judge({ changes: [{ status: "A", file: "sims/lab/x.js" }], title: "Lab · a tool" }).ok, "M2: a tooling change with no releases file fails, whatever its title");
ok(!judge({ changes: [{ status: "M", file: ".github/workflows/lab.yml" }], title: "Docs · workflows" }).ok, "M2: a workflow change isn't docs, even titled Docs");
ok(judge({ changes: [{ status: "A", file: "sims/lab/x.js" }, { status: "A", file: "releases/040.json" }, { status: "A", file: "changelog/040.md" }], releaseText: () => rel({ bump: "none" }), briefText: () => BRIEF("none"), title: "040 Lab · Tool (none)" }).ok, "a tooling brief with bump none passes");
ok(judge({ changes: [{ status: "M", file: "briefs/040-x.md" }, { status: "A", file: "flags/040.md" }, { status: "M", file: "CLAUDE.md" }], title: "Docs · Flags tidy" }).ok, "a docs pull request passes");
ok(judge({ headRef: "claude/job-order", changes: [{ status: "A", file: "studies/queue/x.json" }, { status: "A", file: "results/v3.20.00/x/run.json" }], title: "Lab · screen x" }).ok, "M2: a job-order pull request (studies/ and results/ only) passes whatever its branch name");
ok(judge({ headRef: "lab/20261127-x", changes: [{ status: "M", file: "results/INDEX.md" }, { status: "M", file: "results/index.csv" }], title: "Lab results" }).ok, "a results pull request (lab/**) may change the index");
ok(!judge({ changes: plus({ status: "M", file: "results/INDEX.md" }) }).ok && !judge({ changes: plus({ status: "M", file: "results/index.csv" }) }).ok, "H1: a build pull request that changes results/INDEX.md or index.csv fails");
ok(!judge({ headRef: "lab/x", changes: [{ status: "M", file: "releases/031.json" }] }).ok, "a results pull request still can't edit a releases file");
ok(judge({ changes: plus({ status: "A", file: "releases/BASE.json" }), baseMissing: true }).ok, "Brief 031's own pull request may add releases/BASE.json (main has none)");
ok(!judge({ changes: plus({ status: "A", file: "releases/BASE.json" }), baseMissing: true, baseProblem: "its commit abc1234 is not on main" }).ok, "L7: a BASE.json whose commit isn't on main (or whose version differs) fails");
ok(!judge({ changes: plus({ status: "A", file: "releases/BASE.json" }) }).ok, "nobody else may add releases/BASE.json");
// F031-1: follow-ups
const fu = { changes: [{ status: "M", file: "board/ui.js" }, { status: "A", file: "releases/025-2.json" }, { status: "A", file: "changelog/025-2.md" }], title: "025-2 UI · Strength fix (ZZ)",
  releaseText: () => rel({ brief: "025-2", bump: "ZZ" }), briefText: () => null, changelogAdded: (n) => n === "025-2" };
ok(judge(fu).ok, "F031-1: a follow-up releases/025-2.json (its own bump, not compared with the brief) passes", judge(fu).lines.join(" | "));
ok(!judge(Object.assign({}, fu, { mergedOnMain: () => false })).ok, "F031-1: a follow-up to a brief that hasn't merged fails");
ok(!judge(Object.assign({}, fu, { title: "025 UI · Strength fix (ZZ)" })).ok, "F031-1: a follow-up's title must read 025-2");
ok(judge({ push: true, changes: [{ status: "A", file: "releases/040.json" }] }).ok && !judge({ push: true, versionSrc: 'game: "v1.00.00", build: 1, date: null' }).ok, "a push to main checks only append-only and the null version.js");
ok(CR.briefFromTitle("031 Lab · Version at merge (ZZ)") === "031" && CR.briefFromTitle("025-2 UI · Fix (ZZ)") === "025-2" && CR.briefFromTitle("v3.20.00 · 029 UI · Rematch") === "029" && CR.briefFromTitle("Docs · tidy") === null, "titles: new, follow-up and old shapes");

// ---------- the count: follow-ups ----------
const SVc = SV.count({ game: "v3.20.00", build: 25, commit: "x" }, [
  { sha: "a", date: "d", added: ["releases/025-2.json"], board: true },
  { sha: "b", date: "d", added: ["releases/040.json"], board: true },
  { sha: "c", date: "d", added: ["releases/025-2.json"], board: false }   // re-added after a revert: counted once
], (f) => ({ "releases/025-2.json": { brief: "025-2", bump: "ZZ", rules: null, brain: null, ui: null }, "releases/040.json": { brief: "040", bump: "YY", rules: null, brain: null, ui: null } })[f]);
ok(SVc.game === "v3.21.00" && SVc.build === 27 && SVc.history.filter((h) => h.brief === "025-2").length === 1, `F031-1: a follow-up counts its own bump, once (${SVc.history.map((h) => `${h.brief}=${h.game}`).join(" ")})`);

// ---------- waits-on ----------
const texts = { "040": BRIEF("YY", "028"), "028": BRIEF("ZZ", "none"), "050": BRIEF("YY", "051"), "051": BRIEF("YY", "052"), "052": BRIEF("YY", "050") };
const wv = (o) => WO.verdict(Object.assign({ id: "040", briefText: (n) => texts[n] ?? null, merged: (n) => ["027", "029"].includes(n), contained: (n) => ["027", "029"].includes(n) }, o));
ok(wv({}).state === "failure" && wv({}).description === "Waits on 028: not merged yet", `waiting on an unmerged brief fails with its reason: "${wv({}).description}"`);
ok(wv({ merged: (n) => n === "028" }).description === "028 merged: sync once to test on it", "M5 (ruled no): merged on main but not in the branch: sync once");
ok(wv({ merged: (n) => n === "028", contained: (n) => n === "028" }).state === "success", "green once the branch contains it");
ok(wv({ briefText: (n) => (n === "040" ? BRIEF("YY").replace(/\| Waits on.*\n/, "") : null) }).description === "Waits on not stated in the brief", "a missing Waits on row fails");
for (const bad of ["12", "TBD", "after 030", "028 and 029", "028;029"]) ok(/must be "none" or three-digit numbers/.test(wv({ briefText: (n) => (n === "040" ? BRIEF("YY", bad) : null) }).description), `M3: a malformed row fails ("${bad}")`);
ok(wv({ briefText: (n) => (n === "040" ? BRIEF("YY", "099") : null) }).description === "Waits on 099: no such brief", "M3: a number with no brief fails as no such brief");
ok(/loop: 050 → 051 → 052 → 050/.test(wv({ id: "050" }).description), `M3: a loop is named: "${wv({ id: "050" }).description}"`);
ok(wv({ briefText: (n) => (n === "040" ? BRIEF("YY", "none") : null) }).state === "success", "Waits on none passes");
ok(wv({ id: null }).state === "success", "no releases file (docs, results, job orders): waits on nothing");
ok(wv({ id: "025-2", merged: (n) => n === "025", contained: (n) => n === "025" }).state === "success" && wv({ id: "025-2", merged: () => false }).description === "Waits on 025: not merged yet", "F031-1: a follow-up waits on the brief it follows up");
ok(JSON.stringify(WO.parseWaitsOn("| Waits on | 029 |").list) === '["029"]' && JSON.stringify(WO.parseWaitsOn("| Waits on | **none** |").list) === "[]", "the template's exact format reads");

// ---------- real scratch histories: the release decision ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ffrel-"));
const g = (...a) => cp.execFileSync("git", a, { cwd: tmp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const write = (f, t) => { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.writeFileSync(path.join(tmp, f), t); };
g("init", "-q", "-b", "main"); g("config", "user.email", "t@example.com"); g("config", "user.name", "test"); g("config", "commit.gpgsign", "false");
write("README.md", "x\n"); g("add", "-A"); g("commit", "-qm", "before the baseline");
const pre = g("rev-parse", "HEAD");
for (const f of RF.KEYED.concat(["board/app.js", "board/version.js"])) write(f, `// ${f}\n`);
fs.mkdirSync(path.join(tmp, "tools"), { recursive: true });
fs.copyFileSync(path.join(__dirname, "stamp-version.js"), path.join(tmp, "tools", "stamp-version.js"));
write("board/version.js", NULLV + "\n");
g("add", "-A"); g("commit", "-qm", "base");
write("releases/BASE.json", JSON.stringify({ game: "v3.20.00", build: 25, date: "2026-11-27", commit: g("rev-parse", "HEAD"), merged: [] })); g("add", "-A"); g("commit", "-qm", "baseline file");
const main0 = g("rev-parse", "HEAD");
// B2: an engine change, then a push that touches only a test: the decision still says "release" (whole pull request).
g("checkout", "-qb", "b060"); write("board/engine.js", "// changed\n"); g("add", "-A"); g("commit", "-qm", "engine");
write("board/tests/test_x.js", "// t\n"); g("add", "-A"); g("commit", "-qm", "test only");
let d = RF.decidePr(tmp, "main", "HEAD", () => false);
ok(d.release && /game key changed/.test(d.why), `B2: a game-file push then a test-only push still needs a release run (${d.why})`);
ok(!RF.decidePr(tmp, "main", "HEAD", (k) => k === d.key).release, "B2: skipped only when a finished run with the same game key exists");
write("board/engine.js", "// changed again\n"); g("add", "-A"); g("commit", "-qm", "engine again");
ok(RF.decidePr(tmp, "main", "HEAD", (k) => k === d.key).release, "B2: a later game change has a new key, so the old run no longer counts");
g("checkout", "-qb", "b061", main0); write("board/app.js", "// screen\n"); g("add", "-A"); g("commit", "-qm", "screen");
ok(!RF.decidePr(tmp, "main", "HEAD", () => false).release, "a screen-only pull request needs no release run");
write("releases/061.json", JSON.stringify({ brief: "061", bump: "YY", rules: null, brain: "brain9", ui: null })); g("add", "-A"); g("commit", "-qm", "names a brain");
ok(RF.decidePr(tmp, "main", "HEAD", () => false).release, "H4: a releases file naming a brain (or rules) always gets a release run");
g("checkout", "-qb", "b062", main0); write("sims/lab/play.js", "// play changed\n"); g("add", "-A"); g("commit", "-qm", "lab play");
ok(RF.decidePr(tmp, "main", "HEAD", () => false).release, "B2: a change to the lab's play scripts (or rng.js) needs a release run");

// main's backlog: three merges in a row (game, screen, game) all get a run or a same-games line, none dropped.
g("checkout", "-q", "main");
const brief = (num, bump, file) => { g("checkout", "-qB", `m${num}`, "main"); write(`releases/${num}.json`, JSON.stringify({ brief: num, bump, rules: null, brain: null, ui: null })); write(file, `// ${num}\n`); g("add", "-A"); g("commit", "-qm", num); g("checkout", "-q", "main"); g("merge", "-q", "--no-ff", "-m", `Merge ${num}`, `m${num}`); };
brief("070", "YY", "board/engine.js"); brief("071", "ZZ", "board/app.js"); brief("072", "ZZ", "board/data.js");
// Review F1: a release run sitting in an open results pull request (lab/*) counts as filed.
{
  const none = path.join(tmp, "no-results-yet");
  const b1 = RF.backlog(tmp, none, "main");
  g("checkout", "-qb", "lab/20261128-x", "main");
  write(`results/${b1.play.version}/2026-11-28_release_x/run.json`, JSON.stringify({ id: "2026-11-28_release_x", kind: "release", version: b1.play.version, extra: { game_key: b1.play.key } }));
  g("add", "-A"); g("commit", "-qm", "Lab results (open pull request)"); g("checkout", "-q", "main");
  const again = RF.backlog(tmp, none, "main");
  const b2 = RF.backlog(tmp, none, "main", RF.pending(tmp, ["lab/20261128-x"], "main"));
  ok(again.play.version === b1.play.version && b2.play && b2.play.version !== b1.play.version,
    `F1: planned twice with nothing filed, ${b1.play.version} is planned both times; counting the open results pull request, the second plan moves on (${b2.play && b2.play.version})`);
  g("branch", "-D", "lab/20261128-x");
}
const results = path.join(tmp, "results"); fs.mkdirSync(results, { recursive: true });
const file = (version, key) => { const dir = path.join(results, version, `2026-11-28_release_${version}`); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify({ id: `2026-11-28_release_${version}`, kind: "release", version, extra: { game_key: key } })); };
const steps = [];
for (let i = 0; i < 4; i++) {
  const b = RF.backlog(tmp, results, "main");
  for (const s of b.same) { require("../sims/lab/index.js").addSame(results, SAME.lines([s], [], "2026-11-28")[0]); steps.push(`${s.version} same as ${s.to}`); }
  if (!b.play) break;
  file(b.play.version, b.play.key); steps.push(`${b.play.version} played${b.more ? " (more left: the lab starts again)" : ""}`);
}
ok(steps.join("; ") === "v3.21.00 played (more left: the lab starts again); v3.21.01 same as v3.21.00; v3.21.02 played", `three merges in a row: ${steps.join("; ")}`);
ok(RF.backlog(tmp, results, "main").play === null && RF.backlog(tmp, results, "main").same.length === 0, "and then nothing is missing");
// H2: a pull request's label counts to its merge-base, not main's tip.
g("checkout", "-qb", "b080", main0); write("releases/080.json", JSON.stringify({ brief: "080", bump: "ZZ", rules: null, brain: null, ui: null })); g("add", "-A"); g("commit", "-qm", "080");
ok(SV.prLabel(tmp, "main", "HEAD").game === "v3.20.00+080", `H2: a branch started before three merges is labelled from what it contains (${SV.prLabel(tmp, "main", "HEAD").game}, not v3.21.02+080)`);
g("merge", "-q", "--no-edit", "main");
ok(SV.prLabel(tmp, "main", "HEAD").game === "v3.21.02+080", "H2: after it brings in main, the label moves with it");
// A10: a branch older than the baseline keeps its own typed number.
g("checkout", "-qb", "old", pre); write("board/version.js", 'const VERSION = { game: "v3.20.00", build: 25, date: null, preview: null };\n'); g("add", "-A"); g("commit", "-qm", "old way");
ok(SV.prLabel(tmp, "main", "HEAD").game === "v3.20.00" && SV.prLabel(tmp, "main", "HEAD").old, "A10: a branch older than the baseline keeps its own typed number, no stamp error");
fs.rmSync(tmp, { recursive: true, force: true });

// ---------- the assembled changelog ----------
const OLD = "# Changelog\n\nintro\n\n## Game versions\n\n| Game version | Rule set (newest) | Default brain | UI | Build |\n|---|---|---|---|---|\n| v3.20.00 | v3.10 | Brain 8 | v7 | 25 |\n| v3.19.00 | v3.10 | Brain 8 | v6 | 24 |\n\n## v3.20.00 · Build 25 — Brief 029, Rematch (26 Nov 2026)\n\nold entry\n";
const hist = [{ game: "v3.20.01", build: 26, brief: "031", bump: "ZZ", rules: null, brain: null, ui: null, date: "2026-11-28" },
  { game: "v3.21.00", build: 27, brief: "040", bump: "YY", rules: "v3.11", brain: "Brain 9", ui: null, date: "2026-11-29" },
  { game: "v3.21.00", build: 27, brief: "042", bump: "none", rules: null, brain: null, ui: null, date: "2026-11-29" }];
const md = CL.assemble(hist, OLD, (n) => `## Brief ${n} · Thing ${n}\n\nWhat a player notices.\n`);
ok(md.indexOf("| v3.21.00 | v3.11 | Brain 9 | v7 | 27 |") > 0 && md.indexOf("| v3.20.01 | v3.10 | Brain 8 | v7 | 26 |") > md.indexOf("| v3.21.00 |"), "version table: new rows on top, carrying the rule set, brain and UI forward");
ok(md.indexOf("## v3.21.00 · Build 27 — Brief 040 · Thing 040 (2026-11-29)") > 0 && md.indexOf("## No game version · Build 27 — Brief 042") > 0, "entries numbered at publish; a none entry says No game version");
ok(md.indexOf("## v3.20.00 · Build 25 — Brief 029, Rematch (26 Nov 2026)\n\nold entry") > md.indexOf("Brief 031"), "old entries stay exactly as they are");
ok(/<table>/.test(CL.toHtml(md)) && !/<script/.test(CL.toHtml("## <script>x</script>")), "the HTML page is escaped");

// ---------- same games as ----------
ok(SAME.lines([{ version: "v3.21.01", to: "v3.21.00", path: "p" }], [], "2026-11-28")[0].answer === "same games as v3.21.00 (same game key)" && !SAME.lines([{ version: "v3.21.01", to: "v3.21.00" }], [{ kind: "same", version: "v3.21.01" }], "d").length, "same games as: one line per version, never twice");

// ---------- the generated test list and its runner ----------
ok(RT.missing().length === 0, `every test file declares how it runs, or is in the commented skip list (missing: ${RT.missing().join(", ") || "none"})`);
const quick = RT.select("quick").map((t) => t.name);
ok(["test_phone.js", "test_route.js", "test_v310.js (4)", "test_page.js", "test_rematch.js", "self_test.js", "invariants-check.js (30)", "board_check.js (10)", "test_v32.js (40)"].every((n) => quick.includes(n)), "the quick list covers all three folders and the extras (test_page.js ran nowhere before)");
ok(RT.header("// @test job=board quick=yes release=10 night=no browser args=a b").browser && RT.header("// @test job=board quick=yes release=10 night=no browser args=a b").args === "a b", "a test's @test line gives its counts, browser and arguments");
ok(RT.header("// @test special job=slow (run by the compare job and the release run's hashes job)").job === "slow" && RT.header("// @test special job=slow (the release job)").release === "no", "words in a @test line's note are not read as settings");
const fx = fs.mkdtempSync(path.join(os.tmpdir(), "ffrun-"));
fs.mkdirSync(path.join(fx, "board", "tests"), { recursive: true }); fs.mkdirSync(path.join(fx, "tools"), { recursive: true });
fs.writeFileSync(path.join(fx, "board", "tests", "test_good.js"), "// @test job=rules quick=yes release=yes night=no\nprocess.exit(0);\n");
fs.writeFileSync(path.join(fx, "board", "tests", "test_bad.js"), "// @test job=rules quick=yes release=yes night=no\nprocess.exit(1);\n");
const runIt = () => cp.spawnSync("node", [path.join(__dirname, "run-tests.js"), "--root", fx, "--level", "quick", "--job", "rules"], { encoding: "utf8" });
let r = runIt();
ok(r.status !== 0 && /1 failed: test_bad\.js/.test(r.stdout), "A7: one deliberately failing test turns the run red");
fs.writeFileSync(path.join(fx, "board", "tests", "test_bad.js"), "// @test job=rules quick=yes release=yes night=no\nprocess.exit(0);\n");
ok(runIt().status === 0, "and green once it passes");
fs.writeFileSync(path.join(fx, "board", "tests", "test_new.js"), "process.exit(0);\n");
r = runIt();
ok(r.status !== 0 && /no @test line/.test(r.stderr), "a new test file with no @test line (and not in the skip list) fails the run");
const check = () => cp.spawnSync("node", [path.join(__dirname, "run-tests.js"), "--root", fx, "--check"], { encoding: "utf8" });
fs.writeFileSync(path.join(fx, "board", "tests", "test_new.js"), "// @test job=rule quick=yes release=yes night=no\nprocess.exit(0);\n");
r = check();
ok(r.status !== 0 && /job "rule" is not one of/.test(r.stderr), "F2: --check fails a job name that isn't one of the five (\"rule\")");
fs.writeFileSync(path.join(fx, "board", "tests", "test_new.js"), "// @test job=rules quick=no release=no night=no\nprocess.exit(0);\n");
r = check();
ok(r.status !== 0 && /runs at no level/.test(r.stderr), "F2: --check fails a test that runs at no level");
fs.writeFileSync(path.join(fx, "board", "tests", "test_new.js"), "// @test job=rules quick=yes release=no night=no\nprocess.exit(0);\n");
ok(check().status === 0, "F2: and passes once the line is right");
fs.rmSync(fx, { recursive: true, force: true });

console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll tool checks passed.");
process.exit(fails ? 1 : 0);
