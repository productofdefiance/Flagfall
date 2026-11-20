// Impossible-state check on the newest preset (Brief 002, F17). Follows the last entry in PRESETS automatically.
// Plays seeded bot games and fails on anything redteam/invariants.js looks for: two units on one hex, HP outside
// its range, a unit off the field or on the enemy flag, negative Stamina or Command, a flag out of range, a refused
// bot action, a bot error, a game with no result, or a refused action that changes the match.
// node tests/test_invariants.js [games, default 30]
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const rs = JSON.parse(JSON.stringify(PRESETS[PRESETS.length - 1]));
const rnd = require("./rng.js")(`invariants:${rs.id}`, 0);
const games = +(process.argv[2] || 30), EPS = 1e-9;
const isHalf = (x) => Math.abs(x * 2 - Math.round(x * 2)) < EPS;
const mk = (codes) => { const n = {}; return codes.filter((c) => rs.cards[c]).map((c) => { n[c] = (n[c] || 0) + 1; return { id: n[c] === 1 ? c : c + n[c], card: c }; }); };
const lines = [["HM", "HM", "LM", "HR", "LR", "HA", "LA"], ["LM", "LM", "LR", "LR", "LR", "LA", "LA"], ["HM", "HM", "HM", "HR", "HR", "HA", "HA"], ["HA", "HA", "HA", "LA", "LA", "LM", "HR"]];
const problems = []; let actions = 0, refused = 0, botErrors = 0, warmups = 0, specials = 0;
const bad = (g, msg) => { if (problems.length < 200) problems.push(`game ${g}: ${msg}`); };
for (let g = 0; g < games; g++) {
  const first = g % 2 ? "S" : "N";
  const st = E.newMatch(rs, { first, lineups: { N: mk(lines[g % 4]), S: mk(lines[(g + 1) % 4]) } });
  // Brief 011: every third game is the default brain (Brain 5) on both sides, so a rule set with specials has them played.
  const B = g % 3 === 2 && DEFAULT_BRAINS.brain5 ? { N: DEFAULT_BRAINS.brain5, S: DEFAULT_BRAINS.brain5 } : { N: DEFAULT_BRAINS.kitB, S: g % 3 ? DEFAULT_BRAINS.standard : DEFAULT_BRAINS.easy };
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B[t], rnd) });
  let n = 0;
  while (st.phase === "play" && n++ < 6000) {
    let a;
    try { a = Bot.chooseAction(st, B[st.toMove], rnd).action; } catch (e) { botErrors++; bad(g, "bot threw: " + e.message); a = { type: "end" }; }
    const r = E.act(st, a, () => E.rollWith(st, rnd)); actions++;
    if (r.ok && a.type === "warmup") warmups++;
    if (r.ok && a.type === "special") specials++;
    if (!r.ok) { refused++; bad(g, "engine refused a bot action: " + JSON.stringify(a) + " " + r.error); E.act(st, { type: "end" }); }
    const al = E.alive(st), hexes = al.map((u) => u.hex);
    if (new Set(hexes).size !== hexes.length) bad(g, "two units on one hex");
    for (const u of al) {
      if (u.hp > u.maxHp + EPS) bad(g, `${u.uid} HP ${u.hp} above its maximum ${u.maxHp}`);
      // A holder may show 0 while its pool is down to the last half point: by design (v3.1) the flag keeps that half
      // point on screen (poolSplit). Any other living unit must show at least 0.5. See FLAGS.md F21.
      const lastHalf = E.isHolder(st, u) && Math.abs(E.poolSplit(st, u.team).pool - 0.5) < EPS;
      if (!isHalf(E.hpShown(st, u)) || (E.hpShown(st, u) < 0.5 - EPS && !lastHalf)) bad(g, `${u.uid} shows HP ${E.hpShown(st, u)}`);
      if (!E.isHolder(st, u) && (!isHalf(u.hp) || u.hp < 0.5 - EPS)) bad(g, `${u.uid} HP ${u.hp} is not a whole half point`);
      if (!E.CELLSET.has(u.hex)) bad(g, `${u.uid} off the field`);
      if (u.hex === E.FLAG[E.foeOf(u.team)]) bad(g, `${u.uid} on the enemy flag`);
      if (u.stam < -EPS) bad(g, `${u.uid} negative Stamina`);
      // Specials (Brief 011): a known state, only on cards that have one, and a warmed-up unit never attacked that turn
      if (u.sp !== undefined && !["unused", "warm", "charged", "used"].includes(u.sp)) bad(g, `${u.uid} special state ${u.sp}`);
      if (u.sp !== undefined && !E.specialOf(st, u)) bad(g, `${u.uid} has a special state without a special`);
      if (u.sp === "warm" && u.attackedThis && u.team === st.toMove) bad(g, `${u.uid} warmed up and attacked in one turn`);
      if (u.sp === "charged" && u.team !== st.toMove) bad(g, `${u.uid} still charged on the enemy's turn (it should have lapsed)`);
    }
    if (st.cmd < -EPS) bad(g, "negative Command");
    for (const t of ["N", "S"]) if (st.pole[t] < -EPS || st.pole[t] > rs.game.poleHP + EPS) bad(g, `flag damage out of range: ${st.pole[t]}`);
  }
  if (!st.result) bad(g, "no result");
}
// A refused action must leave the match exactly as it was.
{ const st = E.newMatch(rs, { first: "N", lineups: { N: mk(["HM", "LM"]), S: mk(["HM", "LM"]) } });
  for (const t of ["N", "S"]) { const z = E.deployZone(st, t).filter((h) => h !== E.FLAG[t]), p = {}; let i = 0; for (const u of st.units.filter((x) => x.team === t)) p[u.uid] = z[i++]; E.act(st, { type: "deploy", team: t, placements: p }); }
  const before = JSON.stringify(st);
  for (const a of [{ type: "swap", uid: "N-HM", with: "nope" }, { type: "move", uid: "N-HM", to: "Z9" }, { type: "attack", uid: "N-HM", target: "S-HM" }, { type: "pull", uid: "N-HM" }]) {
    const r = E.act(st, a); if (r.ok || JSON.stringify(st) !== before) bad("restore", "a refused action changed the match: " + JSON.stringify(a));
  }
}
console.log(JSON.stringify({ preset: rs.id, games, actions, refused, botErrors, warmups, specials, problems: problems.length }));
for (const p of [...new Set(problems)].slice(0, 10)) console.log("FAIL:", p);
process.exit(problems.length ? 1 : 0);
