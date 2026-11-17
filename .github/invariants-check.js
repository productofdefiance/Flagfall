// Wrapper for redteam/invariants.js (Brief 001). That script prints its findings but always exits 0,
// so this runs it, prints its output unchanged, and fails if it reports an impossible state or a bot error.
// node .github/invariants-check.js [games]
const { spawnSync } = require("child_process");
const path = require("path");

const games = process.argv[2] || "30";
const script = path.join(__dirname, "..", "redteam", "invariants.js");
const run = spawnSync(process.execPath, [script, games], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
process.stdout.write(run.stdout || "");
process.stderr.write(run.stderr || "");

const failures = [];
if (run.error) failures.push("could not start the script: " + run.error.message);
if (run.status !== 0) failures.push("script exited with code " + run.status);

const lines = (run.stdout || "").split("\n").map((l) => l.trim()).filter(Boolean);
let report = null;
try { report = JSON.parse(lines[0]); } catch (e) { failures.push("first line is not the expected JSON report"); }
if (report) {
  if (report.botErrors !== 0) failures.push(report.botErrors + " bot error(s)");
  if (report.refusedByEngine !== 0) failures.push(report.refusedByEngine + " bot action(s) refused by the engine");
  if (report.problems !== 0) failures.push(report.problems + " impossible state(s) or problem(s)");
}
const restore = lines.find((l) => l.startsWith("state unchanged after each refused action:"));
if (!restore) failures.push("state-restore line missing");
else if (restore.split(":")[1].split(",").some((v) => v.trim() !== "true")) failures.push("a refused action changed the match state");

if (failures.length) { console.error("\nINVARIANTS FAILED: " + failures.join("; ")); process.exit(1); }
console.log("\nInvariants OK: no impossible states, no bot errors.");
