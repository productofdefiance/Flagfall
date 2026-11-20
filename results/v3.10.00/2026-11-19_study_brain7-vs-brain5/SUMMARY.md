# brain7-vs-brain5

**Question:** Does Brain 7 beat Brain 5 by 2+ standard errors at balanced 5v5 and 7v7 without losing clearly all-Light, and do Brain 7 mirrors use their leads (lead lost and lead unused down 4+ points) without stalling more than the Brain 5 baseline?

**Answer:** b7-v-b5-5v5: brain7 took 45.6% of games against brain5 (decisive 329–249, tiebreak 121–289, draws 12); b7-v-b5-7v7: brain7 took 50.0% of games against brain5 (decisive 387–291, tiebreak 96–192, draws 34); b7-v-b5-light-5v5: brain7 took 50.1% of games against brain5 (decisive 461–289, tiebreak 38–207, draws 5); b7-v-b5-light-7v7: brain7 took 45.6% of games against brain5 (decisive 420–350, tiebreak 24–181, draws 25); b7-mirror-5v5: mirror, 26.6% ended on the turn limit, A/B 507–486; b7-mirror-7v7: mirror, 17.6% ended on the turn limit, A/B 481–487.

**Key table** (v3.10.00, 6000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| b7-v-b5-5v5: brain7 v brain5, blitz5, mixed | 1000 | 329 | 249 | 121 | 289 | 12 | 5.6% | 32.6% | 19.6% | 42.2% | 32.6% | 17.49 | 35.8% |
| b7-v-b5-7v7: brain7 v brain5, std7, mixed | 1000 | 387 | 291 | 96 | 192 | 34 | 3.4% | 47.8% | 16.6% | 32.2% | 47.9% | 20.45 | 50.6% |
| b7-v-b5-light-5v5: brain7 v brain5, blitz5, light | 1000 | 461 | 289 | 38 | 207 | 5 | 20.5% | 39.7% | 14.8% | 25.0% | 39.8% | 13.93 | 68.3% |
| b7-v-b5-light-7v7: brain7 v brain5, std7, light | 1000 | 420 | 350 | 24 | 181 | 25 | 20.3% | 40.6% | 16.1% | 23.0% | 40.8% | 16.12 | 44.7% |
| b7-mirror-5v5: brain7 v brain7, blitz5, mixed | 1000 | 371 | 363 | 136 | 123 | 7 | 8.2% | 47.2% | 18.0% | 26.6% | 47.2% | 15.3 | 37.2% |
| b7-mirror-7v7: brain7 v brain7, std7, mixed | 1000 | 403 | 421 | 78 | 66 | 32 | 5.2% | 59.5% | 17.7% | 17.6% | 59.6% | 17.11 | 46.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- b7-v-b5-5v5: first attack on turn 2.0 and last damage on turn 11.4 on average (turn-limit games: 2.0 and 10.5). Turn-limit games end with 29.6 side-turns without an attack or pull on average. 99.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b7-v-b5-7v7: first attack on turn 3.1 and last damage on turn 13.2 on average (turn-limit games: 3.0 and 12.4). Turn-limit games end with 47.2 side-turns without an attack or pull on average. 99.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b7-v-b5-light-5v5: first attack on turn 3.5 and last damage on turn 10.4 on average (turn-limit games: 3.6 and 10.9). Turn-limit games end with 28.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b7-v-b5-light-7v7: first attack on turn 3.0 and last damage on turn 10.7 on average (turn-limit games: 3.1 and 11.6). Turn-limit games end with 49.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b7-mirror-5v5: first attack on turn 2.0 and last damage on turn 11.2 on average (turn-limit games: 2.0 and 9.4). Turn-limit games end with 31.7 side-turns without an attack or pull on average. 99.6% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b7-mirror-7v7: first attack on turn 3.0 and last damage on turn 13.1 on average (turn-limit games: 3.3 and 12.0). Turn-limit games end with 49.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** b7-v-b5-5v5: a real difference at this sample, -2.8 standard errors from even. b7-v-b5-7v7: within noise (0.0 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b7-v-b5-light-5v5: within noise (0.1 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b7-v-b5-light-7v7: a real difference at this sample, -2.8 standard errors from even. b7-mirror-5v5: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). b7-mirror-7v7: a mirror, so the A/B split is a check on noise (-0.2 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed G7ZW-M8HA-RUDD (b7-v-b5-light-5v5, game 780) [watch](https://productofdefiance.github.io/Flagfall/pr/33/?watch=G7ZW-M8HA-RUDD&v=v3.10.00&rules=v3.6&format=blitz5&n=brain7&s=brain5&mixn=light&mixs=light&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed HJY3-N8QK-EEZG (b7-v-b5-7v7, game 100) [watch](https://productofdefiance.github.io/Flagfall/pr/33/?watch=HJY3-N8QK-EEZG&v=v3.10.00&rules=v3.6&format=std7&n=brain7&s=brain5&mixn=mixed&mixs=mixed&first=N)
