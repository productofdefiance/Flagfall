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

## Report back
- The baseline table, v3.5 next to v3.4.
- The thinking-time comparison.
- Anything in the previews that can't show 7 outcomes cleanly.

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
