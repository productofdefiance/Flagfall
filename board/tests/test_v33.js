// v3.3 checks (Brief 004): Evade for Light units; tackle costs the leaving unit's hex cost and a hex of its cap.
// Each new rule is also run on v3.2, where it must show the old behaviour (fails before, passes after).
// node tests/test_v33.js
const E = require("../engine.js"); const { PRESETS } = require("../data.js");
const V33 = PRESETS.find((p) => p.id === "v3.3"), V32 = PRESETS.find((p) => p.id === "v3.2");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(rs, lineN, lineS, place) {
  const st = E.newMatch(rs, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
const hit = (st, uid, target) => E.act(st, { type: "attack", uid, target }, () => 7);   // 2d6 normal roll
const far = (st, uid, fromUid) => { const u = U(st, uid), t = U(st, fromUid);   // evade hexes must all be further away
  return Object.keys(E.options(st, uid).moves).every((h) => E.dist(h, t.hex) > E.dist(u.hex, t.hex)); };
const nb = (h) => E.NBRS[h];

ok(V33 && V33.switches.evade && V33.switches.tackleHexCost && V33.switches.tackleUsesCap, "v3.3 exists with evade, tackleHexCost, tackleUsesCap");
// Was "v3.3 is the last preset". Brief 005 adds v3.4 after it; the newest-preset check now lives in test_v34.js.
ok(PRESETS.indexOf(V33) >= 0 && PRESETS.indexOf(V33) < PRESETS.length - 1, "v3.3 is still offered, behind the newest preset");
ok(["LM", "LR", "LA"].every((c) => V33.cards[c].evade) && ["HM", "HR", "HA"].every((c) => !V33.cards[c].evade), "v3.3: the three Light cards have Evade, the Heavy ones don't");
{ const a = JSON.parse(JSON.stringify(V32)), b = JSON.parse(JSON.stringify(V33));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  for (const k of ["evade", "tackleHexCost", "tackleUsesCap"]) delete b.switches[k];
  for (const c of ["LM", "LR", "LA"]) delete b.cards[c].evade;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.3 is v3.2 apart from what this brief adds"); }

// Board: North Light Melee at E9 attacks a South Heavy Melee at E10 (survives the hit). Away from both goal zones.
const base = (rs, extra, lines) => setup(rs, (lines && lines.N) || [["LM", "LM"], ["HM", "HM"]], (lines && lines.S) || [["HM", "HM"], ["LR", "LR"]],
  Object.assign({ "N-LM": "E9", "S-HM": "E10", "N-HM": "A6", "S-LR": "I12" }, extra));

// ---- Item 2: Evade after an adjacent attack the target survives ----
for (const [rs, evades] of [[V32, false], [V33, true]]) {
  const st = base(rs); const r = hit(st, "N-LM", "S-HM");
  ok(r.ok && U(st, "S-HM").hp > 0, `${rs.id}: the attack lands and the target survives`);
  const o = E.options(st, "N-LM");
  ok(evades ? !U(st, "N-LM").done && Object.keys(o.moves).length > 0 && o.evading === "S-HM" : U(st, "N-LM").done && Object.keys(o.moves).length === 0,
    `${rs.id}: after the attack the Light unit ${evades ? "may keep moving (Evade)" : "has ended its turn (old rule)"}`);
  if (evades) {
    ok(far(st, "N-LM", "S-HM"), "v3.3: every Evade hex is further from the unit attacked");
    const closerOrSame = nb("E9").filter((h) => E.dist(h, "E10") <= E.dist("E9", "E10") && h !== "E10" && E.CELLSET.has(h));
    ok(closerOrSame.length > 0 && closerOrSame.every((h) => !E.act(st, { type: "move", uid: "N-LM", to: h }).ok), "v3.3: a step that isn't further away is refused");
    const away = "E8"; ok(E.dist(away, "E10") === 2, "(test geometry) E8 is 2 from E10");
    const r2 = E.act(st, { type: "move", uid: "N-LM", to: away });
    ok(r2.ok && U(st, "N-LM").hex === away && /evading/.test(st.log[st.log.length - 1].text), "v3.3: it steps away, and the log says it is evading");
    ok(far(st, "N-LM", "S-HM"), "v3.3: further evade steps must still take it further away");
    ok(!E.act(st, { type: "move", uid: "N-LM", to: "E9" }).ok, "v3.3: it can't step back towards the target");
  }
}
// Every step further: a multi-hex evade path never comes back closer, even if the end hex is far
{ const st = base(V33); hit(st, "N-LM", "S-HM");
  const moves = E.options(st, "N-LM").moves;
  ok(Object.keys(moves).every((h) => E.dist(h, "E10") >= 1 + moves[h].steps), "v3.3: each evade hex is exactly one hex further per step (no detours that come closer)"); }

// Remaining movement cap, Stamina and Command. Target: a Heavy Anti-Cavalry (zone, no tackle), so tackle doesn't mix in.
const baseNT = (rs, extra, lines) => setup(rs, [["LM", "LM"], ["HM", "HM"]], (lines && lines.S) || [["HA", "HA"], ["LR", "LR"]],
  Object.assign({ "N-LM": "E9", "S-HA": "E10", "N-HM": "A6", "S-LR": "I12" }, extra));
{ const st = baseNT(V33); U(st, "N-LM").moved = 3; hit(st, "N-LM", "S-HA");   // 3 of 4 hexes used before the attack
  const steps = Object.values(E.options(st, "N-LM").moves).map((m) => m.steps);
  ok(steps.length > 0 && Math.max(...steps) === 1, `v3.3: Evade uses the remaining movement cap (1 hex left; got ${Math.max(...steps)})`); }
{ const st = baseNT(V33); U(st, "N-LM").stam = 1.5; hit(st, "N-LM", "S-HA");   // 0.5 Stamina left after the attack
  const steps = Object.values(E.options(st, "N-LM").moves).map((m) => m.steps);
  ok(Math.max(...steps) === 1, "v3.3: Evade uses the remaining Stamina (0.5 = one Light hex)"); }
{ const st = baseNT(V33); st.cmd = 1.5; hit(st, "N-LM", "S-HA");
  const steps = Object.values(E.options(st, "N-LM").moves).map((m) => m.steps);
  ok(Math.max(...steps) === 1 && Math.abs(st.cmd - 0.5) < 1e-9, "v3.3: Evade uses the turn's remaining Command"); }
{ const st = baseNT(V33); hit(st, "N-LM", "S-HA"); const c0 = st.cmd, s0 = U(st, "N-LM").stam;
  E.act(st, { type: "move", uid: "N-LM", to: "E8" });
  ok(Math.abs(c0 - st.cmd - 0.5) < 1e-9 && Math.abs(s0 - U(st, "N-LM").stam - 0.5) < 1e-9 && U(st, "N-LM").moved === 1,
    "v3.3: each evade step costs the normal hex cost (0.5) and counts toward the cap"); }

// Zones: it may leave a zone it entered this turn (the target's), but stops on entering a new one.
{ const st = base(V33); U(st, "N-LM").zmode = "entered";   // walked into the Heavy Melee's zone this turn (hard stop)
  ok(Object.keys(E.options(st, "N-LM").moves).length === 0, "v3.3: before attacking, a hard-stopped unit can't move");
  hit(st, "N-LM", "S-HM");
  ok(Object.keys(E.options(st, "N-LM").moves).length > 0, "v3.3: after attacking it may Evade out of the zone it entered this turn");
  const st2 = base(V32); U(st2, "N-LM").zmode = "entered"; hit(st2, "N-LM", "S-HM");
  ok(Object.keys(E.options(st2, "N-LM").moves).length === 0, "v3.2: no Evade out of the zone (old rule)"); }
{ // A South Heavy Melee behind: stepping next to it (its zone) stops the evade there.
  const st = baseNT(V33, { "S-HM": "E7" }, { S: [["HA", "HA"], ["HM", "HM"], ["LR", "LR"]] });
  ok(E.dist("E7", "E8") === 1 && E.dist("E7", "E9") === 2, "(test geometry) E8 is next to E7, E9 is not");
  hit(st, "N-LM", "S-HA");
  const m = E.options(st, "N-LM").moves["E8"];
  ok(m && m.mode !== "free", "v3.3: an evade step into another enemy's zone is marked as stopping there");
  E.act(st, { type: "move", uid: "N-LM", to: "E8" });
  ok(Object.keys(E.options(st, "N-LM").moves).length === 0, "v3.3: after entering a new zone the evade stops (hard stop)"); }

// Tackle while evading costs the tackle cost (item 3) and a hex of the cap (item 4)
{ const st = base(V33, { "S-LM": "D9" }, { N: [["LM", "LM"], ["HM", "HM"]], S: [["HM", "HM"], ["LM", "LM"], ["LR", "LR"]] });
  hit(st, "N-LM", "S-HM");
  const m = E.options(st, "N-LM").moves["E8"];
  ok(m && m.tackle && Math.abs(m.cost - 1) < 1e-9, `v3.3: an evade step that breaks tackle costs 0.5 + 0.5 tackle (got ${m && m.cost})`); }

// After evading (or while it may evade) no attack, brace, pull or swap
{ const st = base(V33, { "N-HM": "D10" }); hit(st, "N-LM", "S-HM");
  ok(!E.act(st, { type: "attack", uid: "N-LM", target: "S-HM" }).ok, "v3.3: no second attack while it may evade");
  ok(!E.act(st, { type: "brace", uid: "N-LM" }).ok, "v3.3: no brace while it may evade");
  ok(!E.act(st, { type: "swap", uid: "N-HM", with: "N-LM" }).ok && !E.act(st, { type: "swap", uid: "N-LM", with: "N-HM" }).ok, "v3.3: no swap with an evading unit");
  E.act(st, { type: "move", uid: "N-LM", to: "E8" });
  ok(!E.act(st, { type: "attack", uid: "N-LM", target: "S-HM" }).ok && !E.act(st, { type: "brace", uid: "N-LM" }).ok, "v3.3: no attack or brace after evading");
  const o = E.options(st, "N-LM"); ok(o.attacks.length === 0 && !o.brace && !o.pull && o.swaps.length === 0, "v3.3: the board offers only moves while evading"); }
{ // pull: a Light unit next to the enemy flag attacks a defender, then may not pull
  const st = setup(V33, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E16", "S-LR": "D16", "S-HM": "A12", "N-HM": "A6" });
  ok(E.dist("E16", "D16") === 1, "(test geometry) E16 next to D16");
  hit(st, "N-LM", "S-LR");
  if (U(st, "S-LR").hp > 0) ok(!E.act(st, { type: "pull", uid: "N-LM" }).ok, "v3.3: no pull while it may evade");
  else ok(true, "v3.3: (pull check skipped: the shot killed)"); }

// No Evade from 2+ hexes, after a kill, or for a Heavy unit
for (const [rs] of [[V33]]) {
  // Reach: Light Anti-Cavalry from 2 hexes
  let st = setup(rs, [["LA", "LA"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LA": "E8", "S-HM": "E10", "N-HM": "A6", "S-LR": "I12" });
  let r = hit(st, "N-LA", "S-HM");
  ok(r.ok && U(st, "N-LA").done, "v3.3: no Evade after a Reach attack from 2 hexes");
  // Light Ranged shooting from range
  st = setup(rs, [["LR", "LR"], ["HM", "HM"]], [["HM", "HM"], ["LM", "LM"]], { "N-LR": "E7", "S-HM": "E10", "N-HM": "A6", "S-LM": "I12" });
  r = hit(st, "N-LR", "S-HM");
  ok(r.ok && U(st, "N-LR").done, "v3.3: no Evade after a Light Ranged shot from range");
  // A kill: the attacker takes the hex and its turn ends
  st = base(rs); U(st, "S-HM").hp = 1; r = hit(st, "N-LM", "S-HM");
  ok(r.ok && U(st, "S-HM").hp <= 0 && U(st, "N-LM").hex === "E10" && U(st, "N-LM").done, "v3.3: after a kill the Light unit takes the hex and its turn ends (no Evade)");
  // Heavy
  st = setup(rs, [["HM", "HM"], ["LM", "LM"]], [["HM", "HM"], ["LR", "LR"]], { "N-HM": "E9", "S-HM": "E10", "N-LM": "A6", "S-LR": "I12" });
  r = hit(st, "N-HM", "S-HM");
  ok(r.ok && U(st, "N-HM").done, "v3.3: a Heavy unit has no Evade");
}
// Light Ranged attacking from an adjacent hex (half Strength) may then evade
{ const st = setup(V33, [["LR", "LR"], ["HM", "HM"]], [["HM", "HM"], ["LM", "LM"]], { "N-LR": "E9", "S-HM": "E10", "N-HM": "A6", "S-LM": "I12" });
  hit(st, "N-LR", "S-HM");
  ok(/halved/.test(st.log[st.log.length - 1].text) && !U(st, "N-LR").done && Object.keys(E.options(st, "N-LR").moves).length > 0, "v3.3: a Light Ranged shot from an adjacent hex is halved, then it may evade"); }
// Ending an evade: End unit, or another unit acting
{ const st = base(V33); hit(st, "N-LM", "S-HM");
  ok(E.act(st, { type: "done", uid: "N-LM" }).ok && U(st, "N-LM").done && !U(st, "N-LM").evadeFrom, "v3.3: End unit ends the evade without moving"); }
{ const st = base(V33); hit(st, "N-LM", "S-HM");
  E.act(st, { type: "move", uid: "N-HM", to: E.NBRS["A6"].find((h) => !E.alive(st).some((x) => x.hex === h)) });
  ok(U(st, "N-LM").done && Object.keys(E.options(st, "N-LM").moves).length === 0, "v3.3: another unit acting ends the evade"); }
// Preview on the board
{ const st = baseNT(V33); const a = E.options(st, "N-LM").attacks.find((x) => x.target === "S-HA");
  ok(a && a.evade && a.evade.hexes === 4, `v3.3: the attack preview offers Evade after: up to 4 hexes (got ${a && a.evade && a.evade.hexes})`);
  // Next to a tackling Heavy Melee, breaking away costs 0.5 more and a hex of the cap: 3 hexes (Brief 005 item 4: the preview counts tackle)
  const st1 = base(V33); const a1 = E.options(st1, "N-LM").attacks.find((x) => x.target === "S-HM");
  ok(a1 && a1.evade && a1.evade.hexes === 3, `v3.3: next to a tackling unit the preview counts tackle (3 hexes; got ${a1 && a1.evade && a1.evade.hexes})`);
  const st2 = base(V32); const a2 = E.options(st2, "N-LM").attacks.find((x) => x.target === "S-HM");
  ok(a2 && !a2.evade, "v3.2: no Evade in the preview"); }

// ---- Interactions ----
// Set spear: an evade step that ends next to a braced Heavy Anti-Cavalry (its first entry this turn) takes set spear.
{ const st = base(V33, { "S-HA": "E6" }, { N: [["LM", "LM"], ["HM", "HM"]], S: [["HM", "HM"], ["HA", "HA"], ["LR", "LR"]] });
  U(st, "S-HA").braced = true; hit(st, "N-LM", "S-HM"); const hp0 = U(st, "N-LM").hp;
  const r = E.act(st, { type: "move", uid: "N-LM", to: "E8" });
  ok(r.ok && E.dist("E8", "E6") === 2, "(test geometry) E8 is 2 from E6");
  // E8 isn't next to E6, so pick an evade hex that is
  const st2 = base(V33, { "S-HA": "E7" }, { N: [["LM", "LM"], ["HM", "HM"]], S: [["HM", "HM"], ["HA", "HA"], ["LR", "LR"]] });
  U(st2, "S-HA").braced = true; hit(st2, "N-LM", "S-HM"); const hp1 = U(st2, "N-LM").hp;
  E.act(st2, { type: "move", uid: "N-LM", to: "E8" });
  ok(U(st2, "N-LM").hp === hp1 - V33.spikeDamage, "v3.3: an evade step next to a braced Heavy Anti-Cavalry takes set spear"); }
// Flag holder: a Light holder that attacks from its flag may evade off it; the flag drops to its own HP.
{ const st = setup(V33, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E3", "S-HM": "E4", "N-HM": "A6", "S-LR": "I12" });
  hit(st, "N-LM", "S-HM");
  const awayHex = Object.keys(E.options(st, "N-LM").moves)[0];
  ok(!!awayHex, "v3.3: a Light holder that attacked from its flag may evade off it");
  E.act(st, { type: "move", uid: "N-LM", to: awayHex });
  ok(!E.holderOf(st, "N") && E.flagShown(st, "N") <= V33.game.poleHP && U(st, "N-LM").hex !== "E3", "v3.3: after evading off, the flag is unheld and shows its own HP"); }

// ---- Item 3: tackle costs the leaving unit's hex cost ----
for (const [rs, lightCost] of [[V32, 1], [V33, 0.5]]) {
  const st = setup(rs, [["LM", "LM"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"]], { "N-LM": "E9", "S-LM": "E10", "N-HM": "A6", "S-LR": "I12" });
  const m = E.options(st, "N-LM").moves["E8"];
  ok(m && m.tackle && Math.abs(m.cost - (0.5 + lightCost)) < 1e-9, `${rs.id}: a Light unit breaking tackle pays ${lightCost} extra (got ${m && m.cost - 0.5})`);
}
for (const rs of [V32, V33]) {
  const st = setup(rs, [["HM", "HM"], ["LM", "LM"]], [["LM", "LM"], ["LR", "LR"]], { "N-HM": "E9", "S-LM": "E10", "N-LM": "A6", "S-LR": "I12" });
  const m = E.options(st, "N-HM").moves["E8"];
  ok(m && m.tackle && Math.abs(m.cost - 2) < 1e-9, `${rs.id}: a Heavy unit breaking tackle pays 1 extra`);
}
{ const st = setup(V33, [["LM", "LM"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"]], { "N-LM": "E9", "S-LM": "E10", "N-HM": "A6", "S-LR": "I12" });
  E.act(st, { type: "move", uid: "N-LM", to: "E8" });
  ok(/including 0\.5 for tackle/.test(st.log[st.log.length - 1].text), "v3.3: the log names the 0.5 tackle cost");
  U(st, "S-LM").hex = "E7";   // contact again; tackle is once a turn
  const m = E.options(st, "N-LM").moves["F8"] || Object.values(E.options(st, "N-LM").moves).find((x) => true);
  ok(m && !m.tackle, "v3.3: tackle is paid once a turn"); }

// ---- Item 4: the tackle hex uses up one hex of the movement cap ----
for (const [rs, maxSteps] of [[V32, 4], [V33, 3]]) {
  const st = setup(rs, [["LM", "LM"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"]], { "N-LM": "E9", "S-LM": "E10", "N-HM": "A6", "S-LR": "I12" });
  const tackled = Object.values(E.options(st, "N-LM").moves).filter((m) => m.tackle).map((m) => m.steps);
  ok(Math.max(...tackled) === maxSteps, `${rs.id}: breaking tackle, a Light Melee can move at most ${maxSteps} hexes (got ${Math.max(...tackled)})`);
}
{ const st = setup(V33, [["LM", "LM"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"]], { "N-LM": "E9", "S-LM": "E10", "N-HM": "A6", "S-LR": "I12" });
  E.act(st, { type: "move", uid: "N-LM", to: "E8" });
  ok(U(st, "N-LM").moved === 2 && /and 1 hex of movement/.test(st.log[st.log.length - 1].text), "v3.3: one step that breaks tackle counts as 2 hexes of the cap"); }
{ // a swap that breaks tackle also uses the hex
  const st = setup(V33, [["LM", "LM"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"]], { "N-LM": "E9", "N-HM": "E8", "S-LM": "E10", "S-LR": "I12" });
  U(st, "N-LM").moved = 3;   // 1 hex of cap left: a swap that breaks tackle needs 2
  ok(!E.act(st, { type: "swap", uid: "N-LM", with: "N-HM" }).ok, "v3.3: a swap that breaks tackle needs 2 hexes of cap");
  const st2 = setup(V32, [["LM", "LM"], ["HM", "HM"]], [["LM", "LM"], ["LR", "LR"]], { "N-LM": "E9", "N-HM": "E8", "S-LM": "E10", "S-LR": "I12" });
  U(st2, "N-LM").moved = 3;
  ok(E.act(st2, { type: "swap", uid: "N-LM", with: "N-HM" }).ok, "v3.2: the same swap is allowed (old rule)"); }

// Old rule sets keep no Evade bookkeeping
{ const st = base(V32); hit(st, "N-LM", "S-HM"); ok(!("evadeFrom" in U(st, "N-LM")), "v3.2: no Evade bookkeeping is added to units"); }

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
