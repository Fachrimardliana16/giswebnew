"""Cek apakah CSP memblokir onclick= inline di halaman."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import WS, evaluate, open_tab  # noqa: E402
import urllib.request  # noqa: E402

BASE = "http://127.0.0.1:8124"


def main():
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9333/json/list", timeout=20).read())
    page = next(t for t in tabs if t.get("type") == "page")
    ws = WS(page["webSocketDebuggerUrl"])
    ws.send("Page.enable")
    ws.send("Runtime.enable")
    ws.send("Log.enable")

    ws.send("Page.navigate", url=BASE + "/login")
    time.sleep(4)

    print("=== uji onclick inline di halaman login ===")
    print(evaluate(ws, """(() => {
      const btn = document.createElement('button');
      btn.id = 'ujiInline';
      btn.setAttribute('onclick', 'window.__inlineJalan = true');
      document.body.appendChild(btn);
      btn.click();
      return {onclick_jadi_fungsi: typeof btn.onclick === 'function',
              inline_jalan: window.__inlineJalan === true,
              csp: 'cek konsol'};
    })()"""))
    time.sleep(2)

    # login lalu cek di dashboard
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit();
      return true;
    })()""")
    time.sleep(8)

    print("\n=== CSP di dashboard ===")
    print(evaluate(ws, """(() => {
      window.__cek = false;
      const b = document.createElement('button');
      b.setAttribute('onclick', 'window.__cek = true');
      document.body.appendChild(b);
      b.click();
      const inlineJalan = window.__cek === true;
      b.remove();
      return {
        inline_onclick_jalan: inlineJalan,
        toggleSection_ada: typeof window.toggleSection === 'function',
        showToast_ada: typeof window.showToast === 'function',
      };
    })()"""))

    # panggil toggleSection langsung (bukan lewat onclick)
    print("\n=== toggleSection dipanggil langsung ===")
    print(evaluate(ws, """(() => {
      const h = document.querySelector('.sidebar-section-header');
      const m = (h.getAttribute('onclick')||'').match(/'([^']+)'/);
      const c = m ? document.getElementById('content-' + m[1]) : null;
      if (!c) return {error: 'no content'};
      const sebelum = c.classList.contains('hidden');
      window.toggleSection(m[1]);
      return {id: m[1], sebelum, sesudah: c.classList.contains('hidden'),
              berubah: sebelum !== c.classList.contains('hidden')};
    })()"""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
