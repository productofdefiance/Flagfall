#!/usr/bin/env node
/* Brief 027: the workflow conditions it changed, tried on sample events with no network.
 * Each `if:` is read from the workflow file and evaluated by a small stand-in for GitHub's expression language
 * (enough for ==, !=, &&, ||, !, startsWith, contains and labels.*.name), so the test checks the real text.
 * Run: node sims/lab/test_workflows.js */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const wf = (name) => fs.readFileSync(path.join(ROOT, ".github", "workflows", name), "utf8");
let fails = 0;
const ok = (cond, name) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); if (!cond) fails++; };

// The `if:` of one job (indent 2 under jobs:, its own `if:` at indent 4).
function jobIf(text, job) {
  const lines = text.split("\n");
  let i = lines.indexOf(`  ${job}:`);
  if (i < 0) throw new Error(`no job ${job}`);
  for (i++; i < lines.length && !/^  \S/.test(lines[i]); i++) {
    const m = lines[i].match(/^    if: (.*)$/);
    if (m) return m[1].replace(/^\$\{\{\s*|\s*\}\}$/g, "");
  }
  return "true";
}

// GitHub expression → JavaScript, evaluated against a context.
function evaluate(expr, ctx) {
  const get = (p) => {
    let v = ctx, spread = false;
    for (const k of p.split(".")) {
      if (k === "*") { v = Array.isArray(v) ? v : []; spread = true; continue; }
      if (spread) v = v.map((x) => (x == null ? undefined : x[k]));
      else v = v == null ? undefined : v[k];
    }
    return v == null ? "" : v;
  };
  const startsWith = (a, b) => String(a).toLowerCase().startsWith(String(b).toLowerCase());
  const contains = (a, b) => (Array.isArray(a) ? a.includes(b) : String(a).toLowerCase().includes(String(b).toLowerCase()));
  const js = expr.replace(/'[^']*'|[A-Za-z_][\w-]*(?:\.(?:\*|[\w-]+))+/g, (t) => (t[0] === "'" ? JSON.stringify(t.slice(1, -1)) : `get(${JSON.stringify(t)})`))
    .replace(/==/g, "===").replace(/!===/g, "!==");
  return Boolean(new Function("get", "startsWith", "contains", `return (${js});`)(get, startsWith, contains));
}

const pr = (head, labels = []) => ({ github: { event_name: "pull_request", repository: "o/r", event: { pull_request: { head: { ref: head, repo: { full_name: "o/r" } }, labels: labels.map((name) => ({ name })) } } } });
const ev = (event_name, extra = {}) => ({ github: { event_name, event: extra } });
const nightRun = ev("workflow_run", { workflow_run: { event: "schedule", head_branch: "main" } });
const results = pr("lab/20261122-030000-123");
const build = pr("claude/trusting-davinci-lufnu6");

// 3. play-links: no play link for a results-only pull request; build pull requests and main unchanged.
const play = jobIf(wf("play-links.yml"), "publish");
ok(!evaluate(play, results), "play-links: skipped on a results pull request (lab/**)");
ok(evaluate(play, build), "play-links: still runs on a build pull request");
ok(evaluate(play, ev("push")), "play-links: still runs on a push to main");
const playText = wf("play-links.yml");
ok(!/^concurrency:/m.test(playText) && /^    concurrency:\n      group: play-links/m.test(playText), "play-links: the queue is on the job, so a skipped results run can't cancel a waiting publish");
ok(/push:\n    branches: \[main\]\n    paths: \["board\/\*\*", "releases\/\*\*", "changelog\/\*\*"\]/.test(playText), "play-links: main republishes only when a push changes board/, releases/ or changelog/ (a merged results pull request doesn't; Brief 031: a new version does)");

// 3. night-checks: never on a results pull request, even labelled; labelled build pull requests and nights unchanged.
const night = jobIf(wf("night-checks.yml"), "full");
ok(!evaluate(night, results), "night-checks: skipped on a results pull request");
ok(!evaluate(night, pr("lab/x", ["full checks"])), "night-checks: skipped on a results pull request even with the label");
ok(evaluate(night, pr("claude/x", ["full checks"])), "night-checks: still runs on a build pull request with the label");
ok(!evaluate(night, build), "night-checks: still skipped on a build pull request without the label");
ok(evaluate(night, ev("schedule")) && evaluate(night, ev("workflow_dispatch")), "night-checks: still runs at night and by hand");

// 3. lab: no run on a results pull request; build pull requests, the nightly chain, hand starts and pushes unchanged.
const lab = jobIf(wf("lab.yml"), "plan");
ok(!evaluate(lab, results), "lab: skipped on a results pull request");
ok(evaluate(lab, build), "lab: still plans on a build pull request");
ok(evaluate(lab, nightRun), "lab: still runs after main's night checks");
ok(!evaluate(lab, ev("workflow_run", { workflow_run: { event: "pull_request", head_branch: "claude/x" } })), "lab: still ignores a pull request's night checks");
ok(evaluate(lab, ev("workflow_dispatch")) && evaluate(lab, ev("push")), "lab: still runs by hand and on a push to main");

// 3. checks and the status board still run on a results pull request.
ok(/^  pull_request:\s*$/m.test(wf("checks.yml")) && jobIf(wf("checks.yml"), "checks") === "always()", "checks: still runs on every pull request, results ones included (required)");
const sb = jobIf(wf("status-board.yml"), "build");
ok(evaluate(sb, results) && evaluate(sb, build), "status board: still runs on results and build pull requests");

// 4. status board: no workflow_run start; hourly, pull requests, pushes and by hand stay.
const sbText = wf("status-board.yml");
const on = sbText.slice(sbText.indexOf("\non:"), sbText.indexOf("\npermissions:"));
ok(!/workflow_run/.test(on), "status board: no longer starts when checks / night-checks / lab finish");
ok(/schedule:\n\s+- cron: "41 \* \* \* \*"/.test(on) && /pull_request:/.test(on) && /push:/.test(on) && /workflow_dispatch:/.test(on), "status board: hourly, pull request, push and by-hand starts stay");

// 1. release checks: 5 jobs, and every check of the 16-job runs still reports by name.
const labText = wf("lab.yml");
const mat = labText.slice(labText.indexOf("  release-checks:"), labText.indexOf("    steps:", labText.indexOf("  release-checks:")));
const jobs = [...mat.matchAll(/- \{ name: "([^"]+)", cmd: "/g)].map((m) => m[1]);
ok(jobs.length === 5, `release checks: 5 jobs (was 16): ${jobs.join(", ")}`);
// Brief 031: the quick list is built from board/tests/test_*.js (release_tests.js), not a hand-kept file.
const RT = require("./release_tests.js");
const quick = RT.quick().map((q) => [q.name, q.cmd]);
const before = ["test_rules.js", "test_v1.js", "test_v3.js", "test_v31.js", "test_v32.js (400 + 400)", "test_v33.js", "test_v34.js", "test_reasons.js", "test_kitd.js (30)",
  "test_brain5.js (30)", "test_watch.js", "test_rng.js", "test_invariants.js (100)", "test_replay.js", "other brain tests (30)", "regression hashes"];
const reported = [...quick.map(([n]) => n), ...jobs.filter((n) => n !== "quick checks")];
ok(before.every((n) => reported.includes(n)), "release checks: all 16 checks of the runs before still report pass or fail under the same names");
ok(RT.missing().length === 0, `release checks (Brief 031): every test file is in the release run or the commented skip list (missing: ${RT.missing().join(", ") || "none"})`);
ok(quick.every(([n, c]) => n && /^node tests\/test_\w+\.js/.test(c || "")), "release checks: every quick line is name|command");
ok(quick.every(([, c]) => fs.existsSync(path.join(ROOT, "board", c.split(" ")[1]))), "release checks: every quick check's test file exists");
ok(!fs.existsSync(path.join(__dirname, "release_quick.txt")) && /release_tests\.js --quick/.test(labText), "release checks: the hand-kept list is gone; lab.yml builds it from the test folder");
ok(/regress_engine\.js \. 3 all/.test(labText), "release checks: the regression hashes cover every preset, the newest included");
ok(/matrix\.check\.cmd == 'quick'[\s\S]{0,200}playwright/.test(labText), "release checks: the quick job installs a headless browser for the four browser checks");

// Brief 031: the release run starts on a game change, not a version change; every job is stamped.
const labOn = labText.slice(labText.indexOf("\non:"), labText.indexOf("\npermissions:"));
ok(/paths: \["studies\/queue\/\*\*", "board\/\*\*", "sims\/lab\/\*\*"\]/.test(labOn) && !/board\/version\.js/.test(labOn), "lab: a pull request touching board/ is planned (not version.js, which never changes now)");
ok(/--release-base \$REL_BASE/.test(labText), "lab: the plan decides the release from what changed (release_files.js)");
for (const [file, min] of [["lab.yml", 6], ["play-links.yml", 1], ["night-checks.yml", 1], ["checks.yml", 1]]) {
  const t = wf(file), stamps = (t.match(/tools\/stamp-version\.js/g) || []).length;
  ok(stamps >= min && /filter: blob:none/.test(t), `${file}: stamps the version straight after a blobless checkout (${stamps} stamp steps)`);
}
ok(/same:\n    name: same games as the last release/.test(labText), "lab: a version with no release run gets a same-games line on main");

// Brief 031: docs-only pull requests skip the game jobs; checks still reports.
const chk = wf("checks.yml");
for (const job of ["rules", "invariants", "redteam", "board-check", "compare"]) ok(jobIf(chk, job) === "needs.changes.outputs.docs_only != 'true'", `checks: ${job} is skipped on a docs-only pull request`);
ok(/needs: \[changes, rules, invariants, redteam, board-check, compare\]/.test(chk) && /Docs only: nothing to check\./.test(chk), "checks: the required job still runs and passes on a docs-only pull request");
ok(/tools\/check-release\.js/.test(chk) && !fs.existsSync(path.join(ROOT, ".github", "check-build-number.sh")), "checks: the version check replaced check-build-number.sh");
ok(/continue-on-error: \$\{\{ needs\.changes\.outputs\.screen_only != 'true' \}\}/.test(chk), "checks: replay hashes must match for a screen-only build");

// Brief 031: waits-on sets a commit status on every open pull request when main moves.
const wo = wf("waits-on.yml");
ok(/push:\n    branches: \[main\]/.test(wo) && /gh pr list/.test(wo) && /context=waits-on/.test(wo) && /statuses: write/.test(wo), "waits-on: every push to main sets the status again on every open pull request");
ok(/types: \[opened, synchronize, reopened, edited, ready_for_review\]/.test(wo), "waits-on: set on each push to the pull request and when its title changes");

console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll workflow checks passed.");
process.exit(fails ? 1 : 0);
