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
In: a new brain, Kit D, with a turn planner for the behaviours below; preset v3.4 with a per-format turn limit; measurements; clearer Evade and blocked-action messages (item 4, screen text only). Out: Cavalry, specials, the full coaching-engine rework (that comes after Cavalry and specials), and any rule change other than the 7v7 turn limit.

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
4. **Evade messages (screen only, no rule change).** Found by the Editor playing build 4: a Light unit next to a Tackle unit attacked, the attack preview said "Evade after: up to 1 hex", and then the board said "No hex to evade to". The real reason was tackle: breaking it needed 1 Stamina (0.5 had) and 2 hexes of cap (1 left). The engine was right; the words were wrong. Fix both:
   - The pre-attack Evade preview counts tackle (its Stamina and the cap hex) and the direction rule, so it never promises a step that won't exist. If it can't tell for sure, it says so instead of giving a number.
   - When an evading unit has no legal step, the board says why, from the engine: out of Stamina, out of Command, moved its full cap, tackled by a named unit (needs X, has Y), or no free hex further from the target.
   - Wherever an action button is greyed out, the board shows the reason the same way (for example "Needs 1 Command, 0.5 left"). Every reason comes from the engine, never worked out separately on screen.
   Test: the Editor's case (rebuild it from the match he played, seed MQVV-DBL7-F7ZM, turn 9, South LA at E2) shows the tackle reason.

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
  - **Preset `v3.4`**, last in `PRESETS`: v3.3 with switch `turnLimitByFormat` and numbers `turnLimit5` (25) and `turnLimit7` (35). The size comes from the unit cap per side. Older presets keep 25 for every format. The Settings screen shows "N turns per player at <format>", and the top bar counts to the match's own limit (from the engine). The bot's late-game timing reads the same limit, which changes nothing for older presets.
  - **Kit D** (`brain.js`, `bot.js` planAction): Kit B plus a turn planner, chosen again after every action. It collects every attack its units can make this turn (moving first where needed), with damage from the engine after Armor, Brace, Dodge and Support. It then plans:
    - **Focus fire:** pick a target the team can remove and commit enough attackers, on distinct hexes, moves first so each attack gets Support. If nobody can be removed, pile on the enemy closest to removal, but only with attacks Kit B's own scoring doesn't count as harmful. It keeps the same target through the turn.
    - **Crack the fort:** needs two attackers in the goal zone (unless one attack is a near-certain kill). Against a braced Heavy Melee holder, the least valuable attacker goes first and takes the parry.
    - **Finish:** pull an empty enemy flag whenever a unit can reach it. When only the enemy holder is left (or one unit besides it), every unit but our holder heads for their goal zone.
    - **Pick off the weak** (value per point of damage needed, Light first) is built but **switched off** (see the measurements).
    - Kit B's caution and guarding stay: our holder never leaves its flag to attack, and anything the plan doesn't cover falls back to Kit B unchanged. Kit A–C, Standard and Easy are untouched.
  - **Kit D is the default opponent** (it beat Kit B: measurement 1).
  - **Item 4, Evade and blocked-action messages** (screen text, from the engine):
    - The Evade preview now plays the evade on a scratch copy, so it counts tackle (Stamina and the cap hex) and the direction rule. If the parry could remove the attacker first, it says so. When no step will exist, it says "No Evade after this attack: <reason>".
    - An evading unit with no step says why (`whyNoMove`): out of Stamina, out of Command, full cap, tackled by a named unit (needs X Stamina and 2 hexes, has Y and Z), stopped in a zone, or no free hex further from the target.
    - Every greyed-out button is tappable and shows its reason (`blockReasons`), for example "Needs 1 Command, 0.5 left", "HR is reloading this turn", "Only Anti-Cavalry units can Reach", "No special actions in this rule set yet". Undo's reason ("the dice have been rolled") comes from the board, since Undo is a board feature, not a rule.
  - **Tests:** `test_v34.js` (20 checks: 5v5 25 and 7v7 35 on v3.4, 25 on every older preset, matches really end on those turns, tiebreak at 35). `test_reasons.js` (18 checks, including your case rebuilt). `test_kitd.js` (Kit D legal over seeded games; Kit D = Kit B plus the planner; older brains have none). All are in `checks`; `test_kitd.js` runs 6 games per format there and 30 at night. Build 5.
- **Anything beyond the brief, and why:**
  1. **"Unit cap" on screen** (CLAUDE.md's new rule): the lineup counter, the Unit data field, the Matches column and the tiebreak wording now say unit cap instead of "beings". The engine's own words stay unchanged, so old matches replay with the same hashes; the board swaps the word when it displays them.
  2. **Your case from build 4 (seed MQVV-DBL7-F7ZM) is rebuilt by hand,** not replayed. The repository has only the seed, not the moves. The test sets up the same position: a Light Anti-Cavalry next to a tackling unit, with 0.5 Stamina and 1 hex of cap after its attack. It checks the preview now promises 0 hexes and says "Tackled by LM: breaking away needs 1 Stamina and 2 hexes of movement; has 0.5 Stamina and 1 hex". If you copy that match's record from the Matches screen, I'll add it as a replay test.
  3. **`test_v33.js`:** its preview check now expects the exact count (4 hexes away from tackle, 3 next to a tackling unit), and its "v3.3 is the newest" check moved to `test_v34.js`.
  4. **`baseline.js`** accepts a brain with planner switches changed (e.g. `kitD:fort=0`), on the same seeds as plain Kit D, for the ablation.
  5. The study output is saved in `data/sim_study9/`.
- **Checks run and results (paste regression hashes):**
  - Locally (Node.js 22): test_rules pass; test_v1 12/0; test_v3 10/0; test_v31 22/0; test_v32 57/0; test_v33 59/0; **test_v34 20/0**; **test_reasons 18/0**; **test_kitd 30 games per format: 0 refused, 0 errors, 0 unfinished**; test_rng 7/0; replay of Match 3: 386 checks, 0 mismatches; test_invariants (v3.4, 30 games): 0 problems.
  - Proof the tests bite: `test_v34.js` with the switch off gave 4 failures. `test_reasons.js`'s case fails on build 4, where the preview was a bare number (1).
  - **`regress_engine.js … 3`, board before this build vs after:** match3 `37397ef2bd3ed86b`, v1 `7b25bca651c0cb31`, v2 `ddbe5fc437ff4e9d`, v3 `26371927b53d4413`, v3.1 `c71e4cd12fc984b0`, v3.2 `f62a061d2c147d83`, v3.3 `e6151bf463d6c9f8`. All identical. These games are played by Standard, Kit B and Kit C, so they also show those bots unchanged. v3.4 is the newest preset, so it isn't hashed.
  - In a browser (phone width): the top bar showed "4/35" in a v3.4 7v7 match. A greyed Special said "No special actions in this rule set yet". While a unit was evading, Brace said "LA attacked this turn and may only evade or end". The Evade preview showed an exact count. No page errors.
- **Measurements:** all with `tests/rng.js`, balanced lineups, the usual 20 batches of 20 games per format, and tiebreak wins counted apart.
  1. **Kit D vs Kit B on v3.3 (400 games per format): target met.**
     - 7v7: Kit D won 191 decisive games, Kit B 87 (**69%**). Tiebreak wins 63–39, 20 draws; counting tiebreak wins, Kit D took 67% of non-drawn games.
     - 5v5: decisive 88–30 (**75%**), tiebreak 19–26, 237 draws; 66% counting tiebreak wins.
     - **Ablation** (each behaviour off, about 120 games per format over two rounds, same seeds as plain Kit D), Kit D's share of decisive games against Kit B:

       | Variant | 7v7 | 5v5 |
       |---|---|---|
       | All four on | 67% | 68% |
       | Focus off | 27% (60 games) | 47% (60 games) |
       | Pick off the weak off | **80%** | 73% |
       | Fort off | 58% | 69% |
       | Finish off | 66% | 73% |

       Focus is the whole gain. Pick off the weak made Kit D worse at 7v7 in both rounds, so it ships switched off. Without it, 5v5 had more turn-limit endings in round two, likely noise. Fort helps at 7v7. Finish is neutral on wins but makes nearly all of Kit D's pulls, so it stays on.
  2. **Baseline, Kit D vs Kit D, next to v3.2's Kit B** (400 games each):

     | | v3.2 Kit B 7v7 | v3.3 Kit D 7v7 | v3.4 Kit D 7v7 | v3.2 Kit B 5v5 | v3.3 Kit D 5v5 | v3.4 Kit D 5v5 |
     |---|---|---|---|---|---|---|
     | Holder KO | 244 (61.0%) | 220 (55.0%) | 214 (53.5%) | 96 (24.0%) | 125 (31.2%) | 95 (23.8%) |
     | Pull KO | 2 (0.5%) | 4 (1.0%) | 1 (0.2%) | 0 | 0 | 0 |
     | TKO | 0 | 30 (7.5%) | 29 (7.2%) | 0 | 5 (1.2%) | 5 (1.2%) |
     | Tiebreak win | 109 (27.2%) | 131 (32.8%) | 146 (36.5%) | 32 (8.0%) | 57 (14.2%) | 53 (13.2%) |
     | Draw | 45 (11.2%) | 15 (3.8%) | 10 (2.5%) | 272 (68.0%) | 213 (53.2%) | 247 (61.8%) |
     | Ended on the turn limit | 154 (38.5%) | 146 (36.5%) | 156 (39.0%) | 304 (76.0%) | 270 (67.5%) | 300 (75.0%) |
     | Pulls (games with a pull) | 6 (4, 1.0%) | 8 (6, 1.5%) | 2 (1, 0.2%) | 1 (1, 0.2%) | 0 | 0 |
     | Average turn | 19.3 | 17.5 | 22.4 | 22.9 | 21.7 | 22.5 |

     **A noise warning (F23):** v3.4 at 5v5 has exactly the same rules as v3.3, yet the two runs ended on the turn limit in 75.0% and 67.5% of games. That's the spread between two seed sets for the same game, so gaps of a few points in this table aren't evidence.
  3. **The targets:**
     - **Turn-limit endings under 20%:** not met. 7v7 36.5% (v3.3) / 39.0% (v3.4); 5v5 67.5% / 75.0%.
     - **Draws under 5%:** met at 7v7 (3.8% / 2.5%); not met at 5v5 (53.2% / 61.8%).
     - **Pulls in at least a quarter of games:** not met. 7v7 1.5% / 0.2%; 5v5 0% / 0%.
  4. **First mover at 5v5 under Kit D (F12):** won 16 of 130 decisive games (12%) on v3.3 and 13 of 100 (13%) on v3.4. At 7v7, 110 of 254 (43%). The 5v5 imbalance is still there with a better bot, so it's likely the first player's turn-1 Command (6 instead of 10), not isolated.
  - **Plain-language read: neither fixed the stalls.**
    - The bot is now clearly better. Kit D beats Kit B two to one, wipes out whole squads sometimes (TKOs appear for the first time), and cuts 7v7 draws to under 5%.
    - But Kit D against Kit D still ends on the clock in over a third of 7v7 games and two thirds of 5v5 games, and almost never pulls.
    - The 35-turn limit didn't help 7v7: games ran about 5 turns longer and ended on the clock just as often. Stalls are likely built into the game (a held flag is too strong to crack before the clock), not isolated.
    - That points to the rule changes you held back ("gates open", golden-flag overtime: F14).
- **Bot minimum (met / not met, with numbers):** met. Every target above has a number. Kit D picked 0 illegal actions in 60 seeded games, and none in the 2,400 measurement games either: 0 refused across every batch.
- **Known gaps:**
  1. The stall targets aren't met. That's the finding, not a bug.
  2. Kit D uses the balanced lineup; Kit C's heavy squad isn't combined with the planner. A Kit D plus heavy-squad variant is untested.
  3. Kit D's Support estimate is approximate: helpers that move in count once per attack.
  4. Your build-4 match is rebuilt by hand, not replayed (see beyond the brief, item 2).
  5. Kit D wasn't measured against Kit C (the previous default). The brief asked only for Kit D against Kit B.
- **Flags closed / opened:** Updated F10, F11, F12 with this evidence (still open: they need a design answer). Opened F23 (ASK).
- **Pull request:** see the pull request that adds this Report.
