# Brief 009 — Approved UI v2: attack preview, unit card, top bar and Options menu

| | |
|---|---|
| Game version | Next free **YY** at merge (new screens: a real change), ZZ = 00. Take it when you open the pull request; re-check after any `sync`. |
| Lane | UI |
| Rule set | none (screen only; no preset changes) |
| Date | 18 Nov 2026 |
| Goal | Build the four sets the Editor approved on 18 Nov: the attack preview, the unit card (lineup and in match), the action-button states, and the match top bar with its Options menu. Lock in the "unit cap (UC)" wording. |
| Branch | Any branch your session may push to, started from `brief/009-attack-preview-ui-v2` |
| Flags | none to close |
| Order | **Can start now**, alongside 007 and 008 (changed 18 Nov: 007 now waits on 008 and overnight runs). 007 also touches the match menu's version line: whichever merges second runs `sync` and keeps both (009's menu, 007's version line). |

## Context
UI v2 is on the Approved UI canvas, page **v2** (phone, 390 wide). This brief carries every size, colour and word, so you never need to open the canvas. Look principles are Game Laws 7.9: symmetrical (each side mirrored, flags on the outsides), elegant, clean (an icon stands in for text, never repeats it). Ability names are the Laws' ability table (Section 3). Dice in force: two d6 graded into 5 outcomes (v3.3 on); the ±10% dice (Laws 6.13) are not built, so the outcome bar must read its outcomes from the engine (`dieCases`), never a fixed count.

## Scope
In: the attack preview sheet (replaces the current attack sheet), the compact unit bar and full unit card in a match, the unit card on the Lineup screen, the action-button states, the match top bar, the Options menu (replaces the current match-menu dialog), a "no 'being' on screen" check.
Out: the pull preview (keeps today's sheet), Special attacks (brief 011: the Special button, Special section and its states are specified below for reference only; don't build them), the Settings screen (not designed: leave the Settings menu item out), the logo, Home, end-of-match screen, swap placement, Health and Stamina visuals, Cavalry rows. Any rule change.

## Look (shared by everything below)
- Fonts (Google Fonts): **Barlow Condensed** 500/600/700 (display), **IBM Plex Sans** 400/500/600 (body), **IBM Plex Mono** 400/500/600 (numbers).
- Colours: ink `#1f2421`; page `#e9ece6`; panel `#f8f9f5`; sheet `#ffffff`; line `#b8beb6`; muted text `#5f6762`; field `#d5dbd2`; North `#2f6b55` (light tint on the dark bar `#8fd0b4`); South `#a8452f` (tint `#f0a48f`); danger / hurts-you red `#c62828`; braced blue `#1f4fd8`; special gold `#e2b53c` (tint `#f9eeda`); HP track `#dfe3dc`; dim over the field `rgba(31,36,33,0.25)`.
- Icons: 24-unit grid, stroke 1.9, round caps and joins, outline, one colour (`currentColor`), no fill except small dots. Paths are in **Icons** at the end. Touch targets at least 44×44.
- Menus and panels stay light; the top bar and scoreboard stay dark (`#1f2421`).
- Every number shown comes from the engine's state or a preview function. Nothing is worked out separately on screen (CLAUDE.md pitfall 1).

## What to build

### 1. Match top bar (phone)
Two dark blocks, top to bottom, full width, background `#1f2421`:
1. **Title row:** padding 8px 12px 0 16px, space-between. Left: `FLAGFALL` in Barlow Condensed 700 20px, letter-spacing 0.04em, colour `#f8f9f5`, followed by `: Arena` at weight 500. Right: the **Options** button, 44×44, radius 10, border 1px `rgba(248,249,245,0.25)`, background `rgba(248,249,245,0.08)`, menu icon 22px in `#f8f9f5`, `aria-label="Options"`. Under the row, inside 16px side padding: a 1px line `rgba(248,249,245,0.15)`, 8px below the row.
2. **Scoreboard** (today's scoreboard, re-laid): padding 10px 16px 13px, gap 9px, three rows.
   - Row 1, three columns (1fr auto 1fr): North name left (Barlow 700 12px, letter-spacing 0.12em, uppercase, `#8fd0b4`) with the Player or Computer icon (15px) before it; the **turn counter** centre (hourglass icon 13px + `9/25`, Plex Mono 600 12px, opacity 0.8); South name right (`#f0a48f`), its icon after it. The turn counter is no longer the menu button.
   - Row 2: flag icon 18px + North flag HP (Plex Mono 600 22px) · the tug-of-war rope (height 10px, radius 5, North colour to the split, South colour after, a 12px `#f8f9f5` knob with 2px `#1f2421` border at the split) · South flag HP + the flag icon mirrored (`scaleX(-1)`). The rope still measures flag HP only (Laws 7.9 / pooled-flag ruling: never the pooled HP).
   - Row 3, three columns: North units left as 6px dots (filled = alive, hollow = removed), gap 3px; **Command** centre as 11×11 squares radius 2, gap 4px (filled `#f8f9f5` = left, `rgba(248,249,245,0.25)` = spent); South dots right-aligned.
   - A 3px underline in the moving side's tint across that side's half, at the bottom of the scoreboard.

### 2. Options menu
Tapping Options dims the whole screen (`rgba(31,36,33,0.25)`) and opens a panel over the button: top 4px, right 4px, width 292px, background `#ffffff`, border 1px `#b8beb6`, radius 16, shadow `0 16px 40px rgba(0,0,0,0.3)`, padding 4px 0 8px, `role="menu"`.
- **Header** (padding 0 8px 10px 16px, line under it `#b8beb6`): left column, 10px from the top, gap 4px:
  - `7v7 · North vs Bot` (the format and both side names as the match has them): Plex Sans 600 14px.
  - `Rule set v3.4 · Bot: Brain 5` (leave out the bot part in a two-player match): 400 12px `#5f6762`.
  - `Seed WBUX-6Z5H-PKUY`: Plex Mono 500 11px `#5f6762`.
  - The game version and build line (`v3.05.01 · Build 7` style, from `version.js`; 007 may change its wording): same style as the seed line, directly under it.
  - Right: a ✕ close button 44×44, radius 10, border `#b8beb6`, background `#f8f9f5`, `aria-label="Close options"`. It sits where the Options button was.
- **Items** (each a `menuitem` button, min-height 48px, padding 0 16px, gap 12px, icon 20px, Plex Sans 600 14px, left-aligned):
  1. Match log and record (list icon) → today's Match screen.
  2. Rules and unit data (book icon) → today's Rules / Unit data screen.
  3. Home (house icon) → Home.
  - A 1px `#b8beb6` line, 4px above and below.
  4. `<Side> surrenders` (lowered-flag icon), text and icon `#c62828`. Shown only when a human side is to move and the match is live, as today. Keeps today's confirmation box.
- **Settings** is in the approved menu but its screen isn't designed yet: leave the item out. No dead buttons.
- Closing: ✕, tapping the dim, or Escape. Focus moves into the menu on open and back to Options on close.

### 3. Attack preview (replaces today's attack sheet)
Opens when the player picks an attack target, as today. A white sheet rises over the bottom of the field: border-top 1px `#b8beb6`, radius 14 at the top corners, overlaps the field by 14px, shadow `0 -6px 18px rgba(0,0,0,0.12)`, padding 10px 14px 12px, gap 10px. The target hex keeps its red outline on the field. Top to bottom:

**a. Grab handle and key drawer.** A 36×4 bar, radius 2, `#b8beb6`, centred. The key is **hidden by default**; dragging the handle up or tapping it opens it, down or tap closes it (`aria-expanded`). A first-time hint: the first two times a player opens an attack preview, show `Pull up for the key` in Plex Sans 500 11px `#5f6762` under the handle; after that, the handle alone. Remember the count in the board's local settings (wrapped in try/catch).

When open, above the face-off: a heading `IN THIS ATTACK` (Barlow 700 13px, letter-spacing 0.06em, `#5f6762`), then one row per icon that appears in this attack, in the order they appear (attacker side first, then defender). Each row: padding 7px 0, line under it `#eceee9`, gap 10px; the icon at 18px; then three lines:
- the name and number (Plex Sans 600 12px, ink; red `#c62828` for Parry): `Support +1`, `Evade 4`, `Armor`, `Brace`, `Parry`;
- what it means (400 11px `#5f6762`);
- why it applies here (500 11px, ink).

Wording, with numbers filled from the engine and the active rule set:

| Row | What it means | Why it applies here (example) |
|---|---|---|
| Support +N | +1 Strength for each friend next to the target. | Your Heavy Melee is next to it. (Name each supporter; "Your Heavy Melee and Light Melee are next to it.") |
| Half Strength (no icon: the row uses the Strength icon) | Ranged units have half Strength with an enemy next to them. | Your Light Melee is next to your Heavy Ranged. *(name the adjacent enemy)* |
| Evade N | A Light unit may move away after attacking a unit next to it, with the movement it has left, unless it kills. | 2 Stamina left after this attack: up to 4 hexes. *(the engine's number; if 0, its reason, e.g. "Tackled by Heavy Melee: needs 1 Stamina, has 0.5.")* |
| Armor | Heavy units take less from every hit. | Heavy Melee: −3. |
| Pierce | Heavy Ranged shots ignore Armor. | Heavy Melee's Armor −3 doesn't count. |
| Brace | A braced unit takes 2 less. | Heavy Melee braced last turn: −2. |
| Dodge | Light units dodge part of a hit, more with open ground around them. | 15%: two open hexes next to it. *(from the engine's Dodge breakdown)* |
| Parry | A braced Heavy Melee hits back at the first melee attacker each turn: 20% of the attacker's Strength. | You take 2. *(or "You take 2 if it survives the hit.")* |
| If it kills | The attacker moves into the target's hex. | Your Light Melee moves into D9, next to South's Heavy Anti-Cavalry. *(today's capture warning)* |
| Set Spear | A braced Heavy Anti-Cavalry deals 2 to an enemy that steps next to it. | If it kills, D9 is next to a braced Heavy Anti-Cavalry: you take 2. *(today's spike warning)* |

The key lists only what applies. It must still read well with six or more rows; let the sheet scroll inside itself rather than push the action panel off screen (flagged risk: the key doesn't scale well past about five rows).

**b. Face-off.** Three columns: attacker (flex 1) · centre · target (flex 1), gap 6px. **North is always on the left and South on the right**, whoever attacks. Each side, gap 6px, three rows, mirrored for the right-hand side (`row-reverse`, right-aligned):
- Token (24px, team colour, unit symbol in white as on the field) + unit name (Barlow 700 13px, ellipsis if long).
- HP number on the **outer edge** (`16/16`, Plex Mono 600 11px), then the HP bar filling the rest (height 7, radius 3.5, track `#dfe3dc`, fill team colour, width = HP share).
- Stats row (gap 10px): only numbers that **change this attack**, each an icon (14px, `#5f6762`) + number (Plex Mono 600 12px). Attacker: Strength (Maul), Support `+1`, Evade `4` (hexes left after the attack, from `evadePreview`; leave it out when Evade doesn't apply). Target: Armor `−3`, Brace `−2`, Dodge `15%`, Parry (red icon and red number, `2`, melee only, never ranged; leave it out if this unit has already parried this turn).
  - **A changed number** (e.g. Half Strength, or Armor cancelled by Pierce): the old number, then the new one 3px after it. The old number has a 1.5px diagonal line drawn through it from bottom-left to top-right. The new number is **red `#c62828` only when the change hurts the player whose turn it is** (their Strength 9 → 4.5 is red; the target's Armor −3 → 0 is ink). Decimals, never fractions: `4.5`.
- Centre column (top-aligned, 6px down): the from-square name, a red arrow (16px, stroke 2.2, `#c62828`, pointing from attacker to target), the to-square name; square names in Plex Mono 500 10px `#5f6762`. When South attacks North, the arrow points left.

**c. Outcome bar.** Three stacked rows, gap 4px, each split into equal slots, gap 2px:
- top: each outcome's chance (Plex Mono 500 10px `#5f6762`, one decimal: `2.8%`);
- middle: the bar, height 10, radius 3 on the outer ends; each segment ink `#1f2421` with opacity rising with damage (0.25 for the smallest, 1 for the largest, evenly spaced between); **a segment that kills (or brings the flag down) is solid `#c62828`**;
- bottom: the damage as a negative number (`−4.5`, Plex Mono 600 13px, ink; red when it kills).
- One slot per outcome from `dieCases` (5 today). **Neighbouring outcomes with the same damage merge into one wider segment**: it spans the slots it replaces, its chance is their sum, and it shows its number once. (At v3.4: Glance 2.8% · −25% 5.6% · normal 83.3% · +25% 5.6% · Crit 2.8%.)
- Damage values are the engine's (after Armor, Brace, Support, Dodge and rounding), never recomputed on screen.

**d. Actions.** The action panel's UNIT row becomes: **Attack** (3 parts wide) and **Cancel** (1 part), both 56px tall, radius 10, gap 6px.
- Attack: background and border `#c62828`, text white; sword icon 22px; beside it two lines: `Attack` (Plex Sans 600 15px) and `−1 Stamina` (500 11px, opacity 0.9) followed by the unit's Stamina as 9×9 squares (radius 2, 1px white border): the ones left after the attack filled white, the one(s) this attack spends at `rgba(255,255,255,0.35)`, empty ones hollow. For a Reach shot the label reads `Reach` (as today). Use the rule set's attack cost.
- Cancel: panel background, ink border, ✕ icon 22px over `Cancel` (600 11px).
- The TURN row (Undo, End unit, End turn) stays as it is.

Remove from the sheet: the title line, the sum line (`parts = value`), the dice row and the kill-chance sentence. Their information is now in the face-off, the bar and the key.

### 4. Unit card: in a match
**a. Compact unit bar** (shown whenever one of your units is selected, between the field and the action panel): background `#f8f9f5`, border-top `#b8beb6`, padding 10px 14px, min-height 66px, gap 12px.
- Token 30px; then name (Barlow 700 18px) over HP bar (70×6, radius 3) + `9.5/14` (Plex Mono 600 13px).
- Right column (gap 7px, right-aligned): hex icon 14px + square name (`E9`), and `→ 3` (hexes of movement left, from the engine); under it the Stamina squares (11×11, radius 2; filled ink = left, hollow = spent).
- An info button (ⓘ icon 24px, 44×44, no border) opens the full card.

**b. Full card** (bottom sheet over the field; the field dims): background white, radius 16 at the top corners, shadow `0 -8px 24px rgba(0,0,0,0.18)`, padding 10px 16px 20px, gap 14px.
1. Grab bar 40×4 `#b8beb6`.
2. Header: token 34px; side name (Barlow 700 11px, letter-spacing 0.12em, uppercase, team colour); unit name (Barlow 700 22px); `Ranged · Heavy · 1 UC` (Plex Sans 500 12px `#5f6762`: type · class · its unit cap). ✕ close 44×44 at the right (border `#b8beb6`, radius 10). **The close is at the top.**
3. Status row (gap 12px, wraps): HP bar 90×6 + `9.5/14`; Stamina squares; status chips, each a pill 26px tall, padding 0 10px, radius 13, 1px border and text in its colour, an 8px dot before the word, Plex Sans 600 12px:
   - `Reloading` (red `#c62828`), `Braced` (blue `#1f4fd8`, filled dot), `Braced last turn` (blue, hollow dot), `Holding the flag` (team colour). Only states the engine reports for this unit.
4. Stats strip: a row of equal boxes inside one border (1px `#b8beb6`, radius 10, background `#f8f9f5`); each box a number (Plex Mono 600 18px) over a label (Plex Sans 600 10px, letter-spacing 0.06em, uppercase, `#5f6762`): **Str**, **Range** (Anti-Cavalry shows **Reach**), **Move** (the movement cap). Values are the unit's current ones.
5. Ability sections, separated by 1px `#b8beb6` lines, gap 14px. Each section: a header (Barlow 700 12px, letter-spacing 0.1em, uppercase, `#5f6762`) with a sub-label after it (Plex Sans 500 11px, normal case); then each ability as a name (Plex Sans 600 15px) over one line of what it does (400 13px `#5f6762`). An ability that is a drawback carries a `COST` tag after its name (Plex Sans 600 10px, uppercase, colour and 1px border `#a8452f`, radius 4, padding 2px 4px).
   - **Trait** · sub-label the type (Melee, Ranged, Anti-Cavalry)
   - **Class** · Heavy or Light
   - **Unit** · the unit's name
   - **Special** · `Once a match`: **not in this build** (no unit has a special until brief 011). Leave the section out.
6. No swap buttons on the card (the approved design takes them out; dragging a unit onto a friend still swaps, as today).

**c. What each unit shows** (the active rule set's numbers fill every number; the text below is for v3.4):

| Unit | Trait | Class | Unit |
|---|---|---|---|
| Heavy Melee | **Tackle**: An enemy next to it pays its hex cost again, in Stamina and movement, to step away. | **Armor 3**: Takes 3 off every hit. **Mark**: Enemies that step next to it stop. | **Parry**: When braced, hits back at the first melee attacker each turn: 20% of the attacker's Strength. |
| Light Melee | **Tackle** (as above) | **Swift**: Half Stamina per hex, up to 4 hexes. **Dodge**: Dodges part of a hit, more with open ground around it. **Evade**: After attacking a unit next to it, may move away with the movement it has left. | **Weave**: When braced, its Dodge doubles. |
| Heavy Ranged | **Volley**: Shoots over any unit. Half Strength with an enemy next to it. | **Armor 2** | **Cover Fire**: When braced, projects Mark: enemies that step next to it stop. **Pierce**: Its shots ignore Armor. **Reload** `COST`: Can't attack on the turn after it attacks. |
| Light Ranged | **Volley** | **Swift**, **Dodge**, **Evade** | **Second Wind**: Its brace costs no Stamina next turn. |
| Heavy Anti-Cavalry | **Reach**: Attacks 2 hexes away, for 1 less. Can't reach past an enemy. | **Armor 3**, **Mark** | **Set Spear**: When braced, deals 2 to an enemy that steps next to it. |
| Light Anti-Cavalry | **Reach** | **Swift**, **Dodge**, **Evade** | **Fend**: When braced, attackers get no Support against it. |

Older rule sets (v1–v3.3) show what that rule set actually does, from its own switches and numbers (e.g. no Evade before v3.3, no Pierce wording difference). Where a rule set's behaviour can't be said in one line with these names, use the closest line and list it in the Report.

### 5. Unit card: Lineup screen
- Each unit row on the Lineup screen: background `#f8f9f5`, border 1px `#b8beb6` (the open unit's row: border team colour), radius 12, padding 8px 12px; token 30px; name (Plex Sans 600 14px) over `HP 20 · Str 10 · Range 1 · Move 3` (400 12px `#5f6762`; Anti-Cavalry says `Reach 2`); the − / count / + stepper on the right (40×40 round buttons, 1px ink border, count in Plex Mono 600 18px).
- Tapping a row's token or name opens the same card as 4b as a sheet over the screen (dim behind it), with these differences:
  - no side name, no status row;
  - the stats strip has **HP, Str, Range/Reach, Move, Stamina** (base values from the card);
  - a **pinned bottom bar** stays in view while the card scrolls: background `#d3e3da` (for South use the same lightness of `#a8452f`), border-top 2px team colour, padding 12px 16px 18px. Left: `IN YOUR LINEUP` (Barlow 700 16px, letter-spacing 0.06em) over `7 of 7 unit cap` (Plex Sans 500 12px `#36403b`). Right: the same stepper, live (it changes the lineup).
- Above the list, keep the Unit cap counter and change the hint to: `Pick 7. Any unit can hold the flag: place it on the flag hex when you deploy. Repeats are allowed.` (the number is the format's unit cap).
- No Cavalry rows until Cavalry exists (brief 012).

### 6. Action-button states (in-match action panel)
- **Attack, ready:** panel background, 1px ink border, sword icon over `Attack`.
- **Attack, reloading:** disabled; border and content `rgba(31,36,33,0.35)`; a 10px red dot (`#c62828`) 5px from the top-right corner; `aria-label="Attack, reloading"`.
- **Reach:** a second attack button only for units with the Reach trait (spear icon over `Reach`); the other units' rows have no empty slot.
- **Brace, ready:** shield icon over `Brace`.
- **Brace, braced:** 2px `#1f4fd8` border and a filled 10px blue dot top-right; `aria-label="Brace, braced"`.
- **Brace, braced last turn:** normal border, a hollow 10px blue ring (2px) top-right; `aria-label="Brace, braced last turn"`.
- Every greyed-out button keeps brief 005's rule: the reason comes from the engine.
- *(For brief 011, not now: Special unused = normal; warming up = 2px `#e2b53c` border, background `#f9eeda`, a 5px bar along the bottom half-filled `#e2b53c` over `rgba(226,181,60,0.3)`; charged = background `#e2b53c`, 2px ink border, full ink bar; used = disabled at 0.35.)*

### 7. Desktop
The approved v2 screens are drawn for phone only. On desktop keep v1's layout (field left, panel right) and put the new pieces in it: the top bar spans the full width; the attack preview, compact unit bar and full card render inside the right-hand panel at 390px wide instead of as bottom sheets; the Options menu opens over the Options button as on phone. List any judgement call in the Report.

### 8. "Unit cap (UC)", never "being"
Main already says unit cap on the Lineup counter, the Matches table and the tiebreak text (through `say()`). Lock it in: add a check (in the quick checks) that fails if any player-visible text the board can show contains "being" or "beings", case-insensitive. Cover at least the engine's result, log, tiebreak, block-reason and Evade-reason strings as the board shows them (the Evade "no step" reason on the attack sheet currently skips `say()`). Code identifiers and data field names (`beings`) stay as they are.

## Rules it touches
None. If the preview needs a number the engine only gives as text (e.g. `breakdown()` parts: Strength before and after Half Strength, Armor before and after Pierce, Support count and names, Dodge %), add a read-only structured field to the engine's preview output. No rule changes, no change to any preset; replay hashes must match.

## Bot minimum
n/a: screen only; the bot's choices don't change.

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes unchanged for all rule sets). The pull sheet, deployment, Home, New game and data screens look as today apart from the Lineup card. Undo, End unit and End turn behave as today.

## Checks before opening the pull request
- Every check in `README.md` passes; regression hashes pasted in the Report.
- New tests: the outcome-bar merge (equal neighbours merge, chances sum, count follows `dieCases`); the "changed number" logic (Half Strength shows 9 → 4.5 red for the attacker; Pierce shows Armor −3 → 0 in ink); Evade in the preview equals `evadePreview().hexes`, including a tackled case; the "no 'being'" check.
- Screenshots in the pull request, phone and desktop: attack preview (melee on a braced Heavy Melee, key closed and open; ranged with an adjacent enemy), full unit card for Heavy Ranged while reloading, Lineup card, Options menu open.

## The Editor's hands-on check
On the play link, on your phone: play a few turns. Open an attack preview on a braced Heavy Melee with a Light Melee (check Parry and Evade), and a Heavy Ranged shot with an enemy next to it (check the red 4.5 and Armor 0). Pull the key up once. Open Options and tap through. Open a unit card in a match and on the Lineup screen.

## Report
*Filled in by Claude Code, 19 Nov 2026. Branch `claude/lucid-fermi-wk5g34`, started from `brief/009-attack-preview-ui-v2`. Game version **v3.06.00 · Build 9** (UI v2).*

- **What's in:** all eight items. Match top bar (title row + Options, scoreboard re-laid with Player/Computer icons and a plain turn counter). Options menu (header with format, sides, rule set, bot, seed and version line; Match log and record, Rules and unit data, Home, Surrender; ✕ / dim / Escape; focus goes in and back). Attack preview (grab handle and key drawer, first-two-times hint, face-off, changed numbers, outcome bar from `dieCases` with merging, Attack 3 + Cancel 1 in the action panel). Compact unit bar and full unit card. Lineup rows and Lineup card with the pinned stepper bar and the new hint. Action-button states (reloading dot, braced / braced last turn, Reach only for Reach units). Desktop layout. The "no being on screen" check.
- **Engine change (read-only, no rule changes):** `breakdown()` now also returns `detail` (Strength before/after Half Strength and Reach, the supporters, Support, Fend, Armor and Pierce, Dodge %/open hexes or flat Dodge, Brace, defender Support, goal-zone reduction); `options().attacks[]` carries it. `evadePreview()` also returns `stam` (Stamina left after the attack). `status()` also returns `bracedLast` and `holder`. Nothing that decides play reads these.
- **New file:** `board/ui.js` holds the preview's and the card's wording and logic with no drawing, so `tests/test_ui.js` can check it. `say()` moved there from `app.js`.
- **Screenshots** (`briefs/img/009/`): phone and desktop each for: melee on a braced Heavy Melee, key closed (`*-A-preview-closed.png`) and open (`*-A-preview-key.png`); Heavy Ranged shot with an enemy next to it (`*-B-ranged.png`, shows 9 → 4.5 in red and Armor −3 → 0 in ink); Heavy Ranged card while reloading (`*-C-card.png`); Lineup card (`*-lineup-card.png`); Options menu (`*-menu.png`). The positions were reached with legal engine moves, not edited.
- **Choices the brief didn't make:**
  - *Desktop:* the preview, unit card and end-of-match sheet replace the roster in the right-hand column (390 wide, the column was 380). There is no dim over the field there, so you can tap another red ring while the preview is open. The Options menu opens over the centred Options button. The top bar keeps v1's centred 720 px content.
  - *Phone:* no dim behind the attack preview (the brief only asks for one behind the full card), so you can switch target by tapping another red ring. The key scrolls inside the sheet; the face-off and outcome bar always stay in view.
  - *Key rows the brief's table doesn't list,* shown only when they apply: **Reach −1** (spear icon, for Reach attacks), **Fend** (support icon, braced Light Anti-Cavalry with helpers next to it), **Holding the flag** (flag icon; the face-off also shows the flag's share as `+N`), and, for older rule sets only, **Goal zone / Keeper at home** and **Defender Support**. A **Parry** row in ink saying "Already parried this turn: no parry" stays in the key even though the stat is left out (today's sheet said this too).
  - *Reach* is a changed Strength number too (8 → 7, red), like Half Strength.
  - *"If it kills"* uses the hex icon (the brief gives none).
  - *Unit names* are card names, numbered when a side has two (`Heavy Melee 2`); the first of two shows as `Heavy Melee 1`.
  - *Compact unit bar:* it no longer shows the Dodge % and the small status icons; those are now on the full card (chips) and the action buttons. `→ N` is the furthest hex the engine lets the unit reach now (the cap on the other side's turn).
  - *Stamina squares* on the Attack button show halves as half-filled squares.
  - *"Braced last turn"* chip: the unit braced in its own previous turn and it is now its side's turn (engine `wasBraced`). On the other side's turn, a braced unit shows "Braced".
  - *Menu:* "Rules and unit data" opens Unit data; its back arrow returns to the match. The version line adds "(started on Build N)" when the match began on another build, as the old menu did. With two bots: "Bots: A vs B".
  - *Special button:* left as it was (greyed out, says why when tapped). See F30.
- **Card text I couldn't state exactly in one line with the brief's names:** none for v3.4. Older rule sets: Tackle before v3.3 says "pays 1 more Stamina to step away" (the flat cost); Mark before v3 says "stop, then may shift one hex" (zones weren't a hard stop); Dodge before v1 says "takes 1 off for every 4 Strength of a hit"; Parry before v1 is a flat amount ("1 damage") and before v3.2 hits back at "a melee attacker that hits it" (not only the first). The match3 Flagkeeper has no line on the card beyond "(Flagkeeper)" in the header and its lower Move: its home reduction isn't in the brief's ability table.
- **Anything beyond the brief, and why:** `test_ui.js` added to the `checks` workflow; README lists it. Nothing else.
- **Checks run and results:** all pass. test_rules, test_v1 (12), test_v3 (10), test_v31 (22), test_v32 40 (57), test_v33 (59), test_v34 (20), test_stamina (517), test_reasons (18), test_kitd full 30 games (9; 0 refused), test_brain5 at the CI size 2 (13; 0 refused; the full default count was stopped after more than 20 minutes because it isn't part of `checks`), test_watch (12), test_invariants (30 games, 0 problems), test_rng (20), **test_ui (61, new)**, test_replay (386 checks, 0 mismatches), lab self-test (34), board_check 10 games (0 different).
- **Regression hashes:** identical to the board from before this build, on both runs.
  - `node tests/regress_engine.js <board> 3` (same before and after):
```
match3       37397ef2bd3ed86b {"turn limit, more pull damage":1,"TKO":2,"KO":1,"turn limit, draw":1,"turn limit, fewer beings lost":1}
v1           7b25bca651c0cb31 {"turn limit, more pull damage":1,"TKO":2,"turn limit, fewer beings lost":1,"turn limit, draw":1,"KO":1}
v2           ddbe5fc437ff4e9d {"turn limit, more pull damage":2,"KO":2,"TKO":1,"turn limit, draw":1}
v3           26371927b53d4413 {"turn limit, fewer beings lost":1,"KO":2,"turn limit, draw":3}
v3.1         c71e4cd12fc984b0 {"turn limit, draw":3,"turn limit, fewer beings lost":2,"turn limit, more pull damage":1}
v3.2         f62a061d2c147d83 {"turn limit, fewer beings lost":3,"turn limit, draw":2,"turn limit, more pull damage":1}
v3.3         e6151bf463d6c9f8 {"turn limit, fewer beings lost":1,"KO":1,"turn limit, draw":3,"turn limit, more pull damage":1}
```
  - `node tests/regress_engine.js <board> 2 all` (every preset including v3.4, every brain): all 72 lines identical before and after. v3.4:
```
v3.4 standard        a8f8270aceb1eb9e {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"KO":1}
v3.4 easy            4d9a73c80a3cb225 {"turn limit, more pull damage":3,"KO":1}
v3.4 kitA            f65eba492e49eaaa {"turn limit, draw":1,"turn limit, fewer beings lost":1,"turn limit, more pull damage":2}
v3.4 kitA2           31439db204aa5ac0 {"KO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v3.4 kitC            de370a3a914caa7f {"turn limit, draw":1,"turn limit, more pull damage":3}
v3.4 kitB            88c03eedc951d875 {"turn limit, draw":2,"KO":2}
v3.4 batchC          88c03eedc951d875 {"turn limit, draw":2,"KO":2}
v3.4 kitD            73631bc545ab6f1a {"turn limit, draw":2,"KO":2}
v3.4 brain5          a8bc0b017ad55a10 {"turn limit, fewer beings lost":2,"TKO":1,"KO":1}
```
- **New tests (each listed in the brief):** outcome-bar merge (equal neighbours merge, chances sum, slots follow `dieCases` on every preset; v3.4 chances 2.8 / 5.6 / 83.3 / 5.6 / 2.8%); changed numbers (Half Strength 9 → 4.5 red for the attacker, also on South's turn; Pierce Armor −3 → 0 in ink); Evade in the preview equals `evadePreview().hexes`, including a tackled case showing 0 and the engine's reason; the "no being" check (engine log, result, tiebreak, block reasons and Evade reasons through `say()` over a seeded game on every preset and format; every preview key row met in those games; every card's text on every preset; and every line of `app.js`, `ui.js` and `index.html` that contains the word must be code). The Evade "no step" reason on the preview now goes through `say()`.
- **Skipped:** no simulations (screen only; no rule or bot change). The full test_brain5 count (see above).
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a (screen only)
- **Settings review (brain builds only):** n/a
- **Known gaps:** the pull preview keeps today's sheet (out of scope). Phone layout checked in a headless browser at 390×844 only; not on a real phone. The key's drag works on pointer release (no live drag animation).
- **Flags closed / opened:** none closed. Opened **F30** (keep or hide the greyed-out Special button until brief 011).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/18 (play: https://productofdefiance.github.io/Flagfall/pr/18/)
