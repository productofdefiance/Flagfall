/* Flagfall Arena — squad rules and the squad checks (Brief 030; Game Laws 2.2 and 2.16).
   One function decides whether a lineup may start: the Lineup screen, Random, the rematch and the watch link all call
   check() (or checkLineup()), so no path can start an illegal match. Brief 012 (Cavalry) calls the same function.
   No screen code and no rule of play: the engine never sees the squad rule. Mounted units, weight (Heavy/Light) and
   unit cap come from the unit data, never from a list of codes. */
(function (root) {
  "use strict";

  /** The six squad rules (2.16), in the New game screen's order. */
  const RULES = [
    { id: "open", label: "Open", help: "Any unit, both sides." },
    { id: "light", label: "Light only", help: "Light units only, both sides." },
    { id: "heavy", label: "Heavy only", help: "Heavy units only, both sides." },
    { id: "foot", label: "Foot only", help: "No mounted units." },
    { id: "cavalry", label: "Cavalry only", help: "Mounted units and exactly one foot unit, both sides." },
    { id: "random", label: "Random", help: "Both lineups are drawn from the seed. Straight to deployment." }
  ];
  const ruleOf = (id) => RULES.find((r) => r.id === id) || RULES[0];
  const label = (id) => ruleOf(id).label;
  const isRule = (id) => RULES.some((r) => r.id === id);

  /** A mounted unit: the card says so (`mounted: true`), or its icon is a Cavalry icon (not Anti-Cavalry). */
  const isMounted = (c) => !!c && (c.mounted === true || (c.mounted !== false && /cav/i.test(c.icon || "") && !/anticav/i.test(c.icon || "")));
  const isFoot = (c) => !!c && !isMounted(c);
  /** Heavy or Light: the card's `weight`, else its icon's first word, else its hex cost (Light units move for half). */
  const weightOf = (c) => (c.weight ? (/^l/i.test(c.weight) ? "Light" : "Heavy") : /^heavy/i.test(c.icon || "") ? "Heavy" : /^light/i.test(c.icon || "") ? "Light" : c.hexCost < 1 ? "Light" : "Heavy");
  const ucOf = (c) => (c && c.beings) || 1;
  /** Game Laws 2.1: mounted units (and Cavalry only) need 9v9 or 13v13. */
  const cavalryFormat = (size) => size >= 9;
  const hasMounted = (rs) => Object.values(rs.cards || {}).some(isMounted);

  /** Why the rule forbids this card outright (a locked row), or null. Random plays as Open for the check. */
  function forbidden(rs, code, rule, size) {
    const c = rs.cards[code];
    if (!c) return "Not in this rule set";
    if (isMounted(c) && !cavalryFormat(size)) return "Mounted units need 9v9 or 13v13";
    if (rule === "light" && weightOf(c) !== "Light") return "Squad rule: Light only";
    if (rule === "heavy" && weightOf(c) !== "Heavy") return "Squad rule: Heavy only";
    if (rule === "foot" && isMounted(c)) return "Squad rule: Foot only";
    return null;
  }
  /** Every card counted once per unit in a pick ({ keeper, counts }); the old presets' Flagkeeper counts as a unit. */
  function units(pick) {
    const out = {};
    if (pick && pick.keeper) out[pick.keeper] = 1;
    for (const c in (pick && pick.counts) || {}) if (pick.counts[c] > 0) out[c] = (out[c] || 0) + pick.counts[c];
    return out;
  }
  const footCount = (rs, pick) => { const u = units(pick); let n = 0; for (const c in u) if (isFoot(rs.cards[c])) n += u[c]; return n; };
  const used = (rs, pick) => { const u = units(pick); let n = 0; for (const c in u) n += u[c] * ucOf(rs.cards[c]); return n; };

  /** The Lineup row's state for one card: { locked: reason|null, canAdd } with the pick as it stands. Under Cavalry
      only the foot rows lock once one foot unit is in (the row holding it stays, without +). */
  function row(rs, code, rule, size, pick) {
    const why = forbidden(rs, code, rule, size), u = units(pick), n = u[code] || 0;
    if (why) return { locked: why, canAdd: false };
    const c = rs.cards[code];
    let canAdd = used(rs, pick) + ucOf(c) <= size;
    if (rule === "cavalry" && isFoot(c) && footCount(rs, pick) >= 1) {
      if (!n) return { locked: "Squad rule: Cavalry only", canAdd: false };
      canAdd = false;
    }
    return { locked: null, canAdd };
  }

  /** The squad check (2.2, 2.16). Returns { status: "ok" | "short" | "blocked", reason, short, used, size }.
      Blocked reasons, first that applies: a forbidden unit, over the cap, Cavalry only's foot count, no foot unit.
      A legal lineup below its cap is "short" (it may start after a warning). */
  function check(rs, size, pick, rule) {
    rule = isRule(rule) ? rule : "open";
    const u = units(pick), n = used(rs, pick), out = { status: "ok", reason: null, short: 0, used: n, size };
    const block = (reason) => Object.assign(out, { status: "blocked", reason });
    if (rule === "cavalry" && !cavalryFormat(size)) return block("Cavalry only needs 9v9 or 13v13.");
    for (const code of Object.keys(rs.cards).concat(Object.keys(u).filter((c) => !rs.cards[c]))) {
      if (!u[code]) continue;
      const why = forbidden(rs, code, rule, size);
      if (why) return block(rs.cards[code] ? `${rs.cards[code].name} is not allowed ${/^Mounted/.test(why) ? "at " + size + "v" + size : "under " + label(rule)}. Remove it to start.` : `${code} is not in this rule set. Remove it to start.`);
    }
    if (n > size) return block(`${n - size} UC over the unit cap. Remove ${n - size === 1 ? "a unit" : "units"} to start.`);
    const foot = footCount(rs, pick);
    if (rule === "cavalry" && foot > 1) return block("Cavalry only allows exactly one foot unit. Remove one to start.");
    if (foot < 1) return block("Add one foot unit to hold your flag.");
    if (n < size) Object.assign(out, { status: "short", short: size - n });
    return out;
  }
  /** The same check on a lineup in the engine's form ([{ id, card, fk? }]). */
  function checkLineup(rs, size, lineup, rule) {
    const pick = { keeper: null, counts: {} };
    for (const x of lineup || []) pick.counts[x.card] = (pick.counts[x.card] || 0) + 1;
    return check(rs, size, pick, rule);
  }

  /** Make a bot's pick legal under the rule without changing a legal one: forbidden units become the first allowed
      foot card (Heavy Melee first), a keeper the rule forbids too, then the cap is filled or trimmed. Old presets keep
      their keeper slot. Used for the bot's own lineup (Brief 030 §6); never on a lineup a player picked. */
  function legalise(rs, size, pick, rule) {
    const p = { keeper: pick.keeper || null, counts: Object.assign({}, pick.counts) };
    const ok = (c) => !forbidden(rs, c, rule === "random" ? "open" : rule, size) && isFoot(rs.cards[c]);
    const order = ["HM"].concat(Object.keys(rs.cards)).filter((c, i, a) => rs.cards[c] && a.indexOf(c) === i);
    const filler = order.find(ok);
    if (!filler) return p;
    if (p.keeper && !ok(p.keeper)) p.keeper = filler;
    for (const c of Object.keys(p.counts)) if (p.counts[c] > 0 && forbidden(rs, c, rule === "random" ? "open" : rule, size)) { p.counts[filler] = (p.counts[filler] || 0) + p.counts[c] * ucOf(rs.cards[c]); delete p.counts[c]; }
    let n = used(rs, p);
    while (n > size) { const c = Object.keys(p.counts).reverse().find((x) => p.counts[x] > 0); p.counts[c]--; n -= ucOf(rs.cards[c]); }
    while (n < size && n + ucOf(rs.cards[filler]) <= size) { p.counts[filler] = (p.counts[filler] || 0) + 1; n += ucOf(rs.cards[filler]); }
    if (footCount(rs, p) < 1) { const c = Object.keys(p.counts).reverse().find((x) => p.counts[x] > 0); if (c) { p.counts[c]--; p.counts[filler] = (p.counts[filler] || 0) + 1; } }
    return p;
  }
  /** Cavalry only (2.16): mounted units in turn, Heavy first, plus exactly one foot unit (the brain's `cavalryFoot`,
      else Heavy Anti-Cavalry, else the first foot card). Fills the cap as far as the cards' UC allow. */
  function cavalryCounts(rs, size, brain) {
    const cards = Object.keys(rs.cards), mounted = cards.filter((c) => isMounted(rs.cards[c])).sort((a, b) => (weightOf(rs.cards[a]) === "Heavy" ? 0 : 1) - (weightOf(rs.cards[b]) === "Heavy" ? 0 : 1));
    const want = brain && brain.cavalryFoot, foot = [want, "HA"].concat(cards).find((c) => c && rs.cards[c] && isFoot(rs.cards[c]));
    const counts = {}; if (foot) counts[foot] = 1;
    let n = foot ? ucOf(rs.cards[foot]) : 0, i = 0, idle = 0;
    while (mounted.length && idle < mounted.length) {
      const c = mounted[i % mounted.length]; i++;
      if (n + ucOf(rs.cards[c]) <= size) { counts[c] = (counts[c] || 0) + 1; n += ucOf(rs.cards[c]); idle = 0; } else idle++;
    }
    return { keeper: null, counts };
  }

  const api = { RULES, ruleOf, label, isRule, isMounted, isFoot, weightOf, ucOf, cavalryFormat, hasMounted, forbidden, row, check, checkLineup, legalise, cavalryCounts, used, footCount };
  if (typeof module !== "undefined") module.exports = api; else root.GGSquad = api;
})(this);
