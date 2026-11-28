/* Flagfall Arena — version numbers (Brief 003, Brief 007, Brief 031).
   STAMPED WHEN PUBLISHED; NEVER EDIT BY HAND. The repository keeps `game`, `build` and `date` at null: no pull request
   carries a number. tools/stamp-version.js counts the number from the order builds merged into main and writes it into
   the published copy (main: "v3.20.01", Build 26; a pull request's preview: the label "v3.20.01+031", build null).
   An unstamped board shows "dev" where the version goes, so a missed stamp is visible rather than wrong.
   `preview` also stays null here; the play-link workflow sets it (for example "PR #6") on preview copies only. */
(function (root) {
  const VERSION = { game: "v3.20.01+030", build: null, date: "2026-11-28", preview: "PR #76" };
  /** "Playtest board · v3.09.01 · Build 13 · Rules v3.6" (CLAUDE.md: the version, with the build in small type); a
      preview copy also says which pull request it is; an unstamped board says "dev". */
  VERSION.line = function (newestRules, V) {
    V = V || VERSION;
    return ["Playtest board", V.game || "dev", V.build ? `Build ${V.build}` : null, V.preview ? `Preview of ${V.preview}` : null, newestRules ? `Rules ${newestRules}` : null].filter(Boolean).join(" · ");
  };
  /** What a saved match was started on: its game version, or its build number for matches saved before Build 7
      (never a guessed version). Null when it recorded neither. */
  VERSION.startedOn = function (m) {
    if (!m) return null;
    if (m.game) return m.game;
    return m.build ? `Build ${m.build}` : null;
  };
  /** " · v3.09.01 · Build 13", plus what a match was started on when that differs ("started on Build 6"). */
  VERSION.note = function (m, V) {
    V = V || VERSION;
    const now = [V.game || "dev", V.build ? `Build ${V.build}` : null].filter(Boolean).join(" · ");
    const was = VERSION.startedOn(m);
    return ` · ${now}` + (was && was !== (V.game || `Build ${V.build}`) ? ` (started on ${was})` : "");
  };
  if (typeof module !== "undefined") module.exports = VERSION; else root.GGVersion = VERSION;
})(this);
