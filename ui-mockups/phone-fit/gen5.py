import json, re, os
from base import *
SER=re.search(r'SER="""(.*?)"""',open('gen.py').read(),re.S).group(1)
SER=SER.replace("walk(src,dst);","walk(src,dst);const fs=document.querySelector('#fieldscroll'),fd=dst.querySelector('#fieldscroll');if(fs&&fd&&fs.scrollTop){const sv=fd.querySelector('svg');sv.setAttribute('style',sv.getAttribute('style')+' margin-top: -'+fs.scrollTop+'px;')}")
CSS="""
.tb-title{position:absolute;top:calc(100% + 38px);left:8px;padding:0;z-index:6}
.tb-brand,.tb-rule{display:none}
.tb-options,.fbtn,#namesbtn{width:44px;height:44px;border-radius:10px;background:#1f2421!important;color:#f8f9f5!important;border:1.5px solid #fff!important;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center}
.fbtn{position:absolute;right:8px;z-index:6}
#namesbtn{top:auto!important;bottom:60px;right:8px;z-index:6}
.tb-board{padding:9px 16px 11px;gap:8px}
#keytab,.key-hint{display:none!important}
#unitbar{display:block;min-height:0;height:63px;box-sizing:border-box;padding:0 14px 9px}
#unitbar.idle{display:flex;align-items:center}
body.atk #unitbar{display:none}
#actions{padding:6px 10px 8px;gap:5px}
.act{height:48px}
.grab{width:36px;height:4px;border-radius:2px;background:#b8beb6;margin:5px auto 5px}
.g{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;row-gap:6px;align-items:center}
.l1{display:flex;align-items:center;gap:8px;height:22px;min-width:0}
.l1 .nm{font:700 17px/1 var(--display);letter-spacing:.02em;white-space:nowrap}
.l1 .ib{display:inline-flex;width:16px;height:16px;color:#5f6762}
.l1 .sp{flex:1}
.l1 .rchips{display:inline-flex;gap:5px;align-items:center;margin:0}
.l1 .rchip{display:inline-flex;align-items:center;gap:3px;height:17px;padding:0 7px;border-radius:8.5px;background:#1f2421;color:#fff;font:700 11px/1 var(--num)}
.l1 .rchip.red{background:#c62828}
.l1 .rchip svg{width:12px;height:12px}
.r1b{display:flex;gap:8px;justify-content:flex-end;align-items:center;font:600 13px/1 var(--num);height:22px}
.r1b .from{color:#5f6762}
.l2 .hpbar{width:100%!important}
.r2b{display:flex;gap:8px;align-items:center;justify-content:flex-end;font:600 13px/1 var(--num)}
.fo-stat svg{width:14px;height:14px}
.fo-num{font:600 12.5px/1 var(--num)!important;color:#5f6762!important}
.fo-row .sp4{flex:1}
.ob-k > div.kc{display:flex!important;align-items:center;gap:5px;flex-wrap:nowrap!important}
.brk{flex:1 1 0;min-width:5px;height:6px;border-bottom:1.3px solid #5f6762;transform:translateY(-3px);box-sizing:border-box}
.brk.l{border-left:1.3px solid #5f6762}.brk.r{border-right:1.3px solid #5f6762}
.kc.narrow{position:relative;overflow:visible;min-height:15px;justify-content:flex-start!important}
.kc.narrow .brk{flex:0 0 50%!important;border-left:0!important;height:9px;transform:translateY(-4.5px)}
.nar{position:absolute;right:100%;margin-right:5px;display:flex;gap:4px;top:50%;transform:translateY(-50%)}
.tag{position:absolute;left:0;top:0;z-index:6;background:#8fd0b4;color:#1f2421;font:700 12px/1 var(--display);letter-spacing:.12em;padding:6px 12px 7px 16px;border-radius:0 0 9px 0;box-shadow:0 3px 8px rgba(0,0,0,.18)}
"""
RB="""(opt)=>{const ub=document.querySelector('#unitbar');const fw=document.querySelector('#fieldwrap');
if(!document.querySelector('.fbtn')){fw.insertAdjacentHTML('beforeend',(opt.tag?'<div class="tag">NORTH PLAYS</div>':'')+'<div class="fbtn" style="top:38px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg></div><div class="fbtn" style="bottom:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><path d="M9 12h6"/></svg></div>')}
const sh=document.querySelector('#sheet');document.body.classList.toggle('atk',!!(sh&&!sh.hidden&&sh.classList.contains('preview')&&!sh.classList.contains('keysheet')));
if(sh&&!sh.hidden&&sh.querySelector('.fo')&&!sh.querySelector('.sp4')){sh.querySelectorAll('.fo-side').forEach(sd=>{const r1=sd.querySelector('.fo-row');const st=sd.querySelector('.fo-stats');const sp=document.createElement('span');sp.className='sp4';r1.appendChild(sp);if(st){const items=[...st.children];(sd.classList.contains('right')?items.reverse():items).forEach(x=>r1.appendChild(x));st.remove()}const n=sd.querySelector('.fo-name');n.textContent=n.textContent.trim().split(/\\s+/).map(w=>/^\\d+$/.test(w)?w:w[0]).join('')});
const k=sh.querySelector('.ob-k');if(k){const kc=k.lastElementChild;kc.classList.add('kc');kc.insertAdjacentHTML('afterbegin','<span class="brk l"></span>');kc.insertAdjacentHTML('beforeend','<span class="brk r"></span>');if(kc.scrollWidth>kc.clientWidth+1){const pills=[...kc.querySelectorAll('.kpill')];const w=document.createElement('span');w.className='nar';pills.forEach(p=>w.appendChild(p));kc.innerHTML='';kc.appendChild(w);kc.insertAdjacentHTML('beforeend','<span class="brk l r" style="flex:1 1 100%"></span>');kc.classList.add('narrow')}}}
const nm=ub.querySelector('.ub-name');if(!nm){ub.classList.add('idle');return 'idle'} ub.classList.remove('idle');
const tok=ub.querySelector('svg').cloneNode(true);tok.setAttribute('width',24);tok.setAttribute('height',24);tok.style.flexShrink=0;
const info=ub.querySelector('.ub-info svg').cloneNode(true);info.setAttribute('width',16);info.setAttribute('height',16);
const full=nm.innerText.trim();const ab=opt.full?full:full.split(/\\s+/).map(w=>/^\\d+$/.test(w)?w:w[0]).join('');
const hp=ub.querySelector('.hpbar').outerHTML,hpn=ub.querySelector('.num').innerText,sq=ub.querySelector('.sqs').outerHTML;
const rt=ub.querySelector('.ub-route.on');let chips='',right=ub.querySelector('.ub-right > div').innerHTML;
if(rt){chips=rt.querySelector('.rchips')?rt.querySelector('.rchips').outerHTML:'';const ar=rt.querySelector('svg').outerHTML;right='<span class="from">'+rt.querySelector('.rfrom').innerText+'</span>'+ar+'<span>'+rt.querySelector('.rto').innerText+'</span>'}
ub.innerHTML='<div class="grab"></div><div class="g"><div class="l1">'+tok.outerHTML+'<span class="nm">'+ab+'</span><span class="ib">'+info.outerHTML+'</span><span class="sp"></span>'+chips+'</div><div class="r1b">'+right+'</div><div class="l2">'+hp+'</div><div class="r2b"><span>'+hpn+'</span>'+sq+'</div></div>';return ab}"""
SETUP="""()=>{const G=GGShots,st=G.App.st,E=G.E,f=E.fieldOf(st);const u=id=>st.units.find(x=>x.uid===id);
const has=h=>f.CELLSET.has?f.CELLSET.has(h):!!f.CELLSET[h];
u('N-LR').hex='C9';u('S-LM').hex='B8';u('S-HM').hex='E11';
const col=has('G11')&&has('G9')?'G':'F'; if(col==='F'){u('S-HM').hex='D11'}
u('N-LM').hex=col+'9';u('S-LR').hex=col+'10';u('S-LR').hp=7;u('S-HA').hex=col+'11';u('S-HA').braced=true;
u('N-HM2').hex='D7';u('N-HA').hex='E7';u('N-LA').hex='F7';u('S-LA').hex='D12';u('S-HM2').hex='F12';
G.render();return col}"""
FR=[('pf-r5-attack',['tap:X9','tap:X10'],{},'Attack preview: smaller grey modifier numbers; a range of kill outcomes keeps its bracket'),
('pf-r5-attack-one',['hp12','tap:X9','tap:X10'],{},'Attack preview: one kill outcome gets a single connecting line')]
os.makedirs('canvas5/project',exist_ok=True); meta={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for name,steps,opt,title in FR:
        pg=start(b)
        for i in range(25):
            if pg.evaluate("()=>GGShots.App.st.toMove")=='N' and pg.evaluate("()=>GGShots.App.st.phase")=='play': break
            pg.wait_for_timeout(1000)
        col=pg.evaluate(SETUP)
        pg.add_style_tag(content=CSS); pg.evaluate(RB,opt); pg.wait_for_timeout(200)
        for s in steps:
            if s=='hp12': pg.evaluate("()=>{GGShots.App.st.units.find(x=>x.uid==='S-LR').hp=12;GGShots.render()}")
            elif s.startswith('tap:'): pg.evaluate("(h)=>GGShots.onBoardTap(h)",s[4:].replace('X',col))
            elif s=='info': pg.evaluate("()=>document.querySelector('.ub-info').click()")
            elif s=='move': pg.evaluate("""()=>{const G=GGShots,st=G.App.st,E=G.E;const o=E.options(st,'N-LR');const h=Object.keys(o.moves).find(h=>{const r=E.route(st,'N-LR',h);return r&&r.events.length>1});G.onBoardTap(h)}""")
            pg.wait_for_timeout(300)
        pg.evaluate(RB,opt); pg.wait_for_timeout(200)
        pg.evaluate("()=>{const f=document.querySelector('#fieldscroll');f.scrollTop=Math.round((f.scrollHeight-f.clientHeight)*0.43)}"); pg.wait_for_timeout(400)
        r=pg.evaluate("""()=>{const R=s=>{const e=document.querySelector(s);if(!e||e.hidden||getComputedStyle(e).display==='none')return [0,0];const b=e.getBoundingClientRect();return [Math.round(b.top),Math.round(b.height)]};const f=R('#fieldwrap'),s=R('#sheet');return {field:f,sheet:s,unitbar:R('#unitbar'),actions:R('#actions'),vis:s[1]?s[0]-f[0]:f[1]}}""")
        r['k']=pg.evaluate("""()=>{const sh=document.querySelector('#sheet');const d=sh.querySelector('.ob-d').getBoundingClientRect();const ps=[...sh.querySelectorAll('.kpill')].map(p=>p.getBoundingClientRect());const s=sh.getBoundingClientRect();const st=sh.querySelector('.fo-stat svg');const n=sh.querySelector('.fo-num');return {gapAbove:+(Math.min(...ps.map(p=>p.top))-d.bottom).toFixed(1),gapBelow:+(s.bottom-Math.max(...ps.map(p=>p.bottom))).toFixed(1),iconColor:getComputedStyle(st).color+'/'+getComputedStyle(st).stroke,numColor:getComputedStyle(n).color,numH:n.getBoundingClientRect().height}}""")
        meta[name]=dict(r,title=title)
        body=pg.evaluate(SER); assert '{{' not in body
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
        open(f'canvas5/project/{name}.dc.html','w').write(html); pg.close()
        h=html.replace('<script src="./support.js"></script>','').replace('<x-dc>','').replace('</x-dc>','').replace('<helmet>','').replace('</helmet>','')
        h=re.sub(r'<script type="text/x-dc".*?</script>','',h,flags=re.S); open(f'chk5_{name}.html','w').write(h)
        pg=b.new_page(viewport={'width':393,'height':665},device_scale_factor=1.5); pg.goto('file:///home/claude/work/chk5_'+name+'.html'); pg.wait_for_timeout(1000); pg.screenshot(path=f'chk5_{name}.png'); pg.close()
    b.close()
json.dump(meta,open('meta5.json','w'),indent=1); print(json.dumps(meta))
from PIL import Image
ims=[Image.open(f'chk5_{n}.png') for n,_,_,_ in FR]; W=sum(i.width for i in ims)+20*3; c=Image.new('RGB',(W,ims[0].height+40),'#f1f2ee'); x=20
for i in ims: c.paste(i,(x,20)); x+=i.width+20
c.save('chk5_all.png'); print(c.size)
