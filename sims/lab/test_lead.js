// @test job=rules quick=yes release=yes night=no
// Brief 019's three measures (lead, alone) checked on saved games: five balanced Brain 5 mirror games from the stall
// "before" run (results/v3.08.01/2026-11-19_study_stall-before, v3.5, 5v5), each replayed from its watch link. Every
// expected value below was checked by hand against a turn-by-turn trace (each side-turn's non-holder units, which units
// stood alone, every attack and removal); the Report of brief 019 walks through them.
// node sims/lab/test_lead.js
"use strict";
const path = require("path"), board = path.join(__dirname, "..", "..", "board");
const W = require(path.join(board, "watch.js")), E = require(path.join(board, "engine.js")), Bot = require(path.join(board, "bot.js"));
const { MEASURES, ALWAYS } = require("./measures.js");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } else console.log("  ok:", m); };
const Q = "&v=v3.08.01&rules=v3.5&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N";
const GAMES = [
  // game 80: North leads by 1 from turn 5 for nine side-turns, loses its Anti-Cavalry on turn 9, draws on the turn limit.
  { seed: "SNBC-HA7D-P2XX", why: "a lead lost (North, peak 1, from turn 5); no holder strikes",
    want: { lead_lost: 1, lead_lost_side: "N", lead_lost_peak: 1, lead_lost_first_turn: 5, lead_unused: 0, lost_alone_n: 1, lost_alone_s: 1, lost_together_n: 2, lost_together_s: 2, holder_strikes_solo_n: 0, holder_strikes_solo_s: 0, holder_strikes_group_n: 0, holder_strikes_group_s: 0 } },
  // game 20: North leads by 1 for only three side-turn starts (turn 4 South to turn 5 South), then falls behind: too
  // short to count. Level at turn limit - 3; nobody attacks a holder.
  { seed: "GE7N-KUHS-LT7T", why: "a short lead that doesn't count; turn limit, level at limit - 3; no holder strikes",
    want: { lead_lost: 0, lead_unused: 0, lost_alone_n: 2, lost_alone_s: 1, lost_together_n: 1, lost_together_s: 2, holder_strikes_solo_n: 0, holder_strikes_solo_s: 0, holder_strikes_group_n: 0, holder_strikes_group_s: 0 } },
  // game 260: North 3 units to 0 from turn 11 and loses on flag damage (South's Anti-Cavalry hits North's holder alone
  // on turns 8, 9 and 10): a lead unused, not lost (North ends ahead on units).
  { seed: "Y2D8-BCEV-BURS", why: "a lead unused (North, 3 up at turn limit - 3), not lost; three solo holder strikes",
    want: { lead_lost: 0, lead_unused: 1, lead_unused_side: "N", lost_alone_n: 0, lost_alone_s: 2, lost_together_n: 1, lost_together_s: 2, holder_strikes_solo_n: 0, holder_strikes_solo_s: 3, holder_strikes_group_n: 0, holder_strikes_group_s: 0 } },
  // game 140: North strikes South's holder with three units on turn 9 and two on turn 10, then wins by KO.
  { seed: "7ZCW-MZCD-L7RQ", why: "group holder strikes (North, 2 side-turns); the leader wins, so no lead lost",
    want: { lead_lost: 0, lead_unused: 0, lost_alone_n: 0, lost_alone_s: 1, lost_together_n: 2, lost_together_s: 2, holder_strikes_solo_n: 0, holder_strikes_solo_s: 0, holder_strikes_group_n: 2, holder_strikes_group_s: 0 } },
  // game 660: every removed unit had a friend within 2 hexes; South strikes North's holder alone once, together twice.
  { seed: "NCD5-9EMV-VZRP", why: "no unit lost alone; solo and group holder strikes",
    want: { lead_lost: 0, lead_unused: 0, lost_alone_n: 0, lost_alone_s: 0, lost_together_n: 3, lost_together_s: 1, holder_strikes_solo_n: 0, holder_strikes_solo_s: 1, holder_strikes_group_n: 0, holder_strikes_group_s: 2 } }
];
ok(ALWAYS.includes("lead") && ALWAYS.includes("alone"), "lead and alone are collected on every run");
for (const g of GAMES) {
  const spec = W.fromQuery("?watch=" + g.seed + Q), ctx = { E, Bot, aTeam: "N", brains: {} };
  const ms = ["lead", "alone"].map((k) => MEASURES[k].make(ctx));
  const { st } = W.playOut(spec, { before: (s, c, t) => ms.forEach((x) => x.before && x.before(s, c, t)), after: (s, c, r) => ms.forEach((x) => x.after && x.after(s, c, r)) });
  const got = Object.assign({}, ...ms.map((x) => x.end(st)));
  const bad = Object.keys(g.want).filter((k) => got[k] !== g.want[k]);
  ok(!bad.length, `${g.seed}: ${g.why}${bad.length ? " (differs: " + bad.map((k) => `${k} ${got[k]} want ${g.want[k]}`).join(", ") + ")" : ""}`);
}
console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
