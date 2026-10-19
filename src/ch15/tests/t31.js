const { chromium } = require('playwright');
// independent nodal solver: nodes 0 (battery -) fixed 0 V, 1 (battery +) fixed 12 V; elements [a,b,G]
function nodal(nn, elems){ const N=nn, V=new Array(N).fill(0); V[1]=12; const unk=[]; for(let i=2;i<N;i++) unk.push(i);
  const n=unk.length, A=[...Array(n)].map(()=>new Array(n).fill(0)), B=new Array(n).fill(0); const idx=Object.fromEntries(unk.map((u,i)=>[u,i]));
  for(let i=0;i<n;i++) A[i][i]+=1e-12;
  for(const [a,b,G] of elems){ for(const [p,q] of [[a,b],[b,a]]){ if(p in idx){ A[idx[p]][idx[p]]+=G; if(q in idx) A[idx[p]][idx[q]]-=G; else B[idx[p]]+=G*V[q]; } } }
  for(let i=0;i<n;i++){ let piv=i; for(let r=i+1;r<n;r++) if(Math.abs(A[r][i])>Math.abs(A[piv][i])) piv=r; [A[i],A[piv]]=[A[piv],A[i]]; [B[i],B[piv]]=[B[piv],B[i]];
    for(let r=0;r<n;r++){ if(r===i) continue; const f=A[r][i]/A[i][i]; for(let c=i;c<n;c++) A[r][c]-=f*A[i][c]; B[r]-=f*B[i]; } }
  unk.forEach((u,i)=>V[u]=B[i]/A[i][i]); return V; }
const GW=1e9;
function ref(mode,on,sw,R){ const e=[], bulbs=[];
  const add=(a,b,i)=>{ bulbs[i]=[a,b]; if(on[i]) e.push([a,b,1/R[i]]); };
  if(mode==='ser'){ add(1,2,0); add(2,3,1); add(3,4,2); if(sw) e.push([4,0,GW]); var nn=5; }
  if(mode==='par'){ if(sw) e.push([1,2,GW]); add(2,0,0); add(2,0,1); add(2,0,2); var nn=3; }
  if(mode==='mix'){ add(1,2,0); add(2,3,1); add(2,3,2); if(sw) e.push([3,0,GW]); var nn=4; }
  const V=nodal(nn,e); return bulbs.map(([a,b],i)=> on[i]? Math.abs(V[a]-V[b])/R[i] : 0); }
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-3-1.html'); await p.waitForTimeout(500);
 let bad=[], n=0;
 const RS=[[12,12,12],[6,12,24],[24,6,12],[6,6,24]];
 const ORD=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]; let indep=0;
 for(const ord of ORD) for(const R of RS) for(const mode of ['ser','par','mix']) for(let mask=0;mask<8;mask++) for(const sw of [true,false]){ const on=[!!(mask&1),!!(mask&2),!!(mask&4)];
   const got=await p.evaluate(([mode,on,sw,R,ord])=>{ const S=window.__sim; S.st.mode=mode; S.st.on=on; S.st.sw=sw; S.st.R=R; S.st.order=ord; S.update(); const Pw=S.P(S.solve());
     return {I:S.solve().I, Pw, rank:document.getElementById('rank').textContent, eq:document.getElementById('eq').innerText, arrows:document.querySelectorAll('#c path[fill="var(--current)"]').length}; },[mode,on,sw,R,ord]);
   // reference: solve by position, map back to bulb id
   const rp=ref(mode,ord.map(i=>on[i]),sw,ord.map(i=>R[i])), r=[0,0,0]; ord.forEach((id,k)=>r[id]=rp[k]); n++;
   if(mode!=='mix'){ const r0=ref(mode,on,sw,R); r0.forEach((x,i)=>{ if(Math.abs(x-r[i])>1e-9) bad.push([mode,'order-dependent',ord]); }); indep++; }
   if(mode==='ser'&&got.I[0]>0){ const want='R'+(ord[0]+1); if(!got.eq.replace(/\s/g,'').includes('R='+want)) bad.push(['subscripts',ord,got.eq.slice(0,40)]); }
   // ranking text must list bulbs in decreasing power
   const order=[0,1,2].filter(i=>r[i]>1e-9).sort((a,b)=>r[b]*r[b]*R[b]-r[a]*r[a]*R[a]); const pos=order.map(i=>got.rank.indexOf('หลอด '+(i+1))); const pw=i=>r[i]*r[i]*R[i]; for(let k=1;k<pos.length;k++) if(pos[k]<pos[k-1] && pw(order[k-1])-pw(order[k])>1e-9) bad.push([mode,on,sw,R,'rank',got.rank]);
   r.forEach((x,i)=>{ if(Math.abs(x-got.I[i])>1e-6) bad.push([mode,on,sw,i,x,got.I[i]]); });
   if(r.every(x=>x<1e-9) && got.arrows>0) bad.push([mode,on,sw,'arrows with no current']); }
 console.log('cases',n,'order-indep checks',indep,'bad',bad.length,JSON.stringify(bad.slice(0,5)));
 const ex=await p.evaluate(()=>{ const S=window.__sim, o=[]; for(const [mode,on,R] of [['ser',[1,1,1],[12,12,12]],['par',[1,1,1],[12,12,12]],['mix',[1,1,1],[12,12,12]],['mix',[1,1,0],[12,12,12]],['ser',[1,1,1],[6,12,24]],['par',[1,1,1],[6,12,24]]]){ S.st.mode=mode; S.st.on=on.map(Boolean); S.st.sw=true; S.st.R=R; S.update(); o.push(mode+JSON.stringify(on)+': '+document.getElementById('tbl').innerText.replace(/\n/g,' | ')); } return o; });
 ex.forEach(x=>console.log(x)); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 const sw2=await p.evaluate(()=>{ const S=window.__sim; S.st.mode='ser'; S.st.on=[true,true,true]; S.st.sw=true; S.st.R=[6,12,24]; S.st.order=[0,1,2]; S.update(); const o=[]; for(let k=0;k<3;k++){ document.getElementById('b-swap').click(); o.push(JSON.stringify(S.st.order)+' '+document.getElementById('rank').textContent+' | '+[...document.querySelectorAll('#c text')].map(t=>t.textContent).filter(t=>/หลอด|Ω/.test(t)).join(',')); } return o; }); sw2.forEach(x=>console.log('swap',x));
 await p.evaluate(()=>{ const S=window.__sim; S.st.mode='mix'; S.st.order=[2,0,1]; S.st.on=[true,true,true]; S.update(); });
 await p.screenshot({path:'s31.png',fullPage:true}); await b.close(); })();
