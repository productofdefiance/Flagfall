// Kit D checks (Brief 005): over seeded games on the newest preset, Kit D only ever picks actions the engine accepts,
// never throws, and every game finishes. Also checks the planner's switches exist and Kit B is unchanged.
// node tests/test_kitd.js [games per format, default 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const rs = JSON.parse(JSON.stringify(PRESETS[PRESETS.length - 1]));
const games = +(process.argv[2] || 30);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const D = DEFAULT_BRAINS.kitD, B = DEFAULT_BRAINS.kitB;
ok(D && D.planner && ["focus", "pickWeak", "fort", "finish"].every((k) => k in D.planner), "Kit D exists with its four planner switches");
{ const a = JSON.parse(JSON.stringify(D)); delete a.planner; for (const k of ["id", "name", "note"]) { delete a[k]; }
  const b = JSON.parse(JSON.stringify(B)); for (const k of ["id", "name", "note"]) { delete b[k]; }
  ok(JSON.stringify(a) === JSON.stringify(b), "Kit D is Kit B plus the planner"); }
ok(!B.planner && !DEFAULT_BRAINS.batchC.planner && !DEFAULT_BRAINS.standard.planner, "older brains have no planner");
const balanced = { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } };
for (const size of [5, 7]) {
  const rnd = require("./rng.js")(`kitd-legal:${rs.id}:${size}`, 0);
  const line = []; for (const code of Object.keys(rs.cards)) for (let i = 0; i < (balanced[size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  let refused = 0, errors = 0, unfinished = 0, actions = 0; const sample = [];
  for (let g = 0; g < games; g++) {
    const first = g % 2 ? "S" : "N", brain = (t) => (g % 4 < 2 ? (t === "N" ? D : B) : D);   // half Kit D vs Kit B, half Kit D vs Kit D
    const st = E.newMatch(rs, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brain(t), rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 6000) {
      const B0 = brain(st.toMove);
      let a; try { a = Bot.chooseAction(st, B0, rnd).action; } catch (e) { errors++; if (sample.length < 3) sample.push("threw: " + e.message); a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd)); actions++;
      if (!r.ok) { if (B0 === D) { refused++; if (sample.length < 3) sample.push(JSON.stringify(a) + " " + r.error); } E.act(st, { type: "end" }); }
    }
    if (!st.result) unfinished++;
  }
  console.log(`${size}v${size}: ${games} games, ${actions} actions; Kit D actions refused: ${refused}; bot errors: ${errors}; unfinished: ${unfinished}`);
  for (const x of sample) console.log("  " + x);
  ok(refused === 0, `${size}v${size}: the engine accepted every Kit D action`);
  ok(errors === 0, `${size}v${size}: Kit D never threw`);
  ok(unfinished === 0, `${size}v${size}: every game finished`);
}
console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
