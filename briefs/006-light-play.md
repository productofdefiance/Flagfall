# Brief 006 — Kit D: Command budget, bracing and Light play

| | |
|---|---|
| Rule set | none (bot only; no rule change) |
| Date | 2026-11-18 |
| Goal | Kit D stops wasting Command, braces only when it matters, and plays Light units properly (hit, step away, stay spread out). Then we re-check whether stalls are the bot or the rules. |
| Branch | `build/006-light-play` |
| Flags | F22; evidence for F10, F11 |

**Order:** build only after brief 005 is merged. Kit D comes from 005. Start from this brief branch, then bring `main` in, so Kit D is there.

## Context
Brief 004 added Evade (Game Laws 6.5), but in simulations it didn't reduce Light losses (F22). The likely cause, not isolated, is the bot. It walks as far as it needs to reach a target, attacks, and has nothing left to step away with: in 43% of its Evade chances it had no legal step. It also packs Light units into tight lines, which cuts their Dodge, because Dodge grows with open hexes around the unit. The Editor saw the same thing playing a Light vs Light 7v7 against Kit C (seed MQVV-DBL7-F7ZM): tight lines, and no real Evades. We can't judge Evade until a bot can play it.

**Added 18 Nov, from a Kit D vs Kit D game the Editor watched** (build 5, v3.4, 7v7 all Light, seed TJBH-QBDJ-395W; the design chat replayed it):
- **Kit D moves units "to attack" and then can't afford the attack.** 40 times a unit moved with the reason "to attack X". In 16 of them the target was still alive at the end of the turn and the unit never attacked. Almost every turn ended with 0–0.5 Command left. In contact turns (3 to 5), each side spent 4–5.5 of its 10 Command moving units that never attacked, and made only 2–3 attacks. The likely cause, not isolated: the planner moves every attacker into place before attacking and doesn't reserve the Command for the attacks. This is why the Editor saw flanked enemies with Dodge 0–5% left untouched.
- **Bracing is backwards.** On turns 1–2, with the nearest enemy 6–7 hexes away, North braced 6 units (6 of its 10 Command) and South braced 3. Each braced unit then starts its next turn with 2 Stamina instead of 3. Once in contact, neither side braced at all, because the Command was gone.
- **Units bunch up,** which cuts their own Dodge.

This matters beyond Light play. Brief 005 concluded stalls are likely built into the rules. But if Kit D wastes about a third of its Command, a mirror match between two Kit Ds may stall for bot reasons too. This build re-runs the stall baseline to tell the two apart.

## Scope
In: Kit D's Command budgeting and bracing (every unit type); Light-unit play (planning, Evade, spacing); re-running 004's Evade measurements and 005's stall baseline with it. Out: any rule change, Heavy-unit play, Cavalry, specials, the coaching-engine rework. Kit A–C, Standard and Easy stay exactly as they are.

## What to build
0. **Budget Command before moving.** The planner counts the Command for the whole plan (moves *and* attacks) before taking the first step. It never moves a unit "to attack" unless the Command for that attack is still reserved after every earlier step in the plan. It prefers attackers that are already in range, so it gets more attacks from the same Command. If the plan can't be afforded, it shrinks the plan (fewer attackers, or a nearer target) rather than starting it.
0b. **Brace when it matters.** Brace a unit only if the enemy can actually reach and hit it next turn, counting the enemy's movement, range and Command. Weigh the 1 Command and the lost Stamina next turn against the damage saved (−2 per hit), times the number of hits the enemy can realistically afford. Attacks come before braces; leftover Command goes to bracing the units most likely to be hit. A Light unit braced far from the enemy is a waste. The Report shows it stopped happening.
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
0. **Command use,** before and after, on balanced and all-Light lineups: Command spent on moves by units that didn't attack that turn; "moved to attack, never attacked, target still alive"; attacks per turn in contact; braces made with no enemy able to hit that unit next turn. Targets: "moved to attack, never attacked" under 10% of such moves, and far braces near zero.
0b. **Stall baseline again** (Kit D after this build, both sides): the full baseline table at v3.4, 1,000 games per format (F23), next to brief 005's Kit D numbers. Plain-language read: did stalls drop once the bot stopped wasting Command? This decides whether the next build is a rule change (Gates open, Golden flag) or more bot work.
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
One Light vs Light 7v7 against Kit D. Watch whether its Light units hit and step back, stop moving in tight lines, attack flanked units, and brace only when an enemy is close. Then watch one Kit D vs Kit D game at 5v5 (both sides set to Computer) to see whether it still stalls.

## Report back
The standard Report, the five measurements, and a plain-language verdict on Evade: with a bot that can use it, does it keep Light units alive? If not, say what the numbers point to (the rule, or still the bot), and say whether the cause is isolated. Then the same verdict on stalls: with Command no longer wasted, do mirror matches still end on the clock?

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
