"""Uji aturan bisnis + temuan sisa: G5/G6/G7/G8/G9/G10, D5, E4."""
import http.cookiejar
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8123"


def sess(user="fachri", pw="password", follow=True):
    cj = http.cookiejar.CookieJar()
    handlers = [urllib.request.HTTPCookieProcessor(cj)]
    op = urllib.request.build_opener(*handlers)

    def go(path, data=None, headers=None):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        r.add_header("Accept", "text/html")
        for k, v in (headers or {}).items():
            r.add_header(k, v)
        t0 = time.time()
        try:
            with op.open(r, timeout=90) as resp:
                return resp.status, resp.geturl(), resp.read().decode("utf-8", "replace"), (time.time() - t0) * 1000
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Location", ""), e.read().decode("utf-8", "replace"), (time.time() - t0) * 1000

    st, url, html, _ = go("/login")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', html).group(1)
    go("/login", {"_token": tok, "username": user, "password": pw})
    return go, cj


def tok_from(html):
    m = re.search(r'name="_token"\s+value="([^"]+)"', html)
    return m.group(1) if m else None


def main():
    go, cj = sess()

    # G5: hapus role yang masih punya user
    st, url, html, ms = go("/settings/roles")
    t = tok_from(html)
    role_id = re.search(r'deleteRole\((\d+)\)', html)
    # role 'admin' = id 1, punya 6 user
    st, url, body, ms = go("/settings/roles/1", {"_token": t, "_method": "DELETE"})
    print(f"G5 hapus role 'admin' (masih 6 user) -> HTTP {st} url={url[-30:]} ({ms:.0f} ms)")
    msg = re.search(r"(Role tidak dapat dihapus[^<]*|Role berhasil dihapus[^<]*)", body)
    print(f"   pesan: {msg.group(1).strip() if msg else '(tidak terbaca di body)'}")

    # G6: hapus diri sendiri (fachri) lewat DELETE langsung
    st, url, html, _ = go("/settings/users")
    t = tok_from(html)
    st, url, body, ms = go("/settings/users/30", {"_token": t, "_method": "DELETE"})
    print(f"G6 hapus diri sendiri (id 30 = fachri) -> HTTP {st} ({ms:.0f} ms)")

    # G8: remember me
    cj2 = http.cookiejar.CookieJar()
    op2 = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj2))
    h = op2.open(BASE + "/login", timeout=30).read().decode()
    t2 = tok_from(h)
    data = urllib.parse.urlencode({"_token": t2, "username": "fachri", "password": "password",
                                   "remember": "on"}).encode()
    r = urllib.request.Request(BASE + "/login", data=data)
    r.add_header("Content-Type", "application/x-www-form-urlencoded")
    op2.open(r, timeout=60)
    names = [c.name for c in cj2]
    print(f"G8 'Ingat saya' -> cookie: {names}")
    print(f"   remember_web_* ada: {any('remember' in n for n in names)}")

    # G9: lupa password
    st, url, html, ms = go("/login")
    has_forgot = "Lupa Password" in html
    link = re.search(r'href="([^"]*)"[^>]*>\s*Lupa Password', html)
    print(f"G9 'Lupa Password?' ada di UI: {has_forgot}, href={link.group(1) if link else '(tak ada href)'}")
    for p in ["/password/reset", "/forgot-password", "/password/reset/"]:
        st2, u2, b2, _ = go(p)
        print(f"   route {p} -> HTTP {st2}")

    # G10: profil saya
    st, url, html, _ = go("/dashboard")
    prof = re.findall(r'<a href="([^"]*)"[^>]*>\s*<div[^>]*>[\s\S]{0,400}?Profil Saya', html)
    href = prof[0] if prof else '(href="#" — tidak ada tujuan)'
    print("G10 link 'Profil Saya' href =", href)

    # D5: password di payload sesi
    st, url, html, _ = go("/login")
    print("D5 password plaintext di HTML/session: cek via artisan tinker (terpisah)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
