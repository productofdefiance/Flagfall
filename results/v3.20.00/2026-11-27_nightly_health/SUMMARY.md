# health

**Question:** Do main's full checks still pass, and how do 20 games per format of the default brain against itself end?

**Answer:** passed: all 4 night checks

**Key table** (v3.20.00, 40 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 20 | 10 | 7 | 2 | 1 | 0 | 5.0% | 75.0% | 5.0% | 15.0% | 75.0% | 12.85 | 35.3% |
| 7v7: brain8 v brain8, std7, mixed | 20 | 8 | 9 | 2 | 1 | 0 | 10.0% | 50.0% | 25.0% | 15.0% | 50.0% | 16.95 | 47.1% |

**Checks:** all 4 passed (`tables/checks.csv`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 1.4 and last damage on turn 10.2 on average (turn-limit games: 1.0 and 7.3). Turn-limit games end with 36.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.1 and last damage on turn 14.1 on average (turn-limit games: 2.3 and 15.7). Turn-limit games end with 39.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.9 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed THJT-QKZM-LGGR (5v5, game 14) [watch](https://productofdefiance.github.io/Flagfall/?watch=THJT-QKZM-LGGR&v=v3.20.00&rules=v3.10&format=blitz5&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed H2SN-JLVF-PZF5 (7v7, game 4) [watch](https://productofdefiance.github.io/Flagfall/?watch=H2SN-JLVF-PZF5&v=v3.20.00&rules=v3.10&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
