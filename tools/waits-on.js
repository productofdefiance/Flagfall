#!/usr/bin/env node
/* The `waits-on` check (Brief 031): a pull request can't merge while a brief it waits on hasn't merged.
 *
 *   node tools/waits-on.js --title "<pull request title>" --head <commit> [--head-ref <branch>] [--main origin/main]
 *
 * Reads the `Waits on` row of the pull request's brief (briefs/NNN-*.md at the pull request's head, else on main).
 * A brief counts as merged when main has releases/NNN.json, or when releases/BASE.json lists it (the briefs merged
 * before Brief 031). Prints one line and a JSON verdict { state: "success"|"failure", description, waits }.
 * Docs and results pull requests (no brief in the title, or head branch lab/**) pass. */
"use strict";
const path = require("path"), cp = require("child_process");
const { briefFromTitle } = require("./check-release.js");

const git = (repo, args) => cp.execFileSync("git", args, { cwd: repo, encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "pipe"] });

/** The `Waits on` row: [] for "none", a list of three-digit briefs, or null when the row is missing or unreadable. */
function parseWaitsOn(md) {
  const m = /^\|\s*Waits on\s*\|(.*)\|\s*$/im.exec(String(md || ""));
  if (!m) return null;
  const w = m[1].replace(/[*`<>"]/g, "").trim();
  if (/^none\b/i.test(w)) return [];
  const list = w.match(/\b\d{3}\b/g);
  return list ? [...new Set(list)] : null;
}

/** The verdict from plain facts: { title, headRef, briefText (md or null), merged(n) → bool }. */
function verdict(f) {
  if (String(f.headRef || "").startsWith("lab/")) return { state: "success", description: "Results pull request: waits on nothing", waits: [] };
  const brief = briefFromTitle(f.title);
  if (!brief) return { state: "success", description: "No brief in the title (docs): waits on nothing", waits: [] };
  if (f.briefText === null || f.briefText === undefined) return { state: "failure", description: `Brief ${brief}: briefs/${brief}-*.md not found`, waits: null };
  const list = parseWaitsOn(f.briefText);
  if (list === null) return { state: "failure", description: "Waits on not stated in the brief", waits: null };
  const open = list.filter((n) => n !== brief && !f.merged(n));
  if (open.length) return { state: "failure", description: `Waits on ${open.join(", ")}: not merged yet`, waits: open };
  return { state: "success", description: list.length ? `Waits on ${list.join(", ")}: all merged` : "Waits on none", waits: [] };
}

/** Which briefs main has merged: releases/NNN.json on main, plus BASE.json's list. */
function mergedOnMain(repo, main) {
  const files = git(repo, ["ls-tree", "--name-only", main, "releases/"]).split("\n");
  const set = new Set(files.map((f) => (/^releases\/(\d{3})\.json$/.exec(f) || [])[1]).filter(Boolean));
  try { for (const n of JSON.parse(git(repo, ["show", `${main}:releases/BASE.json`])).merged || []) set.add(n); } catch (e) { /* before Brief 031 */ }
  return set;
}
function briefAt(repo, ref, n) {
  try {
    const f = git(repo, ["ls-tree", "--name-only", ref, "briefs/"]).split("\n").find((x) => new RegExp(`^briefs/${n}-.*\\.md$`).test(x));
    return f ? git(repo, ["show", `${ref}:${f}`]) : null;
  } catch (e) { return null; }
}

module.exports = { parseWaitsOn, verdict, mergedOnMain };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[++i] : "";
  const repo = path.resolve(opt.repo || path.join(__dirname, ".."));
  const main = opt.main || "origin/main", head = opt.head || "HEAD";
  const merged = mergedOnMain(repo, main);
  // The changeover: before Brief 031 merges, main has no BASE.json; use the head's list of old-way briefs.
  if (!merged.size) { try { for (const n of JSON.parse(git(repo, ["show", `${head}:releases/BASE.json`])).merged || []) merged.add(n); } catch (e) { /* none */ } }
  const n = briefFromTitle(opt.title);
  const v = verdict({ title: opt.title, headRef: opt["head-ref"], briefText: n ? (briefAt(repo, head, n) ?? briefAt(repo, main, n)) : null, merged: (b) => merged.has(b) });
  console.log(`${v.state === "success" ? "OK" : "WAIT"}: ${v.description}`);
  console.log(JSON.stringify(v));
  process.exit(0);
}
