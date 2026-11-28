#!/usr/bin/env node
/* The version check on every pull request (Brief 031 with its amendments; replaces .github/check-build-number.sh).
 *
 *   node tools/check-release.js --base <commit> [--head <commit>] [--title "<pull request title>"] [--head-ref <branch>] [--push]
 *
 * A pull request's identity is the releases file it adds (amendment 8, M1). It fails if:
 *  - it changes anything outside results/, studies/, briefs/, flags/ and .md files, and adds no releases file (M2:
 *    tooling builds add one with bump `none`; it marks the brief merged, which waits-on reads);
 *  - it changes board/ with bump `none` (a board change is at least ZZ);
 *  - it adds more than one releases file, or edits or deletes an existing one (releases/ is append-only);
 *  - its title doesn't name the same brief (or follow-up, NNN-2) as its releases file;
 *  - its bump differs from the brief header's `Game version` size (not checked for a follow-up, amendment 14), or a
 *    follow-up's brief has not merged;
 *  - it doesn't add changelog/<same name>.md;
 *  - board/version.js has a number in it (game, build and date stay null; the stamp writes them when published);
 *  - a build pull request (not lab/**) changes results/INDEX.md or results/index.csv (amendment 3, H1: main's index
 *    is rebuilt by the next results pull request);
 *  - it adds releases/BASE.json whose commit is not on main or whose version there differs (amendment 1, L7).
 * Pull requests that change only results/, studies/, briefs/, flags/ or .md files need no releases file, whatever
 * their branch name (results and job-order pull requests, docs).
 * --push (a push to main): only the append-only rule and the null version.js are checked. */
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");
const SV = require("./stamp-version.js");

const git = (repo, args) => cp.execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });

/** The brief (or follow-up) a title names: "031 Lab · Version at merge (ZZ)", "025-2 UI · Fix (ZZ)",
    "v3.20.00 · 029 UI · Rematch", "Brief 006: …". */
function briefFromTitle(title) {
  const m = /(?:^|·\s*|\bBrief\s+)(\d{3}(?:-\d+)?)(?=[\s:·]|$)/i.exec(String(title || ""));
  return m ? m[1] : null;
}
/** Only results/, studies/, briefs/, flags/ or .md files: no releases file needed (M2). */
function exemptOnly(files) { return files.length > 0 && files.every((f) => /^(results|studies|briefs|flags)\//.test(f) || /\.md$/.test(f)); }
/** The size of the bump in a brief's header row `| Game version | ZZ (…) |`: X, YY, ZZ, none, or null. */
function sizeFromBrief(md) {
  const m = /^\|\s*Game version\s*\|(.*)\|\s*$/im.exec(String(md || ""));
  if (!m) return null;
  const g = m[1].trim();
  if (/^\**\s*none\b/i.test(g)) return "none";
  const s = /\b(X|YY|ZZ)\b/.exec(g);
  return s ? s[1] : null;
}
/** The numbers in board/version.js's source (null when they are null). */
function versionNumbers(src) {
  const get = (k) => { const m = new RegExp(`\\b${k}:\\s*(null|"[^"]*"|\\d+|\\{)`).exec(src); return m ? m[1] : undefined; };
  return { game: get("game"), build: get("build"), date: get("date"), briefs: get("briefs") };
}
/** The one-line answer to a deleted releases file (Brief 032, L2). "031" → releases/031-2.json, "031-2" → 031-3. */
function revertLine(id) {
  const m = /^(\d{3})(?:-(\d+))?$/.exec(id), next = `${m[1]}-${m[2] ? Number(m[2]) + 1 : 2}`;
  return `A revert keeps releases/${id}.json and adds its own (releases/${next}.json, bump ZZ or larger).`;
}

/** The verdict, from plain facts (so the test can try every case without git).
 *  f = { push, headRef, title, changes: [{ status: "A"|"M"|"D", file }], briefText(n) → md or null,
 *        releaseText(file) → text, versionSrc } → { ok, lines } */
function judge(f) {
  const lines = [], fail = (x) => lines.push(`FAIL: ${x}`), note = (x) => lines.push(x);
  const done = () => ({ ok: !lines.some((l) => l.startsWith("FAIL")), lines });
  const changes = f.changes || [];
  const files = changes.map((c) => c.file);
  const rel = changes.filter((c) => c.file.startsWith("releases/"));
  const boardChanged = files.some((x) => x.startsWith("board/"));
  const resultsPr = String(f.headRef || "").startsWith("lab/");

  // Every pull request and push: releases files are append-only, and version.js holds no number.
  for (const c of rel) if (c.status !== "A") {
    const id = SV.briefOfFile(c.file);
    if (c.status === "D" && id) fail(revertLine(id));   // Brief 032, L2: GitHub's Revert button deletes the file
    else fail(`${c.file} was ${c.status === "D" ? "deleted" : "edited"}. Files in releases/ are append-only: a version once given is never taken back.${id ? " " + revertLine(id) : ""}`);
  }
  const vn = versionNumbers(f.versionSrc || "");
  if (vn.briefs !== undefined && vn.briefs !== "null") fail("board/version.js has a briefs map in it. It must stay null: the stamp writes it when published.");
  for (const k of ["game", "build", "date"]) if (vn[k] !== "null") fail(`board/version.js has ${k}: ${vn[k] === undefined ? "(missing)" : vn[k]}. It must stay null: the number is stamped when published, never written by hand.`);
  if (f.push) { if (!lines.length) note("OK: releases/ append-only and board/version.js holds no number."); return done(); }

  if (!resultsPr) for (const x of ["results/INDEX.md", "results/index.csv"]) if (files.includes(x)) fail(`${x} changed. A build doesn't commit the results index: main's is rebuilt by the next results pull request (put it back with \`git checkout origin/main -- ${x}\`).`);

  const added = rel.filter((c) => c.status === "A" && c.file !== "releases/BASE.json");
  if (rel.some((c) => c.status === "A" && c.file === "releases/BASE.json")) {
    if (!f.baseMissing) fail("releases/BASE.json already exists on main; only Brief 031 adds it.");
    else if (f.baseProblem) fail(`releases/BASE.json: ${f.baseProblem}`);
    else note("releases/BASE.json: its commit is on main and its version there matches.");
  }
  const titled = briefFromTitle(f.title);
  if (added.length > 1) {   // Brief 032, L6: say why
    const ids = added.map((c) => SV.briefOfFile(c.file) || c.file), other = ids.filter((x) => x !== titled);
    fail(`${added.length === 2 ? "Two" : added.length} releases files: this branch contains brief ${other.join(" and ")}'s unmerged work. Branch from main or the brief branch, never from another open pull request.`);
  }
  if (!added.length) {
    if (resultsPr || exemptOnly(files)) note("Only results/, studies/, briefs/, flags/ or .md files changed: no releases file needed.");
    else fail(`no releases file was added. Every pull request that changes more than results, job orders, briefs, flags or .md files adds releases/${titled || "NNN"}.json (bump none for tooling) and changelog/${titled || "NNN"}.md.`);
    return done();
  }
  if (added.length === 1) {
    const file = added[0].file, id = SV.briefOfFile(file);
    if (!id) { fail(`${file} is not named releases/NNN.json (or NNN-2.json for a follow-up).`); return done(); }
    let r = null;
    try { r = JSON.parse(f.releaseText(file)); } catch (e) { fail(`${file} is not valid JSON (${e.message}).`); }
    if (r) {
      for (const p of SV.problems(r, file)) fail(p);
      if (!titled) fail(`the title names no brief; it must start "${id} Lane · short name (size)".`);
      else if (titled !== id) fail(`${file} is for ${id} but the title names ${titled}. The releases file is the pull request's identity; make the title agree.`);
      if (SV.isFollowUp(id)) {
        if (!f.mergedOnMain(SV.briefNumber(id))) fail(`${id} is a follow-up to brief ${SV.briefNumber(id)}, which has not merged.`);
      } else {
        const md = f.briefText(id);
        const size = md ? sizeFromBrief(md) : null;
        if (!md) fail(`briefs/${id}-*.md was not found, so the bump can't be checked against the brief.`);
        else if (!size) fail(`briefs/${id}-*.md has no Game version size (X, YY, ZZ or none) in its header.`);
        else if (r.bump !== size) fail(`${file} says bump ${r.bump} but the brief's Game version is ${size}.`);
      }
      if (boardChanged && r.bump === "none") fail("board/ changed but the bump is none: a board change is at least ZZ.");
      if (!f.changelogAdded(id)) fail(`changelog/${id}.md was not added (the changelog entry, no number in its heading).`);
      if (!lines.some((l) => l.startsWith("FAIL"))) note(`OK: ${file} (bump ${r.bump}) is this pull request's identity and matches its title${SV.isFollowUp(id) ? "" : " and brief"}${boardChanged ? "; board/ changed" : ""}. The number is counted when it merges.`);
    }
  }
  return done();
}

module.exports = { revertLine, judge, briefFromTitle, sizeFromBrief, versionNumbers, exemptOnly };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[++i] : true;
  const repo = path.resolve(opt.repo || path.join(__dirname, ".."));
  const head = opt.head || "HEAD";
  if (!opt.base) { console.log("No earlier commit to compare against: nothing to check."); process.exit(0); }
  const changes = git(repo, ["diff", "--name-status", "--no-renames", `${opt.base}...${head}`]).split("\n").filter(Boolean)
    .map((l) => { const [status, file] = l.split("\t"); return { status: status[0], file }; });
  const show = (ref, f) => { try { return git(repo, ["show", `${ref}:${f}`]); } catch (e) { return null; } };
  const briefText = (n) => {
    const list = git(repo, ["ls-tree", "--name-only", head, "briefs/"]).split("\n").filter((f) => new RegExp(`^briefs/${n}-.*\\.md$`).test(f));
    return list.length ? show(head, list[0]) : null;
  };
  /** L7: the baseline commit is on main (the pull request's base) and main's version.js read there what BASE.json says. */
  function baseProblem(repo, mainSha, text, show) {
    if (!text) return null;
    let b; try { b = JSON.parse(text); } catch (e) { return `not valid JSON (${e.message})`; }
    if (!SV.isAncestor(repo, b.commit, mainSha)) return `its commit ${String(b.commit).slice(0, 7)} is not on main`;
    const v = show(b.commit, "board/version.js") || "";
    const g = (/game:\s*"([^"]+)"/.exec(v) || [])[1], n = Number((/build:\s*(\d+)/.exec(v) || [])[1]);
    if (g !== b.game || n !== b.build) return `main's version.js at ${String(b.commit).slice(0, 7)} reads ${g} · Build ${n}, not ${b.game} · Build ${b.build}`;
    return null;
  }
  function mergedAt(repo, ref, show) {
    const set = new Set(git(repo, ["ls-tree", "--name-only", ref, "releases/"]).split("\n").map(SV.briefOfFile).filter(Boolean));
    try { for (const n of JSON.parse(show(ref, "releases/BASE.json")).merged || []) set.add(n); } catch (e) { /* none */ }
    try { for (const n of JSON.parse(show(head, "releases/BASE.json")).merged || []) set.add(n); } catch (e) { /* none */ }
    return set;
  }
  const res = judge({
    push: !!opt.push, headRef: opt["head-ref"] || "", title: opt.title || "", changes, briefText,
    releaseText: (f) => show(head, f), versionSrc: show(head, "board/version.js") || "",
    baseMissing: show(opt.base, "releases/BASE.json") === null,
    baseProblem: baseProblem(repo, opt.base, show(head, "releases/BASE.json"), show),
    mergedOnMain: (n) => mergedAt(repo, opt.base, show).has(n),
    changelogAdded: (n) => changes.some((c) => c.status === "A" && c.file === `changelog/${n}.md`)
  });
  console.log(`Changed: ${changes.length} files${changes.some((c) => c.file.startsWith("board/")) ? " (board/ included)" : ""}.`);
  for (const l of res.lines) console.log(l);
  process.exit(res.ok ? 0 : 1);
}
