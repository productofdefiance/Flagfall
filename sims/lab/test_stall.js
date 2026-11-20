// Brief 016 checks: the stall measure on hand-built games, merge.js totals from two parts equal one, record.js replays a
// seeded bot game to the lab's row, and the results index rebuild (F35): byte for byte on today's results/, and two
// results branches merged in either order end with both runs listed and no conflict left.
// node sims/lab/test_stall.js
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const root = path.join(__dirname, "..", "..");
const E = require(path.join(root, "board", "engine.js")), W = require(path.join(root, "board", "watch.js")), V = require(path.join(root, "board", "version.js"));
const { PRESETS } = require(path.join(root, "board", "data.js"));
const { MEASURES, ALWAYS } = require("./measures.js");
const idx = require("./index.js"), REC = require("./record.js");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } else console.log("  ok:", m); };
const RS = PRESETS.find((p) => p.id === "v3.5");
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
function setup(lineN, lineS, place) {
  const st = E.newMatch(RS, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const z = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = z[i++];
    E.act(st, { type: "deploy", team, placements: p });
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
/** Plays the actions through the stall measure as the lab does (before, act, after); returns its columns. */
function drive(st, actions) {
  const m = MEASURES.stall.make({ E });
  for (const a of actions) {
    const c = { action: typeof a === "function" ? a(st) : a };
    m.before(st, c);
    const r = E.act(st, c.action, () => c.action.die || 7);
    m.after(st, c, r);
    if (!r.ok) throw new Error(`${c.action.type}: ${r.error}`);
    if (st.phase !== "play") break;
  }
  return m.end(st);
}
const ends = (k) => Array.from({ length: k }, () => ({ type: "end" }));

ok(ALWAYS.includes("stall"), "stall is collected on every run (in ALWAYS)");

// ---- A game ending on a pull: quiet_end 0 ----
{ const st = setup([["HM", "HM"], ["LR", "LR"]], [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E16", "N-LR": "A8", "S-HM": "A12", "S-LM": "I8" });
  st.pole.S = 9;
  const s = drive(st, [{ type: "pull", uid: "N-HM", die: 12 }]);
  ok(st.result && st.result.how === "KO", "pull game ends on a KO");
  ok(s.quiet_end === 0 && s.damage_quiet_end === 0, `a game ending on a pull: quiet_end 0 (got ${s.quiet_end}, damage ${s.damage_quiet_end})`);
  ok(s.first_attack_turn === 1 && s.last_damage_turn === 1, `first attack and last damage on turn 1 (got ${s.first_attack_turn}, ${s.last_damage_turn})`);
  ok(s.first_contact_turn === "", `no two enemies ever stood next to each other (got "${s.first_contact_turn}")`);
  ok(s.limit_decided_by === "" && s.limit_flag_margin === "", "not a turn-limit game: those columns are blank");
  ok(s.units_n_l3 === "" && s.gap_l3 === "", "ended before turn limit − 3: the l3 columns are blank"); }

// ---- A turn-limit game with a quiet ending; a holder at limit − 3 ----
{ const st = setup([["HM", "HM"], ["LR", "LR"]], [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E9", "N-LR": "A8", "S-HM": "E17", "S-LM": "E10" });
  const lim = E.turnLimit(st), total = 2 * lim;
  const s = drive(st, [{ type: "attack", uid: "N-HM", target: "S-LM", die: 7 }, ...ends(total + 2)]);
  ok(st.result && /^turn limit/.test(st.result.how), `ends on the turn limit (${st.result && st.result.how})`);
  ok(s.first_contact_turn === 1, `first contact on turn 1 (got ${s.first_contact_turn})`);
  ok(s.first_attack_turn === 1 && s.last_damage_turn === 1, "first attack and last damage on turn 1");
  ok(s.quiet_end === total - 1 && s.longest_quiet === total - 1 && s.quiet_side_turns === total - 1, `${total} side-turns, the first with the attack: quiet_end ${total - 1} (got ${s.quiet_end}, longest ${s.longest_quiet}, quiet ${s.quiet_side_turns})`);
  ok(s.damage_quiet_end === total - 1, `damage_quiet_end ${total - 1} (got ${s.damage_quiet_end})`);
  ok(s.holder_s_l3 === 1 && s.holder_n_l3 === 0, "South holds its flag at limit − 3, North doesn't");
  ok(s.units_s_l3 === 1 && s.units_n_l3 === 2, `units at limit − 3, holder left out: N 2, S 1 (got ${s.units_n_l3}, ${s.units_s_l3})`);
  ok(s.uc_s_l3 === 2 && s.uc_n_l3 === 2, `unit cap at limit − 3, holder in: 2 and 2 (got ${s.uc_n_l3}, ${s.uc_s_l3})`);
  ok(s.gap_l3 === 1, `closest opposing non-holders at limit − 3: E9 and E10, 1 hex (got ${s.gap_l3})`);
  ok(s.flag_s_l3 === E.flagShown(st, "S") && s.flag_n_l3 === E.flagShown(st, "N"), "flag health as the board shows it");
  ok(s.limit_decided_by === (st.result.how === "turn limit, draw" ? "draw" : /fewer/.test(st.result.how) ? "units" : "flag"), `decided by: ${s.limit_decided_by} (${st.result.how})`);
  ok(s.limit_flag_margin === 0, "no flag damage either side: margin 0");
  ok(s.units_n_end === 2 && s.units_s_end === 1 && s.gap_end === 1, "the same counts at the end"); }

// ---- Reactions are the last damage: parry, then set spear on a move ----
{ const st = setup([["HM", "HM"], ["LM", "LM"]], [["HM", "HM"], ["HA", "HA"], ["LR", "LR"]], { "N-HM": "E7", "N-LM": "C6", "S-HM": "E8", "S-HA": "C9", "S-LR": "A14" });
  U(st, "S-HM").braced = true; U(st, "S-HA").braced = true;
  const hp0 = U(st, "N-HM").hp;
  const s = drive(st, [{ type: "attack", uid: "N-HM", target: "S-HM", die: 7 }, { type: "end" },
    (x) => { U(x, "S-HA").braced = true; U(x, "S-HA").spikeUsed = false; return { type: "end" }; },
    { type: "move", uid: "N-LM", to: "C8" }, { type: "end" }, { type: "end" }]);
  ok(U(st, "N-HM").hp < hp0, "the parry hurt the attacker on turn 1");
  ok(s.first_attack_turn === 1, "first attack on turn 1");
  ok(s.last_damage_turn === 2, `set spear on a move made turn 2 the last damage, with no attack that turn (got ${s.last_damage_turn})`);
  // side-turns played: N1 (attack), S1, N2 (spear on the move), S2: three after the attack, one after the spear
  ok(s.quiet_end === 3 && s.damage_quiet_end === 1, `after the attack 3 side-turns, after the spear 1 (got ${s.quiet_end}, ${s.damage_quiet_end})`); }

// ---- A side down to only its holder: gap blank ----
{ const st = setup([["HM", "HM"], ["LR", "LR"]], [["HM", "HM"], ["LM", "LM"]], { "N-HM": "E9", "N-LR": "A8", "S-HM": "E17", "S-LM": "E10" });
  U(st, "S-LM").hp = 0;
  const lim = E.turnLimit(st);
  const s = drive(st, ends(2 * lim + 2));
  ok(s.units_s_l3 === 0 && s.gap_l3 === "" && s.gap_end === "", `South has only its holder: units 0, gap blank (got ${s.units_s_l3}, "${s.gap_l3}")`);
  ok(s.first_attack_turn === "" && s.quiet_side_turns === 0 && s.longest_quiet === 0, "no attack at all: first attack blank, nothing counted after it");
  ok(s.quiet_end === 2 * lim, `no attack at all: quiet_end counts every side-turn (${2 * lim}, got ${s.quiet_end})`); }

// ---- merge.js: two parts give the same tables as one; record.js replays a lab game to the lab's row ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stall-"));
const order = { id: "stall-check", kind: "experiment", question: "Does the stall measure add up?", measures: ["play"],
  matchups: [{ name: "m5", a: "kitD", b: "kitD", rules: "v3.5", format: "blitz5", mix: "mixed", games: 4 }] };
const of = path.join(tmp, "order.json"); fs.writeFileSync(of, JSON.stringify(order));
const node = (args) => cp.execFileSync("node", args, { encoding: "utf8", cwd: root, stdio: ["ignore", "pipe", "ignore"] });
for (const [dir, parts] of [["one", 1], ["two", 2]]) {
  fs.mkdirSync(path.join(tmp, dir, "parts"), { recursive: true });
  for (let p = 0; p < parts; p++) node([path.join(__dirname, "play.js"), "--part", String(p), "--parts", String(parts), "--out", path.join(tmp, dir, "parts", `p${p}.jsonl`), of]);
  node([path.join(__dirname, "merge.js"), "--results", path.join(tmp, dir, "results"), "--parts", path.join(tmp, dir, "parts"), of]);
}
const runDir = (dir) => { const v = path.join(tmp, dir, "results", V.game || `build-${V.build}`); return path.join(v, fs.readdirSync(v)[0]); };
const stallOne = fs.readFileSync(path.join(runDir("one"), "tables", "stall.csv"), "utf8"), stallTwo = fs.readFileSync(path.join(runDir("two"), "tables", "stall.csv"), "utf8");
ok(stallOne === stallTwo && /first_attack_turn_avg/.test(stallOne), "stall.csv from two parts equals the one from one part, with totals and averages");
ok(/\*\*Stalls\*\*/.test(fs.readFileSync(path.join(runDir("one"), "SUMMARY.md"), "utf8")), "SUMMARY.md has the stall lines");
{ const run = JSON.parse(fs.readFileSync(path.join(runDir("one"), "run.json"), "utf8"));
  ok(typeof run.answer === "string" && run.answer.length > 0, "run.json carries the answer (the index rebuild reads it)"); }
{ const labRow = JSON.parse(fs.readFileSync(path.join(tmp, "one", "parts", "p0.jsonl"), "utf8").split("\n")[0]);
  const spec = { seed: labRow.seed, v: V.game || null, rules: "v3.5", format: "blitz5", n: labRow.brain_n, s: labRow.brain_s, mixN: "mixed", mixS: "mixed", first: labRow.first };
  const { m, st } = W.playOut(spec, {});
  const rec = JSON.parse(JSON.stringify({ ruleset: m.rs, opts: m.opts, brains: m.brains, game: V.game, build: V.build, actions: st.actions, result: st.result }));
  const row = REC.rowOf(rec, ALWAYS.concat(order.measures).filter((x) => x !== "timing"));
  const skip = new Set(["replay", "order", "matchup", "game", "a_side", "version", "brain_n", "brain_s", ...MEASURES.timing.columns]);
  const diff = Object.keys(labRow).filter((k) => !skip.has(k) && String(labRow[k]) !== String(row[k]));
  ok(!row.skip && diff.length === 0, `record.js replays the lab's game to the same row (${row.skip || (diff.length ? "differs in " + diff.map((k) => `${k}: ${labRow[k]} vs ${row[k]}`).join(", ") : "same")})`);
  const bad = Object.assign({}, rec, { result: { winner: rec.result && rec.result.winner === "N" ? "S" : "N", how: "KO" } });
  ok(!!REC.rowOf(bad).skip, "a record that replays to a different result is skipped, not guessed"); }

// ---- The index rebuild (F35) ----
{ const copy = path.join(tmp, "results-copy");
  fs.cpSync(path.join(root, "results"), copy, { recursive: true });
  idx.rebuild(copy);
  ok(fs.readFileSync(path.join(copy, "index.csv"), "utf8") === fs.readFileSync(path.join(root, "results", "index.csv"), "utf8"), "the rebuilt index.csv equals today's byte for byte");
  ok(fs.readFileSync(path.join(copy, "INDEX.md"), "utf8") === fs.readFileSync(path.join(root, "results", "INDEX.md"), "utf8"), "the rebuilt INDEX.md equals today's byte for byte");
  // a quiet night has no folder: it lives in nightly.csv and survives a rebuild
  idx.addNightly(copy, { id: "2099-01-01_nightly", date: "2099-01-01", version: "v9.99.99", kind: "nightly", brief: "", tags: "nightly", question: "Do main's full checks still pass?", answer: "no change, passed", path: "", commit: "abc" });
  idx.rebuild(copy);
  ok(idx.read(copy)[0].id === "2099-01-01_nightly" && idx.read(copy)[0].commit === "abc", "a quiet night's line (no folder) survives a rebuild, with its commit"); }
// two results branches, each adding a run, merged in either order
{ const repo = path.join(tmp, "repo"), git = (...a) => cp.execFileSync("git", a, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  fs.mkdirSync(repo); git("init", "-q", "-b", "main"); git("config", "user.email", "t@t"); git("config", "user.name", "t");
  fs.cpSync(path.join(root, "results"), path.join(repo, "results"), { recursive: true });
  git("add", "-A"); git("commit", "-q", "-m", "base");
  const addRun = (branch, id, finished) => {
    git("checkout", "-q", "-b", branch, "main");
    const dir = path.join(repo, "results", "v9.99.99", id); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "run.json"), JSON.stringify({ id, kind: "screen", version: "v9.99.99", brief: null, question: "q " + id, tags: [], started: finished, finished, answer: "a " + id }));
    idx.rebuild(path.join(repo, "results")); git("add", "-A"); git("commit", "-q", "-m", id); git("checkout", "-q", "main");
  };
  addRun("lab/a", "2099-02-01_screen_a", "2099-02-01T10:00:00Z");
  addRun("lab/b", "2099-02-01_screen_b", "2099-02-01T11:00:00Z");
  for (const [first, second] of [["lab/a", "lab/b"], ["lab/b", "lab/a"]]) {
    git("checkout", "-q", "-B", "trial", "main");
    git("merge", "-q", "--no-edit", first);
    // the second branch falls behind: the refresh merges main into it and rebuilds the index on conflict
    git("checkout", "-q", "-B", "second", second);
    let conflicted = false;
    try { git("merge", "-q", "--no-edit", "trial"); } catch (e) { conflicted = true; }
    if (conflicted) {
      const u = git("diff", "--name-only", "--diff-filter=U").trim().split("\n").filter(Boolean);
      ok(u.every((f) => /^results\/(INDEX\.md|index\.csv)$/.test(f)), `${second} after ${first}: only the index files conflict (${u.join(", ")})`);
      git("checkout", "-q", "--theirs", "results/INDEX.md", "results/index.csv");
      idx.rebuild(path.join(repo, "results")); git("add", "-A"); git("commit", "-q", "-m", "refresh");
    }
    git("checkout", "-q", "trial"); git("merge", "-q", "--no-edit", "second");
    const ids = idx.read(path.join(repo, "results")).map((r) => r.id);
    ok(ids[0] === "2099-02-01_screen_b" && ids[1] === "2099-02-01_screen_a" && ids.length === idx.read(path.join(root, "results")).length + 2,
      `${first} then ${second}: both runs listed, newest first, nothing lost, no conflict left (${ids.slice(0, 2).join(", ")})`);
    git("checkout", "-q", "main"); git("branch", "-q", "-D", "trial", "second");
  } }

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
