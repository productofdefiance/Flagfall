#!/usr/bin/env node
/* The version check on every pull request (Brief 031; replaces .github/check-build-number.sh).
 *
 *   node tools/check-release.js --base <commit> [--head <commit>] [--title "<pull request title>"] [--head-ref <branch>] [--push]
 *
 * A pull request fails if:
 *  - it changes board/ without adding releases/NNN.json, or adds one with bump `none` (a board change is at least ZZ);
 *  - its title names a brief (`NNN Lane · …`) and it adds no releases/NNN.json (a tooling brief with bump `none`
 *    still adds one: it marks the brief as merged, which the waits-on check reads);
 *  - it adds more than one releases file, or edits or deletes an existing one (they are append-only);
 *  - its releases/NNN.json doesn't match the brief number in its title, or its bump differs from the brief header's
 *    `Game version` size;
 *  - board/version.js has a number in it (game, build and date stay null; the stamp writes them when published).
 * Results-only pull requests (head branch lab/**) and docs-only ones (no board/ change, no brief in the title) pass.
 * --push (a push to main): only the append-only rule and the null version.js are checked. */
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");
const SV = require("./stamp-version.js");

const git = (repo, args) => cp.execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });

/** The brief a title names: "031 Lab · Version at merge (ZZ)", "v3.20.00 · 029 UI · Rematch", "Brief 006: …". */
function briefFromTitle(title) {
  const m = /(?:^|·\s*|\bBrief\s+)(\d{3})(?=[\s:·]|$)/i.exec(String(title || ""));
  return m ? m[1] : null;
}
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
  const get = (k) => { const m = new RegExp(`\\b${k}:\\s*(null|"[^"]*"|\\d+)`).exec(src); return m ? m[1] : undefined; };
  return { game: get("game"), build: get("build"), date: get("date") };
}

/** The verdict, from plain facts (so the test can try every case without git).
 *  f = { push, headRef, title, changes: [{ status: "A"|"M"|"D", file }], briefText(n) → md or null,
 *        releaseText(file) → text, versionSrc } → { ok, lines } */
function judge(f) {
  const lines = [], fail = (s) => lines.push(`FAIL: ${s}`), note = (s) => lines.push(s);
  const changes = f.changes || [];
  const rel = changes.filter((c) => c.file.startsWith("releases/"));
  const boardChanged = changes.some((c) => c.file.startsWith("board/"));

  // Every pull request and push: releases files are append-only, and version.js holds no number.
  for (const c of rel) if (c.status !== "A") fail(`${c.file} was ${c.status === "D" ? "deleted" : "edited"}. Files in releases/ are append-only: a version once given is never taken back (a revert is its own brief or fix with its own bump).`);
  const vn = versionNumbers(f.versionSrc || "");
  for (const k of ["game", "build", "date"]) if (vn[k] !== "null") fail(`board/version.js has ${k}: ${vn[k] === undefined ? "(missing)" : vn[k]}. It must stay null: the number is stamped when published, never written by hand.`);
  if (f.push) { if (!lines.some((l) => l.startsWith("FAIL"))) note("OK: releases/ append-only and board/version.js holds no number."); return { ok: !lines.some((l) => l.startsWith("FAIL")), lines }; }

  if (String(f.headRef || "").startsWith("lab/")) { note("Results-only pull request (lab/**): no version check."); return { ok: !lines.some((l) => l.startsWith("FAIL")), lines }; }

  const added = rel.filter((c) => c.status === "A" && c.file !== "releases/BASE.json");
  const baseAdded = rel.some((c) => c.status === "A" && c.file === "releases/BASE.json");
  if (baseAdded && !f.baseMissing) fail("releases/BASE.json already exists on main; only Brief 031 adds it.");
  const brief = briefFromTitle(f.title);
  if (added.length > 1) fail(`it adds ${added.length} releases files (${added.map((c) => c.file).join(", ")}); a pull request adds exactly one, for its own brief.`);
  if (!added.length) {
    if (boardChanged) fail(`board/ changed but no releases/NNN.json was added. Add releases/${brief || "NNN"}.json with the brief's bump (at least ZZ for a board change) and changelog/${brief || "NNN"}.md.`);
    else if (brief) fail(`the title names brief ${brief} but no releases/${brief}.json was added. Every brief adds one (bump none for tooling): it marks the brief as merged.`);
    else note("No board/ change and no brief in the title (docs or results): no releases file needed.");
    return { ok: !lines.some((l) => l.startsWith("FAIL")), lines };
  }
  if (added.length === 1) {
    const file = added[0].file, n = SV.briefOfFile(file);
    if (!n) { fail(`${file} is not named releases/NNN.json (three digits).`); return { ok: false, lines }; }
    let r = null;
    try { r = JSON.parse(f.releaseText(file)); } catch (e) { fail(`${file} is not valid JSON (${e.message}).`); }
    if (r) {
      for (const p of SV.problems(r, file)) fail(p);
      if (!brief) fail(`the title names no brief; it must start "${n} Lane · short name (size)".`);
      else if (brief !== n) fail(`${file} is for brief ${n} but the title names brief ${brief}.`);
      const md = f.briefText(n);
      const size = md ? sizeFromBrief(md) : null;
      if (!md) fail(`briefs/${n}-*.md was not found, so the bump can't be checked against the brief.`);
      else if (!size) fail(`briefs/${n}-*.md has no Game version size (X, YY, ZZ or none) in its header.`);
      else if (r.bump !== size) fail(`${file} says bump ${r.bump} but the brief's Game version is ${size}.`);
      if (boardChanged && r.bump === "none") fail("board/ changed but the bump is none: a board change is at least ZZ.");
      if (!f.changelogAdded(n)) fail(`changelog/${n}.md was not added (the entry CHANGELOG.md used to get, no number in its heading).`);
      if (!lines.some((l) => l.startsWith("FAIL"))) note(`OK: ${file} (bump ${r.bump}) matches brief ${n}${boardChanged ? "; board/ changed" : ""}. The number is counted when it merges.`);
    }
  }
  return { ok: !lines.some((l) => l.startsWith("FAIL")), lines };
}

module.exports = { judge, briefFromTitle, sizeFromBrief, versionNumbers };

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
  const res = judge({
    push: !!opt.push, headRef: opt["head-ref"] || "", title: opt.title || "", changes, briefText,
    releaseText: (f) => show(head, f), versionSrc: show(head, "board/version.js") || "",
    baseMissing: show(opt.base, "releases/BASE.json") === null,
    changelogAdded: (n) => changes.some((c) => c.status === "A" && c.file === `changelog/${n}.md`)
  });
  console.log(`Changed: ${changes.length} files${changes.some((c) => c.file.startsWith("board/")) ? " (board/ included)" : ""}.`);
  for (const l of res.lines) console.log(l);
  process.exit(res.ok ? 0 : 1);
}
