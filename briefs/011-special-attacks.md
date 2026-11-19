# Brief 011 — Special attacks: the warm-up and the six foot specials (rule set v3.6)

| | |
|---|---|
| Game version | Next free **YY** at merge (a new rule set: a real change), ZZ = 00. Specials are a YY change, not X: X is kept for Cavalry (v4.00.00, brief 012). |
| Lane | Rules (also touches Units, UI and Bot) |
| Rule set | v3.6 (new preset: v3.5 plus switch `specials`) |
| Date | 18 Nov 2026 |
| Goal | Every foot unit gets its once-a-match special: warm it up one turn, fire it the next, no dice (Game Laws 6.16, 6.17) |
| Branch | Any branch your session may push to, started from `brief/011-special-attacks` |
| Flags | F27 (version history line, housekeeping below). F20 gets a new check, stays closed |
| Order | **After 010 merges** (rule changes go one at a time) **and after 009 merges** (the screens below build on 009's attack preview, unit card and button states) |

## Context
Each unit has one special attack, once a match (Game Laws 5.4). The Editor locked how specials work (6.16) and all eight specials (6.17) on 18 Nov. This build adds the system and the six specials of the units on the board today. Charge and Breakaway (Cavalry) come with brief 012 on top of this system. It is a rule change, so it gets its own preset and baseline.

Rulings the Editor gave on 18 Nov for this brief (Game Laws 6.16 and 6.17 carry them): items marked **(ruled 18 Nov)** below.

## Scope
In: preset v3.6; the warm-up and fire actions; the six foot specials; previews, buttons, the field marker, the unit card's Special section and log lines; the default brain using specials; the baseline.
Out: Charge and Breakaway (brief 012); any change to v3.5 or older presets; tuning any special's size (the Editor's feel call after play); icons for individual specials (none: the Bolt icon stands for every special).

## What to build

### 1. Preset v3.6
A copy of v3.5 with `specials: true`. It becomes the newest preset (new-game default). Every number below lives in the rule set (`data.js`), not in the engine:
- `game.warmupCost: 1` (Stamina, and so Command).
- Each foot card gets `special` (its kind) and the special's numbers in a `specials` block, for example `arcHit: { mult: 0.5 }`, `pickOff: { mult: 2, lessPerFriend: 0.25, floor: 1 }`, `bullseye: { mult: 1.5 }`, `arrowStorm: { mult: 1.5 }`, `skewer: { first: 1, behind: 0.75 }`, `javelin: { mult: 1.5, range: 3 }`.
- Older presets have no `special` on any card, so nothing below can happen in them.

### 2. A special's life (6.16)
Each unit's special is in one of three states, shown everywhere as **Unused**, **Warming up** or **Used**.

1. **Warm up** (new action `warmup`, `{ type: "warmup", uid }`). Legal only when the special is Unused, the unit has not attacked or braced this turn, and it can pay `warmupCost` in full. Costs 1 Stamina and 1 Command. Names no target. Does not end the unit's turn: it may still **move, swap and pull** afterwards **(ruled 18 Nov)**, but may not attack or brace for the rest of the turn. A Heavy Ranged may warm up on its Reload turn.
2. **Fire** (new action `special`, `{ type: "special", uid, target?, take? }`). Legal only on the unit's next turn after the warm-up, at any legal target, at the attack cost (1). It **is** the unit's attack for that turn: one attack a turn, Reload next turn for a Heavy Ranged, Volley's half Strength with an enemy adjacent, Reach rules, the goal-zone rule for a flag holder (4.5), taking the hex after a kill, and Evade for a Light unit after an adjacent special (6.5). The special becomes Used.
3. **Lapse.** If the unit doesn't fire on that turn, the special goes back to Unused at the end of the turn. A unit that doesn't fire on its firing turn may warm up again instead, paying 1 again **(ruled 18 Nov)**.
4. Being hit doesn't cancel a warm-up. Being removed ends it.

A special costs 2 Stamina and 2 Command over two turns. No new Stamina modifier: the warm-up is paid in its own turn (standing rule: source = warm-up, effect = 1 Stamina that turn, stacks with nothing).

### 3. Damage: no dice (6.16.3, Article 1.8)
A special's hit on each target is worked out as a normal attack would be from that hex (Strength, Reach −1, Volley's half, Support, Armor or Pierce, Brace, Fend, Dodge), but **there is no roll**. Then:

`damage = round_half( value × (1 − Dodge%) × multiplier )`, at least 1 (`minDamage`).

The multiplier applies to the finished hit, after Armor, Brace and Dodge, before rounding (quarters round up, as today). Damage to a flag holder goes into the pool (4.4).

### 4. The six specials (6.17)
| Unit | Special | Targets | Multiplier |
|---|---|---|---|
| Heavy Melee | **Arc Hit** | Every adjacent enemy (no target chosen; needs at least one). A flag holder counts only if the Heavy Melee stands in that flag's goal zone (4.5). | 0.5 on each |
| Light Melee | **Pick Off** | One adjacent enemy, as a normal attack | 2, less 0.25 for each friend of the target standing next to the target, never below 1 |
| Heavy Ranged | **Bullseye** | Any target a normal shot could take | 1.5, Armor ignored (its Pierce, as on every shot: "Pierce always applies" adds nothing new) **(ruled 18 Nov)** |
| Light Ranged | **Arrow Storm** | Any target a normal shot could take | 1.5, and the target's Dodge counts as 0% |
| Heavy Anti-Cavalry | **Skewer** | One adjacent enemy, plus the enemy directly behind it (2 hexes away, same straight line), if there is one | 1 on the first, 0.75 on the one behind |
| Light Anti-Cavalry | **Javelin** | An enemy **exactly 3** hexes away in a straight line; both hexes between may hold friends, never an enemy **(ruled 18 Nov)** | 1.5, after Reach's −1 Strength **(ruled 18 Nov)** |

Details, each ruled or following from the Laws:
- **Skewer, the enemy behind:** a flag holder there is never hit (it can only be attacked from its goal zone, 4.5). A friend or an empty hex behind means only the first hit lands.
- **Pick Off, friends:** units only (the flag hex is not a friend), counted as the special fires.
- **Javelin at 2 hexes** is not a Javelin: it's an ordinary Reach attack.
- **Several targets in one action (Arc Hit, Skewer) (ruled 18 Nov):** all hits land first; then reactions fire (parry from a braced Heavy Melee that survived and was hit from an adjacent hex); then the attacker takes a hex.
  - Only one parry can fire per action, however many braced Heavy Melee are hit (Article 1.12: the same reaction fires once per action). Each braced Heavy Melee hit from an adjacent hex uses up its parry for the turn as normal (3.12).
  - **Taking the hex (ruled 18 Nov):** if exactly one adjacent target died, the attacker takes its hex, as after any kill. If several died (Arc Hit), the player picks which emptied hex to take (`take` in the action; the bot picks by its evaluation). A flag holder that kills still never leaves its flag (3.6). Taking the hex counts as entering it (set spear).
- **Reactions are not multiplied:** parry stays 20% of the attacker's Strength; set spear stays 2.

### 5. Screens
Builds on brief 009 (attack preview, unit card, action-button states). Colours and icon as in 009: special gold `#e2b53c`, tint `#f9eeda`, Bolt icon.

**a. Special button** in the action panel's UNIT row, after Attack (and Reach), for units whose card has a special. Label: the special's name (`Arc Hit`). States exactly as 009 §6 wrote them for this brief:
- Unused: normal button.
- Warming up (the turn it was warmed): 2px `#e2b53c` border, background `#f9eeda`, a 5px bar along the bottom half-filled `#e2b53c` over `rgba(226,181,60,0.3)`. Disabled, reason `Fire it next turn`.
- Charged (its firing turn): background `#e2b53c`, 2px ink border, full ink bar.
- Used: disabled at 0.35.
- Every disabled state shows the engine's reason (brief 005's rule): `Used`, `Already attacked this turn`, `Braced this turn`, `Not enough Stamina`, `No enemy next to it` (Arc Hit). Reloading never blocks a warm-up, only firing.

**b. Warming up.** Tapping an Unused Special opens a small sheet like the attack preview's actions row: a line `Warm up <name>: fire it next turn. No attack or brace this turn.`, then **Warm up** (3 parts wide, background `#e2b53c`, ink text, Bolt icon, `−1 Stamina` and the Stamina squares as on 009's Attack button) and **Cancel** (1 part).

**c. Firing.** Tapping a Charged Special highlights legal targets on the field as Attack does; picking one opens 009's attack preview with these changes. Arc Hit skips the pick and opens the preview at once.
- The action button reads `Fire <name>` (gold background, ink text, Bolt icon, `−1 Stamina`).
- The outcome bar has **one** segment, 100%, the exact damage (red if it kills). No dice.
- The key gets a row (Bolt icon): `<Name> ×1.5` (the multiplier used here), what it means (the one-line text in 5e), why it applies here (for Pick Off: `2 friends next to the target: ×1.5`; for Arrow Storm: `Dodge 15% doesn't count`).
- **Extra targets** (Arc Hit's others, Skewer's second): under the face-off, one row each: token 24px, name, HP bar as in the face-off, and the damage `−4.5` (red if it kills). If the player must pick a hex to take (several kills possible), the Fire button opens a one-line prompt `Take which hex?` with the emptied hexes highlighted; skipping it is not allowed.
- Every number comes from an engine preview function (`options()` grows a `special` entry, as it has `attack` and `pull`). Nothing is worked out on screen.

**d. Field marker.** A unit that is Warming up shows a **gold ring** round its token, drawn like the braced ring but in `#e2b53c`, for both sides, from the engine's state **(ruled 18 Nov)**. It shows from the warm-up until the special fires or lapses. If a unit is braced last turn and warming up, both rings show (gold outside).

**e. Unit card Special section** (009 §4b.5 left it out for this brief): header `SPECIAL` with sub-label `Once a match`; the special's name (Plex Sans 600 15px) and one line of what it does (400 13px `#5f6762`); in a match, a status chip after the name: `Unused` (ink), `Warming up` (gold `#e2b53c`, filled dot), `Used` (muted). The Lineup card shows the section without the chip. Text (numbers from the rule set):
- Arc Hit: Hits every enemy next to it for half a normal hit.
- Pick Off: Twice a normal hit, 25% less for each friend next to the target (never below a normal hit).
- Bullseye: 1.5 times a normal shot, ignoring Armor.
- Arrow Storm: 1.5 times a normal shot. Dodge doesn't count.
- Skewer: A full hit on the enemy next to it and 75% on the enemy behind that one.
- Javelin: Strikes 3 hexes away in a straight line, 1.5 times. Over friends, never over enemies.
- Under the list, once, in muted text: `Warm up one turn (1 Stamina, no attack or brace), fire the next. No dice.`

**f. Log lines.** `HM warms up Arc Hit at E9.` and `HM fires Arc Hit: …` with each target's breakdown, `no dice`, the multiplier and the damage, as attack lines read today.

**g. Desktop.** As 009: the same pieces inside the side panel. List any judgement call in the Report.

## Rules it touches
Each becomes a test on v3.6.
- One attack a turn: no attack after firing; no firing after attacking; no warm-up after attacking or bracing; no attack or brace after warming up.
- Warm-up then move, swap and pull are legal; warm-up on a Reload turn is legal; firing on a Reload turn is not.
- Lapse: a warm-up not fired returns to Unused after the firing turn; re-warming on the firing turn works and costs 1 again.
- A removed unit's warm-up ends; a hit doesn't end it.
- Reload after Bullseye; Volley's half Strength on a special with an enemy adjacent (Bullseye, Arrow Storm).
- Damage order with no roll (3.2 steps 1–3, 5, 6), rounding to the half and the minimum 1; Arc Hit on a heavily armoured target still does 1.
- Pierce on Bullseye; Arrow Storm ignores Dodge, including Weave's doubled Dodge; Fend still removes Support.
- The flag holder: only from its goal zone (Arc Hit, Skewer's second target, Javelin); damage into the pool; a holder that kills stays on its flag.
- Taking the hex after a special kill (Arc Hit, Pick Off, Skewer) and set spear on that entry (3.13); Javelin and ranged specials never take a hex.
- Parry: an adjacent special uses it up; one parry per action across several braced targets; parry only from a survivor; parry not multiplied.
- Evade after Pick Off (and after an adjacent Arrow Storm), not after a kill, not after Javelin.
- Pooled flag rounding edges (pitfall E2) with a special's half-point damage.
- Double knockout: count actions that leave both sides with a win condition over 400 + 400 seeded v3.6 games, as `test_v32.js` does (F20 asked to revisit once an action could hurt both sides: Arc Hit plus parry can). Expect 0; report the number.

## Bot minimum
The default brain at build time (Brain 6 if 007 has merged) learns specials under the `specials` switch only. No new brain number: on every older preset it must play exactly as before.
- It warms up when the special is likely to be worth more next turn than what the unit could do now (typically a turn it can't attack well: approaching, out of range, a Heavy Ranged reloading), fires when the special beats the unit's best normal action, and counts an enemy's warmed-up special in its threat estimate (it can step out of an Arc Hit or brace against a warmed Pick Off).
- New settings for it (to tune later, not now): for example a weight on a warmed special's expected value next turn, and a margin a special must beat a normal attack by.
- Prove it on v3.6, 400 seeded games per format (balanced 5v5, balanced 7v7, all-Light 7v7), both sides the default brain:
  - each of the six specials fired at least 50 times in total;
  - at least 60% of warm-ups fired on the next turn;
  - no illegal action, no game that fails to finish;
  - per special: times warmed, fired, lapsed, kills, and average damage next to the average damage of the normal hit it replaced (from the preview).
- **Specials on vs off:** the same brain with its special settings off vs on, 400 games per format, same seeds, sides swapped half the time. Report the win share. If "off" wins by more than the noise (F23), raise an `ASK`: it would mean specials are a trap as written, which is the Editor's call, not a tuning job here.
- Settings review for the new settings only.
- Thinking time per turn on v3.6 next to v3.5 (F24): more actions to search. Flag it if the worst turn rises above 4.6 s.

## Measurements
On the lab (brief 008), default brain, 1,000 games per format overnight, same seeds on both rule sets:
- The full baseline table, v3.6 next to v3.5 (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games), balanced 5v5 and 7v7.
- Per unit type: specials fired per game. The Ideas Log is watching whether Heavy Ranged fires far more than the others (its Reload turn makes the warm-up free), whether Skewer gets used, and Arc Hit's low end.
- Light units removed per game, both rule sets.
Under F23, call any gap under about 8 points noise.

## Housekeeping (CLAUDE.md, same pull request)
- Game version, X line: `a big new system (Cavalry, a UI overhaul)` (drop "specials": they are a YY change, per the Dev Handover).
- History line: v3.04.00 had **Kit D** as default, as the changelog and brief 005 say (closes F27).

## Must not change
- Every existing preset, v3.5 included, plays and replays identically (paste the hashes).
- Every brain plays every existing preset exactly as before (brain hashes for v3.5 and older match main).
- Saved matches from older rule sets load and replay.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every preset before v3.6 match main.
- The new tests (`test_v36.js`) run in `checks`; `test_invariants.js` covers v3.6 with specials in play.
- The "no 'being' on screen" check (brief 009) covers the new screen text.

## The Editor's hands-on check
One 7v7 against the bot with one of each foot unit. Warm up and fire at least three different specials (Arc Hit into two enemies if you can). Check: the gold ring shows on the field for your units and the bot's; the preview shows one exact number; the Special button walks Unused → Warming up → Charged → Used; a warm-up you don't fire goes back to Unused.

## Report back
- The baseline table, v3.6 next to v3.5.
- The bot-minimum numbers and the specials on/off result.
- Per-special uptake and average damage.
- The double-knockout count.
- Any screen where the extra-target rows or the hex prompt don't fit on a 390-wide phone.

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
