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

## Report back
- The baseline table, v3.7 next to v3.6, and the older-sizes run next to both.
- The bot-minimum numbers and the specials on/off result.
- Per-special uptake and average damage.
- The double-knockout count.
- Any screen where the extra-target rows or the arc outline don't fit on a 390-wide phone.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
