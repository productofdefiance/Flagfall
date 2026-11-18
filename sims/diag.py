import json,sys,collections
t=collections.defaultdict(collections.Counter)
for f in sys.argv[1:]:
    for l in open(f):
        if l.startswith("{"):
            d=json.loads(l); key=(d["mode"],d["size"])
            for k,v in d.items():
                if isinstance(v,(int,float)) and not isinstance(v,bool) and k!="size": t[key][k]+=v
            t[key]["botMsMaxMax"]=max(t[key]["botMsMaxMax"],d.get("botMsMax",0))
pct=lambda a,b: f"{100*a/b:.1f}%" if b else "-"
for (m,sz),c in sorted(t.items()):
    g=c["games"]
    print(f"{m} {sz}v{sz} ({g} games): Command on moves by units that didn't attack {pct(c['cmdMovesNoAttack'],c['cmdMoves'])} of move Command ({c['cmdMovesNoAttack']/max(c['contactTurns'],1):.2f} per contact turn) | moved to attack, never attacked, target alive {c['moveToAttackWasted']}/{c['moveToAttack']} = {pct(c['moveToAttackWasted'],c['moveToAttack'])} | attacks per contact turn {c['attacksInContact']/max(c['contactTurns'],1):.2f} | braces with no enemy able to hit {c['bracesNoThreat']}/{c['braces']} = {pct(c['bracesNoThreat'],c['braces'])} | contact turns with no brace {pct(c['contactTurnsNoBrace'],c['contactTurns'])} | avg Dodge on Light when attacked {c['lightDodgeSum']/max(c['lightAttacked'],1):.1f}% | Evade: chances {c['evadeChances']}, taken {c['evadeTaken']} ({pct(c['evadeTaken'],c['evadeChances'])}), safer taken {pct(c['evadeSaferTaken'],c['evadeSaferChances'])}, no legal step {c['evadeNoRoom']} ({pct(c['evadeNoRoom'],c['evadeNoRoom']+c['evadeChances'])}) | Light removed/game {c['lightRemoved']/g:.2f} | turn limit {pct(c['tiebreakWin']+c['draw'],g)} | bot ms/turn avg {c['botMs']/max(c['botTurns'],1):.0f} max {c['botMsMaxMax']}")
