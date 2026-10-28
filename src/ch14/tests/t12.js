// 14-1-2: induction and grounding. An independent copy of the charge rules is driven with the same actions as the page,
// then the table, the drawing (symbols counted), the log and the status text are compared with it.
// usage (after building the site): NODE_PATH=$(npm root -g) node src/ch14/tests/t12.js
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:400,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/14-1-2.html'); await p.waitForTimeout(400);
 const out=await p.evaluate(()=>{
  const $=id=>document.getElementById(id), T=id=>$(id).innerText.replace(/\s+/g,' ').trim(), click=id=>$(id).click();
  const bad=[], notes=[];
  // ---- independent model ----
  let M;
  const reset=mode=>{ M={mode,s:M?M.s:-1,lv:0,gnd:false,Q:0,touch:true,qA:0,qB:0}; };   // the page keeps the chosen rod when it starts again
  const eq=()=>{ if(M.mode==='es'){ if(M.gnd) M.Q=-2*M.s*M.lv; } else if(M.touch){ const t=M.qA+M.qB; M.qA=t/2-2*M.s*M.lv; M.qB=t/2+2*M.s*M.lv; } };
  const parts=()=>({plate:M.Q/2-M.s*M.lv, leaves:M.Q/2+M.s*M.lv});
  const num=s=>Number(s.replace(/[^\d+-]/g,'')||0);
  function check(tag){
   const rows=[...$('tbl').querySelectorAll('tr')].map(r=>[r.cells[0].innerText.trim(),r.cells[1].innerText.trim()]);
   const get=k=>{ const r=rows.find(r=>r[0]===k); return r?r[1]:null; };
   if(num(get('แท่ง'))!==6*M.s) bad.push([tag,'rod',get('แท่ง')]);
   const svg=$('f'), syms=[...svg.querySelectorAll('text')].filter(t=>t.textContent==='+'||t.textContent==='−');
   const nPlus=syms.filter(t=>t.textContent==='+').length, nMinus=syms.length-nPlus;
   const rodPlus=M.lv>0&&M.s>0?6:0, rodMinus=M.lv>0&&M.s<0?6:0;
   let wantPlus=rodPlus, wantMinus=rodMinus;
   const addQ=q=>{ if(q>0) wantPlus+=q; else wantMinus+=-q; };
   if(M.mode==='es'){ const {plate,leaves}=parts();
     if(num(get('จาน'))!==plate||num(get('แผ่นโลหะบาง'))!==leaves||num(get('ประจุสุทธิของอิเล็กโทรสโคป'))!==M.Q) bad.push([tag,'es table',rows,M]);
     if(/กาง/.test(get('แผ่นโลหะบาง'))!==(leaves!==0)) bad.push([tag,'leaves word']);
     addQ(plate); addQ(leaves);
     const st=T('status'); if(leaves===0?!/หุบ/.test(st.split(' ')[0]+st):!new RegExp('แผ่นโลหะบางมีประจุ'+(leaves>0?'บวก':'ลบ')).test(st)) bad.push([tag,'status leaves',st]);
     if(M.gnd&&M.lv>0&&!/ไม่เป็นกลาง/.test(st)) bad.push([tag,'grounded with rod',st]);
     if(M.Q===0&&M.lv===0&&!/เป็นกลาง/.test(st)) bad.push([tag,'neutral',st]);
     // leaves angle grows with the charge on them
     const L=[...svg.querySelectorAll('line')].filter(l=>l.getAttribute('stroke-width')==='4'&&l.getAttribute('y1')==='212');
     if(L.length!==2) bad.push([tag,'leaves drawn',L.length]); else { const dx=Math.abs(+L[0].getAttribute('x2')-190); if((dx>0.5)!==(leaves!==0)) bad.push([tag,'leaf angle',dx,leaves]); }
   } else {
     if(num(get('ทรงกลม A'))!==M.qA||num(get('ทรงกลม B'))!==M.qB||num(get('ประจุรวม A + B'))!==0) bad.push([tag,'sp table',rows,M]);
     addQ(M.qA); addQ(M.qB);
     if(!M.touch&&M.lv>0){ wantPlus+=2; wantMinus+=2; }   // one induced pair drawn in each separated sphere
     const st=T('status'); if(!M.touch&&M.qA!==0&&!/ขนาดเท่ากัน ชนิดตรงข้าม/.test(st)) bad.push([tag,'sp status',st]);
     if(M.touch&&M.lv>0&&!/ถ้านำแท่งออกตอนนี้/.test(st)) bad.push([tag,'sp touching status',st]);
   }
   if(nPlus!==wantPlus||nMinus!==wantMinus) bad.push([tag,'symbols',nPlus,nMinus,wantPlus,wantMinus,JSON.stringify(M)]);
   if(/NaN|undefined|Infinity/.test(document.body.innerText)) bad.push([tag,'bad text']);
  }
  function lastLog(){ const li=[...$('log').querySelectorAll('li')]; return li.length?li[li.length-1].innerText:''; }
  const before=()=>JSON.parse(JSON.stringify(M));
  function doLv(lv){ const a=before(); click('lv'+lv); if(lv!==a.lv){ M.lv=lv; eq(); flowCheck(a,'lv'+lv); } }
  function doSign(s){ const a=before(); click(s<0?'r-neg':'r-pos'); if(s!==a.s){ M.s=s; eq(); flowCheck(a,'sign'); } }
  function doGnd(){ const a=before(); click('b-gnd'); M.gnd=!M.gnd; eq(); flowCheck(a,'gnd'); }
  function doSep(){ const a=before(); click('b-sep'); M.touch=!M.touch; eq(); flowCheck(a,'sep'); }
  function flowCheck(a,tag){   // the log line must state the right amount and direction of electron flow
    const L=lastLog();
    if(M.mode==='es'){ const dQ=M.Q-a.Q;
      if(dQ>0&&!L.includes(`อิเล็กตรอน ${dQ} หน่วยไหลจากอิเล็กโทรสโคปผ่านนิ้วลงดิน`)) bad.push([tag,'log out',L,dQ]);
      if(dQ<0&&!L.includes(`อิเล็กตรอน ${-dQ} หน่วยไหลจากดินผ่านนิ้วขึ้นมา`)) bad.push([tag,'log in',L,dQ]);
      if(dQ===0&&/ดิน/.test(L)) bad.push([tag,'log ground none',L]);
    } else { const dA=M.qA-a.qA;
      if(dA>0&&!L.includes(`อิเล็กตรอน ${dA} หน่วยเคลื่อนจาก A ไป B`)) bad.push([tag,'log A to B',L]);
      if(dA<0&&!L.includes(`อิเล็กตรอน ${-dA} หน่วยเคลื่อนจาก B ไป A`)) bad.push([tag,'log B to A',L]); }
  }
  // ---- the orders in the sheet, both rods, every distance ----
  for(const s of [-1,1]) for(const lv of [1,2,3]){
    click('m-es'); reset('es'); doSign(s); doLv(lv); doGnd(); doGnd(); doLv(0); check(['es right',s,lv]);
    if(M.Q!==-2*s*lv) bad.push(['es right order',s,lv,M.Q]);
    click('m-es'); reset('es'); doSign(s); doLv(lv); doGnd(); doLv(0); doGnd(); check(['es wrong',s,lv]);
    if(M.Q!==0) bad.push(['es wrong order',s,lv,M.Q]);
    click('m-sp'); reset('sp'); doSign(s); doLv(lv); doSep(); doLv(0); check(['sp right',s,lv]);
    if(M.qA!==-2*s*lv||M.qB!==2*s*lv) bad.push(['sp right order',s,lv]);
    click('m-sp'); reset('sp'); doSign(s); doLv(lv); doLv(0); doSep(); check(['sp wrong',s,lv]);
    if(M.qA!==0||M.qB!==0) bad.push(['sp wrong order',s,lv]);
  }
  // ---- ลองทำ ----
  click('m-es'); reset('es'); doSign(-1); doLv(2); doGnd(); doLv(0); doGnd(); notes.push('try1 wrong: '+T('tbl')+' | '+T('status'));
  click('b-reset'); reset('es'); doLv(2); doGnd(); doGnd(); doLv(0); notes.push('try1 right: '+T('tbl')+' | '+T('status'));
  if(M.Q!==4) bad.push('try1 +4');
  click('m-sp'); reset('sp'); doLv(2); doSep(); doLv(0); notes.push('try2 a: '+T('tbl')); if(M.qA!==4||M.qB!==-4) bad.push('try2 a');
  click('b-reset'); reset('sp'); doLv(2); doLv(0); doSep(); notes.push('try2 b: '+T('tbl')); if(M.qA!==0) bad.push('try2 b');
  click('b-plus'); reset('es'); M.Q=4; doSign(-1); check('plus');
  const L=[]; for(const lv of [1,2,3]){ doLv(lv); check(['ex1.4',lv]); L.push(parts().leaves); }
  notes.push('Ex 1.4 negative rod leaves: '+L.join(', ')+' | '+T('status')); if(L.join()!=='1,0,-1') bad.push(['ex1.4 neg',L]);
  click('b-plus'); reset('es'); M.Q=4; doSign(1); const L2=[]; for(const lv of [1,2,3]){ doLv(lv); L2.push(parts().leaves); } if(L2.join()!=='3,4,5') bad.push(['ex1.4 pos',L2]);
  notes.push('Ex 1.4 positive rod leaves: '+L2.join(', ')+' | '+T('status'));
  click('b-reset'); reset('es'); doSign(-1); doLv(3); doGnd(); notes.push('try4: '+T('tbl')+' | '+T('status')); if(parts().plate!==6||parts().leaves!==0) bad.push('try4');
  // ---- random use of every control ----
  click('m-es'); reset('es');
  for(let i=0;i<4000;i++){
    const r=Math.random();
    if(r<0.04){ click('m-es'); reset('es'); }
    else if(r<0.08){ click('m-sp'); reset('sp'); }
    else if(r<0.11){ click('b-reset'); reset(M.mode); }
    else if(r<0.14 && M.mode==='es'){ click('b-plus'); reset('es'); M.Q=4; }
    else if(r<0.30) doSign(Math.random()<0.5?-1:1);
    else if(r<0.65) doLv(Math.floor(Math.random()*4));
    else if(M.mode==='es') doGnd(); else doSep();
    check(['random',i]);
  }
  return {bad,notes};
 });
 for(const n of out.notes) console.log(n);
 console.log('bad',out.bad.length,JSON.stringify(out.bad.slice(0,8)));
 console.log('errors',errs); await b.close(); })();
