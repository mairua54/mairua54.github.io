const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-6-1.html'); await p.waitForTimeout(500);
 const out=await p.evaluate(()=>{ const S=window.__sim, r=[]; const eq=()=>document.getElementById('eq').innerText.replace(/\n/g,' | '); const tb=()=>document.getElementById('tbl').innerText.replace(/\n/g,' | ');
  for(const id of ['p1','p2','p3']){ document.getElementById(id).click(); r.push(id+': '+eq()+' || '+tb()); }
  // independent loop-rule check: walk the series row left→right with assumed current j, potential change must sum to zero round the loop
  const bad=[]; for(const n of [1,2,3,4,5,6]) for(let mask=0;mask<(1<<n);mask++) for(const R of [0.5,4,20]) for(const rr of [0.05,0.5,1]){
    const rev=[...Array(6)].map((_,k)=>!!(mask&(1<<k))); Object.assign(S.st,{mode:'ser',n,e:1.5,r:rr,R,rev}); const sol=S.solve();
    // loop: sum over cells of (s_k ε - j r) - j R = 0
    let sum=0; for(let k=0;k<n;k++) sum+= (rev[k]?-1:1)*1.5 - sol.j*rr; sum-= sol.j*R; if(Math.abs(sum)>1e-9) bad.push(['loop',n,mask,R,rr]);
    sol.cells.forEach((c,k)=>{ const s=rev[k]?-1:1, cur=s*sol.j; // current through cell in its own − → + direction
      const Vexp = 1.5 - cur*rr; // V+ − V− = ε − i r with signed i (− → + positive)
      if(Math.abs(c.V-Vexp)>1e-9) bad.push(['cellV',n,mask,R,rr,k,c.V,Vexp]); }); }
  for(const n of [1,2,3,6]) for(const R of [0.5,1.4,20]){ Object.assign(S.st,{mode:'par',n,e:1.5,r:0.3,R}); const sol=S.solve();
    // nodal: each branch I_k = (ε − V)/r, Σ I_k = V/R
    const V=1.5*(n/0.3)/(n/0.3+1/R); const Ik=(1.5-V)/0.3; if(Math.abs(sol.cells[0].I-Ik)>1e-9||Math.abs(sol.I-V/R)>1e-9) bad.push(['par',n,R]); }
  r.push('bad '+bad.length+' '+JSON.stringify(bad.slice(0,4))); document.getElementById('p2').click(); return r; });
 for(const x of out) console.log(x); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.screenshot({path:'s61.png',fullPage:true});
 await p.evaluate(()=>document.getElementById('p3').click()); const el=await p.$('#c'); await el.screenshot({path:'s61p.png'});
 await b.close(); })();
