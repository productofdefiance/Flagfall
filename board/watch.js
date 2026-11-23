/* Flagfall Arena — watch a Computer vs Computer match from its setup (Brief 008).
   One place that says how the board sets up and plays a bot-vs-bot match from a game seed, so a simulated game and the
   same game opened on the board are the same game. The simulators (sims/lab) play through playOut() below; the board
   opens a "?watch=" link with setupMatch() and then plays it with its own bot loop, which takes the same steps.
   No screen code here, and no rule: it only calls the engine, the bot and the brains. */
(function (root) {
  "use strict";
  const node = typeof module !== "undefined";
  const E = node ? require("./engine.js") : root.GGEngine;
  const Bot = node ? require("./bot.js") : root.GGBot;
  const D = node ? require("./data.js") : root.GGData;
  const BR = node ? require("./brain.js") : root.GGBrain;

  /** The board's formats (app.js uses this list). */
  const FORMATS = [
    { id: "blitz5", label: "5v5 Blitz", size: 5 },
    { id: "std7", label: "7v7", size: 7 },
    { id: "s9", label: "9v9", size: 9, soon: true },
    { id: "s13", label: "13v13", size: 13, soon: true }
  ];
  const formatOf = (id) => FORMATS.find((f) => f.id === id) || FORMATS[1];
  const noKeeper = (rs) => !!(rs.switches && rs.switches.noKeeper);
  /** The bot's lineup until Teams exist: one of each card, plus a Heavy Melee Flagkeeper. 5v5 uses the original five. */
  function balancedCounts(rs, size) {
    const want = size <= 5 ? ["HM", "HA", "LM", "LR"] : ["HM", "LM", "HR", "LR", "HA", "LA"];
    const have = want.filter((c) => rs.cards[c]);
    const slots = noKeeper(rs) ? size : size - 1;   // v3: no keeper slot; any unit may hold the flag
    const counts = {};
    for (const c of have.slice(0, slots)) counts[c] = (counts[c] || 0) + 1;
    let n = Object.values(counts).reduce((a, b) => a + b, 0);
    const filler = rs.cards.HM ? "HM" : Object.keys(rs.cards)[0];
    while (n < slots) { counts[filler] = (counts[filler] || 0) + 1; n++; }
    return { keeper: noKeeper(rs) ? null : (rs.cards.HM ? "HM" : Object.keys(rs.cards)[0]), counts };
  }
  /** Lineup in the engine's form: FK first, then each card; repeats get a number (HM, HM2). */
  function toLineup(rs, pick) {
    const out = pick.keeper && !noKeeper(rs) ? [{ id: "FK", card: pick.keeper, fk: true }] : [];
    for (const code of Object.keys(rs.cards)) {
      const n = pick.counts[code] || 0;
      for (let i = 0; i < n; i++) out.push({ id: i === 0 ? code : code + (i + 1), card: code });
    }
    return out;
  }
  /** Card counts for a bot side's mix, as the Teams screen picks them. Heavy and Light fill the slots in turn (HM, HA,
      HR or LM, LA, LR), so 7 gives 3-2-2. Open: the brain's own squad, or the balanced lineup. Random: drawn from the
      seed. Mixed (and anything else): the balanced lineup. */
  function mixCounts(rs, size, mix, seed, team, brain) {
    const noK = noKeeper(rs), slots = noK ? size : size - 1, keeper = noK ? null : (rs.cards.HM ? "HM" : Object.keys(rs.cards)[0]);
    const fill = (order) => { const have = order.filter((c) => rs.cards[c]); if (!have.length) return null; const counts = {}; for (let i = 0; i < slots; i++) counts[have[i % have.length]] = (counts[have[i % have.length]] || 0) + 1; return { keeper, counts }; };
    if (mix === "heavy") return fill(["HM", "HA", "HR"]) || balancedCounts(rs, size);
    if (mix === "light") return fill(["LM", "LA", "LR"]) || balancedCounts(rs, size);
    if (mix === "random") {
      const r = E.seededRandom((seed || "") + "#team" + team), cards = Object.keys(rs.cards), counts = {};
      for (let i = 0; i < slots; i++) { const c = cards[Math.floor(r() * cards.length)]; counts[c] = (counts[c] || 0) + 1; }
      return { keeper, counts };
    }
    if (mix === "open") { const sq = Bot.squadCounts && Bot.squadCounts(rs, size, brain); return sq ? { keeper: null, counts: sq } : balancedCounts(rs, size); }
    return balancedCounts(rs, size);
  }

  /** The board's random stream for a match: draw n is always the same number for the same seed (app.js rand()). */
  function matchRand(m) {
    return function rand() {
      if (!m || !m.opts.seed) return Math.random();
      const n = m.draws || 0; m.draws = n + 1;
      return E.seededRandom(m.opts.seed + "#" + n)();
    };
  }

  /** A brain as a watch link names it: an id, or id:key=value,... with settings changed (Brief 019: a sweep's games are
      replayable because the link carries the change). Returns { id, mods, brain } or throws in plain words. */
  const GROUPS = ["model", "plan5", "lead", "approach", "victory", "spend", "planner", "weights", "settings"];
  function brainFromSpec(spec) {
    const str = String(spec || ""), i = str.indexOf(":"), id = i < 0 ? str : str.slice(0, i), mods = i < 0 ? "" : str.slice(i + 1);
    if (!BR.DEFAULT_BRAINS[id]) throw new Error(`Brain ${id || "(none)"} is not on this board`);
    const b = E.clone(BR.DEFAULT_BRAINS[id]);
    for (const kv of mods.split(",").filter(Boolean)) {
      const [k0, v] = kv.split("="), fm = /^(\w+)\.(\d+)$/.exec(k0 || ""), k = fm ? fm[1] : k0;   // Brief 020: key.5=v is one format's own value
      const g = GROUPS.find((x) => b[x] && Object.prototype.hasOwnProperty.call(b[x], k));
      if (!g || v === undefined || v === "" || isNaN(+v)) throw new Error(`Brain ${id} has no setting ${k}`);
      if (fm) {
        if (!b.perFormat || !b.perFormat[fm[2]]) throw new Error(`Brain ${id} has no per-format settings for ${fm[2]}v${fm[2]}`);
        b.perFormat[fm[2]][k] = +v;
      } else b[g][k] = +v;
    }
    return { id, mods, brain: b };
  }
  const brainProblem = (spec) => { try { brainFromSpec(spec); return null; } catch (e) { return e.message; } };
  const rulesById = (id) => (D.PRESETS || []).concat([D.DEFAULT_RULESET]).find((p) => p && p.id === id) || null;
  /** What a watch link needs: { v, rules, format, n, s, mixN, mixS, first, seed }. Missing parts take the defaults. */
  function normalise(spec) {
    return {
      v: spec.v || null, rules: spec.rules, format: spec.format || "std7",
      n: spec.n, s: spec.s, mixN: spec.mixN || "open", mixS: spec.mixS || "open",
      first: spec.first || "coin", seed: String(spec.seed || "").toUpperCase()
    };
  }
  /** Why this board can't play a spec exactly, in plain words; null if it can. `version` is this board's game version. */
  function problem(spec, version) {
    const s = normalise(spec), out = [];
    if (!s.seed) out.push("The link has no game seed.");
    if (!rulesById(s.rules)) out.push(`Rule set ${s.rules || "(none)"} is not on this board.`);
    for (const [side, id] of [["North", s.n], ["South", s.s]]) {
      const base = String(id || "").split(":")[0];
      if (!BR.DEFAULT_BRAINS[base]) out.push(`${side}'s brain "${base || "(none)"}" is not on this board.`);
      else if (brainProblem(id)) out.push(`${side}'s brain: ${brainProblem(id)}.`);
    }
    if (!FORMATS.some((f) => f.id === s.format && !f.soon)) out.push(`Format ${s.format} is not playable on this board.`);
    return out.length ? out.join(" ") : null;
  }
  /** The match record the board makes for a Computer vs Computer match (app.js startMatch), before deployment: the same
      lineups, brains (the board's built-in copies, never a saved edit), seed and coin toss. */
  function setupMatch(spec, extra) {
    const s = normalise(spec), rs = rulesById(s.rules), fm = formatOf(s.format);
    if (!rs) throw new Error(`Rule set ${s.rules} is not on this board`);
    const players = {}, brains = {}, names = {}, lineups = {};
    for (const t of ["N", "S"]) {
      const b = brainFromSpec(t === "N" ? s.n : s.s).brain;   // the built-in brain, with the link's setting changes (Brief 019)
      players[t] = { type: "bot", brainId: b.id }; brains[t] = b; names[t] = t === "N" ? "North" : "South";
      lineups[t] = toLineup(rs, mixCounts(rs, fm.size, t === "N" ? s.mixN : s.mixS, s.seed, t, b));
    }
    const m = Object.assign({ id: "w" + s.seed, started: null, rs: E.clone(rs),
      opts: { first: "N", players, names, lineups, seed: s.seed, format: fm.id, coin: s.first === "coin" }, brains, actions: [], draws: 0, watch: s }, extra || {});
    m.opts.first = s.first === "coin" ? (matchRand(m)() < 0.5 ? "N" : "S") : s.first;
    return m;
  }
  /** Deploy every bot side, first mover first, as the board does (app.js beginDeploy). */
  function deployBots(m, st, rand) {
    for (const t of [st.first, E.foeOf(st.first)]) {
      if (st.deployed[t]) continue;
      const r = E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, m.brains[t], rand) });
      if (!r.ok) throw new Error(r.error);
    }
  }
  /** Play a whole match from a spec, exactly as the board would. `onStep(st, step, before)` is called around every
      action (for measures): before(st, chosen) runs before it is played. Returns { m, st }. */
  function playOut(spec, hooks) {
    hooks = hooks || {};
    const m = setupMatch(spec), rand = matchRand(m);
    if (hooks.brains) m.brains = hooks.brains;   // a simulator's changed brain (a sweep); the board can't replay those
    if (hooks.rs) m.rs = hooks.rs;   // a simulator's changed rule set (one switch off, Brief 015); the board can't replay those
    const st = E.newMatch(m.rs, m.opts);
    deployBots(m, st, rand);
    if (hooks.start) hooks.start(st, m);
    const counter = { key: "", count: 0 };
    let n = 0;
    while (st.phase === "play" && n++ < 20000) {
      const B = m.brains[st.toMove];
      let c;
      const t0 = Date.now();
      try { c = Bot.chooseAction(st, B, rand); } catch (e) { c = { action: { type: "end" }, reason: "Hit an error; ends its turn" }; }
      const ms = Date.now() - t0;
      const key = st.turn + st.toMove;
      counter.count = counter.key === key ? counter.count + 1 : 1; counter.key = key;
      if (counter.count > 40) c = { action: { type: "end" }, reason: "Safety stop; ends its turn" };
      if (hooks.before) hooks.before(st, c, ms);
      const r = E.act(st, c.action, () => E.rollWith(st, rand));
      if (hooks.after) hooks.after(st, c, r);
      if (!r.ok) { E.act(st, { type: "end" }); if (hooks.after) hooks.after(st, { action: { type: "end" }, refusedEnd: true }, { ok: true }); }
    }
    if (hooks.end) hooks.end(st, m);
    return { m, st };
  }
  /** A short fingerprint of every action in a match (its type, unit, target, hex and dice), for the board check. */
  function actionsHash(actions) {
    let h = 2166136261 >>> 0;
    const s = JSON.stringify(actions.map((a) => [a.type, a.uid || a.team || "", a.target || a.to || "", a.die || 0]));
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(16).padStart(8, "0") + ":" + actions.length;
  }

  /** The watch link's query: ?watch=<seed>&v=&rules=&format=&n=&s=&mixn=&mixs=&first= */
  function toQuery(spec) {
    const s = normalise(spec);
    const q = [["watch", s.seed], ["v", s.v], ["rules", s.rules], ["format", s.format], ["n", s.n], ["s", s.s], ["mixn", s.mixN], ["mixs", s.mixS], ["first", s.first]];
    return "?" + q.filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
  }
  function fromQuery(search) {
    const p = {}; String(search || "").replace(/^\?/, "").split("&").filter(Boolean).forEach((kv) => { const i = kv.indexOf("="); p[decodeURIComponent(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
    if (!p.watch) return null;
    return normalise({ seed: p.watch, v: p.v, rules: p.rules, format: p.format, n: p.n, s: p.s, mixN: p.mixn, mixS: p.mixs, first: p.first });
  }
  /** A board seed dealt from a simulator's random stream (tests/rng.js): the same form as the board's own seeds. */
  function seedFrom(rnd) {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let out = "";
    for (let i = 0; i < 12; i++) { out += abc[Math.floor(rnd() * abc.length)]; if (i === 3 || i === 7) out += "-"; }
    return out;
  }

  const api = { FORMATS, formatOf, balancedCounts, toLineup, mixCounts, matchRand, setupMatch, deployBots, playOut, actionsHash, toQuery, fromQuery, seedFrom, problem, rulesById, brainFromSpec };
  if (node) module.exports = api; else root.GGWatch = api;
})(this);
