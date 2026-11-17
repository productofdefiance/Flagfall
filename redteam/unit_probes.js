const E = require("../board/engine.js"); const { PRESETS, DEFAULT_RULESET } = require("../board/data.js");
const rs = PRESETS.find((p) => p.id === "v3");
const L = (a) => a.map(([id, card]) => ({ id, card }));
function setup(lineN, lineS, place, first) {
  const st = E.newMatch(rs, { first: first || "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone.filter((h) => h !== E.FLAG[team])[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) E.unitByUid(st, uid).hex = place[uid];
  return st;
}
const U = (st, id) => E.unitByUid(st, id);
const last = (st) => st.log[st.log.length - 1].text;
console.log("cells", E.CELLS.length, "goal S", [...E.GOAL.S].join(","), "goal N", [...E.GOAL.N].join(","));

// 1. Holder kills an adjacent enemy: is it dragged off its own flag?
let st = setup([["HM", "HM"], ["LR", "LR"]], [["LR", "LR"], ["HM", "HM"]], { "N-HM": "E3", "S-LR": "E4", "S-HM": "A8", "N-LR": "A6" });
U(st, "S-LR").hp = 2;
let r = E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
console.log("\n[1] holder kills adjacent:", r.ok, "| N-HM now at", U(st, "N-HM").hex, "| holder of N:", E.holderOf(st, "N") && E.holderOf(st, "N").id);
console.log("   ", last(st));

// 2. Rounding collapse: weak unit on a healthy flag
st = setup([["HM", "HM"]], [["LR", "LR"], ["HM", "HM"]], { "S-LR": "E17", "N-HM": "E16", "S-HM": "A12" });
U(st, "S-LR").hp = 0.5;   // pool = 10 + 0.5 = 10.5
const b = E.breakdown(st, U(st, "N-HM"), U(st, "S-LR"), "E16");
console.log("\n[2] HM attacks 0.5-HP LR holding a full 10-HP flag. pool", E.effHp(st, U(st, "S-LR")), "| attack value", b.value, "dodge", b.dodge);
r = E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
console.log("    dmg", r.dmg, "| result", JSON.stringify(st.result), "| flag left", E.flagLeft(st, "S"));
console.log("   ", last(st));
// sweep: for pools (flag f, unit h), the smallest damage that ends the match vs the pool size
const half = E.half;
function collapseAt(fl, hp) { const pool = fl + hp; for (let d = 0.5; d <= pool; d += 0.5) { const toFlag = half(d * fl / pool), toUnit = d - toFlag; if (d >= pool - 1e-9 || hp - toUnit <= 1e-9 || fl - toFlag <= 1e-9) return d; } return pool; }
console.log("    pool sweep (flag, unit) -> pool, damage that actually ends it:");
for (const [fl, hp] of [[10, 0.5], [10, 1], [10, 2], [10, 4], [10, 20], [0.5, 20], [1, 20], [2, 18], [5, 12], [0.5, 10], [1.5, 16]]) console.log(`      flag ${fl} + unit ${hp} = ${fl + hp}  falls to a hit of ${collapseAt(fl, hp)}`);
// can the split fail to be "together" over a sequence? simulate repeated hits of 7 on 10+20
{ let fl = 10, hp = 20, n = 0; while (fl > 0 && hp > 0) { const pool = fl + hp, d = 7; n++; if (d >= pool) { console.log(`      10+20 under repeated 7s: falls on hit ${n} with pool ${pool} left`); break; } const tf = half(d * fl / pool); fl -= tf; hp -= d - tf; if (fl <= 1e-9 || hp <= 1e-9) { console.log(`      10+20 under repeated 7s: collapsed EARLY on hit ${n}, leftover flag ${fl} unit ${hp}`); break; } } }

// 3. Both sides wiped at once: last attacker dies to parry while killing the last defender
st = setup([["LM", "LM"]], [["HM", "HM"]], { "N-LM": "E10", "S-HM": "E11" }, "S");
// S moves first: brace the HM
E.act(st, { type: "brace", uid: "S-HM" }); E.act(st, { type: "end" });
U(st, "N-LM").hp = 1; U(st, "S-HM").hp = 1;
r = E.act(st, { type: "attack", uid: "N-LM", target: "S-HM" }, () => 7);
console.log("\n[3] mutual wipe (N attacks, both die):", JSON.stringify(st.result), "|", last(st));
st = setup([["HM", "HM"]], [["LM", "LM"]], { "S-LM": "E10", "N-HM": "E11" }, "N");
E.act(st, { type: "brace", uid: "N-HM" }); E.act(st, { type: "end" });
U(st, "S-LM").hp = 1; U(st, "N-HM").hp = 1;
r = E.act(st, { type: "attack", uid: "S-LM", target: "N-HM" }, () => 7);
console.log("    mirrored (S attacks, both die):", JSON.stringify(st.result));

// 4. Ranged shooting through units (line of sight)
st = setup([["HR", "HR"]], [["LR", "LR"], ["HM", "HM"], ["HA", "HA"]], { "N-HR": "E8", "S-HM": "E9", "S-HA": "E10", "S-LR": "E12" });
console.log("\n[4] HR at E8 shoots LR at E12 through two enemy Heavies at E9, E10:", E.canAttackFrom(st, U(st, "N-HR"), "E8", U(st, "S-LR")));

// 5. Sealed fort: holder ringed by six friends — can anything target it?
st = setup([["HM", "HM"], ["HR", "HR"], ["HA", "HA"], ["LM", "LM"]], L0(), {}, "N");
function L0() { return [["HM", "HM"], ["A", "HM"], ["B", "HM"], ["C", "HM"], ["D", "HM"], ["F", "HM"], ["G", "HM"]]; }
{ const ring = [...E.GOAL.S]; const ids = ["S-A", "S-B", "S-C", "S-D", "S-F", "S-G"]; U(st, "S-HM").hex = "E17"; ids.forEach((id, i) => (U(st, id).hex = ring[i]));
  const outer = E.CELLS.filter((c) => E.dist(c, "E17") === 2);
  let can = 0; for (const id of ["N-HM", "N-HR", "N-HA", "N-LM"]) for (const h of E.CELLS) if (E.canAttackFrom(st, U(st, id), h, U(st, "S-HM"))) { if (!E.alive(st).some((x) => x.hex === h)) can++; }
  console.log("\n[5] sealed fort: free hexes from which any N unit could attack the holder:", can, "| can N pull?", E.CELLS.some((h) => !E.alive(st).some((x) => x.hex === h) && [...E.GOAL.S].includes(h))); }

// 6. Set spear on a unit shifting between two hexes that are both already adjacent
st = setup([["LM", "LM"]], [["HA", "HA"]], { "N-LM": "D11", "S-HA": "E11" }, "S");
E.act(st, { type: "brace", uid: "S-HA" }); E.act(st, { type: "end" });
{ const rm = E.reachMap(st, U(st, "N-LM")); const adj = Object.keys(rm).filter((h) => E.dist(h, "E11") === 1); const hp0 = U(st, "N-LM").hp;
  r = E.act(st, { type: "move", uid: "N-LM", to: adj[0] }); console.log("\n[6] unit already next to a braced HA shifts to", adj[0], "-> HP", hp0, "->", U(st, "N-LM").hp, "|", last(st)); }

// 7. Ranged pull strength vs the written rule
st = setup([["HR", "HR"], ["LR", "LR"]], [["HM", "HM"]], { "N-HR": "E16", "N-LR": "D16", "S-HM": "A10" });
console.log("\n[7] pull on an empty flag: HR", JSON.stringify(E.pullValue(st, U(st, "N-HR"))), "LR", JSON.stringify(E.pullValue(st, U(st, "N-LR"))));

// 8. Ranged adjacent kill: does it take the hex? (handover says a kill from an adjacent hex ALWAYS moves in)
st = setup([["HR", "HR"]], [["LR", "LR"], ["HM", "HM"]], { "N-HR": "E8", "S-LR": "E9", "S-HM": "A12" });
U(st, "S-LR").hp = 1; E.act(st, { type: "attack", uid: "N-HR", target: "S-LR" }, () => 7);
console.log("\n[8] HR kills adjacent LR; HR now at", U(st, "N-HR").hex);

// 9. Illegal / malformed input handling
st = setup([["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E8", "S-HM": "E12" });
const tries = [{ type: "move", uid: "N-HM", to: "Z99" }, { type: "move", uid: "N-HM" }, { type: "attack", uid: "N-HM", target: "N-HM" }, { type: "swap", uid: "N-HM", with: "nope" }, { type: "pull", uid: "S-HM" }, { type: "surrender", team: "X" }];
console.log("\n[9] bad input:"); for (const a of tries) { let o; try { o = E.act(E.clone(st), a); } catch (e) { o = { threw: e.message }; } console.log("   ", JSON.stringify(a), "->", JSON.stringify(o)); }
// surrender by the side NOT to move
{ const s2 = E.clone(st); const o = E.act(s2, { type: "surrender", team: "S" }); console.log("    surrender by S on N's turn ->", JSON.stringify(o), JSON.stringify(s2.result)); }
