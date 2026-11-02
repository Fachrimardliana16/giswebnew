"""Debug login via tunnel: tampilkan status + pesan error yang muncul."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://tale-apartment-qui-spanking.trycloudflare.com"


def main():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, timeout=60):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        try:
            with op.open(r, timeout=timeout) as x:
                return x.status, x.geturl(), x.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Location", ""), e.read().decode("utf-8", "replace")

    st, url, login = go("/login")
    print(f"GET /login -> {st}")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', login)
    print(f"token: {'ADA' if tok else 'TIDAK'}")
    if not tok:
        print("isi halaman:", login[:300])
        return 1

    st, url, body = go("/login", {"_token": tok.group(1), "username": "fachri", "password": "password"})
    print(f"POST /login -> {st} | url={url}")

    # kalau redirect balik ke /login, baca pesan error
    if url.endswith("/login") or st == 302:
        st2, url2, again = go("/login")
        m = re.search(r"(Terlalu banyak percobaan login[^<]*|Login gagal[^<]*)", again)
        print(f"halaman login lagi: HTTP {st2}")
        print(f"pesan: {m.group(1).strip() if m else '(tidak ada pesan error)'}")

    # cek cookie yang dikirim
    print("\ncookie jar:")
    for c in cj:
        print(f"  {c.name} = {c.value[:25]}...")
    return 0


if __name__ == "__main__":
    sys.exit(main())