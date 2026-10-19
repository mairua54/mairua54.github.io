# -*- coding: utf-8 -*-
"""SIM() box used in the chapter-15 sheet v18 (Daisy Physics sheetlib.py). Paste this block at the END of the chapter's
sheetlib.py (it uses P, SPACER, _bd, IMAGES, WP, A_, PIC and os from that file), and in build() write the pictures of
IMAGES + QRIMAGES (see the chapter-15 version: `allimg = IMAGES + globals().get('QRIMAGES', [])`).
Make the pictures first:  python3 src/tools/make_qr.py <sheet>/figs/qr --chapter <NN>   and set QR_DIR to that folder.
Use in a content module:  A(SIM('16-2-1', '<title as in chapter.json>', '<one or two sentences: what the student can try>'))
"""
# ---------- simulation box: QR code + short link on the left, title and what to try on the right (added in v18) ----------
QR_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'figs', 'qr')   # pictures made by make_qr.py
SIM_BASE = 'mairua54.github.io/q/'
SIMS = []           # (id, title) in order of appearance
QRIMAGES = []       # (rId, media name, source path) of the QR pictures

def _inline_png(code, path, cx, cy):
    n = len(QRIMAGES) + 1; rid = f'rIdQR{n}'; QRIMAGES.append((rid, f'{code}.png', path))   # own list: figure ids stay as in v17
    return (f'<w:r><w:rPr><w:noProof/></w:rPr>'
            f'<w:drawing><wp:inline xmlns:wp="{WP}" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/>'
            f'<wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="{3000 + n}" name="{code}"/>'
            f'<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="{A_}" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
            f'<a:graphic xmlns:a="{A_}"><a:graphicData uri="{PIC}"><pic:pic xmlns:pic="{PIC}"><pic:nvPicPr>'
            f'<pic:cNvPr id="{3000 + n}" name="{code}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{rid}"/>'
            f'<a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/>'
            f'</a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>'
            f'</wp:inline></w:drawing></w:r>')

SIM_QR_CM = 2.8      # printed width of the picture incl. the white quiet zone; the code itself is 29/37 of it ≈ 2.2 cm
SIM_COLS = (2900, 6126)

def SIM(sid, title, what):
    """small box pointing to the interactive simulation at SIM_BASE + sid (the sheet must read fine without it)"""
    SIMS.append((sid, title))
    path = os.path.join(QR_DIR, sid + '.png')
    assert os.path.exists(path), f'missing QR picture {path} (run make_qr.py)'
    emu = int(SIM_QR_CM / 2.54 * 914400)
    bd = ''.join(_bd(s, 'single', 8, '70AD47') for s in ('top', 'left', 'bottom', 'right')) + \
         '<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
    tblpr = (f'<w:tblPr><w:tblW w:w="9026" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>{bd}</w:tblBorders>'
             '<w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" '
             'w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>')
    def tc(w, inner, mar):
        return (f'<w:tc><w:tcPr><w:tcW w:w="{w}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="EEF6E8"/>'
                f'<w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="{mar[0]}" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/>'
                f'<w:right w:w="{mar[1]}" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/></w:tcPr>{inner}</w:tc>')
    left = (f'<w:p><w:pPr><w:spacing w:before="0" w:after="20"/><w:jc w:val="center"/></w:pPr>{_inline_png("qr_" + sid, path, emu, emu)}</w:p>'
            + P(SIM_BASE + sid, before=0, after=0, jc='center', sz=22))
    right = P(f'**แบบจำลอง (สแกน QR):** {title}', after=40) + P(what, after=0)
    grid = f'<w:tblGrid><w:gridCol w:w="{SIM_COLS[0]}"/><w:gridCol w:w="{SIM_COLS[1]}"/></w:tblGrid>'
    return (f'<w:tbl>{tblpr}{grid}<w:tr><w:trPr><w:cantSplit/></w:trPr>'
            f'{tc(SIM_COLS[0], left, (80, 40))}{tc(SIM_COLS[1], right, (60, 160))}</w:tr></w:tbl>' + SPACER())
