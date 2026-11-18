// v3.2 checks (Brief 002): dead units don't parry; parry once per enemy turn; a double knockout goes to the tiebreaks.
// Each new rule is checked against v3.1 too: the v3.2 check fails on v3.1 and passes on v3.2.
// Then the double-knockout count: seeded Kit B vs Kit B games on v3.2 (balanced lineups), expected 0.
// node tests/test_v32.js [games per size, default 400]
const path = require("path"), os = require("os"), { fork } = require("child_process");
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const rng = require("./rng.js");
const V32 = PRESETS.find((p) => p.id === "v3.2"), V31 = PRESETS.find((p) => p.id === "v3.1"), V3 = PRESETS.find((p) => p.id === "v3");

// ---------- Double-knockout count: one chunk of games (run in a child process) ----------
const CHUNK = 20;
const BALANCED = { 5: { HM: 2, HA: 1, LM: 1, LR: 1 }, 7: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } };   // as tests/baseline.js
/** Win conditions each side holds right now, worked out here rather than read from the engine's result. */
function winConditions(st) {
  const w = {};
  for (const team of ["N", "S"]) {
    const foe = E.foeOf(team);
    if (st.pole[foe] >= st.rs.game.poleHP - 1e-9) w[team] = "KO";
    else if (!st.units.some((u) => u.team === foe && u.hp > 0 && (st.rs.switches.tkoNeedsKeeper || !u.fk))) w[team] = "TKO";
  }
  return w;
}
function runChunk(size, chunk) {
  const rs = JSON.parse(JSON.stringify(V32)), B = DEFAULT_BRAINS.kitB;
  const rnd = rng(`doubleko:v3.2:${size}`, chunk);
  const line = []; for (const code of Object.keys(rs.cards)) for (let i = 0; i < (BALANCED[size][code] || 0); i++) line.push({ id: i ? code + (i + 1) : code, card: code });
  const out = { size, chunk, games: 0, actions: 0, bothWin: 0, doubleResult: 0, noResult: 0, refused: 0, botErrors: 0, examples: [] };
  for (let g = 0; g < CHUNK; g++) {
    const k = g + chunk * CHUNK, first = k % 2 ? "S" : "N";
    const st = E.newMatch(rs, { first, lineups: { N: line, S: line } });
    for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
    let n = 0;
    while (st.phase === "play" && n++ < 6000) {
      let a;
      try { a = Bot.chooseAction(st, B, rnd).action; } catch (e) { out.botErrors++; a = { type: "end" }; }
      const r = E.act(st, a, () => E.rollWith(st, rnd));
      if (!r.ok) { out.refused++; E.act(st, { type: "end" }); continue; }
      out.actions++;
      const w = winConditions(st);
      if (w.N && w.S) { out.bothWin++; if (out.examples.length < 3) out.examples.push({ game: k, action: a, wins: w, last: st.log[st.log.length - 2] && st.log[st.log.length - 2].text }); }
    }
    out.games++;
    if (!st.result) out.noResult++;
    else if (/^double knockout/.test(st.result.how)) out.doubleResult++;
  }
  return out;
}
if (process.argv[2] === "--chunk") { process.send(runChunk(+process.argv[3], +process.argv[4])); process.exit(0); }

// ---------- Rule checks ----------
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(ruleset, lineN, lineS, place, first) {
  const st = E.newMatch(ruleset, { first: first || "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone.filter((h) => h !== E.FLAG[team])[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
const lastLog = (st, kind) => [...st.log].reverse().find((l) => l.kind === (kind || "attack")).text;
const PARRY = (st, attacker) => E.parryAmount(st, attacker);   // 20% of the attacker's Strength (HM: 2)

ok(V32 && V32.switches.parryNeedsSurvivor && V32.switches.parryFirstOnly && V32.switches.doubleKoToTiebreak && !V32.switches.simultaneousToActor,
  "v3.2 exists: the three new switches on, simultaneousToActor off");
// Was "v3.2 is the last preset". Brief 004 adds v3.3 after it; the newest-preset check now lives in test_v33.js.
ok(PRESETS.indexOf(V32) >= 0 && PRESETS.indexOf(V32) < PRESETS.length - 1, "v3.2 is still offered, behind the newest preset");
{ const a = JSON.parse(JSON.stringify(V31)), b = JSON.parse(JSON.stringify(V32));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  for (const k of ["parryNeedsSurvivor", "parryFirstOnly", "doubleKoToTiebreak", "simultaneousToActor"]) { delete a.switches[k]; delete b.switches[k]; }
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.2 is v3.1 apart from the switches this brief names"); }

// A braced South Heavy Melee at E9, North Heavy Melees at E8 (and E10 for the double attack), away from both goal zones.
const twoHM = [["HM", "HM"], ["HM2", "HM"]], oneHM = [["HM", "HM"], ["LR", "LR"]];
function braced(rs, lineN, place, hp) {
  const st = setup(rs, lineN, [["HM", "HM"], ["LR", "LR"]], Object.assign({ "S-HM": "E9", "S-LR": "A10" }, place));
  U(st, "S-HM").braced = true; if (hp !== undefined) U(st, "S-HM").hp = hp;
  return st;
}

// ---- Dead units don't parry (F4) ----
for (const [rs, parries] of [[V31, true], [V32, false]]) {
  const st = braced(rs, oneHM, { "N-HM": "E8", "N-LR": "A6" }, 1), hp0 = U(st, "N-HM").hp, pd = PARRY(st, U(st, "N-HM"));
  const r = E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(r.ok && U(st, "S-HM").hp <= 0, `${rs.id}: the attack kills the braced Heavy Melee`);
  ok(parries ? U(st, "N-HM").hp === hp0 - pd : U(st, "N-HM").hp === hp0,
    `${rs.id}: a braced Heavy Melee killed by the hit ${parries ? "still parries (old rule)" : "deals no parry"} (attacker HP ${hp0} → ${U(st, "N-HM").hp})`);
  ok(U(st, "N-HM").hex === "E9", `${rs.id}: the killer takes the emptied hex`);
  if (!parries) ok(/no parry \(HM did not survive the hit\)/.test(lastLog(st)), "v3.2: the log says why there was no parry");
}
// A survivor still parries
{ const st = braced(V32, oneHM, { "N-HM": "E8", "N-LR": "A6" }), hp0 = U(st, "N-HM").hp, pd = PARRY(st, U(st, "N-HM"));
  E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(U(st, "S-HM").hp > 0 && U(st, "N-HM").hp === hp0 - pd, `v3.2: a braced Heavy Melee that survives still parries ${pd}`); }
// A parry that fires is still the same size on v3.2 (20% of the attacker's Strength)
{ const st = braced(V32, oneHM, { "N-HM": "E8", "N-LR": "A6" });
  ok(E.parryPreview(st, U(st, "N-HM"), U(st, "S-HM")).amount === 2 && E.parryPreview(st, U(st, "N-HM"), U(st, "S-HM")).ifSurvives === true,
    "v3.2: the board's preview shows parry 2, only if the target survives"); }
{ const st = braced(V31, oneHM, { "N-HM": "E8", "N-LR": "A6" });
  const pv = E.parryPreview(st, U(st, "N-HM"), U(st, "S-HM"));
  ok(pv.amount === 2 && !pv.ifSurvives && !pv.used, "v3.1: the board's preview is unchanged (parry 2, no condition)"); }

// ---- Parry once per enemy turn (Game Laws 6.3) ----
for (const [rs, second] of [[V31, true], [V32, false]]) {
  const st = braced(rs, twoHM, { "N-HM": "E8", "N-HM2": "E10" });
  const h1 = U(st, "N-HM").hp, h2 = U(st, "N-HM2").hp, pd = PARRY(st, U(st, "N-HM"));
  ok(E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7).ok && E.act(st, { type: "attack", uid: "N-HM2", target: "S-HM" }, () => 7).ok, `${rs.id}: both attacks are legal`);
  ok(U(st, "S-HM").hp > 0, `${rs.id}: the braced Heavy Melee survives both attacks`);
  ok(U(st, "N-HM").hp === h1 - pd, `${rs.id}: the first attack is parried`);
  ok(second ? U(st, "N-HM2").hp === h2 - pd : U(st, "N-HM2").hp === h2,
    `${rs.id}: the second attack in the same turn is ${second ? "parried too (old rule)" : "not parried"} (attacker HP ${h2} → ${U(st, "N-HM2").hp})`);
  if (!second) {
    ok(/no parry \(HM has already parried this turn\)/.test(lastLog(st)), "v3.2: the log says the parry was already used");
    // Next enemy turn: South braces again on its own turn, North attacks again, the first attack is parried again.
    E.act(st, { type: "end" });
    ok(E.act(st, { type: "brace", uid: "S-HM" }).ok, "v3.2: South re-braces on its turn");
    E.act(st, { type: "end" });
    const h3 = U(st, "N-HM2").hp;
    ok(E.parryPreview(st, U(st, "N-HM2"), U(st, "S-HM")).amount === 2, "v3.2: the preview shows the parry ready again");
    E.act(st, { type: "attack", uid: "N-HM2", target: "S-HM" }, () => 7);
    ok(U(st, "N-HM2").hp === h3 - pd, "v3.2: in the next enemy turn the first attack is parried again");
    const h4 = U(st, "N-HM").hp; E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
    ok(U(st, "N-HM").hp === h4, "v3.2: ...and the second one that turn is not");
  }
}
// The used-up parry shows on the board
{ const st = braced(V32, twoHM, { "N-HM": "E8", "N-HM2": "E10" });
  E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(E.parryPreview(st, U(st, "N-HM2"), U(st, "S-HM")).used === true, "v3.2: the preview shows the parry as already used"); }
// Only adjacent attacks use up the parry: a Ranged shot or a Reach attack never does (the Editor, 17 Nov, F19).
{ const st = setup(V32, [["HM", "HM"], ["LR", "LR"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E9", "S-LR": "A10", "N-HM": "E8", "N-LR": "E6" });
  U(st, "S-HM").braced = true; const h0 = U(st, "N-HM").hp, l0 = U(st, "N-LR").hp, pd = PARRY(st, U(st, "N-HM"));
  const r1 = E.act(st, { type: "attack", uid: "N-LR", target: "S-HM" }, () => 7);
  ok(r1.ok && U(st, "N-LR").hp === l0, "v3.2: the Ranged shot lands and is not parried (it is not adjacent)");
  ok(E.parryPreview(st, U(st, "N-HM"), U(st, "S-HM")).amount === pd, "v3.2: after a Ranged shot the preview still shows the parry ready");
  const r2 = E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(r2.ok && U(st, "N-HM").hp === h0 - pd, "v3.2: a Ranged shot does not use up the parry: the adjacent attack after it is still parried"); }
{ const st = setup(V32, [["HM", "HM"], ["HA", "HA"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E9", "S-LR": "A10", "N-HM": "D9", "N-HA": "E7" });
  U(st, "S-HM").braced = true; const a0 = U(st, "N-HA").hp, h0 = U(st, "N-HM").hp, pd = PARRY(st, U(st, "N-HM"));
  const r1 = E.act(st, { type: "attack", uid: "N-HA", target: "S-HM" }, () => 7);
  ok(r1.ok && E.dist("E7", "E9") === 2 && U(st, "N-HA").hp === a0, "v3.2: a Reach attack from 2 hexes lands and is not parried");
  const r2 = E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(r2.ok && U(st, "N-HM").hp === h0 - pd, "v3.2: a Reach attack does not use up the parry either"); }
// Old rule sets keep no parry bookkeeping
{ const st = braced(V31, twoHM, { "N-HM": "E8", "N-HM2": "E10" });
  E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(!("parryUsed" in U(st, "S-HM")), "v3.1: no parry bookkeeping is added to units (old saved matches are unchanged)"); }

// ---- Interactions: the flag pool ----
// A braced holder whose pool falls to the hit deals no parry on v3.2 (it does on v3.1).
for (const [rs, parries] of [[V31, true], [V32, false]]) {
  const st = setup(rs, oneHM, [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E17", "S-LR": "A10", "N-HM": "E16", "N-LR": "A6" });
  const h = U(st, "S-HM"); h.braced = true; h.hp = 0.5; st.pole.S = rs.game.poleHP - 0.5;   // pool 1
  const hp0 = U(st, "N-HM").hp; E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(st.result && st.result.how === "KO" && st.result.winner === "N", `${rs.id}: the hit brings the held flag down`);
  ok(parries ? U(st, "N-HM").hp === hp0 - 2 : U(st, "N-HM").hp === hp0, `${rs.id}: a holder whose pool falls ${parries ? "still parries (old rule)" : "deals no parry"}`);
}
// A braced holder that survives parries, and a parry on an attacking holder goes into that holder's pool.
{ const st = setup(V32, oneHM, [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E17", "S-LR": "A10", "N-HM": "E16", "N-LR": "A6" });
  U(st, "S-HM").braced = true; const hp0 = U(st, "N-HM").hp;
  E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(!st.result && U(st, "N-HM").hp === hp0 - 2, "v3.2: a braced holder that survives the hit parries"); }
{ const st = setup(V32, oneHM, [["HM", "HM"], ["LR", "LR"]], { "N-HM": "E3", "S-HM": "E4", "S-LR": "A10", "N-LR": "A6" });
  U(st, "S-HM").braced = true; const pool0 = E.effHp(st, U(st, "N-HM"));
  E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
  ok(Math.abs(E.effHp(st, U(st, "N-HM")) - (pool0 - 2)) < 1e-9 && st.pole.N > 0, "v3.2: a parry on an attacking holder comes off its pool (flag and holder share it)");
  ok(U(st, "N-HM").hex === "E3", "v3.2: the holder stays on its flag"); }

// ---- Interactions: set spear on a capture is unchanged ----
{ const st = setup(V32, oneHM, [["LR", "LR"], ["HA", "HA"]], { "N-HM": "E8", "S-LR": "E9", "S-HA": "E10", "N-LR": "A6" });
  U(st, "S-LR").hp = 1; U(st, "S-HA").braced = true; const hp0 = U(st, "N-HM").hp;
  E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
  ok(U(st, "N-HM").hex === "E9" && U(st, "N-HM").hp === hp0 - V32.spikeDamage, "v3.2: a capture next to a braced Heavy Anti-Cavalry still takes set spear"); }

// ---- Double knockout (F3): forced with a test-only state, since parry can no longer cause one ----
// North's flag is already down when North removes South's last unit: both sides hold a win condition.
function doubleKo(rs, poleN, poleS, deadN) {
  const lineN = [["HM", "HM"]].concat(deadN ? [["LR", "LR"]] : []);
  const st = setup(rs, lineN, [["LR", "LR"]], Object.assign({ "N-HM": "E8", "S-LR": "E9" }, deadN ? { "N-LR": "A6" } : {}));
  if (deadN) U(st, "N-LR").hp = 0;
  U(st, "S-LR").hp = 1; st.pole.N = poleN; st.pole.S = poleS;
  const r = E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
  if (!r.ok) throw new Error(r.error);
  return st;
}
{ const P = V32.game.poleHP;
  let st = doubleKo(V32, P, 0);
  ok(st.result && st.result.winner === "S" && st.result.how === "double knockout, more pull damage",
    `v3.2: KO + TKO in one action goes to the tiebreaks: more flag damage wins (${JSON.stringify(st.result)})`);
  ok(/^Double knockout: South wins on more pull damage$/.test(st.log[st.log.length - 1].text), "v3.2: the log names the double knockout");
  st = doubleKo(V31, P, 0);
  ok(st.result && st.result.winner === "N" && st.result.how === "TKO", "v3.1 unchanged: the side that acted wins");
  st = doubleKo(V3, P, 0);
  ok(st.result && st.result.winner === "N" && st.result.how === "TKO", "v3 unchanged: North wins (checked first)");
  st = doubleKo(V32, P, P);
  ok(st.result && st.result.winner === "N" && st.result.how === "double knockout, fewer beings lost", "v3.2: equal flag damage, then fewer beings lost wins");
  ok(st.result.double && st.result.double.N && st.result.double.S === "KO", "v3.2: the result records both win conditions");
  st = doubleKo(V32, P, P, true);
  ok(st.result && st.result.winner === null && st.result.how === "double knockout, draw", "v3.2: level on both tiebreaks is a draw");
  ok(st.phase === "over", "v3.2: the match is over after a double knockout"); }
// The turn limit itself still reads the same
{ const st = setup(V32, oneHM, [["HM", "HM"], ["LR", "LR"]], {}); st.turn = st.rs.game.turnLimit; st.pole.S = 3;
  E.act(st, { type: "end" }); E.act(st, { type: "end" });
  ok(st.result && st.result.winner === "N" && st.result.how === "turn limit, more pull damage", "v3.2: the turn-limit result is worded as before"); }
// A single knockout is still a plain KO or TKO
{ const st = doubleKo(V32, 0, 0);
  ok(st.result && st.result.winner === "N" && st.result.how === "TKO", "v3.2: a normal TKO is unchanged"); }

console.log(`${n} rule checks, ${fails} failures`);

// ---------- Double-knockout count (F5) ----------
const perSize = +(process.argv[2] || 400);
const jobs = []; for (const size of [7, 5]) for (let c = 0; c < Math.ceil(perSize / CHUNK); c++) jobs.push([size, c]);
const results = [], workers = Math.max(1, Math.min(os.cpus().length, jobs.length));
let next = 0, running = 0;
const t0 = Date.now();
function launch() {
  while (running < workers && next < jobs.length) {
    const [size, c] = jobs[next++]; running++;
    const child = fork(__filename, ["--chunk", size, c]);
    child.on("message", (m) => results.push(m));
    child.on("exit", (code) => { running--; if (code !== 0) { fails++; console.log(`FAIL: chunk ${size}v${size} #${c} exited with ${code}`); } if (next < jobs.length) launch(); else if (!running) finish(); });
  }
}
function finish() {
  for (const size of [7, 5]) {
    const R = results.filter((r) => r.size === size), sum = (k) => R.reduce((s, r) => s + r[k], 0);
    console.log(`${size}v${size}: ${sum("games")} games, ${sum("actions")} actions; actions with both sides holding a win condition: ${sum("bothWin")}; ` +
      `double-knockout results: ${sum("doubleResult")}; games without a result: ${sum("noResult")}; refused bot actions: ${sum("refused")}; bot errors: ${sum("botErrors")}`);
    for (const r of R) for (const ex of r.examples) console.log("  example:", JSON.stringify(ex));
    ok(sum("games") === Math.ceil(perSize / CHUNK) * CHUNK, `${size}v${size}: every game ran`);
    ok(sum("bothWin") === 0, `${size}v${size}: no action left both sides with a win condition (expected 0, got ${sum("bothWin")})`);
    ok(sum("doubleResult") === 0, `${size}v${size}: no double-knockout results`);
  }
  console.log(`double-knockout count took ${Math.round((Date.now() - t0) / 1000)} s on ${workers} worker(s)`);
  console.log(`${n} checks, ${fails} failures`);
  process.exit(fails ? 1 : 0);
}
if (jobs.length) launch(); else finish();
