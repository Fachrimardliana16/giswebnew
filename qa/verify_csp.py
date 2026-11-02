"""Cek CSP di browser nyata lewat tunnel: konsol bersih? UI hidup?"""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import WS, evaluate  # noqa: E402
import urllib.request  # noqa: E402

BASE = "https://tale-apartment-qui-spanking.trycloudflare.com"
PW = "1xFnJ7NP2WAgo0m2"


def main():
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9333/json/list", timeout=20).read())
    page = next(t for t in tabs if t.get("type") == "page")
    ws = WS(page["webSocketDebuggerUrl"])
    ws.send("Page.enable")
    ws.send("Runtime.enable")
    ws.send("Log.enable")

    ws.send("Page.navigate", url=BASE + "/login")
    time.sleep(6)

    ok_login = evaluate(ws, r"""(() => ({
      styled: getComputedStyle(document.querySelector('button[type=submit]')).backgroundColor,
      hasForm: !!document.querySelector('form'),
      bodyFont: getComputedStyle(document.body).fontFamily,
      twLoaded: document.querySelectorAll('link[href*="/build/assets/"]').length > 0,
    }))()""")
    print("LOGIN:", json.dumps(ok_login))

    # login
    evaluate(ws, f"""(() => {{
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='{PW}';
      document.querySelector('form').submit();
      return true;
    }})()""")
    time.sleep(8)

    dash = evaluate(ws, r"""(() => {
      const map = document.getElementById('map');
      const r = map ? map.getBoundingClientRect() : null;
      const tiles = document.querySelectorAll('img.leaflet-tile').length;
      return {
        url: location.pathname,
        leaflet: typeof L !== 'undefined',
        jquery: typeof $ !== 'undefined',
        mapSize: r ? [Math.round(r.width), Math.round(r.height)] : null,
        tileImages: tiles,
        sidebarRendered: !!document.querySelector('#sidebar .layer-control'),
        checkboxes: document.querySelectorAll('.layer-checkbox').length,
      };
    })()""")
    print("DASHBOARD:", json.dumps(dash, indent=2))

    # interaksi: toggle basemap + buka section
    inter = evaluate(ws, r"""(() => {
      const before = document.getElementById('baseMapLabel')?.textContent;
      document.getElementById('baseMapToggle')?.click();
      const after = document.getElementById('baseMapLabel')?.textContent;
      const hdr = document.querySelector('.sidebar-section-header');
      hdr?.click();
      const c = document.querySelector('[id^="content-"]');
      return {basemapBefore: before, basemapAfter: after, sectionToggled: c ? c.classList.contains('hidden') : null};
    })()""")
    print("INTERAKSI:", json.dumps(inter))

    # kumpulkan error konsol
    errors = evaluate(ws, r"""(() => {
      return window.__cspViolations || 'tidak ada kolektor';
    })()""")
    print("CSP violations:", errors)
    return 0


if __name__ == "__main__":
    sys.exit(main())
