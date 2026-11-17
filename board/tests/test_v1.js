// Unit checks for the v1 rules: dice, half points, room Dodge, Support per helper, parry %, pulls.
const E = require("../engine.js"); const { PRESETS } = require("../data.js");
const rs = PRESETS[0]; let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
function setup(placeN, placeS, lineN, lineS) {
  // Deploy legally, then put units where the test wants them.
  const st = E.newMatch(rs, { first: "N", lineups: { N: lineN, S: lineS } });
  for (const [team, place] of [["N", placeN], ["S", placeS]]) {
    const zone = E.deployZone(st, team), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
    for (const uid in place) E.unitByUid(st, uid).hex = place[uid];
  }
  return st;
}
const L = (arr) => arr.map(([id, card, fk]) => ({ id, card, fk: !!fk }));
// Dice table on a 10
ok([2, 3, 7, 11, 12].map((d) => E.applyDie({ rs }, 10, d)).join() === "5,7.5,10,12.5,15", "dice 10");
ok([2, 3, 7, 11, 12].map((d) => E.applyDie({ rs }, 7, d)).join() === "3.5,5.5,7,9,10.5", "dice 7 (5.25->5.5, 8.75->9)");
ok(E.applyDie({ rs }, 10, 7, 30) === 7 && E.applyDie({ rs }, 10, 7, 15) === 8.5 && E.applyDie({ rs }, 7, 7, 5) === 6.5, "dodge after roll, halves");
ok(E.applyDie({ rs }, 0, 7) === 1, "minimum 1");
// Room Dodge: a lone LR in open field = 30%
let st = setup({ "N-FK": "E4", "N-HM": "D10" }, { "S-FK": "E16", "S-LR": "E10" }, L([["FK", "HM", 1], ["HM", "HM"]]), L([["FK", "HM", 1], ["LR", "LR"]]));
const lr = E.unitByUid(st, "S-LR");
ok(E.dodgeRoom(st, lr).pct === 15, "one adjacent enemy -> 15% (got " + E.dodgeRoom(st, lr).pct + ")");
E.unitByUid(st, "N-HM").hex = "E7"; ok(E.dodgeRoom(st, lr).pct === 30, "alone -> 30%");
// Two enemies opposite -> 0%; side by side -> 10%
st = setup({ "N-FK": "E4", "N-HM": "D7", "N-HA": "F7" }, { "S-FK": "E16", "S-LR": "E12" }, L([["FK", "HM", 1], ["HM", "HM"], ["HA", "HA"]]), L([["FK", "HM", 1], ["LR", "LR"]]));
const lr2 = E.unitByUid(st, "S-LR"); const nb = E.NBRS["E10"];
lr2.hex = "E10"; E.unitByUid(st, "N-HM").hex = "E9"; E.unitByUid(st, "N-HA").hex = "E11";
ok(E.dodgeRoom(st, lr2).pct === 0, "opposite -> 0% (got " + E.dodgeRoom(st, lr2).pct + ")");
E.unitByUid(st, "N-HA").hex = nb.find((h) => h !== "E9" && E.dist(h, "E9") === 1);
ok(E.dodgeRoom(st, lr2).pct === 10, "side by side -> 10% (got " + E.dodgeRoom(st, lr2).pct + ")");
// A friend blocks its own hex only
E.unitByUid(st, "N-HA").hex = "A10"; E.unitByUid(st, "N-HM").hex = "A12"; E.unitByUid(st, "S-FK").hex = "E9";
ok(E.dodgeRoom(st, lr2).pct === 25, "one friend -> 25% (got " + E.dodgeRoom(st, lr2).pct + ")");
// Support per helper: HM attacks HM with two helpers next to target -> 10+2-3 = 9
st = setup({ "N-FK": "E4", "N-HM": "E6", "N-HA": "D6", "N-HM2": "F6" }, { "S-FK": "E16", "S-HM": "E14" }, L([["FK", "HM", 1], ["HM", "HM"], ["HA", "HA"], ["HM2", "HM"]]), L([["FK", "HM", 1], ["HM", "HM"]]));
const t = E.unitByUid(st, "S-HM"); t.hex = "E7"; E.unitByUid(st, "N-HA").hex = "D7"; E.unitByUid(st, "N-HM2").hex = "F7";
ok(E.breakdown(st, E.unitByUid(st, "N-HM"), t, "E6").value === 9, "support per helper (got " + E.breakdown(st, E.unitByUid(st, "N-HM"), t, "E6").value + ")");
// Parry 20% of attacker Strength
ok(E.parryAmount(st, E.unitByUid(st, "N-HM")) === 2 && E.parryAmount(st, E.unitByUid(st, "N-HA")) === 1.5, "parry 20%");
// Pull: HM 10 - 4 keeper at home; HR half Strength 4.5
ok(rs.game.poleHP === 30 && rs.game.keeperHomeReduction === 0 && rs.game.goalZoneReduction === 0, "goalie numbers");
console.log(`${n} checks, ${fails} failures`); process.exit(fails ? 1 : 0);
