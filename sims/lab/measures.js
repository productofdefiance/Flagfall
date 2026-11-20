// The lab's measures (Brief 008). A measure is a name and a set of per-game columns; a job order lists the names it
// wants. A new measure is a new entry here, never a new workflow. Every measure reads the game as it is played (the
// hooks of watch.js playOut) and returns its columns at the end. Columns are numbers or short strings; totals are made
// by summing number columns per matchup (merge.js), so prefer counts over rates here.
//
// Each measure: { about: "plain words", columns: [...], make(ctx) -> { before?(st, choice, ms), after?(st, choice, r), end(st) -> {col: value} } }
// ctx: { E, Bot, aTeam (the side brain A plays, "N"/"S"), brains: { N, S } }
"use strict";

const isLight = (E, st, u) => /^light/.test(E.card(st, u).icon || "");

const MEASURES = {
  outcome: {
    about: "How the game ended, in the baseline table's terms, and how it went for brain A.",
    columns: ["end", "turn_limit", "decisive", "pulls", "a_result", "first_won"],
    make(ctx) {
      const { E } = ctx; let pulls = 0, lastPull = false;
      return {
        after(st, c, r) { if (r.ok && c.action.type === "pull") { pulls++; lastPull = true; } else if (r.ok && c.action.type !== "end") lastPull = false; },
        end(st) {
          const res = st.result, w = res && res.winner, how = res ? res.how : "unfinished";
          const end = !res ? "unfinished" : !w ? "draw" : how === "KO" ? (lastPull ? "pull_ko" : "holder_ko") : how === "TKO" ? "tko" : /turn limit/.test(how) ? "tiebreak_win" : "other";
          const tl = res && /turn limit/.test(how) ? 1 : 0;
          return { end, turn_limit: tl, decisive: w && !tl ? 1 : 0, pulls,
            a_result: !res ? "unfinished" : !w ? "draw" : (w === ctx.aTeam ? "win" : "loss") + (tl ? "_tiebreak" : ""),
            first_won: w && !tl ? (w === st.first ? 1 : 0) : "" };
        }
      };
    }
  },

  timing: {
    about: "How long the computer thought: total and worst time per side-turn, in milliseconds on the machine that ran it. Brief 019: and its work, as positions scored (Brain 5 family: every whole-turn plan step it examines is a scored position), total and worst side-turn; machine-independent (F24).",
    columns: ["bot_turns", "bot_ms", "bot_ms_max_turn", "bot_positions", "bot_positions_max_turn"],
    make(ctx) {
      const S = ctx && ctx.Bot && ctx.Bot.stats5;
      let key = "", cur = 0, turns = 0, total = 0, max = 0, last = S ? S.values : 0, pos = 0, curPos = 0, maxPos = 0;
      return {
        before(st, c, ms) {
          const k = st.turn + st.toMove;
          if (k !== key) { if (key) { turns++; max = Math.max(max, cur); maxPos = Math.max(maxPos, curPos); } key = k; cur = 0; curPos = 0; }
          cur += ms; total += ms;
          if (S) { const d = S.values - last; last = S.values; curPos += d; pos += d; }
        },
        end() { if (key) { turns++; max = Math.max(max, cur); maxPos = Math.max(maxPos, curPos); } return { bot_turns: turns, bot_ms: total, bot_ms_max_turn: max, bot_positions: pos, bot_positions_max_turn: maxPos }; }
      };
    }
  },

  evade: {
    about: "Evade chances after adjacent attacks by Light units: taken, safer hex available and taken, and why there was no legal step (engine whyNoMove).",
    columns: ["evade_chances", "evade_taken", "evade_safer_chances", "evade_safer_taken", "evade_no_step", "no_step_cap", "no_step_command", "no_step_stamina", "no_step_zone", "no_step_tackle", "no_step_blocked", "no_step_other"],
    make(ctx) {
      const { E, Bot } = ctx, o = Object.fromEntries(MEASURES.evade.columns.map((k) => [k, 0])), chance = new Set();
      return {
        before(st, c) {
          const a = c.action, u = a.uid && E.unitByUid(st, a.uid);
          if (a.type === "move" && u && u.evadeFrom && chance.has(u.uid)) { o.evade_taken++; chance.delete(u.uid); if (chance.delete(u.uid + "#safer")) o.evade_safer_taken++; }
        },
        after(st, c, r) {
          const a = c.action;
          if (a.type === "end") { chance.clear(); return; }
          if (!r.ok || a.type !== "attack") return;
          const u = E.unitByUid(st, a.uid);
          if (!u || u.hp <= 0 || !u.evadeFrom) return;
          const mv = Object.keys(E.options(st, u.uid).moves);
          if (mv.length) {
            o.evade_chances++; chance.add(u.uid);
            const B0 = ctx.brains[u.team], t0 = Bot.threat(st, u.team, B0, true);
            if (mv.some((h) => { const s1 = E.cloneLite(st); try { E.apply(s1, { type: "move", uid: u.uid, to: h }); } catch (e) { return false; } return Bot.threat(s1, u.team, B0, true) < t0 - 1e-9; })) { o.evade_safer_chances++; chance.add(u.uid + "#safer"); }
          } else {
            o.evade_no_step++;
            const why = E.whyNoMove(st, u) || "";
            const k = /^No free hex/.test(why) ? "blocked" : /full cap/.test(why) ? "cap" : /Command/.test(why) ? "command" : /Stamina for a step/.test(why) ? "stamina" : /zone/.test(why) ? "zone" : /Tackled/.test(why) ? "tackle" : "other";
            o["no_step_" + k]++;
          }
        },
        end() { return o; }
      };
    }
  },

  light: {
    about: "Light units: removed, attacked, and their Dodge when attacked (sum of percentages; divide by light_attacked).",
    columns: ["light_start", "light_removed", "light_attacked", "light_dodge_sum"],
    make(ctx) {
      const { E } = ctx; let attacked = 0, dodge = 0;
      return {
        before(st, c) {
          if (c.action.type !== "attack") return;
          const t = E.unitByUid(st, c.action.target);
          if (t && isLight(E, st, t)) { attacked++; dodge += E.card(st, t).dodge && st.rs.switches.dodgeRoom ? E.dodgeRoom(st, t).pct : 0; }
        },
        end(st) { const L = st.units.filter((u) => isLight(E, st, u)); return { light_start: L.length, light_removed: L.filter((u) => u.hp <= 0).length, light_attacked: attacked, light_dodge_sum: dodge }; }
      };
    }
  },

  clock: {
    about: "The last 3 turns: side-turns that start behind on the tiebreak, and of those, turns with an attack on the enemy holder or a pull; who led at turn limit - 3 and how that ended; what the side behind still had besides its holder.",
    columns: ["late_behind_turns", "late_behind_press", "late_ahead_turns", "late_ahead_press", "lead_at_3", "lead_at_3_end", "trail_attackers_at_3"],
    make(ctx) {
      const { E } = ctx; let key = "", cur = null, lead3, trail = "";
      const o = { late_behind_turns: 0, late_behind_press: 0, late_ahead_turns: 0, late_ahead_press: 0 };
      const close = () => { if (!cur) return; const k = cur.pos === "behind" ? "late_behind" : cur.pos === "ahead" ? "late_ahead" : null; if (k) { o[k + "_turns"]++; if (cur.press) o[k + "_press"]++; } cur = null; };
      return {
        before(st, c) {
          const lim = E.turnLimit(st), k = st.turn + st.toMove;
          if (k !== key) {
            key = k; close();
            if (st.turn >= lim - 2) { const l = E.tiebreak(st).winner; cur = { pos: l === st.toMove ? "ahead" : l ? "behind" : "level", press: false }; }
            if (lead3 === undefined && st.turn >= lim - 3) { lead3 = E.tiebreak(st).winner || ""; if (lead3) trail = E.alive(st).filter((x) => x.team === E.foeOf(lead3) && !E.isHolder(st, x)).length; }
          }
          if (cur && (c.action.type === "pull" || (c.action.type === "attack" && E.isHolder(st, E.unitByUid(st, c.action.target))))) cur.press = true;
        },
        end(st) {
          close();
          const w = st.result && st.result.winner, tl = st.result && /turn limit/.test(st.result.how);
          const l3 = lead3 === undefined ? "ended_earlier" : lead3 === "" ? "level" : lead3 === "N" ? "N" : "S";
          const e3 = lead3 ? (!w ? "draw" : w !== lead3 ? "lost" : tl ? "won_tiebreak" : "won_decisive") : "";
          return Object.assign(o, { lead_at_3: l3, lead_at_3_end: e3, trail_attackers_at_3: trail });
        }
      };
    }
  },

  flagrules: {
    about: "Brief 015: set spear hits; Ranged pulls; and (attacker, target) pairs at each side-turn start that a flag straight between makes illegal under flagBlocksLine (counted on every rule set, so v3.5 shows how many it would block).",
    columns: ["spear_hits", "ranged_pulls", "flag_line_pairs"],
    make(ctx) {
      const { E } = ctx, o = { spear_hits: 0, ranged_pulls: 0, flag_line_pairs: 0 };
      let seen = 0, key = "", pull = false;
      const open = (st) => Object.assign({}, st, { rs: Object.assign({}, st.rs, { switches: Object.assign({}, st.rs.switches, { flagBlocksLine: false }) }) });
      return {
        before(st, c) {
          const k = st.turn + st.toMove;
          if (k !== key) {
            key = k;
            const s2 = open(st);
            for (const u of E.alive(st)) if (u.team === st.toMove) for (const t of E.alive(st)) {
              if (t.team !== u.team && E.fieldOf(st).dist(u.hex, t.hex) >= 2 && E.fieldOf(st).flagBetween(u.hex, t.hex) && E.canAttackFrom(s2, u, u.hex, t)) o.flag_line_pairs++;
            }
          }
          const u = c.action.uid && E.unitByUid(st, c.action.uid);
          pull = c.action.type === "pull" && !!u && E.card(st, u).range > 1;
        },
        after(st, c, r) {
          if (pull && r.ok && !c.refusedEnd) o.ranged_pulls++;
          pull = false;
          for (; seen < st.log.length; seen++) { const t = st.log[seen].text || ""; const m = t.match(/braced \S+ at \S+ deals/g); if (m) o.spear_hits += m.length; }
        },
        end() { return o; }
      };
    }
  },

  specials: {
    about: "Brief 011 (v3.7): per special, times warmed up, fired, lapsed, warmed units removed before firing, kills, damage dealt and the average normal hit it replaced (engine preview, from the same hex); special hits on braced targets; and actions that left both sides with a win condition (F20).",
    columns: (() => {
      const c = ["sp_warm", "sp_fired", "sp_lapsed", "sp_removed", "sp_braced_hits", "sp_braced_dmg", "both_win_actions"];
      for (const k of ["arcHit", "pickOff", "bullseye", "arrowStorm", "skewer", "javelin"]) for (const x of ["warm", "fired", "lapsed", "removed", "kills", "hits", "dmg", "normal"]) c.push(`sp_${k}_${x}`);
      return c;
    })(),
    make(ctx) {
      const { E } = ctx, o = Object.fromEntries(MEASURES.specials.columns.map((k) => [k, 0]));
      const warm = new Map();   // uid -> kind, while warmed up and not yet fired, lapsed or removed
      let pend = null;
      const winBoth = (st) => {
        const w = {};
        for (const team of ["N", "S"]) {
          const foe = E.foeOf(team);
          if (st.pole[foe] >= st.rs.game.poleHP - 1e-9) w[team] = 1;
          else if (!st.units.some((u) => u.team === foe && u.hp > 0 && (st.rs.switches.tkoNeedsKeeper || !u.fk))) w[team] = 1;
        }
        return w.N && w.S;
      };
      return {
        before(st, c) {
          const a = c.action, u = a.uid && E.unitByUid(st, a.uid);
          pend = null;
          if (a.type === "end") {
            for (const x of E.alive(st)) if (x.team === st.toMove && x.sp === "charged" && warm.has(x.uid)) { const k = warm.get(x.uid); o.sp_lapsed++; o[`sp_${k}_lapsed`]++; warm.delete(x.uid); }
            return;
          }
          if (!u) return;
          const kind = E.specialOf(st, u);
          if (a.type === "warmup" && kind) pend = { type: "warmup", uid: u.uid, kind, again: warm.has(u.uid) };
          if (a.type === "special" && kind) {
            const t = E.unitByUid(st, a.target);
            if (!t || !E.specialCanTarget(st, u, t)) return;
            const hits = E.specialHits(st, u, t), b = E.breakdown(st, u, t, u.hex);
            const normal = E.dieCases(st).reduce((s2, [d, p]) => s2 + p * E.applyDie(st, b.value, d, b.dodge), 0);
            pend = { type: "special", uid: u.uid, kind, hits: hits.map((h) => ({ uid: h.uid, dmg: h.dmg, braced: !!E.unitByUid(st, h.uid).braced })), normal };
          }
        },
        after(st, c, r) {
          if (!r.ok || c.refusedEnd) { pend = null; return; }
          if (winBoth(st)) o.both_win_actions++;
          if (pend && pend.type === "warmup") {
            if (pend.again) { /* a re-warm on the firing turn: the earlier warm-up neither fired nor lapsed */ o.sp_lapsed++; o[`sp_${pend.kind}_lapsed`]++; }
            o.sp_warm++; o[`sp_${pend.kind}_warm`]++; warm.set(pend.uid, pend.kind);
          }
          if (pend && pend.type === "special") {
            const k = pend.kind;
            o.sp_fired++; o[`sp_${k}_fired`]++; o[`sp_${k}_normal`] += pend.normal; warm.delete(pend.uid);
            for (const h of pend.hits) {
              o[`sp_${k}_hits`]++; o[`sp_${k}_dmg`] += h.dmg;
              if (E.unitByUid(st, h.uid).hp <= 0) o[`sp_${k}_kills`]++;
              if (h.braced) { o.sp_braced_hits++; o.sp_braced_dmg += h.dmg; }
            }
          }
          pend = null;
          for (const [uid, k] of [...warm]) { const x = E.unitByUid(st, uid); if (!x || x.hp <= 0) { o.sp_removed++; o[`sp_${k}_removed`]++; warm.delete(uid); } }
        },
        end() { for (const k in o) if (/_(dmg|normal)$/.test(k)) o[k] = Math.round(o[k] * 100) / 100; return o; }
      };
    }
  },

  specialsafety: {
    about: "Brief 011 follow-up: how the other side reacts to a warmed-up special. At the start of each side-turn that faces at least one enemy special warmed up the turn before, counts that side's units inside its reach for next turn (the warmed unit's movement next turn plus the special's reach; flag holders are immune and left out), then at the end of that side-turn counts how many left, stayed (braced or not), came in, and how many inside reach braced. Then, on the warmed side's next turn, counts how many of the units that ended inside reach were hit by one of those warmed specials (each unit once).",
    columns: ["sw_threat_turns", "sw_units_start", "sw_exposed_start", "sw_left", "sw_stayed", "sw_entered", "sw_exposed_end", "sw_braced_in_reach", "sw_removed_in_reach",
      "sw_stayed_braced", "sw_stayed_unbraced", "sw_hit_next", "sw_hit_next_braced"],
    make(ctx) {
      const { E, Bot } = ctx, o = Object.fromEntries(MEASURES.specialsafety.columns.map((k) => [k, 0]));
      let key = "", start = null, watch = null, pend = null;   // watch: units that ended inside reach, waiting for the warmed side's next turn
      const reachOf = (st, w) => {
        const k = E.specialOf(st, w), n = (st.rs.specials && st.rs.specials[k]) || {}, c = E.card(st, w);
        if (k === "javelin") return n.maxRange || 3;
        if (k === "arcHit" || k === "pickOff" || k === "skewer") return 1;
        return c.range > 1 ? c.range : 1;
      };
      const warmers = (st, team) => E.alive(st).filter((w) => w.team !== team && w.sp === "warm").map((w) => w.uid);
      /** uids of `team`'s units (not holders) inside the reach of any warmed-up enemy special. */
      const exposed = (st, team) => {
        const warm = E.alive(st).filter((w) => w.team !== team && w.sp === "warm");
        if (!warm.length) return null;
        const out = new Set();
        for (const u of E.alive(st)) if (u.team === team && !E.isHolder(st, u) && warm.some((w) => Bot.canThreaten(st, w, u.hex, reachOf(st, w)))) out.add(u.uid);
        return out;
      };
      const close = (st) => {
        if (!start) return;
        const now = exposed(st, start.team) || new Set();
        for (const uid of start.set) {
          const u = E.unitByUid(st, uid); if (!u || u.hp <= 0) { o.sw_removed_in_reach++; continue; }
          if (now.has(uid)) { o.sw_stayed++; if (u.braced) o.sw_stayed_braced++; else o.sw_stayed_unbraced++; } else o.sw_left++;
        }
        for (const uid of now) { if (!start.set.has(uid)) o.sw_entered++; if (E.unitByUid(st, uid).braced) o.sw_braced_in_reach++; }
        o.sw_exposed_end += now.size;
        watch = now.size ? { warmers: new Set(warmers(st, start.team)), units: new Map([...now].map((uid) => [uid, !!E.unitByUid(st, uid).braced])), hit: new Set(), side: E.foeOf(start.team), turn: null } : null;
        start = null;
      };
      return {
        before(st, c) {
          const k = st.turn + st.toMove;
          if (k !== key) {
            key = k;
            if (watch) { if (watch.turn === null && st.toMove === watch.side) watch.turn = k; else if (watch.turn !== null) watch = null; }   // the warmed side's next turn only
            const set = exposed(st, st.toMove);
            if (set) { o.sw_threat_turns++; o.sw_units_start += E.alive(st).filter((u) => u.team === st.toMove && !E.isHolder(st, u)).length; o.sw_exposed_start += set.size; start = { team: st.toMove, set }; }
          }
          if (c.action.type === "end") close(st);
          pend = null;
          if (watch && watch.turn === k && c.action.type === "special" && watch.warmers.has(c.action.uid)) {
            const u = E.unitByUid(st, c.action.uid), t = E.unitByUid(st, c.action.target);
            if (u && t && E.specialCanTarget(st, u, t)) pend = E.specialHits(st, u, t).map((h) => h.uid);
          }
        },
        after(st, c, r) {
          if (pend && r.ok && !c.refusedEnd) for (const uid of pend) if (watch.units.has(uid) && !watch.hit.has(uid)) { watch.hit.add(uid); o.sw_hit_next++; if (watch.units.get(uid)) o.sw_hit_next_braced++; }
          pend = null;
        },
        end(st) { close(st); return o; }
      };
    }
  },

  play: {
    about: "How each side played: braces, braces where no enemy could reach that unit next turn, attacks, attacks on a holder, moves, safety stops, actions the engine refused, and turns a brain ended because it hit an error.",
    columns: ["braces", "braces_no_threat", "attacks", "holder_attacks", "moves", "safety_stops", "refused", "bot_errors"],
    make(ctx) {
      const { E, Bot } = ctx, o = { braces: 0, braces_no_threat: 0, attacks: 0, holder_attacks: 0, moves: 0, safety_stops: 0, refused: 0, bot_errors: 0 };
      return {
        before(st, c) {
          const a = c.action;
          if (/Safety stop/.test(c.reason || "")) o.safety_stops++;
          if (/Hit an error/.test(c.reason || "")) o.bot_errors++;
          if (a.type === "brace") { o.braces++; const u = E.unitByUid(st, a.uid); if (u && !E.alive(st).some((e) => e.team !== u.team && Bot.canThreaten(st, e, u.hex))) o.braces_no_threat++; }
          if (a.type === "attack") { o.attacks++; if (E.isHolder(st, E.unitByUid(st, a.target))) o.holder_attacks++; }
          if (a.type === "move") o.moves++;
        },
        after(st, c, r) { if (!r.ok && !c.refusedEnd) o.refused++; },
        end() { return o; }
      };
    }
  }
};
// Brief 016: when the fighting started and stopped, how quiet the ending was, what each side had left. Read only.
const STALL_COLS = ["first_contact_turn", "first_attack_turn", "last_damage_turn", "quiet_end", "longest_quiet", "quiet_side_turns", "braces_last5",
  "units_n_l3", "units_s_l3", "uc_n_l3", "uc_s_l3", "holder_n_l3", "holder_s_l3", "flag_n_l3", "flag_s_l3", "gap_l3",
  "units_n_end", "units_s_end", "gap_end", "limit_decided_by", "limit_flag_margin", "damage_quiet_end"];
MEASURES.stall = {
  about: "Stalls (Brief 016): first contact, first attack or pull, last damage (turns); side-turns with no attack or pull at the end, longest run and in all after the first attack; braces in the last 5 turns; each side's units (holder left out), unit cap (UC, holder in), held flag and flag health at turn limit − 3 and at the end; the closest two opposing non-holder units; what decided a turn-limit game and by how much flag damage; and side-turns at the end after the last damage (damage_quiet_end, added for the summary's 5-side-turn line).",
  columns: STALL_COLS,
  make(ctx) {
    const { E } = ctx;
    let firstContact = "", firstAttack = "", lastDamage = "", lastDamageSide = -1, turn0 = 0, totals = null, l3 = null;
    const sides = [];   // one per side-turn, in order: { key, turn, attack }
    const braces = [];   // turn of every brace
    const total = (st) => st.units.reduce((a, u) => a + Math.max(u.hp, 0), 0) - st.pole.N - st.pole.S;   // falls when anything takes damage
    const adjacent = (st) => E.alive(st).some((u) => E.alive(st).some((e) => e.team !== u.team && E.fieldOf(st).dist(u.hex, e.hex) === 1));
    const others = (st, t) => E.alive(st).filter((u) => u.team === t && !E.isHolder(st, u));
    const gap = (st) => { const a = others(st, "N"), b = others(st, "S"); if (!a.length || !b.length) return ""; let g = Infinity; for (const x of a) for (const y of b) g = Math.min(g, E.fieldOf(st).dist(x.hex, y.hex)); return g; };
    const uc = (st, t) => E.alive(st).filter((u) => u.team === t).reduce((a, u) => a + (E.card(st, u).beings || 1), 0);
    const snap = (st) => ({ units_n_l3: others(st, "N").length, units_s_l3: others(st, "S").length, uc_n_l3: uc(st, "N"), uc_s_l3: uc(st, "S"),
      holder_n_l3: E.holderOf(st, "N") ? 1 : 0, holder_s_l3: E.holderOf(st, "S") ? 1 : 0, flag_n_l3: +E.flagShown(st, "N").toFixed(2), flag_s_l3: +E.flagShown(st, "S").toFixed(2), gap_l3: gap(st) });
    return {
      before(st, c) {
        turn0 = st.turn;
        const key = st.turn + st.toMove;
        if (!sides.length || sides[sides.length - 1].key !== key) sides.push({ key, turn: st.turn, attack: false });
        if (firstContact === "" && adjacent(st)) firstContact = st.turn;
        if (!l3 && st.phase === "play" && st.turn >= E.turnLimit(st) - 3) l3 = snap(st);
        totals = total(st);
      },
      after(st, c, r) {
        if (!r.ok || c.refusedEnd) return;
        const t = c.action.type;
        if (t === "attack" || t === "pull") { sides[sides.length - 1].attack = true; if (firstAttack === "") firstAttack = turn0; }
        if (t === "brace") braces.push(turn0);
        if (totals !== null && total(st) < totals - 1e-9) { lastDamage = turn0; lastDamageSide = sides.length - 1; }
        if (firstContact === "" && adjacent(st)) firstContact = turn0;
      },
      end(st) {
        let lastA = -1; sides.forEach((s, i) => { if (s.attack) lastA = i; });
        const firstA = sides.findIndex((s) => s.attack);
        let longest = 0, run = 0, quiet = 0;
        if (firstA >= 0) for (const s of sides.slice(firstA)) { if (s.attack) run = 0; else { run++; quiet++; longest = Math.max(longest, run); } }
        const res = st.result, how = res ? res.how : "", tl = /^turn limit/.test(how);
        return Object.assign({
          first_contact_turn: firstContact, first_attack_turn: firstAttack, last_damage_turn: lastDamage,
          quiet_end: sides.length - 1 - lastA, longest_quiet: longest, quiet_side_turns: quiet,
          braces_last5: braces.filter((t) => t >= st.turn - 4).length
        }, l3 || { units_n_l3: "", units_s_l3: "", uc_n_l3: "", uc_s_l3: "", holder_n_l3: "", holder_s_l3: "", flag_n_l3: "", flag_s_l3: "", gap_l3: "" }, {
          units_n_end: others(st, "N").length, units_s_end: others(st, "S").length, gap_end: gap(st),
          limit_decided_by: !tl ? "" : /pull damage/.test(how) ? "flag" : /fewer/.test(how) ? "units" : /draw/.test(how) ? "draw" : how,
          limit_flag_margin: tl ? +Math.abs(st.pole.S - st.pole.N).toFixed(2) : "",
          damage_quiet_end: sides.length - 1 - lastDamageSide
        });
      }
    };
  }
};

// Brief 019: leads. Lead here counts non-holder unit cap (UC, whole units), as brief 016's uc_* columns do; Brain 7's
// own lead (HP-weighted) is separate. Read only.
const sideUc = (E, st, t) => E.alive(st).filter((u) => u.team === t && !E.isHolder(st, u)).reduce((a, u) => a + (E.card(st, u).beings || 1), 0);
MEASURES.lead = {
  about: "Leads (Brief 019). lead_lost: 1 if a side led by 1+ non-holder UC at every side-turn start for at least two full rounds (five side-turn starts in a row, the game's end counting as the last) and the game ended with that side not ahead on non-holder UC and not the winner; lead_lost_side (N, S or both), its largest lead in the game (lead_lost_peak) and the turn that lead began (lead_lost_first_turn). lead_unused: 1 if the game ended on the turn limit with a side 1+ non-holder UC ahead at the first side-turn start of turn limit − 3; lead_unused_side.",
  columns: ["lead_lost", "lead_lost_side", "lead_lost_peak", "lead_lost_first_turn", "lead_unused", "lead_unused_side"],
  make(ctx) {
    const { E } = ctx; const obs = []; let key = "", l3;
    return {
      before(st) {
        const k = st.turn + st.toMove;
        if (k === key || st.phase !== "play") return;
        key = k;
        const d = sideUc(E, st, "N") - sideUc(E, st, "S");
        obs.push({ turn: st.turn, d });
        if (l3 === undefined && st.turn >= E.turnLimit(st) - 3) l3 = d;
      },
      end(st) {
        const fin = sideUc(E, st, "N") - sideUc(E, st, "S"), all = obs.concat([{ turn: st.turn, d: fin }]);
        const w = st.result && st.result.winner, lost = [];
        let peak = 0, first = "";
        for (const t of ["N", "S"]) {
          const sg = t === "N" ? 1 : -1;
          let run = 0, start = null, qual = null, pk = 0;
          for (const o of all) {
            pk = Math.max(pk, sg * o.d);
            if (sg * o.d >= 1) { if (!run) start = o.turn; run++; if (run >= 5 && qual === null) qual = start; } else run = 0;
          }
          if (qual !== null && sg * fin <= 0 && w !== t) { lost.push(t); if (pk > peak || first === "") { peak = Math.max(peak, pk); first = first === "" ? qual : Math.min(first, qual); } }
        }
        const tl = st.result && /turn limit/.test(st.result.how);
        const un = tl && l3 !== undefined && Math.abs(l3) >= 1;
        return { lead_lost: lost.length ? 1 : 0, lead_lost_side: lost.length === 2 ? "both" : lost[0] || "", lead_lost_peak: lost.length ? peak : "", lead_lost_first_turn: lost.length ? first : "",
          lead_unused: un ? 1 : 0, lead_unused_side: un ? (l3 > 0 ? "N" : "S") : "" };
      }
    };
  }
};
MEASURES.alone = {
  about: "Units lost alone or together (Brief 019), per side of the unit removed: alone if, at the start of the side-turn in which it was removed, no friendly unit other than its own holder (and itself) stood within 2 hexes of it; otherwise together. holder_strikes_solo/group: side-turns in which exactly one unit (or two or more) of that side attacked the enemy holder.",
  columns: ["lost_alone_n", "lost_alone_s", "lost_together_n", "lost_together_s", "holder_strikes_solo_n", "holder_strikes_solo_s", "holder_strikes_group_n", "holder_strikes_group_s"],
  make(ctx) {
    const { E } = ctx, o = Object.fromEntries(MEASURES.alone.columns.map((k) => [k, 0]));
    let key = "", alone = new Map(), side = null, strikers = new Set(), hpBefore = null;
    const close = () => { if (side && strikers.size) o[(strikers.size === 1 ? "holder_strikes_solo_" : "holder_strikes_group_") + side.toLowerCase()]++; strikers = new Set(); };
    return {
      before(st, c) {
        const k = st.turn + st.toMove;
        if (k !== key && st.phase === "play") {
          close(); key = k; side = st.toMove; alone = new Map();
          for (const u of E.alive(st)) alone.set(u.uid, !E.alive(st).some((f) => f.team === u.team && f.uid !== u.uid && !E.isHolder(st, f) && E.fieldOf(st).dist(f.hex, u.hex) <= 2));
        }
        hpBefore = new Map(st.units.map((u) => [u.uid, u.hp]));
        if (c.action.type === "attack") { const t = E.unitByUid(st, c.action.target); if (t && E.isHolder(st, t)) strikers.add(c.action.uid); }
      },
      after(st, c, r) {
        if (!hpBefore || c.refusedEnd) return;
        for (const u of st.units) if (hpBefore.get(u.uid) > 0 && u.hp <= 0) o[(alone.get(u.uid) ? "lost_alone_" : "lost_together_") + u.team.toLowerCase()]++;
        if (!r.ok && c.action.type === "attack") strikers.delete(c.action.uid);
        hpBefore = null;
      },
      end() { close(); return o; }
    };
  }
};
MEASURES.brain7 = {
  about: "Brain 7's own reading of the board (Brief 019), counted at the start of each side-turn it plays (per side, n/s): side-turns ahead and behind on its material (B1), ahead on both material and flag damage, storming (B3/B6), holding (B6), storming but waiting to strike the holder (B3), regrouping (B5), holder joining (B4), and the first turn it was ahead on both. lone_losing: attacks made, by any Brain 5-family side while ahead on Brain 7's material reading, that B2 calls lone and losing (no likely kill, no friend can join, the attacker expected to be removed next turn).",
  columns: ["b7_turns_n", "b7_turns_s", "b7_ahead_n", "b7_ahead_s", "b7_behind_n", "b7_behind_s", "b7_both_n", "b7_both_s", "b7_storm_n", "b7_storm_s", "b7_hold_n", "b7_hold_s", "b7_wait_n", "b7_wait_s", "b7_regroup_n", "b7_regroup_s", "b7_join_n", "b7_join_s", "b7_both_first_n", "b7_both_first_s", "lone_losing_n", "lone_losing_s"],
  make(ctx) {
    const { E, Bot } = ctx, o = Object.fromEntries(MEASURES.brain7.columns.map((k) => [k, k.startsWith("b7_both_first") ? "" : 0]));
    const ref = require("path").join(__dirname, "..", "..", "board", "brain.js");
    let key = "", pending = null;
    const B7 = (t) => { const b = ctx.brains[t]; return b && b.lead ? b : null; };
    const refLead = (() => { try { return require(ref).DEFAULT_BRAINS.brain7.lead; } catch (e) { return { lead: 1, care: 1, aheadAt: 1, killChance: 0.5 }; } })();
    return {
      before(st, c) {
        const k = st.turn + st.toMove, t = st.toMove, x = t.toLowerCase();
        if (k !== key && st.phase === "play") {
          key = k;
          const b = B7(t), cx = b && Bot.lead7Context(st, b);
          if (cx) {
            o["b7_turns_" + x]++;
            for (const [f, col] of [["ahead", "ahead"], ["behind", "behind"], ["both", "both"], ["storm", "storm"], ["hold", "hold"], ["regroup", "regroup"], ["join", "join"]]) if (cx[f]) o[`b7_${col}_${x}`]++;
            if (cx.storm && !cx.strikeOK) o["b7_wait_" + x]++;
            if (cx.both && o["b7_both_first_" + x] === "") o["b7_both_first_" + x] = st.turn;
          }
        }
        pending = null;
        const b = ctx.brains[t];
        if (c.action.type === "attack" && b && b.model) {
          const lead = Bot.material7(st, t) - Bot.material7(st, E.foeOf(t));
          if (lead >= (b.lead ? b.lead.aheadAt : refLead.aheadAt) - 1e-9) pending = { st: E.cloneLite(st), b, kc: b.lead ? b.lead.killChance : refLead.killChance };
        }
      },
      after(st, c, r) {
        if (!pending || !r.ok || c.refusedEnd) { pending = null; return; }
        const a = c.action, t = pending.st.toMove;
        if (Bot.loneLosing7(pending.st, st, t, pending.b, a.uid, a.target, pending.kc)) o["lone_losing_" + t.toLowerCase()]++;
        pending = null;
      },
      end() { return o; }
    };
  }
};

// Brief 014: which field the game was played on, and how each side deployed (units outside the deploy area, which the
// engine refuses, and units started on their own flag). Read only.
MEASURES.fields = {
  about: "Fields (Brief 014): the field the game was played on, units deployed outside their side's deploy area (the engine refuses these, so anything above 0 is a bug), and units that started on their own flag.",
  columns: ["field", "deploy_outside", "deploy_on_flag"],
  make(ctx) {
    const { E } = ctx;
    return {
      end(st) {
        const G = E.fieldOf(st);
        let outside = 0, onFlag = 0;
        for (const a of st.actions.filter((x) => x.type === "deploy")) {
          const zone = new Set(E.deployZone(st, a.team));
          for (const uid in a.placements) { const h = a.placements[uid]; if (!zone.has(h)) outside++; if (h === G.FLAG[a.team]) onFlag++; }
        }
        return { field: G.id, deploy_outside: outside, deploy_on_flag: onFlag };
      }
    };
  }
};

// Always collected: the outcome (it feeds the summary's key table), timing, (Brief 016) stall and (Brief 019) lead and alone.
const ALWAYS = ["outcome", "timing", "stall", "lead", "alone"];
module.exports = { MEASURES, ALWAYS };
