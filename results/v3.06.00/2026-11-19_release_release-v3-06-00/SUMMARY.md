# release-v3-06-00

**Question:** v3.06.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.4, 1,000 games per format?

**Answer:** 5v5: mirror, 54.9% ended on the turn limit, A/B 470–501; 7v7: mirror, 42.5% ended on the turn limit, A/B 481–489.

**Key table** (v3.06.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 224 | 227 | 246 | 274 | 29 | 3.7% | 27.2% | 14.2% | 54.9% | 27.2% | 19.07 | 31.9% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 280 | 295 | 201 | 194 | 30 | 3.4% | 40.3% | 13.8% | 42.5% | 40.4% | 22.41 | 43.1% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-1.0 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.3 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed YMDM-ALDM-WXDH (5v5, game 131) [watch](https://productofdefiance.github.io/Flagfall/?watch=YMDM-ALDM-WXDH&v=v3.06.00&rules=v3.4&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed 55KT-SXXG-A9HK (7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/?watch=55KT-SXXG-A9HK&v=v3.06.00&rules=v3.4&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
