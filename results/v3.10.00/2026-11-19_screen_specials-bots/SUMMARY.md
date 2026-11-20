# specials-bots

**Question:** Bot minimum: does Brain 5 use all six specials on v3.7 (each fired 50+ times, 60%+ of warm-ups fired next turn, no refused action, every game finished), 400 games per format?

**Answer:** balanced-5v5: mirror, 22.0% ended on the turn limit, A/B 205–193; balanced-7v7: mirror, 44.8% ended on the turn limit, A/B 205–191; light-7v7: mirror, 47.5% ended on the turn limit, A/B 207–188.

**Key table** (v3.10.00, 1200 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| balanced-5v5: brain5 v brain5, blitz5, mixed | 400 | 161 | 151 | 44 | 42 | 2 | 4.3% | 54.5% | 19.3% | 22.0% | 54.5% | 13.75 | 1.0% |
| balanced-7v7: brain5 v brain5, std7, mixed | 400 | 101 | 120 | 104 | 71 | 4 | 4.0% | 38.5% | 12.8% | 44.8% | 38.5% | 22.52 | 27.6% |
| light-7v7: brain5 v brain5, std7, light | 400 | 109 | 101 | 98 | 87 | 5 | 17.0% | 25.8% | 9.8% | 47.5% | 25.8% | 21.32 | 43.8% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- balanced-5v5: first attack on turn 2.4 and last damage on turn 10.4 on average (turn-limit games: 2.6 and 9.8). Turn-limit games end with 31.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- balanced-7v7: first attack on turn 2.4 and last damage on turn 12.2 on average (turn-limit games: 2.4 and 11.9). Turn-limit games end with 46.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- light-7v7: first attack on turn 2.2 and last damage on turn 9.5 on average (turn-limit games: 2.2 and 10.2). Turn-limit games end with 50.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** balanced-5v5: a mirror, so the A/B split is a check on noise (+0.6 standard errors from even). balanced-7v7: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). light-7v7: a mirror, so the A/B split is a check on noise (+1.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed D8CG-ZU6P-EWRN (light-7v7, game 152) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=D8CG-ZU6P-EWRN&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=light&mixs=light&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed 3BCU-UWLV-N7UM (balanced-7v7, game 60) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=3BCU-UWLV-N7UM&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
