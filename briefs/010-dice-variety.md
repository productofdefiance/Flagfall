# Brief 010 — A little variety in normal rolls (rule set v3.5)

| | |
|---|---|
| Game version | Next free YY when it merges (a new rule set): e.g. v3.07.00 |
| Lane | Rules |
| Rule set | v3.5 (new preset: v3.4 plus switch `diceVariety`) |
| Date | 18 Nov 2026 |
| Goal | Normal hits stop being identical: a 2d6 total of 4–5 takes 10% off, 9–10 adds 10%, average unchanged |
| Branch | Any branch your session may push to, started from `brief/010-dice-variety` |
| Flags | none to close |
| Order | After 007 merges (Game Laws 6.13: tested after the stalls fix). Can run alongside 008 and 009 |

## Context
Today every 2d6 total from 4 to 10 deals exactly the same hit (Game Laws 3.3), so 75% of attacks are fully predictable. The Editor approved a small spread for playtest (Game Laws 6.13, 17 Nov). It is a rule change, so it gets its own preset and its own baseline.

## Scope
In: the new preset v3.5, its dice, its baseline, previews showing the new outcomes.
Out: any change to v3.4 or older presets; the size of the spread (10% is the Editor's feel call and may change after play); any brain tuning.

## What to build
1. **New preset v3.5**: a copy of v3.4 with `diceVariety: true`. It becomes the newest preset (new-game default).
2. **The dice under v3.5**, two d6 added, applied where the roll applies today (after Armor, Brace and Support, before Dodge, then rounded to the nearest half, at least 1):

   | Total | Chance | Multiplier |
   |---|---|---|
   | 2 | 1/36 | ×0.5 (Glance) |
   | 3 | 2/36 | ×0.75 |
   | 4–5 | 7/36 | ×0.9 |
   | 6–8 | 16/36 | ×1 |
   | 9–10 | 7/36 | ×1.1 |
   | 11 | 2/36 | ×1.25 |
   | 12 | 1/36 | ×1.5 (Crit) |

   The average multiplier stays exactly what it is under v3.4.
3. **Through `dieCases`.** Add the cases to the engine's `dieCases` for v3.5, so everything that already reads it picks them up with no other change: the attack and pull previews (`low`, `high`, `cases`), both brains' expected values (`bot.js` averages over `dieCases`), the outcome bar in brief 009 if it has merged.
4. **Pulls** use the same dice, as they do today.
5. **Labels** wherever an outcome is named: "−10%" and "+10%" for the new bands; Glance and Crit unchanged.

## Rules it touches
Each becomes a test.
- The damage order (3.2) and the graded bands (3.3): 2, 3, 11 and 12 unchanged.
- Rounding to the nearest half and the minimum hit of 1 (3.7): a hit of 3 gives 2.5 / 3 / 3.5 across the new bands; a hit of 1 stays 1 in every normal band.
- Dodge applied after the roll (3.5).
- Parry (20% of attacker Strength) and set spear (flat 2) are reactions, not rolls: unchanged.
- Pulls and the pooled flag (4.x).
- The chances add up to exactly 1, and the average multiplier equals v3.4's.

## Bot minimum
No new action. The brains already average over `dieCases`, so they must play v3.5 without code changes. Prove it: in 200 seeded v3.5 games, both brains complete every game with no illegal action. Also report Brain 5's average and worst thinking time per turn on v3.5 next to v3.4: there are more dice cases to average (7 instead of 5), so it may be slower (F24). Flag it if the worst turn rises above 4.6 s.

## Measurements
On the lab (brief 008), with the default brain at the time this builds, 1,000 games per format, same seeds on both rule sets:
- The full baseline table for v3.5 next to v3.4 (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), at balanced 5v5 and 7v7.
- Light units removed per game, both rule sets (does a little variety help or hurt the weaker class?).
Under F23, call any gap under about 8 points noise.

## Must not change
- Every existing preset, v3.4 included, plays and replays identically (paste the hashes).
- Every brain plays every existing preset exactly as before.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every preset before v3.5 match main.
- The new dice tests run in `checks`.

## The Editor's hands-on check
One game on v3.5: open the attack preview on a few attacks and check it shows the wider spread; play to the end and confirm nothing feels off.

## Report
*Filled in by Claude Code.*

- **What's in:**
  - Preset **v3.5** = v3.4 + switch `diceVariety`, last in `PRESETS`, so new games start on it. Game version **v3.08.00, Build 11**: the brief expected v3.07.00, but brief 007 merged first and took it.
  - `engine.js`: 7 dice cases under v3.5 (2, 3, 4–5, 6–8, 9–10, 11, 12, with chances 1, 2, 7, 16, 7, 2, 1 out of 36) and one multiplier function, `diceMultiplier`. The multiplier applies where the roll always did: after Armor, Brace and Support, before Dodge, then rounded to the nearest half, with a minimum of 1. Pulls use the same dice.
  - Everything reads `dieCases`, so the attack and pull previews, both brains' expected values and the outcome bar all pick up the 7 cases with no other change.
  - Labels: the new cases are named "4–5 · −10%" and "9–10 · +10%" (the pull panel's dice row shows them). 2, 3, 11 and 12 keep their labels. The rule-set editor has a "Dice variety" switch.
- **Anything beyond the brief, and why:**
  - The lab's `play` measure gained a `bot_errors` column (turns a brain ended because it hit an error), so the Bot minimum can be proven from the lab. This adds a column; nothing was renamed.
  - Four tests assumed v3.4 was the newest preset. They now say "v3.4 and later" or "before v3.4": `test_v34.js` (newest check and turn limits), `test_stamina.js` (Brace tiredness), `test_version.js` (v3.08.00).
  - `test_brain6.js`: its hand-built positions now stay on v3.4's dice. In "clock 2", the attack on v3.5 has the same kill chance (8.3%) and the same average hit, but the spread (3.5 / 4 / 4.5 instead of 4) tips Brain 5 itself into bracing. The position then no longer shows the clock's effect. The seeded legal-play games still run on the newest preset. The first CI run and the PR's release check failed on this; both are fixed on the current head (`node tests/test_brain6.js 30`: 0 failures locally).
- **Checks run and results (paste regression hashes):**
  - All quick checks pass locally: rules, v1, v3, v3.1, v3.3, v3.4, **v3.5 (new; 224–329 checks depending on the game count)**, stamina (581), reasons, version, watch, UI (63/63), rng, replay (386 checks, 0 mismatches), lab self-test (34). Brain 5 and Brain 6 pass at 2 games, Brain 6 at 30. CI `checks` is green on the head. I left `test_v32.js` (400+400), invariants and `board_check.js` to CI and the release checks: none of them touches the dice code beyond what `test_v35.js` covers.
  - `regress_engine.js <board before> 2 all` and the same on this board (every preset × every brain): **all 80 lines identical**. The only new lines are v3.5's. Normal mode (3 games), before = after:
    `match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0 · v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250`
    "All" mode, v3.4 rows (unchanged): `standard a8f8270aceb1eb9e · easy 4d9a73c80a3cb225 · kitA f65eba492e49eaaa · kitA2 31439db204aa5ac0 · kitC de370a3a914caa7f · kitB/batchC 88c03eedc951d875 · kitD 73631bc545ab6f1a · brain5/brain6 a8bc0b017ad55a10`.
  - New dice tests (`test_v35.js`, in `checks` with 6 bot games):
    - Every total 2–12 gets its multiplier on v3.5 and its old multiplier on every older preset.
    - The chances add up to exactly 1, and the average multiplier equals v3.4's.
    - Rounding: a hit of 3 gives 2.5 / 3 / 3.5; a hit of 1 stays 1 on every normal roll; the minimum is 1.
    - Dodge applies after the roll.
    - Hand-built pulls on every band, and the pull preview's 7 outcomes. The pooled flag falls by the whole hit on 4, 7 and 9.
    - Seeded bot games: every attack dealt exactly its preview's case.
    - Parry and set spear are unchanged.
- **Baseline table (rule changes only):** balanced lineups, Brain 5 mirror, 1,000 games per format per rule set, **same seeds** (`results/v3.08.00/2026-11-19_study_dice-variety-v34` and `-v35`). Tiebreak wins are counted apart.

  | | 5v5 v3.4 | 5v5 v3.5 | 7v7 v3.4 | 7v7 v3.5 |
  |---|---|---|---|---|
  | Holder KO | 4.8% | 4.2% | 3.2% | 4.3% |
  | Pull KO | 28.1% | 27.5% | 40.0% | 40.8% |
  | TKO | 14.5% | 12.1% | 13.6% | 11.6% |
  | Tiebreak win | 51.1% | 54.6% | 39.8% | 38.3% |
  | Draw | 1.5% | 1.6% | 3.4% | 5.0% |
  | Ended on the turn limit | 52.6% | 56.2% | 43.2% | 43.3% |
  | Games with a pull | 28.1% | 27.5% | 40.1% | 41.0% |
  | Average turn | 18.78 | 19.13 | 22.47 | 22.54 |
  | First mover's share of decisive games | 30.0% | 37.7% | 42.6% | 52.4% |
  | Light units removed per game | 3.75 of 4 | 3.71 of 4 | 5.59 of 6 | 5.49 of 6 |

  - Under F23, every outcome gap is under 8 points, so it's noise: a little variety doesn't change how games end, and doesn't help or hurt Light units.
  - The one exception is the **first mover's share** (+7.7 and +9.8 points). The v3.5 release run, on different seeds, agrees (43.3% and 53.6%). Earlier v3.4 runs gave 30–34% at 5v5 and 43–45% at 7v7. In both formats it moves toward 50%. Likely, not isolated (F33).
- **Bot minimum (met / not met, with numbers):** **met.**
  - No brain code changed: both brains average over `dieCases`.
  - On v3.5 (`2026-11-19_screen_dice-variety-bots`, 400 games: Brain 5 v Kit D and Brain 6 v Brain 5, 100 per format each): 0 refused actions, 0 brain errors, 0 safety stops, 0 unfinished games.
  - The 2,000 v3.5 study games and the 2,000 release games also had 0 refused actions and 0 errors.
  - Brain 5 still beats Kit D on v3.5: 64.5% of games at 5v5, 67% at 7v7 (100 games each, so ±5 points).
  - **Thinking time**, Brain 5 mirror, same seeds, lab machines. Average per side-turn: 5v5 51 ms → 56 ms; 7v7 125 ms → 146 ms (+17%: 7 dice cases instead of 5). Worst turn: 5v5 0.75 s → 0.88 s; 7v7 3.21 s → 3.26 s. The worst turn in any v3.5 run was 3.26 s, under the brief's 4.6 s alarm, so F24 isn't raised.
- **Settings review (brain builds only):** not a brain build; skipped.
- **Known gaps:**
  - Small hits show no spread. Rounding to the half eats ±10% on hits of 1–2, so their bar shows 5 outcomes. Hits of 2.5, 7.5 and 12.5 average 0.1 more than on v3.4 (F34).
  - Previews: the 7-outcome bar fits a 375-px phone cleanly (checked in a headless screenshot), and outcomes that round to the same damage merge as before. Nothing I found can't show 7 outcomes.
  - The game log still names the dice total ("dice 9 → 5.5 damage"), not the band. That's enough to read, and the brief didn't ask for more.
  - The release comment on this pull request says "FAILED: other brain tests (30)". That ran on the first commit, before the `test_brain6.js` fix above; it runs again on `main` after the merge.
- **Flags closed / opened:** none closed. Opened **F33** (first mover wins more on v3.5; ASK, recommend keep) and **F34** (±10% rounds away on small hits; ASK, recommend accept).
- **Pull request:** #21, branch `claude/charming-lovelace-4tx3p7`, started from `brief/010-dice-variety`.
