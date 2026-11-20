# Brief 022 — Brain 8: holder joins, safe approach, respect for a warmed special, and an opening plan

| | |
|---|---|
| Game version | Next free **YY** at merge (a new brain is a real change), ZZ = 00 |
| Lane | Bot (with Lab measures) |
| Rule set | none (bot only; no rule change). Measured on the newest rule set on `main` at build time, which should be brief 014's (one field per format) |
| Date | 2026-11-20 |
| Goal | A brain that stops walking into the enemy's first strike, steps out of (or braces against) a warmed special, finishes games with its holder like Brain 7, and has one opening slider per move order; and the numbers that tell the Editor whether 5v5's move-order problem (F39) is the bot or the rules |
| Branch | Any branch your session may push to, started from `brief/022-safe-approach` |
| Flags | F41 (the bot ignores a warmed special), F47 (next brain = Brain 5 + B4 only), F39 (5v5 move order) as evidence; F48 (Brain 5 stays the default) stays as it is |
| Waits on | 014 |
| Order | **After brief 014 is merged**, so it is measured on the new 5v5 field. No rule change, so it runs beside the rules chain (017, 018, 012). Brief 020 (victory values) is built on top of this brain and waits for it |

## Context
Three findings from 20 Nov point at the same brain work:
- **F41 (brief 011, playtest round 2):** the bot ignores a warmed special. Of units inside its reach, only 19% (7v7) to 46% (5v5) step out, almost none brace (7v7: 102 braced against 6,053 unbraced), and about 29% of the units left in reach are hit by it next turn.
- **F39 is mostly the approach, not Arrow Storm.** The design chat's sim check (sim-only, 250 balanced 5v5 Brain 5 mirrors per version, same seeds, v3.7, old field): the first mover wins 18% as built, 81% with Arrow Storm ×1.5 alone, 6% with equal turn-1 Command, and **still 18% with Arrow Storm removed**. Whoever keeps its Light Ranged wins 82–93% in every version. With Arrow Storm, the second mover's archer kills the first mover's on turn 2 (107 of 120 games traced); without it, the first mover's archer still dies first, on turn 3, to a Heavy Melee, Pick Off or a normal shot. Reading, likely and not isolated: the first mover walks into the second mover's reach first and is struck first.
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
- **A3 sweep, opening tempo:** `tempoFirst` and `tempoSecond` each at −1, 0, +1 (9 pairs), Brain 8 mirrors with B4 + A1 + A2 on, 5v5 and 7v7, screen at 200 per pair, then the best two or three pairs at 1,000. Report the first mover's share for every pair. The question: is there an opening for each side that brings 5v5 within F12's target (first mover 45–55% of decisive games)?
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
- Is there an opening for each side that fixes 5v5's move order? If not, is it the rules (F39), and which special size or rule from the screen helps most?
- Does B4 alone (F47) keep Brain 7's stall cut without its losses?
- Should Brain 8 become the default opponent? Your recommendation; the Editor decides.
Say whether each cause is isolated or only likely.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a (no rule change); the measurements above instead
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
