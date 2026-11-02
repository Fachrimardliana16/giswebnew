"""Daftar tombol tanpa nama aksesibel per halaman (audit F5 ulang)."""
import http.cookiejar
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, "qa")
from cdp import evaluate, open_tab  # noqa: E402

BASE = "http://127.0.0.1:8124"
PW = "1xFnJ7NP2WAgo0m2"


def login_via_cdp(ws):
    ws.send("Page.navigate", url=BASE + "/login")
    time.sleep(3)
    evaluate(ws, f"""(() => {{
      document.querySelector('input[name=username]').value = 'fachri';
      document.querySelector('input[name=password]').value = '{PW}';
      document.querySelector('form').submit();
      return true;
    }})()""")
    time.sleep(5)


PROBE = r"""(() => {
  const nameless = [];
  document.querySelectorAll('button').forEach(b => {
    const text = (b.innerText || '').trim();
    const aria = b.getAttribute('aria-label') || b.getAttribute('title');
    const labelledby = b.getAttribute('aria-labelledby');
    if (!text && !aria && !labelledby) {
      const onclick = (b.getAttribute('onclick') || '').slice(0, 45);
      const cls = (b.className || '').slice(0, 40);
      nameless.push({onclick, cls, inModal: !!b.closest('[id$=Modal]')});
    }
  });
  return {
    totalButtons: document.querySelectorAll('button').length,
    namelessCount: nameless.length,
    nameless: nameless.slice(0, 12),
    byModal: nameless.filter(n => n.inModal).length,
  };
})()"""


def main():
    ws = open_tab(BASE + "/login")
    time.sleep(3)
    login_via_cdp(ws)
    for path in ["/dashboard", "/settings/users", "/settings/roles"]:
        ws.send("Page.navigate", url=BASE + path)
        time.sleep(4)
        res = evaluate(ws, PROBE)
        print(f"\n== {path} ==")
        print(json.dumps(res, indent=2, ensure_ascii=False)[:1400])
    return 0


if __name__ == "__main__":
    sys.exit(main())
