const L=require('./lib.js');
const base=(laHex)=>({N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:1,stam:2.5}],['LA','LA',laHex]],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','E11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:9.5}],['LM','LM','C14'],['HR','HR','E14']], cmd:9.5});
for(const h of ['C11','B11','B10','C10','D10','A11','B12']){const st=L.build(base(h));const u=L.U(st,'N-LA');if(L.E.alive(st).some(x=>x!==u&&x.hex===h))continue;
 const jav=L.spokes(st,u,h,2,3,true);const tg=L.E.alive(st).filter(x=>x.team==='S'&&jav.includes(x.hex)).map(x=>x.hex);
 if(tg.length){const out={hex:h,moves:Object.fromEntries(Object.entries(L.E.reachMap(st,u)).map(([k,m])=>[k,m.steps])),reach:L.spokes(st,u,h,2,2,true),jav,targets:tg,zone:L.E.zoneFor(st,'N').has(h)};console.log(JSON.stringify({h,tg,jav,zone:out.zone}));require('fs').writeFileSync('la11.json',JSON.stringify(out));break;}}
