"""Inventaris kontrol UI: mana yang punya handler JS, mana yang tidak."""
import pathlib
import re

BLADE_FILES = [
    "resources/views/partials/sidebar.blade.php",
    "resources/views/layouts/app.blade.php",
    "resources/views/dashboard.blade.php",
]

ids = set()
for f in BLADE_FILES:
    ids |= set(re.findall(r'id="([a-zA-Z0-9_]+)"', pathlib.Path(f).read_text(encoding="utf-8")))

js = ""
for f in pathlib.Path("resources/js").rglob("*.js"):
    js += f.read_text(encoding="utf-8")

js_ids = set(re.findall(r"getElementById\('([a-zA-Z0-9_]+)'\)", js))
js_ids |= set(re.findall(r"querySelector\('#([a-zA-Z0-9_]+)'\)", js))
js_ids |= set(re.findall(r'getElementById\("([a-zA-Z0-9_]+)"\)', js))
js_ids |= set(re.findall(r"\$\('#([a-zA-Z0-9_]+)'\)", js))

blade = ""
for f in pathlib.Path("resources/views").rglob("*.blade.php"):
    blade += f.read_text(encoding="utf-8")
onclick_ids = set(re.findall(r"getElementById\('([a-zA-Z0-9_]+)'\)", blade))

# id yang dibuat JS secara dinamis (toast-container, dst)
dinamis = {"toast-container", "zoomHint"}

diabaikan = {
    "map", "sidebar", "sidebarBackdrop", "profileContainer", "profileDropdown",
    "profileToggle", "loadingIndicator", "baseMapIcon", "locationIcon",
    "pelanggan", "jaringan", "jaringan_pipa", "aksesoris",
    "modal-add-user", "addUserModal", "editUserModal", "addRoleModal", "editRoleModal",
}
diabaikan |= dinamis

tidak_dipakai = sorted(ids - js_ids - onclick_ids - diabaikan)

print(f"Total id di blade    : {len(ids)}")
print(f"Ditangani JS         : {len((js_ids | onclick_ids) & ids)}")
print(f"Diabaikan (wadah/ID) : {len(diabaikan & ids)}")
print()
print("TANPA handler JS (kandidat mati):")
for i in tidak_dipakai:
    print("  -", i)

print()
print("ID yang dipakai JS tapi TIDAK ADA di blade (handler yatim):")
for i in sorted(js_ids - ids):
    print("  -", i)
