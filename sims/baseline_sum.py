"""Adds baseline.js shards (one JSON line each, any order) and prints one table row per configuration.
python3 sims/baseline_sum.py results/*.jsonl"""
import json, sys
from collections import OrderedDict
groups = OrderedDict()
for path in sys.argv[1:]:
    for line in open(path):
        line = line.strip()
        if not line.startswith("{"):
            continue
        d = json.loads(line)
        key = (d["rs"], d["size"], d["A"], d["B"], d["mode"])
        g = groups.setdefault(key, {})
        for k, v in d.items():
            if isinstance(v, (int, float)) and not isinstance(v, bool) and k != "size":
                g[k] = g.get(k, 0) + v
pct = lambda a, b: f"{100 * a / b:.1f}%" if b else "-"
print("| Rule set | Format | Brains (A v B) | Lineups | Games | KO holder killed | KO pull | TKO | Tiebreak win | Draw | Pulls/game | Games with a pull | Holder dragged off by a kill | Avg turn | Units acting/turn | Command spent/turn | A wins–B wins (decisive) |")
print("|" + "---|" * 17)
for (rs, size, a, b, mode), g in groups.items():
    n = g["games"]
    print(f"| {rs} | {size}v{size} | {a} v {b} | {mode} | {n} | {g['koHolderKilled']} ({pct(g['koHolderKilled'], n)}) | {g['koPull']} ({pct(g['koPull'], n)}) | "
          f"{g['tko']} ({pct(g['tko'], n)}) | {g['tiebreakWin']} ({pct(g['tiebreakWin'], n)}) | {g['draw']} ({pct(g['draw'], n)}) | {g['pulls'] / n:.2f} | "
          f"{pct(g['gamesWithPull'], n)} | {g['holderDraggedOff']} | {g['turnSum'] / max(n - g['stuck'], 1):.1f} | {g['unitsActed'] / max(g['sideTurns'], 1):.2f} | "
          f"{g['cmdSpent'] / max(g['sideTurns'], 1):.1f} | {g['aWins']}–{g['bWins']} |" + (f" stuck {g['stuck']}" if g["stuck"] else ""))
