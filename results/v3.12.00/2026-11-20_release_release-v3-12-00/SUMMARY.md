# release-v3-12-00

**Question:** v3.12.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.8, 1,000 games per format?

**Answer:** 5v5: mirror, 63.0% ended on the turn limit, A/B 453–481; 7v7: mirror, 43.9% ended on the turn limit, A/B 491–499.

**Key table** (v3.12.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 179 | 191 | 274 | 290 | 66 | 5.1% | 21.7% | 10.2% | 63.0% | 21.7% | 20.64 | 59.5% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 289 | 272 | 202 | 227 | 10 | 4.2% | 40.0% | 11.9% | 43.9% | 40.1% | 22.2 | 31.6% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.5 and last damage on turn 12.0 on average (turn-limit games: 4.7 and 11.2). Turn-limit games end with 28.3 side-turns without an attack or pull on average. 99.5% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.5 and last damage on turn 12.2 on average (turn-limit games: 2.5 and 12.3). Turn-limit games end with 46.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.3 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed E7UX-TXKP-3H3G (7v7, game 261) [watch](https://productofdefiance.github.io/Flagfall/?watch=E7UX-TXKP-3H3G&v=v3.12.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed 4CYX-N38D-5MBA (7v7, game 100) [watch](https://productofdefiance.github.io/Flagfall/?watch=4CYX-N38D-5MBA&v=v3.12.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
