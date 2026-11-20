# Brief 024: The lab shares GitHub's machines sensibly

| | |
|---|---|
| Game version | **none** (tooling only: `board/` is untouched, and no game is played differently) |
| Lane | Lab |
| Rule set | none (tooling) |
| Date | 20 Nov 2026 |
| Goal | Stop lab runs from jamming everything else on GitHub in the daytime, without slowing the night: the lab decides at each start how many machines to take from what started it, how big the job is and how busy the repository is. Add a tap the Editor can turn on for Code to run checks in its own session when GitHub is jammed. |
| Branch | Any branch your session may push to, started from `brief/024-lab-capacity` |
| Flags | none to close |
| Waits on | none |
| Order | **Can start now**, beside any other build. Pull request title: `Docs · 024 Lab capacity`. |

## Context
On 20 Nov, with three builds open (017, 022, 023), pull request checks waited 30 to 90 minutes. One lab run for brief 022 ran 37 jobs for over an hour (`lab.yml` allows 20 at once), two more lab runs and a dozen check runs queued behind it, and the status board and site publish waited too. No GitHub incident was reported that day. Likely the lab crowding out the rest; not isolated (only 11 jobs were running at the moment it was checked).

The Editor's ruling (20 Nov): this is a capacity-planning problem, not one hard rule. At night the lab may use everything, since he isn't building then. In the daytime it should be smart about which job needs how many machines and leave room when the repository is busy (about half, as a starting point). This is a first step; numbers will be reworked once there is real data. And when GitHub is jammed, Code may run checks in its own session instead, but only after asking him, so he can look at his usage first.

## Scope
In: how many jobs a lab run plays at once; cancelling a pull request's superseded lab run; reserving room for quick checks; a queue log; a QUEUE line on the status board; the "run it here" rule in `CLAUDE.md`.
Out: what the lab plays, its seeds, measures, results format and delivery. Anything in `board/`. Paid runners or services.

## What to build

### 1. Measure first
Before choosing numbers, find and write in the Report: how many jobs this account can really run at once on GitHub's free plan for a public repository (GitHub's documentation, and what the 20 Nov runs show: run 44792506859 and its neighbours), and what else holds jobs back (queue order between workflows, `concurrency` groups, Pages builds). If the real ceiling isn't 20, base every share below on the real one. Call that ceiling **N**.

### 2. The lab picks its share at the start
The `plan` job already runs first. It now also outputs `max_parallel`, used by the `play` job (and the release checks) in place of the fixed 20. It decides from three things:

| It looks at | How |
|---|---|
| What started the run | the event: the nightly chain (`workflow_run` after night-checks), a push or pull request, or a manual start |
| How big the job is | total games in the orders it is about to play |
| How busy the repository is | through GitHub's API at that moment: check runs queued or in progress, other lab runs, and pull requests pushed in the last 30 minutes |

Starting policy (every number is a named setting in one small file, `sims/lab/capacity.json`, so it can be tuned without touching the workflow):

| Situation | Share of N |
|---|---|
| Night: started by the nightly chain, or any run starting between 11:00 pm and 7:00 am US Eastern | all of N |
| Day, quiet (nothing else queued or running, no other pull request pushed in 30 minutes) | N minus a reserve of 5 for checks |
| Day, busy | half of N |
| Day, busy, and a big run (1,000 or more games per side in any order) | a quarter of N, in waves (section 3) |
| A manual start with the new input `rush: true`, or a pull request labelled `lab: rush` | all of N, any time |

Never fewer than 2. The plan job prints, in the run summary, one plain line saying what it chose and why ("Day, busy (6 checks waiting): 10 of 20 machines").

### 3. Waves for big daytime runs
A share chosen at the start can't shrink while a run is going. So a big daytime run plays in waves: a wave is at most 10 parts; when a wave finishes, the next wave's share is chosen afresh by the same rules (so a run that started on a quiet afternoon gives way if builds arrive, and speeds up if night falls). Night runs and small runs play in one go as today. However it is split, **the games and the results must be identical**: same seeds, same records, same result folder as a single-pass run of the same orders.

### 4. A new push replaces the old lab run
When a pull request gets a new push, its lab run that is still queued or playing for the older commit is cancelled, and the new one plays. Today `lab-<pull request>` waits its turn with `cancel-in-progress: false`, so stale runs pile up. Runs on `main` (the nightly chain, releases after a merge) are never cancelled this way.

### 5. Quick checks don't wait behind the lab
With sections 2 to 4 the lab leaves room, but say in the Report whether GitHub can also be told to start `checks` first when both are waiting (it has no job priority setting as far as the design chat knows; if that is right, the reserve in section 2 is the tool, and say so).

### 6. A queue log, and a QUEUE line on the board
- Each lab run appends one line to `results/queue-log.csv` in its results delivery (date, time ET, event, games, share chosen and why, how long its first job waited, how long the run took, checks waiting when it started). This is the data for tuning the policy. If delivering it through the results pull request is awkward, put it on the `status` branch instead and say so.
- `BOARD.md` and the status page get one line under RESULTS (in the page: a fifth small row under the tiles, not a new section): `Queue: 12 jobs waiting, oldest 43 min · lab using 9 of 20`, or `Queue: clear`. On the page it carries the Running mark when jobs are waiting over 15 minutes, Heads up over 45. `BOARD.md` stays under 4 KB.

### 7. The tap: Code runs it here when GitHub is jammed (`CLAUDE.md`)
Add to "The lab and results":
- When GitHub's queue is jammed (your checks or a screen have waited more than about 20 minutes, or the board's Queue line says so), you may **offer** to run them in your own session instead. Ask first, every time, in one line: what you would run, roughly how long, and that it uses the Editor's session ("GitHub's queue is 40 minutes deep. Run the rule tests and the 200-game screen here instead? About 8 minutes of this session. Yes or no."). Run nothing until he says yes. The answer covers that one run, not the rest of the chat.
- What may run here: the pass/fail checks in `README.md`, and `screen` runs (up to about 200 games per side), played with the lab's own scripts and seeds so the games are the same ones GitHub would play. Anything bigger always goes to the lab.
- Say in the Report which numbers came from a session run. GitHub's own checks must still pass before a merge: a session run tells you and the Editor early, it doesn't replace them. Don't cancel the queued GitHub run.

## Rules it touches
None.

## Bot minimum
n/a

## Must not change
Every game the lab plays, its seeds, records, measures and result folders: a run of the same orders gives byte-identical results at any share and in any number of waves. `sims/lab/board_check.js` passes. The results delivery and `results-refresh`. The nightly chain's timing. Everything in `board/`.

## Checks before opening the pull request
- Every check in `README.md` passes; the lab's `self_test.js` passes.
- A test of the share rules on fixtures with no network (`sims/lab/test_capacity.js`, run in `checks`): each row of the table in section 2 gives its share; never under 2; the reserve is kept; `rush` wins; the night window is judged in US Eastern across a daylight-saving change.
- A test that one set of orders played in one pass and in three waves at different shares gives identical result files.
- One real run on the pull request: paste the plan job's line and the queue log line it wrote.

## The Editor's hands-on check
Nothing to play. On a busy afternoon, look at the status page's Queue line and at how long a pull request's checks take to start.

## Report back
The standard items, plus: the real ceiling N and where it comes from; what was actually jamming on 20 Nov, as far as it can be told; the shares chosen for each real run you saw; whether checks can be given priority; anything in the policy you think is wrong for this repository.

---

## Report
*Filled in by Claude Code.*

- **What's in:** every section. Each lab run chooses its share of machines at the start (`sims/lab/capacity.js`, every number in `sims/lab/capacity.json`) and prints one plain line in the run summary. Big daytime runs play in two waves, the second choosing its share afresh. A new push to a pull request cancels that pull request's older lab run; runs on `main` never are. Release checks take a slice of the run's share instead of 16 machines at once. Each run writes a queue log line. The status board and page get a Queue line. `CLAUDE.md` has the "offer to run it here" rule. Branch: `claude/cool-feynman-xh58m7` (the only branch this session may push to), restarted from `main` after brief 023 merged, with `brief/024-lab-capacity` merged in.
- **The real ceiling N = 20:** GitHub's free plan runs up to 20 jobs at once per account on its standard Linux machines (GitHub's Actions usage limits). On 20 Nov one lab run alone held 18 at once (run 44792506859: its 20 play parts and 16 release checks were all queued at 18:25 UTC; at most 18 of its own jobs ran together), so the account was at the ceiling. Nothing else (no larger runners, no self-hosted ones) is set up. Other things that hold jobs back: `concurrency` groups (the lab's per pull request; play-links; the status board, which also cancels waiting runs), and the Pages build after every gh-pages push (one job each).
- **What was jamming on 20 Nov** (likely, not isolated; from the run and job times): (1) lab run 44792506859 took 18 machines for 45 to 100 minutes; its 10-second release checks waited up to 66 minutes behind its own 50-minute play parts (F024-1). (2) Each results pull request ran the full `checks` twice (F024-2). (3) The status board started about 40 times between 6:15 and 8:00 pm ET (F024-3). (4) Four build pull requests pushing at once, each a `checks` run of about 6 jobs for 15 to 40 minutes. Brief 023's own checks, queued at 19:05 UTC, started at 19:37.
- **How the share is chosen:** night (the nightly chain, or 11 pm to 7 am US Eastern, daylight saving handled) or `rush` (the new manual input or a `lab: rush` label): all 20. Daytime and quiet: 15 (a reserve of 5). Daytime and busy: 10. Busy with a big run (a matchup of 1,000+ games): 5, in two waves. Never under 2. Busy means any check job queued or running outside the lab, another lab run, or another open pull request updated in the last 30 minutes (status board and Pages jobs are left out: they run all the time). If the queue can't be read, the daytime counts as busy. A release run gives a quarter of its share to its release checks.
- **Waves change nothing:** a wave is a group of the same parts (`--part i --parts P`), so every game, seed and record is the one a single pass plays. Tested (`test_capacity.js`): one set of orders in one pass and in three waves (parts in a different order) gives identical result files, except wall-clock time: `run.json`'s `finished` and the timing measure's milliseconds (`bot_ms`, `bot_ms_max_turn`). Those differ between any two runs, even two single-pass runs, so "byte-identical" can't hold for them; every other byte matches.
- **Can checks be given priority?** No. GitHub Actions has no job priority: waiting jobs start in queue order as machines free up. The reserve of 5 (when quiet) and the half share (when busy) are the tools, as the brief expected.
- **Queue log:** on the `status` branch (`queue/queue-log.csv`), not in the results pull request: build pull requests carry their own results, so two branches appending to one file in `results/` would conflict at every merge. Columns: date, time ET, run, event, games, share, why, first play job's wait (min), run time (min), checks waiting at the start.
- **Anything beyond the brief, and why:** release checks now share the run's slice (the brief's "and the release checks"); the four ASKs in `flags/024.md`, about what jammed GitHub that this build can't change without touching what the brief said to leave alone.
- **Checks run and results:** `test_capacity.js` 33/33 (each row of the table, the floor of 2, the reserve, rush, night across the 1 Nov daylight-saving change, waves, the Queue line, the queue log line, one pass against three waves); `self_test.js` 34/34; `test_stall.js` 39/39; `test_lead.js` 6/6; `test_board.js` all pass (with the Queue line: under RESULTS, under the tiles with Running over 15 minutes and Heads up over 45, clear, unknown, under 4 KB); `board_check.js 10`: 10 games, 0 different. **Skipped:** the engine checks and `regress_engine.js`: nothing in `board/` changed, so there are no hashes to compare. All of these ran in this session; GitHub's checks run on the pull request.
- **One real run on the pull request** (lab run 44812053848, 20 games, 3:30 pm ET): the plan job's line: "Day, busy (11 other jobs running, 1 other lab run, 1 pull request pushed in 30 min): 10 of 20 machines". The queue log line it wrote on the `status` branch: `2026-11-20,15:30,44812053848,pull_request,20,10,"Day, busy (11 other jobs running, 1 other lab run, 1 pull request pushed in 30 min): 10 of 20 machines",0.4,2.1,0` (its first play job waited 0.4 minutes; the run took 2.1). Its results were delivered to this pull request as usual (`results/v3.12.00/2026-11-20_experiment_lab-capacity-check`). Shares seen on real runs: that one only; the "other lab run" was this pull request's run for the push before, which had nothing to play.
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a
- **Settings review (brain builds only):** n/a
- **What I think is wrong with the policy for this repository:** the biggest jams on 20 Nov came from jobs the share doesn't govern: 16 release-check machines for under 2 minutes of quick checks (F024-1), doubled checks on results pull requests (F024-2) and the status board's start storm (F024-3). Fixing those three is likely worth more than the share rules. Also, "a pull request pushed in the last 30 minutes" uses the pull request's update time, which labels and comments also move, so it errs towards busy. And a daytime release now takes 3 to 4 hours when busy (F024-4).
- **Known gaps:** the share can't change during a wave (GitHub fixes it when the wave starts). Only two waves: parts never exceed 20 and a wave is at most 10 parts, so two always suffice.
- **Flags closed / opened:** none closed. Opened F024-1 to F024-4 (all ASK).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/45 (branch `claude/cool-feynman-xh58m7`)
