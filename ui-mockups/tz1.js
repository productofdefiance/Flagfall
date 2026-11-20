// Field zoom Round 1 (UI chat, 19 Nov): 13v13, view 1, North to play. Far, close, minimum; zoom and hex-name buttons bottom right. Run: OUT=dir/ node tz1.js
process.env.SCEN='./scen13.json';
const fs=require('fs');const D=require('./draw.js');const G_=require('./gen.js');const T=require('./tc1.js');
const {field,C,mkGeom,S,P,ic}=D;const {page,PS}=G_;const {header,nav,FIELD,HDR}=T;
P.grid='<path d="M7 4l-3 5 3 5h6l3-5-3-5z"></path><path d="M13 14l3 5h4"></path>';
P.zoomin='<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.3 15.3 20 20"></path><path d="M7.8 10.5h5.4"></path><path d="M10.5 7.8v5.4"></path>';
P.zoomout='<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.3 15.3 20 20"></path><path d="M7.8 10.5h5.4"></path>';
const OUT=process.env.OUT||'./out/';fs.mkdirSync(OUT,{recursive:true});
const NAVH=140,VIS=844-HDR-NAVH;
const alive=t=>S.units.filter(u=>u.team===t).length;
const o={turn:'12/50',dotsN:[alive('N'),11],dotsS:[alive('S'),11]};
const shade='rgba(233,236,230,0.66)';
const btn=(icon,label,x,y,pressed)=>`<button type="button" aria-label="${label}"${pressed!==undefined?` aria-pressed="${pressed}"`:''} style="position: absolute; left: ${x}px; top: ${y}px; width: 44px; height: 44px; border-radius: 10px; border: 1px solid ${C.line}; background: rgba(248,249,245,0.92); box-shadow: 0 2px 6px rgba(0,0,0,0.12); display: inline-flex; align-items: center; justify-content: center; padding: 0; z-index: 3">${ic(icon,20,C.ink)}</button>`;
const boards=[];
function frame(file,title,R,zoomIcon,zoomLabel){
 const G=mkGeom(R,8);const AW=Math.max(390,Math.ceil(G.W)),FH=Math.max(Math.ceil(G.HH),VIS),AH=HDR+FH+NAVH;
 const fx=G.pos(S.flagHex.N)[0]+(AW-G.W)/2;const vx=Math.round(Math.min(Math.max(fx-195,0),AW-390)),vy=0;
 const dims=[[0,0,AW,vy],[0,vy+VIS,AW,FH-vy-VIS],[0,vy,vx,VIS],[vx+390,vy,AW-vx-390,VIS]].filter(d=>d[2]>0&&d[3]>0).map(([x,y,w,h])=>`<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px; background: ${shade}; z-index: 2"></div>`).join('');
 const frameLine=`<div aria-hidden="true" style="position: absolute; left: ${vx}px; top: ${vy}px; width: 390px; height: ${VIS}px; box-sizing: border-box; border: 1.5px dashed ${C.ink}; z-index: 2; pointer-events: none"></div>`;
 const label=(VIS<FH||AW>390)?`<span style="position: absolute; left: ${vx+8}px; top: ${vy+VIS+8}px; z-index: 3; background: ${C.ink}; color: #fff; font: 600 11px/1 ${PS}; letter-spacing: 0.04em; padding: 5px 9px; border-radius: 4px">Dashed frame = on screen after the snap; shaded = scroll to see</span>`:'';
 const bx=vx+390-8-44,by=vy+VIS-8-44;
 const fieldArea=`<div style="position: absolute; left: 0; top: ${HDR}px; width: ${AW}px; height: ${FH}px; background: #d5dbd2; overflow: hidden"><div style="position: absolute; left: ${((AW-G.W)/2).toFixed(1)}px; top: 0">${field(G,{...FIELD,pitchId:'z'+Math.round(R)})}</div>${dims}${frameLine}${label}${btn('grid','Show hex names',bx,by-52,false)}${btn(zoomIcon,zoomLabel,bx,by)}</div>`;
 const body=`<div style="position: relative; width: ${AW}px; height: ${AH}px; background: #d5dbd2">${fieldArea}<div style="position: absolute; left: ${vx}px; top: 0; width: 390px; display: flex; flex-direction: column; z-index: 4">${header('N','edge',o)}</div><div style="position: absolute; left: ${vx}px; top: ${HDR+FH}px; width: 390px; display: flex; flex-direction: column">${nav}</div></div>`;
 fs.writeFileSync(OUT+file,page(title,AW,AH,body,AH+50));boards.push({file,title,w:AW,h:AH});}
frame('zoom-r1-far.dc.html','Round 1 · Far: the field fills the screen width (hexes 37 px on 13v13); zoom button shows zoom in',(390-16)/20,'zoomin','Zoom in');
frame('zoom-r1-close.dc.html','Round 1 · Close: hexes 60 px wide on every field; the snap aims at your own flag, across and down; zoom button shows zoom out',30,'zoomout','Zoom out');
frame('zoom-r1-min.dc.html','Round 1 · Minimum: pinched right out, the whole field in view (hexes about 25 px on 13v13)',(VIS-16)/(25*Math.sqrt(3)),'zoomin','Zoom in');
fs.writeFileSync(OUT+'boardsZ.json',JSON.stringify(boards));console.log(boards.map(b=>b.file+' '+b.w+'x'+b.h).join('\n'));
