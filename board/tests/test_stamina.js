// Stamina model checks (Brief 013): base Stamina per card, next-turn modifiers that stack, the floor, and the rules
// it touches (Brace, Second Wind, set spear, tackle at hex cost, Evade). No preset plays differently.
// The floor check at the end tries every combination of the shipped modifiers on every card of every preset, so a
// future modifier that could start a unit below the floor fails its own pull request.
// node tests/test_stamina.js
const E = require("../engine.js"); const { PRESETS, DEFAULT_RULESET } = require("../data.js");
const Bot = require("../bot.js"); const { DEFAULT_BRAINS } = require("../brain.js"); const rng = require("./rng.js");
const ALL = [DEFAULT_RULESET, ...PRESETS], NEWEST = PRESETS[PRESETS.length - 1];
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
const copy = (o) => JSON.parse(JSON.stringify(o));
/** A match in play, North to move, with every unit placed where `place` says (others parked on spare hexes). */
function setup(rs, lineN, lineS, place) {
  const st = E.newMatch(rs, { first: "N", lineups: { N: L(lineN), S: L(lineS) } });
  for (const team of ["N", "S"]) {
    const zone = E.deployZone(st, team).filter((h) => h !== E.FLAG[team]), p = {}; let i = 0;
    for (const u of st.units.filter((x) => x.team === team)) p[u.uid] = zone[i++];
    const r = E.act(st, { type: "deploy", team, placements: p }); if (!r.ok) throw new Error(r.error);
  }
  for (const uid in place) U(st, uid).hex = place[uid];
  return st;
}
const end = (st) => E.act(st, { type: "end" });
const snap = (st) => JSON.stringify({ u: st.units, cmd: st.cmd, pole: st.pole, log: st.log.length });

// ---- Brace and Second Wind, every preset, every current card ----
for (const rs of ALL) {
  for (const code of Object.keys(rs.cards)) {
    const st = setup(rs, [["X", code]], [["Y", "HM"]], { "N-X": "E9", "S-Y": "A6" });
    const u = U(st, "N-X");
    ok(u.stam === 3 && E.baseStamina(st, u) === 3, `${rs.id} ${code}: base Stamina 3`);
    ok(E.status(st, u).stamNext === 3, `${rs.id} ${code}: unbraced, next turn 3`);
    const r = E.act(st, { type: "brace", uid: "N-X" }); ok(r.ok, `${rs.id} ${code}: can brace`);
    const want = rs.cards[code].brace === "fullStamina" ? 3 : 2;
    const shown = E.status(st, u).stamNext;
    ok(shown === want, `${rs.id} ${code}: braced, unit info says next turn ${want} (got ${shown})`);
    ok(shown === E.nextStamina(st, u), `${rs.id} ${code}: unit info reads the engine's next-turn Stamina`);
    end(st); end(st);   // South's turn, then North's again
    ok(st.toMove === "N" && u.stam === want, `${rs.id} ${code}: starts its next turn on ${want} (got ${u.stam})`);
    end(st); end(st);
    ok(u.stam === 3, `${rs.id} ${code}: back to 3 the turn after`);
  }
}

// ---- Base Stamina per card (test-only cards: no preset ships one) ----
{ const rs = copy(NEWEST); rs.cards.HM.stamina = 4; rs.cards.LR.stamina = 2;
  const st = setup(rs, [["HM", "HM"], ["LR", "LR"], ["LM", "LM"]], [["Y", "HM"]], { "N-HM": "E9", "N-LR": "C9", "N-LM": "G9", "S-Y": "A6" });
  ok(U(st, "N-HM").stam === 4 && U(st, "N-LR").stam === 2 && U(st, "N-LM").stam === 3, "a card's own Stamina is used from the first turn; others keep the rule set's 3");
  E.act(st, { type: "brace", uid: "N-HM" }); E.act(st, { type: "brace", uid: "N-LR" }); E.act(st, { type: "brace", uid: "N-LM" });
  ok(E.status(st, U(st, "N-HM")).stamNext === 3 && E.status(st, U(st, "N-LR")).stamNext === 2 && E.status(st, U(st, "N-LM")).stamNext === 2,
    "brace tiredness comes off each card's own base (4 → 3, 3 → 2); Second Wind keeps a 2-Stamina card on 2");
  end(st); end(st);
  ok(U(st, "N-HM").stam === 3 && U(st, "N-LR").stam === 2 && U(st, "N-LM").stam === 2, "the turn start matches the unit info"); }

// ---- Stacking and the floor (test-only modifiers "testA", "testB": not shipped in any preset) ----
for (const rs of ALL) {
  const st = setup(rs, [["X", "HM"], ["R", "LR"]], [["Y", "HM"]], { "N-X": "E9", "N-R": "C9", "S-Y": "A6" });
  const u = U(st, "N-X"), r = U(st, "N-R");
  E.act(st, { type: "brace", uid: "N-X" }); E.act(st, { type: "brace", uid: "N-R" });
  end(st);   // South's turn: "enemy" effects land now
  E.addStaminaMod(st, u, { effect: "testA", source: "enemy", amount: -1 });
  E.addStaminaMod(st, u, { effect: "testB", source: "enemy", amount: -1 });
  ok(E.status(st, u).stamNext === 1, `${rs.id}: three −1 penalties from different effects on a 3-Stamina card: next turn 1, not 0 (shows ${E.status(st, u).stamNext})`);
  E.addStaminaMod(st, r, { effect: "testA", source: "enemy", amount: -1 });
  E.addStaminaMod(st, r, { effect: "testA", source: "enemy", amount: -1 });
  ok(r.staminaMods.length === 1, `${rs.id}: the same effect triggered twice in one turn is recorded once`);
  ok(E.status(st, r).stamNext === 2, `${rs.id}: Second Wind cancels the unit's own brace tiredness but not an enemy's penalty (3 − 1 = 2, shows ${E.status(st, r).stamNext})`);
  end(st);
  ok(u.stam === 1 && r.stam === 2, `${rs.id}: the turn start agrees (${u.stam}, ${r.stam})`);
  ok(u.staminaMods === undefined && r.staminaMods === undefined, `${rs.id}: recorded modifiers are used up at the turn start`);
  end(st); end(st);
  ok(u.stam === 3 && r.stam === 3, `${rs.id}: and gone the turn after`);
}
{ // the same effect listed twice counts once, even straight into the sum
  const st = setup(NEWEST, [["X", "HM"]], [["Y", "HM"]], { "N-X": "E9", "S-Y": "A6" }), u = U(st, "N-X");
  const m = { effect: "testA", source: "enemy", amount: -1 };
  ok(E.staminaWith(st, u, [m, m, m]) === 2, "one effect listed three times takes 1 off, not 3");
  ok(E.staminaWith(st, u, [m, { effect: "testB", source: "enemy", amount: -1 }, { effect: "testC", source: "enemy", amount: -1 }, { effect: "testD", source: "enemy", amount: -1 }]) === 1,
    "four different penalties on 3 Stamina stop at the floor of 1");
  ok(E.staminaWith(st, u, [{ effect: "secondWind", source: "self", cancels: "braceTiredness", amount: 0 }, { effect: "braceTiredness", source: "enemy", amount: -1 }]) === 2,
    "Second Wind cancels only the unit's own brace tiredness (an enemy-sourced effect of that name still counts)");
  // scratch copies (the bot's) must not leak a recorded modifier back into the real match
  const s = E.cloneLite(st); E.addStaminaMod(s, U(s, "N-X"), m);
  ok(u.staminaMods === undefined && E.nextStamina(st, u) === 3, "a modifier added on a scratch copy stays on the copy");
  // the floor is a number in data.js
  ok(ALL.every((rs) => rs.game.staminaFloor === 1), "every preset states a floor of 1 in data.js");
}
{ // rule sets saved before Brief 013 (no floor stated) replay exactly as before, even with odd numbers
  const rs = copy(PRESETS[0]); delete rs.game.staminaFloor; rs.game.staminaAfterBrace = 0;
  const st = setup(rs, [["X", "HM"]], [["Y", "HM"]], { "N-X": "E9", "S-Y": "A6" }), u = U(st, "N-X");
  E.act(st, { type: "brace", uid: "N-X" }); end(st); end(st);
  ok(u.stam === 0, `a saved rule set with "Stamina after bracing" 0 and no floor still starts a braced unit on 0 (got ${u.stam})`);
}
ok(NEWEST.game.braceTiredness === 1 && NEWEST.game.staminaAfterBrace === undefined, `${NEWEST.id} stores Brace tiredness 1 (not Stamina after bracing)`);
// Brief 010 adds v3.5 after v3.4; it inherits v3.4's Brace tiredness. "Older" means the presets before v3.4.
const FROM_V34 = ALL.findIndex((rs) => rs.id === "v3.4");
ok(ALL.slice(FROM_V34).every((rs) => rs.game.braceTiredness === 1 && rs.game.staminaAfterBrace === undefined), "v3.4 and later store Brace tiredness 1");
ok(ALL.slice(0, FROM_V34).every((rs) => rs.game.staminaAfterBrace === 2 && rs.game.braceTiredness === undefined), "older presets keep Stamina after bracing 2");

// ---- Set spear (3.13): one spear per entry; the other braced Heavy Anti-Cavalry stays loaded ----
{ const X = "E10", ring = E.NBRS[X];
  let geo = null;   // two adjacent neighbours of X for the spears, two more neighbours of X not next to either
  for (const a of ring) for (const b of ring) if (!geo && a < b && E.dist(a, b) === 1) {
    const free = ring.filter((h) => h !== a && h !== b && E.dist(h, a) > 1 && E.dist(h, b) > 1);
    if (free.length >= 2) geo = { a, b, s1: free[0], s2: free[1] };
  }
  for (const rs of ALL) {
    const st = setup(rs, [["M1", "LM"], ["M2", "LM"], ["M3", "LM"]], [["A1", "HA"], ["A2", "HA"]],
      { "S-A1": geo.a, "S-A2": geo.b, "N-M1": geo.s1, "N-M2": geo.s2, "N-M3": "A6" });
    for (const id of ["S-A1", "S-A2"]) { U(st, id).braced = true; U(st, id).spikeUsed = false; }
    const m1 = U(st, "N-M1"), m2 = U(st, "N-M2"), hp0 = m1.hp;
    let r = E.act(st, { type: "move", uid: "N-M1", to: X });
    const used = () => ["S-A1", "S-A2"].filter((id) => U(st, id).spikeUsed).length;
    ok(r.ok && hp0 - m1.hp === rs.spikeDamage && used() === 1, `${rs.id}: entering next to two braced Heavy Anti-Cavalry takes one spear (${rs.spikeDamage}), not two (took ${hp0 - m1.hp})`);
    m1.hex = "A8";   // clear the hex (test set-up)
    const hp1 = m2.hp; r = E.act(st, { type: "move", uid: "N-M2", to: X });
    ok(r.ok && hp1 - m2.hp === rs.spikeDamage && used() === 2, `${rs.id}: a second unit entering the same hex takes the second spear (took ${hp1 - m2.hp})`);
    m2.hex = "A10";
    const m3 = U(st, "N-M3"); m3.hex = geo.s1; const hp2 = m3.hp; r = E.act(st, { type: "move", uid: "N-M3", to: X });
    ok(r.ok && hp2 - m3.hp === 0, `${rs.id}: a third unit finds both spears used (took ${hp2 - m3.hp})`);
  }
}

// ---- Tackle at hex cost (6.6): a Heavy unit on 1 Stamina can't break away; refused, never started ----
for (const rs of ALL) {
  const from = "E10", foe = E.NBRS[from][0], to = E.NBRS[from].find((h) => E.dist(h, foe) > 1);
  const st = setup(rs, [["H", "HM"]], [["T", "LM"]], { "N-H": from, "S-T": foe });
  const h = U(st, "N-H"); h.stam = 1;
  ok(!E.options(st, "N-H").moves[to], `${rs.id}: breaking away on 1 Stamina (1 for the hex + 1 for tackle) isn't offered`);
  const before = snap(st), r = E.act(st, { type: "move", uid: "N-H", to });
  ok(!r.ok && snap(st) === before, `${rs.id}: the move is refused and nothing changes (no half move, no Stamina or Command spent)`);
  U(st, "N-H").stam = 2;   // re-read: a refused action puts back a copy of the units
  ok(!!E.options(st, "N-H").moves[to], `${rs.id}: with 2 Stamina it can break away`);
}
// ---- Attacks and braces: refused whole when the unit can't pay ----
for (const rs of ALL) {
  const st = setup(rs, [["H", "HM"]], [["T", "HM"]], { "N-H": "E10", "S-T": E.NBRS.E10[0] });
  U(st, "N-H").stam = 0.5;
  for (const a of [{ type: "attack", uid: "N-H", target: "S-T" }, { type: "brace", uid: "N-H" }]) {
    const before = snap(st), r = E.act(st, a, () => 7);
    ok(!r.ok && snap(st) === before, `${rs.id}: ${a.type} on 0.5 Stamina is refused and nothing changes`);
  }
  st.cmd = 0.5; U(st, "N-H").stam = 3;
  const before = snap(st), r = E.act(st, { type: "attack", uid: "N-H", target: "S-T" }, () => 7);
  ok(!r.ok && snap(st) === before, `${rs.id}: an attack with 0.5 Command left is refused and nothing changes`);
}

// ---- Within a turn, nothing is cut off partway: bot games on the newest preset (Evade included) ----
{ const R = rng("stamina", 1013);
  let checked = 0, evades = 0;
  for (let g = 0; g < 4; g++) {
    const B = DEFAULT_BRAINS[g % 2 ? "brain5" : "standard"];
    const line = L([["HM", "HM"], ["HM2", "HM"], ["HA", "HA"], ["LM", "LM"], ["LR", "LR"]]);
    const st = E.newMatch(NEWEST, { first: g % 2 ? "S" : "N", lineups: { N: line, S: line } });
    for (const t of [st.first, E.foeOf(st.first)]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, R) });
    let k = 0;
    while (st.phase === "play" && k++ < 3000) {
      for (const u of E.alive(st).filter((x) => x.team === st.toMove && !x.done)) {
        const o = E.options(st, u.uid);
        if (u.evadeFrom) evades++;
        for (const h in o.moves) { checked++; const m = o.moves[h];
          if (m.cost > u.stam + 1e-9 || m.cost > st.cmd + 1e-9 || m.steps + u.moved > E.capOf(st, u)) { ok(false, `game ${g}: ${u.id} is offered ${h} it can't pay for in full`); }
        }
      }
      const a = Bot.chooseAction(st, B, R).action, r = E.act(st, a, () => E.rollWith(st, R)); if (!r.ok) end(st);
      if (st.cmd < -1e-9 || E.alive(st).some((u) => u.stam < -1e-9)) ok(false, `game ${g}: Stamina or Command went below 0`);
    }
  }
  ok(checked > 1000 && evades > 0, `bot games: every offered move (${checked}, ${evades} positions mid-Evade) fits the unit's Stamina, Command and cap`);
}

// ---- The floor check: every card, every preset, every combination of the shipped modifiers ----
{ const effects = Object.entries(E.STAMINA_EFFECTS);
  ok(effects.every(([, d]) => (d.source === "self" || d.source === "enemy") && typeof d.worst === "function"), "every Stamina modifier states its source and its worst case");
  const worst = [];
  for (const rs of ALL) {
    const st = E.newMatch(rs, { first: "N", lineups: { N: [], S: [] } });
    for (const code of Object.keys(rs.cards)) {
      const u = { card: code, braced: false };
      let low = Infinity;
      for (let mask = 0; mask < 1 << effects.length; mask++) {
        const mods = effects.filter((_, i) => mask & (1 << i)).map(([effect, d]) => ({ effect, source: d.source, cancels: d.cancels, amount: d.worst(st, u) }));
        low = Math.min(low, E.staminaWith(st, u, mods));
      }
      ok(low >= 1, `${rs.id} ${code}: worst-case next-turn Stamina ${low}, at least 1`);
      worst.push(`${rs.id} ${code} ${low}`);
    }
  }
  if (process.argv.includes("--worst")) console.log(worst.join("\n"));
}

console.log(`${n} checks, ${fails} failures`);
process.exit(fails ? 1 : 0);
