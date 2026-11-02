"""Buktikan perbedaan vh vs dvh saat address bar mobile terlihat.

CDP tidak bisa meniru selisih vh/dvh secara langsung, jadi kita render
elemen uji dengan height:100vh dan height:100dvh, lalu bandingkan.
Kalau hasilnya sama, emulator tidak mereproduksi kondisi Safari/Chrome
mobile dan perbaikan harus diverifikasi di perangkat nyata.
"""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def main():
    ws = open_tab(BASE + "/dashboard")
    time.sleep(6)
    ws.send("Emulation.setDeviceMetricsOverride", width=390, height=844,
            deviceScaleFactor=3, mobile=True)
    time.sleep(2)

    hasil = evaluate(ws, """(function(){
      // 1. bandingkan vh vs dvh
      var a = document.createElement('div');
      a.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:100vh;visibility:hidden;pointer-events:none';
      var b = document.createElement('div');
      b.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:100dvh;visibility:hidden;pointer-events:none';
      var c = document.createElement('div');
      c.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:100svh;visibility:hidden;pointer-events:none';
      document.body.append(a, b, c);

      var vh = Math.round(a.getBoundingClientRect().height);
      var dvh = Math.round(b.getBoundingClientRect().height);
      var svh = Math.round(c.getBoundingClientRect().height);

      a.remove(); b.remove(); c.remove();

      // 2. dukung dvh?
      var dukungDvh = CSS.supports('height', '1dvh');

      return {
        viewport_innerHeight: window.innerHeight,
        visualViewport: window.visualViewport ? Math.round(window.visualViewport.height) : null,
        vh: vh, dvh: dvh, svh: svh,
        dvh_berbeda_dari_vh: dvh !== vh,
        browser_dukung_dvh: dukungDvh,
        catatan: dukungDvh
          ? (dvh === vh
              ? 'engine mendukung dvh; di emulator nilainya sama karena tidak ada address bar dinamis'
              : 'dvh berbeda dari vh — perbaikan terbukti relevan')
          : 'engine TIDAK mendukung dvh -> fallback vh dipakai',
      };
    })()""")
    print(json.dumps(hasil, indent=2, ensure_ascii=False))

    # 3. pastikan CSS benar-benar memakai dvh (baca dari stylesheet terkirim)
    css = evaluate(ws, """(async function(){
      var link = document.querySelector('link[href*="/build/assets/"][rel=stylesheet]');
      if (!link) return {error: 'css tidak ditemukan'};
      var t = await (await fetch(link.href)).text();
      var m = t.match(/\\.sidebar-sheet\\{[^}]*\\}/);
      return {
        file: link.href.split('/').pop(),
        aturan_sheet: m ? m[0].slice(0, 300) : 'tidak ketemu',
        ada_dvh: t.indexOf('dvh') !== -1,
        jumlah_dvh: (t.match(/dvh/g) || []).length,
      };
    })()""", await_promise=True)
    print("\nCSS terkirim:")
    print(json.dumps(css, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
