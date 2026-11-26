// Brief 029's screenshots (Approved UI v7): the end sheet, the rematch sheet in its three pictured states, the Lineup
// screen with Reset, desktop, and the New game bug before and after.
// node sims/shots_029.js [old board folder]   (needs Playwright with Chromium; writes PNGs to briefs/img/029/build/)
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const boardDir = path.join(__dirname, "..", "board");
const oldBoard = process.argv[2] ? path.resolve(process.argv[2]) : null;
const out = path.join(__dirname, "..", "briefs", "img", "029", "build");
fs.mkdirSync(out, { recursive: true });

function begin(arg) {
  const G = window.GGShots, { App, D } = G, W = window.GGWatch;
  const rsId = D.PRESETS[D.PRESETS.length - 1].id;
  for (const id in App.brains) if (App.brains[id].settings) App.brains[id].settings.pauseMs = 0;
  const pl = (t) => (arg[t] === "bot" ? { type: "bot", brainId: "brain8", name: t === "N" ? "North" : "South", mix: "open" } : { type: "human", name: (arg.names || {})[t] || (t === "N" ? "North" : "South"), mix: "open" });
  App.setup = { format: arg.format || "std7", rulesetId: rsId, first: arg.first || "N", seed: arg.seed || "K7QM-2WTB-HF9C", players: { N: pl("N"), S: pl("S") } };
  const rs = App.rulesets[rsId], size = W.formatOf(App.setup.format).size;
  App.picks = {}; for (const t of ["N", "S"]) if (arg[t] !== "bot") App.picks[t] = W.balancedCounts(rs, size);
  App.lineupQueue = ["N", "S"].filter((t) => arg[t] !== "bot");
  G.startMatch();
  document.getElementById("cover").hidden = true; App.ui.cover = null;
}
function finish(k) {
  const G = window.GGShots, { App, E } = G, Bot = window.GGBot, B = window.GGBrain.DEFAULT_BRAINS.brain5, rnd = E.seededRandom("shots");
  for (const t of [App.st.first, App.st.first === "N" ? "S" : "N"]) if (App.st.phase === "deploy" && !App.st.deployed[t]) G.act({ type: "deploy", team: t, placements: Bot.deploy(App.st, t, B, rnd) });
  for (let i = 0; i < (k || 0) && App.st.phase === "play"; i++) { const r = G.act(Bot.chooseAction(App.st, B, rnd).action); if (!r.ok) G.act({ type: "end" }); }
  if (App.st.phase === "play") G.act({ type: "surrender", team: App.st.toMove });
  document.getElementById("cover").hidden = true; App.ui.cover = null;
}
const click = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel);

(async () => {
  const browser = await chromium.launch();
  const shoot = async (page, name, opts) => { await page.waitForTimeout(250); await page.screenshot(Object.assign({ path: path.join(out, name) }, opts || {})); console.log(name); };
  const open = async (dir, vp) => {
    const page = await browser.newPage({ viewport: vp || { width: 393, height: 665 }, deviceScaleFactor: 2, hasTouch: !vp });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("file://" + path.join(dir, "index.html") + "?shots=1");
    await page.waitForFunction(() => window.GGShots && document.querySelector('[data-act="new"]'));
    await page.evaluate(() => localStorage.clear());
    await page.reload(); await page.waitForFunction(() => window.GGShots && document.querySelector('[data-act="new"]')); await page.waitForTimeout(200);
    return page;
  };

  // Human vs bot, chosen first: end, rematch (same), rematch (swap + new dice)
  let page = await open(boardDir);
  await page.evaluate(begin, { N: "human", S: "bot", names: { N: "You" } });
  await page.evaluate(finish, 0);
  await shoot(page, "01-end.png");
  await click(page, '#sheet [data-act="rematch"]'); await shoot(page, "02-rematch-same.png");
  await click(page, '[data-k="sides"][data-v="0"]'); await click(page, '[data-k="dice"][data-v="0"]'); await shoot(page, "03-rematch-swap-newdice.png");
  // Lineup with Reset (the whole scrolled screen)
  await click(page, '[data-k="sides"][data-v="1"]'); await click(page, '[data-k="lineups"][data-v="0"]'); await click(page, '[data-act="rm-go"]');
  await page.setViewportSize({ width: 393, height: 1010 }); await shoot(page, "05-lineup-reset.png");
  await click(page, '[data-act="lineup-reset"]'); await shoot(page, "05b-lineup-after-reset.png");
  await page.close();

  // Coin-toss match: Same lineups No (picks again), coin help lines
  page = await open(boardDir);
  await page.evaluate(begin, { N: "human", S: "bot", names: { N: "You" }, first: "coin" });
  await page.evaluate(finish, 0);
  await click(page, '#sheet [data-act="rematch"]'); await click(page, '[data-k="lineups"][data-v="0"]');
  await shoot(page, "04-rematch-repick-coin.png");
  await page.close();

  // Desktop
  page = await open(boardDir, { width: 1280, height: 800 });
  await page.evaluate(begin, { N: "human", S: "bot", names: { N: "You" } });
  await page.evaluate(finish, 0);
  await shoot(page, "06-desktop-end.png");
  await click(page, '#sheet [data-act="rematch"]'); await shoot(page, "07-desktop-rematch.png");
  await page.close();

  // The bug: Continue after a reload, finish, New game. Before (old board) and after (this build).
  for (const [dir, name] of [[oldBoard, "08-bug-before.png"], [boardDir, "09-bug-after.png"]]) {
    if (!dir) continue;
    page = await open(dir);
    await page.evaluate(begin, { N: "human", S: "human", names: { N: "Ann", S: "Bo" } });
    await page.evaluate(() => { const G = window.GGShots, Bot = window.GGBot, B = window.GGBrain.DEFAULT_BRAINS.brain5, rnd = G.E.seededRandom("b"); for (const t of ["N", "S"]) G.act({ type: "deploy", team: t, placements: Bot.deploy(G.App.st, t, B, rnd) }); });
    await page.reload(); await page.waitForFunction(() => window.GGShots && document.querySelector('[data-act="continue"]'));
    await click(page, '[data-act="continue"]');
    await page.evaluate(() => { const G = window.GGShots; G.act({ type: "surrender", team: G.App.st.toMove }); document.getElementById("cover").hidden = true; });
    await page.waitForTimeout(150);
    await click(page, '#sheet [data-act="new"]');
    await shoot(page, name);
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
