#!/usr/bin/env node
// @test job=rules quick=yes release=yes night=no
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

// Release checks (Brief 031, amendment 9): one machine per test group from the generated list, plus the hashes.
const labText = wf("lab.yml");
const mat = labText.slice(labText.indexOf("  release-checks:"), labText.indexOf("    steps:", labText.indexOf("  release-checks:")));
const jobs = [...mat.matchAll(/- \{ name: "([^"]+)", cmd: "([^"]+)" \}/g)].map((m) => m[2]);
const RT = require(path.join(ROOT, "tools", "run-tests.js"));
ok(JSON.stringify(jobs) === JSON.stringify(RT.JOBS.concat(["hashes"])), `release checks: one job per test group plus the hashes (${jobs.join(", ")})`);
ok(/run-tests\.js --level release --job "\$CMD"/.test(labText) && !fs.existsSync(path.join(__dirname, "release_quick.txt")) && !fs.existsSync(path.join(__dirname, "release_tests.js")), "release checks: run from the generated list; no hand-kept list left");
ok(/regress_engine\.js board 3 all/.test(labText), "release checks: the regression hashes cover every preset, the newest included");
ok(/matrix\.check\.cmd == 'board'[\s\S]{0,200}playwright/.test(labText), "release checks: the board group gets a headless browser");
ok(RT.missing().length === 0, `every test file declares how it runs, or is in the commented skip list (missing: ${RT.missing().join(", ") || "none"})`);
const names = ["test_rules.js", "test_v1.js", "test_v3.js", "test_v31.js", "test_v33.js", "test_v34.js", "test_reasons.js", "test_kitd.js (30)", "test_brain5.js (30)", "test_watch.js",
  "test_rng.js", "test_replay.js", "test_v32.js (400)", "test_invariants.js (100)", "test_phone.js", "test_rematch.js", "test_page.js", "self_test.js", "invariants-check.js (30)", "board_check.js (10)"];
const rel = RT.select("release").map((t) => t.name);
ok(names.every((n) => rel.includes(n)), `the release run covers the old 16 checks and the ones it missed (${names.filter((n) => !rel.includes(n)).join(", ") || "all there"})`);
const nightList = RT.select("night").map((t) => t.name);
ok(["test_brain5.js (30)", "test_brain9.js (30)", "test_v32.js (400)", "test_invariants.js (100)", "test_kitd.js (30)"].every((n) => nightList.includes(n)), "night checks: the brain tests come from the list (a new brain's test is picked up the day it is added)");
const nightText = wf("night-checks.yml");
ok(/run-tests\.js --level night/.test(nightText) && !/test_brain6\.js/.test(nightText), "night checks: no hand list of tests");

// Brief 031: the release decision and the stamp.
const labOn = labText.slice(labText.indexOf("\non:"), labText.indexOf("\npermissions:"));
ok(/paths: \["studies\/queue\/\*\*", "board\/\*\*", "sims\/lab\/\*\*"\]/.test(labOn) && /paths: \["board\/\*\*", "releases\/\*\*", "studies\/queue\/\*\*"\]/.test(labOn), "lab: planned on pull requests touching board/ or the lab, and on main when a version is added");
ok(/release_files\.js --plan --pr "\$PR"/.test(labText) && /release_files\.js --plan;/.test(labText), "lab: the release is decided by the game key (pull request: against its merge-base; main: the backlog)");
ok((labText.match(/stamp-version\.js --set "\$\{\{ needs\.plan\.outputs\.game \}\}"/g) || []).length >= 4, "lab: every job after the plan uses the plan's stamp (one stamp per version played)");
ok(/<!-- release-key: \$KEY -->/.test(labText) && /FAILED/.test(labText), "lab: a finished release run on a pull request posts its game key");
ok(/needs\.plan\.outputs\.more == 'true'[\s\S]{0,200}gh workflow run lab\.yml/.test(labText), "lab: if more versions miss a release run, the lab starts itself again");
ok(/same:\n    name: same games as a filed release/.test(labText), "lab: versions with the same games get a same-games line");
for (const [file, min] of [["lab.yml", 2], ["play-links.yml", 1], ["night-checks.yml", 1], ["checks.yml", 1]]) {
  const t = wf(file), stamps = (t.match(/tools\/stamp-version\.js/g) || []).length;
  ok(stamps >= min && /filter: blob:none/.test(t), `${file}: stamps the version after a blobless checkout (${stamps} stamp steps)`);
}
ok(/Still main's newest commit\?[\s\S]{0,400}skip=true/.test(wf("play-links.yml")), "play-links: an overtaken publish of main skips itself");
ok(/git reset -q -- results\/INDEX\.md results\/index\.csv/.test(fs.readFileSync(path.join(__dirname, "deliver.sh"), "utf8")), "deliver: a build's branch never gets the results index");

// checks.yml: the generated list, docs-only skips, the version check, the alarm.
const chk = wf("checks.yml");
for (const job of ["tests", "compare"]) ok(jobIf(chk, job) === "needs.changes.outputs.docs_only != 'true'", `checks: ${job} is skipped on a docs-only pull request`);
ok(/job: \[rules, slow, brains, invariants, board\]/.test(chk) && /run-tests\.js --level quick --job \$\{\{ matrix\.job \}\}/.test(chk) && !/test_v32\.js/.test(chk) && !/\bR: "/.test(chk), "checks: tests come from the generated list; no step or R: entry per test");
ok(/needs: \[changes, tests, compare\]/.test(chk) && /Docs only: nothing to check\./.test(chk), "checks: the required job still runs and passes on a docs-only pull request");
ok(/tools\/check-release\.js/.test(chk) && !fs.existsSync(path.join(ROOT, ".github", "check-build-number.sh")), "checks: the version check replaced check-build-number.sh");
ok(/continue-on-error: \$\{\{ needs\.changes\.outputs\.screen_only != 'true' \}\}/.test(chk), "checks: replay hashes must match for a screen-only build");
ok(/alarm:[\s\S]*Main broken/.test(chk) && /issues: write/.test(chk), "checks: a failing run on main opens the Main broken issue (and closes it when main passes)");

// waits-on: one script, every open pull request, on pull request events, every push to main and hourly.
const wo = wf("waits-on.yml");
ok(/push:\n    branches: \[main\]/.test(wo) && /schedule:/.test(wo) && /tools\/waits-on\.js --all/.test(wo) && /statuses: write/.test(wo), "waits-on: one script sets it on every open pull request, on events, pushes to main and hourly");
ok(/types: \[opened, synchronize, reopened, edited, ready_for_review\]/.test(wo), "waits-on: set on each push to a pull request and when its title changes");

console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll workflow checks passed.");
process.exit(fails ? 1 : 0);
