// When a release run is needed (Brief 031 with amendments 2 and 6).
//
// The game key: a hash of everything that decides which games a release run plays: the six game files (the rules,
// the bot, the brains, the numbers, the fields, and watch.js, through which the lab plays every game),
// board/tests/rng.js (seeds every lab game) and the lab's play scripts (sims/lab/play.js, order.js, plan.js).
// It is read from git's own file ids, so it needs no file contents and works in a blobless clone.
//
// A pull request: decided from the whole pull request against its merge-base with main, on every run (never from
// the last push). A release run is needed when the game key differs from the merge-base's, when its releases file
// names a new `rules` or `brain`, or when another board file (neither game nor screen) changed and the replay hashes
// differ. It is skipped only when a finished run with the same key exists (the lab's comment on the pull request
// carries the key).
//
// main: each lab run lists every version since the baseline that has neither a filed release run nor a "same games as"
// line. Oldest first: a version whose key matches a filed release run (and that names no new rules or brain) gets a
// "same games as" line; the first one that doesn't is played at its own commit. If more are left, the lab starts
// itself again. So merges close together never drop a release run, though GitHub keeps only one waiting lab run.
//   node sims/lab/release_files.js --base <commit> [--head HEAD]   the pull request decision, as JSON
//   node sims/lab/release_files.js --main [--results results]      main's backlog, as JSON
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");

const GAME = ["engine.js", "bot.js", "brain.js", "data.js", "fields.js", "watch.js"].map((f) => `board/${f}`);
const SCREEN = ["app.js", "ui.js", "skin.js", "index.html"].map((f) => `board/${f}`);
const KEYED = GAME.concat(["board/tests/rng.js", "sims/lab/play.js", "sims/lab/order.js", "sims/lab/plan.js"]);
// Never part of a game: the stamped version line and the tests (rng.js is in the key on its own).
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
/** The game key at a commit: sha-256 over the git ids of the keyed files (a missing file counts as "-"). */
function gameKey(root, ref) {
  const h = require("crypto").createHash("sha256");
  for (const f of KEYED) { let id = "-"; try { id = git(root, ["rev-parse", `${ref}:${f}`]).trim(); } catch (e) { id = "-"; } h.update(`${f} ${id}\n`); }
  return h.digest("hex").slice(0, 16);
}
/** The replay hashes (regress_engine.js) of a board folder. */
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
/** The releases file a range adds, parsed (null if none). */
function releaseAdded(root, from, to) {
  const SV = require(path.resolve(root, "tools", "stamp-version.js"));
  const id = SV.prBrief(root, from, to);
  if (!id) return null;
  try { return Object.assign({ id }, JSON.parse(git(root, ["show", `${to}:releases/${id}.json`]))); } catch (e) { return null; }
}

/** The pull request decision: { release, why, key, baseKey, from } for head against its merge-base with main.
    done(key) → true when a finished release run with that key exists (the lab's comments on the pull request). */
function decidePr(root, main, head, done) {
  head = head || "HEAD";
  const from = git(root, ["merge-base", main, head]).trim();
  const key = gameKey(root, head), baseKey = gameKey(root, from);
  const files = git(root, ["diff", "--name-only", "--no-renames", from, head]).split("\n").filter(Boolean);
  const c = classify(files), rel = releaseAdded(root, from, head);
  let why = null;
  if (key !== baseKey) why = `the game key changed (${KEYED.filter((f) => files.includes(f)).join(", ") || "keyed files"})`;
  else if (rel && (rel.rules || rel.brain)) why = `releases/${rel.id}.json names ${rel.rules ? `rules ${rel.rules}` : ""}${rel.rules && rel.brain ? " and " : ""}${rel.brain ? `brain ${rel.brain}` : ""}`;
  else if (c.other.length && hashes(boardAt(root, from)) !== hashes(path.join(root, "board"))) why = `replay hashes differ (changed: ${c.other.join(", ")})`;
  if (!why) return { release: false, why: c.screen.length ? `screen files only: ${c.screen.join(", ")}` : "the game is unchanged", key, baseKey, from };
  if (done && done(key)) return { release: false, why: `${why}, but a finished release run with key ${key} exists`, key, baseKey, from };
  return { release: true, why, key, baseKey, from };
}

/** Filed release runs and "same games as" lines: { runs: [{ version, key, path }], same: Set(version) }. */
function filed(root, results) {
  const idx = require("./index.js");
  const rows = idx.collect(results);
  const runs = [];
  for (const r of rows.filter((x) => x.kind === "release" && x.path)) {
    let key = null;
    try {
      const run = JSON.parse(fs.readFileSync(path.join(results, r.path, "run.json"), "utf8"));
      key = (run.extra && run.extra.game_key) || (run.commit ? gameKey(root, run.commit) : null);
    } catch (e) { key = null; }
    runs.push({ version: r.version, key, path: r.path });
  }
  return { runs, same: new Set(rows.filter((x) => x.kind === "same").map((x) => x.version)) };
}
/** Release runs and same-games lines waiting in open results pull requests (lab/*), not yet merged into main
    (review F1): counted as filed, so a lab run that plans before such a pull request merges doesn't play the same
    version again. refs: git refs of those pull requests' heads. Returns { runs: [{ version, key, path }], same: [versions] }. */
function pending(root, refs, main) {
  const out = { runs: [], same: [] };
  for (const ref of refs || []) {
    let names = [];
    try { names = git(root, ["diff", "--name-only", "--diff-filter=AM", `${main}...${ref}`, "--", "results/"]).split("\n").filter(Boolean); } catch (e) { continue; }
    for (const f of names) {
      if (/\/run\.json$/.test(f)) {
        try {
          const run = JSON.parse(git(root, ["show", `${ref}:${f}`]));
          if (run.kind === "release") out.runs.push({ version: run.version, key: (run.extra && run.extra.game_key) || (run.commit ? gameKey(root, run.commit) : null), path: path.dirname(f).replace(/^results\//, ""), pending: true });
        } catch (e) { /* not readable: ignore */ }
      } else if (f === "results/same.csv") {
        try {
          const idx = require("./index.js"), tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ffsame-"));
          fs.writeFileSync(path.join(tmp, "same.csv"), git(root, ["show", `${ref}:${f}`]));
          for (const r of idx.collect(tmp)) if (r.kind === "same") out.same.push(r.version);
        } catch (e) { /* ignore */ }
      }
    }
  }
  return out;
}
/** main's backlog: versions since the baseline with neither a filed release run nor a same line, oldest first.
    `waiting`: what open results pull requests already carry (pending()). Returns { same: [{ version, sha, to }],
    play: { version, build, date, sha, key } | null, more: bool }. */
function backlog(root, results, ref, waiting) {
  const SV = require(path.resolve(root, "tools", "stamp-version.js"));
  const c = SV.countAt(root, ref || "HEAD");
  const f = filed(root, results);
  if (waiting) { f.runs.push(...waiting.runs); for (const v of waiting.same) f.same.add(v); }
  const versions = [], seenV = new Set();
  for (const h of c.history) {
    if (!h.brief || h.bump === "none" || seenV.has(h.game)) continue;
    seenV.add(h.game);
    versions.push(h);
  }
  const missing = versions.filter((v) => !f.same.has(v.game) && !f.runs.some((r) => r.version === v.game));
  const same = [];
  let play = null;
  for (const v of missing) {
    const key = gameKey(root, v.sha);
    const match = !v.rules && !v.brain ? f.runs.find((r) => r.key === key) : null;
    if (match) { same.push({ version: v.game, sha: v.sha, to: match.version, path: match.path }); continue; }
    play = { version: v.game, build: v.build, date: v.date, sha: v.sha, key, brief: v.brief };
    break;
  }
  const more = !!play && missing.indexOf(missing.find((v) => v.game === play.version)) < missing.length - 1;
  return { same, play, more };
}

module.exports = { GAME, SCREEN, KEYED, classify, docsOnly, gameKey, decidePr, backlog, filed, pending, hashes, boardAt };

/** The lab's plan step: what this run plays, written to $GITHUB_OUTPUT.
    pr: { number, main, keysDone: [keys of finished runs posted on the pull request] } or null (a run on main). */
function plan(root, results, pr, waiting) {
  if (pr) {
    const d = decidePr(root, pr.main, "HEAD", (k) => (pr.keysDone || []).includes(k));
    return { release: d.release, why: d.why, key: d.key, sha: git(root, ["rev-parse", "HEAD"]).trim(), same: [], more: false, target: null };
  }
  const b = backlog(root, results, "HEAD", waiting);
  return { release: !!b.play, why: b.play ? `${b.play.version} has no release run yet` : "every version has its release run or a same-games line", key: b.play ? b.play.key : "",
    sha: b.play ? b.play.sha : git(root, ["rev-parse", "HEAD"]).trim(), same: b.same, more: b.more, target: b.play };
}
module.exports.plan = plan;

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[++i] : true;
  const root = path.join(__dirname, "..", "..");
  if (opt.plan) {
    let pr = null;
    if (opt.pr) {
      // The keys of finished release runs on this pull request: the lab's comments carry "release-key: <key>".
      let bodies = "";
      try { bodies = cp.execFileSync("gh", ["api", "--paginate", `repos/${process.env.GITHUB_REPOSITORY}/issues/${opt.pr}/comments`, "--jq", ".[].body"], { encoding: "utf8", maxBuffer: 64 << 20 }); } catch (e) { bodies = ""; }
      pr = { number: opt.pr, main: typeof opt.main === "string" ? opt.main : "origin/main", keysDone: [...bodies.matchAll(/release-key: ([0-9a-f]{16})/g)].map((m) => m[1]) };
    }
    // main: release runs already waiting in open results pull requests count as filed (review F1).
    let waiting = null;
    if (!pr) {
      try {
        const labs = JSON.parse(cp.execFileSync("gh", ["pr", "list", "--repo", process.env.GITHUB_REPOSITORY, "--state", "open", "--limit", "100", "--json", "number,headRefName"], { encoding: "utf8" })).filter((x) => /^lab\//.test(x.headRefName));
        if (labs.length) git(root, ["fetch", "-q", "--filter=blob:none", "origin", ...labs.map((x) => `+refs/pull/${x.number}/head:refs/labpending/${x.number}`)]);
        waiting = pending(root, labs.map((x) => `refs/labpending/${x.number}`), "origin/main");
        if (labs.length) console.log(`Waiting in open results pull requests: ${waiting.runs.map((r) => r.version).concat(waiting.same).join(", ") || "no release runs"}`);
      } catch (e) { console.log(`Could not read the open results pull requests (${e.message.split("\n")[0]}); planning from main alone.`); }
    }
    const p = plan(root, path.join(root, "results"), pr, waiting);
    const out = { release: String(p.release), why: p.why, key: p.key, sha: p.sha, same: JSON.stringify(p.same), more: String(p.more),
      target_game: p.target ? p.target.version : "", target_build: p.target ? String(p.target.build) : "", target_date: p.target ? p.target.date : "" };
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(out).map(([k, v]) => `${k}=${v}`).join("\n") + "\n");
    console.log(JSON.stringify(out, null, 1));
  } else if (opt.main) console.log(JSON.stringify(backlog(root, path.resolve(typeof opt.results === "string" ? opt.results : path.join(root, "results"))), null, 1));
  else console.log(JSON.stringify(decidePr(root, opt.base || "origin/main", opt.head || "HEAD", null), null, 1));
}
