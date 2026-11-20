// Field checks (Brief 014, Game Laws 2.1, 2.4, 2.5): one field per format, rule set v3.8 (switch `fields`).
// The fields match briefs/014-fields.json; deploy areas, gaps, goal zones and symmetry; the legacy field is the old
// oval; hex positions are worked out from the middle column (parity flips on 7 and 11 columns); the turn-1 design
// rule; every rule the brief lists under "Rules it touches", on the 7-column field; and the bot on the new fields.
// node tests/test_fields.js [bot games per format, default 6]
const path = require("path");
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const { FIELDS: DATA } = require("../fields.js");
const W = require("../watch.js");
const SPEC = require(path.join(__dirname, "..", "..", "briefs", "014-fields.json"));
const V38 = PRESETS.find((p) => p.id === "v3.8"), V37 = PRESETS.find((p) => p.id === "v3.7");
const NEWEST = PRESETS[PRESETS.length - 1];
const GAMES = +(process.argv[2] || 6);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const sameSet = (a, b) => a.length === b.length && new Set(a).size === a.length && a.every((x) => b.includes(x));

// ---- The preset ----
ok(V38 && V38.switches.fields === true && V38.game.deployRadius5 === 2 && V38.game.deployRadius === 3, "v3.8: switch fields, 5v5 deploy radius 2, others 3");
ok(NEWEST === V38, "v3.8 is the newest preset (the new-game default)");
{ const a = JSON.parse(JSON.stringify(V37)), b = JSON.parse(JSON.stringify(V38));
  for (const k of ["id", "name", "note"]) { delete a[k]; delete b[k]; }
  delete b.switches.fields; delete b.game.deployRadius5;
  ok(JSON.stringify(a) === JSON.stringify(b), "v3.8 is v3.7 plus the fields switch and the 5v5 deploy radius, nothing else"); }
ok(V38.game.turnLimit5 === 25 && V38.game.turnLimit7 === 35, "turn limits unchanged: 25 at 5v5, 35 at 7v7 (2.7)");

// ---- Each field matches briefs/014-fields.json exactly ----
for (const id of ["5v5", "7v7", "9v9", "13v13"]) {
  const G = E.FIELDS[id], S = SPEC[id];
  ok(sameSet(G.CELLS, S.cells), `${id}: the hexes match the brief's list (${G.CELLS.length} vs ${S.cells.length})`);
  ok(G.CELLS.length === S.hexes, `${id}: ${S.hexes} hexes`);
  ok(G.FLAG.N === S.flags.N && G.FLAG.S === S.flags.S, `${id}: flags ${S.flags.N} and ${S.flags.S}`);
  ok(G.NCOL === S.columns && G.NROW === S.rows && G.COLS[G.MID] === S.middleColumn, `${id}: ${S.columns} columns, ${S.rows} rows, middle column ${S.middleColumn}`);
  ok(G.deployRadius === S.deployRadius, `${id}: deploy radius ${S.deployRadius}`);
  ok(G.size === +id.split("v")[0], `${id}: format size`);
}
// 7v7 is the legacy field plus eight hexes, nothing removed.
{ const add = E.FIELDS["7v7"].CELLS.filter((h) => !E.FIELDS.legacy.CELLS.includes(h));
  ok(sameSet(add, ["B2", "H2", "B17", "H17", "A4", "I4", "A16", "I16"]) && E.FIELDS.legacy.CELLS.every((h) => E.FIELDS["7v7"].CELLSET.has(h)), "7v7 = legacy + B2, H2, B17, H17, A4, I4, A16, I16"); }

// ---- The legacy field is the old 139 hexes (the oval the engine built before Brief 014), in the same order ----
{ const old = [], COLS = "ABCDEFGHI";
  for (let q = 0; q < 9; q++) for (let r = 1; r <= (q % 2 ? 18 : 19); r++) { const y = r + (q % 2 ? 0.5 : 0); if (((q - 4) / 4.75) ** 2 + ((y - 10) / 9.6) ** 2 <= 1.0) old.push(COLS[q] + r); }
  const G = E.FIELDS.legacy;
  ok(old.length === 139 && JSON.stringify(G.CELLS) === JSON.stringify(old), "legacy: the old 139-hex oval, same order");
  ok(G.FLAG.N === "E3" && G.FLAG.S === "E17", "legacy: flags E3 and E17");
  ok(E.CELLS === G.CELLS && E.FLAG === G.FLAG && E.dist === G.dist, "the engine's old exports are the legacy field");
  // The old distance (column index parity) on every pair of legacy hexes.
  const cube = (h) => { const q = COLS.indexOf(h[0]), r = +h.slice(1), z = (r - 1) - ((q - (q & 1)) >> 1); return [q, -q - z, z]; };
  let same = true;
  for (const a of old) for (const b of old) { const x = cube(a), y = cube(b); if (G.dist(a, b) !== Math.max(...[0, 1, 2].map((i) => Math.abs(x[i] - y[i])))) same = false; }
  ok(same, "legacy: every distance is the old one"); }

// ---- Deploy areas, gaps, goal zones (2.4, 2.5) ----
const deployOf = (G, t) => G.CELLS.filter((c) => G.dist(c, G.FLAG[t]) <= G.deployRadius);
const gapOf = (G) => { let g = Infinity; for (const a of deployOf(G, "N")) for (const b of deployOf(G, "S")) g = Math.min(g, G.dist(a, b)); return g; };
for (const id of ["5v5", "7v7", "9v9", "13v13"]) {
  const G = E.FIELDS[id], S = SPEC[id].check;
  ok(deployOf(G, "N").length === S.deployHexesPerSide && deployOf(G, "S").length === S.deployHexesPerSide, `${id}: ${S.deployHexesPerSide} deploy hexes per side (flag hex included)`);
  ok(gapOf(G) === S.gap, `${id}: gap between deploy areas ${S.gap} (got ${gapOf(G)})`);
}
for (const id in E.FIELDS) {
  const G = E.FIELDS[id];
  ok(G.GOAL.N.size === 6 && G.GOAL.S.size === 6 && [...G.GOAL.N, ...G.GOAL.S].every((h) => G.CELLSET.has(h)), `${id}: six goal-zone hexes round each flag`);
}

// ---- Symmetry: North to South and left to right ----
for (const id in E.FIELDS) {
  const G = E.FIELDS[id], key = (x, y) => x + "," + y;
  const pts = G.CELLS.map((h) => G.geo(...G.parse(h))), set = new Set(pts.map(([x, y]) => key(x, y)));
  const ys = pts.map((p) => p[1]), top = Math.min(...ys), bot = Math.max(...ys);
  ok(pts.every(([x, y]) => set.has(key(x, top + bot - y))), `${id}: mirror-symmetric North to South`);
  ok(pts.every(([x, y]) => set.has(key(G.NCOL - 1 - x, y))), `${id}: mirror-symmetric left to right`);
  const [fx, fy] = G.geo(...G.parse(G.FLAG.N)), [sx, sy] = G.geo(...G.parse(G.FLAG.S));
  ok(fx === G.MID && sx === G.MID && fy + sy === top + bot, `${id}: the flags mirror each other on the middle column`);
}

// ---- Hex names (2.4): the middle column is full; odd columns away from it sit half a hex lower ----
{ const G = E.FIELDS["5v5"];   // 7 columns: the middle column D has an odd index, so parity is the opposite of the index
  ok(G.geo(...G.parse("D1"))[1] === 1 && G.geo(...G.parse("C1"))[1] === 1.5 && G.geo(...G.parse("E1"))[1] === 1.5 && G.geo(...G.parse("B2"))[1] === 2 && G.geo(...G.parse("A3"))[1] === 3.5, "5v5: D full, C and E half a hex lower, B level with D, A lower");
  ok(sameSet(G.NBRS.D5, ["D4", "D6", "C4", "C5", "E4", "E5"]), `5v5: D5's neighbours are D4 D6 C4 C5 E4 E5 (got ${G.NBRS.D5})`);
  ok(sameSet(G.NBRS.C5, ["C4", "C6", "B5", "B6", "D5", "D6"]), `5v5: C5's neighbours are C4 C6 B5 B6 D5 D6 (got ${G.NBRS.C5})`);
  ok(G.dist("D2", "C1") === 1 && G.dist("D1", "C1") === 1 && E.FIELDS.legacy.dist("D1", "C2") === 1, "5v5: C1 touches D1 and D2 (on the legacy field C sits level)");
  const G9 = E.FIELDS["9v9"];   // 11 columns: middle F (odd index)
  ok(G9.geo(...G9.parse("E1"))[1] === 1.5 && G9.geo(...G9.parse("F1"))[1] === 1 && sameSet(G9.NBRS.F5, ["F4", "F6", "E4", "E5", "G4", "G5"]), "9v9: E and G sit half a hex lower than F");
  for (const id in E.FIELDS) { const H = E.FIELDS[id]; ok(H.offset(H.COLS[H.MID] + "5") === 0 && H.offset("A" + H.CELLS.find((h) => h[0] === "A").slice(1)) === -H.MID, `${id}: column offsets from the middle column`); }
}
ok(E.FIELDS["5v5"].centre === "D9" && E.FIELDS["7v7"].centre === "E10" && E.FIELDS["9v9"].centre === "F12" && E.FIELDS["13v13"].centre === "G13" && E.FIELDS.legacy.centre === "E10", "centre hexes D9, E10, F12, G13 (legacy E10)");
ok(E.FIELDS["5v5"].flagDist("D9").N === 6 && E.FIELDS["5v5"].flagDist("D9").S === 6, "flagDist: the centre hex is level between the flags");
ok(Object.keys(DATA).every((id) => DATA[id].cols.length === E.FIELDS[id].NCOL), "fields.js and the engine agree");

// ---- Which field a match uses ----
const line5 = L([["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]]);
const line7 = L([["HM", "HM"], ["HM2", "HM"], ["LM", "LM"], ["HR", "HR"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]]);
{ const a = E.newMatch(V38, { lineups: { N: line5, S: line5 } }), b = E.newMatch(V38, { lineups: { N: line7, S: line7 } });
  ok(a.field === "5v5" && E.fieldOf(a) === E.FIELDS["5v5"] && b.field === "7v7" && E.fieldOf(b) === E.FIELDS["7v7"], "v3.8: 5v5 on the 5v5 field, 7v7 on the 7v7 field");
  ok(E.deployZone(a, "N").length === 19 && E.deployZone(a, "S").length === 19 && E.deployZone(a, "N").includes("D3"), "v3.8 5v5: 19 deploy hexes per side, the flag hex included (2.5)");
  ok(E.deployZone(b, "N").length === 30 && E.deployZone(b, "S").length === 30 && E.deployZone(b, "S").includes("E17"), "v3.8 7v7: 30 deploy hexes per side, the flag hex included");
  ok(E.deployZone(a, "N").every((h) => E.FIELDS["5v5"].dist(h, "D3") <= 2), "v3.8 5v5: two rings round the flag"); }
for (const rs of PRESETS.filter((p) => !p.switches.fields)) {
  const a = E.newMatch(rs, { lineups: { N: line5.map((l) => (rs.cards[l.card] ? l : { id: l.id, card: "HM" })), S: line5.map((l) => (rs.cards[l.card] ? l : { id: l.id, card: "HM" })) } });
  ok(!("field" in a) && E.fieldOf(a) === E.FIELDS.legacy && E.deployZone(a, "N").every((h) => E.CELLSET.has(h) && E.dist(h, "E3") <= 3), `${rs.id}: every format stays on the legacy field (no field recorded in the match)`);
}
// One unit only on the flag hex (2.5): two on the same hex is refused, one on the flag is fine.
{ const st = E.newMatch(V38, { first: "N", lineups: { N: line5, S: line5 } }), z = E.deployZone(st, "N");
  const p = {}; st.units.filter((u) => u.team === "N").forEach((u, i) => { p[u.uid] = i === 0 ? "D3" : z.filter((h) => h !== "D3")[i]; });
  ok(E.act(st, { type: "deploy", team: "N", placements: p }).ok, "v3.8 5v5: one unit may deploy on its own flag");
  const st2 = E.newMatch(V38, { first: "N", lineups: { N: line5, S: line5 } }), p2 = Object.assign({}, p, { "N-HM2": "D3" });
  ok(!E.act(st2, { type: "deploy", team: "N", placements: p2 }).ok, "v3.8 5v5: a second unit on the flag hex is refused");
  const st3 = E.newMatch(V38, { first: "N", lineups: { N: line5, S: line5 } }), p3 = Object.assign({}, p, { "N-LR": "D6" });
  ok(!E.act(st3, { type: "deploy", team: "N", placements: p3 }).ok, "v3.8 5v5: a hex 3 from the flag is outside the deploy area"); }

// ---- The turn-1 design rule (2.4) ----
/* On every field the gap between deploy areas is larger than the furthest any card in the newest preset can reach on
   turn 1: its movement cap plus its longest attack (normal range, Reach's 2, or a special's longest range). A future
   card, trait or special that adds reach makes this fail. */
function attackRange(rs, c) {
  let r = c.range || 1;
  if (c.trait === "reach") r = Math.max(r, 2);
  const sp = c.special && rs.specials && rs.specials[c.special];
  if (sp && sp.maxRange) r = Math.max(r, sp.maxRange);
  if (c.reachBonus) r += c.reachBonus;
  return r;
}
const turnOneReach = Math.max(...Object.values(NEWEST.cards).map((c) => c.cap + attackRange(NEWEST, c)));
ok(turnOneReach === 7, `the furthest turn-1 reach in the newest preset is 7 today (got ${turnOneReach})`);
for (const id of ["5v5", "7v7", "9v9", "13v13"]) ok(gapOf(E.FIELDS[id]) > turnOneReach, `${id}: gap ${gapOf(E.FIELDS[id])} > turn-1 reach ${turnOneReach} (2.4)`);

// ---- Rules it touches, on the 7-column field (v3.8 5v5, where parity is flipped) ----
/** A v3.8 5v5 match deployed, then units placed by hand (others parked far away). North to move, turn 1. */
function setup5(lineN, lineS, place) {
  const st = E.newMatch(V38, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  st.field = "5v5";   // small hand-made lineups: put the match on the 5v5 field by hand
  const G = E.fieldOf(st);
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== G.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  const park = { N: ["A5", "B4", "F4", "G5", "A6"], S: ["A12", "B14", "F14", "G12", "A11"] };
  for (const u of st.units) if (!place[u.uid]) u.hex = park[u.team].shift();
  for (const uid in place) U(st, uid).hex = place[uid];
  st.cmd = 10;
  return st;
}
// Goal zones and storming (4.2–4.5): a holder on D3 can be attacked only from its goal zone.
{ const st = setup5([["HM", "HM"]], [["HR", "HR"]], { "N-HM": "D3", "S-HR": "D6" });
  const G = E.fieldOf(st), h = U(st, "N-HM"), s = U(st, "S-HR");
  ok(E.isHolder(st, h) && G.dist("D6", "D3") === 3 && !E.canAttackFrom(st, s, "D6", h), "5v5: a holder on D3 can't be shot from D6 (outside the goal zone)");
  ok(E.canAttackFrom(st, s, "D4", h) && G.GOAL.N.has("D4") && G.GOAL.N.has("C3") && G.GOAL.N.has("E2"), "5v5: it can be from its goal zone (D4, C3, E2 are goal hexes)");
  ok(sameSet([...E.homeOf("N", st)], ["D2", "D4", "C2", "C3", "E2", "E3"]), `5v5: North's goal zone is D2 D4 C2 C3 E2 E3 (got ${[...E.homeOf("N", st)]})`); }
// Room Dodge (3.5): the field edge is not open ground, on the new edges.
{ const st = setup5([["LM", "LM"]], [["HM", "HM"]], { "N-LM": "A3" });
  const G = E.fieldOf(st), r = E.dodgeRoom(st, U(st, "N-LM"));
  ok(G.NBRS.A3.length === 3 && r.open === 3, `5v5: A3 (a corner) has 3 hexes round it on the field (A4 B3 B4), 3 open (got ${G.NBRS.A3.length}, ${r.open})`);
  const st2 = setup5([["LM", "LM"]], [["HM", "HM"]], { "N-LM": "G9" });
  ok(E.dodgeRoom(st2, U(st2, "N-LM")).open === 4, "5v5: G9 on the right edge has 4 open hexes, not 6"); }
// Mark (3.8, Zone of Control): the hexes round a Heavy Melee on the 7-column field.
{ const st = setup5([["LM", "LM"]], [["HM", "HM"]], { "N-LM": "C8", "S-HM": "D9" });
  ok(sameSet([...E.zoneFor(st, "N")], ["D8", "D10", "C8", "C9", "E8", "E9"]), `5v5: a Heavy Melee on D9 marks D8 D10 C8 C9 E8 E9 (got ${[...E.zoneFor(st, "N")]})`);
  ok(E.options(st, "N-LM").attacks.some((a) => a.target === "S-HM"), "5v5: C8 is next to D9 (C sits lower), so the Light Melee can attack"); }
// Set spear (3.13): arriving next to a braced spear, judged on the 7-column field.
{ const st = setup5([["LM", "LM"]], [["HA", "HA"]], { "N-LM": "C6", "S-HA": "D9" });
  U(st, "S-HA").braced = true;
  const hp0 = U(st, "N-LM").hp, r = E.act(st, { type: "move", uid: "N-LM", to: "C8" });
  ok(r.ok && U(st, "N-LM").hp < hp0, `5v5: moving to C8 (next to D9) takes the set spear (hp ${hp0} → ${U(st, "N-LM").hp})`); }
{ const st = setup5([["LM", "LM"]], [["HA", "HA"]], { "N-LM": "B6", "S-HA": "D9" });
  U(st, "S-HA").braced = true;
  const hp0 = U(st, "N-LM").hp, r = E.act(st, { type: "move", uid: "N-LM", to: "B8" });
  ok(r.ok && U(st, "N-LM").hp === hp0 && E.fieldOf(st).dist("B8", "D9") === 2, "5v5: B8 is 2 from D9, no set spear"); }
// Reach and straight lines (3.10): D7 → D9 is a straight Reach shot; C7 → D9 is not straight.
{ const st = setup5([["HA", "HA"]], [["HM", "HM"]], { "N-HA": "D7", "S-HM": "D9" });
  ok(E.options(st, "N-HA").attacks.some((a) => a.target === "S-HM"), "5v5: Reach from D7 hits D9 (straight, 2 away)");
  const G = E.fieldOf(st);
  ok(G.straight2("D7", "D9") && G.straight2("B8", "D9") && G.middle("B8", "D9") === "C8" && G.straight2("B9", "D9") === false && G.straight2("B8", "D8") === false && G.middle("D7", "D9") === "D8", "5v5: straight lines worked out from the middle column");
  ok(G.straight2("B7", "D8") && G.middle("B7", "D8") === "C7", "5v5: B7 → D8 is a straight line through C7");
  const st2 = setup5([["HA", "HA"]], [["HM", "HM"]], { "N-HA": "B7", "S-HM": "D8" });
  ok(E.options(st2, "N-HA").attacks.some((a) => a.target === "S-HM"), "5v5: Reach from B7 hits D8 through C7");
  const st3 = setup5([["HA", "HA"]], [["HM", "HM"]], { "N-HA": "B8", "S-HM": "D8" });
  ok(!E.options(st3, "N-HA").attacks.some((a) => a.target === "S-HM"), "5v5: B8 → D8 is not a straight line (2 away, no Reach)"); }
// Volley range (3.11): a Heavy Ranged reaches 4 hexes, counted on the 7-column field.
{ const st = setup5([["HR", "HR"]], [["HM", "HM"]], { "N-HR": "A8", "S-HM": "E8" });
  const G = E.fieldOf(st);
  ok(G.dist("A8", "E8") === 4 && E.options(st, "N-HR").attacks.some((a) => a.target === "S-HM"), `5v5: A8 → E8 is 4 hexes, in range (got ${G.dist("A8", "E8")})`);
  const st2 = setup5([["HR", "HR"]], [["HM", "HM"]], { "N-HR": "A8", "S-HM": "F8" });
  ok(E.fieldOf(st2).dist("A8", "F8") === 5 && !E.options(st2, "N-HR").attacks.some((a) => a.target === "S-HM"), "5v5: A8 → F8 is 5 hexes, out of range"); }
// The flag blocks the line (4.9) on the 7-column field: D4 → D2 passes through the flag D3.
{ const G = E.FIELDS["5v5"]; ok(G.flagBetween("D5", "D1") && !G.flagBetween("C5", "E5") && G.flagBetween("B2", "F4") && G.lineBetween("B2", "F4").join(" ") === "C2 D3 E3", "5v5: D3 blocks the D5 → D1 and B2 → F4 lines (B2 C2 D3 E3 F4 is straight), not C5 → E5"); }
// Evade (6.5): each step further from the unit attacked, on the 7-column field.
{ const st = setup5([["LM", "LM"]], [["HM", "HM"]], { "N-LM": "C8", "S-HM": "D9" });
  E.act(st, { type: "attack", uid: "N-LM", target: "S-HM" }, () => 7);
  const o = E.options(st, "N-LM"), G = E.fieldOf(st);
  ok(U(st, "S-HM").hp > 0 && Object.keys(o.moves).length > 0 && Object.keys(o.moves).every((h) => G.dist(h, "D9") > 1), `5v5: Evade moves all lead away from D9 (${Object.keys(o.moves)})`); }
// Turn limit by format (2.7): unchanged.
ok(E.turnLimitFor(V38, 5) === 25 && E.turnLimitFor(V38, 7) === 35, "v3.8: 25 turns at 5v5, 35 at 7v7");

// ---- No board code uses the legacy field's exports or a fixed hex name ----
{ const fs = require("fs");
  for (const f of ["bot.js", "brain.js", "app.js", "ui.js", "watch.js"]) {
    const src = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
    const legacy = src.match(/\bE\.(dist|FLAG|CELLS|CELLSET|NBRS|GOAL|COLS|NCOL|NROW|parse|geo|homeOf|arcOf|hexBehind|lineBetween|flagBetween)\b/g);
    ok(!legacy, `${f}: no legacy field export (${legacy})`);
    const fixed = src.match(/["'`][A-M]\d{1,2}["'`]/g);
    ok(!fixed, `${f}: no fixed hex name (${fixed})`);
  } }

// ---- The bot on the new fields: legal, inside its deploy area, no crash ----
for (const fm of ["blitz5", "std7"]) {
  let errs = 0, outside = 0, unfinished = 0, refused = 0;
  for (let g = 0; g < GAMES; g++) {
    const m = W.setupMatch({ rules: "v3.8", format: fm, n: "brain5", s: "brain5", seed: `fields-${fm}-${g}`, first: "coin" });
    const st = E.newMatch(m.rs, m.opts), rand = W.matchRand(m);
    try {
      W.deployBots(m, st, rand);
      for (const u of st.units) if (!E.deployZone(st, u.team).includes(u.hex)) outside++;   // straight after deployment
      let k = 0;
      while (st.phase === "play" && k++ < 6000) { const a = Bot.chooseAction(st, m.brains[st.toMove], rand).action; const r = E.act(st, a, () => E.rollWith(st, rand)); if (!r.ok) { refused++; E.act(st, { type: "end" }); } }
      if (st.phase !== "over") unfinished++;
    } catch (e) { errs++; console.log(e.stack); }
  }
  ok(errs === 0 && outside === 0 && unfinished === 0 && refused === 0, `${fm} on v3.8: ${GAMES} Brain 5 games, errors ${errs}, deployed outside ${outside}, refused ${refused}, unfinished ${unfinished}`);
}

console.log(`${n - fails}/${n} field checks passed`);
process.exit(fails ? 1 : 0);
