/* Flagfall Arena — version numbers. The only place they are kept (Brief 003, Brief 007).
   `game` is the one global version (vX.YY.ZZ) for rules, brains, screens and board. The design chat picks it and
   states it in each brief; Code doesn't choose it. `build` is the internal counter the checks workflow uses.
   Every build that changes board/ raises `build` by one and changes `game`; the checks workflow fails a pull request
   that doesn't. `preview` stays null here; the play-link workflow sets it (for example "PR #6") on preview copies only. */
(function (root) {
  const VERSION = { game: "v3.06.00", build: 9, date: "2026-11-18", preview: null };
  /** "Playtest board · v3.06.00 · Build 9 · Rules v3.4" (CLAUDE.md: the version, with the build in small type); a
      preview copy also says which pull request it is. */
  VERSION.line = function (newestRules, V) {
    V = V || VERSION;
    return ["Playtest board", V.game || null, V.build ? `Build ${V.build}` : null, V.preview ? `Preview of ${V.preview}` : null, newestRules ? `Rules ${newestRules}` : null].filter(Boolean).join(" · ");
  };
  /** What a saved match was started on: its game version, or its build number for matches saved before Build 7
      (never a guessed version). Null when it recorded neither. */
  VERSION.startedOn = function (m) {
    if (!m) return null;
    if (m.game) return m.game;
    return m.build ? `Build ${m.build}` : null;
  };
  /** " · v3.06.00 · Build 9", plus what a match was started on when that differs ("started on Build 6"). */
  VERSION.note = function (m, V) {
    V = V || VERSION;
    const now = [V.game, V.build ? `Build ${V.build}` : null].filter(Boolean).join(" · ");
    if (!now) return "";
    const was = VERSION.startedOn(m);
    return ` · ${now}` + (was && was !== (V.game || `Build ${V.build}`) ? ` (started on ${was})` : "");
  };
  if (typeof module !== "undefined") module.exports = VERSION; else root.GGVersion = VERSION;
})(this);
