const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-6-4.html'); await p.waitForTimeout(500); await p.evaluate(()=>document.documentElement.classList.add('flat'));   // stacked fractions read as a/b, the same text as before they were stacked
 const out=await p.evaluate(()=>{ const S=window.__sim, r=[]; const eq=()=>document.getElementById('eq').innerText.replace(/\n/g,' | ');
  S.setTab('a'); r.push('A: '+eq()); S.setTab('v'); r.push('V 10k: '+eq()); S.st.v.RV=1e6; S.update(); r.push('V 1M: '+eq());
  S.setTab('r'); r.push('R100 c1: '+eq()); S.st.r.cfg=2; S.update(); r.push('R100 c2: '+eq()); S.st.r.R=1e4; S.update(); r.push('R10k c2: '+eq());
  // independent checks via nodal reasoning
  const bad=[]; const par=(a,b)=>a*b/(a+b);
  for(const R of [1,10,50]) for(const RA of [0,0.5,5]){ Object.assign(S.st.a,{R,RA}); S.st.tab='a'; const x=S.results(); if(Math.abs(x.I-1.5/(R+RA))>1e-12) bad.push('a'); }
  for(const R of [10,1e3,1e4,1e5]) for(const RV of [1e3,1e4,1e6,1e7]){ Object.assign(S.st.v,{R,RV}); S.st.tab='v'; const x=S.results();
    // two-node solution: node between R1 and R2 at potential V; (12-V)/R = V/R + V/RV
    const V=12*(1/R)/(2/R+1/RV); if(Math.abs(x.V-V)>1e-9) bad.push(['v',R,RV,x.V,V]); }
  for(const R of [1,100,1e4]) for(const RA of [0,1,5]) for(const RV of [1e3,1e4,1e7]){ Object.assign(S.st.r,{R,RA,RV}); S.st.tab='r'; const x=S.results();
    // config1: I through ammeter = 6/(RA + R∥RV); V = I*(R∥RV); config2: I = 6/(R+RA), V = 6
    const I1=6/(RA+par(R,RV)), V1=I1*par(R,RV); if(Math.abs(x.R1-V1/I1)>1e-9*R) bad.push('c1');
    if(Math.abs(x.R2-6/(6/(R+RA)))>1e-9*R) bad.push('c2'); if(!(x.R1<=R && x.R2>=R)) bad.push('order'); }
  r.push('bad '+bad.length+' '+JSON.stringify(bad.slice(0,3))); return r; });
 for(const x of out) console.log(x); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 for(const t of ['a','v','r']){ await p.evaluate(t=>{ const S=window.__sim; S.setTab(t); if(t==='r'){S.st.r.R=100;S.st.r.cfg=1;S.update();} },t); const el=await p.$('#c'); await el.screenshot({path:'s64'+t+'.png'}); }
 await b.close(); })();
