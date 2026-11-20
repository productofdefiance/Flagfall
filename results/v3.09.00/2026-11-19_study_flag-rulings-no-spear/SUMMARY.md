# flag-rulings-no-spear

**Question:** One switch off: v3.6 with spearOnArrival off (a sim-only copy), Brain 5 mirror, same seeds as the v3.6 run. Which of the four rules moves the results?

**Answer:** 5v5: mirror, 56.6% ended on the turn limit, A/B 474–503; 7v7: mirror, 44.9% ended on the turn limit, A/B 453–510.

**Key table** (v3.09.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 224 | 210 | 250 | 293 | 23 | 3.7% | 26.4% | 13.3% | 56.6% | 26.5% | 19.21 | 38.7% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 267 | 284 | 186 | 226 | 37 | 4.3% | 38.2% | 12.6% | 44.9% | 38.4% | 22.86 | 46.8% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.8 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed WDYP-32ZF-XAMN (7v7, game 461) not replayable: rule switches changed for this run
- longest game (35 turns, turn limit, fewer beings lost): seed 72TT-C9GB-B96B (7v7, game 20) not replayable: rule switches changed for this run
