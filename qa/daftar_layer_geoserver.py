"""Daftar layer yang benar-benar ada di GeoServer webgis."""
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

    st, body = go("/geo-proxy?service=WFS&version=1.0.0&request=GetCapabilities")
    text = body.decode("utf-8", "replace")
    print(f"GetCapabilities: HTTP {st}, {len(body)} byte")

    names = sorted(set(re.findall(r"<Name>([^<]+)</Name>", text)))
    print(f"\nLayer tersedia ({len(names)}):")
    for n in names:
        print("  -", n)

    washout = [n for n in names if "wash" in n.lower()]
    print(f"\nLayer mirip 'washout': {washout}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
