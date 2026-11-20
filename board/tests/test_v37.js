// v3.7 checks (Brief 011, Game Laws 6.16 and 6.17): the warm-up and the six foot specials. Every rule the brief lists
// under "Rules it touches" is a check here, on v3.7, and the new actions are checked as refused on v3.6.
// Ends with the double-knockout count (F20): seeded v3.7 games, default brain against itself, every action checked.
// node tests/test_v37.js [games per format for the double-knockout count, default 4]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS, DEFAULT_RULESET } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const W = require("../watch.js"), rng = require("./rng.js");
const V37 = PRESETS.find((p) => p.id === "v3.7"), V36 = PRESETS.find((p) => p.id === "v3.6");
const KO_GAMES = +(process.argv[2] || 4);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
/** A match on `rs`, deployed anywhere, then units placed by hand (others parked far away). North to move, turn 1. */
function setup(rs, lineN, lineS, place) {
  const st = E.newMatch(rs || V37, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  const park = { N: ["A6", "B6", "C6", "G6", "H6", "I6", "A7"], S: ["A14", "B14", "C14", "G14", "H14", "I14", "A13"] };
  for (const u of st.units) if (!place[u.uid]) u.hex = park[u.team].shift();
  for (const uid in place) U(st, uid).hex = place[uid];
  st.cmd = 10;   // a full turn's Command for the checks
  return st;
}
const A = (st, a) => E.act(st, a, () => { throw new Error("a special must never roll"); });
const roll7 = (st, a) => E.act(st, a, () => 7);
const roll2 = (st, a) => E.act(st, a, () => 2);   // pulls: the smallest roll, so a 10-point flag doesn't fall mid-check
const nextTurn = (st) => { E.act(st, { type: "end" }); E.act(st, { type: "end" }); };
/** Warm up `uid` now and come back on its next turn, charged. */
function charge(st, uid) { const r = A(st, { type: "warmup", uid }); if (!r.ok) throw new Error(r.error); nextTurn(st); return U(st, uid).sp; }
const hpOf = (st, uid) => U(st, uid).hp;

// ---- The preset ----
ok(V37 && V37.switches.specials === true && PRESETS[PRESETS.length - 1] === V37, "v3.7 exists with specials on, and is the newest preset");
{ const a = JSON.parse(JSON.stringify(V36)), b = JSON.parse(JSON.stringify(V37));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  delete b.switches.specials; delete b.game.warmupCost; delete b.specials;
  for (const c in b.cards) delete b.cards[c].special;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.7 is v3.6 plus the specials switch, warmupCost, each card's special and the specials block"); }
ok(V37.game.warmupCost === 1, "warm-up costs 1");
ok(["HM:arcHit", "LM:pickOff", "HR:bullseye", "LR:arrowStorm", "HA:skewer", "LA:javelin"].every((x) => { const [c, k] = x.split(":"); return V37.cards[c].special === k; }), "each foot card has its special");
for (const rs of [DEFAULT_RULESET, ...PRESETS.slice(0, -1)]) {
  ok(!rs.switches.specials && !Object.values(rs.cards).some((c) => c.special), `${rs.id}: no specials`);
  const st = setup(rs, [["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "S-HM": "E10" });
  ok(U(st, "N-HM").sp === undefined, `${rs.id}: units carry no special state`);
  ok(!E.act(st, { type: "warmup", uid: "N-HM" }).ok && !E.act(st, { type: "special", uid: "N-HM", target: "S-HM" }).ok, `${rs.id}: warmup and special are refused`);
  ok(E.options(st, "N-HM").special === undefined, `${rs.id}: options() has no special entry`);
}

// ---- A special's life (6.16) ----
{ const st = setup(V37, [["HM", "HM"], ["HM2", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "N-HM2": "C9", "S-HM": "E11" });
  ok(E.specialState(st, U(st, "N-HM")) === "Unused", "starts Unused");
  const s0 = U(st, "N-HM").stam, c0 = st.cmd;
  ok(A(st, { type: "warmup", uid: "N-HM" }).ok, "warm up when Unused");
  ok(U(st, "N-HM").stam === s0 - 1 && st.cmd === c0 - 1, "warm-up costs 1 Stamina and 1 Command");
  ok(E.specialState(st, U(st, "N-HM")) === "Warming up" && E.status(st, U(st, "N-HM")).warming, "Warming up, and status shows the ring");
  ok(!U(st, "N-HM").done, "a warm-up does not end the unit's turn");
  U(st, "N-HM2").hex = "D9";
  ok(A(st, { type: "swap", uid: "N-HM", with: "N-HM2" }).ok && U(st, "N-HM").hex === "D9", "swap after a warm-up is legal");
  ok(A(st, { type: "move", uid: "N-HM", to: "D10" }).ok, "move after a warm-up is legal");
  ok(!roll7(st, { type: "attack", uid: "N-HM", target: "S-HM" }).ok, "no attack after a warm-up");
  ok(!A(st, { type: "brace", uid: "N-HM" }).ok, "no brace after a warm-up");
  ok(!A(st, { type: "warmup", uid: "N-HM" }).ok, "no second warm-up the same turn");
  ok(E.options(st, "N-HM").attacks.length === 0 && !E.options(st, "N-HM").brace, "options offer no attack or brace after a warm-up");
  ok(E.blockReasons(st, "N-HM").special === "Fire it next turn", "the button's reason: Fire it next turn");
  E.act(st, { type: "end" });
  ok(E.specialState(st, U(st, "N-HM")) === "Warming up", "still Warming up through the enemy's turn (the ring shows for both sides)");
  E.act(st, { type: "end" });
  ok(E.specialState(st, U(st, "N-HM")) === "Charged", "Charged on its next turn");
}
// Pull and warm-up never share a turn (F8), in either order; no pull on the firing turn.
{ const st = setup(V37, [["LM", "LM"], ["LM2", "LM"]], [["HM", "HM"]], { "N-LM": "E16", "N-LM2": "D16", "S-HM": "A14" });   // E16 is next to South's empty flag
  ok(roll2(st, { type: "pull", uid: "N-LM" }).ok, "a pull from the goal zone");
  ok(!A(st, { type: "warmup", uid: "N-LM" }).ok, "no warm-up after a pull");
  ok(A(st, { type: "warmup", uid: "N-LM2" }).ok, "a friend may still warm up");
  ok(!roll2(st, { type: "pull", uid: "N-LM2" }).ok, "no pull after a warm-up");
  ok(E.options(st, "N-LM2").pull === null, "options offer no pull after a warm-up");
  nextTurn(st);
  U(st, "S-HM").hex = "D15";   // a target for Pick Off next to N-LM2 at D16
  ok(E.dist("D15", "D16") === 1, "D15 is next to D16");
  ok(A(st, { type: "special", uid: "N-LM2", target: "S-HM" }).ok, "fire on the next turn");
  ok(!roll2(st, { type: "pull", uid: "N-LM2" }).ok, "no pull after firing");
}
// One attack a turn
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "S-HM": "E10" });
  charge(st, "N-HM");
  ok(roll7(st, { type: "attack", uid: "N-HM", target: "S-HM" }).ok, "a charged unit may attack normally instead");
  ok(!A(st, { type: "special", uid: "N-HM", target: "S-HM" }).ok, "no firing after attacking");
  E.act(st, { type: "end" });
  ok(E.specialState(st, U(st, "N-HM")) === "Unused", "it lapses at the end of that turn");
}
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "S-HM": "E10" });
  charge(st, "N-HM");
  ok(A(st, { type: "special", uid: "N-HM", target: "S-HM" }).ok, "fire");
  ok(E.specialState(st, U(st, "N-HM")) === "Used" && U(st, "N-HM").done, "Used, and firing ends the unit's turn");
  ok(!roll7(st, { type: "attack", uid: "N-HM", target: "S-HM" }).ok, "no attack after firing");
  nextTurn(st);
  ok(!A(st, { type: "warmup", uid: "N-HM" }).ok && E.blockReasons(st, "N-HM").special === "Used", "once a match: Used stays Used");
}
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "S-HM": "E10" });
  ok(roll7(st, { type: "attack", uid: "N-HM", target: "S-HM" }).ok && !A(st, { type: "warmup", uid: "N-HM" }).ok, "no warm-up after attacking");
  ok(E.blockReasons(st, "N-HM").special === "Already attacked this turn", "reason: Already attacked this turn");
  nextTurn(st);
  ok(A(st, { type: "brace", uid: "N-HM" }).ok && !A(st, { type: "warmup", uid: "N-HM" }).ok, "no warm-up after bracing");
  ok(E.blockReasons(st, "N-HM").special === "Braced this turn", "reason: Braced this turn");
}
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "S-HM": "E12" });
  U(st, "N-HM").stam = 0.5;
  ok(!A(st, { type: "warmup", uid: "N-HM" }).ok && E.blockReasons(st, "N-HM").special === "Not enough Stamina", "reason: Not enough Stamina");
}
// Lapse and re-warm
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "S-HM": "E13" });
  charge(st, "N-HM");
  ok(E.blockReasons(st, "N-HM").special === "No target in reach", "charged with nobody next to it: No target in reach");
  E.act(st, { type: "end" });
  ok(E.specialState(st, U(st, "N-HM")) === "Unused" && st.log.some((l) => /lapses/.test(l.text)), "a warm-up not fired returns to Unused at the end of the firing turn, and the log says so");
  E.act(st, { type: "end" });
  charge(st, "N-HM");
  const s0 = U(st, "N-HM").stam;
  ok(A(st, { type: "warmup", uid: "N-HM" }).ok && U(st, "N-HM").stam === s0 - 1, "re-warming on the firing turn works and costs 1 again");
  E.act(st, { type: "end" });
  ok(E.specialState(st, U(st, "N-HM")) === "Warming up", "a re-warm does not lapse when that turn ends");
  E.act(st, { type: "end" });
  ok(E.specialState(st, U(st, "N-HM")) === "Charged", "charged again the turn after the re-warm");
}
// A hit doesn't cancel a warm-up; removal ends it
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HM": "E9", "S-HM": "E10", "S-HM2": "C12" });
  A(st, { type: "warmup", uid: "N-HM" }); E.act(st, { type: "end" });
  ok(roll7(st, { type: "attack", uid: "S-HM", target: "N-HM" }).ok && U(st, "N-HM").hp < 20 && U(st, "N-HM").sp === "warm", "being hit doesn't cancel a warm-up");
  U(st, "N-HM").hp = 1;
  roll7(st, { type: "move", uid: "S-HM2", to: "D11" });
  E.act(st, { type: "end" });
  ok(U(st, "N-HM").sp === "charged", "still charged after the hit");
  E.act(st, { type: "end" }); U(st, "N-HM").hp = 0.5; E.act(st, { type: "end" });
}
{ const st = setup(V37, [["HM", "HM"], ["HM2", "HM"]], [["HM", "HM"]], { "N-HM": "E9", "N-HM2": "C6", "S-HM": "E10" });
  A(st, { type: "warmup", uid: "N-HM" }); E.act(st, { type: "end" });
  U(st, "N-HM").hp = 1; roll7(st, { type: "attack", uid: "S-HM", target: "N-HM" });
  ok(U(st, "N-HM").hp <= 0 && !E.alive(st).some((u) => u.uid === "N-HM"), "a removed unit's warm-up ends with it (no unit on the field, no ring)");
  E.act(st, { type: "end" });
  ok(!st.log.slice(-3).some((l) => /lapses/.test(l.text)), "nothing lapses for a removed unit");
}

// ---- Heavy Ranged: Reload and Bullseye ----
{ const st = setup(V37, [["HR", "HR"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HR": "E8", "S-HM": "E11", "S-HM2": "A14" });
  ok(roll7(st, { type: "attack", uid: "N-HR", target: "S-HM" }).ok, "Heavy Ranged shoots");
  nextTurn(st);
  ok(A(st, { type: "warmup", uid: "N-HR" }).ok, "warm-up on a Reload turn is legal");
  nextTurn(st);
  ok(E.specialState(st, U(st, "N-HR")) === "Charged" && !U(st, "N-HR").attackedLast, "charged the turn after, not reloading (the warm-up is not an attack)");
}
{ const st = setup(V37, [["HR", "HR"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HR": "E8", "S-HM": "E11", "S-HM2": "A14" });
  charge(st, "N-HR");
  U(st, "N-HR").attackedLast = true;   // as if it had attacked on its last turn
  ok(!A(st, { type: "special", uid: "N-HR", target: "S-HM" }).ok && /reloading/.test(E.blockReasons(st, "N-HR").special), "firing on a Reload turn is not legal");
}
{ const st = setup(V37, [["HR", "HR"]], [["HM", "HM"]], { "N-HR": "E8", "S-HM": "E11" });
  charge(st, "N-HR");
  const h0 = hpOf(st, "S-HM"), p = E.options(st, "N-HR").special.targets.find((x) => x.target === "S-HM");
  ok(p.hits[0].mult === 1.5 && p.hits[0].value === 9 && p.hits[0].dmg === 13.5, "Bullseye: Strength 9, Armor 3 ignored (Pierce), ×1.5 = 13.5");
  ok(A(st, { type: "special", uid: "N-HR", target: "S-HM" }).ok && h0 - hpOf(st, "S-HM") === 13.5, "Bullseye deals the previewed 13.5, no dice");
  nextTurn(st);
  ok(!roll7(st, { type: "attack", uid: "N-HR", target: "S-HM" }).ok && U(st, "N-HR").attackedLast, "Reload after Bullseye");
}
{ const st = setup(V37, [["HR", "HR"]], [["HM", "HM"], ["LM", "LM"]], { "N-HR": "E8", "S-HM": "E11", "S-LM": "A14" });
  charge(st, "N-HR"); U(st, "S-LM").hex = "E9";
  const p = E.options(st, "N-HR").special.targets.find((x) => x.target === "S-HM");
  ok(p.hits[0].value === 4.5 && p.hits[0].dmg === 6.75 + 0.25, "Volley's half Strength on Bullseye with an enemy adjacent: 4.5 × 1.5 = 6.75 → 7");
}
// A Heavy Ranged reloads after a pull and can't pull on its Reload turn (F8, 015's engine, with specials on)
{ const st = setup(V37, [["HR", "HR"]], [["HM", "HM"]], { "N-HR": "E16", "S-HM": "A14" });
  ok(roll2(st, { type: "pull", uid: "N-HR" }).ok, "Heavy Ranged pulls");
  nextTurn(st);
  ok(!roll2(st, { type: "pull", uid: "N-HR" }).ok && U(st, "N-HR").attackedLast, "and can't pull on its Reload turn");
  ok(A(st, { type: "warmup", uid: "N-HR" }).ok, "it may warm up on that Reload turn");
}

// ---- Damage: no roll, the multiplier on the finished hit, half-point rounding, minimum 1 ----
{ // Pick Off: LM Str 9 on a Heavy Ranged (Armor 2) = 7; one friend of the target next to it: ×1.75 = 12.25 → 12.5
  const st = setup(V37, [["LM", "LM"]], [["HR", "HR"], ["HM", "HM"]], { "N-LM": "E9", "S-HR": "E10", "S-HM": "E11" });
  charge(st, "N-LM");
  const h = E.options(st, "N-LM").special.targets.find((x) => x.target === "S-HR").hits[0];
  ok(h.value === 7 && h.mult === 1.75 && h.dmg === 12.5, `Pick Off 7 × 1.75 = 12.25 rounds up to 12.5 (got ${h.value} × ${h.mult} = ${h.dmg})`);
  ok(/1 friend next to the target: ×1.75/.test(h.why), "the key's why: 1 friend next to the target: ×1.75");
  ok(A(st, { type: "special", uid: "N-LM", target: "S-HR" }).ok && hpOf(st, "S-HR") === 14 - 12.5, "Pick Off deals the previewed 12.5");
}
{ const st = setup(V37, [["LM", "LM"]], [["HR", "HR"], ["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["HA2", "HA"]], { "N-LM": "E9", "S-HR": "E10", "S-HM": "E11", "S-HM2": "D10", "S-HA": "F10", "S-HA2": "D9" });
  charge(st, "N-LM");
  const h = E.options(st, "N-LM").special.targets.find((x) => x.target === "S-HR").hits[0];
  ok(h.mult === 1, `Pick Off never below ×1 (4+ friends next to the target: ×${h.mult})`);
}
{ // Minimum 1: a Light Ranged half Strength into a braced Heavy Melee at home: tiny value, at least 1
  const st = setup(V37, [["LR", "LR"]], [["HM", "HM"], ["LM", "LM"]], { "N-LR": "E10", "S-HM": "E12", "S-LM": "E11" });
  charge(st, "N-LR"); U(st, "S-HM").braced = true;
  const p = E.options(st, "N-LR").special.targets.find((x) => x.target === "S-HM");
  ok(p.hits[0].value === 0 && p.hits[0].dmg === 1, `minimum damage 1 (value ${p.hits[0].value}, damage ${p.hits[0].dmg})`);
}

// ---- Arc Hit ----
{ ok(E.arcOf("E9", "E10").sort().join() === "D9,E10,F9", "the arc from E9 on E10 is E10, D9 and F9");
  const st = setup(V37, [["HM", "HM"], ["LM", "LM"]], [["HA", "HA"], ["HA2", "HA"], ["HM", "HM"], ["HM2", "HM"]],
    { "N-HM": "E9", "N-LM": "F9", "S-HA": "E10", "S-HA2": "D9", "S-HM": "E8", "S-HM2": "D10" });
  charge(st, "N-HM");
  const p = E.options(st, "N-HM").special.targets.find((x) => x.target === "S-HA");
  ok(p.hits.map((h) => h.uid).sort().join() === "S-HA,S-HA2", "Arc Hit hits the enemies in the arc only; the friend in it (F9) is skipped");
  const before = { e8: hpOf(st, "S-HM"), d10: hpOf(st, "S-HM2"), f9: hpOf(st, "N-LM") };
  ok(A(st, { type: "special", uid: "N-HM", target: "S-HA" }).ok, "fire Arc Hit");
  ok(hpOf(st, "S-HM") === before.e8 && hpOf(st, "S-HM2") === before.d10, "enemies next to the attacker but outside the arc (E8) and next to the target only (D10) are untouched");
  ok(hpOf(st, "N-LM") === before.f9, "the friend in the arc is untouched");
  ok(hpOf(st, "S-HA") === 18 - p.hits[0].dmg && hpOf(st, "S-HA2") === 18 - p.hits[1].dmg, "each enemy in the arc takes its previewed hit");
  ok(p.hits[0].mult === 1 && p.hits[1].mult === 1, "×1 on each");
}
{ // never takes the hex, even after a kill
  const st = setup(V37, [["HM", "HM"]], [["LR", "LR"], ["LR2", "LR"]], { "N-HM": "E9", "S-LR": "E10", "S-LR2": "A14" });
  charge(st, "N-HM"); U(st, "S-LR").hp = 1;
  ok(A(st, { type: "special", uid: "N-HM", target: "S-LR" }).ok && hpOf(st, "S-LR") <= 0 && U(st, "N-HM").hex === "E9", "Arc Hit never steps into the hex, even after a kill");
}

// ---- Skewer ----
{ ok(E.hexBehind("E9", "E10") === "E11", "behind E10 from E9 is E11");
  const st = setup(V37, [["HA", "HA"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HA": "E9", "S-HM": "E10", "S-HM2": "E11" });
  charge(st, "N-HA");
  const p = E.options(st, "N-HA").special.targets.find((x) => x.target === "S-HM");
  ok(p.hits.length === 2 && p.hits[1].uid === "S-HM2", "Skewer hits the enemy next to it and the one behind");
  ok(p.hits[0].value === 5 && p.hits[1].value === 5 && p.hits[1].dmg === 5, "both full hits: Strength 8 − Armor 3 = 5 (no Reach −1 on the second, F38)");
  ok(A(st, { type: "special", uid: "N-HA", target: "S-HM" }).ok && hpOf(st, "S-HM") === 15 && hpOf(st, "S-HM2") === 15 && U(st, "N-HA").hex === "E9", "both take 5; Skewer never takes the hex");
}
{ const st = setup(V37, [["HA", "HA"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HA": "E9", "S-HM": "E10", "S-HM2": "A14" });
  charge(st, "N-HA");
  const p = E.options(st, "N-HA").special.targets.find((x) => x.target === "S-HM");
  ok(p.hits.length === 1 && p.hits[0].dmg === 5, "Skewer with nobody behind: a single hit at ×1");
}
{ // a holder behind is never hit: South holds E17; North HA at E15 skewers a South unit at E16
  const st = setup(V37, [["HA", "HA"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HA": "E15", "S-HM": "E16", "S-HM2": "E17" });
  ok(E.isHolder(st, U(st, "S-HM2")) && E.hexBehind("E15", "E16") === "E17", "South's HM2 holds its flag, behind E16");
  charge(st, "N-HA");
  const p = E.options(st, "N-HA").special.targets.find((x) => x.target === "S-HM"), pool = E.effHp(st, U(st, "S-HM2"));
  ok(p.hits.length === 1, "Skewer's second hit skips the flag hex");
  A(st, { type: "special", uid: "N-HA", target: "S-HM" });
  ok(E.effHp(st, U(st, "S-HM2")) === pool && st.pole.S === 0, "the holder behind takes nothing, and the flag nothing");
}

// ---- Javelin ----
{ const st = setup(V37, [["LA", "LA"], ["HM", "HM"]], [["HM", "HM"], ["HM2", "HM"]], { "N-LA": "E8", "N-HM": "E9", "S-HM": "E10", "S-HM2": "E11" });
  charge(st, "N-LA");
  const ts = E.options(st, "N-LA").special.targets.map((x) => x.target);
  ok(ts.includes("S-HM"), "Javelin at 2 hexes, over a friend");
  ok(!ts.includes("S-HM2"), "Javelin at 3 hexes blocked by an enemy between");
  const p = E.options(st, "N-LA").special.targets.find((x) => x.target === "S-HM");
  ok(p.hits[0].value === 5 && p.hits[0].dmg === 10, `Reach −1 before ×2: (8 − 1 + 1 Support from the friend between − 3) × 2 = 10 (got ${p.hits[0].value} → ${p.hits[0].dmg})`);
}
{ const st = setup(V37, [["LA", "LA"]], [["HM", "HM"]], { "N-LA": "E8", "S-HM": "E11" });
  charge(st, "N-LA");
  const p = E.options(st, "N-LA").special.targets.find((x) => x.target === "S-HM");
  ok(p && p.hits[0].value === 4 && p.hits[0].dmg === 8, "Javelin at 3 hexes: Reach −1 still applies, ×2");
  ok(A(st, { type: "special", uid: "N-LA", target: "S-HM" }).ok && hpOf(st, "S-HM") === 12 && U(st, "N-LA").hex === "E8", "Javelin deals 8 and never takes a hex");
  ok(!U(st, "N-LA").evadeFrom, "no Evade after Javelin");
}
{ const st = setup(V37, [["LA", "LA"]], [["HM", "HM"]], { "N-LA": "E8", "S-HM": "E12" });
  charge(st, "N-LA");
  ok(!E.options(st, "N-LA").special.fire, "Javelin can't reach 4 hexes");
  U(st, "S-HM").hex = "F9";
  ok(E.dist("E8", "F9") === 2 && E.lineBetween("E8", "F9") === null && !E.specialCanTarget(st, U(st, "N-LA"), U(st, "S-HM")), "Javelin only along a straight line (F9 is 2 away from E8, off the line)");
}

// ---- Arrow Storm, Fend, Brace ----
{ const st = setup(V37, [["LR", "LR"]], [["LM", "LM"]], { "N-LR": "E8", "S-LM": "E11" });
  charge(st, "N-LR"); U(st, "S-LM").braced = true;   // Weave doubles Dodge
  const p = E.options(st, "N-LR").special.targets.find((x) => x.target === "S-LM"), h = p.hits[0];
  ok(h.dodge > 0 && h.dodgeIgnored && h.dmg === Math.max(1, Math.floor((h.value * 2) * 2 + 0.5) / 2), `Arrow Storm ignores Dodge, even Weave's doubled ${h.dodge}%: ${h.value} × 2 = ${h.dmg}`);
  ok(h.value === 7 - 2, "Brace's 2 less applies to a special");
  ok(/Dodge \d+% doesn't count/.test(h.why), "the key's why names the Dodge that doesn't count");
}
{ const st = setup(V37, [["HM", "HM"], ["LM", "LM"]], [["LA", "LA"]], { "N-HM": "E9", "N-LM": "F10", "S-LA": "E10" });
  charge(st, "N-HM");
  const hSup = E.options(st, "N-HM").special.targets[0].hits[0];
  U(st, "S-LA").braced = true;
  const hFend = E.options(st, "N-HM").special.targets[0].hits[0];
  ok(hSup.detail.support === 1 && hFend.detail.noSupport && hFend.detail.support === 0, "Fend still removes Support from a special");
}

// ---- No special on a flag; the flag block (4.9) ----
{ // South holds E17; North units around its goal zone with every special charged
  const st = setup(V37, [["HM", "HM"], ["LM", "LM"], ["HA", "HA"], ["HR", "HR"], ["LR", "LR"], ["LA", "LA"]], [["HM", "HM"], ["LM", "LM"]],
    { "N-HM": "E16", "N-LM": "D16", "N-HA": "F16", "N-HR": "E13", "N-LR": "D14", "N-LA": "E15", "S-HM": "E17", "S-LM": "A14" });
  for (const u of st.units.filter((x) => x.team === "N")) A(st, { type: "warmup", uid: u.uid });
  nextTurn(st);
  ok(E.isHolder(st, U(st, "S-HM")), "South's HM holds E17");
  for (const u of st.units.filter((x) => x.team === "N")) {
    const o = E.options(st, u.uid).special;
    ok(o && !o.targets.some((t) => t.target === "S-HM"), `${u.id}'s ${o && o.name}: the holder is never a legal target`);
    ok(!E.specialCanTarget(st, u, U(st, "S-HM")), `${u.id}: specialCanTarget refuses the flag hex`);
  }
  ok(!A(st, { type: "special", uid: "N-HM", target: "S-HM" }).ok, "the engine refuses a special on the holder");
  ok(roll7(st, { type: "attack", uid: "N-HM", target: "S-HM" }).ok, "a normal attack on the holder works as before (4.5)");
}
{ // Arc Hit's arc skips the flag hex: North HM at E15, South unit at E16; the arc from E15 on E16 would include D16/F16, not E17
  let flagInArc = 0; for (const a of E.CELLS) for (const t of E.NBRS[a]) if (E.arcOf(a, t).some((h) => h === "E17" || h === "E3")) flagInArc++;
  ok(flagInArc === 0, "no arc anywhere on the field lists a flag hex");
  ok(E.arcOf("D16", "D17").every((h) => h !== "E17" && h !== "E3"), "the arc from D16 on D17 skips E17");
  ok(E.arcOf("F16", "E16").indexOf("E17") === -1, "the arc from F16 on E16 skips E17");
}
{ // the flag block: Bullseye, Arrow Storm and Javelin across a flag hex in the line are blocked; clear lines are not
  const st = setup(V37, [["HR", "HR"], ["LR", "LR"], ["LA", "LA"]], [["HM", "HM"], ["HM2", "HM"], ["HM3", "HM"]],
    { "N-HR": "E15", "N-LR": "E14", "N-LA": "E16", "S-HM": "E19", "S-HM2": "E18", "S-HM3": "A14" });
  for (const id of ["N-HR", "N-LR", "N-LA"]) A(st, { type: "warmup", uid: id });
  nextTurn(st);
  ok(E.flagBetween("E15", "E19") && E.flagBetween("E14", "E18") && E.flagBetween("E16", "E18"), "E17 is between each pair");
  ok(!E.specialCanTarget(st, U(st, "N-HR"), U(st, "S-HM")), "Bullseye blocked by the flag in the line");
  ok(!E.specialCanTarget(st, U(st, "N-LR"), U(st, "S-HM2")), "Arrow Storm blocked by the flag in the line");
  ok(!E.specialCanTarget(st, U(st, "N-LA"), U(st, "S-HM2")), "Javelin blocked by the flag in the line");
  U(st, "S-HM").hex = "C15"; U(st, "S-HM2").hex = "C14";
  ok(E.specialCanTarget(st, U(st, "N-HR"), U(st, "S-HM")) && E.specialCanTarget(st, U(st, "N-LR"), U(st, "S-HM2")), "clear lines are not blocked");
}
// A holder warms up and fires from its flag, and stays on it after a kill
{ const st = setup(V37, [["LM", "LM"]], [["HM", "HM"]], { "N-LM": "E3", "S-HM": "E4" });
  ok(E.isHolder(st, U(st, "N-LM")), "North's LM holds E3");
  ok(A(st, { type: "warmup", uid: "N-LM" }).ok, "a holder may warm up");
  nextTurn(st); U(st, "S-HM").hp = 1;
  ok(A(st, { type: "special", uid: "N-LM", target: "S-HM" }).ok && hpOf(st, "S-HM") <= 0, "and fire Pick Off from the flag");
  ok(U(st, "N-LM").hex === "E3", "it stays on its flag after the kill");
}

// ---- Taking the hex: Pick Off does (and set spear fires on that entry); ranged specials never ----
{ const st = setup(V37, [["LM", "LM"]], [["LR", "LR"], ["HA", "HA"]], { "N-LM": "E9", "S-LR": "E10", "S-HA": "E11" });
  charge(st, "N-LM"); U(st, "S-LR").hp = 1; U(st, "S-HA").braced = true;
  const h0 = hpOf(st, "N-LM");
  ok(A(st, { type: "special", uid: "N-LM", target: "S-LR" }).ok && U(st, "N-LM").hex === "E10", "Pick Off takes the hex after a kill");
  ok(hpOf(st, "N-LM") === h0 - V37.spikeDamage, "set spear fires on that entry (3.13)");
  ok(!U(st, "N-LM").evadeFrom, "no Evade after a kill");
}
{ const st = setup(V37, [["LR", "LR"]], [["LM", "LM"]], { "N-LR": "E9", "S-LM": "E10" });
  charge(st, "N-LR"); U(st, "S-LM").hp = 1;
  ok(A(st, { type: "special", uid: "N-LR", target: "S-LM" }).ok && hpOf(st, "S-LM") <= 0 && U(st, "N-LR").hex === "E9", "an adjacent Arrow Storm kill never takes the hex");
}

// ---- Parry ----
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HM": "E9", "S-HM": "E10", "S-HM2": "D9" });
  charge(st, "N-HM"); U(st, "S-HM").braced = true; U(st, "S-HM2").braced = true;
  const h0 = hpOf(st, "N-HM");
  ok(A(st, { type: "special", uid: "N-HM", target: "S-HM" }).ok, "Arc Hit into two braced Heavy Melee");
  ok(hpOf(st, "N-HM") === h0 - 2, `one parry per action, not multiplied: 20% of Strength 10 = 2 (took ${h0 - hpOf(st, "N-HM")})`);
  ok(U(st, "S-HM").parryUsed && U(st, "S-HM2").parryUsed, "each braced Heavy Melee hit from next door used up its parry");
  ok(hpOf(st, "S-HM") === 20 - 5 && hpOf(st, "S-HM2") === 20 - 5, "Brace's 2 less on each: 10 − 3 − 2 = 5");
}
{ const st = setup(V37, [["HM", "HM"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HM": "E9", "S-HM": "E10", "S-HM2": "D9" });
  charge(st, "N-HM"); U(st, "S-HM").braced = true; U(st, "S-HM").hp = 1; U(st, "S-HM2").braced = true;
  const h0 = hpOf(st, "N-HM");
  A(st, { type: "special", uid: "N-HM", target: "S-HM" });
  ok(hpOf(st, "S-HM") <= 0 && hpOf(st, "N-HM") === h0 - 2, "parry only from a survivor: the dead one doesn't, the living one does (once)");
}
{ const st = setup(V37, [["HA", "HA"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HA": "E9", "S-HM": "E10", "S-HM2": "E11" });
  charge(st, "N-HA"); U(st, "S-HM2").braced = true;
  const h0 = hpOf(st, "N-HA");
  A(st, { type: "special", uid: "N-HA", target: "S-HM" });
  ok(hpOf(st, "N-HA") === h0 && !U(st, "S-HM2").parryUsed, "Skewer's second hit (2 hexes away) neither draws nor uses up a parry");
}

// ---- Evade ----
{ const st = setup(V37, [["LM", "LM"]], [["HM", "HM"]], { "N-LM": "E9", "S-HM": "E10" });
  charge(st, "N-LM");
  ok(A(st, { type: "special", uid: "N-LM", target: "S-HM" }).ok && U(st, "N-LM").evadeFrom === "S-HM" && !U(st, "N-LM").done, "Evade after Pick Off");
  ok(Object.keys(E.options(st, "N-LM").moves).length > 0, "with steps away to take");
}
{ const st = setup(V37, [["LR", "LR"]], [["HM", "HM"]], { "N-LR": "E9", "S-HM": "E10" });
  charge(st, "N-LR");
  ok(A(st, { type: "special", uid: "N-LR", target: "S-HM" }).ok && U(st, "N-LR").evadeFrom === "S-HM", "Evade after an adjacent Arrow Storm");
}

// ---- Preview = what is dealt, for every special ----
{ const st = setup(V37, [["HM", "HM"], ["LM", "LM"], ["HR", "HR"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]], [["HM", "HM"], ["HM2", "HM"], ["LM", "LM"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]],
    { "N-HM": "C9", "N-LM": "G9", "N-HR": "E6", "N-LR": "A9", "N-HA": "E9", "N-LA": "I9",
      "S-HM": "C10", "S-HM2": "B10", "S-LM": "G10", "S-LR": "A11", "S-HA": "E10", "S-LA": "E11" });
  for (const u of st.units.filter((x) => x.team === "N")) A(st, { type: "warmup", uid: u.uid });
  nextTurn(st);
  for (const u of st.units.filter((x) => x.team === "N")) {
    const o = E.options(st, u.uid).special;
    if (!o || !o.targets.length) continue;
    const p = o.targets[0], before = Object.fromEntries(st.units.map((x) => [x.uid, x.hp]));
    const r = A(st, { type: "special", uid: u.uid, target: p.target });
    ok(r.ok && p.hits.every((h) => Math.abs(before[h.uid] - U(st, h.uid).hp - h.dmg) < 1e-9), `${o.name}: every hit deals exactly its preview`);
    if (U(st, u.uid).evadeFrom) E.act(st, { type: "done", uid: u.uid });
  }
}

// ---- The bot never plans a warm-up with a pull, nor a pull on a firing turn; it plays v3.7 cleanly ----
{ let pulls = 0, warmPull = 0, firePull = 0, refused = 0, fired = 0, warmed = 0;
  for (let g = 0; g < 2; g++) {
    const spec = { seed: W.seedFrom(rng("test-v37-bot", g)), rules: "v3.7", format: g ? "std7" : "blitz5", n: "brain5", s: "brain5", mixN: "mixed", mixS: "mixed", first: g ? "S" : "N" };
    const turn = new Map();
    W.playOut(spec, { before: (s, c) => {
      const a = c.action, k = s.turn + s.toMove;
      if (a.type === "warmup") { warmed++; turn.set(a.uid, (turn.get(a.uid) || "") + "|" + k + "w"); }
      if (a.type === "special") { fired++; turn.set(a.uid, (turn.get(a.uid) || "") + "|" + k + "f"); }
      if (a.type === "pull") { pulls++; const t = turn.get(a.uid) || ""; if (t.includes("|" + k + "w")) warmPull++; if (t.includes("|" + k + "f")) firePull++; }
    }, after: (s, c, r) => { if (!r.ok && !c.refusedEnd) refused++; } });
  }
  ok(refused === 0 && warmPull === 0 && firePull === 0, `Brain 5 on v3.7: no refused action, no warm-up and pull or fire and pull in one turn (${refused}, ${warmPull}, ${firePull})`);
  ok(warmed > 0 && fired > 0, `Brain 5 warms up and fires specials (${warmed} warm-ups, ${fired} fired in 2 games)`);
}

// ---- Double knockout count (F20): v3.7, default brain mirror, every action checked ----
{ const both = (st) => { const w = {}; for (const t of ["N", "S"]) { const f = E.foeOf(t); if (st.pole[f] >= st.rs.game.poleHP - 1e-9 || !st.units.some((u) => u.team === f && u.hp > 0)) w[t] = 1; } return w.N && w.S; };
  let games = 0, actions = 0, bothWin = 0, refused = 0;
  for (const fmt of ["blitz5", "std7"]) for (let g = 0; g < KO_GAMES; g++) {
    const spec = { seed: W.seedFrom(rng(`doubleko:v3.7:${fmt}`, g)), rules: "v3.7", format: fmt, n: "brain5", s: "brain5", mixN: "mixed", mixS: "mixed", first: g % 2 ? "S" : "N" };
    W.playOut(spec, { after: (s, c, r) => { if (c.refusedEnd) return; if (!r.ok) { refused++; return; } actions++; if (both(s)) bothWin++; } });
    games++;
  }
  console.log(JSON.stringify({ doubleKnockout: { games, actions, bothWin, refused } }));
  ok(bothWin === 0 && refused === 0, `no action left both sides with a win condition (${bothWin} in ${games} games)`);
}

console.log(`${n - fails}/${n} v3.7 checks passed`);
process.exit(fails ? 1 : 0);
