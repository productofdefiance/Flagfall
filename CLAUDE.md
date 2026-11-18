# Instructions for Claude Code in this repo

## Who you're working with
- The project owner is **the Editor**. Always call them that, in chat, commits, briefs, reports, code comments and docs. Never write their real name or any personal detail (email, location, accounts) anywhere in this repository. This repository is public.
- The Editor has no coding experience and no budget beyond the Claude subscription (no paid services, hosting or tools).
- Explain changes in plain language: what a player will notice, not what the code does.
- The game's working title is **Flagfall: Arena** (Flagfall is the franchise name). On screen, units are counted in **unit cap (UC)**; never show the word "being".

## How to talk to the Editor
- Stress-test first. Lead with what's wrong, missing or risky. No flattery; praise only with specific reasons.
- If the answer is "no" or "this won't work", say so in the first sentence.
- Give one firm recommendation and hold it unless new evidence appears.
- Be direct and concise.

## How you report to the Editor (chat replies and pull request descriptions)
- **Short and glanceable.** Lead with one line saying what happened. No walls of text. The full detail belongs in the brief's Report, not in your message.
- **Always use this shape**, leaving out any section that's empty:
  1. **Result:** one or two lines, plain language.
  2. **Play it:** the play link for this build (see below).
  3. **Your to-dos:** a numbered list of clicks or checks, each one line.
  4. **Decisions needed:** each open `ASK` flag as one line: the question, your recommendation, the flag number.
  5. **What changed:** at most five one-line bullets, what a player will notice first.
  6. **Details:** one line pointing to the brief's Report and `CHANGELOG.md`.
- Numbers only where they matter, and never a table in a chat reply unless asked.
- **End every pull request description with the play link** on its own line: `Play this build: <link>`.
- **Draft until done.** Open your pull request as a **Draft** as soon as you push. Mark it **Ready for review** only when the build is finished, the Report is filled in and the checks pass. For the Editor, "not Draft" means "ready to merge".
- **Pull request titles:** `vX.YY.ZZ · NNN Lane · short name` for builds (e.g. `v3.06.00 · 007 Bot · Tune Brain 5`), `Docs · short name` for docs-only changes.
- **Start the description with "Before you merge:"**: the must-do checks first, then any optional ones, each one line.

## Keep messages short
The Editor glances; every extra line costs reading time and usage. Efficiency never at the cost of good work.
- Progress updates: one line, no narration. "Checking bot status." not "I am now going to check the bot's status by…".
- Don't restate the request or recap what you just did outside the report shape below.
- No long logs or tables in chat: link the file or the Report.

## The two channels (so the Editor never has to copy messages between chats)
- **Chat → Code: `briefs/`.** A design chat writes one brief per build (`briefs/NNN-short-name.md`, from `briefs/TEMPLATE.md`). The chat pushes each brief on its own branch, `brief/NNN-short-name`, and does not merge it. When the Editor says "Build brief NNN", start your build branch from that brief branch (fetch `brief/NNN-*` if `briefs/NNN-*.md` is not on `main`), so the brief, the build and the Report land in **one** pull request and the Editor merges once. Build only what the brief says. If something in it is unclear or conflicts with the code, stop and raise an `ASK` row in `FLAGS.md` rather than guessing.
- **Code → Chat: the brief's Report section and `FLAGS.md`.** When you finish a build, fill in the `## Report` section at the bottom of that brief, in the same pull request. Anything else Chat or the Editor must decide goes in `FLAGS.md` as a new row with status `ASK`. The chat reads both straight from GitHub.

## Commands from the Editor
One word, the same behaviour every time. The design chat keeps the full list in the Dev Handover; these are the ones for Code.
- **Build brief NNN:** start your branch from `brief/NNN-*` (any branch name your session may push to), build it, and open one pull request into `main`.
- **sync:** bring the latest `main` into your branch. If another pull request merged, take the next free game version (fix `version.js` and the changelog heading). Re-read `FLAGS.md`, say in a line what changed, carry on.
- **handoff:** stop cleanly. Commit and push. In the brief's Report, write what's done, what's left and any open `ASK`s. Then give a short message to paste into a new Code chat: its name (`FF [Lane] [vStart] - `), the branch, and the next step.
- **status:** what's done, what's running, what's left, and roughly how long. Five lines or fewer.

## Rules for the code
- `board/engine.js` is the rules and must stay free of screen code. Every rule lives behind a rule-set switch or a number in `data.js`.
- **Never change how an existing preset plays.** New rules go in a new preset (copy the latest, add switches). The newest preset is the last entry in `PRESETS`, which makes it the new-game default.
- **Old matches must replay identically.** Before proposing any engine change, run every check in `README.md`, including `regress_engine.js` against a copy of the board from before your change. Rule sets you didn't mean to change must print the same hash. Paste the hashes in the Report.
- Simulators take randomness from `board/tests/rng.js` (seeded mulberry32). Never write a home-made random generator.
- Report simulation results with tiebreak wins counted separately from KOs and draws. Say when a cause is likely but not isolated.
- Add a test for every rule you add or fix. A fix's test must fail on the old preset and pass on the new one.
- Every new Stamina modifier states its source, its effect and its worst-case stack; the floor check must pass on every card. (Standing rule, the Editor, 18 Nov.)
- **Bot minimum.** Every build that adds a unit, action or rule teaches the computer opponent to use it sensibly, as the brief's Bot minimum section says, and the Report proves it with numbers. Simulations are only evidence if the bot plays the feature.
- **Settings review on every brain build.** Any build that adds or tunes a brain ends its Report with a settings review:
  - **Useless settings:** change each setting up and down (and off). Any whose change moves results by less than the noise (F23) is listed as "no effect found", with the numbers. Don't delete it: it may matter under other rules or lineups. Retire it only when the Editor agrees.
  - **Missing settings:** situations where the brain keeps choosing badly and no existing setting fixes it. List each as an `ASK` in `FLAGS.md`, with the evidence (how often, an example game and turn) and the setting it suggests. Say plainly that this is harder to prove than the first list.

## Process
- Don't rerun slow simulations or the full checks locally for a change that doesn't touch the rules or the bot (docs, flags, screen text). Say in the Report what you skipped and why.
- Work on any branch your session may push to, started from the brief's branch. Never commit to `main` directly. Open a pull request and give the Editor the link.
- Don't invent rules the Editor hasn't agreed. List them as `ASK` rows instead.
- Keep `FLAGS.md` current: close the rows your build fixes, open rows for anything you found.
- **Game version (vX.YY.ZZ).** One game version is the reference for everything: rules, brains, UI and board. Each part keeps its own number (rule set v3.4, Brain 5, UI v1, Build N), and any change to any part bumps the game version:
  - **X:** a big new system (Cavalry, specials, a UI overhaul).
  - **YY:** a real change to any part (a new rule or mechanic, a new brain, a new screen). Reset ZZ to 00.
  - **ZZ:** tuning and fixes (numbers, brain settings, text, bug fixes).
  - Each brief states its game version in its header. The build sets it in `board/version.js` beside the build number. The board shows it on Home and in the menu, with the build number in small type ("v3.05.00 · Build 6"). It goes in the `CHANGELOG.md` heading. Keep a version table at the top of `CHANGELOG.md`, one row per game version: rule set, default brain, UI version, build. Always two digits after each dot.
  - History: v3.04.00 = rule set v3.4, Kit C default, UI v1, Build 5. v3.05.00 = Build 6 (brief 006, Brain 5 default).
- **Raise the build number.** Every build that changes `board/` raises the build number by one in `board/version.js` (the only place it is kept) and puts it in its `CHANGELOG.md` heading. The `checks` workflow fails a pull request that changes `board/` without raising it.
- **Keep `CHANGELOG.md` current.** Every build adds one entry at the top, in the same pull request: the brief number, the rule set it adds or changes, the date, then in plain language what a player will notice, what changed under the hood, which flags it closed, and the baseline table for rule changes. Create the file on the first build that finds it missing, starting with that build and a one-line entry for each earlier merged brief. Once the board shows a build number, put it in each entry's heading.
- The Game Laws, Dev Handover and Ideas Log live outside this repo and are kept by the design chat. Don't try to edit them. If the code and a brief disagree with each other, say so in the Report.

## The lab and results (Brief 008)
- **Where runs happen.** Simulations run on GitHub through the lab (`.github/workflows/lab.yml`), not in a Claude session. Write a job order in `studies/queue/` (format in `results/README.md`). Daytime `screen` runs (up to about 200 games per side) are for quick looks; anything at 1,000+ games per side goes overnight. A short check during a build is fine in the session.
- **Sweeps in two stages.** Screen every value at about 200 games per side. Confirm only the promising ones at 1,000+ overnight (F23).
- **Results.** Every run writes a folder in `results/` as `results/README.md` describes. Never put results anywhere else. Extend the structure by adding (a kind, a column, a field, a measure in `sims/lab/measures.js`), never by renaming.
- **Every simulated game can be watched.** The lab plays each game exactly as the board would (`board/watch.js`), from a board seed dealt by `tests/rng.js`. Keep it that way: `sims/lab/board_check.js` must pass.
- **Version at merge.** A brief states the version it expects. If another pull request merged first, take the next free number and fix `version.js` and the changelog heading.
- **Side by side.** Two builds may run in parallel unless one changes what the other measures or shows. Rule changes go one at a time. Branch from `main` (or the brief branch), never from another open pull request.
- **Branch names.** Use whatever branch the session may push to. Start it from the brief branch, and name it in the Report.
- **Checks vs scripts.** `board/tests/` keeps only pass/fail checks (`test_*.js`, `regress_engine.js`, `rng.js`). Scripts that play games and make results live in `sims/`.

## Pitfalls (things that went wrong before, and the guard)
| What happened | Guard |
| --- | --- |
| A stale "braced last turn" marker on the board misled the Editor about a unit's Stamina. | Everything shown on the board is drawn from the engine's state, never kept separately. |
| The simulators' home-made random generator repeated itself every 10,466 draws, so studies sampled far fewer games than claimed. | Simulators use `tests/rng.js` only; `test_rng.js` checks it. |
| The flag-holder fix shipped without re-running the outcome study. | Every rule change reports the baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on turn limit, pulls). |
| A kill step dragged a flag holder off its own flag (E1). | A brief that touches a rule lists the rules it interacts with; each gets a test. |
| A pooled flag and holder could fall early through rounding (E2). | Rounding is for display only; tests cover the half-point edges. |
| Project copies of the board drifted from the live board. | `main` is the only source of the board. |
| A likely cause was reported as proven. | Write "likely, not isolated" unless a controlled run isolates it. |
