# dice-variety-v35

**Question:** Does a little dice variety (v3.5) change how balanced games end, with Brain 5 against itself, on the same seeds as the v3.4 run?

**Answer:** 5v5: mirror, 56.2% ended on the turn limit, A/B 490–494; 7v7: mirror, 43.3% ended on the turn limit, A/B 477–473.

**Key table** (v3.08.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 214 | 224 | 276 | 270 | 16 | 4.2% | 27.5% | 12.1% | 56.2% | 27.5% | 19.13 | 37.7% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 283 | 284 | 194 | 189 | 50 | 4.3% | 40.8% | 11.6% | 43.3% | 41.0% | 22.54 | 52.4% |

**Checks:** FAILED: other brain tests (30) (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed 35QV-K9FP-DM6T (5v5, game 570) [watch](https://productofdefiance.github.io/Flagfall/pr/21/?watch=35QV-K9FP-DM6T&v=v3.08.00&rules=v3.5&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed HVAR-94TJ-TQRC (7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/pr/21/?watch=HVAR-94TJ-TQRC&v=v3.08.00&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
