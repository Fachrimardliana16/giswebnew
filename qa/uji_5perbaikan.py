"""Uji 5 perbaikan: header menyatu, lokasi, popup, caching tile, maxBounds."""
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

    # ---- 1. header menyatu ----
    h["1 header"] = evaluate(ws, """(function(){
      var hd = document.querySelector('body > header');
      var cs = getComputedStyle(hd);
      var r = hd.getBoundingClientRect();
      var mp = document.getElementById('map').getBoundingClientRect();
      return {
        position: cs.position,
        backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
        background: cs.backgroundImage.slice(0, 60),
        borderBottom: cs.borderBottomWidth + ' ' + cs.borderBottomColor,
        shadow: cs.boxShadow === 'none' ? 'none' : 'ada',
        h: Math.round(r.height),
        peta_mulai: Math.round(mp.top),
        tanpa_celah: Math.round(r.bottom) === Math.round(mp.top),
      };
    })()""")

    # ---- 2. tombol lokasi ----
    h["2a handler lokasi"] = evaluate(ws, """(function(){
      var asli = document.getElementById('getLocationBtn');
      var fab = document.querySelector('[data-location-fab]');
      return {
        tombol_asli_ada: !!asli,
        fab_ada: !!fab,
        asli_display: asli ? getComputedStyle(asli).display : null,
      };
    })()""")

    h["2b klik FAB lokasi"] = evaluate(ws, """(function(){
      window.__geo = null;
      navigator.geolocation.getCurrentPosition = function(ok, err) {
        window.__geo = 'dipanggil';
        err({code: 1, message: 'uji'});
      };
      document.querySelector('[data-location-fab]').click();
      return {geolocation_dipanggil: window.__geo};
    })()""")

    # ---- 3. popup ----
    h["3 popup baru"] = evaluate(ws, """(function(){
      // pasang layer pelanggan lalu klik
      var cb = document.querySelector('.pelanggan-checkbox');
      if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change',{bubbles:true})); }
      window.map.setView([-7.3859, 109.3589], 17);
      window.map.closePopup();
      return {siap: true};
    })()""")
    time.sleep(4)

    h["3b hasil klik"] = evaluate(ws, """(async function(){
      var c = window.map.getCenter();
      for (var dx=-40; dx<=40; dx+=20){
        for (var dy=-40; dy<=40; dy+=20){
          var p = window.map.latLngToContainerPoint(c).add([dx,dy]);
          var ll = window.map.containerPointToLatLng(p);
          window.map.fire('click', {latlng: ll, containerPoint: p});
          await new Promise(function(r){ setTimeout(r, 800); });
          var pop = document.querySelector('.leaflet-popup-content');
          if (pop) {
            return {
              muncul: true,
              ada_kelas_fpop: !!document.querySelector('.fpop'),
              judul: document.querySelector('.fpop__nama') ? document.querySelector('.fpop__nama').textContent : null,
              status_badge: document.querySelector('.fpop__status') ? document.querySelector('.fpop__status').textContent.trim() : null,
              kartu: document.querySelectorAll('.fpop__kartu-item').length,
              grup: document.querySelectorAll('.fpop__grup').length,
              baris: document.querySelectorAll('.fpop__row').length,
              ada_nav: !!document.querySelector('.fpop__nav'),
              ada_koord: document.querySelector('.fpop__koord') ? document.querySelector('.fpop__koord').textContent.trim() : null,
              tinggi: Math.round(pop.getBoundingClientRect().height),
            };
          }
        }
      }
      return {muncul: false};
    })()""", await_promise=True)

    # ---- 4. cache tile ----
    h["4a opsi layer"] = evaluate(ws, """(function(){
      if (!window.__layers) return {catatan: 'layerGroups tidak terekspos'};
      return {};
    })()""")

    h["4b versi filter stabil"] = evaluate(ws, """(async function(){
      var cb = document.querySelector('.pelanggan-checkbox');
      var s = document.getElementById('statusFilter');
      var net = [];
      var of = window.fetch;
      // rekam URL tile lewat PerformanceObserver
      window.__tiles = [];
      if (!window.__obs) {
        window.__obs = new PerformanceObserver(function(list){
          list.getEntries().forEach(function(e){
            if (e.name.indexOf('/geo-proxy') !== -1 && e.name.indexOf('GetMap') !== -1)
              window.__tiles.push(e.name);
          });
        });
        window.__obs.observe({entryTypes:['resource']});
      }
      window.__tiles = [];

      // set filter dua kali dengan nilai sama
      s.value = '2'; s.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(function(r){ setTimeout(r, 1500); });
      var gelombang1 = window.__tiles.length;

      s.value = ''; s.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(function(r){ setTimeout(r, 1200); });
      s.value = '2'; s.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(function(r){ setTimeout(r, 1500); });
      var gelombang2 = window.__tiles.length - gelombang1;

      var contoh = window.__tiles[0] || '';
      var m = contoh.match(/[?&]_v=([^&]+)/);
      return {
        tile_gelombang_1: gelombang1,
        tile_gelombang_2: gelombang2,
        ada_param_random: contoh.indexOf('random=') !== -1,
        ada_param_v: !!m,
        nilai_v: m ? m[1] : null,
        tiled: contoh.indexOf('tiled=false') === -1,
        contoh_url: contoh.slice(0, 140),
      };
    })()""", await_promise=True)

    # ---- 5. maxBounds ----
    h["5 batas peta"] = evaluate(ws, """(function(){
      var b = window.map.getBounds();
      var mb = window.map.options.maxBounds;
      // coba geser jauh ke barat laut
      window.map.setView([-7.05, 109.0], 11);
      var b2 = window.map.getBounds();
      return {
        maxBounds: mb ? [[mb.getSouth(), mb.getWest()], [mb.getNorth(), mb.getEast()]] : null,
        viscosity: window.map.options.maxBoundsViscosity,
        minZoom: window.map.options.minZoom,
        bisa_geser_pojok: Math.round(b2.getWest()) <= 110,
        bounds_setelah_geser: [Number(b2.getSouth().toFixed(2)), Number(b2.getWest().toFixed(2)),
                               Number(b2.getNorth().toFixed(2)), Number(b2.getEast().toFixed(2))],
      };
    })()""")

    print(json.dumps(h, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
