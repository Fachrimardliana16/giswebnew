"""Uji 3 revisi: search di header, basemap toggle, proporsi sheet."""
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

    # ---- POIN 1: search di header, bukan overlay peta ----
    h["1a search default tertutup"] = evaluate(ws, """(() => {
      const p = document.getElementById('mobileHeaderSearch');
      const r = p.getBoundingClientRect();
      return {open: p.dataset.open, tinggi: Math.round(r.height),
              maxHeight: getComputedStyle(p).maxHeight};
    })()""")

    h["1b ikon cari ada di header"] = evaluate(ws, """(() => {
      const t = document.getElementById('mobileSearchToggle');
      const r = t ? t.getBoundingClientRect() : null;
      const hdr = document.querySelector('body > header').getBoundingClientRect();
      return {ada: !!t, display: t ? getComputedStyle(t).display : null,
              y: r ? Math.round(r.y) : null, headerY: Math.round(hdr.y), headerH: Math.round(hdr.height),
              di_dalam_header: r ? (r.y >= hdr.y && r.bottom <= hdr.bottom + 1) : null};
    })()""")

    h["1c buka panel search"] = evaluate(ws, """(() => {
      document.getElementById('mobileSearchToggle').click();
      return {diklik: true};
    })()""")
    time.sleep(1)
    h["1d posisi & fokus"] = evaluate(ws, """(() => {
      const p = document.getElementById('mobileHeaderSearch');
      const r = p.getBoundingClientRect();
      const hdr = document.querySelector('body > header').getBoundingClientRect();
      const mp = document.getElementById('map').getBoundingClientRect();
      const fab = document.querySelector('[data-fab]').getBoundingClientRect();
      return {
        open: p.dataset.open,
        panel: {y: Math.round(r.y), bottom: Math.round(r.bottom), h: Math.round(r.height)},
        header: {bottom: Math.round(hdr.bottom)},
        di_bawah_header: Math.round(r.y) >= Math.round(hdr.bottom) - 1,
        fokus: document.activeElement ? document.activeElement.id : null,
        peta_mulai: Math.round(mp.y),
        fab: {y: Math.round(fab.y), bottom: Math.round(fab.bottom)},
      };
    })()""")

    h["1e tidak tumpang tindih FAB"] = evaluate(ws, """(() => {
      const p = document.getElementById('mobileHeaderSearch').getBoundingClientRect();
      const fab = document.querySelector('[data-fab]').getBoundingClientRect();
      const tumpang = !(p.bottom <= fab.top || p.top >= fab.bottom ||
                        p.right <= fab.left || p.left >= fab.right);
      return {panel_bottom: Math.round(p.bottom), fab_top: Math.round(fab.top),
              tumpang_tindih: tumpang};
    })()""")

    # ---- POIN 2: FAB peta = toggle langsung ----
    h["2a state basemap awal"] = evaluate(ws, """(() => ({
      label: document.getElementById('baseMapLabel').textContent,
      bodyState: document.body.dataset.basemap || null,
      ikonTampil: [...document.querySelectorAll('.mobile-fab__icon')]
        .filter(i => getComputedStyle(i).display !== 'none').map(i => i.className),
    }))()""")

    h["2b klik FAB peta"] = evaluate(ws, """(() => {
      document.querySelector('[data-basemap-toggle]').click();
      return {diklik: true};
    })()""")
    time.sleep(1)
    h["2c setelah klik"] = evaluate(ws, """(() => ({
      label: document.getElementById('baseMapLabel').textContent,
      bodyState: document.body.dataset.basemap || null,
      ikonTampil: [...document.querySelectorAll('.mobile-fab__icon')]
        .filter(i => getComputedStyle(i).display !== 'none').map(i => i.className.split(' ').pop()),
      sheet_basemap_terbuka: document.querySelector('[data-basemap-sheet]').dataset.open,
    }))()""")

    h["2d klik lagi (balik)"] = evaluate(ws, """(() => {
      document.querySelector('[data-basemap-toggle]').click();
      return {diklik: true};
    })()""")
    time.sleep(1)
    h["2e state akhir"] = evaluate(ws, """(() => ({
      label: document.getElementById('baseMapLabel').textContent,
      bodyState: document.body.dataset.basemap || null,
    }))()""")

    # ---- POIN 3: proporsi sheet ----
    evaluate(ws, "document.querySelector('[data-nav=\"pelanggan\"]').click(); true")
    time.sleep(1)

    h["3a sheet pelanggan: proporsi"] = evaluate(ws, """(() => {
      const sheet = document.getElementById('sidebar');
      const isi = sheet.children[1];
      const hdr = sheet.querySelector('.sidebar-section-header');
      const cb = sheet.querySelector('.layer-checkbox, .pelanggan-checkbox');
      const row = cb ? cb.closest('.group') : null;
      const sel = sheet.querySelector('select');
      const label = sheet.querySelector('.layer-control label');
      return {
        sheet_h: Math.round(sheet.getBoundingClientRect().height),
        header_h: hdr ? Math.round(hdr.getBoundingClientRect().height) : null,
        header_font: hdr ? getComputedStyle(hdr.querySelector('h3')).fontSize : null,
        baris_checkbox_h: row ? Math.round(row.getBoundingClientRect().height) : null,
        checkbox: cb ? Math.round(cb.getBoundingClientRect().height) : null,
        label_font: label ? getComputedStyle(label).fontSize : null,
        select_h: sel ? Math.round(sel.getBoundingClientRect().height) : null,
        select_font: sel ? getComputedStyle(sel).fontSize : null,
        section_tampil: [...sheet.querySelectorAll('[data-section-toggle]')]
          .filter(x => x.parentElement.style.display !== 'none').map(x => x.dataset.sectionToggle),
      };
    })()""")

    h["3b sheet pipa: proporsi"] = evaluate(ws, """(() => {
      document.querySelector('[data-nav="pipa"]').click();
      const sheet = document.getElementById('sidebar');
      const grid = sheet.querySelector('.grid.grid-cols-2');
      return {
        mode: sheet.dataset.mode,
        section: [...sheet.querySelectorAll('[data-section-toggle]')]
          .filter(x => x.parentElement.style.display !== 'none').map(x => x.dataset.sectionToggle),
        grid_kolom: grid ? getComputedStyle(grid).gridTemplateColumns : null,
        label: sheet.querySelector('.sidebar-sheet__handle-label').textContent,
        jumlah_checkbox: sheet.querySelectorAll('.pipa-checkbox, .pipa-sumberma-checkbox, .aksesoris-checkbox').length,
      };
    })()""")

    print(json.dumps(h, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
