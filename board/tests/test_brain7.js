// Brain 7 checks (Brief 019): all five behaviours off plays exactly as Brain 5; the five test positions, each printing
// the model's reasoning; then legal play over seeded games. node tests/test_brain7.js [games per format and lineup, default 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS, BRAIN_LABELS } = require("../brain.js");
const RS = PRESETS[PRESETS.length - 1], B5 = DEFAULT_BRAINS.brain5, B7 = DEFAULT_BRAINS.brain7;
const games = process.argv[2] === undefined ? 30 : +process.argv[2];
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const FIVE = [["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]];
/** A 5v5 position on the newest rule set: deploy, then put units where the test says (null removes one), turn `turn`,
    North to move with a full turn's Command. */
function setup(place, turn) {
  const st = E.newMatch(RS, { first: "N", lineups: { N: L(FIVE), S: L(FIVE) } });
  for (const team of ["N", "S"]) { const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0; for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++]; E.act(st, { type: "deploy", team, placements: p }); }
  for (const uid in place) { if (place[uid] === null) U(st, uid).hp = 0; else U(st, uid).hex = place[uid]; }
  st.turn = turn || 10; st.cmd = RS.game.command;
  return st;
}
const fmt = (p) => p.steps.map((a) => a.type + (a.to ? " " + a.to : a.target ? " " + a.target : "") + "(" + a.uid + ")").join(", ") || "(nothing)";
const variant = (o) => { const b = JSON.parse(JSON.stringify(B7)); Object.assign(b.lead, o); return b; };
const OFF = { lead: 0, care: 0, storm: 0, holderJoins: 0, regroup: 0 };
const attacks = (p, uid, target) => p.steps.some((a) => a.type === "attack" && a.uid === uid && (!target || a.target === target));
/** Play a plan with the usual rolls, let South pass, and return the position at North's next turn. */
function nextTurn(st, p) { const s = E.cloneLite(st); for (const a of p.steps) E.apply(s, a, () => E.normalDie(s)); E.apply(s, { type: "end" }); E.apply(s, { type: "end" }); return s; }

// ---- The brain and its settings ----
ok(B7 && B7.model && B7.name === "Brain 7 (keeps its lead)", "Brain 7 exists, named in full");
ok(JSON.stringify(B7.model) === JSON.stringify(B5.model) && JSON.stringify(B7.plan5) === JSON.stringify(B5.plan5), "Brain 7's value model and planning start as Brain 5's");
ok(B5.lead === undefined && DEFAULT_BRAINS.brain6.lead === undefined, "Brain 5 and Brain 6 have no lead settings (frozen)");
for (const k of Object.keys(B7.lead)) ok(BRAIN_LABELS["lead." + k], `Brain 7 setting ${k} has a plain label`);
for (const k of Object.keys(OFF)) ok(B7.lead[k] === 1, `behaviour ${k} ships on`);

// ---- All five off = Brain 5 (also checked over every preset by sims/brainhash.js; see the Report) ----
{ const off = variant(OFF); let same = true, acts = 0;
  for (const size of [5, 7]) for (let g = 0; g < 2; g++) {
    const line = size === 5 ? { HM: 2, HA: 1, LM: 1, LR: 1 } : { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 }, Lx = [];
    for (const c of Object.keys(RS.cards)) for (let i = 0; i < (line[c] || 0); i++) Lx.push({ id: i ? c + (i + 1) : c, card: c });
    const play = (B) => { const rnd = require("./rng.js")(`brain7-off:${size}`, g); const first = g ? "S" : "N"; const st = E.newMatch(RS, { first, lineups: { N: Lx, S: Lx } });
      for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
      const out = []; let k = 0; while (st.phase === "play" && k++ < 4000) { const a = Bot.chooseAction(st, B, rnd).action; out.push(JSON.stringify(a)); if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) E.act(st, { type: "end" }); } return out.join("|") + JSON.stringify(st.result); };
    const a = play(B5), b = play(off); acts += a.split("|").length; if (a !== b) same = false;
  }
  ok(same, `Brain 7 with all five behaviours off plays the same actions as Brain 5 (4 games on ${RS.id}, ${acts} actions)`);
  ok(Bot.lead7Context(setup({}), off) === null, "all off: no lead reading at all, so every Brain 5 sum runs unchanged");
}

// ---- 1. Care: ahead by 2, a lone attack on a full-HP Heavy that likely loses the attacker ----
// North: holder, HM2, HA, LR at home; its Light Melee (12 HP) at E11. South has lost its Light Melee and Light Ranged and
// its Heavy Anti-Cavalry is hurt. South's Heavy Melee (full HP) at E13 with the Anti-Cavalry at F14 beside it.
{ const place = { "N-HM": "E3", "N-HM2": "D4", "N-HA": "F4", "N-LM": "E11", "N-LR": "C4", "S-HM": "E17", "S-HM2": "E13", "S-HA": "F14", "S-LM": null, "S-LR": null };
  const st = setup(place); U(st, "N-LM").hp = 12; U(st, "S-HA").hp = 13.5;
  const c = Bot.lead7Context(st, B7), p5 = Bot.planTurn5(st, B5), p7 = Bot.planTurn5(st, B7);
  const s1 = E.cloneLite(st); E.apply(s1, { type: "move", uid: "N-LM", to: "E12" });
  const o = E.options(s1, "N-LM").attacks.find((a) => a.target === "S-HM2");
  const s2 = E.cloneLite(s1); E.apply(s2, { type: "attack", uid: "N-LM", target: "S-HM2" }, () => E.normalDie(s2));
  console.log(`  care: lead ${c.lead.toFixed(2)} (ahead: ${c.ahead}); the attack from E12 kills ${(100 * o.killChance).toFixed(0)}% of the time; lone and losing by B2's test: ${Bot.loneLosing7(s1, s2, "N", Object.assign({}, B7, { _c7: c }), "N-LM", "S-HM2", B7.lead.killChance)}; cost if taken ${(B7.model.unit + B7.model.hp * 12).toFixed(1)}`);
  console.log(`        Brain 5: ${fmt(p5)}`); console.log(`        Brain 7: ${fmt(p7)}`);
  ok(c.ahead && c.care && Math.abs(c.lead - 2) < 1e-9, "care: North is ahead by 2 and B2 is on");
  ok(attacks(p5, "N-LM", "S-HM2"), "care: Brain 5 takes the lone attack");
  ok(!attacks(p7, "N-LM"), "care: Brain 7 declines it");
  // the same attack with a likely kill: South's Heavy Melee down to 2 HP
  const k = setup(place); U(k, "N-LM").hp = 12; U(k, "S-HA").hp = 13.5; U(k, "S-HM2").hp = 2;
  const pk = Bot.planTurn5(k, B7);
  console.log(`        likely kill (target at 2 HP), Brain 7: ${fmt(pk)}`);
  ok(attacks(pk, "N-LM", "S-HM2"), "care: with a likely kill Brain 7 takes it");
}

// ---- 2. Gather: ahead, three spare units 2-4 hexes from the enemy goal zone ----
// South has only its holder (Heavy Melee on E17) and a Light Melee far away at A6. North's Light Melee at E13 can reach
// the goal zone and hit the holder alone this turn; its Heavy Melee (D12) and Heavy Anti-Cavalry (F12) only next turn.
{ const st = setup({ "N-HM": "E3", "N-HM2": "D12", "N-HA": "F12", "N-LM": "E13", "N-LR": null, "S-HM": "E17", "S-HM2": null, "S-HA": null, "S-LM": "A6", "S-LR": null });
  const c = Bot.lead7Context(st, B7), p5 = Bot.planTurn5(st, B5), p7 = Bot.planTurn5(st, B7);
  const hs = (p) => new Set(p.steps.filter((a) => a.type === "attack" && a.target === "S-HM").map((a) => a.uid)).size;
  const n7 = nextTurn(st, p7), q7 = Bot.planTurn5(n7, B7), c2 = Bot.lead7Context(n7, B7);
  console.log(`  gather: lead ${c.lead}; storm ${c.storm}; can strike the holder this turn ${c.strikers.now}, by next turn ${c.strikers.next}, so the strike waits (strike now: ${c.strikeOK})`);
  console.log(`        Brain 5: ${fmt(p5)}`); console.log(`        Brain 7: ${fmt(p7)} (spare units' flag potential after: ${Bot.flagPotential(n7, "N").toFixed(2)})`);
  console.log(`        Brain 7, next turn (${c2.strikers.now} can strike): ${fmt(q7)}`);
  ok(c.storm && !c.strikeOK, "gather: storming, and one unit alone must not strike yet");
  ok(hs(p5) === 1, "gather: Brain 5 sends its Light Melee in alone");
  ok(hs(p7) === 0, "gather: Brain 7 doesn't strike this turn");
  ok(c2.strikers.now >= 2, "gather: after Brain 7's turn, at least two units can strike the holder");
  ok(hs(q7) >= 2, "gather: next turn Brain 7 strikes the holder with at least two units");
}

// ---- 3. Holder joins: the enemy has only its holder ----
// North's spare units at D7, F7, E6; South has only its Light Melee holder on E17. With our flag undamaged the race check
// passes (our storm brings their flag down before their holder could walk to our goal zone and pull ours down) and our
// holder leaves E3. With our flag on 5, their holder could get there and pull it down first, so ours stays.
{ const place = { "N-HM": "E3", "N-HM2": "D7", "N-HA": "F7", "N-LM": "E6", "N-LR": null, "S-HM": null, "S-HM2": null, "S-HA": null, "S-LM": "E17", "S-LR": null };
  const st = setup(place), c = Bot.lead7Context(st, B7), p7 = Bot.planTurn5(st, B7), p5 = Bot.planTurn5(st, B5);
  const v = setup(place); v.pole.N = 5; const cv = Bot.lead7Context(v, B7), pv = Bot.planTurn5(v, B7);
  const holder = (p) => p.steps.filter((a) => a.uid === "N-HM").map((a) => a.type + " " + (a.to || a.target || "")).join(", ") || "stays";
  console.log(`  holder joins: race (our turns to bring their flag down / theirs to bring ours down): ${c.race.us} / ${c.race.them}, joins: ${c.join}. Brain 7 holder: ${holder(p7)}; Brain 5 holder: ${holder(p5)}`);
  console.log(`        our flag on 5: race ${cv.race.us} / ${cv.race.them}, joins: ${cv.join}. Brain 7 holder: ${holder(pv)}`);
  ok(c.join && p7.steps.some((a) => a.uid === "N-HM" && a.type === "move"), "holder joins: the race check passes and our holder leaves its flag");
  ok(!p5.steps.some((a) => a.uid === "N-HM" && a.type === "move"), "holder joins: Brain 5's holder stays home");
  ok(!cv.join && !pv.steps.some((a) => a.uid === "N-HM" && a.type === "move"), "holder joins: when the enemy holder would win the race, our holder stays");
}

// ---- 4. Regroup: behind; a lone, losing attack is there ----
// North: holder, Heavy Melee at D5 and a Light Melee on 5 HP at E11. South: holder, a Heavy Melee on 6.5 HP at E13, the
// Heavy Anti-Cavalry at F14 and the Light Ranged at G16. North is behind by about 1.
{ const at = (turn) => { const st = setup({ "N-HM": "E3", "N-HM2": "D5", "N-HA": null, "N-LM": "E11", "N-LR": null, "S-HM": "E17", "S-HM2": "E13", "S-HA": "F14", "S-LM": null, "S-LR": "G16" }, turn); U(st, "N-LM").hp = 5; U(st, "S-HM2").hp = 6.5; return st; };
  const early = at(11), late = at(24), ce = Bot.lead7Context(early, B7), cl = Bot.lead7Context(late, B7);
  const p5 = Bot.planTurn5(early, B5), pe = Bot.planTurn5(early, B7), pl = Bot.planTurn5(late, B7);
  const s = nextTurn(early, pe);
  console.log(`  regroup: lead ${ce.lead.toFixed(2)}; 15 turns left: turns needed to gather and strike ${ce.need} + ${B7.lead.regroupSpare} spare, regroup ${ce.regroup}; 2 turns left: regroup ${cl.regroup}`);
  console.log(`        Brain 5: ${fmt(p5)}`); console.log(`        Brain 7, 15 left: ${fmt(pe)} (Light Melee to Heavy Melee after: ${E.dist(U(s, "N-LM").hex, U(s, "N-HM2").hex)} hexes)`); console.log(`        Brain 7, 2 left: ${fmt(pl)}`);
  ok(ce.behind && ce.regroup && !cl.regroup, "regroup: behind, regrouping with 15 turns left, not with 2");
  ok(attacks(p5, "N-LM"), "regroup: Brain 5 attacks alone");
  ok(!attacks(pe, "N-LM") && E.dist(U(s, "N-LM").hex, U(s, "N-HM2").hex) <= 2, "regroup: with 15 turns left Brain 7 pulls back to within 2 hexes of a friend instead");
  ok(attacks(pl, "N-LM"), "regroup: with 2 turns left it commits");
}

// ---- 5. Hold or storm: ahead on material by 1.5 and on flag damage ----
// The gather position, North's Light Melee on 8 HP (lead 1.5) and 3 damage already on South's flag.
{ const st = setup({ "N-HM": "E3", "N-HM2": "D12", "N-HA": "F12", "N-LM": "E13", "N-LR": null, "S-HM": "E17", "S-HM2": null, "S-HA": null, "S-LM": "A6", "S-LR": null });
  U(st, "N-LM").hp = 8; st.pole.S = 3;
  const res = {};
  for (const sl of [1, 2]) {
    const B = variant({ stormLead: sl }), c = Bot.lead7Context(st, B), p = Bot.planTurn5(st, B), s = nextTurn(st, p);
    const ready = E.alive(s).filter((u) => u.team === "N" && u.uid !== "N-HM" && Bot.turnsTo7(s, u, E.GOAL.S, true) === 1).length;
    res[sl] = { c, p, ready };
    console.log(`  hold or storm, stormLead ${sl}: lead ${c.lead}, ahead on both ${c.both}, storm ${c.storm}, hold ${c.hold}: ${fmt(p)}; units able to strike next turn: ${ready}`);
  }
  ok(res[1].c.storm && res[1].ready >= 2, "hold or storm: with stormLead 1.0 it storms (gathers two units in reach of the holder)");
  ok(res[2].c.hold && !res[2].c.storm && res[2].ready < 2, "hold or storm: with stormLead 2.0 it holds");
  ok(fmt(res[2].p) === fmt(Bot.planTurn5(st, B5)), "hold or storm: holding here plays Brain 5's plan (B2 has nothing to stop)");
}

// ---- Legal play: Brain 7 vs Brain 5 and vs itself, balanced and all-Light, both formats ----
const LINEUPS = { balanced: { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, light: { 5: { LM: 2, LA: 2, LR: 1 }, 7: { LM: 3, LA: 2, LR: 2 } } };
for (const mode of ["balanced", "light"]) for (const size of [5, 7]) {
  if (!games) break;
  const rnd = require("./rng.js")(`brain7-legal:${RS.id}:${mode}:${size}`, 0);
  const line = []; for (const code of Object.keys(RS.cards)) for (let i = 0; i < (LINEUPS[mode][size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  let refused = 0, errors = 0, unfinished = 0, actions = 0; const sample = [];
  for (let g = 0; g < games; g++) {
    const first = g % 2 ? "S" : "N", brain = (t) => (g % 4 < 2 ? (t === "N" ? B7 : B5) : B7);
    const st = E.newMatch(RS, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brain(t), rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 6000) {
      const B0 = brain(st.toMove);
      let a; try { a = Bot.chooseAction(st, B0, rnd).action; } catch (e) { errors++; if (sample.length < 3) sample.push("threw: " + e.message); a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd)); actions++;
      if (!r.ok) { if (B0 === B7) { refused++; if (sample.length < 3) sample.push(JSON.stringify(a) + " " + r.error); } E.act(st, { type: "end" }); }
    }
    if (!st.result) unfinished++;
  }
  console.log(`  ${mode} ${size}v${size}: ${games} games, ${actions} actions; Brain 7 actions refused: ${refused}; errors: ${errors}; unfinished: ${unfinished}`);
  for (const x of sample) console.log("    " + x);
  ok(refused === 0 && errors === 0 && unfinished === 0, `Brain 7 plays only legal actions (${mode} ${size}v${size})`);
}

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
