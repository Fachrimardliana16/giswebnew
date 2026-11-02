"""Pindahkan #profileDropdown keluar dari #profileContainer agar bisa dipakai tab Akun mobile."""
import pathlib
import re

p = pathlib.Path("resources/views/layouts/app.blade.php")
s = p.read_text(encoding="utf-8")

# 1. Ambil blok dropdown utuh
m = re.search(
    r"\n\s*<!-- Dropdown Menu -->\n\s*<div id=\"profileDropdown\".*?\n\s*</div>\n(\s*)</div>\n\s*@endauth",
    s, flags=re.S,
)
if not m:
    print("GAGAL: blok dropdown tidak ditemukan")
    raise SystemExit(1)

blok = m.group(0)
# 2. Buang dari posisi lama
s = s.replace(blok, "\n            </div>\n            @endauth", 1)

# 3. Ambil isi dropdown saja (tanpa komentar + pembungkus)
inner = re.search(r"<div id=\"profileDropdown\".*?</div>\n\s*</div>", blok, flags=re.S)
if not inner:
    print("GAGAL: isi dropdown tidak terbaca")
    raise SystemExit(1)
dropdown_html = inner.group(0).rsplit("</div>", 1)[0]  # buang penutup container

# 4. Sisipkan dropdown di level body (setelah @endauth penutup header)
anchor = "            @endauth\n        </div>\n    </header>"
if anchor not in s:
    print("GAGAL: anchor header tidak ditemukan")
    raise SystemExit(1)

sisip = (
    "            @endauth\n"
    "        </div>\n"
    "    </header>\n\n"
    "    @auth\n"
    "    {{-- Dropdown profil dipakai desktop (dropdown) dan mobile (bottom sheet) --}}\n"
    + dropdown_html.replace('<div id="profileDropdown" class="absolute top-full',
                            '<div id="profileDropdown" class="hidden md:absolute md:top-full')
    + "    @endauth"
)
s = s.replace(anchor, sisip, 1)
p.write_text(s, encoding="utf-8")

print("dropdown dipindah keluar header")
print("jumlah id profileDropdown:", s.count('id="profileDropdown"'))
print("jumlah id profileContainer:", s.count('id="profileContainer"'))
