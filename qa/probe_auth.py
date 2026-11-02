"""Probe brute-force + otorisasi admin untuk webgisupdate (127.0.0.1:8123)."""
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import http.cookiejar

BASE = "http://127.0.0.1:8123"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def make_opener():
    cj = http.cookiejar.CookieJar()
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), NoRedirect())


def get(op, path):
    try:
        with op.open(BASE + path, timeout=20) as r:
            return r.status, r.read().decode("utf-8", "replace"), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), dict(e.headers)


def csrf(html):
    m = re.search(r'name="_token"\s+value="([^"]+)"', html)
    return m.group(1) if m else None


def login(op, username, password):
    st, html, _ = get(op, "/login")
    tok = csrf(html)
    if not tok:
        return None, "no csrf token in login page"
    data = urllib.parse.urlencode({"_token": tok, "username": username, "password": password}).encode()
    req = urllib.request.Request(BASE + "/login", data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with op.open(req, timeout=30) as r:
            body = r.read().decode("utf-8", "replace")
            return (r.status, dict(r.headers), body), None
    except urllib.error.HTTPError as e:
        # 302 dari back(): ambil body error dari sesi berikutnya
        return (e.code, dict(e.headers), e.read().decode("utf-8", "replace")), None
    except Exception as e:  # noqa: BLE001
        return None, repr(e)


def followed_result(op, username, password):
    """Login lalu ikuti redirect dan baca pesan error di halaman /login."""
    st, html, _ = get(op, "/login")
    tok = csrf(html)
    data = urllib.parse.urlencode({"_token": tok, "username": username, "password": password}).encode()
    req = urllib.request.Request(BASE + "/login", data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with op.open(req, timeout=30) as r:
            status = r.status
            loc = r.headers.get("Location", "")
            body = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        status, loc, body = e.code, e.headers.get("Location", ""), ""
    # ikuti redirect: kalau ke /login berarti gagal, kalau ke /dashboard berarti sukses
    if loc.endswith("/login"):
        st2, html2, _ = get(op, "/login")
        m = re.search(r"(Terlalu banyak percobaan[^<]*|Login gagal[^<]*)", html2)
        return status, "GAGAL: " + (m.group(1).strip() if m else "(pesan tidak tertangkap)")
    return status, f"SUKSES -> {loc}"


def main():
    print("### T1: brute-force 12x password salah (username admin seed 'fachri')")
    for i in range(1, 13):
        op = make_opener()
        t0 = time.time()
        res, err = login(op, "fachri", f"salah{i}")
        dt = (time.time() - t0) * 1000
        if err:
            print(f"  attempt {i:2d}: ERROR {err} ({dt:.0f} ms)")
            continue
        status, headers, body = res
        msg = ""
        if "Terlalu banyak percobaan" in body:
            m = re.search(r"dalam (\d+) detik", body)
            msg = "RATE-LIMITED" + (f" ({m.group(1)}s)" if m else "")
        elif "Login gagal" in body:
            msg = "wrong-credentials"
        elif status in (302, 303):
            msg = "REDIRECT -> " + headers.get("Location", "?")
        else:
            msg = f"status {status}"
        print(f"  attempt {i:2d}: HTTP {status} | {msg} | {dt:.0f} ms")

    print("\n### T1b: follow redirect, baca pesan error (attempt 1, 6, 7, 12)")
    for i in [1, 6, 7, 12]:
        op = make_opener()
        t0 = time.time()
        status, msg = followed_result(op, "fachri", f"salah{i}")
        dt = (time.time() - t0) * 1000
        print(f"  attempt {i:2d}: HTTP {status} | {msg} | {dt:.0f} ms")

    print("\n### T2: username valid + password benar ('password' dari seeder)")
    op = make_opener()
    t0 = time.time()
    status, msg = followed_result(op, "fachri", "password")
    dt = (time.time() - t0) * 1000
    print(f"  fachri/password: HTTP {status} | {msg} | {dt:.0f} ms")
    if dt > 3000:
        print("  !! latency tinggi: PDO pgsql tidak ada -> koneksi keluar timeout")
    return 0


if __name__ == "__main__":
    sys.exit(main())
