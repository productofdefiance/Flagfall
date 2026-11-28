// @test job=rules quick=yes release=yes night=no
// v3.4 checks (Brief 005): a turn limit per format (5v5 25, 7v7 35). Older presets keep 25 for every format.
// node tests/test_v34.js
const E = require("../engine.js"); const { PRESETS, DEFAULT_RULESET } = require("../data.js");
const V34 = PRESETS.find((p) => p.id === "v3.4"), V33 = PRESETS.find((p) => p.id === "v3.3");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L5 = ["HM", "HM2", "HA", "LM", "LR"], L7 = ["HM", "HM2", "LM", "HR", "LR", "HA", "LA"];
const lineup = (codes) => codes.map((x) => ({ id: x, card: x.replace(/\d/, "") }));
/** Ends every turn until the match is over; returns the turn it ended on and the result. */
function runOut(rs, codes) {
  const st = E.newMatch(rs, { first: "N", lineups: { N: lineup(codes), S: lineup(codes) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  let k = 0; while (st.phase === "play" && k++ < 500) E.act(st, { type: "end" });
  return { turn: st.turn, result: st.result, limit: E.turnLimit(st) };
}

ok(V34 && V34.switches.turnLimitByFormat && V34.game.turnLimit5 === 25 && V34.game.turnLimit7 === 35, "v3.4 exists with 5v5 25 and 7v7 35");
// Was "v3.4 is the last preset". Brief 010 adds v3.5 after it; the newest-preset check now lives in test_v35.js.
ok(PRESETS.indexOf(V34) >= 0 && PRESETS.indexOf(V34) < PRESETS.length - 1, "v3.4 is still offered, behind the newest preset");
{ const a = JSON.parse(JSON.stringify(V33)), b = JSON.parse(JSON.stringify(V34));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  delete b.switches.turnLimitByFormat; delete b.game.turnLimit5; delete b.game.turnLimit7;
  // Brief 013 (no change in play): v3.4 stores bracing as Brace tiredness 1 instead of Stamina after bracing 2.
  delete a.game.staminaAfterBrace; delete b.game.braceTiredness;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.4 is v3.3 apart from the per-format turn limit"); }

for (const [rs, size, codes, want] of [[V34, 7, L7, 35], [V34, 5, L5, 25], [V33, 7, L7, 25], [V33, 5, L5, 25]]) {
  ok(E.turnLimitFor(rs, size) === want, `${rs.id} ${size}v${size}: turn limit ${want} (got ${E.turnLimitFor(rs, size)})`);
  const r = runOut(rs, codes);
  ok(r.limit === want && r.turn === want && r.result && /^turn limit/.test(r.result.how), `${rs.id} ${size}v${size}: a match with no fighting ends on turn ${want} (ended on ${r.turn}, ${r.result && r.result.how})`);
}
// Every older preset keeps 25 for both formats
// Brief 010: v3.5 comes after v3.4 and keeps its per-format limits, so "older" means the presets before v3.4.
for (const rs of [DEFAULT_RULESET, ...PRESETS.slice(0, PRESETS.indexOf(V34))]) ok(E.turnLimitFor(rs, 7) === 25 && E.turnLimitFor(rs, 5) === 25, `${rs.id}: 25 turns at 5v5 and 7v7`);
for (const rs of PRESETS.slice(PRESETS.indexOf(V34))) ok(E.turnLimitFor(rs, 5) === 25 && E.turnLimitFor(rs, 7) === 35, `${rs.id}: 25 turns at 5v5, 35 at 7v7`);
// Other formats on v3.4 fall back to the general limit
ok(E.turnLimitFor(V34, 9) === V34.game.turnLimit, "v3.4: a format without its own limit uses the general turn limit");
// The tiebreak at 35 is the usual order
{ const st = E.newMatch(V34, { first: "N", lineups: { N: lineup(L7), S: lineup(L7) } });
  for (const team of ["N", "S"]) { const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0; for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++]; E.act(st, { type: "deploy", team, placements: p }); }
  st.pole.S = 2; let k = 0; while (st.phase === "play" && k++ < 500) E.act(st, { type: "end" });
  ok(st.turn === 35 && st.result.winner === "N" && st.result.how === "turn limit, more pull damage", "v3.4 7v7: at turn 35 more pull damage wins"); }

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
