# Brief 023: Status page redesign, Needs sync, and a Refresh that rebuilds

| | |
|---|---|
| Game version | **none** (tooling only: `board/` is untouched) |
| Lane | Lab |
| Rule set | none (tooling) |
| Date | 20 Nov 2026 |
| Goal | Make the status page readable at a glance on a phone (the Editor's approved design), stop the board calling a build ready when it can't merge, and let the Editor's Refresh button rebuild the board on demand. |
| Branch | Any branch your session may push to, started from `brief/023-status-page` |
| Flags | F021-2 (the status page gets its own retrying publish) |
| Waits on | none |
| Order | **Can start now**, beside any other build: it changes no rule, brain, screen or lab measure. Pull request title: `Docs · 023 Status page`. |

## Context
Brief 021 shipped the status board. The Editor opened the page on 20 Nov and found it hard to read: plain lines, no indicators, results as cut-off sentences. He approved a redesign the same day (design canvas kept by the design chat; you never need to open it). The review of 021 also found the board showed brief 014 as "Ready · checks pass" while it conflicted with `main` and could not merge.

The page is for the Editor. `BOARD.md` is for chats and must stay small plain text.

## Scope
In: the page's look and layout; richer data in `board.json` to draw it; a "needs sync" state on the page and in `BOARD.md`; shorter results lines in `BOARD.md`; the Refresh button; the status page's own publish (F021-2).
Out: anything in `board/`; the chat log format; flag files and names; a priority list, a stall chart, event reminders and the other extras parked in the Ideas Log.

## What to build

### 1. The design: copy the mock
`briefs/img/023-status-page-mock.html` is the approved design as a working page, filled with the real board of 20 Nov, 11:57 am ET. Open it at 390 px and at 1280 px wide. **Match it**: every colour, size, font, spacing, icon and word. It is one fluid layout for both widths (no separate phone design). Keep it a single self-contained page with no build step and no script library; the two fonts load from Google Fonts as in the mock, with a system sans-serif fallback.

Top to bottom:
1. **Dark header:** "Flagfall status", the "Updated" time, and two buttons: **Play latest build** (a link to `https://productofdefiance.github.io/Flagfall/`) and **Refresh** (section 4).
2. **Four tiles:** On main (version; build, rule set and default brain under it) · Building (a **count**, the brief names under it, then one pill per state present, e.g. "1 to review", "2 running") · Nightly checks · Flags (the count of open flags with status `ASK` or `DECIDE`).
3. **Builds**, in three groups with a count each: Building, Waiting, Merged (last 3). One row per brief: the name at full width on the left, one item on the right.
   - Building: the state pill on the right (section 2). Under the name: the pull request line ("PR #36 · will be v3.12.00 · checks pass", or its bump size while it has no number), a "Your move:" line when there is one, and **Play this build** (the pull request's play link, `…/Flagfall/pr/<number>/`).
   - Waiting: an hourglass and "After 014, 017" on the right. No pill.
   - Merged: the version on the right ("No version" for tooling), the date under the name.
   - A group with nothing in it shows its heading with "· 0" and one muted line, "None".
4. **Results** (last 24 hours): the nightly checks pill and time, then a table: Run (version, kind under it) · 5v5 · 7v7 · Date. The two number columns are the share of games that ended on the turn limit, taken from the run's own summary (the mirror or first matchup per format), never worked out from text by guessing. A run with no such number shows a short line across both columns (its games and matchups). Newest first, at most 8, then the line pointing to `results/INDEX.md`.
5. **Flags:** a table: Flag (name, date under it) · Status (pill, the status word under it) · Issue. The issue shows up to **two lines** of the flag's own text (clamped, no ellipsis added by hand), so `board.json` carries about the first 300 characters of each issue. Newest first, at most 8, then a line counting the rest.
6. **Chats:** open chats then the last 5 closed, as rows like Builds (name left, opened or closed date right, `stale?` as a Heads up pill). Empty: the two lines in the mock.
7. **Key:** the marks and what they mean, as in the mock.

### 2. The marks (never colour alone: each has an icon and a word)
| Mark | Icon, pill colour | Used for |
|---|---|---|
| Review | clipboard, dark pill with light text | A build pull request that is not Draft, checks pass, not reviewed yet. "Your move: type "review" in a design chat" |
| Ready to merge | tick, green | Labelled `review: merge`. "Your move: do the hands-on check, then merge" |
| Needs sync | two circling arrows, light purple | The pull request conflicts with `main`, or is behind `main` (section 3). It **replaces** Review and Ready to merge on that row. "Your move: type "sync" in its Code chat" |
| Heads up | hazard triangle, amber | A medium issue: labelled `review: hold` ("On hold"), a chat that reads `stale?`, a flag with status `OPEN` |
| Broken | cross in a circle (red icon), pale red | Checks failed on a build; the nightly checks failed |
| Running | hourglass, grey | Draft ("Building"), checks still running, a flag with status `TEST` ("Being tested"), a brief waiting on another |
| Needs an answer / Needs a decision | question mark, pale blue | A flag with status `ASK` / `DECIDE` |
| Passing | tick, green | Checks pass (nightly) |
| Merged | merge mark, outline | Merged briefs |

Order when several apply to one build: Broken, then Needs sync, then Heads up (on hold), then Ready to merge, then Review, then Running.

### 3. Needs sync (page and `BOARD.md`)
- A build pull request is **Needs sync** when GitHub reports it can't be merged cleanly (conflicts), or when it is behind `main` by one or more commits that touch anything outside `results/` and `studies/` (lab results merging to `main` all day must not flag every build).
- `BOARD.md` shows it in place of "Ready": `014 Fields · PR #36 · needs sync · checks pass · not reviewed`.
- GitHub works out mergeability lazily: if it answers "unknown", ask once more after a short wait; if still unknown, show the build's other state and add nothing.

### 4. Refresh
- **With a key saved in this browser:** tapping Refresh starts the `status board` workflow on `main` (a `workflow_dispatch` call to GitHub's API from the page), shows "Rebuilding…" on the button, then checks every 10 seconds for a newer board (up to 3 minutes) and redraws when it arrives. If it doesn't arrive, say "Still building. Try again in a minute." The hourly run and every other trigger are untouched.
- **Without a key:** Refresh re-reads the published board and redraws. Under the buttons, one small link: "Set up one-tap rebuild".
- **Set-up panel** (opens from that link, and from a small "Refresh settings" link once a key is saved): three numbered steps in plain words to make a fine-grained token on GitHub limited to this repository with only "Actions: read and write"; a box to paste it; Save and Remove buttons. The key is kept in the browser's local storage only. Say on the panel: it stays on this device, it expires when GitHub says so, and it can only start jobs that already exist in the repository.
- **Never** put a key, or any way to recover one, in the repository, the page's source, `board.json` or a log. A wrong or expired key: say so on the button's line and fall back to re-reading.
- The page also re-reads the board by itself every 5 minutes while it is open and visible.
- To see a rebuild sooner than Pages republishes, the page may read `board.json` from the `status` branch (raw file) after a rebuild; either way it must never show an older board than the one on screen.

### 5. `board.json` and `BOARD.md`
- `board.json` gains the structured facts the page needs (per build: brief, name, pull request, state, checks, review label, sync state, version or bump, play link, waits-on; per result: kind, version, date, the two shares or the fallback line; per flag: name, status, date, issue text; chats; the tile numbers). Keep the existing `board` text field. Add, never rename.
- `BOARD.md` keeps its sections and stays under 4 KB. Two changes only: the needs-sync wording (section 3) and results lines in the short form `release v3.11.00 · 5v5 36.7% · 7v7 41.4% on the turn limit · 20 Nov` (the fallback line for runs without the numbers).

### 6. Its own publish (F021-2)
The status page stops sharing the `play-links` concurrency group. It publishes with its own group and a push that retries on rejection (fetch, rebase its one folder, push again, up to 5 times), so it can never drop or overwrite a play-link update. `play-links.yml` keeps its `--exclude 'status/'` and is otherwise untouched.

## Rules it touches
None.

## Bot minimum
n/a

## Must not change
Everything in `board/`, `sims/lab/`, `results/`, `studies/`. `BOARD.md`'s section order and the chat log format. Every other workflow's behaviour. `main` never receives a generated commit.

## Checks before opening the pull request
- Every check in `README.md` passes (skip the simulations and say so).
- `sims/status/test_board.js` gains, on fixtures with no network: a conflicting pull request reads Needs sync; one behind `main` only by `results/` commits does not; the mark order in section 2; a `review: hold` label reads On hold; failed checks read Broken; results show the two shares when the run has them and the fallback when it doesn't; a flag's issue text is carried to about 300 characters; `BOARD.md` under 4 KB.
- A page test with no network (jsdom or plain string checks): no key in the page source or in `board.json`; Refresh without a key makes no API call to start a workflow; with a key it calls the dispatch endpoint once per tap.
- Screenshots at 390 × 844 (scrolled, top and bottom) and 1280 × 800, from the real board, in the Report; and one of a fixture with two builds building, one Needs sync, one Broken, so every mark is seen once.
- The live page after one real run: say what you saw (or that you couldn't reach it).

## The Editor's hands-on check
Open the status page on your phone: tiles, Builds, Results, Flags, Chats and the Key should read as in the design. Tap Play latest build. With the design chat's help, do "Set up one-tap rebuild" once on your phone and once on your computer, then tap Refresh and watch the "Updated" time change.

## Report back
The standard items, plus: where the 5v5 and 7v7 numbers come from and which runs fell back to a line; how "behind main" is counted; how long a tap on Refresh takes to show a new board; anything in the mock you couldn't match.

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
