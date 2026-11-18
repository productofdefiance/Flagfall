# Brief 003 — Version line on the board

| | |
|---|---|
| Rule set | none (no rule changes) |
| Date | 17 Nov 2026 |
| Goal | The Editor can always see which build and rule set he is playing, every saved match records its build, and every pull request comes with a link to play it. |
| Branch | `build/003-version-line` |
| Flags | none |

## Context
Today nothing on the board says which version of the code is running. When the Editor reports a problem, or a match is analysed later, there is no way to tie it to a build. The Process Lessons agreed a version line: the rule set plus a build number that goes up with every accepted change. This build adds it.

This brief branch already sits on top of Brief 002's build. **Start only after Brief 002 is merged**, then update this branch from `main` first. It also adds a play link to every pull request, so the Editor can try a build before merging it without the design chat publishing a copy by hand.

## Scope
In: a build number kept in one place, shown on three screens and stored with each match; a check that it went up; a play link for `main` and for every pull request. Out: any rule, bot or layout change beyond the lines below.

## What to build
1. **One source for the build number.** A new file `board/version.js` holding the build number and its date, loaded by `index.html` before `app.js`. Numbering: brief 001 was build 1, brief 002 build 2, so this build is **build 3**. The board's code must not invent or compute the number anywhere else.
2. **Home screen.** Replace the line under the title, "Playtest board", with: `Playtest board · Build 3 · Rules v3.2`. The rule set shown is the newest preset (the new-game default), named by its id. Same font, size and colour as the line it replaces.
3. **In-match menu** (the "Turn N" box). After the rule set name in its first line, add ` · Build 3`. The rule set shown there stays the match's own rule set, which can be older than the newest.
4. **Saved matches.** Every new match records the build number it was started on (for example `build: 3`). Show it in the match record on the Matches screen beside the rule set (`· Build 3`). A match saved before this build has no build number: show nothing for it, never a guess. Old matches must still load and replay.
4b. **Copy any finished match.** Today only the current match has "Copy match record for Claude"; finished matches in the Matches table can't be copied at all. Add a Copy button on each finished match's row (an icon button is fine on phone), copying the same record format as the current-match button.
5. **Every build raises the number.** Add a check to the `checks` workflow: on a pull request, the build number in `board/version.js` must be higher than on `main`. A pull request that changes nothing in `board/` may keep it the same. Add one line to `CLAUDE.md` under Process: every build that changes `board/` raises the build number by one in `board/version.js` and puts it in its `CHANGELOG.md` heading.
6. **CHANGELOG.md.** This build's entry is headed `Build 3`. Give the earlier entries their numbers too (Brief 001 = Build 1, Brief 002 = Build 2).

7. **Play links (free GitHub Pages).** A workflow publishes the board so it can be played in a browser:
   - `main` at `https://productofdefiance.github.io/Flagfall/` on every push to `main`;
   - each open pull request at `https://productofdefiance.github.io/Flagfall/pr/<number>/`, updated on every push to it and removed when it closes.
   Publish from a `gh-pages` branch the workflow maintains (only the `board/` files, not tests). The workflow appends `Play this build: <link>` as the last line of the pull request description, replacing any earlier one. Note in the board's Home line which build a preview is, so previews can't be mistaken for `main` (for example `Build 3 · Preview of PR #6`).
8. **Fast checks on every pull request, full checks at night.** Brief 002's double-knockout count made every pull request's checks take about 45 minutes. Split `checks` in two:
   - **Quick (every pull request and push, target under 10 minutes):** all the rule tests, the replay of Match 3, the regression hashes, `test_invariants.js`, the v3 red team run, and a short double-knockout count (40 games per format) so a broken rule still fails fast.
   - **Full (every night at about 3 AM New York time, plus a "Run workflow" button the Editor can press):** the full 400 + 400 double-knockout count and anything else slow. A failing night run opens a `FLAGS.md`-style note as a GitHub issue titled "Night checks failed", so it can't go unseen.
   Keep the `checks` name on the quick run, so the protection rule on `main` keeps working. A pull request that changes `board/engine.js`, `board/data.js`, `board/bot.js` or `board/brain.js` may also be given the label `full checks` to run the full set before merging. Put the button's location in the Report.
9. **One-time setting for the Editor.** After the workflow has run once, the Editor turns Pages on: Settings → Pages → Source: *Deploy from a branch* → `gh-pages` / root → Save. Put these exact clicks in the Report's to-dos.

## Rules it touches
None. Storing the build number with a match must not change what the engine replays.

## Bot minimum
n/a: nothing the bot can do changes.

## Must not change
Every preset plays and replays identically (`regress_engine.js` hashes unchanged for every rule set). The engine is untouched. Matches saved before this build still open and replay.

## Checks before opening the pull request
- Every check in `README.md`.
- Open a match saved by the current board (before this build) and confirm it loads, replays and shows no build number.
- The pull request's own play link opens and plays.
- Prove the new workflow check can fail: on a throwaway branch, change something in `board/` without raising the number and confirm `checks` goes red. Say in the Report that you did this.

## The Editor's hands-on check
Open the pull request's play link: Home shows `Build 3 · Rules v3.2` and that it's a preview. Start a match, open the menu: it shows `Build 3`. Finish or abandon it, open Matches: the record shows `Build 3`, and its Copy button works.

## Report back
The standard Report, plus screenshots (phone width) of the three places the build number now appears.

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
