# Brief 031 — Version at merge: merge in any order, no renumbering, release runs only when the game changed

| | |
|---|---|
| Game version | ZZ (the board's version line changes on previews; no rule, brain or screen change). This is the last brief whose number is set the old way, at its last sync before Ready for review |
| Lane | Lab (tooling) |
| Rule set | none |
| Date | 2026-11-27 |
| Goal | A pull request carries no version number. The number is worked out from merge order when `main` is published, so builds merge in any order without a resync. A build that waits on an unmerged brief can't be built or merged. The 2,000-game release run happens only when the game itself changed |
| Branch | Any branch your session may push to, started from `brief/031-version-at-merge` |
| Flags | F029-2 (raised by Code at the Editor's request; this brief is the Editor's answer, 27 Nov) |
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
- This brief is the last one numbered the old way. It takes its number at its last sync, as today, and sets `releases/BASE.json` from `main` at that moment.
- Any old-way pull request still open when this merges converts at its next sync: it drops its number from `version.js` (back to `null`), moves its `CHANGELOG.md` entry into `changelog/NNN.md`, adds `releases/NNN.json`, and fixes `test_version.js` if it touched it. Say this in CLAUDE.md under sync.
- `board/tests/test_version.js` reads the number from the stamp, never a typed-in one. It checks the counting on a fixture history: in order, out of order, `none`, X resetting YY and ZZ, two merges in a row, and that the label for a pull request reads `<main>+NNN`.

### 9. CLAUDE.md
Rewrite, in plain language and as short as now:
- **Build brief NNN**: first check `Waits on` against `main`; stop if anything listed is unmerged unless the Editor says "build anyway".
- **sync**: bring in `main`. No version step. Convert an old-way branch (section 8).
- **Pull request titles**: `NNN Lane · short name (YY)` while Draft and when Ready. The number appears on the board and the live site after the merge.
- **Game version**, **Raise the build number**, **Keep CHANGELOG.md current**, **Version at merge**: replace with the new rule: add `releases/NNN.json` and `changelog/NNN.md`; never write a number; the stamp counts it from merge order.
- `briefs/TEMPLATE.md`: the `Game version` row reads "size of the bump only (X, YY, ZZ or none); the number is counted at merge". The `Waits on` row's format is exact: "none", or three-digit brief numbers separated by commas.

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

- **What's in:** every section, 1 to 9.
  - `board/version.js` holds `game: null, build: null, date: null`. An unstamped board shows `dev`.
  - `tools/stamp-version.js` is the one counting script (a command and a module). Publishing (`play-links`), the lab (every job), night checks, the `checks` rules job, the status board and the tests all use it. On a pull request it stamps `<main>+NNN` with build `null`.
  - `releases/BASE.json` (v3.20.00 · Build 25, commit `6b2c7fd`, plus the list of briefs merged the old way so `waits-on` counts them as merged), `releases/031.json` (ZZ), `changelog/031.md`. `CHANGELOG.md` has its top line. `tools/changelog.js` builds `changelog.html`/`changelog.md` with the version table for the live site.
  - `tools/check-release.js` replaces `.github/check-build-number.sh` (all section 4 rules, plus `changelog/NNN.md` must be added).
  - `tools/waits-on.js` and `.github/workflows/waits-on.yml`: sets a commit status `waits-on` on the pull request, and again on every open pull request at each push to `main`.
  - Release run: `sims/lab/release_files.js` (game/screen files, a hash comparison for any other board file). `plan.js --release-base`. A screen-only version on main gets one `same games as` line (`sims/lab/same.js`, `results/same.csv`). The quick list is built from `board/tests/test_*.js` (`sims/lab/release_tests.js`, replaces `release_quick.txt`). The quick job installs a headless browser for the four browser checks. Release hashes use `all` (every preset, the newest included).
  - `checks`: a `changes` job. Docs-only pull requests skip the game jobs and `checks` still reports. For a screen-only build the replay hashes must match its base (1 game per preset and brain with `all`).
  - Status board: on main = counted. Building = `029 → YY · would be v3.21.00 if merged next`, plus `waits on 028`. Needs sync = conflict only. Merged rows show the counted number.
  - `CLAUDE.md`, `briefs/TEMPLATE.md`, `README.md`, `results/README.md` rewritten for the new rule.
- **Anything beyond the brief, and why:**
  - The check also fails a brief pull request (title `NNN …`) with no releases file, even with no board change. Otherwise a tooling brief could forget it and `waits-on` would never go green for briefs waiting on it.
  - `BASE.json` lists the 28 briefs merged the old way. Without it, `waits-on` would fail this very pull request ("Waits on 029") and every brief waiting on an old one.
  - `waits-on` is a commit status, not a job name. Only a status can be set again from `main` without re-running the pull request's workflow (re-runs are capped).
- **Checks run and results:** see the end of this Report.
  - **Two merges in both orders** (scratch copy of this repository with 031 merged; pretend 090 = YY, `app.js` only; 091 = ZZ, `data.js`):
    ```
    check 090: OK: releases/090.json (bump YY) matches brief 090; board/ changed.
    check 091: OK: releases/091.json (bump ZZ) matches brief 091; board/ changed.
    Order A then B:
      090: merged, no conflict · v3.21.00 · Build 27 · no release run (screen files only: board/app.js)
      091: merged, no conflict · v3.21.01 · Build 28 · release run planned (game files changed: board/data.js)
    Order B then A:
      091: merged, no conflict · v3.20.02 · Build 27 · release run planned (game files changed: board/data.js)
      090: merged, no conflict · v3.21.00 · Build 28 · no release run (screen files only: board/app.js)
    ```
  - **waits-on** (scratch copy): `before 091 merges: WAIT: Waits on 091: not merged yet`, then `after 091 merges (092 untouched): OK: Waits on 091: all merged`. On GitHub, the status on this pull request reads "Waits on 029: all merged". A live fail-then-green needs a second open pull request, so it has not been shown on GitHub yet.
  - **Baseline:** the stamp at `main`'s commit gives v3.20.00 · Build 25, the same as `main`'s `version.js`. With 031 merged it counts v3.20.01 · Build 26.
  - **Regression hashes:** this build changes no game file (only `app.js`'s version line and `version.js`), so every rule set's hash is unchanged (engine, bot, brain, data, fields and watch are byte-identical to `main`). The `checks` compare job prints them. Because this build counts as screen-only, the hashes must match there.
- **Stamping time added per workflow:** counting itself takes under 0.1 s. The cost is the blobless full-history checkout (`fetch-depth: 0, filter: blob:none`), a few seconds on this repository. Not measured on GitHub yet; I'll add it from the first runs.
- **Release runs the last ten merged versioned briefs would have skipped:** 3 of 10 (029 Rematch, 025 Phone fit, 025's v3.14.01 follow-up), so 6,000 games. On top of that come the renumber re-runs (022/018, 026/028, 028/029), about 3 × 2,000 more. 026 and 018 were "UI" builds that still touched `engine.js`, so they keep their release runs.
- **Old version path with no place in the new one:**
  - The Ready title's `vX.YY.ZZ`.
  - Being "behind main" as a reason to sync.
  - `test_version.js`'s typed-in number.
  - The release trigger on `version.js` changing.
  - Night checks keep `plan.js --release <file>`, which now compares against the stamped version.
- **Bot minimum:** n/a.
- **Known gaps:**
  - F031-1 (a follow-up fix to a merged brief has no path).
  - The `waits-on` status only appears in Settings' list once it has run.
  - The status board script runs from `main`, so its new lines show after the merge.
  - Release hashes with `all` take roughly 15 minutes a board here.
- **Flags closed / opened:** closes F029-2. Opens F031-1 (ASK).
- **Branch:** `claude/serene-lamport-aitl71`, started from `brief/031-version-at-merge`.
- **Required check clicks for the Editor:** Settings → Rules → Rulesets → the rule for `main` → Require status checks to pass → Add checks → type `waits-on` → select it → Save changes.
- **Pull request:** (below)
