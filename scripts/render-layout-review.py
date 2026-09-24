#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Render every book page and collect layout QA before release.

Usage:
    python scripts/render-layout-review.py web/ch01/index.html

No third-party Python packages required. Requires Chrome, Edge, or Chromium.
"""
from __future__ import annotations
import json, os, re, shutil, socket, subprocess, sys, threading, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]

def find_browser():
    names = ["chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "chrome", "msedge"]
    for n in names:
        p = shutil.which(n)
        if p:
            return p
    candidates = [
        Path(os.environ.get("PROGRAMFILES", "")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Google/Chrome/Application/chrome.exe",
        Path(os.environ.get("PROGRAMFILES", "")) / "Microsoft/Edge/Application/msedge.exe",
        Path(os.environ.get("PROGRAMFILES(X86)", "")) / "Microsoft/Edge/Application/msedge.exe",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    raise SystemExit("未找到 Chrome / Edge / Chromium，无法执行视觉 QA。")

def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]

def run_browser(browser, args):
    base = [browser, "--headless=new", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--window-size=1280,1400",
            "--virtual-time-budget=2600"]
    return subprocess.run(base + args, capture_output=True, text=True, timeout=40)

def main():
    if len(sys.argv) < 2:
        raise SystemExit("用法：python scripts/render-layout-review.py web/chXX/index.html")
    rel = Path(sys.argv[1]).as_posix().lstrip("/")
    target = ROOT / rel
    if not target.exists():
        raise SystemExit(f"文件不存在：{target}")

    browser = find_browser()
    port = free_port()
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(.25)

    stem = target.parent.name
    out = ROOT / "artifacts/layout-review" / stem
    out.mkdir(parents=True, exist_ok=True)
    url = f"http://127.0.0.1:{port}/{quote(rel)}?qa=1"

    try:
        dom = run_browser(browser, ["--dump-dom", url]).stdout
        m = re.search(r'id="totalPages"[^>]*>(\d+)<', dom)
        if not m:
            raise SystemExit("无法取得总页数；页面可能没有完成排版。")
        total = int(m.group(1))

        qa = []
        q = re.search(r'<script id="layoutQaData" type="application/json">([\s\S]*?)</script>', dom)
        if q:
            try:
                qa = json.loads(q.group(1))
            except Exception:
                qa = [{"type":"qa-json-parse-failed"}]

        for i in range(1, total + 1):
            png = out / f"{i:03d}.png"
            page_url = f"{url}#p{i}"
            r = run_browser(browser, [f"--screenshot={png}", page_url])
            if r.returncode != 0:
                print(f"[WARN] 第{i}页截图失败：{r.stderr.strip()}")

        print(f"页面：{total}")
        print(f"截图：{out}")
        if qa:
            print("版式 QA 未通过：")
            print(json.dumps(qa, ensure_ascii=False, indent=2))
            raise SystemExit(2)
        print("DOM 版式 QA：PASS")
        print("下一步：人工快速浏览全部截图，确认不存在异常留白或视觉节奏问题。")
    finally:
        server.shutdown()

if __name__ == "__main__":
    main()
