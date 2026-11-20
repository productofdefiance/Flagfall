const L=require('./lib.js');const E=L.E;
const base={N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:4,stam:1}],['LA','LA','B8']],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','E11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:9.5}],['LM','LM','C14'],['HR','HR','E14']], cmd:7};
const st=L.build(base);const lm=L.U(st,'N-LM');
console.log(JSON.stringify({why:E.whyNoMove(st,lm),moves:Object.keys(E.reachMap(st,lm)).length,attacks:E.options(st,lm.uid).attacks.length}));
