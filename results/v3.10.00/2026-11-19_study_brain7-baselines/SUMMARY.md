# brain7-baselines

**Question:** The Brain 5 baselines for Brain 7 with the three new measures (lead lost, lead unused, units lost alone or together): v3.5 replays the stall 'before' games exactly (same seeds, so its outcome table must match 2026-11-19_study_stall-before), and v3.6 plays the same deals on the newest rule set.

**Answer:** b5-v35-5v5: mirror, 58.0% ended on the turn limit, A/B 514–461; b5-v35-7v7: mirror, 40.7% ended on the turn limit, A/B 482–484; b5-v36-5v5: mirror, 57.9% ended on the turn limit, A/B 514–461; b5-v36-7v7: mirror, 40.4% ended on the turn limit, A/B 482–484.

**Key table** (v3.10.00, 4000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| b5-v35-5v5: brain5 v brain5, blitz5, mixed | 1000 | 217 | 203 | 297 | 258 | 25 | 5.6% | 25.1% | 11.3% | 58.0% | 25.1% | 19.46 | 43.3% |
| b5-v35-7v7: brain5 v brain5, std7, mixed | 1000 | 309 | 284 | 173 | 200 | 34 | 5.2% | 40.4% | 13.7% | 40.7% | 40.5% | 22.04 | 53.6% |
| b5-v36-5v5: brain5 v brain5, blitz5, mixed | 1000 | 217 | 204 | 297 | 257 | 25 | 5.6% | 25.2% | 11.3% | 57.9% | 25.2% | 19.45 | 43.5% |
| b5-v36-7v7: brain5 v brain5, std7, mixed | 1000 | 311 | 285 | 171 | 199 | 34 | 5.2% | 40.6% | 13.8% | 40.4% | 40.6% | 21.97 | 53.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- b5-v35-5v5: first attack on turn 2.0 and last damage on turn 11.4 on average (turn-limit games: 2.0 and 11.1). Turn-limit games end with 28.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b5-v35-7v7: first attack on turn 3.1 and last damage on turn 13.0 on average (turn-limit games: 3.1 and 12.7). Turn-limit games end with 46.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b5-v36-5v5: first attack on turn 2.0 and last damage on turn 11.4 on average (turn-limit games: 2.0 and 11.1). Turn-limit games end with 28.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b5-v36-7v7: first attack on turn 3.1 and last damage on turn 13.0 on average (turn-limit games: 3.1 and 12.7). Turn-limit games end with 46.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** b5-v35-5v5: a mirror, so the A/B split is a check on noise (+1.7 standard errors from even). b5-v35-7v7: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). b5-v36-5v5: a mirror, so the A/B split is a check on noise (+1.7 standard errors from even). b5-v36-7v7: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed BGK5-Q6ST-8XHM (b5-v35-5v5, game 91) [watch](https://productofdefiance.github.io/Flagfall/pr/33/?watch=BGK5-Q6ST-8XHM&v=v3.10.00&rules=v3.5&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed Y7NA-256A-BD3G (b5-v35-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/33/?watch=Y7NA-256A-BD3G&v=v3.10.00&rules=v3.5&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
