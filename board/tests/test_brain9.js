// Brain 9 checks (Brief 020): with victory values and the spent opening off it plays exactly as Brain 8; the five test
// positions of the brief's Bot minimum, each printing the model's reasoning; the spent opening; per-format settings; then
// legal play over seeded games.
// node tests/test_brain9.js [games per format and lineup, default 30]
const E = require("../engine.js"), Bot = require("../bot.js"), W = require("../watch.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS, BRAIN_LABELS } = require("../brain.js");
const RS = PRESETS[PRESETS.length - 1], B8 = DEFAULT_BRAINS.brain8, B9 = DEFAULT_BRAINS.brain9;
const games = process.argv[2] === undefined ? 30 : +process.argv[2];
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const FIVE = [["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]];
/** A 5v5 position: deploy, put units where the test says (null removes one), turn `turn`, North to move with a full
    turn's Command, specials spent. */
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
const variant = (o, base) => { const b = JSON.parse(JSON.stringify(base || B9)); for (const k in o) { const g = Bot.GROUPS9.find((x) => b[x] && k in b[x]); b[g][k] = o[k]; } return b; };
const OFF = { playToFinish: 0, spendOpening: 0 };
const play = (st, p) => { const s = E.cloneLite(st); for (const a of p.steps) E.apply(s, a, () => E.normalDie(s)); return s; };
const why = (st, B, team) => { const d = Bot.victory9Detail(st, team || st.toMove, B); return `finish us ${d.us.toFixed(2)}, finished ${d.them.toFixed(2)}, clock ${d.clock.toFixed(2)} (outlook ${d.outlook.toFixed(2)}, worth ${d.clockEV.toFixed(2)}), expected ending ${d.ev.toFixed(2)}`; };
const LIM = E.turnLimit(setup({}));
const strikesHolder = (st, p) => p.steps.some((a) => (a.type === "attack" || a.type === "special") && E.isHolder(st, U(st, a.target)));

// ---- The brain and its settings ----
ok(B9 && B9.model && B9.name === "Brain 9 (plays to finish)", "Brain 9 exists, named in full");
ok(JSON.stringify(B9.model) === JSON.stringify(B8.model) && JSON.stringify(B9.approach) === JSON.stringify(B8.approach) && JSON.stringify(B9.plan5) === JSON.stringify(B8.plan5), "Brain 9 starts from Brain 8 as shipped (model, approach, planning)");
for (const id of ["brain5", "brain6", "brain7", "brain8"]) ok(!DEFAULT_BRAINS[id].victory && !DEFAULT_BRAINS[id].spend && !DEFAULT_BRAINS[id].perFormat, `${id} has no victory, spend or per-format settings (frozen)`);
for (const g of ["victory", "spend"]) for (const k of Object.keys(B9[g])) ok(BRAIN_LABELS[g + "." + k], `Brain 9 setting ${k} has a plain label`);
ok(B9.victory.playToFinish === 1, "victory values ship on");
ok(B9.spend.spendOpening === 0, "the spent opening ships off (brief 020 confirm: it cost wins against Brain 8 and broke 7v7's move order)");
ok(B9.victory.finish === 3 && B9.victory.clockWin === 1 && B9.victory.draw === 0 && B9.victory.clockLoss === -1 && B9.victory.finished === -1, "the Editor's values: 3, 1, 0, -1, -1");
ok(Object.keys(B9.perFormat).join() === "5,7" && !Object.keys(B9.perFormat[5]).length && !Object.keys(B9.perFormat[7]).length, "per-format settings exist for 5v5 and 7v7 and ship empty");
{ const others = new Set(); for (const g of Bot.GROUPS9) if (B9[g] && g !== "victory" && g !== "spend") Object.keys(B9[g]).forEach((k) => others.add(k));
  const mine = Object.keys(B9.victory).concat(Object.keys(B9.spend));
  ok(new Set(mine).size === mine.length && !mine.some((k) => others.has(k)), "every new Brain 9 setting has a name no other group uses (a watch link names it alone)"); }

// ---- Finished games by the values ----
{ const st = setup({}); const V = B9.victory;
  const res = (w, how) => Object.assign(E.cloneLite(st), { result: { winner: w, how } });
  ok(Bot.endValue9(res("N", "KO"), "N", V) === 3 && Bot.endValue9(res("N", "KO"), "S", V) === -1, "a KO is a finish: +3 to the winner, -1 to the loser");
  ok(Bot.endValue9(res("N", "TKO"), "N", V) === 3, "a TKO is a finish");
  ok(Bot.endValue9(res("N", "turn limit, more pull damage"), "N", V) === 1 && Bot.endValue9(res("N", "turn limit, more pull damage"), "S", V) === -1, "a win on flag damage at the limit: +1, -1");
  ok(Bot.endValue9(res("N", "turn limit, fewer beings lost"), "N", V) === 0 && Bot.endValue9(res("N", "turn limit, fewer beings lost"), "S", V) === 0, "fewer units lost at the limit is a draw (Game Laws 2.7, 19 Nov)");
  ok(Bot.endValue9(res(null, "turn limit, draw"), "N", V) === 0, "a draw is 0");
  ok(Bot.endValue9(res("N", "KO"), "S", Object.assign({}, V, { finished: -2 })) === -2, "finished at -2 reads -2");
  const ctx = Object.assign({}, B9, { _c9: Bot.victory9Context(st, B9) });
  ok(Bot.value5(res("N", "KO"), "N", ctx) > Bot.value5(res("N", "turn limit, more pull damage"), "N", ctx) && Bot.value5(res("N", "turn limit, more pull damage"), "N", ctx) > 5000, "in the planner a finish outranks a clock win, and a clock win outweighs any position");
}

// ---- 5. Off is Brain 8 (also over every preset by sims/brainhash.js; see the Report) ----
{ const off = variant(OFF); let same = true, acts = 0;
  for (const size of [5, 7]) for (let g = 0; g < 2; g++) {
    const line = size === 5 ? { HM: 2, HA: 1, LM: 1, LR: 1 } : { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 }, Lx = [];
    for (const c of Object.keys(RS.cards)) for (let i = 0; i < (line[c] || 0); i++) Lx.push({ id: i ? c + (i + 1) : c, card: c });
    const run = (B) => { const rnd = require("./rng.js")(`brain9-off:${size}`, g); const first = g ? "S" : "N"; const st = E.newMatch(RS, { first, lineups: { N: Lx, S: Lx } });
      for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
      const out = []; let k = 0; while (st.phase === "play" && k++ < 4000) { const a = Bot.chooseAction(st, B, rnd).action; out.push(JSON.stringify(a)); if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) E.act(st, { type: "end" }); } return out.join("|") + JSON.stringify(st.result); };
    const a = run(B8), b = run(off); acts += a.split("|").length; if (a !== b) same = false;
  }
  ok(same, `5. Brain 9 with both behaviours off plays the same actions as Brain 8 (4 games on ${RS.id}, ${acts} actions)`);
  ok(Bot.victory9Context(setup({}), off) === null, "5. both off: no reading at all, so every Brain 8 sum runs unchanged");
}

// ---- Per-format settings (item 7) ----
{ const b = W.brainFromSpec("brain9:tempoSecond.5=0,finished.7=-2").brain;
  ok(b.perFormat[5].tempoSecond === 0 && b.perFormat[7].finished === -2 && b.approach.tempoSecond === 1 && b.victory.finished === -1, "a watch link sets one format's own value and leaves the shared one");
  const st5 = setup({}), r5 = Bot.forFormat9(b, st5);
  ok(r5.approach.tempoSecond === 0 && r5.victory.finished === -1, "at 5v5 the 5v5 value is used, the shared value elsewhere");
  ok(Bot.forFormat9(B9, st5) === B9, "with no per-format values the brain is used as it is");
  let threw = false; try { W.brainFromSpec("brain9:tempoSecond.9=0"); } catch (e) { threw = /9v9/.test(e.message); }
  ok(threw, "9v9 and 13v13 have no per-format values until Cavalry (a link that sets one is refused in plain words)");
  const sp = { seed: "TEST-TEST-TEST", rules: RS.id, format: "blitz5", n: "brain9:finished=-2,tempoSecond.5=0", s: "brain8", first: "N" };
  ok(W.fromQuery(W.toQuery(sp)).n === sp.n && W.problem(W.fromQuery(W.toQuery(sp))) === null, "a watch link carries victory and per-format settings and is playable: " + W.toQuery(sp));
}

// ---- 1. Press: two turns from the limit, ahead 2 on flag damage, the enemy holder alone with a small pool ----
// North's HM and LM stand next to South's goal zone; South has only its holder (HM on D15, 6 HP, flag 6 left).
const PRESS = { "N-HM": "D3", "N-HM2": "D12", "N-HA": "C12", "N-LM": "E12", "N-LR": "D10", "S-HM": "D15", "S-HM2": null, "S-HA": null, "S-LM": null, "S-LR": null };
{ const st = setup(PRESS, LIM - 1); st.pole.S = 4; st.pole.N = 2; U(st, "S-HM").hp = 6;
  const p8 = Bot.planTurn5(st, B8), p9 = Bot.planTurn5(st, B9);
  console.log(`  1. press: turn ${st.turn} of ${LIM}, flag damage 4 to 2, enemy holder alone (pool ${E.effHp(st, U(st, "S-HM")).toFixed(1)}). Reading: ${why(st, B9)}`);
  console.log(`        Brain 8: ${fmt(p8)}`);
  console.log(`        Brain 9: ${fmt(p9)}`);
  ok(strikesHolder(st, p9), "1. Brain 9 attacks the enemy holder");
}

// ---- 2. Hold: the same lead, our holder on 6 HP, our Light Melee its only guard; its only attack (on the enemy archer,
// 12 HP, a low kill chance) walks it out of the guard ring and leaves the enemy Light Melee a free run at our holder ----
{ const place = { "N-HM": "D3", "N-HM2": null, "N-HA": null, "N-LM": "D5", "N-LR": null, "S-HM": "D15", "S-HM2": null, "S-HA": null, "S-LM": "D8", "S-LR": "F8" };
  const st = setup(place, LIM - 1); st.pole.S = 4; st.pole.N = 2; U(st, "N-HM").hp = 6;
  const p8 = Bot.planTurn5(st, B8), p9 = Bot.planTurn5(st, B9), s8 = play(st, p8), s9 = play(st, p9);
  const atk = (p) => p.steps.some((a) => a.type === "attack" || a.type === "special");
  console.log(`  2. hold: turn ${st.turn}, flag damage 4 to 2, our holder on 6 HP, one guard. Reading: ${why(st, B9)}`);
  console.log(`        Brain 8: ${fmt(p8)} (guards left ${Bot.guards9(s8, "N")}; after: ${why(s8, B9, "N")})`);
  console.log(`        Brain 9: ${fmt(p9)} (guards left ${Bot.guards9(s9, "N")}; after: ${why(s9, B9, "N")})`);
  ok(atk(p8) && Bot.guards9(s8, "N") === 0, "2. Brain 8 sends its last guard out to attack");
  ok(!atk(p9) && Bot.guards9(s9, "N") >= 1, "2. Brain 9 holds: no attack, its guard stays");
}

// ---- 3. Level: level on flag damage near the limit, ahead on material (5 units against 2) ----
{ const place = { "N-HM": "D3", "N-HM2": "D12", "N-HA": "C12", "N-LM": "E12", "N-LR": "D10", "S-HM": "D15", "S-HM2": "C16", "S-HA": null, "S-LM": null, "S-LR": null };
  const st = setup(place, LIM - 1); st.pole.S = 2; st.pole.N = 2;
  const p8 = Bot.planTurn5(st, B8), p9 = Bot.planTurn5(st, B9);
  console.log(`  3. level: turn ${st.turn}, flag damage 2 to 2, 5 units against 2. Reading: ${why(st, B9)}`);
  console.log(`        Brain 8: ${fmt(p8)}`);
  console.log(`        Brain 9: ${fmt(p9)}`);
  ok(strikesHolder(st, p9), "3. Brain 9 presses (strikes the enemy holder this turn)");
}

// ---- 4. Guard (the hunch): behind on flag damage near the limit, three enemies one walk from our goal zone ----
{ const place = { "N-HM": "D3", "N-HM2": "D4", "N-HA": "C5", "N-LM": "E5", "N-LR": null, "S-HM": "D15", "S-HM2": "D7", "S-HA": "C7", "S-LM": "E7", "S-LR": null };
  const mk = () => { const st = setup(place, LIM - 1); st.pole.S = 1; st.pole.N = 4; U(st, "N-HM").hp = 8; return st; };
  const res = {};
  for (const f of [-1, -2]) {
    const B = variant({ finished: f }), st = mk(), p = Bot.planTurn5(st, B), s = play(st, p);
    res[f] = { g: Bot.guards9(s, "N"), p, s, before: why(st, B), after: why(s, B, "N") };
    console.log(`  4. guard, finished ${f}: turn ${st.turn}, flag damage 1 to 4, our holder on 8 HP. Reading: ${res[f].before}`);
    console.log(`        Brain 9: ${fmt(p)}; guards left: ${res[f].g} (after: ${res[f].after})`);
  }
  ok(res[-2].g >= 1, "4. with finished -2 Brain 9 keeps a guard");
  console.log(`        what -1 does in the same position: ${res[-1].g} guard(s) left${res[-1].g < res[-2].g ? " (fewer than at -2)" : ""}`);
}

// ---- The spent opening (item 6): 5v5, Command 8, first turn 5 against 8 ----
{ const rs8 = JSON.parse(JSON.stringify(RS)); rs8.game.command = 8;
  const run = (B, ftc) => { const rs = JSON.parse(JSON.stringify(rs8)); rs.game.firstTurnCommand = ftc; const rnd = require("./rng.js")("brain9-spend", 0);
    const st = E.newMatch(rs, { first: "N", lineups: { N: L(FIVE), S: L(FIVE) } });
    for (const t of ["N", "S"]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
    const acts = []; let left = st.cmd, k = 0;
    while (st.phase === "play" && st.turn === 1 && st.toMove === "N" && k++ < 40) { const a = Bot.chooseAction(st, B, rnd).action; if (a.type === "end") break; if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) break; acts.push(a); left = st.cmd; }
    return { spent: +(ftc - left).toFixed(2), acts: acts.map((a) => a.type + (a.to ? " " + a.to : "") + "(" + a.uid + ")").join(", ") }; };
  const B9S = variant({ spendOpening: 1 }), r8 = { 5: run(B8, 5), 8: run(B8, 8) }, r9 = { 5: run(B9S, 5), 8: run(B9S, 8) };
  console.log(`  6. spent opening (switched on), 5v5 Command 8. Brain 8 spends ${r8[5].spent} of 5 and ${r8[8].spent} of 8; Brain 9 spends ${r9[5].spent} of 5 and ${r9[8].spent} of 8`);
  console.log(`        Brain 9, first turn 8: ${r9[8].acts}`);
  ok(r9[8].spent > r8[8].spent + 0.5, "6. with 8 to spend on its first turn, Brain 9 spends more than Brain 8");
  ok(r9[8].acts !== r9[5].acts, "6. Brain 9 plays a first turn of 8 differently from a first turn of 5");
}

// ---- Legal play: Brain 9 never picks an illegal action (balanced and all-Light, both formats) ----
let refused = 0, played = 0;
for (const mode of ["balanced", "light"]) for (const fmtId of ["blitz5", "std7"]) for (let g = 0; g < games; g++) {
  const rnd = require("./rng.js")(`brain9-legal:${RS.id}:${mode}:${fmtId}`, g);
  const spec = { seed: W.seedFrom(rnd), rules: RS.id, format: fmtId, n: g % 3 === 2 ? "brain8" : g % 3 === 1 ? "brain9:spendOpening=1" : "brain9", s: g % 3 === 1 ? "brain9:finished=-2" : "brain9", mixN: mode === "light" ? "light" : "mixed", mixS: mode === "light" ? "light" : "mixed", first: g % 2 ? "S" : "N" };
  W.playOut(spec, { after: (s, c, r) => { if (c.refusedEnd) return; played++; if (!r.ok) { refused++; if (refused <= 3) console.log("  refused:", JSON.stringify(c.action), r.error); } } });
}
ok(refused === 0, `Brain 9 never picks an illegal action (${games} games per format and lineup, ${played} actions, ${refused} refused)`);

console.log(`${n - fails}/${n} Brain 9 checks passed`);
process.exit(fails ? 1 : 0);
