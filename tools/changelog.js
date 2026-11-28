#!/usr/bin/env node
/* The assembled changelog for the published site (Brief 031).
 * CHANGELOG.md is the record up to Brief 031's baseline; each later brief adds changelog/NNN.md with no number in its
 * heading ("## Brief 029 · Rematch"). This script numbers those headings from the count (tools/stamp-version.js),
 * puts them newest first above the old entries, and writes the version table (one row per version: rule set, default
 * brain, UI version, build) from releases/ on top of CHANGELOG.md's old rows.
 *   node tools/changelog.js [--md <file>] [--html <file>] [--ref <commit>]   (default: print the markdown) */
"use strict";
const fs = require("fs"), path = require("path");
const SV = require("./stamp-version.js");

/** CHANGELOG.md → { rows: [[game, rules, brain, ui, build]...] newest first, entries: the text after the table }. */
function readOld(md) {
  const lines = md.split("\n"), rows = [];
  let i = lines.findIndex((l) => /^## Game versions/.test(l)), end = i;
  if (i >= 0) {
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (/^\|\s*v\d/.test(l)) rows.push(l.split("|").slice(1, -1).map((c) => c.trim()));
      if (/^## /.test(l)) { end = j; break; }
    }
  }
  return { rows, entries: i >= 0 ? lines.slice(end).join("\n") : md };
}

/** The assembled markdown, from the count's history, the old CHANGELOG.md and the changelog/ entries. */
function assemble(history, oldMd, entryOf) {
  const old = readOld(oldMd);
  let [, rules, brain, ui] = old.rows[0] || [null, "?", "?", "?"];
  const newRows = [], newEntries = [];
  for (const h of history) {
    if (!h.brief) continue;   // a board change outside any brief (should not happen: the version check requires one)
    rules = h.rules || rules; brain = h.brain || brain; ui = h.ui || ui;
    const text = entryOf(h.brief);
    const head = h.bump === "none" ? `No game version${h.build ? ` · Build ${h.build}` : ""}` : `${h.game}${h.build ? ` · Build ${h.build}` : ""}`;
    if (h.bump !== "none") newRows.unshift([h.game, rules, brain, ui, String(h.build || "")]);
    if (text) newEntries.unshift(text.replace(/^##\s+(.*)$/m, (m, t) => `## ${head} — ${t}${h.date ? ` (${h.date})` : ""}`).trim());
    else newEntries.unshift(`## ${head} — Brief ${h.brief}${h.date ? ` (${h.date})` : ""}\n\n(no changelog/${h.brief}.md)`);
  }
  const table = ["| Game version | Rule set (newest) | Default brain | UI | Build |", "|---|---|---|---|---|"]
    .concat(newRows.concat(old.rows).map((r) => `| ${r.join(" | ")} |`));
  return ["# Changelog", "", "Newest first. One entry per build, written for the Editor: what a player notices first, then what changed under the hood. Version numbers are counted from merge order when main is published (Brief 031).", "",
    "## Game versions", "", table.join("\n"), "", newEntries.join("\n\n"), newEntries.length ? "" : null, old.entries.trim(), ""].filter((x) => x !== null).join("\n");
}

/** A small, safe markdown page: headings, lists, tables and paragraphs; everything escaped. */
function toHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const out = [], lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,4} /.test(l)) { const n = l.match(/^#+/)[0].length; out.push(`<h${n}>${inline(l.slice(n + 1))}</h${n}>`); }
    else if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]); i--;
      const cells = (r) => r.split("|").slice(1, -1).map((c) => c.trim());
      out.push("<table>" + rows.filter((r) => !/^\|[-|\s]+\|$/.test(r)).map((r, k) => `<tr>${cells(r).map((c) => (k ? `<td>${inline(c)}</td>` : `<th>${inline(c)}</th>`)).join("")}</tr>`).join("") + "</table>");
    } else if (/^\s*- /.test(l)) {
      const items = []; while (i < lines.length && /^\s*- /.test(lines[i])) items.push(lines[i++].replace(/^\s*- /, "")); i--;
      out.push("<ul>" + items.map((x) => `<li>${inline(x)}</li>`).join("") + "</ul>");
    } else if (l.trim()) out.push(`<p>${inline(l)}</p>`);
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Flagfall: Arena changelog</title>
<style>:root{color-scheme:light dark}body{font:16px/1.5 system-ui,sans-serif;max-width:52rem;margin:0 auto;padding:16px;background:Canvas;color:CanvasText}table{border-collapse:collapse;display:block;overflow-x:auto}td,th{border:1px solid #8886;padding:2px 8px;text-align:left}code{font-size:.9em}h2{margin-top:2rem}</style></head><body>
${out.join("\n")}
</body></html>
`;
}

module.exports = { assemble, readOld, toHtml };

if (require.main === module) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
  const root = path.join(__dirname, "..");
  const c = SV.countAt(root, opt.ref || "HEAD");
  const entryOf = (n) => { const f = path.join(root, "changelog", `${n}.md`); return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null; };
  const md = assemble(c.history, fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8"), entryOf);
  if (opt.md) fs.writeFileSync(opt.md, md);
  if (opt.html) fs.writeFileSync(opt.html, toHtml(md));
  if (!opt.md && !opt.html) process.stdout.write(md);
}
