"""Uji dua lapis rate limiter dengan benar.

Lapis 1: kredensial sama (username|ip) -> tolak setelah 5.
Lapis 2: username selalu beda, 35 percobaan dari IP sama -> tolak setelah 30.
"""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"


def attempt(username, password="salah"):
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    try:
        with op.open(BASE + "/login", timeout=30) as r:
            html = r.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return f"ERR open login: {e}"
    tok = re.search(r'name="_token"\s+value="([^"]+)"', html).group(1)
    data = urllib.parse.urlencode({"_token": tok, "username": username, "password": password}).encode()
    req = urllib.request.Request(BASE + "/login", data=data)
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        with op.open(req, timeout=60) as r:
            body = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
    m = re.search(r"Terlalu banyak percobaan login[^<]*", body)
    if m:
        return "DITOLAK"
    if "Login gagal" in body:
        return "diproses"
    return "lain"


def main():
    print("== LAPIS 1: username SAMA ('fachri') 8x password salah ==")
    seq = []
    for i in range(1, 9):
        hasil = attempt("fachri", f"salah{i}")
        seq.append(hasil)
        print(f"   {i}: {hasil}")
    print(f"   urutan: {seq}")
    print(f"   -> limiter per-kredensial {'BEKERJA' if seq.count('DITOLAK') >= 3 else 'TIDAK BEKERJA'}")

    print("\n== LAPIS 2: username SELALU BEDA, 35x dari IP sama ==")
    seq2 = []
    for i in range(1, 36):
        hasil = attempt(f"tebak{i}x", "salah")
        seq2.append(hasil)
        if i % 10 == 0 or i > 28:
            print(f"   {i}: {hasil}")
    tolak = seq2.count("DITOLAK")
    print(f"   total ditolak: {tolak}/35 (harus > 0 karena lapis IP = 30/menit)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
