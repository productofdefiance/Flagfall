# flag-rulings-bots

**Question:** Bot minimum: does Brain 6 play 200 balanced games per format on v3.6 against itself with no refused action, no error and no unfinished game? (Brain 5's mirrors are the 1,000-game v3.6 study.)

**Answer:** brain6-mirror-5v5: mirror, 54.5% ended on the turn limit, A/B 100–99; brain6-mirror-7v7: mirror, 47.0% ended on the turn limit, A/B 97–99.

**Key table** (v3.09.00, 400 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| brain6-mirror-5v5: brain6 v brain6, blitz5, mixed | 200 | 44 | 47 | 56 | 52 | 1 | 3.5% | 30.5% | 11.5% | 54.5% | 30.5% | 18.8 | 34.1% |
| brain6-mirror-7v7: brain6 v brain6, std7, mixed | 200 | 50 | 56 | 47 | 43 | 4 | 4.0% | 36.5% | 12.5% | 47.0% | 36.5% | 23.53 | 53.8% |

**Checks:** all 16 passed (`tables/checks.csv`, hashes in `tables/hashes.txt`).

**Likely or proven:** brain6-mirror-5v5: a mirror, so the A/B split is a check on noise (+0.1 standard errors from even). brain6-mirror-7v7: a mirror, so the A/B split is a check on noise (-0.1 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (7 turns, KO): seed RHFG-22T4-KFFJ (brain6-mirror-5v5, game 193) [watch](https://productofdefiance.github.io/Flagfall/pr/27/?watch=RHFG-22T4-KFFJ&v=v3.09.00&rules=v3.6&format=blitz5&n=brain6&s=brain6&mixn=mixed&mixs=mixed&first=S)
- longest game (35 turns, turn limit, more pull damage): seed V8RS-LUTR-CRPX (brain6-mirror-7v7, game 0) [watch](https://productofdefiance.github.io/Flagfall/pr/27/?watch=V8RS-LUTR-CRPX&v=v3.09.00&rules=v3.6&format=std7&n=brain6&s=brain6&mixn=mixed&mixs=mixed&first=N)
