"""Uji semua permintaan revisi mobile: search hidden, 5 tab, basemap sheet, FAB, profil sheet."""
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
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844, deviceScaleFactor=3, mobile=True)
    ws.send("Page.navigate", url=BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    wait_until(ws, "location.pathname === '/dashboard'")
    wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    time.sleep(3)

    h = {}

    # ---- 1. Search default HIDDEN ----
    h["1 search default hidden"] = evaluate(ws, """(() => {
      const s = document.querySelector('.mobile-search-float');
      return {display: getComputedStyle(s).display, active: s.dataset.active || null};
    })()""")

    h["1b tab Cari memunculkan search"] = evaluate(ws, """(() => {
      document.querySelector('[data-search-open]').click();
      const s = document.querySelector('.mobile-search-float');
      return {display: getComputedStyle(s).display, active: s.dataset.active,
              fokus: document.activeElement && document.activeElement.id};
    })()""")

    # ---- 2. Profil header hilang di mobile ----
    h["2 profil header disembunyikan"] = evaluate(ws, """(() => {
      const c = document.getElementById('profileContainer');
      return {display: c ? getComputedStyle(c).display : null};
    })()""")

    # ---- 3. Tab Pelanggan -> sheet hanya section pelanggan ----
    h["3 tab Pelanggan filter sheet"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="pelanggan"]').click();
      const sheet = document.getElementById('sidebar');
      const tampil = [...sheet.querySelectorAll('[data-section-toggle]')]
        .filter(x => x.parentElement.style.display !== 'none')
        .map(x => x.dataset.sectionToggle);
      const label = sheet.querySelector('.sidebar-sheet__handle-label');
      return {sheet_open: sheet.dataset.open, mode: sheet.dataset.mode,
              section_tampil: tampil, label: label ? label.textContent : null};
    })()""")

    # ---- 4. Tab Pipa -> sheet hanya pipa+asesoris ----
    h["4 tab Pipa filter sheet"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="pipa"]').click();
      const sheet = document.getElementById('sidebar');
      const tampil = [...sheet.querySelectorAll('[data-section-toggle]')]
        .filter(x => x.parentElement.style.display !== 'none')
        .map(x => x.dataset.sectionToggle);
      return {mode: sheet.dataset.mode, section_tampil: tampil,
              label: sheet.querySelector('.sidebar-sheet__handle-label').textContent};
    })()""")

    # tutup sheet
    evaluate(ws, "document.querySelector('[data-nav=\"peta\"]').click(); true")
    time.sleep(1)

    # ---- 5. FAB basemap -> sheet pemilihan peta ----
    h["5 FAB basemap buka sheet"] = evaluate(ws, """(() => {
      document.querySelector('[data-basemap-fab]').click();
      const s = document.querySelector('[data-basemap-sheet]');
      return {open: s.dataset.open, opsi: [...s.querySelectorAll('[data-basemap]')].map(o => o.dataset.basemap)};
    })()""")

    h["5b pilih Satelit"] = evaluate(ws, """(() => {
      const label = document.getElementById('baseMapLabel');
      const sebelum = label.textContent;
      document.querySelector('[data-basemap="satelit"]').click();
      return {sebelum, sesudah: label.textContent,
              sheet_tutup: document.querySelector('[data-basemap-sheet]').dataset.open};
    })()""")
    time.sleep(1)

    h["5c pilih Peta Jalan"] = evaluate(ws, """(() => {
      document.querySelector('[data-basemap-fab]').click();
      const label = document.getElementById('baseMapLabel');
      const sebelum = label.textContent;
      document.querySelector('[data-basemap="osm"]').click();
      return {sebelum, sesudah: label.textContent};
    })()""")
    time.sleep(1)

    # ---- 6. FAB lokasi tidak menutupi zoom ----
    h["6 FAB vs tombol zoom"] = evaluate(ws, """(() => {
      const fab = document.querySelector('[data-fab]');
      const zoom = document.querySelector('.leaflet-control-zoom');
      const fr = fab.getBoundingClientRect();
      const zr = zoom ? zoom.getBoundingClientRect() : null;
      const tumpang = zr ? !(fr.bottom < zr.top || fr.top > zr.bottom ||
                             fr.right < zr.left || fr.left > zr.right) : null;
      return {fab: {y: Math.round(fr.y), bottom: Math.round(fr.bottom)},
              zoom: zr ? {y: Math.round(zr.y), top: Math.round(zr.top)} : null,
              tumpang_tindih: tumpang};
    })()""")

    # ---- 7. Tab Akun -> profil di BAWAH ----
    h["7 tab Akun -> profil sheet"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="akun"]').click();
      return {diklik: true};
    })()""")
    time.sleep(1)
    h["7b posisi profil"] = evaluate(ws, """(() => {
      const d = document.getElementById('profileDropdown');
      const r = d.getBoundingClientRect();
      return {
        hidden: d.classList.contains('hidden'),
        position: getComputedStyle(d).position,
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        innerH: innerHeight,
        di_bawah: r.bottom >= innerHeight - 2 && r.top > innerHeight / 2,
      };
    })()""")

    # ---- 8. Badge per kategori ----
    evaluate(ws, "document.querySelector('[data-nav=\"peta\"]').click(); true")
    time.sleep(1)
    h["8 badge pelanggan vs pipa"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="pelanggan"]').click();
      return {dibuka: true};
    })()""")
    time.sleep(1)
    h["8b badge setelah centang"] = evaluate(ws, """(() => {
      const cb = document.querySelector('.pelanggan-checkbox');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true})); }
      const b = document.querySelector('[data-badge="pelanggan"]');
      return {badge: b ? b.textContent : null, tampil: b ? b.dataset.show : null};
    })()""")

    print(json.dumps(h, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
