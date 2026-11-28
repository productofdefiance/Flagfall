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
The red team report is `briefs/redteam/031-design.md` (finding codes below are its own). **Where an amendment and the sections above differ, the amendment wins.** Accepted for this brief: B1, B2, H1 to H5, M1 to M9 (M5 as ruled below), L7, and F031-1. Moved to brief 032 (a follow-up on `brief/032-version-follow-ups`, must merge before 012): M10, L2, L3, L4, L6. L1 is the Editor's GitHub setting (the Report gives the clicks). L5 is left out.

1. **B1, old briefs count as merged.** `releases/BASE.json` lists every brief merged the old way (001 to 029, from `main`'s history; list any number never used as skipped). `waits-on`, the build-time guard and the status board all treat those as merged. L7: a check before merge that the baseline commit is on `main` and its `version.js` reads what `BASE.json` says.
2. **B2, a game change never ships without a finished release run.** Decide whether a pull request needs a release run from the whole pull request against its merge-base, on every run, not from the last push. Key each release run by a hash of the game content: the six game files, `board/tests/rng.js`, and the lab's play scripts (`sims/lab/play.js`, `order.js`, `plan.js`). Skip only when a finished run with that key exists. On `main`, each lab run first lists every version since the last filed release run that has neither a run nor a `same games as` line, and plays the missing ones (the `lab-main` group keeps only one waiting run, so merges close together must not drop one).
3. **H1, no shared lists.** `checks.yml` runs the tests from the generated list (item 9), with no step and no `R:` entry per test. Counts, arguments and "needs a browser" are read from each test file's first lines, not from a shared table. `results/INDEX.md` and `results/index.csv` are not committed on a build's branch; `main` rebuilds them. CLAUDE.md says plainly that real code overlaps (for example two builds editing `app.js`) still need a sync. In the two-order merge check, one pretend brief adds a test file and the other carries a lab result.
4. **H2, honest preview labels.** The `+NNN` label counts to the merge-base of the branch and `main` (the last `main` commit the branch really contains), so it never names a version the build lacks and never moves.
5. **H3, one stamp per run.** Stamp once in the lab's `plan` job at the planned commit and pass the version to every later job (the `merge` job must not re-read `main`'s tip). The publish of `main` skips itself when its commit is no longer `main`'s tip.
6. **H4, the default brain.** Move the default brain out of `board/app.js` into `board/brain.js` (one exported name; the app and the lab both read it). `sims/lab/plan.js` fails loudly if it can't find it (no silent fallback to `brain5`). A release run is required whenever `releases/NNN.json` has a `brain` or `rules` value. Replay hashes unchanged.
7. **H5, no unstamped results.** The stamp fetches the history it needs and stops with an error when it can't reach the baseline. `merge.js`, `play.js` and `nightly.js` refuse to run on an unstamped board (no `build-<n>` or `build-null` fallback).
8. **M1 to M4, waits-on done right.** M1: a pull request's identity is the `releases/NNN.json` it adds; its title must agree or the checks fail. M2: every pull request that is not docs-only or results-only adds a releases file (tooling builds use bump `none`). M3: the `Waits on` row is exactly `none` or three-digit numbers separated by commas, else fail; a number with no brief fails as "no such brief"; a loop is named. Read the brief from the pull request's own copy, and use that same copy everywhere (board included). M4: one script posts `waits-on` as a commit status on pull request events, on every push to `main` and hourly, reading `main` live, for every open pull request including `lab/*` and docs. The Editor ticks the required box only once every open pull request shows it (say so with the Report's clicks).
9. **M9 (with section 6's last part), one generated test list.** One list, generated from `board/tests/`, `sims/lab/` and `sims/status/` (plus `.github/invariants-check.js` and `regress_engine.js`), used by `checks`, the release run and night checks alike. Each test declares its count, arguments and whether it needs a browser in its first lines; the release run gets a browser for those that do. `night-checks.yml`'s hand list of brain tests goes (a new brain's test is picked up the day it is added). A check fails if any test file is in neither the list nor a short, commented skip list. `test_rematch.js` (merged with 029) is in it.
10. **M5, ruled by the Editor: no.** `waits-on` passes only once the branch contains every brief it waits on (one sync), with the reason shown (`028 merged: sync once to test on it`). This replaces section 5's "turn green by itself". It costs a sync only for builds started with "build anyway".
11. **M6, main broken alarm.** A failing `checks` run on `main` opens an issue (as night checks do) and the status board shows `main broken since <brief>` until it passes.
12. **M7.** `play-links.yml` also republishes `main` when `releases/` or `changelog/` changes.
13. **M8.** 031 writes no number (header and section 8 above, corrected).
14. **F031-1, follow-up fixes to a merged brief: yes.** A fix to an already-merged brief adds `releases/NNN-2.json` (then `-3`, …) with its own bump (normally ZZ) and `changelog/NNN-2.md`; its title reads `NNN-2 …`. The counter counts each file once. Any other F031 flags: raise them in the Report as usual.

Checks before Ready, added: the two-order merge with a test file and a lab result (item 3); a game-file push followed by a test-only push still ends with a finished release run (item 2); three merges in a row on a scratch history all get their run or `same games as` line; `waits-on` failing for a malformed row, a missing brief and a loop.

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
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Bot minimum (met / not met, with numbers):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
