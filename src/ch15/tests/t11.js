const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-1-1.html'); await p.waitForTimeout(800); await p.evaluate(()=>document.documentElement.classList.add('flat'));   // stacked fractions read as a/b, the same text as before they were stacked
 const res=await p.evaluate(()=>{ const S=window.__sim; S.st.paused=true; const out=[];
   const run=(on,E,T,secs)=>{ S.st.on=on; S.st.E=E; S.st.T=T; for(let i=0;i<120*20;i++) S.step(1/120); // settle 20 s
     S.resetCount(); let sum=0,n=0; for(let i=0;i<120*secs;i++){ S.step(1/120); if(i%12===0){ sum+=S.stats().meanVx; n++; } }
     const s=S.stats(); return {on,E,T,drift:sum/n/s.V0,net:s.crossL-s.crossR,L:s.crossL,R:s.crossR}; };
   out.push(run(false,2,2,300)); for(const E of [1,2,3]) out.push(run(true,E,2,300)); for(const T of [1,3]) out.push(run(true,2,T,300));
   return out; });
 for(const r of res) console.log(JSON.stringify(r));
 console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.screenshot({path:'s11.png',fullPage:true}); await b.close(); })();
