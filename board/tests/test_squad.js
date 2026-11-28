// @test job=rules quick=2 release=10 night=no
// Squad rules and the squad checks (Brief 030; Game Laws 2.2, 2.16, 2.1, 4.2).
// 1. The check table: every squad rule × format × a short, full, over-cap, no-foot and forbidden-unit lineup gives the
//    expected legal / short / blocked result and reason. Cavalry only (and mounted units) are proven on a test unit
//    list with two mounted cards (2 UC each), so the function is ready before Brief 012 uses it.
// 2. Locked rows on the Lineup screen (Squad.row), and Cavalry only locking the foot rows once one foot unit is in.
// 3. The bot's own lineup inside each rule (Brief 030 §6), and the watch link carrying the squad rule.
// 4. Bot minimum: N seeded set-ups per rule available before Cavalry (Open, Light only, Heavy only, Foot only, Random)
//    at 5v5 and 7v7: the bot's lineup is legal every time (rule, a foot unit, full cap) and every match plays to its end.
//    The Brief's count is 100 per rule and format: node tests/test_squad.js 100
// node tests/test_squad.js [games per rule and format] [--rule <id>] [--table]
"use strict";
const SQ = require("../squad.js"), W = require("../watch.js"), E = require("../engine.js"), D = require("../data.js"), BR = require("../brain.js");
const rng = require("./rng.js");
const N = Math.max(0, +process.argv[2] || 2);
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };

const NEW = D.PRESETS[D.PRESETS.length - 1];
// The test unit list: the newest preset's six foot cards plus two mounted cards worth 2 UC (as Brief 012's will be).
const CAV = E.clone(NEW);
CAV.cards.HC = Object.assign(E.clone(NEW.cards.HM), { icon: "heavyCav", name: "Heavy Cavalry", beings: 2, mounted: true });
CAV.cards.LC = Object.assign(E.clone(NEW.cards.LM), { icon: "lightCav", name: "Light Cavalry", beings: 2, mounted: true });
const pick = (counts) => ({ keeper: null, counts });

// ---- 1. The check table ----
const table = [];
const RULES = ["open", "light", "heavy", "foot", "cavalry", "random"];
for (const rs of [NEW, CAV]) for (const size of [5, 7, 9, 13]) for (const rule of RULES) {
  const cav = rs === CAV;
  if (!cav && size >= 9) continue;   // no preset plays 9v9 or 13v13 before Cavalry
  // Lineups that suit the rule, built so each case tests one thing.
  const mountedOk = cav && size >= 9 && (rule === "open" || rule === "random" || rule === "cavalry");
  const foot = rule === "light" ? "LM" : rule === "cavalry" ? "HA" : "HM";
  const filler = rule === "cavalry" ? (cav ? "HC" : "HM") : rule === "light" ? "LR" : rule === "heavy" ? "HR" : "LR";
  const fill = (base) => { const c = Object.assign({}, base); let u = SQ.used(rs, pick(c)); const f = rs.cards[filler]; while (u + (f.beings || 1) <= size) { c[filler] = (c[filler] || 0) + 1; u += f.beings || 1; } return c; };
  const fullC = fill({ [foot]: 1 }), fullUsed = SQ.used(rs, pick(fullC));
  const cases = [];
  cases.push(["full", fullC, fullUsed === size ? "ok" : "short"]);
  const shortC = Object.assign({}, fullC); shortC[filler] -= 1; cases.push(["short", shortC, "short"]);
  cases.push(["over cap", Object.assign({}, fullC, { [filler]: fullC[filler] + 1 }), "blocked"]);
  cases.push(["no foot", mountedOk ? { HC: 2 } : {}, "blocked"]);   // without mounted cards the only lineup with no foot unit is an empty one
  const bad = rule === "light" ? "HM" : rule === "heavy" ? "LM" : rule === "foot" ? (cav ? "HC" : null) : rule === "cavalry" ? null : (cav && size < 9 ? "HC" : null);
  if (bad) { const c = Object.assign({}, fullC); c[filler] -= 1; c[bad] = 1; if (SQ.used(rs, pick(c)) > size) c[filler] -= 1; cases.push(["forbidden", c, "blocked"]); }
  if (rule === "cavalry") cases.push(["two foot", Object.assign({}, shortC, { HM: 1 }), "blocked"]);
  for (const [name, counts, want] of cases) {
    const r = SQ.check(rs, size, pick(counts), rule);
    let expect = want;
    if (rule === "cavalry" && size < 9) expect = "blocked";   // 2.1: Cavalry only needs 9v9 or 13v13
    table.push([cav ? "test list" : NEW.id, `${size}v${size}`, rule, name, r.status, r.reason || (r.status === "short" ? `${r.short} UC short` : "")]);
    ok(r.status === expect, `${cav ? "test list" : NEW.id} ${size}v${size} ${rule} ${name}: ${r.status} (${r.reason || ""}), wanted ${expect}`);
    if (name === "no foot" && expect === "blocked" && !(rule === "cavalry" && size < 9)) ok(/Add one foot unit|not allowed/.test(r.reason), `no-foot reason: ${r.reason}`);
    if (name === "forbidden" && expect === "blocked" && !(rule === "cavalry" && size < 9)) ok(/is not allowed (under|at) .*Remove it to start\./.test(r.reason), `forbidden reason: ${r.reason}`);
  }
}
ok(SQ.check(NEW, 7, pick({ LR: 7 }), "open").status === "ok", "Ranged and Anti-Cavalry are foot units: 7 Light Ranged is legal");
ok(SQ.check(CAV, 9, pick({ HC: 4 }), "open").reason === "Add one foot unit to hold your flag.", "F09: 9v9 with only Cavalry: Add one foot unit to hold your flag.");
ok(SQ.check(NEW, 7, pick({ HM: 3, LM: 2, LR: 2 }), "heavy").reason === "Light Melee is not allowed under Heavy only. Remove it to start.", "a kept lineup a changed rule forbids names the unit and the rule");
ok(SQ.check(NEW, 7, pick({ HM: 3, HR: 2 }), "open").status === "short" && SQ.check(NEW, 7, pick({ HM: 3, HR: 2 }), "open").short === 2, "a legal lineup 2 UC under its cap is short by 2");
ok(SQ.check(NEW, 7, pick({}), "open").status === "blocked", "a lineup with no units is not legal");
ok(SQ.checkLineup(NEW, 5, W.toLineup(NEW, pick({ HM: 2, LR: 3 })), "open").status === "ok", "checkLineup reads the engine's form");
// Old presets: the Flagkeeper counts as a unit and a foot unit.
{ const M3 = D.DEFAULT_RULESET; ok(SQ.check(M3, 5, { keeper: "HM", counts: { HM: 1, HA: 1, LM: 1, LR: 1 } }, "open").status === "ok", "match3: keeper plus four is a full legal 5v5");
  ok(SQ.check(M3, 5, { keeper: "HM", counts: { LM: 2, LA: 1, LR: 1 } }, "light").status === "blocked", "match3: a Heavy Melee keeper is forbidden under Light only"); }

// ---- 2. Locked rows ----
ok(SQ.row(NEW, "HM", "light", 7, pick({ LM: 3 })).locked === "Squad rule: Light only", "Light only locks Heavy Melee");
ok(SQ.row(NEW, "LM", "heavy", 7, pick({})).locked === "Squad rule: Heavy only", "Heavy only locks Light Melee");
ok(SQ.row(CAV, "HC", "foot", 9, pick({})).locked === "Squad rule: Foot only", "Foot only locks mounted units");
ok(SQ.row(CAV, "HC", "open", 7, pick({})).locked === "Mounted units need 9v9 or 13v13", "mounted units need 9v9 or 13v13 (2.1)");
ok(!SQ.row(CAV, "HA", "cavalry", 9, pick({ HC: 2 })).locked, "Cavalry only: foot rows open while no foot unit is in");
ok(SQ.row(CAV, "HM", "cavalry", 9, pick({ HA: 1, HC: 2 })).locked === "Squad rule: Cavalry only", "Cavalry only: the other foot rows lock once one foot unit is in");
{ const r = SQ.row(CAV, "HA", "cavalry", 9, pick({ HA: 1, HC: 2 })); ok(!r.locked && !r.canAdd, "Cavalry only: the row holding the foot unit stays, without +"); }
ok(!SQ.row(NEW, "HM", "open", 7, pick({ HM: 7 })).canAdd, "no + at the cap");
ok(!SQ.row(CAV, "HC", "open", 9, pick({ HM: 8 })).canAdd && SQ.row(CAV, "HM", "open", 9, pick({ HM: 8 })).canAdd, "a 2 UC unit can't go in with 1 UC left; a 1 UC unit can");
ok(SQ.isMounted(CAV.cards.HC) && !SQ.isMounted(NEW.cards.HA) && !SQ.isMounted(NEW.cards.LA), "mounted from the unit data: Cavalry yes, Anti-Cavalry no");
ok(!SQ.hasMounted(NEW) && SQ.hasMounted(CAV), "no preset has mounted units yet; the test list has");

// ---- 3. The bot's lineup inside each rule, and the watch link ----
const brain = BR.DEFAULT_BRAINS[BR.DEFAULT_OPPONENT];
for (const rule of ["open", "light", "heavy", "foot", "random"]) for (const size of [5, 7]) {
  const p = W.squadCounts(NEW, size, rule, "SEED-" + rule, "S", brain), r = SQ.check(NEW, size, p, rule);
  ok(r.status === "ok", `bot lineup ${rule} ${size}v${size}: ${r.status} ${r.reason || ""} ${JSON.stringify(p.counts)}`);
}
ok(JSON.stringify(W.squadCounts(NEW, 7, "light", "X", "N", brain).counts) === JSON.stringify(W.mixCounts(NEW, 7, "light", "X", "N", brain).counts), "Light only is today's light mix");
ok(JSON.stringify(W.squadCounts(NEW, 7, "open", "X", "N", brain).counts) === JSON.stringify(W.mixCounts(NEW, 7, "open", "X", "N", brain).counts), "Open is today's Open");
ok(JSON.stringify(W.squadCounts(NEW, 7, "random", "X", "N", brain).counts) === JSON.stringify(W.mixCounts(NEW, 7, "random", "X", "N", brain).counts), "Random is today's random draw");
for (const size of [9, 13]) {
  const p = W.squadCounts(CAV, size, "cavalry", "X", "S", brain), r = SQ.check(CAV, size, p, "cavalry");
  ok(r.status === "ok" && p.counts.HA === 1 && p.counts.HC >= p.counts.LC, `test list Cavalry only ${size}v${size}: Heavy Anti-Cavalry plus Cavalry, Heavy first, full (${JSON.stringify(p.counts)}, ${r.status})`);
}
ok(W.squadCounts(CAV, 9, "cavalry", "X", "S", Object.assign({}, brain, { cavalryFoot: "LA" })).counts.LA === 1, "Cavalry only: the brain's choice of foot unit");
{ const M3 = D.DEFAULT_RULESET, p = W.squadCounts(M3, 5, "light", "X", "S", brain); ok(SQ.check(M3, 5, p, "light").status === "ok" && p.keeper === "LM", `match3 Light only: a Light keeper (${p.keeper})`); }
{ const sp = { seed: "TEST-SQUAD-0001", rules: NEW.id, format: "blitz5", n: "brain5", s: "brain5", first: "N", squad: "heavy" };
  const q = W.toQuery(sp), back = W.fromQuery(q);
  ok(/squad=heavy/.test(q) && back.squad === "heavy", "the watch link carries the squad rule: " + q);
  ok(!/squad=/.test(W.toQuery(Object.assign({}, sp, { squad: "open" }))) && W.fromQuery(W.toQuery(Object.assign({}, sp, { squad: undefined }))).squad === "open", "a link without a squad rule reads as Open (older links unchanged)");
  const m = W.setupMatch(back);
  ok(m.opts.squadRule === "heavy" && ["N", "S"].every((t) => SQ.checkLineup(m.rs, 5, m.opts.lineups[t], "heavy").status === "ok"), "a squad watch link sets up both lineups inside the rule");
  const o = W.setupMatch(Object.assign({}, sp, { squad: undefined }));
  ok(!("squadRule" in o.opts), "an Open watch link's record is exactly as before (no squadRule field)");
  ok(W.problem(Object.assign({}, sp, { squad: "cavalry" })) && /9v9/.test(W.problem(Object.assign({}, sp, { squad: "cavalry" }))), "a Cavalry only link at 5v5 can't be played");
  ok(/Squad rule/.test(W.problem(Object.assign({}, sp, { squad: "silly" })) || ""), "an unknown squad rule can't be played"); }

// ---- 4. Bot minimum ----
const counts = {};
let games = 0, errors = 0;
const only = process.argv.includes("--rule") ? process.argv[process.argv.indexOf("--rule") + 1] : null;   // one rule's games (to split a long run)
for (const rule of ["open", "light", "heavy", "foot", "random"].filter((r) => !only || r === only)) for (const format of ["blitz5", "std7"]) {
  const key = `${rule} ${format === "blitz5" ? "5v5" : "7v7"}`; counts[key] = { legal: 0, full: 0, ended: 0, games: 0 };
  const size = format === "blitz5" ? 5 : 7;
  for (let g = 0; g < Math.max(N, 1); g++) {
    const seed = W.seedFrom(rng(`squad:${rule}:${format}`, g));
    for (const t of ["N", "S"]) {   // the set-up check on both sides, every set-up
      const p = W.squadCounts(NEW, size, rule, seed, t, brain), r = SQ.check(NEW, size, p, rule);
      if (r.status !== "blocked") counts[key].legal++;
      if (r.status === "ok") counts[key].full++;
    }
    if (g >= N) continue;
    try {
      const { st } = W.playOut({ seed, rules: NEW.id, format, n: BR.DEFAULT_OPPONENT, s: BR.DEFAULT_OPPONENT, first: g % 2 ? "S" : "N", squad: rule });
      counts[key].games++; games++;
      if (st.phase === "over") counts[key].ended++;
    } catch (e) { errors++; console.log("ERROR", key, seed, e.message); }
  }
  const c = counts[key], sides = 2 * Math.max(N, 1);
  ok(c.legal === sides && c.full === sides, `bot minimum ${key}: legal ${c.legal}/${sides}, full cap ${c.full}/${sides}`);
  ok(c.ended === c.games, `bot minimum ${key}: ${c.ended}/${c.games} matches played to their end`);
}
console.log("Bot minimum (lineups legal / full / matches ended):");
for (const k in counts) console.log(`  ${k}: ${counts[k].legal}/${2 * Math.max(N, 1)} legal, ${counts[k].full} full, ${counts[k].ended}/${counts[k].games} ended`);
if (process.argv.includes("--table")) { console.log("Rule set | Format | Squad rule | Lineup | Result | Reason"); for (const r of table) console.log(r.join(" | ")); }
console.log(`${n} squad checks, ${fails} failures (${table.length} table rows, ${games} games, ${errors} errors)`);
process.exit(fails || errors ? 1 : 0);
