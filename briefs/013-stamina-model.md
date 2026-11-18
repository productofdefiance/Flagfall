# Brief 013 — Stamina per unit, with stacking modifiers

| | |
|---|---|
| Game version | Next free ZZ when it merges (e.g. v3.06.01). ZZ moves: nothing plays differently, the engine is reshaped for Cavalry |
| Lane | Rules |
| Rule set | none (no preset plays differently) |
| Date | 18 Nov 2026 |
| Goal | Each unit gets its own base Stamina, and next-turn changes become modifiers on it, so Cavalry (Stamina 4) and Pursued can be built |
| Branch | Any branch your session may push to, started from `brief/013-stamina-model` |
| Flags | none to close; open new ones as found |
| Order | Can start now, alongside 007 and 008. Must merge before 012 (Cavalry) is built |

## Context
Today the board has one Stamina number for every unit (`game.stamina: 3`), and a braced unit is set to a fixed value (`game.staminaAfterBrace: 2`, used in `engine.js` at the turn start and in the unit info). Cavalry has Stamina 4 and Pursued takes 1 Stamina off next turn, so neither can be built on that. The Editor locked the Stamina model on 18 Nov. Game Laws: actions table (Brace row), 1.12, 3.13, 3.14, 6.7, 6.12.

Doing this before Cavalry, with no change in play, means any change in brief 012's results comes from Cavalry, not from this rewrite.

## Scope
In:
- Base Stamina per unit card.
- Next-turn Stamina as base plus or minus modifiers, with the stacking rules, the floor and the in-turn rule below.
- A check that tests the floor on every card.
- Every place the board shows Stamina reads the new model.

Out:
- Cavalry, Pursued itself, any new unit or preset. Pursued arrives with brief 012 as one more modifier.
- Any change to how an existing preset plays.

## What to build
1. **Base Stamina per card.** Each unit card can carry its own `stamina`. A card without one uses the preset's `game.stamina`, so every existing card stays at 3.
2. **Next-turn modifiers.** At the start of a unit's turn, its Stamina is: its base Stamina, plus or minus every next-turn modifier on it. Today there are two:
   - **Brace tiredness:** −1 for a unit that braced on its last turn.
   - **Second Wind** (Light Ranged's brace benefit, `fullStamina`): cancels that unit's own brace tiredness and nothing else. A future penalty from someone else (Pursued) still applies to it.
   Build the modifiers as a list the engine adds up, so brief 012 adds Pursued as one entry, not a new branch of code. Each modifier states its **source** (the unit itself, or an enemy) and its **effect** (a name such as `braceTiredness`).
3. **Stacking (Game Laws: Brace row, 1.12).** Modifiers from different effects stack. The same effect applies **once per turn**, however many times it is triggered: a unit that leaves two braced Light Cavalry in one turn will be Pursued once.
4. **The floor.** A unit always starts its turn on **at least 1 Stamina**, whatever stacks. A penalty that would take it lower is applied only down to 1. The only exception is an ability whose own text says it can exhaust a unit to 0; none exists yet, so build the floor as a number in `data.js` that such an ability could override later, but don't build any override.
5. **Within a turn, nothing is cut off partway.** An action is legal only if the unit can afford all of it (Stamina and Command). Confirm this holds today and test it (see "Rules it touches"); fix it only if a case is found, and raise an `ASK` before changing behaviour in any existing preset.
6. **One source of truth.** The turn start (`engine.js`), the unit info's "Stamina next turn" (`engine.js`), the Stamina pips on screen (`app.js`, which uses `game.stamina` as the maximum today) and the brain's view of next turn all read the same engine function. No copies.
7. **The settings screen.** "Stamina after bracing" (a fixed value) no longer describes the rule. For the newest preset onwards, show it as "Brace tiredness" (how much Stamina bracing costs next turn, default 1). How older presets keep their numbers is your call, as long as they play and replay identically.

## Rules it touches
Each becomes a test.
- Brace: next turn 1 Stamina down (all current units: 3 → 2).
- Second Wind: a braced Light Ranged starts on 3.
- Set spear (3.13): one spear per entry; another braced Heavy Anti-Cavalry covering that hex stays loaded for the next entry. The board already plays this way (`spikeCheck` stops at the first spear). Add a test that pins it: one unit entering next to two braced Heavy Anti-Cavalry takes 2, and a second unit entering the same hex takes the second spear.
- Tackle at hex cost (6.6): a Heavy unit on 1 Stamina next to an enemy Melee unit cannot break away (1 for the hex + 1 for tackle). The move is refused, never started and cut off.
- Evade (6.5): only as far as remaining Stamina, movement cap and Command allow; never cut off partway.
- Mark (3.8), Command, turn limits: unchanged.

Floor and stacking tests, with a test-only modifier (not shipped in any preset):
- three −1 penalties from different effects on a 3-Stamina card start the unit on 1, not 0;
- the same effect triggered twice in one turn applies once;
- **every card in every preset**, with every combination of the shipped modifiers, starts its turn on at least 1. This check runs on every pull request, so a future modifier that could break the floor fails its own pull request.

## Bot minimum
n/a for new behaviour: nothing the bot can do changes. The brains must read next-turn Stamina from the engine function in item 6, not their own copy. Bot-driven regression hashes stay identical.

## Must not change
- Every existing preset plays and replays identically. Every saved match replays identically.
- Brain 5, Kit A–D, Standard and Easy play exactly as before (bot-driven regression hashes unchanged).
- What the board shows for Stamina, now and next turn, for every current unit.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every preset match the previous board (paste them).
- The new floor check runs in the `checks` workflow.

## The Editor's hands-on check
One quick game on the play link: brace a Heavy Melee and a Light Ranged, end the turn, and check the unit info shows "next turn 2" and "next turn 3". Nothing else should look different.

## Report back
- The worst-case next-turn Stamina for every card, as the floor check found it.
- Any case where an action could be cut off partway (expected: none).
- Add to `CLAUDE.md` under Rules for the code: "Every new Stamina modifier states its source, its effect and its worst-case stack; the floor check must pass on every card." (Standing rule, the Editor, 18 Nov.)

---

## Report
*Filled in by Claude Code.*

- **What's in:**
- **Anything beyond the brief, and why:**
- **Checks run and results (paste regression hashes):**
- **Baseline table (rule changes only):**
- **Bot minimum (met / not met, with numbers):**
- **Settings review (brain builds only): settings with no effect found; settings that seem to be missing (with evidence):**
- **Known gaps:**
- **Flags closed / opened:**
- **Pull request:**
