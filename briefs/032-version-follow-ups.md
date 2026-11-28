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
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Bot minimum (met / not met, with numbers):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
