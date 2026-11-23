# brain9-screen

**Question:** Brief 020 screen (200 games each, v3.9, balanced, same deals): Brain 8 mirror (A), Brain 9 mirror with finished -1 (B) and -2 (C), and B and C against Brain 8. Does Brain 9 finish more games and stall less, does a beaten side stop guarding at -1, and does -2 bring back the turn limit?

**Answer:** 10 matchups, 2000 games (per-matchup numbers in tables/outcomes.csv). A's share of games ranged from 41.0% (b-vs-a-7v7) to 45.5% (b-vs-a-5v5). Mirrors ended on the turn limit in 16.0% of games.

**Key table** (v3.17.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a-brain8-mirror-5v5: brain8 v brain8, blitz5, mixed | 200 | 55 | 55 | 33 | 39 | 18 | 6.0% | 36.0% | 13.0% | 45.0% | 36.0% | 18.59 | 65.5% |
| b-brain9-mirror-5v5: brain9 v brain9, blitz5, mixed | 200 | 86 | 87 | 9 | 12 | 6 | 11.0% | 57.0% | 18.5% | 13.5% | 57.0% | 15.63 | 70.5% |
| c-brain9-m2-mirror-5v5: brain9:finished=-2 v brain9:finished=-2, blitz5, mixed | 200 | 86 | 88 | 8 | 12 | 6 | 11.0% | 58.5% | 17.5% | 13.0% | 58.5% | 15.61 | 69.5% |
| b-vs-a-5v5: brain9 v brain8, blitz5, mixed | 200 | 75 | 93 | 13 | 13 | 6 | 6.5% | 61.5% | 16.0% | 16.0% | 61.5% | 13.49 | 91.1% |
| c-vs-a-5v5: brain9:finished=-2 v brain8, blitz5, mixed | 200 | 75 | 93 | 13 | 13 | 6 | 6.5% | 61.5% | 16.0% | 16.0% | 61.5% | 13.49 | 91.1% |
| a-brain8-mirror-7v7: brain8 v brain8, std7, mixed | 200 | 89 | 78 | 16 | 13 | 4 | 6.5% | 63.5% | 13.5% | 16.5% | 63.5% | 16.54 | 39.5% |
| b-brain9-mirror-7v7: brain9 v brain9, std7, mixed | 200 | 92 | 99 | 4 | 3 | 2 | 5.0% | 79.0% | 11.5% | 4.5% | 79.0% | 13.72 | 84.3% |
| c-brain9-m2-mirror-7v7: brain9:finished=-2 v brain9:finished=-2, std7, mixed | 200 | 93 | 100 | 3 | 2 | 2 | 5.0% | 80.0% | 11.5% | 3.5% | 80.0% | 13.71 | 83.9% |
| b-vs-a-7v7: brain9 v brain8, std7, mixed | 200 | 77 | 110 | 5 | 8 | 0 | 7.5% | 70.0% | 16.0% | 6.5% | 70.0% | 14.79 | 63.6% |
| c-vs-a-7v7: brain9:finished=-2 v brain8, std7, mixed | 200 | 77 | 110 | 5 | 8 | 0 | 7.5% | 70.0% | 16.0% | 6.5% | 70.0% | 14.79 | 63.6% |

**Stalls** (`tables/stall.csv`):
- a-brain8-mirror-5v5: first attack on turn 4.1 and last damage on turn 11.8 on average (turn-limit games: 4.6 and 9.9). Turn-limit games end with 31.2 side-turns without an attack or pull on average. 97.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-brain9-mirror-5v5: first attack on turn 2.3 and last damage on turn 14.9 on average (turn-limit games: 2.2 and 19.9). Turn-limit games end with 10.5 side-turns without an attack or pull on average. 51.9% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-brain9-m2-mirror-5v5: first attack on turn 2.3 and last damage on turn 14.9 on average (turn-limit games: 2.2 and 19.7). Turn-limit games end with 10.9 side-turns without an attack or pull on average. 53.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-vs-a-5v5: first attack on turn 1.8 and last damage on turn 11.7 on average (turn-limit games: 1.2 and 13.5). Turn-limit games end with 23.2 side-turns without an attack or pull on average. 87.5% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-vs-a-5v5: first attack on turn 1.8 and last damage on turn 11.7 on average (turn-limit games: 1.2 and 13.5). Turn-limit games end with 23.2 side-turns without an attack or pull on average. 87.5% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- a-brain8-mirror-7v7: first attack on turn 2.3 and last damage on turn 12.6 on average (turn-limit games: 2.4 and 11.0). Turn-limit games end with 48.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-brain9-mirror-7v7: first attack on turn 2.5 and last damage on turn 13.1 on average (turn-limit games: 2.4 and 21.7). Turn-limit games end with 27.1 side-turns without an attack or pull on average. 77.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-brain9-m2-mirror-7v7: first attack on turn 2.5 and last damage on turn 13.2 on average (turn-limit games: 2.6 and 20.9). Turn-limit games end with 28.9 side-turns without an attack or pull on average. 85.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-vs-a-7v7: first attack on turn 2.4 and last damage on turn 13.5 on average (turn-limit games: 2.4 and 15.6). Turn-limit games end with 39.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-vs-a-7v7: first attack on turn 2.4 and last damage on turn 13.7 on average (turn-limit games: 2.4 and 17.6). Turn-limit games end with 35.5 side-turns without an attack or pull on average. 92.3% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** a-brain8-mirror-5v5: a mirror, so the A/B split is a check on noise (-0.4 standard errors from even). b-brain9-mirror-5v5: a mirror, so the A/B split is a check on noise (-0.3 standard errors from even). c-brain9-m2-mirror-5v5: a mirror, so the A/B split is a check on noise (-0.4 standard errors from even). b-vs-a-5v5: within noise (-1.3 standard errors; F23 asks for 2+ at 1,000+ games before ruling). c-vs-a-5v5: within noise (-1.3 standard errors; F23 asks for 2+ at 1,000+ games before ruling). a-brain8-mirror-7v7: a mirror, so the A/B split is a check on noise (+1.0 standard errors from even). b-brain9-mirror-7v7: a mirror, so the A/B split is a check on noise (-0.4 standard errors from even). c-brain9-m2-mirror-7v7: a mirror, so the A/B split is a check on noise (-0.4 standard errors from even). b-vs-a-7v7: a real difference at this sample, -2.5 standard errors from even. c-vs-a-7v7: a real difference at this sample, -2.5 standard errors from even. Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed KLZS-LRJ7-ZF74 (b-vs-a-5v5, game 140) [watch](https://productofdefiance.github.io/Flagfall/pr/60/?watch=KLZS-LRJ7-ZF74&v=v3.17.00&rules=v3.9&format=blitz5&n=brain9&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed S8M3-DT7B-3TQD (a-brain8-mirror-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/60/?watch=S8M3-DT7B-3TQD&v=v3.17.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
