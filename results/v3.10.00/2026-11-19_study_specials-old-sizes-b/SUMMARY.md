# specials-old-sizes-b

**Question:** Re-run on the fixed bot (it now counts an enemy's warmed-up Arrow Storm without Dodge, as the engine deals it; Skewer warms only for a plausible line-up), same seeds as specials-old-sizes. Sim-only v3.7 with the sizes first drafted on 18 Nov (Arrow Storm and Javelin x1.5, Skewer's second hit x0.75, Arc Hit x0.5): same games, same table, uptake and damage.

**Answer:** 5v5: mirror, 55.2% ended on the turn limit, A/B 506–489; 7v7: mirror, 45.0% ended on the turn limit, A/B 491–489.

**Key table** (v3.10.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 236 | 212 | 270 | 277 | 5 | 5.6% | 25.6% | 13.6% | 55.2% | 25.6% | 18.74 | 85.3% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 282 | 268 | 209 | 221 | 20 | 2.1% | 39.9% | 13.0% | 45.0% | 39.9% | 22.79 | 46.4% |

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.8 and last damage on turn 10.1 on average (turn-limit games: 2.7 and 9.4). Turn-limit games end with 31.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.6 and last damage on turn 12.5 on average (turn-limit games: 2.6 and 12.2). Turn-limit games end with 46.1 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (+0.5 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed N7Y7-3BSQ-QQEQ (5v5, game 295) not replayable: rule numbers changed for this run
- longest game (35 turns, turn limit, fewer beings lost): seed K5ZJ-ZZJJ-GRJ7 (7v7, game 0) not replayable: rule numbers changed for this run
