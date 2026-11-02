"""Uji end-to-end lewat tunnel: login, dashboard, admin, CSP tidak memblokir apa pun."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://tale-apartment-qui-spanking.trycloudflare.com"
PW = "password"


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
    print(f"GET /login -> {st}, {len(login)} byte")
    print(f"  pakai Vite (bukan Play CDN): {'/build/assets/' in login and 'cdn.tailwindcss.com' not in login}")

    tok = re.search(r'name="_token"\s+value="([^"]+)"', login).group(1)
    st, url, _ = go("/login", {"_token": tok, "username": "fachri", "password": PW})
    print(f"POST /login -> {st} {url.split('/')[-1]}")

    st, url, dash = go("/dashboard")
    print(f"GET /dashboard -> {st}, {len(dash)} byte")
    print(f"  leaflet dimuat: {'leaflet.js' in dash}")

    st, url, adm = go("/settings/users")
    print(f"GET /settings/users -> {st}, {len(adm)} byte")
    print(f"  leaflet TIDAK dimuat: {'leaflet.js' not in adm}")

    st, url, geo = go("/geo-proxy?service=WFS&version=1.0.0&request=GetFeature"
                      "&typeName=webgis:analisa_pelanggan&outputFormat=application/json")
    print(f"GET /geo-proxy WFS -> {st}, {len(geo)} byte (batas aman)")

    print("\n=== cookie flags ===")
    for c in cj:
        flags = []
        if c.secure:
            flags.append("Secure")
        if c.has_nonstandard_attr("HttpOnly") or "httponly" in str(c._rest).lower():
            flags.append("HttpOnly")
        print(f"  {c.name}: {','.join(flags) or '(tanpa flag)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
