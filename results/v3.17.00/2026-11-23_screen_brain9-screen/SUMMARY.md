# brain9-screen

**Question:** Brief 020 screen (200 games each, v3.9, balanced, same deals): Brain 8 mirror (A), Brain 9 mirror with finished -1 (B) and -2 (C), and B and C against Brain 8. Does Brain 9 finish more games and stall less, does a beaten side stop guarding at -1, and does -2 bring back the turn limit?

**Answer:** Failed: some machines failed while playing (play: cancelled/cancelled); the totals cover only the parts that finished.

**Key table** (v3.17.00, 600 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a-brain8-mirror-5v5: brain8 v brain8, blitz5, mixed | 60 | 22 | 16 | 5 | 14 | 3 | 10.0% | 40.0% | 13.3% | 36.7% | 40.0% | 17.65 | 68.4% |
| b-brain9-mirror-5v5: brain9 v brain9, blitz5, mixed | 60 | 29 | 23 | 6 | 1 | 1 | 10.0% | 56.7% | 20.0% | 13.3% | 56.7% | 15.92 | 75.0% |
| c-brain9-m2-mirror-5v5: brain9:finished=-2 v brain9:finished=-2, blitz5, mixed | 60 | 29 | 23 | 6 | 1 | 1 | 10.0% | 56.7% | 20.0% | 13.3% | 56.7% | 15.92 | 75.0% |
| b-vs-a-5v5: brain9 v brain8, blitz5, mixed | 60 | 26 | 23 | 6 | 3 | 2 | 6.7% | 61.7% | 13.3% | 18.3% | 61.7% | 14.05 | 87.8% |
| c-vs-a-5v5: brain9:finished=-2 v brain8, blitz5, mixed | 60 | 26 | 23 | 6 | 3 | 2 | 6.7% | 61.7% | 13.3% | 18.3% | 61.7% | 14.05 | 87.8% |
| a-brain8-mirror-7v7: brain8 v brain8, std7, mixed | 60 | 24 | 24 | 3 | 8 | 1 | 8.3% | 63.3% | 8.3% | 20.0% | 63.3% | 17.35 | 39.6% |
| b-brain9-mirror-7v7: brain9 v brain9, std7, mixed | 60 | 36 | 21 | 1 | 2 | 0 | 5.0% | 80.0% | 10.0% | 5.0% | 80.0% | 14.75 | 79.0% |
| c-brain9-m2-mirror-7v7: brain9:finished=-2 v brain9:finished=-2, std7, mixed | 60 | 36 | 22 | 1 | 1 | 0 | 5.0% | 81.7% | 10.0% | 3.3% | 81.7% | 14.73 | 79.3% |
| b-vs-a-7v7: brain9 v brain8, std7, mixed | 60 | 24 | 30 | 3 | 3 | 0 | 10.0% | 63.3% | 16.7% | 10.0% | 63.3% | 15.77 | 57.4% |
| c-vs-a-7v7: brain9:finished=-2 v brain8, std7, mixed | 60 | 24 | 30 | 3 | 3 | 0 | 10.0% | 63.3% | 16.7% | 10.0% | 63.3% | 15.77 | 57.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- a-brain8-mirror-5v5: first attack on turn 4.1 and last damage on turn 12.4 on average (turn-limit games: 5.0 and 10.6). Turn-limit games end with 29.7 side-turns without an attack or pull on average. 95.5% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-brain9-mirror-5v5: first attack on turn 2.4 and last damage on turn 15.5 on average (turn-limit games: 2.3 and 21.6). Turn-limit games end with 7.1 side-turns without an attack or pull on average. 50.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-brain9-m2-mirror-5v5: first attack on turn 2.4 and last damage on turn 15.5 on average (turn-limit games: 2.3 and 21.6). Turn-limit games end with 7.1 side-turns without an attack or pull on average. 50.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-vs-a-5v5: first attack on turn 1.9 and last damage on turn 12.3 on average (turn-limit games: 1.0 and 15.2). Turn-limit games end with 19.9 side-turns without an attack or pull on average. 81.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-vs-a-5v5: first attack on turn 1.9 and last damage on turn 12.3 on average (turn-limit games: 1.0 and 15.2). Turn-limit games end with 19.9 side-turns without an attack or pull on average. 81.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- a-brain8-mirror-7v7: first attack on turn 2.3 and last damage on turn 12.6 on average (turn-limit games: 2.3 and 11.0). Turn-limit games end with 48.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-brain9-mirror-7v7: first attack on turn 2.5 and last damage on turn 14.1 on average (turn-limit games: 2.3 and 21.7). Turn-limit games end with 27.0 side-turns without an attack or pull on average. 66.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-brain9-m2-mirror-7v7: first attack on turn 2.5 and last damage on turn 14.1 on average (turn-limit games: 2.5 and 15.0). Turn-limit games end with 40.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b-vs-a-7v7: first attack on turn 2.5 and last damage on turn 14.0 on average (turn-limit games: 2.3 and 17.7). Turn-limit games end with 35.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- c-vs-a-7v7: first attack on turn 2.5 and last damage on turn 14.0 on average (turn-limit games: 2.3 and 17.7). Turn-limit games end with 35.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** a-brain8-mirror-5v5: a mirror, so the A/B split is a check on noise (-0.4 standard errors from even). b-brain9-mirror-5v5: a mirror, so the A/B split is a check on noise (+1.4 standard errors from even). c-brain9-m2-mirror-5v5: a mirror, so the A/B split is a check on noise (+1.4 standard errors from even). b-vs-a-5v5: within noise (0.8 standard errors; F23 asks for 2+ at 1,000+ games before ruling). c-vs-a-5v5: within noise (0.8 standard errors; F23 asks for 2+ at 1,000+ games before ruling). a-brain8-mirror-7v7: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). b-brain9-mirror-7v7: a mirror, so the A/B split is a check on noise (+1.8 standard errors from even). c-brain9-m2-mirror-7v7: a mirror, so the A/B split is a check on noise (+1.8 standard errors from even). b-vs-a-7v7: within noise (-0.8 standard errors; F23 asks for 2+ at 1,000+ games before ruling). c-vs-a-7v7: within noise (-0.8 standard errors; F23 asks for 2+ at 1,000+ games before ruling). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed KLZS-LRJ7-ZF74 (b-vs-a-5v5, game 140) [watch](https://productofdefiance.github.io/Flagfall/pr/60/?watch=KLZS-LRJ7-ZF74&v=v3.17.00&rules=v3.9&format=blitz5&n=brain9&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed S8M3-DT7B-3TQD (a-brain8-mirror-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/60/?watch=S8M3-DT7B-3TQD&v=v3.17.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
