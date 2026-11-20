# specials-bots-b

**Question:** Re-run on the fixed bot (it now counts an enemy's warmed-up Arrow Storm without Dodge, as the engine deals it; Skewer warms only for a plausible line-up), same seeds as specials-bots. Bot minimum: does Brain 5 use all six specials on v3.7 (each fired 50+ times, 60%+ of warm-ups fired next turn, no refused action, every game finished), 400 games per format?

**Answer:** balanced-5v5: mirror, 37.5% ended on the turn limit, A/B 200–197; balanced-7v7: mirror, 41.5% ended on the turn limit, A/B 202–187; light-7v7: mirror, 39.3% ended on the turn limit, A/B 177–216.

**Key table** (v3.10.00, 1200 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| balanced-5v5: brain5 v brain5, blitz5, mixed | 400 | 131 | 119 | 69 | 78 | 3 | 3.3% | 41.3% | 18.0% | 37.5% | 41.3% | 16.21 | 6.0% |
| balanced-7v7: brain5 v brain5, std7, mixed | 400 | 115 | 119 | 87 | 68 | 11 | 3.5% | 38.5% | 16.5% | 41.5% | 38.5% | 21.59 | 33.8% |
| light-7v7: brain5 v brain5, std7, light | 400 | 113 | 130 | 64 | 86 | 7 | 16.8% | 32.8% | 11.3% | 39.3% | 32.8% | 19.26 | 36.6% |

**Stalls** (`tables/stall.csv`):
- balanced-5v5: first attack on turn 2.8 and last damage on turn 10.8 on average (turn-limit games: 2.5 and 10.7). Turn-limit games end with 29.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- balanced-7v7: first attack on turn 2.5 and last damage on turn 12.0 on average (turn-limit games: 2.5 and 11.8). Turn-limit games end with 46.8 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- light-7v7: first attack on turn 2.4 and last damage on turn 9.6 on average (turn-limit games: 2.3 and 10.4). Turn-limit games end with 49.8 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** balanced-5v5: a mirror, so the A/B split is a check on noise (+0.2 standard errors from even). balanced-7v7: a mirror, so the A/B split is a check on noise (+0.8 standard errors from even). light-7v7: a mirror, so the A/B split is a check on noise (-2.0 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (6 turns, KO): seed 2LF3-HFEE-W47E (light-7v7, game 260) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=2LF3-HFEE-W47E&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=light&mixs=light&first=N)
- longest game (35 turns, turn limit, more pull damage): seed USUN-C5KX-X9FG (balanced-7v7, game 20) [watch](https://productofdefiance.github.io/Flagfall/pr/31/?watch=USUN-C5KX-X9FG&v=v3.10.00&rules=v3.7&format=std7&n=brain5&s=brain5&mixn=mixed&mixs=mixed&first=N)
