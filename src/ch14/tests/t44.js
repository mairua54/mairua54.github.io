// 14-4-4: one capacitor, two in series, two in parallel, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t44.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-4-4.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');   // stacked fractions read as a/b
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], e=1.6e-19, CS=[1,2,3,4,5,6,8,10,20,50,100,200];
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits
  const r2=v=>rd(v,2), num=s=>{ s=s.replace(/^\+/,''); const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const same=(a,c)=>Math.abs(a-c)<=1e-9*Math.abs(c)+1e-30, N='([\\d.]+(?: × 10-?\\d+)?)', R=s=>new RegExp(s.replace(/#/g,N));
  const cv=c=>c<10?c.toFixed(1):String(c), big=q=>q>=1000;
  function check(tag){
   const st=S.st, C1=CS[st.i1], C2=CS[st.i2], V=st.V, eq=T('eq'), res=T('res'), sta=T('status');
   if(/NaN|Infinity|undefined/.test(document.body.innerText)) bad.push([tag,'bad text']);
   const Q0=(m,q)=>q===0?m==='0':same(num(m),q);
   let C, Qs=[], Vs=[], Qmain;
   if(st.mode==='1'){ C=C1; const Q=r2(C*V); Qmain=Q; Qs=[Q]; Vs=[V];
     const m=eq.match(R(`Q = CΔV = \\(([\\d.]+) μF\\)\\((\\d+) V\\) = (0|#) μC( = # C)?`)); if(!m||m[1]!==cv(C)||+m[2]!==V||!Q0(m[3],Q)||(!!m[5])!==big(Q)||(m[5]&&!same(num(m[6]),Q*1e-6))) bad.push([tag,'Q single',m&&m[0],Q]);
     if(Q>0){ const n=eq.match(R(`N = Q/e = #/1\\.6 × 10-19 = # ตัว`)); if(!n||!same(num(n[1]),Q*1e-6)||!same(num(n[2]),r2(Q*1e-6/e))) bad.push([tag,'N',n&&n[0]]); }
   } else if(st.mode==='s'){ C=r2(C1*C2/(C1+C2)); const Q=r2(C*V); Qmain=Q; Qs=[Q,Q]; Vs=Q===0?[0,0]:[r2(Q/C1),r2(Q/C2)];
     // the exact physics: same charge, voltages add
     const Qx=C1*C2/(C1+C2)*V; if(Math.abs(Qx/C1+Qx/C2-V)>1e-9*Math.max(V,1)) bad.push([tag,'series physics']);
     const cm=eq.match(R(`C = C1C2/C1 \\+ C2 = \\(([\\d.]+)\\)\\(([\\d.]+)\\)/([\\d.]+) \\+ ([\\d.]+) = # μF`)); if(!cm||cm[1]!==cv(C1)||cm[2]!==cv(C2)||!same(num(cm[5]),C)) bad.push([tag,'C series',cm&&cm[0],C]);
     const qm=eq.match(R(`Q = CΔV = \\(# μF\\)\\((\\d+) V\\) = (0|#) μC`)); if(!qm||!same(num(qm[1]),C)||!Q0(qm[3],Q)) bad.push([tag,'Q series',qm&&qm[0],Q]);
     const vm=eq.match(R(`ΔV1 = Q/C1 = (0|#) μC/([\\d.]+) μF = (0|#) V และ ΔV2 = (0|#) μC/([\\d.]+) μF = (0|#) V`));
     if(!vm||!Q0(vm[1],Q)||vm[3]!==cv(C1)||!Q0(vm[4],Vs[0])||vm[8]!==cv(C2)||!Q0(vm[9],Vs[1])) bad.push([tag,'V each',vm&&vm[0],Vs]);
     const sum=Number((Vs[0]+Vs[1]).toPrecision(12)), ck=eq.match(/ตรวจ: ΔV1 \+ ΔV2 = \S+ \+ \S+ = ([\d.]+) V( \(ต่างจาก)?/);
     if(!ck||+ck[1]!==sum||(!!ck[2])!==(sum!==V)) bad.push([tag,'check line',ck&&ck[0],sum]);
     if(C1!==C2&&!sta.includes(`ตัวที่ความจุน้อยกว่า (C${C1<C2?1:2})`)&&V>0) bad.push([tag,'status series',sta]);
     if(V>0&&C1!==C2&&(C1<C2)!==(Vs[0]>=Vs[1])) bad.push([tag,'smaller C takes more V',Vs]);
   } else { C=C1+C2; const Q1=r2(C1*V), Q2=r2(C2*V); Qs=[Q1,Q2]; Vs=[V,V]; Qmain=r2(Q1+Q2);
     const cm=eq.match(R(`C = C1 \\+ C2 = ([\\d.]+) \\+ ([\\d.]+) = ([\\d.]+) μF`)); if(!cm||cm[1]!==cv(C1)||cm[2]!==cv(C2)||cm[3]!==cv(C)) bad.push([tag,'C parallel',cm&&cm[0]]);
     const qm=eq.match(R(`Q1 = C1ΔV = \\(([\\d.]+)\\)\\((\\d+)\\) = (0|#) μC และ Q2 = \\(([\\d.]+)\\)\\((\\d+)\\) = (0|#) μC`));
     if(!qm||qm[1]!==cv(C1)||!Q0(qm[3],Q1)||qm[5]!==cv(C2)||!Q0(qm[7],Q2)) bad.push([tag,'Q each',qm&&qm[0],Q1,Q2]);
     const tm=eq.match(R(`Qรวม = (0|#) \\+ (0|#) = (0|#) μC`)); if(!tm||!Q0(tm[5],Qmain)) bad.push([tag,'Q total',tm&&tm[0],Qmain]);
     if(V>0&&C1!==C2&&(C1>C2)!==(Q1>=Q2)) bad.push([tag,'bigger C stores more']);
   }
   const U=r2(0.5*C*1e-6*V*V), um=eq.match(R(`U = ½C\\(ΔV\\)2 = ½\\(# × 10-6\\)\\((\\d+)\\)2 = (0|#) J`));
   if(!um||!same(num(um[1]),C)||+um[2]!==V||!Q0(um[3],U)) bad.push([tag,'U',um&&um[0],U]);
   if(U>0&&U<0.01&&um&&!/× 10/.test(um[3])) bad.push([tag,'small energy in powers of ten',um[3]]);
   if((st.mode==='p'?Math.max(...Qs):Qmain)>=1000&&!/× 10/.test(res)) bad.push([tag,'big charge in powers of ten',res]);
   if(st.mode==='p'&&(Qmain>=1000)!==/Qรวม = [^(]*μC = [\d.]+ × 10-\d+ C/.test(eq)) bad.push([tag,'total charge also in coulombs',eq]);
   // the circuit labels
   const ct=[...$('c').querySelectorAll('text')].map(t=>t.textContent);
   const qs=ct.filter(t=>/^Q = /.test(t)).map(t=>t.slice(4,-3)), vs=ct.filter(t=>/^ΔV = /.test(t)).map(t=>t.slice(5,-2));
   const pn=s=>s==='0'?0:num(s.replace(/⁻/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)));
   if(qs.length!==Qs.length||qs.some((q,i)=>!same(pn(q),Qs[i]))||vs.some((v,i)=>!same(pn(v),Vs[i]))) bad.push([tag,'circuit labels',qs,vs,Qs,Vs]);
   if(!ct.includes(`${V} V`)) bad.push([tag,'battery label']);
   // the graph: working points on their lines; series share Q, parallel share ΔV; the shaded triangle ends at the main point
   const pts=[...$('g').querySelectorAll('circle')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]);
   if(V>0){ if(pts.length!==(st.mode==='1'?1:3)) bad.push([tag,'points',pts.length]);
     else { const mainP=pts[pts.length-1], tri=$('g').querySelector('path[fill-opacity]');
       const d=tri&&tri.getAttribute('d').match(/-?[\d.]+/g).map(Number);
       if(!d||Math.abs(d[4]-mainP[0])>0.01||Math.abs(d[5]-mainP[1])>0.01) bad.push([tag,'triangle',d,mainP]);
       if(st.mode==='s'&&pts.some(q=>Math.abs(q[0]-mainP[0])>0.01)) bad.push([tag,'series points share Q']);
       if(st.mode==='p'&&pts.some(q=>Math.abs(q[1]-mainP[1])>0.01)) bad.push([tag,'parallel points share V']);
       // a point (Q, ΔV) sits where Q/ΔV equals that capacitor: compare pixel slopes with the origin
       const o=[56,222], sl=q=>(o[1]-q[1])/(q[0]-o[0]); const Cs=st.mode==='1'?[C1]:[C1,C2,st.mode==='s'?C1*C2/(C1+C2):C1+C2];   // drawn from exact values
       const ratio=sl(pts[0])*Cs[0]; for(let i=1;i<pts.length;i++) if(Math.abs(sl(pts[i])*Cs[i]/ratio-1)>1e-3) bad.push([tag,'point off its line',i,sl(pts[i])*Cs[i]/ratio]); } }
   else if(pts.length) bad.push([tag,'points at zero voltage']);
  }
  // the sheet's examples
  $('b-41').click(); check('4.1'); notes.push('Ex 4.1: '+T('res')+' | '+T('eq').match(/N = .*?ตัว/)[0]); if(!/^ประจุ 2\.4 × 103 μC = 2\.4 × 10-3 C/.test(T('res'))||!/= 1\.5 × 1016 ตัว/.test(T('eq'))) bad.push('Ex 4.1');
  $('b-42').click(); check('4.2'); notes.push('Ex 4.2: '+T('res')); if(!/^ประจุ 1\.0 × 104 μC = 1\.0 × 10-2 C และพลังงาน 1\.0 J$/.test(T('res'))) bad.push('Ex 4.2');
  S.st.V=100; S.update(); check('4.3'); notes.push('Ex 4.2 at 100 V: '+T('res')); if(!/^ประจุ 5\.0 × 103 μC = 5\.0 × 10-3 C และพลังงาน 0\.25 J$/.test(T('res'))) bad.push('half voltage');
  $('b-44').click(); check('4.4'); notes.push('Ex 4.4: '+T('res')); if(T('res')!=='ความจุสมมูล 2.0 μF ประจุตัวละ 24 μC ความต่างศักย์ 8.0 V และ 4.0 V พลังงานรวม 1.4 × 10-4 J') bad.push('Ex 4.4');
  $('b-45').click(); check('4.5'); notes.push('Ex 4.5: '+T('res')); if(T('res')!=='ความจุสมมูล 6.0 μF ประจุ 20 μC และ 40 μC พลังงานรวม 3.0 × 10-4 J') bad.push('Ex 4.5');
  // every pair, every mode, a spread of voltages
  let n=0; for(const mode of ['1','s','p']) for(let i1=0;i1<12;i1++) for(let i2=0;i2<12;i2++) for(const V of [0,1,7,10,12,45,99,100,137,199,200]){ Object.assign(S.st,{mode,i1,i2,V}); S.update(); check([mode,i1,i2,V]); n++; }
  notes.push('cases '+n);
  for(let i=0;i<500;i++){ const ids=['m-1','m-s','m-p','s-c1','s-c2','s-v','b-41','b-42','b-44','b-45'], id=ids[Math.floor(Math.random()*ids.length)], el=$(id);
    if(el.type==='range'){ const lo=+el.min, hi=+el.max; el.value=Math.round(lo+Math.random()*(hi-lo)); el.dispatchEvent(new Event('input')); } else el.click();
    check(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 console.log('errors',errs); await b.close(); })();
