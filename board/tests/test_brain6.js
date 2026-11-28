// @test job=brains quick=2 release=30 night=30
// Brain 6 checks (Brief 007): the clock in two positions, the Evade-step cost, then legal play over seeded games.
// node tests/test_brain6.js [games per format and lineup, default 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const RS = PRESETS[PRESETS.length - 1], B5 = DEFAULT_BRAINS.brain5, B6 = DEFAULT_BRAINS.brain6;
// The hand-built positions (clock 1, clock 2, Evade) were set up on v3.4's dice and stay there (Brief 010). On v3.5 the
// clock 2 attack has the same kill chance and average hit, but its spread tips Brain 5 itself into bracing, so the
// position no longer shows the clock's effect. The seeded games below still play the newest preset.
const RS_POS = PRESETS.find((p) => p.id === "v3.4");
const games = +(process.argv[2] || 30);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(lineN, lineS, place) {
  const st = E.newMatch(RS_POS, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
const fmtPlan = (p) => p.steps.map((a) => a.type + (a.to ? " " + a.to : a.target ? " " + a.target : "") + "(" + a.uid + ")").join(", ") || "(nothing)";
const atTurn = (st, turn) => { const s = E.cloneLite(st); s.turn = turn; return s; };
const FIVE = [["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]];

ok(B6 && B6.model && B6.name.startsWith("Brain 6"), "Brain 6 exists, named in full");
ok(B5.model.clock === undefined && B5.model.evade === undefined, "Brain 5 is unchanged: no clock, no Evade-step cost");
for (const k of ["clock", "clockTurns", "evade"]) ok(B6.model[k] !== undefined && require("../brain.js").BRAIN_LABELS["model." + k], `Brain 6 setting ${k} exists with a plain label`);

// ---- The clock's shape: nothing before the clock starts, full on the last turn, the tiebreak both ways ----
{ const st = setup(FIVE, FIVE, {}), lim = E.turnLimit(st);
  ok(lim === 25, `5v5 turn limit is 25 (got ${lim})`);
  ok(Bot.clockNear(atTurn(st, lim), B6.model) === 1, "clock is full on the last turn");
  ok(Bot.clockNear(atTurn(st, lim - B6.model.clockTurns), B6.model) === 0, "clock is 0 once clockTurns or more turns remain");
  ok(Bot.clockNear(atTurn(st, 3), B6.model) === 0, "clock is 0 early");
  ok(Bot.clockNear(atTurn(st, lim), Object.assign({}, B6.model, { clockTurns: 0 })) === 0, "clockTurns 0 turns the clock off");
  const s = atTurn(st, lim); s.pole.S = 3; s.pole.N = 2;   // North has done more damage to South's flag
  ok(Bot.tiebreakStanding(s, "N") === 1 && Bot.tiebreakStanding(s, "S") === -1, "tiebreak standing: more flag damage leads");
  s.pole.N = 3; U(s, "S-LM").hp = 0;
  ok(Bot.tiebreakStanding(s, "N") === 1 && Bot.tiebreakStanding(s, "S") === -1, "tiebreak standing: flag level, fewer units lost leads");
  U(s, "S-LM").hp = 8;
  ok(Bot.tiebreakStanding(s, "N") === 0, "tiebreak standing: level is 0");
}

// ---- Clock 1: last turn, behind on the tiebreak by less than one attack's damage, the enemy holder in reach ----
// North has done 2 damage to South's flag, South 3 to North's. North's Light Melee at E15 can step next to South's
// holder (a Heavy Melee on its flag at E17) and hit it: hits on a holder count as flag damage (F20).
{ const st = setup(FIVE, FIVE, { "N-HM": "E3", "N-HM2": "D4", "N-HA": "F4", "N-LM": "E15", "N-LR": "C10", "S-HM": "E17", "S-HM2": "D14", "S-HA": "F14", "S-LM": "H12", "S-LR": "B13" });
  st.pole.S = 2; st.pole.N = 3;
  const lim = E.turnLimit(st), last = atTurn(st, lim), early = atTurn(st, lim - 15);
  const hitsHolder = (p) => p.steps.some((a) => a.type === "attack" && a.target === "S-HM");
  const p6 = Bot.planTurn5(last, B6), p5 = Bot.planTurn5(last, B5), p6e = Bot.planTurn5(early, B6);
  console.log(`  clock 1, last turn, Brain 6: ${fmtPlan(p6)} (value ${p6.v.toFixed(1)})`);
  console.log(`          last turn, Brain 5: ${fmtPlan(p5)} (value ${p5.v.toFixed(1)})`);
  console.log(`          15 turns left, Brain 6: ${fmtPlan(p6e)} (value ${p6e.v.toFixed(1)})`);
  // the reasoning: the clock term before and after a hit on the holder
  const s1 = E.cloneLite(last); E.apply(s1, { type: "move", uid: "N-LM", to: "E16" });
  let flip = 0; for (const [d, pr] of E.dieCases(s1)) { const s2 = E.cloneLite(s1); E.apply(s2, { type: "attack", uid: "N-LM", target: "S-HM" }, () => d); if (Bot.tiebreakStanding(s2, "N") >= 0) flip += pr; }
  console.log(`          the hit draws level or better ${(100 * flip).toFixed(0)}% of the time; the clock is worth ${B6.model.clock} × (standing after − before) on the last turn, 0 with 15 left`);
  ok(hitsHolder(p6), "clock 1: on the last turn Brain 6 attacks the enemy holder");
  ok(!hitsHolder(p5), "clock 1: Brain 5 (no clock) doesn't");
  ok(!hitsHolder(p6e), "clock 1: with 15 turns left Brain 6 doesn't either (the clock isn't running yet)");
}

// ---- Clock 2: last turn, ahead on the tiebreak only by fewer units lost: it doesn't throw a unit away ----
// Flags level (4 each); South has lost a unit, North none. North's Light Melee (2 HP) stands next to a braced South
// Heavy Melee (5 HP). Hitting it kills it 8% of the time; otherwise the parry (2) removes the Light Melee, units lost
// become level and the tiebreak a draw.
{ const st = setup(FIVE, FIVE, { "N-HM": "E3", "N-HM2": "D4", "N-HA": "F4", "N-LM": "E11", "N-LR": "C3", "S-HM": "E17", "S-HM2": "E12", "S-HA": "F14", "S-LM": "H12", "S-LR": "B13" });
  U(st, "S-LM").hp = 0; U(st, "N-LM").hp = 2; U(st, "S-HM2").braced = true; U(st, "S-HM2").hp = 5; st.pole.S = 4; st.pole.N = 4;
  const lim = E.turnLimit(st), last = atTurn(st, lim), early = atTurn(st, lim - 15);
  const lmAttacks = (p) => p.steps.some((a) => a.type === "attack" && a.uid === "N-LM");
  const p6 = Bot.planTurn5(last, B6), p5 = Bot.planTurn5(last, B5), p6e = Bot.planTurn5(early, B6);
  const kill = E.options(last, "N-LM").attacks.find((a) => a.target === "S-HM2").killChance;
  console.log(`  clock 2, last turn, Brain 6: ${fmtPlan(p6)} (value ${p6.v.toFixed(1)})`);
  console.log(`          last turn, Brain 5: ${fmtPlan(p5)} (value ${p5.v.toFixed(1)})`);
  console.log(`          15 turns left, Brain 6: ${fmtPlan(p6e)}`);
  console.log(`          the attack kills ${(100 * kill).toFixed(0)}% of the time; otherwise the parry removes the Light Melee and the tiebreak becomes a draw: about ${(B6.model.clock * (1 - kill)).toFixed(1)} of clock value lost`);
  ok(!lmAttacks(p6), "clock 2: on the last turn, ahead, Brain 6 doesn't trade its Light Melee for nothing");
  ok(lmAttacks(p5), "clock 2: Brain 5 (no clock) does");
  ok(lmAttacks(p6e), "clock 2: with 15 turns left Brain 6 plays as Brain 5");
}

// ---- Keep an Evade step: an attack that leaves no legal step costs the target's expected hit back ----
// North's Light Melee at E9 has already moved its full cap (4) this turn, next to a wounded South Heavy Anti-Cavalry.
// Attacking leaves it no step to Evade: Brain 6 counts the Anti-Cavalry's expected hit back against the attack.
{ const st = setup([["LM", "LM"], ["HM", "HM"]], [["HA", "HA"], ["HR", "HR"]], { "N-LM": "E9", "N-HM": "E3", "S-HA": "E10", "S-HR": "I16" });
  U(st, "S-HA").hp = 10; U(st, "N-LM").moved = 4;
  // The setting is off by default (F31); the mechanism is tested switched on at 1.
  const EV = Object.assign(JSON.parse(JSON.stringify(B6)), { model: Object.assign({}, B6.model, { evade: 1 }) });
  const noEv = Object.assign(JSON.parse(JSON.stringify(B6)), { model: Object.assign({}, B6.model, { evade: 0 }) });
  ok(B6.model.evade === 0, "Brain 6 ships with Keep an Evade step off (Brief 007 confirmation: on, all-Light games freeze on the clock)");
  const with6 = Bot.attackLine5(st, "N", EV, [], "N-LM", "S-HA"), without = Bot.attackLine5(st, "N", noEv, [], "N-LM", "S-HA");
  const s1 = with6.s, steps = Object.keys(E.options(s1, "N-LM").moves).length;
  const back = (() => { const t = U(s1, "S-HA"), u = U(s1, "N-LM"); const b = E.breakdown(s1, t, u, t.hex); return E.dieCases(s1).reduce((a, [d, p]) => a + p * E.applyDie(s1, b.value, d, b.dodge), 0); })();
  console.log(`  evade: after the attack, legal Evade steps: ${steps} (${E.whyNoMove(s1, U(s1, "N-LM")) || "has a step"}); the Anti-Cavalry's expected hit back: ${back.toFixed(2)}`);
  console.log(`         the attack's value with the cost ${with6.v.toFixed(2)}, without ${without.v.toFixed(2)} (Keep an Evade step = ${EV.model.evade})`);
  ok(steps === 0, "evade: a Light Melee that used its cap has no step after attacking");
  ok(Math.abs((without.v - with6.v) - EV.model.evade * back) < 1e-6, "evade: the cost is Keep an Evade step × the target's expected hit back");
  // and with a step left, no cost
  U(st, "N-LM").moved = 0;
  const a1 = Bot.attackLine5(st, "N", EV, [], "N-LM", "S-HA"), a0 = Bot.attackLine5(st, "N", noEv, [], "N-LM", "S-HA");
  ok(Math.abs(a1.v - a0.v) < 1e-9, "evade: no cost when a step is left");
}

// ---- Legal play: Brain 6 vs Brain 5 and vs itself, balanced and all-Light, both formats ----
const LINEUPS = { balanced: { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, light: { 5: { LM: 2, LA: 2, LR: 1 }, 7: { LM: 3, LA: 2, LR: 2 } } };
for (const mode of ["balanced", "light"]) for (const size of [5, 7]) {
  if (!games) break;
  const rnd = require("./rng.js")(`brain6-legal:${RS.id}:${mode}:${size}`, 0);
  const line = []; for (const code of Object.keys(RS.cards)) for (let i = 0; i < (LINEUPS[mode][size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  let refused = 0, errors = 0, unfinished = 0, actions = 0; const sample = [];
  for (let g = 0; g < games; g++) {
    const first = g % 2 ? "S" : "N", brain = (t) => (g % 4 < 2 ? (t === "N" ? B6 : B5) : B6);
    const st = E.newMatch(RS, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brain(t), rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 6000) {
      const B0 = brain(st.toMove);
      let a; try { a = Bot.chooseAction(st, B0, rnd).action; } catch (e) { errors++; if (sample.length < 3) sample.push("threw: " + e.message); a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd)); actions++;
      if (!r.ok) { if (B0 === B6) { refused++; if (sample.length < 3) sample.push(JSON.stringify(a) + " " + r.error); } E.act(st, { type: "end" }); }
    }
    if (!st.result) unfinished++;
  }
  console.log(`  ${mode} ${size}v${size}: ${games} games, ${actions} actions; Brain 6 actions refused: ${refused}; errors: ${errors}; unfinished: ${unfinished}`);
  for (const x of sample) console.log("    " + x);
  ok(refused === 0 && errors === 0 && unfinished === 0, `${mode} ${size}v${size}: every Brain 6 action legal, no errors, every game finished`);
}
console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
