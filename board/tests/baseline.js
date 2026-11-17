// The fixed baseline (red team report, Part 3 item 4): re-run after every bot or rule change.
// node tests/baseline.js <presetId> <size 5|7> <games> <brainA> <brainB> <lineups: balanced|kit> [shard]
// Brain A plays each side and each move order equally. Prints one JSON line of counts; tests/baseline_sum.py adds shards.
// Tiebreak wins are reported apart and never counted as wins.
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const [rsId, sizeS, gamesS, aId, bId, mode, shardS] = process.argv.slice(2);
const size = +sizeS, games = +gamesS, shard = +(shardS || 0), BA = DEFAULT_BRAINS[aId], BB = DEFAULT_BRAINS[bId];
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === rsId)));
const rnd = require("./rng.js")(`baseline:${rsId}:${size}:${aId}:${bId}:${mode}`, shard);
const balanced = size === 5 ? { HM: 2, HA: 1, LM: 1, LR: 1 } : { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 };   // what the board gives a bot by default
const lineupOf = (B) => { const c = (mode === "kit" && Bot.squadCounts(rs, size, B)) || balanced, out = [];
  for (const code of Object.keys(rs.cards)) for (let i = 0; i < (c[code] || 0); i++) out.push({ id: i ? code + (i + 1) : code, card: code });
  return out; };
const T = { rs: rsId, size, A: aId, B: bId, mode, games: 0, koHolderKilled: 0, koPull: 0, tko: 0, tiebreakWin: 0, draw: 0, stuck: 0,
  aWins: 0, bWins: 0, aTiebreak: 0, bTiebreak: 0, firstMoverWins: 0, decisive: 0, pulls: 0, gamesWithPull: 0,
  holderDraggedOff: 0, holderWalkedOff: 0, parries: 0, turnSum: 0, unitsRemoved: 0, unitsStart: 0, cmdSpent: 0, sideTurns: 0, unitsActed: 0 };
for (let g = 0; g < games; g++) {
  const k = g + shard * games;
  const first = k % 2 ? "S" : "N", aTeam = Math.floor(k / 2) % 2 ? "S" : "N", brainOf = (t) => (t === aTeam ? BA : BB);
  const st = E.newMatch(rs, { first, lineups: { N: lineupOf(brainOf("N")), S: lineupOf(brainOf("S")) } });
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brainOf(t), rnd) });
  let n = 0, pulls = 0, lastA = null, key = "", acted = new Set();
  while (st.phase === "play" && n++ < 6000) {
    if (st.turn + st.toMove !== key) { key = st.turn + st.toMove; acted = new Set(); }
    const a = Bot.chooseAction(st, brainOf(st.toMove), rnd).action;
    const u = a.uid && E.unitByUid(st, a.uid), wasHolder = u && E.isHolder(st, u);
    const rec = st.spend[st.spend.length - 1], cmd0 = st.cmd, log0 = st.log.length;
    const r = E.act(st, a, () => E.rollWith(st, rnd));
    if (!r.ok) { E.act(st, { type: "end" }); continue; }
    for (let i = log0; i < st.log.length; i++) if (st.log[i].text.includes("; parry deals ")) T.parries++;   // parries that fired (Brief 002)
    if (u) acted.add(u.uid);
    if (a.type === "end") { T.cmdSpent += rec.cmd - cmd0; T.sideTurns++; T.unitsActed += acted.size; }
    if (a.type === "pull") pulls++;
    if (wasHolder && u.hp > 0 && u.hex !== E.FLAG[u.team]) { if (a.type === "attack") T.holderDraggedOff++; else T.holderWalkedOff++; }
    lastA = a;
  }
  T.games++; T.pulls += pulls; if (pulls) T.gamesWithPull++;
  for (const x of st.units) { T.unitsStart++; if (x.hp <= 0) T.unitsRemoved++; }
  if (!st.result) { T.stuck++; continue; }
  T.turnSum += st.turn;
  const { winner: w, how } = st.result;
  if (!w) { T.draw++; continue; }
  if (how === "KO") { if (lastA && lastA.type === "pull") T.koPull++; else T.koHolderKilled++; }
  else if (how === "TKO") T.tko++;
  else { T.tiebreakWin++; if (w === aTeam) T.aTiebreak++; else T.bTiebreak++; continue; }
  T.decisive++; if (w === first) T.firstMoverWins++;
  if (w === aTeam) T.aWins++; else T.bWins++;
}
console.log(JSON.stringify(T));
