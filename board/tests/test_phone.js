// Phone fit checks (Brief 025, Approved UI v5): the play screen at 393 × 665 in a headless browser.
// - under 900 px the play screen has no title bar and no "Pull up for the key" tab;
// - the unit bar is the same height (63 px) with nothing tapped, a unit tapped, a move previewed, an enemy tapped and a
//   warm-up open; the top bar is 84 px and the action panel 116 px;
// - with an attack, special or flag-pull sheet open, the unit bar is hidden;
// - no action button's label wraps or spills out of its button, for any unit and state;
// - every special's name in the newest preset fits its idle Special button on one line.
// node tests/test_phone.js   (needs Playwright with Chromium, as sims/lab/board_check.js does)
const path = require("path");
const { chromium } = require("playwright");
const boardDir = path.resolve(process.argv[2] || path.join(__dirname, ".."));
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };

// Runs in the page: a 7v7 on the newest preset (or `rsId`), North human, South bot, units at `place`.
function setup(arg) {
  const G = window.GGShots, { App, E, D } = G, BR = window.GGBrain;
  const base = arg.rsId ? D.PRESETS.find((p) => p.id === arg.rsId) : D.PRESETS[D.PRESETS.length - 1];
  const rs = JSON.parse(JSON.stringify(base));
  const L = (list) => list.map(([id, card, fk]) => ({ id, card, fk: !!fk }));
  App.match = { id: "phone", started: new Date().toISOString(), rs, opts: { first: "N", players: { N: { type: "human" }, S: { type: "bot", brainId: "brain5" } }, names: { N: "North", S: "South" }, lineups: { N: L(arg.N), S: L(arg.S) }, seed: "phone", format: "std7" }, brains: { S: BR.DEFAULT_BRAINS.brain5 || BR.DEFAULT_BRAINS.standard }, actions: [], draws: 0 };
  G.rebuild();
  const st = App.st;
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team).filter((h) => h !== E.fieldOf(st).FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  App.match.actions = JSON.parse(JSON.stringify(st.actions));
  for (const uid in arg.place) E.unitByUid(st, uid).hex = arg.place[uid];
  G.resetUi(); G.show("play");
}
const LINE = [["HM", "HM", true], ["HM2", "HM"], ["LM", "LM"], ["HR", "HR"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]];
const PLACE = { "N-HM": "E4", "N-HM2": "D9", "N-LM": "G9", "N-HR": "E7", "N-LR": "C9", "N-HA": "F6", "N-LA": "D7",
  "S-HM": "E16", "S-HM2": "B10", "S-LM": "B9", "S-HR": "H13", "S-LR": "G10", "S-HA": "G12", "S-LA": "C14" };
const BASE = { N: LINE, S: LINE, place: PLACE };

// Heights and what is shown, read in the page.
const measure = () => {
  const vis = (e) => !!e && !e.hidden && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0;
  const h = (id) => { const e = document.getElementById(id); return vis(e) ? Math.round(e.getBoundingClientRect().height * 10) / 10 : 0; };
  return { top: h("topbar"), unitbar: h("unitbar"), panel: h("actions"), field: h("fieldwrap"),
    title: vis(document.querySelector("#topbar .tb-title")), keytab: !!document.getElementById("keytab") || [...document.querySelectorAll("#fieldwrap *")].some((e) => vis(e) && /Pull up for the key/.test(e.textContent) && !e.children.length),
    menu: vis(document.getElementById("menubtn")) };
};
// Every action button's label: one line, inside its button.
const labels = () => [...document.querySelectorAll("#actions .act")].filter((b) => b.offsetWidth).map((b) => {
  const spans = [...b.querySelectorAll(":scope > span:not(.go-text), .go-1, .go-2")];
  const br = b.getBoundingClientRect();
  const bad = spans.filter((s) => { const rs = s.getClientRects(), r = s.getBoundingClientRect(); return rs.length > 1 || r.height > parseFloat(getComputedStyle(s).fontSize) * 1.6 || r.left < br.left - 0.5 || r.right > br.right + 0.5; });
  return bad.length ? `${b.dataset.act}: "${bad.map((s) => s.textContent.trim()).join(" / ")}"` : null;
}).filter(Boolean);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 393, height: 665 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + path.join(boardDir, "index.html") + "?shots=1");
  await page.waitForFunction(() => window.GGShots && window.GGShots.App);
  const fonts = await page.evaluate(async () => {
    try { await Promise.all(['600 11px "IBM Plex Sans"', '600 15px "IBM Plex Sans"', '700 17px "Barlow Condensed"', '700 14px "Barlow Condensed"'].map((f) => document.fonts.load(f))); } catch (e) { /* offline */ }
    return document.fonts.check('600 11px "IBM Plex Sans"');
  });
  console.log(`web fonts ${fonts ? "loaded" : "NOT loaded (label widths measured with fallback fonts)"}`);
  const go = async (arg, fn) => { await page.evaluate(setup, arg); if (fn) await page.evaluate(fn); await page.waitForTimeout(30); return page.evaluate(measure); };

  // ---- No title bar, no key tab; the menu button is on the field ----
  const m0 = await go(BASE);
  ok(!m0.title, "phone: no title bar on the play screen");
  ok(!m0.keytab, "phone: no 'Pull up for the key' tab on the field");
  ok(m0.menu, "phone: the Options button is on the field");
  ok(m0.top === 84, `phone: top bar 84 px (got ${m0.top})`);
  ok(m0.panel === 116, `phone: action panel 116 px (got ${m0.panel})`);

  // ---- The unit bar keeps one height ----
  const states = {
    "nothing tapped": null,
    "unit tapped": () => { const G = window.GGShots; G.App.ui.sel = "N-LR"; G.render(); },
    "move previewed": () => { const G = window.GGShots; G.App.ui.sel = "N-LR"; G.render(); G.onBoardTap("C10"); },
    "enemy tapped": () => { const G = window.GGShots; G.onBoardTap("H13"); },
    "warm-up open": () => { const G = window.GGShots; G.App.ui.sel = "N-LR"; G.App.ui.sheet = { kind: "warm" }; G.render(); },
    "can't move": () => { const G = window.GGShots; G.E.unitByUid(G.App.st, "N-HM2").stam = 0; G.App.ui.sel = "N-HM2"; G.render(); }
  };
  for (const name in states) {
    const m = await go(BASE, states[name]);
    ok(m.unitbar === 63, `phone: unit bar 63 px with ${name} (got ${m.unitbar})`);
    ok(m.field === 402, `phone: field 402 px with ${name} (got ${m.field})`);
  }
  const ghost = await page.evaluate(() => window.GGShots.App.ui.ghost);
  ok(ghost === null, "harness: the last state left no ghost behind");

  // ---- A preview sheet takes the unit bar's place ----
  const sheets = {
    attack: () => { const G = window.GGShots; G.App.ui.sel = "N-LM"; G.App.ui.armed = "attack"; G.render(); G.onBoardTap("G10"); },
    special: () => { const G = window.GGShots; G.E.unitByUid(G.App.st, "N-LM").sp = "charged"; G.App.ui.sel = "N-LM"; G.App.ui.armed = "special"; G.render(); G.onBoardTap("G10"); },
    "flag pull": () => { const G = window.GGShots; G.E.unitByUid(G.App.st, "N-HM2").hex = "D16"; G.E.unitByUid(G.App.st, "S-HM").hex = "B15"; G.App.ui.sel = "N-HM2"; G.render(); G.onBoardTap("E17"); }
  };
  for (const name in sheets) {
    const m = await go(BASE, sheets[name]);
    const kind = await page.evaluate(() => { const s = window.GGShots.App.ui.sheet; const el = document.getElementById("sheet"); return s && !el.hidden && el.classList.contains("v5") ? s.kind : null; });
    ok(!!kind, `phone: the ${name} sheet opens in the v5 layout (${kind})`);
    ok(m.unitbar === 0, `phone: unit bar hidden under the ${name} sheet (got ${m.unitbar})`);
    const names = await page.evaluate(() => [...document.querySelectorAll("#sheet .nb")].map((e) => { const nm = e.querySelector(".nm"); return nm && nm.scrollWidth <= nm.clientWidth + 0.5 && e.getBoundingClientRect().left >= 0 && e.getBoundingClientRect().right <= innerWidth; }));
    ok(names.length === 2 && names.every(Boolean), `phone: both names in the ${name} sheet show in full`);
  }
  // Closing a card opened from the sheet goes back to the preview.
  await go(BASE, sheets.attack);
  await page.click('#sheet .nb[data-uid="S-LR"]');
  ok(await page.evaluate(() => window.GGShots.App.ui.sheet.kind === "info"), "a name in the sheet opens that unit's card");
  await page.click('#sheet [data-act="sheet-close"]');
  ok(await page.evaluate(() => window.GGShots.App.ui.sheet.kind === "attack"), "closing that card returns to the attack preview");

  // ---- No label wraps, for any unit and state ----
  const bad = [];
  const cards = ["HM", "LM", "HR", "LR", "HA", "LA"];
  for (const code of cards) {
    const uid = code === "HM" ? "N-HM2" : "N-" + code;
    const runs = {
      idle: `G.App.ui.sel = "${uid}"; G.render();`,
      warm: `G.App.ui.sel = "${uid}"; G.App.ui.sheet = { kind: "warm" }; G.render();`,
      warming: `G.E.unitByUid(G.App.st, "${uid}").sp = "warm"; G.App.ui.sel = "${uid}"; G.render();`,
      charged: `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.App.ui.sel = "${uid}"; G.render();`,
      rewarm: `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.App.ui.sel = "${uid}"; G.App.ui.sheet = { kind: "warm" }; G.render();`,
      used: `G.E.unitByUid(G.App.st, "${uid}").sp = "used"; G.App.ui.sel = "${uid}"; G.render();`,
      enemy: `G.onBoardTap(G.E.unitByUid(G.App.st, "S-${code}").hex);`,
      confirmEnd: `G.App.ui.sel = "${uid}"; G.App.ui.confirmEnd = true; G.render();`
    };
    for (const k in runs) {
      await go(BASE, new Function(`const G = window.GGShots; ${runs[k]}`));
      for (const b of await page.evaluate(labels)) bad.push(`${code} ${k}: ${b}`);
    }
  }
  for (const name in sheets) { await go(BASE, sheets[name]); for (const b of await page.evaluate(labels)) bad.push(`${name}: ${b}`); }
  await go(BASE, states["move previewed"]); for (const b of await page.evaluate(labels)) bad.push(`move: ${b}`);
  await go(BASE, () => { const G = window.GGShots; G.App.match.actions = []; G.rebuild(); G.resetUi(); G.App.ui.placements = {}; G.App.ui.deploySel = "N-HM"; G.show("play"); });
  for (const b of await page.evaluate(labels)) bad.push(`deploy: ${b}`);
  ok(!bad.length, `no action button's label wraps or spills at 393 px (${bad.length}):\n  ${bad.join("\n  ")}`);

  // ---- Every special's name fits its idle button ----
  const fit = [];
  for (const code of cards) {
    const uid = code === "HM" ? "N-HM2" : "N-" + code;
    await go(BASE, new Function(`const G = window.GGShots; G.App.ui.sel = "${uid}"; G.render();`));
    const r = await page.evaluate(() => { const b = document.querySelector('#actions [data-act="special"]'), s = b && b.querySelector(":scope > span"); if (!s) return null; const cs = getComputedStyle(b);
      const inner = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); return { name: s.textContent, w: Math.round(s.getBoundingClientRect().width * 10) / 10, inner, lines: s.getClientRects().length }; });
    if (!r || r.lines !== 1 || r.w > r.inner) fit.push(`${code}: ${JSON.stringify(r)}`);
    else console.log(`  ${r.name}: ${r.w} of ${r.inner} px`);
  }
  ok(!fit.length, `every special's name fits its idle button on one line at 393 px:\n  ${fit.join("\n  ")}`);

  ok(!errors.length, `no page errors (${errors.join(" | ")})`);
  await browser.close();
  console.log(`${n - fails}/${n} phone checks passed`);
  process.exit(fails ? 1 : 0);
})();
