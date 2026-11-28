# Brief 031 — Version at merge: merge in any order, no renumbering, release runs only when the game changed

| | |
|---|---|
| Game version | ZZ (the board's version line changes on previews; no rule, brain or screen change). **031 writes no number** (amendment 13, M8): the baseline is `main` at 031's last sync and 031 is the first build counted the new way |
| Lane | Lab (tooling) |
| Rule set | none |
| Date | 2026-11-27 |
| Goal | A pull request carries no version number. The number is worked out from merge order when `main` is published, so builds merge in any order without a resync. A build that waits on an unmerged brief can't be built or merged. The 2,000-game release run happens only when the game itself changed |
| Branch | Any branch your session may push to, started from `brief/031-version-at-merge` |
| Flags | F029-2 (raised by Code at the Editor's request; this brief is the Editor's answer, 27 Nov). F031-1 answered (amendment 14). Red team design review: `briefs/redteam/031-design.md` |
| Waits on | 029 |
| Order | After 029 merges (the Editor, 27 Nov: he holds every other brief until this one is pushed; it follows 029's pull request). If 028 is still open when this merges, 028 converts at its next sync (section 8) |

## Context
Today every build writes its game version and build number into `board/version.js`, its entry at the top of `CHANGELOG.md`, and the expected number into `board/tests/test_version.js`. All three are single shared spots, so two open builds always conflict: whichever merges second needs a Code chat sync, a renumber, a full re-run of the checks and, because its version changed, a second 2,000-game release run. This happened on almost every recent merge (022 and 018, 026 and 028, 028 and 029). A design chat checked it on 27 Nov: merging 028 (v3.19.00) and then 029 (v3.20.00, the reserved next number) into a copy of `main` still conflicts in all three files, so reserving numbers alone does not fix it (F029-2's first recommendation). The Editor's goal: merge builds in the order they are ready, with no resync or change to the others once one goes through, plus safeguards that block only what is actually wrong.

The Editor approved this design on 27 Nov (chat FF Docs v3.18.00): no number in a pull request, the number counted from merge order at publish (never committed back to `main` by a bot), "Waits on" enforced, and the release run scaled by which files changed.

## Scope
In: `board/version.js`, a new stamping script, a new `releases/` and `changelog/` folder, `CHANGELOG.md`, `.github/check-build-number.sh` (replaced), `.github/workflows/*.yml`, `sims/lab/plan.js`, `release_quick.txt` (replaced), `merge.js`, `play.js`, `nightly.js`, `record.js` where they read the version, `sims/status/board.js` and `page.js`, their tests, `board/tests/test_version.js`, `README.md` and `results/README.md` where they describe versions, and `CLAUDE.md` (section 9).
Out: anything that changes how a game plays: `engine.js`, `bot.js`, `brain.js`, `data.js`, `fields.js`, presets, measures, `watch.js`'s play. The quick checks themselves stay as they are on every pull request that touches the game (the Editor agreed: they are cheap and they catch a "UI" build that reaches into game code).

## What to build

### 1. The number lives in no shared file
- `board/version.js` in the repository keeps its shape but holds `game: null, build: null` with a comment: **stamped when published; never edit by hand.** An unstamped board shows `dev` where the version goes, so a missed stamp is visible rather than wrong.
- New script `tools/stamp-version.js` (plain Node, no packages) writes the real `game`, `build` and `date` into the working copy's `board/version.js`. It never commits. Every workflow that publishes, plays games, files results or builds the board runs it straight after checkout. `README.md` tells a Code session to run it before the checks.
- **One counting script, used by everything.** Publishing, the lab, night checks, the status board and the tests all get the number from this script (or its module export). Nothing else works out a version.

### 2. What each build adds instead
Every brief's pull request adds two files of its own, so no two builds touch the same file:
- `releases/NNN.json`: `{ "brief": "NNN", "bump": "X" | "YY" | "ZZ" | "none", "rules": "<new preset id or null>", "brain": "<new default brain or null>", "ui": "<Approved UI version or null>" }`. A brief with bump `none` (tooling) still adds one: it also marks the brief as merged.
- `changelog/NNN.md`: the entry `CHANGELOG.md` used to get, with no number in its heading (`## Brief 029 · Rematch`).
- `CHANGELOG.md` stops being edited by builds. Keep it as the record up to this brief, with a line at the top: newer entries are in `changelog/`, numbered at publish. The published site gets the assembled changelog (numbered headings, newest first) and the version table (one row per version: rule set, default brain, UI version, build), both generated from `releases/` and `changelog/`. Old entries stay exactly as they are.
- Files in `releases/` are append-only: the checks fail a pull request that edits or deletes one, so a version once given is never taken back. A revert is its own brief or fix with its own bump.

### 3. How the number is counted
- **Baseline.** `releases/BASE.json` records `main`'s version, build and commit at this build's last sync (expected v3.20.00 · Build 25 if 028 and 029 have both merged; use whatever `main` really reads then).
- **Counting.** Walk `main`'s first-parent history after the baseline commit, oldest first. Each commit that adds a `releases/NNN.json` applies its bump: X gives the next X.00.00, YY the next YY with ZZ at 00, ZZ the next ZZ, `none` no change. Each commit that changes `board/` adds 1 to the build. Merge commits and squash merges both count the same way.
- **This brief counts itself.** Its own `releases/031.json` says ZZ. Straight after it merges, the live site, the board and the stamp script must all read baseline + one ZZ, Build + 1 (expected v3.20.01 · Build 26). That is the end-to-end proof.
- **Speed.** Stamping must add no more than about 30 seconds to a workflow. Use a blobless or tree-only fetch of the history it needs, not a full clone.
- **On a pull request** (play link, lab runs, tests), the stamp writes the label `<main's version>+NNN` (for example `v3.20.01+029`) and build `null`. Matches saved on a preview, its lab rows and its results folder carry that label. It is honest and never changes, so nothing needs refiling.

### 4. The checks (replace `check-build-number.sh`)
A pull request fails if:
- it changes `board/` without adding `releases/NNN.json`, or adds one with bump `none` (a board change is at least ZZ);
- it adds more than one `releases/` file, or edits or deletes an existing one;
- its `releases/NNN.json` doesn't match the brief number on its branch, or the bump differs from the brief header's `Game version` size (X, YY, ZZ or none);
- `board/version.js` has a number in it (it must stay `null`).
Results-only (`lab/**`) and docs-only pull requests are exempt, as today.

### 5. "Waits on" as a required check
- A new check, **`waits-on`**, reads the `Waits on` row of the pull request's brief (`briefs/NNN-*.md`; `sims/status/board.js` already parses it). It fails, naming the brief, while any brief listed has no `releases/NNN.json` on `main` (`Waits on 028: not merged yet`). A missing row fails too (`Waits on not stated in the brief`). Docs and results pull requests pass.
- It must **turn green by itself** within a few minutes of the last brief it waits on merging, with no push to the waiting pull request: a workflow on every push to `main` re-runs `waits-on` for every open pull request.
- It is a separate check because only the Editor can add a required check (Settings → Rules → main). Report the exact clicks for him; a design chat walks him through it once.
- **Build-time guard (CLAUDE.md, section 9).** "Build brief NNN" first reads the brief's `Waits on` row against `main`. If anything listed is unmerged, Code stops and says so in one line, and builds only if the Editor answers "build anyway".
- Rule-change briefs still go one at a time: design chats list the open rules brief in each other's `Waits on`. No extra machinery.

### 6. The release run, scaled by what changed
- **Game files**: `board/engine.js`, `bot.js`, `brain.js`, `data.js`, `fields.js`, `watch.js` (the lab plays every game through `watch.js`). **Screen files**: `app.js`, `ui.js`, `skin.js`, `index.html`.
- `lab.yml`'s release run (2,000 games, Brain default mirror at 5v5 and 7v7) now starts when a pull request changes a game file, or when its replay hashes (`regress_engine.js`) differ from its base, not when the version changes. After the merge it runs on `main` as today and is filed under the version the build actually got.
- A build that changed only screen files gets no release run, in the pull request or after the merge. Its replay hashes must equal its base's exactly (this check becomes must-pass for screen-only builds). The results index gets one line for its version: `same games as <last version with a release run>`, so every version still points to its numbers.
- A docs-only pull request (only `briefs/`, `flags/` or `.md` files outside `board/` and `sims/`) skips the game jobs. The `checks` job still runs and reports, so the required check is never skipped (a skipped required check counts as passed).
- Night checks are unchanged apart from reading the stamped version.

- **The release run checks every test (the Editor, 27 Nov).** Today its quick checks come from a hand-kept list, `sims/lab/release_quick.txt`, last updated before rule set v3.5. Checked on `main` at v3.19.00: of the 32 `board/tests/test_*.js` files it never runs 13 (`test_events`, `test_fields`, `test_hotseat`, `test_phone`, `test_route`, `test_spengine`, `test_spflow`, `test_stamina`, `test_ui`, `test_v35`, `test_v36`, `test_v37`, `test_v310`; `test_version` is replaced by this brief). Nothing shipped untested (every pull request's own `checks` run them), but a release summary that says "all checks passed" overstates. Build the release run's list from `board/tests/test_*.js` itself, with only the counts kept by hand (a small table of file → count, default none), so a new test file is in the release run the day it is added. Add a check that fails if a `test_*.js` file is in neither the release run nor a short, commented skip list. The regression hashes must cover every preset, the newest included. Brief 012 (Cavalry, v4.00.00) is the first big build to rely on it.

### 7. The status board and page
- **On main**: the stamped number. **Building**: `029 → YY · would be v3.21.00 if merged next` (worked out by the same script).
- No "Needs sync" for versions any more: it shows only for a real conflict or a branch behind `main` that GitHub can't merge.
- A pull request failing `waits-on` shows `waits on 028` in its row.
- Merged builds show the number they got.

### 8. Changeover
- 031 writes no number (amendment 13). It sets `releases/BASE.json` from `main` at its last sync and is the first build counted.
- Any old-way pull request still open when this merges converts at its next sync: it drops its number from `version.js` (back to `null`), moves its `CHANGELOG.md` entry into `changelog/NNN.md`, adds `releases/NNN.json`, and fixes `test_version.js` if it touched it. Say this in CLAUDE.md under sync.
- `board/tests/test_version.js` reads the number from the stamp, never a typed-in one. It checks the counting on a fixture history: in order, out of order, `none`, X resetting YY and ZZ, two merges in a row, and that the label for a pull request reads `<main>+NNN`.

### 9. CLAUDE.md
Rewrite, in plain language and as short as now:
- **Build brief NNN**: first check `Waits on` against `main`; stop if anything listed is unmerged unless the Editor says "build anyway".
- **sync**: bring in `main`. No version step. Convert an old-way branch (section 8).
- **Pull request titles**: `NNN Lane · short name (YY)` while Draft and when Ready. The number appears on the board and the live site after the merge.
- **Game version**, **Raise the build number**, **Keep CHANGELOG.md current**, **Version at merge**: replace with the new rule: add `releases/NNN.json` and `changelog/NNN.md`; never write a number; the stamp counts it from merge order.
- `briefs/TEMPLATE.md`: the `Game version` row reads "size of the bump only (X, YY, ZZ or none); the number is counted at merge". The `Waits on` row's format is exact: "none", or three-digit brief numbers separated by commas.

## Amendments (the Editor, 28 Nov, after the red team design review)
The red team report is `briefs/redteam/031-design.md` (finding codes below are its own; A1 to A10 are its second look at these amendments, 28 Nov, accepted by the Editor and folded in). **Where an amendment and the sections above differ, the amendment wins.** Accepted for this brief: B1, B2, H1 to H5, M1 to M9 (M5 as ruled below), L7, and F031-1. Moved to brief 032 (a follow-up on `brief/032-version-follow-ups`, must merge before 012): M10, L2, L3, L4, L6. L1 is the Editor's GitHub setting (the Report gives the clicks). L5 is left out.

1. **B1, old briefs count as merged.** `releases/BASE.json` lists every brief with a merged pull request from the old way (from `main`'s history; checked 28 Nov: 001 to 029 except 012). **012 (Cavalry) is not merged and must not be listed**; neither are 030 and 032. `waits-on`, the build-time guard and the status board all treat those as merged. L7: a check before merge that the baseline commit is on `main` and its `version.js` reads what `BASE.json` says.
2. **B2, a game change never ships without a finished release run.** Decide whether a pull request needs a release run from the whole pull request against its merge-base, on every run, not from the last push. Key each release run by a hash of the game content: the six game files, `board/tests/rng.js`, and the lab's play scripts (`sims/lab/play.js`, `order.js`, `plan.js`). Skip only when a finished run with that key exists. On `main`, each lab run first lists every version since the last filed release run that has neither a run nor a `same games as` line, and plays the missing ones (the `lab-main` group keeps only one waiting run, so merges close together must not drop one).
3. **H1, no shared lists** (A6 folded in). `checks.yml` runs the tests from the generated list (item 9), with no step and no `R:` entry per test. Counts, arguments and "needs a browser" are read from each test file's first lines, not from a shared table. `results/INDEX.md` and `results/index.csv` are not committed on a build's branch: `main`'s index is rebuilt by the next results pull request (`index.js --rebuild`), never by a direct push to `main`, and the checks fail a build pull request that changes either file. CLAUDE.md says plainly that real code overlaps (for example two builds editing `app.js`) still need a sync. In the two-order merge check, one pretend brief adds a test file and the other carries a lab result.
4. **H2, honest preview labels.** The `+NNN` label counts to the merge-base of the branch and `main` (the last `main` commit the branch really contains), so it never names a version the build lacks and never moves.
5. **H3, one stamp per version played** (A5). Stamp in the lab's `plan` job at the planned commit and pass the version to every later job; when a run on `main` plays several missed versions (item 2), each is played and stamped at its own commit (the `merge` job must not re-read `main`'s tip). The publish of `main` skips itself when its commit is no longer `main`'s tip.
6. **H4, the default brain.** Move the default brain out of `board/app.js` into `board/brain.js` (one exported name; the app and the lab both read it). `sims/lab/plan.js` fails loudly if it can't find it (no silent fallback to `brain5`). A release run is required whenever `releases/NNN.json` has a `brain` or `rules` value. Replay hashes unchanged.
7. **H5, no unstamped results.** The stamp fetches the history it needs and stops with an error when it can't reach the baseline. `merge.js`, `play.js` and `nightly.js` refuse to run on an unstamped board (no `build-<n>` or `build-null` fallback).
8. **M1 to M4, waits-on done right** (A3, A8 from the red team's second look, 28 Nov, folded in). M1: a pull request's identity is the `releases/NNN.json` it adds; its title must agree or the checks fail. M2: every pull request that is not docs-only or results-only adds a releases file (tooling builds use bump `none`). A pull request that changes only `results/`, `studies/`, `briefs/`, `flags/` or `.md` files needs none, whatever its branch name (job-order pull requests like #46 and #49). M3: the `Waits on` row is exactly `none` or three-digit numbers separated by commas, else fail; a number with no brief fails as "no such brief"; a loop is named. Which copy of the brief is read: the pull request's own copy when a pull request is open for it, else the `brief/NNN-*` branch; `waits-on`, the build-time guard and the status board all use this same rule. M4: one script posts `waits-on` as a commit status on pull request events, on every push to `main` and hourly, reading `main` live, for every open pull request including `lab/*` and docs. The Editor ticks the required box only once every open pull request shows it (say so with the Report's clicks).
9. **M9 (with section 6's last part), one generated test list.** One list, generated from `board/tests/`, `sims/lab/` and `sims/status/` (plus `.github/invariants-check.js` and `regress_engine.js`), used by `checks`, the release run and night checks alike. Each test declares three counts (quick, release, night), its arguments and whether it needs a browser in its first lines (A7); the runner fails if it ran fewer tests than the list holds; the release run gets a browser for those that do. `night-checks.yml`'s hand list of brain tests goes (a new brain's test is picked up the day it is added). A check fails if any test file is in neither the list nor a short, commented skip list. `test_rematch.js` (merged with 029) is in it.
10. **M5, ruled by the Editor: no.** `waits-on` passes only once the branch contains every brief it waits on (one sync); a brief listed in `BASE.json` counts as contained once the branch contains `BASE.json` itself (A2), with the reason shown (`028 merged: sync once to test on it`). This replaces section 5's "turn green by itself". It costs a sync only for builds started with "build anyway".
11. **M6, main broken alarm.** A failing `checks` run on `main` opens an issue (as night checks do) and the status board shows `main broken since <brief>` until it passes.
12. **M7.** `play-links.yml` also republishes `main` when `releases/` or `changelog/` changes.
13. **M8.** 031 writes no number (header and section 8 above, corrected).
14. **F031-1, follow-up fixes to a merged brief: yes.** A fix to an already-merged brief adds `releases/NNN-2.json` (then `-3`, …) with its own bump (normally ZZ) and `changelog/NNN-2.md`; its title reads `NNN-2 …`. The counter counts each file once. An `NNN-2` file's bump is not compared with the brief header, and the status board's title reader accepts `NNN-2` (A4). Any other F031 flags: raise them in the Report as usual.
15. **A9, CLAUDE.md "Build brief NNN":** bring in `main` first, then check `Waits on`.
16. **A10, old branches:** a branch whose merge-base is older than the baseline keeps its own typed number as its label until it converts at its next sync (no stamp error).

Checks before Ready, added: the two-order merge with a test file and a lab result (item 3); a game-file push followed by a test-only push still ends with a finished release run (item 2); three merges in a row on a scratch history all get their run or `same games as` line; `waits-on` failing for a malformed row, a missing brief and a loop; an `NNN-2` case in the counting test (A4); one deliberately failing test turning the run red (A7).

## Rules it touches
None of the Game Laws. It touches standing process rules: version sizes (X, YY, ZZ), one version for everything, old records replay exactly (a saved match's version is a label; replays go by rule set), every set-up difference recorded (unchanged: the version is not a set-up difference), rule changes one at a time, the release run as a version's final exam (brief 008), brief 024's capacity rules (a release run still takes its share of machines), brief 027's results pull requests (unchanged: one run of checks, no lab, no play links).

## Bot minimum
n/a (no change to what the bot can do).

## Must not change
- Every preset plays and replays identically: `regress_engine.js` hashes unchanged for every rule set.
- Every saved match and lab record from before this brief opens and replays as today, and shows the version it recorded.
- Every existing `results/` folder stays where it is; new ones are added by the same structure.
- The quick checks on any pull request that changes `board/` or `sims/` run exactly as today.
- Brief 027's results pull request path and brief 024's machine shares.

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes match.
- The counting test (section 8) passes.
- **Two simulated merges in both orders.** In a scratch copy of the repository, make two pretend briefs (one YY screen-only, one ZZ game-file change) from the same `main`, merge them A then B and B then A. Both orders merge with **no conflict**, number themselves in merge order, and the release run is planned only for the game-file one. Paste the outputs.
- `waits-on`: a pretend brief waiting on an unmerged one fails with its reason, and turns green after the other merges, with no push to it (shown on GitHub if possible; otherwise say so).
- The stamp on the current `main` reproduces the baseline exactly.
- The status board test (`sims/status/test_board.js`) covers the new Building line and the `waits on` row.

## The Editor's hands-on check
1. After merge: the live site's Home and the board both read the new number (expected v3.20.01 · Build 26).
2. Settings → Rules → main: tick `waits-on` as a required check (the Report gives the exact clicks).
3. Open the next build's play link: Home reads `v3.20.01+NNN`.

## Report back
The standard items, plus: the two-order merge outputs; the clicks for the required check; the stamping time added to each workflow; how many release runs (and games) the last ten merged briefs would have skipped under the new rule; anything in the old version path that had no place in the new one.

---

## Report
*Filled in by Claude Code. Rebuilt on 28 Nov against the Amendments.*

- **What's in:** sections 1 to 9 as amended, item by item.
  - **B1:** `releases/BASE.json` lists 001 to 029 except 012. Its baseline is `main` at the last sync (`94acfcb`, v3.20.00 · Build 25). `waits-on`, the build-time guard and the status board all count those briefs as merged.
  - **L7:** the version check fails a `BASE.json` whose commit isn't on `main`, or whose `version.js` there reads a different number.
  - **B2:** the release decision is a game key: a hash of the six game files, `board/tests/rng.js` and `play.js`, `order.js`, `plan.js`.
    - A pull request is judged from its whole content against its merge-base, on every run. It is skipped only when a finished run with that key was posted on it (the lab's comment carries `release-key`).
    - On `main`, each lab run lists the versions with neither a release run nor a `same games as` line. It writes the lines, plays the oldest missing run at its own commit, and starts itself again if more are left.
  - **H1:** `checks` runs one generated test list (5 groups), with no step and no `R:` entry per test. A build's branch never gets `results/INDEX.md` or `index.csv` (`deliver.sh`), and the version check fails a build pull request that changes them. CLAUDE.md says real code overlaps still need a sync.
  - **H2:** a preview's label counts to the merge-base (`<version>+NNN`).
  - **H3:** the lab's plan job moves to the commit it plays, stamps once and passes the version to every later job. A publish of `main` skips itself once it is no longer the newest commit.
  - **H4:** `DEFAULT_OPPONENT` lives in `brain.js`; `app.js` and `plan.js` read it. `plan.js` stops if it's missing. A `releases/` file naming rules or a brain always gets a release run.
  - **H5:** the stamp fetches the history it needs and stops if it can't reach the baseline. `merge.js`, `play.js`, `nightly.js` and `plan.js` refuse an unstamped board.
  - **M1 to M4:**
    - The releases file is the identity, and the title must agree.
    - Every pull request that isn't only results, job orders, briefs, flags or `.md` files adds a releases file.
    - The `Waits on` row is strict, with "no such brief" and named loops.
    - One copy-of-the-brief rule (the pull request's own copy, else `brief/NNN-*`, else `main`), used by `waits-on`, the build-time guard (`node tools/waits-on.js --brief NNN`) and the status board.
    - One script posts the status on every open pull request: on pull request events, on each push to `main` and hourly.
  - **M5 (ruled no) and A2:** a brief counts only once it is in the branch ("028 merged: sync once to test on it"). A brief merged the old way counts once the branch has `BASE.json`.
  - **M6:** a failing `checks` run on `main` opens a "Main broken" issue and closes it when `main` passes again. The status board shows `main broken since <brief>`.
  - **M7:** `main` is republished when `releases/` or `changelog/` changes.
  - **M8:** 031 writes no number.
  - **M9 and A7:** each test's `// @test` line gives its group, its quick, release and night counts, `browser` and `args=`. `tools/run-tests.js` builds the one list for `checks`, the release run and night checks. It covers `board/tests/`, `sims/lab/`, `sims/status/`, `tools/`, `.github/invariants-check.js` and `regress_engine.js`. A run fails if fewer tests ran than the list holds, or if a test file has no line. Night checks lost their hand list.
  - **F031-1:** follow-ups use `releases/NNN-2.json`, counted once, with the bump not compared with the brief; titles read `NNN-2`.
  - **A9:** "Build brief" brings in `main` first, then checks `Waits on`.
  - **A10:** a branch older than the baseline keeps its own typed number as its label.
- **Fixes from the red team's review of the build (28 Nov):**
  - **F1:** release runs and "same games as" lines sitting in an open `lab/*` results pull request now count as filed when `main`'s backlog is planned, so a second lab run doesn't replay the same version into the same folder. Test: planned twice with nothing filed, v3.21.00 is planned both times; counting the open results pull request, the second plan moves on.
  - **F2:** `run-tests.js --check` now fails a job that isn't one of the five, a test that runs at no level, and a count that isn't a number, `yes` or `no`. Every run checks the list first, and `checks` runs `--check` once. The "fewer tests ran than the list holds" guard couldn't fail, so I removed it: every selected test gets a result, and a crash of the runner fails the run by itself. Words in a `@test` line's note are no longer read as settings (`regress_engine.js`'s note had been). Tests for each case are in `test_tools.js`.
  - **F4:** when job orders queued on `main` are set aside so the lab can play a missed version at an older commit, the lab now starts again even if no other version is missing.
  - None of the three touches a game key file (the six game files, `board/tests/rng.js`, `sims/lab/play.js`, `order.js`, `plan.js`). The game key stays `75ed27b3a256f0eb`, so the passed release run stands.
- **Anything beyond the brief, and why:**
  - When several versions on `main` miss their release run, the lab plays one per run and then starts itself again (`gh workflow run lab.yml`). Playing several commits in one run would need a separate set of play jobs per commit; one per run keeps the jobs simple and drops nothing.
  - `waits-on` is a commit status, not a job name: a status can be set again from `main` without re-running the pull request's workflow.
  - The `checks` groups are now `tests (rules)`, `(slow)`, `(brains)`, `(invariants)` and `(board)`. The tests and their counts are the same as before. `test_page.js`, which no workflow ran, is now in.
- **Checks run and results:** every test in the generated list passed in this session (stamped board): `node tools/run-tests.js --level quick` ran 44 of 44 with 0 failed, browser tests and `board_check.js` (10) included. This was a session run; GitHub's `checks` must still pass.
- **Replay hashes** (`regress_engine.js`, 3 games): `main`'s board (`94acfcb`) and this branch print identical hashes for every rule set (the newest, v3.10, is left out by this command; the release run's hashes job covers it with `all`):
  ```
  match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0
  v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250 · v3.5 fca989aecfaf21c9 · v3.6 a6bf327b54f7d5a1
  v3.7 dd3c27d9dc9aafbb · v3.8 022a298c49a02540 · v3.9 b3c2d4464b363ba0
  ```
  Moving the default brain into `brain.js` changed no game. It still changes the game key, so this build gets a release run (it also changes the lab's `play.js` and `plan.js`).
- **Two merges in both orders** (scratch copy of this repository with 031 merged). 090 is a YY screen-only change that adds a test file; 091 is a ZZ `data.js` change that carries its own lab result:
  ```
  090 release decision: no release run - screen files only: board/app.js
  091 release decision: release run - the game key changed (board/data.js)
  Order A then B: 090 merged, no conflict · v3.21.00 · Build 27; 091 merged, no conflict · v3.21.01 · Build 28
  Order B then A: 091 merged, no conflict · v3.20.02 · Build 27; 090 merged, no conflict · v3.21.00 · Build 28
  results/INDEX.md and index.csv changed by either merge: 0 · the new test is in the generated list: yes
  main's backlog to the end, A then B: v3.20.01 played; v3.21.00 same as v3.20.01; v3.21.01 played
  main's backlog to the end, B then A: v3.20.01 played; v3.20.02 played; v3.21.00 same as v3.20.02
  ```
  (v3.20.01 is 031 itself: it changes the lab's play scripts, so it gets its own release run.)
- **The amendment's added checks** (`tools/test_tools.js`, real scratch git histories):
  - A game-file push followed by a test-only push still needs its release run, and is skipped only when a finished run with that key exists.
  - Three merges in a row (game, screen, game) end "v3.21.00 played (more left: the lab starts again); v3.21.01 same as v3.21.00; v3.21.02 played".
  - `waits-on` fails five malformed rows, "Waits on 099: no such brief" and "Waits on a loop: 050 → 051 → 052 → 050".
  - An `NNN-2` case is in the counting test (`test_version.js`).
  - One deliberately failing test turns the runner red, and a test with no `@test` line fails the run.
- **waits-on on GitHub:** shown only in scratch copies so far. A live fail-then-sync-then-green needs a second open build pull request.
- **Baseline:** the stamp at `94acfcb` gives v3.20.00 · Build 25, the same as `main`'s `version.js` (the check runs on every pull request). With 031 merged it counts v3.20.01 · Build 26.
- **Stamping time per workflow:** counting takes under 0.1 s. The red team measured a blobless clone of this repository at 0.8 s. Each workflow's checkout grows by that much. Not measured on GitHub yet.
- **Release runs the last ten merged versioned briefs would have skipped:** 3 of 10 (029, 025 and its v3.14.01 follow-up), so 6,000 games. The renumber re-runs (022/018, 026/028, 028/029) also go, about 6,000 more. 026 and 018 touched `engine.js`, so they keep theirs.
- **Old version path with no place in the new one:**
  - The Ready title's `vX.YY.ZZ`.
  - "Behind main" as a reason to sync.
  - `test_version.js`'s typed-in number.
  - The release trigger on `version.js` changing.
  - The pull request trigger "only if this push changed it".
  - `release_quick.txt` and every per-test step in `checks.yml` and `night-checks.yml`.
- **Bot minimum:** n/a.
- **Known gaps:**
  - The `waits-on` status only appears in Settings after it has run once on every open pull request. Tick it after that.
  - The status board runs `main`'s script, so its new lines appear after the merge.
  - Release hashes with `all` take about 15 minutes a board here.
  - Moved to brief 032: M10, L2, L3, L4, L6.
- **Flags closed / opened:** closes F029-2 and F031-1. No new flags.
- **Branch:** `claude/serene-lamport-aitl71`, started from `brief/031-version-at-merge`.
- **Clicks for the Editor, after the merge:**
  1. When every open pull request shows `waits-on`: Settings → Rules → Rulesets → the rule for `main` → Require status checks to pass → Add checks → `waits-on` → Save changes.
  2. L1: Settings → General → Pull Requests → untick "Allow rebase merging". Then in the rule for `main` (as in step 1), tick "Block force pushes".
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/73
