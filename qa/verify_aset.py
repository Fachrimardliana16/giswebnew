"""Verifikasi pemisahan aset: dashboard punya Leaflet, admin tidak."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"
PW = "1xFnJ7NP2WAgo0m2"

cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


def go(path, data=None, timeout=60):
    body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
    r = urllib.request.Request(BASE + path, data=body)
    try:
        with op.open(r, timeout=timeout) as x:
            return x.status, x.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def main():
    _, login = go("/login")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', login).group(1)
    go("/login", {"_token": tok, "username": "fachri", "password": PW})

    st, dash = go("/dashboard")
    st2, adm = go("/settings/users")
    st3, roles = go("/settings/roles")

    def has(h, s):
        return s in h

    print("halaman      leaflet.js  leaflet.css  jquery  vite-css")
    for name, html, stt in [("dashboard", dash, st), ("users", adm, st2), ("roles", roles, st3)]:
        print(f"{name:12} {str(has(html,'leaflet.js')):10} {str(has(html,'leaflet.css')):11} "
              f"{str(has(html,'jquery.min.js')):7} {str(has(html,'/build/assets/')):8} (HTTP {stt})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
