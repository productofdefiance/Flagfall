# Changelog

Newest first. One entry per build, written for the Editor: what a player notices first, then what changed under the hood.

## Game versions

| Game version | Rule set (newest) | Default brain | UI | Build |
|---|---|---|---|---|
| v3.20.00 | v3.10 | Brain 8 | v7 | 25 |
| v3.19.00 | v3.10 | Brain 8 | v6 + v5 + v4 | 24 |
| v3.18.00 | v3.9 | Brain 8 | v6 + v5 + v4 | 23 |
| v3.17.00 | v3.9 | Brain 8 | v5 + v4 | 22 |
| v3.16.00 | v3.9 | Brain 8 | v5 + v4 | 21 |
| v3.15.00 | v3.9 | Brain 8 | v5 | 20 |
| v3.14.01 | v3.9 | Brain 5 | v5 | 19 |
| v3.14.00 | v3.9 | Brain 5 | v5 | 18 |
| v3.13.00 | v3.9 | Brain 5 | v3 | 17 |
| v3.12.00 | v3.8 | Brain 5 | v2 | 16 |
| v3.11.00 | v3.7 | Brain 5 | v2 | 15 |
| v3.10.00 | v3.7 | Brain 5 | v2 | 14 |
| v3.09.01 | v3.6 | Brain 5 | v2 | 13 |
| v3.09.00 | v3.6 | Brain 5 | v2 | 12 |
| v3.08.00 | v3.5 | Brain 5 | v2 | 11 |
| v3.07.00 | v3.4 | Brain 5 | v2 | 10 |
| v3.06.00 | v3.4 | Brain 5 | v2 | 9 |
| v3.05.02 | v3.4 | Brain 5 | v1 | 8 |
| v3.05.01 | v3.4 | Brain 5 | v1 | 7 |
| v3.05.00 | v3.4 | Brain 5 | v1 | 6 |
| v3.04.00 | v3.4 | Kit D | v1 | 5 |

## v3.20.00 · Build 25 — Brief 029, Rematch, a clean New game after the end, Lineup Reset (26 Nov 2026)
Rule set: none changed (v3.10 stays the newest). Default brain: Brain 8 (unchanged). Game version **v3.20.00** (YY: a new screen; brief 026 took v3.18.00 and brief 028 v3.19.00, in the order the Editor merged them). UI: Approved UI v7.

**What a player will notice**
- The end-of-match sheet has **New game** as the big button, with **See field · Copy record · Rematch** under it.
- **Rematch** opens a sheet with three Yes/No choices: Same lineups, Same sides, Same dice (all Yes each time). One tap on **Start rematch** replays the match exactly: same rule set, format, brains, lineups and seed.
- Same sides: No swaps ends; the end that moved first moves first again. A coin-toss match always tosses again. Same dice: No shows the new seed before you start, with a copy button.
- Same lineups: No sends human sides to the Lineup screen, starting from the lineup just played; the top arrow goes back to the rematch sheet. Bots draw again from their mix.
- **New game after a finished match no longer asks "Abandon the match in progress?"**, and the finished match is no longer re-filed as Abandoned (it happened after Continue and a reload). Home no longer offers Continue for a finished match.
- The Lineup screen's bottom **Back is now Reset**: it clears every unit (the Flagkeeper stays). The top arrow still goes back.
- On a phone, the end and rematch sheets take the bottom of the screen in place of the (unusable) action buttons.

**Under the hood**
- `app.js`: `rematchOf()` builds the new match from the finished match's own record (new id, `actions: []`); `startRematch()`; a coin-toss rematch still takes draw 0 so later rolls keep their draw numbers. `startMatch()` records each bot side's mix as `match.mix` (display only).
- A match that ends clears the saved live match (this device and the database); Continue keeps one match in memory; New game never files a match Matches already holds as finished. Abandoning now also clears the database's live match.
- `test_rematch.js` (49 checks, headless browser) in the checks; `sims/shots_029.js` makes the screenshots.

**Flags:** opened and closed F029-1 (names when ends swap, as built); opened F029-2 (version numbers with several pull requests open).
## v3.19.00 · Build 24 — Brief 028, rule set v3.10: Arrow Storm 1.5 times, minimum damage 0.5 (24 Nov 2026)
Rule set: new **v3.10** (v3.9 with Arrow Storm 1.5 times a normal shot and minimum damage 0.5), the new-game default. Default brain: Brain 8 (unchanged). Game version **v3.19.00** (YY: a rule change; Brief 026 took v3.18.00 first).

**What a player will notice**
- Arrow Storm hits for 1.5 times a normal shot (was twice), still ignoring Dodge. A full-health Light Ranged (12) survives a clean Storm on 1.5 health instead of being removed from range.
- The Storm's description says "1.5 times a normal shot. Dodge doesn't count." on v3.10 (older rule sets still say "Twice").
- No hit, pull or special is rounded up to a whole point any more: the smallest is 0.5. Options shows "Minimum damage 0.5". It almost never comes up (about 1 hit in 700).
- 5v5 games fight sooner and end on the clock less often (23% of Brain 8 games, was 44%). 7v7 plays much as before.
- Older rule sets play and replay exactly as before.

**Under the hood**
- `data.js`: preset v3.10 (two numbers). No engine, bot or screen code changed.
- `test_v310.js` (78 checks) in the checks. `test_brain8.js` 3b now takes its set-up from the Storm's own number; `test_route.js` and `test_fields.js` no longer assume v3.9 is newest.
- Lab: new measure `mindamage`. Run `storm-v310` (study, 4,000 games, v3.9 against v3.10 on the same seeds).

**Baseline** (Brain 8 mirrors, 1,000 games each; tiebreak wins apart)

| | Holder KO | Pull KO | TKO | Tiebreak win | Draw | Ended on turn limit | Games with a pull | Avg turn | First mover's share of decisive |
|---|---|---|---|---|---|---|---|---|---|
| 5v5 v3.9 | 4.6% | 42.2% | 8.9% | 37.5% | 6.8% | 44.3% | 42.2% | 18.5 | 53.5% |
| 5v5 v3.10 | 6.4% | 58.7% | 11.5% | 21.4% | 2.0% | 23.4% | 58.7% | 14.4 | 41.9% |
| 7v7 v3.9 | 4.3% | 65.8% | 19.0% | 10.1% | 0.8% | 10.9% | 65.8% | 15.5 | 44.6% |
| 7v7 v3.10 | 4.8% | 63.9% | 18.1% | 11.6% | 1.6% | 13.2% | 63.9% | 16.3 | 49.2% |

**Flags:** carries out F022-9 (Arrow Storm half); opened F028-1, F028-2 (5v5 first mover at 41.9%), F028-3.

## v3.18.00 · Build 23 — Brief 026, no rule change: the specials flow, Approved UI v6 (23 Nov 2026)
Rule set: none changed (v3.9 stays the new-game default). Default brain: Brain 8, unchanged. UI: **Approved UI v6** (the specials) on top of v5 and v4. Game version **v3.18.00** (YY: new screens; Brief 020 took v3.17.00 first).

**What a player will notice (phone and desktop)**
- **One tap warms up a special**, like Brace: no confirm step. The button turns dashed gold and the unit bar says "Fires next turn · no attack or brace". **Undo takes a warm-up back** (Stamina and Command too).
- **The Special button has five looks** and no state bar: white (unused), dashed gold (warming up), gold (charged), grey (used), yellow-grey (can't warm up this turn). A used, warming or blocked special can be tapped for its reason.
- **Tapping a charged special opens the special row:** the special big and gold where Attack sits ("2 targets", "No targets", the reason it can't fire, or "−1 Stamina" once the next tap fires), **Warm up** beside it (warm up again instead of firing; the big button then greys "Warming up instead"), and **Cancel**. One target opens its sheet at once.
- **"Tap a target"** replaces "Tap a red ring". No target: "No targets available · move" (or just "No targets available" with no moves left). Reasons never show unit codes ("Ended its turn", not "LM has ended its turn"); the Evade hint names the unit in full.
- **A new gold special sheet** for every special, one target included: the attacker with its Strength and the multiplier (always, ×1 too) and "Sure hit", then one short row per target with its damage, HP, its own modifiers and its HP bar. A modifier the special ignores is struck through (Arrow Storm's Dodge, Bullseye's Armor with Pierce). It is shorter: about 87 px for one target (was 137).
- **A killing Pick Off now warns of a set spear** (the red spear pill on its row and the badge on the field), and of a Mark. The engine deals exactly that amount (checked).
- **Brace button:** solid charcoal when braced this turn, dashed when braced last turn (the dots are gone).
- **Not enough Command:** when only the side's Command is short, a special now says "Not enough Command" instead of "Not enough Stamina".
- **No unit codes in sentences (F026-2, 25 Nov):** every greyed-out button's reason (Attack, Reach, Brace, End unit) is worded like the specials' ("Ended its turn", "Reloading this turn"). The field key names units in full ("Heavy Anti-Cavalry is braced.", "Where Light Melee can move this turn."). Desktop's unit list and the deploy chips keep their codes.
- **The special sheet shows the right parry (F026-1, 25 Nov):** when an Arc Hit kills the first braced Heavy Melee in its arc and a second one survives, the sheet now shows the second one's parry in its row and "Parry: you take 2", as firing does.

**Under the hood**
- 25 Nov, the Editor's rulings: `engine.js` `specialPreview` picks the parry as `doSpecial`'s own loop does: the first braced Heavy Melee in the arc that survives its hit (display only; replay hashes identical). `app.js`: `SP_WORDS` words every button's reason and the Evade hint, `named()` swaps leftover unit codes for names (refusal toasts too), and the key lines use `UI.unitName`. Tests: `test_spengine.js` 24 checks (the flag's position, 400 seeded Arc Hits with two braced Heavy Melee), `test_spflow.js` 61 checks (no unit code in any reason, pill or key line).
- `engine.js`: `warmupBlock` and `fireBlock` return "Not enough Command" when the unit has the Stamina but the side lacks the Command. A returned message only: every preset and brain replays with identical hashes.
- `app.js`: the special row, one-tap warm-up, `"warmup"` added to Undo, the wording table (`SP_WORDS`), the reason pill, the new sheet. Retired: the warm-up confirm (`ui.sheet.kind === "warm"`), the state bar, desktop's warm-up line and the "No target in range · fires next turn" note. `ui.js`: `specialSheet()` reads the rows, struck modifiers, kill pills and parry from the engine.
- New checks: `test_spflow.js` (the flow in a browser, phone and desktop), `test_spengine.js` (the message split; only Evade cards are told they may only evade; a killing Pick Off's spear against the sheet over 400 seeded positions). `test_phone.js` updated for the retired confirm and bar; `test_reasons.js` now expects "Not enough Command" where only Command is short.

Flags: opened F026-1 to F026-3 (`flags/026.md`); on 25 Nov F026-1 and F026-2 fixed, F026-3 closed (kept as built).

## v3.17.00 · Build 22 — Brief 020, Brain 9: victory values, spent opening, per-format settings (23 Nov 2026)
Rule set: none changed (v3.9 stays the newest; Brain 9 measured on v3.9). Default brain: Brain 8 (unchanged). Game version **v3.17.00** (YY: a new brain; brief 018 took v3.16.00 first).

**What a player will notice**
- A new opponent in the brain list, **"Brain 9 (plays to finish)"**. In the last 5 turns it values how the game is likely to end (finish 3, win on the clock 1, draw 0, loss -1). When it leads it keeps attacking instead of sitting on the lead, and fewer games run down the clock: Brain 9 against Brain 9 ends on the turn limit in 27% of 5v5 games and 8% of 7v7, against 41% and 13% for Brain 8 (1,000 games each).
- It plays Brain 8 about even at 7v7 and wins fewer 5v5 games, but more of the ones it wins are finishes, so it scores more by the Editor's table (+0.78 against +0.54 a game at 5v5).
- Its own tables on the Opponent screen: "Victory" (the five values, an on/off switch and three numbers) and "Opening". With both switches off it plays exactly like Brain 8.
- "Spend the opening Command" is there but **off**. Switched on, it uses spare first-turn Command (so a first turn of 5 and of 8 play differently), but in testing it lost to Brain 8 and handed the first mover most 7v7 games.
- Watch links carry Brain 9's settings, including a value for one format only (`brain9:tempoSecond.5=0`).

**Under the hood**
- `bot.js`: Brain 9's reading (`victory9Context`), its expected ending (`victory9Detail`, `finishChance9`, `attack9`, `outlook9`, `guards9`), finished games by the values (`endValue9`), the spent opening (`spend9Cost`) and per-format values (`forFormat9`). Nothing is remembered between turns. Brains 5 to 8 unchanged (same hashes).
- Lab: new always-on measure `victory` (late behind/ahead, guards, the Editor's points, Command used on turn 1). The lab self test now fails if two measures share a column name (the first version of `victory` clashed with `clock`'s `late_ahead_turns`).
- Runs: `brain9-screen`, `brain9-settings-screen`, `brain9-moveorder-screen`, `brain9-confirm`, `f022-8-tiebreaks`, `brain9-moveorder-confirm`.
- `test_brain9.js` (44 checks) in the checks and night checks.

**Flags:** opened F020-1 to F020-5; F020-4 applied (spent opening ships off); evidence added to F022-8.

## v3.16.00 · Build 21 — Brief 018, no rule change: turn cue, hot-seat views, field zoom, match log (23 Nov 2026)
Rule set: none changed (v3.9 stays the new-game default). Default brain: Brain 8, unchanged (Brief 022). UI: Approved UI v4 screens on top of v5. Game version **v3.16.00** (YY: new screens and a new setting; Brief 022 took v3.15.00 first).

**What a player will notice**
- **Turn cue (every game: hot seat, against the bot, watch and replay):** a tag hangs from the scoreboard on the mover's side, "NORTH PLAYS" / "SOUTH PLAYS" (and "… DEPLOYS"), for the whole turn; it slides away when the turn passes. On desktop it hangs under that side's name in the scoreboard.
- **Hot-seat view** (Settings step and the in-match Options menu): **Handoff** (as before), **Flip** (the field spins so the mover's flag is at the bottom), **Face to Face** (phones only: phone flat between you, the screen turns to face whoever is playing; the field never moves).
- **Field zoom on every format:** pinch, or the new zoom button under hex names (phone: in = the field's width, out = the whole field, starts zoomed in; desktop: in = 100 px hexes, out = the whole field, starts zoomed out; pinch to 120 px). **Deployment** shows the deploying side's half of the field, on phone and desktop alike. **Clicking the space around the field** lets go of the tapped unit. Drag to pan. A touch that moves more than 8 px never taps; a second finger cancels a drag. Desktop: mouse wheel, drag, + and −.
- **Zoomed out (hexes under 50 px), tokens show icons only**; tap a unit for its HP. 9v9 and 13v13 can be zoomed to fit or to 60 px hexes.
- **Hex names sit in the middle of the hex**; the hex-names button moved to the right edge, above zoom.
- **Match log:** on a phone, a new top-right button swaps the field for the log; on desktop it is a panel on the field's left (beside the field at 1200 px and wider, with a Hide button; over the field on narrower windows), opened from a button at the field's top left; the field keeps its place when the panel opens or closes (newest turn on top, each turn in play order, one row per action with Stamina, damage, HP before → after, OUT, Parry, set spear, holder and flag; tap an attack to see its sum). Options → Match log shows the same rows; the side column's Recent list is gone.

**Under the hood**
- `engine.js`: a display-only list `st.events` beside `st.log`, one entry per log line, with the facts the log rows need. Not enumerable, so it is never copied, saved, hashed or read by the rules, brains or lab. `st.log` is word for word unchanged; every preset and brain replays with identical hashes.
- `app.js`, `index.html`, `skin.js`: zoom, gestures, the three views, the tag (text colour picked by contrast in the skin), the log. The view is kept on the match (`match.view`), never in the options the engine reads.
- New checks `test_events.js` and `test_hotseat.js` (headless browser); `sims/shots_018.js` makes the screenshots.

**Fixed in review (the Editor, 22 Nov):** the field could jump to North's end (deployment always opened on North; zooming after scrolling lost your place; some turns jumped to the top): the field's position inside its scroll area was read as "not a number". The tag now stays all turn; "zoom in" goes to 100 px hexes; the desktop log is a left-side panel (F018-6).

On a phone the match log's header sits in the middle, between the Options button and Show field, and stays put while the rows scroll.

**Flags:** opened F018-1 to F018-6 (`flags/018.md`); closed F018-1 to F018-5 (the Editor, 22 and 23 Nov); F018-6 tabled.

## v3.15.00 · Build 20 — Brief 022, Brain 8: holder joins, safe approach, warmed-special respect, opening tempo (22 Nov 2026)
Rule set: none changed (v3.9 stays the newest; Brain 8 was measured on v3.8). Default brain: **Brain 8** (the Editor, 21 Nov, F022-5). Game version **v3.15.00** (YY: a new brain; briefs 017 and 025 took v3.13.00, v3.14.00 and v3.14.01 first).

**What a player will notice**
- **The computer opponent is now Brain 8** in a new match (it was Brain 5; Brain 5 stays in the list).
- A new opponent in the brain list, **"Brain 8 (safe approach)"**. When the enemy is down to its flag holder and the race is safe, its own holder joins the attack, so games end instead of running down the clock. It plays Brain 5 even, but in Brain 8 vs Brain 8 games far fewer reach the turn limit (5v5 46.5% against 64.2%; 7v7 12.5% against 40.3%, 1,000 games each).
- Its own table on the Opponent screen: four behaviours you switch on (1) or off (0), the numbers they use, and two **opening sliders** (moving first, moving second) from −1 (sit back) to +1 (attack). It ships pushing when it moves second (+1) and as Brain 5 when it moves first (0): in 7v7 that brings the first mover's share of decisive games from 34.7% to 43.7% without changing 5v5.
- Two behaviours are there but **off**: "Safe approach" (don't end a turn where the enemy strikes first) and "Respect a warmed special" (step out of or brace against a warmed-up special). Switched on they made it lose to Brain 5.
- Watch links carry Brain 8's settings, negative slider values included.

**Under the hood**
- `bot.js`: Brain 8's reading of the board (`approach8Context`) and its costs (`approach8Cost`), worked out each time it plans; nothing remembered between turns. With all four switches off it plays exactly like Brain 5 (same `brainhash`). Brains 5, 6 and 7 unchanged.
- Lab: new measures `firstloss` (first unit and first archer lost, first strike) and `brain8`; `sims/trace022.js`; `sims/lab/report022.js`. Runs: `brain8-screen`, `brain8-sweep`, `brain8-confirm`, `brain8-tempo-confirm`.
- `test_brain8.js` (38 checks) in the checks and night checks.

**Measured:** on v3.9 at the shipped settings Brain 8 loses to Brain 5 by 5 to 7.5 points in three of four matchups (mostly tiebreaks; F022-8). FD49-3's Command and Arrow Storm grid is in the brief's Report (F022-9).

**Flags:** closed F47, F022-5, F021-3 (F48 recorded). Opened F022-1 to F022-9. F41 stays open (next step F022-1).

## No game version — Brief 027, tooling: lab plumbing, fewer jobs (22 Nov 2026)
Nothing in the game changes (`board/` untouched). Every game the lab plays is the same.

**What the Editor will notice**
- A results pull request runs `checks` once (was twice), and no play link, night checks or lab run. It still merges itself.
- A release run's checks take 5 machines instead of 16; every check is still listed by name in `tables/checks.csv`.
- The status board no longer starts after every finished checks, night-checks or lab run (about 40 short runs an evening). It still updates hourly, on pull request events, on pushes and from Refresh.
- Main's play link is only republished when a merge changes the board.

**Under the hood**
- New `sims/lab/lab_key.sh`: the delivery and the refresh start `checks.yml` themselves only when the workflow's own token is in use (the Editor's key can read `GET /user`, the workflow token can't).
- `lab.yml` release checks: the 12 quick checks run in one job from `sims/lab/release_quick.txt`.
- `play-links`, `night-checks` and `lab` skip pull requests from `lab/**` branches (a job condition); `play-links`' queue moved onto its job so a skipped run can't cancel a waiting publish.
- New checks `sims/lab/test_deliver.js` and `sims/lab/test_workflows.js`, run in `checks`.

**Flags closed:** F024-1, F024-2, F024-3, F024-4. **Opened:** F027-1 (ASK).

## v3.14.01 · Build 19 — Brief 025 follow-up, no rule change: a special's Strength never struck (21 Nov 2026)
Rule set: none changed. Default brain: Brain 5. UI: v5. Game version **v3.14.01** (ZZ: a screen fix).

**What a player will notice (phone)**
- A special's preview shows Strength × multiplier with nothing struck through, even when Reach or Half Strength changed the Strength first: Javelin from 2 hexes reads `7 ×2` (was `8` struck, `7 ×2`). The numbers add up to the damage shown; the key still says why the Strength changed.

**Under the hood:** `ui.js` `phoneSpecialStats()`; a new `test_ui.js` check (fails on Build 18). Desktop unchanged.

**Flags closed:** F025-1, F025-3, F025-4 (the Editor, 21 Nov).

## v3.14.00 · Build 18 — Brief 025, no rule change: phone fit, Approved UI v5 (21 Nov 2026)
Rule set: none changed (v3.9 stays the new-game default). Default brain: Brain 5, unchanged. UI: **v5** (Approved UI v5, phone only). Game version **v3.14.00** (YY: new screens).

**What a player will notice (on a phone; desktop is unchanged)**
- **More field.** With a unit tapped the field gets 402 px of a 665 px screen (was 293), and about 310 to 330 px under an attack, special or flag-pull preview (was about 125).
- **No title bar in a match.** The scoreboard alone sits at the top. The menu button moves onto the field, top left; the hex-names button sits on the right, lower down.
- **The unit bar keeps one height** whatever you tap, so the field never jumps. It reads "Tap a unit" when nothing is tapped. A previewed move's dangers and costs show as chips beside the name; the route (C9 → C10) shows on the right. Tap the token or name for the unit's card, or the handle on top for the key. The "Pull up for the key" tab on the field is gone.
- **One compact sheet** for attack, special and flag pull. It replaces the unit bar while it's open: both full names, HP bars under them with the two hexes between, modifiers under the bars, the outcomes, then a bracket (or a line) showing which outcomes bring a set spear, a Mark or "Flag falls". A special's Strength reads "9 ×1.75". Tap a name in the sheet for that unit's card; closing it brings the preview back.
- **Flag pull** uses that sheet (no more dice grid), with the red **Pull** button in the action panel like Attack.
- **Warming up** shows "Fires next turn · no attack or brace" in the unit bar (two lines beside a long name, never cut off); the button reads "Warm up Arrow Storm". A charged special with no target says "Warm up Arrow Storm again" and "No target in range · fires next turn". Action buttons are 48 px tall and their labels never wrap; the Special button's state bar sits under its name.
- **The menu and hex-names buttons hide** while a sheet or the key drawer is open, so nothing covers them. A preview scrolls the field so the attacker and every target sit above the sheet, even from the last rows.

**Under the hood**
- `index.html`, `app.js`: a phone-only layout under 900 px. The desktop layout (900 px and wider) is untouched: screenshots at 1280 × 800 are pixel-identical to Build 17's.
- `ui.js`: `pullPreview()` (the pull sheet's numbers, read from the engine's pull) and `phoneSpecialStats()` ("9 ×1.75"). No engine change; every preset replays identically.
- New check `test_phone.js` (headless browser at 393 × 665), run on GitHub beside `board_check.js`; new rows in `test_ui.js`.

**Flags closed:** F017-1, F017-2 (accepted by the Editor, 20 Nov), F017-4, F025-2, F025-5 (this build). **Opened:** see `flags/025.md`.

## v3.13.00 · Build 17 — Brief 017, rule set v3.9: move and range preview, Approved UI v3 (20 Nov 2026)
Rule set: **v3.9** (new, the new-game default): v3.8 plus switch `routeRule211` (Game Laws 2.11). Default brain: Brain 5, unchanged. UI: **v3** (Approved UI v3). Game version **v3.13.00** (YY: new screens and a routing rule).

**What a player will notice**
- **Tap a move hex once to see the move before it happens:** the route the unit will walk (a blue line with an arrow), a faded copy of the unit where it will end, and badges for anything on the way: a Mark that stops it, a set spear that hits it, the Stamina tackle costs. Tap again, or press the new blue **Move** button, to go. Tapping another hex previews that one; tapping elsewhere cancels.
- **v3.9 moves walk a route.** The engine picks the cheapest route; if that route enters an enemy Mark before your hex, the move stops there (the preview shows it in grey, dashed, beyond the stop). It never takes a longer way round to avoid danger: take shorter steps for that. Set spear can now hit a unit on the way, not only at the end.
- **Range outlines:** tapping a Ranged or Anti-Cavalry unit outlines what it can hit from where it stands, and from the end hex while you preview a move. A Heavy Ranged that would have no Stamina left gets a "no attack after" badge instead. A special that is ready to fire shows its own range in a gold double line.
- **Tap an enemy** on your turn: its moves on its next turn (orange), its range, its special if it can fire next turn (plum), and four orange marks round each of your units it can hit now.
- **Attack preview:** the attacker's Evade hexes show on the field, and pills under the killing outcomes say what taking the hex brings (set spear damage, a Mark).
- **New look:** neutral field zones with pitch lines (deployment arc, goal circle, halfway line), the flag's HP in a pill on the flag hex's outer edge, a charcoal braced ring, red hatching beside every loaded braced Heavy Anti-Cavalry, gold/plum warm-up rings, numbers in IBM Plex Sans (Plex Mono is gone), buttons in the order Attack, Reach, Special, Brace. A pull-up **Key** (bottom-left of the field) lists only what is on the field now, one line each. The flag pill stays visible above a holder. Desktop: hover a move hex to preview, click once to move, Escape cancels.
- Older rule sets and saved matches move exactly as before (the move jumps).

**Under the hood**
- `engine.js`: `route()` (rules 1–4 of 2.11 and the walk), and read-only `canAttackAfter()`, `rangeHexes()`, `evadeHexes()`, `killConsequences()`, `enemyPreview()`. On v3.9 the move itself walks the very path `route()` names, so the preview and the move can't disagree. The move hexes offered are unchanged (`reachMap`).
- `bot.js`: plans already play every move through the engine; one look-ahead now reads where the unit really ended (it can stop short), which only differs on v3.9.
- New check `test_route.js` (the brief's set-ups, each mirrored; the preview agrees with the move on 1,000 random legal moves). New script `sims/route_bot.js` (the Bot-minimum counts).

**Flags closed:** none. **Opened:** see `flags/017.md`.

## No game version — Brief 024, tooling: the lab shares GitHub's machines (20 Nov 2026)
Nothing in the game changes (`board/` untouched). Every game the lab plays is the same.

**What the Editor will notice**
- In the daytime, pull request checks wait less: a lab run takes 15 of GitHub's 20 machines when the repository is quiet, 10 when it is busy, 5 for a big run when busy. At night (11 pm to 7 am ET, or after the night checks) it takes all 20.
- A lab run can be rushed: the new "rush" box when starting it by hand, or the `lab: rush` label on a pull request.
- A new push to a pull request replaces its older lab run instead of queueing behind it.
- The status page and `BOARD.md` show a Queue line ("Queue: 12 jobs waiting, oldest 43 min · lab using 9 of 20", or "Queue: clear").
- When GitHub is jammed, Code may offer to run checks or a small screen in its own session, and asks you first every time.

**Under the hood**
- New `sims/lab/capacity.js` and `capacity.json`; `lab.yml` uses them for each wave and the release checks.
- Big daytime runs play in two waves; the second chooses its share again. Same parts, same games.
- New `sims/lab/queuelog.js`: one line per run in `queue/queue-log.csv` on the `status` branch.
- New check `sims/lab/test_capacity.js`, run in `checks`.

**Flags closed:** none. **Opened:** F024-1 to F024-4 (all ASK).

## v3.12.00 · Build 16 — Brief 014, rule set v3.8: one field per format, and the hot-seat snap (20 Nov 2026)
Rule set: **v3.8** (new, the new-game default): v3.7 plus switch `fields` and `game.deployRadius5: 2`. Default brain: Brain 5, unchanged. Game version **v3.12.00** (YY: a new rule set; brief 019 took v3.11.00 and Build 15 first). The brief planned the rule set as v3.7; brief 011 took v3.7 first, so it is v3.8.

**What a player will notice**
- **5v5 has its own small field** on v3.8: 103 hexes, 7 columns (A–G), flags D3 and D15. You deploy **two rings** round your flag (19 hexes, the flag hex included for one unit).
- **7v7 plays on the rounded 147-hex field** on v3.8: the old field plus 8 corner hexes (B2, H2, B17, H17, A4, I4, A16, I16). Flags and the 3-ring deploy area as before.
- **Human vs human on a phone:** each time the turn passes, the field scrolls to the side to move's own end (North: the very top, South: the very bottom). Also on the first turn after the start cover. Not against the bot, not during deployment, not when the whole field fits on screen.
- Older rule sets, and old saved matches, play and replay on the old 139-hex field exactly as before.
- 9v9 and 13v13 still say "come later"; their fields are in the data for brief 012.

**Under the hood**
- New `board/fields.js`: the five fields as data (legacy, 5v5, 7v7, 9v9, 13v13), checked hex for hex against `briefs/014-fields.json`.
- `engine.js`: the field is no longer built once at the top. Each field's geometry (hexes, neighbours, distances, straight lines, goal zones, flags, centre hex) is built from the data, with positions worked out from the middle column (Game Laws 2.4; on 7 and 11 columns this is the opposite of the old column-index rule). Every rule reads the match's field (`fieldOf(st)`); a v3.8 match records which field it plays on. The old exports (`E.dist`, `E.FLAG`, …) stay as the legacy field for old tests.
- `bot.js`, `app.js`, `ui.js` and the lab read the match's field; the fixed centre "E10" became the field's centre hex (D9, E10, F12, G13). The drawing's size comes from the field.
- Lab: a `fields` measure (field played, units deployed outside their area, units started on their flag).
- New check `test_fields.js` (the data, deploy areas, gaps, goal zones, symmetry, the turn-1 design rule, the rules the brief lists on the 7-column field, and Brain 5 on both new fields).

**Flags closed:** none. **Opened:** F49 (the hot-seat snap can't show a whole 5v5 half on a 390 × 844 phone), F50 (5v5 on v3.8: the first-mover collapse is gone, but far more turn-limit games).

**Baseline** (Brain 5 mirror, balanced, 1,000 games per format, same seeds as v3.7; full table in brief 014's Report):
- 5v5: ended on the turn limit **61.9%** (v3.7: 35.1%), pull KO 23.5% (44.0%), first mover's share of decisive games **58.0%** (3.2%). Likely the smaller deploy area; not isolated.
- 7v7: ended on the turn limit 44.2% (42.7%), pull KO 39.4% (41.6%), first mover's share 31.4% (29.0%): no change beyond the noise.
## No game version — Brief 023, tooling: status page redesign, Needs sync, a Refresh that rebuilds (20 Nov 2026)
Nothing in the game changes (`board/` untouched).

**What the Editor will notice**
- The status page (https://productofdefiance.github.io/Flagfall/status/) has the approved design: a dark header, four tiles (On main, Building, Nightly checks, Flags), then Builds, Results, Chats, Flags and a Key. One layout for phone and computer.
- Every mark has an icon and a word, never colour alone: Review, Ready to merge, Needs sync, Heads up / On hold, Broken, Running, Needs an answer, Passing, Merged.
- A build that conflicts with `main`, or has fallen behind it (lab results aside), shows **Needs sync** instead of Review or Ready to merge, with "Your move: type "sync" in its Code chat". `BOARD.md` says "needs sync" in place of "Ready".
- Results show the share of games that ended on the turn limit, 5v5 and 7v7, read from each run's own table. `BOARD.md` uses the same short line.
- **Refresh**: with a key saved on that device, it rebuilds the board (about 1 to 3 minutes) and redraws when the new one lands. Without a key it re-reads the latest board. "Set up one-tap rebuild" explains making the key. The page also re-reads by itself every 5 minutes while open.

**Under the hood**
- New `sims/status/page.js`: draws the page, in Node when the board is built and in the browser when a newer board arrives; holds the Refresh logic.
- `board.json` gains the structured facts the page draws (builds, results with their two shares, flags with ~300 characters of issue, chats, tiles). The `board` text and every old field stay.
- The status page publishes in its own concurrency group with a retrying push (F021-2), and waits for a running play-link publish before pushing.
- A run started by hand (or by Refresh) always publishes, so the "Updated" time moves.
- New checks in `test_board.js` and `test_page.js` (no network).

- **Flags** (the Editor's design): each row is name and date, the status pill, then the issue on its own full-width line as a two-line preview. Tap a row to open the whole issue and its "Resolved in / next step" text; tap again to close.
- **Builds** has a Ready to start group between Building and Waiting.
- The set-up panel asks for a 90-day key.
- `play-links.yml` retries its push, so a status publish can't make a play link miss an update.

**Flags closed:** F021-2, F023-1, F023-2, F023-3.

## No game version — Brief 021, tooling: status board, chat log, flag and version numbering (20 Nov 2026)
Nothing in the game changes (`board/` untouched: no game version, no build number).

**What the Editor will notice**
- A **status board**: type "status" in any chat, or open https://productofdefiance.github.io/Flagfall/status/ on a phone. It shows what's on `main`, results from the last day, open flags (`!` = waiting on you or the chat), every brief (building, ready to start, waiting on what, merged) and the open design chats. GitHub keeps it current, hourly and on every pull request change.
- Briefs now say only the **size** of the version bump (X, YY or ZZ). Code takes the actual number just before marking its pull request Ready, so two builds can't expect the same number.
- New flags go in a file per brief, named **F021-1, F021-2, …**, so two builds can't take the same flag name.
- Two pull request labels: `review: merge` and `review: hold`, shown on the board.

**Under the hood**
- `sims/status/board.js` (builds the board), `sims/status/test_board.js` (run in `checks`), workflow `status-board.yml`, branch `status` (the board and `chats/`). `play-links` now leaves `status/` alone on gh-pages.
- `CLAUDE.md`: `status`, `sync`, `handoff`, flags and version rules rewritten. `briefs/TEMPLATE.md`: size-only Game version, new `Waits on` row.
- Flags opened: F021-1 (ASK), F021-2, F021-3. None closed.

## v3.11.00 · Build 15 — Brief 019, Brain 7: know the lead, keep it, storm together (20 Nov 2026)
Rule set: none changed (v3.7 stays the newest). Game version **v3.11.00** (YY: a new brain; brief 011 took v3.10.00 and Build 14 first). Brain 7 was built and measured on v3.6; it inherits Brain 5's specials play on v3.7, which these runs didn't measure. Brain 5 stays the default.

**What a player will notice**
- A new opponent, **Brain 7 (keeps its lead)**, on the Opponent and Teams screens. When it is ahead on units it stops throwing units away one at a time, gathers its spare units near your holder and attacks it with two or three at once. When you have only your holder left, its own holder may come forward too, but only if yours can't reach its flag first. When it is behind, it pulls its units together while there is time, then commits everything late.
- On the Opponent screen, Brain 7 has a **Lead** table: five behaviours switched on with 1 and off with 0, and the numbers they use. With all five off it plays exactly like Brain 5.
- Watch links can now carry a brain's changed settings, so games from a lab sweep open and play on the board.
- Brain 5, Brain 6 and every older brain and rule set play exactly as before.

**Under the hood**
- `bot.js`: Brain 7 is Brain 5's planner plus a reading of the board made once per plan (start of the turn and after each roll): the lead (units other than the holder, by unit cap and HP left), ahead or behind, storm or hold, whether to wait before striking the holder, whether to regroup, and the holder race check. It adds value terms and two attack costs; no "on turn N" rules and nothing carried between turns. One setting the brief didn't name, **Press the holder**, was needed: without it Brain 7 gathered round a braced holder and then waited (F43).
- `brain.js`: Brain 7 and its labels. `watch.js`: `n=brain7:stormLead=1` style brain settings in watch links. `app.js`: the Lead table.
- Lab: three new measures on every run (`lead_lost`, `lead_unused`, units lost alone or together and holder strikes solo or group), positions scored per side-turn in `timing`, a `brain7` measure (how often each behaviour was active, and lone losing attacks for any brain), `seed_as` in job orders so many matchups share one deal. `sims/lab/report019.js` builds the Report's tables.
- New checks: `test_brain7.js` (all off = Brain 5, the five positions, legal play) and `sims/lab/test_lead.js` (the new measures on five saved games, checked by hand).

**Flags opened:** F43 to F48 (renumbered: brief 011 took F38 to F41 and the man-advantage flag F42). **Evidence for:** F10.

**Results (34,000 games):** Brain 7 does not pass. It loses to Brain 5 at balanced 5v5 (45.6%) and all-Light 7v7 (45.6%), ties at 7v7, and leaves leads unused about as often at 5v5 (24.0% vs 26.9%), but mirror games end on the clock far less (26.6% vs 57.9% at 5v5, 17.6% vs 40.4% at 7v7), almost all from the holder joining the storm. Settings review (52,000 games): only the lead weight moves results; at 0 Brain 7 takes 52.1% of balanced 5v5 games against Brain 5.

## v3.10.00 · Build 14 — Brief 011, rule set v3.7: special attacks (20 Nov 2026)
Rule set: **v3.7** (new, the new-game default): v3.6 plus switch `specials`. Default brain: Brain 5, now using specials on v3.7 only. Game version **v3.10.00** (YY: a new rule set).

**What a player will notice**
- Every foot unit has one special attack a match, on its own button after Attack: **Arc Hit** (Heavy Melee), **Pick Off** (Light Melee), **Bullseye** (Heavy Ranged), **Arrow Storm** (Light Ranged), **Skewer** (Heavy Anti-Cavalry), **Javelin** (Light Anti-Cavalry).
- Tap it to **warm up** (1 Stamina, then no attack, pull or brace that turn; moving and swapping are fine). Next turn the button turns gold: tap it, pick a red ring and **Fire**. If you don't fire that turn it goes back to unused.
- A warming unit has a **gold ring with a soft glow** on the field, yours and the bot's.
- The special's preview shows **one exact number** (no dice), the extra targets underneath (Arc Hit, Skewer), and Arc Hit outlines its 3-hex arc.
- The unit card has a **Special** section with its status (Unused, Warming up, Used). The log reads "HM warms up Arc Hit at E9." and "HM fires Arc Hit: …".
- No special can hit a flag hex or its holder. Older rule sets play exactly as before.

**Under the hood**
- `engine.js`: `warmup` and `special` actions, the special's state on each unit (only under the switch), exact previews in `options().special`, reasons in `blockReasons().special`. All sizes in `data.js` (`specials` block, `game.warmupCost`).
- `bot.js` / `brain.js`: Brain 5 (and Brain 6) warm up when a target will likely be in reach next turn, fire when it beats the other choices, and fear the enemy's warmed-up specials. New settings: Use specials, Warmed special's worth, Warm-up reach slack, Warm-up cost, Special margin, Warm-up moves tried. Read on v3.7 only: brain hashes on every older rule set match `main`.
- Lab: a `specials` measure (uptake, lapses, kills, damage vs the normal hit, hits on braced units, actions where both sides could win), and job orders may now change rule numbers for a sim-only copy (`"set"`).
- New check `test_v37.js` (180 checks); `test_invariants.js` now plays Brain 5 games too, so specials are in play.

**Flags closed:** none (F20 gets its new double-knockout check, stays closed). **Opened:** F38 (Skewer's second hit: full hit or Reach −1?), F39 (move order decides balanced 5v5 under specials), F40 (Skewer almost never fires).

**Baseline** (Brain 5 mirror, balanced, 1,000 games per format, same seeds as v3.6; full table in brief 011's Report):
- 5v5: ended on the turn limit 34.3% (v3.6: 56.7%), pull KO 41.3% (26.3%), first mover's share of decisive games **5.3%** (38.6%): see F39.
- 7v7: ended on the turn limit 41.7% (44.8%), pull KO 41.6% (38.3%), first mover's share 31.6% (46.9%).

## v3.09.01 · Build 13 — Brief 016, stall logging (lab only) (19 Nov 2026)
Rule set: none changed (v3.6 stays the newest). Game version **v3.09.01** (ZZ: lab tooling, nothing about how the game plays changes; brief 015 took v3.09.00 and Build 12 first).

**What a player will notice**
- Nothing on the board changes.
- Every lab run's summary now has three **Stalls** lines: when fighting starts and stops on average, how many quiet side-turns a turn-limit game ends with, and the share of turn-limit games whose last damage came 5 or more side-turns before the end (a starting cut for the stall study, not a definition).
- Lab results pull requests can't jam each other any more (F35). If one falls behind `main` with a conflict, the lab fixes it within the hour and it still merges itself.

**Under the hood**
- `sims/lab/measures.js`: a new `stall` measure collected on every run: first contact, first attack, last damage, quiet side-turns, braces in the last 5 turns, what each side has left at turn limit − 3 and at the end, and what decided a turn-limit game. `merge.js` writes `tables/stall.csv` (totals and averages) and the summary lines.
- `sims/lab/index.js`: `INDEX.md` and `index.csv` are rebuilt from the run folders (and `results/nightly.csv` for quiet nights) instead of edited, byte for byte the same as before. New workflow `results refresh` (hourly and on pushes to `main`) merges `main` into a stuck results pull request and rebuilds them.
- `sims/lab/record.js`: runs the Editor's copied match records (`data/human_records/`) through the same measures as lab games.
- New check `sims/lab/test_stall.js`; runs in `checks`. A "before" study (`stall-before`, 1,000 balanced games per format on v3.5, same seeds as v3.08.00's release) is the stall baseline for later builds.

**Flags closed:** F35. **Opened:** F36 (the summary's 5-side-turn stall cut catches every turn-limit game).

**The stall "before" (balanced Brain 5 mirrors, v3.5, 1,000 games per format):** in turn-limit games the last damage comes on turn 11.1 (5v5) and 12.7 (7v7), followed by 28 and 46 side-turns with no attack or pull; at turn limit − 3 each side has its holder and under one other unit. Full table in the brief's Report.
## v3.09.00 · Build 12 — Brief 015, rule set v3.6: the flag rulings (19 Nov 2026)
Rule set: **v3.6** (new, the new-game default) = v3.5 plus switches `flagBlocksLine`, `pullFullStrength`, `pullCountsForReload`, `spearOnArrival`. Game version **v3.09.00** (YY: a new rule set).

**What a player will notice**
- A flag hex (either side's, held or empty) blocks Volley and Reach when it sits straight between attacker and target. The button says "A flag blocks the line". A unit standing on a flag still shoots out from it, and a holder can still be shot from its goal zone.
- Ranged units pull at full Strength.
- A Heavy Ranged that pulls must reload next turn (it shows Reloading), and it can't pull while reloading.
- Set spear only hits a unit arriving next to it. Shifting along a spear you already touch is safe, and a unit takes set spear damage at most once a turn.
- v3.5 and every older rule set play exactly as before.

**Under the hood**
- `engine.js`: one line helper, `flagBetween`, for every line rule (later Javelin and Vault); spear arrival judged spear by spear, with a per-unit marker cleared each turn; pull Strength and pull Reload behind their switches.
- `bot.js`: under the v3.6 switches only, the brains' own estimates follow the new rules (a shot across a flag from where a unit stands is no threat, a reloading Heavy Ranged can't pull, Ranged pulls count at full Strength).
- `data.js`: preset v3.6. `app.js`: the four switches on the rule-set editor.
- New check `test_v36.js` (every rule above, each also as unchanged on v3.5, plus a double-knockout count on v3.6); runs in `checks`.
- Lab: a matchup can switch rules off for a sim-only copy (`switches_off`), and a new `flagrules` measure counts set spear hits, Ranged pulls and shots a flag blocks.

**Flags closed:** F8. **Opened:** F37 (a reading of 3.13: leaving a spear and coming back in one move is not arriving).

**Baseline (balanced, Brain 5 mirror, 1,000 games per format, same seeds on both rule sets)**

| | 5v5 v3.5 | 5v5 v3.6 | 7v7 v3.5 | 7v7 v3.6 |
|---|---|---|---|---|
| Holder KO | 3.6% | 3.7% | 4.3% | 4.4% |
| Pull KO | 26.7% | 26.3% | 38.3% | 38.3% |
| TKO | 13.3% | 13.3% | 12.6% | 12.5% |
| Tiebreak win | 54.1% | 54.4% | 41.1% | 41.1% |
| Draw | 2.3% | 2.3% | 3.7% | 3.7% |
| Ended on the turn limit | 56.4% | 56.7% | 44.8% | 44.8% |
| Games with a pull | 26.8% | 26.4% | 38.5% | 38.5% |
| Average turn | 19.20 | 19.23 | 22.84 | 22.84 |
| First mover's share of decisive | 38.5% | 38.6% | 46.7% | 46.9% |

Every gap is under 1 point: the four rules rarely come up in bot play (about 0.03 set spear hits, 0.01–0.02 Ranged pulls and 0.02–0.04 flag-blocked shots per game).

## v3.08.00 · Build 11 — Brief 010, rule set v3.5: a little variety in normal rolls (19 Nov 2026)
Rule set: **v3.5** (new, the new-game default) = v3.4 plus switch `diceVariety`. Game version **v3.08.00** (YY: a new rule set; brief 007 took v3.07.00 first).

**What a player will notice**
- New games start on rule set v3.5. Normal hits are no longer all the same: two dice totalling 4–5 deal 10% less, 9–10 deal 10% more, 6–8 as before. 2, 3, 11 and 12 are unchanged. The average hit is the same.
- The attack preview's outcome bar now shows up to 7 outcomes instead of 5 (it still merges outcomes that round to the same damage, so a small hit of 2 shows 5).
- Pulls use the same dice.
- v3.4 and every older rule set play exactly as before; saved v3.4 matches replay the same.

**Under the hood**
- `engine.js`: the v3.5 dice cases (7 instead of 5) and one multiplier function; both brains already average over the dice cases, so they play v3.5 with no brain change.
- `data.js`: preset v3.5. `app.js`: the "Dice variety" switch on the rule-set editor.
- New check `test_v35.js` (bands, chances, average, rounding, Dodge after the roll, pulls, the pooled flag, seeded bot games); runs in `checks`.
- Lab: the `play` measure also counts turns a brain ended on an error (`bot_errors`).

**Flags closed:** none. **Opened:** F33 (the first mover wins more decisive games on v3.5), F34 (±10% rounds away on hits of 1–2).

**Baseline (balanced, Brain 5 mirror, 1,000 games per format, same seeds on both rule sets)**

| | 5v5 v3.4 | 5v5 v3.5 | 7v7 v3.4 | 7v7 v3.5 |
|---|---|---|---|---|
| Holder KO | 4.8% | 4.2% | 3.2% | 4.3% |
| Pull KO | 28.1% | 27.5% | 40.0% | 40.8% |
| TKO | 14.5% | 12.1% | 13.6% | 11.6% |
| Tiebreak win | 51.1% | 54.6% | 39.8% | 38.3% |
| Draw | 1.5% | 1.6% | 3.4% | 5.0% |
| Ended on the turn limit | 52.6% | 56.2% | 43.2% | 43.3% |
| Games with a pull | 28.1% | 27.5% | 40.1% | 41.0% |
| Average turn | 18.78 | 19.13 | 22.47 | 22.54 |
| First mover's share of decisive | 30.0% | 37.7% | 42.6% | 52.4% |

All gaps except the first mover's share are under 8 points (noise, F23).

## v3.07.00 · Build 10 — Brief 007, Brain 6: Brain 5 tuned, the clock, Evade steps (19 Nov 2026)
Rule set: none changed (v3.4 stays the newest). New brain **Brain 6**; Brain 5 stays the default. Game version **v3.07.00** (YY: a new brain; brief 009 took v3.06.00 first).

**What a player will notice**
- A new opponent in the list, **Brain 6 (knows the clock)**: Brain 5 that values winning the tiebreak as the turn limit nears. On the last turns the side behind goes for the enemy holder when it can, and the side ahead stops throwing units away.
- Brain 5 is still the default: Brain 6 ties it (50.1% of 4,000 games) and didn't beat it in three of the four formats, the bar for becoming the default.
- Brain 6's new settings are on the Opponent screen: "Clock weight", "Turns of clock pressure", and "Keep an Evade step" (off by default, F31).
- The game version shows on Home and in saved matches with the build number ("v3.07.00 · Build 10"). Matches saved before Build 7 still show "Build 6".

**Under the hood**
- `bot.js`: Brain 6's clock term (the tiebreak's likely outcome, from each side's chance to change it from the goal zone on its remaining turns) and the "Keep an Evade step" cost; Brain 5 and every older brain play exactly as before.
- `version.js`: the game version beside the build, with the line and "started on" helpers; the version check also requires the game version to change.
- Weights tuned on the lab, in two stages: a screen of every setting at 0, half and double (33,600 games), then the promising ones at 1,000 games per format against Brain 5 and in mirrors (60,000 games). Results in `results/`.
- Lab fixes found while running it: a pull request's later push no longer replays its job orders; night checks on a pull request no longer start a lab run on `main`; big runs get a one-line answer.

**Flags closed:** F25 (clock), F28, F29. **Opened:** F31 (Keep an Evade step on or off), F32 (the side behind has nothing left to push with). **Updated:** F10, F11, F12, F22, F24.

**Stall re-check (balanced, Brain 6 mirrors vs Brain 5 mirrors, 1,000 games per format, same lab run)**

| | Brain 6 5v5 | Brain 5 5v5 | Brain 6 7v7 | Brain 5 7v7 |
|---|---|---|---|---|
| Holder KO | 4.2% | 3.4% | 3.1% | 4.4% |
| Pull KO | 28.0% | 29.1% | 43.5% | 39.6% |
| TKO | 12.2% | 12.3% | 14.0% | 13.9% |
| Tiebreak win | 55.3% | 53.0% | 38.0% | 39.2% |
| Draw | 0.3% | 2.2% | 1.4% | 2.9% |
| Ended on the turn limit | 55.6% | 55.2% | 39.4% | 42.1% |
| Games with a pull | 28.0% | 29.2% | 43.6% | 39.6% |
| Average turn | 19.16 | 19.08 | 21.62 | 22.29 |
| First mover's share of decisive games | 33% | 30% | 45% | 44% |

## v3.06.00 · Build 9 — Brief 009, UI v2: attack preview, unit card, top bar and Options menu (19 Nov 2026)
Rule set: none changed (v3.4 stays the newest). No brain changed. UI v1 → **v2**. Game version **v3.06.00** (YY: new screens).

**What a player will notice**
- **Attack preview.** Picking a target opens a new sheet: both units face off (North always on the left), with only the numbers this attack changes (Strength, Support, Evade; Armor, Brace, Dodge, Parry). A number that changes shows the old one struck through, then the new one, red when it hurts you (a Heavy Ranged next to an enemy: 9 → 4.5). Below, the outcome bar: one slot per dice outcome with its chance and damage, kills in red, equal neighbours merged.
- **The key.** Pull the grab handle up (or tap it) for "In this attack": one line per thing in play, what it means and why it applies here (Support names the helpers, Evade says how far, Parry says what you take). Hidden by default; the first two previews say "Pull up for the key".
- **Attack and Cancel** take over the action panel while the preview is open; Attack shows the Stamina it spends.
- **Top bar.** "FLAGFALL: Arena" with an Options button; the scoreboard shows Player or Computer icons by the side names and the turn counter on its own.
- **Options menu** replaces the old match menu: format, sides, rule set, bot, seed and version at the top; Match log and record, Rules and unit data, Home, and Surrender (in red, only on a human side's live turn). Close with ✕, the dim, or Escape.
- **Unit card.** The ⓘ on the unit bar opens a full card: status chips (Reloading, Braced, Braced last turn, Holding the flag), Str / Range (or Reach) / Move, and the unit's abilities under Trait, Class and Unit, worded for the rule set in play. The swap buttons are gone from the card (dragging onto a friend still swaps).
- **Lineup.** Tap a unit's token or name for the same card, with HP, Str, Range/Reach, Move and Stamina, and a pinned "In your lineup" bar with a live stepper.
- **Action buttons.** Attack while reloading shows a red dot; Brace shows blue when braced and a blue ring the turn after; the Reach button only appears for Anti-Cavalry units.
- **Desktop.** The preview and the unit card sit in the right-hand column instead of over the field.
- Units are counted in **unit cap (UC)** everywhere; a new check fails if the board could show the old word.

**Under the hood**
- New `board/ui.js`: the preview's and the card's wording and logic, with no drawing, so it can be tested in Node.
- `engine.js`: read-only fields for the preview only (the attack's steps as numbers: Strength before and after Half Strength, Support and helpers, Armor and Pierce, Dodge; Stamina left in the Evade preview; "braced last turn" and "holding the flag" in a unit's status). No rule changed; every rule set and brain hashes the same as before (Report).
- New check `tests/test_ui.js` (in the `checks` workflow).

**Flags closed:** none. **Opened:** F30.

## v3.05.02 · Build 8 — Brief 008, the lab: heavy runs on GitHub, organised results, watch any game by seed (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). No brain changed. Game version **v3.05.02** (ZZ: nothing about how the game plays changes; brief 013 took v3.05.01 first).

**What a player will notice**
- A link can open any simulated game on the board, set up and playing: `…/Flagfall/?watch=<seed>&rules=…&n=…&s=…`. Every simulated game now has one. If the board doesn't have that game's brain or rule set, it says so instead of playing a different game; if the version differs, it warns first.
- A watched game never replaces your own match in progress, and isn't saved to the Matches list.
- Matches you set up yourself with a seed play exactly as before.

**Under the hood**
- `board/watch.js`: how the board sets up and plays a Computer vs Computer match from its seed (lineups, coin toss, deployment, the bot's steps), shared by the board and the simulators. The board's lineups moved there unchanged (checked against the old ones for every rule set, format, mix and three brains).
- The lab: `.github/workflows/lab.yml` plays job orders from `studies/queue/` on up to 20 GitHub machines (every night after the night checks, on demand, or in a pull request), and `sims/lab/` writes one run folder per order in `results/` (`SUMMARY.md`, `run.json`, `games.csv` with a replay link per game, `tables/`) plus `results/INDEX.md` and `results/index.csv`. Results reach `main` through a pull request that may only change `results/` and `studies/` and merges itself once the checks pass.
- Release runs: a pull request that changes the game version gets the baseline table at 1,000 games per format (default brain mirror, newest rule set), every check and the regression hashes, posted as a comment, and filed after the merge.
- The night checks file their result in `results/` too ("no change, passed" when `main` hasn't changed).
- Tidy: simulators moved from `board/tests/` and `data/sim_study10/` to `sims/`; the old studies moved from `data/sim_study6–10` to `results/pre-v3.05.00/` (with `git mv`; its README maps old paths to new).
- New checks: `test_watch.js`, `sims/lab/self_test.js`, and `sims/lab/board_check.js` (10 simulated games and the same games on the board play identical moves; its own job in `checks`).

**Flags closed:** none. **Opened:** F28 (results reaching `main` need two repository settings), F29 (starting a lab run from a Claude session).

## v3.05.01 · Build 7 — Brief 013, Stamina per unit, with stacking modifiers (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). Nothing plays differently: the engine is reshaped so Cavalry (Stamina 4) and Pursued can be built.

**What a player will notice**
- Nothing in play. A braced unit still starts its next turn on 2, a braced Light Ranged on 3, and the unit info shows the same.
- Home shows the game version beside the build number ("v3.05.01 · Build 7").
- Rules screen, v3.4: "Stamina after bracing 2" is now **"Brace tiredness 1"** (Stamina bracing costs next turn). New row: **"Lowest starting Stamina 1"**. Older rule sets keep "Stamina after bracing".

**Under the hood**
- Each unit card may carry its own Stamina; cards without one use the rule set's (all current cards: 3).
- Next-turn Stamina is the card's base plus a list of modifiers, each with a source (the unit itself or an enemy) and an effect. Different effects stack, the same effect counts once per turn, and no unit starts below the floor (`staminaFloor`, 1). Today's modifiers: brace tiredness (−1) and Second Wind (cancels the unit's own brace tiredness only).
- The turn start, the unit info, the Stamina pips and the brains all read one engine function (`nextStamina`).
- New test `test_stamina.js` (in the `checks` workflow): Brace, Second Wind, base Stamina per card, stacking, the floor, set spear, tackle at hex cost, refused attacks and braces, moves always paid in full, and the floor check on every card of every preset.
- `regress_engine.js … all`: hashes every preset (the newest too) against every brain.

**Flags closed:** none. **Opened:** F27.

## Build 6 — Brief 006, Brain 5: a bot that plans its turn (18 Nov 2026)
Rule set: none changed (v3.4 stays the newest). New opponent **Brain 5**, now the default.

**What a player will notice**
- The default opponent is Brain 5. It plans its whole turn before it moves, never walks a unit up for an attack it can't pay for, and braces only when enemies can actually reach it.
- Its Light units step away after a hit when that's safer (about 8 or 9 times out of 10 when a safer hex exists), and stand with more open hexes around them (Dodge when attacked about 15–17%, up from 8–12%).
- Brain 5 vs Brain 5 games rarely end in a draw (2–5%), and flag pulls are now the usual way to win. About half still go to the turn limit, but the tiebreak decides almost all of them.
- On the setup screen the opponent picker is labelled "Brain" (it said "Kit"). Saved matches against Kit A–D still load, and those brains play exactly as before.
- The Opponent screen shows Brain 5's settings in plain words (how much it fears damage, values next turn's Stamina, the flag, and so on).

**Under the hood**
- `bot.js`: Brain 5's planner (`planTurn5`) and its one score (`value5`: what it gains, what the enemy can realistically do back next turn, and how it's placed for next turn). It plans again after every roll.
- `brain.js`: Brain 5 and its 11 settings. `app.js`: the default opponent and the Opponent screen.
- `tests/baseline.js`: an all-Light lineup and the diagnosis counters. New test `test_brain5.js`: three positions plus legal play.
- Study data in `data/sim_study10/`.

**Flags closed:** none. **Updated:** F10, F11, F12, F22. **Opened:** F24, F25, F26.

**Stall re-check (balanced lineups, v3.4; Kit D 400 games per format, Brain 5 1,000)**

| | Kit D 7v7 | Brain 5 7v7 | Kit D 5v5 | Brain 5 5v5 |
|---|---|---|---|---|
| Holder KO | 53.5% | 2.8% | 23.8% | 4.9% |
| Pull KO | 0.2% | 38.9% | 0% | 25.2% |
| TKO | 7.2% | 13.3% | 1.2% | 14.6% |
| Tiebreak win | 36.5% | 40.4% | 13.2% | 52.9% |
| Draw | 2.5% | 4.6% | 61.8% | 2.4% |
| Ended on the turn limit | 39.0% | 45.0% | 75.0% | 55.3% |
| Games with a pull | 0.2% | 39.0% | 0% | 25.2% |
| Average turn | 22.4 | 22.9 | 22.5 | 19.1 |

## Build 5 — Brief 005, the bot cracks the fort; 7v7 gets 35 turns (18 Nov 2026)
Rule set: **v3.4** (new; the new-game default): v3.3 with 35 turns at 7v7 (25 at 5v5). New opponent **Kit D**, now the default.

**What a player will notice**
- The default opponent is Kit D. It plans its whole turn: it gangs up on one of your units it can remove, cracks a held flag with two attackers (the least valuable one takes the parry), and goes for your flag when you're down to your holder.
- 7v7 games last up to 35 turns. The Settings screen shows the limit for the chosen format, and the top bar counts to it.
- The Evade preview never promises a step that won't exist. If tackle or anything else stops it, it says why.
- A greyed-out button explains itself when tapped (for example "Needs 1 Command, 0.5 left").
- Units are counted in unit cap (UC) on screen; the word "beings" is gone.

**Under the hood**
- Kit D's turn planner (`bot.js` planAction), with four switches. "Pick off the weak" is off because it made Kit D worse in testing.
- Engine: per-format turn limit (switch `turnLimitByFormat`), and plain-language reasons for blocked moves and actions (`whyNoMove`, `blockReasons`, an exact Evade preview).
- New tests: `test_v34.js`, `test_reasons.js`, `test_kitd.js`.

**Flags closed:** none. **Updated:** F10, F11, F12 (the stalls are not the bot's fault alone, and the longer clock didn't help). **Opened:** F23 (sampling noise).

**Baseline (balanced lineups, 400 games each)**

| | v3.2 Kit B 7v7 | v3.3 Kit D 7v7 | v3.4 Kit D 7v7 | v3.2 Kit B 5v5 | v3.3 Kit D 5v5 | v3.4 Kit D 5v5 |
|---|---|---|---|---|---|---|
| Holder KO | 61.0% | 55.0% | 53.5% | 24.0% | 31.2% | 23.8% |
| Pull KO | 0.5% | 1.0% | 0.2% | 0% | 0% | 0% |
| TKO | 0% | 7.5% | 7.2% | 0% | 1.2% | 1.2% |
| Tiebreak win | 27.2% | 32.8% | 36.5% | 8.0% | 14.2% | 13.2% |
| Draw | 11.2% | 3.8% | 2.5% | 68.0% | 53.2% | 61.8% |
| Ended on the turn limit | 38.5% | 36.5% | 39.0% | 76.0% | 67.5% | 75.0% |
| Games with a pull | 1.0% | 1.5% | 0.2% | 0.2% | 0% | 0% |
| Average turn | 19.3 | 17.5 | 22.4 | 22.9 | 21.7 | 22.5 |

## Build 4 — Brief 004, v3.3: Evade and tackle at hex cost (18 Nov 2026)
Rule set: **v3.3** (new; the new-game default).

**What a player will notice**
- After a Light unit hits an adjacent enemy without killing it, it can keep moving, but only away from that enemy, with whatever movement, Stamina and Command it has left. The attack preview says "Evade after: up to N hexes".
- After a kill, or after a Reach attack or a shot from range, there's no Evade. Heavy units never evade.
- Breaking contact with an enemy Melee unit costs the leaving unit its own hex cost (Light 0.5, Heavy 1) and one hex of its movement.
- Picking another unit, or End unit, gives up a pending Evade.

**Under the hood**
- Three switches (`evade`, `tackleHexCost`, `tackleUsesCap`) and an `evade` flag on the three Light cards.
- The bot decides an Evade before moving other units. New `test_v33.js` (58 checks).

**Flags closed:** F21 (ruled: the display stays). **Opened:** F22 (Evade doesn't reduce Light losses in bot games).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.2 7v7 | v3.3 7v7 | v3.2 5v5 | v3.3 5v5 |
|---|---|---|---|---|
| Holder KO | 61.0% | 59.5% | 24.0% | 27.5% |
| Pull KO | 0.5% | 0.5% | 0% | 0% |
| TKO | 0% | 0% | 0% | 0% |
| Tiebreak win | 27.2% | 30.5% | 8.0% | 6.5% |
| Draw | 11.2% | 9.5% | 68.0% | 66.0% |
| Ended on the turn limit | 38.5% | 40.0% | 76.0% | 72.5% |
| Pulls | 6 | 4 | 1 | 0 |
| Light units removed per game | 3.76 | 3.85 | 0.67 | 0.68 |

All differences are within chance at this sample size.

## Build 3 — Brief 003, version line and play links (18 Nov 2026)
Rule set: none changed (v3.2 stays the newest).

**What a player will notice**
- Home says which build and rules you're on: "Playtest board · Build 3 · Rules v3.2". A preview copy of a pull request also says "Preview of PR #N".
- The in-match menu shows the build after the rule set. If a match was started on an earlier build, it says so ("Build 4 (started on Build 3)").
- Every new match remembers the build it was started on. The Matches screen shows it under the rule set. Matches saved before Build 3 show none.
- Each finished match has a Copy button that copies its record for Claude. It works for matches finished from Build 3 on; older matches saved only on this device kept no moves, so there's nothing to copy, and the button says so.
- Every pull request gets a "Play this build" link, and `main` is playable at https://productofdefiance.github.io/Flagfall/ once GitHub Pages is switched on.

**Under the hood**
- `board/version.js` is the only place the build number is kept. `checks` fails a pull request that changes `board/` without raising it.
- `checks` is split into parallel quick jobs (a few minutes). The full 400 + 400 double-knockout count moved to a nightly run (`night-checks`), which can also be started by hand or by the `full checks` label on a pull request. A failing night run opens a "Night checks failed" issue.
- New `play-links` workflow publishes `main` and every open pull request to the `gh-pages` branch.

**Flags closed:** none. **Opened:** F21 (a holder on its last half point shows HP 0).

## Build 2 — Brief 002, v3.2: order of operations (17 Nov 2026)

**What a player will notice**
- New games start on rule set **v3.2**. Older rule sets are still in the list and play exactly as before.
- A braced Heavy Melee that dies to a hit no longer strikes back (no parry).
- A braced Heavy Melee parries only the first adjacent attack against it each enemy turn. Ranged shots and Reach attacks never use the parry up. The attack preview says when a parry is already used, and when it only happens if the target survives.
- If one action ever finishes both sides, the match goes to the turn-limit tiebreaks (more pull damage, then fewer beings lost, then a draw) instead of to the side that acted. In 800 bot games this never happened.

**Under the hood**
- Three new rule switches: `parryNeedsSurvivor`, `parryFirstOnly`, `doubleKoToTiebreak`.
- New tests: `test_v32.js` (the new rules, the rules they touch, and an 800-game double-knockout count) and `test_invariants.js` (impossible-state check on the newest rule set). Both run on every pull request.
- The replay regression hashes now cover v3.1. They leave out only the newest rule set.

**Flags closed:** F3, F4, F5, F17, F18, F19 (raised and answered during this build), F20 (accepted as built).

**Baseline (Kit B vs Kit B, balanced lineups, 400 games each)**

| | v3.1 7v7 | v3.2 7v7 | v3.1 5v5 | v3.2 5v5 |
|---|---|---|---|---|
| Holder KO | 61.8% | 61.0% | 24.8% | 24.0% |
| Pull KO | 0.2% | 0.5% | 0% | 0% |
| TKO | 0.2% | 0% | 0% | 0% |
| Tiebreak win | 28.8% | 27.2% | 7.5% | 8.0% |
| Draw | 9.0% | 11.2% | 67.8% | 68.0% |
| Ended on the turn limit | 37.8% | 38.5% | 75.2% | 76.0% |
| Pulls | 3 | 6 | 0 | 1 |
| Parries per game | 0.12 | 0.07 | 0.11 | 0.09 |

The differences other than parries are within chance at this sample size (likely, not isolated).

## Build 1 — Brief 001, automatic checks (17 Nov 2026)
Every pull request runs the board's checks automatically (the `checks` tick on GitHub); `main` only accepts changes through a pull request with `checks` passing. Closed F9.
