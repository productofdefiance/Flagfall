// Version checks (Brief 007): the game version on the board, saved matches, and the build-number check.
// node tests/test_version.js
const path = require("path"), fs = require("fs"), os = require("os"), cp = require("child_process");
const V = require("../version.js");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } else console.log("  ok:", m); };

ok(/^v\d+\.\d{2}\.\d{2}$/.test(V.game), `game version is written vX.YY.ZZ (${V.game})`);
ok(V.game === "v3.17.00", "game version is v3.17.00 (Brief 026: the next YY after Brief 018's v3.16.00)");
ok(Number.isInteger(V.build) && V.build >= 10, `build number is kept beside it (${V.build})`);
ok(V.preview === null, "preview stays null in the repository");

// The version line (Home screen)
ok(V.line("v3.4") === `Playtest board · v3.17.00 · Build ${V.build} · Rules v3.4`, `version line (CLAUDE.md: version, then the build): "${V.line("v3.4")}"`);
const prev = Object.assign({}, V, { preview: "PR #12" });
ok(V.line("v3.4", prev) === `Playtest board · v3.17.00 · Build ${V.build} · Preview of PR #12 · Rules v3.4`, `preview copy keeps its "Preview of PR #N": "${V.line("v3.4", prev)}"`);
ok(V.line("v3.4").indexOf("v3.17.00") < V.line("v3.4").indexOf("Build"), "the version comes before the build number");

// A saved match (the match's own line, and the Matches screen)
const now = { game: V.game, build: V.build };
const NOW = ` · v3.17.00 · Build ${V.build}`;
ok(V.note(now) === NOW, `a match started on this version: "${V.note(now)}"`);
ok(V.startedOn(now) === "v3.17.00", "Matches screen shows v3.17.00 for a match saved on this version");
const b6 = { build: 6 };   // saved on Build 6, before the game version existed
ok(V.startedOn(b6) === "Build 6", `a match saved on Build 6 still shows "Build 6" (got "${V.startedOn(b6)}")`);
ok(V.note(b6) === NOW + " (started on Build 6)", `and its line says so, without guessing a version: "${V.note(b6)}"`);
ok(V.startedOn({}) === null && V.note({}) === NOW, "a match with neither shows nothing extra");
const older = { game: "v3.05.00", build: 6 };
ok(V.note(older) === NOW + " (started on v3.05.00)", `a match started on another version: "${V.note(older)}"`);

// app.js records the game version with each match and in each summary
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
ok(/started: new Date\(\)\.toISOString\(\), game: V\.game/.test(app), "a new match records the game version it started on");
ok(/game: match\.game \|\| null, build: match\.build/.test(app), "a finished match's summary keeps it next to build");
ok(/game: m\.game \|\| null, build: m\.build/.test(app), "the copied match record keeps it next to build");

// The checks workflow's version check: a change to board/ must raise the build and change the game version.
const script = path.join(__dirname, "..", "..", ".github", "check-build-number.sh");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ggver-"));
const board = (dir, game, build, extra) => {
  fs.mkdirSync(path.join(dir, "board"), { recursive: true });
  fs.writeFileSync(path.join(dir, "board", "version.js"), `module.exports = { ${game ? `game: "${game}", ` : ""}build: ${build}, preview: null };\n`);
  fs.writeFileSync(path.join(dir, "board", "engine.js"), `// ${extra || "same"}\n`);
};
const run = (a, b) => { try { cp.execFileSync("bash", [script, a, b], { stdio: "pipe" }); return 0; } catch (e) { return e.status || 1; } };
const d = (x) => path.join(tmp, x);
board(d("base"), "v3.06.00", 7);
board(d("same"), "v3.06.00", 7);
board(d("good"), "v3.06.01", 8, "changed");
board(d("stuck"), "v3.06.00", 8, "changed");
board(d("nobuild"), "v3.06.01", 7, "changed");
board(d("bad"), "3.6", 8, "changed");
board(d("old"), null, 6);
ok(run(d("base"), d("same")) === 0, "version check passes when board/ is unchanged");
ok(run(d("base"), d("good")) === 0, "version check passes when the build goes up and the game version changes");
ok(run(d("base"), d("stuck")) !== 0, "version check fails a change to board/ that leaves the game version unchanged");
ok(run(d("base"), d("nobuild")) !== 0, "version check fails a change to board/ that leaves the build number unchanged");
ok(run(d("base"), d("bad")) !== 0, "version check fails a game version not written vX.YY.ZZ");
ok(run(d("old"), d("base")) === 0, "version check passes against a board from before the game version (Build 6)");
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
