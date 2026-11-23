# brain9-moveorder-confirm

**Question:** Brief 020 item 6 confirm (sim-only, v3.9, Brain 9 mirrors, 1,000 games each): the move-order cells whose first mover's share of decisive games was 40-60% in the screen (5v5 Command 7 first turn 4, Command 8 first turn 8 and 5, all with Arrow Storm x1.5) plus every x1.5 cell with the reduced first turn (adds 5v5 Command 10 first turn 6 and 7v7 first turn 6). First mover's share of decisive games, turn-limit share, Command used on turn 1 per side, Arrow Storm kills per firing.

**Answer:** 5v5-c7-ft4-storm1p5: mirror, 19.4% ended on the turn limit, A/B 415–488; 5v5-c8-ft8-storm1p5: mirror, 19.8% ended on the turn limit, A/B 451–458; 5v5-c8-ft5-storm1p5: mirror, 17.7% ended on the turn limit, A/B 478–476; 5v5-c10-ft6-storm1p5: mirror, 20.0% ended on the turn limit, A/B 493–453; 7v7-c10-ft6-storm1p5: mirror, 6.2% ended on the turn limit, A/B 501–491.

**Key table** (v3.17.00, 5000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5-c7-ft4-storm1p5: brain9 v brain9, blitz5, mixed | 1000 | 368 | 438 | 47 | 50 | 97 | 7.6% | 48.6% | 24.4% | 19.4% | 48.6% | 16.35 | 48.0% |
| 5v5-c8-ft8-storm1p5: brain9 v brain9, blitz5, mixed | 1000 | 398 | 404 | 53 | 54 | 91 | 6.7% | 46.8% | 26.7% | 19.8% | 46.9% | 15.94 | 52.6% |
| 5v5-c8-ft5-storm1p5: brain9 v brain9, blitz5, mixed | 1000 | 423 | 400 | 55 | 76 | 46 | 7.6% | 48.7% | 26.0% | 17.7% | 49.0% | 15.88 | 55.2% |
| 5v5-c10-ft6-storm1p5: brain9 v brain9, blitz5, mixed | 1000 | 418 | 382 | 75 | 71 | 54 | 7.3% | 52.0% | 20.7% | 20.0% | 52.2% | 16.34 | 66.8% |
| 7v7-c10-ft6-storm1p5: brain9 v brain9, std7, mixed | 1000 | 478 | 460 | 23 | 31 | 8 | 4.4% | 71.5% | 17.9% | 6.2% | 71.7% | 15.28 | 76.4% |

**Stalls** (`tables/stall.csv`):
- 5v5-c7-ft4-storm1p5: first attack on turn 2.5 and last damage on turn 14.4 on average (turn-limit games: 2.5 and 14.7). Turn-limit games end with 21.0 side-turns without an attack or pull on average. 72.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-ft8-storm1p5: first attack on turn 1.9 and last damage on turn 14.0 on average (turn-limit games: 2.3 and 15.4). Turn-limit games end with 19.8 side-turns without an attack or pull on average. 69.2% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-ft5-storm1p5: first attack on turn 2.2 and last damage on turn 14.7 on average (turn-limit games: 2.2 and 18.2). Turn-limit games end with 14.0 side-turns without an attack or pull on average. 66.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c10-ft6-storm1p5: first attack on turn 2.2 and last damage on turn 15.2 on average (turn-limit games: 2.2 and 19.5). Turn-limit games end with 11.3 side-turns without an attack or pull on average. 58.5% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7-c10-ft6-storm1p5: first attack on turn 2.5 and last damage on turn 14.7 on average (turn-limit games: 2.4 and 25.4). Turn-limit games end with 19.7 side-turns without an attack or pull on average. 64.5% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5-c7-ft4-storm1p5: a mirror, so the A/B split is a check on noise (-2.3 standard errors from even). 5v5-c8-ft8-storm1p5: a mirror, so the A/B split is a check on noise (-0.2 standard errors from even). 5v5-c8-ft5-storm1p5: a mirror, so the A/B split is a check on noise (+0.1 standard errors from even). 5v5-c10-ft6-storm1p5: a mirror, so the A/B split is a check on noise (+1.3 standard errors from even). 7v7-c10-ft6-storm1p5: a mirror, so the A/B split is a check on noise (+0.3 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed BEUF-9UBK-CUDV (5v5-c10-ft6-storm1p5, game 690) not replayable: rule numbers changed for this run
- longest game (35 turns, turn limit, more pull damage): seed AC69-SXG3-G5QU (7v7-c10-ft6-storm1p5, game 120) not replayable: rule numbers changed for this run
