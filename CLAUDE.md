# Instructions for Claude Code in this repo

## Who you're working with
- The project owner is **the Editor**. Always call them that, in chat, commits, briefs, reports, code comments and docs. Never write their real name or any personal detail (email, location, accounts) anywhere in this repository. This repository is public.
- The Editor has no coding experience and no budget beyond the Claude subscription (no paid services, hosting or tools).
- Explain changes in plain language: what a player will notice, not what the code does.
- The game's working title is **Flagfall Arena**.

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

## The two channels (so the Editor never has to copy messages between chats)
- **Chat → Code: `briefs/`.** A design chat writes one brief per build (`briefs/NNN-short-name.md`, from `briefs/TEMPLATE.md`). The chat pushes each brief on its own branch, `brief/NNN-short-name`, and does not merge it. When the Editor says "Build brief NNN", start your build branch from that brief branch (fetch `brief/NNN-*` if `briefs/NNN-*.md` is not on `main`), so the brief, the build and the Report land in **one** pull request and the Editor merges once. Build only what the brief says. If something in it is unclear or conflicts with the code, stop and raise an `ASK` row in `FLAGS.md` rather than guessing.
- **Code → Chat: the brief's Report section and `FLAGS.md`.** When you finish a build, fill in the `## Report` section at the bottom of that brief, in the same pull request. Anything else Chat or the Editor must decide goes in `FLAGS.md` as a new row with status `ASK`. The chat reads both straight from GitHub.

## Rules for the code
- `board/engine.js` is the rules and must stay free of screen code. Every rule lives behind a rule-set switch or a number in `data.js`.
- **Never change how an existing preset plays.** New rules go in a new preset (copy the latest, add switches). The newest preset is the last entry in `PRESETS`, which makes it the new-game default.
- **Old matches must replay identically.** Before proposing any engine change, run every check in `README.md`, including `regress_engine.js` against a copy of the board from before your change. Rule sets you didn't mean to change must print the same hash. Paste the hashes in the Report.
- Simulators take randomness from `board/tests/rng.js` (seeded mulberry32). Never write a home-made random generator.
- Report simulation results with tiebreak wins counted separately from KOs and draws. Say when a cause is likely but not isolated.
- Add a test for every rule you add or fix. A fix's test must fail on the old preset and pass on the new one.
- **Bot minimum.** Every build that adds a unit, action or rule teaches the computer opponent to use it sensibly, as the brief's Bot minimum section says, and the Report proves it with numbers. Simulations are only evidence if the bot plays the feature.

## Process
- Don't rerun slow simulations or the full checks locally for a change that doesn't touch the rules or the bot (docs, flags, screen text). Say in the Report what you skipped and why.
- Work on a branch named `build/NNN-short-name`. Never commit to `main` directly. Open a pull request and give the Editor the link.
- Don't invent rules the Editor hasn't agreed. List them as `ASK` rows instead.
- Keep `FLAGS.md` current: close the rows your build fixes, open rows for anything you found.
- **Keep `CHANGELOG.md` current.** Every build adds one entry at the top, in the same pull request: the brief number, the rule set it adds or changes, the date, then in plain language what a player will notice, what changed under the hood, which flags it closed, and the baseline table for rule changes. Create the file on the first build that finds it missing, starting with that build and a one-line entry for each earlier merged brief. Once the board shows a build number, put it in each entry's heading.
- The Game Laws, Dev Handover and Ideas Log live outside this repo and are kept by the design chat. Don't try to edit them. If the code and a brief disagree with each other, say so in the Report.

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
