# Brief 015 — Engine fixes from the flag rulings (rule set v3.6)

| | |
|---|---|
| Game version | Next free **YY** at merge (a new rule set: a real change), ZZ = 00. Expected v3.09.00 |
| Lane | Rules (also touches Bot and UI reasons) |
| Rule set | v3.6 (new preset: v3.5 plus switches `flagBlocksLine`, `pullFullStrength`, `pullCountsForReload`, `spearOnArrival`) |
| Date | 19 Nov 2026 |
| Goal | The board plays the flag rulings of 19 Nov (F8) that are locked in the Game Laws but not built |
| Branch | Any branch your session may push to, started from `brief/015-flag-rulings` |
| Flags | Closes the engine side of F8 (the special-attack side is in brief 011) |
| Order | **Can start now.** 009 and 010 are on main; nothing else is building. **Must merge before 011** (011 is written as rule set v3.7 on top of this), then 014 and 012 move up one (v3.8, v3.9) |

## Context
On 19 Nov the Editor locked four engine changes from the flag talks (F8). They are in the Game Laws, marked awaiting build: the flag blocks straight lines (4.9, 3.10, 3.11), a pull is always full Strength (4.6, 3.11), a pull counts as an attack for Reload (3.11, 4.6), and set spear punishes arriving, not staying (3.13). A fifth ruling, a Ranged unit that kills from an adjacent hex stays put (3.6), is already how the board plays: lock it in with a test only.

The two rulings about specials (warm-up counts a pull; no special on a flag) are in brief 011, not here: there are no specials on the board yet.

Where this brief and the Laws disagree, the Laws win: say so in the Report.

## Scope
In: preset v3.6 with four switches; the engine changes below; the reasons and previews that show them; the bot's own estimates following the new rules; the baseline, plus one run per switch with that switch off.
Out: anything about specials (brief 011); the turn-limit order without "fewer units lost" (2.7) and overtime (2.13 to 2.15), which get their own briefs; the fort rule against brace benefits on a flag (4.5, brief 012); Vault, Trample and Javelin (they don't exist yet: 4.9 names them, and the line helper below must be reusable for them); any change to v3.5 or older presets.

## What to build

### 1. Preset v3.6
A copy of v3.5 with the four switches below set to `true`. It becomes the newest preset (new-game default). Each switch also appears in the rule-set editor's switch list (`app.js`, next to `captureTriggersSpike`) with a one-line description.

### 2. The flag blocks the line (`flagBlocksLine`; Game Laws 4.9, 3.10, 3.11)
- Along the six straight lines of hexes, a flag hex, **held or empty, own or enemy**, blocks Volley and Reach: an attack may not pass over it.
- Blocked means: attacker and target lie on one straight hex line (in cube coordinates, one coordinate equal), and a flag hex is strictly between them. A shot whose path is not a straight line through the flag hex is never blocked, however close it passes.
- The attacker's own hex never blocks: a Ranged unit standing on its flag shoots out from it. The target's hex never blocks either. A Ranged unit in a goal zone can still shoot the holder next to it (4.5).
- **Reach:** the middle hex being a flag blocks it, exactly like an enemy in the middle hex today.
- Put the test in one named helper (for example `flagBetween(st, from, to)`) used by `canAttackFrom`, so Javelin (011) and Vault (012) can call the same helper later.
- `blockReasons` (and the attack options): when the only thing stopping an attack is a flag in the line, the reason reads `A flag blocks the line`. The Reach button's reason gains it too (`No enemy 2 hexes away in a straight line, with nothing in between` stays for the other cases).

### 3. A pull is full Strength (`pullFullStrength`; 4.6, 3.11)
`pullValue` stops halving for Ranged units: every pull starts from the card's full Strength, with an enemy adjacent or not. Pull Support and the keeper rule are unchanged. The pull preview and both brains pick this up through `pullValue`.

### 4. A pull counts as an attack for Reload (`pullCountsForReload`; 3.11, 4.6)
- A Heavy Ranged that pulls must reload: on its next turn it cannot attack or pull.
- On its Reload turn it cannot pull (today it can).
- Use the existing reload marker (`attackedThis` → `attackedLast`), so the board's Reloading chip and status already show it. Only the Reload limit changes: a pull still gives no Evade (6.5) and uses no parry.
- Reasons: the pull option disappears on a Reload turn; wherever the board explains a missing pull, it says `HR is reloading this turn` (`blockReasons` has no pull entry today: add one only if the board needs it to show the reason).

### 5. Set spear punishes arriving (`spearOnArrival`; 3.13)
Today `spikeCheck` fires whenever a unit enters any hex next to a braced, unused spear, including a shift or swap that stays in contact, and a unit can take a second spear on a later entry that turn. Under v3.6, as 3.13 says:
- A spear fires only on a unit that **was not next to that spear before the action and is now**, by any means: a move, a swap, an Evade step, taking a hex after a kill. (Trample comes with brief 012 and must use the same check.)
- A unit already next to that spear that comes to stand in another hex next to it **never** triggers it.
- Adjacency is judged spear by spear: a unit beside one spear that steps next to a second spear triggers the second.
- Each spear fires once per turn (as today), and **a unit takes set spear damage at most once per turn**, however many spears it arrives next to. Add a per-unit marker, cleared at the start of each turn.
- A spear the unit doesn't take (because it already took one this turn) stays loaded for the next unit to arrive.
- Judged at the hex the unit ends the action on, as today. Passing next to a spear partway through a multi-hex move does not trigger it (3.13 speaks of arriving; Vault's every-hex rule is brief 012's). If you read 3.13 as covering mid-move hexes, stop and raise an `ASK` rather than build it.
- A unit removed by the spear does not act (unchanged).

### 6. Ranged kill stays put (3.6): test only
No change: the board already keeps a Ranged unit in place after an adjacent kill. Add the test so no later build can break it.

## Rules it touches
Each becomes a test on v3.6 (`test_v36.js`, in `checks`), and each changed behaviour is also tested as unchanged on v3.5.
- Volley: blocked by a flag straight between, own and enemy flag, held and empty; not blocked off the straight line; not blocked from a unit standing on the flag; a goal-zone shot at the holder still legal; Volley over other units still legal.
- Reach: blocked by a flag in the middle hex; Reach rules otherwise unchanged (−1, never over an enemy).
- Pull: a Light Ranged and a Heavy Ranged with an enemy adjacent pull at full Strength; Support and keeper unchanged; pulls still give no Evade.
- Reload: Heavy Ranged pull → next turn no attack, no pull; Reload turn → no pull; the Reloading status shows after a pull.
- Set spear: fires on arrival by move, swap, Evade step and taking a hex; does not fire on a shift or swap that stays next to the same spear; fires on the second spear when shifting from one spear to another; a unit takes at most one spear a turn, and the untaken spear then hits the next arriving unit; a unit removed by the spear doesn't attack; spear damage unchanged (2, not reduced by Armor, 3.4).
- Ranged unit killing from an adjacent hex stays put; a melee unit still takes the hex.
- Double knockout: rerun the `test_v32.js` count on v3.6. Expect 0; report the number.

## Bot minimum
No new action. Both brains read legality from the engine (`options`, `canAttackFrom`, `pullValue`), but `bot.js` has its own threat estimates (for example `canThreaten` around line 55, and the pull threat around line 73). Under the v3.6 switches only, they must follow the same rules: a flag-blocked line is no threat, a reloading Heavy Ranged can't pull, a Ranged puller is worth full Strength. On every older preset the brains play exactly as before (hashes match).
- Prove it on v3.6: 200 seeded games per format (balanced 5v5, balanced 7v7), Brain 5 and Brain 6 each in mirrors: 0 refused actions, 0 brain errors, 0 unfinished games.
- Report pulls by Ranged units per game, v3.6 next to v3.5 (they now pull at full Strength, so the brain should pull with them more).
- Settings review: not a brain build, skipped.

## Measurements
On the lab, default brain, 1,000 games per format overnight, same seeds on every rule set:
- The full baseline table, v3.6 next to v3.5 (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), balanced 5v5 and 7v7.
- **One switch off at a time:** four sim-only copies of v3.6 (not presets, not on the board), each with one of the four switches off. Same games, same table. Four rule changes ship in one preset, and this run is how a shift can still be traced to one of them.
- Per game, v3.6 next to v3.5: set spear hits; attacks refused because a flag blocked the line (the bot's tried-and-refused count, or shots the engine's options dropped for that reason); pulls by Ranged units; Light units removed.
Reading rule (F23, closed by the Editor 19 Nov): a gap under about 4 points is never evidence at these sizes; compare rule sets on the same seeds first, with a second seed set as backup.

## Must not change
- Every existing preset, v3.5 included, plays and replays identically (paste the hashes).
- Every brain plays every existing preset exactly as before.
- Saved matches from older rule sets load and replay.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every preset before v3.6 match main.
- `test_v36.js` runs in `checks`; `test_invariants.js` covers v3.6.

## The Editor's hands-on check
One game on v3.6:
1. Put a Heavy Ranged on a straight line behind a flag: the shot across it is refused, and the reason reads `A flag blocks the line`.
2. Pull with a Ranged unit that has an enemy next to it: the pull preview shows full Strength.
3. Pull with a Heavy Ranged: next turn it shows Reloading and can neither attack nor pull.
4. Shift a unit along a braced Heavy Anti-Cavalry it's already touching: no spear damage.

## Report
*Filled in by Claude Code.*

- **What's in:**
  - **Preset v3.6** = v3.5 + `flagBlocksLine`, `pullFullStrength`, `pullCountsForReload`, `spearOnArrival`. It is the last preset, so the new-game default. All four switches are on the rule-set editor. Game version **v3.09.00, Build 12**.
  - **Flag blocks the line (4.9):**
    - One helper, `flagBetween(from, to)` in `engine.js`, exported so Javelin (011) and Vault (012) can use it. It returns true only when a flag hex (either side's) sits strictly between the two hexes on one of the six straight lines. A flag at either end never blocks.
    - `canAttackFrom` uses it for every attack from 2 hexes or more, which covers Volley and Reach.
    - When a flag is the only thing stopping a shot, `blockReasons` says "A flag blocks the line" for both Attack and Reach.
  - **Pulls at full Strength (4.6):** `pullValue` no longer halves Ranged units under the switch.
  - **A pull counts for Reload (3.11):** a pull sets the existing reload marker, so the Reloading chip and status show it. While reloading, `canPullFrom` and `doPull` refuse a pull ("… is reloading this turn"). A pull still gives no Evade and uses no parry.
  - **Set spear on arrival (3.13):**
    - `spikeCheck` takes the hex the unit stood on before the action and skips a spear it was already next to. That applies to moves, swaps (each unit separately), Evade steps and taking a hex after a kill.
    - A per-unit marker (`spearTaken`, cleared at every turn start) limits a unit to one spear a turn. A spear it doesn't take stays loaded for the next unit to arrive.
  - **Ranged kill stays put (3.6):** no change; locked with a test.
  - **The brains (`bot.js`), under the v3.6 switches only:**
    - `canThreaten` treats a shot across a flag from where the unit stands as no threat, unless it can step off that line.
    - A reloading Heavy Ranged is counted as unable to pull next turn.
    - Ranged pulls count at full Strength, in the flag-risk and siege estimates.
    - On every older preset the brains play exactly as before (hashes below).
- **Anything beyond the brief, and why:**
  - **Lab:** a matchup can switch rules off for a sim-only copy (`"switches_off": [...]`; those games are marked not replayable). That's the only way to run the four one-switch-off copies the brief asks for, without making them presets.
  - **Lab:** a new `flagrules` measure counts set spear hits, Ranged pulls, and (attacker, target) pairs a flag blocks at each side-turn start. The pairs are counted on every rule set, so v3.5 shows what v3.6 would block.
  - **Tests:** `test_v35.js`'s "newest preset" check moved to `test_v36.js`, as each earlier preset's did.
- **Checks run and results (paste regression hashes):**
  - `regress_engine.js <board before> 2 all` against this board: **all 90 lines identical** (every preset before v3.6 × every brain); v3.6 only adds lines.
  - Normal mode, before = after: `match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0 · v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250 · v3.5 fca989aecfaf21c9`.
  - v3.6 (all mode, 2 games): `standard 7cef7428821f4b6f · kitD 59bef5b405201ef0 · brain5 da8bf6315ff5ebca · brain6 30809624beccfebb`.
  - **`test_v36.js`** (new, in `checks`): 93 checks, 0 failures. Every rule in the brief's list is covered, each changed one also as unchanged on v3.5:
    - Volley over own and enemy, empty and held flags; off the straight line; out from a flag; at the holder from the goal zone; over other units.
    - Reach with the flag in the middle.
    - Light and Heavy Ranged full-Strength pulls; Support unchanged; no Evade after a pull.
    - Reload after a pull, and no pull on a Reload turn.
    - Spear on move, swap, Evade step and taking a hex; none on a shift or swap that stays next to the spear; the second spear after stepping from the first.
    - One spear per unit per turn, with the untaken spear hitting the next arrival; the marker clearing; a unit removed by a spear can't act.
    - A Ranged kill stays put; a melee kill takes the hex.
  - All the other quick checks pass locally, `board_check` included in CI. CI `checks` is green. The PR's release checks passed all 16.
  - **Double knockout on v3.6: 0** in 12,400 lab games (every v3.6 run and switch-off copy) plus `test_v36.js`'s own count.
- **Baseline table (rule changes only):** balanced, Brain 5 mirror, 1,000 games per format, same seeds (`results/v3.09.00/2026-11-19_study_flag-rulings-v35` and `-v36`). Tiebreak wins are counted apart.

  | | 5v5 v3.5 | 5v5 v3.6 | 7v7 v3.5 | 7v7 v3.6 |
  |---|---|---|---|---|
  | Holder KO | 3.6% | 3.7% | 4.3% | 4.4% |
  | Pull KO | 26.7% | 26.3% | 38.3% | 38.3% |
  | TKO | 13.3% | 13.3% | 12.6% | 12.5% |
  | Tiebreak win | 54.1% | 54.4% | 41.1% | 41.1% |
  | Draw | 2.3% | 2.3% | 3.7% | 3.7% |
  | Ended on the turn limit | 56.4% | 56.7% | 44.8% | 44.8% |
  | Games with a pull | 26.8% | 26.4% | 38.5% | 38.5% |
  | Average turn | 19.20 | 19.23 | 22.84 | 22.84 |
  | First mover's share of decisive | 38.5% | 38.6% | 46.7% | 46.9% |
  | Set spear hits per game | 0.033 | 0.032 | 0.028 | 0.027 |
  | Ranged pulls per game | 0.013 | 0.012 | 0.009 | 0.018 |
  | Shots a flag blocks (pairs per game) | 0.02 | 0.02 | 0.04 | 0.04 |
  | Light units removed per game | 3.74 | 3.74 | 5.58 | 5.58 |

  - **One switch off at a time** (sim-only copies of v3.6, same seeds), turn-limit share and Ranged pulls per game:
    - 5v5: line off 56.5% / 0.014; full-Strength pull off 56.7% / 0.011; pull Reload off 56.7% / 0.012; spear on arrival off 56.6% / 0.012.
    - 7v7: 44.8% / 0.018; 44.8% / 0.008; 44.7% / 0.021; 44.9% / 0.018.
    - Every other outcome is within 0.3 points of v3.6.
  - **Reading (F23: under about 4 points is never evidence):** no outcome moved. The four rules rarely come up in bot play: a set spear fires about once in 30–35 games, a Ranged unit pulls about once in 50–100 games, and a flag stands in a firing line about once in 25–50 games.
  - The one visible effect is at 7v7: Ranged pulls double with full-Strength pulls (0.009 → 0.018 per game; 0.008 with that switch off), and pull Reload trims them a little (0.021 with it off). That's likely the full-Strength rule, isolated by the switch-off run, but the counts are tiny.
- **Bot minimum (met / not met, with numbers):** **met.**
  - On v3.6: Brain 5 mirrors 2,000 games (study) and Brain 6 mirrors 400 games (200 per format), with 0 refused actions, 0 brain errors, 0 safety stops and 0 unfinished games. The four switch-off copies (8,000 games) also had 0.
  - Ranged pulls per game, v3.5 → v3.6: 5v5 0.013 → 0.012, 7v7 0.009 → 0.018.
  - Thinking time, Brain 5, average per side-turn (worst turn): 5v5 51 ms (0.92 s) → 53 ms (0.93 s); 7v7 130 ms (3.49 s) → 136 ms (3.58 s).
- **Settings review:** not a brain build; skipped.
- **Known gaps:**
  - **Readings of 3.13 I built** (F37, `ASK`):
    - Arrival is judged from the hex before the action to the hex after it. So stepping away from a spear and back in one move isn't an arrival, and neither is a unit already beside a spear when it braced.
    - I didn't treat mid-move hexes as arriving, as the brief said.
  - **Few situations:** the bots rarely put themselves into any of these four, so this build's numbers can't say whether the rules matter in human play. The hands-on check is the real test.
  - **Lab measures:** 015's runs carry no stall columns, because brief 016 (#28) wasn't merged when they started.
- **Flags closed / opened:** closed **F8** (the engine side; the special-attack rulings are in brief 011). Opened **F37** (the 3.13 reading).
- **Pull request:** #27, branch `claude/charming-lovelace-4tx3p7`, started from `brief/015-flag-rulings`.
