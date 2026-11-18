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

  /** Pick the next action for the side to move. Returns {action, reason, score}. */
  function chooseAction(st, B, rnd) {
    rnd = rnd || Math.random;
    const team = st.toMove;
    if (st.phase !== "play") return null;
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

  const api = { chooseAction, squadCounts, deploy, evaluate, threat, flagRisk, bval, typeOf, classOf };
  if (typeof module !== "undefined") module.exports = api; else root.GGBot = api;
})(this);
