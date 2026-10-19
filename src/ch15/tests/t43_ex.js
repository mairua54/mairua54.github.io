const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage();
 await p.goto('file://'+require('path').resolve(__dirname,'../../../sims/15-4-3.html')); await p.waitForTimeout(400);
 const cases=[['ค่าตั้งต้น Ex. 4.4','sup',12,0.5,5.5],['ลองทำ 1','sup',12,0.5,2.5],['Ex. 4.5','sup',1.5,1.0,5.0],['Ex. 6.5 (รวมก้อน)','sup',12,1.0,7.0],
  ['ลองทำ 2 / ค่าตั้งต้นถูกประจุ','chg',12,0.5,2.5,18],['Ex. 4.3 ข. (ถูกประจุ 10 A)','chg',12,0.05,0.5,17.5],['Ex. 4.3 ก. (จ่าย 10 A)','sup',12,0.05,1.15]];
 for(const [n,m,e,r,R,ch] of cases){ const out=await p.evaluate(([m,e,r,R,ch])=>{const set=(id,v)=>{const el=document.getElementById(id); el.value=v; el.dispatchEvent(new Event('input'));};
   document.getElementById(m==='sup'?'m-sup':'m-chg').click(); set('s-emf',e); set('s-r',r); set('s-R',R); if(ch) set('s-ch',ch);
   return document.getElementById('eq').innerText.replace(/\n/g,'  |  ')+'  ||  '+document.getElementById('en-leg').innerText.replace(/\n/g,'; ');},[m,e,r,R,ch]);
  console.log(n+': '+out); }
 await b.close(); })();
