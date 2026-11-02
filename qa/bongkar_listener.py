"""Bongkar handler selectAll yang benar-benar terpasang (via CDP getEventListeners)."""
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

    for path, sel in [("/settings/users", "#selectAll"), ("/settings/roles", "#selectAll")]:
        ws.send("Page.navigate", url=BASE + path)
        time.sleep(5)

        # Runtime.evaluate tidak punya getEventListeners -> pakai CDP command
        r = ws.send("Runtime.evaluate", expression=sel, objectGroup="probe")
        obj_id = r["result"]["result"].get("objectId")
        info = ws.send("DOMDebugger.getEventListeners", objectId=obj_id)
        listeners = info.get("result", {}).get("listeners", [])

        print(f"\n=== {path} : {len(listeners)} listener pada {sel} ===")
        for ln in listeners:
            print(f"  tipe={ln.get('type')}  useCapture={ln.get('useCapture')}  "
                  f"script={str(ln.get('scriptId'))[:20]} line={ln.get('lineNumber')}")

        # eksekusi dengan error ditangkap
        hasil = evaluate(ws, """(() => {
          const err = [];
          const origErr = console.error;
          console.error = (...a) => { err.push(a.join(' ')); origErr(...a); };
          const cb = document.getElementById('selectAll');
          cb.checked = true;
          try {
            cb.dispatchEvent(new Event('change', {bubbles: true}));
          } catch (e) {
            err.push('THROW: ' + e.message);
          }
          console.error = origErr;
          return {
            counter: document.getElementById('selectedCount').textContent,
            err,
          };
        })()""")
        print("  hasil dispatch:", json.dumps(hasil))
    return 0


if __name__ == "__main__":
    sys.exit(main())
