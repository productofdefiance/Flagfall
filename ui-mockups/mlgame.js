// Replays seed mlog-0 and records, per log line: stamina spent, command spent, unit HP and brace state before/after, plus turn command.
const dir=require('path').join(__dirname,'..','board');
const E=require(dir+'/engine.js'),Bot=require(dir+'/bot.js');const {PRESETS}=require(dir+'/data.js');const {DEFAULT_BRAINS}=require(dir+'/brain.js');
const base=PRESETS[PRESETS.length-1];const rs=JSON.parse(JSON.stringify(base));
const codes=["HM","HM","LM","HR","LR","HA","LA"];const n={};const line=codes.map(c=>{n[c]=(n[c]||0)+1;return{id:n[c]===1?c:c+n[c],card:c,fk:false}});if(!rs.switches.noKeeper)line[0].fk=true;
const B=DEFAULT_BRAINS.brain5;const rnd=E.seededRandom('mlog-0');const st=E.newMatch(rs,{first:'N',lineups:{N:line,S:line}});
for(const t of['N','S'])E.act(st,{type:'deploy',team:t,placements:Bot.deploy(st,t,B,rnd)});
const snap=()=>Object.fromEntries(st.units.map(u=>[u.team+':'+u.id,{hp:u.hp,stam:u.stam,braced:!!u.braced,hex:u.hex}]));
const extra=[];let k=0;
while(st.phase==='play'&&k++<6000){const a=Bot.chooseAction(st,B,rnd).action;const before=snap(),c0=st.cmd,i0=st.log.length,turnCmd=st.cmd;
 let r=E.act(st,a,()=>E.rollWith(st,rnd));if(!r.ok)r=E.act(st,{type:'end'});
 for(let i=i0;i<st.log.length;i++)extra[i]={before,after:snap(),cmdSpent:c0-st.cmd,cmdLeft:st.cmd,team:st.log[i].team};}
const fl=st.units[0];
console.log(JSON.stringify({log:st.log,extra,cmdTurn:rs.game.command,first:rs.game.firstTurnCommand}));
