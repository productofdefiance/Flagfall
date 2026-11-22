# release-v3-13-00

**Question:** v3.13.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 63.2% ended on the turn limit, A/B 470–451; 7v7: mirror, 44.4% ended on the turn limit, A/B 503–471.

**Key table** (v3.13.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 173 | 195 | 297 | 256 | 79 | 4.9% | 21.7% | 10.2% | 63.2% | 21.7% | 20.67 | 63.9% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 283 | 273 | 220 | 198 | 26 | 3.9% | 39.4% | 12.3% | 44.4% | 39.4% | 22.47 | 30.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.4 and last damage on turn 11.8 on average (turn-limit games: 4.6 and 10.9). Turn-limit games end with 28.9 side-turns without an attack or pull on average. 97.9% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.4 and last damage on turn 12.2 on average (turn-limit games: 2.4 and 11.9). Turn-limit games end with 46.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.6 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+1.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed GRLA-ARFK-JLUE (7v7, game 553) [watch](https://productofdefiance.github.io/Flagfall/?watch=GRLA-ARFK-JLUE&v=v3.13.00&rules=v3.9&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed ZFL8-YYTK-NPPJ (7v7, game 60) [watch](https://productofdefiance.github.io/Flagfall/?watch=ZFL8-YYTK-NPPJ&v=v3.13.00&rules=v3.9&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
