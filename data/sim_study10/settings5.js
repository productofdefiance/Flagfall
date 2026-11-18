// Settings review for Brain 5: how often its planned turn changes when one weight is set to 0, halved or doubled.
const B = process.argv[2];
const E = require(B + "/engine.js"), Bot = require(B + "/bot.js"), { PRESETS } = require(B + "/data.js"), { DEFAULT_BRAINS } = require(B + "/brain.js");
const rs = PRESETS[PRESETS.length - 1], B5 = DEFAULT_BRAINS.brain5;
const rnd = require(B + "/tests/rng.js")("settings5", 0);
const lineups = { balanced: { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, light: { 5: { LM: 2, LA: 2, LR: 1 }, 7: { LM: 3, LA: 2, LR: 2 } } };
// sample positions: the start of a side's turn, every 3rd turn, from Brain 5 mirror games
const pos = [];
for (const mode of ["balanced", "light"]) for (const size of [5, 7]) for (let g = 0; g < 3; g++) {
  const line = []; for (const code of Object.keys(rs.cards)) for (let i = 0; i < (lineups[mode][size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  const st = E.newMatch(rs, { first: g % 2 ? "S" : "N", lineups: { N: line, S: line } });
  for (const t of [st.first, E.foeOf(st.first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B5, rnd) });
  let key = "", k = 0;
  while (st.phase === "play" && k++ < 3000 && pos.length < 200) {
    if (st.turn + st.toMove !== key) { key = st.turn + st.toMove; if (st.turn % 3 === 0 && st.turn > 1) pos.push(E.clone(st)); }
    const a = Bot.chooseAction(st, B5, rnd).action; if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) E.act(st, { type: "end" });
  }
}
const sample = pos.filter((_, i) => i % Math.ceil(pos.length / 60) === 0).slice(0, 60);
const planKey = (st, b) => JSON.stringify(Bot.planTurn5(st, b).steps);
const base = sample.map((st) => planKey(st, B5));
const out = [];
for (const k of Object.keys(B5.model).concat(Object.keys(B5.plan5).map((x) => "plan5." + x))) {
  const row = { k };
  for (const [lab, f] of [["0", () => 0], ["half", (v) => v / 2], ["double", (v) => v * 2]]) {
    const b = JSON.parse(JSON.stringify(B5));
    if (k.startsWith("plan5.")) { const kk = k.slice(6); b.plan5[kk] = Math.max(1, Math.round(f(b.plan5[kk]))); } else b.model[k] = f(b.model[k]);
    let changed = 0; sample.forEach((st, i) => { if (planKey(st, b) !== base[i]) changed++; });
    row[lab] = changed;
  }
  out.push(row);
}
console.log(`positions: ${sample.length}`);
for (const r of out) console.log(`${r.k.padEnd(16)} plan changes at 0: ${r["0"]}, at half: ${r.half}, at double: ${r.double}`);
