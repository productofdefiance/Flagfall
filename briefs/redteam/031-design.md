# Red team report: brief 031 (version at merge), design review

27 Nov 2026, 3:49 am ET · chat FF Red team v3.19.00 - 031 design · outsider review, nothing edited, nothing pushed. Copied into the repo on 28 Nov by chat FF Roadmap v3.19.00 so Code can read it. The Editor's rulings are in the brief's Amendments section.

Target: `briefs/031-version-at-merge.md` on `brief/031-version-at-merge` (commit 6cde75e), tested against `main` at 6b2c7fd (v3.20.00 · Build 25, 029 merged).

## Verdict

The counting idea is sound. The brief as written does not ship safely: one finding stops every waiting build on day one (B1), and one lets a game-changing build go out with no release run (B2). The headline promise, "merge in any order with no resync", is only true for the version files: three other shared files still collide (H1).

## What was checked, and how

| Mark | Meaning |
|---|---|
| **Real** | Read or run against the repository's files and history |
| **Replayed** | Run in a scratch copy (merges of the real 026, 028 and 029 branches at their pre-sync commits) |
| **Reasoned** | Follows from how GitHub or git behaves; not run. GitHub's settings and API could not be read from this chat |

Not checked: the rule on `main`, which merge buttons are allowed, and anything on GitHub Actions itself (no API access here).

## What holds up

- **The counting rule matches history (Real).** Every first-parent commit on `main` that touched `board/` since Build 3 raised the build by exactly one: 23 of 23. Every build merged as a merge commit; results merged as squashes. Both count correctly.
- **Reading history is cheap (Real).** A blobless clone of this repository took 0.8 s and the first-parent walk 0.3 s. git 2.43 shows a merge commit's files against its first parent without extra flags.
- **The game-file list is complete for simulated games (Real).** `engine.js` loads `fields.js`; `bot.js` loads `engine.js`; `watch.js` loads `engine.js`, `bot.js`, `data.js`, `brain.js`. Nothing else in `board/` is loaded by the lab. Two things outside the list still decide which games are played: see B2 and H4.
- **Watch links survive the `+` in a preview label (Real).** `watch.js` encodes it.
- **A version, once given, cannot repeat or be skipped** as long as `releases/` stays append-only and `main`'s history is never rewritten (Reasoned). The risks are at the edges: L1, L2.

## Findings

### Blockers

**B1. `waits-on` deadlocks on every brief merged before 031. (Real)**
- Failure: the check fails while a listed brief has no `releases/NNN.json` on `main`. No brief up to 029 will ever have one.
- How: 031's own row reads `029`. 012's row reads `011, 014, 017, 025, 018, 026, 028`. 030's will read `029, 031`. All stay red for ever once the Editor ticks the check.
- Fix: `releases/BASE.json` lists every brief merged the old way (001 to 029). `waits-on`, the build-time guard and the status board all count those as merged.

**B2. A build that changes the game can merge with no finished release run. (Real for the workflow, Reasoned for GitHub's queue)**
- Failure: the 2,000-game exam is silently skipped for a version that changed play.
- How, in the pull request: `lab.yml` cancels a pull request's run on its next push, and after the first push it only starts a release run "if that push changed it". Today the last push sets the version, so the run restarts. Under 031 no push is special: an engine change, then a later push that touches only a test, leaves no finished run.
- How, after the merge: every run on `main` shares the group `lab-main`, and GitHub keeps one waiting run per group. Three quick merges (the Editor's goal) with a release run in progress: the second merge's run is dropped. The nightly lab shares the same group.
- Also outside the game-file list: `board/tests/rng.js` (seeds every lab game, `play.js` line 16) and `sims/lab/play.js`, `order.js`, `plan.js` (which games are played).
- Fix: decide from the whole pull request against its merge-base, every run. Key a release run by a hash of the game content (the six game files, `rng.js`, the lab's play scripts). Skip only when a finished run with that key exists. On `main`, each lab run first lists every version since the last filed release run that has neither a run nor a "same games as" line, and plays the missing ones.

### High

**H1. "No resync" fails for three more shared files. (Replayed)**
- Failure: builds still conflict and still need a Code chat sync.
- How: merging 026, 028 and 029 unsynced, in both orders, conflicts in `.github/workflows/checks.yml`, `results/INDEX.md`, `results/index.csv` and `board/app.js`, beside the three version files.
  - `checks.yml`: the pass-or-fail list is one line (`R:`). 17 of the last 30 merged pull requests edited it; 20 of 30 added a test file.
  - `results/INDEX.md` and `index.csv`: any build that carries its own lab results conflicts with the next night's results on `main`. 028 needed a sync for exactly this (commit f29bd14). 012 will carry lab results.
  - `app.js`: a real overlap between two screen builds. 030, the attack UI brief and 012 all change `app.js`.
- Fix: `checks.yml` runs the tests from the same generated list as section 6, with no step and no `R:` entry per test. Counts and arguments live in each test file's first lines, not in a shared table (a shared table conflicts the same way). The two index files are not committed on a build's branch; `main` rebuilds them. Say in CLAUDE.md that real code overlaps still need a sync.
- The brief's own check ("two simulated merges in both orders") uses pretend briefs that add no test and no lab results, so it would pass while this stays broken. Make one pretend brief add a test file and the other carry a lab result.

**H2. The preview label can name a version the build does not contain. (Real for the checkouts, Reasoned for the label)**
- Failure: lab rows and saved matches are labelled `v3.21.00+030` but were played without v3.21.00's changes. The label also changes as `main` moves, though the brief says it never does.
- How: `lab.yml` and `play-links.yml` check out the branch's own head, not the branch merged with `main`. Under 031 branches are no longer synced after each merge.
- Fix: the label counts to the merge-base of the branch and `main`: the last `main` commit the branch really contains.

**H3. The stamp must be worked out once per run, at the commit being used. (Real)**
- Failure: two merges within minutes; the first merge's release run is filed under the second merge's version.
- How: the lab's play jobs check out the planned commit, but its `merge` job (which files the results) checks out `main`'s tip. A re-run of an old publish has the same problem in reverse.
- Fix: stamp in the `plan` job at the planned commit and pass the version to every later job. The publish of `main` skips itself when its commit is no longer `main`'s tip.

**H4. The default opponent lives in a screen file. (Real)**
- Failure: a screen-only build changes which brain the release exam plays, gets no release run, and the index says "same games as". Or the exam silently plays Brain 5.
- How: `sims/lab/plan.js` reads the default brain from `board/app.js` line 228 by pattern, and falls back to `brain5` without a word when the pattern misses. Brief 030 rebuilds that screen.
- Fix: a release run is required whenever `releases/NNN.json` has a `brain` or `rules` value. `plan.js` fails loudly instead of falling back. Better still, the default brain moves into `brain.js`.

**H5. A missed or shallow stamp files results under a wrong name. (Real)**
- Failure: results filed for ever under `build-null`, or under a number that stopped counting early.
- How: most jobs check out one commit only. `merge.js` line 53, `play.js` line 72 and `nightly.js` line 15 fall back to `build-<n>` when there is no game version. The brief asks for the stamp in about eight places; one miss is silent.
- Fix: the stamp fetches the history it needs itself and stops with an error when it cannot reach the baseline commit. The lab scripts refuse to run on an unstamped board.

### Medium

**M1. Which brief a pull request builds is not defined. (Real)** Code's branches are named `claude/<random>`; the status board goes by the title. A wrong number in a title reads another brief's `Waits on` row and can pass wrongly. Fix: the `releases/NNN.json` a pull request adds is its identity; the title must agree or the checks fail.

**M2. A tooling build can forget its releases file. (Real, from section 4's wording)** Only a `board/` change forces one. A build that touches only `sims/` or `.github/` (like 021, 023, 024, 027) passes as if it were docs, is never marked merged, and everything waiting on it deadlocks. Fix: every pull request that is not docs-only or results-only must add one.

**M3. The `Waits on` row is read too loosely. (Real, `board.js` line 116)** `12`, `TBD` or `after 030` all read as "waits on nothing" and pass. A number with no brief stays red for ever with a misleading reason. Two briefs naming each other deadlock. Fix: exactly `none` or three-digit numbers with commas, else fail; "no such brief"; name a loop. State which copy of the brief is read (the `brief/NNN-*` branch, as the board does, or the pull request's own copy) and use the same one everywhere.

**M4. A required check that never reports blocks silently. (Reasoned; the same thing happened to `checks` on 21 Nov, per the Dev Handover)** Results and docs pull requests need `waits-on` to report a pass, not to be absent. Re-running an old run does not help: it sees `main` as it was. Fix: one script posts `waits-on` as a commit status on pull request events, on every push to `main` and hourly, always reading `main` live, for every open pull request including `lab/*`. The Editor ticks the box only after every open pull request shows it.

**M5. Turning green by itself lets a build merge untested on the thing it waited for. (Reasoned) Needs the Editor's ruling.** A build only goes green "by itself" when it was built before its dependency merged, so its checks never ran with that code. Fix, if he agrees: `waits-on` passes only once the branch contains the dependency (one sync), with the reason shown (`028 merged: sync once to test on it`). This costs a sync only for builds started with "build anyway". It reverses one line of section 5.

**M6. Nothing tests `main` as merged before it goes live. (Reasoned)** The old resync did this by accident: each build re-ran its checks on top of the last. `main`'s own checks run after the merge, and the live site publishes regardless. Fix: a failing `checks` run on `main` opens an issue (as night checks do) and the status board shows `main broken since NNN`.

**M7. The version can move while the live site does not. (Real)** `play-links.yml` republishes `main` only when `board/` changes. A ZZ build that touches only `sims/` (as 016 did) raises the version; the site, its changelog and the next build's label disagree. Fix: also publish when `releases/` or `changelog/` changes.

**M8. The brief contradicts itself on its own number. (Real)** The header and section 8 say 031 is numbered the old way; sections 1 and 3 say `version.js` holds `null` and 031 counts itself. Written the old way, 031 fails its own new check. Fix: say plainly that 031 writes no number, the baseline is `main` at its last sync, and 031 is the first build counted.

**M9. Section 6 still leaves tests out. (Real)**
- It covers `board/tests/test_*.js` only. `sims/status/test_page.js` is run by no workflow today. The eight tests in `sims/lab/` and `sims/status/`, `.github/invariants-check.js` and `regress_engine.js` stay on hand-kept lists.
- Four tests need a browser (`test_phone`, `test_hotseat`, `test_spflow`, `test_rematch`); the release run's quick job has none.
- Fifteen tests take a count or a file argument, so the table needs arguments, not only counts.
- `night-checks.yml` lists the brain tests by hand; Cavalry's brain would be missed.
- The brief's own list of 13 missing tests is already one short: `test_rematch.js` merged with 029 today.
- Fix: one generated list for `checks`, the release run and night checks, covering all three folders, with "needs a browser" and arguments read from each file.

**M10. Replay links from a build's own lab runs will warn after it merges. (Real, `app.js` line 377)** The rows say `v3.20.01+030`; the merged board says `v3.21.00`; the board shows "A different version". Fix: the stamped board knows which version each brief got, and treats `+030` as that version.

### Low

- **L1. Merge buttons and history rewrites (Not checked).** A rebase merge adds one build per commit; a force push to `main` renumbers everything published. Fix: the Editor allows only "merge commit" and "squash", and blocks force pushes on `main`. Two more clicks for section 5's walk-through.
- **L2. GitHub's Revert button (Reasoned).** Its pull request deletes the `releases/` file and fails the checks. Fix: CLAUDE.md says a revert keeps the file and adds its own; the counter counts each brief number once, so a revert of a revert cannot bump twice.
- **L3. The stamp edits a tracked file (Reasoned).** A Code session that stamps and then commits everything commits the number. The check catches it, every time. Fix: stamp into an ignored file, or have the stamp refuse outside a workflow unless asked.
- **L4. The counting test (Reasoned).** A fixture list of pretend commits does not test reading git. Fix: build the fixture as a real scratch repository with one merge commit and one squash.
- **L5. The lab's key expires about 21 Nov 2027 (Real, Dev Handover).** Fix: the nightly run reads the key's expiry and the status board shows the days left; an issue opens at 30 days.
- **L6. A build stacked on an unmerged build** adds two `releases/` files and fails "more than one". Correct, but the message should say why.
- **L7. `BASE.json` is in an append-only folder.** A wrong baseline cannot be fixed after merge. Fix: a check before merge that the baseline commit is on `main` and its `version.js` reads what `BASE.json` says.

## The Editor's by-hand list (question 6)

1. Tick `waits-on` as required, only after every open pull request shows it (M4).
2. Allow only merge commits and squashes; block force pushes on `main` (L1).
3. Renew the lab's key before 21 Nov 2027 (L5).
4. Never use GitHub's Revert button on a build (L2).
5. Rule on M5.
