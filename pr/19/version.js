/* Flagfall Arena — build number. The only place it is kept (Brief 003).
   Every build that changes board/ raises `build` by one; the checks workflow fails a pull request that doesn't.
   `game` is the game version (vX.YY.ZZ), the one reference for rules, brains, UI and board; the board shows it on Home.
   `preview` stays null here; the play-link workflow sets it (for example "PR #6") on preview copies only. */
(function (root) {
  const VERSION = { game: "v3.06.00", build: 9, date: "2026-11-19", preview: "PR #19" };   // game version vX.YY.ZZ (CLAUDE.md)
  if (typeof module !== "undefined") module.exports = VERSION; else root.GGVersion = VERSION;
})(this);
