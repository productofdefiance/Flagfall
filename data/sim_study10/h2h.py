import json,sys,glob,collections
t=collections.defaultdict(lambda: collections.Counter())
for f in sys.argv[1:]:
    for l in open(f):
        if l.startswith("{"):
            d=json.loads(l); c=t[d["size"]]
            for k,v in d.items():
                if isinstance(v,(int,float)) and not isinstance(v,bool): c[k]+=v
for sz,c in sorted(t.items()):
    g=c["games"]; dec=c["decisive"]; tl=c["tiebreakWin"]+c["draw"]
    print(f"{sz}v{sz}: {g} games | A wins {c['aWins']} B wins {c['bWins']} (decisive {dec}; A share {100*c['aWins']/max(dec,1):.0f}%) | tiebreak A {c['aTiebreak']} B {c['bTiebreak']} | draws {c['draw']} | A wins incl. tiebreak, of non-draws: {100*(c['aWins']+c['aTiebreak'])/max(g-c['draw'],1):.0f}% | turn limit {100*tl/g:.0f}% | holder KO {c['koHolderKilled']} pulls {c['pulls']} games w/ pull {c['gamesWithPull']} | avg turn {c['turnSum']/max(g-c['stuck'],1):.1f} | first mover {c['firstMoverWins']}/{dec}")
