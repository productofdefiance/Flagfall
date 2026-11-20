# health

**Question:** Do main's full checks still pass, and how do 20 games per format of the default brain against itself end?

**Answer:** passed: all 4 night checks

**Key table** (v3.11.00, 40 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 20 | 7 | 7 | 2 | 3 | 1 | 5.0% | 35.0% | 30.0% | 30.0% | 35.0% | 15 | 7.1% |
| 7v7: brain5 v brain5, std7, mixed | 20 | 3 | 11 | 5 | 1 | 0 | 0.0% | 55.0% | 15.0% | 30.0% | 55.0% | 18.85 | 14.3% |

**Checks:** all 4 passed (`tables/checks.csv`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.9 and last damage on turn 10.8 on average (turn-limit games: 2.3 and 10.8). Turn-limit games end with 29.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.5 and last damage on turn 11.9 on average (turn-limit games: 2.7 and 11.8). Turn-limit games end with 47.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.2 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (9 turns, KO): seed 9UHD-PZYR-34BF (5v5, game 13) [watch](https://productofdefiance.github.io/Flagfall/?watch=9UHD-PZYR-34BF&v=v3.11.00&rules=v3.7&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed H2SN-JLVF-PZF5 (7v7, game 4) [watch](https://productofdefiance.github.io/Flagfall/?watch=H2SN-JLVF-PZF5&v=v3.11.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
