"""Uji 4 fitur baru: titik bertumpuk, zoom tinggi, autocomplete, auto-zoom layer."""
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
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    wait_until(ws, "location.pathname === '/dashboard'")
    wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    time.sleep(3)

    h = {}

    # ---- 1. titik bertumpuk ----
    evaluate(ws, """(function(){
      var cb = document.querySelector('.pelanggan-checkbox');
      if (cb) { cb.checked = true; cb.dispatchEvent(new Event('change',{bubbles:true})); }
      return true;
    })()""")
    time.sleep(4)

    h["1 klik area padat"] = evaluate(ws, """(async function(){
      window.map.setView([-7.3859, 109.3589], 19);
      window.map.closePopup();
      await new Promise(r=>setTimeout(r,3000));
      var c = window.map.getCenter();
      for (var dx=-25; dx<=25; dx+=12){
        for (var dy=-25; dy<=25; dy+=12){
          var p = window.map.latLngToContainerPoint(c).add([dx,dy]);
          window.map.fire('click',{latlng: window.map.containerPointToLatLng(p), containerPoint: p});
          await new Promise(r=>setTimeout(r,1400));
          var pick = document.querySelector('.fpick');
          if (pick) {
            return {mode:'pemilih', jumlah: document.querySelectorAll('.fpick__item').length,
                    judul: document.querySelector('.fpick__title').textContent};
          }
          var pop = document.querySelector('.fpop');
          if (pop) {
            return {mode:'detail_langsung', judul: document.querySelector('.fpop__nama').textContent};
          }
        }
      }
      return {mode:'tidak_ada'};
    })()""", await_promise=True)

    # pilih item pertama di pemilih lalu cek detail muncul
    h["1b pilih dari daftar"] = evaluate(ws, """(async function(){
      var items = document.querySelectorAll('.fpick__item');
      if (!items.length) return {catatan:'pemilih tidak muncul saat ini'};
      var nama = items[0].querySelector('.fpick__judul').textContent;
      items[0].click();
      await new Promise(r=>setTimeout(r,1200));
      var pop = document.querySelector('.fpop');
      return {dipilih: nama, detail_muncul: !!pop,
              judul_detail: pop ? pop.querySelector('.fpop__nama').textContent : null};
    })()""", await_promise=True)

    # ---- 2. zoom tinggi ----
    h["2 zoom tinggi"] = evaluate(ws, """(async function(){
      var hasil = {};
      for (var z of [18, 20]) {
        window.map.setZoom(z);
        await new Promise(r=>setTimeout(r,1800));
        var base = document.querySelectorAll('img.leaflet-tile:not(.leaflet-tile-loaded)').length;
        var total = document.querySelectorAll('img.leaflet-tile').length;
        hasil['zoom_'+z] = {
          peta_zoom: window.map.getZoom(),
          maxzoom_peta: window.map.getMaxZoom(),
          tile_total: total,
          tile_belum_muat: base,
          wms_aktif: (function(){var n=0; window.map.eachLayer(function(l){if(l.wmsParams)n++;}); return n;})()
        };
      }
      return hasil;
    })()""", await_promise=True)

    # ---- 3. autocomplete ----
    h["3a ketik 'herlan'"] = evaluate(ws, """(async function(){
      var inp = document.getElementById('customerSearchInput');
      inp.value = 'herlan';
      inp.dispatchEvent(new Event('input', {bubbles:true}));
      await new Promise(r=>setTimeout(r,2500));
      var panel = document.getElementById('desktopSuggest');
      var items = panel.querySelectorAll('.fsug__item');
      var out = [];
      for (var i=0;i<Math.min(items.length,4);i++){
        out.push({
          nama: items[i].querySelector('.fsug__nama').textContent.trim(),
          nolang: items[i].querySelector('.fsug__nolang').textContent.trim(),
          alamat: items[i].querySelector('.fsug__row2').textContent.trim().slice(0,40),
        });
      }
      return {terbuka: panel.dataset.open, jumlah: items.length, saran: out};
    })()""", await_promise=True)

    h["3b ketik angka nolang"] = evaluate(ws, """(async function(){
      var inp = document.getElementById('customerSearchInput');
      inp.value = '0101';
      inp.dispatchEvent(new Event('input', {bubbles:true}));
      await new Promise(r=>setTimeout(r,2500));
      var items = document.querySelectorAll('#desktopSuggest .fsug__item');
      var out = [];
      for (var i=0;i<Math.min(items.length,3);i++){
        out.push(items[i].querySelector('.fsug__nolang').textContent.trim() + ' | ' +
                 items[i].querySelector('.fsug__nama').textContent.trim());
      }
      return {jumlah: items.length, contoh: out};
    })()""", await_promise=True)

    h["3c pilih saran"] = evaluate(ws, """(async function(){
      var items = document.querySelectorAll('#desktopSuggest .fsug__item');
      if (!items.length) return {catatan:'tidak ada saran'};
      var target = items[0].dataset.nama;
      items[0].dispatchEvent(new MouseEvent('mousedown', {bubbles:true}));
      await new Promise(r=>setTimeout(r,4000));
      var pop = document.querySelector('.fpop');
      return {dipilih: target, popup_muncul: !!pop,
              nama_di_popup: pop ? pop.querySelector('.fpop__nama').textContent : null};
    })()""", await_promise=True)

    # ---- 4. auto zoom saat aktifkan layer ----
    h["4 auto zoom"] = evaluate(ws, """(async function(){
      window.map.setZoom(10);
      await new Promise(r=>setTimeout(r,1200));
      var zoomAwal = window.map.getZoom();
      var cb = document.getElementById('all_gatevalve');
      cb.checked = true;
      cb.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(r=>setTimeout(r,2500));
      return {zoom_awal: zoomAwal, zoom_akhir: window.map.getZoom(),
              menyesuaikan: window.map.getZoom() > zoomAwal};
    })()""", await_promise=True)

    print(json.dumps(h, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
