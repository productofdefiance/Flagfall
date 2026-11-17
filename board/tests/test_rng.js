// The simulators' shared generator (tests/rng.js) must not loop and must roll fair dice; the active
// simulators must use it. node tests/test_rng.js
const fs = require("fs"), path = require("path");
const rng = require("./rng.js"); let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
{ // A loop shows up as the opening run of draws coming round again (a single repeated value is just a 32-bit coincidence).
  const r = rng("check", 1), head = Array.from({ length: 8 }, r); let loop = -1, w = head.slice();
  for (let i = 8; i < 3e6; i++) { w.shift(); w.push(r()); if (w[0] === head[0] && w.every((v, k) => v === head[k])) { loop = i; break; } }
  ok(loop < 0, "the stream does not loop within 3,000,000 draws (looped at " + loop + "; the old formula looped at 10,466)"); }
{ const r = rng("dice", 2), c = Array(13).fill(0), N = 600000;
  for (let i = 0; i < N; i++) c[2 + Math.floor(r() * 6) + Math.floor(r() * 6)]++;
  const want = [0, 0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((k) => k / 36);
  const worst = Math.max(...c.map((x, i) => (i < 2 ? 0 : Math.abs(x / N - want[i]))));
  ok(worst < 0.002, "2d6 within 0.2 points of true odds (worst " + (100 * worst).toFixed(3) + ")"); }
ok(rng("a", 1)() === rng("a", 1)() && rng("a", 1)() !== rng("a", 2)(), "same name and offset repeat; a new offset changes the stream");
const lcg = /1103515245/;
for (const f of ["sim_games.js", "h2h_v3.js", "h2h_lineup.js", "flagdiag.js"])
  ok(!lcg.test(fs.readFileSync(path.join(__dirname, f), "utf8")), f + " uses the shared generator");
console.log(`${n} checks, ${fails} failures`); process.exit(fails ? 1 : 0);
