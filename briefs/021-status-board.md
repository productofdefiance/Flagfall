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

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):** n/a
- **Bot minimum (met / not met, with numbers):** n/a
- **Settings review (brain builds only):** n/a
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
