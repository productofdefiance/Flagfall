// @test job=board quick=yes release=yes night=no browser
// Game start (Brief 030, Approved UI v8) in a headless browser at 393 × 665:
// - New game: the blocks, the squad rules (Cavalry only greyed at 5v5 and 7v7), the settings line and its bold items,
//   the seed box with copy and New seed, Swap ends, the personality sheet (slider and box together, clamped, Custom)
//   and the discard prompt; Game settings and its Reset; choices kept for the next game, the seed new each game;
// - Lineup: locked rows, the one line of numbers, Reset, a kept lineup a changed rule forbids (named, nothing removed),
//   no foot unit, a short squad (first tap warns, second tap within 4 s starts), Pick South lineup (used exactly);
// - Start match can never start an illegal lineup: from the Lineup screen, startMatch itself, Random, the rematch
//   and a watch link;
// - Hot seat: each side's Lineup behind its cover; Random: straight to deployment;
// - the record, Matches and the rematch carry the squad rule; a record without one reads as Open.
// node tests/test_gamestart.js [board folder]   (needs Playwright with Chromium)
const path = require("path");
const { chromium } = require("playwright");
const boardDir = path.resolve(process.argv[2] || path.join(__dirname, ".."));
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const click = (page, sel) => page.evaluate((s) => { const b = document.querySelector(s); if (!b) throw new Error("no " + s); b.click(); }, sel);
const txt = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : null; }, sel);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 393, height: 665 }, hasTouch: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  const url = "file://" + path.join(boardDir, "index.html") + "?shots=1";
  const load = async (q) => { await page.goto(url + (q || "")); await page.waitForFunction(() => window.GGShots && window.GGShots.App && document.querySelector('[data-act="new"]')); await page.waitForTimeout(120); };
  await load(); await page.evaluate(() => localStorage.clear()); await load();
  const fresh = async () => { await page.evaluate(() => { const G = window.GGShots; G.App.match = null; G.App.st = null; G.Store.clearLive(); G.show("home"); }); await click(page, '[data-act="new"]'); await page.waitForTimeout(60); };
  const seg = (name, val) => click(page, `[data-seg="${name}"][data-val="${val}"]`);
  const pill = () => page.evaluate(() => { const p = document.getElementById("lpill"); return p && !p.hidden ? p.textContent : null; });

  // ---- New game ----
  await fresh();
  const ng = await page.evaluate(() => ({
    title: document.querySelector("#view-setup h2").textContent, blocks: [...document.querySelectorAll("#view-setup .blk")].length,
    cav: document.querySelector('[data-seg="squad"][data-val="cavalry"]').disabled, open: document.querySelector('[data-seg="squad"][data-val="open"]').getAttribute("aria-pressed"),
    coin: document.querySelector('[data-seg="first"][data-val="coin"]').getAttribute("aria-pressed"), next: document.querySelector('[data-act="setup-next"]').textContent,
    nb: [...document.querySelectorAll("#view-setup .nb-tag")].length, cog: !!document.querySelector('[data-act="persona-open"]'), names: [...document.querySelectorAll("#view-setup .nm-inp")].length,
    seed: document.getElementById("setup-seed").textContent, newSeed: !!document.querySelector('[aria-label="New random seed"]'), help: [...document.querySelectorAll("#view-setup .blk .hint")].map((e) => e.textContent) }));
  ok(ng.title === "New game" && ng.blocks === 5, `New game: title and five blocks (${ng.blocks})`);
  ok(ng.cav && ng.open === "true" && ng.coin === "true", "Cavalry only greyed at 7v7; Open and Coin by default");
  ok(ng.next === "Next: Lineup", "footer: Next: Lineup");
  ok(ng.nb === 2 && ng.cog && ng.names === 1, "bot side: Difficulty and Personality tagged Not built yet, the cog; only the human side has a name box");
  ok(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(ng.seed) && ng.newSeed, "the seed in its box, with a New seed button");
  ok(ng.help.includes("Tossed from the dice code.") && ng.help.includes("Any unit, both sides. Cavalry only needs 9v9 or 13v13."), "help lines for Coin and Open at 7v7");
  const line0 = await txt(page, ".gs-line");
  ok(/^7v7 · Rules v[\d.]+ \(newest\) · South: Brain \d+ \(default\) · No overtime · 1 round · Dice: Two · New seed$/.test(line0), "the settings line: " + line0);
  ok(!(await page.evaluate(() => document.querySelector(".gs-key"))), "no bold and no key line before any game");
  await click(page, '[data-act="seed-new"]');
  ok((await txt(page, "#setup-seed")) !== ng.seed, "New seed replaces the seed");
  await seg("first", "S"); ok((await page.evaluate(() => [...document.querySelectorAll("#view-setup .blk .hint")].map((e) => e.textContent))).includes("South takes the first turn."), "moves first: South takes the first turn.");
  await seg("first", "coin");
  await seg("squad", "random"); ok((await txt(page, '[data-act="setup-next"]')) === "Start match", "Random: the footer reads Start match");
  await seg("squad", "open");

  // Personality sheet and the discard prompt
  await click(page, '[data-act="persona-open"]');
  let ps = await page.evaluate(() => ({ open: !document.getElementById("psheet").hidden, title: document.querySelector("#psheet h2").textContent, rows: document.querySelectorAll("#psheet [data-persona]").length, badge: !!document.querySelector("#psheet .ps-badge") }));
  ok(ps.open && ps.title === "SOUTH PERSONALITY" && ps.rows === 5 && !ps.badge, "the personality sheet: five settings, no Custom badge yet");
  await page.evaluate(() => { const r = document.querySelector('#psheet [data-persona="agg"]'); r.value = "70"; r.dispatchEvent(new Event("input", { bubbles: true })); });
  ps = await page.evaluate(() => ({ num: document.querySelector('#psheet [data-persona-num="agg"]').value, badge: !!document.querySelector("#psheet .ps-badge"), val: [...document.querySelectorAll("#view-setup .pk-v")].map((e) => e.textContent).pop() }));
  ok(ps.num === "70" && ps.badge && ps.val === "CUSTOM", "a slider moves its box; Custom badge; the value reads CUSTOM");
  await page.evaluate(() => { const b = document.querySelector('#psheet [data-persona-num="close"]'); b.value = "150"; b.dispatchEvent(new Event("input", { bubbles: true })); b.dispatchEvent(new Event("change", { bubbles: true })); });
  ps = await page.evaluate(() => ({ num: document.querySelector('#psheet [data-persona-num="close"]').value, sl: document.querySelector('#psheet [data-persona="close"]').value }));
  ok(ps.num === "100" && ps.sl === "100", "a typed 150 is clamped to 100 on leaving the box; the slider follows");
  await click(page, '[data-act="persona-done"]');
  await click(page, '[data-act="pick-persona"][data-dir="1"]'); await page.waitForTimeout(50);
  const dlg = await page.evaluate(() => ({ open: !document.getElementById("dialog").hidden, t: document.querySelector("#dialogbox h2").textContent, b: [...document.querySelectorAll("#dialogbox [data-dlg]")].map((x) => x.textContent) }));
  ok(dlg.open && dlg.t === "DISCARD CUSTOM PERSONALITY?" && dlg.b.join("|") === "Keep custom|Discard", "› while Custom: the discard prompt");
  await click(page, '#dialogbox [data-dlg="keep"]'); await page.waitForTimeout(30);
  ok((await page.evaluate(() => window.GGShots.App.setup.players.S.persona.custom.agg)) === 70, "Keep custom keeps the values");
  await click(page, '[data-act="pick-persona"][data-dir="-1"]'); await page.waitForTimeout(30); await click(page, '#dialogbox [data-dlg="discard"]'); await page.waitForTimeout(30);
  ok((await page.evaluate(() => [...document.querySelectorAll("#view-setup .pk-v")].map((e) => e.textContent).pop())) === "DEFAULT", "Discard: back to DEFAULT");

  // Swap ends
  await page.evaluate(() => { window.GGShots.App.setup.players.N.name = "Ann"; });
  await click(page, '[data-act="swap-ends"]');
  const sw = await page.evaluate(() => { const s = window.GGShots.App.setup; return { N: s.players.N.type, S: s.players.S.type, Sn: s.players.S.name }; });
  ok(sw.N === "bot" && sw.S === "human" && sw.Sn === "Ann", "Swap ends: the human and the typed name go to South");
  await click(page, '[data-act="swap-ends"]');

  // Game settings
  await click(page, '[data-act="go-settings"]');
  const gs = await page.evaluate(() => ({ view: window.GGShots.App.view, groups: [...document.querySelectorAll("#view-settings .grp-t")].map((e) => e.textContent), f9: document.querySelector('#view-settings [data-seg="format"][data-val="s9"]').disabled,
    rs: document.querySelector("#setup-rs").options[0].textContent, brain: document.querySelector("#brain-S") && document.querySelector("#brain-S").options[0].textContent, hs: document.querySelector('#view-settings [data-seg="view"]').disabled, nb: document.querySelectorAll("#view-settings .nb-tag").length }));
  ok(gs.view === "settings" && gs.groups.join(",") === "MATCH,BOT,PLAY,HOT SEAT,SEED", "Game settings: the five groups " + gs.groups);
  ok(gs.f9 && /^Newest \(Rules v/.test(gs.rs) && /^Default \(/.test(gs.brain) && gs.hs && gs.nb === 3, "9v9 greyed, Newest and Default first, hot-seat view greyed vs a bot, three Not built yet tags");
  await seg("format", "blitz5"); await seg("overtime", "golden"); await seg("dice", "1");
  await click(page, '[data-act="settings-reset"]');
  ok(await page.evaluate(() => { const s = window.GGShots.App.setup; return s.format === "std7" && s.overtime === "none" && s.dice === 2 && s.rulesetId === "newest"; }), "Reset: every Game settings choice back to its default");
  await seg("format", "blitz5");
  await click(page, '#view-settings .footer [data-to="setup"]');
  ok((await txt(page, ".gs-line")).startsWith("5v5 ·"), "Done: back to New game, the line shows 5v5");

  // ---- Lineup: Light only, against the bot ----
  await seg("squad", "light");
  await page.evaluate(() => localStorage.setItem("gg.picks", JSON.stringify({ "blitz5:N": { keeper: null, counts: { HM: 1, LM: 2, LR: 2 } } })));   // a kept lineup with a Heavy unit
  await click(page, '[data-act="setup-next"]'); await page.waitForTimeout(60);
  let lu = await page.evaluate(() => ({ view: window.GGShots.App.view, title: document.querySelector("#view-lineup h2").textContent, note: document.querySelector("#view-lineup .note").textContent,
    locked: [...document.querySelectorAll("#view-lineup .urow.locked .un-name")].map((e) => e.textContent.trim()), bad: [...document.querySelectorAll("#view-lineup .urow.bad .un-name")].map((e) => e.textContent.trim()),
    btn: document.querySelector('[data-act="lineup-next"]').getAttribute("aria-disabled"), pickBot: document.querySelector('[data-act="botpick-open"]') && document.querySelector('[data-act="botpick-open"]').textContent.trim(),
    nums: [...document.querySelectorAll("#view-lineup .urow")].map((r) => r.querySelectorAll(".un").length), ikey: document.querySelector("#view-lineup .ikey").textContent, noUnits: !/Units/.test(document.querySelector("#view-lineup .wrap").textContent.replace(/Unit cap/g, "")) }));
  ok(lu.view === "lineup" && lu.title === "Your lineup", "Lineup: YOUR LINEUP");
  ok(lu.note === "North · Squad rule: Light only. Kept from your last 5v5 game.", "the note: " + lu.note);
  ok(lu.locked.join(",") === "Heavy Ranged,Heavy Anti-Cavalry" && lu.bad.join(",") === "Heavy Melee", `Heavy rows locked; the kept Heavy Melee is kept, marked, not removed (${lu.locked} / ${lu.bad})`);
  ok(lu.btn === "true", "a kept lineup the rule now forbids: Start match greyed");
  ok(lu.pickBot === "Pick South lineup", "Pick South lineup below the rows");
  ok(lu.ikey.replace(/\s+/g, "") === "HPStrengthRangeReachMove" && lu.noUnits, "the icon key; no Units heading");
  await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(40);
  ok((await pill()) === "Heavy Melee is not allowed under Light only. Remove it to start.", "tapping the greyed button names the unit and the rule");
  ok((await page.evaluate(() => window.GGShots.App.view)) === "lineup" && !(await page.evaluate(() => window.GGShots.App.match)), "and no match starts");
  await click(page, '[data-act="lineup-reset"]');
  await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(40);
  ok((await pill()) === "Add one foot unit to hold your flag.", "Reset (no units): Add one foot unit to hold your flag.");
  // F07 row numbers: HP, Strength, Range or Reach or nothing, Move
  const rowNums = await page.evaluate(() => [...document.querySelectorAll("#view-lineup .urow:not(.locked)")].map((r) => [r.querySelector(".un-name").textContent.trim(), [...r.querySelectorAll(".un")].map((u) => u.title).join("/")]));
  ok(JSON.stringify(rowNums) === JSON.stringify([["Light Melee", "HP/Strength/Move"], ["Light Ranged", "HP/Strength/Range/Move"], ["Light Anti-Cavalry", "HP/Strength/Reach/Move"]]), "one line of numbers: Range for Ranged, Reach for Anti-Cavalry, nothing for melee " + JSON.stringify(rowNums));
  ok(await page.evaluate(() => { const b = document.querySelector('.un-name[data-card="LM"]'); return b.getAttribute("aria-label") === "Light Melee: unit information" && !!b.querySelector("svg"); }), "name and info icon are one button");
  await click(page, '.un-name[data-card="LM"]'); ok(await page.evaluate(() => !document.getElementById("lsheet").hidden), "the name opens the unit card");
  await click(page, '[data-act="lineup-card-close"]');
  // Short: 4 of 5
  for (const c of ["LM", "LM", "LR", "LA"]) await click(page, `[data-act="pick-plus"][data-card="${c}"]`);
  await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(30);
  ok((await pill()) === "You're 1 UC short. Tap Start match again to play short." && (await page.evaluate(() => window.GGShots.App.view)) === "lineup", "short: the first tap warns and doesn't start");

  // Pick South lineup
  await click(page, '[data-act="botpick-open"]'); await page.waitForTimeout(30);
  let bl = await page.evaluate(() => ({ title: document.querySelector("#view-lineup h2").textContent, note: document.querySelector("#view-lineup .note").textContent, back: document.querySelector("#view-lineup .backbar button").getAttribute("aria-label"), btn: document.querySelector('[data-act="lineup-next"]').textContent }));
  ok(bl.title === "South lineup" && bl.note === "South · Squad rule: Light only. For this game only." && bl.back === "Back to Your lineup" && bl.btn === "Done", "the bot lineup: SOUTH LINEUP, its note, back arrow and Done");
  await click(page, '[data-act="lineup-reset"]');
  for (const c of ["LR", "LR", "LR", "LA", "LM"]) await click(page, `[data-act="pick-plus"][data-card="${c}"]`);
  await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(30);
  bl = await page.evaluate(() => ({ title: document.querySelector("#view-lineup h2").textContent, blk: document.querySelector(".bp-blk") && document.querySelector(".bp-blk").textContent.replace(/\s+/g, " ") }));
  ok(bl.title === "Your lineup" && /South lineup: picked by you/.test(bl.blk || "") && /5 of 5 UC · Light only/.test(bl.blk || "") && /Edit/.test(bl.blk) && /Clear/.test(bl.blk), "Done: back to Your lineup; the picked block " + bl.blk);
  // Start short: two taps within 4 s
  await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(30);
  await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(150);
  const m1 = await page.evaluate(() => { const m = window.GGShots.App.match; return m && { view: window.GGShots.App.view, rule: m.opts.squadRule, N: m.opts.lineups.N.map((u) => u.card).sort().join(","), S: m.opts.lineups.S.map((u) => u.card).sort().join(","), setup: m.setup }; });
  ok(m1 && m1.view === "play" && m1.rule === "light", "the second tap within 4 s starts; opts.squadRule recorded");
  ok(m1 && m1.N === "LA,LM,LM,LR" && m1.S === "LA,LM,LR,LR,LR", `short squad played as picked (N ${m1 && m1.N}); the picked bot lineup used exactly (S ${m1 && m1.S})`);
  ok(m1 && m1.setup && m1.setup.overtime === "none" && m1.setup.sides.S.personality === "default", "the record keeps the unbuilt set-up choices");
  // Matches header
  await page.evaluate(() => window.GGShots.show("match"));
  ok(/Squad rule Light only/.test(await txt(page, "#view-match .card .note")), "Matches: the current match says Squad rule Light only");

  // Kept for the next game; the seed new; bold for a changed setting
  await fresh();
  const k = await page.evaluate(() => { const s = window.GGShots.App.setup; return { f: s.format, sq: s.squad, seed: s.seed }; });
  ok(k.f === "blitz5" && k.sq === "light", "the next New game keeps format and squad rule");
  ok(k.seed !== m1.seed, "and a new seed");
  ok(!(await page.evaluate(() => document.querySelector(".gs-line b"))), "nothing bold when nothing changed since the last game");
  await click(page, '[data-act="go-settings"]'); await seg("overtime", "flagoff"); await click(page, '#view-settings .footer [data-to="setup"]');
  const bold = await page.evaluate(() => ({ b: [...document.querySelectorAll(".gs-line b")].map((e) => e.textContent), key: document.querySelector(".gs-key") && document.querySelector(".gs-key").textContent }));
  ok(bold.b.join("|") === "Flag Off" && bold.key === "Bold: different from your last game.", "a changed setting is bold, with the key line: " + bold.b);
  await click(page, '[data-act="go-settings"]'); await seg("overtime", "none"); await seg("seedmode", "keep"); await click(page, '#view-settings .footer [data-to="setup"]');
  const kept = await txt(page, "#setup-seed");
  await fresh();
  ok((await txt(page, "#setup-seed")) === kept, "Keep this seed: the next game has the same seed");
  await click(page, '[data-act="go-settings"]'); await seg("seedmode", "new"); await click(page, '#view-settings .footer [data-to="setup"]');

  // ---- startMatch itself refuses an illegal lineup ----
  const direct = await page.evaluate(() => { const G = window.GGShots, A = G.App; A.match = null; A.setup.squad = "heavy"; A.picks = { N: { keeper: null, counts: { LM: 5 } } }; const r = G.startMatch(); return { r, m: !!A.match }; });
  ok(direct.r === false && !direct.m, "startMatch refuses a lineup the squad rule forbids");
  const direct2 = await page.evaluate(() => { const G = window.GGShots, A = G.App; A.setup.squad = "open"; A.picks = { N: { keeper: null, counts: { HM: 9 } } }; return G.startMatch(); });
  ok(direct2 === false, "startMatch refuses an over-cap lineup");

  // ---- Random: straight to deployment, both lineups drawn ----
  await fresh(); await seg("squad", "random");
  await click(page, '[data-act="setup-next"]'); await page.waitForTimeout(150);
  const rnd = await page.evaluate(() => { const G = window.GGShots, m = G.App.match, rs = m.rs, size = G.WT.formatOf(m.opts.format).size; return { view: G.App.view, rule: m.opts.squadRule, legal: ["N", "S"].every((t) => G.Squad.checkLineup(rs, size, m.opts.lineups[t], "random").status === "ok"), same: JSON.stringify(m.opts.lineups.N) === JSON.stringify(G.WT.toLineup(rs, G.WT.squadCounts(rs, size, "random", m.opts.seed, "N"))), mix: m.mix }; });
  ok(rnd.view === "play" && rnd.rule === "random" && rnd.legal && rnd.same, "Random: Start match goes to deployment; the human's lineup is drawn from the seed too");

  // ---- Rematch re-checks; an illegal one can't start ----
  const rm = await page.evaluate(() => {
    const G = window.GGShots, A = G.App, rs = A.rulesets[G.D.PRESETS[G.D.PRESETS.length - 1].id];
    const base = { id: "x", rs, view: "handoff", brains: {}, actions: [], opts: { first: "N", coin: false, seed: "AAA", format: "blitz5", names: { N: "North", S: "South" }, players: { N: { type: "human" }, S: { type: "human" } }, squadRule: "heavy",
      lineups: { N: G.WT.toLineup(rs, { counts: { HM: 5 } }), S: G.WT.toLineup(rs, { counts: { LM: 5 } }) } } };
    A.match = base; const r = G.startRematch({ lineups: true, sides: true, dice: true, newSeed: "B" });
    const r1 = A.match === base;
    base.opts.lineups.S = G.WT.toLineup(rs, { counts: { HR: 5 } }); A.match = base;
    const r2 = G.startRematch({ lineups: true, sides: true, dice: true, newSeed: "B" });
    const old = JSON.parse(JSON.stringify(base)); delete old.opts.squadRule; old.opts.lineups.S = G.WT.toLineup(rs, { counts: { LM: 5 } }); A.match = old;
    const r3 = G.startRematch({ lineups: true, sides: true, dice: true, newSeed: "B" });
    return { r, r1, r2, rule: A.match.opts.squadRule, r3 };
  });
  ok(rm.r === false && rm.r1, "the rematch refuses a lineup that breaks its squad rule");
  ok(rm.r2 === true && rm.r3 === true, "a legal rematch starts; a record without a squad rule reads as Open");

  // ---- Watch link ----
  await load("&watch=TEST-SQUAD-0002&rules=v3.10&format=blitz5&n=brain5&s=brain5&first=N&squad=heavy&fast=1");
  await page.waitForTimeout(400);
  const wl = await page.evaluate(() => { const G = window.GGShots, m = G.App.match; return m && { rule: m.opts.squadRule, legal: ["N", "S"].every((t) => G.Squad.checkLineup(m.rs, 5, m.opts.lineups[t], "heavy").status === "ok") }; });
  ok(wl && wl.rule === "heavy" && wl.legal, "a watch link with a squad rule opens with both lineups inside it");
  await load("&watch=TEST-SQUAD-0003&rules=v3.10&format=blitz5&n=brain5&s=brain5&first=N&squad=cavalry");
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => !document.getElementById("dialog").hidden && /Cavalry only needs 9v9/.test(document.getElementById("dialogbox").textContent) && !window.GGShots.App.match), "a watch link that breaks the squad rule doesn't start");
  await load(); await page.evaluate(() => localStorage.clear()); await load();

  // ---- Hot seat: covers, North then South ----
  await fresh(); await seg("player-S", "human");
  ok(await page.evaluate(() => document.querySelectorAll("#view-setup .nm-inp").length === 2 && !document.querySelector('[data-act="persona-open"]')), "hot seat: two name boxes, no bot settings");
  await click(page, '[data-act="setup-next"]'); await page.waitForTimeout(60);
  let hs = await page.evaluate(() => ({ cover: !document.getElementById("cover").hidden && document.getElementById("coverbox").textContent, title: document.querySelector("#view-lineup h2").textContent, bot: !!document.querySelector('[data-act="botpick-open"]') }));
  ok(hs.cover && /North lineup/.test(hs.cover) && hs.title === "North lineup" && !hs.bot, "hot seat: North's Lineup behind its cover; no Pick lineup button");
  await click(page, '[data-act="cover-ok"]'); await click(page, '[data-act="lineup-next"]'); await page.waitForTimeout(60);
  hs = await page.evaluate(() => ({ cover: !document.getElementById("cover").hidden && document.getElementById("coverbox").textContent, title: document.querySelector("#view-lineup h2").textContent }));
  ok(hs.cover && /South lineup/.test(hs.cover) && hs.title === "South lineup", "then South's, behind its own cover");

  // ---- Desktop: the same screens in one centred column ----
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh();
  const dk = await page.evaluate(() => { const w = document.querySelector("#view-setup .wrap").getBoundingClientRect(); return { w: w.width, x: w.left }; });
  ok(dk.w <= 560 && Math.abs(dk.x - (1280 - dk.w) / 2) < 2, `desktop: one centred column (${dk.w} wide)`);
  await page.setViewportSize({ width: 393, height: 665 });

  // No label in the footers wraps; no horizontal scroll at 393
  for (const v of ["setup", "settings", "lineup"]) {
    await page.evaluate((v) => { const G = window.GGShots; if (v === "lineup") { G.App.lineupQueue = ["N"]; G.App.lineupSide = "N"; G.App.lineupMode = "human"; G.App.picks = { N: { keeper: null, counts: { HM: 7 } } }; } G.show(v); }, v);
    const w = await page.evaluate((v) => ({ sw: document.querySelector(`#view-${v} .scroll`).scrollWidth, cw: document.querySelector(`#view-${v} .scroll`).clientWidth, wrap: [...document.querySelectorAll(`#view-${v} .footer .btn, #view-${v} .seg button`)].some((b) => b.getClientRects().length && b.scrollHeight > b.clientHeight + 2) }), v);
    ok(w.sw <= w.cw && !w.wrap, `${v}: no horizontal scroll, no wrapped button (${w.sw}/${w.cw})`);
  }

  ok(!errors.length, "no page errors: " + errors.join(" | "));
  await browser.close();
  console.log(fails ? `${fails} of ${n} checks failed` : `All ${n} checks passed`);
  process.exit(fails ? 1 : 0);
})();
