"""Uji G6 langsung dengan id eksplisit (fachri=128, login sebagai fachri)."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"
PW = "1xFnJ7NP2WAgo0m2"
SELF_ID = 128  # fachri


def make(user):
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, timeout=90):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        try:
            with op.open(r, timeout=timeout) as resp:
                return resp.status, resp.geturl(), resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Location", ""), e.read().decode("utf-8", "replace")

    st, _, html = go("/login")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', html).group(1)
    st, url, html = go("/login", {"_token": tok, "username": user, "password": PW})
    print(f"login {user}: {st} {url.split('/')[-1]}")
    return go


def main():
    go = make("fachri")

    st, _, html = go("/settings/users")
    m = re.search(r'name="_token"\s+value="([^"]+)"', html)
    t = m.group(1)
    print(f"halaman admin: HTTP {st}, token {'ADA' if t else 'TIDAK'}")

    print("\n[1] Hapus DIRI SENDIRI (id 128) -- harus DITOLAK")
    st, url, body = go(f"/settings/users/{SELF_ID}", {"_token": t, "_method": "DELETE"})
    msg = re.search(r'(Anda tidak dapat menghapus akun sendiri[^<]*|User berhasil dihapus[^<]*)', body)
    print(f"    HTTP {st} | {msg.group(1).strip() if msg else '(tak terbaca)'}")

    print("\n[2] Hapus orang lain (id 2 = adikpurwo) -- harus SUKSES")
    st, url, body = go("/settings/users/2", {"_token": t, "_method": "DELETE"})
    msg = re.search(r'(Anda tidak dapat menghapus akun sendiri[^<]*|User berhasil dihapus[^<]*|Tidak dapat menghapus admin terakhir[^<]*)', body)
    print(f"    HTTP {st} | {msg.group(1).strip() if msg else '(tak terbaca)'}")

    print("\n[3] Bulk delete diri sendiri (id 128) -- harus DITOLAK")
    st, url, body = go("/settings/users/bulk-delete", {"_token": t, "ids[]": [str(SELF_ID)]})
    msg = re.search(r'(Tidak ada user yang dapat dihapus[^<]*|User berhasil dihapus secara massal[^<]*)', body)
    print(f"    HTTP {st} | {msg.group(1).strip() if msg else '(tak terbaca)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
