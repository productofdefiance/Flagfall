# specials-onoff-b

**Question:** Re-run on the fixed bot (it now counts an enemy's warmed-up Arrow Storm without Dodge, as the engine deals it; Skewer warms only for a plausible line-up), same seeds as specials-onoff. Specials on vs off: Brain 5 using specials (A) against Brain 5 ignoring them (useSpecials=0), v3.7, 400 games per format, sides and move order swapped evenly. If off wins by more than the noise, specials are a trap as written (ASK).

**Answer:** balanced-5v5: brain5 took 80.0% of games against brain5:useSpecials=0 (decisive 230–25, tiebreak 88–53, draws 4); balanced-7v7: brain5 took 68.6% of games against brain5:useSpecials=0 (decisive 182–41, tiebreak 90–82, draws 5); light-7v7: brain5 took 89.3% of games against brain5:useSpecials=0 (decisive 299–17, tiebreak 57–25, draws 2).

**Key table** (v3.10.00, 1200 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| balanced-5v5: brain5 v brain5:useSpecials=0, blitz5, mixed | 400 | 230 | 25 | 88 | 53 | 4 | 6.0% | 41.3% | 16.5% | 36.3% | 41.3% | 15.88 | 42.8% |
| balanced-7v7: brain5 v brain5:useSpecials=0, std7, mixed | 400 | 182 | 41 | 90 | 82 | 5 | 3.5% | 40.3% | 12.0% | 44.3% | 40.3% | 22.31 | 47.1% |
| light-7v7: brain5 v brain5:useSpecials=0, std7, light | 400 | 299 | 17 | 57 | 25 | 2 | 17.8% | 47.5% | 13.8% | 21.0% | 47.5% | 14.27 | 50.3% |

**Stalls** (`tables/stall.csv`):
- balanced-5v5: first attack on turn 2.5 and last damage on turn 10.5 on average (turn-limit games: 2.3 and 10.0). Turn-limit games end with 30.4 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- balanced-7v7: first attack on turn 2.7 and last damage on turn 12.3 on average (turn-limit games: 2.7 and 12.4). Turn-limit games end with 45.6 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- light-7v7: first attack on turn 2.3 and last damage on turn 9.1 on average (turn-limit games: 2.4 and 10.5). Turn-limit games end with 49.7 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** balanced-5v5: a real difference at this sample, 12.0 standard errors from even. balanced-7v7: a real difference at this sample, 7.5 standard errors from even. light-7v7: a real difference at this sample, 15.7 standard errors from even. Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed 2DD5-G4VE-C3UF (light-7v7, game 36) not replayable: brain settings changed for this run
- longest game (35 turns, turn limit, fewer beings lost): seed GN7R-SDS4-PQBD (balanced-7v7, game 0) not replayable: brain settings changed for this run
