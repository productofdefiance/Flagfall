import json
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
def click(pg,txt):
    return pg.evaluate("""(w)=>{const c=[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled);const b=c.find(x=>x.innerText.trim().toLowerCase().startsWith(w.toLowerCase()));if(b){b.click();return true}return false}""",txt)
SLIM="""
.tb-title{position:absolute;top:calc(100% + 38px);left:8px;padding:0;z-index:6}
.tb-brand,.tb-rule{display:none}
.tb-options,.fbtn{width:44px;height:44px;border-radius:10px;background:#1f2421!important;color:#f8f9f5!important;border:1.5px solid #fff!important;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}
.fbtn{position:absolute;right:8px;z-index:6}
.tb-board{padding:9px 16px 11px;gap:8px}
#namesbtn,#keytab{display:none!important}
#unitbar{display:block;min-height:0;padding:0 14px 9px}
#actions{padding:6px 10px 8px;gap:5px}
.act{height:48px}
.grab{width:36px;height:4px;border-radius:2px;background:#b8beb6;margin:5px auto 5px}
.r1{display:flex;align-items:center;gap:8px;height:22px}
.r1 .nm{font:700 17px/1 var(--display);letter-spacing:.02em}
.r1 .sp{flex:1}
.r1 .st{display:inline-flex;align-items:center;gap:4px;font:600 13px/1 var(--num)}
.r2{display:flex;align-items:center;gap:8px;margin-top:6px;height:11px}
.r2 .hpbar{flex:1;width:auto}
.r2 .n{font:600 13px/1 var(--num)}
.chip{display:inline-flex;align-items:center;height:15px;padding:0 6px;border-radius:7.5px;background:#1f2421;color:#fff;font:700 10px/1 var(--num)}
.tag{position:absolute;left:0;top:0;z-index:6;background:#8fd0b4;color:#1f2421;font:700 12px/1 var(--display);letter-spacing:.12em;padding:6px 12px 7px 16px;border-radius:0 0 9px 0;box-shadow:0 3px 8px rgba(0,0,0,.18)}
"""
REBUILD="""(mode)=>{const ub=document.querySelector('#unitbar');const svgs=[...ub.querySelectorAll('svg')];const tok=svgs[0].cloneNode(true);tok.setAttribute('width',24);tok.setAttribute('height',24);
const hexi=ub.querySelector('.ub-stat svg').outerHTML;const info=ub.querySelector('.ub-info svg').cloneNode(true);info.setAttribute('width',16);info.setAttribute('height',16);info.style.color='#5f6762';
const name=ub.querySelector('.ub-name').innerText;const hp=ub.querySelector('.hpbar').outerHTML;const hpn=ub.querySelector('.num').innerText;
const sq=mode=='move'?'<span class="sqs"><span class="sq on"></span><span class="sq on"></span><span class="sq cost"></span></span>':ub.querySelector('.sqs').outerHTML;
const right=mode=='move'?'<span class="chip">+0.5</span><span class="st" style="color:#5f6762">D3</span><span class="st">→</span><span class="st">D5</span>':'<span class="st">'+hexi+'D3</span><span class="st">→ 3</span>';
ub.innerHTML='<div class="grab"></div><div class="r1">'+tok.outerHTML+'<span class="nm">'+name+'</span>'+info.outerHTML+'<span class="sp"></span>'+right+'</div><div class="r2">'+hp+'<span class="n">'+hpn+'</span>'+sq+'</div>';
const fw=document.querySelector('#fieldwrap');
if(!document.querySelector('.tag')){fw.insertAdjacentHTML('beforeend','<div class="tag">NORTH PLAYS</div><div class="fbtn" style="top:38px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg></div><div class="fbtn" style="bottom:60px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><text x="12" y="15.5" text-anchor="middle" font-size="8" fill="currentColor" stroke="none" font-weight="700">A1</text></svg></div><div class="fbtn" style="bottom:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><path d="M9 12h6"/></svg></div>')}}"""
out={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for name,mode in [('today',None),('new','sel'),('newmove','move')]:
        pg=b.new_page(viewport={'width':393,'height':665},device_scale_factor=2,has_touch=True,is_mobile=True)
        pg.goto('http://localhost:8102/index.html'); pg.wait_for_timeout(700)
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
        if mode:
            pg.add_style_tag(content=SLIM); pg.evaluate(REBUILD,mode); pg.wait_for_timeout(300)
        pg.evaluate("()=>{document.querySelector('#fieldscroll').scrollTop=0}"); pg.wait_for_timeout(300)
        r=pg.evaluate("""()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return [Math.round(b.top),Math.round(b.height)]};return {topbar:r('#topbar'),field:r('#fieldwrap'),unitbar:r('#unitbar'),actions:r('#actions')}}""")
        out[name]=r; pg.screenshot(path=f'm2_{name}.png'); pg.close()
    b.close()
print(json.dumps(out))
A=Image.open('m2_today.png'); N=Image.open('m2_new.png'); M=Image.open('m2_newmove.png')
def crop(im,r): return im.crop((0,r['unitbar'][0]*2,im.width,(r['unitbar'][0]+r['unitbar'][1])*2))
crops=[('Unit bar today (017): %d px'%out['today']['unitbar'][1],crop(A,out['today'])),('New, unit tapped: %d px'%out['new']['unitbar'][1],crop(N,out['new'])),('New, move previewed: same height',crop(M,out['newmove']))]
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',30)
W=40+A.width+40+N.width+40+A.width+40; H=130+A.height+40
c=Image.new('RGB',(W,H),'#f1f2ee'); d=ImageDraw.Draw(c)
rows=lambda r: round(r['field'][1]/59.1,1)
d.multiline_text((40,25),'Today (017 build)\nfield %d px · %.1f rows'%(out['today']['field'][1],rows(out['today'])),fill='#1f2421',font=f,spacing=10); c.paste(A,(40,130))
x=80+A.width
d.multiline_text((x,25),'B2 · buttons clear of the tag, new unit bar\nfield %d px · %.1f rows'%(out['new']['field'][1],rows(out['new'])),fill='#1f2421',font=f,spacing=10); c.paste(N,(x,130))
x+=N.width+40; y=130
for l,im in crops:
    d.text((x,y),l,fill='#1f2421',font=f); y+=50; c.paste(im,(x,y)); d.rectangle([x-1,y-1,x+im.width,y+im.height],outline='#b8beb6'); y+=im.height+50
c.save('phone_fit_B2.png'); print(c.size)
