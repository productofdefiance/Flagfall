/* Flagfall Arena — skin.
   Everything about the look lives here: colours, fonts and board sizes.
   Change this file (or swap in another skin) and the rules never notice. */
(function (root) {
  root.GGSkin = {
    name: "Paper board",
    fontsUrl: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    fonts: {
      display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
      body: "'IBM Plex Sans', system-ui, sans-serif",
      // Numbers (Brief 017): IBM Plex Sans with tabular figures (every digit the same width); no monospaced face.
      num: "'IBM Plex Sans', system-ui, sans-serif"
    },
    colors: {
      paper: "#e9ece6",       // page background
      card: "#f8f9f5",        // panels
      ink: "#1f2421",         // main text
      muted: "#5f6762",       // secondary text
      line: "#b8beb6",        // hex edges and rules
      hex: "#fbfcf8",         // empty field hex
      // Team colours, read by side everywhere (Brief 017 §12: a later jersey choice swaps only these).
      north: "#2f6b55", northDark: "#143a2c", northArc: "#d3e3da", northGoal: "#a9cbbb",
      south: "#a8452f", southDark: "#5c2014", southArc: "#efd8cf", southGoal: "#dfb3a3",
      flag: "#b07a33",
      keeper: "#e2b53c",      // Flagkeeper ring; the warm-up ring and Special buttons (special gold)
      brace: "#2e3338",       // braced ring, Brace button dot and border (Brief 017: charcoal)
      move: "#3f7fd6",        // your move hexes, route and range lines
      specialRange: "#d9a514",// your special's range (double line)
      threat: "#c75400",      // the other side's moves, range and sight marks (Brief 017 §9)
      plum: "#6a3d8f",        // the other side's special range and warm-up ring
      attack: "#c62828",      // attack targets, set spear
      select: "#f2c94c",      // selected unit
      zoneArc: "#eceee8",     // deployment arc hexes, both sides (no team colour)
      zoneGoal: "#d9ddd4",    // goal-zone hexes, both sides
      pitchLine: "#9ea693"    // pitch lines (a picture only)
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
  // Brief 018 §2: the turn cue's colours. The tag is the side's light colour; its text is ink unless white reads better,
  // picked by contrast so a later jersey colour still reads (4.5:1 needed).
  const S = root.GGSkin;
  S.colors.northLight = "#8fd0b4"; S.colors.southLight = "#f0a48f";
  S.tagColor = (t) => (t === "N" ? S.colors.northLight : S.colors.southLight);
  const lum = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  S.contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  S.tagInk = (bg) => (S.contrast("#ffffff", bg) > S.contrast(S.colors.ink, bg) ? "#ffffff" : S.colors.ink);
})(this);
