// Phone fit checks (Brief 025, Approved UI v5): the play screen at 393 × 665 in a headless browser.
// - under 900 px the play screen has no title bar and no "Pull up for the key" tab;
// - the unit bar is the same height (63 px) with nothing tapped, a unit tapped, a move previewed, an enemy tapped and a
//   unit warming up (Brief 026: one tap); the top bar is 84 px and the action panel 116 px;
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
  App.match = { id: "phone", started: new Date().toISOString(), rs, opts: { first: "N", players: { N: { type: "human" }, S: arg.south ? { type: "human" } : { type: "bot", brainId: "brain5" } }, names: { N: "North", S: "South" }, lineups: { N: L(arg.N), S: L(arg.S) }, seed: "phone", format: "std7" }, brains: { S: BR.DEFAULT_BRAINS.brain5 || BR.DEFAULT_BRAINS.standard }, actions: [], draws: 0 };
  G.rebuild();
  const st = App.st;
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team).filter((h) => h !== E.fieldOf(st).FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  App.match.actions = JSON.parse(JSON.stringify(st.actions));
  for (const uid in arg.place) E.unitByUid(st, uid).hex = arg.place[uid];
  if (arg.south) { E.act(st, { type: "end" }); App.match.actions = JSON.parse(JSON.stringify(st.actions)); }
  G.resetUi(); document.getElementById("fieldscroll").scrollTop = 0; G.show("play");
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
    "warming up": () => { const G = window.GGShots; G.App.ui.sel = "N-LR"; G.render(); document.querySelector('#actions [data-act="special"]').click(); },
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
    const want = name === "special" ? "v6" : "v5";   // Brief 026: the special has its own gold sheet (Approved UI v6)
    const kind = await page.evaluate((w) => { const s = window.GGShots.App.ui.sheet; const el = document.getElementById("sheet"); return s && !el.hidden && el.classList.contains(w) ? s.kind : null; }, want);
    ok(!!kind, `phone: the ${name} sheet opens in the ${want} layout (${kind})`);
    ok(m.unitbar === 0, `phone: unit bar hidden under the ${name} sheet (got ${m.unitbar})`);
    const names = await page.evaluate(() => [...document.querySelectorAll("#sheet .nb, #sheet .nb6")].map((e) => { const nm = e.querySelector(".nm, .nm6"); return nm && nm.scrollWidth <= nm.clientWidth + 0.5 && e.getBoundingClientRect().left >= 0 && e.getBoundingClientRect().right <= innerWidth; }));
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
      warming: `G.App.ui.sel = "${uid}"; G.render(); document.querySelector('#actions [data-act="special"]').click();`,
      charged: `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.App.ui.sel = "${uid}"; G.render();`,
      row: `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.App.ui.sel = "${uid}"; G.render(); document.querySelector('#actions [data-act="special"]').click();`,
      rowNone: `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.E.unitByUid(G.App.st, "${uid}").hex = "A6"; G.App.ui.sel = "${uid}"; G.render(); document.querySelector('#actions [data-act="special"]').click();`,
      rowWarmed: `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.E.unitByUid(G.App.st, "${uid}").hex = "A6"; G.App.ui.sel = "${uid}"; G.render(); document.querySelector('#actions [data-act="special"]').click(); document.querySelector('#actions [data-act="sp-warm"]').click();`,
      braced: `G.App.ui.sel = "${uid}"; G.act({ type: "brace", uid: "${uid}" }); G.App.ui.sel = "${uid}"; G.render();`,
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

  // ---- Review of #47 ----
  const HA2 = { N: [["HM", "HM", true], ["HA", "HA"], ["HA2", "HA"], ["HR", "HR"], ["LR", "LR"], ["LM", "LM"], ["LA", "LA"]], S: LINE,
    place: { "N-HM": "E4", "N-HA": "F6", "N-HA2": "D9", "N-HR": "E7", "N-LR": "C9", "N-LM": "G9", "N-LA": "D7", "S-HM": "E16", "S-HM2": "E11", "S-LM": "B9", "S-HR": "H13", "S-LR": "G10", "S-HA": "G12", "S-LA": "C14" } };
  // Fix 1: a note (warming up, can't move) takes all of row 1 and never clips, with the longest names.
  const noteOf = () => { const n = document.querySelector("#unitbar .ub-note"), bar = document.getElementById("unitbar"); if (!n) return null;
    const r = n.getBoundingClientRect(), br = bar.getBoundingClientRect(), lh = parseFloat(getComputedStyle(n).lineHeight) || 11.5;
    return { text: n.textContent, clipped: n.scrollWidth > n.clientWidth + 0.5 || n.scrollHeight > n.clientHeight + 2, lines: Math.round(r.height / lh), inside: r.right <= br.right - 13 && r.bottom <= br.bottom, side: !!document.querySelector("#unitbar .ub-side") }; };
  for (const [lab, arg, uid] of [["Light Ranged", BASE, "N-LR"], ["Heavy Anti-Cavalry 2", HA2, "N-HA2"]]) {
    for (const [what, run] of [["warm-up", `G.App.ui.sel = "${uid}"; G.render(); document.querySelector('#actions [data-act="special"]').click();`], ["can't move", `G.E.unitByUid(G.App.st, "${uid}").stam = 0; G.App.ui.sel = "${uid}"; G.render();`],
      ["re-warm", `G.E.unitByUid(G.App.st, "${uid}").sp = "charged"; G.E.unitByUid(G.App.st, "${uid}").hex = "A6"; G.App.ui.sel = "${uid}"; G.render(); document.querySelector('#actions [data-act="special"]').click(); document.querySelector('#actions [data-act="sp-warm"]').click();`]]) {
      const m = await go(arg, new Function(`const G = window.GGShots; ${run}`)), nt = await page.evaluate(noteOf);
      ok(nt && !nt.clipped && nt.lines <= 2 && nt.inside && !nt.side, `${lab}, ${what}: the note shows in full across row 1, no hex or moves (${JSON.stringify(nt)})`);
      ok(m.unitbar === 63, `${lab}, ${what}: unit bar still 63 px (got ${m.unitbar})`);
      if (what === "can't move") ok(nt && nt.text === "No movement available this turn", `${lab}: "No movement available this turn" in full`);
      // Brief 026 §2: the only special note left is "Fires next turn · no attack or brace", for a first warm-up and a re-warm.
      if (what !== "can't move") ok(nt && nt.text === "Fires next turn · no attack or brace", `${lab}, ${what}: the warming note (${nt && nt.text})`);
    }
  }
  // Fix 2: field buttons are never covered: hidden under a sheet or the key drawer; otherwise their bottom sits a fixed
  // 116 px above whatever is under the field, so they move up if it grows.
  const fb = () => { const fw = document.getElementById("fieldwrap").getBoundingClientRect(), vis = (e) => !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0;
    const sh = document.getElementById("sheet"), shTop = !sh.hidden && sh.parentNode.id === "fieldwrap" ? sh.getBoundingClientRect().top : Infinity;
    return ["menubtn", "namesbtn"].map((id) => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return { id, vis: vis(e), covered: vis(e) && r.bottom > shTop, gap: Math.round((fw.bottom - r.bottom) * 10) / 10, inField: r.top >= fw.top && r.bottom <= fw.bottom }; }); };
  const under = { "attack sheet": sheets.attack, "special sheet": sheets.special, "flag-pull sheet": sheets["flag pull"],
    "key drawer": () => { const G = window.GGShots; G.App.ui.sel = "N-LR"; G.render(); G.onBoardTap("C10"); document.querySelector("[data-act=key-open]").click(); },
    "unit card": () => { const G = window.GGShots; G.App.ui.sel = "N-LR"; G.App.ui.sheet = { kind: "info", uid: "N-LR" }; G.render(); } };
  for (const k in under) { await go(BASE, under[k]); const b = await page.evaluate(fb); ok(b.every((x) => !x.vis), `field buttons hidden under the ${k} (${JSON.stringify(b)})`); }
  for (const [k, fn] of [["unit tapped", states["unit tapped"]], ["nothing tapped", null], ["deployment (taller bench)", () => { const G = window.GGShots; G.App.match.actions = []; G.rebuild(); G.resetUi(); G.App.ui.placements = {}; G.App.ui.deploySel = "N-HM"; G.show("play"); }]]) {
    await go(BASE, fn); const b = await page.evaluate(fb), nm = b.find((x) => x.id === "namesbtn");
    ok(b.every((x) => x.vis && x.inField && !x.covered) && nm.gap === 116, `${k}: field buttons shown, inside the field, hex names 116 px above what is under it (${JSON.stringify(b)})`);
  }
  // Brief 026 §1 (replaces 025's fix 3): no state bar on the Special button in any state.
  for (const sp of ["unused", "warm", "charged", "used"]) {
    await go(BASE, new Function(`const G = window.GGShots; G.E.unitByUid(G.App.st, "N-LR").sp = "${sp}"; G.App.ui.sel = "N-LR"; G.render();`));
    ok(await page.evaluate(() => !document.querySelector('#actions [data-act="special"] .spbar')), `Special ${sp}: no state bar`);
  }
  // F025-4: the visible handle bar is outside the card's tap area, with the longest name.
  await go(HA2, () => { const G = window.GGShots; G.App.ui.sel = "N-HA2"; G.render(); });
  const hit = await page.evaluate(() => { const s = document.querySelector("#unitbar .ub-handle span").getBoundingClientRect(), pts = [[s.left + 1, s.top + 1], [s.right - 1, s.bottom - 1], [s.left + s.width / 2, s.top + s.height / 2]];
    return pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e && e.closest("[data-act]") ? e.closest("[data-act]").dataset.act : null; }); });
  ok(hit.every((a) => a === "key-open"), `Heavy Anti-Cavalry 2: the handle bar opens the key, not the card (${hit})`);
  // Fix 5: an Arc Hit by a South holder on E17: the attacker and every target scroll above the open sheet.
  await go({ N: LINE, S: LINE, south: true, place: { ...PLACE, "S-HM2": "E17", "S-HM": "B15", "N-HM2": "E16", "N-LM": "D16", "N-LA": "F16" } },
    () => { const G = window.GGShots; G.E.unitByUid(G.App.st, "S-HM2").sp = "charged"; G.App.ui.sel = "S-HM2"; G.App.ui.armed = "special"; G.render(); G.onBoardTap("E16"); });
  await page.waitForTimeout(900);
  const seen = await page.evaluate(() => { const sh = document.getElementById("sheet").getBoundingClientRect(), fw = document.getElementById("fieldwrap").getBoundingClientRect();
    return ["E17", "E16", "D16", "F16"].map((h) => { const r = document.querySelector(`#board [data-hex="${h}"]`).getBoundingClientRect(); return { h, ok: r.top >= fw.top - 1 && r.bottom <= sh.top + 1 }; }); });
  ok(seen.every((x) => x.ok), `Arc Hit from E17: the attacker and all three targets are above the sheet (${JSON.stringify(seen)})`);

  ok(!errors.length, `no page errors (${errors.join(" | ")})`);
  await browser.close();
  console.log(`${n - fails}/${n} phone checks passed`);
  process.exit(fails ? 1 : 0);
})();
