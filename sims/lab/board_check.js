// @test job=board quick=10 release=10 night=no browser
// Board check (Brief 008): N simulated games and the same N games opened on the board from their watch links must
// play identical moves (same hash). node sims/lab/board_check.js [games, default 10] [board folder, default ../../board]
// Needs Playwright with Chromium (pre-installed in Claude sessions; `npx playwright install chromium` elsewhere).
const path = require("path");
const games = +(process.argv[2] || 10), boardDir = path.resolve(process.argv[3] || path.join(__dirname, "..", "..", "board"));
const W = require(path.join(boardDir, "watch.js")), V = require(path.join(boardDir, "version.js"));
const rnd = require(path.join(boardDir, "tests", "rng.js"))("board_check", 0);
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  let fails = 0;
  // Mixed formats, lineups and brains, all fast: Standard and Brain 5 at 5v5, and one 7v7.
  const plan = Array.from({ length: games }, (_, i) => ({
    seed: W.seedFrom(rnd), v: V.game || null, rules: "v3.4", format: i % 5 === 4 ? "std7" : "blitz5",
    n: i % 3 === 0 ? "standard" : "brain5", s: i % 2 ? "standard" : "brain5", mixN: i % 4 === 1 ? "light" : "mixed", mixS: i % 4 === 2 ? "light" : "mixed", first: i % 3 === 2 ? "S" : "coin" }));
  for (const spec of plan) {
    const sim = W.playOut(spec), want = W.actionsHash(sim.st.actions);
    const page = await browser.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("file://" + path.join(boardDir, "index.html") + W.toQuery(spec) + "&fast=1");
    let got = null, res = null;
    try {
      await page.waitForFunction(() => window.GGWatchState && window.GGWatchState().over, null, { timeout: 600000, polling: 500 });
      const s = await page.evaluate(() => window.GGWatchState());
      got = W.actionsHash(s.actions); res = s.result;
    } catch (e) { errors.push(e.message); }
    const same = got === want && JSON.stringify(res) === JSON.stringify(sim.st.result);
    if (!same) fails++;
    console.log(`${same ? "same" : "DIFFERENT"}  ${spec.seed} ${spec.format} ${spec.n} v ${spec.s} (${spec.mixN}/${spec.mixS}, first ${spec.first}): sim ${want} ${sim.st.result && sim.st.result.how} | board ${got} ${res && res.how}${errors.length ? " | errors: " + errors.join("; ") : ""}`);
    await page.close();
  }
  await browser.close();
  console.log(`${games} games, ${fails} different`);
  process.exit(fails ? 1 : 0);
})();
