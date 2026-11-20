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
#unitbar{display:block;min-height:63px;box-sizing:border-box;padding:0 14px 9px}
#unitbar.raw{display:flex;padding:8px 14px}
#unitbar:not(.raw){height:63px}
.fo-row.r1{align-items:flex-end!important;gap:8px!important}
.idb{display:inline-flex;align-items:center;gap:6px;flex:none}
.fo-side.right .idb{flex-direction:row-reverse}
.idb .fo-name{overflow:visible!important;flex:none!important;max-width:none!important;white-space:nowrap}
.idb .ib{display:inline-flex;width:15px;height:15px;color:#5f6762}
.mods{flex:1 1 0;min-width:0;display:flex;flex-wrap:wrap-reverse;gap:4px 8px;justify-content:flex-end;align-items:center;transform:translateY(3px)}
.fo-side.right .mods{justify-content:flex-start}
.fo-stat{flex:none;white-space:nowrap}
.fo-old{font:600 12.5px/1 var(--num)!important;color:#5f6762!important;display:inline-block}
.fo-old::after{display:none!important}
.strike{position:absolute;left:-1px;right:-1px;top:50%;height:1.5px;background-color:#5f6762;transform:rotate(-28deg);display:block}
.fo-new{font:700 12.5px/1 var(--num)!important;color:#1f2421!important}
.ftok{width:22px;height:22px;border-radius:50%;background:#b07a33;color:#fff;display:inline-flex;align-items:center;justify-content:center;flex:none}
.wl{font:500 11.5px/1.2 var(--body);color:#5f6762;white-space:nowrap}
.kpill svg{flex:none}
#sheet.fullnames{padding-top:9px!important;gap:8px!important}
#sheet.fullnames .handle{display:none!important}
.strip{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;column-gap:8px;margin-top:3px;margin-bottom:-3px}
.sc{display:flex;justify-content:flex-start;min-width:0}
.sc.r{justify-content:flex-end}
.hbar{width:36px;height:4px;border-radius:2px;background:#b8beb6;flex:none}
.strip .idb .fo-name{font:700 14px/1 var(--display)!important}
#sheet.fullnames .fo-row.r1{min-height:14px}
#sheet.fullnames .mods{transform:none}
#sheet.fullnames .fo-side{gap:5px!important}
.sc.r .idb{flex-direction:row-reverse}
#sheet.fullnames .fo-mid{flex-direction:row!important;align-items:center!important;gap:3px!important;align-self:flex-end;height:12px;transform:translateY(-2.5px);font:500 10px/1 var(--num)!important;color:#5f6762;white-space:nowrap}
#sheet.fullnames .fo-mid svg{width:12px!important;height:12px!important;flex:none}
.co{font:500 10px/1 var(--num);color:#5f6762;flex:none}
.act span,.go-1,.go-2{white-space:nowrap!important}
.act.go .go-text{min-width:0}
.fo{align-items:flex-end!important}
.fo-num.mul{margin-left:4px}
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
RB=r"""(opt)=>{const ub=document.querySelector('#unitbar');const fw=document.querySelector('#fieldwrap');
if(!document.querySelector('.fbtn')){fw.insertAdjacentHTML('beforeend',(opt.tag?'<div class="tag">NORTH PLAYS</div>':'')+'<div class="fbtn" style="top:38px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg></div><div class="fbtn" style="bottom:8px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><path d="M9 12h6"/></svg></div>')}
const sh=document.querySelector('#sheet');const ab=t=>t.trim().split(/\s+/).map(w=>/^\d+$/.test(w)?w:w[0]).join('');
const infoSvg=()=>{const e=document.querySelector('.ub-info svg')||document.querySelector('.ib svg');if(!e)return window.__ic&&window.__ic.info||'';const c=e.cloneNode(true);c.setAttribute('width',15);c.setAttribute('height',15);return c.outerHTML};
window.__ic=window.__ic||{};
if(sh&&!sh.hidden&&sh.querySelector('.fo')&&!sh.querySelector('.idb')){const st=sh.querySelector('.fo-stat svg');if(st)window.__ic.str=st.outerHTML;window.__ic.arrow=sh.querySelector('.fo-mid svg').outerHTML;const ar=document.querySelector('#actions .arow');window.__ic.confirm=ar.innerHTML;window.__ic.info=infoSvg();}
if(sh&&!sh.hidden&&sh.querySelector('.dice')&&window.__ic.confirm){
 const title=sh.querySelector('div[style*="700 20px"]').childNodes[0].textContent.trim();const m=title.match(/^(\S+) pulls the (\S+) flag/);const hp=+sh.querySelector('.muted').textContent.replace(/\D+/g,'');
 const str=sh.querySelector('.calc b').textContent;const cells=[...sh.querySelectorAll('.dice > div')].map(d=>({p:d.querySelector('small').textContent.split('·').pop().trim(),v:+d.querySelector('b').textContent}));
 const G=GGShots,stt=G.App.st,u=stt.units.find(x=>x.uid===G.App.ui.sel),fl=G.E.fieldOf(stt).FLAG[u.team==='N'?'S':'N'];
 const tok=(ub.querySelector('svg')||document.createElement('span')).cloneNode(true);if(tok.setAttribute){tok.setAttribute('width',22);tok.setAttribute('height',22)}
 const flag='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V4M6 4h11l-3 4 3 4H6"/></svg>';
 const nk=cells.filter(c=>c.v<hp).length,k=cells.length-nk;const cols='grid-template-columns:repeat('+cells.length+', minmax(0, 1fr))';
 const shade=i=>'rgba(31,36,33,'+(0.25+0.125*i).toFixed(3)+')';
 sh.className='preview';document.querySelector('#scrim').hidden=true;
 sh.innerHTML='<button type="button" class="handle"><span></span></button><div class="fo"><div class="fo-side"><div class="fo-row">'+tok.outerHTML+'<span class="fo-name keep">'+((opt.full&&ub.querySelector('.ub-name'))?ub.querySelector('.ub-name').innerText.trim():m[1])+'</span></div><div class="fo-row"><span class="fo-hp">'+u.hp+'/'+u.maxHp+'</span><div class="fo-bar"><i style="width:'+(100*u.hp/u.maxHp)+'%;background:var(--'+(u.team==='N'?'north':'south')+');"></i></div></div><div class="fo-row fo-stats"><span class="fo-stat">'+window.__ic.str+'<span class="fo-num">'+str+'</span></span></div></div><div class="fo-mid"><span>'+u.hex+'</span>'+window.__ic.arrow+'<span>'+fl+'</span></div><div class="fo-side right noinfo"><div class="fo-row"><span class="ftok">'+flag+'</span><span class="fo-name">'+m[2]+' flag</span></div><div class="fo-row"><span class="fo-hp">'+hp+'/10</span><div class="fo-bar"><i style="width:'+(hp*10)+'%;background:#b07a33;margin-left:auto"></i></div></div></div></div>'
 +'<div class="ob"><div class="ob-row ob-p" style="'+cols+'">'+cells.map(c=>'<div>'+c.p+'</div>').join('')+'</div><div class="ob-row ob-bar" style="'+cols+'">'+cells.map((c,i)=>'<div class="'+(i==0?'first ':'')+(i==cells.length-1?'last':'')+'" style="background:'+(c.v>=hp?'var(--attack)':shade(i))+'"></div>').join('')+'</div><div class="ob-row ob-d" style="'+cols+'">'+cells.map(c=>'<div class="'+(c.v>=hp?'kill':'')+'">−'+c.v+'</div>').join('')+'</div>'
 +(k?'<div class="ob-row ob-k" style="'+cols+'">'+(nk?'<div style="grid-column:span '+nk+'"></div>':'')+'<div style="grid-column:span '+k+'"><span class="kpill hurt">'+flag+'&nbsp;Flag falls</span></div></div>':'')+'</div>';
 const ar=document.querySelector('#actions .arow');ar.innerHTML=window.__ic.confirm;ar.querySelector('.go-1').textContent='Pull';const bi=ar.querySelector('.act.go > svg');if(bi)bi.outerHTML=flag.replace('width="12" height="12"','width="22" height="22"').replace('2.4','1.9');
}
if(sh&&!sh.hidden&&sh.querySelector('.fo')&&!sh.querySelector('.idb')){sh.querySelectorAll('.fo-side').forEach(sd=>{const r1=sd.querySelector('.fo-row');r1.classList.add('r1');const st=sd.querySelector('.fo-stats');const n=sd.querySelector('.fo-name');if(!opt.full&&!sd.classList.contains('noinfo')&&!n.classList.contains('keep'))n.textContent=ab(n.textContent);
 const idb=document.createElement('span');idb.className='idb';[...r1.children].forEach(c=>idb.appendChild(c));if(!sd.classList.contains('noinfo'))idb.insertAdjacentHTML('beforeend','<span class="ib">'+infoSvg()+'</span>');r1.appendChild(idb);
 sd.querySelectorAll('.fo-old').forEach(o=>{if(!o.querySelector('.strike'))o.insertAdjacentHTML('beforeend','<i class="strike"></i>')});if(st){const os=st.querySelector('.fo-old');const mu=[...st.children].find(x=>/^×/.test(x.textContent.trim()));if(os&&mu){const stat=os.closest('.fo-stat');const ic=stat.querySelector('svg').outerHTML;stat.innerHTML=ic+'<span class="fo-num">'+os.textContent.trim()+'</span><span class="fo-num mul">'+mu.textContent.trim()+'</span>';mu.remove()}}const mods=document.createElement('span');mods.className='mods';if(st){[...st.children].forEach(x=>mods.appendChild(x));st.remove()}r1.appendChild(mods)});
if(opt.full){const ids=[...sh.querySelectorAll('.idb')];const strip=document.createElement('div');strip.className='strip';const c1=document.createElement('div');c1.className='sc';c1.appendChild(ids[0]);const c2=document.createElement('div');c2.className='sc r';c2.appendChild(ids[1]);strip.appendChild(c1);strip.insertAdjacentHTML('beforeend','<span class="hbar"></span>');strip.appendChild(c2);sh.insertBefore(strip,sh.firstChild);sh.classList.add('fullnames');}
const k=sh.querySelector('.ob-k');if(k){const kc=k.lastElementChild;kc.classList.add('kc');kc.insertAdjacentHTML('afterbegin','<span class="brk l"></span>');kc.insertAdjacentHTML('beforeend','<span class="brk r"></span>');if(kc.scrollWidth>kc.clientWidth+1){const pills=[...kc.querySelectorAll('.kpill')];const w=document.createElement('span');w.className='nar';pills.forEach(p=>w.appendChild(p));kc.innerHTML='';kc.appendChild(w);kc.insertAdjacentHTML('beforeend','<span class="brk l r" style="flex:1 1 100%"></span>');kc.classList.add('narrow')}}}
document.body.classList.toggle('atk',!!(sh&&!sh.hidden&&sh.classList.contains('preview')&&!sh.classList.contains('keysheet')));
const nm=ub.querySelector('.ub-name');
if(!nm){if(ub.querySelector('.g'))return 'done';const mu=ub.querySelector('.muted');if(mu&&/Tap one of your units/.test(mu.textContent)){mu.textContent='Tap a unit';ub.classList.add('idle')}else{ub.classList.add('raw')}return 'idle'}ub.classList.remove('raw');ub.classList.remove('idle');
const tok=ub.querySelector('svg').cloneNode(true);tok.setAttribute('width',24);tok.setAttribute('height',24);tok.style.flexShrink=0;
const info=ub.querySelector('.ub-info svg').cloneNode(true);info.setAttribute('width',16);info.setAttribute('height',16);
const full=nm.innerText.trim();const abn=opt.full?full:ab(full);
const hp=ub.querySelector('.hpbar').outerHTML,hpn=ub.querySelector('.num').innerText,sq=ub.querySelector('.sqs').outerHTML;
const rt=ub.querySelector('.ub-route.on');let chips='',right=ub.querySelector('.ub-right > div').innerHTML;
if(rt){chips=rt.querySelector('.rchips')?rt.querySelector('.rchips').outerHTML:'';const ar=rt.querySelector('svg').outerHTML;right='<span class="from">'+rt.querySelector('.rfrom').innerText+'</span>'+ar+'<span>'+rt.querySelector('.rto').innerText+'</span>'}
const warm=document.querySelector('#actions .warmline');if(warm){warm.remove();right='';chips='<span class="wl">'+(opt.full?'Fires next turn · no attack or brace':'Fires next turn. No attack or brace this turn.')+'</span>'}
ub.innerHTML='<div class="grab"></div><div class="g"><div class="l1">'+tok.outerHTML+'<span class="nm">'+abn+'</span><span class="ib">'+info.outerHTML+'</span><span class="sp"></span>'+chips+'</div><div class="r1b">'+right+'</div><div class="l2">'+hp+'</div><div class="r2b"><span>'+hpn+'</span>'+sq+'</div></div>';return abn}"""
SETUP="""()=>{const G=GGShots,st=G.App.st,E=G.E,f=E.fieldOf(st);const u=id=>st.units.find(x=>x.uid===id);
const has=h=>f.CELLSET.has?f.CELLSET.has(h):!!f.CELLSET[h];
u('N-LR').hex='C9';u('S-LM').hex='B8';u('S-HM').hex='E11';
const col=has('G11')&&has('G9')?'G':'F'; if(col==='F'){u('S-HM').hex='D11'}
u('N-LM').hex=col+'9';u('S-LR').hex=col+'10';u('S-LR').hp=7;u('S-HA').hex=col+'11';u('S-HA').braced=true;
u('N-HM2').hex='D7';u('N-HA').hex='E7';u('N-LA').hex='F7';u('S-LA').hex='D12';u('S-HM2').hex='F12';
G.render();return col}"""
A='Full names · '
FR=[('pf-r10-unit',['tap:C9'],{'full':1},A+'Unit tapped'),
('pf-r10-move',['tap:C9','move'],{'full':1},A+'Move previewed'),
('pf-r10-attack',['tap:X9','tap:X10'],{'full':1},A+'Attack preview: handle centred, coordinates between the bars'),
('pf-r10-attack-long',['long','tap:X9','tap:X10'],{'full':1},A+'Attack preview with the longest names'),
('pf-r10-special',['charge','tap:X9','special','tap:X10'],{'full':1},A+'Special fired'),
('pf-r10-pull',['tap:X9','tap:X10','harvest','pull'],{'full':1},A+'Pulling the flag'),
('pf-r10-warm',['tap:C9','special'],{'full':1},A+'Warming up: shorter note')]
os.makedirs('canvas10/project',exist_ok=True); meta={}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for name,steps,opt,title in FR:
        pg=start(b,deploy=bool(opt.get('deploy')))
        for i in range(0 if opt.get('deploy') else 25):
            if pg.evaluate("()=>GGShots.App.st.toMove")=='N' and pg.evaluate("()=>GGShots.App.st.phase")=='play': break
            pg.wait_for_timeout(1000)
        col='G' if opt.get('deploy') else pg.evaluate(SETUP)
        RAW=bool(opt.get('raw'))
        if not RAW: pg.add_style_tag(content=CSS); pg.evaluate(RB,opt); pg.wait_for_timeout(200)
        for s in steps:
            if s=='long': pg.evaluate("()=>{const st=GGShots.App.st;const u=id=>st.units.find(x=>x.uid===id);let a=u('N-LM'),b=u('N-HA'),t=a.hex;a.hex=b.hex;b.hex=t;a=u('S-LR');b=u('S-LA');t=a.hex;a.hex=b.hex;b.hex=t;u('S-HA').hex='A9';GGShots.render()}")
            elif s=='harvest': pg.evaluate(RB,opt); pg.evaluate("()=>GGShots.onBoardTap('A1')")
            elif s=='key': pg.evaluate("()=>document.querySelector('#sheet .handle').click()")
            elif s=='charge': pg.evaluate("()=>{GGShots.App.st.units.find(x=>x.uid==='N-LM').sp='charged';GGShots.render()}")
            elif s=='special': pg.evaluate("()=>{const b=[...document.querySelectorAll('#actions .act')][2]||null;const all=[...document.querySelectorAll('#actions .arow')][0].querySelectorAll('.act');const sp=[...all].find(a=>a.className.includes('sp-')||/Storm|Javelin|Arc|Special|Skewer|Hit/.test(a.innerText));(sp||b).click()}")
            elif s=='endturn': pg.evaluate("()=>{[...document.querySelectorAll('#actions .act')].find(a=>/End turn/.test(a.innerText)).click()}")
            elif s=='pull': pg.evaluate("()=>{const G=GGShots,st=G.App.st,E=G.E,f=E.fieldOf(st);const u=st.units.find(x=>x.uid==='N-HM2');const fl=f.FLAG.S;const holder=st.units.find(x=>x.hex===fl);const n=f.NBRS[fl].find(h=>!st.units.some(x=>x.hex===h));u.hex=n;G.render();G.onBoardTap(n);G.onBoardTap(fl)}")
            elif s=='hp12': pg.evaluate("()=>{GGShots.App.st.units.find(x=>x.uid==='S-LR').hp=12;GGShots.render()}")
            elif s.startswith('tap:'): pg.evaluate("(h)=>GGShots.onBoardTap(h)",s[4:].replace('X',col))
            elif s=='info': pg.evaluate("()=>document.querySelector('.ub-info').click()")
            elif s=='move': pg.evaluate("""()=>{const G=GGShots,st=G.App.st,E=G.E;const o=E.options(st,'N-LR');const h=Object.keys(o.moves).find(h=>{const r=E.route(st,'N-LR',h);return r&&r.events.length>1});G.onBoardTap(h)}""")
            pg.wait_for_timeout(300)
        if not RAW: pg.evaluate(RB,opt); pg.wait_for_timeout(200)
        pg.evaluate("()=>{const f=document.querySelector('#fieldscroll');f.scrollTop=Math.round((f.scrollHeight-f.clientHeight)*(document.querySelector('#sheet .fo')&&/E1[5-9]|→/.test('')?1:0.43))}"); pg.wait_for_timeout(400)
        r=pg.evaluate("""()=>{const R=s=>{const e=document.querySelector(s);if(!e||e.hidden||getComputedStyle(e).display==='none')return [0,0];const b=e.getBoundingClientRect();return [Math.round(b.top),Math.round(b.height)]};const f=R('#fieldwrap'),s=R('#sheet'),kt=R('#keytab');return {keytab:kt,field:f,sheet:s,unitbar:R('#unitbar'),actions:R('#actions'),vis:s[1]?s[0]-f[0]:f[1]}}""")
        r['k']=None
        if name=='pf-r10-attack': r['k']=pg.evaluate("""()=>{const sh=document.querySelector('#sheet');const d=sh.querySelector('.ob-d').getBoundingClientRect();const ps=[...sh.querySelectorAll('.kpill')].map(p=>p.getBoundingClientRect());const s=sh.getBoundingClientRect();const st=sh.querySelector('.fo-stat svg');const n=sh.querySelector('.fo-num');return {gapAbove:+(Math.min(...ps.map(p=>p.top))-d.bottom).toFixed(1),gapBelow:+(s.bottom-Math.max(...ps.map(p=>p.bottom))).toFixed(1),iconColor:getComputedStyle(st).color+'/'+getComputedStyle(st).stroke,numColor:getComputedStyle(n).color,numH:n.getBoundingClientRect().height}}""")
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
        open(f'canvas10/project/{name}.dc.html','w').write(html); pg.close()
        h=html.replace('<script src="./support.js"></script>','').replace('<x-dc>','').replace('</x-dc>','').replace('<helmet>','').replace('</helmet>','')
        h=re.sub(r'<script type="text/x-dc".*?</script>','',h,flags=re.S); open(f'chk10_{name}.html','w').write(h)
        pg=b.new_page(viewport={'width':393,'height':665},device_scale_factor=1.5); pg.goto('file:///home/claude/work/chk10_'+name+'.html'); pg.wait_for_timeout(1000); pg.screenshot(path=f'chk10_{name}.png'); pg.close()
    b.close()
json.dump(meta,open('meta10.json','w'),indent=1); print(json.dumps(meta))
from PIL import Image
ims=[Image.open(f'chk10_{n}.png') for n,_,_,_ in FR]; W=sum(i.width for i in ims)+20*8; c=Image.new('RGB',(W,ims[0].height+40),'#f1f2ee'); x=20
for i in ims: c.paste(i,(x,20)); x+=i.width+20
c.save('chk10_all.png'); print(c.size)
