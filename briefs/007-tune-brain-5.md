# Brief 007 — Tune Brain 5: settings, the clock, Evade steps, stalls

| | |
|---|---|
| Game version | **v3.06.00** (from v3.05.00). YY goes up because this adds a new brain, Brain 6 |
| Rule set | none (bot only; no rule change; v3.4 stays the newest) |
| Date | 2026-11-18 |
| Goal | A tuned brain, **Brain 6**, built from Brain 5: its settings re-tuned from brief 006's settings review, aware of the turn limit, and better at leaving itself an Evade step. Then measure stalls again. |
| Branch | `build/007-tune-brain-5` |
| Flags | F25 (clock), F22 (Evade steps, bot side only), evidence for F10, F11, F12 |

**Order:** PR #9 (brief 006, Brain 5) is merged, so build on `main`.

## Context
Brief 006 gave us Brain 5. It plans its whole turn within budget and beats Kit D in every format. But mirror games still end on the turn limit about half the time (45.0% at 7v7, 55.3% at 5v5, 1,000 games each). Most of those games are now tiebreak wins, not draws.

For stalls, the Editor's ruling is **bot before rules** (18 Nov). The game design changes only if several brains fail, and the Editor decides when that point comes. Rule options (gates open, golden flag, a 2-hex Evade allowance) stay parked in the Ideas Log. Don't build them, even behind a switch.

Brief 006's Report left three bot leads:
- **Settings review.**
  - `stamina`, `pressure` and `plan5.beam` showed no effect on results.
  - `pull`, `flagDanger` and `home` changed how games end, not who wins.
  - With `advance` off, Brain 5 almost never won outright, yet won more games overall by sitting back and taking the tiebreak (+2.1 SE, 200 games). Likely, not isolated.
- **F25, the clock.** Brain 5 scores turn 3 and the last turn the same way. It never plays for the tiebreak, and it never pushes when it's behind with the clock running out.
- **F22, Evade steps.** Brain 5 found no legal Evade step 24–34% of the time (target under 20%). Code's read: most of that is movement used up on the approach, which is a rules question. This brief tries the bot side once, honestly, and measures it.

Game Laws that apply: 2.7 (turn limit and tiebreak; the board plays 25 turns at 5v5 and 35 at 7v7 since v3.4), 6.5 (Evade), 6.6 (tackle at hex cost), 3.8 (Mark).

**Naming.** Brain 5 stays frozen, like Kit D in brief 006, so brief 006's numbers stay comparable. The tuned brain is **Brain 6** (short form Br6, written "Brain 6" in full on screen). It becomes the default only if it passes measurement 2.

## Scope
In:
- Brain 6, a copy of Brain 5 with tuned weights, one new clock term, and Evade-aware planning.
- Weight sweeps from brief 006's settings review.
- The full stall re-check, and a settings review of Brain 6.
- The game version on the board (item 7).

Out:
- Any rule change or new preset.
- Cavalry, specials, the attack preview UI.
- F24 (think time). It's built only if the Editor's phone check on Brain 5 shows a noticeable wait; that would be its own brief.
- Removing any setting. Recommend it in the Report; the Editor decides.

## What to build
1. **Copy Brain 5 as Brain 6.** Every change below goes into Brain 6 only.
2. **Tune the weights from evidence.** Sweep each of Brain 5's 11 settings, plus the new one in item 3, against frozen Brain 5:
   - Try 0, half and double first. Refine only where a direction shows up.
   - Use balanced and all-Light lineups at 5v5 and 7v7.
   - Keep a change only if it beats Brain 5 by at least 2 standard errors at 1,000 games per side (F23). Report every tried value, including the ones that lost.
   - Score candidates on **two things side by side**: win share against Brain 5, and the share of Brain 6 mirror games that end on the turn limit. Never fold them into one number. If the strongest setting makes stalls worse, report both options and recommend one; the Editor picks.
   - The `advance` result is the warning: a brain can win more by stalling more. Tuning on win rate alone could make stalls worse.
3. **Teach it the clock (F25), inside the value model.** Add one term, not a rule:
   - The value of the side's tiebreak standing (more damage on the enemy flag first, counting hits on its holder as F20 says, then fewer units lost, Game Laws 2.7).
   - It is weighted by how close the last turn is. It is worth nothing early and grows as the limit nears.
   - It has to work both ways. A side behind on the tiebreak should value changing it more as time runs out (attack the holder, pull, trade). A side ahead should value keeping it.
   - Expose it as settings with plain labels on the Brain screen, for example "Clock weight" and "Turns of clock pressure".
   - No "on turn N do X" rules. If something can't be expressed as gained, risked or next turn, raise it as an `ASK`.
4. **Plan for the Evade step (F22, bot side).** When Brain 6 scores an adjacent attack by a Light unit, it already prefers attack hexes with a safer step. Now it should also value keeping enough Stamina, movement cap and Command to take that step, and approach from a hex that leaves one. This comes from risk (the step lowers expected damage next turn), not a new habit.
   - Report "no legal step" against Brain 5's 24–34%.
   - If it doesn't fall under 20%, say so plainly and say whether the remaining cases look like movement used up on the approach. That's the evidence the Editor needs for the rules question. Likely or isolated, say which.
5. **Settings review of Brain 6** (standard for every brain build, see `CLAUDE.md`):
   - which settings showed no effect
   - which settings change how games end, not who wins
   - which situations no setting fixes, as `ASK` rows.
6. **Brain 6 becomes the default** only if it beats Brain 5 in at least three of the four formats (measurement 2) and doesn't raise the turn-limit share in any format by more than noise. Otherwise Brain 5 stays the default. Brain 6 stays in the list either way.
7. **Show the game version on the board.** The Editor's rule (18 Nov): one global version, vX.YY.ZZ, is the reference for rules, brains, UI and board. X is a big new system (Cavalry will be v4.00.00), YY a real change to any part (a new rule, brain or screen), ZZ tuning and fixes. Each part keeps its own number. The design chat picks the version and states it in each brief; Code doesn't choose it.
   - Add `game: "v3.06.00"` to `board/version.js`, beside `build`. It stays the only place either number is kept.
   - Wherever the board shows "Build N" today (the version line and the Matches screen), show the game version instead: "Playtest board · v3.06.00 · Rules v3.4". A preview copy keeps its "Preview of PR #N".
   - Each saved match records the game version it was started on, next to `build`. If a match was started on a different version, show it as the build is shown now ("started on v3.06.00"). Older matches with no version show their build number, as now; never guess a version for them.
   - `build` stays as the internal counter the `checks` workflow uses. Extend `.github/check-build-number.sh`: a change to `board/` must also change `game`. Each brief states the new value.
   - `CHANGELOG.md` headings carry both from now on: "## v3.06.00 (Build 7) — Brief 007, …".

## Rules it touches
None change. Brain 6 must model these correctly and pick only legal actions:
- the turn limit (25 at 5v5, 35 at 7v7) and the tiebreak order: flag damage, then units lost, then draw (Game Laws 2.7)
- Evade: only after an adjacent attack, none after a kill, a Reach or ranged attack, or a pull; may use remaining movement, Stamina and Command; stops on entering a new zone (6.5)
- tackle at hex cost, and its hex of the cap (6.6)
- Mark: a hard stop on entering (3.8)
- Command and Stamina, Brace, Dodge room, Support, the flag pool and pulls.

## Bot minimum
This build is the bot work. It's met when every measurement below has a number, and Brain 6 shows clock-aware play in the Report: on the last 3 turns, the share of turns where the side behind on the tiebreak attacks the holder or pulls, compared with Brain 5.

## Measurements
All with `tests/rng.js`, tiebreak wins counted separately, 1,000 games per side or format (F23). Same seeds as brief 006 where the setup matches.
1. **Weight sweeps** (item 2): every value tried, win share against Brain 5, and turn-limit share in mirrors.
2. **Head-to-head: Brain 6 vs Brain 5.** Balanced and all-Light, 5v5 and 7v7. Report decisive wins and tiebreak wins separately.
3. **Clock play:** on the last 3 turns, attacks on the holder and pulls by the side behind on the tiebreak, Brain 6 against Brain 5 mirrors. Also how often the side ahead at turn limit −3 still wins on the tiebreak.
4. **Evade:** no legal step, Evade taken where a safer hex existed, Light units removed per game, average Dodge when attacked. Brain 6 next to Brain 5.
5. **Stall re-check:** the full baseline table at v3.4 for Brain 6 vs Brain 6, 1,000 games per format, next to brief 006's Brain 5 table: holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games. This is data for the Editor, not a trigger for a rule change.
6. **Speed:** average and worst time per turn, next to Brain 5's. Flag it if the worst turn rises above 4.6 s.

## Must not change
- Every existing preset plays and replays identically.
- Brain 5, Kit A–D, Standard and Easy play exactly as before (bot-driven regression hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board, plus the one-off per-brain hashes from brief 006 (Brain 5 included).
- Brain 6 never picks an illegal action over 30 seeded games per format, balanced and all-Light.
- A test that the version line and a saved match show v3.06.00, and that a match saved on Build 6 still shows "Build 6".
- The version check fails a change to `board/` that leaves `game` unchanged.
- Two test positions, each showing the model's reasoning:
  - Last turn, behind on the tiebreak by less than one attack's damage, with an attack on the enemy holder possible: Brain 6 attacks; with 15 turns left it may not.
  - Last turn, ahead on the tiebreak: Brain 6 doesn't trade a unit for nothing (losing a unit could flip the "fewer units lost" step).

## The Editor's hands-on check
1. The version line on the board reads v3.06.00.
2. One balanced 7v7 against Brain 6 played to the turn limit or a finish. Watch the last 5 turns: does the side behind push?
3. One Brain 6 vs Brain 6 game at 5v5 (both sides Computer). Does it still stall?

## Report back
The standard Report and the six measurements. In plain words:
- Which weights changed, by how much, and why.
- Does knowing the clock end more games, or make the side ahead sit on its lead?
- Did planning for Evade bring "no legal step" under 20%? If not, does the rest look like a rules question?
- With a tuned, clock-aware bot, do mirror matches still end on the clock?

Say whether each cause is isolated or only likely.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review:**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
