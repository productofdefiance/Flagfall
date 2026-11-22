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
*Filled in by Claude Code.*
