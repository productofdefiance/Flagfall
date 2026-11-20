// Turn cue Round 2 (UI chat, 19 Nov): option C, the edge tag, in the three hot-seat views. Phone. Run: OUT=dir/ node tc2.js
process.env.SCEN='./scen2.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');const T=require('./tc1.js');
const {field,C}=D;const {page}=G_;const {header,nav,FIELD,GP,HDR}=T;
const OUT=process.env.OUT||'./out/';fs.mkdirSync(OUT,{recursive:true});
const GF={...GP,flipped:true,pos:h=>{const [x,y]=GP.pos(h);return [GP.W-x,GP.HH-y];}};
const fw=(G,rot)=>`<div style="flex: 1; position: relative; overflow: hidden; background: #d5dbd2; display: flex; justify-content: center; align-items: ${rot?'center':'flex-start'}"><div style="${rot?`transform: rotate(${rot}deg)`:''}">${field(G,{...FIELD,pitchId:G.flipped?'f':''})}</div></div>`;
const H=Math.ceil(HDR+GP.HH+140+8);
const boards=[];
function ph(file,title,side,G,o={}){let body=header(side,o.cue===false?'none':'edge')+fw(G,o.rot)+nav;
 if(o.table)body=`<div style="flex: 1; display: flex; flex-direction: column; transform: rotate(180deg)">${body}</div>`;
 fs.writeFileSync(OUT+file,page(title,390,H,body,844));boards.push({file,title,w:390,h:H});}
ph('tc-r2-v1-north.dc.html','Round 2 · View 1, handoff, fixed: North to play (edge tag under North\'s flag number)','N',GP);
ph('tc-r2-v1-south.dc.html','Round 2 · View 1, handoff, fixed: South to play','S',GP);
ph('tc-r2-v2-north.dc.html','Round 2 · View 2, handoff, field turns: North to play, North\'s flag at the bottom','N',GF);
ph('tc-r2-v2-turning.dc.html','Round 2 · View 2, the turn: the field spins half a turn, no cue yet','S',GF,{rot:90,cue:false});
ph('tc-r2-v2-south.dc.html','Round 2 · View 2, field turned: South to play, South\'s flag at the bottom','S',GP);
ph('tc-r2-v3-north.dc.html','Round 2 · View 3, versus, phone on the table (North sits at this bottom edge): North to play','N',GF);
ph('tc-r2-v3-south.dc.html','Round 2 · View 3, same phone, same field: scoreboard and panel turned to face South at the far edge','S',GP,{table:true});
fs.writeFileSync(OUT+'boards2.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.h).join('\n'));
