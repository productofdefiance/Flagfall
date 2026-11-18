# Changelog

Newest first. One entry per build, written for the Editor: what a player notices first, then what changed under the hood.

## Versions
| Game version | Rule set | Default brain | UI | Build | Brief |
|---|---|---|---|---|---|
| v3.05.01 | v3.4 | Brain 5 | v1 | 7 | 008, the lab |
| v3.05.00 | v3.4 | Brain 5 | v1 | 6 | 006, Brain 5 |
| v3.04.00 | v3.4 | Kit C | v1 | 5 | 005, crack the fort |

## v3.05.01 (Build 7) — Brief 008, the lab: heavy runs on GitHub, organised results, watch any game by seed (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). No brain changed. Game version **v3.05.01** (ZZ: nothing about how the game plays changes). If brief 007 (v3.06.00, also Build 7) merges first, this takes v3.06.01 and Build 8.

**What a player will notice**
- A link can open any simulated game on the board, set up and playing: `…/Flagfall/?watch=<seed>&rules=…&n=…&s=…`. Every simulated game now has one. If the board doesn't have that game's brain or rule set, it says so instead of playing a different game; if the version differs, it warns first.
- A watched game never replaces your own match in progress, and isn't saved to the Matches list.
- Matches you set up yourself with a seed play exactly as before.

**Under the hood**
- `board/watch.js`: how the board sets up and plays a Computer vs Computer match from its seed (lineups, coin toss, deployment, the bot's steps), shared by the board and the simulators. The board's lineups moved there unchanged (checked against the old ones for every rule set, format, mix and three brains).
- The lab: `.github/workflows/lab.yml` plays job orders from `studies/queue/` on up to 20 GitHub machines (every night after the night checks, on demand, or in a pull request), and `sims/lab/` writes one run folder per order in `results/` (`SUMMARY.md`, `run.json`, `games.csv` with a replay link per game, `tables/`) plus `results/INDEX.md` and `results/index.csv`. Results reach `main` through a pull request that may only change `results/` and `studies/` and merges itself once the checks pass.
- Release runs: a pull request that changes the game version gets the baseline table at 1,000 games per format (default brain mirror, newest rule set), every check and the regression hashes, posted as a comment, and filed after the merge.
- The night checks file their result in `results/` too ("no change, passed" when `main` hasn't changed).
- Tidy: simulators moved from `board/tests/` and `data/sim_study10/` to `sims/`; the old studies moved from `data/sim_study6–10` to `results/pre-v3.05.00/` (with `git mv`; its README maps old paths to new).
- New checks: `test_watch.js`, `sims/lab/self_test.js`, and `sims/lab/board_check.js` (10 simulated games and the same games on the board play identical moves; its own job in `checks`).

**Flags closed:** none. **Opened:** F27 (results reaching `main` need two repository settings), F28 (starting a lab run from a Claude session).

## Build 6 — Brief 006, Brain 5: a bot that plans its turn (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). New opponent **Brain 5**, now the default.

**What a player will notice**
- The default opponent is Brain 5. It plans its whole turn before it moves, never walks a unit up for an attack it can't pay for, and braces only when enemies can actually reach it.
- Its Light units step away after a hit when that's safer (about 8 or 9 times out of 10 when a safer hex exists), and stand with more open hexes around them (Dodge when attacked about 15–17%, up from 8–12%).
- Brain 5 vs Brain 5 games rarely end in a draw (2–5%), and flag pulls are now the usual way to win. About half still go to the turn limit, but the tiebreak decides almost all of them.
- On the setup screen the opponent picker is labelled "Brain" (it said "Kit"). Saved matches against Kit A–D still load, and those brains play exactly as before.
- The Opponent screen shows Brain 5's settings in plain words (how much it fears damage, values next turn's Stamina, the flag, and so on).

**Under the hood**
- `bot.js`: Brain 5's planner (`planTurn5`) and its one score (`value5`: what it gains, what the enemy can realistically do back next turn, and how it's placed for next turn). It plans again after every roll.
- `brain.js`: Brain 5 and its 11 settings. `app.js`: the default opponent and the Opponent screen.
- `tests/baseline.js`: an all-Light lineup and the diagnosis counters. New test `test_brain5.js`: three positions plus legal play.
- Study data in `data/sim_study10/`.

**Flags closed:** none. **Updated:** F10, F11, F12, F22. **Opened:** F24, F25, F26.

**Stall re-check (balanced lineups, v3.4; Kit D 400 games per format, Brain 5 1,000)**

| | Kit D 7v7 | Brain 5 7v7 | Kit D 5v5 | Brain 5 5v5 |
|---|---|---|---|---|
| Holder KO | 53.5% | 2.8% | 23.8% | 4.9% |
| Pull KO | 0.2% | 38.9% | 0% | 25.2% |
| TKO | 7.2% | 13.3% | 1.2% | 14.6% |
| Tiebreak win | 36.5% | 40.4% | 13.2% | 52.9% |
| Draw | 2.5% | 4.6% | 61.8% | 2.4% |
| Ended on the turn limit | 39.0% | 45.0% | 75.0% | 55.3% |
| Games with a pull | 0.2% | 39.0% | 0% | 25.2% |
| Average turn | 22.4 | 22.9 | 22.5 | 19.1 |

## Build 5 — Brief 005, the bot cracks the fort; 7v7 gets 35 turns (18 Nov 2026)
Rule set: **v3.4** (new; the new-game default): v3.3 with 35 turns at 7v7 (25 at 5v5). New opponent **Kit D**, now the default.

**What a player will notice**
- The default opponent is Kit D. It plans its whole turn: it gangs up on one of your units it can remove, cracks a held flag with two attackers (the least valuable one takes the parry), and goes for your flag when you're down to your holder.
- 7v7 games last up to 35 turns. The Settings screen shows the limit for the chosen format, and the top bar counts to it.
- The Evade preview never promises a step that won't exist. If tackle or anything else stops it, it says why.
- A greyed-out button explains itself when tapped (for example "Needs 1 Command, 0.5 left").
- Units are counted in unit cap (UC) on screen; the word "beings" is gone.

**Under the hood**
- Kit D's turn planner (`bot.js` planAction), with four switches. "Pick off the weak" is off because it made Kit D worse in testing.
- Engine: per-format turn limit (switch `turnLimitByFormat`), and plain-language reasons for blocked moves and actions (`whyNoMove`, `blockReasons`, an exact Evade preview).
- New tests: `test_v34.js`, `test_reasons.js`, `test_kitd.js`.

**Flags closed:** none. **Updated:** F10, F11, F12 (the stalls are not the bot's fault alone, and the longer clock didn't help). **Opened:** F23 (sampling noise).

**Baseline (balanced lineups, 400 games each)**

| | v3.2 Kit B 7v7 | v3.3 Kit D 7v7 | v3.4 Kit D 7v7 | v3.2 Kit B 5v5 | v3.3 Kit D 5v5 | v3.4 Kit D 5v5 |
|---|---|---|---|---|---|---|
| Holder KO | 61.0% | 55.0% | 53.5% | 24.0% | 31.2% | 23.8% |
| Pull KO | 0.5% | 1.0% | 0.2% | 0% | 0% | 0% |
| TKO | 0% | 7.5% | 7.2% | 0% | 1.2% | 1.2% |
| Tiebreak win | 27.2% | 32.8% | 36.5% | 8.0% | 14.2% | 13.2% |
| Draw | 11.2% | 3.8% | 2.5% | 68.0% | 53.2% | 61.8% |
| Ended on the turn limit | 38.5% | 36.5% | 39.0% | 76.0% | 67.5% | 75.0% |
| Games with a pull | 1.0% | 1.5% | 0.2% | 0.2% | 0% | 0% |
| Average turn | 19.3 | 17.5 | 22.4 | 22.9 | 21.7 | 22.5 |

## Build 4 — Brief 004, v3.3: Evade and tackle at hex cost (18 Nov 2026)
Rule set: **v3.3** (new; the new-game default).

**What a player will notice**
- After a Light unit hits an adjacent enemy without killing it, it can keep moving, but only away from that enemy, with whatever movement, Stamina and Command it has left. The attack preview says "Evade after: up to N hexes".
- After a kill, or after a Reach attack or a shot from range, there's no Evade. Heavy units never evade.
- Breaking contact with an enemy Melee unit costs the leaving unit its own hex cost (Light 0.5, Heavy 1) and one hex of its movement.
- Picking another unit, or End unit, gives up a pending Evade.

**Under the hood**
- Three switches (`evade`, `tackleHexCost`, `tackleUsesCap`) and an `evade` flag on the three Light cards.
- The bot decides an Evade before moving other units. New `test_v33.js` (58 checks).

**Flags closed:** F21 (ruled: the display stays). **Opened:** F22 (Evade doesn't reduce Light losses in bot games).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.2 7v7 | v3.3 7v7 | v3.2 5v5 | v3.3 5v5 |
|---|---|---|---|---|
| Holder KO | 61.0% | 59.5% | 24.0% | 27.5% |
| Pull KO | 0.5% | 0.5% | 0% | 0% |
| TKO | 0% | 0% | 0% | 0% |
| Tiebreak win | 27.2% | 30.5% | 8.0% | 6.5% |
| Draw | 11.2% | 9.5% | 68.0% | 66.0% |
| Ended on the turn limit | 38.5% | 40.0% | 76.0% | 72.5% |
| Pulls | 6 | 4 | 1 | 0 |
| Light units removed per game | 3.76 | 3.85 | 0.67 | 0.68 |

All differences are within chance at this sample size.

## Build 3 — Brief 003, version line and play links (18 Nov 2026)
Rule set: none changed (v3.2 stays the newest).

**What a player will notice**
- Home says which build and rules you're on: "Playtest board · Build 3 · Rules v3.2". A preview copy of a pull request also says "Preview of PR #N".
- The in-match menu shows the build after the rule set. If a match was started on an earlier build, it says so ("Build 4 (started on Build 3)").
- Every new match remembers the build it was started on. The Matches screen shows it under the rule set. Matches saved before Build 3 show none.
- Each finished match has a Copy button that copies its record for Claude. It works for matches finished from Build 3 on; older matches saved only on this device kept no moves, so there's nothing to copy, and the button says so.
- Every pull request gets a "Play this build" link, and `main` is playable at https://productofdefiance.github.io/Flagfall/ once GitHub Pages is switched on.

**Under the hood**
- `board/version.js` is the only place the build number is kept. `checks` fails a pull request that changes `board/` without raising it.
- `checks` is split into parallel quick jobs (a few minutes). The full 400 + 400 double-knockout count moved to a nightly run (`night-checks`), which can also be started by hand or by the `full checks` label on a pull request. A failing night run opens a "Night checks failed" issue.
- New `play-links` workflow publishes `main` and every open pull request to the `gh-pages` branch.

**Flags closed:** none. **Opened:** F21 (a holder on its last half point shows HP 0).

## Build 2 — Brief 002, v3.2: order of operations (17 Nov 2026)

**What a player will notice**
- New games start on rule set **v3.2**. Older rule sets are still in the list and play exactly as before.
- A braced Heavy Melee that dies to a hit no longer strikes back (no parry).
- A braced Heavy Melee parries only the first adjacent attack against it each enemy turn. Ranged shots and Reach attacks never use the parry up. The attack preview says when a parry is already used, and when it only happens if the target survives.
- If one action ever finishes both sides, the match goes to the turn-limit tiebreaks (more pull damage, then fewer beings lost, then a draw) instead of to the side that acted. In 800 bot games this never happened.

**Under the hood**
- Three new rule switches: `parryNeedsSurvivor`, `parryFirstOnly`, `doubleKoToTiebreak`.
- New tests: `test_v32.js` (the new rules, the rules they touch, and an 800-game double-knockout count) and `test_invariants.js` (impossible-state check on the newest rule set). Both run on every pull request.
- The replay regression hashes now cover v3.1. They leave out only the newest rule set.

**Flags closed:** F3, F4, F5, F17, F18, F19 (raised and answered during this build), F20 (accepted as built).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.1 7v7 | v3.2 7v7 | v3.1 5v5 | v3.2 5v5 |
|---|---|---|---|---|
| Holder KO | 61.8% | 61.0% | 24.8% | 24.0% |
| Pull KO | 0.2% | 0.5% | 0% | 0% |
| TKO | 0.2% | 0% | 0% | 0% |
| Tiebreak win | 28.8% | 27.2% | 7.5% | 8.0% |
| Draw | 9.0% | 11.2% | 67.8% | 68.0% |
| Ended on the turn limit | 37.8% | 38.5% | 75.2% | 76.0% |
| Pulls | 3 | 6 | 0 | 1 |
| Parries per game | 0.12 | 0.07 | 0.11 | 0.09 |

The differences other than parries are within chance at this sample size (likely, not isolated).

## Build 1 — Brief 001, automatic checks (17 Nov 2026)
Every pull request runs the board's checks automatically (the `checks` tick on GitHub); `main` only accepts changes through a pull request with `checks` passing. Closed F9.
