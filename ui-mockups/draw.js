const S=require(process.env.SCEN||'./scen.json');
const C={paper:'#e9ece6',card:'#f8f9f5',ink:'#1f2421',muted:'#5f6762',line:'#b8beb6',hex:'#fbfcf8',north:'#2f6b55',northDark:'#143a2c',northArc:'#d3e3da',northGoal:'#a9cbbb',south:'#a8452f',southDark:'#5c2014',southArc:'#efd8cf',southGoal:'#dfb3a3',flag:'#b07a33',brace:'#2e3338',move:'#3f7fd6',attack:'#c62828',gold:'#d9a514',foe:'#c75400',foeSp:'#6a3d8f',warm:'#e2b53c',mint:'#8fd0b4',coral:'#f0a48f'};
const COLS='ABCDEFGHI';
const f=n=>(+n).toFixed(1);
const tc=t=>t==='N'?C.north:C.south;
function geo(h){const q=COLS.indexOf(h[0]),r=+h.slice(1);return [q,r+(q%2?0.5:0)];}
function mkGeom(R,PAD){const H=Math.sqrt(3)*R;return {R,H,PAD,W:14*R+2*PAD,HH:19*H+2*PAD,pos:h=>{const [gx,gy]=geo(h);return [PAD+R+1.5*R*gx,PAD+H/2+H*(gy-1)];}};}
const hexPts=(x,y,r)=>[0,1,2,3,4,5].map(i=>{const a=Math.PI/3*i;return f(x+r*Math.cos(a))+','+f(y+r*Math.sin(a));}).join(' ');
const ICON={HM:['square',1],LM:['square',0],HR:['triangle',1],LR:['triangle',0],HA:['diamond',1],LA:['diamond',0]};
function iconShape(card,x,y,s,color,sw){const [shape,filled]=ICON[card];const paint=filled?`fill="${color}" stroke="${color}" stroke-width="1"`:`fill="none" stroke="${color}" stroke-width="${sw||2}"`;
 if(shape==='square')return `<rect x="${f(x-s)}" y="${f(y-s)}" width="${f(2*s)}" height="${f(2*s)}" ${paint}></rect>`;
 if(shape==='triangle')return `<polygon points="${f(x)},${f(y-s*1.15)} ${f(x+s*1.15)},${f(y+s*0.85)} ${f(x-s*1.15)},${f(y+s*0.85)}" ${paint} stroke-linejoin="round"></polygon>`;
 return `<polygon points="${f(x)},${f(y-s*1.3)} ${f(x+s)},${f(y)} ${f(x)},${f(y+s*1.3)} ${f(x-s)},${f(y)}" ${paint} stroke-linejoin="round"></polygon>`;}
const P={attack:'<path d="M14.5 4.5 19.5 4l-.5 5L9 19l-4-4z"></path><path d="M6.5 13.5l4 4"></path><path d="M4 20l2.5-2.5"></path>',
 spear:'<path d="M4 20 17 7"></path><path d="M15 4.5 20 4l-.5 5-3.5-1z"></path><path d="M6 15.5l2.5 2.5"></path>',
 brace:'<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"></path>',special:'<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"></path>',
 undo:'<path d="M9 13.5 4.5 9 9 4.5"></path><path d="M4.5 9H14a6 6 0 0 1 0 12h-3"></path>',endunit:'<circle cx="12" cy="12" r="8.5"></circle><path d="M8.2 12.3l2.6 2.6 5-5.6"></path>',
 endturn:'<path d="M5.5 5v14l9.5-7z"></path><path d="M18.5 5v14"></path>',close:'<path d="M6 6l12 12M18 6L6 18"></path>',move:'<path d="M5 12h12"></path><path d="M13 7l5 5-5 5"></path>',
 maul:'<path d="M19.5 19.5 11.5 11.5"></path><path d="M7.8 2.9l5.3 5.3-4.9 4.9-5.3-5.3z"></path><path d="M6.3 4.4l5.3 5.3"></path>',
 evade:'<path d="M14 12H3.5"></path><path d="M7.5 8l-4 4 4 4"></path><path d="M18 6.5v2"></path><path d="M18 15.5v2"></path><path d="M21.5 12h-2"></path><path d="M20.5 8.5l-1.2 1.2"></path><path d="M20.5 15.5l-1.2-1.2"></path>',
 dodge:'<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z" stroke-dasharray="3 2.6"></path>',menu:'<path d="M4 7h16"></path><path d="M4 12h16"></path><path d="M4 17h16"></path>',
 flag:'<path d="M6 21V4"></path><path d="M6 4h11l-2.5 4L17 12H6"></path>',person:'<circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"></path>',
 bot:'<rect x="5" y="8" width="14" height="11" rx="3"></rect><path d="M12 4v4"></path><circle cx="9.5" cy="13.5" r="1.2" fill="currentColor"></circle><circle cx="14.5" cy="13.5" r="1.2" fill="currentColor"></circle>',
 hourglass:'<path d="M7 3h10"></path><path d="M7 21h10"></path><path d="M8 3c0 4.5 8 5 8 9s-8 4.5-8 9"></path><path d="M16 3c0 4.5-8 5-8 9s8 4.5 8 9"></path>',
 cursor:'<path d="M5 3l14 7-6 2-2 6z"></path>',
 setspear:'<path d="M4.5 20.5 16 9"></path><path d="M14.2 6.2 19.8 4.2l-2 5.6-2.4.2-1.4-1.4z"></path><path d="M3 20.5h8"></path><path d="M8.5 16.5l2 2"></path>',
 mark:'<path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z"></path><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"></circle><path d="M12 6.5v2.8"></path><path d="M10.8 8.2 12 9.4l1.2-1.2"></path><path d="M12 17.5v-2.8"></path><path d="M10.8 15.8 12 14.6l1.2 1.2"></path><path d="M6.8 12h2.6"></path><path d="M8.3 10.8 9.5 12l-1.2 1.2"></path><path d="M17.2 12h-2.6"></path><path d="M15.7 10.8 14.5 12l1.2 1.2"></path>'};
const ic=(n,s,c,sw)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw||1.9}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink: 0">${P[n]}</svg>`;
const icG=(n,x,y,s,c,sw)=>`<g transform="translate(${f(x-s/2)},${f(y-s/2)}) scale(${(s/24).toFixed(3)})" fill="none" stroke="${c}" stroke-width="${sw||2.2}" stroke-linecap="round" stroke-linejoin="round">${P[n]}</g>`;
const NAMES={HM:'Heavy Melee',LM:'Light Melee',HR:'Heavy Ranged',LR:'Light Ranged',HA:'Heavy Anti-Cavalry',LA:'Light Anti-Cavalry'};
// ---------- field ----------
function perimeter(G,set,color,w,dash,inset){ // outline edges of hex set
 const s=new Set(set); const centers=new Map(S.cells.map(h=>{const p=G.pos(h);return [Math.round(p[0])+','+Math.round(p[1]),h];}));
 let d='';const r=G.R-(inset||0);
 for(const h of s){const [x,y]=G.pos(h);for(let i=0;i<6;i++){const a=Math.PI/3*(i+0.5);const nx=x+G.H*Math.cos(a),ny=y+G.H*Math.sin(a);
   let nb=null;for(const dx of [-1,0,1])for(const dy of [-1,0,1]){const k=(Math.round(nx)+dx)+','+(Math.round(ny)+dy);if(centers.has(k))nb=centers.get(k);}
   if(nb&&s.has(nb))continue;const a1=Math.PI/3*i,a2=Math.PI/3*(i+1);d+=`M${f(x+r*Math.cos(a1))} ${f(y+r*Math.sin(a1))}L${f(x+r*Math.cos(a2))} ${f(y+r*Math.sin(a2))}`;}}
 return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"${dash?` stroke-dasharray="${dash}"`:''}></path>`;}
function field(G,o){ // o: {sel, moves:{h:steps}, moveDim, range:[], rangeColor, spokeHexes, gold:[], route, stop, tapped, ghostAt, ghostCard, ghostTeam, marks:[{hex,team}], spears:[{hex,dmg}], noAttack, targets:[], target, evade:{}, stand:{hex,card,team}, enemySel, enemyMoves, enemyRange}
 let s='';let arrowSvg='';let flagPills='';const tr=G.R*0.62;
 const arcs={N:new Set(S.arcs.N),S:new Set(S.arcs.S)},goal={N:new Set(S.goal.N),S:new Set(S.goal.S)};
 for(const h of S.cells){const [x,y]=G.pos(h);let fill=C.hex;if(o.noShade){}else{if(arcs.N.has(h))fill=o.neutral?'#eceee8':C.northArc;if(arcs.S.has(h))fill=o.neutral?'#eceee8':C.southArc;if(goal.N.has(h))fill=o.neutral?'#d9ddd4':C.northGoal;if(goal.S.has(h))fill=o.neutral?'#d9ddd4':C.southGoal;}
  const isF=h===S.flagHex.N||h===S.flagHex.S;if(isF)fill=C.flag;
  s+=`<polygon points="${hexPts(x,y,G.R)}" fill="${fill}" stroke="${C.line}" stroke-width="0.8"></polygon>`;
  if(!isF)s+=`<text x="${f(x)}" y="${f(y-G.H*0.3)}" text-anchor="middle" font-size="${G.R>27?8:7}" fill="${C.muted}" font-family="IBM Plex Sans, sans-serif" style="font-variant-numeric: tabular-nums">${h}</text>`;
  else{const t=h===S.flagHex.N?'N':'S';if(o.flagPill){const py=t==='N'?y-G.H*0.5:y+G.H*0.5;flagPills+=`<rect x="${f(x-15)}" y="${f(py-7.5)}" width="30" height="15" rx="7.5" fill="${C.flag}" stroke="#ffffff" stroke-width="1.2"></rect>`+icG('flag',x-6.5,py,10,'#fff',2.4)+`<text x="${f(x+5.5)}" y="${f(py+3.6)}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="IBM Plex Sans, sans-serif" style="font-variant-numeric: tabular-nums">${S.flags[t]}</text>`;}else s+=`<text x="${f(x)}" y="${f(y-G.R*0.6)}" text-anchor="middle" font-size="${(G.R*0.32).toFixed(0)}" font-weight="700" fill="#fff" font-family="IBM Plex Sans, sans-serif" style="font-variant-numeric: tabular-nums">${S.flags[t]}+20</text>`;}}
 if(o.pitch){const cid='fieldClip'+(o.pitchId||'');let cp='';for(const h of S.cells){const [x,y]=G.pos(h);cp+=`<polygon points="${hexPts(x,y,G.R)}"></polygon>`;}
  const col=o.lineCol||'#1f2421',op=o.lineOp??0.38,w=1.6;let m=`<defs><clipPath id="${cid}">${cp}</clipPath></defs><g clip-path="url(#${cid})" fill="none" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}">`;
  for(const t of ['N','S']){const [x,y]=G.pos(S.flagHex[t]);m+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(G.H*(o.arcR||3.35))}"></circle><circle cx="${f(x)}" cy="${f(y)}" r="${f(G.H*(o.goalR||1.42))}"></circle>`;}
  const yc=G.pos('E10')[1];m+=`<line x1="0" y1="${f(yc)}" x2="${f(G.W)}" y2="${f(yc)}"></line></g>`;s+=m;}
 if(o.teamLine)for(const t of ['N','S'])s+=perimeter(G,[...S.arcs[t],S.flagHex[t]],tc(t),2.4,null,0);
 if(o.spearHatch){s+=`<defs><pattern id="spH" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${C.attack}" stroke-opacity="0.55" stroke-width="1.5"></line></pattern></defs>`;
  for(const u of S.units){if(!u.braced||u.card!=='HA')continue;for(const h of S.cells){const [ux,uy]=G.pos(u.hex),[x,y]=G.pos(h);if(Math.abs(Math.hypot(x-ux,y-uy)-G.H)>1)continue;if(S.units.some(v=>v.hex===h))continue;s+=`<polygon points="${hexPts(x,y,G.R*(u.team==='N'?0.82:0.72))}" fill="url(#spH)"></polygon>`;}}}
 for(const t of ['N','S'])for(const h of S.zones[t]){const [x,y]=G.pos(h);s+=`<polygon points="${hexPts(x,y,G.R*(t==='N'?0.86:0.76))}" fill="none" stroke="${tc(t)}" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="3 3"></polygon>`;}
 if(o.enemyMoves&&o.foeSolid){for(const h in o.enemyMoves){const [x,y]=G.pos(h);s+=`<polygon points="${hexPts(x,y,G.R-2)}" fill="${C.foe}" fill-opacity="0.16"></polygon>`;}}
 if(o.enemyMoves&&!o.foeSolid){s+=`<defs><pattern id="foeHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="${C.foe}" fill-opacity="0.07"></rect><line x1="0" y1="0" x2="0" y2="7" stroke="${C.foe}" stroke-opacity="0.42" stroke-width="1.6"></line></pattern></defs>`;for(const h in o.enemyMoves){const [x,y]=G.pos(h);s+=`<polygon points="${hexPts(x,y,G.R-2)}" fill="url(#foeHatch)"></polygon>`;}}
 if(o.moves){for(const h in o.moves){const [x,y]=G.pos(h);s+=`<polygon points="${hexPts(x,y,G.R-2)}" fill="${C.move}" fill-opacity="${o.moveDim?0.09:0.16}"></polygon>`;}}
 if(o.evade){for(const h in o.evade){const [x,y]=G.pos(h);s+=`<polygon points="${hexPts(x,y,G.R-2)}" fill="${C.move}" fill-opacity="0.18"></polygon>`;}}
 if(o.range&&o.range.length)s+=perimeter(G,o.range,o.rangeColor||C.move,1.6,null,1.2);
 if(o.spokes)for(const h of o.spokes)s+=perimeter(G,[h],C.move,1.6,null,1.2);
 if(o.gold){for(const h of o.gold){const inner=(o.spokes&&o.spokes.includes(h));if(o.goldDouble){s+=perimeter(G,[h],C.gold,3,null,inner?4.6:1.8)+perimeter(G,[h],C.gold,1.2,null,inner?8.6:5.8);}else s+=perimeter(G,[h],C.gold,2.6,null,inner?5:1.4);}}
 if(o.enemyRange)s+=perimeter(G,o.enemyRange,C.foe,o.foeSolid?1.6:1.8,o.foeSolid?null:'5 3',1.2);
 if(o.enemySpokes)for(const h of o.enemySpokes)s+=perimeter(G,[h],C.foe,o.foeSolid?1.6:1.8,o.foeSolid?null:'5 3',1.2);
 if(o.enemyGold)for(const h of o.enemyGold){const inner=(o.enemySpokes&&o.enemySpokes.includes(h));if(o.foeDouble){const da=o.foeSolid?null:'5 3',db=o.foeSolid?null:'4 3';s+=perimeter(G,[h],C.foeSp,3,da,inner?4.6:1.8)+perimeter(G,[h],C.foeSp,1.2,db,inner?8.6:5.8);}else s+=perimeter(G,[h],C.foeSp,2.6,'5 3',inner?5:1.4);}
 if(o.tapped){const [x,y]=G.pos(o.tapped);s+=`<polygon points="${hexPts(x,y,G.R-3)}" fill="none" stroke="${C.muted}" stroke-width="1.6" stroke-dasharray="4 3"></polygon>`;}
 if(o.route){const pts=o.route.map(h=>G.pos(h));const k=o.stopIdx??pts.length-1;const solid=pts.slice(0,k+1).map(p=>f(p[0])+','+f(p[1])).join(' ');
  s+=`<polyline points="${solid}" fill="none" stroke="#ffffff" stroke-opacity="0.95" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"></polyline><polyline points="${solid}" fill="none" stroke="${C.move}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
  if(o.routeArrow){const seg=pts.slice(0,k+1);let L=0;const ls=[];for(let i=1;i<seg.length;i++){const d=Math.hypot(seg[i][0]-seg[i-1][0],seg[i][1]-seg[i-1][1]);ls.push(d);L+=d;}
   let t=L/2,i=0;while(i<ls.length-1&&t>ls[i]){t-=ls[i];i++;}const a=seg[i],b=seg[i+1],u2=t/ls[i];const mx=a[0]+(b[0]-a[0])*u2,my=a[1]+(b[1]-a[1])*u2;const ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
   arrowSvg=`<g transform="translate(${f(mx)},${f(my)}) rotate(${f(ang)})"><path d="M-5 -6.5 L5 0 L-5 6.5 Z" fill="${C.move}" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"></path></g>`;}
  if(k<pts.length-1){const rest=pts.slice(k).map(p=>f(p[0])+','+f(p[1])).join(' ');s+=`<polyline points="${rest}" fill="none" stroke="${C.muted}" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"></polyline>`;}}
 for(const u of S.units){const [x,y]=G.pos(u.hex);const sel=o.sel===u.uid||o.enemySel===u.uid;
  if(sel&&o.halo)s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+6)}" fill="none" stroke="#fff" stroke-width="5.5"></circle>`;
  if(sel)s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+6)}" fill="none" stroke="${o.enemySel===u.uid?C.foe:C.move}"${(o.enemySel===u.uid&&!o.foeSolid)?' stroke-dasharray="5 3"':''} stroke-width="2.5"></circle>`;
  const ws=(o.warmStates&&o.warmStates[u.uid])||(u.warm?'charged':null);
  if(ws==='warming')s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+3.5)}" fill="none" stroke="${(o.foeRing&&u.uid[0]===o.foeRing)?C.foeSp:C.warm}" stroke-width="2.6" stroke-dasharray="4 3"></circle>`;
  if(ws==='charged')s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+3.8)}" fill="none" stroke="${(o.foeRing&&u.uid[0]===o.foeRing)?C.foeSp:C.warm}" stroke-width="4.2"></circle>`;
  if(o.bracedLast&&o.bracedLast.includes(u.uid))s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+3.6)}" fill="none" stroke="#ffffff" stroke-width="6"></circle><circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+3.6)}" fill="none" stroke="${C.brace}" stroke-width="3.2" stroke-dasharray="4 3"></circle>`;
  if(u.braced)s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+3.6)}" fill="none" stroke="#ffffff" stroke-width="6"></circle><circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+3.6)}" fill="none" stroke="${C.brace}" stroke-width="3.4"></circle>`;
  s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr)}" fill="${tc(u.team)}" stroke="${u.team==='N'?C.northDark:C.southDark}" stroke-width="1.2"></circle>`+iconShape(u.card,x,y-3.5,tr*0.33,'#fff',1.6)+
   `<text x="${f(x)}" y="${f(y+tr*0.76)}" text-anchor="middle" font-size="${f(tr*0.55)}" font-weight="600" fill="#fff" font-family="IBM Plex Sans, sans-serif" style="font-variant-numeric: tabular-nums">${u.hp}</text>`;}
 if(o.threats&&o.threatTicks)for(const h of o.threats){const [x,y]=G.pos(h);for(const a of [45,135,225,315]){const r1=tr+3,r2=tr+10,c=Math.cos(a*Math.PI/180),s2=Math.sin(a*Math.PI/180);const ln=`M${f(x+r1*c)} ${f(y+r1*s2)}L${f(x+r2*c)} ${f(y+r2*s2)}`;s+=`<path d="${ln}" stroke="#ffffff" stroke-width="6.5" stroke-linecap="round"></path><path d="${ln}" stroke="${C.foe}" stroke-width="3.6" stroke-linecap="round"></path>`;}}
 if(o.threats&&!o.threatTicks)for(const h of o.threats){const [x,y]=G.pos(h);if(o.halo)s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+6)}" fill="none" stroke="#fff" stroke-width="6"></circle>`;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+6)}" fill="none" stroke="${C.foe}" stroke-width="3" stroke-dasharray="5 3"></circle>`;}
 if(o.targets)for(const h of o.targets){const [x,y]=G.pos(h);if(o.halo)s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+6)}" fill="none" stroke="#fff" stroke-width="${h===o.target?7.5:6}"></circle>`;s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr+6)}" fill="none" stroke="${C.attack}" stroke-width="${h===o.target?4.5:3}"></circle>`;}
 if(o.ghostAt){const [x,y]=G.pos(o.ghostAt);s+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(tr)}" fill="${tc(o.ghostTeam)}" fill-opacity="0.6" stroke="${tc(o.ghostTeam)}" stroke-width="1.5" stroke-dasharray="3 2"></circle>`+iconShape(o.ghostCard,x,y-3.5,tr*0.33,'#fff',1.6);
  if(o.noAttack){const bx=x+tr*0.75,by=y+tr*0.75;s+=`<circle cx="${f(bx)}" cy="${f(by)}" r="8.5" fill="${C.card}" stroke="${C.muted}" stroke-width="1.2"></circle>`+icG('attack',bx,by,11,C.muted,2.2)+`<path d="M${f(bx-5.5)} ${f(by+5.5)}L${f(bx+5.5)} ${f(by-5.5)}" stroke="${C.muted}" stroke-width="1.8" stroke-linecap="round"></path>`;}}
 s+=arrowSvg+flagPills;
 if(o.pills)for(const p of o.pills){const [x,y]=G.pos(p.hex);const POS={stop:'tr',hurt:'tl',cant:'br',cost:'bl'};const pos=p.pos&&p.pos.length===2?p.pos:POS[p.kind]||'tr';const ang={tr:-30,tl:-150,br:30,bl:150}[pos]*Math.PI/180;const dd=G.H*0.5*0.86;const w=p.text?29:19;const bx=x+dd*Math.cos(ang)+(p.text?-5:0),by=y+dd*Math.sin(ang);
  const fill=p.kind==='hurt'?C.attack:p.kind==='cant'?'#f8f9f5':C.ink,fg=p.kind==='cant'?C.muted:'#ffffff';
  s+=`<rect x="${f(bx-9.5)}" y="${f(by-7.5)}" width="${w}" height="15" rx="7.5" fill="${fill}" stroke="${p.kind==='cant'?C.muted:'#ffffff'}" stroke-width="1.2"></rect>`;
  if(p.icon==='mark')s+=`<g color="${fg}">`+icG('mark',bx,by,12.5,fg,2.1)+`</g>`;
  else if(p.icon==='noatk')s+=icG('attack',bx,by,11,fg,2.3)+`<path d="M${f(bx-5)} ${f(by+5)}L${f(bx+5)} ${f(by-5)}" stroke="${fg}" stroke-width="1.8" stroke-linecap="round"></path>`;
  else s+=icG(p.icon,bx,by,11,fg,2.4);
  if(p.text)s+=`<text x="${f(bx+11)}" y="${f(by+3.6)}" text-anchor="middle" font-size="10" font-weight="700" fill="${fg}" font-family="IBM Plex Sans, sans-serif" style="font-variant-numeric: tabular-nums">${p.text}</text>`;}
 if(o.marks)for(const m of o.marks){const [x,y]=G.pos(m.hex);const sx=x+tr+3,sy=y-tr-1;s+=`<polygon points="${hexPts(sx,sy,7.5)}" fill="${tc(m.team)}" stroke="#ffffff" stroke-width="1.2"></polygon><rect x="${f(sx-3.5)}" y="${f(sy-1)}" width="7" height="2" fill="#fff"></rect>`;}
 if(o.spears)for(const m of o.spears){const [x,y]=G.pos(m.hex);const bx=x+tr-2,by=y-tr-10;s+=`<rect x="${f(bx-1)}" y="${f(by-7)}" width="27" height="15" rx="7.5" fill="${C.attack}" stroke="#ffffff" stroke-width="1.2"></rect>`+icG('spear',bx+7,by+0.5,11,'#fff',2.4)+`<text x="${f(bx+18)}" y="${f(by+4)}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="IBM Plex Sans, sans-serif" style="font-variant-numeric: tabular-nums">${m.dmg}</text>`;}
 if(o.stand){const [x,y]=G.pos(o.stand.hex);const bx=x-tr-1,by=y-tr+1;s+=`<circle cx="${f(bx)}" cy="${f(by)}" r="9" fill="${tc(o.stand.team)}" stroke="${C.attack}" stroke-width="1.8" stroke-dasharray="2.5 1.8"></circle>`+iconShape(o.stand.card,bx,by,3,'#fff',1.3);}
 if(o.cursor){const [x,y]=G.pos(o.cursor);s+=`<g transform="translate(${f(x+4)},${f(y+2)}) scale(0.9)" fill="#ffffff" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"><path d="M0 0l14 7-6 2-2 6z"></path></g>`;}
 return `<svg width="${f(G.W)}" height="${f(G.HH)}" viewBox="0 0 ${f(G.W)} ${f(G.HH)}" role="img" aria-label="${o.label||'Field'}" style="display: block">${s}</svg>`;}
module.exports={S,C,f,tc,mkGeom,field,ic,icG,iconShape,NAMES,P,hexPts};
