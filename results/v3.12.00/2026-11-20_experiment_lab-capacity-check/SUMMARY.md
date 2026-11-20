# lab-capacity-check

**Question:** Does a lab run on a pull request choose its share of machines, say why in one line, and write its queue log line (Brief 024)?

**Answer:** mirror-5v5: mirror, 40.0% ended on the turn limit, A/B 3–5; mirror-7v7: mirror, 20.0% ended on the turn limit, A/B 5–5.

**Key table** (v3.12.00, 20 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mirror-5v5: brain5 v brain5, blitz5, mixed | 10 | 3 | 3 | 0 | 2 | 2 | 0.0% | 50.0% | 10.0% | 40.0% | 50.0% | 18.1 | 66.7% |
| mirror-7v7: brain5 v brain5, std7, mixed | 10 | 3 | 5 | 2 | 0 | 0 | 0.0% | 70.0% | 10.0% | 20.0% | 70.0% | 15.8 | 25.0% |

**Stalls** (`tables/stall.csv`):
- mirror-5v5: first attack on turn 5.1 and last damage on turn 10.5 on average (turn-limit games: 5.0 and 6.0). Turn-limit games end with 40.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- mirror-7v7: first attack on turn 2.9 and last damage on turn 11.8 on average (turn-limit games: 3.0 and 15.0). Turn-limit games end with 40.0 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** mirror-5v5: a mirror, so the A/B split is a check on noise (-0.6 standard errors from even). mirror-7v7: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (9 turns, KO): seed CXAL-LL5Q-TBBT (mirror-7v7, game 5) [watch](https://productofdefiance.github.io/Flagfall/pr/45/?watch=CXAL-LL5Q-TBBT&v=v3.12.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed 3LRW-3Q5S-79PQ (mirror-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/45/?watch=3LRW-3Q5S-79PQ&v=v3.12.00&rules=v3.8&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
