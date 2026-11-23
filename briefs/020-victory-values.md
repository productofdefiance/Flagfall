# Brief 020 — Victory values: finishing is worth more than winning on the clock

| | |
|---|---|
| Game version | Next free **YY** at merge (a new brain is a real change), ZZ = 00 |
| Lane | Bot (with new Lab measures) |
| Rule set | none (bot only; no rule change). Measured on the newest rule set on `main` at build time (specials, and brief 014's fields if merged). Say which in the Report |
| Date | 2026-11-20 |
| Goal | A brain that scores each way a game can end by the Editor's values (finish 3, win on the clock 1, draw 0, loss −1), so it presses to finish when the odds favour it, and a test of whether "any loss −1" makes a beaten side give up its flag |
| Branch | Any branch your session may push to, started from `brief/020-victory-values` |
| Flags | Evidence for F10 (stalls); builds FD49-4 (spend the opening Command); answers F022-8 (why Brain 8 loses tiebreaks to Brain 5 on v3.9) and takes F022-10's first readings (format-specific bot play). Builds on brief 022 (Brain 8: Brain 5 + B4 holder joins, safe approach, respect for warmed specials, opening tempo), brief 019's lead measures and brief 016's stall columns |
| Waits on | 022 |
| Order | **After brief 022 is merged** (it builds on Brain 8; changed 20 Nov after brief 019's results, F47: Brain 7's B1, B2, B3 and B5 cost wins or do nothing, so the line continues from Brain 5 + B4). No rule change, so it does not wait for the rules chain (014, 017, 018, 012) |

## Context
Today every brain scores a finished game the same way: `value5` returns +100,000 for any win and −100,000 for any loss (`board/bot.js`), so a full pull and a win on the turn limit are worth the same. Watched game R28X-AJDH-DUP5 (7v7, v3.7, Brain 5 mirror) shows the result: South leads 3 to 1 by turn 10 and 2 to 1 from turn 14, nobody attacks for the last 22 turns, its holder never leaves its flag, and it wins on flag damage at the limit. Under the rules a quiet lead wins, so sitting is safe.

The Editor's values (Ideas Log, Computer opponent: "Victory ranking for bots", 20 Nov, undecided; bots only, not a rule):

| Ending | Value |
|---|---|
| Win by full pull (pull KO), holder KO or TKO | **+3** |
| Win at the turn limit on flag damage (Game Laws 2.7 a) | **+1** |
| Draw | **0** |
| Loss at the turn limit | **−1** |
| Loss by full pull, holder KO or TKO ("finished") | **−1**, tested against **−2** |

From a quiet lead, pressing risks 2 (1 to −1) to gain 2 (1 to 3), so a brain on these values presses exactly when pressing makes a finish more likely than a loss. The Editor's hunch: if being finished costs no more than losing on the clock (−1), a side that is beaten on flag damage loses nothing more by being finished, so it may stop guarding its flag and hand the leader a cheap +3. At −2 it should defend, but the leader also becomes more careful (a counter-finish now costs 3), which can bring the stall back. He wants the numbers before he picks.

Two readings of the rules, already locked:
- **"Fewer units lost" is gone** (Game Laws 2.7, locked 19 Nov, awaiting build): level on the flag at the limit is a draw. The board still scores "turn limit, fewer beings lost" as a win. The brain values that ending as a **draw (0)**, as the Law reads. Result tables report the board's own result as usual, and also the points as the brain values them (see Measurements).
- **Overtime** (2.13) is not built, and bot-only matches skip it anyway: a level game is a draw.

## Scope
In:
- **Brain 9** (`brain9`, short form Br9, "Brain 9 (plays to finish)" on screen): a copy of Brain 8 with victory values. With victory values off, Brain 9 plays exactly like Brain 8 (same `sims/brainhash.js` hash).
- New lab measures (below), in `sims/lab/measures.js` so every run carries them.
- The runs below and the settings review.

Out:
- Any rule change. These values are the bot's taste, not a scoring rule for players.
- Points, XP, rewards or leaderboards for players (none exist yet; these values are the stand-in until they do).
- Changes to Brain 8's behaviours. Brain 9 keeps the switches and settings brief 022's review chose; report whether any of them stops mattering once victory values are on.

## What to build
1. **Copy Brain 8 as Brain 9.** Brains 5, 6, 7 and 8 stay frozen.
2. **Victory values as settings** in `BRAIN_8.victory` (plain labels on the Opponent screen): `finish` 3, `clockWin` 1, `draw` 0, `clockLoss` −1, `finished` −1, plus an on/off switch. Every number lives in the brain, not in the engine.
3. **Finished games are scored by these values.** Where `value5` returns ±1e5 for a finished game, Brain 9 returns the value of that ending times one big scale (so a finished game still outweighs any position, and a finish still outranks a clock win).
4. **Unfinished positions look ahead to how the game will end.** A one-turn planner rarely sees the end, so the values must also shape play before it. The intent: near the turn limit, a position is worth more the more likely it ends in a finish for us, and less the more likely it ends in a finish against us, weighted by the values above. Suggested way in (Code may find a better one): reuse Brain 6's `clockNear` and `tiebreakOutlook` for the likely clock result, and `flagPotential` both ways (plus a material count like Brain 7's B1, used here only as an input, not as a value term) for the chance of a finish, then add a term `endWeight × clockNear × (expected value of the ending)`. Report what was built and why. Stateless, as Brains 5 to 7: worked out from the board as it stands, nothing carried between turns, so replays stay exact.
6. **Spend the opening Command (FD49-4, the Editor, 21 Nov), behind its own switch `spendOpening` (on in Brain 9, off = Brain 8's play).** At 5v5 Brain 5 and Brain 8 spend 4 to 5 Command on the first mover's first turn whatever they have, so a first turn of 5 and of 8 play the same games, and the lab can't judge equal first-turn Command (one rule in every format; tested at 5v5 Command 8). Teach the brain to use spare first-turn Command sensibly: advance into a better shape or warm up, without walking into reach of a warm enemy special. It must come from reading the board (units on the field, Command left, distance); the Editor expects the bot to play differently with 5 units than with 13. (Changed 22 Nov, F022-10: per-format numbers are now allowed, but only through item 7's per-format settings, never hard-coded here.) Prove it: at 5v5 (Command 8), first turn 5 against 8 must now play different games, and report Command used on turn 1 per side. Then re-run the move-order grid (FD49-3, widened by F022-10), sim-only on the newest rule set, Brain 9 mirrors: 5v5 at Command 7, 8 and 10, each with the first turn equal (7, 8, 10) and reduced (4, 5, 6); 7v7 with the first turn 6 and 10; each cell with Arrow Storm × 1.5 (the Editor's ruling, 22 Nov, not yet built) and × 2 (today's, the control). 16 cells: screen all at about 200 games, confirm overnight at 1,000 every cell whose first mover's share of decisive games is within 40 to 60%, plus every × 1.5 cell with the reduced first turn. Report the first mover's share of decisive games, turn-limit share, Command used on turn 1 per side, and Arrow Storm kills per firing.
7. **Per-format settings (F022-10, the Editor, 22 Nov), baseline only.** Let any Brain 9 setting take its own value per format (5v5, 7v7; 9v9 and 13v13 use the shared value until Cavalry). Brain 9 ships with no per-format values (every format uses the shared value), so this changes no game by itself. Then screen, at about 200 games per side and per format, Brain 9 mirrors and Brain 9 against Brain 8: each of `tempoFirst`, `tempoSecond`, `spendOpening` and the victory settings moved one at a time, 5v5 and 7v7 separately, and report which settings move a format's first-mover share, turn-limit share or win share by 4+ points and which move only one format. No overnight confirm and no tuning: Cavalry (brief 012) changes 5v5 Command to 8 and rewrites Mark, so per-format values are tuned after it, on these readings. Per-format values must be recorded in the watch link and the lab's game record (item 5).
8. **Why Brain 8 loses tiebreaks (F022-8, the Editor, 22 Nov).** Brain 8 stayed the default although on v3.9 it lost to Brain 5 by 5 to 7.5 points in three of four matchups, mostly tiebreaks; on v3.8 with tempoSecond 0 it was even. v3.9 and tempoSecond +1 changed together. Isolate it: Brain 8 against Brain 5, 1,000 games each, balanced and all-Light, 5v5 and 7v7, three arms on the same deals: (a) v3.9, tempoSecond +1 (as shipped); (b) v3.9, tempoSecond 0; (c) v3.8, tempoSecond +1. (a) against (b) isolates the tempo, (a) against (c) the rule set. Tiebreak wins and losses apart, with `lead_lost` and the four new measures. Say which is isolated and which only likely, and whether Brain 9's victory values (arm B against Brain 5, same deals) win those tiebreaks back.
5. **Watchable.** Every tested setting must replay from its watch link (standing rule: record every set-up difference). Either record Brain 9's victory settings in the watch link and the lab's game record, or add the −2 variant as its own named brain on the board (`brain9b`). Say which.

## Rules it touches
None change. Brain 9 must model these correctly and pick only legal actions: the turn limit and the board's tiebreak (2.7, and the reading above), the pooled flag and holder (4.2 to 4.6), the flag block (4.9), specials (6.16, 6.17) if measured on v3.7, Mark (3.8), tackle (6.6), Evade (6.5), set spear (3.13), Command, Stamina, Brace, Support and pulls.

## New lab measures
Name the columns as below, or say in the Report what changed and why. "Behind" and "ahead" here mean flag damage (the board's first tiebreak step), read at the start of a side-turn.
1. **`late_behind_side`, `late_behind_finished`**: at limit − 5 turns, the side behind on flag damage, if any; 1 if that side then lost by full pull, holder KO or TKO (it was finished), else 0. Also `late_behind_comeback` (it won or drew).
2. **`late_guard_n/s`**: average number of a side's non-holder units in or next to its own goal zone, over its side-turns in the last 5 turns, split by whether it was behind, level or ahead on flag damage at that turn (`late_guard_behind_*`, `_level_*`, `_ahead_*`). This is the "stops guarding" reading.
3. **`late_ahead_side`, `late_ahead_attacks`, `late_ahead_result`**: at limit − 5, the side ahead on flag damage; its attacks and pulls per side-turn over the last 5 turns; and how it ended (finished the enemy, won on the clock, drew, lost).
4. **`points_n/s`**: each side's points by the Editor's table (with "fewer units lost" scored as a draw), with `finished` at −1. Tables show average points per side and the share of games won by a finish.

Work out measures 1 to 4 for the Brain 8 baseline run below. Check each by hand on two saved games (one where the event happens, one where it doesn't).

## Measurements
All with `tests/rng.js`, tiebreak wins counted separately, balanced lineups, same seeds across arms. Screen first at about 200 games per side, then confirm overnight at 1,000 per format (F23). A gap under about 4 points is never evidence.
- **Three arms, mirrors, balanced 5v5 and 7v7:** (A) Brain 8 as merged (victory values off); (B) Brain 9 with `finished` −1; (C) Brain 9 with `finished` −2.
- **For each arm:** the full baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), brief 016's stall columns, brief 019's `lead_lost` and `lead_unused`, and the four new measures.
- **Head-to-head:** B against A and C against A, 1,000 games per format, sides and move order swapped half the time. Report win share and also points per game by the Editor's table: B or C may win fewer games but score more points, and that is the trade the Editor is choosing.
- **The hunch, in one table:** for B and C side by side, `late_behind_finished`, `late_guard_behind`, and `late_ahead_attacks`. The hunch holds if the beaten side is finished clearly more often (4+ points) and guards less under −1 than under −2. The counter-risk holds if C's leader attacks less than B's and C ends on the turn limit more often.
- **The test game:** replay seed R28X-AJDH-DUP5 (7v7, the board's v3.7 setup) with Brain 8, Brain 9 at −1 and Brain 9 at −2 on both sides. Give the three watch links, and say whether South finishes.
- **Speed:** average and worst time per turn next to Brain 8's. Flag it if the worst turn rises above 4.6 s. Any search cap counts plans examined, never seconds (F24).

## Bot minimum
This build is the bot work. It is met when every measurement has a number and these five test positions pass, each showing the model's reasoning:
1. **Press.** Two turns from the limit, ahead 2 on flag damage, enemy holder alone with a small pool, two of our units able to attack it this turn: Brain 9 attacks; Brain 8 may hold.
2. **Hold.** Same lead, but the only attack leaves our unit likely to be removed and gives the enemy a pull that would level the flag, with a low kill chance: Brain 9 holds.
3. **Level.** Level on the flag near the limit with a material lead: Brain 9 presses (a draw is 0).
4. **Guard (the hunch).** Behind on flag damage near the limit, the enemy able to finish us next turn if our goal zone is empty: with `finished` −2, Brain 9 keeps a guard; report what the −1 setting does in the same position.
5. **Off is Brain 8.** With victory values off, Brain 9's hash matches Brain 8's.

## Must not change
- Every existing preset plays and replays identically.
- Brains 5, 6, 7, Kit A–D, Standard and Easy play exactly as before (`sims/brainhash.js` hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board; `sims/brainhash.js` hashes for every existing brain match.
- Brain 9 with victory values off hashes the same as Brain 8.
- Brain 9 never picks an illegal action over 30 seeded games per format, balanced and all-Light.
- The new measures checked by hand as above.

## The Editor's hands-on check
1. Watch the three R28X-AJDH-DUP5 links. Does South finish the game with Brain 9?
2. Watch one Brain 9 mirror at 7v7 for each `finished` value (the Report picks one where a side falls behind late). Does the beaten side still guard its flag?
3. Play one balanced 7v7 against Brain 9. Get ahead on flag damage and sit: does it come for you? Fall behind: does it press to finish?

## Report
*Filled in by Claude Code. Branch `claude/nice-knuth-scz0hu`, started from `brief/020-victory-values`. In progress: the lab's numbers are added as the runs land.*

- **What's in:**
  - **Brain 9** (`brain9`, "Brain 9 (plays to finish)"): a copy of Brain 8 as shipped plus two switches. `victory.playToFinish` (victory values) and `spend.spendOpening` (the spent opening). Both off = Brain 8 (same `brainhash`).
  - **Victory values** in `BRAIN_9.victory` (the brief says `BRAIN_8.victory`; Brain 8 is frozen, F020-1): finish 3, clockWin 1, draw 0, clockLoss −1, finished −1, plus `endWeight` 20, `endTurns` 5 and `guardBlocks` 1.
  - **Finished games** are scored as the ending's value × 10,000: a finish outranks a clock win, and both outweigh any position. A turn-limit result on "fewer units lost" counts as a draw (0), as the Law reads.
  - **Before the end** (item 4): in the last `endTurns` turns, value5 adds `endWeight × nearness × expected ending`. The expected ending is made of three parts:
    - **Our chance to finish them, and theirs to finish us.** Every unit that can walk into the enemy goal zone next turn and still act hits the holder's whole pool (or pulls an empty flag), best first. Each enemy guard (a non-holder unit in or next to its own goal zone) ties up `guardBlocks` attackers. Attackers are capped by free goal hexes and Command. That damage, against the pool, gives one turn's chance, scaled by the material share (×0.5 to ×1.5, Brain 7's material count used only as an input). It is counted over up to 2 turns. The enemy moves next, so its chance comes first.
    - **The clock outlook:** Brain 6's `tiebreakOutlook` on flag damage alone, with the same guard-aware potential.
    - **The total:** finish × our chance + finished × theirs + the rest × the clock's value.
    - **Why guards count:** without them a guard changed nothing in the model, and the hunch (does a beaten side stop guarding?) could not show. Stateless: read when each plan is made.
  - **Spent opening** (item 6): on its own first turn (the opening, turn 1), each point of Command left unspent costs `spareCommand` (0.4). Units left in reach of a warmed enemy special count its full damage (Brain 8's A2 reading), so spending never means walking in. It reads only Command left and the board, with no per-format number.
  - **Per-format settings** (item 7): `BRAIN_9.perFormat` = { 5: {}, 7: {} }, empty, so no game changes. A watch link sets one format's own value with `key.5=value` (e.g. `brain9:tempoSecond.5=0`). 9v9 and 13v13 are refused until Cavalry.
  - **Watchable** (item 5): the watch link and the lab's record carry Brain 9's settings (`brain9:finished=-2`). No `brain9b`.
  - **Lab:** a new always-on measure `victory`.
    - Columns as the brief names them. One exception: `late_guard_*` are sums with `late_guard_*_turns_*` beside them (divide for the average; the lab sums columns).
    - Added: `points2_n/s` (finished −2), `finish_win`, `turn1_cmd_first/second` (Command spent on each side's first side-turn).
  - **Opponent screen:** Victory and Opening tables (victory values may be −10 to 10).
- **Anything beyond the brief, and why:** `guardBlocks` (see above); `points2_*` so the −2 table can be read from any run.
- **Checks run and results (paste regression hashes):**
  - Session (all pass):
    - test_rules, v1, v3, v31, v33, v34, v36 and v37.
    - test_fields, route, stamina, reasons, watch, version, ui and rng.
    - test_brain5 to 8.
    - test_brain9: 43 of 43.
    - test_replay: 386 checks, 0 mismatches.
    - The lab's self tests.
  - GitHub checks: all green (release checks included: test_v32 400 + 400, invariants 100, other brain tests at 30, regression hashes).
  - `regress_engine.js` (3 games per set), old board against new: match3 37397ef2bd3ed86b, v1 7b25bca651c0cb31, v2 ddbe5fc437ff4e9d, v3 26371927b53d4413, v3.1 c71e4cd12fc984b0, v3.2 f62a061d2c147d83, v3.3 e6151bf463d6c9f8, v3.4 ee6ce003ac760250, v3.5 fca989aecfaf21c9, v3.6 a6bf327b54f7d5a1, v3.7 dd3c27d9dc9aafbb, v3.8 022a298c49a02540 (identical).
  - `sims/brainhash.js`, `main` (after brief 018) against this build, every preset, identical: standard 93fbbf839f2950d7, easy 3aaf555d20cfeab6, kitA 674c62e4bc7f23d0, kitA2 02d2cd3517724aff, kitC ac22522cef7522c1, kitB e441852e79c68cc7, batchC e8f37e4b214342fa, kitD c5487d8eaef8e7ee, brain5 39b3a3235af2e5d6, brain6 5e954847821f9145, brain7 6d4687cfec433e61, brain8 61ba471b57d2bf39.
  - Brain 9 off (`brain9:playToFinish=0,spendOpening=0@brain8`): 61ba471b57d2bf39, the same as Brain 8. Brain 9 as shipped: 2043d10724a8f649.
- **Baseline table (rule changes only):** n/a (no rule change); the measurements above instead
- **Bot minimum (session, `test_brain9.js`, 5v5 v3.9, turn 24 of 25):**
  1. **Press** (ahead 4 to 2, enemy holder alone, pool 12): Brain 9 strikes the holder with two units (expected ending 3.00: finish chance 1.0). Brain 8 does the same here.
  2. **Hold** (ahead 4 to 2, our holder on 6 HP, one guard; its only attack walks it out to hit the enemy archer):
     - Brain 8 attacks, leaving no guard. Its own finish-against reading rises to 0.71 and the expected ending drops from +1.00 to −1.00.
     - Brain 9 braces both and keeps the guard (expected ending stays +1.00).
  3. **Level** (2 to 2, 5 units against 2): Brain 9 strikes the holder with three units (expected ending 2.40). Brain 8 does the same.
  4. **Guard** (behind 1 to 4, our holder on 8 HP, three enemies two walks away):
     - With finished −2, Brain 9 keeps one guard (finished chance after: 0.00).
     - With −1 it attacks with all three and leaves none (finished chance after: 0.61). Its expected ending is −1.00 either way, which is the hunch: at −1, being finished costs no more than the clock loss it already expects.
  5. **Off is Brain 8:** the same hash (above), and the same actions in 4 test games.
  - **Spent opening, 5v5 Command 8:** Brain 8 spends 4 of 5 and 4 of 8 on its first turn; Brain 9 spends 4.5 of 5 and 7.5 of 8 (moves its archer forward, warms it up, moves two more units).
  - **Legal play:** 0 refused actions (test_brain9 legal-play loop; 30 games per format and lineup in the night checks).
- **The test game R28X-AJDH-DUP5** (7v7, v3.7, North first):
  - Brain 5 still replays it as the Editor saw it (South wins the tiebreak, turn 35, 3.83 to 0).
  - Brain 8: South KO, turn 12 ([watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&rules=v3.7&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)).
  - Brain 9 at −1: North KO, turn 11 ([watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&rules=v3.7&format=std7&n=brain9&s=brain9&mixn=mixed&mixs=mixed&first=N)).
  - Brain 9 at −2: the same game ([watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&rules=v3.7&format=std7&n=brain9%3Afinished%3D-2&s=brain9%3Afinished%3D-2&mixn=mixed&mixs=mixed&first=N)).
  - So South doesn't finish with Brain 9: the spent opening changes the game from turn 1. With it off, Brain 9 plays Brain 8's game (South KO, turn 12). The victory values never come into play (the game ends before turn limit − 5). F020-2.
- **Measurements:** pending (screens `brain9-screen`, `brain9-settings-screen`, `brain9-moveorder-screen` on the lab; confirms at 1,000 and F022-8 to follow).
- **Settings review (brain builds only):** pending (from `brain9-settings-screen`).
- **Known gaps:** TKO is left out of the finish chance. The finish chance counts at most 2 turns ahead and ignores blockers other than guards.
- **Flags closed / opened:** opened F020-1, F020-2 (`flags/020.md`).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/60
