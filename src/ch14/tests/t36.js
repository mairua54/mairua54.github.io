// 14-3-6: two conducting spheres joined by a wire, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t36.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-3-6.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');   // stacked fractions read as a/b
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], k=9.0e9, e=1.6e-19;
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits
  const num=s=>{ s=s.replace(/^\+/,''); const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const same=(a,c)=>Math.abs(a-c)<=1e-9*Math.abs(c)+1e-30, N='([+-]?[\\d.]+(?: × 10-?\\d+)?)', R=s=>new RegExp(s.replace(/#/g,N));
  const Rm=c=>(c/100).toFixed(c<10?3:2);
  function check(tag){
   const st=S.st, {r1,q1,r2,q2}=st, eq=T('eq'), res=T('res'), sta=T('status');
   if(/NaN|Infinity|undefined/.test(document.body.innerText)) bad.push([tag,'bad text']);
   // before connecting
   const V1=k*q1*1e-9/(r1/100), V2=k*q2*1e-9/(r2/100);
   for(const [i,q,r,V] of [[1,q1,r1,V1],[2,q2,r2,V2]]){ const m=eq.match(R(`V${i} = kQ${i}/R${i} = \\(9\\.0 × 109\\)\\((0|#)\\)/([\\d.]+) = (0|#) V \\(ก่อนเชื่อม\\)`));
     if(!m||(q===0?m[1]!=='0':!same(num(m[2]),q*1e-9))||m[3]!==Rm(r)||(V===0?m[4]!=='0':!same(num(m[5]),rd(V,2)))) bad.push([tag,'V'+i,m&&m[0],rd(V,2)]); }
   const eqV=q1*r2===q2*r1;
   if(!st.wired){ if(res) bad.push([tag,'result before connecting',res]);
     if(eqV!==/เท่ากันอยู่แล้ว/.test(sta)) bad.push([tag,'status before',sta]); return; }
   // after connecting: charge conserved and potentials equal
   const Qt=q1+q2, Q1x=Qt*r1/(r1+r2), Q2x=Qt*r2/(r1+r2);
   if(Math.abs(Q1x+Q2x-Qt)>1e-12||Math.abs(Q1x/r1-Q2x/r2)>1e-12) bad.push([tag,'physics']);
   let nf=2; if(Math.abs(rd(Q1x,2)+rd(Q2x,2)-Qt)>1e-9) nf=3;
   const Q1f=rd(Q1x,nf), Q2f=rd(Q2x,nf);
   const qt=eq.match(R(`ประจุรวม = # \\+ \\(#\\) = (0|#) nC`)); if(!qt||num(qt[1])!==q1||num(qt[2])!==q2||(Qt===0?qt[3]!=='0':num(qt[4])!==Qt)) bad.push([tag,'total',qt&&qt[0]]);
   const qm=eq.match(R(`Q1′ = ([\\d.]+)/([\\d.]+)\\((0|#)\\) = (0|#) nC และ Q2′ = ([\\d.]+)/([\\d.]+)\\((0|#)\\) = (0|#) nC`));
   if(!qm||+qm[1]!==r1||+qm[2]!==r1+r2||(Q1f===0?qm[5]!=='0':!same(num(qm[6]),Q1f))||+qm[7]!==r2||+qm[8]!==r1+r2||(Q2f===0?qm[11]!=='0':!same(num(qm[12]),Q2f))) bad.push([tag,"Q'",qm&&qm[0],Q1f,Q2f]);
   if(nf===3&&qm&&!/\d\.\d\d|\d\d\.\d/.test(qm[0])) bad.push([tag,'3 figures expected',qm[0]]);
   if((Math.abs(Q1f+Q2f-Qt)>1e-9)!==/ต่างจากประจุรวมเล็กน้อยเพราะการปัดเลข/.test(eq)) bad.push([tag,'rounding note',Q1f,Q2f,Qt]);
   const V=Q1f===0?0:rd(k*Q1f*1e-9/(r1/100),2), vm=eq.match(R(`V = kQ1′/R1 = \\(9\\.0 × 109\\)\\((0|#)\\)/([\\d.]+) = (0|#) V \\(ศักย์ร่วม\\)`));
   if(!vm||vm[3]!==Rm(r1)||(V===0?vm[4]!=='0':!same(num(vm[5]),V))) bad.push([tag,'V common',vm&&vm[0],V]);
   // electrons go from the lower potential to the higher one
   let dQ=eqV?0:rd(Q1f-q1,2); if(!eqV&&dQ===0) dQ=rd(Q1x-q1,2);
   if(!eqV&&Math.sign(Q1x-q1)!==-Math.sign(V1-V2)) bad.push([tag,'flow direction physics']);
   if(dQ===0){ if(!/ไม่มีอิเล็กตรอนไหล/.test(res)||/N =/.test(eq)) bad.push([tag,'no flow',res]); }
   else { const Nn=rd(Math.abs(dQ)*1e-9/e,2), from=dQ<0?2:1;
     const dm=eq.match(R(`Q1′ - Q1 = (0|#) - \\(#\\) = # nC \\(ลูก 1 (ได้รับ|เสีย)อิเล็กตรอน`)); if(!dm||num(dm[4])!==dQ||dm[5]!==(dQ<0?'ได้รับ':'เสีย')) bad.push([tag,'dQ',dm&&dm[0],dQ]);
     const nm=eq.match(R(`N = # × 10-9/1\\.6 × 10-19 = # ตัว`)); if(!nm||!same(num(nm[1]),Math.abs(dQ))||!same(num(nm[2]),Nn)) bad.push([tag,'N',nm&&nm[0],Nn]);
     if(!res.includes(`ไหลจากลูก ${from} ไปลูก ${3-from}`)||!sta.includes(`(ลูก ${from}) ไปลูกที่ศักย์สูงกว่า (ลูก ${3-from})`)) bad.push([tag,'direction text',res,sta]);
     if((from===2)!==(V2<V1)) bad.push([tag,'from lower potential']); }
   // field at the surface, E = V/R: the smaller sphere is stronger by R2/R1
   if(V!==0){ const em=eq.match(R(`Eผิว,1 = V/R1 = #/([\\d.]+) = # N/C และ Eผิว,2 = #/([\\d.]+) = # N/C`)), E1=rd(Math.abs(V)/(r1/100),2), E2=rd(Math.abs(V)/(r2/100),2);
     if(!em||!same(num(em[3]),E1)||!same(num(em[6]),E2)||em[2]!==Rm(r1)||em[5]!==Rm(r2)) bad.push([tag,'E surface',em&&em[0],E1,E2]);
     const rr=rd(Math.max(r1,r2)/Math.min(r1,r2),2), rs=rr>=10?String(rr):rr.toFixed(1);
     if(r1!==r2&&!sta.includes(`ลูก ${r1<r2?1:2} รัศมีเล็กกว่า`)||r1!==r2&&!sta.includes(`มีสนามที่ผิวแรงกว่า ${rs} เท่า`)) bad.push([tag,'ratio text',sta,rs]);
     if(r1===r2&&!/รัศมีเท่ากันจึงได้ประจุเท่ากัน/.test(sta)) bad.push([tag,'equal radii text',sta]); }
   else if(/Eผิว/.test(eq)) bad.push([tag,'surface field shown for V = 0']);
   // picture: radii to scale, one sign per nC (up to 20), three field arrows per charged sphere
   const svg=$('f'), big=[...svg.querySelectorAll('circle')].filter(c=>+c.getAttribute('r')>=5&&c.getAttribute('stroke')==='var(--ink)');
   if(big.length!==2||Math.abs(+big[0].getAttribute('r')/+big[1].getAttribute('r')-r1/r2)>1e-9) bad.push([tag,'radii',big.map(c=>c.getAttribute('r'))]);
   const signs=[...svg.querySelectorAll('circle')].filter(c=>c.getAttribute('r')==='4.6').length;
   if(signs!==Math.min(20,Math.round(Math.abs(Q1f)))+Math.min(20,Math.round(Math.abs(Q2f)))) bad.push([tag,'sign count',signs,Q1f,Q2f]);
   const ar=[...svg.querySelectorAll('line')].filter(l=>l.getAttribute('stroke')==='var(--efield)');
   if(ar.length!==(Q1f!==0&&V!==0?3:0)+(Q2f!==0&&V!==0?3:0)) bad.push([tag,'arrow count',ar.length]);
  }
  // the sheet's example
  $('b-39').click(); check('3.9 before'); notes.push('Ex 3.9 before: '+T('eq'));
  if(!/V1 = .* = 4\.5 × 103 V/.test(T('eq'))||!/V2 = .* = -300 V/.test(T('eq'))) bad.push('Ex 3.9 before');
  S.st.wired=true; S.update(); check('3.9 after'); notes.push('Ex 3.9 after: '+T('res'));
  if(!/^หลังเชื่อม Q1′ = \+2\.0 nC และ Q2′ = \+6\.0 nC ศักย์ร่วม 900 V อิเล็กตรอน 5\.0 × 1010 ตัว ไหลจากลูก 2 ไปลูก 1$/.test(T('res'))) bad.push('Ex 3.9 after');
  if(!/= 4\.5 × 104 N\/C และ .* = 1\.5 × 104 N\/C/.test(T('eq'))) bad.push('Ex 3.9 surface field');
  // try-its 3 and 4
  Object.assign(S.st,{r1:5,r2:5,q1:12,q2:-4,wired:true}); S.update(); check('equal R'); notes.push('equal R: '+T('res')); if(!/Q1′ = \+4\.0 nC และ Q2′ = \+4\.0 nC/.test(T('res'))) bad.push('equal R');
  Object.assign(S.st,{r1:2,r2:6,q1:2,q2:6,wired:true}); S.update(); check('same V'); notes.push('same V: '+T('res')); if(!/ไม่มีอิเล็กตรอนไหล/.test(T('res'))) bad.push('same V');
  // every pair of radii with random charges, plus all charges for a few radius pairs
  let n=0;
  for(let r1=1;r1<=10;r1++) for(let r2=1;r2<=10;r2++) for(let j=0;j<12;j++){ const q1=Math.floor(Math.random()*41)-20, q2=Math.floor(Math.random()*41)-20;
    for(const w of [false,true]){ Object.assign(S.st,{r1,r2,q1,q2,wired:w}); S.update(); check([r1,r2,q1,q2,w]); n++; } }
  for(const [r1,r2] of [[2,6],[3,7],[1,10],[4,4]]) for(let q1=-20;q1<=20;q1++) for(let q2=-20;q2<=20;q2++){ Object.assign(S.st,{r1,r2,q1,q2,wired:true}); S.update(); check([r1,r2,q1,q2]); n++; }
  notes.push('cases '+n);
  for(let i=0;i<500;i++){ const ids=['s-r1','s-r2','s-q1','s-q2','b-wire','b-39'], id=ids[Math.floor(Math.random()*ids.length)], el=$(id);
    if(el.type==='range'){ const lo=+el.min, hi=+el.max; el.value=lo+Math.random()*(hi-lo); el.dispatchEvent(new Event('input')); } else el.click();
    S.stop(); S.update(); check(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 // the connection animation: electrons move from sphere 2 to sphere 1 in Ex 3.9, then the final state appears
 await p.evaluate(()=>{ document.getElementById('b-39').click(); document.getElementById('b-wire').click(); });
 await p.waitForTimeout(500);
 const mid=await p.evaluate(()=>({sta:document.getElementById('status').innerText, res:document.getElementById('res').innerText, dots:[...document.querySelectorAll('#f circle')].filter(c=>c.getAttribute('r')==='5').length, arrow:[...document.querySelectorAll('#f line')].filter(l=>l.getAttribute('stroke')==='var(--elec)').map(l=>Math.sign(l.getAttribute('x2')-l.getAttribute('x1')))}));
 console.log('during:',JSON.stringify(mid));
 await p.waitForTimeout(1600);
 console.log('after:',await p.evaluate(()=>document.getElementById('res').innerText.replace(/\s+/g,' ')));
 console.log('errors',errs); await b.close(); })();
