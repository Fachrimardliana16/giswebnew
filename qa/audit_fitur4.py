"""Audit ulang: accordion (data-attr) + GetFeatureInfo dengan klik nyata."""
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
    time.sleep(3)

    hasil = {}

    # --- Accordion lewat data-attribute + klik nyata ---
    hasil["accordion"] = evaluate(ws, """(() => {
      const hdrs = [...document.querySelectorAll('[data-section-toggle]')];
      const detail = hdrs.map(h => {
        const id = h.getAttribute('data-section-toggle');
        const c = document.getElementById('content-' + id);
        if (!c) return {id, hasil: 'no-content'};
        const sebelum = c.classList.contains('hidden');
        h.click();
        const sesudah = c.classList.contains('hidden');
        const aria = h.getAttribute('aria-expanded');
        return {id, sebelum, sesudah, berubah: sebelum !== sesudah, aria};
      });
      return {
        total: detail.length,
        semua_berubah: detail.length > 0 && detail.every(d => d.berubah),
        detail,
      };
    })()""")

    # --- GetFeatureInfo: klik pada pixel nyata di tengah peta ---
    evaluate(ws, """(() => {
      // pastikan layer pelanggan menyala
      const cb = document.querySelector('.pelanggan-checkbox');
      if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true})); }
      return true;
    })()""")
    time.sleep(4)

    # tangkap request GetFeatureInfo
    evaluate(ws, """(() => {
      window.__gfi = [];
      try {
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) {
            if (e.name.includes('request=GetFeatureInfo') || e.name.includes('REQUEST=GetFeatureInfo')) {
              window.__gfi.push(e.name.slice(0, 150));
            }
          }
        }).observe({entryTypes: ['resource']});
      } catch (e) {}
      return true;
    })()""")

    # geser ke area padat pelanggan lalu klik tepat
    evaluate(ws, """(() => {
      window.map.setView([-7.3859, 109.3589], 17);
      window.map.closePopup();
      return true;
    })()""")
    time.sleep(5)

    # klik di beberapa titik sampai ada yang kena pelanggan
    best = evaluate(ws, """(async () => {
      const c = window.map.getCenter();
      const hasil = [];
      for (let dx = -40; dx <= 40; dx += 20) {
        for (let dy = -40; dy <= 40; dy += 20) {
          const p = window.map.latLngToContainerPoint(c).add([dx, dy]);
          const ll = window.map.containerPointToLatLng(p);
          window.map.fire('click', {latlng: ll, containerPoint: p});
          await new Promise(r => setTimeout(r, 900));
          const pop = document.querySelector('.leaflet-popup-content');
          if (pop) {
            return {
              ketemu: true,
              offset: [dx, dy],
              isi: pop.innerText.replace(/\\n/g, ' | ').slice(0, 200),
              gfi: (window.__gfi || []).length,
            };
          }
        }
      }
      return {ketemu: false, gfi: (window.__gfi || []).length};
    })()""", await_promise=True)

    hasil["klik peta GetFeatureInfo"] = best
    print(json.dumps(hasil, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
