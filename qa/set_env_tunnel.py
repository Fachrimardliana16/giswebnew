"""Set konfigurasi .env untuk akses via tunnel Cloudflare (tanpa .env mati)."""
import pathlib
import re

ENV = pathlib.Path(".env")
URL = "https://tale-apartment-qui-spanking.trycloudflare.com"

SETTINGS = {
    "APP_URL": URL,
    "APP_DEBUG": "false",
    "TRUSTED_PROXIES": "*",
}

lines = ENV.read_text(encoding="utf-8").splitlines()
seen = set()
out = []

for line in lines:
    m = re.match(r"^([A-Z0-9_]+)=", line)
    if m and m.group(1) in SETTINGS:
        key = m.group(1)
        out.append(f"{key}={SETTINGS[key]}")
        seen.add(key)
    else:
        out.append(line)

for key, val in SETTINGS.items():
    if key not in seen:
        out.append(f"{key}={val}")

ENV.write_text("\n".join(out) + "\n", encoding="utf-8")

for key in SETTINGS:
    for ln in ENV.read_text(encoding="utf-8").splitlines():
        if ln.startswith(key + "="):
            print(ln)
