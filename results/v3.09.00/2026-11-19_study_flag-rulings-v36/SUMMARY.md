# flag-rulings-v36

**Question:** Do the flag rulings (v3.6) change how balanced games end, with Brain 5 against itself, on the same seeds as the v3.5 run?

**Answer:** 5v5: mirror, 56.7% ended on the turn limit, A/B 474–503; 7v7: mirror, 44.8% ended on the turn limit, A/B 453–510.

**Key table** (v3.09.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 223 | 210 | 251 | 293 | 23 | 3.7% | 26.3% | 13.3% | 56.7% | 26.4% | 19.23 | 38.6% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 267 | 285 | 186 | 225 | 37 | 4.4% | 38.3% | 12.5% | 44.8% | 38.5% | 22.84 | 46.9% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.8 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed WDYP-32ZF-XAMN (7v7, game 461) [watch](https://productofdefiance.github.io/Flagfall/pr/27/?watch=WDYP-32ZF-XAMN&v=v3.09.00&rules=v3.6&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed 72TT-C9GB-B96B (7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/pr/27/?watch=72TT-C9GB-B96B&v=v3.09.00&rules=v3.6&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
