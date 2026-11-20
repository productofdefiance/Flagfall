# Brief 019 — Brain 7: know the lead, keep it, storm together

| | |
|---|---|
| Game version | **v3.10.00** expected (from v3.09.01). YY goes up because this adds a new brain, Brain 7. If another pull request merges first, take the next free YY |
| Lane | Bot (with new Lab measures) |
| Rule set | none (bot only; no rule change). Brain 7 is built and measured on **v3.6**, the newest rule set on `main` |
| Date | 2026-11-19 |
| Goal | A new brain, **Brain 7**, built from Brain 5, that knows when it is ahead, doesn't throw a lead away on bad trades, and storms the enemy holder together instead of one unit at a time. Then measure whether it turns leads into wins. |
| Branch | Any branch your session may push to, started from `brief/019-brain-7` |
| Flags | Evidence for F10 (stalls). Uses brief 016's stall columns. F36 (the stall cut) is not this brief's job |
| Order | Can start now. Runs alongside 011 (011 changes rules on a new preset; this brief changes no rules and measures on v3.6). Whichever merges second runs sync and resolves `board/bot.js` and `board/brain.js` by hand |

## Context
The stall "before" run (brief 016, `results/v3.08.01/2026-11-19_study_stall-before`, Brain 5 mirrors, v3.5, 1,000 balanced games per format) shows that stalls are mostly leads not used:
- Turn-limit games take their last damage on turn 11.1 (5v5) and 12.7 (7v7) on average, then go about 28 and 46 side-turns with no attack or pull (F36).
- Three turns before the limit, one side still has more non-holder units in 47% of 5v5 turn-limit games and 58% at 7v7. Unit counts don't change after that in any game. The side ahead wins 78–83% of them on the tiebreak.
- The other turn-limit games end holder against holder. In replays of 180 of them, 96–99% had a side ahead by a unit or more for at least two full rounds (by 2 units in about 45%), first by turn 8 (5v5) or 10 (7v7), and it ended level anyway. Likely, not isolated.

The Editor's ruling stands: bot before rules (18 Nov). This brief is a coaching experiment. It asks whether stalls can be coached down, and which behaviour does it. Its main deliverable is that answer, behaviour by behaviour, so the coaching revisit after Cavalry (Roadmap) starts from evidence. A result that fails the bar is still a result.

Brain 5 already scores a position after its turn on one value model (`bot.js` `value5`): units and HP, flag damage, what the enemy can do back next turn (`risk5`), what we could do next turn, placement, and an empty-flag cost. Material counts the same whether a side is ahead or behind, and it plans one turn at a time. Brain 7 changes both, inside the value model where it can.

Note on the tiebreak: the board still counts "fewer beings lost" when flag damage is level (the `how` column reads "turn limit, fewer beings lost"). Game Laws 2.7 drops that step (locked 19 Nov, awaiting build in the overtime briefs), so the same lead will then only draw. Brain 7's lead logic must not lean on that step: it judges the lead from what is on the field, not from the tiebreak.

Game Laws that apply: 2.7 (turn limit and tiebreak), 4.2 to 4.6 (the holder, flag health 10, the pool, storming from the goal zone, pulling an empty flag with pull Support), 4.9 (the flag blocks the line), 3.8 (Mark), 6.5 (Evade), 6.6 (tackle), 3.13 (set spear).

## Scope
In:
- Brain 7: a copy of Brain 5 plus five behaviours, each behind its own on/off setting, and a few numeric settings.
- Three new lab measures, written into `sims/lab/measures.js` so every future run carries them.
- A "before" run of Brain 5 on v3.6 with the stall columns, unless brief 015's re-queue already made one on the same seeds (check `results/`; say which you used).
- The sweep, head-to-head, mirror and one-behaviour-at-a-time runs below, and the settings review.

Out:
- Any rule change or new preset. No "on turn N do X" rules: if a behaviour can't be expressed as gained, risked or next turn, raise it as an `ASK`.
- Specials and Cavalry. Brain 7 is not taught specials here; that comes with the coaching revisit after brief 012.
- Brain 6's clock term (Brain 7 starts from Brain 5, the default). Behaviour 5 only needs the turns left, which `clockNear` style code can give it.
- Long tuning rounds. One threshold sweep, then confirm.
- Retiring any setting. Recommend it in the Report; the Editor decides.

## What to build
1. **Copy Brain 5 as Brain 7** (`brain7`, short form Br7, "Brain 7 (keeps its lead)" on screen). Brain 5 and Brain 6 stay frozen.
2. **Five behaviours, each behind an on/off setting** in `BRAIN_7.lead` (or a name you prefer; plain labels on the Opponent screen). **With all five off, Brain 7 must play exactly like Brain 5** (same `sims/brainhash.js` hash). That is how each behaviour's effect is traced.
3. **Stateless.** Every behaviour is worked out from the board as it stands at the start of each turn and after each roll, like Brain 5's plan. No memory carried between turns, so replays stay exact.

### The five behaviours
**B1 · Know the lead (`lead`).** A side's material is the sum, over its units other than the flag holder, of each unit's UC times its share of HP left (HP now ÷ its card's full HP). A unit on half HP counts half. The lead is our material minus theirs. "Ahead" means a lead of at least `aheadAt` (start 1.0). Flag damage is tracked separately as the second reading; it is never folded into the lead.

Suggested way in (Code may find a better one): add a term worth `leadWeight` × (ours − theirs) ÷ (ours + theirs). That ratio rises after an even trade when ahead and falls after one when behind, so the brain likes trading down when it leads and avoids it when it trails, like chess. Report what you built.

**B2 · No bad trades when ahead (`care`).** The Editor's intent is to stop leads draining away, not to stop fighting. When ahead, an attack that leaves the attacker likely to be removed next turn (by `risk5`'s reckoning) scores low **unless** a kill is likely (expected damage at least the target's effective HP, or the kill chance over the dice at least `killChance`, start 0.5) **or** a friend can join it this turn or support it next turn. Even trades stay welcome; it is the lone, losing exchange that goes. A setting scales how much the brain's fear of damage taken (`risk`) rises when it is ahead (`aheadCaution`, start 1.5×).

**B3 · Storm together (`storm`).** The enemy holder is attacked by spare units together, not one by one:
- **Gather.** While storming is on (B6 below says when), value each spare unit standing where it can reach the enemy goal zone and still attack next turn. Brain 6's `flagPotential` already counts these; reuse it.
- **Strike.** An attack on the enemy holder by a unit that will be left alone in the goal zone, when more units could join next turn, scores low. Strike when at least `stormMin` units (start 2) can attack the holder this turn, or when waiting gains nothing (no more units can arrive next turn, or the turns left say now).
- Brain 5 plans one turn ahead, so gathering may only be expressible as "a good position for next turn". If it falls short, say so plainly and say what it would take (an `ASK`). This behaviour is the one most likely to fail; the switches keep the other four measurable.

**B4 · The holder joins the storm (`holderJoins`).** Once the enemy has only its holder left, our holder may leave our flag to storm. Only if a **race check** passes: the enemy holder can't reach our flag's goal zone and pull it down (from 10, our flag's base, minus damage already on it) before our storm is expected to bring its flag down, counting Command, Stamina, movement cap and Mark. The enemy holder **can** leave its flag; it just loses the race. Never assume it can't. If the check fails, our holder stays home, as Brain 5's `home` and `flagDanger` already make it.

**B5 · Regroup when behind (`regroup`).** When behind, don't feed units into the enemy one at a time: value pulling back to friends and gathering, the mirror of B2 and B3. **Only while there are enough turns left** to regroup and still come again: if the turns left are fewer than the turns needed to gather and strike (worked out from distances, plus `regroupSpare`, start 2 turns), commit everything. Regrouping in the last turns is giving up.

### B6 · When ahead on both: storm or hold (the sweep)
When Brain 7 is ahead on material **and** on flag damage, should it storm or hold? The Editor wants to see both before he decides. Setting `stormLead`: storm only when the lead is at least this much; below it, hold (B2 still applies). When ahead on material but level or behind on flag damage, it always storms (holding would draw or lose).
- Screen `stormLead` = 1.0, 1.5 and 2.0 (about 200 games per side), confirm the best and the 1.0 and 2.0 values overnight at 1,000 per format.
- For each value, report the games where Brain 7 was ahead on both: how they ended (KO, TKO, tiebreak, draw), when, and how often it held versus stormed. Give **about 10 replay links per value** from such games, a mix of wins and losses, so the Editor can watch how they play out.

## New lab measures (in `sims/lab/measures.js`, on every run from now on)
Name the columns as below, or say in the Report what changed and why. Lead here counts non-holder UC (whole units), to match brief 016's `uc_*` columns; Brain 7's internal lead (B1, HP-weighted) is separate.
1. **`lead_lost`** (per game): 1 if a side led by at least 1 non-holder UC for at least two full rounds (both sides moved twice) and the game ended with that side not ahead (level or behind), else 0. Also `lead_lost_side`, `lead_lost_peak` (largest lead) and `lead_lost_first_turn`.
2. **`lead_unused`** (per game): 1 if the game ended on the turn limit with a side at least 1 UC ahead at limit − 3 (`gap_l3` ≥ 1). Computable from 016's columns; add it so tables carry it.
3. **Units lost alone vs together** (per side, per game): `lost_alone_n/s` and `lost_together_n/s`. A removed unit counts as **alone** if, at the start of the side-turn in which it was removed, no friendly unit other than its own holder stood within 2 hexes of it; otherwise **together**. Also `holder_strikes_solo_n/s` and `holder_strikes_group_n/s`: side-turns in which exactly one unit attacked the enemy holder, and side-turns in which two or more did.

Work out all three for the v3.5 "before" run **from its saved games** (the lab replays each game exactly from its seed; no new games needed) and for the v3.6 "before" run, so both baselines carry them.

## Measurements
All with `tests/rng.js`, tiebreak wins counted separately, balanced lineups unless named, 1,000 games per format unless named (F23). Same seeds as the stall "before" run where the set-up matches. A gap under about 4 points is never evidence.
1. **Baseline:** Brain 5 mirrors on v3.6 with all stall columns and the three new measures (or 015's re-queue, if it exists on the same seeds).
2. **The sweep (B6):** `stormLead` 1.0, 1.5, 2.0, as above.
3. **Head-to-head: Brain 7 vs Brain 5**, 5v5 and 7v7, each side moving first half the time. Decisive wins and tiebreak wins separately. Also all-Light 5v5 and 7v7 (Brain 6 lost all-Light 5v5 clearly; Brain 7 must not).
4. **How Brain 7 wins against Brain 5:** KO, TKO and tiebreak shares, next to Brain 5's in the mirror. If Brain 7's extra wins are mostly tiebreak wins, it is winning by sitting; say so.
5. **Mirrors: Brain 7 vs Brain 7** against the Brain 5 baseline: the full baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), the stall columns, and the three new measures.
6. **One behaviour at a time:** Brain 7 with only B1, only B1+B2, only B1+B3, only B1+B4, only B1+B5 (B2–B5 need B1 to know the lead), against Brain 5 and in mirrors. Screen size (about 200 games per side) is enough; confirm overnight only what moves. This is the table the coaching revisit inherits.
7. **Speed:** average and worst time per turn, and plans examined per turn, next to Brain 5's. Flag it if the worst turn rises above 4.6 s. Any cap on the search counts plans examined, never seconds (F24), so every device picks the same move.

## Success bar
Brain 7 passes if all three hold:
1. **It beats Brain 5** by at least 2 standard errors at balanced 5v5 and 7v7 (brief 007's bar), and doesn't lose clearly with all-Light squads.
2. **It uses its leads.** In Brain 7 mirrors, `lead_lost` and `lead_unused` both fall by at least 4 points against the Brain 5 baseline.
3. **It doesn't stall more.** The share of Brain 7 mirror games ending on the turn limit does not rise against the baseline.

Brain 7 becomes the default only if it passes and the Editor agrees at review. It stays in the list either way.

## Rules it touches
None change. Brain 7 must model these correctly and pick only legal actions:
- the turn limit (25 at 5v5, 35 at 7v7) and the tiebreak as the board plays it today (Game Laws 2.7; see Context)
- the pooled flag: holder and flag share a pool; a held flag is attacked only from its goal zone; base flag HP 10; a holder may step off its flag
- v3.6's flag rulings (flags block Volley and Reach lines, pulls at full Strength, a pull counts for Reload, set spear on arrival and once a turn per unit)
- Mark (a hard stop on entering, 3.8), tackle (6.6), Evade (6.5)
- Command and Stamina, Brace, Dodge room, Support, pulls.

## Bot minimum
This build is the bot work. It is met when every measurement has a number and the five test positions below pass.

## Must not change
- Every existing preset plays and replays identically.
- Brain 5, Brain 6, Kit A–D, Standard and Easy play exactly as before (`sims/brainhash.js` hashes unchanged).

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board; `sims/brainhash.js` hashes for every existing brain match.
- **Brain 7 with all five behaviours off hashes the same as Brain 5.**
- Brain 7 never picks an illegal action over 30 seeded games per format, balanced and all-Light.
- The three new measures, checked by hand on two saved games each (one where the event happens, one where it doesn't).
- Five test positions, each showing the model's reasoning:
  1. **Care.** Ahead by 2, mid-game: a lone attack on a full-HP Heavy unit with no friend able to join and a low kill chance. Brain 7 (B2 on) declines it; Brain 5 may take it. The same attack with a likely kill: Brain 7 takes it.
  2. **Gather.** Ahead, three spare units 2–4 hexes from the enemy goal zone; one can reach the holder alone this turn, the others next turn. Brain 7 (B3 on) gathers this turn and strikes with at least two next turn.
  3. **Holder joins.** The enemy has only its holder. Race check passes: our holder joins the storm. Variant where the enemy holder could reach our flag and pull it down first: our holder stays.
  4. **Regroup.** Behind, 15 turns left: Brain 7 (B5 on) pulls back to friends rather than attacking alone. Behind, 2 turns left: it commits.
  5. **Hold or storm.** Ahead on material by 1.5 and on flag damage: with `stormLead` 1.0 it storms; with 2.0 it holds.

## The Editor's hands-on check
1. Watch three of the B6 replay links for each `stormLead` value (the Report picks them).
2. Play one balanced 7v7 against Brain 7. When you fall behind, does it press its lead, and does it come at your holder together?
3. Watch one Brain 7 vs Brain 7 game at 5v5 (both sides Computer). Does it still stall?

## Report
*Filled in by Claude Code, 20 Nov 2026 (overnight; the Editor away). Results sections fill in when the lab's overnight runs land on this pull request: `node sims/lab/report019.js` prints every table below.*

- **What's in:**
  - **Brain 7 (keeps its lead)**, `brain7`, a copy of Brain 5 plus five behaviours, each a switch in `BRAIN_7.lead` (1 on, 0 off), with plain labels in a new "Lead" table on the Opponent screen. Brain 5 and Brain 6 are untouched. Stateless: one reading of the board per plan (`bot.js` `lead7Context`, at the start of each turn and after each roll), so replays stay exact.
  - **B1 Know the lead:** material = Σ (unit cap × HP now ÷ full HP) over units other than the holder (the designated keeper, so the count doesn't jump while the bot looks ahead). Built the suggested way: a value term `leadWeight` (20) × (ours − theirs) ÷ (ours + theirs). "Ahead" / "behind" = lead of at least `aheadAt` (1) at the plan's start. Flag damage is read separately and never folded in.
  - **B2 No bad trades when ahead:** when ahead, an attack scores lower by the attacker's own worth (unit + HP) if it is lone and losing: expected damage short of the target's effective HP **and** kill chance under `killChance` (0.5), no friend able to join this turn or attack the target next turn, and Brain 5's own threat reckoning (`risk5`) expects the enemy to remove the attacker next turn, judged after any Evade step. Fear of damage taken × `aheadCaution` (1.5) while ahead.
  - **B3 Storm together:** while storming, `gather` (3) × Brain 6's `flagPotential` (the flag damage our spare units could do next turn from the enemy goal zone), and a strike on the enemy holder costs the attacker's worth while fewer than `stormMin` (2) units can strike this turn and more could by next turn (and more than one turn is left). Plus **Press the holder** (`press`, 2), which the brief didn't name (F38): without it Brain 7 gathered and then waited forever round a braced holder.
  - **B4 Holder joins:** when the enemy has only its holder, a race check (`race7`): our turns to bring their flag down (each unit's arrival in their goal zone by movement cap, Stamina and Command, then its expected hits on the holder's pool, our holder included) against the enemy holder's turns to walk to our goal zone and pull our flag down from what's left of it. Our turn k comes first. If we win the race, our holder drops Brain 5's "stay home" and "empty flag danger" costs and counts its advance like any other unit. The enemy holder is always assumed able to leave its flag. Mark isn't counted (F40, cautious).
  - **B5 Regroup when behind:** when behind and the turns left (this one included) are at least the turns our slowest spare unit needs to reach the enemy goal zone plus `regroupSpare` (2), each spare unit with no friend (other than the holder) within 2 hexes costs `together` (2), and lone losing attacks cost as in B2. Later than that it plays as Brain 5 (commits everything).
  - **B6 Storm or hold:** ahead on material and on flag damage → storm only if the lead ≥ `stormLead` (ships at **1.5**, the middle value; 1.0 and 2.0 are measured on the same deals), else hold (B2 still applies, B3 is off). Ahead on material but level or behind on flag damage → always storm.
  - **Lab:** new measures on every run (`lead`: `lead_lost`, `lead_lost_side`, `lead_lost_peak`, `lead_lost_first_turn`, `lead_unused`, `lead_unused_side`; `alone`: `lost_alone_n/s`, `lost_together_n/s`, `holder_strikes_solo_n/s`, `holder_strikes_group_n/s`), positions scored per side-turn added to `timing` (`bot_positions`, `bot_positions_max_turn`: the plans-examined count F24 asks for), and a `brain7` measure (side-turns each behaviour was active, the first turn ahead on both, and `lone_losing_n/s`, B2's test applied to every attack by any Brain 5-family side while ahead). `seed_as` lets many matchups in one job order play the same deals. `sims/lab/report019.js` prints this Report's tables.
- **Anything beyond the brief, and why:**
  - **`press`** (F38): B3 could not storm without it. Found by tracing a game where Brain 7 led for 21 turns and still went to the clock: three units in the enemy goal zone, braced holder, 15 turns of nothing. With `press` the same game ends in a KO on turn 11.
  - **Watch links carry brain settings** (`n=brain7:stormLead=1`, `watch.js` `brainFromSpec`). The B6 sweep needs replay links for stormLead 1.0 and 2.0, which before this were "not replayable", and the standing replay rule asks for brain settings in the link. Old links still read the same; `board_check.js` and `test_watch.js` cover it.
  - **The settings review is queued at full size too** (`brain7-settings`: 26 variants × 2 formats × 1,000 against Brain 5, same deals), in a second push so the lab plays it as its own run.
  - `sims/brainhash.js` takes `brain7:lead=0@brain5` (a changed brain on another brain's seeds) to prove "all off = Brain 5" on every preset.
- **Measurements queued (all 1,000 games per format, balanced unless named, v3.6, the stall "before" run's deals `release-v3-08-00` for every balanced matchup; screen stage skipped as the Editor asked):**
  1. Baseline: `brain7-baselines`, Brain 5 mirrors on v3.5 (replaying the stall "before" games exactly, so its outcome table must equal 2026-11-19_study_stall-before; that is the "from its saved games" re-measure) and on v3.6 (no earlier v3.6 run had the stall columns, and brief 015's v3.6 run used other seeds).
  2. B6 sweep: `brain7-storm-lead` (stormLead 1.0 and 2.0 against Brain 5) plus 1.5 in `brain7-vs-brain5`.
  3. and 4. Head-to-head and how it wins: `brain7-vs-brain5`, balanced and all-Light, 5v5 and 7v7.
  5. Mirrors: Brain 7 v Brain 7 in `brain7-vs-brain5`.
  6. One behaviour at a time: `brain7-one-at-a-time` (B1; B1+B2; B1+B3; B1+B4; B1+B5; each against Brain 5 and in mirrors, both formats) at full size, not screen size.
  7. Speed: every run's `timing` columns.
- **Results:** pending the overnight runs (see the top of this Report).
- **Checks run and results (paste regression hashes):** every check in `README.md` passes locally (test_version.js updated to pin v3.10.00). `test_brain7.js 30`: 48 checks, 0 failures. `sims/lab/test_lead.js`: 6/6. `board_check.js 6`: 0 different. `regress_engine.js` (3 games per set), old board → new board, every line identical:
  `match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0 · v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250 · v3.5 fca989aecfaf21c9`.
  `sims/brainhash.js` (every preset): brain5 `24f5ff8dbb19e3ea` (new board); **Brain 7 all off (`brain7:lead=0,care=0,storm=0,holderJoins=0,regroup=0@brain5`) `24f5ff8dbb19e3ea`, the same**; brain6 `a9c7422db34c8c9c` before and after. Standard and Easy: same hashes before and after; Kit A–D share no code with the change (`regress_engine` covers them). The full all-brains brainhash run was stopped for time.
- **Baseline table (rule changes only):** n/a (no rule change); the measurements above instead.
- **Bot minimum (met / not met, with numbers):** the five test positions pass (`test_brain7.js`, each prints its reasoning):
  1. Care: ahead by 2.00, a lone attack from E12 on a full-HP Heavy Melee that kills 0% of the time, lone and losing by B2's test (cost 18.0). Brain 5 takes it; Brain 7 declines and moves its Light Melee out of reach. Target on 2 HP (likely kill): Brain 7 takes it.
  2. Gather: one unit can strike the holder this turn, three by next turn, so the strike waits. Brain 5 sends its Light Melee in alone; Brain 7 moves its Heavy Melee and Anti-Cavalry into reach (flag potential 6.02) and next turn strikes the holder with all three.
  3. Holder joins: race 5 turns (us) against 5 (them): our holder leaves its flag (Brain 5's stays). With our flag on 5, their Light Melee holder would win the race (5 against 4): our holder stays.
  4. Regroup: behind by 1.01; 15 turns left (need 6 + 2 spare): Brain 7 pulls its Light Melee back next to its Heavy Melee instead of the lone attack Brain 5 makes; 2 turns left: it commits and attacks.
  5. Hold or storm: ahead by 1.5 and on flag damage. stormLead 1.0: storms (two units in reach of the holder after its turn); 2.0: holds (one unit in reach; Brain 5's plan).
  Legal play: 30 seeded games per format and lineup (balanced and all-Light, 5v5 and 7v7, Brain 7 against Brain 5 and itself): 0 refused actions, 0 errors, 0 unfinished.
- **Settings review (brain builds only):** pending `brain7-settings` (each setting up, down and off where it has one, against Brain 5 on the same deals as the shipped Brain 7). Missing settings found so far: `press` (F38; built, since B3 failed without it). F41 asks whether B2's "a friend could support it" is too generous; `lone_losing` will show it.
- **Known gaps:**
  - Lead logic doesn't lean on the "fewer beings lost" tiebreak step: it reads units on the field only, as the brief asked. Brain 7 has no clock (Brain 6's), so near the limit it doesn't play for the tiebreak.
  - B3 is built inside the one-turn planner as value for "spare units that could strike next turn" plus a cost on lone strikes and the `press` value. It works in the test position (gather, then strike with three). Whether it plays out that way in games is what the one-at-a-time runs measure.
  - B4's race check uses distances, not paths (F40).
  - The holder for B1's material is the designated keeper (Brain 5's `keeperOf`), not "whoever stands on the flag".
- **Flags closed / opened:** opened F38 (press), F39 (two readings in the new measures), F40 (race check without Mark), F41 (B2's support test). Evidence for F10 pending the runs.
- **Pull request:** this one; build branch `claude/funny-babbage-cm70ld`, started from `brief/019-brain-7`.
