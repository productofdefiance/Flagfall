# Brief 006 — Kit D learns Light play

| | |
|---|---|
| Rule set | none (bot only; no rule change) |
| Date | 2026-11-18 |
| Goal | The computer opponent plays Light units the way they are meant to be played: hit, step away, stay spread out. |
| Branch | `build/006-light-play` |
| Flags | F22 |

**Order:** build only after brief 005 is merged. Kit D comes from 005. Start from this brief branch, then bring `main` in, so Kit D is there.

## Context
Brief 004 added Evade (Game Laws 6.5), but in simulations it didn't reduce Light losses (F22). The likely cause, not isolated, is the bot. It walks as far as it needs to reach a target, attacks, and has nothing left to step away with: in 43% of its Evade chances it had no legal step. It also packs Light units into tight lines, which cuts their Dodge, because Dodge grows with open hexes around the unit. The Editor saw the same thing playing a Light vs Light 7v7 against Kit C (seed MQVV-DBL7-F7ZM): tight lines, and no real Evades. We can't judge Evade until a bot can play it.

## Scope
In: Light-unit play for Kit D (planning, Evade, spacing), and re-running 004's Evade measurements with it. Out: any rule change, Heavy-unit play, Cavalry, specials, the coaching-engine rework. Kit A–C, Standard and Easy stay exactly as they are.

## What to build
1. **Plan move, attack and Evade as one sequence.** When Kit D considers a Light unit attacking from an adjacent hex, it chooses the attack hex so the unit still has the Stamina, Command and cap (tackle included) for at least one Evade step to a hex where it is safer, by the bot's own threat measure. It prefers that attack hex over one that leaves the unit stranded, unless the stranded attack kills or wins the game.
2. **Evade well.** After the attack, step to the hex that most lowers the enemy's expected damage next turn, counting Dodge from open hexes. Stay put only if no hex is safer.
3. **Spread out to keep Dodge.** Kit D values open hexes around its Light units (Dodge room), but keeps each one close enough to a friend to give or get Support. Add this as one weight (`lightSpacing` or similar). Its effect must show in the numbers below.
4. **Ranged and Reach Light units** (Light Ranged, Light Anti-Cavalry) prefer to attack from their full reach, so they don't need to Evade. Light Ranged avoids attacking from the next hex (half Strength) unless it kills.
5. Each behaviour can be switched off on its own. If one makes Kit D worse in testing, say so and leave it off. Don't drop it silently.

## Rules it touches
Evade (6.5) and its limits: no Evade after a kill, Reach or ranged attacks, or pulls; tackle cost and its cap hex; zones. Dodge room. Support. Ranged half Strength when adjacent. The bot may pick only legal actions from the engine.

## Bot minimum
This build is the bot work. Met when every number below is in the Report.

## Measurements
All with `tests/rng.js`, the same batches as 004, tiebreak wins counted separately. Each on **v3.3** and the newest preset, both formats, **all-Light lineups** and **balanced lineups**, Kit D with Light play vs Kit D without it.
1. **Evade:** chances, taken, and "no legal step", before and after. Target: "no legal step" under 20% of chances, and Evade taken in at least 75% of chances where a safer hex exists.
2. **Light units removed per game,** before and after. This is the real question: does Evade work once a bot can play it?
3. **Average Dodge** on Light units when they are attacked, before and after (it shows whether spacing worked).
4. **Head-to-head:** Kit D with Light play vs without it, 400 games per format, all-Light lineups. Target: at least 55% wins.
5. The baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on turn limit, pulls) for Kit D with Light play.

## Must not change
Every existing preset plays and replays identically. Kit A–C, Standard and Easy play exactly as before (bot-driven regression hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board (no rule changes in this build).
- A test that Kit D never picks an illegal action over 30 seeded all-Light games per format.
- A test position where a Light Melee can reach a target from two hexes: Kit D picks the one that leaves an Evade step.

## The Editor's hands-on check
One Light vs Light 7v7 against Kit D. Watch whether its Light units hit and step back, and stop moving in tight lines.

## Report back
The standard Report, the five measurements, and a plain-language verdict on Evade: with a bot that can use it, does it keep Light units alive? If not, say what the numbers point to (the rule, or still the bot), and say whether the cause is isolated.

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
