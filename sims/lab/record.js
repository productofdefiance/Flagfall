// The Editor's own games through the lab's measures (Brief 016).
// node sims/lab/record.js <record.json> [more.json ...] [--out <file.csv>] [--board <board folder>]
// A record is what the Matches screen copies ("Copy match record for Claude", app.js recordText): rule set, options,
// brains, actions (with their dice) and result. Each record is replayed action by action through every lab measure
// (timing left blank: human turns have no thinking time) and printed as one games.csv-shaped row. A record whose
// actions don't replay, or replay to a different result than it saved, is reported and skipped, never guessed.
"use strict";
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2), opt = {}, files = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i]; else files.push(args[i]); }
const boardDir = path.resolve(opt.board || path.join(__dirname, "..", "..", "board"));
const E = require(path.join(boardDir, "engine.js")), Bot = require(path.join(boardDir, "bot.js"));
const { MEASURES } = require("./measures.js");

const CORE = ["seed", "version", "rules", "format", "lineup_n", "lineup_s", "brain_n", "brain_s", "first", "winner", "how", "turns", "flag_damage_n", "flag_damage_s", "units_lost_n", "units_lost_s", "replay"];
const lineupText = (l) => (l || []).map((x) => x.card).join(" ");
const sameResult = (a, b) => (!a && !b) || (!!a && !!b && (a.winner || null) === (b.winner || null) && a.how === b.how);

/** One row from one record, or { skip: "why" }. `names` picks the measures (default: all but timing). */
function rowOf(rec, names) {
  if (!rec || !rec.ruleset || !rec.opts || !Array.isArray(rec.actions)) return { skip: "not a match record (needs ruleset, opts and actions)" };
  const st = E.newMatch(rec.ruleset, rec.opts);
  const players = rec.opts.players || {};
  const who = (t) => (players[t] && players[t].type === "bot" ? players[t].brainId || "bot" : "human");
  const ctx = { E, Bot, aTeam: "N", brains: rec.brains || {} };
  const list = (names || Object.keys(MEASURES).filter((n) => n !== "timing")).filter((n) => MEASURES[n]);
  const ms = list.map((n) => MEASURES[n].make(ctx));
  let i = 0;
  for (; i < rec.actions.length && st.phase !== "play"; i++) {   // deployment: before the measures start, as the lab plays it
    const r = E.act(st, rec.actions[i], () => rec.actions[i].die);
    if (!r.ok) return { skip: `deployment action ${i + 1} doesn't replay: ${r.error}` };
  }
  for (; i < rec.actions.length; i++) {
    const a = rec.actions[i], c = { action: a };
    for (const m of ms) if (m.before) m.before(st, c, undefined);
    const r = E.act(st, a, () => a.die);
    for (const m of ms) if (m.after) m.after(st, c, r);
    if (!r.ok) return { skip: `action ${i + 1} (${a.type}) doesn't replay: ${r.error}` };
  }
  if (rec.result !== undefined && rec.result !== null && !sameResult(rec.result, st.result)) return { skip: `replays to ${JSON.stringify(st.result)}, but the record saved ${JSON.stringify(rec.result)}` };
  const res = st.result;
  const row = { seed: rec.opts.seed || "", version: rec.game || (rec.build ? `build ${rec.build}` : ""), rules: rec.ruleset.id || "", format: rec.opts.format || "",
    lineup_n: lineupText(rec.opts.lineups && rec.opts.lineups.N), lineup_s: lineupText(rec.opts.lineups && rec.opts.lineups.S), brain_n: who("N"), brain_s: who("S"), first: st.first,
    winner: res ? res.winner || "draw" : "unfinished", how: res ? res.how : "unfinished", turns: st.turn,
    flag_damage_n: +st.pole.S.toFixed(2), flag_damage_s: +st.pole.N.toFixed(2), units_lost_n: E.beingsLost(st, "N"), units_lost_s: E.beingsLost(st, "S"), replay: "", a_side: "N" };
  for (const m of ms) Object.assign(row, m.end(st));
  for (const c of MEASURES.timing.columns) row[c] = "";   // no thinking time for human turns
  return row;
}
module.exports = { rowOf, CORE };

if (require.main === module) {
  const cell = (v) => { if (v === undefined || v === null) return ""; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = [];
  for (const f of files) {
    let rec; try { rec = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.error(`${f}: skipped, not JSON (${e.message})`); continue; }
    const row = rowOf(rec);
    if (row.skip) { console.error(`${f}: skipped, ${row.skip}`); continue; }
    row.record = path.basename(f, ".json");
    rows.push(row);
  }
  const extra = []; for (const r of rows) for (const c of Object.keys(r)) if (!CORE.includes(c) && !extra.includes(c)) extra.push(c);
  const cols = CORE.concat(extra);
  const csv = cols.join(",") + "\n" + rows.map((r) => cols.map((c) => cell(r[c])).join(",")).join("\n") + (rows.length ? "\n" : "");
  if (opt.out) { fs.writeFileSync(opt.out, csv); console.error(`${rows.length} record(s) written to ${opt.out}`); } else process.stdout.write(csv);
}
