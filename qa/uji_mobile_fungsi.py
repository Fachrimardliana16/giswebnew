"""Uji fungsionalitas mobile app shell: tab, sheet, FAB, search melayang, badge."""
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

    hasil = {}

    # ---- 1. Tab Layer membuka sheet ----
    hasil["1 tab Layer -> sheet buka"] = evaluate(ws, """(() => {
      const tab = document.querySelector('[data-sheet-open]');
      tab.click();
      const sheet = document.getElementById('sidebar');
      const bd = document.querySelector('[data-sheet-backdrop]');
      return {
        sheet_open: sheet.dataset.open === '1',
        backdrop: bd.dataset.open === '1',
        tab_aktif: document.querySelector('[data-nav="layer"]').getAttribute('aria-selected'),
        aria_expanded: tab.getAttribute('aria-expanded'),
        bisa_scroll: sheet.querySelector('div:nth-child(2)') ? true : false,
      };
    })()""")

    time.sleep(1)

    # ---- 2. Sheet menampilkan layer checkbox ----
    hasil["2 sheet berisi kontrol layer"] = evaluate(ws, """(() => {
      const sheet = document.getElementById('sidebar');
      return {
        checkbox_layer: sheet.querySelectorAll('.layer-checkbox').length,
        select_filter: sheet.querySelectorAll('select').length,
        accordion: sheet.querySelectorAll('[data-section-toggle]').length,
      };
    })()""")

    # ---- 3. Tab Peta menutup sheet ----
    hasil["3 tab Peta -> sheet tutup"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="peta"]').click();
      const sheet = document.getElementById('sidebar');
      return {
        sheet_open: sheet.dataset.open === '1',
        tab_aktif: document.querySelector('[data-nav="peta"]').getAttribute('aria-selected'),
      };
    })()""")

    # ---- 4. FAB basemap mengganti layer ----
    time.sleep(1)
    hasil["4 FAB basemap"] = evaluate(ws, """(() => {
      const label = document.getElementById('baseMapLabel');
      const sebelum = label ? label.textContent : null;
      document.querySelector('[data-basemap-fab]').click();
      return {sebelum, sesudah: label ? label.textContent : null,
              berubah: sebelum !== (label ? label.textContent : null)};
    })()""")

    # ---- 5. Search melayang ----
    hasil["5 search melayang"] = evaluate(ws, """(() => {
      const inp = document.getElementById('mobileFloatSearch');
      if (!inp) return {error: 'input tidak ada'};
      inp.value = 'SUYADI';
      document.getElementById('mobileFloatSearchBtn').click();
      return {terisi: inp.value, terkirim: true};
    })()""")
    ok = wait_until(ws, "document.querySelector('.leaflet-popup-content') !== null", 30)
    hasil["5b hasil search muncul"] = {
        "popup": ok,
        "judul": evaluate(ws, """(() => {const p=document.querySelector('.leaflet-popup-content');
                   return p ? p.innerText.split('\\n')[1] : null;})()"""),
    }

    # ---- 6. Badge jumlah layer ----
    evaluate(ws, "document.querySelector('[data-sheet-open]').click(); true")
    time.sleep(1)
    hasil["6 badge layer"] = evaluate(ws, """(() => {
      const sebelum = document.querySelector('[data-layer-badge]').textContent;
      const cb = document.querySelector('.layer-checkbox');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles: true})); }
      const sesudah = document.querySelector('[data-layer-badge]').textContent;
      const tampil = document.querySelector('[data-layer-badge]').dataset.show === '1';
      return {sebelum, sesudah, badge_tampil: tampil};
    })()""")

    # ---- 7. Accordion di dalam sheet ----
    hasil["7 accordion dalam sheet"] = evaluate(ws, """(() => {
      const h = document.querySelector('[data-section-toggle]');
      const id = h.getAttribute('data-section-toggle');
      const c = document.getElementById('content-' + id);
      const sebelum = c.classList.contains('hidden');
      h.click();
      return {id, berubah: sebelum !== c.classList.contains('hidden')};
    })()""")

    # ---- 8. Backdrop menutup sheet ----
    hasil["8 backdrop tutup sheet"] = evaluate(ws, """(() => {
      document.querySelector('[data-sheet-backdrop]').click();
      return {sheet_open: document.getElementById('sidebar').dataset.open === '1'};
    })()""")

    # ---- 9. Tab Akun membuka profil ----
    hasil["9 tab Akun"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="akun"]').click();
      return {diklik: true};
    })()""")
    time.sleep(1)
    hasil["9b dropdown profil"] = evaluate(ws, """(() => {
      const d = document.getElementById('profileDropdown');
      return {terbuka: d ? !d.classList.contains('hidden') : null};
    })()""")

    print(json.dumps(hasil, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
