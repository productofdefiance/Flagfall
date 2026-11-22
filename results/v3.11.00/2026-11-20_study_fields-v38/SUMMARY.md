# fields-v38

**Question:** How do balanced games end on v3.8 (one field per format), Brain 5 against itself, on the same seeds as the other half of this pair?

**Answer:** 5v5: mirror, 61.9% ended on the turn limit, A/B 459–477; 7v7: mirror, 44.2% ended on the turn limit, A/B 527–466.

**Key table** (v3.11.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 180 | 201 | 279 | 276 | 64 | 3.9% | 23.5% | 10.7% | 61.9% | 23.5% | 20.58 | 58.0% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 287 | 271 | 240 | 195 | 7 | 4.0% | 39.4% | 12.4% | 44.2% | 39.4% | 22.22 | 31.4% |

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.4 and last damage on turn 12.3 on average (turn-limit games: 4.5 and 11.6). Turn-limit games end with 27.6 side-turns without an attack or pull on average. 99.4% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.5 and last damage on turn 12.2 on average (turn-limit games: 2.4 and 12.2). Turn-limit games end with 46.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+1.9 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed ZS7Q-PFW9-SPHU (7v7, game 370) [watch](https://productofdefiance.github.io/Flagfall/pr/36/?watch=ZS7Q-PFW9-SPHU&v=v3.11.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed 9LE9-CRA5-YRNW (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/36/?watch=9LE9-CRA5-YRNW&v=v3.11.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
