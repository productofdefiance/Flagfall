# release-v3-08-00

**Question:** v3.08.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.5, 1,000 games per format?

**Answer:** 5v5: mirror, 58.0% ended on the turn limit, A/B 514–461; 7v7: mirror, 40.7% ended on the turn limit, A/B 482–484.

**Key table** (v3.08.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 217 | 203 | 297 | 258 | 25 | 5.6% | 25.1% | 11.3% | 58.0% | 25.1% | 19.46 | 43.3% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 309 | 284 | 173 | 200 | 34 | 5.2% | 40.4% | 13.7% | 40.7% | 40.5% | 22.04 | 53.6% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+1.7 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed BGK5-Q6ST-8XHM (5v5, game 91) [watch](https://productofdefiance.github.io/Flagfall/?watch=BGK5-Q6ST-8XHM&v=v3.08.00&rules=v3.5&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed Y7NA-256A-BD3G (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/?watch=Y7NA-256A-BD3G&v=v3.08.00&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
