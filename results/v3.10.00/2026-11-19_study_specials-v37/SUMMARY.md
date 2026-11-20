# specials-v37

**Question:** How do balanced games end on v3.7 (specials), Brain 5 against itself, on the same seeds as the v3.6 run (flag-rulings-v36)?

**Answer:** 5v5: mirror, 17.8% ended on the turn limit, A/B 497–494; 7v7: mirror, 45.6% ended on the turn limit, A/B 492–480.

**Key table** (v3.10.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 412 | 410 | 85 | 84 | 9 | 7.1% | 56.6% | 18.5% | 17.8% | 56.6% | 12.97 | 1.8% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 271 | 273 | 221 | 207 | 28 | 3.1% | 39.0% | 12.3% | 45.6% | 39.0% | 22.56 | 33.5% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.4 and last damage on turn 10.3 on average (turn-limit games: 2.5 and 9.9). Turn-limit games end with 30.8 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.4 and last damage on turn 12.1 on average (turn-limit games: 2.4 and 12.0). Turn-limit games end with 46.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.1 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.4 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed H5GM-UAQA-L97R (5v5, game 640) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=H5GM-UAQA-L97R&v=v3.10.00&rules=v3.7&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed 72TT-C9GB-B96B (7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=72TT-C9GB-B96B&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
