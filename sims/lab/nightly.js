// The nightly entry in results/ (Brief 008), written by night-checks.yml after the night's checks.
// node sims/lab/nightly.js --commit <sha> --checks <file: one "name=outcome" per line> [--parts <folder>] [--order <file>]
// If main is the same commit as the last passing night and tonight passed too: one INDEX line ("no change, passed"),
// no folder. Otherwise a `nightly` run folder: the night's checks plus a small health run (the default brain against
// itself, played by the night job with play.js into --parts).
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i];
const root = path.join(__dirname, "..", ".."), results = path.join(root, "results");
const V = require(path.join(root, "board", "version.js")), idx = require("./index.js");
const checks = fs.readFileSync(opt.checks, "utf8").split("\n").filter(Boolean).map((l) => l.split("="));
const passed = checks.every(([, o]) => o === "success");
const nyDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const version = V.game || (V.build ? `build-${V.build}` : "dev");   // Brief 031: stamped by tools/stamp-version.js
const last = idx.read(results).filter((r) => r.kind === "nightly")[0];   // newest first
if (passed && last && last.commit === opt.commit && /passed/.test(last.answer)) {
  idx.addNightly(results, { id: `${nyDate}_nightly`, date: nyDate, version, kind: "nightly", brief: "", tags: "nightly", question: "Do main's full checks still pass?", answer: "no change, passed", path: "", commit: opt.commit });   // Brief 016: kept in results/nightly.csv, so a rebuild keeps it
  console.log("no change, passed: index line only");
  process.exit(0);
}
// A folder: the health run's rows (if any) through merge.js, then the checks added to its summary.
const answer = passed ? `passed: all ${checks.length} night checks` : `FAILED: ${checks.filter(([, o]) => o !== "success").map(([n]) => n).join(", ")}`;
const order = JSON.parse(fs.readFileSync(opt.order, "utf8"));
order.answer = answer + (order.answer ? "; " + order.answer : "");
const tmp = path.join(require("os").tmpdir(), "nightly-order.json"); fs.writeFileSync(tmp, JSON.stringify(order));
const dir = cp.execFileSync("node", [path.join(__dirname, "merge.js"), "--results", results, "--parts", opt.parts || "/nonexistent", "--trigger", "night", "--commit", opt.commit, "--checks", opt.checks, tmp], { encoding: "utf8" }).trim();
// The index line carries the commit (from run.json, Brief 016's rebuild), so tomorrow can tell whether main changed.
console.log(dir);
