// usage: node sw.js id1 id2 ... → reports horizontal overflow at 400 px and 360 px, light+dark screenshots
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch();
 for(const id of process.argv.slice(2)){ for(const w of [360,400]){ const p=await b.newPage({viewport:{width:w,height:800}});
   const errs=[]; p.on('pageerror',e=>errs.push(e.message));
   await p.goto('file://'+require('path').resolve(__dirname,'../../../sims')+'/'+id+'.html'); await p.waitForTimeout(600);
   const r=await p.evaluate(()=>{ const W=document.documentElement.clientWidth; const wide=[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect(); return b.right>W+1 && getComputedStyle(e).position!=='fixed';}).slice(0,5).map(e=>e.tagName+'.'+e.className+':'+(e.textContent||'').slice(0,30)); return {sw:document.documentElement.scrollWidth,W,wide}; });
   console.log(id,w,JSON.stringify(r),errs); await p.close(); } }
 await b.close(); })();
