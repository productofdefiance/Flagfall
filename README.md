# Flagfall Arena — playtest board

Flagfall Arena (working title) is a turn-based hex game that sits between a sport and a battle. Two squads defend one flag each. You win by knocking down the enemy flag, or by removing every enemy unit.

This repository holds the browser playtest board (rules engine and computer opponent), its tests, the simulation tools and the build briefs. The game's rules themselves are recorded in the **Game Laws**, kept outside this repository by the Editor.

## What is where

| Folder / file | What it is |
| --- | --- |
| `board/` | The playtest board. `engine.js` is the rules (no screen code). `data.js` holds the unit cards and the rule-set presets (match3, v1, v2, v3, v3.1, v3.2, v3.3, v3.4). `bot.js` and `brain.js` are the computer opponent. `app.js`, `skin.js` and `index.html` are the screen. `version.js` holds the build number (the only place it is kept). Open `index.html` in a browser to play, or use the play links below. |
| `board/tests/` | Automatic checks (see below) and simulators. |
| `redteam/` | Probe scripts from the independent evaluation. They target rule set v3 on purpose, to show the bugs v3.1 fixed. |
| `data/` | Match 3's move log (used by the replay test), a summary of recorded human-vs-bot matches, and the baseline simulation output (v3.1 in `sim_study6`, v3.2 in `sim_study7`). |
| `briefs/` | **Chat → Code.** One brief per build, numbered. Claude Code adds a `## Report` section to the brief it built. |
| `FLAGS.md` | **Code → Chat.** Numbered open issues, including questions Claude Code needs answered (`ASK`). |
| `CLAUDE.md` | Standing instructions for Claude Code. |
| `CHANGELOG.md` | One entry per build, newest first, in plain language. |

## How work flows

1. The Editor and Claude (in chat) agree a change and record it in the Game Laws.
2. Chat writes a brief in `briefs/`.
3. The Editor tells Claude Code: "Build brief NNN."
4. Claude Code builds on a branch, runs every check, fills in the brief's Report, updates `FLAGS.md`, and opens a pull request.
5. The automatic checks run on the pull request. The Editor merges only when they pass.

## Play links

- `main`: https://productofdefiance.github.io/Flagfall/
- Each open pull request: `https://productofdefiance.github.io/Flagfall/pr/<number>/` (also the last line of its description). It's removed when the pull request closes.

The `play-links` workflow publishes these to the `gh-pages` branch. GitHub Pages must be switched on once: Settings → Pages → Source: Deploy from a branch → `gh-pages` / root → Save.

## Running the checks

From the `board/` folder, with Node.js:

```
node tests/test_rules.js
node tests/test_v1.js
node tests/test_v3.js
node tests/test_v31.js
node tests/test_v32.js
node tests/test_v33.js
node tests/test_v34.js
node tests/test_stamina.js
node tests/test_reasons.js
node tests/test_kitd.js
node tests/test_brain5.js
node tests/test_invariants.js
node tests/test_rng.js
node tests/test_replay.js ../data/match3_log.txt
node tests/regress_engine.js <copy of the previous board folder> 3
```

`regress_engine.js` prints one hash per rule set, leaving out only the newest preset. Run it on the board before and after a change: every rule set the change was not meant to alter must print the same hash.

`test_v32.js` ends with a double-knockout count over 400 bot games at 7v7 and 400 at 5v5, spread over the computer's processor cores (about 15 minutes on 4 cores; up to 35 on GitHub). Give it a smaller number to try it quickly, e.g. `node tests/test_v32.js 20`; the full check is the default.

`test_stamina.js` checks the Stamina model (Brief 013): base Stamina per card, next-turn modifiers, and the floor check, which tries every combination of the shipped modifiers on every card of every preset (add `--worst` to print each card's worst case).

For a build that must not change play at all, `node tests/regress_engine.js <board folder> 2 all` also hashes the newest preset and prints one hash per rule set and brain (every brain, Brain 5 included). Run it on the board before and after: every line must match.

`test_invariants.js` plays 30 bot games on the newest preset and fails on any impossible state.

On GitHub, `checks` runs the quick set on every pull request, in parallel jobs, in a few minutes. `test_v32.js` runs there with a short count (`node tests/test_v32.js 40`). The `night-checks` workflow runs the full 400 + 400 count and 100 impossible-state games every night at 08:07 UTC. It can also be started from the Actions tab (night-checks → Run workflow), or by giving a pull request the label `full checks`. A failing night run opens a "Night checks failed" issue. A pull request that changes `board/` must raise the build number in `board/version.js`.

Last full pass: 17 Nov 2026 (replay: 386 checks, 0 mismatches; match3, v1, v2 and v3 hashes identical to the previous board).
