# Brief 028 — Arrow Storm 1.5 times (rule set v3.10)

| | |
|---|---|
| Game version | **YY** (a rule change). Code takes the number at its last sync before Ready for review |
| Lane | Rules |
| Rule set | New preset **v3.10**: a copy of v3.9 with `specials.arrowStorm.mult` 1.5 (was 2). If another preset lands first, take the next free id and say so in the Report |
| Date | 2026-11-23 |
| Goal | Arrow Storm stops removing a full Light Ranged in one shot: 1.5 times a normal shot, still ignoring Dodge, in every format |
| Branch | Any branch your session may push to, started from `brief/028-arrow-storm` |
| Flags | Builds the Editor's ruling on F022-9 (Arrow Storm half of it; first-turn Command stays as it is). Evidence for F39 (move order under specials) and F12 (first mover's share) |
| Waits on | none |
| Order | Can start now. Must merge **before 012 Cavalry**, which copies this preset as v3.11 (the Editor, 23 Nov). Runs beside 020 and 026: 020 measures on whatever is newest and its Storm grid is sim-only, 026 is screen only. Rule changes go one at a time, so no other rules build runs beside it |

## Context
Game Laws 6.17, changed 23 Nov: Arrow Storm (Light Ranged's special) is 1.5 times a normal shot in every format, ignoring Dodge, level with Bullseye. At 2 times it deals 14 to a Light Ranged with 12 health, so the second mover's archer removes the first mover's archer in one shot from range; the Editor saw this in a human-vs-human game on 22 Nov and the lab shows it too (brief 022 Report, F022-9). FD49-3 on v3.9 with Brain 8 mirrors (sim-only, 1,000 games each) put the first mover's share of decisive games at 49.4% in 7v7 (first turn 6) and 56.5% in 5v5 (Command 8) with Storm 1.5 times, against 30 to 35% and about 58% today. First-turn Command does **not** change (Game Laws 2.9): equal against reduced first-turn Command is measured in the Cavalry build. The UC rules, fields and routes are v3.9's.

## Scope
In: preset v3.10 (one number changed); its tests; the baseline run; the bot minimum check; the special's description and preview showing 1.5.

Out: any change to v3.9 or older presets; first-turn Command; any other special; per-format Storm numbers (one rule everywhere, the Editor, 20 Nov); bot tuning (brief 020 owns the brain work).

## What to build
1. **Preset v3.10** = deep copy of v3.9, id `v3.10`, name `v3.10 (2026-11-23)`, note "v3.9 with Arrow Storm 1.5 times a normal shot (was 2), still ignoring Dodge". `specials.arrowStorm.mult` = 1.5. It becomes the newest preset, so the new-game default. Nothing else differs.
2. **Everything else Arrow Storm does stays as it is:** warm-up and firing (6.16), range, target rules (never a flag hex), ignores Dodge, the Evade preview when fired from an adjacent hex, brace and every other modifier applied exactly as for 2 times; only the multiplier changes. Damage stays in half points (7 × 1.5 = 10.5 before modifiers and dice); rounding is for display only.
3. **On screen:** the special's description reads "1.5 times a normal shot. Dodge doesn't count." on v3.10 and "Twice a normal shot. Dodge doesn't count." on older presets (the text already comes from the number, `board/ui.js`; check both). The attack preview's numbers come from the engine. No new words, no layout change.
4. **Replay:** v3.10 games record their preset id as usual, so every older match replays exactly.

## Rules it touches
Each becomes a test on v3.10, and each composes the same way it did at 2 times (a test that the only difference from v3.9 is the multiplier):
- 6.16 warm-up and firing, including re-warm, the warm-up turn having no attack, pull or brace, and firing from a held flag (4.5).
- 6.17 targets: never a flag hex (4.9 flag block on the line of fire).
- Dodge ignored (3.10), the Evade preview and Evade after a non-kill (6.5).
- Brace reduction and Light brace benefits on the target (3.12, 3.14), set spear interplay when the Light Ranged is adjacent (3.13).
- Volley's half when an enemy is adjacent (3.11) and Reload on a following turn, if they apply to Storm today: whatever v3.9 does, v3.10 does.
- Half-point edges: a Light Ranged on 10.5 or less is removed by a clean Storm on v3.10; on exactly 12 it survives a clean Storm with no modifiers (fails on v3.9, passes on v3.10).

## Bot minimum
The bot reads Arrow Storm's value from the engine, so it should adapt by itself. Prove it, Brain 8 mirrors on v3.10, 400 seeded games per format (balanced 5v5 and 7v7):
- Arrow Storm is still warmed up and fired: firings per game and kills per firing, beside the same numbers on v3.9 on the same seeds.
- Warm-ups that end unfired (lapsed), per format, v3.9 against v3.10. If they rise by more than half, open an `ASK` in `flags/028.md` with an example game and turn: a Storm that is no longer worth warming is a brain question for brief 020, not something to fix here.
- No illegal action over 30 seeded games per format.

## Measurements
Brain 8 mirrors (the default), balanced, sides and move order swapped evenly, same seeds for v3.9 and v3.10, tiebreak wins counted apart. The release run can carry it; otherwise one overnight order.
- **Baseline table** at 5v5 and 7v7, v3.9 against v3.10, 1,000 games each: holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games.
- **The archer duel:** which side loses its Light Ranged first (first mover, second mover, neither), and Storm kills per firing.
- **Compare with FD49-3:** the 7v7 first-mover share should land near 49% and 5v5 near 56%; say if it doesn't, and why if it can be seen (likely, not isolated, unless a controlled run shows it).

## Must not change
- Every existing preset, v3.9 included, plays and replays identically (paste the hashes).
- Every brain plays exactly as before on older presets (`sims/brainhash.js` hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes, and new `test_v310.js` is in `checks`.
- `regress_engine.js` hashes for every preset before v3.10 match main.
- `test_invariants.js` covers v3.10.
- The half-point tests above fail on v3.9 and pass on v3.10.

## The Editor's hands-on check
Play one human-vs-human 7v7 on v3.10. Warm up and fire Arrow Storm at a full-health Light Ranged: it should survive on about 1.5 to 2 health (depending on the dice), and the description should say 1.5 times.

## Report back
The standard Report, the baseline table, the archer-duel numbers and the bot minimum. In plain words:
- Does the first mover still lose its archer first?
- Did 7v7 and 5v5 move to where FD49-3 said they would?
- Is Arrow Storm still worth warming up for the bot, in each format?

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
