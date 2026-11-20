# Brief 018: Turn cue, hot-seat views and field zoom (Approved UI v4)

| | |
|---|---|
| Game version | Next free **YY** at merge (new screens and a new setting: a real change), ZZ = 00. Take it when you open the pull request; re-check after any `sync`. |
| Lane | UI |
| Rule set | **No rule change, no new preset.** Every preset plays and replays exactly as before. |
| Date | 19 Nov 2026 |
| Goal | Make a turn change in human-vs-human games impossible to miss (a text cue, plus three ways to hold the phone), and let players zoom the field on every format so 9v9 and 13v13 are usable on a phone. Build the screens the Editor approved on 19 Nov as Approved UI v4. |
| Branch | Any branch your session may push to, started from `brief/018-turn-cue-zoom` |
| Flags | none to close |
| Status | **On hold** (the Editor, 19 Nov): the mobile match log is still to be designed and added to this brief. Don't start until the UI chat marks it complete. |
| Order | **After brief 017 merges** (017 adds the flag pill, the token HP position, the badges and Plex Sans numbers that this brief scales; same drawing code) and **before brief 012** (012 makes 9v9 and 13v13 playable; their hexes are too small to use on a phone without zoom). 014 (fields and the hot-seat snap) is already in by then. Run `sync` first. |

## Context
Designed on the UI Brainstorm canvas, pages **Turn cue** (Rounds 1 to 3) and **Field zoom** (Round 2), approved by the Editor on 19 Nov; the screens go onto the Approved UI canvas as page **v4**. The idea rows are in the Ideas Log's UI table. This brief carries every size, colour and word, so you never need to open a canvas.

Rules that apply: Game Laws 2.5 (the hot-seat snap, built by 014), 1.13 (what is shown is the true state), 7.9 (symmetrical, elegant, clean). Nothing here changes how the game plays.

Why: in a hot-seat game nothing says the turn has changed; today's 3px underline under the scoreboard is easy to miss. And at full phone width a hex is 53 px wide on 7v7, 44 px on 9v9 and 37 px on 13v13 (44 px is the usual comfortable tap size; a 13v13 token's HP number would be about 7 px).

## Scope
In: the turn cue (edge tag); a hot-seat view setting with three views; view 2's field spin; view 3's turning chrome; field zoom (pinch, a two-step zoom button, limits); icons-only tokens when zoomed out; the flag pill scaling with the hex; hex names centred; the hex-name button moved and restyled; desktop equivalents.
Out: tablet layouts (later, for every screen); the redesigned game set-up screens (later; this brief adds one field to today's Settings step); any rule change.

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
- **Words:** in play `<side's name> TO PLAY`; in deployment `<side's name> DEPLOYS` (the Editor, 19 Nov), from the match's names (`st.names`), so a renamed side shows its name: "NORTH TO PLAY", "SOUTH TO PLAY", "NORTH DEPLOYS", "SOUTH DEPLOYS".
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
- **Hex names:** directly above zoom, 8px gap (moved from the top right, where South's tag now goes). Both top corners of the field are left free for the tag.
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

## Icons
(24-unit grid, stroke 1.9, round caps and joins, one colour.)
- **Zoom in:** `M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z` · `M8.5 12h7` · `M12 8.5v7`
- **Zoom out:** `M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z` · `M8.5 12h7`
- **Hex names:** unchanged (the board's `grid` icon; the Editor, 19 Nov: keep it).

## Rules it touches
None. Game Laws 2.5 (snap) is applied in every view as written. 1.13: zooming out hides numbers, never shows a wrong one; the panel always shows the true HP.

## Bot minimum
No gameplay change. Bot games show no tag and always use view 1; zoom works. Confirm that 100 seeded bot-vs-bot games on the current preset give byte-identical match records before and after this build.

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes). The engine, brains and lab. Brief 017's screens except as listed (pill scaling, hex names, the hex-name button, icons-only when zoomed out). 014's snap timing and its "does nothing" cases (desktop where the field fits, bot games, deployment, watch and replay).

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes match.
- A test that the hot-seat view setting never reaches the engine: the same seeded human-vs-human action list replays to the same final state in all three views.
- Screenshots at 390 × 844:
  - Each view, North to play and South to play, on 7v7 (view 3 shown as the phone lies, North at the bottom).
  - View 2 mid-spin (a frame at about 200 ms).
  - 7v7 and 13v13 at far, close and minimum, with hex names on and off. 13v13 isn't playable until 012: draw it from 014's field data in a test position.
- Screenshots at 1280 × 800: a human-vs-human match with the tag, and the field buttons.
- The tag's text contrast is at least 4.5:1 for both sides' default colours.

## The Editor's hands-on check
Play a few turns on a phone in each hot-seat view: check the tag appears on each turn change and goes on your first tap; in view 2, watch the spin; in view 3, lay the phone flat and check the panel always faces the player moving. Pinch in and out on 7v7, tap the zoom button both ways, and check a tap after a pinch doesn't move a unit.

## Report back
The standard items, plus: the measured visible field height between top bar and panel on a 390 × 844 layout; any place a gesture still leaked into a tap; any screen that didn't turn in view 3.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
