const {E,build,U,routeTo,rangeDisc,spokes,evadeHexes}=require('./lib.js');
const base={N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:1,stam:2.5}],['LA','LA','B8']],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','I11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:5}],['LM','LM','C14'],['HR','HR','E14']], cmd:9.5};
const st=build(base);
for(const c of ['A','B','C','D','E','F','G','H','I']) console.log(c, E.CELLS.filter(h=>h[0]===c).map(h=>h.slice(1)).join(' '));
const lr=U(st,'N-LR'); const rm=E.reachMap(st,lr);
console.log('LR moves', Object.keys(rm).length, Object.entries(rm).map(([h,m])=>h+':'+m.steps+(m.mode!=='free'?'*':'')).join(' '));
console.log('zoneS', [...E.zoneFor(st,'N')].join(' '));
for(const h of Object.keys(rm)){ const r=routeTo(st,lr,h); if(!r) continue; const b=r.best; if(b.ev.length) console.log(h,'paths',r.nPaths,'best',b.p.join('>'),'ev',JSON.stringify(b.ev),'stop',b.p[b.stop]); }
