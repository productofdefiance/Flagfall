// Brief 005 item 4: the Evade preview never promises a step that won't exist, and every greyed-out action says why.
// All reasons come from the engine (whyNoMove, blockReasons, the attack preview's evade field).
// node tests/test_reasons.js
const E = require("../engine.js"); const { PRESETS } = require("../data.js");
const RS = PRESETS[PRESETS.length - 1];
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(lineN, lineS, place, first) {
  const st = E.newMatch(RS, { first: first || "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}

// ---- The Editor's case (build 4, seed MQVV-DBL7-F7ZM, turn 9): a Light Anti-Cavalry next to a tackling unit, with
// 0.5 Stamina left after its attack and 1 hex of cap. The board promised "Evade after: up to 1 hex" and then said
// "No hex to evade to". Rebuilt by hand: that match's record isn't in the repository (only its seed), so the
// position is set up directly. North moves first here; the Light Anti-Cavalry is South's in the real game, so South
// is the side to move.
{ const st = setup([["LM", "LM"], ["HM", "HM"]], [["LA", "LA"], ["HM", "HM"]], { "S-LA": "E2", "N-LM": "E3", "N-HM": "A10", "S-HM": "I12" }, "S");
  ok(E.dist("E2", "E3") === 1, "(geometry) E2 is next to E3");
  const la = U(st, "S-LA"); la.stam = 1.5; la.moved = 3;   // after its attack: 0.5 Stamina, 1 hex of its 4
  const a = E.options(st, "S-LA").attacks.find((x) => x.target === "N-LM");
  ok(a && a.evade && a.evade.hexes === 0, `the preview no longer promises a step (hexes ${a && a.evade && a.evade.hexes})`);
  ok(a && /Tackled by LM/.test(a.evade.reason) && /needs 1 Stamina and 2 hexes of movement/.test(a.evade.reason) && /has 0\.5 Stamina and 1 hex/.test(a.evade.reason),
    `the preview says why: ${a && a.evade.reason}`);
  // After the attack (the target survives), the evading unit's reason is the same
  E.act(st, { type: "attack", uid: "S-LA", target: "N-LM" }, () => 2);
  if (U(st, "N-LM").hp > 0) {
    ok(Object.keys(E.options(st, "S-LA").moves).length === 0 && /Tackled by LM/.test(E.whyNoMove(st, U(st, "S-LA"))), `after the attack: ${E.whyNoMove(st, U(st, "S-LA"))}`);
  } else ok(false, "(test) the attack was meant to leave the target standing");
}

// ---- An evading unit with no step says why: out of Stamina, out of Command, full cap, no free hex further away ----
const evading = (setupFn) => { const st = setupFn(); E.act(st, { type: "attack", uid: "N-LM", target: "S-HA" }, () => 7); return st; };
const baseEv = (extra) => setup([["LM", "LM"], ["HM", "HM"]], [["HA", "HA"], ["LR", "LR"]], Object.assign({ "N-LM": "E9", "S-HA": "E10", "N-HM": "A6", "S-LR": "I12" }, extra));
{ const st = evading(() => { const s = baseEv(); U(s, "N-LM").stam = 1.25; return s; });
  ok(/Needs 0\.5 Stamina for a step, 0\.25 left/.test(E.whyNoMove(st, U(st, "N-LM"))), `out of Stamina: ${E.whyNoMove(st, U(st, "N-LM"))}`); }
{ const st = evading(() => { const s = baseEv(); s.cmd = 1.25; return s; });
  ok(/Needs 0\.5 Command for a step, 0\.25 left/.test(E.whyNoMove(st, U(st, "N-LM"))), `out of Command: ${E.whyNoMove(st, U(st, "N-LM"))}`); }
{ const st = evading(() => { const s = baseEv(); U(s, "N-LM").moved = 4; return s; });
  ok(/Moved its full cap \(4 hexes\)/.test(E.whyNoMove(st, U(st, "N-LM"))), `full cap: ${E.whyNoMove(st, U(st, "N-LM"))}`); }
{ // every hex further from the target is taken
  const st0 = baseEv(); const further = E.NBRS["E9"].filter((h) => E.dist(h, "E10") > 1);
  const extra = {}, lineN = [["LM", "LM"], ["HM", "HM"]]; further.forEach((h, i) => { lineN.push(["LR" + (i ? i + 1 : ""), "LR"]); extra["N-LR" + (i ? i + 1 : "")] = h; });
  const st = (() => { const s = setup(lineN, [["HA", "HA"], ["LR", "LR"]], Object.assign({ "N-LM": "E9", "S-HA": "E10", "N-HM": "A6", "S-LR": "I12" }, extra)); E.act(s, { type: "attack", uid: "N-LM", target: "S-HA" }, () => 7); return s; })();
  ok(/No free hex further from HA/.test(E.whyNoMove(st, U(st, "N-LM"))), `no free hex further away: ${E.whyNoMove(st, U(st, "N-LM"))}`); }

// ---- Greyed-out actions say why ----
{ const st = baseEv(); st.cmd = 0.5;
  const r = E.blockReasons(st, "N-LM");
  ok(r.attack === "Needs 1 Command, 0.5 left" && r.brace === "Needs 1 Command, 0.5 left", `attack and brace with too little Command: ${r.attack} / ${r.brace}`);
  ok(r.reach === "Only Anti-Cavalry units can Reach", `reach on a non-Reach unit: ${r.reach}`);
  ok(/No special actions/.test(r.special), "special: none in this rule set yet"); }
{ const st = baseEv({ "S-HA": "E14" }); const r = E.blockReasons(st, "N-LM");
  ok(r.attack === "No enemy in range", `no target: ${r.attack}`); }
{ const st = baseEv(); U(st, "N-LM").stam = 0.5; const r = E.blockReasons(st, "N-LM");
  ok(r.attack === "Needs 1 Stamina, 0.5 left", `too little Stamina: ${r.attack}`); }
{ const st = baseEv(); E.act(st, { type: "attack", uid: "N-LM", target: "S-HA" }, () => 7); const r = E.blockReasons(st, "N-LM");
  ok(/may only evade or end/.test(r.attack) && /may only evade or end/.test(r.brace) && r.move === null, `while evading: ${r.attack}`); }
{ const st = baseEv(); E.act(st, { type: "done", uid: "N-LM" }); const r = E.blockReasons(st, "N-LM");
  ok(r.attack === "LM has ended its turn" && r.done === "LM has ended its turn", `after End unit: ${r.attack}`); }
{ const st = baseEv(); const r = E.blockReasons(st, "S-HA");
  ok(r.attack === "It is not that side's turn", `enemy unit: ${r.attack}`); }
{ // a reloading Heavy Ranged
  const st = setup([["HR", "HR"], ["HM", "HM"]], [["HA", "HA"], ["LR", "LR"]], { "N-HR": "E8", "S-HA": "E10", "N-HM": "A6", "S-LR": "I12" });
  U(st, "N-HR").attackedLast = true;
  ok(E.blockReasons(st, "N-HR").attack === "HR is reloading this turn", "reloading: " + E.blockReasons(st, "N-HR").attack); }
// Available actions have no reason
{ const st = baseEv(); const r = E.blockReasons(st, "N-LM"); ok(r.attack === null && r.brace === null && r.move === null, "available actions carry no reason"); }

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
