# release-v3-15-00

**Question:** v3.15.00's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 42.4% ended on the turn limit, A/B 459–468; 7v7: mirror, 12.4% ended on the turn limit, A/B 496–491.

**Key table** (v3.16.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 280 | 296 | 179 | 172 | 73 | 6.6% | 42.6% | 8.4% | 42.4% | 42.6% | 18.27 | 54.7% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 429 | 447 | 67 | 44 | 13 | 4.2% | 65.2% | 18.2% | 12.4% | 65.2% | 15.86 | 47.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.4 and last damage on turn 11.8 on average (turn-limit games: 5.1 and 9.8). Turn-limit games end with 31.3 side-turns without an attack or pull on average. 97.9% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.2 and last damage on turn 13.0 on average (turn-limit games: 2.3 and 12.0). Turn-limit games end with 46.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.3 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.2 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed 7Y6K-3NDJ-L6TZ (7v7, game 233) [watch](https://productofdefiance.github.io/Flagfall/?watch=7Y6K-3NDJ-L6TZ&v=v3.15.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed PDQK-L8YH-5U32 (7v7, game 40) [watch](https://productofdefiance.github.io/Flagfall/?watch=PDQK-L8YH-5U32&v=v3.15.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
