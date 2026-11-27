# release-v3-19-00

**Question:** v3.19.00's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.10, 1,000 games per format?

**Answer:** 5v5: mirror, 25.9% ended on the turn limit, A/B 497–481; 7v7: mirror, 15.4% ended on the turn limit, A/B 504–482.

**Key table** (v3.20.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 378 | 363 | 119 | 118 | 22 | 4.8% | 57.0% | 12.3% | 25.9% | 57.1% | 14.75 | 37.8% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 437 | 409 | 67 | 73 | 14 | 5.0% | 63.8% | 15.8% | 15.4% | 63.8% | 16.61 | 47.6% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 1.3 and last damage on turn 10.3 on average (turn-limit games: 1.3 and 7.8). Turn-limit games end with 34.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.2 and last damage on turn 13.0 on average (turn-limit games: 2.2 and 11.6). Turn-limit games end with 47.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.5 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed FJ5Z-YMUY-ZK5Y (5v5, game 500) [watch](https://productofdefiance.github.io/Flagfall/?watch=FJ5Z-YMUY-ZK5Y&v=v3.19.00&rules=v3.10&format=blitz5&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, draw): seed JL9T-67H8-2V2E (7v7, game 60) [watch](https://productofdefiance.github.io/Flagfall/?watch=JL9T-67H8-2V2E&v=v3.19.00&rules=v3.10&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
