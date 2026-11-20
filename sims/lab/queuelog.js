#!/usr/bin/env node
/* The lab's queue log (Brief 024): one CSV line per lab run, the data for tuning the share rules in capacity.json.
   node sims/lab/queuelog.js --header
   node sims/lab/queuelog.js --run <run id> --event <event> --games <n> --share <n> --why "<plan line>" --checks <n>
   Reads the run's own jobs through GitHub's API (gh) for how long its first job waited and how long it has taken. */
"use strict";
const COLS = ["date", "time_et", "run", "event", "games", "share", "why", "first_job_wait_min", "run_min", "checks_waiting_at_start"];
const csv = (v) => { const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function et(d) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(new Date(d)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
/** One row from the run and its jobs (pure: the test can feed it). */
function row(o, run, jobs, now) {
  const created = new Date(run.created_at || now);
  const starts = jobs.filter((j) => /^play part/.test(j.name) && j.started_at).map((j) => new Date(j.started_at));
  const first = starts.length ? Math.min(...starts) : null;
  const t = et(created);
  return [t.date, t.time, o.run, o.event, o.games, o.share, o.why, first ? Math.round((first - created) / 6000) / 10 : "",
    Math.round((new Date(now) - created) / 6000) / 10, o.checks].map(csv).join(",");
}
function main() {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
  if (opt.header) { console.log(COLS.join(",")); return; }
  const repo = process.env.GITHUB_REPOSITORY || "productofdefiance/Flagfall";
  const { execFileSync } = require("child_process");
  const api = (p) => JSON.parse(execFileSync("gh", ["api", `repos/${repo}/${p}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
  let run = {}, jobs = [];
  try { run = api(`actions/runs/${opt.run}`); jobs = api(`actions/runs/${opt.run}/jobs?per_page=100`).jobs || []; } catch (e) { /* written with what is known */ }
  console.log(row(opt, run, jobs, new Date()));
}
module.exports = { row, COLS };
if (require.main === module) main();
