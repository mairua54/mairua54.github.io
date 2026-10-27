const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-5-3.html'); await p.waitForTimeout(500); await p.evaluate(()=>document.documentElement.classList.add('flat'));   // stacked fractions read as a/b, the same text as before they were stacked
 const out=await p.evaluate(()=>{ const S=window.__sim, r=[]; const eq=()=>document.getElementById('eq').innerText.replace(/\n/g,' | ');
  r.push('Ex5.5: '+eq()); document.getElementById('b-eq').click(); r.push('R=r: '+eq()+' || '+document.getElementById('status').innerText);
  const bad=[]; for(let e=1.5;e<=12;e+=3.5) for(let rr=0.1;rr<=4;rr+=0.65){ S.st.e=e; S.st.r=Number(rr.toFixed(2));
    // numeric max over a fine grid must be at R = r
    let best=0,bR=0; for(let R=0;R<=20;R+=0.001){ const P=S.PR(R); if(P>best){best=P;bR=R;} } if(Math.abs(bR-S.st.r)>0.002) bad.push(['max',e,rr,bR]);
    if(Math.abs(best-e*e/(4*S.st.r))/best>1e-6) bad.push(['Pmax',e,rr]);
    for(const R of [0,0.5,2,5.5,10,20]){ S.st.R=R; S.sync(); const t=document.getElementById('eq').innerText.split('\n').map(l=>Number(l.split(' (')[0].split('= ').pop().replace(/ (W|A|%)$/,'').replace(/\s/g,'')));
      const [I,Pe,PRd,Pr]=t; const Iex=e/(R+S.st.r); if(Math.abs(I-Iex)/Iex>0.006) bad.push(['I',e,rr,R]);
      if(Math.abs(Pe-(PRd+Pr))>0.006*Pe+1e-9) bad.push(['sum',e,rr,R,Pe,PRd,Pr]);
      if(R>0 && Math.abs(PRd-S.PR(R))/S.PR(R)>0.012) bad.push(['PR',e,rr,R,PRd,S.PR(R)]); } }
  r.push('bad '+bad.length+' '+JSON.stringify(bad.slice(0,5))); S.st.e=12;S.st.r=0.5;S.st.R=5.5;S.sync(); return r; });
 for(const x of out) console.log(x); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.screenshot({path:'s53.png',fullPage:true}); await b.close(); })();
