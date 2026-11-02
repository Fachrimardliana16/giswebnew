"""Ukur langsung: jalankan initUserTable manual, lihat apakah counter berubah."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"


def wait_until(ws, expr, timeout=25):
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

    ws.send("Page.navigate", url=BASE + "/settings/users")
    time.sleep(5)

    print("=== 1. state awal ===")
    print(evaluate(ws, """(() => ({
      rows: document.querySelectorAll('.user-checkbox').length,
      counter_el: !!document.getElementById('selectedCount'),
      counter_text: document.getElementById('selectedCount')?.textContent,
      bulk_el: !!document.getElementById('bulkDeleteBtn'),
    }))()"""))

    print("\n=== 2. picu change manual, lalu paksa hitung ulang via DOM ===")
    print(evaluate(ws, """(() => {
      const cb = document.getElementById('selectAll');
      cb.checked = true;
      cb.dispatchEvent(new Event('change', { bubbles: true }));
      const tercentang = document.querySelectorAll('.user-checkbox:checked').length;
      // hitung manual seperti yang seharusnya dilakukan handler
      const manual = document.querySelectorAll('.user-checkbox:checked').length;
      return {
        tercentang,
        counter_sekarang: document.getElementById('selectedCount').textContent,
        seharusnya: manual,
      };
    })()"""))

    print("\n=== 3. adakah elemen LAIN ber-id selectedCount / selectAll? ===")
    print(evaluate(ws, """(() => ({
      jumlah_id_selectAll: document.querySelectorAll('#selectAll').length,
      jumlah_id_selectedCount: document.querySelectorAll('#selectedCount').length,
      jumlah_id_bulkDeleteBtn: document.querySelectorAll('#bulkDeleteBtn').length,
      semua_selectedCount: [...document.querySelectorAll('#selectedCount')].map(e => ({
        tag: e.tagName, text: e.textContent, parent: e.parentElement?.className?.slice(0,40)
      })),
    }))()"""))

    print("\n=== 4. apakah sidebar ikut punya checkbox .user-checkbox? ===")
    print(evaluate(ws, """(() => {
      const all = [...document.querySelectorAll('.user-checkbox')];
      return {
        total: all.length,
        dalam_tabel: all.filter(e => e.closest('table')).length,
        luar_tabel: all.filter(e => !e.closest('table')).length,
      };
    })()"""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
