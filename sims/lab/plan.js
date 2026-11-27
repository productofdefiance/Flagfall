// The lab's planner (Brief 008): which job orders to play and how to split them over machines.
// node sims/lab/plan.js [--orders "<paths>"] [--release-base <commit>] [--release <earlier version.js file>] [--out <folder>]
// Writes GitHub outputs (orders, parts, matrix, has_work, release, same, why) to $GITHUB_OUTPUT when set, and prints them.
// - orders: the given paths, or every *.json in studies/queue/ (sorted).
// - release (Brief 031): a release order (the baseline table at 1,000 games per format, newest rule set, the default
//   brain against itself) is generated when the board changed since --release-base in a way that can change a game:
//   a game file changed (release_files.js), or a board file that is neither a game nor a screen file changed and the
//   replay hashes differ. A screen-only change gets no release; on main its new version gets a "same games as" line
//   instead (`same=true`, sims/lab/same.js).
// - --release <file> (night checks' health run): generated whenever the stamped version differs from that file's.
// The version comes from board/version.js as stamped (tools/stamp-version.js).
"use strict";
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
const root = path.join(__dirname, "..", "..");
const board = path.join(root, "board");
const V = require(path.join(board, "version.js")), D = require(path.join(board, "data.js")), BR = require(path.join(board, "brain.js"));
const { check, gamesOf } = require("./order.js");
const outDir = opt.out || path.join(root, "studies", "queue");

let orders = (opt.orders || "").split(/\s+/).filter(Boolean);
if (!orders.length && !opt["release-only"]) {
  const q = path.join(root, "studies", "queue");
  orders = fs.existsSync(q) ? fs.readdirSync(q).filter((f) => f.endsWith(".json")).sort().map((f) => path.join("studies", "queue", f)) : [];
}

// A release: the game changed since --release-base (Brief 031), or (night checks) the version differs from a file's.
let release = "", same = false, why = "";
let wantRelease = false, before = null;
if (opt["release-base"]) {
  const RF = require("./release_files.js");
  const d = RF.decide(root, opt["release-base"], "HEAD");
  wantRelease = d.release; why = d.why;
  before = d.beforeVersion;
  // On main, a new version with no release run points to the last version that had one.
  same = !d.release && !!opt.main && !!V.game && d.beforeVersion !== null && d.beforeVersion !== V.game;
} else if (opt.release) {
  try { const src = fs.readFileSync(opt.release, "utf8"); const m = /game:\s*"([^"]+)"/.exec(src); before = m ? m[1] : null; } catch (e) { before = null; }
  wantRelease = !!V.game && V.game !== before; why = "the version changed";
}
{
  if (wantRelease) {
    // The default opponent: the brain a new match gives the computer side (app.js defaultSetup).
    const app = fs.readFileSync(path.join(board, "app.js"), "utf8"), m = /S:\s*\{\s*type:\s*"bot",\s*brainId:\s*"([\w-]+)"/.exec(app);
    const brain = m && BR.DEFAULT_BRAINS[m[1]] ? m[1] : "brain5", rules = D.PRESETS[D.PRESETS.length - 1].id;
    const order = { id: `release-${V.game.replace(/[^\w]+/g, "-")}`, kind: "release", brief: null,
      question: `${V.game}'s final exam: how do games end with the default brain (${BR.DEFAULT_BRAINS[brain].name}) against itself, newest rule set ${rules}, 1,000 games per format?`,
      tags: ["release", brain, rules], measures: ["play", "evade", "light", "clock"],
      matchups: [
        { name: "5v5", a: brain, b: brain, rules, format: "blitz5", mix: "mixed", games: +(opt["release-games"] || 1000) },
        { name: "7v7", a: brain, b: brain, rules, format: "std7", mix: "mixed", games: +(opt["release-games"] || 1000) }
      ], extra: { previous_version: before } };
    fs.mkdirSync(outDir, { recursive: true });
    release = path.join(outDir, order.id + ".json");
    fs.writeFileSync(release, JSON.stringify(order, null, 1) + "\n");
  }
}
if (release && opt["release-only"]) orders = [];
const all = orders.concat(release ? [path.relative(process.cwd(), release)] : []);

// Check every order; a broken one stops the run with its problems in plain words.
const known = { rules: (id) => D.PRESETS.concat([D.DEFAULT_RULESET]).some((p) => p.id === id), brain: (id) => !!BR.DEFAULT_BRAINS[id] };
let games = 0; const problems = [];
for (const f of all) {
  let o; try { o = JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { problems.push(`${f}: not valid JSON (${e.message})`); continue; }
  for (const p of check(o, known)) problems.push(`${f}: ${p}`);
  games += gamesOf(o).length;
}
// Up to 20 machines, at least about 25 games each.
const parts = Math.max(1, Math.min(20, Math.ceil(games / 25)));
const out = { orders: all.join(" "), parts, matrix: JSON.stringify({ part: Array.from({ length: parts }, (_, i) => i) }), has_work: all.length && !problems.length ? "true" : "false", release: release ? "true" : "false", same: same ? "true" : "false", why, games, problems: problems.join(" | ") };
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(out).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
console.log(JSON.stringify(out, null, 1));
if (problems.length) { console.error("Job order problems:\n- " + problems.join("\n- ")); process.exit(1); }
