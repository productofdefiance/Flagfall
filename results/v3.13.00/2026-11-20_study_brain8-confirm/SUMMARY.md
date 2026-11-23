# brain8-confirm

**Question:** Brain 8 as shipped (B4 on, A1 and A2 off, tempo 0 and 0) at 1,000 games per matchup, v3.8: Brain 5 mirror baseline, Brain 8 against Brain 5 (balanced and all-Light) and Brain 8 mirrors, 5v5 and 7v7. Sides and move order swapped evenly; same deals across the balanced matchups of a format.

**Answer:** 8 matchups, 8000 games (per-matchup numbers in tables/outcomes.csv). A's share of games ranged from 48.2% (b8-v-b5-7v7) to 50.3% (b8-v-b5-5v5). Mirrors ended on the turn limit in 40.9% of games.

**Key table** (v3.13.00, 8000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| b5-mirror-5v5: brain5 v brain5, blitz5, mixed | 1000 | 176 | 182 | 297 | 276 | 69 | 4.9% | 22.7% | 8.2% | 64.2% | 22.7% | 20.77 | 61.2% |
| b8-v-b5-5v5: brain8 v brain5, blitz5, mixed | 1000 | 256 | 195 | 213 | 267 | 69 | 5.3% | 29.8% | 10.0% | 54.9% | 29.8% | 19.88 | 59.9% |
| b8-mirror-5v5: brain8 v brain8, blitz5, mixed | 1000 | 261 | 274 | 205 | 191 | 69 | 5.9% | 36.8% | 10.8% | 46.5% | 36.8% | 19.02 | 57.9% |
| b8-v-b5-light-5v5: brain8 v brain5, blitz5, light | 1000 | 416 | 194 | 63 | 315 | 12 | 12.8% | 30.6% | 17.6% | 39.0% | 31.0% | 14.61 | 42.8% |
| b5-mirror-7v7: brain5 v brain5, std7, mixed | 1000 | 291 | 306 | 187 | 202 | 14 | 3.2% | 41.6% | 14.9% | 40.3% | 41.9% | 21.41 | 28.5% |
| b8-v-b5-7v7: brain8 v brain5, std7, mixed | 1000 | 417 | 315 | 58 | 196 | 14 | 3.6% | 54.4% | 15.2% | 26.8% | 54.5% | 18.63 | 32.1% |
| b8-mirror-7v7: brain8 v brain8, std7, mixed | 1000 | 422 | 453 | 54 | 57 | 14 | 4.8% | 66.9% | 15.8% | 12.5% | 67.0% | 15.73 | 34.7% |
| b8-v-b5-light-7v7: brain8 v brain5, std7, light | 1000 | 442 | 331 | 41 | 172 | 14 | 20.0% | 41.4% | 15.9% | 22.7% | 41.5% | 15.21 | 38.4% |

**Stalls** (`tables/stall.csv`):
- b5-mirror-5v5: first attack on turn 4.5 and last damage on turn 12.0 on average (turn-limit games: 4.7 and 11.4). Turn-limit games end with 28.1 side-turns without an attack or pull on average. 99.2% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-5v5: first attack on turn 4.5 and last damage on turn 12.1 on average (turn-limit games: 4.9 and 10.8). Turn-limit games end with 29.1 side-turns without an attack or pull on average. 98.9% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-mirror-5v5: first attack on turn 4.5 and last damage on turn 12.1 on average (turn-limit games: 5.0 and 10.1). Turn-limit games end with 30.7 side-turns without an attack or pull on average. 99.1% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-light-5v5: first attack on turn 2.4 and last damage on turn 7.8 on average (turn-limit games: 2.4 and 7.7). Turn-limit games end with 35.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b5-mirror-7v7: first attack on turn 2.5 and last damage on turn 12.2 on average (turn-limit games: 2.4 and 12.2). Turn-limit games end with 46.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-7v7: first attack on turn 2.5 and last damage on turn 12.5 on average (turn-limit games: 2.5 and 12.2). Turn-limit games end with 46.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-mirror-7v7: first attack on turn 2.5 and last damage on turn 12.9 on average (turn-limit games: 2.5 and 12.1). Turn-limit games end with 46.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-light-7v7: first attack on turn 2.4 and last damage on turn 9.6 on average (turn-limit games: 2.3 and 10.1). Turn-limit games end with 50.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** b5-mirror-5v5: a mirror, so the A/B split is a check on noise (+0.5 standard errors from even). b8-v-b5-5v5: within noise (0.2 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b8-mirror-5v5: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). b8-v-b5-light-5v5: within noise (-0.9 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b5-mirror-7v7: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). b8-v-b5-7v7: within noise (-1.1 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b8-mirror-7v7: a mirror, so the A/B split is a check on noise (-1.1 standard errors from even). b8-v-b5-light-7v7: within noise (-0.6 standard errors; F23 asks for 2+ at 1,000+ games before ruling). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (4 turns, KO): seed R4BL-F4CS-DU7J (b8-v-b5-light-5v5, game 551) [watch](https://productofdefiance.github.io/Flagfall/pr/41/?watch=R4BL-F4CS-DU7J&v=v3.13.00&rules=v3.8&format=blitz5&n=brain5&s=brain8&mixn=light&mixs=light&first=S)
- longest game (35 turns, turn limit, more pull damage): seed ZFSC-4DKL-A8AW (b5-mirror-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/41/?watch=ZFSC-4DKL-A8AW&v=v3.13.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
