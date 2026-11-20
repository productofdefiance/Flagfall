# dice-variety-bots

**Question:** Bot minimum: do Brain 5, Brain 6 and Kit D play 200 games each on v3.5 with no refused action, no error and no safety stop?

**Answer:** brain5-v-kitd-5v5: brain5 took 64.5% of games against kitD (decisive 24–14, tiebreak 38–19, draws 5); brain5-v-kitd-7v7: brain5 took 67.0% of games against kitD (decisive 42–20, tiebreak 22–10, draws 6); brain6-v-brain5-5v5: brain6 took 51.5% of games against brain5 (decisive 28–22, tiebreak 22–25, draws 3); brain6-v-brain5-7v7: brain6 took 54.0% of games against brain5 (decisive 27–29, tiebreak 25–15, draws 4).

**Key table** (v3.08.00, 400 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| brain5-v-kitd-5v5: brain5 v kitD, blitz5, mixed | 100 | 24 | 14 | 38 | 19 | 5 | 22.0% | 16.0% | 0.0% | 62.0% | 17.0% | 19.61 | 50.0% |
| brain5-v-kitd-7v7: brain5 v kitD, std7, mixed | 100 | 42 | 20 | 22 | 10 | 6 | 46.0% | 16.0% | 0.0% | 38.0% | 16.0% | 20.95 | 43.5% |
| brain6-v-brain5-5v5: brain6 v brain5, blitz5, mixed | 100 | 28 | 22 | 22 | 25 | 3 | 5.0% | 27.0% | 18.0% | 50.0% | 27.0% | 18.56 | 32.0% |
| brain6-v-brain5-7v7: brain6 v brain5, std7, mixed | 100 | 27 | 29 | 25 | 15 | 4 | 6.0% | 38.0% | 12.0% | 44.0% | 38.0% | 22.77 | 39.3% |

**Checks:** FAILED: other brain tests (30) (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** brain5-v-kitd-5v5: a real difference at this sample, 2.9 standard errors from even. brain5-v-kitd-7v7: a real difference at this sample, 3.4 standard errors from even. brain6-v-brain5-5v5: within noise (0.3 standard errors; F23 asks for 2+ at 1,000+ games before ruling). brain6-v-brain5-7v7: within noise (0.8 standard errors; F23 asks for 2+ at 1,000+ games before ruling). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed 354G-HX2C-VVS9 (brain5-v-kitd-5v5, game 95) [watch](https://productofdefiance.github.io/Flagfall/pr/21/?watch=354G-HX2C-VVS9&v=v3.08.00&rules=v3.5&format=blitz5&n=kitD&s=brain5&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, draw): seed 36UV-QWY3-EJJD (brain5-v-kitd-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/21/?watch=36UV-QWY3-EJJD&v=v3.08.00&rules=v3.5&format=std7&n=brain5&s=kitD&mixn=mixed&mixs=mixed&first=N)
