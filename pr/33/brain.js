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

  /* Brain 6 (Brief 007, 2026-11-18): Brain 5 with tuned weights, the clock (the tiebreak standing, weighted more as the
     turn limit nears) and the cost of an attack that leaves no Evade step. Brain 5 stays as it was, so Brief 006's
     numbers stay comparable. */
  const BRAIN_6 = JSON.parse(JSON.stringify(BRAIN_5));
  BRAIN_6.id = "brain6"; BRAIN_6.name = "Brain 6 (knows the clock)";
  BRAIN_6.note = "Brain 5 that knows the turn limit: as the last turn nears it values winning the tiebreak (more flag damage, then fewer units lost), so the side behind pushes and the side ahead keeps its lead. Its 'Keep an Evade step' setting is off by default: switched on, Light units nearly always keep a step, but all-Light games freeze on the clock (Brief 007).";
  Object.assign(BRAIN_6.model, {
    clock: 20,        // value of being ahead on the tiebreak (and cost of being behind) on the last turn
    clockTurns: 5,    // how many turns before the limit the clock starts to count; it grows to full on the last turn
    evade: 0          // cost, per point of the target's expected hit back, of an adjacent attack that leaves no Evade step.
                      // Off by default (Brief 007): at 1, "no legal step" fell from 32% to 7%, but all-Light mirrors ended on
                      // the turn limit 91% (5v5) and 72% (7v7) of the time, against 52% and 40% for Brain 5. The Editor picks (F31).
  });

  /* Brain 7 (Brief 019, 2026-11-20): Brain 5 plus five behaviours about the lead, each behind its own switch in `lead`
     (1 = on, 0 = off). With all five off it plays exactly like Brain 5. Every behaviour is worked out from the board as
     it stands when the plan is made (start of the turn and after each roll); nothing is remembered between turns. */
  const BRAIN_7 = JSON.parse(JSON.stringify(BRAIN_5));
  BRAIN_7.id = "brain7"; BRAIN_7.name = "Brain 7 (keeps its lead)";
  BRAIN_7.note = "Brain 5 that knows when it is ahead on units: it likes even trades when ahead and avoids them when behind, doesn't throw a lead away on lone losing attacks, gathers its spare units and storms the enemy holder together, sends its own holder in when the enemy has only its holder and can't win the race, and regroups when behind while there is time.";
  BRAIN_7.lead = {
    lead: 1,          // B1 Know the lead: value material ratio (units other than the holder, by unit cap and HP left)
    care: 1,          // B2 No bad trades when ahead: a lone attack that likely loses the attacker scores low
    storm: 1,         // B3 Storm together: gather spare units in reach of the enemy goal zone, strike the holder together
    holderJoins: 1,   // B4 The holder joins the storm when the enemy has only its holder and the race check passes
    regroup: 1,       // B5 Regroup when behind, while there are enough turns left
    aheadAt: 1,       // "ahead" means a lead of at least this much material (unit cap × share of HP left)
    leadWeight: 20,   // B1: value of the lead ratio (ours − theirs) ÷ (ours + theirs)
    killChance: 0.5,  // B2: a kill this likely makes a lone attack fine
    aheadCaution: 1.5,// B2: fear of damage taken is multiplied by this when ahead
    stormLead: 1.5,   // B6: when ahead on material and on flag damage, storm only with at least this lead; below it, hold
    stormMin: 2,      // B3: strike the enemy holder when at least this many units can attack it this turn
    gather: 3,        // B3: value per point of flag damage our spare units could do next turn, while storming
    press: 2,         // B3: value per point of damage on the enemy holder's pool (holder HP + flag), while storming
    regroupSpare: 2,  // B5: regroup only if the turns left are at least the turns needed to gather and strike plus this
    together: 2       // B5: cost of each unit with no friend within 2 hexes, while regrouping
  };

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
    pauseMs: ["Pause (ms)", "Pause between its actions on the board, so you can follow them."],
    // Brain 5's value model (Brief 006)
    "model.unit": ["Unit on the field", "Value of having a unit at all. Removing an enemy unit is worth this plus its HP; losing one of ours costs the same."],
    "model.hp": ["Per HP", "Value of each HP point, ours or theirs. Damage dealt and damage taken both count at this rate."],
    "model.pull": ["Per flag point", "Value of each point of damage on the enemy flag (from pulls or hits on its holder), and the cost of each point on ours."],
    "model.risk": ["Fear of damage taken", "How much it counts the damage the enemy can realistically do back next turn: their movement, range and Command; our Armor, Brace, Dodge room and Support. Higher plays safer."],
    "model.pressure": ["Value of threats", "How much it counts the damage it could do on its own next turn. Higher plays more forward."],
    "model.stamina": ["Next turn's Stamina", "Value of each point of Stamina a unit will start next turn with. Bracing costs 1 point (a braced unit starts with 2), so this is what a brace has to beat."],
    "model.advance": ["Advance", "Value of each hex closer to the enemy flag, for every unit except the one holding our flag."],
    "model.home": ["Holder stays home", "Cost of each hex our flag holder is away from our flag."],
    "model.flagDanger": ["Empty flag danger", "Cost of leaving our flag empty where enemy units could pull it down next turn."],
    "model.clock": ["Clock weight", "Value of being ahead on the tiebreak (more flag damage, then fewer units lost), and the cost of being behind, on the last turn. Earlier it counts for less, and nothing before the clock starts."],
    "model.clockTurns": ["Turns of clock pressure", "How many turns before the turn limit the clock starts to count. It grows evenly to the full Clock weight on the last turn. 0 turns the clock off."],
    "model.evade": ["Keep an Evade step", "Cost of an attack by a Light unit, next to its target, that leaves it no legal step to Evade: this many times the damage the target is expected to hit back with next turn. Higher keeps movement, Stamina and Command for the step."],
    // Brain 7 (Brief 019): the lead. The five behaviours are switches: 1 on, 0 off.
    "lead.lead": ["B1 Know the lead (1 on, 0 off)", "Counts material: each unit other than the holder is worth its unit cap times its share of HP left. Values the lead as (ours − theirs) ÷ (ours + theirs), so it likes even trades when ahead and avoids them when behind. B2 to B5 need this on."],
    "lead.care": ["B2 No bad trades when ahead (1 on, 0 off)", "When ahead, an attack that likely loses the attacker next turn scores low, unless a kill is likely or a friend can join it this turn or next."],
    "lead.storm": ["B3 Storm together (1 on, 0 off)", "While storming, values spare units standing where they can reach the enemy goal zone and attack next turn, and doesn't send one unit alone at the enemy holder when more could join next turn."],
    "lead.holderJoins": ["B4 Holder joins the storm (1 on, 0 off)", "When the enemy has only its holder, our holder may leave our flag to storm, but only if the enemy holder can't reach our flag and pull it down first."],
    "lead.regroup": ["B5 Regroup when behind (1 on, 0 off)", "When behind, values keeping units within 2 hexes of a friend and avoids lone losing attacks, while there are enough turns left to gather and come again. Late in the game it commits everything."],
    "lead.aheadAt": ["Ahead by", "It counts as ahead (or behind) when the material lead is at least this much. A full-HP unit of 1 unit cap is worth 1."],
    "lead.leadWeight": ["Lead weight", "Value of the lead ratio, (ours − theirs) ÷ (ours + theirs). Higher trades down harder when ahead."],
    "lead.killChance": ["Kill chance that justifies a lone attack", "When ahead, a lone attack that likely loses the attacker is still fine if it kills at least this often (0.5 = half the time)."],
    "lead.aheadCaution": ["Caution when ahead", "When ahead, its fear of damage taken is multiplied by this. 1 means no extra caution."],
    "lead.stormLead": ["Storm when ahead on both by", "When ahead on material and on flag damage, it storms only with a material lead of at least this; below it, it holds. Ahead on material but not on flag damage, it always storms."],
    "lead.stormMin": ["Strike together with", "It attacks the enemy holder when at least this many units can attack it this turn, or when waiting gains nothing."],
    "lead.gather": ["Gather weight", "While storming: value per point of flag damage its spare units could do next turn from the enemy goal zone."],
    "lead.press": ["Press the holder", "While storming: extra value of each point of damage on the enemy holder and its flag together. Without it, one hit on a braced holder scores about even (the parry back against the share that reaches the flag), so the storm gathers and then waits."],
    "lead.regroupSpare": ["Regroup spare turns", "It regroups only while the turns left are at least the turns needed to gather and strike plus this many."],
    "lead.together": ["Stay together when behind", "While regrouping: cost of each unit with no friend (other than the holder) within 2 hexes."],
    "plan5.beam": ["Plans kept per step", "How many whole-turn plans it keeps while it builds them up, unit by unit. More is slower and looks wider."],
    "plan5.perUnit": ["Choices per unit", "How many of each unit's best activations (move, attack, brace, Evade) it combines into plans."]
  };

  const api = { DEFAULT_BRAINS: { standard: STANDARD, easy: EASY, kitA: KIT_A, kitA2: KIT_A2, kitC: KIT_C, kitB: KIT_B, batchC: KIT_C2, kitD: KIT_D, brain5: BRAIN_5, brain6: BRAIN_6, brain7: BRAIN_7 }, BRAIN_LABELS: LABELS };
  if (typeof module !== "undefined") module.exports = api; else root.GGBrain = api;
})(this);
