# Flagfall Arena — playtest board

Flagfall Arena (working title) is a turn-based hex game that sits between a sport and a battle. Two squads defend one flag each. You win by knocking down the enemy flag, or by removing every enemy unit.

This repository holds the browser playtest board (rules engine and computer opponent), its tests, the simulation tools and the build briefs. The game's rules themselves are recorded in the **Game Laws**, kept outside this repository by the Editor.

## What is where

| Folder / file | What it is |
| --- | --- |
| `board/` | The playtest board. `engine.js` is the rules (no screen code). `data.js` holds the unit cards and the rule-set presets (match3, v1, v2, v3, v3.1). `bot.js` and `brain.js` are the computer opponent. `app.js`, `skin.js` and `index.html` are the screen. Open `index.html` in a browser to play. |
| `board/tests/` | Automatic checks (see below) and simulators. |
| `redteam/` | Probe scripts from the independent evaluation. They target rule set v3 on purpose, to show the bugs v3.1 fixed. |
| `data/` | Match 3's move log (used by the replay test), a summary of recorded human-vs-bot matches, and the v3.1 baseline simulation output. |
| `briefs/` | **Chat → Code.** One brief per build, numbered. Claude Code adds a `## Report` section to the brief it built. |
| `FLAGS.md` | **Code → Chat.** Numbered open issues, including questions Claude Code needs answered (`ASK`). |
| `CLAUDE.md` | Standing instructions for Claude Code. |

## How work flows

1. The Editor and Claude (in chat) agree a change and record it in the Game Laws.
2. Chat writes a brief in `briefs/`.
3. The Editor tells Claude Code: "Build brief NNN."
4. Claude Code builds on a branch, runs every check, fills in the brief's Report, updates `FLAGS.md`, and opens a pull request.
5. The automatic checks run on the pull request. The Editor merges only when they pass.

## Running the checks

From the `board/` folder, with Node.js:

```
node tests/test_rules.js
node tests/test_v1.js
node tests/test_v3.js
node tests/test_v31.js
node tests/test_rng.js
node tests/test_replay.js ../data/match3_log.txt
node tests/regress_engine.js <copy of the previous board folder> 3
```

`regress_engine.js` prints one hash per rule set. Run it on the board before and after a change: every rule set the change was not meant to alter must print the same hash.

Last full pass: 17 Nov 2026 (replay: 386 checks, 0 mismatches; match3, v1, v2 and v3 hashes identical to the previous board).
