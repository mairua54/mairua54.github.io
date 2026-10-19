// Independent physics check of the 4.3 simulation: sweeps parameters, recomputes everything from Kirchhoff's loop rule, compares with what the page shows.
const { chromium } = require('playwright');
const sig3=x=>{ if(Math.abs(x)<1e-12) return 0; return Number(x.toPrecision(3)); };
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims/15-4-3.html')); await p.waitForTimeout(500);
 const E=[1.5,6,12], Rr=[0,0.05,0.5,2], RR=[0.5,2.5,5.5,20], CH=[1.5,6,11.5,12,12.5,17.5,18,24];
 const cases=[]; for(const e of E)for(const r of Rr)for(const R of RR){ cases.push({mode:'sup',e,r,R}); for(const ch of CH) cases.push({mode:'chg',e,r,R,ch}); }
 let fails=[], n=0;
 for(const c of cases){
  await p.evaluate(c=>{
   const set=(id,v)=>{const el=document.getElementById(id); el.value=v; el.dispatchEvent(new Event('input'));};
   document.getElementById(c.mode==='sup'?'m-sup':'m-chg').click();
   set('s-emf',c.e); set('s-r',c.r); set('s-R',c.R); if(c.ch!==undefined) set('s-ch',c.ch);
  },c);
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const got=await p.evaluate(c=>{
   const line=[...document.querySelectorAll('#graph polyline')].pop().getAttribute('points').trim().split(' ').map(q=>q.split(',').map(Number));
   const ymax=c.mode==='sup'?14:24, V=line.map(([x,y])=>(206-y)*ymax/180);
   const arrows=[...document.querySelectorAll('#circ path')].filter(a=>a.style.display!=='none').map(a=>a.getAttribute('transform'));
   return {eq:document.getElementById('eq').innerText, status:document.getElementById('status').innerText,
     meter:document.querySelector('#circ').textContent, legend:document.getElementById('glegend').textContent,
     en:document.getElementById('en-leg').innerText+' | '+document.getElementById('en-head').innerText, V, arrows};
  },c);
  n++;
  const f=m=>fails.push(JSON.stringify(c)+' :: '+m);
  // reference: signed current j>0 when current inside battery flows - -> + ; charger ideal, + to +
  const Vc=c.mode==='sup'?0:c.ch, j=(c.e-Vc)/(c.R+c.r), I=Math.abs(j);
  const VA=c.e-j*c.r;                       // V+ - V- from loop rule (exact)
  // 1) current
  const nums=got.eq.replace(/,/g,'').match(/-?\d+(\.\d+)?/g).map(Number);
  const Iline=got.eq.split('\n').find(l=>l.startsWith('I ='));
  const Ishown=Number(Iline.trim().split('= ').pop().replace(' A',''));
  if(Math.abs(Ishown-sig3(I))>1e-9) f(`I shown ${Ishown} expected ${sig3(I)}`);
  // 2) terminal voltage line and formula choice
  const Vline=got.eq.split('\n').find(l=>l.startsWith('V'));
  const Vshown=Number(Vline.trim().split('= ').pop().replace(' V',''));
  if(Math.abs(Vshown-VA)>0.051*Math.max(1,VA/10)) f(`V+-V- shown ${Vshown} exact ${VA}`);
  const plus=/ε \+ Ir/.test(Vline), minus=/ε - Ir/.test(Vline);
  if(I>1e-9 && j>0 && !minus) f('should use ε - Ir'); if(I>1e-9 && j<0 && !plus) f('should use ε + Ir');
  if(I<1e-9 && (plus||minus)) f('I=0 should give ε');
  // 3) meter equals V line, legend equals V line
  if(!got.meter.includes('อ่านได้ '+Vline.trim().split('= ').pop())) f('meter mismatch');
  if(I>1e-9 && !got.legend.includes('= '+Vline.trim().split('= ').pop())) f('legend mismatch '+got.legend);
  // 4) status text
  const st=got.status;
  if(I<1e-9){ if(!st.includes('ไม่มีกระแส')) f('status I=0'); }
  else if(j>0){ if(!st.includes('จากขั้วลบไปขั้วบวก')) f('status dir'); if(c.mode==='chg' && !st.includes('ไหลย้อนทาง')) f('reverse msg missing'); }
  else { if(!st.includes('จากขั้วบวกไปขั้วลบ')) f('status dir (charging)'); }
  // 5) graph: potentials along D->A->B->C->D, point order from SEG (2 points per segment)
  const V=got.V, tol=1e-6;
  const ex=[0,0, 0,c.e, c.e,c.e, c.e,VA, VA,VA, VA,VA, VA,VA-j*c.R, Vc,Vc, Vc,0, 0,0];
  if(V.length!==ex.length) f('graph point count '+V.length);
  else ex.forEach((v,k)=>{ if(Math.abs(V[k]-v)>tol) f(`graph pt ${k}: ${V[k].toFixed(4)} vs ${v.toFixed(4)}`); });
  // Kirchhoff: sum of potential changes around the loop = 0 (C from R end must equal charger top)
  if(Math.abs((VA-j*c.R)-Vc)>1e-9) f('loop rule broken');
  // 6) energy per coulomb: supply part + heat = ε (supplying) ; chem + heat = V+-V- (charging)
  const en=got.en.replace(/,/g,''); const Js=[...en.matchAll(/= (-?\d+(?:\.\d+)?) J/g)].map(m=>Number(m[1]));
  if(I>1e-9){
    if(j>0){ const [out,heat,tot]=[Js[0],Js[1],Js[2]]; if(Math.abs(out+heat-tot)>0.0501*Math.max(1,tot/10)) f(`energy sum ${out}+${heat}!=${tot}`); if(Math.abs(tot-c.e)>1e-9) f('energy total != ε'); }
    else { const [chem,heat,tot]=[Js[0],Js[1],Js[2]]; if(Math.abs(chem+heat-tot)>0.0501*Math.max(1,tot/10)) f(`energy sum ${chem}+${heat}!=${tot}`); if(Math.abs(chem-c.e)>1e-9) f('chem != ε'); }
  }
  // 7) arrow direction on the left wire (x=40): up (-90°) when j>0, down (90°) when j<0
  const left=got.arrows.filter(t=>{const m=t.match(/translate\(([\d.]+),([\d.]+)\)/); return +m[1]===40 && +m[2]>60 && +m[2]<172;});
  if(I>1e-9){ if(!left.length) f('no arrow on left wire');
    for(const t of left){ const a=Number(t.match(/rotate\((-?[\d.]+)\)/)[1]); const want=j>0?-90:90;
      if(Math.abs(((a-want)%360+540)%360-180)>0.5) f(`arrow angle ${a} want ${want}`); } }
  else if(got.arrows.length) f('arrows shown with I=0');
 }
 console.log('cases',n,'failures',fails.length,'page errors',errs.filter(e=>!/TUNNEL/.test(e)));
 console.log(fails.slice(0,30).join('\n'));
 await b.close();
})();
