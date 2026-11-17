// v3 flag-holder checks: pooled damage, the gate, pulls on an empty flag, KO when the pool falls.
const E = require("../engine.js"); const { PRESETS } = require("../data.js");
const rs = PRESETS.find((p) => p.id === "v3"); let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
function setup(lineN, lineS, place) {
  const st = E.newMatch(rs, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone.filter((h) => h !== E.FLAG[team])[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) E.unitByUid(st, uid).hex = place[uid];
  return st;
}
ok(E.deployZone({ rs }, "S").includes("E17"), "own flag hex is in the deploy zone");
// South HM holds E17; North HM attacks from the goal zone (E16)
let st = setup([["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E17", "N-HM": "E16", "S-LR": "A12" });
ok(E.isHolder(st, E.unitByUid(st, "S-HM")), "S-HM holds the flag");
ok(E.effHp(st, E.unitByUid(st, "S-HM")) === 30, "pool 30");
let r = E.act(st, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);
ok(r.ok && r.dmg === 7, "hit for 7: " + (r.error || r.dmg));
ok(E.unitByUid(st, "S-HM").hp === 15.5 && E.flagLeft(st, "S") === 7.5, "split 15.5 + 7.5 (got " + E.unitByUid(st, "S-HM").hp + " + " + E.flagLeft(st, "S") + ")");
// Gate: an attacker outside the goal zone cannot target the holder (Reach / ranged)
st = setup([["HR", "HR"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E17", "N-HR": "E14", "S-LR": "A12" });
ok(!E.canAttackFrom(st, E.unitByUid(st, "N-HR"), "E14", E.unitByUid(st, "S-HM")), "no sniping the holder from range");
// No pull on a held flag; full-Strength pull with Support on an empty flag
st = setup([["HM", "HM"], ["LM", "LM"]], [["HM", "HM"], ["LR", "LR"]], { "N-HM": "E16", "N-LM": "D16", "S-HM": "A12", "S-LR": "A14" });
ok(E.pullValue(st, E.unitByUid(st, "N-HM")).value === 11, "empty flag: HM pull 10 + 1 Support = 11");
r = E.act(st, { type: "pull", uid: "N-HM" }, () => 7);
ok(r.ok && st.result && st.result.how === "KO", "an 11 pull on a 10 HP empty flag is a KO");
// The pool falling is a KO
st = setup([["HM", "HM"]], [["LR", "LR"], ["HM", "HM"]], { "S-LR": "E17", "N-HM": "E16", "S-HM": "A12" });
E.unitByUid(st, "S-LR").hp = 2; st.pole.S = 8;   // pool 2 + 2 = 4
r = E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
ok(r.ok && st.result && st.result.how === "KO" && st.result.winner === "N", "pool to 0 = KO");
// Hard stop: entering a zone ends movement
st = setup([["LM", "LM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E9", "S-HM": "E12", "S-LR": "A16" });
const rm = E.reachMap(st, E.unitByUid(st, "N-LM"));
const entered = Object.keys(rm).filter((h) => rm[h].mode === "entered"), shifted = Object.keys(rm).filter((h) => rm[h].mode === "shifted");
ok(entered.length > 0 && shifted.length === 0, "hard stop: can enter a zone but not shift on (entered " + entered.length + ", shifted " + shifted.length + ")");
console.log(`${n} checks, ${fails} failures`); process.exit(fails ? 1 : 0);
