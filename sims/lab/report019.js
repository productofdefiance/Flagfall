// Brief 019's Report tables from the lab's run folders: baselines, head-to-head, how Brain 7 wins, mirrors, B6 storm or
// hold (with replay links), one behaviour at a time, speed, the settings review and the success bar.
// node sims/lab/report019.js [results folder, default results/]   Prints Markdown. Read only.
"use strict";
const fs = require("fs"), path = require("path"), zlib = require("zlib");
const root = path.resolve(process.argv[2] || path.join(__dirname, "..", "..", "results"));

// ---- load the newest run folder of each order ----
function findRun(id) {
  const hits = [];
  for (const v of fs.readdirSync(root)) { const d = path.join(root, v); if (!fs.statSync(d).isDirectory()) continue; for (const r of fs.readdirSync(d)) if (new RegExp(`^\\d{4}-\\d\\d-\\d\\d_[a-z]+_${id}(-\\d+)?$`).test(r)) hits.push(path.join(d, r)); }
  return hits.sort().pop() || null;
}
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
function games(dir) {
  if (!dir) return [];
  const p = path.join(dir, "games.csv"), z = p + ".gz";
  return parseCsv(fs.existsSync(p) ? fs.readFileSync(p, "utf8") : zlib.gunzipSync(fs.readFileSync(z)).toString("utf8"));
}
const runs = {}, G = {};
for (const id of ["brain7-baselines", "brain7-vs-brain5", "brain7-storm-lead", "brain7-one-at-a-time", "brain7-settings"]) { runs[id] = findRun(id); G[id] = games(runs[id]); }
const all = [].concat(...Object.values(G));
const by = (m) => all.filter((r) => r.matchup === m);
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + "%" : "-");
const f1 = (x) => (isFinite(x) ? x.toFixed(1) : "-");
const out = [];
const say = (s) => out.push(s);

// ---- per-matchup summaries ----
function sum(list) {
  const n = list.length, t = { n };
  const c = (f) => list.filter(f).length;
  t.holder_ko = c((r) => r.end === "holder_ko"); t.pull_ko = c((r) => r.end === "pull_ko"); t.tko = c((r) => r.end === "tko");
  t.tb = c((r) => r.end === "tiebreak_win"); t.draw = c((r) => r.end === "draw"); t.tl = c((r) => r.turn_limit === 1); t.pulls = c((r) => r.pulls > 0);
  t.turn = list.reduce((a, r) => a + (r.turns || 0), 0) / Math.max(n, 1);
  const dec = list.filter((r) => r.decisive === 1); t.fm = dec.length ? dec.filter((r) => r.first_won === 1).length / dec.length : NaN;
  t.aw = c((r) => r.a_result === "win"); t.bw = c((r) => r.a_result === "loss"); t.atb = c((r) => r.a_result === "win_tiebreak"); t.btb = c((r) => r.a_result === "loss_tiebreak"); t.ad = c((r) => r.a_result === "draw");
  t.share = n ? (t.aw + t.atb + 0.5 * t.ad) / n : NaN; t.se = n ? Math.sqrt(0.25 / n) : NaN; t.z = (t.share - 0.5) / t.se;
  t.lead_lost = c((r) => r.lead_lost === 1); t.lead_unused = c((r) => r.lead_unused === 1);
  const s = (k) => list.reduce((a, r) => a + (typeof r[k] === "number" ? r[k] : 0), 0);
  t.alone = s("lost_alone_n") + s("lost_alone_s"); t.together = s("lost_together_n") + s("lost_together_s");
  t.solo = s("holder_strikes_solo_n") + s("holder_strikes_solo_s"); t.group = s("holder_strikes_group_n") + s("holder_strikes_group_s");
  const tl = list.filter((r) => r.turn_limit === 1), avg = (l, k) => { const v = l.map((r) => r[k]).filter((x) => typeof x === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
  t.last_damage_tl = avg(tl, "last_damage_turn"); t.quiet_end_tl = avg(tl, "quiet_end");
  t.ms = s("bot_ms") / Math.max(1, s("bot_turns")); t.ms_max = Math.max(0, ...list.map((r) => r.bot_ms_max_turn || 0));
  t.pos = s("bot_positions") / Math.max(1, s("bot_turns")); t.pos_max = Math.max(0, ...list.map((r) => r.bot_positions_max_turn || 0));
  t.lone = s("lone_losing_n") + s("lone_losing_s");
  t.errors = list.filter((r) => r.error).length; t.refused = s("refused"); t.bot_errors = s("bot_errors");
  return t;
}
const S = (m) => sum(by(m));
const fmtShare = (t) => `${pct(t.share, 1)} (${t.z >= 0 ? "+" : ""}${t.z.toFixed(1)} SE; decisive ${t.aw}–${t.bw}, tiebreak ${t.atb}–${t.btb}, draws ${t.ad})`;

say(`# Brief 019 results\n\nRun folders: ${Object.entries(runs).map(([k, v]) => `${k}: ${v ? path.relative(root, v) : "(not filed yet)"}`).join("; ")}.\n`);

// ---- 1. Baselines and 5. mirrors: the full table ----
const tableRows = [["b5-v35-5v5", "Brain 5 mirror, v3.5, 5v5"], ["b5-v36-5v5", "Brain 5 mirror, v3.6, 5v5"], ["b7-mirror-5v5", "Brain 7 mirror, v3.6, 5v5"], ["b5-v35-7v7", "Brain 5 mirror, v3.5, 7v7"], ["b5-v36-7v7", "Brain 5 mirror, v3.6, 7v7"], ["b7-mirror-7v7", "Brain 7 mirror, v3.6, 7v7"]];
say("## Baseline and mirrors (balanced, 1,000 games each, same deals)\n");
say("| | Holder KO | Pull KO | TKO | Tiebreak win | Draw | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive | Lead lost | Lead unused | Units lost alone / together | Holder strikes solo / group | Last damage (turn-limit games) | Quiet side-turns at the end (turn-limit games) |");
say("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const [m, label] of tableRows) { const t = S(m); if (!t.n) continue; say(`| ${label} | ${pct(t.holder_ko, t.n)} | ${pct(t.pull_ko, t.n)} | ${pct(t.tko, t.n)} | ${pct(t.tb, t.n)} | ${pct(t.draw, t.n)} | ${pct(t.tl, t.n)} | ${pct(t.pulls, t.n)} | ${f1(t.turn)} | ${pct(t.fm, 1)} | ${pct(t.lead_lost, t.n)} | ${pct(t.lead_unused, t.n)} | ${(t.alone / t.n).toFixed(2)} / ${(t.together / t.n).toFixed(2)} | ${(t.solo / t.n).toFixed(2)} / ${(t.group / t.n).toFixed(2)} | ${f1(t.last_damage_tl)} | ${f1(t.quiet_end_tl)} |`); }
say("");

// ---- 3. Head-to-head and 4. how Brain 7 wins ----
say("## Brain 7 against Brain 5 (1,000 games each; Brain 7 is A, each side and move order equally)\n");
for (const [m, label] of [["b7-v-b5-5v5", "balanced 5v5"], ["b7-v-b5-7v7", "balanced 7v7"], ["b7-v-b5-light-5v5", "all-Light 5v5"], ["b7-v-b5-light-7v7", "all-Light 7v7"]]) { const t = S(m); if (t.n) say(`- ${label}: Brain 7 took ${fmtShare(t)}; ended on the turn limit ${pct(t.tl, t.n)}.`); }
say("\n**How the games are won** (share of all wins in the matchup):\n");
say("| | KO (holder) | KO (pull) | TKO | Tiebreak |\n|---|---|---|---|---|");
const winsBy = (list, side) => { const w = list.filter((r) => side === "a" ? /^win/.test(r.a_result) : side === "b" ? /^loss/.test(r.a_result) : r.winner === "N" || r.winner === "S"); const n = w.length; const c = (e) => w.filter((r) => r.end === e).length; return n ? `| ${pct(c("holder_ko"), n)} | ${pct(c("pull_ko"), n)} | ${pct(c("tko"), n)} | ${pct(c("tiebreak_win"), n)} | (${n} wins)` : "| - | - | - | - |"; };
for (const s of ["5v5", "7v7"]) {
  say(`| Brain 7's wins against Brain 5, ${s} ${winsBy(by("b7-v-b5-" + s), "a")}`);
  say(`| Brain 5's wins against Brain 7, ${s} ${winsBy(by("b7-v-b5-" + s), "b")}`);
  say(`| Brain 5 mirror wins, v3.6, ${s} ${winsBy(by("b5-v36-" + s), "all")}`);
}
say("");

// ---- 2. B6 storm or hold ----
say("## B6: ahead on both material and flag damage, storm or hold (against Brain 5)\n");
const sweep = [["1.0", "storm1-v-b5-"], ["1.5 (shipped)", "b7-v-b5-"], ["2.0", "storm2-v-b5-"]];
say("| stormLead | Format | Games against Brain 5 | Brain 7's share | Games where Brain 7 was ahead on both | Of those: Brain 7 won KO/TKO | won tiebreak | draw | lost tiebreak | lost KO/TKO | First turn ahead on both (avg) | Side-turns storming / holding |");
say("|---|---|---|---|---|---|---|---|---|---|---|---|");
const links = {};
for (const [v, pre] of sweep) for (const s of ["5v5", "7v7"]) {
  const list = by(pre + s); if (!list.length) continue;
  const t = sum(list);
  const both = list.filter((r) => { const x = r.a_side.toLowerCase(); return r["b7_both_" + x] > 0; });
  const res = (k) => both.filter((r) => r.a_result === k).length;
  const side = (r) => r.a_side.toLowerCase();
  const st = both.reduce((a, r) => a + r["b7_storm_" + side(r)], 0), hd = both.reduce((a, r) => a + r["b7_hold_" + side(r)], 0);
  const first = both.reduce((a, r) => a + r["b7_both_first_" + side(r)], 0) / Math.max(1, both.length);
  say(`| ${v} | ${s} | ${t.n} | ${pct(t.share, 1)} | ${both.length} | ${res("win")} | ${res("win_tiebreak")} | ${res("draw")} | ${res("loss_tiebreak")} | ${res("loss")} | ${f1(first)} | ${st} / ${hd} |`);
  const pick = (k, n) => both.filter((r) => k(r.a_result)).slice(0, n);
  (links[v] = links[v] || []).push(...pick((x) => /^win/.test(x), 3).concat(pick((x) => !/^win/.test(x), 2)).map((r) => `[${s} ${r.a_result.replace("_", " ")}, ${r.how}, turn ${r.turns}](${r.replay})`));
}
say("\nReplay links (Brain 7 ahead on both at some point; a mix of wins and losses):\n");
for (const v in links) say(`- stormLead ${v}: ${links[v].join(" · ")}`);
say("");

// ---- 6. one behaviour at a time ----
say("## One behaviour at a time (1,000 games each)\n");
say("| Brain 7 with | vs Brain 5, 5v5 | vs Brain 5, 7v7 | Mirror 5v5: turn limit / lead lost / lead unused | Mirror 7v7: turn limit / lead lost / lead unused |\n|---|---|---|---|---|");
const mirrorCell = (m) => { const t = S(m); return t.n ? `${pct(t.tl, t.n)} / ${pct(t.lead_lost, t.n)} / ${pct(t.lead_unused, t.n)}` : "-"; };
const vsCell = (m) => { const t = S(m); return t.n ? `${pct(t.share, 1)} (${t.z >= 0 ? "+" : ""}${t.z.toFixed(1)} SE)` : "-"; };
for (const [k, label] of [["b1", "B1 only"], ["b1b2", "B1 + B2"], ["b1b3", "B1 + B3"], ["b1b4", "B1 + B4"], ["b1b5", "B1 + B5"]]) say(`| ${label} | ${vsCell(k + "-v-b5-5v5")} | ${vsCell(k + "-v-b5-7v7")} | ${mirrorCell(k + "-mirror-5v5")} | ${mirrorCell(k + "-mirror-7v7")} |`);
say(`| all five (shipped) | ${vsCell("b7-v-b5-5v5")} | ${vsCell("b7-v-b5-7v7")} | ${mirrorCell("b7-mirror-5v5")} | ${mirrorCell("b7-mirror-7v7")} |`);
say(`| Brain 5 (baseline) | - | - | ${mirrorCell("b5-v36-5v5")} | ${mirrorCell("b5-v36-7v7")} |`);
say("");

// ---- 7. speed ----
say("## Speed (the lab's machines; positions scored = plans examined, machine-independent)\n");
for (const [m, label] of [["b5-v36-5v5", "Brain 5 mirror 5v5"], ["b7-mirror-5v5", "Brain 7 mirror 5v5"], ["b5-v36-7v7", "Brain 5 mirror 7v7"], ["b7-mirror-7v7", "Brain 7 mirror 7v7"], ["b7-v-b5-light-7v7", "Brain 7 v Brain 5 all-Light 7v7"]]) { const t = S(m); if (t.n) say(`- ${label}: ${t.ms.toFixed(0)} ms per side-turn on average, worst ${(t.ms_max / 1000).toFixed(2)} s${t.ms_max > 4600 ? " (over 4.6 s: flagged)" : ""}; ${t.pos.toFixed(0)} positions scored per side-turn, worst ${t.pos_max}.`); }
say("");

// ---- B2's own count: lone losing attacks while ahead ----
say("## Lone losing attacks made while ahead (B2's test, counted for both brains)\n");
for (const [m, label] of [["b5-v36-5v5", "Brain 5 mirror 5v5"], ["b7-mirror-5v5", "Brain 7 mirror 5v5"], ["b5-v36-7v7", "Brain 5 mirror 7v7"], ["b7-mirror-7v7", "Brain 7 mirror 7v7"]]) { const t = S(m); if (t.n) say(`- ${label}: ${(t.lone / t.n).toFixed(3)} per game`); }
say("");

// ---- settings review ----
const set = G["brain7-settings"];
if (set.length) {
  say("## Settings review (each setting against Brain 5, same deals as the shipped Brain 7; a gap under 4 points is not evidence, F23)\n");
  say("| Setting | 5v5 share (change) | 7v7 share (change) | Turn limit 5v5 / 7v7 | Verdict |\n|---|---|---|---|---|");
  const base = { "5v5": S("b7-v-b5-5v5"), "7v7": S("b7-v-b5-7v7") };
  const names = [...new Set(set.map((r) => r.matchup.replace(/-(5v5|7v7)$/, "")))];
  for (const k of names) {
    const a = S(k + "-5v5"), b = S(k + "-7v7");
    const d5 = 100 * (a.share - base["5v5"].share), d7 = 100 * (b.share - base["7v7"].share);
    const moved = Math.abs(d5) >= 4 || Math.abs(d7) >= 4;
    say(`| ${k} | ${pct(a.share, 1)} (${d5 >= 0 ? "+" : ""}${d5.toFixed(1)}) | ${pct(b.share, 1)} (${d7 >= 0 ? "+" : ""}${d7.toFixed(1)}) | ${pct(a.tl, a.n)} / ${pct(b.tl, b.n)} | ${moved ? "moves results" : "no effect found"} |`);
  }
  say("");
}

// ---- success bar ----
say("## Success bar\n");
const h5 = S("b7-v-b5-5v5"), h7 = S("b7-v-b5-7v7"), l5 = S("b7-v-b5-light-5v5"), l7 = S("b7-v-b5-light-7v7");
const m5 = S("b7-mirror-5v5"), m7 = S("b7-mirror-7v7"), b5 = S("b5-v36-5v5"), b7 = S("b5-v36-7v7");
if (h5.n && h7.n) say(`1. Beats Brain 5 by 2+ SE at balanced 5v5 (${h5.z.toFixed(1)} SE) and 7v7 (${h7.z.toFixed(1)} SE); all-Light not clearly lost (5v5 ${l5.z.toFixed(1)} SE, 7v7 ${l7.z.toFixed(1)} SE): **${h5.z >= 2 && h7.z >= 2 && l5.z > -2 && l7.z > -2 ? "passes" : "fails"}**.`);
if (m5.n && b5.n) {
  const d = (a, b, k) => 100 * (a[k] / a.n - b[k] / b.n);
  say(`2. Uses its leads: lead lost ${d(m5, b5, "lead_lost").toFixed(1)} points at 5v5 and ${d(m7, b7, "lead_lost").toFixed(1)} at 7v7; lead unused ${d(m5, b5, "lead_unused").toFixed(1)} and ${d(m7, b7, "lead_unused").toFixed(1)} (each must fall by 4+): **${[d(m5, b5, "lead_lost"), d(m7, b7, "lead_lost"), d(m5, b5, "lead_unused"), d(m7, b7, "lead_unused")].every((x) => x <= -4) ? "passes" : "fails"}**.`);
  say(`3. Doesn't stall more: turn-limit share ${pct(m5.tl, m5.n)} vs ${pct(b5.tl, b5.n)} at 5v5, ${pct(m7.tl, m7.n)} vs ${pct(b7.tl, b7.n)} at 7v7: **${m5.tl <= b5.tl && m7.tl <= b7.tl ? "passes" : "fails"}**.`);
}
const errs = all.filter((r) => r.error).length, refused = all.reduce((a, r) => a + (r.refused || 0), 0), be = all.reduce((a, r) => a + (r.bot_errors || 0), 0);
say(`\nGames with an error: ${errs}; actions refused: ${refused}; brain errors: ${be} (over ${all.length} games).`);
console.log(out.join("\n"));
