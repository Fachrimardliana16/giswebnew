"""Bongkar kenapa POST /settings/users oleh non-admin balas 200 tanpa efek."""
import http.cookiejar
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8123"


class NR(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), NR())


def go(path, data=None, headers=None):
    body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
    r = urllib.request.Request(BASE + path, data=body)
    r.add_header("User-Agent", "Mozilla/5.0 Chrome/120")
    r.add_header("Accept", "text/html,application/xhtml+xml")
    for k, v in (headers or {}).items():
        r.add_header(k, v)
    try:
        with op.open(r, timeout=70) as resp:
            return resp.status, resp.headers.get("Location", ""), resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location", ""), e.read().decode("utf-8", "replace")


st, url, html = go("/login")
tok = re.search(r'name="_token"\s+value="([^"]+)"', html).group(1)
st, loc, html = go("/login", {"_token": tok, "username": "suyadi", "password": "password"})
print("login:", st, loc)

xsrf = next((urllib.parse.unquote(c.value) for c in cj if c.name == "XSRF-TOKEN"), None)
print("xsrf:", "ADA" if xsrf else "TIDAK ADA")

st, loc, body = go("/settings/users", {"username": "probe_esc2", "name": "PE2",
                                       "password": "rahasia123", "role_id": "1"},
                   headers={"X-XSRF-TOKEN": xsrf})
print("POST create ->", st, "loc=", loc)

st, loc, dash = go("/dashboard")
print("GET /dashboard ->", st, "len", len(dash))
if st == 302:
    print("  redirect ke:", loc)

st, loc, users = go("/settings/users")
print("GET /settings/users ->", st, "loc=", loc, "len", len(users))

st, loc, roles = go("/settings/roles")
print("GET /settings/roles ->", st, "loc=", loc, "len", len(roles))
