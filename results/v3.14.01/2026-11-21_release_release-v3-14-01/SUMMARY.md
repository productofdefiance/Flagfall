# release-v3-14-01

**Question:** v3.14.01's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 59.0% ended on the turn limit, A/B 465–446; 7v7: mirror, 44.9% ended on the turn limit, A/B 464–520.

**Key table** (v3.14.01, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 214 | 196 | 251 | 250 | 89 | 5.3% | 26.5% | 9.2% | 59.0% | 26.5% | 20.12 | 65.4% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 263 | 288 | 201 | 232 | 16 | 3.3% | 38.7% | 13.1% | 44.9% | 38.7% | 22.36 | 29.4% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.4 and last damage on turn 11.4 on average (turn-limit games: 4.7 and 10.3). Turn-limit games end with 30.3 side-turns without an attack or pull on average. 99.3% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.4 and last damage on turn 12.0 on average (turn-limit games: 2.4 and 12.0). Turn-limit games end with 46.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.6 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.8 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed YAGU-N42L-AMUT (5v5, game 640) [watch](https://productofdefiance.github.io/Flagfall/?watch=YAGU-N42L-AMUT&v=v3.14.01&rules=v3.9&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed GWFA-3WMD-P48Q (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/?watch=GWFA-3WMD-P48Q&v=v3.14.01&rules=v3.9&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
