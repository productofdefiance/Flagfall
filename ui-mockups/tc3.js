// Turn cue Round 3 (UI chat, 19 Nov): View 1 on the 13v13 field, edge tag, snap to your own flag's end. Run: OUT=dir/ node tc3.js
process.env.SCEN='./scen13.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');const T=require('./tc1.js');
const {field,C,mkGeom,S}=D;const {page,PS}=G_;const {header,nav,FIELD,HDR}=T;
const OUT=process.env.OUT||'./out/';fs.mkdirSync(OUT,{recursive:true});
const G=mkGeom((390-16)/20,8);const NAVH=140;const VIS=844-HDR-NAVH;
const H=Math.ceil(HDR+G.HH+NAVH+8);
const alive=t=>S.units.filter(u=>u.team===t).length;
const dim=(top,h,label)=>`<div style="position: absolute; left: 0; right: 0; top: ${top}px; height: ${h}px; background: rgba(233,236,230,0.62); display: flex; align-items: center; justify-content: center; pointer-events: none"><span style="background: ${C.ink}; color: #fff; font: 600 11px/1 ${PS}; letter-spacing: 0.04em; padding: 5px 9px; border-radius: 4px">${label}</span></div>`;
const edge=(y)=>`<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: ${y}px; border-top: 1.5px dashed ${C.ink}; pointer-events: none"></div>`;
function fw(side){const fh=Math.ceil(G.HH);const off=side==='N'?dim(VIS,fh-VIS,'Off screen after the snap · scroll down to see')+edge(VIS):dim(0,fh-VIS,'Off screen after the snap · scroll up to see')+edge(fh-VIS);
 return `<div style="flex: 1; position: relative; overflow: hidden; background: #d5dbd2; display: flex; justify-content: center; align-items: flex-start">${field(G,{...FIELD,pitchId:'13'})}${off}</div>`;}
const boards=[];
function ph(file,title,side){const o={turn:'12/50',dotsN:[alive('N'),11],dotsS:[alive('S'),11]};
 fs.writeFileSync(OUT+file,page(title,390,H,header(side,'edge',o)+fw(side)+nav,H+50));boards.push({file,title,w:390,h:H});}
ph('tc-r3-13-north.dc.html','Round 3 · View 1 on the 13v13 field: North to play, snapped to North\'s end','N');
ph('tc-r3-13-south.dc.html','Round 3 · View 1 on the 13v13 field: South to play, snapped to South\'s end','S');
console.log(boards.map(b=>b.file+' '+b.h).join('\n'),'visible',VIS,'field',G.HH.toFixed(0));
