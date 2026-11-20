// v3.5 checks (Brief 010, Game Laws 6.13): a little variety in normal rolls. Two dice totalling 4–5 take 10% off,
// 9–10 add 10%; 2, 3, 6–8, 11 and 12 as v3.4. Average multiplier unchanged. Older presets roll exactly as before.
// node tests/test_v35.js [botGames]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS, DEFAULT_RULESET } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const rng = require("./rng.js");
const V35 = PRESETS.find((p) => p.id === "v3.5"), V34 = PRESETS.find((p) => p.id === "v3.4");
const BOT_GAMES = +(process.argv[2] || 6);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const near = (a, b) => Math.abs(a - b) < 1e-9;
const st = (rs) => ({ rs });   // the dice read only the rule set

// ---- The preset ----
ok(V35 && V35.switches.diceVariety === true, "v3.5 exists with diceVariety on");
// Was "v3.5 is the last preset". Brief 015 adds v3.6 after it; the newest-preset check now lives in test_v36.js.
ok(PRESETS.indexOf(V35) >= 0 && PRESETS.indexOf(V35) < PRESETS.length - 1, "v3.5 is still offered, behind the newest preset");
const BEFORE = [DEFAULT_RULESET, ...PRESETS.slice(0, PRESETS.indexOf(V35))];   // the presets before v3.5
{ const a = JSON.parse(JSON.stringify(V34)), b = JSON.parse(JSON.stringify(V35));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  delete b.switches.diceVariety;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.5 is v3.4 apart from diceVariety"); }
for (const rs of BEFORE) ok(!rs.switches.diceVariety, `${rs.id}: no dice variety`);

// ---- The bands (3.3 and 6.13) ----
const OLD = (t) => (t <= 2 ? 0.5 : t === 3 ? 0.75 : t === 11 ? 1.25 : t >= 12 ? 1.5 : 1);   // v3.4 and older
const NEW = { 2: 0.5, 3: 0.75, 4: 0.9, 5: 0.9, 6: 1, 7: 1, 8: 1, 9: 1.1, 10: 1.1, 11: 1.25, 12: 1.5 };
const ways = (t) => 6 - Math.abs(t - 7);   // ways to make a total with two d6
for (let t = 2; t <= 12; t++) {
  ok(near(E.diceMultiplier(st(V35), t), NEW[t]), `v3.5: a total of ${t} multiplies by ${NEW[t]}`);
  for (const rs of BEFORE) if (rs.switches.dice2d6) ok(near(E.diceMultiplier(st(rs), t), OLD(t)), `${rs.id}: a total of ${t} still multiplies by ${OLD(t)}`);
}
{ const cs = E.dieCases(st(V35)), old = E.dieCases(st(V34));
  ok(cs.length === 7, "v3.5 has 7 dice cases (2, 3, 4–5, 6–8, 9–10, 11, 12)");
  ok(near(cs.reduce((s, [, p]) => s + p, 0), 1), "v3.5: the chances add up to exactly 1");
  // Each case's chance is the share of totals in its band, and its roll sits in that band.
  const bands = [[2, 2], [3, 3], [4, 5], [6, 8], [9, 10], [11, 11], [12, 12]];
  cs.forEach(([d, p], i) => { const [lo, hi] = bands[i]; let w = 0; for (let t = lo; t <= hi; t++) { w += ways(t); ok(near(E.diceMultiplier(st(V35), t), E.diceMultiplier(st(V35), d)), `case ${i}: total ${t} has the case's multiplier`); } ok(near(p, w / 36), `case ${i} (${lo}–${hi}): chance ${w}/36`); });
  const avg = (rs, list) => list.reduce((s, [d, p]) => s + p * E.diceMultiplier(st(rs), d), 0);
  ok(near(avg(V35, cs), avg(V34, old)), `v3.5's average multiplier equals v3.4's (${avg(V35, cs)} vs ${avg(V34, old)})`);
  let exact = 0; for (let t = 2; t <= 12; t++) exact += ways(t) / 36 * NEW[t];
  ok(near(exact, avg(V34, old)), "over every total, v3.5's average equals v3.4's");
  ok(cs[2][2].includes("−10%") && cs[4][2].includes("+10%"), `the new bands are labelled −10% and +10% ("${cs[2][2]}", "${cs[4][2]}")`);
  ok(cs[0][2] === "2" && cs[1][2] === "3" && cs[5][2] === "11" && cs[6][2] === "12", "2, 3, 11 and 12 keep their labels");
  ok(JSON.stringify(old) === JSON.stringify([[2, 1 / 36, "2"], [3, 2 / 36, "3"], [7, 30 / 36, "4–10"], [11, 2 / 36, "11"], [12, 1 / 36, "12"]]), "v3.4 keeps its 5 cases");
  ok(E.normalDie(st(V35)) === 7, "the normal roll is still 7 (×1)"); }

// ---- Rounding and the minimum hit (3.7) ----
{ const s = st(V35), d = (v, t, dodge) => E.applyDie(s, v, t, dodge);
  ok(d(3, 4) === 2.5 && d(3, 7) === 3 && d(3, 9) === 3.5, `a hit of 3: 2.5 / 3 / 3.5 (got ${d(3, 4)} / ${d(3, 7)} / ${d(3, 9)})`);
  for (const t of [4, 5, 6, 7, 8, 9, 10]) ok(d(1, t) === 1, `a hit of 1 stays 1 on a ${t}`);
  ok(d(0, 4) === 1 && d(0, 9) === 1, "the minimum hit of 1 still applies");
  ok(d(10, 2) === 5 && d(10, 3) === 7.5 && d(10, 11) === 12.5 && d(10, 12) === 15, "2, 3, 11 and 12 as v3.4 on a hit of 10");
  ok(d(10, 4) === 9 && d(10, 5) === 9 && d(10, 9) === 11 && d(10, 10) === 11, "a hit of 10: 9 on 4–5, 11 on 9–10");
  // Dodge comes after the roll (3.5): 10 × 0.9 × 0.8 = 7.2 → 7; 10 × 1.1 × 0.8 = 8.8 → 9.
  ok(d(10, 4, 20) === 7 && d(10, 9, 20) === 9 && d(10, 7, 20) === 8, `Dodge 20% after the roll: 7 / 8 / 9 (got ${d(10, 4, 20)} / ${d(10, 7, 20)} / ${d(10, 9, 20)})`);
  ok(E.applyDie(st(V34), 10, 4, 20) === 8 && E.applyDie(st(V34), 10, 9, 20) === 8, "v3.4: 4 and 9 are normal hits, Dodge after"); }

// ---- In play: attacks, pulls and the pooled flag use the same dice; parry and set spear are not rolls ----
// Seeded bot games on v3.5. Every attack and pull must deal what the preview's case for its roll says.
const L5 = ["HM", "HM2", "HA", "LM", "LR"], L7 = ["HM", "HM2", "LM", "HR", "LR", "HA", "LA"];
const lineup = (codes) => codes.map((x) => ({ id: x, card: x.replace(/\d/, "") }));
const seen = new Set(); let attacks = 0, pulls = 0, holderHits = 0, parries = 0, spears = 0, refused = 0;
for (let g = 0; g < BOT_GAMES; g++) {
  const codes = g % 2 ? L7 : L5, rnd = rng("test_v35", g), B = DEFAULT_BRAINS[g % 3 === 0 ? "brain5" : "kitD"];
  const m = E.newMatch(JSON.parse(JSON.stringify(V35)), { first: g % 2 ? "S" : "N", lineups: { N: lineup(codes), S: lineup(codes) } });
  for (const t of [m.first, E.foeOf(m.first)]) E.act(m, { type: "deploy", team: t, placements: Bot.deploy(m, t, B, rnd) });
  let k = 0;
  while (m.phase === "play" && k++ < 6000) {
    const a = Bot.chooseAction(m, B, rnd).action;
    let want = null, holder = null, poolBefore = 0;
    if (a.type === "attack" || a.type === "pull") {
      const o = E.options(m, a.uid);
      const t = a.type === "attack" ? E.unitByUid(m, a.target) : null;
      const pv = a.type === "attack" ? o.attacks.find((x) => x.target === a.target) : o.pull;
      if (pv) { want = pv; if (t && E.isHolder(m, t)) { holder = t; poolBefore = E.effHp(m, t); } }
    }
    const logLen = m.log.length;
    const r = E.act(m, a, () => E.rollWith(m, rnd));
    if (!r.ok) { refused++; E.act(m, { type: "end" }); continue; }
    if (want && r.die) {
      seen.add(r.die);
      const cs = E.dieCases(m), i = cs.findIndex(([d]) => near(E.diceMultiplier(m, d), E.diceMultiplier(m, r.die)));
      const expect = a.type === "attack" ? E.applyDie(m, want.value, r.die, want.dodge) : E.applyDie(m, want.value, r.die);
      ok(i >= 0 && near(r.dmg, expect) && near(want.cases[i][0], expect), `game ${g}: ${a.type} on a ${r.die} dealt ${r.dmg}, preview case says ${i >= 0 ? want.cases[i][0] : "none"}`);
      if (a.type === "attack") attacks++; else pulls++;
      if (holder) { holderHits++; const after = holder.hp > 0 && E.isHolder(m, holder) ? E.effHp(m, holder) : 0; ok(near(after, Math.max(0, poolBefore - r.dmg)) || after === 0, `game ${g}: the pooled flag fell by the hit (${poolBefore} − ${r.dmg} → ${after})`); }
      for (const line of m.log.slice(logLen)) { const s = typeof line === "string" ? line : line.text || ""; if (/parr/i.test(s)) parries++; if (/set spear|spike/i.test(s)) spears++; }
    }
  }
  ok(m.phase !== "play", `game ${g}: finished (${m.result && m.result.how})`);
}
ok(refused === 0, `no refused actions in ${BOT_GAMES} bot games (got ${refused})`);
console.log(`v3.5 bot games: ${BOT_GAMES}, totals rolled: ${[...seen].sort((a, b) => a - b).join(" ")}`);
console.log(`attacks checked: ${attacks}, pulls: ${pulls}, hits on a holder: ${holderHits}, parry lines: ${parries}, set spear lines: ${spears}`); ok(attacks > 0, "attacks were checked");
// Pulls and the pooled flag (4.x), set up by hand: same dice, same rounding.
{ const L = (a) => a.map(([id, card]) => ({ id, card }));
  const setup = (lineN, lineS, place) => {
    const m = E.newMatch(JSON.parse(JSON.stringify(V35)), { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
    for (const team of ["N", "S"]) { const z = E.deployZone(m, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0; for (const u of m.units.filter((x) => x.team === team)) p[u.uid] = z[i++]; E.act(m, { type: "deploy", team, placements: p }); }
    for (const uid in place) E.unitByUid(m, uid).hex = place[uid];
    return m;
  };
  const mid = E.FLAG.S.replace(/\d+$/, (x) => String(+x - 1));   // the goal-zone hex in front of South's flag
  // An HM pull is 10 (no Support): 9 on a 4–5, 10 on 6–8, 11 on a 9–10, 12.5 on an 11.
  for (const [die, want] of [[4, 9], [5, 9], [7, 10], [9, 11], [10, 11], [11, 12.5], [2, 5]]) {
    const m = setup([["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-HM": mid, "S-HM": "A12", "S-LR": "A14" });
    const o = E.options(m, "N-HM");
    const r = E.act(m, { type: "pull", uid: "N-HM" }, () => die);
    ok(o.pull && o.pull.cases.length === 7 && r.ok && r.dmg === want && m.pole.S === Math.min(V35.game.poleHP, want), `pull of 10 on a ${die}: ${want} off the flag (got ${r.dmg}, flag damage ${m.pole.S})`);
    if (die === 4) ok(o.pull.low === 5 && o.pull.high === 15 && JSON.stringify(o.pull.cases.map(([d]) => d)) === "[5,7.5,9,10,11,12.5,15]", `pull preview shows 7 outcomes 5 … 15 (${o.pull.cases.map(([d]) => d)})`);
  }
  // An attack on a holder: the pool (flag 10 + HP) falls by the whole hit, on the new bands too.
  for (const [die, want] of [[4, 6.5], [7, 7], [9, 7.5]]) {
    const m = setup([["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": E.FLAG.S, "N-HM": mid, "S-LR": "A12" });
    const t = E.unitByUid(m, "S-HM"), before = E.effHp(m, t);
    const r = E.act(m, { type: "attack", uid: "N-HM", target: "S-HM" }, () => die);
    ok(r.ok && r.dmg === want && near(E.effHp(m, t), before - want), `attack on a holder, value 7, on a ${die}: ${want}; pool ${before} → ${E.effHp(m, t)}`);
  }
}
// Parry and set spear are reactions, not rolls: the same function on v3.4 and v3.5.
{ const a = JSON.stringify(E.dieCases(st(V35)).map(([d]) => d)); ok(a === "[2,3,4,7,9,11,12]", "case rolls 2, 3, 4, 7, 9, 11, 12"); }
ok(V35.parryPct === V34.parryPct && V35.spikeDamage === V34.spikeDamage, "parry (20% of Strength) and set spear (flat 2) unchanged");

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
