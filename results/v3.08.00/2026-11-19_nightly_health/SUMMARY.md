# health

**Question:** Do main's full checks still pass, and how do 20 games per format of the default brain against itself end?

**Answer:** passed: all 4 night checks

**Key table** (v3.08.00, 40 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 20 | 6 | 4 | 4 | 6 | 0 | 10.0% | 40.0% | 0.0% | 50.0% | 40.0% | 17.8 | 20.0% |
| 7v7: brain5 v brain5, std7, mixed | 20 | 6 | 12 | 0 | 2 | 0 | 0.0% | 80.0% | 10.0% | 10.0% | 80.0% | 14.5 | 44.4% |

**Checks:** all 4 passed (`tables/checks.csv`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.8 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (9 turns, KO): seed 895M-TVWG-KH4B (5v5, game 9) [watch](https://productofdefiance.github.io/Flagfall/?watch=895M-TVWG-KH4B&v=v3.08.00&rules=v3.5&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed NUVN-6HPJ-G5FJ (7v7, game 8) [watch](https://productofdefiance.github.io/Flagfall/?watch=NUVN-6HPJ-G5FJ&v=v3.08.00&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
