# brain7-storm-lead

**Question:** B6: when Brain 7 is ahead on material and on flag damage, storm or hold? stormLead 1.0 and 2.0 against Brain 5 (1.5, the shipped value, is in brain7-vs-brain5 on the same seeds).

**Answer:** storm1-v-b5-5v5: brain7:stormLead=1 took 45.4% of games against brain5 (decisive 334–251, tiebreak 114–289, draws 12); storm1-v-b5-7v7: brain7:stormLead=1 took 49.9% of games against brain5 (decisive 387–291, tiebreak 95–193, draws 34); storm2-v-b5-5v5: brain7:stormLead=2 took 45.6% of games against brain5 (decisive 328–249, tiebreak 122–289, draws 12); storm2-v-b5-7v7: brain7:stormLead=2 took 50.0% of games against brain5 (decisive 387–291, tiebreak 96–192, draws 34).

**Key table** (v3.10.00, 4000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| storm1-v-b5-5v5: brain7:stormLead=1 v brain5, blitz5, mixed | 1000 | 334 | 251 | 114 | 289 | 12 | 5.8% | 33.1% | 19.6% | 41.5% | 33.1% | 17.42 | 35.9% |
| storm1-v-b5-7v7: brain7:stormLead=1 v brain5, std7, mixed | 1000 | 387 | 291 | 95 | 193 | 34 | 3.9% | 48.4% | 15.5% | 32.2% | 48.5% | 20.45 | 50.6% |
| storm2-v-b5-5v5: brain7:stormLead=2 v brain5, blitz5, mixed | 1000 | 328 | 249 | 122 | 289 | 12 | 5.3% | 32.5% | 19.9% | 42.3% | 32.5% | 17.5 | 35.9% |
| storm2-v-b5-7v7: brain7:stormLead=2 v brain5, std7, mixed | 1000 | 387 | 291 | 96 | 192 | 34 | 3.6% | 47.8% | 16.4% | 32.2% | 47.8% | 20.45 | 50.7% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Stalls** (`tables/stall.csv`):
- storm1-v-b5-5v5: first attack on turn 2.0 and last damage on turn 11.4 on average (turn-limit games: 2.0 and 10.5). Turn-limit games end with 29.6 side-turns without an attack or pull on average. 99.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- storm1-v-b5-7v7: first attack on turn 3.1 and last damage on turn 13.2 on average (turn-limit games: 3.0 and 12.4). Turn-limit games end with 47.1 side-turns without an attack or pull on average. 99.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- storm2-v-b5-5v5: first attack on turn 2.0 and last damage on turn 11.3 on average (turn-limit games: 2.0 and 10.5). Turn-limit games end with 29.6 side-turns without an attack or pull on average. 99.8% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- storm2-v-b5-7v7: first attack on turn 3.1 and last damage on turn 13.2 on average (turn-limit games: 3.1 and 12.3). Turn-limit games end with 47.2 side-turns without an attack or pull on average. 99.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** storm1-v-b5-5v5: a real difference at this sample, -2.9 standard errors from even. storm1-v-b5-7v7: within noise (-0.1 standard errors; F23 asks for 2+ at 1,000+ games before ruling). storm2-v-b5-5v5: a real difference at this sample, -2.8 standard errors from even. storm2-v-b5-7v7: within noise (0.0 standard errors; F23 asks for 2+ at 1,000+ games before ruling). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed GC84-B87R-HZG2 (storm1-v-b5-5v5, game 281) [watch](https://productofdefiance.github.io/Flagfall/pr/33/?watch=GC84-B87R-HZG2&v=v3.10.00&rules=v3.6&format=blitz5&n=brain7%3AstormLead%3D1&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, fewer beings lost): seed HJY3-N8QK-EEZG (storm1-v-b5-7v7, game 100) [watch](https://productofdefiance.github.io/Flagfall/pr/33/?watch=HJY3-N8QK-EEZG&v=v3.10.00&rules=v3.6&format=std7&n=brain7%3AstormLead%3D1&s=brain5&mixn=mixed&mixs=mixed&first=N)
