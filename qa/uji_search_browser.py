"""Uji fitur pencarian lewat browser nyata (CDP) di port 8124."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(3)

    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit();
      return true;
    })()""")
    time.sleep(7)

    state = evaluate(ws, """(() => ({
      url: location.pathname,
      mapReady: typeof window.map !== 'undefined',
      searchInput: !!document.getElementById('customerSearchInput'),
      searchBtn: !!document.getElementById('searchButton'),
    }))()""")
    print("STATE:", json.dumps(state))

    # pasang penangkap response untuk melihat hasil fetch
    evaluate(ws, """(() => {
      window.__searchLog = [];
      const origFetch = window.fetch;
      window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        const res = await origFetch(...args);
        try {
          const clone = res.clone();
          const text = await clone.text();
          window.__searchLog.push({
            url: url.slice(0, 200),
            status: res.status,
            len: text.length,
            head: text.slice(0, 120)
          });
        } catch (e) {
          window.__searchLog.push({url: url.slice(0, 120), status: res.status, err: String(e)});
        }
        return res;
      };
      return true;
    })()""")

    # isi pencarian dan klik
    print("\n== cari 'HARDIMAN' ==")
    evaluate(ws, """(() => {
      const inp = document.getElementById('customerSearchInput');
      inp.value = 'HARDIMAN';
      document.getElementById('searchButton').click();
      return true;
    })()""")
    time.sleep(6)

    log = evaluate(ws, "JSON.stringify(window.__searchLog)")
    print("FETCH:", log[:1200])

    result = evaluate(ws, """(() => {
      const popup = document.querySelector('.leaflet-popup-content');
      return {
        popupAda: !!popup,
        popupText: popup ? popup.innerText.slice(0, 200) : null,
        markerAda: !!document.querySelector('path.leaflet-interactive'),
        zoom: window.map ? window.map.getZoom() : null,
        center: window.map ? [window.map.getCenter().lat.toFixed(5), window.map.getCenter().lng.toFixed(5)] : null,
      };
    })()""")
    print("HASIL:", json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
