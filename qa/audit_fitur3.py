"""Audit lanjutan: GetFeatureInfo, popup, accordion, mobile, error konsol nyata."""
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


ERROR_HOOK = """(() => {
  window.__errs = [];
  const oe = console.error;
  console.error = (...a) => { window.__errs.push(a.map(String).join(' ').slice(0,200)); oe(...a); };
  window.addEventListener('error', e => window.__errs.push('ERR: ' + (e.message||'').slice(0,150)));
  window.addEventListener('unhandledrejection', e => window.__errs.push('REJ: ' + String(e.reason).slice(0,150)));
  return true;
})()"""


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
    evaluate(ws, ERROR_HOOK)

    hasil = {}

    # --- G1: GetFeatureInfo lewat klik peta nyata (event Leaflet) ---
    evaluate(ws, """(() => {
      // pasang layer pelanggan supaya ada objek di peta
      const cb = document.querySelector('.pelanggan-checkbox');
      cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true}));
      return true;
    })()""")
    time.sleep(4)

    # klik tepat di titik pelanggan yang diketahui
    evaluate(ws, """(() => {
      if (window.map) { window.map.closePopup(); }
      return true;
    })()""")
    time.sleep(1)

    evaluate(ws, """(() => {
      const target = [-7.40155, 109.34473];
      const ll = L.latLng(target[0], target[1]);
      window.map.setView(ll, 17);
      window.map.fire('click', {latlng: ll, containerPoint: window.map.latLngToContainerPoint(ll)});
      return true;
    })()""")
    ok = wait_until(ws, "document.querySelector('.leaflet-popup-content') !== null", 30)
    hasil["G1 klik peta -> popup GetFeatureInfo"] = {
        "popup_muncul": ok,
        "isi": evaluate(ws, """(() => {const p=document.querySelector('.leaflet-popup-content');
                 return p ? p.innerText.replace(/\\n/g,' | ').slice(0,180) : null;})()"""),
    }

    # --- G2: accordion semua section ---
    hasil["G2 accordion"] = evaluate(ws, """(() => {
      const hdrs = [...document.querySelectorAll('.sidebar-section-header')];
      const detail = hdrs.map(h => {
        const m = (h.getAttribute('onclick')||'').match(/'([^']+)'/);
        if (!m) return {id: '?', hasil: 'no-onclick'};
        const c = document.getElementById('content-' + m[1]);
        if (!c) return {id: m[1], hasil: 'no-content'};
        const sebelum = c.classList.contains('hidden');
        h.click();
        const sesudah = c.classList.contains('hidden');
        return {id: m[1], sebelum, sesudah, berubah: sebelum !== sesudah};
      });
      return {total: detail.length, semua_berubah: detail.every(d => d.berubah), detail};
    })()""")

    # --- G3: tombol 'Hapus Semua' aksesoris ---
    evaluate(ws, """(() => {
      const cb = document.getElementById('all_tee');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles:true})); }
      return true;
    })()""")
    time.sleep(2)
    hasil["G3 uncheckAllAksesoris"] = evaluate(ws, """(() => {
      const sebelum = document.querySelectorAll('.aksesoris-checkbox:checked').length;
      document.getElementById('uncheckAllAksesoris').click();
      const sesudah = document.querySelectorAll('.aksesoris-checkbox:checked').length;
      return {sebelum, sesudah, bekerja: sebelum > 0 && sesudah === 0};
    })()""")

    # --- G4: clear search ---
    hasil["G4 tombol clearSearch"] = evaluate(ws, """(() => {
      const i = document.getElementById('customerSearchInput');
      i.value = 'TES';
      i.dispatchEvent(new Event('input'));
      const tampil = !document.getElementById('clearSearch').classList.contains('hidden');
      document.getElementById('clearSearch').click();
      const kosong = i.value === '';
      const sembunyi = document.getElementById('clearSearch').classList.contains('hidden');
      return {tombol_muncul: tampil, input_dibersihkan: kosong, tombol_sembunyi: sembunyi};
    })()""")

    # --- G5: toggle pencarian mobile ---
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=2, mobile=True)
    time.sleep(3)
    hasil["G5 mobile: sidebar & pencarian"] = evaluate(ws, """(() => {
      const side = document.getElementById('sidebar');
      const tgl = document.getElementById('sidebarToggle');
      const offAwal = side.classList.contains('-translate-x-full');
      tgl.click();
      const terbuka = !side.classList.contains('-translate-x-full');
      const backdrop = !document.getElementById('sidebarBackdrop').classList.contains('hidden');
      tgl.click();
      const tertutup = side.classList.contains('-translate-x-full');
      const ms = document.getElementById('mobileSearchToggle');
      ms.click();
      const cariTerbuka = document.getElementById('mobileSearchContainer').classList.contains('active');
      return {sidebar_off_awal: offAwal, sidebar_terbuka: terbuka, backdrop: backdrop,
              sidebar_tertutup: tertutup, pencarian_mobile: cariTerbuka};
    })()""")

    # --- G6: error konsol ---
    errs = evaluate(ws, "JSON.stringify(window.__errs || [])")
    hasil["G6 error konsol"] = json.loads(errs) if errs else []

    ws.send("Emulation.clearDeviceMetricsOverride")
    print(json.dumps(hasil, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
