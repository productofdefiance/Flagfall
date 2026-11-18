# Brief 005 — The bot learns to crack a fort; 7v7 gets 35 turns

| | |
|---|---|
| Rule set | v3.4 (new preset, copied from v3.3) for the turn limit only; the bot work applies to all presets |
| Date | 18 Nov 2026 |
| Goal | Find out how much of the stalling is the bot's fault and how much is the turn limit, before any rule is changed to fight stalls. |
| Branch | `build/005-crack-the-fort` |
| Flags | F10, F11 (stalls), F12 (first mover at 5v5) |

## Context
Most bot games end on the turn limit: 38% at 7v7 and 76% at 5v5 on v3.2, with almost no pulls. The Editor's view (18 Nov): part of this is the bot and part is the game's design. Two cheap fixes come first; rule changes such as "gates open" or golden-flag overtime only if both fail.
1. **The turn limit was meant for 5v5.** 7v7 should get about 35 turns (a first guess).
2. **The bot can't crack a fort.** It doesn't focus fire, pick off weak units, or go for the flag when only the holder is left.

**Start after Brief 004 is merged** (this builds on v3.3). Update this branch from `main` first.

**Lesson from before:** batch B tried "focus fire" and "target priority" as weights, and both made the bot worse. The bot picks one action at a time, so it can't coordinate a turn. This brief asks for a **turn planner**, not more weights.

## Scope
In: a new brain, Kit D, with a turn planner for the behaviours below; preset v3.4 with a per-format turn limit; measurements. Out: Cavalry, specials, the full coaching-engine rework (that comes after Cavalry and specials), and any rule change other than the 7v7 turn limit.

## What to build
1. **Preset `v3.4`** = v3.3 with a per-format turn limit: **5v5 25 turns, 7v7 35 turns** (turns per player, as now). Older presets keep 25 for every format. Show the turn limit for the chosen format on the Settings screen.
2. **Brain `Kit D`** (Kit B plus a turn planner), added to the Opponent list. At the start of its turn, and again after each action, it plans the rest of its turn as a sequence:
   - **Focus fire:** pick the enemy unit (or held flag pool) the team can remove this turn, using expected damage after Armor, Brace, Dodge and Support, and commit enough attackers to it. If no unit can be removed this turn, pile damage onto the one closest to removal.
   - **Pick off the weak:** when choosing among targets, prefer the most value removed per point of damage needed: low HP, Light, damaged units first; the flag pool when it's within reach.
   - **Crack the fort:** against a held flag, bring at least two units into its goal zone before attacking the holder, so attacks get Support. Order attacks so the parry (once per enemy turn) is taken by the least valuable attacker. Don't feed single units into a braced holder with no follow-up.
   - **Finish:** when the enemy has only its holder left, or only one unit besides it, every unit that isn't needed to guard its own flag heads for the enemy goal zone. Pull an empty enemy flag whenever a unit can reach it.
   - Keep Kit B's caution and guarding, so it doesn't throw its own flag away.
   Keep Kit B unchanged for comparison. If a behaviour makes Kit D worse in testing, say so and leave it switched off rather than dropping it silently.
3. **Kit D becomes the default opponent** only if it beats Kit B (item 4); otherwise Kit C stays the default and the Report says why.

## Rules it touches
Turn limit and its tiebreaks (v3.4 only). The bot must still pick only legal actions from the engine.

## Bot minimum
This build is the bot work. Met when every target below has a number in the Report.

## Measurements (the point of this build)
All with `tests/rng.js`, balanced lineups, the same batches as earlier baselines, tiebreak wins counted apart.
1. **Kit D vs Kit B** head-to-head, 400 games per format, on v3.3. Target: Kit D wins at least 55%.
2. **Baseline table, Kit D vs Kit D**, 400 games per format, on **v3.3** (bot effect alone) and on **v3.4** (bot plus the 7v7 turn limit), next to v3.2's Kit B baseline. Add rows: games where any pull happened, holder KOs, average turn.
3. **Targets the Editor will judge against** (proposed by the design chat, adjustable): turn-limit endings under 20% in both formats, draws under 5%, and pulls happening in at least a quarter of games. Report each one as met or not met.
4. The first-mover win rate at 5v5 (F12) under Kit D.

## Must not change
Every existing preset plays and replays identically. Kit A–C, Standard and Easy play exactly as before.

## Checks before opening the pull request
- Every check in `README.md`, plus `test_v34.js` (the turn limit per format, and that older presets still end at 25).
- A test that Kit D never picks an illegal action over 30 seeded games per format.

## The Editor's hands-on check
One 7v7 game against Kit D on the play link. Watch whether it gangs up on one unit at a time and goes for your flag when you're down to your holder.

## Report back
The standard Report, the four measurements above, and a short plain-language read: did the bot fix the stalls, did the turn limit, both, or neither?

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Measurements:**
- **Bot minimum (met / not met, with numbers):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
