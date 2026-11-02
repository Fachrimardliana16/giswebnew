"""Uji: nav 4 tab tanpa Cari, header sheet + tombol tutup berfungsi."""
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

    # ---- POIN 1: nav tanpa tab Cari ----
    h["1 nav tabs"] = evaluate(ws, """(function(){
      var tabs = document.querySelectorAll('[data-nav]');
      var nama = [];
      for (var i=0;i<tabs.length;i++) nama.push(tabs[i].getAttribute('data-nav'));
      var nav = document.querySelector('.mobile-nav');
      return {
        jumlah: tabs.length,
        nama: nama,
        ada_tab_cari: nama.indexOf('cari') !== -1,
        grid_kolom: nav ? getComputedStyle(nav).gridTemplateColumns : null,
      };
    })()""")

    h["1b ikon cari masih di header"] = evaluate(ws, """(function(){
      var t = document.getElementById('mobileSearchToggle');
      var r = t ? t.getBoundingClientRect() : null;
      return {ada: !!t, display: t ? getComputedStyle(t).display : null,
              y: r ? Math.round(r.y) : null};
    })()""")

    # ---- POIN 2: sheet Pelanggan rapi + tombol tutup ----
    evaluate(ws, "document.querySelector('[data-nav=\"pelanggan\"]').click(); true")
    time.sleep(1.5)

    h["2a header sheet pelanggan"] = evaluate(ws, """(function(){
      var sheet = document.getElementById('sidebar');
      var t = document.getElementById('sheetTitle');
      var sub = document.getElementById('sheetSubtitle');
      var close = sheet.querySelector('.sidebar-sheet__close');
      var head = sheet.querySelector('.sidebar-sheet__head');
      var grip = sheet.querySelector('.sidebar-sheet__grip');
      var cr = close ? close.getBoundingClientRect() : null;
      return {
        judul: t ? t.textContent : null,
        subjudul: sub ? sub.textContent : null,
        ada_tombol_tutup: !!close,
        close_size: cr ? [Math.round(cr.width), Math.round(cr.height)] : null,
        close_terlihat: cr ? (cr.width > 0 && cr.height > 0) : false,
        header_h: head ? Math.round(head.getBoundingClientRect().height) : null,
        gagang_h: grip ? Math.round(grip.getBoundingClientRect().height) : null,
        sheet_h: Math.round(sheet.getBoundingClientRect().height),
      };
    })()""")

    h["2b tombol tutup berfungsi"] = evaluate(ws, """(function(){
      var sheet = document.getElementById('sidebar');
      var close = sheet.querySelector('.sidebar-sheet__close');
      var sebelum = sheet.dataset.open;
      close.click();
      return {sebelum: sebelum, sesudah: sheet.dataset.open,
              backdrop: document.querySelector('[data-sheet-backdrop]').dataset.open,
              tutup: sheet.dataset.open === '0'};
    })()""")

    # ---- sheet Pipa ----
    time.sleep(0.5)
    evaluate(ws, "document.querySelector('[data-nav=\"pipa\"]').click(); true")
    time.sleep(1.5)

    h["2c header sheet pipa"] = evaluate(ws, """(function(){
      var sheet = document.getElementById('sidebar');
      return {
        judul: document.getElementById('sheetTitle').textContent,
        subjudul: document.getElementById('sheetSubtitle').textContent,
        mode: sheet.dataset.mode,
        ada_close: !!sheet.querySelector('.sidebar-sheet__close'),
      };
    })()""")

    # ---- ukuran isi sheet ----
    h["2d proporsi isi"] = evaluate(ws, """(function(){
      var sheet = document.getElementById('sidebar');
      var isi = sheet.children[2];   // handle, head, isi
      var cbs = sheet.querySelectorAll('.layer-checkbox');
      var baris = null;
      for (var i=0;i<cbs.length;i++){
        var g = cbs[i].closest('div.group');
        if (g && g.getBoundingClientRect().height > 0) { baris = Math.round(g.getBoundingClientRect().height); break; }
      }
      return {
        baris_checkbox: baris,
        view_isi: Math.round(isi.getBoundingClientRect().height),
        scroll_isi: Math.round(isi.scrollHeight),
      };
    })()""")

    # ---- tutup via backdrop ----
    h["2e tutup via backdrop"] = evaluate(ws, """(function(){
      document.querySelector('[data-sheet-backdrop]').click();
      return {sheet: document.getElementById('sidebar').dataset.open};
    })()""")

    print(json.dumps(h, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
