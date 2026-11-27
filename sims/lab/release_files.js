// Which board files can change a game, and whether a change needs a release run (Brief 031).
// Game files: the rules, the bot, the brains, the numbers, the fields, and watch.js (the lab plays every game through
// it). Screen files: what the board draws. A change to a game file gets the 2,000-game release run; a screen-only
// change gets none (its replay hashes must equal its base's: the checks workflow's compare job). Any other board file
// (a new one, say) gets a release run only if the replay hashes differ.
//   node sims/lab/release_files.js --base <commit> [--head HEAD]   prints the decision as JSON
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");

const GAME = ["engine.js", "bot.js", "brain.js", "data.js", "fields.js", "watch.js"].map((f) => `board/${f}`);
const SCREEN = ["app.js", "ui.js", "skin.js", "index.html"].map((f) => `board/${f}`);
// Never part of a game: the stamped version line and the tests.
const IGNORED = (f) => f === "board/version.js" || f.startsWith("board/tests/");

const git = (root, args) => cp.execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });

/** Sort changed paths into game, screen and other board files (non-board paths are dropped). */
function classify(files) {
  const board = files.filter((f) => f.startsWith("board/") && !IGNORED(f));
  return { game: board.filter((f) => GAME.includes(f)), screen: board.filter((f) => SCREEN.includes(f)), other: board.filter((f) => !GAME.includes(f) && !SCREEN.includes(f)) };
}
/** Docs only: every path is under briefs/ or flags/, or a .md file outside board/ and sims/. */
function docsOnly(files) {
  return files.length > 0 && files.every((f) => /^(briefs|flags)\//.test(f) || (/\.md$/.test(f) && !/^(board|sims)\//.test(f)));
}
/** The replay hashes (regress_engine.js, every preset including the newest when `all`) of a board folder. */
function hashes(boardDir, games, all) {
  const script = path.join(__dirname, "..", "..", "board", "tests", "regress_engine.js");
  return cp.execFileSync("node", [script, boardDir, String(games || 3)].concat(all ? ["all"] : []), { encoding: "utf8", maxBuffer: 64 << 20 });
}
/** The board as it was at a commit, in a temporary folder. */
function boardAt(root, commit) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ffboard-"));
  cp.execSync(`git -C "${root}" archive "${commit}" board | tar -x -C "${dir}"`);
  return path.join(dir, "board");
}

/** { release, why, files, beforeVersion }: does the change from base to head need a release run? */
function decide(root, base, head) {
  let files = [];
  try { files = git(root, ["diff", "--name-only", "--no-renames", base, head || "HEAD"]).split("\n").filter(Boolean); } catch (e) { return { release: false, why: `could not compare with ${base}`, files: [], beforeVersion: null }; }
  const c = classify(files);
  let beforeVersion = null;
  try { beforeVersion = require(path.join(root, "tools", "stamp-version.js")).countAt(root, base).game; } catch (e) { beforeVersion = null; }
  if (c.game.length) return { release: true, why: `game files changed: ${c.game.join(", ")}`, files: c, beforeVersion };
  if (c.other.length) {
    const a = hashes(boardAt(root, base)), b = hashes(path.join(root, "board"));
    if (a !== b) return { release: true, why: `replay hashes differ (changed: ${c.other.join(", ")})`, files: c, beforeVersion };
    return { release: false, why: `replay hashes equal (changed: ${c.other.join(", ")})`, files: c, beforeVersion };
  }
  if (c.screen.length) return { release: false, why: `screen files only: ${c.screen.join(", ")}`, files: c, beforeVersion };
  return { release: false, why: "no game or screen file changed", files: c, beforeVersion };
}

module.exports = { GAME, SCREEN, classify, docsOnly, decide, hashes, boardAt };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
  const root = path.join(__dirname, "..", "..");
  console.log(JSON.stringify(decide(root, opt.base, opt.head || "HEAD"), null, 1));
}
