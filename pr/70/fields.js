/* Flagfall Arena — the fields (Brief 014, Game Laws 2.4 and 2.5). Data only: the engine builds the geometry from it.
   One field per format. Each column is unbroken: `cols` gives each column's first and last row, left to right
   (column letters run from A). The middle column is the full one; a column an odd number of columns away from it sits
   half a hex lower (Game Laws 2.4), so positions and distances are worked out from the middle column, never from the
   column index alone. `rows` is the middle column's row count. The hexes match briefs/014-fields.json exactly
   (tests/test_fields.js checks it).
   Which field a match uses: a rule set with switch `fields` uses the field for the match's format (`size`); every older
   rule set uses `legacy` for every format, forever. 9v9 and 13v13 are data only until brief 012 makes them playable. */
(function (root) {
  const FIELDS = {
    // Today's field until v3.8: the oval of 139 hexes, flags E3 and E17. Every older rule set plays here.
    legacy: { id: "legacy", size: null, rows: 19, flags: { N: "E3", S: "E17" }, deployRadius: 3,
      cols: [[5, 15], [3, 16], [2, 18], [1, 18], [1, 19], [1, 18], [2, 18], [3, 16], [5, 15]] },
    "5v5": { id: "5v5", size: 5, rows: 17, flags: { N: "D3", S: "D15" }, deployRadius: 2,
      cols: [[3, 14], [2, 16], [1, 16], [1, 17], [1, 16], [2, 16], [3, 14]] },
    // The legacy field plus B2, H2, B17, H17, A4, I4, A16 and I16.
    "7v7": { id: "7v7", size: 7, rows: 19, flags: { N: "E3", S: "E17" }, deployRadius: 3,
      cols: [[4, 16], [2, 17], [2, 18], [1, 18], [1, 19], [1, 18], [2, 18], [2, 17], [4, 16]] },
    "9v9": { id: "9v9", size: 9, rows: 23, flags: { N: "F4", S: "F20" }, deployRadius: 3,
      cols: [[7, 16], [4, 20], [2, 21], [2, 22], [1, 22], [1, 23], [1, 22], [2, 22], [2, 21], [4, 20], [7, 16]] },
    "13v13": { id: "13v13", size: 13, rows: 25, flags: { N: "G4", S: "G22" }, deployRadius: 3,
      cols: [[8, 18], [4, 21], [3, 23], [2, 23], [2, 24], [1, 24], [1, 25], [1, 24], [2, 24], [2, 23], [3, 23], [4, 21], [8, 18]] }
  };
  const api = { FIELDS };
  if (typeof module !== "undefined") module.exports = api; else root.GGFields = api;
})(this);
