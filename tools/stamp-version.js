#!/usr/bin/env node
/* Flagfall Arena — the one place a game version is worked out (Brief 031).
 *
 * The repository never holds a version number: board/version.js keeps `game: null, build: null`. This script counts
 * the number from the order builds merged into main and writes it into the working copy's board/version.js. It never
 * commits. Publishing, the lab, night checks, the status board and the tests all get the number from here (CLI or the
 * module exports below). Nothing else works out a version.
 *
 * How it counts: releases/BASE.json holds main's version, build and commit when Brief 031 took over. Walk main's
 * first-parent history after that commit, oldest first. A commit that adds releases/NNN.json applies its bump
 * (X → next X.00.00, YY → next YY with ZZ at 00, ZZ → next ZZ, none → no change). A commit that changes board/ adds
 * 1 to the build. Merge commits and squash merges count the same way (each is one first-parent commit).
 *
 *   node tools/stamp-version.js                 stamp main's number (the history of HEAD, or --ref)
 *   node tools/stamp-version.js --pr            stamp a pull request's label: "<main's version>+NNN", build null
 *   node tools/stamp-version.js --print         print the count as JSON, write nothing
 *   node tools/stamp-version.js --history       print every version since the baseline, as JSON
 *   options: --ref <commit> (default HEAD; with --pr, the main to count: origin/main), --repo <dir>, --pr-number <n>
 *
 * Needs the history from the baseline commit on; a blobless clone (`--filter=blob:none`) is enough, since only file
 * names are read from the history and the releases files themselves are read from the working copy (they are
 * append-only, so a file's content at HEAD is the content it was added with). */
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");

const BUMPS = ["X", "YY", "ZZ", "none"];
const pad2 = (n) => String(n).padStart(2, "0");

/** "v3.20.00" → [3, 20, 0]; null when it isn't a version. */
function parse(v) { const m = /^v(\d+)\.(\d{2})\.(\d{2})$/.exec(String(v || "")); return m ? m.slice(1).map(Number) : null; }
function format(p) { return `v${p[0]}.${pad2(p[1])}.${pad2(p[2])}`; }
/** The version after `game` for a bump of this size. */
function bump(game, size) {
  const p = parse(game);
  if (!p) throw new Error(`not a version: ${game}`);
  if (size === "X") return format([p[0] + 1, 0, 0]);
  if (size === "YY") return format([p[0], p[1] + 1, 0]);
  if (size === "ZZ") return format([p[0], p[1], p[2] + 1]);
  if (size === "none") return game;
  throw new Error(`not a bump size: ${size} (X, YY, ZZ or none)`);
}
/** releases/NNN.json → "NNN" (null for BASE.json or anything else). */
function briefOfFile(f) { const m = /^releases\/(\d{3})\.json$/.exec(f); return m ? m[1] : null; }

/** Check one releases file's content; [] when it's fine. */
function problems(rel, file) {
  const out = [], b = file ? briefOfFile(file) : null;
  if (!rel || typeof rel !== "object") return [`${file || "release"}: not a JSON object`];
  if (!/^\d{3}$/.test(String(rel.brief || ""))) out.push(`${file}: "brief" must be the three-digit brief number`);
  else if (b && rel.brief !== b) out.push(`${file}: "brief" says ${rel.brief} but the file is named ${b}`);
  if (!BUMPS.includes(rel.bump)) out.push(`${file}: "bump" must be X, YY, ZZ or none (got ${JSON.stringify(rel.bump)})`);
  for (const k of ["rules", "brain", "ui"]) if (!(k in rel) || (rel[k] !== null && typeof rel[k] !== "string")) out.push(`${file}: "${k}" must be a string or null`);
  return out;
}

/** The count, from a baseline and a list of first-parent commits (oldest first):
 *  commits: [{ sha, date, added: ["releases/029.json", …], board: true|false }]
 *  read(file): the parsed releases file (from the working copy).
 *  Returns { game, build, date, commit, history: [{ game, build, brief, bump, rules, brain, ui, sha, date }] }. */
function count(base, commits, read) {
  let game = base.game, build = base.build, date = base.date || null, commit = base.commit;
  const history = [];
  for (const c of commits) {
    const briefs = c.added.map(briefOfFile).filter(Boolean).sort();
    let changed = false;
    for (const b of briefs) {
      const rel = read(`releases/${b}.json`);
      const bad = problems(rel, `releases/${b}.json`);
      if (bad.length) throw new Error(bad.join("; "));
      game = bump(game, rel.bump);
      history.push({ game, build: null, brief: b, bump: rel.bump, rules: rel.rules, brain: rel.brain, ui: rel.ui, sha: c.sha, date: c.date });
      changed = true;
    }
    if (c.board) { build += 1; changed = true; }
    if (changed) {
      date = c.date; commit = c.sha;
      // Builds added in this commit carry the build number the commit ends on.
      for (const h of history) if (h.sha === c.sha) h.build = build;
      if (!briefs.length) history.push({ game, build, brief: null, bump: null, rules: null, brain: null, ui: null, sha: c.sha, date: c.date });
    }
  }
  return { game, build, date, commit, history };
}

// ---------- git ----------
function git(repo, args) { return cp.execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 256 << 20, stdio: ["ignore", "pipe", "pipe"] }); }
function hasCommit(repo, sha) { try { git(repo, ["cat-file", "-e", `${sha}^{commit}`]); return true; } catch (e) { return false; } }

/** First-parent commits after `base` up to `ref`, oldest first, with the files each adds and whether it touches board/. */
function commitsSince(repo, base, ref) {
  if (!hasCommit(repo, base)) throw new Error(`the baseline commit ${base} is not in this clone: fetch main's history (actions/checkout with fetch-depth: 0 and filter: blob:none)`);
  // --diff-merges=first-parent: a merge commit is compared with main as it was before the merge.
  const out = git(repo, ["log", "--first-parent", "--reverse", "--diff-merges=first-parent", "--no-renames", "--format=%x01%H %cI", "--name-status", `${base}..${ref}`]);
  const commits = [];
  for (const block of out.split("\x01").slice(1)) {
    const lines = block.split("\n").filter(Boolean);
    const [sha, iso] = lines[0].split(" ");
    const added = [], touched = [];
    for (const l of lines.slice(1)) { const [st, f] = l.split("\t"); if (!f) continue; touched.push(f); if (st === "A") added.push(f); }
    commits.push({ sha, date: iso.slice(0, 10), added, board: touched.some((f) => f.startsWith("board/")) });
  }
  return commits;
}

/** Read releases files from a working copy, or from a commit (`git show`) when `at` is given. */
function reader(repo, at) {
  return (f) => {
    const text = at ? git(repo, ["show", `${at}:${f}`]) : fs.readFileSync(path.join(repo, f), "utf8");
    return JSON.parse(text);
  };
}
function readBase(repo, at) {
  const text = at ? git(repo, ["show", `${at}:releases/BASE.json`]) : fs.readFileSync(path.join(repo, "releases", "BASE.json"), "utf8");
  return JSON.parse(text);
}

/** main's number at `ref` (default HEAD). `at`: read the releases files from that commit instead of the working copy. */
function countAt(repo, ref, at) {
  ref = ref || "HEAD";
  const base = readBase(repo, at);
  return count(base, commitsSince(repo, base.commit, ref), reader(repo, at));
}

/** The brief a pull request adds a releases file for (compared with main), or null. */
function prBrief(repo, mainRef) {
  const out = git(repo, ["diff", "--name-only", "--diff-filter=A", `${mainRef}...HEAD`, "--", "releases/"]);
  const b = out.split("\n").map(briefOfFile).filter(Boolean);
  return b.length === 1 ? b[0] : null;
}
/** "<main's version>+NNN" (a pull request's honest, unchanging label). */
function label(mainGame, brief, prNumber) { return `${mainGame}+${brief || (prNumber ? `pr${prNumber}` : "dev")}`; }

/** Write game, build and date into board/version.js (working copy only). */
function stamp(repo, v) {
  const f = path.join(repo, "board", "version.js");
  const src = fs.readFileSync(f, "utf8");
  const re = /game:\s*(null|"[^"]*"),\s*build:\s*(null|\d+),\s*date:\s*(null|"[^"]*")/;
  if (!re.test(src)) throw new Error("board/version.js: could not find `game: …, build: …, date: …`");
  const q = (x) => (x === null || x === undefined ? "null" : JSON.stringify(x));
  fs.writeFileSync(f, src.replace(re, `game: ${q(v.game)}, build: ${v.build === null ? "null" : v.build}, date: ${q(v.date)}`));
}

/** The ref for main: origin/main, fetched (blobless) if the clone doesn't have it. */
function mainRef(repo) {
  try { git(repo, ["rev-parse", "--verify", "-q", "origin/main"]); return "origin/main"; } catch (e) { /* fetch it */ }
  git(repo, ["fetch", "-q", "--filter=blob:none", "origin", "main:refs/remotes/origin/main"]);
  return "origin/main";
}

module.exports = { parse, format, bump, count, countAt, commitsSince, problems, label, stamp, prBrief, mainRef, briefOfFile, BUMPS };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
  const repo = path.resolve(opt.repo || path.join(__dirname, ".."));
  const t0 = Date.now();
  try {
    let v;
    if (opt.pr) {
      const main = typeof opt.ref === "string" ? opt.ref : mainRef(repo);
      // main's releases files are read from main itself: this branch may lack ones merged after it was started.
      let c;
      try { c = countAt(repo, main, main); } catch (e) {
        // The changeover (Brief 031's own pull request): main has no releases/BASE.json yet, so count from this branch's.
        if (!/releases\/BASE\.json/.test(e.message)) throw e;
        c = countAt(repo, main);
      }
      v = { game: label(c.game, prBrief(repo, main), opt["pr-number"]), build: null, date: c.date, main: c.game };
    } else {
      const c = countAt(repo, typeof opt.ref === "string" ? opt.ref : "HEAD");
      if (opt.history) { console.log(JSON.stringify(c.history, null, 1)); process.exit(0); }
      v = { game: c.game, build: c.build, date: c.date, commit: c.commit };
    }
    if (!opt.print) stamp(repo, v);
    console.log(`${opt.print ? "Counted" : "Stamped"} ${v.game}${v.build ? ` · Build ${v.build}` : ""} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    if (opt.print) console.log(JSON.stringify(v));
  } catch (e) {
    console.error(`Could not count the version: ${e.message}`);
    process.exit(1);
  }
}
