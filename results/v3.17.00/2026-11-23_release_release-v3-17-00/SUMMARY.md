# release-v3-17-00

**Question:** v3.17.00's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 42.2% ended on the turn limit, A/B 493–439; 7v7: mirror, 13.5% ended on the turn limit, A/B 490–498.

**Key table** (v3.17.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 296 | 282 | 197 | 157 | 68 | 5.2% | 43.2% | 9.4% | 42.2% | 43.2% | 18.27 | 57.1% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 424 | 441 | 66 | 57 | 12 | 5.5% | 62.3% | 18.7% | 13.5% | 62.4% | 16.25 | 42.9% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.4 and last damage on turn 11.9 on average (turn-limit games: 5.0 and 9.8). Turn-limit games end with 31.2 side-turns without an attack or pull on average. 97.6% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.3 and last damage on turn 13.2 on average (turn-limit games: 2.3 and 12.1). Turn-limit games end with 46.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+1.7 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.3 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed 7VLG-FV2G-PAL3 (7v7, game 175) [watch](https://productofdefiance.github.io/Flagfall/?watch=7VLG-FV2G-PAL3&v=v3.17.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed EVKZ-Y56H-MWN7 (7v7, game 80) [watch](https://productofdefiance.github.io/Flagfall/?watch=EVKZ-Y56H-MWN7&v=v3.17.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
