process.env.SCEN='./scen2.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');
const {S,C,mkGeom,field,icG,iconShape,hexPts}=D;const {page,header,nav,sheet,unitLine,U,BC,PS}=G_;
const OUT=process.env.OUT||'./out/';const GP=mkGeom(26.71,8),GD=mkGeom(28,8);const HDR=147;
S.units.find(u=>u.uid==='N-LA').warm=false;
const FIELD={foeRing:'S',neutral:true,pitch:true,arcR:3.25,goalR:1.25,lineCol:'#9ea693',lineOp:1,halo:true,flagPill:true,threatTicks:true,foeDouble:true,foeSolid:true,spearHatch:true,bracedLast:['N-HM']};
const SHR=U('S-HR'),SLA=U('S-LA');
const ST={
 hr:{enemySel:SHR.uid,enemyMoves:S.eHR.moves,enemyRange:S.eHR.range,threats:S.eHR.hits},
 laReady:{enemySel:SLA.uid,enemyMoves:S.eLA.moves,enemySpokes:S.eLA.reach,enemyGold:S.eLA.jav,threats:S.eLA.hits,warmStates:{'S-LA':'charged'}},
 laWarm:{enemySel:SLA.uid,enemyMoves:S.eLA.moves,enemySpokes:S.eLA.reach,threats:[],warmStates:{'S-LA':'warming'}}};
for(const k in ST)ST[k]={...FIELD,...ST[k]};
const fw=(G,o)=>`<div style="flex: 1; position: relative; overflow: hidden; background: #d5dbd2; display: flex; justify-content: center">${field(G,o)}</div>`;
const boards=[];function ph(file,title,k,panel,pH){const h=Math.ceil(HDR+GP.HH+pH+8);fs.writeFileSync(OUT+file,page(title,390,h,header(9.5)+fw(GP,ST[k])+panel,844));boards.push({file,title,w:390,h});}
const dis=(icon,label,flex)=>G_.btn(icon,label,{disabled:true,flex:flex||1});
const greyNav=(reach,toast,undoOn=true)=>`<div style="position: relative">${toast?`<div role="status" style="position: absolute; left: 50%; top: -40px; transform: translateX(-50%); white-space: nowrap; background: ${C.ink}; color: #fff; font: 500 13px/1 ${PS}; padding: 9px 14px; border-radius: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.2); z-index: 5">Pick one of your own units</div>`:''}<nav aria-label="Actions" style="background: ${C.paper}; border-top: 1px solid ${C.line}; padding: 8px 10px 14px; display: flex; flex-direction: column; gap: 6px"><div style="display: flex; align-items: center; gap: 6px"><span style="writing-mode: vertical-rl; transform: rotate(180deg); font: 600 9px/1 ${PS}; letter-spacing: 0.1em; color: ${C.muted}">UNIT</span>${reach?dis('attack','Attack')+dis('spear','Reach'):dis('attack','Attack',2)}${dis('special','Special')}${dis('brace','Brace')}</div><div style="display: flex; align-items: center; gap: 6px"><span style="writing-mode: vertical-rl; transform: rotate(180deg); font: 600 9px/1 ${PS}; letter-spacing: 0.1em; color: ${C.muted}">TURN</span>${G_.btn('undo','Undo',{disabled:!undoOn})}${dis('endunit','End unit')}${G_.btn('endturn','End turn',{dark:true})}</div></nav></div>`;
const ep=(u,st,reach,toast)=>sheet(unitLine(u,st,3,'Next turn'))+greyNav(reach,toast);
const svg=s=>`<svg width="30" height="28" viewBox="0 0 30 28" aria-hidden="true" style="flex-shrink: 0">${s}</svg>`;
const hatch=`<defs><pattern id="kfh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${C.foe}" stroke-opacity="0.55" stroke-width="1.4"></line></pattern></defs>`;
const tick=(cx,cy)=>[45,135,225,315].map(a=>{const c=Math.cos(a*Math.PI/180),s=Math.sin(a*Math.PI/180);return `<path d="M${cx+9*c} ${cy+9*s}L${cx+13*c} ${cy+13*s}" stroke="${C.foe}" stroke-width="2.6" stroke-linecap="round"></path>`;}).join('');
const KEY=[
 [svg(`<polygon points="${hexPts(15,14,11)}" fill="${C.foe}" fill-opacity="0.2"></polygon>`),'Enemy moves','Where the Light Anti-Cavalry can end on its next turn.'],
 [svg(`<polygon points="${hexPts(15,14,11)}" fill="none" stroke="${C.foe}" stroke-width="1.8"></polygon>`),'Enemy range','What its Reach hits from C12.'],
 [svg(`<polygon points="${hexPts(15,14,12)}" fill="none" stroke="${C.foeSp}" stroke-width="3"></polygon><polygon points="${hexPts(15,14,8)}" fill="none" stroke="${C.foeSp}" stroke-width="1.2"></polygon>`),'Enemy special','Double line: its Javelin, ready this turn.'],
 [svg(`<circle cx="15" cy="14" r="8" fill="${C.south}"></circle><circle cx="15" cy="14" r="11" fill="none" stroke="${C.foeSp}" stroke-width="3.4"></circle>`),'Enemy special ready','Thick plum ring (dashed while it warms up). Yours are gold.'],
 [svg(`<circle cx="15" cy="14" r="7" fill="${C.north}"></circle>`+tick(15,14)),'It can hit you','Four marks round your Light Ranged on C9: the Javelin reaches it.'],
 [svg(`<defs><pattern id="kspH" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${C.attack}" stroke-opacity="0.6" stroke-width="1.5"></line></pattern></defs><polygon points="${hexPts(15,14,11)}" fill="none" stroke="${C.south}" stroke-opacity="0.5" stroke-dasharray="3 3"></polygon><polygon points="${hexPts(15,14,8.5)}" fill="url(#kspH)"></polygon>`),'Set spear','Red hatching inside a Mark: the braced spear on F12 hits whoever steps in.']];
const keyDrawer=()=>`<section style="position: relative; background: #ffffff; border-top: 1px solid ${C.line}; border-radius: 14px 14px 0 0; margin-top: -14px; z-index: 2; box-shadow: 0 -6px 18px rgba(0,0,0,0.16); padding: 10px 16px 14px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0"><div style="display: flex; justify-content: center; margin: -4px 0 4px"><span style="width: 36px; height: 4px; border-radius: 2px; background: ${C.line}"></span></div><div style="font: 700 13px/1 ${BC}; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.muted}; margin-bottom: 4px">Key</div>${KEY.map(([sv,n,t])=>`<div style="display: flex; align-items: center; gap: 10px; min-height: 30px">${sv}<div style="display: flex; flex-direction: column; gap: 1px"><span style="font: 600 12px/1.2 ${PS}">${n}</span><span style="font: 400 11px/1.3 ${PS}; color: ${C.muted}">${t}</span></div></div>`).join('')}</section>`;

ST.plain={...FIELD,warmStates:{'N-LA':'charged','S-LA':'warming'}};
ph('en-r4-board.dc.html','Round 4 · Your turn, nothing tapped: full action panel greyed (End turn live); your special ready in gold, enemy warming up in plum','plain',greyNav(false,false,false),140);
ph('en-r4-la-warm.dc.html','Round 4 · Enemy Light Anti-Cavalry warming up: dashed plum ring, full action panel greyed','laWarm',ep(SLA,S.eLA.stamNext,true),70+140);
ph('en-r4-la-ready.dc.html','Round 4 · Enemy Light Anti-Cavalry, Javelin ready: thick plum ring, plum double special','laReady',ep(SLA,S.eLA.stamNext,true),70+140);
ph('en-r4-key.dc.html','Round 4 · The key over the Javelin-ready enemy, full action panel below','laReady',keyDrawer()+greyNav(true),KEY.length*34+60+140);
const h=Math.ceil(HDR+GD.HH+24);
const dnav=greyNav(true).replace('<div style="position: relative">','<div style="position: relative; margin-top: auto">').replace('padding: 8px 10px 14px','padding: 12px 16px 16px');
const dbody=header(9.5,true)+`<div style="flex: 1; display: flex; min-height: 0"><div style="flex: 1; position: relative; overflow: hidden; background: #d5dbd2; display: flex; justify-content: center; padding-top: 12px">${field(GD,ST.laReady)}</div><aside style="width: 390px; flex-shrink: 0; background: ${C.paper}; border-left: 1px solid ${C.line}; display: flex; flex-direction: column"><div style="margin: 16px; background: #fff; border: 1px solid ${C.line}; border-radius: 12px; padding: 12px 14px">${unitLine(SLA,S.eLA.stamNext,3,'Next turn')}</div>${dnav}</aside></div>`;
const dt='Round 4 · Desktop · Enemy Light Anti-Cavalry tapped, Javelin ready: full action panel greyed';
fs.writeFileSync(OUT+'en-r4-desk.dc.html',page(dt,1280,h,dbody,800));boards.push({file:'en-r4-desk.dc.html',w:1280,h,title:dt});
fs.writeFileSync('boardsE4.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.h).join('\n'));
ST.hr={...ST.hr,foeRing:'S'};
ph('v3-m-16-Enemy-tapped.dc.html','v3 · Enemy tapped (Heavy Ranged): orange moves and range, sight marks, set spear hatching','hr',ep(SHR,S.eHR.stamNext,false),70+140);
const TOAST=`<div role="status" style="position: absolute; left: 50%; top: -54px; transform: translateX(-50%); white-space: nowrap; background: ${C.ink}; color: #fff; font: 500 13px/1 ${PS}; padding: 9px 14px; border-radius: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.2); z-index: 5">Pick one of your own units</div>`;
ph('v3-m-19-Enemy-tapped--message.dc.html','v3 · Enemy tapped, a greyed button tapped: Pick one of your own units, above the unit panel','laReady',`<div style="position: relative; display: flex; flex-direction: column">${TOAST}${ep(SLA,S.eLA.stamNext,true)}</div>`,70+140);
