// 14-2-5: electron or proton between parallel plates (L = 4.0 cm, gap 2.0 cm). Every setting of the controls is checked
// against an independent calculation, including the picture (true scale, 55 px per cm).
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t25.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-2-5.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  document.documentElement.classList.add('flat');
  const S=window.__sim, $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim();
  const bad=[], notes=[], e=1.6e-19, me=9.1e-31, mp=1.67e-27, L=0.040, h=0.010;
  const num=s=>{ const m=s.match(/^(-?[\d.]+)(?: × 10(-?\d+))?$/); return m?Number(m[1])*(m[2]?Math.pow(10,+m[2]):1):NaN; };
  const rd=(v,n)=>{ if(!isFinite(v)||v===0) return v; const [mt,ex]=Math.abs(v).toExponential(11).split('e'), dg=mt.replace('.',''); return Math.sign(v)*Number((Number(dg.slice(0,n))+(+dg[n]>=5?1:0))+'e'+(+ex-n+1)); };   // round half up on the decimal digits (floating-point noise such as 674999.99999 must still give 6.8 × 10^5)
  const r2=v=>rd(v,2), same=(a,b)=>Math.abs(a-b)<=1e-9*Math.abs(b)+1e-300, N='([\\d.]+(?: × 10-?\\d+)?)', R=s=>new RegExp(s.replace(/#/g,N));
  let near=[];
  function check(tag){
   const st=S.st, u=S.US[st.ui], E=S.ES[st.ei], m=st.p==='e'?me:mp, up=(st.p==='e')===st.down;
   const eq=T('eq'), res=T('res'), sta=T('status'), name=st.p==='e'?'อิเล็กตรอน':'โปรตอน';
   if(/NaN|Infinity|undefined/.test(document.body.innerText)) bad.push([tag,'bad text']);
   const poly=[...$('f').querySelectorAll('polyline')]; if(poly.length!==1){ bad.push([tag,'path count',poly.length]); return; }
   const pts=poly[0].getAttribute('points').trim().split(' ').map(s=>s.split(',').map(Number)), last=pts[pts.length-1];
   if(E===0){ if(!/เส้นตรง/.test(res)||pts.some(q=>Math.abs(q[1]-111)>0.05)) bad.push([tag,'straight']); return; }
   const a=e*E/m, t=L/u, y=0.5*a*t*t, hits=y>h;
   if(Math.abs(y-h)<0.06*h) near.push([st.p,u,E,y]);
   const as=r2(a), ts=r2(t), ys=r2(0.5*as*ts*ts);
   const ma=eq.match(/a = eE\/m = \(1\.6 × 10-19\)\(([^)]+)\)\/([\d.]+ × 10-\d+) = ([^m]+?) m\/s2/);
   if(!ma||!same(num(ma[1]),E)||num(ma[2])!==m||!same(num(ma[3]),as)) bad.push([tag,'a',ma&&ma[0],as]);
   const mt=eq.match(R('t = L/u = 0\\.040/# = # s')); if(!mt||!same(num(mt[1]),u)||!same(num(mt[2]),ts)) bad.push([tag,'t',mt&&mt[0],ts]);
   const my=eq.match(R('y = ½at2 = ½\\(#\\)\\(#\\)2 = # m = # cm')); if(!my||!same(num(my[3]),ys)||!same(num(my[4]),r2(ys*100))||(ys<0.01&&!/ × 10/.test(my[3]))||hits!==/ระยะที่จะเบนถ้าไม่ชนแผ่น/.test(eq)) bad.push([tag,'y',my&&my[0],ys]);
   const way=up?'ขึ้น':'ลง';
   if(!sta.includes('แรงจึงชี้'+way)) bad.push([tag,'force direction',sta]);
   if(!hits){
     const tans=r2(as*ts/u), th=r2(Math.atan(tans)*180/Math.PI);
     const mq=eq.match(R('tan θ = at/u = \\(#\\)\\(#\\)/# = # ⇒ θ ≈ #°')); if(!mq||!same(num(mq[4]),tans)||!same(num(mq[5]),th)) bad.push([tag,'tan',mq&&mq[0],tans,th]);
     if(!res.includes('พ้นแผ่นได้ เบน'+way)||!res.includes(`${(r2(ys*100)).toString()==='0'?'':''}`)) bad.push([tag,'res pass',res]);
     // the drawn exit point: true scale
     const want=111+(up?-1:1)*y*5500; if(Math.abs(last[0]-290)>0.01||Math.abs(last[1]-want)>0.05) bad.push([tag,'exit drawn',last,want]);
     if(y<2e-5 && !/มองไม่เห็นในภาพ/.test(sta)) bad.push([tag,'tiny note missing']);
     if(y>=2e-5 && /มองไม่เห็นในภาพ/.test(sta)) bad.push([tag,'tiny note wrong']);
   } else {
     const th=r2(Math.sqrt(2*h/as)), xh=r2(u*th);
     const mh=eq.match(R('ที่เวลาและระยะตามแนวแผ่น t = √\\(2\\(0\\.010\\)/#\\) = # s x = ut = \\(#\\)\\(#\\) = # m')); if(!mh||!same(num(mh[2]),th)||!same(num(mh[5]),xh)) bad.push([tag,'hit',mh&&mh[0],th,xh]);
     if(!res.includes('ชนแผ่น'+(up?'บน':'ล่าง'))) bad.push([tag,'res hit',res]);
     const wantX=70+u*Math.sqrt(2*h/a)*5500; if(Math.abs(last[0]-wantX)>0.05||Math.abs(last[1]-(up?56:166))>0.05) bad.push([tag,'hit drawn',last,wantX]);
   }
  }
  // Ex. 2.8 and ลองทำ
  $('b-ex').click(); check('ex'); notes.push('Ex 2.8: '+T('eq')+' || '+T('res'));
  if(!/= 3\.5 × 1015 m\/s2/.test(T('eq'))||!/= 2\.0 × 10-9 s/.test(T('eq'))||!/= 7\.0 × 10-3 m = 0\.70 cm/.test(T('eq'))||!/= 0\.35 ⇒ θ ≈ 19°/.test(T('eq'))) bad.push('Ex 2.8 values');
  $('p-p').click(); check('proton'); notes.push('proton: '+T('eq').match(/y = [^c]+cm/)[0]+' || '+T('res'));
  $('b-ex').click(); const su=$('s-u'); su.value=S.US.indexOf(1e7); su.dispatchEvent(new Event('input')); check('half u'); notes.push('u = 1.0e7: '+T('eq').match(/y = .*/)[0]+' || '+T('res'));
  // every setting
  let n=0;
  for(const pp of ['e','p']) for(let ui=0;ui<S.US.length;ui++) for(let ei=0;ei<S.ES.length;ei++) for(const down of [true,false]){ Object.assign(S.st,{p:pp,ui,ei,down}); S.update(); check([pp,ui,ei,down]); n++; }
  notes.push('settings '+n+', deflections within 6 % of the plate: '+JSON.stringify(near));
  for(let i=0;i<800;i++){ const ids=['s-u','s-E','p-e','p-p','d-down','d-up','b-ex','b-fire'], id=ids[Math.floor(Math.random()*ids.length)], el=$(id);
    if(el.type==='range'){ el.value=Math.floor(Math.random()*(+el.max+1)); el.dispatchEvent(new Event('input')); } else el.click(); check(['random',i,id]); }
  return {bad,notes};
 });
 for(const x of out.notes) console.log(x);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 await p.waitForTimeout(2000); console.log('errors',errs); await b.close(); })();
