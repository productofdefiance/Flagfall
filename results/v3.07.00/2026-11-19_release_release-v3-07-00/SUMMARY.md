# release-v3-07-00

**Question:** v3.07.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.4, 1,000 games per format?

**Answer:** 5v5: mirror, 56.6% ended on the turn limit, A/B 499–477; 7v7: mirror, 40.5% ended on the turn limit, A/B 467–499.

**Key table** (v3.07.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 231 | 203 | 268 | 274 | 24 | 3.6% | 27.9% | 11.9% | 56.6% | 27.9% | 19.27 | 29.3% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 274 | 321 | 193 | 178 | 34 | 4.2% | 42.1% | 13.2% | 40.5% | 42.2% | 21.94 | 46.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed YUX8-HXWP-JZ87 (5v5, game 173) [watch](https://productofdefiance.github.io/Flagfall/?watch=YUX8-HXWP-JZ87&v=v3.07.00&rules=v3.4&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed TCZR-AQ9B-CU66 (7v7, game 80) [watch](https://productofdefiance.github.io/Flagfall/?watch=TCZR-AQ9B-CU66&v=v3.07.00&rules=v3.4&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
