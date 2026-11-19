# flag-rulings-v35

**Question:** Brief 015's control: how do balanced games end on v3.5 with Brain 5 against itself, on the same seeds as the v3.6 runs?

**Answer:** 5v5: mirror, 56.4% ended on the turn limit, A/B 472–505; 7v7: mirror, 44.8% ended on the turn limit, A/B 452–511.

**Key table** (v3.09.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 223 | 213 | 249 | 292 | 23 | 3.6% | 26.7% | 13.3% | 56.4% | 26.8% | 19.2 | 38.5% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 267 | 285 | 185 | 226 | 37 | 4.3% | 38.3% | 12.6% | 44.8% | 38.5% | 22.84 | 46.7% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-1.0 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.9 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed WDYP-32ZF-XAMN (7v7, game 461) [watch](https://productofdefiance.github.io/Flagfall/pr/27/?watch=WDYP-32ZF-XAMN&v=v3.09.00&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed 72TT-C9GB-B96B (7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/pr/27/?watch=72TT-C9GB-B96B&v=v3.09.00&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
