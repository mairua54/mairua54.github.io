/* Daisy Physics simulations — shared helpers (drawing, number formatting, controls). */
const DP=(function(){
"use strict";
const NS="http://www.w3.org/2000/svg";
const $=id=>document.getElementById(id);
function el(tag,attrs,parent){ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(parent) parent.appendChild(e); return e; }
/* text with optional math: parts written as [[ "R", {it:1} ], ["1",{sub:1}], " = 5 Ω"] or a plain string */
function txt(parent,x,y,s,attrs){
  const t=el("text",Object.assign({x,y,fill:"var(--ink)","font-size":14,"font-family":"var(--font)"},attrs||{}),parent);
  if(typeof s==="string"){ t.textContent=s; return t; }
  for(const p of s){ const [str,o]=typeof p==="string"?[p,{}]:p; const ts=el("tspan",{},t);
    if(o.it){ ts.setAttribute("font-family","var(--math)"); ts.setAttribute("font-style","italic"); ts.setAttribute("font-size",(+(attrs&&attrs["font-size"])||14)+2); }
    if(o.sub){ ts.setAttribute("font-size",Math.round(((+(attrs&&attrs["font-size"])||14))*0.72)); ts.setAttribute("dy",3); }
    if(o.back){ ts.setAttribute("dy",-3); }
    if(o.bold){ ts.setAttribute("font-weight",700); }
    ts.textContent=str; }
  return t;
}
const pl=pts=>pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
const K={stroke:"var(--ink)","stroke-width":2,fill:"none","stroke-linecap":"round","stroke-linejoin":"round"};
function wire(g,pts,extra){ return el("polyline",Object.assign({points:pl(pts)},K,extra||{}),g); }
/* zigzag resistor between two points (horizontal or vertical or any angle) */
function resistor(g,x0,y0,x1,y1,n,amp){
  n=n||5; amp=amp||7; const L=Math.hypot(x1-x0,y1-y0), ux=(x1-x0)/L, uy=(y1-y0)/L, nx=-uy, ny=ux;
  const pts=[[x0,y0]]; for(let i=0;i<n*2;i++){ const t=(i+0.5)/(n*2), s=(i%2?1:-1)*amp; pts.push([x0+ux*L*t+nx*s, y0+uy*L*t+ny*s]); } pts.push([x1,y1]);
  return wire(g,pts);
}
/* cell symbol centred at (x,y) on a wire; dir = "h" (horizontal wire) or "v"; plusSide = "left"|"right" (h) or "up"|"down" (v) */
function cell(g,x,y,dir,plusSide,opt){
  opt=opt||{}; const gap=5, Lh=opt.long||15, Sh=opt.short||8;
  const grp=el("g",{},g);
  if(dir==="h"){
    const pPlus = plusSide==="left"? x-gap : x+gap, pMinus = plusSide==="left"? x+gap : x-gap;
    el("rect",{x:x-gap-2,y:y-Lh-1,width:2*gap+4,height:2*Lh+2,fill:"var(--card)"},grp);
    el("line",{x1:pPlus,y1:y-Lh,x2:pPlus,y2:y+Lh,stroke:"var(--ink)","stroke-width":2.2},grp);
    el("line",{x1:pMinus,y1:y-Sh,x2:pMinus,y2:y+Sh,stroke:"var(--ink)","stroke-width":4.5},grp);
    if(!opt.nosign){ const sx=plusSide==="left"?-1:1;
      txt(grp,x+sx*(gap+9),y-Lh+1,"+",{"text-anchor":"middle","font-weight":700,"font-size":15});
      txt(grp,x-sx*(gap+9),y-Lh+1,"−",{"text-anchor":"middle","font-weight":700,"font-size":15}); }
  } else {
    const pPlus = plusSide==="up"? y-gap : y+gap, pMinus = plusSide==="up"? y+gap : y-gap;
    el("rect",{x:x-Lh-1,y:y-gap-2,width:2*Lh+2,height:2*gap+4,fill:"var(--card)"},grp);
    el("line",{x1:x-Lh,y1:pPlus,x2:x+Lh,y2:pPlus,stroke:"var(--ink)","stroke-width":2.2},grp);
    el("line",{x1:x-Sh,y1:pMinus,x2:x+Sh,y2:pMinus,stroke:"var(--ink)","stroke-width":4.5},grp);
    if(!opt.nosign){ const sy=plusSide==="up"?-1:1;
      txt(grp,x-Lh-8,y+sy*(gap+6)+5,"+",{"text-anchor":"middle","font-weight":700,"font-size":15});
      txt(grp,x-Lh-8,y-sy*(gap+6)+5,"−",{"text-anchor":"middle","font-weight":700,"font-size":15}); }
  }
  return grp;
}
function dot(g,x,y){ return el("circle",{cx:x,cy:y,r:3.6,fill:"var(--ink)"},g); }
function meter(g,x,y,letter,r){ r=r||15; el("circle",{cx:x,cy:y,r,fill:"var(--card)",stroke:"var(--ink)","stroke-width":2},g); return txt(g,x,y+5.5,letter,{"text-anchor":"middle","font-weight":700,"font-size":15}); }
function arrowHead(g,x,y,deg,color,size){ size=size||5; return el("path",{d:`M${-size},${-size} L${size},0 L${-size},${size} Z`,fill:color||"var(--current)",transform:`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${deg.toFixed(1)})`},g); }
/* filament bulb: circle with a cross; glow = 0..1 (power relative to the reference) */
function bulb(g,x,y,r,glow,removed){
  const grp=el("g",{},g);
  if(removed){ el("circle",{cx:x,cy:y,r,fill:"var(--card)",stroke:"var(--helper)","stroke-width":2,"stroke-dasharray":"4 3"},grp);
    txt(grp,x,y+4,"ถอด",{"text-anchor":"middle","font-size":11,fill:"var(--muted)"}); return grp; }
  if(glow>0.002){ el("circle",{cx:x,cy:y,r:r+4+12*Math.sqrt(glow),fill:"var(--glow)",opacity:(0.18+0.5*Math.sqrt(glow)).toFixed(3)},grp); }
  el("circle",{cx:x,cy:y,r,fill:glow>0.002?"var(--glow)":"var(--card)","fill-opacity":(glow>0.002?0.25+0.75*Math.sqrt(glow):1).toFixed(3),stroke:"var(--ink)","stroke-width":2},grp);
  const d=r*0.7071; el("path",{d:`M${x-d},${y-d} L${x+d},${y+d} M${x-d},${y+d} L${x+d},${y-d}`,stroke:"var(--ink)","stroke-width":1.6},grp);
  return grp;
}
/* numbers: n significant figures, sheet style (space before unit, hyphen-minus, 5+ digit numbers grouped with spaces, scientific notation outside 1e-3..1e5) */
function sig(x,n){ n=n||3; if(!isFinite(x)) return x; if(Math.abs(x)<1e-300) return 0; return Number(x.toPrecision(n)); }
function group(s){ const neg=s[0]==="-"; if(neg) s=s.slice(1); const [a,b]=s.split("."); const g=a.length>=5?a.replace(/\B(?=(\d{3})+(?!\d))/g," "):a; return (neg?"-":"")+g+(b!==undefined?"."+b:""); }
function fmt(x,n,opt){ n=n||3; opt=opt||{}; if(!isFinite(x)) return "–"; if(Math.abs(x)<1e-300) return "0";
  const s=sig(x,n), e=Math.floor(Math.log10(Math.abs(s)));
  if(!opt.nosci && (e>=5 || e<=-4 || (e>=n && !opt.intok))){ const m=s/Math.pow(10,e); const SUP={"-":"⁻","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"}; return (opt.plain? m.toFixed(n-1)+" × 10"+String(e).split("").map(c=>SUP[c]).join("") : m.toFixed(n-1)+" × 10<sup>"+e+"</sup>"); }
  return group(s.toFixed(Math.max(0,n-1-e))); }
const fx=(x,d)=>group(x.toFixed(d));
function seg(ids,cb){ ids.forEach(id=>$(id).addEventListener("click",()=>{ ids.forEach(j=>$(j).setAttribute("aria-pressed",j===id)); cb(id); })); }
function setSeg(ids,id){ ids.forEach(j=>$(j).setAttribute("aria-pressed",j===id)); }
const reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
/* equation line: " = " chunks never break inside; text after "|" is a small note */
function eqHTML(lines){ return lines.map(L=>{ const [s,tail]=L.split("|"); const parts=s.split(" = "); const body=parts.length<2?s:parts.map((c,i)=>`<span class="nw">${i?"= ":""}${c}</span>`).join(" "); return `<div>${body}${tail?` <span class="note">(${tail})</span>`:""}</div>`; }).join(""); }
const m=s=>`<i class="m">${s}</i>`, sub=s=>`<sub>${s}</sub>`;
return {NS,$,el,txt,pl,K,wire,resistor,cell,dot,meter,arrowHead,bulb,sig,fmt,fx,group,seg,setSeg,reduce,eqHTML,m,sub};
})();
