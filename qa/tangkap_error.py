"""Tangkap error JavaScript saat admin.js dieksekusi."""
import json
import sys
import time

sys.path.insert(0, "qa")
from cdp import WS, evaluate  # noqa: E402
import urllib.request  # noqa: E402

BASE = "http://127.0.0.1:8124"


def main():
    tabs = json.loads(urllib.request.urlopen("http://127.0.0.1:9333/json/list", timeout=20).read())
    page = next(t for t in tabs if t.get("type") == "page")
    ws = WS(page["webSocketDebuggerUrl"])

    ws.send("Page.enable")
    ws.send("Runtime.enable")
    ws.send("Log.enable")
    ws.send("Network.enable")

    # login dulu
    ws.send("Page.navigate", url=BASE + "/login")
    time.sleep(4)
    evaluate(ws, """(() => {
      document.querySelector('input[name=username]').value='fachri';
      document.querySelector('input[name=password]').value='password';
      document.querySelector('form').submit(); return true;})()""")
    time.sleep(8)

    # muat ulang halaman admin sambil merekam event
    ws.send("Page.navigate", url=BASE + "/settings/users")

    errors = []
    t0 = time.time()
    while time.time() - t0 < 12:
        try:
            msg = ws._recv()
        except Exception:
            break
        method = msg.get("method", "")
        if method == "Runtime.exceptionThrown":
            d = msg["params"]["exceptionDetails"]
            errors.append({
                "jenis": "exception",
                "teks": d.get("text"),
                "pesan": (d.get("exception") or {}).get("description", "")[:300],
                "baris": d.get("lineNumber"),
                "url": d.get("url", ""),
            })
        elif method == "Log.entryAdded":
            e = msg["params"]["entry"]
            if e.get("level") in ("error", "warning"):
                errors.append({"jenis": "log-" + e["level"], "teks": e.get("text", "")[:250],
                               "url": e.get("url", "")})
        elif method == "Runtime.consoleAPICalled":
            if msg["params"]["type"] == "error":
                args = [str(a.get("value", a.get("description", "")))[:200]
                        for a in msg["params"]["args"]]
                errors.append({"jenis": "console.error", "teks": " | ".join(args)})

    print(f"Total error/warning: {len(errors)}")
    for e in errors:
        print(json.dumps(e, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
