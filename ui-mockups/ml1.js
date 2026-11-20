// Mobile match log, Round 1 (UI chat, 19 Nov). Rows from a real Brain 5 7v7 game on v3.6 (seed mlog-0), snapshot at North turn 11. Run: OUT=dir/ node ml1.js
process.env.SCEN='./scen2.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');const T=require('./tc1.js');
const {S,C,ic,P,iconShape,field}=D;const {page,PS,BC,tokenSvg}=G_;const {header,nav,FIELD,GP,HDR,LIGHT,NAME}=T;
const OUT=process.env.OUT||'./out/';fs.mkdirSync(OUT,{recursive:true});
P.grid='<path d="M7 4l-3 5 3 5h6l3-5-3-5z"></path><path d="M13 14l3 5h4"></path>';
P.zoomin='<path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z"></path><path d="M8.5 12h7"></path><path d="M12 8.5v7"></path>';
P.list='<path d="M9 6h11"></path><path d="M9 12h11"></path><path d="M9 18h11"></path><path d="M4.5 6h.01"></path><path d="M4.5 12h.01"></path><path d="M4.5 18h.01"></path>';
P.hexfield='<path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4z"></path><path d="M12 8v8"></path><path d="M8.5 10l7 4"></path><path d="M15.5 10l-7 4"></path>';
P.parry='<path d="M5 4l11 11"></path><path d="M19 4 8 15"></path><path d="M13.5 16.5l3 3"></path><path d="M10.5 16.5l-3 3"></path><path d="M16 19.5l3-3"></path><path d="M8 19.5l-3-3"></path>';
P.out='<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>';
const d=JSON.parse(fs.readFileSync('./g0.json'));
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
for(const l of L){if(l.kind==='turn'&&/turn \d+/.test(l.text)){cur={turn:l.turn,team:l.team,rows:[]};turns.push(cur);continue;}if(!cur)continue;const r=parse(l);if(r){r.raw=l.text;cur.rows.push(r);}}
// unit positions for move rows: actor hex = from; summary
const flagHP={N:10,S:10};const alive={N:7,S:7};
for(const T_ of turns){let outs=0,lost=0;const f0={...flagHP};
 for(const r of T_.rows){if(r.k==='attack'){if(r.out){outs++;alive[foe(r.team)]--;}if(r.parry&&r.parry[1]<=0){lost++;alive[r.team]--;}if(r.held)flagHP[foe(r.team)]=r.flag;}if(r.k==='pull')flagHP[foe(r.team)]=r.flag;}
 T_.outs=outs;T_.lost=lost;T_.flag=f0[foe(T_.team)]!==flagHP[foe(T_.team)]?[foe(T_.team),f0[foe(T_.team)],flagHP[foe(T_.team)]]:null;}
S.flags={N:flagHP.N,S:flagHP.S};
// --- drawing
const ink=C.ink,mut=C.muted,ln='#dfe3dc';
const tok=(id,team,s=22)=>tokenSvg(card(id),team,s);
const hexT=h=>`<span style="font: 600 13px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${ink}">${h}</span>`;
const who=(id,team,h)=>`<span style="display: inline-flex; align-items: center; gap: 5px; white-space: nowrap">${tok(id,team)}${hexT(h)}</span>`;
const act=(icon,col)=>`<span style="display: inline-flex; flex-shrink: 0">${ic(icon,18,col||mut)}</span>`;
const pill=(t,o={})=>`<span style="display: inline-flex; align-items: center; gap: 3px; height: 18px; padding: 0 6px; border-radius: 9px; font: 700 10px/1 ${BC}; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; ${o.bg?`background: ${o.bg}; color: ${o.fg||'#fff'}`:`border: 1px solid ${o.bd||C.line}; color: ${o.fg||mut}`}">${o.icon?ic(o.icon,11,o.fg||'#fff'):''}${t}</span>`;
const dieTag=n=>n===12?pill('Crit',{bg:ink}):n===2?pill('Glance',{bd:mut,fg:mut}):n===11?pill('+25%',{bg:ink}):n===3?pill('−25%',{bd:mut,fg:mut}):'';
const flagChip=team=>`<span style="display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 7px; border-radius: 11px; background: ${C.flag}; color: #fff; font: 600 12px/1 ${PS}">${ic('flag',13,'#fff')}${NAME[team]}</span>`;
const sub=items=>items.length?`<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin: 5px 0 0 0; font: 400 12px/1.3 ${PS}; color: ${mut}">${items.join('')}</div>`:'';
const si=(icon,txt,col)=>`<span style="display: inline-flex; align-items: center; gap: 4px">${ic(icon,13,col||mut)}<span${col?` style="color: ${col}"`:''}>${txt}</span></span>`;
function rowHtml(r,o={}){
 let left='',right='',extra=[];
 if(r.k==='move'){left=`${who(r.a,r.team,r.from)}${act(r.evade?'evade':'move')}${hexT(r.to)}`;right=`<span style="font: 500 12px/1 ${PS}; color: ${mut}">${r.n} hex${r.n>1?'es':''}</span>`;if(r.evade)extra.push(si('evade','Evade'));if(r.zoc)extra.push(si('mark','Stopped by a Mark'));}
 if(r.k==='attack'){left=`${who(r.a,r.team,r.ah)}${act(r.reach?'spear':'attack',r.out?C.attack:ink)}${r.held?`${who(r.tg,foe(r.team),r.th)}`:who(r.tg,foe(r.team),r.th)}`;
  right=`<span style="display: inline-flex; align-items: center; gap: 6px">${dieTag(r.die)}<span style="font: 600 17px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${r.out?C.attack:ink}">−${fm(r.dmg)}</span></span>`;
  if(r.out)extra.push(`<span style="display: inline-flex">${pill('Out',{bg:C.attack,icon:'out'})}</span>`);else extra.push(`<span>HP ${fm(r.hp)}</span>`);
  if(r.held)extra.push(si('flag',`On the flag · pool ${fm(r.pool[0])} → ${fm(r.pool[1])} · flag ${fm(r.flag)}`,C.flag));
  if(r.takes)extra.push(si('move',`Takes ${r.takes}`));if(r.parry)extra.push(si('parry',`Parry −${fm(r.parry[0])} back · HP ${fm(r.parry[1])}`,C.attack));
  if(r.mayEvade)extra.push(si('evade','Can Evade'));}
 if(r.k==='pull'){left=`${who(r.a,r.team,r.ah)}${act('flag',C.flag)}${flagChip(foe(r.team))}`;right=`<span style="display: inline-flex; align-items: center; gap: 6px">${dieTag(r.die)}<span style="font: 600 17px/1 ${PS}; color: ${C.flag}">−${fm(r.dmg)}</span></span>`;extra.push(si('flag',`Flag ${fm(r.flag)} of ${r.max}`,C.flag));}
 if(r.k==='brace'){left=`${who(r.a,r.team,r.ah)}${act('brace',C.brace)}<span style="font: 500 13px/1 ${PS}; color: ${ink}">Braces</span>`;}
 const edge=r.team==='N'?`left: 0`:`right: 0`;
 const exp=o.expand?`<div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: ${C.paper}; font: 400 12px/1.45 ${PS}; color: ${ink}"><div style="font: 700 10px/1 ${BC}; letter-spacing: 0.1em; color: ${mut}; margin-bottom: 5px">HOW IT ADDED UP</div>${r.parts.replace(/, /g,' · ')} = <b>${fm(r.val)}</b><br>Dice ${r.die} → <b>${fm(r.dmg)}</b> damage${r.held?` · pool ${fm(r.pool[0])} → ${fm(r.pool[1])}`:''}</div>`:'';
 return `<button type="button" aria-expanded="${o.expand?'true':'false'}" style="position: relative; display: block; width: 100%; box-sizing: border-box; min-height: 48px; padding: 10px 14px 10px 14px; border: 0; border-bottom: 1px solid ${ln}; background: ${o.expand?'#ffffff':C.card}; text-align: left; font: inherit"><span aria-hidden="true" style="position: absolute; top: 0; bottom: 0; ${edge}; width: 3px; background: ${LIGHT[r.team]}"></span><div style="display: flex; align-items: center; justify-content: space-between; gap: 8px"><div style="display: flex; align-items: center; gap: 7px; min-width: 0">${left}</div>${right}</div>${sub(extra)}${exp}</button>`;}
function divider(T_){const bits=[`${T_.rows.length} action${T_.rows.length===1?'':'s'}`];if(T_.outs)bits.push(`${T_.outs} out`);if(T_.lost)bits.push(`${T_.lost} lost`);if(T_.flag)bits.push(`${NAME[T_.flag[0]]} flag ${fm(T_.flag[1])} → ${fm(T_.flag[2])}`);
 const side=T_.team;return `<div role="heading" aria-level="3" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 14px; background: ${ink}; color: #f8f9f5; ${side==='S'?'flex-direction: row-reverse; ':''}"><span style="display: inline-flex; align-items: center; gap: 8px; ${side==='S'?'flex-direction: row-reverse; ':''}"><span style="width: 10px; height: 10px; border-radius: 50%; background: ${LIGHT[side]}"></span><span style="font: 700 13px/1 ${BC}; letter-spacing: 0.12em">TURN ${T_.turn} · ${NAME[side].toUpperCase()}</span></span><span style="font: 500 12px/1 ${PS}; color: rgba(248,249,245,0.78); white-space: nowrap">${bits.join(' · ')}</span></div>`;}
const fbtn=(icon,label,x,y,pressed)=>{const on=pressed===true;return `<button type="button" aria-label="${label}"${pressed!==undefined?` aria-pressed="${pressed}"`:''} style="position: absolute; left: ${x}px; top: ${y}px; width: 44px; height: 44px; box-sizing: border-box; border-radius: 10px; border: ${on?`2px solid ${ink}`:'1.5px solid #ffffff'}; background: ${on?'#f8f9f5':ink}; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: inline-flex; align-items: center; justify-content: center; padding: 0; z-index: 5">${ic(icon,20,on?ink:'#f8f9f5')}</button>`;};
const NAVH=140,VIS=844-HDR-NAVH;const o={turn:'11/35',dotsN:[alive.N,7],dotsS:[alive.S,7]};
const boards=[];
function logFrame(file,title,order,expandAt){
 const ts=[...turns].reverse();let body='';let n=0;
 for(const T_ of ts){body+=divider(T_);const rows=order==='newest'?[...T_.rows].reverse():T_.rows;for(const r of rows){body+=rowHtml(r,{expand:expandAt&&r===expandAt});n++;}}
 body+=`<div style="padding: 16px; text-align: center; font: 500 12px/1.4 ${PS}; color: ${mut}">Both sides deployed · North moves first</div>`;
 const list=`<section aria-label="Match log" style="position: relative; background: ${C.card}">${body}</section>`;
 // estimate height: render and let the page grow; we give generous height via measuring rows
 const est=ts.length*34+n*0+ts.reduce((s,T_)=>s+T_.rows.reduce((a,r)=>a+48+(r.k==='move'&&!r.evade&&!r.zoc?0:22)+(r===expandAt?72:0),0),0)+50;
 const LH=Math.max(Math.ceil(est*1.12),VIS);const H=HDR+LH+NAVH;
 const by=HDR+VIS-64-44-104;
 const html=`<div style="position: relative; width: 390px; height: ${H}px; background: ${C.card}; display: flex; flex-direction: column"><div style="position: relative; z-index: 4">${header('N','none',o)}</div><div style="position: relative; flex: 1">${list}</div>${fbtn('hexfield','Show field',390-8-44,by,undefined)}${nav}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H,html,844));boards.push({file,title,w:390,h:H});}
// entry frame: field with the three buttons
function entry(file,title){const H=HDR+VIS+NAVH;const fy=HDR+VIS-64-44;
 const html=`<div style="position: relative; width: 390px; height: ${H}px; background: #d5dbd2; display: flex; flex-direction: column"><div style="position: relative; z-index: 4">${header('N','none',o)}</div><div style="flex: 1; position: relative; overflow: hidden; display: flex; justify-content: center">${field(GP,{...FIELD,centreNames:true})}</div>${fbtn('list','Show match log',390-8-44,fy-104)}${fbtn('grid','Show hex names',390-8-44,fy-52,false)}${fbtn('zoomin','Zoom in',390-8-44,fy)}${nav}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H,html,844));boards.push({file,title,w:390,h:H});}
entry('ml-r1-field.dc.html','Round 1 · The way in: a log button on top of the field buttons (bottom right, above hex names and zoom)');
const exp=turns.find(t=>t.turn===10&&t.team==='N').rows.find(r=>r.k==='attack'&&r.parry);
logFrame('ml-r1-a-newest.dc.html','Round 1 · Option A, newest at the top all the way down: turns newest first, actions in each turn newest first; one row tapped open to show how it added up','newest',exp);
logFrame('ml-r1-b-turns.dc.html','Round 1 · Option B, newest turn at the top, but each turn reads in play order (first action first)','play',null);
fs.writeFileSync(OUT+'boardsML.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.w+'x'+b.h).join('\n'));
console.log('alive',alive,'flags',flagHP);
