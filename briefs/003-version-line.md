# Brief 003 — Version line on the board

| | |
|---|---|
| Rule set | none (no rule changes) |
| Date | 17 Nov 2026 |
| Goal | The Editor can always see which build and rule set he is playing, and every saved match records the build it was played on. |
| Branch | `build/003-version-line` |
| Flags | none |

## Context
Today nothing on the board says which version of the code is running. When the Editor reports a problem, or a match is analysed later, there is no way to tie it to a build. The Process Lessons agreed a version line: the rule set plus a build number that goes up with every accepted change. This build adds it.

**Start only after Brief 002 is merged.** Before building, update this brief branch from `main` so the build starts from v3.2.

## Scope
In: a build number kept in one place, shown on three screens and stored with each match; a check that it went up. Out: any rule, bot or layout change beyond the lines below.

## What to build
1. **One source for the build number.** A new file `board/version.js` holding the build number and its date, loaded by `index.html` before `app.js`. Numbering: brief 001 was build 1, brief 002 build 2, so this build is **build 3**. The board's code must not invent or compute the number anywhere else.
2. **Home screen.** Replace the line under the title, "Playtest board", with: `Playtest board · Build 3 · Rules v3.2`. The rule set shown is the newest preset (the new-game default), named by its id. Same font, size and colour as the line it replaces.
3. **In-match menu** (the "Turn N" box). After the rule set name in its first line, add ` · Build 3`. The rule set shown there stays the match's own rule set, which can be older than the newest.
4. **Saved matches.** Every new match records the build number it was started on (for example `build: 3`). Show it in the match record on the Matches screen beside the rule set (`· Build 3`). A match saved before this build has no build number: show nothing for it, never a guess. Old matches must still load and replay.
5. **Every build raises the number.** Add a check to the `checks` workflow: on a pull request, the build number in `board/version.js` must be higher than on `main`. A pull request that changes nothing in `board/` may keep it the same. Add one line to `CLAUDE.md` under Process: every build that changes `board/` raises the build number by one in `board/version.js` and puts it in its `CHANGELOG.md` heading.
6. **CHANGELOG.md.** This build's entry is headed `Build 3`. Give the earlier entries their numbers too (Brief 001 = Build 1, Brief 002 = Build 2).

## Rules it touches
None. Storing the build number with a match must not change what the engine replays.

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes unchanged for every rule set). The engine is untouched. Matches saved before this build still open and replay.

## Checks before opening the pull request
- Every check in `README.md`.
- Open a match saved by the current board (before this build) and confirm it loads, replays and shows no build number.
- Prove the new workflow check can fail: on a throwaway branch, change something in `board/` without raising the number and confirm `checks` goes red. Say in the Report that you did this.

## The Editor's hands-on check
Open the board: Home shows `Build 3 · Rules v3.2`. Start a match, open the menu: it shows `Build 3`. Finish or abandon it, open Matches: the record shows `Build 3`.

## Report back
The standard Report, plus screenshots (phone width) of the three places the build number now appears.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
