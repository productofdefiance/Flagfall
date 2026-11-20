const L=require('./lib.js');
const st=L.build({N:[['HOLD','HM','E3'],['HM','HM','D8'],['HA','HA','F8'],['HR','HR','E7'],['LR','LR','C9'],['LM','LM','G11',{moved:1,stam:2.5}],['LA','LA','C11']],
 S:[['HOLD','HM','E17'],['HM','HM','D13'],['HM2','HM','E11'],['HA','HA','F12',{braced:true}],['LR','LR','G12',{hp:9.5}],['LM','LM','C14'],['HR','HR','E14']], cmd:9.5});
const t=L.U(st,'S-LM');const dr=L.E.dodgeRoom(st,t);const str=L.E.card(st,L.U(st,'N-LA')).str;
const v=(str-1)*2; const dmg=L.E.half(v*(1-dr.pct/100));
console.log(JSON.stringify({str,dist:L.E.dist('C11','C14'),dodge:dr,v,dmg,hp:t.hp}));
require('fs').writeFileSync('sp12.json',JSON.stringify({str,v,dodge:dr.pct,dmg,hp:t.hp,maxHp:t.maxHp}));
