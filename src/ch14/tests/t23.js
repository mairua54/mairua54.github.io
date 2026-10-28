// 14-2-3: field of one or two point charges, field lines and the neutral point, recomputed independently of the page.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t23.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-2-3.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], k=9.0e9; let worstE=0, worstR=0;
  const num=s=>{ s=s.replace('+',''); const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits (floating-point noise such as 674999.99999 must still give 6.8 × 10^5)
  let NF=2; const r2=v=>rd(v,NF);
  const fx3=x=>Math.abs(x*100-Math.round(x*100))<1e-6?x.toFixed(2):x.toFixed(3);
  function E(q,xc,x,y,u){ if(q===0) return [0,0]; const dx=x-xc, r=Math.hypot(dx,y), e=k*q*u/(r*r*r); return [e*dx,e*y]; }
  function roots(q1,q2,d){ const g=x=>{ const a=q1===0?0:q1*Math.sign(x)/(x*x), c=q2===0?0:q2*Math.sign(x-d)/((x-d)**2); return a+c; }, out=[];
    if(q1===0||q2===0) return out; const n=60000; let prev=null;
    for(let i=0;i<=n;i++){ const x=-40*d+i*81*d/n; if(Math.abs(x)<1e-9||Math.abs(x-d)<1e-9){ prev=null; continue; } const v=g(x);
      if(prev&&prev.v*v<0&&!(prev.x<0&&x>0)&&!(prev.x<d&&x>d)){ let a=prev.x,c=x; for(let j=0;j<80;j++){ const m=(a+c)/2; if(g(a)*g(m)<=0) c=m; else a=m; } out.push((a+c)/2); }
      prev={x,v}; } return out; }
  function check(tag){
   const st=S.st; NF=(st.py===0||st.q1===0||st.q2===0)?2:3; const u=st.unit==='μC'?1e-6:1e-9, x=st.px, y=st.py, e1=E(st.q1,0,x,y,u), e2=E(st.q2,st.d,x,y,u), eR=[e1[0]+e2[0],e1[1]+e2[1]];
   const eq=T('eq'), res=T('res'), sta=T('status'), body=document.body.innerText;
   if(/NaN|Infinity|undefined/.test(body)) bad.push([tag,'bad text']);
   const r1=Math.hypot(x,y), r2d=Math.hypot(x-st.d,y);
   const shown=[];
   for(const [i,q,r,e] of [[1,st.q1,r1,e1],[2,st.q2,r2d,e2]]){
     if(q===0){ if(!new RegExp('E'+i+' = 0 \\(q'+i+' = 0\\)').test(eq)) bad.push([tag,'E zero line',i,eq]); shown.push(0); continue; }
     const m=eq.match(new RegExp('E'+i+' = k│q'+i+'│/r'+i+'2 = \\(9\\.0 × 109\\)\\(([\\d.]+) × 10(-\\d+)\\)/\\(([\\d.]+)\\)2 = ([^N]+?) N/C \\(ชี้(ออกจาก|เข้าหา) q'+i+'\\)'));
     if(!m){ bad.push([tag,'E line',i,eq]); shown.push(NaN); continue; }
     if(+m[1]!==Math.abs(q)||+m[2]!==(st.unit==='μC'?-6:-9)) bad.push([tag,'q in line',i,m[1],m[2]]);
     if(m[3]!==fx3(r)) bad.push([tag,'r shown',i,m[3],r]);
     const want=r2(k*Math.abs(q)*u/(+m[3])**2); if(Math.abs(num(m[4])-want)>1e-9*want) bad.push([tag,'E value',i,m[4],want]);
     if(Math.abs(want-Math.hypot(...e))>0.06*Math.hypot(...e)) bad.push([tag,'E far from exact',i,want,Math.hypot(...e)]);
     worstE=Math.max(worstE,Math.abs(want-Math.hypot(...e))/Math.hypot(...e));
     if((m[5]==='ออกจาก')!==(q>0)) bad.push([tag,'E direction word',i]);
     shown.push(want);
   }
   const mR=Math.hypot(...eR), mx=Math.max(Math.hypot(...e1),Math.hypot(...e2)), zero=mx===0||mR<=1e-9*mx;
   if(st.q1!==0&&st.q2!==0){
     if(y===0){ const m=eq.match(/ER = \(([^)]*)\) \+ \(([^)]*)\) = (0|[+-][^N]+? N\/C)/); if(!m) bad.push([tag,'ER line',eq]);
       else { const a=num(m[1]), c=num(m[2]); if(Math.abs(Math.abs(a)-shown[0])>1e-9*shown[0]||Math.abs(Math.abs(c)-shown[1])>1e-9*shown[1]||Math.sign(a)!==Math.sign(e1[0])||Math.sign(c)!==Math.sign(e2[0])) bad.push([tag,'ER parts',m[0]]);
         const s=m[3]==='0'?0:num(m[3].replace(' N/C','')); if(Math.abs(s-r2(a+c))>1e-9*Math.abs(a+c)+1e-12&&!(zero&&s===0)) bad.push([tag,'ER sum',m[0]]); } }
     else { const mx_=eq.match(/Ex = \(([^)]*)\) \+ \(([^)]*)\) = ([^N]+?) N\/C/), my_=eq.match(/Ey = \(([^)]*)\) \+ \(([^)]*)\) = ([^N]+?) N\/C/), mr=eq.match(/ER = √\(Ex2 \+ Ey2\) = ([^N]+?) N\/C/);
       if(!mx_||!my_||!mr) bad.push([tag,'component lines',eq]);
       else { const comp=(sh,e,mg)=>r2(sh*e/mg);
         const ax=comp(shown[0],e1[0],Math.hypot(...e1)), bx=comp(shown[1],e2[0],Math.hypot(...e2)), ay=comp(shown[0],e1[1],Math.hypot(...e1)), by=comp(shown[1],e2[1],Math.hypot(...e2));
         if(Math.abs(num(mx_[1])-ax)>1e-9*Math.abs(ax)+1e-12||Math.abs(num(mx_[2])-bx)>1e-9*Math.abs(bx)+1e-12||Math.abs(num(my_[1])-ay)>1e-9*Math.abs(ay)+1e-12||Math.abs(num(my_[2])-by)>1e-9*Math.abs(by)+1e-12) bad.push([tag,'components',mx_[0],my_[0],ax,bx,ay,by]);
         const Sx=r2(ax+bx), Sy=r2(ay+by); if(Math.abs(num(mx_[3])-Sx)>1e-9*Math.abs(Sx)+1e-12||Math.abs(num(my_[3])-Sy)>1e-9*Math.abs(Sy)+1e-12) bad.push([tag,'component sums']);
         const mag=r2(Math.hypot(num(mx_[3]),num(my_[3]))); if(Math.abs(num(mr[1])-mag)>1e-9*mag+1e-12) bad.push([tag,'ER magnitude',mr[1],mag]);
         worstR=Math.max(worstR,Math.abs(mag-mR)/Math.max(mR,1e-300)*(mR>0.02*mx?1:0)); if(Math.abs(mag-mR)>0.05*mR+0.002*mx) bad.push([tag,'ER far from exact',mag,mR]); } }
     if(zero!==/เป็นศูนย์/.test(res)) bad.push([tag,'res zero',res]);
     if(zero!==/จุดสะเทิน สนามจาก/.test(sta)) bad.push([tag,'status zero',sta]);
   }
   // direction words in the result (exact field)
   const dirOf=v=>{ const m=Math.hypot(...v); if(m===0) return ''; if(Math.abs(v[1])<=1e-12*m) return v[0]>0?'ทิศ +x':'ทิศ -x'; if(Math.abs(v[0])<=1e-12*m) return v[1]>0?'ทิศ +y':'ทิศ -y';
     return `ทิศทำมุม ${Math.round(Math.atan(Math.abs(v[1])/Math.abs(v[0]))*180/Math.PI)}° ${v[1]>0?'เหนือ':'ใต้'}แกน ${v[0]>0?'+x':'-x'}`; };
   const vec=(st.q1&&st.q2)?eR:(st.q1?e1:e2);
   if(!(st.q1===0&&st.q2===0)&&!zero&&!res.includes(dirOf(vec))) bad.push([tag,'res direction',res,dirOf(vec)]);
   // the drawn resultant (or the single field) points the right way
   const lines=[...$('f').querySelectorAll('line')], col=(st.q1&&st.q2)?'var(--efield)':(st.q1?'var(--f1)':'var(--f2)'), L=lines.filter(l=>l.getAttribute('stroke')===col);
   if(!(st.q1===0&&st.q2===0)&&!zero){ if(L.length!==1) bad.push([tag,'vector drawn',col,L.length]);
     else { const dx=L[0].getAttribute('x2')-L[0].getAttribute('x1'), dy=-(L[0].getAttribute('y2')-L[0].getAttribute('y1')); const ang=Math.atan2(dy,dx)-Math.atan2(vec[1],vec[0]); const da=Math.abs(Math.atan2(Math.sin(ang),Math.cos(ang)))*180/Math.PI; if(da>1.5) bad.push([tag,'vector angle',da]); } }
  }
  function checkLines(tag){   // count of lines per charge and that every line runs along the field
   const st=S.st, u=1, Ls=S.traceLines(), ch=[[st.q1,0],[st.q2,st.d]].filter(c=>c[0]!==0);
   let worst=0;
   for(const L of Ls){ for(let j=5;j<L.pts.length-5;j+=7){ const [x,y]=L.pts[j], [x2,y2]=L.pts[j+1]; let ex=0,ey=0; for(const [q,xc] of ch){ const e=E(q,xc,(x+x2)/2,(y+y2)/2,u); ex+=e[0]; ey+=e[1]; }
       const c=((x2-x)*ex+(y2-y)*ey)/(Math.hypot(x2-x,y2-y)*Math.hypot(ex,ey)); worst=Math.max(worst,1-Math.abs(c)); if(L.from>0&&c<0.99) bad.push([tag,'line against E',c]); if(L.from<0&&c>-0.99) bad.push([tag,'line from negative not against E',c]); if(isNaN(c)) bad.push([tag,'line NaN']); } }
   for(const [q,xc] of ch) if(q>0){ const n=Ls.filter(L=>L.from>0&&Math.hypot(L.pts[0][0]-xc,L.pts[0][1])<0.2*st.d).length; if(n!==3*q) bad.push([tag,'lines from positive',q,n]); }
   const drawn=[...$('f').querySelectorAll('polyline')].length; if(st.lines&&drawn!==Ls.length) bad.push([tag,'polylines',drawn,Ls.length]);
   return worst;
  }
  // presets and ลองทำ
  $('b-23').click(); check('ex2.3'); notes.push('Ex 2.3: '+T('eq')+' || '+T('res')); if(!/= \+2\.0 × 106 N\/C/.test(T('eq'))||!/= 1\.6 × 106 N\/C/.test(T('eq'))||!/= 4\.0 × 105 N\/C/.test(T('eq'))) bad.push('Ex 2.3');
  $('b-25').click(); $('b-show').click(); notes.push('Ex 2.5: '+T('zq')); if(!/x = 0\.05 m/.test(T('zq'))) bad.push('Ex 2.5 zero'); $('b-put').click(); check('ex2.5 put'); notes.push('  at N: '+T('res')+' || '+T('status'));
  const z=roots(2,8,0.15); if(z.length!==1||Math.abs(z[0]-0.05)>1e-6) bad.push(['Ex 2.5 roots',z]);
  notes.push('Ex 2.5 lines from +2 and +8: '+S.traceLines().filter(L=>Math.hypot(L.pts[0][0],L.pts[0][1])<0.03).length+' and '+S.traceLines().filter(L=>Math.hypot(L.pts[0][0]-0.15,L.pts[0][1])<0.03).length);
  $('b-22').click(); check('ex2.2'); notes.push('Ex 2.2: '+T('res')); if(!/2\.0 × 105 N\/C ทิศ -x/.test(T('res'))) bad.push('Ex 2.2');
  S.st.px=0.60; S.sync(); notes.push('  at 0.60 m: '+T('res')); if(!/5\.0 × 104 N\/C/.test(T('res'))) bad.push('Ex 2.2 at 0.60');
  // sweep
  let n=0, worst=0;
  for(const [d,unit] of [[0.15,'nC'],[0.30,'μC'],[0.40,'μC']]) for(const q1 of [-8,-3,0,1,2,8]) for(const q2 of [-8,-1,0,2,4]){
    Object.assign(S.st,{q1,q2,d,unit,show:true}); S.st.px=0; S.st.py=0; S.sync(); worst=Math.max(worst,checkLines([q1,q2,d]));
    const w=S.win(); for(let i=0;i<=6;i++) for(const fy of [0,0.37,-0.81]){ [S.st.px,S.st.py]=S.clampP(w.lo+(w.hi-w.lo)*i/6,w.hy*fy); S.update(); check([q1,q2,d,S.st.px,S.st.py]); n++; }
    const zz=S.zeroPoint(), r=roots(q1,q2,d);
    if(zz.x===undefined){ if(r.length) bad.push(['missed zero',q1,q2,d,r]); }
    else { if(r.length!==1||Math.abs(r[0]-zz.x)>1e-6*d) bad.push(['zero point',q1,q2,d,zz.x,r]); const ww=S.win(); if(zz.x>=ww.lo&&zz.x<=ww.hi){ $('b-put').click(); check(['put',q1,q2,d]); } }
  }
  notes.push('cases '+n+', largest misalignment of a field line with E: '+(Math.acos(1-worst)*180/Math.PI).toFixed(2)+'°, largest rounding effect on E1/E2: '+(100*worstE).toFixed(1)+' %, on E_R (when not nearly cancelled): '+(100*worstR).toFixed(1)+' %');
  // random use of every control (and the picture)
  for(let i=0;i<1500;i++){ const ids=['s-q1','s-q2','s-x','s-y','b-22','b-23','b-25','b-lines','b-show','b-put'], id=ids[Math.floor(Math.random()*ids.length)], e=$(id);
    if(e.type==='range'){ e.value=+e.min+Math.random()*(e.max-e.min); e.dispatchEvent(new Event('input')); } else if(!e.hidden&&!e.disabled) e.click();
    check(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 // drag on the picture
 const box=await (await p.$('#f')).boundingBox(); await p.mouse.move(box.x+20,box.y+30); await p.mouse.down(); await p.mouse.move(box.x+box.width-20,box.y+box.height-30,{steps:30}); await p.mouse.up();
 console.log('after drag P =',await p.evaluate(()=>[window.__sim.st.px,window.__sim.st.py]));
 console.log('errors',errs); await b.close(); })();
