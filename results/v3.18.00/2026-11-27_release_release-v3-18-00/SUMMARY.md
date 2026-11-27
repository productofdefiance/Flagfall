# release-v3-18-00

**Question:** v3.18.00's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.9, 1,000 games per format?

**Answer:** 5v5: mirror, 43.6% ended on the turn limit, A/B 471–455; 7v7: mirror, 14.3% ended on the turn limit, A/B 491–494.

**Key table** (v3.18.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 281 | 283 | 190 | 172 | 74 | 4.8% | 43.7% | 7.9% | 43.6% | 43.7% | 18.36 | 55.1% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 431 | 426 | 60 | 68 | 15 | 5.4% | 64.2% | 16.1% | 14.3% | 64.3% | 16.18 | 46.6% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 4.3 and last damage on turn 11.8 on average (turn-limit games: 4.9 and 9.9). Turn-limit games end with 31.1 side-turns without an attack or pull on average. 97.9% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.3 and last damage on turn 12.9 on average (turn-limit games: 2.4 and 11.8). Turn-limit games end with 47.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.5 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed YNA5-AP7U-AF64 (7v7, game 204) [watch](https://productofdefiance.github.io/Flagfall/?watch=YNA5-AP7U-AF64&v=v3.18.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed L4E9-VHNV-9CYD (7v7, game 40) [watch](https://productofdefiance.github.io/Flagfall/?watch=L4E9-VHNV-9CYD&v=v3.18.00&rules=v3.9&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
