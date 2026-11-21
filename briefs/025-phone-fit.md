# Brief 025 — Phone fit: more field on a phone, Approved UI v5

| | |
|---|---|
| Game version | **YY** (new screens: a real change), ZZ = 00. Code takes the number at its last sync before Ready for review. |
| Lane | UI |
| Rule set | none. No preset, no engine rule. |
| Date | 20 Nov 2026 |
| Goal | On a phone the field gets too little of the screen (293 px of 665 with a unit tapped, about 106 px under an attack preview). Give it 402 px in play and about 308 px under a preview, by removing the title bar in a match, slimming the panel, rebuilding the unit bar, and using one compact sheet for attack, special and flag pull. |
| Branch | Any branch your session may push to, started from `brief/025-phone-fit` |
| Flags | F017-4 (this build fixes it). Also mark F017-1 and F017-2 closed in `flags/017.md`: the Editor accepted both on 20 Nov (the two F017-2 readings are now in Game Laws 2.11). |
| Waits on | 017 |
| Order | **After brief 017 merges, and before brief 018** (the Editor, 20 Nov: this goes first in the build order). 018's turn tag, field buttons and match log are placed against this layout. Run `sync` first. |

## Context
The Editor's phone shows the game in **393 × 665** inside the browser (the phone is 393 × 852; the browser's bars take the rest). Earlier briefs assumed 390 × 844, so every phone screen so far was designed about 180 px too tall. From now on, phone screens are designed and checked at 393 × 665.

The design was worked out on the UI Brainstorm canvas, page **Phone fit**, Rounds 1 to 11, and approved by the Editor on 20 Nov as the 14 frames titled **Final 01 to Final 14** (they go onto the Approved UI canvas as page **v5** with this brief). Pictures of those 14 frames are in `briefs/img/025/` so you never need to open a canvas. **Where a picture and this brief differ, the brief wins.** The pictures also show three things that are brief 018's, drawn only to check positions: the match log button (top right), the zoom button (bottom right) and, in none of the final 14, the turn tag. Do not build those here.

Where the height goes today on 017's build, unit tapped, 393 × 665: title bar 61, scoreboard 89, field 293, unit bar 81, buttons 141.

Rules that apply: Game Laws 1.13 (what is shown is the true state), 1.16 (nothing empty is offered), 7.9 (symmetrical, elegant, clean). **Every number, hex, route and outcome on screen still comes from the engine functions brief 017 added; this brief moves and restyles them, it computes nothing new** (CLAUDE.md pitfall 1).

## Scope
In, **phone layout only** (under 900 px wide): the in-match top bar, the field buttons, the unit bar, the action panel's sizes, the warm-up note, and one sheet for the attack preview, the special preview and the flag pull.
Out: every desktop screen (900 px and wider keeps 017's layout untouched); the turn tag, hot-seat views, zoom and match log (brief 018); the Options menu; the info card's own layout; deployment's own layout (only the panel sizes in section 4 reach it); any rule, any preset, the bot; opening the game from the home screen as an app (not approved, not in this build).

## What to build

### 1. Top bar in a match
- **No title bar during a match.** The "FLAGFALL: Arena" name, its rule line and the menu button leave the dark top bar on the play screen. Every other screen (Home, set-up, lineup, sheets) keeps its title as today.
- **Scoreboard:** padding 9 px top, 16 px sides, 11 px bottom; 8 px between its three rows. Nothing in it moves or changes size. With the 3 px side-to-move underline the whole top bar is **84 px** (was 150).

### 2. Field buttons
One look for every button that floats on the field: 44 × 44, radius 10, background ink `#1f2421`, icon `#f8f9f5` 20 px, 1.5 px white border, shadow `0 2px 6px rgba(0,0,0,0.25)`. (This is brief 018's field-button look, section 7 there; use it now so 018 changes nothing.)
- **Menu** (the same Options button, same icon, same menu): on the field, **left 8 px, its top 38 px below the bottom of the scoreboard**. It mirrors where 018 will put the match log button on the right, so both top corners of the field stay free for 018's turn tag.
- **Hex names:** the board's own hex-name icon, unchanged (the Editor, 20 Nov: keep the old icon). Position: **right 8 px, bottom 60 px**. (018 adds the zoom button under it at bottom 8 px; until then that slot is empty.) Its pressed state is 018's: light `#f8f9f5` button with an ink edge and ink icon.
- **The "Pull up for the key" tab on the field is removed.** The key opens from the handle on the unit bar (section 3) and from the handle on the sheet (section 6). The key drawer itself is unchanged.
- The top and bottom edge pills (off-screen units and the flag) stay where they are.

### 3. Unit bar
**63 px tall in every play state** (nothing tapped, unit tapped, move previewed, enemy tapped, warming up, Evade step), so the field never jumps when a unit is tapped. Background and top line as today. Padding 0 top, 14 px sides, 9 px bottom.

- **Handle:** a bar 36 × 4, radius 2, `#b8beb6`, centred, 5 px above and 5 px below it. It opens the key (the same action the field tab had). The whole top 24 px of the bar is its touch area. Not shown when nothing is tapped.
- **Two rows, 6 px apart, in two columns 10 px apart:** a left column that takes all spare width and a right column as wide as its content.
  - **Row 1, left (22 px tall):** the unit's token 24 px; the unit's **full name** (Barlow Condensed 700, 17 px, letter-spacing 0.02em, one line); the **(i)** mark 16 px, `#5f6762`; then the **chips**, right-aligned so they end at the left column's right edge (which is the HP bar's right end) and grow leftward toward the (i). 8 px between items, 5 px between chips.
  - **Row 1, right (22 px tall):** the hex icon and the unit's hex, then the arrow and moves left (as today: IBM Plex Sans 600, 13 px, 8 px apart). Enemy tapped: `Next turn` and its moves, as today.
  - **Row 2, left:** the HP bar, 6 px tall, across the whole left column.
  - **Row 2, right:** the HP number (`12/12`, 600 13 px), then the Stamina squares, 8 px apart.
- **Chips** (the dangers and costs of a previewed move, from `route().events`, in walking order, filling from the right): pill 17 px tall, radius 8.5, padding 0 7 px, white text IBM Plex Sans 700 11 px, icon 12 px; ink `#1f2421` for a stop or a cost (Mark icon; `+0.5` for tackle), red `#c62828` for damage (Set Spear icon and its number).
- **Move previewed:** row 1 right shows the route in place of hex and moves: from-hex in `#5f6762`, the arrow icon, to-hex in ink (600 13 px). The Stamina squares show the cost as today. There is **no separate route row any more**: the bar does not grow.
- **Nothing tapped:** one line, left-aligned, in today's muted style: **`Tap a unit`** (was "Tap one of your units": an enemy can be tapped too).
- **Tap area for the card:** the (i) mark alone is too small to tap. The token, name and (i) together are one button that opens the unit card (`aria-label` "Unit information"), at least 44 px tall.
- **The name and the (i) are never moved, shrunk, truncated or covered** by chips or anything else. If chips would not fit beside the longest name, the chips stop at the (i) with 8 px to spare and the overflow shows as a last chip `+N`; say so in the Report if it ever happens in play.

### 4. Action panel
- Padding 6 px top, 10 px sides, 8 px bottom; 5 px between the two rows. **Every action button is 48 px tall** (was 56). The panel is **116 px** (was 141). Widths, order, icons, colours and states are unchanged.
- **A button's label never wraps.** One line always, in every state and for every unit (`white-space: nowrap`).
- **A special's name must fit its idle button on one line at 393 px.** Today's six fit (Arrow Storm, the longest, is 65 px of the button's 85 px inside width; about 14 characters is the limit). Add a check (section "Checks") so a longer name fails the build rather than wraps. The Special button keeps the special's name in every state, as brief 011 built it.
- Deployment and the Options sheets use the same button height and paddings; nothing else about them changes.

### 5. Warming up
- The line of text above the buttons is removed, so the panel keeps its 116 px.
- The note moves into the unit bar, row 1, in the chips' place (right-aligned, ending above the HP bar's end): **`Fires next turn · no attack or brace`**, IBM Plex Sans 500, 11.5 px, `#5f6762`, one line. Row 1's right side (hex and moves) is hidden while it shows.
- The confirm button reads **`Warm up <name>`** (`Warm up Arrow Storm`), with `−1 Stamina` and the squares under it as today. One line; if a name is too long for it, the button reads `Warm up` and the name stays on the Special button's label rule above.
- Warming up again on a firing turn (brief 011's re-warm) uses the same note and button.

### 6. One sheet for attack, special and flag pull
The three previews share one layout. **While the sheet is open it takes the unit bar's place** (the unit bar is hidden; the sheet names both units and shows their HP). The sheet sits directly above the action panel, full width, with today's rounded top corners and shadow. Side padding 14 px, top padding 9 px, bottom padding 12 px. Blocks from top to bottom:

**6.1 Name strip.** Three columns: left unit, handle, right unit; the two outer columns are equal, the handle is always dead centre whatever the names' lengths.
- Left: token 22 px, the unit's **full name** (Barlow Condensed 700, 14 px, one line), the (i) mark 15 px `#5f6762`; 6 px apart; starting at the left edge.
- Right: mirrored: (i), name, token, ending at the right edge (the token outermost).
- Handle: 36 × 4, radius 2, `#b8beb6`. It opens the key, as the old handle did. The whole strip is its touch area except the two name blocks. The words "Pull up for the key" are not shown.
- Each name block (token, name, (i)) opens that unit's card. Never moved, shrunk, truncated or covered.
- The strip sits 3 px lower than the sheet's top padding alone would put it.

**6.2 HP row**, 5 px under the strip. Left: HP number at the outer edge, then the bar. Right: the bar, then the HP number at the outer edge. Bars and numbers as today. **Between the two bars, on one line, vertically centred on the bars: the two hexes and the arrow** (`G9 → G10`): IBM Plex Sans 500, 10 px, `#5f6762`; arrow 12 px in the action's colour as today (red for an attack or a pull, gold for a special); 3 px apart. The two bars are always level with each other.

**6.3 Modifier row**, 5 px under the HP row. Left side: the attacker's modifiers, **right-aligned, ending at the left bar's right end**. Right side: the target's, **left-aligned, starting at the right bar's left end**. 8 px between modifiers. Each: icon 14 px, then the number IBM Plex Sans 600, 12.5 px, in the icons' grey `#5f6762`, 3 px apart. On the right side the number comes before its icon, as today. Parry sits in this row with the target's other modifiers, in red as today (the Editor, 20 Nov). When a side's modifiers do not fit on one row, the extra ones go on a **second row below, 4 px lower**, aligned the same way; the HP bars do not move. The row is 14 px tall even when a side has none.
- **A changed number** keeps brief 009's rule (the old number struck with a diagonal, the new one beside it, red only when the change hurts you), at 12.5 px.
- **A special's multiplier** is the exception: show the base Strength, then the multiplier beside it, 4 px apart, nothing struck and no second icon: **`9 ×1.75`** (was `9` struck, `15.75`, and a separate `×1.75`).

**6.4 Outcomes**, 13 px under the modifier row: percentages, bar and damage numbers exactly as today (a special keeps its single segment and `100% · no dice`).

**6.5 Results under the outcomes** (what brief 017 calls kill consequences), 4 px under the damage numbers, pills as today (15 px tall, icon 11 px, number 700 10 px).
- **Over a range of outcomes:** a thin bracket spans exactly the outcome columns the results apply to: a 1.3 px `#5f6762` line with a 6 px tick up at each end, the pills centred on it in a gap of 5 px each side.
- **Over one outcome only:** no bracket. The pills sit to the left of that outcome's column, 5 px from it; one 1.3 px `#5f6762` line runs from them to the middle of the column and turns up 9 px to it.
- Either way the row is 15 px tall, with 4 px above it and the sheet's 12 px below.

**6.6 Flag pull.** The same sheet (the old pull sheet with its grid of dice results is removed).
- Left: the pulling unit, as an attacker (its Strength and any Support as modifiers).
- Right: the flag: a round token 22 px, `#b07a33`, with the white flag glyph 12 px; the name `South flag` or `North flag` (in full); no (i); its own HP number and bar in `#b07a33`. The hexes between the bars are the puller's hex and the flag's.
- Outcomes: the engine's pull outcomes (the same seven as the old sheet), as percentages, bar and damage, without the dice roll numbers, like an attack. An outcome that brings the flag down is a red segment; the others grey.
- Result: one red pill, flag glyph and **`Flag falls`**, bracketed over the outcomes that bring it down (section 6.5).
- Buttons: **Pull** takes the three attack slots (red, the attack colour, the flag icon 22 px, `Pull`, `−1 Stamina` and the squares, from the engine), **Cancel** takes Brace's slot, as an attack does.
- A held flag is not pulled; it is attacked through its holder with the ordinary attack preview (unchanged).

Sheet heights at 393 px for reference (field left in view in brackets): attack with results 157 (308); attack without 138 (327); special 138 (327); flag pull 155 (310).

### 7. Not drawn, use these readings and flag them
These states exist in play but were not drawn or approved. Build them as below, list each in the Report with a screenshot, and raise an `ASK` in `flags/025.md` if any reading does not work.
- **Evade step:** the unit bar as in section 3; the Evade chip (icon and total hexes) sits in the chips' place; previewing an Evade hex shows the route in row 1 right, as a move does.
- **A unit that can't move:** `No movement available this turn` sits in the chips' place in the warm-up note's style (500, 11.5 px, `#5f6762`); row 1 right stays.
- **A special with several targets** (Arc Hit's extra target rows): keep the rows as built, between the modifier row and the outcomes, names in full.
- **The key drawer** opens from either handle and is unchanged inside.

## Rules it touches
None in the engine. On screen: 1.13 and 1.16 (every value shown is the engine's; nothing empty is offered). Tests in `test_ui.js`: the play screen under 900 px has no title bar and no key tab; the unit bar is the same height with nothing tapped, a unit tapped, a move previewed, an enemy tapped and a warm-up open; with a preview sheet open the unit bar is hidden; no action button's label wraps for any unit or state at 393 px; every special's name in the newest preset fits its idle button at 393 px.

## Bot minimum
n/a: nothing the bot can do changes.

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes). The engine. Every desktop screen. What any button does. The attack maths and every number shown. Brief 017's field marks.

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes match the board before this change.
- The new `test_ui.js` checks above pass.
- Screenshots **at 393 × 665** (and one set at 390 × 844 to show nothing breaks on a taller phone) of the 14 approved states, named as the pictures in `briefs/img/025/`, plus the four states in section 7. Put them beside the approved pictures in the Report.
- A table in the Report: at 393 × 665, the height of the top bar, field, unit bar and panel, and the field left in view, for each of the 14 states. Expected: top bar 84; unit bar 63; panel 116 (deployment's bench may be taller); field 402 in play, about 308 to 327 under a sheet.
- Desktop at 1280 × 800: one screenshot of a unit tapped and one of an attack preview, identical to 017's.

## The Editor's hands-on check
On your phone, in the browser, one 7v7 against the bot:
1. Before tapping anything: no title bar, the menu button at the field's top left, the bar reads "Tap a unit".
2. Tap one of your units, then an enemy: the bar stays the same height and the field doesn't jump.
3. Preview a move next to an enemy Melee unit: the chips end above the end of the HP bar.
4. Preview an attack: both full names and both (i) show, the HP bars sit under the names, the modifiers under the bars, and you can still see about five rows of field.
5. Warm up a special, then fire it next turn: the note sits in the unit bar; the button label is on one line.
6. Pull a flag (move a unit next to an empty enemy flag and tap the flag): the new sheet, a red Pull button, "Flag falls" bracketed.
7. Open the menu from its new place.

## Report back
The height table and the screenshot pairs above; the four section 7 states; anything in the approved pictures you could not match and why.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a
- **Settings review (brain builds only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
