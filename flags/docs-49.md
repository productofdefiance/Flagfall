# Flags opened by docs pull request 49 (move-order study)

Same columns and status words as `FLAGS.md`.

| # | Date | Raised by | Issue | Status | Resolved in / next step |
|---|---|---|---|---|---|
| FD49-1 | 21 Nov | Code | Brief 012 Measurements item 4 (Command and turn limits) screens 9v9 at Command 10, 12, 14 and 13v13 at 14, 16, 18, each with the brief's first-turn Command. The Editor, 20 Nov: every one of those screens also runs with first-turn Command equal to full Command (if the first-mover penalty goes, it goes in every format). Not yet written into the brief | ASK | Design chat: add it to `brief/012-cavalry`. The Editor chose this flag row over Code pushing to the brief branch |
| FD49-2 | 21 Nov | Code | Brief 012 names its preset "v3.8", but v3.8 is already on `main` (fields, brief 014). The Editor approved v3.9 on 20 Nov, but brief 017 merged the same night as rule set v3.9 (routes), so v3.9 is taken too | ASK | Recommended: v3.10, a copy of v3.9 (fields and routes on). The brief's comparisons move up with it: the foot-identity check compares v3.10 (cavalry, fort, 5v5 Command change off) with v3.9, not v3.7, and Measurements item 1's columns become v3.9, v3.10 without the fort, v3.10 |
| FD49-3 | 21 Nov | Code | Job order `move-order-command-storm` measures rule set v3.8 as ordered. Since brief 017 merged, the newest rule set and new-game default is v3.9 (routes), which changes how moves walk and could move the first mover's share. Likely small, not measured | ASK | Recommended: read tonight's v3.8 results first; if any arm lands in 45–55%, confirm that arm and its baseline on v3.9 (1,000 games, same seeds) before ruling F12 |
