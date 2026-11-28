// @test job=board quick=yes release=yes night=no browser
// Rematch, a clean New game after the end, and Reset on the Lineup screen (Brief 029, Approved UI v7), in a headless
// browser at 393 × 665.
// - the bug: a match continued after a reload, then finished: New game asks nothing, Matches keeps the result (not
//   Abandoned), Home offers no Continue. Fails on the board before Brief 029: `node tests/test_rematch.js <old board> bug`;
// - the end sheet: New game full width on top; See field · Copy record · Rematch under it; no label wraps;
// - the rematch sheet: three rows, help lines on one line, the switches in one column, every state; Same dice: No
//   shows one new seed kept while the sheet is open;
// - Same dice: Yes, two bots, same lineups and sides: the rematch plays the same game (same actions, same result);
// - a coin-toss rematch: a new toss, and draw 0 is still taken so every later roll keeps its draw number;
// - Same sides: No: each team's lineup, brain and name on the other end, opts.first unchanged;
// - Same lineups: No: the Lineup screen starts from the lineup played, Reset clears the units (Flagkeeper kept), the top
//   arrow brings back the rematch sheet as left; the bot redraws from its mix; the lineup is saved like any lineup.
// node tests/test_rematch.js [board folder] [bug]   (needs Playwright with Chromium)
const path = require("path");
const { chromium } = require("playwright");
const boardDir = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const onlyBug = process.argv[3] === "bug";
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };

// In the page: Settings for a new match (both sides as asked), then startMatch() as the Teams/Lineup screens would.
function begin(arg) {
  const G = window.GGShots, { App, E, D } = G;
  const rsId = D.PRESETS[D.PRESETS.length - 1].id;
  for (const id in App.brains) App.brains[id] = Object.assign(JSON.parse(JSON.stringify(App.brains[id])), {});
  for (const id in App.brains) if (App.brains[id].settings) App.brains[id].settings.pauseMs = 0;
  const pl = (t) => (arg[t] === "bot" ? { type: "bot", brainId: arg.brain || "brain8", name: t === "N" ? "North" : "South", mix: arg.mix || "open" } : { type: "human", name: arg.names ? arg.names[t] : (t === "N" ? "North" : "South"), mix: "open" });
  App.setup = { format: arg.format || "blitz5", rulesetId: rsId, first: arg.first || "N", seed: arg.seed || "TEST-SEED-0001", players: { N: pl("N"), S: pl("S") } };
  const W = window.GGWatch, rs = App.rulesets[rsId], size = W.formatOf(App.setup.format).size;
  App.picks = {};
  for (const t of ["N", "S"]) if (arg[t] !== "bot") App.picks[t] = W.balancedCounts(rs, size);
  App.lineupQueue = ["N", "S"].filter((t) => arg[t] !== "bot");
  G.startMatch();
  document.getElementById("cover").hidden = true; App.ui.cover = null;
  return App.match.id;
}
// Deploy every human side the way the bot would, then play `k` actions for whoever moves (humans by Brain 5 too).
function playHumans(k) {
  const G = window.GGShots, { App, E } = G, Bot = window.GGBot, BR = window.GGBrain, B = BR.DEFAULT_BRAINS.brain5;
  const rnd = E.seededRandom("humans");
  for (const t of [App.st.first, App.st.first === "N" ? "S" : "N"]) if (App.st.phase === "deploy" && !App.st.deployed[t]) G.act({ type: "deploy", team: t, placements: Bot.deploy(App.st, t, B, rnd) });
  for (let i = 0; i < k && App.st.phase === "play"; i++) { const r = G.act(Bot.chooseAction(App.st, B, rnd).action); if (!r.ok) G.act({ type: "end" }); }
  document.getElementById("cover").hidden = true; App.ui.cover = null;
  return App.st.phase;
}
const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b) throw new Error("no " + s); b.click(); }, sel);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 393, height: 665 }, hasTouch: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  const url = "file://" + path.join(boardDir, "index.html") + "?shots=1";
  const load = async () => { await page.goto(url); await page.waitForFunction(() => window.GGShots && window.GGShots.App && document.querySelector('[data-act="new"]')); await page.waitForTimeout(150); };
  await load();
  await page.evaluate(() => localStorage.clear());
  await load();

  // ---- The bug: Continue after a reload, finish, New game ----
  {
    const id = await page.evaluate(begin, { N: "human", S: "human", names: { N: "Ann", S: "Bo" } });
    await page.evaluate(playHumans, 6);
    await page.reload(); await page.waitForFunction(() => window.GGShots && document.querySelector('[data-act="continue"]'), null, { timeout: 10000 });
    await click(page, '[data-act="continue"]');
    await page.waitForTimeout(100);
    await page.evaluate(() => { const G = window.GGShots; G.act({ type: "move", uid: "x", to: "x" }); });   // refused: nothing changes
    await page.evaluate(playHumans, 4);
    await page.evaluate(() => { const G = window.GGShots, st = G.App.st; G.act({ type: "surrender", team: st.toMove }); });
    ok(await page.evaluate(() => window.GGShots.App.st.phase === "over"), "bug: the match ended");
    await page.waitForTimeout(150);
    await click(page, '#sheet [data-act="new"]');
    await page.waitForTimeout(200);
    const asked = await page.evaluate(() => !document.getElementById("dialog").hidden);
    ok(!asked, "bug: New game after a finished, continued-after-reload match asks nothing");
    if (asked) await click(page, '#dialog [data-dlg="ok"]');   // the old board: say yes, to show what it re-filed
    await page.waitForTimeout(200);
    const how = await page.evaluate((i) => ((JSON.parse(localStorage.getItem("gg.matches") || "{}"))[i] || {}).how, id);
    ok(how && how !== "abandoned", `bug: Matches still shows the result (got ${how})`);
    await page.evaluate(() => window.GGShots.show("home"));
    ok(await page.evaluate(() => !document.querySelector('#view-home [data-act="continue"]')), "bug: Home shows no Continue for the finished match");
    await page.reload(); await page.waitForFunction(() => window.GGShots && document.querySelector('[data-act="new"]')); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !document.querySelector('#view-home [data-act="continue"]')), "bug: no Continue after another reload either");
    ok(await page.evaluate(() => localStorage.getItem("gg.live") === "null"), "bug: the saved live match is cleared");
  }
  if (onlyBug) { await browser.close(); console.log(`${n - fails}/${n} passed`); if (errors.length) console.log("Page errors:", errors); process.exit(fails ? 1 : 0); }

  // ---- Bug, second path: Continue in the same session keeps one match in memory ----
  {
    await page.evaluate(begin, { N: "human", S: "human" });
    await page.evaluate(playHumans, 3);
    await page.evaluate(() => { const G = window.GGShots; G.App.live = JSON.parse(JSON.stringify(G.App.live)); G.App.match = null; G.App.st = null; G.show("home"); });
    await click(page, '[data-act="continue"]');
    ok(await page.evaluate(() => window.GGShots.App.live === window.GGShots.App.match), "Continue: the live match is the match played");
    const id = await page.evaluate(() => window.GGShots.App.match.id);
    await page.evaluate(() => { const G = window.GGShots; G.act({ type: "surrender", team: G.App.st.toMove }); });
    await page.waitForTimeout(100);
    await click(page, '#sheet [data-act="new"]'); await page.waitForTimeout(150);
    ok(await page.evaluate(() => document.getElementById("dialog").hidden), "Continue: New game after the end asks nothing");
    ok(await page.evaluate((i) => JSON.parse(localStorage.getItem("gg.matches"))[i].how !== "abandoned", id), "Continue: the result stays");
  }

  // ---- End sheet and rematch sheet, human vs bot ----
  const noWrap = () => {
    const bad = [];
    for (const el of document.querySelectorAll("#sheet .btn, #sheet .rm-h, #sheet .rm-n, #sheet .rm-seg button, #sheet .rm-code")) {
      const r = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight) || 18;
      if (el.scrollWidth > el.clientWidth + 1) bad.push("clips: " + el.textContent.trim());
      if (!el.matches(".btn, .rm-seg button, .rm-code") && r.height > lh * 1.6) bad.push("wraps: " + el.textContent.trim());
      if (el.matches(".btn") && el.getClientRects().length && r.height > 60) bad.push("wraps: " + el.textContent.trim());
    }
    return bad;
  };
  {
    await page.evaluate(begin, { N: "human", S: "bot", names: { N: "Sixteen letters!", S: "South" } });
    await page.evaluate(playHumans, 0);
    await page.evaluate(() => { const G = window.GGShots; if (G.App.st.phase === "play") G.act({ type: "surrender", team: "N" }); });
    await page.waitForFunction(() => window.GGShots.App.st.phase === "over");
    await page.waitForTimeout(150);
    const end = await page.evaluate(() => {
      const s = document.getElementById("sheet"), ng = s.querySelector('[data-act="new"]'), row = [...s.querySelectorAll(".end-row .btn")];
      const r = ng.getBoundingClientRect();
      return { labels: row.map((b) => b.textContent), ngW: r.width, ngH: r.height, sheetW: s.clientWidth, rowY: row.map((b) => Math.round(b.getBoundingClientRect().top)), below: row[0].getBoundingClientRect().top - r.bottom };
    });
    ok(end.labels.join("|") === "See field|Copy record|Rematch", "end sheet: See field · Copy record · Rematch: " + end.labels.join("|"));
    ok(Math.abs(end.ngH - 48) < 1 && end.ngW > end.sheetW - 40, `end sheet: New game full width, 48 px (${end.ngW}×${end.ngH})`);
    ok(new Set(end.rowY).size === 1 && Math.abs(end.below - 8) < 1.5, `end sheet: one row 8 px under New game (${end.below})`);
    ok((await page.evaluate(noWrap)).length === 0, "end sheet: no label wraps or clips: " + (await page.evaluate(noWrap)).join("; "));

    await click(page, '#sheet [data-act="rematch"]'); await page.waitForTimeout(80);
    const sheet = () => page.evaluate(() => {
      const s = document.getElementById("sheet");
      return { title: s.querySelector("h2").textContent, note: s.querySelector(".note").textContent, helps: [...s.querySelectorAll(".rm-h")].map((x) => x.textContent),
        segX: [...s.querySelectorAll(".rm-seg")].map((x) => Math.round(x.getBoundingClientRect().left) + ":" + Math.round(x.getBoundingClientRect().width)),
        code: s.querySelector(".rm-code .num").textContent, isNew: !!s.querySelector(".rm-code small"), go: s.querySelector('[data-act="rm-go"]').textContent,
        pressed: [...s.querySelectorAll('.rm-seg [aria-pressed="true"]')].map((b) => b.textContent).join(",") };
    });
    let s = await sheet();
    const seed = await page.evaluate(() => window.GGShots.App.match.opts.seed), brainName = await page.evaluate(() => window.GGShots.App.match.brains.S.name);
    ok(s.title === "Rematch" && s.pressed === "Yes,Yes,Yes", "rematch sheet: opens with all three on Yes");
    const newest = await page.evaluate(() => { const D = window.GGShots.D; return D.PRESETS[D.PRESETS.length - 1].id; });
    ok(s.note === `5v5 Blitz · Rules ${newest} · Sixteen letters! vs Bot (${brainName}). Format and settings stay.`, "rematch sheet: note: " + s.note);
    ok(s.helps.join("|") === "Both sides keep their units.|Same ends. North moves first.|Same code: same moves, same rolls.", "rematch sheet: Yes help lines: " + s.helps.join("|"));
    ok(new Set(s.segX).size === 1 && s.segX[0].endsWith(":132"), "rematch sheet: switches in one 132 px column: " + s.segX.join(" "));
    ok(s.code === seed && !s.isNew && s.go === "Start rematch", "rematch sheet: Same dice Yes shows the match's seed; Start rematch");
    ok((await page.evaluate(noWrap)).length === 0, "rematch sheet (Yes, Yes, Yes): nothing wraps or clips: " + (await page.evaluate(noWrap)).join("; "));
    await click(page, '[data-k="dice"][data-v="0"]'); const s1 = await sheet();
    await click(page, '[data-k="dice"][data-v="1"]'); await click(page, '[data-k="dice"][data-v="0"]'); const s2 = await sheet();
    ok(s1.code !== seed && s1.isNew && s1.code === s2.code, "rematch sheet: Same dice No shows one new seed, kept while open");
    await click(page, '[data-k="sides"][data-v="0"]'); await click(page, '[data-k="lineups"][data-v="0"]'); s = await sheet();
    ok(s.helps.join("|") === "Pick again on the Lineup screen.|Ends swap. North still moves first.|New code, new rolls.", "rematch sheet: No help lines: " + s.helps.join("|"));
    ok(s.go === "Next: Lineup", "rematch sheet: Next: Lineup when a human picks again");
    ok((await page.evaluate(noWrap)).length === 0, "rematch sheet (No, No, No): nothing wraps or clips: " + (await page.evaluate(noWrap)).join("; "));
    await click(page, '[data-act="rm-cancel"]'); await page.waitForTimeout(50);
    ok(await page.evaluate(() => window.GGShots.App.ui.sheet.kind === "over" && !!document.querySelector('#sheet [data-act="rematch"]')), "rematch sheet: Cancel goes back to the end sheet");
    await click(page, '#sheet [data-act="rematch"]');
    ok((await sheet()).pressed === "Yes,Yes,Yes", "rematch sheet: choices not remembered");

    // Same lineups: No through the Lineup screen; Reset; the top arrow
    const before = await page.evaluate(() => { const m = window.GGShots.App.match; return { id: m.id, lineups: JSON.parse(JSON.stringify(m.opts.lineups)), mix: m.mix }; });
    ok(before.mix && before.mix.S === "open" && !before.mix.N, "startMatch records each bot side's mix");
    await click(page, '[data-k="lineups"][data-v="0"]'); await click(page, '[data-k="sides"][data-v="0"]');
    await click(page, '[data-act="rm-go"]'); await page.waitForTimeout(80);
    const lu = await page.evaluate(() => { const G = window.GGShots; return { view: G.App.view, side: G.App.lineupSide, pick: JSON.parse(JSON.stringify(G.App.picks[G.App.lineupSide])), reset: document.querySelector('#view-lineup .footer [data-act="lineup-reset"]').textContent }; });
    const W = { counts: {} }; let keeper = null; for (const u of before.lineups.N) { if (u.fk) keeper = u.card; else W.counts[u.card] = (W.counts[u.card] || 0) + 1; }
    ok(lu.view === "lineup" && lu.side === "S", "Same lineups No + Same sides No: the human picks for South");
    ok(lu.pick.keeper === keeper && JSON.stringify(Object.entries(lu.pick.counts).filter(([, v]) => v).sort()) === JSON.stringify(Object.entries(W.counts).sort()), "Lineup screen starts from the lineup just played");
    ok(lu.reset === "Reset", "Lineup footer: Reset in place of Back");
    await click(page, '[data-act="lineup-reset"]');
    const rs1 = await page.evaluate(() => { const G = window.GGShots, p = G.App.picks[G.App.lineupSide]; return { sum: Object.values(p.counts).reduce((a, b) => a + b, 0), keeper: p.keeper, dis: document.querySelector('[data-act="lineup-next"]').getAttribute("aria-disabled") === "true" /* Brief 030: greyed, and a tap says why */ }; });
    ok(rs1.sum === 0 && rs1.keeper === keeper && rs1.dis, "Reset: every count 0, Flagkeeper kept, go greyed (no foot unit)");
    await click(page, '#view-lineup .backbar [data-act="rematch-back"]'); await page.waitForTimeout(80);
    s = await sheet();
    ok(await page.evaluate((i) => window.GGShots.App.view === "play" && window.GGShots.App.match.id === i, before.id) && s.pressed === "No,No,Yes", "Lineup top arrow during a rematch: back to the sheet, choices as left");
    await click(page, '[data-act="rm-go"]'); await page.waitForTimeout(80);
    await page.evaluate(() => { const G = window.GGShots, p = G.App.picks[G.App.lineupSide]; for (const c in p.counts) p.counts[c] = 0; p.counts.LM = 2; p.counts.LR = 2; p.counts.HA = 5 - 4 - (p.keeper ? 1 : 0); G.show("lineup"); });
    await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(120);
    const after = await page.evaluate(() => { const G = window.GGShots, m = G.App.match; return { id: m.id, view: G.App.view, live: G.App.live === m, S: m.opts.lineups.S, N: m.opts.lineups.N, names: m.opts.names, players: m.opts.players, first: m.opts.first, picks: JSON.parse(localStorage.getItem("gg.picks"))["blitz5:S"], mix: m.mix }; });
    ok(after.id !== before.id && after.view === "play" && after.live, "rematch: a new match, playing, saved as live");
    ok(after.S.filter((u) => u.card === "LM").length === 2 && after.S.filter((u) => u.card === "LR").length === 2, "rematch: the human's new lineup on South");
    ok(after.players.N.type === "bot" && after.names.S === "Sixteen letters!" && after.first === "N", "rematch: sides swapped, the typed name went with the team, North still first");
    ok(after.picks && after.picks.counts.LM === 2, "rematch: the lineup is saved like any lineup");
    ok(after.mix && after.mix.N === "open", "rematch: the bot keeps its mix on its new end");
    ok(await page.evaluate((i) => !!JSON.parse(localStorage.getItem("gg.matches"))[i], before.id), "rematch: the finished match stays in Matches");
  }

  // ---- Swap, pure ----
  {
    const r = await page.evaluate(() => {
      const G = window.GGShots, BR = window.GGBrain;
      const m = { id: "x", rs: G.App.rulesets[G.D.PRESETS[G.D.PRESETS.length - 1].id], view: "table", mix: { S: "heavy" },
        opts: { first: "S", coin: false, seed: "AAA", format: "std7", players: { N: { type: "human" }, S: { type: "bot", brainId: "brain9" } }, names: { N: "Ann", S: "South" },
          lineups: { N: [{ id: "FK", card: "HM", fk: true }, { id: "LR", card: "LR" }], S: [{ id: "FK", card: "LA", fk: true }, { id: "HR", card: "HR" }] } },
        brains: { S: Object.assign(JSON.parse(JSON.stringify(BR.DEFAULT_BRAINS.brain9 || BR.DEFAULT_BRAINS.brain8)), { tag: "as played" }) }, actions: [{ type: "end" }], draws: 7 };
      const x = G.rematchOf(m, { lineups: true, sides: false, dice: true, newSeed: "BBB" });
      const y = G.rematchOf(m, { lineups: true, sides: true, dice: false, newSeed: "BBB" });
      return { x, y };
    });
    ok(r.x.opts.lineups.S[0].card === "HM" && r.x.opts.lineups.N[0].card === "LA", "swap: each lineup on the other end");
    ok(r.x.brains.N && r.x.brains.N.tag === "as played" && !r.x.brains.S && r.x.opts.players.N.type === "bot" && r.x.opts.players.S.type === "human", "swap: brain (as played) and type on the other end");
    ok(r.x.opts.names.S === "Ann" && r.x.opts.names.N === "North", "swap: a typed name goes with the team; an end's own name stays with the end");
    ok(r.x.opts.first === "S" && r.x.view === "table" && r.x.mix.N === "heavy", "swap: opts.first unchanged; view kept; mix moves");
    ok(r.x.actions.length === 0 && r.x.draws === 0 && r.x.id !== "x" && r.x.opts.seed === "AAA", "rematch: fresh actions, draws and id; Same dice keeps the seed");
    ok(r.y.opts.seed === "BBB" && r.y.opts.lineups.N[0].card === "HM", "rematch: Same dice No takes the new seed; same sides keep their lineups");
  }

  // ---- Coin toss: a new toss, draw 0 still taken ----
  {
    const r = await page.evaluate(() => {
      const G = window.GGShots, App = G.App;
      const sides = new Set(), draws = new Set();
      for (let i = 0; i < 30; i++) {
        const m = { id: "c", rs: App.rulesets[G.D.PRESETS[G.D.PRESETS.length - 1].id], view: "handoff",
          opts: { first: "N", coin: true, seed: "COIN-1", format: "blitz5", players: { N: { type: "human" }, S: { type: "human" } }, names: { N: "North", S: "South" },
            lineups: { N: [{ id: "FK", card: "HM", fk: true }, { id: "HM", card: "HM" }, { id: "LM", card: "LM" }, { id: "HR", card: "HR" }, { id: "LR", card: "LR" }], S: [{ id: "FK", card: "HM", fk: true }, { id: "HM", card: "HM" }, { id: "LM", card: "LM" }, { id: "HR", card: "HR" }, { id: "LR", card: "LR" }] } }, brains: {}, actions: [], draws: 0 };
        App.match = m; App.st = null; App.ui.sheet = { kind: "rematch", lineups: true, sides: true, dice: true, newSeed: "X" };
        G.onAction("rm-go", null);
        sides.add(App.match.opts.first); draws.add(App.match.draws);
        document.getElementById("cover").hidden = true;
      }
      return { sides: [...sides], draws: [...draws] };
    });
    ok(r.sides.length === 2, "coin rematch: a new toss each time (both sides seen in 30 rematches on one seed)");
    ok(r.draws.length === 1 && r.draws[0] === 1, "coin rematch: draw 0 is taken, so the first roll is draw 1 as in the original: " + r.draws.join(","));
  }

  // ---- Same dice: Yes, two bots: the same game ----
  {
    await page.evaluate(begin, { N: "bot", S: "bot", brain: "brain8", seed: "SAME-DICE-29" });
    await page.waitForFunction(() => window.GGShots.App.st.phase === "over", null, { timeout: 240000, polling: 200 });
    const a = await page.evaluate(() => { const G = window.GGShots; return { id: G.App.match.id, seed: G.App.match.opts.seed, actions: JSON.stringify(G.App.match.actions), result: JSON.stringify(G.App.st.result) }; });
    await page.waitForTimeout(100);
    await click(page, '#sheet [data-act="rematch"]');
    ok((await page.evaluate(() => document.querySelector('[data-act="rm-go"]').textContent)) === "Start rematch", "bot vs bot: Start rematch");
    await click(page, '[data-act="rm-go"]');
    await page.waitForFunction((i) => window.GGShots.App.match.id !== i && window.GGShots.App.st.phase === "over", a.id, { timeout: 240000, polling: 200 });
    const b = await page.evaluate(() => { const G = window.GGShots; return { seed: G.App.match.opts.seed, actions: JSON.stringify(G.App.match.actions), result: JSON.stringify(G.App.st.result), n: G.App.match.actions.length }; });
    ok(b.seed === a.seed, "same dice: the rematch has the same seed");
    ok(b.actions === a.actions && b.result === a.result, `same dice: the rematch plays the same game (${b.n} actions, ${b.result})`);
    console.log(`  same-dice replay: ${b.n} actions, result ${b.result}, identical: ${b.actions === a.actions && b.result === a.result}`);
    // Replay from the rematch's own record gives the same end state.
    ok(await page.evaluate(() => { const G = window.GGShots, m = G.App.match, st = G.E.newMatch(m.rs, m.opts); for (const x of m.actions) G.E.act(st, x, () => x.die); return JSON.stringify(st.result) === JSON.stringify(G.App.st.result); }), "same dice: the rematch's record replays to the same result");
  }

  await browser.close();
  if (errors.length) { fails++; console.log("Page errors:", errors); }
  console.log(`${n - fails}/${n} passed`);
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
