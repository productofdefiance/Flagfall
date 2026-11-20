const E=require('../board/engine.js'), D=require('../board/data.js');
const RS=D.PRESETS.find(p=>p.id==='v3.5');
const L=(ids)=>ids.map(([id,card])=>({id,card}));
function build(spec){ // spec: {N:[[id,card,hex,opts]], S:[...], toMove, cmd}
  const lineups={N:L(spec.N.map(x=>[x[0],x[1]])),S:L(spec.S.map(x=>[x[0],x[1]]))};
  const st=E.newMatch(RS,{lineups});
  st.phase='play'; st.toMove=spec.toMove||'N'; st.cmd=spec.cmd??10; st.turn=spec.turn||11;
  for(const t of ['N','S']) for(const [id,card,hex,o] of spec[t]){
    const u=st.units.find(x=>x.uid===t+'-'+id); u.hex=hex; Object.assign(u,o||{}); }
  return st;
}
const U=(st,uid)=>E.unitByUid(st,uid);
const parse=E.parse;
const geoY=h=>{const [q,r]=parse(h);return E.geo(q,r)[1];};
function blockedSet(st,mover){const b=new Set(E.alive(st).filter(x=>x!==mover).map(x=>x.hex));
  for(const t of ['N','S']) if(!(mover&&mover.team===t)) b.add(E.FLAG[t]); return b;}
// 2.11 route proposal
function routeTo(st,u,dst){
  const b=blockedSet(st,u); const src=u.hex;
  // BFS distances ignoring zones
  const dist={[src]:0}, q=[src];
  while(q.length){const h=q.shift(); for(const n of E.NBRS[h]){ if(b.has(n)||n in dist) continue; dist[n]=dist[h]+1; q.push(n);} }
  if(!(dst in dist)) return null;
  const back={[dst]:0}, q2=[dst]; while(q2.length){const h=q2.shift(); for(const n of E.NBRS[h]){ if((b.has(n)&&n!==src)||n in back) continue; back[n]=back[h]+1; q2.push(n);} }
  const T=dist[dst]; const paths=[]; const rec=(h,p)=>{ if(h===dst){paths.push(p.slice());return;} for(const n of E.NBRS[h]) if(dist[n]===dist[h]+1 && back[n]===T-dist[n]){p.push(n);rec(n,p);p.pop();} };
  rec(src,[src]);
  const zone=E.zoneFor(st,u.team);
  const startZone=zone.has(src);
  const spikes=E.alive(st).filter(e=>e.team!==u.team&&e.braced&&E.card(st,e).brace==='spike'&&!e.spikeUsed);
  function walk(p){ // returns events and stop index
    const ev=[]; let stop=p.length-1, speared=false;
    for(let i=1;i<p.length;i++){ const h=p[i];
      for(const s of spikes){ if(!speared && E.dist(s.hex,h)===1 && E.dist(s.hex,p[i-1])!==1){ ev.push({type:'spear',hex:h,by:s.id,dmg:st.rs.spikeDamage}); speared=true; } }
      if(zone.has(h) && !startZone){ ev.push({type:'mark',hex:h}); stop=i; break; }
      if(zone.has(h) && startZone && zone.has(p[i-1])){ /* shifting along; engine allows one shift */ }
    }
    return {ev,stop};
  }
  const key=(h)=>{const [qq]=parse(h); const y=geoY(h); return [Math.abs(qq-4), u.team==='N'?y:-y];};
  const scored=paths.map(p=>({p,...walk(p)}));
  scored.sort((a,b)=>{ const aa=a.stop===a.p.length-1?0:1, bb=b.stop===b.p.length-1?0:1; if(aa!==bb) return aa-bb; if(a.ev.length!==b.ev.length) return a.ev.length-b.ev.length;
    for(let i=1;i<a.p.length;i++){ if(a.p[i]===b.p[i]) continue; const ka=key(a.p[i]),kb=key(b.p[i]); return ka[0]-kb[0]||ka[1]-kb[1]; } return 0; });
  return {best:scored[0], all:scored, nPaths:paths.length};
}
// range sets
const DIRS6=(h)=>E.NBRS[h];
function lineHexes(a,b){ // hex line via cube lerp with nudge; returns two lines
  const cube=(h)=>{const [q,r]=parse(h);const z=(r-1)-((q-(q&1))>>1);return [q,-q-z,z];};
  const toH=(c)=>{const q=c[0],z=c[2];const r=z+((q-(q&1))>>1)+1;return 'ABCDEFGHI'[q]+r;};
  const round=(x,y,z)=>{let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z);const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;return [rx,ry,rz];};
  const A=cube(a),B=cube(b),N=E.dist(a,b),out=[];
  for(const eps of [1e-6,-1e-6]){const line=[];for(let i=1;i<N;i++){const t=i/N;line.push(toH(round(A[0]+(B[0]-A[0])*t+eps,A[1]+(B[1]-A[1])*t+eps*2,A[2]+(B[2]-A[2])*t-eps*3)));}out.push(line);}
  return out;
}
const isFlag=h=>h===E.FLAG.N||h===E.FLAG.S;
function rangeDisc(st,from,range){ // Volley: over units; flag blocks (4.9, both nudged lines through a flag)
  return E.CELLS.filter(h=>h!==from&&!isFlag(h)&&E.dist(from,h)<=range&&E.dist(from,h)>=1&&!lineHexes(from,h).every(l=>l.some(isFlag)));
}
function spokes(st,u,from,dmin,dmax,overFriends){ // straight lines
  const out=[]; const cube=(h)=>{const [q,r]=parse(h);const z=(r-1)-((q-(q&1))>>1);return [q,-q-z,z];};
  const toH=(c)=>{const q=c[0],z=c[2];if(q<0||q>8)return null;const r=z+((q-(q&1))>>1)+1;const h='ABCDEFGHI'[q]+r;return E.CELLSET.has(h)?h:null;};
  const dirs=[[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1]]; const c0=cube(from);
  for(const d of dirs){ let ok=true; for(let k=1;k<=dmax;k++){ const h=toH([c0[0]+d[0]*k,c0[1]+d[1]*k,c0[2]+d[2]*k]); if(!h)break; if(isFlag(h))break;
      if(k>=dmin && ok) out.push(h);
      const occ=E.alive(st).find(x=>x.hex===h); if(occ && occ.team!==u.team) ok=false; if(occ && occ.team===u.team && !overFriends) ok=false; if(!ok)break; } }
  return out;
}
function evadeHexes(st,u,t){ const s=E.cloneLite(st), su=E.unitByUid(s,u.uid), g=st.rs.game;
  su.stam-=g.attackCost; s.cmd-=g.attackCost; su.done=false; su.evadeFrom=t.uid; su.evadeMoved=false; su.attackedThis=true;
  return E.reachMap(s,su); }
module.exports={E,D,RS,build,U,routeTo,rangeDisc,spokes,evadeHexes,geoY,blockedSet,lineHexes};
