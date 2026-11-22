# Brief 027 — Lab plumbing: fewer jobs, one run of checks per results pull request

| | |
|---|---|
| Game version | none (tooling only; no game file touched) |
| Lane | Lab (tooling) |
| Rule set | none |
| Date | 2026-11-21 |
| Goal | Cut wasted GitHub machine time: bundle the quick release checks, run a results pull request's checks once, and stop the status board starting after every finished run |
| Branch | Any branch your session may push to, started from `brief/027-lab-plumbing` |
| Flags | F024-1, F024-2, F024-3, F024-4 (all answered by the Editor, 21 Nov: yes to Code's recommendations) |
| Waits on | none |
| Order | Can start now, beside 018 and 022. Touches workflows only; if 022 merges first, sync |

## Context
Brief 024 (lab capacity) found four sources of waste on 20 Nov (`flags/024.md`). The Editor said yes to all four on 21 Nov. Since 21 Nov the repository also has a `LAB_TOKEN` secret (fine-grained key, this repo only: actions, contents, pull requests and workflows, read and write; expires about 21 Nov 2027). Every lab workflow already uses it when present (`secrets.LAB_TOKEN || github.token`), so results pull requests now open under the Editor's account and their own pull-request workflows run without the "Approve workflows to run" button. That fixes the stuck results pull requests (#42, #48, #51, #52 on 21 Nov), but it means every results pull request now starts the checks twice (once from the delivery, once from the pull request) plus play-links, the status board and night-checks. This brief removes the doubling.

## Scope
In: `.github/workflows/*.yml`, `sims/lab/deliver.sh`, `sims/lab/refresh.sh`, their tests, `CLAUDE.md` or `results/README.md` lines that describe what changes.
Out: anything in `board/`, `data/`, brains, presets, measures or results folders; the capacity numbers from brief 024 (`sims/lab/capacity.json`) unless a change here needs a matching tweak (say so).

## What to build
1. **F024-1, quick checks in one job.** In a release run, run the quick checks from `README.md` in one job, one after another, and keep only the slow ones on their own machines (`test_v32.js` 400 + 400, `test_invariants.js`, the other brains, the hashes). Target: about 16 jobs become about 5. Every check still runs and still reports pass or fail by name in `tables/checks.csv`.
2. **F024-2, one run of checks per results pull request.** When the key is present, the delivery (`deliver.sh`) and the refresh (`refresh.sh`) stop starting `checks.yml` themselves; the pull request's own run is the one that counts (it is the required `checks` for merging). When the key is absent or expired (the workflow token is in use), keep today's behaviour (start the checks from the script), so nothing gets stuck worse than today. Say how the script tells the two apart.
3. **Results-only pull requests skip what they don't need.** A pull request whose head branch is `lab/**` (results only) must not start play-links (no game change, no play build), night-checks or a lab run. It still runs `checks` (required) and the status board's normal pull-request trigger. Use a branch or path condition; say which.
4. **F024-3, the status board.** Drop its `workflow_run` trigger (on finished checks, night-checks and lab). The hourly schedule, pull request events, pushes and `workflow_dispatch` stay.
5. **F024-4, slow daytime release runs.** No change: keep brief 024's shares. Add one line where Code reads it (`CLAUDE.md`, the lab section): a build waiting on its release run may take the `lab: rush` label.

## Rules it touches
None in the game. Workflow behaviour it must not break: brief 024's capacity choice and queue log; brief 016's results index rebuilt from run folders (F35); auto-merge on results pull requests; the night-checks results pull request; the status board's Refresh and hourly run; play links on build pull requests.

## Bot minimum
n/a (no game change).

## Must not change
- Every preset, brain and replay hash (no game file is touched; say so and skip the slow checks locally, per `CLAUDE.md`).
- A build pull request's own checks, play link, lab run and status-board updates.

## Checks before opening the pull request
- The workflow tests that brief 024 added pass (capacity, status board).
- A dry run or test of each changed workflow condition, with the evidence in the Report.

## The Editor's hands-on check
None needed. Code confirms on GitHub after merge (next item).

## Report back
- Jobs per release run before and after, and machine-minutes if measurable.
- **The proof on GitHub:** the first results pull request after this merges opens under the key, runs `checks` once, starts no play build, night-checks or lab run, and merges itself with no click. Give its number. If it can't be seen before this pull request is ready, say so and name what the next design chat should check.
- Anything that still runs twice.

## Report
*Filled in by Claude Code, 22 Nov 2026. Branch: `claude/trusting-davinci-lufnu6`, started from `brief/027-lab-plumbing`.*

**Game files:** none touched (`board/`, `data/`, brains, presets, measures, results folders unchanged). No build number or game version change. Per `CLAUDE.md`, the replay hashes and slow game checks were not rerun here: nothing they cover changed. `capacity.json` unchanged (the release checks still get the same quarter of a run's share; they just need fewer slots).

**1. F024-1, release checks: 16 jobs → 5.** `quick checks` (12 checks one after another, listed in `sims/lab/release_quick.txt`), `test_v32.js (400 + 400)`, `test_invariants.js (100)`, `other brain tests (30)`, `regression hashes`. Each check still writes its own `name=outcome` line, so `tables/checks.csv` still has the same 16 names. `test_kitd.js 30` and `test_brain5.js 30` are not really quick (here: about 5 and 10 minutes when run side by side with the others), but the brief put only v32, invariants, the other brains and the hashes on their own machines, so they sit in the quick job. Dry run of the job's real script in this session: all 12 passed, 12 lines written, 14.7 minutes. Machine-minutes: about the same work, minus 11 machine start-ups (about 30 to 60 seconds each) and 11 checkouts; not measured on GitHub yet. With the daytime release share (often 1 or 2 slots) the 5 jobs still run largely one after another; the pace is set by v32 and the other brains, not the quick job.

**2. F024-2, one checks run per results pull request.** `deliver.sh` and `refresh.sh` now start `checks.yml` through `sims/lab/lab_key.sh`. **How the script tells the two apart:** it calls `gh api user`. The Editor's personal key can read it; the workflow's own token is refused (403), and an expired key gets 401. Key works → no second run (the pull request's own run, or the push's, is the one that counts). Anything else → start `checks.yml` as before. `test_deliver.js` runs the real script against a local git remote with a stand-in `gh`: with the key no dispatch, without it the dispatch on the right branch, auto-merge still on, the results commit still lands. It fails 7 checks on the old scripts.

**3. Results-only pull requests.** A **branch condition** on the job (`!startsWith(github.event.pull_request.head.ref, 'lab/')`) in `play-links` (publish), `night-checks` (full) and `lab` (plan; every other lab job needs it). Not `on:` filters: GitHub's `pull_request` branch filter only matches the target branch, and a path filter would also drop play links from build pull requests that only add a job order. The runs appear on GitHub as "skipped" and take no machine. `play-links`' queue moved from the workflow onto its job, so a skipped results run can never join the queue and cancel a build's waiting publish. `checks` and the status board still run on results pull requests.
- **One addition, in the spirit of item 3:** `play-links` on `main` now only publishes when a push changes `board/`. With the key, auto-merge merges as the Editor, so a merged results pull request now starts push workflows on `main`; without this it would republish an unchanged board every time.

**4. F024-3.** The status board's `workflow_run` trigger is gone; hourly, pull request events, pushes to `main`/`brief/**` and `workflow_dispatch` (Refresh) stay.

**5. F024-4.** No change to shares. `CLAUDE.md`, lab section: a build waiting on its release run may take the `lab: rush` label.

**Checks run here:** `test_capacity.js` 33/33, `test_board.js` all pass, `test_deliver.js` 13/13, `test_workflows.js` 23/23 (evaluates each changed `if:` from the workflow files on sample results, build, night, push and by-hand events; fails 9 checks on the old workflows). Both new tests run in `checks` (rule tests job). Skipped: the game checks and hashes (no game file touched).

**Jobs per release run:** before 16 check jobs (+ plan, play parts, merge); after 5. Per results pull request before: 2 full `checks` runs (about 6 jobs each, 25 to 40 minutes) + play-links + night-checks + lab plan + status board. After: 1 `checks` run + status board (the other three show as skipped, no machine).

**Anything that still runs twice or more than needed**
- When a results pull request merges itself (with the key), the push to `main` starts `checks` on `main`, a `lab` plan job that finds nothing to play (the moved job orders touch `studies/queue/`), the status board and the results refresh. One short run each; not doubled. Left as is: `checks` on `main` is main's health check, and changing the lab's push trigger is outside this brief.
- A lab delivery to a **build** pull request (branch mode) now pushes with the key, so it starts that pull request's own workflows (checks once, play link, status board, a lab plan that finds nothing). That replaces the old separate checks dispatch; the play link republish is new but cheap.

**The proof on GitHub:** not seen yet; it needs the first results pull request after this merges. **The next design chat should check** that pull request (branch `lab/…`, opened by the Editor's account): exactly one `checks` run (event `pull_request`, none `workflow_dispatch`), `play-links`, `night-checks` and `lab` shown as skipped, the status board run, and that it merged itself with no click. The delivery's log line says "The lab's key is in use: … (no second run started)".

**Open:** F027-1 (ASK, `flags/027.md`): an expired key breaks the delivery entirely, not just the checks switch.
