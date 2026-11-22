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
ok(/push:\n    branches: \[main\]\n    paths: \["board\/\*\*"\]/.test(playText), "play-links: main republishes only when a push changes board/ (a merged results pull request doesn't)");

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
const quick = fs.readFileSync(path.join(__dirname, "release_quick.txt"), "utf8").split("\n").filter(Boolean).map((l) => l.split("|"));
const before = ["test_rules.js", "test_v1.js", "test_v3.js", "test_v31.js", "test_v32.js (400 + 400)", "test_v33.js", "test_v34.js", "test_reasons.js", "test_kitd.js (30)",
  "test_brain5.js (30)", "test_watch.js", "test_rng.js", "test_invariants.js (100)", "test_replay.js", "other brain tests (30)", "regression hashes"];
const reported = [...quick.map(([n]) => n), ...jobs.filter((n) => n !== "quick checks")];
ok(before.every((n) => reported.includes(n)) && reported.length === before.length, "release checks: all 16 checks still report pass or fail under the same names");
ok(quick.every(([n, c]) => n && /^node tests\/test_\w+\.js/.test(c || "")), "release checks: every quick line is name|command");
ok(quick.every(([, c]) => fs.existsSync(path.join(ROOT, "board", c.split(" ")[1]))), "release checks: every quick check's test file exists");

console.log(fails ? `\n${fails} check(s) FAILED` : "\nAll workflow checks passed.");
process.exit(fails ? 1 : 0);
