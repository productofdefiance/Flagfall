// The fixed baseline (red team report, Part 3 item 4): re-run after every bot or rule change.
// node sims/baseline.js <presetId> <size 5|7> <games> <brainA> <brainB> <lineups: balanced|kit|light> [shard] [switch=on|off,...]
// "light" is the board's Light team: LM, LA, LR in turn (7v7 3-2-2, 5v5 2-2-1).
// The optional last argument flips switches for a comparison run, e.g. tackleUsesCap=off (the seed stays the same).
// Brain A plays each side and each move order equally. Prints one JSON line of counts; sims/baseline_sum.py adds shards.
// Tiebreak wins are reported apart and never counted as wins.
const E = require("../board/engine.js"), Bot = require("../board/bot.js");
const { PRESETS } = require("../board/data.js"); const { DEFAULT_BRAINS } = require("../board/brain.js");
const [rsId, sizeS, gamesS, aId, bId, mode, shardS, flipS] = process.argv.slice(2);
// A brain may be named with planner switches changed, e.g. kitD:fort=0 (Brief 005 ablations).
const brainFrom = (spec) => { const [id, mods] = spec.split(":"); const b = JSON.parse(JSON.stringify(DEFAULT_BRAINS[id]));
  for (const kv of (mods || "").split(",").filter(Boolean)) { const [k, v] = kv.split("="); if (b.model && k in b.model) b.model[k] = +v; else if (b.plan5 && k in b.plan5) b.plan5[k] = +v; else b.planner[k] = +v; } return b; };
const size = +sizeS, games = +gamesS, shard = +(shardS || 0), BA = brainFrom(aId), BB = brainFrom(bId);
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === rsId)));
for (const kv of (flipS || "").split(",").filter(Boolean)) { const [k, v] = kv.split("="); rs.switches[k] = v === "on" || v === "true"; }
const rnd = require("../board/tests/rng.js")(`baseline:${rsId}:${size}:${aId.split(":")[0]}:${bId.split(":")[0]}:${mode}`, shard);   // same seed for ablation variants
const balanced = size === 5 ? { HM: 2, HA: 1, LM: 1, LR: 1 } : { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 };   // what the board gives a bot by default
const lightTeam = size === 5 ? { LM: 2, LA: 2, LR: 1 } : { LM: 3, LA: 2, LR: 2 };
const lineupOf = (B) => { const c = mode === "light" ? lightTeam : (mode === "kit" && Bot.squadCounts(rs, size, B)) || balanced, out = [];
  for (const code of Object.keys(rs.cards)) for (let i = 0; i < (c[code] || 0); i++) out.push({ id: i ? code + (i + 1) : code, card: code });
  return out; };
const T = { rs: rsId, size, A: aId, B: bId, mode, games: 0, koHolderKilled: 0, koPull: 0, tko: 0, tiebreakWin: 0, draw: 0, stuck: 0,
  aWins: 0, bWins: 0, aTiebreak: 0, bTiebreak: 0, firstMoverWins: 0, decisive: 0, pulls: 0, gamesWithPull: 0,
  holderDraggedOff: 0, holderWalkedOff: 0, parries: 0, lightRemoved: 0, evadeChances: 0, evadeTaken: 0, evadeNoRoom: 0, evadeSaferChances: 0, evadeSaferTaken: 0,
  // Brief 006 diagnosis
  cmdMoves: 0, cmdMovesNoAttack: 0, moveToAttack: 0, moveToAttackWasted: 0, contactTurns: 0, attacksInContact: 0,
  braces: 0, bracesNoThreat: 0, contactTurnsNoBrace: 0, lightAttacked: 0, lightDodgeSum: 0, botMs: 0, botMsMax: 0, botTurns: 0, flips: flipS || "", turnSum: 0, unitsRemoved: 0, unitsStart: 0, cmdSpent: 0, sideTurns: 0, unitsActed: 0,
  // Brief 007. Why an Evade had no legal step (engine whyNoMove, by first matching reason): the movement cap, Command,
  // Stamina, a zone stop, tackle, or no free hex further from the target. evadeNoRoomFromFull: of those, the attacker
  // had moved its full cap on the approach (or had at most its cap left before the attack).
  evadeNoRoomCap: 0, evadeNoRoomCmd: 0, evadeNoRoomStam: 0, evadeNoRoomZone: 0, evadeNoRoomTackle: 0, evadeNoRoomTackleCap: 0, evadeNoRoomTackleStam: 0, evadeNoRoomBlocked: 0, evadeNoRoomOther: 0,
  evadeNoRoomMovedBefore: 0, evadeNoRoomStoodStill: 0,
  // Clock play: side-turns in the last 3 turns (turn >= limit - 2) that start behind on the tiebreak (or level), and
  // of those, turns with an attack on the enemy holder or a pull. A/B split by brain.
  lateBehindTurns: 0, lateBehindPress: 0, lateBehindHolderAtk: 0, lateBehindPull: 0, lateAheadTurns: 0, lateAheadPress: 0, lateLevelTurns: 0, lateLevelPress: 0,
  aLateBehindTurns: 0, aLateBehindPress: 0, bLateBehindTurns: 0, bLateBehindPress: 0,
  // Who leads the tiebreak at the start of turn (limit - 3): games with a leader, and how those games ended for it.
  leadAt3: 0, leadAt3WinTiebreak: 0, leadAt3WinDecisive: 0, leadAt3Lose: 0, leadAt3Draw: 0, levelAt3: 0, trailAttackers0: 0, trailAttackers1: 0, trailAttackers2: 0 };
const tbLeader = (st) => E.tiebreak(st).winner;
for (let g = 0; g < games; g++) {
  const k = g + shard * games;
  const first = k % 2 ? "S" : "N", aTeam = Math.floor(k / 2) % 2 ? "S" : "N", brainOf = (t) => (t === aTeam ? BA : BB);
  const st = E.newMatch(rs, { first, lineups: { N: lineupOf(brainOf("N")), S: lineupOf(brainOf("S")) } });
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brainOf(t), rnd) });
  let n = 0, pulls = 0, lastA = null, key = "", acted = new Set(); const chance = new Set();
  // per side-turn diagnosis state
  let tMoveCost = new Map(), tAttacked = new Set(), tIntent = [], tContact = false, tAttacks = 0, tBraces = 0, tMs = 0;
  let tLate = null, tPressH = false, tPressP = false, lead3 = undefined; const LIM = E.turnLimit(st);
  const closeLate = () => { if (!tLate) return; const press = tPressH || tPressP, side = tLate.team === aTeam ? "a" : "b";
    if (tLate.pos === "behind") { T.lateBehindTurns++; T[side + "LateBehindTurns"]++; if (press) { T.lateBehindPress++; T[side + "LateBehindPress"]++; } if (tPressH) T.lateBehindHolderAtk++; if (tPressP) T.lateBehindPull++; }
    else if (tPressH || tPressP || true) { const k = tLate.pos === "ahead" ? "lateAhead" : "lateLevel"; T[k + "Turns"]++; if (press) T[k + "Press"]++; }
    tLate = null; };
  const contactNow = () => E.alive(st).some((x) => x.team === st.toMove && !x.done && E.options(st, x.uid).attacks.length);
  while (st.phase === "play" && n++ < 6000) {
    if (st.turn + st.toMove !== key) { key = st.turn + st.toMove; acted = new Set(); tMoveCost = new Map(); tAttacked = new Set(); tIntent = []; tAttacks = 0; tBraces = 0; tMs = 0; tContact = contactNow();
      closeLate(); tPressH = tPressP = false;
      if (st.turn >= LIM - 2) { const l = tbLeader(st); tLate = { team: st.toMove, pos: l === st.toMove ? "ahead" : l ? "behind" : "level" }; }
      if (lead3 === undefined && st.turn >= LIM - 3) { lead3 = tbLeader(st);
        // Brief 007: what the side behind still has to push with (units other than its flag holder)
        if (lead3) { const tr = E.foeOf(lead3), n0 = E.alive(st).filter((x) => x.team === tr && !E.isHolder(st, x)).length; T["trailAttackers" + Math.min(n0, 2)]++; } } }
    const t0 = Date.now(); const c = Bot.chooseAction(st, brainOf(st.toMove), rnd); tMs += Date.now() - t0;
    const a = c.action;
    if (a.type === "move") { const m = /moves to \S+ to attack (\S+)/.exec(c.reason || ""); if (m) tIntent.push({ uid: a.uid, target: m[1] }); }
    if (a.type === "brace") { const bu = E.unitByUid(st, a.uid); T.braces++; tBraces++; if (!E.alive(st).some((e) => e.team !== bu.team && Bot.canThreaten(st, e, bu.hex))) T.bracesNoThreat++; }
    if (a.type === "attack") { const tg = E.unitByUid(st, a.target); if (tg && /^light/.test(E.card(st, tg).icon || "")) { T.lightAttacked++; T.lightDodgeSum += E.card(st, tg).dodge && st.rs.switches.dodgeRoom ? E.dodgeRoom(st, tg).pct : 0; } }
    const u = a.uid && E.unitByUid(st, a.uid), wasHolder = u && E.isHolder(st, u);
    if (a.type === "attack") { const tg = E.unitByUid(st, a.target); if (tg && E.isHolder(st, tg)) tPressH = true; }
    if (a.type === "pull") tPressP = true;
    const moved0 = u ? u.moved : 0;
    const rec = st.spend[st.spend.length - 1], cmd0 = st.cmd, log0 = st.log.length;
    if (a.type === "move" && u && u.evadeFrom && chance.has(u.uid)) { T.evadeTaken++; chance.delete(u.uid); if (chance.delete(u.uid + "#safer")) T.evadeSaferTaken++; }   // Brief 004
    const cost0 = st.cmd;
    const r = E.act(st, a, () => E.rollWith(st, rnd));
    if (!r.ok) { E.act(st, { type: "end" }); continue; }
    if (a.type === "move") tMoveCost.set(a.uid, (tMoveCost.get(a.uid) || 0) + (cost0 - st.cmd));
    if (a.type === "attack") { tAttacked.add(a.uid); tAttacks++; tContact = true; }
    for (let i = log0; i < st.log.length; i++) if (st.log[i].text.includes("; parry deals ")) T.parries++;   // parries that fired (Brief 002)
    if (u) acted.add(u.uid);
    if (a.type === "attack" && u && u.evadeFrom) {   // Brief 004: an Evade became possible
      const mv = Object.keys(E.options(st, u.uid).moves);
      if (mv.length) {
        T.evadeChances++; chance.add(u.uid);
        // "Safer": some evade hex lowers the enemy's expected damage to this side next turn (the bot's own threat measure).
        const B0 = brainOf(u.team), t0 = Bot.threat(st, u.team, B0, true);
        if (mv.some((h) => { const s1 = E.cloneLite(st); try { E.apply(s1, { type: "move", uid: u.uid, to: h }); } catch (e) { return false; } return Bot.threat(s1, u.team, B0, true) < t0 - 1e-9; })) { T.evadeSaferChances++; chance.add(u.uid + "#safer"); }
      } else {
        T.evadeNoRoom++;
        const why = E.whyNoMove(st, u) || "";
        if (/^No free hex/.test(why)) T.evadeNoRoomBlocked++;
        else if (/full cap/.test(why)) T.evadeNoRoomCap++;
        else if (/Command/.test(why)) T.evadeNoRoomCmd++;
        else if (/Stamina for a step/.test(why)) T.evadeNoRoomStam++;
        else if (/zone/.test(why)) T.evadeNoRoomZone++;
        else if (/Tackled/.test(why)) { T.evadeNoRoomTackle++; if (E.capOf(st, u) - u.moved < 1 + (st.rs.switches.tackleUsesCap ? 1 : 0)) T.evadeNoRoomTackleCap++; else T.evadeNoRoomTackleStam++; }
        else T.evadeNoRoomOther++;
        if (moved0 > 0) T.evadeNoRoomMovedBefore++; else T.evadeNoRoomStoodStill++;
      }
    }
    if (a.type === "end") chance.clear();
    if (a.type === "end") {
      T.cmdSpent += rec.cmd - cmd0; T.sideTurns++; T.unitsActed += acted.size;
      for (const [uid, c2] of tMoveCost) { T.cmdMoves += c2; if (!tAttacked.has(uid)) T.cmdMovesNoAttack += c2; }
      for (const it of tIntent) { T.moveToAttack++; const tg = E.unitByUid(st, it.target.startsWith("N-") || it.target.startsWith("S-") ? it.target : E.foeOf(E.unitByUid(st, it.uid).team) + "-" + it.target); if (!tAttacked.has(it.uid) && tg && tg.hp > 0) T.moveToAttackWasted++; }
      if (tContact) { T.contactTurns++; T.attacksInContact += tAttacks; if (!tBraces) T.contactTurnsNoBrace++; }
      T.botMs += tMs; T.botTurns++; if (tMs > T.botMsMax) T.botMsMax = tMs;
    }
    if (a.type === "pull") pulls++;
    if (wasHolder && u.hp > 0 && u.hex !== E.FLAG[u.team]) { if (a.type === "attack") T.holderDraggedOff++; else T.holderWalkedOff++; }
    lastA = a;
  }
  closeLate();
  if (lead3 === undefined || st.turn < LIM - 3) { /* ended before turn limit - 3 */ }
  else if (!lead3) T.levelAt3++;
  else { T.leadAt3++; const w = st.result && st.result.winner, tbw = st.result && /turn limit/.test(st.result.how);
    if (!w) T.leadAt3Draw++; else if (w !== lead3) T.leadAt3Lose++; else if (tbw) T.leadAt3WinTiebreak++; else T.leadAt3WinDecisive++; }
  T.games++; T.pulls += pulls; if (pulls) T.gamesWithPull++;
  for (const x of st.units) { T.unitsStart++; if (x.hp <= 0) { T.unitsRemoved++; if (/^light/.test(E.card(st, x).icon || "")) T.lightRemoved++; } }
  if (!st.result) { T.stuck++; continue; }
  T.turnSum += st.turn;
  const { winner: w, how } = st.result;
  if (!w) { T.draw++; continue; }
  if (how === "KO") { if (lastA && lastA.type === "pull") T.koPull++; else T.koHolderKilled++; }
  else if (how === "TKO") T.tko++;
  else { T.tiebreakWin++; if (w === aTeam) T.aTiebreak++; else T.bTiebreak++; continue; }
  T.decisive++; if (w === first) T.firstMoverWins++;
  if (w === aTeam) T.aWins++; else T.bWins++;
}
console.log(JSON.stringify(T));
