"""Debug: apakah admin.js termuat & listener selectAll terpasang di halaman users."""
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
      document.querySelector('form').submit();
      return true;
    })()""")
    wait_until(ws, "location.pathname === '/dashboard'")

    ws.send("Page.navigate", url=BASE + "/settings/users")
    time.sleep(5)

    print("=== aset termuat ===")
    print(json.dumps(evaluate(ws, """(() => ({
      adminJs: [...document.querySelectorAll('script[src]')].map(s => s.src).filter(s => s.includes('admin')),
      appJs: [...document.querySelectorAll('script[src]')].map(s => s.src).filter(s => s.includes('/app-')),
      selectAllAda: !!document.getElementById('selectAll'),
      userCheckbox: document.querySelectorAll('.user-checkbox').length,
      bulkBtnAda: !!document.getElementById('bulkDeleteBtn'),
      selectedCountAda: !!document.getElementById('selectedCount'),
    }))()"""), indent=2))

    print("\n=== apakah listener selectAll terpasang? ===")
    print(json.dumps(evaluate(ws, """(() => {
      const cb = document.getElementById('selectAll');
      // cek dengan memicu event change dan lihat efeknya
      const sebelum = document.querySelectorAll('.user-checkbox:checked').length;
      cb.checked = true;
      cb.dispatchEvent(new Event('change', {bubbles: true}));
      const sesudah = document.querySelectorAll('.user-checkbox:checked').length;
      const counter = document.getElementById('selectedCount').textContent;
      const bulkTampil = !document.getElementById('bulkDeleteBtn').classList.contains('hidden');
      return {sebelum, sesudah, counter, bulkTampil};
    })()"""), indent=2))

    print("\n=== cek error saat load ===")
    print(json.dumps(evaluate(ws, """(() => {
      return performance.getEntriesByType('resource')
        .filter(e => e.name.includes('/build/assets/'))
        .map(e => ({nama: e.name.split('/').pop(), status: e.responseStatus || '?', ukuran: e.transferSize}));
    })()"""), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
