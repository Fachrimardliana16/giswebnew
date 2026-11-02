"""Tambah aria-label pada tombol ikon yang tersisa."""
import pathlib

JOBS = {
    "resources/views/dashboard/users/index.blade.php": [
        (
            "<button onclick=\"document.getElementById('addUserModal').classList.add('hidden')\" class=\"text-slate-400 hover:text-slate-600\">",
            "<button onclick=\"document.getElementById('addUserModal').classList.add('hidden')\" aria-label=\"Tutup dialog tambah user\" class=\"text-slate-400 hover:text-slate-600\">",
        ),
        (
            "<button onclick=\"document.getElementById('editUserModal').classList.add('hidden')\" class=\"text-slate-400 hover:text-slate-600\">",
            "<button onclick=\"document.getElementById('editUserModal').classList.add('hidden')\" aria-label=\"Tutup dialog edit user\" class=\"text-slate-400 hover:text-slate-600\">",
        ),
    ],
    "resources/views/dashboard/roles/index.blade.php": [
        (
            "<button onclick=\"document.getElementById('addRoleModal').classList.add('hidden')\" class=\"text-slate-400 hover:text-slate-600\">",
            "<button onclick=\"document.getElementById('addRoleModal').classList.add('hidden')\" aria-label=\"Tutup dialog tambah role\" class=\"text-slate-400 hover:text-slate-600\">",
        ),
        (
            "<button onclick=\"document.getElementById('editRoleModal').classList.add('hidden')\" class=\"text-slate-400 hover:text-slate-600\">",
            "<button onclick=\"document.getElementById('editRoleModal').classList.add('hidden')\" aria-label=\"Tutup dialog edit role\" class=\"text-slate-400 hover:text-slate-600\">",
        ),
    ],
    "resources/views/layouts/app.blade.php": [
        (
            '<button id="sidebarToggle" class="p-2.5 rounded-2xl text-white bg-white/10 md:hidden',
            '<button id="sidebarToggle" aria-label="Buka menu navigasi" aria-controls="sidebar" class="p-2.5 rounded-2xl text-white bg-white/10 md:hidden',
        ),
        (
            '<button id="clearSearch" class="p-2 text-slate-300 hover:text-red-500 hidden',
            '<button id="clearSearch" aria-label="Bersihkan pencarian" class="p-2 text-slate-300 hover:text-red-500 hidden',
        ),
        (
            '<button id="mobileSearchToggle" class="md:hidden p-2.5 text-white/80',
            '<button id="mobileSearchToggle" aria-label="Buka pencarian" aria-controls="mobileSearchContainer" class="md:hidden p-2.5 text-white/80',
        ),
    ],
    "resources/views/dashboard.blade.php": [
        (
            '<button id="baseMapToggle" class="flex items-center',
            '<button id="baseMapToggle" aria-label="Ganti tampilan peta" class="flex items-center',
        ),
        (
            '<button id="getLocationBtn" class="flex items-center',
            '<button id="getLocationBtn" aria-label="Tampilkan lokasi saya" class="flex items-center',
        ),
    ],
}

for path, pairs in JOBS.items():
    p = pathlib.Path(path)
    s = p.read_text(encoding="utf-8")
    changed = 0
    for old, new in pairs:
        if old in s:
            s = s.replace(old, new)
            changed += 1
    p.write_text(s, encoding="utf-8")
    print(f"{path}: {changed}/{len(pairs)} diganti")
