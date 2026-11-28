// @test job=rules quick=2 release=2 night=no
// The match log's facts (Brief 018 §10.8): st.events is display only.
// - one entry per log line, in order, and each action's own entry carries its unit (and targets for attacks/specials);
// - replaying a match's actions rebuilds exactly the same st.events;
// - st.events is never copied into JSON (so never in a match record, a hash or a look-ahead copy);
// - a flag holder's HP in an entry is the display split of the pool (a pooled hit that leaves raw HP 16.67 shows 16.5);
// - a failed action leaves no entries.
// node tests/test_events.js [gamesPerSet]
const path = require("path");
const E = require(path.join(__dirname, "..", "engine.js")), Bot = require(path.join(__dirname, "..", "bot.js"));
const { PRESETS } = require(path.join(__dirname, "..", "data.js")); const { DEFAULT_BRAINS } = require(path.join(__dirname, "..", "brain.js"));
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const games = +(process.argv[2] || 4);
const B = DEFAULT_BRAINS.brain5 || DEFAULT_BRAINS.standard;
const LINE7 = ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];

function play(rs, seed) {
  const n2 = {}; const line = LINE7.map((c) => { n2[c] = (n2[c] || 0) + 1; return { id: n2[c] === 1 ? c : c + n2[c], card: rs.cards[c] ? c : "HM", fk: false }; });
  if (!rs.switches.noKeeper) line[0].fk = true;
  const rnd = E.seededRandom(seed);
  const st = E.newMatch(rs, { first: "N", lineups: { N: line, S: line } });
  for (const t of ["N", "S"]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
  let k = 0;
  while (st.phase === "play" && k++ < 6000) { const a = Bot.chooseAction(st, B, rnd).action; const r = E.act(st, a, () => E.rollWith(st, rnd)); if (!r.ok) E.act(st, { type: "end" }); }
  return { st, line };
}

const sets = PRESETS.slice(-4);
const kinds = {};
for (const base of sets) for (let g = 0; g < games; g++) {
  const rs = JSON.parse(JSON.stringify(base));
  const { st, line } = play(rs, `events-${base.id}-${g}`);
  ok(Array.isArray(st.events) && st.events.length === st.log.length, `${base.id} #${g}: one entry per log line (${st.events && st.events.length} vs ${st.log.length})`);
  ok(st.events.every((e, i) => e.i === i && e.kind === st.log[i].kind && e.turn === st.log[i].turn), `${base.id} #${g}: entries line up with the log`);
  for (const e of st.events) {
    kinds[e.kind] = (kinds[e.kind] || 0) + 1;
    if (e.action) {
      ok(!!e.unit || e.action === "end", `${base.id} #${g}: ${e.action} entry has its unit`);
      if (e.action === "attack" || e.action === "special") ok(e.targets && e.targets.length && e.targets.every((t) => typeof t.hpAfter === "number"), `${base.id} #${g}: ${e.action} entry has its targets`);
      if (e.action === "attack" || e.action === "pull") ok(Array.isArray(e.parts) && typeof e.value === "number" && typeof e.str === "number", `${base.id} #${g}: ${e.action} entry has Strength, parts and value`);
    }
  }
  // Replaying the actions rebuilds the same entries.
  const re = E.newMatch(rs, { first: "N", lineups: { N: line, S: line } });
  for (const a of st.actions) E.act(re, a, () => a.die);
  ok(JSON.stringify(re.events) === JSON.stringify(st.events), `${base.id} #${g}: replay rebuilds the same st.events`);
  // Never in JSON: not in a record, a clone or a hash.
  const json = JSON.stringify(st);
  ok(!/"events"/.test(json), `${base.id} #${g}: st.events is not in the state's JSON`);
  const record = JSON.stringify({ ruleset: rs, opts: {}, actions: st.actions, result: st.result });
  ok(!/"events"/.test(record), `${base.id} #${g}: a match record holds no events`);
  ok(E.clone(st).events === undefined && E.cloneLite(st).events === undefined, `${base.id} #${g}: copies keep no events`);
}
ok(kinds.attack > 0 && kinds.move > 0 && kinds.turn > 0, `bot games logged attacks, moves and turns (${JSON.stringify(kinds)})`);

// A failed action leaves no entries.
{
  const { st } = play(JSON.parse(JSON.stringify(PRESETS[PRESETS.length - 1])), "events-fail");
  const before = st.events.length;
  const r = E.act(st, { type: "move", uid: st.units[0].uid, to: "Z99" });
  ok(!r.ok && st.events.length === before, "a failed action leaves no entries");
}

// A flag holder's HP uses the display split: holder 20 HP, flag 10 left; a 5-point hit leaves the pool 25,
// raw holder HP 16.67, shown 16.5 (flag 8.5).
{
  const rs = JSON.parse(JSON.stringify(PRESETS[PRESETS.length - 1]));
  ok(rs.switches.flagHolder && rs.switches.poolAsOne, "newest preset has the pooled flag holder");
  const line = [{ id: "HM", card: "HM", fk: false }, { id: "HM2", card: "HM", fk: false }, { id: "LM", card: "LM", fk: false }, { id: "HR", card: "HR", fk: false }, { id: "LR", card: "LR", fk: false }];
  const st = E.newMatch(rs, { first: "S", lineups: { N: line, S: line } });
  const G = E.fieldOf(st);
  for (const t of ["S", "N"]) {
    const zone = E.deployZone(st, t).filter((h) => h !== G.FLAG[t]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === t)) p[u.uid] = zone[i++];
    E.act(st, { type: "deploy", team: t, placements: p });
  }
  const hold = E.unitByUid(st, "N-HM"), att = E.unitByUid(st, "S-HM");
  const goal = [...G.GOAL.N].filter((h) => h !== G.FLAG.N && G.dist(h, G.FLAG.N) === 1);
  for (const u of st.units) if (u !== hold && u !== att && goal.includes(u.hex)) u.hex = null;
  hold.hex = G.FLAG.N; att.hex = goal.find((h) => !st.units.some((u) => u !== att && u.hex === h));
  for (const u of st.units) if (u.hex === null) u.hex = E.deployZone(st, u.team).find((h) => !st.units.some((x) => x.hex === h) && !G.GOAL.N.has(h) && h !== G.FLAG[u.team]);
  hold.hp = 20; st.pole.N = rs.game.poleHP - 10;
  // Find the die that deals exactly 5 here, then attack with it.
  let die = null;
  const v = E.breakdown(st, att, hold, att.hex).value;
  for (let d = 2; d <= 12; d++) if (E.applyDie(st, v, d, 0) === 5) die = d;
  if (die === null) { att.card = "LM"; }
  let v2 = E.breakdown(st, att, hold, att.hex).value;
  if (die === null && v2 !== 5) { st.rs.cards[att.card].str -= v2 - 5; v2 = E.breakdown(st, att, hold, att.hex).value; }   // a test fixture: value 5
  for (let d = 2; d <= 12 && die === null; d++) if (E.applyDie(st, v2, d, 0) === 5) die = d;
  ok(die !== null, `a die gives exactly 5 damage (value ${v}/${v2})`);
  if (die !== null) {
    const r = E.act(st, { type: "attack", uid: att.uid, target: hold.uid }, () => die);
    ok(r.ok, "the attack on the holder is legal: " + (r.error || ""));
    const ev = st.events[st.events.length - 1].action === "attack" ? st.events[st.events.length - 1] : st.events.slice().reverse().find((e) => e.action === "attack");
    const t = ev && ev.targets[0];
    ok(Math.abs(hold.hp - 16.6667) < 0.01, `raw holder HP is 16.67 (got ${hold.hp})`);
    ok(t && t.hpBefore === 20 && t.hpAfter === 16.5, `the entry shows the holder 20 → 16.5 (got ${t && t.hpBefore} → ${t && t.hpAfter})`);
    ok(ev && ev.flag.N[0] === 10 && ev.flag.N[1] === 8.5, `the entry shows the flag 10 → 8.5 (got ${ev && ev.flag.N.join(" → ")})`);
  }
}

console.log(fails ? `${fails} of ${n} checks FAILED` : `All ${n} checks passed`);
process.exit(fails ? 1 : 0);
