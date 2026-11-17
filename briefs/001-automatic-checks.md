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

- **What's in:** `.github/workflows/checks.yml`, named `checks`. It runs on every pull request to `main` and every push to `main`, on Node.js 20. It runs the six README checks, then `redteam/invariants.js 30` through a wrapper, then the replay regression hashes for the base commit and this commit (report only). A pass/fail table appears on the run's Summary page. Any failed check fails the workflow. A full run takes about 4 minutes. The wrapper is `.github/invariants-check.js`: `redteam/invariants.js` always exits 0, so the wrapper reads its output. It fails on any bot error, any bot action the engine refused, any impossible state, or a refused action that changed the match. The script itself is unchanged. I tested the wrapper locally on the real script (pass) and on fake failing output (fail, naming each problem).
- **Anything beyond the brief, and why:** (1) The wrapper also fails on refused bot actions and on the script's state-restore line, because both are impossible states the script already reports. (2) Every check runs even if an earlier one fails, so the Summary shows every result, not just the first failure. (3) On a push to `main` there is no pull request base, so the hashes compare against the previous commit on `main`. With no previous commit, only this commit's hashes are printed.
- **Checks run and results (paste regression hashes):** Workflow green on this pull request (run 44146353986): all six README checks and the invariants passed. Proved it can fail: on the throwaway branch `throwaway/001-prove-red` I broke the assertion "v3.1 is the last preset" in `test_v31.js` and opened a draft pull request. The workflow went red (run 44146360972), with `test_v31.js` the only failure. I then closed that pull request. Regression hashes from the green run, base commit `6b41d4c` vs this branch, identical (no board files changed):
  ```
  match3       37397ef2bd3ed86b
  v1           7b25bca651c0cb31
  v2           ddbe5fc437ff4e9d
  v3           26371927b53d4413
  ```
  v3.1 is not hashed: `regress_engine.js` leaves it out (F18).
- **Baseline table (rule changes only):** n/a
- **Known gaps:** (1) The invariants run plays rule set v3 only, so nothing automatically checks v3.1 games for impossible states (F17). (2) `regress_engine.js` leaves v3.1 out (F18). (3) The checks can still be skipped until the Editor protects `main` (steps below). (4) The throwaway branch could not be deleted from this session, because the session's connection to GitHub refuses branch deletions. The Editor deletes it with the "Delete branch" button on its closed pull request.
- **Protecting `main` (the Editor's clicks):** On GitHub open the repository → **Settings** → **Branches** → **Add classic branch protection rule** (the page may call it **Add branch ruleset**; either works). Branch name pattern: `main`. Tick **Require a pull request before merging**. Tick **Require status checks to pass before merging**, then type `checks` in the search box and pick it. Leave the rest as it is and click **Create** (or **Save changes**). The `checks` name only appears in the search after the workflow has run at least once, which it now has.
- **Flags closed / opened:** F9 FIXED. Opened F17 (ASK) and F18 (ASK).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/1
