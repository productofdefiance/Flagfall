# Brief 016 — Stall logging: when games go quiet, and what's left

| | |
|---|---|
| Game version | Next free **ZZ** at merge (lab tooling: nothing about how the game plays changes, as brief 008) |
| Lane | Lab |
| Rule set | none |
| Date | 19 Nov 2026 |
| Goal | Every lab game records when fighting started and stopped, how quiet the ending was, and what each side had left, so every later build has a before and after on stalls |
| Branch | Any branch your session may push to, started from `brief/016-stall-logging` |
| Flags | Supports F10 (stalls; F11, F13 and F32 are folded into it). Closes nothing |
| Order | **Can start now, alongside 015** (different files: this touches `sims/lab/` only, apart from the version line). Better merged **before** 015's overnight runs, so they carry the new columns; whichever merges second takes the next free version |

## Context
Mirror games still end on the turn limit about half the time. The Editor's ruling (19 Nov): the stall is a metric to track, study by kind and cause, and coach down over months, with no rule change for now. Today the lab only records how a game ended. It can't say when the fighting stopped, whether the ending was a stand-off or a side with nothing left to push with, or whether a stall starts the same way in different formats. This build adds that record. It is measurement only: no rule, brain or board change.

## Scope
In: a new lab measure, `stall`, collected on every run; its table and a few summary lines; a script that runs the same measure over the Editor's own saved matches; a first "before" run.
Out: any definition of what a stall *is* or of stall kinds (the study does that later, from these columns); any rule or brain change; the results-PR jam (F35, still open with the Editor).

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

## Rules it touches
None: no rule changes. Tests (`self_test.js` or a new `test_stall.js` in `checks`):
- Hand-built short games: each column comes out as worked by hand. Cover at least: a game ending on a pull (quiet_end 0); a turn-limit game with a quiet ending; a game where reactions are the last damage (parry or set spear); a holder present at limit − 3; a side down to only its holder (`gap_l3` blank).
- `merge.js` totals and averages from two parts equal those from one.
- `record.js` replays a seeded bot game's record to the same row the lab writes for that seed.

## Bot minimum
n/a: the build changes nothing the bot can do. Prove the measure watches without touching: brain hashes unchanged on every preset.

## Must not change
- Every preset plays and replays identically; every brain plays exactly as before (paste the hashes).
- Every existing `games.csv` core column, measure column and table, as `results/README.md` requires (extend, never rename).
- Past run folders: not rewritten.

## Checks before opening the pull request
- Every check in `README.md` passes, `sims/lab/board_check.js` included.
- `regress_engine.js` hashes for every preset match main.
- The lab self-test passes with `stall` in `ALWAYS`.
- One short screen run (about 50 games per format) in the session to show the columns fill in sensibly; paste its `stall.csv`.

## The Editor's hands-on check
Open the "before" run's `SUMMARY.md` once it lands and check the three stall lines read plainly. Nothing to play.

## Report back
Beyond the standard items: the "before" table (5v5 and 7v7); anything in a column's meaning that the code forced to change; any column that turned out not to be measurable as written (each as an `ASK`).

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
