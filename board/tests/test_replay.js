// @test job=rules quick=yes release=yes night=no args=../data/match3_log.txt
// Replays the match 3 log through the engine with the recorded dice and checks every result.
const fs = require("fs");
const E = require("../engine.js");
const { DEFAULT_RULESET } = require("../data.js");

const lines = fs.readFileSync(process.argv[2], "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
const deploy = {
  N: { "N-HM": "E5", "N-HA": "D4", "N-LR": "F4", "N-LM": "D5", "N-FK": "E4" },
  S: { "S-HM": "E14", "S-LR": "D14", "S-HA": "E15", "S-LM": "F14", "S-FK": "E16" },
};
const st = E.newMatch(DEFAULT_RULESET, { first: "N" });
let r = E.act(st, { type: "deploy", team: "N", placements: deploy.N }); if (!r.ok) throw r.error;
r = E.act(st, { type: "deploy", team: "S", placements: deploy.S }); if (!r.ok) throw r.error;

let fails = 0, checks = 0;
const check = (cond, msg) => { checks++; if (!cond) { fails++; console.log("MISMATCH:", msg); } };
const lastLog = () => st.log.filter((l) => l.kind !== "turn").slice(-1)[0].text;

for (const line of lines) {
  if (line.startsWith("RULING")) continue;
  const team = line[0];
  if (team !== st.toMove) { const e = E.act(st, { type: "end" }); check(e.ok, "end turn " + e.error); }
  let m;
  if ((m = line.match(/^(\w) (\w+) (\w+) -> (\w+) \((\d+) hexes, cost ([\d.]+)/))) {
    const res = E.act(st, { type: "move", uid: `${team}-${m[2]}`, to: m[4] });
    check(res.ok, `${line} :: ${res.error}`);
    if (res.ok) check(lastLog().includes(`cost ${m[6]}`), `${line} :: engine says ${lastLog()}`);
    if (res.ok) check(lastLog().includes("Zone of Control") === line.includes("Zone of Control"), `ZoC stop differs: ${line} :: ${lastLog()}`);
  } else if ((m = line.match(/^(\w) (\w+) \((\w+)\) attacks (\w) (\w+) \((\w+)\): (.*) = (\d+); die (\d) -> (\d+) damage; \w+ HP (\d+)/))) {
    const die = +m[9];
    const res = E.act(st, { type: "attack", uid: `${team}-${m[2]}`, target: `${m[4]}-${m[5]}` }, () => die);
    check(res.ok, `${line} :: ${res.error}`);
    if (res.ok) {
      check(res.dmg === +m[10], `${line} :: engine dmg ${res.dmg} (${lastLog()})`);
      const t = E.unitByUid(st, `${m[4]}-${m[5]}`);
      check(Math.max(t.hp, 0) === +m[11], `${line} :: engine HP ${t.hp}`);
      check(lastLog().includes(`= ${m[8]};`), `${line} :: value differs: ${lastLog()}`);
    }
  } else if ((m = line.match(/^(\w) (\w+) pulls at (\w+).*die (\d) -> (\d+); \w flag HP (\d+)/))) {
    const die = +m[4];
    const res = E.act(st, { type: "pull", uid: `${team}-${m[2]}` }, () => die);
    check(res.ok, `${line} :: ${res.error}`);
    if (res.ok) {
      check(res.dmg === +m[5], `${line} :: engine pull ${res.dmg}`);
      const foe = team === "N" ? "S" : "N";
      check(15 - st.pole[foe] === +m[6], `${line} :: flag HP ${15 - st.pole[foe]}`);
    }
  } else if ((m = line.match(/^(\w) (\w+) braces at (\w+)/))) {
    const res = E.act(st, { type: "brace", uid: `${team}-${m[2]}` });
    check(res.ok, `${line} :: ${res.error}`);
  } else {
    console.log("UNPARSED:", line);
  }
}
check(st.result && st.result.winner === "S" && st.result.how === "KO", "result " + JSON.stringify(st.result));
console.log(`turn ${st.turn}, result ${JSON.stringify(st.result)}, ${checks} checks, ${fails} mismatches`);
process.exit(fails ? 1 : 0);
