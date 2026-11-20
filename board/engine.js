/* Flagfall Arena — rules engine.
   Pure rules: no drawing, no storage. Every number comes from the rule set (see data.js).
   The board, the replay tests and the future computer opponent all go through this file. */
(function (root) {
  "use strict";

  // ---------- Field geometry: oval of flat-top hexes, columns A-I, rows 1-19 ----------
  const COLS = "ABCDEFGHI";
  const NCOL = 9, NROW = 19;
  const FLAG = { N: "E3", S: "E17" };

  const parse = (h) => [COLS.indexOf(h[0]), parseInt(h.slice(1), 10)];
  const geo = (q, r) => [q, r + (q % 2 ? 0.5 : 0)];
  function cube(q, r) {
    const z = (r - 1) - ((q - (q & 1)) >> 1);
    return [q, -q - z, z];
  }
  function dist(a, b) {
    const ca = cube(...parse(a)), cb = cube(...parse(b));
    return Math.max(Math.abs(ca[0] - cb[0]), Math.abs(ca[1] - cb[1]), Math.abs(ca[2] - cb[2]));
  }
  const CELLS = [];
  for (let q = 0; q < NCOL; q++) {
    const rows = q % 2 ? NROW - 1 : NROW;
    for (let r = 1; r <= rows; r++) {
      const [x, y] = geo(q, r);
      if (((x - 4) / 4.75) ** 2 + ((y - 10) / 9.6) ** 2 <= 1.0) CELLS.push(COLS[q] + r);
    }
  }
  const CELLSET = new Set(CELLS);
  const NBRS = {};
  for (const a of CELLS) NBRS[a] = CELLS.filter((b) => dist(a, b) === 1);
  const GOAL = { N: new Set(NBRS[FLAG.N]), S: new Set(NBRS[FLAG.S]) };
  const deployZone = (st, team) => CELLS.filter((c) => (c !== FLAG[team] || (st.rs.switches && st.rs.switches.flagHolder)) && dist(c, FLAG[team]) <= st.rs.game.deployRadius);
  function straight2(a, b) {
    const ca = cube(...parse(a)), cb = cube(...parse(b));
    const d = [0, 1, 2].map((i) => Math.abs(ca[i] - cb[i])).sort();
    return d[0] === 0 && d[1] === 2 && d[2] === 2;
  }
  const middle = (a, b) => CELLS.find((c) => dist(c, a) === 1 && dist(c, b) === 1);
  /** v3.6 (Brief 015, Game Laws 4.9): is a flag hex (either flag, held or empty) strictly between `from` and `to` on one
      of the six straight hex lines? Off a straight line nothing is ever between. Neither end counts: a unit on a flag
      shoots out from it, and a holder on its flag can be shot. One helper for every line rule (Volley, Reach; later
      Javelin, Vault). */
  function flagBetween(from, to) {
    const a = cube(...parse(from)), b = cube(...parse(to)), d = dist(from, to);
    if (d < 2) return false;
    for (const f of [FLAG.N, FLAG.S]) {
      if (f === from || f === to) continue;
      const c = cube(...parse(f));
      for (let i = 0; i < 3; i++) if (a[i] === b[i] && c[i] === a[i] && dist(from, f) + dist(f, to) === d) return true;
    }
    return false;
  }

  // ---------- Helpers ----------
  const EPS = 1e-9;
  const foeOf = (t) => (t === "N" ? "S" : "N");
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const card = (st, u) => st.rs.cards[u.card];
  const alive = (st) => st.units.filter((u) => u.hp > 0);
  const unitByUid = (st, uid) => st.units.find((u) => u.uid === uid);
  const capOf = (st, u) => card(st, u).cap - (u.fk ? st.rs.game.keeperCapPenalty : 0);
  const fmt = (n) => (Math.round(n * 100) / 100).toString();
  const isMelee = (st, u) => card(st, u).range === 1;
  const sw = (st, k) => !!(st.rs.switches && st.rs.switches[k]);
  /** Nearest half point, a quarter rounding up (only when the rule set uses half points). */
  const half = (x) => Math.floor(x * 2 + 0.5 + 1e-9) / 2;
  const halve = (st, v) => (sw(st, "halfPoints") ? v / 2 : Math.floor(v / 2));

  function fail(msg) { const e = new Error(msg); e.illegal = true; throw e; }
  function log(st, text, kind) { st.log.push({ turn: st.turn, team: st.toMove, text, kind: kind || "info" }); }

  function projects(st, u) {
    const c = card(st, u);
    return c.zone || (u.braced && c.brace === "zone");
  }
  /** Hexes inside a Zone of Control projected by the enemies of `team`. */
  function zoneFor(st, team) {
    const z = new Set();
    for (const u of alive(st)) if (u.team !== team && projects(st, u)) for (const n of NBRS[u.hex]) z.add(n);
    return z;
  }
  function blocked(st, mover) {
    const b = new Set(alive(st).map((u) => u.hex));
    for (const t of ["N", "S"]) if (!(sw(st, "flagHolder") && mover && mover.team === t)) b.add(FLAG[t]);
    return b;
  }
  /** v3 flag holder: the friendly unit standing on its own flag hex, if any. */
  function holderOf(st, team) {
    if (!sw(st, "flagHolder")) return null;
    return alive(st).find((u) => u.team === team && u.hex === FLAG[team]) || null;
  }
  const isHolder = (st, u) => !!u && sw(st, "flagHolder") && u.hp > 0 && u.hex === FLAG[u.team];
  const flagLeft = (st, team) => st.rs.game.poleHP - st.pole[team];
  /** Damage to a unit. A flag holder shares it with its flag in proportion to what each has left, so both reach 0 together. */
  function hurt(st, u, dmg) {
    if (!isHolder(st, u)) { u.hp -= dmg; return ""; }
    if (sw(st, "poolAsOne")) {
      // v3.1 (E2 fix): the pool is one number. It falls only when it reaches 0. The holder's share and the
      // flag's share keep the proportion they had, unrounded; they are rounded only for display and when the holder leaves.
      const P = half(u.hp + flagLeft(st, u.team));
      if (dmg >= P - 1e-9) { st.pole[u.team] = st.rs.game.poleHP; u.hp = 0; return ` (pool ${fmt(P)} → 0: flag and holder fall together)`; }
      const ratio = u.hp / (u.hp + flagLeft(st, u.team)), P2 = half(P - dmg);
      u.hp = P2 * ratio; st.pole[u.team] = st.rs.game.poleHP - (P2 - u.hp);
      const sp = poolSplit(st, u.team);
      return ` (pooled: pool ${fmt(P)} → ${fmt(P2)}; flag ${fmt(sp.flag)} + ${u.id} ${fmt(sp.unit)})`;
    }
    const fl = flagLeft(st, u.team), pool = u.hp + fl;
    if (dmg >= pool - 1e-9) { st.pole[u.team] = st.rs.game.poleHP; u.hp = 0; return ` (pool ${fmt(pool)} → 0: flag and holder fall together)`; }
    const toFlag = half(dmg * fl / pool), toUnit = dmg - toFlag;
    st.pole[u.team] += toFlag; u.hp -= toUnit;
    if (u.hp <= 1e-9 || flagLeft(st, u.team) <= 1e-9) { u.hp = 0; st.pole[u.team] = st.rs.game.poleHP; }
    return ` (pooled: flag −${fmt(toFlag)}, ${u.id} −${fmt(toUnit)}; flag ${fmt(flagLeft(st, u.team))} + ${u.id} ${fmt(Math.max(u.hp, 0))})`;
  }
  /** The pool on a held flag, split into whole half points for display: the holder's share rounds to the
      nearest half (at least 0.5 when the pool allows); the flag shows the rest. Null when the flag is not held. */
  function poolSplit(st, team) {
    const h = holderOf(st, team);
    if (!h) return null;
    const P = half(h.hp + flagLeft(st, team));
    if (!sw(st, "poolAsOne")) return { pool: P, unit: h.hp, flag: flagLeft(st, team) };
    let unit = P <= 0.5 ? 0 : Math.min(Math.max(half(h.hp), 0.5), P - 0.5);   // the flag keeps the last half point
    return { pool: P, unit, flag: P - unit };
  }
  /** v3.1: a holder leaving its flag takes its rounded share; the flag keeps the rest. */
  function leaveFlag(st, u) {
    if (!sw(st, "poolAsOne") || !isHolder(st, u)) return "";
    const sp = poolSplit(st, u.team);
    u.hp = sp.unit; st.pole[u.team] = st.rs.game.poleHP - sp.flag;
    return u.hp <= 0 ? `; ${u.id} leaves the flag with nothing left of the pool — ${u.id} REMOVED` : "";
  }
  /** HP to show for a unit (a holder shows its rounded share of the pool). */
  function hpShown(st, u) { const sp = isHolder(st, u) ? poolSplit(st, u.team) : null; return sp ? sp.unit : Math.max(u.hp, 0); }
  /** Flag HP to show (a held flag shows its rounded share of the pool). */
  function flagShown(st, team) { const sp = poolSplit(st, team); return sp ? sp.flag : flagLeft(st, team); }
  function tackleApplies(st, u, src, dst) {
    if (u.tackled) return false;
    return alive(st).some((e) => e.team !== u.team && card(st, e).trait === "tackle" && dist(e.hex, src) === 1 && dist(e.hex, dst) !== 1);
  }
  const homeOf = (team) => GOAL[team];
  /** v3.3 Evade: the unit attacked, while the attacker may still step away from it; else null. */
  const evadeTarget = (st, u) => (sw(st, "evade") && u.evadeFrom ? unitByUid(st, u.evadeFrom) : null);
  /** Extra Stamina to break tackle: the leaving unit's own hex cost on v3.3 (tackleHexCost), else the flat tackleCost. */
  const tackleCostFor = (st, u) => (sw(st, "tackleHexCost") ? card(st, u).hexCost : st.rs.game.tackleCost);
  /** Hexes of the movement cap that breaking tackle uses up: 1 on v3.3 (tackleUsesCap), else 0. */
  const tackleHexes = (st) => (sw(st, "tackleUsesCap") ? 1 : 0);

  // ---------- Stamina (Brief 013) ----------
  /* A unit's Stamina at the start of its turn is its base Stamina plus every next-turn modifier on it.
     Every modifier states its source ("self": the unit's own action; "enemy": something an enemy did) and its effect
     (a name). Different effects stack; the same effect counts once per turn however often it was triggered. A unit
     never starts its turn below the floor (game.staminaFloor). The turn start, the unit info and the brains all read
     nextStamina() below; nothing keeps its own copy.
     To add a modifier (brief 012: Pursued): give it an entry in STAMINA_EFFECTS with its source, its worst case and,
     if needed, what it cancels; then either derive it in staminaMods() or record it with addStaminaMod(). The floor
     check (tests/test_stamina.js) tries every combination of the entries here on every card of every preset. */
  const STAMINA_EFFECTS = {
    /** Bracing: next turn this much Stamina down (game.braceTiredness; older rule sets: stamina − staminaAfterBrace). */
    braceTiredness: { source: "self", worst: (st) => -braceTiredness(st) },
    /** Second Wind (a "fullStamina" brace, Light Ranged): cancels the unit's own brace tiredness and nothing else. */
    secondWind: { source: "self", cancels: "braceTiredness", worst: () => 0 }
  };
  /** The card's own Stamina, or the rule set's for a card without one. */
  const baseStamina = (st, u) => { const c = card(st, u); return c.stamina !== undefined ? c.stamina : st.rs.game.stamina; };
  /** How much Stamina bracing costs next turn. Rule sets before Brief 013 store the Stamina a braced unit starts with. */
  function braceTiredness(st) {
    const g = st.rs.game;
    return g.braceTiredness !== undefined ? g.braceTiredness : g.staminaAfterBrace !== undefined ? g.stamina - g.staminaAfterBrace : 0;
  }
  /** Lowest Stamina a unit starts its turn on. Rule sets saved before Brief 013 have none, so they replay exactly. */
  const staminaFloor = (st) => (st.rs.game.staminaFloor !== undefined ? st.rs.game.staminaFloor : -Infinity);
  /** Every modifier waiting for this unit's next turn start: the ones its own state implies, then any recorded ones. */
  function staminaMods(st, u) {
    const out = [];
    if (u.braced) {
      out.push({ effect: "braceTiredness", source: "self", amount: -braceTiredness(st) });
      if (card(st, u).brace === "fullStamina") out.push({ effect: "secondWind", source: "self", cancels: "braceTiredness", amount: 0 });
    }
    for (const m of u.staminaMods || []) out.push(m);
    return out;
  }
  /** Records a next-turn modifier on a unit (for effects an enemy triggers). The same effect is kept once. */
  function addStaminaMod(st, u, mod) {
    const had = u.staminaMods || [];   // a new array each time: scratch copies (cloneLite) share the old one
    if (!had.some((m) => m.effect === mod.effect)) u.staminaMods = had.concat([Object.assign({}, mod)]);
  }
  /** Stamina a unit starts its turn on, given its modifiers: base, plus each effect once, less what is cancelled, then
      the floor (a penalty takes it no lower than the floor; a card whose base is already lower keeps its base). */
  function staminaWith(st, u, mods) {
    const once = [], seen = new Set();
    for (const m of mods) if (!seen.has(m.effect)) { seen.add(m.effect); once.push(m); }
    const cancelled = new Set(once.filter((m) => m.cancels).map((m) => m.source + "|" + m.cancels));
    const base = baseStamina(st, u);
    const total = once.reduce((s, m) => s + (cancelled.has(m.source + "|" + m.effect) ? 0 : m.amount || 0), base);
    return Math.max(Math.min(base, staminaFloor(st)), total);
  }
  /** Stamina this unit will start its next turn on. The one source of truth (Brief 013, item 6). */
  const nextStamina = (st, u) => staminaWith(st, u, staminaMods(st, u));

  // ---------- Movement ----------
  /** Every hex the unit can reach now: hex -> {steps, mode, cost, tackle}. */
  function reachMap(st, u) {
    const c = card(st, u), z = zoneFor(st, u.team), b = blocked(st, u);
    const lim = Math.min(u.stam, st.cmd) + EPS;
    const budget = Math.min(capOf(st, u) - u.moved, Math.floor(Math.min(u.stam, st.cmd) / c.hexCost + EPS));
    const ev = evadeTarget(st, u);
    // v3.3 Evade: the first evade move may leave a zone entered this turn; after that the usual hard stop applies.
    const mode0 = ev && !u.evadeMoved ? (z.has(u.hex) ? "startzone" : "free") : (u.zmode || (z.has(u.hex) ? "startzone" : "free"));
    const seen = new Set([u.hex + "|" + mode0]);
    const q = [[u.hex, mode0, 0]];
    const out = {};
    while (q.length) {
      const [h, m, d] = q.shift();
      if (d >= budget || m === "shifted") continue;
      for (const n of NBRS[h]) {
        if (b.has(n)) continue;
        if (ev && dist(n, ev.hex) <= dist(h, ev.hex)) continue;   // v3.3 Evade: every step further from the unit attacked
        const inz = z.has(n);
        let nm;
        if (m === "free") nm = inz ? "entered" : "free";
        else if (m === "startzone") nm = inz ? "shifted" : "free";
        else if (m === "entered") { if (!inz || sw(st, "zoneHardStop")) continue; nm = "shifted"; }
        const key = n + "|" + nm;
        if (seen.has(key)) continue;
        seen.add(key);
        q.push([n, nm, d + 1]);
        if (!out[n] || out[n].steps > d + 1) out[n] = { steps: d + 1, mode: nm };
      }
    }
    const res = {};
    for (const h in out) {
      const tk = tackleApplies(st, u, u.hex, h);
      const cost = out[h].steps * c.hexCost + (tk ? tackleCostFor(st, u) : 0);
      if (tk && out[h].steps + tackleHexes(st) > capOf(st, u) - u.moved) continue;   // v3.3: breaking tackle uses a hex of the cap
      if (cost <= lim) res[h] = { steps: out[h].steps, mode: out[h].mode, cost, tackle: tk };
    }
    return res;
  }

  function spend(st, u, cost) {
    if (u.done) fail(`${u.id} has already ended its turn.`);
    if (u.stam + EPS < cost) fail(`${u.id} has ${fmt(u.stam)} Stamina and needs ${fmt(cost)}.`);
    if (st.cmd + EPS < cost) fail(`Only ${fmt(st.cmd)} Command left; this needs ${fmt(cost)}.`);
    u.stam -= cost; st.cmd -= cost;
  }

  /** A braced Heavy Anti-Cavalry next to `hex` hits a unit entering it, once per turn.
      v3.6 (spearOnArrival, Game Laws 3.13): only a unit arriving next to that spear, i.e. not next to it on `from` (the
      hex before the action), and a unit takes set spear damage at most once per turn; a spear it doesn't take stays loaded. */
  function spikeCheck(st, u, hex, from) {
    const arrival = sw(st, "spearOnArrival");
    if (arrival && u.spearTaken) return "";
    for (const e of alive(st)) {
      if (e.team !== u.team && e.braced && card(st, e).brace === "spike" && !e.spikeUsed && dist(e.hex, hex) === 1) {
        if (arrival && from && dist(e.hex, from) === 1) continue;   // already next to this spear: staying, not arriving
        e.spikeUsed = true;
        if (arrival) u.spearTaken = true;
        const pooled = hurt(st, u, st.rs.spikeDamage);
        return `; braced ${e.id} at ${e.hex} deals ${st.rs.spikeDamage}${pooled} (${u.id} HP ${fmt(Math.max(u.hp, 0))})` + (u.hp <= 0 ? ` — ${u.id} REMOVED` : "");
      }
    }
    return "";
  }

  function doMove(st, u, dst) {
    const rm = reachMap(st, u);
    if (!rm[dst]) fail(`${u.id} cannot reach ${dst}.`);
    const { steps, mode, cost, tackle } = rm[dst];
    spend(st, u, cost);
    const src = u.hex;
    const left = leaveFlag(st, u);
    const evading = !!evadeTarget(st, u);
    u.hex = dst; u.moved += steps + (tackle ? tackleHexes(st) : 0); u.zmode = mode;
    if (tackle) u.tackled = true;
    if (evading) u.evadeMoved = true;
    let msg = `${u.id} ${src} → ${dst} (${steps} hex${steps > 1 ? "es" : ""}, cost ${fmt(cost)}${tackle ? ", including " + fmt(tackleCostFor(st, u)) + " for tackle" + (tackleHexes(st) ? " and 1 hex of movement" : "") : ""})` + (evading ? "; evading" : "") + (mode !== "free" ? "; stopped by Zone of Control" : "") + left;
    if (u.hp > 0) msg += spikeCheck(st, u, dst, src);
    log(st, msg, "move");
  }

  function swapCosts(st, a, b) {
    const z = zoneFor(st, a.team);
    return [[a, b.hex], [b, a.hex]].map(([u, dst]) => {
      if (u.done) fail(`${u.id} has already ended its turn.`);
      if (evadeTarget(st, u)) fail(`${u.id} attacked this turn and may only evade.`);   // v3.3
      const tk = tackleApplies(st, u, u.hex, dst);
      if (u.moved + 1 + (tk ? tackleHexes(st) : 0) > capOf(st, u)) fail(`${u.id} has no movement left.`);
      if (u.zmode === "shifted") fail(`${u.id} has already shifted inside a zone.`);
      if (u.zmode === "entered" && !z.has(dst)) fail(`${u.id} stopped in a zone and cannot leave it this turn.`);
      if (u.zmode === "entered" && sw(st, "zoneHardStop")) fail(`${u.id} stopped in a zone and cannot move again this turn.`);
      return card(st, u).hexCost + (tk ? tackleCostFor(st, u) : 0);
    });
  }
  function doSwap(st, a, b) {
    if (!b) fail("No such unit to swap with.");
    if (b.hp <= 0) fail("That unit has been removed.");
    if (a === b) fail("A unit cannot swap with itself.");
    if (a.team !== b.team) fail("Only friendly units can swap.");
    if (dist(a.hex, b.hex) !== 1) fail("Units must be adjacent to swap.");
    const costs = swapCosts(st, a, b);
    if (a.stam + EPS < costs[0] || b.stam + EPS < costs[1]) fail("Not enough Stamina to swap.");
    if (st.cmd + EPS < costs[0] + costs[1]) fail("Not enough Command to swap.");
    const z = zoneFor(st, a.team);
    const ah = a.hex, bh = b.hex;
    [[a, bh, costs[0]], [b, ah, costs[1]]].forEach(([u, dst, c]) => {
      const mode0 = u.zmode || (z.has(u.hex) ? "startzone" : "free");
      u.zmode = z.has(dst) ? (mode0 === "free" ? "entered" : "shifted") : "free";
      const tk = tackleApplies(st, u, u.hex, dst);
      if (tk) u.tackled = true;
      u.stam -= c; st.cmd -= c; u.moved += 1 + (tk ? tackleHexes(st) : 0);
    });
    const left = leaveFlag(st, a) + leaveFlag(st, b);
    a.hex = bh; b.hex = ah;
    let msg = `${a.id} and ${b.id} swap: ${a.id} to ${a.hex} (cost ${fmt(costs[0])}), ${b.id} to ${b.hex} (cost ${fmt(costs[1])})` + left;
    if (a.hp > 0) msg += spikeCheck(st, a, a.hex, ah);
    if (b.hp > 0) msg += spikeCheck(st, b, b.hex, bh);
    log(st, msg, "move");
  }

  // ---------- Attacks ----------
  /** Parry damage: a share of the attacker's Strength when the rule set gives parryPct, else a flat number. */
  function parryAmount(st, attacker) {
    const pct = +st.rs.parryPct || 0;
    return pct > 0 ? half(card(st, attacker).str * pct / 100) : st.rs.parryDamage;
  }
  /** Room Dodge (v1): each open hex round the target is worth dodgePerHex %. A unit, the field edge or a flag
      blocks its hex; an enemy next to the target also blocks the two hexes either side of it. */
  function dodgeRoom(st, t) {
    const per = st.rs.game.dodgePerHex || 5;
    const nb = NBRS[t.hex];
    const blocked = new Set();
    const units = alive(st).filter((x) => x !== t);
    for (const n of nb) {
      if (n === FLAG.N || n === FLAG.S) blocked.add(n);
      const x = units.find((y) => y.hex === n);
      if (x) {
        blocked.add(n);
        if (x.team !== t.team) for (const m of nb) if (dist(m, n) === 1) blocked.add(m);
      }
    }
    const open = nb.filter((n) => !blocked.has(n)).length;   // hexes off the field are never open
    let pct = open * per;
    if (t.braced && card(st, t).brace === "dodgeDouble") pct *= 2;
    return { open, pct: Math.min(pct, 95) };
  }
  function canAttackFrom(st, u, h, t) {
    const c = card(st, u), d = dist(h, t.hex);
    if (c.reload && u.attackedLast) return false;
    if (isHolder(st, t) && !GOAL[t.team].has(h)) return false;   // the flag is a fort: storm it from the goal zone
    if (d === 1) return true;
    if (sw(st, "flagBlocksLine") && flagBetween(h, t.hex)) return false;   // v3.6: a flag blocks Volley and Reach (4.9)
    if (c.trait === "reach" && d === 2 && straight2(h, t.hex)) {
      const m = middle(h, t.hex);
      return !alive(st).some((e) => e.team !== u.team && e.hex === m);
    }
    return c.range > 1 && d <= c.range;
  }

  /** The attack value before the die, with every step named. `h` = the hex attacked from.
      `detail` (Brief 009, read-only, for the attack preview): the same steps as numbers and names, so the board never
      works them out itself. It changes nothing the rules do. */
  function breakdown(st, u, t, h) {
    const g = st.rs.game, c = card(st, u), tc = card(st, t), d = dist(h, t.hex);
    let v = c.str; const parts = [`Strength ${c.str}`];
    const detail = { str: c.str, reach: 0, halvedBy: null, strAfter: c.str, supporters: [], support: 0, noSupport: false,
      armor: tc.armor || 0, pierce: false, armorTaken: 0, dodge: null, brace: 0, defenderSupport: 0, home: null };
    if (c.range === 1 && d === 2) { v -= g.reachPenalty; parts.push(`−${g.reachPenalty} Reach`); detail.reach = g.reachPenalty; }
    if (c.range > 1 && st.rs.switches.rangedHalfWhenAdjacent && alive(st).some((e) => e.team === t.team && dist(e.hex, h) === 1)) {
      v = halve(st, v); parts.push("enemy adjacent: halved");
      detail.halvedBy = alive(st).filter((e) => e.team === t.team && dist(e.hex, h) === 1).map((e) => e.uid);
    }
    detail.strAfter = v;
    const helpers = alive(st).filter((a) => a.team === u.team && a !== u && dist(a.hex, t.hex) === 1).length;
    detail.supporters = alive(st).filter((a) => a.team === u.team && a !== u && dist(a.hex, t.hex) === 1).map((a) => a.uid);
    if (helpers) {
      if (t.braced && tc.brace === "noSupport") { parts.push("no Support (braced)"); detail.noSupport = true; }
      else {
        const sb = sw(st, "supportPerUnit") ? g.supportBonus * helpers : g.supportBonus;
        v += sb; parts.push(`+${fmt(sb)} Support`); detail.support = sb;
      }
    }
    const pre = v;
    if (tc.armor && c.trait !== "ignoreArmor") { v -= tc.armor; parts.push(`−${tc.armor} Armor`); detail.armorTaken = tc.armor; }
    else if (tc.armor) detail.pierce = true;
    let dodge = 0;
    if (tc.dodge && sw(st, "dodgeRoom")) {
      const r = dodgeRoom(st, t); dodge = r.pct;
      parts.push(`Dodge ${r.pct}% after the roll (${r.open} open hex${r.open === 1 ? "" : "es"})`);
      detail.dodge = { pct: r.pct, open: r.open, doubled: !!(t.braced && tc.brace === "dodgeDouble") };
    } else if (tc.dodge) {
      const div = t.braced && tc.brace === "dodgeDouble" ? Math.max(1, g.dodgeDivisor / 2) : g.dodgeDivisor;
      const dg = Math.floor(pre / div);
      if (dg) { v -= dg; parts.push(`−${dg} Dodge`); }
      detail.dodge = { flat: dg, per: div, doubled: !!(t.braced && tc.brace === "dodgeDouble") };
    }
    if (t.braced) { v -= g.braceReduction; parts.push(`−${g.braceReduction} Brace`); detail.brace = g.braceReduction; }
    else if (st.rs.switches.defenderSupport && alive(st).some((a) => a.team === t.team && a !== t && dist(a.hex, t.hex) === 1)) { v -= 1; parts.push("−1 defender Support"); detail.defenderSupport = 1; }
    if (homeOf(t.team).has(t.hex)) {
      if (t.fk) { v -= g.keeperHomeReduction; parts.push(`−${g.keeperHomeReduction} keeper at home`); detail.home = { keeper: true, amount: g.keeperHomeReduction }; }
      else { v -= g.goalZoneReduction; parts.push(`−${g.goalZoneReduction} goal zone`); detail.home = { keeper: false, amount: g.goalZoneReduction }; }
    }
    return { value: Math.max(v, 0), parts, dodge, detail };
  }

  /** Dice. One d6 (match 3 rules) or two d6 added, graded (v1 rules). Each case: [roll, chance, label]. */
  const D6_CASES = [[1, 1 / 6, "1"], [3, 4 / 6, "2–5"], [6, 1 / 6, "6"]];
  const TWO_D6_CASES = [[2, 1 / 36, "2"], [3, 2 / 36, "3"], [7, 30 / 36, "4–10"], [11, 2 / 36, "11"], [12, 1 / 36, "12"]];
  /* v3.5 (Brief 010, Game Laws 6.13): the normal band splits. 4–5 takes 10% off, 9–10 adds 10%, 6–8 stays normal.
     Symmetric, so the average multiplier is v3.4's. Each case's roll is a total inside its band. */
  const VARIETY_CASES = [[2, 1 / 36, "2"], [3, 2 / 36, "3"], [4, 7 / 36, "4–5 · −10%"], [7, 16 / 36, "6–8"], [9, 7 / 36, "9–10 · +10%"], [11, 2 / 36, "11"], [12, 1 / 36, "12"]];
  const dieCases = (st) => (sw(st, "dice2d6") ? (sw(st, "diceVariety") ? VARIETY_CASES : TWO_D6_CASES) : D6_CASES);
  /** The two-dice multiplier for a total: 2 ×0.5, 3 ×0.75, 11 ×1.25, 12 ×1.5; with diceVariety 4–5 ×0.9, 9–10 ×1.1. */
  function diceMultiplier(st, die) {
    if (die <= 2) return 0.5;
    if (die === 3) return 0.75;
    if (die === 11) return 1.25;
    if (die >= 12) return 1.5;
    if (sw(st, "diceVariety")) { if (die <= 5) return 0.9; if (die >= 9) return 1.1; }
    return 1;
  }
  const normalDie = (st) => (sw(st, "dice2d6") ? 7 : 3);
  /** A roll from a random source: 1-6, or 2-12 as two dice added. */
  function rollWith(st, rnd) {
    const one = () => 1 + Math.floor(rnd() * 6);
    return sw(st, "dice2d6") ? one() + one() : one();
  }
  /** Damage after the roll, then Dodge (a percentage, v1), never below the minimum. */
  function applyDie(st, v, die, dodge) {
    let dmg;
    if (sw(st, "dice2d6")) {
      dmg = v * diceMultiplier(st, die);
    } else {
      dmg = v;
      if (die === 1) dmg = Math.floor(v / 2);
      else if (die === 6) dmg = v + Math.ceil(v / 2);
    }
    if (dodge) dmg = dmg * (1 - dodge / 100);
    if (sw(st, "halfPoints")) dmg = half(dmg);
    else if (dodge) dmg = Math.round(dmg);
    return Math.max(st.rs.game.minDamage, dmg);
  }

  function doAttack(st, u, t, roll) {
    if (t.team === u.team) fail("Cannot attack a friendly unit.");
    const d = dist(u.hex, t.hex);
    if (!canAttackFrom(st, u, u.hex, t)) fail(card(st, u).reload && u.attackedLast ? `${u.id} is reloading this turn.` : `${u.id} at ${u.hex} cannot attack ${t.id} at ${t.hex}.`);
    spend(st, u, st.rs.game.attackCost);
    u.done = true; u.attackedThis = true;
    const { value, parts, dodge } = breakdown(st, u, t, u.hex);
    const die = roll();
    const dmg = applyDie(st, value, die, dodge);
    const wasHolder = isHolder(st, t);
    const pooled = hurt(st, t, dmg);
    let msg = `${u.id} (${u.hex}) attacks ${t.id} (${t.hex}${wasHolder ? ", holding the flag" : ""}): ${parts.join(", ")} = ${fmt(value)}; ${sw(st, "dice2d6") ? "dice" : "die"} ${die} → ${fmt(dmg)} damage${pooled}; ${t.id} HP ${fmt(Math.max(t.hp, 0))}`;
    if (t.braced && card(st, t).brace === "parry" && d === 1) {
      if (sw(st, "parryFirstOnly") && t.parryUsed) msg += `; no parry (${t.id} has already parried this turn)`;   // v3.2
      else if (sw(st, "parryNeedsSurvivor") && t.hp <= 0) msg += `; no parry (${t.id} did not survive the hit)`;  // v3.2
      else {
        const pd = parryAmount(st, u);
        const pp = hurt(st, u, pd);
        msg += `; parry deals ${fmt(pd)}${pp} (${u.id} HP ${fmt(Math.max(u.hp, 0))})` + (u.hp <= 0 ? ` — ${u.id} REMOVED` : "");
      }
    }
    // v3.2 (Game Laws 6.3): the first adjacent attack on a braced unit each enemy turn uses up its parry. A Ranged shot
    // or a Reach attack from 2 hexes never uses it, since it could never be parried (the Editor, 17 Nov, F19).
    if (sw(st, "parryFirstOnly") && t.braced && d === 1) t.parryUsed = true;
    if (t.hp <= 0) {
      msg += ` — ${t.id} REMOVED`;
      const holdsOwnFlag = sw(st, "holderHoldsHex") && isHolder(st, u);   // v3.1 (E1 fix): a holder never leaves its flag to take a hex
      if (isMelee(st, u) && d === 1 && u.hp > 0 && !wasHolder && !holdsOwnFlag) {
        const was = u.hex;
        u.hex = t.hex; msg += `; ${u.id} takes ${t.hex}`;
        if (st.rs.switches.captureTriggersSpike) msg += spikeCheck(st, u, u.hex, was);
      }
    }
    // v3.3 Evade: a Light unit whose adjacent attack left the target standing may step away instead of ending its turn.
    if (sw(st, "evade") && card(st, u).evade && d === 1 && t.hp > 0 && u.hp > 0) {
      u.done = false; u.evadeFrom = t.uid; u.evadeMoved = false;
      msg += `; ${u.id} may evade`;
    }
    log(st, msg, "attack");
    return { die, dmg };
  }

  /** v3.6 (pullCountsForReload, 3.11): a reloading unit can't pull either. */
  const pullReloading = (st, u) => sw(st, "pullCountsForReload") && !!card(st, u).reload && !!u.attackedLast;
  function canPullFrom(st, u, h) { return homeOf(foeOf(u.team)).has(h) && !holderOf(st, foeOf(u.team)) && !pullReloading(st, u); }
  function pullValue(st, u) {
    const c = card(st, u), foe = foeOf(u.team);
    let v = c.range > 1 && !sw(st, "pullFullStrength") ? halve(st, c.str) : c.str;   // v3.6: a pull is always full Strength (4.6)
    const parts = [`Strength ${fmt(v)}`];
    if (sw(st, "pullSupport")) {
      // Pull Support: +1 (supportBonus) for every other friendly unit next to the flag, as Support on an attack.
      const helpers = alive(st).filter((a) => a.team === u.team && a !== u && homeOf(foe).has(a.hex)).length;
      if (helpers) { const sb = st.rs.game.supportBonus * helpers; v += sb; parts.push(`+${fmt(sb)} Support`); }
    }
    if (alive(st).some((e) => e.team === foe && e.fk && homeOf(foe).has(e.hex))) {
      v = Math.max(v - st.rs.game.keeperPullReduction, 0); parts.push(`−${st.rs.game.keeperPullReduction} keeper at home`);
    }
    return { value: v, parts };
  }
  function doPull(st, u, roll) {
    if (pullReloading(st, u)) fail(`${u.id} is reloading this turn.`);
    if (!canPullFrom(st, u, u.hex)) fail(`${u.id} is not next to the enemy flag.`);
    spend(st, u, st.rs.game.attackCost);
    u.done = true;
    if (sw(st, "pullCountsForReload")) u.attackedThis = true;   // v3.6: a pull counts as an attack for Reload (no Evade, no parry)
    const foe = foeOf(u.team);
    const { value, parts } = pullValue(st, u);
    const die = roll();
    const dmg = applyDie(st, value, die);
    st.pole[foe] = Math.min(st.rs.game.poleHP, st.pole[foe] + dmg);
    log(st, `${u.id} pulls at ${u.hex}: ${parts.join(", ")} = ${fmt(value)}; ${sw(st, "dice2d6") ? "dice" : "die"} ${die} → ${fmt(dmg)}; ${foe === "N" ? "North" : "South"} flag HP ${fmt(st.rs.game.poleHP - st.pole[foe])}/${st.rs.game.poleHP}`, "pull");
    return { die, dmg };
  }

  function doBrace(st, u) {
    spend(st, u, st.rs.game.braceCost);
    u.done = true; u.braced = true; u.spikeUsed = false;
    if (sw(st, "parryFirstOnly")) u.parryUsed = false;   // v3.2: a fresh brace has its parry ready
    log(st, `${u.id} braces at ${u.hex}`, "brace");
  }

  // ---------- Turns and results ----------
  function startTurn(st, team) {
    st.toMove = team;
    if (sw(st, "spearOnArrival")) for (const u of alive(st)) u.spearTaken = false;   // v3.6: at most one set spear per unit per turn
    st.cmd = st.turn === 1 && team === st.first ? st.rs.game.firstTurnCommand : st.rs.game.command;
    for (const u of alive(st)) {
      if (u.team !== team) continue;
      u.wasBraced = !!u.braced;
      u.stam = nextStamina(st, u);
      if (u.staminaMods) delete u.staminaMods;   // used up at this turn start
      u.braced = false; u.done = false; u.moved = 0; u.zmode = null; u.spikeUsed = false; u.tackled = false;
      u.attackedLast = !!u.attackedThis; u.attackedThis = false;
      if (sw(st, "parryFirstOnly")) u.parryUsed = false;   // v3.2: resets when this side's next turn begins
      if (sw(st, "evade")) { u.evadeFrom = null; u.evadeMoved = false; }
    }
    st.spend.push({ team, turn: st.turn, cmd: st.cmd, spent: null });
    log(st, `${team === "N" ? "North" : "South"} turn ${st.turn}: ${fmt(st.cmd)} Command`, "turn");
  }

  function beingsLost(st, team) {
    return st.units.filter((u) => u.team === team && u.hp <= 0).reduce((s, u) => s + (card(st, u).beings || 1), 0);
  }

  function checkResult(st, actor) {
    if (st.result) return;
    const wins = {};
    for (const team of ["N", "S"]) {
      const foe = foeOf(team);
      if (st.pole[foe] >= st.rs.game.poleHP) { wins[team] = "KO"; continue; }
      const left = st.units.filter((u) => u.team === foe && u.hp > 0 && (st.rs.switches.tkoNeedsKeeper || !u.fk));
      if (left.length === 0) wins[team] = "TKO";
    }
    const both = wins.N && wins.S;
    if (both && sw(st, "doubleKoToTiebreak")) {
      // v3.2 (ruled 17 Nov): both sides finished in one action. Settle it as the turn limit does.
      const tb = tiebreak(st);
      st.result = { winner: tb.winner, how: "double knockout, " + tb.reason, double: wins };
      st.phase = "over";
      log(st, tb.winner ? `Double knockout: ${tb.winner === "N" ? "North" : "South"} wins on ${tb.reason}` : "Double knockout: draw", "result");
      return;
    }
    if (both && sw(st, "simultaneousToActor") && actor) {
      // v3.1 (E3 fix): both sides finished in one action (e.g. the last attacker dies to parry or set spear
      // while removing the last defender). The side that acted wins.
      st.result = { winner: actor, how: wins[actor] };
    } else if (wins.N) st.result = { winner: "N", how: wins.N };   // older rule sets: North is checked first
    else if (wins.S) st.result = { winner: "S", how: wins.S };
    if (st.result) { st.phase = "over"; log(st, `${st.result.winner === "N" ? "North" : "South"} wins by ${st.result.how}`, "result"); }
  }

  /** Unit cap per side for a rule set and lineup: the sum of the cards' unit cap (the "beings" field). */
  function capOfLineup(rs, lineup) { return (lineup || []).reduce((s, l) => s + ((rs.cards[l.card] && rs.cards[l.card].beings) || 1), 0); }
  /** Turns per player for a format. v3.4 (turnLimitByFormat): 5v5 and 7v7 have their own limits; anything else, and
      every older rule set, uses turnLimit. */
  function turnLimitFor(rs, size) {
    const g = rs.game;
    if (!(rs.switches && rs.switches.turnLimitByFormat)) return g.turnLimit;
    return (size === 5 && g.turnLimit5) || (size === 7 && g.turnLimit7) || g.turnLimit;
  }
  /** The turn limit of this match. */
  function turnLimit(st) {
    if (!sw(st, "turnLimitByFormat")) return st.rs.game.turnLimit;
    const size = st.units.filter((u) => u.team === "N").reduce((s, u) => s + (card(st, u).beings || 1), 0);
    return turnLimitFor(st.rs, size);
  }

  function endTurn(st) {
    const rec = st.spend[st.spend.length - 1];
    if (rec) rec.spent = rec.cmd - st.cmd;
    const next = foeOf(st.toMove);
    if (st.toMove !== st.first) {
      if (st.turn >= turnLimit(st)) return limitResult(st);
      st.turn += 1;
    }
    startTurn(st, next);
  }

  /** The turn-limit order: more damage to the enemy flag, then fewer beings lost, then a draw. */
  function tiebreak(st) {
    const dmgBy = { N: st.pole.S, S: st.pole.N };
    const lost = { N: beingsLost(st, "N"), S: beingsLost(st, "S") };
    if (dmgBy.N !== dmgBy.S) return { winner: dmgBy.N > dmgBy.S ? "N" : "S", reason: "more pull damage" };
    if (lost.N !== lost.S) return { winner: lost.N < lost.S ? "N" : "S", reason: "fewer beings lost" };
    return { winner: null, reason: "draw" };
  }

  function limitResult(st) {
    const tb = tiebreak(st), winner = tb.winner, how = "turn limit, " + tb.reason;
    st.result = { winner, how };
    st.phase = "over";
    log(st, winner ? `${winner === "N" ? "North" : "South"} wins at the ${how.replace("turn limit, ", "turn limit on ")}` : "Draw at the turn limit", "result");
  }

  // ---------- Public API ----------
  function newMatch(ruleset, opts) {
    opts = opts || {};
    const rs = clone(ruleset);
    const st = {
      v: 1, rs, phase: "deploy", turn: 1, first: opts.first || "N", toMove: null, cmd: 0,
      pole: { N: 0, S: 0 }, units: [], log: [], actions: [], spend: [], result: null,
      names: opts.names || { N: "North", S: "South" }, deployed: { N: false, S: false },
      started: opts.started || null
    };
    for (const team of ["N", "S"]) {
      const lineup = (opts.lineups && opts.lineups[team]) || rs.lineup;
      for (const l of lineup) {
        const c = rs.cards[l.card];
        st.units.push({ uid: team + "-" + l.id, team, id: l.id, card: l.card, fk: !!l.fk, hex: null, hp: c.hp, maxHp: c.hp,
          braced: false, wasBraced: false, stam: c.stamina !== undefined ? c.stamina : rs.game.stamina, moved: 0, zmode: null, done: false, tackled: false,
          spikeUsed: false, attackedLast: false, attackedThis: false });
      }
    }
    return st;
  }

  function deploy(st, team, placements) {
    if (st.phase !== "deploy") fail("Deployment is over.");
    const zone = new Set(deployZone(st, team));
    const used = new Set();
    for (const u of st.units.filter((x) => x.team === team)) {
      const h = placements[u.uid];
      if (!h) fail(`${u.id} has not been placed.`);
      if (!zone.has(h)) fail(`${h} is outside ${team === "N" ? "North" : "South"}'s deployment area.`);
      if (used.has(h)) fail(`Two units on ${h}.`);
      used.add(h);
    }
    for (const u of st.units.filter((x) => x.team === team)) u.hex = placements[u.uid];
    st.deployed[team] = true;
    st.actions.push({ type: "deploy", team, placements: clone(placements) });
    if (st.deployed.N && st.deployed.S) {
      st.phase = "play";
      log(st, "Both sides deployed.", "turn");
      startTurn(st, st.first);
    }
  }

  const d6 = () => 1 + Math.floor(Math.random() * 6);

  /** A repeatable random stream from a seed string (mulberry32 over a string hash). */
  function seededRandom(seed) {
    const str = String(seed);
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function makeSeed() {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let out = "";
    for (let i = 0; i < 12; i++) { out += abc[Math.floor(Math.random() * abc.length)]; if (i === 3 || i === 7) out += "-"; }
    return out;
  }

  /** Apply one action, throwing on an illegal one (the state may then be half-changed). */
  function apply(st, action, roll) {
    roll = roll || (() => rollWith(st, Math.random));
    if (!action || typeof action !== "object" || typeof action.type !== "string") fail("An action must have a type.");
    if (action.type === "deploy") {
      if (action.team !== "N" && action.team !== "S") fail("Deployment needs a side, N or S.");
      if (!action.placements || typeof action.placements !== "object") fail("Deployment needs placements.");
      deploy(st, action.team, action.placements); return {};
    }
    if (st.phase !== "play") fail("The match is not in play.");
    if (action.type === "surrender" && action.team !== undefined && action.team !== "N" && action.team !== "S") fail("Surrender needs a side, N or S.");
    if (action.type === "move" && !CELLSET.has(action.to)) fail("That hex is not on the field.");
    if ((action.type === "swap" && !action.with) || (action.type === "attack" && !action.target)) fail("That action needs a second unit.");
    if (["move", "swap", "attack", "pull", "brace", "done"].includes(action.type) && !action.uid) fail("That action needs a unit.");
    const actor = st.toMove;
    let out = {};
    const u = action.uid ? unitByUid(st, action.uid) : null;
    if (action.uid && !u) fail("No such unit.");
    if (u && (u.hp <= 0)) fail("That unit has been removed.");
    if (u && u.team !== st.toMove) fail("It is not that side's turn.");
    if (sw(st, "evade")) {
      // v3.3: an evading unit may only move away or end; any other unit acting (or the turn ending) ends its evade.
      if (u && evadeTarget(st, u) && !["move", "done"].includes(action.type)) fail(`${u.id} attacked this turn and may only evade or end.`);
      const partner = action.type === "swap" ? unitByUid(st, action.with) : null;
      if (partner && evadeTarget(st, partner)) fail(`${partner.id} attacked this turn and may only evade or end.`);
      for (const x of st.units) if (x.evadeFrom && x !== u) { x.evadeFrom = null; x.done = true; }
    }
    switch (action.type) {
      case "move": doMove(st, u, action.to); break;
      case "swap": doSwap(st, u, unitByUid(st, action.with)); break;
      case "attack": {
        const t = unitByUid(st, action.target);
        if (!t || t.hp <= 0) fail("No such target.");
        out = doAttack(st, u, t, roll); break;
      }
      case "pull": out = doPull(st, u, roll); break;
      case "brace": doBrace(st, u); break;
      case "done": if (u.done) fail(`${u.id} has already ended its turn.`); u.done = true; if (u.evadeFrom) u.evadeFrom = null; log(st, `${u.id} ends its turn`, "done"); break;
      case "end": endTurn(st); break;
      case "surrender": {
        const w = foeOf(action.team || st.toMove);
        st.result = { winner: w, how: "surrender" }; st.phase = "over";
        log(st, `${w === "N" ? "South" : "North"} surrenders`, "result"); break;
      }
      default: fail("Unknown action " + action.type);
    }
    const rec = Object.assign({}, action);
    if (out.die) rec.die = out.die;
    st.actions.push(rec);
    checkResult(st, actor);
    return out;
  }

  /** Apply one action. Returns {ok, error?, die?}. The state is changed only when ok. */
  function act(st, action, roll) {
    const snapshot = clone(st);
    try {
      const out = apply(st, action, roll);
      return Object.assign({ ok: true }, out);
    } catch (e) {
      if (!e.illegal) console.error(e);
      Object.keys(st).forEach((k) => delete st[k]);
      Object.assign(st, snapshot);
      return { ok: false, error: e.message };
    }
  }

  /** A cheap copy for look-ahead: units and scores copied, history left out, rule set shared (read-only). */
  function cloneLite(st) {
    return Object.assign({}, st, { pole: Object.assign({}, st.pole), units: st.units.map((u) => Object.assign({}, u)),
      log: [], actions: [], spend: [], deployed: Object.assign({}, st.deployed), result: st.result ? Object.assign({}, st.result) : null });
  }

  /** What a unit can do right now, for the board to highlight. */
  function options(st, uid) {
    const u = unitByUid(st, uid);
    const empty = { moves: {}, attacks: [], pull: null, brace: false, swaps: [] };
    if (!u || u.hp <= 0 || st.phase !== "play" || u.team !== st.toMove || u.done) return empty;
    const ev = evadeTarget(st, u);
    if (ev) return Object.assign(empty, { moves: reachMap(st, u), evading: ev.uid });   // v3.3: only steps away, or End unit
    const g = st.rs.game;
    const can = (cost) => u.stam + EPS >= cost && st.cmd + EPS >= cost;
    const attacks = [];
    if (can(g.attackCost)) {
      for (const t of alive(st)) {
        if (t.team === u.team || !canAttackFrom(st, u, u.hex, t)) continue;
        const b = breakdown(st, u, t, u.hex);
        const cs = dieCases(st).map(([d, p]) => [applyDie(st, b.value, d, b.dodge), p]);
        attacks.push({ target: t.uid, value: b.value, dodge: b.dodge, parts: b.parts, detail: b.detail, low: cs[0][0], high: cs[cs.length - 1][0], cases: cs,
          killChance: cs.reduce((s2, [dm, p]) => s2 + (dm >= effHp(st, t) - 1e-9 ? p : 0), 0), pooled: isHolder(st, t), effHp: effHp(st, t), capture: isHolder(st, t) ? null : capturePreview(st, u, t),
          evade: evadePreview(st, u, t) });
      }
    }
    let pull = null;
    if (can(g.attackCost) && canPullFrom(st, u, u.hex)) { const p = pullValue(st, u); const cs = dieCases(st).map(([d, pr]) => [applyDie(st, p.value, d), pr]); pull = { value: p.value, parts: p.parts, low: cs[0][0], high: cs[cs.length - 1][0], cases: cs }; }
    const swaps = [];
    for (const f of alive(st)) {
      if (f.team !== u.team || f === u || dist(f.hex, u.hex) !== 1 || evadeTarget(st, f)) continue;
      try { const c = swapCosts(st, u, f); if (u.stam + EPS >= c[0] && f.stam + EPS >= c[1] && st.cmd + EPS >= c[0] + c[1]) swaps.push(f.uid); } catch (e) { /* not allowed */ }
    }
    return { moves: reachMap(st, u), attacks, pull, brace: can(g.braceCost), swaps };
  }

  /** What parry would do if `u` attacked `t` now, for the board: null (no parry possible), {used: true} (v3.2: already
      parried this turn), or {amount, ifSurvives} (ifSurvives: v3.2, it fires only if `t` survives the hit). */
  function parryPreview(st, u, t) {
    if (!(t.braced && card(st, t).brace === "parry" && dist(u.hex, t.hex) === 1)) return null;
    if (sw(st, "parryFirstOnly") && t.parryUsed) return { used: true };
    return { amount: parryAmount(st, u), ifSurvives: sw(st, "parryNeedsSurvivor") };
  }
  /** v3.3 Evade preview (Brief 005: exact). Plays the evade that would follow an attack on `t`, if `t` survives, on a
      scratch copy: Stamina and Command after the attack, the cap, tackle and the direction rule all count. Returns null
      when no Evade applies, else { hexes, reason (why 0), unsure (the parry might remove the attacker first) }. */
  function evadePreview(st, u, t) {
    if (!sw(st, "evade") || !card(st, u).evade || dist(u.hex, t.hex) !== 1) return null;
    const s = cloneLite(st), su = unitByUid(s, u.uid), g = st.rs.game;
    su.stam -= g.attackCost; s.cmd -= g.attackCost; su.done = false; su.evadeFrom = t.uid; su.evadeMoved = false; su.attackedThis = true;
    const moves = reachMap(s, su), hexes = Object.values(moves).reduce((m, x) => Math.max(m, x.steps), 0);
    const pv = parryPreview(st, u, t);
    return { hexes, stam: su.stam, reason: hexes ? null : whyNoMove(s, su), unsure: !!(pv && !pv.used && pv.amount >= effHp(st, u) - EPS) };
  }
  /** Why a unit can't take a single step now, in plain words; null if it can. Every reason is read from the rules. */
  function whyNoMove(st, u) {
    if (Object.keys(reachMap(st, u)).length) return null;
    const c = card(st, u), cap = capOf(st, u), ev = evadeTarget(st, u), b = blocked(st, u);
    const free = NBRS[u.hex].filter((n) => !b.has(n) && (!ev || dist(n, ev.hex) > dist(u.hex, ev.hex)));
    if (!free.length) return ev ? `No free hex further from ${ev.id}` : "No free hex next to it";
    if (u.moved >= cap) return `Moved its full cap (${cap} hexes)`;
    if (st.cmd + EPS < c.hexCost) return `Needs ${fmt(c.hexCost)} Command for a step, ${fmt(st.cmd)} left`;
    if (u.stam + EPS < c.hexCost) return `Needs ${fmt(c.hexCost)} Stamina for a step, ${fmt(u.stam)} left`;
    const mode = ev && !u.evadeMoved ? null : u.zmode;
    if (mode === "shifted" || (mode === "entered" && sw(st, "zoneHardStop"))) return "Stopped in an enemy zone this turn";
    for (const n of free) {
      if (!tackleApplies(st, u, u.hex, n)) continue;
      const e = alive(st).find((x) => x.team !== u.team && card(st, x).trait === "tackle" && dist(x.hex, u.hex) === 1 && dist(x.hex, n) !== 1);
      const cost = c.hexCost + tackleCostFor(st, u), hexes = 1 + tackleHexes(st);
      return `Tackled by ${e ? e.id : "an enemy"}: breaking away needs ${fmt(cost)} Stamina` + (hexes > 1 ? ` and ${hexes} hexes of movement` : "") +
        `; has ${fmt(Math.min(u.stam, st.cmd))} Stamina${u.stam > st.cmd + EPS ? " (Command)" : ""}` + (hexes > 1 ? ` and ${cap - u.moved} hex${cap - u.moved === 1 ? "" : "es"}` : "");
    }
    return "No legal step";
  }
  /** Why each action is unavailable for a unit right now (null = available), for the board's greyed-out buttons. */
  function blockReasons(st, uid) {
    const u = unitByUid(st, uid), g = st.rs.game, out = { attack: null, reach: null, brace: null, move: null, done: null, special: "No special actions in this rule set yet" };
    const all = (r) => { for (const k of ["attack", "reach", "brace", "move", "done"]) out[k] = r; return out; };
    if (!u || u.hp <= 0) return all("That unit has been removed");
    if (st.phase !== "play") return all("The match is not in play");
    if (u.team !== st.toMove) return all("It is not that side's turn");
    if (u.done) return all(`${u.id} has ended its turn`);
    const ev = evadeTarget(st, u);
    const o = options(st, uid), c = card(st, u);
    const need = (k, cost) => (u.stam + EPS < cost ? `Needs ${fmt(cost)} Stamina, ${fmt(u.stam)} left` : st.cmd + EPS < cost ? `Needs ${fmt(cost)} Command, ${fmt(st.cmd)} left` : null);
    if (ev) { out.attack = out.reach = out.brace = `${u.id} attacked this turn and may only evade or end`; }
    else {
      const reachShot = (a) => c.trait === "reach" && c.range === 1 && dist(u.hex, unitByUid(st, a.target).hex) === 2;
      // v3.6: when the only thing stopping a shot is a flag in the line, say so (Game Laws 4.9).
      const flagOnly = (reach) => sw(st, "flagBlocksLine") && alive(st).some((t) => t.team !== u.team && dist(u.hex, t.hex) >= 2 && flagBetween(u.hex, t.hex) &&
        (reach ? straight2(u.hex, t.hex) : c.range > 1 && dist(u.hex, t.hex) <= c.range) && !(isHolder(st, t) && !GOAL[t.team].has(u.hex)) && !(reach && alive(st).some((e) => e.team !== u.team && e.hex === middle(u.hex, t.hex))));
      out.attack = need("attack", g.attackCost) || (c.reload && u.attackedLast ? `${u.id} is reloading this turn` : null) || (o.attacks.some((a) => !reachShot(a)) ? null : flagOnly(false) ? "A flag blocks the line" : "No enemy in range");
      out.reach = c.trait !== "reach" ? "Only Anti-Cavalry units can Reach" : need("attack", g.attackCost) || (o.attacks.some(reachShot) ? null : flagOnly(true) ? "A flag blocks the line" : "No enemy 2 hexes away in a straight line, with nothing in between");
      out.brace = need("brace", g.braceCost);
    }
    out.move = whyNoMove(st, u);
    return out;
  }
  /** HP that must go before a unit falls: a flag holder's pool, or its own HP. */
  function effHp(st, t) { return isHolder(st, t) ? t.hp + flagLeft(st, t.team) : t.hp; }
  /** If an adjacent melee attack kills, where the attacker lands and what waits there. */
  function capturePreview(st, u, t) {
    if (!isMelee(st, u) || dist(u.hex, t.hex) !== 1) return null;
    if (sw(st, "holderHoldsHex") && isHolder(st, u)) return null;
    const enemies = alive(st).filter((e) => e.team === t.team && e !== t && dist(e.hex, t.hex) === 1);
    const spike = st.rs.switches.captureTriggersSpike && enemies.some((e) => e.braced && card(st, e).brace === "spike" && !e.spikeUsed);
    return { hex: t.hex, adjacentEnemies: enemies.map((e) => e.id), spike };
  }

  /** Status the board must show for every unit, from the same data the rules use. */
  function status(st, u) {
    const c = card(st, u);
    const nextStam = nextStamina(st, u);
    const moving = st.phase === "play" && u.team === st.toMove;
    return { hp: hpShown(st, u), maxHp: u.maxHp, braced: !!u.braced, bracedLast: !!(moving && u.wasBraced && !u.braced), holder: isHolder(st, u), stamNow: moving ? u.stam : null, stamNext: nextStam,
      done: moving && u.done, reloading: !!(c.reload && (moving ? u.attackedLast : u.attackedThis)), zone: projects(st, u),
      dodge: c.dodge && sw(st, "dodgeRoom") && u.hex ? dodgeRoom(st, u).pct : null };
  }

  function zones(st) {
    const out = { N: new Set(), S: new Set() };
    for (const u of alive(st)) if (projects(st, u)) for (const n of NBRS[u.hex]) out[u.team].add(n);
    return out;
  }

  const api = { COLS, NCOL, NROW, FLAG, CELLS, CELLSET, NBRS, GOAL, parse, geo, dist, deployZone, foeOf, clone, card, alive, unitByUid,
    newMatch, act, apply, cloneLite, poolSplit, hpShown, flagShown, seededRandom, makeSeed, options, canAttackFrom, capturePreview, pullValue, canPullFrom, flagBetween, dieCases, diceMultiplier, normalDie, rollWith, parryAmount, parryPreview, evadePreview, whyNoMove, blockReasons, tackleCostFor, tiebreak, turnLimit, turnLimitFor, capOfLineup, dodgeRoom, half, holderOf, isHolder, effHp, flagLeft, homeOf, zoneFor, status, zones, reachMap, STAMINA_EFFECTS, baseStamina, braceTiredness, staminaFloor, staminaMods, addStaminaMod, staminaWith, nextStamina, breakdown, applyDie, beingsLost, capOf, fmt, d6 };
  if (typeof module !== "undefined") module.exports = api; else root.GGEngine = api;
})(this);
