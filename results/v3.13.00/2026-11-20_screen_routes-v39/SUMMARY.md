# routes-v39

**Question:** Do routes (v3.9, Game Laws 2.11) change how balanced games end, against v3.8 on the same seeds, Brain 5 against itself? And how often do the bots' moves stop short or take set spear?

**Answer:** v38-5v5: mirror, 65.0% ended on the turn limit, A/B 90–93; v39-5v5: mirror, 66.0% ended on the turn limit, A/B 87–96; v38-7v7: mirror, 45.5% ended on the turn limit, A/B 92–106; v39-7v7: mirror, 47.5% ended on the turn limit, A/B 94–102.

**Key table** (v3.13.00, 800 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v38-5v5: brain5 v brain5, blitz5, mixed | 200 | 34 | 36 | 56 | 57 | 17 | 7.5% | 21.0% | 6.5% | 65.0% | 21.5% | 20.77 | 48.6% |
| v39-5v5: brain5 v brain5, blitz5, mixed | 200 | 33 | 35 | 54 | 61 | 17 | 7.5% | 20.0% | 6.5% | 66.0% | 20.5% | 20.89 | 54.4% |
| v38-7v7: brain5 v brain5, std7, mixed | 200 | 50 | 59 | 42 | 47 | 2 | 3.5% | 40.0% | 11.0% | 45.5% | 40.0% | 22.61 | 31.2% |
| v39-7v7: brain5 v brain5, std7, mixed | 200 | 51 | 54 | 43 | 48 | 4 | 2.5% | 40.0% | 10.0% | 47.5% | 40.0% | 22.91 | 30.5% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- v38-5v5: first attack on turn 4.6 and last damage on turn 11.5 on average (turn-limit games: 4.8 and 10.7). Turn-limit games end with 29.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- v39-5v5: first attack on turn 4.6 and last damage on turn 11.3 on average (turn-limit games: 4.8 and 10.4). Turn-limit games end with 30.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- v38-7v7: first attack on turn 2.4 and last damage on turn 12.4 on average (turn-limit games: 2.3 and 12.5). Turn-limit games end with 45.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- v39-7v7: first attack on turn 2.4 and last damage on turn 12.0 on average (turn-limit games: 2.3 and 12.0). Turn-limit games end with 46.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** v38-5v5: a mirror, so the A/B split is a check on noise (-0.2 standard errors from even). v39-5v5: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). v38-7v7: a mirror, so the A/B split is a check on noise (-1.0 standard errors from even). v39-7v7: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed A2PW-XZ22-8B3W (v39-7v7, game 1) [watch](https://productofdefiance.github.io/Flagfall/pr/44/?watch=A2PW-XZ22-8B3W&v=v3.13.00&rules=v3.9&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 3SNF-9DYC-KC8Q (v38-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/44/?watch=3SNF-9DYC-KC8Q&v=v3.13.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
