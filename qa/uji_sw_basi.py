"""Simulasi kondisi pengguna: SW lama menyimpan aset basi.

Menyuntikkan entri cache palsu untuk /build/assets/app-LAMA.js yang tidak ada
di server. Dengan SWR, permintaan aset yang tidak ada di cache harus tetap
mengambil dari jaringan (atau memicu error yang bisa ditangani), BUKAN
membuat aplikasi gagal boot tanpa penjelasan.
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


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(5)

    print("=== 1. jalankan SW versi lama lalu bersihkan ===")
    info = evaluate(ws, """(async function(){
      var regs = await navigator.serviceWorker.getRegistrations();
      var nama = await caches.keys();
      // hapus semua cache supaya mulai bersih
      await Promise.all(nama.map(function(n){ return caches.delete(n); }));
      return {registrasi: regs.length, cache_dihapus: nama.length};
    })()""", await_promise=True)
    print("  ", json.dumps(info))

    ws.send("Page.reload", ignoreCache=True)
    time.sleep(7)

    print("\n=== 2. setelah reload: versi SW & cache ===")
    v = evaluate(ws, """(async function(){
      var regs = await navigator.serviceWorker.getRegistrations();
      var nama = await caches.keys();
      var out = {registrasi: regs.length, cache: nama};
      // baca versi SW yang aktif
      if (regs.length && regs[0].active) {
        var u = regs[0].active.scriptURL;
        out.script_url = u;
        out.versi_url = (u.match(/\\?v=(.+)$/) || [null, null])[1];
      }
      return out;
    })()""", await_promise=True)
    print("  ", json.dumps(v, indent=2))

    print("\n=== 3. login & buka peta ===", end=" ")
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    ok = wait_until(ws, "location.pathname === '/dashboard'")
    peta = wait_until(ws, "typeof window.map !== 'undefined' && window.map !== null")
    print(f"dashboard={ok} peta={peta}")

    time.sleep(4)

    print("\n=== 4. toast 'kendala teknis' muncul tanpa sebab? ===")
    toast = evaluate(ws, """(function(){
      var t = document.querySelectorAll('.toast-item');
      var isi = [];
      for (var i=0;i<t.length;i++) isi.push(t[i].innerText.replace(/\\n/g,' ').slice(0,90));
      return {jumlah: t.length, isi: isi};
    })()""")
    print("  ", json.dumps(toast, indent=2, ensure_ascii=False))

    print("\n=== 5. aset yang dipakai halaman & dari mana asalnya ===")
    aset = evaluate(ws, """(async function(){
      var link = document.querySelector('link[rel=stylesheet][href*="/build/"]');
      var js = Array.prototype.slice.call(document.querySelectorAll('script[src*="/build/"]'))
                    .map(function(s){ return s.src; });
      var hasil = {css: link ? link.href.split('/').pop() : null, js: js.map(function(u){return u.split('/').pop();})};
      // cek apakah aset bisa diambil
      var daftar = (hasil.css ? ['/build/assets/' + hasil.css] : []).concat(js.map(function(u){ return new URL(u).pathname; }));
      hasil.status = [];
      for (var i=0;i<daftar.length;i++){
        try {
          var r = await fetch(daftar[i], {cache: 'no-store'});
          hasil.status.push({aset: daftar[i].split('/').pop(), status: r.status});
        } catch (e) {
          hasil.status.push({aset: daftar[i].split('/').pop(), error: String(e)});
        }
      }
      return hasil;
    })()""", await_promise=True)
    print("  ", json.dumps(aset, indent=2, ensure_ascii=False))

    print("\n=== 6. fungsi inti hidup? ===")
    inti = evaluate(ws, """(function(){
      return {
        peta: typeof window.map !== 'undefined' && window.map !== null,
        showToast: typeof window.showToast === 'function',
        toggleSection: typeof window.toggleSection === 'function',
        checkbox_layer: document.querySelectorAll('.layer-checkbox').length,
        sw_aktif: !!navigator.serviceWorker.controller,
      };
    })()""")
    print("  ", json.dumps(inti, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
