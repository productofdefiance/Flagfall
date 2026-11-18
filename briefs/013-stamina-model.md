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

## Report
*Filled in by Claude Code.*

- **What's in:**
  - Base Stamina per card (`stamina` on a card; without it the rule set's `game.stamina`, so every current card stays at 3).
  - Next-turn Stamina = base + modifiers, in `engine.js` (`STAMINA_EFFECTS`, `staminaMods`, `staminaWith`, `nextStamina`, `addStaminaMod`). Each modifier has a `source` (`self` / `enemy`) and an `effect`. Different effects stack. The same effect counts once, both when it's recorded and when it's added up. Second Wind cancels only a `self` brace tiredness. The floor is `game.staminaFloor` (1) in `data.js`; a penalty can't take a unit below it.
  - Brief 012 adds Pursued as one `STAMINA_EFFECTS` entry plus an `addStaminaMod` call where it triggers. Recorded modifiers are used up at the unit's turn start. On scratch copies (`cloneLite`) they're copy-on-write, so the bot can't leak one into the real match.
  - One source of truth: the turn start, the unit info's next-turn Stamina, the pips' maximum (now the card's base) and both brains' views (`bot.js` reads `E.status().stamNext`) all go through `nextStamina`.
  - Settings: v3.4 stores `braceTiredness: 1` in place of `staminaAfterBrace: 2` and shows "Brace tiredness". Older presets keep "Stamina after bracing 2" and the engine reads it as tiredness = stamina − staminaAfterBrace. New row: "Lowest starting Stamina" (every preset: 1).
  - Rule sets saved before this build (a saved match's own copy, or a custom set) have no `staminaFloor`, and the engine applies no floor to them. They replay exactly as before, even with odd numbers (tested with "Stamina after bracing" 0).
- **Anything beyond the brief, and why:**
  - `regress_engine.js <board> N all` hashes every preset, the newest included, against every brain. The default run leaves out v3.4 and Brain 5 / Kit D, so it can't prove the brief's "Brain 5, Kit A–D, Standard and Easy unchanged". The default output is unchanged, so the CI comparison works as before.
  - The game version shows on Home and in the match line (`version.js` `game`), and `CHANGELOG.md` gets its version table. Both are standing rules in `CLAUDE.md`, and this is the first build since they were added.
- **Checks run and results:**
  - All pass: test_rules, test_v1, test_v3, test_v31, test_v32 (40), test_v33, test_v34, test_stamina (517 checks), test_reasons, test_kitd (2), test_brain5 (2), test_rng, test_invariants (30 games, 0 problems), replay (386 checks, 0 mismatches).
  - `test_v34.js`: its "v3.4 is v3.3 apart from the turn limit" check now also allows the brace-tiredness storage change.
  - `regress_engine.js`, 3 games, before → after, identical:
    ```
    match3       37397ef2bd3ed86b
    v1           7b25bca651c0cb31
    v2           ddbe5fc437ff4e9d
    v3           26371927b53d4413
    v3.1         c71e4cd12fc984b0
    v3.2         f62a061d2c147d83
    v3.3         e6151bf463d6c9f8
    ```
  - `regress_engine.js … 2 all` (8 rule sets × 9 brains, v3.4 and Brain 5 included): ALL_RESULT
- **Worst-case next-turn Stamina per card (floor check):** 2 for every card (HM, LM, HR, LR, HA, LA) in every preset (match3, v1, v2, v3, v3.1, v3.2, v3.3, v3.4). The only shipped penalty is brace tiredness −1 on base 3, so the floor of 1 never binds today.
- **Could an action be cut off partway?** No case found. Moves, tackle break-aways, Evade, attacks and braces are checked in full against Stamina, Command and the movement cap before anything happens. A refused action changes nothing. Tested on every preset; over 4 bot games on v3.4, every offered move (including mid-Evade) fit in full.
- **Rules it touches (tests in `test_stamina.js`):** Brace 3 → 2 and Second Wind 3, on every card of every preset. Set spear: one spear per entry, a second unit takes the second spear, a third takes none. Tackle at hex cost: a Heavy on 1 Stamina is refused with nothing spent, and on 2 it can break away. Attack and brace are refused whole on 0.5 Stamina or 0.5 Command. Stacking and floor: three −1s give 1, the same effect twice counts once, Second Wind doesn't cancel an enemy penalty.
- **Baseline table:** not needed (no rule change; every hash identical).
- **Bot minimum:** n/a by the brief. Both brains read next-turn Stamina from the engine, and the bot-driven hashes are identical.
- **Settings review:** not a brain build.
- **Known gaps:**
  - The unit data screen has no per-card Stamina column yet. Brief 012 can add one alongside Cavalry.
  - Custom rule sets saved before this build show "Lowest starting Stamina" blank, and no floor applies until a value is typed in.
  - Game version: this takes v3.05.01, the next free on `main` today (the brief's example assumed 007 lands first). If another build merges first, **sync** renumbers it.
- **Flags closed / opened:** none closed. Opened F27: `CLAUDE.md` history says Kit C was the v3.04.00 default, but the changelog says Kit D.
- **Pull request:** https://github.com/productofdefiance/Flagfall/pull/13
