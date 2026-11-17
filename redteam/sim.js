// Independent sim harness. node sim.js <size> <games> <brainA> <brainB> [lineupA csv] [seed]
const E = require("../board/engine.js"), Bot = require("../board/bot.js");
const { PRESETS } = require("../board/data.js"); const { DEFAULT_BRAINS } = require("../board/brain.js");
const [sizeS, gamesS, aId, bId, lineA, seedS, rsId] = process.argv.slice(2);
const size = +sizeS, games = +gamesS, BA = DEFAULT_BRAINS[aId], BB = DEFAULT_BRAINS[bId];
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === (rsId || "v3"))));
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(+(seedS || 12345));
const mk = (codes) => { const n = {}; return codes.map((c) => { n[c] = (n[c] || 0) + 1; return { id: n[c] === 1 ? c : c + n[c], card: c }; }); };
const balanced = size === 5 ? ["HM", "HM", "HA", "LM", "LR"] : ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];   // what the board gives the bot
const LA_ = lineA && lineA !== "-" ? lineA.split(",") : balanced;
const T = { games, how: {}, koEmptyPull: 0, koHolderKilled: 0, koEarlyCollapse: 0, turns: [], firstWins: 0, decisive: 0, aWins: 0, bWins: 0, draws: 0,
  pulls: 0, pullGames: 0, cmdSpent: 0, cmdTurns: 0, cmdBound: 0, cmdFull: 0, holderCapturedOff: 0, holderWalkedOff: 0, holderTurns: 0, emptyFlagTurns: 0, braces: 0, unitTurns: 0, attacks: 0, minHits: 0,
  lightStart: 0, lightDead: 0, heavyStart: 0, heavyDead: 0, dodgeSum: 0, dodgeN: 0, actionsPerTurn: 0, unitsActed: 0, unitsAlive: 0, stuck: 0 };
for (let g = 0; g < games; g++) {
  const first = g % 2 ? "S" : "N", aTeam = Math.floor(g / 2) % 2 ? "S" : "N";
  const brainOf = (t) => (t === aTeam ? BA : BB);
  const st = E.newMatch(rs, { first, lineups: { [aTeam]: mk(LA_), [E.foeOf(aTeam)]: mk(balanced) } });
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brainOf(t), rnd) });
  let n = 0, pulls = 0, lastKey = "", acted = new Set();
  while (st.phase === "play" && n++ < 6000) {
    const team = st.toMove, key = st.turn + team;
    if (key !== lastKey) { lastKey = key; acted = new Set(); const mine = E.alive(st).filter((u) => u.team === team); T.unitTurns += mine.length; T.unitsAlive += mine.length;
      for (const t of ["N", "S"]) { if (E.holderOf(st, t)) T.holderTurns++; else T.emptyFlagTurns++; } }
    const c = Bot.chooseAction(st, brainOf(team), rnd), a = c.action;
    const u = a.uid && E.unitByUid(st, a.uid), wasHolder = u && E.isHolder(st, u);
    const cmdBefore = st.cmd, turnRec = st.spend[st.spend.length - 1];
    let bound = false;
    if (a.type === "end") { // was Command the reason? any unit with stamina and a legal action it can't afford
      bound = E.alive(st).some((x) => x.team === team && !x.done && x.stam >= 1 && st.cmd < 1);
    }
    const tgt = a.type === "attack" ? E.unitByUid(st, a.target) : null;
    const bd = tgt ? E.breakdown(st, u, tgt, u.hex) : null;
    const r = E.act(st, a, () => E.rollWith(st, rnd));
    if (!r.ok) { E.act(st, { type: "end" }); continue; }
    if (u) acted.add(u.uid);
    if (a.type === "end") { T.cmdSpent += turnRec.cmd - cmdBefore; T.cmdTurns++; if (bound) T.cmdBound++; if (cmdBefore < 0.5) T.cmdFull++; T.unitsActed += acted.size; }
    if (a.type === "pull") { pulls++; T.pulls++; }
    if (a.type === "brace") T.braces++;
    if (a.type === "attack") { T.attacks++; if (r.dmg <= rs.game.minDamage + 1e-9) T.minHits++; if (E.card(st, tgt).dodge) { T.dodgeSum += bd.dodge; T.dodgeN++; } }
    if (wasHolder && u.hp > 0 && u.hex !== E.FLAG[u.team]) { if (a.type === "attack") T.holderCapturedOff++; else T.holderWalkedOff++; }
    if (st.result && st.result.how === "KO") {
      const txt = st.log[st.log.length - 2].text;
      if (a.type === "pull") T.koEmptyPull++; else { T.koHolderKilled++; if (/pooled:/.test(txt)) T.koEarlyCollapse++; }
    }
  }
  if (!st.result) { T.stuck++; continue; }
  const how = st.result.how; T.how[how] = (T.how[how] || 0) + 1; T.turns.push(st.turn);
  if (pulls) T.pullGames++;
  const w = st.result.winner;
  if (!w) T.draws++; else { T.decisive++; if (w === first) T.firstWins++; if (w === aTeam) T.aWins++; else T.bWins++; }
  for (const x of st.units) { const lt = Bot.classOf(E.card(st, x)) === "light"; if (lt) { T.lightStart++; if (x.hp <= 0) T.lightDead++; } else { T.heavyStart++; if (x.hp <= 0) T.heavyDead++; } }
}
T.turns.sort((a, b) => a - b); const med = T.turns[Math.floor(T.turns.length / 2)];
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + "%" : "-");
console.log(JSON.stringify({ size, games, A: aId, B: bId, lineA: LA_.join(","), how: T.how, A_wins: T.aWins, B_wins: T.bWins, draws: T.draws, medianTurn: med,
  KO_by_pull_on_empty_flag: T.koEmptyPull, KO_by_killing_holder: T.koHolderKilled, of_which_early_rounding_collapse: T.koEarlyCollapse,
  firstMoverWinsOfDecisive: pct(T.firstWins, T.decisive), pullsPerGame: (T.pulls / games).toFixed(2), gamesWithAnyPull: pct(T.pullGames, games),
  avgCommandSpentPerTurn: (T.cmdSpent / T.cmdTurns).toFixed(2), turnsEndedBecauseCommandRanOut: pct(T.cmdBound, T.cmdTurns), turnsUsingAllCommand: pct(T.cmdFull, T.cmdTurns),
  unitsActedPerTurn: (T.unitsActed / T.cmdTurns).toFixed(2), unitsAlivePerTurn: (T.unitsAlive / T.cmdTurns).toFixed(2),
  holderDraggedOffFlagByCapture: T.holderCapturedOff, holderWalkedOffFlag: T.holderWalkedOff, flagEmptyShareOfTurns: pct(T.emptyFlagTurns, T.emptyFlagTurns + T.holderTurns),
  bracesPerUnitTurn: (T.braces / T.unitTurns).toFixed(3), minDamageHits: pct(T.minHits, T.attacks), avgDodgeWhenHit: (T.dodgeSum / T.dodgeN).toFixed(1) + "%",
  lightRemoved: pct(T.lightDead, T.lightStart), heavyRemoved: pct(T.heavyDead, T.heavyStart), stuck: T.stuck }));
