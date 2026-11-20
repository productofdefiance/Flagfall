// Mobile match log, Round 2 (from Round 1) (UI chat, 19 Nov). Rows from a real Brain 5 7v7 game on v3.6 (seed mlog-0), snapshot at North turn 11. Run: OUT=dir/ node ml1.js
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
L.forEach((l,i)=>{if(l.kind==='turn'&&/turn \d+/.test(l.text)){cur={turn:l.turn,team:l.team,rows:[],cmdMax:+l.text.match(/: ([\d.]+) Command/)[1]};turns.push(cur);return;}if(!cur)return;const r=parse(l);if(r){r.raw=l.text;const x=d.extra[i];const ak=r.team+':'+r.a;r.stam=x.before[ak].stam-x.after[ak].stam;r.cmd=x.cmdSpent;r.aBr=x.before[ak].braced;r.aBrAfter=x.after[ak].braced;if(r.tg){const tk=foe(r.team)+':'+r.tg;r.hp0=x.before[tk].hp;r.hp1=x.after[tk].hp;r.tBr=x.before[tk].braced;}cur.rows.push(r);}});
// unit positions for move rows: actor hex = from; summary
const flagHP={N:10,S:10};const alive={N:7,S:7};
for(const T_ of turns){let outs=0,lost=0;const f0={...flagHP};T_.cmdUsed=T_.rows.reduce((a,r)=>a+r.cmd,0);
 for(const r of T_.rows){if(r.k==='attack'){if(r.out){outs++;alive[foe(r.team)]--;}if(r.parry&&r.parry[1]<=0){lost++;alive[r.team]--;}if(r.held){r.flag0=flagHP[foe(r.team)];flagHP[foe(r.team)]=r.flag;}}if(r.k==='pull'){r.flag0=flagHP[foe(r.team)];flagHP[foe(r.team)]=r.flag;}}
 T_.outs=outs;T_.lost=lost;T_.flag=f0[foe(T_.team)]!==flagHP[foe(T_.team)]?[foe(T_.team),f0[foe(T_.team)],flagHP[foe(T_.team)]]:null;}
S.flags={N:flagHP.N,S:flagHP.S};
// --- drawing
const ink=C.ink,mut=C.muted,ln='#dfe3dc';
const ring=(svg,on)=>on?`<span style="display: inline-flex; border-radius: 50%; box-shadow: 0 0 0 2px #ffffff, 0 0 0 4.5px ${C.brace}, 0 0 0 5.5px #ffffff">${svg}</span>`:svg;
const tok=(id,team,br)=>ring(tokenSvg(card(id),team,22),br);
const hexT=(h,flag)=>`<span style="display: inline-flex; align-items: center; gap: 2px; font: 600 13px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${ink}">${h}${flag?`<span role="img" aria-label="on the flag" style="display: inline-flex">${ic('flag',12,C.flag)}</span>`:''}</span>`;
const who=(id,team,h,br,flag)=>`<span style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap">${tok(id,team,br)}${hexT(h,flag)}</span>`;
const act=(icon,col,label)=>`<span role="img" aria-label="${label}" style="display: inline-flex; justify-content: center">${ic(icon,18,col||mut)}</span>`;
const pill=(t,o={})=>`<span style="display: inline-flex; align-items: center; gap: 3px; height: 18px; padding: 0 6px; border-radius: 9px; font: 700 10px/1 ${BC}; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; ${o.bg?`background: ${o.bg}; color: ${o.fg||'#fff'}`:`border: 1px solid ${o.bd||C.line}; color: ${o.fg||mut}`}">${t}</span>`;
const dieTag=n=>n===12?pill('Crit',{bg:ink}):n===2?pill('Glance',{bd:mut,fg:mut}):n===11?pill('+25%',{bg:ink}):n===3?pill('−25%',{bd:mut,fg:mut}):'';
const pip=`<span aria-hidden="true" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${ink}"></span>`;
const stamCell=v=>`<span role="img" aria-label="${fm(v)} Stamina" style="display: inline-flex; align-items: center; gap: 4px; font: 500 12px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${mut}">${pip}${fm(v)}</span>`;
const flagTok=team=>`<span role="img" aria-label="${NAME[team]} flag" style="display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 22px; border-radius: 11px; background: ${C.flag}">${ic('flag',14,'#fff')}</span>`;
const hpTxt=(a,b,out)=>`<span style="display: inline-flex; align-items: center; gap: 3px; font-variant-numeric: tabular-nums">${fm(a)}<span style="color: ${mut}">→</span>${out?`<span style="color: ${C.attack}; font-weight: 600">OUT</span>`:fm(Math.max(b,0))}</span>`;
const si=(icon,txt,col)=>`<span style="display: inline-flex; align-items: center; gap: 3px${col?`; color: ${col}`:''}">${ic(icon,13,col||mut)}${txt}</span>`;
const COLS='grid-template-columns: 82px 22px minmax(0, 1fr) 40px 72px';
function rowHtml(r,o={}){
 let A='',I='',Tg='',R='',subA='',subT='';
 if(r.k==='move'){A=who(r.a,r.team,r.from,r.aBr);I=act(r.evade?'evade':'move',mut,r.evade?'Evade':'Move');Tg=`${hexT(r.to)}${r.zoc?`<span role="img" aria-label="stopped by a Mark" style="display: inline-flex; margin-left: 6px">${ic('mark',15,ink)}</span>`:''}`;}
 if(r.k==='attack'){const hf=r.held;A=who(r.a,r.team,r.ah,r.aBr);I=act(r.reach?'spear':'attack',r.out?C.attack:ink,r.reach?'Reach':'Attack');Tg=who(r.tg,foe(r.team),r.th,r.tBr,hf);
  R=`${dieTag(r.die)}<span style="font: 600 17px/1 ${PS}; font-variant-numeric: tabular-nums; color: ${r.out?C.attack:ink}">−${fm(r.dmg)}</span>`;
  if(r.parry)subA=si('parry',`−${fm(r.parry[0])}`,C.attack);if(r.takes)subA+=si('move',r.takes);
  subT=hpTxt(r.hp0,r.hp1,r.out)+(hf?`<span style="margin-left: 10px">${si('flag',`${fm(r.flag0)} → ${fm(r.flag)}`,C.flag)}</span>`:'');}
 if(r.k==='pull'){A=who(r.a,r.team,r.ah,r.aBr);I=act('flag',C.flag,'Pull');Tg=flagTok(foe(r.team));R=`${dieTag(r.die)}<span style="font: 600 17px/1 ${PS}; color: ${C.flag}">−${fm(r.dmg)}</span>`;subT=si('flag',`${fm(r.flag0)} → ${fm(r.flag)}`,C.flag);}
 if(r.k==='brace'){A=who(r.a,r.team,r.ah,true);I=act('brace',C.brace,'Brace');}
 const edge=r.team==='N'?`left: 0`:`right: 0`;
 const sub=(subA||subT)?`<div style="display: grid; ${COLS}; column-gap: 8px; margin-top: 5px; font: 500 12px/1 ${PS}; color: ${ink}"><div style="display: flex; gap: 8px; padding-left: 28px">${subA}</div><div></div><div style="grid-column: 3 / 6; display: flex; align-items: center; padding-left: ${r.k==='pull'?0:28}px">${subT}</div></div>`:'';
 const exp=o.expand?`<div style="margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: ${C.paper}; font: 400 12px/1.45 ${PS}; color: ${ink}">${r.parts.replace(/, /g,' · ')} = <b>${fm(r.val)}</b> · dice ${r.die} → <b>${fm(r.dmg)}</b></div>`:'';
 return `<button type="button" aria-expanded="${o.expand?'true':'false'}" style="position: relative; display: block; width: 100%; box-sizing: border-box; min-height: 48px; padding: 11px 14px; border: 0; border-bottom: 1px solid ${ln}; background: ${o.expand?'#ffffff':C.card}; text-align: left; font: inherit"><span aria-hidden="true" style="position: absolute; top: 0; bottom: 0; ${edge}; width: 3px; background: ${LIGHT[r.team]}"></span><div style="display: grid; ${COLS}; column-gap: 8px; align-items: center"><div>${A}</div>${I}<div style="display: flex; align-items: center; min-width: 0">${Tg}</div><div>${stamCell(r.stam)}</div><div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px">${R}</div></div>${sub}${exp}</button>`;}
function divider(T_){const side=T_.team;const it=(i,t,c)=>`<span style="display: inline-flex; align-items: center; gap: 4px">${i}${t}</span>`;
 const cmdIc=`<span aria-hidden="true" style="width: 9px; height: 9px; border-radius: 2px; background: #f8f9f5"></span>`;
 const bits=[`<span role="img" aria-label="Command ${fm(T_.cmdUsed)} of ${T_.cmdMax} used" style="display: inline-flex; align-items: center; gap: 4px">${cmdIc}${fm(T_.cmdUsed)}/${T_.cmdMax}</span>`];
 if(T_.outs)bits.push(`<span role="img" aria-label="${T_.outs} enemy units out" style="display: inline-flex; align-items: center; gap: 3px">${ic('out',13,'#ff9a8a')}${T_.outs}</span>`);
 if(T_.lost)bits.push(`<span role="img" aria-label="${T_.lost} own units lost" style="display: inline-flex; align-items: center; gap: 3px">${ic('parry',13,'#ff9a8a')}${T_.lost}</span>`);
 if(T_.flag)bits.push(`<span role="img" aria-label="${NAME[T_.flag[0]]} flag ${fm(T_.flag[1])} to ${fm(T_.flag[2])}" style="display: inline-flex; align-items: center; gap: 4px">${ic('flag',13,LIGHT[T_.flag[0]])}${fm(T_.flag[1])} → ${fm(T_.flag[2])}</span>`);
 const rev=side==='S'?'flex-direction: row-reverse; ':'';
 return `<div role="heading" aria-level="3" aria-label="Turn ${T_.turn}, ${NAME[side]}" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 14px; background: ${ink}; color: #f8f9f5; ${rev}"><span style="display: inline-flex; align-items: center; gap: 8px; ${rev}"><span style="width: 10px; height: 10px; border-radius: 50%; background: ${LIGHT[side]}"></span><span style="font: 700 13px/1 ${BC}; letter-spacing: 0.12em">TURN ${T_.turn}</span></span><span style="display: inline-flex; align-items: center; gap: 12px; font: 500 12px/1 ${PS}; font-variant-numeric: tabular-nums; color: rgba(248,249,245,0.85); white-space: nowrap; ${rev}">${bits.join('')}</span></div>`;}
const fbtn=(icon,label,x,y,pressed)=>{const on=pressed===true;return `<button type="button" aria-label="${label}"${pressed!==undefined?` aria-pressed="${pressed}"`:''} style="position: absolute; left: ${x}px; top: ${y}px; width: 44px; height: 44px; box-sizing: border-box; border-radius: 10px; border: ${on?`2px solid ${ink}`:'1.5px solid #ffffff'}; background: ${on?'#f8f9f5':ink}; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: inline-flex; align-items: center; justify-content: center; padding: 0; z-index: 5">${ic(icon,20,on?ink:'#f8f9f5')}</button>`;};
const NAVH=140,VIS=844-HDR-NAVH;const o={turn:'11/35',dotsN:[alive.N,7],dotsS:[alive.S,7]};
const boards=[];
function logFrame(file,title,order,expandAt){
 const ts=[...turns].reverse();let body='';let n=0;
 for(const T_ of ts){body+=divider(T_);const rows=order==='newest'?[...T_.rows].reverse():T_.rows;for(const r of rows){body+=rowHtml(r,{expand:expandAt&&r===expandAt});n++;}}
 body+=`<div style="padding: 16px; text-align: center; font: 500 12px/1.4 ${PS}; color: ${mut}">Both sides deployed · North moves first</div>`;
 const list=`<section aria-label="Match log" style="position: relative; background: ${C.card}">${body}</section>`;
 // estimate height: render and let the page grow; we give generous height via measuring rows
 const est=ts.length*34+n*0+ts.reduce((s,T_)=>s+T_.rows.reduce((a,r)=>a+50+((r.k==='attack'||r.k==='pull')?20:0)+(r===expandAt?44:0),0),0)+50;
 const LH=Math.max(Math.ceil(est*1.12),VIS);const H=HDR+LH+NAVH;
 const by=HDR+38;
 const html=`<div style="position: relative; width: 390px; height: ${H}px; background: ${C.card}; display: flex; flex-direction: column"><div style="position: relative; z-index: 4">${header('N','none',o)}</div><div style="position: relative; flex: 1">${list}</div>${fbtn('hexfield','Show field',390-8-44,by,undefined)}${nav}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H,html,844));boards.push({file,title,w:390,h:H});}
// entry frame: field with the three buttons
function entry(file,title,side){const H=HDR+VIS+NAVH;const fy=HDR+VIS-64-44;
 const html=`<div style="position: relative; width: 390px; height: ${H}px; background: #d5dbd2; display: flex; flex-direction: column"><div style="position: relative; z-index: 4">${header(side||'N','edge',o).replace(/(NORTH|SOUTH) TO PLAY/,'$1 PLAYS')}</div><div style="flex: 1; position: relative; overflow: hidden; display: flex; justify-content: center">${field(GP,{...FIELD,centreNames:true})}</div>${fbtn('list','Show match log',390-8-44,HDR+38)}${fbtn('grid','Show hex names',390-8-44,fy-52,false)}${fbtn('zoomin','Zoom in',390-8-44,fy)}${nav}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H,html,844));boards.push({file,title,w:390,h:H});}
entry('ml-r2-field-north.dc.html','Round 2 · The way in, North to play: log button top right, under where South\'s tag hangs; hex names and zoom stay bottom right','N');
entry('ml-r2-field-south.dc.html','Round 2 · The way in, South to play: the log button sits clear under South\'s edge tag','S');
const exp=turns.find(t=>t.turn===10&&t.team==='N').rows.find(r=>r.k==='attack'&&r.parry);
logFrame('ml-r2-log.dc.html','Round 2 · The log (Option B order): columns for who, action, target, Stamina and result; HP from → to under the target, Parry under the attacker, flag in the hex; one row tapped open','play',exp);
fs.writeFileSync(OUT+'boardsML2.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.w+'x'+b.h).join('\n'));
console.log('alive',alive,'flags',flagHP);
