# release-v3-09-00

**Question:** v3.09.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.6, 1,000 games per format?

**Answer:** 5v5: mirror, 56.3% ended on the turn limit, A/B 507–468; 7v7: mirror, 43.8% ended on the turn limit, A/B 495–460.

**Key table** (v3.09.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 229 | 208 | 278 | 260 | 25 | 4.8% | 28.3% | 10.6% | 56.3% | 28.3% | 19.21 | 41.0% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 286 | 276 | 209 | 184 | 45 | 3.6% | 40.5% | 12.1% | 43.8% | 40.5% | 22.57 | 47.1% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+1.2 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+1.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed CJU4-TPHK-VTFN (5v5, game 341) [watch](https://productofdefiance.github.io/Flagfall/?watch=CJU4-TPHK-VTFN&v=v3.09.00&rules=v3.6&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed WZGB-UHQY-73KN (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/?watch=WZGB-UHQY-73KN&v=v3.09.00&rules=v3.6&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
