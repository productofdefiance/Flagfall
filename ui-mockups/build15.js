process.env.SCEN='./scen.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');
const {S,C,mkGeom,field}=D;const {page,header,nav,sheet,unitLine,moveRow,routeRow,reasonRow,chipRow,msgRow,btn,U,PS}=G_;
const OUT=process.env.OUT||'./out/';const GP=mkGeom(26.71,8);const HDR=147;
S.units.find(u=>u.uid==='N-LA').warm=false;
const FIELD={neutral:true,pitch:true,arcR:3.25,goalR:1.25,lineCol:'#9ea693',lineOp:1,halo:true,routeArrow:true,flagPill:true,spearHatch:true};
const LM=U('N-LM'),SLR=U('S-LR');
const fw=o=>`<div style="flex: 1; position: relative; overflow: hidden; background: #d5dbd2; display: flex; justify-content: center">${field(GP,{...FIELD,...o})}</div>`;
const dis=(i,l,fl)=>btn(i,l,{disabled:true,flex:fl||1});
const turnRow=(endUnit)=>`<div style="display: flex; align-items: center; gap: 6px"><span style="writing-mode: vertical-rl; transform: rotate(180deg); font: 600 9px/1 ${PS}; letter-spacing: 0.1em; color: ${C.muted}">TURN</span>${btn('undo','Undo')}${btn('endunit','End unit')}${btn('endturn','End turn',{dark:true})}</div>`;
const navWith=(unitRow)=>`<nav aria-label="Actions" style="background: ${C.paper}; border-top: 1px solid ${C.line}; padding: 8px 10px 14px; display: flex; flex-direction: column; gap: 6px"><div style="display: flex; align-items: center; gap: 6px"><span style="writing-mode: vertical-rl; transform: rotate(180deg); font: 600 9px/1 ${PS}; letter-spacing: 0.1em; color: ${C.muted}">UNIT</span>${unitRow}</div>${turnRow()}</nav>`;
const boards=[];function ph(file,title,o,panel,pH){const h=Math.ceil(HDR+GP.HH+pH+8);fs.writeFileSync(OUT+file,page(title,390,h,header(9.5)+fw(o)+panel,844));boards.push({file,title,h});}
const evH=Object.keys(S.atk.evadeHexes);const hp0=SLR.hp;SLR.hp=1.5;
const lmAfter={...LM,stam:1.5};
// 1 evade: tapped after attack, evade hexes shown
ph('mv-r15-evade-tapped.dc.html','Round 15 · After an attack, the Light Melee can Evade: Evade hexes; under the HP bar only the Evade chip, total hexes allowed',{sel:LM.uid,evade:S.atk.evadeHexes},sheet(unitLine(LM,1.5,3)+chipRow([{icon:'evade',val:'3',label:'Evade up to 3 hexes'}]))+navWith(dis('attack','Attack',2)+dis('special','Special')+dis('brace','Brace')),92+140);
// 2 evade first tap G9
ph('mv-r15-evade-preview.dc.html','Round 15 · Evade, first tap on G9: route, arrow, ghost, Move button',{sel:LM.uid,evade:S.atk.evadeHexes,moveDim:true,route:['G11','G10','G9'],ghostAt:'G9',ghostCard:'LM',ghostTeam:'N'},sheet(unitLine(LM,1.5,3)+routeRow('G11','G9',[{icon:'evade',val:'3',label:'Evade, up to 3 hexes'}]))+nav(moveRow('1',0.5,3),true),92+140);
SLR.hp=hp0;
// 3 can't move
ph('mv-r15-cant-move.dc.html','Round 15 · A unit that can’t move: no move hexes, one line: No movement available this turn, Attack still live',{sel:LM.uid,targets:['G12']},sheet(unitLine(LM,1,3)+msgRow('No movement available this turn'))+navWith(btn('attack','Attack',{flex:2})+btn('special','Special')+btn('brace','Brace')),92+140);
fs.writeFileSync('boards15.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.h).join('\n'));
