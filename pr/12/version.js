/* Flagfall Arena — game version and build number. The only place they are kept (Brief 003).
   `game` is the global version (vX.YY.ZZ) the brief states; `build` goes up by one in every build that changes board/,
   and the checks workflow fails a pull request that doesn't raise it.
   `preview` stays null here; the play-link workflow sets it (for example "PR #6") on preview copies only. */
(function (root) {
  const VERSION = { game: "v3.05.01", build: 7, date: "2026-11-18", preview: "PR #12" };
  if (typeof module !== "undefined") module.exports = VERSION; else root.GGVersion = VERSION;
})(this);
