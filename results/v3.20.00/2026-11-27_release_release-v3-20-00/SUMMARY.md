# release-v3-20-00

**Question:** v3.20.00's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.10, 1,000 games per format?

**Answer:** 5v5: mirror, 21.6% ended on the turn limit, A/B 501–484; 7v7: mirror, 14.1% ended on the turn limit, A/B 484–502.

**Key table** (v3.20.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 401 | 383 | 100 | 101 | 15 | 5.9% | 58.4% | 14.1% | 21.6% | 58.4% | 14.09 | 41.7% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 419 | 440 | 65 | 62 | 14 | 3.7% | 64.2% | 18.0% | 14.1% | 64.3% | 16.41 | 48.2% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 1.4 and last damage on turn 10.4 on average (turn-limit games: 1.3 and 8.0). Turn-limit games end with 34.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.2 and last damage on turn 13.2 on average (turn-limit games: 2.2 and 11.9). Turn-limit games end with 46.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.5 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed WTRX-C84Z-NLDV (5v5, game 120) [watch](https://productofdefiance.github.io/Flagfall/?watch=WTRX-C84Z-NLDV&v=v3.20.00&rules=v3.10&format=blitz5&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed W7LH-MNMU-MW4U (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/?watch=W7LH-MNMU-MW4U&v=v3.20.00&rules=v3.10&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
