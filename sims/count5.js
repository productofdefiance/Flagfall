// Brain 5 work per turn: re-plans and positions scored, mirror games. node count5.js <board dir> <mode> <size> <games>
const dir = process.argv[2], mode = process.argv[3], size = +process.argv[4], games = +process.argv[5];
const E = require(dir + "/engine.js"), Bot = require(dir + "/bot.js"), { PRESETS } = require(dir + "/data.js"), { DEFAULT_BRAINS } = require(dir + "/brain.js");
const RS = PRESETS[PRESETS.length - 1], B5 = DEFAULT_BRAINS.brain5, rnd = require(dir + "/tests/rng.js")(`count5:${mode}:${size}`, 0);
const LU = { balanced: { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, light: { 5: { LM: 2, LA: 2, LR: 1 }, 7: { LM: 3, LA: 2, LR: 2 } } };
const line = []; for (const c of Object.keys(RS.cards)) for (let i = 0; i < (LU[mode][size][c] || 0); i++) line.push({ id: i ? c + (i + 1) : c, card: c });
let turns = 0, maxV = 0, maxP = 0;
for (let g = 0; g < games; g++) {
  const first = g % 2 ? "S" : "N", st = E.newMatch(RS, { first, lineups: { N: line, S: line } });
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B5, rnd) });
  let k = 0, tk = null, v0 = 0, p0 = 0;
  while (st.phase === "play" && k++ < 6000) {
    const key = st.turn + st.toMove;
    if (key !== tk) { if (tk) { turns++; maxV = Math.max(maxV, Bot.stats5.values - v0); maxP = Math.max(maxP, Bot.stats5.plans - p0); } tk = key; v0 = Bot.stats5.values; p0 = Bot.stats5.plans; }
    const a = Bot.chooseAction(st, B5, rnd).action, r = E.act(st, a, () => E.rollWith(st, rnd)); if (!r.ok) E.act(st, { type: "end" });
  }
}
console.log(`${mode} ${size}v${size}: ${games} games, ${turns} turns; plans built per turn ${(Bot.stats5.plans / turns).toFixed(1)} (max ${maxP}); positions scored per turn ${(Bot.stats5.values / turns).toFixed(0)} (max ${maxV})`);
