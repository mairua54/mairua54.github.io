const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-2-2.html'); await p.waitForTimeout(600);
 const out=await p.evaluate(()=>{ const S=window.__sim, r=[]; const eq=()=>document.getElementById('eq').innerText.replace(/\n/g,' | ');
  // Ex 2.2
  S.setDev('res'); S.st.R=20; S.st.I.res=0.20; S.sync(); r.push('X: '+eq()); S.st.swap=true; S.update(); r.push('X swap: '+eq());
  S.st.R=10; S.st.I.res=0.40; S.sync(); r.push('Y swap: '+eq()); S.st.swap=false;
  // Ex 2.3
  S.setDev('dio'); S.st.I.dio=0.002; S.sync(); r.push('P: '+eq()); S.st.I.dio=0.020; S.sync(); r.push('Q: '+eq());
  S.setDev('lamp'); S.st.I.lamp=0.5; S.sync(); r.push('lamp 0.5: '+eq()); S.st.I.lamp=0.1; S.sync(); r.push('lamp 0.1: '+eq());
  // sweep: model checks (tangent derivative numeric, R from displayed, curve monotonic)
  const bad=[]; for(const dev of ['res','lamp','dio']){ S.setDev(dev); const D=S.DEV[dev];
    for(const R of (dev==='res'?[5,20,50]:[0])){ if(dev==='res') S.st.R=R;
      for(let I=D.Imin; I<=D.Imax+1e-12; I+=D.step){ S.st.I[dev]=I; S.sync(); const sh=S.shown();
        const h=I*1e-4, num=(D.V(I+h)-D.V(I-h))/(2*h); if(Math.abs(num-D.dV(I))/D.dV(I)>1e-4) bad.push([dev,I,'dV']);
        const t=document.getElementById('eq').innerText.split('\n')[1]; const Rshown=t.split('= ').pop();
        if(D.V(I+D.step)<=D.V(I)) bad.push([dev,I,'mono']);
        if(dev==='res' && !document.getElementById('eq').innerText.includes('เท่ากับ ΔV/I')) bad.push([dev,I,'ohmic tangent']);
        if(dev!=='res' && !document.getElementById('eq').innerText.includes('ไม่เท่ากับ ΔV/I')) bad.push([dev,I,'tangent≠R']);
      } } }
  r.push('bad '+JSON.stringify(bad.slice(0,8))+' n='+bad.length); return r; });
 for(const x of out) console.log(x); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.evaluate(()=>{ const S=window.__sim; S.setDev('dio'); S.st.I.dio=0.020; S.sync(); });
 await p.screenshot({path:'s22.png',fullPage:true}); await b.close(); })();
