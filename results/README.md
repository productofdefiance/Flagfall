# Results

Every simulation run lands here, one folder per run, all in the same shape. The design chat reads these; the Editor reads the summaries when he wants to. Start with `INDEX.md` (newest first) or `index.csv` (the same list for scripts).

## The layout
```
results/
  README.md       this file
  INDEX.md        one line per run, newest first, written automatically
  index.csv       the same list: id, date, version, kind, brief, tags, question, answer, path (more columns may follow)
  v3.05.02/       runs grouped under the game version they tested
    2026-11-18_screen_lab-dry-run/
  pre-v3.05.00/   the studies from before the lab (data/sim_study6–10), moved as they were; see its README
```

## Folder names
`YYYY-MM-DD_kind_short-topic`:
- the date it ran, in New York time;
- the kind (below);
- the topic: the job order's `id`, lowercase with hyphens.

A second run of the same thing on the same day gets `-2`, then `-3`. The version folder is the board's game version (`board/version.js`) when the run started.

## Kinds
An open list: to add a kind, add a line here. No code refuses a kind it doesn't know.

| Kind | What it is |
|---|---|
| `screen` | A quick daytime look, up to about 200 games per side. Not enough to rule on (F23). |
| `study` | A big run answering one question from a brief, usually overnight, 1,000+ games per side. |
| `release` | A version's final exam: the baseline table at 1,000 games per format, newest rule set, default brain mirror. One per version. |
| `nightly` | The health check on `main`. When `main` hasn't changed since the last passing night, only an INDEX line ("no change, passed"). |
| `experiment` | Anything else, including tests of the lab itself. |

## Files in every run folder
- **`SUMMARY.md`**: read first. Always in this order: the question; the answer in one line; the key table; likely or proven; flags raised; how to replay the odd games. One screen at most. Tiebreak wins are always counted apart from KOs and draws.
- **`run.json`**: the facts. Core fields: `id`, `kind`, `version`, `build`, `commit`, `brief`, `question`, `tags`, `trigger` (night, day or pull request), `started`, `finished`, `games`, `seed_from`, `scripts`, `settings` (the matchups and measures). Anything else goes under `extra`. New fields are allowed; nothing breaks on a field it doesn't know.
- **`games.csv`**: one row per game. Core columns, always first and never renamed or removed: `seed`, `version`, `rules`, `format`, `lineup_n`, `lineup_s`, `brain_n`, `brain_s`, `first`, `winner`, `how`, `turns`, `flag_damage_n`, `flag_damage_s`, `units_lost_n`, `units_lost_s`, `replay`. Every measure adds its own columns after them. Over about 5 MB it is saved gzipped as `games.csv.gz`.
- **`tables/`**: the totals behind the summary, as CSV. `outcomes.csv` (the baseline table per matchup) is always there; each measure adds its own table.

What's kept: all of the above, in the repository, for good. Turn-by-turn logs aren't kept: the seed rebuilds any game.

### Column meanings
- `flag_damage_n` is the damage North did to South's flag (hits on South's holder count, as the tiebreak counts them, F20); `units_lost_n` is North's unit cap (UC) lost.
- `winner` is N, S, `draw` or `unfinished`; `how` is the engine's own words ("KO", "TKO", "turn limit, more pull damage", ...).
- `replay` opens that game on the live board, set up and playing. If a brain's settings were changed for the run (a sweep), the board can't replay it and the cell says so.
- `a_side` is the side brain A played. `a_result` is `win`, `loss`, `win_tiebreak`, `loss_tiebreak`, `draw` from A's side.
- The measures and their columns are listed in `sims/lab/measures.js`, each with a line saying what it counts.

## How a run is made
1. A **job order** (a small JSON file) goes in `studies/queue/`. The design chat writes them in briefs; Code writes them during a build.
2. The **lab** (`.github/workflows/lab.yml`) plays it on GitHub: every night after `main`'s night checks, on demand ("Run workflow"), or in a pull request that adds a job order. It splits the games over up to 20 machines, merges them, writes the run folder and the INDEX line, and moves the job order to `studies/done/`.
3. On `main`, the results reach `main` through an automatic pull request that may only change `results/` and `studies/`, and merges itself once the checks pass.

### A job order
```json
{
  "id": "brain6-vs-brain5",
  "kind": "study",
  "brief": "007",
  "question": "Does Brain 6 beat Brain 5 in at least three of the four formats?",
  "tags": ["brain6", "brain5"],
  "measures": ["evade", "clock", "light"],
  "matchups": [
    { "name": "balanced-7", "a": "brain6", "b": "brain5", "rules": "v3.4", "format": "std7", "mix": "mixed", "games": 1000 },
    { "name": "light-5", "a": "brain6", "b": "brain5", "rules": "v3.4", "format": "blitz5", "mix": "light", "games": 1000 }
  ]
}
```
- `a`, `b`: brain ids on the board. `id:key=value,...` changes a setting for a sweep (those games can't be replayed on the board).
- `format`: the board's format id (`blitz5`, `std7`). `mix`: the Teams screen's mix for both sides (`mixed` = the balanced lineup, `light`, `heavy`, `open` = the brain's own squad, `random`); `mix_a` / `mix_b` set one side.
- Brain A plays each side and each move order equally, unless the matchup sets `a_side` or `first`.
- `games` per matchup; `seed_from` (default 0) shifts the seeds. Seeds come from `tests/rng.js` (`lab:<order id>:<matchup name>`, game number), so the same order always plays the same games.
- `measures`: names from `sims/lab/measures.js`, for the whole order or per matchup. `outcome` and `timing` are always collected. An unknown name is skipped and the summary says so.
- Optional: `answer` (the one-line answer, if already known), `flags`, `seed_name`, and anything else (kept in `run.json` under `extra`).

## Adding to the structure
Extend, never rename:
- a new **kind**: a line in the table above;
- a new **measure**: an entry in `sims/lab/measures.js` (its columns join `games.csv` and it gets its own table);
- a new **field** in `run.json` or a new **column** in `index.csv`: just write it; readers ignore what they don't know.
- New formats (9v9), units (Cavalry), specials and brains need no change here: they're values in the core columns.
