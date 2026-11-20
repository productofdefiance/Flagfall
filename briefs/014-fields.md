# Brief 014 — One field per format, and the hot-seat snap

| | |
|---|---|
| Game version | Next free **YY** at merge (a new rule set: a real change), ZZ = 00 |
| Lane | Rules (also touches UI, Bot and Lab) |
| Rule set | New preset: the newest preset at build time plus switch `fields`. As planned that is v3.6 (after briefs 010 and 011), so this one is **v3.7**. If the order changes, take the next free id and say so in the Report |
| Date | 19 Nov 2026 |
| Goal | 5v5 and 7v7 move to their own new fields, 9v9 and 13v13 fields exist in the data for brief 012, and in human-vs-human games the board scrolls to the side to move's own end (Game Laws 2.1, 2.4, 2.5) |
| Branch | Any branch your session may push to, started from `brief/014-fields` |
| Flags | none to close; open new ones as found |
| Waits on | 011 |
| Order | **After 011 merges** (rule changes go one at a time) and **before 012** (Cavalry is tested on these fields) |

## Context
Today every format plays on one field: 139 hexes, columns A–I, 19 rows, flags E3 and E17. On 19 Nov the Editor locked one field per format (Game Laws 2.4), a 2-ring deploy area for 5v5 (2.5), and that 5v5 and 7v7 are foot only (2.1). The fields were designed on the UI Brainstorm canvas, Fields page; Round 8 shows the four locked fields. This build is a rule change for 5v5 and 7v7, so it gets its own preset and baseline. 9v9 and 13v13 are Cavalry formats; their fields go in now so brief 012 can use them, but they stay unplayable until 012 sets their Command, turn limit and Cavalry.

The Editor also hit a problem in a hot-seat game: when the turn changes, nothing on the field moves, so it's easy to miss. The scroll snap below is his fix for phones. The text cue ("South to play") is **not** in this build: it is parked in the Ideas Log until designed.

Everything below is in the Game Laws (2.1, 2.4, 2.5). Where this brief and the Laws disagree, the Laws win: say so in the Report.

## Scope
In: field data per format; preset v3.7 with switch `fields`; the new 5v5 and 7v7 fields and 5v5's 2-ring deploy; the 9v9 and 13v13 fields as data only; field geometry per match everywhere it is used today (engine, board drawing, bot, lab); the hot-seat snap; the baseline; the turn-1 design-rule check.

Out: making 9v9 or 13v13 playable (brief 012); any change to how v3.6 or older presets play; the turn-change text cue (Ideas Log, UI table); a zone layer for bots and the lab (Ideas Log, Computer opponent table; only the data shape below should leave room for it); an option to flip the field each turn (none exists today).

## What to build

### 1. Field data
A new data module (for example `board/fields.js`) holds one field per format. Each field has: `id`, format size (5, 7, 9, 13), number of columns, number of rows (the middle column's), the list of hexes, the two flag hexes, and the deploy radius. The legacy field is a fifth entry (`legacy`: today's 139 hexes, E3 and E17).

The exact hexes are in **`briefs/014-fields.json`** (every hex of every field, plus flags and the expected counts). Build the data from it and keep a test that checks the data against it. Summary, column by column (rows are inclusive and every column is unbroken):

| Field | Hexes | Flags | Deploy radius | Columns (rows) |
|---|---|---|---|---|
| 5v5 | 103 | D3, D15 | 2 | A 3–14 · B 2–16 · C 1–16 · D 1–17 · E 1–16 · F 2–16 · G 3–14 |
| 7v7 | 147 | E3, E17 | 3 | A 4–16 · B 2–17 · C 2–18 · D 1–18 · E 1–19 · F 1–18 · G 2–18 · H 2–17 · I 4–16 |
| 9v9 | 203 | F4, F20 | 3 | A 7–16 · B 4–20 · C 2–21 · D 2–22 · E 1–22 · F 1–23 · G 1–22 · H 2–22 · I 2–21 · J 4–20 · K 7–16 |
| 13v13 | 263 | G4, G22 | 3 | A 8–18 · B 4–21 · C 3–23 · D 2–23 · E 2–24 · F 1–24 · G 1–25 · H 1–24 · I 2–24 · J 2–23 · K 3–23 · L 4–21 · M 8–18 |

The 7v7 field is the legacy field plus B2, H2, B17, H17, A4, I4, A16 and I16, nothing removed.

**Which field a match uses:** a preset with switch `fields` uses the field for the match's format. Every older preset uses `legacy` for every format, forever.

### 2. Hex names (Game Laws 2.4)
Column letters run from A on the left. The **middle column** is a full column: its row r sits at height r. A column an **odd** number of columns away from the middle sits half a hex lower: its row r sits at height r + 0.5, between the middle column's rows r and r+1. A column an even number away sits like the middle column.

For today's 9-column field this is exactly the engine's current rule (odd column index = half a hex lower). For 7 and 11 columns it is the **opposite** of index parity (the middle column, D or F, has an odd index). So parity, positions and distances must be worked out relative to the middle column, never from the column index alone. `regress_engine.js` will catch it if the legacy field changes.

### 3. Geometry per match
Today the field is built once at the top of `engine.js` (`COLS`, `NCOL`, `NROW`, `FLAG`, `CELLS`, `CELLSET`, `NBRS`, `GOAL`) and drawn with fixed sizes in `app.js` (`W = 14 * R + …`, `HH = 19 * H + …`). Make it come from the match's field, everywhere:
- **Engine:** distances, neighbours, straight lines (Reach, Javelin, Skewer, Charge lines), goal zones, deploy zones, flag hexes, "on the field" checks.
- **Board:** the drawing's size and positions, column letters and hex names, from the field.
- **Bot and brains:** `E.FLAG` lookups and every fixed hex name. `bot.js` and `app.js` use `"E10"` as the middle of the field (deploy ordering, opening scroll, bot positioning). Replace it with the field's **centre hex**: the middle column at row (rows + 1) / 2, so D9, E10, F12, G13.
- **Lab and sims:** anything that reads field geometry (`sims/lab/`, `sims/baseline.js`).

Report every place that had the field built in and what replaced it.

Give the field object small helpers a later zone layer can use without reshaping it: distance from a hex to each flag, the centre hex, the row count, and each hex's offset from the middle column. No zones in this build.

### 4. Preset v3.7
A copy of the newest preset with `fields: true`. Deploy radius per format lives in the rule set: `game.deployRadius5: 2` beside the existing `deployRadius: 3`, read the same way as `turnLimit5` / `turnLimit7`. One unit may still deploy on its own flag (2.5). Turn limits unchanged (25 at 5v5, 35 at 7v7).

### 5. Setup screen
5v5 and 7v7 play on their new fields with v3.7. 9v9 and 13v13 stay greyed out ("come later") as today. With an older rule set chosen, every format plays on the legacy field as today.

### 6. The hot-seat snap
In a match where **both sides are human**, each time the side to move changes during play, scroll the field so that side's own field edge sits at the edge of the field view nearest it:
- North to move: scroll to the very top of the field.
- South to move: scroll to the very bottom.

Smooth scroll. It also applies to the first turn of play after the start cover. It does nothing when the whole field already fits in view (desktop), in games against the bot, during deployment (which keeps its covers and scrolling), or in watch and replay views. The player can scroll freely after the snap.

In the Report, measure on a 390 px wide phone layout, for each of the four fields: the field's height on screen, the visible field height between the top bar and the action panel, and whether a side's whole half (its own field edge to the centre hex's row) is in view after the snap. The design estimate was about 590 px visible; the 5v5 field is the tightest (its half is about 507 px tall).

## Rules it touches
Each becomes a test on v3.7 where it applies:
- Deployment (2.5): 19 hexes per side at 5v5, 30 at 7v7, the flag hex allowed for one unit.
- Goal zones (2.4): six hexes round every flag, on every field.
- Room Dodge (3.5): the field edge is not open ground, on the new edges.
- Mark (3.8), set spear (3.13), Reach and straight lines (3.10), Volley range (3.11), Evade (6.5): geometry only, checked on the 7-column field, where parity is flipped.
- The flag holder (4.2–4.5): storming only from the goal zone.
- Turn limit by format (2.7): unchanged.

## Bot minimum
Brain 5, the default, plays v3.7 at 5v5 and 7v7 with no illegal action, no crash and no fixed hex name. Proof: 200 seeded bot-vs-bot games per format, zero errors, every unit deployed inside its side's deploy area (2 rings at 5v5). No tuning in this build: report how the stall rate moved, without changing the brain.

## Must not change
- Every existing preset plays and replays identically on the legacy field (`regress_engine.js` hashes match).
- No rule other than the field and 5v5's deploy radius.
- The board's look, apart from the field's shape and size.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every existing preset match the previous board.
- New `board/tests/test_fields.js`:
  - each field matches `briefs/014-fields.json` exactly (hexes, flags);
  - deploy hexes per side 19 / 30 / 37 / 37, gap between deploy areas 8 / 8 / 10 / 12, six goal-zone hexes round each flag;
  - each field is mirror-symmetric North to South and left to right;
  - the legacy field is the old 139 hexes;
  - **the turn-1 design rule (2.4):** on every field, the gap between deploy areas is larger than the furthest any card in the newest preset can reach on turn 1 (movement cap plus attack range, today 7). Write it so that a future card or trait that adds reach fails this test.

## The Editor's hands-on check
1. On the phone, start a human-vs-human 7v7 on v3.7: the field is the rounded one, and at each turn change the field scrolls to the side to move's end.
2. Play a 5v5 against the bot on v3.7: the small field, deploy two rings round the flag.
3. Open an old saved match: it replays on the old field.

## Report
*Filled in by Claude Code.* Branch: `claude/peaceful-gates-2o8r34` (started from `brief/014-fields`, `main` merged in). Game version **v3.11.00**, Build 15.

- **What's in:**
  - **Rule set v3.8** (not v3.7: brief 011 took v3.7 first). v3.7 plus switch `fields` and `game.deployRadius5: 2`. Newest preset, so the new-game default. Turn limits unchanged (25 / 35).
  - **Field data** in `board/fields.js`: legacy (139), 5v5 (103), 7v7 (147), 9v9 (203), 13v13 (263), each column as first/last row. Matches `briefs/014-fields.json` hex for hex (checked in `test_fields.js`).
  - **Hex names (2.4):** positions and distances are worked out from each column's offset from the middle column. On 9 and 13 columns this equals the old index rule; on 7 and 11 it is flipped (tested on 5v5 and 9v9).
  - **Which field:** a v3.8 match records `field` ("5v5", "7v7") in its state, from its unit cap; every older rule set records nothing and plays on legacy for every format. 9v9 and 13v13 stay greyed out on Setup.
  - **Hot-seat snap:** both sides human, side to move changes (first turn after the start cover included) → smooth scroll to the very top (North) or very bottom (South). Skipped against the bot, during deployment, behind a cover, and when the field fits. Watch links are bot vs bot, so never.
  - Bot: no tuning. Brain 5 reads the match's field everywhere.
- **Every place the field was built in, and what replaced it:**
  - `engine.js` top: `COLS`, `NCOL`, `NROW`, `FLAG`, `CELLS` (the oval formula), `CELLSET`, `NBRS`, `GOAL`, `parse`, `geo`, `cube`, `dist`, `straight2`, `middle`, `flagBetween`, `deployZone`; and further down `fromCube`, `lineBetween`, `hexBehind`, `arcOf`, `onFlag`, `homeOf` → one `makeField()` per field; every rule calls `fieldOf(st)`. `deployZone` reads `deployRadiusFor(rs, size)`. The old exports stay, bound to legacy, for old tests.
  - `bot.js`: `E.dist`, `E.FLAG`, `E.GOAL`, `E.NBRS`, `E.flagBetween` (about 30 uses) → `E.fieldOf(st)`. Deploy: `mid = "E10"` → the field's centre hex; "column E is central" (`parse(h)[0] - 4`) → the hex's offset from the middle column.
  - `app.js`: `W = 14 * R + …`, `HH = 19 * H + …` → from the field's columns and rows; `pos()`, hex drawing, goal and flag colours, edge markers, the pull ring, flag taps, `"E10"` as the opening scroll (three places) and the hand-deploy "Fill rest" order → the match's field and its centre hex.
  - `ui.js`: Reach check in the attack preview (`E.dist`) → the match's field.
  - Lab and sims: `sims/lab/measures.js` (flag-line pairs, stall gap and adjacency), `sims/baseline.js` (holder dragged off), `sims/sim_games.js` (keeper home at pull) → the match's field. `watch.js` and `brain.js` had none.
  - Hex names in the board's code: none left (`test_fields.js` fails on any `E.dist`/`E.FLAG`/… or a quoted hex name in `bot.js`, `brain.js`, `app.js`, `ui.js`, `watch.js`).
- **Anything beyond the brief, and why:**
  - A lab measure `fields` (field played, units deployed outside their area, units started on their flag), to prove the bot minimum's deploy check on the lab's games.
  - Two job orders, `fields-v38` and `fields-v37` (same seeds, 1,000 games per format each), for the baseline table.
  - Two old checks adjusted for a new newest preset, no rule change: `test_v37.js` (v3.7 is no longer the newest; its "no specials" loop now picks rule sets without the switch) and `test_reasons.js` (its hand-made positions are legacy hexes, and one lineup happens to be 5 units, which on v3.8 means the 5v5 field: the check now keeps the legacy field).
  - Rules screen: "Deployment radius, 5v5" and the "One field per format" switch.
- **Checks run and results (paste regression hashes):** PENDING
- **Baseline table (rule changes only):** PENDING (lab run on this pull request)
- **The snap measurements (390 × 844 phone, headless Chromium, this build):** visible field view between the top bar and the action panel: **487 px** (design estimate ~590). Whole half in view = own edge to the middle of the centre hex's row.
  - 5v5: field 1,014 px tall (hexes 68 px wide; it fills the width), half 507 px: **not in view** (20 px short; 49 px to the centre hex's far edge). F43.
  - 7v7: field 897 px, half 449 px: in view.
  - 9v9: field 898 px, half 449 px: in view (worked out from the same drawing; not playable to measure live).
  - 13v13: field 833 px, half 416 px: in view (same).
  - The snap itself, measured: 5v5 and 7v7, North's turn 1 at the top (0 px), after End turn South at the bottom (526 / 410 px, the scroll maximum), after South's End turn North back at 0. Also checked on v3.7 (legacy field).
- **Bot minimum (met / not met, with numbers):** PENDING
- **Settings review (brain builds only):** not a brain build (no brain added or tuned).
- **Known gaps:**
  - F43: a whole 5v5 half doesn't fit on a 390 × 844 phone after the snap.
  - A match whose unit cap matches no field (not possible from Setup today) falls back to the legacy field on v3.8.
- **Flags closed / opened:** closed none; opened F43.
- **Pull request:** PENDING
