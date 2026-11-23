# brain8-v39

**Question:** Re-measure on v3.9 (routes, brief 017): Brain 8 as shipped (B4 on, A1 and A2 off, tempoFirst 0, tempoSecond +1) against Brain 5, 1,000 games per format, balanced and all-Light; sides and move order swapped evenly (the Editor, 21 Nov).

**Answer:** b8-v-b5-5v5: brain8 took 50.6% of games against brain5 (decisive 263–206, tiebreak 204–248, draws 79); b8-v-b5-light-5v5: brain8 took 46.9% of games against brain5 (decisive 372–189, tiebreak 85–330, draws 24); b8-v-b5-7v7: brain8 took 46.3% of games against brain5 (decisive 384–316, tiebreak 71–214, draws 15); b8-v-b5-light-7v7: brain8 took 47.3% of games against brain5 (decisive 420–350, tiebreak 45–169, draws 16).

**Key table** (v3.15.00, 4000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| b8-v-b5-5v5: brain8 v brain5, blitz5, mixed | 1000 | 263 | 206 | 204 | 248 | 79 | 4.6% | 33.3% | 9.0% | 53.1% | 33.3% | 19.56 | 60.3% |
| b8-v-b5-light-5v5: brain8 v brain5, blitz5, light | 1000 | 372 | 189 | 85 | 330 | 24 | 12.8% | 28.3% | 15.0% | 43.9% | 28.7% | 15.44 | 43.7% |
| b8-v-b5-7v7: brain8 v brain5, std7, mixed | 1000 | 384 | 316 | 71 | 214 | 15 | 4.0% | 50.1% | 15.9% | 30.0% | 50.2% | 19.44 | 34.4% |
| b8-v-b5-light-7v7: brain8 v brain5, std7, light | 1000 | 420 | 350 | 45 | 169 | 16 | 19.8% | 40.1% | 17.1% | 23.0% | 40.3% | 15.36 | 40.9% |

**Stalls** (`tables/stall.csv`):
- b8-v-b5-5v5: first attack on turn 4.3 and last damage on turn 11.8 on average (turn-limit games: 4.7 and 10.3). Turn-limit games end with 30.1 side-turns without an attack or pull on average. 97.9% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-light-5v5: first attack on turn 2.4 and last damage on turn 7.8 on average (turn-limit games: 2.4 and 7.7). Turn-limit games end with 35.5 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-7v7: first attack on turn 2.4 and last damage on turn 12.6 on average (turn-limit games: 2.5 and 12.3). Turn-limit games end with 45.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- b8-v-b5-light-7v7: first attack on turn 2.3 and last damage on turn 9.6 on average (turn-limit games: 2.3 and 10.0). Turn-limit games end with 50.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** b8-v-b5-5v5: within noise (0.4 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b8-v-b5-light-5v5: within noise (-2.0 standard errors; F23 asks for 2+ at 1,000+ games before ruling). b8-v-b5-7v7: a real difference at this sample, -2.4 standard errors from even. b8-v-b5-light-7v7: within noise (-1.7 standard errors; F23 asks for 2+ at 1,000+ games before ruling). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (4 turns, KO): seed MHAP-Y7NQ-2XQU (b8-v-b5-light-5v5, game 292) [watch](https://productofdefiance.github.io/Flagfall/pr/41/?watch=MHAP-Y7NQ-2XQU&v=v3.15.00&rules=v3.9&format=blitz5&n=brain8&s=brain5&mixn=light&mixs=light&first=N)
- longest game (35 turns, turn limit, fewer beings lost): seed GW8D-FF6S-LYBF (b8-v-b5-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/41/?watch=GW8D-FF6S-LYBF&v=v3.15.00&rules=v3.9&format=std7&n=brain8&s=brain5&mixn=mixed&mixs=mixed&first=N)
