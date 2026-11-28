# Brief 032 — Version at merge: follow-ups (replay links, reverts, stamp guard, counting test)

| | |
|---|---|
| Game version | ZZ (the board treats a build's preview label as the version it got; no rule, brain or screen change). Size only: the number is counted at merge (brief 031) |
| Lane | Lab (tooling) |
| Rule set | none |
| Date | 2026-11-28 |
| Goal | Finish brief 031's red team follow-ups: replay links from a build's own lab runs don't warn after it merges, reverts can't break the count, the stamp can't be committed by accident, and the counting test reads a real git history |
| Branch | Any branch your session may push to, started from `brief/032-version-follow-ups` |
| Flags | none to close. Open new ones in `flags/032.md` |
| Waits on | 031 |
| Order | After 031 merges. Builds beside 030, the attack UI brief and 012 (tooling only, no game or screen logic beyond the version label). **Must merge before 012** (the Editor, 28 Nov) |

## Context
Brief 031 moves the game version from the pull request to merge order. A red team reviewed its design on 27 Nov (`briefs/redteam/031-design.md`, on the `brief/031-version-at-merge` branch and, once 031 merges, on `main`). The Editor, 28 Nov, split the accepted fixes: the ones that make merging in any order safe went into 031; the five below are smaller edge cases and land here, before Cavalry (012), the first big build counted the new way. Finding codes are the red team's.

## Scope
In: `board/app.js` where it compares a saved match's version with the board's (one function), the stamp script and the counting module from 031, their tests, `CLAUDE.md`, the checks' error messages.
Out: anything that changes how a game plays or what any screen shows apart from the "different version" warning. The lab key reminder (L5) is not in this brief.

## What to build

### 1. Replay links from a build's own lab runs (M10)
A lab row or saved match made on a pull request carries the label `<main>+NNN` (for example `v3.20.01+030`). After 030 merges and becomes, say, v3.21.00, opening that row shows "A different version" today (`app.js`, the version comparison). The stamped board knows which version each brief got (031's counting gives a brief → version map). Treat `+NNN` as the version brief NNN got once it has merged, so no warning shows. A label from a brief that never merged keeps the warning. The replay itself is unchanged: replays go by rule set.

### 2. Reverts (L2)
GitHub's Revert button makes a pull request that deletes the build's `releases/NNN.json`, which 031's checks refuse (append-only). Make the refusal say why and what to do, in one line: `A revert keeps releases/NNN.json and adds its own (releases/NNN-2.json, bump ZZ or larger).` CLAUDE.md gets the same line under sync. The counter counts each releases file exactly once, so a revert of a revert can't bump twice; add a test for it.

### 3. The stamp can't be committed by accident (L3)
The stamp writes the number into `board/version.js`, a tracked file. A Code session that stamps and then commits everything would commit a number (031's check catches it, but late). Make the stamp refuse to run outside a GitHub workflow unless given `--local`, and print a one-line reminder not to commit `board/version.js` when it does run locally. If a cleaner route exists (stamping into an ignored file the board reads first), take it and say so in the Report.

### 4. The counting test reads real git (L4)
031's counting test may use a fixture list of pretend commits. Add a test that builds a scratch git repository in a temp folder: a baseline, one build merged as a merge commit, one squash-merged, one docs-only commit, one `NNN-2` follow-up, an X bump, and a revert pair. Run the real counting module on it and check every version and build number.

### 5. Clearer messages (L6)
A build stacked on another unmerged build adds two `releases/` files and fails "more than one". Make the message say why: `Two releases files: this branch contains brief NNN's unmerged work. Branch from main or the brief branch, never from another open pull request.`

## Rules it touches
None of the Game Laws. Standing process rules: old records replay exactly (unchanged: replays go by rule set), version at merge (brief 031).

## Bot minimum
n/a.

## Must not change
- Every preset plays and replays identically: `regress_engine.js` hashes unchanged.
- Every version 031 counted stays the same (the counting test on `main`'s real history gives the same numbers before and after).
- The quick checks run as 031 left them.

## Checks before opening the pull request
- Every check passes; `regress_engine.js` hashes match.
- A replay link labelled `+NNN` for a merged brief opens with no warning; one for an unmerged brief still warns (a test, plus a screenshot at 393 × 665).
- The scratch-repository counting test (section 4) passes.
- A pretend revert pull request fails with the new message; a pretend revert that keeps the file and adds `NNN-2` passes.

## The Editor's hands-on check
Open a lab row from a build that has merged since its run (the Report names one): it replays with no "different version" warning.

## Report back
The standard items, plus the replay link you checked by hand and the scratch history's numbers.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
  1. **Replay links (M10).** The stamp now also writes `briefs` into the published `board/version.js`: the version each merged brief got (`{ "031": "v3.20.01", … }`, counted on main; a preview gets main's map too). The watch link's version check (`app.js`, `startWatch`) treats `v3.20.01+030` as the version brief 030 got once it has merged; a label from an unmerged brief keeps the warning, and the warning names what a merged label became. The lookup lives in `board/version.js` (`resolve`, `differs`) so it can be tested in Node; `app.js` calls it from the one place. Replays still go by rule set. Screenshots at 393 × 665: `briefs/img/032/phone-watch-merged-no-warning.png` (link `+030` on a board stamped v3.21.00 with 030 → v3.21.00: plays straight away) and `briefs/img/032/phone-watch-unmerged-warns.png` (`+033`, never merged: warns).
  2. **Reverts (L2).** A deleted releases file now fails with exactly: `A revert keeps releases/NNN.json and adds its own (releases/NNN-2.json, bump ZZ or larger).` (for a follow-up file it names the next number). Same line in `CLAUDE.md` under sync. The count already counted each releases file once; it now also survives a revert that was merged despite the check (it reads the deleted file from the commit that added it, instead of stopping the stamp).
  3. **Stamp guard (L3).** `tools/stamp-version.js` refuses to write outside a GitHub workflow without `--local`, and with `--local` prints a one-line reminder not to commit `board/version.js`. `--print` and `--history` write nothing and need no flag. README and CLAUDE.md now say `--local`. I did not take the "ignored file" route: every reader (the board page, the lab's `play.js`, `plan.js`, `merge.js`, `nightly.js`, the tests) loads `board/version.js` directly, the repository has no `.gitignore`, and the play-links upload would need checking too; the guard gets the same protection with one file changed. (It happened to me in this build in reverse: putting `version.js` back after a local stamp wiped my own uncommitted edit to it, so the reminder is worth having.)
  4. **Scratch-history counting test (L4).** New `tools/test_count_git.js` (quick, rules job) builds a real git repository in a temp folder and runs the real counting module on it, then the stamp's command line.
  5. **Clearer message (L6).** Two releases files now fail with: `Two releases files: this branch contains brief NNN's unmerged work. Branch from main or the brief branch, never from another open pull request.` (NNN is the file that isn't the title's brief.)
  Also: the check fails a `briefs` map committed in `board/version.js`, like a number.
- **Anything beyond the brief, and why:** the `resolve`/`differs` helpers sit in `version.js` rather than inside `app.js` so the merged/unmerged rule has a Node test; the count reading a deleted releases file from its own commit (otherwise one bad revert merged by mistake would stop every stamp on main); the `briefs` check in `check-release.js` (a stamped map committed by accident would otherwise slip through). No game file changed.
- **The scratch history's numbers** (baseline v3.20.00 · Build 25): 031 merge commit ZZ → v3.20.01 · 26; 050 merge commit YY → v3.21.00 · 27; 051 squash ZZ → v3.21.01 · 28; docs-only commit → unchanged; 050-2 follow-up ZZ → v3.21.02 · 29; 052 X → v4.00.00 · 30; GitHub-style revert of 052 (deletes the file) → v4.00.00 · 31; revert of that revert (file back) → v4.00.00 · 32, not v5.00.00; 053 ZZ → v4.00.01 · 33; 053's revert done right (053-2, ZZ) → v4.00.02 · 34. Each brief listed once in the history; stamp CLI refuses without `--local`, stamps and reminds with it, stamps silently inside a workflow.
- **Checks run and results (paste regression hashes):**
  - Ran in this session, stamped `v3.20.01+032`: `test_version.js` (41 checks), `test_watch.js`, `test_ui.js`, `tools/test_tools.js`, `tools/test_count_git.js`, `sims/lab/test_workflows.js`, `sims/lab/self_test.js`, `sims/status/test_board.js`, `sims/status/test_page.js`: all pass. The board job (`test_hotseat`, `test_phone`, `test_rematch`, `test_spflow`, `board_check.js` 10 games, 0 different): 5 of 5 pass. `check-release.js` against main with this title: OK.
  - Skipped here: the full quick run was stopped at the session's 30-minute limit, still in the slow simulations (`test_v32.js`, invariants). This build changes no rule or bot file, so per CLAUDE.md those are left to GitHub's checks.
  - Pretend revert pull request: fails with the new line; pretend revert keeping `031.json` and adding `031-2.json`: passes (`tools/test_tools.js`).
  - Counting on main's real history, before and after: identical (`[{ 031 = v3.20.01 · Build 26 }]`, main v3.20.01 · Build 26).
  - Regression: no game file changed (`engine.js`, `bot.js`, `brain.js`, `data.js`, `fields.js`, `watch.js`, `tests/rng.js` byte-identical to the board before this build), so the game key is unchanged and no release run is due. `regress_engine.js <board> 3`, before and after, printed identical hashes (session run):
    match3       37397ef2bd3ed86b
    v1           7b25bca651c0cb31
    v2           ddbe5fc437ff4e9d
    v3           26371927b53d4413
    v3.1         c71e4cd12fc984b0
    v3.2         f62a061d2c147d83
    v3.3         e6151bf463d6c9f8
    v3.4         ee6ce003ac760250
    v3.5         fca989aecfaf21c9
    v3.6         a6bf327b54f7d5a1
    v3.7         dd3c27d9dc9aafbb
    v3.8         022a298c49a02540
    v3.9         b3c2d4464b363ba0
- **Bot minimum (met / not met, with numbers):** n/a
- **The replay link to check by hand:** no lab row labelled `+NNN` exists yet (031 only just merged; F032-1). Once this pull request merges, and before anything else that changes `board/` merges, open https://productofdefiance.github.io/Flagfall/?watch=K7QX2M&v=v3.20.01%2B032&rules=v3.10&format=std7&n=brain8&s=brain8&first=N (what a lab row from this build's own run looks like): it should play with no "different version" warning. The same link with `%2B033` should warn.
- **Known gaps:** a merged build's row is quiet only while the board is on the version that build got; the next versioned merge makes it warn again (F032-1). Rows made before a pull request added its releases file carry `+prNN`, not `+NNN`, and keep warning after the merge. Lab jobs stamped with `--set` carry no brief map (they never compare labels).
- **Flags closed / opened:** none closed. Opened F032-1 (ASK).
- **Branch:** `claude/build-brief-032-c437jw`.
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/78
