// results/index.csv and results/INDEX.md (Brief 008): one line per run, newest first. index.csv is the list for
// scripts; INDEX.md is rewritten from it every time, so the two always agree.
"use strict";
const fs = require("fs"), path = require("path");
const COLS = ["id", "date", "version", "kind", "brief", "tags", "question", "answer", "path"];
const cell = (v) => { const s = String(v === undefined || v === null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cur); cur = ""; } else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (ch !== "\r") cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
function read(results) {
  const f = path.join(results, "index.csv");
  if (!fs.existsSync(f)) return [];
  const [head, ...rest] = parseCsv(fs.readFileSync(f, "utf8"));
  return rest.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])));
}
function write(results, list) {
  // newest first by date; within a date, the order given (add() puts the newest line first; the sort is stable)
  const sorted = list.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const head = Object.keys(Object.assign({}, ...sorted)).filter((k) => !COLS.includes(k));
  const cols = COLS.concat(head);
  fs.writeFileSync(path.join(results, "index.csv"), cols.join(",") + "\n" + sorted.map((r) => cols.map((c) => cell(r[c])).join(",")).join("\n") + "\n");
  let md = "# Results index\n\nOne line per run, newest first. Written automatically by the lab (`sims/lab/index.js`); don't edit by hand. The same list for scripts is `index.csv`. How this folder works: `README.md`.\n\n";
  for (const r of sorted) md += `- ${r.date} · ${r.kind} · ${r.version}${r.brief ? ` · brief ${r.brief}` : ""} · ${r.path ? `[${r.id}](${r.path}/SUMMARY.md)` : r.id}: ${r.answer}\n`;
  fs.writeFileSync(path.join(results, "INDEX.md"), md);
}
/** Add one run (an object with COLS keys; more keys become more columns). */
function add(results, entry) { fs.mkdirSync(results, { recursive: true }); write(results, [entry].concat(read(results))); }
module.exports = { add, read, write, COLS };
