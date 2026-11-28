// Brief 030's screenshots (Approved UI v8, frames F01 to F10) at 393 × 665, plus the whole scrolled screen for the
// tall ones, and desktop New game, Game settings and Lineup. F09 uses a test unit list with two mounted cards (Brief
// 012 adds the real ones). node sims/shots_030.js   → briefs/img/030/build/
"use strict";
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const out = path.join(__dirname, "..", "briefs", "img", "030", "build");
fs.mkdirSync(out, { recursive: true });
const url = "file://" + path.join(__dirname, "..", "board", "index.html") + "?shots=1";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 393, height: 665 }, deviceScaleFactor: 2, hasTouch: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const click = (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
  const seg = (n, v) => click(`[data-seg="${n}"][data-val="${v}"]`);
  const shoot = async (name, full) => {
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, name + ".png") });
    if (full) {
      const view = await page.evaluate(() => document.querySelector(".view:not([hidden])").id);
      const h = await page.evaluate((v) => document.querySelector(`#${v} .scroll`).scrollHeight, view);
      if (h > 665) { await page.setViewportSize({ width: 393, height: h }); await page.waitForTimeout(150); await page.screenshot({ path: path.join(out, name + "-full.png") }); await page.setViewportSize({ width: 393, height: 665 }); }
    }
    console.log(name);
  };
  const load = async () => { await page.goto(url); await page.waitForFunction(() => window.GGShots && document.querySelector('[data-act="new"]')); await page.waitForTimeout(150); };
  await load(); await page.evaluate(() => localStorage.clear()); await load();
  const fresh = async () => { await page.evaluate(() => { const G = window.GGShots; G.App.match = null; G.App.st = null; G.Store.clearLive(); G.show("home"); }); await click('[data-act="new"]'); await page.evaluate(() => { window.GGShots.App.setup.seed = "R28X-AJDH-DUP5"; window.GGShots.show("setup"); }); };

  await fresh(); await page.evaluate(() => { window.GGShots.App.setup.players.N.name = "You"; window.GGShots.show("setup"); });
  await shoot("F01-new-game-vs-bot", true);
  // F01b: one game played, then a setting changed: bold in the line
  await page.evaluate(() => { const G = window.GGShots; G.Store.local("lastGame", Object.fromEntries(G.settingsItems(G.App.setup).map(([k, , v]) => [k, v]))); G.App.setup.overtime = "golden"; G.App.setup.dice = 1; G.show("setup"); });
  await page.evaluate(() => { const g = document.querySelector(".gs-btn"); g.scrollIntoView({ block: "center" }); });
  await page.waitForTimeout(100); await page.screenshot({ path: path.join(out, "F01b-bold-settings-line.png") }); console.log("F01b");
  await page.evaluate(() => { const s = window.GGShots.App.setup; s.overtime = "none"; s.dice = 2; });
  await seg("player-S", "human"); await page.evaluate(() => { window.GGShots.App.setup.players.S.name = "Friend"; window.GGShots.show("setup"); });
  await shoot("F02-hot-seat", true);
  await seg("player-S", "bot"); await seg("squad", "random"); await page.evaluate(() => { document.querySelector("#view-setup .scroll").scrollTop = 99999; });
  await shoot("F03-random");
  await seg("squad", "open");
  await page.evaluate(() => { document.querySelector("#view-setup .scroll").scrollTop = 0; });
  await click('[data-act="persona-open"]');
  await page.evaluate(() => { for (const [k, v] of [["agg", 70], ["close", 35]]) { const r = document.querySelector(`#psheet [data-persona="${k}"]`); r.value = String(v); r.dispatchEvent(new Event("input", { bubbles: true })); } });
  await shoot("F04-personality");
  await click('[data-act="persona-done"]'); await click('[data-act="pick-persona"][data-dir="1"]');
  await shoot("F05-discard-prompt");
  await click('#dialogbox [data-dlg="keep"]');
  await click('[data-act="go-settings"]');
  await shoot("F06-game-settings", true);
  await click('#view-settings .footer [data-to="setup"]');
  await page.evaluate(() => localStorage.setItem("gg.picks", JSON.stringify({ "std7:N": { keeper: null, counts: { HM: 1, LM: 2, HR: 1, LR: 1, HA: 1, LA: 1 } } })));
  await click('[data-act="setup-next"]');
  await shoot("F07-your-lineup", true);
  await click('[data-act="pick-minus"][data-card="LM"]'); await click('[data-act="lineup-next"]');
  await shoot("F08-short-squad");
  // F10: Light only, the bot lineup
  await page.evaluate(() => { const G = window.GGShots; G.App.setup.squad = "light"; G.App.picks.N = { keeper: null, counts: { LM: 3, LR: 2, LA: 2 } }; G.App.lineupShortAt = 0; G.show("lineup"); });
  await click('[data-act="botpick-open"]');
  await shoot("F10-bot-lineup", true);
  await click('[data-act="lineup-next"]'); await page.waitForTimeout(100);
  await page.evaluate(() => { document.querySelector("#view-lineup .scroll").scrollTop = 99999; });
  await shoot("F10b-bot-lineup-picked");
  // F09: Cavalry only at 9v9 on a test unit list (after 012 this is a real rule set)
  await page.evaluate(() => {
    const G = window.GGShots, A = G.App, base = A.rulesets[G.D.PRESETS[G.D.PRESETS.length - 1].id], rs = JSON.parse(JSON.stringify(base));
    rs.id = "test-cav"; rs.name = "Test list (two mounted cards)";
    const HC = Object.assign({}, rs.cards.HM, { icon: "heavyCav", name: "Heavy Cavalry", beings: 2, mounted: true }), LC = Object.assign({}, rs.cards.LM, { icon: "lightCav", name: "Light Cavalry", beings: 2, mounted: true });
    const cards = {}; for (const k of ["HM", "LM", "HR", "LR"]) cards[k] = rs.cards[k]; cards.HC = HC; cards.LC = LC; for (const k of ["HA", "LA"]) cards[k] = rs.cards[k]; rs.cards = cards;
    A.rulesets[rs.id] = rs; A.setup.rulesetId = rs.id; A.setup.format = "s9"; A.setup.squad = "cavalry";
    A.picks = { N: { keeper: null, counts: { HC: 2, LC: 2 } } }; A.lineupQueue = ["N"]; A.lineupSide = "N"; A.lineupMode = "human"; A.lineupKept = {}; G.show("lineup");
  });
  await click('[data-act="lineup-next"]');
  await shoot("F09-rule-broken-after-012", true);
  // Desktop
  await page.setViewportSize({ width: 1280, height: 800 });
  await fresh(); await shoot("D1-desktop-new-game");
  await click('[data-act="go-settings"]'); await shoot("D2-desktop-game-settings");
  await click('#view-settings .footer [data-to="setup"]'); await click('[data-act="setup-next"]'); await shoot("D3-desktop-lineup");
  await browser.close();
})();
