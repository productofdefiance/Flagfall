# specials-old-sizes

**Question:** Sim-only v3.7 with the sizes first drafted on 18 Nov (Arrow Storm and Javelin x1.5, Skewer's second hit x0.75, Arc Hit x0.5): same games, same table, uptake and damage.

**Answer:** 5v5: mirror, 60.2% ended on the turn limit, A/B 464–510; 7v7: mirror, 41.4% ended on the turn limit, A/B 502–481.

**Key table** (v3.10.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5 v brain5, blitz5, mixed | 1000 | 191 | 207 | 273 | 303 | 26 | 4.7% | 26.6% | 8.5% | 60.2% | 26.6% | 20.01 | 62.1% |
| 7v7: brain5 v brain5, std7, mixed | 1000 | 308 | 278 | 194 | 203 | 17 | 2.9% | 43.2% | 12.5% | 41.4% | 43.2% | 21.85 | 44.9% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 2.7 and last damage on turn 11.4 on average (turn-limit games: 2.8 and 10.6). Turn-limit games end with 29.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.5 and last damage on turn 12.4 on average (turn-limit games: 2.5 and 12.3). Turn-limit games end with 46.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: a mirror, so the A/B split is a check on noise (-1.5 standard errors from even). 7v7: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed BSZ9-6VDV-LRZT (5v5, game 231) not replayable: rule numbers changed for this run
- longest game (35 turns, turn limit, more pull damage): seed K5ZJ-ZZJJ-GRJ7 (7v7, game 0) not replayable: rule numbers changed for this run
