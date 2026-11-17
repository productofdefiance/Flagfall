# Brief 001 — Automatic checks on every pull request

| | |
|---|---|
| Rule set | none (tooling only) |
| Date | 17 Nov 2026 |
| Goal | Every pull request runs the board's checks automatically, so nothing reaches `main` without them passing. |
| Branch | `build/001-automatic-checks` |
| Flags | F9 |

## Context
The repository is new. Today the checks only run when someone remembers to run them. This build makes GitHub run them on every pull request, for free (the repository is public).

## Scope
In: one GitHub Actions workflow file. Out: any change to `board/`, `redteam/` or `data/`.

## What to build
1. A workflow at `.github/workflows/checks.yml`, named `checks`, that runs on every pull request to `main` and on every push to `main`.
2. It uses Node.js 20 and runs, from `board/`, each of: `test_rules.js`, `test_v1.js`, `test_v3.js`, `test_v31.js`, `test_rng.js`, and `test_replay.js ../data/match3_log.txt`. Any failure fails the workflow.
3. It runs `node redteam/invariants.js 30` from the repository root and fails if that script reports an impossible state or a bot error. If the script doesn't set a failing exit code on those, add a small wrapper in `.github/` that reads its output. Don't edit the script itself.
4. It runs the replay regression: check out the pull request's base commit into a second folder and run `node board/tests/regress_engine.js <that folder>/board 3` and `node board/tests/regress_engine.js board 3`. Print both outputs. This step only reports the hashes (a rule change is meant to change one rule set's hash); it doesn't fail the workflow.
5. A job summary that lists each check with pass or fail.

## Rules it touches
None.

## Must not change
Every file outside `.github/`.

## Checks before opening the pull request
- The workflow runs green on the pull request itself.
- Prove it can fail: on a throwaway branch, break one assertion in `test_v31.js`, push, confirm the workflow goes red, then delete that branch. Say in the Report that you did this.

## The Editor's hands-on check
Open the pull request and see the green tick next to `checks`.

## Report back
The standard Report. Also give the Editor the exact clicks to protect `main`: Settings → Branches → add a rule for `main` that requires a pull request and requires the `checks` status to pass.

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
