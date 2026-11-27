# command-v310-screen

**Question:** On v3.10 (Arrow Storm 1.5 times), does equal first-turn Command put the first mover inside 45-55% of decisive games, and does 5v5 at Command 8 fix the 41.9% (F028-2)? Brain 8 against itself, balanced, same seeds per format. Sim-only Command changes: a screen, not a ruling (F23).

**Answer:** 7v7-c10-f6: mirror, 14.5% ended on the turn limit, A/B 98–98; 7v7-c10-f10: mirror, 14.5% ended on the turn limit, A/B 97–99; 5v5-c10-f6: mirror, 23.5% ended on the turn limit, A/B 104–93; 5v5-c10-f10: mirror, 23.5% ended on the turn limit, A/B 104–93; 5v5-c8-f5: mirror, 39.0% ended on the turn limit, A/B 91–91; 5v5-c8-f8: mirror, 39.0% ended on the turn limit, A/B 91–91.

**Key table** (v3.19.00, 1200 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7v7-c10-f6: brain8 v brain8, std7, mixed | 200 | 88 | 83 | 10 | 15 | 4 | 6.5% | 62.0% | 17.0% | 14.5% | 62.0% | 16.54 | 47.9% |
| 7v7-c10-f10: brain8 v brain8, std7, mixed | 200 | 81 | 90 | 16 | 9 | 4 | 2.5% | 65.0% | 18.0% | 14.5% | 65.0% | 16.18 | 67.3% |
| 5v5-c10-f6: brain8 v brain8, blitz5, mixed | 200 | 77 | 76 | 27 | 17 | 3 | 8.0% | 58.0% | 10.5% | 23.5% | 58.0% | 14.36 | 33.3% |
| 5v5-c10-f10: brain8 v brain8, blitz5, mixed | 200 | 77 | 76 | 27 | 17 | 3 | 8.0% | 58.0% | 10.5% | 23.5% | 58.0% | 14.36 | 33.3% |
| 5v5-c8-f5: brain8 v brain8, blitz5, mixed | 200 | 65 | 57 | 26 | 34 | 18 | 4.0% | 41.0% | 16.0% | 39.0% | 41.0% | 17.09 | 57.4% |
| 5v5-c8-f8: brain8 v brain8, blitz5, mixed | 200 | 65 | 57 | 26 | 34 | 18 | 4.0% | 41.0% | 16.0% | 39.0% | 41.0% | 17.09 | 57.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 7v7-c10-f6: first attack on turn 2.1 and last damage on turn 13.1 on average (turn-limit games: 2.2 and 11.6). Turn-limit games end with 47.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7-c10-f10: first attack on turn 2.1 and last damage on turn 12.9 on average (turn-limit games: 2.0 and 12.1). Turn-limit games end with 46.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c10-f6: first attack on turn 1.3 and last damage on turn 10.2 on average (turn-limit games: 1.3 and 7.4). Turn-limit games end with 35.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c10-f10: first attack on turn 1.3 and last damage on turn 10.2 on average (turn-limit games: 1.3 and 7.4). Turn-limit games end with 35.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-f5: first attack on turn 1.9 and last damage on turn 10.2 on average (turn-limit games: 1.6 and 7.4). Turn-limit games end with 35.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 5v5-c8-f8: first attack on turn 1.9 and last damage on turn 10.2 on average (turn-limit games: 1.6 and 7.4). Turn-limit games end with 35.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 7v7-c10-f6: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). 7v7-c10-f10: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). 5v5-c10-f6: a mirror, so the A/B split is a check on noise (+0.8 standard errors from even). 5v5-c10-f10: a mirror, so the A/B split is a check on noise (+0.8 standard errors from even). 5v5-c8-f5: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). 5v5-c8-f8: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** F028-2, F12

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed 5XKU-Q2WL-AZE2 (5v5-c10-f6, game 83) [watch](https://productofdefiance.github.io/Flagfall/pr/65/?watch=5XKU-Q2WL-AZE2&v=v3.19.00&rules=v3.10&format=blitz5&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed ECY5-QV3P-VQR3 (7v7-c10-f6, game 140) [watch](https://productofdefiance.github.io/Flagfall/pr/65/?watch=ECY5-QV3P-VQR3&v=v3.19.00&rules=v3.10&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
