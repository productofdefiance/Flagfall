# release-v3-14-00

**Question:** v3.14.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 65.3% ended on the turn limit, A/B 466–451; 7v7: mirror, 43.3% ended on the turn limit, A/B 493–486.

**Key table** (v3.14.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 181 | 166 | 285 | 285 | 83 | 3.9% | 23.7% | 7.1% | 65.3% | 23.8% | 20.85 | 66.9% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 290 | 277 | 203 | 209 | 21 | 2.7% | 40.6% | 13.4% | 43.3% | 40.7% | 22 | 31.2% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.4 and last damage on turn 11.5 on average (turn-limit games: 4.6 and 10.7). Turn-limit games end with 29.3 side-turns without an attack or pull on average. 99.2% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.4 and last damage on turn 12.1 on average (turn-limit games: 2.5 and 12.0). Turn-limit games end with 46.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.5 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.2 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed 5XX7-EYBB-7S9R (7v7, game 741) [watch](https://productofdefiance.github.io/Flagfall/?watch=5XX7-EYBB-7S9R&v=v3.14.00&rules=v3.9&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed SZPU-S485-B8SN (7v7, game 80) [watch](https://productofdefiance.github.io/Flagfall/?watch=SZPU-S485-B8SN&v=v3.14.00&rules=v3.9&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
