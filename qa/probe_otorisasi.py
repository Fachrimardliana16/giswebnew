"""Probe otorisasi + IDOR + DoS untuk webgisupdate (127.0.0.1:8123).

Menguji:
  A. Login sebagai user NON-admin (rolenya 'user') lalu akses /settings/users & /settings/roles
  B. Aksi mutasi (POST create user, DELETE user) oleh non-admin
  C. IDOR: user non-admin mengubah role dirinya sendiri lewat POST ke resource admin
  D. geo-proxy: SSRF / DoS (tanpa parameter -> upstream penuh)
  E. Header keamanan & cookie flags
"""
import http.cookiejar
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8123"
NONADMIN = ("suyadi", "password")
ADMIN = ("fachri", "password")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def opener():
    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), NoRedirect())


def req(op, path, data=None, method=None):
    url = BASE + path
    body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
    r = urllib.request.Request(url, data=body, method=method or ("POST" if body else "GET"))
    if body:
        r.add_header("Content-Type", "application/x-www-form-urlencoded")
    t0 = time.time()
    try:
        with op.open(r, timeout=70) as resp:
            return resp.status, resp.headers.get("Location", ""), resp.read().decode("utf-8", "replace"), (time.time() - t0) * 1000
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", ""), e.read().decode("utf-8", "replace"), (time.time() - t0) * 1000
    except Exception as e:  # noqa: BLE001
        return "ERR", repr(e), "", (time.time() - t0) * 1000


def token(html):
    m = re.search(r'name="_token"\s+value="([^"]+)"', html)
    return m.group(1) if m else None


def login(username, password):
    op = opener()
    st, _, html, _ = req(op, "/login")
    tok = token(html)
    st, loc, body, _ = req(op, "/login", {"_token": tok, "username": username, "password": password})
    ok = loc.endswith("/dashboard")
    return op, ok, loc


def main():
    print("### A. Login non-admin (role 'user', bukan whitelist middleware)")
    op, ok, loc = login(*NONADMIN)
    print(f"  login {NONADMIN[0]}: ok={ok} loc={loc}")
    if not ok:
        print("  !! login gagal, T1 sisa throttle? tunggu & ulangi")
        return 1

    print("\n### A1. GET halaman admin sebagai non-admin")
    for path in ["/dashboard", "/settings/users", "/settings/roles"]:
        st, loc, body, ms = req(op, path)
        print(f"  GET {path}: HTTP {st} loc={loc or '-'} ({ms:.0f} ms)")

    print("\n### B. Mutasi oleh non-admin (POST create user)")
    st, _, html, _ = req(op, "/settings/users")
    tok = token(html)
    marker = f"probe_idor_{int(time.time())}"
    st, loc, body, ms = req(op, "/settings/users", {
        "_token": tok, "username": marker, "name": "Probe IDOR", "password": "rahasia123", "role_id": "1",
    })
    print(f"  POST /settings/users username={marker}: HTTP {st} loc={loc} ({ms:.0f} ms)")
    sys.stdout.write(f"  MARKER={marker}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
