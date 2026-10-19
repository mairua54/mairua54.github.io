const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-1-5.html'); await p.waitForTimeout(800);
 const res=await p.evaluate(()=>{ const S=window.__sim; S.st.paused=true; const out=[];
  for(const I of [1,2,3]) for(const h of [0.2,0.5,1.0]){ S.st.I=I; S.st.h=h; S.fill(); S.reset();
    const ins=[]; let maxd=0; for(let i=0;i<120*60;i++){ S.stepA(1/120); const c=S.counts(); maxd=Math.max(maxd,Math.abs(c.cX-c.cY)); if(i%120===0) ins.push(c.inside); }
    const c=S.counts(); const mean=ins.reduce((a,b)=>a+b,0)/ins.length, sd=Math.sqrt(ins.reduce((a,b)=>a+(b-mean)**2,0)/ins.length);
    out.push({I,h,maxDiffXY:maxd,X:c.cX,Y:c.cY,expected:[0,26,52,78][I]*60,insideMean:+mean.toFixed(1),insideSD:+sd.toFixed(1)}); }
  // junction
  const bad=[]; for(let a=0;a<=6;a+=0.5) for(let b=0;b<=6;b+=0.5){ S.setI(a,b); const eq=document.getElementById('eq').innerText; const st=document.getElementById('status-b').innerText;
    const i3=b-a; const shown=Number(eq.split('\n')[2].split('= ').pop().replace(' A',''));
    if(Math.abs(shown-i3)>1e-9) bad.push([a,b,shown]);
    if(i3<0 && !st.includes('ไหลออกจากจุด P')) bad.push([a,b,'dir']); if(i3>0 && !st.includes('ไหลเข้าจุด P')) bad.push([a,b,'dir+']);
    const f=S.flows(); if(Math.abs((-f[1])-(f[2]+f[3]))>1e-9) bad.push([a,b,'kcl']); }
  S.setI(4,1.5); out.push({ex14:document.getElementById('eq').innerText.split('\n')[2], status:document.getElementById('status-b').innerText});
  out.push({junctionBad:bad.length}); return out; });
 for(const r of res) console.log(JSON.stringify(r));
 console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.evaluate(()=>{window.__sim.st.paused=false;}); await p.waitForTimeout(1500);
 await p.screenshot({path:'s15.png',fullPage:true}); await b.close(); })();
