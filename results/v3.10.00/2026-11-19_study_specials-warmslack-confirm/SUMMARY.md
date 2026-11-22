# specials-warmslack-confirm

**Question:** Settings review, confirm stage: Brain 5 with warmSlack 0 (A) against the default Brain 5 (warmSlack 1), v3.7, 1,000 games per format. The screen gave A 57.8% of 200 7v7 games (about 2.2 standard errors).

**Answer:** 5v5: brain5:warmSlack=0 took 48.2% of games against brain5 (decisive 311–293, tiebreak 164–218, draws 14); 7v7: brain5:warmSlack=0 took 53.8% of games against brain5 (decisive 337–285, tiebreak 194–170, draws 14).

**Key table** (v3.10.00, 2000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5v5: brain5:warmSlack=0 v brain5, blitz5, mixed | 1000 | 311 | 293 | 164 | 218 | 14 | 4.6% | 40.7% | 15.1% | 39.6% | 40.7% | 16.58 | 5.6% |
| 7v7: brain5:warmSlack=0 v brain5, std7, mixed | 1000 | 337 | 285 | 194 | 170 | 14 | 2.4% | 48.7% | 11.1% | 37.8% | 48.9% | 20.59 | 23.2% |

**Stalls** (`tables/stall.csv`):
- 5v5: first attack on turn 3.0 and last damage on turn 11.1 on average (turn-limit games: 2.6 and 11.2). Turn-limit games end with 28.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- 7v7: first attack on turn 2.7 and last damage on turn 12.1 on average (turn-limit games: 2.7 and 12.6). Turn-limit games end with 45.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** 5v5: within noise (-1.1 standard errors; F23 asks for 2+ at 1,000+ games before ruling). 7v7: a real difference at this sample, 2.4 standard errors from even. Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed LBN7-LSNX-V8D9 (5v5, game 0) not replayable: brain settings changed for this run
- longest game (35 turns, turn limit, more pull damage): seed KF8A-YSTJ-7297 (7v7, game 0) not replayable: brain settings changed for this run
