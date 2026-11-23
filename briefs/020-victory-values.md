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
*Filled in by Claude Code. Branch `claude/nice-knuth-scz0hu`, started from `brief/020-victory-values`. Game version v3.17.00, Build 22. Measured on v3.9 (the newest rule set on `main`: specials, brief 014's fields and brief 017's routes).*

### In plain words
- **Does it press to finish when it leads, and stall less than Brain 8?**
  - Yes, both.
  - In the last 5 turns the side ahead on flag damage attacks or pulls 0.24 to 0.34 times per side-turn, against 0.08 (5v5) and 0.00 (7v7) for Brain 8.
  - Brain 9 mirrors (spent opening off) end on the turn limit in 27.1% of 5v5 games against 41.0%, and 7.6% of 7v7 games against 12.9%. 1,000 games each, same deals.
  - The victory values are the only change between the two arms, so the press is isolated, as far as one change of brain can isolate it.
- **The hunch: at −1, does a beaten side give up its flag? Does −2 fix it?**
  - Neither. −1 and −2 play within 1 to 2 games of each other in every arm.
    - Side behind at turn limit − 5 then finished: 5v5 27 of 83 at both values; 7v7 12 of 60 at both.
    - Guards when behind: 0.02 against 0.02 at 5v5, 0.08 against 0.08 at 7v7.
    - Leader attacks: 0.24 against 0.23 at 5v5, 0.26 against 0.25 at 7v7.
  - The reason is likely, not isolated: late in the game neither side guards at all (under 0.1 guards per side-turn, Brain 8 included), so there is no guarding for −1 to give up or −2 to keep.
  - In the test position the hunch shows (−1 leaves its goal empty, −2 keeps a guard), but real games almost never reach that position. F020-5 asks for a guarding behaviour to test it properly.
  - −2 costs nothing measurable either (turn-limit share the same).
- **Points against wins:** with the spent opening off, yes.
  - 5v5: Brain 9 wins fewer games than Brain 8 (427 to 534; it wins more by KO, 345 to 313, but loses 221 tiebreaks to 82) and scores more points per game by the Editor's table: +0.78 against +0.54.
  - 7v7: even on games (486 to 495) and points (+0.92 against +0.87).
  - With the spent opening on, it loses on both counts (5v5 424 to 541, points +0.70 against +1.04; 7v7 423 to 572, +0.64 against +1.18).
- **The spent opening (item 6)** does what was asked: at 5v5 Command 8, Brain 9's first mover spends 5.0 of 5 and 7.8 of 8, where Brain 8 spends 4.3 to 4.6 either way. But:
  - It costs wins against Brain 8 (above).
  - It makes Brain 9 mirrors first-mover games: 77.0% of decisive 5v5 games and 83.1% of 7v7, against 52.8% and 46.0% with it off.
  - **Brain 9 ships with it off** (F020-4), as brief 022 shipped A1 and A2 off; it stays a switch for move-order studies.
- **Does any of Brain 8's behaviours stop mattering?**
  - No. B4 (holder joins) still matters: off, Brain 9 mirrors' turn-limit share rises from 13.5% to 51.5% (5v5) and from 4.5% to 18.5% (7v7) in the screen.
  - The opening tempo still moves the first mover's share in both formats.
  - A1 and A2 ship off in both brains and were not retested.
- **Why does Brain 8 lose tiebreaks to Brain 5 on v3.9 (F022-8)?**
  - Neither the tempo nor the rule set.
    - tempoSecond 0 against +1 moves win share by 0 to 3.7 points (noise); at 5v5 balanced the games are identical.
    - v3.8 against v3.9 moves it by 0 to 0.6 points. The all-Light games are identical: no Mark or set spear, so routes change nothing.
  - Brain 8 loses 2 to 4.6 tiebreaks for every one it wins in every arm, and wins more by KO. Likely its finishing style (B4) trades clock leads for finishes; not isolated.
  - Brain 9 doesn't win them back. As briefed (spent opening on) against Brain 5 it won balanced 5v5 (53.0%) and lost the rest badly (7v7 33.1%, all-Light 31.9% and 41.3%).
- **Which settings matter differently at 5v5 and 7v7?**
  - `tempoFirst` and `tempoSecond` move the first mover's share in opposite directions in the two formats.
  - `spendOpening` moves both, 7v7 far more.
  - The victory settings act only at 5v5, because 7v7 games rarely reach the last 5 turns.
  - The spent opening doesn't make 5v5 fairer at Command 8 or 10 on its own. With Arrow Storm ×1.5 and Brain 9 spending, 5v5 Command 7 first turn 4 (48.0%), Command 8 first turn 8 (52.6%) and first turn 5 (55.2%) are inside 45–55%; Command 10 first turn 6 is not (66.8%), nor 7v7 first turn 6 (76.4%).


- **What's in:**
  - **Brain 9** (`brain9`, "Brain 9 (plays to finish)"): a copy of Brain 8 as shipped plus two switches. `victory.playToFinish` (victory values) and `spend.spendOpening` (the spent opening). Both off = Brain 8 (same `brainhash`).
  - **Victory values** in `BRAIN_9.victory` (the brief says `BRAIN_8.victory`; Brain 8 is frozen, F020-1): finish 3, clockWin 1, draw 0, clockLoss −1, finished −1, plus `endWeight` 20, `endTurns` 5 and `guardBlocks` 1.
  - **Finished games** are scored as the ending's value × 10,000: a finish outranks a clock win, and both outweigh any position. A turn-limit result on "fewer units lost" counts as a draw (0), as the Law reads.
  - **Before the end** (item 4): in the last `endTurns` turns, value5 adds `endWeight × nearness × expected ending`. The expected ending is made of three parts:
    - **Our chance to finish them, and theirs to finish us.** Every unit that can walk into the enemy goal zone next turn and still act hits the holder's whole pool (or pulls an empty flag), best first. Each enemy guard (a non-holder unit in or next to its own goal zone) ties up `guardBlocks` attackers. Attackers are capped by free goal hexes and Command. That damage, against the pool, gives one turn's chance, scaled by the material share (×0.5 to ×1.5, Brain 7's material count used only as an input). It is counted over up to 2 turns. The enemy moves next, so its chance comes first.
    - **The clock outlook:** Brain 6's `tiebreakOutlook` on flag damage alone, with the same guard-aware potential.
    - **The total:** finish × our chance + finished × theirs + the rest × the clock's value.
    - **Why guards count:** without them a guard changed nothing in the model, and the hunch (does a beaten side stop guarding?) could not show. Stateless: read when each plan is made.
  - **Spent opening** (item 6, **ships off**, F020-4): on its own first turn (the opening, turn 1), each point of Command left unspent costs `spareCommand` (0.4). Units left in reach of a warmed enemy special count its full damage (Brain 8's A2 reading), so spending never means walking in. It reads only Command left and the board, with no per-format number.
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
  - **Spent opening (switched on), 5v5 Command 8:** Brain 8 spends 4 of 5 and 4 of 8 on its first turn; Brain 9 spends 4.5 of 5 and 7.5 of 8 (moves its archer forward, warms it up, moves two more units).
  - **Legal play:** 0 refused actions (test_brain9 legal-play loop; 30 games per format and lineup in the night checks).
- **The test game R28X-AJDH-DUP5** (7v7, v3.7, North first):
  - Brain 5 still replays it as the Editor saw it (South wins the tiebreak, turn 35, 3.83 to 0).
  - South finishes with Brain 8 ([watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&rules=v3.7&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)), Brain 9 at −1 ([watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&rules=v3.7&format=std7&n=brain9&s=brain9&mixn=mixed&mixs=mixed&first=N)) and Brain 9 at −2 ([watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&rules=v3.7&format=std7&n=brain9%3Afinished%3D-2&s=brain9%3Afinished%3D-2&mixn=mixed&mixs=mixed&first=N)): the same game, South KO on turn 12.
  - With the spent opening switched on it changes from turn 1 (North KO, turn 11).
  - The victory values never come into play: the game ends long before turn limit − 5. So it no longer tests a late lead (F020-2).
  - The Editor's check 2 (a beaten side late at 7v7): GYSW-QGP8-XVGH, above.
- **Measurements, confirm (1,000 games each, v3.9, balanced, same deals per format; `results/v3.17.00/2026-11-23_study_brain9-confirm`).**
  - Arms: A = Brain 8, B / C = Brain 9 as briefed (spent opening on) at −1 / −2, Bo / Co = the same with the spent opening off (as it ships).
  - Holder KO, pull KO and TKO count games.

| Matchup | A won KO / tiebreak | B side won KO / tiebreak | Draw | Holder KO | Pull KO | TKO | Turn limit | Avg turn | First mover of decisive | Points A / B |
|---|---|---|---|---|---|---|---|---|---|---|
| A mirror 5v5 | 283 / 175 | 307 / 176 | 59 | 50 | 454 | 86 | 41.0% | 18.1 | 55.2% | +0.55 / +0.63 |
| B mirror 5v5 | 439 / 45 | 439 / 51 | 26 | 70 | 556 | 252 | 12.2% | 15.4 | 77.0% | +0.88 / +0.88 |
| C mirror 5v5 | 437 / 45 | 440 / 52 | 26 | 71 | 557 | 249 | 12.3% | 15.4 | 77.0% | +0.87 / +0.88 |
| Bo mirror 5v5 | 353 / 103 | 376 / 93 | 75 | 68 | 503 | 158 | 27.1% | 18.1 | 52.8% | +0.69 / +0.77 |
| Co mirror 5v5 | 362 / 95 | 379 / 89 | 75 | 66 | 524 | 151 | 25.9% | 18.0 | 52.0% | +0.71 / +0.77 |
| B vs A 5v5 | 390 / 34 | 476 / 65 | 35 | 48 | 653 | 165 | 13.4% | 13.0 | 90.4% | +0.70 / +1.04 |
| C vs A 5v5 | 390 / 34 | 476 / 65 | 35 | 48 | 653 | 165 | 13.4% | 13.0 | 90.4% | +0.70 / +1.04 |
| Bo vs A 5v5 | 345 / 82 | 313 / 221 | 39 | 59 | 478 | 121 | 34.2% | 18.1 | 53.8% | +0.78 / +0.54 |
| Co vs A 5v5 | 345 / 82 | 314 / 219 | 40 | 59 | 479 | 121 | 34.1% | 18.1 | 53.9% | +0.78 / +0.54 |
| A mirror 7v7 | 432 / 59 | 439 / 60 | 10 | 44 | 657 | 170 | 12.9% | 15.9 | 46.3% | +0.85 / +0.89 |
| B mirror 7v7 | 477 / 20 | 488 / 10 | 5 | 32 | 754 | 179 | 3.5% | 14.3 | 83.1% | +0.95 / +0.98 |
| C mirror 7v7 | 477 / 20 | 488 / 11 | 4 | 32 | 757 | 176 | 3.5% | 14.3 | 83.1% | +0.95 / +0.98 |
| Bo mirror 7v7 | 454 / 25 | 470 / 28 | 23 | 50 | 676 | 198 | 7.6% | 15.9 | 46.0% | +0.89 / +0.96 |
| Co mirror 7v7 | 455 / 24 | 470 / 28 | 23 | 49 | 678 | 198 | 7.5% | 15.9 | 46.0% | +0.89 / +0.96 |
| B vs A 7v7 | 383 / 40 | 529 / 43 | 5 | 44 | 711 | 157 | 8.8% | 15.5 | 60.6% | +0.64 / +1.18 |
| C vs A 7v7 | 383 / 39 | 530 / 43 | 5 | 44 | 712 | 157 | 8.7% | 15.5 | 60.7% | +0.64 / +1.19 |
| Bo vs A 7v7 | 451 / 35 | 442 / 53 | 19 | 47 | 666 | 180 | 10.7% | 15.9 | 46.1% | +0.92 / +0.87 |
| Co vs A 7v7 | 451 / 35 | 442 / 53 | 19 | 47 | 666 | 180 | 10.7% | 15.9 | 46.1% | +0.92 / +0.87 |

  - **The hunch table** (behind / ahead on flag damage at turn limit − 5; guards = units other than the holder in or next to their goal zone, per side-turn in the last 5 turns):

| Matchup | Behind at limit − 5 | Then finished | Guards when behind | Leader attacks per side-turn | Leader then: finished / clock win / lost |
|---|---|---|---|---|---|
| A mirror 5v5 | 83 | 16 (19.3%) | 0.00 | 0.08 | 16 / 62 / 5 |
| B mirror 5v5 | 84 | 21 (25.0%) | 0.03 | 0.33 | 21 / 50 / 13 |
| C mirror 5v5 | 84 | 20 (23.8%) | 0.03 | 0.33 | 20 / 50 / 14 |
| Bo mirror 5v5 | 83 | 27 (32.5%) | 0.02 | 0.24 | 27 / 48 / 8 |
| Co mirror 5v5 | 83 | 27 (32.5%) | 0.02 | 0.23 | 27 / 48 / 8 |
| A mirror 7v7 | 60 | 0 (0.0%) | 0.06 | 0.00 | 0 / 60 / 0 |
| B mirror 7v7 | 29 | 6 (20.7%) | 0.06 | 0.34 | 6 / 14 / 9 |
| C mirror 7v7 | 29 | 6 (20.7%) | 0.06 | 0.31 | 6 / 14 / 9 |
| Bo mirror 7v7 | 60 | 12 (20.0%) | 0.08 | 0.26 | 12 / 39 / 9 |
| Co mirror 7v7 | 60 | 12 (20.0%) | 0.08 | 0.25 | 12 / 39 / 9 |

  - **Reading the hunch table:** the hunch needs C's beaten side to be finished 4+ points less often and guard more than B's. It isn't and it doesn't (identical within a game). The counter-risk (C's leader attacks less, more turn-limit games) doesn't hold either. Victory values themselves (A against Bo, same deals) raise the leader's attacks and the beaten side's finishes (5v5 19.3% to 32.5%; 7v7 0% to 20.0%).
  - **Correction:** the screen's leader-attack rates (0.14 to 0.40) were divided by the wrong count. The new column had the same name as the older `clock` measure's `late_ahead_turns`, which overwrote it in the lab's rows. Fixed in this build: the column is `late_ahead_sideturns`, and the lab self test now fails if two measures share a column. The rates above are recomputed exactly from the guard columns, which count every side-turn of each side.
  - **Stall and lead columns** (brief 016 and 019): in `tables/stall.csv` and `tables/lead.csv` of the run. Turn-limit games and the leader-attack rates above are the summary.
  - **Speed** (`tables/timing.csv`, per side-turn): average 5v5 60 ms Brain 8, 61 ms Brain 9 (spend off), 80 ms with spend on. 7v7: 189 ms, 190 ms and 230 ms. Worst 7v7 side-turn: 2,943 ms (Brain 8), 2,952 ms (Brain 9 spend off), 3,351 ms (spend on), all under 4.6 s.
- **F022-8** (`results/v3.17.00/2026-11-23_study_f022-8-tiebreaks`; Brain 8 against Brain 5, 1,000 each, same deals per lineup and format). Columns: Brain 8 won KO / tiebreak, Brain 5 won KO / tiebreak, draw, Brain 8's share.
  - Balanced 5v5:
    - (a) v3.9 tempo +1: 313 / 170, 209 / 243, 65, 51.5%.
    - (b) tempo 0: identical games.
    - (c) v3.8: 295 / 191, 203 / 248, 63, 51.7%.
    - Brain 9 (spend on): 486 / 36, 344 / 118, 16, 53.0%.
  - Balanced 7v7:
    - (a) 376 / 55, 306 / 251, 12, 43.7%.
    - (b) 405 / 63, 298 / 223, 11, 47.3%.
    - (c) 376 / 62, 318 / 234, 10, 44.3%.
    - Brain 9: 281 / 47, 447 / 220, 5, 33.1%.
  - All-Light 5v5:
    - (a) 374 / 73, 174 / 363, 16, 45.5%.
    - (b) 398 / 68, 176 / 347, 11, 47.1%.
    - (c) identical to (a).
    - Brain 9: 262 / 48, 356 / 315, 19, 31.9%.
  - All-Light 7v7:
    - (a) 421 / 38, 320 / 214, 7, 46.2%.
    - (b) 449 / 46, 309 / 189, 7, 49.9%.
    - (c) identical to (a).
    - Brain 9: 369 / 37, 384 / 196, 14, 41.3%.
  - (a) against (b), the tempo: 0 to 3.7 points, under the noise. (a) against (c), the rule set: 0 to 0.6 points. Neither is the cause.
  - Brain 9 was queued as briefed (spent opening on); Brain 9 as it ships (off) against Brain 5 wasn't run. That's in Known gaps.
- **Move-order grid** (`results/v3.17.00/2026-11-23_screen_brain9-moveorder-screen-2` and `..._study_brain9-moveorder-confirm`; sim-only; Brain 9 mirrors with the spent opening switched on). First mover's share of decisive games, turn-limit share, Command used on turn 1 (first mover / second mover), Arrow Storm kills per firing:
  - Screen, Arrow Storm ×2: 73.2% to 97.9% in every cell, kills per firing 0.34 to 0.88.
  - Screen, ×1.5:
    - 5v5 Command 7, first turn 7: 66.9%, 24.5%.
    - 5v5 Command 10, first turn 10: 62.7%, 11.5%.
    - 7v7 first turn 10: 72.3%, 8.0%.
  - Confirm, ×1.5, 1,000 each:
    - 5v5 Command 7, first turn 4: 48.0%, 19.4%, 4.0 / 7.0, 0.12.
    - 5v5 Command 8, first turn 8: 52.6%, 19.8%, 7.8 / 7.8, 0.29.
    - 5v5 Command 8, first turn 5: 55.2%, 17.7%, 5.0 / 7.8, 0.52.
    - 5v5 Command 10, first turn 6: 66.8%, 20.0%, 5.3 / 9.0, 0.27.
    - 7v7 first turn 6: 76.4%, 6.2%, 6.0 / 9.8, 0.43.
  - Brain 8 at 5v5 Command 8, ×2 (screen): first turn 5 79.6%, first turn 8 76.3%, Command used 4.3 and 4.6.
- **Hand check of the new measures** (two saved games from `brain9-confirm`, replayed with an independent script):
  - **GYSW-QGP8-XVGH** (7v7, South first): at turn 30 (limit − 5) South leads 2.00 to 0 on flag damage.
    - North is finished (South TKO, turn 34): `late_behind_side` N and `late_behind_finished` 1 ✓.
    - South attacks 4 times in turns 31 to 34: `late_ahead_attacks` 4 ✓, result finished ✓.
    - North's guards 0 over its 3 side-turns: ✓.
    - Points −1 / +3 ✓.
    - Turn-1 Command: South 6 of 6, North 9.5 of 10 ✓.
    - `late_ahead_turns` read 2 here; this is how the column clash was found.
  - **T4WW-W2ZP-4EUF** (7v7): ends turn 12 by KO: `late_behind_side` ended_earlier, no late columns, points −1 / +3 ✓.
- **Settings review (screen, 200 games; a gap under 4 points is noise):**
  - **No effect found in either format:** `finished` −2, `clockLoss` −2, `guardBlocks` 0 and 2, `endWeight` 10. Every change within 2 games of the baseline, head-to-head and mirror.
  - **No effect found at 7v7** (identical or within 2 games): `playToFinish`, `finish` 5, `endWeight` 40, `endTurns` 3 and 8. The victory term rarely acts there: 4.5% of Brain 9 mirrors reach the turn limit.
  - **Effect at 5v5 only** (mirror turn-limit share; baseline 13.5%): `playToFinish` 0 → 29.0%; `endTurns` 3 → 28.5%; `endTurns` 8 → 9.5%.
  - **Effect in both formats** (first mover's share in mirrors, 5v5 then 7v7; baseline 70.5% and 84.3%):
    - `spendOpening` 0: 60.1%, 37.6%.
    - `tempoFirst` −1: 97.9%, 52.2%.
    - `tempoFirst` +1: 60.1%, 58.5%.
    - `tempoSecond` 0 (and `tempo` 0, the same thing while tempoFirst is 0): 88.5%, 56.0%.
    - `spareCommand` 0.8: 82.7%, 80.6%. It also wins more against Brain 8: 5v5 101–93, 7v7 92–107, against 88–106 and 82–118.
    - `holderJoins` 0 (Brain 8's B4): mirror turn-limit share 51.5% (5v5) and 18.5% (7v7). B4 still matters with victory values on.
  - **Per-format candidates (item 7, no tuning):** `tempoSecond` and `tempoFirst` move the two formats in opposite directions; `spendOpening` moves both, 7v7 far more. Values per format are tuned after Cavalry, as the brief says.
    - **Missing settings:** see F020-5 (late guarding).
- **Known gaps:**
  - TKO is left out of the finish chance. The finish chance counts at most 2 turns ahead and ignores blockers other than guards.
  - F022-8's Brain 9 arm and the move-order grid used Brain 9 with the spent opening on (as briefed, queued before the confirm); Brain 9 as it ships was not run against Brain 5.
  - The R28X-AJDH-DUP5 test game doesn't test a late lead any more (F020-2).
  - Brain 9's hash as shipped is a42c87df57b5cd87 (`brain9:spendOpening=1`: fac18e10712463bc; the 2043d10724a8f649 above was before the guard-aware outlook was added).
- **Flags closed / opened:** opened F020-1 to F020-5 (`flags/020.md`); F020-4 applied (spent opening ships off), the Editor may reverse it. F022-8: item 8's answer (neither the tempo nor the rule set) added to its row in `flags/022.md`; it stays DECIDE (the default opponent is the Editor's call).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/60
