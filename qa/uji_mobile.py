"""Uji mobile app shell di beberapa lebar + pastikan desktop tak berubah."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def wait_until(ws, expr, timeout=30):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if evaluate(ws, expr):
                return True
        except Exception:
            pass
        time.sleep(0.7)
    return False


def ukur(ws, label):
    res = evaluate(ws, """(() => {
      const r = e => e ? e.getBoundingClientRect() : null;
      const vis = e => e && getComputedStyle(e).display !== 'none' && r(e).width > 0;
      const nav = document.querySelector('[data-bottom-nav]');
      const fab = document.querySelector('[data-fab]');
      const sheet = document.getElementById('sidebar');
      const footer = document.querySelector('body > footer');
      const floatSearch = document.querySelector('.mobile-search-float');
      const desktopSearch = document.querySelector('#customerSearchInput');

      const kv = (el) => el ? {x: Math.round(r(el).x), y: Math.round(r(el).y),
                               w: Math.round(r(el).width), h: Math.round(r(el).height)} : null;

      // target sentuh kecil
      const kecil = [...document.querySelectorAll('button, a, input, select')]
        .filter(e => {
          const b = r(e);
          return b && b.width > 0 && b.height > 0 && vis(e) && (b.height < 44 || b.width < 24);
        }).map(e => ({tag: e.tagName, id: e.id || null, h: Math.round(r(e).height), w: Math.round(r(e).width),
                      txt: (e.innerText || e.value || '').slice(0, 18)}));

      return {
        viewport: [innerWidth, innerHeight],
        header: kv(document.querySelector('body > header')),
        nav: vis(nav) ? kv(nav) : null,
        fab: vis(fab) ? kv(fab) : null,
        sheet_open: sheet ? sheet.dataset.open === '1' : null,
        sheet_visible: vis(sheet),
        footer_visible: vis(footer),
        floatSearch: vis(floatSearch),
        desktopSearchVisible: vis(desktopSearch),
        map: kv(document.getElementById('map')),
        touch_kecil: kecil.slice(0, 10),
        touch_kecil_jumlah: kecil.length,
      };
    })()""")
    print(f"\n=== {label} ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))
    return res


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    wait_until(ws, "location.pathname === '/dashboard'")
    wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    time.sleep(2)

    # ---- desktop dulu (baseline) ----
    ws.send("Emulation.setDeviceMetricsOverride", width=1440, height=900, deviceScaleFactor=1, mobile=False)
    time.sleep(3)
    ukur(ws, "DESKTOP 1440x900")

    # ---- mobile 390 ----
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=3, mobile=True)
    time.sleep(4)
    ukur(ws, "MOBILE 390x844")

    # buka sheet
    evaluate(ws, "document.querySelector('[data-sheet-open]').click(); true")
    time.sleep(1)
    ukur(ws, "MOBILE 390 — sheet terbuka")

    # tutup sheet
    evaluate(ws, "document.querySelector('[data-nav=\"peta\"]').click(); true")
    time.sleep(1)
    ukur(ws, "MOBILE 390 — sheet ditutup")

    # ---- 360 ----
    ws.send("Emulation.setDeviceMetricsOverride", width=360, height=780, deviceScaleFactor=3, mobile=True)
    time.sleep(3)
    ukur(ws, "MOBILE 360x780")

    # ---- 768 (tablet, harus kembali desktop) ----
    ws.send("Emulation.setDeviceMetricsOverride", width=768, height=1024, deviceScaleFactor=2, mobile=False)
    time.sleep(3)
    ukur(ws, "TABLET 768 (desktop layout)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
