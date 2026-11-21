"""Specials Round 6 (UI chat, 21 Nov 2026): the several-targets special preview (Arc Hit, three targets) without the
outcome bar. Opens the real board (main, v3.14.00) at 393 x 665, sets up a 7v7 position, opens the build's own special
preview, then rebuilds only the sheet (two layouts) and the action row (the approved specials row). Every number comes
from the engine's options for that target (E.options().special)."""
import sys, os, re, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'phone-fit'))
from base import *
SER = re.search(r'SER="""(.*?)"""', open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'phone-fit', 'gen.py')).read(), re.S).group(1)
SER = SER.replace("'grid-column-start',", "'grid-column-start','grid-column-end','grid-row-end',")
SER = SER.replace("walk(src,dst);", "walk(src,dst);const fs=document.querySelector('#fieldscroll'),fd=dst.querySelector('#fieldscroll');if(fs&&fd&&fs.scrollTop){const sv=fd.querySelector('svg');sv.setAttribute('style',sv.getAttribute('style')+' margin-top: -'+fs.scrollTop+'px;')}")

SETUP = """(o)=>{const G=GGShots,st=G.App.st;const u=id=>st.units.find(x=>x.uid===id);
const pos=o.pos||{'N-HM':'E9','N-LR':'C8','N-HA':'G8','N-LM':'C9','N-HM2':'G9','N-HR':'E7','N-LA':'B8',
 'S-HM':'D9','S-LA':'E10','S-HA':'F9','S-LM':'E12','S-LR':'C12','S-HM2':'G12','S-HR':'E14'};
for(const k in pos)u(k).hex=pos[k];
if(!o.pos){u('S-HA').braced=true; if(o.kill)u('S-LA').hp=6;} (o.mods||[]).forEach(([id,k,v])=>u(id)[k]=v); u(o.att||'N-HM').sp='charged'; G.render();return true}"""

# Icons by key name, taken from the build's own attack-preview key (attack the braced spearman, then the archer).
HARVEST = """()=>{const G=GGShots,ui=G.App.ui,st=G.App.st;const out={};
const grab=(h)=>{G.onBoardTap(st.units.find(x=>x.uid==='N-HM').hex);const a=document.querySelector('#actions [data-act="arm-attack"]');if(a)a.click();G.onBoardTap(h);ui.keyOpen=true;G.render();
 document.querySelectorAll('#sheet .key-row').forEach(r=>{const n=r.querySelector('.key-1').textContent.trim().split(' ')[0];const s=r.querySelector('svg');if(s&&!out[n])out[n]=s.outerHTML});
 const sv0=document.querySelector('#sheet .fo-stat svg');if(sv0&&!out.Strength)out.Strength=sv0.outerHTML;
 const inf=document.querySelector('#sheet .fo-side svg[width="15"], #sheet .ib svg, #unitbar .ub-id svg:last-child');
 ui.keyOpen=false;ui.sheet=null;ui.armed=null;G.render()};
grab('F9');grab('E10');
G.onBoardTap(st.units.find(x=>x.uid==='N-HM').hex);const i=document.querySelector('#unitbar .ub-id svg:last-of-type');out.info=i?i.outerHTML:'';
window.__ic=out;return Object.keys(out)}"""

# Build the sheet. o.layout: 'rows' (modifiers on each target's row) or 'stack' (under the attacker, tagged ① ② ③).
SHEET = r"""(o)=>{const G=GGShots,st=G.App.st,E=G.E,ui=G.App.ui;const IC=window.__ic;
const INK='#1f2421',MUT='#5f6762',RED='#c62828';
const sz=(s,n)=>s?s.replace(/width="[\d.]+"/,'width="'+n+'"').replace(/height="[\d.]+"/,'height="'+n+'"'):'';
const me=st.units.find(x=>x.uid===ui.sel);const opt=E.options(st,me.uid).special;const p=opt.targets.find(t=>t.target===o.target);
const U=id=>st.units.find(x=>x.uid===id);const team=u=>u.team==='N'?'var(--north)':'var(--south)';
const tok=(u,n)=>sz(window.__tk[u.uid]||'',n);const nm=u=>window.__nm[u.uid]||u.id;
const info='<span style="display:inline-flex;width:14px;height:14px;color:'+MUT+';flex:none">'+sz(IC.info,14)+'</span>';
const stat=(icon,txt)=>'<span style="display:inline-flex;align-items:center;gap:2px;white-space:nowrap;font:600 12px/1 var(--num);color:'+MUT+'"><span style="display:inline-flex;width:13px;height:13px">'+sz(IC[icon],13)+'</span>'+txt+'</span>';
const mods=d=>{const m=[];if(d.support)m.push(stat('Support','+'+d.support));if(d.armorTaken)m.push(stat('Armor','−'+d.armorTaken));if(d.brace)m.push(stat('Brace','−'+d.brace));if(d.dodge)m.push(stat('Dodge',d.dodge.pct+'%'));return m};
const fmt=x=>(Math.round(x*10)/10).toString();
const bar=(u,h,hgt)=>{const pct=100*u.hp/u.maxHp,cut=100*Math.min(u.hp,h.dmg)/u.maxHp;return '<div style="position:relative;height:'+hgt+'px;border-radius:2px;background:#dfe3dc;overflow:hidden"><i style="position:absolute;left:0;top:0;bottom:0;width:'+pct.toFixed(1)+'%;background:'+team(u)+'"></i><i style="position:absolute;top:0;bottom:0;left:'+(pct-cut).toFixed(1)+'%;width:'+cut.toFixed(1)+'%;background:repeating-linear-gradient(135deg,'+(o.style?'#d4a020':(h.kills?RED:INK))+' 0 2px,#fff 2px 3.5px)"></i></div>'};
const hpn=u=>'<span style="font:600 11.5px/1 var(--num);color:'+MUT+';white-space:nowrap">'+fmt(u.hp)+'/'+u.maxHp+'</span>';
const dmg=h=>(o.style==='card'||o.style==='burst')?'<span style="font:700 14px/1 var(--num);color:'+(h.kills?'#fff':INK)+';background:'+(h.kills?RED:'#e2b53c')+';border-radius:6px;padding:3px 6px;white-space:nowrap;min-width:30px;text-align:center">−'+fmt(h.dmg)+'</span>':'<span style="font:700 15px/1 var(--num);color:'+(h.kills?RED:INK)+';white-space:nowrap;min-width:38px;text-align:right">−'+fmt(h.dmg)+'</span>';
const num=i=>'<span style="width:15px;height:15px;border-radius:50%;background:'+INK+';color:#fff;font:700 10px/15px var(--num);text-align:center;flex:none;display:inline-block">'+(i+1)+'</span>';
const name=(u,f)=>'<span style="font:700 '+(f||13.5)+'px/1 var(--display);white-space:nowrap">'+nm(u)+'</span>';
const d0=p.hits[0].detail;const S=o.style||'';if(!IC.special){const b=document.querySelector('#actions .act.go svg');if(b)IC.special=b.outerHTML}const G2='#e2b53c',GD='#8a6410';
const mult=(p.hits[0].mult||1);const multT='×'+(Math.round(mult*100)/100);
const glow=(S==='burst'||S==='final')?'box-shadow:0 0 0 3px rgba(226,181,60,.35),0 0 12px 3px rgba(226,181,60,.55);border-radius:50%;':'';
const label=S?'<span style="display:inline-flex;align-items:center;gap:3px;font:700 12px/1 var(--display);letter-spacing:.08em;color:'+GD+';margin-left:4px;white-space:nowrap"><span style="display:inline-flex;width:13px;height:13px;color:'+G2+'">'+sz(IC.special||'',13)+'</span>'+opt.name.toUpperCase()+'</span>':'';
const sure=(S==='card'||S==='burst')?'<span style="font:700 10px/1 var(--display);letter-spacing:.1em;color:#5a4108;background:'+G2+';border-radius:8px;padding:3px 7px;margin-left:6px;white-space:nowrap">SURE HIT</span>':'<span style="font:600 11px/1 var(--body);color:'+(S?GD:MUT)+';margin-left:6px">'+(S?'Sure hit':'no dice')+'</span>';
const att='<div style="display:flex;align-items:center;gap:7px;height:24px"><span style="display:inline-flex;'+glow+'">'+tok(me,22)+'</span>'+name(me,14)+info+label+'<span style="flex:1"></span>'+stat('Strength',fmt(d0.str)+'<span style="margin-left:3px;color:'+(S?GD:MUT)+'">'+multT+'</span>')+sure+'</div>';
let mid='',rows='';
if(o.layout==='mirror'){
 p.hits.forEach((h,i)=>{const u=U(h.uid);
  const kc=(h.kills&&E.killConsequences(st,me.uid,h.uid,{special:true}))||[];const kp=kc.filter(e=>e.type==='spear').map(e=>(window.__kp||'').replace(/>[\d.]+<\/span>$/,'>'+fmt(e.amount)+'</span>')).join('');
  rows+='<div style="padding:3px 0 4px;border-top:1px solid #e3e6e0"><div style="display:flex;align-items:center;gap:7px;height:20px">'+dmg(h).replace('text-align:right','text-align:left').replace('min-width:38px','min-width:0')+kp+hpn(u)+'<span style="flex:1"></span><span style="display:inline-flex;gap:7px;margin-right:3px">'+mods(h.detail).join('')+'</span>'+info+name(u)+tok(u,18)+'</div>'
   +'<div style="margin:3px 25px 0 46px;transform:scaleX(-1)">'+bar(u,h,4)+'</div></div>'});
}else if(o.layout==='rows'){
 p.hits.forEach((h,i)=>{const u=U(h.uid);
  rows+='<div style="padding:3px 0 4px;border-top:1px solid #e3e6e0"><div style="display:flex;align-items:center;gap:7px;height:20px">'+tok(u,18)+name(u)+info
   +'<span style="display:inline-flex;gap:7px;margin-left:3px">'+mods(h.detail).join('')+'</span><span style="flex:1"></span>'+hpn(u)+dmg(h)+'</div>'
   +'<div style="margin:3px 46px 0 25px">'+bar(u,h,4)+'</div></div>'});
}else{
 mid='<div style="display:flex;align-items:center;gap:12px;margin:3px 0 4px 29px;flex-wrap:nowrap">'+p.hits.map((h,i)=>{const m=mods(h.detail);return '<span style="display:inline-flex;align-items:center;gap:4px">'+num(i)+(m.length?m.join(''):'<span style="font:500 11px/1 var(--body);color:'+MUT+'">—</span>')+'</span>'}).join('')+'</div>';
 p.hits.forEach((h,i)=>{const u=U(h.uid);
  rows+='<div style="display:flex;align-items:center;gap:7px;height:27px;border-top:1px solid #e3e6e0">'+num(i)+tok(u,18)+name(u)+info
   +'<div style="flex:1 1 auto;min-width:30px;margin:0 2px">'+bar(u,h,5)+'</div>'+hpn(u)+dmg(h)+'</div>'});
}
if(o.layout==='stack'){const fw=document.querySelector('#fieldwrap'),fr=fw.getBoundingClientRect();p.hits.forEach((h,i)=>{const el=document.querySelector('#fieldscroll [data-hex="'+U(h.uid).hex+'"]');if(!el)return;const r=el.getBoundingClientRect();
 fw.insertAdjacentHTML('beforeend','<span style="position:absolute;z-index:7;left:'+Math.round(r.left-fr.left+r.width*0.12)+'px;top:'+Math.round(r.top-fr.top+r.height*0.02)+'px;width:17px;height:17px;border-radius:50%;background:'+INK+';color:#fff;font:700 11px/17px var(--num);text-align:center;border:1.5px solid #fff">'+(i+1)+'</span>')})}
const sh=document.querySelector('#sheet');
sh.innerHTML='<div style="width:36px;height:4px;border-radius:2px;background:'+(S&&S!=='final'?G2:'#b8beb6')+';margin:'+(S?'-2px':'0')+' auto '+(S?'5px':'6px')+'"></div>'+att+mid+'<div style="margin-top:4px;'+((S==='burst'||S==='final')?'border-left:2px solid '+G2+';margin-left:10px;padding-left:8px;':'')+'">'+rows+'</div>';
if(S){sh.style.borderTop='3px solid '+G2;} if(S==='card'||S==='burst'){sh.style.background='#fbf5e4';}
sh.setAttribute('style',(sh.getAttribute('style')||'')+';padding:7px 14px 4px;box-sizing:border-box');
window.__pk=[...document.querySelectorAll('body *')].filter(e=>e.children.length===0&&/Pick one of your own units/.test(e.textContent)).map(e=>{const path=[];let x=e;for(let i=0;i<4&&x;i++){path.push(x.tagName+'#'+x.id+'.'+x.className);x=x.parentElement}e.style.display='none';return path.join(' < ')});
const r=sh.getBoundingClientRect();const f=document.querySelector('#fieldwrap').getBoundingClientRect();
const over=[...sh.querySelectorAll('div')].filter(d=>d.scrollWidth>d.clientWidth+1).length;
return {pk:window.__pk,sheet:Math.round(r.height),field:Math.round(r.top-f.top),overflow:over,hits:p.hits.map(h=>h.uid+' '+h.dmg+(h.kills?' kills':''))}}"""

# Field numbers ① ② ③ on the targets (stack layout only), drawn over the field.
NUMS = """(o)=>{const G=GGShots,st=G.App.st,E=G.E,ui=G.App.ui;const p=E.options(st,ui.sel).special.targets.find(t=>t.target===o.target);
const sv=document.querySelector('#fieldscroll svg');const ns='http://www.w3.org/2000/svg';
p.hits.forEach((h,i)=>{const g=[...sv.querySelectorAll('text')].find(t=>0);});
return true}"""

ROW = r"""()=>{const ar=document.querySelector('#actions .arow');const GOLD='#e2b53c',INK='#1f2421',YG='#ebe8d9';
const g=ar.querySelector('.act.go');const sq=g?g.querySelector('.go-2').innerHTML:'';const bolt=g?g.querySelector('svg').outerHTML:'';
const name=g?g.querySelector('.go-1').textContent:'';
const big='<button type="button" class="act go gold" style="flex:2 1 0;flex-direction:row;gap:10px;background:'+GOLD+';border:2px solid '+INK+';color:'+INK+'">'+bolt+'<span class="go-text"><span class="go-1">'+name+'</span><span class="go-2">'+sq+'</span></span></button>';
const warm='<button type="button" class="act" style="flex:1 1 0">'+bolt+'<span>Warm up</span></button>';
const cancel='<button type="button" class="act" style="flex:1 1 0"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg><span>Cancel</span></button>';
ar.innerHTML='<span class="alabel">UNIT</span>'+big+warm+cancel;return name}"""

TOKS = """()=>{const G=GGShots,st=G.App.st,E=G.E,ui=G.App.ui;const tk={},nm={};
const uname=u=>{const c=E.card(st,u),n=c.name||u.card;const dup=st.units.some(o=>o!==u&&o.team===u.team&&o.card===u.card&&!o.fk);if(u.fk)return n+' (Flagkeeper)';if(!dup)return n;return n+' '+(u.id.replace(/^[A-Z]+/,'')||'1')};
for(const u of st.units){Object.assign(ui,{sel:null,armed:null,sheet:null});G.render();G.onBoardTap(u.hex);const t=document.querySelector('#unitbar .ub-id svg');if(t)tk[u.uid]=t.outerHTML;nm[u.uid]=uname(u)}
Object.assign(ui,{sel:null,armed:null,sheet:null});G.render();G.onBoardTap(st.units.find(x=>x.uid===(window.__att||'N-HM')).hex);
const h=document.querySelector('#hint');if(h)h.hidden=true;const ts=document.querySelector('#toast');if(ts)ts.hidden=true;
window.__tk=tk;window.__nm=nm;return nm}"""

FR = [
 ('sp-r11-02-pickoff', 'Pick Off · the kill hatched gold too; the number and the set spear pill stay red', {'layout':'mirror','style':'final','kp':1,'att':'N-LM','tgthex':'G10','tgt':'S-LR',
   'pos':{'N-HM':'C8','N-LR':'B8','N-HA':'D8','N-LM':'G9','N-HM2':'E8','N-HR':'D7','N-LA':'F8','S-LR':'G10','S-HA':'G11','S-HM':'C12','S-LA':'E12','S-LM':'D13','S-HM2':'F13','S-HR':'E14'},
   'mods':[['S-LR','hp',7],['S-HA','braced',True]]}),
]
OUT = os.environ.get('OUT', 'sp11')
os.makedirs(OUT + '/project', exist_ok=True)
meta = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for name, title, o in FR:
        pg = start(b)
        for i in range(25):
            if pg.evaluate("()=>GGShots.App.st.toMove") == 'N' and pg.evaluate("()=>GGShots.App.st.phase") == 'play': break
            pg.wait_for_timeout(1000)
        pg.evaluate(SETUP, {'kill': 1}); h0 = pg.evaluate(HARVEST)
        pg.evaluate(SETUP, o); pg.evaluate("(a)=>{window.__att=a}", o.get('att','N-HM'))
        if o.get('kp'):
            log0 = pg.evaluate("""(o)=>{const G=GGShots,st=G.App.st,ui=G.App.ui;Object.assign(ui,{sel:null,armed:null,sheet:null});G.render();
             G.onBoardTap(st.units.find(x=>x.uid===o.att).hex);const a=document.querySelector('#actions [data-act="arm-attack"]');if(a)a.click();G.onBoardTap(o.tgthex);
             const k=document.querySelector('#sheet .kpill.hurt');window.__kp=k?k.outerHTML:'';Object.assign(ui,{sel:null,armed:null,sheet:null});G.render();return window.__kp.length}""", o)
        log = [h0, pg.evaluate(TOKS)]
        pg.evaluate("(a)=>{const G=GGShots,st=G.App.st;if(G.App.ui.sel!==a)G.onBoardTap(st.units.find(x=>x.uid===a).hex);document.querySelector('#actions [data-act=\"special\"]').click()}", o.get('att','N-HM'))
        pg.wait_for_timeout(200)
        pg.evaluate("(h)=>{if(!GGShots.App.ui.sheet)GGShots.onBoardTap(h)}", o.get('tgthex','E10'))
        pg.wait_for_timeout(300)
        log.append(pg.evaluate(ROW))
        o2 = dict(o, target=o.get('tgt','S-LA'))
        log.append(pg.evaluate(SHEET, o2))
        pg.wait_for_timeout(300)
        meta[name] = dict(title=title, log=log)
        body = pg.evaluate(SER)
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
        pg.screenshot(path=f'{OUT}/live_{name}.png')
        pg.close()
    b.close()
json.dump(meta, open(f'{OUT}/meta.json', 'w'), indent=1)
print(json.dumps(meta, indent=1))
