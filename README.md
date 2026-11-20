# Flagfall Arena — playtest board

Flagfall Arena (working title) is a turn-based hex game that sits between a sport and a battle. Two squads defend one flag each. You win by knocking down the enemy flag, or by removing every enemy unit.

This repository holds the browser playtest board (rules engine and computer opponent), its tests, the simulation tools and the build briefs. The game's rules themselves are recorded in the **Game Laws**, kept outside this repository by the Editor.

## What is where

| Folder / file | What it is |
| --- | --- |
| `board/` | The playtest board. `engine.js` is the rules (no screen code). `fields.js` holds the fields, one per format (Brief 014). `data.js` holds the unit cards and the rule-set presets (match3, v1, v2, v3, v3.1 to v3.8). `bot.js` and `brain.js` are the computer opponent (Brain 5 is the default; Brain 6 knows the clock; Brain 7 keeps its lead; Brain 8 approaches safely). `app.js`, `ui.js`, `skin.js` and `index.html` are the screen (`ui.js` holds the attack preview's and unit card's wording and logic, with no drawing, so it can be tested). `version.js` holds the game version and the build number (the only place they are kept). `watch.js` sets up and plays a Computer vs Computer match from its seed, for watch links and the lab. Open `index.html` in a browser to play, or use the play links below. |
| `board/tests/` | Automatic pass/fail checks (see below). |
| `sims/` | Scripts that play games and make results. `sims/lab/` is the lab: it plays job orders on GitHub and files the results (Brief 008). The older scripts (`baseline.js`, `h2h_*.js`, ...) still deal their old seeds, so old studies can be re-run. |
| `results/` | Every simulation result, one folder per run (`results/README.md` says how). Start at `results/INDEX.md`. The studies from before the lab are in `results/pre-v3.05.00/`. |
| `studies/` | Job orders for the lab: `queue/` waiting, `done/` played. |
| `redteam/` | Probe scripts from the independent evaluation. They target rule set v3 on purpose, to show the bugs v3.1 fixed. |
| `data/` | Records that aren't simulation results: Match 3's move log (used by the replay test) and a summary of recorded human-vs-bot matches. |
| `briefs/` | **Chat → Code.** One brief per build, numbered. Claude Code adds a `## Report` section to the brief it built. |
| `FLAGS.md` | **Code → Chat.** Numbered open issues, including questions Claude Code needs answered (`ASK`). |
| `flags/` | New flags since Brief 021: one file per brief (`flags/NNN.md`, names `FNNN-1`, …) so two builds can't clash on a name. `FLAGS.md` keeps F1 to F48. |
| `sims/status/` | The status board (Brief 021): `board.js` builds it, the `status board` workflow puts it on the `status` branch and at https://productofdefiance.github.io/Flagfall/status/. |
| `CLAUDE.md` | Standing instructions for Claude Code. |
| `CHANGELOG.md` | One entry per build, newest first, in plain language. |

## How work flows

1. The Editor and Claude (in chat) agree a change and record it in the Game Laws.
2. Chat writes a brief in `briefs/`.
3. The Editor tells Claude Code: "Build brief NNN."
4. Claude Code builds on a branch, runs every check, fills in the brief's Report, updates `FLAGS.md`, and opens a pull request.
5. The automatic checks run on the pull request. The Editor merges only when they pass.

## Play links

- `main`: https://productofdefiance.github.io/Flagfall/
- Each open pull request: `https://productofdefiance.github.io/Flagfall/pr/<number>/` (also the last line of its description). It's removed when the pull request closes.

The `play-links` workflow publishes these to the `gh-pages` branch. GitHub Pages must be switched on once: Settings → Pages → Source: Deploy from a branch → `gh-pages` / root → Save.

## Running the checks

From the `board/` folder, with Node.js:

```
node tests/test_rules.js
node tests/test_v1.js
node tests/test_v3.js
node tests/test_v31.js
node tests/test_v32.js
node tests/test_v33.js
node tests/test_v34.js
node tests/test_v35.js
node tests/test_v36.js
node tests/test_v37.js
node tests/test_fields.js
node tests/test_stamina.js
node tests/test_reasons.js
node tests/test_kitd.js
node tests/test_brain5.js
node tests/test_brain6.js
node tests/test_brain7.js
node tests/test_brain8.js
node tests/test_version.js
node tests/test_watch.js
node tests/test_ui.js
node tests/test_invariants.js
node tests/test_rng.js
node tests/test_replay.js ../data/match3_log.txt
node tests/regress_engine.js <copy of the previous board folder> 3
```

From the repository's top folder:

```
node sims/lab/self_test.js
node sims/lab/test_stall.js
node sims/lab/test_lead.js
node sims/status/test_board.js
node sims/lab/board_check.js 10
```

`board_check.js` plays 10 simulated games and opens the same 10 on the board in a headless browser; their moves must be identical. It needs Playwright (pre-installed in Claude sessions).

## The lab

Simulations run on GitHub, not in a Claude session (Brief 008). Put a job order in `studies/queue/` (the format is in `results/README.md`) and the lab plays it: every night after the night checks, on demand (Actions tab → lab → Run workflow), or in a pull request that adds it. It splits the games over up to 20 machines, writes a run folder in `results/` and a line in `results/INDEX.md`, and gets them to `main` through a pull request that merges itself once the checks pass. Every game in a run's `games.csv` has a `replay` link that opens it on the board. A pull request that changes the game version also gets a `release` run: the baseline table at 1,000 games per format, posted as a comment, and filed after the merge.

`regress_engine.js` prints one hash per rule set, leaving out only the newest preset. Run it on the board before and after a change: every rule set the change was not meant to alter must print the same hash.

`test_v32.js` ends with a double-knockout count over 400 bot games at 7v7 and 400 at 5v5, spread over the computer's processor cores (about 15 minutes on 4 cores; up to 35 on GitHub). Give it a smaller number to try it quickly, e.g. `node tests/test_v32.js 20`; the full check is the default.

`test_stamina.js` checks the Stamina model (Brief 013): base Stamina per card, next-turn modifiers, and the floor check, which tries every combination of the shipped modifiers on every card of every preset (add `--worst` to print each card's worst case).

`test_brain7.js` checks Brain 7 (Brief 019): with all five lead behaviours off it plays exactly as Brain 5, the five test positions (each printing the model's reasoning), and legal play. `sims/brainhash.js <board> brain7:lead=0@brain5` hashes a brain with changed settings on another brain's seeds. `sims/lab/test_lead.js` checks the lead and alone measures on five saved games.

For a build that must not change play at all, `node tests/regress_engine.js <board folder> 2 all` also hashes the newest preset and prints one hash per rule set and brain (every brain, Brain 5 included). Run it on the board before and after: every line must match.

`test_ui.js` checks UI v2 (Brief 009): the outcome bar merges equal neighbours, changed numbers are red only when they hurt the side to move, the preview's Evade equals the engine's, every unit card's text, and that nothing the board shows says "being" (units are counted in unit cap, UC).

`test_invariants.js` plays 30 bot games on the newest preset and fails on any impossible state.

On GitHub, `checks` runs the quick set on every pull request, in parallel jobs, in a few minutes. `test_v32.js` runs there with a short count (`node tests/test_v32.js 40`). The `night-checks` workflow runs the full 400 + 400 count and 100 impossible-state games every night at 08:07 UTC. It can also be started from the Actions tab (night-checks → Run workflow), or by giving a pull request the label `full checks`. A failing night run opens a "Night checks failed" issue. A pull request that changes `board/` must raise the build number in `board/version.js` and change its game version (the brief states the new one).

Last full pass: 17 Nov 2026 (replay: 386 checks, 0 mismatches; match3, v1, v2 and v3 hashes identical to the previous board).
