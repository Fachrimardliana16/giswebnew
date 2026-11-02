"""Uji: apakah tile WMS masih ada isinya di zoom tinggi?"""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"


def main():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, timeout=90):
        try:
            with op.open(BASE + path, timeout=timeout) as x:
                return x.status, x.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    _, login = go("/login")
    tok = re.search(rb'name="_token"\s+value="([^"]+)"', login).group(1).decode()
    data = urllib.parse.urlencode({"_token": tok, "username": "fachri", "password": "password"}).encode()
    op.open(urllib.request.Request(BASE + "/login", data=data), timeout=60)

    # titik pelanggan diketahui: lat -7.3859, lng 109.3589
    lat, lng = -7.3859, 109.3589

    def bbox(zoom):
        # perkiraan lebar derajat per tile 256px di lintang ini
        import math
        deg_per_tile = 360.0 / (2 ** zoom)
        d = deg_per_tile * 0.7
        return f"{lng-d},{lat-d},{lng+d},{lat+d}"

    print(f"{'zoom':>5} {'byte':>8}  jenis")
    print("-" * 55)
    for z in [10, 12, 14, 16, 18, 19, 20, 22]:
        q = ("/geo-proxy?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png"
             f"&TRANSPARENT=true&LAYERS=webgis:analisa_pelanggan&SRS=EPSG:4326"
             f"&WIDTH=256&HEIGHT=256&BBOX={bbox(z)}&STYLES=")
        st, body = go(q)
        if body[:4] == b"\x89PNG":
            jenis = f"PNG {len(body)}B"
            if len(body) < 1500:
                jenis += " <- kemungkinan KOSONG"
        elif b"ServiceException" in body:
            m = re.search(rb"<ServiceException[^>]*>(.{0,120})", body, re.S)
            jenis = "ERROR: " + (m.group(1).decode("utf-8", "replace").strip()[:90] if m else "?")
        else:
            jenis = body[:70].decode("utf-8", "replace")
        print(f"{z:>5} {len(body):>8}  {jenis}")

    # cek maxZoom yang diizinkan GeoServer untuk layer ini
    _, caps = go("/geo-proxy?service=WMS&version=1.1.1&request=GetCapabilities")
    teks = caps.decode("utf-8", "replace")
    m = re.search(r"<Name>webgis:analisa_pelanggan</Name>.{0,3000}?</Layer>", teks, re.S)
    if m:
        blok = m.group(0)
        zooms = re.findall(r"<ZoomLevel>(\d+)</ZoomLevel>|maxScaleDenominator>([^<]+)<", blok)
        print("\nInfo layer analisa_pelanggan (potongan):")
        for line in blok.split("\n"):
            if any(k in line for k in ("MaxScale", "MinScale", "SRS", "Title", "Zoom")):
                print("   ", line.strip()[:120])
    return 0


if __name__ == "__main__":
    sys.exit(main())
