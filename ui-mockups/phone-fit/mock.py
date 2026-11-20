import json
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
def click(pg,txt):
    return pg.evaluate("""(w)=>{const c=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled);const b=c.find(x=>x.innerText.trim().toLowerCase().startsWith(w.toLowerCase()));if(b){b.click();return true}return false}""",txt)
SLIM="""
.tb-title{position:absolute;top:100%;left:0;padding:8px;z-index:6}
.tb-brand,.tb-rule{display:none}
.tb-options{background:rgba(248,249,245,.92)!important;color:#1f2421!important;border:1px solid #b8beb6!important}
.tb-board{padding:9px 16px 11px;gap:8px}
#unitbar{min-height:56px;padding:6px 14px}
#actions{padding:6px 10px 8px;gap:5px}
.act{height:48px}
"""
VARS=[('A_today','',665),('B_slim',SLIM,665),('C_slim_zoom',SLIM+"#board{width:84%}",665),('D_slim_app',SLIM,759)]
out={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for name,css,H in VARS:
        pg=b.new_page(viewport={'width':393,'height':H},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg.goto('http://localhost:8102/index.html'); pg.wait_for_timeout(700)
        click(pg,'New game'); pg.wait_for_timeout(300); click(pg,'5v5'); pg.wait_for_timeout(200)
        click(pg,'Next: Teams'); pg.wait_for_timeout(300); click(pg,'Next: Lineup'); pg.wait_for_timeout(300); click(pg,'Start match'); pg.wait_for_timeout(600)
        for i in range(4):
            if click(pg,'Fill rest'): pg.wait_for_timeout(300)
            if click(pg,'Ready'): pg.wait_for_timeout(1200)
        pg.wait_for_timeout(2500)
        if css: pg.add_style_tag(content=css)
        pg.wait_for_timeout(300)
        # show own (North) end: scroll to top
        pg.evaluate("()=>{const f=document.querySelector('#fieldscroll');f.scrollTop=0}")
        pg.wait_for_timeout(300)
        us=pg.query_selector_all('#board .unit')
        for u in us:
            bb=u.bounding_box()
            fw=pg.evaluate("()=>{const r=document.querySelector('#fieldwrap').getBoundingClientRect();return [r.top,r.bottom]}")
            if bb and bb['y']>fw[0]+50 and bb['y']+bb['height']<fw[1]-45:
                pg.touchscreen.tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2); pg.wait_for_timeout(500)
                if pg.evaluate("()=>[...document.querySelectorAll('#actions .act')].some(a=>!a.disabled&&a.getAttribute('aria-disabled')!='true'&&/Brace/.test(a.innerText))"): break
        pg.evaluate("()=>{const f=document.querySelector('#fieldscroll');f.scrollTop=0}"); pg.wait_for_timeout(300)
        r=pg.evaluate("""()=>{const r=s=>Math.round(document.querySelector(s).getBoundingClientRect().height);const c=document.querySelector('#board .cell').getBoundingClientRect();return {topbar:r('#topbar'),field:r('#fieldwrap'),unitbar:r('#unitbar'),actions:r('#actions'),hexW:+c.width.toFixed(1),hexH:+c.height.toFixed(1),boardH:r('#board')}}""")
        r['rows']=round(r['field']/r['hexH'],1); r['share']=round(100*r['field']/r['boardH']); out[name]=r
        pg.screenshot(path=f'mock_{name}.png'); pg.close()
    b.close()
print(json.dumps(out,indent=0))
