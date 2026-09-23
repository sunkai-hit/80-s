#!/usr/bin/env python3
"""Fail when formal HTML hotlinks images or references missing local image assets."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"

IMG_RE = re.compile(r'<img\\b[^>]*?\\bsrc=["\\\']([^"\\\']+)["\\\']', re.I)

errors: list[str] = []
html_files = sorted(WEB.rglob("*.html"))

for html_path in html_files:
    text = html_path.read_text(encoding="utf-8")
    for src in IMG_RE.findall(text):
        if src.startswith(("http://", "https://", "//", "data:")):
            errors.append(f"{html_path.relative_to(ROOT)}: remote/embedded img src -> {src}")
            continue
        parsed = urlparse(src)
        if parsed.scheme:
            errors.append(f"{html_path.relative_to(ROOT)}: unsupported img src scheme -> {src}")
            continue
        asset_path = (html_path.parent / parsed.path).resolve()
        try:
            asset_path.relative_to(ROOT)
        except ValueError:
            errors.append(f"{html_path.relative_to(ROOT)}: img src escapes repository -> {src}")
            continue
        if not asset_path.is_file():
            errors.append(f"{html_path.relative_to(ROOT)}: missing local image -> {src}")

if errors:
    print("Local asset validation FAILED:")
    for err in errors:
        print(" -", err)
    sys.exit(1)

print(f"Local asset validation OK: {len(html_files)} HTML file(s), no remote image hotlinks.")
