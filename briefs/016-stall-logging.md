# Brief 016 — Stall logging: when games go quiet, and what's left

| | |
|---|---|
| Game version | Next free **ZZ** at merge (lab tooling: nothing about how the game plays changes, as brief 008) |
| Lane | Lab |
| Rule set | none |
| Date | 19 Nov 2026 |
| Goal | Every lab game records when fighting started and stopped, how quiet the ending was, and what each side had left, so every later build has a before and after on stalls |
| Branch | Any branch your session may push to, started from `brief/016-stall-logging` |
| Flags | Closes F35 (results pull requests jam). Supports F10 (stalls; F11, F13 and F32 are folded into it) |
| Order | **Can start now, alongside 015** (different files: this touches `sims/lab/` only, apart from the version line). Better merged **before** 015's overnight runs, so they carry the new columns; whichever merges second takes the next free version |

## Context
Mirror games still end on the turn limit about half the time. The Editor's ruling (19 Nov): the stall is a metric to track, study by kind and cause, and coach down over months, with no rule change for now. Today the lab only records how a game ended. It can't say when the fighting stopped, whether the ending was a stand-off or a side with nothing left to push with, or whether a stall starts the same way in different formats. This build adds that record. It is measurement only: no rule, brain or board change.

## Scope
In: a new lab measure, `stall`, collected on every run; its table and a few summary lines; a script that runs the same measure over the Editor's own saved matches; a first "before" run; the fix for results pull requests jamming (F35, folded in by the Editor on 19 Nov).
Out: any definition of what a stall *is* or of stall kinds (the study does that later, from these columns); any rule or brain change.

## What to build

### 1. The `stall` measure (`sims/lab/measures.js`)
A new entry, read from the game as played (the existing `before` / `after` / `end` hooks), and added to `ALWAYS` so every run collects it from now on: release, nightly, screens and studies. Turns are game turns (`st.turn`); a side-turn is one side's turn.

Per game columns (counts and turn numbers, so `merge.js` can total them):

| Column | Meaning |
|---|---|
| `first_contact_turn` | First turn on which any unit stands next to an enemy unit |
| `first_attack_turn` | First turn with an attack or a pull |
| `last_damage_turn` | Last turn on which anything took damage: a unit, a holder's pool or a flag, from an attack, a pull or a reaction (parry, set spear) |
| `quiet_end` | Side-turns at the end of the game after the last attack or pull (0 if the game ended on one) |
| `longest_quiet` | Longest run of side-turns with no attack or pull, from the first attack to the end |
| `quiet_side_turns` | Side-turns with no attack or pull, from the first attack to the end |
| `braces_last5` | Braces in the last 5 turns, both sides |
| `units_n_l3`, `units_s_l3` | Each side's units in play, not counting its holder, at the first side-turn on or after turn limit − 3 (blank if the game ended earlier) |
| `uc_n_l3`, `uc_s_l3` | Each side's unit cap (UC) in play at that moment, holder included |
| `holder_n_l3`, `holder_s_l3` | 1 if that side's flag is held at that moment |
| `flag_n_l3`, `flag_s_l3` | That side's flag health as the board shows it at that moment |
| `gap_l3` | Fewest hexes between any two opposing units, holders left out (blank if one side has only a holder) |
| `units_n_end`, `units_s_end`, `gap_end` | The same three at the end of the game |
| `limit_decided_by` | For games that end on the turn limit: `flag` (more flag damage), `units` (fewer units lost, rule sets that still use it), `draw`; blank otherwise |
| `limit_flag_margin` | For those games: the gap in flag damage between the sides |

Name the columns exactly as above, or say in the Report what changed and why.

### 2. The `stall` table and summary lines
`merge.js` writes `tables/stall.csv` per matchup: the totals above, plus each column's average over the games it applies to. Each run's `SUMMARY.md` gets three lines under the key table:
- average turn of first attack and of last damage, all games and turn-limit games apart;
- average `quiet_end` in turn-limit games;
- the share of turn-limit games whose last damage came 5 or more side-turns before the end. **This is a starting cut for the study, not a definition of a stall:** label it so.

### 3. The Editor's own games (`sims/lab/record.js`)
The Matches screen can copy a full match record (`recordText` in `app.js`: rule set, options, brains, actions, result). A new script replays a copied record action by action through the same measures and prints one `games.csv`-shaped row:
- `node sims/lab/record.js <record.json> [more.json ...] [--out <csv>]`.
- Records live in `data/human_records/` (one JSON per match, file name = the match id). Add a short README there saying how to add one: copy from the Matches screen, paste into a new file.
- A record whose actions don't replay to its saved result: print it and skip it, never guess.
- Human turns have no brain timing: leave `timing` columns blank.
- This build commits no records: the Editor adds them when he wants his games compared. The self-test uses one record built from a seeded bot game.

### 4. The first "before" run
A `study` job order in this pull request (`studies/queue/`): default brain mirror, newest rule set on main when the build starts (v3.5, or v3.6 if 015 has merged), balanced 5v5 and 7v7, 1,000 games each, the same seeds as that version's release run (the order's `seed_name` set to the release order's id), so its outcome table must match the release's exactly: a free check that the measure changes nothing. Measures: `play`, `clock`, `light` (with `stall` collected automatically). This run is the baseline every later build compares against. If 015 has merged by the time this runs, add the same two matchups on v3.5 too, so 015's stall effect has a before and after on the same seeds.

### 5. Results pull requests can't jam (F35)
Today every run adds its line to the top of `results/INDEX.md` and `results/index.csv`, so when one results pull request merges, any other waiting one conflicts and can't merge itself (it happened on 19 Nov: #20 and #22 stuck for hours). The Editor accepted Code's recommendation:
- The lab **rebuilds** both files from the run folders (`results/*/*/run.json`) instead of adding a line. `INDEX.md` stays written from `index.csv`, so the two always agree.
- When a results pull request falls behind `main`, the lab merges `main` into it and rebuilds both files, so a conflict can't stay. No repository setting changes (F28 already has them right).
- **The rebuilt files must list exactly the runs listed today**, same rows, same order, checked before merge (paste the diff, which should be empty). Watch out: a quiet night writes an INDEX line ("no change, passed") with **no run folder**. Those lines must survive a rebuild: give them a home the rebuild reads (for example a small `results/nightly.csv`, or a tiny run folder per quiet night). Say in the Report which you chose.

## Rules it touches
None: no rule changes. Tests (`self_test.js` or a new `test_stall.js` in `checks`):
- Hand-built short games: each column comes out as worked by hand. Cover at least: a game ending on a pull (quiet_end 0); a turn-limit game with a quiet ending; a game where reactions are the last damage (parry or set spear); a holder present at limit − 3; a side down to only its holder (`gap_l3` blank).
- `merge.js` totals and averages from two parts equal those from one.
- `record.js` replays a seeded bot game's record to the same row the lab writes for that seed.
- The rebuild: from today's `results/`, the rebuilt `index.csv` and `INDEX.md` equal the committed ones byte for byte; two results branches each adding a run, merged in either order, end with both runs listed and no conflict.

## Bot minimum
n/a: the build changes nothing the bot can do. Prove the measure watches without touching: brain hashes unchanged on every preset.

## Must not change
- Every preset plays and replays identically; every brain plays exactly as before (paste the hashes).
- Every existing `games.csv` core column, measure column and table, as `results/README.md` requires (extend, never rename).
- Past run folders: not rewritten. Every run listed in `results/INDEX.md` today is still listed after the rebuild.

## Checks before opening the pull request
- Every check in `README.md` passes, `sims/lab/board_check.js` included.
- `regress_engine.js` hashes for every preset match main.
- The lab self-test passes with `stall` in `ALWAYS`.
- One short screen run (about 50 games per format) in the session to show the columns fill in sensibly; paste its `stall.csv`.

## The Editor's hands-on check
1. Open the "before" run's `SUMMARY.md` once it lands and check the three stall lines read plainly.
2. The next time two results pull requests wait at once, both merge themselves without a click.
Nothing to play.

## Report
*Filled in by Claude Code.*

- **What's in:**
  - **`stall` measure** in `sims/lab/measures.js`, added to `ALWAYS`, so every run collects it: release, nightly, screens and studies. Every column is named exactly as the brief says.
  - **`tables/stall.csv`** per matchup, written by `merge.js`. For each number column it gives the total, the average, and the number of games it applies to; for `limit_decided_by`, a count of each value.
  - **Three "Stalls" lines** under every `SUMMARY.md` key table. The 5-side-turn share is labelled as a starting cut, not a definition.
  - **`sims/lab/record.js`** replays copied match records through every measure, with timing left blank. A record that doesn't replay to its saved result is named and skipped. `data/human_records/README.md` says how to add a record; no records are committed.
  - **F35:**
    - `sims/lab/index.js` rebuilds `index.csv` and `INDEX.md` from every run folder's `run.json`. Newest date comes first, then the run that finished last.
    - `merge.js` now writes the answer into `run.json` and rebuilds instead of adding a line.
    - Quiet nights live in **`results/nightly.csv`** (chosen over a tiny folder per night). `nightly.js` adds them there, then rebuilds.
    - New workflow **`results refresh`** (`.github/workflows/results-refresh.yml`, running `sims/lab/refresh.sh`). It runs hourly, on every push to `main` that touches `results/`, and on demand. For each open `lab/*` results pull request that conflicts with `main`, it merges `main` in, rebuilds both files, pushes, restarts its checks and keeps auto-merge on.
    - It only acts when the sole conflicts are the two index files and nothing outside `results/` and `studies/` would change. Anything else is left for a person, with a warning.
- **Anything beyond the brief, and why:**
  - One extra column, **`damage_quiet_end`**: side-turns at the end after the last damage. The brief's third summary line counts from the last *damage* in side-turns, and none of its columns can give that: `last_damage_turn` is in turns, and `quiet_end` counts from the last attack or pull, so set spear on a move would be missed. This adds a column and renames nothing.
  - **The hourly schedule** on the refresh. When a results pull request merges itself, GitHub starts no workflows for that merge (it was made with the workflow's own token). A push trigger alone would never see the most common case.
- **Choices the code forced on a column's meaning:**
  - **`quiet_end` in a game with no attack or pull at all** counts every side-turn. `first_attack_turn` is then blank, and `longest_quiet` and `quiet_side_turns` are 0, because both count from the first attack.
  - **Side-turns are counted as the bots play them:** one per side's turn, from the first decision. The deploy phase isn't counted.
  - **UC** is each unit's card value for units (`beings`, shown as UC on screen), holder included.
  - **"Damage"** is any fall in unit HP, or any rise in flag damage, from any action. That covers attacks, pulls, parry and set spear.
- **Checks run and results (paste regression hashes):**
  - `board/` engine and brain files are untouched; only `version.js` and `test_version.js` change. So every preset and brain plays as on `main`. Normal mode on `main`'s board: `match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0 · v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250 · v3.5 fca989aecfaf21c9`.
  - **The measure watches without touching:** the before run's outcome table equals v3.08.00's release table exactly, on the same seeds, field for field.
  - **`sims/lab/test_stall.js`** (new, in `checks`): 39 checks, 0 failures. It covers:
    - a game ending on a pull;
    - a turn-limit game with a quiet ending and a holder at limit − 3;
    - parry, then set spear on a move, as the last damage;
    - a side with only its holder (`gap` blank);
    - stall.csv from two parts equals one part;
    - `record.js` replaying a lab game to the identical row;
    - a record with a wrong result being skipped;
    - the rebuild being byte for byte on today's `results/`;
    - a quiet night surviving a rebuild;
    - two results branches merged in either order ending with both runs, newest first, and no conflict left.
  - **Rebuild diff on today's `results/`:** empty, for both `index.csv` and `INDEX.md`.
  - Also passing: lab self-test (34), `board_check.js 10` (10 games, 0 different), `test_rules`, `test_watch`, `test_version`. CI `checks` is green.
  - **In-session screen** (50 balanced games per format, Brain 5 mirror, v3.5), stall averages:
    - 5v5: first attack turn 2.0, last damage 11.0, quiet_end 16.8, units at limit − 3 (holder left out) 0.41 / 0.45, gap at limit − 3 3.3; turn-limit games decided by flag 17, units 10, draw 2.
    - 7v7: first attack 3.1, last damage 12.3, quiet_end 20.0, units at limit − 3 1.19 / 1.14, gap 7.5; units 12, flag 8, draw 1.
- **The "before" table** (`results/v3.08.01/2026-11-19_study_stall-before`; balanced Brain 5 mirror, v3.5, 1,000 games per format, the seeds of `release-v3-08-00`). Averages over the games each column applies to:

  | | 5v5 | 7v7 |
  |---|---|---|
  | Ended on the turn limit | 58.0% | 40.7% |
  | First contact (turn) | 2.9 | 3.6 |
  | First attack or pull (turn) | 2.0 | 3.1 |
  | Last damage (turn), all games / turn-limit games | 11.4 / 11.1 | 13.0 / 12.7 |
  | Side-turns with no attack or pull at the end, turn-limit games | 28.3 | 46.3 |
  | Longest quiet run (side-turns) | 18.3 | 19.6 |
  | Braces in the last 5 turns | 1.4 | 1.8 |
  | Units besides the holder at limit − 3, North / South | 0.40 / 0.38 | 0.91 / 0.84 |
  | Flag held at limit − 3 | 100% / 100% | 100% / 100% |
  | Closest opposing non-holders at limit − 3 (hexes) | 4.4 | 6.2 |
  | Turn-limit games decided by flag / units / draw | 399 / 156 / 25 | 225 / 148 / 34 |
  | Flag-damage margin in turn-limit games | 3.4 | 2.6 |

  - In a turn-limit game the fighting is over by about turn 11 at 5v5 and turn 13 at 7v7. By limit − 3 each side has its holder plus under one unit, and both flags are held.
  - "Fewer units lost" still decides 27% of turn-limit games at 5v5 and 36% at 7v7.
  - Likely, not isolated: this is a description, not a cause.
- **Bot minimum (met / not met, with numbers):** n/a; no bot change. The identical outcome table above shows the measure doesn't change play.
- **Settings review:** not a brain build; skipped.
- **Known gaps:**
  - The **5-side-turn cut catches 100% of turn-limit games** (580 of 580 and 407 of 407), so it separates nothing (**F36**, `ASK`).
  - The **v3.5 / v3.6 pair** asked for in case 015 merged first isn't in this run, because 015 hadn't merged when it started. 015's own lab runs carry no stall columns either, since they were already playing.
  - The **refresh workflow** is tested locally (the two-branch merge test) but hasn't run on GitHub yet. The first real case will be the next time two results pull requests wait at once.
- **Flags closed / opened:** closed **F35**; opened **F36** (the stall cut).
- **Pull request:** #28, branch `claude/016-stall-logging`, started from `brief/016-stall-logging`.
