const {E,build,U,routeTo,rangeDisc,spokes,evadeHexes}=require('./lib.js');
const base={N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:1,stam:2.5}],['LA','LA','B8']],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','E11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:5}],['LM','LM','C14'],['HR','HR','E14']], cmd:9.5};
const st=build(base); module.exports={base};
const lr=U(st,'N-LR'); const rm=E.reachMap(st,lr);
console.log('zone', [...E.zoneFor(st,'N')].sort().join(' '));
for(const h of Object.keys(rm)){ const r=routeTo(st,lr,h); if(!r) continue; const b=r.best; console.log(h,rm[h].steps,'n',r.nPaths,'best',b.p.join('>'),'stop',b.p[b.stop],JSON.stringify(b.ev.map(e=>e.type+'@'+e.hex))); }
const lm=U(st,'N-LM'), t=U(st,'S-LR'); const o=E.options(st,lm.uid); const a=o.attacks.find(x=>x.target===t.uid);
console.log('LM attack', JSON.stringify({value:a.value,cases:a.cases,kill:a.killChance,capture:a.capture,evade:a.evade,detail:a.detail}));
const ev=evadeHexes(st,lm,t); console.log('evade', Object.entries(ev).map(([h,m])=>h+':'+m.steps+':'+m.mode).join(' '));
