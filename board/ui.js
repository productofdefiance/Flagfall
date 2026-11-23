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
    const reach = uc.trait === "reach" && uc.range === 1 && E.fieldOf(st).dist(u.hex, t.hex) === 2;

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

  // ---------- Specials (Brief 011) ----------
  const times = (m) => (m === 2 ? "Twice" : m === 1 ? "A normal hit:" : `${fmt(m)} times`);
  /** What a special does, worded from the rule set's numbers (Brief 011, 5e). */
  function specialAbout(rs, kind) {
    const n = (rs.specials && rs.specials[kind]) || {};
    if (kind === "arcHit") return n.mult === 1 ? "A normal hit on every enemy in a 3-hex arc around its target." : `${times(n.mult)} a normal hit on every enemy in a 3-hex arc around its target.`;
    if (kind === "pickOff") return `${times(n.mult)} a normal hit, ${fmt((n.lessPerFriend || 0) * 100)}% less for each friend next to the target (never below ${n.floor === 1 ? "a normal hit" : `${fmt(n.floor)} times a normal hit`}).`;
    if (kind === "bullseye") return `${fmt(n.mult)} times a normal shot, ignoring Armor.`;
    if (kind === "arrowStorm") return `${n.mult === 2 ? "Twice" : fmt(n.mult) + " times"} a normal shot. Dodge doesn't count.`;
    if (kind === "skewer") return n.first === 1 && n.behind === 1 ? "A full hit on the enemy next to it and on the enemy behind that one." : `${fmt(n.first)} times a hit on the enemy next to it and ${fmt(n.behind)} times a hit on the enemy behind that one.`;
    if (kind === "javelin") return `Strikes ${fmt(n.minRange || 2)} or ${fmt(n.maxRange || 3)} hexes away in a straight line, ${n.mult === 2 ? "twice" : fmt(n.mult) + " times"} a normal hit. Over friends, never over enemies.`;
    return "";
  }
  /** The line under the Special list on every card. */
  const specialNote = (rs) => `Warm up one turn (${fmt(rs.game.warmupCost)} Stamina, no attack or brace), fire the next. No dice.`;
  /** The special's multiplier as the key shows it: "×2". */
  const multText = (m) => "×" + fmt(m);
  /** Everything the special's preview shows (Brief 011, 5c), from the engine's preview `p` (E.options().special.targets).
      It reuses the attack preview for the face-off and the key, then makes the outcome one exact number and adds the
      special's own row and the extra targets. */
  function specialPreview(st, u, t, p) {
    const h0 = p.hits[0];
    const a = { detail: h0.detail, cases: [[h0.dmg, 1]], effHp: h0.hpBefore, killChance: h0.kills ? 1 : 0, pooled: false, capture: p.capture, evade: p.evade };
    const pv = attackPreview(st, u, t, a);
    if (h0.dodgeIgnored) {   // Arrow Storm: Dodge doesn't count, so neither its stat nor its key row
      pv.target.stats = pv.target.stats.filter((x) => x.key !== "dodge");
      pv.rows = pv.rows.filter((r) => r.icon !== "dodge");
    }
    const p2 = p.parry && p.parry.by !== t.uid ? E.unitByUid(st, p.parry.by) : null;
    if (p2) pv.rows.push({ icon: "parry", name: "Parry", red: true, means: `A braced ${E.card(st, p2).name} hits back at the first melee attacker each turn. One parry per action.`,
      why: `${unitName(st, p2)} is braced in the arc: you take ${fmt(p.parry.amount)}${p.parry.ifSurvives ? " if it survives the hit" : ""}.` });
    const kind = p.kind, mults = [...new Set(p.hits.map((h) => h.mult))];
    // Brief 017 §8: Strength shows its change struck through (Javelin 8 → 14: Reach −1, then ×2), then the multiplier
    // as its own stat with the special icon. Only with one multiplier; the damage below is the engine's exact number.
    if (mults.length === 1 && h0.mult !== 1) {
      const d = h0.detail, after = d.strAfter * h0.mult;
      pv.attacker.stats = pv.attacker.stats.filter((x) => x.key !== "maul");
      pv.attacker.stats.unshift({ key: "maul", label: "Strength", old: fmt(d.str), val: fmt(after), tone: after < d.str ? "hurt" : "help" }, { key: "special", label: `${p.name} multiplier`, val: multText(h0.mult) });
    }
    const why = h0.why || (kind === "arcHit" ? `${plural(p.hits.length, "enemy", "enemies")} in the arc.` : kind === "skewer" ? (p.hits.length > 1 ? `${unitName(st, E.unitByUid(st, p.hits[1].uid))} is behind ${unitName(st, t)}.` : `Nobody behind ${unitName(st, t)}: a single hit.`) : "No dice: exactly this much.");
    pv.rows.unshift({ icon: "special", name: `${p.name} ${mults.map(multText).join(" / ")}`, means: specialAbout(st.rs, kind), why, special: true });
    pv.special = { kind, name: p.name, arc: p.arc, mult: mults.length === 1 && h0.mult !== 1 ? h0.mult : null, str: h0.detail.str, strAfter: h0.detail.strAfter, extra: p.hits.slice(1).map((h) => { const x = E.unitByUid(st, h.uid); return { uid: x.uid, team: x.team, name: unitName(st, x), hp: E.hpShown(st, x), maxHp: x.maxHp, dmg: h.dmg, kills: h.kills }; }) };
    return pv;
  }

  // ---------- The special sheet (Brief 026, Approved UI v6) ----------
  /** Everything the gold special sheet shows, read from the engine's preview `p` (E.options().special.targets): the
      attacker line (Strength and the multiplier, always), then one row per hit in the engine's hit order with that
      target's own modifiers. A modifier the special ignores is kept and marked `struck` (Arrow Storm's Dodge, Bullseye's
      Armor with Pierce). `pills`: what a kill brings (E.killConsequences, Pick Off only), only if the attacker survives
      the parry the engine reports. `notes`: an Evade that follows, or a parry that hurts the attacker. Nothing computed. */
  function specialSheet(st, u, t, p) {
    const h0 = p.hits[0], mults = [...new Set(p.hits.map((h) => h.mult))];
    // A parry fires only if the parrying unit survives its hit (parryNeedsSurvivor); the engine reports who and how much.
    const parryBy = p.parry && E.unitByUid(st, p.parry.by), parryHit = p.parry && p.hits.find((h) => h.uid === p.parry.by);
    const parryFires = !!(p.parry && !(p.parry.ifSurvives && parryHit && parryHit.kills));
    const removesMe = parryFires && p.parry.amount >= E.effHp(st, u) - 1e-9;
    const rows = p.hits.map((h, i) => {
      const x = E.unitByUid(st, h.uid), d = h.detail, mods = [];
      if (d.support > 0) mods.push({ key: "support", label: "Support", val: "+" + fmt(d.support) });
      if (d.armor > 0) mods.push(d.pierce ? { key: "armor", label: "Armor, doesn't count (Pierce)", val: minus(d.armor), struck: true } : { key: "armor", label: "Armor", val: minus(d.armorTaken || d.armor) });
      if (d.brace > 0) mods.push({ key: "brace", label: "Brace", val: minus(d.brace) });
      if (d.dodge && d.dodge.pct !== undefined && d.dodge.pct) mods.push({ key: "dodge", label: h.dodgeIgnored ? "Dodge, doesn't count" : "Dodge", val: `${d.dodge.pct}%`, struck: !!h.dodgeIgnored });
      else if (d.dodge && d.dodge.flat) mods.push({ key: "dodge", label: "Dodge", val: minus(d.dodge.flat) });
      if (d.defenderSupport) mods.push({ key: "support", label: "Defender Support", val: minus(d.defenderSupport) });
      if (d.home && d.home.amount) mods.push({ key: "hex", label: d.home.keeper ? "Keeper at home" : "Goal zone", val: minus(d.home.amount) });
      if (parryFires && parryBy && parryBy.uid === x.uid) mods.push({ key: "parry", label: "Parry", val: fmt(p.parry.amount), red: true });
      const kc = i === 0 && h.kills && !removesMe ? E.killConsequences(st, u.uid, t.uid, { special: true }) : null;
      return { uid: x.uid, team: x.team, name: unitName(st, x), hp: E.hpShown(st, x), maxHp: x.maxHp, dmg: h.dmg, kills: !!h.kills, mods, pills: kc || [] };
    });
    const notes = [];
    if (p.evade && !h0.kills && !removesMe) notes.push({ key: "evade", text: p.evade.hexes ? `Evade ${p.evade.hexes}: ${fmt(p.evade.stam)} Stamina left after this special, up to ${plural(p.evade.hexes, "hex")}` : `Evade 0: ${say(p.evade.reason || "No legal step")}` });
    if (parryFires) notes.push({ key: "parry", red: true, text: `Parry: you take ${fmt(p.parry.amount)}` + (removesMe ? `, which removes your ${unitName(st, u)}` : "") });
    return { kind: p.kind, name: p.name, attacker: { uid: u.uid, team: u.team, name: unitName(st, u), str: fmt(h0.detail.strAfter), mult: mults.map(multText).join(" / ") },
      rows, notes, parryFires, removesMe };
  }

  // ---------- Phone sheet (Brief 025, Approved UI v5) ----------
  /** The attacker's modifiers as the phone's sheet shows a special (§6.3): Strength, then the multiplier beside it
      ("9 ×1.75"), nothing struck and no second icon. */
  function phoneSpecialStats(pv) {
    const sp = pv.special;
    if (!sp || !sp.mult) return pv.attacker.stats;
    const rest = pv.attacker.stats.filter((x) => x.key !== "maul" && x.key !== "special");
    // F025-1 (the Editor, 21 Nov): never struck. The Strength this hit uses (after Reach or Half Strength), then the
    // multiplier, so the numbers add up to the damage shown; the key says why the Strength changed.
    return [{ key: "maul", label: "Strength", val: fmt(sp.strAfter), mult: multText(sp.mult) }, ...rest];
  }
  /** Everything the phone's flag-pull sheet shows (§6.6), from the engine's pull option (E.options().pull): the puller
      as an attacker (Strength, Support), the flag with its own HP, and the outcome bar over the engine's pull cases.
      The modifiers are read from the engine's own wording of the pull (pullValue().parts), never worked out here. */
  function pullPreview(st, u, pull) {
    const foe = E.foeOf(u.team), left = E.flagShown(st, foe), max = st.rs.game.poleHP;
    const aStats = [], fStats = [];
    for (const part of pull.parts) {
      let m;
      if ((m = /^Strength (.+)$/.exec(part))) aStats.push({ key: "maul", label: "Strength", val: m[1] });
      else if ((m = /^\+(.+) Support$/.exec(part))) aStats.push({ key: "support", label: "Support", val: "+" + m[1] });
      else if ((m = /^[−-](.+) keeper at home$/.exec(part))) fStats.push({ key: "hex", label: "Keeper at home", val: "−" + m[1] });
    }
    return {
      from: u.hex, to: E.fieldOf(st).FLAG[foe], cost: st.rs.game.attackCost,
      attacker: { uid: u.uid, team: u.team, name: unitName(st, u), hp: E.hpShown(st, u), maxHp: u.maxHp, stats: aStats },
      target: { flag: true, team: foe, name: `${sideName(foe)} flag`, hp: left, maxHp: max, stats: fStats },
      segments: outcomeSegments(pull.cases, left)
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
    // Special (Brief 011): once a match, on rule sets with specials
    const special = sw.specials && c.special ? [{ name: E.specialName(c.special), text: specialAbout(rs, c.special), special: c.special }] : [];
    return [
      { head: "Trait", sub: type, items: trait },
      { head: "Class", sub: cls, items: klass },
      { head: "Unit", sub: c.name, items: unit },
      { head: "Special", sub: "Once a match", items: special, note: special.length ? specialNote(rs) : null }
    ].filter((s) => s.items.length);
  }
  /** "Ranged · Heavy · 1 UC" */
  const cardTypeLine = (c) => `${typeOf(c)} · ${classOf(c)} · ${fmt(c.beings || 1)} UC`;
  /** The Lineup row's numbers: "HP 20 · Str 10 · Range 1 · Move 3" (Anti-Cavalry: "Reach 2"). */
  const lineupStats = (c) => { const r = rangeStat(c); return `HP ${fmt(c.hp)} · Str ${fmt(c.str)} · ${r.label} ${fmt(r.val)} · Move ${fmt(c.cap)}`; };

  const api = { specialSheet, phoneSpecialStats, pullPreview, specialAbout, specialNote, specialPreview, say, BANNED, unitName, whose, outcomeSegments, pct1, changeTone, attackPreview, typeOf, classOf, rangeStat, cardSections, cardTypeLine, lineupStats };
  if (typeof module !== "undefined") module.exports = api; else root.GGUi = api;
})(this);
