const E = require("../board/engine.js");
// (a) The simulators' home-made generator: seed = (seed*1103515245+12345) % 2^31 in JS doubles
function lcg(seed0) { let seed = seed0; return { next() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; } }; }
for (const s0 of [4242, 7777, 4242 + 7919, 7777 + 3 * 7919]) {
  const g = lcg(s0); const seen = new Map(); let i = 0, v;
  while (i < 5e6) { v = g.next(); if (seen.has(v)) break; seen.set(v, i); i++; }
  const exact = (() => { let s = BigInt(s0); let bad = 0; const g2 = lcg(s0); for (let k = 0; k < 2000; k++) { s = (s * 1103515245n + 12345n) % 2147483648n; if (BigInt(g2.next()) !== s) bad++; } return bad; })();
  console.log(`LCG seed ${s0}: ${i < 5e6 ? `repeats after ${i} draws (cycle length ${i - seen.get(v)})` : "no repeat in 5,000,000 draws"}; differs from the true integer LCG on ${exact} of the first 2000 draws`);
}
// distribution of 2d6 from that LCG
{ const g = lcg(4242); const c = Array(13).fill(0); const N = 600000; for (let i = 0; i < N; i++) { const a = 1 + Math.floor(g.next() / 2147483648 * 6), b = 1 + Math.floor(g.next() / 2147483648 * 6); c[a + b]++; }
  console.log("LCG 2d6 share  2:", (100 * c[2] / N).toFixed(2), " 3:", (100 * c[3] / N).toFixed(2), " 11:", (100 * c[11] / N).toFixed(2), " 12:", (100 * c[12] / N).toFixed(2), "(true 2.78 / 5.56 / 5.56 / 2.78)"); }
// (b) The board's per-draw generator: seededRandom(seed + '#' + n)()
{ const seed = "ABCD-EFGH-JKLM"; const c = Array(13).fill(0); const N = 300000; let n = 0; let same = 0, prev = 0;
  for (let i = 0; i < N; i++) { const a = 1 + Math.floor(E.seededRandom(seed + "#" + n++)() * 6), b = 1 + Math.floor(E.seededRandom(seed + "#" + n++)() * 6); c[a + b]++; if (a === b) same++; }
  console.log("board 2d6 share 2:", (100 * c[2] / N).toFixed(2), " 3:", (100 * c[3] / N).toFixed(2), " 7:", (100 * c[7] / N).toFixed(2), " 11:", (100 * c[11] / N).toFixed(2), " 12:", (100 * c[12] / N).toFixed(2), " doubles:", (100 * same / N).toFixed(2), "(true 2.78/5.56/16.67/5.56/2.78, doubles 16.67)"); }
