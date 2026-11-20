# fields-v37

**Question:** How do balanced games end on v3.7 (legacy field), the baseline for v3.8, Brain 5 against itself, on the same seeds as the other half of this pair?

**Answer:** 5v5: mirror, 35.1% ended on the turn limit, A/B 497–492; 7v7: mirror, 42.7% ended on the turn limit, A/B 465–521.

**Key table** (v3.11.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 322 | 327 | 175 | 165 | 11 | 2.3% | 44.0% | 18.6% | 35.1% | 44.0% | 15.89 | 3.2% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 279 | 294 | 186 | 227 | 14 | 3.1% | 41.6% | 12.6% | 42.7% | 41.8% | 21.98 | 29.0% |

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.9 and last damage on turn 10.8 on average (turn-limit games: 2.5 and 10.5). Turn-limit games end with 29.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.5 and last damage on turn 12.2 on average (turn-limit games: 2.5 and 12.1). Turn-limit games end with 46.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.2 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.8 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed XPAJ-R5X7-MV93 (5v5, game 323) [watch](https://productofdefiance.github.io/Flagfall/pr/36/?watch=XPAJ-R5X7-MV93&v=v3.11.00&rules=v3.7&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 9LE9-CRA5-YRNW (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/36/?watch=9LE9-CRA5-YRNW&v=v3.11.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
