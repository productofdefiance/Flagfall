#!/usr/bin/env node
/* The one test list (Brief 031, amendments 3 and 9): generated from the test files themselves, used by `checks`, the
 * release run and night checks alike. No workflow keeps a step or a name per test, so two builds that add tests never
 * collide in a shared file.
 *
 * Each test declares how it runs in one line near its top (A7):
 *   // @test job=<rules|slow|brains|invariants|board> quick=<n|yes|no> release=<n|yes|no> night=<n|yes|no> [browser] [args=<extra arguments>]
 * A number is the game count passed as the first argument; `yes` runs it with no count; `no` leaves it out of that
 * level. `browser` means it needs a headless browser (Playwright). `special` marks a script run by its own job (the
 * replay hashes). Tests in board/tests/ run from board/ (`node tests/<file>`); the others from the repository's top.
 *
 *   node tools/run-tests.js --level quick|release|night [--job rules,slow] [--out <folder>]   run them
 *   node tools/run-tests.js --list [--level …] [--job …]                                       print the list
 *   node tools/run-tests.js --check                     fail if a test file has no @test line (and isn't in SKIP),
 *                                                       names a job that isn't one of the five, or runs at no level
 * A run fails if any test fails, if no test matches, or if the list itself fails --check (every run checks it first).
 * With --out, each test writes <out>/check-<name>.txt holding "name=success|failure" (the lab's tables/checks.csv). */
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");

const ROOT = path.join(__dirname, "..");
// Where tests live: test_*.js in these folders, plus a few files with other names.
const FOLDERS = ["board/tests", "sims/lab", "sims/status", "tools"];
const EXTRA = ["sims/lab/self_test.js", "sims/lab/board_check.js", ".github/invariants-check.js", "board/tests/regress_engine.js"];
// Test files deliberately left out of every level, each with its reason. Keep this short.
const SKIP = {
  // (none)
};
const JOBS = ["rules", "slow", "brains", "invariants", "board"];

function discover(root) {
  root = root || ROOT;
  const out = [];
  for (const d of FOLDERS) {
    const dir = path.join(root, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) if (/^test_.*\.js$/.test(f) && fs.statSync(path.join(dir, f)).isFile()) out.push(`${d}/${f}`);
  }
  for (const f of EXTRA) if (fs.existsSync(path.join(root, f))) out.push(f);
  return out;
}
/** The @test line of a file (first 15 lines), parsed; null when it has none. */
function header(text) {
  const line = String(text).split("\n").slice(0, 15).find((l) => /^\s*(\/\/|\*|\/\*)\s*@test\b/.test(l));
  if (!line) return null;
  const body = line.replace(/^\s*(\/\/|\/\*|\*)\s*@test\b/, "").replace(/\*\/\s*$/, "").trim();
  const h = { job: "rules", quick: "no", release: "no", night: "no", browser: false, special: false, args: "" };
  const m = /\bargs=(.*)$/.exec(body);
  if (m) h.args = m[1].trim();
  for (const tok of body.replace(/\bargs=.*$/, "").split(/\s+/).filter(Boolean)) {
    if (tok === "browser") h.browser = true;
    else if (tok === "special") h.special = true;
    else if (/^\w+=\S+$/.test(tok)) { const [k, v] = tok.split("="); if (k in h) h[k] = v; }   // other words are notes
  }
  return h;
}
/** Every test with its settings: [{ file, name, h }]; files with no @test line are returned with h = null. */
function list(root) {
  root = root || ROOT;
  return discover(root).map((file) => ({ file, h: header(fs.readFileSync(path.join(root, file), "utf8")) }));
}
/** The tests a level and job selection runs, with the command for each. */
function select(level, jobs, root) {
  root = root || ROOT;
  return list(root).filter((t) => t.h && !t.h.special && t.h[level] && t.h[level] !== "no" && (!jobs || jobs.includes(t.h.job))).map((t) => {
    const n = t.h[level], count = /^\d+$/.test(n) ? n : "";
    const inBoard = t.file.startsWith("board/tests/");
    const argv = [inBoard ? `tests/${path.basename(t.file)}` : t.file].concat(count ? [count] : [], t.h.args ? t.h.args.split(/\s+/) : []);
    return { file: t.file, name: path.basename(t.file) + (count ? ` (${count})` : ""), cwd: path.join(root, inBoard ? "board" : ""), argv, browser: t.h.browser, job: t.h.job };
  });
}
/** Test files with no @test line that aren't in SKIP (should be none). */
function missing(root) { return list(root).filter((t) => !t.h && !(t.file in SKIP)).map((t) => t.file); }
/** Every problem with the list (review F2): no @test line, a job that isn't one of the five, or a test that runs at
    no level (quick, release and night all "no"; a `special` script is run by its own job and is exempt). */
function problems(root) {
  const out = missing(root).map((f) => `${f}: no @test line and not in SKIP`);
  for (const t of list(root)) {
    if (!t.h) continue;
    if (!JOBS.includes(t.h.job)) out.push(`${t.file}: job "${t.h.job}" is not one of ${JOBS.join(", ")}`);
    if (!t.h.special && ["quick", "release", "night"].every((l) => !t.h[l] || t.h[l] === "no")) out.push(`${t.file}: runs at no level (quick, release and night are all "no")`);
    for (const l of ["quick", "release", "night"]) if (!/^(\d+|yes|no)$/.test(String(t.h[l]))) out.push(`${t.file}: ${l}=${t.h[l]} is not a number, yes or no`);
  }
  return out;
}

module.exports = { discover, header, list, select, missing, problems, SKIP, JOBS };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[++i] : true;
  const root = path.resolve(opt.root || ROOT);
  if (opt.check) {
    const m = problems(root);
    if (m.length) { console.error(`The test list has problems:\n- ${m.join("\n- ")}`); process.exit(1); }
    console.log(`All ${discover(root).length} test files declare how they run (${Object.keys(SKIP).length} skipped).`);
    process.exit(0);
  }
  const level = opt.level || "quick", jobs = typeof opt.job === "string" ? opt.job.split(",") : null;
  const tests = select(level, jobs, root);
  if (opt.list) { for (const t of tests) console.log(`${t.name}\t${t.job}${t.browser ? " browser" : ""}\t${t.argv.join(" ")}`); process.exit(0); }
  const m = problems(root);
  if (m.length) { console.error(`The test list has problems:\n- ${m.join("\n- ")}`); process.exit(1); }
  if (opt.out) fs.mkdirSync(path.resolve(opt.out), { recursive: true });
  const results = [];
  for (const t of tests) {
    if (process.env.GITHUB_ACTIONS) console.log(`::group::${t.name}`); else console.log(`--- ${t.name}`);
    const r = cp.spawnSync("node", t.argv, { cwd: t.cwd, stdio: "inherit" });
    const ok = r.status === 0;
    if (process.env.GITHUB_ACTIONS) console.log("::endgroup::");
    console.log(`${ok ? "pass" : "FAIL"}  ${t.name}`);
    results.push({ name: t.name, ok });
    if (opt.out) fs.writeFileSync(path.join(path.resolve(opt.out), `check-${t.name.replace(/[^\w]+/g, "_")}.txt`), `${t.name}=${ok ? "success" : "failure"}\n`);
  }
  const failed = results.filter((r) => !r.ok);
  const summary = [`## Tests: ${level}${jobs ? ` (${jobs.join(", ")})` : ""}`, "", "| Check | Result |", "| --- | --- |"]
    .concat(results.map((r) => `| ${r.name} | ${r.ok ? "pass" : "**FAIL**"} |`), "", `${results.length} of ${tests.length} ran, ${failed.length} failed.`).join("\n") + "\n";
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  console.log(`\n${results.length} of ${tests.length} tests ran, ${failed.length} failed${failed.length ? `: ${failed.map((r) => r.name).join(", ")}` : ""}.`);
  // Every selected test gets a result (a runner crash exits non-zero by itself), so no separate count guard.
  if (!tests.length) console.log("FAIL: no test matches this level and job.");
  process.exit(failed.length || !tests.length ? 1 : 0);
}
