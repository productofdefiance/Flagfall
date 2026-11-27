# Brief NNN — <short name>

| | |
|---|---|
| Game version | <size of the bump only (X, YY, ZZ or none); the number is counted at merge. X: big system, YY: real change, ZZ: tuning or fix> |
| Lane | <Bot, Lab, Units, Rules or UI> |
| Rule set | <new preset id, or "none" for tooling> |
| Date | <date> |
| Goal | <one line> |
| Branch | Any branch your session may push to, started from `brief/NNN-short-name` |
| Flags | <rows this build should close, e.g. F3, F4> |
| Waits on | <exactly "none", or three-digit brief numbers separated by commas: 011, 014. The waits-on check reads this row> |
| Order | <can start now / alongside NNN / after NNN merges> |

## Context
<Why this build exists, in two or three sentences. Link the Game Laws article numbers that apply.>

## Scope
<What is in. What is explicitly out.>

## What to build
1. <Exact behaviour, with numbers, not adjectives.>
2. ...

## Rules it touches
<Every existing rule this change interacts with. Each one becomes a test.>

## Bot minimum
<For any new unit, action or rule: what the computer opponent must do with it, and how the Report proves it (for example: in 100 seeded bot games the bot uses the new action at least N times and never loses a unit to an obvious misuse). Write "n/a" only when the build changes nothing the bot can do.>

## Must not change
<At minimum: every existing preset plays and replays identically.>

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for untouched rule sets match the previous board.
- <Extra checks for this build.>

## The Editor's hands-on check
<What the Editor plays or looks at before merging. Keep it as short as the change deserves.>

## Report back
<What the Report must contain beyond the standard items.>

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
