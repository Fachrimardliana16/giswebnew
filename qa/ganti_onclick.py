"""Ganti onclick= inline di halaman admin dengan data-* (CSP memblokir inline)."""
import pathlib
import re

USERS = pathlib.Path("resources/views/dashboard/users/index.blade.php")
ROLES = pathlib.Path("resources/views/dashboard/roles/index.blade.php")

# pasangan: (pola regex, pengganti)
RULES = [
    # tombol buka modal
    (r'onclick="document\.getElementById\(\'addUserModal\'\)\.classList\.remove\(\'hidden\'\)"',
     'data-modal-open="addUserModal"'),
    (r'onclick="document\.getElementById\(\'editUserModal\'\)\.classList\.remove\(\'hidden\'\)"',
     'data-modal-open="editUserModal"'),
    (r'onclick="document\.getElementById\(\'addRoleModal\'\)\.classList\.remove\(\'hidden\'\)"',
     'data-modal-open="addRoleModal"'),
    (r'onclick="document\.getElementById\(\'editRoleModal\'\)\.classList\.remove\(\'hidden\'\)"',
     'data-modal-open="editRoleModal"'),
    # tombol tutup modal
    (r'onclick="document\.getElementById\(\'addUserModal\'\)\.classList\.add\(\'hidden\'\)"',
     'data-modal-close="addUserModal"'),
    (r'onclick="document\.getElementById\(\'editUserModal\'\)\.classList\.add\(\'hidden\'\)"',
     'data-modal-close="editUserModal"'),
    (r'onclick="document\.getElementById\(\'addRoleModal\'\)\.classList\.add\(\'hidden\'\)"',
     'data-modal-close="addRoleModal"'),
    (r'onclick="document\.getElementById\(\'editRoleModal\'\)\.classList\.add\(\'hidden\'\)"',
     'data-modal-close="editRoleModal"'),
]

# baris tabel: editUser(...) / deleteUser(...)
RULES += [
    (r'onclick="editUser\(\{\{ json_encode\(\$user\) \}\}\)"',
     'data-user-edit=\'{{ json_encode($user, JSON_HEX_APOS | JSON_HEX_QUOT) }}\''),
    (r'onclick="deleteUser\(\{\{ \$user->id \}\}\)"',
     'data-user-delete="{{ $user->id }}"'),
    (r'onclick="editRole\(\{\{ json_encode\(\$role\) \}\}\)"',
     'data-role-edit=\'{{ json_encode($role, JSON_HEX_APOS | JSON_HEX_QUOT) }}\''),
    (r'onclick="deleteRole\(\{\{ \$role->id \}\}\)"',
     'data-role-delete="{{ $role->id }}"'),
]

# bulkDelete()
RULES += [
    (r'onclick="bulkDelete\(\)"', 'data-bulk-delete'),
]

for path in (USERS, ROLES):
    s = path.read_text(encoding="utf-8")
    n = 0
    for pat, rep in RULES:
        s, k = re.subn(pat, rep, s)
        n += k
    path.write_text(s, encoding="utf-8")
    print(f"{path.name}: {n} onclick diganti")

# sisa
for path in (USERS, ROLES):
    s = path.read_text(encoding="utf-8")
    sisa = re.findall(r'onclick="[^"]{0,80}', s)
    print(f"{path.name}: sisa onclick -> {len(sisa)}")
    for x in sisa:
        print("   ", x)
