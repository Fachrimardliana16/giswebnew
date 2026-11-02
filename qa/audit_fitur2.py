"""Audit fitur: ukur state layer Leaflet langsung, bukan fetch().

Leaflet WMS memuat tile lewat <img>, jadi fetch() tidak pernah terpanggil.
Yang benar diukur: wmsParams.cql_filter, hasLayer(), dan img tile yang dibuat.
"""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def wait_until(ws, expr, timeout=25):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if evaluate(ws, expr):
                return True
        except Exception:
            pass
        time.sleep(0.7)
    return False


# Kumpulkan request tile WMS lewat PerformanceObserver (menangkap <img> juga)
HOOK = """(() => {
  window.__tiles = [];
  try {
    new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (e.name.includes('/geo-proxy')) {
          window.__tiles.push({url: e.name.slice(0, 320), size: e.transferSize});
        }
      }
    }).observe({entryTypes: ['resource']});
  } catch (e) {}
  // tangkap juga yang sudah ada
  performance.getEntriesByType('resource')
    .filter(e => e.name.includes('/geo-proxy'))
    .forEach(e => window.__tiles.push({url: e.name.slice(0, 320), size: e.transferSize}));
  window.__clearTiles = () => { window.__tiles = []; };
  return true;
})()"""


def tiles(ws):
    raw = evaluate(ws, "JSON.stringify(window.__tiles || [])")
    return json.loads(raw) if raw else []


def cqls(ws):
    out = []
    for t in tiles(ws):
        if "cql_filter=" in t["url"]:
            from urllib.parse import unquote_plus
            out.append(unquote_plus(t["url"].split("cql_filter=")[1].split("&")[0])[:80])
    return out


def state(ws):
    return evaluate(ws, """(() => {
      if (!window.map) return null;
      const layers = [];
      window.map.eachLayer(l => {
        if (l.wmsParams) layers.push({
          id: l.wmsParams.layers,
          cql: l.wmsParams.cql_filter || null,
        });
      });
      return {jumlah_layer: layers.length, layer: layers};
    })()""")


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit();
      return true;
    })()""")
    wait_until(ws, "location.pathname === '/dashboard'")
    wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    time.sleep(2)

    # ekspos layerGroups ke window supaya bisa dibaca
    evaluate(ws, """(() => {
      // app.js menyimpan layerGroups lokal; ambil dari closure tak mungkin.
      // Sebagai gantinya, baca layer yang terpasang di peta.
      return true;
    })()""")
    evaluate(ws, HOOK)

    hasil = {}

    def run(label, action_js, wait=4):
        evaluate(ws, "window.__clearTiles && window.__clearTiles(); true")
        evaluate(ws, action_js)
        time.sleep(wait)
        c = cqls(ws)
        t = tiles(ws)
        s = state(ws)
        hasil[label] = {
            "tile_request": len(t),
            "sizes_nol": sum(1 for x in t if x["size"] == 0),
            "cql": c[:3],
            "layer_terpasang": s["jumlah_layer"] if s else None,
        }

    # F1 layer pelanggan + status
    run("F1 pelanggan + status=2", """(() => {
      const cb = document.querySelector('.pelanggan-checkbox');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      const s = document.getElementById('statusFilter');
      s.value='2'; s.dispatchEvent(new Event('change', {bubbles: true}));
      window.map.fire('moveend');
      return true;
    })()""")

    # F2 select all pipa
    run("F2 selectAllPipa", """(() => {
      document.getElementById('selectAllPipa').click();
      window.map.fire('moveend');
      return true;
    })()""")

    # F3 material PVC
    run("F3 pipa material PVC", """(() => {
      const j = document.getElementById('pipaJenisFilter');
      j.value='PVC'; j.dispatchEvent(new Event('change', {bubbles: true}));
      window.map.fire('moveend');
      return true;
    })()""")

    # F4 uncheck all pipa
    run("F4 uncheckAllPipa", """(() => {
      document.getElementById('uncheckAllPipa').click();
      window.map.fire('moveend');
      return true;
    })()""")

    # F5 sumber air
    run("F5 checkbox sumber air", """(() => {
      const cb = document.getElementById('pipaReservoarMeri');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      window.map.fire('moveend');
      return true;
    })()""")

    # F6 pengaduan
    run("F6 layer pengaduan", """(() => {
      const cb = document.getElementById('monitoring_pengaduan');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      window.map.fire('moveend');
      return true;
    })()""")

    # F7 aksesoris
    run("F7 layer aksesoris airvalve", """(() => {
      const cb = document.getElementById('all_airvalve');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      window.map.fire('moveend');
      return true;
    })()""")

    # F8 rayon
    run("F8 filter rayon", """(() => {
      document.getElementById('rayonSearchInput').value='010001';
      document.getElementById('applyRayonFilter').click();
      window.map.fire('moveend');
      return true;
    })()""")

    # F9 cater
    run("F9 filter cater", """(() => {
      document.getElementById('caterSearchInput').value='anin';
      document.getElementById('applyCaterFilter').click();
      window.map.fire('moveend');
      return true;
    })()""")

    print(json.dumps(hasil, indent=2, ensure_ascii=False))
    print("\nSTATE AKHIR:", json.dumps(state(ws), indent=2, ensure_ascii=False)[:1500])
    return 0


if __name__ == "__main__":
    sys.exit(main())
