# health

**Question:** Do main's full checks still pass, and how do 20 games per format of the default brain against itself end?

**Answer:** passed: all 4 night checks

**Key table** (v3.17.00, 40 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 20 | 2 | 4 | 7 | 6 | 1 | 0.0% | 25.0% | 5.0% | 70.0% | 25.0% | 21.4 | 66.7% |
| 7v7: brain8 v brain8, std7, mixed | 20 | 5 | 12 | 3 | 0 | 0 | 5.0% | 65.0% | 15.0% | 15.0% | 65.0% | 16.4 | 58.8% |

**Checks:** all 4 passed (`tables/checks.csv`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.8 and last damage on turn 11.3 on average (turn-limit games: 5.5 and 10.5). Turn-limit games end with 29.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.1 and last damage on turn 13.2 on average (turn-limit games: 2.3 and 13.3). Turn-limit games end with 44.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.2 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (10 turns, KO): seed 6US6-T9JG-4XT7 (7v7, game 2) [watch](https://productofdefiance.github.io/Flagfall/?watch=6US6-T9JG-4XT7&v=v3.17.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed K64G-NTWF-WT8N (7v7, game 3) [watch](https://productofdefiance.github.io/Flagfall/?watch=K64G-NTWF-WT8N&v=v3.17.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=S)
