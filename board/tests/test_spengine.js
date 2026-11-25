// Brief 026 engine checks (the one engine change, and section 10). Newest preset unless named.
// - warmupBlock / fireBlock say "Not enough Stamina" when the unit's Stamina is short and "Not enough Command" when only
//   the side's Command is short (a returned message only; no rule changes);
// - a Heavy unit never gets "attacked this turn and may only evade or end" after an adjacent attack (only Evade cards do);
// - a killing Pick Off that steps next to a braced Heavy Anti-Cavalry takes exactly the set spear the sheet's pill shows;
// - over many seeded positions (braced spears and braced parry units next to the target), the special sheet's kill
//   pills (spear amount, Mark) agree with what firing actually does, and it shows none when a parry would remove the
//   attacker first;
// - F026-1: the sheet's parry is the one firing makes: the first braced Heavy Melee in the arc that survives its hit
//   (the flag's position, and seeded Arc Hits with two braced Heavy Melee in one arc);
// - one spear a turn (spearOnArrival, Game Laws 3.13): a unit that already took a spear this turn takes no second one.
// node tests/test_spengine.js [positions, default 400]
const E = require("../engine.js"); const { PRESETS } = require("../data.js"); const UI = require("../ui.js");
const rng = require("./rng.js");
const NEW = PRESETS[PRESETS.length - 1];
const N_POS = +(process.argv[2] || 400);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const noRoll = () => { throw new Error("a special must never roll"); };
function setup(rs, lineN, lineS, place) {
  const st = E.newMatch(rs || NEW, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.fieldOf(st).FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  const park = { N: ["A6", "B6", "C6", "G6", "H6", "I6", "A7"], S: ["A14", "B14", "C14", "G14", "H14", "I14", "A13"] };
  for (const u of st.units) if (!place[u.uid]) u.hex = park[u.team].shift();
  for (const uid in place) U(st, uid).hex = place[uid];
  st.cmd = 10;
  return st;
}
ok(NEW.switches.specials && NEW.switches.captureTriggersSpike && NEW.switches.spearOnArrival && NEW.switches.parryNeedsSurvivor, `${NEW.id}: specials, set spear on taking the hex, one spear a turn, parry needs a survivor`);

// ---- Not enough Stamina / Not enough Command ----
{ const st = setup(null, [["LM", "LM"]], [["HM", "HM"]], { "N-LM": "E9", "S-HM": "E13" });
  U(st, "N-LM").stam = 0.5;
  ok(E.warmupBlock(st, U(st, "N-LM")) === "Not enough Stamina", `warm-up, Stamina short: ${E.warmupBlock(st, U(st, "N-LM"))}`);
  U(st, "N-LM").stam = 5; st.cmd = 0.5;
  ok(E.warmupBlock(st, U(st, "N-LM")) === "Not enough Command", `warm-up, only Command short: ${E.warmupBlock(st, U(st, "N-LM"))}`);
  U(st, "N-LM").stam = 0.5;
  ok(E.warmupBlock(st, U(st, "N-LM")) === "Not enough Stamina", "warm-up, both short: Stamina is named first");
  U(st, "N-LM").sp = "charged"; U(st, "N-LM").stam = 0.5; st.cmd = 10;
  ok(E.fireBlock(st, U(st, "N-LM")) === "Not enough Stamina", `fire, Stamina short: ${E.fireBlock(st, U(st, "N-LM"))}`);
  U(st, "N-LM").stam = 5; st.cmd = 0.5;
  ok(E.fireBlock(st, U(st, "N-LM")) === "Not enough Command", `fire, only Command short: ${E.fireBlock(st, U(st, "N-LM"))}`);
  ok(E.blockReasons(st, "N-LM").special === "Not enough Command", "the Special button's reason is Not enough Command");
}
// ---- Only Evade cards are told they may only evade ----
for (const code of ["HM", "HA", "LM"]) {
  const st = setup(null, [[code, code]], [["HM", "HM"]], { ["N-" + code]: "E9", "S-HM": "E10" });
  U(st, "S-HM").hp = 99; U(st, "S-HM").maxHp = 99;
  const r = E.act(st, { type: "attack", uid: "N-" + code, target: "S-HM" }, () => 7);
  const why = E.warmupBlock(st, U(st, "N-" + code)), evade = !!E.card(st, U(st, "N-" + code)).evade;
  ok(r.ok && /may only evade/.test(E.blockReasons(st, "N-" + code).special || "") === evade && !(!evade && /may only evade/.test(why || "")),
    `${code} after an adjacent attack: ${evade ? "may only evade" : "never told it may only evade"} (${why})`);
}

// ---- Section 10: a killing Pick Off next to a braced spear ----
{ const st = setup(null, [["LM", "LM"]], [["LR", "LR"], ["HA", "HA"]], { "N-LM": "E11", "S-LR": "E12", "S-HA": "E13" });
  U(st, "N-LM").sp = "charged"; U(st, "S-HA").braced = true; U(st, "S-LR").hp = 2;
  const p = E.options(st, "N-LM").special.targets.find((x) => x.target === "S-LR");
  const sh = UI.specialSheet(st, U(st, "N-LM"), U(st, "S-LR"), p), spear = sh.rows[0].pills.find((e) => e.type === "spear");
  ok(p.hits[0].kills && spear && spear.amount === NEW.spikeDamage, `the sheet shows the set spear pill (${spear && spear.amount})`);
  const hp0 = U(st, "N-LM").hp, r = E.act(st, { type: "special", uid: "N-LM", target: "S-LR" }, noRoll);
  ok(r.ok && U(st, "N-LM").hex === "E12" && hp0 - U(st, "N-LM").hp === spear.amount && U(st, "S-HA").spikeUsed, `firing: Light Melee takes E12 and exactly ${spear.amount} from the spear (took ${hp0 - U(st, "N-LM").hp})`);
}
// One spear a turn: a Light Melee that already took a spear this turn steps in next to a second braced spear.
{ const st = setup(null, [["LM", "LM"]], [["LR", "LR"], ["HA", "HA"], ["HA2", "HA"]], { "N-LM": "E11", "S-LR": "E12", "S-HA": "E13", "S-HA2": "F10" });
  U(st, "N-LM").sp = "charged"; U(st, "S-HA").braced = true; U(st, "S-LR").hp = 2; U(st, "N-LM").spearTaken = true;
  const p = E.options(st, "N-LM").special.targets.find((x) => x.target === "S-LR"), sh = UI.specialSheet(st, U(st, "N-LM"), U(st, "S-LR"), p);
  const hp0 = U(st, "N-LM").hp; E.act(st, { type: "special", uid: "N-LM", target: "S-LR" }, noRoll);
  ok(!sh.rows[0].pills.some((e) => e.type === "spear") && hp0 === U(st, "N-LM").hp, "one spear a turn: no second spear, and the sheet shows none");
}

// The parry gate (Brief 026 §10 (1)): on a test copy of the newest preset with parryNeedsSurvivor off (no real preset
// can do this), a killing Pick Off on a braced Heavy Melee is parried first; if the parry removes the attacker, the
// sheet shows no kill pills, says so on its parry line, and firing indeed never steps in.
{ const rs = JSON.parse(JSON.stringify(NEW)); rs.switches.parryNeedsSurvivor = false; rs.id = "test-no-survivor";
  const st = setup(rs, [["LM", "LM"]], [["HM", "HM"], ["HA", "HA"]], { "N-LM": "E11", "S-HM": "E12", "S-HA": "E13" });
  U(st, "N-LM").sp = "charged"; U(st, "N-LM").hp = 1; U(st, "S-HM").braced = true; U(st, "S-HA").braced = true; U(st, "S-HM").hp = 1;
  const p = E.options(st, "N-LM").special.targets.find((x) => x.target === "S-HM"), sh = UI.specialSheet(st, U(st, "N-LM"), U(st, "S-HM"), p);
  const parry = sh.rows[0].mods.find((m) => m.key === "parry");
  ok(p.hits[0].kills && sh.removesMe && !sh.rows[0].pills.length && parry && parry.red && sh.notes.some((x) => x.key === "parry" && /removes your/.test(x.text)), `parry that removes the attacker: no pills, parry in red, a line saying so (${JSON.stringify(sh.notes)})`);
  E.act(st, { type: "special", uid: "N-LM", target: "S-HM" }, noRoll);
  ok(U(st, "N-LM").hp <= 0 && U(st, "N-LM").hex === "E11" && !U(st, "S-HA").spikeUsed, "firing: the parry removes it, it never steps in, the spear stays loaded");
}

// ---- F026-1: the sheet's parry is the one firing makes (the first braced Heavy Melee that survives its hit) ----
// The flag's own position: Arc Hit on a 1 HP braced Heavy Melee kills it (no parry, parryNeedsSurvivor); the second
// braced Heavy Melee in the arc survives and parries. The old preview named the first one and the sheet showed nothing.
{ const st = setup(null, [["HM", "HM"]], [["HM", "HM"], ["HM2", "HM"]], { "N-HM": "C11", "S-HM": "C12", "S-HM2": "B11" });
  U(st, "N-HM").sp = "charged"; U(st, "S-HM").braced = true; U(st, "S-HM2").braced = true; U(st, "S-HM").hp = 1;
  const p = E.options(st, "N-HM").special.targets.find((x) => x.target === "S-HM");
  const sh = UI.specialSheet(st, U(st, "N-HM"), U(st, "S-HM"), p), row2 = sh.rows.find((r) => r.uid === "S-HM2");
  ok(p.kind === "arcHit" && p.hits.some((h) => h.uid === "S-HM2") && p.hits[0].kills, "F026-1 position: Arc Hit on C12 kills it and also hits B11");
  ok(p.parry && p.parry.by === "S-HM2" && sh.parryFires, `F026-1: the preview names Heavy Melee 2 as the parry (${p.parry && p.parry.by})`);
  ok(row2 && row2.mods.some((m) => m.key === "parry" && m.red && m.val === "2"), "F026-1: Heavy Melee 2's row shows the parry, 2");
  ok(sh.notes.some((x) => x.key === "parry" && x.text === "Parry: you take 2"), `F026-1: the note says "Parry: you take 2" (${(sh.notes.find((x) => x.key === "parry") || {}).text})`);
  const hp0 = U(st, "N-HM").hp, r = E.act(st, { type: "special", uid: "N-HM", target: "S-HM" }, noRoll);
  ok(r.ok && hp0 - U(st, "N-HM").hp === 2, `F026-1: firing takes exactly 2 (took ${hp0 - U(st, "N-HM").hp})`);
}
// Seeded: Arc Hits with two braced Heavy Melee in one arc. What the sheet says you take is what firing takes.
{ const rnd = rng("spengine-parry", 0), pick = (a) => a[Math.floor(rnd() * a.length)];
  let fired = 0, secondParries = 0, none = 0, bad = [];
  for (let i = 0; i < N_POS; i++) {
    const st = setup(null, [["HM", "HM"]], [["T", pick(["LR", "LM", "HR", "HM"])], ["HM", "HM"], ["HM2", "HM"]], {});
    const G = E.fieldOf(st), used = () => new Set(st.units.map((u) => u.hex));
    const at = pick(Object.keys(G.NBRS).filter((h) => G.NBRS[h].length === 6 && !G.onFlag(h) && !used().has(h)));
    const a = U(st, "N-HM"); a.hex = at;
    const th = pick(G.NBRS[at].filter((h) => !G.onFlag(h) && !used().has(h))); U(st, "S-T").hex = th;
    const arc = G.arcOf(at, th).filter((h) => !G.onFlag(h) && !used().has(h));
    for (const uid of ["S-HM", "S-HM2"]) { const free = arc.filter((h) => !used().has(h)); if (free.length) U(st, uid).hex = pick(free); }
    for (const uid of ["S-T", "S-HM", "S-HM2"]) { const x = U(st, uid); x.braced = rnd() < 0.8; x.hp = pick([1, 2, 4, 8, 14, 20]); x.maxHp = Math.max(x.maxHp, x.hp); if (rnd() < 0.15) x.parryUsed = true; }
    a.sp = "charged"; a.hp = pick([1, 2, 3, 6, 12, 20]);
    const o = E.options(st, "N-HM"), p = o.special && o.special.targets.find((x) => x.target === "S-T");
    if (!p) continue;
    const sh = UI.specialSheet(st, a, U(st, "S-T"), p), want = sh.parryFires ? Math.min(p.parry.amount, a.hp) : 0;
    const s2 = E.clone(st), hp0 = U(s2, "N-HM").hp, r = E.act(s2, { type: "special", uid: "N-HM", target: "S-T" }, noRoll);
    if (!r.ok) { bad.push(`#${i} refused: ${r.error}`); continue; }
    fired++;
    const got = hp0 - Math.max(U(s2, "N-HM").hp, 0), ev = (s2.events || []).slice(-1)[0];
    if (sh.parryFires && p.parry.by !== p.hits.find((h) => !h.kills && U(st, h.uid).braced && E.card(st, U(st, h.uid)).brace === "parry" && !U(st, h.uid).parryUsed)?.uid) bad.push(`#${i}: preview names ${p.parry.by}`);
    if (sh.parryFires && p.hits.findIndex((h) => h.uid === p.parry.by) > 0 && p.hits.some((h, k) => k < p.hits.findIndex((y) => y.uid === p.parry.by) && h.kills && U(st, h.uid).braced && E.card(st, U(st, h.uid)).brace === "parry")) secondParries++;
    if (!sh.parryFires) none++;
    if (Math.abs(got - want) > 1e-9) bad.push(`#${i}: firing took ${got}, the sheet says ${want} (${at}→${th}, parry ${p.parry && p.parry.by})`);
    if (sh.removesMe !== (U(s2, "N-HM").hp <= 0)) bad.push(`#${i}: removesMe ${sh.removesMe} but attacker HP ${U(s2, "N-HM").hp}`);
  }
  ok(!bad.length, `seeded Arc Hits with two braced Heavy Melee: the sheet's parry matches firing (${bad.length} bad):\n  ${bad.slice(0, 8).join("\n  ")}`);
  ok(fired > 200 && secondParries >= 10 && none > 20, `the seeded Arc Hits cover a second unit's parry (${secondParries}) and no parry (${none}) in ${fired} fired`);
  console.log(`  ${N_POS} Arc Hits: ${fired} fired, ${secondParries} parried by a second Heavy Melee after the first was removed, ${none} with no parry`);
}

// ---- Seeded agreement: the sheet's kill pills against what firing does ----
{ const rnd = rng("spengine", 0), pick = (a) => a[Math.floor(rnd() * a.length)];
  let kills = 0, spears = 0, marks = 0, parryBlocks = 0, bad = [];
  for (let i = 0; i < N_POS; i++) {
    const S = [["T", pick(["LR", "LM", "HR", "LA"])], ["HA", "HA"], ["HA2", "HA"], ["HM", "HM"], ["X", "LM"]];
    const st = setup(null, [["LM", "LM"], ["F", "HM"]], S, {});
    const G = E.fieldOf(st), free = () => { const used = new Set(st.units.map((u) => u.hex)); return Object.keys(G.NBRS).filter((h) => !used.has(h) && !G.onFlag(h)); };
    const at = pick(free().filter((h) => G.NBRS[h].length === 6)); U(st, "N-LM").hex = at;
    const th = pick(G.NBRS[at].filter((h) => !G.onFlag(h))); U(st, "S-T").hex = th;
    for (const uid of ["S-HA", "S-HA2", "S-HM", "S-X", "N-F"]) {   // round the target and the attacker, often next to them
      const near = [...new Set([...G.NBRS[th], ...G.NBRS[at]])].filter((h) => free().includes(h));
      U(st, uid).hex = rnd() < 0.75 && near.length ? pick(near) : pick(free());
      if (uid !== "N-F" && uid !== "S-X") U(st, uid).braced = rnd() < 0.7;
    }
    const lm = U(st, "N-LM"), t = U(st, "S-T");
    lm.sp = "charged"; lm.hp = pick([2, 3, 6, 12]); t.hp = pick([1, 3, 6, 9, 14, 20]); t.maxHp = Math.max(t.maxHp, t.hp);
    if (rnd() < 0.3) { U(st, "S-HM").hex = pick(G.NBRS[at].filter((h) => free().includes(h)).concat([U(st, "S-HM").hex])); U(st, "S-HM").braced = true; }
    const o = E.options(st, "N-LM"), p = o.special && o.special.targets.find((x) => x.target === "S-T");
    if (!p) continue;
    const sh = UI.specialSheet(st, lm, t, p), pills = sh.rows[0].pills, wantSpear = pills.filter((e) => e.type === "spear").reduce((s, e) => s + e.amount, 0), wantMark = pills.some((e) => e.type === "mark");
    if (p.hits[0].kills && sh.removesMe) parryBlocks++;
    const s2 = E.clone(st), was = new Set(s2.units.filter((u) => u.spikeUsed).map((u) => u.uid));
    const r = E.act(s2, { type: "special", uid: "N-LM", target: "S-T" }, noRoll);
    if (!r.ok) { bad.push(`#${i} refused: ${r.error}`); continue; }
    const a = U(s2, "N-LM"), stepped = a.hex === th;   // the spear may remove it after it steps in
    const gotSpear = s2.units.filter((u) => u.spikeUsed && !was.has(u.uid)).length * s2.rs.spikeDamage;
    const gotMark = a.hp > 0 ? stepped && E.zoneFor(s2, "N").has(th) : wantMark;   // a removed unit stands in no Mark
    if (p.hits[0].kills) kills++;
    if (wantSpear) spears++; if (wantMark) marks++;
    // A parry that removes the attacker first: no step, no pills. Otherwise a kill steps in and the pills are exact.
    if (p.hits[0].kills && !sh.removesMe && !stepped) bad.push(`#${i}: a kill the attacker survives should step in`);
    if (sh.removesMe && (pills.length || stepped)) bad.push(`#${i}: the parry should remove the attacker and the sheet show no pills`);
    if (gotSpear !== wantSpear) bad.push(`#${i}: spear ${gotSpear} vs sheet ${wantSpear} (${at}→${th})`);
    if (gotMark !== wantMark) bad.push(`#${i}: Mark ${gotMark} vs sheet ${wantMark} (${at}→${th})`);
  }
  ok(!bad.length, `seeded positions: the sheet's kill pills match firing (${bad.length} bad):\n  ${bad.slice(0, 8).join("\n  ")}`);
  ok(kills > 50 && spears > 10 && marks > 5, `the seeded positions cover kills (${kills}), set spears (${spears}) and Marks (${marks})`);
  console.log(`  ${N_POS} positions: ${kills} kills, ${spears} with a set spear, ${marks} with a Mark, ${parryBlocks} where a parry would remove the attacker first`);
}

console.log(`${n - fails}/${n} special engine checks passed`);
process.exit(fails ? 1 : 0);
