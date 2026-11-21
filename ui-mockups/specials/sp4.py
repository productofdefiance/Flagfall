"""Specials Round 4 (UI chat, 21 Nov 2026): the Special button's states and the fire / warm-up-again flow (Option B).
Opens the real board (main, v3.14.00, served from board/ on port 8102) at 393 x 665, sets up one 7v7 position through
the ?shots=1 hook, restyles only the Special button, the unit bar's note and the targeting row, and saves static
.dc.html artboards with inlined styles (same serializer as phone-fit/gen.py)."""
import sys, os, re, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'phone-fit'))
from base import *
SER = re.search(r'SER="""(.*?)"""', open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'phone-fit', 'gen.py')).read(), re.S).group(1)
SER = SER.replace("'grid-column-start',", "'grid-column-start','grid-column-end','grid-row-end',")
SER = SER.replace("walk(src,dst);", "walk(src,dst);const fs=document.querySelector('#fieldscroll'),fd=dst.querySelector('#fieldscroll');if(fs&&fd&&fs.scrollTop){const sv=fd.querySelector('svg');sv.setAttribute('style',sv.getAttribute('style')+' margin-top: -'+fs.scrollTop+'px;')}")

SETUP = """()=>{const G=GGShots,st=G.App.st;const u=id=>st.units.find(x=>x.uid===id);
const pos={'N-LR':'E9','N-HA':'C9','N-LM':'D8','N-HM':'F8','N-HM2':'B8','N-HR':'E7','N-LA':'G8',
 'S-HM':'D12','S-HM2':'F12','S-LM':'E12','S-LR':'C12','S-HA':'E13','S-LA':'G11','S-HR':'E14'};
for(const k in pos)u(k).hex=pos[k];G.render();return true}"""

# The restyle. States: unused | warm | ready | notarget | used | blocked.
FX = r"""(o)=>{const G=GGShots,st=G.App.st;
const YG='#ebe8d9', GOLD='#e2b53c', TINT='#f9eeda', INK='#1f2421', MUT='#5f6762';
const sq='<i style="display:inline-block;width:8px;height:8px;border-radius:1.5px;background:'+INK+'"></i>';
const bolt=(n,c)=>'<svg width="'+n+'" height="'+n+'" viewBox="0 0 24 24" fill="none" stroke="'+(c||'currentColor')+'" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>';
const note=(t)=>{const r1=document.querySelector('#unitbar .ub-r1');if(!r1)return;const x=r1.querySelector('.ub-chips,.ub-note');if(x)x.remove();
 r1.insertAdjacentHTML('beforeend','<span class="ub-note">'+t+'</span>');r1.classList.add('wide');const sd=document.querySelector('#unitbar .ub-side');if(sd)sd.remove();
 const n=r1.querySelector('.ub-note');if(n.scrollWidth>n.clientWidth+0.5)n.classList.add('two')};
const spBtn=(state,name)=>{const b=document.querySelector('#actions button[data-act="special"]');if(!b)return 'nobtn';
 const S={unused:{bg:'#f8f9f5',bd:'1px solid '+INK,fg:INK,cost:0},
  warm:{bg:YG,bd:'2px dashed '+GOLD,fg:'#4b514d',cost:0},
  ready:{bg:GOLD,bd:'2px solid '+INK,fg:INK,cost:0},
  notarget:{bg:YG,bd:'2px solid '+GOLD,fg:'#4b514d',cost:0},
  used:{bg:'#e3e5e0',bd:'1px solid #c4c9c2',fg:'#9aa09b',cost:0},
  blocked:{bg:YG,bd:'1px solid #d6d1b8',fg:'#7d827e',cost:0}}[state];
 b.className='act';b.removeAttribute('aria-disabled');
 b.setAttribute('style','flex:1 1 0;height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:10px;padding:0;box-sizing:border-box;background:'+S.bg+';border:'+S.bd+';color:'+S.fg+';opacity:1');
 b.innerHTML='<span style="display:inline-flex;align-items:center;gap:5px;height:22px;color:'+S.fg+'">'+bolt(22)
  +(S.cost?'<span style="display:inline-flex;align-items:center;gap:3px;font:600 11.5px/1 var(--num);color:'+INK+'">−1 '+sq+'</span>':'')+'</span>'
  +'<span style="font:600 11px/1 var(--body);white-space:nowrap;color:'+S.fg+'">'+name+'</span>';
 return b.scrollWidth<=b.clientWidth+0.5?'fits':'CLIPS '+b.scrollWidth+'>'+b.clientWidth};
// The targeting row (Option B): Warm up again (light yellow, 2 parts, with its cost) and Cancel (1).
const tgtRow=(name,sqs)=>{const ar=document.querySelector('#actions .arow');
 const lab=(t)=>'<button type="button" class="act go" style="flex:2 1 0;flex-direction:row;gap:10px;background:'+TINT+';border:2px solid '+GOLD+';color:'+INK+'">'+bolt(22)
  +'<span class="go-text"><span class="go-1" style="white-space:nowrap">'+t+'</span><span class="go-2">−1 Stamina '+sqs+'</span></span></button>';
 ar.innerHTML='<span class="alabel">UNIT</span>'+lab('Warm up '+name+' again')+'<button type="button" class="act" style="flex:1 1 0">'+bolt(0)+'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg><span>Cancel</span></button>';
 const t=ar.querySelector('.go-1');const bt=t.closest('button');if(bt.scrollWidth>bt.clientWidth+0.5)t.textContent='Warm up again';
 ar.querySelector('svg[width="0"]').remove();return t.textContent};
const sub=(mode,name,line)=>{const ar=document.querySelector('#actions .arow');
 const ln=line==='cost'?'−1 Stamina '+window.__sqs:line;
 const big='<button type="button" class="act go gold" style="flex:2 1 0;flex-direction:row;gap:10px;background:'+GOLD+';border:2px solid '+INK+';color:'+INK+'">'+bolt(22)+'<span class="go-text"><span class="go-1" style="white-space:nowrap">'+name+'</span><span class="go-2">'+ln+'</span></span></button>';
 const warm='<button type="button" class="act" style="flex:1 1 0;background:'+TINT+';border:2px solid '+GOLD+';color:'+INK+'">'+bolt(22)+'<span>Warm up</span></button>';
 const cancel='<button type="button" class="act" style="flex:1 1 0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg><span>Cancel</span></button>';
 ar.innerHTML='<span class="alabel">UNIT</span>'+big+warm+cancel;const b=ar.children[1];return b.scrollWidth<=b.clientWidth+0.5?'fits':'CLIPS'};
const r={};const hn0=document.querySelector('#hint');if(hn0&&o.line&&!o.keephint)hn0.hidden=true;
if(o.line)r.sub=sub('gold',o.name,o.line);
if(o.pill){const h=document.querySelector('#hint');h.textContent=o.pill;h.hidden=false;r.pill=getComputedStyle(h).display}const hn=document.querySelector('#hint');if(hn&&o.tgt)hn.hidden=true;const ts=document.querySelector('#toast');if(ts)ts.hidden=true;
if(o.btn)r.btn=spBtn(o.btn,o.name);if(o.undo){const u=document.querySelector('#actions [data-act="undo"]');if(u){u.disabled=false;u.removeAttribute('aria-disabled');u.removeAttribute('data-why');r.undo='live'}}
if(o.note)note(o.note);
if(o.tgt)r.row=tgtRow(o.name,window.__sqs);
return r}"""

# Harvest the real "−1 Stamina" squares from the board's own warm-up confirm for this unit.
HARVEST = """(uid)=>{const G=GGShots,ui=G.App.ui;const keep=ui.sheet;ui.sheet={kind:'warm'};G.render();
const g=document.querySelector('#actions .go-2');window.__sqs=g?g.innerHTML.replace(/^−1 Stamina\\s*/,''):'';ui.sheet=keep;G.render();return !!g}"""

LR, HA = 'Arrow Storm', 'Skewer'
FR = [
 ('sp-r4-01-a-row', 'A1 · Tap Arrow Storm: the row reads Arrow Storm · 2 targets, Warm up, Cancel', [('sp','N-LR','charged'),('tap','E9'),('fx',{'line':'2 targets','name':LR})]),
 ('sp-r4-02-a-pick', 'A2 · Tap the big button: its 2 targets ring', [('sp','N-LR','charged'),('tap','E9'),('armraw',),('fx',{'line':'2 targets','name':LR,'keephint':1})]),
 ('sp-r4-03-a-preview', 'A3 · Tap a target: the preview; the big button now says −1 Stamina', [('sp','N-LR','charged'),('tap','E9'),('harvest','N-LR'),('arm',),('tap','E12'),('fx',{'line':'cost','name':LR})]),
 ('sp-r4-04-a-warm', 'A4 · Or tap Warm up: done, warming up (Undo live)', [('sp','N-LR','charged'),('tap','E9'),('warmnow',),('fx',{'btn':'warm','name':LR,'undo':1,'note':'Fires next turn · no attack or brace'})]),
 ('sp-r4-05-b-one', 'B1 · Skewer, one target: tap it and the preview opens at once; the big button fires (−1)', [('hex','S-LR','C10'),('sp','N-HA','charged'),('tap','C9'),('harvest','N-HA'),('arm',),('fx',{'line':'cost','name':HA})]),
 ('sp-r4-06-c-none', 'C1 · Skewer, no target: still gold; the line says No targets', [('sp','N-HA','charged'),('tap','C9'),('fx',{'line':'No targets','name':HA})]),
 ('sp-r4-07-c-none-tap', 'C2 · Tap it: the reason in the dark pill; move or warm up', [('sp','N-HA','charged'),('tap','C9'),('fx',{'line':'No targets','name':HA,'pill':'No enemy adjacent · move, or warm up'})]),
]

OUT = 'sp4'
os.makedirs(OUT + '/project', exist_ok=True)
meta = {}
only = sys.argv[1:] or None
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for name, title, steps in FR:
        if only and not any(o in name for o in only): continue
        pg = start(b)
        for i in range(25):
            if pg.evaluate("()=>GGShots.App.st.toMove") == 'N' and pg.evaluate("()=>GGShots.App.st.phase") == 'play': break
            pg.wait_for_timeout(1000)
        pg.evaluate(SETUP)
        log = []
        for s in steps:
            k = s[0]
            if k == 'sp': pg.evaluate("([id,v])=>{const st=GGShots.App.st;st.units.find(x=>x.uid===id).sp=v;GGShots.render()}", [s[1], s[2]])
            elif k == 'braced': pg.evaluate("(id)=>{const st=GGShots.App.st;st.units.find(x=>x.uid===id).braced=true;GGShots.render()}", s[1])
            elif k == 'tap': pg.evaluate("(h)=>GGShots.onBoardTap(h)", s[1])
            elif k == 'arm': log.append(pg.evaluate("()=>{const b=document.querySelector('#actions button[data-act=\"special\"]');b.click();return GGShots.App.ui.armed}"))
            elif k == 'click': log.append(pg.evaluate("(a)=>{const b=document.querySelector('#actions [data-act=\"'+a+'\"]');if(!b)return 'missing '+a;b.click();return 'ok'}", s[1]))
            elif k == 'hex': pg.evaluate("([id,h])=>{const st=GGShots.App.st;st.units.find(x=>x.uid===id).hex=h;GGShots.render()}", [s[1], s[2]])
            elif k == 'armraw': log.append(pg.evaluate("()=>{const G=GGShots;G.App.ui.sheet=null;G.App.ui.armed='special';G.render();return G.App.ui.armed}"))
            elif k == 'warmnow': log.append(pg.evaluate("()=>{const G=GGShots;G.App.ui.sheet={kind:'warm'};G.render();const b=document.querySelector('#actions [data-act=\"warm-confirm\"]');if(!b)return 'nowarm';b.click();return 'warmed'}"))
            elif k == 'harvest': log.append(pg.evaluate(HARVEST, s[1]))
            elif k == 'fx': log.append(pg.evaluate(FX, s[1]))
            pg.wait_for_timeout(250)
        # Keep the action in view: centre rows 9 to 12 unless a sheet is open (the build scrolls those itself).
        pg.evaluate("()=>{const sh=document.querySelector('#sheet');if(sh&&!sh.hidden&&getComputedStyle(sh).display!=='none')return;const f=document.querySelector('#fieldscroll');f.scrollTop=Math.round((f.scrollHeight-f.clientHeight)*0.5)}")
        pg.wait_for_timeout(300)
        st = pg.evaluate("()=>{const st=GGShots.App.st;return st.units.filter(u=>u.team==='N').map(u=>u.uid+':'+u.hex+':'+u.sp).join(' ')}")
        meta[name] = dict(title=title, log=log, units=st)
        body = pg.evaluate(SER); assert '{{' not in body
        html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&amp;family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">
<style>
body{{margin:0}}
</style>
</helmet>
<div style="position: relative; width: 393px; height: 665px; overflow: hidden; background: #e9ece6; color: #1f2421; font: 15px/1.45 'IBM Plex Sans', system-ui, sans-serif">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview": {{"width": 393, "height": 665}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
"""
        open(f'{OUT}/project/{name}.dc.html', 'w').write(html)
        pg.close()
        h = html.replace('<script src="./support.js"></script>', '').replace('<x-dc>', '').replace('</x-dc>', '').replace('<helmet>', '').replace('</helmet>', '')
        h = re.sub(r'<script type="text/x-dc".*?</script>', '', h, flags=re.S)
        open(f'{OUT}/chk_{name}.html', 'w').write(h)
        pg = b.new_page(viewport={'width': 393, 'height': 665}, device_scale_factor=1)
        pg.goto(f'file://{OUT}/chk_{name}.html'); pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/chk_{name}.png'); pg.close()
    b.close()
json.dump(meta, open(f'{OUT}/meta.json', 'w'), indent=1)
print(json.dumps(meta, indent=1))
