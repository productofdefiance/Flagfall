# Brief 028 — Arrow Storm 1.5 times, minimum damage 0.5 (rule set v3.10)

| | |
|---|---|
| Game version | **YY** (a rule change). Code takes the number at its last sync before Ready for review |
| Lane | Rules |
| Rule set | New preset **v3.10**: a copy of v3.9 with `specials.arrowStorm.mult` 1.5 (was 2) and `game.minDamage` 0.5 (was 1). If another preset lands first, take the next free id and say so in the Report |
| Date | 2026-11-23 |
| Goal | Arrow Storm stops removing a full Light Ranged in one shot: 1.5 times a normal shot, still ignoring Dodge, in every format; and no hit, pull or special is rounded up to 1 any more (minimum 0.5) |
| Branch | Any branch your session may push to, started from `brief/028-arrow-storm` |
| Flags | Builds the Editor's ruling on F022-9 (Arrow Storm half of it; first-turn Command stays as it is) and the minimum-damage lock (Game Laws 3.2, 23 Nov). Evidence for F39 (move order under specials) and F12 (first mover's share) |
| Waits on | none |
| Order | Can start now. Must merge **before 012 Cavalry**, which copies this preset as v3.11 (the Editor, 23 Nov). Runs beside 020 and 026: 020 measures on whatever is newest and its Storm grid is sim-only, 026 is screen only. Rule changes go one at a time, so no other rules build runs beside it |

## Context
Game Laws 6.17, changed 23 Nov: Arrow Storm (Light Ranged's special) is 1.5 times a normal shot in every format, ignoring Dodge, level with Bullseye. At 2 times it deals 14 to a Light Ranged with 12 health, so the second mover's archer removes the first mover's archer in one shot from range; the Editor saw this in a human-vs-human game on 22 Nov and the lab shows it too (brief 022 Report, F022-9). FD49-3 on v3.9 with Brain 8 mirrors (sim-only, 1,000 games each) put the first mover's share of decisive games at 49.4% in 7v7 (first turn 6) and 56.5% in 5v5 (Command 8) with Storm 1.5 times, against 30 to 35% and about 58% today. First-turn Command does **not** change (Game Laws 2.9): equal against reduced first-turn Command is measured in the Cavalry build. 

Second change, locked the same night (Game Laws 3.2, Round): every hit, pull and special does at least **0.5**, the smallest half point, instead of 1. It rides in this build because it almost never applies: in 20 bot games per format on v3.9 (design chat's session check, standard brain) the 1-point floor raised 2 of 945 normal attacks, both from 0.5, so it can't move this build's Storm numbers enough to measure. It still gets its own test and its own count. The UC rules, fields and routes are v3.9's.

## Scope
In: preset v3.10 (two numbers changed); its tests; the baseline run; the bot minimum check; the special's description and preview showing 1.5.

Out: any change to v3.9 or older presets; first-turn Command; any other special; per-format Storm numbers (one rule everywhere, the Editor, 20 Nov); bot tuning (brief 020 owns the brain work).

## What to build
1. **Preset v3.10** = deep copy of v3.9, id `v3.10`, name `v3.10 (2026-11-23)`, note "v3.9 with Arrow Storm 1.5 times a normal shot (was 2), still ignoring Dodge, and minimum damage 0.5 (was 1)". `specials.arrowStorm.mult` = 1.5 and `game.minDamage` = 0.5. It becomes the newest preset, so the new-game default. Nothing else differs.
2. **Everything else Arrow Storm does stays as it is:** warm-up and firing (6.16), range, target rules (never a flag hex), ignores Dodge, the Evade preview when fired from an adjacent hex, brace and every other modifier applied exactly as for 2 times; only the multiplier changes. Damage stays in half points (7 × 1.5 = 10.5 before modifiers and dice); rounding is for display only.
3. **On screen:** the special's description reads "1.5 times a normal shot. Dodge doesn't count." on v3.10 and "Twice a normal shot. Dodge doesn't count." on older presets (the text already comes from the number, `board/ui.js`; check both). The attack preview's numbers come from the engine. No new words, no layout change.
4. **Minimum damage 0.5.** Every place the engine uses `minDamage` (normal hits after the roll and Dodge, specials, pulls) uses 0.5 on v3.10, through the same number; the bot's estimate (`board/bot.js`) reads the same number. Nothing shows a hit of 0 on v3.10. The Options screen's "Minimum damage" line shows the preset's value.
5. **Replay:** v3.10 games record their preset id as usual, so every older match replays exactly.

## Rules it touches
Each becomes a test on v3.10, and each composes the same way it did at 2 times (a test that the only difference from v3.9 is the multiplier):
- 6.16 warm-up and firing, including re-warm, the warm-up turn having no attack, pull or brace, and firing from a held flag (4.5).
- 6.17 targets: never a flag hex (4.9 flag block on the line of fire).
- Dodge ignored (3.10), the Evade preview and Evade after a non-kill (6.5).
- Brace reduction and Light brace benefits on the target (3.12, 3.14), set spear interplay when the Light Ranged is adjacent (3.13).
- Volley's half when an enemy is adjacent (3.11) and Reload on a following turn, if they apply to Storm today: whatever v3.9 does, v3.10 does.
- Minimum damage: a hit, a pull and a special whose damage after the roll, Dodge and brace comes to 0.5 deal 0.5 on v3.10 and 1 on v3.9 (each test fails on v3.9 and passes on v3.10); one that comes to 0 deals 0.5 on v3.10.
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
- **Minimum damage:** on v3.9 and v3.10, the number of normal attacks, pulls and specials where the floor raised the damage, out of all of each, per format. Count real actions only, not the bot's look-ahead (the session check counted the planner's trial hits until it was restricted to the real game).
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
Play one human-vs-human 7v7 on v3.10. Warm up and fire Arrow Storm at a full-health Light Ranged: it should survive on about 1.5 to 2 health (depending on the dice), and the description should say 1.5 times. Options shows Minimum damage 0.5.

## Report
*Filled in by Claude Code, 24 Nov 2026. Game version **v3.19.00 · Build 24** (set at the 27 Nov sync; Brief 026 took v3.18.00, Build 23). Branch `claude/gallant-hawking-3wc3ve`, started from `brief/028-arrow-storm`.*

**In plain words**
- **Does the first mover still lose its archer first?** At 7v7, no: the first mover lost its Light Ranged first in 58.1% of games on v3.9 and 44.9% on v3.10. At 5v5 it flips the other way: on v3.9 the first mover's Storm removed the second mover's archer first in 82.8% of games; on v3.10 the first mover loses its archer first in 75.6%, but now mostly to ordinary fighting, because the fighting starts on turn 1 instead of turn 4.
- **Did 7v7 and 5v5 move where FD49-3 said?** 7v7 yes: 49.2% of decisive games to the first mover (FD49-3: 49.4%). 5v5 no: 41.9% (FD49-3: 56.5%), outside F12's 45–55%. FD49-3's 5v5 number was measured at Command 8; v3.10's 5v5 plays Command 10, first turn 6, so the prediction didn't apply. Likely the cause, not isolated (F028-2).
- **Is Arrow Storm still worth warming up for the bot?** Yes in both formats. It deals about 10.5 a firing against about 5.5 for the normal hit it replaces. It now kills on 4% of firings at 5v5 (85% on v3.9) and 45% at 7v7 (80%). At 5v5 the bot warms it up less (2.00 to 1.19 a game) and 88 warm-ups in 1,000 games now lapse (none on v3.9): raised for brief 020 as F028-3.
- **How often did the minimum damage apply?** On v3.10 it raised 27 of 20,646 normal attacks at 5v5 and 38 of 24,562 at 7v7 (about 0.15%), no pulls and no special hits. On v3.9 the 1-point floor raised 43 of 15,845 and 113 of 23,380. **Surprise:** on v3.10 it still applies at all: those are hits that Armor and Brace cut to 0, which now deal 0.5. Hits of exactly 0.5 (129 and 131) now stay 0.5.

- **What's in:**
  - Preset **v3.10** (`board/data.js`) = v3.9 with `specials.arrowStorm.mult` 1.5 and `game.minDamage` 0.5; the newest preset and new-game default. No engine, bot or screen code changed: Arrow Storm's value, the description ("1.5 times a normal shot. Dodge doesn't count."), the preview, the bot's estimate and the Options line all read the two numbers.
  - `board/tests/test_v310.js` (78 checks, in `checks` at 4 seeded games per format): every rule the brief lists, each checked against v3.9 in the same position (only the multiplier differs); half-point edges (12 survives on 1.5, 11 on 0.5, 10.5 and less removed); minimum damage for a hit, a pull and a special at 0.5 and at 0; the description on every preset; and seeded Brain 8 games with every action legal and no hit below 0.5. With v3.10 set back to v3.9's two numbers, 25 of the 78 fail.
  - New lab measure `mindamage` (`sims/lab/measures.js`): real attacks, pulls and special hits, how many the rule set's floor raised, and how many came to under 1 before it.
  - Run `storm-v310` (study, 4,000 games): `results/v3.18.00/2026-11-24_study_storm-v310/`.
- **Anything beyond the brief, and why:**
  - `test_brain8.js` 3b set a Heavy Melee on 7 health, exactly what a 2 times Storm removes; on the newest rules it no longer was. Its health now comes from the Storm's own hit (6 on v3.10); Brain 8 still braces. Brain 8 is unchanged.
  - `test_route.js` and `test_fields.js` assumed v3.9 was the newest preset; now they don't.
  - The first lab run was cancelled by a push but still filed an empty result and moved the order to done (F028-1); I removed the empty folder and queued the order again.
- **Checks run and results (paste regression hashes):** every check in `README.md` passed in this session, including `test_invariants.js 30` on v3.10 (4,883 actions, 0 refused, 0 problems) and the red-team invariants. `test_v310.js 30` (the brief's 30 games per format): 0 illegal actions, 234 specials fired, 1,601 rolled hits and pulls, none below 0.5. `regress_engine.js` against the board before this change, 3 games: every preset before v3.10 prints the same hash (`diff` empty):
  `match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0 · v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250 · v3.5 fca989aecfaf21c9 · v3.6 a6bf327b54f7d5a1 · v3.7 dd3c27d9dc9aafbb · v3.8 022a298c49a02540 · v3.9 b3c2d4464b363ba0`.
  `sims/brainhash.js` on every preset except v3.10, before and after, identical: `brain8 61ba471b57d2bf39 · brain9 a42c87df57b5cd87 · standard 93fbbf839f2950d7`. The other brains were skipped (all brains on all presets ran out of session time); no brain or engine code changed, and the regression hashes cover play.
- **Baseline table (rule changes only):** Brain 8 mirrors, balanced, 1,000 games each, same seeds per format, sides and move order swapped evenly (GitHub lab run, not a session run).

  | | Holder KO | Pull KO | TKO | Tiebreak win | Draw | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
  |---|---|---|---|---|---|---|---|---|---|
  | 5v5 v3.9 | 4.6% | 42.2% | 8.9% | 37.5% | 6.8% | 44.3% | 42.2% | 18.5 | 53.5% (557) |
  | 5v5 v3.10 | 6.4% | 58.7% | 11.5% | 21.4% | 2.0% | 23.4% | 58.7% | 14.4 | 41.9% (766) |
  | 7v7 v3.9 | 4.3% | 65.8% | 19.0% | 10.1% | 0.8% | 10.9% | 65.8% | 15.5 | 44.6% (891) |
  | 7v7 v3.10 | 4.8% | 63.9% | 18.1% | 11.6% | 1.6% | 13.2% | 63.9% | 16.3 | 49.2% (868) |

  Mirror A/B splits are within noise (at most 1.6 standard errors). Every game with a pull ended in a pull KO. At 5v5 the first attack comes on turn 1.3 on average (4.3 on v3.9).

  **The archer duel** (whose Light Ranged is removed first): 5v5 v3.9 first mover 17.2%, second 82.8%, neither 0; v3.10 first 75.6%, second 24.4%. 7v7 v3.9 first 58.1%, second 41.9%; v3.10 first 44.9%, second 55.1%. Storm kills per firing: 5v5 0.85 to 0.04; 7v7 0.80 to 0.45. On v3.9 at 5v5 the first unit lost was an archer to a Storm in all 1,000 games.

  **Minimum damage** (raised by the rule set's floor / all, real actions only): attacks 5v5 43/15,845 (v3.9) and 27/20,646 (v3.10); 7v7 113/23,380 and 38/24,562. Pulls 0 of 423, 589, 663, 647. Special hits 0 of 2,839, 2,053, 5,105, 5,215.
- **Bot minimum (met / not met, with numbers):** met, with one open question. Arrow Storm, per game, v3.9 to v3.10: 5v5 warmed 2.00 to 1.19, fired 1.17 to 1.09, lapsed 0 to 0.088; 7v7 warmed 2.08 to 1.73, fired 1.30 to 1.34, lapsed 0.31 to 0.33. Kills per firing as above; damage per firing 10.7 (5v5) and 10.5 (7v7) against a normal hit of 5.7 and 5.5. Lapses rose by more than half at 5v5 (from 0), so F028-3 is open for brief 020, with an example game. No illegal action in 30 seeded games per format (0 of 60 games).
- **Settings review (brain builds only):** n/a
- **Known gaps:** brain hashes checked for Brain 8, Brain 9 and Standard only (above). The cause of the 5v5 swing (Command 10 instead of FD49-3's 8; the bot no longer holding back) is likely, not isolated.
- **Equal Command screen (27 Nov, `command-v310-screen`, 200 games each, same seeds, lab run on GitHub):** 7v7 first turn 6 gives the first mover 47.9% of decisive games; equal first turn 10 gives 67.3%, so 7v7 keeps 6. At 5v5 the first-turn number makes no difference: Brain 8's first mover never spends more than 5 Command on turn 1, so every pair played identical games (33.3% at Command 10, 57.4% at Command 8, with turn-limit games 23.5% to 39.0%). No setting earns an overnight confirm (F028-2, F028-4).
- **Flags closed / opened:** opened F028-1 (lab files a cancelled run), F028-2 (5v5 first mover at 41.9%), F028-3 (5v5 Storm lapses, for brief 020), F028-4 (5v5 needs a move-order lever that binds). F022-9 was already closed by the Editor's ruling; this build carries it out. Evidence for F12 and F39 is in F028-2 and the tables above.
- **Pull request:** #65.
