# Changelog

Newest first. One entry per build, written for the Editor: what a player notices first, then what changed under the hood.

## Build 3 — Brief 003, version line and play links (18 Nov 2026)
Rule set: none changed (v3.2 stays the newest).

**What a player will notice**
- Home says which build and rules you're on: "Playtest board · Build 3 · Rules v3.2". A preview copy of a pull request also says "Preview of PR #N".
- The in-match menu shows the build after the rule set. If a match was started on an earlier build, it says so ("Build 4 (started on Build 3)").
- Every new match remembers the build it was started on. The Matches screen shows it under the rule set. Matches saved before Build 3 show none.
- Each finished match has a Copy button that copies its record for Claude. It works for matches finished from Build 3 on; older matches saved only on this device kept no moves, so there's nothing to copy, and the button says so.
- Every pull request gets a "Play this build" link, and `main` is playable at https://productofdefiance.github.io/Flagfall/ once GitHub Pages is switched on.

**Under the hood**
- `board/version.js` is the only place the build number is kept. `checks` fails a pull request that changes `board/` without raising it.
- `checks` is split into parallel quick jobs (a few minutes). The full 400 + 400 double-knockout count moved to a nightly run (`night-checks`), which can also be started by hand or by the `full checks` label on a pull request. A failing night run opens a "Night checks failed" issue.
- New `play-links` workflow publishes `main` and every open pull request to the `gh-pages` branch.

**Flags closed:** none. **Opened:** F21 (a holder on its last half point shows HP 0).

## Build 2 — Brief 002, v3.2: order of operations (17 Nov 2026)

**What a player will notice**
- New games start on rule set **v3.2**. Older rule sets are still in the list and play exactly as before.
- A braced Heavy Melee that dies to a hit no longer strikes back (no parry).
- A braced Heavy Melee parries only the first adjacent attack against it each enemy turn. Ranged shots and Reach attacks never use the parry up. The attack preview says when a parry is already used, and when it only happens if the target survives.
- If one action ever finishes both sides, the match goes to the turn-limit tiebreaks (more pull damage, then fewer beings lost, then a draw) instead of to the side that acted. In 800 bot games this never happened.

**Under the hood**
- Three new rule switches: `parryNeedsSurvivor`, `parryFirstOnly`, `doubleKoToTiebreak`.
- New tests: `test_v32.js` (the new rules, the rules they touch, and an 800-game double-knockout count) and `test_invariants.js` (impossible-state check on the newest rule set). Both run on every pull request.
- The replay regression hashes now cover v3.1. They leave out only the newest rule set.

**Flags closed:** F3, F4, F5, F17, F18, F19 (raised and answered during this build), F20 (accepted as built).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.1 7v7 | v3.2 7v7 | v3.1 5v5 | v3.2 5v5 |
|---|---|---|---|---|
| Holder KO | 61.8% | 61.0% | 24.8% | 24.0% |
| Pull KO | 0.2% | 0.5% | 0% | 0% |
| TKO | 0.2% | 0% | 0% | 0% |
| Tiebreak win | 28.8% | 27.2% | 7.5% | 8.0% |
| Draw | 9.0% | 11.2% | 67.8% | 68.0% |
| Ended on the turn limit | 37.8% | 38.5% | 75.2% | 76.0% |
| Pulls | 3 | 6 | 0 | 1 |
| Parries per game | 0.12 | 0.07 | 0.11 | 0.09 |

The differences other than parries are within chance at this sample size (likely, not isolated).

## Build 1 — Brief 001, automatic checks (17 Nov 2026)
Every pull request runs the board's checks automatically (the `checks` tick on GitHub); `main` only accepts changes through a pull request with `checks` passing. Closed F9.
