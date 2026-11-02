"""Isolasi: bandingkan perilaku selectAll di users vs roles."""
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


def uji(ws, url, row_sel):
    ws.send("Page.navigate", url=url)
    time.sleep(5)
    return evaluate(ws, f"""(() => {{
      const cb = document.getElementById('selectAll');
      const rows = document.querySelectorAll('{row_sel}');
      const hasil = {{jumlah_row: rows.length}};

      // rekam listener: bungkus addEventListener sebelum halaman load? tidak bisa.
      // jadi uji efek: set checked lalu dispatch change
      cb.checked = true;
      cb.dispatchEvent(new Event('change', {{bubbles: true}}));
      hasil.setelah_dispatch = document.querySelectorAll('{row_sel}:checked').length;
      hasil.counter = document.getElementById('selectedCount')?.textContent;
      hasil.bulk_hidden = document.getElementById('bulkDeleteBtn')?.classList.contains('hidden');

      // bandingkan: klik event (seperti pengguna)
      cb.checked = false;
      rows.forEach(f => f.checked = false);
      cb.click();
      hasil.setelah_click = document.querySelectorAll('{row_sel}:checked').length;
      hasil.counter_click = document.getElementById('selectedCount')?.textContent;
      hasil.bulk_hidden_click = document.getElementById('bulkDeleteBtn')?.classList.contains('hidden');

      return hasil;
    }})()""")


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    wait_until(ws, "location.pathname === '/dashboard'")

    print("USERS:")
    print(json.dumps(uji(ws, BASE + "/settings/users", ".user-checkbox"), indent=2))
    print("\nROLES:")
    print(json.dumps(uji(ws, BASE + "/settings/roles", ".role-checkbox"), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
