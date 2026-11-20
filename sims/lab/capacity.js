#!/usr/bin/env node
/* The lab's share of GitHub's machines (Brief 024).
   decide(...) is pure (the test feeds it fixtures): what started the run, how big it is, how busy the repository is
   and the time in US Eastern give a share of N (sims/lab/capacity.json) and one plain line saying why.
   gatherQueue(api) reads how busy the repository is through GitHub's API; the status board uses it for its Queue line.
   CLI (in lab.yml):
     node sims/lab/capacity.js --event <event> --orders "<paths>" --parts <n> [--release true] [--rush true] [--labels "<a,b>"] [--wave 1|2]
   writes max_parallel, release_parallel, waves, matrix_w1, matrix_w2, has_w2, line, mode, checks_waiting to $GITHUB_OUTPUT
   and the line to $GITHUB_STEP_SUMMARY. Without a token (or if the API fails) it counts the repository as busy. */
"use strict";
const fs = require("fs"), path = require("path");
const SETTINGS = JSON.parse(fs.readFileSync(path.join(__dirname, "capacity.json"), "utf8"));

/** The hour (0-23) in US Eastern, daylight saving included. */
function etHour(now) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date(now)));
}
function isNight(now, S) {
  const h = etHour(now);
  return S.nightStartHourET > S.nightEndHourET ? (h >= S.nightStartHourET || h < S.nightEndHourET) : (h >= S.nightStartHourET && h < S.nightEndHourET);
}

/**
 * o = { event, now, rush, labels: [..], biggestMatchup (games), busy: { checksWaiting, othersRunning, labRuns, recentPushes } | null,
 *       parts, release }
 * busy null means "couldn't tell": counted as busy (the safe side in the daytime).
 */
function decide(o, S) {
  S = Object.assign({}, SETTINGS, S || {});
  const N = S.N;
  const b = o.busy;
  const isBusy = !b || b.checksWaiting > 0 || b.othersRunning > 0 || b.labRuns > 0 || b.recentPushes > 0;
  const big = (o.biggestMatchup || 0) >= S.bigGamesPerMatchup;
  const rush = !!o.rush || (o.labels || []).includes(S.rushLabel);
  const nightChain = o.event === "workflow_run";
  let share, mode, why;
  const busyWhy = !b ? "couldn't read the queue" : [
    b.checksWaiting ? `${b.checksWaiting} ${b.checksWaiting === 1 ? "check" : "checks"} waiting` : null,
    b.othersRunning ? `${b.othersRunning} other ${b.othersRunning === 1 ? "job" : "jobs"} running` : null,
    b.labRuns ? `${b.labRuns} other lab ${b.labRuns === 1 ? "run" : "runs"}` : null,
    b.recentPushes ? `${b.recentPushes} pull ${b.recentPushes === 1 ? "request" : "requests"} pushed in ${S.recentPushMinutes} min` : null
  ].filter(Boolean).join(", ");
  if (rush) { share = N; mode = "rush"; why = "Rush"; }
  else if (nightChain || isNight(o.now, S)) { share = N; mode = "night"; why = nightChain ? "Night (the nightly chain)" : "Night"; }
  else if (!isBusy) { share = N - S.reserveForChecks; mode = "quiet"; why = "Day, quiet"; }
  else if (big) { share = Math.floor(N * S.bigBusyShare); mode = "busy-big"; why = `Day, busy, big run (${busyWhy})`; }
  else { share = Math.floor(N * S.busyShare); mode = "busy"; why = `Day, busy (${busyWhy})`; }
  share = Math.max(S.minimum, Math.min(N, share));
  // Big daytime runs play in waves, so the next wave's share is chosen afresh. Night, rush and small runs: one go.
  const waves = big && (mode === "quiet" || mode === "busy-big" || mode === "busy") ? 2 : 1;
  // Release checks run beside the play parts: they take a slice of the share.
  const releaseParallel = o.release ? Math.max(1, Math.floor(share * S.releaseShare)) : 0;
  const playParallel = Math.max(S.minimum, share - releaseParallel);
  const line = `${why}: ${share} of ${N} machines` + (o.release ? ` (${playParallel} playing, ${releaseParallel} for the release checks)` : "") +
    (waves > 1 && o.wave !== 2 ? ", in waves" : "") + (o.wave === 2 ? " (second wave)" : "");
  return { share, mode, why, line, waves, playParallel, releaseParallel, N };
}

/** Which parts each wave plays: one wave of every part, or two waves of at most max(waveParts, half) parts. */
function waveParts(parts, waves, S) {
  S = Object.assign({}, SETTINGS, S || {});
  const all = Array.from({ length: parts }, (_, i) => i);
  if (waves < 2 || parts <= S.waveParts) return [all, []];
  const size = Math.max(S.waveParts, Math.ceil(parts / 2));
  return [all.slice(0, size), all.slice(size)];
}

/** The largest matchup (games) across job orders. */
function biggestMatchup(orderFiles) {
  let max = 0;
  for (const f of orderFiles) {
    try { const o = JSON.parse(fs.readFileSync(f, "utf8")); for (const m of o.matchups || []) max = Math.max(max, Number(m.games) || 0); } catch (e) { /* plan.js reports broken orders */ }
  }
  return max;
}

/**
 * How busy the repository is right now. api(path) → parsed JSON. selfRun: this run's id (left out).
 * Returns { checksWaiting, othersRunning, labRuns, labUsing, recentPushes, jobsWaiting, oldestWaitMin }.
 */
function gatherQueue(api, opts) {
  opts = opts || {};
  const S = Object.assign({}, SETTINGS, opts.settings || {});
  const now = new Date(opts.now || Date.now());
  const runs = [];
  for (const st of ["queued", "in_progress"]) {
    const r = api(`actions/runs?status=${st}&per_page=100`);
    for (const x of (r && r.workflow_runs) || []) if (!runs.find((y) => y.id === x.id)) runs.push(x);
  }
  const out = { checksWaiting: 0, othersRunning: 0, labRuns: 0, labUsing: 0, recentPushes: 0, jobsWaiting: 0, oldestWaitMin: 0 };
  for (const run of runs) {
    if (String(run.id) === String(opts.selfRun || "")) continue;
    const ignore = S.ignoreWorkflows.includes(run.name);
    const isLab = run.name === "lab";
    if (isLab) out.labRuns++;
    let jobs = [];
    try { jobs = (api(`actions/runs/${run.id}/jobs?per_page=100`) || {}).jobs || []; } catch (e) { jobs = []; }
    for (const j of jobs) {
      if (j.status === "queued" || j.status === "waiting" || j.status === "pending") {
        out.jobsWaiting++;
        const age = (now - new Date(j.created_at || run.created_at)) / 60000;
        if (age > out.oldestWaitMin) out.oldestWaitMin = age;
        if (!isLab && !ignore) out.checksWaiting++;
      } else if (j.status === "in_progress") {
        if (isLab) out.labUsing++;
        else if (!ignore) out.othersRunning++;
      }
    }
  }
  try {
    const prs = api("pulls?state=open&sort=updated&direction=desc&per_page=30") || [];
    for (const p of prs) {
      if (String(p.number) === String(opts.selfPr || "")) continue;
      if (now - new Date(p.updated_at) <= S.recentPushMinutes * 60000) out.recentPushes++;
    }
  } catch (e) { /* left at 0 */ }
  out.oldestWaitMin = Math.round(out.oldestWaitMin);
  return out;
}

/** "Queue: 12 jobs waiting, oldest 43 min · lab using 9 of 20" or "Queue: clear", and its mark for the page. */
function queueLine(q, S) {
  S = Object.assign({}, SETTINGS, S || {});
  if (!q) return { text: "Queue: unknown", mark: null };
  const lab = q.labUsing ? ` · lab using ${q.labUsing} of ${S.N}` : "";
  if (!q.jobsWaiting) return { text: `Queue: clear${lab}`, mark: null };
  const mark = q.oldestWaitMin > S.queueHeadsUpAfterMinutes ? "heads" : q.oldestWaitMin > S.queueRunningAfterMinutes ? "running" : null;
  return { text: `Queue: ${q.jobsWaiting} ${q.jobsWaiting === 1 ? "job" : "jobs"} waiting, oldest ${q.oldestWaitMin} min${lab}`, mark };
}

function main() {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
  const repo = process.env.GITHUB_REPOSITORY || "productofdefiance/Flagfall";
  const { execFileSync } = require("child_process");
  const api = (p) => JSON.parse(execFileSync("gh", ["api", `repos/${repo}/${p}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  let busy = null;
  try { busy = gatherQueue(api, { selfRun: process.env.GITHUB_RUN_ID, selfPr: opt.pr }); } catch (e) { busy = null; }
  const orders = String(opt.orders || "").split(/\s+/).filter(Boolean);
  const wave = Number(opt.wave || 1);
  const d = decide({ event: opt.event, now: opt.now || new Date().toISOString(), rush: opt.rush === "true", labels: String(opt.labels || "").split(",").map((s) => s.trim()).filter(Boolean),
    biggestMatchup: biggestMatchup(orders), busy, parts: Number(opt.parts || 1), release: opt.release === "true", wave });
  const [w1, w2] = waveParts(Number(opt.parts || 1), d.waves);
  const out = {
    max_parallel: d.playParallel, release_parallel: Math.max(1, d.releaseParallel), share: d.share, mode: d.mode, line: d.line,
    waves: w2.length ? 2 : 1, matrix_w1: JSON.stringify({ part: w1 }), matrix_w2: JSON.stringify({ part: w2.length ? w2 : [-1] }), has_w2: w2.length ? "true" : "false",
    checks_waiting: busy ? busy.checksWaiting : "", jobs_waiting: busy ? busy.jobsWaiting : ""
  };
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(out).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `**Lab share${wave === 2 ? " (second wave)" : ""}:** ${d.line}\n\n`);
  console.log(d.line);
  console.log(JSON.stringify(Object.assign({ busy }, out)));
}

module.exports = { decide, waveParts, biggestMatchup, gatherQueue, queueLine, etHour, isNight, SETTINGS };
if (require.main === module) main();
