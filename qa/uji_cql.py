"""Cari sintaks CQL yang benar-benar didukung GeoServer untuk pencarian nama."""
import http.cookiejar
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8124"

VARIANTS = [
    ("strToUpperCase + LIKE", "strToUpperCase(nama) LIKE '%HARDIMAN%'"),
    ("LIKE polos", "nama LIKE '%HARDIMAN%'"),
    ("ILIKE", "nama ILIKE '%hardiman%'"),
    ("upper() fungsi", "upper(nama) LIKE '%HARDIMAN%'"),
    ("strToUpperCase eq", "strToUpperCase(nama) = 'HARDIMAN'"),
    ("= persis", "nama = 'HARDIMAN'"),
    ("nolang LIKE", "nolang LIKE '01010001%'"),
    ("OR gabungan", "nama LIKE '%HARDIMAN%' OR nolang LIKE '01010001%'"),
]


def main():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, timeout=90):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        try:
            with op.open(r, timeout=timeout) as x:
                return x.status, x.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8", "replace")

    _, login = go("/login")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', login).group(1)
    go("/login", {"_token": tok, "username": "fachri", "password": "password"})

    for label, cql in VARIANTS:
        q = ("/geo-proxy?service=WFS&version=1.0.0&request=GetFeature"
             "&typeName=webgis:analisa_pelanggan&maxFeatures=3&outputFormat=application/json"
             "&cql_filter=" + urllib.parse.quote(cql))
        st, body = go(q)
        try:
            d = json.loads(body)
            n = len(d.get("features", []))
            ex = d["features"][0]["properties"].get("nama") if n else "-"
            print(f"[OK ] {label:24} -> {n} fitur, contoh: {ex}")
        except Exception:
            m = re.search(r"Encountered:\s*&?q?u?o?t?;?([^<]{0,60})", body)
            err = m.group(1).strip()[:60] if m else body[:80].replace("\n", " ")
            print(f"[ERR] {label:24} -> {err}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
