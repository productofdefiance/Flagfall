// v3.1 checks: the red team defects E1–E4 stay fixed, plus a North–South mirror test.
// node tests/test_v31.js
const E = require("../engine.js"); const { PRESETS } = require("../data.js");
const rs = PRESETS.find((p) => p.id === "v3.1"); let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(lineN, lineS, place, first, ruleset) {
  const st = E.newMatch(ruleset || rs, { first: first || "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone.filter((h) => h !== E.FLAG[team])[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
// Mirror a hex top-to-bottom (North's E3 <-> South's E17). Found by matching distances to both flags.
const mirror = {}; for (const h of E.CELLS) for (const m of E.CELLS)
  if (E.dist(h, E.FLAG.N) === E.dist(m, E.FLAG.S) && E.dist(h, E.FLAG.S) === E.dist(m, E.FLAG.N) && h[0] === m[0]) mirror[h] = m;

ok(rs && rs.switches.holderHoldsHex && rs.switches.poolAsOne && rs.switches.simultaneousToActor, "v3.1 exists with the three fix switches");
// Was "v3.1 is the last preset". Brief 002 adds v3.2 after it; the newest-preset check now lives in test_v32.js.
ok(PRESETS.indexOf(rs) >= 0 && PRESETS.indexOf(rs) < PRESETS.length - 1, "v3.1 is still offered, behind the newest preset");

// ---- E1: a holder that kills an adjacent enemy stays on its flag ----
let st = setup([["HM", "HM"], ["LR", "LR"]], [["LR", "LR"], ["HM", "HM"]], { "N-HM": "E3", "S-LR": "E4", "S-HM": "A8", "N-LR": "A6" });
U(st, "S-LR").hp = 2;
ok(E.options(st, "N-HM").attacks.find((a) => a.target === "S-LR").capture === null, "E1: preview shows no capture for a holder");
let r = E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
ok(r.ok && U(st, "S-LR").hp <= 0, "E1: the kill happens");
ok(U(st, "N-HM").hex === "E3" && E.holderOf(st, "N") === U(st, "N-HM"), "E1: holder still on E3 (at " + U(st, "N-HM").hex + ")");
// A non-holder still takes the hex
st = setup([["HM", "HM"], ["LR", "LR"]], [["LR", "LR"], ["HM", "HM"]], { "N-HM": "E7", "S-LR": "E8", "S-HM": "A12", "N-LR": "A6" });
U(st, "S-LR").hp = 2; E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
ok(U(st, "N-HM").hex === "E8", "E1: a unit off the flag still takes the hex");
// v3 still behaves the old way (saved v3 matches replay exactly)
const v3 = PRESETS.find((p) => p.id === "v3");
st = setup([["HM", "HM"], ["LR", "LR"]], [["LR", "LR"], ["HM", "HM"]], { "N-HM": "E3", "S-LR": "E4", "S-HM": "A8", "N-LR": "A6" }, "N", v3);
U(st, "S-LR").hp = 2; E.act(st, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
ok(U(st, "N-HM").hex === "E4", "v3 unchanged: holder still steps off (replay compatibility)");

// ---- E2: the pool is one number and falls only at 0 ----
function poolCase(flagLeft, unitHp, dmgWanted) {
  const s = setup([["HM", "HM"]], [["LR", "LR"], ["HM", "HM"]], { "S-LR": "E17", "N-HM": "E16", "S-HM": "A12" });
  U(s, "S-LR").hp = unitHp; s.pole.S = s.rs.game.poleHP - flagLeft;
  // find a die whose damage is the one we want, else drive hurt directly through a parry-free attack value
  const res = E.act(s, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7);
  return { s, res };
}
// The red team's case: 0.5 HP holder on a full 10 HP flag (pool 10.5). The HM hit is 10 x Dodge — must not end it.
{ const { s, res } = poolCase(10, 0.5); const P = 10.5;
  ok(res.ok && (res.dmg >= P ? !!s.result : !s.result), `E2: pool 10.5 hit by ${res.dmg} — ends only if the hit reaches the pool (result ${JSON.stringify(s.result)})`);
  if (!s.result) { const sp = E.poolSplit(s, "S"); ok(Math.abs(sp.pool - (P - res.dmg)) < 1e-9 && sp.unit >= 0.5 && sp.flag >= 0, `E2: pool left ${sp.pool} = ${P} − ${res.dmg}; shown flag ${sp.flag} + unit ${sp.unit}`); } }
// Sweep: for every pool and every hit smaller than it, the match never ends; a hit equal to it always does.
{ let bad = 0, cases = 0;
  for (const [fl, hp] of [[10, 0.5], [10, 1], [10, 2], [10, 4], [10, 20], [0.5, 20], [1, 20], [2, 18], [5, 12], [0.5, 10], [1.5, 16], [7.5, 15.5]]) {
    const P = fl + hp;
    for (let d = 0.5; d <= P + 1e-9; d += 0.5) {
      const s = setup([["HM", "HM"]], [["LR", "LR"], ["HM", "HM"]], { "S-LR": "E17", "N-HM": "E16", "S-HM": "A12" });
      const u = U(s, "S-LR"); u.hp = hp; s.pole.S = s.rs.game.poleHP - fl;
      // apply exactly d through a set-spear-free path: a direct hit via the engine's hurt (exposed through a 1-HP parry? no) —
      // use the public attack with a forced value instead: temporarily set the attacker's Strength so the hit is d.
      const c = s.rs.cards.HM; c.str = d; s.rs.cards.LR.dodge = false;
      const res = E.act(s, { type: "attack", uid: "N-HM", target: "S-LR" }, () => 7); cases++;
      const ended = !!s.result;
      if (!res.ok) { bad++; continue; }
      const dm = res.dmg;   // the minimum hit of 1 lifts a 0.5
      if (ended !== (dm >= P - 1e-9)) { bad++; console.log(`   pool ${fl}+${hp}: hit ${dm} ended=${ended}`); }
      if (!ended) { const sp = E.poolSplit(s, "S"); if (Math.abs(sp.pool - (P - dm)) > 1e-9 || sp.flag + sp.unit !== sp.pool) { bad++; console.log(`   pool ${fl}+${hp}: hit ${dm} left ${sp.pool}`); } }
    }
  }
  ok(bad === 0, `E2: ${cases} pool/hit cases — the match ends exactly when the hit reaches the pool (${bad} wrong)`);
}
// Repeated hits of 7 on 10 + 20: falls on the hit that takes the pool to 0, not before
{ const s = setup([["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E17", "N-HM": "E16", "S-LR": "A12" });
  s.rs.cards.HM.str = 10; let hits = 0;   // value 10 − Armor 3 = 7 on a 7
  while (!s.result && hits < 10) { E.act(s, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7); hits++; U(s, "N-HM").done = false; U(s, "N-HM").stam = 3; s.cmd = 10; }
  ok(hits === 5 && s.result && s.result.how === "KO", `E2: 30 pool under hits of 7 falls on hit 5 (fell on ${hits})`); }
// The holder leaving takes its rounded share; the flag keeps the rest; shares are whole half points
{ const s = setup([["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "S-HM": "E17", "N-HM": "A8", "S-LR": "A12" }, "S");
  U(s, "S-HM").hp = 20; s.pole.S = 0;
  // hurt it once through a brace-free hit from a goal-zone attacker placed by hand
  U(s, "N-HM").hex = "E16"; s.toMove = "N"; s.rs.cards.HM.str = 10;
  E.act(s, { type: "attack", uid: "N-HM", target: "S-HM" }, () => 7);   // 7 off 30 → 23
  const sp = E.poolSplit(s, "S");
  ok(sp.pool === 23 && sp.unit * 2 === Math.round(sp.unit * 2) && sp.flag + sp.unit === 23, `E2: shown split ${sp.flag} + ${sp.unit} of 23`);
  E.act(s, { type: "end" }); U(s, "N-HM").hex = "A8";
  r = E.act(s, { type: "move", uid: "S-HM", to: "E15" });
  ok(r.ok && U(s, "S-HM").hp === sp.unit && E.flagLeft(s, "S") === sp.flag, `E2: leaving keeps the shown split (unit ${U(s, "S-HM").hp}, flag ${E.flagLeft(s, "S")})`);
  ok(E.status(s, U(s, "S-HM")).hp === sp.unit, "E2: status shows the rounded share"); }

// ---- E3: a double knockout goes to the side that acted, whichever side that is ----
function mutual(attacker) {
  const def = attacker === "N" ? "S" : "N";
  const lines = attacker === "N" ? [[["LM", "LM"]], [["HM", "HM"]]] : [[["HM", "HM"]], [["LM", "LM"]]];
  const place = attacker === "N" ? { "N-LM": "E10", "S-HM": "E11" } : { "S-LM": "E10", "N-HM": "E9" };
  const s = setup(lines[0], lines[1], place, def);
  E.act(s, { type: "brace", uid: def + "-HM" }); E.act(s, { type: "end" });
  U(s, attacker + "-LM").hp = 1; U(s, def + "-HM").hp = 1;
  E.act(s, { type: "attack", uid: attacker + "-LM", target: def + "-HM" }, () => 7);
  return s.result;
}
const rN = mutual("N"), rS = mutual("S");
ok(rN && rN.winner === "N" && rN.how === "TKO", "E3: North attacks, both fall, North wins: " + JSON.stringify(rN));
ok(rS && rS.winner === "S" && rS.how === "TKO", "E3: South attacks, both fall, South wins: " + JSON.stringify(rS));

// ---- E4: bad inputs are refused, never crash, never award anything ----
st = setup([["HM", "HM"]], [["HM", "HM"]], { "N-HM": "E8", "S-HM": "E12" });
const bad = [null, {}, { type: 5 }, { type: "move", uid: "N-HM", to: "Z99" }, { type: "move", uid: "N-HM" }, { type: "move", to: "E9" },
  { type: "attack", uid: "N-HM", target: "N-HM" }, { type: "attack", uid: "N-HM" }, { type: "swap", uid: "N-HM", with: "nope" }, { type: "swap", uid: "N-HM" },
  { type: "swap", uid: "N-HM", with: "N-HM" }, { type: "pull", uid: "S-HM" }, { type: "surrender", team: "X" }, { type: "done" }, { type: "deploy", team: "Q", placements: {} }, { type: "fly" }];
let crashes = 0, accepted = 0; const before = JSON.stringify(st);
const origErr = console.error; console.error = () => { crashes++; };
for (const a of bad) { const o = E.act(st, a); if (o.ok) { accepted++; console.log("   accepted:", JSON.stringify(a)); } }
console.error = origErr;
ok(accepted === 0, `E4: ${bad.length} bad actions all refused (${accepted} accepted)`);
ok(crashes === 0, `E4: no internal errors (${crashes})`);
ok(JSON.stringify(st) === before && !st.result, "E4: state untouched, no result awarded");
r = E.act(st, { type: "surrender", team: "S" });
ok(r.ok && st.result.winner === "N", "E4: a valid surrender still works");

// ---- North–South mirror: the same position from either side gives the mirrored outcome ----
{ const scen = [
    [[["HM", "HM"], ["LM", "LM"]], [["HM", "HM"], ["LR", "LR"]], { "N-HM": "E9", "N-LM": "D9", "S-HM": "E10", "S-LR": "B13" }, [{ type: "attack", uid: "N-HM", target: "S-HM" }, { type: "attack", uid: "N-LM", target: "S-HM" }]],
    [[["HM", "HM"]], [["LR", "LR"], ["HM", "HM"]], { "N-HM": "E16", "S-LR": "E17", "S-HM": "A12" }, [{ type: "attack", uid: "N-HM", target: "S-LR" }]],
    [[["HM", "HM"], ["LR", "LR"]], [["LR", "LR"], ["HM", "HM"]], { "N-HM": "E3", "S-LR": "E4", "S-HM": "A8", "N-LR": "A6" }, [{ type: "attack", uid: "N-HM", target: "S-LR" }]],
  ];
  let diffs = 0;
  for (const [ln, ls, place, acts] of scen) {
    for (const die of [2, 3, 7, 11, 12]) {
      const a = setup(ln, ls, place, "N");
      const mp = {}; for (const k in place) mp[(k[0] === "N" ? "S" : "N") + k.slice(1)] = mirror[place[k]];
      const b = setup(ls, ln, mp, "S");
      for (const x of acts) {
        const y = Object.assign({}, x, { uid: (x.uid[0] === "N" ? "S" : "N") + x.uid.slice(1) }, x.target ? { target: (x.target[0] === "N" ? "S" : "N") + x.target.slice(1) } : {});
        E.act(a, x, () => die); E.act(b, y, () => die);
      }
      const sum = (s, flip) => s.units.map((u) => `${flip ? (u.team === "N" ? "S" : "N") : u.team}${u.id}@${u.hp > 0 ? (flip ? mirror[u.hex] : u.hex) : "x"}:${E.hpShown(s, u)}`).sort().join(" ")
        + ` pole ${flip ? s.pole.N : s.pole.S}/${flip ? s.pole.S : s.pole.N} res ${s.result ? (flip ? (s.result.winner === "N" ? "S" : "N") : s.result.winner) + s.result.how : "-"}`;
      if (sum(a, false) !== sum(b, true)) { diffs++; console.log("   mirror differs:\n   " + sum(a, false) + "\n   " + sum(b, true)); }
    }
  }
  ok(Object.keys(mirror).length === E.CELLS.length, "mirror map covers the field");
  ok(diffs === 0, `mirror: ${scen.length * 5} mirrored positions give mirrored results (${diffs} differ)`);
}
console.log(`${n} checks, ${fails} failures`); process.exit(fails ? 1 : 0);
