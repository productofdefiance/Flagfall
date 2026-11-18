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

  play: {
    about: "How each side played: braces, braces where no enemy could reach that unit next turn, attacks, attacks on a holder, moves, and safety stops.",
    columns: ["braces", "braces_no_threat", "attacks", "holder_attacks", "moves", "safety_stops", "refused"],
    make(ctx) {
      const { E, Bot } = ctx, o = { braces: 0, braces_no_threat: 0, attacks: 0, holder_attacks: 0, moves: 0, safety_stops: 0, refused: 0 };
      return {
        before(st, c) {
          const a = c.action;
          if (/Safety stop/.test(c.reason || "")) o.safety_stops++;
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
// Always collected: the outcome (it feeds the summary's key table) and timing.
const ALWAYS = ["outcome", "timing"];
module.exports = { MEASURES, ALWAYS };
