// 14-1-4: forces on q0 from two point charges on a line, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t14.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900},deviceScaleFactor:2});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-1-4.html'); await p.waitForTimeout(500);
 const out=await p.evaluate(()=>{
  const S=window.__sim, $=id=>document.getElementById(id);
  document.documentElement.classList.add('flat');   // stacked fractions read as a/b and square roots as √(…)
  const T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const k=9.0e9, bad=[], notes=[];
  // ---- independent physics ----
  function indep(q1,q2,d,s0,x){ // returns signed components (N) on q0 = s0 × 1.0 μC
    const f=(q,xc)=>{ if(q===0) return 0; const r=Math.abs(x-xc), mag=k*Math.abs(q)*1e-6*1e-6/(r*r);
      const repel=(q>0)===(s0>0); const away=Math.sign(x-xc); return mag*(repel?away:-away); };
    return [f(q1,0),f(q2,d)]; }
  function rootScan(q1,q2,d){ // all x where the resultant vanishes, by sign changes on a fine grid + bisection
    const g=x=>{ const [a,b]=indep(q1,q2,d,1,x); return a+b; }, roots=[];
    const xs=[]; for(let i=0;i<=40000;i++) xs.push(-60*d+i*(121*d)/40000);
    for(let i=0;i<xs.length-1;i++){ let a=xs[i], c=xs[i+1]; if(Math.abs(a)<1e-9||Math.abs(a-d)<1e-9||(a<0&&c>0)||(a<d&&c>d)) continue;
      const ga=g(a), gc=g(c); if(ga===0){ roots.push(a); continue; } if(ga*gc<0){ for(let j=0;j<80;j++){ const mm=(a+c)/2; if(g(a)*g(mm)<=0) c=mm; else a=mm; } roots.push((a+c)/2); } }
    return roots; }
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits (floating-point noise such as 674999.99999 must still give 6.8 × 10^5)
  const r2=v=>rd(v,2);
  const num=s=>{ const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); if(!m) return NaN; return Number(m[1])*(m[2]?Math.pow(10,+m[2]):1); };
  const near2=(disp,v)=>{ if(v===0) return disp===0; const u=Math.pow(10,Math.floor(Math.log10(Math.abs(v)))-1); return Math.abs(disp-Math.abs(v))<=0.5*u*1.0001+1e-15; };
  function check(tag){
   const st=S.st, [F1,F2]=indep(st.q1,st.q2,st.d,st.s0,st.x), FR=F1+F2, Fm=Math.max(Math.abs(F1),Math.abs(F2)), Fm1=Fm||1;
   const body=document.body.innerText;
   if(/NaN|Infinity|undefined|= –|\(–\)|– N|– m/.test(body)) bad.push([tag,'bad text']);
   const eq=T('eq'), res=T('res'), status=T('status');
   // forces F1 and F2
   for(const [i,F,q] of [[1,F1,st.q1],[2,F2,st.q2]]){
     if(q===0){ if(!new RegExp('F'+i+' = 0 \\(q'+i+' = 0').test(eq)) bad.push([tag,'F'+i+' zero line',eq]); continue; }
     const m=eq.match(new RegExp('F'+i+' = k│q'+i+'││q0│/r'+i+'2 = .*? = ([^N]+?) N ทาง ([+-]x) \\(q'+i+' (ผลัก|ดูด) q0\\)'));
     if(!m){ bad.push([tag,'F'+i+' line',eq]); continue; }
     if(!near2(num(m[1]),F)) bad.push([tag,'F'+i,m[1],F]);
     if((F>0?'+x':'-x')!==m[2]) bad.push([tag,'dir'+i,m[2],F]);
     if((m[3]==='ผลัก')!==((q>0)===(st.s0>0))) bad.push([tag,'push'+i]);
     const rr=Math.abs(st.x-(i===1?0:st.d)); const rm=eq.match(new RegExp('F'+i+' = .*?/\\(([\\d.]+)\\)2 = ([^N]+?) N'));
     if(!rm||Math.abs(+rm[1]-rr)>0.0051) bad.push([tag,'r'+i,rm&&rm[1],rr]);
   }
   // resultant: sum of the rounded values, as in the sheet
   if(st.q1!==0&&st.q2!==0){ const m=eq.match(/FR = \(([^)]*)\) \+ \(([^)]*)\) = (0|[+-][^N]+? N)/);
     if(!m) bad.push([tag,'FR line',eq]); else { const a=num(m[1].replace('+','')), c=num(m[2].replace('+','')), s=m[3]==='0'?0:num(m[3].replace(' N','').replace('+',''));
       if(!near2(Math.abs(a),F1)||!near2(Math.abs(c),F2)) bad.push([tag,'FR parts',m[1],m[2]]);
       const sum=Math.sign(F1)*Math.abs(a)+Math.sign(F2)*Math.abs(c); // the next step uses the values as displayed if(Math.abs(sum)<1e-12*Fm1 ? s!==0 : !(Math.sign(s)===Math.sign(sum)&&near2(Math.abs(s),sum))) bad.push([tag,'FR sum',m[0],sum]);
       if(s!==0 && Math.sign(s)!==Math.sign(FR)) bad.push([tag,'FR sign',s,FR]); } }
   const isZero = Fm===0 || Math.abs(FR)<=1e-9*Fm;
   if(isZero!==(/เป็นศูนย์/.test(res)&&!/เกือบ/.test(res))) bad.push([tag,'res zero?',res,FR]);
   if(!isZero){ const m=res.match(/(?:ขนาด|ประมาณ) ([^N]+?) N ทาง ([+-]x)/); if(!m||(FR>0?'+x':'-x')!==m[2]) bad.push([tag,'res dir',res,FR]); }
   // zero point
   const roots=rootScan(st.q1,st.q2,st.d), zq=T('zq');
   if(st.show){
     if(st.q1===0&&st.q2===0){ if(zq!=='') bad.push([tag,'zq none']); }
     else if(roots.length===0){ if(!/ไม่มีตำแหน่ง/.test(zq)) bad.push([tag,'zq should be none',zq]); }
     else { if(roots.length!==1) bad.push([tag,'roots',roots]); const m=zq.match(/x = (-?[\d.]+) m/); if(!m||Math.abs(+m[1]-roots[0])>0.0051) bad.push([tag,'zero x',m&&m[1],roots[0]]);
       const w=S.win(); const inside=roots[0]>=w.lo&&roots[0]<=w.hi; if(inside!==!/นอกภาพ/.test(zq)) bad.push([tag,'offscreen flag',roots[0],zq]);
       const ratio=zq.match(/= √\(([\d.]+)\/([\d.]+)\) = ([\d.]+)/); if(!ratio||Math.abs(+ratio[3]-r2(Math.sqrt(Math.abs(st.q2)/Math.abs(st.q1))))>1e-9) bad.push([tag,'ratio',zq]);
       const between=roots[0]>0&&roots[0]<st.d; if(between!==/ระหว่างประจุ/.test(zq)) bad.push([tag,'zero region text',zq]);
       const nearSmall=Math.abs(roots[0])<Math.abs(roots[0]-st.d) ? Math.abs(st.q1)<=Math.abs(st.q2) : Math.abs(st.q2)<=Math.abs(st.q1);
       if(!nearSmall) bad.push([tag,'zero not near smaller charge',roots[0]]); } }
   // status text: which statement applies, decided independently
   const reg=st.x<0?'L':st.x>st.d?'R':'M', regText={L:'ทางซ้ายของ q1',M:'ระหว่าง q1 กับ q2',R:'ทางขวาของ q2'}[reg];
   let want;
   if(st.q1===0&&st.q2===0) want='ยังไม่มีประจุ';
   else if(st.q1===0||st.q2===0) want='มีประจุเพียงตัวเดียว';
   else if(isZero) want='มีขนาดเท่ากัน ทิศตรงข้าม';
   else if(Math.sign(F1)===Math.sign(F2)) want='ชี้ไปทางเดียวกัน';
   else if(roots.length===0) want='ประจุสองตัวมีขนาดเท่ากัน';
   else { const rreg=roots[0]<0?'L':roots[0]>st.d?'R':'M';
     if(rreg===reg) want=/ชี้สวนกันและเกือบเท่ากัน/.test(status)?'เกือบเท่ากัน':'ตำแหน่งที่แรงลัพธ์เป็นศูนย์อยู่ในช่วงนี้';
     else { want='ใกล้ประจุที่มีขนาดใหญ่กว่า'; const nearer=Math.abs(st.x)<Math.abs(st.x-st.d)?Math.abs(st.q1):Math.abs(st.q2), other=Math.abs(st.x)<Math.abs(st.x-st.d)?Math.abs(st.q2):Math.abs(st.q1); if(!(nearer>other)) bad.push([tag,'claim nearer is larger false']); } }
   if(!status.includes(want)) bad.push([tag,'status',want,status]);
   if(!/ยังไม่มีประจุ|มีประจุเพียงตัวเดียว|มีขนาดเท่ากัน ทิศตรงข้าม/.test(status) && !status.includes('q0 อยู่'+regText)) bad.push([tag,'status region',regText,status]);
   if(want==='เกือบเท่ากัน' && !/= 0 /.test(eq+' ')) bad.push([tag,'nearly-equal claim',eq]);
   // arrows: direction and length ratio at this point
   const G=$('f'), arr=c=>[...G.querySelectorAll('line')].filter(l=>l.getAttribute('stroke')===c);
   for(const [c,F] of [['var(--f1)',F1],['var(--f2)',F2],['var(--fnet)',isZero?0:FR]]){
     const L=arr(c); if(F===0){ if(L.length) bad.push([tag,'arrow should be absent',c]); continue; }
     if(L.length!==1){ bad.push([tag,'arrow count',c,L.length]); continue; }
     const dx=+L[0].getAttribute('x2')-+L[0].getAttribute('x1'); if(Math.sign(dx)!==Math.sign(F)) bad.push([tag,'arrow dir',c,dx,F]); }
   const l1=arr('var(--f1)')[0], l2=arr('var(--f2)')[0];
   if(l1&&l2){ const len=l=>Math.abs(+l.getAttribute('x2')-+l.getAttribute('x1'))+6.5; const a=len(l1), c=len(l2);
     if(a>8.5&&c>8.5&&Math.abs(a/c-Math.abs(F1/F2))>0.02*Math.abs(F1/F2)) bad.push([tag,'arrow ratio',a/c,F1/F2]); }
   // q0 never sits on a charge, stays in the window
   const w=S.win(); if(st.x<w.lo-1e-9||st.x>w.hi+1e-9) bad.push([tag,'x outside window']);
   if(Math.abs(st.x)<S.eps()-1e-9||Math.abs(st.x-st.d)<S.eps()-1e-9) bad.push([tag,'x on a charge',st.x]);
  }
  // ---- sweep ----
  const Q=[-9,-4,-1,-0.5,0,0.5,1,4,9]; let n=0;
  for(const q1 of Q) for(const q2 of Q) for(const d of [0.2,0.55,1]) for(const s0 of [1,-1]){
    Object.assign(S.st,{q1,q2,d,s0,show:true});
    const w=S.win(); for(let i=0;i<=14;i++){ S.st.x=S.clampX(w.lo+(w.hi-w.lo)*i/14); S.sync(); check([q1,q2,d,s0,S.st.x]); n++; }
    const z=S.zeroPoint(); if(z.x!==undefined && z.x>=w.lo && z.x<=w.hi){ $('b-put').click(); check(['put',q1,q2,d,s0]); n++; } }
  notes.push('cases '+n);
  // ---- examples and ลองทำ ----
  $('b-exa').click(); notes.push('Ex1.9ก start: '+T('eq')+' || '+T('res'));
  if(S.st.show) bad.push('preset must hide the zero point');
  $('b-show').click(); $('b-put').click(); notes.push('Ex1.9ก zero: '+T('zq')+' || '+T('eq')+' || '+T('status'));
  if(!/x = 0\.30 m/.test(T('zq'))||!/= 0\.10 N ทาง -x/.test(T('eq'))||!/= 0\.10 N ทาง \+x/.test(T('eq'))||!/√\(4\.0\/1\.0\) = 2\.0/.test(T('zq'))) bad.push('Ex 1.9 ก');
  $('p-neg').click(); notes.push('ลองทำ 3: '+T('res')+' || '+T('eq'));
  if(!/เป็นศูนย์/.test(T('res'))) bad.push('try 3: negative q0 must keep zero');
  $('b-exb').click(); notes.push('Ex1.9ข start (between): '+T('eq')+' || '+T('status'));
  if(!/ทาง \+x .*ทาง \+x/.test(T('eq'))||!/ชี้ไปทางเดียวกัน/.test(T('status'))) bad.push('try 1 between');
  S.st.x=S.clampX(1.5); S.sync(); notes.push('Ex1.9ข right of q2: '+T('eq')+' || '+T('status'));
  if(!/ใกล้ประจุที่มีขนาดใหญ่กว่า/.test(T('status'))) bad.push('try 1 right');
  $('b-show').click(); $('b-put').click(); notes.push('Ex1.9ข zero: '+T('zq')+' || '+T('eq')+' || '+T('res'));
  if(!/x = -0\.90 m/.test(T('zq'))||(T('eq').match(/= 0\.011 N/g)||[]).length!==2) bad.push('Ex 1.9 ข');
  Object.assign(S.st,{q1:4,q2:-4,d:0.9,s0:1,x:0.3,show:true}); S.sync(); notes.push('ลองทำ 4: '+T('zq')+' || '+T('status'));
  if(!/ไม่มีตำแหน่ง/.test(T('zq'))) bad.push('try 4');
  // ---- d slider keeps the place of q0 relative to the charges ----
  $('b-exa').click(); const sd=$('s-d'); sd.value=0.45; sd.dispatchEvent(new Event('input')); if(Math.abs(S.st.x-0.30)>1e-9) bad.push(['d change',S.st.x]);
  // ---- random use of every control ----
  const rnd=a=>a[Math.floor(Math.random()*a.length)];
  for(let i=0;i<3000;i++){
    const c=rnd(['s-q1','s-q2','s-d','s-x','p-pos','p-neg','b-exa','b-exb','b-show','b-put']), e=$(c);
    if(e.type==='range'){ const lo=+e.min, hi=+e.max; e.value=lo+Math.random()*(hi-lo); e.dispatchEvent(new Event('input')); }
    else if(!e.hidden && !e.disabled) e.click();
    if(i%7===0) check(['random',i,c]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,12)));
 // dragging on the picture
 const box=await (await p.$('#f')).boundingBox();
 for(const fx of [0.02,0.2,0.33,0.36,0.5,0.62,0.9,0.99]){ await p.mouse.click(box.x+box.width*fx,box.y+box.height*0.5); }
 await p.mouse.move(box.x+5,box.y+50); await p.mouse.down(); await p.mouse.move(box.x+box.width-5,box.y+50,{steps:40}); await p.mouse.up();
 console.log('after drag x =',await p.evaluate(()=>window.__sim.st.x));
 console.log('errors',errs); await b.close(); })();
