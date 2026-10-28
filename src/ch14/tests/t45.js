// 14-4-5: two charged capacitors joined with the same or opposite polarity, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t45.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-4-5.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');   // stacked fractions read as a/b
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], CS=[1,2,3,4,5,6,8,10];
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits
  const r2=v=>rd(v,2), num=s=>{ if(s==null) return NaN; s=s.replace(/^\+/,'').replace(/^−/,'-'); const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const same=(a,c)=>Math.abs(a-c)<=1e-9*Math.abs(c)+1e-30, N='([\\d.]+(?: × 10-?\\d+)?)', R=s=>new RegExp(s.replace(/#/g,N));
  const cv=c=>c<10?c.toFixed(1):String(c);
  const sup=s=>s.replace(/⁻/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c));
  let maxN=2, nTiny=0;
  function check(tag){
   const st=S.st, C1=CS[st.i1], C2=CS[st.i2], q1=st.q1, q2=st.q2, opp=st.opp, eq=T('eq'), res=T('res'), sta=T('status');
   if(/NaN|Infinity|undefined/.test(document.body.innerText)) bad.push([tag,'bad text']);
   const V1=q1===0?0:r2(q1/C1), V2=q2===0?0:r2(q2/C2);
   const vm=eq.match(R(`ΔV1 = Q1/C1 = (\\d+) μC/([\\d.]+) μF = (0|#) V และ ΔV2 = (\\d+) μC/([\\d.]+) μF = (0|#) V`));
   if(!vm||+vm[1]!==q1||vm[2]!==cv(C1)||(V1===0?vm[3]!=='0':!same(num(vm[4]),V1))||+vm[5]!==q2||vm[6]!==cv(C2)||(V2===0?vm[7]!=='0':!same(num(vm[8]),V2))) bad.push([tag,'V before',vm&&vm[0]]);
   // energies, exact from Q²/2C
   const Ub=(q1*q1/C1+q2*q2/C2)/2*1e-6, top=q1+(opp?-q2:q2), Qt=Math.abs(top), Ua=Qt*Qt/(C1+C2)/2*1e-6;
   // the textbook result: the loss is C1C2(ΔV1 ∓ ΔV2)²/2(C1 + C2), never negative
   const lossF=C1*C2*Math.pow(q1/C1-(opp?-1:1)*q2/C2,2)/(2*(C1+C2))*1e-6; if(Math.abs(Ub-Ua-lossF)>1e-15) bad.push([tag,'loss formula',Ub-Ua,lossF]);
   const none=(!opp&&q1*C2===q2*C1)||(q1===0&&q2===0), loss=none?0:r2(Ub-Ua);
   let nU=2; if(!none) while(nU<4&&r2(rd(Ub,nU)-rd(Ua,nU))!==loss) nU++; const tiny=!none&&r2(rd(Ub,nU)-rd(Ua,nU))!==loss; if(tiny){ nU=2; nTiny++; } maxN=Math.max(maxN,nU);
   const mJ=v=>rd(v,nU)*1e3;
   const ub=eq.match(R(`Uก่อน = Q12/2C1 \\+ Q22/2C2 = .*? = (0|#) mJ`)); if(!ub||(Ub===0?ub[1]!=='0':!same(num(ub[2]),mJ(Ub)))) bad.push([tag,'U before',ub&&ub[0].slice(-30),mJ(Ub)]);
   if(!st.con){ if(res) bad.push([tag,'result before connecting']); }
   else {
     const Vp=Qt===0?0:r2(Qt/(C1+C2)), Q1p=r2(C1*Vp), Q2p=r2(C2*Vp);
     const qt=opp?eq.match(/Qรวม = │Q1 - Q2│ = │(\d+) - (\d+)│ = (\d+) μC/):eq.match(/Qรวม = Q1 \+ Q2 = (\d+) \+ (\d+) = (\d+) μC/);
     if(!qt||+qt[1]!==q1||+qt[2]!==q2||+qt[3]!==Qt) bad.push([tag,'Q total',qt&&qt[0],Qt]);
     const vp=eq.match(R(`ΔV′ = Qรวม/C1 \\+ C2 = (\\d+) μC/([\\d.]+) μF = (0|#) V`)); if(!vp||+vp[1]!==Qt||vp[2]!==cv(C1+C2)||(Vp===0?vp[3]!=='0':!same(num(vp[4]),Vp))) bad.push([tag,"V'",vp&&vp[0],Vp]);
     const qp=eq.match(R(`Q1′ = C1ΔV′ = \\(([\\d.]+)\\)\\((0|#)\\) = (0|#) μC และ Q2′ = \\(([\\d.]+)\\)\\((0|#)\\) = (0|#) μC`));
     if(!qp||qp[1]!==cv(C1)||(Q1p===0?qp[4]!=='0':!same(num(qp[5]),Q1p))||qp[6]!==cv(C2)||(Q2p===0?qp[9]!=='0':!same(num(qp[10]),Q2p))) bad.push([tag,"Q'",qp&&qp[0],Q1p,Q2p]);
     if((Number((Q1p+Q2p).toPrecision(12))!==Qt)!==/เพราะการปัดเลข/.test(eq)) bad.push([tag,'rounding note']);
     const ua=eq.match(R(`Uหลัง = .*? = (0|#) mJ พลังงาน`)); if(!ua||(Ua===0?ua[1]!=='0':!same(num(ua[2]),mJ(Ua)))) bad.push([tag,'U after',ua&&ua[0].slice(-40),mJ(Ua)]);
     const lm=eq.match(R(`พลังงานที่หายไป = Uก่อน - Uหลัง = (0|#) - (0|#) [=≈] (0|#) mJ`));
     if(lm&&(lm[0].includes('≈')!==tiny||tiny!==/เกือบเท่ากัน/.test(eq))) bad.push([tag,'tiny loss marking',lm[0]]);
     if(!lm||(loss===0?lm[5]!=='0':!same(num(lm[6]),loss*1e3))) bad.push([tag,'loss',lm&&lm[0],loss]);
     else if(loss!==0&&!tiny&&!same(r2((lm[1]==='0'?0:num(lm[2]))-(lm[3]==='0'?0:num(lm[4]))),loss*1e3)) bad.push([tag,'subtraction as shown',lm[0]]);
     // which plates changed sign
     const sgn=Math.sign(top), f1=sgn<0&&q1>0, f2=opp?(sgn>0&&q2>0):(sgn<0&&q2>0);
     if(Qt!==0&&!none){ if(f1!==/C1 (กับ C2 )?กลับขั้ว/.test(sta)||f2!==/C2 กลับขั้ว/.test(sta)) bad.push([tag,'flip text',sta,f1,f2]); }
     if(none&&!(q1===0&&q2===0)&&!/ไม่มีประจุไหล/.test(sta)) bad.push([tag,'no flow text',sta]);
     if(Qt===0&&!none&&!/หักล้างกันพอดี/.test(sta)) bad.push([tag,'cancel text',sta]);
     // the drawing: plate charges after connecting
     const pl=[...$('f').querySelectorAll('text')].filter(t=>/μC$/.test(t.textContent)&&!/กลุ่ม/.test(t.textContent)||t.textContent==='0'&&+t.getAttribute('x')>100).map(t=>[+t.getAttribute('x'),+t.getAttribute('y'),t.textContent==='0'?0:num(sup(t.textContent.replace(' μC','')))]);
     const want={'1t':sgn*Q1p,'1b':-sgn*Q1p,'2t':sgn*Q2p,'2b':-sgn*Q2p};
     for(const [x,y,v] of pl){ const key=(x<200?'1':'2')+(y<130?'t':'b'); if(!same(v,want[key]===0?0:want[key])&&!(v===0&&want[key]===0)) bad.push([tag,'plate',key,v,want[key]]); }
     if(pl.length!==4) bad.push([tag,'plate labels',pl.length]);
   }
   // group totals are conserved: always the given total
   const gl=[...$('f').querySelectorAll('text')].map(t=>t.textContent).filter(t=>/^กลุ่มแผ่น/.test(t)).map(t=>t.replace(/.*ประจุรวม /,'').replace(' μC','')).map(t=>t==='0'?0:num(t));
   if(gl.length!==2||gl[0]!==top||gl[1]!==-top&&!(top===0&&gl[1]===0)) bad.push([tag,'group totals',gl,top]);
   // bars
   const rects=[...$('bars').querySelectorAll('rect')], filled=rects.filter(r=>r.getAttribute('fill')==='var(--graph)'), dashed=rects.filter(r=>r.getAttribute('stroke')==='var(--heat)');
   if(filled.length!==(Ub>0?1:0)+(st.con&&Ua>0?1:0)) bad.push([tag,'bars',filled.length]);
   if(dashed.length!==(st.con&&loss>0?1:0)) bad.push([tag,'loss box',dashed.length]);
   if(filled.length===2){ const h=filled.map(r=>+r.getAttribute('height')); if(Math.abs(h[1]/h[0]-Ua/Ub)>1e-9) bad.push([tag,'bar heights',h,Ua/Ub]); }
  }
  // the sheet's examples
  $('b-47').click(); check('4.7 before'); $('b-con').click(); check('4.7'); notes.push('Ex 4.7: '+T('res')+' | '+T('eq').match(/พลังงานที่หายไป.*/)[0]);
  if(T('res')!=='ความต่างศักย์ร่วม 20 V Q1′ = 80 μC และ Q2′ = 40 μC พลังงานหายไป 0.60 mJ'||!/Uก่อน - Uหลัง = 1\.8 - 1\.2 = 0\.60 mJ/.test(T('eq'))) bad.push('Ex 4.7');
  $('b-48').click(); $('b-con').click(); check('4.8'); notes.push('Ex 4.8: '+T('res')+' | '+T('status').slice(-40));
  if(!/^ความต่างศักย์ร่วม 10 V Q1′ = 30 μC และ Q2′ = 60 μC/.test(T('res'))||!/C1 กลับขั้ว/.test(T('status'))) bad.push('Ex 4.8');
  Object.assign(S.st,{i1:1,q1:40,i2:3,q2:80,opp:false,con:true}); S.update(); check('equal V'); notes.push('equal V: '+T('res')); if(!/พลังงานหายไป 0 mJ$/.test(T('res'))) bad.push('equal V');
  Object.assign(S.st,{i1:2,q1:100,i2:6,q2:100,opp:true,con:true}); S.update(); check('cancel'); notes.push('cancel: '+T('res'));
  // a sweep
  let n=0; for(let i1=0;i1<8;i1++) for(let i2=0;i2<8;i2++) for(let j=0;j<10;j++){ const q1=5*Math.floor(Math.random()*61), q2=5*Math.floor(Math.random()*61);
    for(const opp of [false,true]) for(const con of [false,true]){ Object.assign(S.st,{i1,i2,q1,q2,opp,con}); S.update(); check([i1,i2,q1,q2,opp,con]); n++; } }
  for(let q1=0;q1<=300;q1+=15) for(let q2=0;q2<=300;q2+=15) for(const opp of [false,true]){ Object.assign(S.st,{i1:2,i2:5,q1,q2,opp,con:true}); S.update(); check(['grid',q1,q2,opp]); n++; }
  notes.push('cases '+n+', most figures used for energies: '+maxN+', tiny losses shown with ≈: '+nTiny);
  for(let i=0;i<500;i++){ const ids=['p-same','p-opp','s-c1','s-c2','s-q1','s-q2','b-con','b-47','b-48'], id=ids[Math.floor(Math.random()*ids.length)], el=$(id);
    if(el.type==='range'){ const lo=+el.min, hi=+el.max, stp=+el.step||1; el.value=lo+stp*Math.round(Math.random()*(hi-lo)/stp); el.dispatchEvent(new Event('input')); } else el.click();
    check(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 console.log('errors',errs); await b.close(); })();
