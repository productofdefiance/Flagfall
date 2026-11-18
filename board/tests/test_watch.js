// Watch checks (Brief 008): watch links, the board's lineups and seeded matches. node tests/test_watch.js
// The browser half (10 simulated games and the same games opened on the board, identical moves) is
// sims/lab/board_check.js; it needs Playwright, so it runs in its own job.
const path = require("path");
const W = require("../watch.js"), E = require("../engine.js"), D = require("../data.js"), BR = require("../brain.js");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };

// 1. The lineups a bot side gets are exactly what the board gave before Brief 008 moved them into watch.js
//    (fixtures recorded from the previous app.js: every rule set, both formats, every mix, three brains).
const before = require("./lineups_before_008.json");
let diff = 0;
for (const key in before) {
  const [rsId, size, mix, brainId] = key.split("|");
  const rs = W.rulesById(rsId);
  const now = W.toLineup(rs, W.mixCounts(rs, +size, mix, "ABCD-EFGH-JKLM", "N", BR.DEFAULT_BRAINS[brainId])).map((x) => x.id + ":" + x.card + (x.fk ? "*" : "")).join(" ");
  if (now !== before[key]) { diff++; if (diff < 4) console.log("  differs:", key, now, "was", before[key]); }
}
ok(diff === 0, `bot lineups unchanged for ${Object.keys(before).length} setups (${diff} differ)`);

// 2. A seeded match plays the same every time, and the board's random stream is the same formula as before
//    (draw n of a seed is seededRandom(seed + "#" + n)).
const spec = { seed: "TJBH-QBDJ-395W", rules: "v3.4", format: "blitz5", n: "brain5", s: "standard", mixN: "mixed", mixS: "light", first: "coin" };
const a = W.playOut(spec), b = W.playOut(spec);
ok(W.actionsHash(a.st.actions) === W.actionsHash(b.st.actions), "the same seed plays the same game twice");
const m = { opts: { seed: "TJBH-QBDJ-395W" }, draws: 0 }, r = W.matchRand(m);
ok(r() === E.seededRandom("TJBH-QBDJ-395W#0")() && r() === E.seededRandom("TJBH-QBDJ-395W#1")() && m.draws === 2, "the match stream is draw n of seed#n, as the board's");
// A known game, pinned: if this hash moves, a brain, a rule or the board's set-up changed for seeded matches.
const PIN = "4748ae76";
const got = W.actionsHash(a.st.actions).split(":")[0];
console.log(`  pinned game ${spec.seed}: ${W.actionsHash(a.st.actions)} (${a.st.result.how})`);
ok(got === PIN, `pinned seeded game unchanged (got ${got}, want ${PIN})`);

// 3. Watch links: round trip, and plain words when this board can't play one exactly
const q = W.toQuery(Object.assign({ v: "v3.05.01" }, spec));
ok(JSON.stringify(W.fromQuery(q)) === JSON.stringify(W.fromQuery(W.toQuery(W.fromQuery(q)))) && W.fromQuery(q).seed === spec.seed && W.fromQuery(q).v === "v3.05.01" && W.fromQuery(q).mixS === "light", "a watch link reads back as the same setup: " + q);
ok(W.fromQuery("?seed=x") === null, "a page without ?watch= isn't a watch link");
ok(W.problem(spec) === null, "a setup this board has is playable");
ok(/brain "brain99" is not on this board/.test(W.problem(Object.assign({}, spec, { n: "brain99" }))), "a missing brain is named");
ok(/Rule set v9 is not on this board/.test(W.problem(Object.assign({}, spec, { rules: "v9" }))), "a missing rule set is named");
ok(/not playable/.test(W.problem(Object.assign({}, spec, { format: "s9" }))), "a format that isn't playable yet is named");

// 4. Board seeds dealt by tests/rng.js look like the board's own
const rnd = require("./rng.js")("watch-test", 0), s1 = W.seedFrom(rnd);
ok(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(s1), "a dealt seed has the board's form: " + s1);
ok(W.seedFrom(require("./rng.js")("watch-test", 0)) === s1, "the same stream deals the same seed");

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
