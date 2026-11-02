"""Uji pencarian lewat tunnel dengan tunggu eksplisit sampai peta siap."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "https://tale-apartment-qui-spanking.trycloudflare.com"


def wait_until(ws, expr, timeout=40, label=""):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if evaluate(ws, expr):
            return True, time.time() - t0
        time.sleep(1)
    return False, time.time() - t0


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(5)

    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit();
      return true;
    })()""")

    ok, dt = wait_until(ws, "location.pathname === '/dashboard'", 40, "login")
    print(f"login -> dashboard: {ok} ({dt:.1f}s)")
    if not ok:
        print("URL sekarang:", evaluate(ws, "location.href"))
        return 1

    ok, dt = wait_until(
        ws,
        "typeof window.map !== 'undefined' && window.map !== null && document.getElementById('customerSearchInput') !== null",
        40, "map",
    )
    print(f"peta + input siap: {ok} ({dt:.1f}s)")
    if not ok:
        print("map:", evaluate(ws, "typeof window.map"))
        print("appJs:", evaluate(ws, "typeof window.showToast"))
        return 1

    print("\n== cari 'SUYADI' ==")
    evaluate(ws, """(() => {
      const i = document.getElementById('customerSearchInput');
      i.value = 'SUYADI';
      document.getElementById('searchButton').click();
      return true;
    })()""")

    ok, dt = wait_until(ws, "document.querySelector('.leaflet-popup-content') !== null", 40, "popup")
    print(f"popup muncul: {ok} ({dt:.1f}s)")

    res = evaluate(ws, """(() => {
      const p = document.querySelector('.leaflet-popup-content');
      return {
        popup: !!p,
        judul: p ? (p.querySelector('h3') ? p.querySelector('h3').innerText : p.innerText.slice(0, 60)) : null,
        marker: !!document.querySelector('path.leaflet-interactive'),
        zoom: window.map ? window.map.getZoom() : null,
        center: window.map ? [Number(window.map.getCenter().lat.toFixed(5)), Number(window.map.getCenter().lng.toFixed(5))] : null,
      };
    })()""")
    print("HASIL:", json.dumps(res, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
