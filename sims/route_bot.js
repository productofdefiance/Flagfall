// Brief 017, Bot minimum: Brain 5 vs Brain 5 games, counting how the bot's moves go under the route rule (v3.9) and,
// for comparison, under the jump (v3.8). Every move: the engine's route() is asked first (what the bot's own look-ahead
// plays, since the bot scores moves by playing them through the engine), then the move is played and its end compared.
// node sims/route_bot.js <rules> <games> [format: 5v5|7v7|both]
const W = require("../board/watch.js"), E = require("../board/engine.js");
const rules = process.argv[2] || "v3.9", games = +(process.argv[3] || 100), fmt = process.argv[4] || "both";
const c = { games: 0, moves: 0, predictedOk: 0, short: 0, spearMoves: 0, spearDamage: 0, markBefore: 0, markEnd: 0, removedOnMove: 0, ends: {} };
const formats = fmt === "both" ? ["5v5", "7v7"] : [fmt];
for (let g = 0; g < games; g++) {
  const format = formats[g % formats.length];
  let pending = null;
  const { st } = W.playOut({ rules, format, n: "brain5", s: "brain5", seed: `route-bot-${g}`, first: "coin" }, {
    before(s, ch) {
      pending = null;
      if (!ch || !ch.action || ch.action.type !== "move") return;
      const u = E.unitByUid(s, ch.action.uid);
      pending = { r: E.route(s, ch.action.uid, ch.action.to), uid: ch.action.uid, to: ch.action.to, hp: u.hp, n: s.log.length };
    },
    after(s, ch, res) {
      if (!pending || !res || !res.ok || !ch.action || ch.action.type !== "move") return;
      const p = pending, u = E.unitByUid(s, p.uid), line = s.log.slice(p.n).map((x) => x.text).join(" | ");
      c.moves++;
      if (p.r && u.hex === p.r.end) c.predictedOk++;
      if (u.hex !== p.to) c.short++;
      if (/braced .* deals/.test(line)) { c.spearMoves++; c.spearDamage += (p.r ? p.r.events.filter((e) => e.type === "spear").reduce((t, e) => t + e.amount, 0) : 0); }
      if (/stopped by Zone of Control short of/.test(line)) c.markBefore++;
      else if (/stopped by Zone of Control/.test(line)) c.markEnd++;
      if (u.hp <= 0) c.removedOnMove++;
      pending = null;
    }
  });
  c.games++;
  const k = st.result ? st.result.how : "unfinished"; c.ends[k] = (c.ends[k] || 0) + 1;
}
console.log(JSON.stringify(Object.assign({ rules, formats }, c)));
