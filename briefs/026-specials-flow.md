# Brief 026 — Specials flow: one-tap warm-up, the special row, the gold sheet (Approved UI v6)

| | |
|---|---|
| Game version | **YY** (new screens: a real change), ZZ = 00. Code takes the number at its last sync before Ready for review. |
| Lane | UI |
| Rule set | none. No preset, no rule change. |
| Date | 21 Nov 2026 |
| Goal | Make specials quick and clear: a Special button with five plain looks, warm-up in one tap (undoable, like Brace), a special row with the special big in Attack's slot, one row-per-target sheet for every special in a gold look, and a special preview that warns about a kill's set spear and Mark. |
| Branch | Any branch your session may push to, started from `brief/026-specials-flow` |
| Flags | none to close. Open new ones in `flags/026.md`. |
| Waits on | 018 |
| Order | **After brief 018 merges, before brief 012 Cavalry** (the Editor, 21 Nov, 6:58 pm ET: 018, then this, then 012, so Cavalry's specials, Charge and Breakaway, land on the finished special sheet). 018 changes the same panel and drawing code. Run `sync` first. |

## Context
Brief 011 built the specials (warm-up, fire, the Special button, the special preview) and brief 025 fitted them to the phone. Playing #47, the Editor found the flow slow and unclear: a confirm step to warm up, a state bar that covered the special's name, a re-warm that looked unwarmed, and a special preview that hid a kill's set spear (Approved UI v5, Final 09: a killing Pick Off steps next to a braced spear with no warning).

The new design was worked out on the UI Brainstorm canvas, **Specials** page, Rounds 1 to 12, and approved by the Editor on 21 Nov (items 1 to 9 at 2:00 am ET, item 3 amended and item 10 added at 2:29 am, items 11 to 15 at 6:27 pm). **Round 12 is the approved set: 18 frames**, copied to the Approved UI canvas as page **v6**. Pictures of all 18 are in `briefs/img/026/` (`01-unused.png` … `18-pickoff.png`), drawn at **393 × 665** on the real v3.14.00 board, so you never need to open a canvas. **Where a picture and this brief differ, the brief wins.** The generators that drew them are on branch `ui/mockup-generators`, `ui-mockups/specials/` (`sp12a.py` frames 01 to 13, `sp12b.py` frames 14 to 18); every colour and size below was read from them.

Rules that apply: Game Laws 6.16 Firing (warm-up, fire, re-warm; **re-warming stays legal**: a charged special with no target may warm up again), 6.17 (targets), 3.6 and 3.13 (taking the hex, set spear), 1.13 (what is shown is the true state), 1.16 (nothing empty is offered), 7.9 (symmetrical, elegant, clean). **Every number, target, reason and consequence on screen comes from the engine (`E.options().special`, `specialPreview`, `killConsequences`, `warmupBlock`, `fireBlock`); this brief restyles and reroutes them and computes nothing new** (CLAUDE.md pitfall 1).

## Scope
In: the Special button's looks; warm-up in one tap and its Undo; the special row (tapping a charged special); targeting, no-target and reason pills; the special sheet (layout and look) for every special; kill consequences on the special preview; the Brace button's two states; the same behaviour on desktop in desktop's own layout.
Out: any rule or preset; the bot; the attack preview and flag pull sheets (unchanged from 025); the special's range drawing on the field; Cavalry's specials (brief 012 uses this sheet); dropping the re-warm (the Editor's 20 Nov question stays open in the Roadmap, not reopened here).

## What to build

### 1. The Special button: five looks (item 1)
No state bar, no cost on the button. Icon (the bolt, 22 px) over the special's name (600 11 px, one line, never wraps, as 025 §4). 48 px tall, radius 10, as every action button.

| State | Background | Edge | Icon and name | Picture |
|---|---|---|---|---|
| Unused | `#f8f9f5` (as today) | 1 px `#1f2421` | `#1f2421` | 01 |
| Warming up | yellow-grey `#ebe8d9` | **2 px dashed** gold `#e2b53c` | `#4b514d` | 02 |
| Charged (with or without a target) | gold `#e2b53c` | 2 px solid `#1f2421` | `#1f2421` | 03, 04 |
| Used | grey `#e3e5e0` | 1 px `#c4c9c2` | `#9aa09b` | 05 |
| Can't warm up this turn (e.g. braced) | yellow-grey `#ebe8d9` | 1 px `#d6d1b8`, no gold | `#7d827e` | 06 |

The dashed-gold-on-yellow-grey is **the warming look everywhere** it appears (this button, and the Warm up button in section 3). Remove brief 025's state bar (§ review fix 3) entirely.

### 2. One-tap warm-up (items 2, 9)
- Tapping an **Unused** Special button warms up at once, like Brace: `act({type: "warmup", uid: ui.sel})`, no confirm. The button turns to the warming look; the unit bar shows the note **`Fires next turn · no attack or brace`** (025 §5's note style and place) (picture 02).
- **Retired:** brief 025's warm-up confirm (Final 11: the big `Warm up <name>` / `Warm up <name> again` button with `−1 Stamina`, and its Cancel), the `ui.sheet.kind === "warm"` step, desktop's warm-up line, and the note `No target in range · fires next turn`. The only special note left in the unit bar is `Fires next turn · no attack or brace` while warming (item 5).
- **Undo takes a warm-up back** (section 9).

### 3. Tapping a charged special: the special row (items 3, 6)
Tapping a **Charged** Special button (with or without a target) turns the UNIT row into three buttons (pictures 09, 12). Today's `case "special"` in `board/app.js` opens targeting only when `o.special.fire` is true and otherwise falls through to the warm-up sheet; replace that branch so every Charged tap opens this row.
- **Attack's slot (the two-part go button, flex 2):** the special, big and gold: background `#e2b53c`, 2 px solid `#1f2421`, ink text, bolt 22 px, first line the special's name, second line:
  - `N targets` when it has several (`2 targets`);
  - `No targets` when it has none (the engine's `fireBlock` is `No target in reach`). Note `o.special.targets` is also empty when `fireBlock` gives any other reason (reloading, braced, already attacked, not enough Stamina). Not drawn, reading: then the second line reads `Can't fire` and tapping it gives that reason in the dark pill (section 5). Screenshot it and raise an `ASK`;
  - `−1 Stamina` and the squares (from the engine, as the attack's go button) when the next tap fires (one target, or a target chosen).
- **Special's slot:** **Warm up**, a plain button (Unused look, bolt over `Warm up`), no cost shown. Not drawn, reading: when the engine forbids a re-warm (`o.special.warmup` false, e.g. braced this turn), Warm up shows in the Can't-warm-up look and tapping it gives the reason in the dark pill.
- **Brace's slot:** **Cancel**, as an attack's Cancel. It closes the row back to the unit's normal buttons.
- **Tapping Warm up** (picture 11, amended 2:29 am) warms up at once (`act({type:"warmup"})`) and **keeps the row open**: the big button greys (background `#eef0ec`, 1 px `#c4c9c2`, text `#9aa09b`) with the second line **`Warming up instead`** (colours from the approved frame's generator; reading: tapping it does nothing); Warm up turns to the warming look; the note shows in the unit bar; Undo is live. **Cancel then closes the row and keeps the warm-up. Undo takes it back.** You either fire or warm up, never both.
- **Moving from the special row** (item 6): tapping a move hex previews the move as usual (the row becomes Move and Cancel). After the move, tap the special again to reopen the row.

### 4. The big button (item 4)
- **Several targets:** tap the big button: its targets ring red as Attack's do, and the dark pill (`#hint`) reads **`Tap a red ring`** (picture 10). Tap a ringed unit: the special sheet opens on it and the big button's second line becomes `−1 Stamina` and the squares; tap it to fire (picture 14).
- **One target:** tapping the charged Special button opens the sheet on that target at once and the big button fires (picture 15). Warm up stays beside it, so nothing forces a fire.
- **No target:** the big button stays gold with `No targets` (picture 12). Tapping it shows the reason in the dark pill, then `· move, or warm up` when a re-warm is allowed (picture 13, approved: **`No enemy adjacent · move, or warm up`**). The engine says `No target in reach`; the board shows it as `No enemy adjacent` for the adjacent specials (Arc Hit, Pick Off, Skewer: `specialCanTarget` at distance 1) and `No enemy in range` for the others (section 5's wording table).

### 5. Notes and reasons (item 5)
- No charged note in the unit bar: it keeps hex and moves.
- **Used** and **Can't warm up** buttons can be tapped: they give their reason in the dark pill and do nothing else (pictures 05, 06).
- **Wording table (display only; the engine's reason decides which line shows, the board only words it).** The approved frames reword three engine reasons; every other reason shows in the engine's own words:

  | Engine reason (`warmupBlock` / `fireBlock`) | Dark pill | Source |
  |---|---|---|
  | `Used` | `<special> used · once a match` (`Arrow Storm used · once a match`) | picture 05 |
  | `Braced this turn` | `Braced this turn · warm up next turn` | picture 06 |
  | `No target in reach` | `No enemy adjacent` or `No enemy in range` (section 4), then `· move, or warm up` if a re-warm is allowed | picture 13 |

  Put the table in one place in `board/app.js` with a test that every engine reason string it maps still exists in `engine.js` (so an engine rewording fails the build, not the screen). List every reason and its shown words in the Report.
- Not drawn, reading: tapping a **Warming up** button shows `Fires next turn` in the dark pill. List it in the Report.

### 6. The special sheet (items 10, 11, 12, 13)
**Every special uses this sheet, one target included** (so Skewer never switches layout with who stands behind its target). It replaces brief 011's special preview and 025 §6's special version of the shared sheet (the attack preview and flag pull keep 025's sheet). As 025 §6, it takes the unit bar's place while open, sits directly above the action panel, and the field keeps 025's scroll room so every unit in the special sits above it (review of #47, fix 5).

Pictures: 14 (one target), 16 (Arc Hit, three), 17 (Skewer, two), 18 (Pick Off kill into a set spear).

**6.1 Frame.** Full width, white (no tinted background), today's rounded top corners and shadow, **3 px gold `#e2b53c` top edge**. Padding 7 px top, 14 px sides, 4 px bottom. The key handle on top in its standard grey (36 × 4, radius 2, `#b8beb6`), 6 px under it; it opens the key as 025's handle does.

**6.2 Attacker line**, 24 px tall, items 7 px apart, left to right:
- the attacker's token 22 px with a **soft gold glow** (`box-shadow: 0 0 0 3px rgba(226,181,60,.35), 0 0 12px 3px rgba(226,181,60,.55)`, round);
- its full name (Barlow Condensed 700, 14 px) and the (i) 14 px `#5f6762` (token, name and (i) open its card, as 025);
- 4 px further: the special named in gold capitals with its icon: bolt 13 px `#e2b53c`, then the name (Barlow Condensed 700, 12 px, letter-spacing 0.08em, `#8a6410`): **`⚡ ARC HIT`**;
- pushed to the right edge: Strength (its icon 13 px, number 600 12 px `#5f6762`), then **the multiplier, always, `×1` included**, 3 px after it in `#8a6410`: `10 ×1`, `9 ×1.75` (item 13; this replaces 025 §6.3's multiplier rule for specials);
- 6 px after: **`Sure hit`** (600 11 px, `#8a6410`), which replaces `no dice`.
There is no outcome bar (specials never roll) and no percentages row.

**6.3 Target rows**, 4 px under the attacker line, inside a **thin gold rule** tying them to the attacker: a 2 px `#e2b53c` line on the left, 10 px in from the sheet's padding, rows 8 px to its right. One row per target, in the engine's hit order. Each row: padding 3 px top, 4 px bottom, a 1 px `#e3e6e0` line above it.
- **Line 1, 20 px tall, 7 px gaps, mirrored as the defender's side of an attack preview** (item 10, "mirrored A"):
  - left: the **damage** (700 15 px, ink, **red `#c62828` when it kills**), then a kill's pills (6.4), then the target's HP now (600 11.5 px `#5f6762`, `6/15`);
  - right, ending at the right edge with **token (18 px) and full name outermost** (Barlow Condensed 700, 13.5 px; then the (i) inside the name): before them, that target's own modifiers, 7 px apart, each icon 13 px + number 600 12 px `#5f6762`: Support (per target), Armor, Brace, Dodge (per defender), as the attack preview's defender side. Picture 16 shows Dodge as `15%` with no icon; reading: give it its icon as the attack preview does, and say so in the Report.
- **Line 2:** the target's HP bar, 4 px tall, 3 px under line 1, inset 25 px from the left and 46 px from the right, **filling from the right** (mirrored) in the target's team colour, the damage hatched **gold on every target, kill or not** (`repeating-linear-gradient(135deg, #d4a020 0 2px, #fff 2px 3.5px)`), track `#dfe3dc`.
- Name blocks are never moved, shrunk, truncated or covered (025's rule).

**6.4 A kill's consequences (item 8)**. When a hit kills and the special takes the hex (Pick Off only, today: `killConsequences(st, uid, target, {special: true})`), the row shows the same pills as the attack preview's results, beside the damage on that row: the **set spear pill (red, the attack preview's own `kpill hurt`, with its amount: picture 18 `2`)** and the **Mark pill** when the hex is in a Mark. Not drawn, reading: the Mark pill sits after the spear pill, same size. The field also shows the **spear badge** on the hex, as the attack preview does for a kill (017).

**6.5 Anything else today's special preview shows** (Parry on the target, Evade after a special that leaves its target standing, the attacker's HP after a parry): not drawn. Reading: Parry goes in the target's modifiers in red, as 025 §6.3; an Evade or a parry that hurts the attacker keeps today's wording, on one line under the rows. Screenshot each in the Report; raise an `ASK` if it doesn't fit.

**6.6 Heights at 393 px** (from the approved frames; field left in view follows): one target about **84 px** (today 137), Skewer two targets **120 px**, Arc Hit three targets **155 px** (within today's 137 to 156).

### 7. Desktop (item 7)
Desktop (900 px and wider) gets **the same behaviour** in its own layout: the five Special button looks, one-tap warm-up and its Undo, the special row (big special in Attack's place, Warm up, Cancel), the big button flows, the reasons (desktop shows them where it shows a disabled button's reason today), the special sheet's rows, gold look and kill consequences inside desktop's preview area, and the Brace states. Not drawn: build it, screenshot each state at 1280 × 800, and raise an `ASK` for anything that doesn't sit well.

### 8. Brace button states (item 14)
- **Braced this turn:** the whole button solid charcoal `#2e3338` (1 px edge the same), shield and label white (picture 07).
- **Braced last turn:** light charcoal tint `#e4e6e3`, 2 px dashed `#2e3338` edge, shield and label `#2e3338` (picture 08). (White on mid-grey fails contrast.)
These replace today's look on the button (the `braced` class's 2 px brace-colour edge and the `dot` mark, blue or ring, in `board/app.js`); whether Brace can be tapped is unchanged (the engine's `o.brace`). The field's brace rings and the unit card's chips are unchanged. Same in every panel that shows Brace, desktop included.

### 9. Undo (items 2, 15)
- Undo takes back **both one-tap actions**: a brace (as today; check it still works) and a **warm-up** (new). Add `"warmup"` to `canUndo()`'s list in `board/app.js`. Undo is a board feature (it pops the last action and replays), so **the engine is not changed**; no dice are rolled in a warm-up, so it is safe.
- After undoing a warm-up the side is exactly as before: the Special back to Unused (or Charged, for a re-warm), the unit's Stamina **and the side's Command** restored (`spend()` takes the cost from both).
- Undo clears the selection as today (`undo()` sets `sel` to null), from the special row too.
- Undo still refuses after an attack, a pull or a fired special. Today a fired special greys Undo with no reason (`undoWhy()` returns null for it). Reading: add `Can't undo a special once fired`.

### 10. Engine check: a killing Pick Off deals its set spear (item 8)
The engine appears to deal it: `doSpecial` steps a killing Pick Off into the hex and runs `spikeCheck` under `captureTriggersSpike`, the same call `killConsequences` uses for the preview. **Prove it with a test** on the newest preset: a killing Pick Off that steps next to a braced spear holder takes exactly the amount the preview's pill shows; and a second test that the preview and the result agree over many seeded positions (as 017 did for moves). Also check it against `spearOnArrival` and the one-spear-a-turn rule (Game Laws 3.13). Two places where the conditions around the shared `spikeCheck` differ, so the seeded test must cover them: (1) `killConsequences` returns nothing when the target is a flag holder (`isHolder`), but `doSpecial` has no such check, so a Pick Off that kills a holder may step in with no preview; (2) `doSpecial` steps in only if the attacker survives a parry (`u.hp > 0`), which `killConsequences` ignores, so the pill may promise a spear the attacker never takes. **If the engine does not deal it, or deals a different amount, do not fix it here** (a rule fix needs a preset): raise an `ASK` with the position and stop the preview from claiming it.

## Rules it touches
None in the engine. On screen: 6.16 (warm-up, fire, re-warm), 6.17 (targets), 3.6 and 3.13 (the kill pill), 1.13 and 1.16. Each becomes a test:
- `test_ui.js` / `test_phone.js` (wherever 025 put browser checks): the five button looks; one tap from Unused warms up with no confirm and shows the note; no state bar on the Special button; tapping Charged opens the row with `N targets` / `No targets` / `−1 Stamina`; Warm up in the row warms up, greys the big button with `Warming up instead`, and Cancel keeps the warm-up; several targets ring with `Tap a red ring`; one target opens the sheet at once; no target gives the reason pill; Used and Can't warm up give their pill; every special opens the row sheet, one target included; the multiplier shows `×1`; a kill's spear pill shows on Pick Off's row; Brace's two looks; no special name or `Warm up` label wraps.
- Undo: undoing a warm-up from Unused and from Charged restores the special state, Stamina and Command exactly; undoing a brace still works; Undo still refuses after a fired special.
- The wording table's engine strings all exist in `engine.js`.
- Section 10's two engine checks.

## Bot minimum
n/a: nothing the bot can do changes (screen only; Undo is human-only).

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes). The engine. Every number shown. The attack preview and flag pull sheets. 025's unit bar height (63 px) and panel (116 px). 018's turn tag, zoom, field buttons and match log.

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes match the board before this change.
- The new checks above pass.
- Screenshots **at 393 × 665** of the 18 approved states, named as the pictures in `briefs/img/026/`, beside them in the Report; plus 390 × 844 for 09, 14 and 16; plus section 5's Warming-up tap and section 6.5's readings.
- Desktop at 1280 × 800: the five looks, the special row, Arc Hit's sheet and a Pick Off kill.
- Sheet heights in the Report: one, two and three targets (expected about 84, 120, 155).

## The Editor's hands-on check
On your phone, one 7v7 against the bot:
1. Tap Light Ranged's Arrow Storm once: it warms up (dashed gold), the note shows. Tap Undo: it's back to white, Stamina back.
2. Warm it again, end turn, come back: the button is gold. Tap it: Arrow Storm big with "2 targets" (or however many), Warm up, Cancel. Tap the big button, tap a red ring, fire.
3. With a charged special and no target: "No targets"; tap it for the reason. Tap Warm up: the big button greys "Warming up instead"; Cancel keeps it.
4. Line up a Pick Off that kills next to a braced Heavy Anti-Cavalry: the red spear pill on the row; fire, and see the spear land.
5. Brace a unit: the Brace button turns solid charcoal; tap Undo, it's unbraced. Brace again; next turn, dashed.

## Report back
Beyond the standard items: the wording table as built (every engine reason and the words shown); the section 10 test result in one line; every reading from sections 5, 6.4, 6.5 and 7 with its screenshot.

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
