# UI mockup generators (UI chat, 19 Nov 2026)

Scripts that drew the UI Brainstorm's Move and range preview and Enemy preview pages, and Approved UI v3. Not part of the game; nothing here is loaded by the board.

- `lib.js`: builds engine states from a spec, routes (Game Laws 2.11), range discs, spokes, Evade hexes. Uses `../board/engine.js` and `../board/data.js`.
- `draw.js`: the field (hexes, zones, pitch lines, marks, badges, rings, tokens).
- `gen.js`: page shell, top bar, unit panel, buttons, attack drawer, route row.
- `scen*.js` → `scen*.json`, `la11.js`, `sp12.js`: scenario data. `build15.js`: last move-preview round. `buildE4.js`: enemy preview Round 4 and the two redrawn v3 frames.
- Run: `node buildE4.js` (writes `.dc.html` artboards to the `OUT` folder set at the top; change it first).
