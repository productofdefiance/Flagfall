# storm-v310

**Question:** Arrow Storm 1.5 times and minimum damage 0.5 (v3.10) against v3.9 on the same seeds, Brain 8 against itself, balanced 5v5 and 7v7: how do games end, who loses their Light Ranged first, is Storm still warmed up and fired, and how often does the minimum damage apply?

**Answer:** v39-5v5: mirror, 44.3% ended on the turn limit, A/B 492–440; v310-5v5: mirror, 23.4% ended on the turn limit, A/B 504–476; v39-7v7: mirror, 10.9% ended on the turn limit, A/B 500–492; v310-7v7: mirror, 13.2% ended on the turn limit, A/B 494–490.

**Key table** (v3.18.00, 4000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v39-5v5: brain8 v brain8, blitz5, mixed | 1000 | 288 | 269 | 204 | 171 | 68 | 4.6% | 42.2% | 8.9% | 44.3% | 42.2% | 18.5 | 53.5% |
| v310-5v5: brain8 v brain8, blitz5, mixed | 1000 | 399 | 367 | 105 | 109 | 20 | 6.4% | 58.7% | 11.5% | 23.4% | 58.7% | 14.4 | 41.9% |
| v39-7v7: brain8 v brain8, std7, mixed | 1000 | 453 | 438 | 47 | 54 | 8 | 4.3% | 65.8% | 19.0% | 10.9% | 65.8% | 15.5 | 44.6% |
| v310-7v7: brain8 v brain8, std7, mixed | 1000 | 440 | 428 | 54 | 62 | 16 | 4.8% | 63.9% | 18.1% | 13.2% | 63.9% | 16.27 | 49.2% |

**Stalls** (`tables/stall.csv`):
- v39-5v5: first attack on turn 4.3 and last damage on turn 12.0 on average (turn-limit games: 4.9 and 10.2). Turn-limit games end with 30.4 side-turns without an attack or pull on average. 97.1% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- v310-5v5: first attack on turn 1.3 and last damage on turn 10.4 on average (turn-limit games: 1.3 and 7.9). Turn-limit games end with 34.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- v39-7v7: first attack on turn 2.2 and last damage on turn 13.0 on average (turn-limit games: 2.4 and 11.9). Turn-limit games end with 46.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- v310-7v7: first attack on turn 2.2 and last damage on turn 13.2 on average (turn-limit games: 2.3 and 11.8). Turn-limit games end with 46.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** v39-5v5: a mirror, so the A/B split is a check on noise (+1.6 standard errors from even). v310-5v5: a mirror, so the A/B split is a check on noise (+0.9 standard errors from even). v39-7v7: a mirror, so the A/B split is a check on noise (+0.3 standard errors from even). v310-7v7: a mirror, so the A/B split is a check on noise (+0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** F022-9, F39, F12

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed P73K-QJVX-U3QE (v310-5v5, game 271) [watch](https://productofdefiance.github.io/Flagfall/pr/65/?watch=P73K-QJVX-U3QE&v=v3.18.00&rules=v3.10&format=blitz5&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 7UTL-4PZA-F6AX (v39-7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/pr/65/?watch=7UTL-4PZA-F6AX&v=v3.18.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
