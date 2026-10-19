# -*- coding: utf-8 -*-
"""QR-code pictures for the simulation boxes in the sheets.
usage:  python3 src/tools/make_qr.py OUT_DIR ID [ID ...]        e.g.  python3 src/tools/make_qr.py qr 16-2-1 16-3-4
        python3 src/tools/make_qr.py OUT_DIR --chapter 16        (every id listed in src/ch16/chapter.json)
Writes OUT_DIR/<id>.png: black on white, 4-module quiet zone, 20 px per module, error correction M.
Each code holds https://mairua54.github.io/q/<id> (the permanent short link). Needs reportlab + Pillow;
if OpenCV is installed every picture is decoded again and compared with the link (QR FAILURES must be none)."""
import os, sys, json
from PIL import Image
from reportlab.graphics.barcode import qrencoder as q
BASE = 'https://mairua54.github.io/q/'
PX, QUIET = 20, 4

def matrix(text):
    qr = q.QRCode(None, q.QRErrorCorrectLevel.M); qr.addData(text); qr.make()
    n = qr.getModuleCount()
    return [[bool(qr.isDark(r, c)) for c in range(n)] for r in range(n)]

def save(text, path):
    m = matrix(text); n = len(m); size = (n + 2 * QUIET) * PX
    img = Image.new('1', (size, size), 1); px = img.load()
    for r in range(n):
        for c in range(n):
            if m[r][c]:
                for y in range((r + QUIET) * PX, (r + QUIET + 1) * PX):
                    for x in range((c + QUIET) * PX, (c + QUIET + 1) * PX):
                        px[x, y] = 0
    img.save(path, dpi=(600, 600), optimize=False)
    return n

if __name__ == '__main__':
    out, args = sys.argv[1], sys.argv[2:]
    if args[:1] == ['--chapter']:
        cj = os.path.join(os.path.dirname(__file__), '..', f'ch{args[1]}', 'chapter.json')
        args = [s['id'] for s in json.load(open(cj, encoding='utf8'))['sims']]
    os.makedirs(out, exist_ok=True)
    try:
        import cv2; det = cv2.QRCodeDetector()
    except Exception:
        det = None
    bad = []
    for i in args:
        p = os.path.join(out, i + '.png'); n = save(BASE + i, p)
        got = det.detectAndDecode(cv2.imread(p))[0] if det else '(OpenCV not installed, not checked)'
        if det and got != BASE + i: bad.append(i)
        print(i, f'{n}x{n} modules ->', got)
    print('QR FAILURES:', bad or 'none')
