/* Flagfall Arena — default brains for the computer opponent.
   A brain is a set of weights: how much the bot cares about each thing when it scores a move.
   Every weight is editable on the board's "Opponent" tab. This file is only the starting point. */
(function (root) {
  const STANDARD = {
    id: "standard",
    name: "Standard",
    note: "First version, 2026-11-16. Plays one action at a time and looks one action ahead.",
    weights: {
      unitBase: 6,        // value of having a unit on the field at all (so a kill is worth this plus its HP)
      keeperBase: 4,      // extra value of the Flagkeeper
      hp: 1,              // value per HP point on a unit
      pull: 2.5,          // value per point of damage on the enemy flagpole (and cost per point on ours)
      danger: 0.7,        // cost per point of damage the enemy could deal next turn (each enemy's best attack or pull)
      pressure: 0.4,      // value per point of damage we could deal on our next turn (the same sum, the other way)
      advance: 0.6,       // field units: value per hex closer to the enemy flag
      engage: 0.25,       // melee field units: value per hex closer to the nearest enemy
      spacing: 0.6,       // Ranged units: cost per hex away from their full range to the nearest enemy
      cohesion: 0.4,      // value per friend next to a unit (counts up to 2)
      keeperHome: 2.5,    // Flagkeeper: cost per hex beyond its leash from the flag
      defend: 1.2,        // Flagkeeper: cost per hex from the flag while enemies are near it
      braceCost: 0.6,     // cost of bracing (it starts next turn with less Stamina)
      endTurnBar: 0.25    // ends its turn when no action is worth more than this
    },
    settings: {
      keeperLeash: 2,             // hexes the Flagkeeper may stray from its flag
      commitKeeperWhenAhead: 2,   // drop the leash when this many units ahead
      lateTurns: 4,               // drop the leash this many turns before the limit when not ahead on pulls
      noise: 0,                   // random wobble added to every score; higher plays sloppier
      pauseMs: 700                // pause between its actions on the board
    }
  };
  const EASY = JSON.parse(JSON.stringify(STANDARD));
  EASY.id = "easy"; EASY.name = "Easy"; EASY.note = "Standard with a lot of random wobble: it often picks a worse move.";
  EASY.settings.noise = 4;

  /* Coaching kit v0, batch A (2026-11-16): Standard plus shared behaviours with Light and Heavy identities.
     A unit's behaviour = global value × its type multiplier × its class multiplier. */
  const KIT_A = JSON.parse(JSON.stringify(STANDARD));
  KIT_A.id = "kitA"; KIT_A.name = "Kit A (Light identity)";
  KIT_A.note = "Coaching kit v0 batch A: Light units keep 2 hexes off until they strike, value open hexes around them, and back off below 40% HP; Heavy units close in and hold.";
  KIT_A.behaviours = { engageDistance: 1, room: 0.6, retreatPoint: 0.3, together: 1 };
  KIT_A.typeMult = { melee: {}, ranged: {}, antiCav: {} };
  KIT_A.classMult = { light: { engageDistance: 2, room: 1, retreatPoint: 1.35, together: 0 }, heavy: { room: 0, retreatPoint: 0.5 } };

  const KIT_A2 = JSON.parse(JSON.stringify(KIT_A));
  KIT_A2.id = "kitA2"; KIT_A2.name = "Kit A2 (cautious Light)";
  KIT_A2.note = "Kit A plus caution: losses on Light units weigh 2.5 times as much, so Light units only strike when it's worth the exposure.";
  KIT_A2.behaviours.caution = 1;
  KIT_A2.classMult.light.caution = 2.5;
  KIT_A2.classMult.heavy.caution = 0.8;

  const KIT_C = JSON.parse(JSON.stringify(STANDARD));
  KIT_C.id = "kitC"; KIT_C.name = "Caution only (test)";
  KIT_C.note = "Standard plus caution alone, to check whether Kit A's other settings add anything.";
  KIT_C.behaviours = { caution: 1 }; KIT_C.typeMult = {}; KIT_C.classMult = { light: { caution: 2.5 }, heavy: { caution: 0.8 } };

  const KIT_B = JSON.parse(JSON.stringify(KIT_C));
  KIT_B.id = "kitB"; KIT_B.name = "Kit B (caution, bracing, teamwork)";
  KIT_B.note = "Coaching kit v0 batch B: caution (Light 2.5, Heavy 0.8), bracing habit, guarding weaker friends and the holder, seeking Support.";
  Object.assign(KIT_B.behaviours, { braceHabit: 1, guard: 1, seekSupport: 1 });

  /* Coaching kit v0, batch C (2026-11-16): Kit B plus a squad picker. Tested and left off: raid (siege value for
     units that could reach the enemy goal zone; lost 21% and 40% to Kit B) and urgency (late-game press or guard;
     neutral, 44% vs 48%). The squad is the measured gain: with Kit B on both sides, heavy squads beat the balanced
     lineup 83% at 7v7 and 88% at 5v5. */
  const KIT_C2 = JSON.parse(JSON.stringify(KIT_B));
  KIT_C2.id = "batchC"; KIT_C2.name = "Kit C (Kit B + heavy squad)";
  KIT_C2.note = "Coaching kit v0 batch C: Kit B's play with its own squad instead of the balanced lineup: 3 HM, 2 HA, 2 HR at 7v7; 2 HM, 2 HA, 1 HR at 5v5.";
  KIT_C2.squad = { 7: { HM: 3, HA: 2, HR: 2 }, 5: { HM: 2, HA: 2, HR: 1 } };

  /* Kit D (Brief 005, 2026-11-18): Kit B plus a turn planner (bot.js planAction). Each planner behaviour can be
     switched off here: focus (remove one enemy at a time), pickWeak (most value per point of damage), fort (two
     attackers in the goal zone, least valuable takes the parry), finish (pull an empty flag; rush a lone holder). */
  const KIT_D = JSON.parse(JSON.stringify(KIT_B));
  KIT_D.id = "kitD"; KIT_D.name = "Kit D (Kit B + turn planner)";
  KIT_D.note = "Plans its whole turn: gangs up on one enemy it can remove, picks off weak units first, cracks a held flag with two attackers, and rushes the flag when only the holder is left. Otherwise plays like Kit B.";
  // pickWeak is off: in testing (about 120 games per format against Kit B, two rounds) it made Kit D worse at 7v7
  // (67% of decisive games with it, 80% without). See Brief 005's Report. Switch it on here to try it.
  KIT_D.planner = { focus: 1, pickWeak: 0, fort: 1, finish: 1 };

  /* Brain 5 (Brief 006, 2026-11-18): plans its whole turn on one value model (bot.js value5 / planTurn5). Built on
     Kit D's ideas but none of its habits: no bracing habit, guard, cohesion or engage pull. Every choice comes from the
     model's weights below, editable on the Opponent screen. */
  const BRAIN_5 = JSON.parse(JSON.stringify(STANDARD));
  BRAIN_5.id = "brain5"; BRAIN_5.name = "Brain 5 (plans its turn)";
  BRAIN_5.note = "Plans its whole turn within its Command and Stamina and scores every plan the same way: what it gains, what it risks next turn, and what it leaves for next turn.";
  BRAIN_5.model = {
    unit: 6,          // value of a unit on the field (a removal is worth this plus its HP)
    hp: 1,            // value per HP, ours or theirs
    pull: 2.5,        // value per point of damage on the enemy flag (and cost on ours)
    risk: 0.7,        // how much it fears the damage the enemy can do back next turn
    pressure: 0.3,    // how much it values the damage it could do on its next turn
    stamina: 0.5,     // value per point of Stamina a unit will start next turn with (a brace costs 1 point)
    advance: 0.3,     // value per hex closer to the enemy flag (units other than the holder)
    home: 2.5,        // holder: cost per hex away from its own flag
    flagDanger: 20    // cost of leaving our empty flag where the enemy could finish it
  };
  BRAIN_5.plan5 = { beam: 3, perUnit: 5 };   // plans kept at each step; activations kept per unit

  const LABELS = {
    unitBase: ["Unit on the field", "Value of having a unit at all, so a kill is worth this plus the unit's HP."],
    keeperBase: ["Flagkeeper bonus", "Extra value of the Flagkeeper, on either side."],
    hp: ["Per HP", "Value per HP point on a unit; damage dealt is worth this per point."],
    pull: ["Per flag point", "Value per point pulled off the enemy flag, and cost per point off ours."],
    danger: ["Danger", "Cost per point of damage the enemy could deal next turn: each enemy's best attack or pull."],
    pressure: ["Pressure", "Value per point of damage it could deal on its next turn: its units' best attacks and pulls."],
    advance: ["Advance", "Field units: value per hex closer to the enemy flag."],
    engage: ["Engage", "Melee field units: value per hex closer to the nearest enemy."],
    spacing: ["Ranged spacing", "Ranged units: cost per hex away from full range to the nearest enemy."],
    cohesion: ["Stay together", "Value per friend next to a unit, counting up to 2."],
    keeperHome: ["Keeper leash", "Flagkeeper: cost per hex beyond its leash."],
    defend: ["Keeper defends", "Flagkeeper: cost per hex from its flag while enemies are within 2 of it."],
    braceCost: ["Brace cost", "Cost of bracing, for the lost Stamina next turn."],
    endTurnBar: ["End-turn bar", "It ends its turn when no action is worth more than this."],
    keeperLeash: ["Leash length (hexes)", "How far the Flagkeeper may stray from its flag before the leash cost starts."],
    commitKeeperWhenAhead: ["Commit keeper when ahead by", "Drop the leash when this many units ahead."],
    lateTurns: ["Late-game turns", "Drop the leash this many turns before the limit when not ahead on pulls."],
    noise: ["Sloppiness", "Random wobble added to every score. 0 always plays its best move."],
    pauseMs: ["Pause (ms)", "Pause between its actions on the board, so you can follow them."]
  };

  const api = { DEFAULT_BRAINS: { standard: STANDARD, easy: EASY, kitA: KIT_A, kitA2: KIT_A2, kitC: KIT_C, kitB: KIT_B, batchC: KIT_C2, kitD: KIT_D, brain5: BRAIN_5 }, BRAIN_LABELS: LABELS };
  if (typeof module !== "undefined") module.exports = api; else root.GGBrain = api;
})(this);
