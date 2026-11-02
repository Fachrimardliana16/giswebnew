"""Verifikasi ulang setelah perbaikan — port 8124."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"
PW = "1xFnJ7NP2WAgo0m2"


def session(user="fachri", pw="password"):
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, timeout=90):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        try:
            with op.open(r, timeout=timeout) as resp:
                return resp.status, resp.geturl(), resp.read(), dict(resp.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Location", ""), e.read(), dict(e.headers)

    st, url, html, _ = go("/login")
    tok = re.search(rb'name="_token"\s+value="([^"]+)"', html)
    return go, (tok.group(1).decode() if tok else "")


def main():
    print("== login ==")
    st, url, html, _ = None, None, None, None
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, timeout=90):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        try:
            with op.open(r, timeout=timeout) as resp:
                return resp.status, resp.geturl(), resp.read(), dict(resp.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Location", ""), e.read(), dict(e.headers)

    st, _, html, _ = go("/login")
    tok = re.search(rb'name="_token"\s+value="([^"]+)"', html).group(1).decode()
    st, url, html, _ = go("/login", {"_token": tok, "username": "fachri", "password": PW})
    print(f"   fachri -> HTTP {st} {url}")

    print("\n== SEC-01: WFS GetFeature tanpa maxFeatures ==")
    q = ("/geo-proxy?service=WFS&version=1.0.0&request=GetFeature"
         "&typeName=webgis:analisa_pelanggan&outputFormat=application/json")
    st, url, body, hdr = go(q, timeout=120)
    print(f"   HTTP {st} | byte={len(body)} | content-type={hdr.get('Content-Type')}")
    import json as _json
    try:
        data = _json.loads(body)
        n = len(data.get("features", []))
        props = list(data["features"][0]["properties"].keys()) if n else []
        print(f"   fitur dikembalikan: {n} (sebelumnya 44.6 MB / ribuan)")
        print(f"   kolom: {props}")
    except Exception as e:  # noqa: BLE001
        print(f"   bukan JSON: {body[:200]!r} ({e})")

    print("\n== SEC-01b: klien minta maxFeatures=99999999 ==")
    q2 = q + "&maxFeatures=99999999"
    st, url, body, hdr = go(q2, timeout=120)
    print(f"   HTTP {st} | byte={len(body)}")

    print("\n== SEC-01c: klien minta propertyName di luar whitelist ==")
    q3 = q + "&propertyName=nama,password_rahasia,geom"
    st, url, body, hdr = go(q3, timeout=120)
    try:
        data = _json.loads(body)
        print(f"   kolom: {list(data['features'][0]['properties'].keys()) if data.get('features') else 'kosong'}")
    except Exception:  # noqa: BLE001
        print(f"   respons: {body[:150]!r}")

    print("\n== SEC-11: cql_filter dengan kutip keluar ==")
    q4 = "/geo-proxy?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=webgis:analisa_pelanggan&SRS=EPSG:4326&WIDTH=256&HEIGHT=256&BBOX=109.2,-7.6,109.7,-7.1&cql_filter=nama%3D%27x%27%27%27"
    st, url, body, hdr = go(q4, timeout=120)
    print(f"   HTTP {st} byte={len(body)} type={hdr.get('Content-Type')}")

    print("\n== SEC-01d: parameter tidak dikenal (vendor/format lain) ==")
    q5 = q + "&format_options=callback:alert(1)&outputFormat=text/javascript"
    st, url, body, hdr = go(q5, timeout=120)
    print(f"   HTTP {st} byte={len(body)} type={hdr.get('Content-Type')}")

    print("\n== G6: hapus diri sendiri (fachri) ==")
    st, _, html, _ = go("/settings/users")
    tok = re.search(rb'name="_token"\s+value="([^"]+)"', html)
    tid = re.search(rb'deleteUser\((\d+)\)', html)
    uid = tid.group(1).decode() if tid else "30"
    st, url, body, _ = go(f"/settings/users/{uid}", {"_token": tok.group(1).decode(), "_method": "DELETE"})
    msg = re.search(rb"(Anda tidak dapat menghapus akun sendiri[^<]*|User berhasil dihapus[^<]*)", body)
    print(f"   DELETE /settings/users/{uid} -> HTTP {st} | {msg.group(1).decode() if msg else '(pesan tak terbaca)'}")

    print("\n== G5: hapus role yang masih dipakai ==")
    st, _, html, _ = go("/settings/roles")
    tok = re.search(rb'name="_token"\s+value="([^"]+)"', html).group(1).decode()
    st, url, body, _ = go("/settings/roles/1", {"_token": tok, "_method": "DELETE"})
    msg = re.search(rb"(Role tidak dapat dihapus[^<]*|Role berhasil dihapus[^<]*)", body)
    print(f"   -> HTTP {st} | {msg.group(1).decode() if msg else '(tak terbaca)'}")

    print("\n== SEC-09: limiter dua lapis ==")
    for i in range(1, 9):
        cj2 = http.cookiejar.CookieJar()
        op2 = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj2))
        st, _, h, _ = None, None, None, None
        try:
            with op2.open(BASE + "/login", timeout=30) as r:
                h = r.read()
        except Exception:  # noqa: BLE001
            pass
        t = re.search(rb'name="_token"\s+value="([^"]+)"', h).group(1).decode()
        data = urllib.parse.urlencode({"_token": t, "username": f"tebak{i}", "password": "x"}).encode()
        rq = urllib.request.Request(BASE + "/login", data=data)
        try:
            with op2.open(rq, timeout=60) as r:
                body = r.read()
        except urllib.error.HTTPError as e:
            body = e.read()
        msg = "ditolak" if b"Terlalu banyak" in body else "diproses"
        print(f"   percobaan {i}: {msg}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
