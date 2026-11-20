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
    about: "How long the computer thought: total and worst time per side-turn, in milliseconds on the machine that ran it.",
    columns: ["bot_turns", "bot_ms", "bot_ms_max_turn"],
    make() {
      let key = "", cur = 0, turns = 0, total = 0, max = 0;
      return {
        before(st, c, ms) { const k = st.turn + st.toMove; if (k !== key) { if (key) { turns++; max = Math.max(max, cur); } key = k; cur = 0; } cur += ms; total += ms; },
        end() { if (key) { turns++; max = Math.max(max, cur); } return { bot_turns: turns, bot_ms: total, bot_ms_max_turn: max }; }
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
              if (t.team !== u.team && E.dist(u.hex, t.hex) >= 2 && E.flagBetween(u.hex, t.hex) && E.canAttackFrom(s2, u, u.hex, t)) o.flag_line_pairs++;
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
    const adjacent = (st) => E.alive(st).some((u) => E.alive(st).some((e) => e.team !== u.team && E.dist(u.hex, e.hex) === 1));
    const others = (st, t) => E.alive(st).filter((u) => u.team === t && !E.isHolder(st, u));
    const gap = (st) => { const a = others(st, "N"), b = others(st, "S"); if (!a.length || !b.length) return ""; let g = Infinity; for (const x of a) for (const y of b) g = Math.min(g, E.dist(x.hex, y.hex)); return g; };
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

// Always collected: the outcome (it feeds the summary's key table), timing, and (Brief 016) stall.
const ALWAYS = ["outcome", "timing", "stall"];
module.exports = { MEASURES, ALWAYS };
