// Brief 018's screenshots (Approved UI v4): views, the spin, zoom, the field buttons, the match log, desktop.
// node sims/shots_018.js [outDir]   (needs Playwright with Chromium; writes PNGs to briefs/img/018/ by default)
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const board = path.join(__dirname, "..", "board", "index.html");
const out = path.resolve(process.argv[2] || path.join(__dirname, "..", "briefs", "img", "018"));
fs.mkdirSync(out, { recursive: true });

// In the page: a match on the newest preset played by Brain 5 from a seed, shown as a hot-seat (or bot) game.
function setup(arg) {
  const G = window.GGShots, { App, E, D } = G, Bot = window.GGBot, BR = window.GGBrain;
  const rs = JSON.parse(JSON.stringify(D.PRESETS[D.PRESETS.length - 1]));
  const codes = arg.size === 13 ? ["HM", "HM", "HM", "LM", "LM", "HR", "HR", "LR", "LR", "HA", "HA", "LA", "LA"] : ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];
  const cnt = {}; const L = codes.map((c) => { cnt[c] = (cnt[c] || 0) + 1; return { id: cnt[c] === 1 ? c : c + cnt[c], card: c, fk: false }; });
  App.match = { id: "s", started: new Date().toISOString(), rs, view: arg.view || "handoff",
    opts: { first: "N", players: { N: { type: "human" }, S: arg.bot ? { type: "bot", brainId: "brain5" } : { type: "human" } }, names: { N: "North", S: "South" }, lineups: { N: L, S: L }, seed: arg.seed || "shots", format: arg.size === 13 ? "s13" : "std7" },
    brains: arg.bot ? { S: BR.DEFAULT_BRAINS.brain5 } : {}, actions: [], draws: 0 };
  G.rebuild();
  const st = App.st, B = BR.DEFAULT_BRAINS.brain5, rnd = E.seededRandom(arg.seed || "shots");
  for (const t of ["N", "S"]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
  let k = 0;
  while (st.phase === "play" && (st.turn < (arg.turns || 1) || (st.turn === (arg.turns || 1) && st.toMove === "N" && arg.toS)) && k++ < 4000) {
    const a = Bot.chooseAction(st, B, rnd).action; const r = E.act(st, a, () => E.rollWith(st, rnd)); if (!r.ok) E.act(st, { type: "end" });
  }
  App.match.actions = JSON.parse(JSON.stringify(st.actions));
  G.rebuild(); G.resetUi(); G.show("play");
}
// A set spear on a move: South's braced Heavy Anti-Cavalry, a North unit walks in next to it (positions set by hand).
function spear() {
  const G = window.GGShots, { App, E } = G, st = App.st, Gd = E.fieldOf(st);
  const ha = E.unitByUid(st, "S-HA"), lm = E.unitByUid(st, "N-LM");
  const free = (h) => h && !E.alive(st).some((u) => u.hex === h) && !Gd.onFlag(h);
  const hh = "E10"; if (free(hh) || ha.hex === hh) ha.hex = hh;
  const nb = Gd.NBRS[ha.hex].filter(free);
  const dst = nb[0], from = Gd.NBRS[dst].find((h) => free(h) && Gd.dist(h, ha.hex) === 2);
  lm.hex = from; ha.braced = true; ha.spikeUsed = false;
  G.act({ type: "move", uid: lm.uid, to: dst });
}
const shot = async (page, name) => { await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name + ".png") }); console.log(name); };
const logTo = async (page, pred) => page.evaluate((src) => {
  const G = window.GGShots; G.App.ui.logOpen = true; G.render();
  const f = new Function("e", "return " + src), ev = G.App.st.events.find((e) => e.unit && f(e));
  const el = document.getElementById("logview");
  if (ev) { const row = el.querySelector(`.lg-row[data-i="${ev.i}"]`); if (row) el.scrollTop = row.offsetTop - 140; }
  return ev ? ev.i : null;
}, pred);

(async () => {
  const browser = await chromium.launch();
  for (const [W, Hh] of [[390, 844], [393, 665]]) {
    const page = await browser.newPage({ viewport: { width: W, height: Hh }, deviceScaleFactor: 2 });
    await page.goto("file://" + board + "?shots=1");
    await page.waitForFunction(() => window.GGShots && window.GGShots.App);
    const sz = `${W}x${Hh}`;
    const go = (arg) => page.evaluate(setup, arg);
    for (const view of ["handoff", "flip", "table"]) for (const toS of [false, true]) { await go({ view, turns: 3, toS }); await shot(page, `${sz}-view-${view}-${toS ? "south" : "north"}`); }
    // View 2 mid-spin, about 200 ms in
    await go({ view: "flip", turns: 3 });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.GGShots.act({ type: "end" }));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, `${sz}-view-flip-spin-200ms.png`) }); console.log("spin");
    // Zoom: far, close, minimum; hex names off and on
    for (const size of [7, 13]) for (const names of [false, true]) for (const z of ["far", "close", "min"]) {
      await go({ view: "handoff", size, turns: size === 7 ? 3 : 1 });
      await page.evaluate(([names, z]) => { const G = window.GGShots; G.App.ui.names = names; G.App.ui.zoom = z === "far" ? null : z === "close" ? 1 : 0.01; G.render(); }, [names, z]);
      await shot(page, `${sz}-zoom-${size}v${size}-${z}-names-${names ? "on" : "off"}`);
    }
    // The match log: a game with Parry, a holder hit, units out and a special that hits two units (seed hunt15)
    await go({ view: "handoff", seed: "hunt15", turns: 8, toS: true });
    await shot(page, `${sz}-log-button-north`);
    await page.evaluate(() => window.GGShots.act({ type: "end" }));
    await page.waitForTimeout(300);
    await shot(page, `${sz}-log-button-south`);
    await logTo(page, "false"); await page.evaluate(() => (document.getElementById("logview").scrollTop = 0));
    await shot(page, `${sz}-log-top`);
    await logTo(page, "!!e.parry"); await shot(page, `${sz}-log-parry`);
    await logTo(page, "e.targets && e.targets.some((t) => t.holder)"); await shot(page, `${sz}-log-holder`);
    await logTo(page, "e.targets && e.targets.some((t) => t.removed)"); await shot(page, `${sz}-log-removed`);
    await logTo(page, "e.action === 'special' && e.targets && e.targets.length === 1"); await shot(page, `${sz}-log-special-one`);
    await logTo(page, "e.action === 'special' && e.targets && e.targets.length > 1"); await shot(page, `${sz}-log-special-several`);
    const i = await logTo(page, "e.action === 'attack' && e.parts && e.parts.length > 2");
    await page.evaluate((i) => { const b = document.querySelector(`#logview .lg-row[data-i="${i}"]`); if (b) b.click(); }, i);
    await shot(page, `${sz}-log-row-open`);
    await go({ view: "handoff", turns: 2 }); await page.evaluate(spear);
    await logTo(page, "!!e.spear"); await shot(page, `${sz}-log-set-spear`);
    await page.close();
  }
  // Desktop
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await page.goto("file://" + board + "?shots=1");
  await page.waitForFunction(() => window.GGShots && window.GGShots.App);
  await page.evaluate(setup, { view: "handoff", seed: "hunt15", turns: 8, toS: true });
  await page.evaluate(() => { window.GGShots.act({ type: "end" }); });
  await shot(page, "1280x800-hot-seat-tag-and-field-buttons");
  await page.evaluate(() => { const s = document.getElementById("side"); s.scrollTop = s.scrollHeight; });
  await shot(page, "1280x800-recent-match-log");
  await browser.close();
})();
