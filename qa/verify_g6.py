"""Uji terarah G6: hapus diri sendiri HARUS ditolak, hapus orang lain harus jalan."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"
PW = "1xFnJ7NP2WAgo0m2"


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
    go("/login", {"_token": tok, "username": user, "password": PW})
    return go


def token(html):
    m = re.search(r'name="_token"\s+value="([^"]+)"', html)
    return m.group(1) if m else None


def main():
    go = make("fachri")
    st, _, html = go("/settings/users")
    if st != 200:
        print(f"gagal buka admin: HTTP {st}")
        return 1

    t = token(html)
    # id user yang sedang login
    me = re.search(r'/settings/users/(\d+)"[^>]*>[\s\S]{0,200}?Edit', html)
    ids = re.findall(r'deleteUser\((\d+)\)', html)
    print(f"user terlihat di tabel (pertama 5): {ids[:5]}")

    # cari id fachri dari DB lewat halaman? pakai id 30 (lama) & id diri sendiri.
    # fachri = id hasil seeder ulang; ambil dari baris yang memuat 'fachri'
    m = re.search(r'deleteUser\((\d+)\)[\s\S]{0,50}?$', html)
    row = re.search(r'fachri[\s\S]{0,6000}?deleteUser\((\d+)\)', html)
    own_id = row.group(1) if row else None
    print(f"id 'fachri' terdeteksi: {own_id}")

    print("\n-- hapus DIRI SENDIRI --")
    if own_id:
        st, url, body = go(f"/settings/users/{own_id}", {"_token": t, "_method": "DELETE"})
        msg = re.search(r'(Anda tidak dapat menghapus akun sendiri[^<]*|User berhasil dihapus[^<]*)', body)
        print(f"   DELETE /settings/users/{own_id} -> HTTP {st} | {msg.group(1).strip() if msg else '(tak terbaca)'}")
    else:
        print("   ! id sendiri tak terdeteksi")

    print("\n-- hapus ORANG LAIN (harus sukses) --")
    other = next((i for i in ids if i != own_id), None)
    if other:
        st, url, body = go(f"/settings/users/{other}", {"_token": t, "_method": "DELETE"})
        msg = re.search(r'(Anda tidak dapat menghapus akun sendiri[^<]*|User berhasil dihapus[^<]*|Tidak dapat menghapus admin terakhir[^<]*)', body)
        print(f"   DELETE /settings/users/{other} -> HTTP {st} | {msg.group(1).strip() if msg else '(tak terbaca)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
