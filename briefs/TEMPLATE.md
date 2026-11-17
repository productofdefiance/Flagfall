# Brief NNN — <short name>

| | |
|---|---|
| Rule set | <new preset id, or "none" for tooling> |
| Date | <date> |
| Goal | <one line> |
| Branch | `build/NNN-short-name` |
| Flags | <rows this build should close, e.g. F3, F4> |

## Context
<Why this build exists, in two or three sentences. Link the Game Laws article numbers that apply.>

## Scope
<What is in. What is explicitly out.>

## What to build
1. <Exact behaviour, with numbers, not adjectives.>
2. ...

## Rules it touches
<Every existing rule this change interacts with. Each one becomes a test.>

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
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
