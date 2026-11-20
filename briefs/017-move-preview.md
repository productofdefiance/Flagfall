# Brief 017 — Move and range preview, Approved UI v3

| | |
|---|---|
| Game version | Next free **YY** at merge (new screens and a routing rule: a real change), ZZ = 00. Take it when you open the pull request; re-check after any `sync`. |
| Lane | UI (with one rules piece: routes, Game Laws 2.11) |
| Rule set | **New preset**, next free id at merge (expected v3.8 or v3.9, after 011 and 014): the current preset plus the 2.11 route rules behind a switch `routeRule211`. Older presets keep today's movement and replay exactly. |
| Date | 19 Nov 2026 |
| Goal | Let players plan moves and attacks without moving, checking and undoing: route and dangers before a move confirms, range for planning, the special's range, the Evade preview after an attack, and the enemy's moves and range. Build the screens the Editor approved on 19 Nov as Approved UI v3. |
| Branch | Any branch your session may push to, started from `brief/017-move-preview` |
| Flags | none to close |
| Order | **After brief 011 merges** (011 changes the same preview, buttons and specials) and **before brief 012** (Cavalry adds Vault, stop reasons and Trample on top). It carries a rule change, so it does not run alongside another rule brief (014): whichever of 014 and 017 merges second runs `sync` and takes the next preset id. |


## Context
The design request is in the Dev Handover's UI tab ("Design request: move and range preview" and the "Approved for build" list under it). The approved screens are on the UI Brainstorm canvas, page **Move and range preview**, Rounds 11 to 15, and page **Enemy preview**, Rounds 3 and 4, on the field from Rounds 3 A and 5; they go onto the Approved UI canvas as page **v3** with this brief. This brief carries every size, colour and word, so you never need to open a canvas.

Rules that apply: Game Laws 2.11 (routes; two additions locked 19 Nov), 3.6 (taking the hex after a kill), 3.8 (Mark), 3.9 and 6.6 (tackle), 3.11 (Volley), 3.13 (set spear), 4.9 (the flag blocks straight lines; built by 015), 6.5 (Evade), 6.16 and 6.17 (specials, built by 011), 1.13 (what is shown is the true state), 1.16 (nothing empty is offered), 7.9 (symmetrical, elegant, clean).

**Every hex, route, range, number and badge on screen comes from an engine function. The board never works any of it out itself** (CLAUDE.md pitfall 1). Section 2 lists the functions.

## Scope
In: the 2.11 route rules in the engine; preview functions for routes, ranges, Evade hexes and what a kill brings; the move preview (unit tapped, first tap, confirm); range outlines (normal and special); the warm-up rings; the Evade hexes and kill consequences in the attack preview; the special's preview and confirm button; the badge system; the new action-button order; the brace ring colour; the flag pill; the neutral field with pitch lines; numbers in IBM Plex Sans; the lowered HP number; the context key; desktop hover. The enemy-tapped view (section 9); the braced-last-turn ring and set spear hatching (section 3).
Out: Cavalry marks (Vault, Pursuit, Trample's swap: brief 012); jersey choice (later; but keep every team colour in the skin, section 12); the Settings screen; any other rule change.

## Look (changes to the v2 look; everything not named here stays as in brief 009)
- **Numbers:** every number on the board (tokens, scoreboard, flag HP, Command, attack and move previews, unit card, Stamina costs) moves from IBM Plex Mono to **IBM Plex Sans** with `font-variant-numeric: tabular-nums`. Digits keep equal widths; the decimal point gets its natural width. Drop Plex Mono from the font load if nothing else uses it.
- **New colours** (add to `skin.js`):
  - Move blue stays `#3f7fd6` (`move`).
  - Special gold for range lines `#d9a514` (`specialRange`); the warm-up ring keeps `#e2b53c` (`keeper`/special gold).
  - **Braced ring: charcoal `#2e3338`** (`brace`, replaces `#1f4fd8` everywhere: field ring, Brace button dot and border, unit card).
  - Neutral field zones: arc `#eceee8`, goal zone `#d9ddd4` (`zoneArc`, `zoneGoal`, the same for both sides).
  - Pitch lines `#9ea693` (`pitchLine`).
  - Stays: ink `#1f2421`, muted `#5f6762`, line `#b8beb6`, hex `#fbfcf8`, flag `#b07a33`, attack red `#c62828`, North `#2f6b55`, South `#a8452f`.
- **White edge:** every ring and line drawn over the field (selection, target, braced, warm-up, route) gets a white underlay 2.5px wider than the mark, so it holds on any fill.

## What to build

### 1. Routes (Game Laws 2.11), behind `routeRule211`
A move names only its destination. The engine picks the route:
1. **Cheapest:** fewest Stamina, within the movement cap and Command (today every hex costs the unit's hex cost, so: fewest hexes). Search ignores Marks and set spears as blockers; only units and flags block.
2. **Arriving beats stopping short:** among equally cheap routes, one that reaches the chosen hex beats one that stops on the way (a Mark entered before the end, or set spear damage that removes the unit).
3. **Fewer dangers:** then the route with fewer dangers: a Mark entered (a stop), a set spear that fires, and any danger added later (Pursuit with 012).
4. **Default direction:** still tied, compare the routes hex by hex from the start; at the first hex where they differ, take the one nearer the centre column (column E; distance = |column − E| in column steps); if equally near, the one nearer the unit's own flag (smaller distance to its own flag hex row; North's flag is at the top, South's at the bottom). The rule is mirrored, so North and South behave the same.
5. The move then walks that route. If it enters an enemy Mark before the chosen hex, it stops there (3.8); if set spear removes it, it is removed there. It is **never rerouted at extra cost** to avoid a danger. A player who wants another route takes shorter steps.
6. The **move hexes** shown when a unit is tapped stay as today: every hex the unit can reach this turn by any legal sequence of moves. A first tap on one of them may show a route that stops short (that hex is reachable with shorter steps, not in one move). Nothing else changes.
7. The computer uses the same route function (Bot minimum).

Tests (each is a seeded set-up in a new `test_route.js`; set-ups below use 7v7 on today's field with the units as listed):
- **Tie to the centre:** North Light Ranged C9 to B10: two cheapest routes (via C10 or B9); it takes C10.
- **Tie to own flag:** a unit moving along a row where the two first steps are both in the same column (NE and SE in flat-top columns): it takes the step toward its own flag.
- **Arriving first:** South Heavy Melee on D13 (its Mark covers C13, C14, D12, D14, E13, E14), North unit D10 to C13: the routes via D11–D12 and via C11–C12 tie on cost and on one Mark each; it takes the one via C12 that reaches C13.
- **Stop short:** South Heavy Melee E11 (Mark on D10, D11, E10, E12, F10, F11), North Light Ranged C9 to F10: the only 3-hex route enters E10 first, so the move stops at E10 even though a 4-hex route around exists; the preview shows the stop.
- **Set spear on arrival:** braced South Heavy Anti-Cavalry F12, North Light Melee G11 to F11: one route; Mark stop at F11 and set spear 2 from F12.
- **Mirror:** mirror any of the above top to bottom; the route mirrors.
- **Old presets:** a v3.5 game moves exactly as before (replay hashes unchanged).

### 2. Engine functions for the board (read-only; nothing else on screen is computed)
- `route(st, uid, dst)` → `{ path: [hex…], end: hex, stoppedShort: bool, cost, events: [{ type: 'mark'|'spear'|'tackle', hex, by: uid, amount }] }`. `events` in walking order; `hex` is where it fires; `by` is the unit causing it (the Marking unit, the braced spearman, the unit broken away from); `amount` is the damage (spear) or extra Stamina (tackle).
- `canAttackAfter(st, uid, dst)` → whether the unit could still attack after that move (Stamina, Command, Reload). False means no range from the end and the "no attack after" badge.
- `rangeHexes(st, uid, fromHex, kind)` → every hex the unit could hit from `fromHex`: `kind` 'normal' (Volley range, Reach spokes, melee adjacency) or 'special' (the warmed special's own shape: Javelin spokes 2–3 over friends never enemies, and the others as 011 defines them). Respects the flag block (4.9). Hexes, not targets: occupied or empty.
- `evadeHexes(st, uid, targetUid)` → `{ hex: mode }` for every hex the attacker could Evade to if the target survives (today `evadePreview` counts them; return the map).
- `killConsequences(st, uid, targetUid)` → the events if the attack removes the target: today set spear on taking the hex (with `by` and `amount`) and the Mark it would stand in. Empty list if nothing; null if the attacker does not take the hex (ranged, Javelin).
- `enemyPreview(st, uid)` (section 9): the enemy's moves on its next turn and its ranges as things stand.

### 3. Unit tapped (phone)
- Move hexes as today: a hex inset 2px, `#3f7fd6` at 16% opacity.
- **Range outline** for any unit that can hit beyond 1 hex (Ranged, Anti-Cavalry's Reach): the outer edge of the `rangeHexes(…, 'normal')` set from where it stands, `#3f7fd6`, 1.6px, drawn 1.2px inside the hex edges. Reach shows as six separate hexes (each outlined). Melee-only units show no outline.
- **Special range**, only when the special is ready to fire this turn: every hex of `rangeHexes(…, 'special')` gets a **double gold line**: 3px `#d9a514` 1.8px inside the hex edge plus 1.2px `#d9a514` 5.8px inside. Where the hex also carries the blue line, the gold pair moves 3px further in (4.6 and 8.6) so both show.
- **Warm-up ring** on the unit (both sides, 6.16): **warming up:** ring 2.6px, dashed 4/3, radius token + 3.5. **Ready to fire:** solid 4.2px, radius token + 3.8. Colour: gold `#e2b53c` on the side to move's units, plum `#6a3d8f` on the other side's (the same rule as section 9: gold is always yours, plum always theirs). A unit both braced and ready: braced ring stays at token + 3.6, the warm-up ring moves out to token + 7.5.
- **Braced last turn** (`status().bracedLast`, either side): the brace ring's place and size (token + 3.6) in charcoal `#2e3338`, 3.2px, dashed 4/3, white underlay 6px. Braced now stays the solid charcoal ring.
- **Set spear hatching** (always on, both sides, a glance across the board): every empty hex next to a braced Heavy Anti-Cavalry gets red `#c62828` hatching (lines 1.5px at 55% opacity, 5px apart, at 45°) inside its Mark ring (the hatched hex is inset to sit within the dashed Mark outline). It goes once that spear has fired this turn (3.13). The set spear **badge** on the spearman (section 6) is different: it appears only when the previewed move or attack would set it off.
- Today's targets keep their red rings (white edge added).

### 4. First tap on a move hex: the preview
- The move hexes dim to 9%.
- **Route:** a polyline through hex centres from the unit to the end hex: white underlay 7px, then `#3f7fd6` 3.5px, round caps and joins. **One arrowhead** at the midpoint of the route's length, pointing along it: a filled triangle 10 long × 13 wide in `#3f7fd6` with a 1.6px white edge, drawn above units so a one-hex move still shows it.
- **Ghost** on the end hex (as today): the unit's token at 60% in its colour with a dashed edge.
- **Stops short:** the route is solid to the stop hex and the ghost sits there; from the stop hex to the tapped hex a 2px `#5f6762` line dashed 4/4; the tapped hex gets a dashed `#5f6762` outline 1.6px, dash 4/3, 3px inside the edge.
- **Range from the end:** the blue range outline is redrawn from the end hex (it replaces the one from where the unit stands). If `canAttackAfter` is false: no outline, and the "no attack after" badge on the end hex.
- **Badges** for `route().events` (section 6).
- **Confirm:** a second tap on the same hex, or the **Move** button (section 7). Tapping another move hex previews that one instead; tapping elsewhere cancels.

### 5. Attack picked: Evade and kill consequences
- The attack preview from brief 009 stays. On the field, while it is open, the attacker's **Evade hexes** (`evadeHexes`) show like move hexes (`#3f7fd6` at 18%), drawn only when at least one outcome leaves the target standing. Mark hexes among them keep the field's dashed zone rings; no extra badges there.
- **No "where you'll stand" marker** on the field.
- **Kill consequences:** under the outcome bar, aligned under the kill outcomes (the red segments), one pill per `killConsequences` event: height 15, radius 7.5, padding 0 6px, icon 11px + number, Plex Sans 700 10px white; red `#c62828` for damage (Set Spear icon + `2`), ink `#1f2421` for a stop (Mark icon). Show every event; never a subset.
- On the field, the braced spearman that would fire carries the set spear badge (section 6).

### 6. Badges on the field (one system)
- One shape: a pill 15 high, radius 7.5, white 1.2px edge; icon only on the field (19 wide), 11–12.5px glyph.
- **Where:** centred on one of the hex's four sloped edges, pulled in to 86% of the way from the hex centre to the edge midpoint, so it stays inside the hex's top and bottom. One spot per kind:
  - **Top right — stops you:** Mark. Ink `#1f2421` fill, white glyph. On the hex where the move stops. Glyph: the approved Mark icon ("Pulled in": hex with four arrows to a dot; paths in Icons).
  - **Top left — hurts you:** set spear. Red `#c62828`, white glyph. On the **braced spearman's** hex, not the hex entered. Glyph: the Set Spear icon (paths in Icons).
  - **Bottom right — you can't:** no attack after. `#f8f9f5` fill, `#5f6762` 1.2px edge and glyph (the sword struck through with a 1.8px diagonal). On the end hex.
  - **Bottom left — costs you:** tackle. Ink fill, white text `+0.5` (Plex Sans 700 10px, pill 30 wide). On the unit broken away from.
- Up to four on one hex never collide. If a badge would sit over another unit's token, it stays put (tokens are drawn under badges).

### 7. Action buttons and confirms
- **Order:** Attack, Reach (Anti-Cavalry only), Special, Brace. Four equal slots; units without Reach get a two-slot Attack. Attack, attack, attack, defend.
- **Confirms** (Move, Attack, Special) take the three attack slots; **Cancel** takes Brace's slot (one slot). Same height (56px) and radius (10px) as today.
  - **Move:** background `#3f7fd6`, white; move icon 22px; `Move` Plex Sans 600 15px; under it `−2 Stamina` 500 11px plus the Stamina squares (9×9, radius 2, white = left after the move, `rgba(255,255,255,0.35)` = spent, half squares as a split fill).
  - **Attack:** as brief 009 (red).
  - **Special:** background `#e2b53c`, 2px ink border, ink text; special icon 22px; the special's name (`Javelin`) 600 15px; under it `−1 Stamina` and the squares in ink.

### 8. Move panel (phone sheet under the field)
- The unit card row as v2, with the HP bar 4px lower (gap between name line and bar 9px).
- **The row under the HP bar shows coordinates only while a move (or Evade step) is being previewed.** At other times it shows chips (for example the Evade chip after an attack), one line of text, or nothing.
- **Route row** under it, present while a move is previewed (min-height 16px): left, aligned with the name: `C9 → G10` (from in `#5f6762`, arrow icon 13px, to in ink, Plex Sans 600 12px). Right: one chip per route event (icon 14px + number, Plex Sans 600 12px; red for damage), **right-aligned to the end of the HP bar** (never under the Stamina column) and filling **from right to left** in walking order. No events: the row shows only from and to.
- **Special preview** (target picked for a special): the attack preview layout; Strength shows its change struck through (`8` struck, `14`: Reach −1 then ×2 for Javelin); a `×2` stat with the special icon; one outcome (no dice): the bar is one segment, above it `100% · no dice`, under it the damage. No Evade after a Javelin. Then the Special confirm button.

- **Evade step** (after an adjacent attack the target survives, 6.5): tapping the unit shows its Evade hexes in move blue; the attack buttons are greyed (it has attacked); under the HP bar only an **Evade chip** (evade icon + the total hexes allowed, never counting down, right-aligned like the danger chips). A first tap on an Evade hex is the same preview as a move (route, arrow, ghost, badges, route row `G11 → G9` with the Evade chip); the confirm button still reads **Move**. End unit ends it without stepping.
- **A unit that can't move** (full movement used, not enough Stamina, tackled without the Stamina to break away, or stopped in a Mark this turn): no move hexes; under the HP bar one line in `#5f6762`, Plex Sans 500 12px: **`No movement available this turn`**. Its other buttons follow their own states (it may still attack).

### 9. Enemy tapped (approved 19 Nov, Enemy preview Rounds 3 and 4)
Tapping an enemy unit on your own turn (one that is not a target of your selected unit; a target still opens the attack preview) shows, from where it stands now:
- **Its moves on its next turn** (full Stamina less any penalty such as bracing, its side's full Command): the same flat tint as yours, in threat orange `#c75400` at 16%.
- **Its range:** the same solid line as yours (1.6px), in `#c75400`; Reach as six separate hexes.
- **Its special, if ready this turn:** the same double line as yours, in plum `#6a3d8f` (3px + 1.2px, inset as section 3). Its warm-up ring is plum too: dashed while warming up, thick when ready (section 3).
- **What it can hit now:** each of your units in its normal or special range gets four short sight marks at 45°, 135°, 225° and 315° round the token, from token radius + 3 to + 10, `#c75400` 3.6px with a white underlay, round caps.
- The tapped enemy gets a solid `#c75400` selection ring (token radius + 6, 2.5px).
- **Colours follow the side to move**, not North and South: in a two-player game each player sees their own marks in blue and the opponent's in the threat colours, flipping each turn; against the bot the human is always blue. Tokens keep their team colours.
- **The action panel stays:** the enemy's card (`Next turn` Stamina) in the unit row; Attack, Reach, Special, Brace and **End unit** greyed (35% opacity); **Undo** and **End turn** stay live. Tapping a greyed button shows a message just above the unit panel, centred: `Pick one of your own units` (Plex Sans 500 13px, white on `#1f2421`, padding 9px 14px, radius 18, soft shadow), gone after 2 seconds or on the next tap.
- Nothing from your own selection shows at the same time (tapping an enemy clears it), so yours and the enemy's never overlap.

- **Your turn, nothing tapped:** the full action panel shows, unit buttons and End unit greyed, Undo greyed until there is something to undo, End turn live.
- **Key rows** for this view (only what is on screen): Enemy moves; Enemy range; Enemy special (double plum line); Enemy special ready (thick plum ring, dashed while it warms up; yours are gold); It can hit you (four sight marks); Set spear (red hatching inside a Mark). The full action panel stays under the key.
- **Desktop:** the same field marks; the enemy's card in the side column (where the attack preview sits, column 2) and the full action panel under it, greyed as on the phone.

### 10. The key (pull-up drawer)
As brief 009's key: hidden by default, first-time hint. In the move preview it lists **only what is on screen now**, each with one line saying why it is there (for example: `Mark — The Heavy Anti-Cavalry on F12 marks F11: the move stops there.`). Row: 28px swatch drawn like the mark itself, name Plex Sans 600 12px, line 400 11px `#5f6762`.

### 11. Field
- **Zones:** deployment arc hexes `#eceee8`, goal-zone hexes `#d9ddd4`, the same for both sides (no team colour). The flag hex stays `#b07a33`.
- **Pitch lines** (a picture only; rules use the hexes), `#9ea693`, 1.6px, no fill, clipped to the field's outline: a circle round each flag hex centre of radius (deploy rings + 0.25) × the hex centre-to-centre distance (deployment arc: 3.25 with today's 3 rings; 2.25 on a 5v5 field that deploys 2 rings, brief 014; read the rings from the field data, never hard-code them), a circle of radius 1.25 × that distance (goal circle), and a straight halfway line across the field through the centre of the field's middle row (E10 on today's field; read it from the field data so the 9v9 and 13v13 fields get theirs). Drawn under every mark and unit.
- **Flag pill** (replaces the `10+20` text): on the flag hex's outer flat edge (top edge for North, bottom edge for South), centred: pill 30×15, radius 7.5, fill `#b07a33`, white 1.2px edge, flag icon 10px + the flag's own HP (Plex Sans 700 10px white). The holder's token shows its own HP as any unit does. The pooled total shows only in the attack preview when the holder is attacked (as today).
- **Token HP number:** 0.76 × token radius below the centre (was 0.62); icon unchanged.

### 12. Team colours as a layer
Every team colour (North, South, their dark edges, arcs if ever coloured again, scoreboard tints) is read from the skin by side, never hard-coded in drawing code, so jersey choice can swap them later without touching the board. Zones and pitch lines use no team colour.

### 13. Desktop (900px and wider)
- Same marks and badges on the field.
- **Hover previews a move:** pointer over a move hex shows the full first-tap preview; **one click moves** (moves can be undone). Escape cancels. Attacks and specials keep their preview and confirm.
- The move preview, special preview and attack preview sit where today's attack preview sits (right column, row 4, over the roster and Recent); the roster and Recent come back when the preview closes. The unit bar and action buttons stay above it. Nothing is removed from the side column.

## Rules it touches
2.11 routes (new behaviour behind the switch); 3.8 Mark stops (entering on the route); 3.13 set spear on entering, once per turn per unit and per spear; 3.9/6.6 tackle cost and its hex of the cap; 3.6 taking the hex after a kill (kill consequences); 6.5 Evade (hexes, no Evade after a kill or after a Javelin); 4.9 flag block in ranges; 6.16/6.17 specials and warm-up; 1.13 and 1.16. Each gets a test that the preview and the real action agree: for 1,000 random legal moves in seeded positions, `route().end` equals where the move actually ends and the events equal what the log records.

## Bot minimum
The bot moves with the same route function. In 100 seeded bot-vs-bot games on the new preset: the bot's predicted end hex equals the actual end on every move (report the count of moves and of moves that stopped short), and its move scoring uses the route's events (report how many bot moves took set spear damage and how many entered a Mark before their chosen hex, against the same counts on the old preset). Brain settings unchanged.

## Must not change
Every existing preset plays and replays identically (`regress_engine.js` hashes). No rule other than 2.11's routing. The attack maths. Brief 009's screens except as listed here.

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes for untouched presets match.
- `test_route.js` (section 1 cases) and the preview-agrees-with-action test pass.
- Screenshots at 390×844 and 1280×800 of: unit tapped (Light Ranged; Light Anti-Cavalry with Javelin ready), a first tap with a clean route, a stop short, a move into a set spear, a Heavy Ranged full move (no attack after), an attack with Evade hexes and kill consequences, a Javelin preview.
- No screen text uses Plex Mono.

## The Editor's hands-on check
Play one match on a phone: tap a Light Ranged and preview three moves (one clean, one that stops in a Mark, one next to a braced Heavy Anti-Cavalry); attack with a Light unit and check the Evade hexes; warm up and fire a Javelin. On desktop, hover-move a unit and undo it.

## Report back
The standard items, plus: the route test table (set-up, expected route, actual route); the bot counts above; any spot where the preview and the action disagreed and how it was fixed; the preset id taken.

## Icons
(24-unit grid, stroke 1.9, round caps and joins.)
- **Mark ("Pulled in", approved 18 Nov):** `M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z` · circle cx 12 cy 12 r 1.3 filled · `M12 6.5v2.8` · `M10.8 8.2 12 9.4l1.2-1.2` · `M12 17.5v-2.8` · `M10.8 15.8 12 14.6l1.2 1.2` · `M6.8 12h2.6` · `M8.3 10.8 9.5 12l-1.2 1.2` · `M17.2 12h-2.6` · `M15.7 10.8 14.5 12l1.2 1.2`
- **Set Spear (Icon library Round 1):** `M4.5 20.5 16 9` · `M14.2 6.2 19.8 4.2l-2 5.6-2.4.2-1.4-1.4z` · `M3 20.5h8` · `M8.5 16.5l2 2`
- **Move / arrow:** `M5 12h12` · `M13 7l5 5-5 5`
- **Flag:** `M6 21V4` · `M6 4h11l-2.5 4L17 12H6`
- Sword, Special, Brace, Reach, Strength (Maul), Dodge, Evade: as in `app.js` today.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
