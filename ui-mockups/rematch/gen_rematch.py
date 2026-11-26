"""Rematch page, Round 1: end-of-match sheet (2 options), the rematch sheet (3 states), the Lineup footer.
Static mockups in the board's own colours and type (board/index.html). 393 x 665 = the Editor's phone inside the browser."""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(ROOT, "project")
W, H = 393, 665

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0}}
a{{color:#5f6762}}a:hover{{color:#1f2421}}
</style>
</helmet>
"""
TAIL = """
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""

INK, CARD, PAPER, MUTED, LINE = "#1f2421", "#f8f9f5", "#e9ece6", "#5f6762", "#b8beb6"
NORTH, SOUTH = "#2f6b55", "#a8452f"
BODY = "'IBM Plex Sans', system-ui, sans-serif"
DISP = "'Barlow Condensed', 'Arial Narrow', sans-serif"

COPY_ICON = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect>'
             '<path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>')


def btn(label, kind="", flex=1, h=44):
    bg, fg, bd = CARD, INK, INK
    if kind == "primary": bg, fg = INK, CARD
    return (f'<button type="button" style="flex: {flex} 1 0; min-width: 0; height: {h}px; border: 1px solid {bd}; border-radius: 10px; '
            f'background: {bg}; color: {fg}; font: 600 15px/1.1 {BODY}; padding: 0 10px; white-space: nowrap">{label}</button>')


def seg(yes):
    def b(lbl, on):
        st = f"background: {INK}; color: {CARD}" if on else f"background: transparent; color: {INK}"
        return (f'<button type="button" aria-pressed="{"true" if on else "false"}" style="flex: 1 1 0; height: 40px; border: 0; border-radius: 8px; '
                f'{st}; font: 600 13px/1 {BODY}">{lbl}</button>')
    return (f'<div style="display: flex; gap: 4px; padding: 4px; background: #dfe3dc; border-radius: 11px; width: 132px; flex: 0 0 auto">'
            f'{b("Yes", yes)}{b("No", not yes)}</div>')


def match_bg():
    """Scoreboard (84 px, dark) and the field behind the sheet, dimmed. Schematic: the field is not the point here."""
    hexes = []
    import math
    r = 20; hh = math.sqrt(3) * r
    for col in range(-1, 12):
        for row in range(-1, 16):
            x = col * 1.5 * r + 8; y = 84 + row * hh + (hh / 2 if col % 2 else 0)
            pts = " ".join(f"{x + r * math.cos(math.radians(a)):.1f},{y + r * math.sin(math.radians(a)):.1f}" for a in range(0, 360, 60))
            hexes.append(f'<polygon points="{pts}" fill="#fbfcf8" stroke="#b8beb6" stroke-width="1"></polygon>')
    return (f'<div style="position: absolute; left: 0; top: 0; width: {W}px; height: 84px; background: {INK}; color: {CARD}; '
            f'display: flex; align-items: center; justify-content: space-between; padding: 0 16px; box-sizing: border-box">'
            f'<span style="font: 700 13px/1 {DISP}; letter-spacing: .12em; color: #8fd0b4">NORTH</span>'
            f'<span style="font: 700 28px/1 {DISP}">25 · 0</span>'
            f'<span style="font: 700 13px/1 {DISP}; letter-spacing: .12em; color: #f0a48f">SOUTH</span></div>'
            f'<svg aria-hidden="true" style="position: absolute; left: 0; top: 84px" width="{W}" height="{H - 84}" viewBox="0 84 {W} {H - 84}">'
            f'<rect x="0" y="84" width="{W}" height="{H}" fill="#eceee8"></rect>{"".join(hexes)}</svg>'
            f'<div style="position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; background: rgba(31,36,33,.28)"></div>')


def sheet(inner):
    return (f'<div style="position: absolute; left: 0; right: 0; bottom: 0; background: #fff; border-radius: 16px 16px 0 0; '
            f'box-shadow: 0 -8px 24px rgba(0,0,0,.18); padding: 10px 16px 18px; display: flex; flex-direction: column; gap: 12px">'
            f'<div style="align-self: center; width: 36px; height: 4px; border-radius: 2px; background: #c9cec6"></div>{inner}</div>')


def frame(inner, w=W, h=H, fold=None):
    f = ""
    if fold:
        f = (f'<div style="position: absolute; left: 0; top: {fold}px; width: {w}px; border-top: 1.5px dashed {SOUTH}"></div>'
             f'<span style="position: absolute; right: 6px; top: {fold + 3}px; font: 600 10px/1 {BODY}; color: {SOUTH}">Fold</span>')
    return (f'<div style="position: relative; width: {w}px; height: {h}px; overflow: hidden; background: {PAPER}; '
            f'font-family: {BODY}; color: {INK}">{inner}{f}</div>')


def over_title():
    return (f'<h2 style="margin: 0; font: 700 24px/1.05 {DISP}; text-transform: uppercase; letter-spacing: .03em">South wins</h2>'
            f'<p style="margin: 0; color: {MUTED}; font-size: 13px">Flag pulled down on turn 18. Saved under Matches.</p>')


def end_a():
    rows = (f'<div style="display: flex">{btn("Rematch", "primary", h=48)}</div>'
            f'<div style="display: flex; gap: 8px">{btn("See field")}{btn("Copy record")}{btn("New game")}</div>')
    return frame(match_bg() + sheet(over_title() + rows))


def end_b():
    rows = (f'<div style="display: flex; gap: 8px">{btn("Rematch", "primary")}{btn("New game")}</div>'
            f'<div style="display: flex; gap: 8px">{btn("See field")}{btn("Copy record")}</div>')
    return frame(match_bg() + sheet(over_title() + rows))


def option(label, yes, hint, extra=""):
    return (f'<div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-top: 1px solid #e3e6e0">'
            f'<div style="display: flex; align-items: center; gap: 12px"><span style="flex: 1; font: 600 15px/1.2 {BODY}">{label}</span>{seg(yes)}</div>'
            f'<span style="font: 400 12.5px/1.35 {BODY}; color: {MUTED}">{hint}</span>{extra}</div>')


def code_box(code, new=False):
    tag = (f'<span style="font: 600 11px/1 {BODY}; color: {MUTED}">New</span>' if new else "")
    return (f'<div style="display: flex; align-items: center; gap: 8px">'
            f'<div style="flex: 1; height: 40px; border: 1px solid {LINE}; border-radius: 10px; background: #fff; display: flex; align-items: center; '
            f'gap: 8px; padding: 0 12px; font: 600 15px/1 {BODY}; letter-spacing: .04em">{code}{tag}</div>'
            f'<button type="button" aria-label="Copy dice code" style="width: 44px; height: 40px; border: 1px solid {INK}; border-radius: 10px; '
            f'background: {CARD}; color: {INK}; display: inline-flex; align-items: center; justify-content: center; padding: 0">{COPY_ICON}</button></div>')


def rematch(lineups=True, sides=True, dice=True, coin=False):
    h_l = ("Both sides keep their units." if lineups else
           "Pick again on the Lineup screen. The bot draws from its Mix.")
    if coin:
        h_s = "Coin toss again for who moves first."
        h_s = ("Each side stays where it was. " if sides else "North and South swap: each player takes the other end with its own lineup. ") + h_s
    else:
        h_s = ("Each side stays where it was. South moves first again." if sides else
               "North and South swap: each player takes the other end with its own lineup. South still moves first.")
    h_d = "Same code, so the same rolls." if dice else "A new code, so new rolls."
    code = "R28X-AJDH-DUP5" if dice else "K7QM-2WTB-HF9C"
    body = (f'<h2 style="margin: 0; font: 700 24px/1.05 {DISP}; text-transform: uppercase; letter-spacing: .03em">Rematch</h2>'
            f'<p style="margin: 0; color: {MUTED}; font-size: 13px">7v7 · Rules v3.9 · You vs Bot (Brain 8). Format and settings stay.</p>'
            f'<div style="display: flex; flex-direction: column">'
            + option("Same lineups", lineups, h_l)
            + option("Same sides", sides, h_s)
            + option("Same dice", dice, h_d, code_box(code, new=not dice))
            + '</div>'
            f'<div style="display: flex; gap: 10px">{btn("Cancel", flex=1, h=52)}{btn("Start rematch" if lineups else "Next: Lineup", "primary", flex=2, h=52)}</div>')
    return frame(match_bg() + sheet(body))


def lineup():
    units = [("Heavy Melee", "HP 20 · Str 10 · Range 1 · Move 3", 2), ("Light Melee", "HP 16 · Str 9 · Range 1 · Move 4", 1),
             ("Heavy Ranged", "HP 14 · Str 9 · Range 4 · Move 3", 1), ("Light Ranged", "HP 12 · Str 7 · Range 3 · Move 4", 1),
             ("Heavy Anti-Cavalry", "HP 18 · Str 8 · Reach 2 · Move 3", 1), ("Light Anti-Cavalry", "HP 15 · Str 8 · Reach 2 · Move 4", 0)]
    used = 1 + sum(n for *_, n in units)
    rows = ""
    for nm, st, n in units:
        on = f"border-color: {SOUTH}" if n else ""
        rows += (f'<div style="display: flex; align-items: center; gap: 10px; border: 1.5px solid {LINE}; {on}; border-radius: 12px; background: #fff; padding: 8px 10px">'
                 f'<span style="width: 30px; height: 30px; border-radius: 15px; background: {SOUTH}; flex: 0 0 auto"></span>'
                 f'<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span style="font: 600 14px/1.2 {BODY}">{nm}</span>'
                 f'<span style="font: 400 11.5px/1.3 {BODY}; color: {MUTED}">{st}</span></span>'
                 f'<button type="button" aria-label="One fewer" style="width: 40px; height: 40px; border-radius: 20px; border: 1px solid {INK}; background: #fff; font: 600 20px/1 {BODY}">−</button>'
                 f'<span style="width: 18px; text-align: center; font: 600 15px/1 {BODY}">{n}</span>'
                 f'<button type="button" aria-label="One more" style="width: 40px; height: 40px; border-radius: 20px; border: 1px solid {INK}; background: #fff; font: 600 20px/1 {BODY}">+</button></div>')
    pips = "".join(f'<span style="flex: 1; height: 8px; border-radius: 3px; background: {SOUTH if i < used else "#d6dbd3"}"></span>' for i in range(7))
    steps = "".join(
        f'<span style="display: inline-flex; align-items: center; gap: 6px; font: 600 12px/1 {BODY}; color: {INK if i == 2 else MUTED}">'
        f'<i style="width: 22px; height: 22px; border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 11px; '
        f'background: {INK if i == 2 else NORTH}; color: #fff">{i + 1}</i>{x}</span>' for i, x in enumerate(["Settings", "Teams", "Lineup"]))
    content_h = 1010
    body = (f'<div style="padding: 18px 20px 28px; display: flex; flex-direction: column; gap: 16px">'
            f'<div style="display: flex; align-items: center; gap: 10px"><button type="button" aria-label="Back to Teams" style="width: 40px; height: 40px; border: 1px solid {INK}; border-radius: 10px; background: {CARD}; font: 600 18px/1 {BODY}">←</button>'
            f'<h2 style="margin: 0; font: 700 24px/1.05 {DISP}; text-transform: uppercase; letter-spacing: .03em">South lineup</h2></div>'
            f'<div style="display: flex; gap: 16px">{steps}</div>'
            f'<div style="display: flex; flex-direction: column; gap: 6px"><div style="display: flex; justify-content: space-between"><span style="font: 600 13px/1 {BODY}">Unit cap (UC)</span><span style="font: 600 15px/1 {BODY}">{used}/7</span></div><div style="display: flex; gap: 3px">{pips}</div></div>'
            f'<div style="display: flex; flex-direction: column; gap: 7px"><label style="font: 600 13px/1 {BODY}">Flagkeeper</label>'
            f'<div style="height: 40px; border: 1px solid {LINE}; border-radius: 10px; background: #fff; display: flex; align-items: center; padding: 0 12px; font: 600 14px/1 {BODY}">Heavy Melee</div></div>'
            f'<div style="display: flex; flex-direction: column; gap: 7px"><span style="font: 600 13px/1 {BODY}">Units</span>'
            f'<span style="font: 400 12px/1.35 {BODY}; color: {MUTED}">Pick 6 more. Repeats are allowed.</span>'
            f'<div style="display: flex; flex-direction: column; gap: 8px">{rows}</div></div></div>')
    footer = (f'<div style="position: absolute; left: 0; right: 0; top: {665 - 83}px; background: {PAPER}; border-top: 1px solid {LINE}; padding: 12px 20px 18px; display: flex; gap: 10px">'
              f'{btn("Reset", flex=1, h=52)}{btn("Start match", "primary", flex=2, h=52)}</div>')
    note = (f'<div style="position: absolute; left: 0; right: 0; top: 700px; padding: 0 20px; font: 400 12px/1.4 {BODY}; color: {MUTED}">'
            f'Below the fold: the rest of the list as it scrolls. The footer stays pinned to the screen bottom.</div>')
    return frame(body + footer, h=content_h, fold=665)


def end_a2():
    rows = (f'<div style="display: flex">{btn("New game", "primary", h=48)}</div>'
            f'<div style="display: flex; gap: 8px">{btn("See field")}{btn("Copy record")}{btn("Rematch")}</div>')
    return frame(match_bg() + sheet(over_title() + rows))


def option2(label, yes, hint, extra=""):
    return (f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-top: 1px solid #e3e6e0">'
            f'<div style="display: flex; align-items: center; gap: 12px">'
            f'<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px">'
            f'<span style="font: 600 15px/1.2 {BODY}">{label}</span>'
            f'<span style="font: 400 12px/1.3 {BODY}; color: {MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{hint}</span></div>'
            f'{seg(yes)}</div>{extra}</div>')


def rematch2(lineups=True, sides=True, dice=True, coin=False):
    h_l = "Both sides keep their units." if lineups else "Pick again on the Lineup screen."
    h_s = ("Same ends. " if sides else "Ends swap. ") + ("New coin toss." if coin else ("South moves first." if sides else "South still moves first."))
    h_d = "Same code, same rolls." if dice else "New code, new rolls."
    code = "R28X-AJDH-DUP5" if dice else "K7QM-2WTB-HF9C"
    body = (f'<h2 style="margin: 0; font: 700 24px/1.05 {DISP}; text-transform: uppercase; letter-spacing: .03em">Rematch</h2>'
            f'<p style="margin: 0; color: {MUTED}; font-size: 13px">7v7 · Rules v3.9 · You vs Bot (Brain 8). Format and settings stay.</p>'
            f'<div style="display: flex; flex-direction: column">'
            + option2("Same lineups", lineups, h_l)
            + option2("Same sides", sides, h_s)
            + option2("Same dice", dice, h_d, code_box(code, new=not dice))
            + '</div>'
            f'<div style="display: flex; gap: 10px">{btn("Cancel", flex=1, h=52)}{btn("Start rematch" if lineups else "Next: Lineup", "primary", flex=2, h=52)}</div>')
    return frame(match_bg() + sheet(body))


R2 = [
    ("rm-r2-a2-end-newgame-top", end_a2(), H, "Round 2 · A2 · End of match: New game full width, Rematch in the row below"),
    ("rm-r2-c1-sheet-default", rematch2(), H, "Round 2 · C1 · Rematch sheet: each line of help under its option, switches in one column"),
    ("rm-r2-c2-sheet-swap-newdice", rematch2(sides=False, dice=False), H, "Round 2 · C2 · Sides swap, new dice"),
    ("rm-r2-c3-sheet-repick-coin", rematch2(lineups=False, coin=True), H, "Round 2 · C3 · Re-pick lineups, coin-toss match"),
]

FRAMES = [
    ("rm-r1-a-end-rematch-top", end_a(), H, "Round 1 · A · End of match: Rematch full width above the other three"),
    ("rm-r1-b-end-grid", end_b(), H, "Round 1 · B · End of match: Rematch and New game on top, See field and Copy record below"),
    ("rm-r1-c1-sheet-default", rematch(), H, "Round 1 · C1 · Rematch sheet: everything the same (one tap to start)"),
    ("rm-r1-c2-sheet-swap-newdice", rematch(sides=False, dice=False), H, "Round 1 · C2 · Sides swap, new dice: a new code, South still moves first"),
    ("rm-r1-c3-sheet-repick-coin", rematch(lineups=False, coin=True), H, "Round 1 · C3 · Re-pick lineups, coin-toss match: button becomes Next: Lineup"),
    ("rm-r1-l1-lineup-reset", lineup(), 1010, "Round 1 · L1 · Lineup: the bottom Back becomes Reset (clears every unit; the top arrow stays Back)"),
]

if __name__ == "__main__":
    import sys
    c = json.load(open(os.path.join(P, "canvas.json")))
    rnd = sys.argv[1] if len(sys.argv) > 1 else "1"
    sets = {"1": (FRAMES, 300, "rematch-r1", "Round 1 · Rematch, end of match and Lineup Reset"),
            "2": (R2, 1700, "rematch-r2", "Round 2 · New game on top; help text under each option")}
    frames, y, nid, ntext = sets[rnd]
    if not any(p["id"] == "rematch" for p in c["pages"]):
        c["pages"].append({"id": "rematch", "name": "Rematch"})
    x = 0
    for stem, html, h, title in frames:
        path = stem + ".dc.html"
        open(os.path.join(P, path), "w").write(HEAD.format(title=title) + html + TAIL.format(w=W, h=h))
        c["boards"][path] = {"x": x, "y": y, "w": W, "h": h, "title": title, "page": "rematch"}
        if path not in c["order"]: c["order"].append(path)
        x += W + 80
    c["notes"][nid] = {"x": 0, "y": y - 300, "text": ntext, "kind": "title1", "maxW": x - 80, "page": "rematch"}
    if "noteOrder" in c and nid not in c["noteOrder"]: c["noteOrder"].append(nid)
    json.dump(c, open(os.path.join(P, "canvas.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print("ok", [f[0] for f in frames])
