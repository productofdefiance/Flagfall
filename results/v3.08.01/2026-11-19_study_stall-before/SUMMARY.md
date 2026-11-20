# stall-before

**Question:** The stall baseline: when does fighting start and stop, how quiet is the ending, and what does each side have left, in balanced Brain 5 mirrors on v3.5? Same seeds as v3.08.00's release run, so the outcome table must match it exactly.

**Answer:** 5v5: mirror, 58.0% ended on the turn limit, A/B 514–461; 7v7: mirror, 40.7% ended on the turn limit, A/B 482–484.

**Key table** (v3.08.01, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 217 | 203 | 297 | 258 | 25 | 5.6% | 25.1% | 11.3% | 58.0% | 25.1% | 19.46 | 43.3% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 309 | 284 | 173 | 200 | 34 | 5.2% | 40.4% | 13.7% | 40.7% | 40.5% | 22.04 | 53.6% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.0 and last damage on turn 11.4 on average (turn-limit games: 2.0 and 11.1). Turn-limit games end with 28.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 3.1 and last damage on turn 13.0 on average (turn-limit games: 3.1 and 12.7). Turn-limit games end with 46.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+1.7 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed BGK5-Q6ST-8XHM (5v5, game 91) [watch](https://productofdefiance.github.io/Flagfall/pr/28/?watch=BGK5-Q6ST-8XHM&v=v3.08.01&rules=v3.5&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed Y7NA-256A-BD3G (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/28/?watch=Y7NA-256A-BD3G&v=v3.08.01&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
