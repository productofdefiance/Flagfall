# Brief 021: Status board, chat log, and numbers that can't clash

| | |
|---|---|
| Game version | **None.** Tooling and docs only: `board/` is untouched, so no version and no build number move. If you find you must touch `board/`, stop and raise an `ASK`. |
| Lane | Lab |
| Rule set | none (tooling) |
| Date | 20 Nov 2026 |
| Goal | One live status board the Editor can call up in any chat ("status") or open as a web page, kept current by GitHub and never by a chat; a log of which design chats are open; and flag names and versions that two builds can no longer claim at once. |
| Branch | Any branch your session may push to, started from `brief/021-status-board` |
| Flags | none to close |
| Waits on | none |
| Order | **Can start now**, beside any other build: it changes no rule, brain, screen or lab measure. Pull request title: `Docs · 021 Status board`. |

## Context
The Editor runs two design chats and two or three Code chats at once. His problem (20 Nov): not knowing for sure what is where and what needs him, which makes him the bottleneck. Build status is hand-kept in the Dev Handover (Build lanes), which Code can't read and which goes stale between chats. Separately, on 19 and 20 Nov briefs 011, 019 and a docs branch all numbered new flags from F38, and 011 and 019 both expected v3.10.00: "next free number" claimed at writing time clashes whenever two briefs are written the same day. The Editor's ruling: a clash is not his to check; the system must make it impossible.

The board is **for the Editor**. Chats may read its build status; they never leave notes for each other on it (briefs, Reports, flags and the design docs stay the channels).

## Scope
In: a generated status board (one small text file plus a web page); the workflow that rebuilds it; a per-chat log folder; per-brief flag files and names; the version rule change; `status` in `CLAUDE.md`; the brief template.
Out: play links and a priority list on the board, a stall chart, event reminders, "since you last looked", drift warnings (all parked in the Ideas Log). Anything in `board/`. The design docs (the design chat edits those).

## What to build

### 1. Where the board lives
- A branch named `status`, unprotected, holding only: `BOARD.md` (generated), `board.json` (the same facts, for the page), and `chats/` (section 5). Nothing on `main` is generated or rewritten by this build, so no pull request can ever conflict with it.
- The web page: the same board published to GitHub Pages at `https://productofdefiance.github.io/Flagfall/status/` (written into the `gh-pages` branch under `status/`, sharing the `play-links` concurrency group so two publishes never overwrite each other). A plain, light page, readable on a phone, no build step, no dependencies. It shows the same sections in the same order and its "Updated" time.
- `BOARD.md` must stay small (target under 4 KB): a chat reads it whole on every "status".

### 2. What rebuilds it
A workflow `status-board.yml` running one script (`sims/status/board.js`, Node 20, no packages, GitHub's API through `gh` or `fetch` with the workflow token):
- on pull request events: opened, reopened, synchronize, ready_for_review, converted_to_draft, labeled, unlabeled, closed;
- on push to `main`, to `brief/**` and to `status` (paths `chats/**` only, so its own commit doesn't loop);
- when the `checks`, `night-checks` and `lab` workflows finish (`workflow_run`);
- every hour, as a safety net (a results pull request merged by auto-merge starts no workflows; see `results-refresh.yml`);
- on demand (`workflow_dispatch`).
One run at a time (`concurrency`, never cancel in progress). If nothing changed, it commits nothing. A failed run must never leave a half-written board: write to a temp file, then replace.

### 3. The board's sections, in this order
Plain text, fixed shape, no tables wider than a phone. Empty sections say "none".

```
STATUS · updated 20 Nov 2026, 3:40 am ET

VERSION
  On main: v3.09.01 · Build 13 · Rules v3.6 · Brain 5
  Building: 011 → YY · 019 → YY

RESULTS (last 24 hours)
  Nightly checks: pass (20 Nov, 3:07 am ET)
  release v3.09.01 · 5v5 57.0% on the turn limit, 7v7 43.7% · 19 Nov
  ...

FLAGS (open, newest first)
  ! F019-2 · ASK · 20 Nov · one line
    F39 · TEST · 20 Nov · one line
  ...

BUILDS
  Building
    011 Special attacks · PR #31 · Draft · checks pass · reviewed: merge
  Ready to start
    none
  Waiting
    020 Victory values ← 011, 019
    014 Fields ← 011
  Merged (last 3)
    016 Stall logging · v3.09.01 · 19 Nov

CHATS
  Open
    FF Bot v3.09.01 - · design · Brain 7 review · opened 20 Nov
  Closed (last 5)
    FF Specials v3.09.00 · closed 19 Nov · one-line outcome
```

- **VERSION.** From `board/version.js` on `main` (game, build), the newest preset's rule set and the default brain. "Building" lists each open build pull request with the size of its bump (section 7); once it has taken its number, show the number.
- **RESULTS.** The last `night-checks` run (pass or fail, time). Then every run in `results/index.csv` on `main`, and in any open `lab/*` pull request, dated within the last 24 hours: kind, version, the index's own `answer` text cut to one line (about 110 characters), date. Newest first, at most 8, then "+N more in results/INDEX.md". Never invent a headline: use the index's words.
- **FLAGS.** Every row whose status is `OPEN`, `ASK`, `DECIDE` or `TEST`, from `FLAGS.md` and `flags/*.md` on `main` and from the same files in each open pull request (a row seen in several places counts once; the pull request's copy wins). Newest first by date, then by name. A leading `!` marks `ASK` and `DECIDE` (waiting on the Editor or the chat). One line each: name, status, date, the issue cut to about 90 characters. At most 12, then "+N older in FLAGS.md".
- **BUILDS.** A brief is: *Building* when it has an open pull request (show number, Draft or not, checks pass / fail / running, and the review label if any, section 6); *Merged* when its pull request merged (show version and date; last 3 only); *Ready to start* when its file exists on a `brief/NNN-*` branch, it has no pull request, and every brief in its `Waits on` line is merged; *Waiting* otherwise, with `← ` and the unmerged ones. Order: by brief number. A brief's pull request is found by its changed file `briefs/NNN-*.md` or a title containing the brief number.
- **CHATS.** Section 5. Code chats are not logged: a Code chat is a build, already under BUILDS.

Times are US Eastern, written like "20 Nov 2026, 3:40 am ET".

### 4. The `Waits on` line
- `briefs/TEMPLATE.md` gets a new header row above `Order`: `| Waits on | <"none", or brief numbers separated by commas: 011, 014> |`. It is the one machine-read home of what a brief waits on. `Order` stays as the human reason.
- The script reads it from each brief on its `brief/NNN-*` branch. A brief with no `Waits on` row is listed under Waiting as "← not stated", never guessed from the prose.
- The design chat adds the row to the briefs already pushed (012, 014, 017, 018, 020). Don't edit those branches.

### 5. The chat log
- Folder `chats/` on the `status` branch, one small file per design chat, written only by that chat: `chats/YYYY-MM-DD-HHMM-<slug>.md` with these lines:
  `name:` (the chat's name), `subject:` (a few words), `opened:` (date and time ET), `status: open` or `closed`, and when closed `closed:`, `final name:` and `outcome:` (one line).
- The script lists `status: open` files under Open (oldest first) and the 5 most recently closed under Closed. An open chat whose file hasn't changed in 3 days is shown with `stale?` after it. It never edits or deletes a chat file.
- Add `chats/README.md` on the `status` branch with that format and one rule: nothing personal, ever (this repository is public; the owner is "the Editor").
- Only chats opened after this merges are logged. No backfill.

### 6. The review label
The design chat's "review" sets one of two labels on the pull request: `review: merge` or `review: hold`. Create both labels. The board shows them as "reviewed: merge" / "reviewed: hold"; no label means "not reviewed".

### 7. Versions: no brief claims a number
Today a brief states the version it expects, so two briefs written the same day expect the same one. From this build on:
- A brief's header states only the **size** of the bump: X, YY or ZZ (or "none"). Update `briefs/TEMPLATE.md`'s Game version row to say so.
- Code sets the actual number in `board/version.js` and the changelog heading at its **last `sync` before marking the pull request Ready for review**: the next free number of that size after what is on `main` then. If `main` moves again before the merge, `version.js` conflicts and the pull request can't merge until the next `sync`; that is the guard, and it already exists.
- Pull request titles: while Draft, `NNN Lane · short name (YY)`; when marked Ready, `vX.YY.ZZ · NNN Lane · short name` as today.
- Rewrite the two places in `CLAUDE.md` that say a brief states its version ("Each brief states its game version in its header", "Version at merge"). The header comment in `board/version.js` says the same thing: leave `board/` alone, and note the stale comment in the Report for the next build that touches `board/`.
- Builds whose pull request is already open when this merges finish under the old rule.

### 8. Flags: each build numbers its own
Today every build adds rows to the one table in `FLAGS.md` and takes the next free F number, so two builds clash on the number and on the same lines of the file.
- New flags go in a file per brief, `flags/NNN.md`, with the same columns as `FLAGS.md`. Names are `FNNN-1`, `FNNN-2`, ... (brief number, then a counter that starts at 1 in each brief): two builds can't pick the same name or touch the same file.
- A design chat's docs pull request uses `flags/docs-<pull request number>.md` and names `FD<pull request number>-1`, ...
- `FLAGS.md` stays as it is, as the home of F1 to F40 (and any old-style number a build already open takes before this merges). Its header gains two lines saying where new flags go and how they are named. Rows there are still closed and updated in place.
- "Never reuse a number" still holds. A flag is closed in the file it was opened in.
- Update `CLAUDE.md` (the two channels, "Keep `FLAGS.md` current", the report shape's "Decisions needed") to match. Builds whose pull request is already open when this merges keep their old-style rows.

### 9. Commands in `CLAUDE.md`
Replace the `status` line and add nothing else:
- **status** (also answers to "build order"): print `BOARD.md` from the `status` branch exactly as it is (`git fetch --depth 1 origin status`, then show the file), with its "updated" time. Then two lines about your own build: what's done, what's running or left. Don't work the board out yourself and don't edit it. If the fetch fails, say so in one line and give only your own two lines.
- In **sync**: replace "take the next free game version" with the rule in section 7. In **handoff**: the new chat's name no longer carries a version for Code chats: `NNN Lane · short name`.

## Rules it touches
None. No game rule, preset, brain, screen or lab measure changes.

## Bot minimum
n/a: nothing the bot can do changes.

## Must not change
Everything in `board/`, `sims/lab/`, `results/` and `studies/`. Every existing workflow's behaviour (you may add the concurrency group share in section 1 and nothing else). `FLAGS.md`'s existing rows. `main` must never receive a generated commit from this build's workflow.

## Checks before opening the pull request
- Every check in `README.md` passes (the full simulations can be skipped: say so in the Report).
- A test for the script (`sims/status/test_board.js`, run in `checks`) on fixture data, no network: a brief with all its `Waits on` merged is Ready to start; one with an unmerged one is Waiting and names it; a missing `Waits on` row reads "not stated"; a Draft pull request is Building; flags sort newest first and `ASK` rows carry `!`; a flag present on `main` and in a pull request appears once; results older than 24 hours are left out; an open chat file untouched for 3 days reads `stale?`; `BOARD.md` for the fixture is under 4 KB.
- Run the script once against the real repository and paste the board it produced into the Report.
- The workflow's own commit to `status` does not start another run.

## The Editor's hands-on check
Open the status page on your phone and check it matches what you know is building. Type "status" in a Code chat and in a design chat: both show the same board.

## Report back
The standard items, plus: the board as generated; its size in bytes; how long one run takes; anything on the board you had to guess or leave out; whether `main`'s protection got in the way of anything; the stale comment in `board/version.js` (section 7).

---

## Report
*Filled in by Claude Code.*

- **What's in:** everything in §1–9. `sims/status/board.js` (builds the board: files through git, pull requests, checks and night checks through `gh api`), `sims/status/test_board.js` (run in `checks`), workflow `.github/workflows/status-board.yml`, the `status` branch (`BOARD.md`, `board.json`, `chats/README.md`, created by the workflow's first run), the page at `https://productofdefiance.github.io/Flagfall/status/`, the labels `review: merge` and `review: hold` (created), `flags/021.md`, `Waits on` and size-only Game version in `briefs/TEMPLATE.md`, `FLAGS.md` header, and `CLAUDE.md` (`status`, `sync`, `handoff`, the two channels, Keep the flags current, Decisions needed, Game version, Version at merge, PR titles, missing-settings line). Branch: `claude/funny-edison-sfjsee`, started from `main` with `brief/021-status-board` merged in (the brief branch was behind `main`).
- **Anything beyond the brief, and why:**
  - `play-links.yml`: one `--exclude 'status/'` in its rsync. Without it every push to `main` deleted the status page from gh-pages. No other change to play-links.
  - Flag clashes: when an open pull request *adds* an old-style number that `main` has since given to a different flag, both rows show, the pull request's marked `(PR #33)`. "The pull request's copy wins" would otherwise hide `main`'s F38–F40 behind PR #33's different F38–F40 (live today). Rows a pull request only carries from an older `main` are ignored, so a branch behind `main` can't bring back a flag `main` closed.
  - The workflow always runs `main`'s script (a pull request can't publish its own version), except before this merges: then it takes the script from this pull request, so it could be tried live. That path is dead once merged.
  - A closed pull request's brief is read from its title; for titles without one, from the brief file it added, cached in `board.json` so the API isn't asked twice.
  - If the board grows past 4 KB, the cut lines get shorter (tested).
- **Checks run and results (paste regression hashes):** `test_board.js` 37/37 pass. Lab `self_test.js` 34/0, `test_stall.js` 39/0, `test_version.js` 22/0. Workflow YAML parses. Skipped: the rule tests, simulations and `regress_engine.js`. `board/` is untouched, and the `checks` workflow's compare job reports the hashes on this pull request anyway.
  - **Live run on this pull request:** `status board` passed (rebuild 23 s, publish 5 s). It created `status` with `BOARD.md`, `board.json` and `chats/README.md`, wrote `status/index.html` and `status/board.json` to gh-pages and created both labels. Its own commit to `status` started no further run (two runs in the history: the failed first try and the passing one). The first try failed because `main` doesn't have the script yet, which is why the pre-merge path exists.
  - **One local run:** 6.2 s, mostly git fetch. On GitHub about 23 s with checkout.
- **The board as generated (3,430 bytes, 20 Nov 9:46 am ET):**
```
STATUS · updated 20 Nov 2026, 9:46 am ET

VERSION
  On main: v3.10.00 · Build 14 · Rules v3.7 · Brain 5
  Building: 019 → YY · 021 → none

RESULTS (last 24 hours)
  Nightly checks: pass (19 Nov, 12:17 pm ET)
  screen v3.10.00 · balanced-5v5: mirror, 34.8% ended on the turn limit, A/B 209–187; balanced-7v7: mirror, 38.8% ended on the… · 20 Nov
  study v3.08.01 · 5v5: mirror, 58.0% ended on the turn limit, A/B 514–461; 7v7: mirror, 40.7% ended on the turn limit, A/B… · 19 Nov
  study v3.10.00 · 5v5: brain5:warmSlack=0 took 48.2% of games against brain5 (decisive 311–293, tiebreak 164–218, draws 14)… · 19 Nov
  study v3.10.00 · 5v5: mirror, 34.3% ended on the turn limit, A/B 491–504; 7v7: mirror, 41.7% ended on the turn limit, A/B… · 19 Nov
  study v3.10.00 · 5v5: mirror, 17.8% ended on the turn limit, A/B 497–494; 7v7: mirror, 45.6% ended on the turn limit, A/B… · 19 Nov
  study v3.10.00 · 5v5: mirror, 55.2% ended on the turn limit, A/B 506–489; 7v7: mirror, 45.0% ended on the turn limit, A/B… · 19 Nov
  study v3.10.00 · 5v5: mirror, 60.2% ended on the turn limit, A/B 464–510; 7v7: mirror, 41.4% ended on the turn limit, A/B… · 19 Nov
  study v3.09.00 · 5v5: mirror, 56.7% ended on the turn limit, A/B 474–503; 7v7: mirror, 44.8% ended on the turn limit, A/B… · 19 Nov
  +20 more in results/INDEX.md

FLAGS (open, newest first)
  ! F43 · DECIDE · 20 Nov · Brief 019: Brain 7 fails the success bar (beats Brain 5: no; uses its leads: no; doesn't…
  ! F42 · ASK · 20 Nov · Missing brain behaviour (the Editor's reading of the stall data, confirmed): stalled…
  ! F41 · ASK · 20 Nov · Missing setting (brief 011 settings review, playtest round 2): Brain 5 barely reacts to…
  ! F40 (PR #33) · ASK · 20 Nov · Brief 019, B4's race check counts Command, Stamina and movement cap but not Mark or other…
  ! F40 · ASK · 20 Nov · Skewer almost never fires (brief 011 bot minimum: 50+ firings). 2 in 1,200 games before…
  ! F39 (PR #33) · ASK · 20 Nov · Brief 019, two readings in the new lab measures. (1) lead_lost counts a side that led by…
  ! F39 · ASK · 20 Nov · Move order decides balanced 5v5 under specials (v3.7, brief 011). The squad has one Light…
  ! F38 (PR #33) · ASK · 20 Nov · Brief 019, B3 (storm together): the brief's gather and strike rules alone weren't enough…
  ! F38 · ASK · 20 Nov · Skewer's second hit (Game Laws 6.17, brief 011): the brief says a special's hit is worked…
    F021-3 · OPEN · 20 Nov · The header comment in board/version.js still says the design chat picks the version and…
    F021-2 · OPEN · 20 Nov · The status page shares the play-links concurrency group (brief 021 §1). GitHub keeps only…
  ! F021-1 · ASK · 20 Nov · A chat writing its log file on the status branch can't start the board workflow (brief…
  +6 older in FLAGS.md

BUILDS
  Building
    019 Brain 7 · PR #33 · Ready · no checks yet · not reviewed
    021 Status board · PR #34 · Draft · checks running · not reviewed
  Ready to start
    014 Fields
  Waiting
    012 Cavalry ← 014, 017, 018
    017 Move preview ← 014
    018 Turn cue zoom ← 017
    020 Victory values ← 019
  Merged (last 3)
    011 Special attacks · v3.10.00 · 20 Nov
    016 Stall logging · v3.09.01 · 19 Nov
    015 Flag rulings · v3.09.00 · 19 Nov

CHATS
  Open
    none
  Closed (last 5)
    none
```
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a
- **Settings review (brain builds only):** n/a
- **Guessed or left out:**
  - "Last 24 hours" for results uses the index's date, which has no time. In practice it means "dated today or yesterday (UTC)".
  - Default brain comes from the `CHANGELOG.md` version table row for `main`'s version. The board has no other machine-readable home for it.
  - A brief's name comes from its branch slug ("Turn cue zoom"), not its title, to keep lines short.
  - "Building" for an open pull request still under the old rule: its version counts as taken only if it is above `main`'s. PR #33 still says v3.10.00, which `main` already has, so the board shows its size (YY).
  - Night checks: the last scheduled run on `main` started at 12:17 pm ET on 19 Nov, not 3:07 am. GitHub delays scheduled runs, and the board shows the real time.
- **`main`'s protection:** no effect. The workflow writes only to `status` and `gh-pages`.
- **Stale comment in `board/version.js`:** its header still says the design chat picks the version and states it in each brief. F021-3 asks the next build that touches `board/` to fix it.
- **Known gaps:**
  - §2's "on push to `status`" can't work: GitHub reads a push's workflows from the pushed branch, and `status` holds none. Chat files appear on the hourly run, or at once if the chat starts the workflow (F021-1, ASK).
  - Sharing `play-links`' concurrency group can drop one waiting play-link update (F021-2).
  - Pushes to old `brief/*` branches (cut before this merge) don't start a run. The hourly run covers them.
  - A pull request that conflicts with `main` gets no `pull_request` runs (GitHub can't build its merge commit). The hourly run covers it.
  - Not seen live from this session: the page loading in a browser (this session can't reach github.io). Pages already serves the play links from the same branch.
  - Already happening under the old rule: PR #32 and PR #33 both use F42, and PR #33's F38–F43 clash with `main`'s F38–F41. Those pull requests keep old-style rows (§8) but must renumber at their next `sync`.
- **Flags closed / opened:** none closed. Opened `flags/021.md`: F021-1 (ASK: accept hourly plus run-on-demand for chat files), F021-2 (OPEN), F021-3 (OPEN).
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/34
