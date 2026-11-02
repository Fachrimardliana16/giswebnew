"""Uji cache tile WMS + mode offline (jaringan dimatikan)."""
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


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)

    # login + buka peta, aktifkan satu layer supaya ada tile
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    wait_until(ws, "location.pathname === '/dashboard'")
    wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    time.sleep(3)

    evaluate(ws, """(async function(){
      var cb = document.querySelector('.pelanggan-checkbox');
      if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change',{bubbles:true})); }
      window.map.setView([-7.3859, 109.3589], 15);
      await new Promise(r=>setTimeout(r,6000));
      return true;
    })()""", await_promise=True)

    # cek tile masuk cache
    cache = evaluate(ws, """(async function(){
      var nama = await caches.keys();
      var out = {};
      for (var i=0;i<nama.length;i++){
        var c = await caches.open(nama[i]);
        var k = await c.keys();
        out[nama[i].replace(/webgis-|v1-2026-11-02/g,'')] = k.length;
        if (nama[i].indexOf('tile') !== -1 && k.length) {
          out.contoh_tile = k.slice(0,2).map(function(r){ return r.url.slice(0, 90); });
        }
      }
      return out;
    })()""", await_promise=True)
    print("=== CACHE SETELAH BUKA PETA ===")
    print(json.dumps(cache, indent=2, ensure_ascii=False))

    # ---- simulasi OFFLINE ----
    ws.send("Network.enable")
    ws.send("Network.emulateNetworkConditions",
            offline=True, latency=0, downloadThroughput=0, uploadThroughput=0)
    print("\n=== JARINGAN DIMATIKAN ===")

    time.sleep(1)
    ws.send("Page.navigate", url=BASE + "/dashboard")
    time.sleep(6)

    offline = evaluate(ws, """(function(){
      return {
        url: location.pathname,
        judul: document.title,
        ada_peta: !!document.getElementById('map'),
        offline_bar: !!document.getElementById('offlineBar'),
        navigator_online: navigator.onLine,
        body_panjang: document.body ? document.body.innerText.length : 0,
      };
    })()""")
    print(json.dumps(offline, indent=2, ensure_ascii=False))

    # kembalikan jaringan
    ws.send("Network.emulateNetworkConditions",
            offline=False, latency=0, downloadThroughput=-1, uploadThroughput=-1)
    time.sleep(3)
    print("\n=== JARINGAN PULIH ===")
    print(json.dumps(evaluate(ws, """(function(){
      return {online: navigator.onLine, offline_bar: !!document.getElementById('offlineBar')};
    })()"""), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
