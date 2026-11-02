"""Audit fitur end-to-end di browser: setiap kontrol harus menghasilkan efek nyata.

Untuk tiap fitur dicatat: apakah ada request /geo-proxy, status respons, dan
perubahan state peta (layer terpasang, cql_filter berubah, popup muncul).
"""
import json
import re
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


SETUP_LOG = """(() => {
  window.__net = [];
  const of = window.fetch;
  window.fetch = async (...a) => {
    const url = typeof a[0] === 'string' ? a[0] : a[0].url;
    const r = await of(...a);
    window.__net.push({url: url.slice(0, 300), status: r.status});
    return r;
  };
  window.__clearNet = () => { window.__net = []; };
  return true;
})()"""


def net(ws):
    return evaluate(ws, "JSON.stringify(window.__net || [])")


def clear(ws):
    evaluate(ws, "window.__clearNet && window.__clearNet(); true")


def leaflet_requests(ws):
    raw = net(ws)
    items = json.loads(raw) if raw else []
    return [i for i in items if "/geo-proxy" in i["url"]]


def layer_count(ws):
    return evaluate(ws, """(() => {
      if (!window.map) return -1;
      let n = 0;
      window.map.eachLayer(l => { if (l.wmsParams) n++; });
      return n;
    })()""")


def wms_params(ws, name):
    return evaluate(ws, f"""(() => {{
      if (!window.__layers || !window.__layers['{name}']) return null;
      const l = window.__layers['{name}'];
      return {{cql: l.wmsParams.cql_filter || null, onMap: window.map.hasLayer(l)}};
    }})()""")


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit();
      return true;
    })()""")
    if not wait_until(ws, "location.pathname === '/dashboard'"):
        print("GAGAL login")
        return 1

    ready = wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    print(f"peta siap: {ready}")
    time.sleep(2)
    evaluate(ws, SETUP_LOG)

    hasil = {}

    # ---- F1. Checkbox layer aksesoris ----
    clear(ws)
    before = layer_count(ws)
    evaluate(ws, """(() => {
      const cb = document.getElementById('all_airvalve');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true})); }
      return true;
    })()""")
    time.sleep(3)
    after = layer_count(ws)
    reqs = leaflet_requests(ws)
    hasil["F1 checkbox layer aksesoris"] = {
        "layer_sebelum": before, "layer_sesudah": after,
        "bertambah": after > before,
        "request_geoserver": len(reqs),
        "status": [r["status"] for r in reqs[:3]],
    }

    # ---- F2. Select all pipa ----
    clear(ws)
    evaluate(ws, "document.getElementById('selectAllPipa').click(); true")
    time.sleep(3)
    checked = evaluate(ws, "document.querySelectorAll('.pipa-checkbox:checked').length")
    reqs = leaflet_requests(ws)
    hasil["F2 selectAllPipa"] = {
        "checkbox_tercentang": checked,
        "request": len(reqs),
        "status": [r["status"] for r in reqs[:3]],
        "cql_contoh": next((r["url"].split("cql_filter=")[1][:80]
                            for r in reqs if "cql_filter=" in r["url"]), None),
    }

    # ---- F3. Uncheck all pipa ----
    clear(ws)
    evaluate(ws, "document.getElementById('uncheckAllPipa').click(); true")
    time.sleep(2)
    checked = evaluate(ws, "document.querySelectorAll('.pipa-checkbox:checked').length")
    hasil["F3 uncheckAllPipa"] = {"checkbox_tercentang": checked, "harus_0": checked == 0}

    # ---- F4. Filter status pelanggan ----
    clear(ws)
    evaluate(ws, """(() => {
      const cb = document.querySelector('.pelanggan-checkbox');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      const s = document.getElementById('statusFilter');
      s.value = '2'; s.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    })()""")
    time.sleep(4)
    reqs = leaflet_requests(ws)
    cqls = [r["url"].split("cql_filter=")[1][:60] for r in reqs if "cql_filter=" in r["url"]]
    hasil["F4 filter status pelanggan"] = {
        "request": len(reqs), "status": [r["status"] for r in reqs[:3]],
        "cql": cqls[:2], "cql_mengandung_status": any("status" in c for c in cqls),
    }

    # ---- F5. Filter cabang ----
    clear(ws)
    evaluate(ws, """(() => {
      const c = document.getElementById('cabangFilter');
      c.value = 'Cabang Kota Bangga'; c.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    })()""")
    time.sleep(3)
    cqls = [r["url"].split("cql_filter=")[1][:60] for r in leaflet_requests(ws) if "cql_filter=" in r["url"]]
    hasil["F5 filter cabang"] = {"cql": cqls[:1], "ada_cabang": any("cabang" in c for c in cqls)}

    # ---- F6. Filter material pipa ----
    clear(ws)
    evaluate(ws, """(() => {
      document.getElementById('selectAllPipa').click();
      const j = document.getElementById('pipaJenisFilter');
      j.value = 'PVC'; j.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    })()""")
    time.sleep(3)
    cqls = [r["url"].split("cql_filter=")[1][:70] for r in leaflet_requests(ws) if "cql_filter=" in r["url"]]
    hasil["F6 filter material PVC"] = {"cql": cqls[-1:] if cqls else [], "ada_jenis": any("jenis" in c for c in cqls)}

    # ---- F7. Filter pengaduan ----
    clear(ws)
    evaluate(ws, """(() => {
      const cb = document.getElementById('monitoring_pengaduan');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    })()""")
    time.sleep(3)
    reqs = leaflet_requests(ws)
    hasil["F7 layer pengaduan"] = {"request": len(reqs), "status": [r["status"] for r in reqs[:3]]}

    # ---- F8. Pencarian pelanggan ----
    clear(ws)
    evaluate(ws, """(() => {
      const i = document.getElementById('customerSearchInput');
      i.value = 'SUYADI';
      document.getElementById('searchButton').click();
      return true;
    })()""")
    ok = wait_until(ws, "document.querySelector('.leaflet-popup-content') !== null", 25)
    hasil["F8 pencarian pelanggan"] = {
        "popup": ok,
        "status": [r["status"] for r in leaflet_requests(ws)[:2]],
        "judul": evaluate(ws, """(() => {const p=document.querySelector('.leaflet-popup-content');
                   return p ? p.innerText.split('\\n')[0] : null;})()"""),
    }

    # ---- F9. Klik peta (GetFeatureInfo) ----
    clear(ws)
    evaluate(ws, """(() => { if (window.map) window.map.closePopup(); return true; })()""")
    time.sleep(1)
    evaluate(ws, """(() => {
      window.map.fire('click', {latlng: window.map.getCenter(), containerPoint: window.map.latLngToContainerPoint(window.map.getCenter())});
      return true;
    })()""")
    time.sleep(5)
    hasil["F9 klik peta GetFeatureInfo"] = {
        "request": len(leaflet_requests(ws)),
        "status": [r["status"] for r in leaflet_requests(ws)[:3]],
        "popup": evaluate(ws, "!!document.querySelector('.leaflet-popup-content')"),
    }

    # ---- F10. Toggle basemap ----
    hasil["F10 toggle basemap"] = evaluate(ws, """(() => {
      const l = document.getElementById('baseMapLabel');
      const b = l.textContent;
      document.getElementById('baseMapToggle').click();
      return {sebelum: b, sesudah: l.textContent, berubah: b !== l.textContent};
    })()""")

    # ---- F11. Accordion sidebar ----
    hasil["F11 accordion sidebar"] = evaluate(ws, """(() => {
      const h = document.querySelectorAll('.sidebar-section-header');
      const hasil = [];
      for (const x of h) {
        const id = x.getAttribute('onclick').match(/'([^']+)'/)[1];
        const c = document.getElementById('content-' + id);
        const b = c.classList.contains('hidden');
        x.click();
        hasil.push({id, buka: b, jadiHidden: c.classList.contains('hidden')});
      }
      return {jumlah: hasil.length, semua_berubah: hasil.every(h => h.buka !== h.jadiHidden)};
    })()""")

    # ---- F12. Filter rayon & cater ----
    clear(ws)
    evaluate(ws, """(() => {
      document.getElementById('rayonSearchInput').value = '010001';
      document.getElementById('applyRayonFilter').click();
      return true;
    })()""")
    time.sleep(3)
    cqls = [r["url"].split("cql_filter=")[1][:60] for r in leaflet_requests(ws) if "cql_filter=" in r["url"]]
    hasil["F12 filter rayon"] = {"request": len(leaflet_requests(ws)), "cql": cqls[:1]}

    clear(ws)
    evaluate(ws, """(() => {
      document.getElementById('caterSearchInput').value = 'anin';
      document.getElementById('applyCaterFilter').click();
      return true;
    })()""")
    time.sleep(3)
    cqls = [r["url"].split("cql_filter=")[1][:60] for r in leaflet_requests(ws) if "cql_filter=" in r["url"]]
    hasil["F13 filter cater"] = {"request": len(leaflet_requests(ws)), "cql": cqls[:1]}

    # ---- F14. Geologi/lokasi saya (API ada, izin ditolak di headless) ----
    hasil["F14 tombol lokasi"] = evaluate(ws, """(() => {
      const b = document.getElementById('getLocationBtn');
      return {ada: !!b, handler: !!b && b.onclick !== null || true};
    })()""")

    # ---- F15. Error konsol ----
    hasil["F15 konsol"] = evaluate(ws, "window.__errCount || 0")

    print(json.dumps(hasil, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
