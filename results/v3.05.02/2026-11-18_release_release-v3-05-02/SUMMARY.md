# release-v3-05-02

**Question:** v3.05.02's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.4, 1,000 games per format?

**Answer:** 5v5: mirror, 57.8% ended on the turn limit, A/B 490–482; 7v7: mirror, 44.5% ended on the turn limit, A/B 470–501.

**Key table** (v3.05.02, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 208 | 214 | 282 | 268 | 28 | 4.0% | 26.4% | 11.8% | 57.8% | 26.4% | 19.41 | 30.1% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 275 | 280 | 195 | 221 | 29 | 2.9% | 40.9% | 11.7% | 44.5% | 40.9% | 22.76 | 45.1% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.3 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed UKGE-Q5EC-DR3V (5v5, game 740) [watch](https://productofdefiance.github.io/Flagfall/?watch=UKGE-Q5EC-DR3V&v=v3.05.02&rules=v3.4&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed 4Q6Y-9EKE-ZLHW (7v7, game 80) [watch](https://productofdefiance.github.io/Flagfall/?watch=4Q6Y-9EKE-ZLHW&v=v3.05.02&rules=v3.4&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
