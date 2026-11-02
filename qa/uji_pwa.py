"""Uji PWA: header sw.js, manifest, registrasi SW, cache, dan mode offline."""
import http.cookiejar
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def cek_http():
    print("=== 1. HEADER sw.js (harus no-cache) ===")
    req = urllib.request.Request(BASE + "/sw.js")
    with urllib.request.urlopen(req, timeout=30) as r:
        for h in ["Content-Type", "Cache-Control", "Service-Worker-Allowed"]:
            print(f"   {h}: {r.headers.get(h)}")
        body = r.read()
        print(f"   ukuran: {len(body)} byte")

    print("\n=== 2. JSON manifest ===")
    with urllib.request.urlopen(BASE + "/manifest.webmanifest", timeout=30) as r:
        print(f"   Content-Type: {r.headers.get('Content-Type')}")
        m = json.loads(r.read())
    print(f"   name: {m['name']}")
    print(f"   display: {m['display']}  start_url: {m['start_url']}")
    print(f"   icons: {len(m['icons'])}")
    for ic in m["icons"]:
        print(f"      {ic['sizes']:9} {ic['purpose']:8} {ic['src']}")

    print("\n=== 3. ikon bisa diakses ===")
    png_magic = b"\x89PNG"
    for ic in m["icons"]:
        try:
            with urllib.request.urlopen(BASE + ic["src"], timeout=20) as r:
                d = r.read()
                status = r.status
            print(f"   {ic['src']:34} {status} {len(d)}B PNG={d[:4] == png_magic}")
        except Exception as e:
            print(f"   {ic['src']:34} GAGAL {e}")


def cek_browser():
    ws = open_tab(BASE + "/login")
    time.sleep(5)

    print("\n=== 4. registrasi service worker ===")
    sw = evaluate(ws, """(async function(){
      if (!('serviceWorker' in navigator)) return {dukung: false};
      var regs = await navigator.serviceWorker.getRegistrations();
      return {
        dukung: true,
        jumlah_registrasi: regs.length,
        scope: regs.length ? regs[0].scope : null,
        aktif: regs.length ? !!(regs[0].active || regs[0].installing || regs[0].waiting) : false,
        state: regs.length && regs[0].active ? regs[0].active.state : (regs.length && regs[0].installing ? 'installing' : null),
      };
    })()""", await_promise=True)
    print("  ", json.dumps(sw, indent=2))

    print("\n=== 5. meta tag PWA di halaman ===")
    meta = evaluate(ws, """(function(){
      var ambil = function(sel, attr) {
        var el = document.querySelector(sel);
        return el ? el.getAttribute(attr) : null;
      };
      return {
        manifest: ambil('link[rel=manifest]', 'href'),
        theme_color: ambil('meta[name=theme-color]', 'content'),
        apple_icon: ambil('link[rel=apple-touch-icon]', 'href'),
        apple_capable: ambil('meta[name=apple-mobile-web-app-capable]', 'content'),
        title_apple: ambil('meta[name=apple-mobile-web-app-title]', 'content'),
      };
    })()""")
    print("  ", json.dumps(meta, indent=2))

    print("\n=== 6. aset masuk cache setelah login ===")
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    time.sleep(12)

    cache = evaluate(ws, """(async function(){
      if (!('caches' in window)) return {dukung: false};
      var nama = await caches.keys();
      var out = [];
      for (var i=0;i<nama.length;i++){
        var c = await caches.open(nama[i]);
        var k = await c.keys();
        out.push({cache: nama[i], entri: k.length});
      }
      return {dukung: true, daftar: out};
    })()""", await_promise=True)
    print("  ", json.dumps(cache, indent=2))

    return ws


def main():
    cek_http()
    cek_browser()
    return 0


if __name__ == "__main__":
    sys.exit(main())
