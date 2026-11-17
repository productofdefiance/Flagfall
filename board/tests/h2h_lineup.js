// Head-to-head as h2h_v3.js, but LINEUP_A (comma-separated card codes) sets brain A's squad.
// LINEUP_A=HM,HM,HM,HR,HR,HA,HA node tests/h2h_lineup.js <presetId> <size 5|7> <games> <seedOffset> <brainA> <brainB>
// A brain is an id, or "id|{json}" to layer changes on top of it (used by sweeps).
// side.X.wins includes turn-limit tiebreak wins; side.X.tiebreak counts those separately.
const E = require("../engine.js"), Bot = require("../bot.js");
const { PRESETS } = require("../data.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const [id, sizeS, gamesS, offS, aId, bId] = process.argv.slice(2);
const size = +sizeS, games = +gamesS, off = +(offS || 0);
const merge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) a[k] = merge(a[k] || {}, b[k]); else a[k] = b[k]; } return a; };
const brain = (spec) => { const [base, extra] = spec.split("|"); const b = JSON.parse(JSON.stringify(DEFAULT_BRAINS[base])); return extra ? merge(b, JSON.parse(extra)) : b; };
const BA = brain(aId), BB = brain(bId);
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === id)));
const L = (a) => a.map(([i, c, f]) => ({ id: i, card: c, fk: !!f }));
rs.lineup = rs.switches.noKeeper
  ? L(size === 5 ? [["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]] : [["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["HR", "HR"], ["LM", "LM"], ["LA", "LA"], ["LR", "LR"]])
  : L(size === 5 ? [["FK", "HM", 1], ["HM", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]] : [["FK", "HM", 1], ["HM", "HM"], ["HA", "HA"], ["HR", "HR"], ["LM", "LM"], ["LA", "LA"], ["LR", "LR"]]);
const rnd = require("./rng.js")("h2h", off);   // engine generator (was a looping home-made formula)
const blank = () => ({ wins: 0, tiebreak: 0, light: 0, lightRemoved: 0, dodgeSum: 0, dodgeN: 0, distSum: { light: 0, heavy: 0 }, distN: { light: 0, heavy: 0 }, friendsSum: 0, friendsN: 0, braces: 0, unitTurns: 0, pulls: 0, ko: 0, tko: 0 });
const out = { id, size, games, A: aId, B: bId, draws: 0, limit: 0, turns: [], side: { A: blank(), B: blank() } };
for (let g = 0; g < games; g++) {
  const first = (g + off) % 2 ? "S" : "N";
  const aTeam = Math.floor((g + off) / 2) % 2 ? "S" : "N";       // brain A plays each side, moving first and second, equally
  const brainOf = (t) => (t === aTeam ? BA : BB), tag = (t) => (t === aTeam ? "A" : "B");
  const LA = (process.env.LINEUP_A || "").split(",").filter(Boolean); const lineups = LA.length ? { [aTeam]: LA.map((c, i) => ({ id: c + (i + 1), card: c, fk: false })) } : undefined; const st = E.newMatch(rs, { first, lineups });
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, brainOf(t), rnd) });
  let n = 0, lastTurnKey = "";
  while (st.phase === "play" && n++ < 5000) {
    const team = st.toMove, S = out.side[tag(team)];
    const key = st.turn + team;
    if (key !== lastTurnKey) {   // once per side-turn: positions of that side's units
      lastTurnKey = key;
      for (const u of E.alive(st).filter((x) => x.team === team)) {
        const c = E.card(st, u), cls = Bot.classOf(c), foes = E.alive(st).filter((e) => e.team !== team);
        if (foes.length) { S.distSum[cls] += Math.min(...foes.map((e) => E.dist(e.hex, u.hex))); S.distN[cls]++; }
        S.friendsSum += E.alive(st).filter((f) => f.team === team && f !== u && E.dist(f.hex, u.hex) === 1).length; S.friendsN++;
        S.unitTurns++;
      }
    }
    const c = Bot.chooseAction(st, brainOf(team), rnd); const a = c.action;
    const tgt = a.type === "attack" ? E.unitByUid(st, a.target) : null;
    const bd = tgt ? E.breakdown(st, E.unitByUid(st, a.uid), tgt, E.unitByUid(st, a.uid).hex) : null;
    const r = E.act(st, a, () => E.rollWith(st, rnd));
    if (!r.ok) { E.act(st, { type: "end" }); continue; }
    if (tgt && Bot.classOf(E.card(st, tgt)) === "light" && E.card(st, tgt).dodge) { const D = out.side[tag(tgt.team)]; D.dodgeSum += bd.dodge || 0; D.dodgeN++; }
    if (a.type === "brace") S.braces++;
    if (a.type === "pull") S.pulls++;
  }
  for (const u of st.units) { const c = E.card(st, u); if (Bot.classOf(c) === "light") { const S = out.side[tag(u.team)]; S.light++; if (u.hp <= 0) S.lightRemoved++; } }
  out.turns.push(st.turn);
  const w = st.result && st.result.winner;
  if (!w) { out.draws++; out.limit++; continue; }
  const W = out.side[tag(w)]; W.wins++;
  if (st.result.how === "KO") W.ko++; else if (st.result.how === "TKO") W.tko++; else { out.limit++; W.tiebreak++; }
}
console.log(JSON.stringify(out));
