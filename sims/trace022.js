// Brief 022, "first, find out why": traces of balanced 5v5 Brain 5 mirrors on the newest rule set.
// node sims/trace022.js [games to search, default 120] [lr|warm|both]
// lr:   games where the first mover's Light Ranged is the first Light Ranged removed. For the archer's last turn before it
//       died, it compares the position Brain 5 chose with the best position the archer could have taken out of every
//       enemy's reach (staying or one move), term by term of Brain 5's value model (bot.js value5).
// warm: a unit that ended its turn inside a warmed-up enemy special's reach, unbraced, and was hit by that special next
//       turn. Same comparison against its best way out (a move out of reach, or a brace where it stood).
// The alternative is scored at the moment the unit acted, with its friends' later actions not yet played; the chosen
// position is scored at the same moment, so the comparison is like for like. Seeds from tests/rng.js.
"use strict";
const path = require("path"), B = path.join(__dirname, "..", "board");
const E = require(B + "/engine.js"), Bot = require(B + "/bot.js"), W = require(B + "/watch.js"), rng = require(B + "/tests/rng.js");
const { DEFAULT_BRAINS } = require(B + "/brain.js"), { PRESETS } = require(B + "/data.js");
const RULES = PRESETS[PRESETS.length - 1].id, B5 = DEFAULT_BRAINS.brain5;
const N = +(process.argv[2] || 120), MODE = process.argv[3] || "both", FORMAT = process.argv[4] || "blitz5", FROM = +(process.argv[5] || 0);

/** Brain 5's value (value5) split into its terms, from `team`'s side. Their sum is value5 (checked below). */
function terms(st, team, Bx) {
  const M = Bx.model, foe = E.foeOf(team), G = E.fieldOf(st), t = { material: 0, stamina: 0, special: 0, advance: 0, home: 0, flag: 0, risk: 0, pressure: 0, flagDanger: 0 };
  if (st.result) return Object.assign(t, { material: st.result.winner === team ? 1e5 : st.result.winner ? -1e5 : 0 });
  for (const u of E.alive(st)) {
    const val = M.unit + M.hp * u.hp; t.material += u.team === team ? val : -val;
    if (u.team !== team) continue;
    t.stamina += M.stamina * E.status(st, u).stamNext;
    if (u.sp === "warm" && M.special) t.special += M.special * M.hp * Bot.warmEdge(st, u, M);
    const k = Bot.keeperOf(st, team);
    if (!(k && k.uid === u.uid)) t.advance -= M.advance * G.dist(u.hex, G.FLAG[foe]);
    else if (st.rs.switches.flagHolder) t.home -= M.home * G.dist(u.hex, G.FLAG[team]);
  }
  t.flag = M.pull * (st.pole[foe] - st.pole[team]);
  t.risk = -M.risk * Bot.risk5(st, team, Bx, true);
  t.pressure = M.pressure * Bot.risk5(st, foe, Bx);
  t.flagDanger = -M.flagDanger * Math.min(1, Bot.flagRisk(st, team, Object.assign({}, Bx, { weights: Object.assign({}, Bx.weights, { flagRisk: 1 }) })));
  return t;
}
const sum = (t) => Object.values(t).reduce((a, b) => a + b, 0);
const act = (st, a) => { const s = E.cloneLite(st); try { E.apply(s, a, () => E.normalDie(s)); return s; } catch (e) { return null; } };
const reachSp = (st, w) => { const k = E.specialOf(st, w), n = (st.rs.specials && st.rs.specials[k]) || {}, c = E.card(st, w); if (k === "javelin") return n.maxRange || 3; if (k === "arcHit" || k === "pickOff" || k === "skewer") return 1; return c.range > 1 ? c.range : 1; };
const inReach = (st, u) => E.alive(st).some((e) => e.team !== u.team && Bot.canThreaten(st, e, u.hex));
const inWarm = (st, u) => !E.isHolder(st, u) && E.alive(st).some((w) => w.team !== u.team && w.sp === "warm" && Bot.canThreaten(st, w, u.hex, reachSp(st, w)));
/** The unit's own expected first-strike damage next turn: the best single expected hit any enemy that can reach it could
    land (a warmed special counted as the engine deals it), and whether a friend could answer that striker next turn. */
function firstStrike(st, u) {
  let best = 0, by = null;
  for (const e of E.alive(st)) if (e.team !== u.team && Bot.canThreaten(st, e, u.hex)) { const d = hitOf(st, e, u); if (d > best) { best = d; by = e; } }
  const answered = by ? E.alive(st).some((f) => f.team === u.team && f.uid !== u.uid && Bot.canThreaten(st, f, by.hex)) : false;
  return { d: best, by: by && by.uid, answered };
}
function hitOf(st, e, u) { const c = E.card(st, e); if (c.reload && e.attackedThis) return 0; const from = c.range > 1 ? e.hex : E.fieldOf(st).NBRS[u.hex][0]; const b = E.breakdown(st, e, u, from); return E.dieCases(st).reduce((s, [d, p]) => s + p * E.applyDie(st, b.value, d, b.dodge), 0); }

/** Compare the chosen position (`after`) with the best alternative for unit `uid` from `before` that passes `safe`. */
function compare(before, after, uid, safe, withBrace) {
  const team = before.toMove, alts = [{ how: "stay", s: before }];
  for (const h in E.options(before, uid).moves) { const s = act(before, { type: "move", uid, to: h }); if (s) alts.push({ how: "move " + h, s }); }
  if (withBrace) for (const a of alts.slice()) { const u = E.unitByUid(a.s, uid); if (u && E.options(a.s, uid).brace) { const s = act(a.s, { type: "brace", uid }); if (s) alts.push({ how: a.how + " + brace", s }); } }
  let best = null;
  for (const a of alts) { if (!safe(a.s, E.unitByUid(a.s, uid))) continue; const v = Bot.value5(a.s, team, B5); if (!best || v > best.v) best = Object.assign(a, { v }); }
  const tc = terms(after, team, B5), vc = Bot.value5(after, team, B5);
  if (Math.abs(sum(tc) - vc) > 1e-6) throw new Error("terms do not add up to value5");
  if (!best) return { none: true, vc, tc };
  const ta = terms(best.s, team, B5), d = {};
  for (const k in tc) d[k] = +(tc[k] - ta[k]).toFixed(2);
  return { vc, va: best.v, alt: best.how, d, tc, ta };
}

const lrRows = [], warmRows = [];
let lrFirst = { first: 0, second: 0 };
for (let i = FROM; i < FROM + N && (lrRows.length < 10 || warmRows.length < 10); i++) {
  const seed = W.seedFrom(rng("trace022:" + FORMAT, i)), first = i % 2 ? "S" : "N";
  const spec = { seed, rules: RULES, format: FORMAT, n: "brain5", s: "brain5", mixN: "mixed", mixS: "mixed", first };
  // per side-turn: the position before each unit's first action, and after its last action
  let key = "", turnStart = null, beforeUnit = new Map(), afterUnit = new Map(), hpBefore = null, lrDead = false;
  const history = [];   // one per finished side-turn: { team, turn, start, beforeUnit, afterUnit, end }
  let pendingWarm = null;   // units that ended inside a warmed special's reach unbraced: { side, units: Map(uid -> record) }
  let firstLR = null;
  W.playOut(spec, {
    before(st, c) {
      const k = st.turn + st.toMove;
      if (k !== key) { key = k; turnStart = E.cloneLite(st); beforeUnit = new Map(); afterUnit = new Map(); }
      const a = c.action;
      if (a.uid && !beforeUnit.has(a.uid) && a.type !== "end") beforeUnit.set(a.uid, E.cloneLite(st));
      hpBefore = new Map(st.units.map((u) => [u.uid, u.hp]));
      if (a.type === "end") {
        const end = E.cloneLite(st);
        history.push({ team: st.toMove, turn: st.turn, start: turnStart, beforeUnit, afterUnit, end });
        // warm: units of the mover ending inside a warmed enemy special's reach, unbraced
        if (MODE !== "lr" && warmRows.length < 10) {
          const ex = E.alive(st).filter((u) => u.team === st.toMove && inWarm(st, u) && !u.braced);
          pendingWarm = ex.length ? { side: E.foeOf(st.toMove), turnKey: null, units: new Set(ex.map((u) => u.uid)), h: history[history.length - 1] } : null;
        }
      }
      if (pendingWarm && st.toMove === pendingWarm.side) {
        if (pendingWarm.turnKey === null) pendingWarm.turnKey = k;
        if (pendingWarm.turnKey !== k) pendingWarm = null;
        else if (a.type === "special") {
          const w = E.unitByUid(st, a.uid), t = E.unitByUid(st, a.target);
          if (w && t && E.specialCanTarget(st, w, t)) for (const h of E.specialHits(st, w, t)) if (pendingWarm.units.has(h.uid) && warmRows.length < 10) {
            const hs = pendingWarm.h, uid = h.uid, b0 = hs.beforeUnit.get(uid) || hs.start, a0 = hs.afterUnit.get(uid) || hs.start;
            const cmp = compare(b0, a0, uid, (s, u) => u && (!inWarm(s, u) || (u.braced && E.effHp(s, u) > 0)), true);
            const u0 = E.unitByUid(a0, uid);
            warmRows.push({ seed, first, turn: hs.turn, side: hs.team, unit: uid, card: u0.card, hex: u0.hex, special: E.specialName(E.specialOf(st, w)), by: a.uid, dmg: +h.dmg.toFixed(2), hp: +u0.hp.toFixed(2),
              acted: hs.beforeUnit.has(uid), cmp });
            pendingWarm.units.delete(uid);
          }
        }
      }
    },
    after(st, c, r) {
      const a = c.action;
      if (a.uid && r.ok && a.type !== "end") afterUnit.set(a.uid, E.cloneLite(st));
      if (!hpBefore || firstLR) return;
      for (const u of st.units) if (hpBefore.get(u.uid) > 0 && u.hp <= 0 && u.card === "LR") {
        firstLR = { uid: u.uid, team: u.team, turn: st.turn, by: a.uid, how: a.type }; lrFirst[u.team === st.first ? "first" : "second"]++;
        if (u.team === st.first && MODE !== "warm" && lrRows.length < 10) {
          // its own last side-turn before it died
          const hs = [...history].reverse().find((x) => x.team === u.team);
          if (!hs) break;
          const b0 = hs.beforeUnit.get(u.uid) || hs.start, a0 = hs.afterUnit.get(u.uid) || hs.start;
          const ua = E.unitByUid(a0, u.uid), fs = firstStrike(a0, ua);
          const cmp = compare(b0, a0, u.uid, (s, x) => x && !inReach(s, x), false);
          const killer = E.unitByUid(st, a.uid);
          lrRows.push({ seed, first, diedTurn: st.turn, lastTurn: hs.turn, hex: ua.hex, acted: hs.beforeUnit.has(u.uid), struck: !!ua.attackedThis, exposed: inReach(a0, ua), fs, killer: killer ? killer.card : a.uid, how: a.type, cmp });
        }
        break;
      }
    }
  });
}

const top = (d) => Object.entries(d || {}).filter(([, v]) => Math.abs(v) >= 0.05).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 4).map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`).join(", ");
if (MODE !== "warm") {
  console.log(`\nLight Ranged traces (first mover's archer removed first), ${RULES}, ${FORMAT}, Brain 5 mirrors: ${lrRows.length} (games read ${N}; first Light Ranged lost: first mover ${lrFirst.first}, second mover ${lrFirst.second})`);
  console.log("seed | first | archer's last turn -> died | hex | struck that turn | in enemy reach | first-strike exp. dmg / answered | killed by | chosen − best safe (value) | safe option | terms that favoured the chosen hex (chosen − safe)");
  for (const r of lrRows) console.log([r.seed, r.first, `${r.lastTurn} -> ${r.diedTurn}`, r.hex, r.struck ? "yes" : "no", r.exposed ? "yes" : "no", `${r.fs.d.toFixed(1)} / ${r.fs.answered ? "yes" : "no"}`, `${r.killer} ${r.how}`,
    r.cmp.none ? "no safe option" : (r.cmp.vc - r.cmp.va).toFixed(2), r.cmp.alt || "-", top(r.cmp.d)].join(" | "));
}
if (MODE !== "lr") {
  console.log(`\nWarmed-special traces (stayed in reach unbraced, hit next turn), ${RULES}, ${FORMAT}, Brain 5 mirrors: ${warmRows.length}`);
  console.log("seed | turn | unit | hex | HP | special by | damage taken | acted | chosen − best way out (value) | way out | terms that favoured staying (chosen − way out)");
  for (const r of warmRows) console.log([r.seed, r.turn, `${r.unit} (${r.card})`, r.hex, r.hp, `${r.special} by ${r.by}`, r.dmg, r.acted ? "yes" : "no", r.cmp.none ? "no way out" : (r.cmp.vc - r.cmp.va).toFixed(2), r.cmp.alt || "-", top(r.cmp.d)].join(" | "));
}
