// @test job=rules quick=yes release=yes night=no
// Lab self-test (Brief 008): a job order with an unknown kind, an unknown measure and an extra field plays without
// errors and makes a complete run folder (SUMMARY.md, run.json, games.csv with the core columns, tables/, INDEX line).
// node sims/lab/self_test.js
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const here = __dirname, order = path.join(here, "test_orders", "odd-order.json");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lab-")), results = path.join(tmp, "results"), parts = path.join(tmp, "parts");
fs.mkdirSync(parts, { recursive: true });
let fails = 0, n = 0;
const ok = (c, m) => { n++; console.log(`  ${c ? "ok" : "FAIL"}: ${m}`); if (!c) fails++; };
const node = (args) => cp.execFileSync("node", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
// two parts, as two machines would
// the second part writes into a folder that doesn't exist yet, as on a fresh GitHub machine
for (const p of [0, 1]) node([path.join(here, "play.js"), "--part", p, "--parts", 2, "--out", path.join(parts, p ? "new/" : "", `p${p}.jsonl`), order]);
const dir = node([path.join(here, "merge.js"), "--results", results, "--parts", parts, "--trigger", "day", order]).trim();
const o = JSON.parse(fs.readFileSync(order, "utf8")), want = o.matchups.reduce((s, m) => s + m.games, 0);
ok(fs.existsSync(dir) && /\d{4}-\d{2}-\d{2}_experiment_lab-odd-order-check$/.test(dir), "a run folder named date_kind_topic, for an unknown kind: " + path.basename(dir));
for (const f of ["SUMMARY.md", "run.json", "games.csv", "tables/outcomes.csv"]) ok(fs.existsSync(path.join(dir, f)), "it has " + f);
const run = JSON.parse(fs.readFileSync(path.join(dir, "run.json"), "utf8"));
for (const k of ["id", "kind", "version", "build", "commit", "brief", "question", "tags", "trigger", "started", "finished", "games", "seed_from", "scripts", "settings"]) ok(k in run, "run.json has " + k);
ok(run.extra && run.extra.owner_note, "an extra field in the order is kept under run.json extra");
ok(run.games === want, `every game played once across the two parts (${run.games} of ${want})`);
const csv = fs.readFileSync(path.join(dir, "games.csv"), "utf8").trim().split("\n"), head = csv[0].split(",");
const core = ["seed", "version", "rules", "format", "lineup_n", "lineup_s", "brain_n", "brain_s", "first", "winner", "how", "turns", "flag_damage_n", "flag_damage_s", "units_lost_n", "units_lost_s", "replay"];
ok(core.every((c, i) => head[i] === c), "games.csv starts with the core columns, in order");
ok(head.includes("evade_no_step") && head.includes("late_behind_turns"), "measures add their own columns");
ok(csv.length - 1 === want, "one row per game");
ok(!csv.some((l) => /"?error"?/.test(l.split(",").slice(-1)[0])), "no game stopped with an error");
ok(csv.slice(1).every((l) => /\?watch=[A-Z0-9-]{14}&/.test(l)), "every row has a replay link");
const sum = fs.readFileSync(path.join(dir, "SUMMARY.md"), "utf8");
const order6 = ["**Question:**", "**Answer:**", "**Key table**", "**Likely or proven:**", "**Flags raised:**", "**Replay the odd games:**"].map((h) => sum.indexOf(h));
ok(order6.every((p, i) => p >= 0 && (i === 0 || p > order6[i - 1])), "SUMMARY.md has its six parts in order");
ok(/Unknown measures skipped: no-such-measure/.test(sum), "an unknown measure is skipped and named, not an error");
ok(/tiebreak wins counted apart/.test(sum), "the key table counts tiebreak wins apart");
ok(/2\d{3}-\d{2}-\d{2} · experiment/.test(fs.readFileSync(path.join(results, "INDEX.md"), "utf8")), "INDEX.md has its line");
ok(fs.readFileSync(path.join(results, "index.csv"), "utf8").split("\n")[0] === "id,date,version,kind,brief,tags,question,answer,path", "index.csv has its columns");
// a second run of the same order on the same day gets -2
const dir2 = node([path.join(here, "merge.js"), "--results", results, "--parts", parts, order]).trim();
ok(/-2$/.test(dir2), "a second run the same day gets -2");
// a broken order is refused in plain words
const bad = path.join(tmp, "bad.json"); fs.writeFileSync(bad, JSON.stringify({ id: "Bad Id", kind: "screen", matchups: [{ name: "x", a: "brain99", b: "brain5", rules: "v3.4", format: "blitz5", games: 2 }] }));
let msg = ""; try { node([path.join(here, "plan.js"), "--orders", bad]); } catch (e) { msg = String(e.stderr); }
ok(/id: lowercase/.test(msg) && /question/.test(msg) && /brain brain99 is not on this board/.test(msg), "a broken order is refused with its problems named");
// Brief 020: a column name belongs to one measure only (a row merges every measure's columns, so a shared name is overwritten)
{ const { MEASURES } = require("./measures.js"), owner = {}, clash = [];
  for (const m in MEASURES) for (const c of MEASURES[m].columns) { if (owner[c] && owner[c] !== m) clash.push(`${c} (${owner[c]}, ${m})`); owner[c] = m; }
  ok(!clash.length, "no two measures share a column name" + (clash.length ? ": " + clash.join(", ") : "")); }
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
