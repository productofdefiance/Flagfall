import json, re, os
from playwright.sync_api import sync_playwright
import importlib.util
def load(n):
    src=open(n).read()
    return src
m1=open('mock.py').read(); SLIM1=re.search(r'SLIM="""(.*?)"""',m1,re.S).group(1)
m2=open('mock2.py').read(); SLIM2=re.search(r'SLIM="""(.*?)"""',m2,re.S).group(1); REBUILD=re.search(r'REBUILD="""(.*?)"""',m2,re.S).group(1)
def click(pg,txt):
    return pg.evaluate("""(w)=>{const c=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled);const b=c.find(x=>x.innerText.trim().toLowerCase().startsWith(w.toLowerCase()));if(b){b.click();return true}return false}""",txt)
SER="""()=>{
const HP=['display','position','top','left','right','bottom','width','height','min-width','min-height','max-width','box-sizing','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis','align-items','align-self','justify-content','gap','grid-template-rows','grid-template-columns','grid-row-start','grid-column-start','background-color','background-image','color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-transform','text-align','white-space','text-overflow','overflow-x','overflow-y','border-top','border-right','border-bottom','border-left','border-radius','box-shadow','opacity','z-index','transform','writing-mode','font-variant-numeric','pointer-events','vertical-align'];
const SP=['fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','fill-opacity','stroke-opacity','font-family','font-size','font-weight','text-anchor','letter-spacing','dominant-baseline','display'];
const src=document.querySelector('#view-play');const dst=src.cloneNode(true);
const walk=(a,b)=>{const cs=getComputedStyle(a);if(cs.display==='none'||a.hidden){b.remove();return}
 const svg=a.namespaceURI.includes('svg')&&a.tagName.toLowerCase()!=='svg';
 const props=svg?SP:HP;let s='';
 for(const p of props){let v=cs.getPropertyValue(p);if(!v)continue;
  if(svg){ if(p==='opacity'&&v==='1')continue; if((p==='fill-opacity'||p==='stroke-opacity')&&v==='1')continue; if(p==='stroke-dasharray'&&v==='none')continue; if(p==='letter-spacing'&&v==='normal')continue; if(p==='display'&&v!=='none')continue; if(p==='dominant-baseline'&&v==='auto')continue; if((p==='stroke-linecap'&&v==='butt')||(p==='stroke-linejoin'&&v==='miter'))continue; if(a.tagName!=='text'&&a.tagName!=='tspan'&&(p.startsWith('font')||p==='text-anchor'))continue;}
  else if(a.tagName==='BUTTON'&&(p.startsWith('border-')||p==='background-color'||p.startsWith('padding'))){}
  else { if(['top','left','right','bottom'].includes(p)&&cs.position==='static')continue; if(v==='auto'&&p!=='width'&&p!=='height')continue; if(v==='none'&&['background-image','box-shadow','transform','text-transform','max-width'].includes(p))continue; if(v==='0px'&&(p.startsWith('margin')||p.startsWith('padding')||p==='min-width'||p==='min-height'||p==='border-radius'))continue; if(v==='normal'&&['letter-spacing','gap','white-space','font-style','font-variant-numeric','align-items','align-self','justify-content'].includes(p))continue; if(p.startsWith('border-')&&p!=='border-radius'&&v.startsWith('0px'))continue; if(p==='opacity'&&v==='1')continue; if(p==='z-index'&&v==='auto')continue; if(p==='flex-grow'&&v==='0')continue; if(p==='flex-shrink'&&v==='1')continue; if(p==='flex-wrap'&&v==='nowrap')continue; if(p==='flex-direction'&&v==='row')continue; if(p==='background-color'&&v==='rgba(0, 0, 0, 0)')continue; if(p==='writing-mode'&&v==='horizontal-tb')continue; if(p==='pointer-events'&&v==='auto')continue; if(p==='text-align'&&v==='start')continue; if(p==='text-overflow'&&v==='clip')continue; if((p==='overflow-x'||p==='overflow-y')&&v==='visible')continue; if(p==='vertical-align'&&v==='baseline')continue; if(p.startsWith('grid')&&(v==='none'||v==='auto'))continue; if(p==='width'||p==='height'){ if(cs.display==='inline')continue;} }
  s+=p+': '+v.replace(/"/g,"'")+'; ';}
 if(a.tagName.toLowerCase()==='svg'){s+='display: '+cs.display+'; width: '+cs.width+'; height: '+cs.height+'; color: '+cs.color+'; flex-shrink: 0; overflow: visible; '+(cs.position!=='static'?'position: '+cs.position+'; ':'')+(cs.marginLeft!=='0px'?'margin-left: '+cs.marginLeft+'; margin-right: '+cs.marginRight+'; ':'');}
 if(a.tagName==='BUTTON')s+='cursor: default; ';
 b.setAttribute('style',s.trim());b.removeAttribute('class');[...b.attributes].filter(t=>t.name.startsWith('data-')||t.name==='hidden').forEach(t=>b.removeAttribute(t.name));
 const ac=[...a.children],bc=[...b.children];for(let i=0;i<ac.length;i++)walk(ac[i],bc[i]);};
walk(src,dst);dst.querySelectorAll('script').forEach(e=>e.remove());return dst.outerHTML}"""
VARS=[('pf-r1-a','',None,665,'Round 1 · A · Today, brief 017’s build'),
('pf-r1-b',SLIM1,None,665,'Round 1 · B · No title bar, slimmer panel'),
('pf-r1-c',SLIM1+"#board{width:84%}",None,665,'Round 1 · C · B plus a slight zoom-out'),
('pf-r1-d',SLIM1,None,759,'Round 1 · D · B opened from the home screen'),
('pf-r2-b2',SLIM2,'sel',665,'Round 2 · B2 · Unit tapped'),
('pf-r2-b2-move',SLIM2,'move',665,'Round 2 · B2 · Move previewed (unit bar only; buttons as today)')]
os.makedirs('canvas/project',exist_ok=True); meta={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for name,css,mode,H,title in VARS:
        pg=b.new_page(viewport={'width':393,'height':H},device_scale_factor=1,has_touch=True,is_mobile=True)
        pg.goto('http://localhost:8102/index.html'); pg.wait_for_timeout(900)
        click(pg,'New game'); pg.wait_for_timeout(300); click(pg,'5v5'); pg.wait_for_timeout(200)
        click(pg,'Next: Teams'); pg.wait_for_timeout(300); click(pg,'Next: Lineup'); pg.wait_for_timeout(300); click(pg,'Start match'); pg.wait_for_timeout(600)
        for i in range(4):
            if click(pg,'Fill rest'): pg.wait_for_timeout(300)
            if click(pg,'Ready'): pg.wait_for_timeout(1200)
        pg.wait_for_timeout(2500)
        pg.evaluate("()=>{document.querySelector('#fieldscroll').scrollTop=0}"); pg.wait_for_timeout(300)
        for u in pg.query_selector_all('#board .unit'):
            bb=u.bounding_box()
            if bb and bb['y']>200 and bb['y']<380:
                pg.touchscreen.tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(500)
                if pg.evaluate("()=>[...document.querySelectorAll('#actions .act')].some(a=>!a.disabled&&a.getAttribute('aria-disabled')!='true'&&/Brace/.test(a.innerText))"): break
        if css: pg.add_style_tag(content=css)
        if mode: pg.evaluate(REBUILD,mode); pg.add_style_tag(content='.r1 .nm{white-space:nowrap;padding-right:4px}')
        pg.wait_for_timeout(300)
        pg.evaluate("()=>{document.querySelector('#fieldscroll').scrollTop=0}"); pg.wait_for_timeout(400)
        r=pg.evaluate("""()=>{const r=s=>Math.round(document.querySelector(s).getBoundingClientRect().height);const c=document.querySelector('#board .cell').getBoundingClientRect();return {field:r('#fieldwrap'),unitbar:r('#unitbar'),actions:r('#actions'),topbar:r('#topbar'),hexH:c.height,hexW:c.width}}""")
        r['rows']=round(r['field']/r['hexH'],1); meta[name]=dict(r,H=H,title=title)
        body=pg.evaluate(SER)
        html=f"""<!doctype html>
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
<div style="position: relative; width: 393px; height: {H}px; overflow: hidden; background: #e9ece6; color: #1f2421; font: 15px/1.45 'IBM Plex Sans', system-ui, sans-serif">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview": {{"width": 393, "height": {H}}}}}'>
class Component extends DCLogic {{
renderVals() {{
return {{}};
}}
}}
</script>
</body>
</html>
"""
        assert '{{' not in body
        open(f'canvas/project/{name}.dc.html','w').write(html); pg.close()
    # verify: render one serialized artboard standalone and screenshot
    for name in ['pf-r1-a','pf-r2-b2','pf-r2-b2-move','pf-r1-c']:
        h=open(f'canvas/project/{name}.dc.html').read()
        h=h.replace('<script src="./support.js"></script>','').replace('<x-dc>','').replace('</x-dc>','').replace('<helmet>','').replace('</helmet>','')
        h=re.sub(r'<script type="text/x-dc".*?</script>','',h,flags=re.S)
        open(f'check_{name}.html','w').write(h)
        pg=b.new_page(viewport={'width':393,'height':meta[name]['H']},device_scale_factor=2)
        pg.goto('file:///home/claude/work/check_'+name+'.html'); pg.wait_for_timeout(1200); pg.screenshot(path=f'check_{name}.png'); pg.close()
    b.close()
json.dump(meta,open('meta.json','w'),indent=1); print(json.dumps(meta)); 
for n in os.listdir('canvas/project'): print(n, os.path.getsize('canvas/project/'+n))
