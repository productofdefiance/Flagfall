# release-v3-20-01

**Question:** v3.20.01's final exam: how do games end with the default brain (Brain 8 (safe approach)) against itself, newest rule set v3.10, 1,000 games per format?

**Answer:** 5v5: mirror, 26.5% ended on the turn limit, A/B 474–502; 7v7: mirror, 13.2% ended on the turn limit, A/B 470–518.

**Key table** (v3.20.01, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain8 v brain8, blitz5, mixed | 1000 | 361 | 374 | 113 | 128 | 24 | 4.6% | 55.9% | 13.0% | 26.5% | 55.9% | 14.91 | 37.3% |
| 7v7: brain8 v brain8, std7, mixed | 1000 | 405 | 463 | 65 | 55 | 12 | 3.3% | 68.1% | 15.4% | 13.2% | 68.1% | 16.13 | 48.4% |

**Checks:** all 44 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 1.3 and last damage on turn 10.3 on average (turn-limit games: 1.2 and 7.8). Turn-limit games end with 34.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.2 and last damage on turn 13.1 on average (turn-limit games: 2.2 and 12.3). Turn-limit games end with 45.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (-1.5 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed 49FG-UWZB-AFPF (5v5, game 261) [watch](https://productofdefiance.github.io/Flagfall/?watch=49FG-UWZB-AFPF&v=v3.20.01&rules=v3.10&format=blitz5&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 2DWP-E3YS-754E (7v7, game 80) [watch](https://productofdefiance.github.io/Flagfall/?watch=2DWP-E3YS-754E&v=v3.20.01&rules=v3.10&format=std7&n=brain8&s=brain8&mixn=mixed&mixs=mixed&first=N)
