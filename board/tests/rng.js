// Shared random stream for simulators: the engine's own seeded generator (the same one the board uses).
// Replaces the home-made "seed * 1103515245 + 12345" formula, which overflowed JavaScript numbers and looped every
// 10,466 draws (about every 26 games at 7v7; red team report, 16 Nov 2026).
// const rng = require("./rng.js"); const rnd = rng("h2h", seedOffset);
const E = require("../engine.js");
module.exports = (name, offset) => E.seededRandom(`sim:${name}:${offset || 0}`);
