// The lab's planner (Brief 008): which job orders to play and how to split them over machines.
// node sims/lab/plan.js [--orders "<paths>"] [--release 1 --release-key <key> --release-why <text>] [--out <folder>]
// Writes GitHub outputs (orders, parts, matrix, has_work, release, why) to $GITHUB_OUTPUT when set, and prints them.
// - orders: the given paths, or every *.json in studies/queue/ (sorted).
// - release (Brief 031): with --release, a release order (the baseline table at 1,000 games per format, newest rule
//   set, the default brain from brain.js against itself) for the board as checked out. Whether one is needed is
//   decided before, by sims/lab/release_files.js (the game key); night checks' health run passes --release too.
// The version comes from board/version.js as stamped (tools/stamp-version.js); an unstamped board stops the run.
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

// A release (Brief 031): the lab's plan step decides whether one is needed (release_files.js: the game key, the
// pull request against its merge-base, main's backlog) and passes --release 1 with --release-key; night checks' health
// run passes --release with a file name. The order is generated from the board as it is checked out (the planned commit).
let release = "", why = opt["release-why"] || "";
const wantRelease = !!opt.release;
const before = null;
{
  if (wantRelease) {
    if (!V.game) { console.error("board/version.js is not stamped: run tools/stamp-version.js first (Brief 031: no unstamped results)."); process.exit(1); }
    // The default opponent: brain.js's DEFAULT_OPPONENT (Brief 031, H4). No silent fallback: a missing one stops the run.
    const brain = BR.DEFAULT_OPPONENT, rules = D.PRESETS[D.PRESETS.length - 1].id;
    if (!brain || !BR.DEFAULT_BRAINS[brain]) { console.error(`board/brain.js has no usable DEFAULT_OPPONENT (${brain}): the release run can't tell which brain to play.`); process.exit(1); }
    const order = { id: `release-${V.game.replace(/[^\w]+/g, "-")}`, kind: "release", brief: null,
      question: `${V.game}'s final exam: how do games end with the default brain (${BR.DEFAULT_BRAINS[brain].name}) against itself, newest rule set ${rules}, 1,000 games per format?`,
      tags: ["release", brain, rules], measures: ["play", "evade", "light", "clock"],
      matchups: [
        { name: "5v5", a: brain, b: brain, rules, format: "blitz5", mix: "mixed", games: +(opt["release-games"] || 1000) },
        { name: "7v7", a: brain, b: brain, rules, format: "std7", mix: "mixed", games: +(opt["release-games"] || 1000) }
      ], extra: { previous_version: before, game_key: opt["release-key"] || null, why: why || null } };
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
const out = { orders: all.join(" "), parts, matrix: JSON.stringify({ part: Array.from({ length: parts }, (_, i) => i) }), has_work: all.length && !problems.length ? "true" : "false", release: release ? "true" : "false", why, games, problems: problems.join(" | ") };
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(out).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
console.log(JSON.stringify(out, null, 1));
if (problems.length) { console.error("Job order problems:\n- " + problems.join("\n- ")); process.exit(1); }
