// UI v2 checks (Brief 009): the attack preview's outcome bar, changed numbers, Evade, the unit card text, and
// "unit cap (UC)", never the old word, in anything the board can show.
// node tests/test_ui.js
const fs = require("fs"), path = require("path");
const E = require("../engine.js"); const { PRESETS, DEFAULT_RULESET } = require("../data.js");
const UI = require("../ui.js"); const Bot = require("../bot.js"); const { DEFAULT_BRAINS } = require("../brain.js");
const rng = require("./rng.js");
const V34 = PRESETS.find((p) => p.id === "v3.4");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const L = (a) => a.map(([id, card]) => ({ id, card }));
const U = (st, id) => E.unitByUid(st, id);
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
const attackOf = (st, uid, target) => E.options(st, uid).attacks.find((a) => a.target === target);
const preview = (st, uid, target) => UI.attackPreview(st, U(st, uid), U(st, target), attackOf(st, uid, target));
const stat = (side, key) => side.stats.find((s) => s.key === key);

// ---- Outcome bar: equal neighbours merge, chances add up, one slot per dieCases entry ----
{
  const segs = UI.outcomeSegments([[2, 0.1], [3, 0.2], [3, 0.4], [5, 0.2], [6, 0.1]], 5);
  ok(segs.length === 4, "equal neighbours merge into one segment");
  ok(segs[1].slots === 2 && Math.abs(segs[1].p - 0.6) < 1e-12 && segs[1].dmg === 3, "a merged segment spans its slots and sums its chances");
  ok(segs.reduce((s, x) => s + x.slots, 0) === 5, "slots still add up to the number of cases");
  ok(!segs[0].kills && !segs[1].kills && segs[2].kills && segs[3].kills, "segments at or over the kill line kill");
  ok(segs[0].opacity === 0.25 && segs[3].opacity === 1 && segs[1].opacity > 0.25 && segs[1].opacity < segs[2].opacity, "opacity rises with damage, 0.25 to 1");
  const same = UI.outcomeSegments([[4, 0.5], [4, 0.5]], 10);
  ok(same.length === 1 && same[0].slots === 2 && same[0].opacity === 1, "all-equal damage is one full segment");
  const apart = UI.outcomeSegments([[4, 0.25], [5, 0.25], [4, 0.5]], 10);
  ok(apart.length === 3, "only neighbours merge (equal damage apart stays apart)");
  // The engine's own cases: one slot per dieCases entry, on every preset.
  for (const rs of [DEFAULT_RULESET, ...PRESETS]) {
    const st = setup(rs, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E9", "S-HM": "E10", "N-HM": "A6", "S-LR": "I12" });
    const a = attackOf(st, "N-LM", "S-HM"), segs = UI.outcomeSegments(a.cases, a.effHp);
    ok(segs.reduce((s, x) => s + x.slots, 0) === E.dieCases(st).length, `${rs.id}: slots follow dieCases (${E.dieCases(st).length})`);
    ok(Math.abs(segs.reduce((s, x) => s + x.p, 0) - 1) < 1e-9, `${rs.id}: chances add up to 100%`);
  }
  // v3.4, Light Melee (Str 9) on a Heavy Melee (Armor 3): 6 × (0.5, 0.75, 1, 1.25, 1.5) = 3, 4.5, 6, 7.5, 9 — five segments.
  const st = setup(V34, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E9", "S-HM": "E10", "N-HM": "A6", "S-LR": "I12" });
  const s34 = UI.outcomeSegments(attackOf(st, "N-LM", "S-HM").cases);
  ok(s34.map((s) => s.dmg).join(",") === "3,4.5,6,7.5,9", "v3.4 LM on HM: damage 3, 4.5, 6, 7.5, 9 from the engine");
  ok(s34.map((s) => UI.pct1(s.p)).join(" ") === "2.8% 5.6% 83.3% 5.6% 2.8%", "v3.4 chances: 2.8% 5.6% 83.3% 5.6% 2.8%");
}

// ---- Changed numbers: Half Strength 9 → 4.5 red for the attacker; Pierce Armor −3 → 0 in ink ----
{
  ok(UI.changeTone("N", "N", 9, 4.5, true) === "hurt", "the mover's own Strength going down hurts the mover");
  ok(UI.changeTone("S", "N", 3, 0, true) === "help", "the target's Armor going down helps the mover");
  ok(UI.changeTone("N", "N", 9, 9, true) === null, "no change, no tone");
  // Heavy Ranged (Str 9) at E8 shoots a Heavy Melee (Armor 3) at E11, with a South Light Melee next to the Heavy Ranged.
  const st = setup(V34, [["HR", "HR"], ["HM", "HM"]], [["HM", "HM"], ["LM", "LM"]], { "N-HR": "E8", "S-HM": "E11", "S-LM": "E9", "N-HM": "A6" });
  const p = preview(st, "N-HR", "S-HM"), s = stat(p.attacker, "maul"), ar = stat(p.target, "armor");
  ok(s.old === "9" && s.val === "4.5" && s.tone === "hurt", `Half Strength shows 9 → 4.5, red (got ${JSON.stringify(s)})`);
  ok(ar.old === "−3" && ar.val === "0" && ar.tone === "help", `Pierce shows Armor −3 → 0, ink (got ${JSON.stringify(ar)})`);
  ok(p.rows.some((r) => r.name === "Half Strength" && /Light Melee is next to your Heavy Ranged/.test(r.why)), "the key names the enemy next to the shooter");
  ok(p.rows.some((r) => r.name === "Pierce" && /Armor −3 doesn't count/.test(r.why)), "the key explains Pierce");
  ok(!p.target.stats.some((x) => x.key === "parry"), "no Parry stat on a ranged shot");
  // Without an enemy next to it, Strength is unchanged and shows once.
  const st2 = setup(V34, [["HR", "HR"], ["HM", "HM"]], [["HM", "HM"], ["LM", "LM"]], { "N-HR": "E8", "S-HM": "E11", "S-LM": "A14", "N-HM": "A6" });
  const s2 = stat(preview(st2, "N-HR", "S-HM").attacker, "maul");
  ok(s2.val === "9" && s2.old === undefined, "Strength unchanged shows one number");
  // South's turn: South's Heavy Ranged is halved → still red (it hurts the side to move, now South).
  const st3 = setup(V34, [["HM", "HM"], ["LM", "LM"]], [["HR", "HR"], ["HM", "HM"]], { "S-HR": "E12", "N-HM": "E9", "N-LM": "E11", "S-HM": "I14" });
  E.act(st3, { type: "end" });
  const s3 = stat(preview(st3, "S-HR", "N-HM").attacker, "maul");
  ok(s3.tone === "hurt" && s3.val === "4.5", "South's own halved Strength is red on South's turn");
}

// ---- Evade in the preview equals evadePreview().hexes, including a tackled case ----
{
  const st = setup(V34, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E9", "S-HM": "E10", "N-HM": "A6", "S-LR": "I12" });
  const p = preview(st, "N-LM", "S-HM"), ev = E.evadePreview(st, U(st, "N-LM"), U(st, "S-HM"));
  ok(stat(p.attacker, "evade").val === String(ev.hexes), `Evade stat = evadePreview().hexes (${ev.hexes})`);
  ok(p.rows.some((r) => r.name === `Evade ${ev.hexes}`), "the key's Evade row carries the same number");
  // Tackled: the Light Melee has spent Stamina so breaking tackle is out of reach after the attack.
  const st2 = setup(V34, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E9", "S-HM": "E10", "N-HM": "A6", "S-LR": "I12" });
  U(st2, "N-LM").stam = 1.5;
  const ev2 = E.evadePreview(st2, U(st2, "N-LM"), U(st2, "S-HM")), p2 = preview(st2, "N-LM", "S-HM");
  ok(ev2.hexes === 0 && /Tackled/.test(ev2.reason), `tackled case: 0 hexes with a tackle reason (${ev2.reason})`);
  ok(stat(p2.attacker, "evade").val === "0", "tackled: the Evade stat shows 0");
  ok(p2.rows.some((r) => r.name === "Evade 0" && /Tackled/.test(r.why)), "tackled: the key gives the engine's reason");
  // A Heavy unit has no Evade: left out.
  const st3 = setup(V34, [["HM", "HM"], ["LM", "LM"]], [["HM", "HM"], ["LR", "LR"]], { "N-HM": "E9", "S-HM": "E10", "N-LM": "A6", "S-LR": "I12" });
  ok(!stat(preview(st3, "N-HM", "S-HM").attacker, "evade"), "no Evade stat for a Heavy attacker");
}

// ---- Melee on a braced Heavy Melee: Brace, Armor, Parry; parry left out once used ----
{
  const st = setup(V34, [["LM", "LM"], ["HM", "HM"]], [["HM", "HM"], ["LR", "LR"]], { "N-LM": "E9", "S-HM": "E10", "N-HM": "D10", "S-LR": "I12" });
  U(st, "S-HM").braced = true;
  const p = preview(st, "N-LM", "S-HM");
  ok(stat(p.target, "brace").val === "−2" && stat(p.target, "armor").val === "−3", "braced Heavy Melee: Brace −2, Armor −3");
  ok(stat(p.target, "parry").red && stat(p.target, "parry").val === E.fmt(E.parryPreview(st, U(st, "N-LM"), U(st, "S-HM")).amount), "Parry in red with the engine's amount");
  ok(stat(p.attacker, "support").val === "+1", "Support +1 from the Heavy Melee next to the target");
  ok(p.rows.some((r) => r.name === "Support +1" && /Your Heavy Melee is next to it/.test(r.why)), "the key names the supporter");
  ok(p.rows.findIndex((r) => r.name.startsWith("Support")) < p.rows.findIndex((r) => r.name === "Armor"), "attacker rows come before defender rows");
  U(st, "S-HM").parryUsed = true;
  ok(!stat(preview(st, "N-LM", "S-HM").target, "parry"), "no Parry stat once it has parried this turn");
}

// ---- Unit card text: one line per ability, numbers from the rule set; Light units on v3.4 have Evade ----
{
  const secs = (rs, code) => UI.cardSections(rs, code);
  const names = (rs, code) => secs(rs, code).flatMap((s) => s.items.map((i) => i.name));
  ok(names(V34, "HM").join(",") === "Tackle,Armor 3,Mark,Parry", "HM v3.4: Tackle, Armor 3, Mark, Parry");
  ok(names(V34, "LM").join(",") === "Tackle,Swift,Dodge,Evade,Weave", "LM v3.4: Tackle, Swift, Dodge, Evade, Weave");
  ok(names(V34, "HR").join(",") === "Volley,Armor 2,Cover Fire,Pierce,Reload", "HR v3.4: Volley, Armor 2, Cover Fire, Pierce, Reload");
  ok(names(V34, "LR").join(",") === "Volley,Swift,Dodge,Evade,Second Wind", "LR v3.4");
  ok(names(V34, "HA").join(",") === "Reach,Armor 3,Mark,Set Spear", "HA v3.4");
  ok(names(V34, "LA").join(",") === "Reach,Swift,Dodge,Evade,Fend", "LA v3.4");
  ok(secs(V34, "HR").find((s) => s.head === "Unit").items.find((i) => i.name === "Reload").cost, "Reload carries COST");
  ok(UI.cardTypeLine(V34.cards.HR) === "Ranged · Heavy · 1 UC", "type line: Ranged · Heavy · 1 UC");
  ok(UI.lineupStats(V34.cards.HA) === "HP 18 · Str 8 · Reach 2 · Move 3", "Anti-Cavalry says Reach 2");
  const v32 = PRESETS.find((p) => p.id === "v3.2");
  ok(!names(v32, "LM").includes("Evade"), "no Evade before v3.3");
  ok(/1 more Stamina/.test(secs(v32, "HM")[0].items[0].text), "Tackle before v3.3: the flat tackle cost");
  ok(/shift one hex/.test(secs(PRESETS.find((p) => p.id === "v2"), "HM")[1].items.find((i) => i.name === "Mark").text), "Mark before the hard stop may shift one hex");
}

// ---- "Unit cap (UC)", never the old word, in anything the board can show ----
{
  const bad = [];
  const check = (where, text) => { if (UI.BANNED.test(UI.say(text))) bad.push(`${where}: ${text}`); };
  // Engine text the board shows: log, result, tiebreak, block reasons, Evade reasons, and the preview key, over seeded games.
  const rnd = rng("ui-being", 0), B = DEFAULT_BRAINS.brain5 || DEFAULT_BRAINS.standard;
  for (const base of [DEFAULT_RULESET, ...PRESETS]) for (const size of [5, 7]) {
    const rs = JSON.parse(JSON.stringify(base));
    const codes = size === 5 ? ["HM", "HM", "HA", "LM", "LR"] : ["HM", "HM", "LM", "HR", "LR", "HA", "LA"];
    const cnt = {}; const line = codes.map((c) => { cnt[c] = (cnt[c] || 0) + 1; return { id: cnt[c] === 1 ? c : c + cnt[c], card: c, fk: false }; });
    if (!rs.switches.noKeeper) line[0].fk = true;
    const st = E.newMatch(rs, { first: "N", lineups: { N: line, S: line } });
    for (const t of ["N", "S"]) E.act(st, { type: "deploy", team: t, placements: Bot.deploy(st, t, B, rnd) });
    let k = 0;
    while (st.phase === "play" && k++ < 3000) {
      for (const u of E.alive(st).filter((x) => x.team === st.toMove)) {
        const br = E.blockReasons(st, u.uid); for (const key in br) if (br[key]) check(`${rs.id} blockReasons`, br[key]);
        for (const a of E.options(st, u.uid).attacks) {
          const t = U(st, a.target);
          if (a.evade && a.evade.reason) check(`${rs.id} evade`, a.evade.reason);
          for (const r of UI.attackPreview(st, u, t, a).rows) check(`${rs.id} key`, `${r.name} ${r.means} ${r.why}`);
        }
      }
      const a = Bot.chooseAction(st, B, rnd).action; const r = E.act(st, a, () => E.rollWith(st, rnd)); if (!r.ok) E.act(st, { type: "end" });
    }
    for (const l of st.log) check(`${rs.id} log`, l.text);
    if (st.result) check(`${rs.id} result`, st.result.how);
  }
  // The tiebreak's unit-cap reason, forced.
  const st = setup(V34, [["HM", "HM"], ["LM", "LM"]], [["HM", "HM"], ["LM", "LM"]], {});
  U(st, "S-LM").hp = 0;
  const tb = E.tiebreak(st); check("tiebreak", tb.reason || JSON.stringify(tb));
  ok(/unit cap/.test(UI.say(tb.reason || "")), `the tiebreak reads "unit cap" (${UI.say(tb.reason || "")})`);
  // Unit card text for every card of every preset.
  for (const rs of [DEFAULT_RULESET, ...PRESETS]) for (const code in rs.cards) {
    for (const s of UI.cardSections(rs, code)) for (const i of s.items) check(`${rs.id} ${code} card`, `${s.head} ${s.sub} ${i.name} ${i.text}`);
    check(`${rs.id} ${code} type`, UI.cardTypeLine(rs.cards[code])); check(`${rs.id} ${code} lineup`, UI.lineupStats(rs.cards[code]));
  }
  // The screen files: every line with the word must be marked as code (identifiers, data field names, comments).
  for (const f of ["app.js", "ui.js", "index.html"]) {
    const lines = fs.readFileSync(path.join(__dirname, "..", f), "utf8").split("\n");
    lines.forEach((ln, i) => {
      if (!UI.BANNED.test(ln) || /being-ok/.test(ln)) return;
      const stripped = ln.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "").replace(/^\s*\*.*$/, "").replace(/^\s*\/\*\*.*$/, "")
        .replace(/\b(beingsOf|beingsLost)\b/g, "").replace(/\.beings\b/g, "").replace(/\["beings"/g, "");
      if (UI.BANNED.test(stripped)) bad.push(`${f}:${i + 1}: ${ln.trim()}`);
    });
  }
  ok(!bad.length, `no player-visible text says the old word (${bad.length} found):\n  ${bad.slice(0, 10).join("\n  ")}`);
}

// ---- Specials (Brief 011): card text from the rule set, the preview's one exact number, extra-target rows ----
{
  const V37 = PRESETS.find((p) => p.id === "v3.7"), bad = [];
  const check = (where, text) => { if (UI.BANNED.test(UI.say(text))) bad.push(`${where}: ${text}`); };
  const want = {
    HM: ["Arc Hit", "A normal hit on every enemy in a 3-hex arc around its target."],
    LM: ["Pick Off", "Twice a normal hit, 25% less for each friend next to the target (never below a normal hit)."],
    HR: ["Bullseye", "1.5 times a normal shot, ignoring Armor."],
    LR: ["Arrow Storm", "Twice a normal shot. Dodge doesn't count."],
    HA: ["Skewer", "A full hit on the enemy next to it and on the enemy behind that one."],
    LA: ["Javelin", "Strikes 2 or 3 hexes away in a straight line, twice a normal hit. Over friends, never over enemies."]
  };
  for (const code in want) {
    const sec = UI.cardSections(V37, code).find((x) => x.head === "Special");
    ok(sec && sec.sub === "Once a match" && sec.items[0].name === want[code][0] && sec.items[0].text === want[code][1], `${code} card: SPECIAL · Once a match · ${want[code][0]}: the brief's text`);
    ok(sec && sec.note === "Warm up one turn (1 Stamina, no attack or brace), fire the next. No dice.", `${code} card: the warm-up line under the list`);
  }
  ok(!UI.cardSections(PRESETS.find((p) => p.id === "v3.6"), "HM").some((x) => x.head === "Special"), "v3.6 cards have no Special section");
  // Arc Hit into two enemies: one exact number, the key's special row first, one extra-target row
  const st = setup(V37, [["HM", "HM"]], [["HA", "HA"], ["LM", "LM"]], { "N-HM": "E9", "S-HA": "E10", "S-LM": "D9" });
  E.act(st, { type: "warmup", uid: "N-HM" }); E.act(st, { type: "end" }); E.act(st, { type: "end" });
  const p = E.options(st, "N-HM").special.targets.find((x) => x.target === "S-HA"), pv = UI.specialPreview(st, U(st, "N-HM"), U(st, "S-HA"), p);
  ok(pv.segments.length === 1 && pv.segments[0].p === 1 && pv.segments[0].dmg === p.hits[0].dmg, "the outcome bar is one segment, 100%, the exact damage");
  ok(pv.rows[0].special && pv.rows[0].name === "Arc Hit ×1" && /2 enemies in the arc/.test(pv.rows[0].why), `the key's first row: ${pv.rows[0].name} — ${pv.rows[0].why}`);
  ok(pv.special.extra.length === 1 && pv.special.extra[0].uid === "S-LM" && pv.special.extra[0].dmg === p.hits[1].dmg, "one extra-target row, with its exact damage");
  ok(pv.special.arc && pv.special.arc.length === 3, "the arc to outline on the field");
  for (const r of pv.rows) check("special key", `${r.name} ${r.means} ${r.why}`);
  // Arrow Storm on a Light unit: Dodge leaves the face-off and the key; the special row says why
  const s2 = setup(V37, [["LR", "LR"]], [["LM", "LM"]], { "N-LR": "E8", "S-LM": "E11" });
  E.act(s2, { type: "warmup", uid: "N-LR" }); E.act(s2, { type: "end" }); E.act(s2, { type: "end" });
  const p2 = E.options(s2, "N-LR").special.targets[0], pv2 = UI.specialPreview(s2, U(s2, "N-LR"), U(s2, "S-LM"), p2);
  ok(!pv2.target.stats.some((x) => x.key === "dodge") && !pv2.rows.some((r) => r.icon === "dodge") && /Dodge \d+% doesn't count/.test(pv2.rows[0].why), `Arrow Storm: no Dodge stat or row; "${pv2.rows[0].why}"`);
  ok(pv2.rows[0].name === "Arrow Storm ×2", "the multiplier used here: Arrow Storm ×2");
  ok(!bad.length, `no player-visible special text says the old word (${bad.length})`);
}

console.log(`${n - fails}/${n} UI checks passed`);
if (fails) process.exit(1);
