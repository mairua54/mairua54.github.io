const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-4-4.html'); await p.waitForTimeout(500);
 const out=await p.evaluate(()=>{ const S=window.__sim, r=[]; const eq=()=>document.getElementById('eq').innerText.replace(/\n/g,' | ');
  r.push('Ex4.6 R=2: '+eq()); S.st.R=11; S.sync(); r.push('R=11: '+eq());
  Object.assign(S.st,{e:3,r:0.5,R:1}); S.sync(); r.push('Ex4.7a: '+eq()); S.st.R=2.5; S.sync(); r.push('Ex4.7b: '+eq());
  S.st.R=0; S.sync(); r.push('R=0: '+eq());
  const bad=[]; for(let e=1.5;e<=12;e+=1.5) for(let rr=0.1;rr<=2.01;rr+=0.3) for(let R=0;R<=30;R+=2.5){ Object.assign(S.st,{e,r:rr,R}); S.sync();
    const t=document.getElementById('eq').innerText.split('\n'); const I=Number(t[0].split('= ').pop().replace(' A',''));
    const Iex=e/(R+rr); if(Math.abs(I-Iex)/Iex>0.006) bad.push(['I',e,rr,R,I,Iex]);
    if(R>0){ const V=Number(t[1].split('= ').pop().replace(' V','')); const Vex=e-Iex*rr; if(Math.abs(V-Vex)>Math.max(0.006*Vex,0.002)) bad.push(['V',e,rr,R,V,Vex]);
      const Rr=Number(t[2].split('= ').pop().split(' Ω')[0]); if(Math.abs(Rr-R)/R>0.012) bad.push(['R',e,rr,R,Rr]); } }
  r.push('bad '+bad.length+' '+JSON.stringify(bad.slice(0,5)));
  Object.assign(S.st,{e:6,r:1,R:2,pts:[]}); S.sync(); document.getElementById('b-act').click(); return r; });
 for(const x of out) console.log(x); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.screenshot({path:'s44.png',fullPage:true}); await b.close(); })();
