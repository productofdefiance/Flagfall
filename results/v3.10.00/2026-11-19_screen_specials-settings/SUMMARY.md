# specials-settings

**Question:** Settings review of Brain 5's new special settings: each moved up and down (or off) against the default Brain 5, v3.7 balanced 7v7, 200 games each. Which move results by more than the noise?

**Answer:** 9 matchups, 1800 games (per-matchup numbers in tables/outcomes.csv). A's share of games ranged from 25.8% (special-0) to 57.8% (warm-slack-0).

**Key table** (v3.10.00, 1800 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| special-0: brain5:special=0 v brain5, std7, mixed | 200 | 21 | 102 | 29 | 45 | 3 | 5.0% | 45.0% | 11.5% | 38.5% | 45.5% | 20.83 | 48.8% |
| special-1: brain5:special=1 v brain5, std7, mixed | 200 | 31 | 92 | 34 | 41 | 2 | 1.5% | 47.0% | 13.0% | 38.5% | 47.0% | 20.73 | 33.3% |
| warm-slack-0: brain5:warmSlack=0 v brain5, std7, mixed | 200 | 78 | 41 | 36 | 42 | 3 | 2.0% | 44.5% | 13.0% | 40.5% | 44.5% | 21.41 | 31.1% |
| warm-slack-2: brain5:warmSlack=2 v brain5, std7, mixed | 200 | 49 | 80 | 29 | 39 | 3 | 1.0% | 52.5% | 11.0% | 35.5% | 52.5% | 20.09 | 26.4% |
| warm-cost-0: brain5:warmCost=0 v brain5, std7, mixed | 200 | 56 | 72 | 28 | 38 | 6 | 4.0% | 47.0% | 13.0% | 36.0% | 47.0% | 20.41 | 22.7% |
| warm-cost-3: brain5:warmCost=3 v brain5, std7, mixed | 200 | 41 | 69 | 41 | 48 | 1 | 4.0% | 37.0% | 14.0% | 45.0% | 37.0% | 22.58 | 38.2% |
| special-margin-3: brain5:specialMargin=3 v brain5, std7, mixed | 200 | 62 | 59 | 36 | 36 | 7 | 4.5% | 43.5% | 12.5% | 39.5% | 43.5% | 21.11 | 33.9% |
| warm-moves-1: brain5:warmMoves=1 v brain5, std7, mixed | 200 | 62 | 51 | 44 | 37 | 6 | 2.0% | 46.0% | 8.5% | 43.5% | 46.0% | 21.91 | 29.2% |
| warm-moves-8: brain5:warmMoves=8 v brain5, std7, mixed | 200 | 47 | 57 | 47 | 43 | 6 | 2.5% | 40.0% | 9.5% | 48.0% | 40.0% | 22.89 | 30.8% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- special-0: first attack on turn 2.3 and last damage on turn 12.0 on average (turn-limit games: 2.2 and 12.2). Turn-limit games end with 46.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- special-1: first attack on turn 2.5 and last damage on turn 12.1 on average (turn-limit games: 2.6 and 12.7). Turn-limit games end with 45.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- warm-slack-0: first attack on turn 2.6 and last damage on turn 12.3 on average (turn-limit games: 2.7 and 12.4). Turn-limit games end with 45.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- warm-slack-2: first attack on turn 2.2 and last damage on turn 11.6 on average (turn-limit games: 2.2 and 11.1). Turn-limit games end with 48.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- warm-cost-0: first attack on turn 2.4 and last damage on turn 11.9 on average (turn-limit games: 2.4 and 11.4). Turn-limit games end with 47.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- warm-cost-3: first attack on turn 2.3 and last damage on turn 12.2 on average (turn-limit games: 2.3 and 12.0). Turn-limit games end with 46.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- special-margin-3: first attack on turn 2.4 and last damage on turn 12.3 on average (turn-limit games: 2.3 and 12.6). Turn-limit games end with 45.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- warm-moves-1: first attack on turn 2.4 and last damage on turn 11.8 on average (turn-limit games: 2.5 and 11.9). Turn-limit games end with 46.8 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- warm-moves-8: first attack on turn 2.4 and last damage on turn 12.0 on average (turn-limit games: 2.4 and 12.3). Turn-limit games end with 45.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** special-0: a real difference at this sample, -6.9 standard errors from even. special-1: a real difference at this sample, -4.8 standard errors from even. warm-slack-0: a real difference at this sample, 2.2 standard errors from even. warm-slack-2: a real difference at this sample, -2.9 standard errors from even. warm-cost-0: within noise (-1.8 standard errors; F23 asks for 2+ at 1,000+ games before ruling). warm-cost-3: a real difference at this sample, -2.5 standard errors from even. special-margin-3: within noise (0.2 standard errors; F23 asks for 2+ at 1,000+ games before ruling). warm-moves-1: within noise (1.3 standard errors; F23 asks for 2+ at 1,000+ games before ruling). warm-moves-8: within noise (-0.4 standard errors; F23 asks for 2+ at 1,000+ games before ruling). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed 3TT8-PNDA-VNJM (warm-moves-8, game 40) not replayable: brain settings changed for this run
- longest game (35 turns, turn limit, more pull damage): seed AXGM-NERH-M2K9 (special-0, game 40) not replayable: brain settings changed for this run
