"""Uji: header sheet tidak terpotong, 5 tab berfungsi, akun di header."""
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

    # ---- header tidak terpotong setelah sheet dibuka ----
    evaluate(ws, "document.querySelector('[data-nav=\"pelanggan\"]').click(); true")
    time.sleep(1.5)

    h["header sheet tidak terpotong"] = evaluate(ws, """(function(){
      var s = document.getElementById('sidebar');
      var out = [];
      for (var i = 0; i < s.children.length; i++) {
        var c = s.children[i];
        var r = c.getBoundingClientRect();
        out.push({
          idx: i,
          cls: (c.className||'').split(' ')[0],
          h: Math.round(r.height),
          scrollH: c.scrollHeight,
          clientH: c.clientHeight,
          bisa_scroll: c.scrollHeight > c.clientHeight + 1,
          overflowY: getComputedStyle(c).overflowY,
          flex: getComputedStyle(c).flex,
        });
      }
      var close = s.querySelector('.sidebar-sheet__close');
      var cr = close.getBoundingClientRect();
      var head = s.querySelector('.sidebar-sheet__head');
      var hr = head.getBoundingClientRect();
      return {
        children: out,
        close: {w: Math.round(cr.width), h: Math.round(cr.height),
                di_dalam_head: cr.top >= hr.top - 1 && cr.bottom <= hr.bottom + 1},
        head_h: Math.round(hr.height),
      };
    })()""")

    # ---- 5 tab ----
    hasil_tab = {}
    for tab in ["pelanggan", "pengaduan", "jaringan", "aksesoris"]:
        evaluate(ws, f"document.querySelector('[data-nav=\"{tab}\"]').click(); true")
        time.sleep(1.2)
        hasil_tab[tab] = evaluate(ws, """(function(){
          var s = document.getElementById('sidebar');
          var sec = [];
          var hdrs = s.querySelectorAll('[data-section-toggle]');
          for (var i=0;i<hdrs.length;i++){
            var w = hdrs[i].parentElement;
            if (getComputedStyle(w).display !== 'none' && w.getBoundingClientRect().height > 5)
              sec.push(hdrs[i].getAttribute('data-section-toggle'));
          }
          return {judul: document.getElementById('sheetTitle').textContent,
                  sub: document.getElementById('sheetSubtitle').textContent,
                  section: sec, mode: s.dataset.mode};
        })()""")

    h["4 tab isi sheet"] = hasil_tab

    # ---- tombol tutup ----
    h["tombol tutup"] = evaluate(ws, """(function(){
      var s = document.getElementById('sidebar');
      s.querySelector('.sidebar-sheet__close').click();
      return {tertutup: s.dataset.open === '0'};
    })()""")

    # ---- akun di header ----
    time.sleep(0.6)
    h["akun di header"] = evaluate(ws, """(function(){
      var a = document.getElementById('mobileAkunToggle');
      a.click();
      var pd = document.getElementById('profileDropdown');
      var r = pd.getBoundingClientRect();
      return {
        ada: !!a,
        dropdown_terbuka: !pd.classList.contains('hidden'),
        posisi: {top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height)},
        di_bawah: r.bottom >= innerHeight - 2,
        aria: a.getAttribute('aria-expanded'),
      };
    })()""")

    print(json.dumps(h, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
