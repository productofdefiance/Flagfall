# Studies from before the lab

These are the simulation studies from before Brief 008, moved here from `data/` with `git mv` (their history is kept). They're in their original shape: one JSON line of totals per batch from `baseline.js`, not the lab's run folders. They predate board seeds, so their games can't be opened on the board; they can be re-run with the scripts in `sims/`, which still deal their old seeds.

Old briefs and the changelog still name the old paths. Map them like this:

| Old path | New path | What it asked | Brief | Rule set | Brains | Games |
|---|---|---|---|---|---|---|
| `data/sim_study6/` | `results/pre-v3.05.00/sim_study6/` | The v3.1 baseline: how do games end? (the red team's fixed baseline) | before Brief 001 (16 Nov) | v3.1 | Kit B vs Kit B, balanced | 400 per format (5v5, 7v7) |
| `data/sim_study7/` | `results/pre-v3.05.00/sim_study7/` | The v3.2 baseline, on the same 20 batches of 20 games as v3.1 | 002 | v3.2 | Kit B vs Kit B, balanced | 400 per format |
| `data/sim_study8/` | `results/pre-v3.05.00/sim_study8/` | Does Evade (v3.3) change how games end, and does tackle using the cap matter? (`v3.2`, `v3.3`, `v3.3_tackleUsesCap_off`) | 004 | v3.2, v3.3 | Kit B vs Kit B, balanced | 400 per format and rule set; 200 at 7v7 for the tackle comparison |
| `data/sim_study9/` | `results/pre-v3.05.00/sim_study9/` | Kit D (the turn planner): against Kit B, in mirrors at v3.3 and v3.4 (35 turns at 7v7), and its planner switches one at a time (`ablation`) | 005 | v3.3, v3.4 | Kit D, Kit B | 400 per format; 120 per format for each planner switch |
| `data/sim_study10/` | `results/pre-v3.05.00/sim_study10/` | Kit D's diagnosis, Brain 5 vs Kit D, Brain 5 mirrors (balanced and all-Light), and the settings review (`settings_off`, `settings5.txt`) | 006 | v3.4 | Kit D, Brain 5 | 400 per format and lineup; 1,000 for the Brain 5 balanced mirrors; 100 per setting |

The scripts that made them moved too:

| Old path | New path |
|---|---|
| `board/tests/baseline.js`, `baseline_sum.py` | `sims/baseline.js`, `sims/baseline_sum.py` |
| `board/tests/h2h_v3.js`, `h2h_lineup.js`, `sim_games.js`, `flagdiag.js` | `sims/` (same names) |
| `data/sim_study10/brainhash.js`, `count5.js`, `settings5.js`, `diag.py`, `h2h.py` | `sims/` (same names) |

Run them from the repository's top folder, for example `node sims/baseline.js v3.4 5 20 brain5 brain5 balanced 0`.
