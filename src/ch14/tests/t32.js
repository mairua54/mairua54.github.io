// 14-3-2: potential difference, work and released charges in a uniform field, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t32.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-3-2.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], e=1.6e-19, mp=1.67e-27, me=9.1e-31;
  const num=s=>{ s=s.replace(/^\+/,'').replace(/(\d) (?=\d{3}\b)/g,'$1'); const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits (floating-point noise such as 674999.99999 must still give 6.8 × 10^5)
  const r2=v=>rd(v,2), s3=v=>rd(v,3), same=(a,c)=>Math.abs(a-c)<=1e-9*Math.abs(c)+1e-30;
  const N='([+-]?(?:\\d{1,3}(?: \\d{3})+|[\\d.]+)(?: × 10-?\\d+)?)', R=s=>new RegExp(s.replace(/#/g,N));
  function check(tag){
   const st=S.st, E=S.ES[st.ei], q=st.c==='p'?e:-e, m=st.c==='p'?mp:me, V=x=>E*(0.40-x), [ax,ay]=st.a, [bx,by]=st.b, na=st.na, nb=st.nb;
   const eq=T('eq'), sta=T('status');
   if(/NaN|Infinity|undefined/.test(document.body.innerText)) bad.push([tag,'bad text']);
   const v=eq.match(R(`V${na} = # V และ V${nb} = # V`)); if(!v||!same(num(v[1]),s3(V(ax)))||!same(num(v[2]),s3(V(bx)))) bad.push([tag,'V',v&&v[0],V(ax),V(bx)]);
   const dd=Number((bx-ax).toFixed(2)), dm=eq.match(R(`d = x${nb} - x${na} = # m - # m = # m`)); if(!dm||!same(num(dm[3]),dd)) bad.push([tag,'d',dm&&dm[0]]);
   const dV=-E*dd, dvm=eq.match(R(`V${nb} - V${na} = -Ed = -\\(# V/m\\)\\(# m\\) = (0|# V)`)); if(!dvm||!same(num(dvm[1]),E)||(dV===0?dvm[3]!=='0':!same(num(dvm[4]),s3(dV)))) bad.push([tag,'dV',dvm&&dvm[0],dV]);
   const W=r2(q*s3(dV)), wm=eq.match(R(`Wext = q\\(V${nb} - V${na}\\) = \\(# × 10-19 C\\)\\(# V\\) = (0|# J)`)); if(!wm||(W===0?wm[3]!=='0':!same(num(wm[4]),W))||num(wm[1])!==(q>0?1.6:-1.6)) bad.push([tag,'Wext',wm&&wm[0],W]);
   const wf=eq.match(R(`W${na} → ${nb} = -Wext = (0|# J)`)); if(!wf||(W===0?wf[1]!=='0':!same(num(wf[2]),-W))) bad.push([tag,'Wfield',wf&&wf[0],-W]);
   const gain=q*(V(ax)-V(bx)), rel=eq.match(R(`ปล่อยจาก ${na}: ½mv2 = q\\(V${na} - V${nb}\\) = \\(1\\.6 × 10-19\\)\\(#\\) = # J v = √\\(2\\(#\\)/#\\) = # m/s`));
   if(gain>0){ const K=r2(e*s3(Math.abs(V(ax)-V(bx)))), vv=r2(Math.sqrt(2*K/m)); if(!rel||!same(num(rel[2]),K)||!same(num(rel[5]),vv)||!same(num(rel[4]),m)) bad.push([tag,'release',rel&&rel[0],K,vv]); }
   else if(rel) bad.push([tag,'release shown but cannot reach',gain]);
   if(dV===0){ if(!/ศักย์เท่ากัน/.test(sta)) bad.push([tag,'status equal',sta]); }
   else if(W>0!==/งานที่ต้องทำเป็นบวก/.test(sta)) bad.push([tag,'status sign',sta,W]);
   if((by!==ay&&dV!==0)!==/การกระจัดเฉียงกับสนาม/.test(sta)) bad.push([tag,'status slant',sta]);
   if(gain>0!==/จนถึงแนวศักย์ของ/.test(sta)) bad.push([tag,'status reach',sta]);
   if(!sta.includes(st.c==='p'?'ไปทางศักย์ต่ำ':'ไปทางศักย์สูง')) bad.push([tag,'status direction',sta]);
   // energy bars for a charge released from the start point and now at x
   for(const x of [ax, ax+(st.c==='p'?1:-1)*0.5*Math.abs((st.c==='p'?0.4:0)-ax), st.c==='p'?0.4:0]){
     S.st.run={x,done:false}; S.update(); const t=[...$('bars').querySelectorAll('text')].map(t=>t.textContent).filter(s=>/ J$/.test(s)).map(s=>num(s.replace(' J','').replace(/⁻/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).replace(/ × 10(-?)(\d+)/,' × 10$1$2')));
     const U=q*V(x), K=q*(V(ax)-V(x)); if(t.length!==3||!same(t[0],r2(U))||!same(t[1],r2(K))||!same(t[2],r2(q*V(ax)))) bad.push([tag,'bars',x,t,[r2(U),r2(K),r2(q*V(ax))]]);
     if(K<-1e-30) bad.push([tag,'negative kinetic energy',x,K]); }
   S.st.run=null; S.update();
  }
  // presets
  $('b-a').click(); check('3.3 ก'); notes.push('Ex 3.3 ก/ง: '+T('eq')); if(!/VB - VA = -Ed = -\(500 V\/m\)\(0\.20 m\) = -100 V/.test(T('eq'))||!/= \+1\.6 × 10-17 J/.test(T('eq'))) bad.push('Ex 3.3 ก ง');
  $('c-p').click(); notes.push('  proton: '+T('eq').match(/Wext[^(]*\([^)]*\)[^=]*= [^=]*= [^(]*/)[0]); if(!/Wext = q\(VB - VA\) = \(\+1\.6 × 10-19 C\)\(-100 V\) = -1\.6 × 10-17 J/.test(T('eq'))) bad.push('proton work');
  $('b-b').click(); check('3.3 ข'); notes.push('Ex 3.3 ข: '+T('eq').match(/VC - VA[^(]*/)[0]+' | '+T('status').slice(0,60)); if(!/VC - VA = -Ed = -\(500 V\/m\)\(0\.00 m\) = 0/.test(T('eq'))) bad.push('Ex 3.3 ข');
  $('b-c').click(); check('3.3 ค'); notes.push('Ex 3.3 ค: '+T('eq').match(/VD - VC = [^(]*\([^)]*\)\([^)]*\) = [^ ]+ V/)[0]); if(!/VD - VC = -Ed = -\(500 V\/m\)\(0\.20 m\) = -100 V/.test(T('eq'))) bad.push('Ex 3.3 ค');
  $('b-6').click(); check('3.6'); notes.push('Ex 3.6: '+T('eq').match(/ปล่อยจาก.*/)[0]); if(!/= 8\.0 × 10-16 J v = .* = 9\.8 × 105 m\/s/.test(T('eq'))) bad.push('Ex 3.6');
  // a sweep over the field, both charges and many pairs of points
  let n=0; const grid=[]; for(let i=0;i<=8;i++) for(let j=0;j<=6;j++) grid.push([Number((i*0.05).toFixed(2)),Number((j*0.05).toFixed(2))]);
  for(let ei=0;ei<S.ES.length;ei++) for(const c of ['p','e']) for(let k=0;k<25;k++){ const a=grid[Math.floor(Math.random()*grid.length)], bb=grid[Math.floor(Math.random()*grid.length)];
    S.set({ei,c,a,b:bb,na:'A',nb:'B'}); check([ei,c,a,bb]); n++; }
  notes.push('cases '+n);
  // the release animation reaches the edge (start point at the edge gives a short note instead)
  S.set({c:'e',a:[0,0.1],b:[0.2,0.1],na:'A',nb:'B'}); S.release(); if(!S.st.run||!S.st.run.edge||!/ขอบของบริเวณ/.test(T('en-cap'))) bad.push('edge release');
  for(let i=0;i<600;i++){ const ids=['s-E','c-p','c-e','b-a','b-b','b-c','b-6','b-go'], id=ids[Math.floor(Math.random()*ids.length)], el=$(id);
    if(el.type==='range'){ el.value=Math.floor(Math.random()*(+el.max+1)); el.dispatchEvent(new Event('input')); } else el.click();
    if(/NaN|Infinity|undefined/.test(document.body.innerText)) bad.push(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 // drag the points on the picture
 await p.evaluate(()=>window.__sim.set({a:[0,0],b:[0.2,0]}));
 const box=await (await p.$('#f')).boundingBox(), k=box.width/380;
 await p.mouse.move(box.x+(42+0.2*800)*k,box.y+270*k); await p.mouse.down(); await p.mouse.move(box.x+(42+0.35*800)*k,box.y+(270-0.2*800)*k,{steps:20}); await p.mouse.up();
 console.log('after drag A, B =',await p.evaluate(()=>JSON.stringify([window.__sim.st.a,window.__sim.st.b])));
 await p.waitForTimeout(2500); console.log('errors',errs); await b.close(); })();
