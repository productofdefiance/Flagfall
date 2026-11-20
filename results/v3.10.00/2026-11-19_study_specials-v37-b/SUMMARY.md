# specials-v37-b

**Question:** Re-run on the fixed bot (it now counts an enemy's warmed-up Arrow Storm without Dodge, as the engine deals it; Skewer warms only for a plausible line-up), same seeds as specials-v37. How do balanced games end on v3.7 (specials), Brain 5 against itself, on the same seeds as the v3.6 run (flag-rulings-v36)?

**Answer:** 5v5: mirror, 34.3% ended on the turn limit, A/B 491–504; 7v7: mirror, 41.7% ended on the turn limit, A/B 478–503.

**Key table** (v3.10.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 336 | 321 | 155 | 183 | 5 | 4.4% | 41.3% | 20.0% | 34.3% | 41.3% | 15.88 | 5.3% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 282 | 301 | 196 | 202 | 19 | 3.7% | 41.6% | 13.0% | 41.7% | 41.7% | 21.61 | 31.6% |

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.8 and last damage on turn 11.0 on average (turn-limit games: 2.5 and 10.8). Turn-limit games end with 29.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.5 and last damage on turn 12.1 on average (turn-limit games: 2.4 and 12.2). Turn-limit games end with 46.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.4 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.8 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed XNQ8-ZVB8-NP4A (7v7, game 760) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=XNQ8-ZVB8-NP4A&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed K5ZJ-ZZJJ-GRJ7 (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=K5ZJ-ZZJJ-GRJ7&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
