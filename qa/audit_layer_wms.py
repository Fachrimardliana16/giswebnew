"""Cek apakah tile WMS yang 0-byte itu kosong (wajar) atau error (bug)."""
import http.cookiejar
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"

# bbox Purbolinggo / area dashboard default
BBOX_4326 = "109.30,-7.45,109.42,-7.33"


def main():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, timeout=90):
        try:
            with op.open(BASE + path, timeout=timeout) as x:
                return x.status, x.read(), dict(x.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.read(), dict(e.headers)

    _, login, _ = go("/login")
    tok = re.search(rb'name="_token"\s+value="([^"]+)"', login).group(1).decode()
    data = urllib.parse.urlencode({"_token": tok, "username": "fachri", "password": "password"}).encode()
    r = urllib.request.Request(BASE + "/login", data=data)
    op.open(r, timeout=60)

    LAYERS = {
        "analisa_pelanggan": "webgis:analisa_pelanggan",
        "web_pipa": "webgis:web_pipa",
        "monitoring_pengaduan": "webgis:monitoring_pengaduan",
        "all_airvalve": "webgis:all_airvalve",
        "all_gatevalve": "webgis:all_gatevalve",
        "all_firehydrant": "webgis:all_firehydrant",
        "all_bend": "webgis:all_bend",
        "all_tee": "webgis:all_tee",
        "all_prv": "webgis:all_prv",
        "all_meterinduk": "webgis:all_meterinduk",
        "all_titik_tekanan": "webgis:all_titik_tekanan",
        "all_washout1": "webgis:all_washout1",
        "all_dop": "webgis:all_dop",
        "all_checkvalve": "webgis:all_checkvalve",
        "all_reducer": "webgis:all_reducer",
        "all_strainer": "webgis:all_strainer",
    }

    print(f"{'layer':22} {'HTTP':5} {'byte':>7}  jenis")
    print("-" * 60)

    for nama, qname in LAYERS.items():
        q = (f"/geo-proxy?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png"
             f"&TRANSPARENT=true&LAYERS={qname}&SRS=EPSG:4326&WIDTH=512&HEIGHT=512"
             f"&BBOX={BBOX_4326}&STYLES=")
        st, body, hdr = go(q)
        ct = hdr.get("Content-Type", "?")
        if body[:4] == b"\x89PNG":
            # PNG valid: cek apakah benar-benar transparan/kosong
            jenis = f"PNG ({len(body)} B)"
            if len(body) < 600:
                jenis += " <- kemungkinan kosong"
        elif b"ServiceException" in body:
            m = re.search(rb"<ServiceException[^>]*>(.{0,120})", body, re.S)
            jenis = "ERROR: " + (m.group(1).decode("utf-8", "replace").strip() if m else "?")[:90]
        else:
            jenis = "bukan PNG: " + body[:60].decode("utf-8", "replace")
        print(f"{nama:22} {st:<5} {len(body):>7}  {jenis}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
