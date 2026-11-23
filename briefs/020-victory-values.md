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

## Report back
The standard Report, every measurement, the hunch table and the test game. In plain words:
- Does the brain press to finish when it leads, and does it stall less than Brain 8?
- The hunch: at −1, does a beaten side give up its flag? Does −2 fix it, and what does −2 cost (a more careful leader, more turn-limit games)?
- Points versus wins: does playing to finish win fewer games but score more by the Editor's table?
- Does any of Brain 8's behaviours (holder joins, safe approach, warmed-special respect, opening tempo) stop mattering once victory values are on?
- Why does Brain 8 lose tiebreaks to Brain 5 on v3.9: the tempo, the rule set, or both (F022-8)? Does Brain 9 win them back?
- Which settings matter differently at 5v5 and 7v7 (the baseline for tuning per format after Cavalry), and does spending the opening Command change the 5v5 move-order picture at Command 7, 8 or 10?
Say whether each cause is isolated or only likely.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a (no rule change); the measurements above instead
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
