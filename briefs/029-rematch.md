# Brief 029 — Rematch, a clean New game after the end, and Reset on the Lineup screen (Approved UI v7)

| | |
|---|---|
| Game version | **YY** (a new screen: a real change), ZZ = 00. Code takes the number at its last sync before Ready for review. |
| Lane | UI |
| Rule set | none. No preset, no rule change, no engine change. |
| Date | 25 Nov 2026 |
| Goal | One tap from a finished match to a rematch (same format and settings; the player chooses same lineups, same sides, same dice); New game after a finished match never asks about abandoning it and never re-files it as Abandoned; the Lineup screen's bottom Back becomes Reset. |
| Branch | Any branch your session may push to, started from `brief/029-rematch` |
| Flags | none to close. Open new ones in `flags/029.md`. |
| Waits on | none |
| Order | **Can start now**, beside 026 (UI: the action panel and special sheet), 028 (rules) and 020 (bot). It touches different parts of `board/app.js` (the end-of-match sheet, the "new" action, Continue, the Lineup footer), so `sync` if 026 merges first. Not tied to 012. |

## Context
The Editor asked for three things on 25 Nov (design chat FF UI v3.17.00): a **Rematch** at the end of a match, **no "Abandon the match in progress?" warning** when he presses New game after a match has ended, and **Reset in place of the Lineup screen's bottom Back** (the top arrow already goes back).

While checking the second one, the design chat found a real bug in `board/app.js` (read from the code, not reproduced in a browser):
- `case "continue"` makes `App.match` a **copy** of `App.live` and leaves `App.live` behind. On a page reload `App.live` is also loaded on its own (around line 2833). From then on every move updates `App.match`, and `App.live` stays frozen at the moment of Continue or reload.
- When the match ends and the player presses **New game** (the end sheet's button or Home), `case "new"` sees the match is over, falls through to `liveSummary()` on the stale `App.live`, finds it still in progress, and asks **"Abandon the match in progress?"**.
- If the player says yes, it rebuilds the stale copy and calls `Store.saveAbandoned()` with **the same match id**, so the Matches list's finished entry (and its saved record) is overwritten as **Abandoned**.

The screens were worked out on the UI Brainstorm canvas, **Rematch** page: Round 1 (A, B, C1 to C3, L1) and Round 2 (A2, C1 to C3). **Approved by the Editor, 25 Nov, 11:25 pm ET:** Round 2's end-of-match layout (A2: New game the big button) and rematch sheet (help line under each option, switches in one column), and Round 1's Lineup frame (L1). They are on the Approved UI canvas as page **v7**. Pictures in `briefs/img/029/` at **393 × 665** (the Lineup one 393 × 1010, the whole scrolled screen with the fold marked): `01-end.png`, `02-rematch-same.png`, `03-rematch-swap-newdice.png`, `04-rematch-repick-coin.png`, `05-lineup-reset.png`. They are mockups in the board's own colours and type, not screenshots: the field and scoreboard behind the sheets are schematic. **Where a picture and this brief differ, the brief wins.** The generator is `ui-mockups/rematch/gen_rematch.py` on branch `ui/mockup-generators`.

Rules that apply: Game Laws 1.13 (what is shown is the true state), 1.16 (nothing empty is offered), 7.9 (symmetrical, elegant, clean). The CLAUDE.md standing rule on replay applies: a rematch is a **new match** with its own id, and its record and watch link must replay it exactly like any match started from Settings.

## Scope
In: the end-of-match sheet's buttons; a new rematch sheet; starting a rematch (straight into deployment, or through the Lineup screen); the New game and Continue fix; Reset on the Lineup screen; the Lineup screen's top arrow during a rematch; desktop the same in its own layout.
Out: any rule, preset, engine or bot change; the game-start redesign (the Editor, 25 Nov: Home, Settings, Teams, Lineup and the bot's mix get redesigned together in their own UI round, and a "Pick" mix for hand-picking the bot's squad waits for it); match replay controls (parked by the Editor for the attack UI round).

## What to build

### 1. The end-of-match sheet (picture 01)
Today: one row of three equal buttons (See field, Copy record, New game primary). New:
- **Row 1:** **New game**, full width, primary (ink `#1f2421` background, `#f8f9f5` text), **48 px** tall, radius 10, 600 15 px. Same action as today (`data-act="new"`).
- **Row 2, 8 px gap:** **See field** · **Copy record** · **Rematch**, three equal plain buttons (`.btn`: `#f8f9f5`, 1 px ink edge), 44 px tall. See field and Copy record unchanged. Rematch opens the rematch sheet (section 2).
- Title and note unchanged (`<winner> wins` / `Draw`, then `<how> on turn N. Saved under Matches.`). Rows 12 px apart, as the sheet's gap.
- Labels never wrap at 393 px (Copy record is the longest, about 85 px in a 116 px button).

### 2. The rematch sheet (pictures 02 to 04)
Opens in the same bottom sheet (`#sheet`, white, radius 16 top corners, the grab handle), replacing the end-of-match content: `ui.sheet = { kind: "rematch", ... }`. Contents, top to bottom, 12 px apart:
1. **Title** `REMATCH` (the sheet's `h2`: 700 24 px Barlow Condensed, capitals).
2. **Note** (13 px, `#5f6762`): `<format label> · Rules <rule set id> · <North name> vs <South name>`, then `. Format and settings stay.` Use `Bot (<brain name>)` for a bot side (picture: `7v7 · Rules v3.9 · You vs Bot (Brain 8). Format and settings stay.`; the `You` there is the human side's name as the match has it).
3. **Three option rows**, each with a 1 px `#e3e6e0` line on top and 10 px padding above and below. A row: on the left, the option name (600 15 px ink) with its **help line under it** (400 12 px `#5f6762`, 3 px below, **one line, never wraps**: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`, though every line below fits); on the right, a Yes/No switch (the board's `.seg`: `#dfe3dc` track, 4 px padding, radius 11; two 40 px tall buttons, the chosen one ink with `#f8f9f5` text), **132 px wide, the same column for all three rows**. The left column takes the rest (`flex: 1; min-width: 0`). The Editor, 25 Nov: rows stay neat, the help text sits under the option's name and never runs under the switch.
4. **Buttons:** **Cancel** (flex 1) and the go button (flex 2, primary), both **52 px**, radius 12, 10 px apart (the board's `.footer .btn` sizes). Cancel goes back to the end-of-match sheet, as it was.

The three options, with every help line (`<First>` is `North` or `South`, the side that will move first, from the finished match's `opts.first`):

| Option | Yes (default) | No |
|---|---|---|
| **Same lineups** | `Both sides keep their units.` | `Pick again on the Lineup screen.` |
| **Same sides**, chosen side to move first | `Same ends. <First> moves first.` | `Ends swap. <First> still moves first.` |
| **Same sides**, coin-toss match | `Same ends. New coin toss.` | `Ends swap. New coin toss.` |
| **Same dice** | `Same code: same moves, same rolls.` | `New code, new rolls.` |

(The pictures say `Same code, same rolls.` The brief's wording wins: the same code repeats the rolls only while both sides play the same moves, because the bot draws from the same stream. That reading is the design chat's, to confirm with the Editor at review.)

**Same dice** also shows the game seed under its row, full width, 8 px below: a 40 px read-only box (1 px `#b8beb6`, white, radius 10, 600 15 px, letter-spacing .04em) and a 44 × 40 copy button (the board's copy icon, 1 px ink edge, `aria-label="Copy game seed"`). Yes shows the finished match's seed. No shows a **new** seed (`E.makeSeed()`, made once when the sheet opens and kept while it is open, so switching No → Yes → No shows the same new code), with a small `New` tag (600 11 px `#5f6762`) after it inside the box. Copy copies the code shown, with the same toast as Settings' copy (`Seed copied.`).

**The go button** reads **`Start rematch`**, or **`Next: Lineup`** when Same lineups is No and at least one side is human.

All three default to **Yes** each time the sheet opens (one tap repeats the match exactly). Don't remember the last choice.

### 3. Starting a rematch
Build the new match from the **finished match's own record** (`App.match`), not from Settings or `Store.local("setup")`, so the rematch is exactly the match just played except for what the sheet changes:
- **Same everywhere:** the rule set as played (`E.clone(match.rs)`, even if a newer preset now exists), the format, each bot's brain **with its settings as played** (`match.brains`), each side's type and name, the hot-seat view (`match.view`).
- **New:** a new match id and started time, `game`/`build` from today's `version.js`, `actions: []`, `draws: 0`.
- **Same sides: No:** swap North and South for players, names, brains and lineups (and each bot's mix, below). `opts.first` stays as it was: the **end** that moved first moves first again, so the first move passes to the other team (the Editor, 25 Nov: "if north went first last time then it does again").
- **Coin-toss match** (`opts.coin`): a **new toss** whatever the dice choice (the Editor). Today's toss is `rand()`, draw 0 of the match seed, so with the same seed it would land the same way. So: still call `rand()` once at the same point (so every later roll keeps its draw number and the same dice really repeat), but take the side from a fresh `Math.random()`. `opts.first` records the result, so the match replays exactly. Keep the `Coin toss: <side> moves first.` toast.
- **Same dice:** Yes keeps `opts.seed`; No uses the sheet's new seed.
- **Same lineups: Yes:** keep both lineups as played (swapped with the sides if they swap). Then `rebuild()`, `resetUi()`, `beginDeploy()`, `Store.saveLive()`, `App.live = App.match`, `show("play")`, exactly as `startMatch()` ends.
- **Same lineups: No:**
  - **Human sides** go through the Lineup screen as after Teams (`openLineup()`, the hot-seat cover screens included when both are human), each starting from the lineup it just played (so Reset is there to clear it) on the side it will now play.
  - **Bot sides** draw again from their mix, with the rematch's seed and side: `mixPick()` / `WT.mixCounts()`. A bot drawn at Random with the same seed may get the same squad again: the Editor is fine with that (25 Nov). To know the mix, record it: `startMatch()` saves each bot side's mix beside the options, as `match.mix = { N, S }` (display only, like `match.view`: the engine never sees it, and the lineups it produced are already in `opts`). A finished match saved before this build has no `mix`: its bot keeps its lineup.
  - When the last human lineup is done, start the rematch as above.
- **The Lineup screen's top arrow during a rematch** goes back to the finished match with the rematch sheet open (choices as left), not to Teams. Outside a rematch it goes to Teams as today.
- The finished match stays in Matches as it was. The rematch is saved as a new entry when it ends.
- Bot against bot works the same way (Same lineups: No redraws both bots; the go button stays `Start rematch`).

### 4. New game after the end, and Continue (the bug)
Two fixes, both:
1. **A match that ends clears the saved live match.** Where `act()` sees the result (`st.result`, before `Store.saveFinished`), also clear it: `Store.local("live", null)` and the database's `live/current` (write `{ match: null }`, or delete it), and set `App.live = null`. Then Home never offers Continue for a finished match, and New game never asks about it, even after a reload.
2. **Continue plays the saved match itself.** In `case "continue"`, after cloning, set `App.live = App.match`, so there is one match in memory and nothing goes stale.

Also, as a guard: in `case "new"`, never call `Store.saveAbandoned()` for a match id that `Store.matches()` (or `local("matches")`) already holds as finished.

### 5. Reset on the Lineup screen (picture 05)
The footer's left button (`data-act="go" data-to="teams"`, label `Back`) becomes **`Reset`** (`data-act="lineup-reset"`), same size and look (`.btn`, flex 1, 52 px). Tapping it sets every unit count of this side's pick to 0 (`App.picks[side].counts`), keeps the Flagkeeper choice as it is, closes an open unit card, and redraws. No confirm (the Editor: not a big deal if tapped by accident). The go button then reads as today and is disabled until the unit cap is full. The top arrow (`backbar`) still goes back (to Teams, or as section 3 says during a rematch).

### 6. Desktop
The same buttons, sheet and Reset in desktop's own layout (the end-of-match and rematch content in the same sheet or panel the end-of-match content uses today). Not drawn.

## Rules it touches
None: no rule, preset or engine change. What it touches, each with a test:
- Replay: a rematch's record and watch link replay it exactly; a rematch with Same dice: Yes, both sides bots with the same brains, same lineups and same sides plays **the same game** as the original (the same actions, the same result). Write this as a test.
- The coin toss: in a coin-toss rematch, every roll after the toss uses the same draw number as in the original (same seed, same moves, same rolls).
- Swap: after Same sides: No, each team's lineup, brain and name are on the other end, and `opts.first` is unchanged.
- The bug: finish a match after Continue, and after a reload. Press New game: no warning, and Matches still shows the match as won, lost or drawn. Then Home shows no Continue for it. Make the test fail on today's `main` and pass on the build.
- Saved picks (`Store.local("picks")`): a rematch lineup saves like any lineup.

## Bot minimum
n/a: no new unit, action or rule. Bots in a rematch play as in any match.

## Must not change
- Every existing preset plays and replays identically (engine untouched: `regress_engine.js` hashes must all match).
- Settings, Teams and Lineup as they work today when reached from Home (apart from Reset).
- The finished match's saved entry and record.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every rule set match the previous board.
- The tests in Rules it touches.
- At 393 × 665: no button label or help line wraps or clips, in every state of the rematch sheet (both sides' names as long as the board allows, a long brain name in the note: the note may wrap to two lines, nothing else).

## The Editor's hands-on check
1. Play a match against the bot to the end. Tap Rematch, Start rematch: the same lineups deploy, and Copy record shows the same seed as the first match.
2. Tap Rematch with Same sides: No and Same dice: No: you play the other end with your own lineup, the side that moved first still does, and the seed is the new one shown.
3. Same lineups: No: you pick again (Reset clears your units) and the top arrow brings back the rematch sheet.
4. Leave a match, come back through Continue (or reload), finish it, press New game: no warning, and Matches shows the result, not Abandoned.

## Report back
Screenshots at 393 × 665 of: the end sheet, the rematch sheet in its three pictured states, the Lineup screen with Reset; the bug test's before and after; the same-dice replay test's result.

---

## Report
*Filled in by Claude Code.*

- **What's in:** all six sections. End sheet (New game on top; See field · Copy record · Rematch under it). Rematch sheet with the three Yes/No rows, help lines, the seed box and copy button; Start rematch / Next: Lineup. Rematch built from the finished match's own record (`rematchOf()`): new id, same rule set, format, brains as played, types, view; Same sides: No swaps everything and keeps `opts.first`; a coin-toss rematch takes draw 0 then tosses with `Math.random()`; Same dice: No uses the sheet's new seed. Same lineups: No: humans go through the Lineup screen from the lineup played; bots redraw from `match.mix` (saved by `startMatch()` from this build on; older matches keep their lineup); the top arrow returns to the sheet with choices as left. The bug: a finished match clears the live match (device and database), Continue sets `App.live = App.match`, New game never files a match already held as finished. Lineup Reset. Desktop uses the same sheet in its right-hand column.
- **Anything beyond the brief, and why:**
  - On a phone, the end and rematch sheets hide the unit bar and action buttons (all disabled once the match is over). Without it the rematch sheet didn't fit at 393 × 665: Cancel and Start rematch were below the fold inside the sheet.
  - Abandoning a match now also clears the database's live copy (before, only this device's copy was cleared, so a reload could offer Continue for an abandoned match).
  - A live match is never saved again once it is over (the bot's last move and the Hot-seat view switch used to re-save it).
  - Names on Same sides: No: a typed name goes with the team, a default end name ("North") stays with the end. See F029-1.
  - Escape on the rematch sheet works like Cancel.
- **Checks run and results (paste regression hashes):** every README check passes in this session (test_v32 40, test_v35 6, test_v36 4, test_v37 2, fields/kitd/brains at the workflow's counts; lab self test 35/35; board_check 3 games, 0 different). `test_version.js` updated to v3.18.00 (22/22). New `test_rematch.js`: 49/49. Its bug part fails on `main`'s board (`node tests/test_rematch.js <main board> bug`: 4/6, "asks nothing" and "Matches still shows the result (got abandoned)" fail) and passes on this build. Same-dice replay: Brain 8 v Brain 8, 5v5, seed SAME-DICE-29: 113 actions, South KO, identical actions and result in the rematch. Engine untouched (no `engine.js`, `data.js`, `bot.js`, `brain.js` or `watch.js` change); `regress_engine.js` against `main`'s board, 3 games per rule set:
  REGRESS_HASHES
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a
- **Settings review (brain builds only):** n/a
- **Known gaps:**
  - The help line "Same code: same moves, same rolls." follows the brief, not the picture; the design chat asked the Editor to confirm it at review.
  - A rematch's Lineup screen still shows the Settings · Teams · Lineup steps (brief didn't say to change them).
  - A rematch in progress on the Lineup screen is lost on a page reload (back to Home; the finished match is safe in Matches).
  - The bot's last move reason isn't in the finished match's saved record (true before this build too).
  - Screenshots in `briefs/img/029/build/` (made by `sims/shots_029.js`): 01 end, 02 to 04 the rematch sheet's three pictured states, 05 / 05b Lineup with Reset (before and after a tap), 06 / 07 desktop, 08 / 09 the bug before (old board asks) and after (straight to Settings).
- **Flags closed / opened:** none closed; opened F029-1 (`ASK`: where default names go on Same sides: No).
- **Pull request:** PR_LINK (branch `claude/fervent-einstein-v0rlyz`).
