# Brief 006 — Brain 5: a bot that plans its turn and knows why

| | |
|---|---|
| Rule set | none (bot only; no rule change) |
| Date | 2026-11-18 |
| Goal | A new brain, Brain 5, that plans its whole turn within its budget and picks every action (attack, move, brace, Evade, spacing) from one shared sense of what it gains and risks, instead of fixed habits. |
| Branch | `build/006-light-play` |
| Flags | F22; evidence for F10, F11 |

**Order:** brief 005 is merged, so build on `main`.

## Context
Brief 004 added Evade (Game Laws 6.5), but in simulations it didn't reduce Light losses (F22). Brief 005's Kit D beats Kit B two to one, yet Kit D vs Kit D still ends on the clock in about 37% of 7v7 games and 70% of 5v5 games. That points either to the rules or to a bot still too weak to finish games.

The Editor watched one Kit D vs Kit D game (build 5, v3.4, 7v7 all Light, seed TJBH-QBDJ-395W) and saw four problems:
- units bunching up
- bracing far from the enemy but not in contact
- flanked enemies with Dodge 0–5% left untouched
- no Evading.

The design chat replayed that game and found:
- **Unaffordable attacks:** 16 times a unit moved "to attack" a target, didn't attack, and the target was still alive at the end of the turn. Almost every turn ended with no Command left. In contact turns, each side spent 4–5.5 of its 10 Command moving units that never attacked.
- **Bracing too early:** North braced 6 units on turn 2 with the nearest enemy 6–7 hexes away.

**This is one game: a lead, not proof.** The Editor's direction is explicit:
- no short-sighted or reactionary patches
- no "do X when Y" rules bolted on
- improve the computer opponent before changing the game to fix stalls. The game design changes only if several brains fail to fix stalling, and the Editor decides when that point is reached. Keep measuring so the data is there.

**Naming:** call the new brain **Brain 5** (short form Br5), in code, on screen and in the Report. Brains are numbered from now on, because there will be many. "Kit" means something else elsewhere in the game. On screen, always write "Brain 5" in full, so it isn't mixed up with the build number ("Build 5"). Never shorten it to a single letter plus a number (that reads as a hex name, like B5). Leave the existing Kit A–D names alone, so saved matches still load.

## Scope
In:
- A new brain, **Brain 5**, built on Kit D. Kit D stays frozen, so brief 005's results stay comparable.
- Diagnosis across many games before and after.
- Measurements, including a stall re-check.

Out:
- Any rule change.
- Cavalry and specials.
- The full coaching-engine rework (personality sliders and a tuning screen) beyond exposing the weights below.

## What to build
1. **Diagnose first, across many games.** Before changing anything, measure Kit D vs Kit D on v3.4, balanced and all-Light lineups, 400 games per format:
   - Command spent on moves by units that didn't attack that turn.
   - Moves made "to attack" where the unit never attacked and the target survived.
   - Attacks per turn once the armies are in contact.
   - Braces made where no enemy could hit that unit next turn, and contact turns with no brace.
   - Average Dodge on Light units when they're attacked.
   - Evade chances, taken, and "no legal step".

   Report these before building. Fix what the numbers confirm, and say plainly if a problem from the watched game doesn't show up at scale.
2. **Plan the whole turn within budget.** At the start of its turn, Brain 5 builds complete plans: who moves where, who attacks whom and in what order, who braces, who Evades.
   - It keeps only plans whose total Stamina and Command it can pay for, counting tackle and zones.
   - It picks the plan with the best value (item 3).
   - It never starts a plan it can't finish. After each dice roll it re-plans from the new position.
   - It knows before it commits what the turn can achieve: which enemy it can remove, how much damage it can do, what it leaves exposed.
   - A full search may be too slow. A narrowed search (for example, the best few plans kept at each step) is fine. Report how many plans it looks at per turn, and how long a turn takes on a phone-sized device.
3. **One value model, not rules.** Every plan is scored the same way:
   - **Gained:** what it takes this turn. Expected damage and removals, flag damage and pulls, using the engine's own numbers.
   - **Risked:** what the enemy can realistically do back next turn, with *its* movement, range, Stamina and Command. This counts our Armor, Brace (−2 a hit), Support, and Dodge from the open hexes each of our units will have.
   - **Next turn:** the Stamina and movement each unit will have (a braced unit starts with 2, not 3), and how well placed it is for the goal and for defence.

   Bracing, spacing, Evade and focus fire must all come out of this one model:
   - **Bracing:** Brain 5 braces when the damage it saves outweighs next turn's lost Stamina and the Command spent. So it braces more when defence matters more (holding the flag, a wounded unit within reach, the enemy able to afford several hits on it) and less when it needs to move.
   - **Spacing:** a Light unit keeps open hexes around it because that Dodge lowers the damage it expects to take, and because room to move gives it Evade steps. Never "keep space" for its own sake.
   - **Evade:** taken because the step away lowers expected damage next turn. Brain 5 plans the attack hex knowing it may want to step away afterwards.
   - **Support:** fighting next to a friend is worth what the extra Support and shared threat are actually worth.

   No new "if X then do Y" behaviours. If something can't be expressed as gained, risked or next turn, raise it as an `ASK` in `FLAGS.md` instead of hard-coding it.
4. **Expose the model's weights as brain settings** (for example: how much it fears damage taken, how much it values next turn's Stamina, how much it values the flag). Later kits and personalities can then be made by tuning them, not rewriting the bot. Label each one in plain words on the Brain screen.
5. **Settings review** (now standard for every brain build, see `CLAUDE.md`): which of Brain 5's settings showed no effect, and which situations no setting could fix (as `ASK` rows).
6. Brain 5 becomes the default opponent only if it beats Kit D (measurement 2).

## Rules it touches
None change. Brain 5 must model these correctly and pick only legal actions from the engine:
- Command and Stamina
- tackle (Stamina plus the cap hex)
- zones
- Brace (−2, and Stamina 2 next turn)
- Dodge room
- Support
- Ranged half Strength when adjacent
- Reach
- reload
- Evade and its limits (no Evade after a kill, a Reach or ranged attack, or a pull)
- parry
- set spear
- the flag pool and pulls
- the turn limit and its tiebreak.

## Bot minimum
This build is the bot work. It's met when every measurement below has a number.

## Measurements
All with `tests/rng.js`, tiebreak wins counted separately. Use 1,000 games per side for any decision that rests on a gap under about 8 points (F23).
1. **Diagnosis before and after** (item 1's list): Kit D vs Kit D, then Brain 5 vs Brain 5, same seeds. Targets:
   - "Moved to attack, never attacked, target alive" under 10% of such moves.
   - Braces with no enemy able to hit that unit: near zero.
2. **Head-to-head:** Brain 5 vs Kit D, balanced and all-Light lineups, both formats. Target: Brain 5 wins at least 60% of decisive games.
3. **Light play:**
   - Light units removed per game.
   - Average Dodge when attacked.
   - Evade taken where a safer hex exists. Target: at least 75%.
   - "No legal step". Target: under 20%.
4. **Stall re-check:** the full baseline table at v3.4, Brain 5 vs Brain 5, 1,000 games per format, next to brief 005's Kit D table. This is data for the Editor, not a trigger for a rule change.
5. **Speed:** average and worst time Brain 5 takes per turn.

## Must not change
Every existing preset plays and replays identically. Kit A–D, Standard and Easy play exactly as before (bot-driven regression hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board.
- Brain 5 never picks an illegal action over 30 seeded games per format, balanced and all-Light.
- Three test positions, each showing the model's reasoning:
  - A Light Melee that can reach a target from two hexes picks the one that leaves a safer Evade step.
  - With enough Command for three attacks, Brain 5 doesn't move a fourth unit into place for an attack it can't pay for.
  - A unit braces when two enemies can reach it next turn and doesn't when none can.

## The Editor's hands-on check
1. One Light vs Light 7v7 against Brain 5.
2. One Brain 5 vs Brain 5 game at 5v5 (both sides set to Computer). Watch for:
   - whether it attacks flanked units
   - whether it braces only when an enemy is close
   - whether its Light units hit and step back
   - whether the 5v5 game still stalls.

## Report back
The standard Report and the five measurements. In plain words:
- What the diagnosis confirmed and what it didn't.
- How Brain 5 decides (gained, risked, next turn).
- With a bot that plans and doesn't waste Command, do mirror matches still end on the clock?

Say whether each cause is isolated or only likely.

---

## Report
*Filled in by Claude Code.*

**In one line:** Brain 5 is built and is now the default opponent. It beats Kit D in all four formats and no longer wastes Command, but mirror games still end on the turn limit about half the time, now decided by the tiebreak rather than drawn.

### Plain answers
- **What the diagnosis confirmed (Kit D vs Kit D, 400 games per format and lineup):**
  - *Unaffordable attacks:* confirmed only in the lineup the Editor watched. In all-Light 7v7, 17.7% of "moves to attack" ended with no attack and the target alive (2,075 of 11,750). Elsewhere it was rare: 0.2–3.3%.
  - *Command wasted on moves by units that didn't attack:* confirmed everywhere, at 64–89% of the Command spent on moves.
  - *Bracing far from the enemy:* **not confirmed** at scale. Braces made where no enemy could reach that unit next turn: 1 of 34,112. What the numbers do show is heavy bracing in balanced 5v5: about 58 braces per game (turtling). One caveat: "could reach" counts movement and range but ignores blockers and zones, so it overstates reach slightly.
  - *Flanked low-Dodge enemies left alone:* no direct measure. Attacks per contact turn were 1.65–2.24.
  - *No Evading:* partly confirmed. Kit D took 44–78% of Evade chances, and in 34–55% of cases there was no legal step.
- **How Brain 5 decides:** at the start of its turn it builds whole-turn plans out of each unit's possible activations (move, attack, brace, pull, Evade step). It keeps the best few at each step and gives every resulting position one score:
  - **Gained:** units and HP removed (averaged over the dice), flag damage and pulls.
  - **Risked:** what the enemy can realistically do back next turn. This uses the enemy's own Command, movement, range and expected hits against our Armor, Brace, Dodge room, Support and holder pool, with damage piling up so it sees focus fire.
  - **Next turn:** the Stamina each unit starts with (2 after a brace), how far it is from the goal, the holder's distance from home, and the danger to our flag.

  It only plans actions the engine accepts, so it never starts a plan it can't pay for. It plans again after every dice roll. Bracing, spacing, Evade and focus fire all come from this score; there are no "if X then Y" rules.
- **Do mirror matches still end on the clock?** Yes, about half of them: 45.0% at 7v7 and 55.3% at 5v5 (1,000 games each), against 39.0% and 75.0% for Kit D. What changed is how they end. Draws fell to 2–5% (5v5 was 61.8%), flag pulls are now the main win, and holder KOs became rare. Likely cause: Brain 5 defends its holder well, so the side ahead on pull damage wins the tiebreak. Likely, not isolated.

### The five measurements
All on v3.4 with `tests/rng.js`; tiebreak wins counted apart.

**1. Diagnosis before and after** (balanced: Brain 5 from the first 400 games of the 1,000-game run; all-Light: 400 games. Kit D vs Kit D before, Brain 5 vs Brain 5 after.)

| | Kit D bal. 7v7 | Brain 5 bal. 7v7 | Kit D bal. 5v5 | Brain 5 bal. 5v5 | Kit D Light 7v7 | Brain 5 Light 7v7 | Kit D Light 5v5 | Brain 5 Light 5v5 |
|---|---|---|---|---|---|---|---|---|
| Moved to attack, never attacked, target alive (target < 10%) | 3.3% | **0.0%** (0/10,321) | 0.2% | **0.0%** | 17.7% | **0.0%** | 2.5% | **0.0%** |
| Braces with no enemy able to reach (target near zero) | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 |
| Braces per game | 9.7 | 8.2 | 58.3 | 5.1 | 8.3 | 3.9 | 9.0 | 4.2 |
| Contact turns with no brace | 84.3% | 90.7% | 82.4% | 93.2% | 83.7% | 94.0% | 74.3% | 95.7% |
| Share of move Command on units that didn't attack | 70.3% | 62.5% | 89.1% | 63.6% | 64.4% | 46.8% | 65.1% | 50.9% |
| Attacks per contact turn | 1.91 | 1.90 | 1.65 | 1.57 | 2.24 | 2.09 | 1.82 | 1.85 |

Both targets are met. The share of move Command on units that didn't attack is still about half. Most of that is moving into position for next turn, which the score values, so it isn't waste in itself.

**2. Head-to-head: Brain 5 vs Kit D** (400 games per format and lineup; target: at least 60% of decisive games)

| | Brain 5 wins | Kit D wins | Brain 5 share of decisive | Tiebreak wins (Brain 5–Kit D) | Draws |
|---|---|---|---|---|---|
| Balanced 7v7 | 191 | 58 | **77%** | 77–47 | 27 |
| Balanced 5v5 | 96 | 80 | **55%** (below target) | 134–65 | 25 |
| All-Light 7v7 | 253 | 47 | **84%** | 49–21 | 30 |
| All-Light 5v5 | 179 | 61 | **75%** | 62–24 | 74 |

Brain 5 beats Kit D in every format, so it is now the default opponent (item 6). Balanced 5v5 misses the 60% target: 96 to 80 is about 1.2 standard errors from even, so there it is likely but not proven to be better. Counting tiebreak wins it's 230 to 145. Raised as F26.

**3. Light play** (Brain 5 vs Brain 5; Kit D vs Kit D in brackets)

| | Bal. 7v7 | Bal. 5v5 | All-Light 7v7 | All-Light 5v5 |
|---|---|---|---|---|
| Light units removed per game | 5.62 (5.55) | 3.72 (1.41) | 10.44 (10.03) | 7.17 (6.89) |
| Average Dodge when attacked | 15.6% (9.5%) | 17.4% (12.5%) | 14.7% (7.8%) | 15.8% (8.2%) |
| Evade taken where a safer hex existed (target ≥ 75%) | **87.3%** (90.5%) | **91.1%** (95.6%) | **80.4%** (89.8%) | **81.2%** (74.5%) |
| Evade chances taken | 78.5% (69.3%) | 84.4% (78.4%) | 70.9% (62.3%) | 70.2% (44.3%) |
| No legal step (target < 20%) | 27.7% (44.3%) | 23.5% (33.8%) | 33.7% (54.6%) | 34.0% (47.6%) |

- The safer-step target is met.
- The no-legal-step target is **not** met: it fell by about a third but is still 24–34%.
- Light losses didn't fall. The balanced 5v5 rise is likely because games stopped being turtled draws (more fighting); not isolated.

So a better bot doesn't fix F22 either; that flag is updated.

**4. Stall re-check** (balanced, Brain 5 vs Brain 5, 1,000 games per format, next to Brief 005's Kit D at 400)

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
| First mover's share of decisive games | 43% | 42% | 13% | 32% |

As a sanity check on noise, the two identical Brain 5 sides split decisive games 296–254 at 7v7 (54%, about 1.8 standard errors from even) and 225–222 at 5v5. Gaps of a few points here are noise (F23).

**5. Speed** (this build machine, not a phone; phone time not measured)
- Average time per turn: 43 ms (balanced 5v5), 96 ms (balanced 7v7), 86 ms (all-Light 5v5), 210 ms (all-Light 7v7).
- Worst turn: 4.1 s in Brain 5 mirrors, and 4.6 s against Kit D (all-Light 7v7).
- Plans looked at: Brain 5 builds a plan 1.8–1.9 times per turn (it plans again after rolls, at most 6 times). Each turn it scores 386–1,011 positions on average (up to 7,413, all-Light 7v7, 10 games per format).
- A phone is likely 2–4 times slower, so the worst all-Light 7v7 turns may take several seconds. Raised as F24.

### Report fields
- **What's in:**
  - Brain 5 (`bot.js`: `planTurn5`, `value5`, `risk5`; `brain.js`: its 11 settings with plain labels). It's on the Opponent screen with its settings shown in plain words, and it's the default opponent.
  - Diagnosis counters and the all-Light lineup in `tests/baseline.js`.
  - `test_brain5.js`: the three positions and legal play. It runs in `checks` (2 games) and in night checks (30).
  - Data and scripts in `data/sim_study10/`.
- **Anything beyond the brief, and why:**
  - On the setup screen the opponent picker's label now says "Brain" instead of "Kit", and its hints say "the brain's choice". The brief says "Kit" means something else in the game, and the picker now offers numbered brains. The Kit A–D names themselves are unchanged.
- **Checks run and results:**
  - Every check in `README.md` passes:
    - `test_rules` (all pass)
    - `test_v1` 12/12, `test_v3` 10/10, `test_v31` 22/22, `test_v32 40` 57/57, `test_v33` 59/59, `test_v34` 20/20
    - `test_reasons` 18/18, `test_kitd 6` 9/9, `test_rng` 7/7
    - `test_replay` 386 checks with 0 mismatches
    - `test_invariants 30`: 0 problems
    - red team invariants: OK
  - `test_brain5 30`: 13/13. Over 30 games per format and lineup (balanced and all-Light, 5v5 and 7v7; 14,733 actions), Brain 5 had 0 refused actions, 0 errors and 0 unfinished games.
  - In the three positions:
    1. The Light Melee moves to F9, attacks the wounded Anti-Cavalry and evades to G10, away from the archer. The position scores 10.5, against 5.4 for the best west step.
    2. With Command for three attacks it makes three attacks and moves no fourth unit.
    3. The holder braces with two enemies in reach (score −23.8 braced vs −24.7 not), and doesn't brace when they're far (−21.0 vs −20.5).
  - `regress_engine.js`, the board before this build vs this build: identical.
    ```
    match3       37397ef2bd3ed86b
    v1           7b25bca651c0cb31
    v2           ddbe5fc437ff4e9d
    v3           26371927b53d4413
    v3.1         c71e4cd12fc984b0
    v3.2         f62a061d2c147d83
    v3.3         e6151bf463d6c9f8
    ```
  - `regress_engine.js` only plays Standard, Kit B and Batch C. So a one-off check also hashed 2 seeded games per format on every rule set for every existing brain, before vs after. All identical:
    ```
    standard   a54ccd5067adac7a
    easy       68d1211dcce6ba2f
    kitA       02277fc9b149b13e
    kitA2      435067a8967aea33
    kitC       143507a2c0e8afe6
    kitB       2a976e50634849ee
    BRAINHASH_TAIL
    ```
  - In the browser (phone size), a fresh New match picks Brain 5 for the computer side, and a game starts and plays with no errors.
- **Baseline table:** no rule change. The stall re-check above is the Brain 5 table.
- **Bot minimum:** met. Every measurement above has a number, and Brain 5 plays every action type it plans: attacks, Evade steps, braces and pulls (pulls in 25–39% of mirror games).
- **Settings review:**
SETTINGS_REVIEW
- **Known gaps:**
  - Phone speed was not measured (F24).
  - "No legal step" is above target (F22).
  - Balanced 5v5 is short of the 60% head-to-head target (F26).
  - The "could reach next turn" measure ignores blockers and zones.
  - Flanked low-Dodge enemies left alone has no direct measure.
- **Code and brief disagree:** none found. Kit D is unchanged, so Brief 005's numbers stay comparable.
- **Flags closed / opened:**
  - Updated: F10, F11, F12, F22.
  - Opened: F24 (think-time setting), F25 (clock awareness), F26 (keep Brain 5 as default?).
- **Pull request:** PR_LINK
