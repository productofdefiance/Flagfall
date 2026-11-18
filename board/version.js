/* Flagfall Arena — build number. The only place it is kept (Brief 003).
   Every build that changes board/ raises `build` by one; the checks workflow fails a pull request that doesn't.
   `preview` stays null here; the play-link workflow sets it (for example "PR #6") on preview copies only. */
(function (root) {
  const VERSION = { build: 5, date: "2026-11-18", preview: null };
  if (typeof module !== "undefined") module.exports = VERSION; else root.GGVersion = VERSION;
})(this);
