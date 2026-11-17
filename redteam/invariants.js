const E = require("../board/engine.js"), Bot = require("../board/bot.js");
const { PRESETS } = require("../board/data.js"); const { DEFAULT_BRAINS } = require("../board/brain.js");
const rs = JSON.parse(JSON.stringify(PRESETS.find((p) => p.id === "v3")));
function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(424242); const mk = (codes) => { const n = {}; return codes.map((c) => { n[c] = (n[c] || 0) + 1; return { id: n[c] === 1 ? c : c + n[c], card: c }; }); };
const lines = [["HM", "HM", "LM", "HR", "LR", "HA", "LA"], ["LM", "LM", "LR", "LR", "LR", "LA", "LA"], ["HM", "HM", "HM", "HR", "HR", "HA", "HA"], ["HA", "HA", "HA", "LA", "LA", "LM", "HR"]];
let refused = 0, actions = 0, bad = [], games = +process.argv[2] || 30, botErr = 0;
for (let g = 0; g < games; g++) {
  const first = g % 2 ? "S" : "N"; const st = E.newMatch(rs, { first, lineups: { N: mk(lines[g % 4]), S: mk(lines[(g + 1) % 4]) } });
  const B = { N: DEFAULT_BRAINS.kitB, S: g % 3 ? DEFAULT_BRAINS.standard : DEFAULT_BRAINS.easy };
  for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B[t], rnd) });
  let n = 0;
  while (st.phase === "play" && n++ < 6000) {
    let c; try { c = Bot.chooseAction(st, B[st.toMove], rnd); } catch (e) { botErr++; bad.push("bot threw: " + e.message); c = { action: { type: "end" } }; }
    const r = E.act(st, c.action, () => E.rollWith(st, rnd)); actions++;
    if (!r.ok) { refused++; bad.push("refused: " + JSON.stringify(c.action) + " " + r.error); E.act(st, { type: "end" }); }
    const al = E.alive(st), hexes = al.map((u) => u.hex);
    if (new Set(hexes).size !== hexes.length) bad.push("two units on one hex, game " + g);
    for (const u of st.units) { if ((u.hp > 0 && u.hp < 0.5) || Math.abs(u.hp * 2 - Math.round(u.hp * 2)) > 1e-9) bad.push("odd HP " + u.hp); if (u.hp > 0 && !E.CELLSET.has(u.hex)) bad.push("off field"); if (u.hp > 0 && u.hex === E.FLAG[E.foeOf(u.team)]) bad.push("on enemy flag"); if (u.stam < -1e-9) bad.push("negative stamina"); }
    if (st.cmd < -1e-9) bad.push("negative command");
    for (const t of ["N", "S"]) if (st.pole[t] < 0 || st.pole[t] > rs.game.poleHP + 1e-9) bad.push("flag out of range " + st.pole[t]);
  }
  if (!st.result) bad.push("no result, game " + g);
}
console.log(JSON.stringify({ games, actions, refusedByEngine: refused, botErrors: botErr, problems: bad.length, sample: [...new Set(bad)].slice(0, 8) }));
// state restore after a failed action
{ const st = E.newMatch(rs, { first: "N", lineups: { N: mk(["HM", "LM"]), S: mk(["HM", "LM"]) } });
  for (const t of ["N", "S"]) { const z = E.deployZone(st, t), p = {}; let i = 0; for (const u of st.units.filter((x) => x.team === t)) p[u.uid] = z[i++]; E.act(st, { type: "deploy", team: t, placements: p }); }
  const before = JSON.stringify(st); const tries = [{ type: "swap", uid: "N-HM", with: "nope" }, { type: "move", uid: "N-HM", to: "Z9" }, { type: "attack", uid: "N-HM", target: "S-HM" }, { type: "pull", uid: "N-HM" }];
  console.log("state unchanged after each refused action:", tries.map((a) => { const r = E.act(st, a); return !r.ok && JSON.stringify(st) === before; }).join(",")); }
