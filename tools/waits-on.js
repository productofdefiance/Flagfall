#!/usr/bin/env node
/* The `waits-on` check (Brief 031, amendments 8 and 10): a pull request can't merge while a brief it waits on hasn't
 * merged, or has merged but isn't in the branch yet.
 *
 *   node tools/waits-on.js --all [--pr <n>] [--dry]   work out every open pull request's verdict, reading main live,
 *                                                      and post it as the commit status `waits-on` (only #n with --pr)
 *   node tools/waits-on.js --brief NNN [--head <ref>]  the build-time guard: may brief NNN be built on <ref> now?
 *
 * Rules:
 *  - A pull request's identity is the releases file it adds (M1); without one (docs, results, job orders) it waits on
 *    nothing and passes. A follow-up (NNN-2) waits on brief NNN.
 *  - The `Waits on` row is exactly `none` or three-digit numbers separated by commas (M3), else it fails. A number
 *    with no brief anywhere fails as "no such brief"; briefs that wait on each other are named as a loop.
 *  - Which copy of a brief is read: the pull request's own copy when a pull request is open for it, else the
 *    `brief/NNN-*` branch, else main. The build-time guard and the status board use this same rule.
 *  - A brief listed counts only once the branch contains it (M5, ruled no to "green by itself"): the branch has its
 *    releases/NNN.json, or (for a brief merged the old way, listed in releases/BASE.json) the branch has BASE.json
 *    itself (A2). Merged on main but not in the branch: "028 merged: sync once to test on it".
 * Posting reads main live every time, so a run on any push to main, on the hour or on a pull request event sets every
 * open pull request's status afresh (M4), lab/* and docs pull requests included. */
"use strict";
const path = require("path"), cp = require("child_process");
const SV = require("./stamp-version.js");
const { briefFromTitle } = require("./check-release.js");

const git = (repo, args) => cp.execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });

/** The `Waits on` row: { list } (an empty list for "none"), { missing: true }, or { malformed: "<the text>" }. */
function parseWaitsOn(md) {
  const m = /^\|\s*Waits on\s*\|(.*)\|\s*$/im.exec(String(md || ""));
  if (!m) return { missing: true };
  const w = m[1].replace(/[*`]/g, "").trim();
  if (/^none$/i.test(w)) return { list: [] };
  if (/^\d{3}(\s*,\s*\d{3})*$/.test(w)) return { list: [...new Set(w.split(",").map((x) => x.trim()))] };
  return { malformed: w };
}

/** The verdict from plain facts:
 *  { id: "040" | "025-2" | null, briefText(n) → md | null (by the copy rule), merged(n) → bool (on main),
 *    contained(n) → bool (in this branch) } → { state, description, waits } */
function verdict(f) {
  const ok = (description) => ({ state: "success", description, waits: [] });
  const no = (description, waits) => ({ state: "failure", description, waits: waits || null });
  if (!f.id) return ok("No brief (docs, results or job orders): waits on nothing");
  const own = SV.briefNumber(f.id);
  let list;
  if (SV.isFollowUp(f.id)) list = [own];   // a follow-up waits on the brief it follows up
  else {
    const md = f.briefText(own);
    if (md === null || md === undefined) return no(`Brief ${own}: briefs/${own}-*.md not found`);
    const row = parseWaitsOn(md);
    if (row.missing) return no("Waits on not stated in the brief");
    if (row.malformed !== undefined) return no(`Waits on must be "none" or three-digit numbers separated by commas (reads "${row.malformed.slice(0, 40)}")`);
    list = row.list.filter((n) => n !== own);
  }
  const unknown = SV.isFollowUp(f.id) ? [] : list.filter((n) => !f.merged(n) && (f.briefText(n) === null || f.briefText(n) === undefined));
  if (unknown.length) return no(`Waits on ${unknown.join(", ")}: no such brief`, unknown);
  // A loop: briefs that (through unmerged briefs) wait on this one.
  const loop = findLoop(own, f);
  if (loop) return no(`Waits on a loop: ${loop.join(" → ")}`, loop.slice(1, -1));
  const open = list.filter((n) => !f.merged(n));
  if (open.length) return no(`Waits on ${open.join(", ")}: not merged yet`, open);
  const notIn = list.filter((n) => !f.contained(n));
  if (notIn.length) return no(`${notIn.join(", ")} merged: sync once to test on it`, notIn);
  return ok(list.length ? `Waits on ${list.join(", ")}: merged and in this branch` : "Waits on none");
}
/** [own, …, own] when unmerged briefs wait on each other back to `own`, else null. */
function findLoop(own, f) {
  const next = (n) => { const r = parseWaitsOn(f.briefText(n)); return (r.list || []).filter((x) => x !== n && !f.merged(x)); };
  const stack = [[own, [own]]], seen = new Set();
  while (stack.length) {
    const [n, trail] = stack.pop();
    for (const d of next(n)) {
      if (d === own) return trail.concat([own]);
      if (seen.has(d)) continue;
      seen.add(d); stack.push([d, trail.concat([d])]);
    }
  }
  return null;
}

// ---------- reading the repository ----------
function show(repo, ref, file) { try { return git(repo, ["show", `${ref}:${file}`]); } catch (e) { return null; } }
function hasFile(repo, ref, file) { try { git(repo, ["cat-file", "-e", `${ref}:${file}`]); return true; } catch (e) { return false; } }
function briefFileAt(repo, ref, n) {
  try {
    const f = git(repo, ["ls-tree", "--name-only", ref, "briefs/"]).split("\n").find((x) => new RegExp(`^briefs/${n}-.*\\.md$`).test(x));
    return f ? show(repo, ref, f) : null;
  } catch (e) { return null; }
}
/** Which briefs main has merged: releases/NNN.json on main, plus BASE.json's list of old-way briefs. */
function mergedOnMain(repo, main) {
  const set = new Set(git(repo, ["ls-tree", "--name-only", main, "releases/"]).split("\n").map(SV.briefOfFile).filter(Boolean));
  try { for (const n of JSON.parse(show(repo, main, "releases/BASE.json")).merged || []) set.add(n); } catch (e) { /* before Brief 031 */ }
  return set;
}
/** The releases file a pull request adds (its identity), from its merge-base with main. */
function idOf(repo, main, head) {
  try {
    const mb = git(repo, ["merge-base", main, head]).trim();
    const id = SV.prBrief(repo, mb, head);
    if (id) return id;
  } catch (e) { /* no merge-base: no identity */ }
  return null;   // no releases file: docs, results or job orders (the version check fails any other pull request without one)
}

/** Verdicts for open pull requests. prs: [{ number, title, head (a ref in this clone), headRef }];
    briefRefs: { NNN: ref of brief/NNN-* }. Returns Map number → verdict (with id). */
function evaluate(repo, main, prs, briefRefs) {
  const merged = mergedOnMain(repo, main);
  // The changeover (031's own pull request): main has no BASE.json yet, so take its list from a branch that adds it.
  if (!hasFile(repo, main, "releases/BASE.json")) for (const p of prs) { try { for (const n of JSON.parse(show(repo, p.head, "releases/BASE.json")).merged || []) merged.add(n); } catch (e) { /* none */ } }
  const ids = new Map(prs.map((p) => [p.number, idOf(repo, main, p.head)]));
  const prFor = new Map();
  for (const p of prs) { const id = ids.get(p.number); if (id && !SV.isFollowUp(id)) prFor.set(id, p); }
  const briefText = (n) => {
    const p = prFor.get(n);
    return (p && briefFileAt(repo, p.head, n)) ?? (briefRefs[n] && briefFileAt(repo, briefRefs[n], n)) ?? briefFileAt(repo, main, n);
  };
  const out = new Map();
  for (const p of prs) {
    const id = ids.get(p.number);
    const baseIn = hasFile(repo, p.head, "releases/BASE.json");
    let oldWay = new Set();
    try { oldWay = new Set(JSON.parse(show(repo, p.head, "releases/BASE.json")).merged || []); } catch (e) { /* none */ }
    const contained = (n) => hasFile(repo, p.head, `releases/${n}.json`) || (baseIn && oldWay.has(n));
    const v = String(p.headRef || "").startsWith("lab/") ? { state: "success", description: "Results pull request: waits on nothing", waits: [] }
      : verdict({ id, briefText, merged: (n) => merged.has(n), contained });
    out.set(p.number, Object.assign({ id }, v));
  }
  return out;
}

module.exports = { parseWaitsOn, verdict, findLoop, mergedOnMain, evaluate, briefFileAt, idOf };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[++i] : true;
  const repo = path.resolve(opt.repo || path.join(__dirname, ".."));
  const NS = "refs/waitson";
  const sh = (cmd, a) => cp.execFileSync(cmd, a, { cwd: repo, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });
  if (opt.brief) {
    // The build-time guard: brief NNN on <head> (default HEAD), against main as it is now.
    try { git(repo, ["fetch", "-q", "--filter=blob:none", "origin", "+refs/heads/main:refs/remotes/origin/main", `+refs/heads/brief/*:${NS}/brief/*`]); } catch (e) { /* offline: use what is here */ }
    const refs = {};
    for (const r of git(repo, ["for-each-ref", "--format=%(refname)", `${NS}/brief/`]).split("\n").filter(Boolean)) { const m = /\/(\d{3})-/.exec(r); if (m && !refs[m[1]]) refs[m[1]] = r; }
    const head = opt.head || "HEAD";
    const v = evaluate(repo, "origin/main", [{ number: 0, title: `${opt.brief} guard`, head, headRef: "" }], refs).get(0);
    const fixed = v.id ? v : verdict({ id: String(opt.brief), briefText: (n) => (refs[n] && briefFileAt(repo, refs[n], n)) ?? briefFileAt(repo, head, n) ?? briefFileAt(repo, "origin/main", n), merged: (n) => mergedOnMain(repo, "origin/main").has(n), contained: () => true });
    console.log(`${fixed.state === "success" ? "OK" : "STOP"}: ${fixed.description}`);
    process.exit(fixed.state === "success" ? 0 : 1);
  }
  if (!opt.all) { console.error("usage: --all [--pr <n>] [--dry] | --brief NNN"); process.exit(2); }
  const repoName = process.env.GITHUB_REPOSITORY || "productofdefiance/Flagfall";
  const list = JSON.parse(sh("gh", ["pr", "list", "--repo", repoName, "--state", "open", "--limit", "200", "--json", "number,title,headRefOid,headRefName"]));
  git(repo, ["fetch", "-q", "--filter=blob:none", "origin", "+refs/heads/main:refs/remotes/origin/main", `+refs/heads/brief/*:${NS}/brief/*`, ...list.map((p) => `+refs/pull/${p.number}/head:${NS}/pr/${p.number}`)]);
  const refs = {};
  for (const r of git(repo, ["for-each-ref", "--format=%(refname)", `${NS}/brief/`]).split("\n").filter(Boolean)) { const m = /\/(\d{3})-/.exec(r); if (m && !refs[m[1]]) refs[m[1]] = r; }
  const prs = list.map((p) => ({ number: p.number, title: p.title, head: `${NS}/pr/${p.number}`, headRef: p.headRefName, sha: p.headRefOid }));
  const res = evaluate(repo, "origin/main", prs, refs);
  const run = process.env.GITHUB_SERVER_URL ? `${process.env.GITHUB_SERVER_URL}/${repoName}/actions/runs/${process.env.GITHUB_RUN_ID}` : "";
  for (const p of prs) {
    if (opt.pr && String(p.number) !== String(opt.pr)) continue;
    const v = res.get(p.number);
    console.log(`#${p.number} ${v.id || "-"} ${v.state}: ${v.description}`);
    if (!opt.dry) sh("gh", ["api", "-X", "POST", `repos/${repoName}/statuses/${p.sha}`, "-f", `state=${v.state}`, "-f", "context=waits-on", "-f", `description=${v.description.slice(0, 138)}`, ...(run ? ["-f", `target_url=${run}`] : [])]);
  }
}
