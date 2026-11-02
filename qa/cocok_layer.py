"""Cocokkan setiap layer yang direquest aplikasi vs daftar layer GeoServer."""
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

    # daftar layer dari GeoServer
    _, caps = go("/geo-proxy?service=WFS&version=1.0.0&request=GetCapabilities")
    tersedia = set(re.findall(r"<Name>webgis:([^<]+)</Name>", caps.decode("utf-8", "replace")))

    # layer yang diminta aplikasi
    import pathlib
    src = pathlib.Path("resources/js/gis/layers.js").read_text(encoding="utf-8")
    diminta = re.findall(r"createWMSLayer\('([^']+)'\)", src)

    # layer dari config aksesoris
    gis = pathlib.Path("config/gis.php").read_text(encoding="utf-8")
    aksesoris = re.findall(r"'(all_[a-z0-9_]+)'\s*=>", gis)

    semua = sorted(set(diminta) | set(aksesoris))
    print(f"Layer diminta aplikasi: {len(semua)}")
    print(f"Layer tersedia di GeoServer: {len(tersedia)}\n")

    hilang = []
    for n in semua:
        if n in tersedia:
            print(f"  OK    {n}")
        else:
            print(f"  HILANG {n}")
            hilang.append(n)

    print(f"\nTotal hilang: {len(hilang)} -> {hilang}")

    # layer berguna di GeoServer yang tidak dipakai aplikasi
    dipakai = set(semua)
    tidak_dipakai = sorted(tersedia - dipakai)
    print(f"\nLayer GeoServer tidak dipakai aplikasi ({len(tidak_dipakai)}):")
    for n in tidak_dipakai:
        print("  -", n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
