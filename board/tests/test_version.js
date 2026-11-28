// @test job=rules quick=yes release=yes night=no
// Version checks (Brief 007, rewritten for Brief 031): the counted version, the stamp, the board's version line and
// saved matches. The number is never typed in here: it comes from tools/stamp-version.js (on a fixture history, and on
// this repository when its history is present).
// node tests/test_version.js
const path = require("path"), fs = require("fs"), os = require("os"), cp = require("child_process");
const V = require("../version.js");
const ROOT = path.join(__dirname, "..", "..");
const SV = require(path.join(ROOT, "tools", "stamp-version.js"));
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } else console.log("  ok:", m); };

// ---- The repository holds no number ----
const src = fs.readFileSync(path.join(__dirname, "..", "version.js"), "utf8");
const repoCopy = (() => { try { return cp.execFileSync("git", ["show", "HEAD:board/version.js"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { return src; } })();
ok(/game: null, build: null, date: null, preview: null/.test(repoCopy), "board/version.js in the repository keeps game, build and date at null");
ok(/never edit by hand/i.test(repoCopy), "board/version.js says it is stamped when published, never edited by hand");
ok(V.preview === null || /^PR #\d+$/.test(V.preview), "preview stays null in the repository");

// ---- Counting (pure) ----
ok(SV.bump("v3.20.00", "ZZ") === "v3.20.01" && SV.bump("v3.20.01", "YY") === "v3.21.00" && SV.bump("v3.21.05", "X") === "v4.00.00" && SV.bump("v3.20.00", "none") === "v3.20.00", "bump sizes: ZZ, YY (ZZ to 00), X (YY and ZZ to 00), none");
ok(SV.bump("v3.09.09", "ZZ") === "v3.09.10", "two digits after each dot, carrying past 9");
let threw = false; try { SV.bump("v3.20.00", "big"); } catch (e) { threw = true; } ok(threw, "an unknown bump size is refused");

// ---- A fixture history: real git, merge commits and a squash merge ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ffver-"));
const g = (...a) => cp.execFileSync("git", a, { cwd: tmp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const write = (f, t) => { fs.mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); fs.writeFileSync(path.join(tmp, f), t); };
g("init", "-q", "-b", "main"); g("config", "user.email", "t@example.com"); g("config", "user.name", "test"); g("config", "commit.gpgsign", "false");
write("board/version.js", repoCopy); write("board/app.js", "// app\n"); write("board/engine.js", "// engine\n"); write("README.md", "x\n");
g("add", "-A"); g("commit", "-qm", "main before the change-over");
const base = g("rev-parse", "HEAD");
write("releases/BASE.json", JSON.stringify({ game: "v3.20.00", build: 25, date: "2026-11-27", commit: base, merged: ["029"] }));
write("releases/031.json", JSON.stringify({ brief: "031", bump: "ZZ", rules: null, brain: null, ui: null }));
write("board/version.js", repoCopy + "// 031\n");
g("checkout", "-qb", "b031"); g("add", "-A"); g("commit", "-qm", "031"); g("checkout", "-q", "main"); g("merge", "-q", "--no-ff", "-m", "Merge 031", "b031");
const at = (ref) => SV.countAt(tmp, ref || "HEAD");
let c = at();
ok(c.game === "v3.20.01" && c.build === 26, `the change-over counts itself: baseline v3.20.00 · Build 25 + ZZ = ${c.game} · Build ${c.build}`);
const brief = (num, bump, files, how) => {
  g("checkout", "-qB", `b${num}`, "main");
  write(`releases/${num}.json`, JSON.stringify({ brief: num, bump, rules: bump === "YY" ? "v3.11" : null, brain: null, ui: null }));
  write(`changelog/${num}.md`, `## Brief ${num} · test\n`);
  for (const f of files) write(f, `// ${num}\n`);
  g("add", "-A"); g("commit", "-qm", `brief ${num}`);
  return () => {
    g("checkout", "-q", "main");
    if (how === "squash") { g("merge", "-q", "--squash", `b${num}`); g("commit", "-qm", `brief ${num} (squash)`); }
    else g("merge", "-q", "--no-ff", "-m", `Merge ${num}`, `b${num}`);
  };
};
// Two builds from the same main, merged in either order.
const fork = g("rev-parse", "HEAD");
const mergeA = brief("040", "YY", ["board/app.js"]), mergeB = brief("041", "ZZ", ["board/engine.js"], "squash");
mergeA(); c = at(); ok(c.game === "v3.21.00" && c.build === 27, `A (YY) merged first: ${c.game} · Build ${c.build}`);
mergeB(); c = at(); ok(c.game === "v3.21.01" && c.build === 28, `then B (ZZ, a squash merge) with no conflict: ${c.game} · Build ${c.build}`);
const orderAB = c.history.map((h) => `${h.brief}=${h.game}`).join(" ");
g("checkout", "-q", "-B", "main", fork);
const mergeB2 = brief("041", "ZZ", ["board/engine.js"], "squash"), mergeA2 = brief("040", "YY", ["board/app.js"]);
mergeB2(); c = at(); ok(c.game === "v3.20.02" && c.build === 27, `out of order, B (ZZ) first: ${c.game} · Build ${c.build}`);
mergeA2(); c = at(); ok(c.game === "v3.21.00" && c.build === 28, `then A (YY): ${c.game} · Build ${c.build}`);
ok(orderAB !== c.history.map((h) => `${h.brief}=${h.game}`).join(" "), `each build is numbered in merge order (A then B: ${orderAB}; B then A: ${c.history.map((h) => `${h.brief}=${h.game}`).join(" ")})`);
// none: no new version; a board change still raises the build (the version check forbids that combination, the count doesn't care)
brief("042", "none", ["tools/x.js"])(); c = at(); ok(c.game === "v3.21.00" && c.build === 28, `bump none with no board change: same version and build (${c.game} · Build ${c.build})`);
// X resets YY and ZZ
brief("043", "ZZ", ["board/engine.js"])(); brief("044", "X", ["board/engine.js"])(); c = at();
ok(c.game === "v4.00.00" && c.build === 30, `X resets YY and ZZ: v3.21.01 then ${c.game} · Build ${c.build}`);
// Two merges in a row, then a results-only commit (no board change, no releases file): nothing moves
brief("045", "ZZ", ["board/app.js"])(); brief("046", "YY", ["board/app.js"])();
write("results/x.csv", "a\n"); g("add", "-A"); g("commit", "-qm", "Lab results"); c = at();
ok(c.game === "v4.01.00" && c.build === 32, `two merges in a row, then a results commit: ${c.game} · Build ${c.build}`);
ok(c.history.find((h) => h.brief === "045").game === "v4.00.01" && c.history.find((h) => h.brief === "045").build === 31, "each merged build keeps the number it got (045 = v4.00.01 · Build 31)");
// A pull request's label: <main's version>+NNN, build null
g("checkout", "-qb", "b047", "main"); write("releases/047.json", JSON.stringify({ brief: "047", bump: "YY", rules: null, brain: null, ui: null })); g("add", "-A"); g("commit", "-qm", "047");
ok(SV.prBrief(tmp, "main") === "047" && SV.label(at("main").game, SV.prBrief(tmp, "main")) === "v4.01.00+047", `a pull request's label reads <main>+NNN: ${SV.label(at("main").game, "047")}`);
// The stamp writes only the working copy
SV.stamp(tmp, { game: "v4.01.00+047", build: null, date: "2026-11-28" });
const stamped = require(path.join(tmp, "board", "version.js"));
ok(stamped.game === "v4.01.00+047" && stamped.build === null && stamped.line("v3.10") === "Playtest board · v4.01.00+047 · Rules v3.10", `the stamp writes the label into version.js: "${stamped.line("v3.10")}"`);
ok(g("status", "--porcelain").includes("board/version.js") && g("log", "-1", "--format=%s") === "047", "the stamp never commits");
// A brief that edits an old releases file is refused by the count's reader only through the check; a bad file stops the count
// F031-1 (A4): a follow-up to a merged brief adds releases/045-2.json with its own bump, counted once
g("checkout", "-q", "main"); brief("045-2", "ZZ", ["board/ui.js"])(); c = at();
ok(c.game === "v4.01.01" && c.build === 33 && c.history.filter((h) => h.brief === "045-2").length === 1, `a follow-up (045-2, ZZ) counts its own bump once: ${c.game} · Build ${c.build}`);
g("checkout", "-q", "main"); write("releases/048.json", "{\"brief\":\"048\",\"bump\":\"huge\"}"); g("add", "-A"); g("commit", "-qm", "bad");
threw = false; try { at(); } catch (e) { threw = /bump/.test(e.message); } ok(threw, "a releases file with a bad bump stops the count with its reason");
fs.rmSync(tmp, { recursive: true, force: true });

// ---- The version line and saved matches (from a stamped copy, never a typed-in number) ----
const W = Object.assign({}, V, { game: SV.bump("v3.20.00", "ZZ"), build: 26 });
ok(V.line("v3.4", W) === `Playtest board · ${W.game} · Build 26 · Rules v3.4`, `version line (the version, then the build): "${V.line("v3.4", W)}"`);
ok(V.line("v3.4", Object.assign({}, W, { preview: "PR #12" })) === `Playtest board · ${W.game} · Build 26 · Preview of PR #12 · Rules v3.4`, "a preview copy keeps its Preview of PR #N");
ok(V.line("v3.4", { game: null, build: null, preview: null }) === "Playtest board · dev · Rules v3.4", "an unstamped board shows dev where the version goes");
const NOW = ` · ${W.game} · Build 26`;
ok(V.note({ game: W.game, build: 26 }, W) === NOW, `a match started on this version: "${V.note({ game: W.game, build: 26 }, W)}"`);
ok(V.startedOn({ build: 6 }) === "Build 6" && V.note({ build: 6 }, W) === NOW + " (started on Build 6)", "a match saved on Build 6 still shows Build 6, never a guessed version");
ok(V.note({ game: "v3.05.00", build: 6 }, W) === NOW + " (started on v3.05.00)", "a match started on another version says so");
ok(V.note({ game: "v3.20.01+031" }, W) === NOW + " (started on v3.20.01+031)", "a match saved on a preview shows its label");
ok(V.startedOn({}) === null && V.note({}, W) === NOW, "a match with neither shows nothing extra");

// app.js records the game version with each match and in each summary
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
ok(/started: new Date\(\)\.toISOString\(\), game: V\.game/.test(app), "a new match records the game version it started on");
ok(/game: match\.game \|\| null, build: match\.build/.test(app), "a finished match's summary keeps it next to build");
ok(/game: m\.game \|\| null, build: m\.build/.test(app), "the copied match record keeps it next to build");

// ---- This repository: the board reads what the stamp counts ----
let here = null;
try { here = SV.countAt(ROOT, "HEAD"); } catch (e) { console.log(`  (this clone has no history back to the baseline: ${e.message.split(":")[0]}; repository count skipped)`); }
if (here) {
  ok(SV.parse(here.game) !== null && Number.isInteger(here.build), `this repository counts to ${here.game} · Build ${here.build}`);
  if (V.game === null) ok(true, "this working copy is unstamped (shows dev)");
  else ok(V.game === here.game || new RegExp(`^v\\d+\\.\\d{2}\\.\\d{2}\\+`).test(V.game), `the stamped board reads the counted number or a pull request's label (${V.game})`);
}

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
