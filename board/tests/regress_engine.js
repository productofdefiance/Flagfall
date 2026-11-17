// Engine regression: plays seeded bot-vs-bot games and prints one hash per rule set, covering every log line,
// action and result. Run it against two copies of the board (before and after a change); rule sets that should
// not have changed must print the same hash.
// node tests/regress_engine.js <boardDir> [gamesPerSet]
const path = require("path");
const dir = path.resolve(process.argv[2] || path.join(__dirname, ".."));
const E = require(path.join(dir, "engine.js")), Bot = require(path.join(dir, "bot.js"));
const { PRESETS, DEFAULT_RULESET } = require(path.join(dir, "data.js")); const { DEFAULT_BRAINS } = require(path.join(dir, "brain.js"));
const crypto = require("crypto");
const games = +(process.argv[3] || 20);
const sets = [DEFAULT_RULESET, ...PRESETS].filter((r) => ["v3.1"].indexOf(r.id) < 0);
const brains = ["standard", "kitB", "batchC"].filter((b) => DEFAULT_BRAINS[b]);
for (const base of sets) {
  const h = crypto.createHash("sha256"); let ends = {};
  for (let g = 0; g < games; g++) {
    for (const size of [5, 7]) {
      const rs = JSON.parse(JSON.stringify(base));
      const codes = size === 5 ? ["HM", "HM", "HA", "LM", "LR"] : ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];
      const n = {}; const line = codes.map((c) => { n[c] = (n[c] || 0) + 1; return { id: n[c] === 1 ? c : c + n[c], card: c, fk: false }; });
      if (!rs.switches.noKeeper) line[0].fk = true;
      if (!rs.cards.LA) { line.forEach((l) => { if (!rs.cards[l.card]) l.card = "HM"; }); }
      const rnd = E.seededRandom(`regress-${base.id}-${size}-${g}`);
      const first = g % 2 ? "S" : "N", B = DEFAULT_BRAINS[brains[g % brains.length]];
      const st = E.newMatch(rs, { first, lineups: { N: line, S: line } });
      for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
      let k = 0;
      while (st.phase === "play" && k++ < 6000) { const a = Bot.chooseAction(st, B, rnd).action; const r = E.act(st, a, () => E.rollWith(st, rnd)); if (!r.ok) E.act(st, { type: "end" }); }
      h.update(JSON.stringify(st.log) + JSON.stringify(st.actions) + JSON.stringify(st.result));
      const key = st.result ? st.result.how : "stuck"; ends[key] = (ends[key] || 0) + 1;
    }
  }
  console.log(base.id.padEnd(12), h.digest("hex").slice(0, 16), JSON.stringify(ends));
}
