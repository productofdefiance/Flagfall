// Brief 022's Report tables from the lab's run folders (or from play.js .jsonl parts): one row per matchup with the
// baseline table, brain A's results, the first mover's share, first losses, the warmed-special reactions and speed.
// node sims/lab/report022.js <order id or run folder or .jsonl files...>   Prints Markdown. Read only.
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const root = path.join(__dirname, "..", "..", "results");
function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined || r[i] === "" ? "" : isNaN(+r[i]) ? r[i] : +r[i]])));
}
function findRun(id) {
  const hits = [];
  for (const v of fs.readdirSync(root)) { const d = path.join(root, v); if (!fs.statSync(d).isDirectory()) continue; for (const r of fs.readdirSync(d)) if (new RegExp(`^\\d{4}-\\d\\d-\\d\\d_[a-z]+_${id}(-\\d+)?$`).test(r)) hits.push(path.join(d, r)); }
  return hits.sort().pop() || null;
}
function load(arg) {
  if (arg.endsWith(".jsonl")) return fs.readFileSync(arg, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const dir = fs.existsSync(arg) && fs.statSync(arg).isDirectory() ? arg : findRun(arg);
  if (!dir) throw new Error("no run for " + arg);
  const p = path.join(dir, "games.csv"), z = p + ".gz";
  return parseCsv(fs.existsSync(p) ? fs.readFileSync(p, "utf8") : zlib.gunzipSync(fs.readFileSync(z)).toString("utf8"));
}
const rows = [].concat(...process.argv.slice(2).map(load));
const by = new Map(); for (const r of rows) { if (!by.has(r.matchup)) by.set(r.matchup, []); by.get(r.matchup).push(r); }
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) : "-");
const sum = (g, k) => g.reduce((a, r) => a + (+r[k] || 0), 0);
const avg = (g, k) => { const v = g.map((r) => r[k]).filter((x) => x !== "" && x !== undefined); return v.length ? (v.reduce((a, b) => a + +b, 0) / v.length).toFixed(1) : "-"; };
console.log("| Matchup | Games | A win (KO/TKO) | A win tiebreak | A loss (KO/TKO) | A loss tiebreak | Draw | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover: of all / of decisive | First LR lost: first / second | Warmed special: left / stayed braced / stayed unbraced / hit next | Specials warmed / fired / lapsed / removed warm | ms per side-turn avg / worst | positions worst side-turn |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const [m, g] of by) {
  const n = g.length, c = (f) => g.filter(f).length, dec = g.filter((r) => +r.decisive === 1);
  const firstAll = c((r) => r.winner === r.first);
  console.log(`| ${m} | ${n} | ${c((r) => r.a_result === "win")} | ${c((r) => r.a_result === "win_tiebreak")} | ${c((r) => r.a_result === "loss")} | ${c((r) => r.a_result === "loss_tiebreak")} | ${c((r) => r.a_result === "draw")} | ${pct(c((r) => r.end === "holder_ko"), n)}% | ${pct(c((r) => r.end === "pull_ko"), n)}% | ${pct(c((r) => r.end === "tko"), n)}% | ${pct(sum(g, "turn_limit"), n)}% | ${pct(c((r) => +r.pulls > 0), n)}% | ${avg(g, "turns")} | ${pct(firstAll, n)}% / ${pct(c((r) => +r.first_won === 1), dec.length)}% | ${c((r) => r.first_lr_lost_side === "first")} / ${c((r) => r.first_lr_lost_side === "second")} | ${sum(g, "sw_left")} / ${sum(g, "sw_stayed_braced")} / ${sum(g, "sw_stayed_unbraced")} / ${sum(g, "sw_hit_next")} | ${sum(g, "sp_warm")} / ${sum(g, "sp_fired")} / ${sum(g, "sp_lapsed")} / ${sum(g, "sp_removed")} | ${(sum(g, "bot_ms") / Math.max(1, sum(g, "bot_turns"))).toFixed(0)} / ${Math.max(...g.map((r) => +r.bot_ms_max_turn || 0))} | ${Math.max(...g.map((r) => +r.bot_positions_max_turn || 0))} |`);
}
