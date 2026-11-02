"""Cari lokasi dengan titik benar-benar bertumpuk untuk uji pemilih fitur."""
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

    # aktifkan pelanggan + asesoris supaya ada kemungkinan bertumpuk
    evaluate(ws, """(function(){
      ['pelanggan','all_airvalve','all_gatevalve','all_tee','monitoring_pengaduan'].forEach(function(id){
        var cb = document.querySelector('.' + (id==='pelanggan'?'pelanggan-checkbox':'layer-checkbox#'+id));
        if (id === 'pelanggan') cb = document.querySelector('.pelanggan-checkbox');
        else cb = document.getElementById(id);
        if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change',{bubbles:true})); }
      });
      return true;
    })()""")
    time.sleep(6)

    # cari titik dengan >=2 fitur memakai WFS langsung (data rapat)
    hasil = evaluate(ws, """(async function(){
      // ambil 60 pelanggan, cari dua yang koordinatnya sangat dekat
      var q = '/geo-proxy?service=WFS&version=1.0.0&request=GetFeature'
            + '&typeName=webgis:analisa_pelanggan&maxFeatures=60&outputFormat=application/json'
            + '&propertyName=nama,nolang';
      var r = await fetch(q);
      var d = await r.json();
      var fs = d.features || [];
      var terdekat = null, jarakMin = 1e9;
      for (var i=0;i<fs.length;i++){
        for (var j=i+1;j<fs.length;j++){
          var a = fs[i].geometry, b = fs[j].geometry;
          if (!a || !b) continue;
          var dx = a.coordinates[0]-b.coordinates[0], dy = a.coordinates[1]-b.coordinates[1];
          var jar = Math.sqrt(dx*dx+dy*dy);
          if (jar < jarakMin) { jarakMin = jar; terdekat = [fs[i], fs[j]]; }
        }
      }
      return terdekat ? {
        jarak_derajat: jarakMin,
        pasangan: terdekat.map(function(f){ return f.properties.nama + ' (' + f.properties.nolang + ')'; }),
        koordinat: terdekat[0].geometry.coordinates,
      } : {catatan:'tidak ada pasangan'};
    })()""", await_promise=True)

    print("PASANGAN TERDEKAT:", json.dumps(hasil, indent=2, ensure_ascii=False))

    if not hasil or 'koordinat' not in hasil:
        return 1

    lng, lat = hasil["koordinat"][0], hasil["koordinat"][1]

    # zoom ke pasangan itu lalu klik
    out = evaluate(ws, f"""(async function(){{
      window.map.setView([{lat}, {lng}], 19);
      window.map.closePopup();
      await new Promise(r=>setTimeout(r,3500));
      var c = window.map.getCenter();
      window.map.fire('click', {{
        latlng: window.map.containerPointToLatLng(window.map.latLngToContainerPoint(c)),
        containerPoint: window.map.latLngToContainerPoint(c)
      }});
      await new Promise(r=>setTimeout(r,3500));
      var pick = document.querySelector('.fpick');
      var pop = document.querySelector('.fpop');
      return {{
        pemilih_muncul: !!pick,
        jumlah_pilihan: document.querySelectorAll('.fpick__item').length,
        judul_pemilih: pick ? document.querySelector('.fpick__title').textContent : null,
        isi_pilihan: pick ? Array.prototype.slice.call(document.querySelectorAll('.fpick__judul')).map(function(e){{return e.textContent;}}) : [],
        detail_langsung: pop ? pop.querySelector('.fpop__nama').textContent : null,
      }};
    }})()""", await_promise=True)

    print("\nHASIL KLIK:", json.dumps(out, indent=2, ensure_ascii=False))

    # pilih item ke-2
    out2 = evaluate(ws, """(async function(){
      var items = document.querySelectorAll('.fpick__item');
      if (items.length < 2) return {catatan:'kurang dari 2 pilihan'};
      var nama = items[1].querySelector('.fpick__judul').textContent;
      items[1].click();
      await new Promise(r=>setTimeout(r,1500));
      var pop = document.querySelector('.fpop');
      return {dipilih: nama, detail_muncul: !!pop,
              judul_detail: pop ? pop.querySelector('.fpop__nama').textContent : null};
    })()""", await_promise=True)
    print("\nPILIH ITEM KE-2:", json.dumps(out2, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
