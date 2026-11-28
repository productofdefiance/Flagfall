# Brief 030 — Game start: one New game screen, squad rules, and the new Lineup screen

| | |
|---|---|
| Game version | **YY** (new screens and a new set-up rule). Size only: the number is counted at merge (brief 031); add `releases/030.json` with bump `YY` and `changelog/030.md`. |
| Lane | UI (with one rules piece: squad rules and the squad checks, Game Laws 2.2 and 2.16) |
| Rule set | none new. Squad rules are a **match set-up option**, not a preset: every preset plays and replays as today. The squad checks run before a match starts and never inside the engine's play. |
| Date | 27 Nov 2026 (updated 28 Nov: order, Waits on, version, pictures) |
| Goal | Replace the three-step set-up (Settings, Teams, Lineup) with one **New game** screen, a **Game settings** screen behind it, and a reworked **Lineup** screen; add **squad rules**; enforce Game Laws 2.2 and 2.16 before a match starts. |
| Branch | Any branch your session may push to, started from `brief/030-game-start` |
| Flags | none to close. Open new ones in `flags/030.md`. |
| Waits on | 029, 031 |
| Order | **After 029 and 031 merge**, side by side with brief 032 (tooling), the attack UI brief and 012 (Cavalry), and **merges before 012** (the Editor, 27 Nov; was after 012). 029 changes the Lineup footer and the rematch path this brief rebuilds. 012 later adds the mounted units to this brief's Lineup screen and uses this brief's squad check instead of building its own; until then 9v9, 13v13 and Cavalry only stay disabled (no rule set has mounted units). Overtime's menu entry is drawn here as "Not built yet". Brief 032 also edits `board/app.js` (one function, the "different version" warning): whichever merges second syncs once. |

## Context
The Editor redesigned the start of a game in the UI chat **FF UI v3.17.00 - Game start** (25 to 27 Nov 2026). Today a game starts through three numbered steps: Settings (format, field, rule set, sides, moves first, hot-seat view, seed), Teams (each side's mix, brain and greyed personality sliders), then a Lineup screen per human. The new path is: **New game** (both sides, moves first, squad rule, a settings line and the seed) → **Lineup** (always, your last lineup filled in) → deployment. Game settings sits behind the settings line and is kept between games.

Locked the same day (Game Laws, 27 Nov 2026):
- **2.2:** a side picks units **up to** its unit cap (UC): a squad **may start short**, after a warning. **Every squad holds at least one foot unit** (4.2: mounted units never hold a flag). No match starts with a squad that breaks 2.2 or the squad rule.
- **2.16 Squad rules:** one per match, binding both sides and any lineup a player picks for a computer side: **Open** (default), **Light only**, **Heavy only**, **Foot only**, **Cavalry only** (9v9 and 13v13 only; mounted units plus **exactly one** foot unit), **Random** (both lineups drawn from the game code; no Lineup screen).

The screens are on the UI Brainstorm canvas, **Game start** page, **Round 14, frames F01 to F10**, with **Round 15** replacing F04 (personality numbers) and adding the bold settings line (F01b), and **Round 16** replacing F01 (the New seed button) (Rounds 1 to 13 are the path there). **Approved for build by the Editor, 27 Nov 2026, 3:14 am ET**; on the Approved UI canvas as page **v8**, screens 01 to 11 (01 New game vs bot = Round 16 F01; 02 bold settings line = Round 15 F01b; 03 hot seat; 04 Random; 05 personality = Round 15 F04; 06 discard prompt; 07 Game settings; 08 Your lineup; 09 short squad; 10 rule broken; 11 bot lineup). Personality 0 to 100 confirmed by the Editor (enough range for the coaching kit to refine). Mockups are 393 wide in the board's own colours and type; tall frames show the whole scrolled screen with the fold at 665 marked. **Where a picture and this brief differ, the brief wins.**

**Pictures:** `briefs/img/030/`, rendered 28 Nov at 393 wide (2× pixels) from the canvas's own artboard files: `F01.png` (Round 16 F01, New game vs bot), `F01b.png` (Round 15, bold settings line), `F02.png` (hot seat), `F03.png` (Random), `F04.png` (Round 15, personality sheet), `F05.png` (discard prompt), `F06.png` (Game settings), `F07.png` (Your lineup), `F08.png` (short squad), `F09.png` (rule broken: Cavalry only with no foot unit, drawn at 9v9 and only reachable once 012 merges), `F10.png` (bot lineup). Tokens in the mockups are plain circles; keep the board's real tokens.

Rules that apply: Game Laws 1.13 (what is shown is the true state), 1.16 (nothing empty is offered), 2.2, 2.16, 4.2, 7.9. CLAUDE.md's replay rule: the squad rule and every set-up difference go into the match record and the watch link, so a record replays exactly.

## Scope
In: Home's New game goes to the new screen; the New game screen; Game settings; the personality sheet and the discard prompt (display only: personality and difficulty stay unbuilt); the Lineup screen for you and for a picked bot lineup; squad rules (set-up, checks, the bot's own lineup inside the rule, Random); short squads; the record, watch link and rematch carrying the squad rule; desktop the same in its own layout.
Out: any engine or preset change; building Overtime, Rounds, Dice, Difficulty or Personality (shown and saved as "Not built yet", the game ignores them); eras and regions (TEST only); match replay; the condensed layouts and three-column desktop (held by the Editor); new brains; mounted units (brief 012 adds them to these screens).

## What to build

### 0. Look (shared)
Board colours and type as today: paper `#e9ece6`, card `#f8f9f5`, ink `#1f2421`, muted `#5f6762`, line `#b8beb6`, North `#2f6b55`, South `#a8452f`. Headings Barlow Condensed 700, body IBM Plex Sans. Screen padding 18 px top, 20 px sides; blocks 16 px apart. Every block: card background, 2 px border, radius 12, 12 px padding, title 700 18 px Barlow Condensed, letter-spacing .1em, capitals. The footer is pinned: 83 px, paper, 1 px line on top, 12 px 20 px 18 px padding, two buttons 52 px tall, 10 px apart, left flex 1 (plain), right flex 2 (primary: ink with `#f8f9f5` text). A disabled primary is 40% opacity. A "Not built yet" tag: 20 px tall, radius 10, `#e6e2d6` background, `#6b5d2e` text, 600 11 px.

### 1. New game (F01 vs bot, F02 hot seat, F03 Random)
Top: the 44 px back button (to Home) and the title `NEW GAME`. Then, top to bottom:

1. **North block**, 2 px North border. Header row: `NORTH` (700 18 px, North colour) left; a Human/Bot switch right (the board's `.seg`, 184 px wide, 40 px buttons, person and bot icons before the words). A human side then has its **name** box (44 px, white, 1 px line, radius 10; default the side name; saved per side as today). Then two pickers:
   - **ERA** and **REGION**: a label (700 13 px Barlow Condensed, letter-spacing .12em, muted) over a row: ‹ button, value box, › button. Buttons 44 × 44, white, 1 px ink, radius 10. Value box: flex 1, 44 px, white, 1 px line, radius 10, centred, 700 18 px Barlow Condensed, letter-spacing .14em. Both read **TEST** (one value; the arrows do nothing yet).
2. **Swap ends**: a centred pill button (40 px, radius 20, swap icon + `Swap ends`) between two hairlines with `VS`. It swaps everything set on the two sides (type, name, era, region, bot settings, and the sides' lineups), as today's swap does.
3. **South block**, the same with the South colour. A **bot** side shows no name box; under Era and Region it adds:
   - **DIFFICULTY** picker reading **TEST**, with a "Not built yet" tag at the label's right.
   - **PERSONALITY** picker with a "Not built yet" tag: ‹, value box, **cog button**, ›. The cog is a 44 × 44 white button with the board's toothed gear icon (ink), between the value and the right arrow. The value reads **DEFAULT** (one preset for now; arrows step presets). Tapping the cog opens the personality sheet (section 3). After any slider moves the value reads **CUSTOM**.
4. **MOVES FIRST** block (2 px line-colour border): `North`, `South`, `Coin` switch, full width, 44 px. Help: Coin `Tossed from the dice code.`; North or South `<Side> takes the first turn.` Default Coin.
5. **SQUAD RULES** block: six choices in a 3 × 2 grid switch (44 px buttons): `Open`, `Light only`, `Heavy only` / `Foot only`, `Cavalry only`, `Random`. Default Open. `Cavalry only` is disabled at 5v5 and 7v7. Help line under it, by choice:
   - Open: `Any unit, both sides.`
   - Light only: `Light units only, both sides.` · Heavy only: `Heavy units only, both sides.` · Foot only: `No mounted units.`
   - Cavalry only: `Mounted units and exactly one foot unit, both sides.`
   - Random: `Both lineups are drawn from the seed. Straight to deployment.`
   - At 5v5 and 7v7 add: ` Cavalry only needs 9v9 or 13v13.`
6. **GAME SETTINGS** block (the last): a button the width of the block: gear icon + `GAME SETTINGS`, then the settings line (500 13 px, wraps) and a chevron right; tapping opens Game settings (section 2). Under a 1 px `#e3e6e0` rule: `SEED` label, the seed in a 44 px read-only box (600 15 px, letter-spacing .05em) a 44 × 44 copy button (toast `Seed copied.`) and, 8 px right of it, a 44 × 44 **New seed** button with the board's dice icon (`aria-label="New random seed"`): it replaces the seed with `E.makeSeed()` for this game (toast `New seed.`); it does not change Each game in Game settings (Round 16).
   - **The settings line** lists, joined by ` · `: format, `Rules <id>`, `<Side>: <brain name>` for each bot side, overtime (`No overtime`, `Golden Flag`, `Flag Off`), rounds (`1 round`, `Best of 3`, `Best of 5`), `Dice: <Zero|One|Two>`, `New seed` or `Seed kept`, and `View: <name>` only when both sides are human. The line is 400 13 px muted.
   - **Nothing changes silently between games** (the Editor, 27 Nov). Any item that differs from the last game started on this device is shown **bold in ink** (700), and a key line sits under the settings line: `**Bold**: different from your last game.` (12 px muted, the word Bold in ink). The seed is never bolded: it sits on the screen with its own box (the Editor, 27 Nov). Today that leaves: a rule set or brain that moved since the last game because it follows Newest or Default (shown as `Rules <id> (newest)` / `<Side>: <brain> (default)`, bold until a game is played with it), and anything changed in Game settings since the last game. The key line shows only when something is bold.
   - Rule set and brain follow the newest only when the player has chosen "newest" (the default); a specific rule set or brain chosen in Game settings stays chosen.

**Footer:** `Back` (to Home) and **`Next: Lineup`**; under squad rule Random it reads **`Start match`** and starts the match (lineups drawn). The New game screen keeps its scroll position when you come back from Lineup or Game settings.

**Defaults and what is kept:** every choice on this screen and in Game settings is kept for the next game (local storage, per device), **except** the seed (new each game unless kept, section 2) and the coin toss. Format change: lineups are kept per format, as today.

### 2. Game settings (F06)
Back arrow (`Back to New game`) and title `GAME SETTINGS`; note `Kept for your next game. Sides, moves first and squad rules are on the New game screen.` Groups (block style, title 700 14 px muted), each setting a 600 13 px label over its control, help 12 px muted under it:
- **MATCH:** **Format** `5v5`, `7v7`, `9v9`, `13v13` (9v9 and 13v13 disabled unless the rule set has mounted units; help `9v9 and 13v13 come with Cavalry.`). **Rule set** (the select as today, with a first option `Newest (Rules <id>)`, the default, which follows each new preset; help `<N> turns per player at <format>.` from the preset). **Overtime** `None`, `Golden Flag`, `Flag Off` (Not built yet; help for None: `A level game is settled by the turn-limit order (Game Laws 2.7).`). **Rounds** `Best of 1`, `Best of 3`, `Best of 5` (Not built yet).
- **BOT:** one **brain** select per side set to Bot, labelled `<Side> brain`, with a first option `Default (<brain>)`, the default, which follows the board's default opponent (Brain 8 today; since brief 031 it is `DEFAULT_OPPONENT` in `board/brain.js`: read it from there). Help `Difficulty and personality are on the New game screen.` The group is hidden when no side is a bot.
- **PLAY:** **Dice** `Zero`, `One`, `Two` (Not built yet; default Two; help `Two is today's game. Zero and One: meanings to come.`).
- **HOT SEAT:** **Hot-seat view** `Handoff`, `Flip`, `Face to Face` as today; greyed with help `Only when both sides are human.` unless both are human.
- **SEED:** **Each game** `New seed` / `Keep this seed`. Help `New seed: new rolls, coin toss and bot choices every game. The seed itself is shown and copied on the New game screen.` Keep holds the current seed for every following game until set back to New.

Footer: **Reset** (every setting on this screen back to its default, no confirm) and **Done** (back to New game). The old field select goes: one field per format (Game Laws 2.4).

### 3. Personality sheet and the discard prompt (F04, F05)
The cog opens a bottom sheet (white, radius 16 top corners, handle): title `<SIDE> PERSONALITY` in the side colour, a `CUSTOM` badge (700 14 px, side colour on a 10% tint) once a slider has moved, help `0 to 100; 50 is the brain as it is. Drag or type. Any change makes it Custom.`, the five settings (Aggression, Speed vs Strength, Close vs Far, Flag vs Fight, Together vs Spread), each a 500 13 px label over a row: a slider (0 to 100, step 1, side colour; flex 1) and a **number box** (64 × 40, white, 1 px line, radius 10, 600 15 px tabular, centred) showing the value and taking a typed value; slider and box move together; a typed value outside 0 to 100 is clamped on leaving the box; 50 = Default (F04, Round 15), the line `Not built yet: the bot plays as Default whatever these say.`, then `Back to Default` and `Done` (48 px). Values are saved with the side and go into the record, unused.
Tapping ‹ or › while the value is CUSTOM opens a centred prompt: `DISCARD CUSTOM PERSONALITY?`, `<Side> goes to the next preset. Your slider settings are lost.`, buttons `Keep custom` and `Discard` (primary).

### 4. Lineup (F07 to F10)
Back arrow (`Back to New game`; for the bot lineup `Back to Your lineup`) and title `YOUR LINEUP` (hot seat: `NORTH LINEUP` / `SOUTH LINEUP`; bot: `<SIDE> LINEUP`). Then:
- A note: `<Side> · Squad rule: <rule>.` plus `Kept from your last <format> game.` when the lineup was filled from the last one (`For this game only.` on a bot lineup).
- The **unit cap** bar as today (`Unit cap (UC)` and `n/size`), in the side colour.
- The **icon key**, one wrapping line, 12 px muted, 12 px icons: HP (heart), Strength (maul), Range (target), Reach (spear), Move (arrow).
- **No** `Units` heading and **no** hint under it. **No** flagkeeper picker (none since rule set v3).
- **Unit rows** (8 px apart): 1 px line border (side colour when its count > 0), radius 12, 8 px 12 px padding, 8 px gaps: a 26 px token; the **name button** (600 14 px name followed by the 16 px info icon in muted; name and icon are **one** button, `aria-label="<name>: unit information"`) that opens the unit's card as in a match, with its fixed card values; under it **one line** of numbers, each a 13 px icon and a 600 12 px number, 10 px apart: HP, Strength, then **Range for Ranged units, Reach for Anti-Cavalry, nothing for melee and mounted units**, then Move (the movement cap); a unit worth more than 1 UC adds a small `2 UC` tag. Right: −, the count, + (40 px round buttons, as today). Build the row so a mounted unit (brief 012) needs no layout change: the `2 UC` tag and "no Range or Reach" already cover it.
- A **locked** row (the squad rule forbids that unit): dashed border, `#eef0eb`, a grey lock in place of the token, the name button still opening the card, and the line `Squad rule: <rule>` in place of numbers; no − or +.
- **Against a bot**, below the rows under a 1 px rule: **`Pick <Side> lineup`**, full width, 48 px, white, 1.5 px border in the bot side's colour, the bot icon and the side name in that colour (`Pick South lineup`, or North after Swap ends). It opens the bot lineup. Once picked, the button becomes a block in the bot's colour: `<Side> lineup: picked by you`, `<n> of <size> UC · <rule>`, the units as small chips, and `Edit` and `Clear` (40 px). Clear goes back to the bot choosing. Not shown in hot seat or under Random.
- **Footer:** `Reset` (clears every unit, no confirm, as brief 029 built) and **`Start match`** (bot lineup: `Done`, back to Your lineup).

**Hot seat:** each side's Lineup is behind the cover as today, North then South; neither sees the other's.

### 5. The squad checks (Game Laws 2.2, 2.16)
For every lineup, yours and a picked bot lineup:
- **Squad rule:** units the rule forbids are locked rows (section 4). Light only locks Heavy units, Heavy only locks Light units, Foot only locks mounted units, Cavalry only allows mounted units and at most one foot unit (the foot rows lock once one foot unit is in).
- **Foot unit (2.2):** a lineup with no foot unit cannot start. Cavalry only needs exactly one.
- **A lineup that breaks a rule:** Start match (or Done) is disabled, and tapping it shows the reason in the board's dark pill above the footer for 3 s. Reasons: `Add one foot unit to hold your flag.` (F09), and for a kept lineup that a changed rule now forbids: `<Unit> is not allowed under <rule>. Remove it to start.` A kept lineup is filled in as kept and checked; nothing is removed silently.
- **Short squad (2.2):** a legal lineup below its cap may start. The **first** tap on Start match (or Done) shows the dark pill `You're <n> UC short. Tap Start match again to play short.` (bot lineup: `Tap Done again to play short.`) and does not start; a **second** tap within 4 s starts. A lineup with no units at all is not legal (it has no foot unit).
- The checks are one function used by the Lineup screen, Random, the rematch and the watch link, so a match can never start illegally from any path. Write it so it already knows mounted units and Cavalry only (from the unit data, not a hard-coded list): brief 012 calls this same function instead of its own lineup refusal.

### 6. The bot's own lineup inside the squad rule
When no lineup is picked for a bot side, the bot picks as today through `WT.mixCounts` / `mixPick`, mapped from the squad rule: **Open** → today's Open (the brain's kit squad, or the balanced lineup); **Light only** → `light`; **Heavy only** → `heavy`; **Foot only** → Open with foot units only; **Cavalry only** → mounted units in turn (Heavy, Light) with one foot unit (the brain's choice of foot unit; default Heavy Anti-Cavalry); **Random** → `random`, for **both** sides, human sides included. A bot lineup always fills its cap. The **mix** setting and its five choices leave the set-up (the squad rule replaces them; the code may keep mixes internally).

### 7. Record, watch link, rematch
- The squad rule goes into `opts` (e.g. `opts.squadRule: "open"`), the match record, the Matches list header (`· Squad rule <rule>` when not Open) and the watch link. A record without it reads as Open, so every saved record replays as today.
- Short squads replay exactly: lineups are already stored whole.
- **Rematch (brief 029):** keeps the squad rule. `Same lineups: Yes` re-checks both lineups against it (always legal, since they were). `No` goes to the Lineup screen as this brief builds it.

### 8. Desktop
The same screens and order in desktop's own layout (one column, centred, max 560 px), New game footer at the bottom of the column. The three-column desktop drawn on the condensed page is **held**: do not build it.

## Rules it touches
Game Laws 2.2 (up to the cap; at least one foot unit; no illegal start), 2.16 (all six rules), 2.4 (one field per format: the field select goes), 4.2 (mounted units never hold a flag), 2.1 (9v9 and 13v13 need Cavalry), 1.16 (nothing empty offered: disabled options and reasons), 1.13. Brief 018 (hot-seat view and covers), 029 (rematch, Reset), 025 (phone sizes). Each becomes a test.

## Bot minimum
In 100 seeded set-ups per squad rule available before Cavalry (Light only, Heavy only, Foot only, Random, Open; at 5v5 and 7v7), the bot's lineup is legal every time (squad rule, at least one foot unit, full cap) and every match plays to its end with no error. A picked bot lineup is used exactly as picked. Report the counts. **Cavalry only at 9v9 and 13v13 is checked in brief 012**, the first build with mounted units (moved there by the Editor, 27 Nov).

## Must not change
Every preset plays and replays identically: `regress_engine.js` hashes unchanged; every saved record (no squad rule field) replays as Open. Deployment, play and the end-of-match sheet are untouched apart from the rematch path. The engine never sees the squad rule. This is a screen build: under brief 031 it should need no release run (if the game key changes, say why in the Report).

## Checks before opening the pull request
- Every check passes (the generated test list, brief 031); `regress_engine.js` hashes match.
- A new test of the squad checks: every rule × format × a short, full, over-cap, no-foot, and forbidden-unit lineup gives the expected legal / short / blocked result and reason. The Cavalry only rows use a test unit list with a mounted unit, so the function is proven before 012 uses it.
- A test that Start match cannot start an illegal lineup from the Lineup screen, Random, rematch, or a watch link.
- The UC wording check from brief 009 passes on the new screens.
- Screenshots at **393 × 665** of every frame F01 to F10 (F09 with a test unit list, or marked "after 012"), plus desktop New game, Game settings and Lineup.

## The Editor's hands-on check
On his phone: New game against the bot with Light only, pick South's lineup, start short and see the warning, start on the second tap. Hot seat: both lineups behind covers. Random: Start match goes straight to deployment. Remove every foot unit from your lineup: Start match stays greyed with "Add one foot unit to hold your flag." (The 9v9 Cavalry only check moves to 012's hands-on.)

## Report back
The standard items, plus: the squad-check test table, the bot minimum counts, screenshots beside F01 to F10, and anything in the old Settings, Teams or Lineup screens that has no place in the new ones.

---

## Report
*Filled in by Claude Code.*

- **What's in:** all eight sections. **New game:** both side blocks (Human/Bot switch, name box, Era/Region reading TEST; for a bot, Difficulty and Personality, both tagged "Not built yet", plus the cog), Swap ends, Moves first, Squad rules (Cavalry only greyed at 5v5 and 7v7), the Game settings line with bold for anything that differs from your last game and its key line, and the seed box with copy and New seed. The footer reads Next: Lineup, or Start match under Random or with no human side. Scroll position is kept. **Game settings:** Match, Bot, Play, Hot seat and Seed groups, Newest and Default as the first options, Reset and Done. **Personality sheet:** five sliders, each with a number box (typed values clamped 0 to 100 when you leave the box), the Custom badge, Back to Default, and the discard prompt on ‹ or › while Custom. **Lineup:** the note, the unit-cap bar, the icon key, rows with one line of numbers and a name button, locked rows, Pick South lineup and its picked block (Edit, Clear), Reset. **Squad checks:** one function, `board/squad.js` `check()`, called by the Lineup screen, `startMatch()`, Random, the rematch and watch links. **Bot lineup inside the rule:** `watch.js` `squadCounts()`. **Record:** `opts.squadRule`, shown on the Matches screen, carried by `squad=` in watch links, kept by the rematch. Unbuilt choices are stored in `match.setup`. **Desktop:** one centred column, 560 px max.
- **Anything beyond the brief, and why:**
  - The game key changed, so this build gets a release run (the brief expected none). The watch link has to carry the squad rule (§7), which means changing `watch.js`, one of the game-key files. I also added `squad.js` to the game key (`sims/lab/release_files.js`) because it now decides watch-link lineups. A link without `squad=` plays exactly as before: `test_watch.js` 20/20, the board check (3 games, 0 different), and replay hashes unchanged.
  - The Era, Region and Difficulty arrows show a toast ("TEST is the only era for now.") instead of doing nothing silently, so a tap never looks broken. Personality arrows do the same unless the value is Custom.
  - Hot seat: the first side's footer still reads "Next: South lineup", as before.
  - A lineup over the cap is blocked with "n UC over the unit cap. Remove a unit to start." The brief gives no wording for this case.
  - Mounted units at 5v5 and 7v7 show as locked rows (Game Laws 2.1). Raised as F030-3.
  - The old presets' Flagkeeper picker stays for Match 3, v1 and v2 only. Raised as F030-1.
- **Squad-check table (`node tests/test_squad.js 2 --table`, 170 rows):** every squad rule × 5v5 and 7v7 on v3.10, and every rule × 5v5, 7v7, 9v9 and 13v13 on a test list with two mounted cards (2 UC each). Results: full → ok in 32 rows; short → short in 32; over cap → blocked in 36; no foot unit → blocked in 36 ("Add one foot unit to hold your flag."); forbidden unit → blocked in 20 ("<Unit> is not allowed under <rule>. Remove it to start." or "… at 5v5"); a second foot unit under Cavalry only → blocked in 6. Cavalry only at 5v5 or 7v7 is blocked in all 8 of its rows ("Cavalry only needs 9v9 or 13v13."). Every row gave the expected result: 268 checks, 0 failures.
- **Checks run and results (paste regression hashes):** `test_squad.js` 268/268. `test_gamestart.js` (new, browser) 61/61: no illegal start from the Lineup screen, `startMatch`, Random, the rematch or a watch link; the short-squad double tap; the bot lineup used exactly as picked; hot-seat covers; bold settings; the personality sheet. `test_rematch.js` 49/49 (one check updated: the greyed Start match is now `aria-disabled`, so a tap can say why), `test_hotseat.js` 46/46, `test_phone.js` 64/64. `test_ui.js` 116/116 (the UC wording check passes on the new screens), `test_watch.js` 20/20, `test_fields.js` 127/127, `test_version.js` 34/34, `test_replay.js` 386 checks / 0 mismatches, lab `self_test.js` 35/35, `board_check.js` 3 games / 0 different, `tools/test_tools.js` all passed, `run-tests.js --check` 47 files. **Replay hashes** (`regress_engine.js`, 3 games per rule set) are identical against `main`'s board: match3 37397ef2bd3ed86b · v1 7b25bca651c0cb31 · v2 ddbe5fc437ff4e9d · v3 26371927b53d4413 · v3.1 c71e4cd12fc984b0 · v3.2 f62a061d2c147d83 · v3.3 e6151bf463d6c9f8 · v3.4 ee6ce003ac760250 · v3.5 fca989aecfaf21c9 · v3.6 a6bf327b54f7d5a1 · v3.7 dd3c27d9dc9aafbb · v3.8 022a298c49a02540 · v3.9 b3c2d4464b363ba0. The `all` run (every preset and brain) hit the session's 30-minute limit before it finished; GitHub's compare check runs it in full. All numbers in this Report come from session runs.
- **Bot minimum (met):** 100 seeded set-ups per rule and format (`node tests/test_squad.js 100 --rule <id>`, session run). Open, Light only, Heavy only, Foot only and Random, each at 5v5 and 7v7: the bot's lineup was legal 200/200 per row (both sides), filled its cap 200/200, and 100/100 matches played to their end. In total: 2,000 of 2,000 lineups legal and full, 1,000 of 1,000 matches finished, 0 errors. A picked bot lineup is used exactly as picked (`test_gamestart.js`). Cavalry only at 9v9 and 13v13 is left to Brief 012, as the Editor decided. The bot's Cavalry only lineup is already tested on the test list (Heavy Anti-Cavalry plus Cavalry, Heavy first, full cap).
- **Screenshots** in `briefs/img/030/build/` (made by `sims/shots_030.js`): F01 (and -full), F01b (bold line), F02 hot seat, F03 Random, F04 personality, F05 discard prompt, F06 Game settings, F07 Your lineup, F08 short squad, F09 rule broken (test list at 9v9, marked "after 012"), F10 and F10b bot lineup picked, D1 to D3 desktop.
- **What the old screens had that the new ones don't:** the per-side **mix** (Heavy, Light, Mixed, Open, Random), replaced by squad rules; it is kept internally (`match.mix`) so a rematch can redraw. The **field** line (one field per format, Game Laws 2.4). The **editable seed** box: the seed can be copied or replaced with New seed but no longer typed in (Round 16 F01 draws it read-only), so replaying a game from a known seed now needs a watch link. The Settings · Teams · Lineup **steps** row. The greyed 1-to-5 personality sliders on Teams, replaced by the 0-to-100 sheet.
- **Known gaps:** Personality, difficulty, era, region, overtime, rounds and dice are saved and recorded but not used, as the brief says. Random under mounted units: the draw counts slots, not UC, so Brief 012 must check the Random draw once 2 UC units exist (`legalise()` trims an over-cap draw, and the check would block an illegal one).
- **Flags closed / opened:** none closed. Opened F030-1 (Flagkeeper picker on the old presets), F030-2 (bot vs bot skips the Lineup screen), F030-3 (mounted units locked at 5v5 and 7v7), all `ASK`.
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/76 (branch `claude/build-brief-030-o97mc2`).
