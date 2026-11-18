/* Flagfall Arena — board app: screens, drawing, taps, data sheets and storage.
   Rules live in engine.js, numbers in the rule set (data.js / saved sets), looks in skin.js, the bot in bot.js + brain.js.
   Screens: Home → Settings → Lineup (one per human side) → Play. Data screens: Unit data, Rules, Opponent, Matches.
   Planned, not built: a Teams screen between Settings and Lineup (culture and era, bot skill and style). */
(function () {
  "use strict";
  const E = window.GGEngine, D = window.GGData, SK = window.GGSkin, Bot = window.GGBot, BR = window.GGBrain;
  const V = window.GGVersion || { build: null, preview: null };   // build number: board/version.js is the only source
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /** Engine text as the player reads it: units are counted in unit cap (UC), never "beings" (the engine's own words
      stay unchanged so saved matches replay identically). */
  const say = (t) => String(t).replace(/fewer beings lost/g, "less unit cap lost").replace(/beings lost/g, "unit cap lost");
  const sideName = (t) => (t === "N" ? "North" : "South");
  const fmt = E.fmt;
  const EPS = 1e-9;
  const LIGHT = { N: "#8fd0b4", S: "#f0a48f" };

  // ---------- Skin ----------
  (function applySkin() {
    const root = document.documentElement.style;
    for (const k in SK.colors) root.setProperty("--" + k, SK.colors[k]);
    root.setProperty("--display", SK.fonts.display);
    root.setProperty("--body", SK.fonts.body);
    root.setProperty("--mono", SK.fonts.mono);
  })();

  // ---------- Line icons (24×24, stroked) ----------
  const P = {
    attack: '<path d="M14.5 4.5 19.5 4l-.5 5L9 19l-4-4z"/><path d="M6.5 13.5l4 4"/><path d="M4 20l2.5-2.5"/>',
    reach: '<path d="M4 20 17 7"/><path d="M15 4.5 20 4l-.5 5-3.5-1z"/><path d="M6 15.5l2.5 2.5"/>',
    brace: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
    special: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
    undo: '<path d="M9 13.5 4.5 9 9 4.5"/><path d="M4.5 9H14a6 6 0 0 1 0 12h-3"/>',
    endunit: '<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3l2.6 2.6 5-5.6"/>',
    endturn: '<path d="M5.5 5v14l9.5-7z"/><path d="M18.5 5v14"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4h11l-2.5 4L17 12H6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    grid: '<path d="M7 4l-3 5 3 5h6l3-5-3-5z"/><path d="M13 14l3 5h4"/>',
    hourglass: '<path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3c0 4.5 8 5 8 9s-8 4.5-8 9"/><path d="M16 3c0 4.5-8 5-8 9s8 4.5 8 9"/>',
    hex: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z"/>',
    move: '<path d="M5 12h12"/><path d="M13 7l5 5-5 5"/>',
    zone: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z" stroke-dasharray="3 2.4"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/>',
    reload: '<path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19 4v4h-4"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9"/><path d="M14.5 9.5c-.5-1-1.4-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.1-.6-2.6-1.6"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    bot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4"/><circle cx="9.5" cy="13.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="13.5" r="1.2" fill="currentColor"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    table: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/><path d="M10 10v9"/>',
    fill: '<path d="M7 3.5 10.5 5.5v4L7 11.5 3.5 9.5v-4z"/><path d="M17 3.5 20.5 5.5v4L17 11.5 13.5 9.5v-4z"/><path d="M12 12.5 15.5 14.5v4L12 20.5 8.5 18.5v-4z" fill="currentColor"/>',
    list: '<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/>'
  };
  function ic(name, size, color, extra) {
    return `<svg width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="${color || "currentColor"}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ""}>${P[name]}</svg>`;
  }

  // ---------- Storage: the artifact's database, with this browser as a fallback ----------
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 3500);
  }
  const Store = {
    db: null, mode: "local", chains: {},
    async init() {
      try {
        if (window.claude && typeof window.claude.use === "function") {
          const db = await Promise.race([window.claude.use("db"), new Promise((r) => setTimeout(() => r(null), 10000))]);
          if (db) { this.db = db; this.mode = "db"; }
        }
      } catch (e) { this.db = null; }
    },
    local(key, val) {
      try {
        if (val === undefined) { const s = localStorage.getItem("gg." + key); return s ? JSON.parse(s) : null; }
        localStorage.setItem("gg." + key, JSON.stringify(val));
      } catch (e) { return null; }
    },
    write(path, data) {
      if (!this.db) return Promise.resolve();
      const prev = this.chains[path] || Promise.resolve();
      const next = prev.catch(() => {}).then(() => this.db.doc(path).set(data)).catch((e) => {
        toast(e && e.code === "quota_exceeded" ? "Storage is full; delete old matches." : "Could not save (" + ((e && e.code) || "error") + "). Your last action is kept on this device.");
        throw e;
      });
      this.chains[path] = next;
      return next;
    },
    async rulesets() {
      const out = {};
      if (this.db) {
        try { const q = await this.db.collection("rulesets").get(); q.docs.forEach((d) => { const v = d.data(); if (v && v.ruleset) out[d.id] = v.ruleset; }); } catch (e) { /* fall through */ }
      }
      const loc = this.local("rulesets") || {};
      for (const id in loc) if (!out[id]) out[id] = loc[id];
      return out;
    },
    saveRuleset(rs) {
      const loc = this.local("rulesets") || {}; loc[rs.id] = rs; this.local("rulesets", loc);
      return this.write("rulesets/" + rs.id, { name: rs.name, updated: new Date().toISOString(), ruleset: rs });
    },
    deleteRuleset(id) {
      const loc = this.local("rulesets") || {}; delete loc[id]; this.local("rulesets", loc);
      return this.db ? this.db.doc("rulesets/" + id).delete() : Promise.resolve();
    },
    async sets(coll) {
      const out = {};
      if (this.db) {
        try { const q = await this.db.collection(coll).get(); q.docs.forEach((d) => { const v = d.data(); if (v && v.item) out[d.id] = v.item; }); } catch (e) { /* fall through */ }
      }
      const loc = this.local(coll) || {};
      for (const id in loc) if (!out[id]) out[id] = loc[id];
      return out;
    },
    saveSet(coll, item) {
      const loc = this.local(coll) || {}; loc[item.id] = item; this.local(coll, loc);
      return this.write(coll + "/" + item.id, { name: item.name, updated: new Date().toISOString(), item });
    },
    deleteSet(coll, id) {
      const loc = this.local(coll) || {}; delete loc[id]; this.local(coll, loc);
      return this.db ? this.db.doc(coll + "/" + id).delete() : Promise.resolve();
    },
    async live() {
      let rec = null;
      if (this.db) { try { const d = await this.db.doc("live/current").get(); if (d.exists) rec = d.data().match; } catch (e) { /* ignore */ } }
      const loc = this.local("live");
      if (loc && (!rec || (loc.updated || "") > (rec.updated || ""))) rec = loc;
      // Records read from the board's database come back frozen; play needs its own editable copy.
      return rec ? JSON.parse(JSON.stringify(rec)) : rec;
    },
    saveLive(match) {
      match.updated = new Date().toISOString();
      this.local("live", match);
      return this.write("live/current", { match }).catch(() => {});
    },
    summary(match, st, how, winner) {
      return { id: match.id, started: match.started, finished: new Date().toISOString(), ruleset: match.rs.name, build: match.build || null, format: match.opts.format || null,
        names: match.opts.names, winner, how, turn: st.turn, seed: match.opts.seed || null,
        pull: { N: st.pole.S, S: st.pole.N }, lost: { N: E.beingsLost(st, "N"), S: E.beingsLost(st, "S") } };
    },
    saveFinished(match, st) {
      const s = this.summary(match, st, st.result.how, st.result.winner);
      const loc = this.local("matches") || {}; loc[match.id] = s; this.local("matches", loc);
      this.local("record." + match.id, match);   // the full match, for Copy on the Matches screen (Build 3 on)
      return this.write("matches/" + match.id, Object.assign({}, s, { match })).catch(() => {});
    },
    saveAbandoned(match, st) {
      const s = this.summary(match, st, "abandoned", null);
      const loc = this.local("matches") || {}; loc[match.id] = s; this.local("matches", loc);
      this.local("record." + match.id, match);
      return this.write("matches/" + match.id, Object.assign({}, s, { match })).catch(() => {});
    },
    /** The full saved match for a finished match, or null (device-only matches finished before Build 3 kept no moves). */
    async record(id) {
      if (this.db) { try { const d = await this.db.doc("matches/" + id).get(); if (d.exists && d.data().match) return JSON.parse(JSON.stringify(d.data().match)); } catch (e) { /* fall through */ } }
      return this.local("record." + id);
    },
    async matches() {
      let list = [];
      if (this.db) { try { const q = await this.db.collection("matches").get(); list = q.docs.map((d) => { const v = Object.assign({}, d.data()); delete v.match; return v; }); } catch (e) { /* ignore */ } }
      const loc = Object.values(this.local("matches") || {});
      for (const m of loc) if (!list.some((x) => x.id === m.id)) list.push(m);
      return list.sort((a, b) => (b.finished || "").localeCompare(a.finished || ""));
    }
  };

  // ---------- Formats ----------
  const FORMATS = [
    { id: "blitz5", label: "5v5 Blitz", size: 5 },
    { id: "std7", label: "7v7", size: 7 },
    { id: "s9", label: "9v9", size: 9, soon: true },
    { id: "s13", label: "13v13", size: 13, soon: true }
  ];
  const formatOf = (id) => FORMATS.find((f) => f.id === id) || FORMATS[1];
  /** The bot's lineup until Teams exist: one of each card, plus a Heavy Melee Flagkeeper. 5v5 uses the original five. */
  const noKeeper = (rs) => !!(rs.switches && rs.switches.noKeeper);
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
  const beingsOf = (rs, pick) => (noKeeper(rs) || !pick.keeper ? 0 : rs.cards[pick.keeper] ? rs.cards[pick.keeper].beings : 1) + Object.keys(pick.counts).reduce((s, c) => s + (pick.counts[c] || 0) * (rs.cards[c] ? rs.cards[c].beings : 1), 0);

  // ---------- App state ----------
  const App = {
    view: "home", rulesets: {}, editId: null, edit: null, dirty: false,
    match: null, st: null, live: null,
    brains: {}, brainId: null, brainEdit: null, brainDirty: false, bot: { timer: null, count: 0, turnKey: "" },
    setup: null, lineupSide: null, picks: {},
    ui: {}, matches: [], fresh: false
  };
  function resetUi() {
    App.ui = { sel: null, ghost: null, armed: null, sheet: null, confirmEnd: false, placements: {}, deploySel: null, cover: null, error: null, botReason: "", drag: null };
  }
  resetUi();

  function defaultSetup() {
    return { format: "std7", rulesetId: (D.PRESETS && D.PRESETS.length ? D.PRESETS[D.PRESETS.length - 1].id : D.DEFAULT_RULESET.id), first: "coin", seed: E.makeSeed(),
      players: { N: { type: "human", name: "North", mix: "open" }, S: { type: "bot", brainId: "batchC", name: "South", mix: "open" } } };
  }

  // ---------- Matches ----------
  const isBot = (t) => !!(App.match && App.match.opts.players && App.match.opts.players[t] && App.match.opts.players[t].type === "bot");
  const brainOf = (t) => (App.match && App.match.brains && App.match.brains[t]) || BR.DEFAULT_BRAINS.standard;
  const bothHuman = () => !isBot("N") && !isBot("S");
  /** A repeatable random number from the match seed: draw n always gives the same value, so a reloaded match carries on the same way. */
  function rand() {
    const m = App.match;
    if (!m || !m.opts.seed) return Math.random();
    const n = m.draws || 0; m.draws = n + 1;
    return E.seededRandom(m.opts.seed + "#" + n)();
  }
  const roll = () => E.rollWith(App.st, rand);
  function rebuild() {
    const m = App.match;
    const st = E.newMatch(m.rs, m.opts);
    for (const a of m.actions) {
      const r = E.act(st, a, () => a.die);
      if (!r.ok) { console.error("Replay failed at", a, r.error); break; }
    }
    App.st = st;
  }
  function deployTeam() {
    const st = App.st;
    if (!st || st.phase !== "deploy") return null;
    return [st.first, E.foeOf(st.first)].find((t) => !st.deployed[t]) || null;
  }
  function nextUnplaced(team) {
    const u = App.st.units.find((x) => x.team === team && !App.ui.placements[x.uid]);
    return u ? u.uid : null;
  }
  /** Bot sides deploy at once, hidden. A human side gets the bench; a cover goes up only when both sides are human. */
  function beginDeploy() {
    let t;
    while ((t = deployTeam()) && isBot(t)) {
      const r = E.act(App.st, { type: "deploy", team: t, placements: Bot.deploy(App.st, t, brainOf(t), rand) });
      if (!r.ok) { console.error(r.error); break; }
      App.match.actions = E.clone(App.st.actions);
    }
    if (t) {
      App.ui.placements = {}; App.ui.deploySel = nextUnplaced(t);
      App.ui.cover = bothHuman() ? { kind: "deploy", team: t } : null;
      App.ui.scrollTo = E.FLAG[t];
    } else {
      App.ui.cover = bothHuman() ? { kind: "start" } : null;
      App.ui.scrollTo = "E10";
    }
  }
  function startMatch() {
    const s = App.setup, rs = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET, fm = formatOf(s.format);
    const players = {}, brains = {}, names = {}, lineups = {};
    for (const t of ["N", "S"]) {
      const p = s.players[t];
      if (p.type === "bot") {
        const b = App.brains[p.brainId] || BR.DEFAULT_BRAINS.standard;
        players[t] = { type: "bot", brainId: b.id }; brains[t] = E.clone(b); names[t] = p.name && p.name !== sideName(t) ? p.name : sideName(t);
        lineups[t] = toLineup(rs, mixPick(rs, fm.size, p.mix || "open", t, p));   // Teams screen: Heavy, Light, Mixed, Open (the kit's squad) or Random
      } else {
        players[t] = { type: "human" }; names[t] = (p.name || "").trim() || sideName(t);
        lineups[t] = toLineup(rs, App.picks[t]);
      }
    }
    App.match = { id: "m" + Date.now().toString(36), started: new Date().toISOString(), build: V.build, rs: E.clone(rs),
      opts: { first: "N", players, names, lineups, seed: s.seed, format: fm.id, coin: s.first === "coin" }, brains, actions: [], draws: 0 };
    App.match.opts.first = s.first === "coin" ? (rand() < 0.5 ? "N" : "S") : s.first;
    rebuild();
    resetUi();
    beginDeploy();
    Store.saveLive(App.match);
    App.live = App.match;
    if (App.match.opts.coin) toast(`Coin toss: ${sideName(App.st.first)} moves first.`);
    show("play");
  }

  // ---------- Bot turns ----------
  function botTick() {
    const st = App.st;
    if (App.view !== "play" || !st || st.phase !== "play" || !isBot(st.toMove) || App.bot.timer || App.ui.cover) return;
    const B = brainOf(st.toMove);
    App.bot.timer = setTimeout(() => {
      App.bot.timer = null;
      if (App.view !== "play" || App.st !== st || st.phase !== "play" || !isBot(st.toMove)) return;
      let c;
      try { c = Bot.chooseAction(st, B, rand); } catch (e) { console.error(e); c = { action: { type: "end" }, reason: "Hit an error; ends its turn" }; }
      const key = st.turn + st.toMove;
      App.bot.count = App.bot.turnKey === key ? App.bot.count + 1 : 1; App.bot.turnKey = key;
      if (App.bot.count > 40) c = { action: { type: "end" }, reason: "Safety stop; ends its turn" };
      App.ui.botReason = c.reason;
      const idx = st.actions.length, team = st.toMove, turn = st.turn;
      const r = act(c.action);
      if (r.ok && c.action.type !== "end") {
        (App.match.botMoves = App.match.botMoves || []).push({ i: idx, team, turn, reason: c.reason });
        const u = c.action.uid && E.unitByUid(App.st, c.action.uid);
        if (u && u.hp > 0) revealHex(u.hex);
        Store.saveLive(App.match);
      }
      if (!r.ok) act({ type: "end" });
    }, Math.max(0, +B.settings.pauseMs || 0));
  }
  function act(action) {
    const st = App.st, ui = App.ui;
    const before = st.actions.length;
    const r = E.act(st, action, roll);
    if (!r.ok) { toast(r.error); render(); return r; }
    App.match.actions = E.clone(st.actions);
    ui.confirmEnd = false; ui.ghost = null; ui.armed = null; ui.sheet = null;
    if (r.die) toast(`${st.rs.switches && st.rs.switches.dice2d6 ? "Dice" : "Die"} ${r.die} → ${fmt(r.dmg)} ${action.type === "pull" ? "pulled" : "damage"}`);
    const u = action.uid && E.unitByUid(st, action.uid);
    if (!u || u.hp <= 0 || u.done || action.type === "end") ui.sel = null;
    if (action.type === "end" && st.phase === "play" && !isBot(st.toMove)) ui.botReason = "";
    Store.saveLive(App.match);
    if (st.result && before < st.actions.length) { ui.sheet = { kind: "over" }; Store.saveFinished(App.match, st).then(loadMatches); }
    render();
    return r;
  }
  function canUndo() {
    const a = App.match && App.match.actions[App.match.actions.length - 1];
    return !!(a && App.st.phase === "play" && !isBot(App.st.toMove) && ["move", "swap", "brace", "done"].includes(a.type));
  }
  function undo() {
    if (!canUndo()) return;
    App.match.actions.pop();
    rebuild();
    Object.assign(App.ui, { sel: null, ghost: null, armed: null, sheet: null, confirmEnd: false });
    Store.saveLive(App.match);
    render();
  }

  // ---------- Unit-type icons (shapes from the skin) ----------
  const iconKey = (rs, code) => { const c = rs.cards[code] || {}; return c.icon || D.DEFAULT_ICON_BY_CODE[code] || "heavyMelee"; };
  function iconShape(key, x, y, s, color, sw) {
    const k = (SK.icons && SK.icons[key]) || { shape: "square", filled: true };
    const paint = k.filled ? `fill="${color}" stroke="${color}" stroke-width="1"` : `fill="none" stroke="${color}" stroke-width="${sw || 2}"`;
    const f = (n) => n.toFixed(1);
    let out;
    if (k.shape === "square") out = `<rect x="${f(x - s)}" y="${f(y - s)}" width="${f(2 * s)}" height="${f(2 * s)}" ${paint}/>`;
    else if (k.shape === "triangle") out = `<polygon points="${f(x)},${f(y - s * 1.15)} ${f(x + s * 1.15)},${f(y + s * 0.85)} ${f(x - s * 1.15)},${f(y + s * 0.85)}" ${paint} stroke-linejoin="round"/>`;
    else if (k.shape === "diamond") out = `<polygon points="${f(x)},${f(y - s * 1.3)} ${f(x + s)},${f(y)} ${f(x)},${f(y + s * 1.3)} ${f(x - s)},${f(y)}" ${paint} stroke-linejoin="round"/>`;
    else out = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" ${paint}/>`;
    if (k.dot) out += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * 0.35)}" fill="${color}"/>`;
    return out;
  }
  const iconInline = (key, color, size) => `<svg width="${size || 18}" height="${size || 18}" viewBox="0 0 20 20" aria-hidden="true" style="flex-shrink:0">${iconShape(key, 10, 10.5, 6.5, color || "currentColor", 2)}</svg>`;
  /** A round team token with the white unit icon, as on the field. */
  const tokenInline = (key, team, size, fk) => `<svg width="${size || 26}" height="${size || 26}" viewBox="0 0 20 20" aria-hidden="true" style="flex-shrink:0"><circle cx="10" cy="10" r="${fk ? 8.6 : 9.5}" fill="var(--${team === "N" ? "north" : "south"})" ${fk ? 'stroke="var(--keeper)" stroke-width="1.8"' : ""}/>${iconShape(key, 10, 10, 3.6, "#fff", 1.4)}</svg>`;
  const teamColor = (t) => `var(--${t === "N" ? "north" : "south"})`;
  const statLine = (c) => `HP ${c.hp} · Str ${c.str} · Armor ${c.armor} · Range ${c.range} · Move ${c.cap}`;

  // ---------- Navigation ----------
  const VIEWS = ["home", "setup", "teams", "lineup", "play", "units", "rules", "opponent", "match"];
  function show(v) {
    App.view = v;
    VIEWS.forEach((x) => ($("view-" + x).hidden = x !== v));
    if (v !== "play" && App.bot.timer) { clearTimeout(App.bot.timer); App.bot.timer = null; }
    if (v === "home") renderHome();
    else if (v === "setup") renderSetup();
    else if (v === "teams") renderTeams();
    else if (v === "lineup") renderLineup();
    else if (v === "units") renderUnits();
    else if (v === "rules") renderRules();
    else if (v === "opponent") renderOpponent();
    else if (v === "match") renderMatchView();
    else if (v === "play") render();
    if (v !== "play") { const sc = $("view-" + v).querySelector(".scroll"); if (sc) sc.scrollTop = 0; }
  }
  const backbar = (title, target) => `<div class="backbar"><button type="button" class="iconbtn" data-act="go" data-to="${target || "home"}" aria-label="Back">${ic("back", 20)}</button><h2>${esc(title)}</h2></div>`;

  // ---------- Dialog ----------
  function dialog(html) {
    return new Promise((resolve) => {
      const d = $("dialog"), box = $("dialogbox");
      box.innerHTML = html; d.hidden = false;
      const done = (v) => { d.hidden = true; d.onclick = null; resolve(v); };
      d.onclick = (e) => { const b = e.target.closest("[data-dlg]"); if (b) done(b.dataset.dlg); else if (e.target === d) done(null); };
      const first = box.querySelector("[data-dlg]"); if (first) first.focus();
    });
  }
  const confirmBox = (title, body, ok, okClass) => dialog(`<h2>${esc(title)}</h2>${body ? `<p class="note">${esc(body)}</p>` : ""}<button class="btn ${okClass || "primary"}" data-dlg="ok">${esc(ok)}</button><button class="btn" data-dlg="cancel">Cancel</button>`).then((v) => v === "ok");

  // ---------- Home ----------
  function liveSummary() {
    const m = App.live;
    if (!m || !m.rs || !Array.isArray(m.actions)) return null;
    const st = E.newMatch(m.rs, m.opts);
    for (const a of m.actions) { const r = E.act(st, a, () => a.die); if (!r.ok) break; }
    if (st.phase === "over") return null;
    const opp = ["N", "S"].map((t) => (m.opts.players && m.opts.players[t] && m.opts.players[t].type === "bot" ? "Bot" : esc(m.opts.names[t]))).join(" vs ");
    const where = st.phase === "deploy" ? "Deploying" : `Turn ${st.turn} · ${sideName(st.toMove)} to move`;
    return `${where} · ${opp}`;
  }
  /** "Playtest board · Build 3 · Rules v3.2"; a preview copy also says which pull request it is. */
  function homeLine() {
    const newest = D.PRESETS && D.PRESETS.length ? D.PRESETS[D.PRESETS.length - 1].id : D.DEFAULT_RULESET.id;
    return ["Playtest board", V.build ? `Build ${V.build}` : null, V.preview ? `Preview of ${V.preview}` : null, `Rules ${newest}`].filter(Boolean).join(" · ");
  }
  /** " · Build 3", plus the build a match was started on when that differs (never guessed for older matches). */
  function buildNote(m) {
    if (!V.build) return "";
    return ` · Build ${V.build}` + (m && m.build && m.build !== V.build ? ` (started on Build ${m.build})` : "");
  }
  function renderHome() {
    const cont = liveSummary();
    const item = (act, icon, t, s, primary) => `<button type="button" class="menuitem${primary ? " primary" : ""}" data-act="${act}">${ic(icon, 24)}<span><span class="mt">${t}</span>${s ? `<span class="ms">${s}</span>` : ""}</span></button>`;
    $("view-home").innerHTML = `<div class="scroll"><div class="wrap" style="padding-top:36px">
      <div><h1 class="title">Flagfall<br>Arena</h1><p class="note" style="margin-top:8px">${esc(homeLine())}</p></div>
      ${cont ? item("continue", "play", "Continue match", cont, true) : ""}
      ${item("new", "plus", "New game", "Format, sides, lineups", !cont)}
      ${item("go-units", "table", "Unit data and rules", "Every number the rules use, editable")}
      ${item("go-opponent", "bot", "Opponent", "How the bot weighs its moves")}
      ${item("go-match", "list", "Matches", "Current match record, past results")}
      <p class="note">Storage: ${Store.mode === "db" ? "saved with the board, so it follows you between devices and Claude can read it." : "this device only."}</p>
    </div></div>`;
  }

  // ---------- Settings ----------
  const steps = (n) => `<div class="steps" aria-label="Step ${n} of 3">${["Settings", "Teams", "Lineup"].map((x, i) => `<span class="step ${n === i + 1 ? "on" : n > i + 1 ? "done" : ""}"><i>${i + 1}</i>${x}</span>`).join("")}</div>`;
  const seg = (name, items, val) => `<div class="seg" role="group">${items.map(([v, label, dis]) => `<button type="button" data-seg="${name}" data-val="${v}" aria-pressed="${v === val}" ${dis ? "disabled" : ""}>${label}</button>`).join("")}</div>`;
  function renderSetup() {
    const s = App.setup;
    const rsOpts = Object.values(App.rulesets).sort((a, b) => a.name.localeCompare(b.name)).map((r) => `<option value="${esc(r.id)}" ${r.id === s.rulesetId ? "selected" : ""}>${esc(r.name)}</option>`).join("");
    const brainOpts = (sel) => Object.values(App.brains).sort((a, b) => a.name.localeCompare(b.name)).map((b) => `<option value="${esc(b.id)}" ${b.id === sel ? "selected" : ""}>${esc(b.name)}</option>`).join("");
    const side = (t) => {
      const p = s.players[t], col = teamColor(t);
      return `<div class="side" style="border-color:${col}"><span class="nm" style="color:${col}">${sideName(t).toUpperCase()}</span>
        ${seg("player-" + t, [["human", ic("person", 16) + "Human"], ["bot", ic("bot", 16) + "Bot"]], p.type)}
        ${p.type === "human" ? `<input class="inp" data-setup="name-${t}" value="${esc(p.name || sideName(t))}" aria-label="${sideName(t)} name" maxlength="16">`
          : `<div class="inp" style="display:flex;align-items:center;background:var(--card);color:var(--muted)">Kit and mix on the next screen</div>`}</div>`;
    };
    $("view-setup").innerHTML = `<div class="scroll" style="display:flex;flex-direction:column"><div class="wrap" style="flex:1">
      ${backbar("New game")}${steps(1)}
      <div class="field"><span class="lab">Format</span>${seg("format", FORMATS.map((f) => [f.id, f.label, f.soon]), s.format)}<span class="hint">9v9 and 13v13 come later.</span></div>
      <div class="field"><span class="lab">Field</span><div class="inp" style="display:flex;align-items:center;background:var(--card)">Standard oval · 9 × 19</div></div>
      <div class="field"><label for="setup-rs">Rule set</label><select class="inp" id="setup-rs" data-setup="rs">${rsOpts}</select><span class="hint">${(() => { const r0 = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET; return `${E.turnLimitFor(r0, formatOf(s.format).size)} turns per player at ${esc(formatOf(s.format).label)}`; })()}</span></div>
      <div class="field"><span class="lab">Sides</span><div class="sides">${side("N")}${side("S")}</div></div>
      <div class="field"><span class="lab">Moves first</span>${seg("first", [["N", "North"], ["S", "South"], ["coin", ic("coin", 16) + "Coin"]], s.first)}</div>
      <div class="field"><label for="setup-seed">Game seed</label><div class="row" style="flex-wrap:nowrap">
        <input class="inp mono" id="setup-seed" data-setup="seed" value="${esc(s.seed)}" spellcheck="false" autocomplete="off">
        <button type="button" class="iconbtn" data-act="seed-copy" aria-label="Copy seed">${ic("copy", 20)}</button>
        <button type="button" class="iconbtn" data-act="seed-new" aria-label="New seed">${ic("dice", 20)}</button></div>
        <span class="hint">The same seed gives the same dice, coin toss and bot choices.</span></div>
    </div><div class="footer"><button class="btn" data-act="go" data-to="home" style="flex:1">Back</button><button class="btn primary" data-act="setup-next" style="flex:2">Next: Teams</button></div></div>`;
  }
  function onSetupInput(e) {
    const t = e.target, s = App.setup, k = t.dataset.setup;
    if (!k) return;
    if (k === "rs") s.rulesetId = t.value;
    else if (k === "seed") s.seed = t.value.trim().toUpperCase();
    else if (k.startsWith("name-")) s.players[k.slice(5)].name = t.value;
    else if (k.startsWith("brain-")) s.players[k.slice(6)].brainId = t.value;
    Store.local("setup", s);
  }
  function onSeg(name, val) {
    const s = App.setup;
    if (name === "format") s.format = val;
    else if (name === "first") s.first = val;
    else if (name.startsWith("player-")) {
      const t = name.slice(7), p = s.players[t];
      p.type = val; if (val === "bot" && !App.brains[p.brainId]) p.brainId = "batchC";
    } else if (name === "keeper") { App.picks[App.lineupSide].keeper = val; renderLineup(); return; }
    else if (name.startsWith("mix-")) { s.players[name.slice(4)].mix = val; Store.local("setup", s); renderTeams(); return; }
    Store.local("setup", s);
    renderSetup();
  }
  function setupNext() {
    const s = App.setup;
    if (!s.seed) s.seed = E.makeSeed();
    for (const t of ["N", "S"]) if (!s.players[t].mix) s.players[t].mix = "open";
    if (s.players.N.type === "bot" && !App.brains[s.players.N.brainId]) s.players.N.brainId = "batchC";
    if (s.players.S.type === "bot" && !App.brains[s.players.S.brainId]) s.players.S.brainId = "batchC";
    show("teams");
  }

  // ---------- Teams (test version: mix only; era and culture come later) ----------
  const MIXES = [["heavy", "Heavy"], ["light", "Light"], ["mixed", "Mixed"], ["open", "Open"], ["random", "Random"]];
  const PERSONALITY = ["Aggression", "Speed vs Strength", "Close vs Far", "Flag vs Fight", "Together vs Spread"];
  /** Card counts for a mix. Heavy and Light fill the slots in turn (HM, HA, HR or LM, LA, LR), so 7 gives 3-2-2.
      Open: a bot fields its kit's own squad (or the balanced lineup); a human keeps its last lineup. Random draws from the seed. */
  function mixPick(rs, size, mix, t, p) {
    const noK = noKeeper(rs), slots = noK ? size : size - 1, keeper = noK ? null : (rs.cards.HM ? "HM" : Object.keys(rs.cards)[0]);
    const fill = (order) => { const have = order.filter((c) => rs.cards[c]); if (!have.length) return null; const counts = {}; for (let i = 0; i < slots; i++) counts[have[i % have.length]] = (counts[have[i % have.length]] || 0) + 1; return { keeper, counts }; };
    if (mix === "heavy") return fill(["HM", "HA", "HR"]) || balancedCounts(rs, size);
    if (mix === "light") return fill(["LM", "LA", "LR"]) || balancedCounts(rs, size);
    if (mix === "random") {
      const r = E.seededRandom((App.setup.seed || "") + "#team" + t), cards = Object.keys(rs.cards), counts = {};
      for (let i = 0; i < slots; i++) { const c = cards[Math.floor(r() * cards.length)]; counts[c] = (counts[c] || 0) + 1; }
      return { keeper, counts };
    }
    if (mix === "open") {
      if (p.type === "bot") { const sq = Bot.squadCounts && Bot.squadCounts(rs, size, App.brains[p.brainId]); return sq ? { keeper: null, counts: sq } : balancedCounts(rs, size); }
      const prev = (Store.local("picks") || {})[App.setup.format + ":" + t];
      return prev && (noK ? !prev.keeper : rs.cards[prev.keeper]) && beingsOf(rs, prev) === size && Object.keys(prev.counts).every((c) => rs.cards[c]) ? E.clone(prev) : balancedCounts(rs, size);
    }
    return balancedCounts(rs, size);
  }
  const countsText = (pick) => Object.keys(pick.counts).filter((c) => pick.counts[c]).map((c) => `${pick.counts[c]} ${c}`).join(" · ");
  function renderTeams() {
    const s = App.setup, rs = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET, size = formatOf(s.format).size;
    const brainOpts = (sel) => Object.values(App.brains).sort((a, b) => a.name.localeCompare(b.name)).map((b) => `<option value="${esc(b.id)}" ${b.id === sel ? "selected" : ""}>${esc(b.name)}</option>`).join("");
    const side = (t) => {
      const p = s.players[t], col = teamColor(t), mix = p.mix || "open";
      let hint;
      if (mix === "random") hint = "Drawn when the match starts.";
      else if (mix === "open" && p.type === "human") hint = "Your own pick on the next screen.";
      else hint = countsText(mixPick(rs, size, mix, t, p)) + (mix === "open" ? " (the kit's choice)" : "");
      return `<div class="side" style="border-color:${col}"><span class="nm" style="color:${col}">${p.type === "bot" ? "BOT" : (p.name && p.name !== sideName(t) ? esc(p.name).toUpperCase() : "HUMAN")} · ${sideName(t).toUpperCase()}</span>
        <span class="hint">Era and culture come later. Test units for now.</span>
        <span class="lab">Mix</span>${seg("mix-" + t, MIXES, mix).replace('class="seg"', 'class="seg wrap"')}<span class="hint">${hint}${p.type === "human" && mix !== "open" ? " You can adjust it on the next screen." : ""}</span>
        ${p.type === "bot" ? `<label class="lab" for="kit-${t}">Kit</label><select class="inp" id="kit-${t}" data-setup="brain-${t}">${brainOpts(p.brainId)}</select>
        <span class="lab">Personality</span>${PERSONALITY.map((n) => `<label class="hint" style="display:flex;align-items:center;gap:8px;justify-content:space-between">${n}<input type="range" min="1" max="5" value="3" disabled style="width:50%"></label>`).join("")}
        <span class="hint">Personality sliders are not built yet; the middle notch is the kit as it is.</span>` : ""}</div>`;
    };
    const humans = ["N", "S"].filter((t) => s.players[t].type === "human");
    $("view-teams").innerHTML = `<div class="scroll" style="display:flex;flex-direction:column"><div class="wrap" style="flex:1">
      ${backbar("Teams", "setup")}${steps(2)}
      <div class="field"><div class="sides stack">${side("N")}${side("S")}</div></div>
    </div><div class="footer"><button class="btn" data-act="go" data-to="setup" style="flex:1">Back</button><button class="btn primary" data-act="teams-next" style="flex:2">${humans.length ? "Next: Lineup" : "Start match"}</button></div></div>`;
  }
  function teamsNext() {
    const s = App.setup;
    const rs = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET, size = formatOf(s.format).size;
    App.picks = {};
    for (const t of ["N", "S"]) {
      if (s.players[t].type !== "human") continue;
      App.picks[t] = mixPick(rs, size, s.players[t].mix || "open", t, s.players[t]);
    }
    const humans = ["N", "S"].filter((t) => s.players[t].type === "human");
    if (!humans.length) { startMatch(); return; }
    App.lineupQueue = humans;
    openLineup(humans[0]);
  }
  function openLineup(t) {
    App.lineupSide = t;
    show("lineup");
    if (App.lineupQueue.length > 1) {
      showCover(`<h2>${sideName(t)} lineup</h2><p>${sideName(E.foeOf(t))}, look away. ${sideName(t)} picks its units without the other side seeing.</p><button class="btn" data-act="cover-ok">I'm ${sideName(t)}</button>`);
    }
  }

  // ---------- Lineup ----------
  function renderLineup() {
    const s = App.setup, t = App.lineupSide, rs = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET, size = formatOf(s.format).size;
    const pick = App.picks[t], col = teamColor(t), used = beingsOf(rs, pick);
    const kc = pick.keeper ? rs.cards[pick.keeper] : null;
    const cards = Object.keys(rs.cards);
    const pips = Array.from({ length: size }, (_, i) => `<span class="${i < used ? "on" : ""}" style="${i < used ? `background:${col}` : ""}"></span>`).join("");
    const rows = cards.map((code) => {
      const c = rs.cards[code], n = pick.counts[code] || 0;
      return `<div class="urow ${n ? "on" : ""}" style="${n ? `border-color:${col}` : ""}">${tokenInline(iconKey(rs, code), t, 30)}
        <div style="flex:1;min-width:0"><div class="nm">${esc(c.name)}</div><div class="st">${statLine(c)}</div></div>
        <button type="button" class="step-btn" data-act="pick-minus" data-card="${code}" aria-label="One fewer ${esc(c.name)}" ${n ? "" : "disabled"}>−</button>
        <span class="cnt" aria-label="${n} ${esc(c.name)}">${n}</span>
        <button type="button" class="step-btn" data-act="pick-plus" data-card="${code}" aria-label="One more ${esc(c.name)}" ${used + c.beings <= size ? "" : "disabled"}>+</button></div>`;
    }).join("");
    const last = App.lineupQueue[App.lineupQueue.length - 1] === t;
    $("view-lineup").innerHTML = `<div class="scroll" style="display:flex;flex-direction:column"><div class="wrap" style="flex:1">
      ${backbar(sideName(t) + " lineup", "teams")}${steps(3)}
      <div class="counter"><div class="row" style="justify-content:space-between"><span class="lab" style="font:600 13px/1 var(--body)">Unit cap (UC)</span><span class="num" style="font:600 15px/1 var(--mono)">${used}/${size}</span></div><div class="pips">${pips}</div></div>
      ${kc ? `<div class="field"><label for="keeper-pick">Flagkeeper</label>
        <div class="keeper">${tokenInline(iconKey(rs, pick.keeper), t, 34, true)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          <select class="inp" id="keeper-pick" data-keeper="1" style="height:40px;font-weight:600">${cards.map((c) => `<option value="${c}" ${c === pick.keeper ? "selected" : ""}>${esc(rs.cards[c].name)}</option>`).join("")}</select>
          <span class="hint">${statLine(kc)}. Moves ${E.capOf({ rs }, { card: pick.keeper, fk: true })} as keeper.</span></div></div></div>` : ""}
      <div class="field"><span class="lab">Units</span><span class="hint">${kc ? `Pick ${size - 1} more.` : `Pick ${size}. Any unit can hold the flag: place it on the flag hex when you deploy.`} Repeats are allowed.</span>${rows}</div>
    </div><div class="footer"><button class="btn" data-act="go" data-to="teams" style="flex:1">Back</button>
      <button class="btn primary" data-act="lineup-next" style="flex:2" ${used === size ? "" : "disabled"}>${last ? "Start match" : "Next: " + sideName(E.foeOf(t)) + " lineup"}</button></div></div>`;
  }
  function lineupNext() {
    const s = App.setup, t = App.lineupSide;
    const saved = Store.local("picks") || {}; saved[s.format + ":" + t] = App.picks[t]; Store.local("picks", saved);
    const i = App.lineupQueue.indexOf(t);
    if (i < App.lineupQueue.length - 1) openLineup(App.lineupQueue[i + 1]);
    else startMatch();
  }

  // ---------- Board geometry ----------
  const R = SK.board.hexRadius, H = Math.sqrt(3) * R, PAD = SK.board.pad;
  const W = 14 * R + 2 * PAD, HH = 19 * H + 2 * PAD;
  function pos(h) {
    const [q, r] = E.parse(h); const [gx, gy] = E.geo(q, r);
    return [PAD + R + 1.5 * R * gx, PAD + H / 2 + H * (gy - 1)];
  }
  const hexPts = (x, y, r) => [0, 1, 2, 3, 4, 5].map((i) => { const a = (Math.PI / 3) * i; return (x + r * Math.cos(a)).toFixed(1) + "," + (y + r * Math.sin(a)).toFixed(1); }).join(" ");
  const tr = R * 0.62;

  /** What the selected unit can do, or null when it isn't the human side's own unit on its turn. */
  function selOptions() {
    const st = App.st, sel = App.ui.sel && E.unitByUid(st, App.ui.sel);
    if (!sel || st.phase !== "play" || sel.team !== st.toMove || isBot(st.toMove) || sel.hp <= 0) return null;
    return E.options(st, sel.uid);
  }
  const isReachShot = (st, u, t) => E.card(st, u).trait === "reach" && E.card(st, u).range === 1 && E.dist(u.hex, t.hex) === 2;
  function targetsFor(o, kind) {
    const st = App.st, u = E.unitByUid(st, App.ui.sel);
    return o.attacks.filter((a) => { const r = isReachShot(st, u, E.unitByUid(st, a.target)); return kind === "reach" ? r : kind === "attack" ? !r : true; });
  }

  // ---------- Drawing: field ----------
  function renderBoard() {
    const st = App.st, ui = App.ui, svg = $("board");
    svg.setAttribute("viewBox", `0 0 ${W.toFixed(0)} ${HH.toFixed(0)}`);
    const g = st.rs.game;
    const arcs = { N: new Set(E.deployZone(st, "N")), S: new Set(E.deployZone(st, "S")) };
    const dTeam = deployTeam();
    const sel = ui.sel && E.unitByUid(st, ui.sel);
    const opts = selOptions();
    const zones = st.phase !== "deploy" ? E.zones(st) : null;
    const names = !!ui.names;
    let out = "";
    for (const h of E.CELLS) {
      const [x, y] = pos(h);
      let fill = "var(--hex)";
      if (arcs.N.has(h)) fill = "var(--northArc)";
      if (arcs.S.has(h)) fill = "var(--southArc)";
      if (E.GOAL.N.has(h)) fill = "var(--northGoal)";
      if (E.GOAL.S.has(h)) fill = "var(--southGoal)";
      const isFlag = h === E.FLAG.N || h === E.FLAG.S;
      if (isFlag) fill = "var(--flag)";
      out += `<g class="cell" data-hex="${h}"><polygon points="${hexPts(x, y, R)}" fill="${fill}" stroke="var(--line)" stroke-width="0.8"/>`;
      if (names && !isFlag) out += `<text x="${x}" y="${y - H * 0.3}" text-anchor="middle" font-size="8" fill="var(--muted)" font-family="var(--mono)" pointer-events="none">${h}</text>`;
      if (isFlag) {
        const team = h === E.FLAG.N ? "N" : "S";
        const held = E.holderOf && st.phase !== "deploy" ? E.holderOf(st, team) : null;
        if (held) out += `<text x="${x}" y="${(y - R * 0.6).toFixed(1)}" text-anchor="middle" font-size="${(R * 0.32).toFixed(0)}" font-weight="700" fill="#fff" font-family="var(--mono)" pointer-events="none">${fmt(E.flagShown(st, team))}+${fmt(E.hpShown(st, held))}</text>`;
        else out += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="${(R * 0.5).toFixed(0)}" font-weight="700" fill="#fff" font-family="var(--mono)" pointer-events="none">${fmt(g.poleHP - st.pole[team])}</text>`;
      }
      out += `</g>`;
    }
    if (dTeam) for (const h of arcs[dTeam]) { const [x, y] = pos(h); out += `<polygon points="${hexPts(x, y, R - 2.5)}" fill="none" stroke="${teamColor(dTeam)}" stroke-width="1.4" stroke-opacity="0.7" pointer-events="none"/>`; }
    if (zones) for (const team of ["N", "S"]) for (const h of zones[team]) {
      const [x, y] = pos(h);
      out += `<polygon points="${hexPts(x, y, R * (team === "N" ? 0.86 : 0.76))}" fill="none" stroke="${teamColor(team)}" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="3 3" pointer-events="none"/>`;
    }
    if (opts && !ui.armed) {
      for (const h in opts.moves) { const [x, y] = pos(h); out += `<g class="cell" data-hex="${h}"><polygon points="${hexPts(x, y, R - 2)}" fill="var(--move)" fill-opacity="0.16" stroke="none"/></g>`; }
      if (ui.ghost && opts.moves[ui.ghost]) { const [x, y] = pos(ui.ghost); out += `<g class="cell" data-hex="${ui.ghost}"><polygon points="${hexPts(x, y, R - 1.5)}" fill="var(--move)" fill-opacity="0.3" stroke="var(--move)" stroke-width="3"/></g>`; }
    }
    if (opts && opts.pull && !ui.armed) {
      const [x, y] = pos(E.FLAG[E.foeOf(sel.team)]);
      out += `<polygon points="${hexPts(x, y, R - 1)}" fill="none" stroke="var(--attack)" stroke-width="${ui.sheet && ui.sheet.kind === "pull" ? 4 : 2.6}" pointer-events="none"/>`;
    }
    // units
    const shown = st.phase === "deploy"
      ? st.units.filter((u) => u.team === dTeam).map((u) => Object.assign({}, u, { hex: ui.placements[u.uid] })).filter((u) => u.hex)
      : E.alive(st);
    for (const u of shown) {
      const [x, y] = pos(u.hex);
      const s = E.status(st, u), team = u.team === "N" ? "north" : "south";
      const isSel = ui.sel === u.uid || ui.deploySel === u.uid;
      out += `<g class="cell unit" data-hex="${u.hex}" data-uid="${u.uid}" opacity="${s.done ? 0.5 : 1}">`;
      if (isSel) out += `<circle cx="${x}" cy="${y}" r="${tr + 6}" fill="none" stroke="var(--move)" stroke-width="2.5"/>`;
      if (s.braced) out += `<circle cx="${x}" cy="${y}" r="${tr + 3.5}" fill="none" stroke="var(--brace)" stroke-width="3"/>`;
      out += `<circle cx="${x}" cy="${y}" r="${tr}" fill="var(--${team})" stroke="${u.fk ? "var(--keeper)" : `var(--${team}Dark)`}" stroke-width="${u.fk ? 3 : 1.2}"/>`;
      out += iconShape(iconKey(st.rs, u.card), x, y - 3.5, tr * 0.33, "#fff", 1.6);
      out += `<text x="${x}" y="${(y + tr * 0.62).toFixed(1)}" text-anchor="middle" font-size="${(tr * 0.55).toFixed(1)}" font-weight="600" fill="#fff" font-family="var(--mono)">${fmt(s.hp)}</text>`;
      if (dupLabel(st, u)) out += `<text x="${x + tr - 1}" y="${y + tr + 3}" text-anchor="middle" font-size="8" font-weight="700" fill="var(--ink)" font-family="var(--mono)">${esc(u.id.replace(/^[A-Z]+/, ""))}</text>`;
      out += `</g>`;
    }
    if (opts && !ui.armed && ui.ghost && opts.moves[ui.ghost]) {
      const [x, y] = pos(ui.ghost), m = opts.moves[ui.ghost];
      out += `<g pointer-events="none"><circle cx="${x}" cy="${y}" r="${tr}" fill="${teamColor(sel.team)}" fill-opacity="0.6" stroke="${teamColor(sel.team)}" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      out += iconShape(iconKey(st.rs, sel.card), x, y - 3.5, tr * 0.33, "#fff", 1.6);
      if (m.mode !== "free") { const sx = x + tr + 3, sy = y - tr - 1; out += `<polygon points="${hexPts(sx, sy, 7)}" fill="var(--south)"/><rect x="${sx - 3.5}" y="${sy - 1}" width="7" height="2" fill="#fff"/>`; }
      out += `</g>`;
    }
    if (opts && ui.drag && ui.drag.active) for (const uid of opts.swaps) { const f = E.unitByUid(st, uid); const [x, y] = pos(f.hex); out += `<circle cx="${x}" cy="${y}" r="${tr + 6}" fill="none" stroke="var(--move)" stroke-width="2.5" stroke-dasharray="5 3" pointer-events="none"/>`; }
    if (opts && !(ui.drag && ui.drag.active)) {
      for (const a of targetsFor(opts, ui.armed)) {
        const t = E.unitByUid(st, a.target); const [x, y] = pos(t.hex);
        const on = ui.sheet && ui.sheet.kind === "attack" && ui.sheet.target === a.target;
        out += `<circle cx="${x}" cy="${y}" r="${tr + 6}" fill="none" stroke="var(--attack)" stroke-width="${on ? 4.5 : 3}" pointer-events="none"/>`;
      }
    }
    svg.innerHTML = out;
  }
  function dupLabel(st, u) {
    if (u.fk) return false;
    return st.units.some((o) => o !== u && o.team === u.team && !o.fk && o.card === u.card);
  }

  /** Scroll the field so a hex is in view (smoothly), and keep edge markers and fades up to date. */
  function revealHex(h, center) {
    const sc = $("fieldscroll"), svg = $("board");
    if (!sc || !svg.clientHeight) return;
    const k = svg.clientHeight / HH, y = pos(h)[1] * k;
    const top = sc.scrollTop, vis = sc.clientHeight;
    if (!center && y > top + 70 && y < top + vis - 70) return;
    sc.scrollTo({ top: Math.max(0, y - vis / 2), behavior: center ? "auto" : "smooth" });
  }
  /** Put a hex in the upper part of the field, above a sheet that covers the bottom. */
  function revealAbove(h) {
    const sc = $("fieldscroll"), svg = $("board");
    if (!svg.clientHeight || window.innerWidth >= 900) return;
    const y = pos(h)[1] * (svg.clientHeight / HH);
    sc.scrollTo({ top: Math.max(0, y - sc.clientHeight * 0.28), behavior: "smooth" });
  }
  function updateEdges() {
    const st = App.st, sc = $("fieldscroll"), svg = $("board");
    if (!st || App.view !== "play" || !svg.clientHeight) return;
    const top = sc.scrollTop, vis = sc.clientHeight, k = svg.clientHeight / HH;
    $("fadeTop").style.opacity = top > 2 ? 1 : 0;
    $("fadeBottom").style.opacity = top + vis < sc.scrollHeight - 2 ? 1 : 0;
    const above = { N: 0, S: 0 }, below = { N: 0, S: 0 }, flags = { up: [], down: [] };
    const units = st.phase === "deploy" ? [] : E.alive(st);
    for (const u of units) { const y = pos(u.hex)[1] * k; if (y < top + 30) above[u.team]++; else if (y > top + vis - 30) below[u.team]++; }
    for (const t of ["N", "S"]) { const y = pos(E.FLAG[t])[1] * k; if (y < top + 30) flags.up.push(t); else if (y > top + vis - 30) flags.down.push(t); }
    const chip = (t, n) => `<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="${teamColor(t)}"/><text x="10" y="14" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="var(--mono)">${n}</text></svg>`;
    const label = (cnt, fl) => ["N", "S"].filter((t) => cnt[t]).map((t) => `${cnt[t]} ${sideName(t)} unit${cnt[t] > 1 ? "s" : ""}`).concat(fl.map((t) => `${sideName(t)} flag`)).join(", ");
    const fill = (el, cnt, fl, dir) => {
      const parts = ["N", "S"].filter((t) => cnt[t]).map((t) => chip(t, cnt[t])).concat(fl.map((t) => ic("flag", 15, teamColor(t))));
      el.hidden = !parts.length;
      if (parts.length) { el.innerHTML = parts.join(""); el.setAttribute("aria-label", `More field ${dir}: ${label(cnt, fl)}`); }
    };
    fill($("edgeTop"), above, flags.up, "above");
    fill($("edgeBottom"), below, flags.down, "below");
  }

  // ---------- Drawing: top bar ----------
  function renderTopbar() {
    const st = App.st, g = st.rs.game;
    const fl = { N: +fmt(E.flagShown(st, "N")), S: +fmt(E.flagShown(st, "S")) };
    const total = fl.N + fl.S, pct = total ? (100 * fl.N) / total : 50;
    const active = st.phase === "play" ? st.toMove : st.phase === "deploy" ? deployTeam() : null;
    const op = (t) => (!active || active === t ? 1 : 0.55);
    const count = (t) => st.units.filter((u) => u.team === t).length;
    const alive = (t) => (st.phase === "deploy" ? count(t) : E.alive(st).filter((u) => u.team === t).length);
    const dots = (t) => `<div class="dots" role="img" aria-label="${alive(t)} of ${count(t)} units on the field" style="justify-content:${t === "N" ? "flex-start" : "flex-end"}">${Array.from({ length: count(t) }, (_, i) => `<span style="${i < alive(t) ? `background:${LIGHT[t]}` : "border:1px solid rgba(255,255,255,.35)"}"></span>`).join("")}</div>`;
    let centre;
    if (st.phase === "play") {
      const max = st.turn === 1 && st.toMove === st.first ? g.firstTurnCommand : g.command;
      const n = Math.max(g.command, max), left = st.cmd;
      centre = `<div class="squares" role="img" aria-label="${fmt(left)} of ${fmt(max)} Command left">${Array.from({ length: n }, (_, i) => {
        const bg = i + 1 <= left + EPS ? "var(--card)" : i < left ? "linear-gradient(to right, var(--card) 50%, rgba(255,255,255,.16) 50%)" : i < max ? "rgba(255,255,255,.16)" : "transparent";
        return `<span style="background:${bg}${i >= max ? ";border:1px dashed rgba(255,255,255,.18)" : ""}"></span>`;
      }).join("")}</div>`;
    } else if (st.phase === "deploy") centre = `<div style="font:600 11px/1 var(--body);letter-spacing:.1em;opacity:.75">DEPLOY</div>`;
    else centre = `<div style="font:600 11px/1 var(--body);letter-spacing:.1em;opacity:.75">FULL TIME</div>`;
    const end = (t) => {
      const num = `<span class="num" style="opacity:${op(t)}">${fl[t]}</span>`, f = ic("flag", 18, LIGHT[t], t === "S" ? ' style="transform:scaleX(-1)"' : "");
      return `<div class="tb-end" role="img" aria-label="${sideName(t)} flag HP ${fl[t]}">${t === "N" ? f + num : num + f}</div>`;
    };
    $("topbar").innerHTML = `<div class="tb-row" style="align-items:end">
        <div class="tb-name" style="color:${LIGHT.N};opacity:${op("N")}">${esc(st.names.N)}${isBot("N") ? " · BOT" : ""}</div>
        <button type="button" class="tb-turn num" data-act="menu" aria-label="Turn ${st.turn} of ${E.turnLimit(st)}. Open match menu">${ic("hourglass", 13)}${st.turn}/${E.turnLimit(st)}</button>
        <div class="tb-name" style="color:${LIGHT.S};opacity:${op("S")};text-align:right">${isBot("S") ? "BOT · " : ""}${esc(st.names.S)}</div></div>
      <div style="display:flex;align-items:center;gap:10px">${end("N")}
        <div style="flex:1"><div class="rope" role="img" aria-label="Flag HP balance: North ${fl.N}, South ${fl.S}" style="background:linear-gradient(to right, var(--north) 0%, var(--north) ${pct.toFixed(1)}%, var(--south) ${pct.toFixed(1)}%, var(--south) 100%)"><div class="mid"></div><div class="knot" style="left:${pct.toFixed(1)}%"></div></div></div>
        ${end("S")}</div>
      <div class="tb-row">${dots("N")}${centre}${dots("S")}</div>
      ${active ? `<div class="underline" role="img" aria-label="${sideName(active)} to move" style="${active === "N" ? "left" : "right"}:0;background:${LIGHT[active]}"></div>` : ""}`;
  }

  // ---------- Drawing: unit bar ----------
  function stamSquares(u, now, cost) {
    const st = App.st, max = st.rs.game.stamina, out = [];
    for (let i = 0; i < Math.ceil(max - EPS); i++) {
      const full = i + 1 <= now + EPS, half = !full && i < now - EPS;
      const afterFull = i + 1 <= now - cost + EPS, afterHalf = !afterFull && i < now - cost - EPS;
      let cls = "sq";
      if (cost > 0 && (full || half)) cls += afterFull ? " on" : afterHalf ? (full ? " halfcost" : " half") : full ? " cost" : " cost";
      else if (full) cls += " on"; else if (half) cls += " half";
      out.push(`<span class="${cls}"></span>`);
    }
    return `<span style="display:inline-flex;gap:2px" role="img" aria-label="Stamina ${fmt(now)} of ${fmt(max)}${cost ? `, this move costs ${fmt(cost)}` : ""}">${out.join("")}</span>`;
  }
  function renderUnitbar() {
    const st = App.st, ui = App.ui, el = $("unitbar");
    if (st.phase === "deploy") {
      const t = deployTeam(), mine = st.units.filter((u) => u.team === t);
      el.innerHTML = `<div class="bench" role="group" aria-label="Units to place">${mine.map((u) => {
        const on = ui.deploySel === u.uid, placed = ui.placements[u.uid];
        return `<button type="button" class="${on ? "on" : ""}" data-act="deploy-pick" data-uid="${u.uid}" aria-pressed="${on}" style="${placed && !on ? "opacity:.45" : ""}">${on ? iconInline(iconKey(st.rs, u.card), "#fff", 16) : tokenInline(iconKey(st.rs, u.card), t, 20, u.fk)}${esc(u.id)}${placed ? ` <span class="num" style="font-weight:500">${placed}</span>` : ""}</button>`;
      }).join("")}</div>`;
      return;
    }
    const sel = ui.sel && E.unitByUid(st, ui.sel);
    if (!sel || sel.hp <= 0) {
      let msg;
      if (st.phase === "over") msg = st.result.winner ? `${esc(st.names[st.result.winner])} wins · ${esc(say(st.result.how))}` : "Draw";
      else if (isBot(st.toMove)) msg = `${ic("bot", 18)}<span>${esc(ui.botReason || "Thinking…")}</span>`;
      else msg = `Tap one of your units`;
      el.innerHTML = `<div class="muted" style="display:flex;align-items:center;gap:8px;font:500 14px/1.3 var(--body)">${msg}</div>`;
      return;
    }
    const c = E.card(st, sel), s = E.status(st, sel);
    const mine = st.phase === "play" && sel.team === st.toMove;
    const now = mine ? s.stamNow : s.stamNext;
    const movesLeft = mine ? (sel.done ? 0 : Math.max(0, Math.min(E.capOf(st, sel) - sel.moved, Math.floor((sel.stam + EPS) / c.hexCost)))) : E.capOf(st, sel);
    const o = selOptions();
    const cost = o && ui.ghost && o.moves[ui.ghost] ? o.moves[ui.ghost].cost : 0;
    const status = [];
    if (s.braced) status.push(`<span role="img" aria-label="Braced" style="display:inline-flex">${ic("brace", 16, "var(--brace)")}</span>`);
    if (s.reloading) status.push(`<span role="img" aria-label="Reloading" style="display:inline-flex">${ic("reload", 16, "var(--attack)")}</span>`);
    if (s.zone) status.push(`<span role="img" aria-label="Projects a Zone of Control" style="display:inline-flex;color:${teamColor(sel.team)}">${ic("zone", 16, teamColor(sel.team))}</span>`);
    if (s.done) status.push(`<span role="img" aria-label="Turn ended" style="display:inline-flex">${ic("endunit", 16, "var(--muted)")}</span>`);
    const pct = (100 * s.hp) / s.maxHp;
    el.innerHTML = `${tokenInline(iconKey(st.rs, sel.card), sel.team, 30, sel.fk)}
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0;flex:1">
        <div class="ub-name">${esc(c.name)}${sel.fk ? `<span class="muted" style="font:500 12px/1 var(--body);margin-left:6px">Flagkeeper</span>` : ""}</div>
        <div style="display:flex;align-items:center;gap:7px" role="img" aria-label="HP ${fmt(s.hp)} of ${s.maxHp}"><div class="hpbar"><i style="width:${pct.toFixed(0)}%;background:${teamColor(sel.team)}"></i></div><span class="num" style="font:600 13px/1 var(--mono)">${fmt(s.hp)}/${s.maxHp}</span></div>
      </div>
      <div class="ub-right">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="ub-stat" role="img" aria-label="At ${sel.hex}">${ic("hex", 14, "var(--muted)")}${sel.hex}</span>
          <span class="ub-stat" role="img" aria-label="Can move ${movesLeft} hexes">${ic("move", 14, "var(--muted)")}${movesLeft}</span>${s.dodge !== null && s.dodge !== undefined ? `<span class="ub-stat" role="img" aria-label="Dodge ${s.dodge}%">${ic("hex", 14, "var(--muted)", ' stroke-dasharray="2 2"')}${s.dodge}%</span>` : ""}</div>
        <div style="display:flex;align-items:center;gap:8px">${stamSquares(sel, now, cost)}${status.join("")}</div>
      </div>
      <button type="button" data-act="info" aria-label="Unit information" style="flex-shrink:0;width:44px;height:44px;margin-right:-8px;border:0;background:none;display:flex;align-items:center;justify-content:center">${ic("info", 24)}</button>`;
  }

  // ---------- Drawing: action bar ----------
  function renderActions() {
    const st = App.st, ui = App.ui, el = $("actions");
    const b = (act, icon, label, opt) => `<button type="button" class="act${opt.cls ? " " + opt.cls : ""}" data-act="${act}" ${opt.dis ? "disabled" : ""} ${opt.pressed !== undefined ? `aria-pressed="${opt.pressed}"` : ""}>${ic(icon, 22)}<span>${label}</span></button>`;
    if (st.phase === "deploy") {
      const t = deployTeam(), mine = st.units.filter((u) => u.team === t);
      const placed = mine.filter((u) => ui.placements[u.uid]).length;
      const sel = ui.deploySel && ui.placements[ui.deploySel];
      el.innerHTML = `<div class="arow"><span class="alabel">DEPLOY</span>${b("deploy-takeback", "undo", "Take back", { dis: !sel })}${b("deploy-fill", "fill", "Fill rest", { dis: placed === mine.length })}${b("deploy-done", "endturn", "Ready", { cls: "primary", dis: placed !== mine.length })}</div>`;
      return;
    }
    const human = st.phase === "play" && !isBot(st.toMove);
    const o = selOptions(), sel = o && E.unitByUid(st, ui.sel);
    const nAtt = o ? targetsFor(o, "attack").length : 0, nReach = o ? targetsFor(o, "reach").length : 0;
    const reachy = sel && E.card(st, sel).trait === "reach";
    el.innerHTML = `<div class="arow"><span class="alabel">UNIT</span>
        ${b("arm-attack", "attack", "Attack", { dis: !nAtt, cls: ui.armed === "attack" ? "on" : "", pressed: ui.armed === "attack" })}
        ${b("arm-reach", "reach", "Reach", { dis: !nReach, cls: ui.armed === "reach" ? "on" : "", pressed: ui.armed === "reach" })}
        ${b("brace", "brace", "Brace", { dis: !(o && o.brace) })}
        ${b("special", "special", "Special", { dis: true })}</div>
      <div class="arow"><span class="alabel">TURN</span>
        ${b("undo", "undo", "Undo", { dis: !canUndo() })}
        ${b("done", "endunit", "End unit", { dis: !(o && sel && !sel.done) })}
        ${b("end", "endturn", ui.confirmEnd ? "Confirm" : "End turn", { dis: !human, cls: ui.confirmEnd ? "confirm" : "primary" })}</div>`;
    if (reachy === false) el.querySelector('[data-act="arm-reach"]').setAttribute("title", "Only Reach units");
  }

  // ---------- Drawing: sheet (attack, pull, unit info, result) ----------
  function renderSheet() {
    const st = App.st, ui = App.ui, el = $("sheet"), sc = $("scrim"), sh = ui.sheet;
    if (!sh || App.ui.cover) { el.hidden = true; sc.hidden = true; return; }
    el.hidden = false; sc.hidden = sh.kind === "over";
    const g = st.rs.game, grab = `<div class="grab" aria-hidden="true"></div>`;
    const two = !!(st.rs.switches && st.rs.switches.dice2d6);
    const diceRow = (v, dodge) => `<div class="dice">${E.dieCases(st).map(([d, p, label]) => `<div><small>${two ? "" : "Die "}${label}${two ? ` · ${Math.round(p * 1000) / 10}%` : ""}</small><b>${fmt(E.applyDie(st, v, d, dodge))}</b></div>`).join("")}</div>`;
    const o = selOptions(), u = ui.sel && E.unitByUid(st, ui.sel);
    if (sh.kind === "attack" && o) {
      const a = o.attacks.find((x) => x.target === sh.target);
      if (!a) { ui.sheet = null; el.hidden = true; sc.hidden = true; return; }
      const t = E.unitByUid(st, a.target), reach = isReachShot(st, u, t);
      const kc = a.killChance || 0;
      const verb = a.pooled ? "Brings the flag down (KO)" : "Kills";
      const kill = kc >= 1 - 1e-9 ? `${verb} on any roll.` : kc <= 0 ? (a.pooled ? "Cannot bring the flag down this turn." : "Cannot kill this turn.") : `${verb} ${Math.round(kc * 1000) / 10}% of the time.`;
      let warn = "";
      if (a.capture && a.high >= t.hp) warn += `<p class="ok">If it kills, ${esc(u.id)} moves into ${a.capture.hex}${a.capture.adjacentEnemies.length ? `, next to ${esc(a.capture.adjacentEnemies.join(", "))}` : ""}.</p>`;
      if (a.capture && a.capture.spike && a.high >= t.hp) warn += `<p class="warn">A braced Anti-Cavalry there deals ${st.rs.spikeDamage}.</p>`;
      if (a.evade > 0) warn += `<p class="ok">Evade after: up to ${a.evade} hex${a.evade === 1 ? "" : "es"}${kc > 0 ? ` if ${esc(t.id)} survives` : ""}.</p>`;
      const pv = E.parryPreview(st, u, t);
      if (pv && pv.used) warn += `<p class="ok">No parry: ${esc(t.id)} has already parried this turn.</p>`;
      else if (pv) warn += `<p class="warn">Parry: ${esc(u.id)} takes ${fmt(pv.amount)}${pv.ifSurvives ? ` if ${esc(t.id)} survives the hit` : ""}.</p>`;
      el.innerHTML = `${grab}<div style="font:700 20px/1.1 var(--display);letter-spacing:.02em">${esc(u.id)} ${reach ? "reaches" : "attacks"} ${esc(t.id)} <span class="muted" style="font:500 13px/1 var(--body)">${u.hex} → ${t.hex} · ${a.pooled ? `holds the flag: pool ${fmt(a.effHp)} (flag ${fmt(E.flagShown(st, t.team))} + ${fmt(E.hpShown(st, t))})` : `target HP ${fmt(E.hpShown(st, t))}`}</span></div>
        <div class="calc">${esc(a.parts.join(" · "))} = <b>${fmt(a.value)}</b></div>${diceRow(a.value, a.dodge)}
        <p class="ok" style="font-weight:600">${kill}</p>${warn}
        <div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="sheet-close" style="flex:1">Cancel</button><button class="btn go" data-act="attack-confirm" style="flex:2">${reach ? "Reach" : "Attack"}</button></div>`;
    } else if (sh.kind === "pull" && o && o.pull) {
      const left = g.poleHP - st.pole[E.foeOf(u.team)];
      el.innerHTML = `${grab}<div style="font:700 20px/1.1 var(--display);letter-spacing:.02em">${esc(u.id)} pulls the ${sideName(E.foeOf(u.team))} flag <span class="muted" style="font:500 13px/1 var(--body)">flag HP ${left}</span></div>
        <div class="calc">${esc(o.pull.parts.join(" · "))} = <b>${fmt(o.pull.value)}</b></div>${diceRow(o.pull.value)}
        <div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="sheet-close" style="flex:1">Cancel</button><button class="btn go" data-act="pull-confirm" style="flex:2">Pull</button></div>`;
    } else if (sh.kind === "info") {
      const x = E.unitByUid(st, sh.uid);
      if (!x) { ui.sheet = null; renderSheet(); return; }
      const c = E.card(st, x);
      const rows = [["HP", `${fmt(E.hpShown(st, x))} of ${x.maxHp}`], ["Strength", c.str], ["Range", c.range], ["Armor", c.armor], ["Dodge", c.dodge ? (E.status(st, x).dodge !== null ? `${E.status(st, x).dodge}% now (${st.rs.game.dodgePerHex || 5}% per open hex)` : "Yes") : "No"],
        ["Movement", `${E.capOf(st, x)} hexes, ${fmt(c.hexCost)} Stamina each`], ["Trait", D.TRAITS[c.trait] || c.trait], ["When braced", D.BRACES[c.brace] || c.brace],
        ["Zone of Control", c.zone ? "Always" : c.brace === "zone" ? "When braced" : "No"], ["Reloads", c.reload ? "Yes, skips the turn after it attacks" : "No"]];
      const swaps = o && x.uid === ui.sel ? o.swaps : [];
      el.innerHTML = `${grab}<div class="row" style="flex-wrap:nowrap">${tokenInline(iconKey(st.rs, x.card), x.team, 30, x.fk)}<div style="font:700 20px/1.1 var(--display)">${esc(c.name)} <span class="muted" style="font:500 13px/1 var(--body)">${esc(x.id)} · ${sideName(x.team)}${x.fk ? " · Flagkeeper" : ""}</span></div></div>
        <table class="data" style="font-size:13px">${rows.map(([k, v]) => `<tr><th style="background:none">${k}</th><td style="white-space:normal">${esc(v)}</td></tr>`).join("")}</table>
        ${swaps.length ? `<div class="row">${swaps.map((uid) => { const f = E.unitByUid(st, uid); return `<button class="btn" data-act="swap" data-with="${uid}">Swap with ${esc(f.id)}</button>`; }).join("")}</div><p class="note">Or drag ${esc(x.id)} onto a friend next to it.</p>` : ""}
        <button class="btn" data-act="sheet-close">Close</button>`;
    } else if (sh.kind === "over") {
      const r = st.result;
      el.innerHTML = `${grab}<h2>${r.winner ? esc(st.names[r.winner]) + " wins" : "Draw"}</h2><p class="note">${esc(say(r.how))} on turn ${st.turn}. Saved under Matches.</p>
        <div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="sheet-close" style="flex:1">See field</button><button class="btn" data-act="copy-record" style="flex:1">Copy record</button><button class="btn primary" data-act="new" style="flex:1">New game</button></div>`;
    } else { ui.sheet = null; el.hidden = true; sc.hidden = true; }
  }

  // ---------- Drawing: side column (desktop) ----------
  function renderSide() {
    const st = App.st, el = $("roster");
    if (st.phase === "deploy") { el.innerHTML = `<h3>Units</h3><p class="note">Shown once both sides have deployed.</p>`; $("recent").innerHTML = ""; return; }
    let h = `<h3>Units</h3><table><tbody>`;
    for (const t of ["N", "S"]) {
      h += `<tr class="teamhead" style="color:${teamColor(t)}"><td colspan="4">${esc(st.names[t])}</td></tr>`;
      for (const u of st.units.filter((x) => x.team === t)) {
        if (u.hp <= 0) { h += `<tr class="gone"><td>${esc(u.id)}</td><td></td><td>0</td><td></td></tr>`; continue; }
        const s = E.status(st, u);
        h += `<tr data-uid="${u.uid}" style="cursor:pointer"><td style="display:flex;align-items:center;gap:6px">${iconInline(iconKey(st.rs, u.card), teamColor(t), 16)}<b>${esc(u.id)}</b></td><td class="num">${u.hex}</td><td class="num">${fmt(s.hp)}/${s.maxHp}${s.dodge !== null && s.dodge !== undefined ? ` · ${s.dodge}%` : ""}</td><td>${[s.braced ? ic("brace", 14, "var(--brace)") : "", s.reloading ? ic("reload", 14, "var(--attack)") : "", s.done ? ic("endunit", 14, "var(--muted)") : ""].join("")}</td></tr>`;
      }
    }
    el.innerHTML = h + `</tbody></table>`;
    const rc = $("recent");
    rc.innerHTML = st.log.slice(-14).map((l) => `<div${l.kind === "turn" ? ' style="color:var(--ink);font-weight:600"' : ""}>${esc(say(l.text))}</div>`).join("");
    rc.scrollTop = rc.scrollHeight;
  }

  // ---------- Hint over the field ----------
  function renderHint() {
    const st = App.st, ui = App.ui, el = $("hint"), o = st && st.phase === "play" ? selOptions() : null;
    let t = "";
    if (o && ui.ghost && o.moves[ui.ghost] && !(ui.drag && ui.drag.active)) {
      const m = o.moves[ui.ghost];
      t = `Tap ${ui.ghost} again to move · ${fmt(m.cost)} Stamina${m.mode !== "free" ? " · stops in a zone" : ""}${m.tackle ? " · tackle" : ""}`;
    } else if (o && ui.armed) t = "Tap a red ring";
    else if (o && o.evading) { const tg = E.unitByUid(st, o.evading); t = Object.keys(o.moves).length ? `Evade: step further from ${tg ? tg.id : "the target"}, or End unit` : "No hex to evade to · End unit"; }
    el.hidden = !t || !!ui.sheet; el.textContent = t;
  }

  // ---------- Covers ----------
  function showCover(html) { $("coverbox").innerHTML = html; $("cover").hidden = false; }
  function renderCover() {
    const c = App.ui.cover;
    if (!c) { if (App.view === "play") $("cover").hidden = true; return; }
    if (c.kind === "deploy") showCover(`<h2>${sideName(c.team)} deploys</h2><p>${sideName(E.foeOf(c.team))}, look away. ${sideName(c.team)} places its units without seeing the other side.</p><button class="btn" data-act="cover-ok">I'm ${sideName(c.team)}</button>`);
    else if (c.kind === "start") showCover(`<h2>Both sides deployed</h2><p>${sideName(App.st.first)} moves first${App.match.opts.coin ? " (coin toss)" : ""}, with ${fmt(App.st.rs.game.firstTurnCommand)} Command on turn 1.</p><button class="btn" data-act="cover-ok">Show the field</button>`);
  }

  function render() {
    if (App.view !== "play" || !App.st) return;
    renderTopbar(); renderBoard(); renderUnitbar(); renderActions(); renderSheet(); renderSide(); renderCover(); renderHint();
    $("namesbtn").setAttribute("aria-pressed", App.ui.names ? "true" : "false");
    if (App.ui.scrollTo) { const h = App.ui.scrollTo; App.ui.scrollTo = null; requestAnimationFrame(() => { revealHex(h, true); updateEdges(); }); }
    else requestAnimationFrame(updateEdges);
    botTick();
  }

  // ---------- Taps on the field ----------
  function onBoardTap(hex) {
    const st = App.st, ui = App.ui;
    if (!st || ui.cover) return;
    if (st.phase === "deploy") {
      const t = deployTeam(), zone = new Set(E.deployZone(st, t));
      const occupant = Object.keys(ui.placements).find((uid) => ui.placements[uid] === hex);
      if (occupant) {
        if (ui.deploySel && ui.deploySel !== occupant && ui.placements[ui.deploySel]) {
          const h0 = ui.placements[ui.deploySel]; ui.placements[occupant] = h0; ui.placements[ui.deploySel] = hex; ui.deploySel = nextUnplaced(t);
        } else if (ui.deploySel && ui.deploySel !== occupant) {
          delete ui.placements[occupant]; ui.placements[ui.deploySel] = hex; ui.deploySel = occupant;
        } else ui.deploySel = ui.deploySel === occupant ? nextUnplaced(t) : occupant;
      } else if (ui.deploySel && zone.has(hex)) { ui.placements[ui.deploySel] = hex; ui.deploySel = nextUnplaced(t); }
      else if (zone.has(hex)) toast("Pick a unit from the bench first.");
      else toast(`${hex} is outside ${sideName(t)}'s deployment area.`);
      render(); return;
    }
    if (st.phase === "over") { const here = E.alive(st).find((u) => u.hex === hex); ui.sel = here ? here.uid : null; render(); return; }
    ui.confirmEnd = false;
    const here = E.alive(st).find((u) => u.hex === hex);
    const sel = ui.sel && E.unitByUid(st, ui.sel);
    const o = selOptions();
    if (o) {
      if (here && here.team !== sel.team) {
        const a = targetsFor(o, ui.armed).find((x) => x.target === here.uid);
        if (a) { ui.sheet = { kind: "attack", target: here.uid }; ui.ghost = null; render(); revealAbove(sel.hex); return; }
      }
      if (hex === E.FLAG[E.foeOf(sel.team)] && o.pull) { ui.sheet = { kind: "pull" }; ui.ghost = null; ui.armed = null; render(); revealAbove(sel.hex); return; }
      if (!here && !ui.armed && o.moves[hex]) {
        if (ui.ghost === hex) { act({ type: "move", uid: sel.uid, to: hex }); return; }
        ui.ghost = hex; ui.sheet = null; render(); return;
      }
    }
    ui.ghost = null; ui.armed = null; ui.sheet = null;
    if (o && o.evading && here && here.team === sel.team && here.uid !== sel.uid) endEvade(sel.uid);   // v3.3
    ui.sel = here ? (ui.sel === here.uid ? null : here.uid) : null;
    render();
  }
  /** v3.3: picking another unit ends a pending Evade, as End unit does. */
  function endEvade(uid) { const keep = App.ui.sel; act({ type: "done", uid }); App.ui.sel = keep; }

  // ---------- Drag one unit onto a friend to swap ----------
  function onPointerDown(e) {
    const g = e.target.closest(".unit"); const st = App.st;
    if (!g || !st || st.phase !== "play" || isBot(st.toMove)) return;
    const u = E.unitByUid(st, g.dataset.uid);
    if (!u || u.team !== st.toMove || u.done) return;
    App.ui.drag = { uid: u.uid, x: e.clientX, y: e.clientY, active: false };
    // Capture on the whole field: the token under the finger is redrawn during the drag, and a touch
    // whose target vanishes would otherwise be cancelled.
    try { $("board").setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
  }
  function hexAt(x, y) { const el = document.elementFromPoint(x, y), g = el && el.closest("#board [data-hex]"); return g ? g.dataset.hex : null; }
  function onPointerMove(e) {
    const d = App.ui.drag; if (!d) return;
    if (!d.active && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) {
      const o0 = selOptions(); if (o0 && o0.evading && App.ui.sel !== d.uid) endEvade(App.ui.sel);   // v3.3
      d.active = true; App.ui.sel = d.uid; App.ui.ghost = null; App.ui.armed = null; App.ui.sheet = null; render();
    }
    if (!d.active) return;
    e.preventDefault();
    // Show where the unit would land while the finger is over a reachable hex.
    const h = hexAt(e.clientX, e.clientY), o = selOptions();
    const g = o && h && o.moves[h] && !E.alive(App.st).some((u) => u.hex === h) ? h : null;
    if (g !== App.ui.ghost) { App.ui.ghost = g; renderBoard(); renderUnitbar(); renderHint(); }
  }
  function onPointerUp(e) {
    const d = App.ui.drag; App.ui.drag = null;
    if (!d) return;
    App.ui.suppressClick = true; setTimeout(() => (App.ui.suppressClick = false), 60);
    // A press on your own unit that didn't drag is a tap (the browser's own click is blocked so the field doesn't scroll).
    if (!d.active) { const h0 = hexAt(e.clientX, e.clientY); if (h0) onBoardTap(h0); return; }
    const st = App.st, o = selOptions(), h = hexAt(e.clientX, e.clientY);
    App.ui.ghost = null;
    if (!o || !h || h === E.unitByUid(st, d.uid).hex) { render(); return; }
    const here = E.alive(st).find((x) => x.hex === h);
    // Drop on a reachable empty hex: move. On a friend next to it: swap. On a target: open the attack preview.
    if (!here && o.moves[h]) { act({ type: "move", uid: d.uid, to: h }); return; }
    if (here && here.team === st.toMove) {
      if (o.swaps.includes(here.uid)) { act({ type: "swap", uid: d.uid, with: here.uid }); return; }
      toast("Swap needs a friend next to it and the Stamina for both moves.");
    } else if (here && targetsFor(o).some((a) => a.target === here.uid)) {
      App.ui.sheet = { kind: "attack", target: here.uid }; render(); revealAbove(E.unitByUid(st, d.uid).hex); return;
    } else if (here) toast(`${E.unitByUid(st, d.uid).id} cannot attack that unit from here.`);
    else toast(`${E.unitByUid(st, d.uid).id} cannot reach ${h}.`);
    render();
  }

  // ---------- Actions ----------
  async function onAction(a, el) {
    const ui = App.ui, st = App.st;
    if (a !== "end" && ui.confirmEnd) { ui.confirmEnd = false; if (App.view === "play") renderActions(); }
    switch (a) {
      case "go": {
        const to = el.dataset.to;
        if ((App.view === "units" || App.view === "rules") && App.dirty && !(await confirmBox("Leave without saving?", "Your rule-set changes are not saved.", "Leave", "danger"))) break;
        if (App.view === "opponent" && App.brainDirty && !(await confirmBox("Leave without saving?", "Your brain changes are not saved.", "Leave", "danger"))) break;
        if (App.view === "units" || App.view === "rules") { App.edit = E.clone(App.rulesets[App.editId]); App.dirty = false; }
        if (App.view === "opponent") { App.brainEdit = E.clone(App.brains[App.brainId]); App.brainDirty = false; }
        show(to); break;
      }
      case "go-units": show("units"); break;
      case "go-rules": show("rules"); break;
      case "go-opponent": show("opponent"); break;
      case "go-match": loadMatches(); show("match"); break;
      case "continue": {
        if (App.live && (!App.match || App.match.id !== App.live.id)) { App.match = E.clone(App.live); rebuild(); resetUi(); if (App.st.phase === "deploy") beginDeploy(); else App.ui.scrollTo = "E10"; }
        show("play"); break;
      }
      case "new": {
        const cur = App.match && App.st && App.st.phase !== "over" ? App.match : (liveSummary() ? App.live : null);
        if (cur) {
          if (!(await confirmBox("Abandon the match in progress?", "It is saved under Matches as unfinished.", "Abandon and start new", "danger"))) break;
          if (!App.match || App.match.id !== cur.id) { App.match = E.clone(cur); rebuild(); }
          Store.saveAbandoned(App.match, App.st);
          App.live = null; App.match = null; App.st = null; Store.local("live", null);
        }
        App.setup = Object.assign(defaultSetup(), Store.local("setup") || {}, { seed: E.makeSeed() });
        { const latest = D.PRESETS && D.PRESETS.length ? D.PRESETS[D.PRESETS.length - 1].id : null;
          if (latest && Store.local("presetSeen") !== latest) { App.setup.rulesetId = latest; Store.local("presetSeen", latest); Store.local("setup", App.setup); } }
        if (!App.rulesets[App.setup.rulesetId]) App.setup.rulesetId = App.editId;
        show("setup"); break;
      }
      case "seed-new": App.setup.seed = E.makeSeed(); renderSetup(); break;
      case "seed-copy": {
        const v = App.setup.seed;
        try { await navigator.clipboard.writeText(v); toast("Seed copied."); } catch (e) { const i = $("setup-seed"); i.select(); toast("Seed selected; copy it."); }
        break;
      }
      case "setup-next": setupNext(); break;
      case "teams-next": teamsNext(); break;
      case "pick-plus": { const p = App.picks[App.lineupSide]; p.counts[el.dataset.card] = (p.counts[el.dataset.card] || 0) + 1; renderLineup(); break; }
      case "pick-minus": { const p = App.picks[App.lineupSide]; p.counts[el.dataset.card] = Math.max(0, (p.counts[el.dataset.card] || 0) - 1); renderLineup(); break; }
      case "lineup-next": lineupNext(); break;
      case "cover-ok": $("cover").hidden = true; if (App.view === "play") { ui.cover = null; render(); } break;
      case "names": ui.names = !ui.names; Store.local("names", ui.names); renderBoard(); $("namesbtn").setAttribute("aria-pressed", ui.names ? "true" : "false"); break;
      case "edge-top": $("fieldscroll").scrollBy({ top: -$("fieldscroll").clientHeight * 0.7, behavior: "smooth" }); break;
      case "edge-bottom": $("fieldscroll").scrollBy({ top: $("fieldscroll").clientHeight * 0.7, behavior: "smooth" }); break;
      // deploy
      case "deploy-pick": ui.deploySel = el.dataset.uid; render(); if (ui.placements[ui.deploySel]) revealHex(ui.placements[ui.deploySel]); break;
      case "deploy-takeback": delete ui.placements[ui.deploySel]; render(); break;
      case "deploy-fill": {
        const t = deployTeam(), auto = Bot.deploy(st, t, BR.DEFAULT_BRAINS.standard, () => 0.5);
        const taken = new Set(Object.values(ui.placements));
        const free = E.deployZone(st, t).filter((h) => !taken.has(h)).sort((a, b) => E.dist(a, "E10") - E.dist(b, "E10"));
        for (const u of st.units.filter((x) => x.team === t && !ui.placements[x.uid])) {
          let h = auto[u.uid]; if (!h || taken.has(h)) h = free.find((x) => !taken.has(x));
          ui.placements[u.uid] = h; taken.add(h);
        }
        ui.deploySel = null; render(); break;
      }
      case "deploy-done": {
        const t = deployTeam();
        const r = E.act(st, { type: "deploy", team: t, placements: ui.placements });
        if (!r.ok) { toast(r.error); render(); break; }
        App.match.actions = E.clone(st.actions);
        ui.deploySel = null;
        beginDeploy(); Store.saveLive(App.match);
        render(); break;
      }
      // play
      case "arm-attack": case "arm-reach": {
        const kind = a === "arm-attack" ? "attack" : "reach";
        ui.armed = ui.armed === kind ? null : kind; ui.ghost = null; ui.sheet = null;
        const o = selOptions(), list = o ? targetsFor(o, kind) : [];
        if (ui.armed && list.length === 1) ui.sheet = { kind: "attack", target: list[0].target };
        render(); if (ui.sheet) revealAbove(E.unitByUid(st, ui.sel).hex); break;
      }
      case "attack-confirm": if (ui.sheet && ui.sheet.kind === "attack") act({ type: "attack", uid: ui.sel, target: ui.sheet.target }); break;
      case "pull-confirm": act({ type: "pull", uid: ui.sel }); break;
      case "brace": act({ type: "brace", uid: ui.sel }); break;
      case "done": act({ type: "done", uid: ui.sel }); break;
      case "swap": act({ type: "swap", uid: ui.sel, with: el.dataset.with }); break;
      case "undo": undo(); break;
      case "end":
        if (!ui.confirmEnd) { ui.confirmEnd = true; renderActions(); break; }
        act({ type: "end" }); break;
      case "info": if (ui.sel) { ui.sheet = { kind: "info", uid: ui.sel }; render(); } break;
      case "sheet-close": ui.sheet = null; ui.armed = null; render(); break;
      case "menu": {
        const live = st.phase !== "over";
        const v = await dialog(`<h2>Turn ${st.turn}</h2><p class="note">${esc(st.names.N)} vs ${esc(st.names.S)} · ${esc(App.match.rs.name)}${esc(buildNote(App.match))}${App.match.opts.seed ? ` · seed <span class="num" style="white-space:nowrap">${esc(App.match.opts.seed)}</span>` : ""}</p>
          <button class="btn primary" data-dlg="close">Back to the field</button><button class="btn" data-dlg="match">Match log and record</button><button class="btn" data-dlg="home">Home</button>
          ${live && !isBot(st.toMove) ? `<button class="btn danger" data-dlg="surrender">${esc(sideName(st.toMove))} surrenders</button>` : ""}`);
        if (v === "match") show("match");
        else if (v === "home") show("home");
        else if (v === "surrender" && (await confirmBox(`${sideName(st.toMove)} surrenders?`, "The match ends and is saved.", "Surrender", "danger"))) act({ type: "surrender", team: st.toMove });
        break;
      }
      case "surrender": if (await confirmBox(`${sideName(st.toMove)} surrenders?`, "The match ends and is saved.", "Surrender", "danger")) { act({ type: "surrender", team: st.toMove }); show("play"); } break;
      case "copy-record": {
        const rec = recordText(App.match, App.st.result);
        try { await navigator.clipboard.writeText(rec); toast("Match record copied. Paste it into the chat."); }
        catch (e) { show("match"); const ta = $("record"); if (ta) { ta.value = rec; ta.hidden = false; ta.select(); } toast("Select the text and copy it."); }
        break;
      }
      case "copy-finished": {
        const m = await Store.record(el.dataset.id);
        if (!m) { toast("This match was saved before Build 3 on this device only, so its moves weren't kept. Nothing to copy."); break; }
        const rec = recordText(m, replayResult(m));
        try { await navigator.clipboard.writeText(rec); toast("Match record copied. Paste it into the chat."); }
        catch (e) { const ta = $("record-finished"); if (ta) { ta.value = rec; ta.hidden = false; ta.select(); } toast("Select the text and copy it."); }
        break;
      }
      // data sheets
      case "br-save": saveBrain(false); break;
      case "br-saveas": saveBrain(true); break;
      case "br-revert": App.brainEdit = E.clone(App.brains[App.brainId]); App.brainDirty = false; renderOpponent(); break;
      case "br-delete": {
        const id = App.brainId, name = App.brains[id].name;
        if (!(await confirmBox(`Delete “${name}”?`, "", "Delete", "danger"))) break;
        delete App.brains[id]; App.brainId = Object.keys(App.brains)[0]; App.brainEdit = E.clone(App.brains[App.brainId]); App.brainDirty = false;
        renderOpponent(); Store.deleteSet("brains", id).catch(() => {}); toast(`Deleted “${name}”.`); break;
      }
      case "rs-save": saveRs(false); break;
      case "rs-saveas": saveRs(true); break;
      case "rs-revert": App.edit = E.clone(App.rulesets[App.editId]); App.dirty = false; renderSheets(); break;
      case "rs-delete": {
        const id = App.editId, name = App.rulesets[id].name;
        if (!(await confirmBox(`Delete “${name}”?`, "", "Delete", "danger"))) break;
        delete App.rulesets[id];
        App.editId = Object.keys(App.rulesets)[0]; App.edit = E.clone(App.rulesets[App.editId]); App.dirty = false;
        renderSheets(); Store.deleteRuleset(id).catch(() => {}); toast(`Deleted “${name}”.`); break;
      }
    }
  }

  // ---------- Data sheet: rule sets ----------
  const GAME_FIELDS = [
    ["command", "Command per turn", "Shared pool for the whole team. Every action spends it; unspent Command is lost."],
    ["firstTurnCommand", "First player's turn-1 Command", "Offsets the first-mover advantage."],
    ["stamina", "Stamina per unit", "Each unit's cap on what it does in a turn."],
    ["attackCost", "Attack or pull cost", "Stamina and Command. An attack or pull ends the unit's turn."],
    ["braceCost", "Brace cost", "Stamina and Command. Bracing ends the unit's turn."],
    ["braceReduction", "Brace damage reduction", "Taken off every hit on a braced unit."],
    ["staminaAfterBrace", "Stamina after bracing", "What a braced unit starts its next turn with (Light Ranged keeps full Stamina)."],
    ["supportBonus", "Support bonus", "Added to an attack when another attacker is adjacent to the target."],
    ["dodgeDivisor", "Dodge divisor", "Dodge takes 1 off per this many points of incoming Strength. Halved for a braced Light Melee."],
    ["reachPenalty", "Reach penalty", "Reach attacks (2 hexes, straight line) do this much less."],
    ["tackleCost", "Tackle cost", "Extra Stamina to move out of contact with an enemy Melee unit, once a turn."],
    ["keeperHomeReduction", "Keeper at home: damage reduction", "Flagkeeper in its own goal zone takes this much less."],
    ["keeperPullReduction", "Keeper at home: pull reduction", "Pulls on its flag do this much less while the keeper is home."],
    ["keeperCapPenalty", "Keeper movement penalty", "The Flagkeeper's movement cap is this much lower."],
    ["goalZoneReduction", "Goal-zone reduction", "Any other defender in its own goal zone takes this much less."],
    ["minDamage", "Minimum damage", "Every hit and pull does at least this."],
    ["poleHP", "Flagpole HP", "Pull it to 0 for a KO."],
    ["dodgePerHex", "Dodge per open hex (%)", "Room Dodge: each open hex round a Light unit is worth this much. An adjacent enemy blocks its hex and the two either side."],
    ["turnLimit", "Turn limit", "Turns per player. Then more pull damage wins, then less unit cap lost."],
    ["turnLimit5", "Turn limit, 5v5", "v3.4: turns per player at 5v5 (with the per-format switch on)."],
    ["turnLimit7", "Turn limit, 7v7", "v3.4: turns per player at 7v7 (with the per-format switch on)."],
    ["deployRadius", "Deployment radius", "Deploy within this many hexes of your own flag."]
  ];
  const SWITCHES = [
    ["tkoNeedsKeeper", "TKO needs the Flagkeeper to fall", "Off: removing every other unit is enough for a TKO."],
    ["defenderSupport", "Defender Support", "A defender with a friend adjacent takes 1 less (does not stack with Brace). Dropped after match 2."],
    ["captureTriggersSpike", "A capture counts as entering", "A unit stepping in after a kill takes a braced Anti-Cavalry's spike damage."],
    ["rangedHalfWhenAdjacent", "Ranged halved when an enemy is adjacent", "A Ranged unit with an enemy next to it shoots at half Strength."],
    ["dice2d6", "Two dice, graded", "Two d6 added: 2 = −50%, 3 = −25%, 4–10 normal, 11 = +25%, 12 = +50%. Off: one d6 (1 halves, 6 adds half)."],
    ["halfPoints", "Half points", "Damage rounds to the nearest half point; 0.5 HP is still in."],
    ["dodgeRoom", "Room Dodge", "Dodge is a percentage from open hexes round the unit, taken off after the roll. Off: 1 per full 4 points of Strength."],
    ["supportPerUnit", "Support per helper", "Support counts every friend next to the target. Off: a flat bonus however many."],
    ["flagHolder", "Flag holder (the flag is a fort)", "Any one friendly unit may stand on its own flag. Its HP pools with the flag's; hits are shared so both fall together; it can only be hit from the goal zone."],
    ["noKeeper", "No designated Flagkeeper", "Lineups have no keeper slot; a TKO needs every unit removed."],
    ["pullSupport", "Pull Support", "A pull gets +Support for every other friendly unit next to the flag."],
    ["zoneHardStop", "Zone of Control is a hard stop", "A unit that enters an enemy zone stops and may not move or swap again that turn. One that starts in a zone may still step out or shift 1."],
    ["holderHoldsHex", "A flag holder stays on its flag after a kill", "v3.1 fix (E1): a holder that kills an adjacent enemy does not step into the emptied hex."],
    ["poolAsOne", "The flag-and-holder pool is one number", "v3.1 fix (E2): a held flag falls only when the pool reaches 0. Shares are rounded only for display and when the holder leaves; the flag keeps the last half point."],
    ["simultaneousToActor", "A double knockout goes to the side that acted", "v3.1 fix (E3): if one action finishes both sides (e.g. the last attacker dies to parry), the side that acted wins."],
    ["parryNeedsSurvivor", "Dead units don't parry", "v3.2: parry fires only if the braced unit is still standing after the hit."],
    ["parryFirstOnly", "Parry once per enemy turn", "v3.2: a braced unit parries only the first adjacent attack against it each enemy turn. Ranged shots and Reach attacks never use it up. It is ready again when it next braces."],
    ["evade", "Evade (Light units)", "v3.3: after an adjacent attack that leaves the target standing, a unit with Evade may keep moving, each step further from the target, with its remaining movement, Stamina and Command. No attack, brace, pull or swap after."],
    ["tackleHexCost", "Tackle costs a hex", "v3.3: breaking tackle costs the leaving unit its own hex cost (Heavy 1, Light 0.5) instead of the flat tackle cost."],
    ["tackleUsesCap", "Tackle uses a hex of movement", "v3.3: breaking tackle also uses up one hex of the unit's movement cap."],
    ["doubleKoToTiebreak", "A double knockout goes to the tiebreaks", "v3.2: if one action finishes both sides, the turn-limit order decides: more pull damage, then less unit cap lost, then a draw."],
    ["turnLimitByFormat", "Turn limit per format", "v3.4: 5v5 and 7v7 each have their own turn limit (Turn limit, 5v5 / 7v7); other formats use Turn limit."]
  ];
  const CARD_FIELDS = [
    ["icon", "Icon", "icon"],
    ["hp", "HP", "num", 1], ["str", "Strength", "num", 1], ["range", "Range", "num", 1], ["armor", "Armor", "num", 1],
    ["dodge", "Dodge", "bool"], ["hexCost", "Stamina per hex", "num", 0.5], ["cap", "Max hexes", "num", 1], ["zone", "Zone of Control", "bool"],
    ["trait", "Trait", "trait"], ["brace", "When braced", "brace"], ["reload", "Reloads", "bool"], ["evade", "Evade", "bool"], ["beings", "Unit cap (UC)", "num", 1]
  ];
  function rsOptions(selected) {
    return Object.values(App.rulesets).sort((a, b) => a.name.localeCompare(b.name)).map((r) => `<option value="${esc(r.id)}" ${r.id === selected ? "selected" : ""}>${esc(r.name)}</option>`).join("");
  }
  function rsBar() {
    const inMatch = App.match && App.st && App.st.phase !== "over" ? `The match in progress uses its own copy of “${esc(App.match.rs.name)}”. Changes apply to the next match.` : "Changes apply to the next match you start.";
    return `<div class="rsbar"><label for="rs-pick" class="saved">Rule set</label><select id="rs-pick">${rsOptions(App.editId)}</select>
      <button class="btn primary" data-act="rs-save" ${App.dirty ? "" : "disabled"}>Save</button>
      <input type="text" id="rs-newname" placeholder="New set name" aria-label="New rule set name">
      <button class="btn" data-act="rs-saveas">Save as new set</button>
      <button class="btn" data-act="rs-revert" ${App.dirty ? "" : "disabled"}>Revert</button>
      <button class="btn danger" data-act="rs-delete" ${Object.keys(App.rulesets).length > 1 ? "" : "disabled"}>Delete set</button>
      <span id="rs-status" class="${App.dirty ? "dirty" : "saved"}">${App.dirty ? "Unsaved changes" : Store.mode === "db" ? "Saved with the board" : "Saved on this device only"}</span></div>
      <p class="note">${inMatch} Every match records the rule set it was played with.</p>`;
  }
  const sheetTabs = (on) => `<div class="seg" style="max-width:320px"><button type="button" data-act="go-units" aria-pressed="${on === "units"}">Unit data</button><button type="button" data-act="go-rules" aria-pressed="${on === "rules"}">Rules</button></div>`;
  function renderUnits() {
    const rs = App.edit, el = $("view-units");
    if (!rs) { el.innerHTML = ""; return; }
    let h = `<div class="scroll"><div class="wrap wide">${backbar("Unit data")}${sheetTabs("units")}${rsBar()}`;
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Code</th><th>Name</th>${CARD_FIELDS.map((f) => `<th>${f[1]}</th>`).join("")}</tr></thead><tbody>`;
    for (const code in rs.cards) {
      const c = rs.cards[code];
      if (!c.icon) c.icon = D.DEFAULT_ICON_BY_CODE[code] || "heavyMelee";
      h += `<tr><td><span style="display:inline-flex;gap:4px;align-items:center">${iconInline(c.icon, "var(--ink)", 16)} <b>${esc(code)}</b></span></td><td><input type="text" data-card="${code}" data-field="name" value="${esc(c.name)}" style="width:150px"></td>`;
      for (const [k, , type, step] of CARD_FIELDS) {
        if (type === "num") h += `<td><input type="number" min="0" step="${step}" data-card="${code}" data-field="${k}" value="${c[k]}"></td>`;
        else if (type === "bool") h += `<td><input type="checkbox" data-card="${code}" data-field="${k}" ${c[k] ? "checked" : ""} aria-label="${k}"></td>`;
        else { const opts = type === "trait" ? D.TRAITS : type === "icon" ? D.ICONS : D.BRACES; h += `<td><select data-card="${code}" data-field="${k}">${Object.keys(opts).map((o) => `<option value="${o}" ${o === c[k] ? "selected" : ""}>${esc(opts[o])}</option>`).join("")}</select></td>`; }
      }
      h += `</tr>`;
    }
    h += `</tbody></table></div>`;
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Brace benefit numbers</th><th>Value</th><th>What it does</th></tr></thead><tbody>
      <tr><td>Set spear damage</td><td><input type="number" min="0" step="1" data-top="spikeDamage" value="${rs.spikeDamage}"></td><td class="desc">A braced unit with “Set spear” hits the first enemy to enter a hex next to it, once per enemy turn.</td></tr>
      <tr><td>Parry damage</td><td><input type="number" min="0" step="0.5" data-top="parryDamage" value="${rs.parryDamage}"></td><td class="desc">A braced unit with “Parry” hits back an adjacent attacker that hits it. Used when Parry % is 0.</td></tr>
      <tr><td>Parry %</td><td><input type="number" min="0" step="1" data-top="parryPct" value="${rs.parryPct || 0}"></td><td class="desc">Parry as this share of the attacker's Strength, to the half point. 0 = use the flat number above.</td></tr></tbody></table></div>`;
    h += `<p class="note">Traits and brace benefits are picked from a list because each one is a rule in the engine. A new kind of trait or benefit needs a code change; any number here does not.</p></div></div>`;
    el.innerHTML = h;
  }
  function renderRules() {
    const rs = App.edit, el = $("view-rules");
    if (!rs) { el.innerHTML = ""; return; }
    let h = `<div class="scroll"><div class="wrap wide">${backbar("Rules")}${sheetTabs("rules")}${rsBar()}`;
    h += `<div class="formrow"><label>Set name<input type="text" data-top="name" value="${esc(rs.name)}" style="width:240px"></label><label>Note<input type="text" data-top="note" value="${esc(rs.note || "")}" style="width:min(520px,80vw)"></label></div>`;
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Number</th><th>Value</th><th>What it does</th></tr></thead><tbody>`;
    for (const [k, label, desc] of GAME_FIELDS) h += `<tr><td>${label}</td><td><input type="number" min="0" step="1" data-game="${k}" value="${rs.game[k] === undefined ? "" : rs.game[k]}"></td><td class="desc">${desc}</td></tr>`;
    h += `</tbody></table></div>`;
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Switch</th><th>On</th><th>What it does</th></tr></thead><tbody>`;
    for (const [k, label, desc] of SWITCHES) h += `<tr><td>${label}</td><td><input type="checkbox" data-switch="${k}" ${rs.switches[k] ? "checked" : ""} aria-label="${label}"></td><td class="desc">${desc}</td></tr>`;
    h += `</tbody></table></div><p class="note">Lineups are picked on the New game screens, not here.</p></div></div>`;
    el.innerHTML = h;
  }
  function markDirty() {
    App.dirty = true;
    document.querySelectorAll("#rs-status").forEach((s) => { s.textContent = "Unsaved changes"; s.className = "dirty"; });
    document.querySelectorAll('[data-act="rs-save"],[data-act="rs-revert"]').forEach((b) => (b.disabled = false));
  }
  function onSheetInput(e) {
    const t = e.target, rs = App.edit;
    if (!rs || !t.dataset) return;
    const num = () => { const v = parseFloat(t.value); return isNaN(v) || v < 0 ? null : v; };
    if (t.dataset.card) {
      const c = rs.cards[t.dataset.card], f = t.dataset.field;
      if (t.type === "checkbox") c[f] = t.checked;
      else if (t.type === "number") { const v = num(); if (v === null) return; c[f] = v; }
      else c[f] = t.value;
    } else if (t.dataset.game) { const v = num(); if (v === null) return; rs.game[t.dataset.game] = v; }
    else if (t.dataset.switch) rs.switches[t.dataset.switch] = t.checked;
    else if (t.dataset.top) { if (t.type === "number") { const v = num(); if (v === null) return; rs[t.dataset.top] = v; } else rs[t.dataset.top] = t.value; }
    else return;
    markDirty();
  }
  function validateRs(rs) {
    for (const k in rs.cards) { const c = rs.cards[k]; if (c.hp < 1 || c.cap < 1 || c.range < 1 || c.hexCost <= 0) return `${c.name}: HP, range, max hexes and Stamina per hex must be above 0.`; }
    if (!rs.name.trim()) return "Give the rule set a name.";
    return null;
  }
  async function saveRs(asNew) {
    const rs = E.clone(App.edit);
    if (asNew) {
      const nm = ($("rs-newname").value || "").trim();
      if (!nm) { toast("Type a name for the new set first."); return; }
      rs.name = nm; rs.id = nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Date.now().toString(36);
    }
    const err = validateRs(rs);
    if (err) { toast(err); return; }
    rs.updated = new Date().toISOString();
    App.rulesets[rs.id] = rs; App.editId = rs.id; App.edit = E.clone(rs); App.dirty = false;
    Store.local("editId", rs.id);
    renderSheets();
    try { await Store.saveRuleset(rs); toast(`Saved “${rs.name}”.`); } catch (e) { /* toast already shown */ }
  }

  // ---------- Opponent: brains ----------
  function renderOpponent() {
    const el = $("view-opponent"), b = App.brainEdit;
    if (!b) { el.innerHTML = ""; return; }
    const opts = Object.values(App.brains).sort((x, y) => x.name.localeCompare(y.name)).map((x) => `<option value="${esc(x.id)}" ${x.id === App.brainId ? "selected" : ""}>${esc(x.name)}</option>`).join("");
    let h = `<div class="scroll"><div class="wrap wide">${backbar("Opponent")}<p class="note">How the bot thinks. Each turn it tries every legal action, plays each one out on a scratch copy of the match, scores the result with the weights below, and takes the best. Higher weight means it cares more. It cannot break a rule: it only picks from what the engine allows. Skill and style sliders come with the Teams screen.</p>`;
    h += `<div class="rsbar"><label for="br-pick" class="saved">Brain</label><select id="br-pick">${opts}</select>
      <button class="btn primary" data-act="br-save" ${App.brainDirty ? "" : "disabled"}>Save</button>
      <input type="text" id="br-newname" placeholder="New brain name" aria-label="New brain name">
      <button class="btn" data-act="br-saveas">Save as new brain</button>
      <button class="btn" data-act="br-revert" ${App.brainDirty ? "" : "disabled"}>Revert</button>
      <button class="btn danger" data-act="br-delete" ${Object.keys(App.brains).length > 1 ? "" : "disabled"}>Delete brain</button>
      <span id="br-status" class="${App.brainDirty ? "dirty" : "saved"}">${App.brainDirty ? "Unsaved changes" : ""}</span></div>
      <p class="note">A match uses its own copy of the brain it started with. Changes apply to the next match.</p>`;
    const row = (group, k) => { const [label, desc] = BR.BRAIN_LABELS[k] || [k, ""]; return `<tr><td>${esc(label)}</td><td><input type="number" step="0.05" min="0" data-brain="${group}" data-field="${k}" value="${b[group][k]}"></td><td class="desc">${esc(desc)}</td></tr>`; };
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Weight</th><th>Value</th><th>What it means</th></tr></thead><tbody>${Object.keys(b.weights).map((k) => row("weights", k)).join("")}</tbody></table></div>`;
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Setting</th><th>Value</th><th>What it means</th></tr></thead><tbody>${Object.keys(b.settings).map((k) => row("settings", k)).join("")}</tbody></table></div></div></div>`;
    el.innerHTML = h;
  }
  function onBrainInput(e) {
    const t = e.target;
    if (!t.dataset.brain) return;
    const v = parseFloat(t.value); if (isNaN(v) || v < 0) return;
    App.brainEdit[t.dataset.brain][t.dataset.field] = v; App.brainDirty = true;
    const s = $("br-status"); s.textContent = "Unsaved changes"; s.className = "dirty";
    document.querySelectorAll('[data-act="br-save"],[data-act="br-revert"]').forEach((x) => (x.disabled = false));
  }
  async function saveBrain(asNew) {
    const b = E.clone(App.brainEdit);
    if (asNew) {
      const nm = ($("br-newname").value || "").trim();
      if (!nm) { toast("Type a name for the new brain first."); return; }
      b.name = nm; b.id = nm.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + Date.now().toString(36);
    }
    App.brains[b.id] = b; App.brainId = b.id; App.brainEdit = E.clone(b); App.brainDirty = false;
    renderOpponent();
    try { await Store.saveSet("brains", b); toast(`Saved “${b.name}”.`); } catch (e) { /* toast shown */ }
  }
  function renderSheets() { if (App.view === "units") renderUnits(); if (App.view === "rules") renderRules(); if (App.view === "opponent") renderOpponent(); }

  // ---------- Matches ----------
  /** The record Claude reads: the same fields for the current match and any finished one. */
  function recordText(m, result) {
    return JSON.stringify({ ruleset: m.rs, opts: m.opts, brains: m.brains, started: m.started, build: m.build || null, actions: m.actions, botMoves: m.botMoves || [], result: result || null }, null, 1);
  }
  /** A saved match's result, worked out by replaying its moves (summaries don't keep the engine's result). */
  function replayResult(m) {
    if (!m || !m.rs || !Array.isArray(m.actions)) return null;
    const st = E.newMatch(m.rs, m.opts);
    for (const a of m.actions) { const r = E.act(st, a, () => a.die); if (!r.ok) break; }
    return st.result;
  }
  async function loadMatches() { App.matches = await Store.matches(); if (App.view === "match") renderMatchView(); }
  function renderMatchView() {
    const el = $("view-match"), st = App.st, m = App.match;
    let h = `<div class="scroll"><div class="wrap wide">${backbar("Matches", m && st ? "play" : "home")}`;
    if (m && st) {
      const status = st.phase === "over" ? (st.result.winner ? `${esc(st.names[st.result.winner])} won, ${esc(say(st.result.how))}` : "Draw") : st.phase === "deploy" ? "Deploying" : `Turn ${st.turn}, ${sideName(st.toMove)} to move`;
      const pl = (t) => (isBot(t) ? "bot (" + esc(brainOf(t).name) + ")" : "human");
      h += `<div class="card"><h3>Current match</h3><p class="note">${esc(st.names.N)} (North, ${pl("N")}) vs ${esc(st.names.S)} (South, ${pl("S")}) · ${esc(m.rs.name)}${esc(buildNote(m))}${m.opts.format ? " · " + esc(formatOf(m.opts.format).label) : ""}${m.opts.seed ? ` · seed <span class="num">${esc(m.opts.seed)}</span>` : ""} · started ${new Date(m.started).toLocaleString()} · ${status}</p>
        <div class="actions"><button class="btn" data-act="copy-record">Copy match record for Claude</button>${st.phase === "play" && !isBot(st.toMove) ? `<button class="btn danger" data-act="surrender">${sideName(st.toMove)} surrenders</button>` : ""}</div>
        <textarea id="record" class="copyarea" readonly hidden></textarea></div>`;
      let lg = "";
      for (const l of st.log) lg += l.kind === "turn" ? `<div class="t">${esc(say(l.text))}</div>` : `<div>${esc(say(l.text))}</div>`;
      h += `<div><h3>Full log</h3><div class="fulllog">${lg || "Nothing yet."}</div></div>`;
    }
    h += `<div class="card"><h3>Finished matches</h3>`;
    if (!App.matches.length) h += `<p class="note">None saved yet.</p>`;
    else {
      h += `<div class="tablewrap"><table class="data"><thead><tr><th></th><th>Finished</th><th>Rule set</th><th>Result</th><th>Turn</th><th>Pull damage N–S</th><th>Unit cap lost N–S</th></tr></thead><tbody>`;
      for (const x of App.matches) h += `<tr><td><button type="button" class="iconbtn" data-act="copy-finished" data-id="${esc(x.id)}" aria-label="Copy this match's record for Claude" title="Copy match record">${ic("copy", 18)}</button></td><td>${x.finished ? new Date(x.finished).toLocaleDateString() : ""}</td><td>${esc(x.ruleset)}${x.build ? `<br><span class="muted">Build ${esc(String(x.build))}</span>` : ""}</td><td>${x.how === "abandoned" ? "Abandoned" : x.winner ? esc(x.names ? x.names[x.winner] : sideName(x.winner)) + " (" + sideName(x.winner) + "), " + esc(say(x.how)) : "Draw, " + esc(say(x.how))}</td><td class="num">${x.turn}</td><td class="num">${x.pull ? x.pull.N + "–" + x.pull.S : ""}</td><td class="num">${x.lost ? x.lost.N + "–" + x.lost.S : ""}</td></tr>`;
      h += `</tbody></table></div><textarea id="record-finished" class="copyarea" readonly hidden></textarea>`;
    }
    h += `</div></div></div>`;
    el.innerHTML = h;
  }

  // ---------- Wiring ----------
  function wire() {
    $("board").addEventListener("click", (e) => { if (App.ui.suppressClick) return; const g = e.target.closest("[data-hex]"); if (g) onBoardTap(g.dataset.hex); });
    $("board").addEventListener("pointerdown", onPointerDown);
    // A finger that starts on one of your units drags it instead of scrolling the field.
    $("board").addEventListener("touchstart", (e) => { if (App.ui.drag) e.preventDefault(); }, { passive: false });
    $("board").addEventListener("touchmove", (e) => { if (App.ui.drag) e.preventDefault(); }, { passive: false });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", () => { if (App.ui.drag && App.ui.drag.active) { App.ui.drag = null; App.ui.ghost = null; render(); } else App.ui.drag = null; });
    $("fieldscroll").addEventListener("scroll", () => requestAnimationFrame(updateEdges), { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(updateEdges));
    $("namesbtn").innerHTML = ic("grid", 20); $("namesbtn").dataset.act = "names";
    $("edgeTop").dataset.act = "edge-top"; $("edgeBottom").dataset.act = "edge-bottom";
    $("scrim").addEventListener("click", () => { App.ui.sheet = null; App.ui.armed = null; render(); });
    document.body.addEventListener("click", (e) => {
      const s = e.target.closest("[data-seg]"); if (s && !s.disabled) { onSeg(s.dataset.seg, s.dataset.val); return; }
      const b = e.target.closest("[data-act]"); if (b && !b.disabled) { onAction(b.dataset.act, b); return; }
      const row = e.target.closest("#roster tr[data-uid]");
      if (row && App.st && App.st.phase !== "deploy") { Object.assign(App.ui, { sel: row.dataset.uid, ghost: null, armed: null, sheet: null }); render(); const u = E.unitByUid(App.st, row.dataset.uid); if (u) revealHex(u.hex); }
    });
    $("view-setup").addEventListener("input", onSetupInput);
    $("view-setup").addEventListener("change", onSetupInput);
    $("view-teams").addEventListener("change", (e) => { onSetupInput(e); if (e.target.dataset.setup && e.target.dataset.setup.startsWith("brain-")) renderTeams(); });
    $("view-lineup").addEventListener("change", (e) => { if (e.target.dataset.keeper) { App.picks[App.lineupSide].keeper = e.target.value; renderLineup(); } });
    ["view-units", "view-rules"].forEach((id) => { $(id).addEventListener("input", onSheetInput); $(id).addEventListener("change", (e) => {
      if (e.target.id === "rs-pick") {
        if (App.dirty) { e.target.value = App.editId; toast("Save or revert your changes before switching sets."); return; }
        App.editId = e.target.value; App.edit = E.clone(App.rulesets[App.editId]); Store.local("editId", App.editId); renderSheets(); return;
      }
      if (e.target.tagName === "SELECT") onSheetInput(e);
    }); });
    $("view-opponent").addEventListener("input", onBrainInput);
    $("view-opponent").addEventListener("change", (e) => {
      if (e.target.id !== "br-pick") return;
      if (App.brainDirty) { e.target.value = App.brainId; toast("Save or revert your changes before switching brains."); return; }
      App.brainId = e.target.value; App.brainEdit = E.clone(App.brains[App.brainId]); renderOpponent();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && App.view === "play" && App.ui.sheet && App.ui.sheet.kind !== "over") { App.ui.sheet = null; App.ui.armed = null; render(); } });
    window.addEventListener("beforeunload", (e) => { if (App.dirty || App.brainDirty) { e.preventDefault(); e.returnValue = ""; } });
  }

  // ---------- Start-up ----------
  async function boot() {
    wire();
    App.ui.names = !!Store.local("names");
    App.brains = E.clone(BR.DEFAULT_BRAINS); App.brainId = "standard"; App.brainEdit = E.clone(App.brains.standard);
    App.rulesets = { [D.DEFAULT_RULESET.id]: E.clone(D.DEFAULT_RULESET) };
    for (const p of D.PRESETS || []) App.rulesets[p.id] = E.clone(p);
    App.editId = D.DEFAULT_RULESET.id; App.edit = E.clone(D.DEFAULT_RULESET);
    show("home");
    await Store.init();
    Object.assign(App.brains, await Store.sets("brains"));
    App.brainEdit = E.clone(App.brains[App.brainId]);
    const saved = await Store.rulesets();
    if (Object.keys(saved).length) {
      // A saved copy of the default set from before the 7v7 cards keeps its numbers but gains the missing cards.
      for (const id in saved) for (const code in D.DEFAULT_RULESET.cards) if (id === D.DEFAULT_RULESET.id && !saved[id].cards[code]) saved[id].cards[code] = E.clone(D.DEFAULT_RULESET.cards[code]);
      const presets = {}; for (const p of D.PRESETS || []) presets[p.id] = E.clone(p);
      App.rulesets = Object.assign({ [D.DEFAULT_RULESET.id]: E.clone(D.DEFAULT_RULESET) }, presets, saved);
      const want = Store.local("editId");
      App.editId = App.rulesets[want] ? want : D.DEFAULT_RULESET.id;
      App.edit = E.clone(App.rulesets[App.editId]);
    }
    const live = await Store.live();
    if (live && live.rs && Array.isArray(live.actions)) App.live = live;
    if (App.view === "home") renderHome();
    loadMatches();
  }
  boot();
})();
