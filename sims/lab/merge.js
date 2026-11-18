// The lab's merge step (Brief 008): adds up the parts' game rows and writes one run folder per job order, as
// results/README.md describes, then rewrites results/INDEX.md and results/index.csv.
// node sims/lab/merge.js --results <results folder> --parts <folder of .jsonl> [--trigger night|day|pull request]
//   [--commit <sha>] [--started <iso>] [--failed "<what failed>"] [--move <done folder>] [--board <board>] <order.json> [...]
// Prints the run folders it wrote, one per line.
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const args = process.argv.slice(2), opt = {}, orders = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i]; else orders.push(args[i]); }
const boardDir = path.resolve(opt.board || path.join(__dirname, "..", "..", "board"));
const V = require(path.join(boardDir, "version.js"));
const { MEASURES, ALWAYS } = require("./measures.js");
const idx = require("./index.js");
const results = path.resolve(opt.results || path.join(__dirname, "..", "..", "results"));

// ---- rows from every part ----
const rows = [];
if (opt.parts && fs.existsSync(opt.parts)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith(".jsonl")) for (const l of fs.readFileSync(p, "utf8").split("\n")) if (l.trim().startsWith("{")) rows.push(JSON.parse(l)); });
  walk(opt.parts);
}

const CORE = ["seed", "version", "rules", "format", "lineup_n", "lineup_s", "brain_n", "brain_s", "first", "winner", "how", "turns", "flag_damage_n", "flag_damage_s", "units_lost_n", "units_lost_s", "replay"];
const csvCell = (v) => { if (v === undefined || v === null) return ""; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const toCsv = (cols, list) => cols.join(",") + "\n" + list.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\n") + (list.length ? "\n" : "");
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + "%" : "-");
const nyDate = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** The baseline-table totals for one matchup's rows; tiebreak wins always apart from KOs and draws. */
function outcomes(list) {
  const t = { games: list.length, a_wins: 0, b_wins: 0, a_tiebreak: 0, b_tiebreak: 0, draws: 0, unfinished: 0, errors: 0,
    holder_ko: 0, pull_ko: 0, tko: 0, tiebreak_win: 0, draw: 0, turn_limit: 0, games_with_pull: 0, turn_sum: 0, decisive: 0, first_mover_wins: 0 };
  for (const r of list) {
    if (r.error) { t.errors++; continue; }
    t.turn_sum += r.turns || 0;
    if (r.pulls > 0) t.games_with_pull++;
    if (r.end === "unfinished") { t.unfinished++; continue; }
    if (r.end in t) t[r.end]++;
    if (r.turn_limit) t.turn_limit++;
    if (r.a_result === "win") t.a_wins++; else if (r.a_result === "loss") t.b_wins++; else if (r.a_result === "win_tiebreak") t.a_tiebreak++; else if (r.a_result === "loss_tiebreak") t.b_tiebreak++; else if (r.a_result === "draw") t.draws++;
    if (r.decisive) { t.decisive++; if (r.first_won === 1) t.first_mover_wins++; }
  }
  const n = t.games - t.errors - t.unfinished;
  t.avg_turn = n ? +(t.turn_sum / Math.max(t.games - t.errors, 1)).toFixed(2) : 0;
  t.a_share = n ? +((t.a_wins + t.a_tiebreak + 0.5 * t.draws) / n).toFixed(4) : 0;
  t.a_share_se = n ? +Math.sqrt(0.25 / n).toFixed(4) : 0;
  t.first_mover_share = t.decisive ? +(t.first_mover_wins / t.decisive).toFixed(4) : "";
  return t;
}

function writeRun(order, list) {
  const now = new Date(), started = opt.started ? new Date(opt.started) : now;
  const version = V.game || `build-${V.build}`, kind = order.kind;
  const base = `${nyDate(started)}_${kind}_${order.id}`;
  const vdir = path.join(results, version);
  fs.mkdirSync(vdir, { recursive: true });
  let name = base, k = 2;
  while (fs.existsSync(path.join(vdir, name))) name = `${base}-${k++}`;
  const dir = path.join(vdir, name);
  fs.mkdirSync(path.join(dir, "tables"), { recursive: true });

  // games.csv: core columns first, then every other column any row has (new measures add columns, never rename)
  const extra = []; for (const r of list) for (const c of Object.keys(r)) if (!CORE.includes(c) && !extra.includes(c)) extra.push(c);
  const csv = toCsv(CORE.concat(extra), list);
  if (csv.length > 5e6) fs.writeFileSync(path.join(dir, "games.csv.gz"), zlib.gzipSync(csv)); else fs.writeFileSync(path.join(dir, "games.csv"), csv);

  // tables: outcomes per matchup, and each measure's number columns added up per matchup
  const mus = (order.matchups || []).map((mu) => ({ mu, list: list.filter((r) => r.matchup === mu.name) }));
  const out = mus.map(({ mu, list: l }) => Object.assign({ matchup: mu.name, a: mu.a, b: mu.b, rules: mu.rules, format: mu.format, lineups: mu.mix_a || mu.mix_b ? `${mu.mix_a || mu.mix || "mixed"} v ${mu.mix_b || mu.mix || "mixed"}` : mu.mix || "mixed" }, outcomes(l)));
  const ocols = ["matchup", "a", "b", "rules", "format", "lineups", "games", "a_wins", "b_wins", "a_tiebreak", "b_tiebreak", "draws", "unfinished", "errors", "holder_ko", "pull_ko", "tko", "tiebreak_win", "draw", "turn_limit", "games_with_pull", "avg_turn", "decisive", "first_mover_share", "a_share", "a_share_se"];
  fs.writeFileSync(path.join(dir, "tables", "outcomes.csv"), toCsv(ocols, out));
  const measureNames = [...new Set(list.flatMap((r) => Object.keys(r)))];
  for (const mname of Object.keys(MEASURES)) {
    if (ALWAYS.includes(mname) && mname === "outcome") continue;
    const cols = MEASURES[mname].columns.filter((c) => measureNames.includes(c));
    if (!cols.length) continue;
    const tab = mus.map(({ mu, list: l }) => { const t = { matchup: mu.name, games: l.length }; for (const c of cols) { const nums = l.map((r) => r[c]).filter((v) => typeof v === "number"); if (nums.length) t[c] = +nums.reduce((a, b) => a + b, 0).toFixed(3); else { const cnt = {}; for (const r of l) if (r[c] !== undefined && r[c] !== "") cnt[r[c]] = (cnt[r[c]] || 0) + 1; t[c] = Object.entries(cnt).map(([v, n]) => `${v}:${n}`).join(" "); } } if (mname === "timing") { t.bot_ms_max_turn = Math.max(0, ...l.map((r) => r.bot_ms_max_turn || 0)); } return t; });
    fs.writeFileSync(path.join(dir, "tables", mname + ".csv"), toCsv(["matchup", "games"].concat(cols), tab));
  }

  // run.json: the facts. Core fields, then anything else the order carried under `extra`.
  const coreOrder = ["id", "kind", "brief", "question", "tags", "matchups", "measures", "answer", "flags", "seed_name", "topic"];
  const extraFields = {}; for (const k of Object.keys(order)) if (!coreOrder.includes(k)) extraFields[k] = order[k];
  const run = { id: name, kind, version, build: V.build, commit: opt.commit || null, brief: order.brief || null, question: order.question,
    tags: order.tags || [], trigger: opt.trigger || "day", started: started.toISOString(), finished: now.toISOString(),
    games: list.length, seed_from: `tests/rng.js lab:${order.seed_name || order.id}:<matchup>, game number + seed_from`,
    scripts: ["sims/lab/play.js", "sims/lab/merge.js"], settings: { matchups: order.matchups, measures: order.measures || [] },
    failed: opt.failed || null, extra: Object.assign(extraFields, order.extra || {}) };
  fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify(run, null, 1) + "\n");

  if (opt.hashes && fs.existsSync(opt.hashes)) fs.copyFileSync(opt.hashes, path.join(dir, "tables", "hashes.txt"));
  // SUMMARY.md: question, answer, key table, likely or proven, flags, replays. One screen.
  const errors = list.filter((r) => r.error), unknown = [...new Set(list.flatMap((r) => (r.unknown_measures || "").split(" ").filter(Boolean)))];
  const failed = opt.failed || (!list.length ? "no games were played" : errors.length ? `${errors.length} games stopped with an error (first: ${errors[0].error})` : null);
  const answer = failed ? `Failed: ${failed}.` : order.answer || autoAnswer(out);
  let s = `# ${order.id}\n\n**Question:** ${order.question}\n\n**Answer:** ${answer}\n\n`;
  s += `**Key table** (${version}, ${list.length} games; tiebreak wins counted apart from KOs and draws)\n\n`;
  s += "| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n";
  for (const t of out) s += `| ${t.matchup}: ${t.a} v ${t.b}, ${t.format}, ${t.lineups} | ${t.games} | ${t.a_wins} | ${t.b_wins} | ${t.a_tiebreak} | ${t.b_tiebreak} | ${t.draws} | ${pct(t.holder_ko, t.games)} | ${pct(t.pull_ko, t.games)} | ${pct(t.tko, t.games)} | ${pct(t.turn_limit, t.games)} | ${pct(t.games_with_pull, t.games)} | ${t.avg_turn} | ${t.first_mover_share === "" ? "-" : pct(t.first_mover_share, 1)} |\n`;
  if (opt.checks && fs.existsSync(opt.checks)) {
    // the checks that ran with it (release and nightly runs): one "name=outcome" per line
    const cl = fs.readFileSync(opt.checks, "utf8").split("\n").filter(Boolean).map((l) => l.split("="));
    fs.writeFileSync(path.join(dir, "tables", "checks.csv"), "check,outcome\n" + cl.map(([a, b]) => `${csvCell(a)},${csvCell(b)}`).join("\n") + "\n");
    const bad = cl.filter(([, o]) => o !== "success");
    s += `\n**Checks:** ${bad.length ? `FAILED: ${bad.map(([a]) => a).join(", ")}` : `all ${cl.length} passed`} (\`tables/checks.csv\`${fs.existsSync(path.join(dir, "tables", "hashes.txt")) ? ", hashes in `tables/hashes.txt`" : ""}).\n`;
  }
  s += `\n**Likely or proven:** ${likely(out)}\n\n`;
  s += `**Flags raised:** ${order.flags && order.flags.length ? order.flags.join(", ") : "none"}${unknown.length ? `. Unknown measures skipped: ${unknown.join(", ")} (add them to sims/lab/measures.js)` : ""}\n\n`;
  s += `**Replay the odd games:** each row of \`games.csv\` has a \`replay\` link that opens that game on the board.\n${oddGames(list)}`;
  fs.writeFileSync(path.join(dir, "SUMMARY.md"), s);

  idx.add(results, { id: name, date: nyDate(started), version, kind, brief: order.brief || "", tags: (order.tags || []).join(" "), question: order.question, answer, path: path.relative(results, dir).split(path.sep).join("/") });
  return dir;
}
function autoAnswer(out) {
  return out.map((t) => t.a === t.b
    ? `${t.matchup}: mirror, ${pct(t.turn_limit, t.games)} ended on the turn limit, A/B ${t.a_wins + t.a_tiebreak}–${t.b_wins + t.b_tiebreak}`
    : `${t.matchup}: ${t.a} took ${pct(t.a_share, 1)} of games against ${t.b} (decisive ${t.a_wins}–${t.b_wins}, tiebreak ${t.a_tiebreak}–${t.b_tiebreak}, draws ${t.draws})`).join("; ") + ".";
}
function likely(out) {
  return out.map((t) => {
    if (!t.games) return `${t.matchup}: no games.`;
    const z = t.a_share_se ? (t.a_share - 0.5) / t.a_share_se : 0;
    if (t.a === t.b) return `${t.matchup}: a mirror, so the A/B split is a check on noise (${z >= 0 ? "+" : ""}${z.toFixed(1)} standard errors from even).`;
    return `${t.matchup}: ${Math.abs(z) >= 2 ? `a real difference at this sample, ${z.toFixed(1)} standard errors from even` : `within noise (${z.toFixed(1)} standard errors; F23 asks for 2+ at 1,000+ games before ruling)`}.`;
  }).join(" ") + " Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.";
}
function oddGames(list) {
  const lines = [], link = (r, why) => `- ${why}: seed ${r.seed} (${r.matchup}, game ${r.game}) ${/^http/.test(r.replay || "") ? `[watch](${r.replay})` : r.replay || ""}`;
  for (const r of list.filter((r) => r.error).slice(0, 3)) lines.push(link(r, "error: " + r.error));
  for (const r of list.filter((r) => r.end === "unfinished").slice(0, 3)) lines.push(link(r, "never finished"));
  for (const r of list.filter((r) => r.safety_stops > 0).slice(0, 2)) lines.push(link(r, `safety stop ${r.safety_stops}×`));
  const ok = list.filter((r) => !r.error && r.turns);
  if (ok.length) { const lo = ok.reduce((a, b) => (b.turns < a.turns ? b : a)), hi = ok.reduce((a, b) => (b.turns > a.turns ? b : a)); lines.push(link(lo, `shortest game (${lo.turns} turns, ${lo.how})`)); if (hi !== lo) lines.push(link(hi, `longest game (${hi.turns} turns, ${hi.how})`)); }
  return lines.join("\n") + "\n";
}

const written = [];
for (const file of orders) {
  const order = JSON.parse(fs.readFileSync(file, "utf8"));
  written.push(writeRun(order, rows.filter((r) => r.order === order.id)));
  if (opt.move) { fs.mkdirSync(opt.move, { recursive: true }); fs.renameSync(file, path.join(opt.move, path.basename(file))); }
}
console.log(written.join("\n"));
