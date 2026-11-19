/* Flagfall Arena — skin.
   Everything about the look lives here: colours, fonts and board sizes.
   Change this file (or swap in another skin) and the rules never notice. */
(function (root) {
  root.GGSkin = {
    name: "Paper board",
    fontsUrl: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
    fonts: {
      display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
      body: "'IBM Plex Sans', system-ui, sans-serif",
      mono: "'IBM Plex Mono', ui-monospace, monospace"
    },
    colors: {
      paper: "#e9ece6",       // page background
      card: "#f8f9f5",        // panels
      ink: "#1f2421",         // main text
      muted: "#5f6762",       // secondary text
      line: "#b8beb6",        // hex edges and rules
      hex: "#fbfcf8",         // empty field hex
      north: "#2f6b55", northDark: "#143a2c", northArc: "#d3e3da", northGoal: "#a9cbbb",
      south: "#a8452f", southDark: "#5c2014", southArc: "#efd8cf", southGoal: "#dfb3a3",
      flag: "#b07a33",
      keeper: "#e2b53c",      // Flagkeeper ring
      brace: "#1f4fd8",       // braced ring and B badge
      move: "#3f7fd6",        // reachable hexes
      attack: "#c62828",      // attack targets
      select: "#f2c94c"       // selected unit
    },
    // How each unit-type symbol is drawn on a token: shape + filled (Heavy) or hollow (Light).
    // Drawn as shapes, not text characters, so they look the same on every phone.
    icons: {
      heavyMelee:   { shape: "square",   filled: true },
      lightMelee:   { shape: "square",   filled: false },
      heavyRanged:  { shape: "triangle", filled: true },
      lightRanged:  { shape: "triangle", filled: false },
      heavyCav:     { shape: "circle",   filled: true },
      lightCav:     { shape: "circle",   filled: false, dot: true },
      heavyAntiCav: { shape: "diamond",  filled: true },
      lightAntiCav: { shape: "diamond",  filled: false }
    },
    board: { hexRadius: 30, pad: 8, tokenScale: 0.6, showHexNames: true }
  };
})(this);
