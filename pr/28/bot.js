/* Flagfall Arena — computer opponent.
   A layer on top of the engine: it only ever asks the engine what is legal and picks one action.
   It never changes rules or state itself. How it thinks is set by a brain (brain.js, editable on the board).

   Method: for every legal action of every unit (and every move followed by its best attack or pull),
   it plays the action on a scratch copy of the match, scores the result, and picks the best.
   Dice are averaged over the rule set's cases (engine dieCases): one d6, or two d6 graded. */
(function (root) {
  "use strict";
  const E = (typeof module !== "undefined") ? require("./engine.js") : root.GGEngine;

  /** Average damage over the rule set's dice (one d6, or two graded d6), with Dodge applied after the roll. */
  function avgDamage(st, value, dodge) {
    return E.dieCases(st).reduce((s, [d, p]) => s + p * E.applyDie(st, value, d, dodge), 0);
  }

  const flagHolderRules = (st) => !!(st.rs.switches && st.rs.switches.flagHolder);
  /** Who plays keeper. A designated Flagkeeper if the lineup has one; under v3 flag-holder rules, the toughest unit
      (by full HP and Armor), so the choice stays the same while the bot looks ahead. */
  function keeperOf(st, team) {
    const mine = E.alive(st).filter((u) => u.team === team);
    const fk = mine.find((u) => u.fk);
    if (fk || !flagHolderRules(st)) return fk || null;
    let best = null, bs = -1;
    for (const u of mine) { const c = E.card(st, u), sc = u.maxHp + 4 * c.armor + (c.zone ? 3 : 0); if (sc > bs || (sc === bs && u.uid < best.uid)) { bs = sc; best = u; } }
    return best;
  }
  const isKeeper = (st, u) => { const k = keeperOf(st, u.team); return !!k && k.uid === u.uid; };

  // ---------- Coaching kit v0: shared behaviours, adjusted per unit type and class ----------
  const typeOf = (c) => (c.trait === "reach" ? "antiCav" : c.range > 1 ? "ranged" : "melee");   // cavalry joins later
  const classOf = (c) => (c.dodge || c.hexCost < 1 ? "light" : "heavy");
  /** A behaviour's value for one unit: global × type multiplier × class multiplier. Missing = the default. */
  function bval(B, st, u, key, dflt) {
    const bh = B.behaviours;
    if (!bh || bh[key] === undefined) return dflt;
    const c = E.card(st, u);
    const tm = (B.typeMult && B.typeMult[typeOf(c)] && B.typeMult[typeOf(c)][key]);
    const cm = (B.classMult && B.classMult[classOf(c)] && B.classMult[classOf(c)][key]);
    return bh[key] * (tm === undefined ? 1 : tm) * (cm === undefined ? 1 : cm);
  }

  /** Can enemy `e` reach striking distance of `hex` on its next turn (ignoring blockers and zones)? */
  function canThreaten(st, e, hex) {
    const c = E.card(st, e), g = st.rs.game;
    const stam = E.status(st, e).stamNext;
    const steps = Math.max(0, Math.min(E.capOf(st, e), Math.floor((stam - g.attackCost) / c.hexCost + 1e-9)));
    const reach = c.range > 1 ? c.range : (c.trait === "reach" ? 2 : 1);
    return E.dist(e.hex, hex) <= steps + reach;
  }

  /** Expected damage of e attacking u (normal positions, no Support counted). */
  function expectedHit(st, e, u) {
    const c = E.card(st, e);
    if (c.reload && e.attackedThis) return 0;
    const from = c.range > 1 ? e.hex : E.NBRS[u.hex][0];
    const b = E.breakdown(st, e, u, from);
    return avgDamage(st, b.value, b.dodge);
  }

  /** What the enemy could do to `team` next turn. Plays out their turn greedily: each enemy acts once,
      picking the attack or pull worth most, and damage piles up on a target so focus fire can kill
      (a unit already "killed" is worth nothing to the next attacker). */
  function threat(st, team, B, ownSide) {
    const foe = E.foeOf(team), w = B.weights;
    const own = E.alive(st).filter((u) => u.team === team);
    const enemies = E.alive(st).filter((e) => e.team === foe);
    const acc = new Map(own.map((u) => [u, 0]));
    const hits = new Map();
    for (const e of enemies) for (const u of own) if (canThreaten(st, e, u.hex)) hits.set(e.uid + ">" + u.uid, expectedHit(st, e, u));
    const goal = [...E.GOAL[team]];
    const pulls = new Map();
    for (const e of enemies) if (goal.some((h) => canThreaten(st, e, h))) pulls.set(e.uid, avgDamage(st, E.pullValue(st, e).value) * w.pull);
    let total = 0;
    const left = new Set(enemies);
    while (left.size) {
      let best = null;
      for (const e of left) {
        for (const u of own) {
          const d = hits.get(e.uid + ">" + u.uid);
          if (d === undefined) continue;
          const a = acc.get(u), hp = E.effHp ? E.effHp(st, u) : u.hp;
          if (a >= hp) continue;
          const dealt = Math.min(d, hp - a);
          // Killing a flag holder brings the flag down too: worth the match, not just a unit.
          const killV = w.unitBase + (u.fk ? w.keeperBase : 0) + (E.isHolder && E.isHolder(st, u) ? w.pull * 20 : 0);
          // Caution (kit): how much this side fears losses on this particular unit. Only for its own units.
          const care = ownSide ? bval(B, st, u, "caution", 1) : 1;
          const v = (dealt * w.hp + (a + d >= hp ? killV : 0)) * care;
          if (!best || v > best.v) best = { e, u, d, v };
        }
        const pv = pulls.get(e.uid);
        if (pv !== undefined && (!best || pv > best.v)) best = { e, u: null, d: 0, v: pv };
      }
      if (!best || best.v <= 0) break;
      total += best.v;
      if (best.u) acc.set(best.u, acc.get(best.u) + best.d);
      left.delete(best.e);
    }
    return total;
  }

  function keeperCommitted(st, team, B) {
    const foe = E.foeOf(team), s = B.settings;
    const mine = E.alive(st).filter((u) => u.team === team).length, theirs = E.alive(st).filter((u) => u.team === foe).length;
    if (mine - theirs >= s.commitKeeperWhenAhead) return true;
    if (st.turn >= E.turnLimit(st) - s.lateTurns && st.pole[foe] <= st.pole[team]) return true;
    return false;
  }

  function position(st, u, team, B, committed) {
    const w = B.weights, foe = E.foeOf(team);
    const enemies = E.alive(st).filter((e) => e.team === foe);
    if (isKeeper(st, u)) {
      const d = E.dist(u.hex, E.FLAG[team]);
      const leash = flagHolderRules(st) ? 0 : B.settings.keeperLeash;   // a flag holder belongs on the flag itself
      let p = committed ? 0 : -w.keeperHome * Math.max(0, d - leash);
      if (enemies.some((e) => E.dist(e.hex, E.FLAG[team]) <= 2)) p -= w.defend * Math.max(0, d - 1);
      if (committed) p -= w.advance * E.dist(u.hex, E.FLAG[foe]);
      return p;
    }
    const c = E.card(st, u);
    let p = -w.advance * E.dist(u.hex, E.FLAG[foe]);
    const kit = !!B.behaviours;
    // Retreat: below its retreat point a unit wants to be out of reach, and stops being drawn to the enemy.
    const retreating = kit && u.hp < bval(B, st, u, "retreatPoint", 0) * u.maxHp;
    if (enemies.length) {
      const near = Math.min(...enemies.map((e) => E.dist(e.hex, u.hex)));
      if (c.range > 1) p -= w.spacing * (Math.abs(near - c.range) + (near === 1 ? 2 : 0));
      else if (!retreating) p -= kit ? w.engage * Math.abs(near - bval(B, st, u, "engageDistance", 1)) : w.engage * near;
    }
    if (retreating) p -= bval(B, st, u, "retreatWeight", 3) * enemies.filter((e) => canThreaten(st, e, u.hex)).length;
    // Room: open hexes around the unit (the engine's own Dodge count; an adjacent enemy blocks three).
    const room = kit ? bval(B, st, u, "room", 0) : 0;
    if (room && E.dodgeRoom) p += room * E.dodgeRoom(st, u).open;
    const friends = E.alive(st).filter((f) => f.team === team && f !== u && E.dist(f.hex, u.hex) === 1).length;
    if (kit) p += w.cohesion * bval(B, st, u, "together", 1) * Math.min(2, friends);
    // Guard allies (kit): stand next to a weaker friend or the flag holder.
    const guard = kit ? bval(B, st, u, "guard", 0) : 0;
    if (guard && E.alive(st).some((f) => f.team === team && f !== u && E.dist(f.hex, u.hex) === 1 && (f.hp < u.hp || (E.isHolder && E.isHolder(st, f))))) p += guard;
    // Under room Dodge a Light unit loses 5% Dodge per friend beside it, so it spreads out instead of clustering.
    else if (c.dodge && st.rs.switches && st.rs.switches.dodgeRoom) p -= w.cohesion * friends;
    else p += w.cohesion * Math.min(2, friends);
    // Goal guard (v3): a held flag can only be attacked from the goal zone, so a friend standing in it takes away an
    // attack hex. Worth goalGuard (default 2) per enemy near our goal zone, counting up to 2.
    if (flagHolderRules(st)) {
      const gg = w.goalGuard === undefined ? 2 : w.goalGuard, goal = E.GOAL[team];
      const near = enemies.filter((e) => [...goal].some((h) => E.dist(e.hex, h) <= 4)).length;
      if (gg && goal.has(u.hex)) p += gg * Math.min(2, near);
      // Come home: while enemies are near our goal zone, every other unit is drawn back toward it (homeGuard per hex,
      // default 0), so a unit with nothing to do up field returns to defend instead of idling.
      const hg = w.homeGuard || 0;
      if (hg && near && !goal.has(u.hex)) p -= hg * Math.min(2, near) * Math.min(...[...goal].map((h) => E.dist(u.hex, h)));
    }
    return p;
  }

  /** Flag risk (v3): an empty flag of ours that enemy units could reach next turn. 10 HP falls to one or two pulls,
      so the cost grows with how much of the flag's remaining HP the reachable enemies could pull, up to the flagRisk
      weight (default 60, about two Heavy units) when they could finish it. A held flag carries no risk here: attacks
      on the holder are already in the threat sum. */
  function flagRisk(st, team, B) {
    if (!flagHolderRules(st) || E.holderOf(st, team)) return 0;
    const left = E.flagLeft(st, team);
    if (left <= 0) return 0;
    const foe = E.foeOf(team), goal = [...E.GOAL[team]];
    let pot = 0;
    for (const e of E.alive(st)) {
      if (e.team !== foe || !goal.some((h) => canThreaten(st, e, h))) continue;
      const c = E.card(st, e);
      pot += avgDamage(st, c.range > 1 ? c.str / 2 : c.str);
    }
    if (!pot) return 0;
    const W = B.weights.flagRisk === undefined ? 60 : B.weights.flagRisk;
    return W * Math.min(1, pot / left);
  }

  /** Siege (kit batch C): how close our units are to finishing the enemy flag next turn. Counts every unit of ours
      (not our own holder) that could reach the enemy goal zone: against an empty flag, their pulls against what is left;
      against a held flag, their hits on the holder against the pool. Worth up to 40 × raid when they could finish it, so
      two units together are worth more than either alone. */
  function siege(st, team, B) {
    const raid = B.behaviours && B.behaviours.raid;
    if (!raid || !flagHolderRules(st)) return 0;
    const foe = E.foeOf(team), goal = [...E.GOAL[foe]], holder = E.holderOf(st, foe);
    const target = holder ? E.effHp(st, holder) : E.flagLeft(st, foe);
    if (target <= 0) return 0;
    let pot = 0;
    for (const u of E.alive(st)) {
      if (u.team !== team || E.isHolder(st, u) || !goal.some((h) => canThreaten(st, u, h))) continue;
      const c = E.card(st, u);
      pot += holder ? expectedHit(st, u, holder) : avgDamage(st, c.range > 1 ? c.str / 2 : c.str);
    }
    return 40 * raid * Math.min(1, pot / target);
  }
  /** Late game (kit batch C): in the last lateTurns turns, a side not ahead on pull damage presses harder and one
      ahead guards harder. Returns multipliers for pressure and danger. */
  function lateGame(st, team, B) {
    const ug = B.behaviours && B.behaviours.urgency;
    if (!ug || st.turn < E.turnLimit(st) - B.settings.lateTurns) return { press: 1, guard: 1 };
    const foe = E.foeOf(team);
    return st.pole[foe] > st.pole[team] ? { press: 1, guard: 1 + ug / 2 } : { press: 1 + ug, guard: 1 };
  }

  /** How good the match looks for `team`. */
  function evaluate(st, team, B) {
    const w = B.weights, foe = E.foeOf(team);
    if (st.result) return st.result.winner === team ? 10000 : st.result.winner ? -10000 : 0;
    let v = 0;
    for (const u of st.units) {
      if (u.hp <= 0) continue;
      const val = w.unitBase + w.hp * u.hp + (u.fk ? w.keeperBase : 0);
      v += u.team === team ? val : -val;
    }
    v += w.pull * (st.pole[foe] - st.pole[team]);
    const committed = keeperCommitted(st, team, B);
    for (const u of E.alive(st)) if (u.team === team) v += position(st, u, team, B, committed);
    const lg = lateGame(st, team, B);
    v -= w.danger * lg.guard * threat(st, team, B, true);
    v += w.pressure * lg.press * threat(st, foe, B, false);
    v -= flagRisk(st, team, B) * lg.guard;
    v += siege(st, team, B) * lg.press;
    return v;
  }

  function tryApply(st, action, die) {
    const s = E.cloneLite(st);
    try { E.apply(s, action, () => die || E.normalDie(st)); return s; } catch (e) { return null; }
  }
  function scoreAction(st, action, team, B, rolls) {
    if (!rolls) { const s = tryApply(st, action); return s ? { v: evaluate(s, team, B), s } : null; }
    let v = 0;
    for (const [d, p] of E.dieCases(st)) { const s = tryApply(st, action, d); if (!s) return null; v += p * evaluate(s, team, B); }
    return { v };
  }

  function describe(st, u, plan) {
    const a = plan.first;
    const t = a.target && E.unitByUid(st, a.target);
    if (a.type === "attack") return `${u.id} attacks ${t.id}`;
    if (a.type === "pull") return `${u.id} pulls the flag`;
    if (a.type === "brace") return `${u.id} braces`;
    if (a.type === "swap") return `${u.id} swaps with ${E.unitByUid(st, a.with).id}`;
    if (a.type === "move") {
      if (plan.then && plan.then.type === "attack") return `${u.id} moves to ${a.to} to attack ${E.unitByUid(st, plan.then.target).id}`;
      if (plan.then && plan.then.type === "pull") return `${u.id} moves to ${a.to} to pull`;
      return `${u.id} moves to ${a.to}`;
    }
    return a.type;
  }

  // ---------- Kit D: turn planner (Brief 005) ----------
  // The rest of the bot picks one action at a time, so it can't coordinate a turn. The planner looks at every attack its
  // units could make this turn (moving first where needed), picks a target the team can remove, commits enough
  // attackers to it, and returns the next step of that plan. It plans again after every action. Anything the plan
  // doesn't cover falls back to Kit B's one-action choice. Each behaviour can be switched off in the brain (B.planner).
  const planMemory = new WeakMap();   // st -> { key, target }: keeps the same target across a turn's steps
  const expOf = (a) => a.cases.reduce((s2, [d, p]) => s2 + d * p, 0);
  /** Every attack each of our units could make this turn: [{u, hex, move (null = from where it stands), t, exp, kill}]. */
  function attackOptions(st, team) {
    const out = [], keeper = keeperOf(st, team);
    for (const u of E.alive(st)) {
      if (u.team !== team || u.done) continue;
      const o = E.options(st, u.uid);
      if (o.evading) continue;
      for (const a of o.attacks) out.push({ u: u.uid, hex: u.hex, move: null, t: a.target, exp: expOf(a), kill: a.killChance, melee: E.dist(u.hex, E.unitByUid(st, a.target).hex) === 1 });
      if (keeper && keeper.uid === u.uid && flagHolderRules(st)) continue;   // our holder never leaves its flag to attack
      for (const h in o.moves) {
        const s1 = tryApply(st, { type: "move", uid: u.uid, to: h });
        if (!s1) continue;
        const u1 = E.unitByUid(s1, u.uid);
        if (!u1 || u1.hp <= 0 || u1.done) continue;
        for (const a of E.options(s1, u.uid).attacks) out.push({ u: u.uid, hex: h, move: h, t: a.target, exp: expOf(a), kill: a.killChance, melee: E.dist(h, E.unitByUid(s1, a.target).hex) === 1 });
      }
    }
    return out;
  }
  /** Value of removing an enemy unit: what the evaluation counts for it, plus (pick off the weak) a little for Light units.
      Bringing down a held flag wins the match. */
  function removalValue(st, t, B) {
    const w = B.weights;
    if (E.isHolder(st, t)) return 1000;
    return w.unitBase + w.hp * t.hp + (B.planner.pickWeak && classOf(E.card(st, t)) === "light" ? 2 : 0);
  }
  /** Commit attackers to target t: best attack per unit, distinct hexes, until the expected damage covers what's needed. */
  function commit(st, B, opts, t, sticky) {
    const need = E.effHp(st, t), sb = st.rs.game.supportBonus || 0, P = B.planner;
    const byUnit = new Map();
    for (const a of opts) if (a.t === t.uid) { const l = byUnit.get(a.u) || []; l.push(a); byUnit.set(a.u, l); }
    const used = new Set(), plan = []; let total = 0;
    const units = [...byUnit.keys()].sort((x, y) => Math.max(...byUnit.get(y).map((a) => a.exp)) - Math.max(...byUnit.get(x).map((a) => a.exp)));
    for (const uid of units) {
      if (total >= need - 1e-9) break;
      const choices = byUnit.get(uid).filter((a) => !used.has(a.hex)).sort((x, y) => y.exp - x.exp || (x.move === null ? -1 : 1));
      if (!choices.length) continue;
      const a = choices[0];
      // Support: a committed attacker that moves in next to the target helps every other committed attack (the ones
      // already standing there are counted in each option's damage already). Moves happen before attacks.
      const helpersIn = plan.filter((p) => p.melee && p.move).length;
      total += a.exp + sb * helpersIn + (a.melee && a.move ? sb * plan.length : 0);
      used.add(a.hex); plan.push(a);
    }
    const killable = total >= need - 1e-9;
    const holder = E.isHolder(st, t);
    if (holder && P.fort) {
      // Crack the fort: at least two attackers in the goal zone, unless one attack is a near-certain kill.
      const sure = plan.some((a) => a.kill >= 0.9);
      if (plan.length < 2 && !sure) return null;
    }
    // Attack order: with fort on, the least valuable attacker goes first and takes the (once per turn) parry.
    const val = (uid) => { const u = E.unitByUid(st, uid); return B.weights.unitBase + B.weights.hp * u.hp; };
    if (P.fort && t.braced && E.card(st, t).brace === "parry") plan.sort((x, y) => val(x.u) - val(y.u));
    else plan.sort((x, y) => y.exp - x.exp);
    const value = removalValue(st, t, B) + (sticky ? 3 : 0);
    return { t, plan, killable, need, total, score: P.pickWeak ? value / Math.max(need, 0.5) : value };
  }
  function planAction(st, B, rnd) {
    const team = st.toMove, foe = E.foeOf(team), P = B.planner;
    const mine = E.alive(st).filter((u) => u.team === team && !u.done);
    if (!mine.length) return null;
    const key = st.turn + team, mem = planMemory.get(st);
    const last = mem && mem.key === key ? mem.target : null;
    // Finish: pull an empty enemy flag whenever a unit can reach it.
    if (P.finish && !E.holderOf(st, foe)) {
      for (const u of mine) {
        const o = E.options(st, u.uid);
        if (o.pull) return { action: { type: "pull", uid: u.uid }, reason: `${u.id} pulls the empty flag`, score: 1 };
      }
      for (const u of mine) {
        const o = E.options(st, u.uid);
        for (const h in o.moves) { const s1 = tryApply(st, { type: "move", uid: u.uid, to: h }); if (s1 && E.options(s1, u.uid).pull) return { action: { type: "move", uid: u.uid, to: h }, reason: `${u.id} moves to ${h} to pull the empty flag`, score: 1 }; }
      }
    }
    // Focus fire / pick off the weak / crack the fort.
    if (P.focus) {
      const opts = attackOptions(st, team);
      const targets = [...new Set(opts.map((a) => a.t))].map((id) => E.unitByUid(st, id));
      const plans = targets.map((t) => commit(st, B, opts, t, last === t.uid)).filter(Boolean);
      let best = plans.filter((p) => p.killable).sort((x, y) => y.score - x.score)[0];
      if (!best) {
        // Nobody can be removed this turn: pile damage onto the enemy closest to removal, but only with attacks
        // Kit B's own scoring doesn't count as harmful (keeps its caution).
        const base = evaluate(st, team, B);
        const pile = plans.filter((p) => p.plan.length).sort((x, y) => (x.need - x.total) - (y.need - y.total))[0];
        if (pile) {
          const ok = pile.plan.filter((a) => {
            const s1 = a.move ? tryApply(st, { type: "move", uid: a.u, to: a.move }) : st;
            if (!s1) return false;
            const r = scoreAction(s1, { type: "attack", uid: a.u, target: a.t }, team, B, true);
            return r && r.v >= base - 1e-9;
          });
          if (ok.length) best = Object.assign({}, pile, { plan: ok });
        }
      }
      if (best && best.plan.length) {
        planMemory.set(st, { key, target: best.t.uid });
        const t = best.t, mover = best.plan.find((a) => a.move && E.unitByUid(st, a.u).hex !== a.move);
        // Moves first, so every attack gets the Support of the others; then attacks in plan order.
        if (mover) return { action: { type: "move", uid: mover.u, to: mover.move }, reason: `${E.unitByUid(st, mover.u).id} moves to ${mover.move} to attack ${t.id}${best.killable ? " (focus)" : ""}`, score: 1 };
        const a = best.plan[0];
        return { action: { type: "attack", uid: a.u, target: t.uid }, reason: `${E.unitByUid(st, a.u).id} attacks ${t.id}${best.killable ? " (focus)" : ""}`, score: 1 };
      }
    }
    // Finish: with only the enemy holder left (or one unit besides it), every unit but our own holder heads for their goal zone.
    if (P.finish) {
      const theirs = E.alive(st).filter((e) => e.team === foe), h = E.holderOf(st, foe);
      if (h && theirs.length <= 2) {
        const keeper = keeperOf(st, team), goal = [...E.GOAL[foe]];
        const dGoal = (hex) => Math.min(...goal.map((g) => E.dist(hex, g)));
        for (const u of mine) {
          if (keeper && keeper.uid === u.uid) continue;
          let bestH = null, bd = dGoal(u.hex);
          for (const hx in E.options(st, u.uid).moves) { const d = dGoal(hx); if (d < bd) { bd = d; bestH = hx; } }
          if (bestH) return { action: { type: "move", uid: u.uid, to: bestH }, reason: `${u.id} heads for the enemy goal zone (finish)`, score: 1 };
        }
      }
    }
    return null;
  }

  // ---------- Brain 5: whole-turn planner on one value model (Brief 006) ----------
  // Every choice (attack, move, brace, Evade, spacing) comes from one score: what the position gains, what it risks next
  // turn, and what it leaves for next turn. No "if X then Y" behaviours. The planner builds whole-turn plans out of unit
  // activations, keeps only the ones the engine accepts (so it never plans what it can't pay for), picks the best, and
  // plans again after every roll of the dice.
  const plan5 = new WeakMap();   // st -> { key, at: st.actions.length when the next step is due, steps }
  const stats5 = { plans: 0, values: 0 };
  /** What the enemy can realistically do to `team` next turn: each enemy that can reach a unit attacks once, within the
      enemy's Command for the turn (movement plus the attack), damage piling up so focus fire can remove a unit, and each
      extra attacker on the same unit adding Support. Our Armor, Brace, Dodge room and holder pool all count (engine). */
  function risk5(st, team, B) {
    const W = B.model, foe = E.foeOf(team), g = st.rs.game;
    const own = E.alive(st).filter((u) => u.team === team), enemies = E.alive(st).filter((e) => e.team === foe);
    const opts = [];
    for (const e of enemies) {
      const ce = E.card(st, e), reach = ce.range > 1 ? ce.range : (ce.trait === "reach" ? 2 : 1);
      for (const u of own) {
        if (!canThreaten(st, e, u.hex)) continue;
        const steps = Math.max(0, E.dist(e.hex, u.hex) - reach);
        opts.push({ e, u, d: expectedHit(st, e, u), cost: g.attackCost + steps * ce.hexCost });
      }
    }
    // greedy: the enemy's most valuable hit first, as long as its Command lasts
    let cmd = g.command, total = 0;
    const acc = new Map(), hits = new Map(), used = new Set();
    for (;;) {
      let best = null;
      for (const o of opts) {
        if (used.has(o.e) || o.cost > cmd + 1e-9) continue;
        const hp = E.effHp(st, o.u), a = acc.get(o.u) || 0;
        if (a >= hp) continue;
        const d = o.d + (hits.get(o.u) || 0) * (g.supportBonus || 0) * 0.5;   // a second attacker brings Support (about half a point after the roll)
        const kill = a + d >= hp;
        const v = Math.min(d, hp - a) * W.hp + (kill ? W.unit + (E.isHolder(st, o.u) ? W.pull * E.flagLeft(st, team) + 50 : 0) : 0);
        if (!best || v / o.cost > best.r) best = { o, v, d, r: v / o.cost };
      }
      if (!best) break;
      total += best.v; cmd -= best.o.cost; used.add(best.o.e);
      acc.set(best.o.u, (acc.get(best.o.u) || 0) + best.d); hits.set(best.o.u, (hits.get(best.o.u) || 0) + 1);
    }
    return total;
  }
  /** One score for a position, from `team`'s side: gained (units, HP, flag), risked (risk5 both ways), next turn
      (Stamina each unit starts with, placement for the goal and for defence). Weights live in the brain (B.model). */
  function value5(st, team, B) {
    stats5.values++;
    const W = B.model, foe = E.foeOf(team);
    if (st.result) return st.result.winner === team ? 1e5 : st.result.winner ? -1e5 : 0;
    let v = 0;
    for (const u of E.alive(st)) {
      const val = W.unit + W.hp * u.hp;
      v += u.team === team ? val : -val;
      if (u.team === team) {
        v += W.stamina * E.status(st, u).stamNext;                        // next turn: Stamina it starts with (2 after a brace)
        if (!isKeeper(st, u)) v -= W.advance * E.dist(u.hex, E.FLAG[foe]); // placement for the goal
        else if (flagHolderRules(st)) v -= W.home * E.dist(u.hex, E.FLAG[team]);   // placement for defence
      }
    }
    v += W.pull * (st.pole[foe] - st.pole[team]);
    v -= W.risk * risk5(st, team, B);
    v += W.pressure * risk5(st, foe, B);
    v -= W.flagDanger * Math.min(1, flagRisk(st, team, Object.assign({}, B, { weights: Object.assign({}, B.weights, { flagRisk: 1 }) })));
    if (W.clock) { const near = clockNear(st, W); if (near > 0) v += W.clock * near * tiebreakOutlook(st, team); }   // Brain 6 (Brief 007): the clock
    return v;
  }
  /** Brain 6 (Brief 007): how close the turn limit is, from 0 (clockTurns or more turns to go) to 1 (the last turn).
      Turns to go counts this one: on the last turn it is 0, so the weight is full. */
  function clockNear(st, W) {
    const H = W.clockTurns > 0 ? W.clockTurns : 0;
    if (!H) return 0;
    const left = E.turnLimit(st) - st.turn;
    return Math.max(0, Math.min(1, 1 - left / H));
  }
  /** Brain 6: expected flag damage `team` could do to the enemy flag on its next turn: hits on the enemy holder (the
      flag's share of the pool, as the engine splits it) or pulls on an empty flag, by every unit that can reach, each once,
      best first, as many as its Command pays for. */
  function flagPotential(st, team) {
    const foe = E.foeOf(team), h = E.holderOf(st, foe), g = st.rs.game, goal = [...E.GOAL[foe]], fl = E.flagLeft(st, foe);
    if (fl <= 0) return 0;
    const pots = [];
    for (const u of E.alive(st)) {
      if (u.team !== team || (h && u.uid === h.uid)) continue;
      // Both a pull and an attack on a held flag are made from its goal zone (engine canPullFrom, canAttackFrom), so the
      // unit must be able to walk into it next turn and still pay for the action.
      const c = E.card(st, u), steps = Math.max(0, Math.min(E.capOf(st, u), Math.floor((E.status(st, u).stamNext - g.attackCost) / c.hexCost + 1e-9)));
      if (!goal.some((x) => E.dist(u.hex, x) <= steps)) continue;
      if (h) pots.push(expectedHit(st, u, h) * fl / (h.hp + fl));
      else pots.push(avgDamage(st, E.pullValue(st, u).value));
    }
    pots.sort((a, b) => b - a);
    return pots.slice(0, Math.max(0, Math.floor(g.command / g.attackCost))).reduce((a, b) => a + b, 0);
  }
  /** Brain 6: the tiebreak as it is likely to finish, from +1 (we win it) to -1 (we lose it). It starts from the standing
      now and moves it by the chance that a side still to play can change it: the enemy's next turn against our lead, our
      next turn against our deficit (each its flag potential against the gap, plus half a point to get past it). Only
      turns still left count, so on the last turn of the second mover it is the standing itself. */
  function tiebreakOutlook(st, team) {
    const foe = E.foeOf(team), s = tiebreakStanding(st, team), lim = E.turnLimit(st);
    const usLeft = lim - st.turn, themLeft = lim - st.turn + (st.first === team ? 1 : 0);
    const gap = Math.abs(st.pole[foe] - st.pole[team]);   // flag damage between the sides; 0 when level
    const p = (pot) => Math.min(1, pot / (gap + 0.5));
    let out = s;
    if (s >= 0 && themLeft > 0) out -= (s > 0 ? 2 : 1) * p(flagPotential(st, foe));
    if (s <= 0 && usLeft > 0) out += (s < 0 ? 2 : 1) * p(flagPotential(st, team));
    return Math.max(-1, Math.min(1, out));
  }
  /** Brain 6: the tiebreak as it stands (Game Laws 2.7, engine tiebreak): +1 if `team` would win it now, -1 if it would
      lose, 0 if level. More damage on the enemy flag first (hits on its holder's pool count, F20), then fewer units lost. */
  function tiebreakStanding(st, team) {
    const w = E.tiebreak(st).winner;
    return w === team ? 1 : w ? -1 : 0;
  }
  const tryAct = (st, a, die) => { const s = E.cloneLite(st); try { E.apply(s, a, () => die || E.normalDie(st)); return s; } catch (e) { return null; } };
  /** Play an attack (and, for an evading Light unit, its best step away) on a copy. Dice: the score is the average over
      the rule set's dice; the plan carries on from the usual roll. Returns { s, acts, v } or null. */
  function attackLine(st, team, B, pre, uid, target) {
    let v = 0;
    for (const [d, p] of E.dieCases(st)) { const s1 = tryAct(st, { type: "attack", uid, target }, d); if (!s1) return null; v += p * value5(s1, team, B); }
    let s = tryAct(st, { type: "attack", uid, target });
    const acts = pre.concat([{ type: "attack", uid, target }]);
    const u = s && E.unitByUid(s, uid);
    if (u && u.hp > 0 && E.options(s, uid).evading) {
      // Evade: the step that scores best, or none
      let best = { s, v: value5(s, team, B), h: null };
      const steps = E.options(s, uid).moves;
      for (const h in steps) { const s2 = tryAct(s, { type: "move", uid, to: h }); if (s2) { const v2 = value5(s2, team, B); if (v2 > best.v) best = { s: s2, v: v2, h }; } }
      if (best.h) { v += best.v - value5(s, team, B); s = best.s; acts.push({ type: "move", uid, to: best.h }); }
      // Brain 6 (Brief 007): an adjacent attack that leaves no legal Evade step (movement, Stamina or Command used up on
      // the approach, tackle, no free hex) leaves the attacker beside a target that can hit back. It costs `evade` times
      // that target's expected hit on it next turn, so the plan prefers approaches that keep a step.
      else if (B.model.evade && !Object.keys(steps).length) { const t = E.unitByUid(s, target); if (t && t.hp > 0) v -= B.model.evade * expectedHit(s, t, u); }
    }
    return s ? { s, acts, v } : null;
  }
  /** Every whole activation of one unit from position st: [{ acts, s, v }]. */
  function activations5(st, team, B, uid) {
    const u = E.unitByUid(st, uid); if (!u || u.hp <= 0 || u.done) return [];
    const o = E.options(st, uid), out = [], add = (x) => { if (x) out.push(x); };
    out.push({ acts: [], s: st, v: value5(st, team, B) });   // do nothing
    if (o.evading) { for (const h in o.moves) { const s1 = tryAct(st, { type: "move", uid, to: h }); if (s1) add({ acts: [{ type: "move", uid, to: h }], s: s1, v: value5(s1, team, B) }); } return out; }
    const fromHere = (s0, pre) => {
      const o0 = E.options(s0, uid);
      for (const a of o0.attacks) add(attackLine(s0, team, B, pre, uid, a.target));
      if (o0.brace) { const s1 = tryAct(s0, { type: "brace", uid }); if (s1) add({ acts: pre.concat([{ type: "brace", uid }]), s: s1, v: value5(s1, team, B) }); }
      if (o0.pull) { let v = 0; for (const [d, p] of E.dieCases(s0)) { const s1 = tryAct(s0, { type: "pull", uid }, d); if (s1) v += p * value5(s1, team, B); } const s1 = tryAct(s0, { type: "pull", uid }); if (s1) add({ acts: pre.concat([{ type: "pull", uid }]), s: s1, v }); }
    };
    fromHere(st, []);
    for (const h in o.moves) {
      const s1 = tryAct(st, { type: "move", uid, to: h }); if (!s1) continue;
      const mv = [{ type: "move", uid, to: h }];
      add({ acts: mv, s: s1, v: value5(s1, team, B) });
      const u1 = E.unitByUid(s1, uid); if (u1 && u1.hp > 0 && !u1.done) fromHere(s1, mv);
    }
    return out;
  }
  /** Replay a list of actions on a copy; null if any is refused (an attack uses the usual roll). */
  function replay5(st, acts) { let s = st; for (const a of acts) { s = tryAct(s, a); if (!s) return null; } return s; }
  function planTurn5(st, B) {
    stats5.plans++;
    const team = st.toMove, P = B.plan5 || {}, K = P.beam || 3, M = P.perUnit || 5;
    let units = E.alive(st).filter((u) => u.team === team && !u.done).map((u) => u.uid);
    const evader = units.find((uid) => E.options(st, uid).evading);   // an Evade is now or never (another unit acting ends it)
    // Each unit's best few activations from the position as it stands
    const menu = new Map();
    for (const uid of units) {
      const acts = activations5(st, team, B, uid).sort((x, y) => y.v - x.v);
      const keep = [], seen = new Set();
      for (const a of acts) { const k = JSON.stringify(a.acts); if (!seen.has(k)) { seen.add(k); keep.push(a); } if (keep.length >= M) break; }
      if (!keep.some((a) => !a.acts.length)) keep.push({ acts: [], s: st, v: 0 });
      menu.set(uid, keep);
    }
    // Beam over the order and choice of activations
    let beam = [{ s: st, steps: [], left: units.slice(), v: value5(st, team, B) }];
    for (let depth = 0; depth < units.length; depth++) {
      const next = [];
      for (const b of beam) {
        const cand = depth === 0 && evader ? [evader] : b.left;
        for (const uid of cand) {
          for (const a of menu.get(uid)) {
            let s2, v2, acts = a.acts;
            if (!acts.length) { s2 = b.s; v2 = b.v; }
            else if (b.s === st) { s2 = a.s; v2 = a.v; }
            else {
              const atk = acts.findIndex((x) => x.type === "attack");
              if (atk >= 0) { const s0 = replay5(b.s, acts.slice(0, atk)); if (!s0) continue; const r = attackLine(s0, team, B, acts.slice(0, atk), uid, acts[atk].target); if (!r) continue; s2 = r.s; v2 = r.v; acts = r.acts; }
              else { s2 = replay5(b.s, acts); if (!s2) continue; v2 = value5(s2, team, B); }
            }
            next.push({ s: s2, v: v2, steps: b.steps.concat(acts), left: b.left.filter((x) => x !== uid) });
          }
        }
      }
      if (!next.length) break;
      next.sort((x, y) => y.v - x.v);
      const kept = [], seen = new Set();
      for (const c of next) { const k = JSON.stringify(c.steps); if (seen.has(k)) continue; seen.add(k); kept.push(c); if (kept.length >= K) break; }
      beam = kept;
    }
    return beam[0];
  }
  /** Brain 5's next action: the next step of its plan, planning again at the start of the turn and after every roll. */
  function chooseAction5(st, B) {
    const key = st.turn + st.toMove;
    let p = plan5.get(st);
    const last = st.actions[st.actions.length - 1];
    const fresh = !p || p.key !== key || p.at !== st.actions.length || (last && (last.type === "attack" || last.type === "pull") && p.rolled !== st.actions.length);
    if (fresh) {
      const best = planTurn5(st, B);
      p = { key, at: st.actions.length, steps: best ? best.steps : [], v: best ? best.v : 0, rolled: st.actions.length };
      plan5.set(st, p);
    }
    const a = p.steps.shift();
    if (!a) return { action: { type: "end" }, reason: "Plan done; ends its turn", score: 0 };
    p.at = st.actions.length + 1; p.rolled = a.type === "attack" || a.type === "pull" ? -1 : p.rolled;
    const u = E.unitByUid(st, a.uid), t = a.target && E.unitByUid(st, a.target);
    const nx = p.steps[0], intent = a.type === "move" && nx && nx.uid === a.uid && nx.type === "attack" ? E.unitByUid(st, nx.target) : null;
    const why = a.type === "attack" ? `${u.id} attacks ${t.id}` : a.type === "move" ? `${u.id} moves to ${a.to}${intent ? ` to attack ${intent.id}` : u.evadeFrom ? " (evade)" : ""}` : a.type === "brace" ? `${u.id} braces` : a.type === "pull" ? `${u.id} pulls` : a.type;
    return { action: a, reason: `${why} (plan: ${p.steps.length + 1} step${p.steps.length ? "s" : ""} left)`, score: p.v };
  }

  /** Pick the next action for the side to move. Returns {action, reason, score}. */
  function chooseAction(st, B, rnd) {
    rnd = rnd || Math.random;
    const team = st.toMove;
    if (st.phase !== "play") return null;
    if (B.model) return chooseAction5(st, B);   // Brain 5
    const base = evaluate(st, team, B);
    const noise = () => (B.settings.noise ? rnd() * B.settings.noise : 0);
    let best = null;
    const kit = !!B.behaviours;
    /** Batch B: extra value an action gets from the unit's behaviours (0 when the playbook has none). */
    const bonus = (u, plan, sBefore) => {
      if (!kit) return 0;
      let b = 0;
      const atk = plan.then && plan.then.type === "attack" ? plan.then : plan.first.type === "attack" ? plan.first : null;
      const sAt = plan.then ? tryApply(sBefore, plan.first) : sBefore;
      if (atk && sAt) {
        const t = E.unitByUid(sAt, atk.target), me = E.unitByUid(sAt, u.uid);
        if (t && me) {
          // Focus fire: prefer a target that is already hurt.
          b += bval(B, st, u, "focus", 0) * 4 * (1 - t.hp / t.maxHp);
          // Target priority: preferred kinds of target.
          const tc = E.card(sAt, t), tp = B.targetPriority || {};
          b += (tp[classOf(tc)] || 0) + (tp[typeOf(tc)] || 0) + (E.isHolder && E.isHolder(sAt, t) ? (tp.holder || 0) : 0);
          // Seek Support: friends next to the target.
          b += bval(B, st, u, "seekSupport", 0) * E.alive(sAt).filter((f) => f.team === team && f.uid !== u.uid && E.dist(f.hex, t.hex) === 1).length;
        }
      }
      if (plan.first.type === "brace") {
        // Bracing habit: brace a unit that is in reach of the enemy.
        const threatened = E.alive(st).some((e) => e.team !== team && canThreaten(st, e, u.hex));
        if (threatened) b += bval(B, st, u, "braceHabit", 0);
      }
      return b;
    };
    const consider = (u, plan, v, sBefore) => {
      const gain = v - base + noise() - (plan.first.type === "brace" ? B.weights.braceCost : 0) + bonus(u, plan, sBefore || st);
      if (!best || gain > best.gain) best = { u, plan, gain };
    };
    // v3.3 Evade is now or never: another unit acting would end it. So a unit that may evade decides first,
    // stepping to its best hex if that scores better than staying put (Brief 004).
    const evader = E.alive(st).find((u) => u.team === team && !u.done && E.options(st, u.uid).evading);
    if (evader) {
      const o = E.options(st, evader.uid);
      let bestMv = null;
      for (const h in o.moves) {
        const mv = { type: "move", uid: evader.uid, to: h }, s1 = tryApply(st, mv);
        if (!s1) continue;
        const gain = evaluate(s1, team, B) - base + noise();
        if (!bestMv || gain > bestMv.gain) bestMv = { mv, gain };
      }
      if (bestMv && bestMv.gain > 0) return { action: bestMv.mv, reason: `${evader.id} evades to ${bestMv.mv.to}`, score: bestMv.gain };
      return { action: { type: "done", uid: evader.uid }, reason: `${evader.id} stays (no better hex to evade to)`, score: 0 };
    }
    if (B.planner) { const pa = planAction(st, B, rnd); if (pa) return pa; }   // Kit D
    for (const u of E.alive(st)) {
      if (u.team !== team || u.done) continue;
      const o = E.options(st, u.uid);
      for (const a of o.attacks) { const act = { type: "attack", uid: u.uid, target: a.target }; const r = scoreAction(st, act, team, B, true); if (r) consider(u, { first: act }, r.v); }
      if (o.pull) { const act = { type: "pull", uid: u.uid }; const r = scoreAction(st, act, team, B, true); if (r) consider(u, { first: act }, r.v); }
      if (o.brace) { const act = { type: "brace", uid: u.uid }; const r = scoreAction(st, act, team, B, false); if (r) consider(u, { first: act }, r.v); }
      // Swaps (kit): only around the flag, so a tired holder can hand over to a fresh unit.
      if (kit && bval(B, st, u, "holderSwap", 0) > 0 && flagHolderRules(st) && o.swaps && o.swaps.length && (u.hex === E.FLAG[team] || o.swaps.some((f) => E.unitByUid(st, f).hex === E.FLAG[team]))) {
        for (const f of o.swaps) { const act = { type: "swap", uid: u.uid, with: f }; const r = scoreAction(st, act, team, B, false); if (r) consider(u, { first: act }, r.v); }
      }
      for (const h in o.moves) {
        const mv = { type: "move", uid: u.uid, to: h };
        const s1 = tryApply(st, mv);
        if (!s1) continue;
        const v1 = evaluate(s1, team, B);
        consider(u, { first: mv }, v1);
        const u1 = E.unitByUid(s1, u.uid);
        if (!u1 || u1.hp <= 0) continue;
        const o1 = E.options(s1, u.uid);
        for (const a of o1.attacks) { const act = { type: "attack", uid: u.uid, target: a.target }; const r = scoreAction(s1, act, team, B, true); if (r) consider(u, { first: mv, then: act }, r.v); }
        if (o1.pull) { const act = { type: "pull", uid: u.uid }; const r = scoreAction(s1, act, team, B, true); if (r) consider(u, { first: mv, then: act }, r.v); }
      }
    }
    if (!best || best.gain <= B.weights.endTurnBar) return { action: { type: "end" }, reason: "Nothing worth doing; ends its turn", score: 0 };
    return { action: best.plan.first, reason: describe(st, best.u, best.plan), score: best.gain };
  }

  /** Where to deploy: keeper on the goal hex facing the field, Heavy units in front, Light and Ranged behind and wide. */
  function deploy(st, team, B, rnd) {
    rnd = rnd || Math.random;
    const zone = E.deployZone(st, team);
    const flag = E.FLAG[team], mid = "E10";
    const forward = (h) => -E.dist(h, mid);                          // closer to the centre spot is more forward
    const central = (h) => -Math.abs(E.parse(h)[0] - 4);              // column E is central
    const units = st.units.filter((u) => u.team === team);
    const taken = new Set(), out = {};
    const keeper = keeperOf(st, team);
    const roleScore = (u, h) => {
      const c = E.card(st, u), jitter = rnd() * 0.6;
      if (flagHolderRules(st) && keeper && u.uid === keeper.uid) return (h === flag ? 20 : -10) + jitter;
      if (flagHolderRules(st) && h === flag) return -50;
      if (u.fk) return (E.GOAL[team].has(h) ? 10 : -10) + forward(h) * 2 + central(h) + jitter;
      if (c.range > 1) return (E.dist(h, flag) === 2 ? 3 : 0) + central(h) * 0.5 + forward(h) * 0.5 + jitter;
      if (c.hexCost < 1) return forward(h) * 1.5 + (Math.abs(E.parse(h)[0] - 4) >= 1 ? 1.5 : 0) + jitter;
      return forward(h) * 2 + central(h) * 1.2 + jitter;
    };
    const order = [...units].sort((a, b) => ((keeper && b.uid === keeper.uid) - (keeper && a.uid === keeper.uid)) || (b.fk - a.fk) || (E.card(st, a).hexCost - E.card(st, b).hexCost));
    for (const u of order) {
      let bestH = null, bestS = -Infinity;
      for (const h of zone) { if (taken.has(h)) continue; const s = roleScore(u, h); if (s > bestS) { bestS = s; bestH = h; } }
      out[u.uid] = bestH; taken.add(bestH);
    }
    return out;
  }

  /** Squad picker (kit batch C): the brain's squad for this format size, as card counts, or null to use the
      balanced lineup. Only for rule sets without a designated keeper, and only if every card exists and the
      beings add up to the format size. */
  function squadCounts(rs, size, B) {
    const want = B && B.squad && B.squad[size];
    if (!want || !(rs.switches && rs.switches.noKeeper)) return null;
    let beings = 0;
    for (const c in want) { if (!rs.cards[c]) return null; beings += want[c] * (rs.cards[c].beings || 1); }
    return beings === size ? Object.assign({}, want) : null;
  }

  const api = { chooseAction, squadCounts, deploy, evaluate, threat, flagRisk, bval, typeOf, classOf, canThreaten, value5, planTurn5, stats5, tiebreakStanding, tiebreakOutlook, flagPotential, clockNear, attackLine5: attackLine };
  if (typeof module !== "undefined") module.exports = api; else root.GGBot = api;
})(this);
