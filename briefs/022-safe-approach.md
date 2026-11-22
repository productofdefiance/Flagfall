# Brief 022 — Brain 8: holder joins, safe approach, respect for a warmed special, and an opening plan

| | |
|---|---|
| Game version | Next free **YY** at merge (a new brain is a real change), ZZ = 00 |
| Lane | Bot (with Lab measures) |
| Rule set | none (bot only; no rule change). Measured on the newest rule set on `main` at build time, which should be brief 014's (one field per format) |
| Date | 2026-11-20 |
| Goal | A brain that stops walking into the enemy's first strike, steps out of (or braces against) a warmed special, finishes games with its holder like Brain 7, and has one opening slider per move order; and the numbers that tell the Editor whether 5v5's move-order problem (F39) is the bot or the rules |
| Branch | Any branch your session may push to, started from `brief/022-safe-approach` |
| Flags | F41 (the bot ignores a warmed special) and F47 (next brain = Brain 5 + B4 only; the Editor said yes, 20 Nov): close both. F48: the Editor decided 20 Nov to keep Brain 5 as the default opponent with Brain 7 in the list; close it with that answer. F39 (5v5 move order) as evidence |
| Waits on | 014 |
| Order | **After brief 014 is merged**, so it is measured on the new 5v5 field. No rule change, so it runs beside the rules chain (017, 018, 012). Brief 020 (victory values) is built on top of this brain and waits for it |

## Context
Three findings from 20 Nov point at the same brain work:
- **F41 (brief 011, playtest round 2):** the bot ignores a warmed special. Of units inside its reach, only 19% (7v7) to 46% (5v5) step out, almost none brace (7v7: 102 braced against 6,053 unbraced), and about 29% of the units left in reach are hit by it next turn.
- **F39 is mostly the approach, not Arrow Storm.** The design chat's sim check (sim-only, 250 balanced 5v5 Brain 5 mirrors per version, same seeds, v3.7, old field): the first mover wins 18% as built, 81% with Arrow Storm ×1.5 alone, 6% with equal turn-1 Command, and **still 18% with Arrow Storm removed**. Whoever keeps its Light Ranged wins 82–93% in every version. With Arrow Storm, the second mover's archer kills the first mover's on turn 2 (107 of 120 games traced); without it, the first mover's archer still dies first, on turn 3, to a Heavy Melee, Pick Off or a normal shot. Reading, likely and not isolated: the first mover walks into the second mover's reach first and is struck first.
- **Brief 014's new fields changed 5v5 (F50, merged 20 Nov as v3.12.00, rule set v3.8).** Brain 5 mirrors, 1,000 games, v3.7 → v3.8: the 5v5 first mover's share of decisive games went from 3.2% to 58.0% (the F39 collapse is likely gone: the smaller deploy area and 8-hex gap keep Arrow Storm out of early reach; likely, not isolated), but **5v5 games ending on the turn limit rose from 35.1% to 61.9%** and draws from 1.1% to 6.4%. 7v7 didn't change, and **its first mover still wins only 31.4% of decisive games**. So on the new fields the targets are: 5v5 stalls (F50), and 7v7 move order (F39's problem now lives there).
- **F47 (brief 019):** of Brain 7's five behaviours, B4 (holder joins the storm, with its race check) does nearly all the good: with B1 alone it cuts Brain 5 mirror stalls from 57.9% to 26.9% (5v5) and 40.4% to 17.8% (7v7). B1 costs about 4 points against Brain 5, B2 makes stalls much worse (73.8%, 65.8%), and B3 and B5 move nothing. Code recommends a next brain of Brain 5 + B4 only.

The Editor also wants an opening plan the bot can be coached on, set separately for going first and going second, like White and Black in chess (Ideas Log, Computer opponent: "Opening plans in the coaching kit", 20 Nov). He doesn't know the right opening yet; the lab should find it. This brief builds the first slider (tempo); the shape sliders (centre vs wings) wait for Cavalry.

## Scope
In:
- **Brain 8** (`brain8`, short form Br8, "Brain 8 (safe approach)" on screen): a copy of **Brain 5** plus four behaviours, each on its own switch in `BRAIN_8.approach` (1 on, 0 off), with plain labels in a new table on the Opponent screen. With all four off, Brain 8 plays exactly like Brain 5 (same `sims/brainhash.js` hash on every preset).
- New lab measures (below).
- The runs below, the F39 screen, and the settings review.

Out:
- Any rule change, and any change to special sizes. The F39 size screen below is sim-only: it plays changed numbers in the lab and changes nothing on the board.
- Brain 7's B1, B2, B3, B5 and its `stormLead` (F47: they cost wins or do nothing).
- Victory values (brief 020 builds them on top of Brain 8).
- The opening shape sliders (centre vs wings, flank with Cavalry): after brief 012.
- Changing the default opponent. Brain 5 stays the default unless the Editor decides otherwise after this Report (F48).

## What to build
**First, find out why.** Before writing any behaviour, trace 10 balanced 5v5 Brain 5 mirrors on the newest rule set where the first mover's Light Ranged dies first, and 10 where a unit stays inside a warmed special's reach unbraced and is hit. For each, say which value term made the plan pick the exposed hex over a safe one (advance or flag value, threat estimate missing something, the special's extra damage under-counted, or something else). Put the table in the Report. Build A1 and A2 to fix what the traces show. If the traces show the brief's idea is wrong, stop and raise an ASK.

1. **Copy Brain 5 as Brain 8.** Brains 5, 6 and 7 stay frozen.
2. **B4, holder joins (from Brain 7).** Brain 7's B4 with its race check (`race7`), switchable on its own without B1 (the missing setting F47 names). Same behaviour, same numbers as in Brain 7.
3. **A1, safe approach.** Don't end a turn where an enemy unit gets the first strike on ours, unless the trade favours us: a unit that ends its turn inside an enemy's reach (attack or special, after movement), without having struck that turn and without a friend able to answer the striker next turn, counts the expected damage of that first strike as already taken, times `firstStrike` (start at 1). Code may build it another way if the traces point elsewhere; say why.
4. **A2, respect a warmed special.** For each enemy unit with a warmed special, the units in its reach next turn weigh its full special damage (the multiplier, Arrow Storm's lack of Dodge, Arc Hit's extra targets) at `warmedRespect` (start at 1): stepping out of reach, bracing where the brace saves the unit (damage after Brace below its HP), or striking the warmed unit first should win when it beats staying. Brain 5's `model.special` already counts the enemy's warmed specials at 0.5; say how A2 relates to it, and keep `model.special` as it is.
5. **A3, opening tempo, one slider per move order.** `tempoFirst` and `tempoSecond`, each from −1 (sit back: hold near the deploy rings, let the enemy come) through 0 (Brain 5 as it is) to +1 (shock attack: close fast and strike first). The opening lasts while no unit has taken damage and no flag has been pulled (read from the board each turn, so nothing is carried between turns and replays stay exact). Under the slider the brain scales its advance and flag-approach values, and A1's `firstStrike`, during the opening only. Ships at 0 and 0; the sweep below picks the values.
6. **Watchable.** Every tested setting replays from its watch link (Brain 7's `n=brain8:tempoFirst=-1` form, brief 019). Old links read the same.

## Rules it touches
None change. Brain 8 must model these correctly and pick only legal actions: specials and the warm-up (6.16, 6.17), Brace and its 2 less (1.x, 6.16), Evade (6.5), tackle (6.6), set spear (3.13), the flag block (4.9), the pooled flag and holder (4.2 to 4.6), Mark (3.8), Command, Stamina, Reload, Support, the turn limit and tiebreak (2.7), and the new fields and deploy rings (2.4, 2.5, brief 014).

## New lab measures
Name the columns as below, or say in the Report what changed and why.
1. **`first_lost_side`, `first_lost_turn`, `first_lost_card`, `first_lost_by`**: the first unit removed in the game: its side (first or second mover), turn, card, and what removed it (the attacker's card and attack, special or normal).
2. **`first_lr_lost_side`, `first_lr_lost_turn`**: the same for the first Light Ranged removed (the archer duel in F39).
3. **`first_contact_turn`, `first_strike_side`**: the first side-turn on which any unit could attack an enemy, and which side made the first attack.
4. Brief 011's `specialsafety` columns (stepped out, stayed braced, stayed unbraced, hit next turn) stay on every run; report them for every arm.

## Measurements
All with `tests/rng.js`, tiebreak wins counted separately, same seeds across arms. Screen first at about 200 games per side, then confirm overnight at 1,000 per format (F23). A gap under about 4 points is never evidence. Balanced lineups unless named.
- **Baseline:** Brain 5 mirrors, 5v5 and 7v7, on the newest rule set (014's fields). Report the first mover's share (of all games and of decisive games) next to the old field's numbers.
- **One at a time,** mirrors and against Brain 5, both formats: B4 alone (F47's brain); B4 + A1; B4 + A2; B4 + A1 + A2; all four with A3 at its best value. Each behaviour added on the same deals, so its effect is isolated.
- **A3 sweep, opening tempo:** `tempoFirst` and `tempoSecond` each at −1, 0, +1 (9 pairs), Brain 8 mirrors with B4 + A1 + A2 on, 5v5 and 7v7, screen at 200 per pair, then the best two or three pairs at 1,000. Report the first mover's share for every pair. The questions: is there an opening for each side that brings 7v7 within F12's target (first mover 45–55% of decisive games, 31.4% today) without pushing 5v5 out of it (58.0% today)? And does sitting back raise 5v5 stalls (61.9% today)?
- **Head-to-head:** Brain 8 (best settings) against Brain 5, 1,000 games per format, balanced and all-Light, sides and move order swapped half the time.
- **For every arm:** the full baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), brief 016's stall columns, brief 019's lead measures, the specials measures (warm-ups, fired, lapsed, unit removed while warm), and the new measures above.
- **F39 screen (sim-only, no rule change):** with Brain 8 at its best settings in mirrors, 5v5 and 7v7, 200 per side: Arrow Storm ×2 (as built), ×1.75, ×1.5 (only Arrow Storm changed), and no warm-up on either side's first turn. Report the first mover's share, games ended on the turn limit, and Arrow Storm's kills per firing for each. Confirm at 1,000 only the versions that look promising. This tells the Editor which special sizes to pick once the bot approaches safely; changing them is a later rules brief.
- **Speed:** average and worst time per turn next to Brain 5's. Flag it if the worst turn rises above 4.6 s. Any search cap counts plans examined, never seconds (F24).

## Bot minimum
This build is the bot work. It is met when every measurement has a number and these test positions pass, each showing the model's reasoning:
1. **Don't walk in.** Our Light Ranged can step to a hex in the enemy Light Ranged's reach, or stop one hex short; the enemy can strike first. Brain 8 stops short (A1 on); Brain 5 steps in.
2. **Strike first when it pays.** Same position, but from the forward hex our archer can strike this turn and kill: Brain 8 goes in and strikes.
3. **Warmed Arrow Storm.** An enemy Light Ranged has Arrow Storm warmed; our unit is in its reach. Out of reach is one move away: Brain 8 steps out. No way out, and a brace leaves it alive: it braces. A brace can't save it but our unit can strike the archer first: it strikes.
4. **Holder joins.** The enemy has only its holder left and our race check wins: our holder joins the storm (B4 as in Brain 7).
5. **Opening tempo.** With `tempoFirst` −1, the first mover holds near its deploy rings on turns 1 and 2; with +1, it closes. Both stop applying once a unit has taken damage.
6. **Off is Brain 5.** With all four switches off, Brain 8's hash matches Brain 5's on every preset.

## Must not change
- Every existing preset plays and replays identically.
- Brains 5, 6, 7, Kit A–D, Standard and Easy play exactly as before (`sims/brainhash.js` hashes unchanged).
- The default opponent (Brain 5).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board; `sims/brainhash.js` hashes for every existing brain match.
- Brain 8 with all switches off hashes the same as Brain 5.
- Brain 8 never picks an illegal action over 30 seeded games per format, balanced and all-Light.
- The new measures checked by hand on two saved games each (one where the event happens, one where it doesn't).

## The Editor's hands-on check
1. Play one balanced 5v5 against Brain 8 moving first, and one moving second. Does its archer still walk into yours?
2. Warm up an Arrow Storm in reach of its units. Do they step out, brace or come at your archer?
3. Watch the best and worst opening pairs from the A3 sweep (links in the Report). Does sitting back or attacking look like a plan?

## Report back
The standard Report, every measurement and the trace table. In plain words:
- Why did the bot walk into the first strike, and does Brain 8 stop?
- Does respecting a warmed special save units, and does it cost tempo?
- Is there an opening for each side that fixes 7v7's move order and keeps 5v5 fair? If not, is it the rules (F39), and which special size or rule from the screen helps most?
- Does B4 (holder joins) cut 5v5's turn-limit games on the new field (61.9% for Brain 5, F50), as it halved them on the old one?
- Does B4 alone (F47) keep Brain 7's stall cut without its losses?
- Should Brain 8 become the default opponent? Your recommendation; the Editor decides.
Say whether each cause is isolated or only likely.

---

## Report
*Filled in by Claude Code. Branch `claude/epic-carson-k4ieor`, started from `brief/022-safe-approach`.*

### In plain words
- **Why did the bot walk into the first strike?** Not because it under-rates the enemy's normal shot. In the traces (below) the unit almost always ended its turn in reach because it **warmed up its own special there**, inside reach of an enemy special that was already warm, and was removed before it could fire. Brain 5 counts its own warm-up (`model.special` × the edge over a normal hit) as if the unit will live to fire it: +4.5 to +6.5 value points in the traced turns, more than the extra risk it books (`model.risk` × the expected hit, which the greedy threat count often puts on another unit anyway). Likely, not isolated. In most traces a friend could answer the striker, so A1 as the brief wrote it would not have fired at all.
- **Does Brain 8 stop?** With A1 or A2 switched on, yes in the test positions (Bot minimum 1 to 3 pass). But both **cost wins against Brain 5** in the screen, so Brain 8 ships with them off (F022-1). The narrower fix the traces point to (discount our own warm-up by its chance of being removed first) is the missing setting from the settings review.
- **Does respecting a warmed special save units, and does it cost tempo?** It saves a few (units hit next turn by a warmed special, against Brain 5, 5v5: 508 with A2 against 581 without) and costs a lot of tempo: warmed specials lapse 1.5× (5v5) to 9× (7v7) as often, because both sides step out of reach and nobody fires. Against Brain 5, B4+A2 won 64 and lost 104 of 200 (5v5).
- **Does B4 cut 5v5's turn-limit games?** Yes. Confirmed at 1,000 games on the same deals: Brain 8 mirrors ended on the turn limit in **46.5%** of 5v5 games against **64.2%** for Brain 5 mirrors (F50's 61.9% was a different seed set), and **12.5%** against **40.3%** in 7v7. Isolated: B4 is the only behaviour on, and it changes nothing until one side has only its holder left (the first-loss and specials columns are identical in both arms).
- **Does B4 alone keep Brain 7's stall cut without its losses?** Yes, but it doesn't make the bot stronger. At 1,000 games against Brain 5 it is **even**: 5v5 469 won (256 by KO or TKO, 213 on tiebreak), 462 lost (195, 267), 69 drawn; 7v7 475 won (417, 58), 511 lost (315, 196), 14 drawn (a 3.6-point gap: noise, F23). It finishes games instead of winning them on the clock: more KO wins, more tiebreak losses. The screen's 106 to 80 in 5v5 didn't hold up at 1,000. All-Light against Brain 5: 5v5 479 to 509, 7v7 483 to 503 (even).
- **An opening for each side?** One for the second mover, none for the first. Confirmed at 1,000: **first mover even (0), second mover push (+1)** moves 7v7's first mover from 34.7% to **43.7%** of decisive games (F12's target is 45–55%) and leaves 5v5 (57.9%) and stalls unchanged. Brain 8 ships with it. Every pair where the first mover sits back or pushes breaks 5v5 (first mover 64–99%, or 90% draws). Likely, not isolated.
- **Should Brain 8 become the default?** The Editor said yes (21 Nov, F022-5); it is the default in this build. **New evidence since (v3.9 re-measure): it loses to Brain 5 by 5–7.5 points in three of four matchups**, so F022-8 asks again. Original recommendation: because it plays as well as Brain 5 (even at 1,000 games in both formats and both lineups) and finishes far more games: a third fewer turn-limit games in 5v5 and two-thirds fewer in 7v7. It isn't a harder opponent, so it doesn't replace a difficulty step. The Editor decides (F022-5).

### Traces (Brief 022 "first, find out why"; `sims/trace022.js`, Brain 5 mirrors, v3.8)
Finding the brief's case was itself a result: on the new 5v5 field the first mover's archer is the first lost in only 6 of 40 games (34 are the second mover's), and all 6 were trades (it had just fired). So the 10 archer traces are from 7v7, where it happens about half the time, plus the 10 warmed-special traces from 5v5. "Chosen − safe" compares Brain 5's value for the position it chose with the best position the unit could have taken out of every enemy's reach (or out of the warmed special's reach, or braced), scored at the same moment; the terms are the parts of Brain 5's value that made the difference.

| Game (seed) | Format | Unit, turn | Struck that turn | Answered by a friend | Removed by | Chosen − safe | Term that won it |
|---|---|---|---|---|---|---|---|
| NLEP-6JGX-CBNQ | 7v7 | first mover's LR, 2 | no | yes | LR special | 7.10 | own warm-up +6.51 |
| MBZ7-VY2X-CYZP | 7v7 | LR, 2 | no | yes | LA special | 4.50 | own warm-up +4.51 |
| 4KFB-XBYB-42H7 | 7v7 | LR, 2 | no | yes | LR special | 7.87 | own warm-up +7.57 |
| G9TJ-UK82-TN9E | 7v7 | LR, 2 | no | yes | LR special | 4.15 | own warm-up +6.51 (risk −4.76) |
| FUK7-JTEP-YKWB | 7v7 | LR, 2 | no | yes | LR special | 6.47 | own warm-up +6.32 |
| CC7Z-AU5D-779Z | 7v7 | LR, 2 | no | yes | LA special | 4.80 | own warm-up +4.51 |
| 5YRK-P75D-XL7X | 7v7 | LR, 2 | no | yes | LR special | 5.97 | own warm-up +4.51 |
| PXZ2-DYGP-QZ9R | 7v7 | LR, 3 | yes | no | HM attack | 12.50 | a hit landed (material +4.5), risk +5.6 |
| Z9D7-SY82-8NEW | 7v7 | LR, 4 | yes | yes | LR attack | 10.54 | a kill (material +11): a fair trade |
| 6A33-7Z2G-UMRK | 7v7 | LR, 4 | yes | yes | LR special | no safe hex | - |
| NKJB-EBHT-GGN9 | 5v5 | second mover's LR, 1 | warmed up | - | Arrow Storm | 4.31 | own warm-up +6.51 (risk −2.8) |
| WTDQ-8XB8-2N5Y | 5v5 | LR, 1 | warmed up | - | Arrow Storm | 4.31 | own warm-up +6.51 |
| 2Q2T-8LKY-ZS2N | 5v5 | LR, 1 | warmed up | - | Arrow Storm | 4.01 | own warm-up +6.51 |
| RM5G-PY7L-DJBE | 5v5 | LR, 1 | warmed up | - | Arrow Storm | 4.01 | own warm-up +6.51 |
| NKJB-EBHT-GGN9 | 5v5 | LR, 2 | fired | - | Pick Off | 15.44 | it had just removed the enemy archer (+18): a trade |
| WTDQ-8XB8-2N5Y | 5v5 | LR, 2 | fired | - | Pick Off | 15.44 | the same trade |
| 2Q2T-8LKY-ZS2N | 5v5 | LR, 2 | fired | - | Pick Off | 12.91 | the same trade |
| RM5G-PY7L-DJBE | 5v5 | LR, 2 | fired | - | Pick Off | 12.91 | the same trade |
| 2Q2T-8LKY-ZS2N | 5v5 | HA, 6 | no | - | Pick Off | 0.10 | a near tie (stamina +0.5) |
| 2Q2T-8LKY-ZS2N | 5v5 | LM, 7 | struck | - | Arc Hit | 8.36 | a kill (material +10) |

Reading: 11 of the 20 are the own-warm-up case, 7 are trades the value model is right to take, 2 have no safe hex or are a tie. So the brief's idea (an under-counted enemy first strike) is only partly right: what is missing is the chance of being removed before our own special fires. I built A1 and A2 as the brief says (so the Editor can see them measured) and raised the narrower fix as F022-1, rather than stopping the build, because B4 and A3 didn't depend on it.

### Measurements
All on v3.8 (the newest rule set when the runs were queued; brief 017's v3.9 merged afterwards, see Known gaps), balanced unless named, sides and move order swapped evenly, same deals across the arms of a run. Tiebreak wins counted apart. Full tables: `sims/lab/report022.js <run id>`; run folders under `results/v3.13.00/`.

**Screen, one behaviour at a time** (`brain8-screen`, 200 games each). A = Brain 8 with the behaviours named.

| Arm | 5v5 vs Brain 5: won KO / tiebreak, lost KO / tiebreak, draw | 5v5 mirror: turn limit, first mover of decisive | 7v7 vs Brain 5 | 7v7 mirror: turn limit, first mover of decisive |
|---|---|---|---|---|
| Brain 5 mirror (baseline) | - | 56.5%, 55.2% | - | 47.0%, 34.9% |
| B4 | 68 / 38, 39 / 41, 14 | 41.0%, 54.2% | 83 / 17, 54 / 44, 2 | 16.0%, 39.3% |
| B4 + A1 | 41 / 28, 46 / 63, 22 | 36.0%, 34.4% | 75 / 17, 52 / 50, 6 | 13.0%, 48.9% |
| B4 + A2 | 49 / 15, 53 / 51, 32 | 15.5%, 92.3% | 75 / 5, 79 / 29, 12 | 21.5%, 51.0% |
| B4 + A1 + A2 | 58 / 6, 101 / 32, 3 | 90.5%, 100% (21 decisive) | 57 / 9, 80 / 33, 21 | 44.0%, 59.8% |

**Confirm** (`brain8-confirm`, 1,000 games each, Brain 8 with B4 on, A1 and A2 off, tempo 0 and 0; it now ships with tempoSecond +1, see the tempo confirm).

| Matchup | Won KO / tiebreak | Lost KO / tiebreak | Draw | Holder KO | Pull KO | TKO | Turn limit | Games with a pull | Avg turn | First mover: of all / of decisive |
|---|---|---|---|---|---|---|---|---|---|---|
| Brain 5 mirror, 5v5 | - | - | 69 | 4.9% | 22.7% | 8.2% | 64.2% | 22.7% | 20.8 | 47.8% / 61.2% |
| Brain 8 vs Brain 5, 5v5 | 256 / 213 | 195 / 267 | 69 | 5.3% | 29.8% | 10.0% | 54.9% | 29.8% | 19.9 | 47.6% / 59.9% |
| Brain 8 mirror, 5v5 | - | - | 69 | 5.9% | 36.8% | 10.8% | 46.5% | 36.8% | 19.0 | 47.3% / 57.9% |
| Brain 8 vs Brain 5, all-Light 5v5 | 416 / 63 | 194 / 315 | 12 | 12.8% | 30.6% | 17.6% | 39.0% | 31.0% | 14.6 | 40.1% / 42.8% |
| Brain 5 mirror, 7v7 | - | - | 14 | 3.2% | 41.6% | 14.9% | 40.3% | 41.9% | 21.4 | 36.6% / 28.5% |
| Brain 8 vs Brain 5, 7v7 | 417 / 58 | 315 / 196 | 14 | 3.6% | 54.4% | 15.2% | 26.8% | 54.5% | 18.6 | 36.3% / 32.1% |
| Brain 8 mirror, 7v7 | - | - | 14 | 4.8% | 66.9% | 15.8% | 12.5% | 67.0% | 15.7 | 36.6% / 34.7% |
| Brain 8 vs Brain 5, all-Light 7v7 | 442 / 41 | 331 / 172 | 14 | 20.0% | 41.4% | 15.9% | 22.7% | 41.5% | 15.2 | 40.3% / 38.4% |

First mover against the old field (brief 014's numbers): 5v5 first mover took 3.2% of decisive games on v3.7 and 58.0% on v3.8 (F50); here 61.2% for Brain 5 mirrors. 7v7: 31.4% then, 28.5% here. First Light Ranged lost (Brain 5 mirrors): 5v5 first mover 159, second mover 841; 7v7 524 and 476 (F022-4). Warmed specials (Brain 5 mirrors, 5v5): of units in reach at their turn's start, 2,773 stepped out, 759 stayed braced, 8,335 stayed unbraced, 2,862 were hit next turn. Brain 8 as shipped leaves these unchanged (A2 is off).

**A3 sweep** (`brain8-sweep`, 200 games per pair, Brain 8 mirrors; first mover's tempo first; even-even is the screen's B4 mirror on the same deals). First mover's share of decisive games, then games ended on the turn limit.

| Pair | 5v5 | 7v7 |
|---|---|---|
| back, back | 100% (20 decisive), 90.0% | 51.9%, 35.5% |
| back, even | 98.3%, 10.0% | 61.9%, 12.0% |
| back, push | 98.9%, 10.0% | 50.0%, 13.0% |
| even, back | 73.7%, 43.0% | 31.0%, 16.0% |
| **even, even** (shipped) | 54.2%, 41.0% | 39.3%, 16.0% |
| **even, push** | 54.2%, 41.0% | **49.7%**, 10.5% |
| push, back | 64.4%, 27.0% | 23.5%, 8.5% |
| push, even | 86.3%, 30.5% | 26.3%, 12.5% |
| push, push | 84.5%, 22.5% | 51.5%, 14.5% |

In 5v5 the second mover's slider changed nothing at even or push (identical games), likely because the first mover's turn-1 warm-up already sets the duel; not isolated. Sitting back raises 5v5 stalls only when both sit back (90%).

**Tempo confirm** (`brain8-tempo-confirm`, 1,000 games per pair, Brain 8 mirrors, same deals as `brain8-confirm`, whose Brain 8 mirror is even-even).

| Pair | 5v5 first mover of decisive | 5v5 turn limit | 7v7 first mover of decisive | 7v7 turn limit |
|---|---|---|---|---|
| even, even | 57.9% | 46.5% | 34.7% | 12.5% |
| **even, push** (shipped) | 57.9% (the same games) | 46.5% | **43.7%** | 12.1% |
| back, push | 99.0% | 11.6% | 56.9% | 12.2% |

Brain 8 ships with **tempoFirst 0, tempoSecond +1**: it moves 7v7's first mover 9 points towards even (still 1.3 points short of F12's 45%) and changes nothing in 5v5 or in stalls. In 5v5 the second mover's slider plays the same games, likely because its first turn is spent the same way whatever the slider (the archer warms up; nothing else is in reach); not isolated. Sitting back as first mover breaks 5v5 (99%). So the answer to "an opening for each side?": one for the second mover, which nearly fixes 7v7; none for the first mover. The rest of 7v7's gap is likely the rules (F39), not the opening.

**F39 screen** (`brain8-sweep`, sim-only, Brain 8 mirrors, 200 games; ×2 is the confirm's Brain 8 mirror at 1,000).

| Arrow Storm | 5v5 first mover of decisive | 5v5 turn limit | 5v5 kills per firing | 7v7 first mover of decisive | 7v7 turn limit | 7v7 kills per firing |
|---|---|---|---|---|---|---|
| ×2 (as built) | 57.9% | 46.5% | 0.86 | 34.7% | 12.5% | 0.69 |
| ×1.75 | 43.2% | 26.0% | 0.23 | 34.3% | 11.0% | 0.58 |
| ×1.5 | 21.3% | 25.0% | 0.04 | 38.8% | 15.0% | 0.42 |

Reading: a smaller Arrow Storm swings 5v5 towards the second mover (×1.5 overshoots badly) and doesn't move 7v7 at all. So 7v7's move-order problem is not Arrow Storm's size; likely the opening (the sweep's push for the second mover reaches 49.7%) or another rule. ×1.75 is the only size that keeps 5v5 inside 45–55%-ish (43.2%) and it also cuts 5v5 stalls (26.0%); worth a 1,000-game confirm in a rules brief. The "no warm-up on the first turn" arm wasn't played (F022-2). Not confirmed at 1,000 here: none of the three sizes fixes 7v7, which is the open problem.

**Speed** (GitHub machines). Average ms per side-turn, Brain 5 mirror against Brain 8 mirror: 5v5 43 against 46; 7v7 117 against 158. Worst side-turn: 5v5 504 and 411 ms; 7v7 2,497 and 2,544 ms. The worst side-turn in the whole build was **5,634 ms** in all-Light 7v7 (Brain 8 against Brain 5; the measure doesn't say which side's turn it was), above the 4.6 s mark (F022-6). Positions examined, worst side-turn: 4,676 in balanced 7v7 for both brains (Brain 8 adds no plan steps; it scores each position a little more slowly).

### v3.9 re-measure (the Editor, 21 Nov; `brain8-v39`, 1,000 games each, Brain 8 as shipped: B4, tempoFirst 0, tempoSecond +1)
On v3.9 (routes) Brain 8 does **worse than Brain 5 in three of the four matchups**, mostly by losing on the tiebreak; it still wins more often by KO or TKO.

| Matchup | Won KO / tiebreak | Lost KO / tiebreak | Draw | Holder KO | Pull KO | TKO | Turn limit | Games with a pull | Avg turn | First mover: of all / of decisive | Overall won – lost |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Balanced 5v5 | 263 / 204 | 206 / 248 | 79 | 4.6% | 33.3% | 9.0% | 53.1% | 33.3% | 19.6 | 47.9% / 60.3% | 467 – 454 (even) |
| All-Light 5v5 | 372 / 85 | 189 / 330 | 24 | 12.8% | 28.3% | 15.0% | 43.9% | 28.7% | 15.4 | 39.6% / 43.7% | 457 – 519 (−6.2 points) |
| Balanced 7v7 | 384 / 71 | 316 / 214 | 15 | 4.0% | 50.1% | 15.9% | 30.0% | 50.2% | 19.4 | 36.8% / 34.4% | 455 – 530 (−7.5 points) |
| All-Light 7v7 | 420 / 45 | 350 / 169 | 16 | 19.8% | 40.1% | 17.1% | 23.0% | 40.3% | 15.4 | 42.6% / 40.9% | 465 – 519 (−5.4 points) |

On v3.8 (tempo 0 and 0) the same matchups were even or within 4 points. Two things changed at once, the rule set (v3.9) and the shipped tempoSecond +1, so the cause is **not isolated**. Likely: Brain 8 trades into games that end on the clock without the flag lead (it loses 2–3 tiebreaks for every one it wins). F022-8 asks the Editor whether Brain 8 stays the default.

### FD49-3 Command × Arrow Storm (the Editor, 21 Nov; `command-storm-v39`, sim-only, v3.9, Brain 8 mirrors, 1,000 games each, same deals per format)

| Format, Command, first turn | Arrow Storm | First mover of decisive | Turn limit | Draws | Arrow Storm kills per firing |
|---|---|---|---|---|---|
| 7v7, 10, 6 (as now) | ×2 | 43.5% | 14.5% | 11 | 0.80 |
| 7v7, 10, 6 | ×1.75 | 46.2% | 13.0% | 17 | 0.72 |
| 7v7, 10, 6 | ×1.5 | **49.4%** | 14.6% | 13 | 0.45 |
| 7v7, 10, 10 (equal) | ×2 | **49.8%** | 12.4% | 13 | 0.79 |
| 7v7, 10, 10 | ×1.75 | 60.1% | 10.2% | 9 | 0.71 |
| 7v7, 10, 10 | ×1.5 | 64.6% | 8.6% | 14 | 0.36 |
| 5v5, 8, 5 | ×2 | 76.2% | 21.9% | 59 | 0.94 |
| 5v5, 8, 5 | ×1.75 | 73.5% | 39.6% | 152 | 1.00 |
| 5v5, 8, 5 | ×1.5 | 56.5% | 37.7% | 78 | 0.03 |
| 5v5, 8, 8 (equal) | ×2 | 72.7% | 21.5% | 27 | 0.75 |
| 5v5, 8, 8 | ×1.75 | 64.1% | 46.3% | 118 | 1.00 |
| 5v5, 8, 8 | ×1.5 | 56.5% | 37.7% | 78 | 0.03 |

Reading:
- **7v7: equal Command and ×1.5 does not hold.** It gives the first mover 64.6%. Two mixes land inside F12's 45–55%: **equal Command (10 and 10) with Arrow Storm ×2** (49.8%, the fewest stalls of the two) and **first turn 6 with Arrow Storm ×1.5** (49.4%). Equal first-turn Command and a smaller Arrow Storm each help the first mover; together they overshoot.
- **5v5 at Command 8: nothing lands in range.** Best is ×1.5 (56.5%), where Arrow Storm almost never kills (0.03 per firing) and 38% of games hit the turn limit.
- **FD49-4 holds for Brain 8.** At ×1.5 the first-turn 5 and 8 games are identical, all 1,000, move for move: the bot doesn't spend the extra first-turn Command. At ×2 and ×1.75 they differ in 30.5% of games (it spends it when a warm-up pays). So 5v5 equal first-turn Command still can't be judged until a brain spends it (FD49-4's next brain build).
- **Why a weaker Arrow Storm helps the first mover:** the first mover strikes first in about 80% of games. At ×2 (14 damage) Arrow Storm kills a full archer in one shot, and that is how the second mover answers: the first mover loses its archer first in 58–60% of games. At ×1.5 (10.5) the archer survives, kills per firing halve, and the duel flips (the second mover loses its archer first in 55–60%). Equal first-turn Command adds to the first mover's head start (the second mover then loses the first unit in about two-thirds of games), so together they overshoot.
- **Recommendation (revised 22 Nov, F022-9):** Arrow Storm ×1.5 in every format with first-turn Command kept reduced. In 7v7 the two in-range pairs each change one rule and can't be told apart; ×1.5 is also the best 5v5 setting.
- Likely, not isolated: each row changes only the numbers named, on the same deals, but one brain plays both sides.

### Bot minimum (met)
All six positions pass (`board/tests/test_brain8.js`, 38 checks, on v3.8 and again on v3.9 after the sync): 1 Brain 5 walks its archer into reach, Brain 8 with A1 stops short; 2 with a kill on, Brain 8 goes in and strikes; 3a steps out of a warmed storm, 3b braces where the brace saves it, 3c strikes the archer first when nothing else saves it (A2 on); 4 the holder joins when the race check passes (reads exactly as Brain 7's: 5 / 5) and stays when it fails; 5 tempo −1 holds inside the deploy area on turns 1–2 (0.00 hexes beyond), +1 closes faster (7.67 from the enemy flag against 9.33 at 0), and the slider stops once a unit is hurt; 6 all four off plays Brain 5's actions. Legal play: 30 seeded games per format and lineup on the newest preset, 0 refused, 0 errors, 0 unfinished (2 per format in `checks`, 30 in night checks). 3,000+ lab games per arm with no refused actions or bot errors in the `play` measure.

### Settings review
**No effect found** (within the noise, F23):
- `holderJoins` off against on changes nothing before one side is down to its holder (the first-loss, specials and specials-safety columns are identical). Not useless: it is what cuts stalls.
- `tempoSecond` at 0 against +1 in 5v5: identical games (sweep, 200; see above).
- `tempo` (the A3 switch) at tempo 0 and 0: no effect, by design.

**Settings that move results** (both A1 and A2 are off in the shipped brain, so their weights act only when switched on): `firstStrike` ×0.5 against Brain 5, 5v5: 60 won, 106 lost; ×2: 54, 145. `warmedRespect` ×0.5: 59, 141; ×2: 14, 183 (screen, with A1 and A2 on). Both make Brain 8 worse the higher they go.

**Missing settings** (harder to prove than the list above):
- A unit's own warmed special is valued as if it will live to fire it. In 11 of 20 traced deaths (table above, e.g. game NLEP-6JGX-CBNQ, 7v7, North's Light Ranged on turn 2) it warmed up inside reach of an enemy special already warm and was removed first. Suggested setting: discount `model.special` by the chance of being removed before firing. F022-1.

### Checks run and results
- Every check in `README.md` passes locally (rule tests, `test_brain5` to `test_brain8`, `test_watch`, `test_ui`, `test_version`, invariants 30 games, replay, lab self-test, stall, lead, capacity, status board, board check 10 games). On GitHub the first push failed `test_watch.js`: its Brain 8 link check still expected A2 on after I switched it off; fixed.
- `regress_engine.js` (3 games per rule set): this build changes no rules file. `main`'s board and this branch print identical hashes (the script covers match3 to v3.8): match3 37397ef2bd3ed86b, v1 7b25bca651c0cb31, v2 ddbe5fc437ff4e9d, v3 26371927b53d4413, v3.1 c71e4cd12fc984b0, v3.2 f62a061d2c147d83, v3.3 e6151bf463d6c9f8, v3.4 ee6ce003ac760250, v3.5 fca989aecfaf21c9, v3.6 a6bf327b54f7d5a1, v3.7 dd3c27d9dc9aafbb, v3.8 022a298c49a02540.
- `sims/brainhash.js`, every brain on every preset, before against after: standard 0fcd6621fb898ed2, easy 1ecb7608e712b099, kitA 613037e1df3211cd, kitA2 ea0b4085c8f61f47, kitC a964ff8de086b694, kitB 9b8b9e230b9b0737, batchC 9f25673263069a1e, kitD b9ada37b250125e4, brain5 478bcbd26b9feb48, brain6 0a85345d7ebaf93f, brain7 87b1d134e681d8b7: all unchanged. Brain 8 with all four off (`brain8:holderJoins=0,safe=0,respect=0,tempo=0@brain5`): 478bcbd26b9feb48, the same as Brain 5. Run before the v3.9 sync. After it (v3.9 adds a preset, so every hash moves on both boards): `main`'s board and this branch both print brain5 39b3a3235af2e5d6, brain6 5e954847821f9145, brain7 6d4687cfec433e61, and Brain 8 with all four off prints 39b3a3235af2e5d6, the same as Brain 5.
- The new measures checked by hand on saved games: `firstloss` against the traces (seed NLEP-6JGX-CBNQ: first Light Ranged lost by the first mover on turn 2, removed by an LR special; a 7v7 game with no archer lost shows blanks), `brain8` join counts against test position 4.

### What's in
- **Brain 8** (`brain8`, "Brain 8 (safe approach)"): Brain 5 plus B4 (Brain 7's holder joins, with its race check, without B1), A1 safe approach, A2 respect for a warmed special and A3 opening tempo, each behind a switch in `approach`, with plain labels on the Opponent screen (the tempo sliders take −1 to +1). Ships with B4 and A3 on (tempoFirst 0, tempoSecond +1) and **A1 and A2 off** (F022-1). Brains 5, 6 and 7 are untouched; Brain 5 stays the default.
- Lab measures `firstloss` and `brain8`; `sims/trace022.js` (the traces); `sims/lab/report022.js` (this Report's tables); four job orders.

### Anything beyond the brief, and why
- **A1 and A2 ship off.** The brief says to build them; it doesn't say to ship them on, and the screen shows both cost wins.
- **A3 also scales the value of threats and, with A1 off, the fear of damage taken**, during the opening only: with A1 off, scaling advance alone changed nothing (Brain 5 already advances as far as its Command lets it on turns 1–2), so +1 couldn't "close fast and strike first". −1 adds a cost per hex beyond its own deploy area so that it holds there.
- `reach_contact_turn` instead of `first_contact_turn` (F022-3). Brain 8's settings travel in watch links (`n=brain8:tempoSecond=1`), negative values included (`test_watch.js`).

### Known gaps
- **Most numbers are on v3.8.** The screen, sweep, confirm and tempo confirm ran on v3.8; brief 017's v3.9 merged during them. The head-to-head against Brain 5 was re-measured on v3.9 at the shipped settings (above), and it is worse than on v3.8. The v3.9 mirror baseline comes from this version's release run (Brain 8 mirrors, the new default).
- The v3.8 head-to-head (confirm table) was played at tempo 0 and 0; the v3.9 re-measure is at the shipped setting. Which of the two (v3.9 or tempoSecond +1) cost Brain 8 its points against Brain 5 isn't isolated.
- The "no warm-up on the first turn" F39 arm wasn't played (F022-2).
- The 10 "first mover's archer dies first" traces are 7v7, not 5v5: on the new 5v5 field it happened in only 6 of 40 games, all trades.
- I didn't play the Editor's hands-on checks; links: an even-push mirror game is in the sweep's `games.csv` (`replay` column).

### Flags closed / opened
- Closed: F47 (Brain 8 is Brain 5 + B4), F48 (the Editor's answer recorded on `main`), F021-3 (the `version.js` header).
- Still open: F41 (Brain 8's A2 does it but costs wins; next step F022-1). F39 stays open as evidence: Brain 8 doesn't change the archer duel; the size screen above is the evidence for the rules brief.
- Opened: F022-1 to F022-6 in `flags/022.md`.

### Pull request
https://github.com/productofdefiance/Flagfall/pull/41
