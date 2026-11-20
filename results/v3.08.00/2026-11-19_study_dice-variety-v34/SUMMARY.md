# dice-variety-v34

**Question:** Brief 010's control: how do balanced games end on v3.4 with the default brain (Brain 5) against itself, on the same seeds as the v3.5 run?

**Answer:** 5v5: mirror, 52.6% ended on the turn limit, A/B 498–487; 7v7: mirror, 43.2% ended on the turn limit, A/B 492–474.

**Key table** (v3.08.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 241 | 233 | 257 | 254 | 15 | 4.8% | 28.1% | 14.5% | 52.6% | 28.1% | 18.78 | 30.0% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 294 | 274 | 198 | 200 | 34 | 3.2% | 40.0% | 13.6% | 43.2% | 40.1% | 22.47 | 42.6% |

**Checks:** FAILED: other brain tests (30) (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.3 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.6 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed TPQ3-AFMN-X97U (5v5, game 721) [watch](https://productofdefiance.github.io/Flagfall/pr/21/?watch=TPQ3-AFMN-X97U&v=v3.08.00&rules=v3.4&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed YVPZ-AF6A-2BM3 (7v7, game 60) [watch](https://productofdefiance.github.io/Flagfall/pr/21/?watch=YVPZ-AF6A-2BM3&v=v3.08.00&rules=v3.4&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
