// Brief 026 checks (Approved UI v6, the specials flow) in a headless browser at 393 × 665, and the desktop at 1280 × 800.
// The Special button's five looks; one-tap warm-up and its Undo; the special row (big special, Warm up, Cancel) and its
// second lines; "Tap a target"; the reason pills and their wording table; the gold special sheet for every special
// (one target included), with ×1, struck modifiers and a kill's spear pill; Brace's two looks; Undo's reasons.
// node tests/test_spflow.js   (needs Playwright with Chromium, as test_phone.js does)
const path = require("path"), fs = require("fs");
const { chromium } = require("playwright");
const boardDir = path.resolve(process.argv[2] || path.join(__dirname, ".."));
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };

function setup(arg) {
  const G = window.GGShots, { App, E, D } = G, BR = window.GGBrain;
  const rs = JSON.parse(JSON.stringify(D.PRESETS[D.PRESETS.length - 1]));
  const L = (list) => list.map(([id, card, fk]) => ({ id, card, fk: !!fk }));
  App.match = { id: "spflow", started: new Date().toISOString(), rs, opts: { first: "N", players: { N: { type: "human" }, S: { type: "bot", brainId: "brain5" } }, names: { N: "North", S: "South" }, lineups: { N: L(arg.N), S: L(arg.S) }, seed: "spflow", format: "std7" }, brains: { S: BR.DEFAULT_BRAINS.brain5 || BR.DEFAULT_BRAINS.standard }, actions: [], draws: 0 };
  G.rebuild();
  const st = App.st;
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team).filter((h) => h !== E.fieldOf(st).FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  for (const uid in arg.place) E.unitByUid(st, uid).hex = arg.place[uid];
  // Units moved by hand are outside the record (Undo replays the record), so the Undo checks compare only what the
  // record decides: the special's state, Stamina and Command.
  App.match.actions = JSON.parse(JSON.stringify(st.actions));
  G.resetUi(); document.getElementById("fieldscroll").scrollTop = 0; G.show("play");
}
const LINE = [["HM", "HM", true], ["HM2", "HM"], ["LM", "LM"], ["HR", "HR"], ["LR", "LR"], ["HA", "HA"], ["LA", "LA"]];
const PLACE = { "N-HM": "E4", "N-HM2": "D9", "N-LM": "G9", "N-HR": "E7", "N-LR": "C9", "N-HA": "F6", "N-LA": "D7",
  "S-HM": "E16", "S-HM2": "B10", "S-LM": "B9", "S-HR": "H13", "S-LR": "G10", "S-HA": "G12", "S-LA": "C14" };
const at = (extra) => ({ N: LINE, S: LINE, place: Object.assign({}, PLACE, extra || {}) });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 393, height: 665 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("file://" + path.join(boardDir, "index.html") + "?shots=1");
  await page.waitForFunction(() => window.GGShots && window.GGShots.App);
  try { await page.evaluate(async () => { await Promise.all(['600 11px "IBM Plex Sans"', '600 15px "IBM Plex Sans"', '700 14px "Barlow Condensed"'].map((f) => document.fonts.load(f))); }); } catch (e) { /* offline */ }
  const go = async (arg, js) => { await page.evaluate(setup, arg); if (js) await page.evaluate(new Function(`const G = window.GGShots, E = G.E, st = G.App.st, ui = G.App.ui; ${js}`)); await page.waitForTimeout(20); };
  const q = (js) => page.evaluate(new Function(`const G = window.GGShots, E = G.E, st = G.App.st, ui = G.App.ui; ${js}`));
  const tap = (act) => page.evaluate((a) => { const b = document.querySelector(`#actions [data-act="${a}"]`); if (!b) return false; b.click(); return true; }, act);
  const look = (act) => page.evaluate((a) => { const b = document.querySelector(`#actions [data-act="${a}"]`); if (!b) return null; const c = getComputedStyle(b);
    return { bg: c.backgroundColor, edge: `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}`, ink: c.color, opacity: c.opacity, text: b.textContent.replace(/\s+/g, " ").trim(), bar: !!b.querySelector(".spbar") }; }, act);
  const line2 = () => page.evaluate(() => { const g = document.querySelector('#actions .spbig .go-2'); return g ? g.textContent.replace(/\s+/g, " ").trim() : null; });
  const hint = () => page.evaluate(() => { const h = document.getElementById("hint"); return h.hidden ? "" : h.textContent; });
  const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;

  // ---- 1. The Special button's five looks, no state bar ----
  const LOOKS = {
    Unused: ["", "#f8f9f5", "1px solid", "#1f2421", "#1f2421"],
    "Warming up": ["E.unitByUid(st, 'N-LR').sp = 'warm';", "#ebe8d9", "2px dashed", "#e2b53c", "#4b514d"],
    Charged: ["E.unitByUid(st, 'N-LR').sp = 'charged';", "#e2b53c", "2px solid", "#1f2421", "#1f2421"],
    Used: ["E.unitByUid(st, 'N-LR').sp = 'used';", "#e3e5e0", "1px solid", "#c4c9c2", "#9aa09b"],
    "Can't warm up (braced)": ["G.act({ type: 'brace', uid: 'N-LR' });", "#ebe8d9", "1px solid", "#d6d1b8", "#7d827e"],
  };
  for (const k in LOOKS) {
    const [js, bg, edge, edgeCol, ink] = LOOKS[k];
    await go(at(), `${js} ui.sel = "N-LR"; G.render();`);
    const l = await look("special");
    ok(l && l.bg === rgb(bg) && l.edge === `${edge} ${rgb(edgeCol)}` && l.ink === rgb(ink) && l.opacity === "1" && !l.bar && l.text === "Arrow Storm",
      `Special button, ${k}: ${bg} / ${edge} ${edgeCol} / ${ink}, full strength, no bar, just the name (${JSON.stringify(l)})`);
  }
  // Used and Can't warm up give their reason in the dark pill; Warming up says when it fires.
  for (const [k, js, want] of [["Used", "E.unitByUid(st, 'N-LR').sp = 'used';", "Arrow Storm used · once a match"], ["Can't warm up", "G.act({ type: 'brace', uid: 'N-LR' });", "Braced this turn · warm up next turn"], ["Warming up", "E.unitByUid(st, 'N-LR').sp = 'warm';", "Fires next turn"]]) {
    await go(at(), `${js} ui.sel = "N-LR"; G.render();`);
    const sp0 = await q("return E.unitByUid(st, 'N-LR').sp;");
    await tap("special"); await page.waitForTimeout(20);
    ok((await hint()) === want && (await q("return E.unitByUid(st, 'N-LR').sp;")) === sp0, `tapping a ${k} Special shows "${want}" in the dark pill and does nothing else (got "${await hint()}")`);
  }

  // ---- 2. One tap warms up, no confirm; 9. Undo takes it back exactly ----
  await go(at(), `ui.sel = "N-LR"; G.render();`);
  const before = await q("const u = E.unitByUid(st, 'N-LR'); return { sp: u.sp, stam: u.stam, cmd: st.cmd };");
  await tap("special"); await page.waitForTimeout(20);
  const after = await q("const u = E.unitByUid(st, 'N-LR'); return { sp: u.sp, stam: u.stam, cmd: st.cmd, sheet: ui.sheet, note: (document.querySelector('#unitbar .ub-note') || {}).textContent };");
  ok(after.sp === "warm" && !after.sheet && after.stam < before.stam && after.cmd < before.cmd && after.note === "Fires next turn · no attack or brace", `one tap from Unused warms up at once, no confirm, the note shows (${JSON.stringify(after)})`);
  ok((await look("special")).bg === rgb("#ebe8d9"), "the button turns to the warming look");
  ok(await page.evaluate(() => !document.querySelector('#actions [data-act="undo"]').disabled && document.querySelector('#actions [data-act="undo"]').getAttribute("aria-disabled") !== "true"), "Undo is live after a warm-up");
  await tap("undo"); await page.waitForTimeout(20);
  const undone = await q("const u = E.unitByUid(st, 'N-LR'); return { sp: u.sp, stam: u.stam, cmd: st.cmd, sel: ui.sel };");
  ok(undone.sp === before.sp && undone.stam === before.stam && undone.cmd === before.cmd && undone.sel === null, `Undo takes the warm-up back: special, Stamina and Command exactly as before, selection cleared (${JSON.stringify(undone)})`);
  // Undo a brace still works.
  await go(at(), `ui.sel = "N-HM2"; G.render();`);
  await tap("brace"); await page.waitForTimeout(20);
  ok(await q("return !!E.unitByUid(st, 'N-HM2').braced;"), "Brace braces");
  await tap("undo"); await page.waitForTimeout(20);
  ok(await q("return !E.unitByUid(st, 'N-HM2').braced;"), "Undo takes a brace back");

  // ---- 3. Tapping Charged opens the special row ----
  // Several targets (Arrow Storm from D11).
  const SEV = at({ "N-LR": "D11" }), CH = (uid) => `E.unitByUid(st, '${uid}').sp = 'charged'; ui.sel = '${uid}'; G.render();`;
  await go(SEV, CH("N-LR"));
  await tap("special"); await page.waitForTimeout(20);
  const row = await page.evaluate(() => [...document.querySelectorAll("#actions .arow")][0].querySelectorAll(".act").length);
  const nT = await q("return E.options(st, 'N-LR').special.targets.length;");
  ok(nT > 1 && (await line2()) === `${nT} targets` && row === 3, `charged with ${nT} targets: the row is the big special, Warm up, Cancel; "${nT} targets" (${await line2()})`);
  ok((await look("sp-warm")).text === "Warm up" && (await look("sp-warm")).bg === rgb("#f8f9f5") && (await look("sheet-close")).text === "Cancel", "Warm up (plain, no cost) and Cancel");
  const bigLook = await page.evaluate(() => { const c = getComputedStyle(document.querySelector("#actions .spbig")); return { bg: c.backgroundColor, edge: `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}`, flex: c.flexGrow }; });
  ok(bigLook.bg === rgb("#e2b53c") && bigLook.edge === `2px solid ${rgb("#1f2421")}` && bigLook.flex === "2", `the big special is gold, 2 px ink edge, in Attack's two-part slot (${JSON.stringify(bigLook)})`);
  // 4. Big button: ring, "Tap a target", pick, fire.
  await tap("sp-big"); await page.waitForTimeout(20);
  ok((await hint()) === "Tap a target" && (await q("return ui.armed;")) === "special", `tapping the big button rings the targets and says "Tap a target" (${await hint()})`);
  const tgt = await q("return E.unitByUid(st, E.options(st, 'N-LR').special.targets[0].target).hex;");
  await q(`G.onBoardTap("${tgt}");`); await page.waitForTimeout(20);
  ok(/^−1 Stamina/.test(await line2()) && (await q("return ui.sheet && ui.sheet.kind;")) === "special", `a ringed unit opens the sheet; the big button reads "−1 Stamina" and the squares (${await line2()})`);
  await page.evaluate(() => document.querySelector("#actions .spbig").click()); await page.waitForTimeout(20);
  ok((await q("return E.unitByUid(st, 'N-LR').sp;")) === "used", "tapping it fires");
  ok(await page.evaluate(() => { const b = document.querySelector('#actions [data-act="undo"]'); return b.getAttribute("aria-disabled") === "true" && b.dataset.why === "Can't undo a special once fired"; }), "Undo refuses after a fired special and says why");
  // One target (Skewer at C11 on Heavy Melee 2 at C12): the sheet opens at once and the big button fires.
  await go(at({ "N-HA": "C11", "S-HM2": "C12" }), CH("N-HA"));
  await tap("special"); await page.waitForTimeout(20);
  ok((await q("return ui.sheet && ui.sheet.kind;")) === "special" && /^−1 Stamina/.test(await line2()) && !!(await look("sp-warm")), `one target: the sheet opens at once, the big button fires, Warm up stays beside it (${await line2()})`);
  // No target: "No targets"; the pill gives the reason; with no moves left it doesn't say move.
  await go(at({ "N-HA": "A6" }), CH("N-HA"));
  await tap("special"); await page.waitForTimeout(20);
  ok((await line2()) === "No targets" && (await look("sp-warm")).text === "Warm up", `no target: the big button stays gold with "No targets" (${await line2()})`);
  await page.evaluate(() => document.querySelector("#actions .spbig").click()); await page.waitForTimeout(20);
  ok((await hint()) === "No targets available · move", `no target, moves left: "No targets available · move" (${await hint()})`);
  await go(at({ "N-HA": "A6" }), `E.unitByUid(st, 'N-HA').moved = 99; ${CH("N-HA")}`);
  await tap("special"); await page.evaluate(() => document.querySelector("#actions .spbig").click()); await page.waitForTimeout(20);
  ok((await hint()) === "No targets available", `no target, no moves left: "No targets available" (${await hint()})`);
  // A blocked charged special: the reason on the big button, the full reason in the pill.
  for (const [lab, js, short, full] of [["braced", "E.unitByUid(st, 'N-LR').braced = true;", "Braced this turn", "Braced this turn · warm up next turn"],
    ["Command short", "st.cmd = 0.5;", "Not enough Command", "Not enough Command"], ["Stamina short", "E.unitByUid(st, 'N-LR').stam = 0.5;", "Not enough Stamina", "Not enough Stamina"]]) {
    await go(SEV, `${js} ${CH("N-LR")}`);
    await tap("special"); await page.waitForTimeout(20);
    const l2 = await line2(); await page.evaluate(() => document.querySelector("#actions .spbig").click()); await page.waitForTimeout(20);
    ok(l2 === short && (await hint()) === full, `charged and ${lab}: "${short}" on the big button, "${full}" in the pill (${l2} / ${await hint()})`);
  }
  // Warm up in the row: warms at once, row stays, big greys "Warming up instead"; Cancel keeps it; Undo takes it back.
  // Charged for real (warm up, both sides end), so the record holds it and Undo can replay it.
  await go(at({ "N-HA": "A6" }), `E.act(st, { type: "warmup", uid: "N-HA" }); E.act(st, { type: "end" }); E.act(st, { type: "end" }); G.App.match.actions = JSON.parse(JSON.stringify(st.actions)); ui.sel = "N-HA"; G.render();`);
  const b2 = await q("const u = E.unitByUid(st, 'N-HA'); return { stam: u.stam, cmd: st.cmd };");
  await tap("special"); await tap("sp-warm"); await page.waitForTimeout(20);
  const grey = await page.evaluate(() => { const b = document.querySelector("#actions .spbig"), c = getComputedStyle(b); return { bg: c.backgroundColor, ink: c.color, edge: `${c.borderTopWidth} ${c.borderTopStyle} ${c.borderTopColor}` }; });
  ok((await q("return E.unitByUid(st, 'N-HA').sp;")) === "warm" && (await line2()) === "Warming up instead" && grey.bg === rgb("#eef0ec") && grey.ink === rgb("#9aa09b") && grey.edge === `1px solid ${rgb("#c4c9c2")}`,
    `Warm up in the row warms up and keeps the row: the big button greys "Warming up instead" (${await line2()} ${JSON.stringify(grey)})`);
  ok((await look("sp-warm")).bg === rgb("#ebe8d9") && (await q("return (document.querySelector('#unitbar .ub-note') || {}).textContent;")) === "Fires next turn · no attack or brace", "Warm up turns to the warming look; the note shows");
  await page.evaluate(() => document.querySelector("#actions .spbig").click()); await page.waitForTimeout(20);
  ok((await q("return E.unitByUid(st, 'N-HA').sp;")) === "warm", "tapping the greyed big button does nothing");
  await tap("sheet-close"); await page.waitForTimeout(20);
  ok((await q("return E.unitByUid(st, 'N-HA').sp;")) === "warm" && !(await page.evaluate(() => !!document.querySelector("#actions .spbig"))), "Cancel closes the row and keeps the warm-up");
  await tap("undo"); await page.waitForTimeout(20);
  const b3 = await q("const u = E.unitByUid(st, 'N-HA'); return { sp: u.sp, stam: u.stam, cmd: st.cmd };");
  ok(b3.sp === "charged" && b3.stam === b2.stam && b3.cmd === b2.cmd, `Undo takes a re-warm back to Charged, Stamina and Command restored (${JSON.stringify(b3)})`);
  // Moving from the row previews the move.
  await go(SEV, CH("N-LR"));
  await tap("special");
  const mv = await q("const o = E.options(st, 'N-LR'); return Object.keys(o.moves).find((h) => !E.alive(st).some((u) => u.hex === h));");
  await q(`G.onBoardTap("${mv}");`); await page.waitForTimeout(20);
  ok((await q("return ui.ghost;")) === mv && !!(await look("move-confirm")), "tapping a move hex from the special row previews the move (Move and Cancel)");

  // ---- 5. Wording table: every engine string still exists in engine.js ----
  const engineSrc = fs.readFileSync(path.join(boardDir, "engine.js"), "utf8");
  const words = await q("return G.SP_WORDS.map((w) => w.engine);");
  const missing = words.filter((w) => !engineSrc.includes(w.startsWith("<id> ") ? w.slice(5) : `"${w}"`));
  ok(words.length >= 8 && !missing.length, `every engine reason the wording table maps exists in engine.js (missing: ${missing.join(", ")})`);
  const shown = await q(`const c = { name: "Arrow Storm", moves: 2 }; return ["Used", "Braced this turn", "No target in reach", "LR has ended its turn", "LR attacked this turn and may only evade or end", "HR is reloading this turn", "Not enough Stamina", "Not enough Command", "Already attacked this turn"].map((r) => G.spWords(r, c));`);
  ok(JSON.stringify(shown) === JSON.stringify(["Arrow Storm used · once a match", "Braced this turn · warm up next turn", "No targets available · move", "Ended its turn", "Attacked this turn · may only evade or end its turn", "Reloading this turn", "Not enough Stamina", "Not enough Command", "Already attacked this turn"]), `the wording table words each reason, no unit codes (${JSON.stringify(shown)})`);
  // Every second line the table can produce fits the big button at 393 px, with the longest special name.
  await go(SEV, CH("N-LR")); await tap("special");
  const lines = ["No targets", "Braced this turn", "Ended its turn", "Attacked this turn", "Reloading this turn", "Not enough Stamina", "Not enough Command", "Already attacked this turn", "Warm it up first", "Fires next turn", "Warming up instead", "12 targets"];
  const fits = await page.evaluate((ls) => { const b = document.querySelector("#actions .spbig"), g = b.querySelector(".go-2"), out = [];
    for (const l of ls) { g.textContent = l; const r = g.getBoundingClientRect(), br = b.getBoundingClientRect(); if (g.getClientRects().length > 1 || r.right > br.right - 2) out.push(`${l} (${Math.round(r.right - br.left)} of ${Math.round(br.width)})`); }
    return out; }, lines);
  ok(!fits.length, `every second line fits the big button on one line at 393 px (${fits.join(", ")})`);

  // ---- 6. The special sheet: every special, one target included ----
  const SPECIALS = [["Arc Hit", "N-HM2", { "N-HM2": "C11", "S-HM2": "C12", "S-LA": "B11", "S-HA": "D11" }, 3],
    ["Pick Off", "N-LM", { "N-LM": "C11", "S-HM2": "C12" }, 1], ["Bullseye", "N-HR", { "N-HR": "D11" }, 1],
    ["Arrow Storm", "N-LR", { "N-LR": "D11" }, 1], ["Skewer", "N-HA", { "N-HA": "C11", "S-HM2": "C12", "S-LA": "C13" }, 2], ["Javelin", "N-LA", { "N-LA": "C10", "S-HM2": "C12" }, 1]];
  for (const [name, uid, place, rows] of SPECIALS) {
    await go(at(place), CH(uid));
    await tap("special");
    if (!(await q("return ui.sheet;"))) { await tap("sp-big"); const t = await q(`const o = E.options(st, '${uid}').special; const p = o.targets.find((x) => x.hits.length === ${rows}) || o.targets[0]; return p && E.unitByUid(st, p.target).hex;`); if (t) await q(`G.onBoardTap("${t}");`); }
    await page.waitForTimeout(30);
    const sh = await page.evaluate(() => { const s = document.getElementById("sheet"), c = getComputedStyle(s); return s.hidden ? null : { v6: s.classList.contains("v6"), top: `${c.borderTopWidth} ${c.borderTopColor}`, rows: s.querySelectorAll(".r6").length, mult: (s.querySelector(".str6 b") || {}).textContent, sure: (s.querySelector(".sure6") || {}).textContent, name: (s.querySelector(".spn6") || {}).textContent, h: Math.round(s.getBoundingClientRect().height), names: [...s.querySelectorAll(".nm6")].every((e) => e.scrollWidth <= e.clientWidth + 0.5 && e.getBoundingClientRect().right <= innerWidth) }; });
    ok(sh && sh.v6 && sh.top === `3px ${rgb("#e2b53c")}` && sh.rows === rows && /^×/.test(sh.mult || "") && sh.sure === "Sure hit" && sh.name === name.toUpperCase() && sh.names,
      `${name}: the gold row sheet, ${rows} row${rows > 1 ? "s" : ""}, the multiplier always shown, Sure hit, names in full (${JSON.stringify(sh)})`);
    if (name === "Arc Hit") ok(sh.mult === "×1", `Arc Hit shows ×1 (${sh.mult})`);
    console.log(`  ${name}: sheet ${sh && sh.h} px, ${rows} row${rows > 1 ? "s" : ""}`);
  }
  // Struck modifiers: Arrow Storm's ignored Dodge, Bullseye's ignored Armor (Pierce).
  await go(at({ "N-LR": "D11", "S-LM": "B10", "S-HM2": "H15" }), CH("N-LR")); await tap("special");
  { const t = await q("const p = E.options(st, 'N-LR').special.targets.find((x) => x.hits[0].dodgeIgnored); return p && E.unitByUid(st, p.target).hex;");
    if (t) { if (!(await q("return ui.sheet;"))) await tap("sp-big"); await q(`G.onBoardTap("${t}");`); }
    const st1 = await page.evaluate(() => [...document.querySelectorAll("#sheet .m6")].map((m) => ({ label: m.getAttribute("aria-label"), struck: !!m.querySelector(".fo-old") })));
    ok(!!t && st1.some((m) => /^Dodge/.test(m.label) && m.struck), `Arrow Storm: the target's Dodge shows struck (${JSON.stringify(st1)})`); }
  await go(at({ "N-HR": "D11", "S-HM2": "D12" }), CH("N-HR")); await tap("special");
  { const t = await q("const p = E.options(st, 'N-HR').special.targets.find((x) => x.hits[0].detail.pierce); return p && E.unitByUid(st, p.target).hex;");
    if (t) { if (!(await q("return ui.sheet && ui.sheet.target && E.unitByUid(st, ui.sheet.target).hex === '" + t + "';"))) { await tap("sp-big"); await q(`G.onBoardTap("${t}");`); } }
    const st2 = await page.evaluate(() => [...document.querySelectorAll("#sheet .m6")].map((m) => ({ label: m.getAttribute("aria-label"), struck: !!m.querySelector(".fo-old") })));
    ok(!!t && st2.some((m) => /^Armor/.test(m.label) && m.struck), `Bullseye with Pierce: the target's Armor shows struck (${JSON.stringify(st2)})`); }
  // A killing Pick Off next to a braced spear: the red spear pill on its row and the badge on the field.
  await go(at({ "N-LM": "E11", "S-LR": "E12", "S-HA": "E13" }), `E.unitByUid(st, 'S-HA').braced = true; E.unitByUid(st, 'S-LR').hp = 6; ${CH("N-LM")}`);
  await tap("special"); await page.waitForTimeout(30);
  const po = await page.evaluate(() => ({ pill: (document.querySelector("#sheet .r6 .kpill.hurt") || {}).textContent, dmgRed: !!document.querySelector("#sheet .r6 .d6.kill"), badge: [...document.querySelectorAll("#board rect")].some((r) => r.getAttribute("fill") === "var(--attack)" && r.getAttribute("rx") === "7.5") }));
  ok(po.pill === "2" && po.dmgRed && po.badge, `Pick Off kill into a set spear: the red spear pill (2) on its row, the damage red, the spear badge on the field (${JSON.stringify(po)})`);

  // ---- 8. Brace's two looks ----
  await go(at(), `G.act({ type: "brace", uid: "N-HM2" }); ui.sel = "N-HM2"; G.render();`);
  const bOn = await look("brace");
  ok(bOn.bg === rgb("#2e3338") && bOn.ink === "rgb(255, 255, 255)" && bOn.opacity === "1", `braced this turn: solid charcoal, white shield and label (${JSON.stringify(bOn)})`);
  await go(at(), `E.unitByUid(st, "N-HM2").wasBraced = true; ui.sel = "N-HM2"; G.render();`);
  const bLast = await look("brace");
  ok(bLast.bg === rgb("#e4e6e3") && bLast.edge === `2px dashed ${rgb("#2e3338")}` && bLast.ink === rgb("#2e3338"), `braced last turn: light tint, 2 px dashed charcoal (${JSON.stringify(bLast)})`);
  ok(await page.evaluate(() => !document.querySelector('#actions [data-act="brace"] .dot')), "no dot on the Brace button");

  // ---- The Evade hint names the unit in full ----
  await go(at({ "N-LM": "C11", "S-HM2": "C12" }), `E.unitByUid(st, "S-HM2").hp = 99; E.unitByUid(st, "S-HM2").maxHp = 99; G.act({ type: "attack", uid: "N-LM", target: "S-HM2" }); ui.sel = "N-LM"; G.render();`);
  const ev = await hint();
  ok(/^Evade: step further from Heavy Melee[ ,]/.test(ev) && !/HM2/.test(ev), `the Evade hint names the unit, no code (${ev})`);

  // ---- 7. Desktop: the same behaviour in its own layout ----
  await page.setViewportSize({ width: 1280, height: 800 });
  await go(SEV, `ui.sel = "N-LR"; E.unitByUid(st, 'N-LR').sp = 'unused'; G.render();`);
  await tap("special"); await page.waitForTimeout(20);
  ok((await q("return E.unitByUid(st, 'N-LR').sp;")) === "warm", "desktop: one tap warms up");
  await go(SEV, CH("N-LR")); await tap("special"); await page.waitForTimeout(20);
  ok(!!(await look("sp-big")) && !!(await look("sp-warm")) && (await line2()) === `${nT} targets`, "desktop: the special row");
  await tap("sp-big"); const tgt2 = await q("return E.unitByUid(st, E.options(st, 'N-LR').special.targets[0].target).hex;"); await q(`G.onBoardTap("${tgt2}");`); await page.waitForTimeout(30);
  ok(await page.evaluate(() => { const s = document.getElementById("sheet"); return !s.hidden && s.classList.contains("v6") && s.querySelectorAll(".r6").length >= 1; }), "desktop: the gold special sheet in the preview column");

  ok(!errors.length, `no page errors (${errors.join(" | ")})`);
  await browser.close();
  console.log(`${n - fails}/${n} specials flow checks passed`);
  process.exit(fails ? 1 : 0);
})();
