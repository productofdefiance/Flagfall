// Turn-change cue, Round 1 (UI chat, 19 Nov). Phone first. Run: OUT=dir/ node tc1.js
process.env.SCEN='./scen2.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');
const {S,C,mkGeom,field,ic}=D;const {page,BC,PS}=G_;const PM=PS;
const OUT=process.env.OUT||'./out/';fs.mkdirSync(OUT,{recursive:true});
const GP=mkGeom(26.71,8);const HDR=147;
const LIGHT={N:C.mint,S:C.coral},NAME={N:'North',S:'South'};
const FIELD={foeRing:'S',neutral:true,pitch:true,arcR:3.25,goalR:1.25,lineCol:'#9ea693',lineOp:1,halo:true,flagPill:true};
const dots=(n,on,col)=>Array.from({length:n},(_,i)=>`<span style="width: 6px; height: 6px; border-radius: 50%; background: ${i<on?col:'transparent'}; border: 1px solid ${col}; box-sizing: border-box"></span>`).join('');
const squares=v=>Array.from({length:10},(_,i)=>`<span style="width: 11px; height: 11px; border-radius: 2px; background: ${i<v?'#f8f9f5':'rgba(248,249,245,0.25)'}"></span>`).join('');
// cue: {style:'tab'|'band'|'edge'|'none'}
function cueHtml(side,style,verb){
 const t=`${NAME[side]} to ${verb||'play'}`.toUpperCase();
 const txt=`font: 700 12px/1 ${BC}; letter-spacing: 0.12em; color: ${C.ink}; white-space: nowrap`;
 const half=side==='N'?'left: 0':'right: 0';
 if(style==='tab')return `<div role="status" style="position: absolute; top: 100%; ${half}; width: 50%; display: flex; justify-content: center; z-index: 4; pointer-events: none"><div style="background: ${LIGHT[side]}; border-radius: 0 0 9px 9px; padding: 6px 14px 7px; box-shadow: 0 3px 8px rgba(0,0,0,0.18); ${txt}">${t}</div></div>`;
 if(style==='band')return `<div role="status" style="position: absolute; top: calc(100% - 3px); ${half}; width: 50%; height: 25px; background: ${LIGHT[side]}; display: flex; align-items: center; justify-content: center; z-index: 4; box-shadow: 0 3px 8px rgba(0,0,0,0.18); ${txt}">${t}</div>`;
 if(style==='edge'){const corner=side==='N'?'0 0 9px 0':'0 0 0 9px';return `<div role="status" style="position: absolute; top: 100%; ${half}; z-index: 4; background: ${LIGHT[side]}; border-radius: ${corner}; padding: 6px 12px 7px 16px; box-shadow: 0 3px 8px rgba(0,0,0,0.18); ${txt}">${t}</div>`;}
 return '';}
function header(side,style,o={}){
 const op=t=>t===side?1:0.55;
 const brand=`<div style="background: ${C.ink}; padding: 8px 12px 0 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0"><span style="font: 700 20px/1 ${BC}; letter-spacing: 0.04em; color: #f8f9f5">FLAGFALL<span style="font-weight: 500">: Arena</span></span><button type="button" aria-label="Options" style="width: 44px; height: 44px; border-radius: 10px; border: 1px solid rgba(248,249,245,0.25); background: rgba(248,249,245,0.08); display: inline-flex; align-items: center; justify-content: center; padding: 0">${ic('menu',22,'#f8f9f5')}</button></div><div style="background: ${C.ink}; padding: 0 16px; flex-shrink: 0"><div style="height: 1px; background: rgba(248,249,245,0.15); margin-top: 8px"></div></div>`;
 const name=(t)=>`<div style="display: flex; align-items: center; gap: 5px; ${t==='S'?'justify-content: flex-end; ':''}font: 700 12px/1 ${BC}; letter-spacing: 0.12em; text-transform: uppercase; color: ${LIGHT[t]}; opacity: ${op(t)}">${t==='S'?NAME[t]:''}<span role="img" aria-label="Player" style="display: inline-flex">${ic('person',15,LIGHT[t])}</span>${t==='N'?NAME[t]:''}</div>`;
 const centre=o.deploy?`<div style="font: 700 12px/1 ${BC}; letter-spacing: 0.14em; color: #f8f9f5; opacity: 0.8">DEPLOY</div>`:`<div role="img" aria-label="Command 10 of 10" style="display: flex; gap: 4px">${squares(10)}</div>`;
 const sb=`<header style="position: relative; z-index: 3; background: ${C.ink}; color: #f8f9f5; padding: 10px 16px 13px; display: flex; flex-direction: column; gap: 9px; flex-shrink: 0">
<div style="display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 10px">${name('N')}<div style="display: inline-flex; align-items: center; gap: 4px; font: 600 12px/1 ${PM}; opacity: 0.8">${ic('hourglass',13,'#f8f9f5')}${o.turn||(o.deploy?'0/35':'12/35')}</div>${name('S')}</div>
<div style="display: flex; align-items: center; gap: 10px"><div style="display: flex; align-items: center; gap: 6px; font: 600 22px/1 ${PM}; opacity: ${op('N')}">${ic('flag',18,LIGHT.N)}${S.flags.N}</div><div style="flex: 1; position: relative; height: 10px; border-radius: 5px; background: linear-gradient(to right, ${C.north} 0%, ${C.north} 50%, ${C.south} 50%, ${C.south} 100%)"><div style="position: absolute; left: 50%; top: 50%; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: #f8f9f5; border: 2px solid ${C.ink}; box-sizing: border-box"></div></div><div style="display: flex; align-items: center; gap: 6px; font: 600 22px/1 ${PM}; opacity: ${op('S')}">${S.flags.S}<span style="display: inline-flex; transform: scaleX(-1)">${ic('flag',18,LIGHT.S)}</span></div></div>
<div style="display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 10px"><div style="display: flex; gap: 3px">${dots(...(o.dotsN||[7,7]),C.mint)}</div>${centre}<div style="display: flex; gap: 3px; justify-content: flex-end">${dots(...(o.dotsS||[7,7]),C.coral)}</div></div>
<div role="img" aria-label="${NAME[side]} to move" style="position: absolute; bottom: 0; ${side==='N'?'left':'right'}: 0; width: 50%; height: 3px; background: ${LIGHT[side]}"></div>${cueHtml(side,style,o.verb)}</header>`;
 return brand+sb;}
const dis=(icon,label,flex)=>G_.btn(icon,label,{disabled:true,flex:flex||1});
const rl=t=>`<span style="writing-mode: vertical-rl; transform: rotate(180deg); font: 600 9px/1 ${PS}; letter-spacing: 0.1em; color: ${C.muted}">${t}</span>`;
const nav=`<nav aria-label="Actions" style="background: ${C.paper}; border-top: 1px solid ${C.line}; padding: 8px 10px 14px; display: flex; flex-direction: column; gap: 6px; flex-shrink: 0"><div style="display: flex; align-items: center; gap: 6px">${rl('UNIT')}${dis('attack','Attack',2)}${dis('special','Special')}${dis('brace','Brace')}</div><div style="display: flex; align-items: center; gap: 6px">${rl('TURN')}${G_.btn('undo','Undo',{disabled:true})}${dis('endunit','End unit')}${G_.btn('endturn','End turn',{dark:true})}</div></nav>`;
const fw=`<div style="flex: 1; position: relative; overflow: hidden; background: #d5dbd2; display: flex; justify-content: center">${field(GP,FIELD)}</div>`;
module.exports={header,nav,FIELD,GP,HDR,LIGHT,NAME};
if(require.main===module){
const boards=[];
function ph(file,title,side,style,o){const h=Math.ceil(HDR+GP.HH+140+8);fs.writeFileSync(OUT+file,page(title,390,h,header(side,style,o||{})+fw+nav,844));boards.push({file,title,w:390,h});}
ph('tc-r1-a-tab.dc.html','Round 1 · Option A, tab: "South to play" hangs under South\'s half of the scoreboard','S','tab');
ph('tc-r1-b-band.dc.html','Round 1 · Option B, band: South\'s underline grows into a half-width band with the words','S','band');
ph('tc-r1-c-edge.dc.html','Round 1 · Option C, edge tag: a tag tucked at South\'s outer edge, under its flag number','S','edge');
ph('tc-r1-a-north.dc.html','Round 1 · Option A, mirrored: North to play','N','tab');
ph('tc-r1-a-tucked.dc.html','Round 1 · Any option after South\'s first tap: the cue tucks back into the underline','S','none');
fs.writeFileSync(OUT+'boards.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.h).join('\n'));
}
