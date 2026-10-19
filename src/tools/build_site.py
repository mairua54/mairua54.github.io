"""Build the whole GitHub Pages site of mairua54.github.io IN PLACE from src/.
usage (from the repo root):  python3 src/tools/build_site.py

Sources
  src/common/common.css, common.js         shared styles and the DP drawing/number helpers
  src/ch<NN>/chapter.json                  chapter number, title, level, topic names, list of sims (id, title, sections)
  src/ch<NN>/<id>.html                     one simulation as an artifact-style body (starts with <title>, ends after the
                                           last </script>); the markers /*COMMON_CSS*/ and /*COMMON_JS*/ are replaced by
                                           the shared files (a page without the markers is copied as it is)
Generated (never edit by hand)
  index.html                               all chapters
  <NN>/index.html                          one chapter: its simulations grouped by topic
  sims/<id>.html                           the simulation pages
  q/<id>/index.html                        PERMANENT short links printed under the QR codes in the sheets
Rules
  * an id is <chapter>-<topic>-<section> of the sheet, e.g. 15-4-3, so later insertions never renumber printed QR codes
  * a q/<id>/ that already exists is never deleted: the build stops if its id has disappeared from chapter.json
"""
import os, re, glob, html, json, shutil, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'src')
css = open(os.path.join(SRC, 'common', 'common.css'), encoding='utf8').read()
js = open(os.path.join(SRC, 'common', 'common.js'), encoding='utf8').read()
HEAD = '<!doctype html>\n<html lang="th">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
FONT = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap">\n'
STYLE = '''<style>
:root{--bg:#f6f7f9;--card:#fff;--ink:#1a1d22;--muted:#5d6570;--link:#1f5fbf;--line:#d9dde3;--chip:#e8eef8}
@media (prefers-color-scheme:dark){:root{--bg:#121417;--card:#1b1e23;--ink:#e7e9ec;--muted:#a2a9b3;--link:#6aa5ff;--line:#30353d;--chip:#22324a;color-scheme:dark}}
html,body{margin:0}body{background:var(--bg);color:var(--ink);font-family:Sarabun,Tahoma,sans-serif;font-size:17px;line-height:1.6;
padding:24px max(16px,env(safe-area-inset-right,0px)) 40px max(16px,env(safe-area-inset-left,0px))}
main{max-width:720px;margin:0 auto}h1{font-size:1.5rem;margin:0 0 4px;line-height:1.3}h2{font-size:1.1rem;margin:28px 0 4px;scroll-margin-top:12px}
p{color:var(--muted);margin:0 0 16px}a{color:var(--link);text-decoration:none}a:hover{text-decoration:underline}
.back{display:inline-block;margin-bottom:12px;font-size:15px}
.cards{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.card{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;color:var(--ink)}
.card:hover{text-decoration:none;border-color:var(--link)}.card b{display:block;font-size:1.05rem}.card span{color:var(--muted);font-size:15px}
.jump{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.jump a{background:var(--chip);border-radius:999px;padding:2px 12px;font-size:15px}
ul{list-style:none;padding:0;margin:0}li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 12px;padding:10px 0;border-top:1px solid var(--line)}
li a{font-weight:700}li span{color:var(--muted);font-size:15px}
</style>
'''
def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf8').write(text)

chapters = []
for cj in sorted(glob.glob(os.path.join(SRC, 'ch*', 'chapter.json')), key=lambda p: int(re.search(r'ch(\d+)', p).group(1))):
    ch = json.load(open(cj, encoding='utf8')); ch['dir'] = os.path.dirname(cj)
    for s in ch['sims']:
        assert re.fullmatch(rf"{ch['chapter']}-\d+-\d+", s['id']), f"bad id {s['id']} in {cj}"
        assert os.path.exists(os.path.join(ch['dir'], s['id'] + '.html')), f"missing source for {s['id']}"
    chapters.append(ch)
ids = [s['id'] for ch in chapters for s in ch['sims']]
assert len(ids) == len(set(ids)), 'duplicate simulation id'
old_q = {os.path.basename(os.path.dirname(p)) for p in glob.glob(os.path.join(ROOT, 'q', '*', 'index.html'))}
lost = sorted(old_q - set(ids))
if lost:
    sys.exit(f'STOP: printed short links would break, ids missing from chapter.json: {lost} (keep them; point them elsewhere instead)')

shutil.rmtree(os.path.join(ROOT, 'sims'), ignore_errors=True)
for ch in chapters:
    for s in ch['sims']:
        sid, title = s['id'], s['title']
        src = open(os.path.join(ch['dir'], sid + '.html'), encoding='utf8').read()
        if '/*COMMON_CSS*/' in src or '/*COMMON_JS*/' in src:
            assert src.count('/*COMMON_CSS*/') == 1 and src.count('/*COMMON_JS*/') == 1, sid
            src = src.replace('/*COMMON_CSS*/', css).replace('/*COMMON_JS*/', js)
        cut = src.index('</style>') + len('</style>')
        write(os.path.join(ROOT, 'sims', sid + '.html'),
              HEAD + '<style>html,body{margin:0}</style>\n' + src[:cut] + '\n</head>\n<body>\n' + src[cut:].lstrip('\n') + '\n</body>\n</html>\n')
        target = f'../../sims/{sid}.html'
        write(os.path.join(ROOT, 'q', sid, 'index.html'),
              HEAD + f'<title>{html.escape(title)}</title>\n<meta http-equiv="refresh" content="0; url={target}">\n'
              f'<link rel="canonical" href="{target}">\n<script>location.replace("{target}")</script>\n</head>\n'
              f'<body style="font-family:Sarabun,Tahoma,sans-serif;padding:24px">กำลังเปิดแบบจำลอง… ถ้าไม่เปิดเอง <a href="{target}">แตะที่นี่</a></body>\n</html>\n')
    # chapter page: simulations grouped by topic, with a jump bar
    groups = {}
    for s in ch['sims']: groups.setdefault(s['id'].split('-')[1], []).append(s)
    jump = ''.join(f'<a href="#t{t}">หัวข้อ {t}</a>' for t in groups)
    body = ''
    for t, lst in groups.items():
        name = ch.get('topics', {}).get(t, '')
        body += f'<h2 id="t{t}">{t}. {html.escape(name)}</h2>\n<ul>\n' + ''.join(
            f'<li><a href="../q/{s["id"]}/">{html.escape(s["title"])}</a><span>{html.escape(s["sections"])}</span></li>\n' for s in lst) + '</ul>\n'
    write(os.path.join(ROOT, ch['chapter'], 'index.html'),
          HEAD + f'<title>บท {ch["chapter"]} {html.escape(ch["title"])} · Daisy Physics แบบจำลอง</title>\n' + FONT + STYLE +
          f'</head>\n<body><main>\n<a class="back" href="../">← ทุกบท</a>\n<h1>บท {ch["chapter"]} {html.escape(ch["title"])}</h1>\n'
          f'<p>{html.escape(ch.get("level", ""))} · แบบจำลอง {len(ch["sims"])} อัน เรียงตามหัวข้อในชีท</p>\n'
          f'<nav class="jump">{jump}</nav>\n{body}</main></body>\n</html>\n')

cards = ''.join(f'<a class="card" href="{ch["chapter"]}/"><b>บท {ch["chapter"]} {html.escape(ch["title"])}</b>'
                f'<span>{html.escape(ch.get("level", ""))} · แบบจำลอง {len(ch["sims"])} อัน</span></a>\n' for ch in chapters)
write(os.path.join(ROOT, 'index.html'),
      HEAD + '<title>Daisy Physics แบบจำลอง</title>\n' + FONT + STYLE + '</head>\n<body><main>\n<h1>Daisy Physics แบบจำลอง</h1>\n'
      '<p>แบบจำลองประกอบชีทเรียนฟิสิกส์ เลือกบท หรือสแกน QR code ในชีทเพื่อเปิดแบบจำลองนั้นโดยตรง</p>\n'
      f'<div class="cards">\n{cards}</div>\n</main></body>\n</html>\n')
open(os.path.join(ROOT, '.nojekyll'), 'w').close()
write(os.path.join(ROOT, 'README.md'), '# Daisy Physics แบบจำลอง\n\nแบบจำลองประกอบชีท Daisy Physics เผยแพร่ที่ https://mairua54.github.io/\n\n'
      '- ต้นฉบับและวิธีทำงานอยู่ใน `src/` (อ่าน `src/README.md` ก่อนแก้อะไร)\n'
      '- `index.html`, `<บท>/`, `sims/`, `q/` สร้างจาก `src/tools/build_site.py` ห้ามแก้ด้วยมือ\n'
      '- `q/<รหัส>/` คือลิงก์สั้นที่พิมพ์ใต้ QR code ในชีท ห้ามลบหรือเปลี่ยนชื่อ เพราะ QR ที่พิมพ์แล้วแก้ไม่ได้\n')
print('chapters:', [c['chapter'] for c in chapters], ' sims:', len(ids))
