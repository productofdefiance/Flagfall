// Hash of seeded bot-vs-bot games for every brain in a board's DEFAULT_BRAINS, on every preset. node brainhash.js <board> [ids...]
// An id may change settings and borrow another brain's seeds (Brief 019): brain7:lead=0,care=0@brain5 plays Brain 7 with
// those settings on Brain 5's seeds, so its hash must equal brain5's when the change makes it play the same.
const path = require("path"), dir = path.resolve(process.argv[2]);
const E = require(dir + "/engine.js"), Bot = require(dir + "/bot.js"), { PRESETS } = require(dir + "/data.js"), { DEFAULT_BRAINS } = require(dir + "/brain.js");
const ids = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(DEFAULT_BRAINS);
const crypto = require("crypto");
for (const spec of ids) {
  const [body, seedAs] = spec.split("@"), [base, mods] = body.split(":"), id = seedAs || base;
  const B = JSON.parse(JSON.stringify(DEFAULT_BRAINS[base]));
  for (const kv of (mods || "").split(",").filter(Boolean)) { const [k, v] = kv.split("="); const g = ["model", "plan5", "lead", "approach", "planner", "weights", "settings"].find((x) => B[x] && k in B[x]); if (!g) throw new Error(`${base} has no setting ${k}`); B[g][k] = +v; }
  const h = crypto.createHash("sha256");
  for (const rs of PRESETS) for (const size of [5, 7]) for (let g = 0; g < 2; g++) {
    const rnd = require(dir + "/tests/rng.js")(`brainhash:${id}:${rs.id}:${size}`, g);
    const line = size === 5 ? { HM: 2, HA: 1, LM: 1, LR: 1 } : { HM: 2, LM: 1, HR: 1, LR: 1, HA: 1, LA: 1 }, L = [];
    for (const c of Object.keys(rs.cards)) for (let i = 0; i < (line[c] || 0); i++) L.push({ id: i ? c + (i + 1) : c, card: c });
    if (!L.length) continue;
    const first = g % 2 ? "S" : "N"; let st;
    try { st = E.newMatch(rs, { first, lineups: { N: L, S: L } }); for (const t of [first, E.foeOf(first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) }); } catch (e) { h.update("setup-error"); continue; }
    let k = 0;
    while (st.phase === "play" && k++ < 4000) { const a = Bot.chooseAction(st, B, rnd).action; h.update(JSON.stringify(a)); if (!E.act(st, a, () => E.rollWith(st, rnd)).ok) E.act(st, { type: "end" }); }
    h.update(JSON.stringify(st.result));
  }
  console.log(spec.padEnd(10), h.digest("hex").slice(0, 16));
}
