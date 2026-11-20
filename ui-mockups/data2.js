const {E,build,U,routeTo,rangeDisc,spokes}=require('./lib.js');
const base={N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:1,stam:2.5}],['LA','LA','B8']],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','E11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:9.5}],['LA','LA','C12'],['HR','HR','E14']], cmd:9.5, turn:11};
const st=build(base);
const out=JSON.parse(require('fs').readFileSync('scen.json'));
out.units=E.alive(st).map(u=>({uid:u.uid,team:u.team,id:u.id,card:u.card,hex:u.hex,hp:E.hpShown(st,u),maxHp:u.maxHp,braced:!!u.braced,holder:E.isHolder(st,u),stam:u.stam,warm:(u.uid==='S-LA'||u.uid==='N-LA')}));
out.zones={N:[...E.zones(st).N],S:[...E.zones(st).S]};
const la=U(st,'N-LA'); out.laMoves=Object.fromEntries(Object.entries(E.reachMap(st,la)).map(([h,m])=>[h,m.steps])); out.laReach=spokes(st,la,la.hex,2,2,true); out.laJav=spokes(st,la,la.hex,2,3,true);
out.laTargets=E.options(st,la.uid).attacks.map(a=>E.unitByUid(st,a.target).hex);
function nextTurn(uid){const s2=E.cloneLite(st); s2.toMove='S'; s2.cmd=st.rs.game.command; const e=E.unitByUid(s2,uid); e.stam=E.nextStamina(st,U(st,uid)); e.moved=0; e.done=false; e.zmode=null;
 return {e,s2,moves:Object.fromEntries(Object.entries(E.reachMap(s2,e)).map(([h,m])=>[h,m.steps]))};}
const hr=nextTurn('S-HR'); const hrRange=rangeDisc(st,'E14',4);
out.eHR={hex:'E14',stamNext:hr.e.stam,moves:hr.moves,range:hrRange,hits:E.alive(st).filter(u=>u.team==='N'&&hrRange.includes(u.hex)).map(u=>u.hex)};
const sla=U(st,'S-LA'); const l2=nextTurn('S-LA'); const reach=spokes(st,sla,'C12',2,2,true), jav=spokes(st,sla,'C12',2,3,true);
const occN=h=>E.alive(st).some(u=>u.team==='N'&&u.hex===h);
out.eLA={hex:'C12',stamNext:l2.e.stam,moves:l2.moves,reach,jav,hits:[...new Set([...reach,...jav,...E.NBRS['C12']].filter(occN))]};
require('fs').writeFileSync('scen2.json',JSON.stringify(out,null,1));
console.log(JSON.stringify({eHR:{n:Object.keys(out.eHR.moves).length,hits:out.eHR.hits,st:out.eHR.stamNext},eLA:{n:Object.keys(out.eLA.moves).length,reach,jav,hits:out.eLA.hits},laTargets:out.laTargets}));
