// "Same games as" (Brief 031, amendment 2): a version on main whose games are the same as a filed release run (same
// game key, no new rules or brain) gets one results index line pointing to that run, so every version points to its
// numbers. The lab's plan step works out the list (sims/lab/release_files.js backlog); this files it.
// node sims/lab/same.js --list '[{"version":"v3.20.02","sha":"…","to":"v3.20.01","path":"v3.20.01/…"}]' [--results <folder>]
// Writes results/same.csv and rebuilds the index.
"use strict";
const path = require("path");
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
const root = path.join(__dirname, "..", "..");
const results = path.resolve(opt.results || path.join(root, "results"));
const idx = require("./index.js");

/** Index rows for each listed version not already pointing to its numbers. */
function lines(list, rows, day) {
  const out = [];
  for (const s of list) {
    if (rows.some((r) => (r.kind === "same" || r.kind === "release") && r.version === s.version)) continue;
    out.push({ id: `${day}_same-${s.version}`, date: day, version: s.version, kind: "same", brief: "", tags: "same",
      question: `Did ${s.version} change how games play?`, answer: `same games as ${s.to} (same game key)`, path: s.path || "", commit: s.sha || "" });
  }
  return out;
}
module.exports = { lines };

if (require.main === module) {
  const list = JSON.parse(opt.list || "[]");
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const add = lines(list, idx.collect(results), day);
  for (const l of add) { idx.addSame(results, l); console.log(`${l.version}: ${l.answer}`); }
  if (!add.length) console.log("Every listed version already points to its numbers.");
}
