// Why do flags fall? Plays brain A vs B and classifies each KO: empty-flag pull vs holder killed on the flag.
// node tests/flagdiag.js <brainA[|json]> <brainB[|json]> <games> [presetId, default v3.1]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const [aSpec, bSpec, gamesS, rsId] = process.argv.slice(2);
const merge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) a[k] = merge(a[k] || {}, b[k]); else a[k] = b[k]; } return a; };
const brain = (spec) => { const [base, extra] = spec.split("|"); const b = JSON.parse(JSON.stringify(DEFAULT_BRAINS[base])); return extra ? merge(b, JSON.parse(extra)) : b; };
const BA = brain(aSpec), BB = brain(bSpec);
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === (rsId || "v3.1"))));
rs.lineup = [["HM","HM"],["HM2","HM"],["HA","HA"],["HR","HR"],["LM","LM"],["LA","LA"],["LR","LR"]].map(([i,c])=>({id:i,card:c}));
const rnd = require("./rng.js")("flagdiag", 0);   // engine generator (was a looping home-made formula)
const res = { emptyPull: 0, holderKilled: 0, other: 0, emptyTurns: 0, emptyTurnsThreat: 0, sideTurns: 0, holderLeaves: 0 };
for (let g = 0; g < +gamesS; g++) {
  const st = E.newMatch(rs, { first: g % 2 ? "S" : "N" });
  const brainOf = (t) => (t === "N" ? BA : BB);
  for (const t of [st.first, E.foeOf(st.first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brainOf(t), rnd) });
  let n = 0, last = "", lastA = null;
  while (st.phase === "play" && n++ < 5000) {
    const team = st.toMove;
    if (st.turn + team !== last) { last = st.turn + team; if (team === "N") { res.sideTurns++; if (!E.holderOf(st, "N")) { res.emptyTurns++; } } }
    const heldBefore = E.holderOf(st, team);
    const a = Bot.chooseAction(st, brainOf(team), rnd).action;
    const r = E.act(st, a, () => E.rollWith(st, rnd));
    if (!r.ok) { E.act(st, { type: "end" }); continue; }
    if (team === "N" && heldBefore && !E.holderOf(st, "N")) res.holderLeaves++;
    lastA = a;
  }
  if (st.result && st.result.how === "KO" && st.result.winner === "S") {
    if (lastA.type === "pull") res.emptyPull++; else if (lastA.type === "attack") res.holderKilled++; else res.other++;
  }
}
console.log(JSON.stringify(res));
