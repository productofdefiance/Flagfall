/* Flagfall Arena — board app: screens, drawing, taps, data sheets and storage.
   Rules live in engine.js, numbers in the rule set (data.js / saved sets), looks in skin.js, the bot in bot.js + brain.js.
   Screens: Home → Settings → Lineup (one per human side) → Play. Data screens: Unit data, Rules, Opponent, Matches.
   Planned, not built: a Teams screen between Settings and Lineup (culture and era, bot skill and style). */
(function () {
  "use strict";
  const E = window.GGEngine, D = window.GGData, SK = window.GGSkin, Bot = window.GGBot, BR = window.GGBrain;
  const V = window.GGVersion || { game: null, build: null, preview: null };   // game version and build number: board/version.js is the only source
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const UI = window.GGUi;   // UI v2 wording and preview logic (Brief 009); its say() turns engine text into what the player reads
  const say = UI.say;
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
    root.setProperty("--num", SK.fonts.num);
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
    list: '<path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/>',
    // UI v2 (Brief 009)
    menu: '<path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    lowflag: '<path d="M6 21V4"/><path d="M6 12h11l-2.5 4L17 20H6"/><path d="M3 21h6"/>',
    book: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
    maul: '<path d="M19.5 19.5 11.5 11.5"/><path d="M7.8 2.9l5.3 5.3-4.9 4.9-5.3-5.3z"/><path d="M6.3 4.4l5.3 5.3"/>',
    support: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9" r="2.4"/><path d="M16 14.3c2.3.1 4.1 1.6 4.6 4.2"/>',
    evade: '<path d="M14 12H3.5"/><path d="M7.5 8l-4 4 4 4"/><path d="M18 6.5v2"/><path d="M18 15.5v2"/><path d="M21.5 12h-2"/><path d="M20.5 8.5l-1.2 1.2"/><path d="M20.5 15.5l-1.2-1.2"/>',
    armor: '<path d="M8.5 4h7l3.5 3-2 3.2V20H7V10.2L5 7z"/><path d="M10 4c.3 2.2 3.7 2.2 4 0"/><path d="M7 14h10"/>',
    dodge: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z" stroke-dasharray="3 2.6"/>',
    parry: '<path d="M4 20 18 6"/><path d="M15 4h5v5"/><path d="M6 15l3 3"/><path d="M20 20 6 6"/><path d="M9 4H4v5"/><path d="M18 15l-3 3"/>',
    arrow: '<path d="M5 12h12"/><path d="M13 7l5 5-5 5"/>',
    // Approved UI v3 (Brief 017)
    mark: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><path d="M12 6.5v2.8"/><path d="M10.8 8.2 12 9.4l1.2-1.2"/><path d="M12 17.5v-2.8"/><path d="M10.8 15.8 12 14.6l1.2 1.2"/><path d="M6.8 12h2.6"/><path d="M8.3 10.8 9.5 12l-1.2 1.2"/><path d="M17.2 12h-2.6"/><path d="M15.7 10.8 14.5 12l1.2 1.2"/>',
    setspear: '<path d="M4.5 20.5 16 9"/><path d="M14.2 6.2 19.8 4.2l-2 5.6-2.4.2-1.4-1.4z"/><path d="M3 20.5h8"/><path d="M8.5 16.5l2 2"/>'
  };
  P.sword = P.attack; P.spear = P.reach; P.shield = P.brace;
  function ic(name, size, color, extra, sw) {
    return `<svg width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="${color || "currentColor"}" stroke-width="${sw || 1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ""}>${P[name]}</svg>`;
  }

  /** Brief 017 §9: "Pick one of your own units", just above the unit panel, gone after 2 seconds or on the next tap. */
  function pickNote() {
    const t = $("picknote"); if (!t) return;
    t.textContent = "Pick one of your own units"; t.hidden = false;
    clearTimeout(pickNote._t); pickNote._t = setTimeout(() => (t.hidden = true), 2000);
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
      if (match.watch) return Promise.resolve();   // a watched sim game (Brief 008) never replaces your own live match
      match.updated = new Date().toISOString();
      this.local("live", match);
      return this.write("live/current", { match }).catch(() => {});
    },
    summary(match, st, how, winner) {
      return { id: match.id, started: match.started, finished: new Date().toISOString(), ruleset: match.rs.name, game: match.game || null, build: match.build || null, format: match.opts.format || null,
        names: match.opts.names, winner, how, turn: st.turn, seed: match.opts.seed || null,
        pull: { N: st.pole.S, S: st.pole.N }, lost: { N: E.beingsLost(st, "N"), S: E.beingsLost(st, "S") } };
    },
    saveFinished(match, st) {
      if (match.watch) return Promise.resolve();
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
  // The formats and the bot's lineups live in watch.js (Brief 008), so a simulated game and the board set up a match the same way.
  const WT = window.GGWatch;
  const FORMATS = WT.FORMATS;
  const formatOf = WT.formatOf;
  const noKeeper = (rs) => !!(rs.switches && rs.switches.noKeeper);
  const balancedCounts = WT.balancedCounts;
  /** Lineup in the engine's form: FK first, then each card; repeats get a number (HM, HM2). */
  const toLineup = WT.toLineup;
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
      players: { N: { type: "human", name: "North", mix: "open" }, S: { type: "bot", brainId: "brain5", name: "South", mix: "open" } } };
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
      App.ui.scrollTo = fld().FLAG[t];
    } else {
      App.ui.cover = bothHuman() ? { kind: "start" } : null;
      App.ui.scrollTo = fld().centre;
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
    App.match = { id: "m" + Date.now().toString(36), started: new Date().toISOString(), game: V.game || null, build: V.build, rs: E.clone(rs),
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

  // ---------- Watch a simulated game (Brief 008) ----------
  /** Open a "?watch=" link: a Computer vs Computer match set up from its seed, brains, rule set, format and lineups
      exactly as a simulated game was, using the board's built-in brains. If this board can't play it exactly, say so. */
  async function startWatch(spec, fast) {
    const why = WT.problem(spec, V.game);
    if (why) { await dialog(`<h2>Can't play this game here</h2><p class="note">${esc(why)} This board would play a different game, so it won't start one. Open the board of the version it was simulated on (${esc(spec.v || "unknown")}).</p><button class="btn primary" data-dlg="ok">OK</button>`); return; }
    if (spec.v && V.game && spec.v !== V.game) {
      const go = await confirmBox("A different version", `This game was simulated on ${spec.v}; this board is ${V.game}. If a brain or rule changed in between, it will play differently from the simulation.`, "Watch anyway");
      if (!go) return;
    }
    App.match = WT.setupMatch(spec, { id: "w" + Date.now().toString(36), started: new Date().toISOString(), game: V.game || null, build: V.build });
    App.match.opts.names = { N: "North", S: "South" };
    if (fast) for (const t of ["N", "S"]) App.match.brains[t].settings.pauseMs = 0;   // the board check only: pauses never change a choice
    rebuild();
    resetUi();
    beginDeploy();
    toast(`Watching a simulated game: seed ${spec.seed}`);
    show("play");
  }
  // For the board check (sims/lab/board_check.js): what the board has played so far.
  window.GGWatchState = () => ({ actions: App.match ? App.match.actions : [], over: !!(App.st && App.st.phase === "over"), result: App.st ? App.st.result : null });

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
  /** Why Undo is unavailable (Undo is a board feature, not a rule: it can't take back a roll of the dice). */
  function undoWhy() {
    const a = App.match && App.match.actions[App.match.actions.length - 1];
    if (!a || a.type === "deploy") return "Nothing to undo this turn";
    if (a.type === "end") return "Can't undo past the start of the turn";
    if (["attack", "pull"].includes(a.type)) return "Can't undo an attack or pull: the dice have been rolled";
    return null;
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
    if (v !== "lineup" && App.lineupCard) { App.lineupCard = null; renderLineupCard(); }
    if (v !== "play" && App.ui.menu) { App.ui.menu = false; renderMenu(); }
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
  /** "Playtest board · v3.06.00 · Rules v3.4"; a preview copy also says which pull request it is (version.js). */
  function homeLine() {
    const newest = D.PRESETS && D.PRESETS.length ? D.PRESETS[D.PRESETS.length - 1].id : D.DEFAULT_RULESET.id;
    return V.line ? V.line(newest) : `Playtest board · Rules ${newest}`;
  }
  /** " · v3.06.00", plus what a match was started on when that differs: its game version, or "Build 6" for matches
      saved before Build 7 (never a guessed version). */
  function buildNote(m) { return V.note ? V.note(m) : ""; }
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
      p.type = val; if (val === "bot" && !App.brains[p.brainId]) p.brainId = "brain5";
    } else if (name === "keeper") { App.picks[App.lineupSide].keeper = val; renderLineup(); return; }
    else if (name.startsWith("mix-")) { s.players[name.slice(4)].mix = val; Store.local("setup", s); renderTeams(); return; }
    Store.local("setup", s);
    renderSetup();
  }
  function setupNext() {
    const s = App.setup;
    if (!s.seed) s.seed = E.makeSeed();
    for (const t of ["N", "S"]) if (!s.players[t].mix) s.players[t].mix = "open";
    if (s.players.N.type === "bot" && !App.brains[s.players.N.brainId]) s.players.N.brainId = "brain5";
    if (s.players.S.type === "bot" && !App.brains[s.players.S.brainId]) s.players.S.brainId = "brain5";
    show("teams");
  }

  // ---------- Teams (test version: mix only; era and culture come later) ----------
  const MIXES = [["heavy", "Heavy"], ["light", "Light"], ["mixed", "Mixed"], ["open", "Open"], ["random", "Random"]];
  const PERSONALITY = ["Aggression", "Speed vs Strength", "Close vs Far", "Flag vs Fight", "Together vs Spread"];
  /** Card counts for a mix. Heavy and Light fill the slots in turn (HM, HA, HR or LM, LA, LR), so 7 gives 3-2-2.
      Open: a bot fields its kit's own squad (or the balanced lineup); a human keeps its last lineup. Random draws from the seed. */
  function mixPick(rs, size, mix, t, p) {
    if (mix === "open" && p.type !== "bot") {
      const noK = noKeeper(rs), prev = (Store.local("picks") || {})[App.setup.format + ":" + t];
      return prev && (noK ? !prev.keeper : rs.cards[prev.keeper]) && beingsOf(rs, prev) === size && Object.keys(prev.counts).every((c) => rs.cards[c]) ? E.clone(prev) : balancedCounts(rs, size);
    }
    return WT.mixCounts(rs, size, mix, App.setup.seed, t, App.brains[p.brainId]);
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
      else hint = countsText(mixPick(rs, size, mix, t, p)) + (mix === "open" ? " (the brain's choice)" : "");
      return `<div class="side" style="border-color:${col}"><span class="nm" style="color:${col}">${p.type === "bot" ? "BOT" : (p.name && p.name !== sideName(t) ? esc(p.name).toUpperCase() : "HUMAN")} · ${sideName(t).toUpperCase()}</span>
        <span class="hint">Era and culture come later. Test units for now.</span>
        <span class="lab">Mix</span>${seg("mix-" + t, MIXES, mix).replace('class="seg"', 'class="seg wrap"')}<span class="hint">${hint}${p.type === "human" && mix !== "open" ? " You can adjust it on the next screen." : ""}</span>
        ${p.type === "bot" ? `<label class="lab" for="kit-${t}">Brain</label><select class="inp" id="kit-${t}" data-setup="brain-${t}">${brainOpts(p.brainId)}</select>
        <span class="lab">Personality</span>${PERSONALITY.map((n) => `<label class="hint" style="display:flex;align-items:center;gap:8px;justify-content:space-between">${n}<input type="range" min="1" max="5" value="3" disabled style="width:50%"></label>`).join("")}
        <span class="hint">Personality sliders are not built yet; the middle notch is the brain as it is.</span>` : ""}</div>`;
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
  /** The − / count / + stepper for one card, as on the Lineup row and the card's pinned bar. */
  function stepper(rs, pick, code, used, size) {
    const c = rs.cards[code], n = pick.counts[code] || 0;
    return `<span class="stepper"><button type="button" class="step-btn" data-act="pick-minus" data-card="${code}" aria-label="One fewer ${esc(c.name)}" ${n ? "" : "disabled"}>−</button>
        <span class="cnt" aria-label="${n} ${esc(c.name)}">${n}</span>
        <button type="button" class="step-btn" data-act="pick-plus" data-card="${code}" aria-label="One more ${esc(c.name)}" ${used + (c.beings || 1) <= size ? "" : "disabled"}>+</button></span>`;
  }
  /** The unit card over the Lineup screen (Brief 009 §5): the card's base numbers, its abilities, and a pinned bar with a live stepper. */
  function renderLineupCard() {
    const el = $("lsheet"), dim = $("lscrim"), code = App.lineupCard;
    if (!code || App.view !== "lineup" || !App.picks[App.lineupSide]) { el.hidden = true; dim.hidden = true; return; }
    const s = App.setup, t = App.lineupSide, rs = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET, size = formatOf(s.format).size;
    const c = rs.cards[code]; if (!c) { App.lineupCard = null; el.hidden = true; dim.hidden = true; return; }
    const pick = App.picks[t], used = beingsOf(rs, pick), r = UI.rangeStat(c);
    const keepScroll = el.querySelector(".ls-body") ? el.querySelector(".ls-body").scrollTop : 0;
    el.innerHTML = `<div class="ls-body card-sheet">${unitCardHtml(rs, code, { team: t, closeAct: "lineup-card-close",
        stats: [["HP", fmt(c.hp)], ["Str", fmt(c.str)], [r.label, fmt(r.val)], ["Move", fmt(c.cap)], ["Stamina", fmt(c.stamina !== undefined ? c.stamina : rs.game.stamina)]] })}</div>
      <div class="ls-bar" style="background:var(--${t === "N" ? "northArc" : "southArc"});border-top-color:${teamColor(t)}">
        <div><div class="ls-1">IN YOUR LINEUP</div><div class="ls-2">${used} of ${size} unit cap</div></div>${stepper(rs, pick, code, used, size)}</div>`;
    const wasHidden = el.hidden;
    el.hidden = false; dim.hidden = false;
    el.querySelector(".ls-body").scrollTop = keepScroll;
    if (wasHidden) { const b = el.querySelector('[data-act="lineup-card-close"]'); if (b) b.focus(); }
  }
  function renderLineup() {
    const s = App.setup, t = App.lineupSide, rs = App.rulesets[s.rulesetId] || D.DEFAULT_RULESET, size = formatOf(s.format).size;
    const pick = App.picks[t], col = teamColor(t), used = beingsOf(rs, pick);
    const kc = pick.keeper ? rs.cards[pick.keeper] : null;
    const cards = Object.keys(rs.cards);
    const pips = Array.from({ length: size }, (_, i) => `<span class="${i < used ? "on" : ""}" style="${i < used ? `background:${col}` : ""}"></span>`).join("");
    const rows = cards.map((code) => {
      const c = rs.cards[code], n = pick.counts[code] || 0, open = App.lineupCard === code;
      return `<div class="urow ${n || open ? "on" : ""}" style="${n || open ? `border-color:${col}` : ""}">
        <button type="button" class="urow-open" data-act="lineup-card" data-card="${code}" aria-label="${esc(c.name)}: unit card">${tokenInline(iconKey(rs, code), t, 30)}
        <span style="flex:1;min-width:0"><span class="nm">${esc(c.name)}</span><span class="st">${esc(UI.lineupStats(c))}</span></span></button>
        ${stepper(rs, pick, code, used, size)}</div>`;
    }).join("");
    const last = App.lineupQueue[App.lineupQueue.length - 1] === t;
    $("view-lineup").innerHTML = `<div class="scroll" style="display:flex;flex-direction:column"><div class="wrap" style="flex:1">
      ${backbar(sideName(t) + " lineup", "teams")}${steps(3)}
      <div class="counter"><div class="row" style="justify-content:space-between"><span class="lab" style="font:600 13px/1 var(--body)">Unit cap (UC)</span><span class="num" style="font:600 15px/1 var(--num)">${used}/${size}</span></div><div class="pips">${pips}</div></div>
      ${kc ? `<div class="field"><label for="keeper-pick">Flagkeeper</label>
        <div class="keeper">${tokenInline(iconKey(rs, pick.keeper), t, 34, true)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          <select class="inp" id="keeper-pick" data-keeper="1" style="height:40px;font-weight:600">${cards.map((c) => `<option value="${c}" ${c === pick.keeper ? "selected" : ""}>${esc(rs.cards[c].name)}</option>`).join("")}</select>
          <span class="hint">${statLine(kc)}. Moves ${E.capOf({ rs }, { card: pick.keeper, fk: true })} as keeper.</span></div></div></div>` : ""}
      <div class="field"><span class="lab">Units</span><span class="hint">${kc ? `Pick ${size - 1} more.` : `Pick ${size}. Any unit can hold the flag: place it on the flag hex when you deploy.`} Repeats are allowed.</span><div class="urows">${rows}</div></div>
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
  /* The field comes from the match (Brief 014): its size, positions and hex names. fld() is the match's field; the
     drawing is as wide as its columns (14 R for 9 columns) and as tall as its middle column (19 H for 19 rows). */
  const fld = () => E.fieldOf(App.st);
  const boardW = () => (1.5 * (fld().NCOL - 1) + 2) * R + 2 * PAD, boardH = () => fld().NROW * H + 2 * PAD;
  function pos(h) {
    const G = fld(), [q, r] = G.parse(h); const [gx, gy] = G.geo(q, r);
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
  const isReachShot = (st, u, t) => E.card(st, u).trait === "reach" && E.card(st, u).range === 1 && E.fieldOf(st).dist(u.hex, t.hex) === 2;
  function targetsFor(o, kind) {
    const st = App.st, u = E.unitByUid(st, App.ui.sel);
    return o.attacks.filter((a) => { const r = isReachShot(st, u, E.unitByUid(st, a.target)); return kind === "reach" ? r : kind === "attack" ? !r : true; });
  }

  // ---------- Drawing: field (Approved UI v3, Brief 017) ----------
  /* Every hex, route, range, number and badge comes from an engine function (route, rangeHexes, canAttackAfter,
     evadeHexes, killConsequences, enemyPreview, options, status). Nothing here works out a rule. While drawing, the field
     notes each kind of mark it puts on screen (App.ui.keyRows) so the key lists only what is there. */
  /** The side whose marks are blue: the side to move in a two-player game, the human against the bot. */
  function viewer() {
    const st = App.st;
    if (!st || st.phase !== "play") return st ? st.toMove : "N";
    if (bothHuman() || (isBot("N") && isBot("S"))) return st.toMove;
    return isBot("N") ? "S" : "N";
  }
  const AP = Math.sqrt(3) / 2;   // a hex's apothem per unit of radius
  /** The enemy unit the human tapped (section 9), or null. */
  function enemyTapped() {
    const st = App.st, sel = App.ui.sel && E.unitByUid(st, App.ui.sel);
    if (!sel || sel.hp <= 0 || st.phase !== "play") return null;
    const v = viewer();
    return sel.team !== v && !(isBot(v) && isBot(E.foeOf(v))) ? sel : null;
  }
  /** The move being previewed (first tap or hover): the engine's route, or null. */
  function previewRoute() {
    const st = App.st, ui = App.ui, o = selOptions();
    if (!o || ui.armed || !ui.ghost || !o.moves[ui.ghost]) return null;
    return E.route(st, ui.sel, ui.ghost);
  }
  /** Hex at a pixel position (to find the neighbour across an edge). */
  function hexByPos() {
    const m = {};
    for (const h of fld().CELLS) { const [x, y] = pos(h); m[Math.round(x) + "," + Math.round(y)] = h; }
    return (x, y) => m[Math.round(x) + "," + Math.round(y)] || null;
  }
  /** Edge i of a hex at inset `d` px inside its edge: [x1, y1, x2, y2]. Edge i runs from corner i to corner i+1. */
  function edgeAt(x, y, i, d) {
    const r = R - d / AP, a1 = (Math.PI / 3) * i, a2 = (Math.PI / 3) * (i + 1);
    return [x + r * Math.cos(a1), y + r * Math.sin(a1), x + r * Math.cos(a2), y + r * Math.sin(a2)];
  }
  /** The outer edge of a set of hexes, drawn `d` px inside: one path. */
  function outlinePath(set, d) {
    const at = hexByPos(); let p = "";
    for (const h of set) {
      const [x, y] = pos(h);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6, nb = at(x + H * Math.cos(a), y + H * Math.sin(a));
        if (nb && set.has(nb)) continue;
        const e = edgeAt(x, y, i, d);
        p += `M${e[0].toFixed(1)} ${e[1].toFixed(1)}L${e[2].toFixed(1)} ${e[3].toFixed(1)}`;
      }
    }
    return p;
  }
  /** The range outline (sections 3 and 9): Ranged = the outer edge of the set; Reach = its six spokes, each outlined;
      melee-only = nothing. Returns { svg, lined: hexes that carry the line }. */
  function rangeOutline(st, u, from, color) {
    const c = E.card(st, u), G = E.fieldOf(st), hexes = E.rangeHexes(st, u.uid, from, "normal");
    if (c.range > 1) {
      const set = new Set(hexes), at = hexByPos(), lined = new Set();
      for (const h of set) { const [x, y] = pos(h); for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i + Math.PI / 6, nb = at(x + H * Math.cos(a), y + H * Math.sin(a)); if (!nb || !set.has(nb)) lined.add(h); } }
      return { svg: `<path d="${outlinePath(set, 1.2)}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" pointer-events="none"/>`, lined };
    }
    if (c.trait === "reach") {
      const spokes = hexes.filter((h) => G.dist(from, h) === 2);
      return { svg: spokes.map((h) => { const [x, y] = pos(h); return `<polygon points="${hexPts(x, y, R - 1.2 / AP)}" fill="none" stroke="${color}" stroke-width="1.6" pointer-events="none"/>`; }).join(""), lined: new Set(spokes) };
    }
    return { svg: "", lined: new Set() };
  }
  /** The special's range: a double line in every hex (3px at 1.8 inside + 1.2px at 5.8; 3px further in where the hex
      also carries the range line). */
  function specialOutline(st, u, from, color, lined) {
    return E.rangeHexes(st, u.uid, from, "special").map((h) => {
      const [x, y] = pos(h), k = lined.has(h) ? 3 : 0;
      return `<polygon points="${hexPts(x, y, R - (1.8 + k) / AP)}" fill="none" stroke="${color}" stroke-width="3" pointer-events="none"/><polygon points="${hexPts(x, y, R - (5.8 + k) / AP)}" fill="none" stroke="${color}" stroke-width="1.2" pointer-events="none"/>`;
    }).join("");
  }
  /** A ring with a white underlay 2.5px wider (every ring and line over the field holds on any fill). */
  function ring(x, y, r, color, w, dash) {
    const da = dash ? ` stroke-dasharray="${dash}"` : "";
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width="${w + 2.5}"${da} pointer-events="none"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}"${da} pointer-events="none"/>`;
  }
  /* Badges (section 6): one pill, one spot per kind on a hex's sloped edges, 86% of the way out. */
  const BADGE = { mark: 330, spear: 210, noattack: 30, tackle: 150 };
  const BADGE_ICON = {
    mark: '<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><path d="M12 6.5v2.8"/><path d="M10.8 8.2 12 9.4l1.2-1.2"/><path d="M12 17.5v-2.8"/><path d="M10.8 15.8 12 14.6l1.2 1.2"/><path d="M6.8 12h2.6"/><path d="M8.3 10.8 9.5 12l-1.2 1.2"/><path d="M17.2 12h-2.6"/><path d="M15.7 10.8 14.5 12l1.2 1.2"/>',
    spear: '<path d="M4.5 20.5 16 9"/><path d="M14.2 6.2 19.8 4.2l-2 5.6-2.4.2-1.4-1.4z"/><path d="M3 20.5h8"/><path d="M8.5 16.5l2 2"/>',
    noattack: P.attack + '<path d="M4 4l16 16" stroke-width="3.6"/>'
  };
  function badge(h, kind, amount) {
    const [cx, cy] = pos(h), a = (BADGE[kind] * Math.PI) / 180, k = 0.86 * AP * R;
    return pill(cx + k * Math.cos(a), cy + k * Math.sin(a), kind, amount);
  }
  function pill(x, y, kind, amount) {
    const wide = kind === "tackle", w = wide ? 30 : 19;
    const fill = kind === "spear" ? "var(--attack)" : kind === "noattack" ? "#f8f9f5" : "var(--ink)";
    const fg = kind === "noattack" ? "var(--muted)" : "#fff", edge = kind === "noattack" ? "var(--muted)" : "#fff";
    let g = `<g pointer-events="none"><rect x="${(x - w / 2).toFixed(1)}" y="${(y - 7.5).toFixed(1)}" width="${w}" height="15" rx="7.5" fill="${fill}" stroke="${edge}" stroke-width="1.2"/>`;
    if (wide) g += `<text x="${x.toFixed(1)}" y="${(y + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="var(--num)">+${fmt(amount)}</text>`;
    else g += `<g transform="translate(${(x - 6).toFixed(1)} ${(y - 6).toFixed(1)}) scale(0.5)" fill="none" stroke="${fg}" color="${fg}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${BADGE_ICON[kind]}</g>`;
    return g + `</g>`;
  }
  /** The route line: white underlay, blue line, one arrowhead at the middle of its length. */
  function routeLine(pts, color) {
    const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
    let out = `<path d="${d}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/><path d="${d}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"/>`;
    return out;
  }
  function arrowHead(pts, color) {
    const seg = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); total += l; }
    let half = total / 2, i = 0;
    while (i < seg.length - 1 && half > seg[i]) { half -= seg[i]; i++; }
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], f = seg[i] ? half / seg[i] : 0, mx = x1 + (x2 - x1) * f, my = y1 + (y2 - y1) * f;
    const ang = Math.atan2(y2 - y1, x2 - x1), c = Math.cos(ang), s = Math.sin(ang), L = 10, W = 13;
    const tip = [mx + c * L / 2, my + s * L / 2], b1 = [mx - c * L / 2 - s * W / 2, my - s * L / 2 + c * W / 2], b2 = [mx - c * L / 2 + s * W / 2, my - s * L / 2 - c * W / 2];
    return `<polygon points="${[tip, b1, b2].map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="${color}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" pointer-events="none"/>`;
  }
  /** The tapped unit's token at 60% with a dashed edge (the ghost on the end hex). */
  function ghostToken(st, u, h) {
    const [x, y] = pos(h);
    return `<g pointer-events="none"><circle cx="${x}" cy="${y}" r="${tr}" fill="${teamColor(u.team)}" fill-opacity="0.6" stroke="${teamColor(u.team)}" stroke-width="1.5" stroke-dasharray="3 2"/>${iconShape(iconKey(st.rs, u.card), x, y - 3.5, tr * 0.33, "#fff", 1.6)}</g>`;
  }
  /** Note a key row for what is on screen (section 10): kind, then the sentence for this exact mark. */
  function keyNote(kind, line) { const k = App.ui.keyRows; if (k && !k.some((r) => r.kind === kind && r.line === line)) k.push({ kind, line }); }
  function renderBoard() {
    const st = App.st, ui = App.ui, svg = $("board");
    svg.setAttribute("viewBox", `0 0 ${boardW().toFixed(0)} ${boardH().toFixed(0)}`);
    ui.keyRows = [];
    const arcs = { N: new Set(E.deployZone(st, "N")), S: new Set(E.deployZone(st, "S")) };
    const dTeam = deployTeam();
    const sel = ui.sel && E.unitByUid(st, ui.sel);
    const opts = selOptions();
    const zones = st.phase !== "deploy" ? E.zones(st) : null;
    const names = !!ui.names;
    const v = viewer(), mine = "var(--move)", theirs = "var(--threat)";
    const enemy = enemyTapped(), ep = enemy ? E.enemyPreview(st, enemy.uid) : null;
    const rt = previewRoute();
    let out = "";
    const G = E.fieldOf(st);
    // Field: neutral zones (section 11), the flag hex in flag colour.
    let clip = "";
    for (const h of G.CELLS) {
      const [x, y] = pos(h);
      let fill = "var(--hex)";
      if (arcs.N.has(h) || arcs.S.has(h)) fill = "var(--zoneArc)";
      if (G.GOAL.N.has(h) || G.GOAL.S.has(h)) fill = "var(--zoneGoal)";
      const isFlag = G.onFlag(h);
      if (isFlag) fill = "var(--flag)";
      clip += `<polygon points="${hexPts(x, y, R + 0.4)}"/>`;
      out += `<g class="cell" data-hex="${h}"><polygon points="${hexPts(x, y, R)}" fill="${fill}" stroke="var(--line)" stroke-width="0.8"/>`;
      if (names && !isFlag) out += `<text x="${x}" y="${y - H * 0.3}" text-anchor="middle" font-size="8" fill="var(--muted)" font-family="var(--num)" pointer-events="none">${h}</text>`;
      out += `</g>`;
    }
    // Pitch lines (a picture only): the deployment arc and the goal circle round each flag, the halfway line.
    const rings = Math.max(...E.deployZone(st, "N").map((h) => G.dist(h, G.FLAG.N)));
    let pitch = "";
    for (const t of ["N", "S"]) { const [fx, fy] = pos(G.FLAG[t]); pitch += `<circle cx="${fx}" cy="${fy}" r="${((rings + 0.25) * H).toFixed(1)}"/><circle cx="${fx}" cy="${fy}" r="${(1.25 * H).toFixed(1)}"/>`; }
    const midY = pos(G.centre)[1];
    pitch += `<path d="M0 ${midY.toFixed(1)}H${boardW().toFixed(0)}"/>`;
    out += `<g clip-path="url(#fieldclip)" fill="none" stroke="var(--pitchLine)" stroke-width="1.6" pointer-events="none">${pitch}</g>`;
    // Flag pills (section 11): on the flag hex's outer flat edge, the flag's own HP. Drawn above the tokens; when the
    // flag is held, pushed out just far enough to clear the holder's widest ring (selection, braced, warm-up).
    let flagPills = "";
    for (const t of ["N", "S"]) {
      const [fx, fy] = pos(G.FLAG[t]), held = st.phase !== "deploy" && E.holderOf(st, t);
      const ringOut = tr + 7.5 + 4.2 / 2 + 1.25;   // the widest ring a token can carry, with its white edge
      const off = held ? Math.max(H / 2, ringOut + 7.5 + 1) : H / 2, py = t === "N" ? fy - off : fy + off;
      flagPills += `<g pointer-events="none" class="flagpill"><rect x="${fx - 15}" y="${(py - 7.5).toFixed(1)}" width="30" height="15" rx="7.5" fill="var(--flag)" stroke="#fff" stroke-width="1.2"/>
        <g transform="translate(${fx - 13} ${(py - 5).toFixed(1)}) scale(${(10 / 24).toFixed(3)})" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${P.flag}</g>
        <text x="${fx + 5}" y="${(py + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="var(--num)">${fmt(E.flagShown(st, t))}</text></g>`;
    }
    if (dTeam) for (const h of arcs[dTeam]) { const [x, y] = pos(h); out += `<polygon points="${hexPts(x, y, R - 2.5)}" fill="none" stroke="${teamColor(dTeam)}" stroke-width="1.4" stroke-opacity="0.7" pointer-events="none"/>`; }
    if (zones) for (const team of ["N", "S"]) for (const h of zones[team]) {
      const [x, y] = pos(h);
      out += `<polygon points="${hexPts(x, y, R * (team === "N" ? 0.86 : 0.76))}" fill="none" stroke="${teamColor(team)}" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="3 3" pointer-events="none"/>`;
    }
    // Set spear hatching (section 3): every empty hex next to a loaded braced Heavy Anti-Cavalry, both sides, until it fires.
    if (st.phase === "play") {
      const occupied = new Set(E.alive(st).map((u) => u.hex)), hatched = new Set();
      for (const u of E.alive(st)) {
        if (!(u.braced && E.card(st, u).brace === "spike" && !u.spikeUsed)) continue;
        for (const n of G.NBRS[u.hex]) if (!occupied.has(n) && !G.onFlag(n)) hatched.add(n);
        keyNote("hatch", `${UI.unitName(st, u)} on ${u.hex} is braced: set spear ${fmt(st.rs.spikeDamage)} to the first enemy arriving next to it.`);
      }
      for (const h of hatched) { const [x, y] = pos(h); out += `<polygon points="${hexPts(x, y, R * 0.72)}" fill="url(#hatch)" stroke="none" pointer-events="none"/>`; }
    }
    // Move hexes: your unit's (blue, 16%; 9% under a preview), or the tapped enemy's next turn (threat orange).
    const showMoves = opts && !ui.armed && !(ui.sheet && (ui.sheet.kind === "attack" || ui.sheet.kind === "special"));
    if (showMoves) {
      for (const h in opts.moves) { const [x, y] = pos(h); out += `<g class="cell" data-hex="${h}"><polygon points="${hexPts(x, y, R - 2)}" fill="${mine}" fill-opacity="${rt ? 0.09 : 0.16}" stroke="none"/></g>`; }
      if (Object.keys(opts.moves).length) keyNote(opts.evading ? "evade" : "moves", opts.evading ? `${sel.id} may step further from the unit it attacked.` : `Where ${sel.id} can move this turn.`);
    }
    if (ep) {
      for (const h in ep.moves) { const [x, y] = pos(h); out += `<polygon points="${hexPts(x, y, R - 2)}" fill="${theirs}" fill-opacity="0.16" stroke="none" pointer-events="none"/>`; }
      if (Object.keys(ep.moves).length) keyNote("enemyMoves", `Where ${enemy.id} can move on its next turn.`);
    }
    if (opts && opts.pull && !ui.armed) {
      const [x, y] = pos(G.FLAG[E.foeOf(sel.team)]);
      out += `<polygon points="${hexPts(x, y, R - 1)}" fill="none" stroke="var(--attack)" stroke-width="${ui.sheet && ui.sheet.kind === "pull" ? 4 : 2.6}" pointer-events="none"/>`;
    }
    // Attack picked (section 5): the attacker's Evade hexes, when an outcome leaves the target standing.
    if (opts && ui.sheet && (ui.sheet.kind === "attack" || ui.sheet.kind === "special")) {
      const t = E.unitByUid(st, ui.sheet.target);
      let survives = false;
      if (ui.sheet.kind === "attack") { const a = opts.attacks.find((x) => x.target === ui.sheet.target); survives = !!(a && a.cases.some(([dm]) => dm < a.effHp - EPS)); }
      else { const p = opts.special && opts.special.targets.find((x) => x.target === ui.sheet.target); survives = !!(p && p.evade && !p.hits[0].kills); }
      if (t && survives) {
        const ev = E.evadeHexes(st, sel.uid, t.uid);
        for (const h in ev) { const [x, y] = pos(h); out += `<polygon points="${hexPts(x, y, R - 2)}" fill="${mine}" fill-opacity="0.18" stroke="none" pointer-events="none"/>`; }
        if (Object.keys(ev).length) keyNote("evade", `If ${t.id} survives, ${sel.id} may step to these hexes (Evade).`);
      }
    }
    // Range (section 3), redrawn from the end hex while a move is previewed; the special's range when it can fire.
    let rangeSvg = "", badges = "", routeSvg = "";
    const rangeOf = (u, from, col, spCol, spReady) => {
      const ro = rangeOutline(st, u, from, col);
      rangeSvg += ro.svg;
      if (ro.svg) keyNote(u.team === v ? "range" : "enemyRange", `What ${u.id} can hit from ${from}.`);
      if (spReady) { const so = specialOutline(st, u, from, spCol, ro.lined); if (so) { rangeSvg += so; keyNote(u.team === v ? "special" : "enemySpecial", `${E.specialName(E.specialOf(st, u))}: what ${u.id}'s special can hit from ${from}.`); } }
    };
    if (opts && sel && !ui.armed && !(ui.sheet && ui.sheet.kind !== "info") && !opts.evading) {
      const ready = !!(opts.special && opts.special.state === "Charged" && opts.special.fire);
      if (rt) {
        if (E.canAttackAfter(st, sel.uid, rt.end)) rangeOf(sel, rt.end, mine, "var(--specialRange)", ready);
        else { badges += badge(rt.end, "noattack"); keyNote("noattack", `${sel.id} can't attack after moving to ${rt.end}.`); }
      } else rangeOf(sel, sel.hex, mine, "var(--specialRange)", ready);
    }
    if (ep) rangeOf(enemy, enemy.hex, theirs, "var(--plum)", ep.specialNext);
    // The previewed move (section 4): route, arrow, stop short, badges for what happens on the way.
    if (rt && sel) {
      const pts = rt.path.map(pos), k = rt.path.indexOf(rt.end);
      routeSvg += routeLine(pts.slice(0, k + 1), mine);
      if (rt.stoppedShort) {
        const rest = pts.slice(k).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
        routeSvg += `<path d="${rest}" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 4" pointer-events="none"/>`;
        const [x, y] = pos(ui.ghost);
        routeSvg += `<polygon points="${hexPts(x, y, R - 3 / AP)}" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-dasharray="4 3" pointer-events="none"/>`;
        keyNote("short", `The move stops at ${rt.end}, short of ${ui.ghost}: take shorter steps to go another way.`);
      }
      routeSvg += k > 0 ? arrowHead(pts.slice(0, k + 1), mine) : "";
      keyNote("route", `${sel.id} walks ${rt.path.slice(0, k + 1).join(" → ")}.`);
      for (const e of rt.events) {
        const by = e.by && E.unitByUid(st, e.by);
        if (e.type === "mark") { badges += badge(e.hex, "mark"); keyNote("mark", `${by ? `The ${UI.unitName(st, by)} on ${by.hex}` : "An enemy"} marks ${e.hex}: the move stops there.`); }
        if (e.type === "spear" && by) { badges += badge(by.hex, "spear"); keyNote("spear", `The braced ${UI.unitName(st, by)} on ${by.hex} deals ${fmt(e.amount)} when ${sel.id} arrives on ${e.hex}.`); }
        if (e.type === "tackle" && by) { badges += badge(by.hex, "tackle", e.amount); keyNote("tackle", `Breaking away from ${by.id} costs ${fmt(e.amount)} more Stamina.`); }
      }
    }
    // Attack picked: the set spear badge on the spearman that a kill would set off.
    if (opts && ui.sheet && ui.sheet.kind === "attack") {
      const kc = E.killConsequences(st, sel.uid, ui.sheet.target) || [];
      for (const e of kc) if (e.type === "spear") { const by = E.unitByUid(st, e.by); if (by) { badges += badge(by.hex, "spear"); keyNote("spear", `If the attack kills, ${sel.id} takes the hex and the braced ${UI.unitName(st, by)} on ${by.hex} deals ${fmt(e.amount)}.`); } }
    }
    out += rangeSvg + routeSvg;
    // Units
    const shown = st.phase === "deploy"
      ? st.units.filter((u) => u.team === dTeam).map((u) => Object.assign({}, u, { hex: ui.placements[u.uid] })).filter((u) => u.hex)
      : E.alive(st);
    for (const u of shown) {
      const [x, y] = pos(u.hex);
      const s = E.status(st, u), team = u.team === "N" ? "north" : "south";
      const isSel = ui.sel === u.uid || ui.deploySel === u.uid;
      out += `<g class="cell unit" data-hex="${u.hex}" data-uid="${u.uid}" opacity="${s.done ? 0.5 : 1}">`;
      if (isSel) out += ring(x, y, tr + 6, enemy && enemy.uid === u.uid ? theirs : mine, 2.5);
      if (s.braced) { out += ring(x, y, tr + 3.6, "var(--brace)", 3.2); keyNote("braced", `${u.id} is braced.`); }
      else if (s.bracedLast) { out += `<circle cx="${x}" cy="${y}" r="${tr + 3.6}" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="4 3" pointer-events="none"/><circle cx="${x}" cy="${y}" r="${tr + 3.6}" fill="none" stroke="var(--brace)" stroke-width="3.2" stroke-dasharray="4 3" pointer-events="none"/>`; keyNote("bracedLast", `${u.id} braced last turn: ${fmt(s.stamNow !== null ? s.stamNow : s.stamNext)} Stamina now.`); }
      // Warm-up ring (6.16): gold on your units, plum on theirs; dashed while warming up, solid when ready to fire.
      const ready = u.sp === "charged", warm = u.sp === "warm";
      if (st.phase === "play" && (ready || warm)) {
        const col = u.team === v ? "var(--keeper)" : "var(--plum)", out2 = s.braced && ready ? tr + 7.5 : ready ? tr + 3.8 : tr + 3.5;
        out += ready ? ring(x, y, out2, col, 4.2) : ring(x, y, s.braced ? tr + 7.5 : out2, col, 2.6, "4 3");
        keyNote(u.team === v ? (ready ? "spReady" : "spWarm") : (ready ? "enemySpReady" : "enemySpWarm"), `${u.id}'s ${E.specialName(E.specialOf(st, u))} ${ready ? "is ready to fire this turn" : u.team === v ? "is warming up: it fires next turn" : "is warming up: it can fire on its next turn"}.`);
      }
      out += `<circle cx="${x}" cy="${y}" r="${tr}" fill="var(--${team})" stroke="${u.fk ? "var(--keeper)" : `var(--${team}Dark)`}" stroke-width="${u.fk ? 3 : 1.2}"/>`;
      out += iconShape(iconKey(st.rs, u.card), x, y - 3.5, tr * 0.33, "#fff", 1.6);
      out += `<text x="${x}" y="${(y + tr * 0.76).toFixed(1)}" text-anchor="middle" font-size="${(tr * 0.55).toFixed(1)}" font-weight="600" fill="#fff" font-family="var(--num)">${fmt(s.hp)}</text>`;
      if (dupLabel(st, u)) out += `<text x="${x + tr - 1}" y="${y + tr + 3}" text-anchor="middle" font-size="8" font-weight="700" fill="var(--ink)" font-family="var(--num)">${esc(u.id.replace(/^[A-Z]+/, ""))}</text>`;
      out += `</g>`;
    }
    if (rt && sel) out += ghostToken(st, sel, rt.end);
    // It can hit you (section 9): four sight marks round each of your units the tapped enemy can hit now.
    if (ep) for (const uid of ep.canHit) {
      const t = E.unitByUid(st, uid), [x, y] = pos(t.hex);
      let m = "";
      for (const deg of [45, 135, 225, 315]) { const a = (deg * Math.PI) / 180, c = Math.cos(a), s2 = Math.sin(a); m += `M${(x + c * (tr + 3)).toFixed(1)} ${(y + s2 * (tr + 3)).toFixed(1)}L${(x + c * (tr + 10)).toFixed(1)} ${(y + s2 * (tr + 10)).toFixed(1)}`; }
      out += `<path d="${m}" stroke="#fff" stroke-width="6.1" stroke-linecap="round" pointer-events="none"/><path d="${m}" stroke="${theirs}" stroke-width="3.6" stroke-linecap="round" pointer-events="none"/>`;
      keyNote("canHit", `${enemy.id} can hit ${t.id} from where it stands.`);
    }
    if (opts && ui.drag && ui.drag.active) for (const uid of opts.swaps) { const f = E.unitByUid(st, uid); const [x, y] = pos(f.hex); out += `<circle cx="${x}" cy="${y}" r="${tr + 6}" fill="none" stroke="var(--move)" stroke-width="2.5" stroke-dasharray="5 3" pointer-events="none"/>`; }
    // Firing a special (5c): legal targets ringed as Attack's are; Arc Hit outlines its arc around the chosen target.
    if (opts && ui.armed === "special" && opts.special) {
      const chosen = ui.sheet && ui.sheet.kind === "special" ? opts.special.targets.find((x) => x.target === ui.sheet.target) : null;
      const arcFor = chosen || (ui.spHover && opts.special.targets.find((x) => x.target === ui.spHover));
      if (arcFor && arcFor.arc) for (const h of arcFor.arc) { const [x, y] = pos(h); out += `<polygon points="${hexPts(x, y, R - 1.5)}" fill="none" stroke="var(--keeper)" stroke-width="3" pointer-events="none"/>`; }
      for (const p of opts.special.targets) {
        const t = E.unitByUid(st, p.target); const [x, y] = pos(t.hex);
        out += ring(x, y, tr + 6, "var(--attack)", chosen && chosen.target === p.target ? 4.5 : 3);
      }
    }
    if (opts && ui.armed !== "special" && !(ui.drag && ui.drag.active)) {
      for (const a of targetsFor(opts, ui.armed)) {
        const t = E.unitByUid(st, a.target); const [x, y] = pos(t.hex);
        const on = ui.sheet && ui.sheet.kind === "attack" && ui.sheet.target === a.target;
        out += ring(x, y, tr + 6, "var(--attack)", on ? 4.5 : 3);
      }
    }
    out += flagPills + badges;   // the flag pills and badges sit over tokens
    svg.innerHTML = `<defs><clipPath id="fieldclip">${clip}</clipPath>
      <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c62828" stroke-width="1.5" stroke-opacity="0.55"/></pattern></defs>` + out;
  }
  function dupLabel(st, u) {
    if (u.fk) return false;
    return st.units.some((o) => o !== u && o.team === u.team && !o.fk && o.card === u.card);
  }

  /** Scroll the field so a hex is in view (smoothly), and keep edge markers and fades up to date. */
  function revealHex(h, center) {
    const sc = $("fieldscroll"), svg = $("board");
    if (!sc || !svg.clientHeight) return;
    const k = svg.clientHeight / boardH(), y = pos(h)[1] * k;
    const top = sc.scrollTop, vis = sc.clientHeight;
    if (!center && y > top + 70 && y < top + vis - 70) return;
    sc.scrollTo({ top: Math.max(0, y - vis / 2), behavior: center ? "auto" : "smooth" });
  }
  /** The hexes a preview is about besides the unit: its target, a special's other targets, the flag it pulls. */
  function previewHexes() {
    const st = App.st, ui = App.ui, sh = ui.sheet, out = [];
    if (!sh) return out;
    const t = sh.target && E.unitByUid(st, sh.target);
    if ((sh.kind === "attack" || sh.kind === "special") && t) out.push(t.hex);
    if (sh.kind === "special") { const o = selOptions(), p = o && o.special && o.special.targets.find((x) => x.target === sh.target); if (p) for (const hh of p.hits) { const x = E.unitByUid(st, hh.uid); if (x && x.hex) out.push(x.hex); } }
    if (sh.kind === "pull" && ui.sel) out.push(fld().FLAG[E.foeOf(E.unitByUid(st, ui.sel).team)]);
    return out;
  }
  /** Put the unit and everything its preview is about in the part of the field above the sheet (phone). The field
      has scroll room below its last row while a sheet is open (fieldRoom), so a unit on the last rows can come up too. */
  function revealAbove(h) {
    const sc = $("fieldscroll"), svg = $("board"), sh = $("sheet");
    if (!svg.clientHeight || window.innerWidth >= 900) return;
    fieldRoom();
    const k = svg.clientHeight / boardH(), ys = [h, ...previewHexes()].map((x) => pos(x)[1] * k);
    const lo = Math.min(...ys), hi = Math.max(...ys), m = R * k + 8;   // a hex and a little air
    const vis = sc.clientHeight - (!sh.hidden && sh.parentNode === $("fieldwrap") ? sh.getBoundingClientRect().height : 0);
    let top = hi - lo + 2 * m <= vis ? (lo + hi) / 2 - vis / 2 : lo - m;
    top = Math.max(0, Math.min(top, sc.scrollHeight - sc.clientHeight));
    sc.scrollTo({ top, behavior: "smooth" });
  }
  function updateEdges() {
    const st = App.st, sc = $("fieldscroll"), svg = $("board");
    if (!st || App.view !== "play" || !svg.clientHeight) return;
    const top = sc.scrollTop, vis = sc.clientHeight, k = svg.clientHeight / boardH();
    $("fadeTop").style.opacity = top > 2 ? 1 : 0;
    $("fadeBottom").style.opacity = top + vis < sc.scrollHeight - 2 ? 1 : 0;
    const above = { N: 0, S: 0 }, below = { N: 0, S: 0 }, flags = { up: [], down: [] };
    const units = st.phase === "deploy" ? [] : E.alive(st);
    for (const u of units) { const y = pos(u.hex)[1] * k; if (y < top + 30) above[u.team]++; else if (y > top + vis - 30) below[u.team]++; }
    for (const t of ["N", "S"]) { const y = pos(fld().FLAG[t])[1] * k; if (y < top + 30) flags.up.push(t); else if (y > top + vis - 30) flags.down.push(t); }
    const chip = (t, n) => `<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="${teamColor(t)}"/><text x="10" y="14" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="var(--num)">${n}</text></svg>`;
    const label = (cnt, fl) => ["N", "S"].filter((t) => cnt[t]).map((t) => `${cnt[t]} ${sideName(t)} unit${cnt[t] > 1 ? "s" : ""}`).concat(fl.map((t) => `${sideName(t)} flag`)).join(", ");
    const fill = (el, cnt, fl, dir) => {
      const parts = ["N", "S"].filter((t) => cnt[t]).map((t) => chip(t, cnt[t])).concat(fl.map((t) => ic("flag", 15, teamColor(t))));
      el.hidden = !parts.length;
      if (parts.length) { el.innerHTML = parts.join(""); el.setAttribute("aria-label", `More field ${dir}: ${label(cnt, fl)}`); }
    };
    fill($("edgeTop"), above, flags.up, "above");
    fill($("edgeBottom"), below, flags.down, "below");
  }

  // ---------- Drawing: top bar (UI v2, Brief 009) ----------
  /** Title row (FLAGFALL: Arena + Options) over the scoreboard. Every number is read from the engine's state. */
  function renderTopbar() {
    const st = App.st, g = st.rs.game;
    const fl = { N: +fmt(E.flagShown(st, "N")), S: +fmt(E.flagShown(st, "S")) };   // the rope measures flag HP only, never the pool
    const total = fl.N + fl.S, pct = total ? (100 * fl.N) / total : 50;
    const active = st.phase === "play" ? st.toMove : st.phase === "deploy" ? deployTeam() : null;
    const op = (t) => (!active || active === t ? 1 : 0.55);
    const count = (t) => st.units.filter((u) => u.team === t).length;
    const alive = (t) => (st.phase === "deploy" ? count(t) : E.alive(st).filter((u) => u.team === t).length);
    const dots = (t) => `<div class="dots" role="img" aria-label="${sideName(t)}: ${alive(t)} of ${count(t)} units on the field" style="justify-content:${t === "N" ? "flex-start" : "flex-end"}">${Array.from({ length: count(t) }, (_, i) => `<span style="${i < alive(t) ? `background:${LIGHT[t]}` : `border:1px solid ${LIGHT[t]};opacity:.6`}"></span>`).join("")}</div>`;
    let centre;
    if (st.phase === "play") {
      const max = st.turn === 1 && st.toMove === st.first ? g.firstTurnCommand : g.command;
      const n = Math.max(g.command, max), left = st.cmd;
      centre = `<div class="squares" role="img" aria-label="${fmt(left)} of ${fmt(max)} Command left">${Array.from({ length: n }, (_, i) => {
        const bg = i + 1 <= left + EPS ? "var(--card)" : i < left ? "linear-gradient(to right, var(--card) 50%, rgba(248,249,245,.25) 50%)" : i < max ? "rgba(248,249,245,.25)" : "transparent";
        return `<span style="background:${bg}${i >= max ? ";border:1px dashed rgba(248,249,245,.18)" : ""}"></span>`;
      }).join("")}</div>`;
    } else if (st.phase === "deploy") centre = `<div class="tb-phase">DEPLOY</div>`;
    else centre = `<div class="tb-phase">FULL TIME</div>`;
    const end = (t) => {
      const num = `<span class="num" style="opacity:${op(t)}">${fl[t]}</span>`, f = ic("flag", 18, LIGHT[t], t === "S" ? ' style="transform:scaleX(-1)"' : "");
      return `<div class="tb-end" role="img" aria-label="${sideName(t)} flag HP ${fl[t]}">${t === "N" ? f + num : num + f}</div>`;
    };
    const who = (t) => `<span role="img" aria-label="${isBot(t) ? "Computer" : "Player"}" style="display:inline-flex">${ic(isBot(t) ? "bot" : "person", 15)}</span>`;
    $("topbar").innerHTML = `<div class="tb-title"><div class="tb-brand">FLAGFALL<span>: Arena</span></div>
        <button type="button" class="tb-options" id="optionsbtn" data-act="options" aria-label="Options" aria-haspopup="menu" aria-expanded="${App.ui.menu ? "true" : "false"}">${ic("menu", 22)}</button></div>
      <div class="tb-rule"></div>
      <div class="tb-board">
        <div class="tb-row">
          <div class="tb-name" style="color:${LIGHT.N};opacity:${op("N")}">${who("N")}<span>${esc(st.names.N)}</span></div>
          <div class="tb-turn num" role="img" aria-label="Turn ${st.turn} of ${E.turnLimit(st)}">${ic("hourglass", 13)}${st.turn}/${E.turnLimit(st)}</div>
          <div class="tb-name" style="color:${LIGHT.S};opacity:${op("S")};justify-content:flex-end"><span>${esc(st.names.S)}</span>${who("S")}</div></div>
        <div style="display:flex;align-items:center;gap:10px">${end("N")}
          <div style="flex:1"><div class="rope" role="img" aria-label="Flag HP balance: North ${fl.N}, South ${fl.S}" style="background:linear-gradient(to right, var(--north) 0%, var(--north) ${pct.toFixed(1)}%, var(--south) ${pct.toFixed(1)}%, var(--south) 100%)"><div class="knot" style="left:${pct.toFixed(1)}%"></div></div></div>
          ${end("S")}</div>
        <div class="tb-row">${dots("N")}${centre}${dots("S")}</div>
        ${active ? `<div class="underline" role="img" aria-label="${sideName(active)} to move" style="${active === "N" ? "left" : "right"}:0;background:${LIGHT[active]}"></div>` : ""}
      </div>`;
    const mb = $("menubtn");   // Brief 025 §2: on a phone the same Options button sits on the field, top left
    if (mb) { if (!mb.innerHTML) mb.innerHTML = ic("menu", 20); mb.setAttribute("aria-expanded", App.ui.menu ? "true" : "false"); }
  }
  /** The Options button the player can see: on the field (phone) or in the title bar (desktop). */
  const optionsButton = () => [$("menubtn"), $("optionsbtn")].find((b) => b && b.offsetWidth) || $("optionsbtn");

  // ---------- Options menu (UI v2, Brief 009) ----------
  const shortBrain = (b) => String((b && b.name) || "").replace(/\s*\(.*\)\s*$/, "");
  function renderMenu() {
    const el = $("menu"), dim = $("menudim"), st = App.st, m = App.match;
    if (!App.ui.menu || App.view !== "play" || !st || !m) { el.hidden = true; dim.hidden = true; return; }
    const fm = formatOf(m.opts.format), bots = ["N", "S"].filter(isBot);
    const nm = (t) => (isBot(t) ? "Bot" : st.names[t]);
    const preset = (D.PRESETS || []).some((p) => p.id === m.rs.id) || m.rs.id === D.DEFAULT_RULESET.id;
    const rsName = preset ? m.rs.id : m.rs.name;
    const brainNames = [...new Set(bots.map((t) => shortBrain(brainOf(t))))];
    const botPart = bots.length ? ` · ${bots.length > 1 ? "Bots" : "Bot"}: ${esc(brainNames.join(" vs "))}` : "";
    const ver = [V.game || null, V.build ? `Build ${V.build}` : null, V.preview ? `Preview of ${V.preview}` : null].filter(Boolean).join(" · ");
    const live = st.phase === "play" && !isBot(st.toMove);
    const item = (act, icon, label, cls) => `<button type="button" role="menuitem" class="mi${cls ? " " + cls : ""}" data-act="${act}">${ic(icon, 20)}<span>${esc(label)}</span></button>`;
    el.innerHTML = `<div class="mh"><div class="mh-text">
        <div class="mh-1">${esc(fm.label)} · ${esc(nm("N"))} vs ${esc(nm("S"))}</div>
        <div class="mh-2">Rule set ${esc(rsName)}${botPart}</div>
        ${m.opts.seed ? `<div class="mh-3">Seed ${esc(m.opts.seed)}</div>` : ""}
        ${ver ? `<div class="mh-3">${esc(ver)}${m.build && V.build && m.build !== V.build ? ` (started on Build ${esc(String(m.build))})` : ""}</div>` : ""}</div>
        <button type="button" class="iconbtn mh-close" data-act="menu-close" aria-label="Close options">${ic("close", 22)}</button></div>
      ${item("menu-match", "list", "Match log and record")}${item("menu-rules", "book", "Rules and unit data")}${item("menu-home", "home", "Home")}
      ${live ? `<div class="msep" role="separator"></div>${item("menu-surrender", "lowflag", `${sideName(st.toMove)} surrenders`, "danger")}` : ""}`;
    el.hidden = false; dim.hidden = false;
    // Open over the Options button, so ✕ lands near where Options was (phone: the field's top left, Brief 025; desktop:
    // over the centred button in the title bar).
    const btn = optionsButton(), r = btn && btn.getBoundingClientRect();
    if (r && r.width && btn.id === "menubtn") { el.style.top = Math.max(4, r.top - 4) + "px"; el.style.left = Math.max(4, r.left - 4) + "px"; el.style.right = "auto"; }
    else if (r && r.width) { el.style.left = ""; el.style.top = Math.max(4, r.top - 4) + "px"; el.style.right = Math.max(4, window.innerWidth - r.right - 8) + "px"; }
  }
  function openMenu() { App.ui.menu = true; renderTopbar(); renderMenu(); const f = $("menu").querySelector("[role=menuitem]"); if (f) f.focus(); }
  function closeMenu(refocus) {
    if (!App.ui.menu) return;
    App.ui.menu = false; renderMenu(); renderTopbar();
    if (refocus !== false) { const b = optionsButton(); if (b) b.focus(); }
  }

  // ---------- Drawing: unit bar ----------
  /** Stamina squares: filled = left, hollow = spent. `cost` (a move being previewed) shows in blue. `kind` "white"
      draws them for the red Attack button: left after the attack white, the part this attack spends faint. */
  function stamSquares(u, now, cost, kind) {
    const st = App.st, max = Math.max(E.baseStamina(st, u), now), out = [];   // the card's base Stamina (Brief 013)
    for (let i = 0; i < Math.ceil(max - EPS); i++) {
      const full = i + 1 <= now + EPS, half = !full && i < now - EPS;
      const afterFull = i + 1 <= now - cost + EPS, afterHalf = !afterFull && i < now - cost - EPS;
      let cls = kind === "white" ? "sq w" : kind === "ink" ? "sq k" : "sq";   // "ink": on the gold Special buttons
      if (cost > 0 && (full || half)) cls += afterFull ? " on" : afterHalf ? (full ? " halfcost" : " half") : " cost";
      else if (full) cls += " on"; else if (half) cls += " half";
      out.push(`<span class="${cls}"></span>`);
    }
    return `<span class="sqs" role="img" aria-label="Stamina ${fmt(now)} of ${fmt(max)}${cost ? `, this ${kind === "white" ? "attack" : kind === "ink" ? "special" : "move"} costs ${fmt(cost)}` : ""}">${out.join("")}</span>`;
  }
  /** Hexes of movement the unit has left now: the furthest hex the engine lets it reach (its cap on the other side's turn). */
  function movesLeft(st, u) {
    if (st.phase !== "play" || u.team !== st.toMove) return E.capOf(st, u);
    if (u.done) return 0;
    return Object.values(E.reachMap(st, u)).reduce((m, x) => Math.max(m, x.steps), 0);
  }
  function hpLine(hp, max, team, w) {
    const pct = max ? Math.max(0, Math.min(100, (100 * hp) / max)) : 0;
    return `<div style="display:flex;align-items:center;gap:7px" role="img" aria-label="HP ${fmt(hp)} of ${fmt(max)}"><div class="hpbar" style="width:${w || 70}px"><i style="width:${pct.toFixed(0)}%;background:${teamColor(team)}"></i></div><span class="num" style="font:600 13px/1 var(--num)">${fmt(hp)}/${fmt(max)}</span></div>`;
  }
  function renderUnitbar() {
    const st = App.st, ui = App.ui, el = $("unitbar");
    el.className = "";
    if (st.phase !== "deploy" && !wide()) { renderUnitbarPhone(); return; }
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
    const s = E.status(st, sel);
    const mine = st.phase === "play" && sel.team === st.toMove;
    const enemy = enemyTapped();
    const now = mine ? s.stamNow : s.stamNext;
    const o = selOptions(), rt = previewRoute();
    const cost = rt ? rt.cost : 0;
    const mv = movesLeft(st, sel);
    // The row under the HP bar (section 8): from → to and the route's events while a move is previewed; the Evade chip
    // in an Evade step; one line when the unit can't move; else nothing.
    const evChip = (n) => `<span class="rchip">${ic("evade", 14)}${n}</span>`;
    const evIcon = { mark: ic("mark", 14), spear: ic("setspear", 14) };
    let row = "";
    if (rt) {
      const chips = rt.events.map((e) => e.type === "spear" ? `<span class="rchip hurt">${evIcon.spear}${fmt(e.amount)}</span>` : e.type === "mark" ? `<span class="rchip">${evIcon.mark}</span>` : `<span class="rchip">+${fmt(e.amount)}</span>`);
      if (o && o.evading) chips.unshift(evChip(Object.values(o.moves).reduce((m, x) => Math.max(m, x.steps), 0)));
      row = `<span class="rfrom">${sel.hex}</span>${ic("arrow", 13)}<span class="rto">${ui.ghost}</span><span class="rchips">${chips.join("")}</span>`;
    } else if (o && o.evading) {
      row = `<span class="rchips">${evChip(Object.values(o.moves).reduce((m, x) => Math.max(m, x.steps), 0))}</span>`;
    } else if (o && !sel.done && !Object.keys(o.moves).length) row = `<span class="rline">No movement available this turn</span>`;
    el.innerHTML = `${tokenInline(iconKey(st.rs, sel.card), sel.team, 30, sel.fk)}
      <div class="ub-left">
        <div class="ub-name">${esc(UI.unitName(st, sel))}</div>
        ${hpLine(s.hp, s.maxHp, sel.team, 110)}
        <div class="ub-route${rt ? " on" : ""}">${row}</div>
      </div>
      <div class="ub-right">
        <div style="display:flex;align-items:center;gap:10px">
          ${enemy ? `<span class="ub-stat muted">Next turn</span>` : `<span class="ub-stat" role="img" aria-label="At ${sel.hex}">${ic("hex", 14, "var(--muted)")}${sel.hex}</span>`}
          <span class="ub-stat" role="img" aria-label="Can move ${mv} hex${mv === 1 ? "" : "es"}">→ ${mv}</span></div>
        ${stamSquares(sel, now, cost)}
      </div>
      <button type="button" class="ub-info" data-act="info" aria-label="Unit information">${ic("info", 24)}</button>`;
  }

  /** The phone's unit bar (Brief 025 §3, §5, §7): 63 px in every play state. Row 1: token, full name, (i), then the
      route's chips (or a note) right-aligned toward the HP bar's end; hex and moves (or the previewed route) on the right.
      Row 2: the HP bar across the left column; HP and Stamina on the right. Every value from the engine, as before. */
  function renderUnitbarPhone() {
    const st = App.st, ui = App.ui, el = $("unitbar");
    el.className = "ub5";
    const sel = ui.sel && E.unitByUid(st, ui.sel);
    if (!sel || sel.hp <= 0) {
      let msg;
      if (st.phase === "over") msg = st.result.winner ? `${esc(st.names[st.result.winner])} wins · ${esc(say(st.result.how))}` : "Draw";
      else if (isBot(st.toMove)) msg = `${ic("bot", 18)}<span>${esc(ui.botReason || "Thinking…")}</span>`;
      else msg = `Tap a unit`;
      el.innerHTML = `<div class="ub-empty">${msg}</div>`;
      return;
    }
    const s = E.status(st, sel);
    const mine = st.phase === "play" && sel.team === st.toMove;
    const enemy = enemyTapped();
    const now = mine ? s.stamNow : s.stamNext;
    const o = selOptions(), rt = previewRoute();
    const cost = rt ? rt.cost : 0;
    const mv = movesLeft(st, sel);
    const warm = !!(ui.sheet && ui.sheet.kind === "warm" && o && o.special && o.special.warmup);
    const rewarm = warm && o.special.state === "Charged";   // charged, no target in range: it warms up again
    // Chips in walking order, filling from the right; the Evade chip first in an Evade step.
    const evChip = (n) => `<span class="uchip">${ic("evade", 12, "#fff", "", 2.4)}${n}</span>`;
    const evHexes = () => Object.values(o.moves).reduce((m, x) => Math.max(m, x.steps), 0);
    const chips = [];
    if (o && o.evading) chips.push(evChip(evHexes()));
    if (rt) for (const e of rt.events) chips.push(e.type === "spear" ? `<span class="uchip hurt">${ic("setspear", 12, "#fff", "", 2.4)}${fmt(e.amount)}</span>` : e.type === "mark" ? `<span class="uchip">${ic("mark", 12, "#fff", "", 2.4)}</span>` : `<span class="uchip">+${fmt(e.amount)}</span>`);
    let note = "";
    if (rewarm) note = "No target in range · fires next turn";
    else if (warm) note = "Fires next turn · no attack or brace";
    else if (!rt && o && !o.evading && !sel.done && !Object.keys(o.moves).length) note = "No movement available this turn";
    const after = note ? `<span class="ub-note">${esc(note)}</span>` : `<span class="ub-chips">${chips.join("")}</span>`;
    // While a note shows (warm-up, can't move), it takes all of row 1: no hex and moves (review of #47, fix 1).
    let side;
    if (note) side = null;
    else if (rt) side = `<span class="rfrom">${sel.hex}</span>${ic("arrow", 13)}<span class="rto">${ui.ghost}</span>`;
    else side = `${enemy ? `<span class="muted">Next turn</span>` : `<span role="img" aria-label="At ${sel.hex}" style="display:inline-flex;align-items:center;gap:4px">${ic("hex", 14, "var(--muted)")}${sel.hex}</span>`}
        <span role="img" aria-label="Can move ${mv} hex${mv === 1 ? "" : "es"}">→ ${mv}</span>`;
    const pct = s.maxHp ? Math.max(0, Math.min(100, (100 * s.hp) / s.maxHp)) : 0;
    el.innerHTML = `<button type="button" class="ub-handle" data-act="key-open" aria-controls="fieldkey" aria-label="Show the key"><span></span></button>
      <div class="ub-grid">
        <div class="ub-r1${side === null ? " wide" : ""}"><button type="button" class="ub-id" data-act="info" aria-label="Unit information">${tokenInline(iconKey(st.rs, sel.card), sel.team, 24, sel.fk)}<span class="ub-name">${esc(UI.unitName(st, sel))}</span>${ic("info", 16, "var(--muted)")}</button>${after}</div>
        ${side === null ? "" : `<div class="ub-side">${side}</div>`}
        <div class="ub-hp" role="img" aria-label="HP ${fmt(s.hp)} of ${fmt(s.maxHp)}"><i style="width:${pct.toFixed(0)}%;background:${teamColor(sel.team)}"></i></div>
        <div class="ub-r2"><span class="num">${fmt(s.hp)}/${fmt(s.maxHp)}</span>${stamSquares(sel, now, cost)}</div>
      </div>`;
    fitChips(el);
    const nt = el.querySelector(".ub-note");   // a note never clips: two lines if one won't fit (review of #47, fix 1)
    if (nt && nt.scrollWidth > nt.clientWidth + 0.5) nt.classList.add("two");
  }
  /** §3: chips never cover the name or the (i). If they would not fit, they stop 8 px short of the (i) and the rest
      show as a last chip "+N". */
  function fitChips(el) {
    const box = el.querySelector(".ub-chips");
    if (!box || !box.children.length || box.scrollWidth <= box.clientWidth + 0.5) return;
    const all = [...box.children];
    let hidden = 0;
    const more = document.createElement("span"); more.className = "uchip"; box.appendChild(more);
    while (hidden < all.length && box.scrollWidth > box.clientWidth + 0.5) { all[all.length - 1 - hidden].remove(); hidden++; more.textContent = "+" + hidden; }
    App.ui.chipOverflow = (App.ui.chipOverflow || 0) + 1;
  }

  // ---------- Drawing: action bar ----------
  const PICK = "Pick one of your own units";
  function renderActions() {
    const st = App.st, ui = App.ui, el = $("actions");
    // A greyed-out button stays tappable when it has a reason: the tap shows why (Brief 005). Reasons come from the engine.
    const b = (act, icon, label, opt) => `<button type="button" class="act${opt.cls ? " " + opt.cls : ""}${opt.bar ? " hasbar" : ""}" data-act="${act}" ${opt.dis ? (opt.why ? `aria-disabled="true" data-why="${esc(opt.why)}" title="${esc(opt.why)}"` : "disabled") : ""} ${opt.pressed !== undefined ? `aria-pressed="${opt.pressed}"` : ""}${opt.aria ? ` aria-label="${esc(opt.aria)}"` : ""}${opt.flex ? ` style="flex:${opt.flex} 1 0"` : ""}>${opt.dot ? `<i class="dot ${opt.dot}"></i>` : ""}${ic(icon, 22)}<span>${label}</span>${opt.bar ? `<i class="spbar ${opt.bar}"></i>` : ""}</button>`;
    if (st.phase === "deploy") {
      const t = deployTeam(), mine = st.units.filter((u) => u.team === t);
      const placed = mine.filter((u) => ui.placements[u.uid]).length;
      const sel = ui.deploySel && ui.placements[ui.deploySel];
      el.innerHTML = `<div class="arow"><span class="alabel">DEPLOY</span>${b("deploy-takeback", "undo", "Take back", { dis: !sel })}${b("deploy-fill", "fill", "Fill rest", { dis: placed === mine.length })}${b("deploy-done", "endturn", "Ready", { cls: "primary", dis: placed !== mine.length })}</div>`;
      return;
    }
    const human = st.phase === "play" && !isBot(st.toMove);
    const o = selOptions(), sel = o && E.unitByUid(st, ui.sel), enemy = enemyTapped();
    const turnRow = `<div class="arow"><span class="alabel">TURN</span>
        ${b("undo", "undo", "Undo", { dis: !canUndo(), why: human ? undoWhy() : null })}
        ${b("done", "endunit", "End unit", { dis: !(o && sel && !sel.done), why: enemy ? PICK : ui.sel && st.phase === "play" ? E.blockReasons(st, ui.sel).done : human ? PICK : null })}
        ${b("end", "endturn", ui.confirmEnd ? "Confirm" : "End turn", { dis: !human, cls: ui.confirmEnd ? "confirm" : "primary" })}</div>`;
    // Confirms (section 7) take the three attack slots; Cancel takes Brace's slot.
    const cancel = `<button type="button" class="act" data-act="sheet-close" style="flex:1 1 0">${ic("close", 22)}<span>Cancel</span></button>`;
    const go = (act, cls, icon, label, cost, u, sq) => `<div class="arow"><span class="alabel">UNIT</span>
          <button type="button" class="act go${cls}" data-act="${act}" style="flex:3 1 0">${ic(icon, 22)}
            <span class="go-text"><span class="go-1">${label}</span><span class="go-2">−${fmt(cost)} Stamina ${stamSquares(u, u.stam, cost, sq)}</span></span></button>${cancel}</div>`;
    const rt = previewRoute();
    if (rt && sel) { el.innerHTML = go("move-confirm", " blue", "move", "Move", rt.cost, sel, "white") + turnRow; return; }
    const sh = ui.sheet;
    if (sh && sh.kind === "attack" && o && o.attacks.some((x) => x.target === sh.target)) {
      const u = E.unitByUid(st, ui.sel), t = E.unitByUid(st, sh.target), reach = isReachShot(st, u, t);
      el.innerHTML = go("attack-confirm", "", reach ? "spear" : "sword", reach ? "Reach" : "Attack", st.rs.game.attackCost, u, "white") + turnRow;
      return;
    }
    // Specials (Brief 011, 5b): warming up opens a line and Warm up (3 parts) / Cancel (1) in the UNIT row.
    if (sh && sh.kind === "warm" && o && o.special && o.special.warmup) {
      const u = E.unitByUid(st, ui.sel);
      // Phone (Brief 025 §5): no line above the buttons (the note is in the unit bar); the button names the special.
      // A charged special with no target warms up again: "Warm up <name> again" (review of #47, fix 4).
      if (!wide()) { const again = o.special.state === "Charged"; el.innerHTML = go("warm-confirm", " gold", "special", `Warm up ${esc(o.special.name)}${again ? " again" : ""}`, o.special.warmupCost, u, "ink") + turnRow; fitWarm(el, again); return; }
      el.innerHTML = `<div class="warmline">${ic("special", 16, "var(--gold)")}<span>Warm up ${esc(o.special.name)}${o.special.state === "Charged" ? " again" : ""}: fire it next turn. No attack or brace this turn.</span></div>` +
        go("warm-confirm", " gold", "special", "Warm up", o.special.warmupCost, u, "ink") + turnRow;
      return;
    }
    // Firing (section 7): the preview is open on a target; the button carries the special's name.
    if (sh && sh.kind === "special" && o && o.special && o.special.targets.some((x) => x.target === sh.target)) {
      el.innerHTML = go("special-confirm", " gold", "special", esc(o.special.name), st.rs.game.attackCost, E.unitByUid(st, ui.sel), "ink") + turnRow;
      return;
    }
    // Phone (Brief 025 §6.6): the flag pull's sheet leaves its buttons to the panel, as an attack does.
    if (sh && sh.kind === "pull" && o && o.pull && !wide()) {
      el.innerHTML = go("pull-confirm", "", "flag", "Pull", st.rs.game.attackCost, E.unitByUid(st, ui.sel), "white") + turnRow;
      return;
    }
    const nAtt = o ? targetsFor(o, "attack").length : 0, nReach = o ? targetsFor(o, "reach").length : 0;
    const why = enemy ? null : ui.sel && st.phase === "play" ? E.blockReasons(st, ui.sel) : null;
    const pick = human || enemy ? PICK : null;
    const su = ui.sel && E.unitByUid(st, ui.sel), ss = su && su.hp > 0 ? E.status(st, su) : null;
    const hasReach = su && su.hp > 0 && E.card(st, su).trait === "reach";
    const reloading = !!(ss && ss.reloading && su.team === st.toMove);
    const W = (r) => (enemy ? PICK : r);
    // Order (section 7): Attack, Reach (Anti-Cavalry only), Special, Brace: attack, attack, attack, defend.
    el.innerHTML = `<div class="arow"><span class="alabel">UNIT</span>
        ${b("arm-attack", "attack", "Attack", { dis: !nAtt, why: W(why ? why.attack : pick), cls: (ui.armed === "attack" ? "on" : "") + (reloading ? " reloading" : ""), pressed: ui.armed === "attack", dot: reloading ? "red" : "", aria: reloading ? "Attack, reloading" : "", flex: hasReach ? 1 : 2 })}
        ${hasReach ? b("arm-reach", "reach", "Reach", { dis: !nReach, why: W(why ? why.reach : pick), cls: ui.armed === "reach" ? "on" : "", pressed: ui.armed === "reach" }) : ""}
        ${specialButton(st, su, enemy ? null : o, why, pick, b, enemy)}
        ${b("brace", "brace", "Brace", { dis: !(o && o.brace), why: W(why ? why.brace : pick), cls: ss && ss.braced ? "braced" : "", dot: ss && ss.braced ? "blue" : ss && ss.bracedLast ? "ring" : "", aria: ss && ss.braced ? "Brace, braced" : ss && ss.bracedLast ? "Brace, braced last turn" : "" })}</div>${turnRow}`;
  }
  /** §5: "Warm up <name>" (or "Warm up <name> again") on one line; if too long, "Warm up" (or "Warm up again"). */
  function fitWarm(el, again) {
    const t = el.querySelector('[data-act="warm-confirm"] .go-1'), b = t && t.closest("button");
    if (t && b && b.scrollWidth > b.clientWidth + 0.5) t.textContent = again ? "Warm up again" : "Warm up";
  }
  /** The Special button (Brief 011, 5a): the unit's special by name, in its state. Older rule sets keep the greyed-out
      "Special" button. Every reason comes from the engine (blockReasons). */
  function specialButton(st, su, o, why, pick, b, enemy) {
    const ss = su && su.hp > 0 ? E.status(st, su) : null;
    if (enemy && ss && ss.special) return b("special", "special", E.specialName(E.specialOf(st, su)), { dis: true, why: PICK });
    if (!ss || !ss.special) return b("special", "special", "Special", { dis: true, why: why ? why.special : pick || "No special actions in this rule set yet" });
    const name = E.specialName(E.specialOf(st, su)), mine = st.phase === "play" && su.team === st.toMove;
    const sp = o && o.special, armed = App.ui.armed === "special";
    if (ss.special === "Used") return b("special", "special", name, { dis: true, why: "Used", cls: "sp-used", aria: `${name}, used` });
    if (ss.special === "Warming up") return b("special", "special", name, { dis: true, why: mine ? (why && why.special) || "Fire it next turn" : "Warming up: it can fire on its next turn", cls: "sp-warm", bar: "half", aria: `${name}, warming up` });
    if (ss.special === "Charged") {
      const can = sp && (sp.fire || sp.warmup);   // no target but it may warm up again
      return b("special", "special", name, { dis: !can, why: why ? why.special : pick, cls: "sp-charged" + (armed ? " on" : ""), bar: "full", pressed: armed, aria: `${name}, charged` });
    }
    return b("special", "special", name, { dis: !(sp && sp.warmup), why: why ? why.special : pick, aria: `${name}, unused` });
  }

  /** A special's preview on `target` (the key behaves as the attack preview's). */
  function specialSheet(target) { const sh = attackSheet(target); sh.kind = "special"; return sh; }
  /** A new attack preview on `target`. The key starts closed; the first two previews a player opens show
      "Pull up for the key" (counted in this board's local settings). Switching target keeps the key as it was. */
  function attackSheet(target) {
    const prev = App.ui.sheet;
    if (prev && (prev.kind === "attack" || prev.kind === "special")) return { kind: "attack", target, hint: prev.hint };
    App.ui.keyOpen = false;
    let seen = 0;
    try { seen = +Store.local("keyHintSeen") || 0; Store.local("keyHintSeen", seen + 1); } catch (e) { seen = 2; }
    return { kind: "attack", target, hint: seen < 2 };
  }
  // ---------- Drawing: sheet (attack preview, pull, unit card, result) ----------
  /** Is the wide (desktop) layout on? Then sheets sit in the right-hand column instead of over the field. */
  const wide = () => window.matchMedia && window.matchMedia("(min-width: 900px)").matches;
  function placeSheet() {
    const el = $("sheet"), want = wide() ? $("view-play") : $("fieldwrap");
    if (el.parentNode !== want) want.appendChild(el);
  }
  const statHtml = (s, right) => {
    const icon = ic(s.key, 14, s.red ? "var(--attack)" : "var(--muted)");
    const num = s.old !== undefined
      ? `<span class="fo-old">${esc(s.old)}</span><span class="fo-new${s.tone === "hurt" ? " hurt" : ""}">${esc(s.val)}</span>`
      : `<span class="fo-num${s.red ? " hurt" : ""}">${esc(s.val)}</span>`;
    return `<span class="fo-stat" role="img" aria-label="${esc(s.label)} ${s.old !== undefined ? esc(s.old) + " now " : ""}${esc(s.val)}">${right ? num + icon : icon + num}</span>`;
  };
  function faceSide(st, side, right) {
    const u = E.unitByUid(st, side.uid), pct = side.maxHp ? Math.max(0, Math.min(100, (100 * side.hp) / side.maxHp)) : 0;
    return `<div class="fo-side${right ? " right" : ""}">
      <div class="fo-row">${tokenInline(iconKey(st.rs, u.card), side.team, 24, u.fk)}<span class="fo-name">${esc(side.name)}</span></div>
      <div class="fo-row" role="img" aria-label="HP ${fmt(side.hp)} of ${fmt(side.maxHp)}"><span class="fo-hp">${fmt(side.hp)}/${fmt(side.maxHp)}</span><div class="fo-bar"><i style="width:${pct.toFixed(0)}%;background:${teamColor(side.team)};${right ? "margin-left:auto" : ""}"></i></div></div>
      <div class="fo-row fo-stats">${side.stats.map((x) => statHtml(x, right)).join("")}</div></div>`;
  }
  /** Kill consequences (section 5): under the kill outcomes, one pill per event the engine says a kill brings. */
  function killPills(st, u, t, segs, n) {
    const kc = E.killConsequences(st, u.uid, t.uid);
    if (!kc || !kc.length || !segs.some((sg) => sg.kills)) return "";
    const pills = kc.map((e) => e.type === "spear" ? `<span class="kpill hurt">${ic("setspear", 11, "#fff", "", 2.4)}${fmt(e.amount)}</span>` : `<span class="kpill">${ic("mark", 11, "#fff", "", 2.4)}</span>`).join("");
    const first = segs.findIndex((sg) => sg.kills), before = segs.slice(0, first).reduce((s2, sg) => s2 + sg.slots, 0), span = n - before;
    return `<div class="ob-row ob-k" style="grid-template-columns:repeat(${n}, minmax(0, 1fr))">${before ? `<div style="grid-column:span ${before}"></div>` : ""}<div style="grid-column:span ${span}">${pills}</div></div>`;
  }
  function renderPreview(st, u, t, a) {
    const ui = App.ui, pv = UI.attackPreview(st, u, t, a);
    const left = pv.attacker.team === "N" ? pv.attacker : pv.target, right = left === pv.attacker ? pv.target : pv.attacker;
    const pointsLeft = pv.attacker.team === "S";
    const n = a.cases.length;
    const segs = pv.segments;
    const cell = (sg, cls, style, html) => `<div class="${cls}" style="grid-column:span ${sg.slots};${style}">${html}</div>`;
    const row = (rowCls, fn) => `<div class="ob-row ${rowCls}" style="grid-template-columns:repeat(${n}, minmax(0, 1fr))">${segs.map(fn).join("")}</div>`;
    const outcome = `<div class="ob" role="img" aria-label="Outcomes: ${segs.map((sg) => `${UI.pct1(sg.p)} −${fmt(sg.dmg)}${sg.kills ? (pv.pooled ? " brings the flag down" : " kills") : ""}`).join(", ")}">
      ${row("ob-p", (sg) => cell(sg, "", "", UI.pct1(sg.p)))}
      ${row("ob-bar", (sg, i) => cell(sg, (i === 0 ? "first " : "") + (i === segs.length - 1 ? "last" : ""), `background:${sg.kills ? "var(--attack)" : `rgba(31,36,33,${sg.opacity.toFixed(3)})`}`, ""))}
      ${row("ob-d", (sg) => cell(sg, sg.kills ? "kill" : "", "", `−${fmt(sg.dmg)}`))}${killPills(st, u, t, segs, n)}</div>`;
    const keyOpen = !!ui.keyOpen;
    const key = keyOpen ? `<div class="key" id="attackkey"><div class="key-h">IN THIS ATTACK</div>${pv.rows.map((r) => `<div class="key-row">${ic(r.icon, 18, r.red || r.icon === "parry" ? "var(--attack)" : "var(--ink)")}<div>
        <div class="key-1${r.red ? " hurt" : ""}">${esc(r.name)}</div><div class="key-2">${esc(r.means)}</div><div class="key-3">${esc(r.why)}</div></div></div>`).join("") || `<div class="key-3">Nothing changes the numbers in this attack.</div>`}</div>` : "";
    const hint = !keyOpen && ui.sheet.hint ? `<div class="key-hint">Pull up for the key</div>` : "";
    return `<button type="button" class="handle" data-act="key-toggle" aria-expanded="${keyOpen}" aria-controls="attackkey" aria-label="${keyOpen ? "Hide" : "Show"} the key"><span></span></button>${hint}${key}
      <div class="fo">${faceSide(st, left, false)}
        <div class="fo-mid"><span>${esc(left === pv.attacker ? pv.from : pv.to)}</span>${ic("arrow", 16, "var(--attack)", pointsLeft ? ' style="transform:scaleX(-1)"' : "", 2.2)}<span>${esc(left === pv.attacker ? pv.to : pv.from)}</span></div>
        ${faceSide(st, right, true)}</div>
      ${outcome}`;
  }
  /** The special's preview (Brief 011, 5c): the attack preview's face-off and key, one exact outcome, and a row per
      extra target (Arc Hit's others, Skewer's second). Every number from the engine (E.options().special). */
  function renderSpecialPreview(st, u, t, p) {
    const ui = App.ui, pv = UI.specialPreview(st, u, t, p);
    const left = pv.attacker.team === "N" ? pv.attacker : pv.target, right = left === pv.attacker ? pv.target : pv.attacker;
    const pointsLeft = pv.attacker.team === "S", sg = pv.segments[0];
    const outcome = `<div class="ob" role="img" aria-label="Exactly −${fmt(sg.dmg)}${sg.kills ? " kills" : ""}, no dice">
      <div class="ob-row ob-p" style="grid-template-columns:1fr"><div>100% · no dice</div></div>
      <div class="ob-row ob-bar" style="grid-template-columns:1fr"><div class="first last" style="background:${sg.kills ? "var(--attack)" : "var(--ink)"}"></div></div>
      <div class="ob-row ob-d" style="grid-template-columns:1fr"><div class="${sg.kills ? "kill" : ""}">−${fmt(sg.dmg)}</div></div></div>`;
    const extra = pv.special.extra.map((x) => { const pct = x.maxHp ? Math.max(0, Math.min(100, (100 * x.hp) / x.maxHp)) : 0, xu = E.unitByUid(st, x.uid);
      return `<div class="sp-extra">${tokenInline(iconKey(st.rs, xu.card), x.team, 24, xu.fk)}<span class="fo-name">${esc(x.name)}</span>
        <div class="fo-bar" role="img" aria-label="HP ${fmt(x.hp)} of ${fmt(x.maxHp)}"><i style="width:${pct.toFixed(0)}%;background:${teamColor(x.team)}"></i></div><span class="fo-hp">${fmt(x.hp)}/${fmt(x.maxHp)}</span>
        <b class="${x.kills ? "kill" : ""}">−${fmt(x.dmg)}</b></div>`; }).join("");
    const keyOpen = !!ui.keyOpen;
    const key = keyOpen ? `<div class="key" id="attackkey"><div class="key-h">IN THIS SPECIAL</div>${pv.rows.map((r) => `<div class="key-row">${ic(r.icon, 18, r.special ? "var(--gold)" : r.red || r.icon === "parry" ? "var(--attack)" : "var(--ink)")}<div>
        <div class="key-1${r.red ? " hurt" : ""}">${esc(r.name)}</div><div class="key-2">${esc(r.means)}</div><div class="key-3">${esc(r.why)}</div></div></div>`).join("")}</div>` : "";
    const hint = !keyOpen && ui.sheet.hint ? `<div class="key-hint">Pull up for the key</div>` : "";
    return `<button type="button" class="handle" data-act="key-toggle" aria-expanded="${keyOpen}" aria-controls="attackkey" aria-label="${keyOpen ? "Hide" : "Show"} the key"><span></span></button>${hint}${key}
      <div class="fo">${faceSide(st, left, false)}
        <div class="fo-mid"><span>${esc(left === pv.attacker ? pv.from : pv.to)}</span>${ic("arrow", 16, "var(--gold)", pointsLeft ? ' style="transform:scaleX(-1)"' : "", 2.2)}<span>${esc(left === pv.attacker ? pv.to : pv.from)}</span></div>
        ${faceSide(st, right, true)}</div>${extra ? `<div class="sp-extras">${extra}</div>` : ""}
      ${outcome}`;
  }
  // ---------- The phone's sheet (Brief 025 §6, Approved UI v5) ----------
  /* One layout for the attack preview, the special preview and the flag pull: a name strip with the handle dead
     centre, the HP row with the hexes between the bars, the modifiers under the bars, the outcomes, then what a kill or
     a fallen flag brings. Every number from the engine (ui.js reads it), exactly as the desktop sheet shows it. */
  function nameBlock5(st, side, right) {
    const nm = `<span class="nm">${esc(side.name)}</span>`;
    if (side.flag) {
      const tok = `<span class="ftoken">${ic("flag", 12, "#fff", side.team === "S" ? ' style="transform:scaleX(-1)"' : "", 2.2)}</span>`;
      return `<div class="nb${right ? " right" : ""}" role="img" aria-label="${esc(side.name)}">${right ? nm + tok : tok + nm}</div>`;
    }
    const u = E.unitByUid(st, side.uid), tok = tokenInline(iconKey(st.rs, u.card), side.team, 22, u.fk), i = ic("info", 15, "var(--muted)");
    return `<button type="button" class="nb${right ? " right" : ""}" data-act="card" data-uid="${side.uid}" aria-label="${esc(side.name)}: unit information">${right ? i + nm + tok : tok + nm + i}</button>`;
  }
  function hpSide5(side, right) {
    const pct = side.maxHp ? Math.max(0, Math.min(100, (100 * side.hp) / side.maxHp)) : 0, col = side.flag ? "var(--flag)" : teamColor(side.team);
    const num = `<span class="fo-hp"${side.flag ? ' style="color:var(--flag)"' : ""}>${fmt(side.hp)}/${fmt(side.maxHp)}</span>`;
    const bar = `<div class="fo-bar"><i style="width:${pct.toFixed(0)}%;background:${col};${right ? "margin-left:auto" : ""}"></i></div>`;
    return `<div class="hpside" role="img" aria-label="HP ${fmt(side.hp)} of ${fmt(side.maxHp)}">${right ? bar + num : num + bar}</div>`;
  }
  const statHtml5 = (s, right) => {
    const icon = ic(s.key, 14, s.red ? "var(--attack)" : "var(--muted)");
    let num = s.old !== undefined
      ? `<span class="fo-old">${esc(s.old)}</span><span class="fo-new${s.tone === "hurt" ? " hurt" : ""}">${esc(s.val)}</span>`
      : `<span class="fo-num${s.red ? " hurt" : ""}">${esc(s.val)}</span>`;
    if (s.mult) num += `<span class="fo-mult">${esc(s.mult)}</span>`;
    return `<span class="fo-stat" role="img" aria-label="${esc(s.label)} ${s.old !== undefined ? esc(s.old) + " now " : ""}${esc(s.val)}${s.mult ? " " + esc(s.mult) : ""}">${right ? num + icon : icon + num}</span>`;
  };
  /** Strip, HP row and modifier row. `pv` has attacker, target, from, to; `col` is the arrow's colour. */
  function face5(st, pv, col, aStats) {
    const left = pv.attacker.team === "N" ? pv.attacker : pv.target, right = left === pv.attacker ? pv.target : pv.attacker;
    const pointsLeft = left !== pv.attacker, keyOpen = !!App.ui.keyOpen;
    const stats = (side) => (side === pv.attacker && aStats ? aStats : side.stats);
    const mid = `<span class="mid">${esc(pointsLeft ? pv.to : pv.from)}${ic("arrow", 12, col, pointsLeft ? ' style="transform:scaleX(-1)"' : "", 2.2)}${esc(pointsLeft ? pv.from : pv.to)}</span>`;
    return `<div class="strip" data-act="key-toggle">${nameBlock5(st, left, false)}<button type="button" class="handle" data-act="key-toggle" aria-expanded="${keyOpen}" aria-controls="attackkey" aria-label="${keyOpen ? "Hide" : "Show"} the key"><span></span></button>${nameBlock5(st, right, true)}</div>
      <div class="face">${hpSide5(left, false)}${mid}${hpSide5(right, true)}
        <div class="mods left">${stats(left).map((x) => statHtml5(x, false)).join("")}</div><span></span><div class="mods right">${stats(right).map((x) => statHtml5(x, true)).join("")}</div></div>`;
  }
  function outcomes5(segs, n, aria) {
    const cell = (sg, cls, style, html) => `<div class="${cls}" style="grid-column:span ${sg.slots};${style}">${html}</div>`;
    const row = (rowCls, fn) => `<div class="ob-row ${rowCls}" style="grid-template-columns:repeat(${n}, minmax(0, 1fr))">${segs.map(fn).join("")}</div>`;
    return `<div class="ob" role="img" aria-label="${esc(aria)}">
      ${row("ob-p", (sg) => cell(sg, "", "", UI.pct1(sg.p)))}
      ${row("ob-bar", (sg, i) => cell(sg, (i === 0 ? "first " : "") + (i === segs.length - 1 ? "last" : ""), `background:${sg.kills ? "var(--attack)" : `rgba(31,36,33,${sg.opacity.toFixed(3)})`}`, ""))}
      ${row("ob-d", (sg) => cell(sg, sg.kills ? "kill" : "", "", `−${fmt(sg.dmg)}`))}</div>`;
  }
  /** §6.5: the results under the outcomes they apply to: a bracket over a range, or a line up to a single outcome. */
  function results5(segs, n, pills) {
    const ks = segs.map((sg, i) => (sg.kills ? i : -1)).filter((i) => i >= 0);
    if (!ks.length || !pills) return "";
    const slots = (a, b) => segs.slice(a, b).reduce((s2, sg) => s2 + sg.slots, 0);
    const before = slots(0, ks[0]), span = slots(ks[0], ks[ks.length - 1] + 1), after = n - before - span;
    const one = ks.length === 1 && before > 0;
    return `<div class="res" style="grid-template-columns:repeat(${n}, minmax(0, 1fr))">${before ? `<div style="grid-column:span ${before}"></div>` : ""}<div class="span" style="grid-column:span ${span}"><div class="${one ? "one" : "brk"}"></div><div class="pills">${pills}</div></div>${after ? `<div style="grid-column:span ${after}"></div>` : ""}</div>`;
  }
  function keyRows5(head, rows, special) {
    if (!App.ui.keyOpen) return "";
    return `<div class="key" id="attackkey"><div class="key-h">${head}</div>${rows.map((r) => `<div class="key-row">${ic(r.icon, 18, special && r.special ? "var(--gold)" : r.red || r.icon === "parry" ? "var(--attack)" : "var(--ink)")}<div>
        <div class="key-1${r.red ? " hurt" : ""}">${esc(r.name)}</div><div class="key-2">${esc(r.means)}</div><div class="key-3">${esc(r.why)}</div></div></div>`).join("") || `<div class="key-3">Nothing changes the numbers in this attack.</div>`}</div>`;
  }
  function renderPreviewPhone(st, u, t, a) {
    const pv = UI.attackPreview(st, u, t, a), segs = pv.segments, n = a.cases.length;
    const kc = E.killConsequences(st, u.uid, t.uid);
    const pills = kc && kc.length ? kc.map((e) => e.type === "spear" ? `<span class="kpill hurt">${ic("setspear", 11, "#fff", "", 2.4)}${fmt(e.amount)}</span>` : `<span class="kpill">${ic("mark", 11, "#fff", "", 2.4)}</span>`).join("") : "";
    return face5(st, pv, "var(--attack)") + outcomes5(segs, n, `Outcomes: ${segs.map((sg) => `${UI.pct1(sg.p)} −${fmt(sg.dmg)}${sg.kills ? (pv.pooled ? " brings the flag down" : " kills") : ""}`).join(", ")}`) +
      results5(segs, n, pills) + keyRows5("IN THIS ATTACK", pv.rows);
  }
  function renderSpecialPhone(st, u, t, p) {
    const pv = UI.specialPreview(st, u, t, p), sg = pv.segments[0];
    const extra = pv.special.extra.map((x) => { const pct = x.maxHp ? Math.max(0, Math.min(100, (100 * x.hp) / x.maxHp)) : 0, xu = E.unitByUid(st, x.uid);
      return `<div class="sp-extra">${tokenInline(iconKey(st.rs, xu.card), x.team, 24, xu.fk)}<span class="fo-name">${esc(x.name)}</span>
        <div class="fo-bar" role="img" aria-label="HP ${fmt(x.hp)} of ${fmt(x.maxHp)}"><i style="width:${pct.toFixed(0)}%;background:${teamColor(x.team)}"></i></div><span class="fo-hp">${fmt(x.hp)}/${fmt(x.maxHp)}</span>
        <b class="${x.kills ? "kill" : ""}">−${fmt(x.dmg)}</b></div>`; }).join("");
    const outcome = `<div class="ob" role="img" aria-label="Exactly −${fmt(sg.dmg)}${sg.kills ? " kills" : ""}, no dice">
      <div class="ob-row ob-p" style="grid-template-columns:1fr"><div>100% · no dice</div></div>
      <div class="ob-row ob-bar" style="grid-template-columns:1fr"><div class="first last" style="background:${sg.kills ? "var(--attack)" : "var(--ink)"}"></div></div>
      <div class="ob-row ob-d" style="grid-template-columns:1fr"><div class="${sg.kills ? "kill" : ""}">−${fmt(sg.dmg)}</div></div></div>`;
    return face5(st, pv, "var(--gold)", UI.phoneSpecialStats(pv)) + (extra ? `<div class="sp-extras">${extra}</div>` : "") + outcome + keyRows5("IN THIS SPECIAL", pv.rows, true);
  }
  function renderPullPhone(st, u, pull) {
    const pv = UI.pullPreview(st, u, pull), segs = pv.segments, n = pull.cases.length;
    const pills = `<span class="kpill hurt">${ic("flag", 11, "#fff", "", 2.4)}Flag falls</span>`;
    return face5(st, pv, "var(--attack)") + outcomes5(segs, n, `Pull outcomes: ${segs.map((sg) => `${UI.pct1(sg.p)} −${fmt(sg.dmg)}${sg.kills ? " brings the flag down" : ""}`).join(", ")}`) + results5(segs, n, pills);
  }
  function chip(label, color, dot) { return `<span class="chip" style="color:${color};border-color:${color}"><i style="${dot === "hollow" ? `border:2px solid ${color}` : `background:${color}`}"></i>${esc(label)}</span>`; }
  /** The full unit card (in a match, or on the Lineup screen when `lineup` is given). Text from ui.js, numbers from the engine or the card. */
  function unitCardHtml(rs, code, opt) {
    const c = rs.cards[code], team = opt.team, col = teamColor(team), r = UI.rangeStat(c);
    const head = `<div class="uc-head">${tokenInline(iconKey(rs, code), team, 34, opt.fk)}<div style="flex:1;min-width:0">
        ${opt.side ? `<div class="uc-side" style="color:${col}">${esc(opt.side)}</div>` : ""}<div class="uc-name">${esc(opt.name || c.name)}</div><div class="uc-type">${esc(UI.cardTypeLine(c))}</div></div>
        <button type="button" class="iconbtn" data-act="${opt.closeAct || "sheet-close"}" aria-label="Close unit card">${ic("close", 22)}</button></div>`;
    const stats = opt.stats.map(([label, v]) => `<div><b class="num">${esc(String(v))}</b><span>${esc(label)}</span></div>`).join("");
    // Special (Brief 011, 5e): in a match the name carries a status chip; the Lineup card shows none.
    const spChip = (st) => (st === "Warming up" ? `<span class="spchip warm"><i></i>Warming up</span>` : st === "Used" ? `<span class="spchip used">Used</span>` : st ? `<span class="spchip">${st === "Charged" ? "Charged" : "Unused"}</span>` : "");
    const secs = UI.cardSections(rs, code).map((s) => `<div class="uc-sec"><div class="uc-sh">${esc(s.head.toUpperCase())}<span>${esc(s.sub)}</span></div>
      ${s.items.map((i) => `<div class="uc-ab"><div class="uc-an${i.special ? " sp" : ""}">${esc(i.name)}${i.cost ? `<span class="cost">Cost</span>` : ""}${i.special ? spChip(opt.special) : ""}</div><div class="uc-at">${esc(i.text)}</div></div>`).join("")}${s.note ? `<div class="uc-note">${esc(s.note)}</div>` : ""}</div>`).join("");
    return `<div class="grab" aria-hidden="true"></div>${head}${opt.status || ""}<div class="uc-stats">${stats}</div>${secs}`;
  }
  /* The key (section 10): only what is on the field now, each row drawn like its mark, one line saying why it is there. */
  const KEY_NAMES = { moves: "Move hexes", evade: "Evade", enemyMoves: "Enemy moves", range: "Range", enemyRange: "Enemy range", special: "Special range",
    enemySpecial: "Enemy special", route: "Route", short: "Stops short", mark: "Mark", spear: "Set spear", noattack: "No attack after", tackle: "Tackle",
    hatch: "Set spear", braced: "Braced", bracedLast: "Braced last turn", spReady: "Special ready", spWarm: "Special warming up",
    enemySpReady: "Enemy special ready", enemySpWarm: "Enemy special warming up", canHit: "It can hit you" };
  const KEY_ORDER = Object.keys(KEY_NAMES);
  function keySwatch(kind) {
    const hx = (r, extra) => `<polygon points="${hexPts(14, 14, r)}" ${extra}/>`, c = 14;
    const tok = `<circle cx="14" cy="14" r="6" fill="var(--muted)"/>`;
    let g = "";
    switch (kind) {
      case "moves": case "evade": g = hx(12, `fill="var(--move)" fill-opacity="${kind === "evade" ? 0.18 : 0.16}"`); break;
      case "enemyMoves": g = hx(12, `fill="var(--threat)" fill-opacity="0.16"`); break;
      case "range": case "enemyRange": g = hx(12, `fill="none" stroke="var(--${kind === "range" ? "move" : "threat"})" stroke-width="1.6"`); break;
      case "special": case "enemySpecial": { const col = kind === "special" ? "var(--specialRange)" : "var(--plum)"; g = hx(12, `fill="none" stroke="${col}" stroke-width="3"`) + hx(8, `fill="none" stroke="${col}" stroke-width="1.2"`); break; }
      case "route": g = `<path d="M3 14H25" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M3 14H25" stroke="var(--move)" stroke-width="3.5" stroke-linecap="round"/><polygon points="19,14 9,7.5 9,20.5" fill="var(--move)" stroke="#fff" stroke-width="1.6"/>`; break;
      case "short": g = `<path d="M3 14H25" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 4"/>`; break;
      case "hatch": g = hx(11, `fill="url(#keyhatch)" stroke="var(--attack)" stroke-opacity=".4" stroke-dasharray="3 3"`); break;
      case "braced": g = tok + `<circle cx="14" cy="14" r="9.6" fill="none" stroke="var(--brace)" stroke-width="3.2"/>`; break;
      case "bracedLast": g = tok + `<circle cx="14" cy="14" r="9.6" fill="none" stroke="var(--brace)" stroke-width="3.2" stroke-dasharray="4 3"/>`; break;
      case "spReady": case "enemySpReady": g = tok + `<circle cx="14" cy="14" r="9.8" fill="none" stroke="var(--${kind === "spReady" ? "keeper" : "plum"})" stroke-width="4.2"/>`; break;
      case "spWarm": case "enemySpWarm": g = tok + `<circle cx="14" cy="14" r="9.5" fill="none" stroke="var(--${kind === "spWarm" ? "keeper" : "plum"})" stroke-width="2.6" stroke-dasharray="4 3"/>`; break;
      case "canHit": { let m = ""; for (const deg of [45, 135, 225, 315]) { const a = (deg * Math.PI) / 180; m += `M${(c + Math.cos(a) * 7).toFixed(1)} ${(c + Math.sin(a) * 7).toFixed(1)}L${(c + Math.cos(a) * 12.5).toFixed(1)} ${(c + Math.sin(a) * 12.5).toFixed(1)}`; } g = `<circle cx="14" cy="14" r="5" fill="var(--muted)"/><path d="${m}" stroke="var(--threat)" stroke-width="3.2" stroke-linecap="round"/>`; break; }
      case "mark": case "spear": case "noattack": case "tackle": g = pill(14, 14, kind, 0.5); break;
    }
    return `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style="flex-shrink:0"><defs><pattern id="keyhatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c62828" stroke-width="1.5" stroke-opacity="0.55"/></pattern></defs>${g}</svg>`;
  }
  function keyHtml(rows) {
    const sorted = rows.slice().sort((a, b) => KEY_ORDER.indexOf(a.kind) - KEY_ORDER.indexOf(b.kind));
    return `<div class="key" id="fieldkey"><div class="key-h">ON THE FIELD</div>${sorted.map((r) => `<div class="key-row mk">${keySwatch(r.kind)}<div><div class="key-1">${esc(KEY_NAMES[r.kind] || r.kind)}</div><div class="key-2">${esc(r.line)}</div></div></div>`).join("")}</div>`;
  }
  function renderSheet() { renderSheetBody(); fieldRoom(); }
  /** Phone (review of #47, fixes 2 and 5): while a sheet or the key drawer is over the field, the field buttons hide
      (they are never covered) and the field gets scroll room below its last row as tall as the sheet, so every unit
      in a preview can scroll above it. Nothing covers the top of the field, so it needs no room there. */
  function fieldRoom() {
    const el = $("sheet"), sc = $("fieldscroll");
    const open = !wide() && !el.hidden && el.parentNode === $("fieldwrap");
    $("view-play").classList.toggle("sheet-open", open);
    sc.style.paddingBottom = open ? Math.ceil(el.getBoundingClientRect().height) + "px" : "";
  }
  function renderSheetBody() {
    const st = App.st, ui = App.ui, el = $("sheet"), sc = $("scrim");
    let sh = ui.sheet;
    placeSheet();
    el.className = "";
    // Desktop: while a move is previewed or an enemy is tapped, the key sits in the right-hand column (section 13).
    if (!sh && wide() && st.phase === "play" && (previewRoute() || enemyTapped()) && (ui.keyRows || []).length) sh = { kind: "key", auto: true };
    const phone = !wide();
    $("view-play").classList.toggle("sheet-up", !!(phone && sh && !App.ui.cover && ["attack", "special", "pull"].includes(sh.kind)));   // §6: the sheet takes the unit bar's place
    if (!sh || App.ui.cover) { el.hidden = true; sc.hidden = true; return; }
    if (sh.kind === "key") {
      el.hidden = false; sc.hidden = true; el.className = "preview keysheet";
      el.innerHTML = (sh.auto ? "" : `<button type="button" class="handle" data-act="key-close" aria-expanded="true" aria-controls="fieldkey" aria-label="Hide the key"><span></span></button>`) + keyHtml(ui.keyRows || []);
      return;
    }
    el.hidden = false; sc.hidden = sh.kind === "over" || wide();
    const g = st.rs.game, grab = `<div class="grab" aria-hidden="true"></div>`;
    const two = !!(st.rs.switches && st.rs.switches.dice2d6);
    const diceRow = (v, dodge) => `<div class="dice">${E.dieCases(st).map(([d, p, label]) => `<div><small>${two ? "" : "Die "}${label}${two ? ` · ${Math.round(p * 1000) / 10}%` : ""}</small><b>${fmt(E.applyDie(st, v, d, dodge))}</b></div>`).join("")}</div>`;
    const o = selOptions(), u = ui.sel && E.unitByUid(st, ui.sel);
    if (sh.kind === "attack" && o) {
      const a = o.attacks.find((x) => x.target === sh.target);
      if (!a) { ui.sheet = null; el.hidden = true; sc.hidden = true; return; }
      const t = E.unitByUid(st, a.target);
      el.className = phone ? "preview v5" : "preview"; sc.hidden = true;   // the field stays live under the preview: tap another red ring to switch target
      el.innerHTML = phone ? renderPreviewPhone(st, u, t, a) : renderPreview(st, u, t, a);
    } else if (sh.kind === "special" && o && o.special) {
      const p = o.special.targets.find((x) => x.target === sh.target);
      if (!p) { ui.sheet = null; el.hidden = true; sc.hidden = true; return; }
      el.className = phone ? "preview v5" : "preview"; sc.hidden = true;
      el.innerHTML = phone ? renderSpecialPhone(st, u, E.unitByUid(st, p.target), p) : renderSpecialPreview(st, u, E.unitByUid(st, p.target), p);
    } else if (sh.kind === "warm") { el.hidden = true; sc.hidden = true;
    } else if (sh.kind === "pull" && o && o.pull && phone) {
      el.className = "preview v5"; sc.hidden = true;
      el.innerHTML = renderPullPhone(st, u, o.pull);
    } else if (sh.kind === "pull" && o && o.pull) {
      const left = g.poleHP - st.pole[E.foeOf(u.team)];
      el.innerHTML = `${grab}<div style="font:700 20px/1.1 var(--display);letter-spacing:.02em">${esc(u.id)} pulls the ${sideName(E.foeOf(u.team))} flag <span class="muted" style="font:500 13px/1 var(--body)">flag HP ${left}</span></div>
        <div class="calc">${esc(o.pull.parts.join(" · "))} = <b>${fmt(o.pull.value)}</b></div>${diceRow(o.pull.value)}
        <div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="sheet-close" style="flex:1">Cancel</button><button class="btn go" data-act="pull-confirm" style="flex:2">Pull</button></div>`;
    } else if (sh.kind === "info") {
      const x = E.unitByUid(st, sh.uid);
      if (!x) { ui.sheet = null; renderSheet(); return; }
      const s = E.status(st, x), mine = st.phase === "play" && x.team === st.toMove, c = E.card(st, x), r = UI.rangeStat(c);
      const chips = [];
      if (x.hp > 0) {
        if (s.reloading) chips.push(chip("Reloading", "var(--attack)"));
        if (s.braced) chips.push(chip("Braced", "var(--brace)"));
        else if (s.bracedLast) chips.push(chip("Braced last turn", "var(--brace)", "hollow"));
        if (s.holder) chips.push(chip("Holding the flag", teamColor(x.team)));
      }
      const status = `<div class="uc-status">${hpLine(s.hp, s.maxHp, x.team, 90)}${x.hp > 0 ? stamSquares(x, mine ? s.stamNow : s.stamNext, 0) : ""}${chips.join("")}</div>`;
      el.className = "card-sheet";
      el.innerHTML = unitCardHtml(st.rs, x.card, { team: x.team, fk: x.fk, side: `${st.names[x.team]}${x.fk ? " · Flagkeeper" : ""}`, name: UI.unitName(st, x), status, special: x.hp > 0 ? s.special : null,
        stats: [["Str", fmt(c.str)], [r.label, fmt(r.val)], ["Move", fmt(E.capOf(st, x))]] });
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
        h += `<tr data-uid="${u.uid}" style="cursor:pointer"><td style="display:flex;align-items:center;gap:6px">${iconInline(iconKey(st.rs, u.card), teamColor(t), 16)}<b>${esc(u.id)}</b></td><td class="num">${u.hex}</td><td class="num">${fmt(s.hp)}/${s.maxHp}${s.dodge !== null && s.dodge !== undefined ? ` · ${s.dodge}%` : ""}</td><td>${[s.braced ? ic("brace", 14, "var(--brace)") : "", s.reloading ? ic("reload", 14, "var(--attack)") : "", s.warming ? ic("special", 14, "var(--gold)") : "", s.done ? ic("endunit", 14, "var(--muted)") : ""].join("")}</td></tr>`;
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
    if (o && ui.ghost && o.moves[ui.ghost]) {
      t = "";   // Brief 017: the route, its badges and the Move button say it all
    } else if (o && ui.armed) t = "Tap a red ring";
    else if (o && o.evading) { const tg = E.unitByUid(st, o.evading); t = Object.keys(o.moves).length ? `Evade: step further from ${tg ? tg.id : "the target"}, or End unit` : `Can't evade: ${E.whyNoMove(st, E.unitByUid(st, ui.sel))} · End unit`; }
    el.hidden = !t || !!ui.sheet; el.textContent = t;
  }

  // ---------- The hot-seat snap (Brief 014) ----------
  /* When both sides are human, each time the side to move changes during play (the first turn after the start cover
     included) the field scrolls so that side's own end is at the edge of the view nearest it: North to the very top,
     South to the very bottom. Not against the bot, not during deployment (its covers scroll on their own), not while a
     cover is up. The player can scroll freely after it. */
  function snapDue() {
    const st = App.st;
    return !!(st && st.phase === "play" && bothHuman() && !App.ui.cover && App.ui.snapped !== st.turn + st.toMove);
  }
  function hotSeatSnap() {
    const st = App.st, sc = $("fieldscroll");
    App.ui.snapped = st.turn + st.toMove;
    if (!sc || sc.scrollHeight <= sc.clientHeight + 2) return;   // the whole field already fits (desktop)
    sc.scrollTo({ top: st.toMove === "N" ? 0 : sc.scrollHeight - sc.clientHeight, behavior: "smooth" });
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
    renderTopbar(); renderBoard(); renderUnitbar(); renderActions(); renderSheet(); renderSide(); renderCover(); renderHint(); renderMenu();
    $("namesbtn").setAttribute("aria-pressed", App.ui.names ? "true" : "false");
    if (snapDue()) { App.ui.scrollTo = null; requestAnimationFrame(() => { hotSeatSnap(); updateEdges(); }); }
    else if (App.ui.scrollTo) { const h = App.ui.scrollTo; App.ui.scrollTo = null; requestAnimationFrame(() => { revealHex(h, true); updateEdges(); }); }
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
      if (here && here.team !== sel.team && ui.armed === "special" && o.special) {   // Brief 011: fire at a ringed target
        if (o.special.targets.some((x) => x.target === here.uid)) { ui.sheet = specialSheet(here.uid); ui.ghost = null; render(); revealAbove(sel.hex); return; }
      }
      if (here && here.team !== sel.team && ui.armed !== "special") {
        const a = targetsFor(o, ui.armed).find((x) => x.target === here.uid);
        if (a) { ui.sheet = attackSheet(here.uid); ui.ghost = null; render(); revealAbove(sel.hex); return; }
      }
      if (hex === fld().FLAG[E.foeOf(sel.team)] && o.pull) { ui.sheet = { kind: "pull" }; ui.ghost = null; ui.armed = null; render(); revealAbove(sel.hex); return; }
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
    const d = App.ui.drag;
    // Brief 017 §13 (desktop, a mouse): pointing at a move hex shows the full first-tap preview; one click moves.
    if (!d && e.pointerType === "mouse" && wide() && App.st && App.view === "play" && !App.ui.armed && !(App.ui.sheet && App.ui.sheet.kind !== "info")) {
      const o = selOptions(), h = hexAt(e.clientX, e.clientY);
      const g = o && h && o.moves[h] && !E.alive(App.st).some((u) => u.hex === h) ? h : null;
      if (g !== App.ui.ghost && (g || App.ui.hoverGhost)) { App.ui.ghost = g; App.ui.hoverGhost = !!g; renderBoard(); renderUnitbar(); renderActions(); renderSheet(); renderHint(); }
      return;
    }
    if (!d) {   // Brief 011: while a special is armed, hovering a target outlines Arc Hit's arc
      if (App.ui.armed !== "special" || !App.st) return;
      const h = hexAt(e.clientX, e.clientY), x = h && E.alive(App.st).find((u) => u.hex === h), id = x ? x.uid : null;
      if (id !== App.ui.spHover) { App.ui.spHover = id; renderBoard(); }
      return;
    }
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
      App.ui.sheet = attackSheet(here.uid); render(); revealAbove(E.unitByUid(st, d.uid).hex); return;
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
      case "go-units": if (App.view !== "rules") App.sheetBack = el.dataset.from || "home"; show("units"); break;
      case "go-rules": show("rules"); break;
      case "go-opponent": show("opponent"); break;
      case "go-match": loadMatches(); show("match"); break;
      case "continue": {
        if (App.live && (!App.match || App.match.id !== App.live.id)) { App.match = E.clone(App.live); rebuild(); resetUi(); if (App.st.phase === "deploy") beginDeploy(); else App.ui.scrollTo = fld().centre; }
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
      case "pick-plus": { const p = App.picks[App.lineupSide]; p.counts[el.dataset.card] = (p.counts[el.dataset.card] || 0) + 1; renderLineup(); renderLineupCard(); break; }
      case "pick-minus": { const p = App.picks[App.lineupSide]; p.counts[el.dataset.card] = Math.max(0, (p.counts[el.dataset.card] || 0) - 1); renderLineup(); renderLineupCard(); break; }
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
        const free = E.deployZone(st, t).filter((h) => !taken.has(h)).sort((a, b) => fld().dist(a, fld().centre) - fld().dist(b, fld().centre));
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
        if (ui.armed && list.length === 1) ui.sheet = attackSheet(list[0].target);
        render(); if (ui.sheet) revealAbove(E.unitByUid(st, ui.sel).hex); break;
      }
      case "special": {   // Brief 011: Unused → the warm-up line; Charged → targets (or warm up again when none)
        const o = selOptions(); if (!o || !o.special) break;
        if (o.special.state === "Charged" && o.special.fire) {
          ui.armed = ui.armed === "special" ? null : "special"; ui.ghost = null; ui.sheet = null;
          if (ui.armed && o.special.targets.length === 1) ui.sheet = specialSheet(o.special.targets[0].target);
          render(); if (ui.sheet) revealAbove(E.unitByUid(st, ui.sel).hex); break;
        }
        if (o.special.warmup) { ui.armed = null; ui.ghost = null; ui.sheet = { kind: "warm" }; render(); }
        break;
      }
      case "warm-confirm": act({ type: "warmup", uid: ui.sel }); break;
      case "special-confirm": if (ui.sheet && ui.sheet.kind === "special") act({ type: "special", uid: ui.sel, target: ui.sheet.target }); break;
      case "move-confirm": { const r = previewRoute(); if (r) act({ type: "move", uid: ui.sel, to: ui.ghost }); break; }
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
      case "sheet-close":
        if (ui.sheet && ui.sheet.kind === "info" && ui.sheet.back) { ui.sheet = ui.sheet.back; render(); break; }   // back to the preview it was opened from
        ui.sheet = null; ui.armed = null; ui.ghost = null; render(); break;
      case "card": if (a && el && el.dataset.uid) { ui.sheet = { kind: "info", uid: el.dataset.uid, back: ui.sheet }; render(); } break;   // Brief 025 §6.1: a name in the sheet opens that unit's card
      // Options menu (Brief 009)
      case "options": if (ui.menu) closeMenu(); else openMenu(); break;
      case "menu-close": closeMenu(); break;
      case "menu-match": closeMenu(false); show("match"); break;
      case "menu-rules": closeMenu(false); App.sheetBack = "play"; show("units"); break;
      case "menu-home": closeMenu(false); show("home"); break;
      case "menu-surrender": {
        closeMenu();
        if (st.phase === "play" && !isBot(st.toMove) && (await confirmBox(`${sideName(st.toMove)} surrenders?`, "The match ends and is saved.", "Surrender", "danger"))) act({ type: "surrender", team: st.toMove });
        break;
      }
      case "key-open": ui.sheet = { kind: "key" }; render(); break;   // Brief 025: from the unit bar's handle
      case "key-close": ui.sheet = null; render(); break;
      case "key-toggle": if (!App.ui.keySwiped) { ui.keyOpen = !ui.keyOpen; renderSheet(); } App.ui.keySwiped = false; break;
      // Lineup unit card (Brief 009)
      case "lineup-card": App.lineupCard = el.dataset.card; renderLineupCard(); break;
      case "lineup-card-close": App.lineupCard = null; renderLineupCard(); break;
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
    ["braceTiredness", "Brace tiredness", "How much Stamina bracing costs next turn (Light Ranged's Second Wind cancels it)."],
    ["staminaFloor", "Lowest starting Stamina", "No unit starts its turn below this, however many penalties stack."],
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
    ["deployRadius", "Deployment radius", "Deploy within this many hexes of your own flag."],
    ["deployRadius5", "Deployment radius, 5v5", "v3.8: deploy within this many hexes of your own flag at 5v5 (with the fields switch on)."]
  ];
  const SWITCHES = [
    ["tkoNeedsKeeper", "TKO needs the Flagkeeper to fall", "Off: removing every other unit is enough for a TKO."],
    ["defenderSupport", "Defender Support", "A defender with a friend adjacent takes 1 less (does not stack with Brace). Dropped after match 2."],
    ["captureTriggersSpike", "A capture counts as entering", "A unit stepping in after a kill takes a braced Anti-Cavalry's spike damage."],
    ["flagBlocksLine", "A flag blocks the line", "v3.6: a flag hex (held or empty, either side) straight between attacker and target blocks Volley and Reach."],
    ["pullFullStrength", "Pulls at full Strength", "v3.6: a Ranged unit pulls at its full Strength, enemy next to it or not."],
    ["pullCountsForReload", "A pull counts for Reload", "v3.6: a Heavy Ranged that pulls must reload next turn, and can't pull while reloading."],
    ["spearOnArrival", "Set spear hits arrivals only", "v3.6: set spear fires only on a unit arriving next to it (not one already there), and hits a unit at most once a turn."],
    ["rangedHalfWhenAdjacent", "Ranged halved when an enemy is adjacent", "A Ranged unit with an enemy next to it shoots at half Strength."],
    ["dice2d6", "Two dice, graded", "Two d6 added: 2 = −50%, 3 = −25%, 4–10 normal, 11 = +25%, 12 = +50%. Off: one d6 (1 halves, 6 adds half)."],
    ["diceVariety", "Dice variety", "v3.5: with two dice, 4–5 deals 10% less and 9–10 deals 10% more; 6–8 normal. Average unchanged."],
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
    ["turnLimitByFormat", "Turn limit per format", "v3.4: 5v5 and 7v7 each have their own turn limit (Turn limit, 5v5 / 7v7); other formats use Turn limit."],
    ["fields", "One field per format", "v3.8: 5v5 and 7v7 each play on their own field (5v5: 103 hexes, flags D3 and D15, deploy radius 5v5; 7v7: 147 hexes). Off: every format plays on the old 139-hex field."],
    ["routeRule211", "Routes (2.11)", "v3.9: a move walks the cheapest route to the hex you pick (then one that arrives, then fewer dangers, then toward the centre column, then toward your own flag). It stops where it enters a Mark on the way, and set spear can hit it on the way. Off: the move jumps to the hex."]
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
    let h = `<div class="scroll"><div class="wrap wide">${backbar("Unit data", App.sheetBack === "play" && App.st ? "play" : "home")}${sheetTabs("units")}${rsBar()}`;
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
    let h = `<div class="scroll"><div class="wrap wide">${backbar("Rules", App.sheetBack === "play" && App.st ? "play" : "home")}${sheetTabs("rules")}${rsBar()}`;
    h += `<div class="formrow"><label>Set name<input type="text" data-top="name" value="${esc(rs.name)}" style="width:240px"></label><label>Note<input type="text" data-top="note" value="${esc(rs.note || "")}" style="width:min(520px,80vw)"></label></div>`;
    h += `<div class="tablewrap"><table class="data"><thead><tr><th>Number</th><th>Value</th><th>What it does</th></tr></thead><tbody>`;
    // Brief 013: v3.4 on stores "Brace tiredness"; older rule sets keep "Stamina after bracing". Show only the one a set has.
    for (const [k, label, desc] of GAME_FIELDS.filter(([k]) => !(k === "staminaAfterBrace" || k === "braceTiredness") || rs.game[k] !== undefined)) h += `<tr><td>${label}</td><td><input type="number" min="0" step="1" data-game="${k}" value="${rs.game[k] === undefined ? "" : rs.game[k]}"></td><td class="desc">${desc}</td></tr>`;
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
    const row = (group, k) => { const [label, desc] = BR.BRAIN_LABELS[group + "." + k] || BR.BRAIN_LABELS[k] || [k, ""]; return `<tr><td>${esc(label)}</td><td><input type="number" step="0.05" min="0" data-brain="${group}" data-field="${k}" value="${b[group][k]}"></td><td class="desc">${esc(desc)}</td></tr>`; };
    const table = (group, head) => `<div class="tablewrap"><table class="data"><thead><tr><th>${head}</th><th>Value</th><th>What it means</th></tr></thead><tbody>${Object.keys(b[group]).map((k) => row(group, k)).join("")}</tbody></table></div>`;
    if (b.model) {   // Brain 5: one value model (Brief 006)
      h += `<p class="note">${esc(b.name)} plans its whole turn and scores every plan the same way: what it gains, what it risks next turn, and what it leaves for next turn. These weights are that score.</p>`;
      h += table("model", "Weight") + (b.plan5 ? table("plan5", "Planning") : "");
      if (b.lead) h += `<p class="note">The lead (Brain 7): five behaviours, each switched on with 1 and off with 0, then the numbers they use. With all five off it plays exactly like Brain 5.</p>` + table("lead", "Lead");
    } else h += table("weights", "Weight");
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
    return JSON.stringify({ ruleset: m.rs, opts: m.opts, brains: m.brains, started: m.started, game: m.game || null, build: m.build || null, actions: m.actions, botMoves: m.botMoves || [], result: result || null }, null, 1);
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
      for (const x of App.matches) h += `<tr><td><button type="button" class="iconbtn" data-act="copy-finished" data-id="${esc(x.id)}" aria-label="Copy this match's record for Claude" title="Copy match record">${ic("copy", 18)}</button></td><td>${x.finished ? new Date(x.finished).toLocaleDateString() : ""}</td><td>${esc(x.ruleset)}${V.startedOn && V.startedOn(x) ? `<br><span class="muted">${esc(V.startedOn(x))}</span>` : ""}</td><td>${x.how === "abandoned" ? "Abandoned" : x.winner ? esc(x.names ? x.names[x.winner] : sideName(x.winner)) + " (" + sideName(x.winner) + "), " + esc(say(x.how)) : "Draw, " + esc(say(x.how))}</td><td class="num">${x.turn}</td><td class="num">${x.pull ? x.pull.N + "–" + x.pull.S : ""}</td><td class="num">${x.lost ? x.lost.N + "–" + x.lost.S : ""}</td></tr>`;
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
      const b = e.target.closest("[data-act]");
      if (b && b.getAttribute("aria-disabled") === "true") { if (b.dataset.why === PICK) pickNote(); else if (b.dataset.why) toast(b.dataset.why); return; }   // Brief 005: say why
      if (b && !b.disabled) { onAction(b.dataset.act, b); return; }
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
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (App.view === "play" && App.ui.menu) { closeMenu(); return; }
      if (App.view === "lineup" && App.lineupCard) { const code = App.lineupCard; App.lineupCard = null; renderLineupCard(); const b = document.querySelector(`[data-act="lineup-card"][data-card="${code}"]`); if (b) b.focus(); return; }
      if (App.view === "play" && App.ui.sheet && App.ui.sheet.kind !== "over") { App.ui.sheet = null; App.ui.armed = null; App.ui.ghost = null; render(); return; }
      if (App.view === "play" && (App.ui.ghost || App.ui.armed)) { App.ui.ghost = null; App.ui.armed = null; render(); }   // Brief 017 §13: Escape cancels a hover preview
    });
    // Options menu: tapping the dim closes it. Lineup card: tapping the dim closes it.
    $("menudim").addEventListener("click", () => closeMenu());
    $("lscrim").addEventListener("click", () => { App.lineupCard = null; renderLineupCard(); });
    // The attack preview's grab handle: drag up opens the key, drag down closes it; a tap toggles it (Brief 009 §3a).
    let keyDrag = null;
    document.addEventListener("pointerdown", (e) => { const h = e.target.closest && !e.target.closest("#sheet .nb") && e.target.closest("#sheet .handle, #sheet .strip"); keyDrag = h ? { y: e.clientY } : null; });
    document.addEventListener("pointerup", (e) => {
      if (!keyDrag) return;
      const dy = e.clientY - keyDrag.y; keyDrag = null;
      if (Math.abs(dy) < 16) return;   // a tap: the click handler toggles
      App.ui.keySwiped = true; setTimeout(() => (App.ui.keySwiped = false), 400);
      const open = dy < 0;
      if (App.ui.keyOpen !== open) { App.ui.keyOpen = open; renderSheet(); }
    });
    window.addEventListener("resize", () => { if (App.view === "play" && App.st) { renderUnitbar(); renderActions(); renderSheet(); } });   // phone ↔ desktop (Brief 025)
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
    const spec = WT.fromQuery(location.search);
    if (spec) startWatch(spec, /[?&]fast=1/.test(location.search));
  }
  // For the build's screenshots only (a "?shots=1" link): lets a test script set up a position. Nothing reads it in play.
  if (/[?&]shots=1/.test(location.search)) window.GGShots = { App, render, act, show, rebuild, resetUi, onBoardTap, E, D };
  boot();
})();
