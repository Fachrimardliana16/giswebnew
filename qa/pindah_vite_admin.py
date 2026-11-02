"""Pindahkan @vite admin ke section admin-assets (jangan di bawah)."""
import pathlib

FILES = [
    "resources/views/dashboard/users/index.blade.php",
    "resources/views/dashboard/roles/index.blade.php",
]

for f in FILES:
    p = pathlib.Path(f)
    s = p.read_text(encoding="utf-8")

    # buang @vite lama di bagian bawah
    s = s.replace("\n@vite(['resources/js/admin.js'])\n", "\n")

    # sisipkan section setelah @extends
    if "@section('admin-assets')" not in s:
        s = s.replace(
            "@extends('layouts.app')",
            "@extends('layouts.app')\n\n"
            "@section('admin-assets')\n"
            "    @vite(['resources/js/admin.js'])\n"
            "@endsection",
            1,
        )

    p.write_text(s, encoding="utf-8")
    print(f"{f}: section={'@section(' + chr(39) + 'admin-assets' + chr(39) + ')' in s}, "
          f"jumlah admin.js={s.count('admin.js')}")
