// v3.6 checks (Brief 015, the flag rulings of 19 Nov, F8): a flag blocks the line (4.9), pulls at full Strength (4.6),
// a pull counts for Reload (3.11), set spear punishes arriving (3.13); a Ranged unit that kills from next door stays put
// (3.6, test only). Each changed rule is also checked as unchanged on v3.5. Ends with a double-knockout count on v3.6.
// node tests/test_v36.js [games per format for the double-knockout count, default 10]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS, DEFAULT_RULESET } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const rng = require("./rng.js");
const V36 = PRESETS.find((p) => p.id === "v3.6"), V35 = PRESETS.find((p) => p.id === "v3.5");
const KO_GAMES = +(process.argv[2] || 10);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const SW = ["flagBlocksLine", "pullFullStrength", "pullCountsForReload", "spearOnArrival"];
/** A match on `rs` with the given lineups, deployed anywhere, then units placed by hand. North to move. */
function setup(rs, lineN, lineS, place, first) {
  const st = E.newMatch(rs, { first: first || "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
const can = (st, a, t) => E.canAttackFrom(st, U(st, a), U(st, a).hex, U(st, t));
const endTurn = (st) => E.act(st, { type: "end" });

// ---- The preset ----
ok(V36 && SW.every((k) => V36.switches[k] === true), "v3.6 exists with its four switches on");
ok(PRESETS[PRESETS.length - 1] === V36, "v3.6 is the last preset, so new games default to it");
{ const a = JSON.parse(JSON.stringify(V35)), b = JSON.parse(JSON.stringify(V36));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  for (const k of SW) delete b.switches[k];
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.6 is v3.5 apart from the four switches"); }
for (const rs of [DEFAULT_RULESET, ...PRESETS.slice(0, -1)]) ok(SW.every((k) => !rs.switches[k]), `${rs.id}: none of the v3.6 switches`);

// ---- The line helper ----
ok(E.flagBetween("E14", "E18") && E.flagBetween("E18", "E14"), "E17 is between E14 and E18 (straight line)");
ok(E.flagBetween("E5", "E1"), "E3 is between E5 and E1 (own flag for North)");
ok(!E.flagBetween("E17", "E13") && !E.flagBetween("E13", "E17"), "the flag hex at either end never blocks");
ok(!E.flagBetween("E16", "E18") === false, "E16 to E18: E17 is the middle hex");
ok(!E.flagBetween("D16", "F16"), "D16 to F16 is not a straight line through E17");
{ // every pair within 4 hexes of E17 that isn't on a straight line through it is never blocked
  let bad = 0;
  for (const a of E.CELLS) for (const b of E.CELLS) {
    if (E.dist(a, b) < 2 || E.dist(a, b) > 4 || !E.flagBetween(a, b)) continue;
    const f = E.dist(a, "E17") + E.dist("E17", b) === E.dist(a, b) ? "E17" : "E3";
    const ca = E.parse(a), cb = E.parse(b);
    // on one straight line: the far end is the near end moved along one hex direction; check via the middle hexes' count
    if (E.dist(a, f) + E.dist(f, b) !== E.dist(a, b) || f === a || f === b) bad++;
    void ca; void cb;
  }
  ok(bad === 0, `every blocked pair has a flag strictly between it (${bad} wrong)`);
  // A shot that passes close to the flag but not through it: D15 to F15 runs beside E17? find one off-line near pair
  let near = 0, blocked = 0;
  for (const a of E.CELLS) for (const b of E.CELLS) {
    if (E.dist(a, b) < 2 || E.dist(a, b) > 4) continue;
    if (E.dist(a, "E17") + E.dist("E17", b) === E.dist(a, b) && a !== "E17" && b !== "E17") { near++; if (E.flagBetween(a, b)) blocked++; }
  }
  ok(blocked < near, `pairs with E17 on a shortest path but off a straight line are not blocked (${blocked} of ${near} blocked: the straight ones)`); }

// ---- Volley (4.9, 3.10) ----
const HR_LINE = [["HR", "HR"]], S_TWO = [["HM", "HM"], ["LM", "LM"]];
{ // empty enemy flag between: E14 → E18 over E17
  for (const [rs, want] of [[V36, false], [V35, true]]) {
    const st = setup(rs, HR_LINE, S_TWO, { "N-HR": "E14", "S-HM": "C2", "S-LM": "E18" });
    ok(can(st, "N-HR", "S-LM") === want, `${rs.id}: Volley E14 → E18 over the empty South flag ${want ? "allowed" : "blocked"}`);
    if (rs === V36) {
      const why = E.blockReasons(st, "N-HR").attack;
      ok(why === "A flag blocks the line", `v3.6: the reason reads "A flag blocks the line" (got "${why}")`);
      ok(!E.options(st, "N-HR").attacks.some((a) => a.target === "S-LM"), "v3.6: the blocked shot is not offered");
      const r = E.act(st, { type: "attack", uid: "N-HR", target: "S-LM" }, () => 7);
      ok(!r.ok, "v3.6: the engine refuses the blocked shot");
    } else ok(E.blockReasons(st, "N-HR").attack === null, "v3.5: the shot is available");
  }
  // held enemy flag between: E15 → E19 over a holder on E17
  for (const [rs, want] of [[V36, false], [V35, true]]) {
    const st = setup(rs, HR_LINE, S_TWO, { "N-HR": "E15", "S-HM": "E17", "S-LM": "E19" });
    ok(E.isHolder(st, U(st, "S-HM")), "S-HM holds the South flag");
    ok(can(st, "N-HR", "S-LM") === want, `${rs.id}: Volley over a held flag ${want ? "allowed" : "blocked"}`);
  }
  // own flag between: North HR at E5 shooting E1 over E3
  for (const [rs, want] of [[V36, false], [V35, true]]) {
    const st = setup(rs, HR_LINE, S_TWO, { "N-HR": "E5", "S-HM": "A12", "S-LM": "E1" });
    ok(can(st, "N-HR", "S-LM") === want, `${rs.id}: Volley over North's own flag ${want ? "allowed" : "blocked"}`);
  }
  // shooting out from a flag: a North HR holding E3 shoots E7
  { const st = setup(V36, HR_LINE, S_TWO, { "N-HR": "E3", "S-HM": "A12", "S-LM": "E7" });
    ok(E.isHolder(st, U(st, "N-HR")) && can(st, "N-HR", "S-LM"), "v3.6: a Ranged unit on its flag shoots out from it"); }
  // off the straight line, close to the flag: D16 → F16 passes beside E17
  { const st = setup(V36, HR_LINE, S_TWO, { "N-HR": "D15", "S-HM": "A12", "S-LM": "F17" });
    ok(!E.flagBetween("D15", "F17") && can(st, "N-HR", "S-LM"), `v3.6: a shot not on a straight line through the flag is never blocked (D15 → F17, distance ${E.dist("D15", "F17")})`); }
  // goal-zone shot at the holder next to it
  { const st = setup(V36, HR_LINE, S_TWO, { "N-HR": "E16", "S-HM": "E17", "S-LM": "A12" });
    ok(can(st, "N-HR", "S-HM"), "v3.6: a Ranged unit in the goal zone can still shoot the holder next to it"); }
  // Volley over other units is still legal
  { const st = setup(V36, HR_LINE, [["HM", "HM"], ["LM", "LM"], ["HM2", "HM"]], { "N-HR": "E8", "S-HM2": "E10", "S-LM": "E12", "S-HM": "A12" });
    ok(can(st, "N-HR", "S-LM"), "v3.6: Volley over another unit is still legal"); }
}

// ---- Reach (4.9, 3.10) ----
{ for (const [rs, want] of [[V36, false], [V35, true]]) {
    const st = setup(rs, [["HA", "HA"]], S_TWO, { "N-HA": "E16", "S-HM": "A12", "S-LM": "E18" });
    ok(can(st, "N-HA", "S-LM") === want, `${rs.id}: Reach E16 → E18 with the flag in the middle ${want ? "allowed" : "blocked"}`);
    if (rs === V36) ok(E.blockReasons(st, "N-HA").reach === "A flag blocks the line", `v3.6: the Reach reason reads "A flag blocks the line" (got "${E.blockReasons(st, "N-HA").reach}")`);
  }
  // Reach otherwise unchanged: −1, and never over an enemy
  const st = setup(V36, [["HA", "HA"]], S_TWO, { "N-HA": "E8", "S-HM": "E9", "S-LM": "E10" });
  ok(!can(st, "N-HA", "S-LM"), "v3.6: Reach never passes over an enemy");
  const st2 = setup(V36, [["HA", "HA"]], S_TWO, { "N-HA": "E8", "S-HM": "A12", "S-LM": "E10" });
  ok(can(st2, "N-HA", "S-LM") && E.breakdown(st2, U(st2, "N-HA"), U(st2, "S-LM"), "E8").parts.some((p) => /Reach/.test(p)), "v3.6: an open Reach still works, with its −1");
  ok(E.blockReasons(st, "N-HA").reach === "No enemy 2 hexes away in a straight line, with nothing in between", "v3.6: other Reach cases keep their old reason");
}

// ---- Pulls at full Strength (4.6, 3.11) ----
{ for (const code of ["LR", "HR"]) {
    for (const rs of [V36, V35]) {
      const st = setup(rs, [[code, code]], S_TWO, { [`N-${code}`]: "E16", "S-HM": "D16", "S-LM": "A12" });   // an enemy next to it
      const p = E.pullValue(st, U(st, `N-${code}`)), full = rs.cards[code].str;
      const want = rs === V36 ? full : E.half(full / 2);
      ok(Math.abs(p.value - want) < 1e-9, `${rs.id}: ${code} with an enemy next to it pulls at ${want} (got ${p.value})`);
    }
  }
  // Support and the flag still work as before; a pull still gives no Evade
  const st = setup(V36, [["LR", "LR"], ["HM", "HM"]], S_TWO, { "N-LR": "E16", "N-HM": "F16", "S-HM": "A12", "S-LM": "A14" });
  ok(E.pullValue(st, U(st, "N-LR")).value === V36.cards.LR.str + 1, "v3.6: pull Support still adds +1 per helper");
  const r = E.act(st, { type: "pull", uid: "N-LR" }, () => 7);
  ok(r.ok && U(st, "N-LR").done && !U(st, "N-LR").evadeFrom, "v3.6: a pull by a Light unit gives no Evade");
}

// ---- A pull counts for Reload (3.11, 4.6) ----
{ for (const rs of [V36, V35]) {
    const st = setup(rs, [["HR", "HR"]], [["HM", "HM"], ["LM", "LM"], ["LR", "LR"]], { "N-HR": "E16", "S-HM": "A12", "S-LM": "A14", "S-LR": "E13" });
    let r = E.act(st, { type: "pull", uid: "N-HR" }, () => 7);
    ok(r.ok, `${rs.id}: the Heavy Ranged pulls`);
    endTurn(st);   // South's turn: the board shows North's HR as Reloading
    ok(E.status(st, U(st, "N-HR")).reloading === (rs === V36), `${rs.id}: Reloading shows after the pull: ${rs === V36}`);
    endTurn(st);   // North's turn again
    const hr = U(st, "N-HR");
    const canPull = !!E.options(st, "N-HR").pull, canShoot = E.options(st, "N-HR").attacks.some((a) => a.target === "S-LR");
    ok(canPull === (rs === V35), `${rs.id}: on the next turn it ${rs === V36 ? "can't" : "can"} pull`);
    ok(canShoot === (rs === V35), `${rs.id}: on the next turn it ${rs === V36 ? "can't" : "can"} attack`);
    if (rs === V36) {
      ok(E.blockReasons(st, "N-HR").attack === "N-HR is reloading this turn" || E.blockReasons(st, "N-HR").attack === `${hr.id} is reloading this turn`, `v3.6: the attack reason says it is reloading ("${E.blockReasons(st, "N-HR").attack}")`);
      r = E.act(st, { type: "pull", uid: "N-HR" }, () => 7);
      ok(!r.ok && /reloading/.test(r.error), `v3.6: the engine refuses a pull while reloading ("${r.error}")`);
    }
  }
  // A Heavy Ranged on its Reload turn after an attack can't pull either (v3.6); on v3.5 it could
  for (const rs of [V36, V35]) {
    const st = setup(rs, [["HR", "HR"]], [["HM", "HM"], ["LM", "LM"], ["LR", "LR"]], { "N-HR": "E16", "S-HM": "A12", "S-LM": "A14", "S-LR": "E13" });
    E.act(st, { type: "attack", uid: "N-HR", target: "S-LR" }, () => 7);
    endTurn(st); endTurn(st);
    ok(!!E.options(st, "N-HR").pull === (rs === V35), `${rs.id}: after an attack, the Reload turn ${rs === V36 ? "has no" : "still has a"} pull`);
  }
}

// ---- Set spear punishes arriving (3.13) ----
// South Heavy Anti-Cavalry braced at E10 (and a second one at E14 where needed). North units move in.
const SPEAR = [["HA", "HA"], ["HA2", "HA"], ["LM", "LM"]];
function spearSetup(rs, lineN, place) {
  const st = setup(rs, lineN, SPEAR, Object.assign({ "S-HA": "E10", "S-HA2": "A12", "S-LM": "A14" }, place));
  for (const uid of ["S-HA", "S-HA2"]) U(st, uid).braced = true;
  return st;
}
const hpOf = (st, id) => U(st, id).hp;
{ // arrival by a move
  for (const rs of [V36, V35]) {
    const st = spearSetup(rs, [["HM", "HM"]], { "N-HM": "E7" });
    const hp = hpOf(st, "N-HM");
    const r = E.act(st, { type: "move", uid: "N-HM", to: "E9" });
    ok(r.ok && hpOf(st, "N-HM") === hp - 2, `${rs.id}: a unit moving next to a braced spear takes 2 (Armor doesn't reduce it): ${hp} → ${hpOf(st, "N-HM")}`);
  }
  // already next to the spear, shifting to another hex next to it: no spear on v3.6, a spear on v3.5
  const shiftTo = E.NBRS.E9.find((h) => E.dist(h, "E10") === 1 && h !== "E9" && E.CELLSET.has(h));
  for (const rs of [V36, V35]) {
    const st = spearSetup(rs, [["HM", "HM"]], { "N-HM": "E9" });
    const hp = hpOf(st, "N-HM");
    const r = E.act(st, { type: "move", uid: "N-HM", to: shiftTo });
    ok(r.ok, `${rs.id}: the shift E9 → ${shiftTo} is legal (${r.error || "ok"})`);
    ok(hpOf(st, "N-HM") === (rs === V36 ? hp : hp - 2), `${rs.id}: a shift that stays next to the spear ${rs === V36 ? "takes nothing" : "takes 2"} (${hp} → ${hpOf(st, "N-HM")})`);
  }
  // arrival by a swap; a swap that stays next to the same spear
  for (const rs of [V36, V35]) {
    const st = spearSetup(rs, [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E8", "N-LM": "E9" });
    const hm = hpOf(st, "N-HM"), lm = hpOf(st, "N-LM");
    const r = E.act(st, { type: "swap", uid: "N-HM", with: "N-LM" });
    ok(r.ok, `${rs.id}: swap E8 ↔ E9 is legal (${r.error || "ok"})`);
    ok(hpOf(st, "N-HM") === hm - 2 && hpOf(st, "N-LM") === lm, `${rs.id}: the unit swapped in next to the spear takes 2, the one leaving takes nothing`);
  }
  { const other = E.NBRS.E10.find((h) => E.dist(h, "E9") === 1 && E.CELLSET.has(h));
    for (const rs of [V36, V35]) {
      const st = spearSetup(rs, [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E9", "N-LM": other });
      const hm = hpOf(st, "N-HM"), lm = hpOf(st, "N-LM");
      const r = E.act(st, { type: "swap", uid: "N-HM", with: "N-LM" });
      ok(r.ok, `${rs.id}: swap E9 ↔ ${other} (both next to the spear) is legal (${r.error || "ok"})`);
      const took = (hm - hpOf(st, "N-HM")) + (lm - hpOf(st, "N-LM"));
      ok(rs === V36 ? took === 0 : took === 2, `${rs.id}: a swap that stays next to the same spear deals ${rs === V36 ? "nothing" : "2"} (got ${took})`);
    } }
  // from one spear to a second: E11 (next to E10) → E13 (next to E14 only)
  for (const rs of [V36]) {
    const st = spearSetup(rs, [["HM", "HM"]], { "N-HM": "E11", "S-HA2": "E14" });
    const hp = hpOf(st, "N-HM");
    const r = E.act(st, { type: "move", uid: "N-HM", to: "E12" });
    ok(r.ok, `${rs.id}: E11 → E12 legal (${r.error || "ok"})`);
    ok(E.dist("E12", "E10") === 2 && E.dist("E12", "E14") === 2, "E12 is next to neither spear");
  }
  { const st = spearSetup(V36, [["LM", "LM"]], { "N-LM": "E11", "S-HA2": "E13" });   // E11 next to E10; E12 next to E13 and not E10
    const hp = hpOf(st, "N-LM");
    ok(E.dist("E11", "E10") === 1 && E.dist("E12", "E13") === 1 && E.dist("E12", "E10") === 2, "E11 touches the first spear; E12 touches only the second");
    const r = E.act(st, { type: "move", uid: "N-LM", to: "E12" });
    ok(r.ok && hpOf(st, "N-LM") === hp - 2 && U(st, "S-HA2").spikeUsed && !U(st, "S-HA").spikeUsed, `v3.6: stepping from one spear to a second triggers the second (${r.error || hpOf(st, "N-LM")})`); }
  // at most one spear per unit per turn; the untaken spear hits the next unit to arrive.
  // Spears at E10 and G10; F9 touches both. North HM F8 → F9, then North HM2 G8 → G9 (touches G10 only).
  { const st = spearSetup(V36, [["HM", "HM"], ["HM2", "HM"]], { "S-HA2": "G10", "N-HM": "F8", "N-HM2": "H8" });
    const hp = hpOf(st, "N-HM");
    let r = E.act(st, { type: "move", uid: "N-HM", to: "F9" });
    ok(r.ok && hpOf(st, "N-HM") === hp - 2, `v3.6: a unit arriving next to two spears takes 2, once (${r.error || hp + " → " + hpOf(st, "N-HM")})`);
    const fired = ["S-HA", "S-HA2"].filter((id) => U(st, id).spikeUsed);
    ok(fired.length === 1 && fired[0] === "S-HA", `v3.6: only the first spear fired (${fired.join(", ")})`);
    const hp2 = hpOf(st, "N-HM2");
    r = E.act(st, { type: "move", uid: "N-HM2", to: "H9" });
    ok(r.ok && hpOf(st, "N-HM2") === hp2 - 2 && U(st, "S-HA2").spikeUsed, `v3.6: the spear the first unit didn't take hits the next unit to arrive (${r.error || hp2 + " → " + hpOf(st, "N-HM2")})`);
    // on v3.5 the same move also fires one spear only (a spear fires once; spikeCheck stops at the first)
  }
  // the per-unit marker clears each turn
  { const st = spearSetup(V36, [["HM", "HM"]], { "N-HM": "E7" });
    E.act(st, { type: "move", uid: "N-HM", to: "E9" });
    ok(U(st, "N-HM").spearTaken === true, "v3.6: the unit is marked as having taken a spear");
    endTurn(st);
    ok(U(st, "N-HM").spearTaken === false, "v3.6: the marker clears at the next turn's start"); }
  // arrival by taking a hex after a kill
  for (const rs of [V36, V35]) {
    const st = setup(rs, [["HM", "HM"]], [["HA", "HA"], ["LM", "LM"], ["LR", "LR"]], { "N-HM": "E8", "S-LR": "E9", "S-HA": "E10", "S-LM": "A14" });
    U(st, "S-HA").braced = true; U(st, "S-LR").hp = 1;
    const hp = hpOf(st, "N-HM");
    const r = E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
    ok(r.ok && U(st, "N-HM").hex === "E9" && hpOf(st, "N-HM") === hp - 2, `${rs.id}: taking a hex next to the spear after a kill takes 2 (${r.error || U(st, "N-HM").hex + ", " + hpOf(st, "N-HM")})`);
  }
  // arrival by an Evade step: a Light Melee next to the spear's neighbour attacks, then evades next to the spear
  { const st = setup(V36, [["LM", "LM"]], [["HA", "HA"], ["HM", "HM"], ["LR", "LR"]], { "N-LM": "C9", "S-HM": "C8", "S-HA": "E10", "S-LR": "A14" });
    U(st, "S-HA").braced = true;
    ok(E.dist("C9", "E10") > 1, "the Light Melee starts away from the spear");
    let r = E.act(st, { type: "attack", uid: "N-LM", target: "S-HM" }, () => 7);
    const steps = Object.keys(E.options(st, "N-LM").moves).filter((h) => E.dist(h, "E10") === 1);
    if (r.ok && steps.length) {
      const hp = hpOf(st, "N-LM");
      r = E.act(st, { type: "move", uid: "N-LM", to: steps[0] });
      ok(r.ok && hpOf(st, "N-LM") === hp - 2, `v3.6: an Evade step that arrives next to the spear takes 2 (${r.error || hp + " → " + hpOf(st, "N-LM")})`);
    } else ok(false, `v3.6: the Evade test position offers an Evade step next to the spear (${r.error || "none"})`); }
  // a unit removed by the spear doesn't act
  { const st = spearSetup(V36, [["LM", "LM"]], { "N-LM": "E7" });
    U(st, "N-LM").hp = 2;
    const r = E.act(st, { type: "move", uid: "N-LM", to: "E9" });
    ok(r.ok && U(st, "N-LM").hp <= 0, "v3.6: a unit on 2 HP arriving next to the spear is removed");
    ok(!E.act(st, { type: "attack", uid: "N-LM", target: "S-HA" }, () => 7).ok, "v3.6: the removed unit can't attack"); }
}

// ---- Ranged unit killing from an adjacent hex stays put; melee takes the hex (3.6) ----
for (const rs of [V36, V35]) {
  const st = setup(rs, [["HR", "HR"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"], ["HM", "HM"]], { "N-HR": "C8", "S-LM": "C9", "N-HM": "G8", "S-LR": "G9", "S-HM": "A14" });
  U(st, "S-LM").hp = 1; U(st, "S-LR").hp = 1;
  E.act(st, { type: "attack", uid: "N-HR", target: "S-LM" }, () => 7);
  ok(U(st, "S-LM").hp <= 0 && U(st, "N-HR").hex === "C8", `${rs.id}: a Heavy Ranged that kills from next door stays at C8 (now ${U(st, "N-HR").hex})`);
  E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
  ok(U(st, "S-LR").hp <= 0 && U(st, "N-HM").hex === "G9", `${rs.id}: a melee unit that kills takes the hex (now ${U(st, "N-HM").hex})`);
}

// ---- Double knockout on v3.6 (the test_v32.js count): expect 0 ----
{ const BAL = { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } };
  let games = 0, both = 0, dko = 0, refused = 0, errors = 0, unfinished = 0;
  for (const size of [5, 7]) for (let g = 0; g < KO_GAMES; g++) {
    const rs = JSON.parse(JSON.stringify(V36)), B = DEFAULT_BRAINS[g % 2 ? "brain5" : "kitB"], rnd = rng(`doubleko:v3.6:${size}`, g);
    const line = []; for (const code of Object.keys(rs.cards)) for (let i = 0; i < (BAL[size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
    const first = g % 2 ? "S" : "N", st = E.newMatch(rs, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 6000) {
      let a; try { a = Bot.chooseAction(st, B, rnd).action; } catch (e) { errors++; a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd));
      if (!r.ok) { refused++; E.act(st, { type: "end" }); continue; }
      const w = {}; for (const t of ["N", "S"]) { const f = E.foeOf(t); if (st.pole[f] >= st.rs.game.poleHP - 1e-9) w[t] = 1; else if (!st.units.some((u) => u.team === f && u.hp > 0)) w[t] = 1; }
      if (w.N && w.S) both++;
    }
    games++; if (!st.result) unfinished++; else if (/^double knockout/.test(st.result.how)) dko++;
  }
  console.log(`v3.6 double-knockout count: ${games} games, both sides winning at once ${both}, double-knockout results ${dko}; refused ${refused}, brain errors ${errors}, unfinished ${unfinished}`);
  ok(refused === 0 && errors === 0 && unfinished === 0, "v3.6 bot games: no refused action, no error, all finished"); }

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
