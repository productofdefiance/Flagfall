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
/** Add one run (an object with COLS keys; more keys become more columns). Kept for old callers; the lab now writes
    the run folder (or a quiet night's line in nightly.csv) and calls rebuild(). */
function add(results, entry) { fs.mkdirSync(results, { recursive: true }); write(results, [entry].concat(read(results))); }

// ---- Rebuild (Brief 016, F35) ----
// Both files are rebuilt from what results/ holds, never edited line by line, so two results pull requests can't leave
// a conflict that stays: the lab merges main into a stuck one and rebuilds. The rows come from every run folder's
// run.json (results/<version>/<run>/run.json) and from results/nightly.csv, the home of quiet nights ("no change,
// passed"), which have no run folder. Order: newest date first; within a date, the run that finished last first.
const NIGHTLY = "nightly.csv";
function readCsvFile(f) {
  if (!fs.existsSync(f)) return [];
  const [head, ...rest] = parseCsv(fs.readFileSync(f, "utf8"));
  return rest.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] || ""])));
}
/** A run's one-line answer: run.json's `answer` (runs from Brief 016 on), else the **Answer:** line of SUMMARY.md. */
function answerOf(dir, run) {
  if (typeof run.answer === "string") return run.answer;
  const f = path.join(dir, "SUMMARY.md");
  if (!fs.existsSync(f)) return "";
  const m = fs.readFileSync(f, "utf8").match(/^\*\*Answer:\*\* (.*)$/m);
  return m ? m[1] : "";
}
/** Every row the index should list, with the time it finished (for the order), from the folders and nightly.csv. */
function collect(results) {
  const rows = [];
  if (!fs.existsSync(results)) return rows;
  for (const v of fs.readdirSync(results, { withFileTypes: true })) {
    if (!v.isDirectory()) continue;
    for (const r of fs.readdirSync(path.join(results, v.name), { withFileTypes: true })) {
      if (!r.isDirectory()) continue;
      const dir = path.join(results, v.name, r.name), f = path.join(dir, "run.json");
      if (!fs.existsSync(f)) continue;   // older folders (pre-v3.05.00) were never in the index
      const run = JSON.parse(fs.readFileSync(f, "utf8"));
      const row = { id: run.id || r.name, date: (run.id || r.name).slice(0, 10), version: run.version || v.name, kind: run.kind || "", brief: run.brief || "",
        tags: (run.tags || []).join(" "), question: run.question || "", answer: answerOf(dir, run), path: `${v.name}/${r.name}` };
      if (run.kind === "nightly" && run.commit) row.commit = run.commit;
      row._finished = run.finished || run.started || "";
      rows.push(row);
    }
  }
  for (const n of readCsvFile(path.join(results, NIGHTLY))) { const row = Object.assign({}, n); row._finished = n.finished || ""; delete row.finished; rows.push(row); }
  return rows;
}
/** Rewrite index.csv and INDEX.md from the folders and nightly.csv. Returns the rows written. */
function rebuild(results) {
  fs.mkdirSync(results, { recursive: true });
  const rows = collect(results).sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b._finished || "").localeCompare(a._finished || ""));
  for (const r of rows) delete r._finished;
  write(results, rows);
  return rows;
}
/** A quiet night ("no change, passed"): a line in nightly.csv, then the rebuild. */
function addNightly(results, entry) {
  const f = path.join(results, NIGHTLY), list = readCsvFile(f);
  list.unshift(Object.assign({ finished: new Date().toISOString() }, entry));
  const cols = COLS.concat(["commit", "finished"]);
  fs.mkdirSync(results, { recursive: true });
  fs.writeFileSync(f, cols.join(",") + "\n" + list.map((r) => cols.map((c) => cell(r[c])).join(",")).join("\n") + "\n");
  return rebuild(results);
}
module.exports = { add, read, write, rebuild, collect, addNightly, COLS };
// node sims/lab/index.js --rebuild [results folder]: rebuild both files (the lab's refresh of a stuck results pull request).
if (require.main === module && process.argv[2] === "--rebuild") {
  const results = path.resolve(process.argv[3] || path.join(__dirname, "..", "..", "results"));
  console.log(`index rebuilt: ${rebuild(results).length} runs listed`);
}
