#!/usr/bin/env python3
"""Build reflowable mobile reading editions from the canonical Part II manuscripts.

No rewriting, abridgement or author-backstage notes are added to the reading copy.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "exports"
STEM = "no-spoilers-china-part2-mobile"
BOOK_TITLE = "没有剧透的中国"
PART_TITLE = "第二部分"
CHAPTERS = [
    (7, "七", "小本子"),
    (8, "八", "郑州"),
    (9, "九", "署名"),
    (10, "十", "远路"),
]

EPUB_CSS = """
@charset "utf-8";
html { writing-mode: horizontal-tb; }
body { margin: 0 0.6em; padding: 0.4em 0.15em 2em;
       font-family: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC",
                    "STSong", serif; font-size: 1em;
       line-height: 1.84; color: #252626; }
h1 { font-size: 1.55em; font-weight: 600; text-align: center;
     line-height: 1.48; margin: 1.45em 0 1.3em; }
p { text-align: justify; text-indent: 2em; margin: 0 0 0.34em; }
.scene { text-align: center; text-indent: 0; font-size: 0.79em;
         letter-spacing: 0.65em; margin: 1.38em 0; color: #7e7971; }
.cover { text-align: center; padding-top: 26vh; }
.cover h1 { font-size: 1.8em; margin: 0.2em; }
.cover p { text-indent: 0; text-align: center; margin: 0.65em 0; }
@media (prefers-color-scheme: dark) {
  body { color: #e7e1d6; background: #171717; }
  .scene { color: #a8a197; }
}
"""

WEB_CSS = """
:root { --paper:#f7f3eb; --text:#2d2b29; --muted:#80786d;
        --line:#d9d1c5; --font-size:18px; --content:42rem; }
@media(prefers-color-scheme:dark) {
 :root:not([data-theme="light"]) { --paper:#1c1c1b; --text:#e8e0d4;
                                    --muted:#b5a99c; --line:#3c3935; }
}
:root[data-theme="dark"] { --paper:#1c1c1b; --text:#e8e0d4;
                            --muted:#b5a99c; --line:#3c3935; }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { background:var(--paper);color:var(--text); margin:0;
       font-family:"Source Han Serif SC","Noto Serif CJK SC","Songti SC",
                   "STSong",serif; }
.reader-tools { font-family:system-ui,sans-serif; position:sticky;top:0;z-index:9;
 background:var(--paper);border-bottom:1px solid var(--line);
 display:flex;gap:.5rem;align-items:center;justify-content:space-between;
 padding:.55rem max(1rem,calc((100vw - 42rem)/2)); }
.reader-tools a { font-size:.8rem;color:var(--muted);text-decoration:none; }
.actions { display:flex;gap:.35rem; }
button { border:1px solid var(--line);border-radius:.5rem;background:transparent;
 color:var(--text);padding:.3rem .7rem;font-size:1rem;min-height:36px;cursor:pointer; }
main { max-width:var(--content);padding:1.1rem 1.22rem 4rem;margin:auto; }
.book-cover { text-align:center;padding:9vh 0 2rem; }
.book-cover h1 { font-weight:500;letter-spacing:.18em;font-size:clamp(1.7rem,6vw,2.35rem); }
.subtitle,.muted { color:var(--muted);font: .84rem/1.6 system-ui,sans-serif; }
.contents { max-width:19rem;margin:1rem auto 7vh;padding:1.5rem 0;
            border-top:1px solid var(--line);border-bottom:1px solid var(--line); }
.contents h2 { font:500 .8rem/2 system-ui,sans-serif;letter-spacing:.15em;
               text-align:center;color:var(--muted); }
.contents ol { list-style:none;padding:0;margin:0; }
.contents li { border-bottom:1px solid var(--line); }
.contents li:last-child { border:0; }
.contents a { display:block;color:var(--text);text-decoration:none;padding:.7rem .2rem; }
.chapter { margin:0 0 5rem;scroll-margin-top:5rem; }
.chapter h2 { text-align:center;font-size:1.48rem;letter-spacing:.1em;
              font-weight:500;line-height:1.6;margin:1rem 0 2.2rem; }
.prose { font-size:var(--font-size);line-height:1.87;
         overflow-wrap:break-word;word-break:normal; }
.prose p { text-align:justify;text-indent:2em;margin:0 0 .35em; }
.prose .scene { text-align:center;text-indent:0;letter-spacing:.6em;
               font-size:.78em;margin:1.6em 0;color:var(--muted); }
footer { text-align:center;color:var(--muted);font:.8rem/1.5 system-ui,sans-serif; }
@media(max-width:500px) { main { padding:.65rem 1.2rem 4rem; }
 .book-cover {padding:6vh 0 1rem;} .chapter h2 {margin-top:.5rem;} }
"""

def source_path(n: int) -> Path:
    return ROOT / "chapters" / f"ch{n:02}" / "manuscript-v1.0.md"

def read_chapters() -> list[dict]:
    book = []
    for number, numeral, title in CHAPTERS:
        raw = source_path(number).read_text(encoding="utf-8").replace("\r\n", "\n")
        first, sep, rest = raw.partition("\n")
        expected = f"# 第{numeral}章　{title}"
        assert sep and first.strip() == expected, (number, first)
        blocks = []
        for chunk in re.split(r"\n\s*\n", rest.strip()):
            cleaned = chunk.strip()
            if not cleaned:
                continue
            if cleaned == "***":
                blocks.append({"type": "scene", "text": "***"})
                continue
            assert not cleaned.startswith("#"), ("unexpected markdown heading", cleaned)
            text = "".join(line.strip() for line in cleaned.splitlines())
            blocks.append({"type": "paragraph", "text": text})
        assert len(blocks) > 50, f"Chapter {number} looks truncated"
        book.append({
            "number": number, "title": title, "numeral": numeral,
            "heading": f"第{numeral}章　{title}",
            "blocks": blocks,
            "source_sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest(),
            "source": str(source_path(number).relative_to(ROOT)),
        })
    return book

def prose_html(blocks: list[dict]) -> str:
    out = []
    for block in blocks:
        if block["type"] == "scene":
            out.append('<p class="scene" role="separator" aria-label="场景间隔">＊　＊　＊</p>')
        else:
            out.append("<p>" + html.escape(block["text"], quote=True) + "</p>")
    return "\n".join(out)

def create_web(book: list[dict]) -> Path:
    nav = "\n".join(
        f'<li><a href="#ch{x["number"]:02}">{html.escape(x["heading"])}</a></li>'
        for x in book
    )
    chapters = "\n".join(
        f'<section class="chapter" id="ch{x["number"]:02}">'
        f'<h2>{html.escape(x["heading"])}</h2>'
        f'<div class="prose">{prose_html(x["blocks"])}</div></section>'
        for x in book
    )
    script = """
(function(){
 const root=document.documentElement;
 const prev=Number(localStorage.getItem("part2-font") || 18);
 const saved=localStorage.getItem("part2-theme");
 let font=Math.min(24,Math.max(15,prev));
 function apply(){root.style.setProperty("--font-size",font+"px");
   localStorage.setItem("part2-font",String(font));}
 apply();
 if(saved==="dark"||saved==="light")root.setAttribute("data-theme",saved);
 document.getElementById("larger").onclick=function(){font=Math.min(24,font+1);apply()};
 document.getElementById("smaller").onclick=function(){font=Math.max(15,font-1);apply()};
 document.getElementById("theme").onclick=function(){
  const current=root.getAttribute("data-theme") ||
    (window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
  const next=current==="dark"?"light":"dark";
  root.setAttribute("data-theme",next);localStorage.setItem("part2-theme",next);
 };
})();
"""
    doc = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<title>{BOOK_TITLE}｜{PART_TITLE}</title>
<style>{WEB_CSS}</style></head><body>
<header class="reader-tools"><a href="#home">目录 · {PART_TITLE}</a>
<div class="actions">
<button id="smaller" aria-label="缩小字号">A−</button>
<button id="larger" aria-label="放大字号">A＋</button>
<button id="theme" aria-label="切换明暗主题">◐</button>
</div></header>
<main id="home"><div class="book-cover"><p class="subtitle">1978—1995</p>
<h1>{BOOK_TITLE}</h1><p class="subtitle">{PART_TITLE} · 第七—十章</p></div>
<nav class="contents" aria-label="章节目录"><h2>目 录</h2><ol>{nav}</ol></nav>
{chapters}<footer>《没有剧透的中国》 · 第二部分 · 完</footer></main>
<script>{script}</script></body></html>"""
    target = OUT / (STEM + ".html")
    target.write_text(doc, encoding="utf-8")
    return target

def set_east_asian_font(style, font_name="宋体"):
    style.font.name = font_name
    style._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), font_name)

def create_docx(book: list[dict]) -> Path:
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(13.3), Cm(20.5)
    sec.left_margin, sec.right_margin = Cm(1.45), Cm(1.45)
    sec.top_margin, sec.bottom_margin = Cm(1.6), Cm(1.65)
    sec.header_distance, sec.footer_distance = Cm(.6), Cm(.65)
    normal = doc.styles["Normal"]
    normal.font.size = Pt(11.7)
    normal.font.color.rgb = RGBColor(39, 38, 36)
    set_east_asian_font(normal)
    normal.paragraph_format.line_spacing = 1.65
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(3)
    normal.paragraph_format.first_line_indent = Pt(23.4)
    normal.paragraph_format.widow_control = True

    heading = doc.styles["Heading 1"]
    set_east_asian_font(heading)
    heading.font.size = Pt(19)
    heading.font.bold = False
    heading.font.color.rgb = RGBColor(35, 33, 30)
    heading.paragraph_format.space_before = Pt(16)
    heading.paragraph_format.space_after = Pt(21)
    heading.paragraph_format.first_line_indent = Pt(0)
    heading.paragraph_format.keep_with_next = True
    heading.paragraph_format.page_break_before = True

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.paragraph_format.space_before = Pt(90)
    r = title.add_run(BOOK_TITLE)
    r.font.size = Pt(24)
    r.font.name = "宋体"
    r._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), "宋体")

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub.paragraph_format.first_line_indent = Pt(0)
    sub.paragraph_format.space_before = Pt(22)
    run = sub.add_run(PART_TITLE + "  ·  第七—十章")
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor(108, 103, 98)

    doc.add_page_break()
    toc = doc.add_paragraph()
    toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    toc.paragraph_format.first_line_indent = Pt(0)
    toc.paragraph_format.space_after = Pt(22)
    toc.add_run("目　录").font.size = Pt(17)
    for x in book:
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_after = Pt(11)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(x["heading"])

    for x in book:
        head = doc.add_paragraph(x["heading"], style="Heading 1")
        head.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for block in x["blocks"]:
            if block["type"] == "scene":
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.first_line_indent = Pt(0)
                p.paragraph_format.space_before = Pt(12)
                p.paragraph_format.space_after = Pt(12)
                mark = p.add_run("＊　＊　＊")
                mark.font.size = Pt(10)
                mark.font.color.rgb = RGBColor(142, 134, 127)
            else:
                doc.add_paragraph(block["text"])

    footer = sec.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.first_line_indent = Pt(0)
    foot = footer.add_run("没有剧透的中国  ·  第二部分   ")
    foot.font.size = Pt(8)
    foot.font.color.rgb = RGBColor(150, 144, 136)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), "PAGE")
    footer._p.append(fld)
    doc.core_properties.title = BOOK_TITLE + "｜" + PART_TITLE
    doc.core_properties.subject = "第二部分 第七章至第十章"
    target = OUT / (STEM + ".docx")
    doc.save(target)
    return target

def create_epub(book: list[dict]) -> Path:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    head = '<?xml version="1.0" encoding="utf-8"?>\n'
    ns = ' xmlns="http://www.w3.org/1999/xhtml"'
    def xhtml(title, body):
        return (head + f'<html{ns} xml:lang="zh-CN"><head>'
                f'<meta charset="utf-8"/><title>{html.escape(title)}</title>'
                f'<link rel="stylesheet" type="text/css" href="../styles/reader.css"/>'
                f'</head><body>{body}</body></html>')
    files = {}
    files["META-INF/container.xml"] = (
        head + '<container version="1.0" '
        'xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles>'
        '<rootfile full-path="OEBPS/package.opf" '
        'media-type="application/oebps-package+xml"/></rootfiles></container>'
    )
    files["OEBPS/styles/reader.css"] = EPUB_CSS
    files["OEBPS/text/cover.xhtml"] = xhtml(
        BOOK_TITLE, f'<section class="cover"><h1>{BOOK_TITLE}</h1>'
                    f'<p>{PART_TITLE}</p><p>第七—十章</p></section>'
    )
    nav_links = []
    item_entries = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        '<item id="style" href="styles/reader.css" media-type="text/css"/>',
        '<item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>',
    ]
    spine = ['<itemref idref="cover"/>']
    for x in book:
        base = f'ch{x["number"]:02}.xhtml'
        files["OEBPS/text/" + base] = xhtml(
            x["heading"],
            '<section epub:type="chapter" xmlns:epub="http://www.idpf.org/2007/ops">'
            f'<h1>{html.escape(x["heading"])}</h1>{prose_html(x["blocks"])}</section>',
        )
        item_entries.append(
            f'<item id="ch{x["number"]}" href="text/{base}" media-type="application/xhtml+xml"/>'
        )
        spine.append(f'<itemref idref="ch{x["number"]}"/>')
        nav_links.append(
            f'<li><a href="text/{base}">{html.escape(x["heading"])}</a></li>'
        )
    files["OEBPS/nav.xhtml"] = (
        head + '<html xmlns="http://www.w3.org/1999/xhtml" '
        'xmlns:epub="http://www.idpf.org/2007/ops"><head>'
        '<meta charset="utf-8"/><title>目录</title></head><body>'
        '<nav epub:type="toc" id="toc"><h1>目录</h1><ol>'
        + "".join(nav_links) + '</ol></nav></body></html>'
    )
    files["OEBPS/package.opf"] = (
        head + '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" '
        'unique-identifier="book-id" xml:lang="zh-CN">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        '<dc:identifier id="book-id">urn:uuid:no-spoilers-china-part2-2026</dc:identifier>'
        f'<dc:title>{BOOK_TITLE}｜{PART_TITLE}</dc:title>'
        '<dc:language>zh-CN</dc:language>'
        f'<meta property="dcterms:modified">{timestamp}</meta>'
        '</metadata><manifest>'
        + "".join(item_entries)
        + '</manifest><spine>'
        + "".join(spine)
        + '</spine></package>'
    )
    target = OUT / (STEM + ".epub")
    with zipfile.ZipFile(target, "w") as z:
        z.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        for name, value in files.items():
            z.writestr(name, value.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)
    return target

def validate(book: list[dict], epub: Path, docx: Path, web: Path):
    read_doc = Document(docx)
    doc_pars = [p.text for p in read_doc.paragraphs]
    for x in book:
        assert x["heading"] in doc_pars, x["heading"]
        expected = [b["text"] if b["type"] == "paragraph" else "＊　＊　＊"
                    for b in x["blocks"]]
        i = doc_pars.index(x["heading"])
        end = next((j for j in range(i+1,len(doc_pars))
                    if doc_pars[j].startswith("第") and "章　" in doc_pars[j]), len(doc_pars))
        actual = doc_pars[i+1:end]
        assert actual == expected, (x["number"],len(expected),len(actual))
    assert web.stat().st_size > 30000
    with zipfile.ZipFile(epub) as z:
        assert z.namelist()[0] == "mimetype"
        assert z.getinfo("mimetype").compress_type == zipfile.ZIP_STORED
        assert z.testzip() is None
        for x in book:
            ns = {"h": "http://www.w3.org/1999/xhtml"}
            root = ET.fromstring(z.read(f'OEBPS/text/ch{x["number"]:02}.xhtml'))
            texts = [p.text for p in root.findall(".//h:p", ns)]
            expected = [b["text"] if b["type"] == "paragraph" else "＊　＊　＊"
                        for b in x["blocks"]]
            assert texts == expected, ("EPUB-text-mismatch", x["number"])
        ET.fromstring(z.read("OEBPS/package.opf"))
        ET.fromstring(z.read("OEBPS/nav.xhtml"))
    print("PASS: EPUB XML + DOCX + HTML paragraph fidelity checks")
    print(json.dumps({
        "chapters": [
            {"chapter": x["number"], "paragraphs": len(x["blocks"]),
             "source_sha256": x["source_sha256"]}
            for x in book
        ],
        "outputs": {p.suffix: {"path":str(p),"bytes":p.stat().st_size}
                    for p in (epub,docx,web)}
    }, ensure_ascii=False, indent=2))

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    book = read_chapters()
    epub = create_epub(book)
    docx = create_docx(book)
    web = create_web(book)
    validate(book, epub, docx, web)

if __name__ == "__main__":
    main()
