"""Diagnosa fitur pencarian pelanggan lewat tunnel."""
import http.cookiejar
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://tale-apartment-qui-spanking.trycloudflare.com"


def main():
    cj = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def go(path, data=None, timeout=90):
        body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
        r = urllib.request.Request(BASE + path, data=body)
        r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
        try:
            with op.open(r, timeout=timeout) as x:
                return x.status, x.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8", "replace")

    _, login = go("/login")
    tok = re.search(r'name="_token"\s+value="([^"]+)"', login).group(1)
    go("/login", {"_token": tok, "username": "fachri", "password": "password"})

    # persis seperti yang dikirim frontend
    print("== SEARCH 1: seperti frontend sekarang (strToUpperCase) ==")
    cql = "strToUpperCase(nama) LIKE '%HARDIMAN%' OR nolang LIKE '01010001%'"
    q = ("/geo-proxy?service=WFS&version=1.0.0&request=GetFeature"
         "&typeName=webgis:analisa_pelanggan&maxFeatures=10&outputFormat=application/json"
         "&cql_filter=" + urllib.parse.quote(cql))
    st, body = go(q)
    print(f"   HTTP {st} | {len(body)} byte")
    try:
        d = json.loads(body)
        print(f"   fitur: {len(d.get('features', []))}")
        if d.get("features"):
            print(f"   nama: {d['features'][0]['properties'].get('nama')}")
    except Exception:
        print(f"   BUKAN JSON: {body[:400]}")

    print("\n== SEARCH 2: tanpa strToUpperCase (ILIKE sederhana) ==")
    for cql2 in [
        "nama LIKE '%HARDIMAN%'",
        "nama ILIKE '%hardiman%'",
        "nolang LIKE '01010001%'",
    ]:
        q2 = ("/geo-proxy?service=WFS&version=1.0.0&request=GetFeature"
              "&typeName=webgis:analisa_pelanggan&maxFeatures=5&outputFormat=application/json"
              "&cql_filter=" + urllib.parse.quote(cql2))
        st2, body2 = go(q2)
        try:
            d2 = json.loads(body2)
            n = len(d2.get("features", []))
            ex = d2["features"][0]["properties"].get("nama") if n else "-"
            print(f"   [{cql2[:40]}] -> {n} fitur, contoh: {ex}")
        except Exception:
            print(f"   [{cql2[:40]}] -> bukan JSON: {body2[:200]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
