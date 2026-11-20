// Brain 8 checks (Brief 022): all four behaviours off plays exactly as Brain 5; the six test positions of the brief's
// Bot minimum, each printing the model's reasoning; then legal play over seeded games.
// node tests/test_brain8.js [games per format and lineup, default 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS, BRAIN_LABELS } = require("../brain.js");
const RS = PRESETS[PRESETS.length - 1], B5 = DEFAULT_BRAINS.brain5, B7 = DEFAULT_BRAINS.brain7, B8 = DEFAULT_BRAINS.brain8;
const RS_B4 = PRESETS.find((p) => p.id === "v3.6");   // Brain 7's holder-joins position (test_brain7.js) was built on v3.6
const games = process.argv[2] === undefined ? 30 : +process.argv[2];
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const FIVE = [["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]];
/** A 5v5 position: deploy, put units where the test says (null removes one), turn `turn`, North to move with a full
    turn's Command. Specials are spent unless the test gives them back, so a position is about what it says it is. */
function setup(place, turn, rs) {
  rs = rs || RS;
  const st = E.newMatch(rs, { first: "N", lineups: { N: L(FIVE), S: L(FIVE) } });
  for (const team of ["N", "S"]) { const z = E.deployZone(st, team).filter((h) => h !== E.fieldOf(st).FLAG[team]), p = {}; let i = 0; for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++]; E.act(st, { type: "deploy", team, placements: p }); }
  for (const uid in place) { if (place[uid] === null) U(st, uid).hp = 0; else U(st, uid).hex = place[uid]; }
  st.turn = turn || 6; st.cmd = rs.game.command;
  for (const u of st.units) if (u.sp) u.sp = "used";
  return st;
}
const fmt = (p) => p.steps.map((a) => a.type + (a.to ? " " + a.to : a.target ? " " + a.target : "") + "(" + a.uid + ")").join(", ") || "(nothing)";
const variant = (o) => { const b = JSON.parse(JSON.stringify(B8)); Object.assign(b.approach, o); return b; };
const OFF = { holderJoins: 0, safe: 0, respect: 0, tempo: 0 };
const play = (st, p) => { const s = E.cloneLite(st); for (const a of p.steps) E.apply(s, a, () => E.normalDie(s)); return s; };
const inReach = (st, u) => E.alive(st).some((e) => e.team !== u.team && Bot.canThreaten(st, e, u.hex));
const inWarm = (st, u) => E.alive(st).some((w) => w.team !== u.team && w.sp === "warm" && Bot.canThreaten(st, w, u.hex, Bot.reachNext(st, w)));
const G = E.fieldOf(setup({}));

// ---- The brain and its settings ----
ok(B8 && B8.model && B8.name === "Brain 8 (safe approach)", "Brain 8 exists, named in full");
ok(JSON.stringify(B8.model) === JSON.stringify(B5.model) && JSON.stringify(B8.plan5) === JSON.stringify(B5.plan5), "Brain 8's value model and planning start as Brain 5's");
ok(B5.approach === undefined && DEFAULT_BRAINS.brain6.approach === undefined && B7.approach === undefined, "Brains 5, 6 and 7 have no approach settings (frozen)");
for (const k of Object.keys(B8.approach)) ok(BRAIN_LABELS["approach." + k], `Brain 8 setting ${k} has a plain label`);
for (const k of ["holderJoins", "tempo"]) ok(B8.approach[k] === 1, `behaviour ${k} ships on`);
for (const k of ["safe", "respect"]) ok(B8.approach[k] === 0, `behaviour ${k} ships off (brief 022 screen: it cost wins against Brain 5)`);
const B8A = variant({ safe: 1, respect: 1 });   // the positions for A1 and A2 switch them on

// ---- 6. All four off = Brain 5 (also checked over every preset by sims/brainhash.js; see the Report) ----
{ const off = variant(OFF); let same = true, acts = 0;
  for (const size of [5, 7]) for (let g = 0; g < 2; g++) {
    const line = size === 5 ? { HM: 2, HA: 1, LM: 1, LR: 1 } : { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 }, Lx = [];
    for (const c of Object.keys(RS.cards)) for (let i = 0; i < (line[c] || 0); i++) Lx.push({ id: i ? c + (i + 1) : c, card: c });
    const run = (B) => { const rnd = require("./rng.js")(`brain8-off:${size}`, g); const first = g ? "S" : "N"; const st = E.newMatch(RS, { first, lineups: { N: Lx, S: Lx } });
      for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
      const out = []; let k = 0; while (st.phase === "play" && k++ < 4000) { const a = Bot.chooseAction(st, B, rnd).action; out.push(JSON.stringify(a)); if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) E.act(st, { type: "end" }); } return out.join("|") + JSON.stringify(st.result); };
    const a = run(B5), b = run(off); acts += a.split("|").length; if (a !== b) same = false;
  }
  ok(same, `6. Brain 8 with all four behaviours off plays the same actions as Brain 5 (4 games on ${RS.id}, ${acts} actions)`);
  ok(Bot.approach8Context(setup({}), off) === null, "6. all off: no reading at all, so every Brain 5 sum runs unchanged");
}

// ---- 1. Don't walk in: the two archers 8 hexes apart, specials spent ----
// North's Light Ranged at D5, South's at D13. Any step forward puts ours inside the enemy archer's reach (4 hexes of
// movement plus range 3) without a shot of its own this turn, and no friend of ours can reach the enemy archer next turn.
const DUEL = { "N-HM": "D3", "N-HM2": "C4", "N-HA": "E4", "N-LM": null, "N-LR": "D5", "S-HM": "D15", "S-HM2": "C14", "S-HA": "E14", "S-LM": null, "S-LR": "D13" };
{ const st = setup(DUEL), p5 = Bot.planTurn5(st, B5), p8 = Bot.planTurn5(st, B8A);
  const s5 = play(st, p5), s8 = play(st, p8), c8 = Bot.approach8Context(st, B8A), f5 = Bot.firstStrike8(s5, U(s5, "N-LR"));
  console.log(`  1. don't walk in: archers ${G.dist("D5", "D13")} hexes apart. Brain 5: ${fmt(p5)}`);
  console.log(`        Brain 5's archer ends at ${U(s5, "N-LR").hex}: enemy first strike ${f5.d.toFixed(1)} expected from ${f5.by && f5.by.uid}, answered by a friend: ${f5.answered}; A1 would count ${(c8.firstStrike * B8.model.hp * f5.d).toFixed(1)} value points as already lost`);
  console.log(`        Brain 8: ${fmt(p8)} (archer at ${U(s8, "N-LR").hex}, in enemy reach: ${inReach(s8, U(s8, "N-LR"))})`);
  ok(inReach(s5, U(s5, "N-LR")) && !U(s5, "N-LR").attackedThis, "1. Brain 5 walks its archer into the enemy archer's reach without striking");
  ok(!inReach(s8, U(s8, "N-LR")), "1. Brain 8 stops short");
  const noA1 = Bot.planTurn5(st, variant({ safe: 0, respect: 1 }));
  ok(inReach(play(st, noA1), U(play(st, noA1), "N-LR")), "1. with A1 off Brain 8 walks in like Brain 5 (A1 does it)");
}

// ---- 2. Strike first when it pays: one hex closer, the enemy archer on 3 HP ----
{ const st = setup(Object.assign({}, DUEL, { "N-LR": "D6" })); U(st, "S-LR").hp = 3;
  const p8 = Bot.planTurn5(st, B8A);
  console.log(`  2. strike first: archers ${G.dist("D6", "D13")} apart, enemy archer on 3 HP. Brain 8: ${fmt(p8)}`);
  ok(p8.steps.some((a) => a.type === "attack" && a.uid === "N-LR" && a.target === "S-LR"), "2. Brain 8 goes in and strikes the enemy archer");
}

// ---- 3. A warmed Arrow Storm: South's archer on D13, warmed up ----
{ const base = { "N-HM": "D3", "N-HM2": "C3", "N-HA": "E3", "N-LM": "B4", "N-LR": null, "S-HM": "D15", "S-HM2": "C16", "S-HA": "E16", "S-LM": null, "S-LR": "D13" };
  // a. our Light Melee 7 hexes from it, inside the storm's reach (4 hexes of movement plus range 3): one step takes it out
  const a = setup(Object.assign({}, base, { "N-LM": "D6" })); U(a, "S-LR").sp = "warm";
  const pa = Bot.planTurn5(a, B8A), sa = play(a, pa), hitA = Bot.specHit(a, U(a, "S-LR"), U(a, "N-LM"));
  console.log(`  3a. warmed Arrow Storm would deal ${hitA.toFixed(1)} to our Light Melee (16 HP), counted at ${B8.approach.warmedRespect}; Brain 8: ${fmt(pa)} (in reach after: ${inWarm(sa, U(sa, "N-LM"))})`);
  ok(inWarm(a, U(a, "N-LM")) && !inWarm(sa, U(sa, "N-LM")), "3a. Brain 8 steps out of the warmed storm's reach");
  // b. our Heavy Melee pinned (no movement left) inside reach on 7 HP: the storm removes it, a brace (2 less) leaves it alive
  const b = setup(Object.assign({}, base, { "N-LM": null, "N-HM2": "D7" })); U(b, "S-LR").sp = "warm"; U(b, "N-HM2").moved = 99; U(b, "N-HM2").hp = 7;
  const bb = E.cloneLite(b); E.apply(bb, { type: "brace", uid: "N-HM2" });
  const hitB = Bot.specHit(b, U(b, "S-LR"), U(b, "N-HM2")), hitBb = Bot.specHit(bb, U(bb, "S-LR"), U(bb, "N-HM2")), pb = Bot.planTurn5(b, B8A);
  console.log(`  3b. pinned Heavy Melee on 7 HP: storm ${hitB.toFixed(1)} unbraced, ${hitBb.toFixed(1)} braced; Brain 8: ${fmt(pb)}`);
  ok(hitB >= 7 && hitBb < 7, "3b. the storm removes it unbraced and not braced");
  ok(pb.steps.some((x) => x.type === "brace" && x.uid === "N-HM2"), "3b. Brain 8 braces");
  // c. our Light Ranged pinned 3 hexes from the warmed archer on 3 HP: a brace can't save it, a shot can remove the archer
  const c = setup(Object.assign({}, base, { "N-LM": null, "N-LR": "D10" })); U(c, "S-LR").sp = "warm"; U(c, "N-LR").moved = 99; U(c, "N-LR").hp = 3; U(c, "S-LR").hp = 4;
  const cb = E.cloneLite(c); E.apply(cb, { type: "brace", uid: "N-LR" });
  const hitC = Bot.specHit(cb, U(cb, "S-LR"), U(cb, "N-LR")), pc = Bot.planTurn5(c, B8A);
  console.log(`  3c. pinned Light Ranged on 3 HP, 3 hexes from the warmed archer (4 HP): storm ${hitC.toFixed(1)} even braced; Brain 8: ${fmt(pc)}`);
  ok(hitC >= 3, "3c. a brace can't save it");
  ok(pc.steps.some((x) => x.type === "attack" && x.uid === "N-LR" && x.target === "S-LR"), "3c. Brain 8 strikes the archer first");
}

// ---- 4. Holder joins: the enemy has only its holder (Brain 7's position, v3.6) ----
{ const place = { "N-HM": "E3", "N-HM2": "D7", "N-HA": "F7", "N-LM": "E6", "N-LR": null, "S-HM": null, "S-HM2": null, "S-HA": null, "S-LM": "E17", "S-LR": null };
  const mk = () => { const st = setup(place, 10, RS_B4); return st; };
  const st = mk(), c = Bot.approach8Context(st, B8), c7 = Bot.lead7Context(st, B7), p8 = Bot.planTurn5(st, B8), p5 = Bot.planTurn5(st, B5);
  const v = mk(); v.pole.N = 5; const cv = Bot.approach8Context(v, B8), pv = Bot.planTurn5(v, B8);
  const holder = (p) => p.steps.filter((a) => a.uid === "N-HM").map((a) => a.type + " " + (a.to || a.target || "")).join(", ") || "stays";
  console.log(`  4. holder joins: race ${c.race.us} / ${c.race.them} (Brain 7's: ${c7.race.us} / ${c7.race.them}), joins: ${c.join}. Brain 8 holder: ${holder(p8)}; Brain 5 holder: ${holder(p5)}; our flag on 5: joins ${cv.join}, holder ${holder(pv)}`);
  ok(c.join && c.race.us === c7.race.us && c.race.them === c7.race.them, "4. Brain 8's race check reads as Brain 7's");
  ok(p8.steps.some((a) => a.uid === "N-HM" && a.type === "move"), "4. the race check passes and our holder leaves its flag");
  ok(!p5.steps.some((a) => a.uid === "N-HM" && a.type === "move"), "4. Brain 5's holder stays home");
  ok(!cv.join && !pv.steps.some((a) => a.uid === "N-HM" && a.type === "move"), "4. when the enemy holder would win the race, our holder stays");
}

// ---- 5. Opening tempo: a fresh 5v5 match, North first ----
{ const line = []; for (const [c, k] of [["HM", 2], ["HA", 1], ["LM", 1], ["LR", 1]]) for (let i = 0; i < k; i++) line.push({ id: i ? c + (i + 1) : c, card: c });
  /** North's side-turns 1 and 2 with its tempo, South as Brain 5; returns North's non-holder units' average hexes beyond its deploy area. */
  const run = (t) => {
    const B = variant({ tempoFirst: t }), rnd = require("./rng.js")("brain8-tempo", 0);
    const st = E.newMatch(RS, { first: "N", lineups: { N: line, S: line } });
    for (const team of ["N", "S"]) E.act(st, { type: "deploy", team, placements: Bot.deploy(st, team, team === "N" ? B : B5, rnd) });
    const out = []; let k = 0;
    while (st.phase === "play" && st.turn <= 2 && k++ < 200) {
      if (st.toMove === "N") { const z = E.deployZone(st, "N"), k0 = Bot.keeperOf(st, "N"); const us = E.alive(st).filter((u) => u.team === "N" && u.uid !== k0.uid); out.push({ turn: st.turn, open: !!(Bot.approach8Context(st, B) || {}).open, beyond: us.reduce((a, u) => a + Math.min(...z.map((h) => G.dist(u.hex, h))), 0) / us.length, toFlag: us.reduce((a, u) => a + G.dist(u.hex, G.FLAG.S), 0) / us.length }); }
      const a = Bot.chooseAction(st, st.toMove === "N" ? B : B5, rnd).action; if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) E.act(st, { type: "end" });
    }
    const z = E.deployZone(st, "N"), k0 = Bot.keeperOf(st, "N"), us = E.alive(st).filter((u) => u.team === "N" && u.uid !== k0.uid);
    return { beyond: us.reduce((a, u) => a + Math.min(...z.map((h) => G.dist(u.hex, h))), 0) / us.length, toFlag: us.reduce((a, u) => a + G.dist(u.hex, G.FLAG.S), 0) / us.length, turns: out };
  };
  const r = { "-1": run(-1), 0: run(0), 1: run(1) };
  for (const t of ["-1", "0", "1"]) console.log(`  5. tempoFirst ${t}: after North's first two turns its units stand ${r[t].beyond.toFixed(2)} hexes beyond its deploy area on average, ${r[t].toFlag.toFixed(2)} from the enemy flag`);
  ok(r["-1"].beyond <= 1 + 1e-9 && r["-1"].beyond < r[0].beyond, "5. with tempoFirst -1 the first mover holds near its deploy area on turns 1 and 2");
  ok(r[1].toFlag < r[0].toFlag - 1e-9, "5. with tempoFirst +1 it closes faster than at 0");
  const st = setup({}, 3); st.turn = 3; const hurt = setup({}, 3); U(hurt, "S-HM2").hp -= 1;
  ok(Bot.approach8Context(st, variant({ tempoFirst: -1 })).open && !Bot.approach8Context(hurt, variant({ tempoFirst: -1 })).open, "5. the slider stops applying once a unit has taken damage");
  ok(!Bot.approach8Context(st, variant({ tempoFirst: 0 })).open, "5. at 0 nothing changes (Brain 5's opening)");
}

// ---- Legal play: Brain 8 vs Brain 5 and vs itself, balanced and all-Light, both formats ----
const LINEUPS = { balanced: { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, light: { 5: { LM: 2, LA: 2, LR: 1 }, 7: { LM: 3, LA: 2, LR: 2 } } };
for (const mode of ["balanced", "light"]) for (const size of [5, 7]) {
  if (!games) break;
  const rnd = require("./rng.js")(`brain8-legal:${RS.id}:${mode}:${size}`, 0);
  const line = []; for (const code of Object.keys(RS.cards)) for (let i = 0; i < (LINEUPS[mode][size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  let refused = 0, errors = 0, unfinished = 0, actions = 0; const sample = [];
  for (let g = 0; g < games; g++) {
    const first = g % 2 ? "S" : "N", brain = (t) => (g % 4 < 2 ? (t === "N" ? B8 : B5) : B8);
    const st = E.newMatch(RS, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brain(t), rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 6000) {
      const B0 = brain(st.toMove);
      let a; try { a = Bot.chooseAction(st, B0, rnd).action; } catch (e) { errors++; if (sample.length < 3) sample.push("threw: " + e.message); a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd)); actions++;
      if (!r.ok) { if (B0 === B8) { refused++; if (sample.length < 3) sample.push(JSON.stringify(a) + " " + r.error); } E.act(st, { type: "end" }); }
    }
    if (!st.result) unfinished++;
  }
  console.log(`  ${mode} ${size}v${size}: ${games} games, ${actions} actions; Brain 8 actions refused: ${refused}; errors: ${errors}; unfinished: ${unfinished}`);
  for (const x of sample) console.log("    " + x);
  ok(refused === 0 && errors === 0 && unfinished === 0, `Brain 8 plays only legal actions (${mode} ${size}v${size})`);
}

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
