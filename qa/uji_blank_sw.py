"""Reproduksi & verifikasi: SW lama merusak aset CDN -> blank.

Simulasi: pasang SW, isi cache dengan respons RUSAK untuk URL CDN (meniru
opaque/cache basi), lalu muat /dashboard. Sebelum perbaikan hasilnya blank
dengan error "window.map.on is not a function". Setelah perbaikan, SW tidak
lagi menyentuh request cross-origin sehingga jQuery/Leaflet tetap termuat.
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


def cek(ws, label):
    out = evaluate(ws, """(function(){
      return {
        url: location.pathname,
        jquery: typeof window.jQuery,
        leaflet: typeof window.L,
        map_obj: typeof window.map,
        map_punya_on: !!(window.map && typeof window.map.on === 'function'),
        body_text_len: document.body ? document.body.innerText.trim().length : -1,
        blank: !document.body || document.body.innerText.trim().length < 40,
        grid_putus: !!document.querySelector('.grid-putus'),
        toast: document.querySelectorAll('.toast-item').length,
      };
    })()""")
    print(f"\n=== {label} ===")
    print(json.dumps(out, indent=2))
    return out


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(5)

    # bersihkan semua state
    evaluate(ws, """(async function(){
      var regs = await navigator.serviceWorker.getRegistrations();
      for (var i=0;i<regs.length;i++) await regs[i].unregister();
      var n = await caches.keys();
      for (var j=0;j<n.length;j++) await caches.delete(n[j]);
      return true;
    })()""", await_promise=True)

    ws.send("Page.reload", ignoreCache=True)
    time.sleep(6)

    # pasang SW v3 & login
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    wait_until(ws, "location.pathname === '/dashboard'")
    time.sleep(8)

    awal = cek(ws, "1. SEBELUM disuntik cache rusak")

    # suntik cache RUSAK untuk aset CDN (meniru kondisi lama)
    rusak = evaluate(ws, """(async function(){
      var nama = await caches.keys();
      if (!nama.length) return {catatan: 'belum ada cache'};
      var cache = await caches.open(nama[0]);
      var url = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js';
      // respons kosong: meniru cache basi/opaque yang tak bisa dieksekusi
      await cache.put(url, new Response('', { status: 200, headers: {'Content-Type': 'application/javascript'} }));
      var k = await cache.keys();
      return {cache: nama[0], entri: k.length, disuntik: url.split('/').pop()};
    })()""", await_promise=True)
    print("\n2. suntik cache rusak:", json.dumps(rusak))

    ws.send("Page.reload")
    time.sleep(8)
    akhir = cek(ws, "3. SETELAH cache rusak disuntik (harus tetap normal)")

    print("\n=== KESIMPULAN ===")
    if akhir.get("blank"):
        print("GAGAL: halaman blank")
    elif not akhir.get("map_punya_on"):
        print("GAGAL: peta tidak terinisialisasi")
    elif akhir.get("grid_putus"):
        print("SEBAGIAN: pesan gagal-muat tampil (jaringan/CSP bermasalah)")
    else:
        print("LULUS: halaman normal, peta hidup, cache CDN tidak merusak")

    # cek SW tidak menyimpan request cross-origin
    cdn = evaluate(ws, """(async function(){
      var nama = await caches.keys();
      var out = [];
      for (var i=0;i<nama.length;i++){
        var c = await caches.open(nama[i]);
        var k = await c.keys();
        for (var j=0;j<k.length;j++){
          if (k[j].url.indexOf(location.origin) === -1 && k[j].url.indexOf('/geo-proxy') === -1 &&
              !/openstreetmap|google/.test(k[j].url))
            out.push(k[j].url.slice(0, 90));
        }
      }
      return {entri_cdn_lain: out};
    })()""", await_promise=True)
    print("\nEntri cache non-origin (harus kosong):", json.dumps(cdn))
    return 0


if __name__ == "__main__":
    sys.exit(main())
