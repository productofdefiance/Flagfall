# lab-dry-run

**Question:** Does the lab play a small job order on GitHub and file a complete run folder, with an INDEX line and replay links that open on the board?

**Answer:** brain5-v-standard-5v5: brain5 took 65.0% of games against standard (decisive 5–4, tiebreak 8–3, draws 0); brain5-light-mirror-5v5: mirror, 50.0% ended on the turn limit, A/B 8–12.

**Key table** (v3.05.02, 40 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| brain5-v-standard-5v5: brain5 v standard, blitz5, mixed | 20 | 5 | 4 | 8 | 3 | 0 | 25.0% | 20.0% | 0.0% | 55.0% | 20.0% | 17.85 | 33.3% |
| brain5-light-mirror-5v5: brain5 v brain5, blitz5, light | 20 | 5 | 5 | 3 | 7 | 0 | 20.0% | 25.0% | 5.0% | 50.0% | 25.0% | 17.8 | 70.0% |

**Checks:** all 15 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** brain5-v-standard-5v5: within noise (1.3 standard errors; F23 asks for 2+ at 1,000+ games before ruling). brain5-light-mirror-5v5: a mirror, so the A/B split is a check on noise (-0.9 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed ZAER-Q49Q-UVC5 (brain5-v-standard-5v5, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/12/?watch=ZAER-Q49Q-UVC5&v=v3.05.01&rules=v3.4&format=blitz5&n=brain5&s=standard&mixn=mixed&mixs=mixed&first=N)
- longest game (25 turns, turn limit, more pull damage): seed 2BUQ-VX3G-Q9H6 (brain5-light-mirror-5v5, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/12/?watch=2BUQ-VX3G-Q9H6&v=v3.05.01&rules=v3.4&format=blitz5&n=brain5&s=brain5&mixn=light&mixs=light&first=N)
