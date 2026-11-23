# release-v3-16-00

**Question:** v3.16.00's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 42.5% ended on the turn limit, A/B 509–439; 7v7: mirror, 11.6% ended on the turn limit, A/B 502–481.

**Key table** (v3.16.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 303 | 272 | 206 | 167 | 52 | 4.7% | 43.0% | 9.8% | 42.5% | 43.0% | 18.31 | 58.4% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 451 | 433 | 51 | 48 | 17 | 3.9% | 67.9% | 16.6% | 11.6% | 67.9% | 15.56 | 46.0% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.5 and last damage on turn 11.9 on average (turn-limit games: 5.1 and 10.0). Turn-limit games end with 30.7 side-turns without an attack or pull on average. 98.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.2 and last damage on turn 12.9 on average (turn-limit games: 2.4 and 11.8). Turn-limit games end with 46.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+2.2 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed BHJ7-AAL3-2NFC (7v7, game 570) [watch](https://productofdefiance.github.io/Flagfall/?watch=BHJ7-AAL3-2NFC&v=v3.16.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed Q7C7-YTZG-QVGD (7v7, game 100) [watch](https://productofdefiance.github.io/Flagfall/?watch=Q7C7-YTZG-QVGD&v=v3.16.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
