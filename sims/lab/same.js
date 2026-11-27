// "Same games as" (Brief 031): a new version on main with no release run of its own (a screen-only build, or one that
// changed no board file) gets one results index line pointing to the last version that had a release run.
// node sims/lab/same.js [--commit <sha>] [--results <folder>]
// The version is the stamped one (tools/stamp-version.js). Writes results/same.csv and rebuilds the index.
"use strict";
const fs = require("fs"), path = require("path");
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
const root = path.join(__dirname, "..", "..");
const results = path.resolve(opt.results || path.join(root, "results"));
const V = require(path.join(root, "board", "version.js")), idx = require("./index.js"), SV = require(path.join(root, "tools", "stamp-version.js"));

/** The newest version (by number, not date) older than `game` that has a release run folder. */
function lastRelease(rows, game) {
  const mine = SV.parse(game);
  const older = (v) => { const p = SV.parse(v); if (!p || !mine) return false; for (let i = 0; i < 3; i++) if (p[i] !== mine[i]) return p[i] < mine[i]; return false; };
  const rel = rows.filter((r) => r.kind === "release" && older(r.version)).sort((a, b) => {
    const x = SV.parse(a.version), y = SV.parse(b.version);
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i];
    return 0;
  });
  return rel[0] || null;
}
module.exports = { lastRelease };

if (require.main === module) {
  if (!SV.parse(V.game)) { console.error(`board/version.js is not stamped with a main version (${V.game}): run tools/stamp-version.js first.`); process.exit(1); }
  const rows = idx.collect(results);
  if (rows.some((r) => r.kind === "same" && r.version === V.game) || rows.some((r) => r.kind === "release" && r.version === V.game)) { console.log(`${V.game} already points to its numbers.`); process.exit(0); }
  const last = lastRelease(rows, V.game);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const answer = last ? `same games as ${last.version}` : "same games as the last version with a release run (none filed yet)";
  idx.addSame(results, { id: `${day}_same-${V.game}`, date: day, version: V.game, kind: "same", brief: "", tags: "same", question: `Did ${V.game} change how games play?`, answer: `no game file changed: ${answer}`, path: last ? last.path : "", commit: opt.commit || "" });
  console.log(`${V.game}: ${answer}`);
}
