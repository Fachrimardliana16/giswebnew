"""Probe eskalasi hak akses: akun NON-ADMIN memanggil route admin.

Catatan: `AuthController::login()` memanggil `session()->regenerate()` yang
merotasi CSRF token, jadi token pra-login selalu 419. Token segar hanya bisa
dibaca dari DOM. Non-admin tidak punya halaman ber-form, jadi probe memakai
XSRF-TOKEN cookie (basis64) -> di-dekripsi Laravel lewat header X-XSRF-TOKEN.
"""
import http.cookiejar
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8123"
SUYADI_ID = 110


def session(user, pw):
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, headers=None, method=None):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body, method=method or ("POST" if body else "GET"))
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        r.add_header("Accept", "text/html,application/xhtml+xml")
        for k, v in (headers or {}).items():
            r.add_header(k, v)
        t0 = time.time()
        try:
            with op.open(r, timeout=70) as resp:
                return resp.status, resp.geturl(), resp.read().decode("utf-8", "replace"), (time.time() - t0) * 1000
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Location", ""), e.read().decode("utf-8", "replace"), (time.time() - t0) * 1000

    st, url, html, _ = go("/login")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', html)
    go("/login", {"_token": tok.group(1) if tok else "", "username": user, "password": pw})
    xsrf = next((urllib.parse.unquote(c.value) for c in cj if c.name == "XSRF-TOKEN"), None)
    return go, xsrf


def main():
    print("== NON-ADMIN 'suyadi' (role user, TIDAK di whitelist middleware) ==")
    go, xsrf = session("suyadi", "password")
    print(f"  XSRF cookie: {'ADA' if xsrf else 'TIDAK ADA'}")

    print("\n-- A1. GET halaman admin (harus 302 ke /dashboard) --")
    for p in ["/settings/users", "/settings/roles"]:
        st, url, body, ms = go(p)
        print(f"  GET {p} -> HTTP {st} url={url[:60]} ({ms:.0f} ms)")

    print("\n-- A2. Unggah role diri sendiri ke admin (IDOR / privilege escalation) --")
    st, url, body, ms = go(f"/settings/users/{SUYADI_ID}", {
        "username": "suyadi", "name": "Suyadi", "role_id": "1", "password": "",
    }, headers={"X-XSRF-TOKEN": xsrf, "X-HTTP-METHOD-OVERRIDE": "PUT"})
    print(f"  PUT /settings/users/{SUYADI_ID} (role_id=1=admin) -> HTTP {st} ({ms:.0f} ms)")

    print("\n-- A3. Buat akun admin baru --")
    st, url, body, ms = go("/settings/users", {
        "username": "probe_esc", "name": "Probe Esc", "password": "rahasia123", "role_id": "1",
    }, headers={"X-XSRF-TOKEN": xsrf})
    print(f"  POST /settings/users username=probe_esc role_id=admin -> HTTP {st} ({ms:.0f} ms)")

    print("\n-- A4. Hapus user lain (DELETE) --")
    st, url, body, ms = go("/settings/users/1", {"_method": "DELETE"}, headers={"X-XSRF-TOKEN": xsrf})
    print(f"  DELETE /settings/users/1 -> HTTP {st} ({ms:.0f} ms)")

    print("\n-- A5. Hapus massal --")
    st, url, body, ms = go("/settings/users/bulk-delete", {"ids[]": ["1", "2", "3"]}, headers={"X-XSRF-TOKEN": xsrf})
    print(f"  POST /settings/users/bulk-delete ids=1,2,3 -> HTTP {st} ({ms:.0f} ms)")

    print("\n-- A6. Role admin: ubah & buat role --")
    st, url, body, ms = go("/settings/roles", {"name": "probe_role", "permissions[]": ["manajemen_user"]},
                           headers={"X-XSRF-TOKEN": xsrf})
    print(f"  POST /settings/roles name=probe_role -> HTTP {st} ({ms:.0f} ms)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
