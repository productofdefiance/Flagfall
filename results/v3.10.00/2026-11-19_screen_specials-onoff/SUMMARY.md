# specials-onoff

**Question:** Specials on vs off: Brain 5 using specials (A) against Brain 5 ignoring them (useSpecials=0), v3.7, 400 games per format, sides and move order swapped evenly. If off wins by more than the noise, specials are a trap as written (ASK).

**Answer:** balanced-5v5: brain5 took 80.3% of games against brain5:useSpecials=0 (decisive 236–23, tiebreak 83–54, draws 4); balanced-7v7: brain5 took 70.8% of games against brain5:useSpecials=0 (decisive 191–50, tiebreak 89–64, draws 6); light-7v7: brain5 took 88.4% of games against brain5:useSpecials=0 (decisive 284–11, tiebreak 68–34, draws 3).

**Key table** (v3.10.00, 1200 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| balanced-5v5: brain5 v brain5:useSpecials=0, blitz5, mixed | 400 | 236 | 23 | 83 | 54 | 4 | 5.3% | 42.8% | 16.8% | 35.3% | 42.8% | 15.61 | 42.1% |
| balanced-7v7: brain5 v brain5:useSpecials=0, std7, mixed | 400 | 191 | 50 | 89 | 64 | 6 | 4.0% | 45.0% | 11.3% | 39.8% | 45.0% | 21.3 | 49.4% |
| light-7v7: brain5 v brain5:useSpecials=0, std7, light | 400 | 284 | 11 | 68 | 34 | 3 | 17.3% | 44.5% | 12.0% | 26.3% | 44.8% | 15.66 | 50.2% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- balanced-5v5: first attack on turn 2.5 and last damage on turn 10.4 on average (turn-limit games: 2.3 and 10.3). Turn-limit games end with 29.8 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- balanced-7v7: first attack on turn 2.6 and last damage on turn 12.3 on average (turn-limit games: 2.6 and 12.4). Turn-limit games end with 45.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- light-7v7: first attack on turn 2.4 and last damage on turn 9.2 on average (turn-limit games: 2.4 and 10.2). Turn-limit games end with 50.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** balanced-5v5: a real difference at this sample, 12.1 standard errors from even. balanced-7v7: a real difference at this sample, 8.3 standard errors from even. light-7v7: a real difference at this sample, 15.4 standard errors from even. Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (5 turns, KO): seed ACDA-67G5-MMT8 (light-7v7, game 310) not replayable: brain settings changed for this run
- longest game (35 turns, turn limit, fewer beings lost): seed GN7R-SDS4-PQBD (balanced-7v7, game 0) not replayable: brain settings changed for this run
