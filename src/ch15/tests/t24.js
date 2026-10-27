const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/15-2-4.html'); await p.waitForTimeout(600); await p.evaluate(()=>document.documentElement.classList.add('flat'));   // stacked fractions read as a/b, the same text as before they were stacked
 const out=await p.evaluate(()=>{ const S=window.__sim, r=[]; const eq=()=>document.getElementById('eq').innerText.replace(/\n/g,' | ');
  document.getElementById('p-ex').click(); r.push('Ex2.4: '+eq());
  Object.assign(S.st,{l:4.0}); S.sync(); r.push('l=4: '+eq().split(' | ')[1]);
  Object.assign(S.st,{l:2.0,A:1.0}); S.sync(); r.push('A=1: '+eq().split(' | ')[1]);
  document.getElementById('p-cu').click(); r.push('Cu: '+eq().split(' | ')[1]);
  Object.assign(S.st,{mode:'pull',mat:1,l:2,A:1,k:2}); S.sync(); r.push('pull k2: '+eq()+' || '+document.getElementById('bars').innerText.replace(/\n/g,' '));
  const bad=[]; for(let mi=0;mi<S.MAT.length;mi++) for(const l of [0.1,1,2.5,10]) for(const A of [0.1,0.5,1.5,4]) for(const mode of ['new','pull']) for(const k of [1,1.5,2,4]){
     Object.assign(S.st,{mat:mi,l,A,mode,k}); S.sync(); const c=S.calc(); const rho=S.MAT[mi][1];
     const Rexp = mode==='new'? rho*l/(A*1e-6) : rho*(k*l)/(A*1e-6/k);
     if(Math.abs(c.R-Rexp)/Rexp>1e-12) bad.push([mi,l,A,mode,k]);
     if(mode==='pull' && Math.abs(c.R/c.R0-k*k)>1e-9) bad.push('k2');
     const shown=Number(document.getElementById('eq').innerText.split('\n')[mode==='new'?1:2].split('= ').pop().replace(' Ω','').replace(/ × 10(-?\d+)/,'e$1').replace(/\s/g,''));
     if(Math.abs(shown-Rexp)/Rexp>(S.MAT[mi][2]===2?0.05:0.006)) bad.push(['shown',mi,l,A,mode,k,shown,Rexp]); }
  r.push('bad '+bad.length+' '+JSON.stringify(bad.slice(0,4))); return r; });
 for(const x of out) console.log(x); console.log('errors',errs.filter(e=>!/TUNNEL/.test(e)));
 await p.screenshot({path:'s24.png',fullPage:true}); await b.close(); })();
