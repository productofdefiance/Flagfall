# Brief 012 — Cavalry: Heavy and Light Cavalry, 9v9 and 13v13, the fort (rule set v3.8)

| | |
|---|---|
| Game version | **v4.00.00** (X: a big new system). Cavalry is the X change, whatever YY versions merge before it |
| Lane | Rules (also touches Units, UI, Bot and Lab) |
| Rule set | New preset: the newest preset at build time plus switch `cavalry`. As planned that is v3.7 (brief 014), so this one is **v3.8**. If the order changes, take the next free id and say so in the Report |
| Date | 19 Nov 2026 |
| Goal | Heavy and Light Cavalry join the game with their traits, brace benefits and specials; 9v9 and 13v13 become playable; the fort rule, the rewritten Mark and the new Command numbers go in (Game Laws 2.1, 2.7, 2.9, 3.4, 3.8, 4.2, 4.5, 4.6, 4.8, 6.4, 6.5, 6.7, 6.9–6.12, 6.14–6.17) |
| Branch | Any branch your session may push to, started from `brief/012-cavalry` |
| Flags | none to close; open new ones as found. F20 gets its double-knockout check again (Trample and Breakaway can hurt both sides) |
| Order | **After 011 and 014 are both merged.** It builds on 011's special system (warm-up, fire, previews, Special button) and on 014's fields (9v9 and 13v13 exist there as data only) |

## Context
Cavalry is the first new unit type since the board was built. Its cards were locked on 18 Nov (Unit Stats sheet, Test units rows 15–16). On 19 Nov the Editor settled the gaps the Laws left: Mark stops a unit only where it comes to stand (3.8, rewritten), set spear still fires on hexes ridden over (6.14), the fort (4.5), Pursuit's damage (6.12), Cavalry only at 9v9 and 13v13 (2.1), and Command and turn limits per format (2.7, 2.9).

Everything below is in the Game Laws. Where this brief and the Laws disagree, the Laws win: say so in the Report. If a case comes up that neither covers, raise an `ASK`; don't decide it.

## Scope
In: preset v3.8; the two Cavalry cards; Vault; Cavalry and zones; Trample; Pursuit and the Pursued status; set spear against Cavalry; Anti-Cavalry halving Cavalry Armor; Charge and Breakaway on 011's special system; the rewritten Mark; the fort; mounted units never holding a flag; the last-foot-unit lineup rule; 9v9 and 13v13 playable on 014's fields; Command per format (5v5 changes); screens; the default brain playing all of it; the baseline and the Cavalry measurements.

Out: any change to v3.7 or older presets; Pursuit at 10% or 0% (kept in reserve by the Editor, see Measurements); set spear's fallback (double damage to Heavy Cavalry): measure only; icons for Trample, Pursuit, Charge or Breakaway (text only; the UI chat designs icons later); horse archers or any other new unit; the zone layer (Ideas Log).

## What to build

### 1. Preset v3.8
A copy of the newest preset with `cavalry: true` and `fort: true`, plus `markWhereStands: true` (section 6). It becomes the newest preset. Every number below lives in the rule set (`data.js`):
- **Command per format (2.9):** `game.command5: 8`, `firstTurnCommand5: 5`; 7v7 stays `10` / `6`; `command9: 12`, `firstTurnCommand9: 7`; `command13: 16`, `firstTurnCommand13: 10`. Read the same way as `turnLimit5` / `turnLimit7`. Older presets keep one Command for every format.
- **Turn limits (2.7):** `turnLimit9: 40`, `turnLimit13: 50`. 5v5 25 and 7v7 35 unchanged.
- **Deploy radius:** 3 at 9v9 and 13v13 (2.5), as 014 set the fields.
- `trampleDamagePct: 25`, `pursuitDamagePct: 20`, `pursuitStamina: 1`, `cavArmorFactorVsAntiCav: 0.5`, `chargePerHex: 0.25`, `chargeMaxHexes: 3`, `chargeHeadOn: 0.5`, `breakawayMaxRiddenOver: 2`.

### 2. The cards (6.7, Unit Stats rows 15–16)
| | Heavy Cavalry (HC) | Light Cavalry (LC) |
|---|---|---|
| Icon | `heavyCav` ⏺ (already in `ICONS`) | `lightCav` ⊙ |
| UC | 2 | 2 |
| HP / Strength | 25 / 10 | 18 / 8 |
| Stamina / per hex / cap | 4 / 1 / 4 hexes | 4 / 0.5 / 6 hexes |
| Defence | Armor 3 | Dodge (room, 3.5) |
| Range | 1 (melee) | 1 (melee) |
| Trait | Vault | Vault |
| Marks | Yes, always | No; slips through enemy zones |
| Brace benefit | Trample | Pursuit |
| Class ability | (Heavy) | Evade (6.5) |
| Special | Charge | Breakaway |
| Mounted | Yes | Yes |

After a brace, Cavalry starts its next turn 1 Stamina down like every unit (4 → 3), through 013's modifier list. No accuracy penalty for Heavy Ranged against Cavalry.

### 3. Formats and lineups (2.1, 2.2, 4.8)
- 9v9 and 13v13 become playable with v3.8 on 014's fields. With an older preset they stay greyed out as today.
- Cavalry cards may be picked only at 9v9 and 13v13. At 5v5 and 7v7 the lineup screen doesn't offer them (2.1).
- **Last foot unit (4.8):** every lineup must hold at least one unit that isn't Cavalry. The lineup screen refuses to start otherwise, with the reason `At least one foot unit`.
- The computer's default lineups: 9v9 one HC, one LC, and HM, HA, HR, LR, LA (9 UC); 13v13 one HC, one LC, and HM, HM, HA, HA, HR, LR, LA, LM, LM (13 UC). Keep 5v5 and 7v7 as they are.
- The tiebreak's "fewer lost" already counts UC (`beingsLost`), so a removed Cavalry unit counts 2. Confirm it in a test.

### 4. Mounted units and the flag (4.2, 4.6)
- Cavalry never holds a flag: it can't deploy on its own flag hex, move onto it or swap onto it. Refusal reason: `Mounted units can't hold the flag`.
- Cavalry may pull an **empty** enemy flag from the goal zone, like any unit (4.6).
- Vault never passes over a flag hex (6.14).
- Once every foot unit of a side is removed, that side simply has no unit able to hold its flag (4.8). No new code beyond the rules above; add a test.

### 5. Vault (6.14)
Cavalry may move over other units, friend or enemy, **except** Anti-Cavalry (HA, LA), Cavalry (either side) and a flag hex.
- A vaulted hex costs the same as an empty one (HC 1, LC 0.5) and counts as one hex toward the movement cap.
- The move must **end on an empty hex** it can afford in Stamina, cap and Command.
- **For Marks**, only the hex the rider comes to stand in counts (section 6). Hexes ridden over never stop it.
- **For set spear**, every hex it passes through counts as entered. If a spear triggers while the rider is over an occupied hex, it is **turned back**: it stops in the last empty hex it passed, takes the 2, its move ends, and it may attack only that spearman if it can reach it from there. If the spear triggers on an empty hex, it stops there (6.15).
- **Set spear against Cavalry (6.15):** 2 damage, not reduced by Dodge or Armor; the rider stops and may attack only that Heavy Anti-Cavalry this turn; Evade is unchanged. Only the first enemy to enter each turn triggers each spear, one spear per entry (3.13).
- **Tackle** works as today: judged from the hex the move starts in to the hex it ends in. Hexes ridden over create no contact.
- **Which path:** a move names its destination; when several routes reach it, the engine takes the cheapest route that triggers nothing (no spear). If every route triggers a spear, it takes the cheapest one and the move preview says so (`Set spear: −2, stops at F9`). Nothing is cut off unannounced: the preview always shows exactly where the move ends and what it takes on the way. The player may also fix a route by tapping a waypoint hex before the destination (needed for Breakaway, section 10; offered for every Cavalry move).
- Evade steps (LC) follow the same rules, Vault included.

### 6. Mark, rewritten (3.8, behind `markWhereStands`)
Build Article 3.8 exactly as the Laws now word it:
1. HM, HA and HC mark their six neighbouring hexes at all times; a braced HR does too. Light units never mark.
2. A unit **enters** an enemy zone when it comes to stand in a zone hex that turn by any means: moving, swapping, Evading, taking a hex after a kill, being swapped by Trample, or ending a special's ride there. A hex ridden over with Vault is never entered for Marks.
3. A unit that enters stops: for the rest of the turn it may attack, brace, pull or warm up a special, but not move or swap. Exceptions: Evade after an adjacent attack (6.5); a Charge stopped by a Mark strikes the enemy whose Mark stopped it (section 9).
4. A unit that starts its turn in an enemy zone may step out and move freely, or shift 1 hex within the zone and stop; either way it stops again if it enters a zone hex later that turn.
5. Light Cavalry slips through: enemy Marks never stop it (6.9).
6. A zone never blocks an attack.

For foot units this plays exactly as v3.7 (the Editor's intent; the design chat checked the engine's swap rule against it). Prove it: v3.8 with `cavalry`, `fort` and the 5v5 Command change turned off must hash identically to v3.7 on 5v5 and 7v7 (a sim-only copy, not a preset). If any game differs, stop and raise an `ASK` with the example.

### 7. Trample (6.11, HC brace benefit)
When a braced HC is hit by an **adjacent melee attack** (normal attack or special), on the **first such attack each enemy turn**:
- The hit lands first. If the HC is removed, nothing more: the attacker takes the hex as normal (3.6).
- If the HC survives, the attacker takes **25% of the HC's own Strength** (2.5), flat, no dice, not reduced by Armor or Dodge (3.4, like parry), and the two **swap hexes**. If that damage removes the attacker, there is no swap.
- The swapped attacker counts as **entering** its new hex: set spear and Marks apply. It pays nothing for the swap.
- **Never onto a flag hex.** With the fort (section 12), a holder attacking from its flag triggers no Trample at all.
- A Light attacker may Evade afterwards, from its new hex, if it has the budget (6.5).
- Ranged shots and Reach attacks from 2 hexes never trigger it.
- When one action hits several units (Arc Hit, Skewer, Breakaway), every hit lands first, then reactions; the same reaction fires once per action (1.12, 6.16).

### 8. Pursuit (6.12, LC brace benefit)
The first enemy each turn to **leave contact** with a braced LC (end up no longer adjacent to it, by moving, swapping, Evading or a special's ride) is **Pursued**:
- It takes **20% of the LC's own Strength** (1.6, so 1.5 on the half-point scale), flat, no dice, not reduced by Armor or Dodge, at the moment it leaves. If that removes it, its move ends there.
- It starts its next turn **1 Stamina down**: a new entry in 013's modifier list. Standing rule: **source** an enemy LC; **effect** `pursued`; once per turn however many braced LC it leaves (the unit is Pursued once, damage once); **worst-case stack** brace tiredness −1 plus Pursued −1: a 3-Stamina foot unit starts on 1 (floor holds), Cavalry on 2. Second Wind cancels only the Light Ranged's own brace tiredness, never Pursued (3.14). The floor check must pass on every card.
- Being swapped by Trample is not leaving contact (the unit didn't choose to move). Raise an `ASK` if another forced move comes up.
- With the fort, a holder leaving its flag is never Pursued (section 12).
- Shown on the unit as status `Pursued` (−1 Stamina next turn) until its next turn starts.

### 9. Charge (HC special, 6.10, 6.17)
Built on 011's special system: warm up one turn (1 Stamina, gold ring), fire the next turn at the attack cost (1), no dice, multiplier on the finished hit.
- The HC may move normally first, then rides **one of the six straight lines** (Vault allowed) and strikes. The bonus counts the **final straight run** of hexes in one line before the strike, up to 3: **+25% per hex**; **+50% more if head-on** (the target is the next hex along that same line). Multiplier = 1 + 0.25 × hexes (≤ 3) + 0.5 if head-on, so ×1 to ×2.25. A full Charge (3 hexes and the strike) costs exactly 4 Stamina.
- Damage: the normal hit from the final hex (Strength, Support, the target's Armor or Dodge, Brace and its benefits), no dice, × the multiplier, rounded to the half, at least 1 (6.16.3).
- **Stopped by a Mark** (first empty zone hex entered): it strikes the enemy whose Mark stopped it, with the bonus earned so far (head-on if that enemy is next in line). If several enemies' Marks cover that hex, the player picks which (the bot picks the best).
- **Stopped by set spear:** as section 5. It strikes the spearman with the bonus earned so far if it can reach it from where it stopped; otherwise it strikes nothing, and the special is still Used (firing is the attack, 6.16).
- If the target survives, the HC stays in the last hex before it; if it dies, the HC takes the hex (3.6; set spear on entering applies).
- A braced HC as the target triggers Trample as normal. A flag holder can be charged only from its goal zone (4.5).
- The preview shows the line, the hexes counted, `head-on` or not, and the multiplier.

### 10. Breakaway (LC special, 6.17)
Also on 011's system.
- The LC rides **any route it could legally move** (Vault; slips through zones; spears apply), set by waypoints.
- Each **enemy ridden over** takes ×1 as the rider passes: the normal adjacent hit on that unit (Strength, Support, its Armor or Dodge, Brace, Fend), no dice. **At most two** count; a third ridden over takes nothing. **None of them parries.**
- Then the **final target** (adjacent to where the ride ends) takes ×1. **Each enemy is hit at most once:** the final target can't be one it rode over (the Editor, 19 Nov).
- Then Evade (6.5), except after killing the final target (the LC takes the hex and its turn ends, 3.6).
- **Set spear** interrupts it as in section 5: hits already landed stay; the final hit lands on the spearman if it can reach it, otherwise nothing more.
- Kills among those ridden over: the rider carries on; it never takes their hexes.
- All hits land first, then reactions (one parry at most, from the final target only; Trample if the final target is a braced HC).
- 1 to 3 times in total, the Editor's guide (6.16.2).

### 11. Anti-Cavalry against Cavalry (3.4)
Both Anti-Cavalry units halve a Cavalry unit's Armor on their attacks (normal, Reach, Skewer, Javelin): HC's 3 counts as 1.5. Reactions are unaffected (they ignore Armor anyway).

### 12. The fort (4.5, behind `fort`)
No brace benefit works against a unit **entering its own flag hex, holding it, attacking from it or leaving it**. A braced enemy keeps only the shared brace reduction on hits it takes. So:
- no set spear on a unit stepping or swapping onto its own flag;
- against a holder's attacks from its flag: no parry, no Trample, Weave doesn't double Dodge, Fend doesn't remove Support;
- no Pursuit on a holder stepping off its flag.

Tackle and Marks still apply (they aren't brace benefits). The attack and move previews say why a reaction doesn't fire (`No parry: attacking from the flag`). This changes 5v5 and 7v7 play, so it's measured on its own (Measurements).

## Screens
Builds on 009 (attack preview, unit card, buttons) and 011 (Special button, warm-up sheet, gold ring, extra-target rows). No new icons: text in the key and chips.
- **Tokens:** ⏺ and ⊙ from `ICONS`, drawn by the skin like the others. A Cavalry token reads as one unit taking 2 UC: the lineup counts it as 2.
- **Lineup:** Cavalry cards appear at 9v9 and 13v13 only; the `In your lineup` bar counts UC; the refusal for a lineup without a foot unit.
- **Unit card:** Trait `Vault: rides over other units, never over Anti-Cavalry, Cavalry or a flag`. HC unit abilities: `Mark`, brace `Trample: when hit by adjacent melee, swaps with the attacker and deals it 2.5`. LC: `Slips through zones`, brace `Pursuit: the first enemy to leave it takes 1.5 and starts its next turn 1 Stamina down`, class `Evade`. Special section: `Charge: rides a straight line and strikes, +25% per hex (up to 3), +50% head-on` and `Breakaway: rides over up to two enemies, a normal hit on each and on the final target, then Evade`. Numbers come from the rule set.
- **Status chip:** `Pursued` (−1 Stamina next turn), from the engine's state.
- **Move preview (Cavalry):** the route drawn on the field, vaulted hexes marked; where it stops and why (`Stopped by Mark at F9`, `Set spear: −2, stops at F9`); a Pursuit it will take (`Pursued: −1.5 now, −1 Stamina next turn`). Waypoint tapping for a route.
- **Attack preview:** key rows for Trample (`You take 2.5 and swap to F9`), Anti-Cavalry's halved Armor (`Armor 3 → 1.5: Anti-Cavalry`), and the fort (`No parry: attacking from the flag`).
- **Charge preview:** the line highlighted, `3 hexes +75%, head-on +50%: ×2.25`, the exact damage (one segment, no dice).
- **Breakaway preview:** the route; one 011 extra-target row per enemy ridden over (at most two) plus the final target; the Evade step after.
- **Field:** 9v9 and 13v13 on 014's fields, with 014's hot-seat snap.
- Desktop: as 009. List any judgement call in the Report.

## Rules it touches
Each becomes a test on v3.8 where it applies.
- Vault: over friends and enemies; never over HA, LA, HC, LC or a flag; cost and cap per vaulted hex; can't end on an occupied hex.
- Mark (3.8): HC stops on the first empty zone hex; never over an occupied hex; LC never stopped; entering by swap, Evade, taking a hex, Trample swap; starting in a zone; warm-up allowed after stopping.
- Set spear (3.13, 6.14, 6.15): over an occupied hex → turned back, 2, may attack only the spearman; on an empty hex → stops there; not cut by Dodge; first entry per turn; one spear per entry; the fort on stepping onto a flag.
- Trample: first adjacent melee attack per enemy turn only; not ranged, not Reach; HC removed → attacker takes the hex; swap counts as entering (spear, Mark); damage can remove the attacker (no swap); never onto a flag; LC attacker Evades after; one reaction per action.
- Pursuit: once per turn per unit; damage and −1 Stamina; floor; Second Wind doesn't cancel it; not on a Trample swap; not on a holder leaving its flag.
- Charge: bonus per straight hex up to 3, head-on, moved first then straight; stopped by Mark (strike the marker; pick among several); stopped by spear (strike the spearman or nothing, Used); target survives / dies; braced HC target → Trample; holder only from its goal zone; no dice; rounding.
- Breakaway: up to two ridden over, each at most once, final target not one ridden over, no parry from those ridden over; spear interrupts and earlier hits stay; Evade after, not after a kill.
- Anti-Cavalry halves Cavalry Armor on every attack type; reactions unchanged.
- Mounted: no deploying, moving or swapping onto its own flag; may pull an empty enemy flag; at least one foot unit in a lineup.
- The fort: no parry, Trample, Weave or Fend against a holder's attacks from its flag; no spear stepping on; no Pursuit stepping off; tackle and Marks unchanged; the shared 2 less still applies.
- Command and turn limits per format; tiebreak counts a Cavalry unit as 2 lost.
- Double knockout (F20): over 400 + 400 seeded v3.8 games at 9v9 and 13v13, count actions that leave both sides with a win condition (Trample and Breakaway can hurt both). Expect 0; report the number.
- The turn-1 design rule (014's test) passes with the Cavalry cards: LC reaches 7 (6 + 1), under the gaps of 10 and 12.

## Bot minimum
The default brain at build time learns Cavalry under the `cavalry` switch only; on every older preset it plays exactly as before (hashes match main). No new brain number unless the build needs one; if it does, say why.
- Moves with Vault, avoids set spears unless the gain is worth the 2 and the stop, and uses LC's slip through zones.
- Warms up Charge when a straight line to a target is likely open next turn, and fires for the best multiplier; plans Breakaway routes over the softest enemies (Ranged, Light) within reach.
- Braces HC where enemy melee is likely to hit it (Trample) and LC where enemies will want to leave it (Pursuit); counts both when attacking or leaving braced Cavalry.
- Counts enemy Cavalry reach (Vault, Charge lines, a warmed special) in its threat estimate, so its backline isn't left open.
- Knows the fort: a holder attacks braced units without fear of parry or Trample; units step onto their flag past a braced HA.
- Prove it on v3.8, 400 seeded games per format (balanced 9v9 and 13v13 with the default lineups; plus a Cavalry-heavy 9v9: HC, HC, LC, + HM, HA, HR), both sides the default brain:
  - Charge and Breakaway each fired at least 50 times in total; Trample at least 30; Pursuit at least 30; vault moves counted;
  - no illegal action, no game that fails to finish;
  - per special: warmed, fired, lapsed, kills, average damage, and for Charge the average multiplier and the share head-on and full;
  - thinking time per turn at 9v9 and 13v13 against 7v7 (F24): flag it if the worst turn rises above 4.6 s.
- Settings review for the new settings only.

## Measurements
On the lab (brief 008), default brain, overnight, same seeds on every rule set; 1,000 games per side unless said. Under F23, call any gap under about 8 points noise.
1. **What the foot game lost or gained.** The full baseline table (holder KO, pull KO, TKO, tiebreak win, draw, ended on the turn limit, games with a pull, average turn, first mover's share of decisive games) at 5v5 and 7v7, three columns: v3.7, **v3.8 without the fort** (sim-only copy), v3.8. At 7v7 the only change is the fort; at 5v5 the first two columns isolate Command 8, the last two the fort. Also: reactions the fort blocked per game (parry, Weave, Fend, spear on stepping on, Pursuit on stepping off); holder KO rate.
2. **The Cavalry formats.** The same table at 9v9 and 13v13 (no earlier column), plus first contact (the turn of the first attack), the first mover's share, and Light units removed per game. Early look at the Editor's 13v13 tripwire (the real test waits for Cavalry coaching): the 13v13 default lineups also played on the 9v9 field (sim-only), with the share of games ending on the turn limit on each field.
3. **Is a Cavalry unit worth 2 UC?** Head to head at 9v9 and 13v13: the default lineup against the same lineup with the HC swapped for HM + LM and the LC for LR + LA. Sides swapped half the time. Report the win share. Also all-foot against Cavalry-heavy.
4. **Command and turn limits** (daytime screens, 200 games per side, sim-only): 9v9 at Command 10, 12, 14; 13v13 at 14, 16, 18. The baseline table for each. The Editor revises after playtest.
5. **The watch-list** (Ideas Log, Cavalry):
   - LC reaching backline Ranged: LC attacks on Ranged units per game, and on which turn;
   - Heavy Cavalry landing behind a line: moves that end past an enemy Mark by vaulting over units;
   - set spear: HC and LC hit per game, rides turned back, Breakaways interrupted; how often an HC ends its turn next to a braced HA. This is the evidence for the fallback (double damage to HC), which the Editor decides;
   - Trample: swaps per game, swaps into a set spear, attackers removed by it;
   - Pursuit at 20%: units Pursued per game, damage dealt, units removed by it, and Stamina it took away. The Editor keeps 10% and 0% in reserve: say plainly if 20% looks too strong;
   - specials fired per game by unit type, Charge and Breakaway next to the six foot specials.

## Housekeeping
- `CLAUDE.md`, Game version history: add `v4.00.00 = Cavalry (brief 012)` once built.
- `CHANGELOG.md`: the v4.00.00 entry and version-table row.
- The design chat updates the Unit Stats sheet (rows 15–16: rule set and status) after merge; list in the Report any card number that differs from the sheet.

## Must not change
- Every existing preset, v3.7 included, plays and replays identically (paste the hashes).
- Every brain plays every existing preset exactly as before.
- Saved matches from older rule sets load and replay.

## Checks before opening the pull request
- Every check in `README.md` passes.
- `regress_engine.js` hashes for every preset before v3.8 match main.
- The foot-identity check (section 6): v3.8 with `cavalry`, `fort` and the 5v5 Command change off hashes the same as v3.7 at 5v5 and 7v7.
- New `test_v38.js` in `checks`; `test_invariants.js` covers v3.8 with Cavalry in play (no two units on a hex, no unit stopped on an occupied hex, Stamina never below the floor at turn start, HP in half points).
- The Stamina floor check covers both Cavalry cards with Pursued and brace tiredness stacked.
- The "no 'being' on screen" check covers the new text.

## The Editor's hands-on check
One 9v9 on the phone against the bot, with one HC and one LC:
1. Vault the HC over a friend, and see a move stop on a zone hex.
2. Warm up and fire a Charge down a straight line of 3 hexes into a target head-on: the preview shows ×2.25.
3. Warm up and fire a Breakaway over two enemies: three hits, then an Evade step.
4. Brace the HC next to an enemy and watch Trample swap them; brace the LC and see an enemy turn Pursued.
5. Find a braced Heavy Anti-Cavalry and check the move preview warns of the spear before you commit.
Then one 7v7: attack a braced Heavy Melee from your flag with your holder: no parry.

## Report back
- The tables in Measurements 1–4, and the watch-list numbers.
- The bot-minimum numbers.
- The double-knockout count.
- Every judgement call on screens (phone 390 wide: the Charge and Breakaway previews fit?).
- Any `ASK` raised for a case the Laws don't cover.

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
