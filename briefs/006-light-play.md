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

**Naming:** call the new brain **Brain 5** (short form B5), in code, on screen and in the Report. Brains are numbered from now on, because there will be many. "Kit" means something else elsewhere in the game. On screen, always write "Brain 5" in full, so it isn't mixed up with the build number ("Build 5"). Leave the existing Kit A–D names alone, so saved matches still load.

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
5. Brain 5 becomes the default opponent only if it beats Kit D (measurement 2).

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

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
