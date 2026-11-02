# 03 — HASIL PERBAIKAN

**Tanggal:** 2 Nov 2026
**Commit:** `c89e39a` (baseline `87f7b16`, upstream `d9d5d6d`)
**Lingkungan uji:** `http://127.0.0.1:8124`

---

## Ringkasan

| Item | Sebelum | Sesudah | Status |
|------|---------|---------|--------|
| Laravel | 11.51.0 | **13.39.0** | ✅ |
| PHP | 8.5.12 | 8.5.12 (sudah terbaru) | ✅ |
| Advisory CVE | 44 di 12 paket | **0** | ✅ |
| WFS dump data pelanggan | 44.609.185 byte | **26.664 byte, maks 50 fitur** | ✅ |
| Security header | 0 | **5 header + CSP** | ✅ |
| Password di session | ya | **tidak** | ✅ |
| Otorisasi admin | whitelist username ×3 | **role + permission (1 sumber)** | ✅ |
| Self-delete | diizinkan | **ditolak** | ✅ |
| Rate limit login | 1 lapis (mudah bypass) | **2 lapis (kredensial + IP)** | ✅ |
| Tombol tanpa nama aksesibel | 5 + 35 + 47 | **0 + 0 + 0** | ✅ |
| Leaflet di halaman admin | ya (~150 KB) | **tidak** | ✅ |
| Tailwind Play CDN di /login | ya (~400 KB JIT) | **bundle Vite 10 KB gzip** | ✅ |
| Kode mati | 220 LOC + fungsi tak terpanggil | **dihapus / diaktifkan** | ✅ |

---

## 1. Upgrade PHP & Laravel

**PHP:** diverifikasi terhadap `downloads.php.net/~windows/releases/releases.json` — branch 8.5 terbaru = **8.5.12-1**, dan host sudah memakai **8.5.12**. Tidak ada versi lebih baru. Syarat Laravel 13 (`php: ^8.3`) terpenuhi.

**Laravel:** `v11.51.0` → `v13.39.0` (lompat 2 major).

Paket yang harus naik bersama (kalau tidak, composer menolak resolusi):
- `laravel/tinker` 2.11.1 → 3.0.2 (v2 mengunci `illuminate/support ≤12`)
- `phpunit/phpunit` 11.5.55 → 13.4.5
- `laravel/pint`, `laravel/sail`, `laravel/pail`

**Audit dependensi:**
```
sebelum: Found 44 security vulnerability advisories affecting 12 packages.
sesudah: No security vulnerability advisories found.
```

**Satu test gagal** — `tests/Feature/ExampleTest.php`, bukan regresi:
```php
$response = $this->get('/');
$response->assertStatus(200);   // padahal '/' memang redirect ke /login
```
Test bawaan Laravel ini salah sejak awal. Perlu diperbaiki menjadi `assertRedirect('/login')`, tapi belum saya ubah karena berada di luar izin perbaikan yang diminta.

---

## 2. Keamanan

### SEC-01 — Kebocoran data pelanggan: **TERTUTUP**

`app/Http/Controllers/GeoServerProxyController.php` ditulis ulang:

- **Allowlist parameter** — hanya 22 parameter dikenal yang diteruskan; sisanya dibuang.
- **`maxFeatures` dipaksa**: klien minta `99999999` → server tetap mengirim 50.
- **Whitelist kolom** `propertyName`: 20 kolom. Permintaan `propertyName=geom` diabaikan, klien menerima whitelist.
- **`width`/`height` > 4096** → HTTP 413.
- **`cql_filter`** di-escape (`'` → `''`) + batas 1000 karakter.

Bukti:
```
sebelum: HTTP 200 | 44.609.185 byte | JSON ribuan fitur
sesudah: HTTP 200 |     26.664 byte | JSON 50 fitur, 20 kolom
         maxFeatures=99999999 -> tetap 50 fitur
         propertyName=geom    -> diabaikan
```

**Catatan penting:** whitelist awal saya salah nama kolom (`tungg_rp_tagihan`), dan GeoServer menolak seluruh request dengan `InvalidParameterValue`. Pesan error GeoServer yang menyebutkan daftar kolom valid itulah yang dipakai untuk mengoreksi daftar — bukan tebakan. Ini contoh kenapa verifikasi eksekusi wajib.

### SEC-02 — Password di session: **DIHAPUS**

`session(['pgsql_user' => ..., 'pgsql_pass' => ...])` dihapus dari `PgsqlUserProvider::validateCredentials()`.

### SEC-03 — Verifikasi login: **DIPERBAIKI**

```php
$pdo = new PDO($dsn, $username, $password, [...]);
$statement = $pdo->prepare(
    'SELECT 1 FROM pg_roles WHERE rolname = :name AND rolcanlogin LIMIT 1'
);
$statement->execute(['name' => $username]);
$valid = (bool) $statement->fetchColumn();
$statement = null;
$pdo = null;
```
Host/port/db dibaca dari `config('database.connections.pgsql.*')`, tanpa default IP di dalam kode.

**Status cakupan:** jalur ini **tidak menyala** di lingkungan uji karena `DB_CONNECTION=sqlite` dan guard `web` memakai provider `eloquent`. Yang terverifikasi adalah sintaks, penghapusan session password, dan pembacaan config — bukan keberhasilan autentikasi psql nyata. Untuk itu perlu PostgreSQL produksi.

### SEC-04 / SEC-05 — Proxy: **DIPERBAIKI**

- `verify => false` diganti `config('gis.geoserver_verify_tls', true)` (default **true**).
- `catch` tidak lagi mengirim `$e->getMessage()` ke klien: klien dapat `'Proxy gagal memproses permintaan'` + status 502; detail hanya ke log.
- Log tidak lagi menulis `$request->query()` utuh (sebelumnya menulis koordinat & filter ke log).

### SEC-06 — Otorisasi: **SATU SUMBER KEBENARAN**

Dihapus dari 3 tempat (`AdminAccessMiddleware`, `UserController::bulkDestroy`, `sidebar.blade.php`). Pengganti:

```php
// app/Models/User.php
public function isAdmin(): bool
{
    $role = $this->role;
    if (! $role) return false;
    if ($role->name === self::ADMIN_ROLE) return true;
    return (bool) array_intersect(self::ADMIN_PERMISSIONS, $role->permissions ?? []);
}
```
Middleware memakai `$user->isAdmin()`; blade memakai `auth()->user()->isAdmin()`.

Efek samping yang ikut beres: `pdamadmin` dan `postgres` (role `admin` di DB) sekarang **bisa** masuk panel admin, padahal sebelumnya ditolak karena namanya tidak ada di whitelist. Kolom `roles.permissions` yang tadinya 0 pembaca sekarang berfungsi.

Diverifikasi tidak melonggar:
```
suyadi (role 'user')  GET  /settings/users -> 302 /dashboard
                      GET  /settings/roles -> 302 /dashboard
                      POST /settings/users -> 302 /dashboard (0 baris dibuat)
```

### SEC-07 — Header keamanan: **TERPASANG**

`app/Http/Middleware/SecurityHeaders.php`, didaftarkan global di `bootstrap/app.php`:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=()
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.tile.openstreetmap.org https://mt1.google.com https://cdn-icons-png.flaticon.com;
  connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: (hanya saat request secure)
```
`script-src` **tanpa** `'unsafe-inline'` → semua `onclick=` di blade dipertahankan karena memakai atribut (bukan inline script), dan script watchdog dashboard tetap jalan. Halaman dashboard diuji render normal setelah CSP aktif.

### SEC-08 — Seeder: **AMAN**

- Dibatasi `if (! app()->environment('local','testing')) return;`
- Satu password acak 16 karakter per eksekusi (`Str::password`), dicetak sekali ke console — bukan `Hash::make('password')` untuk 126 akun.

⚠️ **Rotasi produksi masih wajib.** Akun yang sudah ada di DB produksi dengan password `password` tidak berubah oleh perubahan kode ini.

### SEC-09 — Rate limiter: **DUA LAPIS**

```php
$credentialKey = 'login:cred:'.mb_strtolower($username).'|'.$ip;  // 5 / menit
$ipKey         = 'login:ip:'.$ip;                                  // 30 / menit
```
Bukti:
```
username sama, 8x salah : diproses ×5, DITOLAK ×3   (trip di percobaan ke-6)
username beda, 35x      : 10/35 DITOLAK              (trip di percobaan ke-29)
```
Plus `trustProxies` di `bootstrap/app.php` supaya `$request->ip()` mengembalikan IP klien asli di belakang Cloudflare.

### SEC-11 — `cql_filter`: **DI-ESCAPE**

Kutip tunggal digandakan + batas panjang. `LOV` dropdown tetap aman seperti sebelumnya.

---

## 3. Aturan bisnis

### G6 — Self-delete: **DITOLAK**

```php
public function destroy(User $user)
{
    if ($this->isSelf($user))      return back()->with('error', 'Anda tidak dapat menghapus akun sendiri.');
    if ($this->isLastAdmin($user)) return back()->with('error', 'Tidak dapat menghapus admin terakhir.');
    ...
}
```
Bukti:
```
[1] DELETE /settings/users/128 (diri sendiri) -> "Anda tidak dapat menghapus akun sendiri."
[2] DELETE /settings/users/2   (orang lain)   -> "User berhasil dihapus."
[3] POST bulk-delete [128]                    -> "Tidak ada user yang dapat dihapus (akun sendiri atau admin terakhir)."
```

Tambahan aturan baru yang sebelumnya tidak ada:
- `update()` menolak menurunkan role **admin terakhir** (mencegah sistem terkunci).
- `bulkDestroy()` kini membuang diri sendiri dan admin terakhir, bukan hanya mencocokkan username.
- Pencarian user meng-escape `%` dan `_` (wildcard LIKE tidak bisa disalahgunakan).
- Sort tetap allowlist (`name`, `username`, `created_at`).

---

## 4. Tampilan & aksesibilitas

Metode: Chrome headless via CDP, menghitung `button` yang tidak punya `innerText`, `aria-label`, `title`, atau `aria-labelledby`.

| Halaman | Tombol total | Tanpa nama (sebelum) | Tanpa nama (sesudah) |
|---------|--------------|----------------------|----------------------|
| `/dashboard` | 16 | 5 | **0** |
| `/settings/users` | 53 | 35 | **0** |
| `/settings/roles` | 64 | 47 | **0** |

Yang ditambahkan: `aria-label` pada tombol edit/hapus per baris (menyebut username/role), tombol tutup 4 modal, toggle sidebar, toggle pencarian mobile, tombol bersihkan pencarian, toggle basemap, tombol lokasi saya.

**Tombol aksi tabel** tidak lagi `opacity-0 group-hover:opacity-100` → `opacity-60 group-hover:opacity-100 focus-within:opacity-100`. Sebelumnya tombol edit/hapus **tidak pernah muncul** di layar sentuh dan tidak reachable keyboard.

---

## 5. Performa

| Item | Sebelum | Sesudah |
|------|---------|---------|
| Tailwind di `/login` | Play CDN (~400 KB JIT di browser) | bundle Vite, **10,08 KB gzip** |
| Leaflet di halaman admin | js + css dari CDN | **tidak dimuat** |
| CSS global transition | `all` termasuk `transform` | hanya warna/border/shadow |
| `eventManager.js` | 220 LOC, 0 pemakai | dihapus |
| `setupMapZoomHandler()` | didefinisikan, tak dipanggil | aktif dipanggil |
| Bundle JS | 61,47 KB (22,47 gzip) | 61,91 KB (22,64 gzip) — naik 0,17 KB karena zoom handler aktif |

Verifikasi pemisahan aset:
```
halaman      leaflet.js  leaflet.css  jquery  vite-css
dashboard    True        True         True    True
users        False       False        True    True
roles        False       False        True    True
```

**Belum dioptimasi (sengaja):** jQuery dan Leaflet masih dari CDN, belum di-bundle — memindahkannya ke Vite mengubah cara `app.js` memanggil `L`/`$` dan butuh pengujian peta menyeluruh. Tailwind juga masih butuh `'unsafe-inline'` pada `style-src` karena Leaflet menulis atribut `style` inline.

---

## 6. Yang BELUM dikerjakan

| # | Item | Alasan |
|---|------|--------|
| 1 | Tutup port `36.93.220.245:9191` dari internet | **butuh akses firewall server**, bukan perubahan kode. Ini risiko terbesar yang tersisa. |
| 2 | Rotasi password 126 akun produksi | butuh keputusan operator; perubahan seeder tidak menyentuh data lama |
| 3 | "Ingat saya" | sudah dikirim ke `Auth::attempt($creds, remember)` — **perlu diuji ulang**, cookie belum muncul di probe |
| 4 | "Lupa Password?" & "Profil Saya" | masih `href="#"`, route belum ada. Perlu keputusan: bangun atau hapus dari UI |
| 5 | `tests/Feature/ExampleTest.php` | test bawaan salah (assert 200 untuk route yang redirect) |
| 6 | Test suite untuk otorisasi/CRUD | belum ditulis; perbaikan saat ini diverifikasi lewat probe HTTP, bukan PHPUnit |
| 7 | Bundle jQuery + Leaflet ke Vite | risiko regresi peta, butuh sesi uji tersendiri |
| 8 | `PgsqlUserProvider` diverifikasi end-to-end | butuh PostgreSQL dengan role nyata |

---

## 7. Cara reproduksi verifikasi

```bash
cd D:/Projects/webgisupdate
php artisan serve --host=127.0.0.1 --port=8124

python qa/verify_perbaikan.py   # SEC-01, SEC-11
python qa/verify_g6b.py         # G6 self-delete + hapus orang lain + bulk
python qa/verify_limiter.py     # 2 lapis rate limiter
python qa/verify_labels.py      # aria-label per halaman (butuh Chrome :9333)
python qa/verify_aset.py        # pemisahan Leaflet dashboard vs admin

composer audit --format=summary # harus "No security vulnerability advisories found"
```
