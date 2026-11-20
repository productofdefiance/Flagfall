#!/usr/bin/env node
/* Checks for the lab's share of machines (Brief 024), no network. Run: node sims/lab/test_capacity.js
   1. The share rules (sims/lab/capacity.js): each row of the brief's table, the floor of 2, the reserve, rush, the night
      window in US Eastern across a daylight-saving change, waves, and the Queue line.
   2. Waves change nothing: one set of orders played in one pass and in three waves (different groups of parts, in a
      different order) gives the same result files. Only wall-clock time can differ: run.json's `finished` and the
      timing measure's milliseconds (bot_ms, bot_ms_max_turn), which differ between any two runs. */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const C = require("./capacity.js");
let fails = 0, n = 0;
const ok = (c, m, extra) => { n++; console.log(`  ${c ? "ok" : "FAIL"}: ${m}${c || !extra ? "" : "  (" + extra + ")"}`); if (!c) fails++; };

const DAY = "2026-11-20T18:00:00Z";           // 1:00 pm ET
const quiet = { checksWaiting: 0, othersRunning: 0, labRuns: 0, recentPushes: 0 };
const busy = { checksWaiting: 6, othersRunning: 0, labRuns: 0, recentPushes: 0 };
const d = (o) => C.decide(Object.assign({ event: "pull_request", now: DAY, biggestMatchup: 200, busy: quiet }, o));

ok(d({ event: "workflow_run" }).share === 20 && d({ event: "workflow_run" }).mode === "night", "night: the nightly chain takes all of N, even at 1 pm");
ok(d({ now: "2026-11-21T04:30:00Z" }).share === 20, "night: a run starting at 11:30 pm ET takes all of N");
ok(d({ now: "2026-11-20T11:30:00Z", busy }).share === 20, "night: a run starting at 6:30 am ET takes all of N, busy or not");
ok(d({ now: "2026-11-20T12:30:00Z", busy }).share === 10, "7:30 am ET is day");
ok(d({}).share === 15 && d({}).mode === "quiet", "day, quiet: N minus the reserve of 5 for checks");
ok(d({ busy }).share === 10 && d({ busy }).mode === "busy", "day, busy: half of N");
ok(d({ busy: { checksWaiting: 0, othersRunning: 0, labRuns: 1, recentPushes: 0 } }).share === 10, "another lab run counts as busy");
ok(d({ busy: { checksWaiting: 0, othersRunning: 0, labRuns: 0, recentPushes: 2 } }).share === 10, "a pull request pushed in the last 30 minutes counts as busy");
ok(d({ busy: null }).share === 10, "couldn't read the queue: counted as busy in the daytime");
ok(d({ busy, biggestMatchup: 1000 }).share === 5 && d({ busy, biggestMatchup: 1000 }).waves === 2, "day, busy, big run (1,000 games in a matchup): a quarter of N, in waves");
ok(d({ busy, biggestMatchup: 999 }).share === 10, "999 games is not big");
ok(d({ busy, rush: true, biggestMatchup: 1000 }).share === 20 && d({ busy, labels: ["lab: rush"] }).share === 20, "rush (manual input or the lab: rush label) wins: all of N");
ok(d({ busy, labels: ["review: hold"] }).share === 10, "other labels don't rush");
ok(C.decide({ event: "pull_request", now: DAY, biggestMatchup: 1000, busy }, { N: 6 }).share === 2, "never fewer than 2 (a quarter of 6 is 1)");
ok(C.decide({ event: "pull_request", now: DAY, busy: quiet }, { N: 6 }).share === 2, "never fewer than 2 (6 minus the reserve of 5 is 1)");
const q = d({}); ok(q.N - q.share === 5, "the reserve is kept when quiet");
ok(d({ busy }).line === "Day, busy (6 checks waiting): 10 of 20 machines", "the plan line, in plain words: " + d({ busy }).line);
const rel = d({ release: true, event: "workflow_run" });
ok(rel.playParallel + rel.releaseParallel === 20 && rel.releaseParallel === 5, "a release run splits its share: 15 playing, 5 for the release checks");
ok(d({ biggestMatchup: 200 }).waves === 1 && d({ event: "workflow_run", biggestMatchup: 1000 }).waves === 1 && d({ rush: true, biggestMatchup: 1000 }).waves === 1, "small runs, night runs and rush play in one go");
ok(d({ biggestMatchup: 1000 }).waves === 2, "a big daytime run plays in waves even when quiet (the next wave may give way)");
// Night window in US Eastern across the daylight-saving change (it ended 1 Nov 2026).
ok(C.etHour("2026-10-31T03:30:00Z") === 23 && C.isNight("2026-10-31T03:30:00Z", C.SETTINGS), "summer time: 03:30 UTC is 11:30 pm ET (night)");
ok(C.etHour("2026-11-03T03:30:00Z") === 22 && !C.isNight("2026-11-03T03:30:00Z", C.SETTINGS), "winter time: 03:30 UTC is 10:30 pm ET (day)");
ok(C.isNight("2026-11-03T04:30:00Z", C.SETTINGS) && !C.isNight("2026-11-03T12:30:00Z", C.SETTINGS) && C.isNight("2026-11-03T11:59:00Z", C.SETTINGS), "winter time: 11:30 pm and 6:59 am ET are night, 7:30 am is day");
// Waves.
const [a1, a2] = C.waveParts(20, 2);
ok(a1.length === 10 && a2.length === 10 && a1.concat(a2).join() === Array.from({ length: 20 }, (_, i) => i).join(), "20 parts in two waves of 10, every part once");
ok(C.waveParts(8, 2)[1].length === 0 && C.waveParts(20, 1)[1].length === 0, "8 parts, or one wave: no second wave");
// The Queue line.
ok(C.queueLine({ jobsWaiting: 0, labUsing: 0 }).text === "Queue: clear", "Queue: clear");
const ql = C.queueLine({ jobsWaiting: 12, oldestWaitMin: 43, labUsing: 9 });
ok(ql.text === "Queue: 12 jobs waiting, oldest 43 min · lab using 9 of 20" && ql.mark === "running", "the Queue line and its Running mark over 15 minutes");
ok(C.queueLine({ jobsWaiting: 1, oldestWaitMin: 50, labUsing: 0 }).mark === "heads" && C.queueLine({ jobsWaiting: 1, oldestWaitMin: 10 }).mark === null, "Heads up over 45 minutes; no mark under 15");
// gatherQueue on a fake API.
const fake = (p) => {
  if (/status=queued/.test(p)) return { workflow_runs: [{ id: 2, name: "checks", created_at: "2026-11-20T17:20:00Z" }] };
  if (/status=in_progress/.test(p)) return { workflow_runs: [{ id: 1, name: "lab" }, { id: 3, name: "status board" }, { id: 9, name: "lab" }] };
  if (/runs\/2\/jobs/.test(p)) return { jobs: [{ status: "queued", created_at: "2026-11-20T17:17:00Z" }, { status: "queued", created_at: "2026-11-20T17:50:00Z" }] };
  if (/runs\/1\/jobs/.test(p)) return { jobs: [{ status: "in_progress" }, { status: "in_progress" }, { status: "queued", created_at: "2026-11-20T17:55:00Z" }] };
  if (/runs\/3\/jobs/.test(p)) return { jobs: [{ status: "in_progress" }] };
  if (/^pulls/.test(p)) return [{ number: 40, updated_at: "2026-11-20T17:50:00Z" }, { number: 41, updated_at: "2026-11-20T16:00:00Z" }];
  return {};
};
const g = C.gatherQueue(fake, { now: DAY, selfRun: 9 });
ok(g.checksWaiting === 2 && g.labRuns === 1 && g.labUsing === 2 && g.othersRunning === 0 && g.jobsWaiting === 3 && g.oldestWaitMin === 43 && g.recentPushes === 1,
  "gatherQueue: checks waiting, other lab runs, lab machines in use, oldest wait, recent pushes; this run and the status board left out", JSON.stringify(g));

// The queue log line.
const Q = require("./queuelog.js");
const qr = Q.row({ run: 7, event: "pull_request", games: 400, share: 10, why: "Day, busy (6 checks waiting): 10 of 20 machines", checks: 6 },
  { created_at: "2026-11-20T18:00:00Z" }, [{ name: "plan", started_at: "2026-11-20T18:00:05Z" }, { name: "play part 1", started_at: "2026-11-20T18:20:00Z" }, { name: "play part 0", started_at: "2026-11-20T18:12:30Z" }], "2026-11-20T18:40:00Z");
ok(qr === '2026-11-20,13:00,7,pull_request,400,10,"Day, busy (6 checks waiting): 10 of 20 machines",12.5,40,6' && Q.COLS.length === qr.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).length,
  "queue log line: date and time ET, event, games, share and why, first play job's wait, run time, checks waiting", qr);

// 2. Waves change nothing.
const here = __dirname, order = path.join(here, "test_orders", "odd-order.json");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "waves-"));
const node = (args) => cp.execFileSync("node", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const P = 4;
const playPart = (p, dir) => node([path.join(here, "play.js"), "--part", p, "--parts", P, "--out", path.join(dir, `part-${p}.jsonl`), order]);
for (let p = 0; p < P; p++) playPart(p, path.join(tmp, "one"));
// three waves, as three groups of machines at different shares would play them, last part first
for (const [w, ps] of [[1, [3]], [2, [1, 2]], [3, [0]]]) for (const p of ps) playPart(p, path.join(tmp, "waves"));
const files = (dir) => { const out = {}; const walk = (d) => { for (const f of fs.readdirSync(d)) { const x = path.join(d, f); if (fs.statSync(x).isDirectory()) walk(x); else out[path.relative(dir, x)] = fs.readFileSync(x, "utf8"); } }; walk(dir); return out; };
for (const x of ["one", "waves"]) node([path.join(here, "merge.js"), "--results", path.join(tmp, "r-" + x), "--parts", path.join(tmp, x), "--trigger", "day", "--commit", "abc", "--started", "2026-11-20T12:00:00Z", order]);
const A = files(path.join(tmp, "r-one")), B = files(path.join(tmp, "r-waves"));
// Blank the wall-clock values only.
const clean = (name, text) => {
  if (name.endsWith("run.json")) return text.replace(/"finished": "[^"]*"/, '"finished": ""');
  if (name.endsWith(".csv")) {
    const lines = text.split("\n"), head = lines[0].split(",");
    const drop = head.map((h, i) => (/^bot_ms|_ms$|^ms_/.test(h) ? i : -1)).filter((i) => i >= 0);
    if (!drop.length) return text;
    const split = (l) => { const c = []; let f = "", q = false; for (const ch of l) { if (ch === '"') q = !q; if (ch === "," && !q) { c.push(f); f = ""; } else f += ch; } c.push(f); return c; };
    return lines.map((l) => split(l).map((v, i) => (drop.includes(i) ? "" : v)).join(",")).join("\n");
  }
  return text;
};
const names = Object.keys(A).sort();
ok(names.join() === Object.keys(B).sort().join() && names.length >= 6, `the same result files (${names.length})`);
const diffs = names.filter((f) => clean(f, A[f]) !== clean(f, B[f]));
ok(!diffs.length, "one pass and three waves give identical results, wall-clock time aside", diffs.join(" "));
const gamesSame = Object.keys(A).filter((f) => f.endsWith("games.csv")).every((f) => A[f].split("\n").map((l) => l.split(",")[0]).join() === B[f].split("\n").map((l) => l.split(",")[0]).join());
ok(gamesSame, "the same games (seeds) in the same order");
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
