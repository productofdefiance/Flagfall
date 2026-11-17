# Flags — open issues and questions

This file is how Claude Code talks to the design chat. Add a row for every issue found or question that needs a decision; never reuse a number. Close rows by setting the status and saying where they were resolved.

**Status:** `OPEN` needs work · `ASK` Code needs an answer from Chat or the Editor · `DECIDE` waiting on the Editor · `TEST` needs a playtest or sim · `FIXED` · `CLOSED` (no action needed)
**Raised by:** Editor · Chat · Code · Red team

| # | Date | Raised by | Issue | Status | Resolved in / next step |
|---|---|---|---|---|---|
| F1 | 16 Nov | Red team | E1: a flag holder that kills an adjacent enemy was dragged off its own flag | FIXED | v3.1 switch `holderHoldsHex` |
| F2 | 16 Nov | Red team | E2: a pooled flag and holder could fall early through rounding | FIXED | v3.1 switch `poolAsOne` |
| F3 | 16 Nov | Red team | E3: a double knockout always went to North | OPEN | v3.1 gives it to the side acting. Ruled 17 Nov: it goes to the turn-limit tiebreaks (a draw only if level). Brief 002 |
| F4 | 17 Nov | Editor | E3b: a defender killed by the hit still parries | OPEN | Ruled 17 Nov: dead units don't parry. Brief 002 |
| F5 | 17 Nov | Editor | E3c: prove no single action can knock out both sides | OPEN | Test that counts double knockouts over many sim games (expected 0). Brief 002 |
| F6 | 16 Nov | Red team | E4: malformed actions crashed or slipped through | FIXED | Input checks in `apply()`, all rule sets |
| F7 | 16 Nov | Red team | Simulators' random generator looped every 10,466 draws | FIXED | `tests/rng.js`. Retired scripts were not carried into this repo |
| F8 | 16 Nov | Red team | Remaining red team findings: stalling, the untested sealed fort, line of sight, set spear on a shift, Ranged pull strength, a Ranged kill from an adjacent hex | OPEN | Each needs a ruling before it can be built |
| F9 | 16 Nov | Chat | No automatic checks on pull requests | FIXED | Brief 001: `checks` workflow runs on every pull request to `main`. The Editor still has to protect `main` so it can't be skipped (steps in Brief 001's Report) |
| F10 | 16 Nov | Chat | 5v5 stalls: 67.8% draws and 0 pulls in 400 bot games (v3.1, Kit B vs Kit B) | OPEN | Needs a design answer (reset format or sudden death, F14) |
| F11 | 16 Nov | Chat | 7v7 ends on the turn limit in 37.8% of bot games (28.8% tiebreak win + 9% draw); 4 pulls in 400 games | OPEN | As F10 |
| F12 | 16 Nov | Chat | First mover at 5v5 won 2 of 99 decisive games | OPEN | Likely a bot artefact, not proven |
| F13 | 16 Nov | Chat | Stalls rose after the E1/E2 fixes | TEST | Likely cause, not isolated |
| F14 | 16 Nov | Chat | How a drawn match ends: reset format vs sudden death | DECIDE | |
| F15 | 16 Nov | Chat | Replay preservation vs the Process Lessons' advice to let old matches break | CLOSED | Kept: v3.1 preserved every old rule set behind switches; replay stays a required check |
| F16 | 16 Nov | Chat | Update docs on events, not every message | CLOSED | Adopted 17 Nov |
| F17 | 17 Nov | Code | The invariants run on every pull request (`redteam/invariants.js`) only plays rule set v3, so nothing automatically checks v3.1 games for impossible states (two units on a hex, odd HP, negative Stamina). It also uses its own random generator rather than `tests/rng.js` | ASK | Should a future brief add an invariants test for the newest preset under `board/tests/` (using `tests/rng.js`) and run that in `checks` instead? Recommended: yes |
| F18 | 17 Nov | Code | `regress_engine.js` leaves v3.1 out of its hashes, so a v3.2 change that accidentally alters v3.1 would only be caught by `test_v31.js` | ASK | Recommended: Brief 002 adds v3.1 to the hashed rule sets and leaves only the new preset out |
