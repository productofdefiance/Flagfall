/* Flagfall Arena — default rule set.
   Every number here can be edited on the board's "Unit data" and "Rules" screens.
   This file is only the starting point used when no saved rule set exists. */
(function (root) {
  const DEFAULT_RULESET = {
    id: "match3",
    name: "Match 3 rules",
    note: "Rules as played in match 3 (2026-11-16).",
    game: {
      command: 10,              // Command per turn
      firstTurnCommand: 6,      // the first player's first turn
      stamina: 3,               // Stamina per unit per turn
      attackCost: 1,            // Stamina and Command for an attack or a pull
      braceCost: 1,             // Stamina and Command to brace
      braceReduction: 1,        // damage taken off every hit on a braced unit
      staminaAfterBrace: 2,     // Stamina a braced unit starts its next turn with (v3.4 on: braceTiredness instead)
      staminaFloor: 1,          // no unit starts its turn below this, whatever stacks (Brief 013)
      supportBonus: 1,          // added when another attacker is adjacent to the target
      dodgeDivisor: 4,          // Dodge takes 1 off per this many points of incoming Strength
      reachPenalty: 1,          // Reach attacks do this much less
      tackleCost: 1,            // extra Stamina to leave contact with an enemy Melee unit
      keeperHomeReduction: 2,   // Flagkeeper at home takes this much less from every hit
      keeperPullReduction: 2,   // pulls on its flag do this much less while the keeper is home
      keeperCapPenalty: 1,      // the Flagkeeper's movement cap is this much lower
      goalZoneReduction: 1,     // any other defender in its own goal zone takes this much less
      minDamage: 1,             // every hit and pull does at least this
      poleHP: 15,               // flagpole HP
      turnLimit: 25,            // turns per player
      deployRadius: 3           // deploy within this many hexes of your own flag
    },
    switches: {
      tkoNeedsKeeper: true,           // TKO only when the Flagkeeper has fallen too
      defenderSupport: false,         // defenders get 1 less when a friend is adjacent (off since match 3)
      captureTriggersSpike: true,     // a capture counts as entering a hex (ruled in match 3)
      rangedHalfWhenAdjacent: true    // a Ranged unit with an enemy adjacent uses half Strength
    },
    // Unit cards. hexCost: Stamina per hex. cap: most hexes per turn.
    // stamina (optional): the card's own base Stamina; a card without one uses game.stamina (Brief 013).
    // zone: projects Zone of Control at all times.
    // trait: tackle | reach | ignoreArmor | none
    // icon: which unit-type symbol the token shows (the skin decides how it is drawn).
    // reload: cannot attack on a turn straight after one in which it attacked.
    // brace: what bracing adds on top of the shared reduction:
    //   parry | dodgeDouble | spike | zone | fullStamina | noSupport | none
    cards: {
      HM: { icon: "heavyMelee", name: "Heavy Melee",        hp: 12, str: 5, range: 1, armor: 2, dodge: false, hexCost: 1,   cap: 3, zone: true,  trait: "tackle",      brace: "parry",       reload: false, beings: 1 },
      LM: { icon: "lightMelee", name: "Light Melee",        hp: 8,  str: 4, range: 1, armor: 0, dodge: true,  hexCost: 0.5, cap: 4, zone: false, trait: "tackle",      brace: "dodgeDouble", reload: false, beings: 1 },
      HR: { icon: "heavyRanged", name: "Heavy Ranged",       hp: 8,  str: 5, range: 4, armor: 1, dodge: false, hexCost: 1,   cap: 3, zone: false, trait: "ignoreArmor", brace: "zone",        reload: true, beings: 1 },
      LR: { icon: "lightRanged", name: "Light Ranged",       hp: 6,  str: 3, range: 3, armor: 0, dodge: true,  hexCost: 0.5, cap: 4, zone: false, trait: "none",        brace: "fullStamina", reload: false, beings: 1 },
      HA: { icon: "heavyAntiCav", name: "Heavy Anti-Cavalry", hp: 11, str: 4, range: 1, armor: 2, dodge: false, hexCost: 1,   cap: 3, zone: true,  trait: "reach",       brace: "spike",       reload: false, beings: 1 },
      LA: { icon: "lightAntiCav", name: "Light Anti-Cavalry", hp: 8,  str: 3, range: 1, armor: 0, dodge: true,  hexCost: 0.5, cap: 4, zone: false, trait: "reach",       brace: "noSupport",        reload: false, beings: 1 }
    },
    spikeDamage: 2,  // a braced Heavy Anti-Cavalry's damage to the first enemy entering next to it
    parryDamage: 1,  // a braced Heavy Melee's damage to an adjacent attacker that hits it
    // Default lineup: one Flagkeeper (uses the HM card) and four others.
    lineup: [
      { id: "FK", card: "HM", fk: true },
      { id: "HM", card: "HM" },
      { id: "HA", card: "HA" },
      { id: "LM", card: "LM" },
      { id: "LR", card: "LR" }
    ]
  };

  /* Rule set v1 (the Editor, 2026-11-16 15:48): the bigger scale. Two graded dice, half points, room Dodge,
     Support per helper, parry as 20% of the attacker's Strength, goalie keeper (no damage reduction at home). */
  const V1 = {
    id: "v1",
    name: "v1 (2026-11-16 15:48)",
    note: "Bigger scale: HM 20/10/Armor 3, LR 12/7 benchmarks; two dice graded; half points; Dodge 5% per open hex, after the roll; Support +1 per helper; Brace 2; parry 20% of attacker Strength; set spear 2 to the first enemy; Reach -1; keeper is a goalie; flag 30 HP, keeper pull reduction 4.",
    game: {
      command: 10, firstTurnCommand: 6, stamina: 3, attackCost: 1, braceCost: 1,
      braceReduction: 2, staminaAfterBrace: 2, staminaFloor: 1, supportBonus: 1, dodgeDivisor: 4, dodgePerHex: 5,
      reachPenalty: 1, tackleCost: 1, keeperHomeReduction: 0, keeperPullReduction: 4, keeperCapPenalty: 1,
      goalZoneReduction: 0, minDamage: 1, poleHP: 30, turnLimit: 25, deployRadius: 3
    },
    switches: {
      tkoNeedsKeeper: true, defenderSupport: false, captureTriggersSpike: true, rangedHalfWhenAdjacent: true,
      dice2d6: true, halfPoints: true, dodgeRoom: true, supportPerUnit: true
    },
    cards: {
      HM: { icon: "heavyMelee", name: "Heavy Melee",        hp: 20, str: 10, range: 1, armor: 3, dodge: false, hexCost: 1,   cap: 3, zone: true,  trait: "tackle",      brace: "parry",       reload: false, beings: 1 },
      LM: { icon: "lightMelee", name: "Light Melee",        hp: 16, str: 9,  range: 1, armor: 0, dodge: true,  hexCost: 0.5, cap: 4, zone: false, trait: "tackle",      brace: "dodgeDouble", reload: false, beings: 1 },
      HR: { icon: "heavyRanged", name: "Heavy Ranged",      hp: 14, str: 9,  range: 4, armor: 2, dodge: false, hexCost: 1,   cap: 3, zone: false, trait: "ignoreArmor", brace: "zone",        reload: true,  beings: 1 },
      LR: { icon: "lightRanged", name: "Light Ranged",      hp: 12, str: 7,  range: 3, armor: 0, dodge: true,  hexCost: 0.5, cap: 4, zone: false, trait: "none",        brace: "fullStamina", reload: false, beings: 1 },
      HA: { icon: "heavyAntiCav", name: "Heavy Anti-Cavalry", hp: 18, str: 8, range: 1, armor: 3, dodge: false, hexCost: 1,   cap: 3, zone: true,  trait: "reach",       brace: "spike",       reload: false, beings: 1 },
      LA: { icon: "lightAntiCav", name: "Light Anti-Cavalry", hp: 15, str: 8, range: 1, armor: 0, dodge: true,  hexCost: 0.5, cap: 4, zone: false, trait: "reach",       brace: "noSupport",   reload: false, beings: 1 }
    },
    spikeDamage: 2, parryDamage: 2, parryPct: 20,
    lineup: [{ id: "FK", card: "HM", fk: true }, { id: "HM", card: "HM" }, { id: "HA", card: "HA" }, { id: "LM", card: "LM" }, { id: "LR", card: "LR" }]
  };
  /* Rule set v2 (the Editor, 2026-11-16 16:39): v1 with the flag at 25 HP. */
  const V2 = JSON.parse(JSON.stringify(V1));
  V2.id = "v2"; V2.name = "v2 (2026-11-16 16:39)";
  V2.note = "v1 with flag HP 25 (the Editor). Everything else as v1.";
  V2.game.poleHP = 25;
  /* Rule set v3 (the Editor, 2026-11-16 18:11): the flag is a fort.
     No designated Flagkeeper: any one friendly unit may hold its own flag hex (or none). A held flag pools the
     holder's HP with the flag's base 10; hits on the holder are shared in proportion so both fall together; the holder
     can only be attacked from the goal zone and keeps every ability; an empty flag is pulled at full Strength with
     pull Support. Zone of Control is a hard stop for a unit that enters it. TKO = every unit removed. */
  const V3 = JSON.parse(JSON.stringify(V2));
  V3.id = "v3"; V3.name = "v3 (2026-11-16 18:11)";
  V3.note = "Flag holder: no designated keeper; any unit may hold the flag (base 10 HP), HP pooled, hit only from the goal zone; pull Support; hard-stop Zone of Control. v2 numbers otherwise.";
  V3.game.poleHP = 10; V3.game.keeperPullReduction = 0; V3.game.keeperHomeReduction = 0; V3.game.keeperCapPenalty = 0;
  Object.assign(V3.switches, { flagHolder: true, noKeeper: true, pullSupport: true, zoneHardStop: true });
  V3.lineup = [{ id: "HM", card: "HM" }, { id: "HM2", card: "HM" }, { id: "HA", card: "HA" }, { id: "LM", card: "LM" }, { id: "LR", card: "LR" }];
  /* Rule set v3.1 (2026-11-16 22:45): v3 with three engine bugs fixed (red team E1–E3). No rule changes.
     E1: a flag holder that kills an adjacent enemy stays on its flag. E2: the flag-and-holder pool is one number and
     falls only at 0 (shares rounded only for display and when the holder leaves). E3: if both sides are finished in
     one action, the side that acted wins. */
  const V31 = JSON.parse(JSON.stringify(V3));
  V31.id = "v3.1"; V31.name = "v3.1 (2026-11-16 22:45)";
  V31.note = "v3 with bug fixes only: a holder that kills stays on its flag; the pool falls only at 0; a double knockout goes to the side that acted.";
  Object.assign(V31.switches, { holderHoldsHex: true, poolAsOne: true, simultaneousToActor: true });
  /* Rule set v3.2 (Brief 002, 2026-11-17): order of operations. v3.1 plus three rules ruled by the Editor on 17 Nov.
     A unit removed by a hit deals no parry; parry fires on the first attack only each enemy turn (Game Laws 6.3);
     a double knockout goes to the turn-limit tiebreaks instead of the side that acted. */
  const V32 = JSON.parse(JSON.stringify(V31));
  V32.id = "v3.2"; V32.name = "v3.2 (2026-11-17)";
  V32.note = "v3.1 plus: dead units don't parry; parry once per enemy turn; a double knockout goes to the tiebreaks.";
  Object.assign(V32.switches, { parryNeedsSurvivor: true, parryFirstOnly: true, doubleKoToTiebreak: true, simultaneousToActor: false });
  /* Rule set v3.3 (Brief 004, 2026-11-18): Evade and tackle at hex cost (Game Laws 6.5, 6.6), approved for playtest.
     A Light unit whose adjacent attack leaves the target standing may keep moving, each step further from it.
     Breaking tackle costs the leaving unit its own hex cost and uses a hex of its movement cap. */
  const V33 = JSON.parse(JSON.stringify(V32));
  V33.id = "v3.3"; V33.name = "v3.3 (2026-11-18)";
  V33.note = "v3.2 plus: Evade for Light units; tackle costs the leaving unit's hex cost.";
  Object.assign(V33.switches, { evade: true, tackleHexCost: true, tackleUsesCap: true });
  for (const code of ["LM", "LR", "LA"]) V33.cards[code].evade = true;   // the Light class
  /* Rule set v3.4 (Brief 005, 2026-11-18): v3.3 with a turn limit per format. The 25-turn limit was set for 5v5;
     7v7 gets 35 (a first guess, to measure how much of the stalling is the clock). */
  const V34 = JSON.parse(JSON.stringify(V33));
  V34.id = "v3.4"; V34.name = "v3.4 (2026-11-18)";
  V34.note = "v3.3 with a turn limit per format: 5v5 25 turns, 7v7 35 turns.";
  V34.switches.turnLimitByFormat = true;
  V34.game.turnLimit5 = 25; V34.game.turnLimit7 = 35;
  /* Brief 013 (no change in play): from v3.4 on, bracing is stored as a next-turn modifier, "brace tiredness"
     (Stamina it costs next turn), not as a fixed Stamina to start on. 3 − 1 = 2, as before. */
  delete V34.game.staminaAfterBrace; V34.game.braceTiredness = 1;
  /* Rule set v3.5 (Brief 010, Game Laws 6.13, approved for playtest 17 Nov): a little variety in normal rolls.
     Two dice totalling 4–5 take 10% off the hit, 9–10 add 10%; 2, 3, 6–8, 11 and 12 as v3.4. Average unchanged. */
  const V35 = JSON.parse(JSON.stringify(V34));
  V35.id = "v3.5"; V35.name = "v3.5 (2026-11-19)";
  V35.note = "v3.4 plus dice variety: a roll of 4–5 deals 10% less, 9–10 deals 10% more (average unchanged).";
  V35.switches.diceVariety = true;
  const PRESETS = [V1, V2, V3, V31, V32, V33, V34, V35];

  const TRAITS = { tackle: "Tackle", reach: "Reach", ignoreArmor: "Ignores Armor", none: "None" };
  const BRACES = { parry: "Parry", dodgeDouble: "Dodge doubles", spike: "Set spear", zone: "Projects Zone of Control", fullStamina: "Full Stamina next turn", noSupport: "No Support against it", none: "None" };

  // Unit-type symbols. Filled = Heavy, hollow = Light.
  const ICONS = {
    heavyMelee: "Heavy Melee ◼", lightMelee: "Light Melee ◻",
    heavyRanged: "Heavy Ranged ▲", lightRanged: "Light Ranged △",
    heavyCav: "Heavy Cavalry ⏺", lightCav: "Light Cavalry ⊙",
    heavyAntiCav: "Heavy Anti-Cavalry ◆", lightAntiCav: "Light Anti-Cavalry ◇"
  };
  // Used when a saved rule set predates icons.
  const DEFAULT_ICON_BY_CODE = { HM: "heavyMelee", LM: "lightMelee", HR: "heavyRanged", LR: "lightRanged", HC: "heavyCav", LC: "lightCav", HA: "heavyAntiCav", LA: "lightAntiCav" };

  const api = { DEFAULT_RULESET, PRESETS, TRAITS, BRACES, ICONS, DEFAULT_ICON_BY_CODE };
  if (typeof module !== "undefined") module.exports = api; else root.GGData = api;
})(this);
