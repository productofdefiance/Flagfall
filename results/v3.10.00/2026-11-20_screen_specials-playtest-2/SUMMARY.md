# specials-playtest-2

**Question:** Playtest round 2 for the Editor (fixed bot, new seeds): how often do bots warm up specials, how often do they fire after warming up, do opponents step out of a warmed special's reach or stay in it, how often is a unit removed while warming up, specials per game, and special damage as a multiple of the normal hit?

**Answer:** balanced-5v5: mirror, 34.8% ended on the turn limit, A/B 209–187; balanced-7v7: mirror, 38.8% ended on the turn limit, A/B 194–201; light-7v7: mirror, 40.8% ended on the turn limit, A/B 190–208.

**Key table** (v3.10.00, 1200 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| balanced-5v5: brain5 v brain5, blitz5, mixed | 400 | 137 | 124 | 72 | 63 | 4 | 2.3% | 43.5% | 19.5% | 34.8% | 43.5% | 15.98 | 2.7% |
| balanced-7v7: brain5 v brain5, std7, mixed | 400 | 119 | 126 | 75 | 75 | 5 | 3.5% | 44.0% | 13.8% | 38.8% | 44.0% | 21.02 | 29.4% |
| light-7v7: brain5 v brain5, std7, light | 400 | 119 | 118 | 71 | 90 | 2 | 15.8% | 32.5% | 11.0% | 40.8% | 32.8% | 19.6 | 37.5% |

**Stalls** (`tables/stall.csv`):
- balanced-5v5: first attack on turn 2.9 and last damage on turn 11.0 on average (turn-limit games: 2.6 and 10.6). Turn-limit games end with 29.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- balanced-7v7: first attack on turn 2.5 and last damage on turn 12.2 on average (turn-limit games: 2.5 and 12.2). Turn-limit games end with 46.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- light-7v7: first attack on turn 2.4 and last damage on turn 9.5 on average (turn-limit games: 2.5 and 10.2). Turn-limit games end with 50.2 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** balanced-5v5: a mirror, so the A/B split is a check on noise (+1.1 standard errors from even). balanced-7v7: a mirror, so the A/B split is a check on noise (-0.3 standard errors from even). light-7v7: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed M9DU-CY9Z-49EM (light-7v7, game 141) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=M9DU-CY9Z-49EM&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=light&mixs=light&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 5W8H-PRYP-Y5S8 (balanced-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=5W8H-PRYP-Y5S8&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
