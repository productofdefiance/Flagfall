# release-v3-09-01

**Question:** v3.09.01's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.6, 1,000 games per format?

**Answer:** 5v5: mirror, 57.0% ended on the turn limit, A/B 479–501; 7v7: mirror, 43.7% ended on the turn limit, A/B 491–481.

**Key table** (v3.09.01, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 202 | 228 | 277 | 273 | 20 | 4.3% | 25.5% | 13.2% | 57.0% | 25.5% | 19.33 | 41.4% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 272 | 291 | 219 | 190 | 28 | 3.4% | 41.8% | 11.1% | 43.7% | 41.9% | 22.56 | 50.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.0 and last damage on turn 11.3 on average (turn-limit games: 2.0 and 11.0). Turn-limit games end with 28.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 3.1 and last damage on turn 12.7 on average (turn-limit games: 3.0 and 12.5). Turn-limit games end with 46.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.7 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.3 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed 2EZR-NFFV-G5E8 (5v5, game 541) [watch](https://productofdefiance.github.io/Flagfall/?watch=2EZR-NFFV-G5E8&v=v3.09.01&rules=v3.6&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 8QHA-SC8R-XNJU (7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/?watch=8QHA-SC8R-XNJU&v=v3.09.01&rules=v3.6&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
