// @test job=rules quick=yes release=yes night=no
// Route checks (Brief 017, Game Laws 2.11, rule set v3.9, switch `routeRule211`).
// The brief's set-ups (7v7 on the v3.9 field), each mirrored top to bottom; older rule sets still jump; the preview
// agrees with the move (route().end is where the move ends, and its events are what the move does) on 1,000 random
// legal moves in seeded positions; and the board's read-only preview functions.
// node tests/test_route.js [random moves, default 1000]
const E = require("../engine.js");
const { PRESETS } = require("../data.js");
const R = require("./rng.js");
const V39 = PRESETS.find((p) => p.id === "v3.9"), V38 = PRESETS.find((p) => p.id === "v3.8");
const SAMPLES = +(process.argv[2] || 1000);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const U = (st, id) => E.unitByUid(st, id);
const LINE = [["HM", "HM"], ["HM2", "HM"], ["LM", "LM"], ["HR", "HR"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]].map(([id, card]) => ({ id, card }));
const rows = [];   // the route table for the Report

// ---- The preset ----
ok(V39 && V39.switches.routeRule211 === true, "v3.9 has switch routeRule211");
ok(PRESETS.indexOf(V39) === PRESETS.indexOf(V38) + 1 && PRESETS.indexOf(V39) < PRESETS.length, "v3.9 follows v3.8 (v3.10, brief 028, is the newest)");
{ const a = JSON.parse(JSON.stringify(V38)), b = JSON.parse(JSON.stringify(V39));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  delete b.switches.routeRule211;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.9 is v3.8 plus the routeRule211 switch, nothing else"); }

/** A 7v7 match on `rs`, deployed, then units placed by hand (the rest parked out of the way). `team` to move. */
function setup(rs, place, team, braced) {
  const st = E.newMatch(rs, { first: "N", lineups: { N: LINE, S: LINE } });
  const G = E.fieldOf(st);
  for (const t of ["N", "S"]) {
    const z = E.deployZone(st, t).filter((h) => h !== G.FLAG[t]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === t)) p[u.uid] = z[i++];
    const r = E.act(st, { type: "deploy", team: t, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  const park = { N: ["A5", "B3", "H3", "I5", "A6", "I6", "B4"], S: ["A15", "B17", "H17", "I15", "A14", "I14", "B16"] };
  if (G.id === "legacy") { park.N = ["A6", "B4", "H4", "I6", "A7", "I7", "B5"]; park.S = ["A14", "B16", "H16", "I14", "A13", "I13", "B15"]; }
  for (const u of st.units) if (!place[u.uid]) u.hex = park[u.team].shift();
  for (const uid in place) U(st, uid).hex = place[uid];
  if (team !== st.toMove) { st.toMove = team; }
  for (const u of st.units) { u.done = false; u.moved = 0; u.zmode = null; u.stam = 3; u.braced = !!(braced && braced.includes(u.uid)); u.spikeUsed = false; u.spearTaken = false; }
  st.cmd = 10;
  return st;
}
/** Top-to-bottom mirror of a hex on a field (columns an odd number from the middle sit half a hex lower). */
function mirrorHex(G, h) { const [q, r] = G.parse(h), low = (G.offset(h) & 1) === 1; return G.COLS[q] + (low ? G.rows - r : G.rows + 1 - r); }
const flip = (uid) => (uid[0] === "N" ? "S" : "N") + uid.slice(1);
function mirrored(G, place) { const o = {}; for (const k in place) o[flip(k)] = mirrorHex(G, place[k]); return o; }

/** One case: set-up, mover, destination, expected path (from the unit), expected end; also run mirrored. */
function check(name, place, mover, dst, expPath, expEnd, extra, braced) {
  for (const mir of [false, true]) {
    let pl = place, mv = mover, d = dst, ep = expPath, ee = expEnd, br = braced;
    const G = E.FIELDS["7v7"];
    if (mir) { pl = mirrored(G, place); mv = flip(mover); d = mirrorHex(G, dst); ep = expPath.map((h) => mirrorHex(G, h)); ee = mirrorHex(G, expEnd); br = (braced || []).map(flip); }
    const st = setup(V39, pl, mv[0], br);
    const r = E.route(st, mv, d);
    const got = r ? r.path.join("-") : "none";
    const label = `${name}${mir ? " (mirrored)" : ""}`;
    ok(r && got === ep.join("-") && r.end === ee && r.stoppedShort === (ee !== d), `${label}: expected ${ep.join("-")} ending ${ee}, got ${got} ending ${r && r.end}`);
    const res = E.act(st, { type: "move", uid: mv, to: d });
    ok(res.ok && U(st, mv).hex === ee, `${label}: the move itself ends on ${ee} (got ${U(st, mv).hex}${res.ok ? "" : ", " + res.error})`);
    if (extra) extra(r, st, label, mir);
    rows.push({ name: label, from: pl[mv], to: d, expected: `${ep.join("-")} (ends ${ee})`, actual: `${got} (ends ${r && r.end})` });
  }
}

// Tie to the centre: North Light Ranged C9 to B10, via C10 or B9: it takes C10.
check("Tie to the centre", { "N-LR": "C9" }, "N-LR", "B10", ["C9", "C10", "B10"], "B10");
// Tie to its own flag: C9 to E9, first steps D8 and D9 are both in column D: it takes D8 (toward North's flag).
check("Tie to own flag", { "N-LR": "C9" }, "N-LR", "E9", ["C9", "D8", "E9"], "E9");
// Arriving first: South Heavy Melee D13 (Mark C13 C14 D12 D14 E13 E14); North D10 to C13. The routes via D12 stop
// there; one via C12 reaches C13 (also a Mark: one danger each), so it arrives. Of the two via C12, D11 is nearer the centre.
check("Arriving first", { "N-LR": "D10", "S-HM": "D13" }, "N-LR", "C13", ["D10", "D11", "C12", "C13"], "C13",
  (r, st, label) => ok(r.events.length === 1 && r.events[0].type === "mark" && r.events[0].hex === r.end, `${label}: one event, the Mark at the end`));
// Stop short: South Heavy Melee E11 (Mark D10 D11 E10 E12 F10 F11); North Light Ranged C9 to F10. Every 3-hex route
// enters a Mark first; the 4-hex way round is never taken. It stops at E10.
check("Stop short", { "N-LR": "C9", "S-HM": "E11" }, "N-LR", "F10", ["C9", "D9", "E10", "F10"], "E10",
  (r, st, label) => { ok(r.events.length === 1 && r.events[0].type === "mark" && r.events[0].hex === r.end && r.events[0].by === (label.includes("mirror") ? "N-HM" : "S-HM"), `${label}: the Mark stop is the one event, by the Heavy Melee`);
    ok(r.cost === 1 && U(st, label.includes("mirror") ? "S-LR" : "N-LR").stam === 2, `${label}: charged for the 2 hexes walked (1 Stamina)`); });
// Set spear on arrival: braced South Heavy Anti-Cavalry F12; North Light Melee G11 to F11: a Mark stop at F11 and set spear 2.
check("Set spear on arrival", { "N-LM": "G11", "S-HA": "F12" }, "N-LM", "F11", ["G11", "F11"], "F11",
  (r, st, label, mir) => { const sp = r.events.find((e) => e.type === "spear"), mk = r.events.find((e) => e.type === "mark");
    ok(sp && sp.amount === 2 && sp.by === (mir ? "N-HA" : "S-HA") && sp.hex === r.end && mk && mk.hex === r.end, `${label}: set spear 2 from the braced unit and a Mark stop, both at the end`);
    ok(U(st, mir ? "S-LM" : "N-LM").hp === U(st, mir ? "S-LM" : "N-LM").maxHp - 2, `${label}: the move dealt the 2`); }, ["S-HA"]);
// Fewer dangers (rule 3): South Heavy Melee C7 and braced South Heavy Anti-Cavalry D7; North Light Ranged C9 to B6.
// Every cheapest route stops in a Mark. Via C8 (nearer the centre) it would take set spear as well (two dangers); via B8
// it stops at B7 with one, so it goes via B8. Unbraced, the same set-up goes via C8 (rule 4).
check("Fewer dangers", { "N-LR": "C9", "S-HM": "C7", "S-HA": "D7" }, "N-LR", "B6", ["C9", "B8", "B7", "B6"], "B7",
  (r, st, label) => ok(r.events.length === 1 && r.events[0].type === "mark", `${label}: one danger, the Mark`), ["S-HA"]);
check("Fewer dangers, spear unbraced", { "N-LR": "C9", "S-HM": "C7", "S-HA": "D7" }, "N-LR", "B6", ["C9", "C8", "B7", "B6"], "C8");

// ---- Older rule sets still jump: on v3.8 the stop-short set-up reaches F10 by the 4-hex way round ----
{ const st = setup(V38, { "N-LR": "C9", "S-HM": "E11" }, "N");
  const r = E.route(st, "N-LR", "F10");
  ok(r && r.end === "F10" && !r.stoppedShort && r.path.length === 5 && r.path.slice(1, -1).every((h) => !E.zoneFor(st, "N").has(h)), `v3.8: the jump arrives at F10 by a 4-hex path round the Mark (got ${r && r.path.join("-")})`);
  const res = E.act(st, { type: "move", uid: "N-LR", to: "F10" });
  ok(res.ok && U(st, "N-LR").hex === "F10" && U(st, "N-LR").stam === 1, "v3.8: the move itself jumps to F10 for 4 hexes (2 Stamina)"); }

// ---- The move hexes offered are as today: v3.9 offers exactly what v3.8 offers in the same position ----
{ const a = setup(V38, { "N-LR": "C9", "S-HM": "E11", "S-HA": "F13" }, "N", ["S-HA"]), b = setup(V39, { "N-LR": "C9", "S-HM": "E11", "S-HA": "F13" }, "N", ["S-HA"]);
  ok(JSON.stringify(Object.keys(E.options(a, "N-LR").moves).sort()) === JSON.stringify(Object.keys(E.options(b, "N-LR").moves).sort()), "v3.9 offers the same move hexes as v3.8 (2.11 item 6)"); }

// ---- Read-only preview functions ----
{ const st = setup(V39, { "N-LR": "C9", "S-HM": "E11" }, "N");
  ok(E.canAttackAfter(st, "N-LR", "C10") === true, "canAttackAfter: a Light Ranged after a 1-hex move can still shoot");
  const st2 = setup(V39, { "N-HR": "C9" }, "N"); U(st2, "N-HR").stam = 3;
  ok(E.canAttackAfter(st2, "N-HR", "C12") === false && E.canAttackAfter(st2, "N-HR", "C11") === true, "canAttackAfter: a Heavy Ranged after a full 3-hex move can't (no Stamina), after 2 it can");
  const rh = E.rangeHexes(st, "N-LR", "C9", "normal");
  ok(rh.length > 0 && rh.every((h) => E.fieldOf(st).dist("C9", h) <= 3) && rh.includes("C12") && !rh.includes("C13"), "rangeHexes normal: Light Ranged reaches 3 hexes");
  const ra = E.rangeHexes(st, "N-HA", "E9", "normal"), G = E.fieldOf(st);
  ok(ra.length === 12 && ra.filter((h) => G.dist("E9", h) === 2).length === 6, "rangeHexes normal: Anti-Cavalry = 6 adjacent + 6 Reach spokes");
  const rm = E.rangeHexes(st, "N-HM", "E9", "normal");
  ok(rm.length === 6, "rangeHexes normal: melee = the 6 adjacent hexes");
  const st3 = setup(V39, { "N-LA": "E9", "S-LM": "E11" }, "N"); U(st3, "N-LA").sp = "charged";
  const jav = E.rangeHexes(st3, "N-LA", "E9", "special");
  ok(!jav.includes("E12") && jav.includes("E7") && jav.includes("E6") && jav.every((h) => [2, 3].includes(G.dist("E9", h))), "rangeHexes special: Javelin spokes 2-3, never over an enemy");
  const ev = E.evadeHexes(setup(V39, { "N-LM": "E9", "S-HM": "E10" }, "N"), "N-LM", "S-HM");
  ok(Object.keys(ev).length > 0 && Object.keys(ev).every((h) => G.dist(h, "E10") > 1), "evadeHexes: a map of hexes away from the target");
  const kc = E.killConsequences(setup(V39, { "N-LM": "E9", "S-LM": "E10", "S-HA": "E11" }, "N", ["S-HA"]), "N-LM", "S-LM");
  ok(kc && kc.some((e) => e.type === "spear" && e.amount === 2 && e.by === "S-HA") && kc.some((e) => e.type === "mark"), "killConsequences: taking the hex next to a braced spearman: set spear 2 and its Mark");
  ok(E.killConsequences(setup(V39, { "N-LR": "E9", "S-LM": "E10" }, "N"), "N-LR", "S-LM") === null, "killConsequences: null for a Ranged attacker (it doesn't take the hex)");
  const ep = E.enemyPreview(setup(V39, { "N-LR": "C9", "S-LR": "C12" }, "N"), "S-LR");
  ok(ep && Object.keys(ep.moves).length > 0 && ep.canHit.includes("N-LR") && ep.stamNext === 3, "enemyPreview: the enemy's next-turn moves, and it can hit the Light Ranged 3 away"); }

// ---- Tackle: the route's events name the unit broken away from and the extra Stamina ----
{ const st = setup(V39, { "N-LR": "E9", "S-LM": "E10" }, "N");
  const r = E.route(st, "N-LR", "E7");
  ok(r && r.events.length === 1 && r.events[0].type === "tackle" && r.events[0].by === "S-LM" && r.events[0].amount === 0.5, "tackle event: by the Light Melee, +0.5 Stamina");
  E.act(st, { type: "move", uid: "N-LR", to: "E7" });
  ok(U(st, "N-LR").stam === 3 - 1 - 0.5 && U(st, "N-LR").tackled, "the move charged the tackle"); }

// ---- The preview agrees with the move: 1,000 random legal moves in seeded random positions ----
// Each position: all 14 units on random hexes round the middle of the field, about a third of them braced, random
// Stamina and Command, either side to move. One random legal move per position: route() must name where the move ends,
// whether it stopped short, and exactly the set spear, Mark and tackle the move then does.
{ const rng = R("route-agree", 0), base = setup(V39, {}, "N"), G = E.fieldOf(base);
  const middle = G.CELLS.filter((h) => !G.onFlag(h) && G.parse(h)[1] >= 5 && G.parse(h)[1] <= 15);
  let checked = 0, short = 0, spearEv = 0, markEv = 0, tackleEv = 0, removed = 0, bad = 0, tries = 0;
  while (checked < SAMPLES && tries++ < SAMPLES * 20) {
    const st = E.clone(base), pool = middle.slice();
    for (const u of st.units) {
      u.hex = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      u.braced = rng() < 0.35; u.spikeUsed = false; u.spearTaken = false; u.done = false; u.moved = 0; u.zmode = null; u.tackled = false;
      u.stam = [1, 1.5, 2, 2.5, 3][Math.floor(rng() * 5)]; u.hp = Math.min(u.maxHp, 1 + Math.floor(rng() * u.maxHp));
    }
    st.toMove = rng() < 0.5 ? "N" : "S"; st.cmd = 2 + Math.floor(rng() * 9);
    for (const u of st.units) if (u.team === st.toMove) u.braced = false;
    const mine = E.alive(st).filter((u) => u.team === st.toMove), u = mine[Math.floor(rng() * mine.length)];
    const hs = Object.keys(E.options(st, u.uid).moves);
    if (!hs.length) continue;
    const dst = hs[Math.floor(rng() * hs.length)], r = E.route(st, u.uid, dst);
    const hp0 = u.hp, n0 = st.log.length, s2 = E.clone(st), res = E.act(s2, { type: "move", uid: u.uid, to: dst }), u2 = U(s2, u.uid);
    const line = s2.log.slice(n0).map((x) => x.text).join(" | ");
    const spear = r ? r.events.filter((e) => e.type === "spear").reduce((t, e) => t + e.amount, 0) : 0;
    const agree = r && res.ok && u2.hex === r.end && (r.end !== dst) === r.stoppedShort && r.path[0] === u.hex && r.path[r.path.length - 1] === dst &&
      r.events.some((e) => e.type === "spear") === /braced .* deals/.test(line) &&
      r.events.some((e) => e.type === "mark") === /stopped by Zone of Control/.test(line) &&
      r.events.some((e) => e.type === "tackle") === !!u2.tackled &&
      Math.abs(Math.max(hp0 - spear, 0) - Math.max(u2.hp, 0)) < 1e-9 && Math.abs((u.stam - u2.stam) - r.cost) < 1e-9;
    if (!agree) { bad++; if (bad <= 5) console.log("disagree:", u.uid, dst, JSON.stringify(r), res.error || "", line); }
    checked++;
    if (r && r.stoppedShort) short++;
    if (u2.hp <= 0) removed++;
    if (r) { spearEv += r.events.filter((e) => e.type === "spear").length; markEv += r.events.filter((e) => e.type === "mark").length; tackleEv += r.events.filter((e) => e.type === "tackle").length; }
  }
  ok(checked >= SAMPLES && bad === 0, `preview agrees with the move: ${checked} random moves, ${bad} disagreements`);
  console.log(`agree: ${checked} moves, ${bad} disagreements; stopped short ${short}, removed on the way ${removed}; events: Mark ${markEv}, set spear ${spearEv}, tackle ${tackleEv}`); }

if (process.argv.includes("--table")) for (const r of rows) console.log(`| ${r.name} | ${r.from} → ${r.to} | ${r.expected} | ${r.actual} |`);
console.log(`${n - fails}/${n} route checks passed`);
process.exit(fails ? 1 : 0);
