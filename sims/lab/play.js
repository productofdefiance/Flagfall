// The lab's player (Brief 008): plays part of one or more job orders and writes one JSON row per game.
// node sims/lab/play.js --part <i> --parts <n> --out <file.jsonl> [--board <board folder>] [--site <board url>] <order.json> [...]
// Every game gets a board seed dealt by tests/rng.js and is played exactly as the board plays a Computer vs Computer
// match with that seed (board/watch.js), so its `replay` link opens the same game on the board.
// Games are numbered across all the orders' matchups; part i plays every game whose number % parts == i, so the parts
// can run on separate machines and still add up to the whole run.
"use strict";
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2), opt = {}, orders = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i]; else orders.push(args[i]); }
const part = +(opt.part || 0), parts = +(opt.parts || 1);
const boardDir = path.resolve(opt.board || path.join(__dirname, "..", "..", "board"));
const site = opt.site || "https://productofdefiance.github.io/Flagfall/";
const E = require(path.join(boardDir, "engine.js")), Bot = require(path.join(boardDir, "bot.js")), W = require(path.join(boardDir, "watch.js"));
const { DEFAULT_BRAINS } = require(path.join(boardDir, "brain.js")), V = require(path.join(boardDir, "version.js"));
const rng = require(path.join(boardDir, "tests", "rng.js"));
const { MEASURES, ALWAYS } = require("./measures.js");
const { gamesOf } = require("./order.js");

// A brain is an id, or id:key=value,... with settings changed (a sweep). Since Brief 019 the watch link carries the
// change (n=brain7:stormLead=1), so those games replay on the board too (watch.js brainFromSpec).
function brainOf(spec) { const r = W.brainFromSpec(spec); return { id: String(spec), changed: !!r.mods, brain: r.brain }; }
const lineupText = (l) => l.map((x) => x.card).join(" ");

if (opt.out) fs.mkdirSync(path.dirname(path.resolve(opt.out)), { recursive: true });   // the parts folder may not exist yet
const out = fs.createWriteStream(opt.out || "/dev/stdout");
let played = 0;
for (const file of orders) {
  const order = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const g of gamesOf(order)) {
    if (g.global % parts !== part) continue;
    const mu = g.matchup, A = brainOf(mu.a), B = brainOf(mu.b);
    // seed_as (Brief 019): deal this matchup the seeds of another matchup name, so many matchups share one seed set
    const seed = W.seedFrom(rng(`lab:${order.seed_name || order.id}:${mu.seed_as || mu.name}`, g.index + (mu.seed_from || 0)));
    // Brain A plays each side and each move order equally (as tests/baseline.js did), unless the matchup fixes them.
    const aTeam = mu.a_side || (Math.floor(g.index / 2) % 2 ? "S" : "N"), first = mu.first || (g.index % 2 ? "S" : "N");
    const sideOf = (t) => (t === aTeam ? A : B);
    const spec = { seed, v: V.game || null, rules: mu.rules, format: mu.format, n: sideOf("N").id, s: sideOf("S").id,
      mixN: aTeam === "N" ? mu.mix_a || mu.mix || "mixed" : mu.mix_b || mu.mix || "mixed",
      mixS: aTeam === "S" ? mu.mix_a || mu.mix || "mixed" : mu.mix_b || mu.mix || "mixed", first };
    const brains = { N: sideOf("N").brain, S: sideOf("S").brain };
    // A matchup may switch rules off for a sim-only copy of its rule set (Brief 015): "switches_off": ["flagBlocksLine"].
    const off = Array.isArray(mu.switches_off) ? mu.switches_off : [];
    let rsChanged = null;
    if (off.length) {
      const base = W.rulesById(mu.rules);
      if (!base) throw new Error(`Rule set ${mu.rules} is not on this board`);
      rsChanged = JSON.parse(JSON.stringify(base));
      for (const k of off) { if (!(k in rsChanged.switches)) throw new Error(`Rule set ${mu.rules} has no switch ${k}`); rsChanged.switches[k] = false; }
    }
    const ctx = { E, Bot, aTeam, brains };
    const names = ALWAYS.concat((mu.measures || order.measures || []).filter((n) => !ALWAYS.includes(n)));
    const unknown = names.filter((n) => !MEASURES[n]);
    const ms = names.filter((n) => MEASURES[n]).map((n) => MEASURES[n].make(ctx));
    let row;
    try {
      const { m, st } = W.playOut(spec, {
        brains, rs: rsChanged || undefined,
        before: (s, c, t) => { for (const x of ms) if (x.before) x.before(s, c, t); },
        after: (s, c, r) => { for (const x of ms) if (x.after) x.after(s, c, r); }
      });
      const res = st.result;
      row = { order: order.id, matchup: mu.name, game: g.index, seed, version: V.game || "build " + V.build, rules: mu.rules, format: mu.format,
        lineup_n: lineupText(m.opts.lineups.N), lineup_s: lineupText(m.opts.lineups.S), brain_n: sideOf("N").id, brain_s: sideOf("S").id, first: st.first,
        winner: res ? res.winner || "draw" : "unfinished", how: res ? res.how : "unfinished", turns: st.turn,
        flag_damage_n: +st.pole.S.toFixed(2), flag_damage_s: +st.pole.N.toFixed(2), units_lost_n: E.beingsLost(st, "N"), units_lost_s: E.beingsLost(st, "S"),
        a_side: aTeam,
        replay: rsChanged ? "not replayable: rule switches changed for this run" : site + W.toQuery(spec) };
      if (off.length) row.switches_off = off.join(" ");
      for (const x of ms) Object.assign(row, x.end(st));
      if (unknown.length) row.unknown_measures = unknown.join(" ");
    } catch (e) {
      row = { order: order.id, matchup: mu.name, game: g.index, seed, error: String(e && e.message || e) };
    }
    out.write(JSON.stringify(row) + "\n");
    played++;
  }
}
out.end();
if (opt.out) console.error(`part ${part + 1} of ${parts}: ${played} games`);
