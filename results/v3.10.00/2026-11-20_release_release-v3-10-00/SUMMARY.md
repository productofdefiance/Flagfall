# release-v3-10-00

**Question:** v3.10.00's final exam: how do games end with the default brain (Brain 5 (plans its turn)) against itself, newest rule set v3.7, 1,000 games per format?

**Answer:** 5v5: mirror, 37.0% ended on the turn limit, A/B 478–512; 7v7: mirror, 45.1% ended on the turn limit, A/B 497–483.

**Key table** (v3.10.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 290 | 340 | 188 | 172 | 10 | 3.1% | 40.1% | 19.8% | 37.0% | 40.1% | 16.25 | 4.1% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 266 | 283 | 231 | 200 | 20 | 3.7% | 37.4% | 13.8% | 45.1% | 37.5% | 22.56 | 31.9% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.8 and last damage on turn 11.0 on average (turn-limit games: 2.5 and 10.7). Turn-limit games end with 29.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.4 and last damage on turn 12.1 on average (turn-limit games: 2.4 and 11.8). Turn-limit games end with 46.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-1.1 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.4 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed WCZ9-HL3U-53KT (7v7, game 560) [watch](https://productofdefiance.github.io/Flagfall/?watch=WCZ9-HL3U-53KT&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed R28X-AJDH-DUP5 (7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/?watch=R28X-AJDH-DUP5&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
