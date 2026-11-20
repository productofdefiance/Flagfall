// Compute every scenario from the engine; output JSON for the drawer.
const {E,build,U,routeTo,rangeDisc,spokes,evadeHexes}=require('./lib.js');
const base={N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:1,stam:2.5}],['LA','LA','B8']],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','E11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:9.5}],['LM','LM','C14'],['HR','HR','E14']], cmd:9.5, turn:11};
const st=build(base);
const units=E.alive(st).map(u=>({uid:u.uid,team:u.team,id:u.id,card:u.card,hex:u.hex,hp:E.hpShown(st,u),maxHp:u.maxHp,braced:!!u.braced,holder:E.isHolder(st,u),stam:u.stam}));
const zones={N:[...E.zones(st).N],S:[...E.zones(st).S]};
const out={units,zones,cmd:st.cmd,flags:{N:E.flagShown(st,'N'),S:E.flagShown(st,'S')},cells:E.CELLS,flagHex:E.FLAG,goal:{N:[...E.GOAL.N],S:[...E.GOAL.S]},arcs:{N:E.deployZone(st,'N'),S:E.deployZone(st,'S')}};
const mv=(u)=>Object.fromEntries(Object.entries(E.reachMap(st,u)).map(([h,m])=>[h,m.steps]));
// 1 LR tapped
const lr=U(st,'N-LR'); out.lrMoves=mv(lr); out.lrRange=rangeDisc(st,lr.hex,3);
// 2 LA Javelin
const la=U(st,'N-LA'); out.laMoves=mv(la); out.laReach=spokes(st,la,la.hex,2,2,true); out.laJav=spokes(st,la,la.hex,2,3,true);
// 3 preview G10
const r1=routeTo(st,lr,'G10'); out.prev={dst:'G10',route:r1.best.p,stop:r1.best.p[r1.best.stop],ev:r1.best.ev,n:r1.nPaths,alts:r1.all.map(x=>x.p),steps:r1.best.p.length-1};
out.prev.endRange=rangeDisc(st,'G10',3); out.prev.cost=(out.prev.steps)*0.5;
// 4 stop short F10
const r2=routeTo(st,lr,'F10'); out.short={dst:'F10',route:r2.best.p,stop:r2.best.p[r2.best.stop],ev:r2.best.ev,hlSteps:E.reachMap(st,lr)['F10'].steps};
out.short.stopIdx=r2.best.stop; out.short.cost=r2.best.stop*0.5; out.short.endRange=rangeDisc(st,out.short.stop,3);
// 5 HR full move
const hr=U(st,'N-HR'); const hm=E.reachMap(st,hr); out.hrMoves=Object.fromEntries(Object.entries(hm).map(([h,m])=>[h,m.steps]));
let pick=null; for(const h of Object.keys(hm)){ if(hm[h].steps!==3) continue; const r=routeTo(st,hr,h); if(r.best.ev.length||r.best.stop!==r.best.p.length-1) continue; const y=+h.slice(1); if(!pick||y>pick.y||(y===pick.y&&Math.abs(h.charCodeAt(0)-69)<Math.abs(pick.h.charCodeAt(0)-69))) pick={h,y,r}; }
out.hrPrev={dst:pick.h,route:pick.r.best.p,n:pick.r.nPaths,alts:pick.r.all.map(x=>x.p)};
// 6 attack
const lm=U(st,'N-LM'), t=U(st,'S-LR'); const o=E.options(st,lm.uid); const a=o.attacks.find(x=>x.target===t.uid);
out.atk={from:lm.hex,to:t.hex,cases:a.cases,kill:a.killChance,capture:a.capture,evade:a.evade,detail:a.detail,effHp:a.effHp,
  targets:o.attacks.map(x=>E.unitByUid(st,x.target).hex), evadeHexes:Object.fromEntries(Object.entries(evadeHexes(st,lm,t)).map(([h,m])=>[h,m.mode])), lmStam:lm.stam};
// 7 enemy tapped: S-HR next turn
const s2=E.cloneLite(st); s2.toMove='S'; s2.cmd=10; const ehr=E.unitByUid(s2,'S-HR'); ehr.stam=E.nextStamina(st,U(st,'S-HR')); ehr.moved=0; ehr.done=false; ehr.zmode=null;
out.enemy={hex:ehr.hex,stamNext:ehr.stam,moves:Object.fromEntries(Object.entries(E.reachMap(s2,ehr)).map(([h,m])=>[h,m.steps])),range:rangeDisc(st,ehr.hex,4)};
require('fs').writeFileSync('scen.json',JSON.stringify(out,null,1));
console.log(JSON.stringify({prev:out.prev,short:out.short,hrPrev:out.hrPrev,atk:{...out.atk,detail:undefined},enemy:{n:Object.keys(out.enemy.moves).length,stam:out.enemy.stamNext,range:out.enemy.range.length},laReach:out.laReach,laJav:out.laJav,lrRange:out.lrRange.length}));
