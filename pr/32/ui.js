/* Flagfall Arena — UI v2 wording and screen logic (Brief 009). No drawing, no rules.
   Everything here reads the engine's state and preview output and turns it into words and numbers the board shows:
   the attack preview (face-off stats, outcome bar, the key), the unit card's ability text, and say() for engine text.
   It never works a number out itself: every value comes from engine.js (pitfall 1). Kept apart from app.js so the
   tests can check it in Node. */
(function (root) {
  "use strict";
  const E = typeof module !== "undefined" ? require("./engine.js") : root.GGEngine;
  const fmt = E.fmt;

  /** Engine text as the player reads it: units are counted in unit cap (UC), never the engine's old word (its own
      words stay unchanged so saved matches replay identically). */
  const say = (t) => String(t).replace(/fewer beings lost/g, "less unit cap lost").replace(/beings lost/g, "unit cap lost");   // being-ok
  /** The word the board must never show (Brief 009, item 8). */
  const BANNED = /beings?/i;   // being-ok

  const sideName = (t) => (t === "N" ? "North" : "South");
  const minus = (n) => "−" + fmt(n);
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many || one + "es"}`;
  const listWords = (xs) => (xs.length <= 1 ? xs.join("") : xs.slice(0, -1).join(", ") + " and " + xs[xs.length - 1]);

  /** A unit's display name: its card's name, numbered when its side has more than one of that card. */
  function unitName(st, u) {
    const c = E.card(st, u), n = c.name || u.card;
    const dup = st.units.some((o) => o !== u && o.team === u.team && o.card === u.card && !o.fk);
    if (u.fk) return n + " (Flagkeeper)";
    if (!dup) return n;
    const num = u.id.replace(/^[A-Z]+/, "");
    return n + " " + (num || "1");
  }
  /** "Your Heavy Melee" for the side to move, "South's Light Melee" for the other side. */
  const whose = (st, u) => (u.team === st.toMove ? "Your " : `${st.names ? st.names[u.team] : sideName(u.team)}'s `) + unitName(st, u);

  // ---------- Outcome bar ----------
  /** The outcome bar's segments from the engine's damage cases ([[damage, chance], ...] in dieCases order): one slot
      per case; neighbours with the same damage merge (their slots and chances add up). A segment that reaches `killAt`
      (the target's HP, or a held flag's pool) kills. Opacity rises with damage: 0.25 for the smallest, 1 for the largest. */
  function outcomeSegments(cases, killAt) {
    const segs = [];
    for (const [dmg, p] of cases) {
      const last = segs[segs.length - 1];
      if (last && Math.abs(last.dmg - dmg) < 1e-9) { last.slots += 1; last.p += p; }
      else segs.push({ dmg, p, slots: 1 });
    }
    const levels = [...new Set(segs.map((s) => s.dmg))].sort((a, b) => a - b);
    for (const s of segs) {
      const i = levels.indexOf(s.dmg);
      s.opacity = levels.length > 1 ? 0.25 + (0.75 * i) / (levels.length - 1) : 1;
      s.kills = killAt !== undefined && killAt !== null && s.dmg >= killAt - 1e-9;
    }
    return segs;
  }
  /** One decimal, as the bar shows chances: 0.02778 → "2.8%". */
  const pct1 = (p) => `${(Math.round(p * 1000) / 10).toFixed(1)}%`;

  // ---------- Changed numbers ----------
  /** Whether a changed number hurts the player whose turn it is: "hurt" (drawn red) or "help" (ink); null if unchanged.
      `owner` is the side the number belongs to; `goodWhenHigher` says whether more is better for its owner. */
  function changeTone(owner, mover, oldV, newV, goodWhenHigher) {
    if (Math.abs(oldV - newV) < 1e-9) return null;
    const betterForOwner = goodWhenHigher ? newV > oldV : newV < oldV;
    return (owner === mover) === betterForOwner ? "help" : "hurt";
  }

  // ---------- Attack preview ----------
  /** Everything the attack preview shows, from the engine's attack option `a` (E.options().attacks) for `u` on `t`.
      Stats: {key, label, val, old?, tone?, red?}; key rows: {icon, name, means, why, red?}. */
  function attackPreview(st, u, t, a) {
    const rs = st.rs, g = rs.game, d = a.detail, mover = st.toMove;
    const uc = E.card(st, u), tc = E.card(st, t);
    const aName = unitName(st, u), tName = unitName(st, t);
    const byUid = (uid) => E.unitByUid(st, uid);
    const kills = (a.killChance || 0) > 1e-9;
    const pv = E.parryPreview(st, u, t);
    const reach = uc.trait === "reach" && uc.range === 1 && E.dist(u.hex, t.hex) === 2;

    // Face-off stats: only numbers that change this attack (Strength always shows).
    const aStats = [], tStats = [];
    const strTone = changeTone(u.team, mover, d.str, d.strAfter, true);
    aStats.push(strTone ? { key: "maul", label: "Strength", old: fmt(d.str), val: fmt(d.strAfter), tone: strTone } : { key: "maul", label: "Strength", val: fmt(d.str) });
    if (d.support > 0) aStats.push({ key: "support", label: "Support", val: "+" + fmt(d.support) });
    if (a.evade) aStats.push({ key: "evade", label: "Evade", val: String(a.evade.hexes) });
    if (d.armor > 0) {
      if (d.pierce) tStats.push({ key: "armor", label: "Armor", old: minus(d.armor), val: "0", tone: changeTone(t.team, mover, d.armor, 0, true) });
      else tStats.push({ key: "armor", label: "Armor", val: minus(d.armor) });
    }
    if (d.brace > 0) tStats.push({ key: "brace", label: "Brace", val: minus(d.brace) });
    if (d.dodge && d.dodge.pct !== undefined) tStats.push({ key: "dodge", label: "Dodge", val: `${d.dodge.pct}%` });
    else if (d.dodge && d.dodge.flat) tStats.push({ key: "dodge", label: "Dodge", val: minus(d.dodge.flat) });
    if (d.defenderSupport) tStats.push({ key: "support", label: "Defender Support", val: minus(d.defenderSupport) });
    if (d.home && d.home.amount) tStats.push({ key: "hex", label: d.home.keeper ? "Keeper at home" : "Goal zone", val: minus(d.home.amount) });
    if (a.pooled) tStats.push({ key: "flag", label: "Flag", val: "+" + fmt(E.flagShown(st, t.team)) });
    if (pv && !pv.used) tStats.push({ key: "parry", label: "Parry", val: fmt(pv.amount), red: true });

    // The key: one row per thing in this attack, attacker side first, then the defender, then what follows a kill.
    const rows = [];
    if (d.halvedBy) {
      const near = d.halvedBy.map(byUid).filter(Boolean);
      rows.push({ icon: "maul", name: "Half Strength", means: "Ranged units have half Strength with an enemy next to them.",
        why: `${listWords(near.map((x) => whose(st, x)))} ${near.length > 1 ? "are" : "is"} next to ${u.team === mover ? "your" : "the"} ${aName}.` });
    }
    if (d.reach) rows.push({ icon: "spear", name: `Reach ${minus(d.reach)}`, means: `Attacks 2 hexes away, for ${fmt(d.reach)} less.`, why: `${tName} is 2 hexes away in a straight line.` });
    if (d.support > 0 || d.noSupport) {
      const sup = d.supporters.map(byUid).filter(Boolean);
      const who = `${listWords(sup.map((x) => whose(st, x)))} ${sup.length > 1 ? "are" : "is"} next to it`;
      if (d.noSupport) rows.push({ icon: "support", name: "Fend", means: "When braced, attackers get no Support against it.", why: `${who}, but ${tName} is braced: no Support.` });
      else rows.push({ icon: "support", name: `Support +${fmt(d.support)}`,
        means: rs.switches.supportPerUnit ? `+${fmt(g.supportBonus)} Strength for each friend next to the target.` : `+${fmt(g.supportBonus)} Strength with a friend next to the target.`,
        why: who + "." });
    }
    if (a.evade) {
      const ev = a.evade;
      let why;
      if (ev.hexes > 0) {
        why = `${fmt(ev.stam)} Stamina left after this attack: up to ${plural(ev.hexes, "hex")}.`;
        if (kills) why += ` Only if ${tName} survives.`;
        if (ev.unsure) why += ` And only if your ${aName} survives the parry.`;
      } else why = say(ev.reason || "No legal step") + ".";
      rows.push({ icon: "evade", name: `Evade ${ev.hexes}`, means: "A Light unit may move away after attacking a unit next to it, with the movement it has left, unless it kills.", why });
    }
    if (d.armor > 0 && d.pierce) rows.push({ icon: "armor", name: "Pierce", means: `${uc.name} shots ignore Armor.`, why: `${tName}'s Armor ${minus(d.armor)} doesn't count.` });
    else if (d.armor > 0) rows.push({ icon: "armor", name: "Armor", means: "Heavy units take less from every hit.", why: `${tName}: ${minus(d.armor)}.` });
    if (d.brace > 0) rows.push({ icon: "brace", name: "Brace", means: `A braced unit takes ${fmt(d.brace)} less.`, why: `${tName} braced last turn: ${minus(d.brace)}.` });
    if (d.dodge && d.dodge.pct !== undefined) rows.push({ icon: "dodge", name: "Dodge", means: "Light units dodge part of a hit, more with open ground around them.",
      why: `${d.dodge.pct}%: ${plural(d.dodge.open, "open hex", "open hexes")} next to it${d.dodge.doubled ? ", doubled by Weave (braced)" : ""}.` });
    else if (d.dodge && d.dodge.flat) rows.push({ icon: "dodge", name: "Dodge", means: `Light units take 1 off for every ${fmt(d.dodge.per)} Strength of a hit.`, why: `${tName}: ${minus(d.dodge.flat)}.` });
    if (d.defenderSupport) rows.push({ icon: "support", name: "Defender Support", means: "A defender with a friend next to it takes 1 less.", why: `${tName} has a friend next to it: −1.` });
    if (d.home && d.home.amount) rows.push({ icon: "hex", name: d.home.keeper ? "Keeper at home" : "Goal zone",
      means: d.home.keeper ? `The Flagkeeper takes ${fmt(d.home.amount)} less in its own goal zone.` : `A defender in its own goal zone takes ${fmt(d.home.amount)} less.`, why: `${tName} is in its goal zone: ${minus(d.home.amount)}.` });
    if (pv) {
      const what = +rs.parryPct > 0 ? `${fmt(rs.parryPct)}% of the attacker's Strength` : `${fmt(rs.parryDamage)} damage`;
      const means = `A braced ${tc.name} hits back at ${rs.switches.parryFirstOnly ? "the first melee attacker each turn" : "a melee attacker that hits it"}: ${what}.`;
      if (pv.used) rows.push({ icon: "parry", name: "Parry", means, why: "Already parried this turn: no parry." });
      else rows.push({ icon: "parry", name: "Parry", red: true, means, why: `You take ${fmt(pv.amount)}${pv.ifSurvives ? " if it survives the hit" : ""}.` });
    }
    if (a.pooled) rows.push({ icon: "flag", name: "Holding the flag", means: "Its HP pools with the flag's; both fall together.",
      why: `Pool ${fmt(a.effHp)}: flag ${fmt(E.flagShown(st, t.team))} + ${tName} ${fmt(E.hpShown(st, t))}.` });
    if (a.capture && kills) {
      const near = a.capture.adjacentEnemies.map((id) => st.units.find((x) => x.team === t.team && x.id === id)).filter(Boolean);
      rows.push({ icon: "hex", name: "If it kills", means: "The attacker moves into the target's hex.",
        why: `${u.team === mover ? "Your" : "The"} ${aName} moves into ${a.capture.hex}${near.length ? `, next to ${listWords(near.map((x) => whose(st, x)))}` : ""}.` });
      if (a.capture.spike) {
        const sp = near.find((x) => x.braced && E.card(st, x).brace === "spike" && !x.spikeUsed);
        rows.push({ icon: "spear", name: "Set Spear", means: `A braced ${sp ? E.card(st, sp).name : "Heavy Anti-Cavalry"} deals ${fmt(rs.spikeDamage)} to an enemy that steps next to it.`,
          why: `If it kills, ${a.capture.hex} is next to a braced ${sp ? unitName(st, sp) : "Heavy Anti-Cavalry"}: you take ${fmt(rs.spikeDamage)}.` });
      }
    }
    return {
      reach, from: u.hex, to: t.hex, cost: g.attackCost,
      attacker: { uid: u.uid, team: u.team, name: aName, hp: E.hpShown(st, u), maxHp: u.maxHp, stats: aStats },
      target: { uid: t.uid, team: t.team, name: tName, hp: E.hpShown(st, t), maxHp: t.maxHp, stats: tStats },
      segments: outcomeSegments(a.cases, a.effHp), pooled: !!a.pooled, rows
    };
  }

  // ---------- Unit card ----------
  /** Type and class from the card's icon (the unit-type symbol), with the card's numbers as a fallback. */
  function typeOf(c) {
    const k = c.icon || "";
    if (/AntiCav/i.test(k)) return "Anti-Cavalry";
    if (/Ranged/i.test(k)) return "Ranged";
    if (/Cav/i.test(k)) return "Cavalry";
    if (/Melee/i.test(k)) return "Melee";
    return c.range > 1 ? "Ranged" : c.trait === "reach" ? "Anti-Cavalry" : "Melee";
  }
  const classOf = (c) => (/^heavy/i.test(c.icon || "") ? "Heavy" : /^light/i.test(c.icon || "") ? "Light" : c.hexCost < 1 ? "Light" : "Heavy");
  /** Reach units attack 2 hexes away; others show their range. */
  const rangeStat = (c) => (c.trait === "reach" && c.range === 1 ? { label: "Reach", val: 2 } : { label: "Range", val: c.range });

  /** The card's abilities in three sections (Trait, Class, Unit), worded for the rule set's own switches and numbers. */
  function cardSections(rs, code) {
    const c = rs.cards[code], g = rs.game, sw = rs.switches || {};
    const type = typeOf(c), cls = classOf(c);
    const trait = [], klass = [], unit = [];
    // Trait (by type)
    if (c.trait === "tackle") {
      const t = sw.tackleHexCost ? `An enemy next to it pays its hex cost again, in Stamina${sw.tackleUsesCap ? " and movement" : ""}, to step away.` : `An enemy next to it pays ${fmt(g.tackleCost)} more Stamina to step away.`;
      trait.push({ name: "Tackle", text: t });
    }
    if (c.range > 1) trait.push({ name: "Volley", text: `Shoots over any unit.${sw.rangedHalfWhenAdjacent ? " Half Strength with an enemy next to it." : ""}` });
    if (c.trait === "reach") trait.push({ name: "Reach", text: `Attacks 2 hexes away, for ${fmt(g.reachPenalty)} less. Can't reach past an enemy.` });
    // Class
    const markText = sw.zoneHardStop ? "Enemies that step next to it stop." : "Enemies that step next to it stop, then may shift one hex.";
    if (c.armor > 0) klass.push({ name: `Armor ${fmt(c.armor)}`, text: `Takes ${fmt(c.armor)} off every hit.` });
    if (c.zone) klass.push({ name: "Mark", text: markText });
    if (c.hexCost < 1) klass.push({ name: "Swift", text: `${c.hexCost === 0.5 ? "Half" : fmt(c.hexCost)} Stamina per hex, up to ${fmt(c.cap)} hexes.` });
    if (c.dodge) klass.push({ name: "Dodge", text: sw.dodgeRoom ? "Dodges part of a hit, more with open ground around it." : `Takes 1 off for every ${fmt(g.dodgeDivisor)} Strength of a hit.` });
    if (c.evade && sw.evade) klass.push({ name: "Evade", text: "After attacking a unit next to it, may move away with the movement it has left." });
    // Unit
    if (c.brace === "parry") unit.push({ name: "Parry", text: `When braced, hits back at ${sw.parryFirstOnly ? "the first melee attacker each turn" : "a melee attacker that hits it"}: ${+rs.parryPct > 0 ? `${fmt(rs.parryPct)}% of the attacker's Strength` : `${fmt(rs.parryDamage)} damage`}.` });
    if (c.brace === "dodgeDouble") unit.push({ name: "Weave", text: "When braced, its Dodge doubles." });
    if (c.brace === "zone") unit.push({ name: "Cover Fire", text: `When braced, projects Mark: ${markText.charAt(0).toLowerCase() + markText.slice(1)}` });
    if (c.trait === "ignoreArmor") unit.push({ name: "Pierce", text: `Its ${c.range > 1 ? "shots" : "attacks"} ignore Armor.` });
    if (c.reload) unit.push({ name: "Reload", text: "Can't attack on the turn after it attacks.", cost: true });
    if (c.brace === "fullStamina") unit.push({ name: "Second Wind", text: "Its brace costs no Stamina next turn." });
    if (c.brace === "spike") unit.push({ name: "Set Spear", text: `When braced, deals ${fmt(rs.spikeDamage)} to an enemy that steps next to it.` });
    if (c.brace === "noSupport") unit.push({ name: "Fend", text: "When braced, attackers get no Support against it." });
    return [
      { head: "Trait", sub: type, items: trait },
      { head: "Class", sub: cls, items: klass },
      { head: "Unit", sub: c.name, items: unit }
    ].filter((s) => s.items.length);
  }
  /** "Ranged · Heavy · 1 UC" */
  const cardTypeLine = (c) => `${typeOf(c)} · ${classOf(c)} · ${fmt(c.beings || 1)} UC`;
  /** The Lineup row's numbers: "HP 20 · Str 10 · Range 1 · Move 3" (Anti-Cavalry: "Reach 2"). */
  const lineupStats = (c) => { const r = rangeStat(c); return `HP ${fmt(c.hp)} · Str ${fmt(c.str)} · ${r.label} ${fmt(r.val)} · Move ${fmt(c.cap)}`; };

  const api = { say, BANNED, unitName, whose, outcomeSegments, pct1, changeTone, attackPreview, typeOf, classOf, rangeStat, cardSections, cardTypeLine, lineupStats };
  if (typeof module !== "undefined") module.exports = api; else root.GGUi = api;
})(this);
