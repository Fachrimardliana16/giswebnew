"""Probe /geo-proxy: SSRF, DoS tanpa parameter, kebocoran error, ukuran respons."""
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8123"


def hit(path, method="GET", data=None, headers=None, timeout=90):
    r = urllib.request.Request(BASE + path, data=data, method=method)
    for k, v in (headers or {}).items():
        r.add_header(k, v)
    t0 = time.time()
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            body = resp.read()
            return resp.status, len(body), body[:300], resp.headers.get("Content-Type"), (time.time() - t0) * 1000
    except urllib.error.HTTPError as e:
        body = e.read()
        return e.code, len(body), body[:300], e.headers.get("Content-Type"), (time.time() - t0) * 1000
    except Exception as e:  # noqa: BLE001
        return "ERR", 0, repr(e).encode(), None, (time.time() - t0) * 1000


print("== P1. /geo-proxy TANPA parameter (tanpa auth -> harus 302) ==")
print("   ", hit("/geo-proxy"))

print("\n== P2. /geo-proxy dengan parameter lengkap, TANPA auth ==")
q = ("?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true"
     "&LAYERS=webgis:web_pipa&SRS=EPSG:4326&WIDTH=2560&HEIGHT=2560"
     "&BBOX=109.2,-7.6,109.7,-7.1&STYLES=")
print("   ", hit("/geo-proxy" + q))

print("\n== P3. DoS: REQUEST=GetMap WIDTH/HEIGHT raksasa (jika auth dilewati) ==")
q2 = ("?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true"
      "&LAYERS=webgis:analisa_pelanggan&SRS=EPSG:4326&WIDTH=20000&HEIGHT=20000"
      "&BBOX=109.2,-7.6,109.7,-7.1&STYLES=")
print("   ", hit("/geo-proxy" + q2, timeout=120))

print("\n== P4. SSRF: coba arahkan ke host lain lewat parameter (targetUrl dari config, bukan input) ==")
print("   target ditentukan config('gis.geoserver_url') -> tidak bisa dikendalikan klien")
print("   tapi query diteruskan mentah: uji injeksi '&' + 'service=WFS'")
print("   ", hit("/geo-proxy?service=WFS&request=GetCapabilities&version=1.0.0"))

print("\n== P5. Cek upstream asli hidup? (36.93.220.245:8080) ==")
import socket
for host, port in [("36.93.220.245", 8080), ("36.93.220.245", 9191)]:
    s = socket.socket()
    s.settimeout(6)
    t0 = time.time()
    try:
        s.connect((host, port))
        print(f"   {host}:{port} TERBUKA ({(time.time()-t0)*1000:.0f} ms)")
    except Exception as e:  # noqa: BLE001
        print(f"   {host}:{port} TERTUTUP/timeout: {e}")
    finally:
        s.close()
