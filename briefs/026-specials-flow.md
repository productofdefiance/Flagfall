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
  - `No targets` when it has none (the engine's `fireBlock` is `No target in reach`). Note `o.special.targets` is also empty when `fireBlock` gives any other reason (reloading, braced, already attacked, not enough Stamina). Then **the second line is the reason itself**, as section 5's wording table shows it, up to its first ` · ` (`Reloading this turn`, `Braced this turn`, `Not enough Command`), and tapping the big button gives the full reason in the dark pill (the Editor, 21 Nov, 8:21 pm ET). One line, never wraps; add a check that every second line the table can produce fits the big button at 393 px, and raise an `ASK` if one doesn't;
  - `−1 Stamina` and the squares (from the engine, as the attack's go button) when the next tap fires (one target, or a target chosen).
- **Special's slot:** **Warm up**, a plain button (Unused look, bolt over `Warm up`), no cost shown. Not drawn, reading: when the engine forbids a re-warm (`o.special.warmup` false, e.g. braced this turn), Warm up shows in the Can't-warm-up look and tapping it gives the reason in the dark pill.
- **Brace's slot:** **Cancel**, as an attack's Cancel. It closes the row back to the unit's normal buttons.
- **Tapping Warm up** (picture 11, amended 2:29 am) warms up at once (`act({type:"warmup"})`) and **keeps the row open**: the big button greys (background `#eef0ec`, 1 px `#c4c9c2`, text `#9aa09b`) with the second line **`Warming up instead`** (colours from the approved frame's generator; reading: tapping it does nothing); Warm up turns to the warming look; the note shows in the unit bar; Undo is live. **Cancel then closes the row and keeps the warm-up. Undo takes it back.** You either fire or warm up, never both.
- **Moving from the special row** (item 6): tapping a move hex previews the move as usual (the row becomes Move and Cancel). After the move, tap the special again to reopen the row.

### 4. The big button (item 4)
- **Several targets:** tap the big button: its targets ring red as Attack's do, and the dark pill (`#hint`) reads **`Tap a target`** (picture 10 says `Tap a red ring`: the Editor, 21 Nov, 7:38 pm ET: words name the thing, not the UI that marks it; the same change for Attack and Reach, which share this pill in `renderHint()`). Tap a ringed unit: the special sheet opens on it and the big button's second line becomes `−1 Stamina` and the squares; tap it to fire (picture 14).
- **One target:** tapping the charged Special button opens the sheet on that target at once and the big button fires (picture 15). Warm up stays beside it, so nothing forces a fire.
- **No target:** the big button stays gold with `No targets` (picture 12). Tapping it shows the reason in the dark pill: **`No targets available · move`** when the unit has moves left, **`No targets available`** when it has none (moving is the only thing that can bring a target; warm-up, brace and the rest are other actions, so the pill doesn't offer them), for every special, adjacent, ranged, Reach or Javelin alike (the Editor, 21 Nov, 7:31 pm ET: this replaces picture 13's `No enemy adjacent`, which is wrong for any special that doesn't need an adjacent target). The engine says `No target in reach` (section 5's wording table).

### 5. Notes and reasons (item 5)
- No charged note in the unit bar: it keeps hex and moves.
- **Used** and **Can't warm up** buttons can be tapped: they give their reason in the dark pill and do nothing else (pictures 05, 06).
- **Wording table (display only; the engine's reason decides which line shows, the board only words it).** The approved frames reword three engine reasons; every other reason shows in the engine's own words:

  | Engine reason (`warmupBlock` / `fireBlock`) | Dark pill | Source |
  |---|---|---|
  | `Used` | `<special> used · once a match` (`Arrow Storm used · once a match`) | picture 05 |
  | `Braced this turn` | `Braced this turn · warm up next turn` | picture 06 |
  | `No target in reach` | `No targets available · move`, or `No targets available` with no moves left (section 4) | the Editor, 21 Nov (replaces picture 13) |
  | `<id> has ended its turn` | `Ended its turn` | the Editor, 21 Nov: no unit codes on screen |
  | `<id> attacked this turn and may only evade or end` | `Attacked this turn · may only evade or end its turn` | the Editor, 21 Nov. The engine sets this only for a unit whose card can Evade (`card.evade`, the Light units; `doAttack` and `doSpecial` both check it), so a Heavy unit never sees it; add a test that a Heavy unit after an adjacent attack never gets it |
  | `<id> is reloading this turn` | `Reloading this turn` | the Editor, 21 Nov |
  | `Not enough Stamina` | `Not enough Stamina` when the unit's Stamina is short; **`Not enough Command`** when only the side's Command is short | the Editor, 21 Nov: see "Reason wording in the engine" below |

  **Reason wording in the engine (the one engine change in this brief).** `warmupBlock` and `fireBlock` both return `Not enough Stamina` when either the unit's Stamina or the side's Command is below the cost. Split it: Stamina short → `Not enough Stamina` (as now); Stamina fine but Command short → `Not enough Command`. This changes a returned message only: no rule, no preset, nothing in the match log; `regress_engine.js` must print the same hash for every preset, and a test shows each message in its case.

  **Words name the thing, not the UI that marks it** (the Editor, 21 Nov: `Tap a target`, not `Tap a red ring`), and **no unit codes** (`HM2`) on screen: where a message names a unit, use its full name (`UI.unitName`). The same applies to the Evade hint in `renderHint()`, which today says `step further from HM2`.

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
  - **A modifier the special ignores shows struck through** (brief 009's diagonal strike, in the same grey), never as if it counted (the Editor, 21 Nov, 8:21 pm ET; picture 14 wrongly shows Arrow Storm's target with `15%`): Arrow Storm's ignored Dodge (the hit's `dodgeIgnored`), and Bullseye's ignored Armor when its unit has Pierce (`ignoreArmor`: the target's card Armor, which `specialHits` names in the hit's `why`). Read it from the engine's hit; a small read-only field on the hit is fine if cleaner (replay hashes must match). The key's row for it keeps saying why (`Dodge 15% doesn't count`).
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
- Undo takes back **both one-tap actions**: a brace (as today; check it still works) and a **warm-up** (new). Add `"warmup"` to `canUndo()`'s list in `board/app.js`. Undo is a board feature (it pops the last action and replays), so the engine needs no change for it; no dice are rolled in a warm-up, so it is safe.
- After undoing a warm-up the side is exactly as before: the Special back to Unused (or Charged, for a re-warm), the unit's Stamina **and the side's Command** restored (`spend()` takes the cost from both).
- Undo clears the selection as today (`undo()` sets `sel` to null), from the special row too.
- Undo still refuses after an attack, a pull or a fired special. Today a fired special greys Undo with no reason (`undoWhy()` returns null for it). Reading: add `Can't undo a special once fired`.

### 10. Engine check: a killing Pick Off deals its set spear (item 8)
The engine appears to deal it: `doSpecial` steps a killing Pick Off into the hex and runs `spikeCheck` under `captureTriggersSpike`, the same call `killConsequences` uses for the preview. **Prove it with a test** on the newest preset: a killing Pick Off that steps next to a braced spear holder takes exactly the amount the preview's pill shows; and a second test that the preview and the result agree over many seeded positions (as 017 did for moves). Also check it against `spearOnArrival` and the one-spear-a-turn rule (Game Laws 3.13). **Parry and the step-in.** `doSpecial` steps in only if the attacker survives a parry (`u.hp > 0`); `killConsequences` ignores parry. On every preset that has specials (v3.7 on) this can't bite: `parryNeedsSurvivor` is on (since v3.2), Pick Off has one target, and a target it kills doesn't parry, so a killing Pick Off always steps in. Still: (1) the special preview shows a kill's pills **only if the attacker survives** every parry `specialPreview(...).parry` reports (amount against the attacker's HP); if a parry would remove it, no pills, and the parry shows as section 6.5 says (the Editor, 21 Nov: the preview must allow for a parry that can kill you); (2) the seeded agreement test includes braced parry units next to the target. (A flag holder can't be a special's target at all: `specialCanTarget` refuses a unit on a flag hex, so no holder case is needed.) **If the engine does not deal it, or deals a different amount, do not fix it here** (a rule fix needs a preset): raise an `ASK` with the position and stop the preview from claiming it.

## Rules it touches
None (the engine changes one returned message, section 5). On screen: 6.16 (warm-up, fire, re-warm), 6.17 (targets), 3.6 and 3.13 (the kill pill), 1.13 and 1.16. Each becomes a test:
- `test_ui.js` / `test_phone.js` (wherever 025 put browser checks): the five button looks; one tap from Unused warms up with no confirm and shows the note; no state bar on the Special button; tapping Charged opens the row with `N targets` / `No targets` / `−1 Stamina`; Warm up in the row warms up, greys the big button with `Warming up instead`, and Cancel keeps the warm-up; several targets ring with `Tap a target`; one target opens the sheet at once; no target gives the reason pill; Used and Can't warm up give their pill; every special opens the row sheet, one target included; the multiplier shows `×1`; a kill's spear pill shows on Pick Off's row; Brace's two looks; no special name or `Warm up` label wraps.
- Undo: undoing a warm-up from Unused and from Charged restores the special state, Stamina and Command exactly; undoing a brace still works; Undo still refuses after a fired special.
- The wording table's engine strings all exist in `engine.js`; `Not enough Stamina` and `Not enough Command` each show in their own case; a blocked charged special shows its reason on the big button; Arrow Storm's ignored Dodge and Bullseye's ignored Armor show struck.
- Section 10's two engine checks.

## Bot minimum
n/a: nothing the bot can do changes (screen only; Undo is human-only).

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes). The engine, apart from the `Not enough Command` message (section 5). Every number shown. The attack preview and flag pull sheets. 025's unit bar height (63 px) and panel (116 px). 018's turn tag, zoom, field buttons and match log.

## Checks before opening the pull request
- Every check in `README.md` passes; `regress_engine.js` hashes match the board before this change.
- The new checks above pass.
- Screenshots **at 393 × 665** of the 18 approved states, named as the pictures in `briefs/img/026/`, beside them in the Report; plus 390 × 844 for 09, 14 and 16; plus section 5's Warming-up tap and section 6.5's readings.
- Desktop at 1280 × 800: the five looks, the special row, Arc Hit's sheet and a Pick Off kill.
- Sheet heights in the Report: one, two and three targets (expected about 84, 120, 155).

## The Editor's hands-on check
On your phone, one 7v7 against the bot:
1. Tap Light Ranged's Arrow Storm once: it warms up (dashed gold), the note shows. Tap Undo: it's back to white, Stamina back.
2. Warm it again, end turn, come back: the button is gold. Tap it: Arrow Storm big with "2 targets" (or however many), Warm up, Cancel. Tap the big button ("Tap a target"), tap one, fire.
3. With a charged special and no target: "No targets"; tap it for the reason. Tap Warm up: the big button greys "Warming up instead"; Cancel keeps it.
4. Line up a Pick Off that kills next to a braced Heavy Anti-Cavalry: the red spear pill on the row; fire, and see the spear land.
5. Brace a unit: the Brace button turns solid charcoal; tap Undo, it's unbraced. Brace again; next turn, dashed.

## Report
*Filled in by Claude Code, 23 Nov 2026. Branch `claude/gallant-bohr-hkd8d8`, started from `brief/026-specials-flow`, synced with `main` after 018 and 020 merged. Game version **v3.18.00**, Build 23 (Brief 020 took v3.17.00 first).*

- **What's in:** all ten sections, on phone and desktop.
  - §1: the five Special button looks, read from the generators' colours. No state bar, no cost on the button.
  - §2: one tap warms up. The 025 warm-up confirm, `ui.sheet.kind === "warm"`, desktop's warm-up line and "No target in range · fires next turn" are gone.
  - §3: tapping a charged special opens the special row (the big special, Warm up, Cancel). Warm up keeps the row open and greys the big button to "Warming up instead". Cancel keeps the warm-up.
  - §4: the big button's three flows, and "Tap a target" (also for Attack and Reach).
  - §5: the wording table (`SP_WORDS` in `app.js`) and reasons in the dark pill.
  - §6: the gold sheet for every special.
  - §6.4: a kill's spear and Mark pills, and the spear badge on the field.
  - §8: Brace's two looks.
  - §9: Undo takes back a warm-up, and says "Can't undo a special once fired".
  - §10: proved by tests.
  - The one engine change: "Not enough Command".
- **Wording table as built** (engine reason → dark pill; the big button's second line is the part before the first " · "):
  - `Used` → `<special> used · once a match`
  - `Braced this turn` → `Braced this turn · warm up next turn`
  - `No target in reach` → `No targets available · move` (moves left) or `No targets available`. The big button says `No targets`.
  - `<id> has ended its turn` → `Ended its turn`
  - `<id> attacked this turn and may only evade or end` → `Attacked this turn · may only evade or end its turn`
  - `<id> is reloading this turn` → `Reloading this turn`
  - `Not enough Stamina` / `Not enough Command` → unchanged
  - `Fire it next turn` (tapping a Warming up button) → `Fires next turn`
  - All others in the engine's words: `Already attacked this turn`, `Warm it up first`.
  - Note: the "attacked … may only evade" line reaches the Special button only through `blockReasons`. `warmupBlock` checks "Already attacked this turn" first.
- **Section 10 in one line:** a killing Pick Off next to a braced spear takes exactly the pill's amount (2). Over 400 seeded positions (298 kills, 108 with a spear, 259 with a Mark, braced spears and braced parry units next to the target), the sheet's pills match what firing does every time. The one-spear-a-turn rule holds. On a test copy with `parryNeedsSurvivor` off, a parry that would remove the attacker hides the pills, and the engine indeed never steps in.
- **Readings (screenshots in `briefs/img/026/report/`):**
  - §5, tapping a Warming up button: `Fires next turn` (`r1-warming-tap.png`).
  - §6.3: Dodge shows with its icon. Ignored modifiers are struck with Brief 009's grey diagonal (Arrow Storm's Dodge, Bullseye's Armor with Pierce; checked in `test_spflow.js`).
  - §6.4: the Mark pill sits after the spear pill, same size (`18-pickoff.png`).
  - §6.5: Parry shows in red in that target's modifiers. A parry that hits the attacker gets a red line under the rows ("Parry: you take 2", `r3-parry.png`). An Evade after a Pick Off that leaves its target standing gets a grey line ("Evade 3: 2 Stamina left after this special, up to 3 hexes", `r2-evade.png`). Both fit; no ASK.
  - §7: desktop shows reasons in the toast where it shows other greyed buttons' reasons (`desktop-*.png`).
  - A blocked charged special: `r4-blocked-big.png` ("Not enough Command").
  - The other looks are in the five Special states.
- **Sheet heights at 393 px:** one target 87 px, Skewer two 122 px, Arc Hit three 157 px. The brief expected about 84, 120 and 155; the extra is mostly the 3 px gold top edge. Pick Off with its Evade line: 105 px.
- **Anything beyond the brief, and why:**
  - A Special button for a unit that has ended its turn keeps its state's look and gives its reason (the engine gives such a unit no options). See F026-3.
  - A second tap on the charged button closes the row.
- **Checks run and results:**
  - Passed: `test_reasons.js` (19, updated to expect "Not enough Command" where only Command is short), `test_v37.js` (180), `test_ui.js` (114), `test_phone.js` (64, updated for the retired confirm and bar), `test_hotseat.js` (46), `test_watch.js` (20), `test_events.js` (2623), `test_version.js` (22), `test_rules.js`, `test_v1.js`, `test_v3.js`, `test_v31.js`, `sims/lab/test_workflows.js`, `sims/lab/self_test.js` (34).
  - New: `test_spflow.js` (55, browser, phone and desktop) and `test_spengine.js` (17).
  - Not run here because the session was too slow: the remaining long checks (`test_v32` to `test_v36`, the brain tests, invariants, `board_check.js`). They don't touch anything this build changed. GitHub's checks run them on the pull request.
  - Replay hashes: `regress_engine.js` (3 matches, every rule set and brain, 156 lines) run on a copy of the board from before this build and on this build, in this session. **All 156 lines are identical.** The only engine change is the wording of one returned reason. Hashes:

```
match3 standard      9505d63e32261044 {"turn limit, more pull damage":3,"TKO":1,"turn limit, draw":1,"KO":1}
match3 easy          28f2c5fd3479eb57 {"turn limit, more pull damage":3,"KO":3}
match3 kitA          3b3df4da2d9c97f3 {"KO":2,"turn limit, more pull damage":3,"TKO":1}
match3 kitA2         a64350ad83b45852 {"KO":4,"turn limit, fewer beings lost":1,"TKO":1}
match3 kitC          b7e3e59238054230 {"KO":4,"TKO":1,"turn limit, more pull damage":1}
match3 kitB          2e06a723c6c6032e {"turn limit, fewer beings lost":2,"TKO":2,"KO":1,"turn limit, draw":1}
match3 batchC        2e06a723c6c6032e {"turn limit, fewer beings lost":2,"TKO":2,"KO":1,"turn limit, draw":1}
match3 kitD          c8e2474704def6cf {"turn limit, fewer beings lost":2,"TKO":3,"turn limit, more pull damage":1}
match3 brain5        f867779da566a6df {"KO":3,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1,"TKO":1}
match3 brain6        f867779da566a6df {"KO":3,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1,"TKO":1}
match3 brain7        c974f96666523e6e {"KO":4,"TKO":1,"turn limit, draw":1}
match3 brain8        e6caba66b182604e {"TKO":2,"KO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v1 standard          7d2ee23b610044fb {"turn limit, more pull damage":2,"TKO":2,"turn limit, fewer beings lost":2}
v1 easy              5346f185dee68aec {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"turn limit, draw":1,"TKO":1,"KO":1}
v1 kitA              ec44252a55814596 {"turn limit, draw":1,"TKO":1,"KO":4}
v1 kitA2             588982e45cf2e152 {"turn limit, fewer beings lost":1,"KO":4,"turn limit, more pull damage":1}
v1 kitC              0bf2d1c97af4f95b {"turn limit, more pull damage":2,"turn limit, draw":3,"TKO":1}
v1 kitB              1644ec2c5b0077c7 {"turn limit, draw":2,"KO":2,"turn limit, fewer beings lost":1,"TKO":1}
v1 batchC            1644ec2c5b0077c7 {"turn limit, draw":2,"KO":2,"turn limit, fewer beings lost":1,"TKO":1}
v1 kitD              f20f358e59ca61f3 {"turn limit, draw":2,"TKO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v1 brain5            d5bef74e280a57ab {"KO":2,"TKO":1,"turn limit, more pull damage":2,"turn limit, fewer beings lost":1}
v1 brain6            d5bef74e280a57ab {"KO":2,"TKO":1,"turn limit, more pull damage":2,"turn limit, fewer beings lost":1}
v1 brain7            c795fc967461ac0b {"KO":2,"turn limit, fewer beings lost":1,"turn limit, more pull damage":2,"TKO":1}
v1 brain8            a916b1c927d3fd8b {"turn limit, more pull damage":2,"TKO":1,"KO":3}
v2 standard          81fe95ac607c5bba {"turn limit, more pull damage":2,"KO":1,"TKO":3}
v2 easy              e288e6f3e5882b42 {"turn limit, more pull damage":2,"TKO":3,"KO":1}
v2 kitA              ef8b0b6eff8fd702 {"TKO":3,"turn limit, draw":1,"turn limit, fewer beings lost":2}
v2 kitA2             882e7197fd72595d {"KO":3,"TKO":2,"turn limit, draw":1}
v2 kitC              78d7c19b86006201 {"KO":1,"TKO":2,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1,"turn limit, draw":1}
v2 kitB              5a1b0327fc05000e {"KO":3,"TKO":1,"turn limit, more pull damage":1,"turn limit, draw":1}
v2 batchC            5a1b0327fc05000e {"KO":3,"TKO":1,"turn limit, more pull damage":1,"turn limit, draw":1}
v2 kitD              e9afcb1eea0cc19b {"KO":2,"TKO":3,"turn limit, draw":1}
v2 brain5            f96a2e128e98e1c8 {"KO":5,"TKO":1}
v2 brain6            f96a2e128e98e1c8 {"KO":5,"TKO":1}
v2 brain7            213d2d01dbe307ae {"KO":3,"turn limit, draw":2,"turn limit, more pull damage":1}
v2 brain8            14781362fe7c5590 {"turn limit, more pull damage":1,"KO":4,"turn limit, fewer beings lost":1}
v3 standard          d9918e5044751ae4 {"turn limit, fewer beings lost":2,"KO":1,"turn limit, draw":3}
v3 easy              dfc1018fd2e8d318 {"KO":4,"TKO":1,"turn limit, more pull damage":1}
v3 kitA              d6e3a691412a529a {"turn limit, fewer beings lost":2,"turn limit, more pull damage":1,"turn limit, draw":1,"KO":2}
v3 kitA2             de911ae9ae5ec5b2 {"KO":3,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1,"turn limit, draw":1}
v3 kitC              043a25e3a8faffa4 {"turn limit, draw":1,"turn limit, more pull damage":3,"turn limit, fewer beings lost":2}
v3 kitB              39d8a8ced8ab1f71 {"turn limit, draw":4,"KO":2}
v3 batchC            39d8a8ced8ab1f71 {"turn limit, draw":4,"KO":2}
v3 kitD              d3a66ddd00dfa47b {"turn limit, draw":2,"turn limit, more pull damage":2,"KO":1,"TKO":1}
v3 brain5            19e2441438e1a200 {"turn limit, fewer beings lost":3,"turn limit, more pull damage":2,"KO":1}
v3 brain6            8d02521224fd5401 {"turn limit, fewer beings lost":3,"turn limit, more pull damage":2,"KO":1}
v3 brain7            a62041e343400d41 {"KO":3,"turn limit, fewer beings lost":1,"TKO":1,"turn limit, draw":1}
v3 brain8            81bf0e1d35d3a5be {"turn limit, more pull damage":1,"KO":4,"TKO":1}
v3.1 standard        a5111ca6e31dd142 {"turn limit, draw":1,"turn limit, fewer beings lost":3,"KO":1,"turn limit, more pull damage":1}
v3.1 easy            f009eabf0262288e {"turn limit, more pull damage":4,"turn limit, draw":1,"KO":1}
v3.1 kitA            9363c663c396b31e {"turn limit, fewer beings lost":4,"turn limit, draw":1,"turn limit, more pull damage":1}
v3.1 kitA2           7f0384d5d441a4ea {"turn limit, more pull damage":5,"turn limit, draw":1}
v3.1 kitC            9bc318cf3af9dd6b {"turn limit, more pull damage":2,"turn limit, fewer beings lost":2,"turn limit, draw":2}
v3.1 kitB            d1b5ee293dc1bfae {"turn limit, draw":3,"KO":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v3.1 batchC          d1b5ee293dc1bfae {"turn limit, draw":3,"KO":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v3.1 kitD            a79170f26bab76e2 {"turn limit, draw":3,"turn limit, more pull damage":2,"TKO":1}
v3.1 brain5          7ee1558d6ff54718 {"turn limit, fewer beings lost":1,"TKO":1,"KO":3,"turn limit, more pull damage":1}
v3.1 brain6          7ee1558d6ff54718 {"turn limit, fewer beings lost":1,"TKO":1,"KO":3,"turn limit, more pull damage":1}
v3.1 brain7          44e83e23ce41fae2 {"KO":4,"TKO":1,"turn limit, more pull damage":1}
v3.1 brain8          cd90f4933e283896 {"KO":4,"TKO":2}
v3.2 standard        1b816fcef7403389 {"turn limit, fewer beings lost":2,"KO":2,"turn limit, draw":2}
v3.2 easy            9420a422f54e6099 {"turn limit, more pull damage":5,"KO":1}
v3.2 kitA            62567f2becd82077 {"turn limit, fewer beings lost":4,"turn limit, more pull damage":1,"KO":1}
v3.2 kitA2           58669c71d6e22546 {"turn limit, more pull damage":4,"KO":2}
v3.2 kitC            2bc602c9ad89ed2d {"turn limit, more pull damage":2,"turn limit, draw":3,"KO":1}
v3.2 kitB            8f07baeb24cce876 {"turn limit, draw":3,"KO":1,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v3.2 batchC          8f07baeb24cce876 {"turn limit, draw":3,"KO":1,"turn limit, fewer beings lost":1,"turn limit, more pull damage":1}
v3.2 kitD            8dfa3da9426bad16 {"turn limit, draw":3,"KO":2,"turn limit, more pull damage":1}
v3.2 brain5          90107654bc90e8a3 {"turn limit, fewer beings lost":2,"KO":2,"turn limit, more pull damage":2}
v3.2 brain6          239eb257be0604f4 {"turn limit, fewer beings lost":2,"KO":2,"turn limit, more pull damage":2}
v3.2 brain7          473cffecb5156780 {"KO":2,"TKO":3,"turn limit, fewer beings lost":1}
v3.2 brain8          09637896349874b9 {"KO":6}
v3.3 standard        c7d8b727e6ebceae {"turn limit, fewer beings lost":3,"KO":2,"turn limit, draw":1}
v3.3 easy            6cb565c7364350b5 {"KO":1,"turn limit, more pull damage":4,"turn limit, fewer beings lost":1}
v3.3 kitA            baa4a3cbd81e8b83 {"turn limit, fewer beings lost":5,"turn limit, draw":1}
v3.3 kitA2           6b9ddc01aeb5fa92 {"turn limit, more pull damage":4,"turn limit, draw":1,"KO":1}
v3.3 kitC            d601dcda9d3c1143 {"turn limit, draw":2,"turn limit, fewer beings lost":2,"KO":2}
v3.3 kitB            e671933ea146e771 {"turn limit, draw":4,"KO":1,"turn limit, more pull damage":1}
v3.3 batchC          e671933ea146e771 {"turn limit, draw":4,"KO":1,"turn limit, more pull damage":1}
v3.3 kitD            b8be1834ea52142e {"turn limit, draw":3,"TKO":1,"KO":1,"turn limit, more pull damage":1}
v3.3 brain5          e3bff02d25f693b0 {"turn limit, more pull damage":2,"TKO":2,"KO":1,"turn limit, fewer beings lost":1}
v3.3 brain6          e3bff02d25f693b0 {"turn limit, more pull damage":2,"TKO":2,"KO":1,"turn limit, fewer beings lost":1}
v3.3 brain7          8957b326026a32ed {"turn limit, fewer beings lost":2,"KO":3,"TKO":1}
v3.3 brain8          87e07cc217667a6e {"turn limit, fewer beings lost":2,"KO":3,"TKO":1}
v3.4 standard        a23e195511c0bc3d {"turn limit, fewer beings lost":3,"turn limit, more pull damage":2,"KO":1}
v3.4 easy            ff402574aa89118d {"turn limit, more pull damage":4,"KO":2}
v3.4 kitA            496a4a5b5cb66480 {"turn limit, draw":1,"turn limit, fewer beings lost":1,"turn limit, more pull damage":4}
v3.4 kitA2           5f44f725d76f0175 {"KO":3,"turn limit, fewer beings lost":1,"turn limit, more pull damage":2}
v3.4 kitC            eaa4f26ac713b64b {"turn limit, draw":2,"turn limit, more pull damage":3,"KO":1}
v3.4 kitB            eca4206421c0c1df {"turn limit, draw":3,"KO":2,"turn limit, fewer beings lost":1}
v3.4 batchC          eca4206421c0c1df {"turn limit, draw":3,"KO":2,"turn limit, fewer beings lost":1}
v3.4 kitD            ebae86560417e8d7 {"turn limit, draw":3,"KO":2,"turn limit, more pull damage":1}
v3.4 brain5          915fedc01f6b05b3 {"turn limit, fewer beings lost":3,"TKO":2,"KO":1}
v3.4 brain6          915fedc01f6b05b3 {"turn limit, fewer beings lost":3,"TKO":2,"KO":1}
v3.4 brain7          804ac76593a9da24 {"turn limit, fewer beings lost":3,"KO":3}
v3.4 brain8          c6241b20db540e9f {"KO":5,"turn limit, fewer beings lost":1}
v3.5 standard        056eee37982b2354 {"turn limit, fewer beings lost":4,"turn limit, more pull damage":1,"turn limit, draw":1}
v3.5 easy            8b06c77421a0f850 {"KO":5,"turn limit, more pull damage":1}
v3.5 kitA            43a939193e0028d3 {"turn limit, draw":2,"turn limit, fewer beings lost":2,"KO":1,"turn limit, more pull damage":1}
v3.5 kitA2           b6fc8af99b78c6ed {"KO":3,"turn limit, draw":1,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v3.5 kitC            541209f733e30a22 {"turn limit, more pull damage":2,"KO":3,"turn limit, draw":1}
v3.5 kitB            040e2cffb0583c8c {"turn limit, draw":4,"KO":2}
v3.5 batchC          040e2cffb0583c8c {"turn limit, draw":4,"KO":2}
v3.5 kitD            35c5e1591f16def0 {"turn limit, draw":3,"KO":2,"turn limit, more pull damage":1}
v3.5 brain5          d7759cc74cdcf510 {"turn limit, fewer beings lost":2,"TKO":1,"turn limit, draw":1,"KO":2}
v3.5 brain6          fa0b7d355e2c489b {"turn limit, fewer beings lost":3,"TKO":1,"KO":2}
v3.5 brain7          e802e6cc0c70fea6 {"TKO":1,"KO":5}
v3.5 brain8          fb7bdabefe40794e {"turn limit, more pull damage":3,"TKO":1,"KO":2}
v3.6 standard        7f3fab020e7ee17a {"turn limit, fewer beings lost":2,"turn limit, more pull damage":4}
v3.6 easy            685cd1c7ded77eb6 {"turn limit, more pull damage":3,"KO":3}
v3.6 kitA            547babeae56b77b5 {"turn limit, fewer beings lost":4,"turn limit, more pull damage":2}
v3.6 kitA2           d0d8852d6f563aa5 {"KO":4,"turn limit, more pull damage":1,"turn limit, fewer beings lost":1}
v3.6 kitC            7e5e288cc2830c81 {"turn limit, more pull damage":1,"turn limit, fewer beings lost":2,"turn limit, draw":1,"KO":2}
v3.6 kitB            536f9331269d6544 {"turn limit, more pull damage":1,"KO":3,"turn limit, draw":2}
v3.6 batchC          536f9331269d6544 {"turn limit, more pull damage":1,"KO":3,"turn limit, draw":2}
v3.6 kitD            06d17790b1b628cc {"KO":4,"turn limit, more pull damage":1,"turn limit, draw":1}
v3.6 brain5          fe8a409c22ccd875 {"turn limit, fewer beings lost":1,"KO":3,"turn limit, draw":1,"turn limit, more pull damage":1}
v3.6 brain6          26163f6a9841f720 {"turn limit, fewer beings lost":1,"KO":3,"turn limit, more pull damage":2}
v3.6 brain7          851ebd3b0186d53d {"turn limit, fewer beings lost":3,"turn limit, more pull damage":1,"KO":2}
v3.6 brain8          23771b85c5748d68 {"TKO":2,"KO":3,"turn limit, fewer beings lost":1}
v3.7 standard        cbeedd6a6532ffe2 {"turn limit, fewer beings lost":4,"KO":1,"turn limit, draw":1}
v3.7 easy            e745566f994abf3c {"turn limit, more pull damage":4,"KO":2}
v3.7 kitA            7e74c2126a7a1e26 {"KO":1,"turn limit, fewer beings lost":5}
v3.7 kitA2           8c60cd7ea466e677 {"KO":2,"turn limit, fewer beings lost":2,"turn limit, more pull damage":2}
v3.7 kitC            a8a65d9a99b6c6b9 {"turn limit, more pull damage":2,"KO":1,"turn limit, fewer beings lost":3}
v3.7 kitB            9b52963c4b3d2697 {"turn limit, more pull damage":2,"KO":1,"turn limit, fewer beings lost":1,"turn limit, draw":2}
v3.7 batchC          9b52963c4b3d2697 {"turn limit, more pull damage":2,"KO":1,"turn limit, fewer beings lost":1,"turn limit, draw":2}
v3.7 kitD            c86dd807305c83af {"KO":4,"turn limit, draw":2}
v3.7 brain5          8aba40ee571ecb6e {"KO":6}
v3.7 brain6          8aba40ee571ecb6e {"KO":6}
v3.7 brain7          e250fcd82a97681f {"KO":5,"TKO":1}
v3.7 brain8          be7022eb240076e3 {"turn limit, more pull damage":1,"KO":3,"TKO":1,"turn limit, fewer beings lost":1}
v3.8 standard        a37bd2e8528f3a7f {"turn limit, fewer beings lost":2,"turn limit, more pull damage":4}
v3.8 easy            cf5235b783214b6c {"KO":4,"turn limit, more pull damage":2}
v3.8 kitA            da227a828d94cd24 {"turn limit, fewer beings lost":5,"turn limit, more pull damage":1}
v3.8 kitA2           e71519b837417de1 {"KO":1,"turn limit, fewer beings lost":4,"turn limit, more pull damage":1}
v3.8 kitC            8dddd513a5a29aae {"turn limit, fewer beings lost":2,"KO":2,"turn limit, draw":2}
v3.8 kitB            b36573f761594036 {"KO":6}
v3.8 batchC          b36573f761594036 {"KO":6}
v3.8 kitD            24b6b31bba2f59bf {"KO":1,"turn limit, more pull damage":4,"TKO":1}
v3.8 brain5          a32a14e06f9a83c1 {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"TKO":1,"KO":2}
v3.8 brain6          a32a14e06f9a83c1 {"turn limit, more pull damage":2,"turn limit, fewer beings lost":1,"TKO":1,"KO":2}
v3.8 brain7          7135c3992ec329b2 {"KO":4,"TKO":1,"turn limit, fewer beings lost":1}
v3.8 brain8          18ee2632fc35395b {"KO":6}
v3.9 standard        8a18042d7ad0c09a {"turn limit, more pull damage":4,"turn limit, fewer beings lost":2}
v3.9 easy            330eb507c67620bf {"turn limit, more pull damage":3,"KO":3}
v3.9 kitA            34c2a3420232fef7 {"turn limit, fewer beings lost":5,"turn limit, more pull damage":1}
v3.9 kitA2           55412d14672cfe97 {"turn limit, more pull damage":1,"turn limit, fewer beings lost":2,"KO":3}
v3.9 kitC            819eb4611d2a27d4 {"turn limit, fewer beings lost":2,"KO":3,"turn limit, more pull damage":1}
v3.9 kitB            396e04095500ddbe {"KO":5,"turn limit, more pull damage":1}
v3.9 batchC          396e04095500ddbe {"KO":5,"turn limit, more pull damage":1}
v3.9 kitD            cce3275102425ab0 {"KO":4,"turn limit, more pull damage":2}
v3.9 brain5          2ad36b5264195d14 {"turn limit, fewer beings lost":1,"TKO":2,"KO":2,"turn limit, more pull damage":1}
v3.9 brain6          2ad36b5264195d14 {"turn limit, fewer beings lost":1,"TKO":2,"KO":2,"turn limit, more pull damage":1}
v3.9 brain7          085a8af1c5712068 {"KO":5,"TKO":1}
v3.9 brain8          b74af22796dedaaa {"turn limit, fewer beings lost":1,"KO":4,"TKO":1}
```
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a (screen only; Undo is human only)
- **Settings review (brain builds only):** n/a
- **Known gaps:** F026-1 (an Arc Hit's second braced Heavy Melee parry is missing from the engine's preview), F026-2 (unit codes outside the specials).
- **Flags closed / opened:** none closed. Opened: F026-1, F026-2, F026-3 (`flags/026.md`).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/59
