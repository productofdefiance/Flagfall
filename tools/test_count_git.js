#!/usr/bin/env node
// @test job=rules quick=yes release=yes night=no
/* Brief 032 (L4, L2, L3, M10): the real counting module on a real scratch git history, no fixture list of pretend
 * commits. The history: a baseline, Brief 031's change-over, one build merged as a merge commit, one squash-merged, one
 * docs-only commit, an NNN-2 follow-up, an X bump, a revert pair made with GitHub's Revert button (which deletes the
 * releases file; the check refuses it, but if one is merged anyway the count must not stop or bump twice), and a revert
 * done the right way (keep the file, add NNN-2). Every version and build number is checked, then the stamp's command
 * line: refused outside a workflow without --local, and the brief map it writes.
 * Run: node tools/test_count_git.js */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const SV = require("./stamp-version.js");
let fails = 0;
const ok = (c, m, extra) => { console.log(`${c ? "PASS" : "FAIL"}  ${m}`); if (!c) { fails++; if (extra) console.log("      " + extra); } };

const NULLV = "(function (root) {\n  const VERSION = { game: null, build: null, date: null, preview: null, briefs: null };\n  if (typeof module !== \"undefined\") module.exports = VERSION;\n})(this);\n";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ffcount-"));
const g = (...a) => cp.execFileSync("git", a, { cwd: tmp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const write = (f, t) => { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.writeFileSync(path.join(tmp, f), t); };
const rel = (id, bump) => JSON.stringify({ brief: id, bump, rules: null, brain: null, ui: null });
g("init", "-q", "-b", "main"); g("config", "user.email", "t@example.com"); g("config", "user.name", "test"); g("config", "commit.gpgsign", "false");

// Baseline: main as it was before the change-over.
write("board/version.js", NULLV); write("board/engine.js", "// engine\n"); write("board/app.js", "// app\n"); write("README.md", "x\n");
g("add", "-A"); g("commit", "-qm", "baseline");
const base = g("rev-parse", "HEAD");
const shas = {};
/** A build on its own branch from main, merged as a merge commit (or squashed). Returns the commit main ends on. */
function build(id, bump, files, how) {
  g("checkout", "-qB", `b${id}`, "main");
  if (id === "031") write("releases/BASE.json", JSON.stringify({ game: "v3.20.00", build: 25, date: "2026-11-27", commit: base, merged: ["029"] }));
  write(`releases/${id}.json`, rel(id, bump)); write(`changelog/${id}.md`, `## Brief ${id} · test\n`);
  for (const f of files) write(f, `// ${id}\n`);
  g("add", "-A"); g("commit", "-qm", `brief ${id}`);
  g("checkout", "-q", "main");
  if (how === "squash") { g("merge", "-q", "--squash", `b${id}`); g("commit", "-qm", `brief ${id} (squash)`); }
  else g("merge", "-q", "--no-ff", "-m", `Merge ${id}`, `b${id}`);
  return (shas[id] = g("rev-parse", "HEAD"));
}
const count = () => SV.countAt(tmp, "HEAD");
const step = (label, game, buildNo) => { const c = count(); ok(c.game === game && c.build === buildNo, `${label}: ${c.game} · Build ${c.build} (expected ${game} · Build ${buildNo})`); return c; };

build("031", "ZZ", ["board/app.js"]);                                      step("031, the change-over (merge commit, ZZ)", "v3.20.01", 26);
build("050", "YY", ["board/app.js"]);                                        step("050 merged as a merge commit (YY)", "v3.21.00", 27);
build("051", "ZZ", ["board/engine.js"], "squash");                           step("051 squash-merged (ZZ)", "v3.21.01", 28);
write("briefs/060-x.md", "# Brief 060\n"); write("CLAUDE.md", "docs\n"); g("add", "-A"); g("commit", "-qm", "Docs · tidy");
                                                                             step("a docs-only commit: nothing moves", "v3.21.01", 28);
build("050-2", "ZZ", ["board/app.js"]);                                      step("050-2, a follow-up to 050 (ZZ)", "v3.21.02", 29);
build("052", "X", ["board/engine.js"]);                                      step("052, a big new system (X)", "v4.00.00", 30);

// GitHub's Revert button on 052: deletes releases/052.json and undoes the board change. The check refuses this pull
// request; if it is merged anyway, the count still reads 052's file from the commit that added it and keeps going.
g("revert", "--no-edit", "-m", "1", shas["052"]);
ok(!fs.existsSync(path.join(tmp, "releases", "052.json")), "the Revert button's commit deletes releases/052.json");
step("a revert that deleted the releases file: no new version, the board change adds a build", "v4.00.00", 31);
// Revert the revert: releases/052.json comes back. Each releases file counts once, so it can't bump twice.
g("revert", "--no-edit", "HEAD");
ok(fs.existsSync(path.join(tmp, "releases", "052.json")), "reverting the revert brings releases/052.json back");
step("the revert of the revert: still v4.00.00, never v5.00.00", "v4.00.00", 32);

// The right way: 053 merges, then its revert keeps releases/053.json and adds releases/053-2.json.
build("053", "ZZ", ["board/app.js"]);                                        step("053 merged (ZZ)", "v4.00.01", 33);
g("checkout", "-qB", "r053", "main");
write("board/app.js", "// 052\n"); write("releases/053-2.json", rel("053-2", "ZZ")); write("changelog/053-2.md", "## Brief 053-2 · Revert\n");
g("add", "-A"); g("commit", "-qm", "Revert 053"); g("checkout", "-q", "main"); g("merge", "-q", "--no-ff", "-m", "Merge 053-2", "r053");
const c = step("053's revert done the right way (releases/053-2.json, ZZ)", "v4.00.02", 34);

const got = c.history.filter((h) => h.brief).map((h) => `${h.brief}=${h.game}·${h.build}`).join(" ");
const want = "031=v3.20.01·26 050=v3.21.00·27 051=v3.21.01·28 050-2=v3.21.02·29 052=v4.00.00·30 053=v4.00.01·33 053-2=v4.00.02·34";
ok(got === want, `every merged brief keeps the number it got, each listed once: ${got}`, `expected ${want}`);
const map = SV.briefMap(c.history);
ok(map["052"] === "v4.00.00" && map["050-2"] === "v3.21.02" && Object.keys(map).length === 7, `the brief map the board reads: ${JSON.stringify(map)}`);

// ---- The stamp's command line (L3) ----
const env = Object.assign({}, process.env); delete env.GITHUB_ACTIONS;
const stampCli = (args, e) => cp.spawnSync("node", [path.join(__dirname, "stamp-version.js"), "--repo", tmp].concat(args), { encoding: "utf8", env: e || env });
let r = stampCli([]);
ok(r.status !== 0 && /needs --local/.test(r.stderr) && fs.readFileSync(path.join(tmp, "board", "version.js"), "utf8") === NULLV, "outside a GitHub workflow, the stamp refuses without --local and writes nothing");
r = stampCli(["--print"]);
ok(r.status === 0 && /"game":"v4\.00\.02"/.test(r.stdout), "--print writes nothing, so it needs no --local");
r = stampCli(["--local"]);
const stamped = fs.readFileSync(path.join(tmp, "board", "version.js"), "utf8");
ok(r.status === 0 && /don't commit board\/version\.js/.test(r.stdout), "with --local it stamps and reminds you not to commit board/version.js");
ok(/game: "v4\.00\.02", build: 34/.test(stamped) && /briefs: \{"031":"v3\.20\.01",.*"053-2":"v4\.00\.02"\}/.test(stamped), "the stamp writes the version, build and brief map");
g("checkout", "board/version.js");
r = stampCli([], Object.assign({}, env, { GITHUB_ACTIONS: "true" }));
ok(r.status === 0 && !/Reminder/.test(r.stdout), "inside a GitHub workflow it stamps with no flag and no reminder");
g("checkout", "board/version.js");

if (!process.env.KEEP) fs.rmSync(tmp, { recursive: true, force: true }); else console.log(tmp);
console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll scratch-history counting checks passed.");
process.exit(fails ? 1 : 0);
