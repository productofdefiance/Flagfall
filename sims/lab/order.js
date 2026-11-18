// Job orders (Brief 008): read, check and number their games. The format is described in results/README.md.
"use strict";
/** Every game of an order: [{ matchup, index (within the matchup), global (across the order) }]. */
function gamesOf(order) {
  const out = []; let global = 0;
  for (const mu of order.matchups || []) for (let i = 0; i < (mu.games || 0); i++) out.push({ matchup: mu, index: i, global: global++ });
  return out;
}
/** Problems that stop an order from running, in plain words ([] if none). Unknown kinds, measures and fields are
    allowed: they're reported, never refused. */
function check(order, known) {
  const p = [];
  if (!order || typeof order !== "object") return ["The job order is not a JSON object."];
  if (!order.id || !/^[a-z0-9][a-z0-9-]*$/.test(order.id)) p.push("id: lowercase letters, digits and hyphens (it becomes the folder's topic).");
  if (!order.kind || !/^[a-z][a-z0-9-]*$/.test(order.kind)) p.push("kind: a lowercase word (see results/README.md for the list; a new one is allowed).");
  if (!order.question) p.push("question: say what the run should answer.");
  if (!Array.isArray(order.matchups) || !order.matchups.length) p.push("matchups: at least one.");
  const names = new Set();
  for (const [i, mu] of (order.matchups || []).entries()) {
    const at = `matchup ${i + 1}${mu && mu.name ? ` (${mu.name})` : ""}`;
    if (!mu.name || !/^[a-z0-9][a-z0-9-]*$/.test(mu.name)) p.push(`${at}: name, lowercase with hyphens.`);
    else if (names.has(mu.name)) p.push(`${at}: the name is used twice.`); else names.add(mu.name);
    for (const k of ["a", "b", "rules", "format"]) if (!mu[k]) p.push(`${at}: needs "${k}".`);
    if (!(mu.games > 0)) p.push(`${at}: games must be a positive number.`);
    if (known && mu.rules && !known.rules(mu.rules)) p.push(`${at}: rule set ${mu.rules} is not on this board.`);
    if (known) for (const k of ["a", "b"]) if (mu[k] && !known.brain(String(mu[k]).split(":")[0])) p.push(`${at}: brain ${mu[k]} is not on this board.`);
  }
  return p;
}
module.exports = { gamesOf, check };
