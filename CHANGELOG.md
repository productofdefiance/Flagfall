# Changelog

Newest first. One entry per build, written for the Editor: what a player notices first, then what changed under the hood.

## Game versions

| Game version | Rule set (newest) | Default brain | UI | Build |
|---|---|---|---|---|
| v3.08.01 | v3.5 | Brain 5 | v2 | 12 |
| v3.08.00 | v3.5 | Brain 5 | v2 | 11 |
| v3.07.00 | v3.4 | Brain 5 | v2 | 10 |
| v3.06.00 | v3.4 | Brain 5 | v2 | 9 |
| v3.05.02 | v3.4 | Brain 5 | v1 | 8 |
| v3.05.01 | v3.4 | Brain 5 | v1 | 7 |
| v3.05.00 | v3.4 | Brain 5 | v1 | 6 |
| v3.04.00 | v3.4 | Kit D | v1 | 5 |

## v3.08.01 · Build 12 — Brief 016, stall logging (lab only) (19 Nov 2026)
Rule set: none changed (v3.5 stays the newest). Game version **v3.08.01** (ZZ: lab tooling, nothing about how the game plays changes).

**What a player will notice**
- Nothing on the board changes.
- Every lab run's summary now has three **Stalls** lines: when fighting starts and stops on average, how many quiet side-turns a turn-limit game ends with, and the share of turn-limit games whose last damage came 5 or more side-turns before the end (a starting cut for the stall study, not a definition).
- Lab results pull requests can't jam each other any more (F35). If one falls behind `main` with a conflict, the lab fixes it within the hour and it still merges itself.

**Under the hood**
- `sims/lab/measures.js`: a new `stall` measure collected on every run: first contact, first attack, last damage, quiet side-turns, braces in the last 5 turns, what each side has left at turn limit − 3 and at the end, and what decided a turn-limit game. `merge.js` writes `tables/stall.csv` (totals and averages) and the summary lines.
- `sims/lab/index.js`: `INDEX.md` and `index.csv` are rebuilt from the run folders (and `results/nightly.csv` for quiet nights) instead of edited, byte for byte the same as before. New workflow `results refresh` (hourly and on pushes to `main`) merges `main` into a stuck results pull request and rebuilds them.
- `sims/lab/record.js`: runs the Editor's copied match records (`data/human_records/`) through the same measures as lab games.
- New check `sims/lab/test_stall.js`; runs in `checks`. A "before" study (`stall-before`, 1,000 balanced games per format on v3.5, same seeds as v3.08.00's release) is the stall baseline for later builds.

**Flags closed:** F35. **Opened:** F36 (the summary's 5-side-turn stall cut catches every turn-limit game).

**The stall "before" (balanced Brain 5 mirrors, v3.5, 1,000 games per format):** in turn-limit games the last damage comes on turn 11.1 (5v5) and 12.7 (7v7), followed by 28 and 46 side-turns with no attack or pull; at turn limit − 3 each side has its holder and under one other unit. Full table in the brief's Report.

## v3.08.00 · Build 11 — Brief 010, rule set v3.5: a little variety in normal rolls (19 Nov 2026)
Rule set: **v3.5** (new, the new-game default) = v3.4 plus switch `diceVariety`. Game version **v3.08.00** (YY: a new rule set; brief 007 took v3.07.00 first).

**What a player will notice**
- New games start on rule set v3.5. Normal hits are no longer all the same: two dice totalling 4–5 deal 10% less, 9–10 deal 10% more, 6–8 as before. 2, 3, 11 and 12 are unchanged. The average hit is the same.
- The attack preview's outcome bar now shows up to 7 outcomes instead of 5 (it still merges outcomes that round to the same damage, so a small hit of 2 shows 5).
- Pulls use the same dice.
- v3.4 and every older rule set play exactly as before; saved v3.4 matches replay the same.

**Under the hood**
- `engine.js`: the v3.5 dice cases (7 instead of 5) and one multiplier function; both brains already average over the dice cases, so they play v3.5 with no brain change.
- `data.js`: preset v3.5. `app.js`: the "Dice variety" switch on the rule-set editor.
- New check `test_v35.js` (bands, chances, average, rounding, Dodge after the roll, pulls, the pooled flag, seeded bot games); runs in `checks`.
- Lab: the `play` measure also counts turns a brain ended on an error (`bot_errors`).

**Flags closed:** none. **Opened:** F33 (the first mover wins more decisive games on v3.5), F34 (±10% rounds away on hits of 1–2).

**Baseline (balanced, Brain 5 mirror, 1,000 games per format, same seeds on both rule sets)**

| | 5v5 v3.4 | 5v5 v3.5 | 7v7 v3.4 | 7v7 v3.5 |
|---|---|---|---|---|
| Holder KO | 4.8% | 4.2% | 3.2% | 4.3% |
| Pull KO | 28.1% | 27.5% | 40.0% | 40.8% |
| TKO | 14.5% | 12.1% | 13.6% | 11.6% |
| Tiebreak win | 51.1% | 54.6% | 39.8% | 38.3% |
| Draw | 1.5% | 1.6% | 3.4% | 5.0% |
| Ended on the turn limit | 52.6% | 56.2% | 43.2% | 43.3% |
| Games with a pull | 28.1% | 27.5% | 40.1% | 41.0% |
| Average turn | 18.78 | 19.13 | 22.47 | 22.54 |
| First mover's share of decisive | 30.0% | 37.7% | 42.6% | 52.4% |

All gaps except the first mover's share are under 8 points (noise, F23).

## v3.07.00 · Build 10 — Brief 007, Brain 6: Brain 5 tuned, the clock, Evade steps (19 Nov 2026)
Rule set: none changed (v3.4 stays the newest). New brain **Brain 6**; Brain 5 stays the default. Game version **v3.07.00** (YY: a new brain; brief 009 took v3.06.00 first).

**What a player will notice**
- A new opponent in the list, **Brain 6 (knows the clock)**: Brain 5 that values winning the tiebreak as the turn limit nears. On the last turns the side behind goes for the enemy holder when it can, and the side ahead stops throwing units away.
- Brain 5 is still the default: Brain 6 ties it (50.1% of 4,000 games) and didn't beat it in three of the four formats, the bar for becoming the default.
- Brain 6's new settings are on the Opponent screen: "Clock weight", "Turns of clock pressure", and "Keep an Evade step" (off by default, F31).
- The game version shows on Home and in saved matches with the build number ("v3.07.00 · Build 10"). Matches saved before Build 7 still show "Build 6".

**Under the hood**
- `bot.js`: Brain 6's clock term (the tiebreak's likely outcome, from each side's chance to change it from the goal zone on its remaining turns) and the "Keep an Evade step" cost; Brain 5 and every older brain play exactly as before.
- `version.js`: the game version beside the build, with the line and "started on" helpers; the version check also requires the game version to change.
- Weights tuned on the lab, in two stages: a screen of every setting at 0, half and double (33,600 games), then the promising ones at 1,000 games per format against Brain 5 and in mirrors (60,000 games). Results in `results/`.
- Lab fixes found while running it: a pull request's later push no longer replays its job orders; night checks on a pull request no longer start a lab run on `main`; big runs get a one-line answer.

**Flags closed:** F25 (clock), F28, F29. **Opened:** F31 (Keep an Evade step on or off), F32 (the side behind has nothing left to push with). **Updated:** F10, F11, F12, F22, F24.

**Stall re-check (balanced, Brain 6 mirrors vs Brain 5 mirrors, 1,000 games per format, same lab run)**

| | Brain 6 5v5 | Brain 5 5v5 | Brain 6 7v7 | Brain 5 7v7 |
|---|---|---|---|---|
| Holder KO | 4.2% | 3.4% | 3.1% | 4.4% |
| Pull KO | 28.0% | 29.1% | 43.5% | 39.6% |
| TKO | 12.2% | 12.3% | 14.0% | 13.9% |
| Tiebreak win | 55.3% | 53.0% | 38.0% | 39.2% |
| Draw | 0.3% | 2.2% | 1.4% | 2.9% |
| Ended on the turn limit | 55.6% | 55.2% | 39.4% | 42.1% |
| Games with a pull | 28.0% | 29.2% | 43.6% | 39.6% |
| Average turn | 19.16 | 19.08 | 21.62 | 22.29 |
| First mover's share of decisive games | 33% | 30% | 45% | 44% |

## v3.06.00 · Build 9 — Brief 009, UI v2: attack preview, unit card, top bar and Options menu (19 Nov 2026)
Rule set: none changed (v3.4 stays the newest). No brain changed. UI v1 → **v2**. Game version **v3.06.00** (YY: new screens).

**What a player will notice**
- **Attack preview.** Picking a target opens a new sheet: both units face off (North always on the left), with only the numbers this attack changes (Strength, Support, Evade; Armor, Brace, Dodge, Parry). A number that changes shows the old one struck through, then the new one, red when it hurts you (a Heavy Ranged next to an enemy: 9 → 4.5). Below, the outcome bar: one slot per dice outcome with its chance and damage, kills in red, equal neighbours merged.
- **The key.** Pull the grab handle up (or tap it) for "In this attack": one line per thing in play, what it means and why it applies here (Support names the helpers, Evade says how far, Parry says what you take). Hidden by default; the first two previews say "Pull up for the key".
- **Attack and Cancel** take over the action panel while the preview is open; Attack shows the Stamina it spends.
- **Top bar.** "FLAGFALL: Arena" with an Options button; the scoreboard shows Player or Computer icons by the side names and the turn counter on its own.
- **Options menu** replaces the old match menu: format, sides, rule set, bot, seed and version at the top; Match log and record, Rules and unit data, Home, and Surrender (in red, only on a human side's live turn). Close with ✕, the dim, or Escape.
- **Unit card.** The ⓘ on the unit bar opens a full card: status chips (Reloading, Braced, Braced last turn, Holding the flag), Str / Range (or Reach) / Move, and the unit's abilities under Trait, Class and Unit, worded for the rule set in play. The swap buttons are gone from the card (dragging onto a friend still swaps).
- **Lineup.** Tap a unit's token or name for the same card, with HP, Str, Range/Reach, Move and Stamina, and a pinned "In your lineup" bar with a live stepper.
- **Action buttons.** Attack while reloading shows a red dot; Brace shows blue when braced and a blue ring the turn after; the Reach button only appears for Anti-Cavalry units.
- **Desktop.** The preview and the unit card sit in the right-hand column instead of over the field.
- Units are counted in **unit cap (UC)** everywhere; a new check fails if the board could show the old word.

**Under the hood**
- New `board/ui.js`: the preview's and the card's wording and logic, with no drawing, so it can be tested in Node.
- `engine.js`: read-only fields for the preview only (the attack's steps as numbers: Strength before and after Half Strength, Support and helpers, Armor and Pierce, Dodge; Stamina left in the Evade preview; "braced last turn" and "holding the flag" in a unit's status). No rule changed; every rule set and brain hashes the same as before (Report).
- New check `tests/test_ui.js` (in the `checks` workflow).

**Flags closed:** none. **Opened:** F30.

## v3.05.02 · Build 8 — Brief 008, the lab: heavy runs on GitHub, organised results, watch any game by seed (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). No brain changed. Game version **v3.05.02** (ZZ: nothing about how the game plays changes; brief 013 took v3.05.01 first).

**What a player will notice**
- A link can open any simulated game on the board, set up and playing: `…/Flagfall/?watch=<seed>&rules=…&n=…&s=…`. Every simulated game now has one. If the board doesn't have that game's brain or rule set, it says so instead of playing a different game; if the version differs, it warns first.
- A watched game never replaces your own match in progress, and isn't saved to the Matches list.
- Matches you set up yourself with a seed play exactly as before.

**Under the hood**
- `board/watch.js`: how the board sets up and plays a Computer vs Computer match from its seed (lineups, coin toss, deployment, the bot's steps), shared by the board and the simulators. The board's lineups moved there unchanged (checked against the old ones for every rule set, format, mix and three brains).
- The lab: `.github/workflows/lab.yml` plays job orders from `studies/queue/` on up to 20 GitHub machines (every night after the night checks, on demand, or in a pull request), and `sims/lab/` writes one run folder per order in `results/` (`SUMMARY.md`, `run.json`, `games.csv` with a replay link per game, `tables/`) plus `results/INDEX.md` and `results/index.csv`. Results reach `main` through a pull request that may only change `results/` and `studies/` and merges itself once the checks pass.
- Release runs: a pull request that changes the game version gets the baseline table at 1,000 games per format (default brain mirror, newest rule set), every check and the regression hashes, posted as a comment, and filed after the merge.
- The night checks file their result in `results/` too ("no change, passed" when `main` hasn't changed).
- Tidy: simulators moved from `board/tests/` and `data/sim_study10/` to `sims/`; the old studies moved from `data/sim_study6–10` to `results/pre-v3.05.00/` (with `git mv`; its README maps old paths to new).
- New checks: `test_watch.js`, `sims/lab/self_test.js`, and `sims/lab/board_check.js` (10 simulated games and the same games on the board play identical moves; its own job in `checks`).

**Flags closed:** none. **Opened:** F28 (results reaching `main` need two repository settings), F29 (starting a lab run from a Claude session).

## v3.05.01 · Build 7 — Brief 013, Stamina per unit, with stacking modifiers (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). Nothing plays differently: the engine is reshaped so Cavalry (Stamina 4) and Pursued can be built.

**What a player will notice**
- Nothing in play. A braced unit still starts its next turn on 2, a braced Light Ranged on 3, and the unit info shows the same.
- Home shows the game version beside the build number ("v3.05.01 · Build 7").
- Rules screen, v3.4: "Stamina after bracing 2" is now **"Brace tiredness 1"** (Stamina bracing costs next turn). New row: **"Lowest starting Stamina 1"**. Older rule sets keep "Stamina after bracing".

**Under the hood**
- Each unit card may carry its own Stamina; cards without one use the rule set's (all current cards: 3).
- Next-turn Stamina is the card's base plus a list of modifiers, each with a source (the unit itself or an enemy) and an effect. Different effects stack, the same effect counts once per turn, and no unit starts below the floor (`staminaFloor`, 1). Today's modifiers: brace tiredness (−1) and Second Wind (cancels the unit's own brace tiredness only).
- The turn start, the unit info, the Stamina pips and the brains all read one engine function (`nextStamina`).
- New test `test_stamina.js` (in the `checks` workflow): Brace, Second Wind, base Stamina per card, stacking, the floor, set spear, tackle at hex cost, refused attacks and braces, moves always paid in full, and the floor check on every card of every preset.
- `regress_engine.js … all`: hashes every preset (the newest too) against every brain.

**Flags closed:** none. **Opened:** F27.

## Build 6 — Brief 006, Brain 5: a bot that plans its turn (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). New opponent **Brain 5**, now the default.

**What a player will notice**
- The default opponent is Brain 5. It plans its whole turn before it moves, never walks a unit up for an attack it can't pay for, and braces only when enemies can actually reach it.
- Its Light units step away after a hit when that's safer (about 8 or 9 times out of 10 when a safer hex exists), and stand with more open hexes around them (Dodge when attacked about 15–17%, up from 8–12%).
- Brain 5 vs Brain 5 games rarely end in a draw (2–5%), and flag pulls are now the usual way to win. About half still go to the turn limit, but the tiebreak decides almost all of them.
- On the setup screen the opponent picker is labelled "Brain" (it said "Kit"). Saved matches against Kit A–D still load, and those brains play exactly as before.
- The Opponent screen shows Brain 5's settings in plain words (how much it fears damage, values next turn's Stamina, the flag, and so on).

**Under the hood**
- `bot.js`: Brain 5's planner (`planTurn5`) and its one score (`value5`: what it gains, what the enemy can realistically do back next turn, and how it's placed for next turn). It plans again after every roll.
- `brain.js`: Brain 5 and its 11 settings. `app.js`: the default opponent and the Opponent screen.
- `tests/baseline.js`: an all-Light lineup and the diagnosis counters. New test `test_brain5.js`: three positions plus legal play.
- Study data in `data/sim_study10/`.

**Flags closed:** none. **Updated:** F10, F11, F12, F22. **Opened:** F24, F25, F26.

**Stall re-check (balanced lineups, v3.4; Kit D 400 games per format, Brain 5 1,000)**

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

## Build 5 — Brief 005, the bot cracks the fort; 7v7 gets 35 turns (18 Nov 2026)
Rule set: **v3.4** (new; the new-game default): v3.3 with 35 turns at 7v7 (25 at 5v5). New opponent **Kit D**, now the default.

**What a player will notice**
- The default opponent is Kit D. It plans its whole turn: it gangs up on one of your units it can remove, cracks a held flag with two attackers (the least valuable one takes the parry), and goes for your flag when you're down to your holder.
- 7v7 games last up to 35 turns. The Settings screen shows the limit for the chosen format, and the top bar counts to it.
- The Evade preview never promises a step that won't exist. If tackle or anything else stops it, it says why.
- A greyed-out button explains itself when tapped (for example "Needs 1 Command, 0.5 left").
- Units are counted in unit cap (UC) on screen; the word "beings" is gone.

**Under the hood**
- Kit D's turn planner (`bot.js` planAction), with four switches. "Pick off the weak" is off because it made Kit D worse in testing.
- Engine: per-format turn limit (switch `turnLimitByFormat`), and plain-language reasons for blocked moves and actions (`whyNoMove`, `blockReasons`, an exact Evade preview).
- New tests: `test_v34.js`, `test_reasons.js`, `test_kitd.js`.

**Flags closed:** none. **Updated:** F10, F11, F12 (the stalls are not the bot's fault alone, and the longer clock didn't help). **Opened:** F23 (sampling noise).

**Baseline (balanced lineups, 400 games each)**

| | v3.2 Kit B 7v7 | v3.3 Kit D 7v7 | v3.4 Kit D 7v7 | v3.2 Kit B 5v5 | v3.3 Kit D 5v5 | v3.4 Kit D 5v5 |
|---|---|---|---|---|---|---|
| Holder KO | 61.0% | 55.0% | 53.5% | 24.0% | 31.2% | 23.8% |
| Pull KO | 0.5% | 1.0% | 0.2% | 0% | 0% | 0% |
| TKO | 0% | 7.5% | 7.2% | 0% | 1.2% | 1.2% |
| Tiebreak win | 27.2% | 32.8% | 36.5% | 8.0% | 14.2% | 13.2% |
| Draw | 11.2% | 3.8% | 2.5% | 68.0% | 53.2% | 61.8% |
| Ended on the turn limit | 38.5% | 36.5% | 39.0% | 76.0% | 67.5% | 75.0% |
| Games with a pull | 1.0% | 1.5% | 0.2% | 0.2% | 0% | 0% |
| Average turn | 19.3 | 17.5 | 22.4 | 22.9 | 21.7 | 22.5 |

## Build 4 — Brief 004, v3.3: Evade and tackle at hex cost (18 Nov 2026)
Rule set: **v3.3** (new; the new-game default).

**What a player will notice**
- After a Light unit hits an adjacent enemy without killing it, it can keep moving, but only away from that enemy, with whatever movement, Stamina and Command it has left. The attack preview says "Evade after: up to N hexes".
- After a kill, or after a Reach attack or a shot from range, there's no Evade. Heavy units never evade.
- Breaking contact with an enemy Melee unit costs the leaving unit its own hex cost (Light 0.5, Heavy 1) and one hex of its movement.
- Picking another unit, or End unit, gives up a pending Evade.

**Under the hood**
- Three switches (`evade`, `tackleHexCost`, `tackleUsesCap`) and an `evade` flag on the three Light cards.
- The bot decides an Evade before moving other units. New `test_v33.js` (58 checks).

**Flags closed:** F21 (ruled: the display stays). **Opened:** F22 (Evade doesn't reduce Light losses in bot games).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.2 7v7 | v3.3 7v7 | v3.2 5v5 | v3.3 5v5 |
|---|---|---|---|---|
| Holder KO | 61.0% | 59.5% | 24.0% | 27.5% |
| Pull KO | 0.5% | 0.5% | 0% | 0% |
| TKO | 0% | 0% | 0% | 0% |
| Tiebreak win | 27.2% | 30.5% | 8.0% | 6.5% |
| Draw | 11.2% | 9.5% | 68.0% | 66.0% |
| Ended on the turn limit | 38.5% | 40.0% | 76.0% | 72.5% |
| Pulls | 6 | 4 | 1 | 0 |
| Light units removed per game | 3.76 | 3.85 | 0.67 | 0.68 |

All differences are within chance at this sample size.

## Build 3 — Brief 003, version line and play links (18 Nov 2026)
Rule set: none changed (v3.2 stays the newest).

**What a player will notice**
- Home says which build and rules you're on: "Playtest board · Build 3 · Rules v3.2". A preview copy of a pull request also says "Preview of PR #N".
- The in-match menu shows the build after the rule set. If a match was started on an earlier build, it says so ("Build 4 (started on Build 3)").
- Every new match remembers the build it was started on. The Matches screen shows it under the rule set. Matches saved before Build 3 show none.
- Each finished match has a Copy button that copies its record for Claude. It works for matches finished from Build 3 on; older matches saved only on this device kept no moves, so there's nothing to copy, and the button says so.
- Every pull request gets a "Play this build" link, and `main` is playable at https://productofdefiance.github.io/Flagfall/ once GitHub Pages is switched on.

**Under the hood**
- `board/version.js` is the only place the build number is kept. `checks` fails a pull request that changes `board/` without raising it.
- `checks` is split into parallel quick jobs (a few minutes). The full 400 + 400 double-knockout count moved to a nightly run (`night-checks`), which can also be started by hand or by the `full checks` label on a pull request. A failing night run opens a "Night checks failed" issue.
- New `play-links` workflow publishes `main` and every open pull request to the `gh-pages` branch.

**Flags closed:** none. **Opened:** F21 (a holder on its last half point shows HP 0).

## Build 2 — Brief 002, v3.2: order of operations (17 Nov 2026)

**What a player will notice**
- New games start on rule set **v3.2**. Older rule sets are still in the list and play exactly as before.
- A braced Heavy Melee that dies to a hit no longer strikes back (no parry).
- A braced Heavy Melee parries only the first adjacent attack against it each enemy turn. Ranged shots and Reach attacks never use the parry up. The attack preview says when a parry is already used, and when it only happens if the target survives.
- If one action ever finishes both sides, the match goes to the turn-limit tiebreaks (more pull damage, then fewer beings lost, then a draw) instead of to the side that acted. In 800 bot games this never happened.

**Under the hood**
- Three new rule switches: `parryNeedsSurvivor`, `parryFirstOnly`, `doubleKoToTiebreak`.
- New tests: `test_v32.js` (the new rules, the rules they touch, and an 800-game double-knockout count) and `test_invariants.js` (impossible-state check on the newest rule set). Both run on every pull request.
- The replay regression hashes now cover v3.1. They leave out only the newest rule set.

**Flags closed:** F3, F4, F5, F17, F18, F19 (raised and answered during this build), F20 (accepted as built).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.1 7v7 | v3.2 7v7 | v3.1 5v5 | v3.2 5v5 |
|---|---|---|---|---|
| Holder KO | 61.8% | 61.0% | 24.8% | 24.0% |
| Pull KO | 0.2% | 0.5% | 0% | 0% |
| TKO | 0.2% | 0% | 0% | 0% |
| Tiebreak win | 28.8% | 27.2% | 7.5% | 8.0% |
| Draw | 9.0% | 11.2% | 67.8% | 68.0% |
| Ended on the turn limit | 37.8% | 38.5% | 75.2% | 76.0% |
| Pulls | 3 | 6 | 0 | 1 |
| Parries per game | 0.12 | 0.07 | 0.11 | 0.09 |

The differences other than parries are within chance at this sample size (likely, not isolated).

## Build 1 — Brief 001, automatic checks (17 Nov 2026)
Every pull request runs the board's checks automatically (the `checks` tick on GitHub); `main` only accepts changes through a pull request with `checks` passing. Closed F9.
