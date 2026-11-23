# release-v3-11-00

**Question:** v3.11.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.7, 1,000 games per format?

**Answer:** 5v5: mirror, 36.7% ended on the turn limit, A/B 503–492; 7v7: mirror, 41.4% ended on the turn limit, A/B 460–522.

**Key table** (v3.11.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 328 | 305 | 175 | 187 | 5 | 3.5% | 43.4% | 16.4% | 36.7% | 43.4% | 16.13 | 4.6% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 273 | 313 | 187 | 209 | 18 | 3.2% | 41.6% | 13.8% | 41.4% | 41.6% | 21.62 | 31.9% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.8 and last damage on turn 10.8 on average (turn-limit games: 2.5 and 10.5). Turn-limit games end with 29.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.4 and last damage on turn 12.1 on average (turn-limit games: 2.4 and 12.1). Turn-limit games end with 46.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.3 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-2.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed DPYQ-9YDW-NGPU (5v5, game 420) [watch](https://productofdefiance.github.io/Flagfall/?watch=DPYQ-9YDW-NGPU&v=v3.11.00&rules=v3.7&format=blitz5&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed K979-Q4YY-GYNX (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/?watch=K979-Q4YY-GYNX&v=v3.11.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
