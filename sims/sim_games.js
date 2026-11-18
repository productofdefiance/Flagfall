// Per-game records. node sims/sim_games.js <presetId> <size 5|7> <games> <seedOffset> [overridesJSON]
const E = require("../board/engine.js"), Bot = require("../board/bot.js");
const { PRESETS } = require("../board/data.js"); const { DEFAULT_BRAINS } = require("../board/brain.js");
const B = DEFAULT_BRAINS.standard;
const [id, sizeS, gamesS, offS, ov] = process.argv.slice(2);
const size = +sizeS, games = +gamesS, off = +(offS || 0);
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === id)));
if (ov) { const o = JSON.parse(ov); Object.assign(rs.game, o.game || {}); Object.assign(rs.switches, o.switches || {}); }
if (rs.switches.noKeeper) rs.lineup = (size === 5 ? [["HM","HM"],["HM2","HM"],["HA","HA"],["LM","LM"],["LR","LR"]] : [["HM","HM"],["HM2","HM"],["HA","HA"],["HR","HR"],["LM","LM"],["LA","LA"],["LR","LR"]]).map(([i,c]) => ({ id: i, card: c }));
else rs.lineup = (size === 5 ? [["FK","HM",1],["HM","HM"],["HA","HA"],["LM","LM"],["LR","LR"]] : [["FK","HM",1],["HM","HM"],["HA","HA"],["HR","HR"],["LM","LM"],["LA","LA"],["LR","LR"]]).map(([i,c,f]) => ({ id: i, card: c, fk: !!f }));
const rnd = require("../board/tests/rng.js")("sim_games", off);   // engine generator (was a looping home-made formula)
const aliveOf = (st, t) => st.units.filter((u) => u.team === t && u.hp > 0).length;
for (let g = 0; g < games; g++) {
  const first = (g + off) % 2 ? "S" : "N";
  const st = E.newMatch(rs, { first });
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
  const rec = { first, pulls: { N: 0, S: 0 }, firstPull: null, pullTurns: [], kills: { N: 0, S: 0 }, keeperHomeAtPull: 0, pullersAtOnce: 0 };
  let n = 0;
  while (st.phase === "play" && n++ < 5000) {
    const c = Bot.chooseAction(st, B, rnd); const a = c.action;
    const team = st.toMove; const before = { N: aliveOf(st, "N"), S: aliveOf(st, "S") };
    if (a.type === "pull" && !rec.firstPull) rec.firstPull = { turn: st.turn, team, alive: before };
    if (a.type === "pull") { const foe = E.foeOf(team); if (st.units.some((u) => u.team === foe && u.fk && u.hp > 0 && E.GOAL[foe].has(u.hex))) rec.keeperHomeAtPull++; }
    const r = E.act(st, a, () => E.rollWith(st, rnd));
    if (!r.ok) { E.act(st, { type: "end" }); continue; }
    if (a.type === "pull") { rec.pulls[team]++; rec.pullTurns.push(st.turn); }
    const after = { N: aliveOf(st, "N"), S: aliveOf(st, "S") };
    rec.kills.N += before.S - after.S; rec.kills.S += before.N - after.N;
  }
  const w = st.result ? st.result.winner : null;
  const fkAlive = (t) => st.units.some((u) => u.team === t && (u.fk || (E.holderOf && E.holderOf(st, t) === u)) && u.hp > 0);
  console.log(JSON.stringify({ how: st.result ? st.result.how : "stuck", winner: w, turn: st.turn, first,
    alive: { N: aliveOf(st, "N"), S: aliveOf(st, "S") }, fkAlive: { N: fkAlive("N"), S: fkAlive("S") },
    pole: { N: st.pole.N, S: st.pole.S }, pulls: rec.pulls, firstPull: rec.firstPull, keeperHomeAtPull: rec.keeperHomeAtPull, kills: rec.kills }));
}
