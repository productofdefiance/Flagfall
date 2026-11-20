# Brief 020 — Victory values: finishing is worth more than winning on the clock

| | |
|---|---|
| Game version | Next free **YY** at merge (a new brain is a real change), ZZ = 00 |
| Lane | Bot (with new Lab measures) |
| Rule set | none (bot only; no rule change). Measured on the newest rule set on `main` at build time (v3.7, specials), if Brain 7 plays specials there; otherwise on v3.6. Say which in the Report |
| Date | 2026-11-20 |
| Goal | A brain that scores each way a game can end by the Editor's values (finish 3, win on the clock 1, draw 0, loss −1), so it presses to finish when the odds favour it, and a test of whether "any loss −1" makes a beaten side give up its flag |
| Branch | Any branch your session may push to, started from `brief/020-victory-values` |
| Flags | Evidence for F10 (stalls). Builds on brief 019 (Brain 7) and brief 016's stall columns |
| Waits on | 011, 019 |
| Order | **After briefs 011 and 019 are both merged** (it builds on Brain 7 and is measured with specials). No rule change, so it does not wait for the rules chain (014, 017, 018, 012) |

## Context
Today every brain scores a finished game the same way: `value5` returns +100,000 for any win and −100,000 for any loss (`board/bot.js`), so a full pull and a win on the turn limit are worth the same. Watched game R28X-AJDH-DUP5 (7v7, v3.7, Brain 5 mirror) shows the result: South leads 3 to 1 by turn 10 and 2 to 1 from turn 14, nobody attacks for the last 22 turns, its holder never leaves its flag, and it wins on flag damage at the limit. Under the rules a quiet lead wins, so sitting is safe.

The Editor's values (Ideas Log, Computer opponent: "Victory ranking for bots", 20 Nov, undecided; bots only, not a rule):

| Ending | Value |
|---|---|
| Win by full pull (pull KO), holder KO or TKO | **+3** |
| Win at the turn limit on flag damage (Game Laws 2.7 a) | **+1** |
| Draw | **0** |
| Loss at the turn limit | **−1** |
| Loss by full pull, holder KO or TKO ("finished") | **−1**, tested against **−2** |

From a quiet lead, pressing risks 2 (1 to −1) to gain 2 (1 to 3), so a brain on these values presses exactly when pressing makes a finish more likely than a loss. The Editor's hunch: if being finished costs no more than losing on the clock (−1), a side that is beaten on flag damage loses nothing more by being finished, so it may stop guarding its flag and hand the leader a cheap +3. At −2 it should defend, but the leader also becomes more careful (a counter-finish now costs 3), which can bring the stall back. He wants the numbers before he picks.

Two readings of the rules, already locked:
- **"Fewer units lost" is gone** (Game Laws 2.7, locked 19 Nov, awaiting build): level on the flag at the limit is a draw. The board still scores "turn limit, fewer beings lost" as a win. The brain values that ending as a **draw (0)**, as the Law reads. Result tables report the board's own result as usual, and also the points as the brain values them (see Measurements).
- **Overtime** (2.13) is not built, and bot-only matches skip it anyway: a level game is a draw.

## Scope
In:
- **Brain 8** (`brain8`, short form Br8, "Brain 8 (plays to finish)" on screen): a copy of Brain 7 with victory values. With victory values off, Brain 8 plays exactly like Brain 7 (same `sims/brainhash.js` hash).
- New lab measures (below), in `sims/lab/measures.js` so every run carries them.
- The runs below and the settings review.

Out:
- Any rule change. These values are the bot's taste, not a scoring rule for players.
- Points, XP, rewards or leaderboards for players (none exist yet; these values are the stand-in until they do).
- Changes to Brain 7's five behaviours or its `stormLead`. Brain 8 keeps whatever 019's review set; report whether `stormLead` still does anything once victory values are on.

## What to build
1. **Copy Brain 7 as Brain 8.** Brains 5, 6 and 7 stay frozen.
2. **Victory values as settings** in `BRAIN_8.victory` (plain labels on the Opponent screen): `finish` 3, `clockWin` 1, `draw` 0, `clockLoss` −1, `finished` −1, plus an on/off switch. Every number lives in the brain, not in the engine.
3. **Finished games are scored by these values.** Where `value5` returns ±1e5 for a finished game, Brain 8 returns the value of that ending times one big scale (so a finished game still outweighs any position, and a finish still outranks a clock win).
4. **Unfinished positions look ahead to how the game will end.** A one-turn planner rarely sees the end, so the values must also shape play before it. The intent: near the turn limit, a position is worth more the more likely it ends in a finish for us, and less the more likely it ends in a finish against us, weighted by the values above. Suggested way in (Code may find a better one): reuse Brain 6's `clockNear` and `tiebreakOutlook` for the likely clock result, and `flagPotential` both ways (plus Brain 7's lead) for the chance of a finish, then add a term `endWeight × clockNear × (expected value of the ending)`. Report what was built and why. Stateless, as Brains 5 to 7: worked out from the board as it stands, nothing carried between turns, so replays stay exact.
5. **Watchable.** Every tested setting must replay from its watch link (standing rule: record every set-up difference). Either record Brain 8's victory settings in the watch link and the lab's game record, or add the −2 variant as its own named brain on the board (`brain8b`). Say which.

## Rules it touches
None change. Brain 8 must model these correctly and pick only legal actions: the turn limit and the board's tiebreak (2.7, and the reading above), the pooled flag and holder (4.2 to 4.6), the flag block (4.9), specials (6.16, 6.17) if measured on v3.7, Mark (3.8), tackle (6.6), Evade (6.5), set spear (3.13), Command, Stamina, Brace, Support and pulls.

## New lab measures
Name the columns as below, or say in the Report what changed and why. "Behind" and "ahead" here mean flag damage (the board's first tiebreak step), read at the start of a side-turn.
1. **`late_behind_side`, `late_behind_finished`**: at limit − 5 turns, the side behind on flag damage, if any; 1 if that side then lost by full pull, holder KO or TKO (it was finished), else 0. Also `late_behind_comeback` (it won or drew).
2. **`late_guard_n/s`**: average number of a side's non-holder units in or next to its own goal zone, over its side-turns in the last 5 turns, split by whether it was behind, level or ahead on flag damage at that turn (`late_guard_behind_*`, `_level_*`, `_ahead_*`). This is the "stops guarding" reading.
3. **`late_ahead_side`, `late_ahead_attacks`, `late_ahead_result`**: at limit − 5, the side ahead on flag damage; its attacks and pulls per side-turn over the last 5 turns; and how it ended (finished the enemy, won on the clock, drew, lost).
4. **`points_n/s`**: each side's points by the Editor's table (with "fewer beings lost" scored as a draw), with `finished` at −1. Tables show average points per side and the share of games won by a finish.

Work out measures 1 to 4 for the Brain 7 baseline run below. Check each by hand on two saved games (one where the event happens, one where it doesn't).

## Measurements
All with `tests/rng.js`, tiebreak wins counted separately, balanced lineups, same seeds across arms. Screen first at about 200 games per side, then confirm overnight at 1,000 per format (F23). A gap under about 4 points is never evidence.
- **Three arms, mirrors, balanced 5v5 and 7v7:** (A) Brain 7 as merged (victory values off); (B) Brain 8 with `finished` −1; (C) Brain 8 with `finished` −2.
- **For each arm:** the full baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), brief 016's stall columns, brief 019's `lead_lost` and `lead_unused`, and the four new measures.
- **Head-to-head:** B against A and C against A, 1,000 games per format, sides and move order swapped half the time. Report win share and also points per game by the Editor's table: B or C may win fewer games but score more points, and that is the trade the Editor is choosing.
- **The hunch, in one table:** for B and C side by side, `late_behind_finished`, `late_guard_behind`, and `late_ahead_attacks`. The hunch holds if the beaten side is finished clearly more often (4+ points) and guards less under −1 than under −2. The counter-risk holds if C's leader attacks less than B's and C ends on the turn limit more often.
- **The test game:** replay seed R28X-AJDH-DUP5 (7v7, the board's v3.7 setup) with Brain 7, Brain 8 at −1 and Brain 8 at −2 on both sides. Give the three watch links, and say whether South finishes.
- **Speed:** average and worst time per turn next to Brain 7's. Flag it if the worst turn rises above 4.6 s. Any search cap counts plans examined, never seconds (F24).

## Bot minimum
This build is the bot work. It is met when every measurement has a number and these five test positions pass, each showing the model's reasoning:
1. **Press.** Two turns from the limit, ahead 2 on flag damage, enemy holder alone with a small pool, two of our units able to attack it this turn: Brain 8 attacks; Brain 7 may hold.
2. **Hold.** Same lead, but the only attack leaves our unit likely to be removed and gives the enemy a pull that would level the flag, with a low kill chance: Brain 8 holds.
3. **Level.** Level on the flag near the limit with a material lead: Brain 8 presses (a draw is 0).
4. **Guard (the hunch).** Behind on flag damage near the limit, the enemy able to finish us next turn if our goal zone is empty: with `finished` −2, Brain 8 keeps a guard; report what the −1 setting does in the same position.
5. **Off is Brain 7.** With victory values off, Brain 8's hash matches Brain 7's.

## Must not change
- Every existing preset plays and replays identically.
- Brains 5, 6, 7, Kit A–D, Standard and Easy play exactly as before (`sims/brainhash.js` hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board; `sims/brainhash.js` hashes for every existing brain match.
- Brain 8 with victory values off hashes the same as Brain 7.
- Brain 8 never picks an illegal action over 30 seeded games per format, balanced and all-Light.
- The new measures checked by hand as above.

## The Editor's hands-on check
1. Watch the three R28X-AJDH-DUP5 links. Does South finish the game with Brain 8?
2. Watch one Brain 8 mirror at 7v7 for each `finished` value (the Report picks one where a side falls behind late). Does the beaten side still guard its flag?
3. Play one balanced 7v7 against Brain 8. Get ahead on flag damage and sit: does it come for you? Fall behind: does it press to finish?

## Report back
The standard Report, every measurement, the hunch table and the test game. In plain words:
- Does the brain press to finish when it leads, and does it stall less than Brain 7?
- The hunch: at −1, does a beaten side give up its flag? Does −2 fix it, and what does −2 cost (a more careful leader, more turn-limit games)?
- Points versus wins: does playing to finish win fewer games but score more by the Editor's table?
- Does `stormLead` still matter once victory values are on?
Say whether each cause is isolated or only likely.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a (no rule change); the measurements above instead
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
