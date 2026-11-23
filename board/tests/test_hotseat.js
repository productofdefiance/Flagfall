// Turn cue, hot-seat views, field zoom and the match log (Brief 018, Approved UI v4), in a headless browser at 393 × 665.
// - the hot-seat view never reaches the engine: one seeded human-vs-human action list replays to the same state in all
//   three views;
// - the edge tag: shown on each turn change in hot seat ("NORTH PLAYS" / "SOUTH PLAYS"), never against the bot; it goes
//   for the whole turn (the Editor, 22 Nov) and a touch on the field works under it; its text reaches 4.5:1 on both sides;
// - view 2 draws the side to move's flag at the bottom; view 3 turns the interface on South's turn, never the field;
//   bot games always use view 1;
// - zoom (phone): starts at the field's width, the button goes out to the whole field and back; scroll then zoom keeps
//   the spot; deployment shows the deploying side's half; the tag shows in every game type;
// - deployment opens on the deploying side's own flag; icons only below 50 px; a 13v13 field at minimum fits;
// - gestures: a touch that moves more than 8 px pans and never selects; a second finger cancels a drag;
// - the match log: one row per action, newest turn first, a flag holder's HP from the display split.
// node tests/test_hotseat.js   (needs Playwright with Chromium)
const path = require("path");
const { chromium } = require("playwright");
const boardDir = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const SK = (() => { const w = {}; new Function("window", "globalThis", require("fs").readFileSync(path.join(boardDir, "skin.js"), "utf8").replace("})(this);", "})(window);"))(w, w); return w.GGSkin; })();
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };

// In the page: a 7v7 (or 13v13) on the newest preset, both human unless `bot`, played `turns` turns by Brain 5.
function setup(arg) {
  const G = window.GGShots, { App, E, D } = G, Bot = window.GGBot, BR = window.GGBrain;
  const rs = JSON.parse(JSON.stringify(D.PRESETS[D.PRESETS.length - 1]));
  const codes = arg.size === 13 ? ["HM", "HM", "HM", "LM", "LM", "HR", "HR", "LR", "LR", "HA", "HA", "LA", "LA"] : ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];
  const cnt = {}; const L = codes.map((c) => { cnt[c] = (cnt[c] || 0) + 1; return { id: cnt[c] === 1 ? c : c + cnt[c], card: c, fk: false }; });
  App.match = { id: "t", started: new Date().toISOString(), rs, view: arg.view || "handoff",
    opts: { first: "N", players: { N: { type: "human" }, S: arg.bot ? { type: "bot", brainId: "brain5" } : { type: "human" } }, names: { N: "North", S: "South" }, lineups: { N: L, S: L }, seed: "t", format: arg.size === 13 ? "s13" : "std7" },
    brains: arg.bot ? { S: BR.DEFAULT_BRAINS.brain5 } : {}, actions: [], draws: 0 };
  G.rebuild();
  const st = App.st, B = BR.DEFAULT_BRAINS.brain5, rnd = E.seededRandom(arg.seed || "hotseat");
  for (const t of ["N", "S"]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
  let k = 0;
  while (st.phase === "play" && st.turn <= (arg.turns || 0) && k++ < 3000) { const a = Bot.chooseAction(st, B, rnd).action; const r = E.act(st, a, () => E.rollWith(st, rnd)); if (!r.ok) E.act(st, { type: "end" }); }
  if (arg.toS && st.toMove === "N") E.act(st, { type: "end" });
  App.match.actions = JSON.parse(JSON.stringify(st.actions));
  G.rebuild(); G.resetUi(); G.show("play");
}
const state = () => {
  const G = window.GGShots, { App, E } = G, st = App.st, tag = document.getElementById("edgetag"), svg = document.getElementById("board");
  const flagY = (t) => { const [x, y] = [0, 0]; const g = svg.querySelector(`[data-hex="${E.fieldOf(st).FLAG[t]}"]`); const r = g.getBoundingClientRect(); return r.top + r.height / 2; };
  const wrap = document.getElementById("fieldwrap").getBoundingClientRect();
  return { toMove: st.toMove, turn: st.turn, tag: tag.textContent, tagUp: tag.classList.contains("up"), tagSide: tag.classList.contains("n") ? "N" : "S",
    turned: document.body.classList.contains("turned"), flip: !!App.ui.flip, nFlagY: flagY("N"), sFlagY: flagY("S"), wrapTop: wrap.top, wrapBottom: wrap.bottom,
    sel: App.ui.sel, hexPx: (svg.getBoundingClientRect().width / Number(svg.getAttribute("viewBox").split(" ")[2])) * 60,
    zoomLabel: document.getElementById("zoombtn").getAttribute("aria-label"), zoomHidden: document.getElementById("zoombtn").hidden,
    hp: [...svg.querySelectorAll(".unit text")].filter((t) => t.getAttribute("font-size") !== "8").length, units: svg.querySelectorAll(".unit").length,
    svgW: svg.getBoundingClientRect().width, svgH: svg.getBoundingClientRect().height, wrapW: wrap.width, wrapH: wrap.height };
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 393, height: 665 }, hasTouch: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + path.join(boardDir, "index.html") + "?shots=1");
  await page.waitForFunction(() => window.GGShots && window.GGShots.App);
  const go = async (arg, fn) => { await page.evaluate(setup, arg); await page.waitForTimeout(80); if (fn) { await page.evaluate(fn); await page.waitForTimeout(120); } return page.evaluate(state); };

  // ---- The view never reaches the engine ----
  const finals = [];
  for (const view of ["handoff", "flip", "table"]) {
    await go({ view, turns: 6 });
    finals.push(await page.evaluate(() => { const { App, E } = window.GGShots; const st = E.newMatch(App.match.rs, App.match.opts); for (const a of App.match.actions) E.act(st, a, () => a.die); return JSON.stringify(st) + JSON.stringify(st.events) + "|" + JSON.stringify(App.st) + JSON.stringify(App.st.events) + "|" + JSON.stringify(App.match.opts); }));
  }
  ok(finals[0] === finals[1] && finals[1] === finals[2], "the same action list replays to the same state in all three views");
  ok(!/"view"/.test(finals[0].split("|")[2]), "the view is not in the options the engine reads");

  // ---- The tag ----
  const contrast = (bg) => SK.contrast(SK.tagInk(bg), bg);
  ok(contrast(SK.tagColor("N")) >= 4.5 && contrast(SK.tagColor("S")) >= 4.5, `tag text contrast ≥ 4.5 (North ${contrast(SK.tagColor("N")).toFixed(2)}, South ${contrast(SK.tagColor("S")).toFixed(2)})`);
  ok(SK.tagInk("#1f2421") === "#ffffff", "on a dark jersey the tag text turns white");
  let s = await go({ view: "handoff", turns: 2 });
  ok(!s.tagUp && /^North plays$/i.test(s.tag) && s.tagSide === "N", `hot seat: the tag shows "NORTH PLAYS" at the left (${s.tag}, up ${s.tagUp})`);
  await page.waitForTimeout(800);   // let the hot-seat snap finish scrolling before aiming the tap
  const own = await page.evaluate(() => { const { App, E } = window.GGShots; const u = E.alive(App.st).find((x) => x.team === App.st.toMove && !x.done); return u.uid; });
  const box = await page.evaluate((uid) => { const r = document.querySelector(`#board [data-uid="${uid}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, own);
  await page.evaluate(([uid]) => window.GGShots.revealHex && 0, [own]);
  await page.touchscreen.tap(box[0], box[1]); await page.waitForTimeout(400);
  s = await page.evaluate(state);
  ok(!s.tagUp, "the tag stays up after the first touch (whole turn)");
  ok(s.sel === own, `that touch still selects the unit (sel ${s.sel}, wanted ${own})`);
  s = await go({ view: "handoff", turns: 2 }, () => window.GGShots.act({ type: "end" }));
  ok(!s.tagUp && /^South plays$/i.test(s.tag) && s.tagSide === "S", `after End turn: "SOUTH PLAYS" at the right (${s.tag})`);
  s = await go({ view: "flip", turns: 2, bot: true });
  ok(!s.tagUp && /plays$/i.test(s.tag), `against the bot: the tag shows too (${s.tag})`);
  ok(!s.flip && !s.turned, "against the bot: always view 1 (a saved Flip is ignored)");

  // ---- Views ----
  s = await go({ view: "handoff", turns: 2 });
  ok(s.nFlagY < s.sFlagY, "view 1: North's flag at the top");
  s = await go({ view: "flip", turns: 2 });
  ok(s.flip && s.nFlagY > s.sFlagY && !s.turned, "view 2, North to play: North's flag at the bottom, interface upright");
  s = await go({ view: "flip", turns: 2, toS: true });
  ok(!s.flip && s.sFlagY > s.nFlagY && !s.turned, "view 2, South to play: South's flag at the bottom");
  s = await go({ view: "table", turns: 2 });
  ok(!s.turned && s.nFlagY > s.sFlagY, "view 3, North to play: interface upright, North's flag at the bottom");
  s = await go({ view: "table", turns: 2, toS: true });
  ok(s.turned && s.nFlagY > s.sFlagY, `view 3, South to play: interface turned, North's flag still at the physical bottom (N ${s.nFlagY.toFixed(0)}, S ${s.sFlagY.toFixed(0)})`);
  s = await go({ view: "table", turns: 2, toS: true }, () => window.GGShots.act({ type: "end" }));
  ok(!s.turned && s.nFlagY > s.sFlagY, "view 3, back to North: upright again, the field hasn't moved ends");
  s = await go({ view: "handoff", turns: 2 }, () => { const G = window.GGShots; G.App.match.view = "flip"; G.render(); });
  ok(s.flip, "a view changed mid-match (Options) takes effect at once");

  // ---- Zoom ----
  s = await go({ view: "handoff", turns: 1 });
  ok(Math.abs(s.hexPx - 54.1) < 1 && s.hp > 0 && s.zoomLabel === "Zoom out" && !s.zoomHidden, `phone 7v7 starts zoomed in at the field's width: about 54 px hexes with numbers, "Zoom out" (${s.hexPx.toFixed(1)} px, ${s.zoomLabel})`);
  await page.evaluate(() => document.getElementById("zoombtn").click()); await page.waitForTimeout(150);
  s = await page.evaluate(state);
  ok(s.svgH <= s.wrapH + 1 && s.svgW <= s.wrapW + 1 && s.zoomLabel === "Zoom in", `zoom out: the whole field, "Zoom in" (${s.hexPx.toFixed(1)} px hexes)`);
  await page.evaluate(() => document.getElementById("zoombtn").click()); await page.waitForTimeout(150);
  s = await page.evaluate(state);
  ok(Math.abs(s.hexPx - 54.1) < 1, `zoom in: back to the field's width (${s.hexPx.toFixed(1)})`);
  s = await go({ view: "handoff", size: 13 });
  ok(s.hexPx < 50 && s.hp === 0 && s.units > 0, `13v13 far: ${s.hexPx.toFixed(1)} px hexes, icons only (${s.hp} numbers on ${s.units} units)`);
  s = await page.evaluate(() => { const G = window.GGShots; G.App.ui.zoom = 0.01; G.render(); return null; }).then(() => page.waitForTimeout(80)).then(() => page.evaluate(state));
  ok(s.svgW <= s.wrapW + 1 && s.svgH <= s.wrapH + 1, `13v13 minimum: the whole field in view (${s.svgW.toFixed(0)} × ${s.svgH.toFixed(0)} in ${s.wrapW.toFixed(0)} × ${s.wrapH.toFixed(0)}, ${s.hexPx.toFixed(1)} px hexes)`);
  s = await page.evaluate(() => { const G = window.GGShots; G.App.ui.zoom = 9; G.render(); return null; }).then(() => page.waitForTimeout(80)).then(() => page.evaluate(state));
  ok(Math.abs(s.hexPx - 120) < 0.5, `maximum: 120 px hexes (${s.hexPx.toFixed(1)})`);
  // Scroll, then zoom: the hex in the middle of the view stays in the middle (Build 20 review: it jumped to the top).
  const keep = await page.evaluate(async () => {
    const G = window.GGShots; G.App.ui.zoom = 0.6; G.render();   // between the whole field and the width: scrollable
    await new Promise((r) => setTimeout(r, 50));
    const sc = document.getElementById("fieldscroll"); sc.scrollTop = 300;
    const mid = () => { const r = sc.getBoundingClientRect(), el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2), g = el && el.closest("[data-hex]"); return g ? g.dataset.hex : null; };
    const before = mid(); document.getElementById("zoombtn").click();
    await new Promise((r) => setTimeout(r, 400));
    return { before, after: mid(), top: sc.scrollTop };
  });
  ok(keep.before && keep.before === keep.after && keep.top > 0, `scroll then zoom keeps the spot (${keep.before} → ${keep.after}, scroll ${keep.top})`);

  // ---- Deployment opens on the deploying side's own flag (Build 20 review: it always opened on North's) ----
  for (const human of ["N", "S"]) {
    const top = await page.evaluate(async (human) => {
      const G = window.GGShots, A = G.App;
      A.setup = { format: "std7", rulesetId: G.D.PRESETS[G.D.PRESETS.length - 1].id, first: "N", seed: "DEP", players: { N: human === "N" ? { type: "human", name: "North", mix: "open" } : { type: "bot", brainId: "brain5", mix: "open" }, S: human === "S" ? { type: "human", name: "South", mix: "open" } : { type: "bot", brainId: "brain5", mix: "open" } } };
      A.picks = { [human]: { keeper: null, counts: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } } };
      G.startMatch(); await new Promise((r) => setTimeout(r, 400));
      const sc = document.getElementById("fieldscroll"), svg = document.getElementById("board");
      return { top: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight, half: svg.getBoundingClientRect().height / 2, view: sc.clientHeight };
    }, human);
    ok(top.half <= top.view + 2 && top.half >= top.view * 0.85, `${human} deploys (phone): its half of the field fills the view (half ${top.half.toFixed(0)} px, view ${top.view} px)`);
    ok(human === "N" ? top.top === 0 : top.top >= top.max - 2, `${human} deploys: the field opens on its own flag (scroll ${top.top} of ${top.max})`);
  }

  // Hot seat: after North deploys, South's deployment opens on South's flag (review of #54).
  {
    const r = await page.evaluate(async () => {
      const G = window.GGShots, A = G.App;
      A.setup = { format: "std7", rulesetId: G.D.PRESETS[G.D.PRESETS.length - 1].id, first: "N", seed: "DEP2", players: { N: { type: "human", name: "North", mix: "open" }, S: { type: "human", name: "South", mix: "open" } } };
      A.picks = { N: { keeper: null, counts: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } }, S: { keeper: null, counts: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } } };
      G.startMatch(); document.querySelector('[data-act="cover-ok"]').click();
      await new Promise((r) => setTimeout(r, 300));
      document.querySelector('[data-act="deploy-fill"]').click(); await new Promise((r) => setTimeout(r, 100));
      document.querySelector('[data-act="deploy-done"]').click(); await new Promise((r) => setTimeout(r, 100));
      document.querySelector('[data-act="cover-ok"]').click(); await new Promise((r) => setTimeout(r, 500));
      const sc = document.getElementById("fieldscroll"), tag = document.getElementById("edgetag");
      return { team: A.ui.cover, top: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight, tag: tag.textContent, up: tag.classList.contains("up") };
    });
    ok(r.top >= r.max - 2, `hot seat: South's deployment opens on South's flag (scroll ${r.top} of ${r.max})`);
    ok(/South deploys/i.test(r.tag) && !r.up, `hot seat: "SOUTH DEPLOYS" shows (${r.tag})`);
  }
  // Scroll, then zoom with the wheel: the hex under the pointer stays under it.
  {
    await go({ view: "handoff", turns: 1, bot: true }); await page.waitForTimeout(600);   // no hot-seat snap moving the view
    const r = await page.evaluate(async () => {
      const sc = document.getElementById("fieldscroll"); sc.scrollTop = 250;
      const rc = sc.getBoundingClientRect(), x = rc.left + rc.width / 2, y = rc.top + rc.height / 2;
      const at = () => { const el = document.elementFromPoint(x, y), g = el && el.closest("[data-hex]"); return g ? g.dataset.hex : null; };
      const before = at();
      sc.dispatchEvent(new WheelEvent("wheel", { deltaY: -200, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      await new Promise((r) => setTimeout(r, 100));
      return { before, after: at(), top: sc.scrollTop };
    });
    ok(r.before && r.before === r.after && r.top > 100, `scroll then wheel-zoom keeps the hex under the pointer (${r.before} → ${r.after}, scroll ${r.top})`);
  }

  // Clicking the space around the field lets go of the tapped unit (the Editor, 23 Nov).
  {
    await go({ view: "handoff", turns: 1, bot: true }); await page.waitForTimeout(500);
    const r = await page.evaluate(async () => {
      const G = window.GGShots, { App, E } = G, u = E.alive(App.st).find((x) => x.team === App.st.toMove);
      App.ui.sel = u.uid; G.render(); await new Promise((x) => setTimeout(x, 50));
      const sc = document.getElementById("fieldscroll"); sc.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((x) => setTimeout(x, 50));
      return App.ui.sel;
    });
    ok(r === null, `a click outside the field lets go of the unit (sel ${r})`);
  }

  // ---- Gestures ----
  // Against the bot (North human): no hot-seat snap scrolling the field while the gestures run.
  await go({ view: "handoff", turns: 2, bot: true }, () => { const G = window.GGShots; G.App.ui.zoom = 1.3; G.render(); });
  await page.waitForTimeout(700);
  const p0 = await page.evaluate((uid) => { const r = document.querySelector(`#board [data-uid="${uid}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, own);
  const cdp = await page.context().newCDPSession(page);
  const touch = async (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  const sc0 = await page.evaluate(() => [document.getElementById("fieldscroll").scrollLeft, document.getElementById("fieldscroll").scrollTop]);
  // an empty hex in the middle of the view: pan from there by 30 px; nothing gets selected
  const e0 = await page.evaluate(() => {
    const { App, E } = window.GGShots, taken = new Set(E.alive(App.st).map((u) => u.hex)), w = document.getElementById("fieldwrap").getBoundingClientRect();
    const cells = [...document.querySelectorAll("#board .cell:not(.unit)")].filter((g) => !taken.has(g.dataset.hex)).map((g) => g.getBoundingClientRect()).filter((r) => r.top > w.top + 120 && r.bottom < w.bottom - 60 && r.left > 80 && r.right < w.right - 80);
    const r = cells[0]; return [r.left + r.width / 2, r.top + r.height / 2];
  });
  await touch("touchStart", [[e0[0], e0[1]]]);
  for (let i = 1; i <= 6; i++) { await touch("touchMove", [[e0[0], e0[1] - 5 * i]]); }
  await touch("touchEnd", []); await page.waitForTimeout(450);
  s = await page.evaluate(state);
  const sc1 = await page.evaluate(() => [document.getElementById("fieldscroll").scrollLeft, document.getElementById("fieldscroll").scrollTop]);
  ok(Math.abs(sc1[1] - sc0[1]) > 20 && !s.sel, `a 30 px drag pans the field and selects nothing (scroll ${sc0[1]} → ${sc1[1]}, sel ${s.sel})`);
  // a drag on your own unit with a second finger landing: cancelled, no move
  const before = await page.evaluate(() => window.GGShots.App.match.actions.length);
  // An own unit that can still act, brought into the middle of the view first.
  const pick = await page.evaluate(async () => {
    const G = window.GGShots, { App, E } = G, u = E.alive(App.st).find((x) => x.team === App.st.toMove && !x.done);
    G.revealHex(u.hex, true); await new Promise((r) => setTimeout(r, 200));
    const r = document.querySelector(`#board [data-uid="${u.uid}"]`).getBoundingClientRect(), w = document.getElementById("fieldwrap").getBoundingClientRect();
    return { p: [r.left + r.width / 2, r.top + r.height / 2], inView: r.top > w.top + 50 && r.bottom < w.bottom - 70 };
  });
  ok(pick.inView, "the drag test's unit is in view");
  const p1 = pick.p;
  await touch("touchStart", [[p1[0], p1[1]]]);
  await touch("touchMove", [[p1[0], p1[1] - 20]]);
  await touch("touchStart", [[p1[0], p1[1] - 20], [p1[0] + 60, p1[1] + 40]]);   // the second finger lands
  await touch("touchMove", [[p1[0], p1[1] - 40], [p1[0] + 70, p1[1] + 50]]);
  await touch("touchMove", [[p1[0], p1[1] - 50], [p1[0] + 80, p1[1] + 60]]);
  await touch("touchEnd", []); await page.waitForTimeout(450);
  const after = await page.evaluate(() => ({ n: window.GGShots.App.match.actions.length, drag: window.GGShots.App.ui.drag, ghost: window.GGShots.App.ui.ghost }));
  ok(after.n === before && !after.drag && !after.ghost, `a second finger cancels a drag: no move made (${before} → ${after.n} actions)`);
  s = await page.evaluate(state);
  ok(Math.abs(s.hexPx - 1.3 * 60) > 3, `two fingers pinch the zoom (${s.hexPx.toFixed(1)} px hexes, was 78)`);

  // ---- The match log ----
  const lg = await page.evaluate((arg) => {
    const G = window.GGShots; G.App.ui.logOpen = true; G.render();
    const st = G.App.st, el = document.getElementById("logview");
    const rows = el.querySelectorAll(".lg-row").length, divs = [...el.querySelectorAll(".lg-div")].map((d) => d.getAttribute("aria-label"));
    const acts = st.events.filter((e) => e.unit && e.action && e.action !== "done").length;
    return { rows, acts, first: divs[0], last: divs[divs.length - 1], field: !el.hidden, names: getComputedStyle(document.getElementById("namesbtn")).display, btn: document.getElementById("logbtn").getAttribute("aria-label") };
  });
  ok(lg.field && lg.rows === lg.acts, `the log shows one row per action (${lg.rows} rows, ${lg.acts} actions)`);
  ok(lg.first === "Turn 3, North" && lg.last === "Turn 1, North", `newest turn first (${lg.first} … ${lg.last})`);
  ok(lg.names === "none" && lg.btn === "Show field", "hex-name button hidden; the log button reads Show field");
  // A holder hit that leaves raw HP 16.67 reads 16.5 in its row.
  const hold = await page.evaluate(() => {
    const G = window.GGShots, { App, E } = G, st = App.st;
    const ev = { i: 0, kind: "attack", action: "attack", turn: 1, team: "S", command: 1, str: 8, parts: ["Strength 8"], value: 5, roll: 0, dmg: 5,
      flag: { N: [10, 8.5], S: [10, 10] }, unit: { uid: "S-HM", id: "HM", card: "HM", team: "S", from: "E5", to: "E5", hpBefore: 20, hpAfter: 20, stamina: 1 },
      targets: [{ uid: "N-HM", id: "HM", card: "HM", team: "N", from: "E3", to: "E3", hpBefore: 20, hpAfter: 16.5, removed: false, holder: true, dmg: 5 }] };
    const div = document.createElement("div"); div.innerHTML = window.GGLogRow(st, ev, false); return div.textContent.replace(/\s+/g, " ");
  });
  ok(/20 → 16\.5/.test(hold) && /10 → 8\.5/.test(hold) && !/16\.67/.test(hold), `a holder row shows the display split: "${hold.trim()}"`);

  // ---- Desktop (1304 × 800): zoom out shows the whole field; the log panel opens and closes without moving the field ----
  {
    const dp = await browser.newPage({ viewport: { width: 1304, height: 800 } });
    dp.on("pageerror", (e) => errors.push(e.message));
    await dp.goto("file://" + path.join(boardDir, "index.html") + "?shots=1");
    await dp.waitForFunction(() => window.GGShots && window.GGShots.App);
    await dp.evaluate(() => { try { localStorage.removeItem("gg.logPanel"); } catch (e) { /* none */ } });
    await dp.evaluate(setup, { view: "handoff", turns: 2, bot: true }); await dp.waitForTimeout(400);
    const d = await dp.evaluate(async () => {
      const sc = document.getElementById("fieldscroll"), svg = document.getElementById("board"), w = document.getElementById("fieldwrap").getBoundingClientRect(), r = svg.getBoundingClientRect();
      const whole = r.width <= w.width + 1 && r.height <= w.height + 1;
      document.getElementById("zoombtn").click(); await new Promise((x) => setTimeout(x, 400));
      sc.scrollTop += 120;
      const mid = () => { const b = sc.getBoundingClientRect(), el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2), g = el && el.closest("[data-hex]"); return g ? g.dataset.hex : null; };
      const m0 = mid(); document.querySelector("#logside .lg-hide").click(); await new Promise((x) => setTimeout(x, 200));
      const m1 = mid(), btn = document.getElementById("logbtn").getBoundingClientRect(), fw = document.getElementById("fieldwrap").getBoundingClientRect();
      document.getElementById("logbtn").click(); await new Promise((x) => setTimeout(x, 200));
      return { whole, m0, m1, m2: mid(), btnLeft: btn.left - fw.left, panel: !document.getElementById("logside").hidden };
    });
    ok(d.whole, "desktop: zoom out (far) shows the whole field");
    // Deployment on desktop: South (human) sees its own half, not the whole field.
    const dep = await dp.evaluate(async () => {
      const G = window.GGShots, A = G.App;
      A.setup = { format: "std7", rulesetId: G.D.PRESETS[G.D.PRESETS.length - 1].id, first: "N", seed: "DEPD", players: { N: { type: "bot", brainId: "brain5", mix: "open" }, S: { type: "human", name: "South", mix: "open" } } };
      A.picks = { S: { keeper: null, counts: { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 } } };
      G.startMatch(); await new Promise((r) => setTimeout(r, 400));
      const sc = document.getElementById("fieldscroll"), svg = document.getElementById("board");
      return { top: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight, h: svg.getBoundingClientRect().height, view: sc.clientHeight };
    });
    ok(dep.h > dep.view + 50 && dep.top >= dep.max - 2, `desktop: South's deployment shows South's half, not the whole field (field ${dep.h.toFixed(0)} px in a ${dep.view} px view, scroll ${dep.top} of ${dep.max})`);
    ok(d.m0 && d.m0 === d.m1 && d.m1 === d.m2, `desktop: hiding and showing the log panel keeps the same hex in the middle (${d.m0} → ${d.m1} → ${d.m2})`);
    ok(d.btnLeft < 20 && d.panel, `desktop: the log button sits at the field's left and opens the panel (${d.btnLeft.toFixed(0)} px from the left)`);
    await dp.close();
  }

  ok(!errors.length, "no page errors: " + errors.join("; "));
  await browser.close();
  console.log(fails ? `${fails} of ${n} checks FAILED` : `All ${n} checks passed`);
  process.exit(fails ? 1 : 0);
})();
