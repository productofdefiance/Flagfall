// @test job=rules quick=4 release=4 night=no
// v3.10 checks (Brief 028, Game Laws 6.17 and 3.2, locked by the Editor 23 Nov; F022-9): Arrow Storm 1.5 times a
// normal shot (was 2), still ignoring Dodge, and minimum damage 0.5 (was 1). Every rule the brief lists under "Rules it
// touches" is a check here on v3.10, and each is checked against v3.9 in the same position: the only difference is the
// multiplier (and the floor). The minimum-damage and half-point checks fail on v3.9 and pass on v3.10.
// Ends with seeded Brain 8 games on v3.10, every action checked legal and no hit, pull or special below 0.5.
// node tests/test_v310.js [seeded games per format, default 4; the Report ran 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const UI = require("../ui.js"), rng = require("./rng.js");
const V310 = PRESETS.find((p) => p.id === "v3.10"), V39 = PRESETS.find((p) => p.id === "v3.9");
const GAMES = +(process.argv[2] || 4);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const U = (st, id) => E.unitByUid(st, id);
const LINE = [["HM", "HM"], ["HM2", "HM"], ["LM", "LM"], ["HR", "HR"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]].map(([id, card]) => ({ id, card }));
const copy = (x) => JSON.parse(JSON.stringify(x));

// ---- The preset ----
ok(V310 && PRESETS[PRESETS.length - 1] === V310, "v3.10 is the newest preset (the new-game default)");
ok(V310.name === "v3.10 (2026-11-23)" && /Arrow Storm 1\.5 times/.test(V310.note) && /minimum damage 0\.5/.test(V310.note), "v3.10's name and note");
ok(V310.specials.arrowStorm.mult === 1.5 && V310.game.minDamage === 0.5, "Arrow Storm 1.5, minimum damage 0.5");
ok(V39.specials.arrowStorm.mult === 2 && V39.game.minDamage === 1, "v3.9 unchanged: Arrow Storm 2, minimum damage 1");
{ const a = copy(V39), b = copy(V310);
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  b.specials.arrowStorm.mult = 2; b.game.minDamage = 1;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.10 is v3.9 with only the Arrow Storm multiplier and the minimum damage changed"); }

/** A 7v7 match on `rs`, deployed, then units placed by hand (the rest parked out of the way). North to move. */
function setup(rs, place, opt) {
  rs = copy(rs);
  if (opt && opt.str) for (const c in opt.str) rs.cards[c].str = opt.str[c];   // only the floor checks use this
  const st = E.newMatch(rs, { first: "N", lineups: { N: LINE, S: LINE } });
  const G = E.fieldOf(st);
  for (const t of ["N", "S"]) {
    const z = E.deployZone(st, t).filter((h) => h !== G.FLAG[t]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === t)) p[u.uid] = z[i++];
    const r = E.act(st, { type: "deploy", team: t, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  const park = { N: ["A5", "B3", "H3", "I5", "A6", "I6", "B4"], S: ["A15", "B17", "H17", "I15", "A14", "I14", "B16"] };
  for (const u of st.units) if (!place[u.uid]) u.hex = park[u.team].shift();
  for (const uid in place) { if (!G.CELLS.includes(place[uid])) throw new Error(`no hex ${place[uid]}`); U(st, uid).hex = place[uid]; }
  for (const u of st.units) { u.done = false; u.moved = 0; u.stam = 3; u.braced = false; }
  st.cmd = 10;
  return st;
}
const A = (st, a) => E.act(st, a, () => { throw new Error("a special must never roll"); });
const nextTurn = (st) => { E.act(st, { type: "end" }); E.act(st, { type: "end" }); };
function charge(st, uid) { const r = A(st, { type: "warmup", uid }); if (!r.ok) throw new Error(r.error); nextTurn(st); return U(st, uid).sp; }
const hpOf = (st, uid) => U(st, uid).hp;
const stormHit = (st, target) => { const o = E.options(st, "N-LR").special; const t = o && o.targets.find((x) => x.target === target); return t && t.hits[0]; };
/** The same position on v3.9 and v3.10, North's Light Ranged charged: the two Storm hits on `target`. */
function pair(place, target, before) {
  const out = {};
  for (const rs of [V39, V310]) {
    const st = setup(rs, place);
    charge(st, "N-LR");
    if (before) before(st);
    out[rs.id] = { st, h: stormHit(st, target) };
  }
  return out;
}
/** Everything about the two hits matches except the multiplier and the damage it makes (6.17: only the multiplier changes). */
function sameButMult(p, what) {
  const a = p["v3.9"].h, b = p["v3.10"].h;
  ok(a && b, `${what}: Storm can target on both presets`);
  if (!a || !b) return;
  const strip = (h) => { const x = copy(h); delete x.mult; delete x.dmg; delete x.kills; return x; };
  ok(JSON.stringify(strip(a)) === JSON.stringify(strip(b)), `${what}: value, parts, Dodge and detail are identical on v3.9 and v3.10`);
  ok(a.mult === 2 && b.mult === 1.5, `${what}: multiplier 2 on v3.9, 1.5 on v3.10`);
  const d = b.dodgeIgnored ? 0 : b.dodge;
  ok(b.dmg === Math.max(0.5, E.half(b.value * (1 - d / 100) * 1.5)), `${what}: v3.10 deals ${b.value} × 1.5 = ${b.dmg}`);
}

// ---- The damage itself, and the half-point edges ----
{ const p = pair({ "N-LR": "E8", "S-LR": "E11" }, "S-LR");
  sameButMult(p, "clean Storm on a Light Ranged at range");
  ok(p["v3.9"].h.dmg === 14 && p["v3.10"].h.dmg === 10.5, `7 × 2 = 14 on v3.9, 7 × 1.5 = 10.5 on v3.10 (got ${p["v3.9"].h.dmg}, ${p["v3.10"].h.dmg})`);
  for (const id of ["v3.9", "v3.10"]) {
    const st = p[id].st;
    ok(A(st, { type: "special", uid: "N-LR", target: "S-LR" }).ok, `${id}: fire Arrow Storm`);
    if (id === "v3.9") ok(hpOf(st, "S-LR") <= 0, "v3.9: a full Light Ranged is removed by one clean Storm");
    else ok(hpOf(st, "S-LR") === 1.5, `v3.10: a full Light Ranged (12) survives a clean Storm on 1.5 (has ${hpOf(st, "S-LR")})`);
  }
}
for (const hp of [10.5, 10, 6]) {
  const st = setup(V310, { "N-LR": "E8", "S-LR": "E11" }); charge(st, "N-LR"); U(st, "S-LR").hp = hp;
  ok(stormHit(st, "S-LR").kills && A(st, { type: "special", uid: "N-LR", target: "S-LR" }).ok && hpOf(st, "S-LR") <= 0, `v3.10: a Light Ranged on ${hp} is removed by a clean Storm`);
}
{ const st = setup(V310, { "N-LR": "E8", "S-LR": "E11" }); charge(st, "N-LR"); U(st, "S-LR").hp = 11;
  ok(!stormHit(st, "S-LR").kills && A(st, { type: "special", uid: "N-LR", target: "S-LR" }).ok && hpOf(st, "S-LR") === 0.5, "v3.10: a Light Ranged on 11 survives on 0.5 (half points, no rounding)"); }

// ---- Dodge ignored (3.10), Brace and Light brace benefits (3.12, 3.14) ----
{ const p = pair({ "N-LR": "E8", "S-LM": "E11" }, "S-LM", (st) => { U(st, "S-LM").braced = true; });   // Weave doubles Dodge
  sameButMult(p, "Storm on a braced Light Melee (Weave)");
  const h = p["v3.10"].h;
  ok(h.dodge > 0 && h.dodgeIgnored && h.value === 7 - 2 && h.dmg === 7.5, `v3.10: Dodge ${h.dodge}% ignored, Brace's 2 less applies: (7 − 2) × 1.5 = ${h.dmg}`);
}
{ const p = pair({ "N-LR": "E8", "S-LR": "E11" }, "S-LR", (st) => { U(st, "S-LR").braced = true; });
  sameButMult(p, "Storm on a braced Light Ranged"); }
{ const p = pair({ "N-LR": "E8", "S-HA": "E11" }, "S-HA", (st) => { U(st, "S-HA").braced = true; });
  sameButMult(p, "Storm on a braced Heavy Anti-Cavalry (Armor and Brace)"); }

// ---- Adjacent: Volley's half (3.11), set spear (3.13), Evade (6.5) ----
{ const p = pair({ "N-LR": "E9", "S-HM": "E10" }, "S-HM");
  sameButMult(p, "adjacent Storm on a Heavy Melee (whatever Volley's half does on v3.9)");
  for (const id of ["v3.9", "v3.10"]) {
    const st = p[id].st, prev = E.evadePreview ? JSON.stringify(E.options(st, "N-LR").special.targets.find((t) => t.target === "S-HM").evade || null) : null;
    ok(A(st, { type: "special", uid: "N-LR", target: "S-HM" }).ok && hpOf(st, "S-HM") > 0 && U(st, "N-LR").evadeFrom === "S-HM", `${id}: Evade after an adjacent Storm that doesn't kill`);
    p[id].evade = prev; p[id].moves = Object.keys(E.options(st, "N-LR").moves).sort().join(",");
  }
  ok(p["v3.9"].evade === p["v3.10"].evade && p["v3.9"].moves === p["v3.10"].moves, "the Evade preview and the steps offered are the same on v3.9 and v3.10");
}
{ const p = pair({ "N-LR": "E9", "S-HA": "E10" }, "S-HA", (st) => { U(st, "S-HA").braced = true; });
  sameButMult(p, "adjacent Storm on a braced Heavy Anti-Cavalry (set spear)");
  const after = {};
  for (const id of ["v3.9", "v3.10"]) { const st = p[id].st, h0 = hpOf(st, "N-LR"); A(st, { type: "special", uid: "N-LR", target: "S-HA" }); after[id] = h0 - hpOf(st, "N-LR"); }
  ok(after["v3.9"] === after["v3.10"], `set spear does the same to the firing Light Ranged on both presets (${after["v3.9"]}, ${after["v3.10"]})`);
}
{ const st = setup(V310, { "N-LR": "E9", "S-LM": "E10" }); charge(st, "N-LR"); U(st, "S-LM").hp = 1;
  ok(A(st, { type: "special", uid: "N-LR", target: "S-LM" }).ok && hpOf(st, "S-LM") <= 0 && U(st, "N-LR").hex === "E9" && !U(st, "N-LR").evadeFrom, "v3.10: an adjacent Storm kill never takes the hex, no Evade"); }

// ---- Warm-up and firing (6.16), Reload on the next turn ----
{ const st = setup(V310, { "N-LR": "E8", "S-HM": "E11", "S-LR": "D10" });
  const s0 = U(st, "N-LR").stam, c0 = st.cmd;
  ok(A(st, { type: "warmup", uid: "N-LR" }).ok && U(st, "N-LR").stam === s0 - 1 && st.cmd === c0 - 1, "v3.10: warm-up costs 1 Stamina and 1 Command");
  ok(!E.act(st, { type: "attack", uid: "N-LR", target: "S-HM" }, () => 7).ok, "no attack on the warm-up turn");
  ok(!E.act(st, { type: "brace", uid: "N-LR" }).ok, "no brace on the warm-up turn");
  ok(!A(st, { type: "special", uid: "N-LR", target: "S-HM" }).ok, "no firing on the warm-up turn");
  nextTurn(st);
  ok(U(st, "N-LR").sp === "charged", "charged on its next turn");
  nextTurn(st);
  ok(U(st, "N-LR").sp === "unused", "unfired, it lapses back to Unused");
  ok(A(st, { type: "warmup", uid: "N-LR" }).ok, "and can warm up again");
  nextTurn(st);
  ok(A(st, { type: "special", uid: "N-LR", target: "S-LR" }).ok && hpOf(st, "S-LR") === 1.5 && U(st, "N-LR").sp === "used", `fired after a re-warm: 10.5 to the Light Ranged (left on ${hpOf(st, "S-LR")})`);
  ok(!A(st, { type: "warmup", uid: "N-LR" }).ok, "once a match");
}
{ // the pull on the warm-up turn is refused (a pull counts as an attack)
  const st = setup(V310, { "N-LR": "E16", "S-HM": "A14" });
  ok(A(st, { type: "warmup", uid: "N-LR" }).ok && !E.act(st, { type: "pull", uid: "N-LR" }, () => 7).ok, "v3.10: no pull on the warm-up turn"); }
{ // Reload: whatever v3.9 does the turn after a Storm, v3.10 does
  const r = {};
  for (const rs of [V39, V310]) {
    const st = setup(rs, { "N-LR": "E8", "S-HM": "E11" }); charge(st, "N-LR");
    A(st, { type: "special", uid: "N-LR", target: "S-HM" }); nextTurn(st);
    r[rs.id] = E.canAttackFrom(st, U(st, "N-LR"), U(st, "N-LR").hex, U(st, "S-HM"));
  }
  ok(r["v3.9"] === r["v3.10"], `attacking the turn after a Storm: the same on both presets (${r["v3.9"]})`);
}
{ // firing from a held flag (4.5): North's Light Ranged holds E3
  const st = setup(V310, { "N-LR": "E3", "S-LR": "E6" });
  ok(E.isHolder(st, U(st, "N-LR")), "North's Light Ranged holds E3");
  charge(st, "N-LR");
  ok(A(st, { type: "special", uid: "N-LR", target: "S-LR" }).ok && hpOf(st, "S-LR") === 1.5 && U(st, "N-LR").hex === "E3", `v3.10: a holder fires Storm from its flag (left on ${hpOf(st, "S-LR")}) and stays on it`);
}

// ---- Targets (6.17): never a flag hex; the flag block (4.9) ----
{ const st = setup(V310, { "N-LR": "E15", "S-HM": "E17" }); charge(st, "N-LR");
  ok(E.isHolder(st, U(st, "S-HM")) && !E.specialCanTarget(st, U(st, "N-LR"), U(st, "S-HM")) && !stormHit(st, "S-HM"), "v3.10: the flag holder is never a Storm target");
  ok(!A(st, { type: "special", uid: "N-LR", target: "S-HM" }).ok, "the engine refuses it"); }
{ const st = setup(V310, { "N-LR": "E14", "S-HM": "E18" }); charge(st, "N-LR");
  ok(E.flagBetween("E14", "E18") === true || E.fieldOf(st).flagBetween("E14", "E18"), "E17 lies between E14 and E18");
  ok(!E.specialCanTarget(st, U(st, "N-LR"), U(st, "S-HM")), "v3.10: Storm blocked by the flag in the line"); }

// ---- On screen: the special's description comes from the number ----
ok(UI.specialAbout(V310, "arrowStorm") === "1.5 times a normal shot. Dodge doesn't count.", `v3.10 description: "${UI.specialAbout(V310, "arrowStorm")}"`);
for (const rs of PRESETS.filter((p) => p.specials && p.id !== "v3.10"))
  ok(UI.specialAbout(rs, "arrowStorm") === "Twice a normal shot. Dodge doesn't count.", `${rs.id} description still says Twice`);

// ---- Minimum damage 0.5 (Game Laws 3.2): each check fails on v3.9 and passes on v3.10 ----
// The floor is reached by giving a card a tiny Strength in a copy of the preset; minDamage is the preset's own.
for (const [rs, want] of [[V39, 1], [V310, 0.5]]) {
  // a normal hit: Strength 1 at range, the smallest roll (2 → ×0.5) = 0.5
  { const st = setup(rs, { "N-LR": "E8", "S-HM": "E11" }, { str: { LR: 1 } }); const h0 = hpOf(st, "S-HM");
    E.act(st, { type: "attack", uid: "N-LR", target: "S-HM" }, () => 2);
    ok(h0 - hpOf(st, "S-HM") === want, `${rs.id}: a hit that comes to 0.5 deals ${want} (dealt ${h0 - hpOf(st, "S-HM")})`); }
  // a hit that comes to 0: Strength 2 into Brace's 2 less
  { const st = setup(rs, { "N-LR": "E8", "S-LM": "E11" }, { str: { LR: 2 } }); U(st, "S-LM").braced = true; const h0 = hpOf(st, "S-LM");
    E.act(st, { type: "attack", uid: "N-LR", target: "S-LM" }, () => 7);
    ok(h0 - hpOf(st, "S-LM") === want, `${rs.id}: a hit that comes to 0 deals ${want} (dealt ${h0 - hpOf(st, "S-LM")})`); }
  // a pull: Strength 1, the smallest roll = 0.5
  { const st = setup(rs, { "N-LR": "E16", "S-HM": "A14" }, { str: { LR: 1 } });
    ok(E.act(st, { type: "pull", uid: "N-LR" }, () => 2).ok && st.pole.S === want, `${rs.id}: a pull that comes to 0.5 deals ${want} (flag took ${st.pole.S})`); }
  // a special: Arc Hit (1 times) from Strength 2.5 into Brace's 2 less = 0.5
  { const st = setup(rs, { "N-HM": "E9", "S-LM": "E10" }, { str: { HM: 2.5 } }); charge(st, "N-HM"); U(st, "S-LM").braced = true; const h0 = hpOf(st, "S-LM");
    const pv = E.options(st, "N-HM").special.targets[0].hits[0];
    ok(A(st, { type: "special", uid: "N-HM", target: "S-LM" }).ok && h0 - hpOf(st, "S-LM") === want && pv.dmg === want, `${rs.id}: a special that comes to 0.5 deals ${want}, and the preview says so (dealt ${h0 - hpOf(st, "S-LM")})`); }
  // a special that comes to 0
  { const st = setup(rs, { "N-HM": "E9", "S-LM": "E10" }, { str: { HM: 2 } }); charge(st, "N-HM"); U(st, "S-LM").braced = true; const h0 = hpOf(st, "S-LM");
    ok(A(st, { type: "special", uid: "N-HM", target: "S-LM" }).ok && h0 - hpOf(st, "S-LM") === want, `${rs.id}: a special that comes to 0 deals ${want}`); }
}
{ // the attack preview's cases use the same number: the lowest is 0.5, never 0
  const st = setup(V310, { "N-LR": "E8", "S-HM": "E11" });
  const cs = E.dieCases(st).map(([d]) => E.applyDie(st, 1, d, 0)), zero = E.dieCases(st).map(([d]) => E.applyDie(st, 0, d, 0));
  ok(Math.min(...cs) === 0.5 && Math.min(...zero) === 0.5, `v3.10: the lowest case of a 1-point or 0-point hit is 0.5, never 0 (${cs.join(" ")})`);
}

// ---- Seeded Brain 8 games on v3.10: every action legal, nothing below 0.5 ----
{ const B = DEFAULT_BRAINS.brain8 || DEFAULT_BRAINS[Object.keys(DEFAULT_BRAINS).pop()];
  let illegal = 0, low = 0, games = 0, fired = 0, dealt = 0;
  for (const size of [5, 7]) for (let g = 0; g < GAMES; g++) {
    const rs = copy(V310), R = rng(`v310-${size}`, g);
    const codes = size === 5 ? ["HM", "HM", "HA", "LM", "LR"] : ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];
    const k = {}; const line = codes.map((c) => { k[c] = (k[c] || 0) + 1; return { id: k[c] === 1 ? c : c + k[c], card: c }; });
    const first = g % 2 ? "S" : "N";
    const st = E.newMatch(rs, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, R) });
    let steps = 0;
    while (st.phase === "play" && steps++ < 6000) {
      const a = Bot.chooseAction(st, B, R).action;
      const r = E.act(st, a, () => E.rollWith(st, R));
      if (!r.ok) { illegal++; console.log(`illegal: ${size}v${size} game ${g}: ${JSON.stringify(a)}: ${r.error}`); E.act(st, { type: "end" }); continue; }
      if (a.type === "special") fired++;
    }
    for (const line of st.log) {
      const m = /→ (\d+(?:\.\d+)?)/.exec(typeof line === "string" ? line : line.text || "");
      if (m) { dealt++; if (+m[1] < 0.5) low++; }
    }
    games++;
  }
  ok(illegal === 0, `no illegal action in ${games} seeded Brain 8 games on v3.10 (${illegal})`);
  ok(low === 0 && dealt > 0, `no hit or pull logged below 0.5 (${dealt} checked)`);
  console.log(`seeded games: ${games}, specials fired ${fired}, rolled hits and pulls checked ${dealt}`);
}

console.log(`${n - fails}/${n} v3.10 checks passed`);
if (fails) process.exit(1);
