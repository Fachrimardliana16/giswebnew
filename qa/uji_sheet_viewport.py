"""Uji sheet mobile dengan simulasi address bar Safari/Chrome terlihat.

Di mobile, `vh` mengacu ke viewport terbesar (tanpa address bar), sedangkan
`dvh` mengikuti area yang benar-benar terlihat. CDP bisa meniru kondisi ini:
tinggi layout 844 (dvh penuh), lalu kita kecilkan tinggi visual.
"""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def wait_until(ws, expr, timeout=40):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if evaluate(ws, expr):
                return True
        except Exception:
            pass
        time.sleep(0.8)
    return False


def ukur(ws, label):
    out = evaluate(ws, """(function(){
      var s = document.getElementById('sidebar');
      var hd = s.querySelector('.sidebar-sheet__head');
      var cl = s.querySelector('.sidebar-sheet__close');
      var grip = s.querySelector('.sidebar-sheet__grip');
      var isi = s.querySelector('.sidebar-sheet__isi');

      var sr = s.getBoundingClientRect();
      var hr = hd ? hd.getBoundingClientRect() : null;
      var cr = cl ? cl.getBoundingClientRect() : null;

      // vh palsu: elemen uji untuk mengukur nilai vh sebenarnya
      var probe = document.getElementById('__vhProbe');
      if (!probe) {
        probe = document.createElement('div');
        probe.id = '__vhProbe';
        probe.style.cssText = 'position:fixed;height:100vh;width:1px;top:0;left:0;pointer-events:none;visibility:hidden';
        document.body.appendChild(probe);
      }
      var probe2 = document.getElementById('__dvhProbe');
      if (!probe2) {
        probe2 = document.createElement('div');
        probe2.id = '__dvhProbe';
        probe2.style.cssText = 'position:fixed;height:100dvh;width:1px;top:0;left:0;pointer-events:none;visibility:hidden';
        document.body.appendChild(probe2);
      }

      return {
        innerHeight: window.innerHeight,
        visualViewport: window.visualViewport ? Math.round(window.visualViewport.height) : null,
        nilai_100vh: Math.round(probe.getBoundingClientRect().height),
        nilai_100dvh: Math.round(probe2.getBoundingClientRect().height),
        sheet: {top: Math.round(sr.top), bottom: Math.round(sr.bottom), h: Math.round(sr.height)},
        header: hr ? {top: Math.round(hr.top), h: Math.round(hr.height), terlihat: hr.top >= 0} : null,
        close: cr ? {top: Math.round(cr.top), bottom: Math.round(cr.bottom),
                     terlihat: cr.top >= 0 && cr.bottom <= window.innerHeight} : null,
        grip_terlihat: grip ? grip.getBoundingClientRect().top >= 0 : null,
        isi_h: isi ? Math.round(isi.getBoundingClientRect().height) : null,
        header_di_layar: hr ? (hr.top >= 0 && hr.bottom <= window.innerHeight) : null,
      };
    })()""")
    print(f"\n=== {label} ===")
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return out


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844,
            deviceScaleFactor=3, mobile=True)
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

    # ---- Skenario 1: address bar TERSEMBUNYI (tinggi penuh 844) ----
    evaluate(ws, "document.querySelector('[data-nav=\"pelanggan\"]').click(); true")
    time.sleep(1.4)
    hasil["address bar tersembunyi"] = ukur(ws, "Skenario A: address bar tersembunyi (844px)")

    evaluate(ws, "document.querySelector('[data-nav=\"peta\"]').click(); true")
    time.sleep(0.8)

    # ---- Skenario 2: address bar TERLIHAT (visual viewport lebih pendek) ----
    # Tiru kondisi Safari/Chrome saat address bar muncul: layout tetap 844,
    # tetapi area yang terlihat hanya 780.
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=780,
            deviceScaleFactor=3, mobile=True)
    time.sleep(2)
    evaluate(ws, "document.querySelector('[data-nav=\"aksesoris\"]').click(); true")
    time.sleep(1.4)
    hasil["address bar terlihat"] = ukur(ws, "Skenario B: address bar terlihat (780px)")

    # ---- Skenario 3: sangat pendek (keyboard muncul) ----
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=600,
            deviceScaleFactor=3, mobile=True)
    time.sleep(2)
    evaluate(ws, "document.querySelector('[data-nav=\"jaringan\"]').click(); true")
    time.sleep(1.4)
    hasil["keyboard muncul"] = ukur(ws, "Skenario C: keyboard muncul (600px)")

    # ringkasan
    print("\n=== RINGKASAN ===")
    for k, v in hasil.items():
        hd = v.get("header") or {}
        cl = v.get("close") or {}
        print(f"{k:24} sheet_h={v['sheet']['h']:4} header_top={hd.get('top')!s:5} "
              f"header_terlihat={hd.get('terlihat')!s:5} close_terlihat={cl.get('terlihat')!s:5} "
              f"vh={v['nilai_100vh']} dvh={v['nilai_100dvh']}")

    # kembalikan
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844,
            deviceScaleFactor=3, mobile=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
