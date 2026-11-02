"""Lihat pesan ServiceException utuh untuk satu query GetFeature + cql_filter."""
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

    # 1. tanpa cql_filter sama sekali -> baseline
    print("=" * 70)
    print("A. GetFeature TANPA cql_filter (baseline)")
    q = ("/geo-proxy?service=WFS&version=1.0.0&request=GetFeature"
         "&typeName=webgis:analisa_pelanggan&maxFeatures=2&outputFormat=application/json")
    st, body = go(q)
    print(f"HTTP {st} | {len(body)} byte")
    print(body[:600])

    # 2. dengan cql_filter sederhana
    print("=" * 70)
    print("B. GetFeature DENGAN cql_filter = 'nama = HARDIMAN'")
    cql = "nama = 'HARDIMAN'"
    q2 = q + "&cql_filter=" + urllib.parse.quote(cql)
    st, body = go(q2)
    print(f"HTTP {st} | {len(body)} byte")
    print(body[:900])
    return 0


if __name__ == "__main__":
    sys.exit(main())
