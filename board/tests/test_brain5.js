// @test job=brains quick=2 release=30 night=30
// Brain 5 checks (Brief 006): three positions that show the model's reasoning, then legal play over seeded games.
// node tests/test_brain5.js [games per format and lineup, default 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const RS = PRESETS[PRESETS.length - 1], B5 = DEFAULT_BRAINS.brain5;
const games = +(process.argv[2] || 30);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(lineN, lineS, place) {
  const st = E.newMatch(RS, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
ok(B5 && B5.model && B5.name.startsWith("Brain 5"), "Brain 5 exists, named in full");
ok(!DEFAULT_BRAINS.kitD.model && !DEFAULT_BRAINS.kitB.model, "older brains have no Brain 5 model");

// ---- 1. A Light Melee that can reach its target from two hexes picks the one that leaves a safer Evade step ----
// South's Heavy Anti-Cavalry at E10; a South Heavy Ranged at B14, too far to attack this turn, will cover the west side
// next turn (2 steps + range 4). North's Light Melee can hit the Anti-Cavalry from either side; stepping away on the west
// would leave it in the archer's reach.
// The Anti-Cavalry is wounded (10 HP), so the attack is worth making; the Light Melee starts one step from it.
{ const st = setup([["LM", "LM"], ["HM", "HM"]], [["HA", "HA"], ["HR", "HR"]], { "N-LM": "E8", "N-HM": "E3", "S-HA": "E10", "S-HR": "B14" });
  U(st, "S-HA").hp = 10;
  const plan = Bot.planTurn5(st, B5);
  const mv = plan.steps.find((a) => a.uid === "N-LM" && a.type === "move"), atk = plan.steps.findIndex((a) => a.uid === "N-LM" && a.type === "attack");
  const after = atk >= 0 ? plan.steps.slice(atk + 1).find((a) => a.uid === "N-LM" && a.type === "move") : null;
  console.log(`  1. plan: ${plan.steps.map((a) => a.type + (a.to ? " " + a.to : a.target ? " " + a.target : "") + "(" + a.uid + ")").join(", ")}`);
  ok(mv && atk >= 0, "1: the Light Melee moves in and attacks");
  const col = (h) => E.parse(h)[0];
  ok(mv && col(mv.to) >= col("E10"), `1: it attacks from the side away from the archer (from ${mv && mv.to})`);
  ok(after && E.dist(after.to, "B14") > 6, `1: and its Evade step is out of the archer's reach next turn (to ${after && after.to}, ${after && E.dist(after.to, "B14")} hexes from it)`);
  // the reasoning: the expected damage it would take after evading east vs west
  const risk = (hex) => { const s = E.cloneLite(st); U(s, "N-LM").hex = hex; U(s, "N-LM").stam = 1; return Bot.value5(s, "N", B5); };
  console.log(`     value after stepping to ${after && after.to}: ${after ? risk(after.to).toFixed(1) : "-"}; after the best west step (C9): ${risk("C9").toFixed(1)}`);
}

// ---- 2. With Command for three attacks, it doesn't move a fourth unit into place for an attack it can't pay for ----
// Three North units already next to a South Heavy Melee; a fourth could walk up. Command: 3 (one attack each).
{ const st = setup([["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"]], [["HM", "HM"], ["LR", "LR"]],
    { "S-HM": "E10", "N-HM": "E9", "N-HM2": "D10", "N-HA": "F10", "N-LM": "E6", "S-LR": "I14" });
  st.cmd = 3;
  const plan = Bot.planTurn5(st, B5);
  const attacks = plan.steps.filter((a) => a.type === "attack"), moves = plan.steps.filter((a) => a.type === "move");
  console.log(`  2. plan: ${plan.steps.map((a) => a.type + (a.to ? " " + a.to : a.target ? " " + a.target : "") + "(" + a.uid + ")").join(", ")}`);
  ok(attacks.length === 3, `2: three attacks with three Command (got ${attacks.length})`);
  ok(!moves.some((m) => !attacks.some((a) => a.uid === m.uid)), "2: no unit moves for an attack it can't pay for");
}

// ---- 3. A unit braces when two enemies can reach it next turn, and doesn't when none can ----
// North's Heavy Melee holds its flag (it won't leave it). Two South units 3–4 hexes away: in reach next turn.
{ const near = setup([["HM", "HM"]], [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E3", "S-HM": "E7", "S-LM": "D6" });
  const pn = Bot.planTurn5(near, B5);
  const sn = E.cloneLite(near); E.apply(sn, { type: "brace", uid: "N-HM" });
  console.log(`  3. enemies near: plan ${JSON.stringify(pn.steps)}; value braced ${Bot.value5(sn, "N", B5).toFixed(1)} vs not ${Bot.value5(near, "N", B5).toFixed(1)}`);
  ok(pn.steps.some((a) => a.type === "brace" && a.uid === "N-HM"), "3: braces with two enemies able to reach it next turn");
  const far = setup([["HM", "HM"]], [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E3", "S-HM": "E16", "S-LM": "D15" });
  const pf = Bot.planTurn5(far, B5);
  const sf = E.cloneLite(far); E.apply(sf, { type: "brace", uid: "N-HM" });
  console.log(`     enemies far: plan ${JSON.stringify(pf.steps)}; value braced ${Bot.value5(sf, "N", B5).toFixed(1)} vs not ${Bot.value5(far, "N", B5).toFixed(1)}`);
  ok(!pf.steps.some((a) => a.type === "brace"), "3: doesn't brace when no enemy can reach it");
}

// ---- Legal play: Brain 5 vs Kit D and vs itself, balanced and all-Light, both formats ----
const LINEUPS = { balanced: { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, light: { 5: { LM: 2, LA: 2, LR: 1 }, 7: { LM: 3, LA: 2, LR: 2 } } };
for (const mode of ["balanced", "light"]) for (const size of [5, 7]) {
  if (!games) break;
  const rnd = require("./rng.js")(`brain5-legal:${RS.id}:${mode}:${size}`, 0);
  const line = []; for (const code of Object.keys(RS.cards)) for (let i = 0; i < (LINEUPS[mode][size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  let refused = 0, errors = 0, unfinished = 0, actions = 0; const sample = [];
  for (let g = 0; g < games; g++) {
    const first = g % 2 ? "S" : "N", brain = (t) => (g % 4 < 2 ? (t === "N" ? B5 : DEFAULT_BRAINS.kitD) : B5);
    const st = E.newMatch(RS, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brain(t), rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 6000) {
      const B0 = brain(st.toMove);
      let a; try { a = Bot.chooseAction(st, B0, rnd).action; } catch (e) { errors++; if (sample.length < 3) sample.push("threw: " + e.message); a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd)); actions++;
      if (!r.ok) { if (B0 === B5) { refused++; if (sample.length < 3) sample.push(JSON.stringify(a) + " " + r.error); } E.act(st, { type: "end" }); }
    }
    if (!st.result) unfinished++;
  }
  console.log(`  ${mode} ${size}v${size}: ${games} games, ${actions} actions; Brain 5 actions refused: ${refused}; errors: ${errors}; unfinished: ${unfinished}`);
  for (const x of sample) console.log("    " + x);
  ok(refused === 0 && errors === 0 && unfinished === 0, `${mode} ${size}v${size}: every Brain 5 action legal, no errors, every game finished`);
}
console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
