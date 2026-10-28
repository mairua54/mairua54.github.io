// 14-1-5: two equal-mass spheres hung from one point. The equilibrium is solved again here in another variable
// (s = sin θ: k|q1||q2|/(4L²s²) = mg·s/√(1 - s²)) and compared with every number the page shows.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t15.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-1-5.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], k=9.0e9, g=10; let worst=0;
  const num=s=>{ const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const close=(a,b,rel)=>Math.abs(a-b)<=rel*Math.abs(b)+1e-12;
  const sf3=(d,v)=>Math.abs(d-v)<=0.5*Math.pow(10,Math.floor(Math.log10(Math.abs(v)))-2)*1.001+1e-12;   // d is v shown with 3 significant figures
  function indep(q1,q2,m,L){ const Q=k*q1*q2*1e-12, mg=m/1000*g; if(Q===0) return {th:0,r:0,F:0,mg,T:mg};
    const f=s=>Q/(4*L*L*s*s)-mg*s/Math.sqrt(1-s*s); let a=1e-12,c=1-1e-15; for(let i=0;i<300;i++){ const mm=(a+c)/2; if(f(mm)>0) a=mm; else c=mm; }
    const s=(a+c)/2, r=2*L*s, F=Q/(r*r); return {th:Math.asin(s)*180/Math.PI,r,F,mg,T:Math.hypot(F,mg)}; }
  function check(tag){
   const st=S.st, w=indep(st.q1,st.q2,st.m,st.L), eq=T('eq'), body=document.body.innerText;
   if(/NaN|Infinity|undefined/.test(body)) bad.push([tag,'bad text']);
   const mg=eq.match(/mg = \(([\d.]+) kg\)\(10 m\/s2\) = ([\d.]+) N/); if(!mg||!close(num(mg[2]),w.mg,0.002)||!close(+mg[1],st.m/1000,1e-9)) bad.push([tag,'mg',eq]);
   if(w.th===0){ if(!/θ = 0°/.test(eq)||!/แนวดิ่ง/.test(T('status'))) bad.push([tag,'zero case',eq]); return; }
   const th=eq.match(/พร้อมกัน ได้ θ = ([\d.]+)°/), r=eq.match(/sin [\d.]+° = ([\d.]+) m/), F=eq.match(/\/\(([\d.]+)\)2 = ([^N]+?) N/), Tm=eq.match(/= ([\d.]+(?: × 10-?\d+)?) N$/), tn=eq.match(/ตรวจสมดุล: tan ([\d.]+)° = ([\d.]+(?: × 10-?\d+)?) และ FE\/mg = [\d.]+ N\/[\d.]+ N = ([\d.]+(?: × 10-?\d+)?)( \(สองค่านี้ต่างกันเพราะปัดเศษของ θ, r และ FE\))?/);
   if(!th||Math.abs(+th[1]-w.th)>0.051) bad.push([tag,'theta',th&&th[1],w.th]);
   if(!r||!sf3(+r[1],w.r)) bad.push([tag,'r',r&&r[1],w.r]);
   // later steps use the values as shown, like the sheet
   const Fd=F?k*st.q1*st.q2*1e-12/(+r[1])**2:NaN, mgd=mg?num(mg[2]):NaN;
   if(!F||+F[1]!==+r[1]||!sf3(num(F[2]),Fd)||!close(Fd,w.F,0.012)) bad.push([tag,'F',F&&F[2],Fd,w.F]);   // r is shown with 3 figures, so F from the shown r can differ by about 1 %
   const Fs=F?num(F[2]):NaN;
   if(!Tm||!sf3(num(Tm[1]),Math.hypot(Fs,mgd))) bad.push([tag,'T',Tm&&Tm[1],Math.hypot(Fs,mgd)]);
   if(tn) worst=Math.max(worst,Math.abs(num(tn[2])-num(tn[3]))/num(tn[3]));
   if(!tn||+tn[1]!==+th[1]||!sf3(num(tn[2]),Math.tan(+tn[1]*Math.PI/180))||!sf3(num(tn[3]),Fs/mgd)||!close(num(tn[2]),num(tn[3]),0.04)||(tn[2]!==tn[3])!==!!tn[3+1]) bad.push([tag,'tan check',tn&&tn[0],Fs/mgd,w.th]);
   const res=T('res'); if(!res.includes(`${(+th[1]).toFixed(1)}°`)||!res.includes(r[1]+' m')) bad.push([tag,'res',res]);
   const sta=T('status'); if(!/มุมเท่ากัน/.test(sta)||(st.q1!==st.q2)!==/แม้ประจุไม่เท่ากัน/.test(sta)) bad.push([tag,'status',sta]);
   // drawing: the spheres sit symmetrically about the vertical through the pivot and at the solved angle
   const c=[...$('f').querySelectorAll('circle')]; if(c.length!==2) bad.push([tag,'spheres',c.length]);
   else { const [a,d]=c.map(e=>[+e.getAttribute('cx'),+e.getAttribute('cy')]); if(Math.abs((a[0]+d[0])/2-190)>0.2||Math.abs(a[1]-d[1])>0.01) bad.push([tag,'symmetry',a,d]);
     const ang=Math.atan2(d[0]-190,d[1]-26)*180/Math.PI; if(d[0]-190>12.5&&Math.abs(ang-w.th)>0.05) bad.push([tag,'drawn angle',ang,w.th]); }
   // drawing: on the right sphere |F_E|/|mg| = tan θ
   const lines=[...$('f').querySelectorAll('line')], len=col=>{ const l=lines.filter(e=>e.getAttribute('stroke')===col); return l.map(e=>Math.hypot(e.getAttribute('x2')-e.getAttribute('x1'),e.getAttribute('y2')-e.getAttribute('y1'))+6); };
   const fF=len('var(--force)'), fM=len('var(--weight)'); if(fF.length!==2||fM.length!==1||Math.abs(fF[0]-fF[1])>0.01||Math.min(fF[0],fM[0])<11.99) bad.push([tag,'arrows',fF,fM]);
   else if(fF[0]>12.01&&fM[0]>12.01&&!close(fF[0]/fM[0],w.F/w.mg,0.02)) bad.push([tag,'arrow ratio',fF,fM,w.F/w.mg]);
  }
  // Ex. 1.10
  $('b-ex').click(); notes.push('Ex 1.10: '+T('eq')+' || '+T('res')); check('ex');
  if(!/= 0\.600 m/.test(T('eq'))||!/= 0\.225 N/.test(T('eq'))||!/θ = 36\.9°/.test(T('eq'))) bad.push('Ex 1.10 values');
  // ลองทำ
  Object.assign(S.st,{q1:1,q2:4,m:30,L:0.5}); S.sync(); notes.push('try1: '+T('res')+' || '+T('status')); if(!/28\.2°/.test(T('res'))||!/0\.161 N/.test(T('status'))) bad.push('try1');
  for(const q of [2,4]){ Object.assign(S.st,{q1:q,q2:q,m:30,L:0.5}); S.sync(); notes.push('try3 q='+q+': '+T('res')+' F='+T('eq').match(/= ([\d.]+) N mg/)[1]); }
  // sweep and extremes
  let n=0;
  for(const q1 of [0,0.1,1,2.5,5]) for(const q2 of [0,0.1,3,5]) for(const m of [1,7,30,50]) for(const L of [0.2,0.55,1]){ Object.assign(S.st,{q1,q2,m,L}); S.sync(); check([q1,q2,m,L]); n++; }
  notes.push('cases '+n);
  // random use of the controls
  for(let i=0;i<1500;i++){ const id=['s-q1','s-q2','s-m','s-L','b-ex'][Math.floor(Math.random()*5)], e=$(id);
    if(e.type==='range'){ e.value=+e.min+Math.random()*(e.max-e.min); e.dispatchEvent(new Event('input')); } else e.click(); check(['random',i,id]); }
  notes.push('largest relative difference between tan θ and F/mg on the check line: '+(100*worst).toFixed(2)+' %');
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 console.log('errors',errs); await b.close(); })();
