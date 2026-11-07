// t11: ตรวจแบบจำลอง 14-1-1 (การขัดสีและการถ่ายโอนอิเล็กตรอน)
// คำนวณคำตอบใหม่แยกจากโค้ดของหน้า แล้วเทียบกับตัวเลขที่หน้าแสดงจริง
const { chromium } = require('playwright');
const path = require('path');
const E = 1.6e-19;
const MAT = [['แก้ว',1],['เส้นผม',2],['แผ่นเปอร์สเปกซ์',3],['ไนลอน',4],['ผ้าสักหลาด',5],
             ['ผ้าไหม',6],['ผ้าฝ้าย',7],['อำพัน',8],['พีวีซี',9],['เทฟลอน',10]];
const NS = [10,20,50,100,1000,1e6,1e9,1e10,3e10,1e11];

// แบบจำลองอ้างอิงที่เขียนใหม่
function ref(a, b, ni, q0, rubbed) {
  const ra = MAT[a][1], rb = MAT[b][1];
  const dir = ra < rb ? 1 : ra > rb ? -1 : 0;
  const moved = (dir === 0 || !rubbed) ? 0 : NS[ni];
  return { ra, rb, dir, moved, qa: q0 + dir * moved, qb: -dir * moved, tot: q0 };
}
const sig2 = x => Number(x.toPrecision(2));
const strip = s => s.replace(/\s+/g, ' ').trim();
// ครึ่งหนึ่งของหลักสุดท้ายเมื่อแสดงด้วยเลขนัยสำคัญ 2 ตัว
const round2 = x => x === 0 ? 0 : 0.5 * Math.pow(10, Math.floor(Math.log10(Math.abs(x))) - 1);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 400, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.googleapis/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../../../sims/14-1-1.html'));
  await p.waitForTimeout(400);

  let fail = 0, n = 0;
  const cases = [];
  for (const a of [0, 2, 5, 8, 9]) for (const bb of [0, 5, 8, 9]) for (const ni of [0, 2, 8, 9]) for (const q0 of [0, 20, -50]) cases.push([a, bb, ni, q0]);

  for (const [a, bb, ni, q0] of cases) {
    n++;
    const got = await p.evaluate(o => {
      window.__sim.set({ a: o.a, b: o.b, ni: o.ni, q0: o.q0, rubbed: true });
      const cells = [...document.querySelectorAll('#tbl tr')].map(r => [...r.children].map(c => c.textContent.trim()));
      return { cells, eq: document.getElementById('eq').textContent, status: document.getElementById('status').textContent };
    }, { a, b: bb, ni, q0 });
    const R = ref(a, bb, ni, q0, true);
    const qa = sig2(R.qa * E), qb = sig2(R.qb * E), tot = sig2(R.tot * E);
    const want = u => u === 0 ? '0 C' : (u > 0 ? '+' : '-') + Math.abs(sig2(u * E)).toPrecision(2).replace(/(\d\.\d)e([-+])(\d+)/, (m2, mm, s, ee) => mm + ' × 10' + (s === '-' ? '⁻' : '') + ee);
    // เทียบด้วยค่าตัวเลขที่ดึงจากข้อความ แทนการเทียบสตริงตรง ๆ
    const num = s => { const m2 = s.match(/([-+]?\d+(?:\.\d+)?)\s*×\s*10(?:<sup>)?([−-]?\d+)/); if (m2) return parseFloat(m2[1]) * Math.pow(10, parseInt(m2[2].replace('−', '-'), 10)); const m3 = s.match(/([-+]?\d+(?:\.\d+)?)/); return m3 ? parseFloat(m3[1]) : NaN; };
    const rowA = got.cells[1], rowB = got.cells[2], rowT = got.cells[3];
    const close = (x, y) => Math.abs(x - y) <= Math.abs(y) * 0.02 + 1e-30;
    const checks = [
      ['ลำดับ ก', parseInt(rowA[1], 10) === R.ra],
      ['ลำดับ ข', parseInt(rowB[1], 10) === R.rb],
      ['q ก', close(num(rowA[3]), qa)],
      ['q ข', close(num(rowB[3]), qb)],
      ['q รวม', close(num(rowT[3]), tot)],
      // ผลรวมของค่าที่ปัดแล้วต้องตรงกับประจุรวม ภายในความคลาดเคลื่อนของการปัดเป็นเลขนัยสำคัญ 2 ตัว
      ['อนุรักษ์ประจุ', (Math.abs(R.moved) > 100 * Math.abs(q0) && q0 !== 0)
        ? /ปัดเป็นเลขนัยสำคัญ 2 ตัว/.test(got.eq)
        : Math.abs(num(rowA[3]) + num(rowB[3]) - tot) <= round2(num(rowA[3])) + round2(num(rowB[3])) + 1e-30],
      ['ทิศถูกต้อง', R.dir === 0 ? /วัสดุชนิดเดียวกัน/.test(got.status)
        : new RegExp(MAT[R.dir > 0 ? a : bb][0] + '.*เสียอิเล็กตรอน').test(strip(got.status))],
    ];
    for (const [lab, ok] of checks) if (!ok) { fail++; console.log(`✗ a=${MAT[a][0]} b=${MAT[bb][0]} N=${NS[ni]} q0=${q0}e | ${lab} | ได้ ${JSON.stringify(got.cells.slice(1))}`); }
  }

  // ตรวจ Ex. 1.2 ผ่านปุ่มลัด
  const ex = await p.evaluate(async () => {
    document.getElementById('b-ex12').click();
    await new Promise(r => setTimeout(r, 50));
    const cells = [...document.querySelectorAll('#tbl tr')].map(r => [...r.children].map(c => c.textContent.trim()));
    return { cells, eq: document.getElementById('eq').textContent };
  });
  const exOK = /4\.8\s*×\s*10⁻¹⁸/.test(ex.cells[1][3].replace(/\s/g, ' ')) || ex.cells[1][3].includes('4.8');
  const exOK2 = ex.cells[2][3].includes('8.0');
  const exOK3 = ex.cells[3][3].includes('3.2');
  if (!(exOK && exOK2 && exOK3)) { fail++; console.log('✗ Ex. 1.2', JSON.stringify(ex.cells)); }
  else console.log('✓ Ex. 1.2 ตรงกับชีท:', ex.cells[1][3], '|', ex.cells[2][3], '| รวม', ex.cells[3][3]);

  // ยังไม่กดถู ต้องไม่มีประจุ
  const pre = await p.evaluate(() => {
    document.getElementById('b-reset').click();
    const cells = [...document.querySelectorAll('#tbl tr')].map(r => [...r.children].map(c => c.textContent.trim()));
    return { cells, status: document.getElementById('status').textContent };
  });
  if (!(pre.cells[1][3] === '0 C' && pre.cells[2][3] === '0 C')) { fail++; console.log('✗ ก่อนถูต้องไม่มีประจุ', JSON.stringify(pre.cells)); }
  else console.log('✓ ก่อนถูยังไม่มีประจุ');

  console.log(`\nตรวจ ${n} กรณี | ไม่ผ่าน ${fail} | error ${errs.length ? errs : 'ไม่มี'}`);
  await b.close();
  process.exit(fail || errs.length ? 1 : 0);
})();
