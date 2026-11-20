# Brief 011 — Special attacks: the warm-up and the six foot specials (rule set v3.7)

| | |
|---|---|
| Game version | Next free **YY** at merge (a new rule set: a real change), ZZ = 00. Specials are a YY change, not X: X is kept for Cavalry (v4.00.00, brief 012). |
| Lane | Rules (also touches Units, UI and Bot) |
| Rule set | v3.7 (new preset: brief 015's v3.6 plus switch `specials`). Rule set numbers in this brief assume 015 merged first as v3.6; if not, say so in the Report and stop |
| Date | 19 Nov 2026 (updated 19 Nov, 4:20 pm ET, for the F8 flag rulings) |
| Goal | Every foot unit gets its once-a-match special: warm it up one turn, fire it the next, no dice (Game Laws 6.16, 6.17) |
| Branch | Any branch your session may push to, started from `brief/011-special-attacks` |
| Flags | F20 gets a new check, stays closed. F8's rulings are in this brief (warm-up and pull; no special on a flag) |
| Order | **NOT YET: on hold.** Starts only after **brief 015** (engine fixes from the flag rulings, rule set v3.6) merges: rule changes go one at a time. 009 and 010 are already on main (the screens below build on 009's attack preview, unit card and button states) |

## Context
Each unit has one special attack, once a match (Game Laws 5.4). The Editor locked how specials work (6.16) and all eight specials with their sizes (6.17) on 18–19 Nov. On 19 Nov the Editor added the flag rulings (F8): a pull counts as an attack for warm-up and Reload, no special can hit a flag hex, and the flag blocks straight-line attacks (4.9). This build adds the system and the six specials of the units on the board today. Charge and Breakaway (Cavalry) are already in 6.17 and come with brief 012, on top of this system. It is a rule change, so it gets its own preset and baseline.

Everything below is in the Game Laws (6.16, 6.17). Where this brief and the Laws disagree, the Laws win: say so in the Report.

## Scope
In: preset v3.7; the warm-up and fire actions; the six foot specials; previews, buttons, the field marker, the unit card's Special section and log lines; the default brain using specials; the baseline, plus one comparison run at the older sizes.
Out: Charge and Breakaway (brief 012); any change to v3.6 or older presets (015's engine fixes, including the flag block, are already in when this starts); tuning any special's size (the Editor's call after play); icons for individual specials (none: the Bolt icon stands for every special).

## What to build

### 1. Preset v3.7
A copy of v3.6 (brief 015) with `specials: true`. It becomes the newest preset (new-game default). Every number below lives in the rule set (`data.js`), not in the engine:
- `game.warmupCost: 1` (Stamina, and so Command).
- Each foot card gets `special` (its kind), and the numbers sit in a `specials` block, for example: `arcHit: { mult: 1 }`, `pickOff: { mult: 2, lessPerFriend: 0.25, floor: 1 }`, `bullseye: { mult: 1.5 }`, `arrowStorm: { mult: 2 }`, `skewer: { first: 1, behind: 1 }`, `javelin: { mult: 2, minRange: 2, maxRange: 3 }`.
- Older presets have no `special` on any card, so nothing below can happen in them.

### 2. A special's life (6.16)
Each unit's special is in one of three states, shown everywhere as **Unused**, **Warming up** or **Used**.

1. **Warm up** (new action `warmup`, `{ type: "warmup", uid }`). Legal only when the special is Unused, the unit has not attacked or braced this turn, and it can pay `warmupCost` in full. Costs 1 Stamina and 1 Command. Names no target. Does not end the unit's turn: it may still **move and swap** afterwards, but may not attack, **pull** or brace for the rest of the turn. A pull counts as an attack (Game Laws 6.16, F8), so a unit that has pulled this turn can't warm up either: no warm-up and pull in one turn, in either order. A Heavy Ranged may warm up on its Reload turn.
2. **Fire** (new action `special`, `{ type: "special", uid, target }`). Legal only on the unit's next turn after the warm-up, at any legal target, at the attack cost (1). It **is** the unit's attack for that turn: one attack a turn (so no pull that turn either: a pull counts as an attack), Reload next turn for a Heavy Ranged, Volley's half Strength with an enemy adjacent, Reach rules, the flag block (4.9), taking the hex after a kill (except Arc Hit and Skewer, below), and Evade for a Light unit after an adjacent special (6.5). The special becomes Used.
3. **Lapse.** If the unit doesn't fire on that turn, the special goes back to Unused at the end of the turn. A unit that doesn't fire on its firing turn may warm up again on that same turn instead, paying 1 again.
4. Being hit doesn't cancel a warm-up. Being removed ends it.
5. **Bracing works against a special exactly as against any attack:** the shared 2 less and every brace benefit (parry, Weave, Fend).

A special costs 2 Stamina and 2 Command over two turns. No new Stamina modifier: the warm-up is paid in its own turn (standing rule: source = warm-up, effect = 1 Stamina that turn, stacks with nothing).

### 3. Damage: no dice (6.16.3, Article 1.8)
A special's hit on each target is worked out as a normal attack would be from that hex (Strength, Reach −1, Volley's half, Support, Armor or Pierce, Brace, Fend, Dodge), but **there is no roll**. Then:

`damage = round_half( value × (1 − Dodge%) × multiplier )`, at least 1 (`minDamage`).

The multiplier applies to the finished hit, after Armor, Brace and Dodge, before rounding (quarters round up, as today). No special ever damages a flag or its holder (6.17, F8), so specials never touch the pool.

### 4. The six specials (6.17)
| Unit | Special | Targets | Multiplier |
|---|---|---|---|
| Heavy Melee | **Arc Hit** | Pick an adjacent enemy. The **arc** is that hex plus the two hexes either side of it that also touch the Heavy Melee. Every enemy in the arc is hit; friends and empty hexes are skipped. | 1 on each (1, 2 or 3 enemies) |
| Light Melee | **Pick Off** | One adjacent enemy, as a normal attack | 2, less 0.25 for each friend of the target standing next to the target, never below 1 |
| Heavy Ranged | **Bullseye** | Any target a normal shot could take | 1.5, with its normal Pierce (nothing extra). Smaller than the others because its warm-up is free on a Reload turn |
| Light Ranged | **Arrow Storm** | Any target a normal shot could take | 2, and the target's Dodge counts as 0% |
| Heavy Anti-Cavalry | **Skewer** | One adjacent enemy, plus the enemy directly behind it (2 hexes away, same straight line), if there is one | 1 on each. With nobody behind, a single hit at 1 |
| Light Anti-Cavalry | **Javelin** | An enemy **2 or 3** hexes away in a straight line; the hexes between may hold friends, never an enemy | 2, after Reach's −1 Strength |

Details, each in the Laws or following from them:
- **Never taking a hex:** Arc Hit and Skewer never step into a hex, even after a kill (an exception to 3.6, like the flag holder's). Pick Off takes the hex after a kill as any adjacent attack does. Ranged specials and Javelin never take a hex.
- **Several targets in one action (Arc Hit, Skewer):** all hits land first; then reactions fire. Only one parry can fire per action, however many braced Heavy Melee are hit (Article 1.12: the same reaction fires once per action). A braced Heavy Melee hit from an adjacent hex uses up its parry for the turn as normal (3.12), and parries only if it survives.
- **No special hits a flag hex, held or empty (6.17, F8):** the flag hex can never be chosen as a special's target (an adjacent hex can). Arc Hit's arc skips the flag hex, and Skewer's second hit skips it (a holder behind the first target is not hit). The holder is immune to every special; normal attacks on it work as today (4.5).
- **The flag block (4.9):** Javelin, Bullseye and Arrow Storm follow it exactly as normal Volley and Reach do: a flag hex in the straight line between attacker and target blocks the shot.
- **A flag holder may warm up and fire its own special from the flag** (4.5: the holder keeps all its abilities; the Editor, 19 Nov). Its targets follow its normal attack rules from that hex. It stays on its flag after a kill, as with any holder's attack.
- **Pick Off, friends:** units only (the flag hex is not a friend), counted as the special fires.
- **Reactions are not multiplied:** parry stays 20% of the attacker's Strength; set spear stays 2.

### 5. Screens
Builds on brief 009 (attack preview, unit card, action-button states). Colours and icon as in 009: special gold `#e2b53c`, tint `#f9eeda`, Bolt icon.

**a. Special button** in the action panel's UNIT row, after Attack (and Reach), for units whose card has a special. Label: the special's name (`Arc Hit`). States exactly as 009 §6 wrote them for this brief:
- Unused: normal button.
- Warming up (the turn it was warmed): 2px `#e2b53c` border, background `#f9eeda`, a 5px bar along the bottom half-filled `#e2b53c` over `rgba(226,181,60,0.3)`. Disabled, reason `Fire it next turn`.
- Charged (its firing turn): background `#e2b53c`, 2px ink border, full ink bar.
- Used: disabled at 0.35.
- Every disabled state shows the engine's reason (brief 005's rule): `Used`, `Already attacked this turn`, `Braced this turn`, `Not enough Stamina`, `No target in reach`. Reloading never blocks a warm-up, only firing.

**b. Warming up.** Tapping an Unused Special opens a small sheet like the attack preview's actions row: a line `Warm up <name>: fire it next turn. No attack or brace this turn.`, then **Warm up** (3 parts wide, background `#e2b53c`, ink text, Bolt icon, `−1 Stamina` and the Stamina squares as on 009's Attack button) and **Cancel** (1 part).

**c. Firing.** Tapping a Charged Special highlights legal targets on the field as Attack does; picking one opens 009's attack preview with these changes:
- For Arc Hit, while the player picks, the field outlines the 3-hex arc around the hovered or chosen target.
- The action button reads `Fire <name>` (gold background, ink text, Bolt icon, `−1 Stamina`).
- The outcome bar has **one** segment, 100%, the exact damage (red if it kills). No dice.
- The key gets a row (Bolt icon): `<Name> ×2` (the multiplier used here), what it means (the one-line text in 5e), why it applies here (for Pick Off: `2 friends next to the target: ×1.5`; for Arrow Storm: `Dodge 15% doesn't count`).
- **Extra targets** (Arc Hit's others, Skewer's second): under the face-off, one row each: token 24px, name, HP bar as in the face-off, and the damage `−4.5` (red if it kills).
- Every number comes from an engine preview function (`options()` grows a `special` entry, as it has `attack` and `pull`). Nothing is worked out on screen.

**d. Field marker.** A unit that is Warming up shows a **gold ring with a soft halo** round its token, for both sides, from the engine's state: the ring drawn like the braced ring but in `#e2b53c`, with a soft glow outside it (for example a 4px blur of `#e2b53c` at about 50% opacity) so it reads on the pale field. It shows from the warm-up until the special fires or lapses. If a unit is braced last turn and warming up, both show (gold outside).

**e. Unit card Special section** (009 §4b.5 left it out for this brief): header `SPECIAL` with sub-label `Once a match`; the special's name (Plex Sans 600 15px) and one line of what it does (400 13px `#5f6762`); in a match, a status chip after the name: `Unused` (ink), `Warming up` (gold `#e2b53c`, filled dot), `Used` (muted). The Lineup card shows the section without the chip. Text (numbers from the rule set):
- Arc Hit: A normal hit on every enemy in a 3-hex arc around its target.
- Pick Off: Twice a normal hit, 25% less for each friend next to the target (never below a normal hit).
- Bullseye: 1.5 times a normal shot, ignoring Armor.
- Arrow Storm: Twice a normal shot. Dodge doesn't count.
- Skewer: A full hit on the enemy next to it and on the enemy behind that one.
- Javelin: Strikes 2 or 3 hexes away in a straight line, twice a normal hit. Over friends, never over enemies.
- Under the list, once, in muted text: `Warm up one turn (1 Stamina, no attack or brace), fire the next. No dice.`

**f. Log lines.** `HM warms up Arc Hit at E9.` and `HM fires Arc Hit: …` with each target's breakdown, `no dice`, the multiplier and the damage, as attack lines read today.

**g. Desktop.** As 009: the same pieces inside the side panel. List any judgement call in the Report.

## Rules it touches
Each becomes a test on v3.7.
- One attack a turn: no attack after firing; no firing after attacking; no warm-up after attacking or bracing; no attack or brace after warming up.
- Warm-up then move and swap are legal; **pull after warm-up is illegal; warm-up after a pull is illegal; pull after firing is illegal**; warm-up on a Reload turn is legal; firing on a Reload turn is not.
- A Heavy Ranged reloads after a pull and cannot pull on its Reload turn (F8; in 015's engine, re-checked here with specials on).
- Lapse: a warm-up not fired returns to Unused after the firing turn; re-warming on the firing turn works and costs 1 again.
- A removed unit's warm-up ends; a hit doesn't end it.
- Reload after Bullseye; Volley's half Strength on a special with an enemy adjacent (Bullseye, Arrow Storm).
- Damage order with no roll (3.2 steps 1–3, 5, 6), rounding to the half and the minimum 1.
- Arc Hit's arc: only the three hexes; enemies outside it untouched even if adjacent; friends in it untouched.
- Pierce on Bullseye; Arrow Storm ignores Dodge, including Weave's doubled Dodge; Fend still removes Support; Brace's 2 less applies to every special.
- Javelin at 2 and at 3 hexes; blocked by an enemy between, not by a friend; Reach −1 applied before ×2.
- Skewer with and without an enemy behind; a holder behind is never hit.
- No special on a flag: the flag hex (held or empty) is never a legal target for any of the six; Arc Hit's arc and Skewer's second hit skip it; the holder takes no damage from any special.
- Flag block: Javelin, Bullseye and Arrow Storm blocked by a flag hex in the line; not blocked when the line is clear.
- A holder warms up and fires its own special from the flag, and stays on its flag after a kill.
- Taking the hex: Pick Off does after a kill (and set spear fires on that entry, 3.13); Arc Hit and Skewer never do, even after a kill; ranged specials and Javelin never do.
- Parry: an adjacent special uses it up; one parry per action across several braced targets; parry only from a survivor; parry not multiplied.
- Evade after Pick Off (and after an adjacent Arrow Storm), not after a kill, not after Javelin.
- Double knockout: count actions that leave both sides with a win condition over 400 + 400 seeded v3.7 games, as `test_v32.js` does (F20 asked to revisit once an action could hurt both sides: Arc Hit plus parry can). Expect 0; report the number.

## Bot minimum
The default brain at build time (Brain 6 if 007 has merged) learns specials under the `specials` switch only. No new brain number: on every older preset it must play exactly as before.
- It never plans a warm-up and a pull in the same turn, and never plans a pull on a firing turn.
- It warms up when the special is likely to be worth more next turn than what the unit could do now (typically a turn it can't attack well: approaching, out of range, a Heavy Ranged reloading), fires when the special beats the unit's best normal action, picks Arc Hit's target to catch the most enemies, and counts an enemy's warmed-up special in its threat estimate (it can step out of an Arc Hit or brace against a warmed Pick Off).
- New settings for it (to tune later, not now): for example a weight on a warmed special's expected value next turn, and a margin a special must beat a normal attack by.
- Prove it on v3.7, 400 seeded games per format (balanced 5v5, balanced 7v7, all-Light 7v7), both sides the default brain:
  - each of the six specials fired at least 50 times in total;
  - at least 60% of warm-ups fired on the next turn;
  - no illegal action, no game that fails to finish;
  - per special: times warmed, fired, lapsed, kills, and average damage next to the average damage of the normal hit it replaced (from the preview).
- **Specials on vs off:** the same brain with its special settings off vs on, 400 games per format, same seeds, sides swapped half the time. Report the win share. If "off" wins by more than the noise (F23), raise an `ASK`: it would mean specials are a trap as written, which is the Editor's call, not a tuning job here.
- Settings review for the new settings only.
- Thinking time per turn on v3.7 next to v3.6 (F24): more actions to search. Flag it if the worst turn rises above 4.6 s.

## Measurements
On the lab (brief 008), default brain, 1,000 games per format overnight, same seeds on every rule set:
- The full baseline table, v3.7 next to v3.6 (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), balanced 5v5 and 7v7.
- **The older sizes, side by side:** a sim-only copy of v3.7 (not a preset, not on the board) with the sizes as first drafted on 18 Nov: Arrow Storm and Javelin ×1.5, Skewer's second hit ×0.75, Arc Hit ×0.5 on each enemy in the arc. Same games, same table, plus per-special uptake and damage. The Editor set the bigger sizes knowing 2× may prove too strong; this tells him which way to move.
- Per unit type: specials fired per game. The Ideas Log is watching whether Heavy Ranged fires far more than the others (its warm-up is free on Reload), whether Skewer gets used (enemies rarely line up), and Arc Hit's low end.
- How often specials land on braced targets, and what they deal there.
- Light units removed per game, every rule set above.
Under F23, call any gap under about 8 points noise.

## Housekeeping (CLAUDE.md, same pull request)
- Game version, X line: `a big new system (Cavalry, a UI overhaul)` (drop "specials": they are a YY change, per the Dev Handover).

## Must not change
- Every existing preset, v3.6 included, plays and replays identically (paste the hashes).
- Every brain plays every existing preset exactly as before (brain hashes for v3.6 and older match main).
- Saved matches from older rule sets load and replay.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every preset before v3.7 match main.
- The new tests (`test_v37.js`) run in `checks`; `test_invariants.js` covers v3.7 with specials in play.
- The "no 'being' on screen" check (brief 009) covers the new screen text.

## The Editor's hands-on check
One 7v7 against the bot with one of each foot unit. Warm up and fire at least three different specials (Arc Hit into two enemies if you can). Check: the gold ring and its halo are easy to spot on the field, for your units and the bot's; the preview shows one exact number; the Special button walks Unused → Warming up → Charged → Used; a warm-up you don't fire goes back to Unused.

## Report
*Filled in by Claude Code. Branch `claude/vibrant-albattani-aqmw26`, started from `brief/011-special-attacks` with `main` merged in (brief 015 had merged: rule set v3.6 exists, so v3.7 as the brief assumes). Game version v3.10.00, Build 14.*

- **What's in:** preset v3.7 (v3.6 + `specials`, `game.warmupCost`, a `special` on each foot card, a `specials` block with every size); the `warmup` and `special` actions with the Unused / Warming up / Charged / Used life, lapse and re-warm; the six specials exactly as 6.17 (no dice, multiplier on the finished hit, half-point rounding, minimum 1); no special on a flag hex; the flag block for Bullseye, Arrow Storm and Javelin; parry once per action; Pick Off takes the hex (set spear on entry), Arc Hit / Skewer / ranged / Javelin never do; Evade after an adjacent Pick Off or Arrow Storm. Screens: Special button in its four states with the engine's reasons, the warm-up line, the firing preview (one exact number, the special's key row, extra-target rows, Arc Hit's arc outline on tap and on hover), the gold ring with a halo, the unit card's Special section, log lines, desktop side panel (a gold bolt beside a warming unit). Brain 5 (and Brain 6, which shares its planner) uses specials under the switch only.
- **Anything beyond the brief, and why:** (1) the lab's job orders can change rule numbers for a sim-only copy (`"set"`), needed for the older-sizes run; (2) a `specials` lab measure; (3) on its firing turn, a charged unit with no target can be warmed up again from the same button (the brief allows the re-warm but gives no button for it; judgement call).
- **Judgement calls on screens:** the charged button stays tappable when there is no target but a re-warm is possible (opens "Warm up Skewer again"); the warm-up reason when Command (not Stamina) is short still reads "Not enough Stamina", as the brief words it; the arc is drawn as a gold outline (no fill) so the tokens under it stay readable. The extra-target rows and the arc fit on a 390-wide phone (checked in a headless browser: Arc Hit into two enemies).
- **Laws vs brief:** none found. One reading needs the Editor: F38 (Skewer's second hit built as a full hit, no Reach −1).
- **Checks run and results:** every check in `README.md` passes locally: test_rules, v1, v3, v3.1, v3.2 (20-game count), v3.3, v3.4, v3.5, v3.6 (updated: v3.6 is no longer the newest), **v3.7 (180/180)**, stamina, reasons (updated for the Special reason), kitd, brain5, brain6, version, watch, ui (87/87, includes the special text and preview), invariants (v3.7, 30 games incl. 10 Brain 5 mirrors: 75 warm-ups, 46 specials fired, 0 problems), rng, replay, lab self_test, test_stall, board_check (10 games, 0 different).
- **Regression hashes** (`regress_engine.js`, 6 games per set; main's board vs this board, identical):
  `match3 ba9f9ad987385750` · `v1 4827f4ae8059d541` · `v2 0d208c5415782fde` · `v3 ec98a437a0e051d4` · `v3.1 a67f8605195788e1` · `v3.2 fb523ce9a70244bf` · `v3.3 059a117284e53942` · `v3.4 f4fab7c5888b11da` · `v3.5 ce0811710786bb5d` · `v3.6 4706bad95c877a09`
- **Brain hashes, every older preset (v1–v3.6), main vs this board, identical:** `brain5 24f5ff8dbb19e3ea` · `brain6 a9c7422db34c8c9c` · `kitD dde416d0f0c6ee91` · `standard 0e2eb26d5b08ff59`.
- **Overnight run (the Editor's plan, 20 Nov):** not merged; lab runs queued from this pull request; ASKs taken at their most reasonable reading and noted here (F38: full hit; F39 and F40: rules left as the Editor set them, recommendations in `FLAGS.md`).
- **Bot fix after the first lab runs (Build 14, same version):** the bot judged an enemy's warmed-up Arrow Storm with the target's Dodge, though Arrow Storm ignores Dodge, so it walked Light units into a killing shot. It now estimates an enemy's warmed special as the engine deals it, and warms Skewer only when its target has a friend next to it. All the numbers below are from the **fixed bot** (`-b` runs, same seeds as the first runs; the first runs stay in `results/` for comparison). Older rule sets are untouched by the fix (brain hashes re-checked after it: `brain5 24f5ff8dbb19e3ea`, `brain6 a9c7422db34c8c9c`, same as `main`).
- **Double knockout (F20):** **0** actions left both sides with a win condition, in 12,200 seeded v3.7 games across both rounds (every action checked; column `both_win_actions`).
- **Baseline table** (Brain 5 mirror, balanced, 1,000 games per format, same seeds on every rule set):

  | Rule set | Format | Holder KO | Pull KO | TKO | Tiebreak win | Draw | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive | Light removed per game |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | v3.6 | 5v5 | 3.7% | 26.3% | 13.3% | 54.4% | 2.3% | 56.7% | 26.4% | 19.23 | 38.6% | 3.74 |
  | v3.7 | 5v5 | 4.4% | 41.3% | 20.0% | 33.8% | 0.5% | 34.3% | 41.3% | 15.88 | **5.3%** | 3.51 |
  | v3.7 older sizes | 5v5 | 5.6% | 25.6% | 13.6% | 54.7% | 0.5% | 55.2% | 25.6% | 18.74 | **85.3%** | 3.67 |
  | v3.6 | 7v7 | 4.4% | 38.3% | 12.5% | 41.1% | 3.7% | 44.8% | 38.5% | 22.84 | 46.9% | 5.58 |
  | v3.7 | 7v7 | 3.7% | 41.6% | 13.0% | 39.8% | 1.9% | 41.7% | 41.7% | 21.61 | 31.6% | 5.71 |
  | v3.7 older sizes | 7v7 | 2.1% | 39.9% | 13.0% | 43.0% | 2.0% | 45.0% | 39.9% | 22.79 | 46.4% | 5.66 |

  Reading (F23: gaps under about 8 points are noise): **5v5 changes a lot.** Turn-limit games fall from 57% to 34%, pull KOs rise from 26% to 41%, and the first mover wins only 35 of 657 decisive games. **7v7 hardly moves** except the first mover's share (47% to 32%, outside the noise). The older sizes leave 5v5's endings close to v3.6 but swing the first mover the other way (85%): **either size set makes move order decide 5v5.** Before the fix the first mover's 5v5 share was 1.8% (v3.7) and 62.1% (older sizes); the fix moved both, so the bot is part of the cause, but not all of it.
- **Why move order decides 5v5 (likely, not isolated):** the balanced 5v5 squad has one Light Ranged a side. At × 2, Arrow Storm (7 × 2 = 14, no Dodge) kills a full-health Light Ranged (12 HP) from about 7 hexes (4 of movement, range 3): 1,001 fired, 946 kills in 1,000 games. Whoever warms up first in range wins the Light Ranged duel, and the second mover, with full Command on turn 1, sees the approach first. At × 1.5 it doesn't kill, and the first mover's extra tempo wins instead. 7v7 has two Ranged a side and more units, which dilutes it. See **F39**.
- **Older sizes, per special:** Arc Hit at × 0.5 is never worth firing (0 fired in 2,000 games); Arrow Storm 10.5 a shot; Javelin 8.2. Skewer barely fires at either size.
- **Per-special uptake and damage** (`specials-bots-b`, 400 games per format; damage per hit next to the normal hit it replaced, engine preview from the same hex):
  - Arc Hit: warmed 336, fired 155, kills 69; 8.0 vs 8.2 a hit (its gain is the extra targets).
  - Pick Off: warmed 2,255, fired 1,299, kills 894; 14.6 vs 7.6.
  - Bullseye: warmed 719, fired 545, kills 220; 12.8 vs 8.6.
  - Arrow Storm: warmed 3,183, fired 1,942, kills 1,568; 14.1 vs 5.3.
  - Skewer: warmed 0, fired **0**.
  - Javelin: warmed 2,397, fired 1,840, kills 382; 10.7 vs 5.7.
  - Specials fired per game (balanced 7v7, 1,000 games): Javelin 1.81, Arrow Storm 1.35, Bullseye 1.32, Pick Off 0.88, Arc Hit 0.16, Skewer 0.00. Heavy Ranged doesn't fire far more than the others; Javelin fires most.
  - On braced targets: 46 special hits in 1,000 7v7 games (447 damage, 9.7 a hit) and 153 in 1,000 5v5 games (1,421, 9.3 a hit).
- **Bot minimum (fixed bot):**
  - Each special fired 50+ times in total: **not met for Skewer** (0 fired; 2 before the fix). Skewer's second hit needs an enemy directly behind its target, which almost never happens. A stricter line-up check, tried locally on 60 7v7 games, still gave 0 fired, so it was not kept. The bot rightly attacks normally otherwise: an unfired special lapses back to unused at no loss. See **F40**. The other five fired 155 to 1,942 times.
  - 60%+ of warm-ups fired the next turn: **met, 65.0%** (5,781 of 8,890); by format 58.9% (5v5), 71.6% (7v7), 62.4% (all-Light 7v7). Most misses in 5v5 are the losing Light Ranged, removed while warm.
  - No illegal action, every game finished: **met** (0 refused, 0 brain errors, 0 unfinished in 12,200 v3.7 games).
  - The bot never plans a warm-up and a pull together, or a pull on a firing turn (the engine forbids both; `test_v37.js` checks the bot's games for it).
- **Specials on vs off** (`specials-onoff-b`, 400 games per format, sides and order swapped): Brain 5 using specials took **80.0%** of balanced 5v5 games, **68.6%** of balanced 7v7, **89.3%** of all-Light 7v7. Specials are not a trap.
- **Thinking time (F24):** worst turn **4.4 s** (all-Light 7v7, 400 games; 5.1 s before the fix), just under the 4.6 s flag. Balanced worst turns 0.7 s (5v5) and 2.3 s (7v7), against 0.9 s and 3.6 s on v3.6. Average per side-turn 62 ms (5v5) and 107 ms (7v7), against 53 ms and 136 ms on v3.6.
- **Settings review (new settings only).** Screen: `specials-settings`, before the fix, A = Brain 5 with one setting changed against the default, balanced 7v7, 200 games each, ±3.5 points = one standard error. Confirm: `specials-warmslack-confirm`, fixed bot, 1,000 games per format.
  - Warmed special's worth (`special`, 0.5): at 0, A took 25.8%; at 1, 31.0%. **Effect found**, both worse.
  - Warm-up reach slack (`warmSlack`, 1): at 0, A took 57.8% in the screen but **didn't confirm**: 48.2% (5v5) and 53.8% (7v7) over 1,000 games, in opposite directions and both under 4 points. Kept at 1. At 2: 39.8%. **Effect found** upward only.
  - Warm-up cost (`warmCost`, 1): 0 gave 42.0%, 3 gave 40.8%. Likely an effect, both worse; not confirmed.
  - Special margin (`specialMargin`, 0): 3 gave 50.0%. **No effect found.**
  - Warm-up moves tried (`plan5.warmMoves`, 4): 1 gave 53.0%, 8 gave 48.5%. **No effect found** (8 only costs time).
  - Use specials (`useSpecials`): see on vs off above. **Effect found.**
  - Missing settings (harder to prove than the list above): none raised. The pattern the brain keeps losing to, a Light Ranged walking into a warmed Arrow Storm, is mostly the size (F39), not a missing setting.
- **Playtest round 2 (the Editor's questions, 20 Nov; `specials-playtest-2`, fixed bot, new seeds, Brain 5 mirror, 400 games each of balanced 5v5, balanced 7v7, all-Light 7v7; 0 refused, 0 errors, 0 unfinished):**
  1. *How often bots warm up:* 3.8 warm-ups a game (5v5), 7.6 (7v7), 10.4 (all-Light 7v7). Most: Arrow Storm, Javelin, Bullseye, Pick Off. Least: Arc Hit (0.35–0.43 a game), Skewer (almost never).
  2. *How often they fire after warming up:* 59% (5v5), 72% (7v7), 66% (all-Light) on the next turn. The rest: removed while warm (see 4), lapsed (96, 341 and 730 lapses in the three formats), or warmed again on the firing turn. By special (7v7): Javelin 87%, Bullseye 75%, Arrow Storm 66%, Pick Off 64%, Arc Hit 39%.
  3. *Retreat, or stay in reach:* units mostly stay. At the start of a turn facing a warmed enemy special, 85% (5v5), 70% (7v7) and 78% (all-Light) of a side's units are inside its reach next turn ("reach" is generous: the warmed unit's full movement plus the special's range, ignoring blockers). Of those, only **46% (5v5), 19% (7v7) and 15% (all-Light) step out**; the rest stay, and almost all of those stay **unbraced** (5v5: 2,339 unbraced vs 121 braced; 7v7: 6,053 vs 102; all-Light: 6,855 vs 239). Another 763, 1,333 and 1,215 units step **into** reach. Of the units that end a turn in reach, **29% (5v5), 29% (7v7) and 32% (all-Light) are hit by that special next turn**; only 68, 18 and 18 of those hits land on a braced unit.
  4. *Units removed during a warm-up:* 34.5% of warm-ups in 5v5 (1.3 a game, mostly the Light Ranged that loses the Arrow Storm duel: 379 of 519), 16.6% in 7v7 (1.3 a game), 16.7% in all-Light (1.7 a game).
  5. *Specials per game:* 2.2 (5v5), 5.5 (7v7), 6.8 (all-Light 7v7).
  6. *Damage as a multiple of the unit's normal hit* (engine preview of the normal attack from the same hex, averaged over the dice): Arrow Storm **2.6–2.8×** (more than its ×2 because Dodge doesn't count), Pick Off 1.9×, Javelin 1.9×, Bullseye 1.5×, Arc Hit 1.0× a hit (1.3–1.4× a shot counting its extra targets), Skewer 1.0× (1 shot in 1,200 games).
  - *What it says about the bot (likely, not isolated):* it doesn't respect a warmed special. It almost never braces against one (brace takes 2 off and helps most against Pick Off and Arrow Storm) and mostly stays in reach. Its risk estimate counts the warmed special, but only as one more threat in a weighted sum. This is the "missing setting" the settings review asked for: **F41**.
- **Known gaps:** the bot's special play is a first version (the brief: tune later). Skewer never fires (F40). Move order decides balanced 5v5 (F39).
- **Flags closed / opened:** opened F38 (Skewer's second hit), F39 (move order decides 5v5 under specials), F40 (Skewer almost never fires) and F41 (the bot doesn't brace or step away from a warmed special); F24 updated. F20 stays closed, with its new check.
- **Pull request:** see below.
