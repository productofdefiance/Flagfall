// Mobile match log, Round 6 (pure math in the breakdown; distinct overtime colours) — from Round 5 (dice as the modifier only; overtime as dividers, settings bar untouched) — from Round 4 (settings bar, hexes moved, dice under the result, examples; from Round 3) (UI chat, 19 Nov). Rows from a real Brain 5 7v7 game on v3.6 (seed mlog-0), snapshot at North turn 11. Run: OUT=dir/ node ml1.js
process.env.SCEN='./scen2.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');const T=require('./tc1.js');
const {S,C,ic,P,iconShape,field}=D;const {page,PS,BC,tokenSvg}=G_;const {header,nav,FIELD,GP,HDR,LIGHT,NAME}=T;
const OUT=process.env.OUT||'./out/';fs.mkdirSync(OUT,{recursive:true});
P.grid='<path d="M7 4l-3 5 3 5h6l3-5-3-5z"></path><path d="M13 14l3 5h4"></path>';
P.zoomin='<path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z"></path><path d="M8.5 12h7"></path><path d="M12 8.5v7"></path>';
P.list='<path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path><path d="M4.5 6h.01"></path><path d="M4.5 12h.01"></path><path d="M4.5 18h.01"></path>';
P.hexfield='<path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z"></path><path d="M12 8v8"></path><path d="M8.5 10l7 4"></path><path d="M15.5 10l-7 4"></path>';
P.parry='<path d="M5 4l11 11"></path><path d="M19 4 8 15"></path><path d="M13.5 16.5l3 3"></path><path d="M10.5 16.5l-3 3"></path><path d="M16 19.5l3-3"></path><path d="M8 19.5l-3-3"></path>';
P.hexo='<path d="M12 3.5 19.4 7.75v8.5L12 20.5 4.6 16.25v-8.5z"></path>';
P.die='<rect x="4" y="4" width="16" height="16" rx="3.5"></rect><path d="M8.5 8.5h.01"></path><path d="M15.5 15.5h.01"></path><path d="M12 12h.01"></path>';
P.out='<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>';
const d=JSON.parse(fs.readFileSync('./g0x.json'));
const cut=d.log.findIndex(l=>l.kind==='turn'&&l.text.startsWith('North turn 11'));const L=d.log.slice(0,cut);
const card=id=>id.replace(/\d+$/,'');const foe=t=>t==='N'?'S':'N';
const num=s=>+s;const fm=v=>{v=Math.round(v*2)/2;return (v%1?v.toFixed(1):String(v));};
// parse
function parse(l){const t=l.team,x=l.text;let m;
 if(l.kind==='move'&&(m=x.match(/^(\w+) (\w+) → (\w+) \((\d+) hex/))){return{k:'move',team:t,a:m[1],from:m[2],to:m[3],n:+m[4],evade:/; evading/.test(x),zoc:/Zone of Control/.test(x)};}
 if(l.kind==='attack'&&(m=x.match(/^(\w+) \((\w+)\) attacks (\w+) \((\w+)(, holding the flag)?\): (.*?) = ([\d.]+); dice (\d+) → ([\d.]+) damage(.*?); (\w+) HP ([\d.]+)(.*)$/))){
  const r={k:'attack',team:t,a:m[1],ah:m[2],tg:m[3],th:m[4],held:!!m[5],parts:m[6],val:+m[7],die:+m[8],dmg:+m[9],hp:+m[12]};const rest=m[13];const pm=m[10].match(/pool ([\d.]+) → ([\d.]+); flag ([\d.]+) \+ \w+ ([\d.]+)/);
  if(pm){r.pool=[+pm[1],+pm[2]];r.flag=+pm[3];r.hp=+pm[4];}
  let q;if(q=rest.match(/parry deals ([\d.]+) \(\w+ HP ([\d.]+)\)/))r.parry=[+q[1],+q[2]];r.noparry=/no parry/.test(rest);r.out=/— \w+ REMOVED/.test(rest)&&!/parry deals [\d.]+ \(\w+ HP [\d.]+\) — /.test(rest.split('; parry')[0]?'':'');
  r.out=new RegExp('— '+r.tg+' REMOVED').test(rest);if(q=rest.match(/takes (\w+)/))r.takes=q[1];r.mayEvade=/may evade/.test(rest);r.reach=/Reach/.test(r.parts);return r;}
 if(l.kind==='pull'&&(m=x.match(/^(\w+) pulls at (\w+): (.*) = ([\d.]+); dice (\d+) → ([\d.]+); (North|South) flag HP ([\d.]+)\/(\d+)/)))return{k:'pull',team:t,a:m[1],ah:m[2],parts:m[3],val:+m[4],die:+m[5],dmg:+m[6],flag:+m[8],max:+m[9]};
 if(l.kind==='brace'&&(m=x.match(/^(\w+) braces at (\w+)/)))return{k:'brace',team:t,a:m[1],ah:m[2]};
 return null;}
// group into turns
const turns=[];let cur=null;
L.forEach((l,i)=>{if(l.kind==='turn'&&/turn \d+/.test(l.text)){cur={turn:l.turn,team:l.team,rows:[],cmdMax:+l.text.match(/: ([\d.]+) Command/)[1]};turns.push(cur);return;}if(!cur)return;const r=parse(l);if(r){r.raw=l.text;const x=d.extra[i];const ak=r.team+':'+r.a;r.stam=x.before[ak].stam-x.after[ak].stam;r.cmd=x.cmdSpent;r.aBr=x.before[ak].braced;r.ahp0=x.before[ak].hp;r.ahp1=x.after[ak].hp;r.aBrAfter=x.after[ak].braced;if(r.tg){const tk=foe(r.team)+':'+r.tg;r.hp0=x.before[tk].hp;r.hp1=x.after[tk].hp;r.tBr=x.before[tk].braced;}cur.rows.push(r);}});
// unit positions for move rows: actor hex = from; summary
const flagHP={N:10,S:10};const alive={N:7,S:7};
for(const T_ of turns){let outs=0,lost=0;const f0={...flagHP};T_.cmdUsed=T_.rows.reduce((a,r)=>a+r.cmd,0);
 for(const r of T_.rows){if(r.k==='attack'){if(r.out){outs++;alive[foe(r.team)]--;}if(r.parry&&r.parry[1]<=0){lost++;alive[r.team]--;}if(r.held){r.flag0=flagHP[foe(r.team)];flagHP[foe(r.team)]=r.flag;}}if(r.k==='pull'){r.flag0=flagHP[foe(r.team)];flagHP[foe(r.team)]=r.flag;}}
 T_.outs=outs;T_.lost=lost;T_.flag=f0[foe(T_.team)]!==flagHP[foe(T_.team)]?[foe(T_.team),f0[foe(T_.team)],flagHP[foe(T_.team)]]:null;}
S.flags={N:flagHP.N,S:flagHP.S};
// --- drawing
const ink=C.ink,mut=C.muted,ln='#dfe3dc';
const tok=(id,team,br)=>`<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" style="flex-shrink: 0; display: block">${br?`<circle cx="15" cy="15" r="13.4" fill="none" stroke="#ffffff" stroke-width="3.6"></circle><circle cx="15" cy="15" r="13.4" fill="none" stroke="${C.brace}" stroke-width="2.2"></circle>`:''}<circle cx="15" cy="15" r="11" fill="${D.tc(team)}"></circle>${iconShape(card(id),15,15,3.9,'#fff',2)}</svg>`;
const slot='<span aria-hidden="true" style="display: inline-block; width: 30px; flex-shrink: 0"></span>';
const holdIc=`<svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-label="on the flag" style="flex-shrink: 0"><path d="M12 2.5 20.2 7.25v9.5L12 21.5 3.8 16.75v-9.5z" fill="none" stroke="${C.flag}" stroke-width="2" stroke-linejoin="round"></path><path d="M10 16.5V8h5.5l-1.3 2 1.3 2H10" fill="none" stroke="${C.flag}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const hexT=(h,flag)=>`<span style="display: inline-flex; align-items: center; gap: 3px; font: 600 13px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${ink}">${h}${flag?holdIc:''}</span>`;
const who=(id,team,h,br,flag)=>`<span style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap">${tok(id,team,br)}${hexT(h,flag)}</span>`;
const act=(icon,col,label)=>`<span role="img" aria-label="${label}" style="display: inline-flex; justify-content: center">${ic(icon,18,col||mut)}</span>`;
const pill=(t,o={})=>`<span style="display: inline-flex; align-items: center; gap: 3px; height: 18px; padding: 0 6px; border-radius: 9px; font: 700 10px/1 ${BC}; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; ${o.bg?`background: ${o.bg}; color: ${o.fg||'#fff'}`:`border: 1px solid ${o.bd||C.line}; color: ${o.fg||mut}`}">${t}</span>`;
const dieMod=n=>n===2?-50:n===3?-25:n<=5?-10:n<=8?0:n<=10?10:n===11?25:50;
const dieTag=n=>'';
const diceCell=n=>{const m=dieMod(n);return m?`<span style="font: 600 12px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${m>0?ink:mut}">${m>0?'+':'−'}${Math.abs(m)}%</span>`:'';};
const multCell=x=>`<span role="img" aria-label="no dice, ${x} times" style="display: inline-flex; align-items: center; gap: 3px; font: 600 12px/1 ${PS}; color: ${C.gold}">${ic('special',12,C.gold)}${x}×</span>`;
const pip=`<span aria-hidden="true" style="display: inline-block; width: 9px; height: 9px; border-radius: 2px; background: ${ink}"></span>`;
const stamCell=v=>`<span role="img" aria-label="${fm(v)} Stamina" style="display: inline-flex; align-items: center; gap: 4px; font: 500 12px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${mut}">${pip}${fm(v)}</span>`;
const flagTok=team=>`<span role="img" aria-label="${NAME[team]} flag" style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 22px; flex-shrink: 0; border-radius: 11px; background: ${C.flag}">${ic('flag',14,'#fff')}</span>`;
const hpTxt=(a,b,out)=>`<span style="display: inline-flex; align-items: center; gap: 3px; font-variant-numeric: tabular-nums">${fm(a)}<span style="color: ${mut}">→</span>${out?`<span style="color: ${C.attack}; font-weight: 600">OUT</span>`:fm(Math.max(b,0))}</span>`;
const si=(icon,txt,col)=>`<span style="display: inline-flex; align-items: center; gap: 3px${col?`; color: ${col}`:''}">${ic(icon,13,col||mut)}${txt}</span>`;
const COLS='grid-template-columns: 92px 20px minmax(0, 1fr) 36px 72px';
const goldTok=(id,team,state)=>`<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" style="flex-shrink: 0; display: block"><circle cx="15" cy="15" r="13.4" fill="none" stroke="#ffffff" stroke-width="3.6"></circle><circle cx="15" cy="15" r="13.4" fill="none" stroke="${C.gold}" stroke-width="${state==='ready'?3:2}"${state==='warm'?' stroke-dasharray="3 2.4"':''}></circle><circle cx="15" cy="15" r="11" fill="${D.tc(team)}"></circle>${iconShape(card(id),15,15,3.9,'#fff',2)}</svg>`;
const whoG=(id,team,h,state,flag)=>`<span style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap">${goldTok(id,team,state)}${hexT(h,flag)}</span>`;
const dmgTxt=(v,col)=>`<span style="font: 600 17px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${col}">−${fm(v)}</span>`;
const hexes=n=>`<span role="img" aria-label="${n} hex${n>1?'es':''} moved" style="display: inline-flex; align-items: center; gap: 4px; font: 600 15px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${ink}">${ic('hexo',15,mut)}${n}</span>`;
const line=(c1,c3,c5,o={})=>`<div style="display: grid; ${COLS}; column-gap: 8px; align-items: center; margin-top: ${o.mt??5}px; font: 500 12px/1 ${PS}; color: ${ink}"><div style="display: flex; align-items: center; gap: 8px; padding-left: ${o.p1??36}px; white-space: nowrap">${c1||''}</div><div></div><div style="grid-column: 3 / 5; display: flex; align-items: center; padding-left: ${o.p3??36}px; white-space: nowrap">${c3||''}</div><div style="display: flex; justify-content: flex-end">${c5||''}</div></div>`;
function rowHtml(r,o={}){
 let A='',I='',Tg='',R='',subA='',subT='',subR='',more='';
 const tgt=(h)=>who(h.tg,foe(r.team),h.th,h.br,h.held);
 if(r.k==='move'){A=who(r.a,r.team,r.from,r.aBr);I=act(r.evade?'evade':'move',mut,r.evade?'Evade':'Move');Tg=`${slot}<span style="display: inline-flex; width: 6px"></span>${hexT(r.to)}${r.zoc?`<span role="img" aria-label="stopped by a Mark" style="display: inline-flex; margin-left: 6px">${ic('mark',15,ink)}</span>`:''}`;R=hexes(r.n);
  if(r.spear){subA=hpTxt(r.spear.hp0,r.spear.hp1,r.spear.hp1<=0);subT=`<span style="display: inline-flex; align-items: center; gap: 5px; color: ${mut}">${si('setspear','−2',C.attack)}<span>from</span>${tok(r.spear.by,foe(r.team),true).replace('width="30" height="30"','width="20" height="20"')}${hexT(r.spear.byh)}</span>`;}}
 if(r.k==='attack'){const hf=r.held;A=who(r.a,r.team,r.ah,r.aBr);I=act(r.reach?'spear':'attack',r.out?C.attack:ink,r.reach?'Reach':'Attack');Tg=who(r.tg,foe(r.team),r.th,r.tBr,hf);
  R=dmgTxt(r.dmg,r.out?C.attack:ink);subR=diceCell(r.die);
  subA=r.parry?hpTxt(r.ahp0,r.ahp1,r.ahp1<=0):`<span style="font-variant-numeric: tabular-nums">${fm(r.ahp1)}</span>`;if(r.parry)subA+=si('parry',`−${fm(r.parry[0])}`,C.attack);if(r.takes)subA+=si('move',r.takes);
  subT=hpTxt(r.hp0,r.hp1,r.out)+(hf?`<span style="margin-left: 10px">${si('flag',`${fm(r.flag0)} → ${fm(r.flag)}`,C.flag)}</span>`:'');}
 if(r.k==='pull'){A=who(r.a,r.team,r.ah,r.aBr);I=act('flag',C.flag,'Pull');Tg=flagTok(foe(r.team));R=dmgTxt(r.dmg,C.flag);subR=diceCell(r.die);subA=`<span style="font-variant-numeric: tabular-nums">${fm(r.ahp1)}</span>`;subT=si('flag',`${fm(r.flag0)} → ${fm(r.flag)}`,C.flag);}
 if(r.k==='brace'){A=who(r.a,r.team,r.ah,true);I=act('brace',C.brace,'Brace');}
 if(r.k==='warm'){A=whoG(r.a,r.team,r.ah,'warm');I=act('special',C.gold,'Warm up');Tg=`<span style="font: 600 13px/1 ${PS}; color: ${C.gold}">${r.name}</span>`;}
 if(r.k==='special'){const h0=r.hits[0];A=whoG(r.a,r.team,r.ah,'ready');I=act('special',C.gold,r.name);Tg=tgt(h0);R=dmgTxt(h0.dmg,h0.out?C.attack:C.gold);subR=multCell(h0.mult);
  subA=`<span style="font: 600 12px/1 ${PS}; color: ${C.gold}">${r.name}</span>`;subT=hpTxt(h0.hp0,h0.hp1,h0.out);
  for(const h of r.hits.slice(1)){more+=line('',`<span style="margin-left: -36px; display: inline-flex">${tgt(h)}</span>`,dmgTxt(h.dmg,h.out?C.attack:C.gold),{mt:10})+line('',hpTxt(h.hp0,h.hp1,h.out),multCell(h.mult));}}
 const edge=r.team==='N'?`left: 0`:`right: 0`;
 const sub=(subA||subT||subR)?line(subA,subT,subR,{p3:r.k==='pull'?0:36}):'';
 const exp=o.expand?`<div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: ${C.paper}; font: 400 12px/1.45 ${PS}; color: ${ink}">${r.parts.replace(/, /g,' · ')} = <b>${fm(r.val)}</b></div>`:'';
 return `<button type="button" aria-expanded="${o.expand?'true':'false'}" style="position: relative; display: block; width: 100%; box-sizing: border-box; min-height: 52px; padding: 10px 12px 10px 14px; border: 0; border-bottom: 1px solid ${ln}; background: ${o.expand?'#ffffff':C.card}; text-align: left; font: inherit"><span aria-hidden="true" style="position: absolute; top: 0; bottom: 0; ${edge}; width: 3px; background: ${LIGHT[r.team]}"></span><div style="display: grid; ${COLS}; column-gap: 8px; align-items: center; min-height: 30px"><div style="display: flex; align-items: center">${A}</div><div style="display: flex; align-items: center; justify-content: center">${I}</div><div style="display: flex; align-items: center; min-width: 0">${Tg}</div><div style="display: flex; align-items: center">${r.stam!=null?stamCell(r.stam):''}</div><div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px">${R}</div></div>${sub}${more}${exp}</button>`;}
function divider(T_){const side=T_.team;const it=(i,t,c)=>`<span style="display: inline-flex; align-items: center; gap: 4px">${i}${t}</span>`;
 const cmdIc=`<span aria-hidden="true" style="width: 9px; height: 9px; border-radius: 2px; background: #f8f9f5"></span>`;
 const bits=[`<span role="img" aria-label="Command ${fm(T_.cmdUsed)} of ${T_.cmdMax} used" style="display: inline-flex; align-items: center; gap: 4px">${cmdIc}${fm(T_.cmdUsed)}/${T_.cmdMax}</span>`];
 if(T_.outs)bits.push(`<span role="img" aria-label="${T_.outs} enemy units out" style="display: inline-flex; align-items: center; gap: 3px">${ic('out',13,'#ff9a8a')}${T_.outs}</span>`);
 if(T_.lost)bits.push(`<span role="img" aria-label="${T_.lost} own units lost" style="display: inline-flex; align-items: center; gap: 3px">${ic('parry',13,'#ff9a8a')}${T_.lost}</span>`);
 if(T_.flag)bits.push(`<span role="img" aria-label="${NAME[T_.flag[0]]} flag ${fm(T_.flag[1])} to ${fm(T_.flag[2])}" style="display: inline-flex; align-items: center; gap: 4px">${ic('flag',13,LIGHT[T_.flag[0]])}${fm(T_.flag[1])} → ${fm(T_.flag[2])}</span>`);
 const rev=side==='S'?'flex-direction: row-reverse; ':'';
 return `<div role="heading" aria-level="3" aria-label="Turn ${T_.turn}, ${NAME[side]}" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 14px; background: ${ink}; color: #f8f9f5; ${rev}"><span style="display: inline-flex; align-items: center; gap: 8px; ${rev}"><span style="width: 10px; height: 10px; border-radius: 50%; background: ${LIGHT[side]}"></span><span style="font: 700 13px/1 ${BC}; letter-spacing: 0.12em">TURN ${T_.turn}</span></span><span style="display: inline-flex; align-items: center; gap: 12px; font: 500 12px/1 ${PS}; font-variant-numeric: tabular-nums; color: rgba(248,249,245,0.85); white-space: nowrap; ${rev}">${bits.join('')}</span></div>`;}
const FLAGD='#8a5a1f';
const chip=(icon,txt,o={})=>`<span style="display: inline-flex; align-items: center; gap: 4px; font: ${o.big?`700 22px/1 ${BC}`:`500 12px/1 ${PS}`}; letter-spacing: ${o.big?'0.02em':'0'}; color: ${o.col||ink}; white-space: nowrap">${icon?ic(icon,o.big?18:13,o.icol||mut):''}${txt}</span>`;
const dotSide=t=>`<span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 50%; background: ${LIGHT[t]}; display: inline-block"></span>`;
const SET={kind:'match',fmt:'7v7',turns:'35 turns',vs:'vs Brain 5',vsIcon:'bot',first:'N',rules:'Rule set v3.6'};
function setBar(o){const base=`position: relative; height: 90px; flex-shrink: 0; border-bottom: 1px solid ${C.line}`;
 if(o.kind==='match')return `<div aria-label="Match settings" style="${base}; background: ${C.paper}"><div style="position: absolute; left: 14px; right: 66px; top: 33px; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; align-items: baseline; gap: 10px; white-space: nowrap">${chip('',o.fmt,{big:true})}<span style="font: 700 11px/1 ${BC}; letter-spacing: 0.12em; color: ${mut}">FOOT ONLY · RULES ${o.rules.replace('Rule set ','').toUpperCase()}</span></div><div style="display: flex; align-items: center; gap: 14px; white-space: nowrap">${chip('hourglass',o.turns)}${chip(o.vsIcon,o.vs)}<span style="display: inline-flex; align-items: center; gap: 5px; font: 500 12px/1 ${PS}; color: ${ink}">${dotSide(o.first)}${NAME[o.first]} first</span></div></div>${fbtn('hexfield','Show field',390-8-44,38,undefined)}</div>`;
 // overtime: the stage takes the bar
 return `<div aria-label="${o.title}" style="${base}; background: ${C.paper}"><span aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: ${o.band||FLAGD}"></span><div style="position: absolute; left: 14px; right: 66px; top: 33px; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; align-items: baseline; gap: 10px; white-space: nowrap">${chip('flag',o.title,{big:true,col:o.band||FLAGD,icol:o.band||FLAGD})}</div><div style="display: flex; align-items: center; gap: 14px; font: 500 12px/1 ${PS}; color: ${ink}; white-space: nowrap">${o.line}</div></div>${fbtn('hexfield','Show field',390-8-44,38,undefined)}</div>`;}
const fbtn=(icon,label,x,y,pressed)=>{const on=pressed===true;return `<button type="button" aria-label="${label}"${pressed!==undefined?` aria-pressed="${pressed}"`:''} style="position: absolute; left: ${x}px; top: ${y}px; width: 44px; height: 44px; box-sizing: border-box; border-radius: 10px; border: ${on?`2px solid ${ink}`:'1.5px solid #ffffff'}; background: ${on?'#f8f9f5':ink}; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: inline-flex; align-items: center; justify-content: center; padding: 0; z-index: 5">${ic(icon,20,on?ink:'#f8f9f5')}</button>`;};
const NAVH=140,VIS=844-HDR-NAVH;const o={turn:'11/35',dotsN:[alive.N,7],dotsS:[alive.S,7]};
const boards=[];
function logFrame(file,title,order,expandAt){
 const ts=[...turns].reverse();let body='';let n=0;
 for(const T_ of ts){body+=divider(T_);const rows=order==='newest'?[...T_.rows].reverse():T_.rows;for(const r of rows){body+=rowHtml(r,{expand:expandAt&&r===expandAt});n++;}}
 body+=`<div style="padding: 16px; text-align: center; font: 500 12px/1.4 ${PS}; color: ${mut}">Both sides deployed · North moves first</div>`;
 const list=`<section aria-label="Match log" style="position: relative; background: ${C.card}">${body}</section>`;
 // estimate height: render and let the page grow; we give generous height via measuring rows
 const est=ts.length*34+n*0+ts.reduce((s,T_)=>s+T_.rows.reduce((a,r)=>a+53+((r.k==='attack'||r.k==='pull')?20:0)+(r===expandAt?44:0),0),0)+50;
 const LH=Math.max(Math.ceil(est*1.12),VIS);const H=HDR+LH+NAVH;
 const by=HDR+38;
 const bar=setBar(SET);
 const html=`<div style="position: relative; width: 390px; height: ${H+90}px; background: ${C.card}; display: flex; flex-direction: column"><div style="position: relative; z-index: 4">${header('N','none',o)}</div>${bar}<div style="position: relative; flex: 1">${list}</div>${nav}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H+90,html,844));boards.push({file,title,w:390,h:H+90});}
// entry frame: field with the three buttons
function entry(file,title,side){const H=HDR+VIS+NAVH;const fy=HDR+VIS-64-44;
 const html=`<div style="position: relative; width: 390px; height: ${H}px; background: #d5dbd2; display: flex; flex-direction: column"><div style="position: relative; z-index: 4">${header(side||'N','edge',o).replace(/(NORTH|SOUTH) TO PLAY/,'$1 PLAYS')}</div><div style="flex: 1; position: relative; overflow: hidden; display: flex; justify-content: center">${field(GP,{...FIELD,centreNames:true})}</div>${fbtn('list','Show match log',390-8-44,HDR+38)}${fbtn('grid','Show hex names',390-8-44,fy-52,false)}${fbtn('zoomin','Zoom in',390-8-44,fy)}${nav}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H,html,844));boards.push({file,title,w:390,h:H});}
const exp=turns.find(t=>t.turn===10&&t.team==='N').rows.find(r=>r.k==='attack'&&r.parry);
logFrame('ml-r6-log.dc.html','Round 6 · The log: the tapped-open breakdown is the pure math (… = 4); what the roll changed stays under the damage','play',exp);
// ---- examples: pure examples, hand-made numbers
function exampleBoard(file,title,parts,H){const html=`<div style="width: 390px; min-height: ${H}px; background: ${C.card}; display: flex; flex-direction: column; gap: 0">${parts.join('')}</div>`;fs.writeFileSync(OUT+file,page(title,390,H,html));boards.push({file,title,w:390,h:H});}
const cap=t=>`<div style="padding: 14px 14px 8px; font: 700 11px/1.3 ${BC}; letter-spacing: 0.12em; color: ${mut}; background: ${C.paper}; border-top: 1px solid ${C.line}">${t}</div>`;
const T_=(turn,team,rows,cmd,extra)=>({turn,team,rows,cmdUsed:cmd,cmdMax:10,outs:extra&&extra.outs||0,lost:0,flag:extra&&extra.flag||null});
// specials
const sp=[
 cap('SPECIALS · WARM-UP (TURN BEFORE)'),
 rowHtml({k:'warm',team:'N',a:'LA',ah:'D9',name:'Javelin',stam:1}),
 cap('SPECIALS · FIRED, ONE TARGET (NO DICE: THE MULTIPLIER SITS WHERE THE DICE GO)'),
 rowHtml({k:'special',team:'N',a:'LA',ah:'D9',name:'Javelin',stam:1,hits:[{tg:'HR',th:'D12',hp0:14,hp1:4,dmg:10,mult:2}]}),
 cap('SPECIALS · FIRED, SEVERAL TARGETS (ARC HIT)'),
 rowHtml({k:'special',team:'S',a:'HM',ah:'F10',name:'Arc Hit',stam:1,hits:[{tg:'LM',th:'F9',hp0:16,hp1:8.5,dmg:7.5,mult:1},{tg:'LR',th:'E9',hp0:6,hp1:0,dmg:7,mult:1,out:true},{tg:'HA',th:'G9',hp0:18,hp1:11,dmg:7,mult:1,br:true}]}),
 cap('SPECIALS · SKEWER, THE UNIT BEHIND TAKES A FULL HIT'),
 rowHtml({k:'special',team:'N',a:'HA',ah:'E8',name:'Skewer',stam:1,hits:[{tg:'HM',th:'E9',hp0:20,hp1:15,dmg:5,mult:1},{tg:'LR',th:'E10',hp0:12,hp1:5,dmg:7,mult:1}]}),
 cap('SET SPEAR · A MOVE THAT ARRIVES NEXT TO A BRACED HEAVY ANTI-CAVALRY'),
 rowHtml({k:'move',team:'N',a:'LM',from:'C9',to:'D11',n:2,stam:1,aBr:false,spear:{hp0:16,hp1:14,by:'HA',byh:'D12'}}),
 rowHtml({k:'move',team:'N',a:'LR',from:'F8',to:'E11',n:3,stam:1.5,aBr:false,spear:{hp0:1.5,hp1:0,by:'HA',byh:'D12'}}),
];
if(0)exampleBoard('ml-r5-ex-specials.dc.html','Round 5 · Examples (made-up numbers), unchanged from Round 4: special damage is gold, and red when it puts a unit out',sp,1020);
// overtime
const band=(col,left,right,fg)=>`<div role="heading" aria-level="3" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; background: ${col}; color: ${fg||'#fff'}"><span style="display: inline-flex; align-items: center; gap: 8px; font: 700 13px/1 ${BC}; letter-spacing: 0.12em; white-space: nowrap">${ic('flag',14,fg||'#fff')}${left}</span><span style="display: inline-flex; align-items: center; gap: 10px; font: 500 12px/1 ${PS}; white-space: nowrap">${right}</span></div>`;
const fl=(t,v)=>`<span style="display: inline-flex; align-items: center; gap: 4px">${ic('flag',13,LIGHT[t])}${v}</span>`;
const note=(t,col)=>`<div style="padding: 9px 14px; background: #fff; border-bottom: 1px solid ${ln}; display: flex; align-items: center; gap: 8px; font: 600 12px/1 ${PS}; color: ${col||FLAGD}">${ic('flag',13,col||FLAGD)}${t}</div>`;
const ot=[
 cap('THE BAR STAYS THE MATCH SETTINGS ALL MATCH'),
 setBar(SET),
 cap('END OF REGULATION'),
 band(ink,'END OF REGULATION · TURN 35',`${fl('N','10')}${fl('S','10')}<span style="color: rgba(255,255,255,0.8)">level</span>`),
 cap('GOLDEN FLAG STARTS'),
 band(FLAGD,'GOLDEN FLAG',`<span>14 turns each</span><span style="display: inline-flex; align-items: center; gap: 5px">${dotSide('S')}South first</span>`),
 divider(T_(1,'S',[{},{}],5,null)),
 cap('FLAG OFF STARTS, THEN EACH ROUND AND ATTEMPT TURN'),
 band('#1f4673','FLAG OFF',`<span>3 rounds · 3 defend, 4 attack</span>`),
 band('#d6e1ee','ROUND 2',`<span style="display: inline-flex; align-items: center; gap: 5px">${dotSide('N')}North attacks</span><span style="display: inline-flex; align-items: center; gap: 4px">${ic('flag',13,C.north)}3</span><span style="display: inline-flex; align-items: center; gap: 4px">${ic('flag',13,C.south)}0</span>`,'#1f4673'),
 divider(T_(2,'N',[{},{},{}],3,{flag:['S',10,7]})).replace('TURN 2','ATTEMPT TURN 2'),
 rowHtml({k:'pull',team:'N',a:'HM',ah:'E16',die:7,dmg:3,flag0:10,flag:7,max:10,stam:1,ahp1:20}),
 note('Attempt over: flag damage done','#1f4673'),
 cap('SUDDEN DEATH'),
 band('#4b2d6b','SUDDEN DEATH · ROUND 4',`<span style="display: inline-flex; align-items: center; gap: 5px">${dotSide('S')}South attacks first</span>`),
 cap('THE END OF A MATCH'),
 `<div role="heading" aria-level="3" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px 14px; background: ${ink}; color: #f8f9f5"><span style="width: 10px; height: 10px; border-radius: 50%; background: ${LIGHT.N}"></span><span style="font: 700 16px/1 ${BC}; letter-spacing: 0.14em">NORTH WINS · FLAG OFF</span><span style="font: 500 12px/1 ${PS}; color: rgba(248,249,245,0.78)">round 4</span></div>`,
];
exampleBoard('ml-r6-ex-overtime.dc.html','Round 6 · Examples (made-up numbers): each overtime stage its own colour: regulation ink, Golden Flag bronze, Flag Off navy (rounds a light navy band), sudden death violet',ot,900);
fs.writeFileSync(OUT+'boardsML5.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.w+'x'+b.h).join('\n'));
