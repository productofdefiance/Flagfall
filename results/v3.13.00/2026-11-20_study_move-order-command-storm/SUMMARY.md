# move-order-command-storm

**Question:** Does equal Command on turn 1 bring the first mover's share of decisive games to 45-55% at 5v5 and 7v7, alone and with Arrow Storm at x1.5?

**Answer:** 10 matchups, 10000 games (per-matchup numbers in tables/outcomes.csv). Mirrors ended on the turn limit in 50.2% of games.

**Key table** (v3.13.00, 10000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7v7-ftc6: brain5 v brain5, std7, mixed | 1000 | 289 | 282 | 220 | 195 | 14 | 2.4% | 40.1% | 14.6% | 42.9% | 40.1% | 22 | 30.3% |
| 7v7-ftc8: brain5 v brain5, std7, mixed | 1000 | 293 | 280 | 216 | 200 | 11 | 4.8% | 39.3% | 13.2% | 42.7% | 39.3% | 21.88 | 37.2% |
| 7v7-ftc10: brain5 v brain5, std7, mixed | 1000 | 287 | 273 | 198 | 234 | 8 | 3.1% | 41.3% | 11.6% | 44.0% | 41.5% | 22.18 | 43.6% |
| 7v7-ftc6-storm15: brain5 v brain5, std7, mixed | 1000 | 307 | 274 | 211 | 199 | 9 | 3.5% | 42.4% | 12.2% | 41.9% | 42.6% | 21.76 | 39.1% |
| 7v7-ftc10-storm15: brain5 v brain5, std7, mixed | 1000 | 277 | 284 | 210 | 221 | 8 | 2.5% | 42.4% | 11.2% | 43.9% | 42.6% | 22.17 | 49.7% |
| 5v5-c10-ftc6: brain5 v brain5, blitz5, mixed | 1000 | 193 | 174 | 292 | 264 | 77 | 5.3% | 23.4% | 8.0% | 63.3% | 23.4% | 20.69 | 57.2% |
| 5v5-c8-ftc5: brain5 v brain5, blitz5, mixed | 1000 | 299 | 284 | 206 | 194 | 17 | 6.6% | 31.6% | 20.1% | 41.7% | 31.6% | 17.39 | 76.3% |
| 5v5-c8-ftc8: brain5 v brain5, blitz5, mixed | 1000 | 228 | 189 | 229 | 211 | 143 | 4.5% | 22.4% | 14.8% | 58.3% | 22.4% | 19.72 | 60.4% |
| 5v5-c8-ftc5-storm15: brain5 v brain5, blitz5, mixed | 1000 | 187 | 196 | 297 | 265 | 55 | 4.3% | 20.8% | 13.2% | 61.7% | 20.8% | 19.77 | 26.4% |
| 5v5-c8-ftc8-storm15: brain5 v brain5, blitz5, mixed | 1000 | 187 | 196 | 297 | 265 | 55 | 4.3% | 20.8% | 13.2% | 61.7% | 20.8% | 19.77 | 26.4% |

**Stalls** (`tables/stall.csv`):
- 7v7-ftc6: first attack on turn 2.4 and last damage on turn 12.2 on average (turn-limit games: 2.4 and 12.1). Turn-limit games end with 46.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7-ftc8: first attack on turn 2.2 and last damage on turn 12.0 on average (turn-limit games: 2.2 and 11.8). Turn-limit games end with 46.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7-ftc10: first attack on turn 2.2 and last damage on turn 12.0 on average (turn-limit games: 2.1 and 11.8). Turn-limit games end with 46.8 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7-ftc6-storm15: first attack on turn 2.4 and last damage on turn 12.1 on average (turn-limit games: 2.5 and 12.0). Turn-limit games end with 46.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7-ftc10-storm15: first attack on turn 2.1 and last damage on turn 12.0 on average (turn-limit games: 2.1 and 11.9). Turn-limit games end with 46.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c10-ftc6: first attack on turn 4.5 and last damage on turn 11.9 on average (turn-limit games: 4.7 and 11.2). Turn-limit games end with 28.4 side-turns without an attack or pull on average. 98.4% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-ftc5: first attack on turn 4.4 and last damage on turn 11.7 on average (turn-limit games: 4.4 and 11.3). Turn-limit games end with 27.7 side-turns without an attack or pull on average. 99.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-ftc8: first attack on turn 4.4 and last damage on turn 10.9 on average (turn-limit games: 4.2 and 9.9). Turn-limit games end with 30.6 side-turns without an attack or pull on average. 99.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-ftc5-storm15: first attack on turn 1.6 and last damage on turn 10.5 on average (turn-limit games: 2.0 and 10.0). Turn-limit games end with 30.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-ftc8-storm15: first attack on turn 1.6 and last damage on turn 10.5 on average (turn-limit games: 2.0 and 10.0). Turn-limit games end with 30.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 7v7-ftc6: a mirror, so the A/B split is a check on noise (+1.0 standard errors from even). 7v7-ftc8: a mirror, so the A/B split is a check on noise (+0.9 standard errors from even). 7v7-ftc10: a mirror, so the A/B split is a check on noise (-0.7 standard errors from even). 7v7-ftc6-storm15: a mirror, so the A/B split is a check on noise (+1.4 standard errors from even). 7v7-ftc10-storm15: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). 5v5-c10-ftc6: a mirror, so the A/B split is a check on noise (+1.5 standard errors from even). 5v5-c8-ftc5: a mirror, so the A/B split is a check on noise (+0.9 standard errors from even). 5v5-c8-ftc8: a mirror, so the A/B split is a check on noise (+1.8 standard errors from even). 5v5-c8-ftc5-storm15: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). 5v5-c8-ftc8-storm15: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed DVJT-BGW8-RJ72 (5v5-c8-ftc5-storm15, game 21) not replayable: rule numbers changed for this run
- longest game (35 turns, turn limit, more pull damage): seed LDGL-3YCB-EWUE (7v7-ftc6, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/49/?watch=LDGL-3YCB-EWUE&v=v3.13.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
