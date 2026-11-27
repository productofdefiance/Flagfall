/* Flagfall Arena — rules engine.
   Pure rules: no drawing, no storage. Every number comes from the rule set (see data.js).
   The board, the replay tests and the future computer opponent all go through this file. */
(function (root) {
  "use strict";

  // ---------- Field geometry (Brief 014, Game Laws 2.4) ----------
  /* Each match plays on one field (fields.js). A rule set with switch `fields` uses the field for the match's format;
     every older rule set uses `legacy` (today's oval, columns A-I, rows 1-19, flags E3 and E17). Everything that
     depends on the field's shape is built here, once per field, and every rule reads it from the match: fieldOf(st).
     A column an odd number of columns from the middle column sits half a hex lower, so positions and distances are
     worked out from the column's offset from the middle column (for 9 columns this is the old odd-index rule). */
  const FIELD_DATA = (typeof module !== "undefined" ? require("./fields.js") : root.GGFields).FIELDS;
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function makeField(def) {
    const ncol = def.cols.length, mid = (ncol - 1) / 2, COLS = LETTERS.slice(0, ncol), FLAG = def.flags;
    const parse = (h) => [COLS.indexOf(h[0]), parseInt(h.slice(1), 10)];
    const off = (q) => q - mid;                                   // column offset from the middle column
    const low = (q) => (off(q) & 1) === 1;                        // half a hex lower (odd offset, either side)
    const geo = (q, r) => [q, r + (low(q) ? 0.5 : 0)];
    function cube(q, r) { const x = off(q), z = (r - 1) - ((x - (x & 1)) >> 1); return [x, -x - z, z]; }
    const cubeOf = (h) => cube(...parse(h));
    function dist(a, b) {
      const ca = cubeOf(a), cb = cubeOf(b);
      return Math.max(Math.abs(ca[0] - cb[0]), Math.abs(ca[1] - cb[1]), Math.abs(ca[2] - cb[2]));
    }
    const CELLS = [];
    def.cols.forEach(([r0, r1], q) => { for (let r = r0; r <= r1; r++) CELLS.push(COLS[q] + r); });
    const CELLSET = new Set(CELLS);
    const NBRS = {};
    for (const a of CELLS) NBRS[a] = CELLS.filter((b) => dist(a, b) === 1);
    const GOAL = { N: new Set(NBRS[FLAG.N]), S: new Set(NBRS[FLAG.S]) };
    function straight2(a, b) {
      const ca = cubeOf(a), cb = cubeOf(b);
      const d = [0, 1, 2].map((i) => Math.abs(ca[i] - cb[i])).sort();
      return d[0] === 0 && d[1] === 2 && d[2] === 2;
    }
    const middle = (a, b) => CELLS.find((c) => dist(c, a) === 1 && dist(c, b) === 1);
    /** v3.6 (Brief 015, Game Laws 4.9): is a flag hex (either flag, held or empty) strictly between `from` and `to` on one
        of the six straight hex lines? Off a straight line nothing is ever between. Neither end counts: a unit on a flag
        shoots out from it, and a holder on its flag can be shot. One helper for every line rule (Volley, Reach; later
        Javelin, Vault). */
    function flagBetween(from, to) {
      const a = cubeOf(from), b = cubeOf(to), d = dist(from, to);
      if (d < 2) return false;
      for (const f of [FLAG.N, FLAG.S]) {
        if (f === from || f === to) continue;
        const c = cubeOf(f);
        for (let i = 0; i < 3; i++) if (a[i] === b[i] && c[i] === a[i] && dist(from, f) + dist(f, to) === d) return true;
      }
      return false;
    }
    const onFlag = (h) => h === FLAG.N || h === FLAG.S;
    /** The field hex at cube coordinates, or null off the field. */
    function fromCube(c) {
      const x = c[0], q = x + mid; if (q < 0 || q >= ncol) return null;
      const r = c[2] + ((x - (x & 1)) >> 1) + 1, h = COLS[q] + r;
      return CELLSET.has(h) ? h : null;
    }
    /** The hexes strictly between two hexes on one straight line, nearest first; null when they are not on one. */
    function lineBetween(a, b) {
      const ca = cubeOf(a), cb = cubeOf(b), d = dist(a, b);
      if (![0, 1, 2].some((i) => ca[i] === cb[i])) return null;
      const out = [];
      for (let k = 1; k < d; k++) out.push(fromCube([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * k / d)));
      return out;
    }
    /** Skewer: the hex directly behind `t` seen from `a` (same straight line, one further), or null. */
    function hexBehind(a, t) {
      const ca = cubeOf(a), ct = cubeOf(t);
      return fromCube([0, 1, 2].map((i) => 2 * ct[i] - ca[i]));
    }
    /** Arc Hit's arc around target hex `t` from `a`: t plus the hexes next to both. A flag hex is never in it (6.17, F8). */
    const arcOf = (a, t) => [t].concat(NBRS[t].filter((n) => dist(n, a) === 1)).filter((h) => !onFlag(h));
    const centre = COLS[mid] + (def.rows + 1) / 2;
    return { id: def.id, size: def.size, COLS, NCOL: ncol, NROW: def.rows, MID: mid, FLAG, CELLS, CELLSET, NBRS, GOAL,
      deployRadius: def.deployRadius, parse, geo, cube, dist, straight2, middle, flagBetween, onFlag, fromCube, lineBetween,
      hexBehind, arcOf, centre,
      // Small helpers for a later zone layer (no zones in this build).
      flagDist: (h) => ({ N: dist(h, FLAG.N), S: dist(h, FLAG.S) }),
      offset: (h) => off(parse(h)[0]),
      rows: def.rows };
  }
  const FIELDS = {};
  for (const id in FIELD_DATA) FIELDS[id] = makeField(FIELD_DATA[id]);
  const LEGACY = FIELDS.legacy;
  /** The field a rule set plays a format on: the format's own with switch `fields`, else the legacy field. */
  function fieldFor(rs, size) {
    if (!(rs && rs.switches && rs.switches.fields)) return LEGACY;
    for (const id in FIELDS) if (FIELDS[id].size === size) return FIELDS[id];
    return LEGACY;
  }
  /** The field this match plays on (st.field is set only by rule sets with switch `fields`). */
  const fieldOf = (st) => (st && st.field && FIELDS[st.field]) || LEGACY;
  /** Unit cap per side of this match (North's lineup; both sides field the same size). */
  const matchSize = (st) => st.units.filter((u) => u.team === "N").reduce((s, u) => s + (st.rs.cards[u.card].beings || 1), 0);
  /** Deploy radius for a format. v3.8 (fields): 5v5 has its own (game.deployRadius5, Game Laws 2.5); anything else, and
      every older rule set, uses deployRadius. */
  function deployRadiusFor(rs, size) {
    const g = rs.game;
    if (rs.switches && rs.switches.fields && size === 5 && g.deployRadius5 !== undefined) return g.deployRadius5;
    return g.deployRadius;
  }
  /** The hexes a side may deploy on: within the deploy radius of its own flag (the flag hex itself only with the flag
      holder rules, where one unit may start on it). */
  function deployZone(st, team) {
    const G = fieldOf(st), R = sw(st, "fields") ? deployRadiusFor(st.rs, matchSize(st)) : st.rs.game.deployRadius;
    return G.CELLS.filter((c) => (c !== G.FLAG[team] || (st.rs.switches && st.rs.switches.flagHolder)) && G.dist(c, G.FLAG[team]) <= R);
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
  function log(st, text, kind) {
    st.log.push({ turn: st.turn, team: st.toMove, text, kind: kind || "info" });
    if (st.events) st.events.push({ i: st.log.length - 1, turn: st.turn, team: st.toMove, kind: kind || "info" });   // Brief 018 §10.8
  }
  /* Brief 018 §10.8: the match log's facts (st.events). Display only: a list kept beside st.log, one entry per log line,
     on a state made by newMatch (not enumerable, so it is never copied, hashed or saved, and look-ahead copies keep
     none). While an action is applied on such a state, REC collects what happened; apply() then fills in the action's
     own entry. Nothing in the rules, brains or lab reads it. */
  let REC = null;
  const note = (st, facts) => { if (REC && REC.st === st) Object.assign(REC.extra, facts); };
  const noteList = (st, key, item) => { if (REC && REC.st === st) (REC.extra[key] = REC.extra[key] || []).push(item); };
  function snapUnits(st) {
    const out = {};
    for (const u of st.units) out[u.uid] = { hex: u.hex, hp: u.hp > 0 ? hpShown(st, u) : 0, braced: !!u.braced, sp: u.sp || null, stam: u.stam, holder: isHolder(st, u) };
    return { cmd: st.cmd, flag: { N: flagShown(st, "N"), S: flagShown(st, "S") }, units: out };
  }
  /** The roll's effect on damage as a percentage (+10, −25, ...; 0 when it changed nothing). */
  function rollPct(st, die) {
    if (sw(st, "dice2d6")) return Math.round((diceMultiplier(st, die) - 1) * 100);
    return die === 1 ? -50 : die === 6 ? 50 : 0;
  }

  function projects(st, u) {
    const c = card(st, u);
    return c.zone || (u.braced && c.brace === "zone");
  }
  /** Hexes inside a Zone of Control projected by the enemies of `team`. */
  function zoneFor(st, team) {
    const z = new Set();
    for (const u of alive(st)) if (u.team !== team && projects(st, u)) for (const n of fieldOf(st).NBRS[u.hex]) z.add(n);
    return z;
  }
  function blocked(st, mover) {
    const b = new Set(alive(st).map((u) => u.hex));
    for (const t of ["N", "S"]) if (!(sw(st, "flagHolder") && mover && mover.team === t)) b.add(fieldOf(st).FLAG[t]);
    return b;
  }
  /** v3 flag holder: the friendly unit standing on its own flag hex, if any. */
  function holderOf(st, team) {
    if (!sw(st, "flagHolder")) return null;
    return alive(st).find((u) => u.team === team && u.hex === fieldOf(st).FLAG[team]) || null;
  }
  const isHolder = (st, u) => !!u && sw(st, "flagHolder") && u.hp > 0 && u.hex === fieldOf(st).FLAG[u.team];
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
    return alive(st).some((e) => e.team !== u.team && card(st, e).trait === "tackle" && fieldOf(st).dist(e.hex, src) === 1 && fieldOf(st).dist(e.hex, dst) !== 1);
  }
  const homeOf = (team, st) => fieldOf(st).GOAL[team];
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
      for (const n of fieldOf(st).NBRS[h]) {
        if (b.has(n)) continue;
        if (ev && fieldOf(st).dist(n, ev.hex) <= fieldOf(st).dist(h, ev.hex)) continue;   // v3.3 Evade: every step further from the unit attacked
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
  function spikeCheck(st, u, hex, from, events) {
    const arrival = sw(st, "spearOnArrival");
    if (arrival && u.spearTaken) return "";
    for (const e of alive(st)) {
      if (e.team !== u.team && e.braced && card(st, e).brace === "spike" && !e.spikeUsed && fieldOf(st).dist(e.hex, hex) === 1) {
        if (arrival && from && fieldOf(st).dist(e.hex, from) === 1) continue;   // already next to this spear: staying, not arriving
        e.spikeUsed = true;
        if (arrival) u.spearTaken = true;
        const pooled = hurt(st, u, st.rs.spikeDamage);
        if (events) events.push({ type: "spear", hex, by: e.uid, amount: st.rs.spikeDamage });   // Brief 017: for route()
        noteList(st, "spear", { uid: u.uid, by: e.uid, byHex: e.hex, hex, amount: st.rs.spikeDamage, removed: u.hp <= 0 });
        return `; braced ${e.id} at ${e.hex} deals ${st.rs.spikeDamage}${pooled} (${u.id} HP ${fmt(Math.max(u.hp, 0))})` + (u.hp <= 0 ? ` — ${u.id} REMOVED` : "");
      }
    }
    return "";
  }

  function doMove(st, u, dst) {
    if (sw(st, "routeRule211")) { walkPath(st, u, planRoute(st, u, dst).path.slice(1), dst); return; }   // Brief 017 (2.11)
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
    note(st, { steps, path: [dst], end: dst, mark: mode !== "free", evading, tackle: !!tackle });
    let msg = `${u.id} ${src} → ${dst} (${steps} hex${steps > 1 ? "es" : ""}, cost ${fmt(cost)}${tackle ? ", including " + fmt(tackleCostFor(st, u)) + " for tackle" + (tackleHexes(st) ? " and 1 hex of movement" : "") : ""})` + (evading ? "; evading" : "") + (mode !== "free" ? "; stopped by Zone of Control" : "") + left;
    if (u.hp > 0) msg += spikeCheck(st, u, dst, src);
    log(st, msg, "move");
  }

  // ---------- Routes (Brief 017, Game Laws 2.11; switch routeRule211) ----------
  /* A move names only its destination; the engine picks the route and the unit walks it hex by hex.
     1 cheapest (fewest hexes: every hex costs the unit's hex cost; Marks and set spears never block the search, only
     units and flags do); 2 a route that arrives beats one that stops on the way; 3 fewer dangers (a Mark entered, a set
     spear that fires); 4 hex by hex from the start, at the first hex where two routes differ: nearer the centre column,
     then nearer the unit's own flag row. The walk stops where it enters an enemy Mark (3.8) and ends where set spear
     removes it; it is never rerouted at extra cost. The move hexes offered stay as today (reachMap). The board, the
     preview and the bots all read the same functions, and the real move walks the very path the preview shows. */
  /** The Zone of Control mode after stepping onto a hex (inz: the hex is in an enemy Mark), or null if the step is not
      allowed. The same transitions reachMap uses. */
  function zoneStep(st, m, inz) {
    if (m === "free") return inz ? "entered" : "free";
    if (m === "startzone") return inz ? "shifted" : "free";
    if (m === "entered") return !inz || sw(st, "zoneHardStop") ? null : "shifted";
    return null;
  }
  const stopMode = (m) => m === "entered" || m === "shifted";
  /** The enemy projecting the Mark on `h` (the first in unit order), for the preview's badge. */
  function markerOf(st, u, h) {
    const G = fieldOf(st), x = alive(st).find((e) => e.team !== u.team && projects(st, e) && G.dist(e.hex, h) === 1);
    return x ? x.uid : null;
  }
  /** Walks `u` along `path` (the hexes after its own), as the move does: each hex entered in turn, set spear checked on
      arrival at each, a stop where it enters a Mark, removal where set spear removes it. Then charges the hexes walked
      (and tackle, by where it ended) and logs the move. Returns what happened. `dst` is the hex the player chose. */
  function walkPath(st, u, path, dst) {
    if (u.done) fail(`${u.id} has already ended its turn.`);
    const G = fieldOf(st), c = card(st, u), z = zoneFor(st, u.team), ev = evadeTarget(st, u), evading = !!ev;
    let m = ev && !u.evadeMoved ? (z.has(u.hex) ? "startzone" : "free") : (u.zmode || (z.has(u.hex) ? "startzone" : "free"));
    const src = u.hex, events = [], walked = [];
    let left = leaveFlag(st, u), spear = "";
    for (const h of path) {
      const nm = zoneStep(st, m, z.has(h));
      if (nm === null) break;
      const prev = u.hex;
      if (walked.length && sw(st, "flagHolder") && prev === G.FLAG[u.team]) left += leaveFlag(st, u);   // passing over its own flag
      u.hex = h; m = nm; walked.push(h);
      if (u.hp > 0) spear += spikeCheck(st, u, h, prev, events);
      if (stopMode(m)) events.push({ type: "mark", hex: h, by: markerOf(st, u, h) });
      if (u.hp <= 0 || stopMode(m)) break;
    }
    if (!walked.length) fail(`${u.id} cannot step onto ${path[0]}.`);
    const steps = walked.length, end = u.hex;
    const tk = tackleApplies(st, u, src, end);
    if (tk) {
      const by = alive(st).find((e) => e.team !== u.team && card(st, e).trait === "tackle" && G.dist(e.hex, src) === 1 && G.dist(e.hex, end) !== 1);
      events.unshift({ type: "tackle", hex: src, by: by ? by.uid : null, amount: tackleCostFor(st, u) });
    }
    if (steps + (tk ? tackleHexes(st) : 0) > capOf(st, u) - u.moved) fail(`${u.id} has no movement left for that.`);
    const cost = steps * c.hexCost + (tk ? tackleCostFor(st, u) : 0);
    spend(st, u, cost);
    u.moved += steps + (tk ? tackleHexes(st) : 0); u.zmode = m;
    if (tk) u.tackled = true;
    if (evading) u.evadeMoved = true;
    const short = end !== dst;
    note(st, { steps, path: walked.slice(), end, short, mark: stopMode(m), evading, tackle: !!tk });
    let msg = `${u.id} ${src} → ${end} (${steps} hex${steps > 1 ? "es" : ""} via ${walked.join(" ")}, cost ${fmt(cost)}${tk ? ", including " + fmt(tackleCostFor(st, u)) + " for tackle" + (tackleHexes(st) ? " and 1 hex of movement" : "") : ""})` +
      (evading ? "; evading" : "") + (stopMode(m) ? (short ? `; stopped by Zone of Control short of ${dst}` : "; stopped by Zone of Control") : "") + left + spear;
    if (short && u.hp <= 0 && !stopMode(m)) msg += ` (short of ${dst})`;
    log(st, msg, "move");
    return { walked, end, events, cost, steps, removed: u.hp <= 0 };
  }
  /** The default-direction key of a hex (rule 4): column steps from the centre column, then distance to its own flag's row. */
  function dirKey(st, u, h) {
    const G = fieldOf(st), row = (x) => G.geo(...G.parse(x))[1];
    return [Math.abs(G.offset(h)), Math.abs(row(h) - row(G.FLAG[u.team]))];
  }
  /** Rule 4: compare two routes hex by hex from the start; the first hex where they differ decides. The hex name is a
      last resort that no field reaches with equal-length routes (two different hexes next to one hex never share both
      keys unless they mirror across the centre column, which a shortest route to one hex can't). */
  function dirCompare(st, u, a, b) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) continue;
      const ka = dirKey(st, u, a[i]), kb = dirKey(st, u, b[i]);
      if (ka[0] !== kb[0]) return ka[0] - kb[0];
      if (ka[1] !== kb[1]) return ka[1] - kb[1];
      return a[i] < b[i] ? -1 : 1;
    }
    return a.length - b.length;
  }
  /** Every path of exactly `L` steps from u's hex to dst over unblocked hexes (an evading unit: every step further from
      the unit it attacked), no hex twice. */
  function pathsOf(st, u, dst, L) {
    const G = fieldOf(st), b = blocked(st, u), ev = evadeTarget(st, u);
    const ok = (h, n) => !b.has(n) && (!ev || G.dist(n, ev.hex) > G.dist(h, ev.hex));
    const out = [], path = [u.hex];
    (function dfs(h, r) {
      if (r === 0) { if (h === dst) out.push(path.slice()); return; }
      if (G.dist(h, dst) > r) return;
      for (const n of G.NBRS[h]) {
        if (!ok(h, n) || path.includes(n)) continue;
        path.push(n); dfs(n, r - 1); path.pop();
      }
    })(u.hex, L);
    return out;
  }
  /** The route a move to dst takes (rules 1-4), with what walking it does, played on a scratch copy. */
  function planRoute(st, u, dst) {
    if (u.done) fail(`${u.id} has already ended its turn.`);
    const rm = reachMap(st, u);
    if (!rm[dst]) fail(`${u.id} cannot reach ${dst}.`);
    const G = fieldOf(st), z = zoneFor(st, u.team);
    const spears = alive(st).filter((e) => e.team !== u.team && e.braced && card(st, e).brace === "spike" && !e.spikeUsed);
    const danger = (h) => z.has(h) || spears.some((e) => G.dist(e.hex, h) === 1);
    const walk = (p) => {
      const s = cloneLite(st), su = unitByUid(s, u.uid);
      try { return walkPath(s, su, p.slice(1), dst); } catch (e) { if (!e.illegal) throw e; return null; }
    };
    for (let L = G.dist(u.hex, dst); L <= rm[dst].steps; L++) {
      const paths = pathsOf(st, u, dst, L);
      if (!paths.length) continue;
      paths.sort((a, b) => dirCompare(st, u, a.slice(1), b.slice(1)));
      // No route touches a danger: they all arrive with nothing on the way, so rule 4 alone decides.
      if (!paths.some((p) => p.slice(1).some(danger))) { const r = walk(paths[0]); if (r) return Object.assign({ path: paths[0] }, r); }
      const cands = [];
      for (const p of paths) { const r = walk(p); if (r) cands.push(Object.assign({ path: p }, r)); }
      if (!cands.length) continue;
      const dangers = (r) => r.events.filter((e) => e.type === "mark" || e.type === "spear").length;
      cands.sort((a, b) => ((a.end === dst ? 0 : 1) - (b.end === dst ? 0 : 1)) || (dangers(a) - dangers(b)));   // stable: rule 4 order kept
      return cands[0];
    }
    fail(`${u.id} has no route to ${dst}.`);
  }
  /** Brief 017, for the board and the bots: the route a move to dst takes and what happens on it.
      { path: [the unit's hex, ..., dst], end, stoppedShort, cost, events: [{type: 'mark'|'spear'|'tackle', hex, by, amount}] }
      in walking order. Null if the unit can't move there. Rule sets before routeRule211 (the move jumps): the path is a
      shortest legal one by the same direction rule, and the events are what the jump does (tackle, set spear at the end). */
  function route(st, uid, dst) {
    const u = unitByUid(st, uid);
    if (!u || u.hp <= 0 || u.done || st.phase !== "play" || u.team !== st.toMove) return null;
    const rm = reachMap(st, u);
    if (!rm[dst]) return null;
    try {
      if (sw(st, "routeRule211")) {
        const r = planRoute(st, u, dst);
        return { path: r.path, end: r.end, stoppedShort: r.end !== dst, cost: r.cost, events: r.events };
      }
      // Older rule sets: a path that the old jump allows (only its last hex in a Mark, as reachMap), and the jump's events.
      const z = zoneFor(st, u.team), ev = evadeTarget(st, u);
      const m0 = ev && !u.evadeMoved ? (z.has(u.hex) ? "startzone" : "free") : (u.zmode || (z.has(u.hex) ? "startzone" : "free"));
      const legal = (p) => { let m = m0; for (let i = 1; i < p.length; i++) { if (stopMode(m)) return false; m = zoneStep(st, m, z.has(p[i])); if (m === null) return false; } return true; };
      const paths = pathsOf(st, u, dst, rm[dst].steps).filter(legal).sort((a, b) => dirCompare(st, u, a.slice(1), b.slice(1)));
      const s = cloneLite(st), su = unitByUid(s, uid), events = [];
      if (rm[dst].tackle) {
        const by = alive(st).find((e) => e.team !== u.team && card(st, e).trait === "tackle" && fieldOf(st).dist(e.hex, u.hex) === 1 && fieldOf(st).dist(e.hex, dst) !== 1);
        events.push({ type: "tackle", hex: u.hex, by: by ? by.uid : null, amount: tackleCostFor(st, u) });
      }
      leaveFlag(s, su); const from = su.hex; su.hex = dst;
      if (su.hp > 0) spikeCheck(s, su, dst, from, events);
      if (stopMode(rm[dst].mode)) events.push({ type: "mark", hex: dst, by: markerOf(st, u, dst) });
      return { path: paths[0] || [u.hex, dst], end: dst, stoppedShort: false, cost: rm[dst].cost, events };
    } catch (e) { if (!e.illegal) throw e; return null; }
  }
  /** Brief 017: could the unit still attack after moving to dst (Stamina, Command, Reload, warm-up, still standing)? */
  function canAttackAfter(st, uid, dst) {
    const s = cloneLite(st), u = unitByUid(s, uid);
    if (!u) return false;
    try { if (dst !== u.hex) apply(s, { type: "move", uid, to: dst }); } catch (e) { if (!e.illegal) throw e; return false; }
    const g = s.rs.game;
    if (u.hp <= 0 || u.done || u.sp === "warm" || evadeTarget(s, u)) return false;
    if (card(s, u).reload && u.attackedLast) return false;
    return u.stam + EPS >= g.attackCost && s.cmd + EPS >= g.attackCost;
  }
  /** Brief 017: every hex the unit could hit from `fromHex` (hexes, occupied or empty). kind 'normal': adjacent hexes,
      Volley range, Reach's six spokes; 'special': the special's own shape (Javelin's spokes 2-3 over friends, never over
      enemies; the adjacent specials' six hexes; Bullseye and Arrow Storm as the normal range). The flag blocks straight
      lines (4.9). A flag hex counts only from its own goal zone (the holder is stormed from there); never for a special. */
  function rangeHexes(st, uid, fromHex, kind) {
    const u = unitByUid(st, uid), G = fieldOf(st);
    if (!u || !fromHex) return [];
    const c = card(st, u), out = [], block = (h) => sw(st, "flagBlocksLine") && G.flagBetween(fromHex, h);
    const flagOk = (h) => !G.onFlag(h) || (sw(st, "flagHolder") && h !== G.FLAG[u.team] && G.GOAL[foeOf(u.team)].has(fromHex));
    const normal = (h, d) => d === 1 || (!block(h) && ((c.range > 1 && d <= c.range) || (c.trait === "reach" && d === 2 && G.straight2(fromHex, h))));
    const sk = kind === "special" ? specialOf(st, u) : null;
    if (kind === "special" && !sk) return [];
    for (const h of G.CELLS) {
      if (h === fromHex) continue;
      const d = G.dist(fromHex, h);
      if (kind !== "special") { if (normal(h, d) && flagOk(h)) out.push(h); continue; }
      if (G.onFlag(h)) continue;   // no special on a flag hex (F8)
      if (sk === "arcHit" || sk === "pickOff" || sk === "skewer") { if (d === 1) out.push(h); continue; }
      if (sk === "bullseye" || sk === "arrowStorm") { if (normal(h, d)) out.push(h); continue; }
      if (sk === "javelin") {
        const n = specNums(st, sk), mid = G.lineBetween(fromHex, h);
        if (d < (n.minRange || 2) || d > (n.maxRange || 3) || !mid || block(h)) continue;
        if (alive(st).some((e) => e.team !== u.team && mid.includes(e.hex))) continue;
        out.push(h);
      }
    }
    return out;
  }
  /** Brief 017: the hexes the attacker could Evade to if `t` survives its attack now: { hex: mode }. {} when no Evade. */
  function evadeHexes(st, uid, targetUid) {
    const u = unitByUid(st, uid), t = unitByUid(st, targetUid);
    if (!u || !t || !sw(st, "evade") || !card(st, u).evade || fieldOf(st).dist(u.hex, t.hex) !== 1) return {};
    const s = cloneLite(st), su = unitByUid(s, u.uid), g = st.rs.game;
    su.stam -= g.attackCost; s.cmd -= g.attackCost; su.done = false; su.evadeFrom = t.uid; su.evadeMoved = false; su.attackedThis = true;
    const moves = reachMap(s, su), out = {};
    for (const h in moves) out[h] = moves[h].mode;
    return out;
  }
  /** Brief 017: what follows if this attack removes `t`: the attacker takes the hex (3.6), so set spear on taking it
      ({type:'spear', hex, by, amount}) and the Mark it would stand in ({type:'mark', hex, by}). [] if nothing; null if the
      attacker doesn't take the hex (ranged, Reach from 2, a holder, a held flag). opt.special: Pick Off takes the hex too. */
  function killConsequences(st, uid, targetUid, opt) {
    const u = unitByUid(st, uid), t = unitByUid(st, targetUid);
    if (!u || !t) return null;
    const pick = opt && opt.special ? specialOf(st, u) === "pickOff" : true;
    if (!pick || !capturePreview(st, u, t) || isHolder(st, t)) return null;
    const s = cloneLite(st), su = unitByUid(s, uid), st2 = unitByUid(s, targetUid), events = [];
    st2.hp = 0; const was = su.hex; su.hex = st2.hex;
    if (s.rs.switches.captureTriggersSpike) spikeCheck(s, su, su.hex, was, events);
    if (zoneFor(s, u.team).has(su.hex)) events.push({ type: "mark", hex: su.hex, by: markerOf(s, su, su.hex) });
    return events;
  }
  /** Brief 017 (section 9): an enemy unit as it would stand at the start of its side's next turn: where it could move
      (full Stamina less its own next-turn modifiers, its side's full Command), its normal range, its special's range if it
      can fire next turn (warmed up now), and which of the side-to-move's units it could hit now. */
  function enemyPreview(st, uid) {
    const u = unitByUid(st, uid);
    if (!u || u.hp <= 0 || !u.hex) return null;
    const s = cloneLite(st), su = unitByUid(s, uid);
    s.toMove = u.team; s.cmd = s.rs.game.command;
    Object.assign(su, { stam: nextStamina(st, u), braced: false, done: false, moved: 0, zmode: null, tackled: false, evadeFrom: null, evadeMoved: false, spearTaken: false });
    const moves = {}, rm = reachMap(s, su);
    for (const h in rm) moves[h] = rm[h].mode;
    const range = rangeHexes(st, uid, u.hex, "normal");
    const specialNext = !!specialOf(st, u) && (u.sp === "warm" || u.sp === "charged");
    const special = specialNext ? rangeHexes(st, uid, u.hex, "special") : null;
    const reach = new Set(range.concat(special || []));
    const canHit = alive(st).filter((x) => x.team !== u.team && reach.has(x.hex)).map((x) => x.uid);
    return { moves, range, special, specialNext, canHit, stamNext: su.stam };
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
    if (fieldOf(st).dist(a.hex, b.hex) !== 1) fail("Units must be adjacent to swap.");
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
    note(st, { steps: 1, swap: true });
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
    const nb = fieldOf(st).NBRS[t.hex];
    const blocked = new Set();
    const units = alive(st).filter((x) => x !== t);
    for (const n of nb) {
      if (n === fieldOf(st).FLAG.N || n === fieldOf(st).FLAG.S) blocked.add(n);
      const x = units.find((y) => y.hex === n);
      if (x) {
        blocked.add(n);
        if (x.team !== t.team) for (const m of nb) if (fieldOf(st).dist(m, n) === 1) blocked.add(m);
      }
    }
    const open = nb.filter((n) => !blocked.has(n)).length;   // hexes off the field are never open
    let pct = open * per;
    if (t.braced && card(st, t).brace === "dodgeDouble") pct *= 2;
    return { open, pct: Math.min(pct, 95) };
  }
  function canAttackFrom(st, u, h, t) {
    const c = card(st, u), d = fieldOf(st).dist(h, t.hex);
    if (c.reload && u.attackedLast) return false;
    if (isHolder(st, t) && !fieldOf(st).GOAL[t.team].has(h)) return false;   // the flag is a fort: storm it from the goal zone
    if (d === 1) return true;
    if (sw(st, "flagBlocksLine") && fieldOf(st).flagBetween(h, t.hex)) return false;   // v3.6: a flag blocks Volley and Reach (4.9)
    if (c.trait === "reach" && d === 2 && fieldOf(st).straight2(h, t.hex)) {
      const m = fieldOf(st).middle(h, t.hex);
      return !alive(st).some((e) => e.team !== u.team && e.hex === m);
    }
    return c.range > 1 && d <= c.range;
  }

  /** The attack value before the die, with every step named. `h` = the hex attacked from.
      `detail` (Brief 009, read-only, for the attack preview): the same steps as numbers and names, so the board never
      works them out itself. It changes nothing the rules do. */
  function breakdown(st, u, t, h, opt) {
    const g = st.rs.game, c = card(st, u), tc = card(st, t), d = fieldOf(st).dist(h, t.hex);
    // opt (Brief 011, specials only): reach true = Reach's −1 at any distance (Javelin at 3); reach false = none (Skewer's
    // second hit). No normal attack passes opt, so normal attacks are worked out exactly as before.
    const reachHere = opt && opt.reach !== undefined ? opt.reach : c.range === 1 && d === 2;
    let v = c.str; const parts = [`Strength ${c.str}`];
    const detail = { str: c.str, reach: 0, halvedBy: null, strAfter: c.str, supporters: [], support: 0, noSupport: false,
      armor: tc.armor || 0, pierce: false, armorTaken: 0, dodge: null, brace: 0, defenderSupport: 0, home: null };
    if (reachHere) { v -= g.reachPenalty; parts.push(`−${g.reachPenalty} Reach`); detail.reach = g.reachPenalty; }
    if (c.range > 1 && st.rs.switches.rangedHalfWhenAdjacent && alive(st).some((e) => e.team === t.team && fieldOf(st).dist(e.hex, h) === 1)) {
      v = halve(st, v); parts.push("enemy adjacent: halved");
      detail.halvedBy = alive(st).filter((e) => e.team === t.team && fieldOf(st).dist(e.hex, h) === 1).map((e) => e.uid);
    }
    detail.strAfter = v;
    const helpers = alive(st).filter((a) => a.team === u.team && a !== u && fieldOf(st).dist(a.hex, t.hex) === 1).length;
    detail.supporters = alive(st).filter((a) => a.team === u.team && a !== u && fieldOf(st).dist(a.hex, t.hex) === 1).map((a) => a.uid);
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
    else if (st.rs.switches.defenderSupport && alive(st).some((a) => a.team === t.team && a !== t && fieldOf(st).dist(a.hex, t.hex) === 1)) { v -= 1; parts.push("−1 defender Support"); detail.defenderSupport = 1; }
    if (homeOf(t.team, st).has(t.hex)) {
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
    const d = fieldOf(st).dist(u.hex, t.hex);
    if (u.sp === "warm") fail(`${u.id} warmed up its special this turn: no attack until it fires.`);   // v3.7 (6.16)
    if (!canAttackFrom(st, u, u.hex, t)) fail(card(st, u).reload && u.attackedLast ? `${u.id} is reloading this turn.` : `${u.id} at ${u.hex} cannot attack ${t.id} at ${t.hex}.`);
    spend(st, u, st.rs.game.attackCost);
    u.done = true; u.attackedThis = true;
    const { value, parts, dodge } = breakdown(st, u, t, u.hex);
    const die = roll();
    const dmg = applyDie(st, value, die, dodge);
    const wasHolder = isHolder(st, t);
    note(st, { str: card(st, u).str, parts: parts.slice(), value, die, roll: rollPct(st, die), dmg, reach: card(st, u).trait === "reach" && d === 2 });
    const pooled = hurt(st, t, dmg);
    let msg = `${u.id} (${u.hex}) attacks ${t.id} (${t.hex}${wasHolder ? ", holding the flag" : ""}): ${parts.join(", ")} = ${fmt(value)}; ${sw(st, "dice2d6") ? "dice" : "die"} ${die} → ${fmt(dmg)} damage${pooled}; ${t.id} HP ${fmt(Math.max(t.hp, 0))}`;
    if (t.braced && card(st, t).brace === "parry" && d === 1) {
      if (sw(st, "parryFirstOnly") && t.parryUsed) msg += `; no parry (${t.id} has already parried this turn)`;   // v3.2
      else if (sw(st, "parryNeedsSurvivor") && t.hp <= 0) msg += `; no parry (${t.id} did not survive the hit)`;  // v3.2
      else {
        const pd = parryAmount(st, u);
        const pp = hurt(st, u, pd);
        note(st, { parry: { amount: pd, by: t.uid, removed: u.hp <= 0 } });
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
        u.hex = t.hex; msg += `; ${u.id} takes ${t.hex}`; note(st, { take: t.hex });
        if (st.rs.switches.captureTriggersSpike) msg += spikeCheck(st, u, u.hex, was);
      }
    }
    // v3.3 Evade: a Light unit whose adjacent attack left the target standing may step away instead of ending its turn.
    if (sw(st, "evade") && card(st, u).evade && d === 1 && t.hp > 0 && u.hp > 0) {
      u.done = false; u.evadeFrom = t.uid; u.evadeMoved = false;
      msg += `; ${u.id} may evade`; note(st, { mayEvade: true });
    }
    log(st, msg, "attack");
    return { die, dmg };
  }

  /** v3.6 (pullCountsForReload, 3.11): a reloading unit can't pull either. */
  const pullReloading = (st, u) => sw(st, "pullCountsForReload") && !!card(st, u).reload && !!u.attackedLast;
  function canPullFrom(st, u, h) { return homeOf(foeOf(u.team), st).has(h) && !holderOf(st, foeOf(u.team)) && !pullReloading(st, u); }
  function pullValue(st, u) {
    const c = card(st, u), foe = foeOf(u.team);
    let v = c.range > 1 && !sw(st, "pullFullStrength") ? halve(st, c.str) : c.str;   // v3.6: a pull is always full Strength (4.6)
    const parts = [`Strength ${fmt(v)}`];
    if (sw(st, "pullSupport")) {
      // Pull Support: +1 (supportBonus) for every other friendly unit next to the flag, as Support on an attack.
      const helpers = alive(st).filter((a) => a.team === u.team && a !== u && homeOf(foe, st).has(a.hex)).length;
      if (helpers) { const sb = st.rs.game.supportBonus * helpers; v += sb; parts.push(`+${fmt(sb)} Support`); }
    }
    if (alive(st).some((e) => e.team === foe && e.fk && homeOf(foe, st).has(e.hex))) {
      v = Math.max(v - st.rs.game.keeperPullReduction, 0); parts.push(`−${st.rs.game.keeperPullReduction} keeper at home`);
    }
    return { value: v, parts };
  }
  function doPull(st, u, roll) {
    if (pullReloading(st, u)) fail(`${u.id} is reloading this turn.`);
    if (u.sp === "warm") fail(`${u.id} warmed up its special this turn: no pull (a pull counts as an attack).`);   // v3.7 (6.16, F8)
    if (!canPullFrom(st, u, u.hex)) fail(`${u.id} is not next to the enemy flag.`);
    spend(st, u, st.rs.game.attackCost);
    u.done = true;
    if (sw(st, "pullCountsForReload")) u.attackedThis = true;   // v3.6: a pull counts as an attack for Reload (no Evade, no parry)
    const foe = foeOf(u.team);
    const { value, parts } = pullValue(st, u);
    const die = roll();
    const dmg = applyDie(st, value, die);
    st.pole[foe] = Math.min(st.rs.game.poleHP, st.pole[foe] + dmg);
    note(st, { str: card(st, u).str, parts: parts.slice(), value, die, roll: rollPct(st, die), dmg, flagOf: foe });
    log(st, `${u.id} pulls at ${u.hex}: ${parts.join(", ")} = ${fmt(value)}; ${sw(st, "dice2d6") ? "dice" : "die"} ${die} → ${fmt(dmg)}; ${foe === "N" ? "North" : "South"} flag HP ${fmt(st.rs.game.poleHP - st.pole[foe])}/${st.rs.game.poleHP}`, "pull");
    return { die, dmg };
  }

  function doBrace(st, u) {
    if (u.sp === "warm") fail(`${u.id} warmed up its special this turn: no brace.`);   // v3.7 (6.16)
    spend(st, u, st.rs.game.braceCost);
    u.done = true; u.braced = true; u.spikeUsed = false;
    if (sw(st, "parryFirstOnly")) u.parryUsed = false;   // v3.2: a fresh brace has its parry ready
    log(st, `${u.id} braces at ${u.hex}`, "brace");
  }

  // ---------- Specials (v3.7, Brief 011, Game Laws 6.16 and 6.17) ----------
  /* A unit's special is in one of four states, kept on the unit as u.sp (only under the specials switch, so older rule
     sets never see it): "unused"; "warm" (warmed up this turn: no attack, pull or brace for the rest of it; shown as
     Warming up through the enemy's turn); "charged" (its next turn: it may fire now, or it lapses back to unused when the
     turn ends); "used". The board and the brains read these; nothing keeps its own copy. */
  const SPECIAL_NAMES = { arcHit: "Arc Hit", pickOff: "Pick Off", bullseye: "Bullseye", arrowStorm: "Arrow Storm", skewer: "Skewer", javelin: "Javelin" };
  /** The unit's special kind under this rule set, or null (no specials switch, or no special on its card). */
  const specialOf = (st, u) => (sw(st, "specials") && card(st, u).special) || null;
  const specialName = (kind) => SPECIAL_NAMES[kind] || kind;
  const specNums = (st, kind) => (st.rs.specials && st.rs.specials[kind]) || {};
  /** Can `u`'s special take `t` as its target from where `u` stands (state and costs aside)? */
  function specialCanTarget(st, u, t) {
    const kind = specialOf(st, u);
    if (!kind || !t || t.hp <= 0 || t.team === u.team || fieldOf(st).onFlag(t.hex)) return false;   // no special on a flag hex (F8)
    const d = fieldOf(st).dist(u.hex, t.hex);
    if (kind === "arcHit" || kind === "pickOff" || kind === "skewer") return d === 1;
    if (kind === "bullseye" || kind === "arrowStorm") return canAttackFrom(st, u, u.hex, t);
    if (kind === "javelin") {
      const n = specNums(st, kind), mid = fieldOf(st).lineBetween(u.hex, t.hex);
      if (d < (n.minRange || 2) || d > (n.maxRange || 3) || !mid) return false;
      if (sw(st, "flagBlocksLine") && fieldOf(st).flagBetween(u.hex, t.hex)) return false;   // the flag block (4.9)
      return !alive(st).some((e) => e.team !== u.team && mid.includes(e.hex));    // over friends, never over enemies
    }
    return false;
  }
  /** One special hit on `t` from `u`'s hex: the normal value without the roll, times the multiplier (6.16.3). */
  function specialHit(st, u, t, mult, opt) {
    const b = breakdown(st, u, t, u.hex, opt && opt.reach !== undefined ? { reach: opt.reach } : undefined);
    const dodge = opt && opt.noDodge ? 0 : b.dodge;
    let dmg = b.value * (1 - dodge / 100) * mult;
    dmg = sw(st, "halfPoints") ? half(dmg) : Math.round(dmg);
    dmg = Math.max(st.rs.game.minDamage, dmg);
    return { uid: t.uid, id: t.id, value: b.value, dodge: b.dodge, dodgeIgnored: !!(opt && opt.noDodge && b.dodge), mult, dmg, parts: b.parts, detail: b.detail,
      hpBefore: effHp(st, t), kills: dmg >= effHp(st, t) - EPS, why: (opt && opt.why) || null };
  }
  /** Every hit a special would make on target `t` now, primary first: the exact numbers the engine will deal. */
  function specialHits(st, u, t) {
    const kind = specialOf(st, u), n = specNums(st, kind), out = [];
    if (kind === "arcHit") {
      const arc = fieldOf(st).arcOf(u.hex, t.hex);
      out.push(specialHit(st, u, t, n.mult));
      for (const h of arc) { const x = alive(st).find((e) => e.hex === h && e !== t); if (x && x.team !== u.team) out.push(specialHit(st, u, x, n.mult)); }
    } else if (kind === "pickOff") {
      const friends = alive(st).filter((f) => f.team === t.team && f !== t && fieldOf(st).dist(f.hex, t.hex) === 1).length;
      const m = Math.max(n.floor !== undefined ? n.floor : 1, n.mult - (n.lessPerFriend || 0) * friends);
      out.push(specialHit(st, u, t, m, { why: friends ? `${friends} friend${friends > 1 ? "s" : ""} next to the target: ×${fmt(m)}` : null }));
    } else if (kind === "bullseye") {
      out.push(specialHit(st, u, t, n.mult, { why: card(st, t).armor && card(st, u).trait === "ignoreArmor" ? `Armor ${card(st, t).armor} doesn't count (Pierce)` : null }));
    } else if (kind === "arrowStorm") {
      const h = specialHit(st, u, t, n.mult, { noDodge: true });
      if (h.dodgeIgnored) h.why = `Dodge ${h.dodge}% doesn't count`;
      out.push(h);
    } else if (kind === "skewer") {
      out.push(specialHit(st, u, t, n.first));
      const b = fieldOf(st).hexBehind(u.hex, t.hex), x = b && !fieldOf(st).onFlag(b) ? alive(st).find((e) => e.hex === b) : null;   // a holder behind is never hit
      if (x && x.team !== u.team) out.push(specialHit(st, u, x, n.behind, { reach: !!n.behindReach }));
    } else if (kind === "javelin") {
      out.push(specialHit(st, u, t, n.mult, { reach: true, why: `Reach −${st.rs.game.reachPenalty} Strength, then ×${fmt(n.mult)}` }));
    }
    return out;
  }
  /** Why the special can't be warmed up now (null = it can). */
  function warmupBlock(st, u) {
    if (!specialOf(st, u)) return "No special in this rule set";
    if (u.sp === "used") return "Used";
    if (u.sp === "warm") return "Fire it next turn";
    if (u.braced) return "Braced this turn";
    if (u.attackedThis) return "Already attacked this turn";   // a pull counts as an attack (6.16, F8)
    if (u.done) return `${u.id} has ended its turn`;
    if (evadeTarget(st, u)) return `${u.id} attacked this turn and may only evade or end`;
    const c = st.rs.game.warmupCost;
    if (u.stam + EPS < c) return "Not enough Stamina";
    if (st.cmd + EPS < c) return "Not enough Command";   // Brief 026: the side's Command, not the unit's Stamina, is short
    return null;
  }
  /** Why the special can't fire now, at any target (null = it can at some target). */
  function fireBlock(st, u) {
    if (!specialOf(st, u)) return "No special in this rule set";
    if (u.sp === "used") return "Used";
    if (u.sp === "warm") return "Fire it next turn";
    if (u.sp !== "charged") return "Warm it up first";
    if (u.braced) return "Braced this turn";
    if (u.attackedThis) return "Already attacked this turn";
    if (u.done) return `${u.id} has ended its turn`;
    if (card(st, u).reload && u.attackedLast) return `${u.id} is reloading this turn`;
    const c = st.rs.game.attackCost;
    if (u.stam + EPS < c) return "Not enough Stamina";
    if (st.cmd + EPS < c) return "Not enough Command";   // Brief 026
    if (!alive(st).some((t) => specialCanTarget(st, u, t))) return "No target in reach";
    return null;
  }
  function doWarmup(st, u) {
    const why = warmupBlock(st, u);
    if (why) fail(why === "Used" || why === "Fire it next turn" ? `${u.id}'s ${specialName(specialOf(st, u))}: ${why.toLowerCase()}.` : `${u.id} cannot warm up: ${why}.`);
    spend(st, u, st.rs.game.warmupCost);
    const again = u.sp === "charged";
    u.sp = "warm";
    note(st, { special: specialName(specialOf(st, u)), warm: true });
    log(st, `${u.id} warms up ${specialName(specialOf(st, u))} at ${u.hex}${again ? " (again)" : ""}.`, "special");
  }
  function doSpecial(st, u, t) {
    const kind = specialOf(st, u), why = fireBlock(st, u);
    if (why) fail(`${u.id} cannot fire: ${why}.`);
    if (!specialCanTarget(st, u, t)) fail(`${u.id}'s ${specialName(kind)} cannot target ${t.id} at ${t.hex}.`);
    spend(st, u, st.rs.game.attackCost);
    u.done = true; u.attackedThis = true; u.sp = "used";
    const d = fieldOf(st).dist(u.hex, t.hex), hits = specialHits(st, u, t);
    // All hits land first (Article 1.12), then reactions.
    const pieces = [];
    note(st, { special: specialName(kind), str: card(st, u).str, hits: hits.map((h) => ({ uid: h.uid, dmg: h.dmg, mult: h.mult, value: h.value, parts: h.parts.slice() })) });
    for (const h of hits) {
      const x = unitByUid(st, h.uid);
      hurt(st, x, h.dmg);
      pieces.push(`${x.id} (${x.hex}): ${h.parts.join(", ")} = ${fmt(h.value)}; no dice${h.dodgeIgnored ? ", Dodge doesn't count" : h.dodge ? `, Dodge ${h.dodge}%` : ""}; ×${fmt(h.mult)} → ${fmt(h.dmg)} damage; ${x.id} HP ${fmt(Math.max(x.hp, 0))}` + (x.hp <= 0 ? ` — ${x.id} REMOVED` : ""));
    }
    let msg = `${u.id} (${u.hex}) fires ${specialName(kind)}: ` + pieces.join("; ");
    // Parry: only adjacent hits on a braced Heavy Melee; each such hit uses up that unit's parry; one parry per action.
    let parried = false;
    for (const h of hits) {
      const x = unitByUid(st, h.uid);
      if (!(x.braced && card(st, x).brace === "parry" && fieldOf(st).dist(u.hex, x.hex) === 1)) continue;
      if (!parried && u.hp > 0 && !(sw(st, "parryFirstOnly") && x.parryUsed) && !(sw(st, "parryNeedsSurvivor") && x.hp <= 0)) {
        const pd = parryAmount(st, u), pp = hurt(st, u, pd);
        parried = true;
        note(st, { parry: { amount: pd, by: x.uid, removed: u.hp <= 0 } });
        msg += `; ${x.id} parries for ${fmt(pd)}${pp} (${u.id} HP ${fmt(Math.max(u.hp, 0))})` + (u.hp <= 0 ? ` — ${u.id} REMOVED` : "");
      }
      if (sw(st, "parryFirstOnly")) x.parryUsed = true;
    }
    // Taking the hex: Pick Off only, as any adjacent melee kill (3.6); Arc Hit and Skewer never step in (6.17).
    if (kind === "pickOff" && t.hp <= 0 && d === 1 && u.hp > 0 && !(sw(st, "holderHoldsHex") && isHolder(st, u))) {
      const was = u.hex;
      u.hex = t.hex; msg += `; ${u.id} takes ${t.hex}`; note(st, { take: t.hex });
      if (st.rs.switches.captureTriggersSpike) msg += spikeCheck(st, u, u.hex, was);
    }
    // Evade (6.5): a Light unit after an adjacent special that leaves its target standing.
    if (sw(st, "evade") && card(st, u).evade && d === 1 && t.hp > 0 && u.hp > 0) {
      u.done = false; u.evadeFrom = t.uid; u.evadeMoved = false;
      msg += `; ${u.id} may evade`; note(st, { mayEvade: true });
    }
    log(st, msg, "special");
    return { hits: hits.map((h) => ({ uid: h.uid, dmg: h.dmg })) };
  }
  /** Everything the board shows about firing at `t` now: the hits (exact), the arc, parry and taking the hex. */
  function specialPreview(st, u, t) {
    const kind = specialOf(st, u);
    if (!kind || !specialCanTarget(st, u, t)) return null;
    const hits = specialHits(st, u, t), d = fieldOf(st).dist(u.hex, t.hex);
    // Brief 026 (F026-1): the same choice as doSpecial's parry loop: the first braced Heavy Melee hit in order that can
    // parry, skipping one already used (v3.2) and, under parryNeedsSurvivor, one its own hit removes. Display only.
    const parryHit = hits.find((h) => { const x = unitByUid(st, h.uid);
      return x.braced && card(st, x).brace === "parry" && fieldOf(st).dist(u.hex, x.hex) === 1 && !(sw(st, "parryFirstOnly") && x.parryUsed) && !(sw(st, "parryNeedsSurvivor") && h.kills); });
    const parryFrom = parryHit ? unitByUid(st, parryHit.uid) : null;
    const n = specNums(st, kind);
    return { kind, name: specialName(kind), target: t.uid, hits, arc: kind === "arcHit" ? fieldOf(st).arcOf(u.hex, t.hex) : null,
      behind: kind === "skewer" ? fieldOf(st).hexBehind(u.hex, t.hex) : null,
      parry: parryFrom ? { by: parryFrom.uid, amount: parryAmount(st, u), ifSurvives: sw(st, "parryNeedsSurvivor") } : null,
      capture: kind === "pickOff" && d === 1 && !(sw(st, "holderHoldsHex") && isHolder(st, u)) ? capturePreview(st, u, t) : null,
      evade: kind === "pickOff" || (kind === "arrowStorm" && d === 1) ? evadePreview(st, u, t) : null, nums: Object.assign({}, n) };
  }
  /** The special's state as the board shows it: "Unused", "Warming up", "Charged" (its firing turn) or "Used"; null without one. */
  function specialState(st, u) {
    if (!specialOf(st, u)) return null;
    return u.sp === "used" ? "Used" : u.sp === "warm" ? "Warming up" : u.sp === "charged" ? "Charged" : "Unused";
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
      if (u.sp === "warm") u.sp = "charged";   // v3.7: warmed last turn, it may fire now
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
    // v3.7 (6.16): a charged special not fired this turn lapses back to unused.
    for (const u of alive(st)) if (u.team === st.toMove && u.sp === "charged") { u.sp = "unused"; log(st, `${u.id}'s ${specialName(specialOf(st, u))} lapses (not fired).`, "special"); }
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
        if (rs.switches && rs.switches.specials && c.special) st.units[st.units.length - 1].sp = "unused";   // v3.7
      }
    }
    if (rs.switches && rs.switches.fields) st.field = fieldFor(rs, matchSize(st)).id;   // v3.8: the format's own field
    Object.defineProperty(st, "events", { value: [], writable: true, enumerable: false, configurable: true });   // Brief 018 §10.8
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
    if (action.type === "move" && !fieldOf(st).CELLSET.has(action.to)) fail("That hex is not on the field.");
    if ((action.type === "swap" && !action.with) || ((action.type === "attack" || action.type === "special") && !action.target)) fail("That action needs a second unit.");
    if (["move", "swap", "attack", "pull", "brace", "done", "warmup", "special"].includes(action.type) && !action.uid) fail("That action needs a unit.");
    const actor = st.toMove;
    let out = {};
    const rec = st.events ? { st, extra: {}, n0: st.events.length, pre: snapUnits(st) } : null;
    if (rec) REC = rec;
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
      case "warmup": doWarmup(st, u); break;
      case "special": {
        const t = unitByUid(st, action.target);
        if (!t || t.hp <= 0) fail("No such target.");
        out = doSpecial(st, u, t); break;
      }
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
    if (rec) { REC = null; fillEvent(st, action, rec); }
    const done = Object.assign({}, action);
    if (out.die) done.die = out.die;
    st.actions.push(done);
    checkResult(st, actor);
    return out;
  }

  /** Brief 018 §10.8: fill in the entry for the action just applied (display only): the unit and its targets before
      and after, Stamina and Command spent, the flags, and what the action noted (parts, roll, Parry, set spear...). */
  const MAIN_KIND = { move: "move", swap: "move", attack: "attack", pull: "pull", brace: "brace", warmup: "special", special: "special", done: "done" };
  function fillEvent(st, action, rec) {
    const kind = MAIN_KIND[action.type];
    const ev = kind && st.events.slice(rec.n0).find((e) => e.kind === kind);
    if (!ev) return;
    const pre = rec.pre, post = snapUnits(st);
    const side = (uid) => {
      const u = unitByUid(st, uid), a = pre.units[uid], b = post.units[uid];
      return { uid, id: u.id, card: u.card, fk: !!u.fk, team: u.team, from: a.hex, to: b.hex, hpBefore: a.hp, hpAfter: b.hp, removed: a.hp > 0 && b.hp <= 0,
        braced: a.braced, sp: a.sp, spAfter: b.sp, holder: a.holder, holderAfter: b.holder, stamina: Math.max(0, a.stam - b.stam) };
    };
    Object.assign(ev, { action: action.type, command: pre.cmd - st.cmd, flag: { N: [pre.flag.N, post.flag.N], S: [pre.flag.S, post.flag.S] } }, rec.extra);
    if (action.uid) ev.unit = side(action.uid);
    const tg = [];
    if (action.type === "swap") tg.push(side(action.with));
    else if (action.type === "attack") tg.push(Object.assign(side(action.target), { dmg: rec.extra.dmg }));
    else if (action.type === "special" && rec.extra.hits) for (const h of rec.extra.hits) tg.push(Object.assign(side(h.uid), { dmg: h.dmg, mult: h.mult }));
    if (tg.length) ev.targets = tg;
    if (rec.extra.spear) ev.spear = rec.extra.spear.map((x) => Object.assign({}, x, { victim: side(x.uid), by: side(x.by) }));
  }

  /** Apply one action. Returns {ok, error?, die?}. The state is changed only when ok. */
  function act(st, action, roll) {
    const snapshot = clone(st), nEv = st.events ? st.events.length : 0;
    try {
      const out = apply(st, action, roll);
      return Object.assign({ ok: true }, out);
    } catch (e) {
      if (!e.illegal) console.error(e);
      REC = null;
      Object.keys(st).forEach((k) => delete st[k]);
      Object.assign(st, snapshot);
      if (st.events) st.events.length = nEv;   // Brief 018: the failed action leaves no entries
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
    const warm = u.sp === "warm";   // v3.7: warmed up this turn, so no attack, pull or brace (6.16)
    if (can(g.attackCost) && !warm) {
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
    if (can(g.attackCost) && !warm && canPullFrom(st, u, u.hex)) { const p = pullValue(st, u); const cs = dieCases(st).map(([d, pr]) => [applyDie(st, p.value, d), pr]); pull = { value: p.value, parts: p.parts, low: cs[0][0], high: cs[cs.length - 1][0], cases: cs }; }
    const swaps = [];
    for (const f of alive(st)) {
      if (f.team !== u.team || f === u || fieldOf(st).dist(f.hex, u.hex) !== 1 || evadeTarget(st, f)) continue;
      try { const c = swapCosts(st, u, f); if (u.stam + EPS >= c[0] && f.stam + EPS >= c[1] && st.cmd + EPS >= c[0] + c[1]) swaps.push(f.uid); } catch (e) { /* not allowed */ }
    }
    const out = { moves: reachMap(st, u), attacks, pull, brace: can(g.braceCost) && !warm, swaps };
    // v3.7 (Brief 011): the special, as attack and pull are: its state, whether it can be warmed up or fired, and the
    // exact preview for every legal target. Only for units that have one.
    const kind = specialOf(st, u);
    if (kind) {
      const fb = fireBlock(st, u);
      out.special = { kind, name: specialName(kind), state: specialState(st, u), warmup: !warmupBlock(st, u), warmupCost: g.warmupCost,
        fire: !fb, targets: fb ? [] : alive(st).filter((t) => specialCanTarget(st, u, t)).map((t) => specialPreview(st, u, t)) };
    }
    return out;
  }

  /** What parry would do if `u` attacked `t` now, for the board: null (no parry possible), {used: true} (v3.2: already
      parried this turn), or {amount, ifSurvives} (ifSurvives: v3.2, it fires only if `t` survives the hit). */
  function parryPreview(st, u, t) {
    if (!(t.braced && card(st, t).brace === "parry" && fieldOf(st).dist(u.hex, t.hex) === 1)) return null;
    if (sw(st, "parryFirstOnly") && t.parryUsed) return { used: true };
    return { amount: parryAmount(st, u), ifSurvives: sw(st, "parryNeedsSurvivor") };
  }
  /** v3.3 Evade preview (Brief 005: exact). Plays the evade that would follow an attack on `t`, if `t` survives, on a
      scratch copy: Stamina and Command after the attack, the cap, tackle and the direction rule all count. Returns null
      when no Evade applies, else { hexes, reason (why 0), unsure (the parry might remove the attacker first) }. */
  function evadePreview(st, u, t) {
    if (!sw(st, "evade") || !card(st, u).evade || fieldOf(st).dist(u.hex, t.hex) !== 1) return null;
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
    const free = fieldOf(st).NBRS[u.hex].filter((n) => !b.has(n) && (!ev || fieldOf(st).dist(n, ev.hex) > fieldOf(st).dist(u.hex, ev.hex)));
    if (!free.length) return ev ? `No free hex further from ${ev.id}` : "No free hex next to it";
    if (u.moved >= cap) return `Moved its full cap (${cap} hexes)`;
    if (st.cmd + EPS < c.hexCost) return `Needs ${fmt(c.hexCost)} Command for a step, ${fmt(st.cmd)} left`;
    if (u.stam + EPS < c.hexCost) return `Needs ${fmt(c.hexCost)} Stamina for a step, ${fmt(u.stam)} left`;
    const mode = ev && !u.evadeMoved ? null : u.zmode;
    if (mode === "shifted" || (mode === "entered" && sw(st, "zoneHardStop"))) return "Stopped in an enemy zone this turn";
    for (const n of free) {
      if (!tackleApplies(st, u, u.hex, n)) continue;
      const e = alive(st).find((x) => x.team !== u.team && card(st, x).trait === "tackle" && fieldOf(st).dist(x.hex, u.hex) === 1 && fieldOf(st).dist(x.hex, n) !== 1);
      const cost = c.hexCost + tackleCostFor(st, u), hexes = 1 + tackleHexes(st);
      return `Tackled by ${e ? e.id : "an enemy"}: breaking away needs ${fmt(cost)} Stamina` + (hexes > 1 ? ` and ${hexes} hexes of movement` : "") +
        `; has ${fmt(Math.min(u.stam, st.cmd))} Stamina${u.stam > st.cmd + EPS ? " (Command)" : ""}` + (hexes > 1 ? ` and ${cap - u.moved} hex${cap - u.moved === 1 ? "" : "es"}` : "");
    }
    return "No legal step";
  }
  /** Why each action is unavailable for a unit right now (null = available), for the board's greyed-out buttons. */
  function blockReasons(st, uid) {
    const u = unitByUid(st, uid), g = st.rs.game, out = { attack: null, reach: null, brace: null, move: null, done: null, special: "No special actions in this rule set yet" };
    const all = (r) => { for (const k of ["attack", "reach", "brace", "move", "done"]) out[k] = r; if (u && specialOf(st, u)) out.special = r; return out; };
    // v3.7: the special button's reason. Charged: why it can't fire (it may still be warmed up again: specialWarmAgain).
    // Otherwise: why it can't be warmed up. Read before the turn-ended check so a braced unit says "Braced this turn".
    if (u && u.hp > 0 && specialOf(st, u) && st.phase === "play" && u.team === st.toMove) {
      out.special = u.sp === "charged" ? fireBlock(st, u) : warmupBlock(st, u);
      if (u.sp === "used") out.special = "Used";
      if (u.braced) out.special = u.sp === "used" ? "Used" : "Braced this turn";
    }
    if (!u || u.hp <= 0) return all("That unit has been removed");
    if (st.phase !== "play") return all("The match is not in play");
    if (u.team !== st.toMove) return all("It is not that side's turn");
    if (u.done) { const sp = out.special; all(`${u.id} has ended its turn`); if (specialOf(st, u) && (sp === "Used" || sp === "Braced this turn" || sp === "Already attacked this turn")) out.special = sp; return out; }
    const ev = evadeTarget(st, u);
    const o = options(st, uid), c = card(st, u);
    const need = (k, cost) => (u.stam + EPS < cost ? `Needs ${fmt(cost)} Stamina, ${fmt(u.stam)} left` : st.cmd + EPS < cost ? `Needs ${fmt(cost)} Command, ${fmt(st.cmd)} left` : null);
    if (ev) { out.attack = out.reach = out.brace = `${u.id} attacked this turn and may only evade or end`; if (specialOf(st, u) && u.sp !== "used") out.special = out.attack; }
    else if (u.sp === "warm") { out.attack = out.reach = out.brace = "Warmed up this turn: fire it next turn"; }
    else {
      const reachShot = (a) => c.trait === "reach" && c.range === 1 && fieldOf(st).dist(u.hex, unitByUid(st, a.target).hex) === 2;
      // v3.6: when the only thing stopping a shot is a flag in the line, say so (Game Laws 4.9).
      const flagOnly = (reach) => sw(st, "flagBlocksLine") && alive(st).some((t) => t.team !== u.team && fieldOf(st).dist(u.hex, t.hex) >= 2 && fieldOf(st).flagBetween(u.hex, t.hex) &&
        (reach ? fieldOf(st).straight2(u.hex, t.hex) : c.range > 1 && fieldOf(st).dist(u.hex, t.hex) <= c.range) && !(isHolder(st, t) && !fieldOf(st).GOAL[t.team].has(u.hex)) && !(reach && alive(st).some((e) => e.team !== u.team && e.hex === fieldOf(st).middle(u.hex, t.hex))));
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
    if (!isMelee(st, u) || fieldOf(st).dist(u.hex, t.hex) !== 1) return null;
    if (sw(st, "holderHoldsHex") && isHolder(st, u)) return null;
    const enemies = alive(st).filter((e) => e.team === t.team && e !== t && fieldOf(st).dist(e.hex, t.hex) === 1);
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
      dodge: c.dodge && sw(st, "dodgeRoom") && u.hex ? dodgeRoom(st, u).pct : null, special: specialState(st, u), warming: u.sp === "warm" };
  }

  function zones(st) {
    const out = { N: new Set(), S: new Set() };
    for (const u of alive(st)) if (projects(st, u)) for (const n of fieldOf(st).NBRS[u.hex]) out[u.team].add(n);
    return out;
  }

  /* The legacy field's geometry stays exported under its old names (COLS, FLAG, CELLS, dist...) for old tests and old
     saved matches. Code that works on a match reads the match's field instead: fieldOf(st). */
  const { COLS, NCOL, NROW, FLAG, CELLS, CELLSET, NBRS, GOAL, parse, geo, dist, flagBetween, arcOf, hexBehind, lineBetween } = LEGACY;
  const api = { COLS, NCOL, NROW, FLAG, CELLS, CELLSET, NBRS, GOAL, parse, geo, dist, deployZone, FIELDS, fieldOf, fieldFor, deployRadiusFor, matchSize, foeOf, clone, card, alive, unitByUid,
    newMatch, act, apply, route, canAttackAfter, rangeHexes, evadeHexes, killConsequences, enemyPreview, specialOf, specialName, specialCanTarget, specialHits, specialPreview, specialState, warmupBlock, fireBlock, arcOf, hexBehind, lineBetween, SPECIAL_NAMES, cloneLite, poolSplit, hpShown, flagShown, seededRandom, makeSeed, options, canAttackFrom, capturePreview, pullValue, canPullFrom, flagBetween, dieCases, diceMultiplier, normalDie, rollWith, parryAmount, parryPreview, evadePreview, whyNoMove, blockReasons, tackleCostFor, tiebreak, turnLimit, turnLimitFor, capOfLineup, dodgeRoom, half, holderOf, isHolder, effHp, flagLeft, homeOf, zoneFor, status, zones, reachMap, STAMINA_EFFECTS, baseStamina, braceTiredness, staminaFloor, staminaMods, addStaminaMod, staminaWith, nextStamina, breakdown, applyDie, beingsLost, capOf, fmt, d6 };
  if (typeof module !== "undefined") module.exports = api; else root.GGEngine = api;
})(this);
