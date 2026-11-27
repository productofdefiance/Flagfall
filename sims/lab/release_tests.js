// The release run's checks (Brief 031; replaces the hand-kept release_quick.txt).
// The list is built from board/tests/test_*.js itself, so a new test file is in the release run the day it is added.
// Only the counts are kept by hand (COUNTS: file → games, default none) and the few files run by their own release
// job (DEDICATED). A file in neither the release run nor SKIP fails test_workflows.js.
//   node sims/lab/release_tests.js --quick    "name|command" per line, run one after another in the "quick checks" job
//   node sims/lab/release_tests.js --check    fails when a test file is in neither the release run nor SKIP
"use strict";
const fs = require("fs"), path = require("path");

const TESTS = path.join(__dirname, "..", "..", "board", "tests");
// Games per format (or per format and lineup) for the release run; a file not listed runs with no count.
const COUNTS = { "test_kitd.js": 30, "test_brain5.js": 30, "test_v35.js": 6, "test_v36.js": 4, "test_v37.js": 2, "test_fields.js": 2, "test_v310.js": 4, "test_events.js": 2 };
// Extra arguments a file needs (not a count).
const ARGS = { "test_replay.js": "../data/match3_log.txt" };
// Run by their own release jobs in lab.yml: test_v32.js at 400 + 400, test_invariants.js at 100, the other brains at 30.
const DEDICATED = (f) => f === "test_v32.js" || f === "test_invariants.js" || (/^test_brain\d+\.js$/.test(f) && f !== "test_brain5.js");
// Not in the release run, each with its reason. Keep this short.
const SKIP = {
  // (none: the four browser checks run in the quick checks job, which installs a headless browser)
};
// Need a headless browser (Playwright); the quick checks job installs one.
const BROWSER = ["test_phone.js", "test_hotseat.js", "test_spflow.js", "test_rematch.js"];

function files() { return fs.readdirSync(TESTS).filter((f) => /^test_.*\.js$/.test(f)).sort(); }
/** [{ name, cmd, browser }] for the quick checks job (run from board/). Names match the runs before Brief 031. */
function quick() {
  return files().filter((f) => !DEDICATED(f) && !(f in SKIP)).map((f) => {
    const n = COUNTS[f];
    const name = n && (f === "test_kitd.js" || f === "test_brain5.js") ? `${f} (${n})` : f;
    return { name, cmd: `node tests/${f}${n ? ` ${n}` : ""}${ARGS[f] ? ` ${ARGS[f]}` : ""}`, browser: BROWSER.includes(f) };
  });
}
/** Test files in neither the release run nor SKIP (should be none). */
function missing() { const q = new Set(quick().map((x) => x.cmd.split(" ")[1].slice(6))); return files().filter((f) => !q.has(f) && !DEDICATED(f) && !(f in SKIP)); }

module.exports = { files, quick, missing, DEDICATED, SKIP, COUNTS, BROWSER };

if (require.main === module) {
  if (process.argv.includes("--check")) {
    const m = missing();
    if (m.length) { console.error(`Not in the release run and not in SKIP: ${m.join(", ")}`); process.exit(1); }
    console.log(`All ${files().length} test files are in the release run (${quick().length} quick, ${files().filter(DEDICATED).length} in their own jobs, ${Object.keys(SKIP).length} skipped).`);
  } else for (const q of quick()) console.log(`${q.name}|${q.cmd}`);
}
