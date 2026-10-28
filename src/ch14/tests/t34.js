// 14-3-4: potential and field of two point charges on the x axis, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t34.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-3-4.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');   // stacked fractions read as a/b
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], k=9.0e9;
  const num=s=>{ s=s.replace(/^\+/,''); const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits (floating-point noise such as 674999.99999 must still give 6.8 × 10^5)
  const r2=v=>rd(v,2), same=(a,c)=>Math.abs(a-c)<=1e-9*Math.abs(c)+1e-30;
  const N='([+-]?[\\d.]+(?: × 10-?\\d+)?)', R=s=>new RegExp(s.replace(/#/g,N));
  function check(tag){
   const st=S.st, u=st.unit==='μC'?1e-6:1e-9, x=st.x, d=st.d, Q=[[st.q1,0,1],[st.q2,d,2]].filter(c=>c[0]!==0);
   const eq=T('eq'), res=T('res'), zq=T('zq'), sta=T('status');
   if(/NaN|Infinity|undefined/.test(document.body.innerText)||/ – /.test(T("eq")+T("res"))) bad.push([tag,'bad text']);
   // P stays in the window and not on top of a charge
   const w=S.win(); if(x<w.lo-1e-9||x>w.hi+1e-9) bad.push([tag,'x out of window',x,w]);
   for(const [q,xc] of Q) if(Math.abs(x-xc)<Math.max(0.01,0.1*d)-1e-9) bad.push([tag,'P too close to a charge',x,xc]);
   if(Math.abs(x*100-Math.round(x*100))>1e-6) bad.push([tag,'x not on the 0.01 m grid',x]);
   if(!Q.length){ if(!/ไม่มีประจุ/.test(res)) bad.push([tag,'no charge text',res]); return; }
   // distances
   for(const [q,xc,i] of Q){ const r=Math.abs(x-xc), m=eq.match(new RegExp(`r${i} = ([\\d.]+) m`)); if(!m||!same(+m[1],Number(r.toFixed(2)))) bad.push([tag,'r'+i,m&&m[0],r]); }
   // potential: a plain sum with signs
   let V=0, sc=0; for(const [q,xc] of Q){ const r=Math.abs(x-xc); V+=k*q*u/r; sc=Math.max(sc,k*Math.abs(q)*u/r); }
   const Vs=Math.abs(V)<=1e-9*sc?0:r2(V);
   const vm=eq.match(R(`V = ${Q.map(c=>`kq${c[2]}/r${c[2]}`).join(' \\+ ')} = \\(9\\.0 × 109\\)\\((.*?)\\) = # V`));
   if(!vm||!same(num(vm[2]),Vs)) bad.push([tag,'V',vm&&vm[0],Vs]);
   else { const terms=vm[1].split(' + '); if(terms.length!==Q.length) bad.push([tag,'V terms',vm[1]]);
     terms.forEach((t,j)=>{ const m=t.match(/^(-?[\d.]+ × 10-?\d+)\/([\d.]+)$/); const [q,xc]=Q[j];
       if(!m||!same(num(m[1]),q*(st.unit==='μC'?1e-6:1e-9))||!same(+m[2],Number(Math.abs(x-xc).toFixed(2)))) bad.push([tag,'V term',t,q]); }); }
   if(Math.abs(V)>=1000&&!/× 10/.test(vm?vm[2]:'')) bad.push([tag,'V of 1000 or more should be in powers of ten',vm&&vm[2]]);
   // field: magnitudes from |q|, direction from the picture, then a row sum
   const D=[]; let Eex=0, emx=0;
   for(const [q,xc,i] of Q){ const r=Math.abs(x-xc), s=Math.sign(x-xc)*Math.sign(q), mag=r2(k*Math.abs(q)*u/(r*r)); D.push(s*mag); Eex+=s*k*Math.abs(q)*u/(r*r); emx=Math.max(emx,k*Math.abs(q)*u/(r*r));
     const em=eq.match(R(`E${i} = k│q${i}│/r${i}2 = \\(9\\.0 × 109\\)\\(#\\)/\\(([\\d.]+)\\)2 = # N/C ทาง ([+-])x \\(ชี้(ออกจาก|เข้าหา) q${i}\\)`));
     if(!em||!same(num(em[1]),Math.abs(q)*u)||!same(num(em[3]),mag)||em[4]!==(s>0?'+':'-')||em[5]!==(q>0?'ออกจาก':'เข้าหา')) bad.push([tag,'E'+i,em&&em[0],mag,s]); }
   const Ezero=Math.abs(Eex)<=1e-9*emx; let Es=D.length===2?(Ezero?0:r2(D[0]+D[1])):D[0];
   if(D.length===2){ const em=eq.match(R(`ER = \\(#\\) \\+ \\(#\\) = (0|# N/C)`)); if(!em||!same(num(em[1]),D[0])||!same(num(em[2]),D[1])||(Es===0?em[3]!=='0':!same(num(em[4]),Es))) bad.push([tag,'ER',em&&em[0],Es]); }
   // result line
   const rm=res.match(R(`ที่ P: V = # V (และ|แต่) (E = 0|E = # N/C ทิศ ([+-])x)$`));
   if(!rm||!same(num(rm[1]),Vs)||(Es===0?rm[3]!=='E = 0':(!same(num(rm[4]),Math.abs(Es))||rm[5]!==(Es>0?'+':'-')))) bad.push([tag,'result',res,Vs,Es]);
   else if((rm[2]==='แต่')!==(Vs===0&&Es!==0)) bad.push([tag,'result word',res]);
   // status
   if(Q.length===1){ if(!/มีจุดประจุตัวเดียว/.test(sta)) bad.push([tag,'status one',sta]); }
   else if(Vs===0&&Es!==0){ if(!/^V = 0 แต่ E ≠ 0/.test(sta)) bad.push([tag,'status V0',sta]); }
   else if(Es===0&&Vs!==0){ if(!/^E = 0 แต่ V ≠ 0/.test(sta)) bad.push([tag,'status E0',sta]); }
   else if(!/ศักย์ไฟฟ้าเป็นสเกลาร์/.test(sta)) bad.push([tag,'status general',sta]);
   // the arrow on the picture points the way of the net field, and is absent when it is zero
   const ln=[...$('f').querySelectorAll('line')].filter(l=>l.getAttribute('stroke')==='var(--efield)');
   if(Ezero){ if(ln.length) bad.push([tag,'arrow drawn for zero field']); }
   else if(ln.length!==1||Math.sign(+ln[0].getAttribute('x2')-+ln[0].getAttribute('x1'))!==Math.sign(Eex)) bad.push([tag,'arrow direction',ln.length,Eex]);
   // zero points, found again here and checked by putting them back into V and E
   if(st.show){
     const a=Math.abs(st.q1), bb=Math.abs(st.q2), zv=[];
     if(Q.length===2&&st.q1*st.q2<0){ zv.push(a*d/(a+bb)); if(a<bb) zv.push(-a*d/(bb-a)); else if(a>bb) zv.push(d+bb*d/(a-bb)); }
     zv.sort((p,q)=>p-q);
     for(const z of zv){ let v=0, s=0; for(const [q,xc] of Q){ v+=q/Math.abs(z-xc); s+=Math.abs(q)/Math.abs(z-xc); } if(Math.abs(v)>1e-9*s) bad.push([tag,'V at zero point',z,v]); }
     const shown=[...zq.matchAll(/V = 0 ที่ (.*?)(?= E = 0| ไม่มี|$)/g)].map(m=>[...m[1].matchAll(/x = (-?[\d.]+) m/g)].map(n=>+n[1]))[0]||[];
     const txt3=z=>{ const s=Math.abs(z*100-Math.round(z*100))<1e-6?z.toFixed(2):z.toFixed(3); return +s; };
     if(shown.length!==zv.length||shown.some((v,i)=>!same(v,txt3(zv[i])))) bad.push([tag,'V = 0 points',shown,zv]);
     if(!zv.length&&!/ไม่มีตำแหน่งบนแกน x ที่ V = 0/.test(zq)) bad.push([tag,'no V = 0 text',zq]);
     let ze=null; if(Q.length===2){ const ra=Math.sqrt(a), rb=Math.sqrt(bb); if(st.q1*st.q2>0) ze=d*ra/(ra+rb); else if(a!==bb) ze=a<bb?-d*ra/(rb-ra):d+d*rb/(ra-rb); }
     if(ze!==null){ let e=0, s=0; for(const [q,xc] of Q){ const r=ze-xc; e+=q*Math.sign(r)/(r*r); s+=Math.abs(q)/(r*r); } if(Math.abs(e)>1e-9*s) bad.push([tag,'E at neutral point',ze,e]);
       const m=zq.match(/E = 0 ที่ x = (-?[\d.]+) m/); if(!m||!same(+m[1],txt3(ze))) bad.push([tag,'E = 0 point',m&&m[0],ze]); }
     else if(!/ไม่มีตำแหน่งที่ E = 0/.test(zq)) bad.push([tag,'no E = 0 text',zq]);
     // markers sit on the zero line of the graph
     const zl=[...$('f').querySelectorAll('line')].find(l=>l.getAttribute('stroke')==='var(--ink)'&&l.getAttribute('stroke-width')==='1.3');
     for(const c of [...$('f').querySelectorAll('circle')].filter(c=>c.getAttribute('r')==='5.5')) if(!zl||Math.abs(+c.getAttribute('cy')-+zl.getAttribute('y1'))>0.01) bad.push([tag,'V = 0 marker off the zero line']);
   } else if(zq) bad.push([tag,'zero text without the button',zq]);
  }
  // the sheet's examples
  $('b-34').click(); check('3.4'); notes.push('Ex 3.4: '+T('res')); if(!/^ที่ P: V = -5\.4 × 104 V/.test(T('res'))) bad.push('Ex 3.4');
  $('b-35').click(); $('b-show').click(); check('3.5'); notes.push('Ex 3.5: '+T('res')+' | '+T('zq'));
  if(!/^ที่ P: V = 0 V แต่ E = 2\.4 × 103 N\/C ทิศ \+x$/.test(T('res'))||!/V = 0 ที่ x = -0\.20 m และ x = 0\.10 m/.test(T('zq'))||!/= 6\.0\/2\.0 = 3\.0/.test(T('zq'))) bad.push('Ex 3.5');
  $('b-37').click(); check('3.7 A'); const A=T('res'); S.st.x=0.30; S.update(); check('3.7 B'); const B=T('res'); S.st.x=0.20; S.update(); check('3.7 mid'); const M=T('res');
  notes.push('Ex 3.7: A '+A+' | B '+B+' | mid '+M);
  if(!/V = 240 V/.test(A)||!/V = -240 V/.test(B)||!/^ที่ P: V = 0 V แต่ E = 1\.8 × 103 N\/C ทิศ \+x$/.test(M)) bad.push('Ex 3.7');
  $('b-pp').click(); check('++'); notes.push('+Q +Q: '+T('res')); if(!/^ที่ P: V = 360 V และ E = 0$/.test(T('res'))) bad.push('+Q +Q');
  // a sweep over charges, distances and positions
  let n=0;
  for(const pre of ['b-34','b-35']) for(let q1=-8;q1<=8;q1++) for(let q2=-8;q2<=8;q2++){ $(pre).click(); if(Math.random()<0.5) $('b-show').click();
    S.st.q1=q1; S.st.q2=q2; const w=S.win(); for(let j=0;j<3;j++){ S.st.x=S.clampX(w.lo+Math.random()*(w.hi-w.lo)); S.sync(); check([pre,q1,q2,S.st.x]); n++; } }
  // P exactly at the zero points that fall on the grid, and at the window edges
  for(let q1=-8;q1<=8;q1++) for(let q2=-8;q2<=8;q2++){ S.st.q1=q1; S.st.q2=q2; S.st.show=true; for(const z of [...S.zeroV(),S.zeroE(),S.win().lo,S.win().hi]) if(z!==null&&Math.abs(z*100-Math.round(z*100))<1e-9){ S.st.x=S.clampX(z); S.sync(); check(['zero',q1,q2,z]); n++; } }
  notes.push('cases '+n);
  for(let i=0;i<600;i++){ const ids=['s-q1','s-q2','s-x','b-34','b-35','b-37','b-pp','b-show'], id=ids[Math.floor(Math.random()*ids.length)], el=$(id);
    if(el.type==='range'){ const lo=+el.min, hi=+el.max; el.value=lo+Math.random()*(hi-lo); el.dispatchEvent(new Event('input')); } else el.click();
    check(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 // drag P on the picture
 await p.evaluate(()=>{ document.getElementById('b-37').click(); });
 const box=await (await p.$('#f')).boundingBox(), kx=box.width/380, X=x=>box.x+(48+(346-48)*(x+0.48)/1.36)*kx;
 await p.mouse.move(X(0.10),box.y+200*kx); await p.mouse.down(); await p.mouse.move(X(0.30),box.y+150*kx,{steps:15}); await p.mouse.up();
 console.log('after drag x =',await p.evaluate(()=>window.__sim.st.x), await p.evaluate(()=>document.getElementById('res').innerText));
 console.log('errors',errs); await b.close(); })();
