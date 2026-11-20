# Chat log (Brief 021)

One small file per **design chat**, written only by that chat. Code chats are not logged: a Code chat is a build, and builds are already on the board.

**Nothing personal, ever.** This repository is public. The owner is "the Editor": no real names, emails, places or accounts.

## The file
`chats/YYYY-MM-DD-HHMM-<slug>.md` (the time the chat opened, US Eastern), for example `chats/2026-11-21-0915-bot-review.md`:

```
name: FF Bot v3.10.00 -
subject: Brain 7 review
opened: 2026-11-21 09:15 ET
status: open
```

When the chat closes, change `status:` and add three lines:

```
status: closed
closed: 2026-11-22 18:40 ET
final name: FF Bot v3.10.00 - Brain 7 reviewed
outcome: brief 022 written; F43 answered
```

## Rules
- Each chat edits only its own file. Never edit or delete another chat's file.
- Only chats opened after Brief 021 merged are logged. No backfill.
- The board lists open chats (oldest first; `stale?` after 3 days without a change to the file) and the 5 most recently closed.
- The board itself (`BOARD.md`, `board.json`) is written by the `status board` workflow. Don't edit it, and don't leave notes for other chats here: briefs, Reports, flags and the design docs are the channels.
- A push to this branch doesn't start the workflow (this branch holds no workflows). The board picks the change up within the hour; to see it sooner, start the `status board` workflow on `main` (Actions tab → status board → Run workflow, or the GitHub tool's "run workflow" with `status-board.yml` on `main`).
