# Brief 018: Turn cue, hot-seat views and field zoom (Approved UI v4)

| | |
|---|---|
| Game version | Next free **YY** at merge (new screens and a new setting: a real change), ZZ = 00. Take it when you open the pull request; re-check after any `sync`. |
| Lane | UI |
| Rule set | **No rule change, no new preset.** Every preset plays and replays exactly as before. |
| Date | 19 Nov 2026 |
| Goal | Make a turn change in human-vs-human games impossible to miss (a text cue, plus three ways to hold the phone), and let players zoom the field on every format so 9v9 and 13v13 are usable on a phone. Build the screens the Editor approved on 19 Nov as Approved UI v4. Give phones a full-screen match log, with the same rows in desktop's Recent list. |
| Branch | Any branch your session may push to, started from `brief/018-turn-cue-zoom` |
| Flags | none to close |
| Status | **Ready to build** (the UI chat, 20 Nov): the mobile match log is designed, approved by the Editor (UI Brainstorm, Match log page, Round 8) and added as section 10. Wait for the Order below. |
| Waits on | 017, 025 |
| Order | **After brief 025 merges, and before briefs 026 (specials flow) and 012** (the Editor, 21 Nov: 018, then 026, then 012 Cavalry; 026 rebuilds the special row and sheet on this brief's panel and drawing code). Earlier: (the Editor, 20 Nov: 017, then 025 Phone fit, then this; 025 changes the phone layout this brief places its tag, buttons and log against). Originally: **After brief 017 merges** (017 adds the flag pill, the token HP position, the badges and Plex Sans numbers that this brief scales; same drawing code) and **before brief 012** (012 makes 9v9 and 13v13 playable; their hexes are too small to use on a phone without zoom). 014 (fields and the hot-seat snap) is already in by then. Run `sync` first. |

## Context
**Built on brief 025's phone layout (added 20 Nov).** Read brief 025 first. What it changes for this brief, on phones (under 900 px):
- The Editor's phone shows 393 × 665 inside the browser. Take every phone screenshot this brief asks for at **393 × 665** as well as 390 × 844, and report the visible field height at both.
- There is no title bar in a match: the dark top bar is the scoreboard alone (84 px). The edge tag hangs from it exactly as section 2 says.
- The menu button already sits on the field at the top left (left 8 px, 38 px below the scoreboard) in the field-button look of section 7. It mirrors this brief's match log button (section 10.1). In view 3 it turns with the other field buttons.
- The hex-name button is already bottom right in the dark look, at the position section 7 gives it; this brief adds zoom under it.
- The "Pull up for the key" tab on the field is gone; the key opens from the handle on the unit bar or on a preview sheet.
- The unit bar is 63 px in every play state and the action panel 116 px; an open preview sheet takes the unit bar's place. "The top of the action panel" in section 7 means the top of the unit bar when no sheet is open.

The match log (section 10) was designed on the UI Brainstorm, page **Match log** (Rounds 1 to 8); the Editor approved Round 8's log and specials screens for build on 20 Nov. Its overtime screens are not part of this brief (see section 10.9).

Designed on the UI Brainstorm canvas, pages **Turn cue** (Rounds 1 to 3) and **Field zoom** (Round 2), approved by the Editor on 19 Nov; the screens go onto the Approved UI canvas as page **v4**. The idea rows are in the Ideas Log's UI table. This brief carries every size, colour and word, so you never need to open a canvas.

Rules that apply: Game Laws 2.5 (the hot-seat snap, built by 014), 1.13 (what is shown is the true state), 7.9 (symmetrical, elegant, clean). Nothing here changes how the game plays.

Why: in a hot-seat game nothing says the turn has changed; today's 3px underline under the scoreboard is easy to miss. And at full phone width a hex is 53 px wide on 7v7, 44 px on 9v9 and 37 px on 13v13 (44 px is the usual comfortable tap size; a 13v13 token's HP number would be about 7 px).

## Scope
In: the turn cue (edge tag); a hot-seat view setting with three views; view 2's field spin; view 3's turning chrome; field zoom (pinch, a two-step zoom button, limits); icons-only tokens when zoomed out; the flag pill scaling with the hex; hex names centred; the hex-name button moved and restyled; desktop equivalents; the mobile match log, its field button and settings bar, and the same rows in desktop's Recent list; a display-only event list in the engine for the log (section 10.8).
Out: tablet layouts (later, for every screen); the redesigned game set-up screens (later; this brief adds one field to today's Settings step); any rule change; overtime dividers in the log (they come with the overtime briefs); tapping a log row to see it on the field (parked).

## What to build

### 1. Who gets what
| | Human vs human (both players Human) | Against the bot, watch and replay |
|---|---|---|
| Turn cue (section 2) | Yes | No |
| Hot-seat view setting (section 3) | Yes | No: always view 1 |
| Snap (Game Laws 2.5, from 014) | Yes, in every view | No (as 014) |
| Field zoom (section 6) | Yes | Yes |

### 2. The turn cue: edge tag
Shown each time play passes to the other side: during play (including the first turn after the start cover) and during hot-seat deployment (each time the other side starts deploying, once its cover is dismissed).

- **Where:** hangs from the bottom edge of the scoreboard (the dark top bar), flush against the **outer screen edge on the side to move's half**: North's at the left edge, South's at the right edge. It sits over the field's empty corner beside the oval, so it covers no hex at far zoom. The 3px side-to-move underline stays as it is.
- **Look:** background = the side's light colour (North `#8fd0b4`, South `#f0a48f`, read from the skin by side); text `#1f2421`; Barlow Condensed 700, 12px, letter-spacing 0.12em, uppercase; padding 6px top, 7px bottom, 16px on the screen-edge side, 12px on the inner side; one rounded corner, 9px, on the inner bottom corner only (North: bottom right; South: bottom left); shadow `0 3px 8px rgba(0,0,0,0.18)`; max width 50% of the screen, ellipsis if a name is long.
- **Words:** in play `<side's name> PLAYS`; in deployment `<side's name> DEPLOYS` (the Editor, 19 Nov), from the match's names (`st.names`), so a renamed side shows its name: "NORTH PLAYS", "SOUTH PLAYS", "NORTH DEPLOYS", "SOUTH DEPLOYS".
- **Jersey-safe:** text colour is picked by contrast against the tag colour: ink `#1f2421` unless white gives a higher ratio; it must reach 4.5:1. Put the pick in the skin, so jersey colours can change later.
- **Shows and goes:** appears when the turn changes (after view 2's spin and the snap, section 4). It stays until the side to move first touches or clicks anything (field, panel, top bar); then it slides up into the underline (150 ms) and stays hidden until the next turn change. That first touch still does what it would have done; the tag never swallows it. **No timer:** in hot seat the phone is being handed over, so a cue that fades by itself plays to nobody.
- **Access:** `role="status"`, `aria-live="polite"`; pointer-events none.
- **Desktop:** the same tag; no snap (the whole field fits, as 014).

### 3. Hot-seat view setting
A new field on the Settings step (step 1 of 3), shown only when both players are Human, after "Moves first":

- Label: **Hot-seat view**
- A segmented control (the existing `seg`), three options, default **Handoff** (names from the Editor, 19 Nov):
  - `handoff`: **Handoff**. Hint: "Pass the phone. North stays at the top."
  - `flip`: **Flip**. Hint: "Pass the phone. The field turns so your flag is always at the bottom."
  - `table`: **Face to Face**. Hint: "Phone flat between you. The screen turns to face whoever is playing." Offered only on screens narrower than 900px; on wider screens the option is hidden and a saved `table` falls back to `handoff`.
- **Changeable mid-match** (the Editor, 19 Nov): in human-vs-human games the in-match Options menu gets a row **Hot-seat view** with the same three options (a segmented control; Face to Face hidden at 900px and wider). A change takes effect at once, with the same turn animation as a turn change (no snap).
- Saved with the match options (like `first`) so a reloaded match keeps it. It changes only the display: the engine never sees it, and a replay of the match plays identically under any view.

### 4. The three views
- **View 1, Handoff:** today's layout. North's flag at the top of the field. Snap as 014.
- **View 2, Flip:** the field is drawn so the **side to move's flag is at the bottom**. Only the field turns; the top bar, scoreboard (North always on the left), panel and every control stay where they are.
  - **The spin:** on each turn change in play, the field layer rotates 180° about the centre of what is on screen, 400 ms, ease-in-out. The tag is hidden during it. Then the field is redrawn for its new orientation with everything readable upright: unit tokens, HP numbers, the flag pill, hex names, badges. Badges keep their screen corners (top right stops you, top left hurts you, bottom right you can't, bottom left costs you), so they are placed by screen position after the turn, never rotated with the field. Then the snap (to the mover's own flag end, which is now always the bottom). Then the tag appears.
  - Hex names never change (G4 is G4 whichever way up). Routes, ranges and every engine answer are unchanged; this is drawing only.
  - `prefers-reduced-motion`: no spin; the field swaps orientation at once.
- **View 3, Face to Face:** the phone lies flat between the players, North at the bottom edge, South at the top edge.
  - **The field never moves:** North's flag stays at the bottom of the screen, South's at the top, all match long.
  - **Everything else turns to face the side to move:** on South's turn the whole interface except the field is rotated 180°: top bar, scoreboard, tag, field buttons, action panel, sheets, the key drawer, the Options menu, dialogs, toasts and covers. On North's turn it is upright. Turn: 400 ms, ease-in-out, or at once with reduced motion. So on South's turn the top bar sits at the physical bottom of the phone (upside down for North) and the panel at the top, nearest South.
  - **Field labels face the mover:** the field's geometry stays fixed, but tokens, HP numbers, the flag pill, hex names and badges are redrawn upright for the side to move (badge corners as seen by the mover).
  - Snap: to the mover's own flag end (North's turn: the bottom; South's turn: the top of the screen, which is South's near end).
- In every view, colours, marks, ranges and previews are as in briefs 009 and 017.

### 5. Hex names
- Names are drawn **centred in the hex**, vertically and horizontally (today they sit high, at 0.3 × hex height above the centre). Plex Sans 8px, `#5f6762`, as today otherwise. A unit on the hex covers its name, as now. The flag hexes show no name, as now.

### 6. Field zoom
Hex width below means point to point (2 × the hex radius), in CSS px.

- **Far:** the field fills the width of the field area (today's size). On desktop, far = the whole field fits the field area (today).
- **Close:** hexes **60 px wide**, on every field, so close looks the same whatever the format.
- **Minimum:** the whole field in view, top to bottom and side to side (about 25 px hexes on 13v13 on a 390-wide phone). Never larger than far.
- **Maximum:** hexes **90 px wide**.
- **Pinch:** two fingers zoom freely between minimum and maximum, about the point between the fingers. One finger dragging on the field pans when the field is larger than the view.
- **Gestures never leak:** a touch that moves more than 8 px is a pan, never a tap, a move preview or a selection. A second finger cancels any tap, preview or drag in progress. Drag-to-swap (one finger starting on your own unit) works as today at every zoom.
- **The zoom button** (section 7) snaps to close or far. It shows **zoom in** whenever the current zoom is further out than close (more than 2% smaller), and **zoom out** at close or nearer. Zoom in goes to close, centred on the selected unit if one is selected, else on the centre of the view; zoom out goes to far. Animated, 250 ms. If far and close are within 10% of each other on a screen, the button is hidden (pinch still works).
- **Through turn changes** the zoom stays where it was; the snap (2.5) moves within it, and when the field is wider than the view it also centres across on the mover's own flag.
- **Desktop:** mouse wheel over the field zooms about the pointer; dragging an empty part of the field pans; `+` and `−` keys zoom in and out like the button. The button works the same.

### 7. Field buttons: hex names and zoom
Both sit on the field area's **right edge, near the thumb**, inside the visible field, stacked:
- **Zoom:** right 8px; its bottom edge 64px above the bottom of the visible field (the top of the action panel on phone).
- **Hex names:** directly above zoom, 8px gap (moved from the top right, where South's tag now goes). Both top corners of the field are left free for the tag; the match log button (section 10.1) sits below the tag's height at the top right, never in the corner itself.
- **Look (both):** 44 × 44, radius 10, background ink `#1f2421`, 1.5px white border, shadow `0 2px 8px rgba(0,0,0,0.25)`, icon 20px `#f8f9f5`. Hex names **on** (`aria-pressed="true"`): background `#f8f9f5`, 2px ink border, ink icon. No team colour.
- **Labels:** zoom `aria-label` "Zoom in" or "Zoom out" to match the icon; hex names "Show hex names" with `aria-pressed`.
- In view 3 both buttons turn with the rest of the interface, so they always sit at the mover's bottom right.

### 8. Zoomed out: icons only
When hexes are **narrower than 50 px**:
- Unit tokens drop the HP number and show the unit icon centred in the token at 0.42 × token radius (was 0.33, set 3.5px above centre). The token's size, colour and rings are unchanged.
- The flag pill drops its number and shows only the flag icon (pill width 16 at the 7v7 scale below, scaled the same way). The flag's HP is always in the scoreboard.
- At 50 px and wider, everything shows as 017 built it.
- Today that means: 7v7 at far (53 px) keeps numbers; 9v9 (44 px) and 13v13 (37 px) at far show icons only; tap a unit for its HP in the panel, as today.

### 9. The flag pill scales with the hex
017 builds the pill at a fixed 30 × 15 px; on small hexes it covers the holder's icon. Scale every pill measurement by **hex height ÷ 46.26** (46.26 px is the 7v7 hex height at far on a 390-wide phone, where 017's pill was approved): pill width, height, radius, icon size, text size and the icon and text offsets. At 7v7 far it is exactly 017's pill. Position unchanged: centred on the flag hex's outer flat edge (in view 2 and 3, the edge away from the field's middle as drawn on screen).

### 10. The mobile match log
Approved by the Editor, 20 Nov (UI Brainstorm, Match log page, Round 8: the log and the specials examples; the way in from Rounds 2 and 3). Colours: ink `#1f2421`, muted `#5f6762`, paper `#e9ece6`, card `#f8f9f5`, line `#b8beb6`, row rule `#dfe3dc`, red `#c62828`, flag `#b07a33`, gold `#d9a514`, brace `#2e3338`, side light colours from the skin (North `#8fd0b4`, South `#f0a48f`). Fonts: Barlow Condensed and IBM Plex Sans with tabular figures, as the board uses today.

#### 10.1 The way in (phone)
- A third field button, **Show match log** (`aria-label`), the board's `list` icon. It sits at the field area's **top right**: right 8px, its top **38px below the bottom of the scoreboard**, so it clears South's edge tag (about 25px tall). Same look as the other field buttons (section 7: 44 × 44, radius 10, ink, 1.5px white border, shadow, 20px light icon).
- Tapping it swaps the **field area only** for the log. The top bar, scoreboard, edge tag and action panel stay where they are and keep working. Hex-name and zoom buttons hide while the log is open.
- In the log the same button, in the same screen position, becomes **Show field** (icon below) and swaps back. The zoom and scroll position of the field are kept.
- In view 3 (Face to Face) the button turns with the rest of the interface.
- The log is available in every game type (bot games, hot seat, watch and replay). It shows only what has happened, so nothing in it is hidden information.

#### 10.2 The settings bar (top of the log)
- Height 90px, paper background, 1px line at the bottom. It stays at the top of the log; the rows scroll under it. Its right 66px are kept clear for the Show field button. Its top 33px are kept clear for the edge tag.
- **Line 1** (from 33px down, left 14px): the format, Barlow Condensed 700 22px ink ("7v7", "5v5 Blitz"), then 10px later Barlow Condensed 700 11px, letter-spacing 0.12em, muted, uppercase: "FOOT ONLY · RULES V3.6" ("FOOT ONLY" only for a format without Cavalry; the rule set's id).
- **Line 2** (8px below), IBM Plex Sans 500 12px ink, items 14px apart, never wrapping: hourglass icon 13px + the turn limit ("35 turns"); the opponent: bot icon + "vs Brain 5" (the brain's name), or person icon + "Hot seat" in a human-vs-human game; an 8px dot in the side's light colour + "North first" (who moved first).
- It always shows the match's real settings and never changes during a match, overtime included (the Editor, 20 Nov). New settings (overtime choice, rounds) join line 2 when they exist.

#### 10.3 Order
Newest turn at the top; inside each turn, actions in play order, first action first (the Editor's Option B). The log opens scrolled to the top and updates live while open. An undone move disappears from the log, because the log follows the engine's state. The last line at the bottom: "Both sides deployed · North moves first" (Plex 500 12px muted, centred, 16px padding).

#### 10.4 Turn dividers
- One per side-turn: padding 9px 14px, ink background, text `#f8f9f5`.
- Left group: a 10px dot in the side's light colour, then "TURN 10" (Barlow Condensed 700 13px, letter-spacing 0.12em). No side name: the dot's colour and the side of the band say it.
- Right group, IBM Plex Sans 500 12px, `rgba(248,249,245,0.85)`, items 12px apart: a 9px square (radius 2, `#f8f9f5`) + Command used/available that turn ("3/10"); if that turn removed enemy units, the out icon (✕, 13px, `#ff9a8a`) + the count; if the side lost units on its own turn (Parry, set spear), the Parry icon (13px, `#ff9a8a`) + the count; if the enemy flag changed, the flag icon (13px, in the enemy side's light colour) + "7 → 3.5".
- South's dividers are mirrored: the dot and TURN at the right, the summary at the left (both groups `row-reverse`).
- `role="heading"`, `aria-label="Turn 10, South"`.

#### 10.5 Rows
- Each row is a `<button>`, full width, min-height 52px, padding 10px 12px 10px 14px, card background (white when open), 1px row-rule bottom border. A 3px strip in the acting side's light colour runs down the row's **outer edge**: North at the left, South at the right.
- **Main line**: a grid, columns `88px 34px 1fr 36px 72px`, gap 8px, items centred vertically, min-height 30px:
  1. **Unit:** a 30px token slot (the 22px unit disc, the unit icon in white), then 6px, then its hex name (Plex 600 13px ink). A unit braced at that moment wears the brace ring inside its slot (circle r 13.4 in the 30px box: 3.6px white under 2.2px brace charcoal). A unit warming up a special wears a dashed gold ring (2px, dash 3 2.4); one firing it, a solid gold ring (3px). A flag holder gets the **holder mark** after its hex name: a 16px flag-in-a-hex icon in flag colour (below), so it is never read as flag health.
  2. **Action icon**, 18px, centred: Move `move` (muted), Evade `evade` (muted), Attack `attack` (ink; red when it removed the target), Reach `spear` (ink; red when it removed the target), Brace `brace` (brace charcoal), Pull `flag` (flag colour), Warm-up and Special `special` (gold).
  3. **Target:** the target's token slot and hex name (as column 1, its own brace ring and holder mark). For a move, the destination hex after an empty 30px slot and 6px, so every hex name in the column lines up; when a Mark stopped the move, the `mark` icon (15px ink) 6px after the hex. For a pull, a flag pill (30 × 22, radius 11, flag colour, white 14px flag). For a warm-up, the special's name (Plex 600 13px gold).
  4. **Stamina:** a 9px square (radius 2, ink) + the Stamina spent (Plex 500 12px muted), on every row.
  5. **Result**, right-aligned: damage "−7.5", Plex 600 17px tabular, ink; red when it removed the unit; a pull's damage in flag colour. For a move, the hexes moved: the hex-outline icon (15px muted) + the number (Plex 600 15px ink). Braces and warm-ups show nothing here.
- **Second line** (5px below, same grid, Plex 500 12px ink), for attacks, Reach, specials and pulls:
  1. Under the attacker's hex name (36px indent): its HP after the action. Just the number when nothing hit it ("18"); "20 → 18" (arrow muted) when Parry hit it; "→ OUT" in red Plex 600 when Parry removed it.
  2. Under the action icon: **Strength**, the `maul` icon 12px + the attacker's base Strength from its card (before Support, Armor, Brace or anything else), Plex 600 12px ink ("🔨 8").
  3. Under the target (36px indent; no indent for a pull): the target's HP "14 → 11.5", or "6 → OUT" with OUT in red Plex 600. A holder's row adds, 10px later, the flag icon 13px + "7 → 5.5" in flag colour (the flag's own health). A pull shows only the flag's "10 → 7" in flag colour.
  4. Under the damage: **what the roll changed**, and nothing else (the Editor, 20 Nov: no dice are shown anywhere). "+10%", "+25%", "+50%" in ink, "−10%", "−25%", "−50%" in muted, Plex 600 12px; **blank** when the roll changed nothing (a total of 6 to 8). Never the roll itself, never "Glance" or "Crit".
- **Third line** (6px below), only when needed, under the attacker's hex name: Parry, the crossed-swords icon 13px + "−1.5" in red; taking the hex after a kill, the `move` icon 13px + the hex name. Several items sit 8px apart.
- **Set spear** on a move that arrives next to a braced Heavy Anti-Cavalry: second line, under the mover: its HP "16 → 14" (or "1.5 → OUT"); under the destination: the set-spear icon 13px + "−2" in red, then "from" in muted, then the spearman's 20px token (with its brace ring) and hex name.
- **Specials** (once brief 011 is merged): main line as an attack, with the unit's gold ring and the `special` icon. The damage is **ink, or red when it removes a unit**; gold is kept for the special itself (the Editor, 20 Nov). Second line: under the unit, the special's name (Plex 600 12px gold); under the action icon, Strength as above; under the target, its HP; under the damage, the multiplier instead of the roll: the `special` icon 12px + "2×" in gold Plex 600 12px. A special that hits several units (Arc Hit, Skewer) adds a pair of lines per extra unit (10px above the first): its token and hex under the target column, its damage in the result column, then its HP and its multiplier.
- **Removed units read OUT**, never KO: KO is a way to win (Game Laws 2.6).
- **Numbers** in half points, as the board shows them. A holder's HP and the flag's share come from the display split of the pool (the board's `poolSplit`), never the raw HP: today's log text can say "HM HP 16.67" while the split shows 16.5.
- **Tap to open** (attacks, Reach, specials, pulls only; `aria-expanded`): a box opens under the row (8px above, padding 8px 10px, radius 8, paper background, Plex 400 12px/1.45 ink) with the pure math: the engine's parts joined with " · ", then " = " and the value in bold: "Strength 8 · +1 Support · −3 Armor · −2 Brace = **4**". No roll, no arrow, no result. Tap again to close. Moves and braces don't open.

#### 10.6 Desktop
The side panel's Recent list uses the same rows and dividers, in the same order, in place of today's 14 plain lines; the settings bar sits at its top. No separate desktop design was drawn: adapt the column widths to the panel and keep every rule above (the UI chat's call, 20 Nov; the Editor may revise it at review). The Options menu's "Match log and record" keeps its Copy record button and shows the same rows.

#### 10.7 Accessibility
Every icon that carries meaning has an `aria-label` or `role="img"` text ("on the flag", "stopped by a Mark", "Strength 8", "1.5 Stamina", "3 hexes moved", "Command 3 of 10 used"). Text contrast at least 4.5:1 on its background.

#### 10.8 The engine change (the Editor approved amending "Must not change", 20 Nov)
The log's text is sentences (`log(st, text, kind)`), so the rows need structured facts. Beside every `log()` call, the engine pushes a matching entry to a new list, `st.events`: turn, side, kind, the acting unit (id, card, hex before and after, HP before and after, braced, special state), the target or targets (the same, plus damage and removed), Stamina and Command spent, the base Strength, the parts and value, the roll's modifier (not shown, kept for the record of what changed), a special's name and multiplier per hit, Parry, set spear (amount and spearman), taking the hex, the pool split before and after, hexes moved, stopped by a Mark, Evade.
- `st.log` stays exactly as it is, word for word. `st.events` is **display only**: never hashed, never saved in a match record (records hold actions only, so it is rebuilt on every replay), never read by the rules, brains or lab.
- `regress_engine.js` hashes (which cover `st.log`, actions and result) must match before and after, for every preset.

#### 10.9 Not in this brief
Overtime dividers (end of regulation, Golden Flag, Flag Off rounds and attempt turns, sudden death) and the result banner: drawn on the Match log page (Rounds 6 to 8 overtime examples) and **to be approved with the overtime builds** (the Editor, 20 Nov). Build the dividers so new kinds can be added. Tapping a row to show it on the field stays parked.

## Icons
(24-unit grid, stroke 1.9, round caps and joins, one colour.)
- **Zoom in:** `M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z` · `M8.5 12h7` · `M12 8.5v7`
- **Zoom out:** `M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z` · `M8.5 12h7`
- **Show match log:** the board's `list` icon, unchanged.
- **Show field:** `M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z` · `M12 8v8` · `M8.5 10l7 4` · `M15.5 10l-7 4`
- **Holder mark (flag in a hex), 16px, flag colour:** `M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5z` (stroke 2, round joins) · `M10 16.5V8h5.5l-1.3 2 1.3 2H10` (stroke 1.9)
- **Hexes moved:** `M12 3.5 19.4 7.75v8.5L12 20.5 4.6 16.25v-8.5z`
- **Parry (crossed swords):** `M5 4l11 11` · `M19 4 8 15` · `M13.5 16.5l3 3` · `M10.5 16.5l-3 3` · `M16 19.5l3-3` · `M8 19.5l-3-3`
- **Out:** `M6 6l12 12` · `M18 6 6 18`
- Strength (`maul`), Mark, Set Spear, Evade, Move, Attack, Reach (`spear`), Brace, flag, special, hourglass, bot and person: the board's own icons.
- **Hex names:** unchanged (the board's `grid` icon; the Editor, 19 Nov: keep it).

## Rules it touches
None. Game Laws 2.5 (snap) is applied in every view as written. 1.13: zooming out hides numbers, never shows a wrong one; the panel always shows the true HP.

## Bot minimum
No gameplay change. Bot games show no tag and always use view 1; zoom works. Confirm that 100 seeded bot-vs-bot games on the current preset give byte-identical match records before and after this build.

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes). The engine's play, dice, log text and match records (the one engine change allowed is the display-only `st.events`, section 10.8), the brains and the lab. Brief 017's screens except as listed (pill scaling, hex names, the hex-name button, icons-only when zoomed out). 014's snap timing and its "does nothing" cases (desktop where the field fits, bot games, deployment, watch and replay).

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes match.
- A test that the hot-seat view setting never reaches the engine: the same seeded human-vs-human action list replays to the same final state in all three views.
- Screenshots at 390 × 844:
  - Each view, North to play and South to play, on 7v7 (view 3 shown as the phone lies, North at the bottom).
  - View 2 mid-spin (a frame at about 200 ms).
  - 7v7 and 13v13 at far, close and minimum, with hex names on and off. 13v13 isn't playable until 012: draw it from 014's field data in a test position.
- Screenshots at 1280 × 800: a human-vs-human match with the tag, and the field buttons.
- The tag's text contrast is at least 4.5:1 for both sides' default colours.
- A test that `st.events` has one entry per action log line, that replaying a match's actions rebuilds the same `st.events`, and that no match record contains it.
- A test that a row's HP for a flag holder uses the display split (a pooled hit that leaves raw HP 16.67 shows 16.5).
- Screenshots at 390 × 844: the field with the log button (North and South to play); the log at the top and scrolled, with a Parry row, a holder row, a set-spear row and a removed unit; one row tapped open; a special with one target and one with several (once 011 is in).
- Screenshot at 1280 × 800: desktop's Recent list with the new rows.

## The Editor's hands-on check
Play a few turns on a phone in each hot-seat view: check the tag appears on each turn change and goes on your first tap; in view 2, watch the spin; in view 3, lay the phone flat and check the panel always faces the player moving. Pinch in and out on 7v7, tap the zoom button both ways, and check a tap after a pinch doesn't move a unit. Open the match log from the top-right button, check the newest turn is on top and reads in play order, tap an attack open, and go back to the field.

## Report
*Filled in by Claude Code, 22 Nov 2026. Branch `claude/affectionate-rubin-y8sb7p`, started from `brief/018-turn-cue-zoom` with `main` (v3.14.01, Build 19) merged in. Game version **v3.15.00**, Build 20.*

- **What's in:**
  - §2 Turn cue: the edge tag in hot seat, play ("NORTH PLAYS") and deployment ("SOUTH DEPLOYS"), names from `st.names`, at the outer edge of the mover's half, hidden by the first touch, click or key (which still acts), no timer, `role="status"`. Text colour picked by contrast in `skin.js` (`tagInk`): North 8.9:1, South 7.8:1, ink text on both.
  - §3 Hot-seat view on the Settings step (both Human only) and in the Options menu; Face to Face hidden at 900 px and wider (a saved one falls back to Handoff). Kept as `match.view` beside the options, never in `opts`, so the engine never sees it.
  - §4 Views: Handoff; Flip (400 ms spin about the middle of the view, then everything redrawn upright, badges by screen corner, then the snap, then the tag); Face to Face (North at the bottom all match; on South's turn the whole screen except the field turns 180°: top bar, tag, field buttons, panel, sheets, key, menu, dialogs, toasts, covers; field labels redrawn for the mover). Reduced motion: no animation. Bot, watch and replay games: always view 1, no tag.
  - §5 Hex names centred. §6 Zoom: pinch, one-finger pan with a little glide, the zoom button (close 60 px, far as today, 250 ms), minimum = whole field, maximum 90 px, wheel/drag/+/− on desktop; the zoom stays through turns, the snap also centres across when the field is wider than the view. §7 Field buttons on the right edge (zoom 64 px, hex names 116 px above the field's bottom), dark look, labels and `aria-pressed`; desktop too. §8 Icons only under 50 px. §9 see F018-4.
  - §10 Match log: phone button (top right, 38 px below the scoreboard), Show field swaps back keeping zoom and scroll; settings bar; dividers (Command used/available, out, own losses, enemy flag change; South mirrored); rows as §10.5 (move, Evade, Mark stop, swap, attack, Reach, brace, warm-up, special with several hits, pull, Parry, set spear, take the hex, holder mark, OUT, roll change only, tap-open sum). Desktop Recent and Options → Match log use the same rows.
  - §10.8 `st.events` in `engine.js`: one entry per log line, filled in for each action from a before/after snapshot plus what the action noted. Not enumerable: never in JSON, a match record, a clone or a look-ahead copy; a failed action leaves no entries.
- **Review fixes (the Editor, 22 Nov, after testing #54):**
  1. Deployment always opened on North's flag; 2. zooming after scrolling lost the place; 4. some turns jumped to the top of the field. One cause: an `<svg>` has no `offsetTop`/`offsetLeft`, so every scroll-to-a-hex worked out "not a number" and the browser went to the top (North's end). Fixed (`svgOff()` reads the drawing's margins); `test_hotseat.js` now checks that each side's deployment opens on its own flag and that scroll-then-zoom keeps the hex in the middle of the view.
  3. Zoom in goes nearer: close = 1.5 × far, at least 60 and at most 120 px hexes (393 px phone, 7v7: 81 px; desktop 7v7: 108 px; 13v13 phone: 60 px). Pinch maximum raised to 120 px. This replaces §6's fixed 60 px close and 90 px maximum.
  5. The log button now shows on desktop too (it swaps the field for the log, like the phone); the Recent list in the side column still has the same rows, below Units.
  6. The tag stays up for the whole turn and goes when the turn passes (replaces §2's "goes on the first touch").
- **Anything beyond the brief, and why:** zoom-out on desktop goes to the whole field when far is nearer than close (otherwise the button did nothing there; F018-2). A drag on your own unit now starts at 8 px, not 12, so a press that moves more than 8 px is never a tap (§6).
- **Checks run and results (paste regression hashes):** every README check run in this session. test_rules, v1, v3, v31, v33, v34, fields (127), route (59), stamina (833), reasons (19), version (22), ui (114), rng (20), replay (386 checks, 0 mismatches), phone (64/64), new test_hotseat (31/31), new test_events (1,307 checks at 2 games per set). Also test_v32 (40), v35 (6), v36 (4), v37 (2), kitd (6), brain5/6/7 (2), watch (18), invariants (30 games, 0 problems), lab self_test, test_stall, test_lead, test_capacity, status test_board, board_check (10 games, 0 different). **Replay hashes:** `node tests/regress_engine.js <board> 2 all` on the board before this build (main at v3.14.01, Build 19) and after: all **143 lines identical** (every preset, newest included, with every brain). Brain 5's lines:
```
match3 brain5        8d04251dfed748de {"KO":3,"turn limit, more pull damage":1}
v1 brain5            6f1b73d2ca73d363 {"KO":1,"TKO":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v2 brain5            3f633aad1b3a8174 {"KO":3,"TKO":1}
v3 brain5            7a1162a7d975ca34 {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"KO":1}
v3.1 brain5          f2e6b03e127c2194 {"turn limit, fewer beings lost":1,"TKO":1,"KO":2}
v3.2 brain5          850a72ea70e5e511 {"turn limit, fewer beings lost":2,"KO":2}
v3.3 brain5          39da06ddc31fd2ef {"turn limit, more pull damage":1,"TKO":2,"KO":1}
v3.4 brain5          a8bc0b017ad55a10 {"turn limit, fewer beings lost":2,"TKO":1,"KO":1}
v3.5 brain5          e36005ac8e28c39b {"turn limit, fewer beings lost":1,"TKO":1,"turn limit, draw":1,"KO":1}
v3.6 brain5          da8bf6315ff5ebca {"turn limit, fewer beings lost":1,"KO":2,"turn limit, draw":1}
v3.7 brain5          160781c5b3a6b068 {"KO":4}
v3.8 brain5          8f51cc9185148518 {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"TKO":1}
v3.9 brain5          9ffd27f1174f842b {"turn limit, fewer beings lost":1,"TKO":1,"KO":1,"turn limit, more pull damage":1}
```
<details><summary>All 143 lines (identical before and after)</summary>

```
match3 standard      9e3823bacc87624c {"turn limit, more pull damage":3,"TKO":1}
match3 easy          e5d74944b50de5e5 {"turn limit, more pull damage":2,"KO":2}
match3 kitA          2f0824553337f543 {"KO":2,"turn limit, more pull damage":2}
match3 kitA2         0ee5aa3c1b06fa6e {"KO":2,"turn limit, fewer beings lost":1,"TKO":1}
match3 kitC          8fcd16702426aed7 {"KO":3,"TKO":1}
match3 kitB          8fdc408fd2b365a7 {"turn limit, fewer beings lost":1,"TKO":2,"KO":1}
match3 batchC        8fdc408fd2b365a7 {"turn limit, fewer beings lost":1,"TKO":2,"KO":1}
match3 kitD          328da73d09a05369 {"turn limit, fewer beings lost":1,"TKO":3}
match3 brain5        8d04251dfed748de {"KO":3,"turn limit, more pull damage":1}
match3 brain6        8d04251dfed748de {"KO":3,"turn limit, more pull damage":1}
match3 brain7        767f4463c87355d2 {"KO":2,"TKO":1,"turn limit, draw":1}
v1 standard          a61b8a999bfce149 {"turn limit, more pull damage":2,"TKO":2}
v1 easy              e017ef4eeed57090 {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"turn limit, draw":1}
v1 kitA              01c130691675558a {"turn limit, draw":1,"TKO":1,"KO":2}
v1 kitA2             254faf3f00e19d09 {"turn limit, fewer beings lost":1,"KO":2,"turn limit, more pull damage":1}
v1 kitC              6387ad27baac2106 {"turn limit, more pull damage":2,"turn limit, draw":2}
v1 kitB              d86beb0227aca07f {"turn limit, draw":1,"KO":1,"turn limit, fewer beings lost":1,"TKO":1}
v1 batchC            d86beb0227aca07f {"turn limit, draw":1,"KO":1,"turn limit, fewer beings lost":1,"TKO":1}
v1 kitD              3145150e9cdd505d {"turn limit, draw":1,"TKO":2,"turn limit, fewer beings lost":1}
v1 brain5            6f1b73d2ca73d363 {"KO":1,"TKO":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v1 brain6            6f1b73d2ca73d363 {"KO":1,"TKO":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v1 brain7            34d90755dabdde3a {"KO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v2 standard          dfc6f605c786a1ef {"turn limit, more pull damage":2,"KO":1,"TKO":1}
v2 easy              d916fe61bb7ae714 {"turn limit, more pull damage":2,"TKO":2}
v2 kitA              c056c0b62d38bb56 {"TKO":2,"turn limit, draw":1,"turn limit, fewer beings lost":1}
v2 kitA2             ace221f995340345 {"KO":3,"TKO":1}
v2 kitC              14373cbc8b64a49f {"KO":1,"TKO":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v2 kitB              62cb8db770689457 {"KO":2,"TKO":1,"turn limit, more pull damage":1}
v2 batchC            62cb8db770689457 {"KO":2,"TKO":1,"turn limit, more pull damage":1}
v2 kitD              bf38bcf45f07b09c {"KO":1,"TKO":3}
v2 brain5            3f633aad1b3a8174 {"KO":3,"TKO":1}
v2 brain6            3f633aad1b3a8174 {"KO":3,"TKO":1}
v2 brain7            7e5985e95e36e5f5 {"KO":3,"turn limit, draw":1}
v3 standard          7ad4314b71bc28a4 {"turn limit, fewer beings lost":2,"KO":1,"turn limit, draw":1}
v3 easy              2bc36efa8c829618 {"KO":3,"TKO":1}
v3 kitA              914dd3250a1fbcf0 {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"turn limit, draw":1}
v3 kitA2             bc14e8e5ad3a839d {"KO":3,"turn limit, fewer beings lost":1}
v3 kitC              05f33b19629b361a {"turn limit, draw":1,"turn limit, more pull damage":2,"turn limit, fewer beings lost":1}
v3 kitB              8d66981ae7d2d8ac {"turn limit, draw":3,"KO":1}
v3 batchC            8d66981ae7d2d8ac {"turn limit, draw":3,"KO":1}
v3 kitD              dabe6e44d89e6bec {"turn limit, draw":1,"turn limit, more pull damage":2,"KO":1}
v3 brain5            7a1162a7d975ca34 {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"KO":1}
v3 brain6            7b601031ca169614 {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"KO":1}
v3 brain7            02f06ab9569b2d82 {"KO":3,"turn limit, fewer beings lost":1}
v3.1 standard        9e7700b9ba877a36 {"turn limit, draw":1,"turn limit, fewer beings lost":2,"KO":1}
v3.1 easy            721e979054eec77b {"turn limit, more pull damage":2,"turn limit, draw":1,"KO":1}
v3.1 kitA            1df2ee7c9b950c0e {"turn limit, fewer beings lost":4}
v3.1 kitA2           ba4bdc7f1b3fa010 {"turn limit, more pull damage":3,"turn limit, draw":1}
v3.1 kitC            6e9d150fafc1f94e {"turn limit, more pull damage":1,"turn limit, fewer beings lost":2,"turn limit, draw":1}
v3.1 kitB            18554d7c7a33f924 {"turn limit, draw":2,"KO":1,"turn limit, more pull damage":1}
v3.1 batchC          18554d7c7a33f924 {"turn limit, draw":2,"KO":1,"turn limit, more pull damage":1}
v3.1 kitD            d17c28926a371eea {"turn limit, draw":2,"turn limit, more pull damage":1,"TKO":1}
v3.1 brain5          f2e6b03e127c2194 {"turn limit, fewer beings lost":1,"TKO":1,"KO":2}
v3.1 brain6          f2e6b03e127c2194 {"turn limit, fewer beings lost":1,"TKO":1,"KO":2}
v3.1 brain7          5ed6d28ba1be7428 {"KO":3,"TKO":1}
v3.2 standard        20a1316975dfb1a3 {"turn limit, fewer beings lost":2,"KO":2}
v3.2 easy            243c95d67ee089fc {"turn limit, more pull damage":3,"KO":1}
v3.2 kitA            b5b5dd9c87a12d45 {"turn limit, fewer beings lost":3,"turn limit, more pull damage":1}
v3.2 kitA2           9065d92619dae890 {"turn limit, more pull damage":3,"KO":1}
v3.2 kitC            9c5550c12bac4928 {"turn limit, more pull damage":2,"turn limit, draw":1,"KO":1}
v3.2 kitB            ace5709173952db1 {"turn limit, draw":2,"KO":1,"turn limit, fewer beings lost":1}
v3.2 batchC          ace5709173952db1 {"turn limit, draw":2,"KO":1,"turn limit, fewer beings lost":1}
v3.2 kitD            b5d411d06bd208d9 {"turn limit, draw":2,"KO":1,"turn limit, more pull damage":1}
v3.2 brain5          850a72ea70e5e511 {"turn limit, fewer beings lost":2,"KO":2}
v3.2 brain6          850a72ea70e5e511 {"turn limit, fewer beings lost":2,"KO":2}
v3.2 brain7          ecd2616e53e64b97 {"KO":2,"TKO":2}
v3.3 standard        fcc78a544111a6fb {"turn limit, fewer beings lost":3,"KO":1}
v3.3 easy            25210cf5d93535ea {"KO":1,"turn limit, more pull damage":3}
v3.3 kitA            126e11002eb0ec53 {"turn limit, fewer beings lost":3,"turn limit, draw":1}
v3.3 kitA2           ed530e07cfa44034 {"turn limit, more pull damage":2,"turn limit, draw":1,"KO":1}
v3.3 kitC            45232bdbbac93033 {"turn limit, draw":1,"turn limit, fewer beings lost":2,"KO":1}
v3.3 kitB            6b65fff1bfe24797 {"turn limit, draw":2,"KO":1,"turn limit, more pull damage":1}
v3.3 batchC          6b65fff1bfe24797 {"turn limit, draw":2,"KO":1,"turn limit, more pull damage":1}
v3.3 kitD            ea89cb784de90475 {"turn limit, draw":2,"TKO":1,"KO":1}
v3.3 brain5          39da06ddc31fd2ef {"turn limit, more pull damage":1,"TKO":2,"KO":1}
v3.3 brain6          39da06ddc31fd2ef {"turn limit, more pull damage":1,"TKO":2,"KO":1}
v3.3 brain7          046390824771f296 {"turn limit, fewer beings lost":1,"KO":2,"TKO":1}
v3.4 standard        a8f8270aceb1eb9e {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"KO":1}
v3.4 easy            4d9a73c80a3cb225 {"turn limit, more pull damage":3,"KO":1}
v3.4 kitA            f65eba492e49eaaa {"turn limit, draw":1,"turn limit, fewer beings lost":1,"turn limit, more pull damage":2}
v3.4 kitA2           31439db204aa5ac0 {"KO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v3.4 kitC            de370a3a914caa7f {"turn limit, draw":1,"turn limit, more pull damage":3}
v3.4 kitB            88c03eedc951d875 {"turn limit, draw":2,"KO":2}
v3.4 batchC          88c03eedc951d875 {"turn limit, draw":2,"KO":2}
v3.4 kitD            73631bc545ab6f1a {"turn limit, draw":2,"KO":2}
v3.4 brain5          a8bc0b017ad55a10 {"turn limit, fewer beings lost":2,"TKO":1,"KO":1}
v3.4 brain6          a8bc0b017ad55a10 {"turn limit, fewer beings lost":2,"TKO":1,"KO":1}
v3.4 brain7          d7d8656b0a96c97a {"turn limit, fewer beings lost":2,"KO":2}
v3.5 standard        3b4d8fef6069ff6e {"turn limit, fewer beings lost":3,"turn limit, more pull damage":1}
v3.5 easy            c4fd685946d0479a {"KO":3,"turn limit, more pull damage":1}
v3.5 kitA            87958ee26c312c45 {"turn limit, draw":1,"turn limit, fewer beings lost":2,"KO":1}
v3.5 kitA2           d706bac749f2c41b {"KO":3,"turn limit, draw":1}
v3.5 kitC            abfaa0c96e1fc84e {"turn limit, more pull damage":2,"KO":2}
v3.5 kitB            5aee7f383d6fae0f {"turn limit, draw":3,"KO":1}
v3.5 batchC          5aee7f383d6fae0f {"turn limit, draw":3,"KO":1}
v3.5 kitD            f19fee3f46e8a186 {"turn limit, draw":2,"KO":1,"turn limit, more pull damage":1}
v3.5 brain5          e36005ac8e28c39b {"turn limit, fewer beings lost":1,"TKO":1,"turn limit, draw":1,"KO":1}
v3.5 brain6          39d6c1623675a289 {"turn limit, fewer beings lost":2,"TKO":1,"KO":1}
v3.5 brain7          a0eb8e37baefa628 {"TKO":1,"KO":3}
v3.6 standard        7cef7428821f4b6f {"turn limit, fewer beings lost":2,"turn limit, more pull damage":2}
v3.6 easy            a74f8f276aff5ed2 {"turn limit, more pull damage":3,"KO":1}
v3.6 kitA            490e28b917f2543e {"turn limit, fewer beings lost":3,"turn limit, more pull damage":1}
v3.6 kitA2           c482f0be6d450aad {"KO":3,"turn limit, more pull damage":1}
v3.6 kitC            aa79d4eeb2586595 {"turn limit, more pull damage":1,"turn limit, fewer beings lost":2,"turn limit, draw":1}
v3.6 kitB            983474198c6369ef {"turn limit, more pull damage":1,"KO":3}
v3.6 batchC          983474198c6369ef {"turn limit, more pull damage":1,"KO":3}
v3.6 kitD            59bef5b405201ef0 {"KO":3,"turn limit, more pull damage":1}
v3.6 brain5          da8bf6315ff5ebca {"turn limit, fewer beings lost":1,"KO":2,"turn limit, draw":1}
v3.6 brain6          30809624beccfebb {"turn limit, fewer beings lost":1,"KO":2,"turn limit, more pull damage":1}
v3.6 brain7          a05555438780c486 {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"KO":1}
v3.7 standard        293cc61e9cd9e9eb {"turn limit, fewer beings lost":3,"KO":1}
v3.7 easy            07cf196e66a09477 {"turn limit, more pull damage":3,"KO":1}
v3.7 kitA            7a6edea427b27a23 {"KO":1,"turn limit, fewer beings lost":3}
v3.7 kitA2           7d9c422129de5bd0 {"KO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v3.7 kitC            8cf41a10d6b73b02 {"turn limit, more pull damage":1,"KO":1,"turn limit, fewer beings lost":2}
v3.7 kitB            56a72c4dfc3674cf {"turn limit, more pull damage":2,"KO":1,"turn limit, fewer beings lost":1}
v3.7 batchC          56a72c4dfc3674cf {"turn limit, more pull damage":2,"KO":1,"turn limit, fewer beings lost":1}
v3.7 kitD            14b985890bb8f54d {"KO":4}
v3.7 brain5          160781c5b3a6b068 {"KO":4}
v3.7 brain6          160781c5b3a6b068 {"KO":4}
v3.7 brain7          f7c47619471a3b89 {"KO":4}
v3.8 standard        d28fa9b9c05b1338 {"turn limit, fewer beings lost":1,"turn limit, more pull damage":3}
v3.8 easy            bdc596ffd85f50a9 {"KO":3,"turn limit, more pull damage":1}
v3.8 kitA            050bca2b3dc85080 {"turn limit, fewer beings lost":3,"turn limit, more pull damage":1}
v3.8 kitA2           a310c081d24103de {"KO":1,"turn limit, fewer beings lost":3}
v3.8 kitC            4b9910185f5520d8 {"turn limit, fewer beings lost":2,"KO":1,"turn limit, draw":1}
v3.8 kitB            724ded0ea8a8a1e3 {"KO":4}
v3.8 batchC          724ded0ea8a8a1e3 {"KO":4}
v3.8 kitD            cc877638e5a5b905 {"KO":1,"turn limit, more pull damage":2,"TKO":1}
v3.8 brain5          8f51cc9185148518 {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"TKO":1}
v3.8 brain6          8f51cc9185148518 {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"TKO":1}
v3.8 brain7          34b8222fd45c0bfb {"KO":3,"TKO":1}
v3.9 standard        8532f632ee81487d {"turn limit, more pull damage":2,"turn limit, fewer beings lost":2}
v3.9 easy            f633c5d91751e94e {"turn limit, more pull damage":2,"KO":2}
v3.9 kitA            c03796203eef4e2d {"turn limit, fewer beings lost":4}
v3.9 kitA2           cba6d74dbe54d054 {"turn limit, more pull damage":1,"turn limit, fewer beings lost":2,"KO":1}
v3.9 kitC            a3172505860875ac {"turn limit, fewer beings lost":2,"KO":1,"turn limit, more pull damage":1}
v3.9 kitB            c984be2882409f14 {"KO":4}
v3.9 batchC          c984be2882409f14 {"KO":4}
v3.9 kitD            07d7031480c6d37a {"KO":3,"turn limit, more pull damage":1}
v3.9 brain5          9ffd27f1174f842b {"turn limit, fewer beings lost":1,"TKO":1,"KO":1,"turn limit, more pull damage":1}
v3.9 brain6          9ffd27f1174f842b {"turn limit, fewer beings lost":1,"TKO":1,"KO":1,"turn limit, more pull damage":1}
v3.9 brain7          f52be94828dbcd7f {"KO":3,"TKO":1}
```
</details>
- **Baseline table (rule changes only):** n/a (no rule change).
- **Bot minimum (met / not met, with numbers):** **Met.** No gameplay change. 100 seeded Brain 5 vs Brain 5 games on v3.9 (7v7): records (actions, result, log) hash `4e14e57cd154a8e7` before and after, byte-identical. Bot games show no tag and always use view 1 (`test_hotseat.js`); zoom works in them.
- **Settings review (brain builds only):** n/a
- **Measured:** visible field between top bar and unit bar: **581 px** at 390 × 844, **402 px** at 393 × 665 (in play, nothing tapped; unchanged from Build 19). 7v7 far = 54.1 px hexes at 393 px (53.7 at 390), 13v13 far = 38 px, minimum about 25 px.
- **Gestures:** none found leaking into a tap in the tests (30 px pan selects nothing; second finger cancels a drag and makes no move). Tested with synthetic touches in a headless browser, not a real phone: the Editor's hands-on check is the real test.
- **View 3:** every screen listed turns (they all sit inside the page, which turns). The Matches and Rules screens reached from Options are not play screens and stay upright (the turn is dropped when you leave the play screen).
- **Log vs preview/field:** no differences found; the log reads the engine's own before/after numbers (a holder's HP and flag from the display split). The log shows the roll's change only, never the roll.
- **Desktop Recent:** the same rows, columns narrowed to 82/26/1fr/32/56 px for the 390 px panel, settings bar on top (not sticky), newest first; the side column scrolls.
- **Screenshots:** `briefs/img/018/` (390 × 844, 393 × 665, 1280 × 800), made by `sims/shots_018.js`. Set spear on a move is rare in bot games, so its shot uses hand-placed units.
- **Known gaps:** In Face to Face, the turn animation briefly slides the field about 95 px while the rest of the screen turns (the two turn about different centres), then it settles and the snap runs. 9v9/13v13 zoom shots use 014's field data in a test position (not playable until 012).
- **Flags closed / opened:** none closed. Opened `flags/018.md`: F018-1 (menu button hidden in the log), F018-2 (desktop far), F018-3 (the 10% rule), F018-4 (pill already scales), F018-5 (swap row), all ASK.
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/54
