# brain8-tempo-confirm

**Question:** The two most promising opening pairs from the brain8-sweep screen, confirmed at 1,000 games per format in Brain 8 mirrors on v3.8: first mover even (0) or sitting back (-1), second mover pushing (+1). Same deals as brain8-confirm, so its b8-mirror rows are the even-even baseline. Does either bring 7v7's first mover into 45-55% of decisive games without pushing 5v5 out, and what happens to stalls?

**Answer:** tempo-even-push-mirror-5v5: mirror, 46.5% ended on the turn limit, A/B 466–465; tempo-back-push-mirror-5v5: mirror, 11.6% ended on the turn limit, A/B 500–495; tempo-even-push-mirror-7v7: mirror, 12.1% ended on the turn limit, A/B 508–474; tempo-back-push-mirror-7v7: mirror, 12.2% ended on the turn limit, A/B 509–487.

**Key table** (v3.14.00, 4000 games; tiebreak wins counted apart from KOs and draws)

| Matchup | Games | A wins (KO/TKO) | B wins (KO/TKO) | A tiebreak | B tiebreak | Draws | Holder KO | Pull KO | TKO | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tempo-even-push-mirror-5v5: brain8:tempoFirst=0,tempoSecond=1 v brain8:tempoFirst=0,tempoSecond=1, blitz5, mixed | 1000 | 261 | 274 | 205 | 191 | 69 | 5.9% | 36.8% | 10.8% | 46.5% | 36.8% | 19.02 | 57.9% |
| tempo-back-push-mirror-5v5: brain8:tempoFirst=-1,tempoSecond=1 v brain8:tempoFirst=-1,tempoSecond=1, blitz5, mixed | 1000 | 448 | 436 | 52 | 59 | 5 | 7.2% | 66.9% | 14.3% | 11.6% | 66.9% | 13.18 | 99.0% |
| tempo-even-push-mirror-7v7: brain8:tempoFirst=0,tempoSecond=1 v brain8:tempoFirst=0,tempoSecond=1, std7, mixed | 1000 | 460 | 419 | 48 | 55 | 18 | 5.7% | 65.8% | 16.4% | 12.1% | 65.8% | 15.74 | 43.7% |
| tempo-back-push-mirror-7v7: brain8:tempoFirst=-1,tempoSecond=1 v brain8:tempoFirst=-1,tempoSecond=1, std7, mixed | 1000 | 447 | 431 | 62 | 56 | 4 | 4.5% | 66.1% | 17.2% | 12.2% | 66.3% | 16.19 | 57.0% |

**Stalls** (`tables/stall.csv`):
- tempo-even-push-mirror-5v5: first attack on turn 4.5 and last damage on turn 12.1 on average (turn-limit games: 5.0 and 10.1). Turn-limit games end with 30.7 side-turns without an attack or pull on average. 99.1% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- tempo-back-push-mirror-5v5: first attack on turn 3.3 and last damage on turn 11.8 on average (turn-limit games: 3.2 and 12.9). Turn-limit games end with 24.7 side-turns without an attack or pull on average. 95.7% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- tempo-even-push-mirror-7v7: first attack on turn 2.2 and last damage on turn 12.9 on average (turn-limit games: 2.3 and 11.6). Turn-limit games end with 47.3 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).
- tempo-back-push-mirror-7v7: first attack on turn 2.7 and last damage on turn 13.4 on average (turn-limit games: 2.7 and 11.9). Turn-limit games end with 46.9 side-turns without an attack or pull on average. 100.0% of turn-limit games took their last damage 5 or more side-turns before the end (a starting cut for the stall study, not a definition of a stall).

**Likely or proven:** tempo-even-push-mirror-5v5: a mirror, so the A/B split is a check on noise (+0.0 standard errors from even). tempo-back-push-mirror-5v5: a mirror, so the A/B split is a check on noise (+0.2 standard errors from even). tempo-even-push-mirror-7v7: a mirror, so the A/B split is a check on noise (+1.1 standard errors from even). tempo-back-push-mirror-7v7: a mirror, so the A/B split is a check on noise (+0.7 standard errors from even). Any cause behind a difference is likely, not isolated, unless a run was built to isolate it.

**Flags raised:** none

**Replay the odd games:** each row of `games.csv` has a `replay` link that opens that game on the board.
- shortest game (8 turns, KO): seed PKXV-A6AD-4D4H (tempo-even-push-mirror-5v5, game 60) [watch](https://productofdefiance.github.io/Flagfall/pr/41/?watch=PKXV-A6AD-4D4H&v=v3.14.00&rules=v3.8&format=blitz5&n=brain8%3AtempoFirst%3D0%2CtempoSecond%3D1&s=brain8%3AtempoFirst%3D0%2CtempoSecond%3D1&mixn=mixed&mixs=mixed&first=N)
- longest game (35 turns, turn limit, more pull damage): seed EJ4K-AP4Q-NYWS (tempo-even-push-mirror-7v7, game 200) [watch](https://productofdefiance.github.io/Flagfall/pr/41/?watch=EJ4K-AP4Q-NYWS&v=v3.14.00&rules=v3.8&format=std7&n=brain8%3AtempoFirst%3D0%2CtempoSecond%3D1&s=brain8%3AtempoFirst%3D0%2CtempoSecond%3D1&mixn=mixed&mixs=mixed&first=N)
